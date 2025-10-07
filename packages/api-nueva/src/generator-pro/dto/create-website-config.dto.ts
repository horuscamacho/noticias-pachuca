import { IsString, IsUrl, IsBoolean, IsNumber, IsOptional, ValidateNested, IsObject, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

/**
 * 🤖 DTO para crear configuración de sitio web de noticias - Generator Pro
 */

export class ListingSelectorsDto {
  @IsString()
  articleLinks: string; // CSS selector para links de artículos

  @IsOptional()
  @IsString()
  titleSelector?: string; // Selector título desde listado

  @IsOptional()
  @IsString()
  imageSelector?: string; // Selector imagen desde listado

  @IsOptional()
  @IsString()
  dateSelector?: string; // Selector fecha desde listado

  @IsOptional()
  @IsString()
  categorySelector?: string; // Selector categoría desde listado
}

export class ContentSelectorsDto {
  @IsString()
  titleSelector: string; // CSS selector para título

  @IsString()
  contentSelector: string; // CSS selector para contenido

  @IsOptional()
  @IsString()
  imageSelector?: string; // CSS selector para imagen principal

  @IsOptional()
  @IsString()
  dateSelector?: string; // CSS selector para fecha

  @IsOptional()
  @IsString()
  authorSelector?: string; // CSS selector para autor

  @IsOptional()
  @IsString()
  categorySelector?: string; // CSS selector para categoría

  @IsOptional()
  @IsString()
  tagsSelector?: string; // CSS selector para tags
}

export class ContentFiltersDto {
  @IsOptional()
  @IsNumber()
  @Min(10)
  minContentLength?: number; // Longitud mínima de contenido

  @IsOptional()
  @IsString({ each: true })
  excludeKeywords?: string[]; // Palabras clave a excluir

  @IsOptional()
  @IsString({ each: true })
  requiredKeywords?: string[]; // Palabras clave requeridas
}

export class ExtractionSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  maxUrlsPerExtraction?: number; // Máximo URLs por extracción

  @IsOptional()
  @IsBoolean()
  duplicateFilter?: boolean; // Filtrar URLs duplicadas

  @IsOptional()
  @ValidateNested()
  @Type(() => ContentFiltersDto)
  contentFilters?: ContentFiltersDto; // Filtros de contenido
}


export class ContentSettingsDto {
  @IsOptional()
  @IsBoolean()
  generateOnExtraction?: boolean; // Auto-generar contenido

  @IsOptional()
  @IsBoolean()
  requireApproval?: boolean; // Requiere aprobación manual

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  maxContentPerDay?: number; // Máximo contenido por día

  @IsOptional()
  @IsObject()
  categoryMapping?: Record<string, string>; // Mapeo categorías
}

export class CreateWebsiteConfigDto {
  @IsString()
  name: string; // Nombre del sitio web

  @IsUrl()
  baseUrl: string; // URL base del sitio

  @IsUrl()
  listingUrl: string; // URL del listado de noticias

  @IsOptional()
  @IsUrl()
  testUrl?: string; // URL específica para probar selectores

  @IsOptional()
  @IsBoolean()
  isActive?: boolean; // Estado activo/inactivo

  @ValidateNested()
  @Type(() => ListingSelectorsDto)
  listingSelectors: ListingSelectorsDto; // Selectores para listado

  @ValidateNested()
  @Type(() => ContentSelectorsDto)
  contentSelectors: ContentSelectorsDto; // Selectores para contenido

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1440)
  extractionFrequency?: number; // Frecuencia extracción en minutos

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1440)
  generationFrequency?: number; // Frecuencia generación en minutos

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1440)
  publishingFrequency?: number; // Frecuencia publicación en minutos

  @IsOptional()
  @ValidateNested()
  @Type(() => ExtractionSettingsDto)
  extractionSettings?: ExtractionSettingsDto; // Configuración extracción

  @IsOptional()
  @IsObject()
  customHeaders?: Record<string, string>; // Headers personalizados

  @IsOptional()
  @IsString()
  defaultTemplateId?: string; // Template por defecto Content-AI

  @IsOptional()
  @ValidateNested()
  @Type(() => ContentSettingsDto)
  contentSettings?: ContentSettingsDto; // Configuración contenido

  @IsOptional()
  @IsString()
  notes?: string; // Notas adicionales
}