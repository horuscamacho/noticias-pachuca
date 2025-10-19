import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 📸 Enum de tipos de captura/fuente de imagen
 */
export enum CaptureType {
  WIKIPEDIA = 'wikipedia',
  UNSPLASH = 'unsplash',
  PEXELS = 'pexels',
  VIDEO_SCREENSHOT = 'video_screenshot',
  SOCIAL_SCREENSHOT = 'social_screenshot',
  STAFF_PHOTO = 'staff_photo',
  NEWS_AGENCY = 'news_agency',
  OTHER = 'other',
}

/**
 * 📸 Enum de calidad de imagen
 */
export enum ImageQuality {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/**
 * 📸 DTO para upload manual de imágenes
 * Contiene metadata común que se aplicará a todas las imágenes subidas
 */
export class UploadImageMetadataDto {
  // ========================================
  // OBLIGATORIO
  // ========================================

  @ApiProperty({
    description: 'Outlet/dominio de origen (ej: noticiaspachuca.com)',
    example: 'noticiaspachuca.com',
  })
  @IsString()
  @IsNotEmpty()
  outlet: string;

  // ========================================
  // AUTHOR Y ATTRIBUTION (OPCIONAL)
  // ========================================

  @ApiPropertyOptional({
    description:
      'Autor/fuente de la imagen (generado automáticamente según captureType)',
    example: 'Juan Pérez / Wikimedia Commons',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  author?: string;

  @ApiPropertyOptional({
    description: 'Licencia de la imagen',
    example: 'CC BY-SA 4.0',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  license?: string;

  @ApiPropertyOptional({
    description: 'Texto completo de atribución formateado',
    example:
      'Juan Pérez. (2025). Palacio de Gobierno [Digital image]. Wikimedia Commons.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  attribution?: string;

  @ApiPropertyOptional({
    description: 'Tipo de captura/fuente de la imagen',
    enum: CaptureType,
    example: CaptureType.WIKIPEDIA,
  })
  @IsOptional()
  @IsEnum(CaptureType)
  captureType?: CaptureType;

  @ApiPropertyOptional({
    description: 'Nombre del fotógrafo (si aplica)',
    example: 'Juan Pérez',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  photographerName?: string;

  // ========================================
  // METADATA ADICIONAL (OPCIONAL)
  // ========================================

  @ApiPropertyOptional({
    description: 'Keywords para búsqueda',
    type: [String],
    example: ['hidalgo', 'política', 'gobierno'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @ApiPropertyOptional({
    description: 'Tags adicionales',
    type: [String],
    example: ['elecciones', 'municipio'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Categorías',
    type: [String],
    example: ['Política', 'Gobierno'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({
    description: 'Texto alternativo para accesibilidad (max 200 chars)',
    example: 'Palacio de Gobierno de Hidalgo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  altText?: string;

  @ApiPropertyOptional({
    description: 'Caption o descripción de la imagen (max 500 chars)',
    example: 'Vista frontal del Palacio de Gobierno del estado de Hidalgo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string;

  @ApiPropertyOptional({
    description: 'Calidad de la imagen',
    enum: ImageQuality,
    default: ImageQuality.MEDIUM,
  })
  @IsOptional()
  @IsEnum(ImageQuality)
  quality?: ImageQuality;
}

/**
 * 📸 Respuesta de upload de imágenes
 */
export class UploadImageResponseDto {
  @ApiProperty({
    description: 'Indica si el upload fue exitoso',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Array de imágenes subidas exitosamente',
    type: 'array',
  })
  uploadedImages: unknown[];

  @ApiProperty({
    description: 'Total de imágenes subidas',
    example: 3,
  })
  totalUploaded: number;

  @ApiProperty({
    description: 'Errores ocurridos durante el upload',
    type: 'array',
    example: [
      { filename: 'image1.jpg', error: 'File too large' },
    ],
  })
  errors: Array<{ filename: string; error: string }>;
}
