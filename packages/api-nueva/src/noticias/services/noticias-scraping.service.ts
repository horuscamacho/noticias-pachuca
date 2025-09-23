import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import { createHash } from 'crypto';

import { PuppeteerManagerService } from '../../modules/reports/services/puppeteer-manager.service';
import { CacheService } from '../../services/cache.service';
import {
  NoticiasConfig,
  ScrapingResult,
  ExtractedContent,
  QualityMetrics,
} from '../interfaces/noticias.interfaces';

/**
 * 🔍 Servicio principal de scraping de noticias
 * Implementa extracción usando Cheerio (estático) y Puppeteer (dinámico)
 */
@Injectable()
export class NoticiasScrapingService {
  private readonly logger = new Logger(NoticiasScrapingService.name);
  private readonly cachePrefix = 'noticias:scraping:';
  private readonly defaultCacheTtl = 1800; // 30 minutos

  // User agents para rotation
  private readonly userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
  ];

  constructor(
    private readonly configService: ConfigService,
    private readonly puppeteerService: PuppeteerManagerService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * 🎯 Extraer contenido de una URL usando configuración
   */
  async extractFromUrl(url: string, config: NoticiasConfig): Promise<ScrapingResult> {
    const startTime = Date.now();
    this.logger.log(`Starting extraction for URL: ${url} using config: ${config.name}`);

    try {
      // Validar URL
      if (!this.isValidUrl(url)) {
        throw new Error(`Invalid URL format: ${url}`);
      }

      // Verificar cache primero
      const cacheKey = this.generateCacheKey(url, config) + ':debug3'; // Incrementado para invalidar cache anterior
      this.logger.log(`🔑 Cache key for ${url}: ${cacheKey}`);

      const cached = await this.cacheService.get<ScrapingResult>(cacheKey);
      if (cached) {
        this.logger.warn(`⚠️ CACHE HIT for URL: ${url} - returning cached result from ${cached.metadata.finalUrl}`);
        return cached;
      }

      this.logger.log(`🆕 CACHE MISS for URL: ${url} - will fetch fresh content`);

      // Rate limiting
      await this.enforceRateLimit(config.domain, config.extractionSettings.rateLimit || 30);

      let result: ScrapingResult;

      // Decidir método de extracción basado en configuración
      if (config.extractionSettings.useJavaScript) {
        this.logger.debug(`Using Puppeteer for JavaScript-enabled extraction: ${url}`);
        try {
          result = await this.extractWithPuppeteer(url, config);
        } catch (error) {
          this.logger.warn(`Puppeteer failed for ${url}, fallback to Cheerio: ${error.message}`);
          result = await this.extractWithCheerio(url, config);
        }
      } else {
        this.logger.debug(`Using Cheerio for static extraction: ${url}`);
        result = await this.extractWithCheerio(url, config);
      }

      // Calcular tiempo total
      result.metadata.processingTime = Date.now() - startTime;

      // Cachear resultado si es exitoso
      if (result.success) {
        await this.cacheService.set(cacheKey, result, this.defaultCacheTtl);
      }

      this.logger.log(
        `Extraction completed for ${url}: ${result.success ? 'SUCCESS' : 'FAILED'} ` +
        `(${result.metadata.processingTime}ms, ${result.metadata.method})`
      );

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;

      this.logger.error(`Extraction failed for URL ${url}: ${error.message}`);

      return {
        success: false,
        metadata: {
          method: config.extractionSettings.useJavaScript ? 'puppeteer' : 'cheerio',
          processingTime,
          httpStatus: 500,
          contentLength: 0,
          imagesFound: 0,
          url,
        },
        error: {
          message: error.message,
          code: error.code || 'EXTRACTION_ERROR',
          type: this.categorizeError(error.message),
          details: { stack: error.stack },
        },
      };
    }
  }

  /**
   * 🌐 Extracción con Cheerio (contenido estático)
   */
  private async extractWithCheerio(url: string, config: NoticiasConfig): Promise<ScrapingResult> {
    const startTime = Date.now();
    this.logger.log(`🕷️ Starting Cheerio extraction for: ${url}`);

    try {
      // Configurar headers
      const headers = {
        'User-Agent': this.getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        ...config.customHeaders,
      };

      this.logger.log(`📡 Making HTTP request to: ${url}`);

      // Realizar request HTTP
      const response: AxiosResponse<string> = await axios.get(url, {
        headers,
        timeout: config.extractionSettings.timeout || 30000,
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 400,
      });

      const finalUrl = response.request?.responseURL || response.config.url || url;
      this.logger.log(`📡 HTTP Response: ${response.status} ${response.statusText}`);
      this.logger.log(`🔗 Final URL after redirects: ${finalUrl}`);
      this.logger.log(`🔗 Original URL: ${url}`);

      if (finalUrl !== url) {
        this.logger.warn(`⚠️ REDIRECT DETECTED: ${url} -> ${finalUrl}`);
      }

      // Esperar si es necesario
      if (config.extractionSettings.waitTime) {
        await this.delay(config.extractionSettings.waitTime);
      }

      // Cargar HTML con Cheerio
      const $ = cheerio.load(response.data);

      // Extraer contenido usando selectores
      const extractedData = this.extractContentWithSelectors($, config.selectors, url);

      // Log del contenido extraído para debugging
      this.logger.log(`✅ Cheerio extraction results for ${url}:`);
      this.logger.log(`📝 Title: "${extractedData.title}" (length: ${extractedData.title.length})`);
      this.logger.log(`📄 Content: "${extractedData.content.substring(0, 200)}..." (length: ${extractedData.content.length})`);
      this.logger.log(`🖼️ Images found: ${extractedData.images.length}`);
      if (extractedData.publishedAt) {
        this.logger.log(`📅 Published: ${extractedData.publishedAt}`);
      }
      if (extractedData.author) {
        this.logger.log(`👤 Author: ${extractedData.author}`);
      }

      // Calcular métricas de calidad
      const qualityMetrics = this.calculateQualityMetrics(extractedData, response.data);

      return {
        success: true,
        data: extractedData,
        metadata: {
          method: 'cheerio',
          processingTime: Date.now() - startTime,
          httpStatus: response.status,
          contentLength: extractedData.content.length,
          imagesFound: extractedData.images.length,
          url,
          finalUrl,
        },
        qualityMetrics,
        warnings: this.generateWarnings(extractedData, $),
      };

    } catch (error) {
      throw new Error(`Cheerio extraction failed: ${error.message}`);
    }
  }

  /**
   * 🎭 Extracción con Puppeteer (contenido dinámico)
   */
  private async extractWithPuppeteer(url: string, config: NoticiasConfig): Promise<ScrapingResult> {
    const startTime = Date.now();

    try {
      // Obtener HTML renderizado con Puppeteer
      const htmlContent = await this.getRenderedHtml(url, config);

      // Procesar con Cheerio el HTML renderizado
      const $ = cheerio.load(htmlContent);

      // Extraer contenido usando selectores
      const extractedData = this.extractContentWithSelectors($, config.selectors, url);

      // Calcular métricas de calidad
      const qualityMetrics = this.calculateQualityMetrics(extractedData, htmlContent);

      return {
        success: true,
        data: extractedData,
        metadata: {
          method: 'puppeteer',
          processingTime: Date.now() - startTime,
          httpStatus: 200,
          contentLength: extractedData.content.length,
          imagesFound: extractedData.images.length,
          url,
        },
        qualityMetrics,
        warnings: this.generateWarnings(extractedData, $),
      };

    } catch (error) {
      throw new Error(`Puppeteer extraction failed: ${error.message}`);
    }
  }

  /**
   * 📄 Obtener HTML renderizado con Puppeteer
   */
  private async getRenderedHtml(url: string, config: NoticiasConfig): Promise<string> {
    this.logger.debug(`Getting rendered HTML for: ${url}`);

    try {
      // Usar PuppeteerManagerService para obtener HTML renderizado
      const html = await this.puppeteerService.getRenderedHTML(url, {
        waitTime: config.extractionSettings.waitTime,
        timeout: config.extractionSettings.timeout || 30000,
        useJavaScript: config.extractionSettings.useJavaScript || true,
      });

      this.logger.debug(`Successfully rendered HTML for ${url} (${html.length} chars)`);

      return html;

    } catch (error) {
      this.logger.error(`Failed to render HTML for ${url}: ${error.message}`);
      throw new Error(`Failed to render page: ${error.message}`);
    }
  }

  /**
   * 🔍 Extraer contenido usando selectores CSS
   */
  private extractContentWithSelectors(
    $: cheerio.CheerioAPI,
    selectors: NoticiasConfig['selectors'],
    sourceUrl: string
  ): ExtractedContent {
    const domain = new URL(sourceUrl).hostname;

    // Debug: Verificar qué elementos encuentra cada selector
    this.logger.debug(`🔍 Debugging selectors for ${sourceUrl}:`);
    this.logger.debug(`📝 Title selector "${selectors.title}": Found ${$(selectors.title).length} elements`);
    this.logger.debug(`📄 Content selector "${selectors.content}": Found ${$(selectors.content).length} elements`);

    // Log algunos elementos h1 disponibles para debugging
    const h1Elements = $('h1');
    this.logger.debug(`🏷️ Available H1 elements (${h1Elements.length}):`);
    h1Elements.each((i, el) => {
      if (i < 3) { // Solo los primeros 3
        const classes = $(el).attr('class') || 'no-class';
        const text = $(el).text().trim().substring(0, 100);
        this.logger.debug(`  H1[${i}]: class="${classes}" text="${text}"`);
      }
    });

    // Título (requerido)
    const title = this.extractText($, selectors.title).trim();
    if (!title) {
      throw new Error(`No title found using selector: ${selectors.title}`);
    }

    // Contenido (requerido)
    const content = this.extractText($, selectors.content).trim();
    if (!content) {
      throw new Error(`No content found using selector: ${selectors.content}`);
    }

    // Imágenes (opcional)
    const images = this.extractImages($, selectors.images || [], sourceUrl);

    // Fecha de publicación (opcional)
    const publishedAt = selectors.publishedAt
      ? this.extractDate($, selectors.publishedAt)
      : undefined;

    // Autor (opcional)
    const author = selectors.author
      ? this.extractText($, selectors.author).trim() || undefined
      : undefined;

    // Categorías (opcional)
    const categories = this.extractTextArray($, selectors.categories || []);

    // Extracto (opcional)
    const excerpt = selectors.excerpt
      ? this.extractText($, selectors.excerpt).trim() || undefined
      : undefined;

    // Tags (opcional)
    const tags = this.extractTextArray($, selectors.tags || []);

    return {
      title,
      content,
      images,
      publishedAt,
      author,
      categories,
      excerpt,
      tags,
      sourceUrl,
      domain,
    };
  }

  /**
   * 📝 Extraer texto de un selector
   */
  private extractText($: cheerio.CheerioAPI, selector: string): string {
    const element = $(selector);
    if (element.length === 0) return '';

    // Limpiar texto: remover scripts, styles, espacios extra
    element.find('script, style').remove();
    return element.text().replace(/\s+/g, ' ').trim();
  }

  /**
   * 📝 Extraer array de textos de múltiples selectores
   */
  private extractTextArray($: cheerio.CheerioAPI, selectors: string[]): string[] {
    const results: string[] = [];

    for (const selector of selectors) {
      $(selector).each((_, element) => {
        const text = $(element).text().trim();
        if (text && !results.includes(text)) {
          results.push(text);
        }
      });
    }

    return results;
  }

  /**
   * 🖼️ Extraer URLs de imágenes
   */
  private extractImages($: cheerio.CheerioAPI, selectors: string[], baseUrl: string): string[] {
    const images: string[] = [];
    const base = new URL(baseUrl);

    for (const selector of selectors) {
      $(selector).each((_, element) => {
        // Extraer de atributos tradicionales
        const src = $(element).attr('src') || $(element).attr('data-src') || $(element).attr('data-lazy');

        if (src) {
          this.addImageUrl(images, src, base);
        }

        // Extraer de background-image en style
        const style = $(element).attr('style');
        if (style) {
          const backgroundImageMatch = style.match(/background-image:\s*url\(['"]?([^'")]+)['"]?\)/);
          if (backgroundImageMatch && backgroundImageMatch[1]) {
            this.addImageUrl(images, backgroundImageMatch[1], base);
          }
        }

        // También buscar en elementos img anidados
        $(element).find('img').each((_, imgElement) => {
          const imgSrc = $(imgElement).attr('src') || $(imgElement).attr('data-src') || $(imgElement).attr('data-lazy');
          if (imgSrc) {
            this.addImageUrl(images, imgSrc, base);
          }
        });
      });
    }

    return images;
  }

  /**
   * 🔗 Helper para agregar URL de imagen validada
   */
  private addImageUrl(images: string[], src: string, base: URL): void {
    try {
      // Convertir URLs relativas a absolutas
      const imageUrl = src.startsWith('http') ? src : new URL(src, base.origin).href;

      // Filtrar imágenes muy pequeñas (probablemente iconos)
      const isValidImage = !src.includes('icon') &&
                         !src.includes('logo') &&
                         !src.includes('pixel') &&
                         !src.includes('1x1');

      if (isValidImage && !images.includes(imageUrl)) {
        images.push(imageUrl);
        this.logger.debug(`🖼️ Image found: ${imageUrl}`);
      }
    } catch (error) {
      this.logger.debug(`Invalid image URL: ${src}`);
    }
  }

  /**
   * 📅 Extraer fecha de publicación
   */
  private extractDate($: cheerio.CheerioAPI, selector: string): Date | undefined {
    const dateText = this.extractText($, selector);
    if (!dateText) return undefined;

    try {
      // Intentar parsear la fecha
      const date = new Date(dateText);
      return isNaN(date.getTime()) ? undefined : date;
    } catch {
      return undefined;
    }
  }

  /**
   * 📊 Calcular métricas de calidad
   */
  private calculateQualityMetrics(data: ExtractedContent, htmlContent: string): QualityMetrics {
    const titleQuality = data.title.length > 10 && data.title.length < 200 ? 'high' :
                        data.title.length > 5 ? 'medium' : 'low';

    const contentQuality = data.content.length > 500 ? 'high' :
                          data.content.length > 200 ? 'medium' : 'low';

    const completeness = Math.min(100, (
      (data.title ? 25 : 0) +
      (data.content ? 25 : 0) +
      (data.images.length > 0 ? 15 : 0) +
      (data.publishedAt ? 10 : 0) +
      (data.author ? 10 : 0) +
      (data.categories.length > 0 ? 10 : 0) +
      (data.excerpt ? 5 : 0)
    ));

    const confidence = Math.min(100, (
      (titleQuality === 'high' ? 30 : titleQuality === 'medium' ? 20 : 10) +
      (contentQuality === 'high' ? 40 : contentQuality === 'medium' ? 25 : 10) +
      (data.images.length > 0 ? 15 : 0) +
      (data.publishedAt ? 10 : 0) +
      (data.author ? 5 : 0)
    ));

    return {
      titleQuality: titleQuality as 'good' | 'fair' | 'poor',
      contentQuality: contentQuality as 'good' | 'fair' | 'poor',
      titleLength: data.title.length,
      contentLength: data.content.length,
      imageQuality: data.images.length > 2 ? 'high' : data.images.length > 0 ? 'medium' : 'low',
      completeness,
      confidence,
      structureScore: Math.min(100, htmlContent.length / 1000), // Simple heuristic
    };
  }

  /**
   * ⚠️ Generar warnings
   */
  private generateWarnings(data: ExtractedContent, $: cheerio.CheerioAPI): string[] {
    const warnings: string[] = [];

    if (data.title.length < 10) {
      warnings.push('Title seems too short');
    }
    if (data.title.length > 200) {
      warnings.push('Title seems too long');
    }
    if (data.content.length < 100) {
      warnings.push('Content seems too short');
    }
    if (data.images.length === 0) {
      warnings.push('No images found');
    }
    if (!data.publishedAt) {
      warnings.push('No publication date found');
    }
    if (!data.author) {
      warnings.push('No author found');
    }

    return warnings;
  }

  /**
   * 🔑 Generar clave de cache
   */
  private generateCacheKey(url: string, config: NoticiasConfig): string {
    // Usar SHA-256 para garantizar uniqueness, luego truncar el hash (no la URL)
    const urlHash = createHash('sha256').update(url).digest('hex').substring(0, 16);
    const configHash = createHash('sha256').update(JSON.stringify(config.selectors)).digest('hex').substring(0, 8);
    const cacheKey = `${this.cachePrefix}${config.domain}:${urlHash}:${configHash}`;

    this.logger.debug(`🔧 Cache key generation for ${url}: urlHash=${urlHash}, configHash=${configHash}`);

    return cacheKey;
  }

  /**
   * 🚦 Enforcer rate limiting
   */
  private async enforceRateLimit(domain: string, requestsPerMinute: number): Promise<void> {
    const rateLimitKey = `rate_limit:${domain}`;
    const currentCount = await this.cacheService.get<number>(rateLimitKey) || 0;

    if (currentCount >= requestsPerMinute) {
      throw new Error(`Rate limit exceeded for domain ${domain}: ${currentCount}/${requestsPerMinute} requests per minute`);
    }

    await this.cacheService.set(rateLimitKey, currentCount + 1, 60); // TTL 1 minuto
  }

  /**
   * 🎲 Obtener User-Agent aleatorio
   */
  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  /**
   * ✅ Validar URL
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 🕒 Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 🔍 Categorizar error
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