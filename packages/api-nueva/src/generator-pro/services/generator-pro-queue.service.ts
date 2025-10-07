import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { GeneratorProJob, GeneratorProJobDocument } from '../schemas/generator-pro-job.schema';

/**
 * 🤖 Servicio de gestión de colas para Generator Pro
 * Maneja las tres colas principales del sistema:
 * - generator-pro-extraction: Extracción de URLs y contenido
 * - generator-pro-generation: Generación de contenido con IA
 * - generator-pro-publishing: Publicación en Facebook
 */

interface JobCreationData {
  type: 'extract_urls' | 'extract_content' | 'generate_content' | 'publish_facebook' | 'sync_engagement';
  websiteConfigId: string;
  facebookConfigId?: Types.ObjectId;
  relatedEntityId?: Types.ObjectId;
  data: Record<string, unknown>;
  priority: number;
  options?: {
    delay?: number;
    timeout?: number;
    attempts?: number;
  };
}

interface JobStats {
  extraction: {
    active: number;
    waiting: number;
    completed: number;
    failed: number;
    delayed: number;
  };
  generation: {
    active: number;
    waiting: number;
    completed: number;
    failed: number;
    delayed: number;
  };
  publishing: {
    active: number;
    waiting: number;
    completed: number;
    failed: number;
    delayed: number;
  };
  total: {
    active: number;
    waiting: number;
    completed: number;
    failed: number;
  };
}

interface QueueHealth {
  name: string;
  isHealthy: boolean;
  activeJobs: number;
  waitingJobs: number;
  completedJobs: number;
  failedJobs: number;
  lastProcessedAt?: Date;
  averageProcessingTime: number;
  errorRate: number;
}

@Injectable()
export class GeneratorProQueueService implements OnModuleInit {
  private readonly logger = new Logger(GeneratorProQueueService.name);

  constructor(
    @InjectQueue('generator-pro-extraction')
    private readonly extractionQueue: Queue,
    @InjectQueue('generator-pro-generation')
    private readonly generationQueue: Queue,
    @InjectQueue('generator-pro-publishing')
    private readonly publishingQueue: Queue,
    @InjectModel(GeneratorProJob.name)
    private readonly jobModel: Model<GeneratorProJobDocument>,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.log('🤖 Generator Pro Queue Service initialized');
  }

  async onModuleInit(): Promise<void> {
    // Configurar event listeners para todas las colas
    this.setupQueueListeners();
    this.logger.log('✅ Queue listeners configured');
  }

  /**
   * 🔍 AGREGAR JOB DE EXTRACCIÓN
   */
  async addExtractionJob(jobData: JobCreationData): Promise<GeneratorProJobDocument | null> {
    if (!['extract_urls', 'extract_content'].includes(jobData.type)) {
      throw new Error(`Invalid extraction job type: ${jobData.type}`);
    }

    this.logger.log(`🔍 Adding ${jobData.type} job for website: ${jobData.websiteConfigId}`);

    try {
      // Crear documento en BD primero
      const jobDoc = await this.createJobDocument(jobData);

      // Agregar a cola Bull
      const bullJob = await this.extractionQueue.add(jobData.type, {
        jobId: (jobDoc._id as Types.ObjectId).toString(),
        ...jobData,
      }, {
        priority: jobData.priority,
        delay: jobData.options?.delay || 0,
        attempts: jobData.options?.attempts || 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 50,
        removeOnFail: 100,
      });

      // Actualizar con ID de Bull
      jobDoc.set('data.bullJobId', bullJob.id.toString());
      await jobDoc.save();

      this.eventEmitter.emit('generator-pro.job.created', {
        jobId: jobDoc._id,
        type: jobData.type,
        queue: 'extraction',
        timestamp: new Date(),
      });

      this.logger.log(`✅ Extraction job created: ${jobDoc._id}`);

      return jobDoc;

    } catch (error) {
      this.logger.error(`❌ Failed to create extraction job: ${error.message}`);
      return null;
    }
  }

