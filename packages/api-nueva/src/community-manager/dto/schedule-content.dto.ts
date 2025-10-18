import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsDate,
  IsArray,
  IsNumber,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para programar publicación de contenido en redes sociales
 */
export class ScheduleContentDto {
  @IsString()
  noticiaId: string;

  @IsEnum(['facebook', 'twitter', 'instagram'])
  platform: 'facebook' | 'twitter' | 'instagram';

  @IsString()
  @MinLength(10)
  @MaxLength(500)
  originalCopy: string; // Copy original generado por IA (sin URL)

  @IsOptional()
  @IsBoolean()
  forceImmediate?: boolean; // Forzar publicación inmediata (breaking news)

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  customScheduledTime?: Date; // Forzar hora específica (manual)
}

/**
 * DTO para programar reciclaje de contenido evergreen
 */
export class ScheduleRecycledContentDto {
  @IsString()
  noticiaId: string;

  @IsOptional()
  @IsArray()
  @IsEnum(['facebook', 'twitter', 'instagram'], { each: true })
  platforms?: ('facebook' | 'twitter' | 'instagram')[];
}

/**
 * DTO para filtros de búsqueda de posts programados
 */
export class GetScheduledPostsDto {
  @IsOptional()
  @IsEnum(['facebook', 'twitter', 'instagram'])
  platform?: 'facebook' | 'twitter' | 'instagram';

  @IsOptional()
  @IsEnum(['breaking_news', 'normal_news', 'blog', 'evergreen', 'recycled'])
  contentType?: 'breaking_news' | 'normal_news' | 'blog' | 'evergreen' | 'recycled';

  @IsOptional()
  @IsEnum(['scheduled', 'processing', 'published', 'failed', 'cancelled'])
  status?: 'scheduled' | 'processing' | 'published' | 'failed' | 'cancelled';

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateFrom?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateTo?: Date;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

/**
 * DTO para cancelar un post programado
 */
export class CancelScheduledPostDto {
  @IsString()
  scheduledPostId: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}

/**
 * DTO para reprogramar un post
 */
export class ReschedulePostDto {
  @IsString()
  scheduledPostId: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  newScheduledTime?: Date;
}

/**
 * Response DTO para post programado
 */
export class ScheduledPostResponseDto {
  id: string;
  noticiaId: string;
  noticiaTitle?: string;
  contentType: string;
  platform: string;
  postContent: string;
  scheduledAt: Date;
  priority: number;
  status: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Response DTO para estadísticas
 */
export class StatsResponseDto {
  scheduledPosts: {
    total: number;
    byPlatform: Record<string, number>;
    byContentType: Record<string, number>;
    byStatus: Record<string, number>;
  };
  recycling: {
    totalRecycled: number;
    totalEligible: number;
    averagePerformance: number;
  };
}
