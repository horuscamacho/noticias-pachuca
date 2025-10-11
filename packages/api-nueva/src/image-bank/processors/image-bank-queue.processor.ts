import {
  Processor,
  Process,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ImageBankService } from '../services/image-bank.service';
import { ProcessImageDto } from '../dto/image-bank.dto';

/**
 * 📦 Datos del job de procesamiento de imagen
 */
export interface ProcessImageJobData {
  imageUrl: string;
  outlet: string;
  keywords?: string[];
  categories?: string[];
  extractedNoticiaId?: string;
  altText?: string;
  caption?: string;
  tags?: string[];
  batchId?: string; // ID para agrupar jobs de un mismo batch
}

/**
 * 📦 Datos del job de procesamiento batch
 */
export interface ProcessBatchJobData {
  batchId: string;
  images: ProcessImageJobData[];
}

/**
 * 🔄 Processor para cola de procesamiento de imágenes
 *
 * Procesa jobs de forma asíncrona:
 * - Procesamiento individual de imágenes
 * - Procesamiento batch de múltiples imágenes
 * - Emisión de eventos para tracking
 */
@Processor('image-bank-processing')
@Injectable()
export class ImageBankQueueProcessor {
  private readonly logger = new Logger(ImageBankQueueProcessor.name);

  constructor(
    private readonly imageBankService: ImageBankService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * 🎯 Procesar imagen individual
   */
  @Process('process-single-image')
  async handleSingleImage(job: Job<ProcessImageJobData>): Promise<void> {
    const { data } = job;
    const startTime = Date.now();

    this.logger.log(
      `🖼️ Processing image job ${job.id} | URL: ${data.imageUrl} | Outlet: ${data.outlet}`,
    );

    try {
      // Preparar DTO
      const processDto: ProcessImageDto = {
        imageUrl: data.imageUrl,
        outlet: data.outlet,
        keywords: data.keywords,
        categories: data.categories,
        extractedNoticiaId: data.extractedNoticiaId,
        altText: data.altText,
        caption: data.caption,
        tags: data.tags,
      };

      // Procesar y almacenar imagen
      const result = await this.imageBankService.processAndStore(processDto);

      const duration = Date.now() - startTime;

      this.logger.log(
        `✅ Image processed successfully in ${duration}ms | ID: ${result._id}`,
      );

      // Emitir evento de éxito
      this.eventEmitter.emit('image-bank.image.processed', {
        imageId: String(result._id),
        jobId: job.id,
        batchId: data.batchId,
        duration,
        outlet: data.outlet,
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error(
        `❌ Failed to process image after ${duration}ms | URL: ${data.imageUrl}`,
        error,
      );

      // Emitir evento de fallo
      this.eventEmitter.emit('image-bank.image.failed', {
        jobId: job.id,
        batchId: data.batchId,
        imageUrl: data.imageUrl,
        outlet: data.outlet,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      throw error; // Re-throw para que Bull marque el job como fallido
    }
  }

  /**
   * 🎯 Procesar batch de imágenes
   *
   * Encola múltiples jobs individuales para procesamiento paralelo
   */
  @Process('process-batch')
  async handleBatch(job: Job<ProcessBatchJobData>): Promise<void> {
    const { data } = job;
    const startTime = Date.now();

    this.logger.log(
      `📦 Processing batch ${data.batchId} | Images: ${data.images.length}`,
    );

    try {
      // Emitir evento de inicio de batch
      this.eventEmitter.emit('image-bank.batch.started', {
        batchId: data.batchId,
        totalImages: data.images.length,
        jobId: job.id,
      });

      // Procesar imágenes en paralelo (limitado por Bull concurrency)
      const results = await Promise.allSettled(
        data.images.map((imageData) => {
          const processDto: ProcessImageDto = {
            imageUrl: imageData.imageUrl,
            outlet: imageData.outlet,
            keywords: imageData.keywords,
            categories: imageData.categories,
            extractedNoticiaId: imageData.extractedNoticiaId,
            altText: imageData.altText,
            caption: imageData.caption,
            tags: imageData.tags,
          };

          return this.imageBankService.processAndStore(processDto);
        }),
      );

      // Contar éxitos y fallos
      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      const duration = Date.now() - startTime;

      this.logger.log(
        `✅ Batch ${data.batchId} completed in ${duration}ms | ` +
          `Success: ${successful}, Failed: ${failed}`,
      );

      // Emitir evento de fin de batch
      this.eventEmitter.emit('image-bank.batch.completed', {
        batchId: data.batchId,
        jobId: job.id,
        totalImages: data.images.length,
        successful,
        failed,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error(
        `❌ Batch ${data.batchId} failed after ${duration}ms`,
        error,
      );

      // Emitir evento de fallo de batch
      this.eventEmitter.emit('image-bank.batch.failed', {
        batchId: data.batchId,
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      throw error;
    }
  }

  /**
   * 🔔 Hook: Job activo
   */
  @OnQueueActive()
  onActive(job: Job): void {
    this.logger.debug(
      `🔄 Job ${job.id} (${job.name}) is now active | Attempt ${job.attemptsMade + 1}`,
    );
  }

  /**
   * 🔔 Hook: Job completado
   */
  @OnQueueCompleted()
  onCompleted(job: Job, result: unknown): void {
    this.logger.debug(
      `✅ Job ${job.id} (${job.name}) completed successfully`,
    );
  }

  /**
   * 🔔 Hook: Job fallido
   */
  @OnQueueFailed()
  onFailed(job: Job, error: Error): void {
    this.logger.error(
      `❌ Job ${job.id} (${job.name}) failed | Attempt ${job.attemptsMade}/${job.opts.attempts}`,
      error.stack,
    );

    // Si ya no hay más reintentos, emitir evento final
    if (job.attemptsMade >= (job.opts.attempts || 1)) {
      this.logger.error(
        `🚨 Job ${job.id} permanently failed after ${job.attemptsMade} attempts`,
      );
    }
  }
}
