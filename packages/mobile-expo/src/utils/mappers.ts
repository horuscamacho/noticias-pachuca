import { API, App } from '@/src/types/auth.types'

export class UserMapper {
  static toApp(apiUser: any): App.User {
    // El backend devuelve userId en lugar de id, y faltan muchos campos
    return {
      id: apiUser.userId || apiUser.id || '',
      username: apiUser.username || '',
      email: apiUser.email || '',
      firstName: apiUser.first_name || apiUser.firstName || '',
      lastName: apiUser.last_name || apiUser.lastName || '',
      roles: apiUser.roles || [],
      permissions: apiUser.permissions || [],
      isActive: apiUser.is_active ?? apiUser.isActive ?? true,
      emailVerified: apiUser.email_verified ?? apiUser.emailVerified ?? false,
      lastLoginAt: apiUser.last_login_at ? new Date(apiUser.last_login_at) : null,
      createdAt: apiUser.created_at ? new Date(apiUser.created_at) : new Date(),
      updatedAt: apiUser.updated_at ? new Date(apiUser.updated_at) : new Date()
    }
  }

  static toAPI(appUser: App.User): API.User {
    return {
      id: appUser.id,
      username: appUser.username,
      email: appUser.email,
      first_name: appUser.firstName,
      last_name: appUser.lastName,
      roles: appUser.roles,
      permissions: appUser.permissions,
      is_active: appUser.isActive,
      email_verified: appUser.emailVerified,
      last_login_at: appUser.lastLoginAt?.toISOString() || null,
      created_at: appUser.createdAt.toISOString(),
      updated_at: appUser.updatedAt.toISOString()
    }
  }
}

export class AuthMapper {
  static loginRequestToAPI(credentials: App.LoginCredentials, deviceId: string): API.LoginRequest {
    const isEmail = credentials.emailOrUsername.includes('@')

    return {
      ...(isEmail ? { email: credentials.emailOrUsername } : { username: credentials.emailOrUsername }),
      password: credentials.password
      // device_id y platform van en headers, no en body
    }
  }

  static registerDataToAPI(data: App.RegisterData): API.RegisterRequest {
    return {
      email: data.email,
      username: data.username,
      password: data.password,
      confirm_password: data.confirmPassword,
      first_name: data.firstName,
      last_name: data.lastName,
      terms_accepted: data.termsAccepted
    }
  }

  static loginResponseToApp(response: API.LoginResponse): App.AuthSession {
    // El backend solo devuelve tokens, necesitamos obtener el user por separado
    return {
      user: null, // Se obtendrá después con getCurrentUser()
      tokens: TokenMapper.toApp({
        access_token: response.accessToken,
        refresh_token: response.refreshToken,
        token_type: response.tokenType,
        expires_in: response.expiresIn
      }),
      platform: 'mobile',
      authenticatedAt: new Date()
    }
  }

  static changePasswordToAPI(data: App.ChangePasswordData): API.ChangePasswordRequest {
    return {
      current_password: data.currentPassword,
      new_password: data.newPassword
    }
  }

  static forgotPasswordToAPI(data: App.ForgotPasswordData): API.ForgotPasswordRequest {
    return {
      email: data.email
    }
  }

  static resetPasswordToAPI(data: App.ResetPasswordData): API.ResetPasswordRequest {
    return {
      token: data.token,
      new_password: data.newPassword,
      confirm_new_password: data.confirmNewPassword
    }
  }
}

export class TokenMapper {
  static toApp(apiTokens: {
    access_token: string
    refresh_token: string
    token_type: string
    expires_in: number
  }): App.TokenPair {
    return {
      accessToken: apiTokens.access_token,
      refreshToken: apiTokens.refresh_token,
      tokenType: apiTokens.token_type,
      expiresIn: apiTokens.expires_in,
      expiresAt: new Date(Date.now() + apiTokens.expires_in * 1000)
    }
  }

  static refreshResponseToApp(response: API.RefreshTokenResponse): App.TokenPair {
    return TokenMapper.toApp({
      access_token: response.access_token,
      refresh_token: response.refresh_token,
      token_type: response.token_type,
      expires_in: response.expires_in
    })
  }
}

