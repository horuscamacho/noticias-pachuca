import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';

export interface ImageGenerationJobData {
  generationId: string;
  prompt: string; // fullPrompt (con branding) para OpenAI
  model: string;
  quality: 'low' | 'medium' | 'high';
  size: string;
  userId: string;
  extractedNoticiaId?: string;
  // NUEVO (FASE 5): Datos para metadata limpia
  basePrompt?: string; // Prompt editorial limpio (sin branding)
  contentAnalysis?: Record<string, unknown>; // Resultado del análisis de contenido
  originalTitle?: string; // Título original de la noticia
}

@Injectable()
export class ImageGenerationQueueService {
  private readonly logger = new Logger(ImageGenerationQueueService.name);

  constructor(
    @InjectQueue('image-generation')
    private imageGenerationQueue: Queue<ImageGenerationJobData>,
  ) {}

  /**
   * Add single image generation job to queue
   */
  async addGenerationJob(data: ImageGenerationJobData): Promise<Job<ImageGenerationJobData>> {
    const job = await this.imageGenerationQueue.add('generate-single-image', data, {
      priority: this.getPriority(data.quality),
      timeout: 60000, // 60 seconds
    });

    this.logger.log(`✓ Job queued: ${job.id} (generation: ${data.generationId})`);
    return job;
  }

  /**
   * Add batch of image generation jobs
   */
  async addBatchJobs(batchData: ImageGenerationJobData[]): Promise<Job<ImageGenerationJobData>[]> {
    const jobs = await this.imageGenerationQueue.addBulk(
      batchData.map((data) => ({
        name: 'generate-single-image',
        data,
        opts: {
          priority: this.getPriority(data.quality),
          timeout: 60000,
        },
      })),
    );

    this.logger.log(`✓ Batch queued: ${jobs.length} jobs`);
    return jobs;
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<{
    id: string | number | undefined;
    state: string;
    progress: number | object;
    failedReason: string | undefined;
    data: ImageGenerationJobData;
    finishedOn: number | null | undefined;
    processedOn: number | null | undefined;
  } | null> {
    const job = await this.imageGenerationQueue.getJob(jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress();
    const failedReason = job.failedReason;

    return {
      id: job.id,
      state,
      progress,
      failedReason,
      data: job.data,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
    };
  }

  /**
   * Cancel job
   */
  async cancelJob(jobId: string): Promise<void> {
    const job = await this.imageGenerationQueue.getJob(jobId);
    if (job) {
      await job.remove();
      this.logger.log(`✓ Job cancelled: ${jobId}`);
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    total: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.imageGenerationQueue.getWaitingCount(),
      this.imageGenerationQueue.getActiveCount(),
      this.imageGenerationQueue.getCompletedCount(),
      this.imageGenerationQueue.getFailedCount(),
      this.imageGenerationQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * Priority based on quality (higher quality = higher priority)
   */
  private getPriority(quality: string): number {
    const priorities: Record<string, number> = { low: 3, medium: 2, high: 1 };
    return priorities[quality] || 2;
  }
}
