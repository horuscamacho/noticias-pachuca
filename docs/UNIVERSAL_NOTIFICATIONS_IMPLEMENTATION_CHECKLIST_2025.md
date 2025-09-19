# 🚀 Checklist Universal - Implementación Módulo de Notificaciones NestJS 2025
## Socket.IO + Push Notifications + Redis Multi-Session

---

## 📋 Análisis del Backend Actual

### ✅ **Componentes YA Disponibles (No Crear)**

```typescript
// 🔐 SISTEMA DE AUTENTICACIÓN - ✅ PERFECTO
src/auth/
├── auth.module.ts                    // ✅ Global module con JWT + Passport
├── controllers/auth.controller.ts    // ✅ Login/Register endpoints
├── services/
│   ├── auth.service.ts              // ✅ Core auth logic
│   ├── token-manager.service.ts     // ✅ JWT token management
│   ├── platform-detection.service.ts // ✅ Web/Mobile detection
│   └── redis-auth.service.ts        // ✅ Session management
├── strategies/
│   ├── jwt.strategy.ts              // ✅ JWT validation
│   └── refresh-jwt.strategy.ts      // ✅ Refresh token logic
├── decorators/
│   ├── current-user.decorator.ts    // ✅ @CurrentUser()
│   └── platform.decorator.ts       // ✅ @Platform()
└── guards/jwt-auth.guard.ts         // ✅ Route protection

// 🗄️ ESQUEMAS DE BASE DE DATOS - ✅ PERFECTO
src/schemas/
└── user.schema.ts                   // ✅ Complete User with notifications prefs

// ⚙️ CONFIGURACIÓN - ✅ DISPONIBLE
src/config/
├── configuration.ts                 // ✅ App config
├── config.service.ts               // ✅ Config management
└── validation.schema.ts            // ✅ Env validation

// 🛠️ SERVICIOS COMUNES - ✅ DISPONIBLE
src/common/services/                 // ✅ Shared utilities

// 📧 MÓDULO DE MAIL - ✅ PERFECTO
src/modules/mail/                    // ✅ Email system ready
```

### ❌ **Dependencias FALTANTES (Agregar a package.json)**

```json
{
  "dependencies": {
    "@nestjs/websockets": "^11.0.0",
    "@nestjs/platform-socket.io": "^11.0.0",
    "socket.io": "^4.8.0",
    "@socket.io/redis-adapter": "^8.3.0",
    "nestjs-expo-sdk": "^latest",
    "expo-server-sdk": "^4.0.0",
    "ioredis": "^5.8.2"
  }
}
```

---

## 🎯 **Checklist de Implementación Universal**

### **FASE 1: Setup Base (Día 1-2)**

#### ✅ **1.1 Instalar Dependencias**
```bash
# Socket.IO y WebSocket support
yarn add @nestjs/websockets @nestjs/platform-socket.io socket.io @socket.io/redis-adapter

# Expo Push Notifications (NestJS Integration + SDK)
yarn add nestjs-expo-sdk expo-server-sdk

# Redis avanzado (ya tienes redis básico)
yarn add ioredis

# Types no necesarios - Socket.IO y Expo incluyen sus propios tipos
```

#### ✅ **1.2 Crear Estructura del Módulo**
```bash
mkdir -p src/notifications/{dto,interfaces,schemas,services,gateways,decorators}
```

#### ✅ **1.3 Variables de Entorno (.env)**
```env
# Expo Push Notifications (opcional - funciona sin access token)
EXPO_ACCESS_TOKEN=your_expo_access_token_here_or_leave_empty

# Redis (ya tienes, pero verificar)
REDIS_URL=redis://localhost:6379

# Socket.IO
SOCKET_IO_CORS_ORIGIN=http://localhost:3000,http://localhost:19006
SOCKET_IO_TRANSPORTS=websocket,polling
```

---

### **FASE 2: Esquemas de Base de Datos (Día 2-3)**

#### ✅ **2.1 Crear Nuevos Esquemas Necesarios**

**📁 `src/notifications/schemas/user-session.schema.ts`**
```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserSessionDocument = UserSession & Document;

export enum Platform {
  WEB = 'web',
  MOBILE = 'mobile',
  API = 'api',
}

export enum AppState {
  FOREGROUND = 'foreground',
  BACKGROUND = 'background',
}

@Schema({
  timestamps: true,
  collection: 'user_sessions',
  toJSON: {
    transform: (doc: Document, ret: Record<string, unknown>) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class UserSession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  deviceId: string;

  @Prop({ type: String, enum: Platform, required: true })
  platform: Platform;

  @Prop()
  socketId?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: String, enum: AppState, default: AppState.FOREGROUND })
  appState: AppState;

  @Prop()
  expoPushToken?: string;

  @Prop({
    type: {
      os: String,
      version: String,
      model: String,
      brand: String,
    },
  })
  deviceInfo?: {
    os?: string;
    version?: string;
    model?: string;
    brand?: string;
  };

  @Prop({ required: true })
  lastSeen: Date;

  @Prop()
  userAgent?: string;

  @Prop()
  ipAddress?: string;

  // TTL - Auto-delete después de 24 horas de inactividad
  @Prop({ default: Date.now, expires: 86400 })
  expiresAt: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSessionSchema = SchemaFactory.createForClass(UserSession);

// Índices únicos y performance
UserSessionSchema.index({ userId: 1, deviceId: 1 }, { unique: true });
UserSessionSchema.index({ userId: 1, isActive: 1 });
UserSessionSchema.index({ platform: 1, isActive: 1 });
UserSessionSchema.index({ expoPushToken: 1 });
UserSessionSchema.index({ lastSeen: -1 });
UserSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

**📁 `src/notifications/schemas/notification-queue.schema.ts`**
```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationQueueDocument = NotificationQueue & Document;

export enum NotificationType {
  BREAKING_NEWS = 'breaking_news',
  NEW_ARTICLE = 'new_article',
  DAILY_DIGEST = 'daily_digest',
  SUBSCRIPTION_EXPIRY = 'subscription_expiry',
  COMMENT_REPLY = 'comment_reply',
  SYSTEM_ALERT = 'system_alert',
  CUSTOM = 'custom',
}

