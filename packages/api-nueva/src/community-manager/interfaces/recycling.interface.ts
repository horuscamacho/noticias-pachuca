/**
 * 🔄 Interfaces para sistema de reciclaje de contenido evergreen
 */

export type RecycleType = 'pure_evergreen' | 'seasonal_evergreen' | 'durable' | 'not_recyclable';

/**
 * Criterios de elegibilidad para reciclaje
 */
export interface RecyclingEligibilityCriteria {
  minAgeMonths: number; // 3 meses mínimo
  minPerformanceScore: number; // 0.7 (70%)
  minDaysSinceLastRecycle: number; // 60 días
  maxTotalRecycles: number; // 3 reciclajes
  excludeIfBreakingNewsActive: boolean;
}

/**
 * Resultado de verificación de elegibilidad
 */
export interface EligibilityCheckResult {
  isEligible: boolean;
  recycleType: RecycleType;
  reasons: string[]; // Razones de elegibilidad o no elegibilidad
  nextAllowedRecycleDate?: Date;
  performanceScore?: number;
}

/**
 * Configuración de reciclaje
 */
export interface RecyclingConfig {
  preferredDaysOfWeek: number[]; // [6,0] = Sábado, Domingo
  preferredTimeSlots: string[]; // ['06:00-08:00', '14:00-16:00', '21:00-23:00']
  regenerateSocialCopy: boolean;
  platforms: ('facebook' | 'twitter')[];
  recycleFrequencyDays: number; // 90 días
  maxRecycles: number; // 3
}

/**
 * Performance de reciclaje
 */
export interface RecyclePerformance {
  recycleDate: Date;
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
 * Estadísticas de reciclaje
 */
export interface RecyclingStats {
  totalRecycled: number;
  totalEligible: number;
  averagePerformanceVsOriginal: number;
  byRecycleType: Record<RecycleType, number>;
  topPerformingRecycles: Array<{
    noticiaId: string;
    title: string;
    recycleNumber: number;
    performanceVsOriginal: number;
  }>;
}
