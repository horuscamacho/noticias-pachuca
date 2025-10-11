import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AIContentGenerationDocument = AIContentGeneration & Document;

/**
 * 📄 Schema para contenido generado por IA
 * Almacena el resultado de la generación con metadata completo
 */
@Schema({ timestamps: true })
export class AIContentGeneration {
  @Prop({ type: Types.ObjectId, ref: 'ExtractedNoticia' })
  originalContentId?: Types.ObjectId; // Referencia al contenido original (opcional)

  // Campos para contenido original directo (sin referencia externa)
  @Prop({ trim: true })
  originalTitle?: string; // Título original cuando se genera directamente

  @Prop()
  originalContent?: string; // Contenido original cuando se genera directamente

  @Prop({ trim: true })
  originalSourceUrl?: string; // URL fuente original cuando se genera directamente

  @Prop({ type: Types.ObjectId, ref: 'ContentAgent', required: true })
  agentId: Types.ObjectId; // Agente que generó el contenido

  @Prop({ type: Types.ObjectId, ref: 'PromptTemplate', required: true })
  templateId: Types.ObjectId; // Template utilizado

  @Prop({ type: Types.ObjectId, ref: 'AIProvider', required: true })
  providerId: Types.ObjectId; // Proveedor de IA utilizado

  @Prop({ required: true, trim: true })
  generatedTitle: string; // Título generado

  @Prop({ required: true })
  generatedContent: string; // Contenido principal generado

  @Prop({ type: [String], default: [] })
  generatedKeywords: string[]; // Keywords SEO generados

  @Prop({ type: [String], default: [] })
  generatedTags: string[]; // Tags relevantes generados

  @Prop({ trim: true })
  generatedCategory?: string; // Categoría asignada por IA

  @Prop({ trim: true })
  generatedSummary?: string; // Resumen breve generado (2-3 líneas)

  @Prop({ trim: true })
  extendedSummary?: string; // Resumen ejecutivo detallado (4-6 párrafos)

  @Prop({ type: Object })
  socialMediaCopies?: {
    facebook?: {
      hook: string;
      copy: string;
      emojis: string[];
      hookType: 'Scary' | 'FreeValue' | 'Strange' | 'Sexy' | 'Familiar';
      estimatedEngagement: 'high' | 'medium' | 'low';
    };
    twitter?: {
      tweet: string;
      hook: string;
      emojis: string[];
      hookType: string;
      threadIdeas: string[];
    };
    instagram?: string; // Caption para Instagram con emojis y hashtags
    linkedin?: string; // Post profesional para LinkedIn
  };

  @Prop({ type: Object })
  seoData?: {
    metaDescription?: string; // Meta description (150-160 chars)
    focusKeyword?: string; // Palabra clave principal
    altText?: string; // Texto alternativo para imagen
    canonicalUrl?: string; // URL canónica
    ogTitle?: string; // Open Graph title
    ogDescription?: string; // Open Graph description
  };

  @Prop({ type: Object })
  extractedMetadata?: {
    extractedFacts?: string[]; // Hechos extraídos del input
    keyPeople?: string[]; // Personas mencionadas
    locations?: string[]; // Ubicaciones específicas
    dates?: string[]; // Fechas mencionadas
    numbers?: string[]; // Cifras específicas
    sources?: string[]; // Fuentes mencionadas
  };

  @Prop({
    enum: ['pending', 'generating', 'completed', 'failed', 'reviewing', 'approved', 'rejected'],
    default: 'pending'
  })
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'reviewing' | 'approved' | 'rejected';

  @Prop({ type: Object, required: true })
  generationMetadata: {
    model: string; // Modelo específico usado
    promptTokens: number; // Tokens del prompt
    completionTokens: number; // Tokens de la respuesta
    totalTokens: number; // Total de tokens
    cost: number; // Costo de la generación
    processingTime: number; // Tiempo de procesamiento (ms)
    temperature: number; // Temperatura usada
    maxTokens: number; // Límite de tokens
    finishReason: string; // Razón de finalización
    contentQuality?: number; // Calidad del contenido (0-100)
    aiProvider?: string; // Proveedor de IA usado
    tokensUsed?: number; // Tokens usados (alias)
    costEstimate?: number; // Estimado de costo (alias)
  };

