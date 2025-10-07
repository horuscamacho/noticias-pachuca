import { z } from 'zod';

// 📝 WRITING STYLE SCHEMA
export const writingStyleSchema = z.object({
  tone: z.enum(['formal', 'informal', 'humor', 'academic', 'conversational']),
  vocabulary: z.enum(['simple', 'intermediate', 'advanced', 'technical']),
  length: z.enum(['short', 'medium', 'long', 'variable']),
  structure: z.enum(['linear', 'narrative', 'analytical', 'opinion']),
  audience: z.enum(['general', 'specialized', 'academic', 'youth', 'senior']),
});

export type WritingStyle = z.infer<typeof writingStyleSchema>;

// 👤 CONTENT AGENT SCHEMA
export const contentAgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  agentType: z.enum(['reportero', 'columnista', 'trascendido', 'seo-specialist']),
  description: z.string(),
  personality: z.string(),
  specializations: z.array(z.string()),
  editorialLean: z.enum(['conservative', 'progressive', 'neutral', 'humor', 'critical', 'analytical']),
  writingStyle: writingStyleSchema,
  defaultTemplates: z.array(z.string()).optional(),
  isActive: z.boolean(),
  performanceMetrics: z.object({
    totalArticles: z.number(),
    averageQuality: z.number(),
    successRate: z.number(),
  }).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ContentAgent = z.infer<typeof contentAgentSchema>;

