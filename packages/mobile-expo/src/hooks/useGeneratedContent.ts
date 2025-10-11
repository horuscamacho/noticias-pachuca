import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generatedContentApi } from '@/src/services/generated-content/generatedContentApi';
import type { GenerateContentRequest } from '@/src/types/generated-content.types';
import { extractedContentKeys } from './useExtractedContent';

/**
 * Query keys para React Query
 */
export const generatedContentKeys = {
  all: ['generated-content'] as const,
  lists: () => [...generatedContentKeys.all, 'list'] as const,
  listByPost: (postId: string) => [...generatedContentKeys.lists(), 'post', postId] as const,
  details: () => [...generatedContentKeys.all, 'detail'] as const,
  detail: (id: string) => [...generatedContentKeys.details(), id] as const
};

/**
 * Hook para obtener contenidos generados de un post específico
 * @param extractedNoticiaId - ID del post extraído
 */
export function useGeneratedContentByPostId(extractedNoticiaId: string) {
  return useQuery({
    queryKey: generatedContentKeys.listByPost(extractedNoticiaId),
    queryFn: () => generatedContentApi.getGeneratedContentByPostId(extractedNoticiaId),
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 3 * 60 * 1000, // 3 minutos
    enabled: !!extractedNoticiaId
  });
}

/**
 * Hook para obtener un contenido generado específico por ID
 * @param id - ID del contenido generado
 */
export function useGeneratedContentById(id: string) {
  return useQuery({
    queryKey: generatedContentKeys.detail(id),
    queryFn: () => generatedContentApi.getGeneratedContentById(id),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!id
  });
}

/**
 * Hook para generar contenido con un agente
 * Mutation que invalida queries relevantes al completar
 */
export function useGenerateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: GenerateContentRequest) =>
      generatedContentApi.generateContent(request),
    onSuccess: (data, variables) => {
      // Invalidar lista de contenidos generados del post
      queryClient.invalidateQueries({
        queryKey: generatedContentKeys.listByPost(variables.extractedContentId)
      });

      // Invalidar lista de posts extraídos (para actualizar contador)
      queryClient.invalidateQueries({
        queryKey: extractedContentKeys.lists()
      });

      // Invalidar detalle del post
      queryClient.invalidateQueries({
        queryKey: extractedContentKeys.detail(variables.extractedContentId)
      });
    }
  });
}
