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
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PublishingQueue, PublishingQueueDocument } from '../schemas/publishing-queue.schema';
import { PublishService } from '../services/publish.service';
import { PublishNoticiaDto } from '../dto/publish-noticia.dto';

/**
 * 📦 Datos del job de publicación
 */
export interface PublishingJobData {
  queueId: string; // ID del documento PublishingQueue
  contentId: string; // ID del contenido generado
  useOriginalImage: boolean; // Usar imagen original o custom
  customImageUrl?: string; // URL de imagen custom
  isFeatured?: boolean; // Destacar
  isNoticia?: boolean; // Es noticia (para metadata)
  scheduledAt: Date | string; // Hora programada (Date al crear, string al deserializar desde Redis)
}

/**
 * 🔄 Processor para cola de publicación automática
 * Procesa jobs programados y publica noticias en el momento indicado
 */
@Processor('publishing-queue')
@Injectable()
export class PublishingQueueProcessor {
  private readonly logger = new Logger(PublishingQueueProcessor.name);

  constructor(
    @InjectModel(PublishingQueue.name)
    private publishingQueueModel: Model<PublishingQueueDocument>,
    private readonly publishService: PublishService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * 🎯 Procesar job de publicación programada
   */
  @Process('publish-scheduled')
  async handleScheduledPublish(job: Job<PublishingJobData>): Promise<void> {
    const { data } = job;
    const startTime = Date.now();

    // 🔥 FIX: BullMQ serializa las fechas como strings, convertir de vuelta a Date
    const scheduledAt = new Date(data.scheduledAt);

    this.logger.log(
      `📰 Processing publishing job ${data.queueId} | ContentId: ${data.contentId} | ` +
      `Scheduled: ${scheduledAt.toISOString()}`,
    );

    try {
      // 1️⃣ Actualizar estado a 'processing'
      await this.updateQueueStatus(data.queueId, 'processing', {
        processingStartedAt: new Date(),
      });

      // 2️⃣ Preparar DTO de publicación
      const publishDto: PublishNoticiaDto = {
        contentId: data.contentId,
        useOriginalImage: data.useOriginalImage,
        customImageUrl: data.customImageUrl,
        isFeatured: data.isFeatured,
        isBreaking: false, // Breaking news nunca pasa por cola
      };

      // 3️⃣ Publicar noticia usando PublishService
      const publishedNoticia = await this.publishService.publishNoticia(publishDto);

      // 4️⃣ Calcular delay real vs programado
      const actualPublishTime = new Date();
      const delayMs = actualPublishTime.getTime() - scheduledAt.getTime();

      this.logger.log(
        `✅ Published noticia ${publishedNoticia.slug} | ` +
        `Delay: ${Math.round(delayMs / 1000)}s | ` +
        `Processing time: ${Date.now() - startTime}ms`,
      );

      // 5️⃣ Actualizar estado a 'published' y guardar noticiaId
      await this.publishingQueueModel.findByIdAndUpdate(data.queueId, {
        status: 'published',
        noticiaId: publishedNoticia._id, // 🔑 CRITICAL: Guardar ID de noticia publicada
        publishedAt: actualPublishTime,
        'processingMetadata.processingCompletedAt': new Date(),
        'processingMetadata.actualPublishTime': actualPublishTime,
        'processingMetadata.delayFromScheduled': delayMs,
      });

      // 6️⃣ Emitir evento de publicación exitosa
      this.eventEmitter.emit('queue.published', {
        queueId: data.queueId,
        contentId: data.contentId,
        noticiaId: publishedNoticia._id,
        slug: publishedNoticia.slug,
        scheduledAt,
        publishedAt: actualPublishTime,
        delayMs,
        processingTimeMs: Date.now() - startTime,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `❌ Failed to publish content ${data.contentId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Actualizar estado a 'failed'
      await this.updateQueueStatus(data.queueId, 'failed', {
        lastError: errorMessage,
        lastAttemptAt: new Date(),
      });

      // Re-throw para que BullMQ maneje retry
      throw error;
    }
  }

  /**
   * 📝 Actualizar estado del item en cola
   */
  private async updateQueueStatus(
    queueId: string,
    status: 'processing' | 'published' | 'failed',
    metadata: Partial<{
      processingStartedAt: Date;
      processingCompletedAt: Date;
      actualPublishTime: Date;
      delayFromScheduled: number;
      lastError: string;
      lastAttemptAt: Date;
    }>,
  ): Promise<void> {
    const update: Record<string, unknown> = { status };

    // Incrementar attemptCount si es processing o failed
    if (status === 'processing' || status === 'failed') {
      update.$inc = { 'processingMetadata.attemptCount': 1 };
    }

    // Actualizar publishedAt si status es 'published'
    if (status === 'published' && metadata.actualPublishTime) {
      update.publishedAt = metadata.actualPublishTime;
    }

    // Actualizar processingMetadata
    if (metadata.processingStartedAt) {
      update['processingMetadata.processingStartedAt'] = metadata.processingStartedAt;
    }

    if (metadata.processingCompletedAt) {
      update['processingMetadata.processingCompletedAt'] = metadata.processingCompletedAt;
    }

    if (metadata.actualPublishTime) {
      update['processingMetadata.actualPublishTime'] = metadata.actualPublishTime;
    }

    if (metadata.delayFromScheduled !== undefined) {
      update['processingMetadata.delayFromScheduled'] = metadata.delayFromScheduled;
    }

    if (metadata.lastError) {
      update['processingMetadata.lastError'] = metadata.lastError;
      update.$push = { errors: metadata.lastError };
    }

    if (metadata.lastAttemptAt) {
      update['processingMetadata.lastAttemptAt'] = metadata.lastAttemptAt;
    }

    await this.publishingQueueModel.findByIdAndUpdate(queueId, update);
  }

  /**
   * 🚀 Hook: Cuando el job se activa
   */
  @OnQueueActive()
  onActive(job: Job<PublishingJobData>): void {
    this.logger.debug(
      `⚙️ Job ${job.id} (${job.data.queueId}) is now active`,
    );

    this.eventEmitter.emit('queue.processing-started', {
      queueId: job.data.queueId,
      contentId: job.data.contentId,
      scheduledAt: job.data.scheduledAt,
    });
  }

  /**
   * ✅ Hook: Cuando el job se completa exitosamente
   */
  @OnQueueCompleted()
  onCompleted(job: Job<PublishingJobData>, result: unknown): void {
    this.logger.log(
      `✅ Job ${job.id} (${job.data.queueId}) completed successfully`,
    );
  }

  /**
   * ❌ Hook: Cuando el job falla
   */
  @OnQueueFailed()
  async onFailed(job: Job<PublishingJobData>, error: Error): Promise<void> {
    this.logger.error(
      `❌ Job ${job.id} (${job.data.queueId}) failed: ${error.message}`,
      error.stack,
    );

    this.eventEmitter.emit('queue.failed', {
      queueId: job.data.queueId,
      contentId: job.data.contentId,
      error: error.message,
      attemptNumber: job.attemptsMade,
      willRetry: job.attemptsMade < (job.opts.attempts || 3),
    });
  }
}
