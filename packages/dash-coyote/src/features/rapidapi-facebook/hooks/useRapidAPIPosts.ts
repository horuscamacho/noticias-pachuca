// 📄 RapidAPI Facebook Posts Hook - TanStack Query Integration
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../shared/services/apiClient'
import type { RapidAPIPost } from '../types/rapidapi-facebook.types'

interface PostsPaginationResponse {
  data: RapidAPIPost[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

interface UseRapidAPIPostsParams {
  pageId: string
  page?: number
  limit?: number
  enabled?: boolean
}

// 📄 Get Posts for a page
const getPagePosts = async (
  pageId: string,
  pagination: { page?: number; limit?: number } = {}
): Promise<PostsPaginationResponse> => {
  return await apiClient.get<PostsPaginationResponse>(`/rapidapi-facebook/pages/${pageId}/posts`, {
    params: pagination
  })
}

// 🎣 Hook to get posts for a specific page
export function useRapidAPIPosts({ pageId, page = 1, limit = 10, enabled = true }: UseRapidAPIPostsParams) {
  return useQuery({
    queryKey: ['rapidapi-posts', pageId, page, limit],
    queryFn: () => getPagePosts(pageId, { page, limit }),
    enabled: enabled && !!pageId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}