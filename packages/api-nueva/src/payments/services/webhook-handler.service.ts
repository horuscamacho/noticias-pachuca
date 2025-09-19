import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Stripe from 'stripe';

import { StripeCoreService } from './stripe-core.service';
import { AppConfigService } from '../../config/config.service';

// Importar sistema de notificaciones
import { NotificationRouterService } from '../../notifications/services/notification-router.service';
import {
  NotificationType,
  DeliveryMethod,
} from '../../notifications/schemas/notification-queue.schema';

import {
  TransactionLog,
  TransactionLogDocument,
  TransactionEventType,
} from '../schemas/transaction-log.schema';

import { Payment, PaymentDocument } from '../schemas/payment.schema';

@Injectable()
export class WebhookHandlerService {
  private readonly logger = new Logger(WebhookHandlerService.name);

  constructor(
    @InjectModel(TransactionLog.name)
    private readonly transactionLogModel: Model<TransactionLogDocument>,

    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,

    private readonly stripeService: StripeCoreService,
    private readonly configService: AppConfigService,
    private readonly notificationRouter: NotificationRouterService,
  ) {}

  async processWebhook(body: Buffer, signature: string): Promise<void> {
    try {
      // Verificar firma del webhook
      const event = this.stripeService.constructEvent(
        body,
        signature,
        this.configService.stripeWebhookSecret,
      );

      this.logger.log(`🔗 Procesando webhook: ${event.type} - ID: ${event.id}`);

      // Log del evento recibido
      await this.logWebhookEvent(event, 'RECEIVED');

      // Procesar según el tipo de evento
      await this.handleEvent(event);

      // Log de procesamiento exitoso
      await this.logWebhookEvent(event, 'PROCESSED');

    } catch (error) {
      this.logger.error('❌ Error procesando webhook:', error);

      // Log del error
      await this.logWebhookEvent(
        { id: 'unknown', type: 'unknown' } as unknown as Stripe.Event,
        'FAILED',
        error instanceof Error ? error.message : String(error),
      );

      throw error;
    }
  }

