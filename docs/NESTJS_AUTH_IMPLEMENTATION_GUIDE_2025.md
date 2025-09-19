# 🚀 NestJS Auth Implementation Guide 2025

> **Guía paso a paso** para implementar el sistema de autenticación universal en tu proyecto

## 📋 Orden de Implementación

### Phase 1: Preparación y Configuración Base
1. [Instalar dependencias](#1-instalar-dependencias)
2. [Configurar environment variables](#2-configurar-environment-variables)
3. [Actualizar configuración](#3-actualizar-configuración)

### Phase 2: Interfaces y DTOs
4. [Crear interfaces de autenticación](#4-crear-interfaces-de-autenticación)
5. [Crear DTOs de validación](#5-crear-dtos-de-validación)

### Phase 3: Servicios Core
6. [Implementar Platform Detection Service](#6-implementar-platform-detection-service)
7. [Implementar Redis Auth Service](#7-implementar-redis-auth-service)
8. [Implementar Token Manager Service](#8-implementar-token-manager-service)
9. [Implementar Auth Service](#9-implementar-auth-service)

### Phase 4: Strategies y Guards
10. [Crear JWT Strategies](#10-crear-jwt-strategies)
11. [Implementar Guards](#11-implementar-guards)
12. [Crear Decorators](#12-crear-decorators)

### Phase 5: Controllers
13. [Implementar Auth Controllers](#13-implementar-auth-controllers)

### Phase 6: Módulo y Integración
14. [Configurar Auth Module](#14-configurar-auth-module)
15. [Integrar con App Module](#15-integrar-con-app-module)

---

## 1. Instalar Dependencias

```bash
# Autenticación y JWT
yarn workspace api-nueva add @nestjs/jwt @nestjs/passport passport passport-jwt passport-local

# Hashing y validación
yarn workspace api-nueva add bcryptjs class-validator class-transformer

# Sesiones para web
yarn workspace api-nueva add express-session connect-redis

# Tipos TypeScript
yarn workspace api-nueva add -D @types/passport-jwt @types/passport-local @types/bcryptjs @types/express-session
```

## 2. Configurar Environment Variables

```bash
# Agregar a .env
JWT_ACCESS_SECRET=your-super-secret-access-key-here
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_REFRESH_EXPIRES=7d
RESET_TOKEN_SECRET=your-reset-token-secret-here
RESET_TOKEN_EXPIRES=1h
SESSION_SECRET=your-session-secret-here
SESSION_EXPIRES=86400000
BCRYPT_ROUNDS=12
```

## 3. Actualizar Configuración

Agregar al archivo `src/config/configuration.ts`:

```typescript
// Agregar esta sección al archivo existente
auth: {
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'your-super-secret-access-key',
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  resetTokenSecret: process.env.RESET_TOKEN_SECRET || 'your-reset-token-secret',
  resetTokenExpires: process.env.RESET_TOKEN_EXPIRES || '1h',
  sessionSecret: process.env.SESSION_SECRET || 'your-session-secret',
  sessionExpires: parseInt(process.env.SESSION_EXPIRES || '86400000'),
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  mobileUserAgents: [
    'react-native',
    'expo',
    'flutter',
    'ionic',
    'cordova',
    'mobile-app',
  ],
  maxRefreshTokens: parseInt(process.env.MAX_REFRESH_TOKENS || '5'),
  maxSessions: parseInt(process.env.MAX_SESSIONS || '3'),
},
```

## 4. Crear Interfaces de Autenticación

```typescript
// src/auth/interfaces/auth.interface.ts
export interface TokenPayload {
  sub: string;
  username: string;
  email?: string;
  roles?: string[];
  permissions?: string[];
  platform: string;
  deviceId?: string;
  sessionId?: string;
  iat?: number;
  exp?: number;
  jti?: string;
}

export interface RefreshTokenPayload {
  sub: string;
  username: string;
  platform: string;
  deviceId?: string;
  tokenFamily: string;
  version: number;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType: 'Bearer';
  expiresIn: number;
  sessionId?: string;
}

export interface TokenValidationResult {
  isValid: boolean;
  payload?: TokenPayload;
  error?: string;
  needsRefresh?: boolean;
}

export type Platform = 'web' | 'mobile' | 'api' | 'unknown';

export interface PlatformInfo {
  type: Platform;
  userAgent: string;
  isNative: boolean;
  deviceInfo?: {
    os?: string;
    version?: string;
    model?: string;
  };
}
```

## 5. Crear DTOs de Validación

```typescript
// src/auth/dto/login.dto.ts
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'username', required: false })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'device-123', required: false })
  @IsString()
  @IsOptional()
  deviceId?: string;
}
```

```typescript
// src/auth/dto/register.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'username' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;
}
```

```typescript
// src/auth/dto/refresh-token.dto.ts
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ example: 'your-refresh-token-here' })
  @IsString()
  refreshToken: string;
}
```

## 6. Implementar Platform Detection Service

```typescript
// src/auth/services/platform-detection.service.ts
import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { Platform, PlatformInfo } from '../interfaces/auth.interface';

@Injectable()
export class PlatformDetectionService {
  private readonly mobileUserAgents = [
    'react-native',
    'expo',
    'flutter',
    'ionic',
    'cordova',
    'mobile-app',
  ];

  private readonly mobilePatterns = [
    /android/i,
    /iphone/i,
    /ipad/i,
    /mobile/i,
    /expo/i,
    /react-native/i,
  ];

  detectPlatform(request: Request): PlatformInfo {
    const userAgent = request.headers['user-agent'] || '';
    const platformHeader = request.headers['x-platform'] as Platform;

    if (platformHeader && this.isValidPlatform(platformHeader)) {
      return {
        type: platformHeader,
        userAgent,
        isNative: platformHeader === 'mobile',
        deviceInfo: this.extractDeviceInfo(request),
      };
    }

    const detectedType = this.detectFromUserAgent(userAgent);

    return {
      type: detectedType,
      userAgent,
      isNative: detectedType === 'mobile',
      deviceInfo: this.extractDeviceInfo(request),
    };
  }

  private detectFromUserAgent(userAgent: string): Platform {
    const lowerUA = userAgent.toLowerCase();

    for (const agent of this.mobileUserAgents) {
      if (lowerUA.includes(agent)) {
        return 'mobile';
      }
    }

    for (const pattern of this.mobilePatterns) {
      if (pattern.test(userAgent)) {
        return 'mobile';
      }
    }

    if (lowerUA.includes('postman') || lowerUA.includes('insomnia') || lowerUA.includes('curl')) {
      return 'api';
    }

    return 'web';
  }

  private extractDeviceInfo(request: Request): PlatformInfo['deviceInfo'] {
    return {
      os: request.headers['x-device-os'] as string,
      version: request.headers['x-device-version'] as string,
      model: request.headers['x-device-model'] as string,
    };
  }

  private isValidPlatform(platform: string): platform is Platform {
    return ['web', 'mobile', 'api', 'unknown'].includes(platform);
  }

  isMobile(platformInfo: PlatformInfo): boolean {
    return platformInfo.type === 'mobile' || platformInfo.isNative;
  }

  isWeb(platformInfo: PlatformInfo): boolean {
    return platformInfo.type === 'web';
  }

  shouldUseCookies(platformInfo: PlatformInfo): boolean {
    return this.isWeb(platformInfo);
  }

  shouldUseTokens(platformInfo: PlatformInfo): boolean {
    return this.isMobile(platformInfo) || platformInfo.type === 'api';
  }
}
```

## 7. Implementar Redis Auth Service

```typescript
// src/auth/services/redis-auth.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

interface RefreshTokenMetadata {
  family: string;
  platform: string;
  deviceId?: string;
  createdAt: Date;
  lastUsed?: Date;
}

@Injectable()
export class RedisAuthService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  // TOKEN JTI MANAGEMENT
  async storeTokenJTI(jti: string, userId: string, ttlSeconds: number): Promise<void> {
    const key = `jti:${jti}`;
    await this.cache.set(key, { userId, createdAt: new Date() }, ttlSeconds * 1000);
  }

  async isTokenBlacklisted(jti: string): Promise<boolean> {
    const key = `blacklist:${jti}`;
    const blacklisted = await this.cache.get(key);
    return !!blacklisted;
  }

  async blacklistToken(jti: string, ttlSeconds: number): Promise<void> {
    const key = `blacklist:${jti}`;
    await this.cache.set(key, { blacklistedAt: new Date() }, ttlSeconds * 1000);
  }

  // REFRESH TOKEN MANAGEMENT
  async storeRefreshToken(
    userId: string,
    token: string,
    metadata: RefreshTokenMetadata,
  ): Promise<void> {
    const key = `refresh:${userId}:${token}`;
    await this.cache.set(key, metadata, 604800 * 1000); // 7 días
    await this.addToUserTokenList(userId, token, metadata.platform);
  }

  async getRefreshToken(userId: string, token: string): Promise<RefreshTokenMetadata | null> {
    const key = `refresh:${userId}:${token}`;
    return await this.cache.get<RefreshTokenMetadata>(key) || null;
  }

  async invalidateRefreshToken(userId: string, token: string): Promise<void> {
    const key = `refresh:${userId}:${token}`;
    await this.cache.del(key);
    await this.removeFromUserTokenList(userId, token);
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    const userTokensKey = `user_tokens:${userId}`;
    const tokens = await this.cache.get<string[]>(userTokensKey) || [];

    for (const token of tokens) {
      await this.invalidateRefreshToken(userId, token);
    }

    await this.cache.del(userTokensKey);
  }

  async revokeUserTokensByPlatform(userId: string, platform: string): Promise<void> {
    const userTokensKey = `user_tokens:${userId}`;
    const tokens = await this.cache.get<string[]>(userTokensKey) || [];

    for (const token of tokens) {
      const metadata = await this.getRefreshToken(userId, token);
      if (metadata && metadata.platform === platform) {
        await this.invalidateRefreshToken(userId, token);
      }
    }
  }

  // USER TOKEN LIST MANAGEMENT
  private async addToUserTokenList(userId: string, token: string, platform: string): Promise<void> {
    const key = `user_tokens:${userId}`;
    const tokens = await this.cache.get<string[]>(key) || [];

    tokens.push(token);

    const maxTokens = 5;
    if (tokens.length > maxTokens) {
      const oldToken = tokens.shift();
      if (oldToken) {
        await this.invalidateRefreshToken(userId, oldToken);
      }
    }

    await this.cache.set(key, tokens, 604800 * 1000);
  }

  private async removeFromUserTokenList(userId: string, token: string): Promise<void> {
    const key = `user_tokens:${userId}`;
    const tokens = await this.cache.get<string[]>(key) || [];
    const updatedTokens = tokens.filter(t => t !== token);
    await this.cache.set(key, updatedTokens, 604800 * 1000);
  }

  // RESET TOKEN MANAGEMENT
  async storeResetToken(token: string, userId: string, ttlSeconds: number): Promise<void> {
    const key = `reset:${token}`;
    await this.cache.set(key, { userId, createdAt: new Date() }, ttlSeconds * 1000);
  }

  async isResetTokenUsed(token: string): Promise<boolean> {
    const key = `reset_used:${token}`;
    const used = await this.cache.get(key);
    return !!used;
  }

  async markResetTokenAsUsed(token: string): Promise<void> {
    const key = `reset_used:${token}`;
    await this.cache.set(key, { usedAt: new Date() }, 3600 * 1000);
  }

  // TOKEN FAMILY MANAGEMENT
  async getTokenFamilyVersion(userId: string, family: string): Promise<number> {
    const key = `token_family:${userId}:${family}`;
    const version = await this.cache.get<number>(key);
    return version || 0;
  }

  async incrementTokenFamilyVersion(userId: string, family: string): Promise<number> {
    const key = `token_family:${userId}:${family}`;
    const currentVersion = await this.getTokenFamilyVersion(userId, family);
    const newVersion = currentVersion + 1;
    await this.cache.set(key, newVersion, 604800 * 1000);
    return newVersion;
  }
}
```

## 8. Implementar Token Manager Service

```typescript
// src/auth/services/token-manager.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import {
  TokenPayload,
  RefreshTokenPayload,
  TokenResponse,
  TokenValidationResult,
  PlatformInfo
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

  // ACCESS TOKENS
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
      secret: this.configService.get('auth.jwtAccessSecret'),
      expiresIn: this.configService.get('auth.jwtAccessExpires'),
    });

    await this.redisAuth.storeTokenJTI(payload.jti, userId, this.getAccessTokenTTL());
    return token;
  }

  async validateAccessToken(token: string): Promise<TokenValidationResult> {
    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(token, {
        secret: this.configService.get('auth.jwtAccessSecret'),
      });

      const isBlacklisted = await this.redisAuth.isTokenBlacklisted(payload.jti);
      if (isBlacklisted) {
        return { isValid: false, error: 'Token blacklisted' };
      }

      return { isValid: true, payload };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return { isValid: false, error: 'Token expired', needsRefresh: true };
      }
      return { isValid: false, error: 'Invalid token' };
    }
  }

  // REFRESH TOKENS
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
      secret: this.configService.get('auth.jwtRefreshSecret'),
      expiresIn: this.configService.get('auth.jwtRefreshExpires'),
    });

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
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
        secret: this.configService.get('auth.jwtRefreshSecret'),
      });

      const storedToken = await this.redisAuth.getRefreshToken(payload.sub, token);
      if (!storedToken) {
        return { isValid: false, error: 'Refresh token not found' };
      }

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

    const { sub, username, platform, tokenFamily } = validation.payload;

    await this.redisAuth.invalidateRefreshToken(sub, oldToken);

    const platformInfo: PlatformInfo = {
      type: platform as any,
      userAgent: '',
      isNative: platform === 'mobile',
    };

    return this.generateRefreshToken(sub, username, platformInfo, tokenFamily);
  }

  // TOKEN RESPONSE GENERATION
  async generateTokenResponse(
    userId: string,
    username: string,
    platform: PlatformInfo,
    includeRefresh: boolean = true,
  ): Promise<TokenResponse> {
    const accessToken = await this.generateAccessToken(userId, username, platform);

    const response: TokenResponse = {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.getAccessTokenTTL(),
    };

    if (includeRefresh) {
      response.refreshToken = await this.generateRefreshToken(userId, username, platform);
    }

    return response;
  }

  // UTILITY METHODS
  private generateJTI(): string {
    return randomBytes(16).toString('hex');
  }

  private generateTokenFamily(): string {
    return randomBytes(8).toString('hex');
  }

  private getAccessTokenTTL(): number {
    const expires = this.configService.get('auth.jwtAccessExpires');
    return this.parseExpiration(expires);
  }

  private parseExpiration(expiration: string): number {
    const unit = expiration.slice(-1);
    const value = parseInt(expiration.slice(0, -1));

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 900;
    }
  }

  private async getNextTokenVersion(userId: string, family: string): Promise<number> {
    const currentVersion = await this.redisAuth.getTokenFamilyVersion(userId, family);
    return currentVersion + 1;
  }

  // TOKEN CLEANUP
  async blacklistToken(token: string): Promise<void> {
    try {
      const payload = this.jwtService.decode(token) as TokenPayload;
      if (payload?.jti) {
        await this.redisAuth.blacklistToken(payload.jti, payload.exp - Math.floor(Date.now() / 1000));
      }
    } catch (error) {
      this.logger.warn('Failed to blacklist token', error);
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.redisAuth.revokeAllUserTokens(userId);
  }

  async revokeUserTokensByPlatform(userId: string, platform: string): Promise<void> {
    await this.redisAuth.revokeUserTokensByPlatform(userId, platform);
  }
}
```

## 9. Implementar Auth Service

**NOTA:** Este service necesita ser conectado con tu User model de MongoDB. Los métodos de base de datos están marcados como "TODO" para que los implementes según tu esquema de usuario.

```typescript
// src/auth/services/auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { TokenManagerService } from './token-manager.service';
import { RedisAuthService } from './redis-auth.service';
import { PlatformDetectionService, PlatformInfo } from './platform-detection.service';
import { TokenResponse } from '../interfaces/auth.interface';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly tokenManager: TokenManagerService,
    private readonly redisAuth: RedisAuthService,
    private readonly platformDetection: PlatformDetectionService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto, request: any): Promise<TokenResponse> {
    const { email, username, password } = loginDto;
    const platformInfo = this.platformDetection.detectPlatform(request);

    // TODO: Implementar con tu User model
    const user = await this.findUserByEmailOrUsername(email || username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    return await this.tokenManager.generateTokenResponse(
      user.id,
      user.username,
      platformInfo,
      true,
    );
  }

  async register(registerDto: RegisterDto, request: any): Promise<TokenResponse> {
    const { email, username, password, firstName, lastName } = registerDto;
    const platformInfo = this.platformDetection.detectPlatform(request);

    // TODO: Implementar con tu User model
    const existingUser = await this.findUserByEmailOrUsername(email, username);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await this.hashPassword(password);

    // TODO: Implementar creación de usuario
    const newUser = await this.createUser({
      email,
      username,
      password: hashedPassword,
      firstName,
      lastName,
      isActive: true,
      emailVerified: false,
    });

    return await this.tokenManager.generateTokenResponse(
      newUser.id,
      newUser.username,
      platformInfo,
      true,
    );
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto, request: any): Promise<TokenResponse> {
    const { refreshToken } = refreshTokenDto;
    const platformInfo = this.platformDetection.detectPlatform(request);

    const validation = await this.tokenManager.validateRefreshToken(refreshToken);
    if (!validation.isValid || !validation.payload) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const { sub: userId, username } = validation.payload;

    const newRefreshToken = await this.tokenManager.rotateRefreshToken(refreshToken);
    const accessToken = await this.tokenManager.generateAccessToken(
      userId,
      username,
      platformInfo,
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
      tokenType: 'Bearer',
      expiresIn: this.tokenManager['getAccessTokenTTL'](),
    };
  }

  async logout(token: string, userId: string, request: any): Promise<void> {
    const platformInfo = this.platformDetection.detectPlatform(request);

    await this.tokenManager.blacklistToken(token);
    await this.tokenManager.revokeUserTokensByPlatform(userId, platformInfo.type);

    if (platformInfo.type === 'web' && request.session) {
      request.session.destroy();
    }
  }

  async logoutAllDevices(userId: string): Promise<void> {
    await this.tokenManager.revokeAllUserTokens(userId);
  }

  private async hashPassword(password: string): Promise<string> {
    const rounds = this.configService.get<number>('auth.bcryptRounds', 12);
    return hash(password, rounds);
  }

  // TODO: Implementar estos métodos con tu User model de MongoDB
  private async findUserByEmailOrUsername(emailOrUsername: string): Promise<any> {
    // Implementar búsqueda en tu User model
    throw new Error('Method not implemented - connect to your User model');
  }

  private async createUser(userData: any): Promise<any> {
    // Implementar creación en tu User model
    throw new Error('Method not implemented - connect to your User model');
  }
}
```

## 10. Crear JWT Strategies

```typescript
// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { TokenPayload } from '../interfaces/auth.interface';
import { RedisAuthService } from '../services/redis-auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisAuth: RedisAuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('auth.jwtAccessSecret'),
      passReqToCallback: true,
    });
  }

  async validate(request: any, payload: TokenPayload): Promise<any> {
    if (payload.jti) {
      const isBlacklisted = await this.redisAuth.isTokenBlacklisted(payload.jti);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    request.tokenPayload = payload;

    return {
      userId: payload.sub,
      username: payload.username,
      email: payload.email,
      roles: payload.roles || [],
      permissions: payload.permissions || [],
      platform: payload.platform,
      deviceId: payload.deviceId,
      sessionId: payload.sessionId,
    };
  }
}
```

## 11. Implementar Guards

```typescript
// src/auth/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
```

## 12. Crear Decorators

```typescript
// src/auth/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
```

```typescript
// src/auth/decorators/platform.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PlatformDetectionService } from '../services/platform-detection.service';

export const Platform = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    if (!request.platformInfo) {
      const platformService = new PlatformDetectionService();
      request.platformInfo = platformService.detectPlatform(request);
    }

    return data ? request.platformInfo[data] : request.platformInfo;
  },
);
```

## 13. Implementar Auth Controllers

```typescript
// src/auth/controllers/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Platform } from '../decorators/platform.decorator';
import { Public } from '../guards/jwt-auth.guard';

import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login with platform detection' })
  async login(@Body() loginDto: LoginDto, @Req() request: any) {
    return this.authService.login(loginDto, request);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  async register(@Body() registerDto: RegisterDto, @Req() request: any) {
    return this.authService.register(registerDto, request);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto, @Req() request: any) {
    return this.authService.refreshToken(refreshTokenDto, request);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from current device' })
  async logout(@CurrentUser('userId') userId: string, @Req() request: any) {
    const token = request.headers.authorization?.replace('Bearer ', '');
    await this.authService.logout(token, userId, request);
    return { message: 'Logout successful' };
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from all devices' })
  async logoutAll(@CurrentUser('userId') userId: string) {
    await this.authService.logoutAllDevices(userId);
    return { message: 'Logout from all devices successful' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser() user: any, @Platform() platform: any) {
    return { user, platform, timestamp: new Date().toISOString() };
  }
}
```

## 14. Configurar Auth Module

```typescript
// src/auth/auth.module.ts
import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './services/auth.service';
import { TokenManagerService } from './services/token-manager.service';
import { PlatformDetectionService } from './services/platform-detection.service';
import { RedisAuthService } from './services/redis-auth.service';

import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './controllers/auth.controller';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('auth.jwtAccessSecret'),
        signOptions: {
          expiresIn: configService.get<string>('auth.jwtAccessExpires'),
        },
      }),
      inject: [ConfigService],
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  providers: [
    AuthService,
    TokenManagerService,
    PlatformDetectionService,
    RedisAuthService,
    JwtStrategy,
  ],
  controllers: [AuthController],
  exports: [
    AuthService,
    TokenManagerService,
    PlatformDetectionService,
    RedisAuthService,
  ],
})
export class AuthModule {}
```

## 15. Integrar con App Module

```typescript
// src/app.module.ts
// Agregar AuthModule a los imports

imports: [
  // ... otros imports existentes
  AuthModule,
],
```

---

## 🧪 Testing

### 1. Test con Postman/Insomnia

```json
// POST /auth/register
{
  "email": "test@example.com",
  "username": "testuser",
  "password": "password123",
  "firstName": "Test",
  "lastName": "User"
}

// POST /auth/login
{
  "email": "test@example.com",
  "password": "password123"
}

// POST /auth/refresh
{
  "refreshToken": "your-refresh-token-here"
}

// GET /auth/me
// Headers: Authorization: Bearer your-access-token-here
```

### 2. Headers de Plataforma

```
x-platform: mobile
x-device-os: iOS
x-device-version: 15.0
x-device-model: iPhone13
```

---

## 📝 Notas Importantes

1. **Conectar con User Model**: Los métodos marcados como "TODO" en AuthService necesitan ser implementados con tu modelo de usuario de MongoDB.

2. **Variables de Entorno**: Asegúrate de configurar todas las variables JWT en tu `.env`.

3. **Redis**: El sistema asume que Redis está configurado y funcionando (ya lo tienes del cache).

4. **Testing**: Después de implementar, prueba todos los endpoints para verificar el flujo completo.

5. **Seguridad**: En producción, usa secretos JWT fuertes y únicos.

---

¡Con esta guía tienes todo lo necesario para implementar el sistema de autenticación universal paso a paso! 🚀