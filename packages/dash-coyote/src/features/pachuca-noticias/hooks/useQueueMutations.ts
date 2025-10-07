import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../shared/services/apiClient';
import type {
  PublicationQueueItem,
  UpdatePriorityRequest,
  CancelScheduleRequest,
} from '../types';
import type { PublishedNoticia } from '../types';
import { queueKeys } from './usePublicationQueue';

/**
 * 🔄 API Functions para mutaciones de cola
 */
const queueMutationsApi = {
  /**
   * Cancela una publicación programada
   */
  cancelSchedule: async (queueId: string, request: CancelScheduleRequest): Promise<PublicationQueueItem> => {
    return apiClient.delete<PublicationQueueItem>(
      `/pachuca-noticias/queue/${queueId}`,
      { data: request }
    );
  },

  /**
   * Cambia la prioridad de un item en cola
   */
  updatePriority: async (queueId: string, request: UpdatePriorityRequest): Promise<PublicationQueueItem> => {
    return apiClient.patch<PublicationQueueItem>(
      `/pachuca-noticias/queue/${queueId}/priority`,
      request
    );
  },

  /**
   * Fuerza publicación inmediata de un item en cola (admin)
   */
  forcePublish: async (queueId: string): Promise<PublishedNoticia> => {
    return apiClient.post<PublishedNoticia>(
      `/pachuca-noticias/${queueId}/force-publish`,
      {}
    );
  },
};

/**
 * 🚫 Hook para cancelar publicación programada
 *
 * @example
 * ```tsx
 * const { mutate: cancel, isPending } = useCancelSchedule({
 *   onSuccess: () => {
 *     toast.success('Publicación cancelada');
 *   }
 * });
 *
 * cancel({
 *   queueId: '507f1f77bcf86cd799439011',
 *   reason: 'Contenido desactualizado'
 * });
 * ```
 */
export function useCancelSchedule(options?: {
  onSuccess?: (data: PublicationQueueItem) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ queueId, reason }: { queueId: string; reason?: string }) =>
      queueMutationsApi.cancelSchedule(queueId, { reason }),

    onSuccess: (data) => {
      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: queueKeys.all });

      options?.onSuccess?.(data);
    },

    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}

/**
 * 🔄 Hook para cambiar prioridad en cola
 *
 * @example
 * ```tsx
 * const { mutate: changePriority } = useChangePriority({
 *   onSuccess: () => {
 *     toast.success('Prioridad actualizada');
 *   }
 * });
 *
 * changePriority({
 *   queueId: '507f1f77bcf86cd799439011',
 *   priority: 9 // 1-10
 * });
 * ```
 */
export function useChangePriority(options?: {
  onSuccess?: (data: PublicationQueueItem) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ queueId, priority }: { queueId: string; priority: number }) =>
      queueMutationsApi.updatePriority(queueId, { priority }),

    onSuccess: (data) => {
      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: queueKeys.all });

      options?.onSuccess?.(data);
    },

    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}

/**
 * ⚡ Hook para forzar publicación inmediata (admin)
 *
 * @example
 * ```tsx
 * const { mutate: forcePublish } = useForcePublish({
 *   onSuccess: (noticia) => {
 *     toast.success(`Publicado: ${noticia.slug}`);
 *   }
 * });
 *
 * forcePublish('507f1f77bcf86cd799439011');
 * ```
 */
export function useForcePublish(options?: {
  onSuccess?: (data: PublishedNoticia) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: queueMutationsApi.forcePublish,

    onSuccess: (data) => {
      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: queueKeys.all });

      options?.onSuccess?.(data);
    },

    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}
