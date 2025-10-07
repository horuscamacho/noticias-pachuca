import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { GeneratorProJob, GeneratorProJobDocument } from '../schemas/generator-pro-job.schema';
import { NewsWebsiteConfig, NewsWebsiteConfigDocument } from '../schemas/news-website-config.schema';
import { ExtractedNoticia, ExtractedNoticiaDocument } from '../../noticias/schemas/extracted-noticia.schema';
import { NewsWebsiteService } from '../services/news-website.service';

/**
 * 🤖 Processor para trabajos de extracción - Generator Pro
 * Maneja extracción de URLs desde listados y extracción de contenido
 * Procesa jobs de las colas: extract_urls, extract_content
 */

interface ExtractionJobData {
  jobId: string;
  type: 'extract_urls' | 'extract_content';
  websiteConfigId: Types.ObjectId;
  data: {
    // Para extract_urls
    listingUrl?: string;
    maxUrls?: number;

    // Para extract_content
    targetUrl?: string;
    selectors?: Record<string, string>;

    // Común
    metadata?: Record<string, unknown>;
    isRetry?: boolean;
    originalJobId?: string;
  };
  priority: number;
}

@Injectable()
@Processor('generator-pro-extraction')
export class ExtractionProcessor {
  private readonly logger = new Logger(ExtractionProcessor.name);

  constructor(
    @InjectModel(GeneratorProJob.name)
    private readonly jobModel: Model<GeneratorProJobDocument>,
    @InjectModel(NewsWebsiteConfig.name)
    private readonly websiteConfigModel: Model<NewsWebsiteConfigDocument>,
    @InjectModel(ExtractedNoticia.name)
    private readonly extractedNoticiaModel: Model<ExtractedNoticiaDocument>,
    private readonly websiteService: NewsWebsiteService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.log('🤖 Extraction Processor initialized');
  }

