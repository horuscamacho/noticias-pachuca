import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ScheduledPost,
  ScheduledPostDocument,
} from '../schemas/scheduled-post.schema';

/**
 * 📊 Analytics Service
 *
 * FASE 9: Analytics Mejorados
 *
 * Responsabilidades:
 * - Engagement rate por horario y tipo de contenido
 * - Análisis de performance histórico
 * - Identificación de patrones de audiencia
 * - Heatmaps de engagement
 * - Best performing content types y time slots
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectModel(ScheduledPost.name)
    private scheduledPostModel: Model<ScheduledPostDocument>,
  ) {
    this.logger.log('📊 Analytics Service initialized');
  }

  /**
   * 📈 Obtiene engagement rate por horario
   *
   * Agrupa posts publicados por hora del día y calcula métricas
   *
   * @param platform - Plataforma (facebook, twitter, o undefined para todas)
   * @param days - Días hacia atrás para analizar (default: 30)
   * @returns Array de engagement por hora
   */
  async getEngagementByTimeOfDay(
    platform?: 'facebook' | 'twitter',
    days: number = 30,
  ): Promise<
    Array<{
      hour: number;
      totalPosts: number;
      avgEngagement: number;
      avgReach: number;
      engagementRate: number;
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

    const result = await this.scheduledPostModel.aggregate([
      { $match: matchStage },
      {
        $addFields: {
          hour: { $hour: '$publishedAt' },
        },
      },
      {
        $group: {
          _id: '$hour',
          totalPosts: { $sum: 1 },
          avgEngagement: { $avg: {
            $add: [
              { $ifNull: ['$engagement.likes', 0] },
              { $ifNull: ['$engagement.comments', 0] },
              { $ifNull: ['$engagement.shares', 0] },
            ],
          }},
          avgReach: { $avg: { $ifNull: ['$engagement.reach', 0] } },
          totalEngagement: { $sum: {
            $add: [
              { $ifNull: ['$engagement.likes', 0] },
              { $ifNull: ['$engagement.comments', 0] },
              { $ifNull: ['$engagement.shares', 0] },
            ],
          }},
          totalReach: { $sum: { $ifNull: ['$engagement.reach', 0] } },
        },
      },
      {
        $addFields: {
          engagementRate: {
            $cond: [
              { $gt: ['$totalReach', 0] },
              { $multiply: [{ $divide: ['$totalEngagement', '$totalReach'] }, 100] },
              0,
            ],
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return result.map((item) => ({
      hour: item._id,
      totalPosts: item.totalPosts,
      avgEngagement: Math.round(item.avgEngagement || 0),
      avgReach: Math.round(item.avgReach || 0),
      engagementRate: parseFloat((item.engagementRate || 0).toFixed(2)),
    }));
  }

  /**
   * 📊 Obtiene engagement rate por día de la semana
   *
   * @param platform - Plataforma (facebook, twitter, o undefined)
   * @param days - Días hacia atrás para analizar (default: 30)
   * @returns Array de engagement por día
   */
  async getEngagementByDayOfWeek(
    platform?: 'facebook' | 'twitter',
    days: number = 30,
  ): Promise<
    Array<{
      dayOfWeek: number; // 0=Domingo, 1=Lunes, etc.
      dayName: string;
      totalPosts: number;
      avgEngagement: number;
      avgReach: number;
      engagementRate: number;
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

    const result = await this.scheduledPostModel.aggregate([
      { $match: matchStage },
      {
        $addFields: {
          dayOfWeek: { $dayOfWeek: '$publishedAt' }, // 1=Domingo, 2=Lunes, etc.
        },
      },
      {
        $group: {
          _id: '$dayOfWeek',
          totalPosts: { $sum: 1 },
          avgEngagement: { $avg: {
            $add: [
              { $ifNull: ['$engagement.likes', 0] },
              { $ifNull: ['$engagement.comments', 0] },
              { $ifNull: ['$engagement.shares', 0] },
            ],
          }},
          avgReach: { $avg: { $ifNull: ['$engagement.reach', 0] } },
          totalEngagement: { $sum: {
            $add: [
              { $ifNull: ['$engagement.likes', 0] },
              { $ifNull: ['$engagement.comments', 0] },
              { $ifNull: ['$engagement.shares', 0] },
            ],
          }},
          totalReach: { $sum: { $ifNull: ['$engagement.reach', 0] } },
        },
      },
      {
        $addFields: {
          engagementRate: {
            $cond: [
              { $gt: ['$totalReach', 0] },
              { $multiply: [{ $divide: ['$totalEngagement', '$totalReach'] }, 100] },
              0,
            ],
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    return result.map((item) => ({
      dayOfWeek: item._id - 1, // Convertir a 0=Domingo
      dayName: dayNames[item._id - 1],
      totalPosts: item.totalPosts,
      avgEngagement: Math.round(item.avgEngagement || 0),
      avgReach: Math.round(item.avgReach || 0),
      engagementRate: parseFloat((item.engagementRate || 0).toFixed(2)),
    }));
  }

  /**
   * 📝 Obtiene performance por tipo de contenido
   *
   * @param platform - Plataforma (facebook, twitter, o undefined)
   * @param days - Días hacia atrás para analizar (default: 30)
   * @returns Array de performance por content type
   */
  async getPerformanceByContentType(
    platform?: 'facebook' | 'twitter',
    days: number = 30,
  ): Promise<
    Array<{
      contentType: string;
      totalPosts: number;
      avgEngagement: number;
      avgReach: number;
      engagementRate: number;
      bestTimeSlot: string;
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

    const result = await this.scheduledPostModel.aggregate([
      { $match: matchStage },
      {
        $addFields: {
          hour: { $hour: '$publishedAt' },
        },
      },
      {
        $group: {
          _id: {
            contentType: '$contentType',
            hour: '$hour',
          },
          totalPosts: { $sum: 1 },
          avgEngagement: { $avg: {
            $add: [
              { $ifNull: ['$engagement.likes', 0] },
              { $ifNull: ['$engagement.comments', 0] },
              { $ifNull: ['$engagement.shares', 0] },
            ],
          }},
          avgReach: { $avg: { $ifNull: ['$engagement.reach', 0] } },
          totalEngagement: { $sum: {
            $add: [
              { $ifNull: ['$engagement.likes', 0] },
              { $ifNull: ['$engagement.comments', 0] },
              { $ifNull: ['$engagement.shares', 0] },
            ],
          }},
          totalReach: { $sum: { $ifNull: ['$engagement.reach', 0] } },
        },
      },
      {
        $group: {
          _id: '$_id.contentType',
          totalPosts: { $sum: '$totalPosts' },
          avgEngagement: { $avg: '$avgEngagement' },
          avgReach: { $avg: '$avgReach' },
          totalEngagement: { $sum: '$totalEngagement' },
          totalReach: { $sum: '$totalReach' },
          timeSlots: {
            $push: {
              hour: '$_id.hour',
              engagement: '$totalEngagement',
            },
          },
        },
      },
      {
        $addFields: {
          engagementRate: {
            $cond: [
              { $gt: ['$totalReach', 0] },
              { $multiply: [{ $divide: ['$totalEngagement', '$totalReach'] }, 100] },
              0,
            ],
          },
          bestTimeSlot: {
            $arrayElemAt: [
              {
                $map: {
                  input: {
                    $slice: [
                      {
                        $sortArray: {
                          input: '$timeSlots',
                          sortBy: { engagement: -1 },
                        },
                      },
                      1,
                    ],
                  },
                  as: 'slot',
                  in: '$$slot.hour',
                },
              },
              0,
            ],
          },
        },
      },
      { $sort: { totalEngagement: -1 } },
    ]);

    return result.map((item) => ({
      contentType: item._id,
      totalPosts: item.totalPosts,
      avgEngagement: Math.round(item.avgEngagement || 0),
      avgReach: Math.round(item.avgReach || 0),
      engagementRate: parseFloat((item.engagementRate || 0).toFixed(2)),
      bestTimeSlot: `${item.bestTimeSlot || 0}:00`,
    }));
  }

  /**
   * 🔥 Obtiene heatmap de engagement (hora x día)
   *
   * @param platform - Plataforma (facebook, twitter, o undefined)
   * @param days - Días hacia atrás para analizar (default: 30)
   * @returns Matriz de engagement [dayOfWeek][hour]
   */
  async getEngagementHeatmap(
    platform?: 'facebook' | 'twitter',
    days: number = 30,
  ): Promise<
    Array<{
      dayOfWeek: number;
      dayName: string;
      hourlyEngagement: Array<{
        hour: number;
        engagementRate: number;
        totalPosts: number;
      }>;
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

    const result = await this.scheduledPostModel.aggregate([
      { $match: matchStage },
      {
        $addFields: {
          hour: { $hour: '$publishedAt' },
          dayOfWeek: { $dayOfWeek: '$publishedAt' },
        },
      },
      {
        $group: {
          _id: {
            dayOfWeek: '$dayOfWeek',
            hour: '$hour',
          },
          totalPosts: { $sum: 1 },
          totalEngagement: { $sum: {
            $add: [
              { $ifNull: ['$engagement.likes', 0] },
              { $ifNull: ['$engagement.comments', 0] },
              { $ifNull: ['$engagement.shares', 0] },
            ],
          }},
          totalReach: { $sum: { $ifNull: ['$engagement.reach', 0] } },
        },
      },
      {
        $addFields: {
          engagementRate: {
            $cond: [
              { $gt: ['$totalReach', 0] },
              { $multiply: [{ $divide: ['$totalEngagement', '$totalReach'] }, 100] },
              0,
            ],
          },
        },
      },
      { $sort: { '_id.dayOfWeek': 1, '_id.hour': 1 } },
    ]);

    // Agrupar por día
    const heatmapByDay: Record<number, Array<any>> = {};

    result.forEach((item) => {
      const day = item._id.dayOfWeek - 1; // Convertir a 0=Domingo
      if (!heatmapByDay[day]) {
        heatmapByDay[day] = [];
      }
      heatmapByDay[day].push({
        hour: item._id.hour,
        engagementRate: parseFloat((item.engagementRate || 0).toFixed(2)),
        totalPosts: item.totalPosts,
      });
    });

    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    return Object.entries(heatmapByDay).map(([day, hours]) => ({
      dayOfWeek: parseInt(day),
      dayName: dayNames[parseInt(day)],
      hourlyEngagement: hours,
    }));
  }

  /**
   * 🏆 Obtiene top performing posts
   *
   * @param platform - Plataforma (facebook, twitter, o undefined)
   * @param limit - Número de posts a retornar (default: 10)
   * @param days - Días hacia atrás para analizar (default: 30)
   * @returns Array de top posts
   */
  async getTopPerformingPosts(
    platform?: 'facebook' | 'twitter',
    limit: number = 10,
    days: number = 30,
  ): Promise<
    Array<{
      postId: string;
      platform: string;
      contentType: string;
      publishedAt: Date;
      engagement: number;
      reach: number;
      engagementRate: number;
      postContent: string;
    }>
  > {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const matchStage: Record<string, any> = {
      status: 'published',
      publishedAt: { $gte: cutoffDate },
      engagement: { $exists: true },
    };

    if (platform) {
      matchStage.platform = platform;
    }

    const posts = await this.scheduledPostModel
      .find(matchStage)
      .limit(limit)
      .exec();

    return posts
      .map((post) => {
        const likes = post.engagement?.likes || 0;
        const comments = post.engagement?.comments || 0;
        const shares = post.engagement?.shares || 0;
        const reach = post.engagement?.reach || 0;
        const totalEngagement = likes + comments + shares;

        return {
          postId: String(post._id),
          platform: post.platform,
          contentType: post.contentType,
          publishedAt: post.publishedAt!,
          engagement: totalEngagement,
          reach,
          engagementRate:
            reach > 0
              ? parseFloat(((totalEngagement / reach) * 100).toFixed(2))
              : 0,
          postContent: post.postContent.substring(0, 200),
        };
      })
      .sort((a, b) => b.engagement - a.engagement);
  }
}
