# 🚀 Arquitectura de Notificaciones NestJS 2025/2026
## Socket.IO + Push Notifications + Redis Multi-Session

---

## 📋 Análisis del Sistema Actual

### ✅ Sistema de Autenticación Existente (Perfecto para nuestra implementación)

**Arquitectura Dual Ya Implementada:**
- 🌐 **Web**: Session cookies + Redis sessions
- 📱 **Mobile**: JWT Strategy + Token management
- 🔍 **Platform Detection**: `PlatformDetectionService` con headers `x-platform`
- 🛡️ **Redis Auth Service**: Gestión de sesiones existente

**Servicios Disponibles:**
```typescript
- AuthService
- TokenManagerService
- PlatformDetectionService (detecta web/mobile/api)
- RedisAuthService (gestión de sesiones)
```

---

## 🎯 Arquitectura Recomendada 2025/2026

### 1. **Estructura de Módulos**

```
src/notifications/
├── notifications.module.ts
├── gateways/
│   ├── socket.gateway.ts
│   └── socket-auth.guard.ts
├── services/
│   ├── notification.service.ts
│   ├── session-manager.service.ts
│   ├── expo-push.service.ts
│   └── notification-router.service.ts
├── interfaces/
│   ├── notification.interface.ts
│   └── session.interface.ts
├── dto/
│   ├── send-notification.dto.ts
│   └── device-state.dto.ts
└── decorators/
    └── socket-user.decorator.ts
```

### 2. **Módulo Principal**

```typescript
// notifications.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
  imports: [
    AuthModule, // Reutilizar servicios existentes
    ConfigModule,
  ],
  providers: [
    // Socket.IO Gateway
    SocketGateway,
    SocketAuthGuard,

    // Core Services
    NotificationService,
    SessionManagerService,
    ExpoService,
    NotificationRouterService,

    // Redis Providers
    {
      provide: 'REDIS_PUBLISHER',
      useFactory: (config: ConfigService) => {
        const redis = new Redis(config.get('redis.url'));
        return redis;
      },
      inject: [ConfigService],
    },
    {
      provide: 'REDIS_SUBSCRIBER',
      useFactory: (config: ConfigService) => {
        const redis = new Redis(config.get('redis.url'));
        return redis;
      },
      inject: [ConfigService],
    },
  ],
  exports: [
    NotificationService,
    SessionManagerService,
  ],
})
export class NotificationsModule {}
```

---

## 🔌 Socket.IO Gateway con Redis Adapter

### **Gateway Principal**

