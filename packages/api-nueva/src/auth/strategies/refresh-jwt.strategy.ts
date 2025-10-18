import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenPayload, AuthRequest } from '../interfaces/auth.interface';
import { RedisAuthService } from '../services/redis-auth.service';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisAuth: RedisAuthService,
  ) {
    const secret = configService.get<string>('config.auth.jwtRefreshSecret');

    console.log('🔑 [RefreshJwtStrategy] Constructor - Refresh secret config:', {
      secretPreview: secret ? secret.substring(0, 10) + '...' : 'undefined',
      secretLength: secret?.length,
      isDefined: !!secret,
      secretType: typeof secret,
    });

    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refresh_token'),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    } as StrategyOptionsWithRequest);
  }

  async validate(
    request: AuthRequest,
    payload: RefreshTokenPayload,
  ): Promise<{
    userId: string;
    username: string;
    platform: string;
    deviceId?: string;
    tokenFamily: string;
    refreshToken: string;
  }> {
    const refreshToken = request.body.refresh_token;

    console.log('🔍 [RefreshJwtStrategy] Validating refresh token:', {
      userId: payload.sub,
      username: payload.username,
      platform: payload.platform,
      tokenFamily: payload.tokenFamily,
      tokenVersion: payload.version,
      tokenPreview: refreshToken ? refreshToken.substring(0, 30) + '...' : 'null',
      headers: {
        deviceId: request.headers['x-device-id'],
        platform: request.headers['x-platform'],
      },
    });

    // Verificar que el token existe en Redis
    const storedToken = await this.redisAuth.getRefreshToken(
      payload.sub,
      refreshToken,
    );

    console.log('🔍 [RefreshJwtStrategy] Redis lookup result:', {
      found: !!storedToken,
      storedFamily: storedToken?.family,
      storedPlatform: storedToken?.platform,
      storedDeviceId: storedToken?.deviceId,
      payloadFamily: payload.tokenFamily,
    });

    if (!storedToken) {
      console.error('❌ [RefreshJwtStrategy] Refresh token not found in Redis', {
        userId: payload.sub,
        tokenFamily: payload.tokenFamily,
        tokenVersion: payload.version,
      });
      throw new UnauthorizedException('Refresh token not found');
    }

    // Verificar family consistency
    if (storedToken.family !== payload.tokenFamily) {
      console.error('❌ [RefreshJwtStrategy] Token family mismatch', {
        userId: payload.sub,
        storedFamily: storedToken.family,
        payloadFamily: payload.tokenFamily,
      });
      throw new UnauthorizedException('Token family mismatch');
    }

    console.log('✅ [RefreshJwtStrategy] Token validation successful');

    return {
      userId: payload.sub,
      username: payload.username,
      platform: payload.platform,
      deviceId: payload.deviceId,
      tokenFamily: payload.tokenFamily,
      refreshToken,
    };
  }
}
