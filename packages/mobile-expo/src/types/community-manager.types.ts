/**
 * 🎯 Community Manager Types
 *
 * Types para sistema de Community Manager en mobile app
 */

/**
 * Tipo de contenido
 */
export type ContentType =
  | 'breaking_news'
  | 'normal_news'
  | 'blog'
  | 'evergreen'
  | 'recycled';

/**
 * Plataforma de redes sociales
 */
export type Platform = 'facebook' | 'twitter' | 'instagram';

/**
 * Status de post programado
 */
export type PostStatus =
  | 'scheduled'
  | 'processing'
  | 'published'
  | 'failed'
  | 'cancelled';

/**
 * Tipo de reciclaje
 */
export type RecycleType =
  | 'pure_evergreen'
  | 'seasonal_evergreen'
  | 'durable'
  | 'not_recyclable';

/**
 * Post programado en redes sociales
 */
export interface ScheduledPost {
  id: string;
  noticiaId: string;
  noticiaTitle?: string;
  contentType: ContentType;
  platform: Platform;
  postContent: string;
  scheduledAt: string; // ISO date
  priority: number;
  status: PostStatus;
  publishedAt?: string; // ISO date
  platformPostId?: string;
  platformPostUrl?: string;
  metadata?: {
    requestedAt: string;
    calculationMethod: string;
    timeWindow: 'peak' | 'moderate' | 'low';
    isOptimalTime: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Schedule de reciclaje de contenido
 */
export interface ContentRecyclingSchedule {
  id: string;
  noticiaId: string;
  noticiaTitle: string;
  noticiaSlug: string;
  recycleType: RecycleType;
  recycleFrequencyDays: number;
  maxRecyclesAllowed: number;
  totalRecycles: number;
  lastRecycledAt?: string; // ISO date
  nextScheduledRecycle?: string; // ISO date
  performanceHistory: RecyclePerformance[];
  isEligibleForRecycle: boolean;
}

/**
 * Performance de un reciclaje
 */
export interface RecyclePerformance {
  recycleDate: string;
  recycleNumber: number;
  facebookEngagement?: {
    likes: number;
    comments: number;
    shares: number;
    reach: number;
  };
  twitterEngagement?: {
    likes: number;
    retweets: number;
    replies: number;
    impressions: number;
  };
  totalEngagement: number;
  totalReach: number;
  engagementRate: number;
  performanceVsOriginal: number; // % vs original
}

/**
 * Contenido elegible para reciclaje
 */
export interface EligibleContent {
  noticiaId: string;
  noticiaTitle: string;
  noticiaSlug: string;
  publishedAt: string;
  contentType: string;
  performanceScore: number;
  recycleType: RecycleType;
  eligibilityReasons: string[];
  ageMonths: number;
}

/**
 * Estadísticas del Community Manager
 */
export interface CommunityManagerStats {
  scheduledPosts: {
    total: number;
    byPlatform: Record<Platform, number>;
    byContentType: Record<string, number>;
    byStatus: Record<string, number>;
  };
  recycling: {
    totalRecycled: number;
    totalEligible: number;
    averagePerformance: number;
  };
}

/**
 * Estadísticas de reciclaje
 */
export interface RecyclingStats {
  totalRecycled: number;
  totalEligible: number;
  averagePerformanceVsOriginal: number;
  byRecycleType: Record<RecycleType, number>;
  topPerformingRecycles: {
    noticiaId: string;
    title: string;
    recycleNumber: number;
    performanceVsOriginal: number;
  }[];
}

/**
 * Filtros para posts programados
 */
export interface ScheduledPostsFilters {
  platform?: Platform;
  contentType?: ContentType;
  status?: PostStatus;
  dateFrom?: string; // ISO date
  dateTo?: string; // ISO date
  limit?: number;
}

/**
 * Request para programar contenido
 */
export interface ScheduleContentRequest {
  noticiaId: string;
  platform: Platform;
  originalCopy: string;
  forceImmediate?: boolean;
  customScheduledTime?: string; // ISO date
}

/**
 * Request para programar reciclaje
 */
export interface ScheduleRecycledRequest {
  noticiaId: string;
  platforms?: Platform[];
}

/**
 * Request para cancelar post
 */
export interface CancelPostRequest {
  scheduledPostId: string;
  reason?: string;
}

/**
 * Request para reprogramar post
 */
export interface ReschedulePostRequest {
  scheduledPostId: string;
  newScheduledTime?: string; // ISO date
}

/**
 * Analytics por tipo de contenido
 */
export interface ContentTypeAnalytics {
  contentType: ContentType;
  totalPosts: number;
  avgEngagement: number;
  avgReach: number;
  engagementRate: number;
  bestTimeSlot: string;
  worstTimeSlot: string;
}

/**
 * Analytics por horario
 */
export interface TimeSlotAnalytics {
  timeSlot: string; // "09:00-11:00"
  dayOfWeek: number; // 0-6
  totalPosts: number;
  avgEngagement: number;
  avgReach: number;
  engagementRate: number;
  bestContentType: ContentType;
}

/**
 * Analytics por plataforma
 */
export interface PlatformAnalytics {
  platform: Platform;
  totalPosts: number;
  avgEngagement: number;
  avgReach: number;
  engagementRate: number;
  bestContentType: ContentType;
  bestTimeSlot: string;
}

/**
 * Dashboard summary para Home
 */
export interface CMDashboardSummary {
  postsScheduledToday: number;
  postsPublishedThisWeek: number;
  eligibleForRecycling: number;
  avgEngagementRate: number;
  upcomingPosts: ScheduledPost[];
  topPerforming: {
    platform: Platform;
    contentType: ContentType;
    engagement: number;
  }[];
}
