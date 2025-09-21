import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationQueueDocument = NotificationQueue & Document;

export enum NotificationType {
  BREAKING_NEWS = 'breaking_news',
  NEW_ARTICLE = 'new_article',
  DAILY_DIGEST = 'daily_digest',
  SUBSCRIPTION_EXPIRY = 'subscription_expiry',
  COMMENT_REPLY = 'comment_reply',
  SYSTEM_ALERT = 'system_alert',
  CUSTOM = 'custom',

  // 💳 PAYMENT NOTIFICATIONS
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_PENDING = 'payment_pending',
  PAYMENT_REQUIRES_ACTION = 'payment_requires_action',
  PAYMENT_REFUNDED = 'payment_refunded',

  // 📋 SUBSCRIPTION NOTIFICATIONS
  SUBSCRIPTION_CREATED = 'subscription_created',
  SUBSCRIPTION_UPDATED = 'subscription_updated',
  SUBSCRIPTION_CANCELLED = 'subscription_cancelled',
  SUBSCRIPTION_PAYMENT_FAILED = 'subscription_payment_failed',
  SUBSCRIPTION_TRIAL_ENDING = 'subscription_trial_ending',

  // 🔔 BILLING NOTIFICATIONS
  INVOICE_PAYMENT_SUCCEEDED = 'invoice_payment_succeeded',
  INVOICE_PAYMENT_FAILED = 'invoice_payment_failed',
  INVOICE_UPCOMING = 'invoice_upcoming',

  // 📘 FACEBOOK EXTRACTION NOTIFICATIONS
  FACEBOOK_EXTRACTION_STARTED = 'facebook-extraction-started',
  FACEBOOK_EXTRACTION_PROGRESS = 'facebook-extraction-progress',
  FACEBOOK_EXTRACTION_COMPLETED = 'facebook-extraction-completed',
  FACEBOOK_EXTRACTION_FAILED = 'facebook-extraction-failed',
}

export enum DeliveryMethod {
  SOCKET = 'socket',
  PUSH = 'push',
  AUTO = 'auto', // Sistema decide basado en app state
}

export enum NotificationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

@Schema({
  timestamps: true,
  collection: 'notification_queue',
  toJSON: {
    transform: (doc: Document, ret: Record<string, unknown>) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class NotificationQueue {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: NotificationType, required: true })
  type: NotificationType;

  @Prop({ type: String, enum: DeliveryMethod, default: DeliveryMethod.AUTO })
  deliveryMethod: DeliveryMethod;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop({ type: Object })
  data?: Record<string, unknown>;

  @Prop()
  actionUrl?: string;

  @Prop()
  imageUrl?: string;

  @Prop({
    type: String,
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Prop({ default: 'normal' })
  priority: 'low' | 'normal' | 'high' | 'urgent';

  @Prop({ default: Date.now })
  scheduledFor: Date;

  @Prop()
  sentAt?: Date;

  @Prop()
  deliveredAt?: Date;

  @Prop({ default: 0 })
  retryCount: number;

  @Prop()
  lastRetryAt?: Date;

  @Prop()
  failureReason?: string;

  // Para tracking de expo push
  @Prop()
  expoPushTicketId?: string;

  @Prop()
  expoPushReceiptId?: string;

  // Metadata para personalización
  @Prop({ type: Object })
  templateData?: Record<string, unknown>;

  // TTL - Auto-delete después de 30 días
  @Prop({ default: Date.now, expires: 2592000 })
  expiresAt: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const NotificationQueueSchema =
  SchemaFactory.createForClass(NotificationQueue);

// Índices para performance
NotificationQueueSchema.index({ userId: 1, status: 1 });
NotificationQueueSchema.index({ status: 1, scheduledFor: 1 });
NotificationQueueSchema.index({ type: 1, status: 1 });
NotificationQueueSchema.index({ priority: 1, scheduledFor: 1 });
NotificationQueueSchema.index({ expoPushTicketId: 1 });
NotificationQueueSchema.index({ sentAt: -1 });
NotificationQueueSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
