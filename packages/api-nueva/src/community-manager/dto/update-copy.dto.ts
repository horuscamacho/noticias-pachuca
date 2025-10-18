import { IsString, IsEnum, IsUrl, MinLength, MaxLength } from 'class-validator';

/**
 * DTO para actualizar un copy de red social con URL
 */
export class UpdateCopyDto {
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  originalCopy: string; // Copy original sin URL

  @IsUrl()
  noticiaUrl: string; // URL completa de la noticia

  @IsEnum(['breaking_news', 'normal_news', 'blog', 'evergreen'])
  contentType: 'breaking_news' | 'normal_news' | 'blog' | 'evergreen';

  @IsEnum(['facebook', 'twitter'])
  platform: 'facebook' | 'twitter';
}

/**
 * Response DTO con copy actualizado
 */
export class UpdatedCopyResponseDto {
  updatedCopy: string; // Copy final con URL incluida
  originalCopy: string; // Copy original para referencia
  platform: string;
  estimatedLength: number; // Longitud estimada final
  isValid: boolean; // Si cumple con límites de la plataforma
}

/**
 * DTO para regenerar copys de contenido reciclado
 */
export class RegenerateCopiesDto {
  @IsString()
  noticiaId: string; // ID de la noticia a reciclar
}

/**
 * Response DTO con copys regenerados
 */
export class RegeneratedCopiesResponseDto {
  facebook: string; // Copy completo para Facebook
  twitter: string; // Copy completo para Twitter
  noticiaId: string;
  noticiaTitle: string;
  timestamp: Date;
}
