// 📱 Facebook Module Types - API Response Interfaces

// 📊 Statistics & Metrics
export interface FacebookStats {
  pagesActive: number
  postsToday: number
  extractionsHour: number
  quotaLimit: number
  efficiency: number
  quotaResetTime?: string
}

export interface FacebookQuota {
  current: number
  limit: number
  percentage: number
  resetTime: string
  status: 'normal' | 'warning' | 'critical'
}

// 📄 Facebook Page Management
export interface FacebookPage {
  id: string
  name: string
  url: string
  status: 'active' | 'paused' | 'error' | 'pending'
  lastExtraction: string
  postsCount: number
  extractionEnabled: boolean
  pageId: string
  accessToken?: string
  createdAt: string
  updatedAt: string
}

export interface CreateFacebookPageDto {
  name: string
  url: string
  pageId: string
  extractionEnabled?: boolean
}

export interface UpdateFacebookPageDto {
  name?: string
  url?: string
  extractionEnabled?: boolean
  status?: FacebookPage['status']
}

// 📝 Facebook Posts
export interface FacebookPost {
  id: string
  title: string
  content: string
  pageId: string
  pageName: string
  facebookPostId: string
  createdTime: string
  extractedAt: string
  engagement: {
    likes: number
    comments: number
    shares: number
  }
  hasImage: boolean
  imageUrl?: string
  permalink: string
}

export interface FacebookPostDetail extends FacebookPost {
  fullContent: string
  attachments?: Array<{
    type: 'photo' | 'video' | 'link'
    url: string
    description?: string
  }>
  insights?: {
    reach: number
    impressions: number
    engagement: number
  }
}

// 🔄 Queue & Jobs
export interface FacebookJob {
  id: string
  type: 'page_extraction' | 'post_extraction' | 'metrics_update'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'delayed'
  pageId?: string
  pageName?: string
  progress: number
  createdAt: string
  startedAt?: string
  completedAt?: string
  error?: string
  attempts: number
  maxAttempts: number
}

export interface QueueStats {
  pending: number
  processing: number
  completed: number
  failed: number
  delayed: number
}

// 🔧 System Status
export interface SystemStatus {
  facebookApi: {
    status: 'connected' | 'disconnected' | 'error'
    lastCheck: string
    error?: string
  }
  database: {
    status: 'connected' | 'disconnected' | 'error'
    lastCheck: string
  }
  queue: {
    status: 'running' | 'paused' | 'error'
    activeJobs: number
    pendingJobs: number
  }
}

// 📈 Analytics & Metrics
export interface FacebookMetrics {
  timeRange: {
    start: string
    end: string
  }
  totalPosts: number
  totalEngagement: number
  averageEngagement: number
  topPerformingPosts: Array<{
    id: string
    title: string
    engagement: number
    pageName: string
  }>
  engagementByHour: Array<{
    hour: number
    engagement: number
  }>
  postsByPage: Array<{
    pageId: string
    pageName: string
    count: number
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
export interface FacebookPagesQuery {
  page?: number
  limit?: number
  status?: FacebookPage['status']
  search?: string
  sortBy?: 'name' | 'lastExtraction' | 'postsCount' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface FacebookPostsQuery {
  page?: number
  limit?: number
  pageId?: string
  dateFrom?: string
  dateTo?: string
  hasImage?: boolean
  sortBy?: 'createdTime' | 'engagement' | 'extractedAt'
  sortOrder?: 'asc' | 'desc'
}

export interface FacebookJobsQuery {
  page?: number
  limit?: number
  status?: FacebookJob['status']
  type?: FacebookJob['type']
  pageId?: string
}

// 🎯 Hook Return Types
export interface UseFacebookStatsReturn {
  stats: FacebookStats | undefined
  quota: FacebookQuota | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export interface UseFacebookPagesReturn {
  pages: FacebookPage[]
  isLoading: boolean
  error: Error | null
  total: number
  pagination: PaginatedResponse<FacebookPage>['pagination'] | undefined
  createPage: (data: CreateFacebookPageDto) => Promise<void>
  updatePage: (id: string, data: UpdateFacebookPageDto) => Promise<void>
  deletePage: (id: string) => Promise<void>
  toggleExtraction: (id: string, enabled: boolean) => Promise<void>
  triggerExtraction: (id: string) => Promise<void>
  refetch: () => void
}

export interface UseFacebookPostsReturn {
  posts: FacebookPost[]
  isLoading: boolean
  error: Error | null
  total: number
  pagination: PaginatedResponse<FacebookPost>['pagination'] | undefined
  getPostDetail: (id: string) => Promise<FacebookPostDetail>
  refetch: () => void
}

export interface UseFacebookJobsReturn {
  jobs: FacebookJob[]
  queueStats: QueueStats | undefined
  isLoading: boolean
  error: Error | null
  retryJob: (id: string) => Promise<void>
  cancelJob: (id: string) => Promise<void>
  refetch: () => void
}

// 🔄 Real-time Events
export interface FacebookSocketEvents {
  'facebook:stats_updated': FacebookStats
  'facebook:quota_updated': FacebookQuota
  'facebook:page_status_changed': {
    pageId: string
    status: FacebookPage['status']
    lastExtraction: string
  }
  'facebook:job_updated': FacebookJob
  'facebook:extraction_completed': {
    pageId: string
    postsExtracted: number
    duration: number
  }
  'facebook:error': {
    type: string
    message: string
    pageId?: string
  }
}