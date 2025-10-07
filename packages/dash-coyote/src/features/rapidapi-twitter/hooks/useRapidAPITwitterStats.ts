// 📊 RapidAPI Twitter Statistics Hook - TanStack Query Integration
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../shared/services/apiClient'
import type {
  RapidAPITwitterStats,
  RapidAPITwitterQuota,
  UseRapidAPITwitterStatsReturn
} from '../types/rapidapi-twitter.types'

// 🔗 API Functions
const fetchRapidAPITwitterStats = async (): Promise<RapidAPITwitterStats> => {
  try {
    const configsResponse = await apiClient.get<{ data: Array<{ id: string; isActive: boolean; name: string; currentUsage: { requestsToday: number } }> }>('/rapidapi-twitter/config')

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
      usersMonitored: 0, // Will be populated from users endpoint
      quotaUsagePercentage: 0, // Calculate from quotas
      topPerformingConfig: topConfig?.name || 'N/A'
    }
  } catch (error) {
    console.error('Error fetching RapidAPI Twitter stats:', error)
    return {
      activeConfigs: 0,
      totalRequests: 0,
      requestsToday: 0,
      usersMonitored: 0,
      quotaUsagePercentage: 0,
      topPerformingConfig: 'N/A'
    }
  }
}

const fetchRapidAPITwitterQuotas = async (): Promise<RapidAPITwitterQuota[]> => {
  try {
    // Get all active configs and their quota status
    const configsResponse = await apiClient.get<{ data: Array<{ id: string; name: string; isActive: boolean }> }>('/rapidapi-twitter/config')
    const configs = configsResponse.data || []
    const activeConfigs = configs.filter(config => config.isActive)

    // Get quota status for each active config
    const quotaPromises = activeConfigs.map(async (config) => {
      const configId = config._id || config.id
      if (!configId) {
        console.warn('Twitter config without valid ID found:', config)
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
        }>(`/rapidapi-twitter/config/${configId}/quota-status`)

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
    console.error('Error fetching RapidAPI Twitter quotas:', error)
    return []
  }
}

// 🎣 Main Hook
export function useRapidAPITwitterStats(): UseRapidAPITwitterStatsReturn {
  // 📊 Statistics Query
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['rapidapi-twitter', 'stats'],
    queryFn: fetchRapidAPITwitterStats,
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
    queryKey: ['rapidapi-twitter', 'quotas'],
    queryFn: fetchRapidAPITwitterQuotas,
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
export function useRapidAPITwitterStatsRealtime(): UseRapidAPITwitterStatsReturn {
  const baseHook = useRapidAPITwitterStats()

  // TODO: Implement Socket.IO integration here
  // useEffect(() => {
  //   const socket = getSocket()
  //
  //   socket.on('rapidapi-twitter:stats_updated', (newStats: RapidAPITwitterStats) => {
  //     queryClient.setQueryData(['rapidapi-twitter', 'stats'], newStats)
  //   })
  //
  //   socket.on('rapidapi-twitter:quota_updated', (newQuota: RapidAPITwitterQuota) => {
  //     queryClient.setQueryData(['rapidapi-twitter', 'quotas'], (old: RapidAPITwitterQuota[] = []) => {
  //       return old.map(quota =>
  //         quota.configId === newQuota.configId ? newQuota : quota
  //       )
  //     })
  //   })
  //
  //   return () => {
  //     socket.off('rapidapi-twitter:stats_updated')
  //     socket.off('rapidapi-twitter:quota_updated')
  //   }
  // }, [queryClient])

  return baseHook
}