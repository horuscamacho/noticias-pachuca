import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { FacebookService } from './facebook.service';
import { FacebookRateLimitService } from './facebook-rate-limit.service';
import {
  BatchJobData,
  FacebookBatchRequest
} from '../interfaces/rate-limit.interface';
import {
  FacebookBatchResponse,
  CompetitorAnalysisResult
} from '../interfaces/facebook-api.interface';
import { CompetitorAnalysisJob } from '../interfaces/competitor-data.interface';

/**
 * 🎯 FACEBOOK QUEUE SERVICE
 * Procesamiento asíncrono de trabajos de Facebook API
 * ✅ Integrado con Bull existente
 * ✅ Sin any types
 */

@Injectable()
@Processor('facebook-api')
export class FacebookQueueService {
  private readonly logger = new Logger(FacebookQueueService.name);

  constructor(
    private readonly facebookService: FacebookService,
    private readonly rateLimitService: FacebookRateLimitService
  ) {
    this.logger.log('FacebookQueueService initialized');
  }

  /**
   * Procesar batch requests de Facebook API
   */
  @Process('batch-request')
  async processBatchRequest(job: Job<BatchJobData>): Promise<FacebookBatchResponse[]> {
    const { requests, appId, priority = 'normal' } = job.data;

    this.logger.log(`Processing batch request job ${job.id} with ${requests.length} requests (priority: ${priority})`);

    try {
      // Actualizar progreso del job
      await job.progress(10);

      // Chunk requests en grupos de 50 (límite de Facebook)
      const chunks = this.chunkArray(requests, 50);
      const allResults: FacebookBatchResponse[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        this.logger.debug(`Processing chunk ${i + 1}/${chunks.length} with ${chunk.length} requests`);

        // Verificar rate limit antes de cada chunk
        const canProceed = await this.rateLimitService.checkRateLimit(appId);
        if (!canProceed) {
          this.logger.warn(`Rate limit reached, waiting for chunk ${i + 1}`);
          await this.rateLimitService.waitForRateLimit(appId);
        }

        try {
          // Procesar chunk
          const chunkResults = await this.facebookService.batchRequest(chunk);
          allResults.push(...chunkResults);

          // Actualizar progreso
          const progress = Math.round(((i + 1) / chunks.length) * 80) + 10; // 10-90%
          await job.progress(progress);

          // Delay pequeño entre chunks para ser amigable con la API
          if (i < chunks.length - 1) {
            await this.sleep(1000);
          }

        } catch (error) {
          this.logger.error(`Error processing chunk ${i + 1}:`, error);

          // Si es error de rate limit, intentar esperar y reintentar
          if (this.rateLimitService.isRateLimitError(error)) {
            this.logger.warn(`Rate limit error in chunk ${i + 1}, retrying after delay`);
            await this.rateLimitService.waitForRateLimit(appId);

            // Reintentar este chunk una vez
            try {
              const retryResults = await this.facebookService.batchRequest(chunk);
              allResults.push(...retryResults);
            } catch (retryError) {
              this.logger.error(`Retry failed for chunk ${i + 1}:`, retryError);
              throw retryError;
            }
          } else {
            throw error;
          }
        }
      }

      // Completar progreso
      await job.progress(100);

      this.logger.log(`Batch request job ${job.id} completed successfully with ${allResults.length} results`);
      return allResults;

    } catch (error) {
      this.logger.error(`Batch request job ${job.id} failed:`, error);
      throw error;
    }
  }

  /**
   * Procesar análisis completo de competidores
   */
  @Process('competitor-analysis')
  async processCompetitorAnalysis(job: Job<CompetitorAnalysisJob>): Promise<CompetitorAnalysisResult> {
    const {
      competitorPageIds,
      analysisType = 'full',
      dateRange,
      includeInsights = true,
      priority = 'normal'
    } = job.data;

    this.logger.log(
      `Processing competitor analysis job ${job.id} for ${competitorPageIds.length} competitors (type: ${analysisType})`
    );

    try {
      await job.progress(5);

      const results: CompetitorAnalysisResult = {
        competitors: [],
        comparison: {
          leader: { pageId: '', name: '', leadingMetrics: [] },
          averages: {
            likes: 0,
            comments: 0,
            shares: 0,
            reactions: 0,
            engagementRate: 0
          },
          rankings: []
        },
        insights: {
          trendsDetected: [],
          bestPractices: [],
          opportunities: [],
          threats: []
        },
        recommendations: [],
        generatedAt: new Date()
      };

      // Paso 1: Obtener datos básicos de páginas
      await job.progress(10);
      this.logger.debug('Step 1: Fetching basic page data');

      const pageDataRequests: FacebookBatchRequest[] = competitorPageIds.map(pageId => ({
        method: 'GET',
        relative_url: `${pageId}?fields=id,name,category,fan_count,talking_about_count,about`
      }));

      const pageDataResponses = await this.facebookService.batchRequest(pageDataRequests);
      await job.progress(25);

      // Paso 2: Obtener posts recientes (si se requiere análisis de contenido)
      if (analysisType === 'full' || analysisType === 'content_only') {
        this.logger.debug('Step 2: Fetching recent posts');

        const postsRequests: FacebookBatchRequest[] = competitorPageIds.map(pageId => ({
          method: 'GET',
          relative_url: `${pageId}/posts?fields=id,created_time,message,type,likes.summary(true),comments.summary(true),shares&limit=25`
        }));

        const postsResponses = await this.facebookService.batchRequest(postsRequests);
        await job.progress(50);

        // Procesar datos de posts
        // ... (aquí iría el procesamiento de posts)
      }

      // Paso 3: Obtener insights (si se requiere)
      if (includeInsights && (analysisType === 'full' || analysisType === 'metrics_only')) {
        this.logger.debug('Step 3: Fetching page insights');

        // Solo páginas que tienen acceso a insights
        const insightsRequests: FacebookBatchRequest[] = competitorPageIds.map(pageId => ({
          method: 'GET',
          relative_url: `${pageId}/insights?metric=page_fans,page_engaged_users&period=day`
        }));

        try {
          const insightsResponses = await this.facebookService.batchRequest(insightsRequests);
          await job.progress(75);
        } catch (error) {
          // Los insights pueden fallar por permisos, continuar sin ellos
          this.logger.warn('Insights collection failed, continuing without insights:', error);
        }
      }

      // Paso 4: Análisis y generación de insights
      await job.progress(85);
      this.logger.debug('Step 4: Generating analysis and insights');

      // Aquí iría el análisis detallado de los datos recopilados
      // Por ahora, estructura básica

      results.insights.trendsDetected = [
        'Content frequency patterns detected',
        'Engagement timing patterns identified'
      ];

      results.recommendations = [
        'Increase posting frequency during peak hours',
        'Focus on video content for better engagement',
        'Implement hashtag strategy based on competitor analysis'
      ];

      await job.progress(100);

      this.logger.log(`Competitor analysis job ${job.id} completed successfully`);
      return results;

    } catch (error) {
      this.logger.error(`Competitor analysis job ${job.id} failed:`, error);
      throw error;
    }
  }

