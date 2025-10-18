import { useMutation, useQueryClient } from '@tanstack/react-query';
import { publishApi } from '../services/publish/publishApi';
import type { PublishContentRequest } from '../types/publish.types';

/**
 * 📱 Hook para publicar contenido generado
 * Soporta publicación inmediata (breaking) y programada (news/blog)
 * Invalida cache automáticamente después de publicar
 */
export function usePublishContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: PublishContentRequest) => publishApi.publishContent(request),
    onSuccess: (data) => {
      // Invalidar cache de contenido generado
      queryClient.invalidateQueries({ queryKey: ['generated-content'] });
      queryClient.invalidateQueries({ queryKey: ['generated-content', data.data.id] });

      // Invalidar cache de noticias publicadas
      queryClient.invalidateQueries({ queryKey: ['published-noticias'] });
      queryClient.invalidateQueries({ queryKey: ['published-noticia', data.data.slug] });

      // Invalidar cache de cola de publicación
      queryClient.invalidateQueries({ queryKey: ['publishing-queue'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
    },
  });
}
