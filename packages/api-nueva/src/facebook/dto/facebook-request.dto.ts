import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsDateString
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

/**
 * 🎯 DTOs FACEBOOK REQUESTS
 * Validación estricta - NO usar any
 */

export class FacebookPageRequestDto {
  @ApiProperty({
    description: 'Facebook Page ID',
    example: '123456789'
  })
  @IsString()
  @IsNotEmpty()
  pageId: string;

  @ApiPropertyOptional({
    description: 'Fields to retrieve from Facebook API',
    example: ['name', 'fan_count', 'talking_about_count'],
    isArray: true
  })
  @IsArray()
  @IsOptional()
  @ArrayNotEmpty()
  @IsString({ each: true })
  fields?: string[];

  @ApiPropertyOptional({
    description: 'Access token for Facebook API',
    example: 'EAABwzLixnjYBO...'
  })
  @IsString()
  @IsOptional()
  accessToken?: string;
}

export class FacebookPagePostsRequestDto extends PaginationDto {
  @ApiProperty({
    description: 'Facebook Page ID',
    example: '123456789'
  })
  @IsString()
  @IsNotEmpty()
  pageId: string;

  @ApiPropertyOptional({
    description: 'Fields to retrieve for each post',
    example: ['message', 'created_time', 'likes.summary(true)', 'comments.summary(true)'],
    isArray: true
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  fields?: string[];

  @ApiPropertyOptional({
    description: 'Start date for posts (ISO string)',
    example: '2025-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  since?: string;

  @ApiPropertyOptional({
    description: 'End date for posts (ISO string)',
    example: '2025-01-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString()
  until?: string;

  @ApiPropertyOptional({
    description: 'Sort posts by field',
    example: 'created_time',
    enum: ['created_time', 'updated_time']
  })
  @IsOptional()
  @IsEnum(['created_time', 'updated_time'])
  sortBy?: 'created_time' | 'updated_time';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc']
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  order?: 'asc' | 'desc';
}

export class FacebookBatchRequestDto {
  @ApiProperty({
    description: 'Array of batch requests',
    isArray: true
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SingleBatchRequestDto)
  requests: SingleBatchRequestDto[];

  @ApiPropertyOptional({
    description: 'Include access token in batch',
    example: false
  })
  @IsOptional()
  includeHeaders?: boolean;
}

export class SingleBatchRequestDto {
  @ApiProperty({
    description: 'HTTP method for the request',
    example: 'GET',
    enum: ['GET', 'POST', 'DELETE']
  })
  @IsEnum(['GET', 'POST', 'DELETE'])
  method: 'GET' | 'POST' | 'DELETE';

  @ApiProperty({
    description: 'Relative URL for the Facebook Graph API endpoint',
    example: 'me/posts?fields=message,created_time'
  })
  @IsString()
  @IsNotEmpty()
  relative_url: string;

  @ApiPropertyOptional({
    description: 'Optional headers for the request',
    example: { 'Content-Type': 'application/json' }
  })
  @IsOptional()
  headers?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Request body for POST requests',
    example: '{"message": "Hello World"}'
  })
  @IsOptional()
  @IsString()
  body?: string;
}

export class WebhookVerificationDto {
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

export class FacebookWebhookPayloadDto {
  @ApiProperty({
    description: 'Object type for webhook',
    example: 'page'
  })
  @IsString()
  @IsNotEmpty()
  object: string;

  @ApiProperty({
    description: 'Entry data for webhook',
    isArray: true
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WebhookEntryDto)
  entry: WebhookEntryDto[];
}

export class WebhookEntryDto {
  @ApiProperty({
    description: 'Page ID',
    example: '123456789'
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Timestamp of the event',
    example: 1640995200
  })
  @IsNumber()
  time: number;

  @ApiProperty({
    description: 'Changes array',
    isArray: true
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WebhookChangeDto)
  changes: WebhookChangeDto[];
}

export class WebhookChangeDto {
  @ApiProperty({
    description: 'Field that changed',
    example: 'feed'
  })
  @IsString()
  @IsNotEmpty()
  field: string;

  @ApiProperty({
    description: 'Value of the change'
  })
  value: Record<string, unknown>;
}

export class PageInsightsRequestDto {
  @ApiProperty({
    description: 'Facebook Page ID',
    example: '123456789'
  })
  @IsString()
  @IsNotEmpty()
  pageId: string;

  @ApiProperty({
    description: 'Metrics to retrieve',
    example: ['page_fans', 'page_engaged_users', 'page_impressions'],
    isArray: true
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  metrics: string[];

  @ApiPropertyOptional({
    description: 'Period for insights',
    example: 'day',
    enum: ['day', 'week', 'days_28']
  })
  @IsOptional()
  @IsEnum(['day', 'week', 'days_28'])
  period?: 'day' | 'week' | 'days_28';

  @ApiPropertyOptional({
    description: 'Start date for insights (YYYY-MM-DD)',
    example: '2025-01-01'
  })
  @IsOptional()
  @Transform(({ value }) => value ? new Date(value).toISOString().split('T')[0] : value)
  since?: string;

  @ApiPropertyOptional({
    description: 'End date for insights (YYYY-MM-DD)',
    example: '2025-01-31'
  })
  @IsOptional()
  @Transform(({ value }) => value ? new Date(value).toISOString().split('T')[0] : value)
  until?: string;
}