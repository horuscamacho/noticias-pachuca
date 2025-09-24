/**
 * 📰 Types for Noticias (News) Feature
 * Web scraping and content extraction from external URLs
 */

// ============================================================================
// 🔧 Configuration Types
// ============================================================================

export interface NoticiasExtractionSelectors {
  title: string;
  content: string;
  images?: string[];
  publishedAt?: string;
  author?: string;
  categories?: string[];
  excerpt?: string;
  tags?: string[];
}

export interface ExtractionSettings {
  useJavaScript?: boolean;
  waitTime?: number;
  rateLimit?: number;
  timeout?: number;
  retryAttempts?: number;
  respectRobots?: boolean;
}

export interface NoticiasConfig {
  _id: string;
  domain: string;
  name: string;
  isActive: boolean;
  selectors: NoticiasExtractionSelectors;
  extractionSettings: ExtractionSettings;
  customHeaders?: Record<string, string>;
  notes?: string;
  statistics?: {
    totalExtractions: number;
    successfulExtractions: number;
    failedExtractions: number;
    averageExtractionTime?: number;
    lastExtractionAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 🔍 External URLs Types
// ============================================================================

export interface ExternalUrl {
  url: string;
  domain: string;
  facebookPostId: string;
  pageId?: string;
  postUrl?: string;
  detectedAt: string;
  hasConfig: boolean;
  configId?: string;
  extractionStatus?: 'pending' | 'extracted' | 'failed' | 'skipped';
  lastAttemptAt?: string;
}

export interface UrlDetectionStats {
  totalUrls: number;
  urlsWithConfig: number;
  urlsWithoutConfig: number;
  topDomains: Array<{
    domain: string;
    count: number;
    hasConfig: boolean;
  }>;
}

// ============================================================================
// 📰 Extracted Content Types
// ============================================================================

export interface ExtractedNoticia {
  _id: string;
  sourceUrl: string;
  domain: string;
  configId: string;
  facebookPostId: string;
  pageId?: string;
  title: string;
  content: string;
  excerpt?: string;
  images: string[];
  author?: string;
  publishedAt?: string;
  categories: string[];
  tags: string[];
  metadata?: Record<string, unknown>;
  status: 'pending' | 'processing' | 'extracted' | 'failed';
  extractionMetadata?: {
    method: 'cheerio' | 'puppeteer';
    processingTime: number;
    contentLength: number;
    imagesFound: number;
    userAgent?: string;
    httpStatusCode?: number;
    error?: string;
  };
  extractedAt: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 📋 Jobs & Processing Types
// ============================================================================

export interface NoticiasJob {
  _id: string;
  jobId: string;
  sourceUrl: string;
  domain: string;
  configId: string;
  facebookPostId: string;
  pageId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  jobOptions?: {
    priority: number;
    attempts: number;
    timeout: number;
  };
  metadata?: {
    triggeredBy: 'manual' | 'automatic' | 'scheduled';
    batchId?: string;
  };
  createdAt: string;
  updatedAt: string;
}

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
    lastExtraction?: string;
  }>;
  performance: {
    averageProcessingTime: number;
    successRate: number;
    dailyExtractions: number;
  };
}

// ============================================================================
// 🧪 Testing Types
// ============================================================================

export interface TestExtractionRequest {
  url: string;
  selectors: NoticiasExtractionSelectors;
  settings?: ExtractionSettings;
  customHeaders?: Record<string, string>;
}

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

// ============================================================================
// 📊 API Response Types
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Specific paginated responses
export type PaginatedConfigs = PaginatedResponse<NoticiasConfig>;
export type PaginatedExternalUrls = PaginatedResponse<ExternalUrl>;
export type PaginatedNoticias = PaginatedResponse<ExtractedNoticia>;
export type PaginatedJobs = PaginatedResponse<NoticiasJob>;

// ============================================================================
// 🔍 Filter Types
// ============================================================================

export interface NoticiasFilters {
  domain?: string;
  status?: 'pending' | 'extracted' | 'failed' | 'processing';
  dateFrom?: string;
  dateTo?: string;
  hasImages?: boolean;
  facebookPostId?: string;
  pageId?: string;
  searchText?: string;
}

export interface UrlDetectionFilters {
  dateFrom?: string;
  dateTo?: string;
  pageId?: string;
  hasConfig?: boolean;
}

export interface JobsFilters {
  status?: string;
  domain?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ============================================================================
// 📝 Form Types
// ============================================================================

export interface CreateConfigForm {
  domain: string;
  name: string;
  isActive: boolean;
  selectors: NoticiasExtractionSelectors;
  extractionSettings: ExtractionSettings;
  customHeaders?: Record<string, string>;
  notes?: string;
}

export interface UpdateConfigForm extends Partial<CreateConfigForm> {}

export interface ExtractionTriggerForm {
  url: string;
  facebookPostId: string;
  pageId?: string;
  priority?: number;
  forceReExtraction?: boolean;
}

export interface BatchExtractionForm {
  domain: string;
  limit?: number;
  priority?: number;
  forceReExtraction?: boolean;
}

// ============================================================================
// 🎯 API Endpoints Response Types
// ============================================================================

export interface ExtractionJobResult {
  jobId: string;
  message: string;
}

export interface BatchExtractionResult {
  batchId: string;
  totalJobs: number;
  message: string;
}

export interface JobRetryResult {
  newJobId: string;
  message: string;
}

// ============================================================================
// 🎨 UI State Types
// ============================================================================

export type NoticiasTab = 'overview' | 'urls' | 'configs' | 'noticias' | 'testing' | 'jobs';

export interface NoticiasPageState {
  activeTab: NoticiasTab;
  selectedConfig?: NoticiasConfig;
  selectedNoticia?: ExtractedNoticia;
  selectedJob?: NoticiasJob;
  isConfigSheetOpen: boolean;
  isTestModalOpen: boolean;
  isExtractionModalOpen: boolean;
}

// ============================================================================
// 📱 Component Props Types
// ============================================================================

export interface ConfigFormProps {
  config?: NoticiasConfig;
  onSubmit: (data: CreateConfigForm | UpdateConfigForm) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface TestExtractionProps {
  config?: NoticiasConfig;
  onTest: (data: TestExtractionRequest) => void;
  onClose: () => void;
  isLoading?: boolean;
  result?: TestExtractionResponse;
}

export interface NoticiaDetailsProps {
  noticia: ExtractedNoticia;
  onClose: () => void;
}

export interface JobDetailsProps {
  job: NoticiasJob;
  onClose: () => void;
  onRetry?: (jobId: string) => void;
}