```typescript
// gateways/socket.gateway.ts
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
import { UseGuards, Inject } from '@nestjs/common';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';

@UseGuards(SocketAuthGuard)
@WebSocketGateway({
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://app.noticias-pachuca.com']
      : ['http://localhost:3000', 'http://localhost:19006'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private sessionManager: SessionManagerService,
    private authService: AuthService,
    @Inject('REDIS_PUBLISHER') private redisPub: Redis,
    @Inject('REDIS_SUBSCRIBER') private redisSub: Redis,
  ) {}

  // 🔧 INICIALIZACIÓN CON REDIS ADAPTER
  async afterInit(server: Server) {
    // Redis Adapter con Sharded Pub/Sub (Redis 7.0+)
    server.adapter(createAdapter(this.redisPub, this.redisSub, {
      key: 'socket.io',
      requestsTimeout: 5000,
    }));

    console.log('🚀 Socket.IO Gateway iniciado con Redis Adapter');
  }

  // 👤 CONEXIÓN DE CLIENTE
  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      // Extraer info de autenticación
      const authInfo = await this.extractAuthInfo(client);

      if (!authInfo.isValid) {
        client.disconnect(true);
        return;
      }

      const { userId, platform, deviceId, deviceInfo } = authInfo;

      // Join a room específico del usuario
      await client.join(`user_${userId}`);

      // Registrar sesión activa
      await this.sessionManager.registerSession(userId, {
        socketId: client.id,
        platform,
        deviceId,
        deviceInfo,
        isActive: true,
        appState: 'foreground', // Default
        lastSeen: new Date(),
        expoPushToken: authInfo.expoPushToken,
      });

      console.log(`✅ Usuario ${userId} conectado desde ${platform} (${deviceId})`);

      // Notificar al usuario que está conectado
      client.emit('connected', {
        message: 'Conectado exitosamente',
        sessionId: client.id,
        platform,
      });

    } catch (error) {
      console.error('❌ Error en conexión Socket.IO:', error);
      client.disconnect(true);
    }
  }

  // 📱 CAMBIO DE ESTADO DE APP (foreground/background)
  @SubscribeMessage('app-state-change')
  async handleAppStateChange(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { appState: 'foreground' | 'background' }
  ) {
    const userId = (client as any).userId;
    const deviceId = (client as any).deviceId;

    await this.sessionManager.updateAppState(userId, deviceId, data.appState);

    console.log(`📱 Usuario ${userId} cambió a estado: ${data.appState}`);
  }

  // 🔔 ACTUALIZAR PUSH TOKEN
  @SubscribeMessage('update-push-token')
  async handleUpdatePushToken(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { expoPushToken: string }
  ) {
    const userId = (client as any).userId;
    const deviceId = (client as any).deviceId;

    await this.sessionManager.updatePushToken(userId, deviceId, data.expoPushToken);

    client.emit('push-token-updated', { success: true });
  }

  // 🚪 DESCONEXIÓN
  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = (client as any).userId;
    const deviceId = (client as any).deviceId;

    if (userId && deviceId) {
      await this.sessionManager.markSessionInactive(userId, deviceId);
      console.log(`👋 Usuario ${userId} desconectado (${deviceId})`);
    }
  }

  // 🔐 EXTRAER INFORMACIÓN DE AUTENTICACIÓN
  private async extractAuthInfo(client: Socket): Promise<AuthInfo> {
    try {
      // 1. Obtener token desde query, headers o cookies
      const token = this.extractToken(client);
      const platform = client.handshake.headers['x-platform'] as Platform || 'web';

      // 2. Validar según plataforma
      let user: any;

      if (platform === 'web') {
        // Web: Session cookie
        const sessionId = client.handshake.headers.cookie;
        user = await this.authService.getUserFromSession(sessionId);
      } else {
        // Mobile: JWT
        user = await this.authService.validateJwtToken(token);
      }

      if (!user) {
        return { isValid: false };
      }

      // 3. Extraer device info
      const deviceId = client.handshake.headers['x-device-id'] as string ||
                      client.handshake.headers['x-device-model'] as string ||
                      `${platform}_${client.id.substring(0, 8)}`;

      const deviceInfo = {
        os: client.handshake.headers['x-device-os'] as string,
        version: client.handshake.headers['x-device-version'] as string,
        model: client.handshake.headers['x-device-model'] as string,
      };

      const expoPushToken = client.handshake.headers['x-expo-push-token'] as string;

      // Guardar en el socket para uso posterior
      (client as any).userId = user.id;
      (client as any).platform = platform;
      (client as any).deviceId = deviceId;

      return {
        isValid: true,
        userId: user.id,
        platform,
        deviceId,
        deviceInfo,
        expoPushToken,
      };

    } catch (error) {
      console.error('❌ Error extracting auth info:', error);
      return { isValid: false };
    }
  }

  private extractToken(client: Socket): string | null {
    // Desde query params
    const queryToken = client.handshake.query.token as string;
    if (queryToken) return queryToken;

    // Desde headers Authorization
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }
}
```

---

## 🗄️ Gestión de Sesiones Multi-Dispositivo

### **Session Manager Service**

