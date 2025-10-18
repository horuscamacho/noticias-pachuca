import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ScheduledPost,
  ScheduledPostDocument,
} from '../schemas/scheduled-post.schema';

/**
 * 🧹 Cleanup Service
 *
 * FASE 8: Sistema de limpieza automática
 *
 * Limpia automáticamente:
 * 1. Posts completados antiguos (>30 días)
 * 2. Posts cancelados antiguos (>30 días)
 * 3. Posts fallidos antiguos (>7 días)
 *
 * FRECUENCIA: Diariamente a las 3:00 AM (hora menos tráfico)
 *
 * CRITERIOS DE LIMPIEZA:
 * - published + publishedAt < 30 días ago → DELETE
 * - cancelled + updatedAt < 30 días ago → DELETE
 * - failed + updatedAt < 7 días ago → DELETE
 * - scheduled + scheduledAt < 7 días ago → ALERT (probablemente bug)
 */
@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  // Configuración de días para limpieza
  private readonly RETENTION_DAYS_PUBLISHED = 30;
  private readonly RETENTION_DAYS_CANCELLED = 30;
  private readonly RETENTION_DAYS_FAILED = 7;

  constructor(
    @InjectModel(ScheduledPost.name)
    private scheduledPostModel: Model<ScheduledPostDocument>,
  ) {
    this.logger.log('🧹 Cleanup Service initialized');
  }

  /**
   * 🧹 Cron que limpia posts antiguos diariamente
   *
   * Ejecuta cada día a las 3:00 AM (México City time)
   */
  @Cron('0 3 * * *', {
    name: 'cleanup-old-posts',
    timeZone: 'America/Mexico_City',
  })
  async cleanupOldPosts(): Promise<void> {
    this.logger.log('🧹 Iniciando limpieza automática de posts antiguos...');

    try {
      const totalDeleted = await this.performCleanup();

      this.logger.log(
        `✅ Limpieza completada. Total eliminados: ${totalDeleted} posts`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Error en limpieza automática: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * 🗑️ Ejecuta la limpieza de posts antiguos
   *
   * @returns Número total de posts eliminados
   */
  async performCleanup(): Promise<number> {
    let totalDeleted = 0;

    // 1. Limpiar posts publicados antiguos (>30 días)
    const publishedDeleted = await this.cleanupPublishedPosts();
    totalDeleted += publishedDeleted;

    // 2. Limpiar posts cancelados antiguos (>30 días)
    const cancelledDeleted = await this.cleanupCancelledPosts();
    totalDeleted += cancelledDeleted;

    // 3. Limpiar posts fallidos antiguos (>7 días)
    const failedDeleted = await this.cleanupFailedPosts();
    totalDeleted += failedDeleted;

    // 4. Alertar sobre posts scheduled antiguos (posible bug)
    await this.alertStaleScheduledPosts();

    return totalDeleted;
  }

  /**
   * 🗑️ Limpia posts publicados con más de X días
   *
   * @returns Número de posts eliminados
   */
  private async cleanupPublishedPosts(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS_PUBLISHED);

    try {
      const result = await this.scheduledPostModel.deleteMany({
        status: 'published',
        publishedAt: { $lt: cutoffDate },
      });

      const deleted = result.deletedCount || 0;

      if (deleted > 0) {
        this.logger.log(
          `🗑️ Eliminados ${deleted} posts publicados antiguos (>${this.RETENTION_DAYS_PUBLISHED} días)`,
        );
      }

      return deleted;
    } catch (error) {
      this.logger.error(
        `Error limpiando posts publicados: ${error.message}`,
        error.stack,
      );
      return 0;
    }
  }

  /**
   * 🗑️ Limpia posts cancelados con más de X días
   *
   * @returns Número de posts eliminados
   */
  private async cleanupCancelledPosts(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS_CANCELLED);

    try {
      const result = await this.scheduledPostModel.deleteMany({
        status: 'cancelled',
        updatedAt: { $lt: cutoffDate },
      });

      const deleted = result.deletedCount || 0;

      if (deleted > 0) {
        this.logger.log(
          `🗑️ Eliminados ${deleted} posts cancelados antiguos (>${this.RETENTION_DAYS_CANCELLED} días)`,
        );
      }

      return deleted;
    } catch (error) {
      this.logger.error(
        `Error limpiando posts cancelados: ${error.message}`,
        error.stack,
      );
      return 0;
    }
  }

  /**
   * 🗑️ Limpia posts fallidos con más de X días
   *
   * @returns Número de posts eliminados
   */
  private async cleanupFailedPosts(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS_FAILED);

    try {
      const result = await this.scheduledPostModel.deleteMany({
        status: 'failed',
        updatedAt: { $lt: cutoffDate },
      });

      const deleted = result.deletedCount || 0;

      if (deleted > 0) {
        this.logger.log(
          `🗑️ Eliminados ${deleted} posts fallidos antiguos (>${this.RETENTION_DAYS_FAILED} días)`,
        );
      }

      return deleted;
    } catch (error) {
      this.logger.error(
        `Error limpiando posts fallidos: ${error.message}`,
        error.stack,
      );
      return 0;
    }
  }

  /**
   * ⚠️ Alerta sobre posts scheduled que nunca se publicaron
   *
   * Si hay posts en status 'scheduled' pero con scheduledAt
   * de hace más de 7 días, probablemente hay un bug.
   */
  private async alertStaleScheduledPosts(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);

    try {
      const stalePosts = await this.scheduledPostModel.find({
        status: 'scheduled',
        scheduledAt: { $lt: cutoffDate },
      }).limit(10);

      if (stalePosts.length > 0) {
        this.logger.warn(
          `⚠️ ALERTA: ${stalePosts.length} posts en status 'scheduled' con scheduledAt > 7 días atrás`,
        );
        this.logger.warn(
          `⚠️ IDs: ${stalePosts.map((p) => String(p._id)).join(', ')}`,
        );
        this.logger.warn(
          `⚠️ Esto puede indicar un problema en el cron job o processor`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error verificando posts scheduled antiguos: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * 📊 Obtiene estadísticas de retención
   *
   * @returns Stats de posts por antigüedad
   */
  async getRetentionStats(): Promise<{
    oldPublished: number;
    oldCancelled: number;
    oldFailed: number;
    staleScheduled: number;
  }> {
    const publishedCutoff = new Date();
    publishedCutoff.setDate(
      publishedCutoff.getDate() - this.RETENTION_DAYS_PUBLISHED,
    );

    const cancelledCutoff = new Date();
    cancelledCutoff.setDate(
      cancelledCutoff.getDate() - this.RETENTION_DAYS_CANCELLED,
    );

    const failedCutoff = new Date();
    failedCutoff.setDate(
      failedCutoff.getDate() - this.RETENTION_DAYS_FAILED,
    );

    const scheduledCutoff = new Date();
    scheduledCutoff.setDate(scheduledCutoff.getDate() - 7);

    const [oldPublished, oldCancelled, oldFailed, staleScheduled] =
      await Promise.all([
        this.scheduledPostModel.countDocuments({
          status: 'published',
          publishedAt: { $lt: publishedCutoff },
        }),
        this.scheduledPostModel.countDocuments({
          status: 'cancelled',
          updatedAt: { $lt: cancelledCutoff },
        }),
        this.scheduledPostModel.countDocuments({
          status: 'failed',
          updatedAt: { $lt: failedCutoff },
        }),
        this.scheduledPostModel.countDocuments({
          status: 'scheduled',
          scheduledAt: { $lt: scheduledCutoff },
        }),
      ]);

    return {
      oldPublished,
      oldCancelled,
      oldFailed,
      staleScheduled,
    };
  }
}
