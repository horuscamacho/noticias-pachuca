export interface CreateFacebookConfigRequest {
  websiteConfigId: string;
  name: string;
  facebookPageId: string;
  facebookPageName: string;
  templateId: string;
  publishingFrequency: number;
  maxPostsPerDay: number;
  postingSchedule: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    weekdays: boolean[];
    timezone: string;
  };
  contentOptimization: {
    generateEmojis: boolean;
    generateHashtags: boolean;
    maxHashtags: number;
    engagementOptimization: boolean;
    duplicateDetection: boolean;
    cooldownPeriod: number;
  };
}

export interface WebsiteConfig {
  id: string;
  name: string;
  baseUrl: string;
  listingUrl: string;
  testUrl?: string;
  isActive: boolean;
  extractionFrequency: number;
  generationFrequency: number;
  listingSelectors: {
    articleLinks: string;
    titleSelector?: string;
    imageSelector?: string;
  };
  contentSelectors: {
    titleSelector: string;
    contentSelector: string;
    imageSelector?: string;
    dateSelector?: string;
    authorSelector?: string;
    categorySelector?: string;
  };
  extractionSettings: {
    maxUrlsPerExtraction: number;
    duplicateFilter: boolean;
    contentFilters: {
      minContentLength: number;
      excludeKeywords: string[];
      requiredKeywords: string[];
    };
  };
  statistics: {
    totalUrlsExtracted: number;
    totalContentExtracted: number;
    successfulExtractions: number;
    failedExtractions: number;
    averageProcessingTime: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface FacebookConfig {
  id: string;
  websiteConfigId: string;
  name: string;
  facebookPageId: string;
  facebookPageName: string;
  templateId: string;
  isActive: boolean;
  publishingFrequency: number;
  maxPostsPerDay: number;
  postingSchedule: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    weekdays: boolean[];
    timezone: string;
  };
  contentOptimization: {
    generateEmojis: boolean;
    generateHashtags: boolean;
    maxHashtags: number;
    engagementOptimization: boolean;
    duplicateDetection: boolean;
    cooldownPeriod: number;
  };
  statistics: {
    totalPostsPublished: number;
    successfulPosts: number;
    failedPosts: number;
    averageEngagementRate: number;
    totalReach: number;
    bestPerformingTime: string;
  };
  lastPublishedAt?: string;
  postsToday: number;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedPost {
  id: string;
  originalNoticiaId: string;
  generatedContentId: string;
  websiteConfigId: string;
  facebookConfigId: string;
  facebookPostId?: string;
  facebookPostUrl?: string;
  postContent: string;
  originalTitle: string;
  optimizedTitle: string;
  mediaUrls: string[];
  processedMediaUrls: string[];
  status: 'pending' | 'scheduled' | 'publishing' | 'published' | 'failed';
  scheduledAt: string;
  publishedAt?: string;
  failureReason?: string;
  category?: string;
  keywords: string[];
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
    reach: number;
    impressions: number;
    engagementRate: number;
    lastUpdated: string;
  };
  originalSourceUrl: string;
  contentQualityScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratorProJob {
  id: string;
  type: 'extract_urls' | 'extract_content' | 'generate_content' | 'publish_facebook' | 'sync_engagement';
  websiteConfigId: string;
  facebookConfigId?: string;
  relatedEntityId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: number;
  progress: number;
  data: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  processingTime?: number;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  updatedAt: string;
}

export interface SystemStatus {
  overall: 'healthy' | 'warning' | 'error';
  components: {
    extraction: 'active' | 'idle' | 'error';
    generation: 'active' | 'idle' | 'error';
    publishing: 'active' | 'idle' | 'error';
    database: 'connected' | 'disconnected';
    queues: 'running' | 'paused' | 'error';
    externalApis: {
      openai: 'connected' | 'limited' | 'error';
      getlate: 'connected' | 'limited' | 'error';
    };
  };
  metrics: {
    activeWebsites: number;
    activeFacebookConfigs: number;
    pendingJobs: number;
    processingJobs: number;
    todayPosts: number;
    todayExtractions: number;
    queueHealth: {
      extraction: number;
      generation: number;
      publishing: number;
    };
  };
  lastUpdate: string;
}

export interface DashboardStats {
  websites: {
    total: number;
    active: number;
    extractionsToday: number;
    avgProcessingTime: number;
  };
  content: {
    extractedToday: number;
    generatedToday: number;
    readyToPublish: number;
    totalLibrary: number;
  };
  facebook: {
    publishedToday: number;
    scheduledPosts: number;
    avgEngagementRate: number;
    totalReach: number;
  };
  jobs: {
    processing: number;
    completed: number;
    failed: number;
    retries: number;
  };
}

export interface CreateWebsiteConfigRequest {
  name: string;
  baseUrl: string;
  listingUrl: string;
  testUrl?: string;
  extractionFrequency: number;
  generationFrequency: number;
  listingSelectors: {
    articleLinks: string;
    titleSelector?: string;
    imageSelector?: string;
  };
  contentSelectors: {
    titleSelector: string;
    contentSelector: string;
    imageSelector?: string;
    dateSelector?: string;
    authorSelector?: string;
    categorySelector?: string;
  };
  extractionSettings: {
    maxUrlsPerExtraction: number;
    duplicateFilter: boolean;
    contentFilters: {
      minContentLength: number;
      excludeKeywords: string[];
      requiredKeywords: string[];
    };
  };
}

export interface TestSelectorsRequest {
  baseUrl: string;
  listingUrl: string;
  contentSelectors: {
    titleSelector: string;
    contentSelector: string;
    imageSelector?: string;
    dateSelector?: string;
    authorSelector?: string;
    categorySelector?: string;
  };
}

export interface TestSelectorsResponse {
  testResult: {
    listingTest: {
      urlsFound: number;
      sampleUrls: string[];
    };
    contentTest: {
      success: boolean;
      extractedData: {
        title?: string;
        content?: string;
        image?: string;
        author?: string;
        publishedAt?: string;
        category?: string;
      };
      issues: string[];
    };
    performance: {
      listingTime: number;
      contentTime: number;
      totalTime: number;
    };
  };
  message: string;
}

export interface TestListingSelectorsRequest {
  baseUrl: string;
  listingUrl: string;
  listingSelectors: {
    articleLinks: string;
    titleSelector?: string;
    imageSelector?: string;
  };
  limit?: number;
}

export interface TestIndividualContentRequest {
  testUrl: string;
  contentSelectors: {
    titleSelector?: string;
    contentSelector?: string;
    imageSelector?: string;
    dateSelector?: string;
    authorSelector?: string;
    categorySelector?: string;
    tagsSelector?: string;
  };
}

export interface ExtractedUrl {
  url: string;
  title?: string;
  image?: string;
  publishedAt?: string;
}

export interface ExtractedContent {
  url: string;
  title?: string;
  content?: string;
  images?: string[];
  publishedAt?: string;
  author?: string;
  category?: string;
  tags?: string[];
}

export interface TestListingResponse {
  extractedUrls: ExtractedUrl[];
  totalUrls: number;
  processingTime: number;
  success: boolean;
  error?: string;
}

export interface TestContentResponse {
  extractedContent: ExtractedContent;
  processingTime: number;
  success: boolean;
  error?: string;
  details?: string;
}

export interface GeneratedContentResponse {
  id: string;
  extractedNoticiaId: string;
  templateId: string;
  agentId: string;
  generatedContent: string;
  generatedTitle?: string;
  generatedSummary?: string;
  status: string;
  metadata?: {
    wordCount?: number;
    keywords?: string[];
  };
  generatedAt: string;
  createdAt: string;
}
