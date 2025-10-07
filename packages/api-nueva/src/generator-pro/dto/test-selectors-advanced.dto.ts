import { IsString, IsOptional, IsEnum, ValidateNested, IsArray, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ListingSelectorsDto, ContentSelectorsDto } from './create-website-config.dto';

/**
 * 🧪 DTOs avanzados para testing de selectores - Generator Pro
 */

export class TestIndividualContentDto {
  @ApiProperty({
    description: 'URL específica de una noticia para probar selectores de contenido',
    example: 'https://culturageek.com.ar/vectis-te-contamos-todo-lo-que-tenes-que-saber/'
  })
  @IsString()
  testUrl: string;

  @ApiProperty({
    description: 'Selectores CSS para extracción de contenido',
    type: () => ContentSelectorsDto
  })
  @ValidateNested()
  @Type(() => ContentSelectorsDto)
  contentSelectors: ContentSelectorsDto;
}

export class TestListingSelectorsDto {
  @ApiProperty({
    description: 'URL base del sitio web',
    example: 'https://culturageek.com.ar'
  })
  @IsString()
  baseUrl: string;

  @ApiProperty({
    description: 'URL del listado de noticias',
    example: 'https://culturageek.com.ar/category/tecnoticias/gadgets-y-hardware/'
  })
  @IsString()
  listingUrl: string;

  @ApiProperty({
    description: 'Selectores CSS para extracción de URLs del listado',
    type: () => ListingSelectorsDto
  })
  @ValidateNested()
  @Type(() => ListingSelectorsDto)
  listingSelectors: ListingSelectorsDto;

  @ApiProperty({
    description: 'Límite de URLs a extraer para testing',
    example: 10,
    required: false
  })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

/**
 * 📊 Response DTOs para testing
 */

export class ExtractedUrlDto {
  @ApiProperty({ description: 'URL extraída de la noticia' })
  @IsString()
  url: string;

  @ApiProperty({ description: 'Título extraído (si disponible)', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Imagen extraída (si disponible)', required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ description: 'Fecha extraída (si disponible)', required: false })
  @IsOptional()
  @IsString()
  publishedAt?: string;
}

export class ExtractedContentDto {
  @ApiProperty({ description: 'URL de la noticia' })
  @IsString()
  url: string;

  @ApiProperty({ description: 'Título extraído', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Contenido extraído', required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ description: 'Imágenes extraídas', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ description: 'Fecha de publicación', required: false })
  @IsOptional()
  @IsString()
  publishedAt?: string;

  @ApiProperty({ description: 'Autor extraído', required: false })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiProperty({ description: 'Categoría extraída', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: 'Tags extraídos', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class TestListingResponseDto {
  @ApiProperty({ description: 'URLs extraídas del listado', type: [ExtractedUrlDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtractedUrlDto)
  extractedUrls: ExtractedUrlDto[];

  @ApiProperty({ description: 'Número total de URLs extraídas' })
  @IsNumber()
  totalUrls: number;

  @ApiProperty({ description: 'Tiempo de procesamiento en milisegundos' })
  @IsNumber()
  processingTime: number;

  @ApiProperty({ description: 'Si el test fue exitoso' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Error si el test falló', required: false })
  @IsOptional()
  @IsString()
  error?: string;
}

export class TestContentResponseDto {
  @ApiProperty({ description: 'Contenido extraído de la URL de prueba', type: ExtractedContentDto })
  @ValidateNested()
  @Type(() => ExtractedContentDto)
  extractedContent: ExtractedContentDto;

  @ApiProperty({ description: 'Tiempo de procesamiento en milisegundos' })
  @IsNumber()
  processingTime: number;

  @ApiProperty({ description: 'Si el test fue exitoso' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Error si el test falló', required: false })
  @IsOptional()
  @IsString()
  error?: string;

  @ApiProperty({ description: 'Detalles adicionales del test', required: false })
  @IsOptional()
  @IsString()
  details?: string;
}