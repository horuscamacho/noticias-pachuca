import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { NewsWebsiteConfig, NewsWebsiteConfigDocument } from '../schemas/news-website-config.schema';
import { FacebookPublishingConfig, FacebookPublishingConfigDocument } from '../schemas/facebook-publishing-config.schema';
import { GeneratorProJob, GeneratorProJobDocument } from '../schemas/generator-pro-job.schema';
import { FacebookPost, FacebookPostDocument } from '../schemas/facebook-post.schema';

import { GeneratorProQueueService } from './generator-pro-queue.service';
import { NewsWebsiteService } from './news-website.service';
import { FacebookPublishingService } from './facebook-publishing.service';

/**
 * 🤖 Servicio Orquestador del Sistema Generator Pro
 * Coordina todo el flujo: extracción → generación → publicación
 * Maneja scheduling, monitoreo y control del sistema completo
 */

interface SystemStatus {
  isRunning: boolean;
  activeWebsites: number;
  totalJobs: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  performance: {
    avgExtractionTime: number;
    avgGenerationTime: number;
    avgPublishingTime: number;
    successRate: number;
  };
  lastActivity: Date;
}

interface CycleResult {
  websiteId: string;
  cycleType: string;
  success: boolean;
  jobsCreated: number;
  duration: number;
  error?: string;
}

