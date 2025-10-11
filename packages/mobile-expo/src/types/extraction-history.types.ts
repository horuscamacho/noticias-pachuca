/**
 * Extraction History Types
 * Types for outlet extraction history tracking
 */

export interface ExtractionHistoryItem {
  id: string;
  websiteConfigId: string;
  startedAt: Date;
  completedAt: Date | null;
  duration: number; // seconds
  totalUrlsFound: number;
  totalContentExtracted: number;
  totalFailed: number;
  status: 'in_progress' | 'completed' | 'failed' | 'partial';
  errorMessage?: string;
}

export interface ExtractionHistoryResponse {
  history: ExtractionHistoryItem[];
  total: number;
}

export interface OutletStatisticsDetailed {
  totalUrlsExtracted: number;
  totalContentExtracted: number;
  totalFailed: number;
  successRate: number; // percentage
}