  /**
   * 🔍 PROCESAR EXTRACCIÓN DE URLs DESDE LISTADOS
   */
  @Process('extract_urls')
  async processUrlExtraction(job: Job<ExtractionJobData>): Promise<{ urlsExtracted: number; message: string }> {
    const startTime = Date.now();
    this.logger.log(`🔍 Processing URL extraction job: ${job.data.jobId}`);

    try {
      // Actualizar job como iniciado
      await this.updateJobStatus(job.data.jobId, 'processing', { startedAt: new Date() });

      // Obtener configuración del sitio web
      const websiteConfig = await this.websiteConfigModel.findById(job.data.websiteConfigId);
      if (!websiteConfig || !websiteConfig.isActive) {
        throw new Error(`Website config ${job.data.websiteConfigId} not found or not active`);
      }

      // Reportar progreso
      job.progress(10);

      // Extraer URLs usando el servicio
      this.logger.log(`Extracting URLs from: ${websiteConfig.listingUrl}`);
      const extractedUrls = await this.websiteService.extractNewsUrls(websiteConfig._id as Types.ObjectId);

      job.progress(70);

      // Filtrar URLs ya procesadas si está configurado
      let finalUrls = extractedUrls;
      if (websiteConfig.extractionSettings?.duplicateFilter !== false) {
        const existingUrls = await this.extractedNoticiaModel.find({
          sourceUrl: { $in: extractedUrls },
        }, { sourceUrl: 1 });

        const existingSet = new Set(existingUrls.map(doc => doc.sourceUrl));
        finalUrls = extractedUrls.filter(url => !existingSet.has(url));
      }

      job.progress(90);

      // Crear registros de noticias pendientes de extracción
      const noticiasToCreate = finalUrls.map(url => ({
        sourceUrl: url,
        domain: new URL(websiteConfig.baseUrl).hostname,
        status: 'pending',
        websiteConfigId: websiteConfig._id,
        discoveredAt: new Date(),
        extractionMetadata: {
          discoveredBy: 'generator-pro',
          jobId: job.data.jobId,
        },
      }));

      if (noticiasToCreate.length > 0) {
        await this.extractedNoticiaModel.insertMany(noticiasToCreate);
      }

      const processingTime = Date.now() - startTime;

      // Actualizar job como completado
      const result = {
        urlsExtracted: finalUrls.length,
        totalUrlsFound: extractedUrls.length,
        duplicatesFiltered: extractedUrls.length - finalUrls.length,
        processingTime,
        websiteName: websiteConfig.name,
      };

      await this.updateJobStatus(job.data.jobId, 'completed', {
        completedAt: new Date(),
        processingTime,
        result,
      });

      // Emitir evento de éxito
      this.eventEmitter.emit('generator-pro.extraction.urls_extracted', {
        jobId: job.data.jobId,
        websiteId: websiteConfig._id,
        websiteName: websiteConfig.name,
        urlsExtracted: finalUrls.length,
        processingTime,
        timestamp: new Date(),
      });

      job.progress(100);

      this.logger.log(`✅ URL extraction completed: ${finalUrls.length} URLs extracted from ${websiteConfig.name}`);

      return {
        urlsExtracted: finalUrls.length,
        message: `Successfully extracted ${finalUrls.length} URLs`,
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;

      this.logger.error(`❌ URL extraction failed for job ${job.data.jobId}: ${error.message}`);

      // Actualizar job como fallido
      await this.updateJobStatus(job.data.jobId, 'failed', {
        error: error.message,
        errorDetails: {
          message: error.message,
          stack: error.stack,
          timestamp: new Date(),
          processingTime,
        },
      });

      // Emitir evento de fallo
      this.eventEmitter.emit('generator-pro.extraction.failed', {
        jobId: job.data.jobId,
        error: error.message,
        processingTime,
        timestamp: new Date(),
      });

      throw error;
    }
  }

  /**
   * 📰 PROCESAR EXTRACCIÓN DE CONTENIDO DE NOTICIA
   */
  @Process('extract_content')
  async processContentExtraction(job: Job<ExtractionJobData>): Promise<{ contentExtracted: boolean; message: string }> {
    const startTime = Date.now();
    this.logger.log(`📰 Processing content extraction job: ${job.data.jobId}`);

    try {
      // Actualizar job como iniciado
      await this.updateJobStatus(job.data.jobId, 'processing', { startedAt: new Date() });

      // Obtener configuración del sitio web
      const websiteConfig = await this.websiteConfigModel.findById(job.data.websiteConfigId);
      if (!websiteConfig || !websiteConfig.isActive) {
        throw new Error(`Website config ${job.data.websiteConfigId} not found or not active`);
      }

      // Validar URL objetivo
      const targetUrl = job.data.data.targetUrl;
      if (!targetUrl) {
        throw new Error('Target URL is required for content extraction');
      }

      job.progress(20);

      // Verificar si ya existe contenido extraído
      let existingNoticia = await this.extractedNoticiaModel.findOne({
        sourceUrl: targetUrl,
      });

      if (existingNoticia && existingNoticia.status === 'extracted' && !job.data.data.isRetry) {
        this.logger.log(`Content already extracted for URL: ${targetUrl}`);

        await this.updateJobStatus(job.data.jobId, 'completed', {
          completedAt: new Date(),
          processingTime: Date.now() - startTime,
          result: {
            contentExtracted: false,
            reason: 'already_extracted',
            existingNoticiaId: existingNoticia._id,
          },
        });

        return {
          contentExtracted: false,
          message: 'Content already extracted',
        };
      }

      job.progress(40);

      // Extraer contenido usando el servicio
      this.logger.log(`Extracting content from: ${targetUrl}`);
      const extractedContent = await this.websiteService.extractNewsContent(targetUrl, websiteConfig._id as Types.ObjectId);

      job.progress(80);

      // Guardar o actualizar noticia extraída
      if (!existingNoticia) {
        existingNoticia = new this.extractedNoticiaModel({
          sourceUrl: targetUrl,
          domain: new URL(websiteConfig.baseUrl).hostname,
          websiteConfigId: websiteConfig._id,
          status: 'pending',
          discoveredAt: new Date(),
        });
      }

      // Actualizar con contenido extraído
      existingNoticia.title = extractedContent.title;
      existingNoticia.content = extractedContent.content;
      existingNoticia.images = extractedContent.images;
      existingNoticia.publishedAt = extractedContent.publishedAt;
      existingNoticia.author = extractedContent.author;
      existingNoticia.category = extractedContent.category;
      existingNoticia.excerpt = extractedContent.excerpt;
      existingNoticia.tags = extractedContent.tags || [];
      existingNoticia.status = 'extracted';
      existingNoticia.extractedAt = new Date();
      existingNoticia.extractionMetadata = {
        ...existingNoticia.extractionMetadata,
        processingTime: Date.now() - startTime,
        jobId: job.data.jobId,
        contentLength: extractedContent.content.length,
        imageCount: extractedContent.images.length,
      };

      await existingNoticia.save();

      const processingTime = Date.now() - startTime;

      // Actualizar job como completado
      const result = {
        contentExtracted: true,
        noticiaId: existingNoticia._id,
        contentLength: extractedContent.content.length,
        imageCount: extractedContent.images.length,
        processingTime,
        websiteName: websiteConfig.name,
      };

      await this.updateJobStatus(job.data.jobId, 'completed', {
        completedAt: new Date(),
        processingTime,
        result,
      });

      // Emitir evento de éxito
      this.eventEmitter.emit('generator-pro.extraction.content_extracted', {
        jobId: job.data.jobId,
        websiteId: websiteConfig._id,
        noticiaId: existingNoticia._id,
        sourceUrl: targetUrl,
        contentLength: extractedContent.content.length,
        processingTime,
        timestamp: new Date(),
      });

      job.progress(100);

      this.logger.log(`✅ Content extraction completed for: ${targetUrl}`);

      return {
        contentExtracted: true,
        message: 'Content extracted successfully',
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;

      this.logger.error(`❌ Content extraction failed for job ${job.data.jobId}: ${error.message}`);

      // Actualizar job como fallido
      await this.updateJobStatus(job.data.jobId, 'failed', {
        error: error.message,
        errorDetails: {
          message: error.message,
          stack: error.stack,
          timestamp: new Date(),
          processingTime,
          targetUrl: job.data.data.targetUrl,
        },
      });

      // Marcar noticia como fallida si existe
      if (job.data.data.targetUrl) {
        await this.extractedNoticiaModel.findOneAndUpdate(
          { sourceUrl: job.data.data.targetUrl },
          {
            status: 'failed',
            extractionMetadata: {
              error: error.message,
              jobId: job.data.jobId,
              failedAt: new Date(),
            },
          }
        );
      }

      // Emitir evento de fallo
      this.eventEmitter.emit('generator-pro.extraction.failed', {
        jobId: job.data.jobId,
        targetUrl: job.data.data.targetUrl,
        error: error.message,
        processingTime,
        timestamp: new Date(),
      });

      throw error;
    }
  }

  /**
   * 🔧 MÉTODOS AUXILIARES
   */
  private async updateJobStatus(
    jobId: string,
    status: string,
    updates: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      await this.jobModel.findByIdAndUpdate(jobId, {
        status,
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      this.logger.warn(`Failed to update job status for ${jobId}: ${error.message}`);
    }
  }
}