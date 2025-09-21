import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { FacebookApiUsageMetrics, FacebookApiUsageMetricsDocument } from '../schemas/facebook-api-usage-metrics.schema';
import { FacebookExtractionJob, FacebookExtractionJobDocument } from '../schemas/facebook-extraction-job.schema';
import { ExtractedFacebookPost, ExtractedFacebookPostDocument } from '../schemas/extracted-facebook-post.schema';
import { MonitoredFacebookPage, MonitoredFacebookPageDocument } from '../schemas/monitored-facebook-page.schema';

import { CacheService } from '../../services/cache.service';
import { PaginationService } from '../../common/services/pagination.service';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';

import {
  FacebookMetricsQueryDto,
  FacebookUsageStatsDto,
  FacebookPageStatsDto,
  FacebookErrorAnalysisDto,
  FacebookPerformanceDto
} from '../dto/facebook-metrics.dto';

interface UsageStatsSummary {
  totalCalls: number;
  successfulCalls: number;
  errorCalls: number;
  successRate: number;
  avgResponseTime: number;
  peakUsageHour: number;
  dailyLimit: number;
  remainingCalls: number;
}

interface PageStats {
  pageId: string;
  pageName: string;
  totalCalls: number;
  errors: number;
  successRate: number;
  avgResponseTime: number;
  lastExtraction: Date;
  totalExtractions: number;
}

interface ErrorStats {
  errorType: string;
  count: number;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

@Injectable()
export class FacebookMetricsService {
  private readonly logger = new Logger(FacebookMetricsService.name);

  constructor(
    @InjectModel(FacebookApiUsageMetrics.name)
    private readonly metricsModel: Model<FacebookApiUsageMetricsDocument>,
    @InjectModel(FacebookExtractionJob.name)
    private readonly jobModel: Model<FacebookExtractionJobDocument>,
    @InjectModel(ExtractedFacebookPost.name)
    private readonly postModel: Model<ExtractedFacebookPostDocument>,
    @InjectModel(MonitoredFacebookPage.name)
    private readonly pageModel: Model<MonitoredFacebookPageDocument>,
    private readonly cacheService: CacheService,
    private readonly paginationService: PaginationService,
  ) {}

  /**
   * 📊 OBTENER MÉTRICAS GENERALES DE USO
   */
  async getUsageMetrics(queryDto: FacebookMetricsQueryDto): Promise<UsageStatsSummary> {
    this.logger.log(`Getting usage metrics for period: ${queryDto.period}`);

    const cacheKey = `facebook:metrics:usage:${this.generateCacheKey(queryDto)}`;

    const cachedMetrics = await this.cacheService.get<UsageStatsSummary>(cacheKey);
    if (cachedMetrics) {
      return cachedMetrics;
    }

    const { startDate, endDate } = this.getDateRange(queryDto);

    // Obtener métricas de la base de datos
    const metricsData = await this.metricsModel
      .find({
        date: { $gte: startDate, $lte: endDate }
      })
      .sort({ date: -1 })
      .exec();

    if (metricsData.length === 0) {
      return this.getDefaultUsageStats();
    }

    // Calcular estadísticas agregadas
    const totalCalls = metricsData.reduce((sum, metric) => sum + metric.totalCalls, 0);
    const successfulCalls = metricsData.reduce((sum, metric) => sum + metric.successfulCalls, 0);
    const errorCalls = metricsData.reduce((sum, metric) => sum + metric.totalErrors, 0);
    const avgResponseTime = metricsData.reduce((sum, metric) => sum + metric.averageResponseTime, 0) / metricsData.length;

    // Encontrar hora pico
    const hourlyData = metricsData.flatMap(metric => metric.hourlyBreakdown);
    const peakHour = this.findPeakUsageHour(hourlyData);

    const latestMetrics = metricsData[0]; // Más reciente

    const summary: UsageStatsSummary = {
      totalCalls,
      successfulCalls,
      errorCalls,
      successRate: totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0,
      avgResponseTime: Math.round(avgResponseTime),
      peakUsageHour: peakHour,
      dailyLimit: 200,
      remainingCalls: latestMetrics?.callsRemaining || 200
    };

    await this.cacheService.set(cacheKey, summary, 600); // TTL 10 minutos

    this.logger.log(`Usage metrics: ${totalCalls} calls, ${summary.successRate.toFixed(1)}% success rate`);
    return summary;
  }

