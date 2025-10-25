/**
 * 📰 API Service for Extracted News (Noticias Extraídas)
 *
 * Connects to /noticias/extracted endpoint
 */

import { ApiClient } from '@/src/services/api/ApiClient'
import {
  mapExtractedContentFromAPI,
  mapPaginatedResponseFromAPI,
  mapKeywordItemFromAPI,
  mapFiltersToQueryParams,
} from '@/src/mappers/extracted-content-filters.mappers'
import type { API, App } from '@/src/types/extracted-content-filters.types'

const BASE_PATH = '/noticias/extracted'

export const extractedNewsApi = {
  /**
   * Get extracted news with filters and pagination
   * GET /noticias/extracted
   */
  getExtractedNews: async (
    filters: App.ExtractedContentFilters
  ): Promise<App.PaginatedResponse<App.ExtractedContent>> => {
    try {
      const rawClient = ApiClient.getRawClient()

      // Convert filters to query params
      const queryParams = mapFiltersToQueryParams(filters)

      // Build query string
      const params = new URLSearchParams()
      Object.entries(queryParams).forEach(([key, value]) => {
        params.append(key, String(value))
      })

      const queryString = params.toString()
      const url = queryString ? `${BASE_PATH}?${queryString}` : BASE_PATH

      const response = await rawClient.get<API.PaginatedResponse<API.ExtractedContent>>(url)

      // Debug logging
      console.log('[extractedNewsApi] Raw response structure:', {
        responseType: typeof response,
        hasData: !!response.data,
        hasPagination: !!response.pagination,
        dataLength: response.data?.length,
        paginationKeys: response.pagination ? Object.keys(response.pagination) : 'no pagination',
        fullStructure: Object.keys(response),
      })

      // Map response (extraer response.data primero)
      return mapPaginatedResponseFromAPI(response.data, mapExtractedContentFromAPI)
    } catch (error) {
      console.error('[extractedNewsApi] Error fetching extracted news:', error)
      throw error
    }
  },

  /**
   * Get keywords with optional search
   * GET /noticias/extracted/keywords
   */
  getKeywords: async (search?: string): Promise<App.KeywordItem[]> => {
    try {
      const rawClient = ApiClient.getRawClient()

      const params = new URLSearchParams()
      if (search) params.append('search', search)

      const queryString = params.toString()
      const url = queryString ? `${BASE_PATH}/keywords?${queryString}` : `${BASE_PATH}/keywords`

      const response = await rawClient.get<API.KeywordItem[]>(url)

      // Map keywords
      return response.data.map(mapKeywordItemFromAPI)
    } catch (error) {
      console.error('[extractedNewsApi] Error fetching keywords:', error)
      throw error
    }
  },

  /**
   * Get categories (aggregated from extracted content)
   */
  getCategories: async (): Promise<App.FilterOption[]> => {
    // TODO: Implementar endpoint en backend para aggregar categorías
    // Por ahora retornamos array vacío
    return []
  },

  /**
   * Get authors (aggregated from extracted content)
   */
  getAuthors: async (): Promise<App.FilterOption[]> => {
    // TODO: Implementar endpoint en backend para aggregar autores
    // Por ahora retornamos array vacío
    return []
  },

  /**
   * Get tags (aggregated from extracted content)
   */
  getTags: async (): Promise<App.FilterOption[]> => {
    // TODO: Implementar endpoint en backend para aggregar tags
    // Por ahora retornamos array vacío
    return []
  },

  /**
   * Get domains (aggregated from extracted content)
   */
  getDomains: async (): Promise<App.FilterOption[]> => {
    // TODO: Implementar endpoint en backend para aggregar dominios
    // Por ahora retornamos array vacío
    return []
  },

  /**
   * Get single extracted news by ID
   * Falls back to searching in list if direct endpoint doesn't exist
   */
  getExtractedNewsById: async (id: string): Promise<App.ExtractedContent | null> => {
    try {
      const rawClient = ApiClient.getRawClient()

      // Try to get all and filter locally
      // This avoids needing a specific endpoint
      const response = await extractedNewsApi.getExtractedNews({
        page: 1,
        limit: 100, // Search in first 100
      })

      const news = response.data.find((n) => n.id === id)
      return news || null
    } catch (error) {
      console.error(`[extractedNewsApi] Error fetching extracted news ${id}:`, error)
      throw error
    }
  },
}
