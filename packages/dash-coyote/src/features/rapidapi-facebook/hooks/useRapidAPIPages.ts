// 📄 RapidAPI Facebook Pages Hook - TanStack Query Integration
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { apiClient } from '../../shared/services/apiClient'
import { useContext } from 'react'
import { SocketContext } from '@/socket/context/SocketContext'
import { toast } from 'sonner'
import type {
  RapidAPIPage,
  RapidAPIPost,
  CreateRapidAPIPageDto,
  UpdateRapidAPIPageDto,
  RapidAPIPagesQuery,
  PaginatedResponse,
  UseRapidAPIPagesReturn
} from '../types/rapidapi-facebook.types'

// 🔗 API Functions - SAVE PAGES TO DATABASE
const createFacebookPageInDB = async (data: CreateRapidAPIPageDto): Promise<RapidAPIPage> => {
  return await apiClient.post<RapidAPIPage>('/rapidapi-facebook/pages', data)
}

// 📄 Get All Pages
const getAllPages = async (): Promise<PaginatedResponse<RapidAPIPage>> => {
  return await apiClient.get<PaginatedResponse<RapidAPIPage>>('/rapidapi-facebook/pages')
}

// 🔗 Extract Posts Functions
const extractPagePosts = async (pageId: string, configId?: string): Promise<{ success: boolean; posts: RapidAPIPost[]; postsExtracted: number }> => {
  return await apiClient.post<{ success: boolean; posts: RapidAPIPost[]; postsExtracted: number }>('/rapidapi-facebook/extract-page-posts', {
    pageId,
    configId,
    limit: 10,
    includeComments: false,
    includeReactions: false
  })
}