@Injectable()
export class GeneratorProOrchestratorService {
  private readonly logger = new Logger(GeneratorProOrchestratorService.name);
  private isSystemRunning = false;
  private cycleIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    @InjectModel(NewsWebsiteConfig.name)
    private readonly websiteConfigModel: Model<NewsWebsiteConfigDocument>,
    @InjectModel(FacebookPublishingConfig.name)
    private readonly facebookConfigModel: Model<FacebookPublishingConfigDocument>,
    @InjectModel(GeneratorProJob.name)
    private readonly jobModel: Model<GeneratorProJobDocument>,
    @InjectModel(FacebookPost.name)
    private readonly facebookPostModel: Model<FacebookPostDocument>,
    private readonly queueService: GeneratorProQueueService,
    private readonly websiteService: NewsWebsiteService,
    private readonly facebookService: FacebookPublishingService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.log('🤖 Generator Pro Orchestrator initialized');
  }

  /**
   * 🚀 INICIALIZAR SISTEMA COMPLETO
   */
  async initializeSystem(): Promise<{ message: string; activeWebsites: number }> {
    this.logger.log('🚀 Initializing Generator Pro system...');

    try {
      // Obtener todas las configuraciones activas
      const activeWebsites = await this.websiteConfigModel.find({ isActive: true });

      if (activeWebsites.length === 0) {
        throw new Error('No active website configurations found');
      }

      // Inicializar ciclos para cada sitio web
      for (const website of activeWebsites) {
        await this.initializeWebsiteCycles(website);
      }

      this.isSystemRunning = true;

      this.eventEmitter.emit('generator-pro.system.started', {
        activeWebsites: activeWebsites.length,
        timestamp: new Date(),
      });

      this.logger.log(`✅ System initialized with ${activeWebsites.length} active websites`);

      return {
        message: 'Generator Pro system initialized successfully',
        activeWebsites: activeWebsites.length,
      };

    } catch (error) {
      this.logger.error(`❌ Failed to initialize system: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🛑 DETENER SISTEMA COMPLETO
   */
  async stopSystem(): Promise<{ message: string }> {
    this.logger.log('🛑 Stopping Generator Pro system...');

    // Limpiar todos los intervalos
    for (const [websiteId, interval] of this.cycleIntervals.entries()) {
      clearInterval(interval);
      this.logger.log(`Stopped cycles for website: ${websiteId}`);
    }

    this.cycleIntervals.clear();
    this.isSystemRunning = false;

    this.eventEmitter.emit('generator-pro.system.stopped', {
      timestamp: new Date(),
    });

    this.logger.log('✅ System stopped successfully');

    return {
      message: 'Generator Pro system stopped successfully',
    };
  }

  /**
   * 🔄 INICIALIZAR CICLOS PARA UN SITIO WEB
   *
   * ⚠️ NOTA: El ciclo de extracción de URLs ha sido reemplazado por SmartExtractionSchedulerService
   * Este método ahora solo inicializa ciclos de generación y publicación.
   *
   * Migración:
   * - SmartExtractionSchedulerService maneja extracción con OnModuleInit
   * - Considera última extracción al programar próxima ejecución
   * - No usa setInterval, usa setTimeout dinámico
   */
  private async initializeWebsiteCycles(website: NewsWebsiteConfigDocument): Promise<void> {
    const websiteId = (website._id as Types.ObjectId).toString();

    this.logger.log(`🔄 Initializing cycles for website: ${website.name}`);
    this.logger.warn(`⚠️ Extraction cycle is now handled by SmartExtractionSchedulerService`);

    // Limpiar ciclos existentes si los hay
    const existingInterval = this.cycleIntervals.get(websiteId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // ⚠️ DEPRECATED: Ciclo de extracción de URLs
    // Ahora manejado por SmartExtractionSchedulerService
    // El siguiente código está comentado intencionalmente:
    /*
    const extractionInterval = setInterval(async () => {
      if (this.isSystemRunning) {
        await this.runExtractionCycle(websiteId);
      }
    }, website.extractionFrequency * 60 * 1000);
    this.cycleIntervals.set(`${websiteId}-extraction`, extractionInterval);
    */

    // Configurar ciclo de generación de contenido
    const generationInterval = setInterval(async () => {
      if (this.isSystemRunning) {
        await this.runGenerationCycle(websiteId);
      }
    }, website.contentGenerationFrequency * 60 * 1000);

    // Configurar ciclo de publicación
    const publishingInterval = setInterval(async () => {
      if (this.isSystemRunning) {
        await this.runPublishingCycle(websiteId);
      }
    }, website.publishingFrequency * 60 * 1000);

    // Guardar referencias a los intervalos
    // this.cycleIntervals.set(`${websiteId}-extraction`, extractionInterval); // DEPRECATED
    this.cycleIntervals.set(`${websiteId}-generation`, generationInterval);
    this.cycleIntervals.set(`${websiteId}-publishing`, publishingInterval);

    this.logger.log(`✅ Cycles initialized for website: ${website.name} (generation & publishing only)`);
  }

  /**
   * 🔍 EJECUTAR CICLO DE EXTRACCIÓN DE URLs
   *
   * ⚠️ DEPRECATED: Este método aún funciona pero se recomienda usar SmartExtractionSchedulerService
   * @deprecated Usar SmartExtractionSchedulerService.triggerImmediateExtraction() en su lugar
   */
  async runExtractionCycle(websiteId: string): Promise<CycleResult> {
    const startTime = Date.now();

    this.logger.warn(`⚠️ DEPRECATED: runExtractionCycle() - Usar SmartExtractionSchedulerService`);
    this.logger.log(`🔍 Starting URL extraction cycle for website: ${websiteId}`);

    try {
      const website = await this.websiteConfigModel.findById(websiteId);
      if (!website || !website.isActive) {
        throw new Error(`Website ${websiteId} not found or not active`);
      }

      // Extraer URLs del sitio web
      const extractedUrls = await this.websiteService.extractNewsUrls(new Types.ObjectId(websiteId));

      if (extractedUrls.length === 0) {
        this.logger.log(`No new URLs found for website: ${website.name}`);
        return {
          websiteId,
          cycleType: 'extraction',
          success: true,
          jobsCreated: 0,
          duration: Date.now() - startTime,
        };
      }

      // Crear jobs de extracción de contenido
      let jobsCreated = 0;
      for (const url of extractedUrls) {
        const job = await this.queueService.addExtractionJob({
          type: 'extract_content',
          websiteConfigId: websiteId,
          data: {
            targetUrl: url,
            selectors: website.contentSelectors,
          },
          priority: 5,
        });

        if (job) {
          jobsCreated++;
        }
      }

      // Actualizar timestamp de última extracción
      await this.websiteConfigModel.findByIdAndUpdate(websiteId, {
        lastExtractionRun: new Date(),
      });

      const result: CycleResult = {
        websiteId,
        cycleType: 'extraction',
        success: true,
        jobsCreated,
        duration: Date.now() - startTime,
      };

      this.eventEmitter.emit('generator-pro.extraction.completed', result);

      this.logger.log(`✅ URL extraction completed for ${website.name}: ${jobsCreated} jobs created`);

      return result;

    } catch (error) {
      const result: CycleResult = {
        websiteId,
        cycleType: 'extraction',
        success: false,
        jobsCreated: 0,
        duration: Date.now() - startTime,
        error: error.message,
      };

      this.eventEmitter.emit('generator-pro.extraction.failed', result);

      this.logger.error(`❌ URL extraction failed for website ${websiteId}: ${error.message}`);

      return result;
    }
  }

  /**
   * 🤖 EJECUTAR CICLO DE GENERACIÓN DE CONTENIDO
   */
  async runGenerationCycle(websiteId: string): Promise<CycleResult> {
    const startTime = Date.now();

    this.logger.log(`🤖 Starting content generation cycle for website: ${websiteId}`);

    try {
      const website = await this.websiteConfigModel.findById(websiteId);
      if (!website || !website.isActive) {
        throw new Error(`Website ${websiteId} not found or not active`);
      }

      // Obtener noticias extraídas pendientes de generación
      const pendingNoticias = await this.getPendingNoticiasForGeneration(websiteId);

      if (pendingNoticias.length === 0) {
        this.logger.log(`No pending noticias for generation: ${website.name}`);
        return {
          websiteId,
          cycleType: 'generation',
          success: true,
          jobsCreated: 0,
          duration: Date.now() - startTime,
        };
      }

      // Crear jobs de generación de contenido
      let jobsCreated = 0;
      for (const noticia of pendingNoticias) {
        const job = await this.queueService.addGenerationJob({
          type: 'generate_content',
          websiteConfigId: websiteId,
          relatedEntityId: noticia._id,
          data: {
            originalContentId: noticia._id,
            templateId: website.defaultTemplateId,
            generationSettings: website.contentSettings,
          },
          priority: 4, // Higher priority than extraction
        });

        if (job) {
          jobsCreated++;
        }
      }

      // Actualizar timestamp de última generación
      await this.websiteConfigModel.findByIdAndUpdate(websiteId, {
        lastGenerationRun: new Date(),
      });

      const result: CycleResult = {
        websiteId,
        cycleType: 'generation',
        success: true,
        jobsCreated,
        duration: Date.now() - startTime,
      };

      this.eventEmitter.emit('generator-pro.generation.completed', result);

      this.logger.log(`✅ Content generation completed for ${website.name}: ${jobsCreated} jobs created`);

      return result;

    } catch (error) {
      const result: CycleResult = {
        websiteId,
        cycleType: 'generation',
        success: false,
        jobsCreated: 0,
        duration: Date.now() - startTime,
        error: error.message,
      };

      this.eventEmitter.emit('generator-pro.generation.failed', result);

      this.logger.error(`❌ Content generation failed for website ${websiteId}: ${error.message}`);

      return result;
    }
  }

  /**
   * 📱 EJECUTAR CICLO DE PUBLICACIÓN EN FACEBOOK
   */
  async runPublishingCycle(websiteId: string): Promise<CycleResult> {
    const startTime = Date.now();

    this.logger.log(`📱 Starting Facebook publishing cycle for website: ${websiteId}`);

    try {
      // Obtener configuración de Facebook para este sitio
      const facebookConfig = await this.facebookConfigModel.findOne({
        websiteConfigId: websiteId,
        isActive: true,
      });

      if (!facebookConfig) {
        throw new Error(`No active Facebook configuration found for website ${websiteId}`);
      }

      // Verificar límites diarios
      if (!facebookConfig.canPublishToday) {
        this.logger.log(`Daily posting limit reached for Facebook config: ${facebookConfig.name}`);
        return {
          websiteId,
          cycleType: 'publishing',
          success: true,
          jobsCreated: 0,
          duration: Date.now() - startTime,
        };
      }

      // Obtener contenido listo para publicar
      const readyContent = await this.getContentReadyForPublishing(websiteId);

      if (readyContent.length === 0) {
        this.logger.log(`No content ready for publishing: ${facebookConfig.name}`);
        return {
          websiteId,
          cycleType: 'publishing',
          success: true,
          jobsCreated: 0,
          duration: Date.now() - startTime,
        };
      }

      // Determinar cuántos posts podemos publicar
      const maxPostsToday = facebookConfig.maxPostsPerDay - facebookConfig.postsToday;
      const contentToPublish = readyContent.slice(0, Math.min(1, maxPostsToday)); // Solo 1 por ciclo

      // Crear jobs de publicación
      let jobsCreated = 0;
      for (const content of contentToPublish) {
        const job = await this.queueService.addPublishingJob({
          type: 'publish_facebook',
          websiteConfigId: websiteId,
          facebookConfigId: facebookConfig._id as Types.ObjectId,
          relatedEntityId: content._id,
          data: {
            generatedContentId: content._id,
            postContent: await this.facebookService.optimizeContentForFacebook(content),
            scheduledAt: new Date(),
          },
          priority: 3, // Highest priority
        });

        if (job) {
          jobsCreated++;
        }
      }

      // Actualizar timestamp de última publicación
      await this.websiteConfigModel.findByIdAndUpdate(websiteId, {
        lastPublishingRun: new Date(),
      });

      const result: CycleResult = {
        websiteId,
        cycleType: 'publishing',
        success: true,
        jobsCreated,
        duration: Date.now() - startTime,
      };

      this.eventEmitter.emit('generator-pro.publishing.completed', result);

      this.logger.log(`✅ Facebook publishing completed for website ${websiteId}: ${jobsCreated} jobs created`);

      return result;

    } catch (error) {
      const result: CycleResult = {
        websiteId,
        cycleType: 'publishing',
        success: false,
        jobsCreated: 0,
        duration: Date.now() - startTime,
        error: error.message,
      };

      this.eventEmitter.emit('generator-pro.publishing.failed', result);

      this.logger.error(`❌ Facebook publishing failed for website ${websiteId}: ${error.message}`);

      return result;
    }
  }

  /**
   * 📊 OBTENER ESTADO GENERAL DEL SISTEMA
   */
  async getSystemStatus(): Promise<SystemStatus> {
    try {
      const [activeWebsites, jobStats, performanceStats] = await Promise.all([
        this.websiteConfigModel.countDocuments({ isActive: true }),
        this.getJobStatistics(),
        this.getPerformanceStatistics(),
      ]);

      const status: SystemStatus = {
        isRunning: this.isSystemRunning,
        activeWebsites,
        totalJobs: jobStats,
        performance: performanceStats,
        lastActivity: await this.getLastActivityTime(),
      };

      return status;

    } catch (error) {
      this.logger.error(`Failed to get system status: ${error.message}`);
      throw error;
    }
  }

  /**
   * ⏸️ PAUSAR SITIO WEB ESPECÍFICO
   */
  async pauseWebsite(websiteId: string): Promise<{ message: string }> {
    this.logger.log(`⏸️ Pausing website: ${websiteId}`);

    // Limpiar intervalos específicos del sitio
    const extractionKey = `${websiteId}-extraction`;
    const generationKey = `${websiteId}-generation`;
    const publishingKey = `${websiteId}-publishing`;

    [extractionKey, generationKey, publishingKey].forEach(key => {
      const interval = this.cycleIntervals.get(key);
      if (interval) {
        clearInterval(interval);
        this.cycleIntervals.delete(key);
      }
    });

    // Marcar como inactivo en BD
    await this.websiteConfigModel.findByIdAndUpdate(websiteId, {
      isActive: false,
    });

    this.eventEmitter.emit('generator-pro.website.paused', {
      websiteId,
      timestamp: new Date(),
    });

    return {
      message: `Website ${websiteId} paused successfully`,
    };
  }

  /**
   * ▶️ REANUDAR SITIO WEB ESPECÍFICO
   */
  async resumeWebsite(websiteId: string): Promise<{ message: string }> {
    this.logger.log(`▶️ Resuming website: ${websiteId}`);

    const website = await this.websiteConfigModel.findByIdAndUpdate(
      websiteId,
      { isActive: true },
      { new: true }
    );

    if (!website) {
      throw new Error(`Website ${websiteId} not found`);
    }

    // Reinicializar ciclos
    await this.initializeWebsiteCycles(website);

    this.eventEmitter.emit('generator-pro.website.resumed', {
      websiteId,
      timestamp: new Date(),
    });

    return {
      message: `Website ${websiteId} resumed successfully`,
    };
  }

  /**
   * 🔍 MÉTODOS AUXILIARES PRIVADOS
   */

  private async getPendingNoticiasForGeneration(websiteId: string): Promise<any[]> {
    // TODO: Implementar lógica para obtener noticias pendientes de generación
    // Placeholder que retorna array vacío
    return [];
  }

  private async getContentReadyForPublishing(websiteId: string): Promise<any[]> {
    // TODO: Implementar lógica para obtener contenido listo para publicar
    // Placeholder que retorna array vacío
    return [];
  }

  private async getJobStatistics(): Promise<SystemStatus['totalJobs']> {
    const [pending, processing, completed, failed] = await Promise.all([
      this.jobModel.countDocuments({ status: 'pending' }),
      this.jobModel.countDocuments({ status: 'processing' }),
      this.jobModel.countDocuments({ status: 'completed' }),
      this.jobModel.countDocuments({ status: 'failed' }),
    ]);

    return { pending, processing, completed, failed };
  }

  private async getPerformanceStatistics(): Promise<SystemStatus['performance']> {
    // TODO: Implementar cálculo de métricas de performance reales
    return {
      avgExtractionTime: 0,
      avgGenerationTime: 0,
      avgPublishingTime: 0,
      successRate: 0,
    };
  }

  private async getLastActivityTime(): Promise<Date> {
    const lastJob = await this.jobModel.findOne({}, { createdAt: 1 })
      .sort({ createdAt: -1 });

    return lastJob?.createdAt || new Date();
  }
}