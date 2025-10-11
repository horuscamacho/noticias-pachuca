import { Process, Processor } from '@nestjs/bull';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { NoticiasScrapingService } from '../services/noticias-scraping.service';
import { NoticiasConfigService } from '../services/noticias-config.service';
import { UrlDetectionService } from '../services/url-detection.service';
import { ExtractedNoticia, ExtractedNoticiaDocument } from '../schemas/extracted-noticia.schema';
import { NoticiasExtractionJob, NoticiasExtractionJobDocument } from '../schemas/noticias-extraction-job.schema';
import { NoticiasExtractionLog, NoticiasExtractionLogDocument } from '../schemas/noticias-extraction-log.schema';
import { ExtractionJobData, ExtractionJobResult } from '../interfaces/noticias.interfaces';

// Palabras comunes en español a ignorar (stop words)
const STOP_WORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'de', 'del', 'al', 'en', 'por', 'para', 'con', 'sin',
  'sobre', 'entre', 'hasta', 'desde', 'hacia', 'contra',
  'y', 'o', 'pero', 'si', 'no', 'que', 'como', 'cuando',
  'donde', 'quien', 'cual', 'este', 'ese', 'aquel',
  'esta', 'esa', 'aquella', 'estos', 'esos', 'aquellos',
  'ser', 'estar', 'haber', 'tener', 'hacer', 'ir', 'poder',
  'a', 'ante', 'bajo', 'cabe', 'con', 'contra', 'de', 'desde',
  'durante', 'en', 'entre', 'hacia', 'hasta', 'mediante',
  'para', 'por', 'según', 'sin', 'so', 'sobre', 'tras',
  'versus', 'vía', 'más', 'menos', 'muy', 'tan', 'tanto',
]);

/**
 * 🔄 Processor para jobs de extracción de noticias
 * Maneja el procesamiento asíncrono de extracciones con Bull Queue
 */
@Processor('noticias-extraction')
@Injectable()
export class NoticiasExtractionProcessor {
  private readonly logger = new Logger(NoticiasExtractionProcessor.name);

  constructor(
    @InjectModel(ExtractedNoticia.name)
    private readonly extractedNoticiaModel: Model<ExtractedNoticiaDocument>,
    @InjectModel(NoticiasExtractionJob.name)
    private readonly jobModel: Model<NoticiasExtractionJobDocument>,
    @InjectModel(NoticiasExtractionLog.name)
    private readonly logModel: Model<NoticiasExtractionLogDocument>,
    private readonly scrapingService: NoticiasScrapingService,
    private readonly configService: NoticiasConfigService,
    private readonly urlDetectionService: UrlDetectionService,
  ) {}

