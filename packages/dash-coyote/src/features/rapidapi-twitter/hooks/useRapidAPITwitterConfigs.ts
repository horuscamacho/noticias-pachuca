// 🔧 RapidAPI Twitter Configurations Hook - TanStack Query Integration
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../shared/services/apiClient'
import type {
  RapidAPITwitterConfig,
  CreateRapidAPITwitterConfigDto,
  UpdateRapidAPITwitterConfigDto,
  RapidAPITwitterConfigsQuery,
  TwitterPaginatedResponse,
  UseRapidAPITwitterConfigsReturn
} from '../types/rapidapi-twitter.types'

// 🔗 API Functions
const fetchRapidAPITwitterConfigs = async (query: RapidAPITwitterConfigsQuery = {}): Promise<TwitterPaginatedResponse<RapidAPITwitterConfig>> => {
  const params = new URLSearchParams()

  if (query.page) params.append('page', query.page.toString())
  if (query.limit) params.append('limit', query.limit.toString())
  if (query.search) params.append('search', query.search)
  if (query.sortBy) params.append('sortBy', query.sortBy)
  if (query.sortOrder) params.append('sortOrder', query.sortOrder)

  const queryString = params.toString()
  const url = queryString ? `/rapidapi-twitter/config?${queryString}` : '/rapidapi-twitter/config'

  return await apiClient.get<TwitterPaginatedResponse<RapidAPITwitterConfig>>(url)
}

const fetchActiveRapidAPITwitterConfig = async (): Promise<RapidAPITwitterConfig | null> => {
  try {
    return await apiClient.get<RapidAPITwitterConfig>('/rapidapi-twitter/config/active')
  } catch (error) {
    // Si no hay configuración activa, el backend retorna un mensaje, no un error
    return null
  }
}

const createRapidAPITwitterConfig = async (data: CreateRapidAPITwitterConfigDto): Promise<RapidAPITwitterConfig> => {
  return await apiClient.post<RapidAPITwitterConfig>('/rapidapi-twitter/config', data)
}

const updateRapidAPITwitterConfig = async (id: string, data: UpdateRapidAPITwitterConfigDto): Promise<RapidAPITwitterConfig> => {
  return await apiClient.put<RapidAPITwitterConfig>(`/rapidapi-twitter/config/${id}`, data)
}

const deleteRapidAPITwitterConfig = async (id: string): Promise<void> => {
  await apiClient.delete(`/rapidapi-twitter/config/${id}`)
}

const activateRapidAPITwitterConfig = async (id: string): Promise<RapidAPITwitterConfig> => {
  return await apiClient.post<RapidAPITwitterConfig>(`/rapidapi-twitter/config/${id}/activate`)
}

const testRapidAPITwitterConnection = async (id: string): Promise<{ success: boolean; message: string; responseTime?: number }> => {
  return await apiClient.post<{ success: boolean; message: string; responseTime?: number }>(`/rapidapi-twitter/config/${id}/test-connection`)
}