```typescript
// services/session-manager.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';

export interface SessionData {
  socketId?: string;
  platform: 'web' | 'mobile';
  deviceId: string;
  deviceInfo?: {
    os?: string;
    version?: string;
    model?: string;
  };
  isActive: boolean;
  appState: 'foreground' | 'background';
  lastSeen: Date;
  expoPushToken?: string;
}

@Injectable()
export class SessionManagerService {
  constructor(
    @Inject('REDIS_PUBLISHER') private redis: Redis,
  ) {}

  // 📝 REGISTRAR NUEVA SESIÓN
  async registerSession(userId: string, sessionData: SessionData): Promise<void> {
    const sessionKey = `user_sessions:${userId}`;
    const deviceKey = `${sessionData.platform}:${sessionData.deviceId}`;

    const sessionInfo = {
      ...sessionData,
      timestamp: Date.now(),
      lastSeen: sessionData.lastSeen.toISOString(),
    };

    // Guardar sesión con TTL de 24 horas
    await this.redis.hset(sessionKey, deviceKey, JSON.stringify(sessionInfo));
    await this.redis.expire(sessionKey, 86400); // 24 horas

    // Actualizar índice de usuarios activos
    await this.redis.sadd('active_users', userId);
  }

  // 📱 ACTUALIZAR ESTADO DE APP
  async updateAppState(userId: string, deviceId: string, appState: 'foreground' | 'background'): Promise<void> {
    const sessions = await this.getUserSessions(userId);
    const session = sessions.find(s => s.deviceId === deviceId);

    if (session) {
      session.appState = appState;
      session.lastSeen = new Date();

      const sessionKey = `user_sessions:${userId}`;
      const deviceKey = `${session.platform}:${deviceId}`;

      await this.redis.hset(sessionKey, deviceKey, JSON.stringify({
        ...session,
        lastSeen: session.lastSeen.toISOString(),
        timestamp: Date.now(),
      }));
    }
  }

  // 🔔 ACTUALIZAR PUSH TOKEN
  async updatePushToken(userId: string, deviceId: string, expoPushToken: string): Promise<void> {
    const sessions = await this.getUserSessions(userId);
    const session = sessions.find(s => s.deviceId === deviceId);

    if (session) {
      session.expoPushToken = expoPushToken;
      session.lastSeen = new Date();

      const sessionKey = `user_sessions:${userId}`;
      const deviceKey = `${session.platform}:${deviceId}`;

      await this.redis.hset(sessionKey, deviceKey, JSON.stringify({
        ...session,
        lastSeen: session.lastSeen.toISOString(),
        timestamp: Date.now(),
      }));
    }
  }

  // ❌ MARCAR SESIÓN COMO INACTIVA
  async markSessionInactive(userId: string, deviceId: string): Promise<void> {
    const sessions = await this.getUserSessions(userId);
    const session = sessions.find(s => s.deviceId === deviceId);

    if (session) {
      session.isActive = false;
      session.lastSeen = new Date();

      const sessionKey = `user_sessions:${userId}`;
      const deviceKey = `${session.platform}:${deviceId}`;

      await this.redis.hset(sessionKey, deviceKey, JSON.stringify({
        ...session,
        lastSeen: session.lastSeen.toISOString(),
        timestamp: Date.now(),
      }));
    }

    // Si no hay más sesiones activas, remover de usuarios activos
    const activeSessions = sessions.filter(s => s.isActive && s.deviceId !== deviceId);
    if (activeSessions.length === 0) {
      await this.redis.srem('active_users', userId);
    }
  }

  // 📊 OBTENER SESIONES DE USUARIO
  async getUserSessions(userId: string): Promise<SessionData[]> {
    const sessionKey = `user_sessions:${userId}`;
    const sessionsHash = await this.redis.hgetall(sessionKey);

    return Object.values(sessionsHash)
      .map(data => {
        const parsed = JSON.parse(data);
        return {
          ...parsed,
          lastSeen: new Date(parsed.lastSeen),
        };
      })
      .filter(session => {
        // Filtrar sesiones expiradas (más de 1 hora inactivas)
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return session.lastSeen > hourAgo;
      });
  }

  // 🎯 OBTENER SESIONES ACTIVAS
  async getActiveSessions(userId: string): Promise<SessionData[]> {
    const sessions = await this.getUserSessions(userId);
    return sessions.filter(session => session.isActive);
  }

  // 📱 OBTENER SESIONES MOBILE CON PUSH TOKEN
  async getMobileSessionsWithPushToken(userId: string): Promise<SessionData[]> {
    const sessions = await this.getUserSessions(userId);
    return sessions.filter(session =>
      session.platform === 'mobile' &&
      session.expoPushToken
    );
  }

  // 🌐 OBTENER SESIONES WEB ACTIVAS
  async getWebActiveSessions(userId: string): Promise<SessionData[]> {
    const sessions = await this.getActiveSessions(userId);
    return sessions.filter(session => session.platform === 'web');
  }

  // 🧹 LIMPIAR SESIONES EXPIRADAS
  async cleanExpiredSessions(): Promise<void> {
    const activeUsers = await this.redis.smembers('active_users');

    for (const userId of activeUsers) {
      const sessions = await this.getUserSessions(userId);

      if (sessions.length === 0) {
        // No hay sesiones válidas, remover de usuarios activos
        await this.redis.srem('active_users', userId);
        await this.redis.del(`user_sessions:${userId}`);
      }
    }
  }
}
```

