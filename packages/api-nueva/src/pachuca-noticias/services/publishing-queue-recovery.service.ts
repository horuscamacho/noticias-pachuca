import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Model } from 'mongoose';
import { Queue } from 'bull';
import {
  PublishingQueue,
  PublishingQueueDocument,
} from '../schemas/publishing-queue.schema';
import { PublishingJobData } from '../processors/publishing-queue.processor';

/**
 * 🔄 Servicio de recuperación de jobs perdidos
 *
 * Este servicio se ejecuta automáticamente al arrancar el servidor y:
 * 1. Busca jobs en MongoDB con status='queued'
 * 2. Verifica si existen en BullMQ
 * 3. Re-crea los jobs que faltan (por ejemplo, después de un reinicio)
 * 4. Actualiza el bullJobId en MongoDB
 *
 * PROBLEMA QUE RESUELVE:
 * Cuando el servidor se reinicia durante desarrollo, los jobs delayed/waiting
 * en BullMQ se pierden aunque estén guardados en Redis. Este servicio los
 * detecta y los re-crea automáticamente.
 */
@Injectable()
export class PublishingQueueRecoveryService implements OnModuleInit {
  private readonly logger = new Logger(PublishingQueueRecoveryService.name);

  constructor(
    @InjectModel(PublishingQueue.name)
    private publishingQueueModel: Model<PublishingQueueDocument>,
    @InjectQueue('publishing-queue')
    private publishingQueue: Queue<PublishingJobData>,
  ) {}

  /**
   * Hook ejecutado cuando el módulo se inicializa
   * Recupera automáticamente jobs pendientes
   */
  async onModuleInit() {
    this.logger.log('🔄 Iniciando sistema de recovery de jobs programados...');

    // Esperar 3 segundos para que Redis y BullMQ estén completamente listos
    await new Promise(resolve => setTimeout(resolve, 3000));

    await this.recoverPendingJobs();
  }

  /**
   * Recupera jobs pendientes desde MongoDB y los re-crea en BullMQ
   */
  async recoverPendingJobs(): Promise<{
    recovered: number;
    skipped: number;
    expired: number;
    errors: number;
  }> {
    try {
      // 1️⃣ Buscar TODOS los jobs en estado 'queued' (sin filtro de fecha)
      // 🔥 FIX: No filtrar por fecha - buscar todos los queued
      // Razón: Jobs que fallaron antes de su hora quedan "queued" pero ya pasaron
      const pendingJobs = await this.publishingQueueModel.find({
        status: 'queued',
      }).sort({ scheduledPublishAt: 1 }); // Ordenar por fecha

      if (pendingJobs.length === 0) {
        this.logger.log('✅ No hay jobs pendientes para recuperar');
        return { recovered: 0, skipped: 0, expired: 0, errors: 0 };
      }

      this.logger.log(
        `🔍 Encontrados ${pendingJobs.length} jobs con status='queued' en MongoDB. Verificando BullMQ...`,
      );

      let recovered = 0;
      let skipped = 0;
      let expired = 0;
      let errors = 0;

      for (const queueItem of pendingJobs) {
        try {
          // 2️⃣ Verificar si el job existe en BullMQ
          let jobExists = false;

          if (queueItem.bullJobId) {
            const existingJob = await this.publishingQueue.getJob(
              queueItem.bullJobId,
            );
            jobExists = !!existingJob;

            if (jobExists) {
              this.logger.debug(
                `✓ Job ${queueItem._id} ya existe en BullMQ (${queueItem.bullJobId})`,
              );
              skipped++;
              continue;
            }
          }

          // 3️⃣ Si no existe, re-crearlo
          const delayMs = queueItem.scheduledPublishAt.getTime() - Date.now();

          // Si ya pasó más de 10 minutos de la hora programada, marcar como expired
          // 🔥 FIX: Aumentar ventana a 10 min para dar margen en desarrollo
          if (delayMs < -600000) {
            this.logger.warn(
              `⏰ Job ${queueItem._id} expiró (${Math.abs(Math.round(delayMs / 60000))}min tarde). Marcando como failed.`,
            );

            queueItem.status = 'failed';
            queueItem.errors.push(
              `Job expiró: programado para ${queueItem.scheduledPublishAt.toISOString()}, ` +
              `pero pasaron más de 10 minutos. Recovery no pudo procesarlo.`,
            );
            await queueItem.save();

            expired++;
            continue;
          }

          // Si ya pasó la hora pero menos de 10 min, procesar inmediatamente
          if (delayMs < 0) {
            this.logger.warn(
              `⚡ Job ${queueItem._id} pasó su hora programada (${Math.abs(Math.round(delayMs / 60000))}min tarde). Procesando inmediatamente...`,
            );
          }

          // 4️⃣ Re-crear el job en BullMQ
          const queueId = String(queueItem._id);
          const job = await this.publishingQueue.add(
            'publish-scheduled',
            {
              queueId,
              contentId: queueItem.contentId.toString(),
              useOriginalImage: true, // Por defecto usar imagen original
              isFeatured: false,
              isNoticia: queueItem.queueType === 'news',
              scheduledAt: queueItem.scheduledPublishAt,
            },
            {
              delay: Math.max(0, delayMs), // No delay negativo
              priority: queueItem.priority,
              jobId: queueId, // Usar MongoDB _id como jobId
            },
          );

          // 5️⃣ Actualizar bullJobId en MongoDB
          queueItem.bullJobId = job.id.toString();
          await queueItem.save();

          recovered++;

          const delayMinutes = Math.round(delayMs / 60000);
          const delayText =
            delayMinutes > 0
              ? `${delayMinutes}min`
              : 'inmediatamente';

          this.logger.log(
            `✅ Recuperado job ${queueItem._id} | ` +
            `Tipo: ${queueItem.queueType} | ` +
            `Prioridad: ${queueItem.priority} | ` +
            `Procesar en: ${delayText}`,
          );
        } catch (error) {
          errors++;
          this.logger.error(
            `❌ Error recuperando job ${queueItem._id}: ${error.message}`,
            error.stack,
          );

          // Guardar error en el documento
          queueItem.errors.push(
            `Recovery error: ${error.message}`,
          );
          await queueItem.save();
        }
      }

      // 6️⃣ Resumen final
      const summary = {
        recovered,
        skipped,
        expired,
        errors,
      };

      this.logger.log(
        `🎯 Recovery completado: ` +
        `${recovered} recuperados, ` +
        `${skipped} ya existían, ` +
        `${expired} expirados, ` +
        `${errors} errores`,
      );

      return summary;
    } catch (error) {
      this.logger.error(
        `❌ Error crítico en recovery de jobs: ${error.message}`,
        error.stack,
      );

      return { recovered: 0, skipped: 0, expired: 0, errors: 1 };
    }
  }

