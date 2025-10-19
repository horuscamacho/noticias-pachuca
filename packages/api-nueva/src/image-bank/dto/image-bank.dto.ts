import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
  IsMongoId,
  IsUrl,
  IsNumber,
  IsDate,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============================================================================
// SUBDOCUMENTO: ProcessedImageUrls
// ============================================================================

export class ProcessedImageUrlsDto {
  @ApiProperty({
    description: 'URL CDN de imagen original procesada (max 1920px)',
    example: 'https://cdn.example.com/image-bank/milenio.com/2025/10/abc123/original.webp',
  })
  @IsUrl()
  original: string;

  @ApiProperty({
    description: 'URL CDN de thumbnail (400x250px)',
    example: 'https://cdn.example.com/image-bank/milenio.com/2025/10/abc123/thumbnail.webp',
  })
  @IsUrl()
  thumbnail: string;

  @ApiProperty({
    description: 'URL CDN de medium (800x500px)',
    example: 'https://cdn.example.com/image-bank/milenio.com/2025/10/abc123/medium.webp',
  })
  @IsUrl()
  medium: string;

  @ApiProperty({
    description: 'URL CDN de large (1200x630px)',
    example: 'https://cdn.example.com/image-bank/milenio.com/2025/10/abc123/large.webp',
  })
  @IsUrl()
  large: string;

  @ApiProperty({
    description: 'S3 base key para esta imagen',
    example: 'image-bank/milenio.com/2025/10/abc123',
  })
  @IsString()
  s3BaseKey: string;
}

// ============================================================================
// SUBDOCUMENTO: OriginalImageMetadata
// ============================================================================

export class OriginalImageMetadataDto {
  @ApiProperty({
    description: 'URL original de la imagen',
    example: 'https://www.milenio.com/uploads/media/2025/10/15/image.jpg',
  })
  @IsUrl()
  url: string;

  @ApiProperty({
    description: 'Ancho original en píxeles',
    example: 1920,
  })
  @IsNumber()
  @Min(1)
  width: number;

  @ApiProperty({
    description: 'Alto original en píxeles',
    example: 1080,
  })
  @IsNumber()
  @Min(1)
  height: number;

  @ApiProperty({
    description: 'Formato original de la imagen',
    example: 'jpeg',
  })
  @IsString()
  format: string;

  @ApiProperty({
    description: 'Tamaño original en bytes',
    example: 2048576,
  })
  @IsNumber()
  @Min(1)
  sizeBytes: number;
}

// ============================================================================
// CREATE DTO
// ============================================================================

export class CreateImageBankDto {
  @ApiProperty({
    description: 'URLs procesadas de la imagen',
    type: ProcessedImageUrlsDto,
  })
  @ValidateNested()
  @Type(() => ProcessedImageUrlsDto)
  processedUrls: ProcessedImageUrlsDto;

  @ApiProperty({
    description: 'Metadata de la imagen original',
    type: OriginalImageMetadataDto,
  })
  @ValidateNested()
  @Type(() => OriginalImageMetadataDto)
  originalMetadata: OriginalImageMetadataDto;

