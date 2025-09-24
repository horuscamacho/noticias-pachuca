/**
 * 📰 useExtractedNoticias Hook
 * TanStack Query hooks for managing extracted news content
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../shared/services/apiClient';
import type {
  ExtractedNoticia,
  PaginatedNoticias,
  NoticiasFilters,
  ExtractionTriggerForm,
  BatchExtractionForm,
  ExtractionJobResult,
  BatchExtractionResult,
} from '../types/noticias.types';

// ============================================================================
// 🔑 Query Keys
// ============================================================================

export const extractedNoticiasKeys = {
  all: ['extracted-noticias'] as const,
  lists: () => [...extractedNoticiasKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...extractedNoticiasKeys.lists(), filters] as const,
  details: () => [...extractedNoticiasKeys.all, 'detail'] as const,
  detail: (id: string) => [...extractedNoticiasKeys.details(), id] as const,
};

// ============================================================================
// 📰 Fetch Extracted Noticias
// ============================================================================

interface UseExtractedNoticiasParams extends NoticiasFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useExtractedNoticias(params: UseExtractedNoticiasParams = {}) {
  const {
    page = 1,
    limit = 10,
    domain,
    status,
    dateFrom,
    dateTo,
    hasImages,
    facebookPostId,
    pageId,
    searchText,
    sortBy = 'extractedAt',
    sortOrder = 'desc',
  } = params;

  return useQuery({
    queryKey: extractedNoticiasKeys.list({
      page,
      limit,
      domain,
      status,
      dateFrom,
      dateTo,
      hasImages,
      facebookPostId,
      pageId,
      searchText,
      sortBy,
      sortOrder,
    }),
    queryFn: async (): Promise<PaginatedNoticias> => {
      const response = await apiClient.get('/noticias/extracted', {
        params: {
          page,
          limit,
          domain,
          status,
          dateFrom,
          dateTo,
          hasImages,
          facebookPostId,
          pageId,
          searchText,
          sortBy,
          sortOrder,
        },
      });
      return response;
    },
    staleTime: 1000 * 60 * 3, // 3 minutes
  });
}

// ============================================================================
// 🔍 Fetch Single Noticia
// ============================================================================

export function useExtractedNoticia(id: string, enabled = true) {
  return useQuery({
    queryKey: extractedNoticiasKeys.detail(id),
    queryFn: async (): Promise<ExtractedNoticia> => {
      const response = await apiClient.get(`/noticias/extracted/${id}`);
      return response.data;
    },
    enabled: enabled && !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ============================================================================
// 🚀 Trigger Single URL Extraction
// ============================================================================

export function useTriggerExtraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      configId,
      data,
    }: {
      configId: string;
      data: ExtractionTriggerForm;
    }): Promise<ExtractionJobResult> => {
      const response = await apiClient.post(`/noticias/extract/${configId}`, data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate extracted noticias and jobs lists
      queryClient.invalidateQueries({ queryKey: extractedNoticiasKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['noticias-jobs'] });
    },
  });
}

// ============================================================================
// 📦 Trigger Batch Domain Extraction
// ============================================================================

export function useTriggerBatchExtraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      domain,
      data,
    }: {
      domain: string;
      data: BatchExtractionForm;
    }): Promise<BatchExtractionResult> => {
      const response = await apiClient.post(`/noticias/extract/domain/${domain}`, data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate extracted noticias and jobs lists
      queryClient.invalidateQueries({ queryKey: extractedNoticiasKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['noticias-jobs'] });
    },
  });
}

// ============================================================================
// 🎯 Helper Hooks
// ============================================================================

/**
 * Get successfully extracted noticias
 */
export function useSuccessfulNoticias(params: Omit<UseExtractedNoticiasParams, 'status'> = {}) {
  return useExtractedNoticias({
    ...params,
    status: 'extracted',
  });
}

/**
 * Get failed extractions
 */
export function useFailedNoticias(params: Omit<UseExtractedNoticiasParams, 'status'> = {}) {
  return useExtractedNoticias({
    ...params,
    status: 'failed',
  });
}

/**
 * Get noticias with images
 */
export function useNoticiasWithImages(params: Omit<UseExtractedNoticiasParams, 'hasImages'> = {}) {
  return useExtractedNoticias({
    ...params,
    hasImages: true,
  });
}

/**
 * Search noticias by text
 */
export function useSearchNoticias(
  searchText: string,
  params: Omit<UseExtractedNoticiasParams, 'searchText'> = {}
) {
  return useExtractedNoticias({
    ...params,
    searchText,
  });
}