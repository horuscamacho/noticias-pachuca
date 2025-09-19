import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Redis } from 'ioredis';
import {
  UserSession,
  UserSessionDocument,
  Platform,
  AppState,
} from '../schemas/user-session.schema';
import { SessionData, DeviceInfo } from '../interfaces/session.interface';

@Injectable()
export class SessionManagerService {
  constructor(
    @InjectModel(UserSession.name)
    private sessionModel: Model<UserSessionDocument>,
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  async registerSession(
    sessionData: SessionData,
  ): Promise<UserSessionDocument> {
    const session = await this.sessionModel.findOneAndUpdate(
      {
        userId: sessionData.userId,
        deviceId: sessionData.deviceId,
      },
      {
        ...sessionData,
        isActive: true,
        expiresAt: new Date(Date.now() + 86400000), // 24 horas
      },
      {
        upsert: true,
        new: true,
      },
    );

    // Cache en Redis para acceso rápido
    await this.redis.hset(
      `user_sessions:${sessionData.userId}`,
      sessionData.deviceId,
      JSON.stringify({
        ...sessionData,
        sessionId: String(session._id),
      }),
    );

    await this.redis.expire(`user_sessions:${sessionData.userId}`, 86400);

    return session;
  }

  async updateAppState(
    userId: string,
    deviceId: string,
    appState: AppState,
  ): Promise<void> {
    await this.sessionModel.updateOne(
      { userId, deviceId },
      {
        appState,
        lastSeen: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
      },
    );

    // Actualizar cache
    const cached = await this.redis.hget(`user_sessions:${userId}`, deviceId);
    if (cached) {
      const session = JSON.parse(cached);
      session.appState = appState;
      session.lastSeen = new Date();
      await this.redis.hset(
        `user_sessions:${userId}`,
        deviceId,
        JSON.stringify(session),
      );
    }
  }

  async updatePushToken(
    userId: string,
    deviceId: string,
    expoPushToken: string,
  ): Promise<void> {
    await this.sessionModel.updateOne(
      { userId, deviceId },
      {
        expoPushToken,
        lastSeen: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
      },
    );

    // Actualizar cache
    const cached = await this.redis.hget(`user_sessions:${userId}`, deviceId);
    if (cached) {
      const session = JSON.parse(cached);
      session.expoPushToken = expoPushToken;
      session.lastSeen = new Date();
      await this.redis.hset(
        `user_sessions:${userId}`,
        deviceId,
        JSON.stringify(session),
      );
    }
  }

  async markSessionInactive(userId: string, deviceId: string): Promise<void> {
    await this.sessionModel.updateOne(
      { userId, deviceId },
      {
        isActive: false,
        socketId: null,
        lastSeen: new Date(),
      },
    );

    await this.redis.hdel(`user_sessions:${userId}`, deviceId);
  }

  async getUserSessions(userId: string): Promise<SessionData[]> {
    // Primero intentar desde cache
    const cached = await this.redis.hgetall(`user_sessions:${userId}`);
    if (Object.keys(cached).length > 0) {
      return Object.values(cached).map((data) => JSON.parse(data));
    }

    // Fallback a MongoDB
    const sessions = await this.sessionModel
      .find({ userId, isActive: true })
      .lean();
    return sessions.map((session) => ({
      userId: session.userId,
      deviceId: session.deviceId,
      platform: session.platform,
      socketId: session.socketId,
      isActive: session.isActive,
      appState: session.appState,
      expoPushToken: session.expoPushToken,
      deviceInfo: session.deviceInfo,
      lastSeen: session.lastSeen,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
    }));
  }

  async getActiveSocketSessions(userId: string): Promise<SessionData[]> {
    const sessions = await this.getUserSessions(userId);
    return sessions.filter((s) => s.isActive && s.socketId);
  }

  async getMobilePushSessions(userId: string): Promise<SessionData[]> {
    const sessions = await this.getUserSessions(userId);
    return sessions.filter(
      (s) =>
        s.platform === Platform.MOBILE &&
        s.expoPushToken &&
        (s.appState === AppState.BACKGROUND || !s.isActive),
    );
  }
}
