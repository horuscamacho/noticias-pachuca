import { ApiClient } from '@/src/services/api/ApiClient';
import { ContentAgentMapper } from '@/src/utils/mappers';
import type {
  ContentAgent,
  AgentFilters,
  ContentAgentListResponse,
  CreateContentAgentRequest,
  UpdateContentAgentRequest,
  ContentAgentResponse
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
  },

  /**
   * Crear un nuevo agente
   * POST /generator-pro/agents
   */
  createAgent: async (data: CreateContentAgentRequest): Promise<ContentAgent> => {
    try {
      const rawClient = ApiClient.getRawClient();

      const response = await rawClient.post<ContentAgentResponse>(
        '/generator-pro/agents',
        data
      );

      return ContentAgentMapper.toApp(response.data.agent as unknown as Record<string, unknown>);
    } catch (error) {
      console.error('Error creating content agent:', error);
      throw error;
    }
  },

  /**
   * Actualizar un agente existente
   * PUT /generator-pro/agents/:id
   */
  updateAgent: async (id: string, data: UpdateContentAgentRequest): Promise<ContentAgent> => {
    try {
      const rawClient = ApiClient.getRawClient();

      const response = await rawClient.put<ContentAgentResponse>(
        `/generator-pro/agents/${id}`,
        data
      );

      return ContentAgentMapper.toApp(response.data.agent as unknown as Record<string, unknown>);
    } catch (error) {
      console.error(`Error updating agent ${id}:`, error);
      throw error;
    }
  },

  /**
   * Eliminar un agente
   * DELETE /generator-pro/agents/:id
   */
  deleteAgent: async (id: string): Promise<void> => {
    try {
      const rawClient = ApiClient.getRawClient();

      await rawClient.delete(`/generator-pro/agents/${id}`);
    } catch (error) {
      console.error(`Error deleting agent ${id}:`, error);
      throw error;
    }
  }
};
