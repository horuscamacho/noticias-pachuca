import { IsUrl, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para solicitud de análisis de contenido con AI
 */
export class AiAnalyzeContentDto {
  @ApiProperty({
    description: 'URL de un artículo individual para análisis',
    example: 'https://example.com/noticias/articulo-1',
  })
  @IsUrl({}, { message: 'contentUrl debe ser una URL válida' })
  @IsNotEmpty({ message: 'contentUrl es requerido' })
  contentUrl: string;
}

/**
 * DTO para selectores de contenido detectados
 */
export class ContentSelectorsDto {
  @ApiProperty({
    description: 'Selector CSS para el título',
    example: 'h1.entry-title',
  })
  titleSelector: string;

  @ApiProperty({
    description: 'Selector CSS para el contenido completo',
    example: '.entry-content',
  })
  contentSelector: string;

  @ApiProperty({
    description: 'Selector CSS para la imagen principal',
    example: '.featured-image img',
    required: false,
  })
  imageSelector?: string;

  @ApiProperty({
    description: 'Selector CSS para la fecha de publicación',
    example: 'time.published',
    required: false,
  })
  dateSelector?: string;

  @ApiProperty({
    description: 'Selector CSS para el autor',
    example: '.author-name',
    required: false,
  })
  authorSelector?: string;

  @ApiProperty({
    description: 'Selector CSS para la categoría',
    example: '.category-link',
    required: false,
  })
  categorySelector?: string;
}

/**
 * DTO para contenido extraído (preview)
 */
export class ExtractedContentPreviewDto {
  @ApiProperty({
    description: 'Título extraído',
    example: 'Noticia importante del día',
  })
  title: string;

  @ApiProperty({
    description: 'Contenido completo extraído',
    example: 'Este es el contenido completo del artículo...',
  })
  content: string;

  @ApiProperty({
    description: 'URL de la imagen',
    example: 'https://example.com/images/noticia.jpg',
    required: false,
  })
  image?: string;

  @ApiProperty({
    description: 'Fecha de publicación',
    example: '2025-10-09',
    required: false,
  })
  date?: string;

  @ApiProperty({
    description: 'Autor del artículo',
    example: 'Juan Pérez',
    required: false,
  })
  author?: string;

  @ApiProperty({
    description: 'Categoría del artículo',
    example: 'Política',
    required: false,
  })
  category?: string;
}

/**
 * DTO para respuesta de análisis de contenido
 */
export class AiAnalyzeContentResponseDto {
  @ApiProperty({
    description: 'Selectores CSS detectados',
    type: ContentSelectorsDto,
  })
  selectors: ContentSelectorsDto;

  @ApiProperty({
    description: 'Nivel de confianza de los selectores (0-1)',
    example: 0.92,
  })
  confidence: number;

  @ApiProperty({
    description: 'Preview del contenido extraído usando los selectores',
    type: ExtractedContentPreviewDto,
  })
  extractedPreview: ExtractedContentPreviewDto;

  @ApiProperty({
    description: 'Explicación de los selectores elegidos',
    example: 'Selectores basados en clases semánticas y estructura HTML5',
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
