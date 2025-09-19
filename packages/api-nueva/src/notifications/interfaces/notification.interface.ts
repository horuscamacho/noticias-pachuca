import {
  NotificationType,
  DeliveryMethod,
} from '../schemas/notification-queue.schema';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
  imageUrl?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  sound?: string;
  category?: string;
}

export interface SendNotificationDto {
  userId: string;
  type: NotificationType;
  deliveryMethod?: DeliveryMethod;
  notification: NotificationPayload;
  scheduledFor?: Date;
  templateData?: Record<string, unknown>;
}

export interface NotificationResult {
  success: boolean;
  socketsSent: number;
  pushSent: number;
  errors: string[];
  queueId?: string;
}
