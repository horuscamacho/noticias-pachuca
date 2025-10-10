/**
 * 🌐 Outlet Types
 * Tipos para manejo de outlets/websites de noticias
 */

export interface OutletStatistics {
  totalUrlsExtracted: number;
  successfulExtractions: number;
  failedExtractions: number;
  totalContentGenerated: number;
  totalPublished: number;
  lastExtractionDuration: number | null;
}

export interface ListingSelectors {
  titleSelector: string;
  linkSelector: string;
  dateSelector: string;
  thumbnailSelector: string;
  summarySelector: string;
}

export interface ContentSelectors {
  titleSelector: string;
  contentSelector: string;
  authorSelector: string;
  dateSelector: string;
  imageSelector: string;
  categorySelector: string;
  tagsSelector: string;
}

export interface ExtractionSettings {
  maxRetries: number;
  timeout: number;
  waitBetweenRequests: number;
}

export interface OutletConfig {
  id: string;
  name: string;
  baseUrl: string;
  listingUrl: string;
  testUrl?: string;
  isActive: boolean;
  extractionFrequency: number; // en minutos
  contentGenerationFrequency: number; // en minutos
  publishingFrequency: number; // en minutos
  listingSelectors: ListingSelectors;
  contentSelectors: ContentSelectors;
  extractionSettings: ExtractionSettings;
  lastExtractionRun: Date | null;
  lastGenerationRun: Date | null;
  lastPublishingRun: Date | null;
  statistics: OutletStatistics;
  createdAt: Date;
  updatedAt: Date;
}

// DTOs para actualizaciones
export interface UpdateFrequenciesDto {
  extractionFrequency?: number;
  contentGenerationFrequency?: number;
  publishingFrequency?: number;
}

export interface SystemControlDto {
  action: 'pause' | 'resume';
  websiteId: string;
}

// Tipos para extracción en progreso
export interface ExtractionProgress {
  outletId: string;
  outletName?: string;
  step: 'urls_found' | 'extracting_content' | 'content_extracted' | 'content_error';
  urlsFound?: number;
  currentUrl?: string;
  currentTitle?: string;
  currentIndex?: number;
  totalUrls: number;
  contentExtracted: number;
  percentage: number;
  error?: string;
  timestamp: string;
}

export interface ExtractionStartedEvent {
  outletId: string;
  outletName: string;
  timestamp: string;
}

export interface ExtractionCompletedEvent {
  outletId: string;
  outletName: string;
  totalUrls: number;
  totalContent: number;
  duration: number;
  percentage: number;
  timestamp: string;
}

export interface ExtractionFailedEvent {
  outletId: string;
  error: string;
  urlsFound: number;
  contentExtracted: number;
  timestamp: string;
}

// Tipos para logs
export type LogType = 'success' | 'loading' | 'error' | 'info';

export interface LogItem {
  id: string;
  type: LogType;
  message: string;
  timestamp: Date;
}

// Response types de la API
export interface OutletApiResponse {
  websites: OutletConfig[];
  total: number;
  page: number;
  limit: number;
}

export interface ExtractAllResponse {
  totalUrls: number;
  totalContentExtracted: number;
  duration: number;
  message: string;
}
