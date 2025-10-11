import type { OutletConfig } from './outlet.types';

/**
 * 🤖 AI Outlet Types
 * Tipos para funcionalidad de análisis inteligente con OpenAI
 */

// ========== ANALYZE LISTING ==========

export interface AiAnalyzeListingRequest {
  listingUrl: string;
}

export interface AiAnalyzeListingResponse {
  selector: string;
  confidence: number;
  urlsFound: string[];
  count: number;
  reasoning: string;
  optimizationStats?: {
    originalSize: number;
    optimizedSize: number;
    reductionPercentage: number;
    estimatedTokens: number;
  };
}

// ========== ANALYZE CONTENT ==========

export interface AiAnalyzeContentRequest {
  contentUrl: string;
}

export interface ContentSelectorsDto {
  titleSelector: string;
  contentSelector: string;
  imageSelector?: string;
  dateSelector?: string;
  authorSelector?: string;
  categorySelector?: string;
}

export interface ExtractedContentPreviewDto {
  title: string;
  content: string;
  image?: string;
  date?: string;
  author?: string;
  category?: string;
}

export interface AiAnalyzeContentResponse {
  selectors: ContentSelectorsDto;
  confidence: number;
  extractedPreview: ExtractedContentPreviewDto;
  reasoning: string;
  optimizationStats?: {
    originalSize: number;
    optimizedSize: number;
    reductionPercentage: number;
    estimatedTokens: number;
  };
}

// ========== CREATE OUTLET ==========

export interface AiCreateOutletRequest {
  name: string;
  baseUrl: string;
  listingUrl: string;
  testUrl?: string;
}

export interface ValidationResultsDto {
  listingSuccess: boolean;
  contentSuccess: boolean;
  overallConfidence: number;
  messages: string[];
}

export interface AiCreateOutletResponse {
  outlet: OutletConfig | null;
  listingAnalysis: AiAnalyzeListingResponse;
  contentAnalysis: AiAnalyzeContentResponse;
  validationResults: ValidationResultsDto;
  processingTimeMs: number;
}
