import { IsBoolean, IsDateString, IsMongoId, IsOptional, IsString, IsUrl, IsArray, IsIn } from 'class-validator';

/**
 * DTO para publicar una noticia desde el dashboard
 * 🌐 FASE 4: Soporte multi-sitio
 * 📱 FASE 12: Soporte para publicación en redes sociales
 */
export class PublishNoticiaDto {
  @IsMongoId({ message: 'contentId debe ser un ObjectId válido' })
  contentId: string; // ID del AIContentGeneration

  @IsBoolean()
  useOriginalImage: boolean; // true = usar imagen original, false = permitir upload

  @IsOptional()
  @IsUrl({}, { message: 'customImageUrl debe ser una URL válida' })
  customImageUrl?: string; // URL de imagen personalizada (si useOriginalImage = false)

  @IsOptional()
  @IsDateString({}, { message: 'scheduledPublishAt debe ser una fecha válida' })
  scheduledPublishAt?: Date; // Para publicación programada (Fase 2)

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean; // Marcar como destacada

  @IsOptional()
  @IsBoolean()
  isBreaking?: boolean; // Marcar como última hora

  /**
   * 🌐 FASE 4: Array de IDs de sitios donde publicar
   * Si no se especifica o está vacío, se usa el sitio principal por defecto
   */
  @IsOptional()
  @IsArray({ message: 'siteIds debe ser un array' })
  @IsMongoId({ each: true, message: 'Cada siteId debe ser un ObjectId válido' })
  siteIds?: string[];

  /**
   * 📱 FASE 12: Opciones de publicación en redes sociales
   */

  @IsOptional()
  @IsBoolean()
  publishToSocialMedia?: boolean; // Habilitar publicación en redes sociales (default: false)

  @IsOptional()
  @IsArray({ message: 'socialMediaPlatforms debe ser un array' })
  @IsIn(['facebook', 'twitter'], { each: true, message: 'Plataforma inválida. Debe ser "facebook" o "twitter"' })
  socialMediaPlatforms?: ('facebook' | 'twitter')[]; // Plataformas donde publicar (default: ['facebook', 'twitter'])

  @IsOptional()
  @IsBoolean()
  optimizeSocialContent?: boolean; // Optimizar contenido para cada plataforma (default: true)
}
