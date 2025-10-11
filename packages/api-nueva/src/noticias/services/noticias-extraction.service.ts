import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { NoticiasExtractionJob, NoticiasExtractionJobDocument } from '../schemas/noticias-extraction-job.schema';
import { ExtractedNoticia, ExtractedNoticiaDocument } from '../schemas/extracted-noticia.schema';
import { NoticiasConfigService } from './noticias-config.service';
import { CacheService } from '../../services/cache.service';
import { PaginationService } from '../../common/services/pagination.service';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import {
  ExtractionJobData,
  NoticiasFilter,
  NoticiasPaginationOptions,
  ExtractionStats,
} from '../interfaces/noticias.interfaces';

/**
 * 🔄 Servicio de extracción y gestión de jobs
 * Maneja la queue de extracciones y el estado de los jobs
 */
@Injectable()
export class NoticiasExtractionService {
  private readonly logger = new Logger(NoticiasExtractionService.name);

  constructor(
    @InjectQueue('noticias-extraction')
    private readonly extractionQueue: Queue,
    @InjectModel(NoticiasExtractionJob.name)
    private readonly jobModel: Model<NoticiasExtractionJobDocument>,
    @InjectModel(ExtractedNoticia.name)
    private readonly extractedNoticiaModel: Model<ExtractedNoticiaDocument>,
    private readonly configService: NoticiasConfigService,
    private readonly cacheService: CacheService,
    private readonly paginationService: PaginationService,
  ) {}

