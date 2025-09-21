import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
  IsEnum,
  IsNumber,
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 🎯 DTOs FACEBOOK WEBHOOKS
 * Para procesar eventos de Facebook en tiempo real
 */

export class FacebookWebhookVerificationDto {
  @ApiProperty({
    description: 'Hub mode for webhook verification',
    example: 'subscribe'
  })
  @IsString()
  @IsNotEmpty()
  'hub.mode': string;

  @ApiProperty({
    description: 'Hub challenge for webhook verification',
    example: '1234567890'
  })
  @IsString()
  @IsNotEmpty()
  'hub.challenge': string;

  @ApiProperty({
    description: 'Hub verify token for webhook verification',
    example: 'your_verify_token'
  })
  @IsString()
  @IsNotEmpty()
  'hub.verify_token': string;
}

export class FacebookWebhookDto {
  @ApiProperty({
    description: 'Object type for webhook (usually "page")',
    example: 'page'
  })
  @IsString()
  @IsNotEmpty()
  object: string;

  @ApiProperty({
    description: 'Array of entry data for webhook events',
    isArray: true
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => WebhookEntryDto)
  entry: WebhookEntryDto[];
}

export class WebhookEntryDto {
  @ApiProperty({
    description: 'Facebook Page ID that triggered the webhook',
    example: '123456789'
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Unix timestamp when the event occurred',
    example: 1640995200
  })
  @IsNumber()
  time: number;

  @ApiPropertyOptional({
    description: 'Array of messaging events (for Messenger)',
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessagingEventDto)
  messaging?: MessagingEventDto[];

  @ApiPropertyOptional({
    description: 'Array of changes to the page',
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WebhookChangeDto)
  changes?: WebhookChangeDto[];
}

export class MessagingEventDto {
  @ApiProperty({
    description: 'Sender information'
  })
  @IsObject()
  @ValidateNested()
  @Type(() => UserDto)
  sender: UserDto;

  @ApiProperty({
    description: 'Recipient information'
  })
  @IsObject()
  @ValidateNested()
  @Type(() => UserDto)
  recipient: UserDto;

  @ApiProperty({
    description: 'Timestamp of the message',
    example: 1640995200000
  })
  @IsNumber()
  timestamp: number;

  @ApiPropertyOptional({
    description: 'Message content'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MessageDto)
  message?: MessageDto;

  @ApiPropertyOptional({
    description: 'Postback data'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PostbackDto)
  postback?: PostbackDto;

  @ApiPropertyOptional({
    description: 'Delivery confirmation'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryDto)
  delivery?: DeliveryDto;

  @ApiPropertyOptional({
    description: 'Read confirmation'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReadDto)
  read?: ReadDto;
}

export class UserDto {
  @ApiProperty({
    description: 'Facebook User ID',
    example: '987654321'
  })
  @IsString()
  @IsNotEmpty()
  id: string;
}

export class MessageDto {
  @ApiProperty({
    description: 'Message ID',
    example: 'mid.1234567890'
  })
  @IsString()
  @IsNotEmpty()
  mid: string;

  @ApiPropertyOptional({
    description: 'Message text content',
    example: 'Hello, this is a test message'
  })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({
    description: 'Quick reply payload',
    example: 'QUICK_REPLY_PAYLOAD'
  })
  @IsOptional()
  @IsString()
  quick_reply?: string;

  @ApiPropertyOptional({
    description: 'Message attachments',
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}

export class AttachmentDto {
  @ApiProperty({
    description: 'Attachment type',
    example: 'image',
    enum: ['image', 'audio', 'video', 'file', 'location', 'template']
  })
  @IsEnum(['image', 'audio', 'video', 'file', 'location', 'template'])
  type: 'image' | 'audio' | 'video' | 'file' | 'location' | 'template';

  @ApiProperty({
    description: 'Attachment payload'
  })
  @IsObject()
  payload: Record<string, unknown>;
}

export class PostbackDto {
  @ApiProperty({
    description: 'Postback title',
    example: 'Get Started'
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Postback payload',
    example: 'GET_STARTED_PAYLOAD'
  })
  @IsString()
  @IsNotEmpty()
  payload: string;

  @ApiPropertyOptional({
    description: 'Referral information'
  })
  @IsOptional()
  @IsObject()
  referral?: Record<string, unknown>;
}

export class DeliveryDto {
  @ApiProperty({
    description: 'Array of delivered message IDs',
    isArray: true,
    example: ['mid.1234567890', 'mid.0987654321']
  })
  @IsArray()
  @IsString({ each: true })
  mids: string[];

  @ApiProperty({
    description: 'Watermark timestamp',
    example: 1640995200000
  })
  @IsNumber()
  watermark: number;
}

export class ReadDto {
  @ApiProperty({
    description: 'Watermark timestamp',
    example: 1640995200000
  })
  @IsNumber()
  watermark: number;
}

export class WebhookChangeDto {
  @ApiProperty({
    description: 'Field that changed',
    example: 'feed',
    enum: ['feed', 'live_videos', 'mention', 'picture', 'ratings', 'videos']
  })
  @IsEnum(['feed', 'live_videos', 'mention', 'picture', 'ratings', 'videos'])
  field: 'feed' | 'live_videos' | 'mention' | 'picture' | 'ratings' | 'videos';

  @ApiProperty({
    description: 'Change value data'
  })
  @IsObject()
  value: WebhookChangeValueDto;
}

export class WebhookChangeValueDto {
  @ApiPropertyOptional({
    description: 'Item type that changed',
    example: 'post'
  })
  @IsOptional()
  @IsString()
  item?: string;

  @ApiPropertyOptional({
    description: 'Post ID (for feed changes)',
    example: '123456789_987654321'
  })
  @IsOptional()
  @IsString()
  post_id?: string;

  @ApiPropertyOptional({
    description: 'Verb action performed',
    example: 'add',
    enum: ['add', 'edited', 'delete', 'hide', 'unhide']
  })
  @IsOptional()
  @IsEnum(['add', 'edited', 'delete', 'hide', 'unhide'])
  verb?: 'add' | 'edited' | 'delete' | 'hide' | 'unhide';

  @ApiPropertyOptional({
    description: 'User ID who performed the action',
    example: '987654321'
  })
  @IsOptional()
  @IsString()
  sender_id?: string;

  @ApiPropertyOptional({
    description: 'Sender name',
    example: 'John Doe'
  })
  @IsOptional()
  @IsString()
  sender_name?: string;

  @ApiPropertyOptional({
    description: 'Message content (for posts)',
    example: 'This is a new post on the page'
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({
    description: 'Created time timestamp',
    example: 1640995200
  })
  @IsOptional()
  @IsNumber()
  created_time?: number;

  @ApiPropertyOptional({
    description: 'Additional change data'
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}

export class WebhookErrorDto {
  @ApiProperty({
    description: 'Error code',
    example: 400
  })
  @IsNumber()
  code: number;

  @ApiProperty({
    description: 'Error message',
    example: 'Invalid webhook payload'
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description: 'Error type',
    example: 'validation_error'
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'Facebook trace ID for debugging',
    example: 'AaB1CdE2FgH3IjK4'
  })
  @IsOptional()
  @IsString()
  fbtrace_id?: string;
}