// 📊 Facebook Statistics Hook - TanStack Query Integration
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../shared/services/apiClient'
import type {
  FacebookStats,
  FacebookQuota,
  ApiResponse,
  UseFacebookStatsReturn
} from '../types/facebook.types'

// 🔗 API Functions
const fetchFacebookStats = async (): Promise<FacebookStats> => {
  const { data } = await apiClient.get<{
    totalPages: number;
    activePages: number;
    inactivePages: number;
    totalExtractions: number;
    pagesNeedingExtraction: number;
  }>('/content-extraction-facebook/pages/stats/general')

  // Provide safe defaults if data is undefined or null
  const safeData = data || {
    totalPages: 0,
    activePages: 0,
    inactivePages: 0,
    totalExtractions: 0,
    pagesNeedingExtraction: 0
  }

  // Map backend response to frontend interface
  return {
    pagesActive: safeData.activePages || 0,
    postsToday: 0, // TODO: Implement posts today endpoint
    extractionsHour: 0, // TODO: Implement extractions per hour endpoint
    quotaLimit: 1000, // TODO: Get from actual quota endpoint
    efficiency: safeData.totalPages > 0 ? (safeData.activePages / safeData.totalPages) * 100 : 0,
    quotaResetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  }
}

const fetchFacebookQuota = async (): Promise<FacebookQuota> => {
  // TODO: Implement quota endpoint in backend
  return {
    limit: 0,
    used: 0,
    remaining: 0,
    resetTime: new Date()
  } as FacebookQuota
}

// 🎣 Main Hook
export function useFacebookStats(): UseFacebookStatsReturn {
  // 📊 Statistics Query
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['facebook', 'stats'],
    queryFn: fetchFacebookStats,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 20000, // Consider stale after 20 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // 🔢 Quota Query
  const {
    data: quota,
    isLoading: isLoadingQuota,
    error: quotaError,
    refetch: refetchQuota
  } = useQuery({
    queryKey: ['facebook', 'quota'],
    queryFn: fetchFacebookQuota,
    refetchInterval: 10000, // Refetch every 10 seconds (more frequent for quota)
    staleTime: 5000, // Consider stale after 5 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // 🔄 Combined refetch
  const refetch = () => {
    refetchStats()
    refetchQuota()
  }

  // 🎯 Return hook interface
  return {
    stats,
    quota,
    isLoading: isLoadingStats || isLoadingQuota,
    error: statsError || quotaError,
    refetch,
  }
}

// 🔄 Real-time Hook with Socket.IO
export function useFacebookStatsRealtime(): UseFacebookStatsReturn {
  const baseHook = useFacebookStats()

  // TODO: Implement Socket.IO integration here
  // useEffect(() => {
  //   const socket = getSocket()
  //
  //   socket.on('facebook:stats_updated', (newStats: FacebookStats) => {
  //     queryClient.setQueryData(['facebook', 'stats'], newStats)
  //   })
  //
  //   socket.on('facebook:quota_updated', (newQuota: FacebookQuota) => {
  //     queryClient.setQueryData(['facebook', 'quota'], newQuota)
  //   })
  //
  //   return () => {
  //     socket.off('facebook:stats_updated')
  //     socket.off('facebook:quota_updated')
  //   }
  // }, [queryClient])

  return baseHook
}