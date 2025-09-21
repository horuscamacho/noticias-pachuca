// 📱 RapidAPI Facebook Module Types - API Response Interfaces

// 🔧 API Configuration Management
export interface RapidAPIConfig {
  id: string
  name: string
  host: string
  apiKey: string
  baseUrl: string
  isActive: boolean
  endpoints: {
    getPageId: string
    getPageDetails: string
    getPagePosts: string
  }
  quotaLimits: {
    requestsPerHour: number
    requestsPerDay: number
    requestsPerMonth: number
  }
  currentUsage: {
    requestsToday: number
    requestsThisMonth: number
    lastResetDate: string
    lastRequestDate?: string
    remainingDailyRequests: number
    remainingMonthlyRequests: number
  }
  createdAt: string
  updatedAt: string
}

export interface CreateRapidAPIConfigDto {
  name: string
  host: string
  apiKey: string
  baseUrl: string
  endpoints: {
    getPageId: string
    getPageDetails: string
    getPagePosts: string
  }
  quotaLimits: {
    requestsPerHour: number
    requestsPerDay: number
    requestsPerMonth: number
  }
}

export interface UpdateRapidAPIConfigDto {
  name?: string
  host?: string
  apiKey?: string
  baseUrl?: string
  isActive?: boolean
  endpoints?: {
    getPageId?: string
    getPageDetails?: string
    getPagePosts?: string
  }
  quotaLimits?: {
    requestsPerHour?: number
    requestsPerDay?: number
    requestsPerMonth?: number
  }
}

// 📊 Statistics & Metrics
export interface RapidAPIStats {
  activeConfigs: number
  totalRequests: number
  requestsToday: number
  pagesMonitored: number
  quotaUsagePercentage: number
  topPerformingConfig: string
}

export interface RapidAPIQuota {
  configId: string
  configName: string
  current: number
  limit: number
  percentage: number
  resetTime: string
  status: 'normal' | 'warning' | 'critical'
  timeFrame: 'hour' | 'day' | 'month'
}

// 📄 RapidAPI Facebook Page Management
export interface RapidAPIPage {
  id: string
  pageId: string
  pageName: string
  pageUrl: string
  configId: string
  configName: string
  status: 'active' | 'paused' | 'error' | 'pending'
  pageDetails: {
    name?: string
    about?: string
    category?: string
    followers?: number
    likes?: number
    website?: string
    location?: string
    verified?: boolean
    profilePicture?: string
    coverPhoto?: string
    phone?: string
    email?: string
    rawData?: Record<string, unknown>
  }
  extractionConfig: {
    isActive: boolean
    frequency: 'manual' | 'daily' | 'weekly'
    maxPostsPerExtraction: number
    extractionFilters: {
      includeComments: boolean
      includeReactions: boolean
    }
  }
  stats: {
    totalPostsExtracted: number
    lastSuccessfulExtraction?: string
    extractionErrors: number
    avgPostsPerDay: number
  }
  createdAt: string
  updatedAt: string
}

export interface CreateRapidAPIPageDto {
  pageUrl: string
  configId?: string
  extractionConfig?: {
    isActive?: boolean
    frequency?: 'manual' | 'daily' | 'weekly'
    maxPostsPerExtraction?: number
    extractionFilters?: {
      includeComments?: boolean
      includeReactions?: boolean
    }
  }
}

export interface UpdateRapidAPIPageDto {
  pageName?: string
  pageUrl?: string
  configId?: string
  extractionConfig?: {
    isActive?: boolean
    frequency?: 'manual' | 'daily' | 'weekly'
    maxPostsPerExtraction?: number
    extractionFilters?: {
      includeComments?: boolean
      includeReactions?: boolean
    }
  }
}

// 📄 Mapped Page Details for UI
export interface MappedPageDetails {
  name: string
  image: string
  intro: string
  followers: number
  likes: number | null
  categories: string[]
  phone: string
  email: string
  website: string
  verified: boolean
  cover_image: string
  rating: string
}

// 📝 RapidAPI Facebook Posts
export interface RapidAPIPost {
  id: string
  postId: string
  pageId: string
  pageName: string
  configId: string
  content: {
    text?: string
    type: 'text' | 'photo' | 'video' | 'link' | 'event'
    images?: string[]
    videos?: string[]
    links?: string[]
    hashtags?: string[]
    mentions?: string[]
  }
  publishedAt: string
  extractedAt: string
  engagement: {
    likes?: number
    comments?: number
    shares?: number
  }
  rawData: Record<string, unknown>
}

// 🔄 API Operations
export interface PageValidationRequest {
  pageUrl: string
  configId?: string
}

export interface PageValidationResponse {
  isValid: boolean
  pageId: string
  pageUrl: string
  message: string
}

export interface PageDetailsRequest {
  pageUrl: string
  configId?: string
}

export interface PageDetailsResponse {
  success: boolean
  pageDetails: {
    id: string
    name: string
    rawData: {
      results: {
        name: string
        type: string
        page_id: string
        url: string
        image: string
        intro: string
        likes: number | null
        followers: number
        categories: string[]
        phone: string
        email: string
        address: string | null
        rating: string
        services: string | null
        price_range: string | null
        website: string
        delegate_page: {
          is_business_page_active: boolean
          id: string
        }
        cover_image: string
        verified: boolean
        other_accounts: string[]
        reels_page_id: string
      }
    }
  }
  page: RapidAPIPage // Page created automatically in backend
  message: string
}

