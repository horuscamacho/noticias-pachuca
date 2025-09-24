/**
 * 📝 Interfaces para configuración de templates de prompts
 * Soporte para diferentes tipos editoriales y agentes
 */

export type ContentType = 'noticia' | 'columna' | 'trascendido' | 'seo-metadata';
export type PoliticalLean = 'conservative' | 'progressive' | 'neutral' | 'humor' | 'critical' | 'analytical';

export interface PromptTemplateConfig {
  name: string; // "Reportero Objetivo", "Columnista Humor"
  type: ContentType;
  agentPersona: string; // Personalidad detallada del agente
  promptTemplate: string; // Template con variables {{variable}}
  systemPrompt: string; // Instrucciones de sistema
  outputFormat: OutputFormat;
  variables: string[]; // Variables requeridas
  isActive: boolean;
  politicalLean?: PoliticalLean;
  configuration?: TemplateConfiguration;
  qualityMetrics?: QualityMetrics;
  examples?: TemplateExample[];
  category?: string;
  compatibleProviders: string[];
}

export interface OutputFormat {
  title: string;
  content: string;
  keywords?: string[];
  tags?: string[];
  category?: string;
  summary?: string;
  tone?: string;
  targetAudience?: string;
  estimatedReadTime?: number;
}

export interface TemplateConfiguration {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
}

export interface QualityMetrics {
  averageQualityScore?: number; // 1-10
  usageCount?: number;
  successRate?: number; // %
  averageProcessingTime?: number; // ms
  lastUsed?: Date;
  userRatings?: number[]; // ratings 1-5
}

export interface TemplateExample {
  sampleInput: Record<string, string>;
  expectedOutput: Record<string, string>;
  description?: string;
}

export interface CreatePromptTemplateRequest {
  name: string;
  type: ContentType;
  agentPersona: string;
  promptTemplate: string;
  systemPrompt: string;
  outputFormat: OutputFormat;
  staticInputStructure?: {
    title: string;
    content: string;
    referenceContent?: string;
  };
  staticOutputFormat?: {
    title: string;
    content: string;
    keywords: string[];
    tags: string[];
    category: string;
    summary: string;
  };
  variables: string[];
  isActive?: boolean;
  politicalLean?: PoliticalLean;
  agentConfiguration?: {
    editorialLine: 'neutral' | 'izquierda' | 'derecha' | 'crítica';
    politicalIntensity: number;
    agentPersonality: string;
    canHandlePolitics: boolean;
    requiresReference: boolean;
  };
  configuration?: TemplateConfiguration;
  category?: string;
  compatibleProviders: string[];
  examples?: TemplateExample[];
}

export interface UpdatePromptTemplateRequest {
  name?: string;
  agentPersona?: string;
  promptTemplate?: string;
  systemPrompt?: string;
  outputFormat?: Partial<OutputFormat>;
  variables?: string[];
  isActive?: boolean;
  politicalLean?: PoliticalLean;
  configuration?: Partial<TemplateConfiguration>;
  category?: string;
  compatibleProviders?: string[];
  examples?: TemplateExample[];
}

export interface PromptTemplateResponse {
  id: string;
  name: string;
  type: ContentType;
  agentPersona: string;
  promptTemplate: string;
  systemPrompt: string;
  outputFormat: OutputFormat;
  staticInputStructure?: {
    title: string;
    content: string;
    referenceContent?: string;
  };
  staticOutputFormat?: {
    title: string;
    content: string;
    keywords: string[];
    tags: string[];
    category: string;
    summary: string;
  };
  variables: string[];
  isActive: boolean;
  politicalLean?: PoliticalLean;
  agentConfiguration?: {
    editorialLine: 'neutral' | 'izquierda' | 'derecha' | 'crítica';
    politicalIntensity: number;
    agentPersonality: string;
    canHandlePolitics: boolean;
    requiresReference: boolean;
  };
  configuration?: TemplateConfiguration;
  qualityMetrics?: QualityMetrics;
  examples?: TemplateExample[];
  category?: string;
  compatibleProviders: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateTestRequest {
  templateId: string;
  sampleData: Record<string, string>; // Variables del template con valores
  providerId?: string; // Proveedor específico para test
}

export interface TemplateTestResponse {
  success: boolean;
  generatedContent?: {
    title: string;
    content: string;
    keywords?: string[];
    tags?: string[];
    category?: string;
    summary?: string;
  };
  processingTime: number; // ms
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;
  error?: string;
  warnings?: string[];
}