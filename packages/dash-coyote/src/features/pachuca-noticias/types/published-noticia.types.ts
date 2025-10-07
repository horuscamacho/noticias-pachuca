/**
 * 📰 Tipos para el módulo Pachuca Noticias
 * Sincronizados con el backend (api-nueva/src/pachuca-noticias)
 */

// ========================================
// 🖼️ IMAGEN PROCESADA
// ========================================

export interface FeaturedImage {
  original: string;      // URL CDN completa
  thumbnail: string;     // 400x250px
  medium: string;        // 800x500px
  large: string;         // 1200x630px (OG)
  alt: string;
  width: number;
  height: number;
  s3Key: string;
}

// ========================================
// 🔍 SEO DATA
// ========================================

export interface SeoData {
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  canonicalUrl: string;

  // Open Graph
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: 'article';
  ogUrl: string;
  ogLocale: 'es_MX';

  // Twitter Cards
  twitterCard: 'summary_large_image';
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;

  // Structured Data
  structuredData: Record<string, unknown>;
}

// ========================================
// 🌐 SOCIAL MEDIA COPIES
// ========================================

export interface SocialMediaCopies {
  facebook?: {
    hook: string;
    copy: string;
    emojis: string[];
    hookType: string;
  };
  twitter?: {
    tweet: string;
    hook: string;
    emojis: string[];
    threadIdeas: string[];
  };
  instagram?: string;
  linkedin?: string;
}

export interface SocialMediaPublishing {
  facebook?: {
    published: boolean;
    postId?: string;
    url?: string;
    publishedAt?: string;
  };
  twitter?: {
    published: boolean;
    tweetId?: string;
    url?: string;
    publishedAt?: string;
  };
}

// ========================================
// 📊 ESTADÍSTICAS
// ========================================

export interface NoticiaStats {
  views?: number;
  readTime?: number;
  shares?: number;
  avgScrollDepth?: number;
  bounceRate?: number;
}

// ========================================
// 🛠️ METADATA DE PUBLICACIÓN
// ========================================

export interface PublishingMetadata {
  publishedBy?: string; // ID del usuario
  publishedFrom: 'dashboard' | 'api' | 'scheduled';
  imageSource: 'original' | 'uploaded' | 'generated';
  processingTime?: number; // ms
  version: number;
}

// ========================================
// 📰 NOTICIA PUBLICADA (COMPLETA)
// ========================================

export interface PublishedNoticia {
  _id: string;

  // Relaciones
  contentId: string;              // Ref: AIContentGeneration
  originalNoticiaId?: string;     // Ref: ExtractedNoticia

  // Contenido
  slug: string;
  title: string;
  content: string;                // HTML
  summary: string;
  extendedSummary?: string;

  // Imágenes
  featuredImage: FeaturedImage;
  additionalImages?: Array<{
    url: string;
    alt: string;
    width: number;
    height: number;
    s3Key: string;
  }>;

  // Taxonomía
  category: string;
  tags: string[];
  keywords: string[];
  author?: string;

  // SEO
  seo: SeoData;

  // Fechas
  publishedAt: string;
  originalPublishedAt?: string;
  lastModifiedAt: string;
  scheduledPublishAt?: string;

  // Estado
  status: 'draft' | 'scheduled' | 'published' | 'unpublished' | 'archived';
  isFeatured: boolean;
  isBreaking: boolean;
  priority: number;

  // Estadísticas
  stats: NoticiaStats;

  // Redes Sociales (NO SE USA EN FASE 1)
  socialMediaCopies?: SocialMediaCopies;
  socialMediaPublishing?: SocialMediaPublishing;

  // Metadata
  publishingMetadata: PublishingMetadata;
  errors: string[];
  warnings: string[];

  createdAt: string;
  updatedAt: string;
}

// ========================================
// 📝 DTOs (DATA TRANSFER OBJECTS)
// ========================================

/**
 * DTO para publicar una noticia
 */
export interface PublishNoticiaDto {
  contentId: string;
  useOriginalImage: boolean;
  customImageUrl?: string;
  scheduledPublishAt?: string;
  isFeatured?: boolean;
  isBreaking?: boolean;
}

/**
 * DTO para actualizar una noticia
 */
export interface UpdateNoticiaDto {
  title?: string;
  content?: string;
  summary?: string;
  extendedSummary?: string;
  category?: string;
  tags?: string[];
  keywords?: string[];
  isFeatured?: boolean;
  isBreaking?: boolean;
  priority?: number;
  status?: 'draft' | 'scheduled' | 'published' | 'unpublished' | 'archived';
}

/**
 * DTO para queries con filtros
 */
export interface QueryNoticiasDto {
  page?: number;
  limit?: number;
  status?: 'draft' | 'scheduled' | 'published' | 'unpublished' | 'archived';
  category?: string;
  isFeatured?: boolean;
  isBreaking?: boolean;
  search?: string;
  sortBy?: 'publishedAt' | 'createdAt' | 'priority' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// ========================================
// 📦 RESPUESTAS DE LA API
// ========================================

/**
 * Respuesta paginada de noticias
 */
export interface PublishedNoticiasResponse {
  data: PublishedNoticia[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Respuesta de publicación exitosa
 */
export interface PublishNoticiaResponse extends PublishedNoticia {}

/**
 * Respuesta de error
 */
export interface ErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
}

// ========================================
// 🎨 UI STATE
// ========================================

/**
 * Estado del modal de publicación
 */
export interface PublishModalState {
  isOpen: boolean;
  contentId: string | null;
  useOriginalImage: boolean;
  customImageUrl: string;
  isFeatured: boolean;
  isBreaking: boolean;
}

/**
 * Filtros de la tabla
 */
export interface NoticiasTableFilters {
  status?: 'draft' | 'scheduled' | 'published' | 'unpublished' | 'archived';
  category?: string;
  search?: string;
  page: number;
  limit: number;
}