export class ErrorMapper {
  static toAuthError(error: unknown): App.AuthError {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response: { data: { message?: string; code?: string; field?: string } } }
      return {
        code: axiosError.response.data.code || 'UNKNOWN_ERROR',
        message: axiosError.response.data.message || 'An unexpected error occurred',
        field: axiosError.response.data.field
      }
    }

    if (error instanceof Error) {
      return {
        code: 'CLIENT_ERROR',
        message: error.message
      }
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred'
    }
  }
}

// Outlet Mappers
import type { OutletConfig, UpdateFrequenciesDto } from '@/src/types/outlet.types'

export class OutletMapper {
  /**
   * Transforma response de API → App (snake_case → camelCase)
   */
  static toApp(apiOutlet: Record<string, unknown>): OutletConfig {
    return {
      id: apiOutlet.id as string,
      name: apiOutlet.name as string,
      baseUrl: apiOutlet.base_url as string || apiOutlet.baseUrl as string,
      listingUrl: apiOutlet.listing_url as string || apiOutlet.listingUrl as string,
      testUrl: (apiOutlet.test_url as string | undefined) || (apiOutlet.testUrl as string | undefined),
      isActive: apiOutlet.is_active as boolean ?? apiOutlet.isActive as boolean ?? true,
      extractionFrequency: apiOutlet.extraction_frequency as number || apiOutlet.extractionFrequency as number,
      contentGenerationFrequency: apiOutlet.content_generation_frequency as number || apiOutlet.contentGenerationFrequency as number,
      publishingFrequency: apiOutlet.publishing_frequency as number || apiOutlet.publishingFrequency as number,
      listingSelectors: {
        titleSelector: (apiOutlet.listing_selectors as Record<string, string>)?.title_selector ||
                       (apiOutlet.listingSelectors as Record<string, string>)?.titleSelector || '',
        linkSelector: (apiOutlet.listing_selectors as Record<string, string>)?.link_selector ||
                      (apiOutlet.listingSelectors as Record<string, string>)?.linkSelector || '',
        dateSelector: (apiOutlet.listing_selectors as Record<string, string>)?.date_selector ||
                      (apiOutlet.listingSelectors as Record<string, string>)?.dateSelector || '',
        thumbnailSelector: (apiOutlet.listing_selectors as Record<string, string>)?.thumbnail_selector ||
                          (apiOutlet.listingSelectors as Record<string, string>)?.thumbnailSelector || '',
        summarySelector: (apiOutlet.listing_selectors as Record<string, string>)?.summary_selector ||
                        (apiOutlet.listingSelectors as Record<string, string>)?.summarySelector || '',
      },
      contentSelectors: {
        titleSelector: (apiOutlet.content_selectors as Record<string, string>)?.title_selector ||
                      (apiOutlet.contentSelectors as Record<string, string>)?.titleSelector || '',
        contentSelector: (apiOutlet.content_selectors as Record<string, string>)?.content_selector ||
                        (apiOutlet.contentSelectors as Record<string, string>)?.contentSelector || '',
        authorSelector: (apiOutlet.content_selectors as Record<string, string>)?.author_selector ||
                       (apiOutlet.contentSelectors as Record<string, string>)?.authorSelector || '',
        dateSelector: (apiOutlet.content_selectors as Record<string, string>)?.date_selector ||
                     (apiOutlet.contentSelectors as Record<string, string>)?.dateSelector || '',
        imageSelector: (apiOutlet.content_selectors as Record<string, string>)?.image_selector ||
                      (apiOutlet.contentSelectors as Record<string, string>)?.imageSelector || '',
        categorySelector: (apiOutlet.content_selectors as Record<string, string>)?.category_selector ||
                         (apiOutlet.contentSelectors as Record<string, string>)?.categorySelector || '',
        tagsSelector: (apiOutlet.content_selectors as Record<string, string>)?.tags_selector ||
                     (apiOutlet.contentSelectors as Record<string, string>)?.tagsSelector || '',
      },
      extractionSettings: {
        maxRetries: (apiOutlet.extraction_settings as Record<string, number>)?.max_retries ||
                   (apiOutlet.extractionSettings as Record<string, number>)?.maxRetries || 3,
        timeout: (apiOutlet.extraction_settings as Record<string, number>)?.timeout ||
                (apiOutlet.extractionSettings as Record<string, number>)?.timeout || 30000,
        waitBetweenRequests: (apiOutlet.extraction_settings as Record<string, number>)?.wait_between_requests ||
                            (apiOutlet.extractionSettings as Record<string, number>)?.waitBetweenRequests || 1000,
      },
      lastExtractionRun: apiOutlet.last_extraction_run ?
        new Date(apiOutlet.last_extraction_run as string) :
        apiOutlet.lastExtractionRun ? new Date(apiOutlet.lastExtractionRun as string) : null,
      lastGenerationRun: apiOutlet.last_generation_run ?
        new Date(apiOutlet.last_generation_run as string) :
        apiOutlet.lastGenerationRun ? new Date(apiOutlet.lastGenerationRun as string) : null,
      lastPublishingRun: apiOutlet.last_publishing_run ?
        new Date(apiOutlet.last_publishing_run as string) :
        apiOutlet.lastPublishingRun ? new Date(apiOutlet.lastPublishingRun as string) : null,
      statistics: {
        totalUrlsExtracted: (apiOutlet.statistics as Record<string, number>)?.total_urls_extracted ||
                           (apiOutlet.statistics as Record<string, number>)?.totalUrlsExtracted || 0,
        successfulExtractions: (apiOutlet.statistics as Record<string, number>)?.successful_extractions ||
                              (apiOutlet.statistics as Record<string, number>)?.successfulExtractions || 0,
        failedExtractions: (apiOutlet.statistics as Record<string, number>)?.failed_extractions ||
                          (apiOutlet.statistics as Record<string, number>)?.failedExtractions || 0,
        totalContentGenerated: (apiOutlet.statistics as Record<string, number>)?.total_content_generated ||
                              (apiOutlet.statistics as Record<string, number>)?.totalContentGenerated || 0,
        totalPublished: (apiOutlet.statistics as Record<string, number>)?.total_published ||
                       (apiOutlet.statistics as Record<string, number>)?.totalPublished || 0,
        lastExtractionDuration: (apiOutlet.statistics as Record<string, number | null>)?.last_extraction_duration ??
                               (apiOutlet.statistics as Record<string, number | null>)?.lastExtractionDuration ?? null,
      },
      createdAt: apiOutlet.created_at ? new Date(apiOutlet.created_at as string) :
                 apiOutlet.createdAt ? new Date(apiOutlet.createdAt as string) : new Date(),
      updatedAt: apiOutlet.updated_at ? new Date(apiOutlet.updated_at as string) :
                 apiOutlet.updatedAt ? new Date(apiOutlet.updatedAt as string) : new Date(),
    }
  }

