# 🔐 NestJS Universal Authentication Patterns 2025

> **Sistema de autenticación universal** reutilizable y desacoplado para proyectos web y móviles con NestJS, MongoDB y Redis

## 📋 Índice

1. [Arquitectura Universal](#arquitectura-universal)
2. [Configuración Base](#configuración-base)
3. [Detección de Plataforma](#detección-de-plataforma)
4. [Ecosistema Completo de Tokens](#ecosistema-completo-de-tokens)
5. [Strategies y Guards](#strategies-y-guards)
6. [Servicios Core](#servicios-core)
7. [Controllers Multi-Plataforma](#controllers-multi-plataforma)
8. [Integración con Redis](#integración-con-redis)
9. [Manejo de Sesiones vs Tokens](#manejo-de-sesiones-vs-tokens)
10. [Seguridad y Mejores Prácticas](#seguridad-y-mejores-prácticas)
11. [Implementación Completa](#implementación-completa)

---

## 🏗️ Arquitectura Universal

### 1. Principios de Diseño

```typescript
/**
 * PATRÓN UNIVERSAL DE AUTENTICACIÓN 2025
 *
 * Características:
 * ✅ Desacoplado del esquema de usuarios
 * ✅ Reutilizable entre proyectos
 * ✅ Multi-plataforma (Web + Mobile)
 * ✅ Ecosistema completo de tokens
 * ✅ Redis para escalabilidad
 * ✅ Seguridad moderna
 */

interface AuthArchitecture {
  // Detección automática de plataforma
  platformDetection: 'automatic' | 'header-based';

  // Estrategias por plataforma
  webStrategy: 'sessions' | 'jwt' | 'hybrid';
  mobileStrategy: 'jwt' | 'biometric-jwt';

  // Storage distribuido
  tokenStorage: 'redis';
  sessionStorage: 'redis';
  userStorage: 'mongodb';

  // Tokens soportados
  supportedTokens: [
    'access',      // API access (15-30 min)
    'refresh',     // Token renewal (7-14 días)
    'reset',       // Password reset (1 hora)
    'biometric',   // Biometric auth (device-specific)
    'session'      // Web sessions (HTTP-only)
  ];
}
```

### 2. Estructura Modular

```
src/
├── auth/
│   ├── auth.module.ts           # Módulo principal
│   ├── interfaces/              # Interfaces reutilizables
│   │   ├── auth.interface.ts
│   │   ├── token.interface.ts
│   │   └── platform.interface.ts
│   ├── services/                # Servicios core
│   │   ├── auth.service.ts
│   │   ├── token-manager.service.ts
│   │   ├── platform-detection.service.ts
│   │   ├── redis-auth.service.ts
│   │   └── biometric-auth.service.ts
│   ├── strategies/              # Passport strategies
│   │   ├── jwt.strategy.ts
│   │   ├── refresh-jwt.strategy.ts
│   │   ├── session.strategy.ts
│   │   └── biometric.strategy.ts
│   ├── guards/                  # Guards reutilizables
│   │   ├── jwt-auth.guard.ts
│   │   ├── platform-auth.guard.ts
│   │   ├── role-auth.guard.ts
│   │   └── subscription.guard.ts
│   ├── decorators/             # Decorators personalizados
│   │   ├── current-user.decorator.ts
│   │   ├── platform.decorator.ts
│   │   └── roles.decorator.ts
│   ├── dto/                    # DTOs de validación
│   │   ├── login.dto.ts
│   │   ├── register.dto.ts
│   │   ├── refresh-token.dto.ts
│   │   └── reset-password.dto.ts
│   └── controllers/            # Controllers por plataforma
│       ├── auth.controller.ts
│       ├── web-auth.controller.ts
│       └── mobile-auth.controller.ts
```

---

## 🔧 Configuración Base

### 1. Instalación de Dependencias

```bash
# Auth y JWT
yarn workspace api-nueva add @nestjs/jwt @nestjs/passport passport passport-jwt passport-local

# Hashing y validación
yarn workspace api-nueva add bcryptjs class-validator class-transformer

# Cookies y sesiones (para web)
yarn workspace api-nueva add express-session connect-redis

# Tipos
yarn workspace api-nueva add -D @types/passport-jwt @types/passport-local @types/bcryptjs @types/express-session
```

### 2. AuthModule Principal

```typescript
// src/auth/auth.module.ts
import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Services
import { AuthService } from './services/auth.service';
import { TokenManagerService } from './services/token-manager.service';
import { PlatformDetectionService } from './services/platform-detection.service';
import { RedisAuthService } from './services/redis-auth.service';
import { BiometricAuthService } from './services/biometric-auth.service';

// Strategies
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshJwtStrategy } from './strategies/refresh-jwt.strategy';
import { SessionStrategy } from './strategies/session.strategy';

// Controllers
import { AuthController } from './controllers/auth.controller';
import { WebAuthController } from './controllers/web-auth.controller';
import { MobileAuthController } from './controllers/mobile-auth.controller';

@Global() // 🔥 Global para reutilizar en cualquier módulo
@Module({
  imports: [
    // JWT Configuration
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRES', '15m'),
          issuer: configService.get<string>('JWT_ISSUER', 'noticias-pachuca'),
          audience: configService.get<string>('JWT_AUDIENCE', 'noticias-pachuca-users'),
        },
      }),
      inject: [ConfigService],
    }),

    // Passport Configuration
    PassportModule.register({
      defaultStrategy: 'jwt',
      session: false, // Solo para JWT, sessions manejadas por separado
    }),
  ],

  providers: [
    // Core Services
    AuthService,
    TokenManagerService,
    PlatformDetectionService,
    RedisAuthService,
    BiometricAuthService,

    // Strategies
    JwtStrategy,
    RefreshJwtStrategy,
    SessionStrategy,
  ],

  controllers: [
    AuthController,      // Controller principal
    WebAuthController,   // Específico para web
    MobileAuthController, // Específico para mobile
  ],

  exports: [
    AuthService,
    TokenManagerService,
    PlatformDetectionService,
    RedisAuthService,
    'AUTH_MODULE', // Export para identificación
  ],
})
export class AuthModule {}
```

### 3. Configuración de Environment

```typescript
// src/config/auth.configuration.ts
export default () => ({
  auth: {
    // JWT Access Tokens
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'your-super-secret-access-key',
    jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',

    // JWT Refresh Tokens
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
    jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',

    // Password Reset Tokens
    resetTokenSecret: process.env.RESET_TOKEN_SECRET || 'your-reset-token-secret',
    resetTokenExpires: process.env.RESET_TOKEN_EXPIRES || '1h',

    // Sessions (Web)
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret',
    sessionExpires: parseInt(process.env.SESSION_EXPIRES || '86400000'), // 24h en ms

    // Security
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),

    // Platform Detection
    mobileUserAgents: [
      'react-native',
      'expo',
      'flutter',
      'ionic',
      'cordova',
      'mobile-app',
    ],

    // Token Limits
    maxRefreshTokens: parseInt(process.env.MAX_REFRESH_TOKENS || '5'),
    maxSessions: parseInt(process.env.MAX_SESSIONS || '3'),
  },
});
```

---

## 📱 Detección de Plataforma

### 1. Platform Detection Service

```typescript
// src/auth/services/platform-detection.service.ts
import { Injectable } from '@nestjs/common';
import { Request } from 'express';

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
    const clientVersion = request.headers['x-client-version'] as string;

    // 1. Header explícito (más confiable)
    if (platformHeader && this.isValidPlatform(platformHeader)) {
      return {
        type: platformHeader,
        userAgent,
        isNative: platformHeader === 'mobile',
        deviceInfo: this.extractDeviceInfo(request),
      };
    }

    // 2. User-Agent detection
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

    // Verificar patterns específicos de apps nativas
    for (const agent of this.mobileUserAgents) {
      if (lowerUA.includes(agent)) {
        return 'mobile';
      }
    }

    // Verificar patterns de mobile
    for (const pattern of this.mobilePatterns) {
      if (pattern.test(userAgent)) {
        return 'mobile';
      }
    }

    // API clients
    if (lowerUA.includes('postman') || lowerUA.includes('insomnia') || lowerUA.includes('curl')) {
      return 'api';
    }

    // Default a web
    return 'web';
  }

  private extractDeviceInfo(request: Request): PlatformInfo['deviceInfo'] {
    const deviceHeader = request.headers['x-device-info'] as string;
    const osHeader = request.headers['x-device-os'] as string;
    const versionHeader = request.headers['x-device-version'] as string;

    if (deviceHeader) {
      try {
        return JSON.parse(deviceHeader);
      } catch {
        // Continuar con headers individuales
      }
    }

    return {
      os: osHeader,
      version: versionHeader,
      model: request.headers['x-device-model'] as string,
    };
  }

  private isValidPlatform(platform: string): platform is Platform {
    return ['web', 'mobile', 'api', 'unknown'].includes(platform);
  }

  // Métodos helper
  isMobile(platformInfo: PlatformInfo): boolean {
    return platformInfo.type === 'mobile' || platformInfo.isNative;
  }

  isWeb(platformInfo: PlatformInfo): boolean {
    return platformInfo.type === 'web';
  }

  isAPI(platformInfo: PlatformInfo): boolean {
    return platformInfo.type === 'api';
  }

  shouldUseCookies(platformInfo: PlatformInfo): boolean {
    return this.isWeb(platformInfo);
  }

  shouldUseTokens(platformInfo: PlatformInfo): boolean {
    return this.isMobile(platformInfo) || this.isAPI(platformInfo);
  }
}
```

### 2. Platform Decorator

```typescript
// src/auth/decorators/platform.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PlatformDetectionService, PlatformInfo } from '../services/platform-detection.service';

export const Platform = createParamDecorator(
  (data: keyof PlatformInfo | undefined, ctx: ExecutionContext): PlatformInfo | any => {
    const request = ctx.switchToHttp().getRequest();

    // Agregar platform info al request si no existe
    if (!request.platformInfo) {
      const platformService = new PlatformDetectionService();
      request.platformInfo = platformService.detectPlatform(request);
    }

    return data ? request.platformInfo[data] : request.platformInfo;
  },
);

// Uso:
// @Get('profile')
// getProfile(@Platform() platform: PlatformInfo) { ... }
//
// @Get('user')
// getUser(@Platform('type') platformType: 'web' | 'mobile') { ... }
```

---

## 🎫 Ecosistema Completo de Tokens

### 1. Token Interfaces

```typescript
// src/auth/interfaces/token.interface.ts
export interface TokenPayload {
  sub: string;          // User ID
  username: string;     // Username
  email?: string;       // Email (opcional)
  roles?: string[];     // User roles
  permissions?: string[]; // Specific permissions
  platform: string;     // Platform origin
  deviceId?: string;    // Device identifier
  sessionId?: string;   // Session identifier
  iat?: number;         // Issued at
  exp?: number;         // Expires at
  jti?: string;         // JWT ID (para blacklisting)
}

export interface RefreshTokenPayload {
  sub: string;
  username: string;
  platform: string;
  deviceId?: string;
  tokenFamily: string;  // Para rotation
  version: number;      // Para invalidación
}

export interface ResetTokenPayload {
  sub: string;
  email: string;
  type: 'password-reset' | 'email-verification';
  oneTimeUse: boolean;
}

export interface BiometricTokenPayload {
  sub: string;
  deviceId: string;
  biometricType: 'fingerprint' | 'face' | 'voice';
  deviceFingerprint: string;
  challenge: string;
}

export interface SessionData {
  userId: string;
  username: string;
  platform: string;
  deviceInfo?: any;
  lastActivity: Date;
  createdAt: Date;
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
```

### 2. Token Manager Service

```typescript
// src/auth/services/token-manager.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'crypto';
import {
  TokenPayload,
  RefreshTokenPayload,
  ResetTokenPayload,
  BiometricTokenPayload,
  TokenResponse,
  TokenValidationResult
} from '../interfaces/token.interface';
import { RedisAuthService } from './redis-auth.service';
import { PlatformInfo } from './platform-detection.service';

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
      secret: this.configService.get('auth.jwtAccessSecret'),
      expiresIn: this.configService.get('auth.jwtAccessExpires'),
    });

    // Guardar JTI en Redis para posible blacklisting
    await this.redisAuth.storeTokenJTI(payload.jti, userId, this.getAccessTokenTTL());

    return token;
  }

  async validateAccessToken(token: string): Promise<TokenValidationResult> {
    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(token, {
        secret: this.configService.get('auth.jwtAccessSecret'),
      });

      // Verificar si está en blacklist
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
      secret: this.configService.get('auth.jwtRefreshSecret'),
      expiresIn: this.configService.get('auth.jwtRefreshExpires'),
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
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
        secret: this.configService.get('auth.jwtRefreshSecret'),
      });

      // Verificar si el token existe en Redis
      const storedToken = await this.redisAuth.getRefreshToken(payload.sub, token);
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

    const { sub, username, platform, tokenFamily } = validation.payload;

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
      secret: this.configService.get('auth.resetTokenSecret'),
      expiresIn: this.configService.get('auth.resetTokenExpires'),
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

      const payload = await this.jwtService.verifyAsync<ResetTokenPayload>(token, {
        secret: this.configService.get('auth.resetTokenSecret'),
      });

      return { isValid: true, payload };
    } catch (error) {
      return { isValid: false, error: 'Invalid reset token' };
    }
  }

  async markResetTokenAsUsed(token: string): Promise<void> {
    await this.redisAuth.markResetTokenAsUsed(token);
  }

  // 👆 BIOMETRIC TOKENS
  async generateBiometricToken(
    userId: string,
    deviceId: string,
    biometricType: 'fingerprint' | 'face' | 'voice',
    deviceFingerprint: string,
  ): Promise<string> {
    const challenge = this.generateChallenge();

    const payload: BiometricTokenPayload = {
      sub: userId,
      deviceId,
      biometricType,
      deviceFingerprint,
      challenge,
    };

    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('auth.jwtAccessSecret'),
      expiresIn: '5m', // Short-lived for security
    });

    // Guardar challenge en Redis
    await this.redisAuth.storeBiometricChallenge(challenge, userId, deviceId, 300); // 5 min

    return token;
  }

  async validateBiometricToken(
    token: string,
    biometricResponse: string,
  ): Promise<TokenValidationResult> {
    try {
      const payload = await this.jwtService.verifyAsync<BiometricTokenPayload>(token, {
        secret: this.configService.get('auth.jwtAccessSecret'),
      });

      // Verificar challenge
      const isValidChallenge = await this.redisAuth.validateBiometricChallenge(
        payload.challenge,
        payload.sub,
        payload.deviceId,
      );

      if (!isValidChallenge) {
        return { isValid: false, error: 'Invalid biometric challenge' };
      }

      // Aquí validarías la respuesta biométrica según tu implementación
      // Esto depende del SDK biométrico que uses (FaceID, TouchID, etc.)

      return { isValid: true, payload };
    } catch (error) {
      return { isValid: false, error: 'Invalid biometric token' };
    }
  }

  // 🎯 TOKEN RESPONSE GENERATION
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

  // 🛠️ UTILITY METHODS
  private generateJTI(): string {
    return randomBytes(16).toString('hex');
  }

  private generateTokenFamily(): string {
    return randomBytes(8).toString('hex');
  }

  private generateChallenge(): string {
    return randomBytes(32).toString('hex');
  }

  private getAccessTokenTTL(): number {
    const expires = this.configService.get('auth.jwtAccessExpires');
    return this.parseExpiration(expires);
  }

  private parseExpiration(expiration: string): number {
    // Convierte "15m", "1h", "7d" a segundos
    const unit = expiration.slice(-1);
    const value = parseInt(expiration.slice(0, -1));

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 900; // 15 min default
    }
  }

  private async getNextTokenVersion(userId: string, family: string): Promise<number> {
    const currentVersion = await this.redisAuth.getTokenFamilyVersion(userId, family);
    return currentVersion + 1;
  }

  // 🗑️ TOKEN CLEANUP
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

---

## 🔐 Strategies y Guards

### 1. JWT Strategy

```typescript
// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { TokenPayload } from '../interfaces/token.interface';
import { TokenManagerService } from '../services/token-manager.service';
import { RedisAuthService } from '../services/redis-auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly tokenManager: TokenManagerService,
    private readonly redisAuth: RedisAuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('auth.jwtAccessSecret'),
      passReqToCallback: true, // Permite acceso al request
    });
  }

  async validate(request: any, payload: TokenPayload): Promise<any> {
    // Verificar blacklist
    if (payload.jti) {
      const isBlacklisted = await this.redisAuth.isTokenBlacklisted(payload.jti);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    // Verificar que el usuario aún existe y está activo
    // Aquí podrías agregar validación adicional con tu UserService

    // Agregar información del token al request
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

### 2. Refresh JWT Strategy

```typescript
// src/auth/strategies/refresh-jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenPayload } from '../interfaces/token.interface';
import { RedisAuthService } from '../services/redis-auth.service';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisAuth: RedisAuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('auth.jwtRefreshSecret'),
      passReqToCallback: true,
    });
  }

  async validate(request: any, payload: RefreshTokenPayload): Promise<any> {
    const refreshToken = request.body.refreshToken;

    // Verificar que el token existe en Redis
    const storedToken = await this.redisAuth.getRefreshToken(payload.sub, refreshToken);
    if (!storedToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    // Verificar family consistency
    if (storedToken.family !== payload.tokenFamily) {
      throw new UnauthorizedException('Token family mismatch');
    }

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
```

### 3. Platform Auth Guard

```typescript
// src/auth/guards/platform-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PlatformDetectionService } from '../services/platform-detection.service';

export const PLATFORM_KEY = 'platforms';
export const Platforms = (...platforms: string[]) => SetMetadata(PLATFORM_KEY, platforms);

@Injectable()
export class PlatformAuthGuard extends JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly platformDetection: PlatformDetectionService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Primero validar JWT
    const jwtValid = await super.canActivate(context);
    if (!jwtValid) return false;

    // Luego validar plataforma si está especificada
    const requiredPlatforms = this.reflector.getAllAndOverride<string[]>(PLATFORM_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPlatforms) {
      return true; // No hay restricción de plataforma
    }

    const request = context.switchToHttp().getRequest();
    const platformInfo = this.platformDetection.detectPlatform(request);

    if (!requiredPlatforms.includes(platformInfo.type)) {
      throw new UnauthorizedException(
        `This endpoint is only available for: ${requiredPlatforms.join(', ')}`
      );
    }

    // Agregar platform info al request
    request.platformInfo = platformInfo;

    return true;
  }
}

// Uso:
// @Platforms('mobile')
// @UseGuards(PlatformAuthGuard)
// @Get('mobile-only-endpoint')
```

### 4. JWT Auth Guard Principal

```typescript
// src/auth/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Verificar si el endpoint es público
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

---

## 🔧 Servicios Core

### 1. Auth Service Principal

```typescript
// src/auth/services/auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { TokenManagerService } from './token-manager.service';
import { RedisAuthService } from './redis-auth.service';
import { PlatformDetectionService, PlatformInfo } from './platform-detection.service';
import { TokenResponse } from '../interfaces/token.interface';

// DTOs
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly tokenManager: TokenManagerService,
    private readonly redisAuth: RedisAuthService,
    private readonly platformDetection: PlatformDetectionService,
    private readonly configService: ConfigService,
  ) {}

  // 🔐 LOGIN
  async login(loginDto: LoginDto, request: any): Promise<TokenResponse> {
    const { email, username, password, deviceId } = loginDto;
    const platformInfo = this.platformDetection.detectPlatform(request);

    // Buscar usuario por email o username
    const user = await this.findUserByEmailOrUsername(email || username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verificar password
    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verificar si la cuenta está activa
    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    // Generar tokens
    const tokenResponse = await this.tokenManager.generateTokenResponse(
      user.id,
      user.username,
      platformInfo,
      true, // Include refresh token
    );

    // Guardar información de login en Redis
    await this.redisAuth.recordLogin(user.id, {
      platform: platformInfo.type,
      deviceId,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      loginTime: new Date(),
    });

    // Para web, también crear sesión si es necesario
    if (platformInfo.type === 'web' && request.session) {
      request.session.userId = user.id;
      request.session.username = user.username;
      request.session.platform = platformInfo.type;
    }

    return tokenResponse;
  }

  // 👤 REGISTER
  async register(registerDto: RegisterDto, request: any): Promise<TokenResponse> {
    const { email, username, password, firstName, lastName } = registerDto;
    const platformInfo = this.platformDetection.detectPlatform(request);

    // Verificar si el usuario ya existe
    const existingUser = await this.findUserByEmailOrUsername(email, username);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Crear usuario
    const newUser = await this.createUser({
      email,
      username,
      password: hashedPassword,
      firstName,
      lastName,
      isActive: true,
      emailVerified: false,
    });

    // Generar tokens
    const tokenResponse = await this.tokenManager.generateTokenResponse(
      newUser.id,
      newUser.username,
      platformInfo,
      true,
    );

    // Generar token de verificación de email
    const verificationToken = await this.tokenManager.generateResetToken(
      newUser.id,
      newUser.email,
      'email-verification',
    );

    // Enviar email de verificación (implementar según tu servicio de email)
    await this.sendVerificationEmail(newUser.email, verificationToken);

    return tokenResponse;
  }

  // 🔄 REFRESH TOKEN
  async refreshToken(refreshTokenDto: RefreshTokenDto, request: any): Promise<TokenResponse> {
    const { refreshToken } = refreshTokenDto;
    const platformInfo = this.platformDetection.detectPlatform(request);

    // Validar refresh token
    const validation = await this.tokenManager.validateRefreshToken(refreshToken);
    if (!validation.isValid || !validation.payload) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const { sub: userId, username } = validation.payload;

    // Rotar refresh token (token rotation security)
    const newRefreshToken = await this.tokenManager.rotateRefreshToken(refreshToken);

    // Generar nuevo access token
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

  // 🚪 LOGOUT
  async logout(token: string, userId: string, request: any): Promise<void> {
    const platformInfo = this.platformDetection.detectPlatform(request);

    // Blacklist access token
    await this.tokenManager.blacklistToken(token);

    // Invalidar refresh tokens del usuario en esta plataforma
    await this.tokenManager.revokeUserTokensByPlatform(userId, platformInfo.type);

    // Limpiar sesión si es web
    if (platformInfo.type === 'web' && request.session) {
      request.session.destroy();
    }

    // Registrar logout en Redis
    await this.redisAuth.recordLogout(userId, {
      platform: platformInfo.type,
      logoutTime: new Date(),
    });
  }

  // 🚪 LOGOUT ALL DEVICES
  async logoutAllDevices(userId: string): Promise<void> {
    // Revocar todos los tokens del usuario
    await this.tokenManager.revokeAllUserTokens(userId);

    // Limpiar todas las sesiones
    await this.redisAuth.clearAllUserSessions(userId);
  }

  // 🔑 RESET PASSWORD
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.findUserByEmail(email);
    if (!user) {
      // No revelar si el email existe o no
      return;
    }

    // Generar token de reset
    const resetToken = await this.tokenManager.generateResetToken(
      user.id,
      user.email,
      'password-reset',
    );

    // Enviar email de reset (implementar según tu servicio de email)
    await this.sendPasswordResetEmail(user.email, resetToken);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { token, newPassword } = resetPasswordDto;

    // Validar token de reset
    const validation = await this.tokenManager.validateResetToken(token);
    if (!validation.isValid || !validation.payload) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const { sub: userId } = validation.payload;

    // Marcar token como usado
    await this.tokenManager.markResetTokenAsUsed(token);

    // Hash nueva password
    const hashedPassword = await this.hashPassword(newPassword);

    // Actualizar password en la base de datos
    await this.updateUserPassword(userId, hashedPassword);

    // Revocar todos los tokens existentes por seguridad
    await this.tokenManager.revokeAllUserTokens(userId);
  }

  // 🔒 VERIFICAR EMAIL
  async verifyEmail(token: string): Promise<void> {
    const validation = await this.tokenManager.validateResetToken(token);
    if (!validation.isValid || !validation.payload) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    const { sub: userId } = validation.payload;

    // Marcar token como usado
    await this.tokenManager.markResetTokenAsUsed(token);

    // Marcar email como verificado
    await this.markEmailAsVerified(userId);
  }

  // 🔐 CAMBIAR PASSWORD (usuario autenticado)
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verificar password actual
    const isCurrentPasswordValid = await compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash nueva password
    const hashedPassword = await this.hashPassword(newPassword);

    // Actualizar password
    await this.updateUserPassword(userId, hashedPassword);

    // Revocar todos los tokens excepto el actual (implementar lógica específica)
    // await this.tokenManager.revokeAllUserTokens(userId);
  }

  // 🛠️ UTILITY METHODS
  private async hashPassword(password: string): Promise<string> {
    const rounds = this.configService.get<number>('auth.bcryptRounds', 12);
    return hash(password, rounds);
  }

  // 📧 EMAIL METHODS (implementar según tu servicio de email)
  private async sendVerificationEmail(email: string, token: string): Promise<void> {
    // Implementar envío de email
    console.log(`Verification email sent to ${email} with token: ${token}`);
  }

  private async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    // Implementar envío de email
    console.log(`Password reset email sent to ${email} with token: ${token}`);
  }

  // 🗃️ DATABASE METHODS (implementar según tu modelo de usuario)
  private async findUserByEmailOrUsername(email?: string, username?: string): Promise<any> {
    // Implementar búsqueda en MongoDB
    // return this.userModel.findOne({
    //   $or: [
    //     ...(email ? [{ email }] : []),
    //     ...(username ? [{ username }] : [])
    //   ]
    // });
  }

  private async findUserByEmail(email: string): Promise<any> {
    // Implementar búsqueda por email
  }

  private async findUserById(id: string): Promise<any> {
    // Implementar búsqueda por ID
  }

  private async createUser(userData: any): Promise<any> {
    // Implementar creación de usuario
  }

  private async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    // Implementar actualización de password
  }

  private async markEmailAsVerified(userId: string): Promise<void> {
    // Implementar marcado de email verificado
  }
}
```

---

## 🗄️ Integración con Redis

### 1. Redis Auth Service

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

interface LoginRecord {
  platform: string;
  deviceId?: string;
  userAgent?: string;
  ip?: string;
  loginTime: Date;
}

interface LogoutRecord {
  platform: string;
  logoutTime: Date;
}

@Injectable()
export class RedisAuthService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  // 🎫 TOKEN JTI MANAGEMENT
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

  // 🔄 REFRESH TOKEN MANAGEMENT
  async storeRefreshToken(
    userId: string,
    token: string,
    metadata: RefreshTokenMetadata,
  ): Promise<void> {
    const key = `refresh:${userId}:${token}`;
    await this.cache.set(key, metadata, 604800 * 1000); // 7 días

    // También guardar en lista de tokens del usuario
    await this.addToUserTokenList(userId, token, metadata.platform);
  }

  async getRefreshToken(userId: string, token: string): Promise<RefreshTokenMetadata | null> {
    const key = `refresh:${userId}:${token}`;
    return await this.cache.get<RefreshTokenMetadata>(key) || null;
  }

  async invalidateRefreshToken(userId: string, token: string): Promise<void> {
    const key = `refresh:${userId}:${token}`;
    await this.cache.del(key);

    // Remover de la lista de tokens del usuario
    await this.removeFromUserTokenList(userId, token);
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    const userTokensKey = `user_tokens:${userId}`;
    const tokens = await this.cache.get<string[]>(userTokensKey) || [];

    // Invalidar cada token
    for (const token of tokens) {
      await this.invalidateRefreshToken(userId, token);
    }

    // Limpiar lista
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

  // 📱 USER TOKEN LIST MANAGEMENT
  private async addToUserTokenList(userId: string, token: string, platform: string): Promise<void> {
    const key = `user_tokens:${userId}`;
    const tokens = await this.cache.get<string[]>(key) || [];

    tokens.push(token);

    // Limitar número de refresh tokens por usuario
    const maxTokens = 5;
    if (tokens.length > maxTokens) {
      const oldToken = tokens.shift();
      if (oldToken) {
        await this.invalidateRefreshToken(userId, oldToken);
      }
    }

    await this.cache.set(key, tokens, 604800 * 1000); // 7 días
  }

  private async removeFromUserTokenList(userId: string, token: string): Promise<void> {
    const key = `user_tokens:${userId}`;
    const tokens = await this.cache.get<string[]>(key) || [];

    const updatedTokens = tokens.filter(t => t !== token);
    await this.cache.set(key, updatedTokens, 604800 * 1000);
  }

  // 🔑 RESET TOKEN MANAGEMENT
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
    await this.cache.set(key, { usedAt: new Date() }, 3600 * 1000); // 1 hora
  }

  // 👆 BIOMETRIC TOKEN MANAGEMENT
  async storeBiometricChallenge(
    challenge: string,
    userId: string,
    deviceId: string,
    ttlSeconds: number,
  ): Promise<void> {
    const key = `biometric:${challenge}`;
    await this.cache.set(key, { userId, deviceId, createdAt: new Date() }, ttlSeconds * 1000);
  }

  async validateBiometricChallenge(
    challenge: string,
    userId: string,
    deviceId: string,
  ): Promise<boolean> {
    const key = `biometric:${challenge}`;
    const stored = await this.cache.get<any>(key);

    if (!stored) return false;

    return stored.userId === userId && stored.deviceId === deviceId;
  }

  // 📊 SESSION MANAGEMENT
  async createSession(
    sessionId: string,
    userId: string,
    sessionData: any,
    ttlSeconds: number,
  ): Promise<void> {
    const key = `session:${sessionId}`;
    await this.cache.set(key, { userId, ...sessionData }, ttlSeconds * 1000);

    // Agregar a lista de sesiones del usuario
    await this.addToUserSessionList(userId, sessionId);
  }

  async getSession(sessionId: string): Promise<any> {
    const key = `session:${sessionId}`;
    return await this.cache.get(key);
  }

  async destroySession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    const session = await this.cache.get<any>(key);

    if (session) {
      await this.cache.del(key);
      await this.removeFromUserSessionList(session.userId, sessionId);
    }
  }

  async clearAllUserSessions(userId: string): Promise<void> {
    const sessionsKey = `user_sessions:${userId}`;
    const sessions = await this.cache.get<string[]>(sessionsKey) || [];

    for (const sessionId of sessions) {
      await this.cache.del(`session:${sessionId}`);
    }

    await this.cache.del(sessionsKey);
  }

  private async addToUserSessionList(userId: string, sessionId: string): Promise<void> {
    const key = `user_sessions:${userId}`;
    const sessions = await this.cache.get<string[]>(key) || [];

    sessions.push(sessionId);

    // Limitar número de sesiones simultáneas
    const maxSessions = 3;
    if (sessions.length > maxSessions) {
      const oldSession = sessions.shift();
      if (oldSession) {
        await this.destroySession(oldSession);
      }
    }

    await this.cache.set(key, sessions, 86400 * 1000); // 24 horas
  }

  private async removeFromUserSessionList(userId: string, sessionId: string): Promise<void> {
    const key = `user_sessions:${userId}`;
    const sessions = await this.cache.get<string[]>(key) || [];

    const updatedSessions = sessions.filter(s => s !== sessionId);
    await this.cache.set(key, updatedSessions, 86400 * 1000);
  }

  // 📈 LOGIN/LOGOUT TRACKING
  async recordLogin(userId: string, loginData: LoginRecord): Promise<void> {
    const key = `login:${userId}:${Date.now()}`;
    await this.cache.set(key, loginData, 86400 * 7 * 1000); // 7 días

    // Actualizar último login
    await this.cache.set(`last_login:${userId}`, loginData, 86400 * 30 * 1000); // 30 días
  }

  async recordLogout(userId: string, logoutData: LogoutRecord): Promise<void> {
    const key = `logout:${userId}:${Date.now()}`;
    await this.cache.set(key, logoutData, 86400 * 7 * 1000); // 7 días
  }

  async getLastLogin(userId: string): Promise<LoginRecord | null> {
    const key = `last_login:${userId}`;
    return await this.cache.get<LoginRecord>(key) || null;
  }

  // 🔧 TOKEN FAMILY MANAGEMENT
  async getTokenFamilyVersion(userId: string, family: string): Promise<number> {
    const key = `token_family:${userId}:${family}`;
    const version = await this.cache.get<number>(key);
    return version || 0;
  }

  async incrementTokenFamilyVersion(userId: string, family: string): Promise<number> {
    const key = `token_family:${userId}:${family}`;
    const currentVersion = await this.getTokenFamilyVersion(userId, family);
    const newVersion = currentVersion + 1;

    await this.cache.set(key, newVersion, 604800 * 1000); // 7 días
    return newVersion;
  }

  // 🧹 CLEANUP METHODS
  async cleanupExpiredTokens(): Promise<void> {
    // Este método sería llamado por un cron job
    // Redis automáticamente limpia los keys expirados, pero podemos hacer limpieza manual si es necesario
  }

  // 📊 ANALYTICS METHODS
  async getActiveUserSessions(userId: string): Promise<number> {
    const sessionsKey = `user_sessions:${userId}`;
    const sessions = await this.cache.get<string[]>(sessionsKey) || [];
    return sessions.length;
  }

  async getActiveUserTokens(userId: string): Promise<number> {
    const tokensKey = `user_tokens:${userId}`;
    const tokens = await this.cache.get<string[]>(tokensKey) || [];
    return tokens.length;
  }
}
```

---

## 🎮 Controllers Multi-Plataforma

### 1. Auth Controller Principal

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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth
} from '@nestjs/swagger';

import { AuthService } from '../services/auth.service';
import { TokenManagerService } from '../services/token-manager.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RefreshJwtAuthGuard } from '../guards/refresh-jwt-auth.guard';

// DTOs
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';

// Decorators
import { CurrentUser } from '../decorators/current-user.decorator';
import { Platform } from '../decorators/platform.decorator';
import { Public } from '../guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenManager: TokenManagerService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login with platform detection' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Req() request: any) {
    return this.authService.login(loginDto, request);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto, @Req() request: any) {
    return this.authService.register(registerDto, request);
  }

  @Public()
  @Post('refresh')
  @UseGuards(RefreshJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto, @Req() request: any) {
    return this.authService.refreshToken(refreshTokenDto, request);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from current device' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(
    @CurrentUser('userId') userId: string,
    @Req() request: any,
  ) {
    const token = request.headers.authorization?.replace('Bearer ', '');
    await this.authService.logout(token, userId, request);
    return { message: 'Logout successful' };
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiResponse({ status: 200, description: 'Logout from all devices successful' })
  async logoutAll(@CurrentUser('userId') userId: string) {
    await this.authService.logoutAllDevices(userId);
    return { message: 'Logout from all devices successful' };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Reset email sent if user exists' })
  async forgotPassword(@Body('email') email: string) {
    await this.authService.requestPasswordReset(email);
    return { message: 'If the email exists, a reset link has been sent' };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
    return { message: 'Password reset successful' };
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with token' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async verifyEmail(@Body('token') token: string) {
    await this.authService.verifyEmail(token);
    return { message: 'Email verified successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  async getProfile(
    @CurrentUser() user: any,
    @Platform() platform: any,
  ) {
    return {
      user,
      platform,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password for authenticated user' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  async changePassword(
    @CurrentUser('userId') userId: string,
    @Body('currentPassword') currentPassword: string,
    @Body('newPassword') newPassword: string,
  ) {
    await this.authService.changePassword(userId, currentPassword, newPassword);
    return { message: 'Password changed successfully' };
  }
}
```

### 2. Web Auth Controller (Sesiones específicas)

```typescript
// src/auth/controllers/web-auth.controller.ts
import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { AuthService } from '../services/auth.service';
import { PlatformAuthGuard, Platforms } from '../guards/platform-auth.guard';
import { Public } from '../guards/jwt-auth.guard';
import { LoginDto } from '../dto/login.dto';

@ApiTags('Web Authentication')
@Controller('auth/web')
@Platforms('web') // Solo para plataforma web
export class WebAuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Web login with session cookies' })
  async loginWeb(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokenResponse = await this.authService.login(loginDto, request);

    // Configurar cookies HTTP-only para web
    response.cookie('access_token', tokenResponse.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: tokenResponse.expiresIn * 1000,
    });

    if (tokenResponse.refreshToken) {
      response.cookie('refresh_token', tokenResponse.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
      });
    }

    // No devolver tokens en el body para web
    return {
      message: 'Login successful',
      user: {
        // Información básica del usuario
      },
    };
  }

  @Post('logout')
  @UseGuards(PlatformAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Web logout clearing cookies' })
  async logoutWeb(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    // Lógica de logout específica para web

    // Limpiar cookies
    response.clearCookie('access_token');
    response.clearCookie('refresh_token');

    return { message: 'Logout successful' };
  }

  @Get('session')
  @UseGuards(PlatformAuthGuard)
  @ApiOperation({ summary: 'Get web session info' })
  async getSession(@Req() request: Request) {
    return {
      session: request.session,
      cookies: request.cookies,
    };
  }
}
```

### 3. Mobile Auth Controller (JWT específico)

```typescript
// src/auth/controllers/mobile-auth.controller.ts
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
import { BiometricAuthService } from '../services/biometric-auth.service';
import { PlatformAuthGuard, Platforms } from '../guards/platform-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Public } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

import { LoginDto } from '../dto/login.dto';
import { BiometricLoginDto } from '../dto/biometric-login.dto';

@ApiTags('Mobile Authentication')
@Controller('auth/mobile')
@Platforms('mobile') // Solo para plataforma móvil
export class MobileAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly biometricAuth: BiometricAuthService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mobile login with JWT tokens' })
  async loginMobile(@Body() loginDto: LoginDto, @Req() request: any) {
    // Login normal que devuelve tokens JWT
    return this.authService.login(loginDto, request);
  }

  @Public()
  @Post('biometric-challenge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request biometric authentication challenge' })
  async requestBiometricChallenge(
    @Body('userId') userId: string,
    @Body('deviceId') deviceId: string,
    @Body('biometricType') biometricType: 'fingerprint' | 'face' | 'voice',
  ) {
    return this.biometricAuth.createBiometricChallenge(userId, deviceId, biometricType);
  }

  @Public()
  @Post('biometric-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with biometric authentication' })
  async biometricLogin(
    @Body() biometricLoginDto: BiometricLoginDto,
    @Req() request: any,
  ) {
    return this.biometricAuth.authenticateWithBiometric(biometricLoginDto, request);
  }

  @Post('enable-biometric')
  @UseGuards(PlatformAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable biometric authentication for device' })
  async enableBiometric(
    @CurrentUser('userId') userId: string,
    @Body('deviceId') deviceId: string,
    @Body('biometricType') biometricType: string,
    @Body('deviceFingerprint') deviceFingerprint: string,
  ) {
    return this.biometricAuth.enableBiometricForDevice(
      userId,
      deviceId,
      biometricType,
      deviceFingerprint,
    );
  }

  @Post('disable-biometric')
  @UseGuards(PlatformAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable biometric authentication for device' })
  async disableBiometric(
    @CurrentUser('userId') userId: string,
    @Body('deviceId') deviceId: string,
  ) {
    return this.biometricAuth.disableBiometricForDevice(userId, deviceId);
  }

  @Get('devices')
  @UseGuards(PlatformAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user registered devices' })
  async getRegisteredDevices(@CurrentUser('userId') userId: string) {
    return this.biometricAuth.getUserDevices(userId);
  }
}
```

---

## 🎯 Resumen de Implementación

### 1. Checklist de Implementación

- [ ] **Instalar dependencias** JWT, Passport, bcryptjs, etc.
- [ ] **Configurar AuthModule** con JWT y strategies
- [ ] **Implementar PlatformDetectionService** para multi-plataforma
- [ ] **Crear TokenManagerService** con ecosistema completo de tokens
- [ ] **Implementar RedisAuthService** para almacenamiento de tokens
- [ ] **Configurar Guards y Strategies** para protección de rutas
- [ ] **Crear Controllers** específicos por plataforma
- [ ] **Implementar manejo de errores** y logging
- [ ] **Configurar rate limiting** en endpoints auth
- [ ] **Añadir tests** para todo el sistema

### 2. Características del Sistema

| Característica | Web | Mobile | API |
|---------------|-----|--------|-----|
| Autenticación | Sessions/JWT | JWT | JWT |
| Storage | HTTP-only cookies | Secure storage | Headers |
| Refresh Tokens | ✅ | ✅ | ✅ |
| Biometric Auth | ❌ | ✅ | ❌ |
| Multi-session | ✅ | ✅ | ❌ |
| Remember Me | ✅ | ✅ | ❌ |

### 3. Tokens Soportados

1. **Access Tokens**: 15-30 min, para acceso a API
2. **Refresh Tokens**: 7-14 días, para renovación automática
3. **Reset Tokens**: 1 hora, para cambio de contraseña
4. **Verification Tokens**: 24 horas, para verificación de email
5. **Biometric Tokens**: 5 min, para autenticación biométrica
6. **Session Tokens**: Variable, para sesiones web

### 4. Seguridad Implementada

- ✅ **Password hashing** con bcrypt
- ✅ **JWT signing** con secretos separados
- ✅ **Token rotation** para refresh tokens
- ✅ **Token blacklisting** con Redis
- ✅ **Rate limiting** en endpoints críticos
- ✅ **Platform validation** automática
- ✅ **Session management** seguro
- ✅ **Biometric integration** ready

---

¡Sistema de autenticación universal completo y listo para implementar! 🚀