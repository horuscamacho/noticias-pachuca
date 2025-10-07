/**
 * 📰 Tipos para el sistema de noticias públicas
 * Sincronizado con backend PublishedNoticia schema
 */

export interface FeaturedImage {
  original: string;
  thumbnail: string;
  medium: string;
  large: string;
  alt: string;
  width: number;
  height: number;
}

export interface SeoMetadata {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  focusKeyword: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  structuredData: Record<string, unknown>;
}

export interface SocialMediaCopy {
  platform: string;
  copy: string;
  hashtags?: string[];
}

export interface PublishingMetadata {
  publishedBy: string | null;
  publishedFrom: string;
  imageSource: string;
  processingTime: number;
  version: number;
}

export interface NoticiaStats {
  views: number;
  readTime: number;
  shares: number;
}

export interface PublishedNoticia {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  keywords: string[];
  author: string;

  featuredImage: FeaturedImage;

  seo: SeoMetadata;

  publishedAt: Date;
  originalPublishedAt?: Date;
  lastModifiedAt: Date;

  status: 'published' | 'unpublished' | 'draft';
  isFeatured: boolean;
  isBreaking: boolean;
  priority: number;

  socialMediaCopies?: SocialMediaCopy[];
  publishingMetadata: PublishingMetadata;
  stats: NoticiaStats;

  createdAt: Date;
  updatedAt: Date;
}

export interface GetNoticiasParams {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface NoticiasResponse {
  success: boolean;
  data: PublishedNoticia[];
  pagination: PaginationMetadata;
}

export interface NoticiaResponse {
  success: boolean;
  data: PublishedNoticia | null;
  message?: string;
}