  /**
   * Transforma App → API (camelCase → snake_case)
   */
  static toAPI(appOutlet: OutletConfig): Record<string, unknown> {
    return {
      id: appOutlet.id,
      name: appOutlet.name,
      base_url: appOutlet.baseUrl,
      listing_url: appOutlet.listingUrl,
      test_url: appOutlet.testUrl,
      is_active: appOutlet.isActive,
      extraction_frequency: appOutlet.extractionFrequency,
      content_generation_frequency: appOutlet.contentGenerationFrequency,
      publishing_frequency: appOutlet.publishingFrequency,
      listing_selectors: {
        title_selector: appOutlet.listingSelectors.titleSelector,
        link_selector: appOutlet.listingSelectors.linkSelector,
        date_selector: appOutlet.listingSelectors.dateSelector,
        thumbnail_selector: appOutlet.listingSelectors.thumbnailSelector,
        summary_selector: appOutlet.listingSelectors.summarySelector,
      },
      content_selectors: {
        title_selector: appOutlet.contentSelectors.titleSelector,
        content_selector: appOutlet.contentSelectors.contentSelector,
        author_selector: appOutlet.contentSelectors.authorSelector,
        date_selector: appOutlet.contentSelectors.dateSelector,
        image_selector: appOutlet.contentSelectors.imageSelector,
        category_selector: appOutlet.contentSelectors.categorySelector,
        tags_selector: appOutlet.contentSelectors.tagsSelector,
      },
      extraction_settings: {
        max_retries: appOutlet.extractionSettings.maxRetries,
        timeout: appOutlet.extractionSettings.timeout,
        wait_between_requests: appOutlet.extractionSettings.waitBetweenRequests,
      },
      last_extraction_run: appOutlet.lastExtractionRun?.toISOString() || null,
      last_generation_run: appOutlet.lastGenerationRun?.toISOString() || null,
      last_publishing_run: appOutlet.lastPublishingRun?.toISOString() || null,
      statistics: {
        total_urls_extracted: appOutlet.statistics.totalUrlsExtracted,
        successful_extractions: appOutlet.statistics.successfulExtractions,
        failed_extractions: appOutlet.statistics.failedExtractions,
        total_content_generated: appOutlet.statistics.totalContentGenerated,
        total_published: appOutlet.statistics.totalPublished,
        last_extraction_duration: appOutlet.statistics.lastExtractionDuration,
      },
      created_at: appOutlet.createdAt.toISOString(),
      updated_at: appOutlet.updatedAt.toISOString(),
    }
  }

