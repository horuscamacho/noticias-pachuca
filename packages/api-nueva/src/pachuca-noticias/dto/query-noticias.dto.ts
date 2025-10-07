import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO para consultar noticias con filtros y paginación
 */
export class QueryNoticiasDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(['draft', 'scheduled', 'published', 'unpublished', 'archived'])
  status?: 'draft' | 'scheduled' | 'published' | 'unpublished' | 'archived';

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isBreaking?: boolean;

  @IsOptional()
  @IsString()
  search?: string; // Búsqueda por título o contenido

  @IsOptional()
  @IsEnum(['publishedAt', 'createdAt', 'priority', 'views'])
  sortBy?: 'publishedAt' | 'createdAt' | 'priority' | 'views' = 'publishedAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