  @Prop({ type: Object })
  qualityMetrics?: {
    readabilityScore?: number; // Score de legibilidad
    sentimentScore?: number; // Análisis de sentimientos
    coherenceScore?: number; // Coherencia del contenido
    originalityScore?: number; // Originalidad vs contenido original
    seoScore?: number; // Score SEO
    userRating?: number; // Rating del usuario (1-5)
    humanReviewScore?: number; // Score de revisión humana (1-10)
  };

  @Prop({ type: Object })
  comparisonMetrics?: {
    similarityToOriginal?: number; // % similitud con original
    lengthRatio?: number; // Ratio de longitud vs original
    keywordDensity?: number; // Densidad de keywords
    readingLevel?: string; // Nivel de lectura
    toneAnalysis?: string; // Análisis de tono
  };

  @Prop({ type: [String], default: [] })
  errors: string[]; // Errores durante la generación

  @Prop({ type: [String], default: [] })
  warnings: string[]; // Advertencias de calidad

  @Prop({ type: Object })
  reviewInfo?: {
    reviewerId?: Types.ObjectId; // ID del revisor humano
    reviewedAt?: Date; // Fecha de revisión
    reviewNotes?: string; // Notas del revisor
    changesRequested?: string[]; // Cambios solicitados
    approvalLevel?: 'auto' | 'human' | 'editor'; // Nivel de aprobación
  };

  @Prop({ type: Object })
  publishingInfo?: {
    publishedAt?: Date; // Fecha de publicación
    publishedBy?: Types.ObjectId; // Usuario que publicó
    platform?: string; // Plataforma de publicación
    url?: string; // URL final del contenido publicado
    socialShares?: number; // Shares en redes sociales
    views?: number; // Visualizaciones
  };

  @Prop({ type: Object })
  versioning?: {
    version: number; // Versión del contenido
    previousVersionId?: Types.ObjectId; // Referencia a versión anterior
    changeLog?: string; // Log de cambios
    isLatest: boolean; // Es la versión más reciente
  };

  @Prop({ default: Date.now })
  generatedAt: Date; // Timestamp de generación

  @Prop({ type: Date })
  originalPublishedAt?: Date; // Fecha de publicación del contenido original (denormalizado de ExtractedNoticia)

  // Propiedades adicionales para Generator-Pro
  @Prop({ trim: true })
  category?: string; // Categoría del contenido

  @Prop({ trim: true })
  summary?: string; // Resumen del contenido

  @Prop()
  completedAt?: Date; // Fecha de completado

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const AIContentGenerationSchema = SchemaFactory.createForClass(AIContentGeneration);

// Índices para performance y queries comunes
AIContentGenerationSchema.index({ originalContentId: 1 });
AIContentGenerationSchema.index({ agentId: 1 });
AIContentGenerationSchema.index({ templateId: 1 });
AIContentGenerationSchema.index({ providerId: 1 });
AIContentGenerationSchema.index({ status: 1 });
AIContentGenerationSchema.index({ generatedAt: -1 });
AIContentGenerationSchema.index({ 'qualityMetrics.userRating': -1 });
AIContentGenerationSchema.index({ 'qualityMetrics.humanReviewScore': -1 });
AIContentGenerationSchema.index({ 'publishingInfo.publishedAt': -1 });
AIContentGenerationSchema.index({ 'versioning.isLatest': 1 });

// Índices compuestos para queries frecuentes
AIContentGenerationSchema.index({ status: 1, generatedAt: -1 });
AIContentGenerationSchema.index({ agentId: 1, status: 1, generatedAt: -1 });
AIContentGenerationSchema.index({ originalContentId: 1, 'versioning.isLatest': 1 });
AIContentGenerationSchema.index({ providerId: 1, generatedAt: -1, 'generationMetadata.cost': 1 });

// Índices para ordenamiento híbrido y filtrado frecuente (Fase 2 y 3)
AIContentGenerationSchema.index({ originalPublishedAt: -1, generatedAt: -1 }); // Ordenamiento híbrido
AIContentGenerationSchema.index({ generatedCategory: 1 }); // Filtrado por categoría
AIContentGenerationSchema.index({ generatedTags: 1 }); // Filtrado por tags
AIContentGenerationSchema.index({ generatedTitle: 1 }); // Ordenamiento por título
AIContentGenerationSchema.index({ status: 1, generatedCategory: 1, generatedAt: -1 }); // Filtrado + ordenamiento