  /**
   * Limpia jobs completados/fallidos antiguos de MongoDB
   *
   * @param daysOld - Número de días de antigüedad (default: 7)
   * @returns Número de documentos eliminados
   */
  async cleanOldJobs(daysOld: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.publishingQueueModel.deleteMany({
        status: { $in: ['published', 'failed', 'cancelled'] },
        updatedAt: { $lt: cutoffDate },
      });

      this.logger.log(
        `🧹 Limpiados ${result.deletedCount} jobs antiguos (>${daysOld} días)`,
      );

      return result.deletedCount;
    } catch (error) {
      this.logger.error(
        `❌ Error limpiando jobs antiguos: ${error.message}`,
        error.stack,
      );
      return 0;
    }
  }

  /**
   * Verifica la salud de la sincronización entre MongoDB y BullMQ
   *
   * @returns Objeto con estadísticas de sincronización
   */
  async checkSyncHealth(): Promise<{
    healthy: boolean;
    mongodb: {
      queued: number;
      processing: number;
    };
    bullmq: {
      waiting: number;
      delayed: number;
      active: number;
      total: number;
    };
    sync: {
      inSync: boolean;
      difference: number;
    };
  }> {
    try {
      // Contar en MongoDB
      const [mongoQueued, mongoProcessing] = await Promise.all([
        this.publishingQueueModel.countDocuments({ status: 'queued' }),
        this.publishingQueueModel.countDocuments({ status: 'processing' }),
      ]);

      // Contar en BullMQ
      const [bullWaiting, bullDelayed, bullActive] = await Promise.all([
        this.publishingQueue.getWaitingCount(),
        this.publishingQueue.getDelayedCount(),
        this.publishingQueue.getActiveCount(),
      ]);

      const bullTotal = bullWaiting + bullDelayed + bullActive;
      const mongoTotal = mongoQueued + mongoProcessing;

      // Determinar si están sincronizados (permitir diferencia de 1)
      const isInSync = Math.abs(mongoTotal - bullTotal) <= 1;

      return {
        healthy: isInSync,
        mongodb: {
          queued: mongoQueued,
          processing: mongoProcessing,
        },
        bullmq: {
          waiting: bullWaiting,
          delayed: bullDelayed,
          active: bullActive,
          total: bullTotal,
        },
        sync: {
          inSync: isInSync,
          difference: mongoTotal - bullTotal,
        },
      };
    } catch (error) {
      this.logger.error(
        `❌ Error verificando salud de sincronización: ${error.message}`,
      );
      throw error;
    }
  }
}
