/**
 * 🎯 Types para sistema de filtrado y ordenamiento de contenido generado
 * Patrón: API namespace (camelCase) ↔ App namespace (camelCase)
 * El backend usa camelCase en los DTOs
 */

// ============================================================
// API TYPES (camelCase - Backend Request/Response)
// ============================================================

export namespace API {
  export type GenerationStatus =
    | 'pending'
    | 'generating'
    | 'completed'
    | 'failed'
    | 'reviewing'
    | 'approved'
    | 'rejected'

  export type SortBy =
    | 'generatedAt'
    | 'publishedAt'
    | 'title'
    | 'qualityScore'
    | 'category'

  export type SortOrder = 'asc' | 'desc'

  /**
   * Query parameters enviados al backend (camelCase porque el backend usa camelCase)
   */
  export interface GeneratedContentFilters {
    status?: GenerationStatus[]
    agentId?: string
    templateId?: string
    providerId?: string
    dateFrom?: string // ISO string
    dateTo?: string // ISO string
    minQualityScore?: number
    hasReview?: boolean
    isPublished?: boolean
    category?: string
    tags?: string[]
    search?: string
    sortBy?: SortBy
    sortOrder?: SortOrder
    page?: number
    limit?: number
  }

  /**
   * Response paginada del backend
   */
  export interface PaginatedGeneratedContentResponse {
    data: GeneratedContentResponse[]
    total: number
    page: number
    limit: number
    totalPages: number
  }

  /**
   * Contenido generado individual (response del backend)
   */
  export interface GeneratedContentResponse {
    id: string
    originalContent: {
      id: string
      title: string
      content: string
      sourceUrl?: string
      publishedAt?: string
      images?: string[]
    }
    agent: {
      id: string
      name: string
      type: string
    }
    template: {
      id: string
      name: string
      type: string
    }
    provider: {
      id: string
      name: string
      model: string
    }
    generatedTitle: string
    generatedContent: string
    generatedKeywords: string[]
    generatedTags: string[]
    generatedCategory?: string
    generatedSummary?: string
    extendedSummary?: string
    socialMediaCopies?: {
      facebook?: {
        hook: string
        copy: string
        emojis: string[]
        hookType: string
        estimatedEngagement: string
      }
      twitter?: {
        tweet: string
        hook: string
        emojis: string[]
        hookType: string
        threadIdeas: string[]
      }
      instagram?: string
      linkedin?: string
    }
    seoData?: {
      metaDescription?: string
      focusKeyword?: string
      altText?: string
      canonicalUrl?: string
      ogTitle?: string
      ogDescription?: string
    }
    status: GenerationStatus
    generationMetadata: {
      model: string
      promptTokens: number
      completionTokens: number
      totalTokens: number
      cost: number
      processingTime: number
      temperature: number
      maxTokens: number
      finishReason: string
      contentQuality?: number
    }
    qualityMetrics?: {
      readabilityScore?: number
      sentimentScore?: number
      coherenceScore?: number
      originalityScore?: number
      seoScore?: number
      userRating?: number
      humanReviewScore?: number
    }
    comparisonMetrics?: {
      similarityToOriginal?: number
      lengthRatio?: number
      keywordDensity?: number
      readingLevel?: string
      toneAnalysis?: string
    }
    errors: string[]
    warnings: string[]
    reviewInfo?: {
      reviewerId?: string
      reviewedAt?: string
      reviewNotes?: string
      changesRequested?: string[]
      approvalLevel?: 'auto' | 'human' | 'editor'
    }
    publishingInfo?: {
      publishedAt?: string
      publishedBy?: string
      platform?: string
      url?: string
      socialShares?: number
      views?: number
    }
    versioning?: {
      version: number
      previousVersionId?: string
      changeLog?: string
      isLatest: boolean
    }
    generatedAt: string
    originalPublishedAt?: string // Campo denormalizado para ordenamiento
    createdAt: string
    updatedAt: string
  }
}

// ============================================================
// APP TYPES (camelCase - Frontend Usage)
// ============================================================

