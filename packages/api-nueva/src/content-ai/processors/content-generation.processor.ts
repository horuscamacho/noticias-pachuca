import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ContentGenerationService } from '../services/content-generation.service';
import { AIProviderService } from '../services/ai-provider.service';
import { PromptTemplateService } from '../services/prompt-template.service';
import { ContentGenerationRequest } from '../interfaces';

export interface ContentGenerationJobData {
  id: string;
  contentId: string;
  agentId: string;
  templateId: string;
  providerId?: string;
  customPromptVars?: Record<string, string>;
  priority: number;
  retryCount: number;
  maxRetries: number;
  batchId?: string;
  userId?: string;
  metadata: {
    startTime: number;
    expectedCost: number;
    costLimitPerJob: number;
    timeoutMs: number;
  };
}

export interface JobProgressData {
  step: string;
  progress: number;
  message: string;
  currentCost: number;
  tokensUsed: number;
}

/**
 * 🔄 Procesador de trabajos para generación de contenido AI
 * Maneja queue asíncrono, failover, cost tracking y progress monitoring
 */
@Processor('content-generation')
@Injectable()
export class ContentGenerationProcessor {
  private readonly logger = new Logger(ContentGenerationProcessor.name);

  constructor(
    private readonly contentGenerationService: ContentGenerationService,
    private readonly aiProviderService: AIProviderService,
    private readonly promptTemplateService: PromptTemplateService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * 🎯 Procesar job principal de generación de contenido
   */
  @Process('generate-content')
  async handleContentGeneration(job: Job<ContentGenerationJobData>): Promise<void> {
    const { data } = job;
    const startTime = Date.now();

    this.logger.log(`Processing content generation job ${data.id} for content ${data.contentId}`);

    try {
      // Actualizar progreso inicial
      await this.updateJobProgress(job, {
        step: 'initializing',
        progress: 0,
        message: 'Inicializando generación de contenido',
        currentCost: 0,
        tokensUsed: 0,
      });

      // Validar límites de costo antes de procesar
      await this.validateCostLimits(data);

      // Preparar request de generación
      const generationRequest: ContentGenerationRequest = {
        contentIds: [data.contentId],
        agentId: data.agentId,
        templateId: data.templateId,
        providerId: data.providerId,
        customPromptVars: data.customPromptVars,
      };

      // Actualizar progreso - preparando contexto
      await this.updateJobProgress(job, {
        step: 'preparing',
        progress: 20,
        message: 'Preparando contexto y template',
        currentCost: 0,
        tokensUsed: 0,
      });

      // Ejecutar generación
      const result = await this.contentGenerationService.generateContent(generationRequest);

      // Actualizar progreso - generando contenido
      await this.updateJobProgress(job, {
        step: 'generating',
        progress: 70,
        message: 'Generando contenido con IA',
        currentCost: result.generationMetadata?.cost || 0,
        tokensUsed: result.generationMetadata?.totalTokens || 0,
      });

      // Actualizar métricas de costo
      await this.updateCostMetrics(data, result.generationMetadata?.cost || 0, result.generationMetadata?.totalTokens || 0);

      // Finalizar con éxito
      await this.updateJobProgress(job, {
        step: 'completed',
        progress: 100,
        message: 'Contenido generado exitosamente',
        currentCost: result.generationMetadata?.cost || 0,
        tokensUsed: result.generationMetadata?.totalTokens || 0,
      });

      // Emitir evento de éxito
      this.eventEmitter.emit('content-generation.completed', {
        jobId: data.id,
        contentId: data.contentId,
        generatedContentId: result.id,
        processingTime: Date.now() - startTime,
        cost: result.generationMetadata?.cost,
        tokenUsage: {
          promptTokens: result.generationMetadata?.promptTokens || 0,
          completionTokens: result.generationMetadata?.completionTokens || 0,
          totalTokens: result.generationMetadata?.totalTokens || 0,
        },
        batchId: data.batchId,
      });

      this.logger.log(`Successfully completed content generation job ${data.id}`);

    } catch (error) {
      const processingTime = Date.now() - startTime;

      this.logger.error(`Content generation job ${data.id} failed: ${error.message}`, error.stack);

      // Actualizar progreso con error
      await this.updateJobProgress(job, {
        step: 'failed',
        progress: 0,
        message: `Error: ${error.message}`,
        currentCost: 0,
        tokensUsed: 0,
      });

      // Emitir evento de error
      this.eventEmitter.emit('content-generation.failed', {
        jobId: data.id,
        contentId: data.contentId,
        error: error.message,
        processingTime,
        retryCount: data.retryCount,
        batchId: data.batchId,
      });

      // Re-throw para que Bull maneje el retry
      throw error;
    }
  }

  /**
   * 📦 Procesar lote de generaciones
   */
  @Process('batch-generate')
  async handleBatchGeneration(job: Job<{ batchId: string; jobs: ContentGenerationJobData[] }>): Promise<void> {
    const { data } = job;
    const startTime = Date.now();

    this.logger.log(`Processing batch generation ${data.batchId} with ${data.jobs.length} jobs`);

    try {
      let completedJobs = 0;
      let totalCost = 0;
      let totalTokens = 0;

      for (const jobData of data.jobs) {
        try {
          // Actualizar progreso del batch
          await job.progress(Math.round((completedJobs / data.jobs.length) * 100));

          // Procesar job individual
          const generationRequest: ContentGenerationRequest = {
            contentIds: [jobData.contentId],
            agentId: jobData.agentId,
            templateId: jobData.templateId,
            providerId: jobData.providerId,
            customPromptVars: jobData.customPromptVars,
          };

          const result = await this.contentGenerationService.generateContent(generationRequest);

          totalCost += result.generationMetadata?.cost || 0;
          totalTokens += result.generationMetadata?.totalTokens || 0;
          completedJobs++;

          this.logger.log(`Completed job ${jobData.id} in batch ${data.batchId}`);

        } catch (error) {
          this.logger.error(`Failed job ${jobData.id} in batch ${data.batchId}: ${error.message}`);

          // Emitir evento de error individual
          this.eventEmitter.emit('content-generation.batch-job-failed', {
            batchId: data.batchId,
            jobId: jobData.id,
            contentId: jobData.contentId,
            error: error.message,
          });
        }
      }

      // Emitir evento de batch completado
      this.eventEmitter.emit('content-generation.batch-completed', {
        batchId: data.batchId,
        totalJobs: data.jobs.length,
        completedJobs,
        failedJobs: data.jobs.length - completedJobs,
        totalCost,
        totalTokens,
        processingTime: Date.now() - startTime,
      });

      this.logger.log(`Batch ${data.batchId} completed: ${completedJobs}/${data.jobs.length} successful`);

    } catch (error) {
      this.logger.error(`Batch generation ${data.batchId} failed: ${error.message}`, error.stack);

      this.eventEmitter.emit('content-generation.batch-failed', {
        batchId: data.batchId,
        error: error.message,
        processingTime: Date.now() - startTime,
      });

      throw error;
    }
  }

  /**
   * 📰 Procesar generación desde noticias
   */
  @Process('generate-from-news')
  async handleNewsToContent(job: Job<{
    title: string;
    content: string;
    templateId: string;
    referenceContent?: string;
    type: string;
    description?: string;
    metadata?: any;
  }>): Promise<void> {
    const data = job.data;
    const startTime = Date.now();
    const jobId = job.id?.toString() || 'unknown';

    this.logger.log(`Processing news-to-content job ${jobId} for template ${data.templateId}`);

    try {
      // Actualizar progreso inicial
      await job.progress(10);

      // Obtener el template
      const template = await this.promptTemplateService.findById(data.templateId);
      if (!template) {
        throw new Error(`Template ${data.templateId} not found`);
      }

      await job.progress(30);

      // Ejecutar generación desde noticia (sin providerId para que use findAll)
      const result = await this.contentGenerationService.generateFromNews({
        title: data.title,
        content: data.content,
        templateId: data.templateId,
        referenceContent: data.referenceContent || '',
        customPromptVars: {
          title: data.title,
          content: data.content,
          referenceContent: data.referenceContent || '',
        },
      });

      await job.progress(90);

      // Emitir evento de éxito
      this.eventEmitter.emit('content-generation.news-completed', {
        jobId: jobId,
        generatedContentId: result.id,
        processingTime: Date.now() - startTime,
        cost: result.generationMetadata?.cost,
        tokenUsage: {
          promptTokens: result.generationMetadata?.promptTokens || 0,
          completionTokens: result.generationMetadata?.completionTokens || 0,
          totalTokens: result.generationMetadata?.totalTokens || 0,
        },
      });

      await job.progress(100);

      this.logger.log(`Successfully completed news-to-content job ${jobId}`);

    } catch (error) {
      const processingTime = Date.now() - startTime;

      this.logger.error(`News-to-content job ${jobId} failed: ${error.message}`, error.stack);

      // Emitir evento de error
      this.eventEmitter.emit('content-generation.news-failed', {
        jobId: jobId,
        error: error.message,
        processingTime,
      });

      throw error;
    }
  }

  /**
   * 🔄 Manejar retry con provider failover
   */
  @Process('retry-with-failover')
  async handleRetryWithFailover(job: Job<ContentGenerationJobData & { failedProviderId: string }>): Promise<void> {
    const { data } = job;

    this.logger.log(`Retrying job ${data.id} with provider failover (failed provider: ${data.failedProviderId})`);

    try {
      // Obtener template para providers compatibles
      const template = await this.promptTemplateService.findById(data.templateId);

      // Filtrar provider que falló
      const availableProviders = template.compatibleProviders.filter(
        providerId => providerId !== data.failedProviderId
      );

      if (availableProviders.length === 0) {
        throw new Error('No hay providers alternativos disponibles para retry');
      }

      // Seleccionar próximo provider disponible
      const nextProviderId = availableProviders[0];

      // Actualizar request con nuevo provider
      const retryRequest: ContentGenerationRequest = {
        contentIds: [data.contentId],
        agentId: data.agentId,
        templateId: data.templateId,
        providerId: nextProviderId,
        customPromptVars: data.customPromptVars,
      };

      // Ejecutar retry
      const result = await this.contentGenerationService.generateContent(retryRequest);

      // Emitir evento de retry exitoso
      this.eventEmitter.emit('content-generation.retry-succeeded', {
        jobId: data.id,
        contentId: data.contentId,
        failedProviderId: data.failedProviderId,
        successProviderId: nextProviderId,
        retryCount: data.retryCount,
        result,
      });

      this.logger.log(`Retry successful for job ${data.id} using provider ${nextProviderId}`);

    } catch (error) {
      this.logger.error(`Retry failed for job ${data.id}: ${error.message}`);

      this.eventEmitter.emit('content-generation.retry-failed', {
        jobId: data.id,
        contentId: data.contentId,
        error: error.message,
        retryCount: data.retryCount,
      });

      throw error;
    }
  }

  /**
   * 📊 Event handler - Job activado
   */
  @OnQueueActive()
  onQueueActive(job: Job<ContentGenerationJobData>): void {
    const jobId = job.id?.toString() || job.data?.id || 'unknown';
    this.logger.log(`Job ${jobId} started processing`);

    this.eventEmitter.emit('content-generation.job-started', {
      jobId: job.data.id,
      contentId: job.data.contentId,
      startTime: Date.now(),
      batchId: job.data.batchId,
    });
  }

  /**
   * ✅ Event handler - Job completado
   */
  @OnQueueCompleted()
  onQueueCompleted(job: Job<ContentGenerationJobData>): void {
    const jobId = job.id?.toString() || job.data?.id || 'unknown';
    this.logger.log(`Job ${jobId} completed successfully`);
  }

  /**
   * ❌ Event handler - Job falló
   */
  @OnQueueFailed()
  onQueueFailed(job: Job<ContentGenerationJobData>, error: Error): void {
    const jobId = job.id?.toString() || job.data?.id || 'unknown';
    this.logger.error(`Job ${jobId} failed: ${error.message}`);

    // Si aún hay intentos disponibles y hay providers alternativos, intentar failover
    if (job.data.retryCount < job.data.maxRetries) {
      this.scheduleFailoverRetry(job.data, error.message);
    }
  }

  /**
   * 🔄 Programar retry con failover
   */
  private async scheduleFailoverRetry(jobData: ContentGenerationJobData, errorMessage: string): Promise<void> {
    try {
      // Incrementar contador de retry
      const retryData = {
        ...jobData,
        retryCount: jobData.retryCount + 1,
        failedProviderId: jobData.providerId || '',
      };

      // Calcular delay exponencial
      const delay = Math.min(1000 * Math.pow(2, retryData.retryCount), 30000); // Max 30s

      this.logger.log(`Scheduling failover retry for job ${jobData.id} with delay ${delay}ms`);

      // Emitir evento para que el service maneje el retry
      this.eventEmitter.emit('content-generation.schedule-retry', {
        jobData: retryData,
        delay,
        originalError: errorMessage,
      });

    } catch (error) {
      this.logger.error(`Failed to schedule failover retry for job ${jobData.id}: ${error.message}`);
    }
  }

  /**
   * 📈 Actualizar progreso del job
   */
  private async updateJobProgress(job: Job<ContentGenerationJobData>, progressData: JobProgressData): Promise<void> {
    try {
      await job.progress(progressData.progress);

      // Emitir evento de progreso para websockets
      this.eventEmitter.emit('content-generation.progress', {
        jobId: job.data.id,
        contentId: job.data.contentId,
        batchId: job.data.batchId,
        ...progressData,
        timestamp: new Date(),
      });

    } catch (error) {
      this.logger.warn(`Failed to update progress for job ${job.data.id}: ${error.message}`);
    }
  }

  /**
   * 💰 Validar límites de costo
   */
  private async validateCostLimits(jobData: ContentGenerationJobData): Promise<void> {
    const { expectedCost, costLimitPerJob } = jobData.metadata;

    if (expectedCost > costLimitPerJob) {
      throw new Error(`Job exceeds cost limit: $${expectedCost} > $${costLimitPerJob}`);
    }

    // Validar límites mensuales del provider
    if (jobData.providerId) {
      const costStats = await this.aiProviderService.getCostStats('month');
      const providerStats = costStats.providerBreakdown[jobData.providerId];

      if (providerStats && providerStats.cost > 1000) { // $1000 monthly limit
        throw new Error(`Provider monthly cost limit exceeded: $${providerStats.cost}`);
      }
    }
  }

  /**
   * 📊 Actualizar métricas de costo
   */
  private async updateCostMetrics(jobData: ContentGenerationJobData, cost: number, tokens: number): Promise<void> {
    try {
      if (jobData.providerId) {
        await this.aiProviderService.updateUsageStats(jobData.providerId, {
          requests: 1,
          tokens,
          cost,
        });
      }

      // Emitir evento de métricas para dashboards
      this.eventEmitter.emit('content-generation.metrics-updated', {
        jobId: jobData.id,
        contentId: jobData.contentId,
        providerId: jobData.providerId,
        cost,
        tokens,
        timestamp: new Date(),
      });

    } catch (error) {
      this.logger.warn(`Failed to update cost metrics for job ${jobData.id}: ${error.message}`);
    }
  }
}