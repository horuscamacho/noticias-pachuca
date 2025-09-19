import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import {
  TokenPayload,
  AuthRequest,
  AuthenticatedUser,
} from '../interfaces/auth.interface';
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
      secretOrKey: configService.get<string>('config.auth.jwtAccessSecret'),
      passReqToCallback: true,
    } as StrategyOptionsWithRequest);
  }

  async validate(
    request: AuthRequest,
    payload: TokenPayload,
  ): Promise<AuthenticatedUser> {
    // Verificar blacklist
    if (payload.jti) {
      const isBlacklisted = await this.redisAuth.isTokenBlacklisted(
        payload.jti,
      );
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }

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
