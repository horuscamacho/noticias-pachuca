import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 📅 DTO para programar publicación en cola inteligente
 */
export class SchedulePublicationDto {
  @IsMongoId({ message: 'contentId debe ser un ObjectId válido' })
  contentId: string; // ID del AIContentGeneration

  @IsEnum(['breaking', 'news', 'blog'], {
    message: 'publicationType debe ser: breaking, news o blog'
  })
  publicationType: 'breaking' | 'news' | 'blog'; // Tipo de publicación

  @IsBoolean()
  useOriginalImage: boolean; // true = usar imagen original

  @IsOptional()
  @IsUrl({}, { message: 'customImageUrl debe ser una URL válida' })
  customImageUrl?: string; // URL de imagen personalizada

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean; // Marcar como destacada

  @IsOptional()
  @IsDateString({}, { message: 'manualScheduleAt debe ser una fecha válida' })
  manualScheduleAt?: Date; // Programación manual (override del algoritmo)
}

/**
 * 🔄 DTO para cambiar prioridad en cola
 */
export class UpdateQueuePriorityDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'priority debe ser mínimo 1' })
  @Max(10, { message: 'priority debe ser máximo 10' })
  priority: number; // Nueva prioridad (1-10)
}

/**
 * 🚫 DTO para cancelar publicación programada
 */
export class CancelScheduleDto {
  @IsOptional()
  @IsString()
  reason?: string; // Razón de cancelación (opcional)
}

/**
 * 🔍 DTO para consultar cola de publicación
 */
export class QueryQueueDto {
  @IsOptional()
  @IsEnum(['queued', 'processing', 'published', 'failed', 'cancelled'], {
    message: 'status debe ser: queued, processing, published, failed o cancelled'
  })
  status?: 'queued' | 'processing' | 'published' | 'failed' | 'cancelled';

  @IsOptional()
  @IsEnum(['breaking', 'news', 'blog'], {
    message: 'queueType debe ser: breaking, news o blog'
  })
  queueType?: 'breaking' | 'news' | 'blog';

  @IsOptional()
  @IsDateString({}, { message: 'dateFrom debe ser una fecha válida' })
  dateFrom?: Date;

  @IsOptional()
  @IsDateString({}, { message: 'dateTo debe ser una fecha válida' })
  dateTo?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number; // Página (default: 1)

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number; // Items por página (default: 20, max: 100)
}
