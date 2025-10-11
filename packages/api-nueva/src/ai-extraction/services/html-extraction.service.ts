import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { optimizeHtmlForAI, HtmlOptimizationStats } from '../utils/html-optimizer.util';

/**
 * 🌐 HTML Extraction Service
 * Servicio para extraer HTML de páginas web con Puppeteer
 */

export interface HtmlExtractionResult {
  html: string;
  optimizedHtml: string;
  stats: HtmlOptimizationStats;
  url: string;
  timestamp: Date;
}

export interface ExtractionOptions {
  waitForSelector?: string;
  waitForTimeout?: number;
  userAgent?: string;
  viewport?: { width: number; height: number };
  executeJavaScript?: boolean;
}

@Injectable()
export class HtmlExtractionService {
  private readonly logger = new Logger(HtmlExtractionService.name);
  private browser: puppeteer.Browser | null = null;

  /**
   * Obtiene instancia del navegador (lazy loading)
   */
  private async getBrowser(): Promise<puppeteer.Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      this.logger.log('🚀 Inicializando navegador Puppeteer...');
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      });
      this.logger.log('✅ Navegador Puppeteer inicializado');
    }
    return this.browser;
  }

  /**
   * Extrae HTML estático (sin esperar carga de JavaScript)
   * Más rápido, menos recursos, ideal para sitios estáticos
   */
  async extractStaticHTML(url: string, options: ExtractionOptions = {}): Promise<HtmlExtractionResult> {
    const startTime = Date.now();
    this.logger.log(`📄 Extrayendo HTML estático de: ${url}`);

    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      // Configurar user agent móvil
      if (options.userAgent) {
        await page.setUserAgent(options.userAgent);
      } else {
        await page.setUserAgent(
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        );
      }

      // Configurar viewport móvil
      if (options.viewport) {
        await page.setViewport(options.viewport);
      } else {
        await page.setViewport({ width: 375, height: 812 }); // iPhone 13 Pro
      }

      // Navegar sin esperar JavaScript
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: options.waitForTimeout || 30000,
      });

      // Esperar selector específico si se proporciona
      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, {
          timeout: 5000,
        }).catch(() => {
          this.logger.warn(`⚠️  Selector "${options.waitForSelector}" no encontrado, continuando...`);
        });
      }

      // Obtener HTML completo
      const html = await page.content();

      // Optimizar HTML
      const { optimized, stats } = await optimizeHtmlForAI(html);

      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ HTML extraído en ${duration}ms | Original: ${stats.originalSize} bytes | Optimizado: ${stats.optimizedSize} bytes (${stats.reductionPercentage}% reducción)`,
      );

      return {
        html,
        optimizedHtml: optimized,
        stats,
        url,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`❌ Error extrayendo HTML de ${url}:`, error.message);
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * Extrae HTML dinámico (espera carga completa de JavaScript)
   * Más lento, más recursos, ideal para SPAs y sitios dinámicos
   */
  async extractDynamicHTML(url: string, options: ExtractionOptions = {}): Promise<HtmlExtractionResult> {
    const startTime = Date.now();
    this.logger.log(`⚡ Extrayendo HTML dinámico de: ${url}`);

    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      // Configurar user agent móvil
      if (options.userAgent) {
        await page.setUserAgent(options.userAgent);
      } else {
        await page.setUserAgent(
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        );
      }

      // Configurar viewport móvil
      if (options.viewport) {
        await page.setViewport(options.viewport);
      } else {
        await page.setViewport({ width: 375, height: 812 }); // iPhone 13 Pro
      }

      // Navegar esperando carga completa
      await page.goto(url, {
        waitUntil: 'networkidle2', // Espera a que no haya más de 2 conexiones de red activas
        timeout: options.waitForTimeout || 30000,
      });

      // Esperar selector específico si se proporciona
      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, {
          timeout: 5000,
        }).catch(() => {
          this.logger.warn(`⚠️  Selector "${options.waitForSelector}" no encontrado, continuando...`);
        });
      }

      // Esperar adicional para asegurar renderizado completo
      await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 1000)));

      // Obtener HTML completo después de JavaScript
      const html = await page.content();

      // Optimizar HTML
      const { optimized, stats } = await optimizeHtmlForAI(html);

      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ HTML dinámico extraído en ${duration}ms | Original: ${stats.originalSize} bytes | Optimizado: ${stats.optimizedSize} bytes (${stats.reductionPercentage}% reducción)`,
      );

      return {
        html,
        optimizedHtml: optimized,
        stats,
        url,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`❌ Error extrayendo HTML dinámico de ${url}:`, error.message);
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * Extrae HTML con estrategia automática (intenta estático, si falla usa dinámico)
   */
  async extractHTML(url: string, options: ExtractionOptions = {}): Promise<HtmlExtractionResult> {
    try {
      // Intentar primero extracción estática (más rápida)
      return await this.extractStaticHTML(url, options);
    } catch (error) {
      this.logger.warn(`⚠️  Extracción estática falló, intentando dinámica...`);
      // Si falla, intentar dinámica
      return await this.extractDynamicHTML(url, options);
    }
  }

  /**
   * Cierra el navegador
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.logger.log('🛑 Navegador Puppeteer cerrado');
    }
  }

  /**
   * Hook de limpieza al destruir el módulo
   */
  async onModuleDestroy() {
    await this.closeBrowser();
  }
}
