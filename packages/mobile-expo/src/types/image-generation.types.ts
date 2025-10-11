/**
 * Image Generation Types
 * Types for AI Image Generation feature
 *
 * Pattern: API namespace (snake_case) + App namespace (camelCase)
 */

// =============================================================================
// API NAMESPACE - Backend format (snake_case)
// =============================================================================

export namespace API {
  /**
   * Image Generation entity from backend
   * NOTA: Backend usa camelCase (convención NestJS/Mongoose)
   */
  export interface ImageGeneration {
    _id: string
    prompt: string
    model: string
    quality: 'low' | 'medium' | 'high'
    size: string
    brandingConfig: {
      watermarkText: string
      watermarkPosition: string
      includeDecorations: boolean
      keywords?: string[]
    }
    generatedImageUrl?: string
    imageBankId?: string
    cost: number
    generationTime?: number
    processingTime?: number
    aiGenerated: boolean
    c2paIncluded: boolean
    editorialReviewed: boolean
    usedInArticles: string[]
    createdBy: string
    extractedNoticiaId?: string
    sourceImageId?: string
    sourceImageUrl?: string
    createdAt: string
    updatedAt: string
  }

  /**
   * Request to generate new image
   * NOTA: Backend usa camelCase (convención NestJS)
   */
  export interface GenerateImageRequest {
    prompt: string
    watermarkText?: string
    includeDecorations?: boolean
    keywords?: string[]
    model?: string
    quality?: 'low' | 'medium' | 'high'
    size?: string
    extractedNoticiaId?: string
    sourceImageId?: string
    sourceImageUrl?: string
  }

  /**
   * Response after generating image
   */
  export interface GenerateImageResponse {
    message: string
    generation: ImageGeneration
    jobId: string | number
    estimatedTime: string
  }

  /**
   * Job status from BullMQ
   */
  export interface JobStatus {
    id: string | number
    state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed'
    progress: number
    failedReason?: string
    data: unknown
    finishedOn?: number
    processedOn?: number
  }

  /**
   * User statistics summary
   */
  export interface UserStats {
    total: number
    totalCost: number
    averageCost: number
    byModel: Record<string, number>
    byQuality: Record<string, number>
    reviewed: number
    pending: number
  }

  /**
   * Paginated response wrapper
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
   * Store in bank metadata
   * NOTA: Backend usa camelCase (convención NestJS)
   */
  export interface StoreInBankMetadata {
    keywords?: string[]
    categories?: string[]
    altText?: string
    caption?: string
  }

  /**
   * Store in bank response
   */
  export interface StoreInBankResponse {
    message: string
    generationId: string
  }
}

// =============================================================================
// APP NAMESPACE - Frontend format (camelCase)
// =============================================================================

export namespace App {
  /**
   * Image Generation entity for app
   */
  export interface ImageGeneration {
    id: string
    prompt: string
    model: string
    quality: 'low' | 'medium' | 'high'
    size: string
    brandingConfig: {
      watermarkText: string
      watermarkPosition: string
      includeDecorations: boolean
      keywords?: string[]
    }
    generatedImageUrl?: string
    imageBankId?: string
    cost: number
    generationTime?: number
    processingTime?: number
    aiGenerated: boolean
    c2paIncluded: boolean
    editorialReviewed: boolean
    usedInArticles: string[]
    createdBy: string
    extractedNoticiaId?: string
    sourceImageId?: string
    sourceImageUrl?: string
    createdAt: Date
    updatedAt: Date
    // Additional fields from queue/processing (may not always be present)
    jobId?: string | number
    status?: 'queued' | 'processing' | 'completed' | 'failed'
    progress?: number
    error?: string
    blurhash?: string
    resultUrl?: string // Alias for generatedImageUrl (backward compatibility)
  }

  /**
   * Request to generate new image
   */
  export interface GenerateImageRequest {
    prompt: string
    watermarkText?: string
    includeDecorations?: boolean
    keywords?: string[]
    model?: string
    quality?: 'low' | 'medium' | 'high'
    size?: string
    extractedNoticiaId?: string
    sourceImageId?: string
    sourceImageUrl?: string
  }

  /**
   * Response after generating image
   */
  export interface GenerateImageResponse {
    message: string
    generation: ImageGeneration
    jobId: string | number
    estimatedTime: string
  }

  /**
   * Job status from BullMQ
   */
  export interface JobStatus {
    id: string | number
    state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed'
    progress: number
    failedReason?: string
    data: unknown
    finishedOn?: number
    processedOn?: number
  }

  /**
   * User statistics summary
   */
  export interface UserStats {
    total: number
    totalCost: number
    averageCost: number
    byModel: Record<string, number>
    byQuality: Record<string, number>
    reviewed: number
    pending: number
  }

  /**
   * Paginated response wrapper
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
   * Filters for listing image generations
   */
  export interface ImageGenerationFilters {
    page?: number
    limit?: number
    model?: string
    quality?: 'low' | 'medium' | 'high'
    sortBy?: 'createdAt' | 'cost' | 'quality'
    sortOrder?: 'asc' | 'desc'
  }

  /**
   * Store in bank metadata
   */
  export interface StoreInBankMetadata {
    keywords?: string[]
    categories?: string[]
    altText?: string
    caption?: string
  }

  /**
   * Store in bank response
   */
  export interface StoreInBankResponse {
    message: string
    generationId: string
  }
}