// 🌐 WEBSITE CONFIG SCHEMA
export const websiteConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  baseUrl: z.string(),
  listingUrl: z.string(),
  testUrl: z.string().optional(),
  isActive: z.boolean(),
  extractionFrequency: z.number(),
  generationFrequency: z.number(),
  contentSelectors: z.object({
    titleSelector: z.string(),
    contentSelector: z.string(),
    imageSelector: z.string().optional(),
    dateSelector: z.string().optional(),
    authorSelector: z.string().optional(),
    categorySelector: z.string().optional(),
  }),
  extractionSettings: z.object({
    maxUrlsPerExtraction: z.number(),
    duplicateFilter: z.boolean(),
    contentFilters: z.object({
      minContentLength: z.number(),
      excludeKeywords: z.array(z.string()),
      requiredKeywords: z.array(z.string()),
    }),
  }),
  statistics: z.object({
    totalUrlsExtracted: z.number(),
    totalContentExtracted: z.number(),
    successfulExtractions: z.number(),
    failedExtractions: z.number(),
    averageProcessingTime: z.number(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type WebsiteConfig = z.infer<typeof websiteConfigSchema>;

// 📱 FACEBOOK PAGE SCHEMA
export const facebookPageSchema = z.object({
  id: z.string(),
  name: z.string(),
  accessToken: z.string().optional(),
  category: z.string().optional(),
  fanCount: z.number().optional(),
  isActive: z.boolean().default(true),
});

export type FacebookPage = z.infer<typeof facebookPageSchema>;

// 📄 FACEBOOK CONFIG SCHEMA
export const facebookConfigSchema = z.object({
  id: z.string(),
  websiteConfigId: z.string(),
  name: z.string(),
  facebookPageId: z.string(),
  facebookPageName: z.string(),
  templateId: z.string(),
  isActive: z.boolean(),
  publishingFrequency: z.number(),
  maxPostsPerDay: z.number(),
  postingSchedule: z.object({
    enabled: z.boolean(),
    startTime: z.string(),
    endTime: z.string(),
    weekdays: z.array(z.boolean()),
    timezone: z.string(),
  }),
  contentOptimization: z.object({
    generateEmojis: z.boolean(),
    generateHashtags: z.boolean(),
    maxHashtags: z.number(),
    engagementOptimization: z.boolean(),
    duplicateDetection: z.boolean(),
    cooldownPeriod: z.number(),
  }),
  statistics: z.object({
    totalPostsPublished: z.number(),
    successfulPosts: z.number(),
    failedPosts: z.number(),
    averageEngagementRate: z.number(),
    totalReach: z.number(),
    bestPerformingTime: z.string(),
  }),
  lastPublishedAt: z.string().optional(),
  postsToday: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type FacebookConfig = z.infer<typeof facebookConfigSchema>;

// 🔗 EXTRACTED URL SCHEMA
export const extractedUrlSchema = z.object({
  id: z.string().optional(),
  url: z.string(),
  websiteId: z.string().optional(),
  title: z.string().optional(),
  image: z.string().optional(),
  publishedAt: z.string().optional(),
  status: z.enum(['pending', 'extracted', 'failed']).optional(),
  extractedAt: z.string().optional(),
  createdAt: z.string().optional(),
});

export type ExtractedUrl = z.infer<typeof extractedUrlSchema>;

// 📰 EXTRACTED CONTENT SCHEMA
export const extractedContentSchema = z.object({
  id: z.string(),
  url: z.string(),
  websiteId: z.string(),
  websiteName: z.string().optional(),
  title: z.string(),
  content: z.string(),
  imageUrl: z.string().optional(),
  images: z.array(z.string()).optional(),
  publishedAt: z.string().optional(),
  author: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'extracted']),
  extractedAt: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type ExtractedContent = z.infer<typeof extractedContentSchema>;

// ✨ GENERATED CONTENT SCHEMA
export const generatedContentSchema = z.object({
  id: z.string(),
  extractedContentId: z.string(),
  extractedNoticiaId: z.string().optional(),
  agentId: z.string(),
  agentName: z.string().optional(),
  templateId: z.string().optional(),
  generatedTitle: z.string(),
  generatedContent: z.string(),
  generatedSummary: z.string().optional(),
  status: z.string(),
  metadata: z.object({
    wordCount: z.number().optional(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
  generatedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export type GeneratedContent = z.infer<typeof generatedContentSchema>;

// 📮 GENERATED POST SCHEMA
export const generatedPostSchema = z.object({
  id: z.string(),
  originalNoticiaId: z.string(),
  generatedContentId: z.string(),
  websiteConfigId: z.string(),
  facebookConfigId: z.string(),
  facebookPostId: z.string().optional(),
  facebookPostUrl: z.string().optional(),
  postContent: z.string(),
  originalTitle: z.string(),
  optimizedTitle: z.string(),
  mediaUrls: z.array(z.string()),
  processedMediaUrls: z.array(z.string()),
  status: z.enum(['pending', 'scheduled', 'publishing', 'published', 'failed']),
  scheduledAt: z.string(),
  publishedAt: z.string().optional(),
  failureReason: z.string().optional(),
  category: z.string().optional(),
  keywords: z.array(z.string()),
  engagement: z.object({
    likes: z.number(),
    comments: z.number(),
    shares: z.number(),
    reach: z.number(),
    impressions: z.number(),
    engagementRate: z.number(),
    lastUpdated: z.string(),
  }).optional(),
  originalSourceUrl: z.string(),
  contentQualityScore: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type GeneratedPost = z.infer<typeof generatedPostSchema>;

// 🔄 GENERATOR PRO JOB SCHEMA
export const generatorProJobSchema = z.object({
  id: z.string(),
  type: z.enum(['extract_urls', 'extract_content', 'generate_content', 'publish_facebook', 'sync_engagement']),
  websiteConfigId: z.string(),
  facebookConfigId: z.string().optional(),
  relatedEntityId: z.string().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  priority: z.number(),
  progress: z.number(),
  data: z.record(z.unknown()),
  result: z.record(z.unknown()).optional(),
  error: z.string().optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  processingTime: z.number().optional(),
  retryCount: z.number(),
  maxRetries: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type GeneratorProJob = z.infer<typeof generatorProJobSchema>;

// 📊 API RESPONSE SCHEMAS

export const websitesResponseSchema = z.object({
  websites: z.array(websiteConfigSchema),
});

export const facebookPagesResponseSchema = z.object({
  pages: z.array(facebookPageSchema),
});

export const extractedUrlsResponseSchema = z.object({
  extractedUrls: z.array(extractedUrlSchema),
  totalUrls: z.number(),
});

export const extractedUrlsPaginatedResponseSchema = z.object({
  urls: z.array(extractedUrlSchema),
  total: z.number(),
  page: z.number(),
  totalPages: z.number(),
});

export const extractedContentResponseSchema = z.object({
  extractedContent: z.array(extractedContentSchema),
  totalProcessed: z.number(),
});

export const extractedContentPaginatedResponseSchema = z.object({
  content: z.array(extractedContentSchema),
  total: z.number(),
  page: z.number(),
  totalPages: z.number(),
});

export const contentAgentsResponseSchema = z.object({
  agents: z.array(contentAgentSchema),
  total: z.number(),
});

export const generatedContentPaginatedResponseSchema = z.object({
  generated: z.array(generatedContentSchema),
  total: z.number(),
  page: z.number(),
  totalPages: z.number(),
});