  /**
   * Transforma DTO de frecuencias para actualización
   */
  static toUpdateDto(frequencies: Partial<UpdateFrequenciesDto>): Record<string, unknown> {
    const dto: Record<string, unknown> = {}

    if (frequencies.extractionFrequency !== undefined) {
      dto.extractionFrequency = frequencies.extractionFrequency
    }
    if (frequencies.contentGenerationFrequency !== undefined) {
      dto.generationFrequency = frequencies.contentGenerationFrequency
    }
    if (frequencies.publishingFrequency !== undefined) {
      dto.publishingFrequency = frequencies.publishingFrequency
    }

    return dto
  }
}

// Extracted Content Mappers
import type {
  ExtractedContent,
  ExtractedContentApiResponse
} from '@/src/types/extracted-content.types'

export class ExtractedContentMapper {
  /**
   * Transforma response de API → App
   */
  static toApp(apiContent: ExtractedContentApiResponse): ExtractedContent {
    return {
      id: apiContent.id,
      title: apiContent.title,
      content: apiContent.content,
      url: apiContent.url,
      websiteId: apiContent.websiteConfigId,
      websiteName: apiContent.websiteName,
      author: apiContent.author,
      category: apiContent.category,
      imageUrl: apiContent.imageUrl,
      publishedAt: apiContent.publishedDate,
      extractedAt: apiContent.extractedAt,
      status: apiContent.extractionStatus as 'pending' | 'processing' | 'extracted' | 'failed'
    }
  }
}

// Generated Content Mappers
import type {
  GeneratedContent,
  SocialMediaCopies,
  GenerationMetadata
} from '@/src/types/generated-content.types'

export class GeneratedContentMapper {
  /**
   * Transforma response de API → App
   */
  static toApp(apiGenerated: Record<string, unknown>): GeneratedContent {
    return {
      id: apiGenerated.id as string,
      extractedNoticiaId: apiGenerated.extractedNoticiaId as string,
      agentId: apiGenerated.agentId as string,
      agentName: apiGenerated.agentName as string | undefined,
      generatedTitle: apiGenerated.generatedTitle as string,
      generatedContent: apiGenerated.generatedContent as string,
      generatedSummary: apiGenerated.generatedSummary as string | undefined,
      generatedKeywords: apiGenerated.generatedKeywords as string[] | undefined,
      generatedTags: apiGenerated.generatedTags as string[] | undefined,
      generatedCategory: apiGenerated.generatedCategory as string | undefined,
      socialMediaCopies: apiGenerated.socialMediaCopies as SocialMediaCopies | undefined,
      generationMetadata: apiGenerated.generationMetadata as GenerationMetadata | undefined,
      createdAt: apiGenerated.createdAt as string,
      status: apiGenerated.status as string
    }
  }
}

// Generated Content Filters Mappers
import type { API as FilterAPI, App as FilterApp } from '@/src/types/generated-content-filters.types'

export class GeneratedContentFiltersMapper {
  /**
   * Transforma filtros App → API (camelCase → camelCase)
   * El backend espera camelCase en los query params
   */
  static toAPI(appFilters: FilterApp.GeneratedContentFilters): FilterAPI.GeneratedContentFilters {
    return {
      status: appFilters.status,
      agentId: appFilters.agentId,
      templateId: appFilters.templateId,
      providerId: appFilters.providerId,
      dateFrom: appFilters.dateFrom?.toISOString(),
      dateTo: appFilters.dateTo?.toISOString(),
      minQualityScore: appFilters.minQualityScore,
      hasReview: appFilters.hasReview,
      isPublished: appFilters.isPublished,
      category: appFilters.category,
      tags: appFilters.tags,
      search: appFilters.search,
      sortBy: appFilters.sortBy,
      sortOrder: appFilters.sortOrder,
      page: appFilters.page,
      limit: appFilters.limit,
    }
  }