---

## 🔔 Servicio de Notificaciones Inteligente

### **Notification Router Service**

```typescript
// services/notification-router.service.ts
import { Injectable } from '@nestjs/common';
import { SessionManagerService } from './session-manager.service';
import { ExpoService } from './expo.service';
import { SocketGateway } from '../gateways/socket.gateway';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: 'normal' | 'high';
  category?: string;
  sound?: string;
}

@Injectable()
export class NotificationRouterService {
  constructor(
    private sessionManager: SessionManagerService,
    private expoService: ExpoService,
    private socketGateway: SocketGateway,
  ) {}

  // 🎯 ENVIAR NOTIFICACIÓN INTELIGENTE
  async sendNotification(userId: string, notification: NotificationPayload): Promise<{
    socketsSent: number;
    pushSent: number;
    errors: string[];
  }> {
    const sessions = await this.sessionManager.getUserSessions(userId);
    const results = {
      socketsSent: 0,
      pushSent: 0,
      errors: [],
    };

    for (const session of sessions) {
      try {
        if (session.platform === 'web') {
          // 🌐 WEB: Siempre Socket.IO si está activo
          if (session.isActive && session.socketId) {
            await this.sendSocketNotification(userId, notification);
            results.socketsSent++;
          }
        } else if (session.platform === 'mobile') {
          // 📱 MOBILE: Depende del estado de la app
          if (session.appState === 'foreground' && session.isActive && session.socketId) {
            // App en primer plano y conectada: Socket.IO
            await this.sendSocketNotification(userId, notification);
            results.socketsSent++;
          } else if (session.expoPushToken) {
            // App en segundo plano o desconectada: Push Notification
            await this.sendPushNotification(session.expoPushToken, notification);
            results.pushSent++;
          }
        }
      } catch (error) {
        results.errors.push(`Error en sesión ${session.deviceId}: ${error.message}`);
      }
    }

    return results;
  }

  // 🔌 ENVIAR VÍA SOCKET.IO
  private async sendSocketNotification(userId: string, notification: NotificationPayload): Promise<void> {
    this.socketGateway.server
      .to(`user_${userId}`)
      .emit('notification', {
        ...notification,
        timestamp: new Date().toISOString(),
        delivered_via: 'socket',
      });
  }

  // 📲 ENVIAR VÍA PUSH NOTIFICATION
  private async sendPushNotification(pushToken: string, notification: NotificationPayload): Promise<void> {
    await this.expoService.sendPushNotification(pushToken, {
      ...notification,
      delivered_via: 'push',
    });
  }

  // 🎯 ENVIAR A TODOS LOS DISPOSITIVOS (FORZAR)
  async sendToAllDevices(userId: string, notification: NotificationPayload): Promise<void> {
    const sessions = await this.sessionManager.getUserSessions(userId);

    // Enviar a todas las sesiones activas via Socket.IO
    const activeSessions = sessions.filter(s => s.isActive && s.socketId);
    if (activeSessions.length > 0) {
      await this.sendSocketNotification(userId, notification);
    }

    // Enviar push a todos los dispositivos móviles con token
    const mobileSessions = sessions.filter(s => s.platform === 'mobile' && s.expoPushToken);
    for (const session of mobileSessions) {
      await this.sendPushNotification(session.expoPushToken!, notification);
    }
  }

  // 📱 ENVIAR SOLO A MOBILE
  async sendToMobileOnly(userId: string, notification: NotificationPayload): Promise<void> {
    const mobileSessions = await this.sessionManager.getMobileSessionsWithPushToken(userId);

    for (const session of mobileSessions) {
      if (session.appState === 'foreground' && session.isActive && session.socketId) {
        await this.sendSocketNotification(userId, notification);
      } else {
        await this.sendPushNotification(session.expoPushToken!, notification);
      }
    }
  }

  // 🌐 ENVIAR SOLO A WEB
  async sendToWebOnly(userId: string, notification: NotificationPayload): Promise<void> {
    const webSessions = await this.sessionManager.getWebActiveSessions(userId);

    if (webSessions.length > 0) {
      await this.sendSocketNotification(userId, notification);
    }
  }
}
```

