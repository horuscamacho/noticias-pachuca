// 📊 RapidAPI Facebook Statistics Hook - TanStack Query Integration
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../shared/services/apiClient'
import type {
  RapidAPIStats,
  RapidAPIQuota,
  UseRapidAPIStatsReturn
} from '../types/rapidapi-facebook.types'

// 🔗 API Functions
const fetchRapidAPIStats = async (): Promise<RapidAPIStats> => {
  try {
    const configsResponse = await apiClient.get<{ data: Array<{ id: string; isActive: boolean; name: string; currentUsage: { requestsToday: number } }> }>('/rapidapi-facebook/config')

    const configs = configsResponse.data || []
    const activeConfigs = configs.filter(config => config.isActive).length
    const totalRequests = configs.reduce((sum, config) => sum + (config.currentUsage?.requestsToday || 0), 0)

    // Find top performing config by usage
    const topConfig = configs.reduce((top, current) => {
      const currentUsage = current.currentUsage?.requestsToday || 0
      const topUsage = top?.currentUsage?.requestsToday || 0
      return currentUsage > topUsage ? current : top
    }, configs[0])

    return {
      activeConfigs,
      totalRequests,
      requestsToday: totalRequests,
      pagesMonitored: 0, // NO HAY PÁGINAS EN BD
      quotaUsagePercentage: 0, // Calculate from quotas
      topPerformingConfig: topConfig?.name || 'N/A'
    }
  } catch (error) {
    console.error('Error fetching RapidAPI stats:', error)
    return {
      activeConfigs: 0,
      totalRequests: 0,
      requestsToday: 0,
      pagesMonitored: 0,
      quotaUsagePercentage: 0,
      topPerformingConfig: 'N/A'
    }
  }
}

const fetchRapidAPIQuotas = async (): Promise<RapidAPIQuota[]> => {
  try {
    // Get all active configs and their quota status
    const configsResponse = await apiClient.get<{ data: Array<{ id: string; name: string; isActive: boolean }> }>('/rapidapi-facebook/config')
    const configs = configsResponse.data || []
    const activeConfigs = configs.filter(config => config.isActive)

    // Get quota status for each active config
    const quotaPromises = activeConfigs.map(async (config) => {
      const configId = config._id || config.id
      if (!configId) {
        console.warn('Config without valid ID found:', config)
        return {
          configId: 'unknown',
          configName: config.name || 'Unknown Config',
          current: 0,
          limit: 1000,
          percentage: 0,
          resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: 'normal' as const,
          timeFrame: 'day' as const
        }
      }

      try {
        const quotaResponse = await apiClient.get<{
          configName: string
          requestsUsed: number
          requestsRemaining: number
          limit: number
          resetTime: string
        }>(`/rapidapi-facebook/config/${configId}/quota-status`)

        const used = quotaResponse.requestsUsed || 0
        const limit = quotaResponse.limit || 1000
        const percentage = limit > 0 ? (used / limit) * 100 : 0

        let status: 'normal' | 'warning' | 'critical' = 'normal'
        if (percentage >= 90) status = 'critical'
        else if (percentage >= 75) status = 'warning'

        return {
          configId: configId,
          configName: config.name,
          current: used,
          limit,
          percentage,
          resetTime: quotaResponse.resetTime || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status,
          timeFrame: 'day' as const
        }
      } catch (error) {
        // Return default quota if individual config fails
        return {
          configId: configId || 'unknown',
          configName: config.name,
          current: 0,
          limit: 1000,
          percentage: 0,
          resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: 'normal' as const,
          timeFrame: 'day' as const
        }
      }
    })

    return await Promise.all(quotaPromises)
  } catch (error) {
    console.error('Error fetching RapidAPI quotas:', error)
    return []
  }
}

// 🎣 Main Hook
export function useRapidAPIStats(): UseRapidAPIStatsReturn {
  // 📊 Statistics Query
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['rapidapi-facebook', 'stats'],
    queryFn: fetchRapidAPIStats,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider stale after 2 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // 🔢 Quotas Query
  const {
    data: quotas = [],
    isLoading: isLoadingQuotas,
    error: quotasError,
    refetch: refetchQuotas
  } = useQuery({
    queryKey: ['rapidapi-facebook', 'quotas'],
    queryFn: fetchRapidAPIQuotas,
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
    staleTime: 60 * 1000, // Consider stale after 1 minute
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // 🔄 Combined refetch
  const refetch = () => {
    refetchStats()
    refetchQuotas()
  }

  // 🎯 Return hook interface
  return {
    stats,
    quotas,
    isLoading: isLoadingStats || isLoadingQuotas,
    error: statsError || quotasError,
    refetch,
  }
}

// 🔄 Real-time Hook with Socket.IO
export function useRapidAPIStatsRealtime(): UseRapidAPIStatsReturn {
  const baseHook = useRapidAPIStats()

  // TODO: Implement Socket.IO integration here
  // useEffect(() => {
  //   const socket = getSocket()
  //
  //   socket.on('rapidapi:stats_updated', (newStats: RapidAPIStats) => {
  //     queryClient.setQueryData(['rapidapi-facebook', 'stats'], newStats)
  //   })
  //
  //   socket.on('rapidapi:quota_updated', (newQuota: RapidAPIQuota) => {
  //     queryClient.setQueryData(['rapidapi-facebook', 'quotas'], (old: RapidAPIQuota[] = []) => {
  //       return old.map(quota =>
  //         quota.configId === newQuota.configId ? newQuota : quota
  //       )
  //     })
  //   })
  //
  //   return () => {
  //     socket.off('rapidapi:stats_updated')
  //     socket.off('rapidapi:quota_updated')
  //   }
  // }, [queryClient])

  return baseHook
}