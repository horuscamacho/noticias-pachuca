import { IsString, IsOptional, IsNumber, Min, IsArray, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 🏷️ DTO para respuesta de categoría
 */
export class CategoryResponseDto {
  @IsString()
  id: string;

  @IsString()
  slug: string;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  color: string;

  @IsString()
  icon: string;

  @IsNumber()
  count: number;

  @IsString()
  seoTitle: string;

  @IsString()
  seoDescription: string;
}

/**
 * 📰 DTO para respuesta de noticia en listados públicos
 */
export class PublicNoticiaResponseDto {
  @IsString()
  id: string;

  @IsString()
  slug: string;

  @IsString()
  title: string;

  @IsString()
  summary: string;

  @IsOptional()
  @IsString()
  featuredImage?: string; // URL de la imagen

  @IsString()
  categoryName: string; // Nombre de categoría (poblado)

  @IsString()
  categorySlug: string; // Slug de categoría

  @IsString()
  categoryColor: string; // Color de categoría

  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsString()
  publishedAt: string; // ISO string

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsNumber()
  readTime?: number; // Tiempo de lectura en minutos

  @IsOptional()
  isUrgent?: boolean; // CRITICAL: Flag para contenido urgente (breaking news de última hora)
}

/**
 * 🔍 DTO para query de búsqueda
 */
export class SearchQueryDto {
  @IsOptional()
  @IsString()
  category?: string; // Filtro por slug de categoría

  @IsOptional()
  @IsString()
  sortBy?: 'relevance' | 'date'; // Ordenar por relevancia o fecha

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number;
}

/**
 * 🔍 DTO para respuesta de búsqueda
 */
export class SearchResultDto {
  @IsString()
  id: string;

  @IsString()
  slug: string;

  @IsString()
  title: string;

  @IsString()
  summary: string;

  @IsOptional()
  @IsString()
  featuredImage?: string;

  @IsString()
  categoryName: string;

  @IsString()
  categorySlug: string;

  @IsString()
  publishedAt: string;

  @IsOptional()
  @IsNumber()
  score?: number; // Score de relevancia del texto

  @IsOptional()
  @IsString()
  highlight?: string; // Fragmento de texto con el término resaltado

  @IsOptional()
  isUrgent?: boolean; // CRITICAL: Flag para contenido urgente (breaking news de última hora)
}

/**
 * 📄 DTO para respuesta paginada
 */
export class PaginatedResponseDto<T> {
  data: T[];

  @IsNumber()
  total: number;

  @IsNumber()
  page: number;

  @IsNumber()
  limit: number;

  @IsNumber()
  totalPages: number;

  @IsOptional()
  hasNextPage?: boolean;

  @IsOptional()
  hasPrevPage?: boolean;
}

/**
 * 🔍 Query params para listados por categoría
 */
export class CategoryQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number;
}
