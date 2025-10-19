/**
 * 🖼️ Types para Image Bank
 */

/**
 * Documento de imagen en el banco
 */
export interface ImageBankDocument {
  _id: string;
  processedUrls: {
    original: string;
    thumbnail: string;
    medium: string;
    large: string;
    s3BaseKey: string;
  };
  originalMetadata: {
    url: string;
    width: number;
    height: number;
    format: string;
    sizeBytes: number;
  };
  altText?: string;
  caption?: string;
  keywords: string[];
  outlet: string;
  categories: string[];
  tags: string[];
  quality?: 'high' | 'medium' | 'low';
  author?: string;
  license?: string;
  attribution?: string;
  photographerName?: string;
  captureType?: 'wikipedia' | 'unsplash' | 'pexels' | 'video_screenshot' | 'social_screenshot' | 'staff_photo' | 'news_agency' | 'other';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Respuesta paginada del backend
 */
export interface ImageBankPaginatedResponse {
  data: ImageBankDocument[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Filtros para búsqueda de imágenes
 */
export interface ImageBankFilters {
  page?: number;
  limit?: number;
  keywords?: string;
  outlet?: string;
  categories?: string;
  quality?: 'high' | 'medium' | 'low';
  searchText?: string;
  sortBy?: 'createdAt' | 'quality' | 'outlet';
  sortOrder?: 'asc' | 'desc';
  author?: string;
  captureType?: 'wikipedia' | 'unsplash' | 'pexels' | 'video_screenshot' | 'social_screenshot' | 'staff_photo' | 'news_agency' | 'other';
}