  @ApiPropertyOptional({
    description: 'Keywords asociadas a la imagen',
    example: ['pachuca', 'hidalgo', 'noticias'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @ApiProperty({
    description: 'Outlet (dominio) de origen',
    example: 'milenio.com',
  })
  @IsString()
  outlet: string;

  @ApiPropertyOptional({
    description: 'Categorías de la imagen',
    example: ['deportes', 'local'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({
    description: 'ID de la noticia extraída de origen (si aplica)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId()
  extractedNoticiaId?: string;

  @ApiProperty({
    description: 'URL del artículo/página donde se encontró la imagen',
    example: 'https://www.milenio.com/noticias/pachuca/noticia-ejemplo',
  })
  @IsUrl()
  sourceUrl: string;

  @ApiProperty({
    description: 'Fecha de extracción de la imagen original',
    example: '2025-10-10T12:00:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  extractedAt: Date;

  @ApiPropertyOptional({
    description: 'Texto alternativo para accesibilidad',
    example: 'Vista del estadio Hidalgo en Pachuca',
  })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional({
    description: 'Caption de la imagen',
    example: 'Estadio Hidalgo durante el partido del domingo',
  })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({
    description: 'Tags adicionales',
    example: ['estadio', 'fútbol', 'tuzos'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Calidad de la imagen',
    enum: ['high', 'medium', 'low'],
    example: 'high',
  })
  @IsOptional()
  @IsEnum(['high', 'medium', 'low'])
  quality?: 'high' | 'medium' | 'low';

  @ApiPropertyOptional({
    description: 'Si la imagen fue generada por IA',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  aiGenerated?: boolean;

  @ApiPropertyOptional({
    description: 'Si la imagen incluye metadata C2PA de autenticidad',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  c2paIncluded?: boolean;

  @ApiPropertyOptional({
    description: 'ID de la generación IA (si aplica)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId()
  imageGenerationId?: string;
}

// ============================================================================
// UPDATE DTO
// ============================================================================

export class UpdateImageBankDto {
  @ApiPropertyOptional({
    description: 'Actualizar keywords',
    example: ['pachuca', 'hidalgo', 'noticias', 'actualidad'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @ApiPropertyOptional({
    description: 'Actualizar categorías',
    example: ['deportes', 'local', 'cultura'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({
    description: 'Actualizar texto alternativo',
    example: 'Nueva descripción del estadio',
  })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional({
    description: 'Actualizar caption',
    example: 'Nueva caption para la imagen',
  })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({
    description: 'Actualizar tags',
    example: ['nuevo-tag', 'actualizado'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Marcar como activa/inactiva',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ============================================================================
// PROCESS IMAGE DTO
// ============================================================================

export class ProcessImageDto {
  @ApiProperty({
    description: 'URL de la imagen a procesar',
    example: 'https://www.milenio.com/uploads/media/2025/10/15/image.jpg',
  })
  @IsUrl()
  imageUrl: string;

  @ApiProperty({
    description: 'Outlet (dominio) de origen',
    example: 'milenio.com',
  })
  @IsString()
  outlet: string;

  @ApiPropertyOptional({
    description: 'Keywords para la imagen',
    example: ['pachuca', 'hidalgo'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @ApiPropertyOptional({
    description: 'Categorías para la imagen',
    example: ['local', 'noticias'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({
    description: 'ID de noticia extraída relacionada',
  })
  @IsOptional()
  @IsMongoId()
  extractedNoticiaId?: string;

  @ApiPropertyOptional({
    description: 'Texto alternativo',
    example: 'Vista del centro de Pachuca',
  })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional({
    description: 'Caption de la imagen',
    example: 'Centro histórico de Pachuca de Soto',
  })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({
    description: 'Tags adicionales',
    example: ['centro', 'histórico'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

// ============================================================================
// FILTERS DTO
// ============================================================================

export class ImageBankFiltersDto {
  @ApiPropertyOptional({
    description: 'Página (default: 1)',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Límite por página (default: 10, max: 100)',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Keywords separadas por coma',
    example: 'pachuca,hidalgo,noticias',
  })
  @IsOptional()
  @IsString()
  keywords?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por outlet',
    example: 'milenio.com',
  })
  @IsOptional()
  @IsString()
  outlet?: string;

  @ApiPropertyOptional({
    description: 'Categorías separadas por coma',
    example: 'deportes,local',
  })
  @IsOptional()
  @IsString()
  categories?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por calidad',
    enum: ['high', 'medium', 'low'],
  })
  @IsOptional()
  @IsEnum(['high', 'medium', 'low'])
  quality?: 'high' | 'medium' | 'low';

  @ApiPropertyOptional({
    description: 'Búsqueda de texto en altText, caption, keywords',
    example: 'estadio',
  })
  @IsOptional()
  @IsString()
  searchText?: string;

  @ApiPropertyOptional({
    description: 'Campo para ordenar',
    enum: ['createdAt', 'quality', 'outlet'],
  })
  @IsOptional()
  @IsEnum(['createdAt', 'quality', 'outlet'])
  sortBy?: 'createdAt' | 'quality' | 'outlet';

  @ApiPropertyOptional({
    description: 'Orden ascendente o descendente',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Solo imágenes activas (default: true)',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({
    description: 'Filtrar por autor/fuente',
    example: 'Juan Pérez / Wikimedia Commons',
  })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de captura',
    enum: ['wikipedia', 'unsplash', 'pexels', 'video_screenshot', 'social_screenshot', 'staff_photo', 'news_agency', 'other'],
  })
  @IsOptional()
  @IsEnum(['wikipedia', 'unsplash', 'pexels', 'video_screenshot', 'social_screenshot', 'staff_photo', 'news_agency', 'other'])
  captureType?: string;
}