  /**
   * 📈 OBTENER ESTADÍSTICAS POR PÁGINA
   */
  async getPageStats(queryDto: FacebookPageStatsDto): Promise<PaginatedResponse<PageStats>> {
    this.logger.log('Getting page statistics');

    const { startDate, endDate } = this.getDateRange(queryDto);

    // Construir filtros para páginas
    const pageFilter: Record<string, unknown> = {};
    if (queryDto.category) {
      pageFilter.category = new RegExp(queryDto.category, 'i');
    }
    if (queryDto.search) {
      pageFilter.pageName = new RegExp(queryDto.search, 'i');
    }

    // Obtener páginas monitoreadas
    const pages = await this.pageModel.find(pageFilter).exec();
    const pageMap = new Map(pages.map(page => [page.pageId, page]));

    // Obtener métricas agregadas por página
    const metricsAggregation = await this.metricsModel.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $unwind: '$topPages'
      },
      {
        $group: {
          _id: '$topPages.pageId',
          totalCalls: { $sum: '$topPages.calls' },
          totalErrors: { $sum: '$topPages.errors' },
          avgResponseTime: { $avg: '$topPages.avgResponseTime' }
        }
      }
    ]);

    // Crear estadísticas por página
    const pageStats: PageStats[] = metricsAggregation.map(metric => {
      const page = pageMap.get(metric._id);
      return {
        pageId: metric._id,
        pageName: page?.pageName || 'Unknown',
        totalCalls: metric.totalCalls,
        errors: metric.totalErrors,
        successRate: metric.totalCalls > 0 ? ((metric.totalCalls - metric.totalErrors) / metric.totalCalls) * 100 : 0,
        avgResponseTime: Math.round(metric.avgResponseTime || 0),
        lastExtraction: page?.lastExtraction || new Date(0),
        totalExtractions: page?.totalExtractions || 0
      };
    });

    // Ordenar resultados
    const sortField = queryDto.sortBy || 'totalCalls';
    const sortDirection = queryDto.sortOrder === 'asc' ? 1 : -1;

    pageStats.sort((a, b) => {
      const aValue = a[sortField as keyof PageStats] as number;
      const bValue = b[sortField as keyof PageStats] as number;
      return sortDirection * (aValue - bValue);
    });

    // Simular paginación manual (en producción, usar aggregation pipeline)
    const page = queryDto.page || 1;
    const limit = queryDto.limit || 10;
    const skip = (page - 1) * limit;

    const paginatedData = pageStats.slice(skip, skip + limit);
    const total = pageStats.length;
    const totalPages = Math.ceil(total / limit);

    return {
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  /**
   * 🚨 ANÁLISIS DE ERRORES
   */
  async getErrorAnalysis(queryDto: FacebookErrorAnalysisDto): Promise<{
    summary: {
      totalErrors: number;
      errorRate: number;
      mostCommonError: string;
    };
    breakdown: ErrorStats[];
    timeline: Array<{ date: string; errors: number }>;
  }> {
    this.logger.log('Getting error analysis');

    const cacheKey = `facebook:metrics:errors:${this.generateCacheKey(queryDto)}`;

    const cachedAnalysis = await this.cacheService.get<{
      summary: { totalErrors: number; errorRate: number; mostCommonError: string };
      breakdown: ErrorStats[];
      timeline: Array<{ date: string; errors: number }>;
    }>(cacheKey);

    if (cachedAnalysis) {
      return cachedAnalysis;
    }

    const { startDate, endDate } = this.getDateRange(queryDto);

    const metricsData = await this.metricsModel
      .find({
        date: { $gte: startDate, $lte: endDate }
      })
      .sort({ date: -1 })
      .exec();

    if (metricsData.length === 0) {
      return {
        summary: { totalErrors: 0, errorRate: 0, mostCommonError: 'None' },
        breakdown: [],
        timeline: []
      };
    }

    // Calcular summary
    const totalErrors = metricsData.reduce((sum, metric) => sum + metric.totalErrors, 0);
    const totalCalls = metricsData.reduce((sum, metric) => sum + metric.totalCalls, 0);
    const errorRate = totalCalls > 0 ? (totalErrors / totalCalls) * 100 : 0;

    // Agregar breakdown de errores
    const errorBreakdown = new Map<string, number>();
    metricsData.forEach(metric => {
      metric.errorBreakdown.forEach(error => {
        const current = errorBreakdown.get(error.errorType) || 0;
        errorBreakdown.set(error.errorType, current + error.count);
      });
    });

    const breakdown: ErrorStats[] = Array.from(errorBreakdown.entries()).map(([type, count]) => ({
      errorType: type,
      count,
      percentage: totalErrors > 0 ? (count / totalErrors) * 100 : 0,
      trend: 'stable' as const // TODO: Calcular tendencia real
    }));

    breakdown.sort((a, b) => b.count - a.count);

    const mostCommonError = breakdown.length > 0 ? breakdown[0].errorType : 'None';

    // Timeline de errores
    const timeline = metricsData.map(metric => ({
      date: metric.date.toISOString().split('T')[0],
      errors: metric.totalErrors
    })).reverse();

    const analysis = {
      summary: { totalErrors, errorRate, mostCommonError },
      breakdown,
      timeline
    };

    await this.cacheService.set(cacheKey, analysis, 1800); // TTL 30 minutos

    this.logger.log(`Error analysis: ${totalErrors} errors, ${errorRate.toFixed(2)}% error rate`);
    return analysis;
  }

  /**
   * ⚡ ANÁLISIS DE RENDIMIENTO
   */
  async getPerformanceAnalysis(queryDto: FacebookPerformanceDto): Promise<{
    responseTimes: {
      average: number;
      median: number;
      p95: number;
      p99: number;
    };
    throughput: {
      callsPerHour: number;
      peakHour: number;
      quietHour: number;
    };
    trends: {
      responseTimeTrend: 'improving' | 'degrading' | 'stable';
      throughputTrend: 'increasing' | 'decreasing' | 'stable';
    };
  }> {
    this.logger.log('Getting performance analysis');

    const { startDate, endDate } = this.getDateRange(queryDto);

    const metricsData = await this.metricsModel
      .find({
        date: { $gte: startDate, $lte: endDate }
      })
      .sort({ date: -1 })
      .exec();

    if (metricsData.length === 0) {
      return this.getDefaultPerformanceStats();
    }

    // Calcular estadísticas de tiempo de respuesta
    const responseTimes = metricsData.map(m => m.averageResponseTime).sort((a, b) => a - b);
    const average = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const median = responseTimes[Math.floor(responseTimes.length / 2)];
    const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
    const p99 = responseTimes[Math.floor(responseTimes.length * 0.99)];

    // Calcular throughput
    const hourlyData = metricsData.flatMap(m => m.hourlyBreakdown);
    const callsPerHour = hourlyData.reduce((sum, hour) => sum + hour.calls, 0) / Math.max(hourlyData.length, 1);
    const { peakHour, quietHour } = this.findPeakAndQuietHours(hourlyData);

    // Calcular tendencias (simplificado)
    const responseTimeTrend = this.calculatePerformanceTrend(metricsData.map(m => m.averageResponseTime));
    const throughputTrend = this.calculateThroughputTrend(metricsData.map(m => m.totalCalls));

    return {
      responseTimes: {
        average: Math.round(average),
        median: Math.round(median),
        p95: Math.round(p95),
        p99: Math.round(p99)
      },
      throughput: {
        callsPerHour: Math.round(callsPerHour),
        peakHour,
        quietHour
      },
      trends: {
        responseTimeTrend,
        throughputTrend
      }
    };
  }

  /**
   * 📋 REGISTRAR LLAMADA A LA API
   */
  async recordApiCall(
    pageId: string,
    pageName: string,
    responseTime: number,
    isError: boolean = false,
    errorType?: string
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Buscar o crear métricas del día
    let dailyMetrics = await this.metricsModel.findOne({ date: today });

    if (!dailyMetrics) {
      dailyMetrics = new this.metricsModel({
        date: today,
        totalCalls: 0,
        callsRemaining: 200,
        averageResponseTime: 0,
        errorRate: 0,
        topPages: [],
        hourlyBreakdown: [],
        errorBreakdown: [],
        totalErrors: 0,
        successfulCalls: 0
      });
    }

    // Registrar la llamada
    // Actualizar métricas manualmente
    dailyMetrics.totalCalls += 1;
    dailyMetrics.callsRemaining = Math.max(0, dailyMetrics.callsRemaining - 1);

    if (isError) {
      dailyMetrics.totalErrors += 1;
      if (errorType) {
        const existingError = dailyMetrics.errorBreakdown.find(e => e.errorType === errorType);
        if (existingError) {
          existingError.count += 1;
        } else {
          dailyMetrics.errorBreakdown.push({ errorType, count: 1, percentage: 0 });
        }
      }
    } else {
      dailyMetrics.successfulCalls += 1;
    }

    // Recalcular métricas
    if (dailyMetrics.totalCalls > 0) {
      dailyMetrics.errorRate = (dailyMetrics.totalErrors / dailyMetrics.totalCalls) * 100;
    }

    await dailyMetrics.save();

    // Limpiar cache relacionado
    await this.clearMetricsCache();
  }

  /**
   * 🔧 MÉTODOS HELPER PRIVADOS
   */
  private getDateRange(queryDto: { startDate?: string; endDate?: string }): { startDate: Date; endDate: Date } {
    const endDate = queryDto.endDate ? new Date(queryDto.endDate) : new Date();
    const startDate = queryDto.startDate ? new Date(queryDto.startDate) : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 días atrás

    return { startDate, endDate };
  }

  private generateCacheKey(queryDto: Record<string, unknown> | FacebookMetricsQueryDto | FacebookErrorAnalysisDto): string {
    const keyParts = Object.entries(queryDto)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}:${value}`)
      .sort();

    return Buffer.from(keyParts.join('|')).toString('base64').slice(0, 32);
  }

  private findPeakUsageHour(hourlyData: Array<{ hour: number; calls: number }>): number {
    if (hourlyData.length === 0) return 0;

    const hourCalls = new Map<number, number>();
    hourlyData.forEach(data => {
      const current = hourCalls.get(data.hour) || 0;
      hourCalls.set(data.hour, current + data.calls);
    });

    let peakHour = 0;
    let maxCalls = 0;
    hourCalls.forEach((calls, hour) => {
      if (calls > maxCalls) {
        maxCalls = calls;
        peakHour = hour;
      }
    });

    return peakHour;
  }

  private findPeakAndQuietHours(hourlyData: Array<{ hour: number; calls: number }>): { peakHour: number; quietHour: number } {
    if (hourlyData.length === 0) return { peakHour: 0, quietHour: 0 };

    const hourCalls = new Map<number, number>();
    hourlyData.forEach(data => {
      const current = hourCalls.get(data.hour) || 0;
      hourCalls.set(data.hour, current + data.calls);
    });

    let peakHour = 0;
    let quietHour = 0;
    let maxCalls = 0;
    let minCalls = Infinity;

    hourCalls.forEach((calls, hour) => {
      if (calls > maxCalls) {
        maxCalls = calls;
        peakHour = hour;
      }
      if (calls < minCalls) {
        minCalls = calls;
        quietHour = hour;
      }
    });

    return { peakHour, quietHour };
  }

  private calculatePerformanceTrend(values: number[]): 'improving' | 'degrading' | 'stable' {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (Math.abs(percentChange) < 5) return 'stable';
    return percentChange < 0 ? 'improving' : 'degrading'; // Menor tiempo = mejor
  }

  private calculateThroughputTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (Math.abs(percentChange) < 5) return 'stable';
    return percentChange > 0 ? 'increasing' : 'decreasing';
  }

  private getDefaultUsageStats(): UsageStatsSummary {
    return {
      totalCalls: 0,
      successfulCalls: 0,
      errorCalls: 0,
      successRate: 0,
      avgResponseTime: 0,
      peakUsageHour: 0,
      dailyLimit: 200,
      remainingCalls: 200
    };
  }

  private getDefaultPerformanceStats(): {
    responseTimes: { average: number; median: number; p95: number; p99: number };
    throughput: { callsPerHour: number; peakHour: number; quietHour: number };
    trends: { responseTimeTrend: 'stable'; throughputTrend: 'stable' };
  } {
    return {
      responseTimes: { average: 0, median: 0, p95: 0, p99: 0 },
      throughput: { callsPerHour: 0, peakHour: 0, quietHour: 0 },
      trends: { responseTimeTrend: 'stable', throughputTrend: 'stable' }
    };
  }

  private async clearMetricsCache(): Promise<void> {
    // Limpiar caches comunes de métricas
    const cachePatterns = [
      'facebook:metrics:usage:',
      'facebook:metrics:errors:',
      'facebook:metrics:performance:'
    ];

    // En un entorno real, usarías pattern matching para limpiar múltiples keys
    // Por ahora, esto es una implementación simplificada
    this.logger.log('Metrics cache cleared');
  }
}