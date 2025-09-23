import { IsString, IsOptional, IsEnum, IsBoolean, IsDateString, IsNumber, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 📊 DTOs para filtros y paginación de noticias
 */

export class NoticiasFilterDto {
  @ApiPropertyOptional({ description: 'Filtrar por dominio', example: 'ejemplo.com' })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional({ description: 'Filtrar por estado de extracción', enum: ['pending', 'extracted', 'failed', 'processing'] })
  @IsOptional()
  @IsEnum(['pending', 'extracted', 'failed', 'processing'])
  status?: 'pending' | 'extracted' | 'failed' | 'processing';

  @ApiPropertyOptional({ description: 'Fecha desde (ISO string)', example: '2025-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Fecha hasta (ISO string)', example: '2025-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Solo noticias con imágenes' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  hasImages?: boolean;

  @ApiPropertyOptional({ description: 'ID del post de Facebook' })
  @IsOptional()
  @IsString()
  facebookPostId?: string;

  @ApiPropertyOptional({ description: 'ID de la página de Facebook' })
  @IsOptional()
  @IsString()
  pageId?: string;

  @ApiPropertyOptional({ description: 'Búsqueda en título y contenido' })
  @IsOptional()
  @IsString()
  searchText?: string;
}

export class NoticiasPaginationDto {
  @ApiPropertyOptional({ description: 'Número de página', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Elementos por página', default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Ordenar por campo', enum: ['extractedAt', 'publishedAt', 'title', 'domain'], default: 'extractedAt' })
  @IsOptional()
  @IsEnum(['extractedAt', 'publishedAt', 'title', 'domain'])
  sortBy?: 'extractedAt' | 'publishedAt' | 'title' | 'domain' = 'extractedAt';

  @ApiPropertyOptional({ description: 'Orden de clasificación', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class ExternalUrlsFilterDto {
  @ApiPropertyOptional({ description: 'Filtrar por dominio' })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional({ description: 'Solo URLs con configuración existente' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  hasConfig?: boolean;

  @ApiPropertyOptional({ description: 'Estado de extracción', enum: ['pending', 'extracted', 'failed', 'skipped'] })
  @IsOptional()
  @IsEnum(['pending', 'extracted', 'failed', 'skipped'])
  extractionStatus?: 'pending' | 'extracted' | 'failed' | 'skipped';

  @ApiPropertyOptional({ description: 'ID de la página de Facebook' })
  @IsOptional()
  @IsString()
  pageId?: string;

  @ApiPropertyOptional({ description: 'Fecha desde (ISO string)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Fecha hasta (ISO string)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

export class ExtractionLogsFilterDto {
  @ApiPropertyOptional({ description: 'Filtrar por dominio' })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional({ description: 'Filtrar por estado', enum: ['success', 'error', 'partial', 'skipped'] })
  @IsOptional()
  @IsEnum(['success', 'error', 'partial', 'skipped'])
  status?: 'success' | 'error' | 'partial' | 'skipped';

  @ApiPropertyOptional({ description: 'Filtrar por método', enum: ['cheerio', 'puppeteer', 'manual'] })
  @IsOptional()
  @IsEnum(['cheerio', 'puppeteer', 'manual'])
  method?: 'cheerio' | 'puppeteer' | 'manual';

  @ApiPropertyOptional({ description: 'Filtrar por tipo de error', enum: ['network', 'parsing', 'selector', 'timeout', 'rate_limit', 'unknown'] })
  @IsOptional()
  @IsEnum(['network', 'parsing', 'selector', 'timeout', 'rate_limit', 'unknown'])
  errorType?: 'network' | 'parsing' | 'selector' | 'timeout' | 'rate_limit' | 'unknown';

  @ApiPropertyOptional({ description: 'ID del post de Facebook' })
  @IsOptional()
  @IsString()
  facebookPostId?: string;

  @ApiPropertyOptional({ description: 'Fecha desde (ISO string)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Fecha hasta (ISO string)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Tiempo mínimo de procesamiento (ms)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minProcessingTime?: number;

  @ApiPropertyOptional({ description: 'Tiempo máximo de procesamiento (ms)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxProcessingTime?: number;
}

export class TriggerExtractionDto {
  @ApiPropertyOptional({ description: 'ID de la configuración a usar' })
  @IsOptional()
  @IsString()
  configId?: string;

  @ApiPropertyOptional({ description: 'URLs específicas a extraer' })
  @IsOptional()
  @IsString({ each: true })
  urls?: string[];

  @ApiPropertyOptional({ description: 'Dominio específico a procesar' })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional({ description: 'Prioridad del job', minimum: 1, maximum: 10, default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(10)
  priority?: number = 5;

  @ApiPropertyOptional({ description: 'Forzar re-extracción aunque ya exista' })
  @IsOptional()
  @IsBoolean()
  forceReExtraction?: boolean = false;
}