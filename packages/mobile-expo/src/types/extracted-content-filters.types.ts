/**
 * 🎯 Types for Extracted Content Filtering System
 *
 * Namespace pattern:
 * - API: Backend response types (snake_case)
 * - App: Frontend types (camelCase)
 */

// ============================================================================
// 📦 API NAMESPACE - Backend Response Types
// ============================================================================

export namespace API {
  /**
   * Extracted content item from backend
   * ⚠️ IMPORTANTE: El backend devuelve camelCase (no snake_case) porque son documentos de MongoDB
   */
  export interface ExtractedContent {
    _id: string
    sourceUrl: string
    domain?: string
    facebookPostId?: string
    title?: string
    content?: string
    images: string[]
    publishedAt?: string
    author?: string
    category?: string
    categories: string[]
    excerpt?: string
    tags: string[]
    keywords: string[]
    extractedAt: string
    status: 'pending' | 'extracted' | 'failed' | 'processing'
    isProcessed?: boolean
    processedAt?: string
    createdAt: string
    updatedAt: string
  }

  /**
   * Paginated response from backend
   */
  export interface PaginatedResponse<T> {
    data: T[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }

  /**
   * Keyword with count from backend
   */
  export interface KeywordItem {
    keyword: string
    count: number
  }

  /**
   * Filter option item (category, author, tag)
   */
  export interface FilterOption {
    value: string
    count: number
  }
}

// ============================================================================
// 📱 APP NAMESPACE - Frontend Types
// ============================================================================

export namespace App {
  /**
   * Extracted content item for frontend
   */
  export interface ExtractedContent {
    id: string
    sourceUrl: string
    domain?: string
    facebookPostId?: string
    title?: string
    content?: string
    images: string[]
    publishedAt?: Date
    author?: string
    category?: string
    categories: string[]
    excerpt?: string
    tags: string[]
    keywords: string[]
    extractedAt: Date
    status: 'pending' | 'extracted' | 'failed' | 'processing'
    isProcessed?: boolean
    processedAt?: Date
    createdAt: Date
    updatedAt: Date
  }

  /**
   * Status filter type
   */
  export type StatusFilter = 'pending' | 'extracted' | 'failed' | 'processing'

  /**
   * Sort by options
   */
  export type SortBy = 'extractedAt' | 'publishedAt' | 'title' | 'category' | 'author'

  /**
   * Sort order
   */
  export type SortOrder = 'asc' | 'desc'

  /**
   * Complete filter object
   */
  export interface ExtractedContentFilters {
    // Status
    status?: StatusFilter[]

    // Text search
    search?: string

    // Categorization
    category?: string
    author?: string
    tags?: string[]
    keywords?: string[]

    // Domain
    domain?: string

    // Date range (for extractedAt)
    dateFrom?: Date
    dateTo?: Date

    // Images
    hasImages?: boolean

    // Sorting
    sortBy?: SortBy
    sortOrder?: SortOrder

    // Pagination
    page?: number
    limit?: number
  }

  /**
   * Filter chip type
   */
  export type FilterChipType =
    | 'status'
    | 'category'
    | 'author'
    | 'tag'
    | 'keyword'
    | 'domain'
    | 'search'
    | 'hasImages'
    | 'dateRange'

  /**
   * Filter chip item
   */
  export interface FilterChip {
    id: string
    label: string
    type: FilterChipType
    value: string | boolean
    onRemove: () => void
  }

  /**
   * Sort option for UI
   */
  export interface SortOption {
    value: SortBy
    label: string
    icon?: string
  }

  /**
   * Keyword item for selector
   */
  export interface KeywordItem {
    keyword: string
    count: number
    selected?: boolean
  }

  /**
   * Filter option for selectors (category, author, tag)
   */
  export interface FilterOption {
    value: string
    label: string
    count: number
    selected?: boolean
  }

  /**
   * Pagination info
   */
  export interface PaginationInfo {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }

  /**
   * Paginated response
   */
  export interface PaginatedResponse<T> {
    data: T[]
    pagination: PaginationInfo
  }
}
