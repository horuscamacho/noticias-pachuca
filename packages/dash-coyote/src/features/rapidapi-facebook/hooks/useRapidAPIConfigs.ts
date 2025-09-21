// 🔧 RapidAPI Facebook Configurations Hook - TanStack Query Integration
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../shared/services/apiClient'
import type {
  RapidAPIConfig,
  CreateRapidAPIConfigDto,
  UpdateRapidAPIConfigDto,
  RapidAPIConfigsQuery,
  PaginatedResponse,
  UseRapidAPIConfigsReturn
} from '../types/rapidapi-facebook.types'

// 🔗 API Functions
const fetchRapidAPIConfigs = async (query: RapidAPIConfigsQuery = {}): Promise<PaginatedResponse<RapidAPIConfig>> => {
  const params = new URLSearchParams()

  if (query.page) params.append('page', query.page.toString())
  if (query.limit) params.append('limit', query.limit.toString())
  if (query.search) params.append('search', query.search)
  if (query.sortBy) params.append('sortBy', query.sortBy)
  if (query.sortOrder) params.append('sortOrder', query.sortOrder)

  const queryString = params.toString()
  const url = queryString ? `/rapidapi-facebook/config?${queryString}` : '/rapidapi-facebook/config'

  return await apiClient.get<PaginatedResponse<RapidAPIConfig>>(url)
}

const fetchActiveRapidAPIConfig = async (): Promise<RapidAPIConfig | null> => {
  try {
    return await apiClient.get<RapidAPIConfig>('/rapidapi-facebook/config/active')
  } catch (error) {
    // Si no hay configuración activa, el backend retorna un mensaje, no un error
    return null
  }
}

const createRapidAPIConfig = async (data: CreateRapidAPIConfigDto): Promise<RapidAPIConfig> => {
  return await apiClient.post<RapidAPIConfig>('/rapidapi-facebook/config', data)
}

const updateRapidAPIConfig = async (id: string, data: UpdateRapidAPIConfigDto): Promise<RapidAPIConfig> => {
  return await apiClient.put<RapidAPIConfig>(`/rapidapi-facebook/config/${id}`, data)
}

const deleteRapidAPIConfig = async (id: string): Promise<void> => {
  await apiClient.delete(`/rapidapi-facebook/config/${id}`)
}

const activateRapidAPIConfig = async (id: string): Promise<RapidAPIConfig> => {
  return await apiClient.post<RapidAPIConfig>(`/rapidapi-facebook/config/${id}/activate`)
}

const testRapidAPIConnection = async (id: string): Promise<{ success: boolean; message: string }> => {
  return await apiClient.post<{ success: boolean; message: string }>(`/rapidapi-facebook/config/${id}/test-connection`)
}

// 🎣 Main Hook
export function useRapidAPIConfigs(query: RapidAPIConfigsQuery = {}): UseRapidAPIConfigsReturn {
  const queryClient = useQueryClient()

  // 📋 Configs Query
  const {
    data: response,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['rapidapi-facebook', 'configs', query],
    queryFn: () => fetchRapidAPIConfigs(query),
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
    staleTime: 5 * 60 * 1000, // Consider stale after 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // 🔨 Create Mutation
  const createMutation = useMutation({
    mutationFn: createRapidAPIConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rapidapi-facebook', 'configs'] })
      queryClient.invalidateQueries({ queryKey: ['rapidapi-facebook', 'stats'] })
    },
    onError: (error) => {
      console.error('Error creating RapidAPI config:', error)
    }
  })

  // ✏️ Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRapidAPIConfigDto }) =>
      updateRapidAPIConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rapidapi-facebook', 'configs'] })
      queryClient.invalidateQueries({ queryKey: ['rapidapi-facebook', 'stats'] })
    },
    onError: (error) => {
      console.error('Error updating RapidAPI config:', error)
    }
  })

  // 🗑️ Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteRapidAPIConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rapidapi-facebook', 'configs'] })
      queryClient.invalidateQueries({ queryKey: ['rapidapi-facebook', 'stats'] })
    },
    onError: (error) => {
      console.error('Error deleting RapidAPI config:', error)
    }
  })

  // ⚡ Activate Mutation
  const activateMutation = useMutation({
    mutationFn: activateRapidAPIConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rapidapi-facebook', 'configs'] })
      queryClient.invalidateQueries({ queryKey: ['rapidapi-facebook', 'stats'] })
    },
    onError: (error) => {
      console.error('Error activating RapidAPI config:', error)
    }
  })

  // 🔌 Test Connection Mutation
  const testConnectionMutation = useMutation({
    mutationFn: testRapidAPIConnection,
    onError: (error) => {
      console.error('Error testing RapidAPI connection:', error)
    }
  })

  // 🎯 Wrapper functions
  const createConfig = async (data: CreateRapidAPIConfigDto): Promise<void> => {
    await createMutation.mutateAsync(data)
  }

  const updateConfig = async (id: string, data: UpdateRapidAPIConfigDto): Promise<void> => {
    await updateMutation.mutateAsync({ id, data })
  }

  const deleteConfig = async (id: string): Promise<void> => {
    await deleteMutation.mutateAsync(id)
  }

  const activateConfig = async (id: string): Promise<void> => {
    await activateMutation.mutateAsync(id)
  }

  const testConnection = async (id: string): Promise<{ success: boolean; message: string }> => {
    return await testConnectionMutation.mutateAsync(id)
  }

  // 🎯 Return hook interface
  return {
    configs: response?.data || [],
    isLoading: isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    error,
    total: response?.pagination?.total || 0,
    pagination: response?.pagination,
    createConfig,
    updateConfig,
    deleteConfig,
    activateConfig,
    testConnection,
    refetch,
  }
}

// 🔄 Hook for active configuration only (using dedicated endpoint)
export function useRapidAPIActiveConfigs() {
  const {
    data: activeConfig,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['rapidapi-facebook', 'active-config'],
    queryFn: fetchActiveRapidAPIConfig,
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
    staleTime: 5 * 60 * 1000, // Consider stale after 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  return {
    config: activeConfig,
    isLoading,
    error,
    refetch
  }
}