import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../shared/services/apiClient'

// Types
interface AIProvider {
  id: string
  name: string
  model: string
  isActive: boolean
  apiKey: string
  baseUrl: string
  maxTokens: number
  temperature: number
  costPerToken: number
  rateLimits: {
    requestsPerMinute: number
    requestsPerHour: number
  }
  lastHealthCheck?: {
    isHealthy: boolean
    responseTime: number
    checkedAt: Date
    error?: string
  }
  usageStats?: {
    totalRequests: number
    successRate: number
    averageResponseTime: number
    totalCost: number
  }
  createdAt: Date
  updatedAt: Date
}

interface CreateProviderRequest {
  name: string
  model: string
  apiKey: string
  baseUrl: string
  maxTokens: number
  temperature: number
  costPerToken: number
  rateLimits: {
    requestsPerMinute: number
    requestsPerHour: number
  }
}

interface UpdateProviderRequest extends Partial<CreateProviderRequest> {
  isActive?: boolean
}

// API functions
const providersApi = {
  getAll: async (): Promise<AIProvider[]> => {
    return apiClient.get<AIProvider[]>('/content-ai/providers')
  },

  getActive: async (): Promise<AIProvider[]> => {
    return apiClient.get<AIProvider[]>('/content-ai/providers/active/list')
  },

  getById: async (id: string): Promise<AIProvider> => {
    return apiClient.get<AIProvider>(`/content-ai/providers/${id}`)
  },

  create: async (data: CreateProviderRequest): Promise<AIProvider> => {
    return apiClient.post<AIProvider>('/content-ai/providers', data)
  },

  update: async (id: string, data: UpdateProviderRequest): Promise<AIProvider> => {
    return apiClient.put<AIProvider>(`/content-ai/providers/${id}`, data)
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/content-ai/providers/${id}`)
  },

  healthCheck: async (id: string): Promise<{
    isHealthy: boolean
    responseTime: number
    error?: string
  }> => {
    return apiClient.post<{
      isHealthy: boolean
      responseTime: number
      error?: string
    }>(`/content-ai/providers/${id}/health-check`)
  },

  healthCheckAll: async (): Promise<Record<string, {
    isHealthy: boolean
    responseTime: number
    error?: string
  }>> => {
    return apiClient.post<Record<string, {
      isHealthy: boolean
      responseTime: number
      error?: string
    }>>('/content-ai/providers/health-check/all')
  },

  getAvailableStrategies: async (): Promise<{
    name: string
    displayName: string
    models: string[]
    capabilities: {
      maxTokens: number
      supportsStreaming: boolean
      costPerInputToken: number
      costPerOutputToken: number
    }
  }[]> => {
    return apiClient.get<{
      name: string
      displayName: string
      models: string[]
      capabilities: {
        maxTokens: number
        supportsStreaming: boolean
        costPerInputToken: number
        costPerOutputToken: number
      }
    }[]>('/content-ai/providers/strategies/available')
  }
}

// Query keys
export const providersKeys = {
  all: ['providers'] as const,
  active: ['providers', 'active'] as const,
  detail: (id: string) => ['providers', id] as const,
  healthCheck: (id: string) => ['providers', id, 'health'] as const,
  strategies: ['providers', 'strategies'] as const,
}

// Hooks
export function useProviders() {
  return useQuery({
    queryKey: providersKeys.all,
    queryFn: providersApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useActiveProviders() {
  return useQuery({
    queryKey: providersKeys.active,
    queryFn: providersApi.getActive,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useProvider(id: string) {
  return useQuery({
    queryKey: providersKeys.detail(id),
    queryFn: () => providersApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateProvider() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: providersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: providersKeys.all })
      queryClient.invalidateQueries({ queryKey: providersKeys.active })
    },
  })
}

export function useUpdateProvider() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProviderRequest }) =>
      providersApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: providersKeys.all })
      queryClient.invalidateQueries({ queryKey: providersKeys.active })
      queryClient.invalidateQueries({ queryKey: providersKeys.detail(id) })
    },
  })
}

export function useDeleteProvider() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: providersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: providersKeys.all })
      queryClient.invalidateQueries({ queryKey: providersKeys.active })
    },
  })
}

export function useProviderHealthCheck() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: providersApi.healthCheck,
    onSuccess: (_, providerId) => {
      queryClient.invalidateQueries({ queryKey: providersKeys.detail(providerId) })
      queryClient.invalidateQueries({ queryKey: providersKeys.all })
    },
  })
}

export function useAllProvidersHealthCheck() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: providersApi.healthCheckAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: providersKeys.all })
      queryClient.invalidateQueries({ queryKey: providersKeys.active })
    },
  })
}

export function useAvailableStrategies() {
  return useQuery({
    queryKey: providersKeys.strategies,
    queryFn: providersApi.getAvailableStrategies,
    staleTime: 10 * 60 * 1000, // 10 minutes - strategies don't change often
  })
}