---

## 📲 Expo Push Notifications Service

### **Expo Service**

```typescript
// services/expo.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

@Injectable()
export class ExpoService {
  private readonly logger = new Logger(ExpoService.name);
  private expo: Expo;

  constructor(private configService: ConfigService) {
    this.expo = new Expo({
      accessToken: this.configService.get<string>('config.expo.accessToken'),
      useFcmV1: true, // Usar FCM v1 API (recomendado 2025)
    });
  }

  // 📲 ENVIAR PUSH NOTIFICATION
  async sendPushNotification(
    pushToken: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, any>;
      priority?: 'normal' | 'high';
      sound?: string;
      delivered_via?: string;
    }
  ): Promise<void> {
    // Validar token
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
        delivered_via: notification.delivered_via || 'push',
        timestamp: new Date().toISOString(),
      },
      priority: notification.priority || 'normal',
      // Configuraciones adicionales 2025
      channelId: 'default',
      categoryId: notification.data?.category || 'general',
    };

    try {
      const tickets = await this.expo.sendPushNotificationsAsync([message]);

      // Programar verificación de receipts en 15 minutos
      this.scheduleReceiptCheck(tickets);

      this.logger.log(`✅ Push enviado a ${pushToken}: ${notification.title}`);

    } catch (error) {
      this.logger.error(`❌ Error enviando push a ${pushToken}:`, error);

      // Implementar retry con exponential backoff
      await this.retryWithBackoff(async () => {
        return this.expo.sendPushNotificationsAsync([message]);
      }, 3);
    }
  }

  // 📦 ENVÍO EN LOTES (OPTIMIZACIÓN 2025)
  async sendBatchPushNotifications(
    notifications: Array<{
      pushToken: string;
      notification: any;
    }>
  ): Promise<void> {
    // Validar todos los tokens
    const validNotifications = notifications.filter(({ pushToken }) =>
      Expo.isExpoPushToken(pushToken)
    );

    if (validNotifications.length === 0) {
      this.logger.warn('No hay tokens válidos para envío en lote');
      return;
    }

    // Crear mensajes
    const messages: ExpoPushMessage[] = validNotifications.map(({ pushToken, notification }) => ({
      to: pushToken,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data,
      priority: notification.priority || 'normal',
    }));

    // Enviar en chunks de 100 (límite de Expo)
    const chunks = this.expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      try {
        const tickets = await this.expo.sendPushNotificationsAsync(chunk);
        this.scheduleReceiptCheck(tickets);

        this.logger.log(`✅ Lote enviado: ${chunk.length} notificaciones`);
      } catch (error) {
        this.logger.error('❌ Error en lote:', error);
      }
    }
  }

  // 🧾 VERIFICAR RECEIPTS (RELIABILITY 2025)
  private scheduleReceiptCheck(tickets: ExpoPushTicket[]): void {
    const ticketIds = tickets
      .filter((ticket): ticket is ExpoPushTicket & { id: string } =>
        ticket.status === 'ok' && 'id' in ticket
      )
      .map(ticket => ticket.id);

    if (ticketIds.length === 0) return;

    // Verificar en 15 minutos
    setTimeout(async () => {
      try {
        const receipts = await this.expo.getPushNotificationReceiptsAsync(ticketIds);

        for (const [ticketId, receipt] of Object.entries(receipts)) {
          if (receipt.status === 'error') {
            this.logger.error(`❌ Error en receipt ${ticketId}:`, receipt.details);

            // Manejar errores específicos
            if (receipt.details?.error === 'DeviceNotRegistered') {
              // Token inválido, debería removerse de la base de datos
              this.logger.warn(`🗑️ Token inválido detectado: ${ticketId}`);
            }
          } else {
            this.logger.log(`✅ Receipt confirmado: ${ticketId}`);
          }
        }
      } catch (error) {
        this.logger.error('❌ Error verificando receipts:', error);
      }
    }, 15 * 60 * 1000); // 15 minutos
  }

  // 🔄 RETRY CON EXPONENTIAL BACKOFF
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries - 1) break;

        const delay = baseDelay * Math.pow(2, attempt);
        this.logger.warn(`🔄 Retry ${attempt + 1}/${maxRetries} en ${delay}ms`);

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  // 🧹 LIMPIAR TOKENS INVÁLIDOS
  async cleanInvalidTokens(tokens: string[]): Promise<string[]> {
    const validTokens: string[] = [];

    for (const token of tokens) {
      if (Expo.isExpoPushToken(token)) {
        validTokens.push(token);
      } else {
        this.logger.warn(`🗑️ Token inválido removido: ${token}`);
      }
    }

    return validTokens;
  }
}
```

