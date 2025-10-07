import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PublishingQueue, PublishingQueueDocument } from '../schemas/publishing-queue.schema';

/**
 * 📅 Servicio para calcular scheduling inteligente de publicaciones
 * Implementa algoritmo dinámico de intervalos basado en tamaño de cola
 */
@Injectable()
export class PublishSchedulerService {
  private readonly logger = new Logger(PublishSchedulerService.name);

  // Configuración de intervalos en milisegundos
  private readonly INTERVALS = {
    SMALL_QUEUE: { min: 30 * 60 * 1000, max: 45 * 60 * 1000 }, // 30-45 min (< 10 items)
    MEDIUM_QUEUE: { min: 15 * 60 * 1000, max: 25 * 60 * 1000 }, // 15-25 min (10-50 items)
    LARGE_QUEUE: { min: 8 * 60 * 1000, max: 12 * 60 * 1000 }, // 8-12 min (50-100 items)
    HUGE_QUEUE: { min: 5 * 60 * 1000, max: 8 * 60 * 1000 }, // 5-8 min (> 100 items)
  };

  // Multiplicadores de prioridad
  private readonly PRIORITY_MULTIPLIERS = {
    HIGH: 0.7, // News - 30% más rápido
    NORMAL: 1.0, // Blog - velocidad normal
  };

  // Factor de randomización ±15%
  private readonly RANDOMIZATION_MIN = 0.85;
  private readonly RANDOMIZATION_MAX = 1.15;

  // Horarios (24h format)
  private readonly PEAK_HOURS = { start: 8, end: 22 }; // 8am - 10pm
  private readonly VALLEY_HOURS = { start: 22, end: 8 }; // 10pm - 8am

  constructor(
    @InjectModel(PublishingQueue.name)
    private publishingQueueModel: Model<PublishingQueueDocument>,
  ) {}

  /**
   * 🧮 Calcula el próximo slot de publicación basado en prioridad
   *
   * @param priority - 10 (breaking), 8 (news), 3 (blog)
   * @param manualScheduleAt - Fecha manual (override del algoritmo)
   * @returns Fecha calculada + metadata del cálculo
   */
  async calculateNextPublishSlot(
    priority: number,
    manualScheduleAt?: Date,
  ): Promise<{
    scheduledAt: Date;
    metadata: {
      queueSizeAtScheduling: number;
      queuePositionAtScheduling: number;
      baseIntervalMs: number;
      priorityMultiplier: number;
      randomizationFactor: number;
      finalIntervalMs: number;
      timeWindow: 'peak' | 'valley' | 'normal';
      adjustedForTimeWindow: boolean;
      originalScheduledAt?: Date;
    };
  }> {
    // Si hay fecha manual, usarla directamente
    if (manualScheduleAt) {
      return {
        scheduledAt: manualScheduleAt,
        metadata: {
          queueSizeAtScheduling: 0,
          queuePositionAtScheduling: 0,
          baseIntervalMs: 0,
          priorityMultiplier: 1,
          randomizationFactor: 1,
          finalIntervalMs: 0,
          timeWindow: 'normal',
          adjustedForTimeWindow: false,
        },
      };
    }

    // 1️⃣ Obtener tamaño actual de cola (solo queued y processing)
    const queueSize = await this.publishingQueueModel.countDocuments({
      status: { $in: ['queued', 'processing'] },
    });

    // 2️⃣ Obtener última publicación programada para calcular siguiente slot
    const lastScheduled = await this.publishingQueueModel
      .findOne({
        status: { $in: ['queued', 'processing'] },
      })
      .sort({ scheduledPublishAt: -1 })
      .exec();

    // Base time: si hay cola, partir desde la última programada, sino desde ahora
    const baseTime = lastScheduled?.scheduledPublishAt
      ? new Date(lastScheduled.scheduledPublishAt)
      : new Date();

    // 3️⃣ Calcular intervalo base según tamaño de cola
    const baseInterval = this.calculateBaseInterval(queueSize);

    // 4️⃣ Aplicar multiplicador de prioridad
    const priorityMultiplier = priority >= 8
      ? this.PRIORITY_MULTIPLIERS.HIGH
      : this.PRIORITY_MULTIPLIERS.NORMAL;

    // 5️⃣ Aplicar randomización ±15%
    const randomizationFactor =
      this.RANDOMIZATION_MIN +
      Math.random() * (this.RANDOMIZATION_MAX - this.RANDOMIZATION_MIN);

    // 6️⃣ Calcular intervalo final
    const finalInterval = Math.round(baseInterval * priorityMultiplier * randomizationFactor);

    // 7️⃣ Calcular fecha programada inicial
    const originalScheduledAt = new Date(baseTime.getTime() + finalInterval);

    // 8️⃣ Ajustar por ventana de tiempo (postpone noche → 8am)
    const {
      adjustedDate,
      timeWindow,
      wasAdjusted,
    } = this.adjustForTimeWindow(originalScheduledAt);

    // 9️⃣ Calcular posición en cola
    const queuePosition = queueSize + 1;

    this.logger.log(
      `📅 Calculado slot: ${adjustedDate.toISOString()} | ` +
      `Cola: ${queueSize} | Intervalo: ${Math.round(finalInterval / 60000)}min | ` +
      `Prioridad: ${priority} (${priorityMultiplier}x) | ` +
      `Random: ${randomizationFactor.toFixed(2)} | Window: ${timeWindow}`,
    );

    return {
      scheduledAt: adjustedDate,
      metadata: {
        queueSizeAtScheduling: queueSize,
        queuePositionAtScheduling: queuePosition,
        baseIntervalMs: baseInterval,
        priorityMultiplier,
        randomizationFactor,
        finalIntervalMs: finalInterval,
        timeWindow,
        adjustedForTimeWindow: wasAdjusted,
        originalScheduledAt: wasAdjusted ? originalScheduledAt : undefined,
      },
    };
  }

