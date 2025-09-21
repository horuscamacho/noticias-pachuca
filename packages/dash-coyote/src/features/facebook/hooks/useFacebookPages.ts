// 📄 Facebook Pages Hook - TanStack Query Integration with CRUD Operations
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../shared/services/apiClient'
import { toast } from 'sonner'
import type {
  FacebookPage,
  CreateFacebookPageDto,
  UpdateFacebookPageDto,
  FacebookPagesQuery,
  PaginatedResponse,
  ApiResponse,
  UseFacebookPagesReturn
} from '../types/facebook.types'

// 🔗 API Functions
const fetchFacebookPages = async (query: FacebookPagesQuery = {}): Promise<PaginatedResponse<FacebookPage>> => {
  const params = new URLSearchParams()

  if (query.page) params.append('page', query.page.toString())
  if (query.limit) params.append('limit', query.limit.toString())
  if (query.status) params.append('status', query.status)
  if (query.search) params.append('search', query.search)
  if (query.sortBy) params.append('sortBy', query.sortBy)
  if (query.sortOrder) params.append('sortOrder', query.sortOrder)

  const { data } = await apiClient.get<PaginatedResponse<FacebookPage>>(`/content-extraction-facebook/pages?${params}`)
  return data
}

const createFacebookPage = async (pageData: CreateFacebookPageDto): Promise<FacebookPage> => {
  const { data } = await apiClient.post<FacebookPage>('/content-extraction-facebook/pages', pageData)
  return data
}

