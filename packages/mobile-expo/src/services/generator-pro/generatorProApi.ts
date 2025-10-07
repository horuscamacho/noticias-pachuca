import { ApiClient } from '@/src/services/api/ApiClient';

// Types
export interface WebsiteConfig {
  id: string;
  name: string;
  baseUrl: string;
  listingUrl: string;
  isActive: boolean;
  extractionFrequency: number;
  statistics?: {
    totalUrlsExtracted: number;
    successfulExtractions: number;
  };
}

export interface ExtractedUrl {
  id?: string;
  url: string;
  title?: string;
  websiteId?: string;
  status?: 'pending' | 'processed' | 'failed';
  extractedAt?: string;
}

export interface ExtractedContent {
  id: string;
  url: string;
  title: string;
  content: string;
  author?: string;
  category?: string;
  websiteId: string;
  extractedAt: string;
}

// API functions
export const generatorProApi = {
  // Websites
  getWebsites: async (): Promise<WebsiteConfig[]> => {
    // El ApiClient extrae response.data.data, pero generator-pro devuelve directamente
    // Por eso usamos getRawClient() para manejar la respuesta manualmente
    const rawClient = ApiClient.getRawClient();
    const response = await rawClient.get<{ websites: WebsiteConfig[] }>('/generator-pro/websites');
    return response.data.websites;
  },

  // URLs Tab - Extract URLs and save to database
  extractUrlsAndSave: async (websiteId: string): Promise<{ extractedUrls: ExtractedUrl[]; totalUrls: number }> => {
    const rawClient = ApiClient.getRawClient();
    const response = await rawClient.post<{ extractedUrls: ExtractedUrl[]; totalUrls: number }>(
      `/generator-pro/websites/${websiteId}/extract-urls-and-save`
    );
    return response.data;
  },

  // Contenido Tab - Extract content from URLs
  extractContentFromUrls: async (data: {
    urls: string[];
    websiteId: string;
  }): Promise<{ extractedContent: ExtractedContent[]; totalProcessed: number }> => {
    const rawClient = ApiClient.getRawClient();
    const response = await rawClient.post<{ extractedContent: ExtractedContent[]; totalProcessed: number }>(
      '/generator-pro/urls/extract-content',
      data
    );
    return response.data;
  },
};
