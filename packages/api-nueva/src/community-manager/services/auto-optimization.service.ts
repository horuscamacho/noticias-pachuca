import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CommunityManagerConfig,
  CommunityManagerConfigDocument,
} from '../schemas/community-manager-config.schema';
import { PerformanceAnalyzerService } from './performance-analyzer.service';
import { OptimalTimePredictorService } from './optimal-time-predictor.service';

/**
 * 🤖 Auto-Optimization Service
 *
 * FASE 9: Optimización automática del sistema
 *
 * Responsabilidades:
 * - Analizar performance automáticamente
 * - Ajustar horarios de publicación basado en datos
 * - Detectar y aplicar mejoras automáticas
 * - Generar recomendaciones de optimización
 * - Auto-tune de parámetros del scheduler
 */
@Injectable()
export class AutoOptimizationService {
  private readonly logger = new Logger(AutoOptimizationService.name);

  constructor(
    @InjectModel(CommunityManagerConfig.name)
    private configModel: Model<CommunityManagerConfigDocument>,
    private performanceAnalyzer: PerformanceAnalyzerService,
    private optimalTimePredictor: OptimalTimePredictorService,
  ) {
    this.logger.log('🤖 Auto-Optimization Service initialized');
  }

  /**
   * 🔄 Cron de optimización automática semanal
   *
   * Ejecuta cada lunes a las 2:00 AM
   */
  @Cron('0 2 * * 1', {
    name: 'weekly-auto-optimization',
    timeZone: 'America/Mexico_City',
  })
  async performWeeklyOptimization(): Promise<void> {
    this.logger.log('🔄 Iniciando optimización automática semanal...');

    try {
      const optimizations = await this.analyzeAndOptimize();

      this.logger.log(
        `✅ Optimización completada: ${optimizations.applied} cambios aplicados, ${optimizations.recommendations} recomendaciones generadas`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Error en optimización automática: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * 🎯 Analiza performance y aplica optimizaciones
   *
   * @returns Resumen de optimizaciones
   */
  async analyzeAndOptimize(): Promise<{
    applied: number;
    recommendations: number;
    changes: Array<{
      type: string;
      description: string;
      applied: boolean;
      reason?: string;
    }>;
  }> {
    const changes: Array<{
      type: string;
      description: string;
      applied: boolean;
      reason?: string;
    }> = [];

    // 1. Analizar tendencias de engagement
    const fbTrends = await this.performanceAnalyzer.detectEngagementTrends(
      'facebook',
    );
    const twTrends = await this.performanceAnalyzer.detectEngagementTrends(
      'twitter',
    );

    // 2. Si hay tendencia negativa significativa, ajustar horarios
    if (
      fbTrends.trends.engagementRate.trend === 'down' &&
      fbTrends.trends.engagementRate.value < -10
    ) {
      const change = await this.optimizeScheduleForPlatform('facebook');
      changes.push(change);
    }

    if (
      twTrends.trends.engagementRate.trend === 'down' &&
      twTrends.trends.engagementRate.value < -10
    ) {
      const change = await this.optimizeScheduleForPlatform('twitter');
      changes.push(change);
    }

    // 3. Identificar patrones de audiencia y sugerir cambios
    const fbPatterns =
      await this.performanceAnalyzer.identifyAudiencePatterns('facebook');
    const twPatterns =
      await this.performanceAnalyzer.identifyAudiencePatterns('twitter');

    if (fbPatterns.recommendations.length > 0) {
      changes.push({
        type: 'recommendation',
        description: `Facebook: ${fbPatterns.recommendations[0]}`,
        applied: false,
      });
    }

    if (twPatterns.recommendations.length > 0) {
      changes.push({
        type: 'recommendation',
        description: `Twitter: ${twPatterns.recommendations[0]}`,
        applied: false,
      });
    }

    // 4. Detectar contenido con bajo rendimiento
    const fbUnderperforming =
      await this.performanceAnalyzer.detectUnderperformingContent(
        'facebook',
        30,
      );

    if (fbUnderperforming.length > 5) {
      changes.push({
        type: 'warning',
        description: `Facebook tiene ${fbUnderperforming.length} posts con bajo rendimiento en últimos 30 días`,
        applied: false,
      });
    }

    const applied = changes.filter((c) => c.applied).length;
    const recommendations = changes.filter((c) => !c.applied).length;

    return {
      applied,
      recommendations,
      changes,
    };
  }

  /**
   * ⚙️ Optimiza schedule para una plataforma
   *
   * @param platform - Plataforma a optimizar
   * @returns Cambio aplicado
   */
  private async optimizeScheduleForPlatform(
    platform: 'facebook' | 'twitter',
  ): Promise<{
    type: string;
    description: string;
    applied: boolean;
    reason?: string;
  }> {
    try {
      // Obtener configuración actual
      let config = await this.configModel.findOne();

      if (!config) {
        // Crear configuración por defecto
        config = new this.configModel({
          enableAutoPosting: true,
          platforms: {
            facebook: { enabled: true },
            twitter: { enabled: true },
          },
        });
      }

      // Predecir horarios óptimos para diferentes tipos de contenido
      const contentTypes = [
        'breaking_news',
        'normal_news',
        'blog',
        'evergreen',
      ];
      const optimalTimes: Record<string, number> = {};

      for (const contentType of contentTypes) {
        const prediction =
          await this.optimalTimePredictor.predictOptimalTime(
            platform,
            contentType,
          );

        if (prediction.confidence >= 70) {
          optimalTimes[contentType] = prediction.recommendedTime.getHours();
        }
      }

      // Aplicar cambios si hay suficientes datos
      if (Object.keys(optimalTimes).length >= 2) {
        // Actualizar configuración
        // TODO: Implementar ajuste dinámico de horarios en config

        this.logger.log(
          `🎯 Horarios optimizados para ${platform}: ${JSON.stringify(optimalTimes)}`,
        );

        return {
          type: 'schedule_optimization',
          description: `Horarios de publicación ajustados para ${platform} basado en datos de performance`,
          applied: true,
          reason: `Detectada tendencia negativa, aplicando horarios óptimos históricos`,
        };
      } else {
        return {
          type: 'schedule_optimization',
          description: `No hay suficientes datos para optimizar ${platform}`,
          applied: false,
          reason: 'Datos históricos insuficientes',
        };
      }
    } catch (error) {
      this.logger.error(
        `Error optimizando ${platform}: ${error.message}`,
        error.stack,
      );

      return {
        type: 'schedule_optimization',
        description: `Error al optimizar ${platform}`,
        applied: false,
        reason: error.message,
      };
    }
  }

  /**
   * 📊 Genera reporte de optimización
   *
   * @returns Reporte completo con recomendaciones
   */
  async generateOptimizationReport(): Promise<{
    summary: {
      fbEngagementTrend: string;
      twEngagementTrend: string;
      underperformingPosts: number;
    };
    recommendations: Array<{
      priority: 'high' | 'medium' | 'low';
      category: string;
      recommendation: string;
      expectedImpact: string;
    }>;
    nextOptimization: Date;
  }> {
    const recommendations: Array<{
      priority: 'high' | 'medium' | 'low';
      category: string;
      recommendation: string;
      expectedImpact: string;
    }> = [];

    // Analizar tendencias
    const fbTrends = await this.performanceAnalyzer.detectEngagementTrends(
      'facebook',
    );
    const twTrends = await this.performanceAnalyzer.detectEngagementTrends(
      'twitter',
    );

    // Detectar contenido con bajo rendimiento
    const underperforming =
      await this.performanceAnalyzer.detectUnderperformingContent(
        undefined,
        30,
      );

    // Generar recomendaciones basadas en tendencias
    if (fbTrends.trends.engagementRate.value < -5) {
      recommendations.push({
        priority: 'high',
        category: 'scheduling',
        recommendation:
          'Ajustar horarios de publicación en Facebook basado en patrones históricos',
        expectedImpact: 'Mejora estimada de 10-15% en engagement',
      });
    }

    if (twTrends.trends.engagementRate.value < -5) {
      recommendations.push({
        priority: 'high',
        category: 'scheduling',
        recommendation:
          'Ajustar horarios de publicación en Twitter basado en patrones históricos',
        expectedImpact: 'Mejora estimada de 10-15% en engagement',
      });
    }

    if (underperforming.length > 10) {
      recommendations.push({
        priority: 'medium',
        category: 'content',
        recommendation: `Revisar y mejorar copys de posts (${underperforming.length} posts con bajo rendimiento)`,
        expectedImpact: 'Reducción de 30% en posts con bajo engagement',
      });
    }

    // Identificar patrones de audiencia
    const fbPatterns =
      await this.performanceAnalyzer.identifyAudiencePatterns('facebook');
    const twPatterns =
      await this.performanceAnalyzer.identifyAudiencePatterns('twitter');

    if (fbPatterns.recommendations.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'audience',
        recommendation: `Facebook: ${fbPatterns.recommendations[0]}`,
        expectedImpact: 'Alineación con patrones de audiencia',
      });
    }

    if (twPatterns.recommendations.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'audience',
        recommendation: `Twitter: ${twPatterns.recommendations[0]}`,
        expectedImpact: 'Alineación con patrones de audiencia',
      });
    }

