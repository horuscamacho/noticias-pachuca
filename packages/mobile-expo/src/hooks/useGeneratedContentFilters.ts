import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { generatedContentApi } from '@/src/services/generated-content/generatedContentApi'
import type { App as FilterApp } from '@/src/types/generated-content-filters.types'

/**
 * 🎯 React Query hooks para contenido generado con filtros
 * Patrón: useInfiniteQuery para paginación infinita + Query Keys
 */

// ============================================================
// QUERY KEYS (Siguiendo convenciones de React Query)
// ============================================================

export const generatedContentKeys = {
  all: ['generated-content'] as const,
  lists: () => [...generatedContentKeys.all, 'list'] as const,
  list: (filters: FilterApp.GeneratedContentFilters) =>
    [...generatedContentKeys.lists(), filters] as const,
  details: () => [...generatedContentKeys.all, 'detail'] as const,
  detail: (id: string) => [...generatedContentKeys.details(), id] as const,
  agents: () => [...generatedContentKeys.all, 'agents'] as const,
  templates: () => [...generatedContentKeys.all, 'templates'] as const,
  providers: () => [...generatedContentKeys.all, 'providers'] as const,
  categories: () => [...generatedContentKeys.all, 'categories'] as const,
  tags: () => [...generatedContentKeys.all, 'tags'] as const,
}

// ============================================================
// QUERIES (Lectura de datos)
// ============================================================

/**
 * Hook principal con paginación infinita y filtros
 * Usa useInfiniteQuery para scroll infinito
 */
export function useGeneratedContent(filters: FilterApp.GeneratedContentFilters) {
  return useInfiniteQuery({
    queryKey: generatedContentKeys.list(filters),
    queryFn: ({ pageParam = 1 }) =>
      generatedContentApi.getGeneratedContent({
        ...filters,
        page: pageParam,
        limit: filters.limit || 20,
      }),
    getNextPageParam: (lastPage) => {
      // Si hay más páginas, retornar siguiente número de página
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1
      }
      return undefined // No hay más páginas
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000, // 2 minutos - data se considera fresco por este tiempo
    gcTime: 10 * 60 * 1000, // 10 minutos - mantener en cache
  })
}

/**
 * Hook para obtener un contenido específico por ID
 */
export function useGeneratedContentDetail(id: string, enabled = true) {
  return useQuery({
    queryKey: generatedContentKeys.detail(id),
    queryFn: () => generatedContentApi.getGeneratedContentById(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

/**
 * Hook para obtener agentes disponibles (para filtros)
 */
export function useAgents() {
  return useQuery({
    queryKey: generatedContentKeys.agents(),
    queryFn: generatedContentApi.getAgents,
    staleTime: 30 * 60 * 1000, // 30 minutos - rara vez cambian
  })
}

/**
 * Hook para obtener templates disponibles (para filtros)
 */
export function useTemplates() {
  return useQuery({
    queryKey: generatedContentKeys.templates(),
    queryFn: generatedContentApi.getTemplates,
    staleTime: 30 * 60 * 1000, // 30 minutos
  })
}

/**
 * Hook para obtener proveedores disponibles (para filtros)
 */
export function useProviders() {
  return useQuery({
    queryKey: generatedContentKeys.providers(),
    queryFn: generatedContentApi.getProviders,
    staleTime: 30 * 60 * 1000, // 30 minutos
  })
}

/**
 * Hook para obtener categorías únicas (para filtros)
 */
export function useCategories() {
  return useQuery({
    queryKey: generatedContentKeys.categories(),
    queryFn: generatedContentApi.getCategories,
    staleTime: 10 * 60 * 1000, // 10 minutos
  })
}

/**
 * Hook para obtener tags únicos (para filtros)
 */
export function useTags() {
  return useQuery({
    queryKey: generatedContentKeys.tags(),
    queryFn: generatedContentApi.getTags,
    staleTime: 10 * 60 * 1000, // 10 minutos
  })
}

// ============================================================
// MUTATIONS (Escritura de datos)
// ============================================================

/**
 * Hook para actualizar estado de contenido
 */
export function useUpdateContentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string
      status: FilterApp.GenerationStatus
    }) => generatedContentApi.updateContentStatus(id, status),
    onSuccess: (data, variables) => {
      // Invalidar listas para refetch
      queryClient.invalidateQueries({ queryKey: generatedContentKeys.lists() })
      // Actualizar detalle específico
      queryClient.setQueryData(generatedContentKeys.detail(variables.id), data)
    },
  })
}

/**
 * Hook para eliminar contenido
 */
export function useDeleteContent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => generatedContentApi.deleteContent(id),
    onSuccess: (_, deletedId) => {
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: generatedContentKeys.lists() })
      // Remover del cache de detalles
      queryClient.removeQueries({ queryKey: generatedContentKeys.detail(deletedId) })
    },
  })
}

/**
 * Hook para regenerar contenido
 */
export function useRegenerateContent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      options,
    }: {
      id: string
      options?: {
        agentId?: string
        templateId?: string
        providerId?: string
      }
    }) => generatedContentApi.regenerateContent(id, options),
    onSuccess: (data, variables) => {
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: generatedContentKeys.lists() })
      // Actualizar detalle
      queryClient.setQueryData(generatedContentKeys.detail(variables.id), data)
    },
  })
}

// ============================================================
// HELPERS (Utilidades para componentes)
// ============================================================

/**
 * Helper para obtener todos los items de todas las páginas
 */
export function getAllGeneratedContent(
  data: ReturnType<typeof useGeneratedContent>['data']
): FilterApp.GeneratedContent[] {
  if (!data) return []
  return data.pages.flatMap((page) => page.data)
}

/**
 * Helper para obtener el total de items
 */
export function getTotalItems(data: ReturnType<typeof useGeneratedContent>['data']): number {
  return data?.pages[0]?.total ?? 0
}

/**
 * Helper para invalidar todas las queries de contenido generado
 */
export function useInvalidateGeneratedContent() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: generatedContentKeys.all })
  }
}