  /**
   * Transforma contenido generado individual API → App
   */
  static contentToApp(apiContent: FilterAPI.GeneratedContentResponse): FilterApp.GeneratedContent {
    return {
      id: apiContent.id,
      originalContent: {
        id: apiContent.originalContent.id,
        title: apiContent.originalContent.title,
        content: apiContent.originalContent.content,
        sourceUrl: apiContent.originalContent.sourceUrl,
        publishedAt: apiContent.originalContent.publishedAt ?
          new Date(apiContent.originalContent.publishedAt) : undefined,
        images: apiContent.originalContent.images,
      },
      agent: {
        id: apiContent.agent.id,
        name: apiContent.agent.name,
        type: apiContent.agent.type,
      },
      template: {
        id: apiContent.template.id,
        name: apiContent.template.name,
        type: apiContent.template.type,
      },
      provider: {
        id: apiContent.provider.id,
        name: apiContent.provider.name,
        model: apiContent.provider.model,
      },
      generatedTitle: apiContent.generatedTitle,
      generatedContent: apiContent.generatedContent,
      generatedKeywords: apiContent.generatedKeywords,
      generatedTags: apiContent.generatedTags,
      generatedCategory: apiContent.generatedCategory,
      generatedSummary: apiContent.generatedSummary,
      extendedSummary: apiContent.extendedSummary,
      socialMediaCopies: apiContent.socialMediaCopies ? {
        facebook: apiContent.socialMediaCopies.facebook ? {
          hook: apiContent.socialMediaCopies.facebook.hook,
          copy: apiContent.socialMediaCopies.facebook.copy,
          emojis: apiContent.socialMediaCopies.facebook.emojis,
          hookType: apiContent.socialMediaCopies.facebook.hookType,
          estimatedEngagement: apiContent.socialMediaCopies.facebook.estimatedEngagement,
        } : undefined,
        twitter: apiContent.socialMediaCopies.twitter ? {
          tweet: apiContent.socialMediaCopies.twitter.tweet,
          hook: apiContent.socialMediaCopies.twitter.hook,
          emojis: apiContent.socialMediaCopies.twitter.emojis,
          hookType: apiContent.socialMediaCopies.twitter.hookType,
          threadIdeas: apiContent.socialMediaCopies.twitter.threadIdeas,
        } : undefined,
        instagram: apiContent.socialMediaCopies.instagram,
        linkedin: apiContent.socialMediaCopies.linkedin,
      } : undefined,
      seoData: apiContent.seoData ? {
        metaDescription: apiContent.seoData.metaDescription,
        focusKeyword: apiContent.seoData.focusKeyword,
        altText: apiContent.seoData.altText,
        canonicalUrl: apiContent.seoData.canonicalUrl,
        ogTitle: apiContent.seoData.ogTitle,
        ogDescription: apiContent.seoData.ogDescription,
      } : undefined,
      status: apiContent.status,
      generationMetadata: {
        model: apiContent.generationMetadata.model,
        promptTokens: apiContent.generationMetadata.promptTokens,
        completionTokens: apiContent.generationMetadata.completionTokens,
        totalTokens: apiContent.generationMetadata.totalTokens,
        cost: apiContent.generationMetadata.cost,
        processingTime: apiContent.generationMetadata.processingTime,
        temperature: apiContent.generationMetadata.temperature,
        maxTokens: apiContent.generationMetadata.maxTokens,
        finishReason: apiContent.generationMetadata.finishReason,
        contentQuality: apiContent.generationMetadata.contentQuality,
      },
      qualityMetrics: apiContent.qualityMetrics ? {
        readabilityScore: apiContent.qualityMetrics.readabilityScore,
        sentimentScore: apiContent.qualityMetrics.sentimentScore,
        coherenceScore: apiContent.qualityMetrics.coherenceScore,
        originalityScore: apiContent.qualityMetrics.originalityScore,
        seoScore: apiContent.qualityMetrics.seoScore,
        userRating: apiContent.qualityMetrics.userRating,
        humanReviewScore: apiContent.qualityMetrics.humanReviewScore,
      } : undefined,
      comparisonMetrics: apiContent.comparisonMetrics ? {
        similarityToOriginal: apiContent.comparisonMetrics.similarityToOriginal,
        lengthRatio: apiContent.comparisonMetrics.lengthRatio,
        keywordDensity: apiContent.comparisonMetrics.keywordDensity,
        readingLevel: apiContent.comparisonMetrics.readingLevel,
        toneAnalysis: apiContent.comparisonMetrics.toneAnalysis,
      } : undefined,
      errors: apiContent.errors,
      warnings: apiContent.warnings,
      reviewInfo: apiContent.reviewInfo ? {
        reviewerId: apiContent.reviewInfo.reviewerId,
        reviewedAt: apiContent.reviewInfo.reviewedAt ?
          new Date(apiContent.reviewInfo.reviewedAt) : undefined,
        reviewNotes: apiContent.reviewInfo.reviewNotes,
        changesRequested: apiContent.reviewInfo.changesRequested,
        approvalLevel: apiContent.reviewInfo.approvalLevel,
      } : undefined,
      publishingInfo: apiContent.publishingInfo ? {
        publishedAt: apiContent.publishingInfo.publishedAt ?
          new Date(apiContent.publishingInfo.publishedAt) : undefined,
        publishedBy: apiContent.publishingInfo.publishedBy,
        platform: apiContent.publishingInfo.platform,
        url: apiContent.publishingInfo.url,
        socialShares: apiContent.publishingInfo.socialShares,
        views: apiContent.publishingInfo.views,
      } : undefined,
      versioning: apiContent.versioning ? {
        version: apiContent.versioning.version,
        previousVersionId: apiContent.versioning.previousVersionId,
        changeLog: apiContent.versioning.changeLog,
        isLatest: apiContent.versioning.isLatest,
      } : undefined,
      generatedAt: new Date(apiContent.generatedAt),
      originalPublishedAt: apiContent.originalPublishedAt ?
        new Date(apiContent.originalPublishedAt) : undefined,
      createdAt: new Date(apiContent.createdAt),
      updatedAt: new Date(apiContent.updatedAt),
    }
  }

