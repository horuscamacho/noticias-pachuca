import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

/**
 * Interface para el evento scheduled-post.created
 */
interface ScheduledPostCreatedEvent {
  scheduledPostId: string;
  scheduledAt: Date;
  platform: 'facebook' | 'twitter' | 'instagram';
  contentType: string;
  isRecycled?: boolean;
  isRescheduled?: boolean;
  previousScheduledAt?: Date;
}

/**
 * Interface para el evento scheduled-post.cancelled
 */
interface ScheduledPostCancelledEvent {
  scheduledPostId: string;
  reason?: string;
}

/**
 * 👂 Scheduled Post Event Listener
 *
 * FASE 5: BullMQ Queue + Processors
 *
 * Escucha eventos del sistema y agrega jobs a la queue de BullMQ:
 *
 * EVENTOS:
 * 1. scheduled-post.created: Agrega job a queue con delay hasta scheduledAt
 * 2. scheduled-post.cancelled: Remueve job de la queue
 *
 * CONFIGURACIÓN DE JOBS:
 * - delay: Milisegundos hasta scheduledAt
 * - attempts: 3 reintentos
 * - backoff: Exponencial (2min, 4min, 8min)
 * - removeOnComplete: false (mantener historial)
 * - removeOnFail: false (mantener errores para debugging)
 */
@Injectable()
export class ScheduledPostListener {
  private readonly logger = new Logger(ScheduledPostListener.name);

  constructor(
    @InjectQueue('scheduled-posts')
    private scheduledPostsQueue: Queue,
  ) {
    this.logger.log('👂 Scheduled Post Event Listener initialized');
  }

  /**
   * 📅 Maneja evento de post programado creado
   *
   * Agrega job a BullMQ con delay calculado hasta scheduledAt
   *
   * @param event - Datos del evento
   */
  @OnEvent('scheduled-post.created')
  async handleScheduledPostCreated(
    event: ScheduledPostCreatedEvent,
  ): Promise<void> {
    this.logger.log(
      `📅 Evento recibido: scheduled-post.created - Post ${event.scheduledPostId} (${event.platform})`,
    );

    // Calcular delay hasta scheduledAt
    const scheduledAt = new Date(event.scheduledAt);
    const now = new Date();
    const delayMs = scheduledAt.getTime() - now.getTime();

    // Validar que el delay sea positivo
    if (delayMs < 0) {
      this.logger.warn(
        `⚠️ scheduledAt está en el pasado (${scheduledAt.toISOString()}). Publicando inmediatamente.`,
      );
    }

    const effectiveDelay = Math.max(0, delayMs);

    this.logger.log(
      `⏰ Programando job para ${scheduledAt.toISOString()} (delay: ${this.formatDelay(effectiveDelay)})`,
    );

    // Agregar job a queue con configuración de retry
    const job = await this.scheduledPostsQueue.add(
      'publish-post',
      {
        scheduledPostId: event.scheduledPostId,
        scheduledAt: event.scheduledAt,
        platform: event.platform,
        contentType: event.contentType,
        isRecycled: event.isRecycled,
      },
      {
        delay: effectiveDelay,
        attempts: 3, // 3 intentos totales
        backoff: {
          type: 'exponential',
          delay: 2 * 60 * 1000, // Primer retry: +2 minutos, segundo: +4 minutos
        },
        removeOnComplete: false, // Mantener historial de jobs completados
        removeOnFail: false, // Mantener jobs fallidos para debugging
        jobId: `post-${event.scheduledPostId}`, // ID único para poder cancelar/buscar
      },
    );

    this.logger.log(
      `✅ Job agregado a queue: ${job.id} - Se ejecutará ${event.isRescheduled ? '(REPROGRAMADO)' : ''}`,
    );
  }

  /**
   * ❌ Maneja evento de post programado cancelado
   *
   * Remueve job de la queue si aún no se ha ejecutado
   *
   * @param event - Datos del evento
   */
  @OnEvent('scheduled-post.cancelled')
  async handleScheduledPostCancelled(
    event: ScheduledPostCancelledEvent,
  ): Promise<void> {
    this.logger.log(
      `❌ Evento recibido: scheduled-post.cancelled - Post ${event.scheduledPostId}`,
    );

    const jobId = `post-${event.scheduledPostId}`;

    try {
      // Buscar job en queue
      const job = await this.scheduledPostsQueue.getJob(jobId);

      if (!job) {
        this.logger.warn(`⚠️ Job ${jobId} no encontrado en queue (puede que ya se ejecutó)`);
        return;
      }

      // Verificar estado del job
      const state = await job.getState();

      if (state === 'completed') {
        this.logger.warn(`⚠️ Job ${jobId} ya fue completado. No se puede cancelar.`);
        return;
      }

      if (state === 'active') {
        this.logger.warn(`⚠️ Job ${jobId} está en ejecución. No se puede cancelar.`);
        return;
      }

      // Remover job de la queue
      await job.remove();

      this.logger.log(
        `✅ Job ${jobId} removido de queue. Razón: ${event.reason || 'No especificada'}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Error al cancelar job ${jobId}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * 📊 Formatea delay en formato legible
   *
   * @param delayMs - Delay en milisegundos
   * @returns String formateado
   */
  private formatDelay(delayMs: number): string {
    const seconds = Math.floor(delayMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }
}