// 🎣 Main Hook
export function useRapidAPITwitterConfigs(query: RapidAPITwitterConfigsQuery = {}): UseRapidAPITwitterConfigsReturn {
  const queryClient = useQueryClient()

  // 📋 Configs List Query
  const {
    data: configsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['rapidapi-twitter', 'configs', query],
    queryFn: () => fetchRapidAPITwitterConfigs(query),
    staleTime: 30 * 1000, // 30 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // 🟢 Active Config Query
  const { data: activeConfig } = useQuery({
    queryKey: ['rapidapi-twitter', 'configs', 'active'],
    queryFn: fetchActiveRapidAPITwitterConfig,
    staleTime: 60 * 1000, // 1 minute
    retry: 2,
  })

  // 🔨 Mutations
  const createMutation = useMutation({
    mutationFn: createRapidAPITwitterConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rapidapi-twitter', 'configs'] })
      queryClient.invalidateQueries({ queryKey: ['rapidapi-twitter', 'stats'] })
    },
    onError: (error) => {
      console.error('Error creating Twitter config:', error)
      // TODO: Show toast error
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRapidAPITwitterConfigDto }) =>
      updateRapidAPITwitterConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rapidapi-twitter', 'configs'] })
      queryClient.invalidateQueries({ queryKey: ['rapidapi-twitter', 'stats'] })
    },
    onError: (error) => {
      console.error('Error updating Twitter config:', error)
      // TODO: Show toast error
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRapidAPITwitterConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rapidapi-twitter', 'configs'] })
      queryClient.invalidateQueries({ queryKey: ['rapidapi-twitter', 'stats'] })
    },
    onError: (error) => {
      console.error('Error deleting Twitter config:', error)
      // TODO: Show toast error
    },
  })

  const activateMutation = useMutation({
    mutationFn: activateRapidAPITwitterConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rapidapi-twitter', 'configs'] })
      queryClient.invalidateQueries({ queryKey: ['rapidapi-twitter', 'stats'] })
    },
    onError: (error) => {
      console.error('Error activating Twitter config:', error)
      // TODO: Show toast error
    },
  })

  const testConnectionMutation = useMutation({
    mutationFn: testRapidAPITwitterConnection,
    onError: (error) => {
      console.error('Error testing Twitter connection:', error)
      // TODO: Show toast error
    },
  })

  // 🎯 Wrapper functions
  const createConfig = async (data: CreateRapidAPITwitterConfigDto) => {
    return createMutation.mutateAsync(data)
  }

  const updateConfig = async (id: string, data: UpdateRapidAPITwitterConfigDto) => {
    return updateMutation.mutateAsync({ id, data })
  }

  const deleteConfig = async (id: string) => {
    return deleteMutation.mutateAsync(id)
  }

  const activateConfig = async (id: string) => {
    return activateMutation.mutateAsync(id)
  }

  const testConnection = async (id: string) => {
    return testConnectionMutation.mutateAsync(id)
  }

  // 🎯 Return hook interface
  return {
    configs: configsResponse?.data || [],
    isLoading,
    error,
    total: configsResponse?.pagination?.total || 0,
    pagination: configsResponse?.pagination,
    activeConfig,
    createConfig,
    updateConfig,
    deleteConfig,
    activateConfig,
    testConnection,
    refetch,
  }
}

// 🔄 Optimistic Hook for Better UX
export function useRapidAPITwitterConfigsOptimistic(query: RapidAPITwitterConfigsQuery = {}): UseRapidAPITwitterConfigsReturn {
  const baseHook = useRapidAPITwitterConfigs(query)
  const queryClient = useQueryClient()

  // Override mutations with optimistic updates
  const createConfigOptimistic = async (data: CreateRapidAPITwitterConfigDto) => {
    // Optimistically add the new config
    const tempId = `temp-${Date.now()}`
    const optimisticConfig: RapidAPITwitterConfig = {
      id: tempId,
      ...data,
      isActive: data.isActive ?? false,
      currentUsage: {
        requestsToday: 0,
        requestsThisMonth: 0,
        lastResetDate: new Date().toISOString(),
        remainingDailyRequests: data.quotaLimits.requestsPerDay,
        remainingMonthlyRequests: data.quotaLimits.requestsPerMonth,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Optimistic update
    queryClient.setQueryData(
      ['rapidapi-twitter', 'configs', query],
      (old: TwitterPaginatedResponse<RapidAPITwitterConfig> | undefined) => {
        if (!old) return old
        return {
          ...old,
          data: [...old.data, optimisticConfig]
        }
      }
    )

    try {
      const result = await baseHook.createConfig(data)
      return result
    } catch (error) {
      // Revert optimistic update on error
      baseHook.refetch()
      throw error
    }
  }

  return {
    ...baseHook,
    createConfig: createConfigOptimistic,
  }
}