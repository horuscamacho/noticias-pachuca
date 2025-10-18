import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  RefreshTokenMetadata,
  LoginRecord,
  LogoutRecord,
} from '../interfaces/auth.interface';

@Injectable()
export class RedisAuthService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  // 🎫 TOKEN JTI MANAGEMENT
  async storeTokenJTI(
    jti: string,
    userId: string,
    ttlSeconds: number,
  ): Promise<void> {
    const key = `jti:${jti}`;
    await this.cache.set(
      key,
      { userId, createdAt: new Date() },
      ttlSeconds * 1000,
    );
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
    const tokenPreview = token ? token.substring(0, 30) + '...' : 'null';

    console.log('💾 [RedisAuthService] Storing refresh token:', {
      userId,
      key,
      tokenPreview,
      family: metadata.family,
      platform: metadata.platform,
      deviceId: metadata.deviceId,
      ttlDays: 7,
    });

    await this.cache.set(key, metadata, 604800 * 1000); // 7 días

    // También guardar en lista de tokens del usuario
    await this.addToUserTokenList(userId, token, metadata.platform);

    console.log('✅ [RedisAuthService] Token stored successfully');
  }

  async getRefreshToken(
    userId: string,
    token: string,
  ): Promise<RefreshTokenMetadata | null> {
    const key = `refresh:${userId}:${token}`;
    const tokenPreview = token ? token.substring(0, 30) + '...' : 'null';

    console.log('🔍 [RedisAuthService] Getting refresh token:', {
      userId,
      key,
      tokenPreview,
    });

    const result = (await this.cache.get<RefreshTokenMetadata>(key)) || null;

    console.log('🔍 [RedisAuthService] Token lookup result:', {
      userId,
      found: !!result,
      family: result?.family,
      platform: result?.platform,
      deviceId: result?.deviceId,
      createdAt: result?.createdAt,
    });

    return result;
  }

  async invalidateRefreshToken(userId: string, token: string): Promise<void> {
    const key = `refresh:${userId}:${token}`;
    const tokenPreview = token ? token.substring(0, 30) + '...' : 'null';

    console.log('🗑️  [RedisAuthService] Invalidating refresh token:', {
      userId,
      key,
      tokenPreview,
    });

    await this.cache.del(key);

    // Remover de la lista de tokens del usuario
    await this.removeFromUserTokenList(userId, token);

    console.log('✅ [RedisAuthService] Token invalidated successfully');
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    const userTokensKey = `user_tokens:${userId}`;
    const tokens = (await this.cache.get<string[]>(userTokensKey)) || [];

    // Invalidar cada token
    for (const token of tokens) {
      await this.invalidateRefreshToken(userId, token);
    }

    // Limpiar lista
    await this.cache.del(userTokensKey);
  }

  async revokeUserTokensByPlatform(
    userId: string,
    platform: string,
  ): Promise<void> {
    const userTokensKey = `user_tokens:${userId}`;
    const tokens = (await this.cache.get<string[]>(userTokensKey)) || [];

    for (const token of tokens) {
      const metadata = await this.getRefreshToken(userId, token);
      if (metadata && metadata.platform === platform) {
        await this.invalidateRefreshToken(userId, token);
      }
    }
  }

  // 📱 USER TOKEN LIST MANAGEMENT
  private async addToUserTokenList(
    userId: string,
    token: string,
    platform: string,
  ): Promise<void> {
    const key = `user_tokens:${userId}`;
    const tokens = (await this.cache.get<string[]>(key)) || [];
    const tokenPreview = token ? token.substring(0, 30) + '...' : 'null';

    console.log('📱 [RedisAuthService] Adding token to user list:', {
      userId,
      platform,
      tokenPreview,
      currentTokenCount: tokens.length,
      maxTokens: 5,
    });

    tokens.push(token);

    // Limitar número de refresh tokens por usuario
    const maxTokens = 5;
    if (tokens.length > maxTokens) {
      const oldToken = tokens.shift();
      const oldTokenPreview = oldToken ? oldToken.substring(0, 30) + '...' : 'null';
      console.warn('⚠️  [RedisAuthService] Max tokens exceeded, removing oldest token:', {
        userId,
        oldTokenPreview,
        remainingTokens: tokens.length,
      });
      if (oldToken) {
        await this.invalidateRefreshToken(userId, oldToken);
      }
    }

    await this.cache.set(key, tokens, 604800 * 1000); // 7 días

    console.log('✅ [RedisAuthService] Token added to user list, total:', tokens.length);
  }

  private async removeFromUserTokenList(
    userId: string,
    token: string,
  ): Promise<void> {
    const key = `user_tokens:${userId}`;
    const tokens = (await this.cache.get<string[]>(key)) || [];

    const updatedTokens = tokens.filter((t) => t !== token);
    await this.cache.set(key, updatedTokens, 604800 * 1000);
  }

  // 🔑 RESET TOKEN MANAGEMENT
  async storeResetToken(
    token: string,
    userId: string,
    ttlSeconds: number,
  ): Promise<void> {
    const key = `reset:${token}`;
    await this.cache.set(
      key,
      { userId, createdAt: new Date() },
      ttlSeconds * 1000,
    );
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

  // 📊 SESSION MANAGEMENT
  async createSession(
    sessionId: string,
    userId: string,
    sessionData: Record<string, unknown>,
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
    const sessions = (await this.cache.get<string[]>(sessionsKey)) || [];

    for (const sessionId of sessions) {
      await this.cache.del(`session:${sessionId}`);
    }

    await this.cache.del(sessionsKey);
  }

  private async addToUserSessionList(
    userId: string,
    sessionId: string,
  ): Promise<void> {
    const key = `user_sessions:${userId}`;
    const sessions = (await this.cache.get<string[]>(key)) || [];

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

  private async removeFromUserSessionList(
    userId: string,
    sessionId: string,
  ): Promise<void> {
    const key = `user_sessions:${userId}`;
    const sessions = (await this.cache.get<string[]>(key)) || [];

    const updatedSessions = sessions.filter((s) => s !== sessionId);
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
    return (await this.cache.get<LoginRecord>(key)) || null;
  }

  // 🔧 TOKEN FAMILY MANAGEMENT
  async getTokenFamilyVersion(userId: string, family: string): Promise<number> {
    const key = `token_family:${userId}:${family}`;
    const version = await this.cache.get<number>(key);
    return version || 0;
  }

  async incrementTokenFamilyVersion(
    userId: string,
    family: string,
  ): Promise<number> {
    const key = `token_family:${userId}:${family}`;
    const currentVersion = await this.getTokenFamilyVersion(userId, family);
    const newVersion = currentVersion + 1;

    await this.cache.set(key, newVersion, 604800 * 1000); // 7 días
    return newVersion;
  }

  // 📊 ANALYTICS METHODS
  async getActiveUserSessions(userId: string): Promise<number> {
    const sessionsKey = `user_sessions:${userId}`;
    const sessions = (await this.cache.get<string[]>(sessionsKey)) || [];
    return sessions.length;
  }

  async getActiveUserTokens(userId: string): Promise<number> {
    const tokensKey = `user_tokens:${userId}`;
    const tokens = (await this.cache.get<string[]>(tokensKey)) || [];
    return tokens.length;
  }
}
