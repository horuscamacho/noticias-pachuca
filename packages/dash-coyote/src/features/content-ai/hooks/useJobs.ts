import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../shared/services/apiClient'

// Types
interface GenerationJob {
  id: string
  type: 'news-to-content' | 'batch-generation' | 'template-test'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  data: {
    title?: string
    content?: string
    templateId: string
    referenceContent?: string
  }
  priority: number
  description?: string
  progress: number // 0-100
  queuePosition?: number
  estimatedProcessingTime: number // ms
  actualProcessingTime?: number // ms
  startedAt?: Date
  completedAt?: Date
  createdAt: Date
  result?: {
    generatedContent: {
      title: string
      content: string
      keywords: string[]
      tags: string[]
      category: string
      summary: string
    }
    tokensUsed: number
    cost: number
    aiProvider: string
    qualityScore?: number
  }
  errors?: string[]
  retryCount: number
  maxRetries: number
  userId?: string
}

interface JobStats {
  total: number
  byStatus: Record<string, number>
  byType: Record<string, number>
  averageProcessingTime: number
  averageQueueTime: number
  successRate: number
  currentQueueSize: number
  processingCapacity: number
  estimatedWaitTime: number
}

interface CostReport {
  timeframe: 'hour' | 'day' | 'week' | 'month'
  period: {
    start: Date
    end: Date
  }
  totals: {
    cost: number
    jobs: number
    tokens: number
    averageCostPerJob: number
    averageCostPerToken: number
  }
  byProvider: Array<{
    provider: string
    cost: number
    jobs: number
    tokens: number
    percentage: number
  }>
  byTemplate: Array<{
    templateId: string
    templateName: string
    cost: number
    jobs: number
    averageCost: number
  }>
  dailyBreakdown?: Array<{
    date: Date
    cost: number
    jobs: number
    tokens: number
  }>
}

interface CostAlert {
  id: string
  type: 'budget_limit' | 'daily_limit' | 'unusual_spike' | 'provider_error'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  currentValue: number
  thresholdValue: number
  triggeredAt: Date
  isAcknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: Date
}

interface OptimizationRecommendation {
  type: 'provider_switch' | 'template_optimization' | 'queue_management' | 'cost_reduction'
  title: string
  description: string
  estimatedSavings?: number
  estimatedImpact: 'low' | 'medium' | 'high'
  actionRequired: string
  implementationEffort: 'easy' | 'medium' | 'complex'
}

interface DLQEntry {
  id: string
  originalJobId: string
  jobData: GenerationJob['data']
  failureReason: string
  failureCount: number
  firstFailedAt: Date
  lastAttemptAt: Date
  isResolved: boolean
  resolvedAt?: Date
  resolvedBy?: string
  resolution?: {
    method: 'manual_retry' | 'data_fix' | 'provider_fix' | 'abandoned'
    notes?: string
  }
}

interface DLQFilters {
  resolved?: boolean
  failureReason?: string
  provider?: string
  contentId?: string
  userId?: string
  limit?: number
  offset?: number
}

interface DLQRetryOptions {
  forceDifferentProvider?: boolean
  resolvedBy?: string
  notes?: string
}

interface DLQResolution {
  method: 'manual_retry' | 'data_fix' | 'provider_fix' | 'abandoned'
  resolvedBy: string
  notes?: string
}

// API functions
const jobsApi = {
  // Jobs
  getJobStatus: async (jobId: string): Promise<GenerationJob> => {
    return apiClient.get<GenerationJob>(`/content-ai/generate/status/${jobId}`)
  },

  getQueueStats: async (): Promise<JobStats> => {
    return apiClient.get<JobStats>('/content-ai/generate/queue/stats')
  },

  cancelJob: async (jobId: string): Promise<void> => {
    await apiClient.delete(`/content-ai/generate/${jobId}`)
  },

  cleanQueue: async (options?: {
    grace?: number
    limit?: number
    type?: 'completed' | 'failed' | 'active'
  }): Promise<void> => {
    await apiClient.post('/content-ai/admin/queue/clean', options || {})
  },

  // Costs
  getCostReport: async (
    timeframe: 'hour' | 'day' | 'week' | 'month' = 'day',
    startDate?: Date,
    endDate?: Date
  ): Promise<CostReport> => {
    const searchParams = new URLSearchParams({ timeframe })
    if (startDate) searchParams.append('startDate', startDate.toISOString())
    if (endDate) searchParams.append('endDate', endDate.toISOString())

    return apiClient.get<CostReport>(`/content-ai/costs/report?${searchParams}`)
  },

  getActiveAlerts: async (): Promise<CostAlert[]> => {
    return apiClient.get<CostAlert[]>('/content-ai/costs/alerts')
  },

  acknowledgeAlert: async (alertId: string): Promise<void> => {
    await apiClient.post(`/content-ai/costs/alerts/${alertId}/acknowledge`)
  },

  getOptimizationRecommendations: async (): Promise<OptimizationRecommendation[]> => {
    return apiClient.get<OptimizationRecommendation[]>('/content-ai/costs/recommendations')
  },

  // Dead Letter Queue
  getDLQStats: async (): Promise<{
    totalEntries: number
    unresolvedEntries: number
    topFailureReasons: Array<{ reason: string; count: number }>
    oldestUnresolvedEntry?: Date
  }> => {
    return apiClient.get<{
      totalEntries: number
      unresolvedEntries: number
      topFailureReasons: Array<{ reason: string; count: number }>
      oldestUnresolvedEntry?: Date
    }>('/content-ai/dlq/stats')
  },

  getDLQEntries: async (filters?: DLQFilters): Promise<DLQEntry[]> => {
    const searchParams = new URLSearchParams()
    if (filters?.resolved !== undefined) searchParams.append('resolved', filters.resolved.toString())
    if (filters?.failureReason) searchParams.append('failureReason', filters.failureReason)
    if (filters?.provider) searchParams.append('provider', filters.provider)
    if (filters?.contentId) searchParams.append('contentId', filters.contentId)
    if (filters?.userId) searchParams.append('userId', filters.userId)
    if (filters?.limit) searchParams.append('limit', filters.limit.toString())
    if (filters?.offset) searchParams.append('offset', filters.offset.toString())

    return apiClient.get<DLQEntry[]>(`/content-ai/dlq/entries?${searchParams}`)
  },

  retryDLQEntry: async (entryId: string, options?: DLQRetryOptions): Promise<{ success: boolean; newJobId?: string; error?: string }> => {
    return apiClient.post<{ success: boolean; newJobId?: string; error?: string }>(
      `/content-ai/dlq/entries/${entryId}/retry`,
      options || {}
    )
  },

  resolveDLQEntry: async (entryId: string, resolution: DLQResolution): Promise<void> => {
    await apiClient.post(`/content-ai/dlq/entries/${entryId}/resolve`, resolution)
  },

  // System metrics
  getSystemMetrics: async (): Promise<{
    queue: JobStats
    deadLetterQueue: {
      totalEntries: number
      unresolvedEntries: number
      topFailureReasons: Array<{ reason: string; count: number }>
      oldestUnresolvedEntry?: Date
    }
    alerts: {
      active: number
      critical: number
    }
    costs: {
      today: number
      totalJobs: number
      averageCostPerJob: number
    }
    timestamp: Date
  }> => {
    return apiClient.get<{
      queue: JobStats
      deadLetterQueue: {
        totalEntries: number
        unresolvedEntries: number
        topFailureReasons: Array<{ reason: string; count: number }>
        oldestUnresolvedEntry?: Date
      }
      alerts: {
        active: number
        critical: number
      }
      costs: {
        today: number
        totalJobs: number
        averageCostPerJob: number
      }
      timestamp: Date
    }>('/content-ai/admin/metrics')
  }
}

