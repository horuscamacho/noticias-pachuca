import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import {
  NotificationQueue,
  NotificationQueueDocument,
  NotificationStatus,
} from '../schemas/notification-queue.schema';
import { NotificationPayload } from '../interfaces/notification.interface';

@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);

  private expo: Expo;

  constructor(
    @InjectModel(NotificationQueue.name)
    private queueModel: Model<NotificationQueueDocument>,
  ) {
    this.expo = new Expo();
  }

  async sendPushNotification(
    pushToken: string,
    notification: NotificationPayload,
    queueId?: string,
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
            },
          );

          // Verificar receipt en 15 minutos
          setTimeout(
            () => this.checkReceipt((ticket as any).id, queueId),
            15 * 60 * 1000,
          );
        } else {
          await this.queueModel.updateOne(
            { _id: queueId },
            {
              status: NotificationStatus.FAILED,
              failureReason: (ticket as any).details?.error || 'Unknown error',
            },
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
          },
        );
      }

      throw error;
    }
  }

  // 📦 ENVÍO EN LOTES - IMPLEMENTACIÓN CORRECTA 2025
  async sendBatchPushNotifications(
    notifications: Array<{
      pushToken: string;
      notification: NotificationPayload;
      queueId?: string;
    }>,
  ): Promise<void> {
    // 1. Filtrar tokens válidos
    const validNotifications = notifications.filter(({ pushToken }) =>
      Expo.isExpoPushToken(pushToken),
    );

    if (validNotifications.length === 0) {
      this.logger.warn('No hay tokens válidos para envío en lote');
      return;
    }

    // 2. Construir mensajes
    const messages: ExpoPushMessage[] = validNotifications.map(
      ({ pushToken, notification }) => ({
        to: pushToken,
        sound: notification.sound || 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data,
        priority: notification.priority === 'urgent' ? 'high' : 'default',
        channelId: notification.category || 'default',
      }),
    );

    // 3. CHUNKING AUTOMÁTICO - Máximo 100 por chunk
    const chunks = this.expo.chunkPushNotifications(messages);
    this.logger.log(
      `📦 Enviando ${messages.length} notificaciones en ${chunks.length} chunks`,
    );

    // 4. Enviar cada chunk con rate limiting automático
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        this.logger.log(
          `📤 Enviando chunk ${i + 1}/${chunks.length} (${chunk.length} notificaciones)`,
        );

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
                },
              );

              // Verificar receipt en 15 minutos
              setTimeout(
                () =>
                  this.checkReceipt(
                    (ticket as any).id,
                    notificationData.queueId!,
                  ),
                15 * 60 * 1000,
              );
            } else {
              await this.queueModel.updateOne(
                { _id: notificationData.queueId },
                {
                  status: NotificationStatus.FAILED,
                  failureReason:
                    (ticket as any).details?.error || 'Unknown error',
                },
              );
            }
          }
        }

        this.logger.log(
          `✅ Chunk ${i + 1} procesado: ${tickets.length} tickets recibidos`,
        );

        // 6. Delay entre chunks para evitar rate limiting (opcional)
        if (i < chunks.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms delay
        }
      } catch (error) {
        this.logger.error(`❌ Error en chunk ${i + 1}:`, error);

        // Marcar todas las notificaciones del chunk como fallidas
        const chunkStartIndex = i * 100;
        const chunkEndIndex = Math.min(
          chunkStartIndex + chunk.length,
          validNotifications.length,
        );

        for (let k = chunkStartIndex; k < chunkEndIndex; k++) {
          const notificationData = validNotifications[k];
          if (notificationData?.queueId) {
            await this.queueModel.updateOne(
              { _id: notificationData.queueId },
              {
                status: NotificationStatus.FAILED,
                failureReason: `Chunk error: ${error.message}`,
              },
            );
          }
        }
      }
    }

    this.logger.log(
      `🎯 Proceso de batch completado: ${validNotifications.length} notificaciones procesadas`,
    );
  }

  private async checkReceipt(ticketId: string, queueId: string): Promise<void> {
    try {
      const receipts = await this.expo.getPushNotificationReceiptsAsync([
        ticketId,
      ]);
      const receipt = receipts[ticketId];

      if (receipt) {
        if (receipt.status === 'ok') {
          await this.queueModel.updateOne(
            { _id: queueId },
            {
              status: NotificationStatus.DELIVERED,
              deliveredAt: new Date(),
            },
          );
          this.logger.log(`✅ Receipt confirmado: ${ticketId}`);
        } else {
          await this.queueModel.updateOne(
            { _id: queueId },
            {
              status: NotificationStatus.FAILED,
              failureReason: receipt.details?.error || 'Delivery failed',
            },
          );
          this.logger.error(
            `❌ Error en receipt ${ticketId}:`,
            receipt.details,
          );
        }
      }
    } catch (error) {
      this.logger.error('❌ Error verificando receipts:', error);
    }
  }
}
