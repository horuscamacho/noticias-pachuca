import { IsString, IsBoolean, IsNumber, IsOptional, IsArray, IsObject, IsDate } from 'class-validator';

/**
 * 🤖 DTOs para respuestas de API - Generator Pro
 */

export class WebsiteConfigResponseDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  baseUrl: string;

  @IsString()
  listingUrl: string;

  @IsOptional()
  @IsString()
  testUrl?: string;

  @IsBoolean()
  isActive: boolean;

  @IsNumber()
  extractionFrequency: number;

  @IsNumber()
  contentGenerationFrequency: number;

  @IsNumber()
  publishingFrequency: number;

  @IsOptional()
  @IsObject()
  listingSelectors?: {
    articleLinks: string;
    titleSelector?: string;
    imageSelector?: string;
    dateSelector?: string;
    categorySelector?: string;
  };

  @IsOptional()
  @IsObject()
  contentSelectors?: {
    titleSelector: string;
    contentSelector: string;
    imageSelector?: string;
    dateSelector?: string;
    authorSelector?: string;
    categorySelector?: string;
    tagsSelector?: string;
  };

  @IsOptional()
  @IsObject()
  extractionSettings?: {
    maxUrlsPerExtraction?: number;
    duplicateFilter?: boolean;
    contentFilters?: {
      minContentLength?: number;
      excludeKeywords?: string[];
      requiredKeywords?: string[];
    };
  };

  @IsOptional()
  @IsDate()
  lastExtractionRun?: Date;

  @IsOptional()
  @IsDate()
  lastGenerationRun?: Date;

  @IsOptional()
  @IsDate()
  lastPublishingRun?: Date;

  @IsOptional()
  @IsObject()
  statistics?: {
    totalUrlsExtracted?: number;
    totalContentGenerated?: number;
    totalPublished?: number;
    successfulExtractions?: number;
    failedExtractions?: number;
    lastExtractionAt?: Date;
  };

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;
}

export class FacebookConfigResponseDto {
  @IsString()
  id: string;

  @IsString()
  websiteConfigId: string;

  @IsString()
  name: string;

  @IsString()
  facebookPageId: string;

  @IsString()
  facebookPageName: string;

  @IsString()
  templateId: string;

  @IsBoolean()
  isActive: boolean;

  @IsNumber()
  publishingFrequency: number;

  @IsNumber()
  maxPostsPerDay: number;

  @IsNumber()
  postsToday: number;

  @IsOptional()
  @IsDate()
  lastPublishedAt?: Date;

  @IsOptional()
  @IsObject()
  connectionStatus?: {
    isConnected?: boolean;
    lastChecked?: Date;
    pageInfo?: {
      name?: string;
      followers?: number;
      verified?: boolean;
    };
  };

  @IsOptional()
  @IsObject()
  statistics?: {
    totalPostsPublished?: number;
    successfulPosts?: number;
    failedPosts?: number;
    averageEngagement?: number;
  };

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;
}

export class JobStatsResponseDto {
  @IsObject()
  extraction: {
    active: number;
    waiting: number;
    completed: number;
    failed: number;
    delayed: number;
  };

  @IsObject()
  generation: {
    active: number;
    waiting: number;
    completed: number;
    failed: number;
    delayed: number;
  };

  @IsObject()
  publishing: {
    active: number;
    waiting: number;
    completed: number;
    failed: number;
    delayed: number;
  };

  @IsObject()
  total: {
    active: number;
    waiting: number;
    completed: number;
    failed: number;
  };
}

export class SystemStatusResponseDto {
  @IsBoolean()
  isRunning: boolean;

  @IsNumber()
  activeWebsites: number;

  @IsObject()
  totalJobs: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };

  @IsObject()
  performance: {
    avgExtractionTime: number;
    avgGenerationTime: number;
    avgPublishingTime: number;
    successRate: number;
  };

  @IsDate()
  lastActivity: Date;

  @IsOptional()
  @IsArray()
  queueHealth?: Array<{
    name: string;
    isHealthy: boolean;
    activeJobs: number;
    waitingJobs: number;
    errorRate: number;
  }>;

  @IsOptional()
  @IsArray()
  recentActivity?: Array<{
    type: string;
    websiteName: string;
    status: string;
    timestamp: Date;
  }>;
}

