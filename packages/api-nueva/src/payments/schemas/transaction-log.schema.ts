import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionLogDocument = TransactionLog & Document;

export enum TransactionEventType {
  PAYMENT_CREATED = 'payment_created',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  PAYMENT_PROCESSING = 'payment_processing',
  PAYMENT_SUCCEEDED = 'payment_succeeded',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_CANCELED = 'payment_canceled',
  PAYMENT_REFUNDED = 'payment_refunded',
  REFUND_PROCESSED = 'refund_processed',
  WEBHOOK_RECEIVED = 'webhook_received',
  WEBHOOK_PROCESSED = 'webhook_processed',
  WEBHOOK_FAILED = 'webhook_failed',
  CUSTOMER_CREATED = 'customer_created',
  SUBSCRIPTION_CREATED = 'subscription_created',
  SUBSCRIPTION_UPDATED = 'subscription_updated',
  SUBSCRIPTION_CANCELED = 'subscription_canceled',
  IDEMPOTENCY_HIT = 'idempotency_hit',
  RISK_ANALYSIS = 'risk_analysis',
  RATE_LIMIT_HIT = 'rate_limit_hit',
}

@Schema({
  timestamps: true,
  collection: 'transaction_logs',
  toJSON: {
    transform: (doc: Document, ret: Record<string, unknown>) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class TransactionLog {
  @Prop({
    type: String,
    enum: Object.values(TransactionEventType),
    required: true,
  })
  eventType: TransactionEventType;

  @Prop({ type: Types.ObjectId, ref: 'Payment' })
  paymentId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ type: Object, required: true })
  eventData: Record<string, unknown>;

  @Prop()
  stripeEventId?: string;

  @Prop()
  idempotencyKey?: string;

  @Prop()
  amount?: number;

  @Prop()
  currency?: string;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop()
  sessionId?: string;

  @Prop()
  requestId?: string;

  @Prop()
  processingTimeMs?: number;

  @Prop()
  errorCode?: string;

  @Prop()
  errorMessage?: string;

  @Prop()
  stackTrace?: string;

  @Prop()
  severity?: 'info' | 'warning' | 'error' | 'critical';

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;

  // Para compliance PCI DSS
  @Prop({ required: true })
  checksum: string; // Hash para verificar integridad

  @Prop({ default: false })
  encrypted: boolean;

  @Prop()
  encryptionKeyId?: string;

  // TTL - Auto-delete después de 7 años (compliance)
  @Prop({
    default: Date.now,
    expires: 220898400 // 7 años en segundos
  })
  expiresAt: Date;

  // Timestamps automáticos
  createdAt?: Date;
  updatedAt?: Date;
}

export const TransactionLogSchema = SchemaFactory.createForClass(TransactionLog);

// Índices para performance y compliance
TransactionLogSchema.index({ eventType: 1, timestamp: -1 });
TransactionLogSchema.index({ paymentId: 1, timestamp: -1 });
TransactionLogSchema.index({ userId: 1, timestamp: -1 });
TransactionLogSchema.index({ stripeEventId: 1 });
TransactionLogSchema.index({ idempotencyKey: 1 });
TransactionLogSchema.index({ timestamp: -1 });
TransactionLogSchema.index({ severity: 1, timestamp: -1 });
TransactionLogSchema.index({ ipAddress: 1, timestamp: -1 });
TransactionLogSchema.index({ checksum: 1 });
TransactionLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Índice compuesto para auditoría
TransactionLogSchema.index({
  userId: 1,
  eventType: 1,
  timestamp: -1
});

// Índice para análisis de fraude
TransactionLogSchema.index({
  ipAddress: 1,
  eventType: 1,
  timestamp: -1
});

// Virtual para verificar si es un evento crítico
TransactionLogSchema.virtual('isCritical').get(function (this: TransactionLogDocument) {
  return this.severity === 'critical' || this.severity === 'error';
});

// Virtual para obtener fecha formateada
TransactionLogSchema.virtual('formattedTimestamp').get(function (this: TransactionLogDocument) {
  return this.timestamp.toISOString();
});