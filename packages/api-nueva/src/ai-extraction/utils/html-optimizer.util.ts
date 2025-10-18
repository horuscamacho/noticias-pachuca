import * as cheerio from 'cheerio';
import { minify } from 'html-minifier-terser';
import type { AnyNode } from 'domhandler';

/**
 * 🧹 HTML Optimizer Utility
 * Funciones para optimizar HTML antes de enviarlo a OpenAI
 */

export interface HtmlOptimizationOptions {
  removeScripts?: boolean;
  removeStyles?: boolean;
  removeComments?: boolean;
  preserveDataAttributes?: boolean;
  preserveAriaAttributes?: boolean;
  compressWhitespace?: boolean;
}

const DEFAULT_OPTIONS: HtmlOptimizationOptions = {
  removeScripts: true,
  removeStyles: true,
  removeComments: true,
  preserveDataAttributes: true,
  preserveAriaAttributes: true,
  compressWhitespace: true,
};

/**
 * Elimina scripts, styles y otros elementos innecesarios
 */
export function removeUnnecessaryTags(html: string, options = DEFAULT_OPTIONS): string {
  const $ = cheerio.load(html);

  if (options.removeScripts) {
    $('script').remove();
    $('noscript').remove();
  }

  if (options.removeStyles) {
    $('style').remove();
    $('link[rel="stylesheet"]').remove();
  }

  if (options.removeComments) {
    // Cheerio elimina comentarios automáticamente en modo XML
  }

  // Eliminar atributos innecesarios pero preservar importantes
  $('*').each((_, node) => {
    const $el = $(node);

    // Type guard para verificar que el nodo tiene attribs
    if (!('attribs' in node)) return;

    const attrs = (node as AnyNode & { attribs: Record<string, string> }).attribs || {};

    Object.keys(attrs).forEach((attr) => {
      // Eliminar event handlers
      if (attr.startsWith('on')) {
        $el.removeAttr(attr);
      }

      // Eliminar estilos inline (pero preservar estructura)
      if (attr === 'style') {
        $el.removeAttr(attr);
      }

      // Preservar data-* si configurado
      if (!options.preserveDataAttributes && attr.startsWith('data-')) {
        $el.removeAttr(attr);
      }

      // Preservar aria-* si configurado
      if (!options.preserveAriaAttributes && attr.startsWith('aria-')) {
        $el.removeAttr(attr);
      }
    });
  });

  return $.html();
}

/**
 * Preserva solo la estructura semántica importante
 */
export function preserveSemanticStructure(html: string): string {
  const $ = cheerio.load(html);

  // Elementos semánticos a preservar
  const semanticElements = [
    'main',
    'article',
    'section',
    'header',
    'footer',
    'nav',
    'aside',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'p',
    'a',
    'img',
    'figure',
    'figcaption',
    'time',
    'address',
  ];

  // Marcar elementos no semánticos genéricos
  $('div, span').each((_, element) => {
    const $el = $(element);

    // Si tiene class o id importante, mantenerlo
    const hasImportantClass = $el.attr('class')?.match(/(article|post|content|title|author|date|category|image|news)/i);
    const hasImportantId = $el.attr('id')?.match(/(article|post|content|title|author|date|category|image|news)/i);

    if (!hasImportantClass && !hasImportantId) {
      // Si no tiene clases/ids importantes, desenrollar contenido
      // (esto es opcional, por ahora solo lo marcamos)
    }
  });

  return $.html();
}

/**
 * Limpia atributos innecesarios
 */
export function cleanAttributes(html: string): string {
  const $ = cheerio.load(html);

  const attributesToRemove = [
    'onclick',
    'onload',
    'onerror',
    'style',
    // 'width',    // ✅ PRESERVADO: Necesario para que AI identifique dimensiones de imágenes
    // 'height',   // ✅ PRESERVADO: Necesario para que AI identifique dimensiones de imágenes
    'srcset',
    'sizes',
    'loading',
    'decoding',
  ];

  $('*').each((_, element) => {
    const $el = $(element);
    attributesToRemove.forEach((attr) => {
      $el.removeAttr(attr);
    });
  });

  return $.html();
}

/**
 * Comprime whitespace usando html-minifier-terser
 * Con fallback manual si falla el minifier
 */
export async function compressWhitespace(html: string): Promise<string> {
  try {
    return await minify(html, {
      collapseWhitespace: true,
      conservativeCollapse: true,
      preserveLineBreaks: false,
      removeComments: true,
      removeEmptyAttributes: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      useShortDoctype: true,
      minifyCSS: false,
      minifyJS: false,
    });
  } catch (error) {
    // Fallback: compresión manual simple si el minifier falla (HTML mal formado)
    console.warn(`⚠️  HTML minifier falló, usando fallback manual: ${error.message}`);

    return html
      // Remover comentarios HTML
      .replace(/<!--[\s\S]*?-->/g, '')
      // Comprimir múltiples espacios/tabs/newlines a un solo espacio
      .replace(/\s+/g, ' ')
      // Remover espacios entre tags
      .replace(/>\s+</g, '><')
      // Remover espacios al inicio y final
      .trim();
  }
}

/**
 * Función principal: optimiza HTML para reducir tokens
 */
export async function optimizeHtmlForAI(
  html: string,
  options = DEFAULT_OPTIONS,
): Promise<{ optimized: string; stats: HtmlOptimizationStats }> {
  const originalSize = html.length;

  // 1. Eliminar tags innecesarios
  let optimized = removeUnnecessaryTags(html, options);

  // 2. Preservar estructura semántica
  optimized = preserveSemanticStructure(optimized);

  // 3. Limpiar atributos
  optimized = cleanAttributes(optimized);

  // 4. Comprimir whitespace
  if (options.compressWhitespace) {
    optimized = await compressWhitespace(optimized);
  }

  const optimizedSize = optimized.length;
  const reduction = ((originalSize - optimizedSize) / originalSize) * 100;

  return {
    optimized,
    stats: {
      originalSize,
      optimizedSize,
      reductionPercentage: Math.round(reduction * 100) / 100,
      estimatedTokens: estimateTokens(optimized),
    },
  };
}

/**
 * Estima tokens aproximados (1 token ≈ 4 caracteres para HTML)
 */
export function estimateTokens(html: string): number {
  return Math.ceil(html.length / 4);
}

export interface HtmlOptimizationStats {
  originalSize: number;
  optimizedSize: number;
  reductionPercentage: number;
  estimatedTokens: number;
}