---

## ⚙️ Configuración Redis y Escalabilidad

### **Redis Configuration**

```typescript
// config/redis.config.ts
export const redisConfig = {
  // Para desarrollo
  development: {
    host: 'localhost',
    port: 6379,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
  },

  // Para producción con Redis Cluster
  production: {
    cluster: {
      nodes: [
        { host: 'redis-cluster-1', port: 6379 },
        { host: 'redis-cluster-2', port: 6379 },
        { host: 'redis-cluster-3', port: 6379 },
      ],
      options: {
        redisOptions: {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
        },
      },
    },
    // Habilitar Sharded Pub/Sub (Redis 7.0+)
    sharded: true,
  },
};
```

### **Load Balancer NGINX**

```nginx
# nginx.conf
upstream nestjs_backend {
    # Sticky sessions para WebSockets
    ip_hash;
    server nestjs-1:3000;
    server nestjs-2:3000;
    server nestjs-3:3000;
}

server {
    listen 80;
    server_name api.noticias-pachuca.com;

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://nestjs_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts para WebSockets
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # API routes
    location / {
        proxy_pass http://nestjs_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 📊 Monitoreo y Métricas

### **Health Check y Métricas**

```typescript
// services/notification-metrics.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationMetricsService {
  private metrics = {
    totalSocketConnections: 0,
    totalPushNotificationsSent: 0,
    totalSocketMessagesSent: 0,
    errorCount: 0,
    activeUsers: 0,
  };

  incrementSocketConnections(): void {
    this.metrics.totalSocketConnections++;
  }

  incrementPushNotifications(): void {
    this.metrics.totalPushNotificationsSent++;
  }

  incrementSocketMessages(): void {
    this.metrics.totalSocketMessagesSent++;
  }

  incrementErrors(): void {
    this.metrics.errorCount++;
  }

  setActiveUsers(count: number): void {
    this.metrics.activeUsers = count;
  }

  getMetrics() {
    return { ...this.metrics };
  }

  // Health check endpoint
  async getHealthStatus() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      redis: await this.checkRedisConnection(),
      expo: await this.checkExpoService(),
    };
  }

  private async checkRedisConnection(): Promise<boolean> {
    // Implementar check de Redis
    return true;
  }

  private async checkExpoService(): Promise<boolean> {
    // Implementar check de Expo
    return true;
  }
}
```

---

## 🎯 Integración con Sistema Existente

### **Usando el Sistema de Auth Actual**

```typescript
// Tu controlador existente
@Controller('notifications')
@UseGuards(JwtAuthGuard) // Tu guard existente
export class NotificationsController {
  constructor(
    private notificationRouter: NotificationRouterService,
    private sessionManager: SessionManagerService,
  ) {}