  /**
   * 🤖 AGREGAR JOB DE GENERACIÓN
   */
  async addGenerationJob(jobData: JobCreationData): Promise<GeneratorProJobDocument | null> {
    if (jobData.type !== 'generate_content') {
      throw new Error(`Invalid generation job type: ${jobData.type}`);
    }

    this.logger.log(`🤖 Adding generation job for content: ${jobData.relatedEntityId}`);

    try {
      const jobDoc = await this.createJobDocument(jobData);

      const bullJob = await this.generationQueue.add('generate_content', {
        jobId: (jobDoc._id as Types.ObjectId).toString(),
        ...jobData,
      }, {
        priority: jobData.priority,
        delay: jobData.options?.delay || 0,
        attempts: jobData.options?.attempts || 3,
        backoff: {
          type: 'exponential',
          delay: 10000, // Más delay para jobs de IA
        },
        removeOnComplete: 30,
        removeOnFail: 50,
      });

      jobDoc.set('data.bullJobId', bullJob.id.toString());
      await jobDoc.save();

      this.eventEmitter.emit('generator-pro.job.created', {
        jobId: jobDoc._id,
        type: jobData.type,
        queue: 'generation',
        timestamp: new Date(),
      });

      this.logger.log(`✅ Generation job created: ${jobDoc._id}`);

      return jobDoc;

    } catch (error) {
      this.logger.error(`❌ Failed to create generation job: ${error.message}`);
      return null;
    }
  }

  /**
   * 📱 AGREGAR JOB DE PUBLICACIÓN
   */
  async addPublishingJob(jobData: JobCreationData): Promise<GeneratorProJobDocument | null> {
    if (!['publish_facebook', 'sync_engagement'].includes(jobData.type)) {
      throw new Error(`Invalid publishing job type: ${jobData.type}`);
    }

    this.logger.log(`📱 Adding ${jobData.type} job for config: ${jobData.facebookConfigId}`);

    try {
      const jobDoc = await this.createJobDocument(jobData);

      const bullJob = await this.publishingQueue.add(jobData.type, {
        jobId: (jobDoc._id as Types.ObjectId).toString(),
        ...jobData,
      }, {
        priority: jobData.priority,
        delay: jobData.options?.delay || 0,
        attempts: jobData.options?.attempts || 2, // Menos intentos para publicación
        backoff: {
          type: 'exponential',
          delay: 30000, // Más delay para APIs externas
        },
        removeOnComplete: 20,
        removeOnFail: 30,
      });

      jobDoc.set('data.bullJobId', bullJob.id.toString());
      await jobDoc.save();

      this.eventEmitter.emit('generator-pro.job.created', {
        jobId: jobDoc._id,
        type: jobData.type,
        queue: 'publishing',
        timestamp: new Date(),
      });

      this.logger.log(`✅ Publishing job created: ${jobDoc._id}`);

      return jobDoc;

    } catch (error) {
      this.logger.error(`❌ Failed to create publishing job: ${error.message}`);
      return null;
    }
  }

