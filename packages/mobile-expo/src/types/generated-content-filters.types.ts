/**
 * 🎯 Types para sistema de filtrado y ordenamiento de contenido generado
 * Patrón: API namespace (snake_case) ↔ App namespace (camelCase)
 */

// ============================================================
// API TYPES (snake_case - Backend Response)
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
   * Query parameters enviados al backend
   */
  export interface GeneratedContentFilters {
    status?: GenerationStatus[]
    agent_id?: string
    template_id?: string
    provider_id?: string
    date_from?: string // ISO string
    date_to?: string // ISO string
    min_quality_score?: number
    has_review?: boolean
    is_published?: boolean
    category?: string
    tags?: string[]
    search?: string
    sort_by?: SortBy
    sort_order?: SortOrder
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
    total_pages: number
  }

  /**
   * Contenido generado individual (response del backend)
   */
  export interface GeneratedContentResponse {
    id: string
    original_content: {
      id: string
      title: string
      content: string
      source_url?: string
      published_at?: string
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
    generated_title: string
    generated_content: string
    generated_keywords: string[]
    generated_tags: string[]
    generated_category?: string
    generated_summary?: string
    extended_summary?: string
    social_media_copies?: {
      facebook?: {
        hook: string
        copy: string
        emojis: string[]
        hook_type: string
        estimated_engagement: string
      }
      twitter?: {
        tweet: string
        hook: string
        emojis: string[]
        hook_type: string
        thread_ideas: string[]
      }
      instagram?: string
      linkedin?: string
    }
    seo_data?: {
      meta_description?: string
      focus_keyword?: string
      alt_text?: string
      canonical_url?: string
      og_title?: string
      og_description?: string
    }
    status: GenerationStatus
    generation_metadata: {
      model: string
      prompt_tokens: number
      completion_tokens: number
      total_tokens: number
      cost: number
      processing_time: number
      temperature: number
      max_tokens: number
      finish_reason: string
      content_quality?: number
    }
    quality_metrics?: {
      readability_score?: number
      sentiment_score?: number
      coherence_score?: number
      originality_score?: number
      seo_score?: number
      user_rating?: number
      human_review_score?: number
    }
    comparison_metrics?: {
      similarity_to_original?: number
      length_ratio?: number
      keyword_density?: number
      reading_level?: string
      tone_analysis?: string
    }
    errors: string[]
    warnings: string[]
    review_info?: {
      reviewer_id?: string
      reviewed_at?: string
      review_notes?: string
      changes_requested?: string[]
      approval_level?: 'auto' | 'human' | 'editor'
    }
    publishing_info?: {
      published_at?: string
      published_by?: string
      platform?: string
      url?: string
      social_shares?: number
      views?: number
    }
    versioning?: {
      version: number
      previous_version_id?: string
      change_log?: string
      is_latest: boolean
    }
    generated_at: string
    original_published_at?: string // Campo denormalizado para ordenamiento
    created_at: string
    updated_at: string
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
