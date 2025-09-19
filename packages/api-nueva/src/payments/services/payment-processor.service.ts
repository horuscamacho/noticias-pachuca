import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Stripe from 'stripe';

import { StripeCoreService } from './stripe-core.service';
import { IdempotencyService } from './idempotency.service';
import { AppConfigService } from '../../config/config.service';

// Importar sistema de notificaciones existente
import { NotificationRouterService } from '../../notifications/services/notification-router.service';
import {
  NotificationType,
  DeliveryMethod,
} from '../../notifications/schemas/notification-queue.schema';

import { Payment, PaymentDocument } from '../schemas/payment.schema';
import {
  TransactionLog,
  TransactionLogDocument,
  TransactionEventType,
} from '../schemas/transaction-log.schema';

import {
  PaymentResult,
  PaymentStatus,
  PaymentMethod,
  PaymentAttempt,
} from '../interfaces/payment.interface';

import {
  CreatePaymentDto,
  ConfirmPaymentDto,
  RefundPaymentDto,
} from '../dto/payment.dto';

@Injectable()
export class PaymentProcessorService {
  private readonly logger = new Logger(PaymentProcessorService.name);

  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,

    @InjectModel(TransactionLog.name)
    private readonly transactionLogModel: Model<TransactionLogDocument>,

    private readonly stripeService: StripeCoreService,
    private readonly idempotencyService: IdempotencyService,
    private readonly configService: AppConfigService,