// Query keys
export const jobsKeys = {
  status: (jobId: string) => ['jobs', 'status', jobId] as const,
  queueStats: ['jobs', 'queue', 'stats'] as const,
  costReport: (timeframe: string, startDate?: Date, endDate?: Date) =>
    ['costs', 'report', timeframe, startDate, endDate] as const,
  alerts: ['costs', 'alerts'] as const,
  recommendations: ['costs', 'recommendations'] as const,
  dlqStats: ['dlq', 'stats'] as const,
  dlqEntries: (filters?: DLQFilters) => ['dlq', 'entries', filters] as const,
  systemMetrics: ['system', 'metrics'] as const,
}

// Hooks
export function useJobStatus(jobId: string) {
  return useQuery({
    queryKey: jobsKeys.status(jobId),
    queryFn: () => jobsApi.getJobStatus(jobId),
    enabled: !!jobId,
    refetchInterval: (data) => {
      // Poll every 2 seconds if job is still processing
      if (!data || data.status === 'pending' || data.status === 'processing') {
        return 2000
      }
      return false
    },
  })
}

export function useQueueStats() {
  return useQuery({
    queryKey: jobsKeys.queueStats,
    queryFn: jobsApi.getQueueStats,
    refetchInterval: 5000, // Refresh every 5 seconds
  })
}

export function useCostReport(
  timeframe: 'hour' | 'day' | 'week' | 'month' = 'day',
  startDate?: Date,
  endDate?: Date
) {
  return useQuery({
    queryKey: jobsKeys.costReport(timeframe, startDate, endDate),
    queryFn: () => jobsApi.getCostReport(timeframe, startDate, endDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useActiveAlerts() {
  return useQuery({
    queryKey: jobsKeys.alerts,
    queryFn: jobsApi.getActiveAlerts,
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

export function useOptimizationRecommendations() {
  return useQuery({
    queryKey: jobsKeys.recommendations,
    queryFn: jobsApi.getOptimizationRecommendations,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useDLQStats() {
  return useQuery({
    queryKey: jobsKeys.dlqStats,
    queryFn: jobsApi.getDLQStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useDLQEntries(filters?: DLQFilters) {
  return useQuery({
    queryKey: jobsKeys.dlqEntries(filters),
    queryFn: () => jobsApi.getDLQEntries(filters),
    staleTime: 60 * 1000, // 1 minute
  })
}

export function useSystemMetrics() {
  return useQuery({
    queryKey: jobsKeys.systemMetrics,
    queryFn: jobsApi.getSystemMetrics,
    refetchInterval: 10000, // Refresh every 10 seconds
  })
}

export function useCancelJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: jobsApi.cancelJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobsKeys.queueStats })
    },
  })
}

export function useCleanQueue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: jobsApi.cleanQueue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobsKeys.queueStats })
    },
  })
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: jobsApi.acknowledgeAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobsKeys.alerts })
    },
  })
}

export function useRetryDLQEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ entryId, options }: { entryId: string; options?: DLQRetryOptions }) =>
      jobsApi.retryDLQEntry(entryId, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobsKeys.dlqStats })
      queryClient.invalidateQueries({ queryKey: ['dlq', 'entries'] })
    },
  })
}

export function useResolveDLQEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ entryId, resolution }: { entryId: string; resolution: DLQResolution }) =>
      jobsApi.resolveDLQEntry(entryId, resolution),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobsKeys.dlqStats })
      queryClient.invalidateQueries({ queryKey: ['dlq', 'entries'] })
    },
  })
}