  /**
   * 🔑 Extraer keywords del título y contenido usando análisis de frecuencia
   */
  private extractKeywords(text: string, maxKeywords = 10): string[] {
    if (!text) return [];

    // Limpiar y normalizar texto
    const normalized = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^\w\s]/g, ' ') // Remover puntuación
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim();

    // Dividir en palabras
    const words = normalized.split(' ');

    // Contar frecuencia de palabras (ignorando stop words y palabras cortas)
    const wordFreq = new Map<string, number>();

    for (const word of words) {
      // Ignorar palabras cortas, números y stop words
      if (word.length < 4 || STOP_WORDS.has(word) || /^\d+$/.test(word)) {
        continue;
      }

      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }

    // Ordenar por frecuencia y tomar las top N
    const sortedWords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords)
      .map(([word]) => word);

    return sortedWords;
  }

  /**
   * 🎯 Procesar job de extracción individual
   */
  @Process('extract-noticia')
  async handleExtractionJob(job: Job<ExtractionJobData>): Promise<ExtractionJobResult> {
    const { sourceUrl, domain, configId, facebookPostId, pageId } = job.data;
    const startTime = Date.now();

    this.logger.log(`Processing extraction job ${job.id} for URL: ${sourceUrl}`);

    try {
      // Actualizar progreso inicial
      await job.progress(10);

      // Verificar si ya existe la noticia extraída
      const existingNoticia = await this.extractedNoticiaModel.findOne({
        sourceUrl,
        status: 'extracted'
      });

      if (existingNoticia && !job.data.metadata?.forceReExtraction) {
        this.logger.log(`Noticia already exists for URL: ${sourceUrl}, skipping`);

        // Asegurar que el estado de la URL esté marcado como extraído
        try {
          await this.urlDetectionService.updateExtractionStatus(sourceUrl, 'extracted');
        } catch (error) {
          this.logger.warn(`Failed to update URL status for cached result: ${error.message}`);
        }

        return {
          success: true,
          extractedNoticiaId: String(existingNoticia._id),
          processingTime: Date.now() - startTime,
          method: 'cached',
          contentLength: existingNoticia.content?.length || 0,
          imagesFound: existingNoticia.images?.length || 0,
        };
      }

      // Obtener configuración
      await job.progress(20);
      const config = await this.configService.findById(configId.toString());
      if (!config) {
        throw new Error(`Configuration not found for ID: ${configId}`);
      }

      // Realizar extracción
      await job.progress(40);
      const scrapingResult = await this.scrapingService.extractFromUrl(sourceUrl, {
        domain: config.domain,
        name: config.name,
        isActive: config.isActive,
        selectors: config.selectors,
        extractionSettings: config.extractionSettings || {},
        customHeaders: config.customHeaders || {},
      });

      await job.progress(70);

      if (!scrapingResult.success) {
        throw new Error(`Extraction failed: ${scrapingResult.error?.message}`);
      }

      // Extraer keywords del título y contenido
      const text = `${scrapingResult.data!.title || ''} ${scrapingResult.data!.content || ''}`;
      const keywords = this.extractKeywords(text, 10);

      // Guardar noticia extraída
      const extractedNoticia = new this.extractedNoticiaModel({
        sourceUrl,
        domain,
        facebookPostId,
        pageId,
        title: scrapingResult.data!.title,
        content: scrapingResult.data!.content,
        images: scrapingResult.data!.images || [],
        publishedAt: scrapingResult.data!.publishedAt,
        author: scrapingResult.data!.author,
        categories: scrapingResult.data!.categories || [],
        excerpt: scrapingResult.data!.excerpt,
        tags: scrapingResult.data!.tags || [],
        keywords, // ✨ Agregar keywords extraídas automáticamente
        extractedAt: new Date(),
        extractionConfigId: configId,
        extractionMetadata: {
          method: scrapingResult.metadata.method,
          processingTime: scrapingResult.metadata.processingTime,
          contentLength: scrapingResult.metadata.contentLength,
          imagesCount: scrapingResult.metadata.imagesFound,
          success: true,
        },
        status: 'extracted',
        rawData: scrapingResult,
        qualityMetrics: scrapingResult.qualityMetrics ? {
          titleLength: scrapingResult.data!.title.length,
          contentLength: scrapingResult.data!.content.length,
          imageQuality: scrapingResult.qualityMetrics.titleQuality === 'good' ? 'high' :
                       scrapingResult.qualityMetrics.titleQuality === 'fair' ? 'medium' : 'low',
          completeness: scrapingResult.qualityMetrics.completeness,
          confidence: scrapingResult.qualityMetrics.confidence,
        } : undefined,
      });

      await extractedNoticia.save();
      await job.progress(90);

      // Log exitoso
      await this.logExtraction({
        sourceUrl,
        domain,
        configId,
        jobId: job.id.toString(),
        facebookPostId,
        status: 'success',
        method: scrapingResult.metadata.method,
        processingTime: Date.now() - startTime,
        httpStatusCode: scrapingResult.metadata.httpStatus,
        extractedData: {
          title: scrapingResult.data!.title,
          contentLength: scrapingResult.data!.content.length,
          imagesCount: scrapingResult.data!.images?.length || 0,
          categoriesCount: scrapingResult.data!.categories?.length || 0,
          tagsCount: scrapingResult.data!.tags?.length || 0,
          hasAuthor: !!scrapingResult.data!.author,
          hasPublishedDate: !!scrapingResult.data!.publishedAt,
        },
        warnings: scrapingResult.warnings,
      });

      // Actualizar estado de la URL externa como extraída
      try {
        await this.urlDetectionService.updateExtractionStatus(sourceUrl, 'extracted');
      } catch (error) {
        this.logger.warn(`Failed to update URL extraction status: ${error.message}`);
      }

      await job.progress(100);

      this.logger.log(`Successfully extracted noticia ${extractedNoticia._id} from ${sourceUrl}`);

      return {
        success: true,
        extractedNoticiaId: String(extractedNoticia._id),
        processingTime: Date.now() - startTime,
        method: scrapingResult.metadata.method,
        contentLength: scrapingResult.metadata.contentLength,
        imagesFound: scrapingResult.metadata.imagesFound,
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;

      this.logger.error(`Extraction job ${job.id} failed for URL ${sourceUrl}: ${error.message}`);

      // Actualizar estado de la URL externa como fallida
      try {
        await this.urlDetectionService.updateExtractionStatus(sourceUrl, 'failed', error.message);
      } catch (updateError) {
        this.logger.warn(`Failed to update URL extraction status for failed job: ${updateError.message}`);
      }

      // Log error
      await this.logExtraction({
        sourceUrl,
        domain,
        configId,
        jobId: job.id.toString(),
        facebookPostId,
        status: 'error',
        method: 'unknown',
        processingTime,
        httpStatusCode: 500,
        error: {
          message: error.message,
          type: this.categorizeError(error.message),
          details: { stack: error.stack },
        },
      });

      throw error;
    }
  }

  /**
   * 📊 Procesar batch de extracciones
   */
  @Process('extract-batch')
  async handleBatchExtraction(job: Job<{ urls: ExtractionJobData[]; batchId: string }>): Promise<void> {
    const { urls, batchId } = job.data;
    const totalUrls = urls.length;

    this.logger.log(`Processing batch ${batchId} with ${totalUrls} URLs`);

    for (let i = 0; i < urls.length; i++) {
      const urlData = urls[i];
      const progress = Math.round(((i + 1) / totalUrls) * 100);

      try {
        // Procesar cada URL individualmente
        await this.handleExtractionJob({ data: urlData } as Job<ExtractionJobData>);
        await job.progress(progress);

        this.logger.debug(`Batch ${batchId}: Processed ${i + 1}/${totalUrls} URLs`);

        // Delay between extractions to respect rate limits
        if (i < urls.length - 1) {
          await this.delay(1000); // 1 second delay
        }
      } catch (error) {
        this.logger.error(`Batch ${batchId}: Failed to process URL ${urlData.sourceUrl}: ${error.message}`);
        // Continue with next URL in batch
      }
    }

    this.logger.log(`Completed batch ${batchId}`);
  }

  /**
   * 🕒 Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 📝 Log de extracción
   */
  private async logExtraction(data: {
    sourceUrl: string;
    domain: string;
    configId: unknown;
    jobId: string;
    facebookPostId: string;
    status: 'success' | 'error' | 'partial' | 'skipped';
    method: 'cheerio' | 'puppeteer' | 'unknown';
    processingTime: number;
    httpStatusCode: number;
    extractedData?: {
      title?: string;
      contentLength?: number;
      imagesCount?: number;
      categoriesCount?: number;
      tagsCount?: number;
      hasAuthor?: boolean;
      hasPublishedDate?: boolean;
    };
    error?: {
      message: string;
      type: 'network' | 'parsing' | 'selector' | 'timeout' | 'rate_limit' | 'unknown';
      details?: Record<string, unknown>;
    };
    warnings?: string[];
  }): Promise<void> {
    try {
      const log = new this.logModel({
        sourceUrl: data.sourceUrl,
        domain: data.domain,
        configId: data.configId,
        jobId: data.jobId,
        facebookPostId: data.facebookPostId,
        status: data.status,
        method: data.method,
        processingTime: data.processingTime,
        httpStatusCode: data.httpStatusCode,
        extractedData: data.extractedData,
        error: data.error,
        warnings: data.warnings || [],
        requestMetadata: {
          userAgent: 'Pachuca-Noticias-Bot/1.0',
          headers: {},
          timeout: 30000,
          retryAttempt: 0,
        },
        createdAt: new Date(),
      });

      await log.save();
    } catch (error) {
      this.logger.error(`Failed to save extraction log: ${error.message}`);
    }
  }

  /**
   * 🔍 Categorizar tipo de error
   */
  private categorizeError(errorMessage: string): 'network' | 'parsing' | 'selector' | 'timeout' | 'rate_limit' | 'unknown' {
    const message = errorMessage.toLowerCase();

    if (message.includes('timeout') || message.includes('timed out')) {
      return 'timeout';
    }
    if (message.includes('network') || message.includes('connection') || message.includes('econnrefused')) {
      return 'network';
    }
    if (message.includes('selector') || message.includes('not found') || message.includes('element')) {
      return 'selector';
    }
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return 'rate_limit';
    }
    if (message.includes('parse') || message.includes('invalid html')) {
      return 'parsing';
    }

    return 'unknown';
  }
}