  /**
   * 📊 OBTENER ESTADÍSTICAS DE COLAS
   */
  async getJobStats(): Promise<JobStats> {
    try {
      const [extractionStats, generationStats, publishingStats] = await Promise.all([
        this.getQueueStats(this.extractionQueue),
        this.getQueueStats(this.generationQueue),
        this.getQueueStats(this.publishingQueue),
      ]);

      const stats: JobStats = {
        extraction: extractionStats,
        generation: generationStats,
        publishing: publishingStats,
        total: {
          active: extractionStats.active + generationStats.active + publishingStats.active,
          waiting: extractionStats.waiting + generationStats.waiting + publishingStats.waiting,
          completed: extractionStats.completed + generationStats.completed + publishingStats.completed,
          failed: extractionStats.failed + generationStats.failed + publishingStats.failed,
        },
      };

      return stats;

    } catch (error) {
      this.logger.error(`Failed to get job stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🔄 REINTENTAR JOBS FALLIDOS
   */
  async retryFailedJobs(options?: {
    maxAge?: number; // Máximo edad en horas
    maxRetries?: number; // Máximo reintentos por job
    queueType?: 'extraction' | 'generation' | 'publishing';
  }): Promise<{ retriedJobs: number; message: string }> {
    this.logger.log('🔄 Retrying failed jobs...');

    const maxAge = options?.maxAge || 24; // 24 horas por defecto
    const maxRetries = options?.maxRetries || 3;
    const cutoffDate = new Date(Date.now() - (maxAge * 60 * 60 * 1000));

    try {
      // Construir filtro
      const filter: Record<string, unknown> = {
        status: 'failed',
        retryCount: { $lt: maxRetries },
        createdAt: { $gte: cutoffDate },
      };

      if (options?.queueType) {
        const typeMap: Record<string, string[]> = {
          extraction: ['extract_urls', 'extract_content'],
          generation: ['generate_content'],
          publishing: ['publish_facebook', 'sync_engagement'],
        };
        filter.type = { $in: typeMap[options.queueType] };
      }

      // Obtener jobs fallidos elegibles
      const failedJobs = await this.jobModel.find(filter).limit(50); // Máximo 50 por vez

      let retriedJobs = 0;

      for (const jobDoc of failedJobs) {
        try {
          // Reintentar según el tipo
          const newJobData: JobCreationData = {
            type: jobDoc.type as any,
            websiteConfigId: jobDoc.websiteConfigId.toString(),
            facebookConfigId: jobDoc.facebookConfigId,
            relatedEntityId: jobDoc.relatedEntityId,
            data: {
              ...jobDoc.data,
              isRetry: true,
              originalJobId: (jobDoc._id as Types.ObjectId).toString(),
            },
            priority: Math.min(jobDoc.priority + 1, 10), // Incrementar prioridad
          };

          let newJob: GeneratorProJobDocument | null = null;

          if (['extract_urls', 'extract_content'].includes(jobDoc.type)) {
            newJob = await this.addExtractionJob(newJobData);
          } else if (jobDoc.type === 'generate_content') {
            newJob = await this.addGenerationJob(newJobData);
          } else if (['publish_facebook', 'sync_engagement'].includes(jobDoc.type)) {
            newJob = await this.addPublishingJob(newJobData);
          }

          if (newJob) {
            // Marcar job original como reintentado
            await this.jobModel.findByIdAndUpdate(jobDoc._id, {
              status: 'retrying',
              retryCount: jobDoc.retryCount + 1,
              nextRetryAt: new Date(),
            });

            retriedJobs++;
          }

        } catch (error) {
          this.logger.warn(`Failed to retry job ${jobDoc._id}: ${error.message}`);
        }
      }

      this.eventEmitter.emit('generator-pro.jobs.retried', {
        retriedJobs,
        timestamp: new Date(),
      });

      this.logger.log(`✅ Retried ${retriedJobs} failed jobs`);

      return {
        retriedJobs,
        message: `Successfully retried ${retriedJobs} failed jobs`,
      };

    } catch (error) {
      this.logger.error(`❌ Failed to retry jobs: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🧹 LIMPIAR COLA ESPECÍFICA
   */
  async clearQueue(queueName: 'extraction' | 'generation' | 'publishing'): Promise<{ message: string }> {
    this.logger.log(`🧹 Clearing queue: ${queueName}`);

    try {
      let queue: Queue;
      switch (queueName) {
        case 'extraction':
          queue = this.extractionQueue;
          break;
        case 'generation':
          queue = this.generationQueue;
          break;
        case 'publishing':
          queue = this.publishingQueue;
          break;
      }

      // Limpiar jobs en diferentes estados
      await Promise.all([
        queue.clean(0, 'completed'),
        queue.clean(0, 'failed'),
        queue.clean(0, 'active'),
        queue.clean(0, 'delayed'),
      ]);

      this.eventEmitter.emit('generator-pro.queue.cleared', {
        queueName,
        timestamp: new Date(),
      });

      this.logger.log(`✅ Queue ${queueName} cleared successfully`);

      return {
        message: `Queue ${queueName} cleared successfully`,
      };

    } catch (error) {
      this.logger.error(`❌ Failed to clear queue ${queueName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🏥 OBTENER SALUD DE COLAS
   */
  async getQueueHealth(): Promise<QueueHealth[]> {
    const queues = [
      { name: 'extraction', queue: this.extractionQueue },
      { name: 'generation', queue: this.generationQueue },
      { name: 'publishing', queue: this.publishingQueue },
    ];

    const healthChecks = await Promise.all(
      queues.map(async ({ name, queue }) => {
        try {
          const [waiting, active, completed, failed] = await Promise.all([
            queue.getWaiting(),
            queue.getActive(),
            queue.getCompleted(),
            queue.getFailed(),
          ]);

          // Calcular métricas de salud
          const totalJobs = completed.length + failed.length;
          const errorRate = totalJobs > 0 ? (failed.length / totalJobs) * 100 : 0;

          const avgProcessingTime = await this.calculateAverageProcessingTime(name);
          const lastProcessedAt = completed.length > 0
            ? new Date(Math.max(...completed.map(job => job.processedOn || 0)))
            : undefined;

          const health: QueueHealth = {
            name,
            isHealthy: active.length < 100 && errorRate < 50, // Thresholds básicos
            activeJobs: active.length,
            waitingJobs: waiting.length,
            completedJobs: completed.length,
            failedJobs: failed.length,
            lastProcessedAt,
            averageProcessingTime: avgProcessingTime,
            errorRate,
          };

          return health;

        } catch (error) {
          return {
            name,
            isHealthy: false,
            activeJobs: 0,
            waitingJobs: 0,
            completedJobs: 0,
            failedJobs: 0,
            averageProcessingTime: 0,
            errorRate: 100,
          };
        }
      })
    );

    return healthChecks;
  }

  /**
   * 🔧 MÉTODOS AUXILIARES PRIVADOS
   */

  private async createJobDocument(jobData: JobCreationData): Promise<GeneratorProJobDocument> {
    const jobDoc = new this.jobModel({
      type: jobData.type,
      websiteConfigId: jobData.websiteConfigId,
      facebookConfigId: jobData.facebookConfigId,
      relatedEntityId: jobData.relatedEntityId,
      status: 'pending',
      priority: jobData.priority,
      data: jobData.data,
      maxRetries: jobData.options?.attempts || 3,
      options: {
        timeout: jobData.options?.timeout || 120000, // 2 minutos por defecto
        delay: jobData.options?.delay || 0,
      },
      scheduledAt: new Date(Date.now() + (jobData.options?.delay || 0)),
    });

    return await jobDoc.save();
  }

  private async getQueueStats(queue: Queue): Promise<JobStats['extraction']> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
    ]);

    return {
      active: active.length,
      waiting: waiting.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  private async calculateAverageProcessingTime(queueName: string): Promise<number> {
    // Calcular tiempo promedio de procesamiento de los últimos 50 jobs completados
    const recentJobs = await this.jobModel.find({
      status: 'completed',
      type: { $regex: queueName === 'extraction' ? 'extract' : queueName === 'generation' ? 'generate' : 'publish' },
      processingTime: { $exists: true },
    })
    .sort({ completedAt: -1 })
    .limit(50);

    if (recentJobs.length === 0) return 0;

    const totalTime = recentJobs.reduce((sum, job) => sum + (job.processingTime || 0), 0);
    return Math.round(totalTime / recentJobs.length);
  }

  private setupQueueListeners(): void {
    const queues = [
      { name: 'extraction', queue: this.extractionQueue },
      { name: 'generation', queue: this.generationQueue },
      { name: 'publishing', queue: this.publishingQueue },
    ];

    queues.forEach(({ name, queue }) => {
      // Job iniciado
      queue.on('active', (job: Job) => {
        this.updateJobStatus(job.data.jobId, 'processing', { startedAt: new Date() });
        this.logger.log(`📤 ${name} job started: ${job.data.jobId}`);
      });

      // Job completado
      queue.on('completed', (job: Job, result: unknown) => {
        this.updateJobStatus(job.data.jobId, 'completed', {
          completedAt: new Date(),
          result,
        });
        this.logger.log(`✅ ${name} job completed: ${job.data.jobId}`);
      });

      // Job fallido
      queue.on('failed', (job: Job, error: Error) => {
        this.updateJobStatus(job.data.jobId, 'failed', {
          error: error.message,
          errorDetails: {
            message: error.message,
            stack: error.stack,
            timestamp: new Date(),
          },
        });
        this.logger.error(`❌ ${name} job failed: ${job.data.jobId} - ${error.message}`);
      });

      // Job estancado
      queue.on('stalled', (job: Job) => {
        this.logger.warn(`⚠️ ${name} job stalled: ${job.data.jobId}`);
      });
    });
  }

  private async updateJobStatus(
    jobId: string,
    status: string,
    updates: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      await this.jobModel.findByIdAndUpdate(jobId, {
        status,
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      this.logger.warn(`Failed to update job status for ${jobId}: ${error.message}`);
    }
  }
}