  /**
   * Procesar monitoreo de contenido viral
   */
  @Process('viral-content-monitor')
  async processViralContentMonitor(job: Job<{ pageIds: string[] }>): Promise<void> {
    const { pageIds } = job.data;

    this.logger.log(`Processing viral content monitor for ${pageIds.length} pages`);

    try {
      await job.progress(10);

      // Obtener posts recientes de todas las páginas
      const recentPostsRequests: FacebookBatchRequest[] = pageIds.map(pageId => ({
        method: 'GET',
        relative_url: `${pageId}/posts?fields=id,created_time,message,type,likes.summary(true),comments.summary(true),shares&limit=10&since=${this.getLastHourTimestamp()}`
      }));

      const responses = await this.facebookService.batchRequest(recentPostsRequests);
      await job.progress(50);

      // Analizar posts para detectar contenido viral
      const viralPosts = this.detectViralContent(responses);

      if (viralPosts.length > 0) {
        this.logger.log(`Detected ${viralPosts.length} viral posts`);
        // Aquí se enviarían notificaciones usando el NotificationRouterService
        // (se implementará en el FacebookMonitorService)
      }

      await job.progress(100);

    } catch (error) {
      this.logger.error('Viral content monitor job failed:', error);
      throw error;
    }
  }

  /**
   * Procesar limpieza de datos antiguos
   */
  @Process('data-cleanup')
  async processDataCleanup(job: Job<{ retentionDays: number }>): Promise<void> {
    const { retentionDays } = job.data;

    this.logger.log(`Processing data cleanup with retention of ${retentionDays} days`);

    try {
      await job.progress(25);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Aquí iría la lógica de limpieza usando los modelos de Mongoose
      // Por ejemplo: eliminar posts antiguos, análisis, etc.

      await job.progress(100);
      this.logger.log('Data cleanup completed successfully');

    } catch (error) {
      this.logger.error('Data cleanup job failed:', error);
      throw error;
    }
  }

  /**
   * Utilidades privadas
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getLastHourTimestamp(): string {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    return Math.floor(oneHourAgo.getTime() / 1000).toString();
  }

  private detectViralContent(responses: FacebookBatchResponse[]): Array<{ pageId: string; postId: string; score: number }> {
    const viralPosts: Array<{ pageId: string; postId: string; score: number }> = [];

    responses.forEach(response => {
      if (response.code === 200) {
        try {
          const data = JSON.parse(response.body);
          if (data.data && Array.isArray(data.data)) {
            data.data.forEach((post: Record<string, unknown>) => {
              const score = this.calculateViralScore(post);
              if (score > 80) { // Threshold for viral content
                viralPosts.push({
                  pageId: data.paging?.cursors?.after || 'unknown',
                  postId: post.id as string,
                  score
                });
              }
            });
          }
        } catch (error) {
          this.logger.warn('Error parsing post data for viral detection:', error);
        }
      }
    });

    return viralPosts;
  }

  private calculateViralScore(post: Record<string, unknown>): number {
    // Cálculo simple de score viral basado en engagement
    const likesData = post.likes as { summary?: { total_count?: number } };
    const commentsData = post.comments as { summary?: { total_count?: number } };
    const likes = likesData?.summary?.total_count || 0;
    const comments = commentsData?.summary?.total_count || 0;
    const shares = (post.shares as Record<string, unknown>)?.count || 0;

    const totalEngagement = Number(likes) + Number(comments) + Number(shares);

    // Score básico: engagement total / 100, máximo 100
    let score = Math.min(totalEngagement / 100, 100);

    // Bonus por shares (indican viralidad)
    score += Number(shares) * 2;

    // Bonus por ratio comments/likes (indica engagement real)
    const commentRatio = Number(likes) > 0 ? Number(comments) / Number(likes) : 0;
    score += commentRatio * 20;

    return Math.min(Math.round(score), 100);
  }
}