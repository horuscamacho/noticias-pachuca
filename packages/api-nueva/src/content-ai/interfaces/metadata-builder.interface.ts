/**
 * Metadata Builder Interfaces
 * Structures for building clean, professional metadata for editorial images
 *
 * RESPONSABILIDAD:
 * - Generar altText descriptivo y accesible
 * - Crear caption editorial profesional
 * - Extraer keywords relevantes (sin instrucciones técnicas)
 * - NUNCA incluir instrucciones de branding en metadata
 *
 * REGLAS APLICADAS:
 * ✅ NO usa any (todos los tipos explícitos)
 * ✅ Interfaces bien documentadas
 * ✅ Separación limpia de concerns
 */

import { ContentAnalysisResult } from './content-analysis.interface';

/**
 * Input para construir metadata
 * CRÍTICO: Usar basePrompt (limpio), NUNCA fullPrompt (con branding)
 */
export interface MetadataBuilderInput {
  /**
   * Prompt editorial limpio (SIN instrucciones de branding)
   * Este es el basePrompt de BrandingResult
   */
  basePrompt: string;

  /**
   * Resultado del análisis de contenido
   * Usado para contexto y relevancia
   */
  contentAnalysis: ContentAnalysisResult;

  /**
   * Título original de la noticia
   * Usado para caption y keywords
   */
  originalTitle: string;

  /**
   * Outlet name (opcional)
   * Para contexto adicional en caption
   */
  outletName?: string;
}

/**
 * Opciones de construcción de metadata
 */
export interface MetadataBuilderOptions {
  /**
   * Incluir contexto extendido en altText (default: true)
   */
  includeExtendedContext?: boolean;

  /**
   * Longitud máxima de altText (default: 125 caracteres)
   * WAI-ARIA recomienda <125 chars para screen readers
   */
  maxAltTextLength?: number;

  /**
   * Longitud máxima de caption (default: 200 caracteres)
   */
  maxCaptionLength?: number;

  /**
   * Número máximo de keywords a extraer (default: 10)
   */
  maxKeywords?: number;

  /**
   * Idioma de metadata (default: 'es')
   */
  language?: 'es' | 'en';

  /**
   * Incluir category como keyword (default: true)
   */
  includeCategoryKeyword?: boolean;
}

/**
 * Resultado de construcción de metadata
 * CRÍTICO: Todo el contenido debe ser LIMPIO (sin instrucciones técnicas)
 */
export interface MetadataBuilderResult {
  /**
   * Alt text para accesibilidad
   * - Descriptivo y conciso (<125 chars recomendado)
   * - En español (o idioma especificado)
   * - SIN instrucciones técnicas
   * - Enfocado en contenido editorial
   */
  altText: string;

  /**
   * Caption editorial profesional
   * - Contexto narrativo
   * - Referencia al artículo original
   * - SIN instrucciones técnicas
   * - Estilo periodístico
   */
  caption: string;

  /**
   * Keywords relevantes
   * - Extraídos del análisis de contenido
   * - SIN términos técnicos de fotografía
   * - Enfocados en temática editorial
   * - En español (o idioma especificado)
   */
  keywords: string[];

  /**
   * Metadata de construcción
   */
  metadata: {
    /**
     * Longitud de altText en caracteres
     */
    altTextLength: number;

    /**
     * Longitud de caption en caracteres
     */
    captionLength: number;

    /**
     * Número de keywords generados
     */
    keywordCount: number;

    /**
     * Idioma usado
     */
    language: string;

    /**
     * Timestamp de generación
     */
    generatedAt: Date;

    /**
     * Versión del metadata builder
     * Para tracking de cambios futuros
     */
    builderVersion: string;
  };
}
