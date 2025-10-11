import { ApiClient } from '@/src/services/api/ApiClient';
import { ContentAgentMapper } from '@/src/utils/mappers';
import type {
  ContentAgent,
  AgentFilters,
  ContentAgentListResponse
} from '@/src/types/content-agent.types';

/**
 * Servicio de API para manejo de Agentes Editoriales
 * Usa ApiClient.getRawClient() para peticiones directas
 */
export const contentAgentsApi = {
  /**
   * Obtener lista de agentes con filtros
   * GET /generator-pro/agents
   */
  getAgents: async (filters?: AgentFilters): Promise<ContentAgent[]> => {
    try {
      const rawClient = ApiClient.getRawClient();

      // Construir query params
      const params = new URLSearchParams();
      if (filters?.agentType) params.append('agentType', filters.agentType);
      if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));

      const queryString = params.toString();
      const url = queryString
        ? `/generator-pro/agents?${queryString}`
        : '/generator-pro/agents';

      const response = await rawClient.get<ContentAgentListResponse>(url);

      const agents = response.data.agents || [];

      // Mapear a tipo App
      return agents.map((apiAgent) => ContentAgentMapper.toApp(apiAgent as Record<string, unknown>));
    } catch (error) {
      console.error('Error fetching content agents:', error);
      throw error;
    }
  },

  /**
   * Obtener un agente por ID
   */
  getAgentById: async (id: string): Promise<ContentAgent | null> => {
    try {
      const rawClient = ApiClient.getRawClient();

      const response = await rawClient.get<{ agent: Record<string, unknown> }>(
        `/generator-pro/agents/${id}`
      );

      if (!response.data.agent) {
        return null;
      }

      return ContentAgentMapper.toApp(response.data.agent);
    } catch (error) {
      console.error(`Error fetching agent ${id}:`, error);
      // Si es 404, retornar null
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number } };
        if (axiosError.response.status === 404) {
          return null;
        }
      }
      throw error;
    }
  }
};
