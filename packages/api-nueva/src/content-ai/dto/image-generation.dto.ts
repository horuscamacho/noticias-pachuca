import { IsString, IsOptional, IsBoolean, IsArray, IsIn, MaxLength, IsMongoId, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para solicitud de generación de imagen
 */
export class GenerateNewsImageDto {
  @IsString()
  @MaxLength(2000, { message: 'Prompt must be 2000 characters or less' })
  prompt: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Watermark text must be 50 characters or less' })
  watermarkText?: string;

  @IsOptional()
  @IsBoolean()
  includeDecorations?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsString()
  @IsIn(['gpt-image-1', 'dall-e-3'])
  model?: string;

  @IsOptional()
  @IsString()
  @IsIn(['low', 'medium', 'high'])
  quality?: 'low' | 'medium' | 'high';

  @IsOptional()
  @IsString()
  @IsIn(['1024x1024', '1024x1536', '1536x1024'])
  size?: string;

  @IsOptional()
  @IsMongoId({ message: 'Invalid extracted noticia ID' })
  extractedNoticiaId?: string;

  @IsOptional()
  @IsMongoId({ message: 'Invalid source image ID' })
  sourceImageId?: string;

  @IsOptional()
  @IsString()
  sourceImageUrl?: string;
}

/**
 * DTO para actualizar resultado de generación (usado por queue processor)
 * FASE 5: Ahora incluye metadata limpia
 */
export class GenerationResultDto {
  @IsString()
  generatedImageUrl: string;

  @IsNumber()
  @Min(0)
  cost: number;

  @IsNumber()
  @Min(0)
  generationTime: number;

  @IsNumber()
  @Min(0)
  processingTime: number;

  @IsOptional()
  @IsBoolean()
  c2paIncluded?: boolean;

  // NUEVO (FASE 5): Metadata limpia
  @IsOptional()
  @IsString()
  @MaxLength(150)
  altText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  caption?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];
}

/**
 * DTO para filtros de consulta
 */
export class ImageGenerationFiltersDto {
  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  @IsIn(['low', 'medium', 'high'])
  quality?: 'low' | 'medium' | 'high';

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  aiGenerated?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  editorialReviewed?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;
}

/**
 * Interface para filtros internos
 */
export interface ImageGenerationFilters {
  model?: string;
  quality?: 'low' | 'medium' | 'high';
  aiGenerated?: boolean;
  editorialReviewed?: boolean;
  page?: number;
  limit?: number;
}

/**
 * DTO para editar una imagen existente
 */
export class EditImageDto {
  @IsString()
  @IsMongoId()
  sourceImageId: string;

  @IsString()
  @MaxLength(2000)
  prompt: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  watermarkText?: string;

  @IsOptional()
  @IsString()
  @IsIn(['1024x1024', '1024x1536', '1536x1024'])
  size?: string;
}

/**
 * DTO para query de listado de generaciones
 */
export class ImageGenerationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  @IsIn(['gpt-image-1', 'dall-e-3'])
  model?: string;

  @IsOptional()
  @IsString()
  @IsIn(['low', 'medium', 'high'])
  quality?: 'low' | 'medium' | 'high';

  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'cost', 'quality'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: string = 'desc';
}

/**
 * DTO para almacenar imagen en el banco de imágenes
 */
export class StoreInBankDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  altText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string;
}
