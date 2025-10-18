import { Process, Processor, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ScheduledPost,
  ScheduledPostDocument,
} from '../schemas/scheduled-post.schema';
import {
  PublishedNoticia,
  PublishedNoticiaDocument,
} from '../../pachuca-noticias/schemas/published-noticia.schema';
import { SocialMediaPublisherService } from '../services/social-media-publisher.service';

/**
 * Interface para el job data
 */
interface ScheduledPostJobData {
  scheduledPostId: string;
  scheduledAt: Date;
  platform: 'facebook' | 'twitter';
  contentType: string;
  isRecycled?: boolean;
}

/**
 * ⚡ Scheduled Posts Processor
 *
 * FASE 5: BullMQ Queue + Processors
 *
 * Procesa la cola de posts programados y los publica en redes sociales
 * cuando llega su horario programado.
 *
 * WORKFLOW:
 * 1. Job agregado a queue con delay hasta scheduledAt
 * 2. Cuando llega el momento, processor se activa
 * 3. Marca ScheduledPost como "processing"
 * 4. Publica en plataforma (Facebook/Twitter)
 * 5. Actualiza status a "published" con platformPostId
 * 6. Si falla: retry con backoff exponencial (3 intentos)
 *
 * RETRY STRATEGY:
 * - Intento 1: Inmediato
 * - Intento 2: +2 minutos
 * - Intento 3: +4 minutos
 * - Si falla 3 veces: marca como "failed"
 */
@Processor('scheduled-posts')
export class ScheduledPostsProcessor {
  private readonly logger = new Logger(ScheduledPostsProcessor.name);

  constructor(
    @InjectModel(ScheduledPost.name)
    private scheduledPostModel: Model<ScheduledPostDocument>,
    @InjectModel(PublishedNoticia.name)
    private publishedNoticiaModel: Model<PublishedNoticiaDocument>,
    private socialMediaPublisher: SocialMediaPublisherService,
  ) {
    this.logger.log('⚡ Scheduled Posts Processor initialized');
  }

  /**
   * 📝 Procesa un post programado y lo publica en la plataforma
   *
   * @param job - Job de BullMQ con datos del post
   */
  @Process('publish-post')
  async handlePublishPost(job: Job<ScheduledPostJobData>): Promise<void> {
    const { scheduledPostId, platform, contentType } = job.data;

    this.logger.log(
      `📝 Procesando post programado: ${scheduledPostId} (${platform}, ${contentType})`,
    );

    // 1. Obtener ScheduledPost de DB
    const post = await this.scheduledPostModel.findById(scheduledPostId);
    if (!post) {
      throw new Error(`ScheduledPost ${scheduledPostId} no encontrado`);
    }

    // 2. Validar que esté en status correcto
    if (post.status !== 'scheduled') {
      this.logger.warn(
        `Post ${scheduledPostId} no está en status 'scheduled' (actual: ${post.status}). Skipping.`,
      );
      return;
    }

    // 3. Marcar como processing
    post.status = 'processing';
    await post.save();

    this.logger.log(`🔄 Post ${scheduledPostId} marcado como processing`);

    // 4. Obtener noticia asociada
    const noticia = await this.publishedNoticiaModel.findById(post.noticiaId);
    if (!noticia) {
      throw new Error(`Noticia ${post.noticiaId} no encontrada`);
    }

    try {
      // 5. Publicar en plataforma
      const result = await this.publishToPlatform(
        platform,
        post.postContent,
        noticia,
        post,
      );

      // 6. Actualizar post con resultado exitoso
      post.status = 'published';
      post.publishedAt = new Date();
      post.platformPostId = result.platformPostId;
      post.platformPostUrl = result.platformPostUrl;

      await post.save();

      this.logger.log(
        `✅ Post ${scheduledPostId} publicado exitosamente en ${platform}`,
      );
      this.logger.log(`🔗 URL: ${result.platformPostUrl}`);
    } catch (error) {
      // Error será manejado por OnQueueFailed
      throw error;
    }
  }

  /**
   * 📱 Publica contenido en la plataforma especificada
   *
   * FASE 8: Integrado con SocialMediaPublisherService
   *
   * @param platform - Plataforma (facebook, twitter)
   * @param content - Contenido del post
   * @param noticia - Noticia asociada
   * @param post - ScheduledPost
   * @returns Resultado con IDs de la plataforma
   */
  private async publishToPlatform(
    platform: 'facebook' | 'twitter',
    content: string,
    noticia: PublishedNoticiaDocument,
    post: ScheduledPostDocument,
  ): Promise<{
    platformPostId: string;
    platformPostUrl: string;
  }> {
    this.logger.log(`📱 Publicando en ${platform}...`);

    // Usar el servicio de publicación real
    return this.socialMediaPublisher.publishToPlatform(
      platform,
      post,
      noticia,
    );
  }

  /**
   * 🎬 Hook cuando un job se activa (comienza a procesarse)
   */
  @OnQueueActive()
  onActive(job: Job<ScheduledPostJobData>): void {
    this.logger.log(
      `🎬 Job activo: ${job.id} - Post ${job.data.scheduledPostId} (${job.data.platform})`,
    );
  }

  /**
   * ✅ Hook cuando un job se completa exitosamente
   */
  @OnQueueCompleted()
  onCompleted(job: Job<ScheduledPostJobData>, result: any): void {
    this.logger.log(
      `✅ Job completado: ${job.id} - Post ${job.data.scheduledPostId} publicado exitosamente`,
    );
  }

  /**
   * ❌ Hook cuando un job falla
   */
  @OnQueueFailed()
  async onFailed(job: Job<ScheduledPostJobData>, error: Error): Promise<void> {
    this.logger.error(
      `❌ Job fallido: ${job.id} - Post ${job.data.scheduledPostId}`,
      error.stack,
    );

    // Obtener ScheduledPost
    const post = await this.scheduledPostModel.findById(job.data.scheduledPostId);
    if (!post) {
      this.logger.error(`Post ${job.data.scheduledPostId} no encontrado para actualizar falla`);
      return;
    }

    // Trackear intento fallido
    const attemptCount = (post.publishingAttempts?.count || 0) + 1;
    const errors = post.publishingAttempts?.errors || [];

    errors.push({
      timestamp: new Date(),
      error: error.message,
      httpStatus: undefined,
    });

    post.publishingAttempts = {
      count: attemptCount,
      lastAttempt: new Date(),
      errors,
    };

    // Si es el último intento (3), marcar como failed
    if (attemptCount >= 3) {
      post.status = 'failed';
      post.failureReason = `Falló después de 3 intentos. Último error: ${error.message}`;
      this.logger.error(
        `🚫 Post ${job.data.scheduledPostId} marcado como FAILED después de 3 intentos`,
      );
    } else {
      // Aún hay reintentos disponibles, mantener como scheduled
      post.status = 'scheduled';
      this.logger.warn(
        `⚠️ Post ${job.data.scheduledPostId} falló (intento ${attemptCount}/3). Se reintentará.`,
      );
    }

    await post.save();
  }
}
