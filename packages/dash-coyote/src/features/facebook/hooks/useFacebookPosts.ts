// 📝 Facebook Posts Hook - TanStack Query Integration
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../shared/services/apiClient'
import type {
  FacebookPost,
  FacebookPostDetail,
  FacebookPostsQuery,
  PaginatedResponse,
  ApiResponse,
  UseFacebookPostsReturn
} from '../types/facebook.types'

// 🔗 API Functions
const fetchFacebookPosts = async (query: FacebookPostsQuery = {}): Promise<PaginatedResponse<FacebookPost>> => {
  const params = new URLSearchParams()

  if (query.page) params.append('page', query.page.toString())
  if (query.limit) params.append('limit', query.limit.toString())
  if (query.pageId) params.append('pageId', query.pageId)
  if (query.dateFrom) params.append('dateFrom', query.dateFrom)
  if (query.dateTo) params.append('dateTo', query.dateTo)
  if (query.hasImage !== undefined) params.append('hasImage', query.hasImage.toString())
  if (query.sortBy) params.append('sortBy', query.sortBy)
  if (query.sortOrder) params.append('sortOrder', query.sortOrder)

  const { data } = await apiClient.get<PaginatedResponse<FacebookPost>>(`/content-extraction-facebook/extraction/posts?${params}`)
  return data
}

const fetchRecentFacebookPosts = async (): Promise<FacebookPost[]> => {
  const { data } = await apiClient.get<FacebookPost[]>('/content-extraction-facebook/extraction/posts')
  return data
}

const fetchFacebookPostDetail = async (id: string): Promise<FacebookPostDetail> => {
  const { data } = await apiClient.get<FacebookPostDetail>(`/content-extraction-facebook/extraction/posts/${id}`)
  return data
}

// 🎣 Main Posts Hook
export function useFacebookPosts(query: FacebookPostsQuery = {}): UseFacebookPostsReturn {
  // 📝 Posts Query
  const {
    data: postsResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['facebook', 'posts', query],
    queryFn: () => fetchFacebookPosts(query),
    staleTime: 60000, // 1 minute
    retry: 3,
  })

  // 🎯 Return hook interface
  return {
    posts: postsResponse?.data || [],
    isLoading,
    error,
    total: postsResponse?.pagination?.total || 0,
    pagination: postsResponse?.pagination,

    getPostDetail: async (id: string) => {
      return await fetchFacebookPostDetail(id)
    },

    refetch,
  }
}

// 📋 Recent Posts Hook
export function useFacebookRecentPosts() {
  return useQuery({
    queryKey: ['facebook', 'posts', 'recent'],
    queryFn: fetchRecentFacebookPosts,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
    retry: 3,
  })
}

// 🔍 Single Post Detail Hook
export function useFacebookPostDetail(id: string) {
  return useQuery({
    queryKey: ['facebook', 'posts', id],
    queryFn: () => fetchFacebookPostDetail(id),
    enabled: !!id,
    staleTime: 300000, // 5 minutes
    retry: 3,
  })
}