export interface PagePostsRequest {
  pageId: string
  configId?: string
  startDate?: string
  endDate?: string
  limit?: number
  includeComments?: boolean
  includeReactions?: boolean
}

export interface PagePostsResponse {
  success: boolean
  postsExtracted: number
  posts: Array<{
    id: string
    url: string
    content: {
      text?: string
      type: 'text' | 'photo' | 'video' | 'link' | 'event'
      images?: string[]
      videos?: string[]
      links?: string[]
      hashtags?: string[]
      mentions?: string[]
    }
    publishedAt: string
    engagement: {
      likes?: number
      comments?: number
      shares?: number
    }
    rawData: Record<string, unknown>
  }>
  pageId: string
}

// 🆕 Create Facebook Page (New unified endpoint)
export interface CreateFacebookPageRequest {
  pageUrl: string
  configId?: string
  name?: string
  description?: string
  extractPostsAsync?: boolean
}

export interface CreateFacebookPageResponse {
  success: boolean
  page: RapidAPIPage
  pageId: string
  pageDetails: {
    id: string
    name: string
    category?: string
    followers?: number
    likes?: number
    about?: string
    website?: string
    verified?: boolean
    profilePicture?: string
    coverPhoto?: string
    phone?: string
    email?: string
    rawData?: Record<string, unknown>
  }
  message: string
  jobId?: string
}

// 🚀 Async Posts Extraction
export interface ExtractPostsAsyncRequest {
  pageId: string
  configId?: string
  startDate?: string
  endDate?: string
  limit?: number
  includeComments?: boolean
  includeReactions?: boolean
}

export interface ExtractPostsAsyncResponse {
  success: boolean
  jobId: string
  message: string
  pageId: string
}

// 🔧 System Status
export interface RapidAPISystemStatus {
  activeConfigurations: number
  totalApiCalls: number
  averageResponseTime: number
  errorRate: number
  lastHealthCheck: string
  configurations: Array<{
    id: string
    name: string
    status: 'online' | 'offline' | 'error'
    lastCheck: string
    responseTime?: number
    error?: string
  }>
}

// 🔗 API Response Wrappers
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
  message?: string
}

// 📋 Query Parameters
export interface RapidAPIConfigsQuery {
  page?: number
  limit?: number
  isActive?: boolean
  search?: string
  sortBy?: 'name' | 'createdAt' | 'usage'
  sortOrder?: 'asc' | 'desc'
}

export interface RapidAPIPagesQuery {
  page?: number
  limit?: number
  configId?: string
  status?: RapidAPIPage['status']
  search?: string
  sortBy?: 'pageName' | 'lastSuccessfulExtraction' | 'totalPostsExtracted' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface RapidAPIPostsQuery {
  page?: number
  limit?: number
  pageId?: string
  configId?: string
  dateFrom?: string
  dateTo?: string
  postType?: 'text' | 'photo' | 'video' | 'link' | 'event'
  sortBy?: 'publishedAt' | 'extractedAt' | 'engagement'
  sortOrder?: 'asc' | 'desc'
}

// 🎯 Hook Return Types
export interface UseRapidAPIConfigsReturn {
  configs: RapidAPIConfig[]
  isLoading: boolean
  error: Error | null
  total: number
  pagination: PaginatedResponse<RapidAPIConfig>['pagination'] | undefined
  createConfig: (data: CreateRapidAPIConfigDto) => Promise<void>
  updateConfig: (id: string, data: UpdateRapidAPIConfigDto) => Promise<void>
  deleteConfig: (id: string) => Promise<void>
  activateConfig: (id: string) => Promise<void>
  testConnection: (id: string) => Promise<{ success: boolean; message: string }>
  refetch: () => void
}

export interface UseRapidAPIStatsReturn {
  stats: RapidAPIStats | undefined
  quotas: RapidAPIQuota[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export interface UseRapidAPIPagesReturn {
  pages: RapidAPIPage[]
  isLoading: boolean
  error: Error | null
  total: number
  pagination: PaginatedResponse<RapidAPIPage>['pagination'] | undefined
  createPage: (data: CreateRapidAPIPageDto) => Promise<void>
  updatePage: (id: string, data: UpdateRapidAPIPageDto) => Promise<void>
  deletePage: (id: string) => Promise<void>
  updateExtractionConfig: (id: string, config: UpdateRapidAPIPageDto['extractionConfig']) => Promise<void>
  triggerExtraction: (id: string) => Promise<void>
  refetch: () => void
}

export interface UseRapidAPIPageValidationReturn {
  validatePage: (request: PageValidationRequest) => Promise<PageValidationResponse>
  getPageDetails: (request: PageDetailsRequest) => Promise<PageDetailsResponse>
  extractPagePosts: (request: PagePostsRequest) => Promise<PagePostsResponse>
  isLoading: boolean
  error: Error | null
}

// 🔄 Real-time Events
export interface RapidAPISocketEvents {
  'rapidapi:stats_updated': RapidAPIStats
  'rapidapi:quota_updated': RapidAPIQuota
  'rapidapi:config_status_changed': {
    configId: string
    status: 'online' | 'offline' | 'error'
    lastCheck: string
  }
  'rapidapi:page_extraction_completed': {
    pageId: string
    configId: string
    postsExtracted: number
    duration: number
  }
  'rapidapi:error': {
    type: string
    message: string
    configId?: string
    pageId?: string
  }
}