import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { FacebookExtractionService } from './facebook-extraction.service';
import { FacebookMetricsService } from './facebook-metrics.service';

import { FacebookExtractionRequestDto } from '../dto/facebook-page-management.dto';

export interface ExtractionJobData {
  jobId: string;
  type: 'manual' | 'scheduled' | 'bulk';
  extractionRequest: FacebookExtractionRequestDto;
  priority: 'low' | 'normal' | 'high';
  metadata?: Record<string, unknown>;
}

export interface JobProgress {
  percentage: number;
  currentPage?: string;
  pagesCompleted: number;
  totalPages: number;
  postsExtracted: number;
  apiCallsUsed: number;
  errors: string[];
}

@Injectable()
export class FacebookExtractionQueueService {
  private readonly logger = new Logger(FacebookExtractionQueueService.name);

  constructor(
    @InjectQueue('facebook-extraction')
    private readonly extractionQueue: Queue<ExtractionJobData>,
    private readonly extractionService: FacebookExtractionService,
    private readonly metricsService: FacebookMetricsService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.setupQueueProcessors();
    this.setupQueueEventListeners();
  }

  /**
   * 🚀 AGREGAR TRABAJO DE EXTRACCIÓN MANUAL
   */
  async addManualExtractionJob(
    extractionRequest: FacebookExtractionRequestDto,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): Promise<Job<ExtractionJobData>> {
    this.logger.log(`Adding manual extraction job for ${extractionRequest.pageIds.length} pages`);

    const jobData: ExtractionJobData = {
      jobId: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'manual',
      extractionRequest,
      priority,
      metadata: {
        requestedAt: new Date().toISOString(),
        requestedBy: extractionRequest.requestedBy || 'system'
      }
    };

    const jobOptions = {
      priority: this.getPriorityValue(priority),
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 10,
      removeOnFail: 25,
    };

    const job = await this.extractionQueue.add('manual-extraction', jobData, jobOptions);

    this.logger.log(`Manual extraction job added: ${job.id}`);

    // Emitir evento
    this.eventEmitter.emit('facebook.extraction.queued', {
      jobId: job.id,
      type: 'manual',
      pageIds: extractionRequest.pageIds,
      priority
    });

    return job;
  }

