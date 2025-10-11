import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { isSelectorValid, isSelectorTooGeneric, calculateSelectorSpecificity } from '../utils/selector-validator.util';

/**
 * ✅ Selector Validator Service
 * Servicio para validar selectores CSS en páginas reales
 */

export interface ListingSelectorValidation {
  valid: boolean;
  urls: string[];
  count: number;
  message?: string;
  specificityScore?: number;
}

export interface ContentSelectorValidation {
  valid: boolean;
  extractedData: {
    title?: string;
    content?: string;
    image?: string;
    date?: string;
    author?: string;
    category?: string;
  };
  message?: string;
}

@Injectable()
export class SelectorValidatorService {
  private readonly logger = new Logger(SelectorValidatorService.name);
  private browser: puppeteer.Browser | null = null;

  /**
   * Obtiene instancia del navegador (lazy loading)
   */
  private async getBrowser(): Promise<puppeteer.Browser> {
    if (!this.browser || !this.browser.isConnected()) {
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
    }
    return this.browser;
  }

  /**
   * Valida selector de listado (links de artículos)
   */
  async validateListingSelector(url: string, selector: string): Promise<ListingSelectorValidation> {
    this.logger.log(`🔍 Validando selector de listado: "${selector}" en ${url}`);

    // Validación sintáctica
    const syntaxCheck = isSelectorValid(selector);
    if (!syntaxCheck.valid) {
      return {
        valid: false,
        urls: [],
        count: 0,
        message: `Selector inválido: ${syntaxCheck.reason}`,
      };
    }

    // Verificar si es muy genérico
    if (isSelectorTooGeneric(selector)) {
      this.logger.warn(`⚠️  Selector muy genérico: "${selector}"`);
    }

    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      // Configurar como móvil
      await page.setUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
      );
      await page.setViewport({ width: 375, height: 812 });

      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Ejecutar selector y extraer URLs
      const links = await page.$$eval(selector, (elements) =>
        elements
          .map((el) => {
            if (el.tagName === 'A') {
              return (el as HTMLAnchorElement).href;
            }
            // Si no es un <a>, buscar dentro
            const anchor = el.querySelector('a');
            return anchor ? anchor.href : null;
          })
          .filter((url): url is string => url !== null),
      );

      this.logger.debug(`🔍 Selector "${selector}" encontró ${links.length} elementos`);

      await page.close();

      // Validaciones
      if (links.length === 0) {
        this.logger.warn(`⚠️  Selector "${selector}" no encontró ningún enlace`);

        return {
          valid: false,
          urls: [],
          count: 0,
          message: 'Selector no encontró ningún enlace. Verifica que el selector sea correcto para la versión móvil de la página.',
        };
      }

      if (links.length < 3) {
        return {
          valid: false,
          urls: links,
          count: links.length,
          message: `Selector encontró muy pocos enlaces (${links.length}). Se esperan al menos 3.`,
        };
      }

      // Filtrar URLs válidas
      const validUrls = links.filter((url) => url.startsWith('http') || url.startsWith('/'));

      if (validUrls.length < 3) {
        return {
          valid: false,
          urls: validUrls,
          count: validUrls.length,
          message: 'Muy pocas URLs válidas encontradas',
        };
      }

      const specificityScore = calculateSelectorSpecificity(selector);

      this.logger.log(
        `✅ Selector válido: ${validUrls.length} enlaces encontrados | Especificidad: ${specificityScore}`,
      );

