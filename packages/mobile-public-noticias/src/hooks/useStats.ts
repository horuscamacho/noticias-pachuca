import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '@/src/services/api/ApiClient';

/**
 * < FASE 8.5: Hooks de Stats
 * Hooks para obtener estadísticas generales del sistema
 */

// ========================================
// TYPES
// ========================================

export interface StatsAgents {
  total: number;
  active: number;
  inactive: number;
}

export interface StatsSites {
  total: number;
  active: number;
  inactive: number;
  published: number;
}

export interface StatsNoticias {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}

export interface StatsOutlets {
  total: number;
  active: number;
  inactive: number;
}

// ========================================
// QUERY KEYS
// ========================================

export const statsKeys = {
  all: ['stats'] as const,
  agents: () => [...statsKeys.all, 'agents'] as const,
  sites: () => [...statsKeys.all, 'sites'] as const,
  noticias: () => [...statsKeys.all, 'noticias'] as const,
  outlets: () => [...statsKeys.all, 'outlets'] as const
};

// ========================================
// HOOKS
// ========================================

/**
 * Hook para obtener estadísticas de Agentes
 * GET /pachuca-noticias/stats (parte de agentes)
 */
export function useStatsAgents() {
  return useQuery({
    queryKey: statsKeys.agents(),
    queryFn: async (): Promise<StatsAgents> => {
      const rawClient = ApiClient.getRawClient();
      const response = await rawClient.get<{ totalAgents: number; activeAgents: number }>('/pachuca-noticias/stats');

      return {
        total: response.data.totalAgents || 0,
        active: response.data.activeAgents || 0,
        inactive: (response.data.totalAgents || 0) - (response.data.activeAgents || 0)
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000 // 5 minutos
  });
}

/**
 * Hook para obtener estadísticas de Sites
 * GET /pachuca-noticias/stats (parte de sites)
 */
export function useStatsSites() {
  return useQuery({
    queryKey: statsKeys.sites(),
    queryFn: async (): Promise<StatsSites> => {
      const rawClient = ApiClient.getRawClient();
      const response = await rawClient.get<{ totalSites: number; activeSites: number }>('/pachuca-noticias/stats');

      return {
        total: response.data.totalSites || 0,
        active: response.data.activeSites || 0,
        inactive: (response.data.totalSites || 0) - (response.data.activeSites || 0),
        published: response.data.activeSites || 0 // Sitios activos = sitios con publicación
      };
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000
  });
}

/**
 * Hook para obtener estadísticas de Noticias
 * GET /pachuca-noticias/stats (parte de noticias)
 */
export function useStatsNoticias() {
  return useQuery({
    queryKey: statsKeys.noticias(),
    queryFn: async (): Promise<StatsNoticias> => {
      const rawClient = ApiClient.getRawClient();
      const response = await rawClient.get<{ totalNoticias: number; noticiasToday: number }>('/pachuca-noticias/stats');

      return {
        total: response.data.totalNoticias || 0,
        today: response.data.noticiasToday || 0,
        thisWeek: 0, // TODO: Agregar endpoint para thisWeek cuando esté disponible
        thisMonth: 0 // TODO: Agregar endpoint para thisMonth cuando esté disponible
      };
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000
  });
}

/**
 * Hook para obtener estadísticas de Outlets (NewsWebsiteConfig)
 * GET /pachuca-noticias/stats (parte de outlets)
 */
export function useStatsOutlets() {
  return useQuery({
    queryKey: statsKeys.outlets(),
    queryFn: async (): Promise<StatsOutlets> => {
      const rawClient = ApiClient.getRawClient();
      const response = await rawClient.get<{ totalOutlets: number; activeOutlets: number }>('/pachuca-noticias/stats');

      return {
        total: response.data.totalOutlets || 0,
        active: response.data.activeOutlets || 0,
        inactive: (response.data.totalOutlets || 0) - (response.data.activeOutlets || 0)
      };
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000
  });
}
