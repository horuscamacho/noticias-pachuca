import { IsUrl, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para solicitud de análisis de listado con AI
 */
export class AiAnalyzeListingDto {
  @ApiProperty({
    description: 'URL de la página de listado de noticias',
    example: 'https://example.com/noticias',
  })
  @IsUrl({}, { message: 'listingUrl debe ser una URL válida' })
  @IsNotEmpty({ message: 'listingUrl es requerido' })
  listingUrl: string;
}

/**
 * DTO para respuesta de análisis de listado
 */
export class AiAnalyzeListingResponseDto {
  @ApiProperty({
    description: 'Selector CSS detectado para enlaces de artículos',
    example: 'article.news-item a.title-link',
  })
  selector: string;

  @ApiProperty({
    description: 'Nivel de confianza del selector (0-1)',
    example: 0.95,
  })
  confidence: number;

  @ApiProperty({
    description: 'URLs encontradas usando el selector',
    example: ['https://example.com/articulo-1', 'https://example.com/articulo-2'],
    type: [String],
  })
  urlsFound: string[];

  @ApiProperty({
    description: 'Cantidad total de URLs encontradas',
    example: 12,
  })
  count: number;

  @ApiProperty({
    description: 'Explicación del selector elegido',
    example: 'Selector basado en clase específica .news-item que envuelve cada artículo',
  })
  reasoning: string;

  @ApiProperty({
    description: 'Estadísticas de optimización HTML',
    required: false,
  })
  optimizationStats?: {
    originalSize: number;
    optimizedSize: number;
    reductionPercentage: number;
    estimatedTokens: number;
  };
}
