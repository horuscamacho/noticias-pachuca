import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../shared/services/apiClient';
import type {
  PublishNoticiaDto,
  PublishNoticiaResponse,
  UpdateNoticiaDto,
  PublishedNoticia,
} from '../types';
import { publishedNoticiasKeys } from './usePublishedNoticias';

/**
 * 🌐 API Functions para Mutaciones
 */
const publishedNoticiasMutationsApi = {
  /**
   * Publica una noticia desde contenido generado por IA
   */
  publish: async (dto: PublishNoticiaDto): Promise<PublishNoticiaResponse> => {
    return apiClient.post<PublishNoticiaResponse>('/pachuca-noticias/publish', dto);
  },

  /**
   * Actualiza una noticia existente
   */
  update: async (id: string, dto: UpdateNoticiaDto): Promise<PublishedNoticia> => {
    return apiClient.patch<PublishedNoticia>(`/pachuca-noticias/${id}`, dto);
  },

  /**
   * Despublica una noticia (cambia status a unpublished)
   */
  unpublish: async (id: string): Promise<PublishedNoticia> => {
    return apiClient.delete<PublishedNoticia>(`/pachuca-noticias/${id}/unpublish`);
  },
};

/**
 * 🚀 Hook para publicar una noticia
 *
 * @example
 * ```tsx
 * const { mutate: publishNoticia, isPending } = usePublishNoticia();
 *
 * const handlePublish = () => {
 *   publishNoticia({
 *     contentId: '507f1f77bcf86cd799439011',
 *     useOriginalImage: true,
 *     isFeatured: false,
 *     isBreaking: false,
 *   }, {
 *     onSuccess: (noticia) => {
 *       toast.success(`Noticia publicada: ${noticia.slug}`);
 *     }
 *   });
 * };
 * ```
 */
export function usePublishNoticia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: PublishNoticiaDto) => publishedNoticiasMutationsApi.publish(dto),

    onSuccess: (publishedNoticia) => {
      // Invalidar lista de noticias publicadas
      queryClient.invalidateQueries({
        queryKey: publishedNoticiasKeys.lists(),
      });

      // Invalidar lista de contenidos generados (para actualizar estado)
      queryClient.invalidateQueries({
        queryKey: ['generatedContent'],
      });

      // Agregar a cache de detalles
      queryClient.setQueryData(
        publishedNoticiasKeys.detail(publishedNoticia._id),
        publishedNoticia
      );

      queryClient.setQueryData(
        publishedNoticiasKeys.slug(publishedNoticia.slug),
        publishedNoticia
      );

      // Optimistic update en lista
      queryClient.setQueriesData(
        { queryKey: publishedNoticiasKeys.lists() },
        (old: { data: PublishedNoticia[]; pagination: unknown } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            data: [publishedNoticia, ...old.data],
          };
        }
      );
    },

    onError: (error) => {
      console.error('Error publicando noticia:', error);
    },
  });
}

/**
 * ✏️ Hook para actualizar una noticia
 *
 * @example
 * ```tsx
 * const { mutate: updateNoticia } = useUpdateNoticia();
 *
 * updateNoticia({
 *   id: '507f1f77bcf86cd799439012',
 *   dto: {
 *     title: 'Nuevo título',
 *     isFeatured: true,
 *   }
 * });
 * ```
 */
export function useUpdateNoticia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateNoticiaDto }) =>
      publishedNoticiasMutationsApi.update(id, dto),

    onSuccess: (updatedNoticia, { id }) => {
      // Invalidar listas
      queryClient.invalidateQueries({
        queryKey: publishedNoticiasKeys.lists(),
      });

      // Actualizar cache de detalles
      queryClient.setQueryData(
        publishedNoticiasKeys.detail(id),
        updatedNoticia
      );

      queryClient.setQueryData(
        publishedNoticiasKeys.slug(updatedNoticia.slug),
        updatedNoticia
      );
    },
  });
}

/**
 * 🗑️ Hook para despublicar una noticia
 *
 * @example
 * ```tsx
 * const { mutate: unpublishNoticia } = useUnpublishNoticia();
 *
 * unpublishNoticia('507f1f77bcf86cd799439012', {
 *   onSuccess: () => {
 *     toast.success('Noticia despublicada');
 *   }
 * });
 * ```
 */
export function useUnpublishNoticia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => publishedNoticiasMutationsApi.unpublish(id),

    onSuccess: (unpublishedNoticia, id) => {
      // Invalidar listas
      queryClient.invalidateQueries({
        queryKey: publishedNoticiasKeys.lists(),
      });

      // Actualizar cache con status unpublished
      queryClient.setQueryData(
        publishedNoticiasKeys.detail(id),
        unpublishedNoticia
      );

      queryClient.setQueryData(
        publishedNoticiasKeys.slug(unpublishedNoticia.slug),
        unpublishedNoticia
      );
    },
  });
}
