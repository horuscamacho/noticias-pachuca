import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import axios from 'axios';
import * as cheerio from 'cheerio';

import { NewsWebsiteConfig, NewsWebsiteConfigDocument } from '../schemas/news-website-config.schema';
import { ExtractedNoticia, ExtractedNoticiaDocument } from '../../noticias/schemas/extracted-noticia.schema';
import {
  TestListingSelectorsDto,
  TestIndividualContentDto,
  ExtractedUrlDto,
  ExtractedContentDto,
  TestListingResponseDto,
  TestContentResponseDto
} from '../dto/test-selectors-advanced.dto';

/**
 * 🤖 Servicio de gestión de sitios web de noticias - Generator Pro
 * Extiende funcionalidades de NoticiasExtractionService para incluir:
 * - Extracción automatizada de URLs desde listados
 * - Extracción de contenido específico para Generator Pro
 * - Validación y testing de selectores CSS
 * - Integración con sistema de colas automatizado
 */

interface ExtractedNews {
  title: string;
  content: string;
  images: string[];
  publishedAt?: Date;
  author?: string;
  category?: string;
  excerpt?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

interface TestResult {
  success: boolean;
  listingTest?: {
    urlsFound: number;
    sampleUrls: string[];
    errors?: string[];
  };
  contentTest?: {
    sampleContent: ExtractedNews;
    errors?: string[];
  };
  errorMessage?: string;
  duration?: number;
}

interface ValidationResult {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  suggestions: string[];
}

@Injectable()
export class NewsWebsiteService {
  private readonly logger = new Logger(NewsWebsiteService.name);

  constructor(
    @InjectModel(NewsWebsiteConfig.name)
    private readonly websiteConfigModel: Model<NewsWebsiteConfigDocument>,
    @InjectModel(ExtractedNoticia.name)
    private readonly extractedNoticiaModel: Model<ExtractedNoticiaDocument>,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.log('🤖 News Website Service initialized');
  }

  /**
   * 🔍 EXTRAER URLs DE NOTICIAS DESDE LISTADO
   */
  async extractNewsUrls(configId: Types.ObjectId): Promise<string[]> {
    this.logger.log(`🔍 Extracting news URLs for config: ${configId}`);

    try {
      const config = await this.websiteConfigModel.findById(configId);
      if (!config || !config.isActive) {
        throw new Error(`Config ${configId} not found or not active`);
      }

      // Obtener HTML del listado de noticias
      const response = await axios.get(config.listingUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GeneratorPro/1.0)',
          ...config.customHeaders,
        },
        timeout: config.extractionSettings?.timeout || 30000,
      });

      const $ = cheerio.load(response.data);

      // Extraer URLs usando selector configurado
      const extractedUrls: string[] = [];
      const articleLinks = $(config.listingSelectors.articleLinks);