  /**
   * 🚀 Trigger extracción individual
   */
  async extractSingleUrl(
    url: string,
    configId: string,
    facebookPostId: string,
    options: {
      pageId?: string;
      priority?: number;
      forceReExtraction?: boolean;
    } = {}
  ): Promise<{ jobId: string; message: string }> {
    this.logger.log(`Triggering extraction for URL: ${url} with config: ${configId}`);

    try {
      // Verificar que existe la configuración
      const config = await this.configService.findById(configId);
      if (!config.isActive) {
        throw new Error(`Configuration ${configId} is not active`);
      }

      // Verificar si ya existe extracción exitosa (a menos que se fuerce)
      if (!options.forceReExtraction) {
        const existingExtraction = await this.extractedNoticiaModel.findOne({
          sourceUrl: url,
          status: 'extracted'
        });

        if (existingExtraction) {
          return {
            jobId: 'cached',
            message: 'Content already extracted, using cached version'
          };
        }
      }

      // Crear job data
      const jobData: ExtractionJobData = {
        sourceUrl: url,
        domain: config.domain,
        configId: String(config._id),
        facebookPostId,
        pageId: options.pageId,
        priority: options.priority || 5,
        metadata: {
          triggeredBy: 'manual',
        },
      };

      // Agregar job a la queue
      const job = await this.extractionQueue.add('extract-noticia', jobData, {
        priority: options.priority || 5,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 50,
        removeOnFail: 100,
      });

      // Guardar job en base de datos
      const jobDocument = new this.jobModel({
        jobId: job.id.toString(),
        sourceUrl: url,
        domain: config.domain,
        configId: config._id,
        facebookPostId,
        pageId: options.pageId,
        status: 'pending',
        progress: 0,
        jobOptions: {
          priority: options.priority || 5,
          attempts: 3,
          timeout: 60000,
        },
        metadata: {
          triggeredBy: 'manual',
        },
      });

      await jobDocument.save();

      this.logger.log(`Created extraction job ${job.id} for URL: ${url}`);

      return {
        jobId: job.id.toString(),
        message: 'Extraction job created successfully'
      };

    } catch (error) {
      this.logger.error(`Failed to trigger extraction for URL ${url}: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📦 Trigger extracción en lote por dominio
   */
  async extractByDomain(
    domain: string,
    options: {
      limit?: number;
      priority?: number;
      forceReExtraction?: boolean;
    } = {}
  ): Promise<{ batchId: string; totalJobs: number; message: string }> {
    this.logger.log(`Triggering batch extraction for domain: ${domain}`);

    try {
      // Obtener configuración del dominio
      const config = await this.configService.findByDomain(domain);
      if (!config) {
        throw new Error(`No active configuration found for domain: ${domain}`);
      }

      // Obtener URLs pendientes de este dominio desde RapidAPI posts
      // TODO: Integrar con UrlDetectionService cuando esté implementado
      const pendingUrls = await this.getPendingUrlsForDomain(domain, options.limit || 50);

      if (pendingUrls.length === 0) {
        return {
          batchId: '',
          totalJobs: 0,
          message: 'No pending URLs found for this domain'
        };
      }

      // Crear datos para batch job
      const batchId = `batch_${domain}_${Date.now()}`;
      const jobsData: ExtractionJobData[] = pendingUrls.map(urlInfo => ({
        sourceUrl: urlInfo.url,
        domain,
        configId: String(config._id),
        facebookPostId: urlInfo.facebookPostId,
        pageId: urlInfo.pageId,
        priority: options.priority || 5,
        metadata: {
          triggeredBy: 'automatic',
          batchId,
        },
      }));

      // Agregar batch job a la queue
      const batchJob = await this.extractionQueue.add('extract-batch', {
        urls: jobsData,
        batchId,
      }, {
        priority: options.priority || 5,
        attempts: 1, // No retry batch jobs
        removeOnComplete: 10,
        removeOnFail: 20,
      });

      this.logger.log(`Created batch job ${batchJob.id} for domain ${domain} with ${jobsData.length} URLs`);

      return {
        batchId: batchJob.id.toString(),
        totalJobs: jobsData.length,
        message: `Batch extraction started for ${jobsData.length} URLs`
      };

    } catch (error) {
      this.logger.error(`Failed to trigger batch extraction for domain ${domain}: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📄 Obtener noticias extraídas con filtros y paginación
   */
  async getExtractedNoticias(
    filters: NoticiasFilter,
    pagination: NoticiasPaginationOptions
  ): Promise<PaginatedResponse<ExtractedNoticiaDocument>> {
    // Construir filtro MongoDB
    const mongoFilter: Record<string, unknown> = {};

    if (filters.domain) {
      mongoFilter.domain = filters.domain;
    }

    if (filters.status) {
      mongoFilter.status = filters.status;
    }

    if (filters.facebookPostId) {
      mongoFilter.facebookPostId = filters.facebookPostId;
    }

    if (filters.pageId) {
      mongoFilter.pageId = filters.pageId;
    }

    if (filters.hasImages !== undefined) {
      mongoFilter['images.0'] = filters.hasImages ? { $exists: true } : { $exists: false };
    }

    if (filters.dateFrom || filters.dateTo) {
      mongoFilter.extractedAt = {} as Record<string, unknown>;
      if (filters.dateFrom) {
        (mongoFilter.extractedAt as Record<string, unknown>).$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        (mongoFilter.extractedAt as Record<string, unknown>).$lte = new Date(filters.dateTo);
      }
    }

    // Nuevos filtros
    if (filters.category) {
      mongoFilter.category = filters.category;
    }

    if (filters.author) {
      mongoFilter.author = filters.author;
    }

    if (filters.tags && filters.tags.length > 0) {
      mongoFilter.tags = { $in: filters.tags };
    }

    if (filters.keywords && filters.keywords.length > 0) {
      mongoFilter.keywords = { $in: filters.keywords };
    }

    // Text search usando Text Index (mejor performance que regex)
    if (filters.searchText) {
      mongoFilter.$text = { $search: filters.searchText };
    }

    // Configurar ordenamiento
    const sortField = pagination.sortBy || 'extractedAt';
    const sortOrder = pagination.sortOrder === 'asc' ? 1 : -1;

    const result = await this.paginationService.paginate(
      this.extractedNoticiaModel,
      {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        // No pasar skip - se calcula automáticamente en PaginationService
      },
      mongoFilter,
      {
        sort: { [sortField]: sortOrder },
        select: '-rawData', // Excluir rawData por performance
      }
    );

    return result;
  }

  /**
   * 🔑 Obtener keywords únicas con conteo
   */
  async getKeywords(search?: string): Promise<{ keyword: string; count: number }[]> {
    type AggregateStage =
      | { $unwind: string }
      | { $match: { keywords: { $regex: string; $options: string } } }
      | { $group: { _id: string; count: { $sum: number } } }
      | { $sort: { count: number } }
      | { $limit: number }
      | { $project: { _id: number; keyword: string; count: number } };

    const pipeline: AggregateStage[] = [
      // Descomponer array de keywords
      { $unwind: '$keywords' },
    ];

    // Si hay búsqueda, filtrar keywords
    if (search) {
      pipeline.push({
        $match: {
          keywords: { $regex: search, $options: 'i' }
        }
      });
    }

    // Agrupar y contar
    pipeline.push(
      {
        $group: {
          _id: '$keywords',
          count: { $sum: 1 }
        }
      },
      // Ordenar por count descendente
      {
        $sort: { count: -1 }
      },
      // Limitar a 100 keywords
      {
        $limit: 100
      },
      // Proyectar formato final
      {
        $project: {
          _id: 0,
          keyword: '$_id',
          count: 1
        }
      }
    );

    return await this.extractedNoticiaModel.aggregate(pipeline as never).exec();
  }

  /**
   * 📊 Obtener estadísticas de extracciones
   */
  async getExtractionStats(): Promise<ExtractionStats> {
    const cacheKey = 'noticias:extraction_stats';
    const cached = await this.cacheService.get<ExtractionStats>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Estadísticas de noticias extraídas
      const [
        totalExtracted,
        totalFailed,
        totalPending,
        totalProcessing,
        byDomainStats
      ] = await Promise.all([
        this.extractedNoticiaModel.countDocuments({ status: 'extracted' }).catch(() => 0),
        this.extractedNoticiaModel.countDocuments({ status: 'failed' }).catch(() => 0),
        this.extractedNoticiaModel.countDocuments({ status: 'pending' }).catch(() => 0),
        this.extractedNoticiaModel.countDocuments({ status: 'processing' }).catch(() => 0),
        this.getStatsByDomain().catch(() => []),
      ]);

      // Estadísticas de performance (últimos 7 días)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const [dailyExtractions, avgProcessingTime] = await Promise.all([
        this.extractedNoticiaModel.countDocuments({
          extractedAt: { $gte: weekAgo },
          status: 'extracted'
        }).catch(() => 0),
        this.getAverageProcessingTime().catch(() => 0),
      ]);

      const total = totalExtracted + totalFailed;
      const successRate = total > 0 ? (totalExtracted / total) * 100 : 0;

      const stats: ExtractionStats = {
        total,
        successful: totalExtracted,
        failed: totalFailed,
        pending: totalPending,
        processing: totalProcessing,
        byDomain: byDomainStats,
        performance: {
          averageProcessingTime: avgProcessingTime,
          successRate,
          dailyExtractions: Math.round(dailyExtractions / 7), // Promedio diario
        },
      };

      await this.cacheService.set(cacheKey, stats, 300); // Cache por 5 minutos

      return stats;

    } catch (error) {
      this.logger.error(`Failed to calculate extraction stats: ${error.message}`);

      // Devolver estadísticas por defecto en lugar de fallar
      const defaultStats: ExtractionStats = {
        total: 0,
        successful: 0,
        failed: 0,
        pending: 0,
        processing: 0,
        byDomain: [],
        performance: {
          averageProcessingTime: 0,
          successRate: 0,
          dailyExtractions: 0,
        },
      };

      this.logger.warn('Returning default extraction stats due to error');
      return defaultStats;
    }
  }