  /**
   * Transforma response paginada API → App
   */
  static paginatedToApp(
    apiResponse: FilterAPI.PaginatedGeneratedContentResponse
  ): FilterApp.PaginatedGeneratedContentResponse {
    return {
      data: apiResponse.data.map(item => this.contentToApp(item)),
      total: apiResponse.total,
      page: apiResponse.page,
      limit: apiResponse.limit,
      totalPages: apiResponse.totalPages,
    }
  }
}

// Content Agent Mappers
import type { ContentAgent } from '@/src/types/content-agent.types'

export class ContentAgentMapper {
  /**
   * Transforma response de API → App
   */
  static toApp(apiAgent: Record<string, unknown>): ContentAgent {
    return {
      id: apiAgent.id as string,
      name: apiAgent.name as string,
      agentType: apiAgent.agentType as 'reportero' | 'columnista' | 'trascendido' | 'seo-specialist',
      description: apiAgent.description as string,
      personality: apiAgent.personality as string,
      specializations: apiAgent.specializations as string[],
      editorialLean: apiAgent.editorialLean as 'conservative' | 'progressive' | 'neutral' | 'humor' | 'critical' | 'analytical',
      writingStyle: apiAgent.writingStyle as ContentAgent['writingStyle'],
      defaultTemplates: apiAgent.defaultTemplates as string[] | undefined,
      isActive: apiAgent.isActive as boolean,
      performanceMetrics: apiAgent.performanceMetrics as ContentAgent['performanceMetrics'] | undefined,
      createdAt: apiAgent.createdAt as string,
      updatedAt: apiAgent.updatedAt as string
    }
  }
}

// AI Outlet Mappers
import type {
  AiCreateOutletResponse,
  AiAnalyzeListingResponse,
  AiAnalyzeContentResponse,
  ValidationResultsDto,
  ContentSelectorsDto,
  ExtractedContentPreviewDto
} from '@/src/types/ai-outlet.types'

