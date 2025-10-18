import { IsString, IsBoolean, IsNumber, IsOptional, ValidateNested, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 🐦 DTO para crear configuración de publicación en Twitter - Generator Pro
 */

export class TwitterOptimizationSettingsDto {
  @IsOptional()
  @IsBoolean()
  useEmojis?: boolean; // Usar emojis automáticamente (max 2)

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(2)
  maxEmojis?: number; // Máximo emojis por tweet (Twitter best practice: 2)

  @IsOptional()
  @IsBoolean()
  useHashtags?: boolean; // Usar hashtags automáticamente (max 3)

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(3)
  maxHashtags?: number; // Máximo hashtags por tweet (Twitter best practice: 3)

  @IsOptional()
  @IsBoolean()
  includeCallToAction?: boolean; // Incluir call-to-action

  @IsOptional()
  @IsBoolean()
  optimizeForEngagement?: boolean; // Optimizar para engagement

  @IsOptional()
  @IsBoolean()
  addSourceReference?: boolean; // Incluir referencia fuente

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(280)
  maxTweetLength?: number; // Máximo caracteres (Twitter limit: 280)
}

export class TwitterMediaSettingsDto {
  @IsOptional()
  @IsBoolean()
  includeImages?: boolean; // Incluir imágenes en tweets

  @IsOptional()
  @IsBoolean()
  imageOptimization?: boolean; // Optimizar imágenes para Twitter

  @IsOptional()
  @IsString()
  preferredImageSize?: string; // Tamaño preferido (ej: "1200x675")

  @IsOptional()
  @IsString()
  fallbackImageUrl?: string; // Imagen por defecto

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4)
  maxImages?: number; // Máximo imágenes por tweet (Twitter permite 4)
}

export class TwitterContentFilteringDto {
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(280)
  minWordCount?: number; // Mínimo palabras

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(280)
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

export class TwitterAdvancedSettingsDto {
  @IsOptional()
  @IsBoolean()
  scheduleOptimalTimes?: boolean; // Programar horarios óptimos

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  optimalTimes?: string[]; // Horarios óptimos ["09:00", "13:00", "18:00"]

  @IsOptional()
  @IsBoolean()
  skipWeekends?: boolean; // No tweetear fines de semana

  @IsOptional()
  @IsBoolean()
  skipHolidays?: boolean; // No tweetear días festivos

  @IsOptional()
  @ValidateNested()
  @Type(() => TwitterContentFilteringDto)
  contentFiltering?: TwitterContentFilteringDto; // Filtrado de contenido

  @IsOptional()
  @IsBoolean()
  duplicateDetection?: boolean; // Detectar contenido duplicado

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1440)
  cooldownPeriod?: number; // Tiempo entre tweets (minutos)

  @IsOptional()
  @IsBoolean()
  threadMode?: boolean; // Crear hilos si el contenido es largo
}

export class CreateTwitterConfigDto {
  @IsString()
  siteId: string; // ID del sitio destino de publicación

  @IsString()
  name: string; // Nombre de la configuración (ej: "Twitter Noticias Pachuca")

  @IsString()
  twitterAccountId: string; // ID de la cuenta Twitter en GetLate

  @IsString()
  twitterUsername: string; // @username de Twitter (sin @)

  @IsString()
  twitterDisplayName: string; // Nombre de display de la cuenta

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
  @Max(50)
  maxTweetsPerDay?: number; // Máximo tweets por día

  @IsOptional()
  @IsString()
  tweetTemplate?: string; // Template para el tweet con variables

  @IsOptional()
  @IsString()
  fallbackTemplate?: string; // Template alternativo

  @IsOptional()
  @ValidateNested()
  @Type(() => TwitterOptimizationSettingsDto)
  optimizationSettings?: TwitterOptimizationSettingsDto; // Configuración optimización

  @IsOptional()
  @ValidateNested()
  @Type(() => TwitterMediaSettingsDto)
  mediaSettings?: TwitterMediaSettingsDto; // Configuración multimedia

  @IsOptional()
  @ValidateNested()
  @Type(() => TwitterAdvancedSettingsDto)
  advancedSettings?: TwitterAdvancedSettingsDto; // Configuración avanzada

  @IsOptional()
  @IsString()
  notes?: string; // Notas adicionales
}
