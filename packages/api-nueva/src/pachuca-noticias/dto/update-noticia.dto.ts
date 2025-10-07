import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * DTO para actualizar una noticia publicada
 */
export class UpdateNoticiaDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isBreaking?: boolean;

  @IsOptional()
  @IsEnum(['draft', 'scheduled', 'published', 'unpublished', 'archived'])
  status?: 'draft' | 'scheduled' | 'published' | 'unpublished' | 'archived';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  priority?: number;
}
