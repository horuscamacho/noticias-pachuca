import { Types } from 'mongoose';

/**
 * 🎯 Interfaces para el módulo de noticias
 * Definen tipos seguros para selectors, contenido extraído y resultados
 */

// Configuración de selectores CSS para extracción
export interface NoticiasExtractionSelectors {
  title: string; // Selector principal para título
  content: string; // Selector principal para contenido
  images?: string[]; // Selectores opcionales para imágenes
  publishedAt?: string; // Selector para fecha de publicación
  author?: string; // Selector para autor
  categories?: string[]; // Selectores para categorías
  excerpt?: string; // Selector para resumen/extracto
  tags?: string[]; // Selectores para tags
}

// Configuración de extracción por dominio
export interface ExtractionSettings {
  useJavaScript?: boolean; // Si requiere renderizado JS
  waitTime?: number; // Tiempo de espera (ms)
  rateLimit?: number; // Requests por minuto
  timeout?: number; // Timeout de request (ms)
  retryAttempts?: number; // Número de reintentos
  respectRobots?: boolean; // Respetar robots.txt
}

// Contenido extraído de una noticia
export interface ExtractedContent {
  title: string;
  content: string;
  images: string[];
  publishedAt?: Date;
  author?: string;
  categories: string[];
  excerpt?: string;
  tags: string[];
  sourceUrl: string;
  domain: string;
}

// Resultado de una operación de scraping
export interface ScrapingResult {
  success: boolean;
  data?: ExtractedContent;
  metadata: {
    method: 'cheerio' | 'puppeteer';
    processingTime: number;
    httpStatus: number;
    contentLength: number;
    imagesFound: number;
    url: string;
    finalUrl?: string; // Después de redirects
  };
  error?: {
    message: string;
    code?: string;
    type: 'network' | 'parsing' | 'selector' | 'timeout' | 'rate_limit' | 'unknown';
    details?: Record<string, unknown>;
  };
  warnings?: string[];
  qualityMetrics?: {
    titleQuality: 'good' | 'fair' | 'poor';
    contentQuality: 'good' | 'fair' | 'poor';
    completeness: number; // 0-100%
    confidence: number; // 0-100%
  };
}

// Configuración de extracción completa
export interface NoticiasConfig {
  domain: string;
  name: string;
  isActive: boolean;
  selectors: NoticiasExtractionSelectors;
  extractionSettings: ExtractionSettings;
  customHeaders?: Record<string, string>;
}

// Request de test de extracción
export interface TestExtractionRequest {
  url: string;
  selectors: NoticiasExtractionSelectors;
  settings?: ExtractionSettings;
  customHeaders?: Record<string, string>;
}

// Respuesta de test de extracción
export interface TestExtractionResponse {
  success: boolean;
  extractedData?: {
    title?: string;
    content?: string;
    images?: string[];
    publishedAt?: string;
    author?: string;
    categories?: string[];
    excerpt?: string;
    tags?: string[];
  };
  metadata: {
    processingTime: number;
    method: 'cheerio' | 'puppeteer';
    contentLength: number;
    imagesCount: number;
  };
  error?: {
    message: string;
    details?: unknown;
  };
  warnings?: string[];
}

// URL externa detectada desde posts Facebook
export interface ExternalUrl {
  url: string;
  domain: string;
  facebookPostId: string;
  pageId?: string;
  postUrl?: string;
  detectedAt: Date;
  hasConfig: boolean;
  configId?: string;
  extractionStatus?: 'pending' | 'extracted' | 'failed' | 'skipped';
  lastAttemptAt?: Date;
}

// Job de extracción para la queue
export interface ExtractionJobData {
  sourceUrl: string;
  domain: string;
  configId: string;
  facebookPostId: string;
  pageId?: string;
  priority?: number;
  metadata?: {
    triggeredBy: 'manual' | 'automatic' | 'scheduled';
    batchId?: string;
    forceReExtraction?: boolean;
    originalJobId?: string;
  };
}

// Resultado de un job de extracción
export interface ExtractionJobResult {
  success: boolean;
  extractedNoticiaId?: string;
  processingTime: number;
  method: 'cheerio' | 'puppeteer' | 'cached';
  contentLength?: number;
  imagesFound?: number;
  error?: {
    message: string;
    code?: string;
    retryable: boolean;
  };
}

// Estadísticas de extracción
export interface ExtractionStats {
  total: number;
  successful: number;
  failed: number;
  pending: number;
  processing: number;
  byDomain: Array<{
    domain: string;
    total: number;
    successful: number;
    failed: number;
    lastExtraction?: Date;
  }>;
  performance: {
    averageProcessingTime: number;
    successRate: number;
    dailyExtractions: number;
  };
}

// Filtros para búsqueda de noticias extraídas
export interface NoticiasFilter {
  domain?: string;
  status?: 'pending' | 'extracted' | 'failed' | 'processing';
  dateFrom?: string;
  dateTo?: string;
  hasImages?: boolean;
  facebookPostId?: string;
  pageId?: string;
  searchText?: string; // Búsqueda en título y contenido
  category?: string; // Filtro por categoría
  author?: string; // Filtro por autor
  tags?: string[]; // Filtro por tags
  keywords?: string[]; // Filtro por keywords
}

// Opciones de paginación para noticias
export interface NoticiasPaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Response paginada de noticias
export interface PaginatedNoticias {
  data: ExtractedContent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters?: NoticiasFilter;
}

// Configuración de rate limiting por dominio
export interface DomainRateLimit {
  domain: string;
  requestsPerMinute: number;
  burstLimit: number;
  cooldownPeriod: number; // ms
  currentUsage: number;
  resetTime: Date;
}

// Métricas de calidad de extracción
export interface QualityMetrics {
  titleQuality: 'good' | 'fair' | 'poor';
  contentQuality: 'good' | 'fair' | 'poor';
  titleLength: number;
  contentLength: number;
  imageQuality: 'high' | 'medium' | 'low';
  completeness: number; // 0-100%
  confidence: number; // 0-100%
  structureScore: number; // 0-100%
}

// Validación de selectores CSS
export interface SelectorValidation {
  selector: string;
  isValid: boolean;
  found: boolean;
  count: number;
  sampleText?: string;
  error?: string;
}