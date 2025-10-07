import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../shared/services/apiClient';
import type {
  SchedulePublicationRequest,
  SchedulePublicationResponse,
} from '../types';
import { queueKeys } from './usePublicationQueue';
import { availableContentKeys } from './useAvailableContent';

/**
 * 📅 API Function para programar publicación
 */
const scheduleApi = {
  /**
   * Programa una publicación (o publica inmediatamente si es breaking)
   */
  schedule: async (request: SchedulePublicationRequest): Promise<SchedulePublicationResponse> => {
    return apiClient.post<SchedulePublicationResponse>(
      '/pachuca-noticias/schedule',
      request
    );
  },
};

/**
 * 📅 Hook para programar publicación
 *
 * Maneja 3 tipos de publicación:
 * - **breaking**: Publica inmediatamente, no entra en cola
 * - **news**: Alta prioridad, cola inteligente (~30-60 min)
 * - **blog**: Prioridad normal, cola inteligente (~2-4 horas)
 *
 * @example
 * ```tsx
 * const { mutate: schedule, isPending } = useSchedulePublication({
 *   onSuccess: (result) => {
 *     if (result.type === 'published') {
 *       toast.success('Noticia publicada inmediatamente (breaking)');
 *     } else {
 *       toast.success('Publicación programada exitosamente');
 *     }
 *   }
 * });
 *
 * schedule({
 *   contentId: '507f1f77bcf86cd799439011',
 *   publicationType: 'news',
 *   useOriginalImage: true,
 * });
 * ```
 */
export function useSchedulePublication(options?: {
  onSuccess?: (data: SchedulePublicationResponse) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: scheduleApi.schedule,

    onSuccess: (data) => {
      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: queueKeys.all });
      queryClient.invalidateQueries({ queryKey: availableContentKeys.all });

      // Callback personalizado
      options?.onSuccess?.(data);
    },

    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}