  private async handleEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event);
        break;

      case 'payment_intent.requires_action':
        await this.handlePaymentRequiresAction(event);
        break;

      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event);
        break;

      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(event);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event);
        break;

      default:
        this.logger.warn(`⚠️ Evento no manejado: ${event.type}`);
        break;
    }
  }

  private async handlePaymentSucceeded(event: Stripe.Event): Promise<void> {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    try {
      // Actualizar pago en BD
      const payment = await this.paymentModel.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntent.id },
        {
          status: 'succeeded',
          capturedAt: new Date(),
          captured: true,
        },
        { new: true },
      );

      if (payment) {
        this.logger.log(`✅ Pago actualizado a exitoso: ${payment._id}`);

        // Notificar al usuario
        await this.notificationRouter.sendNotification({
          userId: payment.userId.toString(),
          type: NotificationType.PAYMENT_SUCCESS,
          deliveryMethod: DeliveryMethod.AUTO,
          notification: {
            title: '✅ Pago completado',
            body: `Tu pago de $${(payment.amount / 100).toFixed(2)} ${payment.currency.toUpperCase()} fue procesado exitosamente`,
            data: {
              paymentId: (payment._id as Types.ObjectId).toString(),
              stripePaymentIntentId: paymentIntent.id,
              amount: payment.amount,
              currency: payment.currency,
            },
            priority: 'high',
            actionUrl: `/payments/${payment._id}`,
          },
        });
      }
    } catch (error) {
      this.logger.error('❌ Error actualizando pago exitoso:', error);
    }
  }

  private async handlePaymentFailed(event: Stripe.Event): Promise<void> {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    try {
      // Actualizar pago en BD
      const payment = await this.paymentModel.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntent.id },
        {
          status: 'failed',
          failureCode: paymentIntent.last_payment_error?.code,
          failureMessage: paymentIntent.last_payment_error?.message,
        },
        { new: true },
      );

      if (payment) {
        this.logger.log(`❌ Pago actualizado a fallido: ${payment._id}`);

        // Notificar al usuario
        await this.notificationRouter.sendNotification({
          userId: payment.userId.toString(),
          type: NotificationType.PAYMENT_FAILED,
          deliveryMethod: DeliveryMethod.AUTO,
          notification: {
            title: '❌ Pago fallido',
            body: `Tu pago de $${(payment.amount / 100).toFixed(2)} ${payment.currency.toUpperCase()} no pudo ser procesado`,
            data: {
              paymentId: (payment._id as Types.ObjectId).toString(),
              stripePaymentIntentId: paymentIntent.id,
              error: payment.failureMessage,
            },
            priority: 'high',
            actionUrl: `/payments/${payment._id}`,
          },
        });
      }
    } catch (error) {
      this.logger.error('❌ Error actualizando pago fallido:', error);
    }
  }

  private async handlePaymentRequiresAction(event: Stripe.Event): Promise<void> {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    try {
      const payment = await this.paymentModel.findOne({
        stripePaymentIntentId: paymentIntent.id,
      });

      if (payment) {
        await this.notificationRouter.sendNotification({
          userId: payment.userId.toString(),
          type: NotificationType.PAYMENT_REQUIRES_ACTION,
          deliveryMethod: DeliveryMethod.AUTO,
          notification: {
            title: '🔐 Autenticación requerida',
            body: 'Tu pago requiere autenticación adicional',
            data: {
              paymentId: (payment._id as Types.ObjectId).toString(),
              stripePaymentIntentId: paymentIntent.id,
            },
            priority: 'urgent',
            actionUrl: `/payments/${payment._id}/authenticate`,
          },
        });
      }
    } catch (error) {
      this.logger.error('❌ Error manejando pago que requiere acción:', error);
    }
  }

  private async handleSubscriptionCreated(event: Stripe.Event): Promise<void> {
    this.logger.log('📋 Suscripción creada - TODO: Implementar');
    // TODO: Implementar lógica de suscripción creada
  }

  private async handleSubscriptionUpdated(event: Stripe.Event): Promise<void> {
    this.logger.log('📋 Suscripción actualizada - TODO: Implementar');
    // TODO: Implementar lógica de suscripción actualizada
  }

  private async handleSubscriptionDeleted(event: Stripe.Event): Promise<void> {
    this.logger.log('📋 Suscripción cancelada - TODO: Implementar');
    // TODO: Implementar lógica de suscripción cancelada
  }

  private async handleInvoicePaymentSucceeded(event: Stripe.Event): Promise<void> {
    this.logger.log('🧾 Factura pagada - TODO: Implementar');
    // TODO: Implementar lógica de factura pagada
  }

  private async handleInvoicePaymentFailed(event: Stripe.Event): Promise<void> {
    this.logger.log('🧾 Fallo en pago de factura - TODO: Implementar');
    // TODO: Implementar lógica de fallo en pago de factura
  }

  private async logWebhookEvent(
    event: Partial<Stripe.Event>,
    status: 'RECEIVED' | 'PROCESSED' | 'FAILED',
    errorMessage?: string,
  ): Promise<void> {
    try {
      const eventType = status === 'RECEIVED'
        ? TransactionEventType.WEBHOOK_RECEIVED
        : status === 'PROCESSED'
        ? TransactionEventType.WEBHOOK_PROCESSED
        : TransactionEventType.WEBHOOK_FAILED;

      const checksum = this.generateChecksum({
        eventId: event.id,
        eventType: event.type,
        status,
      });

      await this.transactionLogModel.create({
        eventType,
        timestamp: new Date(),
        eventData: {
          stripeEventId: event.id,
          stripeEventType: event.type,
          status,
          errorMessage,
        },
        stripeEventId: event.id,
        severity: status === 'FAILED' ? 'error' : 'info',
        checksum,
      });
    } catch (error) {
      this.logger.error('Error logging webhook event:', error);
    }
  }

  private generateChecksum(data: Record<string, unknown>): string {
    const crypto = require('crypto');
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }
}