  @Post('send')
  async sendNotification(
    @CurrentUser() user: any, // Tu decorator existente
    @Platform() platform: PlatformInfo, // Tu decorator existente
    @Body() dto: SendNotificationDto,
  ) {
    const result = await this.notificationRouter.sendNotification(
      user.id,
      dto.notification
    );

    return {
      success: true,
      ...result,
    };
  }

  @Get('sessions')
  async getUserSessions(@CurrentUser() user: any) {
    const sessions = await this.sessionManager.getUserSessions(user.id);
    return { sessions };
  }

  @Patch('device/push-token')
  async updatePushToken(
    @CurrentUser() user: any,
    @Platform('deviceId') deviceId: string,
    @Body('pushToken') pushToken: string,
  ) {
    await this.sessionManager.updatePushToken(user.id, deviceId, pushToken);
    return { success: true };
  }
}
```

---

## 🚀 Plan de Implementación Recomendado

### **Fase 1: Base (Semana 1)**
1. ✅ Crear `NotificationsModule`
2. ✅ Implementar `SessionManagerService`
3. ✅ Configurar Redis Adapter básico
4. ✅ Testing inicial con Socket.IO

### **Fase 2: Socket.IO (Semana 2)**
1. ✅ Implementar `SocketGateway` completo
2. ✅ Integrar con sistema de auth existente
3. ✅ Manejo de estados foreground/background
4. ✅ Testing multi-sesión

### **Fase 3: Push Notifications (Semana 3)**
1. ✅ Implementar `ExpoService`
2. ✅ Configurar `NotificationRouterService`
3. ✅ Receipt tracking y retry logic
4. ✅ Testing mobile + web simultáneo

### **Fase 4: Optimización (Semana 4)**
1. ✅ Redis Cluster configuration
2. ✅ Load balancer setup
3. ✅ Métricas y monitoreo
4. ✅ Performance testing

---

## 🎯 Conclusiones y Beneficios

### **✅ Ventajas de esta Arquitectura:**
- **Multi-sesión inteligente**: Un usuario puede estar en web y mobile simultáneamente
- **Routing automático**: Socket.IO para foreground, Push para background
- **Escalabilidad**: Redis Cluster + Load balancer
- **Reliability**: Receipt tracking + retry logic
- **Integración perfecta**: Usa tu sistema de auth existente
- **Performance**: Batch notifications + optimizaciones 2025

### **🔧 Tecnologías 2025/2026:**
- NestJS con decorators avanzados
- Socket.IO con Redis Sharded Pub/Sub
- Expo Push Notifications con FCM v1
- Redis 7.0+ con cluster support
- TypeScript strict mode
- Monitoreo y métricas en tiempo real

### **📱 Casos de Uso Soportados:**
1. Usuario en web → Recibe por Socket.IO
2. Usuario en mobile foreground → Recibe por Socket.IO
3. Usuario en mobile background → Recibe por Push
4. Usuario en ambos → Socket a web + Push a mobile (si background)
5. Usuario offline → Push cuando regrese online

---

## 🚀 **¡Listo para implementar!**

Esta arquitectura aprovecha al máximo tu sistema de autenticación existente y implementa las mejores prácticas de 2025 para notificaciones escalables y confiables.

¿Comenzamos con la implementación, Coyotito? 🎯