  /**
   * 📋 Obtener estado de jobs
   */
  async getJobStatus(jobId: string): Promise<NoticiasExtractionJobDocument | null> {
    return await this.jobModel.findOne({ jobId });
  }

  /**
   * 📋 Obtener jobs con filtros
   */
  async getJobs(
    filters: {
      status?: string;
      domain?: string;
      dateFrom?: string;
      dateTo?: string;
    },
    pagination: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<NoticiasExtractionJobDocument>> {
    const mongoFilter: Record<string, unknown> = {};

    if (filters.status) {
      mongoFilter.status = filters.status;
    }

    if (filters.domain) {
      mongoFilter.domain = filters.domain;
    }

    if (filters.dateFrom || filters.dateTo) {
      mongoFilter.createdAt = {} as Record<string, unknown>;
      if (filters.dateFrom) {
        (mongoFilter.createdAt as Record<string, unknown>).$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        (mongoFilter.createdAt as Record<string, unknown>).$lte = new Date(filters.dateTo);
      }
    }

    return await this.paginationService.paginate(
      this.jobModel,
      {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
      },
      mongoFilter,
      {
        sort: { createdAt: -1 },
      }
    );
  }

  /**
   * 🔄 Reintentar job fallido
   */
  async retryFailedJob(jobId: string): Promise<{ newJobId: string; message: string }> {
    const jobDoc = await this.jobModel.findOne({ jobId });
    if (!jobDoc) {
      throw new Error(`Job not found: ${jobId}`);
    }

    if (jobDoc.status !== 'failed') {
      throw new Error(`Job ${jobId} is not in failed state`);
    }

    // Crear nuevo job con los mismos datos
    const jobData: ExtractionJobData = {
      sourceUrl: jobDoc.sourceUrl,
      domain: jobDoc.domain,
      configId: String(jobDoc.configId),
      facebookPostId: jobDoc.facebookPostId,
      pageId: jobDoc.pageId,
      priority: jobDoc.jobOptions?.priority || 5,
      metadata: {
        triggeredBy: 'manual',
        originalJobId: jobId,
      },
    };

    const newJob = await this.extractionQueue.add('extract-noticia', jobData, {
      priority: jobData.priority,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });

    this.logger.log(`Retrying failed job ${jobId} as new job ${newJob.id}`);

    return {
      newJobId: newJob.id.toString(),
      message: 'Retry job created successfully'
    };
  }

  /**
   * 🔍 Obtener URLs pendientes por dominio (placeholder)
   */
  private async getPendingUrlsForDomain(
    domain: string,
    limit: number
  ): Promise<Array<{ url: string; facebookPostId: string; pageId?: string }>> {
    // TODO: Implementar cuando esté disponible UrlDetectionService
    // Por ahora retornamos array vacío
    this.logger.debug(`Getting pending URLs for domain ${domain} (limit: ${limit})`);
    return [];
  }

  /**
   * 📊 Obtener estadísticas por dominio
   */
  private async getStatsByDomain(): Promise<Array<{
    domain: string;
    total: number;
    successful: number;
    failed: number;
    lastExtraction?: Date;
  }>> {
    const pipeline = [
      {
        $group: {
          _id: '$domain',
          total: { $sum: 1 },
          successful: {
            $sum: { $cond: [{ $eq: ['$status', 'extracted'] }, 1, 0] }
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          lastExtraction: { $max: '$extractedAt' }
        }
      },
      {
        $project: {
          domain: '$_id',
          total: 1,
          successful: 1,
          failed: 1,
          lastExtraction: 1,
          _id: 0
        }
      },
      { $sort: { total: -1 as 1 | -1 } }
    ];

    return await this.extractedNoticiaModel.aggregate(pipeline);
  }

  /**
   * ⏱️ Obtener tiempo promedio de procesamiento
   */
  private async getAverageProcessingTime(): Promise<number> {
    const pipeline = [
      {
        $match: {
          status: 'extracted',
          'extractionMetadata.processingTime': { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$extractionMetadata.processingTime' }
        }
      }
    ];

    const result = await this.extractedNoticiaModel.aggregate(pipeline);
    return result.length > 0 ? Math.round(result[0].avgTime) : 0;
  }

  /**
   * ✅ Marcar noticia como procesada
   */
  async markAsProcessed(id: string): Promise<{ message: string }> {
    const noticia = await this.extractedNoticiaModel.findById(id);
    if (!noticia) {
      throw new Error(`Noticia with ID ${id} not found`);
    }

    await this.extractedNoticiaModel.findByIdAndUpdate(id, {
      isProcessed: true,
      processedAt: new Date()
    });

    this.logger.log(`Noticia ${id} marked as processed`);

    return { message: 'Noticia marked as processed successfully' };
  }
}