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
      dto.extraction_frequency = frequencies.extractionFrequency
    }
    if (frequencies.contentGenerationFrequency !== undefined) {
      dto.content_generation_frequency = frequencies.contentGenerationFrequency
    }
    if (frequencies.publishingFrequency !== undefined) {
      dto.publishing_frequency = frequencies.publishingFrequency
    }

    return dto
  }
}