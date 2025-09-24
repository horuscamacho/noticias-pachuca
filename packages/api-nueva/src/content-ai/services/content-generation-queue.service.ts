import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, JobOptions } from 'bull';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import {
  ContentGenerationJobData,
  JobProgressData
} from '../processors/content-generation.processor';
import { ContentGenerationRequest } from '../interfaces';

interface SingleContentGenerationRequest {
  contentId: string;
  agentId: string;
  templateId: string;
  providerId?: string;
  customPromptVars?: Record<string, string>;
}
import { AIProviderService } from './ai-provider.service';
import { PromptTemplateService } from './prompt-template.service';

export interface QueueConfig {
  defaultJobOptions: JobOptions;
  priorityLevels: {
    urgent: number;
    high: number;
    normal: number;
    low: number;
  };
  rateLimits: {
    perProvider: Record<string, { requests: number; duration: number }>;
    global: { requests: number; duration: number };
  };
  retryConfig: {
    maxRetries: number;
    exponentialBackoff: boolean;
    maxDelay: number;
  };
}

export interface BatchGenerationRequest {
  requests: SingleContentGenerationRequest[];
  batchId?: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  userId?: string;
  options?: {
    parallelLimit?: number;
    failFast?: boolean;
    costLimit?: number;
  };
}

export interface JobStatusInfo {
  id: string;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
  progress: number;
  data: ContentGenerationJobData;
  result?: unknown;
  error?: string;
  createdAt: Date;
  processedAt?: Date;
  finishedAt?: Date;
}

/**
 * 🔄 Servicio de gestión de cola Bull para generación de contenido AI
 * Priority levels, rate limiting, batch processing y monitoring
 */
@Injectable()
export class ContentGenerationQueueService implements OnModuleInit {
  private readonly logger = new Logger(ContentGenerationQueueService.name);

  private readonly queueConfig: QueueConfig = {
    defaultJobOptions: {
      removeOnComplete: 50, // Mantener últimos 50 jobs completados
      removeOnFail: 100,    // Mantener últimos 100 jobs fallidos
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      delay: 0,
    },
    priorityLevels: {
      urgent: 10,   // Noticias de último momento
      high: 7,      // Contenido premium
      normal: 5,    // Contenido regular
      low: 1,       // Batch processing
    },
    rateLimits: {
      perProvider: {
        'openai': { requests: 60, duration: 60000 },      // 60 req/min
        'anthropic': { requests: 50, duration: 60000 },   // 50 req/min
        'default': { requests: 30, duration: 60000 },     // 30 req/min default
      },
      global: { requests: 200, duration: 60000 }, // 200 req/min global
    },
    retryConfig: {
      maxRetries: 3,
      exponentialBackoff: true,
      maxDelay: 30000, // 30s max delay
    },
  };

  constructor(
    @InjectQueue('content-generation') private contentQueue: Queue,
    private readonly aiProviderService: AIProviderService,
    private readonly promptTemplateService: PromptTemplateService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.setupQueueConfiguration();
    this.setupEventListeners();
    this.logger.log('Content Generation Queue Service initialized');
  }