      articleLinks.each((index, element) => {
        let url = $(element).attr('href');

        // 🆕 Si no hay href, intentar extraer de onclick
        if (!url) {
          const onclick = $(element).attr('onclick');
          if (onclick) {
            // Soportar patrones comunes de onclick:
            // - getURL('url')
            // - window.location.href='url'
            // - location.href='url'
            const onclickPatterns = [
              /getURL\(['"]([^'"]+)['"]\)/,
              /window\.location\.href\s*=\s*['"]([^'"]+)['"]/,
              /location\.href\s*=\s*['"]([^'"]+)['"]/,
              /window\.open\(['"]([^'"]+)['"]/,
            ];

            for (const pattern of onclickPatterns) {
              const match = onclick.match(pattern);
              if (match && match[1]) {
                url = match[1];
                this.logger.debug(`Extracted URL from onclick: ${url}`);
                break;
              }
            }
          }
        }

        if (!url) return;

        // Convertir URL relativa a absoluta si es necesario
        if (url.startsWith('/')) {
          url = new URL(url, config.baseUrl).toString();
        }

        // Validar que la URL pertenece al dominio
        try {
          const urlObj = new URL(url);
          const baseUrlObj = new URL(config.baseUrl);
          if (urlObj.hostname === baseUrlObj.hostname) {
            extractedUrls.push(url);
          }
        } catch (error) {
          this.logger.warn(`Invalid URL found: ${url}`);
        }
      });

      // Filtrar URLs duplicadas
      const uniqueUrls = [...new Set(extractedUrls)];

      // Filtrar URLs ya extraídas si está configurado
      let finalUrls = uniqueUrls;
      if (config.extractionSettings?.duplicateFilter !== false) {
        finalUrls = await this.filterExistingUrls(uniqueUrls);
      }

      // Aplicar límite si está configurado
      const maxUrls = config.extractionSettings?.maxUrlsPerRun || finalUrls.length;
      finalUrls = finalUrls.slice(0, maxUrls);

      this.logger.log(`✅ Extracted ${finalUrls.length} URLs from ${config.name}`);

      // Actualizar estadísticas
      await this.updateExtractionStats(configId, {
        totalUrlsExtracted: (config.statistics?.totalUrlsExtracted || 0) + finalUrls.length,
        lastExtractionAt: new Date(),
      });

      this.eventEmitter.emit('generator-pro.urls.extracted', {
        configId,
        websiteName: config.name,
        urlsCount: finalUrls.length,
        timestamp: new Date(),
      });

      return finalUrls;

    } catch (error) {
      this.logger.error(`❌ Failed to extract URLs for config ${configId}: ${error.message}`);

      this.eventEmitter.emit('generator-pro.urls.extraction_failed', {
        configId,
        error: error.message,
        timestamp: new Date(),
      });

      throw error;
    }
  }

  /**
   * 📰 EXTRAER CONTENIDO DE NOTICIA ESPECÍFICA
   */
  async extractNewsContent(
    url: string,
    configId: Types.ObjectId
  ): Promise<ExtractedNews> {
    this.logger.log(`📰 Extracting content from: ${url}`);

    try {
      const config = await this.websiteConfigModel.findById(configId);
      if (!config) {
        throw new Error(`Config ${configId} not found`);
      }

      // Obtener HTML de la noticia
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GeneratorPro/1.0)',
          ...config.customHeaders,
        },
        timeout: config.extractionSettings?.timeout || 30000,
      });

      const $ = cheerio.load(response.data);
      const selectors = config.contentSelectors;

      // Extraer datos usando selectores configurados
      const extractedNews: ExtractedNews = {
        title: this.extractText($, selectors.titleSelector),
        content: this.extractText($, selectors.contentSelector),
        images: this.extractImages($, selectors.imageSelector),
      };

      // Extraer campos opcionales
      if (selectors.dateSelector) {
        extractedNews.publishedAt = this.extractDate($, selectors.dateSelector);
      }

      if (selectors.authorSelector) {
        extractedNews.author = this.extractText($, selectors.authorSelector);
      }

      if (selectors.categorySelector) {
        extractedNews.category = this.extractText($, selectors.categorySelector);
      }

      if (selectors.excerptSelector) {
        extractedNews.excerpt = this.extractText($, selectors.excerptSelector);
      }

      if (selectors.tagsSelector) {
        extractedNews.tags = this.extractTags($, selectors.tagsSelector);
      }

      // Validar que se extrajo contenido mínimo requerido
      if (!extractedNews.title || !extractedNews.content) {
        throw new Error('Failed to extract minimum required content (title, content)');
      }

      // Limpiar y procesar contenido
      extractedNews.title = this.cleanText(extractedNews.title);
      extractedNews.content = this.cleanText(extractedNews.content);

      if (extractedNews.excerpt) {
        extractedNews.excerpt = this.cleanText(extractedNews.excerpt);
      }

      // Agregar metadata adicional
      extractedNews.metadata = {
        sourceUrl: url,
        domain: new URL(url).hostname,
        extractedAt: new Date(),
        configId: configId.toString(),
        contentLength: extractedNews.content.length,
        imageCount: extractedNews.images.length,
      };

      this.logger.log(`✅ Content extracted successfully from: ${url}`);

      this.eventEmitter.emit('generator-pro.content.extracted', {
        configId,
        url,
        contentLength: extractedNews.content.length,
        imagesFound: extractedNews.images.length,
        timestamp: new Date(),
      });

      return extractedNews;

    } catch (error) {
      this.logger.error(`❌ Failed to extract content from ${url}: ${error.message}`);

      this.eventEmitter.emit('generator-pro.content.extraction_failed', {
        configId,
        url,
        error: error.message,
        timestamp: new Date(),
      });

      throw error;
    }
  }

  /**
   * ✅ VALIDAR SELECTORES CSS DE UNA CONFIGURACIÓN
   */
  async validateSelectors(config: NewsWebsiteConfig): Promise<ValidationResult> {
    this.logger.log(`✅ Validating selectors for: ${config.name}`);

    const issues: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    try {
      // Validar que los selectores obligatorios están presentes
      if (!config.listingSelectors?.articleLinks) {
        issues.push('Missing required selector: listingSelectors.articleLinks');
      }

      if (!config.contentSelectors?.titleSelector) {
        issues.push('Missing required selector: contentSelectors.titleSelector');
      }

      if (!config.contentSelectors?.contentSelector) {
        issues.push('Missing required selector: contentSelectors.contentSelector');
      }

      // Validar formato de selectores CSS
      const allSelectors = [
        config.listingSelectors?.articleLinks,
        config.contentSelectors?.titleSelector,
        config.contentSelectors?.contentSelector,
        config.contentSelectors?.imageSelector,
        config.contentSelectors?.authorSelector,
      ].filter(Boolean);

      for (const selector of allSelectors) {
        try {
          // Intentar crear un selector con cheerio para validar sintaxis
          cheerio.load('<div></div>')(selector as string);
        } catch (error) {
          issues.push(`Invalid CSS selector: ${selector}`);
        }
      }

      // Validar URLs
      try {
        new URL(config.baseUrl);
        new URL(config.listingUrl);
      } catch (error) {
        issues.push('Invalid URL format in baseUrl or listingUrl');
      }

      // Generar sugerencias
      if (!config.contentSelectors?.imageSelector) {
        suggestions.push('Consider adding imageSelector for better media extraction');
      }

      if (!config.contentSelectors?.dateSelector) {
        suggestions.push('Consider adding dateSelector for better content organization');
      }

      if (!config.extractionSettings?.respectRobots) {
        warnings.push('Consider enabling respectRobots setting for ethical scraping');
      }

      const result: ValidationResult = {
        isValid: issues.length === 0,
        issues,
        warnings,
        suggestions,
      };

      this.logger.log(`Validation completed for ${config.name}: ${result.isValid ? 'VALID' : 'INVALID'}`);

      return result;

    } catch (error) {
      this.logger.error(`Failed to validate selectors: ${error.message}`);
      return {
        isValid: false,
        issues: [`Validation failed: ${error.message}`],
        warnings: [],
        suggestions: [],
      };
    }
  }

  /**
   * 🧪 PROBAR EXTRACCIÓN CON CONFIGURACIÓN ESPECÍFICA
   */
  async testExtraction(config: NewsWebsiteConfig & { _id: Types.ObjectId }): Promise<TestResult> {
    const startTime = Date.now();

    this.logger.log(`🧪 Testing extraction for: ${config.name}`);

    const result: TestResult = { success: false };

    try {
      // Test 1: Extracción de URLs desde listado
      this.logger.log('Testing URL extraction...');
      const extractedUrls = await this.extractNewsUrls(config._id);

      result.listingTest = {
        urlsFound: extractedUrls.length,
        sampleUrls: extractedUrls.slice(0, 5), // Primeras 5 URLs como muestra
      };

      if (extractedUrls.length === 0) {
        result.listingTest.errors = ['No URLs found with current selectors'];
        result.errorMessage = 'URL extraction failed';
        result.duration = Date.now() - startTime;
        return result;
      }

      // Test 2: Extracción de contenido de la primera URL
      this.logger.log('Testing content extraction...');
      const sampleUrl = extractedUrls[0];
      const extractedContent = await this.extractNewsContent(sampleUrl, config._id);

      result.contentTest = {
        sampleContent: extractedContent,
      };

      // Validar calidad del contenido extraído
      const contentIssues: string[] = [];

      if (!extractedContent.title || extractedContent.title.length < 10) {
        contentIssues.push('Title too short or missing');
      }

      if (!extractedContent.content || extractedContent.content.length < 100) {
        contentIssues.push('Content too short or missing');
      }

      if (extractedContent.images.length === 0) {
        contentIssues.push('No images extracted');
      }

      if (contentIssues.length > 0) {
        result.contentTest.errors = contentIssues;
      }

      result.success = contentIssues.length === 0;
      result.duration = Date.now() - startTime;

      this.logger.log(`✅ Test completed for ${config.name}: ${result.success ? 'SUCCESS' : 'PARTIAL'}`);

      return result;

    } catch (error) {
      this.logger.error(`❌ Test failed for ${config.name}: ${error.message}`);

      result.errorMessage = error.message;
      result.duration = Date.now() - startTime;

      return result;
    }
  }

  /**
   * 🧪 MÉTODOS DE TESTING AVANZADO
   */

  async testListingSelectors(dto: TestListingSelectorsDto): Promise<TestListingResponseDto> {
    const startTime = Date.now();

    this.logger.log(`🧪 Testing listing selectors for: ${dto.baseUrl}`);

    try {
      // Obtener HTML del listado de noticias
      const response = await axios.get(dto.listingUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GeneratorPro/1.0)',
        },
        timeout: 30000,
      });

      const $ = cheerio.load(response.data);
      const extractedUrls: ExtractedUrlDto[] = [];

      // Extraer URLs usando selector configurado
      const articleLinks = $(dto.listingSelectors.articleLinks);

      articleLinks.each((index, element) => {
        let url = $(element).attr('href');

        // 🆕 Si no hay href, intentar extraer de onclick
        if (!url) {
          const onclick = $(element).attr('onclick');
          if (onclick) {
            // Soportar patrones comunes de onclick:
            // - getURL('url')
            // - window.location.href='url'
            // - location.href='url'
            const onclickPatterns = [
              /getURL\(['"]([^'"]+)['"]\)/,
              /window\.location\.href\s*=\s*['"]([^'"]+)['"]/,
              /location\.href\s*=\s*['"]([^'"]+)['"]/,
              /window\.open\(['"]([^'"]+)['"]/,
            ];

            for (const pattern of onclickPatterns) {
              const match = onclick.match(pattern);
              if (match && match[1]) {
                url = match[1];
                this.logger.debug(`Extracted URL from onclick: ${url}`);
                break;
              }
            }
          }
        }

        if (!url) return;

        // Convertir URL relativa a absoluta si es necesario
        if (url.startsWith('/')) {
          url = new URL(url, dto.baseUrl).toString();
        }

        // Validar que la URL pertenece al dominio
        try {
          const urlObj = new URL(url);
          const baseUrlObj = new URL(dto.baseUrl);
          if (urlObj.hostname === baseUrlObj.hostname) {
            const extractedUrl: ExtractedUrlDto = { url };

            // Extraer título si hay selector
            if (dto.listingSelectors.titleSelector) {
              extractedUrl.title = $(element).closest('article, .post, .news-item')
                .find(dto.listingSelectors.titleSelector).first().text().trim() ||
                $(element).text().trim();
            }

            // Extraer imagen si hay selector
            if (dto.listingSelectors.imageSelector) {
              extractedUrl.image = $(element).closest('article, .post, .news-item')
                .find(dto.listingSelectors.imageSelector).first().attr('src');
            }

            extractedUrls.push(extractedUrl);
          }
        } catch (error) {
          this.logger.warn(`Invalid URL found: ${url}`);
        }
      });

      // Aplicar límite si está configurado
      const finalUrls = dto.limit ? extractedUrls.slice(0, dto.limit) : extractedUrls;

      return {
        extractedUrls: finalUrls,
        totalUrls: finalUrls.length,
        processingTime: Date.now() - startTime,
        success: finalUrls.length > 0,
        error: finalUrls.length === 0 ? 'No URLs found with current selectors' : undefined,
      };

    } catch (error) {
      this.logger.error(`❌ Failed to test listing selectors: ${error.message}`);

      return {
        extractedUrls: [],
        totalUrls: 0,
        processingTime: Date.now() - startTime,
        success: false,
        error: error.message,
      };
    }
  }

  async testIndividualContent(dto: TestIndividualContentDto): Promise<TestContentResponseDto> {
    const startTime = Date.now();

    this.logger.log(`🧪 Testing content extraction from: ${dto.testUrl}`);

    try {
      // Obtener HTML de la noticia
      const response = await axios.get(dto.testUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GeneratorPro/1.0)',
        },
        timeout: 30000,
      });

      const $ = cheerio.load(response.data);
      const selectors = dto.contentSelectors;

      // Extraer datos usando selectores configurados
      const extractedContent: ExtractedContentDto = {
        url: dto.testUrl,
      };

      // Extraer contenido requerido
      if (selectors.titleSelector) {
        extractedContent.title = this.extractText($, selectors.titleSelector);
      }

      if (selectors.contentSelector) {
        extractedContent.content = this.extractText($, selectors.contentSelector);
      }

      // Extraer campos opcionales
      if (selectors.imageSelector) {
        extractedContent.images = this.extractImages($, selectors.imageSelector);
      }

      if (selectors.dateSelector) {
        const date = this.extractDate($, selectors.dateSelector);
        extractedContent.publishedAt = date?.toISOString();
      }

      if (selectors.authorSelector) {
        extractedContent.author = this.extractText($, selectors.authorSelector);
      }

      if (selectors.categorySelector) {
        extractedContent.category = this.extractText($, selectors.categorySelector);
      }

      if (selectors.tagsSelector) {
        extractedContent.tags = this.extractTags($, selectors.tagsSelector);
      }

      // Limpiar contenido
      if (extractedContent.title) {
        extractedContent.title = this.cleanText(extractedContent.title);
      }
      if (extractedContent.content) {
        extractedContent.content = this.cleanText(extractedContent.content);
      }

      // Validar calidad del contenido
      const issues: string[] = [];

      if (!extractedContent.title || extractedContent.title.length < 10) {
        issues.push('Title too short or missing');
      }

      if (!extractedContent.content || extractedContent.content.length < 100) {
        issues.push('Content too short or missing');
      }

      const success = issues.length === 0;

      return {
        extractedContent,
        processingTime: Date.now() - startTime,
        success,
        error: success ? undefined : issues.join(', '),
        details: success ? 'Content extracted successfully' : `Issues found: ${issues.join(', ')}`,
      };

    } catch (error) {
      this.logger.error(`❌ Failed to test individual content: ${error.message}`);

      return {
        extractedContent: { url: dto.testUrl },
        processingTime: Date.now() - startTime,
        success: false,
        error: error.message,
        details: 'Failed to extract content from URL',
      };
    }
  }

  /**
   * 🔍 MÉTODOS AUXILIARES PRIVADOS
   */

  private async filterExistingUrls(urls: string[]): Promise<string[]> {
    const existingUrls = await this.extractedNoticiaModel.find({
      sourceUrl: { $in: urls },
    }, { sourceUrl: 1 });

    const existingSet = new Set(existingUrls.map(doc => doc.sourceUrl));
    return urls.filter(url => !existingSet.has(url));
  }

  private async updateExtractionStats(
    configId: Types.ObjectId,
    updates: Record<string, unknown>
  ): Promise<void> {
    await this.websiteConfigModel.findByIdAndUpdate(configId, {
      $set: {
        [`statistics.${Object.keys(updates).join('`, `statistics.`')}`]: Object.values(updates),
      },
    });
  }

  private extractText($: cheerio.CheerioAPI, selector: string): string {
    const element = $(selector).first();

    // Clonar el elemento para no modificar el DOM original
    const cloned = element.clone();

    // Eliminar elementos no deseados
    cloned.find('script, style, noscript, iframe, .ad, .ad-lat, .ad-lat2, .ad-box').remove();

    return cloned.text().trim();
  }

  private extractImages($: cheerio.CheerioAPI, selector?: string): string[] {
    if (!selector) return [];

    const images: string[] = [];
    $(selector).each((_, element) => {
      // Intentar obtener src o data-src (imágenes tradicionales)
      let src = $(element).attr('src') || $(element).attr('data-src');

      // Si no hay src, intentar extraer de background-image en style
      if (!src) {
        const style = $(element).attr('style');
        if (style) {
          // Extraer URL de background-image: url('...')
          const bgMatch = style.match(/background-image:\s*url\(['"]?([^'")\s]+)['"]?\)/);
          if (bgMatch && bgMatch[1]) {
            src = bgMatch[1];
          }
        }
      }

      if (src) {
        images.push(src);
      }
    });

    return images;
  }

  private extractDate($: cheerio.CheerioAPI, selector: string): Date | undefined {
    const dateText = this.extractText($, selector);
    if (!dateText) return undefined;

    try {
      const date = new Date(dateText);
      return isNaN(date.getTime()) ? undefined : date;
    } catch {
      return undefined;
    }
  }

  private extractTags($: cheerio.CheerioAPI, selector: string): string[] {
    const tags: string[] = [];
    $(selector).each((_, element) => {
      const tag = $(element).text().trim();
      if (tag) {
        tags.push(tag);
      }
    });

    return tags;
  }

  private cleanText(text: string): string {
    return text
      // Remover código JavaScript que pueda quedar
      .replace(/\(function\s*\(.*?\)\s*\{[\s\S]*?\}\)\s*\(\s*\)\s*;?/g, '')
      .replace(/window\._JS_MODULES[\s\S]*?;/g, '')
      .replace(/document\.getElementsByTagName[\s\S]*?;/g, '')
      .replace(/var\s+\w+\s*=[\s\S]*?;/g, '')
      // Limpiar espacios y saltos de línea
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();
  }

  // 🔗 MÉTODOS PARA 6-TAB WORKFLOW - PERSISTENCIA BD

  /**
   * 🔗 Save extracted URL to database
   * Guarda URL extraída en la BD
   */
  async saveExtractedUrl(data: {
    sourceUrl: string;
    websiteConfigId: Types.ObjectId;
    status: string;
    title?: string;
    content?: string;
    author?: string;
    publishedAt?: Date;
    category?: string;
    extractedAt: Date;
  }): Promise<ExtractedNoticiaDocument> {
    try {
      const domain = new URL(data.sourceUrl).hostname;
      const extractedNoticia = new this.extractedNoticiaModel({
        sourceUrl: data.sourceUrl,
        domain: domain,
        title: data.title || '',
        content: data.content || '',
        author: data.author,
        publishedAt: data.publishedAt,
        category: data.category,
        extractedAt: data.extractedAt,
        status: data.status,
        websiteConfigId: data.websiteConfigId,
        images: [],
        categories: [],
        tags: [],
        rawData: {}
      });
      return await extractedNoticia.save();
    } catch (error) {
      console.error(`❌ Error saving extracted URL:`, error);
      throw error;
    }
  }

  /**
   * 🔍 Find website by ID
   * Busca configuración de sitio web por ID
   */
  async findById(websiteId: string): Promise<NewsWebsiteConfigDocument | null> {
    try {
      return await this.websiteConfigModel.findById(websiteId).exec();
    } catch (error) {
      console.error(`❌ Error finding website by ID:`, error);
      return null;
    }
  }

  /**
   * 🔗 Extract URLs manually
   * Extrae URLs manualmente de un sitio
   */
  async extractUrlsManually(websiteId: string): Promise<string[]> {
    try {
      const config = await this.findById(websiteId);
      if (!config) {
        throw new Error('Website configuration not found');
      }

      return await this.extractNewsUrls(config._id as Types.ObjectId);
    } catch (error) {
      console.error(`❌ Error extracting URLs manually:`, error);
      throw error;
    }
  }

  /**
   * 📋 Find URL by URL string
   * Busca URL por string para evitar duplicados
   */
  async findByUrl(url: string): Promise<ExtractedNoticiaDocument | null> {
    try {
      return await this.extractedNoticiaModel.findOne({ sourceUrl: url }).exec();
    } catch (error) {
      console.error(`❌ Error finding URL:`, error);
      return null;
    }
  }

  /**
   * 📊 Count extracted URLs with filters
   * Cuenta URLs extraídas con filtros
   */
  async countExtractedUrls(filters: any): Promise<number> {
    try {
      return await this.extractedNoticiaModel.countDocuments(filters).exec();
    } catch (error) {
      console.error(`❌ Error counting URLs:`, error);
      return 0;
    }
  }

  /**
   * 📋 Find extracted URLs with pagination and filters
   * Busca URLs extraídas con paginación y filtros
   */
  async findExtractedUrls(
    filters: any,
    options: {
      limit?: number;
      skip?: number;
      sort?: any;
    } = {}
  ): Promise<ExtractedNoticiaDocument[]> {
    try {
      const query = this.extractedNoticiaModel.find(filters);

      if (options.sort) {
        query.sort(options.sort);
      }

      if (options.skip) {
        query.skip(options.skip);
      }

      if (options.limit) {
        query.limit(options.limit);
      }

      return await query.exec();
    } catch (error) {
      console.error(`❌ Error finding extracted URLs:`, error);
      return [];
    }
  }

  /**
   * ⏰ Update last extraction run timestamp
   * Actualiza timestamp de última extracción
   */
  async updateLastExtractionRun(websiteId: string): Promise<void> {
    try {
      await this.websiteConfigModel.findByIdAndUpdate(
        websiteId,
        {
          lastExtractionRun: new Date(),
          updatedAt: new Date()
        }
      ).exec();
    } catch (error) {
      console.error(`❌ Error updating last extraction run:`, error);
    }
  }
}