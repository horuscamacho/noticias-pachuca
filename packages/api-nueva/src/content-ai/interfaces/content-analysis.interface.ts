/**
 * Content Analysis Interfaces
 * Structures for AI-powered content analysis for editorial image generation
 *
 * REGLAS APLICADAS:
 * ✅ NO usa any (todos los tipos explícitos)
 * ✅ Interfaces bien documentadas
 */

/**
 * Resultado del análisis de contenido
 * Estructura que extrae el contexto narrativo de una noticia
 */
export interface ContentAnalysisResult {
  /**
   * Sujeto principal de la noticia
   * Ejemplo: "Municipal official", "Healthcare workers", "Local entrepreneur"
   */
  mainSubject: string;

  /**
   * Acción o evento principal
   * Ejemplo: "announcing infrastructure projects", "protesting working conditions"
   */
  action: string;

  /**
   * Ubicación o contexto geográfico
   * Ejemplo: "city hall", "hospital entrance", "downtown plaza"
   * null si no es relevante
   */
  location: string | null;

  /**
   * Tono narrativo de la historia
   * Ejemplo: "serious", "hopeful", "urgent", "celebratory"
   */
  tone: 'serious' | 'hopeful' | 'urgent' | 'celebratory' | 'neutral' | 'dramatic' | 'inspiring';

  /**
   * Elementos visuales clave a capturar en la imagen
   * Ejemplo: ["professional attire", "documents on desk", "city skyline in background"]
   */
  visualElements: string[];

  /**
   * Tema/categoría principal
   * Ejemplo: "politics", "health", "economy", "social", "sports"
   */
  category: 'politics' | 'health' | 'economy' | 'social' | 'sports' | 'culture' | 'technology' | 'general';

  /**
   * Contexto adicional relevante
   * Ejemplo: "announcement made during press conference", "part of ongoing campaign"
   * null si no hay contexto adicional
   */
  context: string | null;

  /**
   * Metadata del análisis
   */
  metadata: {
    /**
     * Modelo usado para el análisis
     */
    model: string;

    /**
     * Tokens consumidos
     */
    tokensUsed: number;

    /**
     * Costo del análisis en USD
     */
    cost: number;

    /**
     * Tiempo de procesamiento en ms
     */
    processingTime: number;

    /**
     * Timestamp del análisis
     */
    analyzedAt: Date;
  };
}

/**
 * Input para el análisis de contenido
 */
export interface ContentAnalysisInput {
  /**
   * Título de la noticia (requerido)
   */
  title: string;

  /**
   * Contenido/cuerpo de la noticia (opcional pero recomendado)
   * Si se provee, el análisis será más preciso
   */
  content?: string;

  /**
   * Categoría sugerida (opcional)
   * Si se provee, ayuda a orientar el análisis
   */
  suggestedCategory?: string;
}

/**
 * Opciones para el análisis
 */
export interface ContentAnalysisOptions {
  /**
   * Modelo a usar (default: gpt-4o-mini)
   */
  model?: string;

  /**
   * Máximo de elementos visuales a extraer (default: 5)
   */
  maxVisualElements?: number;

  /**
   * Incluir contexto extendido (default: true)
   */
  includeContext?: boolean;
}
