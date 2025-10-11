/**
 * 📄 Interfaces para contenido generado por IA
 * Resultado final, metadata y métricas de calidad
 */

import { GenerationStatus } from './content-generation-request.interface';

export interface GeneratedContent {
  id: string;
  originalContentId: string; // Referencia al contenido original
  agentId: string; // Agente que generó
  templateId: string; // Template usado
  providerId: string; // Proveedor de IA usado
  generatedTitle: string;
  generatedContent: string;
  generatedKeywords: string[];
  generatedTags: string[];
  generatedCategory?: string;
  generatedSummary?: string;
  status: GenerationStatus;
  generationMetadata: GenerationMetadata;
  qualityMetrics?: ContentQualityMetrics;
  comparisonMetrics?: ComparisonMetrics;
  errors: string[];
  warnings: string[];
  reviewInfo?: ReviewInfo;
  publishingInfo?: PublishingInfo;
  versioning?: VersioningInfo;
  generatedAt: Date;
  originalPublishedAt?: Date; // Fecha de publicación del contenido original (denormalizado)
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerationMetadata {
  model: string; // Modelo específico usado
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  processingTime: number; // ms
  temperature: number;
  maxTokens: number;
  finishReason: string; // 'stop', 'length', 'content_filter'
}

export interface ContentQualityMetrics {
  readabilityScore?: number; // 0-100
  sentimentScore?: number; // -1 a 1
  coherenceScore?: number; // 0-100
  originalityScore?: number; // 0-100
  seoScore?: number; // 0-100
  userRating?: number; // 1-5
  humanReviewScore?: number; // 1-10
}

export interface ComparisonMetrics {
  similarityToOriginal?: number; // % similitud
  lengthRatio?: number; // ratio vs original
  keywordDensity?: number; // % keywords
  readingLevel?: string; // 'elementary', 'middle', 'high', 'college'
  toneAnalysis?: string; // 'formal', 'informal', 'technical', 'conversational'
}

export interface ReviewInfo {
  reviewerId?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  changesRequested?: string[];
  approvalLevel?: 'auto' | 'human' | 'editor';
}

export interface PublishingInfo {
  publishedAt?: Date;
  publishedBy?: string;
  platform?: string;
  url?: string;
  socialShares?: number;
  views?: number;
}

export interface VersioningInfo {
  version: number;
  previousVersionId?: string;
  changeLog?: string;
  isLatest: boolean;
}

export interface CreateGeneratedContentRequest {
  originalContentId: string;
  agentId: string;
  templateId: string;
  providerId: string;
  generatedTitle: string;
  generatedContent: string;
  generatedKeywords?: string[];
  generatedTags?: string[];
  generatedCategory?: string;
  generatedSummary?: string;
  originalPublishedAt?: Date; // Fecha de publicación del contenido original (denormalizado)
  generationMetadata: GenerationMetadata;
}

export interface UpdateGeneratedContentRequest {
  generatedTitle?: string;
  generatedContent?: string;
  generatedKeywords?: string[];
  generatedTags?: string[];
  generatedCategory?: string;
  generatedSummary?: string;
  status?: GenerationStatus;
  qualityMetrics?: Partial<ContentQualityMetrics>;
  reviewInfo?: Partial<ReviewInfo>;
  publishingInfo?: Partial<PublishingInfo>;
  versioning?: VersioningInfo;
}

export interface GeneratedContentResponse {
  id: string;
  originalContent: {
    id: string;
    title: string;
    content: string;
    sourceUrl?: string;
    publishedAt?: Date;
    images?: string[];
  };
  agent: {
    id: string;
    name: string;
    type: string;
  };
  template: {
    id: string;
    name: string;
    type: string;
  };
  provider: {
    id: string;
    name: string;
    model: string;
  };
  generatedTitle: string;
  generatedContent: string;
  generatedKeywords: string[];
  generatedTags: string[];
  generatedCategory?: string;
  generatedSummary?: string;
  status: GenerationStatus;
  generationMetadata: GenerationMetadata;
  qualityMetrics?: ContentQualityMetrics;
  comparisonMetrics?: ComparisonMetrics;
  errors: string[];
  warnings: string[];
  reviewInfo?: ReviewInfo;
  publishingInfo?: PublishingInfo;
  versioning?: VersioningInfo;
  generatedAt: Date;
  originalPublishedAt?: Date; // Fecha de publicación del contenido original (denormalizado)
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentComparisonResponse {
  originalContent: {
    title: string;
    content: string;
    wordCount: number;
    readingTime: number;
  };
  generatedContent: {
    title: string;
    content: string;
    wordCount: number;
    readingTime: number;
  };
  comparisonMetrics: ComparisonMetrics;
  qualityMetrics?: ContentQualityMetrics;
  recommendations?: string[];
}

export interface GeneratedContentFilters {
  status?: GenerationStatus[];
  agentId?: string;
  templateId?: string;
  providerId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minQualityScore?: number;
  hasReview?: boolean;
  isPublished?: boolean;
  category?: string;
  tags?: string[];
  search?: string;
}

export interface GeneratedContentStats {
  totalGenerated: number;
  byStatus: Record<GenerationStatus, number>;
  byAgent: Record<string, number>;
  byTemplate: Record<string, number>;
  byProvider: Record<string, number>;
  averageQuality: number;
  totalCost: number;
  averageProcessingTime: number; // ms
  successRate: number; // %
}