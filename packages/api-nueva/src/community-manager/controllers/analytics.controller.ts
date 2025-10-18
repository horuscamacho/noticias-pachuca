import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AnalyticsService } from '../services/analytics.service';
import { PerformanceAnalyzerService } from '../services/performance-analyzer.service';
import { OptimalTimePredictorService } from '../services/optimal-time-predictor.service';
import { ABTestingService } from '../services/ab-testing.service';
import { AutoOptimizationService } from '../services/auto-optimization.service';

/**
 * 📊 Analytics Controller
 *
 * FASE 9: Endpoints de analytics avanzados
 *
 * Endpoints:
 * - GET /analytics/engagement/time-of-day - Engagement por hora
 * - GET /analytics/engagement/day-of-week - Engagement por día
 * - GET /analytics/performance/content-type - Performance por tipo
 * - GET /analytics/heatmap - Heatmap de engagement
 * - GET /analytics/top-posts - Top performing posts
 * - GET /analytics/trends - Tendencias de engagement
 * - GET /analytics/audience-patterns - Patrones de audiencia
 * - GET /analytics/underperforming - Contenido con bajo rendimiento
 * - GET /analytics/predict-optimal-time - Predicción de horario óptimo
 * - GET /analytics/optimal-windows - Ventanas óptimas
 * - POST /analytics/ab-test - Crear experimento A/B
 * - GET /analytics/ab-test - Listar experimentos
 * - POST /analytics/ab-test/:id/start - Iniciar experimento
 * - POST /analytics/ab-test/:id/analyze - Analizar experimento
 * - GET /analytics/optimization/report - Reporte de optimización
 * - GET /analytics/optimization/suggestions - Sugerencias de optimización
 */
