import { IsString, IsOptional, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ListingSelectorsDto, ContentSelectorsDto } from './create-website-config.dto';

/**
 * 🤖 DTOs para control del sistema - Generator Pro
 */

export class SystemControlDto {
  @IsEnum(['start', 'stop', 'pause', 'resume'])
  action: string; // Acción a realizar

  @IsOptional()
  @IsString()
  websiteId?: string; // ID del sitio específico (opcional)

  @IsOptional()
  @IsString()
  reason?: string; // Razón de la acción
}

export class GeneratorProTestSelectorsDto {
  @IsString()
  baseUrl: string; // URL base para testing

  @IsString()
  listingUrl: string; // URL del listado para testing

  @ValidateNested()
  @Type(() => ListingSelectorsDto)
  listingSelectors: ListingSelectorsDto; // Selectores del listado

  @ValidateNested()
  @Type(() => ContentSelectorsDto)
  contentSelectors: ContentSelectorsDto; // Selectores del contenido

  @IsOptional()
  @IsString()
  testUrl?: string; // URL específica para probar extracción de contenido
}