  /**
   * 🚀 Enviar job individual de generación a la cola
   */
  async enqueueGeneration(
    request: SingleContentGenerationRequest,
    priority: 'urgent' | 'high' | 'normal' | 'low' = 'normal',
    userId?: string,
    options?: {
      delay?: number;
      costLimit?: number;
      timeout?: number;
    }
  ): Promise<string> {
    const jobId = uuidv4();

    try {
      // Estimar costo del job
      const template = await this.promptTemplateService.findById(request.templateId);
      const estimatedCost = await this.estimateJobCost(template, request.providerId);

      // Validar límites de costo
      if (options?.costLimit && estimatedCost > options.costLimit) {
        throw new Error(`Estimated cost ($${estimatedCost}) exceeds limit ($${options.costLimit})`);
      }

      // Preparar data del job
      const jobData: ContentGenerationJobData = {
        id: jobId,
        contentId: request.contentId,
        agentId: request.agentId,
        templateId: request.templateId,
        providerId: request.providerId,
        customPromptVars: request.customPromptVars,
        priority: this.queueConfig.priorityLevels[priority],
        retryCount: 0,
        maxRetries: this.queueConfig.retryConfig.maxRetries,
        userId,
        metadata: {
          startTime: Date.now(),
          expectedCost: estimatedCost,
          costLimitPerJob: options?.costLimit || 10.0, // $10 default limit
          timeoutMs: options?.timeout || 300000, // 5min default timeout
        },
      };

      // Configurar opciones del job
      const jobOptions: JobOptions = {
        ...this.queueConfig.defaultJobOptions,
        priority: this.queueConfig.priorityLevels[priority],
        delay: options?.delay || 0,
        jobId,
      };

      // Aplicar rate limiting
      await this.applyRateLimit(request.providerId);

      // Enviar a la cola
      const job = await this.contentQueue.add('generate-content', jobData, jobOptions);

      this.logger.log(`Enqueued content generation job ${jobId} with priority ${priority}`);

      // Emitir evento de job encolado
      this.eventEmitter.emit('content-generation.job-enqueued', {
        jobId,
        contentId: request.contentId,
        priority,
        estimatedCost,
        userId,
      });

      return jobId;

    } catch (error) {
      this.logger.error(`Failed to enqueue content generation job: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 📦 Enviar lote de generaciones a la cola
   */
  async enqueueBatch(batchRequest: BatchGenerationRequest): Promise<{
    batchId: string;
    jobIds: string[];
    totalEstimatedCost: number;
  }> {
    const batchId = batchRequest.batchId || uuidv4();
    const jobIds: string[] = [];
    let totalEstimatedCost = 0;

    try {
      this.logger.log(`Processing batch generation request with ${batchRequest.requests.length} jobs`);

      // Validar límites del lote
      if (batchRequest.requests.length > 100) {
        throw new Error('Batch size exceeds maximum limit of 100 jobs');
      }

      // Preparar jobs individuales
      const batchJobsData: ContentGenerationJobData[] = [];

      for (const request of batchRequest.requests) {
        const jobId = uuidv4();
        const template = await this.promptTemplateService.findById(request.templateId);
        const estimatedCost = await this.estimateJobCost(template, request.providerId);

        totalEstimatedCost += estimatedCost;

        // Validar límite de costo del lote
        if (batchRequest.options?.costLimit && totalEstimatedCost > batchRequest.options.costLimit) {
          throw new Error(`Batch estimated cost ($${totalEstimatedCost}) exceeds limit ($${batchRequest.options.costLimit})`);
        }

        const jobData: ContentGenerationJobData = {
          id: jobId,
          contentId: request.contentId,
          agentId: request.agentId,
          templateId: request.templateId,
          providerId: request.providerId,
          customPromptVars: request.customPromptVars,
          priority: this.queueConfig.priorityLevels[batchRequest.priority],
          retryCount: 0,
          maxRetries: this.queueConfig.retryConfig.maxRetries,
          batchId,
          userId: batchRequest.userId,
          metadata: {
            startTime: Date.now(),
            expectedCost: estimatedCost,
            costLimitPerJob: 10.0,
            timeoutMs: 300000,
          },
        };

        batchJobsData.push(jobData);
        jobIds.push(jobId);
      }

      // Configurar opciones del batch job
      const batchJobOptions: JobOptions = {
        ...this.queueConfig.defaultJobOptions,
        priority: this.queueConfig.priorityLevels[batchRequest.priority],
        jobId: `batch-${batchId}`,
      };

      // Enviar batch job a la cola
      await this.contentQueue.add('batch-generate', {
        batchId,
        jobs: batchJobsData,
      }, batchJobOptions);

      this.logger.log(`Enqueued batch ${batchId} with ${jobIds.length} jobs, total cost: $${totalEstimatedCost}`);

      // Emitir evento de batch encolado
      this.eventEmitter.emit('content-generation.batch-enqueued', {
        batchId,
        totalJobs: jobIds.length,
        totalEstimatedCost,
        priority: batchRequest.priority,
        userId: batchRequest.userId,
      });

      return {
        batchId,
        jobIds,
        totalEstimatedCost,
      };

    } catch (error) {
      this.logger.error(`Failed to enqueue batch generation: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 📊 Obtener estado de un job
   */
  async getJobStatus(jobId: string): Promise<JobStatusInfo | null> {
    try {
      const job = await this.contentQueue.getJob(jobId);
      if (!job) {
        return null;
      }

      const status = await job.getState();

      return {
        id: jobId,
        status: status as JobStatusInfo['status'],
        progress: job.progress(),
        data: job.data,
        result: job.returnvalue,
        error: job.failedReason,
        createdAt: new Date(job.timestamp),
        processedAt: job.processedOn ? new Date(job.processedOn) : undefined,
        finishedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
      };

    } catch (error) {
      this.logger.error(`Failed to get job status for ${jobId}: ${error.message}`);
      return null;
    }
  }

  /**
   * 📈 Obtener estadísticas de la cola
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: boolean;
  }> {
    try {
      const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
        this.contentQueue.getWaiting(),
        this.contentQueue.getActive(),
        this.contentQueue.getCompleted(),
        this.contentQueue.getFailed(),
        this.contentQueue.getDelayed(),
        this.contentQueue.isPaused(),
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        paused,
      };

    } catch (error) {
      this.logger.error(`Failed to get queue stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🗑️ Cancelar job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const job = await this.contentQueue.getJob(jobId);
      if (!job) {
        return false;
      }

      await job.remove();

      this.eventEmitter.emit('content-generation.job-cancelled', {
        jobId,
        contentId: job.data.contentId,
        batchId: job.data.batchId,
      });

      this.logger.log(`Cancelled job ${jobId}`);
      return true;

    } catch (error) {
      this.logger.error(`Failed to cancel job ${jobId}: ${error.message}`);
      return false;
    }
  }

  /**
   * 🧹 Limpiar jobs completados y fallidos
   */
  async cleanQueue(options?: {
    grace?: number;
    limit?: number;
    type?: 'completed' | 'failed' | 'active' | 'waiting';
  }): Promise<number> {
    try {
      const cleaned = await this.contentQueue.clean(
        options?.grace || 24 * 60 * 60 * 1000, // 24h por defecto
        (options?.type as 'completed' | 'failed' | 'active') || 'completed',
        options?.limit || 100
      );

      this.logger.log(`Cleaned ${cleaned.length} jobs from queue`);
      return cleaned.length;

    } catch (error) {
      this.logger.error(`Failed to clean queue: ${error.message}`);
      throw error;
    }
  }

  /**
   * ⚙️ Event handler - Programar retry con failover
   */
  @OnEvent('content-generation.schedule-retry')
  async handleScheduleRetry(event: {
    jobData: ContentGenerationJobData & { failedProviderId: string };
    delay: number;
    originalError: string;
  }): Promise<void> {
    try {
      const { jobData, delay } = event;

      // Configurar retry job
      const retryJobOptions: JobOptions = {
        ...this.queueConfig.defaultJobOptions,
        priority: jobData.priority,
        delay,
        jobId: `retry-${jobData.id}-${jobData.retryCount}`,
      };

      // Enviar retry job
      await this.contentQueue.add('retry-with-failover', jobData, retryJobOptions);

      this.logger.log(`Scheduled retry for job ${jobData.id} with delay ${delay}ms`);

    } catch (error) {
      this.logger.error(`Failed to schedule retry: ${error.message}`);
    }
  }

  /**
   * 🔧 Configurar cola inicial
   */
  private async setupQueueConfiguration(): Promise<void> {
    try {
      // Los processors ya están configurados automáticamente por el decorador @Process

      // Configurar limpieza automática
      setInterval(() => {
        this.cleanQueue({ grace: 24 * 60 * 60 * 1000, type: 'completed', limit: 50 });
        this.cleanQueue({ grace: 7 * 24 * 60 * 60 * 1000, type: 'failed', limit: 100 });
      }, 60 * 60 * 1000); // Cada hora

      this.logger.log('Queue configuration setup completed');

    } catch (error) {
      this.logger.error(`Failed to setup queue configuration: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📡 Configurar event listeners
   */
  private setupEventListeners(): void {
    // Progress tracking para websockets
    this.eventEmitter.on('content-generation.progress', (data) => {
      // Reenviar progreso a frontend via websockets
      this.eventEmitter.emit('websocket.send', {
        event: 'job-progress',
        data,
      });
    });

    // Job completion notifications
    this.eventEmitter.on('content-generation.completed', (data) => {
      this.eventEmitter.emit('websocket.send', {
        event: 'job-completed',
        data,
      });
    });

    // Job failure notifications
    this.eventEmitter.on('content-generation.failed', (data) => {
      this.eventEmitter.emit('websocket.send', {
        event: 'job-failed',
        data,
      });
    });
  }

  /**
   * 💰 Estimar costo de un job
   */
  private async estimateJobCost(template: unknown, providerId?: string): Promise<number> {
    try {
      // Estimación básica basada en tokens promedio
      const averagePromptTokens = 1000;  // Tokens promedio del prompt
      const averageOutputTokens = 500;   // Tokens promedio de output
      const totalTokens = averagePromptTokens + averageOutputTokens;

      // Costo por token por proveedor (estimado)
      const costPerThousandTokens = {
        'openai': 0.03,      // GPT-4 pricing
        'anthropic': 0.025,  // Claude pricing
        'default': 0.02,
      };

      const providerKey = providerId || 'default';
      const cost = (totalTokens / 1000) * (costPerThousandTokens[providerKey] || costPerThousandTokens.default);

      return Math.round(cost * 100) / 100; // Redondear a 2 decimales

    } catch (error) {
      this.logger.warn(`Failed to estimate job cost: ${error.message}`);
      return 0.05; // Fallback cost estimate
    }
  }

  /**
   * 🚀 Agregar job de generación (alias para compatibilidad)
   */
  async addGenerationJob(jobData: {
    type: string;
    data: {
      title: string;
      content: string;
      templateId: string;
      referenceContent?: string;
    };
    priority?: number;
    description?: string;
  }): Promise<{
    jobId: string;
    status: string;
    estimatedProcessingTime: number;
    estimatedCost: number;
    queuePosition: number;
  }> {
    const jobId = uuidv4();

    // Mapear prioridad a string
    const priorityLevel = jobData.priority && jobData.priority > 7 ? 'urgent' :
                         jobData.priority && jobData.priority > 5 ? 'high' :
                         jobData.priority && jobData.priority > 3 ? 'normal' : 'low';

    const jobOptions = {
      priority: this.queueConfig.priorityLevels[priorityLevel],
      attempts: this.queueConfig.retryConfig.maxRetries,
      removeOnComplete: 50,
      removeOnFail: 100,
      jobId,
    };

    try {
      const job = await this.contentQueue.add('generate-from-news', {
        ...jobData.data,
        type: jobData.type,
        description: jobData.description,
        metadata: {
          priority: priorityLevel,
          userId: 'system',
          createdAt: new Date(),
        }
      }, jobOptions);

      // Obtener posición en la cola
      const waiting = await this.contentQueue.getWaiting();
      const queuePosition = waiting.findIndex(j => j.id === job.id) + 1;

      this.logger.log(`Added generation job ${jobId} with priority ${priorityLevel} at position ${queuePosition}`);

      return {
        jobId,
        status: 'pending',
        estimatedProcessingTime: 60000, // 1 minuto estimado
        estimatedCost: 0.05, // $0.05 estimado
        queuePosition,
      };

    } catch (error) {
      this.logger.error(`Failed to add generation job: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📋 Obtener resultado de job
   */
  async getJobResult(jobId: string): Promise<{
    jobId: string;
    status: string;
    result?: Record<string, unknown>;
    error?: string;
    progress?: number;
  } | null> {
    try {
      const job = await this.contentQueue.getJob(jobId);
      if (!job) {
        return null;
      }

      const state = await job.getState();
      const progress = job.progress();

      return {
        jobId,
        status: state,
        result: job.returnvalue,
        error: job.failedReason,
        progress: typeof progress === 'number' ? progress : 0,
      };

    } catch (error) {
      this.logger.error(`Failed to get job result for ${jobId}: ${error.message}`);
      return null;
    }
  }

  /**
   * 🚦 Aplicar rate limiting por proveedor
   */
  private async applyRateLimit(providerId?: string): Promise<void> {
    try {
      const provider = providerId || 'default';
      const limits = this.queueConfig.rateLimits.perProvider[provider]
        || this.queueConfig.rateLimits.perProvider.default;

      // Implementar rate limiting usando Redis si está disponible
      // Por ahora, log para monitoring
      this.logger.debug(`Applying rate limit for provider ${provider}: ${limits.requests}/${limits.duration}ms`);

    } catch (error) {
      this.logger.warn(`Failed to apply rate limit: ${error.message}`);
    }
  }
}