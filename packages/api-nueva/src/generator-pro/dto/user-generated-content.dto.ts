import {
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  IsNotEmpty,
  MinLength,
  MaxLength,
  ArrayMaxSize,
  IsUrl,
  IsMongoId,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 📝 DTOs para User Generated Content (Contenido Manual)
 * Sistema de creación de contenido original en modo URGENT o NORMAL
 */

// ============================================================
// ENUMS
// ============================================================

export enum PublicationType {
  BREAKING = 'breaking',
  NOTICIA = 'noticia',
  BLOG = 'blog',
}

// ============================================================
// CREATE URGENT CONTENT DTO
// ============================================================

/**
 * DTO para crear contenido URGENT (última hora)
 * - Se publica automáticamente
 * - Redacción corta (300-500 palabras)
 * - Copys agresivos para redes sociales
 * - Auto-cierre después de 2 horas sin actualización
 */
export class CreateUrgentContentDto {
  @ApiProperty({
    description: 'Título original de la noticia de última hora',
    example: 'Accidente múltiple en carretera Pachuca-México',
    minLength: 10,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'El título debe tener al menos 10 caracteres' })
  @MaxLength(200, { message: 'El título no puede exceder 200 caracteres' })
  originalTitle: string;

  @ApiProperty({
    description: 'Contenido original de la noticia (texto plano o HTML básico)',
    example: 'Se reporta un accidente múltiple en el kilómetro 45 de la carretera...',
    minLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(50, { message: 'El contenido debe tener al menos 50 caracteres' })
  originalContent: string;

  @ApiProperty({
    description: 'ID del agente editorial que generará el contenido',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId({ message: 'El ID del agente debe ser un MongoID válido' })
  @IsNotEmpty({ message: 'Debes seleccionar un agente editorial' })
  agentId: string;

  @ApiProperty({
    description: 'ID del sitio donde se publicará el contenido',
    example: '507f1f77bcf86cd799439012',
  })
  @IsMongoId({ message: 'El ID del sitio debe ser un MongoID válido' })
  @IsNotEmpty({ message: 'Debes seleccionar un sitio de publicación' })
  siteId: string;

  @ApiPropertyOptional({
    description: 'URLs de imágenes subidas por el usuario (opcional)',
    example: ['https://s3.amazonaws.com/bucket/image1.jpg'],
    type: [String],
    maxItems: 10,
  })
  @IsArray()
  @IsOptional()
  @ArrayMaxSize(10, { message: 'Máximo 10 imágenes permitidas' })
  @IsUrl({}, { each: true, message: 'Cada URL de imagen debe ser válida' })
  uploadedImageUrls?: string[];

  @ApiPropertyOptional({
    description: 'URLs de videos subidos por el usuario (opcional)',
    example: ['https://s3.amazonaws.com/bucket/video1.mp4'],
    type: [String],
    maxItems: 5,
  })
  @IsArray()
  @IsOptional()
  @ArrayMaxSize(5, { message: 'Máximo 5 videos permitidos' })
  @IsUrl({}, { each: true, message: 'Cada URL de video debe ser válida' })
  uploadedVideoUrls?: string[];
}

// ============================================================
// CREATE NORMAL CONTENT DTO
// ============================================================

/**
 * DTO para crear contenido NORMAL (publicación manual)
 * - Usuario decide el tipo de publicación
 * - Redacción normal (500-700 palabras)
 * - Copys normales para redes sociales
 * - NO se auto-cierra
 */
export class CreateNormalContentDto extends CreateUrgentContentDto {
  @ApiProperty({
    description: 'Tipo de publicación',
    enum: PublicationType,
    example: PublicationType.NOTICIA,
  })
  @IsEnum(PublicationType, {
    message: 'El tipo de publicación debe ser: breaking, noticia o blog',
  })
  publicationType: PublicationType;
}

// ============================================================
// UPDATE URGENT CONTENT DTO
// ============================================================

/**
 * DTO para actualizar contenido URGENT
 * - Reemplaza el contenido existente
 * - Re-procesa con IA
 * - Re-publica
 * - REINICIA el timer de 2 horas
 */
export class UpdateUrgentContentDto {
  @ApiProperty({
    description: 'Nuevo contenido para actualizar la noticia',
    example: 'ACTUALIZACIÓN: Se confirman 3 heridos en el accidente...',
    minLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(50, { message: 'El nuevo contenido debe tener al menos 50 caracteres' })
  newContent: string;

  @ApiPropertyOptional({
    description: 'Nuevas URLs de imágenes (opcional)',
    example: ['https://s3.amazonaws.com/bucket/updated-image.jpg'],
    type: [String],
    maxItems: 10,
  })
  @IsArray()
  @IsOptional()
  @ArrayMaxSize(10, { message: 'Máximo 10 imágenes permitidas' })
  @IsUrl({}, { each: true, message: 'Cada URL de imagen debe ser válida' })
  newImageUrls?: string[];
}

// ============================================================
// RESPONSE DTOS
// ============================================================

/**
 * DTO para respuesta de contenido creado
 */
export class UserGeneratedContentResponseDto {
  @ApiProperty({ description: 'ID del contenido creado' })
  id: string;

  @ApiProperty({ description: 'Título original' })
  originalTitle: string;

  @ApiProperty({ description: 'Modo de publicación', enum: ['urgent', 'normal'] })
  mode: 'urgent' | 'normal';

  @ApiProperty({ description: 'Estado del contenido', enum: ['draft', 'processing', 'published', 'closed', 'failed'] })
  status: 'draft' | 'processing' | 'published' | 'closed' | 'failed';

  @ApiPropertyOptional({ description: 'Flag de contenido urgent' })
  isUrgent?: boolean;

  @ApiPropertyOptional({ description: 'Fecha de auto-cierre (urgent)' })
  urgentAutoCloseAt?: Date;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'ID de la noticia publicada' })
  publishedNoticiaId?: string;

  @ApiPropertyOptional({ description: 'Slug de la noticia publicada (para links)' })
  slug?: string;

  @ApiPropertyOptional({ description: 'Título generado de la noticia' })
  title?: string;
}

/**
 * DTO para listado de contenido urgent activo
 */
export class ActiveUrgentContentResponseDto {
  @ApiProperty({ description: 'Lista de contenido urgent activo', type: [UserGeneratedContentResponseDto] })
  content: UserGeneratedContentResponseDto[];

  @ApiProperty({ description: 'Total de contenidos activos' })
  total: number;
}
