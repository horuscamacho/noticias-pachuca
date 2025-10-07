import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, Min, Max } from 'class-validator';

/**
 * 🤖 DTOs para gestión de trabajos - Generator Pro
 */

export class CreateJobDto {
  @IsEnum(['extract_urls', 'extract_content', 'generate_content', 'publish_facebook', 'sync_engagement'])
  type: string; // Tipo de trabajo

  @IsString()
  websiteConfigId: string; // ID configuración sitio web

  @IsOptional()
  @IsString()
  facebookConfigId?: string; // ID configuración Facebook

  @IsOptional()
  @IsString()
  relatedEntityId?: string; // ID entidad relacionada

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  priority?: number; // Prioridad del trabajo (1-10)

  @IsOptional()
  @IsNumber()
  @Min(0)
  delay?: number; // Delay en milisegundos

  @IsOptional()
  @IsNumber()
  @Min(5000)
  @Max(600000)
  timeout?: number; // Timeout en milisegundos

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxRetries?: number; // Máximo reintentos
}

export class JobFiltersDto {
  @IsOptional()
  @IsEnum(['pending', 'processing', 'completed', 'failed', 'cancelled', 'retrying'])
  status?: string; // Filtrar por estado

  @IsOptional()
  @IsEnum(['extract_urls', 'extract_content', 'generate_content', 'publish_facebook', 'sync_engagement'])
  type?: string; // Filtrar por tipo

  @IsOptional()
  @IsString()
  websiteConfigId?: string; // Filtrar por sitio web

  @IsOptional()
  @IsString()
  facebookConfigId?: string; // Filtrar por configuración Facebook

  @IsOptional()
  @IsDateString()
  dateFrom?: string; // Fecha desde

  @IsOptional()
  @IsDateString()
  dateTo?: string; // Fecha hasta

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number; // Límite de resultados

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number; // Página de resultados

  @IsOptional()
  @IsEnum(['createdAt', 'scheduledAt', 'priority', 'status'])
  sortBy?: string; // Campo para ordenar

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: string; // Orden ascendente/descendente
}