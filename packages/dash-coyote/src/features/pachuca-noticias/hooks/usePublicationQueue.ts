import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../shared/services/apiClient';
import type {
  PublicationQueueItem,
  QueueFilters,
  QueueResponse,
  QueueStats,
} from '../types';

/**
 * 📋 API Functions para cola de publicación
 */
const queueApi = {
  /**
   * Obtiene items en cola con filtros
   */
  getQueue: async (filters?: QueueFilters): Promise<PublicationQueueItem[]> => {
    const params = new URLSearchParams();

    if (filters?.status) params.append('status', filters.status);
    if (filters?.queueType) params.append('queueType', filters.queueType);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await apiClient.get<QueueResponse>(
      `/pachuca-noticias/queue?${params.toString()}`
    );

    return response.data;
  },

  /**
   * Obtiene estadísticas de la cola
   */
  getStats: async (): Promise<QueueStats> => {
    return apiClient.get<QueueStats>('/pachuca-noticias/queue/stats');
  },
};

/**
 * 🔑 Query Keys
 */
export const queueKeys = {
  all: ['publicationQueue'] as const,
  lists: () => [...queueKeys.all, 'list'] as const,
  list: (filters?: QueueFilters) => [...queueKeys.lists(), filters] as const,
  stats: () => [...queueKeys.all, 'stats'] as const,
};

/**
 * 📋 Hook para listar cola de publicación
 *
 * @example
 * ```tsx
 * const { data: queueItems, isLoading } = usePublicationQueue({
 *   status: 'queued',
 *   page: 1,
 *   limit: 20
 * });
 * ```
 */
export function usePublicationQueue(filters?: QueueFilters) {
  return useQuery({
    queryKey: queueKeys.list(filters),
    queryFn: () => queueApi.getQueue(filters),
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 30 * 1000, // Polling cada 30 segundos para actualización en tiempo real
  });
}

/**
 * 📊 Hook para obtener estadísticas de cola
 *
 * @example
 * ```tsx
 * const { data: stats } = useQueueStats();
 * // stats.totalQueued, stats.estimatedNextPublish, etc.
 * ```
 */
export function useQueueStats() {
  return useQuery({
    queryKey: queueKeys.stats(),
    queryFn: () => queueApi.getStats(),
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 30 * 1000, // Polling cada 30 segundos
  });
}
