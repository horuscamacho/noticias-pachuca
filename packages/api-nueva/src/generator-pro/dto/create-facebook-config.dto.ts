import { IsString, IsBoolean, IsNumber, IsOptional, ValidateNested, IsObject, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 🤖 DTO para crear configuración de publicación en Facebook - Generator Pro
 */

export class OptimizationSettingsDto {
  @IsOptional()
  @IsBoolean()
  useEmojis?: boolean; // Usar emojis automáticamente

  @IsOptional()
  @IsBoolean()
  useHashtags?: boolean; // Usar hashtags automáticamente

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxHashtags?: number; // Máximo hashtags por post

  @IsOptional()
  @IsBoolean()
  includeCallToAction?: boolean; // Incluir call-to-action

  @IsOptional()
  @IsBoolean()
  optimizeForEngagement?: boolean; // Optimizar para engagement

  @IsOptional()
  @IsBoolean()
  addSourceReference?: boolean; // Incluir referencia fuente
}

export class MediaSettingsDto {
  @IsOptional()
  @IsBoolean()
  includeImages?: boolean; // Incluir imágenes en posts

  @IsOptional()
  @IsBoolean()
  imageOptimization?: boolean; // Optimizar imágenes

  @IsOptional()
  @IsString()
  preferredImageSize?: string; // Tamaño preferido (ej: "1200x630")

  @IsOptional()
  @IsString()
  fallbackImageUrl?: string; // Imagen por defecto

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxImages?: number; // Máximo imágenes por post
}

export class ContentFilteringDto {
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(10000)
  minWordCount?: number; // Mínimo palabras

  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(10000)
  maxWordCount?: number; // Máximo palabras

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bannedKeywords?: string[]; // Palabras prohibidas

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredKeywords?: string[]; // Palabras requeridas
}

export class AdvancedSettingsDto {
  @IsOptional()
  @IsBoolean()
  scheduleOptimalTimes?: boolean; // Programar horarios óptimos

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  optimalTimes?: string[]; // Horarios óptimos ["09:00", "13:00"]

  @IsOptional()
  @IsBoolean()
  skipWeekends?: boolean; // No publicar fines de semana

  @IsOptional()
  @IsBoolean()
  skipHolidays?: boolean; // No publicar días festivos

  @IsOptional()
  @ValidateNested()
  @Type(() => ContentFilteringDto)
  contentFiltering?: ContentFilteringDto; // Filtrado de contenido

  @IsOptional()
  @IsBoolean()
  duplicateDetection?: boolean; // Detectar contenido duplicado

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1440)
  cooldownPeriod?: number; // Tiempo entre posts (minutos)
}

export class CreateFacebookConfigDto {
  @IsString()
  websiteConfigId: string; // ID del sitio web asociado

  @IsString()
  name: string; // Nombre de la configuración

  @IsString()
  facebookPageId: string; // ID de la página Facebook

  @IsString()
  facebookPageName: string; // Nombre de la página Facebook

  @IsString()
  getLateApiKey: string; // API key de GetLate.dev

  @IsString()
  templateId: string; // ID del template Content-AI

  @IsOptional()
  @IsBoolean()
  isActive?: boolean; // Estado activo/inactivo

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1440)
  publishingFrequency?: number; // Frecuencia publicación (minutos)

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxPostsPerDay?: number; // Máximo posts por día

  @IsOptional()
  @IsString()
  postTemplate?: string; // Template para copy Facebook

  @IsOptional()
  @IsString()
  fallbackTemplate?: string; // Template alternativo

  @IsOptional()
  @ValidateNested()
  @Type(() => OptimizationSettingsDto)
  optimizationSettings?: OptimizationSettingsDto; // Configuración optimización

  @IsOptional()
  @ValidateNested()
  @Type(() => MediaSettingsDto)
  mediaSettings?: MediaSettingsDto; // Configuración multimedia

  @IsOptional()
  @ValidateNested()
  @Type(() => AdvancedSettingsDto)
  advancedSettings?: AdvancedSettingsDto; // Configuración avanzada

  @IsOptional()
  @IsString()
  notes?: string; // Notas adicionales
}