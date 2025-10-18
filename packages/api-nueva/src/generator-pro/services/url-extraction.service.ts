import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createHash } from 'crypto';

import { NewsWebsiteConfig, NewsWebsiteConfigDocument } from '../schemas/news-website-config.schema';
import { ExtractedUrlTracking, ExtractedUrlTrackingDocument } from '../schemas/extracted-url-tracking.schema';
import { UrlExtractionLog, UrlExtractionLogDocument } from '../schemas/url-extraction-log.schema';
import { PuppeteerManagerService } from '../../modules/reports/services/puppeteer-manager.service';

/**
 * 🔍 URL Extraction Service
 *
 * Responsabilidades:
 * - Extraer URLs desde listados de sitios web
 * - Detectar URLs duplicadas
 * - Guardar tracking de URLs extraídas
 * - Generar logs detallados
 * - Encolar URLs nuevas para extracción de contenido
 */

interface UrlExtractionResult {
  success: boolean;
  totalUrlsFound: number;
  newUrls: number;
  duplicateUrls: number;
  skippedUrls: number;
  queuedUrls: number;
  processingTime: number;
  error?: string;
}

@Injectable()
export class UrlExtractionService {
  private readonly logger = new Logger(UrlExtractionService.name);

  constructor(
    @InjectModel(NewsWebsiteConfig.name)
    private websiteModel: Model<NewsWebsiteConfigDocument>,
    @InjectModel(ExtractedUrlTracking.name)
    private urlTrackingModel: Model<ExtractedUrlTrackingDocument>,
    @InjectModel(UrlExtractionLog.name)
    private urlLogModel: Model<UrlExtractionLogDocument>,
    private puppeteerService: PuppeteerManagerService,
  ) {}

