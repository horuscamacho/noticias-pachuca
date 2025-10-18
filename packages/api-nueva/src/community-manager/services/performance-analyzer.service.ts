import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ScheduledPost,
  ScheduledPostDocument,
} from '../schemas/scheduled-post.schema';

/**
 * 🔍 Performance Analyzer Service
 *
 * FASE 9: Análisis avanzado de performance
 *
 * Responsabilidades:
 * - Detectar tendencias de engagement
 * - Identificar patrones de audiencia
 * - Comparar performance entre períodos
 * - Sugerir mejores prácticas basadas en datos
 * - Detectar contenido con bajo rendimiento
 */
@Injectable()
export class PerformanceAnalyzerService {
  private readonly logger = new Logger(PerformanceAnalyzerService.name);

  constructor(
    @InjectModel(ScheduledPost.name)
    private scheduledPostModel: Model<ScheduledPostDocument>,
  ) {
    this.logger.log('🔍 Performance Analyzer Service initialized');
  }

  /**
   * 📈 Detecta tendencias de engagement
   *
   * Compara últimos 7 días vs 7 días anteriores
   *
   * @param platform - Plataforma (facebook, twitter, o undefined)
   * @returns Tendencias con porcentajes de cambio
   */
  async detectEngagementTrends(
    platform?: 'facebook' | 'twitter',
  ): Promise<{
    current: {
      avgEngagement: number;
      avgReach: number;
      engagementRate: number;
      totalPosts: number;
    };
    previous: {
      avgEngagement: number;
      avgReach: number;
      engagementRate: number;
      totalPosts: number;
    };
    trends: {
      engagement: { value: number; trend: 'up' | 'down' | 'stable' };
      reach: { value: number; trend: 'up' | 'down' | 'stable' };
      engagementRate: { value: number; trend: 'up' | 'down' | 'stable' };
    };
  }> {
    const now = new Date();

    // Últimos 7 días
    const currentStart = new Date(now);
    currentStart.setDate(currentStart.getDate() - 7);

    // 7 días anteriores
    const previousStart = new Date(now);
    previousStart.setDate(previousStart.getDate() - 14);
    const previousEnd = new Date(now);
    previousEnd.setDate(previousEnd.getDate() - 7);

    const matchStage = (start: Date, end: Date): Record<string, any> => {
      const match: Record<string, any> = {
        status: 'published',
        publishedAt: { $gte: start, $lt: end },
      };
      if (platform) {
        match.platform = platform;
      }
      return match;
    };

    // Calcular métricas para ambos períodos
    const [currentMetrics, previousMetrics] = await Promise.all([
      this.calculatePeriodMetrics(matchStage(currentStart, now)),
      this.calculatePeriodMetrics(matchStage(previousStart, previousEnd)),
    ]);

    // Calcular tendencias
    const calculateTrend = (
      current: number,
      previous: number,
    ): { value: number; trend: 'up' | 'down' | 'stable' } => {
      if (previous === 0) {
        return { value: 0, trend: 'stable' };
      }

      const percentChange = ((current - previous) / previous) * 100;
      const trend =
        Math.abs(percentChange) < 5
          ? 'stable'
          : percentChange > 0
            ? 'up'
            : 'down';

      return {
        value: parseFloat(percentChange.toFixed(2)),
        trend,
      };
    };

    return {
      current: currentMetrics,
      previous: previousMetrics,
      trends: {
        engagement: calculateTrend(
          currentMetrics.avgEngagement,
          previousMetrics.avgEngagement,
        ),
        reach: calculateTrend(currentMetrics.avgReach, previousMetrics.avgReach),
        engagementRate: calculateTrend(
          currentMetrics.engagementRate,
          previousMetrics.engagementRate,
        ),
      },
    };
  }

