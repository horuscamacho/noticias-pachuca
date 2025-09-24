import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../shared/services/apiClient'

// Types
interface GeneratedContent {
  id: string
  originalInput: {
    title: string
    content: string
    referenceContent?: string
  }
  generatedContent: {
    title: string
    content: string
    keywords: string[]
    tags: string[]
    category: string
    summary: string
  }
  templateUsed: {
    id: string
    name: string
    agentPersona: string
    editorialLine: 'neutral' | 'izquierda' | 'derecha' | 'crítica'
  }
  processing: {
    status: 'pending' | 'processing' | 'completed' | 'failed'
    startedAt?: Date
    completedAt?: Date
    errorMessage?: string
    provider?: string
    costData: {
      tokensUsed: number
      cost: number
      processingTime: number
    }
  }
  qualityMetrics: {
    readabilityScore: number
    seoScore: number
    grammarScore: number
    originalityScore: number
  }
  review?: {
    isApproved: boolean
    reviewedBy: string
    reviewedAt: Date
    comments?: string
    requiredChanges?: string[]
  }
  publication?: {
    isPublished: boolean
    publishedAt?: Date
    publishChannel?: string
    publishedUrl?: string
  }
  userRating?: number
  createdAt: Date
  updatedAt: Date
}

interface GeneratedContentFilters {
  status?: 'pending' | 'processing' | 'completed' | 'failed'
  templateId?: string
  editorialLine?: 'neutral' | 'izquierda' | 'derecha' | 'crítica'
  dateFrom?: Date
  dateTo?: Date
  category?: string
  hasErrors?: boolean
  isPublished?: boolean
  minQualityScore?: number
  limit?: number
  offset?: number
}

interface GeneratedContentStats {
  totalGenerated: number
  byStatus: {
    pending: number
    processing: number
    completed: number
    failed: number
  }
  byEditorialLine: {
    neutral: number
    izquierda: number
    derecha: number
    crítica: number
  }
  averageQualityScores: {
    readability: number
    seo: number
    grammar: number
    originality: number
  }
  totalCost: number
  averageProcessingTime: number
  successRate: number
  publishedCount: number
  topCategories: Array<{ category: string; count: number }>
  topTemplates: Array<{ templateName: string; count: number; successRate: number }>
}

interface NewsToContentRequest {
  title: string
  content: string
  templateId: string
  referenceContent?: string
  priority?: number
  description?: string
}

interface NewsGenerationResponse {
  jobId: string
  status: 'pending' | 'processing'
  templateUsed: {
    id: string
    name: string
    agentPersona: string
    editorialLine: string
  }
  estimatedProcessingTime: number
  estimatedCost: number
  queuePosition?: number
  message: string
}

// API functions
const generatedContentApi = {
  getAll: async (filters?: GeneratedContentFilters): Promise<GeneratedContent[]> => {
    const params: Record<string, string> = {}
    if (filters?.status) params.status = filters.status
    if (filters?.templateId) params.templateId = filters.templateId
    if (filters?.editorialLine) params.editorialLine = filters.editorialLine
    if (filters?.dateFrom) params.dateFrom = filters.dateFrom.toISOString()
    if (filters?.dateTo) params.dateTo = filters.dateTo.toISOString()
    if (filters?.category) params.category = filters.category
    if (filters?.hasErrors !== undefined) params.hasErrors = filters.hasErrors.toString()
    if (filters?.isPublished !== undefined) params.isPublished = filters.isPublished.toString()
    if (filters?.minQualityScore) params.minQualityScore = filters.minQualityScore.toString()
    if (filters?.limit) params.limit = filters.limit.toString()
    if (filters?.offset) params.offset = filters.offset.toString()

    return apiClient.get<GeneratedContent[]>('/content-ai/generated', { params })
  },

  getById: async (id: string): Promise<GeneratedContent> => {
    return apiClient.get<GeneratedContent>(`/content-ai/generated/${id}`)
  },

  getStats: async (timeframe?: 'day' | 'week' | 'month'): Promise<GeneratedContentStats> => {
    const params: Record<string, string> = {}
    if (timeframe) params.timeframe = timeframe

    return apiClient.get<GeneratedContentStats>('/content-ai/generated/stats/summary', { params })
  },

  generateFromNews: async (request: NewsToContentRequest): Promise<NewsGenerationResponse> => {
    return apiClient.post<NewsGenerationResponse>('/content-ai/generate-from-news', request)
  },

  getGenerationResult: async (jobId: string): Promise<NewsGenerationResponse> => {
    return apiClient.get<NewsGenerationResponse>(`/content-ai/generate-from-news/${jobId}`)
  },

  rateContent: async (id: string, rating: number): Promise<void> => {
    return apiClient.post<void>(`/content-ai/generated/${id}/rate`, { rating })
  },

  publishContent: async (id: string): Promise<void> => {
    return apiClient.post<void>(`/content-ai/generated/${id}/publish`)
  },

  exportContent: async (id: string, format: 'json' | 'html' | 'markdown' = 'json'): Promise<Blob> => {
    return apiClient.get<Blob>(`/content-ai/generated/${id}/export?format=${format}`)
  }
}

// Query keys
export const generatedContentKeys = {
  all: ['generatedContent'] as const,
  lists: () => [...generatedContentKeys.all, 'list'] as const,
  list: (filters?: GeneratedContentFilters) => [...generatedContentKeys.lists(), filters] as const,
  details: () => [...generatedContentKeys.all, 'detail'] as const,
  detail: (id: string) => [...generatedContentKeys.details(), id] as const,
  stats: (timeframe?: string) => [...generatedContentKeys.all, 'stats', timeframe] as const,
  generation: (jobId: string) => [...generatedContentKeys.all, 'generation', jobId] as const,
}

// Hooks
export function useGeneratedContent(filters?: GeneratedContentFilters) {
  return useQuery({
    queryKey: generatedContentKeys.list(filters),
    queryFn: () => generatedContentApi.getAll(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useGeneratedContentById(id: string) {
  return useQuery({
    queryKey: generatedContentKeys.detail(id),
    queryFn: () => generatedContentApi.getById(id),
    enabled: !!id,
  })
}

export function useGeneratedContentStats(timeframe?: 'day' | 'week' | 'month') {
  return useQuery({
    queryKey: generatedContentKeys.stats(timeframe),
    queryFn: () => generatedContentApi.getStats(timeframe),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useGenerateFromNews() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: generatedContentApi.generateFromNews,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: generatedContentKeys.all })
    },
  })
}

export function useNewsGenerationResult(jobId: string) {
  return useQuery({
    queryKey: generatedContentKeys.generation(jobId),
    queryFn: () => generatedContentApi.getGenerationResult(jobId),
    enabled: !!jobId,
    refetchInterval: (data) => {
      // Stop polling when job is completed or failed
      return data?.status === 'pending' || data?.status === 'processing' ? 2000 : false
    },
  })
}

export function useRateContent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, rating }: { id: string; rating: number }) =>
      generatedContentApi.rateContent(id, rating),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: generatedContentKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: generatedContentKeys.all })
    },
  })
}

export function usePublishContent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: generatedContentApi.publishContent,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: generatedContentKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: generatedContentKeys.all })
    },
  })
}

export function useExportContent() {
  return useMutation({
    mutationFn: ({ id, format }: { id: string; format?: 'json' | 'html' | 'markdown' }) =>
      generatedContentApi.exportContent(id, format),
  })
}