const extractPagePostsAsync = async (
  pageId: string,
  configId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<{ success: boolean; jobId: string; message: string }> => {
  return await apiClient.post<{ success: boolean; jobId: string; message: string }>('/rapidapi-facebook/extract-page-posts-async', {
    pageId,
    configId,
    limit: 10,
    includeComments: false,
    includeReactions: false,
    startDate: startDate?.toISOString(),
    endDate: endDate?.toISOString()
  })
}

// 🔧 Update Extraction Configuration
const updateExtractionConfig = async (pageId: string, extractionConfig: UpdateRapidAPIPageDto['extractionConfig']): Promise<{ success: boolean; message: string }> => {
  return await apiClient.put<{ success: boolean; message: string }>(`/rapidapi-facebook/pages/${pageId}/extraction-config`, {
    extractionConfig
  })
}

// 📄 Get Posts for a page
const getPagePosts = async (pageId: string, pagination: { page?: number; limit?: number } = {}): Promise<{ data: RapidAPIPost[]; pagination: any }> => {
  return await apiClient.get<{ data: RapidAPIPost[]; pagination: any }>(`/rapidapi-facebook/pages/${pageId}/posts`, {
    params: pagination
  })
}

// 🗑️ Delete Page
const deletePage = async (pageId: string): Promise<void> => {
  return await apiClient.delete(`/rapidapi-facebook/pages/${pageId}`)
}

// 🔄 Trigger Manual Extraction (Async with Socket.IO)
const triggerExtraction = async (
  pageId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{ success: boolean; jobId: string; message: string }> => {
  return await apiClient.post<{ success: boolean; jobId: string; message: string }>('/rapidapi-facebook/extract-page-posts-async', {
    pageId,
    limit: 10,
    includeComments: false,
    includeReactions: false,
    startDate: startDate?.toISOString(),
    endDate: endDate?.toISOString()
  })
}

// 🎣 HOOK PRINCIPAL - CREA PÁGINAS EN BD Y EXTRAE POSTS ASYNC
export function useRapidAPIPages(): {
  pages: RapidAPIPage[]
  isLoading: boolean
  error: Error | null
  createPage: (data: CreateRapidAPIPageDto) => Promise<RapidAPIPage>
  extractPosts: (pageId: string, configId?: string) => Promise<{ success: boolean; posts: RapidAPIPost[]; postsExtracted: number }>
  extractPostsAsync: (pageId: string, configId?: string, startDate?: Date, endDate?: Date) => Promise<{ success: boolean; jobId: string; message: string }>
  updateExtractionConfig: (pageId: string, extractionConfig: UpdateRapidAPIPageDto['extractionConfig']) => Promise<{ success: boolean; message: string }>
  deletePage: (pageId: string) => Promise<void>
  triggerExtraction: (pageId: string, startDate?: Date, endDate?: Date) => Promise<{ success: boolean; jobId: string; message: string }>
  refetch: () => void
} {
  const queryClient = useQueryClient()

  // 📄 Get Pages Query
  const {
    data: pagesData,
    isLoading: isLoadingPages,
    error: pagesError,
    refetch
  } = useQuery({
    queryKey: ['rapidapi-pages'],
    queryFn: getAllPages
  })

  // 🔨 Create Page Mutation
  const createPageMutation = useMutation({
    mutationFn: createFacebookPageInDB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rapidapi-pages'] })
    },
    onError: (error) => {
      console.error('Error creating RapidAPI page:', error)
    }
  })

  // 📥 Extract Posts Mutation (Sync)
  const extractMutation = useMutation({
    mutationFn: ({ pageId, configId }: { pageId: string; configId?: string }) =>
      extractPagePosts(pageId, configId),
    onError: (error) => {
      console.error('Error extracting posts:', error)
    }
  })

  // 🚀 Extract Posts Async Mutation
  const extractAsyncMutation = useMutation({
    mutationFn: ({ pageId, configId, startDate, endDate }: { pageId: string; configId?: string; startDate?: Date; endDate?: Date }) =>
      extractPagePostsAsync(pageId, configId, startDate, endDate),
    onError: (error) => {
      console.error('Error starting async posts extraction:', error)
    }
  })

  // 🗑️ Delete Page Mutation
  const deletePageMutation = useMutation({
    mutationFn: deletePage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rapidapi-pages'] })
    },
    onError: (error) => {
      console.error('Error deleting page:', error)
    }
  })

  // 🔄 Trigger Extraction Mutation
  const triggerExtractionMutation = useMutation({
    mutationFn: ({ pageId, startDate, endDate }: { pageId: string; startDate?: Date; endDate?: Date }) => triggerExtraction(pageId, startDate, endDate),
    onSuccess: () => {
      // Invalidate pages cache to refresh stats after extraction
      queryClient.invalidateQueries({ queryKey: ['rapidapi-pages'] })
    },
    onError: (error) => {
      console.error('Error triggering extraction:', error)
    }
  })

  // ⚙️ Update Extraction Config Mutation
  const updateConfigMutation = useMutation({
    mutationFn: ({ pageId, extractionConfig }: { pageId: string; extractionConfig: UpdateRapidAPIPageDto['extractionConfig'] }) =>
      updateExtractionConfig(pageId, extractionConfig),
    onSuccess: () => {
      // Invalidate pages cache to refresh config changes
      queryClient.invalidateQueries({ queryKey: ['rapidapi-pages'] })
    },
    onError: (error) => {
      console.error('Error updating extraction config:', error)
    }
  })

  // 🎯 Wrapper functions
  const createPageWrapper = async (data: CreateRapidAPIPageDto) => {
    return await createPageMutation.mutateAsync(data)
  }

  const extractPostsWrapper = async (pageId: string, configId?: string) => {
    return await extractMutation.mutateAsync({ pageId, configId })
  }

  const extractPostsAsyncWrapper = async (pageId: string, configId?: string, startDate?: Date, endDate?: Date) => {
    return await extractAsyncMutation.mutateAsync({ pageId, configId, startDate, endDate })
  }

  const updateExtractionConfigWrapper = async (pageId: string, extractionConfig: UpdateRapidAPIPageDto['extractionConfig']) => {
    return await updateConfigMutation.mutateAsync({ pageId, extractionConfig })
  }

  const deletePageWrapper = async (pageId: string) => {
    return await deletePageMutation.mutateAsync(pageId)
  }

  const triggerExtractionWrapper = async (pageId: string, startDate?: Date, endDate?: Date) => {
    return await triggerExtractionMutation.mutateAsync({ pageId, startDate, endDate })
  }

  // 🔌 Socket.IO Integration for real-time extraction updates
  const socketContext = useContext(SocketContext)
  if (!socketContext) {
    throw new Error('useRapidAPIPages must be used within SocketProvider')
  }
  const { socket, isConnected } = socketContext

  useEffect(() => {
    if (!socket || !isConnected) return

    // 🚀 Extraction Started
    const handleExtractionStarted = (data: {
      jobId: string
      pageId: string
      expectedPosts: number
      timestamp: string
    }) => {
      console.log('🚀 Extraction started:', data)
      toast.success(`Extracción iniciada para página ${data.pageId}`, {
        description: `Esperando extraer ${data.expectedPosts} posts...`,
        duration: 3000
      })
    }

    // 📊 Extraction Progress
    const handleExtractionProgress = (data: {
      jobId: string
      pageId: string
      postsExtracted: number
      totalExpected: number
      percentage: number
    }) => {
      console.log('📊 Extraction progress:', data)
      toast.info(`Progreso: ${data.postsExtracted}/${data.totalExpected} posts`, {
        description: `${data.percentage}% completado`,
        duration: 2000
      })
    }

    // ✅ Extraction Completed
    const handleExtractionCompleted = (data: {
      jobId: string
      pageId: string
      postsExtracted: number
      duration: number
      errors: string[]
    }) => {
      console.log('✅ Extraction completed:', data)

      // Refresh pages data to show updated stats
      queryClient.invalidateQueries({ queryKey: ['rapidapi-pages'] })

      toast.success(`¡Extracción completada!`, {
        description: `${data.postsExtracted} posts extraídos en ${Math.round(data.duration / 1000)}s`,
        duration: 5000
      })
    }

    // ❌ Extraction Failed
    const handleExtractionFailed = (data: {
      jobId: string
      pageId: string
      error: string
      retryCount: number
    }) => {
      console.error('❌ Extraction failed:', data)
      toast.error('Error en extracción', {
        description: data.error,
        duration: 5000
      })
    }

    // Agregar listeners
    socket.on('facebook-extraction-started', handleExtractionStarted)
    socket.on('facebook-extraction-progress', handleExtractionProgress)
    socket.on('facebook-extraction-completed', handleExtractionCompleted)
    socket.on('facebook-extraction-failed', handleExtractionFailed)

    // Cleanup
    return () => {
      socket.off('facebook-extraction-started', handleExtractionStarted)
      socket.off('facebook-extraction-progress', handleExtractionProgress)
      socket.off('facebook-extraction-completed', handleExtractionCompleted)
      socket.off('facebook-extraction-failed', handleExtractionFailed)
    }
  }, [socket, isConnected, queryClient])

  return {
    pages: pagesData?.data || [],
    isLoading: isLoadingPages || createPageMutation.isPending || extractMutation.isPending || extractAsyncMutation.isPending || deletePageMutation.isPending || triggerExtractionMutation.isPending || updateConfigMutation.isPending,
    error: pagesError || createPageMutation.error || extractMutation.error || extractAsyncMutation.error || deletePageMutation.error || triggerExtractionMutation.error || updateConfigMutation.error,
    createPage: createPageWrapper,
    extractPosts: extractPostsWrapper,
    extractPostsAsync: extractPostsAsyncWrapper,
    updateExtractionConfig: updateExtractionConfigWrapper,
    deletePage: deletePageWrapper,
    triggerExtraction: triggerExtractionWrapper,
    refetch,
  }
}

// ❌ HOOKS ELIMINADOS - NO HAY ENDPOINTS DE PÁGINAS EN BD
// Solo queda el hook principal para validación y extracción