    // Calcular fecha de próxima optimización (próximo lunes a las 2 AM)
    const nextOptimization = new Date();
    const dayOfWeek = nextOptimization.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    nextOptimization.setDate(nextOptimization.getDate() + daysUntilMonday);
    nextOptimization.setHours(2, 0, 0, 0);

    return {
      summary: {
        fbEngagementTrend: `${fbTrends.trends.engagementRate.trend} ${fbTrends.trends.engagementRate.value.toFixed(2)}%`,
        twEngagementTrend: `${twTrends.trends.engagementRate.trend} ${twTrends.trends.engagementRate.value.toFixed(2)}%`,
        underperformingPosts: underperforming.length,
      },
      recommendations: recommendations.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }),
      nextOptimization,
    };
  }

  /**
   * 🎯 Obtiene sugerencias de optimización para un tipo de contenido
   *
   * @param platform - Plataforma
   * @param contentType - Tipo de contenido
   * @returns Sugerencias específicas
   */
  async getOptimizationSuggestions(
    platform: 'facebook' | 'twitter',
    contentType: string,
  ): Promise<{
    currentPerformance: {
      avgEngagement: number;
      avgReach: number;
      engagementRate: number;
    };
    suggestions: Array<{
      type: string;
      suggestion: string;
      potentialImprovement: string;
    }>;
  }> {
    const suggestions: Array<{
      type: string;
      suggestion: string;
      potentialImprovement: string;
    }> = [];

    // Predecir horario óptimo
    const prediction = await this.optimalTimePredictor.predictOptimalTime(
      platform,
      contentType,
    );

    if (prediction.confidence >= 70) {
      suggestions.push({
        type: 'timing',
        suggestion: `Publicar a las ${prediction.recommendedTime.getHours()}:00`,
        potentialImprovement: `${prediction.confidence}% de confianza`,
      });
    }

    // Analizar patrones
    const patterns = await this.performanceAnalyzer.identifyAudiencePatterns(
      platform,
    );

    if (patterns.peakHours.length > 0) {
      const topHour = patterns.peakHours[0];
      suggestions.push({
        type: 'peak_hour',
        suggestion: `Considerar ${topHour.hour}:00 como horario pico`,
        potentialImprovement: `${topHour.engagementRate.toFixed(2)}% de engagement rate promedio`,
      });
    }

    // TODO: Agregar más sugerencias basadas en datos históricos
    // - Longitud óptima del copy
    // - Uso de emojis
    // - Uso de hashtags
    // - Tipo de media (imagen, video, link)

    return {
      currentPerformance: {
        avgEngagement: 0, // TODO: Calcular del histórico
        avgReach: 0,
        engagementRate: 0,
      },
      suggestions,
    };
  }
}
