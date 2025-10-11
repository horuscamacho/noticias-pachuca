/**
 * Editorial Prompt Interfaces
 * Structures for building professional editorial photography prompts
 *
 * REGLAS APLICADAS:
 * ✅ NO usa any (todos los tipos explícitos)
 * ✅ Interfaces bien documentadas
 */

import { ContentAnalysisResult } from './content-analysis.interface';

/**
 * Tipos de templates editoriales disponibles
 * Cada uno optimizado para diferentes tipos de contenido
 */
export type EditorialTemplateType = 'portrait' | 'scene' | 'conceptual' | 'documentary';

/**
 * Estética editorial de referencia
 */
export type EditorialAesthetic = 'time-magazine' | 'the-economist' | 'national-geographic' | 'reuters-news';

/**
 * Setup de iluminación profesional
 */
export type LightingSetup = 'three-point' | 'softbox' | 'natural-window' | 'dramatic-side' | 'flat-even' | 'golden-hour';

/**
 * Composición fotográfica
 */
export type CompositionStyle = 'rule-of-thirds' | 'centered' | 'dynamic-diagonal' | 'leading-lines' | 'frame-within-frame';

/**
 * Tipo de shot fotográfico
 */
export type ShotType = 'close-up' | 'medium-shot' | 'full-body' | 'wide-angle' | 'environmental-portrait';

/**
 * Configuración de cámara y lens
 */
export interface CameraSetup {
  /**
   * Cámara profesional
   * Ejemplo: "Canon R5", "Sony A7R IV", "Nikon Z9"
   */
  camera: string;

  /**
   * Lens y aperture
   * Ejemplo: "85mm f/1.8", "24-70mm f/2.8", "50mm f/1.4"
   */
  lens: string;

  /**
   * Configuración adicional (opcional)
   * Ejemplo: "shallow depth of field", "wide depth of field"
   */
  settings?: string;
}

/**
 * Template de prompt editorial
 */
export interface EditorialPromptTemplate {
  /**
   * Tipo de template
   */
  type: EditorialTemplateType;

  /**
   * Nombre descriptivo del template
   */
  name: string;

  /**
   * Descripción del uso apropiado
   */
  description: string;

  /**
   * Setup de cámara por defecto
   */
  defaultCamera: CameraSetup;

  /**
   * Setup de iluminación por defecto
   */
  defaultLighting: LightingSetup;

  /**
   * Composición por defecto
   */
  defaultComposition: CompositionStyle;

  /**
   * Tipo de shot por defecto
   */
  defaultShot: ShotType;

  /**
   * Estética de referencia
   */
  aesthetic: EditorialAesthetic;

  /**
   * Keywords técnicos siempre incluidos
   */
  technicalKeywords: string[];

  /**
   * Categorías apropiadas para este template
   */
  appropriateCategories: string[];
}

/**
 * Input para construir prompt editorial
 */
export interface EditorialPromptInput {
  /**
   * Resultado del análisis de contenido (requerido)
   */
  contentAnalysis: ContentAnalysisResult;

  /**
   * Título original de la noticia (requerido)
   */
  originalTitle: string;

  /**
   * Template específico a usar (opcional)
   * Si no se especifica, se selecciona automáticamente
   */
  templateType?: EditorialTemplateType;

  /**
   * Overrides de configuración (opcional)
   */
  overrides?: {
    camera?: CameraSetup;
    lighting?: LightingSetup;
    composition?: CompositionStyle;
    shot?: ShotType;
    aesthetic?: EditorialAesthetic;
  };
}

/**
 * Opciones para construcción de prompt
 */
export interface EditorialPromptOptions {
  /**
   * Incluir especificaciones técnicas detalladas (default: true)
   */
  includeTechnicalSpecs?: boolean;

  /**
   * Incluir referencia de estética (default: true)
   */
  includeAestheticReference?: boolean;

  /**
   * Incluir instrucciones de composición (default: true)
   */
  includeCompositionGuide?: boolean;

  /**
   * Incluir negative space para headlines (default: true)
   */
  includeNegativeSpace?: boolean;

  /**
   * Longitud máxima del prompt (default: 500 caracteres)
   */
  maxLength?: number;
}

/**
 * Resultado de construcción de prompt editorial
 */
export interface EditorialPromptResult {
  /**
   * Prompt final construido (ready para OpenAI)
   */
  prompt: string;

  /**
   * Template usado
   */
  templateUsed: EditorialTemplateType;

  /**
   * Configuración aplicada
   */
  configuration: {
    camera: CameraSetup;
    lighting: LightingSetup;
    composition: CompositionStyle;
    shot: ShotType;
    aesthetic: EditorialAesthetic;
  };

  /**
   * Elementos visuales incluidos en el prompt
   */
  visualElements: string[];

  /**
   * Metadata de construcción
   */
  metadata: {
    /**
     * Longitud del prompt en caracteres
     */
    promptLength: number;

    /**
     * Tokens estimados (aprox)
     */
    estimatedTokens: number;

    /**
     * Template seleccionado automáticamente
     */
    autoSelected: boolean;

    /**
     * Razón de selección del template
     */
    selectionReason: string;

    /**
     * Timestamp de construcción
     */
    builtAt: Date;
  };
}
