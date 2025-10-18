import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ScheduledPost,
  ScheduledPostDocument,
} from '../schemas/scheduled-post.schema';

/**
 * 🎯 Optimal Time Predictor Service
 *
 * FASE 9: Predicción de horarios óptimos usando ML básico
 *
 * Responsabilidades:
 * - Predecir mejor horario para publicar basado en histórico
 * - Análisis de patrones temporales
 * - Scoring de horarios por engagement
 * - Sugerencias personalizadas por tipo de contenido
 */
@Injectable()
export class OptimalTimePredictorService {
  private readonly logger = new Logger(OptimalTimePredictorService.name);

  constructor(
    @InjectModel(ScheduledPost.name)
    private scheduledPostModel: Model<ScheduledPostDocument>,
  ) {
    this.logger.log('🎯 Optimal Time Predictor Service initialized');
  }

  /**
   * 🎯 Predice el mejor horario para publicar
   *
   * Usa histórico de engagement para predecir mejor momento
   *
   * @param platform - Plataforma (facebook, twitter)
   * @param contentType - Tipo de contenido
   * @param targetDate - Fecha objetivo (opcional, default: mañana)
   * @returns Horario óptimo predicho con score de confianza
   */
  async predictOptimalTime(
    platform: 'facebook' | 'twitter',
    contentType: string,
    targetDate?: Date,
  ): Promise<{
    recommendedTime: Date;
    confidence: number;
    alternativeTimes: Array<{ time: Date; score: number }>;
    reasoning: string[];
  }> {
    // Si no hay targetDate, usar mañana
    const target = targetDate || new Date(Date.now() + 24 * 60 * 60 * 1000);
    const dayOfWeek = target.getDay(); // 0=Domingo, 6=Sábado

    // Obtener datos históricos de los últimos 60 días
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 60);

