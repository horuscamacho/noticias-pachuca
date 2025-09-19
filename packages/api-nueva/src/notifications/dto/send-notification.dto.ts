import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsDateString,
  IsUrl,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  NotificationType,
  DeliveryMethod,
} from '../schemas/notification-queue.schema';

export class NotificationPayloadDto {
  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @IsOptional()
  @IsUrl()
  actionUrl?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsEnum(['low', 'normal', 'high', 'urgent'])
  priority?: 'low' | 'normal' | 'high' | 'urgent';

  @IsOptional()
  @IsString()
  sound?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class SendNotificationDto {
  @IsString()
  userId: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsOptional()
  @IsEnum(DeliveryMethod)
  deliveryMethod?: DeliveryMethod;

  @Type(() => NotificationPayloadDto)
  notification: NotificationPayloadDto;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  scheduledFor?: Date;

  @IsOptional()
  @IsObject()
  templateData?: Record<string, unknown>;
}