  /**
   * 🎯 Identifica patrones de audiencia
   *
   * Detecta cuándo la audiencia está más activa
   *
   * @param platform - Plataforma (facebook, twitter, o undefined)
   * @returns Patrones identificados
   */
  async identifyAudiencePatterns(
    platform?: 'facebook' | 'twitter',
  ): Promise<{
    peakHours: Array<{ hour: number; engagementRate: number }>;
    peakDays: Array<{ dayName: string; engagementRate: number }>;
    recommendations: string[];
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const matchStage: Record<string, any> = {
      status: 'published',
      publishedAt: { $gte: cutoffDate },
    };

    if (platform) {
      matchStage.platform = platform;
    }

    // Análisis por hora
    const hourlyData = await this.scheduledPostModel.aggregate([
      { $match: matchStage },
      {
        $addFields: {
          hour: { $hour: '$publishedAt' },
        },
      },
      {
        $group: {
          _id: '$hour',
          totalEngagement: { $sum: '$engagement.totalEngagement' },
          totalReach: { $sum: '$engagement.reach' },
        },
      },
      {
        $addFields: {
          engagementRate: {
            $cond: [
              { $gt: ['$totalReach', 0] },
              {
                $multiply: [
                  { $divide: ['$totalEngagement', '$totalReach'] },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
      { $sort: { engagementRate: -1 } },
      { $limit: 5 },
    ]);

    // Análisis por día
    const dailyData = await this.scheduledPostModel.aggregate([
      { $match: matchStage },
      {
        $addFields: {
          dayOfWeek: { $dayOfWeek: '$publishedAt' },
        },
      },
      {
        $group: {
          _id: '$dayOfWeek',
          totalEngagement: { $sum: '$engagement.totalEngagement' },
          totalReach: { $sum: '$engagement.reach' },
        },
      },
      {
        $addFields: {
          engagementRate: {
            $cond: [
              { $gt: ['$totalReach', 0] },
              {
                $multiply: [
                  { $divide: ['$totalEngagement', '$totalReach'] },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
      { $sort: { engagementRate: -1 } },
      { $limit: 3 },
    ]);

    const dayNames = [
      'Domingo',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
    ];

    const peakHours = hourlyData.map((item) => ({
      hour: item._id,
      engagementRate: parseFloat((item.engagementRate || 0).toFixed(2)),
    }));

    const peakDays = dailyData.map((item) => ({
      dayName: dayNames[item._id - 1],
      engagementRate: parseFloat((item.engagementRate || 0).toFixed(2)),
    }));

    // Generar recomendaciones
    const recommendations: string[] = [];

    if (peakHours.length > 0) {
      const topHour = peakHours[0];
      recommendations.push(
        `Mejor hora para publicar: ${topHour.hour}:00 con ${topHour.engagementRate}% de engagement rate`,
      );
    }

    if (peakDays.length > 0) {
      const topDay = peakDays[0];
      recommendations.push(
        `Mejor día para publicar: ${topDay.dayName} con ${topDay.engagementRate}% de engagement rate`,
      );
    }

    if (peakHours.length >= 2) {
      const secondHour = peakHours[1];
      recommendations.push(
        `Segunda mejor hora: ${secondHour.hour}:00 para contenido adicional`,
      );
    }

    return {
      peakHours,
      peakDays,
      recommendations,
    };
  }

  /**
   * ⚠️ Detecta contenido con bajo rendimiento
   *
   * @param platform - Plataforma (facebook, twitter, o undefined)
   * @param days - Días hacia atrás para analizar (default: 30)
   * @returns Array de posts con bajo rendimiento
   */
  async detectUnderperformingContent(
    platform?: 'facebook' | 'twitter',
    days: number = 30,
  ): Promise<
    Array<{
      postId: string;
      contentType: string;
      publishedAt: Date;
      engagementRate: number;
      avgEngagementRate: number;
      percentageBelowAvg: number;
      reasons: string[];
    }>
  > {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const matchStage: Record<string, any> = {
      status: 'published',
      publishedAt: { $gte: cutoffDate },
    };

    if (platform) {
      matchStage.platform = platform;
    }

    // Calcular engagement rate promedio
    const avgResult = await this.scheduledPostModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          avgEngagementRate: {
            $avg: {
              $cond: [
                { $gt: ['$engagement.reach', 0] },
                {
                  $multiply: [
                    {
                      $divide: [
                        '$engagement.totalEngagement',
                        '$engagement.reach',
                      ],
                    },
                    100,
                  ],
                },
                0,
              ],
            },
          },
        },
      },
    ]);

    const avgEngagementRate =
      avgResult.length > 0 ? avgResult[0].avgEngagementRate : 0;

    // Threshold: 50% por debajo del promedio
    const threshold = avgEngagementRate * 0.5;

    // Buscar posts por debajo del threshold
    const posts = await this.scheduledPostModel
      .find(matchStage)
      .exec();

    const underperforming = posts
      .map((post) => {
        const likes = post.engagement?.likes || 0;
        const comments = post.engagement?.comments || 0;
        const shares = post.engagement?.shares || 0;
        const reach = post.engagement?.reach || 0;
        const engagement = likes + comments + shares;
        const engagementRate = reach > 0 ? (engagement / reach) * 100 : 0;

        if (engagementRate >= threshold) {
          return null;
        }

        const percentageBelowAvg =
          avgEngagementRate > 0
            ? ((avgEngagementRate - engagementRate) / avgEngagementRate) * 100
            : 0;

        // Determinar razones
        const reasons: string[] = [];

        if (engagementRate < threshold) {
          reasons.push('Engagement rate muy bajo comparado con el promedio');
        }

        if (reach < 100) {
          reasons.push('Alcance muy bajo');
        }

        const hour = post.publishedAt ? post.publishedAt.getHours() : 0;
        if (hour < 6 || hour > 22) {
          reasons.push('Publicado en horario de baja actividad');
        }

        return {
          postId: String(post._id),
          contentType: post.contentType,
          publishedAt: post.publishedAt!,
          engagementRate: parseFloat(engagementRate.toFixed(2)),
          avgEngagementRate: parseFloat(avgEngagementRate.toFixed(2)),
          percentageBelowAvg: parseFloat(percentageBelowAvg.toFixed(2)),
          reasons,
        };
      })
      .filter((item) => item !== null);

    return underperforming.slice(0, 10); // Top 10 peores
  }

  /**
   * 📊 Calcula métricas de un período
   *
   * @param matchStage - Match stage de MongoDB
   * @returns Métricas del período
   */
  private async calculatePeriodMetrics(
    matchStage: Record<string, any>,
  ): Promise<{
    avgEngagement: number;
    avgReach: number;
    engagementRate: number;
    totalPosts: number;
  }> {
    const result = await this.scheduledPostModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalPosts: { $sum: 1 },
          avgEngagement: { $avg: '$engagement.totalEngagement' },
          avgReach: { $avg: '$engagement.reach' },
          totalEngagement: { $sum: '$engagement.totalEngagement' },
          totalReach: { $sum: '$engagement.reach' },
        },
      },
      {
        $addFields: {
          engagementRate: {
            $cond: [
              { $gt: ['$totalReach', 0] },
              {
                $multiply: [
                  { $divide: ['$totalEngagement', '$totalReach'] },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
    ]);

    if (result.length === 0) {
      return {
        avgEngagement: 0,
        avgReach: 0,
        engagementRate: 0,
        totalPosts: 0,
      };
    }

    return {
      avgEngagement: Math.round(result[0].avgEngagement || 0),
      avgReach: Math.round(result[0].avgReach || 0),
      engagementRate: parseFloat((result[0].engagementRate || 0).toFixed(2)),
      totalPosts: result[0].totalPosts,
    };
  }
}
