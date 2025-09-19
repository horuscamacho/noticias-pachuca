import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

// Importar AuthModule existente
import { AuthModule } from '../auth/auth.module';

// Schemas
import { UserSession, UserSessionSchema } from './schemas/user-session.schema';
import {
  NotificationQueue,
  NotificationQueueSchema,
} from './schemas/notification-queue.schema';

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
        const redisUrl =
          configService.get<string>('config.redis.url') || 'redis://redis:6379';
        return new Redis(redisUrl);
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

  controllers: [NotificationsController],

  exports: [
    SessionManagerService,
    NotificationRouterService,
    ExpoPushService,
    SocketGateway,
  ],
})
export class NotificationsModule {}
