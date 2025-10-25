import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentAgentsApi } from '@/src/services/content-agents/contentAgentsApi';
import type { AgentFilters, CreateContentAgentRequest, UpdateContentAgentRequest } from '@/src/types/content-agent.types';

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

/**
 * Hook para crear un nuevo agente
 * Invalida todas las queries de agentes al completarse
 */
export function useCreateContentAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateContentAgentRequest) => contentAgentsApi.createAgent(data),
    onSuccess: () => {
      // Invalidar todas las listas de agentes
      queryClient.invalidateQueries({ queryKey: contentAgentsKeys.all });
    }
  });
}

/**
 * Hook para actualizar un agente existente
 * Invalida las queries de agentes y el detalle específico al completarse
 */
export function useUpdateContentAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContentAgentRequest }) =>
      contentAgentsApi.updateAgent(id, data),
    onSuccess: (_, variables) => {
      // Invalidar todas las listas
      queryClient.invalidateQueries({ queryKey: contentAgentsKeys.all });
      // Invalidar el detalle específico
      queryClient.invalidateQueries({ queryKey: contentAgentsKeys.detail(variables.id) });
    }
  });
}

/**
 * Hook para eliminar un agente
 * Invalida todas las queries de agentes al completarse
 */
export function useDeleteContentAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contentAgentsApi.deleteAgent(id),
    onSuccess: () => {
      // Invalidar todas las queries de agentes
      queryClient.invalidateQueries({ queryKey: contentAgentsKeys.all });
    }
  });
}
