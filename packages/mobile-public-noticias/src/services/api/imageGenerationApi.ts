/**
 * Image Generation API Service
 * Connects to /image-generation endpoint
 *
 * Pattern: Uses ApiClient.getRawClient() for axios calls
 * All responses unwrap response.data automatically via ApiClient
 */

import { ApiClient } from '@/src/services/api/ApiClient'
import { API, App } from '@/src/types/image-generation.types'
import {
  mapImageGenerationFromAPI,
  mapGenerateImageRequestToAPI,
  mapGenerateImageResponseFromAPI,
  mapJobStatusFromAPI,
  mapUserStatsFromAPI,
  mapPaginatedResponseFromAPI,
  mapFiltersToQueryParams,
  mapStoreInBankMetadataToAPI,
  mapStoreInBankResponseFromAPI,
} from '@/src/mappers/image-generation.mappers'

const BASE_PATH = '/image-generation'

export const imageGenerationApi = {
  /**
   * Generate new image with AI
   * POST /image-generation/generate
   *
   * Backend returns: { message, generation, jobId, estimatedTime }
   *
   * @param request - Image generation request (camelCase)
   * @returns Generation response with job info
   */
  generateImage: async (
    request: App.GenerateImageRequest
  ): Promise<App.GenerateImageResponse> => {
    try {
      const rawClient = ApiClient.getRawClient()
      const apiRequest = mapGenerateImageRequestToAPI(request)

      // AI generation can take 10-60+ seconds, so use longer timeout
      const response = await rawClient.post<API.GenerateImageResponse>(
        `${BASE_PATH}/generate`,
        apiRequest,
        {
          timeout: 120000 // 2 minutes
        }
      )

      // response.data is { message, generation, jobId, estimatedTime }
      return mapGenerateImageResponseFromAPI(response.data)
    } catch (error) {
      console.error('[imageGenerationApi] Error generating image:', error)
      throw error
    }
  },

  /**
   * Get image generation by ID
   * GET /image-generation/:id
   *
   * Backend returns: generation object directly (no wrapper)
   *
   * @param id - Generation ID
   * @returns Image generation details
   */
  getGenerationById: async (id: string): Promise<App.ImageGeneration> => {
    try {
      const rawClient = ApiClient.getRawClient()

      // Backend returns generation object directly
      const response = await rawClient.get<API.ImageGeneration>(
        `${BASE_PATH}/${id}`
      )

      // response.data is the generation object
      return mapImageGenerationFromAPI(response.data)
    } catch (error) {
      console.error(`[imageGenerationApi] Error fetching generation ${id}:`, error)
      throw error
    }
  },

  /**
   * List user's image generations with pagination and filters
   * GET /image-generation
   *
   * Backend returns: { data: [...], pagination: {...} }
   *
   * @param filters - Optional filters (page, limit, model, quality, etc.)
   * @returns Paginated list of generations
   */
  getGenerations: async (
    filters?: App.ImageGenerationFilters
  ): Promise<App.PaginatedResponse<App.ImageGeneration>> => {
    try {
      const rawClient = ApiClient.getRawClient()

      // Convert filters to query params
      const params = filters ? mapFiltersToQueryParams(filters) : {}

      // Build query string
      const queryString = new URLSearchParams(
        Object.entries(params).map(([key, value]) => [key, String(value)])
      ).toString()

      const url = queryString ? `${BASE_PATH}?${queryString}` : BASE_PATH

      // Backend returns paginated response directly
      const response = await rawClient.get<
        API.PaginatedResponse<API.ImageGeneration>
      >(url)

      // response.data is the paginated response
      return mapPaginatedResponseFromAPI(
        response.data,
        mapImageGenerationFromAPI
      )
    } catch (error) {
      console.error('[imageGenerationApi] Error fetching generations:', error)
      throw error
    }
  },

  /**
   * Get job status
   * GET /image-generation/job/:jobId/status
   *
   * @param jobId - BullMQ job ID
   * @returns Job status with progress
   */
  getJobStatus: async (jobId: string | number): Promise<App.JobStatus> => {
    try {
      const rawClient = ApiClient.getRawClient()

      const response = await rawClient.get<API.JobStatus>(
        `${BASE_PATH}/job/${jobId}/status`
      )

      return mapJobStatusFromAPI(response.data)
    } catch (error) {
      console.error(`[imageGenerationApi] Error fetching job status ${jobId}:`, error)
      throw error
    }
  },

  /**
   * Store generation in image bank (update metadata)
   * POST /image-generation/:id/store-in-bank
   *
   * @param id - Generation ID
   * @param metadata - Keywords, categories, alt text, caption
   * @returns Success response
   */
  storeInBank: async (
    id: string,
    metadata: App.StoreInBankMetadata
  ): Promise<App.StoreInBankResponse> => {
    try {
      const rawClient = ApiClient.getRawClient()
      const apiMetadata = mapStoreInBankMetadataToAPI(metadata)

      const response = await rawClient.post<API.StoreInBankResponse>(
        `${BASE_PATH}/${id}/store-in-bank`,
        apiMetadata
      )

      return mapStoreInBankResponseFromAPI(response.data)
    } catch (error) {
      console.error(`[imageGenerationApi] Error storing generation ${id} in bank:`, error)
      throw error
    }
  },

  /**
   * Get user statistics
   * GET /image-generation/stats/summary
   *
   * @returns User stats (total, cost, by model, by quality, etc.)
   */
  getUserStats: async (): Promise<App.UserStats> => {
    try {
      const rawClient = ApiClient.getRawClient()

      const response = await rawClient.get<API.UserStats>(
        `${BASE_PATH}/stats/summary`
      )

      return mapUserStatsFromAPI(response.data)
    } catch (error) {
      console.error('[imageGenerationApi] Error fetching user stats:', error)
      throw error
    }
  },

  /**
   * Delete generation
   * DELETE /image-generation/:id
   *
   * @param id - Generation ID
   * @returns void
   */
  deleteGeneration: async (id: string): Promise<void> => {
    try {
      const rawClient = ApiClient.getRawClient()

      await rawClient.delete(`${BASE_PATH}/${id}`)

      console.log(`[imageGenerationApi] Generation ${id} deleted successfully`)
    } catch (error) {
      console.error(`[imageGenerationApi] Error deleting generation ${id}:`, error)
      throw error
    }
  },
}
