import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CommunityManagerApi } from '@/src/services/community-manager/communityManagerApi';
import type {
  ScheduledPostsFilters,
  ScheduleContentRequest,
  ScheduleRecycledRequest,
  CancelPostRequest,
  ReschedulePostRequest,
  EligibleContent,
} from '@/src/types/community-manager.types';

/**
 * Query keys para React Query - Community Manager
 */
export const communityManagerKeys = {
  all: ['community-manager'] as const,
  scheduledPosts: () => [...communityManagerKeys.all, 'scheduled-posts'] as const,
  scheduledPostsList: (filters?: ScheduledPostsFilters) =>
    [...communityManagerKeys.scheduledPosts(), 'list', filters] as const,
  scheduledPost: (id: string) => [...communityManagerKeys.scheduledPosts(), id] as const,
  stats: () => [...communityManagerKeys.all, 'stats'] as const,
  recycling: () => [...communityManagerKeys.all, 'recycling'] as const,
  eligibleContent: (limit?: number) =>
    [...communityManagerKeys.recycling(), 'eligible', limit] as const,
  recyclingStats: () => [...communityManagerKeys.recycling(), 'stats'] as const,
};

// ========================================
// SCHEDULED POSTS HOOKS
// ========================================

/**
 * Hook para obtener lista de posts programados con filtros
 * @param filters - Filtros opcionales (platform, contentType, status, etc.)
 */
export function useScheduledPosts(filters?: ScheduledPostsFilters) {
  return useQuery({
    queryKey: communityManagerKeys.scheduledPostsList(filters),
    queryFn: () => CommunityManagerApi.getScheduledPosts(filters),
    staleTime: 1 * 60 * 1000, // 1 minuto (datos frescos)
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener un post programado específico
 * @param id - ID del post programado
 */
export function useScheduledPostById(id: string) {
  return useQuery({
    queryKey: communityManagerKeys.scheduledPost(id),
    queryFn: () => CommunityManagerApi.getScheduledPostById(id),
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!id,
  });
}

/**
 * Hook para programar contenido en redes sociales
 * Invalida todas las queries de scheduled posts al completarse
 */
export function useScheduleContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ScheduleContentRequest) =>
      CommunityManagerApi.scheduleContent(data),
    onSuccess: () => {
      // Invalidar todas las listas de scheduled posts
      queryClient.invalidateQueries({ queryKey: communityManagerKeys.scheduledPosts() });
      // Invalidar stats
      queryClient.invalidateQueries({ queryKey: communityManagerKeys.stats() });
    },
  });
}

/**
 * Hook para programar reciclaje de contenido
 * Invalida queries de scheduled posts y recycling al completarse
 */
export function useScheduleRecycled() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ScheduleRecycledRequest) =>
      CommunityManagerApi.scheduleRecycled(data),
    onSuccess: () => {
      // Invalidar scheduled posts
      queryClient.invalidateQueries({ queryKey: communityManagerKeys.scheduledPosts() });
      // Invalidar eligible content
      queryClient.invalidateQueries({ queryKey: communityManagerKeys.recycling() });
      // Invalidar stats
      queryClient.invalidateQueries({ queryKey: communityManagerKeys.stats() });
    },
  });
}

/**
 * Hook para cancelar post programado
 * Invalida queries relacionadas al completarse
 */
export function useCancelScheduledPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CancelPostRequest) =>
      CommunityManagerApi.cancelScheduledPost(data),
    onSuccess: (_, variables) => {
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: communityManagerKeys.scheduledPosts() });
      // Invalidar post específico
      queryClient.invalidateQueries({
        queryKey: communityManagerKeys.scheduledPost(variables.scheduledPostId),
      });
      // Invalidar stats
      queryClient.invalidateQueries({ queryKey: communityManagerKeys.stats() });
    },
  });
}

/**
 * Hook para reprogramar post cancelado o fallido
 * Invalida queries relacionadas al completarse
 */
export function useReschedulePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReschedulePostRequest) =>
      CommunityManagerApi.reschedulePost(data),
    onSuccess: (_, variables) => {
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: communityManagerKeys.scheduledPosts() });
      // Invalidar post específico
      queryClient.invalidateQueries({
        queryKey: communityManagerKeys.scheduledPost(variables.scheduledPostId),
      });
      // Invalidar stats
      queryClient.invalidateQueries({ queryKey: communityManagerKeys.stats() });
    },
  });
}

// ✅ FIX: Helper para datos por defecto
function getDefaultStats(): CommunityManagerStats {
  return {
    scheduledPosts: {
      total: 0,
      byPlatform: {},
      byStatus: {},
      byContentType: {}
    },
    recycling: {
      totalEligible: 0,
      totalRecycled: 0,
      averagePerformance: 0
    }
  }
}

/**
 * Hook para obtener estadísticas del Community Manager
 * ✅ FIX: Ahora con valores por defecto para evitar undefined
 */
export function useCommunityManagerStats() {
  return useQuery({
    queryKey: communityManagerKeys.stats(),
    queryFn: async () => {
      try {
        const stats = await CommunityManagerApi.getStats()
        // ✅ FIX: Garantizar que siempre hay datos válidos
        return stats || getDefaultStats()
      } catch (error) {
        console.error('Error fetching CM stats:', error)
        // ✅ FIX: Retornar datos por defecto en lugar de lanzar error
        return getDefaultStats()
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000,
    // ✅ FIX: Retry automático con backoff exponencial
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // ✅ FIX: Datos iniciales mientras carga
    placeholderData: (previousData) => previousData || getDefaultStats(),
  });
}

// ========================================
// CONTENT RECYCLING HOOKS
// ========================================

/**
 * Hook para obtener contenido elegible para reciclaje
 * @param limit - Número máximo de resultados (default: 10)
 */
export function useEligibleContent(limit?: number) {
  return useQuery({
    queryKey: communityManagerKeys.eligibleContent(limit),
    queryFn: () => CommunityManagerApi.getEligibleContent(limit),
    staleTime: 5 * 60 * 1000, // 5 minutos (no cambia tan rápido)
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook para verificar elegibilidad de una noticia específica
 * @param noticiaId - ID de la noticia
 */
export function useCheckEligibility(noticiaId: string) {
  return useQuery({
    queryKey: [...communityManagerKeys.recycling(), 'eligibility', noticiaId],
    queryFn: () => CommunityManagerApi.checkEligibility(noticiaId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!noticiaId,
  });
}

/**
 * Hook para obtener estadísticas de reciclaje
 */
export function useRecyclingStats() {
  return useQuery({
    queryKey: communityManagerKeys.recyclingStats(),
    queryFn: () => CommunityManagerApi.getRecyclingStats(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook para crear schedule de reciclaje
 * Invalida queries de eligible content al completarse
 */
export function useCreateRecycleSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noticiaId, frequencyDays }: { noticiaId: string; frequencyDays?: number }) =>
      CommunityManagerApi.createRecycleSchedule(noticiaId, frequencyDays),
    onSuccess: () => {
      // Invalidar eligible content
      queryClient.invalidateQueries({ queryKey: communityManagerKeys.recycling() });
      // Invalidar stats
      queryClient.invalidateQueries({ queryKey: communityManagerKeys.recyclingStats() });
    },
  });
}
