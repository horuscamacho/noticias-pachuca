// 🐦 RapidAPI Twitter Module Types - API Response Interfaces

// 🔧 API Configuration Management
export interface RapidAPITwitterConfig {
  id: string
  name: string
  host: string
  apiKey: string
  baseUrl: string
  isActive: boolean
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

export interface CreateRapidAPITwitterConfigDto {
  name: string
  host: string
  apiKey: string
  baseUrl: string
  quotaLimits: {
    requestsPerHour: number
    requestsPerDay: number
    requestsPerMonth: number
  }
}

export interface UpdateRapidAPITwitterConfigDto {
  name?: string
  host?: string
  apiKey?: string
  baseUrl?: string
  isActive?: boolean
  quotaLimits?: {
    requestsPerHour?: number
    requestsPerDay?: number
    requestsPerMonth?: number
  }
}

// 📊 Statistics & Metrics
export interface RapidAPITwitterStats {
  activeConfigs: number
  totalRequests: number
  requestsToday: number
  usersMonitored: number
  quotaUsagePercentage: number
  topPerformingConfig: string
}

export interface RapidAPITwitterQuota {
  configId: string
  configName: string
  current: number
  limit: number
  percentage: number
  resetTime: string
  status: 'normal' | 'warning' | 'critical'
  timeFrame: 'hour' | 'day' | 'month'
}

// 🐦 RapidAPI Twitter User Management
export interface RapidAPITwitterUser {
  id: string
  userId: string // Twitter user rest_id
  username: string // Twitter handle
  displayName: string
  userUrl: string
  configId: string
  configName: string
  status: 'active' | 'paused' | 'error' | 'pending'
  userDetails: {
    bio?: string
    followers?: number
    following?: number
    tweetsCount?: number
    verified?: boolean
    isBlueVerified?: boolean
    profilePicture?: string
    location?: string
    website?: string
    rawData?: Record<string, unknown>
  }
  extractionConfig: {
    isActive: boolean
    frequency: 'manual' | 'daily' | 'weekly'
    maxPostsPerExtraction: number
    extractionFilters: {
      includeReplies: boolean
      includeRetweets: boolean
    }
  }
  stats: {
    totalPostsExtracted: number
    lastSuccessfulExtraction?: string
    extractionErrors: number
    avgTweetsPerDay: number
    lastError?: string
  }
  createdAt: string
  updatedAt: string
}

export interface CreateRapidAPITwitterUserDto {
  username: string
  configId?: string
  extractionConfig?: {
    isActive?: boolean
    frequency?: 'manual' | 'daily' | 'weekly'
    maxPostsPerExtraction?: number
    extractionFilters?: {
      includeReplies?: boolean
      includeRetweets?: boolean
    }
  }
}

export interface UpdateRapidAPITwitterUserDto {
  username?: string
  displayName?: string
  userUrl?: string
  configId?: string
  extractionConfig?: {
    isActive?: boolean
    frequency?: 'manual' | 'daily' | 'weekly'
    maxPostsPerExtraction?: number
    extractionFilters?: {
      includeReplies?: boolean
      includeRetweets?: boolean
    }
  }
}

// 🐦 Mapped User Details for UI
export interface MappedTwitterUserDetails {
  id: string
  username: string
  displayName: string
  bio: string
  followers: number
  following: number
  tweetsCount: number
  verified: boolean
  isBlueVerified: boolean
  profilePicture: string
  location: string
  website: string
}

// 📝 RapidAPI Twitter Posts/Tweets
export interface RapidAPITwitterPost {
  id: string
  tweetId: string
  userId: string // Twitter user rest_id
  username: string
  displayName: string
  configId: string
  content: {
    text?: string
    type: 'text' | 'photo' | 'video' | 'link' | 'retweet'
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
    retweets?: number
    replies?: number
    quotes?: number
  }
  isRetweet?: boolean
  originalTweetId?: string
  inReplyTo?: string
  rawData: Record<string, unknown>
}

// 🔄 API Operations
export interface TwitterUserValidationRequest {
  username: string
  configId?: string
}

export interface TwitterUserValidationResponse {
  isValid: boolean
  userId: string
  username: string
  displayName: string
  message: string
}

export interface TwitterUserDetailsRequest {
  username: string
  configId?: string
}

export interface TwitterUserDetailsResponse {
  success: boolean
  userDetails: {
    id: string
    username: string
    displayName: string
    bio?: string
    followers?: number
    following?: number
    tweetsCount?: number
    verified?: boolean
    isBlueVerified?: boolean
    profilePicture?: string
    location?: string
    website?: string
    rawData?: Record<string, unknown>
  }
  user: RapidAPITwitterUser // User created automatically in backend
  message: string
}

export interface TwitterUserTweetsRequest {
  userId: string
  configId?: string
  startDate?: string
  endDate?: string
  count?: number
  includeReplies?: boolean
  includeRetweets?: boolean
}

export interface TwitterUserTweetsResponse {
  success: boolean
  tweetsExtracted: number
  tweets: Array<{
    id: string
    url: string
    content: {
      text?: string
      type: 'text' | 'photo' | 'video' | 'link' | 'retweet'
      images?: string[]
      videos?: string[]
      links?: string[]
      hashtags?: string[]
      mentions?: string[]
    }
    publishedAt: string
    engagement: {
      likes?: number
      retweets?: number
      replies?: number
      quotes?: number
    }
    isRetweet?: boolean
    originalTweetId?: string
    inReplyTo?: string
    rawData: Record<string, unknown>
  }>
  userId: string
}

// 🆕 Create Twitter User (New unified endpoint)
export interface CreateTwitterUserRequest {
  username: string
  configId?: string
  displayName?: string
  description?: string
  extractTweetsAsync?: boolean
}

export interface CreateTwitterUserResponse {
  success: boolean
  user: RapidAPITwitterUser
  userId: string
  userDetails: {
    id: string
    username: string
    displayName: string
    bio?: string
    followers?: number
    following?: number
    tweetsCount?: number
    verified?: boolean
    isBlueVerified?: boolean
    profilePicture?: string
    location?: string
    website?: string
    rawData?: Record<string, unknown>
  }
  message: string
  jobId?: string
}

// 🚀 Async Tweets Extraction
export interface ExtractTweetsAsyncRequest {
  userId: string
  configId?: string
  startDate?: string
  endDate?: string
  count?: number
  includeReplies?: boolean
  includeRetweets?: boolean
}

export interface ExtractTweetsAsyncResponse {
  success: boolean
  jobId: string
  message: string
  userId: string
}

// 🔧 System Status
export interface RapidAPITwitterSystemStatus {
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
export interface TwitterApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export interface TwitterPaginatedResponse<T> {
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
export interface RapidAPITwitterConfigsQuery {
  page?: number
  limit?: number
  isActive?: boolean
  search?: string
  sortBy?: 'name' | 'createdAt' | 'usage'
  sortOrder?: 'asc' | 'desc'
}

export interface RapidAPITwitterUsersQuery {
  page?: number
  limit?: number
  configId?: string
  status?: RapidAPITwitterUser['status']
  search?: string
  sortBy?: 'username' | 'displayName' | 'lastSuccessfulExtraction' | 'totalPostsExtracted' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface RapidAPITwitterPostsQuery {
  page?: number
  limit?: number
  userId?: string
  configId?: string
  dateFrom?: string
  dateTo?: string
  postType?: 'text' | 'photo' | 'video' | 'link' | 'retweet'
  sortBy?: 'publishedAt' | 'extractedAt' | 'engagement'
  sortOrder?: 'asc' | 'desc'
}

// 🎯 Hook Return Types
export interface UseRapidAPITwitterConfigsReturn {
  configs: RapidAPITwitterConfig[]
  isLoading: boolean
  error: Error | null
  total: number
  pagination: TwitterPaginatedResponse<RapidAPITwitterConfig>['pagination'] | undefined
  createConfig: (data: CreateRapidAPITwitterConfigDto) => Promise<void>
  updateConfig: (id: string, data: UpdateRapidAPITwitterConfigDto) => Promise<void>
  deleteConfig: (id: string) => Promise<void>
  activateConfig: (id: string) => Promise<void>
  testConnection: (id: string) => Promise<{ success: boolean; message: string }>
  refetch: () => void
}

export interface UseRapidAPITwitterStatsReturn {
  stats: RapidAPITwitterStats | undefined
  quotas: RapidAPITwitterQuota[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export interface UseRapidAPITwitterUsersReturn {
  users: RapidAPITwitterUser[]
  isLoading: boolean
  error: Error | null
  total: number
  pagination: TwitterPaginatedResponse<RapidAPITwitterUser>['pagination'] | undefined
  createUser: (data: CreateRapidAPITwitterUserDto) => Promise<void>
  updateUser: (id: string, data: UpdateRapidAPITwitterUserDto) => Promise<void>
  deleteUser: (id: string) => Promise<void>
  updateExtractionConfig: (id: string, config: UpdateRapidAPITwitterUserDto['extractionConfig']) => Promise<void>
  triggerExtraction: (id: string) => Promise<void>
  refetch: () => void
}

export interface UseRapidAPITwitterUserValidationReturn {
  validateUser: (request: TwitterUserValidationRequest) => Promise<TwitterUserValidationResponse>
  getUserDetails: (request: TwitterUserDetailsRequest) => Promise<TwitterUserDetailsResponse>
  extractUserTweets: (request: TwitterUserTweetsRequest) => Promise<TwitterUserTweetsResponse>
  isLoading: boolean
  error: Error | null
}

// 🔄 Real-time Events
export interface RapidAPITwitterSocketEvents {
  'rapidapi-twitter:stats_updated': RapidAPITwitterStats
  'rapidapi-twitter:quota_updated': RapidAPITwitterQuota
  'rapidapi-twitter:config_status_changed': {
    configId: string
    status: 'online' | 'offline' | 'error'
    lastCheck: string
  }
  'rapidapi-twitter:user_extraction_completed': {
    userId: string
    configId: string
    tweetsExtracted: number
    duration: number
  }
  'rapidapi-twitter:error': {
    type: string
    message: string
    configId?: string
    userId?: string
  }
}