import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ContentAgentDocument = ContentAgent & Document;

/**
 * 👤 Schema para agentes editoriales especializados
 * Configura comportamiento y especialización de cada agente
 */
@Schema({ timestamps: true })
export class ContentAgent {
  @Prop({ required: true, trim: true, unique: true })
  name: string; // "Reportero Objetivo", "Columnista Humor", "Trascendido Político"

  @Prop({
    required: true,
    enum: ['reportero', 'columnista', 'trascendido', 'seo-specialist'],
    trim: true
  })
  agentType: 'reportero' | 'columnista' | 'trascendido' | 'seo-specialist';

  @Prop({ required: true })
  description: string; // Descripción del agente y su especialización

  @Prop({ required: true })
  personality: string; // Personalidad detallada y estilo editorial

  @Prop({ type: [{ type: Types.ObjectId, ref: 'PromptTemplate' }] })
  defaultTemplates: Types.ObjectId[]; // Templates por defecto asociados

  @Prop({ type: [String], required: true })
  specializations: string[]; // ["política", "deportes", "sociedad", "economía"]

  @Prop({
    enum: ['conservative', 'progressive', 'neutral', 'humor', 'critical', 'analytical'],
    required: true
  })
  editorialLean: 'conservative' | 'progressive' | 'neutral' | 'humor' | 'critical' | 'analytical';

  @Prop({ type: Object, required: true })
  writingStyle: {
    tone: 'formal' | 'informal' | 'humor' | 'academic' | 'conversational'; // Tono de escritura
    vocabulary: 'simple' | 'intermediate' | 'advanced' | 'technical'; // Nivel de vocabulario
    length: 'short' | 'medium' | 'long' | 'variable'; // Longitud preferida
    structure: 'linear' | 'narrative' | 'analytical' | 'opinion'; // Estructura narrativa
    audience: 'general' | 'specialized' | 'academic' | 'youth' | 'senior'; // Audiencia objetivo
  };

  @Prop({ default: true })
  isActive: boolean; // Agente activo

  @Prop({ type: Object })
  configuration?: {
    maxArticlesPerDay?: number; // Límite diario de artículos
    preferredProviders?: string[]; // Proveedores de IA preferidos
    qualityThreshold?: number; // Umbral mínimo de calidad 1-10
    autoPublish?: boolean; // Auto-publicar sin revisión humana
    priority?: number; // Prioridad de uso (1-10)
  };

  @Prop({ type: Object })
  performanceMetrics?: {
    totalArticles?: number; // Total de artículos generados
    averageQuality?: number; // Calidad promedio 1-10
    averageTime?: number; // Tiempo promedio de generación (ms)
    successRate?: number; // % de generaciones exitosas
    userRatings?: number; // Rating promedio de usuarios
    lastActive?: Date; // Última actividad
  };

  @Prop({ type: Object })
  constraints?: {
    bannedTopics?: string[]; // Temas prohibidos para este agente
    requiredKeywords?: string[]; // Keywords que debe incluir
    maxWordCount?: number; // Límite máximo de palabras
    minWordCount?: number; // Límite mínimo de palabras
    contentGuidelines?: string[]; // Guías específicas de contenido
  };

  @Prop({ type: [String], default: [] })
  sampleOutputs: string[]; // URLs o referencias a contenido de ejemplo

  @Prop({ type: Object })
  workflow?: {
    requiresFactCheck?: boolean; // Requiere fact-checking
    requiresHumanReview?: boolean; // Requiere revisión humana
    autoCategories?: boolean; // Auto-categorización
    generateSEO?: boolean; // Generar metadata SEO automáticamente
    steps?: string[]; // Pasos del workflow de generación
  };

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ContentAgentSchema = SchemaFactory.createForClass(ContentAgent);

// Índices para performance y queries comunes
ContentAgentSchema.index({ name: 1 });
ContentAgentSchema.index({ agentType: 1 });
ContentAgentSchema.index({ isActive: 1 });
ContentAgentSchema.index({ editorialLean: 1 });
ContentAgentSchema.index({ specializations: 1 });
ContentAgentSchema.index({ 'configuration.priority': -1 });
ContentAgentSchema.index({ 'performanceMetrics.averageQuality': -1 });
ContentAgentSchema.index({ 'performanceMetrics.lastActive': -1 });

// Índices compuestos
ContentAgentSchema.index({ agentType: 1, isActive: 1 });
ContentAgentSchema.index({ editorialLean: 1, agentType: 1, isActive: 1 });
ContentAgentSchema.index({ specializations: 1, isActive: 1 });