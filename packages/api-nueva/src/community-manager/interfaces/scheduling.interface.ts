/**
 * 📅 Interfaces para sistema de scheduling inteligente
 */

export type ContentType = 'breaking_news' | 'normal_news' | 'blog' | 'evergreen' | 'recycled';

export type Platform = 'facebook' | 'twitter' | 'instagram';

export type TimeWindow = 'peak' | 'moderate' | 'low';

export type SchedulingMethod =
  | 'optimal_time'
  | 'immediate'
  | 'manual'
  | 'quick'          // Normal news: publicación rápida (15-30 min)
  | 'optimal'        // Blog: siguiente slot óptimo
  | 'delayed_low'    // Evergreen/Recycled: pospuesto por breaking news
  | 'low_traffic'    // Evergreen/Recycled: slot de bajo tráfico
  | 'fallback';      // Fallback por tipo no reconocido

/**
 * Ventana de tiempo óptimo para publicación
 */
export interface OptimalTimeWindow {
  day: number[]; // [1,2,3,4] = Lunes-Jueves
  hours: number[]; // [9,10,11,12,13,14] = 9am-2pm
}

/**
 * Resultado del cálculo de horario óptimo
 */
export interface SchedulingResult {
  scheduledAt: Date;
  calculatedAt: Date;
  reasoning: string;
  metadata: {
    requestedAt: Date;
    calculationMethod: SchedulingMethod;
    timeWindow: TimeWindow;
    isOptimalTime: boolean;
    alternativeTimesConsidered: Date[];
  };
}

/**
 * Opciones para calcular horario óptimo
 */
export interface CalculateOptimalTimeOptions {
  contentType: ContentType;
  platform: Platform;
  currentTime: Date;
  preferImmediate?: boolean; // Breaking news siempre true
  respectSpacing?: boolean; // Respetar espaciado mínimo (default: true)
  avoidBreakingNews?: boolean; // Pausar si hay breaking news activo (default: true para evergreen)
}

/**
 * Estadísticas de publicaciones programadas
 */
export interface SchedulingStats {
  totalScheduled: number;
  byContentType: Record<ContentType, number>;
  byPlatform: Record<Platform, number>;
  byTimeWindow: Record<TimeWindow, number>;
  averageSchedulingDelayMinutes: number;
}
