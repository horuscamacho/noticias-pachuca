/**
 * Image Generation Mappers
 * Bidirectional transformations between API (snake_case) and App (camelCase)
 */

import { API, App } from '@/src/types/image-generation.types'

/**
 * Map ImageGeneration from API format to App format
 * Uses spread operator for efficiency - only transforms specific fields
 *
 * @param apiGeneration - Image generation from backend (camelCase - NestJS)
 * @returns Image generation for app (camelCase)
 */
export function mapImageGenerationFromAPI(
  apiGeneration: API.ImageGeneration
): App.ImageGeneration {
  return {
    ...apiGeneration,
    id: apiGeneration._id,
    createdAt: new Date(apiGeneration.createdAt),
    updatedAt: new Date(apiGeneration.updatedAt),
  } as App.ImageGeneration
}

/**
 * Map GenerateImageRequest from App format to API format
 * NOTE: No transformation needed - backend uses same camelCase format
 *
 * @param appRequest - Generate image request from app (camelCase)
 * @returns Generate image request for backend (camelCase - NestJS convention)
 */
export function mapGenerateImageRequestToAPI(
  appRequest: App.GenerateImageRequest
): API.GenerateImageRequest {
  // No transformation needed - types are identical
  return appRequest
}

/**
 * Map GenerateImageResponse from API format to App format
 * Only transforms nested generation object
 *
 * @param apiResponse - Generate image response from backend (camelCase)
 * @returns Generate image response for app (camelCase)
 */
export function mapGenerateImageResponseFromAPI(
  apiResponse: API.GenerateImageResponse
): App.GenerateImageResponse {
  return {
    ...apiResponse,
    generation: mapImageGenerationFromAPI(apiResponse.generation),
  }
}

/**
 * Map JobStatus from API format to App format
 * NOTE: No transformation needed - backend uses same camelCase format
 *
 * @param apiStatus - Job status from backend (camelCase)
 * @returns Job status for app (camelCase)
 */
export function mapJobStatusFromAPI(apiStatus: API.JobStatus): App.JobStatus {
  // No transformation needed - types are identical
  return apiStatus
}

/**
 * Map UserStats from API format to App format
 * NOTE: No transformation needed - backend uses same camelCase format
 *
 * @param apiStats - User stats from backend (camelCase)
 * @returns User stats for app (camelCase)
 */
export function mapUserStatsFromAPI(apiStats: API.UserStats): App.UserStats {
  // No transformation needed - types are identical
  return apiStats
}

/**
 * Map PaginatedResponse from API format to App format
 * @param apiResponse - Paginated response from backend (camelCase)
 * @param itemMapper - Function to map individual items
 * @returns Paginated response for app (camelCase)
 */
export function mapPaginatedResponseFromAPI<TApi, TApp>(
  apiResponse: API.PaginatedResponse<TApi>,
  itemMapper: (item: TApi) => TApp
): App.PaginatedResponse<TApp> {
  return {
    data: apiResponse.data.map(itemMapper),
    pagination: {
      page: apiResponse.pagination.page,
      limit: apiResponse.pagination.limit,
      total: apiResponse.pagination.total,
      totalPages: apiResponse.pagination.totalPages,
      hasNext: apiResponse.pagination.hasNext,
      hasPrev: apiResponse.pagination.hasPrev,
    },
  }
}

/**
 * Map ImageGenerationFilters from App format to API query params
 * @param filters - Filters from app (camelCase)
 * @returns Query params for backend (snake_case)
 */
export function mapFiltersToQueryParams(
  filters: App.ImageGenerationFilters
): Record<string, string | number> {
  const params: Record<string, string | number> = {}

  if (filters.page !== undefined) params.page = filters.page
  if (filters.limit !== undefined) params.limit = filters.limit
  if (filters.model) params.model = filters.model
  if (filters.quality) params.quality = filters.quality
  if (filters.sortBy) params.sortBy = filters.sortBy
  if (filters.sortOrder) params.sortOrder = filters.sortOrder

  return params
}

/**
 * Map StoreInBankMetadata from App format to API format
 * NOTE: No transformation needed - backend uses same camelCase format
 *
 * @param appMetadata - Metadata from app (camelCase)
 * @returns Metadata for backend (camelCase - NestJS convention)
 */
export function mapStoreInBankMetadataToAPI(
  appMetadata: App.StoreInBankMetadata
): API.StoreInBankMetadata {
  // No transformation needed - types are identical
  return appMetadata
}

/**
 * Map StoreInBankResponse from API format to App format
 * NOTE: No transformation needed - backend uses same camelCase format
 *
 * @param apiResponse - Response from backend (camelCase)
 * @returns Response for app (camelCase)
 */
export function mapStoreInBankResponseFromAPI(
  apiResponse: API.StoreInBankResponse
): App.StoreInBankResponse {
  // No transformation needed - types are identical
  return apiResponse
}
