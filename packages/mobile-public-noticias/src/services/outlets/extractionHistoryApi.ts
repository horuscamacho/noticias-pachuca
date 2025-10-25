import { ApiClient } from '@/src/services/api/ApiClient';
import type {
  ExtractionHistoryResponse,
  ExtractionHistoryItem,
  OutletStatisticsDetailed,
} from '@/src/types/extraction-history.types';

/**
 * API Service for Extraction History
 * Fetches real statistics and history from extractednoticias table
 */
export const extractionHistoryApi = {
  /**
   * Get detailed statistics for an outlet
   * Calculates from extractednoticias table
   */
  getOutletStatistics: async (websiteConfigId: string): Promise<OutletStatisticsDetailed> => {
    try {
      const rawClient = ApiClient.getRawClient();
      const response = await rawClient.get<OutletStatisticsDetailed>(
        `/generator-pro/websites/${websiteConfigId}/statistics`
      );

      return response.data;
    } catch (error) {
      console.error(`Error fetching statistics for outlet ${websiteConfigId}:`, error);
      // Return default values on error
      return {
        totalUrlsExtracted: 0,
        totalContentExtracted: 0,
        totalFailed: 0,
        successRate: 0,
      };
    }
  },

  /**
   * Get extraction history for an outlet
   * Shows last N extraction runs with details
   */
  getExtractionHistory: async (
    websiteConfigId: string,
    limit: number = 5
  ): Promise<ExtractionHistoryItem[]> => {
    try {
      const rawClient = ApiClient.getRawClient();
      const response = await rawClient.get<ExtractionHistoryResponse>(
        `/generator-pro/websites/${websiteConfigId}/extraction-history`,
        {
          params: { limit },
        }
      );

      // Map dates from string to Date objects
      return response.data.history.map((item) => ({
        ...item,
        startedAt: new Date(item.startedAt),
        completedAt: item.completedAt ? new Date(item.completedAt) : null,
      }));
    } catch (error) {
      console.error(`Error fetching extraction history for outlet ${websiteConfigId}:`, error);
      return [];
    }
  },
};
