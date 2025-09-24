/**
 * 🧙‍♂️ Interfaces para el wizard de generación de prompts
 * El wizard recolecta datos del usuario y el backend genera el prompt con IA
 */

import { EditorialLine, AgentConfiguration } from './news-to-content.interface';

/**
 * 📝 Datos que envía el wizard al backend
 */
export interface WizardPromptRequest {
  // Datos básicos del agente
  agentType: string; // "Reportero", "Columnista", "Trascendido"
  specialization: string; // "Objetivo", "Humor", "Político", etc.

  // Configuración editorial
  editorialLine: EditorialLine;
  politicalIntensity: number; // 0-100%
  agentPersonality: string; // Descripción de personalidad
  canHandlePolitics: boolean;
  requiresReference: boolean;

  // Ejemplos opcionales del usuario
  examples?: Array<{
    input: string; // Ejemplo de input
    expectedOutput: string; // Output esperado
    description?: string; // Descripción del ejemplo
  }>;

  // Instrucciones adicionales del usuario
  additionalInstructions?: string;

  // Metadata del template
  templateName: string; // Nombre que le dará al template
  templateType: 'noticia' | 'columna' | 'trascendido' | 'seo-metadata';
  category?: string; // Categoría opcional
}

/**
 * 🎯 Response del endpoint de generación de prompt
 */
export interface WizardPromptResponse {
  success: boolean;

  // Prompt generado por IA
  generatedPrompt: {
    promptTemplate: string; // Prompt principal con variables {{title}}, {{content}}, {{referenceContent}}
    systemPrompt: string; // Instrucciones del sistema
    reasoning?: string; // Explicación de por qué funciona este prompt
  };

  // Configuración completa del agente
  agentConfiguration: AgentConfiguration;

  // Estructuras estáticas
  staticInputStructure: {
    title: string;
    content: string;
    referenceContent?: string;
  };

  staticOutputFormat: {
    title: string;
    content: string;
    keywords: string[];
    tags: string[];
    category: string;
    summary: string;
  };

  // Metadata del proceso
  processing: {
    aiProvider: string; // Proveedor usado para generar
    tokensUsed: number;
    cost: number;
    processingTime: number; // ms
  };

  // Template preview (para mostrar al usuario antes de crear)
  templatePreview: {
    name: string;
    type: string;
    variables: string[];
    compatibleProviders: string[];
  };

  // Datos para crear el template final
  createTemplateData?: {
    name: string;
    type: 'noticia' | 'columna' | 'trascendido' | 'seo-metadata';
    agentPersona: string;
    promptTemplate: string;
    systemPrompt: string;
    staticInputStructure: any;
    staticOutputFormat: any;
    variables: string[];
    agentConfiguration: AgentConfiguration;
    category?: string;
    examples?: Array<{
      sampleInput: Record<string, string>;
      expectedOutput: Record<string, string>;
      description?: string;
    }>;
  };

  warnings?: string[];
  suggestions?: string[];
}

/**
 * ✅ Validación de datos del wizard
 */
export interface WizardValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];

  // Validaciones específicas
  agentValidation: {
    hasValidType: boolean;
    hasValidSpecialization: boolean;
    hasValidPersonality: boolean;
  };

  editorialValidation: {
    hasValidLine: boolean;
    hasValidIntensity: boolean;
    politicsConfigurationValid: boolean;
  };

  examplesValidation: {
    hasValidExamples: boolean;
    examplesCount: number;
    qualityScore: number; // 0-100%
  };
}

/**
 * 📋 Request para crear template desde wizard
 */
export interface CreateTemplateFromWizardRequest {
  wizardData: WizardPromptRequest;
  generatedPrompt: {
    promptTemplate: string;
    systemPrompt: string;
    reasoning?: string;
  };

  // Confirmación del usuario
  userApproval: boolean;
  userModifications?: {
    promptTemplate?: string;
    systemPrompt?: string;
    templateName?: string;
    category?: string;
  };
}

/**
 * 🎨 Preview del template antes de crear
 */
export interface TemplatePreview {
  templateData: {
    name: string;
    type: string;
    agentPersona: string;
    category?: string;
    editorialLine: EditorialLine;
    politicalIntensity: number;
  };

  promptPreview: {
    promptTemplate: string;
    systemPrompt: string;
    sampleRendering: string; // Ejemplo de cómo se vería con datos reales
  };

  qualityIndicators: {
    estimatedScore: number; // 0-100%
    strengths: string[];
    potentialIssues: string[];
    recommendations: string[];
  };
}