import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NewsWebsiteConfig, NewsWebsiteConfigDocument } from '../schemas/news-website-config.schema';
import { UrlExtractionService } from './url-extraction.service';

/**
 * 📅 Smart Extraction Scheduler Service
 *
 * PROPÓSITO:
 * - Scheduling inteligente de extracción de URLs
 * - Considera última extracción al levantar servidor
 * - Programa próxima ejecución basándose en frecuencia configurada
 * - Actualiza timestamps solo después de ejecución exitosa
 *
 * FUNCIONAMIENTO:
 * 1. OnModuleInit: Calcula próximas ejecuciones para todos los sitios activos
 * 2. Programa timeouts dinámicos para cada sitio
 * 3. Después de cada extracción, re-programa la siguiente
 *
 * EJEMPLO:
 * - lastExtractionRun: 14:00
 * - extractionFrequency: 60 minutos
 * - Servidor arranca: 14:45
 * - Próxima ejecución: 15:00 (15 minutos de delay)
 */
@Injectable()
export class SmartExtractionSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SmartExtractionSchedulerService.name);
  private readonly scheduledTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    @InjectModel(NewsWebsiteConfig.name)
    private websiteModel: Model<NewsWebsiteConfigDocument>,
    private urlExtractionService: UrlExtractionService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * 🚀 Inicializa scheduling al levantar el servidor
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('🚀 Inicializando Smart Extraction Scheduler...');

    try {
      const activeWebsites = await this.websiteModel.find({ isActive: true });

      if (activeWebsites.length === 0) {
        this.logger.warn('⚠️ No hay sitios activos configurados');
        return;
      }

      for (const website of activeWebsites) {
        await this.scheduleWebsiteExtraction(website);
      }

      this.logger.log(
        `✅ Scheduler iniciado con ${activeWebsites.length} sitios activos`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Error inicializando scheduler: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * 📅 Programa extracción para un sitio específico
   *
   * LÓGICA:
   * 1. Calcula cuándo DEBERÍA ejecutar próxima extracción
   * 2. Si ya pasó la hora, ejecuta INMEDIATAMENTE
   * 3. Si no, programa para la hora calculada
   */
  async scheduleWebsiteExtraction(
    website: NewsWebsiteConfigDocument,
  ): Promise<void> {
    const websiteId = String(website._id);
    const now = Date.now();

    // Calcular próxima ejecución
    const nextExecutionTime = this.calculateNextExecution(
      website.lastExtractionRun,
      website.extractionFrequency,
    );

    const delayMs = nextExecutionTime.getTime() - now;

    this.logger.log(
      `📅 Programando extracción para "${website.name}":`,
    );
    this.logger.log(
      `   - Última extracción: ${website.lastExtractionRun ? website.lastExtractionRun.toISOString() : 'NUNCA'}`,
    );
    this.logger.log(
      `   - Frecuencia: ${website.extractionFrequency} minutos`,
    );
    this.logger.log(
      `   - Próxima ejecución calculada: ${nextExecutionTime.toISOString()}`,
    );
    this.logger.log(
      `   - Delay: ${Math.floor(delayMs / 1000)} segundos`,
    );

    // Si ya debió ejecutarse, ejecutar INMEDIATAMENTE
    if (delayMs <= 0) {
      this.logger.log(
        `⚡ Extracción de "${website.name}" ya debió ejecutarse, ejecutando AHORA`,
      );
      await this.executeExtraction(websiteId);
      return;
    }

    // Programar para la hora calculada
    this.scheduleOneTimeExecution(websiteId, delayMs);
  }

  /**
   * ⏰ Programa una ejecución única después de X ms
   *
   * Después de ejecutar, re-programa la siguiente
   */
  private scheduleOneTimeExecution(
    websiteId: string,
    delayMs: number,
  ): void {
    // Limpiar timeout anterior si existe
    this.cancelScheduledJob(websiteId);

    // Programar timeout
    const timeout = setTimeout(async () => {
      await this.executeExtraction(websiteId);
    }, delayMs);

    // Guardar referencia para poder cancelar
    this.scheduledTimeouts.set(websiteId, timeout);

    this.logger.log(
      `✅ Programada extracción para ${websiteId} en ${Math.floor(delayMs / 1000)} segundos`,
    );
  }

  /**
   * 🔍 Ejecuta extracción y re-programa siguiente
   */
  private async executeExtraction(websiteId: string): Promise<void> {
    this.logger.log(`🔍 Ejecutando extracción para sitio: ${websiteId}`);

    try {
      // Ejecutar extracción
      const result = await this.urlExtractionService.extractUrls(
        new Types.ObjectId(websiteId),
      );

      if (result.success) {
        // ✅ CRÍTICO: Solo actualizar timestamp DESPUÉS de ejecución exitosa
        await this.websiteModel.findByIdAndUpdate(websiteId, {
          lastExtractionRun: new Date(),
          $inc: {
            'statistics.successfulExtractions': 1,
            'statistics.totalUrlsExtracted': result.totalUrlsFound,
          },
        });

        this.logger.log(
          `✅ Extracción exitosa para ${websiteId}: ${result.newUrls} URLs nuevas`,
        );
      } else {
        // Error: NO actualizar timestamp, intentar de nuevo en próxima ejecución
        this.logger.error(
          `❌ Extracción falló para ${websiteId}: ${result.error}`,
        );

        await this.websiteModel.findByIdAndUpdate(websiteId, {
          $inc: { 'statistics.failedExtractions': 1 },
        });
      }

      // Re-programar siguiente extracción
      const website = await this.websiteModel.findById(websiteId);
      if (website && website.isActive) {
        await this.scheduleWebsiteExtraction(website);
      }

      // Emitir evento
      this.eventEmitter.emit('url-extraction.completed', {
        websiteId,
        success: result.success,
        newUrls: result.newUrls,
        totalUrls: result.totalUrlsFound,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(
        `❌ Error ejecutando extracción para ${websiteId}: ${error.message}`,
        error.stack,
      );

      // Re-programar de todos modos
      const website = await this.websiteModel.findById(websiteId);
      if (website && website.isActive) {
        await this.scheduleWebsiteExtraction(website);
      }
    }
  }

  /**
   * 🧮 Calcula próxima ejecución basándose en última y frecuencia
   *
   * LÓGICA:
   * - Si nunca se ha ejecutado: AHORA
   * - Si ya se ejecutó: lastRun + frequencyMinutes
   */
  private calculateNextExecution(
    lastRun: Date | undefined,
    frequencyMinutes: number,
  ): Date {
    if (!lastRun) {
      // Nunca se ha ejecutado, ejecutar ahora
      return new Date();
    }

    // Calcular próxima ejecución
    const nextRun = new Date(
      lastRun.getTime() + frequencyMinutes * 60 * 1000,
    );

    return nextRun;
  }

  /**
   * ❌ Cancela job programado para un sitio
   */
  private cancelScheduledJob(websiteId: string): void {
    const existingTimeout = this.scheduledTimeouts.get(websiteId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.scheduledTimeouts.delete(websiteId);
      this.logger.debug(`Cancelado timeout anterior para ${websiteId}`);
    }
  }

  /**
   * 🔄 Re-programa extracción para un sitio (útil para cambios de config)
   */
  async rescheduleWebsite(websiteId: string): Promise<void> {
    this.cancelScheduledJob(websiteId);

    const website = await this.websiteModel.findById(websiteId);
    if (!website) {
      throw new Error(`Website ${websiteId} not found`);
    }

    if (!website.isActive) {
      this.logger.log(`Sitio ${websiteId} está inactivo, no se programa`);
      return;
    }

    await this.scheduleWebsiteExtraction(website);
  }

  /**
   * ⏸️ Pausa extracción para un sitio
   */
  async pauseWebsite(websiteId: string): Promise<void> {
    this.cancelScheduledJob(websiteId);
    await this.websiteModel.findByIdAndUpdate(websiteId, {
      isActive: false,
    });
    this.logger.log(`⏸️ Extracción pausada para ${websiteId}`);
  }

  /**
   * ▶️ Reanuda extracción para un sitio
   */
  async resumeWebsite(websiteId: string): Promise<void> {
    const website = await this.websiteModel.findByIdAndUpdate(
      websiteId,
      { isActive: true },
      { new: true },
    );

    if (!website) {
      throw new Error(`Website ${websiteId} not found`);
    }

    await this.scheduleWebsiteExtraction(website);
    this.logger.log(`▶️ Extracción reanudada para ${websiteId}`);
  }

  /**
   * 🔍 Obtiene estado de scheduling para un sitio
   */
  async getSchedulingStatus(websiteId: string): Promise<{
    isScheduled: boolean;
    nextExecution: Date | null;
    lastExecution: Date | null;
    frequency: number;
  }> {
    const website = await this.websiteModel.findById(websiteId);
    if (!website) {
      throw new Error(`Website ${websiteId} not found`);
    }

    const isScheduled = this.scheduledTimeouts.has(websiteId) && website.isActive;
    const nextExecution = isScheduled
      ? this.calculateNextExecution(
          website.lastExtractionRun,
          website.extractionFrequency,
        )
      : null;

    return {
      isScheduled,
      nextExecution,
      lastExecution: website.lastExtractionRun || null,
      frequency: website.extractionFrequency,
    };
  }

  /**
   * 🔥 Forzar extracción inmediata (manual trigger)
   */
  async triggerImmediateExtraction(websiteId: string): Promise<void> {
    this.logger.log(`🔥 Forzando extracción inmediata para ${websiteId}`);

    // Cancelar scheduling programado
    this.cancelScheduledJob(websiteId);

    // Ejecutar inmediatamente
    await this.executeExtraction(websiteId);
  }
}
