import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../shared/services/apiClient';

interface WritingStyle {
  tone: 'formal' | 'informal' | 'humor' | 'academic' | 'conversational';
  vocabulary: 'simple' | 'intermediate' | 'advanced' | 'technical';
  length: 'short' | 'medium' | 'long' | 'variable';
  structure: 'linear' | 'narrative' | 'analytical' | 'opinion';
  audience: 'general' | 'specialized' | 'academic' | 'youth' | 'senior';
}

interface ContentAgent {
  id: string;
  name: string;
  agentType: 'reportero' | 'columnista' | 'trascendido' | 'seo-specialist';
  description: string;
  personality: string;
  specializations: string[];
  editorialLean: 'conservative' | 'progressive' | 'neutral' | 'humor' | 'critical' | 'analytical';
  writingStyle: WritingStyle;
  defaultTemplates?: string[];
  isActive: boolean;
  performanceMetrics?: {
    totalArticles: number;
    averageQuality: number;
    successRate: number;
  };
  createdAt: string;
  updatedAt: string;
}

type CreateContentAgentRequest = Omit<ContentAgent, 'id' | 'createdAt' | 'updatedAt' | 'performanceMetrics'>;

// Query keys
const contentAgentsKeys = {
  all: ['content-agents'] as const,
  list: (filters?: { agentType?: string; isActive?: boolean }) =>
    [...contentAgentsKeys.all, 'list', filters] as const,
};

// API functions
const contentAgentsApi = {
  getAgents: async (filters?: { agentType?: string; isActive?: boolean }): Promise<ContentAgent[]> => {
    const params = new URLSearchParams();
    if (filters?.agentType) params.append('agentType', filters.agentType);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));

    const queryString = params.toString();
    const url = queryString ? `/generator-pro/agents?${queryString}` : '/generator-pro/agents';

    const response = await apiClient.get<{ agents: ContentAgent[] }>(url);
    return response.agents || [];
  },

  createAgent: async (data: CreateContentAgentRequest): Promise<ContentAgent> => {
    const response = await apiClient.post<{ agent: ContentAgent }>('/generator-pro/agents', data);
    return response.agent;
  },

  updateAgent: async ({ id, data }: { id: string; data: Partial<ContentAgent> }): Promise<ContentAgent> => {
    const response = await apiClient.put<{ agent: ContentAgent }>(`/generator-pro/agents/${id}`, data);
    return response.agent;
  },

  deleteAgent: async (id: string): Promise<void> => {
    await apiClient.delete(`/generator-pro/agents/${id}`);
  },
};

// Hooks
export function useContentAgents(filters?: { agentType?: string; isActive?: boolean }) {
  return useQuery({
    queryKey: contentAgentsKeys.list(filters),
    queryFn: () => contentAgentsApi.getAgents(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCreateContentAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: contentAgentsApi.createAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentAgentsKeys.all });
    },
  });
}

export function useUpdateContentAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: contentAgentsApi.updateAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentAgentsKeys.all });
    },
  });
}

export function useDeleteContentAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: contentAgentsApi.deleteAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentAgentsKeys.all });
    },
  });
}

export type { ContentAgent, WritingStyle, CreateContentAgentRequest };
