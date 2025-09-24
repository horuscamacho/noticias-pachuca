/**
 * 🔍 useExternalUrls Hook
 * TanStack Query hooks for managing external URL detection
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../shared/services/apiClient';
import type {
  ExternalUrl,
  PaginatedExternalUrls,
  UrlDetectionFilters,
  UrlDetectionStats,
} from '../types/noticias.types';

// ============================================================================
// 🔑 Query Keys
// ============================================================================

export const externalUrlsKeys = {
  all: ['external-urls'] as const,
  lists: () => [...externalUrlsKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...externalUrlsKeys.lists(), filters] as const,
  stats: () => [...externalUrlsKeys.all, 'stats'] as const,
};

// ============================================================================
// 🔍 Fetch External URLs
// ============================================================================

interface UseExternalUrlsParams extends UrlDetectionFilters {
  page?: number;
  limit?: number;
}

export function useExternalUrls(params: UseExternalUrlsParams = {}) {
  const {
    page = 1,
    limit = 10,
    dateFrom,
    dateTo,
    pageId,
    hasConfig,
  } = params;

  return useQuery({
    queryKey: externalUrlsKeys.list({
      page,
      limit,
      dateFrom,
      dateTo,
      pageId,
      hasConfig,
    }),
    queryFn: async (): Promise<PaginatedExternalUrls> => {
      const response = await apiClient.get('/noticias/external-urls', {
        params: {
          page,
          limit,
          dateFrom,
          dateTo,
          pageId,
          hasConfig,
        },
      });
      return response;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes (URLs change frequently)
  });
}

// ============================================================================
// 📊 URL Detection Statistics
// ============================================================================

export function useUrlDetectionStats() {
  return useQuery({
    queryKey: externalUrlsKeys.stats(),
    queryFn: async (): Promise<UrlDetectionStats> => {
      const response = await apiClient.get('/noticias/external-urls/stats');
      return response;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ============================================================================
// 🎯 Helper Functions
// ============================================================================

/**
 * Get URLs that need configuration
 */
export function useUrlsNeedingConfig(params: Omit<UseExternalUrlsParams, 'hasConfig'> = {}) {
  return useExternalUrls({
    ...params,
    hasConfig: false,
  });
}

/**
 * Get URLs with existing configuration
 */
export function useUrlsWithConfig(params: Omit<UseExternalUrlsParams, 'hasConfig'> = {}) {
  return useExternalUrls({
    ...params,
    hasConfig: true,
  });
}