import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SessionManagerService } from './session-manager.service';
import { ExpoPushService } from './expo-push.service';
import { SocketGateway } from '../gateways/socket.gateway';
import {
  NotificationQueue,
  NotificationQueueDocument,
  NotificationStatus,
  DeliveryMethod,
} from '../schemas/notification-queue.schema';
import {
  SendNotificationDto,
  NotificationResult,
} from '../interfaces/notification.interface';
import { Platform, AppState } from '../schemas/user-session.schema';

@Injectable()
export class NotificationRouterService {
  private readonly logger = new Logger(NotificationRouterService.name);

  constructor(
    @InjectModel(NotificationQueue.name)
    private queueModel: Model<NotificationQueueDocument>,
    private sessionManager: SessionManagerService,
    private expoPushService: ExpoPushService,
    private socketGateway: SocketGateway,
  ) {}

  async sendNotification(
    dto: SendNotificationDto,
  ): Promise<NotificationResult> {
    const {
      userId,
      type,
      deliveryMethod,
      notification,
      scheduledFor,
      templateData,
    } = dto;

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
      priority:
        notification.priority ||
        ('normal' as 'low' | 'normal' | 'high' | 'urgent'),
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
      queueId: String(saved._id),
    };
  }

  async processNotification(
    queueEntry: NotificationQueueDocument,
  ): Promise<NotificationResult> {
    let result: NotificationResult = {
      success: true,
      socketsSent: 0,
      pushSent: 0,
      errors: [],
      queueId: String(queueEntry._id),
    };

    try {
      // Marcar como procesando
      await this.queueModel.updateOne(
        { _id: queueEntry._id },
        { status: NotificationStatus.PROCESSING },
      );

      const sessions = await this.sessionManager.getUserSessions(
        String(queueEntry.userId),
      );

      if (sessions.length === 0) {
        throw new Error('Usuario no tiene sesiones activas');
      }

      // Procesar según método de entrega
      if (queueEntry.deliveryMethod === DeliveryMethod.SOCKET) {
        // Solo Socket.IO
        await this.sendViaSocket(queueEntry, sessions);
        result.socketsSent = sessions.filter(
          (s) => s.isActive && s.socketId,
        ).length;
      } else if (queueEntry.deliveryMethod === DeliveryMethod.PUSH) {
        // Solo Push Notifications
        await this.sendViaPush(queueEntry, sessions);
        result.pushSent = sessions.filter(
          (s) => s.platform === Platform.MOBILE && s.expoPushToken,
        ).length;
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
        },
      );
    } catch (error) {
      this.logger.error(
        `❌ Error procesando notificación ${queueEntry._id}:`,
        error,
      );

      result.success = false;
      result.errors.push(error.message);

      // Marcar como fallida
      await this.queueModel.updateOne(
        { _id: queueEntry._id },
        {
          status: NotificationStatus.FAILED,
          failureReason: error.message,
        },
      );
    }

    return result;
  }

  private async sendWithAutoRouting(
    queueEntry: NotificationQueueDocument,
    sessions: any[],
  ): Promise<NotificationResult> {
    const result: NotificationResult = {
      success: true,
      socketsSent: 0,
      pushSent: 0,
      errors: [],
      queueId: String(queueEntry._id),
    };

    for (const session of sessions) {
      try {
        if (session.platform === Platform.WEB) {
          // 🌐 WEB: Siempre Socket.IO si está activo
          if (session.isActive && session.socketId) {
            await this.socketGateway.sendToUser(
              String(queueEntry.userId),
              'notification',
              {
                id: queueEntry._id,
                type: queueEntry.type,
                title: queueEntry.title,
                body: queueEntry.body,
                data: queueEntry.data,
                actionUrl: queueEntry.actionUrl,
                imageUrl: queueEntry.imageUrl,
              },
            );
            result.socketsSent++;
          }
        } else if (session.platform === Platform.MOBILE) {
          // 📱 MOBILE: Depende del estado de la app
          if (
            session.appState === AppState.FOREGROUND &&
            session.isActive &&
            session.socketId
          ) {
            // App en primer plano: Socket.IO
            await this.socketGateway.sendToUser(
              String(queueEntry.userId),
              'notification',
              {
                id: queueEntry._id,
                type: queueEntry.type,
                title: queueEntry.title,
                body: queueEntry.body,
                data: queueEntry.data,
                actionUrl: queueEntry.actionUrl,
                imageUrl: queueEntry.imageUrl,
              },
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
              String(queueEntry._id),
            );
            result.pushSent++;
          }
        }
      } catch (error) {
        result.errors.push(
          `Error en sesión ${session.deviceId}: ${error.message}`,
        );
      }
    }

    return result;
  }

  private async sendViaSocket(
    queueEntry: NotificationQueueDocument,
    sessions: any[],
  ): Promise<void> {
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
      },
    );
  }

  private async sendViaPush(
    queueEntry: NotificationQueueDocument,
    sessions: any[],
  ): Promise<void> {
    const mobileSessions = sessions.filter(
      (s) => s.platform === Platform.MOBILE && s.expoPushToken,
    );

    const notifications = mobileSessions.map((session) => ({
      pushToken: session.expoPushToken,
      notification: {
        title: queueEntry.title,
        body: queueEntry.body,
        data: queueEntry.data,
        actionUrl: queueEntry.actionUrl,
        imageUrl: queueEntry.imageUrl,
        priority: queueEntry.priority,
      },
      queueId: String(queueEntry._id),
    }));

    if (notifications.length > 0) {
      await this.expoPushService.sendBatchPushNotifications(notifications);
    }
  }

  // 🎯 MÉTODOS PÚBLICOS PARA CASOS ESPECÍFICOS

  async sendToAllDevices(
    userId: string,
    notification: any,
  ): Promise<NotificationResult> {
    return this.sendNotification({
      userId,
      type: notification.type,
      deliveryMethod: DeliveryMethod.AUTO,
      notification,
    });
  }

  async sendOnlyPush(
    userId: string,
    notification: any,
  ): Promise<NotificationResult> {
    return this.sendNotification({
      userId,
      type: notification.type,
      deliveryMethod: DeliveryMethod.PUSH,
      notification,
    });
  }

  async sendOnlySocket(
    userId: string,
    notification: any,
  ): Promise<NotificationResult> {
    return this.sendNotification({
      userId,
      type: notification.type,
      deliveryMethod: DeliveryMethod.SOCKET,
      notification,
    });
  }
}
