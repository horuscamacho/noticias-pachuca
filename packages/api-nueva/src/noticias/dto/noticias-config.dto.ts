import { IsString, IsBoolean, IsOptional, IsObject, IsArray, IsNumber, Min, Max, IsUrl, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 🎯 DTOs para configuración de extracción de noticias
 */

export class ExtractorSelectorsDto {
  @ApiProperty({ description: 'CSS selector para el título', example: 'h1.post-title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'CSS selector para el contenido principal', example: '.post-content' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: 'CSS selectors para imágenes', example: ['img.featured', '.gallery img'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'CSS selector para fecha de publicación', example: '.post-date' })
  @IsOptional()
  @IsString()
  publishedAt?: string;

  @ApiPropertyOptional({ description: 'CSS selector para autor', example: '.author-name' })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ description: 'CSS selectors para categorías', example: ['.category-tag'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({ description: 'CSS selector para resumen/extracto', example: '.post-excerpt' })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiPropertyOptional({ description: 'CSS selectors para tags', example: ['.tag-link'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class ExtractionSettingsDto {
  @ApiPropertyOptional({ description: 'Si requiere renderizado JavaScript', default: false })
  @IsOptional()
  @IsBoolean()
  useJavaScript?: boolean;

  @ApiPropertyOptional({ description: 'Tiempo de espera antes de scraping (ms)', default: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(30000)
  waitTime?: number;

  @ApiPropertyOptional({ description: 'Límite de requests por minuto', default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(300)
  rateLimit?: number;

  @ApiPropertyOptional({ description: 'Timeout para requests (ms)', default: 30000 })
  @IsOptional()
  @IsNumber()
  @Min(5000)
  @Max(120000)
  timeout?: number;

  @ApiPropertyOptional({ description: 'Número de reintentos en caso de error', default: 3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  retryAttempts?: number;

  @ApiPropertyOptional({ description: 'Respetar robots.txt', default: true })
  @IsOptional()
  @IsBoolean()
  respectRobots?: boolean;
}

export class CreateNoticiasConfigDto {
  @ApiProperty({ description: 'Dominio del sitio web', example: 'ejemplo.com' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, ''))
  domain: string;

  @ApiProperty({ description: 'Nombre descriptivo del medio', example: 'Ejemplo Noticias' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Si la configuración está activa', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Selectores CSS para extracción', type: ExtractorSelectorsDto })
  @ValidateNested()
  @Type(() => ExtractorSelectorsDto)
  selectors: ExtractorSelectorsDto;

  @ApiPropertyOptional({ description: 'Configuración de extracción', type: ExtractionSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExtractionSettingsDto)
  extractionSettings?: ExtractionSettingsDto;

  @ApiPropertyOptional({ description: 'Headers personalizados para requests' })
  @IsOptional()
  @IsObject()
  customHeaders?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Notas sobre la configuración' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateNoticiasConfigDto {
  @ApiPropertyOptional({ description: 'Nombre descriptivo del medio' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ description: 'Si la configuración está activa' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Selectores CSS para extracción', type: ExtractorSelectorsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExtractorSelectorsDto)
  selectors?: ExtractorSelectorsDto;

  @ApiPropertyOptional({ description: 'Configuración de extracción', type: ExtractionSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExtractionSettingsDto)
  extractionSettings?: ExtractionSettingsDto;

  @ApiPropertyOptional({ description: 'Headers personalizados para requests' })
  @IsOptional()
  @IsObject()
  customHeaders?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Notas sobre la configuración' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class TestExtractionDto {
  @ApiProperty({ description: 'URL a testear', example: 'https://ejemplo.com/noticia-ejemplo' })
  @IsUrl()
  url: string;

  @ApiProperty({ description: 'Selectores CSS para extracción', type: ExtractorSelectorsDto })
  @ValidateNested()
  @Type(() => ExtractorSelectorsDto)
  selectors: ExtractorSelectorsDto;

  @ApiPropertyOptional({ description: 'Configuración de extracción', type: ExtractionSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExtractionSettingsDto)
  settings?: ExtractionSettingsDto;

  @ApiPropertyOptional({ description: 'Headers personalizados para requests' })
  @IsOptional()
  @IsObject()
  customHeaders?: Record<string, string>;
}

/**
 * DTO para testing de selectores sin configuración en BD
 */
export class TestSelectorsDto {
  @ApiProperty({ description: 'URL a testear', example: 'https://example.com/noticia' })
  @IsString()
  @IsUrl()
  url: string;

  @ApiProperty({ description: 'Selectores CSS a probar', type: ExtractorSelectorsDto })
  @ValidateNested()
  @Type(() => ExtractorSelectorsDto)
  selectors: ExtractorSelectorsDto;

  @ApiPropertyOptional({ description: 'Configuración de extracción', type: ExtractionSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExtractionSettingsDto)
  settings?: ExtractionSettingsDto;

  @ApiPropertyOptional({ description: 'Headers HTTP personalizados' })
  @IsOptional()
  @IsObject()
  customHeaders?: Record<string, string>;
}