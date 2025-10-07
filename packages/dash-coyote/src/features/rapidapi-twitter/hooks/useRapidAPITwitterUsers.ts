// 🐦 RapidAPI Twitter Users Hook - TanStack Query Integration
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../shared/services/apiClient'
import type {
  RapidAPITwitterUser,
  CreateRapidAPITwitterUserDto,
  UpdateRapidAPITwitterUserDto,
  RapidAPITwitterUsersQuery,
  TwitterPaginatedResponse,
  UseRapidAPITwitterUsersReturn
} from '../types/rapidapi-twitter.types'

// 🔗 API Functions
const fetchRapidAPITwitterUsers = async (query: RapidAPITwitterUsersQuery = {}): Promise<TwitterPaginatedResponse<RapidAPITwitterUser>> => {
  const params = new URLSearchParams()

  if (query.page) params.append('page', query.page.toString())
  if (query.limit) params.append('limit', query.limit.toString())
  if (query.configId) params.append('configId', query.configId)
  if (query.status) params.append('status', query.status)
  if (query.search) params.append('search', query.search)
  if (query.sortBy) params.append('sortBy', query.sortBy)
  if (query.sortOrder) params.append('sortOrder', query.sortOrder)

  const queryString = params.toString()
  const url = queryString ? `/rapidapi-twitter/users?${queryString}` : '/rapidapi-twitter/users'

  return await apiClient.get<TwitterPaginatedResponse<RapidAPITwitterUser>>(url)
}

const fetchRapidAPITwitterUserById = async (id: string): Promise<RapidAPITwitterUser> => {
  return await apiClient.get<RapidAPITwitterUser>(`/rapidapi-twitter/users/${id}`)
}

const createRapidAPITwitterUser = async (data: CreateRapidAPITwitterUserDto): Promise<RapidAPITwitterUser> => {
  return await apiClient.post<RapidAPITwitterUser>('/rapidapi-twitter/users', data)
}

const updateRapidAPITwitterUser = async (id: string, data: UpdateRapidAPITwitterUserDto): Promise<RapidAPITwitterUser> => {
  return await apiClient.put<RapidAPITwitterUser>(`/rapidapi-twitter/users/${id}`, data)
}

const deleteRapidAPITwitterUser = async (id: string): Promise<void> => {
  await apiClient.delete(`/rapidapi-twitter/users/${id}`)
}

const updateExtractionConfig = async (id: string, config: UpdateRapidAPITwitterUserDto['extractionConfig']): Promise<RapidAPITwitterUser> => {
  return await apiClient.put<RapidAPITwitterUser>(`/rapidapi-twitter/users/${id}/extraction-config`, { extractionConfig: config })
}

const triggerUserExtraction = async (id: string, startDate?: Date, endDate?: Date): Promise<void> => {
  const body: Record<string, string> = {}
  if (startDate) body.startDate = startDate.toISOString()
  if (endDate) body.endDate = endDate.toISOString()

  await apiClient.post(`/rapidapi-twitter/users/${id}/extract`, body)
}

const getUserStats = async (id: string): Promise<{
  user: RapidAPITwitterUser
  extractionHistory: {
    totalExtractions: number
    successfulExtractions: number
    failedExtractions: number
    lastExtraction?: Date
    avgTweetsPerExtraction: number
  }
  quotaUsage: {
    configName: string
    requestsUsed: number
    requestsRemaining: number
  }
}> => {
  return await apiClient.get(`/rapidapi-twitter/users/${id}/stats`)
}