    const historicalData = await this.scheduledPostModel.aggregate([
      {
        $match: {
          status: 'published',
          platform,
          contentType,
          publishedAt: { $gte: cutoffDate },
        },
      },
      {
        $addFields: {
          hour: { $hour: '$publishedAt' },
          dayOfWeek: { $dayOfWeek: '$publishedAt' },
        },
      },
      {
        $group: {
          _id: {
            hour: '$hour',
            dayOfWeek: '$dayOfWeek',
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
    ]);

    if (historicalData.length === 0) {
      // Sin datos históricos, usar horarios por defecto
      return this.getDefaultOptimalTime(platform, contentType, target);
    }

    // Filtrar por mismo día de la semana
    const sameDayData = historicalData.filter(
      (item) => item._id.dayOfWeek === dayOfWeek + 1, // MongoDB usa 1=Domingo
    );

    let dataToUse = sameDayData.length >= 3 ? sameDayData : historicalData;

    // Calcular scores para cada hora
    const hourScores = this.calculateHourScores(dataToUse);

    // Obtener top 3 horarios
    const topHours = hourScores.slice(0, 3);

    if (topHours.length === 0) {
      return this.getDefaultOptimalTime(platform, contentType, target);
    }

    // Construir fecha recomendada
    const bestHour = topHours[0];
    const recommendedTime = new Date(target);
    recommendedTime.setHours(bestHour.hour, 0, 0, 0);

    // Calcular confianza (basado en cantidad de datos)
    const confidence = this.calculateConfidence(dataToUse.length);

    // Construir alternativas
    const alternativeTimes = topHours.slice(1).map((item) => {
      const altTime = new Date(target);
      altTime.setHours(item.hour, 0, 0, 0);
      return {
        time: altTime,
        score: item.score,
      };
    });

    // Generar reasoning
    const reasoning = this.generateReasoning(
      platform,
      contentType,
      bestHour,
      dataToUse.length,
      sameDayData.length > 0,
    );

    return {
      recommendedTime,
      confidence,
      alternativeTimes,
      reasoning,
    };
  }

  /**
   * 📊 Calcula scores para cada hora basado en histórico
   *
   * @param data - Datos históricos
   * @returns Array de scores por hora
   */
  private calculateHourScores(
    data: Array<any>,
  ): Array<{ hour: number; score: number; posts: number }> {
    // Agrupar por hora
    const hourlyData: Record<
      number,
      { engagement: number; reach: number; posts: number }
    > = {};

    data.forEach((item) => {
      const hour = item._id.hour;
      if (!hourlyData[hour]) {
        hourlyData[hour] = { engagement: 0, reach: 0, posts: 0 };
      }
      hourlyData[hour].engagement += item.totalEngagement || 0;
      hourlyData[hour].reach += item.totalReach || 0;
      hourlyData[hour].posts += item.totalPosts || 0;
    });

    // Calcular scores normalizados
    const scores: Array<{ hour: number; score: number; posts: number }> = [];

    for (const [hour, stats] of Object.entries(hourlyData)) {
      const engagementRate =
        stats.reach > 0 ? (stats.engagement / stats.reach) * 100 : 0;

      // Score = engagement rate * factor de posts (más datos = más confiable)
      const postsFactor = Math.min(stats.posts / 10, 1); // Cap en 10 posts
      const score = engagementRate * (0.7 + 0.3 * postsFactor);

      scores.push({
        hour: parseInt(hour),
        score: parseFloat(score.toFixed(2)),
        posts: stats.posts,
      });
    }

    return scores.sort((a, b) => b.score - a.score);
  }

  /**
   * 🎲 Calcula confianza de la predicción
   *
   * @param dataPoints - Número de puntos de datos
   * @returns Porcentaje de confianza (0-100)
   */
  private calculateConfidence(dataPoints: number): number {
    if (dataPoints === 0) return 0;
    if (dataPoints >= 30) return 95;
    if (dataPoints >= 20) return 85;
    if (dataPoints >= 10) return 70;
    if (dataPoints >= 5) return 50;
    return 30;
  }

  /**
   * 📝 Genera reasoning para la predicción
   *
   * @param platform - Plataforma
   * @param contentType - Tipo de contenido
   * @param bestHour - Mejor hora encontrada
   * @param totalData - Total de datos analizados
   * @param hasSameDayData - Si hay datos del mismo día
   * @returns Array de razones
   */
  private generateReasoning(
    platform: string,
    contentType: string,
    bestHour: { hour: number; score: number; posts: number },
    totalData: number,
    hasSameDayData: boolean,
  ): string[] {
    const reasoning: string[] = [];

    reasoning.push(
      `Basado en análisis de ${totalData} publicaciones históricas`,
    );

    if (hasSameDayData) {
      reasoning.push(`Datos específicos del mismo día de la semana utilizados`);
    }

    reasoning.push(
      `${bestHour.hour}:00 ha mostrado score de ${bestHour.score} en engagement`,
    );

    reasoning.push(
      `${bestHour.posts} posts similares publicados en este horario`,
    );

    // Razones contextuales por horario
    if (bestHour.hour >= 9 && bestHour.hour <= 11) {
      reasoning.push(`Horario matutino: Audiencia revisa redes al inicio del día`);
    } else if (bestHour.hour >= 12 && bestHour.hour <= 14) {
      reasoning.push(`Horario de comida: Alta actividad durante descansos`);
    } else if (bestHour.hour >= 18 && bestHour.hour <= 21) {
      reasoning.push(`Horario vespertino: Pico de actividad después del trabajo`);
    }

    return reasoning;
  }

  /**
   * ⚙️ Obtiene horario óptimo por defecto (sin datos históricos)
   *
   * @param platform - Plataforma
   * @param contentType - Tipo de contenido
   * @param targetDate - Fecha objetivo
   * @returns Horario por defecto
   */
  private getDefaultOptimalTime(
    platform: string,
    contentType: string,
    targetDate: Date,
  ): {
    recommendedTime: Date;
    confidence: number;
    alternativeTimes: Array<{ time: Date; score: number }>;
    reasoning: string[];
  } {
    // Horarios por defecto basados en best practices
    let defaultHour = 10; // 10 AM por defecto

    if (platform === 'facebook') {
      if (contentType === 'breaking_news') {
        defaultHour = 9; // Breaking news temprano
      } else if (contentType === 'evergreen') {
        defaultHour = 14; // Evergreen en la tarde
      } else {
        defaultHour = 10; // Normal en la mañana
      }
    } else if (platform === 'twitter') {
      if (contentType === 'breaking_news') {
        defaultHour = 8; // Twitter breaking muy temprano
      } else {
        defaultHour = 12; // Twitter en hora de comida
      }
    }

    const recommendedTime = new Date(targetDate);
    recommendedTime.setHours(defaultHour, 0, 0, 0);

    const alt1 = new Date(targetDate);
    alt1.setHours(defaultHour + 2, 0, 0, 0);

    const alt2 = new Date(targetDate);
    alt2.setHours(defaultHour + 6, 0, 0, 0);

    return {
      recommendedTime,
      confidence: 30,
      alternativeTimes: [
        { time: alt1, score: 75 },
        { time: alt2, score: 70 },
      ],
      reasoning: [
        'Sin datos históricos suficientes',
        `Usando mejores prácticas para ${platform}`,
        `${defaultHour}:00 es horario estándar óptimo para ${contentType}`,
      ],
    };
  }

  /**
   * 📅 Obtiene ventana óptima de publicación
   *
   * Retorna rango de horas recomendadas en lugar de hora exacta
   *
   * @param platform - Plataforma
   * @param contentType - Tipo de contenido
   * @param days - Días hacia adelante para analizar (default: 7)
   * @returns Ventanas óptimas por día
   */
  async getOptimalTimeWindows(
    platform: 'facebook' | 'twitter',
    contentType: string,
    days: number = 7,
  ): Promise<
    Array<{
      date: Date;
      dayName: string;
      windows: Array<{
        startHour: number;
        endHour: number;
        score: number;
      }>;
    }>
  > {
    const result: Array<{
      date: Date;
      dayName: string;
      windows: Array<{
        startHour: number;
        endHour: number;
        score: number;
      }>;
    }> = [];

    const dayNames = [
      'Domingo',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
    ];

    for (let i = 0; i < days; i++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + i);

      const prediction = await this.predictOptimalTime(
        platform,
        contentType,
        targetDate,
      );

      // Crear ventana de 2 horas alrededor del horario recomendado
      const recommendedHour = prediction.recommendedTime.getHours();
      const windows = [
        {
          startHour: Math.max(recommendedHour - 1, 0),
          endHour: Math.min(recommendedHour + 1, 23),
          score: 100,
        },
      ];

      // Agregar ventanas alternativas
      prediction.alternativeTimes.forEach((alt) => {
        const altHour = alt.time.getHours();
        windows.push({
          startHour: Math.max(altHour - 1, 0),
          endHour: Math.min(altHour + 1, 23),
          score: alt.score,
        });
      });

      result.push({
        date: targetDate,
        dayName: dayNames[targetDate.getDay()],
        windows,
      });
    }

    return result;
  }
}
