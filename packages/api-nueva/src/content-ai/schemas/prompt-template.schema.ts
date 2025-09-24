import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PromptTemplateDocument = PromptTemplate & Document;

/**
 * 📝 Schema para templates de prompts dinámicos
 * Configura agentes editoriales: Reporteros, Columnistas, Trascendidos
 */
@Schema({ timestamps: true })
export class PromptTemplate {
  @Prop({ required: true, trim: true })
  name: string; // "Reportero Objetivo", "Columnista Humor", "Trascendido Político"

  @Prop({
    required: true,
    enum: ['noticia', 'columna', 'trascendido', 'seo-metadata'],
    trim: true
  })
  type: 'noticia' | 'columna' | 'trascendido' | 'seo-metadata'; // Tipo de contenido

  @Prop({ required: true })
  agentPersona: string; // Personalidad detallada del agente editorial

  @Prop({ required: true })
  promptTemplate: string; // Template con variables {{title}}, {{content}}, {{context}}

  @Prop({ required: true })
  systemPrompt: string; // Instrucciones de sistema para el modelo

  // 🚨 ESTRUCTURA ESTÁTICA OBLIGATORIA - INPUT/OUTPUT FIJO
  @Prop({ type: Object, required: true })
  staticInputStructure: {
    title: string; // SIEMPRE recibe título de noticia
    content: string; // SIEMPRE recibe contenido de noticia
    referenceContent?: string; // OPCIONAL: contenido de referencia para contexto político
  };

  @Prop({ type: Object, required: true })
  staticOutputFormat: {
    title: string; // Título reescrito
    content: string; // Contenido transformado
    keywords: string[]; // Keywords SEO (obligatorio)
    tags: string[]; // Tags relevantes (obligatorio)
    category: string; // Categoría asignada (obligatorio)
    summary: string; // Resumen ejecutivo (obligatorio)
  };

  @Prop({ type: [String], default: ['title', 'content', 'referenceContent'] })
  variables: string[]; // Variables estáticas limitadas: title, content, referenceContent (opcional)

  @Prop({ default: true })
  isActive: boolean; // Template activo

  // 🎯 CONFIGURACIÓN DEL AGENTE EDITORIAL
  @Prop({ type: Object, required: true })
  agentConfiguration: {
    editorialLine: 'neutral' | 'izquierda' | 'derecha' | 'crítica'; // Línea editorial obligatoria
    politicalIntensity: number; // 0-100% intensidad política
    agentPersonality: string; // Personalidad específica del agente
    canHandlePolitics: boolean; // Si puede manejar temas políticos
    requiresReference: boolean; // Si requiere contenido de referencia
  };

  @Prop({ type: Object })
  configuration?: {
    maxTokens?: number; // Límite específico de tokens
    temperature?: number; // Temperatura específica
    topP?: number; // Top-p sampling
    frequencyPenalty?: number; // Penalización por frecuencia
    presencePenalty?: number; // Penalización por presencia
    stopSequences?: string[]; // Secuencias de parada
  };

  @Prop({ type: Object })
  qualityMetrics?: {
    averageQualityScore?: number; // Score promedio 1-10
    usageCount?: number; // Veces que se ha usado
    successRate?: number; // % de generaciones exitosas
    averageProcessingTime?: number; // Tiempo promedio de procesamiento (ms)
    lastUsed?: Date; // Última vez usado
    userRatings?: number[]; // Ratings de usuarios (1-5)
  };

  @Prop({ type: Object })
  examples?: {
    sampleInput: Record<string, string>; // Ejemplo de input
    expectedOutput: Record<string, string>; // Output esperado
    description?: string; // Descripción del ejemplo
  }[];

  @Prop({ trim: true })
  category?: string; // Categoría de template: "Político", "Deportivo", "Social"

  @Prop({ type: [String], default: [] })
  compatibleProviders: string[]; // Proveedores compatibles: ["OpenAI", "Anthropic"]

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const PromptTemplateSchema = SchemaFactory.createForClass(PromptTemplate);

// Índices para performance y queries comunes
PromptTemplateSchema.index({ name: 1 });
PromptTemplateSchema.index({ type: 1 });
PromptTemplateSchema.index({ isActive: 1 });
PromptTemplateSchema.index({ 'agentConfiguration.editorialLine': 1 });
PromptTemplateSchema.index({ 'agentConfiguration.canHandlePolitics': 1 });
PromptTemplateSchema.index({ category: 1 });
PromptTemplateSchema.index({ 'qualityMetrics.averageQualityScore': -1 });
PromptTemplateSchema.index({ 'qualityMetrics.lastUsed': -1 });

// Índices compuestos para queries frecuentes
PromptTemplateSchema.index({ type: 1, isActive: 1 });
PromptTemplateSchema.index({ type: 1, 'agentConfiguration.editorialLine': 1, isActive: 1 });
PromptTemplateSchema.index({ 'agentConfiguration.canHandlePolitics': 1, type: 1, isActive: 1 });
PromptTemplateSchema.index({ category: 1, type: 1, isActive: 1 });