// 🔗 DTOs para 6-Tab Workflow

/**
 * DTO para URLs extraídas - Tab URLs
 */
export class ExtractedNoticiaResponseDto {
  @IsString()
  id: string;

  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  extractionStatus: string; // 'url_extracted', 'content_extracted', 'generation_ready', 'content_generated'

  @IsString()
  websiteConfigId: string;

  @IsOptional()
  @IsDate()
  extractedAt?: Date;

  @IsDate()
  createdAt: Date;
}

/**
 * DTO para contenido extraído - Tab Contenido
 */
export class ExtractedContentResponseDto {
  @IsString()
  id: string;

  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsDate()
  publishedDate?: Date;

  @IsString()
  extractionStatus: string;

  @IsString()
  websiteConfigId: string;

  @IsOptional()
  @IsString()
  websiteName?: string;

  @IsDate()
  extractedAt: Date;

  @IsDate()
  createdAt: Date;
}

/**
 * DTO para contenido generado - Tab Generados
 */
export class GeneratedContentResponseDto {
  @IsString()
  id: string;

  @IsString()
  @IsOptional()
  extractedNoticiaId: string | null;

  @IsString()
  templateId: string;

  @IsString()
  agentId: string;

  @IsOptional()
  @IsString()
  agentName?: string;

  @IsString()
  generatedContent: string;

  @IsOptional()
  @IsString()
  generatedTitle?: string;

  @IsOptional()
  @IsString()
  generatedSummary?: string;

  @IsOptional()
  @IsArray()
  generatedKeywords?: string[];

  @IsOptional()
  @IsArray()
  generatedTags?: string[];

  @IsOptional()
  @IsString()
  generatedCategory?: string;

  @IsString()
  status: string; // 'generated', 'approved', 'published', 'failed'

  @IsOptional()
  @IsObject()
  socialMediaCopies?: {
    facebook?: {
      hook: string;
      copy: string;
      emojis: string[];
      hookType: string;
      estimatedEngagement: string;
    };
    twitter?: {
      tweet: string;
      hook: string;
      emojis: string[];
      hookType: string;
      threadIdeas: string[];
    };
    instagram?: string;
    linkedin?: string;
  };

  @IsOptional()
  @IsObject()
  metadata?: {
    wordCount?: number;
    sentiment?: string;
    keywords?: string[];
    tone?: string;
  };

  @IsOptional()
  @IsObject()
  generationMetadata?: {
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
    processingTime: number;
    temperature: number;
    maxTokens: number;
    finishReason: string;
    contentQuality?: number;
    aiProvider?: string;
    tokensUsed?: number;
    costEstimate?: number;
  };

  @IsDate()
  generatedAt: Date;

  @IsDate()
  createdAt: Date;
}

/**
 * DTO para posts de Facebook - Tab Posts
 */
export class FacebookPostResponseDto {
  @IsString()
  id: string;

  @IsString()
  generatedContentId: string;

  @IsString()
  facebookConfigId: string;

  @IsOptional()
  @IsString()
  facebookPostId?: string;

  @IsString()
  postContent: string;

  @IsOptional()
  @IsArray()
  mediaUrls?: string[];

  @IsOptional()
  @IsArray()
  hashtags?: string[];

  @IsOptional()
  @IsArray()
  emojis?: string[];

  @IsString()
  status: string; // 'scheduled', 'published', 'failed', 'cancelled'

  @IsOptional()
  @IsDate()
  scheduledAt?: Date;

  @IsOptional()
  @IsDate()
  publishedAt?: Date;

  @IsOptional()
  @IsObject()
  engagement?: {
    likes?: number;
    comments?: number;
    shares?: number;
    lastUpdated?: Date;
  };

  @IsOptional()
  @IsString()
  error?: string;

  @IsDate()
  createdAt: Date;
}