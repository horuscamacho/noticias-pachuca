/**
 * 🔄 Mappers for Extracted Content Filtering System
 *
 * Transforms between API (snake_case) and App (camelCase) namespaces
 */

import type { API, App } from '@/src/types/extracted-content-filters.types'

// ============================================================================
// 📦 API → APP MAPPERS
// ============================================================================

/**
 * Map API extracted content to App extracted content
 * ✅ FIX: Backend devuelve camelCase (MongoDB docs), no snake_case
 */
export function mapExtractedContentFromAPI(
  apiContent: API.ExtractedContent
): App.ExtractedContent {
  return {
    id: apiContent._id,
    sourceUrl: apiContent.sourceUrl,
    domain: apiContent.domain,
    facebookPostId: apiContent.facebookPostId,
    title: apiContent.title,
    content: apiContent.content,
    images: apiContent.images,
    publishedAt: apiContent.publishedAt ? new Date(apiContent.publishedAt) : undefined,
    author: apiContent.author,
    category: apiContent.category,
    categories: apiContent.categories,
    excerpt: apiContent.excerpt,
    tags: apiContent.tags,
    keywords: apiContent.keywords,
    extractedAt: new Date(apiContent.extractedAt),
    status: apiContent.status,
    isProcessed: apiContent.isProcessed,
    processedAt: apiContent.processedAt ? new Date(apiContent.processedAt) : undefined,
    createdAt: new Date(apiContent.createdAt),
    updatedAt: new Date(apiContent.updatedAt),
  }
}

/**
 * Map API paginated response to App paginated response
 */
export function mapPaginatedResponseFromAPI<T>(
  apiResponse: API.PaginatedResponse<API.ExtractedContent>,
  mapper: (item: API.ExtractedContent) => T
): App.PaginatedResponse<T> {
  return {
    data: apiResponse.data.map(mapper),
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
 * Map API keyword item to App keyword item
 */
export function mapKeywordItemFromAPI(apiKeyword: API.KeywordItem): App.KeywordItem {
  return {
    keyword: apiKeyword.keyword,
    count: apiKeyword.count,
    selected: false,
  }
}

/**
 * Map API filter option to App filter option
 */
export function mapFilterOptionFromAPI(apiOption: API.FilterOption): App.FilterOption {
  return {
    value: apiOption.value,
    label: apiOption.value,
    count: apiOption.count,
    selected: false,
  }
}

// ============================================================================
// 📱 APP → API QUERY PARAMS
// ============================================================================

/**
 * Convert App filters to API query params
 */
export function mapFiltersToQueryParams(
  filters: App.ExtractedContentFilters
): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {}

  // Pagination
  if (filters.page !== undefined) params.page = filters.page
  if (filters.limit !== undefined) params.limit = filters.limit

  // Sorting
  if (filters.sortBy) params.sortBy = filters.sortBy
  if (filters.sortOrder) params.sortOrder = filters.sortOrder

  // Status (comma-separated if multiple)
  if (filters.status && filters.status.length > 0) {
    params.status = filters.status.join(',')
  }

  // Text search
  if (filters.search) params.searchText = filters.search

  // Categorization
  if (filters.category) params.category = filters.category
  if (filters.author) params.author = filters.author

  // Tags (comma-separated)
  if (filters.tags && filters.tags.length > 0) {
    params.tags = filters.tags.join(',')
  }

  // Keywords (comma-separated)
  if (filters.keywords && filters.keywords.length > 0) {
    params.keywords = filters.keywords.join(',')
  }

  // Domain
  if (filters.domain) params.domain = filters.domain

  // Date range
  if (filters.dateFrom) params.dateFrom = filters.dateFrom.toISOString()
  if (filters.dateTo) params.dateTo = filters.dateTo.toISOString()

  // Images
  if (filters.hasImages !== undefined) params.hasImages = filters.hasImages

  return params
}

// ============================================================================
// 🎨 UI HELPERS
// ============================================================================

/**
 * Get status label in Spanish
 */
export function getStatusLabel(status: App.StatusFilter): string {
  const labels: Record<App.StatusFilter, string> = {
    pending: 'Pendiente',
    extracted: 'Extraído',
    failed: 'Fallido',
    processing: 'Procesando',
  }
  return labels[status]
}

/**
 * Get sort option label in Spanish
 */
export function getSortByLabel(sortBy: App.SortBy): string {
  const labels: Record<App.SortBy, string> = {
    extractedAt: 'Fecha de extracción',
    publishedAt: 'Fecha de publicación',
    title: 'Título',
    category: 'Categoría',
    author: 'Autor',
  }
  return labels[sortBy]
}

/**
 * Get all sort options for UI
 */
export function getAllSortOptions(): App.SortOption[] {
  return [
    { value: 'extractedAt', label: 'Fecha de extracción', icon: 'calendar' },
    { value: 'publishedAt', label: 'Fecha de publicación', icon: 'calendar-check' },
    { value: 'title', label: 'Título', icon: 'text' },
    { value: 'category', label: 'Categoría', icon: 'tag' },
    { value: 'author', label: 'Autor', icon: 'user' },
  ]
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Format relative time (e.g., "hace 2 horas")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours} h`
  if (diffDays < 7) return `Hace ${diffDays} d`
  return formatDate(date)
}
