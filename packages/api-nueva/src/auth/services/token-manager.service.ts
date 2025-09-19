import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import {
  TokenPayload,
  RefreshTokenPayload,
  ResetTokenPayload,
  TokenResponse,
  TokenValidationResult,
  PlatformInfo,
} from '../interfaces/auth.interface';
import { RedisAuthService } from './redis-auth.service';

@Injectable()
export class TokenManagerService {
  private readonly logger = new Logger(TokenManagerService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisAuth: RedisAuthService,
  ) {}

  // 🎫 ACCESS TOKENS
  async generateAccessToken(
    userId: string,
    username: string,
    platform: PlatformInfo,
    additionalPayload?: Partial<TokenPayload>,
  ): Promise<string> {
    const payload: TokenPayload = {
      sub: userId,
      username,
      platform: platform.type,
      deviceId: platform.deviceInfo?.model,
      jti: this.generateJTI(),
      ...additionalPayload,
    };

    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('config.auth.jwtAccessSecret'),
      expiresIn: this.configService.get('config.auth.jwtAccessExpires'),
    });

    // Guardar JTI en Redis para posible blacklisting
    if (payload.jti) {
      await this.redisAuth.storeTokenJTI(
        payload.jti,
        userId,
        this.getAccessTokenTTL(),
      );
    }

    return token;
  }

  async validateAccessToken(token: string): Promise<TokenValidationResult> {
    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(token, {
        secret: this.configService.get('config.auth.jwtAccessSecret'),
      });

      // Verificar si está en blacklist
      if (payload.jti) {
        const isBlacklisted = await this.redisAuth.isTokenBlacklisted(
          payload.jti,
        );
        if (isBlacklisted) {
          return { isValid: false, error: 'Token is blacklisted' };
        }
      }

      return { isValid: true, payload };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return { isValid: false, error: 'Token expired', needsRefresh: true };
      }
      return { isValid: false, error: 'Invalid token' };
    }
  }

  // 🔄 REFRESH TOKENS
  async generateRefreshToken(
    userId: string,
    username: string,
    platform: PlatformInfo,
    tokenFamily?: string,
  ): Promise<string> {
    const family = tokenFamily || this.generateTokenFamily();

    const payload: RefreshTokenPayload = {
      sub: userId,
      username,
      platform: platform.type,
      deviceId: platform.deviceInfo?.model,
      tokenFamily: family,
      version: await this.getNextTokenVersion(userId, family),
    };

    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('config.auth.jwtRefreshSecret'),
      expiresIn: this.configService.get('config.auth.jwtRefreshExpires'),
    });

    // Guardar en Redis con metadata
    await this.redisAuth.storeRefreshToken(userId, token, {
      family,
      platform: platform.type,
      deviceId: platform.deviceInfo?.model,
      createdAt: new Date(),
    });

    return token;
  }

  async validateRefreshToken(token: string): Promise<TokenValidationResult> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        token,
        {
          secret: this.configService.get('config.auth.jwtRefreshSecret'),
        },
      );

      // Verificar si el token existe en Redis
      const storedToken = await this.redisAuth.getRefreshToken(
        payload.sub,
        token,
      );
      if (!storedToken) {
        return { isValid: false, error: 'Refresh token not found' };
      }

      // Verificar family y version
      if (storedToken.family !== payload.tokenFamily) {
        return { isValid: false, error: 'Token family mismatch' };
      }

      return { isValid: true, payload };
    } catch (error) {
      return { isValid: false, error: 'Invalid refresh token' };
    }
  }

  async rotateRefreshToken(oldToken: string): Promise<string> {
    const validation = await this.validateRefreshToken(oldToken);
    if (!validation.isValid || !validation.payload) {
      throw new Error('Cannot rotate invalid token');
    }

    const refreshPayload = validation.payload as RefreshTokenPayload;
    const { sub, username, platform, tokenFamily } = refreshPayload;

    // Invalidar token anterior
    await this.redisAuth.invalidateRefreshToken(sub, oldToken);

    // Generar nuevo token con mismo family
    const platformInfo: PlatformInfo = {
      type: platform as any,
      userAgent: '',
      isNative: platform === 'mobile',
    };

    return this.generateRefreshToken(sub, username, platformInfo, tokenFamily);
  }

  // 🔐 PASSWORD RESET TOKENS
  async generateResetToken(
    userId: string,
    email: string,
    type: 'password-reset' | 'email-verification' = 'password-reset',
  ): Promise<string> {
    const payload: ResetTokenPayload = {
      sub: userId,
      email,
      type,
      oneTimeUse: true,
    };

    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('config.auth.resetTokenSecret'),
      expiresIn: this.configService.get('config.auth.resetTokenExpires'),
    });

    // Guardar en Redis para one-time use
    await this.redisAuth.storeResetToken(token, userId, 3600); // 1 hora

    return token;
  }

  async validateResetToken(token: string): Promise<TokenValidationResult> {
    try {
      // Verificar que no haya sido usado
      const isUsed = await this.redisAuth.isResetTokenUsed(token);
      if (isUsed) {
        return { isValid: false, error: 'Reset token already used' };
      }

      const payload = await this.jwtService.verifyAsync<ResetTokenPayload>(
        token,
        {
          secret: this.configService.get('config.auth.resetTokenSecret'),
        },
      );

      return { isValid: true, payload };
    } catch (error) {
      return { isValid: false, error: 'Invalid reset token' };
    }
  }

  async markResetTokenAsUsed(token: string): Promise<void> {
    await this.redisAuth.markResetTokenAsUsed(token);
  }

  // 🎯 TOKEN RESPONSE GENERATION
  async generateTokenResponse(
    userId: string,
    username: string,
    platform: PlatformInfo,
    includeRefresh: boolean = true,
  ): Promise<TokenResponse> {
    const accessToken = await this.generateAccessToken(
      userId,
      username,
      platform,
    );

    const response: TokenResponse = {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.getAccessTokenTTL(),
    };

    if (includeRefresh) {
      response.refreshToken = await this.generateRefreshToken(
        userId,
        username,
        platform,
      );
    }

    return response;
  }

  // 🛠️ UTILITY METHODS
  private generateJTI(): string {
    return randomBytes(16).toString('hex');
  }

  private generateTokenFamily(): string {
    return randomBytes(8).toString('hex');
  }

  private getAccessTokenTTL(): number {
    const expires = this.configService.get('config.auth.jwtAccessExpires');
    return this.parseExpiration(expires);
  }

  private parseExpiration(expiration: string): number {
    // Convierte "15m", "1h", "7d" a segundos
    const unit = expiration.slice(-1);
    const value = parseInt(expiration.slice(0, -1));

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 900; // 15 min default
    }
  }

  private async getNextTokenVersion(
    userId: string,
    family: string,
  ): Promise<number> {
    const currentVersion = await this.redisAuth.getTokenFamilyVersion(
      userId,
      family,
    );
    return currentVersion + 1;
  }

  // 🗑️ TOKEN CLEANUP
  async blacklistToken(token: string): Promise<void> {
    try {
      const payload = this.jwtService.decode(token);
      if (payload?.jti && payload?.exp) {
        await this.redisAuth.blacklistToken(
          payload.jti,
          payload.exp - Math.floor(Date.now() / 1000),
        );
      }
    } catch (error) {
      this.logger.warn('Failed to blacklist token', error);
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.redisAuth.revokeAllUserTokens(userId);
  }

  async revokeUserTokensByPlatform(
    userId: string,
    platform: string,
  ): Promise<void> {
    await this.redisAuth.revokeUserTokensByPlatform(userId, platform);
  }
}
