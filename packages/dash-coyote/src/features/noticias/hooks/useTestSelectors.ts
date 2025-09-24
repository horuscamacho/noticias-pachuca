import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../shared/services/apiClient';

export interface ExtractorSelectors {
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

export interface TestSelectorsRequest {
  url: string;
  selectors: ExtractorSelectors;
  settings?: ExtractionSettings;
  customHeaders?: Record<string, string>;
}

export interface TestExtractionResponse {
  success: boolean;
  extractedData?: {
    title?: string;
    content?: string;
    images?: string[];
    author?: string;
    publishedAt?: string;
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
}

export const useTestSelectors = () => {
  return useMutation<TestExtractionResponse, Error, TestSelectorsRequest>({
    mutationFn: async (testData: TestSelectorsRequest) => {
      const response = await apiClient.post<TestExtractionResponse>(
        '/noticias/test-selectors',
        testData
      );
      return response;
    },
  });
};