  /**
   * 🔍 Extrae URLs de un sitio web
   */
  async extractUrls(websiteId: Types.ObjectId): Promise<UrlExtractionResult> {
    const startTime = Date.now();

    this.logger.log(`🔍 Iniciando extracción de URLs para sitio: ${websiteId}`);

    try {
      // Obtener configuración del sitio
      const website = await this.websiteModel.findById(websiteId);
      if (!website) {
        throw new Error(`Website ${websiteId} not found`);
      }

      if (!website.isActive) {
        throw new Error(`Website ${website.name} is not active`);
      }

      // Extraer URLs según método (Cheerio o Puppeteer)
      const extractedUrls = website.extractionSettings?.useJavaScript
        ? await this.extractWithPuppeteer(website)
        : await this.extractWithCheerio(website);

      // Procesar URLs extraídas
      const processingResult = await this.processExtractedUrls(
        website,
        extractedUrls,
      );

      const processingTime = Date.now() - startTime;

      // Crear log
      await this.createExtractionLog(website, {
        status: 'success',
        totalUrlsFound: extractedUrls.length,
        newUrls: processingResult.newUrls,
        duplicateUrls: processingResult.duplicateUrls,
        skippedUrls: processingResult.skippedUrls,
        queuedUrls: processingResult.queuedUrls,
        processingTime,
        method: website.extractionSettings?.useJavaScript ? 'puppeteer' : 'cheerio',
        sampleUrls: extractedUrls.slice(0, 5),
        httpStatusCode: 200,
      });

      this.logger.log(
        `✅ Extracción completada para ${website.name}: ${processingResult.newUrls} nuevas, ${processingResult.duplicateUrls} duplicadas`,
      );

      return {
        success: true,
        totalUrlsFound: extractedUrls.length,
        newUrls: processingResult.newUrls,
        duplicateUrls: processingResult.duplicateUrls,
        skippedUrls: processingResult.skippedUrls,
        queuedUrls: processingResult.queuedUrls,
        processingTime,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      this.logger.error(
        `❌ Error extrayendo URLs para ${websiteId}: ${error.message}`,
        error.stack,
      );

      // Crear log de error
      const website = await this.websiteModel.findById(websiteId);
      if (website) {
        await this.createExtractionLog(website, {
          status: 'failed',
          totalUrlsFound: 0,
          newUrls: 0,
          duplicateUrls: 0,
          skippedUrls: 0,
          queuedUrls: 0,
          processingTime,
          errorMessage: error.message,
          errorType: this.categorizeError(error.message),
          httpStatusCode: 0,
          method: website.extractionSettings?.useJavaScript ? 'puppeteer' : 'cheerio',
        });
      }

      return {
        success: false,
        totalUrlsFound: 0,
        newUrls: 0,
        duplicateUrls: 0,
        skippedUrls: 0,
        queuedUrls: 0,
        processingTime,
        error: error.message,
      };
    }
  }

  /**
   * 🌐 Extrae URLs con Cheerio (estático)
   */
  private async extractWithCheerio(
    website: NewsWebsiteConfigDocument,
  ): Promise<string[]> {
    this.logger.log(`🕷️ Extrayendo URLs con Cheerio desde: ${website.listingUrl}`);

    try {
      // Fetch HTML
      const response = await axios.get(website.listingUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ...website.customHeaders,
        },
        timeout: website.extractionSettings?.timeout || 30000,
      });

      // Parse con Cheerio
      const $ = cheerio.load(response.data);

      // Extraer URLs usando selector
      const selector = website.listingSelectors.articleLinks;
      const urls: string[] = [];

      $(selector).each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          // Convertir a URL absoluta si es relativa
          const absoluteUrl = this.makeAbsoluteUrl(href, website.baseUrl);
          urls.push(absoluteUrl);
        }
      });

      this.logger.log(`🔗 Encontradas ${urls.length} URLs con selector "${selector}"`);

      return urls;
    } catch (error) {
      this.logger.error(`❌ Error con Cheerio: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🎭 Extrae URLs con Puppeteer (dinámico)
   */
  private async extractWithPuppeteer(
    website: NewsWebsiteConfigDocument,
  ): Promise<string[]> {
    this.logger.log(`🎭 Extrayendo URLs con Puppeteer desde: ${website.listingUrl}`);

    try {
      // Renderizar con Puppeteer
      const html = await this.puppeteerService.getRenderedHTML(
        website.listingUrl,
        {
          waitTime: website.extractionSettings?.waitTime,
          timeout: website.extractionSettings?.timeout || 30000,
          useJavaScript: true,
        },
      );

      // Parse con Cheerio
      const $ = cheerio.load(html);

      // Extraer URLs
      const selector = website.listingSelectors.articleLinks;
      const urls: string[] = [];

      $(selector).each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          const absoluteUrl = this.makeAbsoluteUrl(href, website.baseUrl);
          urls.push(absoluteUrl);
        }
      });

      this.logger.log(`🔗 Encontradas ${urls.length} URLs con Puppeteer`);

      return urls;
    } catch (error) {
      this.logger.error(`❌ Error con Puppeteer: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🔄 Procesa URLs extraídas
   *
   * LÓGICA:
   * 1. Para cada URL, calcular hash
   * 2. Verificar si ya existe en ExtractedUrlTracking
   * 3. Si existe: actualizar lastSeenAt
   * 4. Si no existe: crear nuevo tracking y encolar para extracción
   */
  private async processExtractedUrls(
    website: NewsWebsiteConfigDocument,
    urls: string[],
  ): Promise<{
    newUrls: number;
    duplicateUrls: number;
    skippedUrls: number;
    queuedUrls: number;
  }> {
    let newUrls = 0;
    let duplicateUrls = 0;
    let skippedUrls = 0;
    let queuedUrls = 0;

    for (const url of urls) {
      try {
        // Calcular hash de la URL
        const urlHash = this.calculateUrlHash(url);

        // Buscar si ya existe
        const existingTracking = await this.urlTrackingModel.findOne({
          websiteConfigId: website._id,
          urlHash,
        });

        if (existingTracking) {
          // URL duplicada: actualizar lastSeenAt
          await existingTracking.updateLastSeen();
          duplicateUrls++;

          this.logger.debug(`🔁 URL duplicada: ${url}`);

          // Verificar si necesita re-extracción
          if (this.needsReExtraction(existingTracking)) {
            this.logger.log(`🔄 URL necesita re-extracción: ${url}`);
            // TODO FASE 2: Encolar para re-extracción
            queuedUrls++;
          }
        } else {
          // URL nueva: crear tracking
          const tracking = new this.urlTrackingModel({
            websiteConfigId: website._id,
            url,
            urlHash,
            domain: new URL(url).hostname,
            status: 'discovered',
            firstDiscoveredAt: new Date(),
            lastSeenAt: new Date(),
            timesDiscovered: 1,
            allowReExtraction: false, // Por defecto no permitir re-extracción
          });

          await tracking.save();
          newUrls++;

          this.logger.debug(`🆕 URL nueva: ${url}`);

          // Encolar para extracción de contenido
          // TODO FASE 2: Integrar con GeneratorProQueueService
          queuedUrls++;
        }
      } catch (error) {
        this.logger.error(`❌ Error procesando URL ${url}: ${error.message}`);
        skippedUrls++;
      }
    }

    return {
      newUrls,
      duplicateUrls,
      skippedUrls,
      queuedUrls,
    };
  }

  /**
   * 🔑 Calcula hash SHA-256 de una URL
   */
  private calculateUrlHash(url: string): string {
    return createHash('sha256').update(url).digest('hex');
  }

  /**
   * 🔗 Convierte URL relativa a absoluta
   */
  private makeAbsoluteUrl(href: string, baseUrl: string): string {
    try {
      if (href.startsWith('http://') || href.startsWith('https://')) {
        return href;
      }
      const base = new URL(baseUrl);
      return new URL(href, base.origin).href;
    } catch {
      return href;
    }
  }

  /**
   * 🔄 Verifica si una URL necesita re-extracción
   */
  private needsReExtraction(tracking: ExtractedUrlTrackingDocument): boolean {
    if (!tracking.allowReExtraction) {
      return false;
    }

    if (!tracking.nextReExtractionAllowedAt) {
      return false;
    }

    return new Date() >= tracking.nextReExtractionAllowedAt;
  }

  /**
   * 📝 Crea log de extracción
   */
  private async createExtractionLog(
    website: NewsWebsiteConfigDocument,
    data: Partial<UrlExtractionLog>,
  ): Promise<void> {
    try {
      const log = new this.urlLogModel({
        websiteConfigId: website._id,
        websiteName: website.name,
        listingUrl: website.listingUrl,
        selector: website.listingSelectors.articleLinks,
        executedAt: new Date(),
        wasScheduled: true,
        ...data,
      });

      await log.save();
    } catch (error) {
      this.logger.error(`Error creando log: ${error.message}`);
    }
  }

  /**
   * 🔍 Categoriza tipo de error
   */
  private categorizeError(errorMessage: string): 'network' | 'parsing' | 'selector' | 'timeout' | 'rate_limit' | 'unknown' {
    const message = errorMessage.toLowerCase();

    if (message.includes('timeout')) return 'timeout';
    if (message.includes('network') || message.includes('connection')) return 'network';
    if (message.includes('selector') || message.includes('not found')) return 'selector';
    if (message.includes('rate limit')) return 'rate_limit';
    if (message.includes('parse')) return 'parsing';

    return 'unknown';
  }
}
