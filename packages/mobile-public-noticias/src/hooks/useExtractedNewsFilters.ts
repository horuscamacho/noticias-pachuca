/**
 * 🎯 React Query Hooks for Extracted News Filtering System
 *
 * Provides hooks for:
 * - Infinite scroll list with filters
 * - Keywords with search
 * - Categories, authors, tags, domains aggregation
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { extractedNewsApi } from '@/src/services/api/extractedNewsApi'
import type { App } from '@/src/types/extracted-content-filters.types'

// ============================================================================
// 🔑 QUERY KEYS
// ============================================================================

export const extractedNewsKeys = {
  all: ['extracted-news'] as const,
  lists: () => [...extractedNewsKeys.all, 'list'] as const,
  list: (filters?: App.ExtractedContentFilters) => [...extractedNewsKeys.lists(), filters] as const,
  details: () => [...extractedNewsKeys.all, 'detail'] as const,
  detail: (id: string) => [...extractedNewsKeys.details(), id] as const,
  keywords: () => [...extractedNewsKeys.all, 'keywords'] as const,
  keywordsWithSearch: (search?: string) => [...extractedNewsKeys.keywords(), search] as const,
  categories: () => [...extractedNewsKeys.all, 'categories'] as const,
  authors: () => [...extractedNewsKeys.all, 'authors'] as const,
  tags: () => [...extractedNewsKeys.all, 'tags'] as const,
  domains: () => [...extractedNewsKeys.all, 'domains'] as const,
}

// ============================================================================
// 📱 HOOKS
// ============================================================================

/**
 * Hook for infinite scroll list with filters
 * Uses useInfiniteQuery for automatic pagination
 */
export function useExtractedNews(filters?: Omit<App.ExtractedContentFilters, 'page' | 'limit'>) {
  return useInfiniteQuery({
    queryKey: extractedNewsKeys.list(filters),
    queryFn: ({ pageParam }) => {
      console.log('[useExtractedNews] queryFn called with pageParam:', pageParam)
      return extractedNewsApi.getExtractedNews({
        ...filters,
        page: pageParam,
        limit: 20, // 20 items per page
      })
    },
    getNextPageParam: (lastPage) => {
      console.log('[useExtractedNews] getNextPageParam called', {
        currentPage: lastPage.pagination.page,
        hasNext: lastPage.pagination.hasNext,
        total: lastPage.pagination.total,
        totalPages: lastPage.pagination.totalPages,
        dataLength: lastPage.data.length,
      })

      // If there are more pages, return next page number
      if (lastPage.pagination.hasNext) {
        const nextPage = lastPage.pagination.page + 1
        console.log('[useExtractedNews] Next page:', nextPage)
        return nextPage
      }
      // No more pages
      console.log('[useExtractedNews] No more pages')
      return undefined
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for keywords with optional search
 * @param search - Optional search term to filter keywords
 * @param enabled - Whether to enable the query (default: true)
 */
export function useKeywords(search?: string, enabled = true) {
  return useQuery({
    queryKey: extractedNewsKeys.keywordsWithSearch(search),
    queryFn: () => extractedNewsApi.getKeywords(search),
    staleTime: 5 * 60 * 1000, // 5 minutes (less volatile)
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled,
  })
}

/**
 * Hook for categories list
 */
export function useCategories() {
  return useQuery({
    queryKey: extractedNewsKeys.categories(),
    queryFn: () => extractedNewsApi.getCategories(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * Hook for authors list
 */
export function useAuthors() {
  return useQuery({
    queryKey: extractedNewsKeys.authors(),
    queryFn: () => extractedNewsApi.getAuthors(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * Hook for tags list
 */
export function useTags() {
  return useQuery({
    queryKey: extractedNewsKeys.tags(),
    queryFn: () => extractedNewsApi.getTags(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * Hook for domains list
 */
export function useDomains() {
  return useQuery({
    queryKey: extractedNewsKeys.domains(),
    queryFn: () => extractedNewsApi.getDomains(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * Hook for single extracted news by ID
 * @param id - ID of the extracted news
 */
export function useExtractedNewsById(id: string) {
  return useQuery({
    queryKey: extractedNewsKeys.detail(id),
    queryFn: () => extractedNewsApi.getExtractedNewsById(id),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!id, // Only execute if there's an id
  })
}

// ============================================================================
// 🛠️ UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all extracted news content from infinite query pages
 */
export function getAllExtractedNews(
  data: ReturnType<typeof useExtractedNews>['data']
): App.ExtractedContent[] {
  if (!data?.pages) return []
  return data.pages.flatMap((page) => page.data)
}

/**
 * Get total items count from infinite query
 */
export function getTotalItems(data: ReturnType<typeof useExtractedNews>['data']): number {
  if (!data?.pages || data.pages.length === 0) return 0
  // Total is same across all pages
  return data.pages[0].pagination.total
}