    // 🔔 USAR SISTEMA DE NOTIFICACIONES EXISTENTE
    private readonly notificationRouter: NotificationRouterService,
  ) {}

  /**
   * Crear un Payment Intent con idempotencia
   */
  async createPaymentIntent(
    dto: CreatePaymentDto,
  ): Promise<PaymentResult> {
    const idempotencyKey = this.idempotencyService.generateIdempotencyKey(
      dto.userId,
      'create_payment_intent',
      { amount: dto.amount, currency: dto.currency },
    );

    const result = await this.idempotencyService.processWithIdempotency(
      idempotencyKey,
      async () => {
        return this.executeCreatePaymentIntent(dto, idempotencyKey);
      },
    );

    // Si es una operación nueva (no del cache), enviar notificación
    if (!result.isFromCache) {
      await this.notifyPaymentCreated(result.data);
    }

    return result.data;
  }

  private async executeCreatePaymentIntent(
    dto: CreatePaymentDto,
    idempotencyKey: string,
  ): Promise<PaymentResult> {
    const { amount, currency, userId, paymentMethodId, description, metadata } = dto;

    try {
      // Log del intento de pago
      await this.logTransaction(TransactionEventType.PAYMENT_CREATED, {
        userId,
        amount,
        currency,
        paymentMethodId,
        idempotencyKey,
      });

      this.stripeService.logStripeOperation('createPaymentIntent', {
        amount,
        currency,
        userId,
      });

      // Crear Payment Intent en Stripe
      const paymentIntent = await this.stripeService.client.paymentIntents.create(
        {
          amount,
          currency: currency.toLowerCase(),
          payment_method: paymentMethodId,
          confirmation_method: 'manual',
          confirm: true,
          description,
          metadata: {
            userId,
            ...metadata,
          },
          return_url: `${this.configService.paymentsConfig}`,
        },
        {
          idempotencyKey,
        },
      );

      // Guardar en base de datos
      const payment = new this.paymentModel({
        stripePaymentIntentId: paymentIntent.id,
        userId,
        amount,
        currency: currency.toLowerCase(),
        status: this.mapStripeStatusToPaymentStatus(paymentIntent.status),
        paymentMethod: PaymentMethod.CARD,
        description,
        metadata,
        idempotencyKey,
        stripePaymentMethodId: paymentMethodId,
        clientSecret: paymentIntent.client_secret,
        confirmationMethod: paymentIntent.confirmation_method,
        nextAction: paymentIntent.next_action,
      });

      const savedPayment = await payment.save();

      // Log de éxito
      await this.logTransaction(TransactionEventType.PAYMENT_PROCESSING, {
        paymentId: (savedPayment._id as Types.ObjectId).toString(),
        stripePaymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
      }, (savedPayment._id as Types.ObjectId).toString());

      return this.mapToPaymentResult(savedPayment, paymentIntent);

    } catch (error) {
      this.stripeService.logStripeError('createPaymentIntent', error, {
        amount,
        currency,
        userId,
      });

      // Log del error
      await this.logTransaction(
        TransactionEventType.PAYMENT_FAILED,
        {
          userId,
          amount,
          currency,
          error: error instanceof Error ? error.message : String(error),
          idempotencyKey,
        },
        undefined,
        'error',
      );

      throw error;
    }
  }

  /**
   * Confirmar un pago
   */
  async confirmPayment(dto: ConfirmPaymentDto): Promise<PaymentResult> {
    const { paymentIntentId, paymentMethodId } = dto;

    try {
      // Buscar pago en BD
      const payment = await this.paymentModel.findOne({
        stripePaymentIntentId: paymentIntentId,
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      this.stripeService.logStripeOperation('confirmPayment', {
        paymentIntentId,
      });

      // Confirmar en Stripe
      const paymentIntent = await this.stripeService.client.paymentIntents.confirm(
        paymentIntentId,
        {
          payment_method: paymentMethodId,
        },
      );

      // Actualizar estado en BD
      const updatedPayment = await this.paymentModel.findByIdAndUpdate(
        payment._id,
        {
          status: this.mapStripeStatusToPaymentStatus(paymentIntent.status),
          nextAction: paymentIntent.next_action,
          stripePaymentMethodId: paymentMethodId,
        },
        { new: true },
      );

      if (!updatedPayment) {
        throw new Error('Failed to update payment');
      }

      // Log del resultado
      const eventType = paymentIntent.status === 'succeeded'
        ? TransactionEventType.PAYMENT_SUCCEEDED
        : TransactionEventType.PAYMENT_PROCESSING;

      await this.logTransaction(eventType, {
        stripePaymentIntentId: paymentIntentId,
        status: paymentIntent.status,
      }, (updatedPayment._id as Types.ObjectId).toString());

      const result = this.mapToPaymentResult(updatedPayment, paymentIntent);

      // 🔔 NOTIFICAR SEGÚN EL RESULTADO
      if (paymentIntent.status === 'succeeded') {
        await this.notifyPaymentSuccess(result);
      } else if (paymentIntent.status === 'requires_action') {
        await this.notifyPaymentRequiresAction(result);
      }

      return result;

    } catch (error) {
      this.stripeService.logStripeError('confirmPayment', error, {
        paymentIntentId,
      });

      await this.logTransaction(
        TransactionEventType.PAYMENT_FAILED,
        {
          paymentIntentId,
          error: error instanceof Error ? error.message : String(error),
        },
        undefined,
        'error',
      );

      throw error;
    }
  }

  /**
   * Mapear estado de Stripe a nuestro enum
   */
  private mapStripeStatusToPaymentStatus(
    stripeStatus: Stripe.PaymentIntent.Status,
  ): PaymentStatus {
    const statusMap: Record<Stripe.PaymentIntent.Status, PaymentStatus> = {
      requires_payment_method: PaymentStatus.PENDING,
      requires_confirmation: PaymentStatus.REQUIRES_CONFIRMATION,
      requires_action: PaymentStatus.REQUIRES_ACTION,
      processing: PaymentStatus.PROCESSING,
      requires_capture: PaymentStatus.PROCESSING,
      canceled: PaymentStatus.CANCELED,
      succeeded: PaymentStatus.SUCCEEDED,
    };

    return statusMap[stripeStatus] || PaymentStatus.PENDING;
  }

  /**
   * Mapear a PaymentResult
   */
  private mapToPaymentResult(
    payment: PaymentDocument,
    paymentIntent?: Stripe.PaymentIntent,
  ): PaymentResult {
    return {
      id: (payment._id as Types.ObjectId).toString(),
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      userId: payment.userId.toString(),
      stripePaymentIntentId: payment.stripePaymentIntentId,
      clientSecret: payment.clientSecret,
      confirmationMethod: payment.confirmationMethod,
      nextAction: payment.nextAction as Stripe.PaymentIntent.NextAction | undefined,
      metadata: payment.metadata,
      createdAt: payment.createdAt!,
    };
  }

  /**
   * 🔔 NOTIFICACIONES USANDO SISTEMA EXISTENTE
   */

  private async notifyPaymentCreated(payment: PaymentResult): Promise<void> {
    await this.notificationRouter.sendNotification({
      userId: payment.userId,
      type: NotificationType.PAYMENT_PENDING,
      deliveryMethod: DeliveryMethod.AUTO,
      notification: {
        title: '💳 Pago iniciado',
        body: `Tu pago de $${(payment.amount / 100).toFixed(2)} ${payment.currency.toUpperCase()} está siendo procesado`,
        data: {
          paymentId: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
        },
        priority: 'normal',
        actionUrl: `/payments/${payment.id}`,
      },
    });
  }

  private async notifyPaymentSuccess(payment: PaymentResult): Promise<void> {
    await this.notificationRouter.sendNotification({
      userId: payment.userId,
      type: NotificationType.PAYMENT_SUCCESS,
      deliveryMethod: DeliveryMethod.AUTO,
      notification: {
        title: '✅ Pago exitoso',
        body: `Tu pago de $${(payment.amount / 100).toFixed(2)} ${payment.currency.toUpperCase()} fue procesado exitosamente`,
        data: {
          paymentId: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
        },
        priority: 'high',
        actionUrl: `/payments/${payment.id}`,
      },
    });
  }

  private async notifyPaymentRequiresAction(payment: PaymentResult): Promise<void> {
    await this.notificationRouter.sendNotification({
      userId: payment.userId,
      type: NotificationType.PAYMENT_REQUIRES_ACTION,
      deliveryMethod: DeliveryMethod.AUTO,
      notification: {
        title: '🔐 Autenticación requerida',
        body: 'Tu pago requiere autenticación adicional para completarse',
        data: {
          paymentId: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          nextAction: payment.nextAction,
        },
        priority: 'urgent',
        actionUrl: `/payments/${payment.id}/authenticate`,
      },
    });
  }

  /**
   * Logging de transacciones
   */
  private async logTransaction(
    eventType: TransactionEventType,
    eventData: Record<string, unknown>,
    paymentId?: string,
    severity: 'info' | 'warning' | 'error' | 'critical' = 'info',
  ): Promise<void> {
    try {
      const checksum = this.generateChecksum(eventData);

      await this.transactionLogModel.create({
        eventType,
        paymentId,
        timestamp: new Date(),
        eventData,
        severity,
        checksum,
      });
    } catch (error) {
      this.logger.error('Error logging transaction:', error);
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