/**
 * 🤖 Generated Content Types
 * Tipos para contenido generado por IA con agentes editoriales
 */

export interface SocialMediaCopies {
  facebook?: {
    hook: string;
    copy: string;
    emojis: string[];
    hookType: 'Scary' | 'FreeValue' | 'Strange' | 'Sexy' | 'Familiar';
    estimatedEngagement: 'high' | 'medium' | 'low';
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
}

export interface GenerationMetadata {
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  cost?: number;
  processingTime?: number;
  temperature?: number;
  maxTokens?: number;
  finishReason?: string;
  contentQuality?: number;
  aiProvider?: string;
  tokensUsed?: number;
  costEstimate?: number;
}

export interface PublishingInfo {
  publishedAt?: string;
  publishedBy?: string;
  platform?: string;
  url?: string;
  socialShares?: number;
  views?: number;
  sitesCount?: number;
  socialMediaPostsCount?: number;
}

export interface GeneratedContent {
  id: string;
  extractedNoticiaId: string;
  agentId: string;
  agentName?: string;
  generatedTitle: string;
  generatedContent: string;
  generatedSummary?: string;
  generatedKeywords?: string[];
  generatedTags?: string[];
  generatedCategory?: string;
  socialMediaCopies?: SocialMediaCopies;
  generationMetadata?: GenerationMetadata;
  publishingInfo?: PublishingInfo;
  createdAt: string;
  status: string;
}

export interface GenerateContentRequest {
  extractedContentId: string;
  agentId: string;
  templateId?: string;
  providerId?: string;
  referenceContent?: string;
}

export interface GeneratedContentListResponse {
  generated: GeneratedContent[];
  total: number;
  page?: number;
  totalPages?: number;
}

// API Response types
export interface GeneratedContentApiResponse {
  id: string;
  extractedNoticiaId: string;
  templateId: string;
  agentId: string;
  generatedContent: string;
  generatedTitle: string;
  generatedSummary?: string;
  status: string;
  metadata?: {
    wordCount: number;
    keywords: string[];
  };
  generatedAt: string;
  createdAt: string;
}