@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(
    private analyticsService: AnalyticsService,
    private performanceAnalyzer: PerformanceAnalyzerService,
    private optimalTimePredictor: OptimalTimePredictorService,
    private abTestingService: ABTestingService,
    private autoOptimization: AutoOptimizationService,
  ) {}

  // ========================================
  // ANALYTICS ENDPOINTS
  // ========================================

  /**
   * GET /analytics/engagement/time-of-day
   * Engagement rate por hora del día
   */
  @Get('engagement/time-of-day')
  async getEngagementByTimeOfDay(
    @Query('platform') platform?: 'facebook' | 'twitter',
    @Query('days') days?: number,
  ) {
    return this.analyticsService.getEngagementByTimeOfDay(
      platform,
      days ? parseInt(days.toString()) : 30,
    );
  }

  /**
   * GET /analytics/engagement/day-of-week
   * Engagement rate por día de la semana
   */
  @Get('engagement/day-of-week')
  async getEngagementByDayOfWeek(
    @Query('platform') platform?: 'facebook' | 'twitter',
    @Query('days') days?: number,
  ) {
    return this.analyticsService.getEngagementByDayOfWeek(
      platform,
      days ? parseInt(days.toString()) : 30,
    );
  }

  /**
   * GET /analytics/performance/content-type
   * Performance por tipo de contenido
   */
  @Get('performance/content-type')
  async getPerformanceByContentType(
    @Query('platform') platform?: 'facebook' | 'twitter',
    @Query('days') days?: number,
  ) {
    return this.analyticsService.getPerformanceByContentType(
      platform,
      days ? parseInt(days.toString()) : 30,
    );
  }

  /**
   * GET /analytics/heatmap
   * Heatmap de engagement (hora x día)
   */
  @Get('heatmap')
  async getEngagementHeatmap(
    @Query('platform') platform?: 'facebook' | 'twitter',
    @Query('days') days?: number,
  ) {
    return this.analyticsService.getEngagementHeatmap(
      platform,
      days ? parseInt(days.toString()) : 30,
    );
  }

  /**
   * GET /analytics/top-posts
   * Top performing posts
   */
  @Get('top-posts')
  async getTopPerformingPosts(
    @Query('platform') platform?: 'facebook' | 'twitter',
    @Query('limit') limit?: number,
    @Query('days') days?: number,
  ) {
    return this.analyticsService.getTopPerformingPosts(
      platform,
      limit ? parseInt(limit.toString()) : 10,
      days ? parseInt(days.toString()) : 30,
    );
  }

  // ========================================
  // PERFORMANCE ANALYZER ENDPOINTS
  // ========================================

  /**
   * GET /analytics/trends
   * Detecta tendencias de engagement
   */
  @Get('trends')
  async detectEngagementTrends(
    @Query('platform') platform?: 'facebook' | 'twitter',
  ) {
    return this.performanceAnalyzer.detectEngagementTrends(platform);
  }

  /**
   * GET /analytics/audience-patterns
   * Identifica patrones de audiencia
   */
  @Get('audience-patterns')
  async identifyAudiencePatterns(
    @Query('platform') platform?: 'facebook' | 'twitter',
  ) {
    return this.performanceAnalyzer.identifyAudiencePatterns(platform);
  }

  /**
   * GET /analytics/underperforming
   * Detecta contenido con bajo rendimiento
   */
  @Get('underperforming')
  async detectUnderperformingContent(
    @Query('platform') platform?: 'facebook' | 'twitter',
    @Query('days') days?: number,
  ) {
    return this.performanceAnalyzer.detectUnderperformingContent(
      platform,
      days ? parseInt(days.toString()) : 30,
    );
  }

  // ========================================
  // OPTIMAL TIME PREDICTOR ENDPOINTS
  // ========================================

  /**
   * GET /analytics/predict-optimal-time
   * Predice horario óptimo para publicar
   */
  @Get('predict-optimal-time')
  async predictOptimalTime(
    @Query('platform') platform: 'facebook' | 'twitter',
    @Query('contentType') contentType: string,
    @Query('targetDate') targetDate?: string,
  ) {
    const target = targetDate ? new Date(targetDate) : undefined;
    return this.optimalTimePredictor.predictOptimalTime(
      platform,
      contentType,
      target,
    );
  }

  /**
   * GET /analytics/optimal-windows
   * Obtiene ventanas óptimas de publicación
   */
  @Get('optimal-windows')
  async getOptimalTimeWindows(
    @Query('platform') platform: 'facebook' | 'twitter',
    @Query('contentType') contentType: string,
    @Query('days') days?: number,
  ) {
    return this.optimalTimePredictor.getOptimalTimeWindows(
      platform,
      contentType,
      days ? parseInt(days.toString()) : 7,
    );
  }

  // ========================================
  // A/B TESTING ENDPOINTS
  // ========================================

  /**
   * POST /analytics/ab-test
   * Crea experimento A/B
   */
  @Post('ab-test')
  async createABTest(
    @Body()
    data: {
      experimentName: string;
      description: string;
      noticiaId: string;
      platform: 'facebook' | 'twitter';
      testType: 'copy' | 'timing' | 'hashtags' | 'media';
      variants: Array<{
        variantName: string;
        postContent: string;
      }>;
      startDate: string;
      endDate: string;
      requiredConfidence?: number;
      minimumSampleSize?: number;
    },
  ) {
    return this.abTestingService.createExperiment({
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    });
  }

  /**
   * GET /analytics/ab-test
   * Lista experimentos A/B
   */
  @Get('ab-test')
  async getABTests(
    @Query('status') status?: 'draft' | 'running' | 'completed' | 'cancelled',
    @Query('platform') platform?: 'facebook' | 'twitter',
    @Query('limit') limit?: number,
  ) {
    return this.abTestingService.getExperiments({
      status,
      platform,
      limit: limit ? parseInt(limit.toString()) : 20,
    });
  }

  /**
   * POST /analytics/ab-test/:id/start
   * Inicia experimento A/B
   */
  @Post('ab-test/:id/start')
  async startABTest(@Param('id') id: string) {
    return this.abTestingService.startExperiment(id);
  }

  /**
   * POST /analytics/ab-test/:id/analyze
   * Analiza resultados de experimento
   */
  @Post('ab-test/:id/analyze')
  async analyzeABTest(@Param('id') id: string) {
    return this.abTestingService.analyzeExperiment(id);
  }

  /**
   * POST /analytics/ab-test/:id/cancel
   * Cancela experimento
   */
  @Post('ab-test/:id/cancel')
  async cancelABTest(@Param('id') id: string) {
    return this.abTestingService.cancelExperiment(id);
  }

  // ========================================
  // AUTO-OPTIMIZATION ENDPOINTS
  // ========================================

  /**
   * GET /analytics/optimization/report
   * Genera reporte de optimización
   */
  @Get('optimization/report')
  async getOptimizationReport() {
    return this.autoOptimization.generateOptimizationReport();
  }

  /**
   * GET /analytics/optimization/suggestions
   * Obtiene sugerencias de optimización
   */
  @Get('optimization/suggestions')
  async getOptimizationSuggestions(
    @Query('platform') platform: 'facebook' | 'twitter',
    @Query('contentType') contentType: string,
  ) {
    return this.autoOptimization.getOptimizationSuggestions(
      platform,
      contentType,
    );
  }

  /**
   * POST /analytics/optimization/run
   * Ejecuta optimización manual
   */
  @Post('optimization/run')
  async runOptimization() {
    return this.autoOptimization.analyzeAndOptimize();
  }
}
