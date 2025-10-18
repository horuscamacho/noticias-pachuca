import { IsMongoId, IsOptional, IsUrl } from 'class-validator';

/**
 * 📱 DTO para mejorar copy de redes sociales
 */
export class ImproveCopyDto {
  @IsMongoId({ message: 'contentId debe ser un ObjectId válido' })
  contentId: string; // ID del AIContentGeneration

  @IsOptional()
  @IsUrl({}, { message: 'canonicalUrl debe ser una URL válida' })
  canonicalUrl?: string; // URL canónica de la noticia publicada
}

/**
 * 📱 DTO de respuesta para copy mejorado
 */
export class ImprovedCopyResponseDto {
  facebook?: {
    hook: string;
    copy: string;
    emojis: string[];
    hookType: string;
    estimatedEngagement: 'high' | 'medium' | 'low';
  };

  twitter?: {
    tweet: string;
    hook: string;
    emojis: string[];
    hookType: string;
    threadIdeas: string[];
  };
}
