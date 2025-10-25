import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { extractedContentApi } from '@/src/services/extracted-content/extractedContentApi';
import type { ExtractedContentFilters } from '@/src/types/extracted-content.types';

/**
 * Query keys para React Query
 */
export const extractedContentKeys = {
  all: ['extracted-content'] as const,
  lists: () => [...extractedContentKeys.all, 'list'] as const,
  list: (filters?: ExtractedContentFilters) =>
    [...extractedContentKeys.lists(), filters] as const,
  details: () => [...extractedContentKeys.all, 'detail'] as const,
  detail: (id: string) => [...extractedContentKeys.details(), id] as const
};

/**
 * Hook para obtener lista de contenido extraído con scroll infinito
 * Usa useInfiniteQuery para paginación automática
 * @param filters - Filtros opcionales (websiteId, status)
 */
export function useExtractedContentInfinite(filters?: Omit<ExtractedContentFilters, 'page' | 'limit'>) {
  return useInfiniteQuery({
    queryKey: extractedContentKeys.list(filters),
    queryFn: ({ pageParam = 1 }) =>
      extractedContentApi.getExtractedContent({
        ...filters,
        page: pageParam,
        limit: 20 // 20 posts por página
      }),
    getNextPageParam: (lastPage) => {
      // Si hay más páginas, retornar el número de la siguiente
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      // Si no hay más páginas, retornar undefined
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000 // 5 minutos (antes cacheTime)
  });
}

/**
 * Hook para obtener un contenido extraído específico por ID
 * @param id - ID del contenido
 */
export function useExtractedContentById(id: string) {
  return useQuery({
    queryKey: extractedContentKeys.detail(id),
    queryFn: () => extractedContentApi.getExtractedContentById(id),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!id // Solo ejecutar si hay id
  });
}
