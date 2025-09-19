import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PaymentStatus, PaymentMethod } from '../interfaces/payment.interface';

export type PaymentDocument = Payment & Document;

@Schema({
  timestamps: true,
  collection: 'payments',
  toJSON: {
    transform: (doc: Document, ret: Record<string, unknown>) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Payment {
  @Prop({ required: true, unique: true })
  stripePaymentIntentId: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, lowercase: true })
  currency: string;

  @Prop({
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Prop({
    type: String,
    enum: Object.values(PaymentMethod),
    default: PaymentMethod.CARD,
  })
  paymentMethod: PaymentMethod;

  @Prop()
  description?: string;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;

  @Prop()
  failureCode?: string;

  @Prop()
  failureMessage?: string;

  @Prop({ required: true, unique: true })
  idempotencyKey: string;

  @Prop()
  stripeCustomerId?: string;

  @Prop()
  stripePaymentMethodId?: string;

  @Prop()
  clientSecret?: string;

  @Prop()
  confirmationMethod?: string;

  @Prop({ type: Object })
  nextAction?: Record<string, unknown>;

  @Prop()
  receiptEmail?: string;

  @Prop()
  receiptUrl?: string;

  @Prop({ default: false })
  captured: boolean;

  @Prop()
  capturedAt?: Date;

  @Prop()
  refundedAmount?: number;

  @Prop({ default: false })
  disputed: boolean;

  @Prop()
  disputedAt?: Date;

  // Risk analysis
  @Prop()
  riskScore?: number;

  @Prop()
  riskLevel?: 'low' | 'medium' | 'high';

  // Audit fields
  @Prop()
  clientIp?: string;

  @Prop()
  userAgent?: string;

  @Prop()
  processingTimeMs?: number;

  @Prop({ default: 0 })
  retryCount: number;

  @Prop()
  lastRetryAt?: Date;

  // Soft delete
  @Prop({ default: null })
  deletedAt?: Date;

  // Timestamps automáticos
  createdAt?: Date;
  updatedAt?: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Índices para performance
PaymentSchema.index({ userId: 1, status: 1 });
PaymentSchema.index({ stripePaymentIntentId: 1 });
PaymentSchema.index({ idempotencyKey: 1 });
PaymentSchema.index({ status: 1, createdAt: -1 });
PaymentSchema.index({ currency: 1, createdAt: -1 });
PaymentSchema.index({ amount: 1, currency: 1 });
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ clientIp: 1, createdAt: -1 });

// Índice compuesto para analytics
PaymentSchema.index({
  userId: 1,
  status: 1,
  createdAt: -1
});

// Virtual para monto formateado
PaymentSchema.virtual('formattedAmount').get(function (this: PaymentDocument) {
  return (this.amount / 100).toFixed(2);
});

// Virtual para verificar si es exitoso
PaymentSchema.virtual('isSuccessful').get(function (this: PaymentDocument) {
  return this.status === PaymentStatus.SUCCEEDED;
});

// Virtual para verificar si puede ser reembolsado
PaymentSchema.virtual('canBeRefunded').get(function (this: PaymentDocument) {
  return (
    this.status === PaymentStatus.SUCCEEDED &&
    this.captured &&
    !this.disputed &&
    (this.refundedAmount || 0) < this.amount
  );
});