// 🎣 Main Hook
export function useRapidAPITwitterUsers(query: RapidAPITwitterUsersQuery = {}): UseRapidAPITwitterUsersReturn {
  const queryClient = useQueryClient()

  // 📋 Users List Query
  const {
    data: usersResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['rapidapi-twitter', 'users', query],
    queryFn: () => fetchRapidAPITwitterUsers(query),
    staleTime: 30 * 1000, // 30 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // 🔨 Mutations
  const createMutation = useMutation({
    mutationFn: createRapidAPITwitterUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rapidapi-twitter', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['rapidapi-twitter', 'stats'] })
    },
    onError: (error) => {
      console.error('Error creating Twitter user:', error)
      // TODO: Show toast error
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRapidAPITwitterUserDto }) =>
      updateRapidAPITwitterUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rapidapi-twitter', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['rapidapi-twitter', 'stats'] })
    },
    onError: (error) => {
      console.error('Error updating Twitter user:', error)
      // TODO: Show toast error
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRapidAPITwitterUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rapidapi-twitter', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['rapidapi-twitter', 'stats'] })
    },
    onError: (error) => {
      console.error('Error deleting Twitter user:', error)
      // TODO: Show toast error
    },
  })

  const updateExtractionConfigMutation = useMutation({
    mutationFn: ({ id, config }: { id: string; config: UpdateRapidAPITwitterUserDto['extractionConfig'] }) =>
      updateExtractionConfig(id, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rapidapi-twitter', 'users'] })
    },
    onError: (error) => {
      console.error('Error updating Twitter extraction config:', error)
      // TODO: Show toast error
    },
  })

  const triggerExtractionMutation = useMutation({
    mutationFn: ({ id, startDate, endDate }: { id: string; startDate?: Date; endDate?: Date }) =>
      triggerUserExtraction(id, startDate, endDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rapidapi-twitter', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['rapidapi-twitter', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['rapidapi-twitter', 'tweets'] })
    },
    onError: (error) => {
      console.error('Error triggering Twitter extraction:', error)
      // TODO: Show toast error
    },
  })

  // 🎯 Wrapper functions
  const createUser = async (data: CreateRapidAPITwitterUserDto) => {
    return createMutation.mutateAsync(data)
  }

  const updateUser = async (id: string, data: UpdateRapidAPITwitterUserDto) => {
    return updateMutation.mutateAsync({ id, data })
  }

  const deleteUser = async (id: string) => {
    return deleteMutation.mutateAsync(id)
  }

  const updateUserExtractionConfig = async (id: string, config: UpdateRapidAPITwitterUserDto['extractionConfig']) => {
    return updateExtractionConfigMutation.mutateAsync({ id, config })
  }

  const triggerExtraction = async (id: string, startDate?: Date, endDate?: Date) => {
    return triggerExtractionMutation.mutateAsync({ id, startDate, endDate })
  }

  // 🎯 Return hook interface
  return {
    users: usersResponse?.data || [],
    isLoading,
    error,
    total: usersResponse?.pagination?.total || 0,
    pagination: usersResponse?.pagination,
    createUser,
    updateUser,
    deleteUser,
    updateExtractionConfig: updateUserExtractionConfig,
    triggerExtraction,
    refetch,
  }
}

// 🎯 Individual User Hook
export function useRapidAPITwitterUser(id: string) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['rapidapi-twitter', 'users', id],
    queryFn: () => fetchRapidAPITwitterUserById(id),
    enabled: !!id,
    staleTime: 30 * 1000,
    retry: 3,
  })
}

// 📊 User Stats Hook
export function useRapidAPITwitterUserStats(id: string) {
  return useQuery({
    queryKey: ['rapidapi-twitter', 'users', id, 'stats'],
    queryFn: () => getUserStats(id),
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
    retry: 2,
  })
}

// 🔄 Optimistic Hook for Better UX
export function useRapidAPITwitterUsersOptimistic(query: RapidAPITwitterUsersQuery = {}): UseRapidAPITwitterUsersReturn {
  const baseHook = useRapidAPITwitterUsers(query)
  const queryClient = useQueryClient()

  // Override mutations with optimistic updates
  const createUserOptimistic = async (data: CreateRapidAPITwitterUserDto) => {
    // Optimistically add the new user
    const tempId = `temp-${Date.now()}`
    const optimisticUser: RapidAPITwitterUser = {
      id: tempId,
      userId: `temp-user-id-${Date.now()}`,
      username: data.username,
      displayName: data.username,
      userUrl: `https://twitter.com/${data.username}`,
      configId: data.configId || '',
      configName: 'Default Config',
      status: 'pending',
      userDetails: {},
      extractionConfig: data.extractionConfig || {
        isActive: false,
        frequency: 'manual',
        maxPostsPerExtraction: 20,
        extractionFilters: {
          includeReplies: false,
          includeRetweets: true,
        },
      },
      stats: {
        totalPostsExtracted: 0,
        extractionErrors: 0,
        avgTweetsPerDay: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Optimistic update
    queryClient.setQueryData(
      ['rapidapi-twitter', 'users', query],
      (old: TwitterPaginatedResponse<RapidAPITwitterUser> | undefined) => {
        if (!old) return old
        return {
          ...old,
          data: [...old.data, optimisticUser]
        }
      }
    )

    try {
      const result = await baseHook.createUser(data)
      return result
    } catch (error) {
      // Revert optimistic update on error
      baseHook.refetch()
      throw error
    }
  }

  return {
    ...baseHook,
    createUser: createUserOptimistic,
  }
}