/**
 * 🎯 INTERFACES FACEBOOK GRAPH API
 * Tipado estricto - NO usar any
 */

export interface FacebookPageData {
  id: string;
  name: string;
  category: string;
  fan_count: number;
  talking_about_count: number;
  checkins?: number;
  website?: string;
  about?: string;
  description?: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

export interface FacebookPost {
  id: string;
  created_time: string;
  message?: string;
  story?: string;
  type: 'status' | 'photo' | 'video' | 'link' | 'event' | 'offer';
  likes?: {
    summary: {
      total_count: number;
    };
  };
  comments?: {
    summary: {
      total_count: number;
    };
  };
  shares?: {
    count: number;
  };
  attachments?: {
    data: FacebookAttachment[];
  };
}

export interface FacebookAttachment {
  type: string;
  url?: string;
  media?: {
    image?: {
      src: string;
    };
  };
}

export interface FacebookBatchRequest {
  method: 'GET' | 'POST' | 'DELETE';
  relative_url: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface FacebookBatchResponse {
  code: number;
  headers: FacebookResponseHeaders[];
  body: string;
}

export interface FacebookResponseHeaders {
  name: string;
  value: string;
}

export interface FacebookRequest {
  url: string;
  method: 'GET' | 'POST' | 'DELETE';
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
}

export interface FacebookApiError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
  };
}

export interface PageInsightData {
  name: string;
  period: 'day' | 'week' | 'days_28';
  values: Array<{
    value: number;
    end_time: string;
  }>;
  title: string;
  description: string;
}

export interface EngagementMetrics {
  likes: number;
  comments: number;
  shares: number;
  reactions: number;
  engagementRate: number;
  reach?: number;
  impressions?: number;
}

export interface PostingPattern {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  hour: number; // 0-23
  postCount: number;
  avgEngagement: number;
  bestPerformingType: string;
}

export interface PageContentAnalysis {
  pageInfo: FacebookPageData;
  recentPosts: FacebookPost[];
  engagement: EngagementMetrics;
  postingPatterns: PostingPattern[];
  topHashtags: string[];
  contentTypes: Record<string, number>;
  summary: ContentAnalysisSummary;
}

export interface ContentAnalysisSummary {
  totalPosts: number;
  avgLikesPerPost: number;
  avgCommentsPerPost: number;
  avgSharesPerPost: number;
  mostEngagedPostType: string;
  recommendedPostingHours: number[];
  contentScore: number; // 0-100
}

export interface CompetitorAnalysisResult {
  competitors: CompetitorData[];
  comparison: CompetitorComparison;
  insights: CompetitorInsights;
  recommendations: string[];
  generatedAt: Date;
}

export interface CompetitorData {
  pageId: string;
  name: string;
  metrics: EngagementMetrics;
  recentActivity: FacebookPost[];
  growthRate: number;
  score: number;
}

export interface CompetitorComparison {
  leader: {
    pageId: string;
    name: string;
    leadingMetrics: string[];
  };
  averages: EngagementMetrics;
  rankings: Array<{
    pageId: string;
    name: string;
    rank: number;
    score: number;
  }>;
}

export interface CompetitorInsights {
  trendsDetected: string[];
  bestPractices: string[];
  opportunities: string[];
  threats: string[];
}


export interface FacebookWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    time: number;
    changes: Array<{
      field: string;
      value: Record<string, unknown>;
    }>;
  }>;
}

export interface RateLimitUsage {
  callCount: number;
  totalTime: number;
  percentage: number;
  estimatedTimeToRegainAccess: number;
  appId: string;
  timestamp: Date;
}

export interface PagePostsOptions {
  fields?: string[];
  limit?: number;
  since?: string;
  until?: string;
  sortBy?: 'created_time' | 'updated_time';
  order?: 'asc' | 'desc';
}