  /**
   * 🔢 Calcula intervalo base según tamaño de cola
   */
  private calculateBaseInterval(queueSize: number): number {
    if (queueSize < 10) {
      // Cola pequeña: 30-45 min
      return this.randomBetween(
        this.INTERVALS.SMALL_QUEUE.min,
        this.INTERVALS.SMALL_QUEUE.max,
      );
    } else if (queueSize < 50) {
      // Cola mediana: 15-25 min
      return this.randomBetween(
        this.INTERVALS.MEDIUM_QUEUE.min,
        this.INTERVALS.MEDIUM_QUEUE.max,
      );
    } else if (queueSize < 100) {
      // Cola grande: 8-12 min
      return this.randomBetween(
        this.INTERVALS.LARGE_QUEUE.min,
        this.INTERVALS.LARGE_QUEUE.max,
      );
    } else {
      // Cola muy grande: 5-8 min
      return this.randomBetween(
        this.INTERVALS.HUGE_QUEUE.min,
        this.INTERVALS.HUGE_QUEUE.max,
      );
    }
  }

  /**
   * ⏰ Ajusta fecha por ventana de tiempo (postpone publicaciones nocturnas)
   */
  private adjustForTimeWindow(scheduledAt: Date): {
    adjustedDate: Date;
    timeWindow: 'peak' | 'valley' | 'normal';
    wasAdjusted: boolean;
  } {
    const hour = scheduledAt.getHours();

    // Horario pico (8am-10pm): publicar normalmente
    if (hour >= this.PEAK_HOURS.start && hour < this.PEAK_HOURS.end) {
      return {
        adjustedDate: scheduledAt,
        timeWindow: 'peak',
        wasAdjusted: false,
      };
    }

    // Horario valle (10pm-8am): postponer hasta 8am del día siguiente
    if (hour >= this.VALLEY_HOURS.start || hour < this.VALLEY_HOURS.end) {
      const nextMorning = new Date(scheduledAt);

      // Si es después de las 10pm, mover a 8am del día siguiente
      if (hour >= this.VALLEY_HOURS.start) {
        nextMorning.setDate(nextMorning.getDate() + 1);
      }

      // Configurar a las 8am
      nextMorning.setHours(8, 0, 0, 0);

      this.logger.debug(
        `⏰ Ajustado por time window: ${scheduledAt.toISOString()} → ${nextMorning.toISOString()}`,
      );

      return {
        adjustedDate: nextMorning,
        timeWindow: 'valley',
        wasAdjusted: true,
      };
    }

    // Horario normal (cualquier otro caso)
    return {
      adjustedDate: scheduledAt,
      timeWindow: 'normal',
      wasAdjusted: false,
    };
  }

  /**
   * 🎲 Genera número aleatorio entre min y max
   */
  private randomBetween(min: number, max: number): number {
    return Math.round(min + Math.random() * (max - min));
  }

  /**
   * 📊 Obtiene estadísticas de la cola
   */
  async getQueueStats(): Promise<{
    totalQueued: number;
    byPriority: { high: number; normal: number };
    estimatedNextPublish: Date | null;
    averageIntervalMinutes: number;
  }> {
    const queued = await this.publishingQueueModel.countDocuments({
      status: 'queued',
    });

    const highPriority = await this.publishingQueueModel.countDocuments({
      status: 'queued',
      priority: { $gte: 8 },
    });

    const normalPriority = queued - highPriority;

    const nextScheduled = await this.publishingQueueModel
      .findOne({ status: 'queued' })
      .sort({ scheduledPublishAt: 1 })
      .exec();

    // Calcular intervalo promedio de las últimas 10 publicaciones
    const recent = await this.publishingQueueModel
      .find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .limit(10)
      .exec();

    let avgInterval = 30; // default 30 min
    if (recent.length >= 2) {
      const intervals: number[] = [];
      for (let i = 0; i < recent.length - 1; i++) {
        const diff =
          recent[i].publishedAt!.getTime() - recent[i + 1].publishedAt!.getTime();
        intervals.push(diff);
      }
      const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      avgInterval = Math.round(avgMs / 60000);
    }

    return {
      totalQueued: queued,
      byPriority: {
        high: highPriority,
        normal: normalPriority,
      },
      estimatedNextPublish: nextScheduled?.scheduledPublishAt || null,
      averageIntervalMinutes: avgInterval,
    };
  }
}
