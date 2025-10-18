import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NewsWebsiteConfig, NewsWebsiteConfigDocument } from '../schemas/news-website-config.schema';
import { GeneratorProQueueService } from './generator-pro-queue.service';

@Injectable()
export class GeneratorProSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(GeneratorProSchedulerService.name);

  constructor(
    @InjectModel(NewsWebsiteConfig.name)
    private websiteModel: Model<NewsWebsiteConfigDocument>,
    private queueService: GeneratorProQueueService,
    private eventEmitter: EventEmitter2,
  ) {}

  onModuleInit() {
    this.logger.log('GeneratorProScheduler initialized');
  }

  /**
   * ⚠️ DEPRECATED: Este método está siendo reemplazado por SmartExtractionSchedulerService
   *
   * @deprecated Usar SmartExtractionSchedulerService en su lugar
   *
   * Migración:
   * - SmartExtractionSchedulerService maneja scheduling inteligente con OnModuleInit
   * - Considera última extracción al calcular próxima ejecución
   * - Actualiza timestamps solo después de ejecución exitosa
   * - No necesita cron cada 5 minutos
   *
   * Este método será removido en una versión futura.
   * Por ahora está DESHABILITADO para evitar duplicados.
   */
  // @Cron('*/5 * * * *') // DESHABILITADO - Usar SmartExtractionSchedulerService
  async scheduleExtractionJobs() {
    this.logger.warn('⚠️ DEPRECATED: scheduleExtractionJobs() está deprecado. Usar SmartExtractionSchedulerService');
    this.logger.warn('Este método está deshabilitado. El scheduling de extracción ahora se maneja con SmartExtractionSchedulerService');
    return; // Early return para evitar ejecución

    this.logger.debug('Checking websites for URL extraction...');

    try {
      const websites = await this.websiteModel.find({ isActive: true });

      for (const website of websites) {
        if (!website.extractionFrequency) continue;

        const websiteId = String(website._id);

        const nextRun = this.calculateNextRun(
          website.lastExtractionRun,
          website.extractionFrequency,
        );

        if (Date.now() >= nextRun.getTime()) {
          this.logger.log(`Scheduling extraction job for website: ${website.name}`);

          // Programar job de extracción
          await this.queueService.addExtractionJob({
            type: 'extract_urls',
            websiteConfigId: websiteId,
            data: { automated: true },
            priority: 5,
          });

          // Actualizar timestamp
          await this.websiteModel.findByIdAndUpdate(websiteId, {
            lastExtractionRun: new Date(),
          });

          this.eventEmitter.emit('generator-pro.extraction.scheduled', {
            websiteId,
            websiteName: website.name,
            scheduledAt: new Date(),
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error scheduling extraction jobs: ${error.message}`, error.stack);
    }
  }

  /**
   * Revisar cada 10 minutos qué contenidos necesitan generación
   */
  @Cron('*/10 * * * *')
  async scheduleGenerationJobs() {
    this.logger.debug('Checking websites for content generation...');

    try {
      const websites = await this.websiteModel.find({ isActive: true });

      for (const website of websites) {
        if (!website.contentGenerationFrequency) continue;

        const websiteId = String(website._id);

        const nextRun = this.calculateNextRun(
          website.lastGenerationRun,
          website.contentGenerationFrequency,
        );

        if (Date.now() >= nextRun.getTime()) {
          this.logger.log(`Scheduling generation job for website: ${website.name}`);

          // Programar job de generación (procesar contenido extraído no procesado)
          await this.queueService.addGenerationJob({
            type: 'generate_content',
            websiteConfigId: websiteId,
            data: { automated: true },
            priority: 5,
          });

          // Actualizar timestamp
          await this.websiteModel.findByIdAndUpdate(websiteId, {
            lastGenerationRun: new Date(),
          });

          this.eventEmitter.emit('generator-pro.generation.scheduled', {
            websiteId,
            websiteName: website.name,
            scheduledAt: new Date(),
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error scheduling generation jobs: ${error.message}`, error.stack);
    }
  }

  /**
   * Revisar cada 15 minutos qué contenidos necesitan publicación
   */
  @Cron('*/15 * * * *')
  async schedulePublishingJobs() {
    this.logger.debug('Checking websites for content publishing...');

    try {
      const websites = await this.websiteModel.find({ isActive: true });

      for (const website of websites) {
        if (!website.publishingFrequency) continue;

        const websiteId = String(website._id);

        const nextRun = this.calculateNextRun(
          website.lastPublishingRun,
          website.publishingFrequency,
        );

        if (Date.now() >= nextRun.getTime()) {
          this.logger.log(`Scheduling publishing job for website: ${website.name}`);

          // Programar job de publicación
          await this.queueService.addPublishingJob({
            type: 'publish_facebook',
            websiteConfigId: websiteId,
            data: { automated: true },
            priority: 5,
          });

          // Actualizar timestamp
          await this.websiteModel.findByIdAndUpdate(websiteId, {
            lastPublishingRun: new Date(),
          });

          this.eventEmitter.emit('generator-pro.publishing.scheduled', {
            websiteId,
            websiteName: website.name,
            scheduledAt: new Date(),
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error scheduling publishing jobs: ${error.message}`, error.stack);
    }
  }

  /**
   * Calcula próxima ejecución basado en última ejecución + frecuencia
   */
  private calculateNextRun(lastRun: Date | undefined, frequencyMinutes: number): Date {
    if (!lastRun) {
      // Si nunca se ha ejecutado, ejecutar ahora
      return new Date(0);
    }

    const lastRunTime = new Date(lastRun).getTime();
    const intervalMs = frequencyMinutes * 60 * 1000;
    const nextRunTime = lastRunTime + intervalMs;

    return new Date(nextRunTime);
  }

  /**
   * Método manual para forzar schedule (útil para testing)
   */
  async forceSchedule(websiteId: string) {
    const website = await this.websiteModel.findById(websiteId);
    if (!website) {
      throw new Error(`Website not found: ${websiteId}`);
    }

    this.logger.log(`Force scheduling all jobs for website: ${website.name}`);

    // Forzar todos los jobs
    await this.queueService.addExtractionJob({
      type: 'extract_urls',
      websiteConfigId: websiteId,
      data: { automated: false, forced: true },
      priority: 10,
    });

    await this.queueService.addGenerationJob({
      type: 'generate_content',
      websiteConfigId: websiteId,
      data: { automated: false, forced: true },
      priority: 10,
    });

    await this.queueService.addPublishingJob({
      type: 'publish_facebook',
      websiteConfigId: websiteId,
      data: { automated: false, forced: true },
      priority: 10,
    });

    return { success: true, message: 'All jobs scheduled successfully' };
  }
}
