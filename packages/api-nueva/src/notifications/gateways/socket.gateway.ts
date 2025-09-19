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
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { SessionManagerService } from '../services/session-manager.service';
import { TokenManagerService } from '../../auth/services/token-manager.service';
import { RedisAuthService } from '../../auth/services/redis-auth.service';
import { Platform, AppState } from '../schemas/user-session.schema';
import { AuthInfo } from '../interfaces/session.interface';
import { UpdateAppStateDto, UpdatePushTokenDto } from '../dto/device-state.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.SOCKET_IO_CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
    ],
    credentials: true,
  },
  transports: process.env.SOCKET_IO_TRANSPORTS?.split(',') || [
    'websocket',
    'polling',
  ],
})
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(SocketGateway.name);

  constructor(
    private sessionManager: SessionManagerService,
    private tokenManager: TokenManagerService,
    private redisAuth: RedisAuthService,
    private configService: ConfigService,
  ) {}

  async afterInit(server: Server) {
    // Redis Adapter para scaling
    const redisUrl =
      this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    const pubClient = new Redis(redisUrl);
    const subClient = pubClient.duplicate();

    server.adapter(
      createAdapter(pubClient, subClient, {
        key: 'socket.io',
        requestsTimeout: 5000,
      }),
    );

    this.logger.log('🚀 Socket.IO Gateway iniciado con Redis Adapter');
  }

  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      this.logger.debug(`🔍 [DEBUG] Intentando conectar cliente: ${client.id}`);
      this.logger.debug(
        `🔍 [DEBUG] Headers recibidos:`,
        JSON.stringify(client.handshake.headers, null, 2),
      );
      this.logger.debug(
        `🔍 [DEBUG] Query params:`,
        JSON.stringify(client.handshake.query, null, 2),
      );

      const authInfo = await this.extractAuthInfo(client);

      this.logger.debug(
        `🔍 [DEBUG] AuthInfo resultado:`,
        JSON.stringify(authInfo, null, 2),
      );

      if (!authInfo.isValid) {
        this.logger.warn(
          `❌ Conexión rechazada: auth inválida para cliente ${client.id}`,
        );
        client.disconnect(true);
        return;
      }

      const { userId, platform, deviceId, deviceInfo, expoPushToken } =
        authInfo;

      if (!userId || !platform || !deviceId) {
        this.logger.warn('❌ Información de auth incompleta');
        client.disconnect(true);
        return;
      }

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

      this.logger.log(
        `✅ Usuario ${userId} conectado desde ${platform} (${deviceId})`,
      );

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
    @MessageBody() data: UpdateAppStateDto,
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
    @MessageBody() data: UpdatePushTokenDto,
  ) {
    const userId = (client as any).userId;
    const deviceId = data.deviceId || (client as any).deviceId;

    if (!userId || !deviceId) {
      client.emit('error', { message: 'Información de sesión incompleta' });
      return;
    }

    try {
      await this.sessionManager.updatePushToken(
        userId,
        deviceId,
        data.expoPushToken,
      );

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
      const platform =
        (client.handshake.headers['x-platform'] as Platform) || Platform.WEB;

      this.logger.debug(
        `🔍 [DEBUG] Token extraído: ${token ? `${token.substring(0, 20)}...` : 'null'}`,
      );
      this.logger.debug(`🔍 [DEBUG] Platform detectado: ${platform}`);

      let user: any;

      if (platform === Platform.WEB) {
        this.logger.debug(`🔍 [DEBUG] Procesando autenticación WEB`);

        // Intentar primero con JWT token (para dashboard web)
        if (token) {
          this.logger.debug(`🔍 [DEBUG] Intentando validar JWT token para WEB`);
          try {
            const result = await this.tokenManager.validateAccessToken(token);
            this.logger.debug(
              `🔍 [DEBUG] Resultado validación JWT:`,
              JSON.stringify(result, null, 2),
            );
            if (result.isValid && result.payload) {
              user = { id: result.payload.sub };
              this.logger.debug(
                `🔍 [DEBUG] Usuario encontrado via JWT: ${user.id}`,
              );
            }
          } catch (error) {
            this.logger.debug(`🔍 [DEBUG] Error validando JWT:`, error);
          }
        }

        // Si no hay JWT válido, intentar con session cookie
        if (!user) {
          this.logger.debug(
            `🔍 [DEBUG] Intentando validar session cookie para WEB`,
          );
          const sessionId = this.extractSessionId(client);
          this.logger.debug(`🔍 [DEBUG] SessionId extraído: ${sessionId}`);
          if (sessionId) {
            // Usar RedisAuthService para validar session
            const sessionData = await this.redisAuth.getSession(sessionId);
            this.logger.debug(
              `🔍 [DEBUG] SessionData obtenido:`,
              JSON.stringify(sessionData, null, 2),
            );
            if (sessionData && sessionData.userId) {
              user = { id: sessionData.userId };
              this.logger.debug(
                `🔍 [DEBUG] Usuario encontrado via session: ${user.id}`,
              );
            }
          }
        }
      } else {
        this.logger.debug(`🔍 [DEBUG] Procesando autenticación MOBILE`);
        // Mobile: JWT (usar TokenManagerService existente)
        if (token) {
          try {
            const result = await this.tokenManager.validateAccessToken(token);
            this.logger.debug(
              `🔍 [DEBUG] Resultado validación JWT mobile:`,
              JSON.stringify(result, null, 2),
            );
            if (result.isValid && result.payload) {
              user = { id: result.payload.sub };
              this.logger.debug(
                `🔍 [DEBUG] Usuario mobile encontrado: ${user.id}`,
              );
            }
          } catch (error) {
            this.logger.debug(`🔍 [DEBUG] Error validando JWT mobile:`, error);
          }
        }
      }

      if (!user) {
        this.logger.debug(`🔍 [DEBUG] No se encontró usuario válido`);
        return { isValid: false };
      }

      const deviceId =
        (client.handshake.headers['x-device-id'] as string) ||
        (client.handshake.headers['x-device-model'] as string) ||
        `${platform}_${client.id.substring(0, 8)}`;

      const deviceInfo = {
        os: client.handshake.headers['x-device-os'] as string,
        version: client.handshake.headers['x-device-version'] as string,
        model: client.handshake.headers['x-device-model'] as string,
        brand: client.handshake.headers['x-device-brand'] as string,
      };

      const expoPushToken = client.handshake.headers[
        'x-expo-push-token'
      ] as string;

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
      this.logger.debug(
        `🔍 [DEBUG] Error completo:`,
        JSON.stringify(error, null, 2),
      );
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

  async sendToUserSessions(
    userId: string,
    sessionIds: string[],
    event: string,
    data: any,
  ): Promise<void> {
    sessionIds.forEach((sessionId) => {
      this.server.to(sessionId).emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
        delivered_via: 'socket',
      });
    });
  }
}
