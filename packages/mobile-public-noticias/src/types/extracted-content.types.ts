/**
 * 📰 Extracted Content Types
 * Tipos para contenido extraído de sitios web
 */

export interface ExtractedContent {
  id: string;
  title: string;
  content: string;
  url: string;
  websiteId: string;
  websiteName?: string;
  author?: string;
  category?: string;
  imageUrl?: string;
  publishedAt?: string;
  extractedAt: string;
  status: 'pending' | 'processing' | 'extracted' | 'failed';
  isProcessed?: boolean;
  processedAt?: string;
  generatedContentId?: string;
}

export interface ExtractedContentFilters {
  websiteId?: string;
  status?: 'pending' | 'processing' | 'extracted' | 'failed';
  limit?: number;
  page?: number;
}

export interface ExtractedContentListResponse {
  content: ExtractedContent[];
  total: number;
  page: number;
  totalPages: number;
}

// API Response types
export interface ExtractedContentApiResponse {
  id: string;
  url: string;
  title: string;
  content: string;
  author?: string;
  category?: string;
  imageUrl?: string;
  publishedDate?: string;
  extractionStatus: string;
  websiteConfigId: string;
  websiteName?: string;
  extractedAt: string;
  createdAt: string;
}