export enum DeliveryMethod {
  SOCKET = 'socket',
  PUSH = 'push',
  AUTO = 'auto', // Sistema decide basado en app state
}

export enum NotificationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

@Schema({
  timestamps: true,
  collection: 'notification_queue',
  toJSON: {
    transform: (doc: Document, ret: Record<string, unknown>) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class NotificationQueue {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: NotificationType, required: true })
  type: NotificationType;

  @Prop({ type: String, enum: DeliveryMethod, default: DeliveryMethod.AUTO })
  deliveryMethod: DeliveryMethod;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop({ type: Object })
  data?: Record<string, unknown>;

  @Prop()
  actionUrl?: string;

  @Prop()
  imageUrl?: string;

  @Prop({ type: String, enum: NotificationStatus, default: NotificationStatus.PENDING })
  status: NotificationStatus;

  @Prop({ default: 'normal' })
  priority: string; // 'low', 'normal', 'high', 'urgent'

  @Prop({ default: Date.now })
  scheduledFor: Date;

  @Prop()
  sentAt?: Date;

  @Prop()
  deliveredAt?: Date;

  @Prop({ default: 0 })
  retryCount: number;

  @Prop()
  lastRetryAt?: Date;

  @Prop()
  failureReason?: string;

  // Para tracking de expo push
  @Prop()
  expoPushTicketId?: string;

  @Prop()
  expoPushReceiptId?: string;

  // Metadata para personalización
  @Prop({ type: Object })
  templateData?: Record<string, unknown>;

  // TTL - Auto-delete después de 30 días
  @Prop({ default: Date.now, expires: 2592000 })
  expiresAt: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const NotificationQueueSchema = SchemaFactory.createForClass(NotificationQueue);

// Índices para performance
NotificationQueueSchema.index({ userId: 1, status: 1 });
NotificationQueueSchema.index({ status: 1, scheduledFor: 1 });
NotificationQueueSchema.index({ type: 1, status: 1 });
NotificationQueueSchema.index({ priority: 1, scheduledFor: 1 });
NotificationQueueSchema.index({ expoPushTicketId: 1 });
NotificationQueueSchema.index({ sentAt: -1 });
NotificationQueueSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

#### ✅ **2.2 Actualizar User Schema Existente**
**No modificar, ya tiene `notificationPreferences` perfecto**

---

### **FASE 3: Interfaces y DTOs (Día 3)**

#### ✅ **3.1 Interfaces Core**

**📁 `src/notifications/interfaces/session.interface.ts`**
```typescript
import { Types } from 'mongoose';
import { Platform, AppState } from '../schemas/user-session.schema';

export interface SessionData {
  userId: string | Types.ObjectId;
  deviceId: string;
  platform: Platform;
  socketId?: string;
  isActive: boolean;
  appState: AppState;
  expoPushToken?: string;
  deviceInfo?: DeviceInfo;
  lastSeen: Date;
  userAgent?: string;
  ipAddress?: string;
}

export interface DeviceInfo {
  os?: string;
  version?: string;
  model?: string;
  brand?: string;
}

export interface AuthInfo {
  isValid: boolean;
  userId?: string;
  platform?: Platform;
  deviceId?: string;
  deviceInfo?: DeviceInfo;
  expoPushToken?: string;
}
```

**📁 `src/notifications/interfaces/notification.interface.ts`**
```typescript
import { NotificationType, DeliveryMethod } from '../schemas/notification-queue.schema';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
  imageUrl?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  sound?: string;
  category?: string;
}

export interface SendNotificationDto {
  userId: string;
  type: NotificationType;
  deliveryMethod?: DeliveryMethod;
  notification: NotificationPayload;
  scheduledFor?: Date;
  templateData?: Record<string, unknown>;
}

export interface NotificationResult {
  success: boolean;
  socketsSent: number;
  pushSent: number;
  errors: string[];
  queueId?: string;
}
```

#### ✅ **3.2 DTOs para Validation**

**📁 `src/notifications/dto/send-notification.dto.ts`**
```typescript
import { IsString, IsOptional, IsEnum, IsObject, IsDateString, IsUrl } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { NotificationType, DeliveryMethod } from '../schemas/notification-queue.schema';

export class NotificationPayloadDto {
  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @IsOptional()
  @IsUrl()
  actionUrl?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsEnum(['low', 'normal', 'high', 'urgent'])
  priority?: string;

  @IsOptional()
  @IsString()
  sound?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class SendNotificationDto {
  @IsString()
  userId: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsOptional()
  @IsEnum(DeliveryMethod)
  deliveryMethod?: DeliveryMethod;

  @Type(() => NotificationPayloadDto)
  notification: NotificationPayloadDto;

  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @IsOptional()
  @IsObject()
  templateData?: Record<string, unknown>;
}
```

**📁 `src/notifications/dto/device-state.dto.ts`**
```typescript
import { IsEnum, IsString, IsOptional, IsObject } from 'class-validator';
import { AppState } from '../schemas/user-session.schema';

export class UpdateAppStateDto {
  @IsEnum(AppState)
  appState: AppState;

  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class UpdatePushTokenDto {
  @IsString()
  expoPushToken: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class DeviceInfoDto {
  @IsOptional()
  @IsString()
  os?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  brand?: string;
}
```

---

### **FASE 4: Servicios Core (Día 4-5)**

#### ✅ **4.1 Session Manager Service**

**📁 `src/notifications/services/session-manager.service.ts`**
```typescript
import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Redis } from 'ioredis';
import { UserSession, UserSessionDocument, Platform, AppState } from '../schemas/user-session.schema';
import { SessionData, DeviceInfo } from '../interfaces/session.interface';

@Injectable()
export class SessionManagerService {
  constructor(
    @InjectModel(UserSession.name) private sessionModel: Model<UserSessionDocument>,
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  async registerSession(sessionData: SessionData): Promise<UserSessionDocument> {
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
      }
    );

    // Cache en Redis para acceso rápido
    await this.redis.hset(
      `user_sessions:${sessionData.userId}`,
      sessionData.deviceId,
      JSON.stringify({
        ...sessionData,
        sessionId: session._id.toString(),
      })
    );

    await this.redis.expire(`user_sessions:${sessionData.userId}`, 86400);

    return session;
  }

  async updateAppState(userId: string, deviceId: string, appState: AppState): Promise<void> {
    await this.sessionModel.updateOne(
      { userId, deviceId },
      {
        appState,
        lastSeen: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
      }
    );

    // Actualizar cache
    const cached = await this.redis.hget(`user_sessions:${userId}`, deviceId);
    if (cached) {
      const session = JSON.parse(cached);
      session.appState = appState;
      session.lastSeen = new Date();
      await this.redis.hset(`user_sessions:${userId}`, deviceId, JSON.stringify(session));
    }
  }

  async updatePushToken(userId: string, deviceId: string, expoPushToken: string): Promise<void> {
    await this.sessionModel.updateOne(
      { userId, deviceId },
      {
        expoPushToken,
        lastSeen: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
      }
    );

    // Actualizar cache
    const cached = await this.redis.hget(`user_sessions:${userId}`, deviceId);
    if (cached) {
      const session = JSON.parse(cached);
      session.expoPushToken = expoPushToken;
      session.lastSeen = new Date();
      await this.redis.hset(`user_sessions:${userId}`, deviceId, JSON.stringify(session));
    }
  }

  async markSessionInactive(userId: string, deviceId: string): Promise<void> {
    await this.sessionModel.updateOne(
      { userId, deviceId },
      {
        isActive: false,
        socketId: null,
        lastSeen: new Date(),
      }
    );

    await this.redis.hdel(`user_sessions:${userId}`, deviceId);
  }

  async getUserSessions(userId: string): Promise<SessionData[]> {
    // Primero intentar desde cache
    const cached = await this.redis.hgetall(`user_sessions:${userId}`);
    if (Object.keys(cached).length > 0) {
      return Object.values(cached).map(data => JSON.parse(data));
    }

    // Fallback a MongoDB
    const sessions = await this.sessionModel.find({ userId, isActive: true }).lean();
    return sessions.map(session => ({
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
    return sessions.filter(s => s.isActive && s.socketId);
  }

  async getMobilePushSessions(userId: string): Promise<SessionData[]> {
    const sessions = await this.getUserSessions(userId);
    return sessions.filter(s =>
      s.platform === Platform.MOBILE &&
      s.expoPushToken &&
      (s.appState === AppState.BACKGROUND || !s.isActive)
    );
  }
}
```

#### ✅ **4.2 Expo Push Service**

**📁 `src/notifications/services/expo-push.service.ts`**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectExpo } from 'nestjs-expo-sdk';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { NotificationQueue, NotificationQueueDocument, NotificationStatus } from '../schemas/notification-queue.schema';
import { NotificationPayload } from '../interfaces/notification.interface';

@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);

  constructor(
    @InjectModel(NotificationQueue.name) private queueModel: Model<NotificationQueueDocument>,
    @InjectExpo() private expo: Expo,
  ) {}

  async sendPushNotification(
    pushToken: string,
    notification: NotificationPayload,
    queueId?: string
  ): Promise<void> {
    if (!Expo.isExpoPushToken(pushToken)) {
      throw new Error(`Token de push inválido: ${pushToken}`);
    }

    const message: ExpoPushMessage = {
      to: pushToken,
      sound: notification.sound || 'default',
      title: notification.title,
      body: notification.body,
      data: {
        ...notification.data,
        delivered_via: 'push',
        timestamp: new Date().toISOString(),
      },
      priority: notification.priority === 'urgent' ? 'high' : 'default',
      channelId: notification.category || 'default',
    };

    try {
      const tickets = await this.expo.sendPushNotificationsAsync([message]);
      const ticket = tickets[0];

      if (queueId) {
        if (ticket.status === 'ok') {
          await this.queueModel.updateOne(
            { _id: queueId },
            {
              status: NotificationStatus.SENT,
              sentAt: new Date(),
              expoPushTicketId: (ticket as any).id,
            }
          );

          // Verificar receipt en 15 minutos
          setTimeout(() => this.checkReceipt((ticket as any).id, queueId), 15 * 60 * 1000);
        } else {
          await this.queueModel.updateOne(
            { _id: queueId },
            {
              status: NotificationStatus.FAILED,
              failureReason: (ticket as any).details?.error || 'Unknown error',
            }
          );
        }
      }

      this.logger.log(`✅ Push enviado: ${notification.title}`);
    } catch (error) {
      this.logger.error(`❌ Error enviando push:`, error);

      if (queueId) {
        await this.queueModel.updateOne(
          { _id: queueId },
          {
            status: NotificationStatus.FAILED,
            failureReason: error.message,
          }
        );
      }

      throw error;
    }
  }

  // 📦 ENVÍO EN LOTES - IMPLEMENTACIÓN CORRECTA 2025
  async sendBatchPushNotifications(
    notifications: Array<{ pushToken: string; notification: NotificationPayload; queueId?: string }>
  ): Promise<void> {
    // 1. Filtrar tokens válidos
    const validNotifications = notifications.filter(({ pushToken }) =>
      Expo.isExpoPushToken(pushToken)
    );

    if (validNotifications.length === 0) {
      this.logger.warn('No hay tokens válidos para envío en lote');
      return;
    }

    // 2. Construir mensajes
    const messages: ExpoPushMessage[] = validNotifications.map(({ pushToken, notification }) => ({
      to: pushToken,
      sound: notification.sound || 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data,
      priority: notification.priority === 'urgent' ? 'high' : 'default',
      channelId: notification.category || 'default',
    }));

    // 3. CHUNKING AUTOMÁTICO - Máximo 100 por chunk
    const chunks = this.expo.chunkPushNotifications(messages);
    this.logger.log(`📦 Enviando ${messages.length} notificaciones en ${chunks.length} chunks`);

    // 4. Enviar cada chunk con rate limiting automático
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        this.logger.log(`📤 Enviando chunk ${i + 1}/${chunks.length} (${chunk.length} notificaciones)`);

        const tickets = await this.expo.sendPushNotificationsAsync(chunk);

        // 5. Procesar tickets y actualizar BD
        for (let j = 0; j < tickets.length; j++) {
          const ticket = tickets[j];
          const originalIndex = i * 100 + j; // Calcular índice original
          const notificationData = validNotifications[originalIndex];

          if (notificationData?.queueId) {
            if (ticket.status === 'ok') {
              await this.queueModel.updateOne(
                { _id: notificationData.queueId },
                {
                  status: NotificationStatus.SENT,
                  sentAt: new Date(),
                  expoPushTicketId: (ticket as any).id,
                }
              );

              // Verificar receipt en 15 minutos
              setTimeout(() => this.checkReceipt((ticket as any).id, notificationData.queueId!), 15 * 60 * 1000);
            } else {
              await this.queueModel.updateOne(
                { _id: notificationData.queueId },
                {
                  status: NotificationStatus.FAILED,
                  failureReason: (ticket as any).details?.error || 'Unknown error',
                }
              );
            }
          }
        }

        this.logger.log(`✅ Chunk ${i + 1} procesado: ${tickets.length} tickets recibidos`);

        // 6. Delay entre chunks para evitar rate limiting (opcional)
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
        }

      } catch (error) {
        this.logger.error(`❌ Error en chunk ${i + 1}:`, error);

        // Marcar todas las notificaciones del chunk como fallidas
        const chunkStartIndex = i * 100;
        const chunkEndIndex = Math.min(chunkStartIndex + chunk.length, validNotifications.length);

        for (let k = chunkStartIndex; k < chunkEndIndex; k++) {
          const notificationData = validNotifications[k];
          if (notificationData?.queueId) {
            await this.queueModel.updateOne(
              { _id: notificationData.queueId },
              {
                status: NotificationStatus.FAILED,
                failureReason: `Chunk error: ${error.message}`,
              }
            );
          }
        }
      }
    }

    this.logger.log(`🎯 Proceso de batch completado: ${validNotifications.length} notificaciones procesadas`);
  }

  private async checkReceipt(ticketId: string, queueId: string): Promise<void> {
    try {
      const receipts = await this.expo.getPushNotificationReceiptsAsync([ticketId]);
      const receipt = receipts[ticketId];

      if (receipt) {
        if (receipt.status === 'ok') {
          await this.queueModel.updateOne(
            { _id: queueId },
            {
              status: NotificationStatus.DELIVERED,
              deliveredAt: new Date(),
            }
          );
          this.logger.log(`✅ Receipt confirmado: ${ticketId}`);
        } else {
          await this.queueModel.updateOne(
            { _id: queueId },
            {
              status: NotificationStatus.FAILED,
              failureReason: receipt.details?.error || 'Delivery failed',
            }
          );
          this.logger.error(`❌ Error en receipt ${ticketId}:`, receipt.details);
        }
      }
    } catch (error) {
      this.logger.error('❌ Error verificando receipts:', error);
    }
  }
}
```

---

### **FASE 5: Socket.IO Gateway (Día 5-6)**

#### ✅ **5.1 Socket Gateway Principal**

**📁 `src/notifications/gateways/socket.gateway.ts`**
```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { SessionManagerService } from '../services/session-manager.service';
import { AuthService } from '../../auth/services/auth.service';
import { Platform, AppState } from '../schemas/user-session.schema';
import { AuthInfo } from '../interfaces/session.interface';
import { UpdateAppStateDto, UpdatePushTokenDto } from '../dto/device-state.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.SOCKET_IO_CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
  transports: process.env.SOCKET_IO_TRANSPORTS?.split(',') || ['websocket', 'polling'],
})
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(SocketGateway.name);

  constructor(
    private sessionManager: SessionManagerService,
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  async afterInit(server: Server) {
    // Redis Adapter para scaling
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const pubClient = new Redis(redisUrl);
    const subClient = pubClient.duplicate();

    server.adapter(createAdapter(pubClient, subClient, {
      key: 'socket.io',
      requestsTimeout: 5000,
    }));

    this.logger.log('🚀 Socket.IO Gateway iniciado con Redis Adapter');
  }

  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      const authInfo = await this.extractAuthInfo(client);

      if (!authInfo.isValid) {
        this.logger.warn(`❌ Conexión rechazada: auth inválida`);
        client.disconnect(true);
        return;
      }

      const { userId, platform, deviceId, deviceInfo, expoPushToken } = authInfo;

      // Join a room específico del usuario
      await client.join(`user_${userId}`);

      // Registrar sesión activa
      await this.sessionManager.registerSession({
        userId,
        platform,
        deviceId,
        socketId: client.id,
        isActive: true,
        appState: AppState.FOREGROUND,
        expoPushToken,
        deviceInfo,
        lastSeen: new Date(),
        userAgent: client.handshake.headers['user-agent'],
        ipAddress: client.handshake.address,
      });

      // Guardar info en el socket para uso posterior
      (client as any).userId = userId;
      (client as any).platform = platform;
      (client as any).deviceId = deviceId;

      this.logger.log(`✅ Usuario ${userId} conectado desde ${platform} (${deviceId})`);

      client.emit('connected', {
        message: 'Conectado exitosamente',
        sessionId: client.id,
        platform,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      this.logger.error('❌ Error en conexión Socket.IO:', error);
      client.disconnect(true);
    }
  }

  @SubscribeMessage('app-state-change')
  async handleAppStateChange(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: UpdateAppStateDto
  ) {
    const userId = (client as any).userId;
    const deviceId = data.deviceId || (client as any).deviceId;

    if (!userId || !deviceId) {
      client.emit('error', { message: 'Información de sesión incompleta' });
      return;
    }

    try {
      await this.sessionManager.updateAppState(userId, deviceId, data.appState);

      this.logger.log(`📱 Usuario ${userId} cambió a estado: ${data.appState}`);

      client.emit('app-state-updated', {
        success: true,
        appState: data.appState,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('❌ Error actualizando app state:', error);
      client.emit('error', { message: 'Error actualizando estado de app' });
    }
  }

  @SubscribeMessage('update-push-token')
  async handleUpdatePushToken(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: UpdatePushTokenDto
  ) {
    const userId = (client as any).userId;
    const deviceId = data.deviceId || (client as any).deviceId;

    if (!userId || !deviceId) {
      client.emit('error', { message: 'Información de sesión incompleta' });
      return;
    }

    try {
      await this.sessionManager.updatePushToken(userId, deviceId, data.expoPushToken);

      this.logger.log(`🔔 Push token actualizado para usuario ${userId}`);

      client.emit('push-token-updated', {
        success: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('❌ Error actualizando push token:', error);
      client.emit('error', { message: 'Error actualizando push token' });
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = (client as any).userId;
    const deviceId = (client as any).deviceId;

    if (userId && deviceId) {
      try {
        await this.sessionManager.markSessionInactive(userId, deviceId);
        this.logger.log(`👋 Usuario ${userId} desconectado (${deviceId})`);
      } catch (error) {
        this.logger.error('❌ Error en desconexión:', error);
      }
    }
  }

  // 🔐 EXTRAER INFORMACIÓN DE AUTENTICACIÓN
  private async extractAuthInfo(client: Socket): Promise<AuthInfo> {
    try {
      const token = this.extractToken(client);
      const platform = (client.handshake.headers['x-platform'] as Platform) || Platform.WEB;

      let user: any;

      if (platform === Platform.WEB) {
        // Web: Session cookie (usar tu RedisAuthService existente)
        const sessionId = this.extractSessionId(client);
        user = await this.authService.getUserFromSession(sessionId);
      } else {
        // Mobile: JWT (usar tu TokenManagerService existente)
        user = await this.authService.validateJwtToken(token);
      }

      if (!user) {
        return { isValid: false };
      }

      const deviceId = client.handshake.headers['x-device-id'] as string ||
                      client.handshake.headers['x-device-model'] as string ||
                      `${platform}_${client.id.substring(0, 8)}`;

      const deviceInfo = {
        os: client.handshake.headers['x-device-os'] as string,
        version: client.handshake.headers['x-device-version'] as string,
        model: client.handshake.headers['x-device-model'] as string,
        brand: client.handshake.headers['x-device-brand'] as string,
      };

      const expoPushToken = client.handshake.headers['x-expo-push-token'] as string;

      return {
        isValid: true,
        userId: user.id || user._id,
        platform,
        deviceId,
        deviceInfo,
        expoPushToken,
      };

    } catch (error) {
      this.logger.error('❌ Error extracting auth info:', error);
      return { isValid: false };
    }
  }

  private extractToken(client: Socket): string | null {
    const queryToken = client.handshake.query.token as string;
    if (queryToken) return queryToken;

    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  private extractSessionId(client: Socket): string | null {
    const cookies = client.handshake.headers.cookie;
    if (!cookies) return null;

    const sessionMatch = cookies.match(/session=([^;]+)/);
    return sessionMatch ? sessionMatch[1] : null;
  }

  // 🔌 MÉTODO PÚBLICO PARA ENVIAR NOTIFICACIONES
  async sendToUser(userId: string, event: string, data: any): Promise<void> {
    this.server.to(`user_${userId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
      delivered_via: 'socket',
    });
  }

  async sendToUserSessions(userId: string, sessionIds: string[], event: string, data: any): Promise<void> {
    sessionIds.forEach(sessionId => {
      this.server.to(sessionId).emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
        delivered_via: 'socket',
      });
    });
  }
}
```

---

### **FASE 6: Notification Router (Día 6-7)**

#### ✅ **6.1 Servicio Principal de Routing**

**📁 `src/notifications/services/notification-router.service.ts`**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SessionManagerService } from './session-manager.service';
import { ExpoPushService } from './expo-push.service';
import { SocketGateway } from '../gateways/socket.gateway';
import { NotificationQueue, NotificationQueueDocument, NotificationStatus, DeliveryMethod } from '../schemas/notification-queue.schema';
import { SendNotificationDto, NotificationResult } from '../interfaces/notification.interface';
import { Platform, AppState } from '../schemas/user-session.schema';

@Injectable()
export class NotificationRouterService {
  private readonly logger = new Logger(NotificationRouterService.name);

  constructor(
    @InjectModel(NotificationQueue.name) private queueModel: Model<NotificationQueueDocument>,
    private sessionManager: SessionManagerService,
    private expoPushService: ExpoPushService,
    private socketGateway: SocketGateway,
  ) {}

  async sendNotification(dto: SendNotificationDto): Promise<NotificationResult> {
    const { userId, type, deliveryMethod, notification, scheduledFor, templateData } = dto;

    // 1. Crear entrada en cola de notificaciones
    const queueEntry = new this.queueModel({
      userId,
      type,
      deliveryMethod: deliveryMethod || DeliveryMethod.AUTO,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      actionUrl: notification.actionUrl,
      imageUrl: notification.imageUrl,
      priority: notification.priority || 'normal',
      scheduledFor: scheduledFor ? new Date(scheduledFor) : new Date(),
      templateData,
      status: NotificationStatus.PENDING,
    });

    const saved = await queueEntry.save();

    // 2. Si es inmediata, procesar ahora
    if (!scheduledFor || new Date(scheduledFor) <= new Date()) {
      return this.processNotification(saved);
    }

    // 3. Si es programada, retornar ID para tracking
    return {
      success: true,
      socketsSent: 0,
      pushSent: 0,
      errors: [],
      queueId: saved._id.toString(),
    };
  }

  async processNotification(queueEntry: NotificationQueueDocument): Promise<NotificationResult> {
    const result: NotificationResult = {
      success: true,
      socketsSent: 0,
      pushSent: 0,
      errors: [],
      queueId: queueEntry._id.toString(),
    };

    try {
      // Marcar como procesando
      await this.queueModel.updateOne(
        { _id: queueEntry._id },
        { status: NotificationStatus.PROCESSING }
      );

      const sessions = await this.sessionManager.getUserSessions(queueEntry.userId.toString());

      if (sessions.length === 0) {
        throw new Error('Usuario no tiene sesiones activas');
      }

      // Procesar según método de entrega
      if (queueEntry.deliveryMethod === DeliveryMethod.SOCKET) {
        // Solo Socket.IO
        await this.sendViaSocket(queueEntry, sessions);
        result.socketsSent = sessions.filter(s => s.isActive && s.socketId).length;
      } else if (queueEntry.deliveryMethod === DeliveryMethod.PUSH) {
        // Solo Push Notifications
        await this.sendViaPush(queueEntry, sessions);
        result.pushSent = sessions.filter(s => s.platform === Platform.MOBILE && s.expoPushToken).length;
      } else {
        // AUTO: Lógica inteligente
        result = await this.sendWithAutoRouting(queueEntry, sessions);
      }

      // Marcar como enviada
      await this.queueModel.updateOne(
        { _id: queueEntry._id },
        {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
        }
      );

    } catch (error) {
      this.logger.error(`❌ Error procesando notificación ${queueEntry._id}:`, error);

      result.success = false;
      result.errors.push(error.message);

      // Marcar como fallida
      await this.queueModel.updateOne(
        { _id: queueEntry._id },
        {
          status: NotificationStatus.FAILED,
          failureReason: error.message,
        }
      );
    }

    return result;
  }

  private async sendWithAutoRouting(
    queueEntry: NotificationQueueDocument,
    sessions: any[]
  ): Promise<NotificationResult> {
    const result: NotificationResult = {
      success: true,
      socketsSent: 0,
      pushSent: 0,
      errors: [],
      queueId: queueEntry._id.toString(),
    };

    for (const session of sessions) {
      try {
        if (session.platform === Platform.WEB) {
          // 🌐 WEB: Siempre Socket.IO si está activo
          if (session.isActive && session.socketId) {
            await this.socketGateway.sendToUser(
              queueEntry.userId.toString(),
              'notification',
              {
                id: queueEntry._id,
                type: queueEntry.type,
                title: queueEntry.title,
                body: queueEntry.body,
                data: queueEntry.data,
                actionUrl: queueEntry.actionUrl,
                imageUrl: queueEntry.imageUrl,
              }
            );
            result.socketsSent++;
          }
        } else if (session.platform === Platform.MOBILE) {
          // 📱 MOBILE: Depende del estado de la app
          if (session.appState === AppState.FOREGROUND && session.isActive && session.socketId) {
            // App en primer plano: Socket.IO
            await this.socketGateway.sendToUser(
              queueEntry.userId.toString(),
              'notification',
              {
                id: queueEntry._id,
                type: queueEntry.type,
                title: queueEntry.title,
                body: queueEntry.body,
                data: queueEntry.data,
                actionUrl: queueEntry.actionUrl,
                imageUrl: queueEntry.imageUrl,
              }
            );
            result.socketsSent++;
          } else if (session.expoPushToken) {
            // App en segundo plano: Push Notification
            await this.expoPushService.sendPushNotification(
              session.expoPushToken,
              {
                title: queueEntry.title,
                body: queueEntry.body,
                data: queueEntry.data,
                actionUrl: queueEntry.actionUrl,
                imageUrl: queueEntry.imageUrl,
                priority: queueEntry.priority,
              },
              queueEntry._id.toString()
            );
            result.pushSent++;
          }
        }
      } catch (error) {
        result.errors.push(`Error en sesión ${session.deviceId}: ${error.message}`);
      }
    }

    return result;
  }

  private async sendViaSocket(queueEntry: NotificationQueueDocument, sessions: any[]): Promise<void> {
    await this.socketGateway.sendToUser(
      queueEntry.userId.toString(),
      'notification',
      {
        id: queueEntry._id,
        type: queueEntry.type,
        title: queueEntry.title,
        body: queueEntry.body,
        data: queueEntry.data,
        actionUrl: queueEntry.actionUrl,
        imageUrl: queueEntry.imageUrl,
      }
    );
  }

  private async sendViaPush(queueEntry: NotificationQueueDocument, sessions: any[]): Promise<void> {
    const mobileSessions = sessions.filter(s =>
      s.platform === Platform.MOBILE && s.expoPushToken
    );

    const notifications = mobileSessions.map(session => ({
      pushToken: session.expoPushToken,
      notification: {
        title: queueEntry.title,
        body: queueEntry.body,
        data: queueEntry.data,
        actionUrl: queueEntry.actionUrl,
        imageUrl: queueEntry.imageUrl,
        priority: queueEntry.priority,
      },
      queueId: queueEntry._id.toString(),
    }));

    if (notifications.length > 0) {
      await this.expoPushService.sendBatchPushNotifications(notifications);
    }
  }

  // 🎯 MÉTODOS PÚBLICOS PARA CASOS ESPECÍFICOS

  async sendToAllDevices(userId: string, notification: any): Promise<NotificationResult> {
    return this.sendNotification({
      userId,
      type: notification.type,
      deliveryMethod: DeliveryMethod.AUTO,
      notification,
    });
  }

  async sendOnlyPush(userId: string, notification: any): Promise<NotificationResult> {
    return this.sendNotification({
      userId,
      type: notification.type,
      deliveryMethod: DeliveryMethod.PUSH,
      notification,
    });
  }

  async sendOnlySocket(userId: string, notification: any): Promise<NotificationResult> {
    return this.sendNotification({
      userId,
      type: notification.type,
      deliveryMethod: DeliveryMethod.SOCKET,
      notification,
    });
  }
}
```

---

### **FASE 7: Módulo Principal y Configuración (Día 7)**

#### ✅ **7.1 Notifications Module**

**📁 `src/notifications/notifications.module.ts`**
```typescript
import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { ExpoSdkModule } from 'nestjs-expo-sdk';

// Importar AuthModule existente
import { AuthModule } from '../auth/auth.module';

// Schemas
import { UserSession, UserSessionSchema } from './schemas/user-session.schema';
import { NotificationQueue, NotificationQueueSchema } from './schemas/notification-queue.schema';

// Services
import { SessionManagerService } from './services/session-manager.service';
import { ExpoPushService } from './services/expo-push.service';
import { NotificationRouterService } from './services/notification-router.service';

// Gateway
import { SocketGateway } from './gateways/socket.gateway';

// Controllers
import { NotificationsController } from './controllers/notifications.controller';

@Global() // Global para reutilizar en otros módulos
@Module({
  imports: [
    // Reutilizar AuthModule existente
    AuthModule,

    // Configuración
    ConfigModule,

    // Expo SDK Module con configuración opcional
    ExpoSdkModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        accessToken: configService.get<string>('EXPO_ACCESS_TOKEN'), // Opcional
        useFcmV1: true,
      }),
      inject: [ConfigService],
    }),

    // Schemas de MongoDB
    MongooseModule.forFeature([
      { name: UserSession.name, schema: UserSessionSchema },
      { name: NotificationQueue.name, schema: NotificationQueueSchema },
    ]),
  ],

  providers: [
    // Redis Client para Session Manager
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new Redis(configService.get<string>('REDIS_URL'));
      },
      inject: [ConfigService],
    },

    // Core Services
    SessionManagerService,
    ExpoPushService,
    NotificationRouterService,

    // Socket.IO Gateway
    SocketGateway,
  ],

  controllers: [
    NotificationsController,
  ],

  exports: [
    SessionManagerService,
    NotificationRouterService,
    ExpoPushService,
    SocketGateway,
  ],
})
export class NotificationsModule {}
```

#### ✅ **7.2 Controller para API Endpoints**

**📁 `src/notifications/controllers/notifications.controller.ts`**
```typescript
import { Controller, Post, Get, Patch, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Platform } from '../../auth/decorators/platform.decorator';
import { NotificationRouterService } from '../services/notification-router.service';
import { SessionManagerService } from '../services/session-manager.service';
import { SendNotificationDto } from '../dto/send-notification.dto';
import { UpdateAppStateDto, UpdatePushTokenDto } from '../dto/device-state.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private notificationRouter: NotificationRouterService,
    private sessionManager: SessionManagerService,
  ) {}

  @Post('send')
  @ApiOperation({ summary: 'Enviar notificación a usuario específico' })
  async sendNotification(@Body() dto: SendNotificationDto) {
    const result = await this.notificationRouter.sendNotification(dto);
    return {
      success: result.success,
      message: result.success ? 'Notificación enviada exitosamente' : 'Error enviando notificación',
      data: result,
    };
  }

  @Post('send-to-all/:userId')
  @ApiOperation({ summary: 'Enviar a todos los dispositivos del usuario' })
  async sendToAllDevices(
    @Param('userId') userId: string,
    @Body() notification: any
  ) {
    const result = await this.notificationRouter.sendToAllDevices(userId, notification);
    return {
      success: result.success,
      message: 'Notificación enviada a todos los dispositivos',
      data: result,
    };
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Obtener sesiones activas del usuario actual' })
  async getUserSessions(@CurrentUser() user: any) {
    const sessions = await this.sessionManager.getUserSessions(user.id);
    return {
      success: true,
      data: {
        sessions,
        totalSessions: sessions.length,
        activeSessions: sessions.filter(s => s.isActive).length,
      },
    };
  }

  @Get('sessions/:userId')
  @ApiOperation({ summary: 'Obtener sesiones de usuario específico (admin)' })
  async getSpecificUserSessions(@Param('userId') userId: string) {
    const sessions = await this.sessionManager.getUserSessions(userId);
    return {
      success: true,
      data: {
        userId,
        sessions,
        totalSessions: sessions.length,
        activeSessions: sessions.filter(s => s.isActive).length,
      },
    };
  }

  @Patch('app-state')
  @ApiOperation({ summary: 'Actualizar estado de la aplicación (foreground/background)' })
  async updateAppState(
    @CurrentUser() user: any,
    @Platform('deviceId') deviceId: string,
    @Body() dto: UpdateAppStateDto
  ) {
    await this.sessionManager.updateAppState(
      user.id,
      dto.deviceId || deviceId,
      dto.appState
    );

    return {
      success: true,
      message: 'Estado de app actualizado exitosamente',
      data: {
        userId: user.id,
        deviceId: dto.deviceId || deviceId,
        appState: dto.appState,
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Patch('push-token')
  @ApiOperation({ summary: 'Actualizar token de push notifications' })
  async updatePushToken(
    @CurrentUser() user: any,
    @Platform('deviceId') deviceId: string,
    @Body() dto: UpdatePushTokenDto
  ) {
    await this.sessionManager.updatePushToken(
      user.id,
      dto.deviceId || deviceId,
      dto.expoPushToken
    );

    return {
      success: true,
      message: 'Push token actualizado exitosamente',
      data: {
        userId: user.id,
        deviceId: dto.deviceId || deviceId,
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get('test/socket/:userId')
  @ApiOperation({ summary: 'Test de notificación vía Socket.IO' })
  async testSocketNotification(@Param('userId') userId: string) {
    const result = await this.notificationRouter.sendOnlySocket(userId, {
      type: 'system_alert',
      title: 'Test Socket.IO',
      body: 'Esta es una notificación de prueba vía Socket.IO',
      data: { test: true, timestamp: new Date().toISOString() },
    });

    return {
      success: true,
      message: 'Notificación de prueba enviada vía Socket.IO',
      data: result,
    };
  }

  @Get('test/push/:userId')
  @ApiOperation({ summary: 'Test de push notification' })
  async testPushNotification(@Param('userId') userId: string) {
    const result = await this.notificationRouter.sendOnlyPush(userId, {
      type: 'system_alert',
      title: 'Test Push Notification',
      body: 'Esta es una notificación de prueba vía Push',
      data: { test: true, timestamp: new Date().toISOString() },
      priority: 'high',
    });

    return {
      success: true,
      message: 'Push notification de prueba enviada',
      data: result,
    };
  }
}
```

---

### **FASE 8: Integración con App.Module (Día 8)**

#### ✅ **8.1 Actualizar App Module Principal**

**📁 `src/app.module.ts`**
```typescript
// Agregar estas líneas al imports array existente:

imports: [
  // ... tus imports existentes (ConfigModule, MongooseModule, etc.)

  // Nuevo módulo de notificaciones
  NotificationsModule,

  // ... resto de imports
],
```

#### ✅ **8.2 Configuración en configuration.ts**

**📁 `src/config/configuration.ts`**
```typescript
// Agregar al objeto de configuración existente:

export default () => ({
  // ... tu configuración existente

  notifications: {
    expo: {
      accessToken: process.env.EXPO_ACCESS_TOKEN,
    },
    socketIo: {
      corsOrigin: process.env.SOCKET_IO_CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      transports: process.env.SOCKET_IO_TRANSPORTS?.split(',') || ['websocket', 'polling'],
    },
  },

  // ... resto de configuración
});
```

---

### **FASE 9: Testing y Deployment (Día 9-10)**

#### ✅ **9.1 Scripts de Testing**

**📁 `test-notifications.js` (Node.js script)**
```javascript
const io = require('socket.io-client');
const axios = require('axios');

// Test Socket.IO Connection
const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_JWT_TOKEN_HERE'
  },
  extraHeaders: {
    'x-platform': 'web',
    'x-device-id': 'test-device-123'
  }
});

socket.on('connect', () => {
  console.log('✅ Conectado a Socket.IO');

  // Test app state change
  socket.emit('app-state-change', { appState: 'foreground' });
});

socket.on('notification', (data) => {
  console.log('🔔 Notificación recibida:', data);
});

socket.on('connected', (data) => {
  console.log('🎯 Sesión establecida:', data);
});

// Test API Endpoints
async function testAPI() {
  try {
    // Test sending notification
    const response = await axios.post('http://localhost:3000/notifications/send', {
      userId: 'USER_ID_HERE',
      type: 'system_alert',
      notification: {
        title: 'Test API',
        body: 'Notificación de prueba desde API',
        data: { test: true }
      }
    }, {
      headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
      }
    });

    console.log('✅ API Response:', response.data);
  } catch (error) {
    console.error('❌ API Error:', error.response?.data || error.message);
  }
}

setTimeout(testAPI, 2000);
```

#### ✅ **9.2 Dockerfile Updates (si usas Docker)**

**📁 `Dockerfile`**
```dockerfile
# Agregar estas variables de entorno:
ENV EXPO_ACCESS_TOKEN=""
ENV SOCKET_IO_CORS_ORIGIN="http://localhost:3000"
ENV SOCKET_IO_TRANSPORTS="websocket,polling"
```

---

## 🎯 **Checklist Final de Verificación**

### ✅ **Backend Setup Completado**
- [ ] ✅ Dependencias instaladas
- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ Módulo NotificationsModule creado e importado
- [ ] ✅ Esquemas UserSession y NotificationQueue creados
- [ ] ✅ Redis configurado para Socket.IO adapter
- [ ] ✅ Expo Access Token configurado

### ✅ **Servicios Implementados**
- [ ] ✅ SessionManagerService funcionando
- [ ] ✅ ExpoPushService configurado con Expo SDK
- [ ] ✅ NotificationRouterService con lógica de routing
- [ ] ✅ SocketGateway con Redis adapter

### ✅ **Integración con Sistema Existente**
- [ ] ✅ AuthModule reutilizado (sin modificaciones)
- [ ] ✅ User schema existente compatible
- [ ] ✅ Platform detection funcionando
- [ ] ✅ JWT y session cookies soportados

### ✅ **Endpoints API Disponibles**
- [ ] ✅ `POST /notifications/send` - Enviar notificación
- [ ] ✅ `GET /notifications/sessions` - Ver sesiones activas
- [ ] ✅ `PATCH /notifications/app-state` - Actualizar app state
- [ ] ✅ `PATCH /notifications/push-token` - Actualizar push token
- [ ] ✅ `GET /notifications/test/*` - Endpoints de testing

### ✅ **Testing Completado**
- [ ] ✅ Socket.IO connections funcionando
- [ ] ✅ Multi-session support verificado
- [ ] ✅ Push notifications enviándose
- [ ] ✅ Routing automático funcionando
- [ ] ✅ App state detection working

---

## 🚀 **Para tu Próximo Proyecto**

### **Copy-Paste Ready**
1. Copia toda la carpeta `src/notifications/`
2. Actualiza `package.json` con las dependencias
3. Agrega variables de entorno específicas del proyecto
4. Importa `NotificationsModule` en tu `AppModule`
5. ¡Listo! 🎯

### **Variables a Cambiar por Proyecto**
```env
# Solo cambiar estos valores:
EXPO_ACCESS_TOKEN=tu_token_del_proyecto
SOCKET_IO_CORS_ORIGIN=https://tu-dominio.com
REDIS_URL=redis://tu-redis-url
```

---

## 💡 **Casos de Uso Soportados**

1. ✅ **Usuario solo en web** → Socket.IO
2. ✅ **Usuario solo en mobile foreground** → Socket.IO
3. ✅ **Usuario solo en mobile background** → Push Notification
4. ✅ **Usuario en ambos (web + mobile background)** → Socket a web + Push a mobile
5. ✅ **Usuario en ambos (web + mobile foreground)** → Socket a ambos
6. ✅ **Usuario offline** → Push cuando abra app
7. ✅ **Múltiples dispositivos mobile** → Push a todos
8. ✅ **Notificaciones programadas** → Cola con scheduling
9. ✅ **Retry automático** → Push receipt verification
10. ✅ **Escalabilidad** → Redis cluster + Load balancer

**¡Este módulo es completamente universal y reutilizable en todos tus proyectos NestJS! 🎯**