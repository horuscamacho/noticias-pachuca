import { IsBoolean, IsDateString, IsMongoId, IsOptional, IsString, IsUrl } from 'class-validator';

/**
 * DTO para publicar una noticia desde el dashboard
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
}
