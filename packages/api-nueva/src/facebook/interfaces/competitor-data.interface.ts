/**
 * 🎯 INTERFACES ANÁLISIS DE COMPETIDORES
 * Datos específicos para monitoreo y análisis competitivo
 */

export interface CompetitorPageConfig {
  pageId: string;
  name: string;
  category: string;
  isActive: boolean;
  monitoringFrequency: 'hourly' | 'daily' | 'weekly';
  alertThresholds: AlertThresholds;
  lastMonitored?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertThresholds {
  viralEngagementScore: number; // Threshold for viral content alerts
  followerGrowthRate: number; // % growth to trigger alerts
  postFrequencyChange: number; // Change in posting frequency
  engagementDropPercentage: number; // % drop to alert
}

export interface CompetitorMetrics {
  pageId: string;
  timestamp: Date;
  followers: number;
  followersChange: number;
  engagement: EngagementSnapshot;
  postFrequency: PostFrequencyData;
  contentAnalysis: ContentTypeAnalysis;
  trending: TrendingData;
}

export interface EngagementSnapshot {
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalReactions: number;
  engagementRate: number;
  avgEngagementPerPost: number;
  reach?: number;
  impressions?: number;
}

export interface PostFrequencyData {
  postsLast24h: number;
  postsLast7d: number;
  postsLast30d: number;
  avgPostsPerDay: number;
  changeFromPrevious: number; // Percentage change
}

export interface ContentTypeAnalysis {
  photo: ContentTypeMetrics;
  video: ContentTypeMetrics;
  link: ContentTypeMetrics;
  status: ContentTypeMetrics;
  event: ContentTypeMetrics;
}

export interface ContentTypeMetrics {
  count: number;
  percentage: number;
  avgEngagement: number;
  bestPerforming?: {
    postId: string;
    engagement: number;
  };
}

export interface TrendingData {
  hashtags: Array<{
    hashtag: string;
    count: number;
    engagementScore: number;
  }>;
  keywords: Array<{
    keyword: string;
    frequency: number;
    sentiment: 'positive' | 'neutral' | 'negative';
  }>;
  mentions: Array<{
    mentioned: string;
    count: number;
    type: 'user' | 'brand' | 'location';
  }>;
}

export interface CompetitorBenchmark {
  metric: string;
  yourValue: number;
  competitorAverage: number;
  industryAverage?: number;
  percentile: number;
  recommendation: string;
}

export interface CompetitorReportData {
  reportId: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  competitors: CompetitorSummary[];
  benchmarks: CompetitorBenchmark[];
  insights: AnalysisInsights;
  actionItems: ActionItem[];
}

export interface CompetitorSummary {
  pageId: string;
  name: string;
  metrics: CompetitorMetrics;
  growth: GrowthAnalysis;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface GrowthAnalysis {
  followerGrowthRate: number;
  engagementGrowthRate: number;
  contentVolumeChange: number;
  qualityScore: number; // 0-100
  trendDirection: 'up' | 'down' | 'stable';
}

export interface AnalysisInsights {
  marketTrends: string[];
  contentStrategies: string[];
  audienceBehavior: string[];
  seasonalPatterns: string[];
  emergingCompetitors: string[];
}

export interface ActionItem {
  priority: 'high' | 'medium' | 'low';
  category: 'content' | 'engagement' | 'posting' | 'strategy';
  recommendation: string;
  expectedImpact: string;
  estimatedEffort: 'low' | 'medium' | 'high';
  timeframe: string;
}

export interface MonitoringAlert {
  id: string;
  type: 'viral_content' | 'growth_spike' | 'engagement_drop' | 'new_competitor' | 'strategy_change';
  severity: 'info' | 'warning' | 'critical';
  competitorId: string;
  competitorName: string;
  message: string;
  data: Record<string, unknown>;
  triggeredAt: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

export interface CompetitorViralContent {
  postId: string;
  pageId: string;
  pageName: string;
  content: string;
  postType: string;
  publishedAt: Date;
  detectedAt: Date;
  metrics: EngagementSnapshot;
  viralScore: number; // 0-100
  shareVelocity: number; // Shares per hour
  commentSentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  hashtags: string[];
  mentions: string[];
}

export interface ViralContentAlert {
  pageId: string;
  pageName: string;
  postId: string;
  postUrl: string;
  engagementScore: number;
  type: 'viral_content' | 'high_engagement' | 'trending_hashtag';
  metrics: EngagementSnapshot;
  detectedAt: Date;
}

export interface CompetitorPostPerformance {
  postId: string;
  pageId: string;
  content: string;
  type: string;
  publishedAt: Date;
  metrics: EngagementSnapshot;
  performance: 'viral' | 'high' | 'average' | 'low';
  benchmarkScore: number; // Compared to page average
  audienceReach?: number;
  clickThroughRate?: number;
}

export interface CompetitorAnalysisJob {
  competitorPageIds: string[];
  analysisType: 'full' | 'metrics_only' | 'content_only';
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeInsights: boolean;
  generateReport: boolean;
  priority: 'low' | 'normal' | 'high';
}