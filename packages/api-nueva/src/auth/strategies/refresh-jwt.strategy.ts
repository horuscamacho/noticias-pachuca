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
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('config.auth.jwtRefreshSecret'),
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
    const refreshToken = request.body.refreshToken;

    // Verificar que el token existe en Redis
    const storedToken = await this.redisAuth.getRefreshToken(
      payload.sub,
      refreshToken,
    );
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