export class AiOutletMapper {
  /**
   * Transforma response de API → App para createOutletWithAI
   */
  static toApp(apiResponse: Record<string, unknown>): AiCreateOutletResponse {
    const listingAnalysis = apiResponse.listingAnalysis as Record<string, unknown>
    const contentAnalysis = apiResponse.contentAnalysis as Record<string, unknown>
    const validationResults = apiResponse.validationResults as Record<string, unknown>

    return {
      outlet: apiResponse.outlet ? OutletMapper.toApp(apiResponse.outlet as Record<string, unknown>) : null,
      listingAnalysis: {
        selector: listingAnalysis.selector as string,
        confidence: listingAnalysis.confidence as number,
        urlsFound: listingAnalysis.urlsFound as string[],
        count: listingAnalysis.count as number,
        reasoning: listingAnalysis.reasoning as string,
        optimizationStats: listingAnalysis.optimizationStats as AiAnalyzeListingResponse['optimizationStats']
      },
      contentAnalysis: {
        selectors: contentAnalysis.selectors as ContentSelectorsDto,
        confidence: contentAnalysis.confidence as number,
        extractedPreview: contentAnalysis.extractedPreview as ExtractedContentPreviewDto,
        reasoning: contentAnalysis.reasoning as string,
        optimizationStats: contentAnalysis.optimizationStats as AiAnalyzeContentResponse['optimizationStats']
      },
      validationResults: {
        listingSuccess: validationResults.listingSuccess as boolean,
        contentSuccess: validationResults.contentSuccess as boolean,
        overallConfidence: validationResults.overallConfidence as number,
        messages: validationResults.messages as string[]
      },
      processingTimeMs: apiResponse.processingTimeMs as number
    }
  }

  /**
   * Transforma response de API → App para analyzeListing
   */
  static listingToApp(apiResponse: Record<string, unknown>): AiAnalyzeListingResponse {
    return {
      selector: apiResponse.selector as string,
      confidence: apiResponse.confidence as number,
      urlsFound: apiResponse.urlsFound as string[],
      count: apiResponse.count as number,
      reasoning: apiResponse.reasoning as string,
      optimizationStats: apiResponse.optimizationStats as AiAnalyzeListingResponse['optimizationStats']
    }
  }

  /**
   * Transforma response de API → App para analyzeContent
   */
  static contentToApp(apiResponse: Record<string, unknown>): AiAnalyzeContentResponse {
    return {
      selectors: apiResponse.selectors as ContentSelectorsDto,
      confidence: apiResponse.confidence as number,
      extractedPreview: apiResponse.extractedPreview as ExtractedContentPreviewDto,
      reasoning: apiResponse.reasoning as string,
      optimizationStats: apiResponse.optimizationStats as AiAnalyzeContentResponse['optimizationStats']
    }
  }
}

// Site Mappers
import type {
  Site,
  CreateSitePayload,
  UpdateSitePayload
} from '@/src/types/site.types'

export class SiteMapper {
  /**
   * 🌐 FASE 8: SiteMapper SIMPLIFICADO
   * Transforma response de API → App (solo campos esenciales)
   */
  static toApp(apiSite: Record<string, unknown>): Site {
    return {
      id: apiSite.id as string || apiSite._id as string,
      domain: apiSite.domain as string,
      slug: apiSite.slug as string,
      name: apiSite.name as string,
      description: apiSite.description as string,

      // Social Media (FASE 13)
      socialMedia: apiSite.socialMedia as Site['socialMedia'],

      // Status
      isActive: apiSite.isActive as boolean ?? true,
      isMainSite: apiSite.isMainSite as boolean ?? false,

      // Stats (auto-generadas por backend)
      totalNoticias: apiSite.totalNoticias as number || 0,
      totalViews: apiSite.totalViews as number || 0,
      totalSocialPosts: apiSite.totalSocialPosts as number || 0,

      // Timestamps
      createdAt: apiSite.createdAt as string || new Date().toISOString(),
      updatedAt: apiSite.updatedAt as string || new Date().toISOString()
    }
  }

  /**
   * Transforma App → API para CREATE (SIMPLIFICADO - 5 campos con camelCase)
   */
  static createToAPI(appSite: CreateSitePayload): Record<string, unknown> {
    return {
      domain: appSite.domain,
      name: appSite.name,
      description: appSite.description,
      isMainSite: appSite.isMainSite,
      isActive: appSite.isActive
    }
  }

  /**
   * Transforma App → API para UPDATE (SIMPLIFICADO - solo campos permitidos con camelCase)
   */
  static updateToAPI(appSite: UpdateSitePayload): Record<string, unknown> {
    const payload: Record<string, unknown> = {}

    if (appSite.domain !== undefined) payload.domain = appSite.domain
    if (appSite.name !== undefined) payload.name = appSite.name
    if (appSite.description !== undefined) payload.description = appSite.description
    if (appSite.isMainSite !== undefined) payload.isMainSite = appSite.isMainSite
    if (appSite.isActive !== undefined) payload.isActive = appSite.isActive

    // FASE 13: Social Media
    if (appSite.socialMedia !== undefined) payload.socialMedia = appSite.socialMedia

    return payload
  }
}