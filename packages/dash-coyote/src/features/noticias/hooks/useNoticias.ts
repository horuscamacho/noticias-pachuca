import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../shared/services/apiClient'

// Types
interface ExtractedNoticia {
  id: string
  title: string
  content: string
  summary?: string
  sourceUrl: string
  publishedAt: Date
  extractedAt: Date
  author?: string
  category?: string
  tags?: string[]
  imageUrl?: string
  extractionScore: number
  isProcessed: boolean
  metadata: {
    wordCount: number
    readingTime: number
    language: string
    domain: string
  }
  qualityMetrics: {
    titleQuality: number
    contentQuality: number
    completeness: number
  }
}

interface NoticiasFilters {
  page?: number
  limit?: number
  dateFrom?: Date
  dateTo?: Date
  category?: string
  domain?: string
  isProcessed?: boolean
  minScore?: number
  search?: string
}

interface PaginatedNoticias {
  data: ExtractedNoticia[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// API functions
const noticiasApi = {
  getExtracted: async (filters?: NoticiasFilters): Promise<PaginatedNoticias> => {
    const params: Record<string, string> = {}
    if (filters?.page) params.page = filters.page.toString()
    if (filters?.limit) params.limit = filters.limit.toString()
    if (filters?.dateFrom) params.dateFrom = filters.dateFrom.toISOString()
    if (filters?.dateTo) params.dateTo = filters.dateTo.toISOString()
    if (filters?.category) params.category = filters.category
    if (filters?.domain) params.domain = filters.domain
    if (filters?.isProcessed !== undefined) params.isProcessed = filters.isProcessed.toString()
    if (filters?.minScore) params.minScore = filters.minScore.toString()
    if (filters?.search) params.search = filters.search

    return apiClient.get<PaginatedNoticias>('/noticias/extracted', { params })
  },

  getById: async (id: string): Promise<ExtractedNoticia> => {
    return apiClient.get<ExtractedNoticia>(`/noticias/extracted/${id}`)
  },

  markAsProcessed: async (id: string): Promise<void> => {
    return apiClient.patch<void>(`/noticias/extracted/${id}/processed`)
  },

  generateContent: async (noticia: ExtractedNoticia, templateId: string): Promise<{
    jobId: string
    status: string
    message: string
  }> => {
    return apiClient.post<{
      jobId: string
      status: string
      message: string
    }>('/content-ai/generate-from-news', {
      title: noticia.title,
      content: noticia.content,
      templateId,
      referenceContent: noticia.summary || '',
      description: `Generación desde noticia extraída: ${noticia.title.substring(0, 100)}...`,
    })
  }
}

// Query keys
export const noticiasKeys = {
  all: ['noticias'] as const,
  extracted: ['noticias', 'extracted'] as const,
  extractedList: (filters?: NoticiasFilters) => [...noticiasKeys.extracted, 'list', filters] as const,
  extractedDetail: (id: string) => [...noticiasKeys.extracted, 'detail', id] as const,
}

// Hooks
export function useExtractedNoticias(filters?: NoticiasFilters) {
  return useQuery({
    queryKey: noticiasKeys.extractedList(filters),
    queryFn: () => noticiasApi.getExtracted(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useExtractedNoticia(id: string) {
  return useQuery({
    queryKey: noticiasKeys.extractedDetail(id),
    queryFn: () => noticiasApi.getById(id),
    enabled: !!id,
  })
}

export function useMarkNoticiaAsProcessed() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: noticiasApi.markAsProcessed,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noticiasKeys.extracted })
    },
  })
}

export function useGenerateFromNoticia() {
  return useMutation({
    mutationFn: ({ noticia, templateId }: { noticia: ExtractedNoticia; templateId: string }) =>
      noticiasApi.generateContent(noticia, templateId),
  })
}