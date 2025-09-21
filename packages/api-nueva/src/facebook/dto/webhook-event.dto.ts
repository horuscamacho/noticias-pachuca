import { IsString, IsDateString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class WebhookChangeDto {
  @IsString()
  field: string;

  @IsOptional()
  value?: Record<string, unknown>;
}

export class WebhookEventDto {
  @IsString()
  pageId: string;

  @IsDateString()
  timestamp: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WebhookChangeDto)
  changes: WebhookChangeDto[];
}