      return {
        valid: true,
        urls: validUrls.slice(0, 20), // Retornar máximo 20 URLs
        count: validUrls.length,
        message: `${validUrls.length} artículos encontrados`,
        specificityScore,
      };
    } catch (error) {
      await page.close();
      this.logger.error(`❌ Error validando selector: ${error.message}`);
      return {
        valid: false,
        urls: [],
        count: 0,
        message: `Error ejecutando selector: ${error.message}`,
      };
    }
  }

  /**
   * Valida selectores de contenido individual
   */
  async validateContentSelectors(
    url: string,
    selectors: {
      titleSelector: string;
      contentSelector: string;
      imageSelector?: string;
      dateSelector?: string;
      authorSelector?: string;
      categorySelector?: string;
    },
  ): Promise<ContentSelectorValidation> {
    this.logger.log(`📄 Validando selectores de contenido en: ${url}`);

    // Validar sintaxis de selectores requeridos
    const titleCheck = isSelectorValid(selectors.titleSelector);
    if (!titleCheck.valid) {
      return {
        valid: false,
        extractedData: {},
        message: `titleSelector inválido: ${titleCheck.reason}`,
      };
    }

    const contentCheck = isSelectorValid(selectors.contentSelector);
    if (!contentCheck.valid) {
      return {
        valid: false,
        extractedData: {},
        message: `contentSelector inválido: ${contentCheck.reason}`,
      };
    }

    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      // Configurar como móvil
      await page.setUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
      );
      await page.setViewport({ width: 375, height: 812 });

      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Extraer contenido usando selectores
      const extractedData: any = {};

      // Título (requerido)
      try {
        extractedData.title = await page.$eval(selectors.titleSelector, (el) => el.textContent?.trim() || '');
      } catch (error) {
        await page.close();
        return {
          valid: false,
          extractedData: {},
          message: `No se pudo extraer título con selector: ${selectors.titleSelector}`,
        };
      }

      // Contenido (requerido)
      try {
        extractedData.content = await page.$eval(selectors.contentSelector, (el) => el.textContent?.trim() || '');
      } catch (error) {
        await page.close();
        return {
          valid: false,
          extractedData: { title: extractedData.title },
          message: `No se pudo extraer contenido con selector: ${selectors.contentSelector}`,
        };
      }

      // Imagen (opcional)
      if (selectors.imageSelector) {
        try {
          extractedData.image = await page
            .$eval(selectors.imageSelector, (el) => {
              if (el.tagName === 'IMG') {
                return (el as HTMLImageElement).src;
              }
              const img = el.querySelector('img');
              return img ? img.src : null;
            })
            .catch(() => null);
        } catch (error) {
          // Ignorar errores en campos opcionales
        }
      }

      // Fecha (opcional)
      if (selectors.dateSelector) {
        try {
          extractedData.date = await page
            .$eval(selectors.dateSelector, (el) => {
              if (el.tagName === 'TIME') {
                return (el as HTMLTimeElement).dateTime || el.textContent?.trim() || '';
              }
              return el.textContent?.trim() || '';
            })
            .catch(() => null);
        } catch (error) {
          // Ignorar
        }
      }

      // Autor (opcional)
      if (selectors.authorSelector) {
        try {
          extractedData.author = await page
            .$eval(selectors.authorSelector, (el) => el.textContent?.trim() || '')
            .catch(() => null);
        } catch (error) {
          // Ignorar
        }
      }

      // Categoría (opcional)
      if (selectors.categorySelector) {
        try {
          extractedData.category = await page
            .$eval(selectors.categorySelector, (el) => el.textContent?.trim() || '')
            .catch(() => null);
        } catch (error) {
          // Ignorar
        }
      }

      await page.close();

      // Validar que se extrajo contenido mínimo
      if (!extractedData.title || extractedData.title.length < 5) {
        return {
          valid: false,
          extractedData,
          message: 'Título extraído es muy corto o vacío',
        };
      }

      if (!extractedData.content || extractedData.content.length < 50) {
        return {
          valid: false,
          extractedData,
          message: 'Contenido extraído es muy corto (menos de 50 caracteres)',
        };
      }

      this.logger.log(`✅ Selectores de contenido válidos | Título: ${extractedData.title.substring(0, 50)}...`);

      return {
        valid: true,
        extractedData,
        message: 'Contenido extraído exitosamente',
      };
    } catch (error) {
      await page.close();
      this.logger.error(`❌ Error validando selectores de contenido: ${error.message}`);
      return {
        valid: false,
        extractedData: {},
        message: `Error ejecutando selectores: ${error.message}`,
      };
    }
  }

  /**
   * Cierra el navegador
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Hook de limpieza
   */
  async onModuleDestroy() {
    await this.closeBrowser();
  }
}
