import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Model } from 'mongoose';
import { Queue } from 'bull';
import {
  ScheduledPost,
  ScheduledPostDocument,
} from '../schemas/scheduled-post.schema';

/**
 * ⏰ Scheduled Posts Cron Service
 *
 * FASE 8: Sistema de detección y encolamiento automático
 *
 * Cron job que cada minuto:
 * 1. Detecta posts programados cuya hora ya llegó
 * 2. Los agrega a la queue de Bull para procesamiento
 * 3. Evita duplicados (posts ya en la queue)
 *
 * FRECUENCIA: Cada 1 minuto
 * BUSCA: Posts con status='scheduled' y scheduledAt <= NOW
 * AGREGA: Jobs a queue 'scheduled-posts' con nombre 'publish-post'
 *
 * NOTA: Bull se encarga de la ejecución. Este cron solo detecta y encola.
 */
@Injectable()
export class ScheduledPostsCronService {
  private readonly logger = new Logger(ScheduledPostsCronService.name);

  constructor(
    @InjectModel(ScheduledPost.name)
    private scheduledPostModel: Model<ScheduledPostDocument>,
    @InjectQueue('scheduled-posts')
    private scheduledPostsQueue: Queue,
  ) {
    this.logger.log('⏰ Scheduled Posts Cron Service initialized');
  }

  /**
   * 🔍 Cron que detecta posts listos para publicar
   *
   * Ejecuta cada minuto para verificar si hay posts
   * cuya hora programada ya llegó.
   *
   * Busca: status='scheduled' AND scheduledAt <= NOW
   */
  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'detect-scheduled-posts',
    timeZone: 'America/Mexico_City',
  })
  async detectAndEnqueueReadyPosts(): Promise<void> {
    try {
      const now = new Date();

      // 1. Buscar posts programados cuya hora ya llegó
      const readyPosts = await this.scheduledPostModel
        .find({
          status: 'scheduled',
          scheduledAt: { $lte: now },
        })
        .limit(50) // Procesar máximo 50 posts por cron execution
        .exec();

      if (readyPosts.length === 0) {
        // No hay posts listos, log silencioso
        return;
      }

      this.logger.log(
        `🔍 Detectados ${readyPosts.length} posts listos para publicar`,
      );

      // 2. Agregar cada post a la queue
      let enqueued = 0;
      let skipped = 0;

      for (const post of readyPosts) {
        try {
          // Verificar si el post ya está en la queue (evitar duplicados)
          const existingJob = await this.findJobInQueue(String(post._id));

          if (existingJob) {
            this.logger.debug(
              `⏭️ Post ${String(post._id)} ya está en la queue, skipping`,
            );
            skipped++;
            continue;
          }

          // Agregar job a la queue
          await this.scheduledPostsQueue.add(
            'publish-post',
            {
              scheduledPostId: String(post._id),
              scheduledAt: post.scheduledAt,
              platform: post.platform,
              contentType: post.contentType,
              isRecycled: post.contentType === 'recycled',
            },
            {
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 120000, // 2 minutos entre reintentos
              },
              removeOnComplete: 100,
              removeOnFail: false, // Mantener jobs fallidos para análisis
            },
          );

          enqueued++;
          this.logger.log(
            `✅ Post ${post._id} agregado a queue para publicación en ${post.platform}`,
          );
        } catch (error) {
          this.logger.error(
            `❌ Error encolando post ${post._id}: ${error.message}`,
            error.stack,
          );
        }
      }

      this.logger.log(
        `📊 Resumen: ${enqueued} posts encolados, ${skipped} skipped`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Error en cron detectAndEnqueueReadyPosts: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * 🔍 Busca un job en la queue por scheduledPostId
   *
   * @param scheduledPostId - ID del post a buscar
   * @returns Job si existe, null si no
   */
  private async findJobInQueue(scheduledPostId: string): Promise<any> {
    try {
      // Buscar en jobs waiting y delayed
      const [waitingJobs, delayedJobs, activeJobs] = await Promise.all([
        this.scheduledPostsQueue.getJobs(['waiting'], 0, 100),
        this.scheduledPostsQueue.getJobs(['delayed'], 0, 100),
        this.scheduledPostsQueue.getJobs(['active'], 0, 100),
      ]);

      const allJobs = [...waitingJobs, ...delayedJobs, ...activeJobs];

      return allJobs.find(
        (job) => job.data.scheduledPostId === scheduledPostId,
      );
    } catch (error) {
      this.logger.error(
        `Error buscando job en queue: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * 📊 Log stats de la queue (ejecuta cada 5 minutos)
   */
  @Cron('*/5 * * * *', {
    name: 'queue-stats',
    timeZone: 'America/Mexico_City',
  })
  async logQueueStats(): Promise<void> {
    try {
      const [
        waitingCount,
        activeCount,
        completedCount,
        failedCount,
        delayedCount,
      ] = await Promise.all([
        this.scheduledPostsQueue.getWaitingCount(),
        this.scheduledPostsQueue.getActiveCount(),
        this.scheduledPostsQueue.getCompletedCount(),
        this.scheduledPostsQueue.getFailedCount(),
        this.scheduledPostsQueue.getDelayedCount(),
      ]);

      this.logger.log(`📊 Queue Stats - scheduled-posts:`);
      this.logger.log(`   - Waiting: ${waitingCount}`);
      this.logger.log(`   - Active: ${activeCount}`);
      this.logger.log(`   - Delayed: ${delayedCount}`);
      this.logger.log(`   - Completed: ${completedCount}`);
      this.logger.log(`   - Failed: ${failedCount}`);
    } catch (error) {
      this.logger.error(
        `Error obteniendo stats de queue: ${error.message}`,
        error.stack,
      );
    }
  }
}
