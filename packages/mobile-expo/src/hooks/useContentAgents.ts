import { useQuery } from '@tanstack/react-query';
import { contentAgentsApi } from '@/src/services/content-agents/contentAgentsApi';
import type { AgentFilters } from '@/src/types/content-agent.types';

/**
 * Query keys para React Query
 */
export const contentAgentsKeys = {
  all: ['content-agents'] as const,
  lists: () => [...contentAgentsKeys.all, 'list'] as const,
  list: (filters?: AgentFilters) => [...contentAgentsKeys.lists(), filters] as const,
  details: () => [...contentAgentsKeys.all, 'detail'] as const,
  detail: (id: string) => [...contentAgentsKeys.details(), id] as const
};

/**
 * Hook para obtener lista de agentes con filtros
 * @param filters - Filtros opcionales (agentType, isActive)
 */
export function useContentAgents(filters?: AgentFilters) {
  return useQuery({
    queryKey: contentAgentsKeys.list(filters),
    queryFn: () => contentAgentsApi.getAgents(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos (los agentes cambian poco)
    gcTime: 10 * 60 * 1000 // 10 minutos
  });
}

/**
 * Hook para obtener un agente específico por ID
 * @param id - ID del agente
 */
export function useContentAgentById(id: string) {
  return useQuery({
    queryKey: contentAgentsKeys.detail(id),
    queryFn: () => contentAgentsApi.getAgentById(id),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!id
  });
}
