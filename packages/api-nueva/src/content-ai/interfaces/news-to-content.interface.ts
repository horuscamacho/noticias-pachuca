/**
 * 📰 Interfaces específicas para flujo de noticias → contenido AI
 * Flujo simplificado con estructura estática
 */

export type EditorialLine = 'neutral' | 'izquierda' | 'derecha' | 'crítica';

/**
 * 🎯 Request principal para generar contenido desde noticias
 */
export interface NewsToContentRequest {
  title: string; // Título de la noticia original (obligatorio)
  content: string; // Contenido de la noticia original (obligatorio)
  templateId: string; // ID del template/agente a usar (obligatorio)
  referenceContent?: string; // Contenido de referencia para contexto político (opcional)
  priority?: number; // Prioridad del job (1-10, default: 5)
  description?: string; // Descripción del trabajo
}

/**
 * 🏗️ Output estandarizado que SIEMPRE debe devolver el AI
 */
export interface StandardizedAIOutput {
  title: string; // Título reescrito por el agente
  content: string; // Contenido transformado por el agente
  keywords: string[]; // Keywords SEO generadas (mínimo 3, máximo 10)
  tags: string[]; // Tags relevantes (mínimo 2, máximo 8)
  category: string; // Categoría asignada automáticamente
  summary: string; // Resumen ejecutivo (máximo 200 caracteres)
}

/**
 * 🤖 Configuración específica del agente editorial
 */
export interface AgentConfiguration {
  editorialLine: EditorialLine; // Línea editorial del agente
  politicalIntensity: number; // Intensidad política 0-100%
  agentPersonality: string; // Personalidad específica del agente
  canHandlePolitics: boolean; // Si puede manejar contenido político
  requiresReference: boolean; // Si requiere contenido de referencia obligatorio
}

/**
 * 🔧 Estructura estática obligatoria para prompts
 */
export interface StaticPromptStructure {
  inputStructure: {
    title: string; // Siempre recibe título
    content: string; // Siempre recibe contenido
    referenceContent?: string; // Opcional: contenido de referencia
  };
  outputStructure: StandardizedAIOutput; // Formato de salida fijo
  agentConfig: AgentConfiguration; // Configuración del agente
}

/**
 * 📋 Response del endpoint de generación
 */
export interface NewsToContentResponse {
  jobId: string; // ID del trabajo de generación
  status: 'pending' | 'processing' | 'completed' | 'failed';
  generatedContent?: StandardizedAIOutput; // Contenido generado (si está completo)
  originalInput: {
    title: string;
    content: string;
    referenceContent?: string;
  };
  templateUsed: {
    id: string;
    name: string;
    agentPersona: string;
  };
  processing: {
    startedAt?: Date;
    completedAt?: Date;
    processingTime?: number; // ms
    tokensUsed?: number;
    cost?: number;
  };
  errors?: string[];
  warnings?: string[];
}

/**
 * ✅ Validación de request
 */
export interface NewsToContentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  templateInfo: {
    exists: boolean;
    isActive: boolean;
    canHandlePolitics: boolean;
    requiresReference: boolean;
  };
  estimatedCost?: number;
  estimatedProcessingTime?: number; // ms
}

/**
 * 🔍 Filtros para buscar contenido generado desde noticias
 */
export interface NewsGeneratedContentFilters {
  templateId?: string;
  editorialLine?: EditorialLine;
  dateFrom?: Date;
  dateTo?: Date;
  category?: string;
  hasErrors?: boolean;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
}

/**
 * 📊 Estadísticas de generación de contenido
 */
export interface ContentGenerationStats {
  totalGenerated: number;
  byEditorialLine: Record<EditorialLine, number>;
  byCategory: Record<string, number>;
  averageProcessingTime: number; // ms
  successRate: number; // 0-100%
  totalCost: number;
  averageCost: number;
  topTemplates: Array<{
    templateId: string;
    name: string;
    usageCount: number;
    successRate: number;
  }>;
}