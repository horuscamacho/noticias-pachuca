/**
 * 🔧 useNoticiasConfigs Hook
 * TanStack Query hooks for managing extraction configurations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../shared/services/apiClient';
import type {
  NoticiasConfig,
  PaginatedConfigs,
  CreateConfigForm,
  TestExtractionRequest,
  TestExtractionResponse,
} from '../types/noticias.types';

// ============================================================================
// 🔑 Query Keys
// ============================================================================

export const noticiasConfigsKeys = {
  all: ['noticias-configs'] as const,
  lists: () => [...noticiasConfigsKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...noticiasConfigsKeys.lists(), filters] as const,
  details: () => [...noticiasConfigsKeys.all, 'detail'] as const,
  detail: (id: string) => [...noticiasConfigsKeys.details(), id] as const,
  domain: (domain: string) => [...noticiasConfigsKeys.all, 'domain', domain] as const,
  stats: () => [...noticiasConfigsKeys.all, 'stats'] as const,
};

// ============================================================================
// 📊 Fetch Configurations List
// ============================================================================

interface UseNoticiasConfigsParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
}

export function useNoticiasConfigs(params: UseNoticiasConfigsParams = {}) {
  const { page = 1, limit = 10, isActive } = params;

  return useQuery({
    queryKey: noticiasConfigsKeys.list({ page, limit, isActive }),
    queryFn: async (): Promise<PaginatedConfigs> => {
      const response = await apiClient.get('/noticias/configs', {
        params: { page, limit, isActive },
      });
      return response;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ============================================================================
// 🔍 Fetch Single Configuration
// ============================================================================

export function useNoticiasConfig(id: string, enabled = true) {
  return useQuery({
    queryKey: noticiasConfigsKeys.detail(id),
    queryFn: async (): Promise<NoticiasConfig> => {
      const response = await apiClient.get(`/noticias/configs/${id}`);
      return response.data;
    },
    enabled: enabled && !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ============================================================================
// 🌐 Fetch Configuration by Domain
// ============================================================================

export function useNoticiasConfigByDomain(domain: string, enabled = true) {
  return useQuery({
    queryKey: noticiasConfigsKeys.domain(domain),
    queryFn: async (): Promise<NoticiasConfig | null> => {
      const response = await apiClient.get(`/noticias/configs/domain/${domain}`);
      return response.data;
    },
    enabled: enabled && !!domain,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ============================================================================
// ➕ Create Configuration
// ============================================================================

export function useCreateNoticiasConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateConfigForm): Promise<NoticiasConfig> => {
      const response = await apiClient.post('/noticias/configs', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch configurations list
      queryClient.invalidateQueries({ queryKey: noticiasConfigsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: noticiasConfigsKeys.stats() });
    },
  });
}


// ============================================================================
// 🔄 Toggle Configuration Active Status
// ============================================================================

export function useToggleNoticiasConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<NoticiasConfig> => {
      const response = await apiClient.put(`/noticias/configs/${id}/toggle`);
      return response.data;
    },
    onSuccess: (updatedConfig) => {
      // Update cache for this specific config
      queryClient.setQueryData(noticiasConfigsKeys.detail(updatedConfig._id), updatedConfig);

      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: noticiasConfigsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: noticiasConfigsKeys.stats() });
    },
  });
}

// ============================================================================
// 🗑️ Delete Configuration
// ============================================================================

export function useDeleteNoticiasConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/noticias/configs/${id}`);
    },
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: noticiasConfigsKeys.detail(deletedId) });

      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: noticiasConfigsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: noticiasConfigsKeys.stats() });
    },
  });
}

// ============================================================================
// 🧪 Test Extraction
// ============================================================================

export function useTestExtraction() {
  return useMutation({
    mutationFn: async (data: TestExtractionRequest): Promise<TestExtractionResponse> => {
      const response = await apiClient.post('/noticias/configs/test-extraction', data);
      return response;
    },
  });
}

// ============================================================================
// 🚀 Extract Content from URL
// ============================================================================

export function useExtractFromUrl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      configId,
      url,
      facebookPostId,
      pageId,
    }: {
      configId: string;
      url: string;
      facebookPostId: string;
      pageId?: string;
    }): Promise<{ jobId: string; message: string }> => {
      const response = await apiClient.post(`/noticias/extract/${configId}`, {
        url,
        facebookPostId,
        pageId,
        priority: 1,
        forceReExtraction: false,
      });
      return response;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['external-urls'] });
      queryClient.invalidateQueries({ queryKey: ['noticias-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['extracted-noticias'] });
    },
  });
}

// ============================================================================
// 🔄 Sync URLs with Configurations
// ============================================================================

export function useSyncUrlsWithConfigs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<{ updated: number; message: string }> => {
      const response = await apiClient.post('/noticias/configs/sync-urls');
      return response;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['external-urls'] });
      queryClient.invalidateQueries({ queryKey: noticiasConfigsKeys.lists() });
    },
  });
}

// ============================================================================
// 📊 Configuration Stats
// ============================================================================

export function useNoticiasConfigStats() {
  return useQuery({
    queryKey: noticiasConfigsKeys.stats(),
    queryFn: async () => {
      const response = await apiClient.get('/noticias/configs/stats');
      return response;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}