export namespace App {
  export type GenerationStatus = API.GenerationStatus
  export type SortBy = API.SortBy
  export type SortOrder = API.SortOrder

  /**
   * Filtros usados en la app (camelCase)
   */
  export interface GeneratedContentFilters {
    status?: GenerationStatus[]
    agentId?: string
    templateId?: string
    providerId?: string
    dateFrom?: Date
    dateTo?: Date
    minQualityScore?: number
    hasReview?: boolean
    isPublished?: boolean
    category?: string
    tags?: string[]
    search?: string
    sortBy?: SortBy
    sortOrder?: SortOrder
    page?: number
    limit?: number
  }

  /**
   * Response paginada para la app
   */
  export interface PaginatedGeneratedContentResponse {
    data: GeneratedContent[]
    total: number
    page: number
    limit: number
    totalPages: number
  }

  /**
   * Contenido generado individual (app format)
   */
  export interface GeneratedContent {
    id: string
    originalContent: {
      id: string
      title: string
      content: string
      sourceUrl?: string
      publishedAt?: Date
      images?: string[]
    }
    agent: {
      id: string
      name: string
      type: string
    }
    template: {
      id: string
      name: string
      type: string
    }
    provider: {
      id: string
      name: string
      model: string
    }
    generatedTitle: string
    generatedContent: string
    generatedKeywords: string[]
    generatedTags: string[]
    generatedCategory?: string
    generatedSummary?: string
    extendedSummary?: string
    socialMediaCopies?: {
      facebook?: {
        hook: string
        copy: string
        emojis: string[]
        hookType: string
        estimatedEngagement: string
      }
      twitter?: {
        tweet: string
        hook: string
        emojis: string[]
        hookType: string
        threadIdeas: string[]
      }
      instagram?: string
      linkedin?: string
    }
    seoData?: {
      metaDescription?: string
      focusKeyword?: string
      altText?: string
      canonicalUrl?: string
      ogTitle?: string
      ogDescription?: string
    }
    status: GenerationStatus
    generationMetadata: {
      model: string
      promptTokens: number
      completionTokens: number
      totalTokens: number
      cost: number
      processingTime: number
      temperature: number
      maxTokens: number
      finishReason: string
      contentQuality?: number
    }
    qualityMetrics?: {
      readabilityScore?: number
      sentimentScore?: number
      coherenceScore?: number
      originalityScore?: number
      seoScore?: number
      userRating?: number
      humanReviewScore?: number
    }
    comparisonMetrics?: {
      similarityToOriginal?: number
      lengthRatio?: number
      keywordDensity?: number
      readingLevel?: string
      toneAnalysis?: string
    }
    errors: string[]
    warnings: string[]
    reviewInfo?: {
      reviewerId?: string
      reviewedAt?: Date
      reviewNotes?: string
      changesRequested?: string[]
      approvalLevel?: 'auto' | 'human' | 'editor'
    }
    publishingInfo?: {
      publishedAt?: Date
      publishedBy?: string
      platform?: string
      url?: string
      socialShares?: number
      views?: number
    }
    versioning?: {
      version: number
      previousVersionId?: string
      changeLog?: string
      isLatest: boolean
    }
    generatedAt: Date
    originalPublishedAt?: Date // Campo denormalizado para ordenamiento
    createdAt: Date
    updatedAt: Date
  }

  /**
   * Estado de filtros activos para UI
   */
  export interface ActiveFilters {
    status: GenerationStatus[]
    agentId?: string
    templateId?: string
    providerId?: string
    dateRange?: {
      from: Date
      to: Date
    }
    minQualityScore?: number
    hasReview?: boolean
    isPublished?: boolean
    category?: string
    tags: string[]
    search?: string
  }

  /**
   * Chip de filtro activo para UI
   */
  export interface FilterChip {
    id: string
    label: string
    type: 'status' | 'agent' | 'template' | 'provider' | 'date' | 'quality' | 'review' | 'published' | 'category' | 'tag' | 'search'
    value: unknown
    onRemove: () => void
  }

  /**
   * Opciones de ordenamiento para UI
   */
  export interface SortOption {
    value: SortBy
    label: string
    icon?: string
  }
}