  /**
   * 📅 AGREGAR TRABAJO DE EXTRACCIÓN PROGRAMADA
   */
  async addScheduledExtractionJob(
    extractionRequest: FacebookExtractionRequestDto,
    cronExpression: string
  ): Promise<Job<ExtractionJobData>> {
    this.logger.log(`Adding scheduled extraction job: ${cronExpression}`);

    const jobData: ExtractionJobData = {
      jobId: `scheduled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'scheduled',
      extractionRequest,
      priority: 'normal',
      metadata: {
        cronExpression,
        scheduledAt: new Date().toISOString()
      }
    };

    const job = await this.extractionQueue.add(
      'scheduled-extraction',
      jobData,
      {
        repeat: { cron: cronExpression },
        removeOnComplete: 5,
        removeOnFail: 10,
      }
    );

    this.logger.log(`Scheduled extraction job added: ${job.id}`);
    return job;
  }

  /**
   * 📊 OBTENER ESTADÍSTICAS DE LA COLA
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: boolean;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.extractionQueue.getWaiting(),
      this.extractionQueue.getActive(),
      this.extractionQueue.getCompleted(),
      this.extractionQueue.getFailed(),
      this.extractionQueue.getDelayed(),
    ]);

    const isPaused = await this.extractionQueue.isPaused();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      paused: isPaused,
    };
  }

  /**
   * 📋 OBTENER TRABAJOS ACTIVOS
   */
  async getActiveJobs(): Promise<Array<{
    id: string;
    data: ExtractionJobData;
    progress: JobProgress;
    startedAt: Date;
  }>> {
    const activeJobs = await this.extractionQueue.getActive();

    return activeJobs.map(job => ({
      id: job.id?.toString() || 'unknown',
      data: job.data,
      progress: job.progress() as JobProgress || {
        percentage: 0,
        pagesCompleted: 0,
        totalPages: job.data.extractionRequest.pageIds.length,
        postsExtracted: 0,
        apiCallsUsed: 0,
        errors: []
      },
      startedAt: new Date(job.processedOn || Date.now())
    }));
  }

  /**
   * ❌ CANCELAR TRABAJO
   */
  async cancelJob(jobId: string): Promise<void> {
    this.logger.log(`Cancelling job: ${jobId}`);

    const job = await this.extractionQueue.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    await job.remove();

    this.eventEmitter.emit('facebook.extraction.cancelled', {
      jobId,
      cancelledAt: new Date().toISOString()
    });

    this.logger.log(`Job cancelled: ${jobId}`);
  }

  /**
   * ⏸️ PAUSAR COLA
   */
  async pauseQueue(): Promise<void> {
    this.logger.log('Pausing extraction queue');
    await this.extractionQueue.pause();

    this.eventEmitter.emit('facebook.extraction.queue.paused', {
      pausedAt: new Date().toISOString()
    });
  }

  /**
   * ▶️ REANUDAR COLA
   */
  async resumeQueue(): Promise<void> {
    this.logger.log('Resuming extraction queue');
    await this.extractionQueue.resume();

    this.eventEmitter.emit('facebook.extraction.queue.resumed', {
      resumedAt: new Date().toISOString()
    });
  }

  /**
   * 🧹 LIMPIAR TRABAJOS COMPLETADOS
   */
  async cleanCompletedJobs(olderThanHours: number = 24): Promise<number> {
    this.logger.log(`Cleaning completed jobs older than ${olderThanHours} hours`);

    const olderThan = olderThanHours * 60 * 60 * 1000; // Convertir a ms

    const cleaned = await this.extractionQueue.clean(olderThan, 'completed');

    this.logger.log(`Cleaned ${cleaned.length} completed jobs`);
    return cleaned.length;
  }

  /**
   * 🛠️ CONFIGURAR PROCESADORES DE LA COLA
   */
  private setupQueueProcessors(): void {
    this.logger.log('Setting up queue processors');

    // Procesador para extracciones manuales
    this.extractionQueue.process('manual-extraction', 3, async (job: Job<ExtractionJobData>) => {
      return this.processExtractionJob(job);
    });

    // Procesador para extracciones programadas
    this.extractionQueue.process('scheduled-extraction', 2, async (job: Job<ExtractionJobData>) => {
      return this.processExtractionJob(job);
    });

    this.logger.log('Queue processors configured');
  }

  /**
   * 🎯 PROCESAR TRABAJO DE EXTRACCIÓN
   */
  private async processExtractionJob(job: Job<ExtractionJobData>): Promise<{
    jobId: string;
    postsExtracted: number;
    apiCallsUsed: number;
    duration: number;
    pagesProcessed: number;
  }> {
    const startTime = Date.now();
    const { jobId, extractionRequest } = job.data;

    this.logger.log(`Processing extraction job: ${jobId}`);

    try {
      let totalPostsExtracted = 0;
      let totalApiCalls = 0;
      const pageIds = extractionRequest.pageIds;

      // Actualizar progreso inicial
      await job.progress({
        percentage: 0,
        pagesCompleted: 0,
        totalPages: pageIds.length,
        postsExtracted: 0,
        apiCallsUsed: 0,
        errors: []
      });

      // Procesar cada página
      for (let i = 0; i < pageIds.length; i++) {
        const pageId = pageIds[i];

        try {
          this.logger.log(`Processing page ${i + 1}/${pageIds.length}: ${pageId}`);

          // Simular extracción (en producción, usar el servicio real)
          const extractionResult = await this.extractionService.executeExtraction({
            pageIds: [pageId],
            maxPosts: extractionRequest.maxPosts,
            fields: extractionRequest.fields,
            priority: extractionRequest.priority,
            requestedBy: extractionRequest.requestedBy
          });

          // Registrar métricas
          await this.metricsService.recordApiCall(
            pageId,
            `Page-${pageId}`,
            Math.random() * 1000 + 500, // Tiempo simulado
            false
          );

          totalPostsExtracted += 10; // Simulado
          totalApiCalls += 1;

          // Actualizar progreso
          const progress: JobProgress = {
            percentage: Math.round(((i + 1) / pageIds.length) * 100),
            currentPage: pageId,
            pagesCompleted: i + 1,
            totalPages: pageIds.length,
            postsExtracted: totalPostsExtracted,
            apiCallsUsed: totalApiCalls,
            errors: []
          };

          await job.progress(progress);

          this.logger.log(`Completed page ${pageId}: ${10} posts extracted`);

        } catch (error) {
          this.logger.error(`Failed to process page ${pageId}: ${error.message}`);

          // Registrar error en métricas
          await this.metricsService.recordApiCall(
            pageId,
            `Page-${pageId}`,
            Math.random() * 1000 + 500,
            true,
            error.name || 'UnknownError'
          );

          // Actualizar progreso con error
          const currentProgress = job.progress() as JobProgress || {
            percentage: 0,
            pagesCompleted: 0,
            totalPages: pageIds.length,
            postsExtracted: 0,
            apiCallsUsed: 0,
            errors: []
          };

          currentProgress.errors.push(`Page ${pageId}: ${error.message}`);
          await job.progress(currentProgress);
        }
      }

      const duration = Date.now() - startTime;

      const result = {
        jobId,
        postsExtracted: totalPostsExtracted,
        apiCallsUsed: totalApiCalls,
        duration,
        pagesProcessed: pageIds.length
      };

      this.logger.log(`Extraction job completed: ${jobId}, ${totalPostsExtracted} posts in ${duration}ms`);

      // Emitir evento de finalización
      this.eventEmitter.emit('facebook.extraction.job.completed', {
        ...result,
        completedAt: new Date().toISOString()
      });

      return result;

    } catch (error) {
      this.logger.error(`Extraction job failed: ${jobId} - ${error.message}`, error.stack);

      // Emitir evento de fallo
      this.eventEmitter.emit('facebook.extraction.job.failed', {
        jobId,
        error: error.message,
        failedAt: new Date().toISOString()
      });

      throw error;
    }
  }

  /**
   * 🎧 CONFIGURAR LISTENERS DE EVENTOS DE LA COLA
   */
  private setupQueueEventListeners(): void {
    this.extractionQueue.on('completed', (job: Job<ExtractionJobData>, result) => {
      this.logger.log(`Job completed: ${job.id} - ${JSON.stringify(result)}`);
    });

    this.extractionQueue.on('failed', (job: Job<ExtractionJobData>, error: Error) => {
      this.logger.error(`Job failed: ${job.id} - ${error.message}`);
    });

    this.extractionQueue.on('stalled', (job: Job<ExtractionJobData>) => {
      this.logger.warn(`Job stalled: ${job.id}`);
    });

    this.extractionQueue.on('progress', (job: Job<ExtractionJobData>, progress: JobProgress) => {
      this.logger.debug(`Job progress: ${job.id} - ${progress.percentage}%`);
    });

    this.logger.log('Queue event listeners configured');
  }

  /**
   * 🔢 OBTENER VALOR NUMÉRICO DE PRIORIDAD
   */
  private getPriorityValue(priority: 'low' | 'normal' | 'high'): number {
    switch (priority) {
      case 'high': return 10;
      case 'normal': return 5;
      case 'low': return 1;
      default: return 5;
    }
  }
}