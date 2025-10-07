/**
 * 🌐 Public Content Types
 * Tipos para las APIs públicas de categorías y búsqueda
 */

// ========================================
// CATEGORY TYPES
// ========================================

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  count: number;
  seoTitle: string;
  seoDescription: string;
}

export interface CategoryResponse {
  success: boolean;
  data: Category[];
}

// ========================================
// NOTICIA BY CATEGORY TYPES
// ========================================

export interface PublicNoticia {
  id: string;
  slug: string;
  title: string;
  summary: string;
  featuredImage?: string;
  categoryName: string;
  categorySlug: string;
  categoryColor: string;
  tags: string[];
  publishedAt: string;
  author?: string;
  readTime?: number;
}

export interface CategoryNoticasParams {
  slug: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export type CategoryNoticasResponse = PaginatedResponse<PublicNoticia>;

// ========================================
// SEARCH TYPES
// ========================================

export interface SearchResult {
  id: string;
  slug: string;
  title: string;
  summary: string;
  featuredImage?: string;
  categoryName: string;
  categorySlug: string;
  publishedAt: string;
  score?: number;
  highlight?: string;
}

export interface SearchParams {
  query: string;
  category?: string;
  sortBy?: 'relevance' | 'date';
  page?: number;
  limit?: number;
}

export type SearchResponse = PaginatedResponse<SearchResult>;

// ========================================
// TAG TYPES
// ========================================

export interface TagInfo {
  slug: string;
  name: string;
  count: number;
}

export interface TagNoticasParams {
  slug: string;
  page?: number;
  limit?: number;
}

export type TagNoticasResponse = PaginatedResponse<PublicNoticia> & {
  tagInfo?: TagInfo;
};

// ========================================
// AUTHOR TYPES
// ========================================

export interface AuthorInfo {
  slug: string;
  name: string;
  count: number;
  bio?: string;
  avatar?: string;
}

export interface AuthorNoticasParams {
  slug: string;
  page?: number;
  limit?: number;
}

export type AuthorNoticasResponse = PaginatedResponse<PublicNoticia> & {
  authorInfo?: AuthorInfo;
};
