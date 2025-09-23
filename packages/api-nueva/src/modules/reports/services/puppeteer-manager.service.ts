/**
 * 🎭 PUPPETEER MANAGER SERVICE
 * Servicio universal para gestión optimizada de Puppeteer con cache inteligente
 * Soporte para múltiples formatos y configuraciones avanzadas
 */

import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as puppeteer from 'puppeteer';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PageSize, PageOrientation } from '../enums';

export interface PDFOptions {
  format: PageSize;
  landscape: boolean;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  printBackground?: boolean;
  displayHeaderFooter?: boolean;
  preferCSSPageSize?: boolean;
  quality?: number;
  timeout?: number;
  scale?: number;
  width?: string;
  height?: string;
}

export interface BrowserMetrics {
  isReady: boolean;
  activePages: number;
  maxPages: number;
  memoryUsage?: puppeteer.Metrics;
  version?: string;
  uptime: number;
  totalPagesGenerated: number;
  averageGenerationTime: number;
  errorRate: number;
}

@Injectable()
export class PuppeteerManagerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PuppeteerManagerService.name);
  private browser: puppeteer.Browser | null = null;
  private isInitialized = false;
  private readonly maxConcurrentPages: number;
  private activePages = 0;
  private readonly cachePrefix = 'pdf:';
  private readonly cacheTtl = 1800; // 30 minutos
  private startTime = Date.now();
  private totalPages = 0;
  private totalTime = 0;
  private errorCount = 0;

  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.maxConcurrentPages = this.configService.get('reports.maxConcurrentJobs', 5);
  }

  async onModuleInit() {
    await this.initializeBrowser();
  }

  async onModuleDestroy() {
    await this.closeBrowser();
  }

  /**
   * 🚀 Generar PDF desde HTML con cache inteligente
   */
  async generatePDF(html: string, options: PDFOptions): Promise<Buffer> {
    const startTime = Date.now();
    this.logger.log('Generating PDF with Puppeteer');

    try {
      // Generar hash para cache
      const cacheKey = this.generateCacheKey(html, options);

      // Verificar cache primero
      const cached = await this.cacheManager.get<Buffer>(cacheKey);
      if (cached) {
        this.logger.debug(`PDF cache hit: ${cacheKey}`);
        return cached;
      }

      // Verificar que el browser esté disponible
      await this.ensureBrowserReady();

      // Verificar límite de páginas concurrentes
      if (this.activePages >= this.maxConcurrentPages) {
        throw new BadRequestException(
          `Max concurrent pages limit reached (${this.maxConcurrentPages}). Please try again later.`,
        );
      }

      this.activePages++;

      // Crear nueva página
      const page = await this.browser!.newPage();

      try {
        // Configurar viewport para renderizado consistente
        await page.setViewport({
          width: options.landscape ? 1123 : 794, // A4 en píxeles
          height: options.landscape ? 794 : 1123,
          deviceScaleFactor: 2, // Mayor calidad
        });

        // Configurar timeouts y errores
        await page.setDefaultTimeout(options.timeout || 30000);

        // Interceptar errores de consola para debugging
        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            this.logger.warn(`Browser console error: ${msg.text()}`);
          }
        });

        // Configurar content y esperar a que cargue completamente
        await page.setContent(html, {
          waitUntil: ['load', 'domcontentloaded', 'networkidle0'],
          timeout: options.timeout || 30000,
        });

        // Generar PDF con opciones configuradas
        const pdfBuffer = await page.pdf({
          format: this.mapPageSize(options.format),
          landscape: options.landscape,
          margin: {
            top: `${options.margin.top}px`,
            right: `${options.margin.right}px`,
            bottom: `${options.margin.bottom}px`,
            left: `${options.margin.left}px`,
          },
          printBackground: options.printBackground ?? true,
          displayHeaderFooter: options.displayHeaderFooter ?? false,
          preferCSSPageSize: options.preferCSSPageSize ?? true,
          scale: options.scale || 1,
          width: options.width,
          height: options.height,
          timeout: options.timeout || 60000,
        });

        const generationTime = Date.now() - startTime;

        // Actualizar métricas
        this.totalPages++;
        this.totalTime += generationTime;

        // Guardar en cache
        await this.cacheManager.set(cacheKey, pdfBuffer, this.cacheTtl * 1000);

        this.logger.log(
          `PDF generated successfully in ${generationTime}ms (${pdfBuffer.length} bytes)`,
        );

        return pdfBuffer as Buffer;
      } finally {
        // Siempre cerrar la página
        await page.close();
        this.activePages--;
      }
    } catch (error) {
      this.activePages--;
      this.errorCount++;
      this.logger.error(`PDF generation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 📊 Obtener métricas completas del browser
   */
  async getBrowserMetrics(): Promise<BrowserMetrics> {
    const uptime = Date.now() - this.startTime;
    const averageTime = this.totalPages > 0 ? this.totalTime / this.totalPages : 0;
    const errorRate = this.totalPages > 0 ? (this.errorCount / this.totalPages) * 100 : 0;

    const baseMetrics: BrowserMetrics = {
      isReady: this.isInitialized && this.browser !== null,
      activePages: this.activePages,
      maxPages: this.maxConcurrentPages,
      uptime,
      totalPagesGenerated: this.totalPages,
      averageGenerationTime: Math.round(averageTime),
      errorRate: Number(errorRate.toFixed(2)),
    };

    try {
      if (this.browser) {
        const version = await this.browser.version();
        const pages = await this.browser.pages();

        // Intentar obtener métricas de memoria de una página activa
        let memoryUsage: puppeteer.Metrics | undefined;
        if (pages.length > 0) {
          try {
            memoryUsage = await pages[0].metrics();
          } catch {
            // Ignorar errores de métricas
          }
        }

        return {
          ...baseMetrics,
          version,
          activePages: pages.length,
          memoryUsage,
        };
      }
    } catch (error) {
      this.logger.warn(`Could not get browser metrics: ${error.message}`);
    }

    return baseMetrics;
  }

  /**
   * 🔄 Reinicializar browser (útil para recovery)
   */
  async restartBrowser(): Promise<void> {
    this.logger.log('Restarting Puppeteer browser');

    try {
      await this.closeBrowser();

      // Reset métricas
      this.startTime = Date.now();
      this.totalPages = 0;
      this.totalTime = 0;
      this.errorCount = 0;

      await this.initializeBrowser();
      this.logger.log('Browser restarted successfully');
    } catch (error) {
      this.logger.error(`Failed to restart browser: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🏥 Verificar salud del browser
   */
  async checkHealth(): Promise<boolean> {
    try {
      if (!this.browser || !this.isInitialized) {
        return false;
      }

      // Crear página de prueba simple
      const page = await this.browser.newPage();
      await page.setContent('<html><body><h1>Health Check</h1></body></html>');
      await page.close();

      return true;
    } catch (error) {
      this.logger.warn(`Browser health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * 🌐 Obtener HTML renderizado de una URL
   */
  async getRenderedHTML(url: string, options?: {
    waitForSelector?: string;
    waitTime?: number;
    timeout?: number;
    useJavaScript?: boolean;
  }): Promise<string> {
    const startTime = Date.now();
    this.logger.log(`Getting rendered HTML from: ${url}`);

    // Retry logic para mayor estabilidad
    let lastError: Error = new Error('Unknown error');
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await this.ensureBrowserReady();

        if (this.activePages >= this.maxConcurrentPages) {
          throw new BadRequestException(
            `Max concurrent pages limit reached (${this.maxConcurrentPages}). Please try again later.`,
          );
        }

        this.activePages++;
        const page = await this.browser!.newPage();

        try {
          // Configurar viewport
          await page.setViewport({
            width: 1280,
            height: 1024,
            deviceScaleFactor: 1,
          });

          // Configurar timeout más conservador
          const timeout = Math.min(options?.timeout || 20000, 20000);
          await page.setDefaultTimeout(timeout);

          // Configurar user agent para evitar detección de bot
          await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          );

          // Bloquear recursos pesados para mayor estabilidad
          await page.setRequestInterception(true);
          page.on('request', (request) => {
            const resourceType = request.resourceType();
            if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
              request.abort();
            } else {
              request.continue();
            }
          });

          // Navegar a la URL con configuración conservadora
          await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout,
          });

          // Esperar selector específico si se proporciona
          if (options?.waitForSelector) {
            try {
              await page.waitForSelector(options.waitForSelector, { timeout: 5000 });
            } catch (error) {
              this.logger.warn(`Selector not found: ${options.waitForSelector}`);
            }
          }

          // Esperar tiempo adicional si se especifica (máximo 2 segundos)
          if (options?.waitTime) {
            const waitTime = Math.min(options.waitTime, 2000);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }

          // Obtener HTML renderizado
          const html = await page.content();

          const renderTime = Date.now() - startTime;
          this.logger.log(`HTML rendered successfully in ${renderTime}ms for ${url} (attempt ${attempt})`);

          return html;
        } finally {
          try {
            await page.close();
          } catch (e) {
            this.logger.warn('Error closing page:', e.message);
          }
          this.activePages--;
        }
      } catch (error) {
        this.activePages--;
        lastError = error;
        this.logger.warn(`Attempt ${attempt} failed for ${url}: ${error.message}`);

        if (attempt < 2) {
          // Reiniciar browser si hay problemas de conexión
          if (error.message.includes('Connection closed') || error.message.includes('disconnected')) {
            this.logger.log('Browser connection issue detected, restarting...');
            await this.restartBrowser();
          }
          await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo antes del retry
        }
      }
    }

    this.logger.error(`Failed to get rendered HTML from ${url} after 2 attempts: ${lastError.message}`);
    throw lastError;
  }

  /**
   * 🔧 MÉTODOS PRIVADOS
   */

  /**
   * 🚀 Inicializar browser con configuración optimizada
   */
  private async initializeBrowser(): Promise<void> {
    if (this.isInitialized && this.browser) {
      return;
    }

    this.logger.log('Initializing Puppeteer browser');

    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--no-first-run',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          // Optimizaciones de memoria
          '--memory-pressure-off',
          '--max_old_space_size=1024',
        ],
        timeout: 60000, // 60 segundos para inicializar
        defaultViewport: {
          width: 1280,
          height: 1024,
          deviceScaleFactor: 1,
        },
        ignoreDefaultArgs: ['--disable-extensions'],
      });

      // Event listeners para monitoreo
      this.browser.on('disconnected', () => {
        this.logger.warn('Browser disconnected unexpectedly');
        this.isInitialized = false;
        this.browser = null;
      });

      this.browser.on('targetcreated', () => {
        this.logger.debug('New browser target created');
      });

      this.browser.on('targetdestroyed', () => {
        this.logger.debug('Browser target destroyed');
      });

      this.isInitialized = true;
      this.activePages = 0;

      this.logger.log(
        `Puppeteer browser initialized successfully. Version: ${await this.browser.version()}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to initialize browser: ${error.message}`,
        error.stack,
      );
      this.isInitialized = false;
      this.browser = null;
      throw error;
    }
  }

  /**
   * 🔒 Cerrar browser de forma segura
   */
  private async closeBrowser(): Promise<void> {
    if (!this.browser) {
      return;
    }

    this.logger.log('Closing Puppeteer browser');

    try {
      // Cerrar todas las páginas abiertas
      const pages = await this.browser.pages();
      await Promise.all(pages.map((page) => page.close().catch(() => {})));

      // Cerrar browser
      await this.browser.close();

      this.browser = null;
      this.isInitialized = false;
      this.activePages = 0;

      this.logger.log('Browser closed successfully');
    } catch (error) {
      this.logger.error(`Error closing browser: ${error.message}`);
      // Forzar limpieza
      this.browser = null;
      this.isInitialized = false;
      this.activePages = 0;
    }
  }

  /**
   * ✅ Asegurar que el browser esté listo
   */
  private async ensureBrowserReady(): Promise<void> {
    if (!this.isInitialized || !this.browser) {
      await this.initializeBrowser();
    }

    // Verificar salud del browser
    const isHealthy = await this.checkHealth();
    if (!isHealthy) {
      this.logger.warn('Browser is not healthy, restarting...');
      await this.restartBrowser();
    }
  }

  /**
   * 🗺️ Mapear PageSize enum a formato Puppeteer
   */
  private mapPageSize(pageSize: PageSize): puppeteer.PaperFormat {
    switch (pageSize) {
      case PageSize.A4:
        return 'A4';
      case PageSize.A3:
        return 'A3';
      case PageSize.LETTER:
        return 'Letter';
      case PageSize.LEGAL:
        return 'Legal';
      default:
        return 'A4';
    }
  }

  /**
   * 🔐 Generar clave de cache para PDF
   */
  private generateCacheKey(html: string, options: PDFOptions): string {
    const optionsHash = JSON.stringify({
      format: options.format,
      landscape: options.landscape,
      margin: options.margin,
      printBackground: options.printBackground,
      scale: options.scale,
    });

    const htmlHash = Buffer.from(html).toString('base64').substring(0, 32);
    const configHash = Buffer.from(optionsHash).toString('base64').substring(0, 16);

    return `${this.cachePrefix}${htmlHash}-${configHash}`;
  }

  /**
   * 🧹 Limpiar cache de PDFs
   */
  async clearCache(): Promise<number> {
    await this.cacheManager.clear();
    return 0; // Cache limpiado
  }

  /**
   * 📈 Obtener estadísticas de rendimiento
   */
  getPerformanceStats(): {
    totalPages: number;
    averageTime: number;
    errorRate: number;
    uptime: number;
  } {
    const uptime = Date.now() - this.startTime;
    const averageTime = this.totalPages > 0 ? this.totalTime / this.totalPages : 0;
    const errorRate = this.totalPages > 0 ? (this.errorCount / this.totalPages) * 100 : 0;

    return {
      totalPages: this.totalPages,
      averageTime: Math.round(averageTime),
      errorRate: Number(errorRate.toFixed(2)),
      uptime,
    };
  }

  /**
   * ⚡ Precargar browser (útil para warming up)
   */
  async warmUp(): Promise<void> {
    this.logger.log('Warming up Puppeteer browser');

    try {
      await this.ensureBrowserReady();

      // Generar un PDF de prueba simple para pre-calentar
      const testHtml = '<html><body><h1>Warmup Test</h1></body></html>';
      const testOptions: PDFOptions = {
        format: PageSize.A4,
        landscape: false,
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
        timeout: 5000,
      };

      const page = await this.browser!.newPage();
      try {
        await page.setContent(testHtml, { waitUntil: 'load', timeout: 5000 });
        await page.pdf({ format: 'A4', timeout: 5000 });
        this.logger.log('Browser warmed up successfully');
      } finally {
        await page.close();
      }
    } catch (error) {
      this.logger.warn(`Browser warmup failed: ${error.message}`);
    }
  }
}
