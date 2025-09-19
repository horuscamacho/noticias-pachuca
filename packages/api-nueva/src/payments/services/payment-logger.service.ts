import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  TransactionLog,
  TransactionLogDocument,
  TransactionEventType,
} from '../schemas/transaction-log.schema';

@Injectable()
export class PaymentLoggerService {
  private readonly logger = new Logger(PaymentLoggerService.name);

  constructor(
    @InjectModel(TransactionLog.name)
    private readonly transactionLogModel: Model<TransactionLogDocument>,
  ) {}

  async logPaymentCreated(data: {
    paymentId: string;
    stripePaymentIntentId: string;
    userId: string;
    amount: number;
    currency: string;
  }): Promise<void> {
    try {
      const checksum = this.generateChecksum({
        eventType: 'PAYMENT_CREATED',
        paymentId: data.paymentId,
        stripePaymentIntentId: data.stripePaymentIntentId,
      });

      await this.transactionLogModel.create({
        eventType: TransactionEventType.PAYMENT_CREATED,
        timestamp: new Date(),
        eventData: {
          paymentId: data.paymentId,
          stripePaymentIntentId: data.stripePaymentIntentId,
          userId: data.userId,
          amount: data.amount,
          currency: data.currency,
        },
        stripeEventId: data.stripePaymentIntentId,
        severity: 'info',
        checksum,
      });

      this.logger.log(`📋 Payment creation logged: ${data.paymentId}`);
    } catch (error) {
      this.logger.error('Error logging payment creation:', error);
    }
  }

  async logPaymentConfirmed(data: {
    paymentId: string;
    stripePaymentIntentId: string;
    userId: string;
    status: string;
  }): Promise<void> {
    try {
      const checksum = this.generateChecksum({
        eventType: 'PAYMENT_CONFIRMED',
        paymentId: data.paymentId,
        status: data.status,
      });

      await this.transactionLogModel.create({
        eventType: TransactionEventType.PAYMENT_CONFIRMED,
        timestamp: new Date(),
        eventData: {
          paymentId: data.paymentId,
          stripePaymentIntentId: data.stripePaymentIntentId,
          userId: data.userId,
          status: data.status,
        },
        stripeEventId: data.stripePaymentIntentId,
        severity: 'info',
        checksum,
      });

      this.logger.log(`✅ Payment confirmation logged: ${data.paymentId}`);
    } catch (error) {
      this.logger.error('Error logging payment confirmation:', error);
    }
  }

  async logPaymentError(data: {
    paymentId?: string;
    stripePaymentIntentId?: string;
    userId: string;
    error: string;
    operation: string;
  }): Promise<void> {
    try {
      const checksum = this.generateChecksum({
        eventType: 'PAYMENT_ERROR',
        operation: data.operation,
        error: data.error,
      });

      await this.transactionLogModel.create({
        eventType: TransactionEventType.PAYMENT_FAILED,
        timestamp: new Date(),
        eventData: {
          paymentId: data.paymentId,
          stripePaymentIntentId: data.stripePaymentIntentId,
          userId: data.userId,
          error: data.error,
          operation: data.operation,
        },
        stripeEventId: data.stripePaymentIntentId,
        severity: 'error',
        checksum,
      });

      this.logger.error(`❌ Payment error logged: ${data.operation}`);
    } catch (error) {
      this.logger.error('Error logging payment error:', error);
    }
  }

  async logRefundProcessed(data: {
    paymentId: string;
    refundId: string;
    amount: number;
    currency: string;
    userId: string;
  }): Promise<void> {
    try {
      const checksum = this.generateChecksum({
        eventType: 'REFUND_PROCESSED',
        paymentId: data.paymentId,
        refundId: data.refundId,
      });

      await this.transactionLogModel.create({
        eventType: TransactionEventType.REFUND_PROCESSED,
        timestamp: new Date(),
        eventData: {
          paymentId: data.paymentId,
          refundId: data.refundId,
          amount: data.amount,
          currency: data.currency,
          userId: data.userId,
        },
        stripeEventId: data.refundId,
        severity: 'info',
        checksum,
      });

      this.logger.log(`💸 Refund logged: ${data.refundId}`);
    } catch (error) {
      this.logger.error('Error logging refund:', error);
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