const createFacebookPageFromUrl = async (pageUrl: string, config?: {
  isActive?: boolean
  extractionConfig?: {
    maxPosts?: number
    frequency?: 'manual' | 'daily' | 'weekly'
    fields?: string[]
  }
}): Promise<FacebookPage> => {
  const { data } = await apiClient.post<{
    message: string
    pageId: string
    pageName: string
    category: string
  }>('/content-extraction-facebook/pages/from-url', {
    pageUrl,
    isActive: config?.isActive ?? true,
    extractionConfig: config?.extractionConfig
  })

  // Transform response to match FacebookPage interface
  return {
    id: data.pageId,
    pageId: data.pageId,
    pageName: data.pageName,
    category: data.category,
    isActive: config?.isActive ?? true,
    extractionConfig: config?.extractionConfig || {
      maxPosts: 50,
      frequency: 'manual',
      fields: ['message', 'created_time', 'likes', 'shares', 'comments']
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as FacebookPage
}

const updateFacebookPage = async (id: string, pageData: UpdateFacebookPageDto): Promise<FacebookPage> => {
  const { data } = await apiClient.put<FacebookPage>(`/content-extraction-facebook/pages/${id}`, pageData)
  return data
}

const deleteFacebookPage = async (id: string): Promise<void> => {
  await apiClient.delete(`/content-extraction-facebook/pages/${id}`)
}

const togglePageExtraction = async (id: string, enabled: boolean): Promise<FacebookPage> => {
  const { data } = await apiClient.patch<FacebookPage>(`/content-extraction-facebook/pages/${id}/extraction`, {
    extractionEnabled: enabled
  })
  return data
}

const triggerPageExtraction = async (id: string): Promise<void> => {
  await apiClient.post(`/content-extraction-facebook/pages/${id}/extract`)
}

// 🎣 Main Hook
export function useFacebookPages(query: FacebookPagesQuery = {}): UseFacebookPagesReturn {
  const queryClient = useQueryClient()

  // 📋 Pages Query
  const {
    data: pagesResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['facebook', 'pages', query],
    queryFn: () => fetchFacebookPages(query),
    staleTime: 30000, // 30 seconds
    retry: 3,
  })

  // ➕ Create Page Mutation
  const createPageMutation = useMutation({
    mutationFn: createFacebookPage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facebook', 'pages'] })
      queryClient.invalidateQueries({ queryKey: ['facebook', 'stats'] })
      toast.success('Página de Facebook creada exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al crear página: ${error.message}`)
    },
  })

  // 🔗 Create Page From URL Mutation
  const createPageFromUrlMutation = useMutation({
    mutationFn: ({ pageUrl, config }: {
      pageUrl: string
      config?: {
        isActive?: boolean
        extractionConfig?: {
          maxPosts?: number
          frequency?: 'manual' | 'daily' | 'weekly'
          fields?: string[]
        }
      }
    }) => createFacebookPageFromUrl(pageUrl, config),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['facebook', 'pages'] })
      queryClient.invalidateQueries({ queryKey: ['facebook', 'stats'] })
      toast.success(`Página "${data.pageName}" agregada exitosamente`)
    },
    onError: (error: Error) => {
      const errorMessage = error.message || 'Error al crear página desde URL'

      if (errorMessage.includes('already being monitored')) {
        toast.error('Esta página ya está siendo monitoreada')
      } else if (errorMessage.includes('not accessible')) {
        toast.error('No se puede acceder a esta página de Facebook')
      } else {
        toast.error(`Error: ${errorMessage}`)
      }
    },
  })

  // ✏️ Update Page Mutation
  const updatePageMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFacebookPageDto }) =>
      updateFacebookPage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facebook', 'pages'] })
      toast.success('Página actualizada exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar página: ${error.message}`)
    },
  })

  // 🗑️ Delete Page Mutation
  const deletePageMutation = useMutation({
    mutationFn: deleteFacebookPage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facebook', 'pages'] })
      queryClient.invalidateQueries({ queryKey: ['facebook', 'stats'] })
      toast.success('Página eliminada exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar página: ${error.message}`)
    },
  })

  // 🔄 Toggle Extraction Mutation
  const toggleExtractionMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      togglePageExtraction(id, enabled),
    onSuccess: (_, { enabled }) => {
      queryClient.invalidateQueries({ queryKey: ['facebook', 'pages'] })
      toast.success(`Extracción ${enabled ? 'activada' : 'pausada'} exitosamente`)
    },
    onError: (error: Error) => {
      toast.error(`Error al cambiar extracción: ${error.message}`)
    },
  })

  // ⚡ Trigger Extraction Mutation
  const triggerExtractionMutation = useMutation({
    mutationFn: triggerPageExtraction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facebook', 'pages'] })
      queryClient.invalidateQueries({ queryKey: ['facebook', 'stats'] })
      toast.success('Extracción iniciada exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al iniciar extracción: ${error.message}`)
    },
  })

  // 🎯 Return hook interface
  return {
    pages: pagesResponse?.data || [],
    isLoading: isLoading || createPageMutation.isPending || createPageFromUrlMutation.isPending ||
               updatePageMutation.isPending || deletePageMutation.isPending ||
               toggleExtractionMutation.isPending || triggerExtractionMutation.isPending,
    error,
    total: pagesResponse?.pagination?.total || 0,
    pagination: pagesResponse?.pagination,

    // 🔧 CRUD Operations
    createPage: async (data: CreateFacebookPageDto) => {
      await createPageMutation.mutateAsync(data)
    },

    createPageFromUrl: async (pageUrl: string, config?: {
      isActive?: boolean
      extractionConfig?: {
        maxPosts?: number
        frequency?: 'manual' | 'daily' | 'weekly'
        fields?: string[]
      }
    }) => {
      await createPageFromUrlMutation.mutateAsync({ pageUrl, config })
    },

    updatePage: async (id: string, data: UpdateFacebookPageDto) => {
      await updatePageMutation.mutateAsync({ id, data })
    },

    deletePage: async (id: string) => {
      await deletePageMutation.mutateAsync(id)
    },

    toggleExtraction: async (id: string, enabled: boolean) => {
      await toggleExtractionMutation.mutateAsync({ id, enabled })
    },

    triggerExtraction: async (id: string) => {
      await triggerExtractionMutation.mutateAsync(id)
    },

    refetch,
  }
}

// 🔍 Single Page Hook
export function useFacebookPage(id: string) {
  return useQuery({
    queryKey: ['facebook', 'pages', id],
    queryFn: async () => {
      const { data } = await apiClient.get<FacebookPage>(`/content-extraction-facebook/pages/${id}`)
      return data
    },
    enabled: !!id,
    staleTime: 30000,
    retry: 3,
  })
}