import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sitesApi } from '@/src/services/sites/sitesApi';
import type {
  SitesFilters,
  CreateSitePayload,
  UpdateSitePayload,
} from '@/src/types/site.types';

/**
 * 🌐 FASE 8: Query keys para React Query - Sites
 */
export const sitesKeys = {
  all: ['sites'] as const,
  lists: () => [...sitesKeys.all, 'list'] as const,
  list: (filters?: SitesFilters) => [...sitesKeys.lists(), filters] as const,
  details: () => [...sitesKeys.all, 'detail'] as const,
  detail: (id: string) => [...sitesKeys.details(), id] as const,
  stats: () => [...sitesKeys.all, 'stats'] as const,
};

/**
 * Hook para obtener lista de sites con filtros
 * @param filters - Filtros opcionales (isActive, search, page, limit)
 */
export function useSites(filters?: SitesFilters) {
  return useQuery({
    queryKey: sitesKeys.list(filters),
    queryFn: () => sitesApi.getSites(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos (los sites cambian poco)
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para obtener un site específico por ID
 * @param id - ID del site
 */
export function useSiteById(id: string) {
  return useQuery({
    queryKey: sitesKeys.detail(id),
    queryFn: () => sitesApi.getSiteById(id),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!id,
  });
}

/**
 * Hook para obtener estadísticas generales del sistema
 */
export function useSiteStats() {
  return useQuery({
    queryKey: sitesKeys.stats(),
    queryFn: () => sitesApi.getStats(),
    staleTime: 2 * 60 * 1000, // 2 minutos (las stats cambian más frecuentemente)
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para crear un nuevo site
 * Invalida todas las queries de sites y stats al completarse
 */
export function useCreateSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSitePayload) => sitesApi.createSite(data),
    onSuccess: () => {
      // Invalidar todas las listas de sites y stats
      queryClient.invalidateQueries({ queryKey: sitesKeys.all });
    },
  });
}

/**
 * Hook para actualizar un site existente
 * Invalida las queries de sites, stats y el detalle específico al completarse
 */
export function useUpdateSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSitePayload }) =>
      sitesApi.updateSite(id, data),
    onSuccess: (_, variables) => {
      // Invalidar todas las listas y stats
      queryClient.invalidateQueries({ queryKey: sitesKeys.all });
      // Invalidar el detalle específico
      queryClient.invalidateQueries({ queryKey: sitesKeys.detail(variables.id) });
    },
  });
}

/**
 * Hook para eliminar un site (soft delete)
 * Invalida todas las queries de sites y stats al completarse
 */
export function useDeleteSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sitesApi.deleteSite(id),
    onSuccess: () => {
      // Invalidar todas las queries de sites y stats
      queryClient.invalidateQueries({ queryKey: sitesKeys.all });
    },
  });
}
