/**
 * 📋 useNoticiasJobs Hook
 * TanStack Query hooks for managing extraction jobs and statistics
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../shared/services/apiClient';
import type {
  NoticiasJob,
  PaginatedJobs,
  JobsFilters,
  ExtractionStats,
  JobRetryResult,
} from '../types/noticias.types';

// ============================================================================
// 🔑 Query Keys
// ============================================================================

export const noticiasJobsKeys = {
  all: ['noticias-jobs'] as const,
  lists: () => [...noticiasJobsKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...noticiasJobsKeys.lists(), filters] as const,
  details: () => [...noticiasJobsKeys.all, 'detail'] as const,
  detail: (jobId: string) => [...noticiasJobsKeys.details(), jobId] as const,
  stats: () => [...noticiasJobsKeys.all, 'stats'] as const,
};

// ============================================================================
// 📋 Fetch Jobs List
// ============================================================================

interface UseNoticiasJobsParams extends JobsFilters {
  page?: number;
  limit?: number;
}

export function useNoticiasJobs(params: UseNoticiasJobsParams = {}) {
  const {
    page = 1,
    limit = 10,
    status,
    domain,
    dateFrom,
    dateTo,
  } = params;

  return useQuery({
    queryKey: noticiasJobsKeys.list({
      page,
      limit,
      status,
      domain,
      dateFrom,
      dateTo,
    }),
    queryFn: async (): Promise<PaginatedJobs> => {
      const response = await apiClient.get('/noticias/jobs', {
        params: {
          page,
          limit,
          status,
          domain,
          dateFrom,
          dateTo,
        },
      });
      return response.data;
    },
    staleTime: 1000 * 30, // 30 seconds (jobs change frequently)
    refetchInterval: 1000 * 10, // Auto-refresh every 10 seconds for active jobs
  });
}

// ============================================================================
// 🔍 Fetch Single Job
// ============================================================================

export function useNoticiasJob(jobId: string, enabled = true) {
  return useQuery({
    queryKey: noticiasJobsKeys.detail(jobId),
    queryFn: async (): Promise<NoticiasJob | null> => {
      const response = await apiClient.get(`/noticias/jobs/${jobId}`);
      return response.data;
    },
    enabled: enabled && !!jobId,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: (data) => {
      // Auto-refresh every 5 seconds if job is processing
      if (data?.status === 'processing' || data?.status === 'pending') {
        return 1000 * 5;
      }
      return false; // Stop auto-refresh for completed/failed jobs
    },
  });
}

// ============================================================================
// 🔄 Retry Failed Job
// ============================================================================

export function useRetryJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string): Promise<JobRetryResult> => {
      const response = await apiClient.post(`/noticias/jobs/${jobId}/retry`);
      return response.data;
    },
    onSuccess: (_, jobId) => {
      // Invalidate jobs list and specific job
      queryClient.invalidateQueries({ queryKey: noticiasJobsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: noticiasJobsKeys.detail(jobId) });
      queryClient.invalidateQueries({ queryKey: noticiasJobsKeys.stats() });
    },
  });
}

// ============================================================================
// 📊 Extraction Statistics
// ============================================================================

export function useExtractionStats() {
  return useQuery({
    queryKey: noticiasJobsKeys.stats(),
    queryFn: async (): Promise<ExtractionStats> => {
      const response = await apiClient.get('/noticias/stats');
      return response.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 30, // Auto-refresh every 30 seconds
  });
}

// ============================================================================
// 🎯 Helper Hooks
// ============================================================================

/**
 * Get pending jobs
 */
export function usePendingJobs(params: Omit<UseNoticiasJobsParams, 'status'> = {}) {
  return useNoticiasJobs({
    ...params,
    status: 'pending',
  });
}

/**
 * Get processing jobs
 */
export function useProcessingJobs(params: Omit<UseNoticiasJobsParams, 'status'> = {}) {
  return useNoticiasJobs({
    ...params,
    status: 'processing',
  });
}

/**
 * Get failed jobs
 */
export function useFailedJobs(params: Omit<UseNoticiasJobsParams, 'status'> = {}) {
  return useNoticiasJobs({
    ...params,
    status: 'failed',
  });
}

/**
 * Get completed jobs
 */
export function useCompletedJobs(params: Omit<UseNoticiasJobsParams, 'status'> = {}) {
  return useNoticiasJobs({
    ...params,
    status: 'completed',
  });
}

/**
 * Get jobs for specific domain
 */
export function useDomainJobs(domain: string, params: Omit<UseNoticiasJobsParams, 'domain'> = {}) {
  return useNoticiasJobs({
    ...params,
    domain,
  });
}