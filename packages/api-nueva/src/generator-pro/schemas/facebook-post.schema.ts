import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface FacebookPostMethods {
  updateEngagement(engagementData: Record<string, unknown>): Promise<FacebookPostDocument>;
  markAsPublished(facebookPostId: string, facebookPostUrl?: string): Promise<FacebookPostDocument>;
  markAsFailed(reason: string, errorDetails?: Record<string, unknown>): Promise<FacebookPostDocument>;
}

export interface FacebookPostVirtuals {
  totalEngagement: number;
  isOverdue: boolean;
  daysSincePublished: number | null;
  engagementVelocity: number;
}

export type FacebookPostDocument = FacebookPost & Document & FacebookPostMethods & FacebookPostVirtuals;

/**
 * 🤖 Schema para posts publicados en Facebook - Generator Pro
 * Gestiona el ciclo completo desde contenido generado hasta métricas de engagement
 * Integra con GetLate.dev API y Facebook Graph API para tracking completo
 */
@Schema({ timestamps: true })
export class FacebookPost {
  @Prop({ required: true, type: Types.ObjectId, ref: 'ExtractedNoticia' })
  originalNoticiaId: Types.ObjectId; // Referencia a la noticia original extraída

  @Prop({ required: true, type: Types.ObjectId, ref: 'AIContentGeneration' })
  generatedContentId: Types.ObjectId; // Referencia al contenido generado por IA

  @Prop({ required: true, type: Types.ObjectId, ref: 'NewsWebsiteConfig' })
  websiteConfigId: Types.ObjectId; // Referencia al sitio web de origen

  @Prop({ required: true, type: Types.ObjectId, ref: 'FacebookPublishingConfig' })
  facebookConfigId: Types.ObjectId; // Referencia a la configuración de Facebook

  @Prop({ type: String })
  facebookPostId?: string; // ID único del post en Facebook

  @Prop({ type: String })
  getLatePostId?: string; // ID del post en GetLate.dev

  // 📝 CONTENIDO DEL POST
  @Prop({ required: true, trim: true })
  postContent: string; // Copy final que se publicó en Facebook

  @Prop({ type: String })
  originalTitle?: string; // Título original de la noticia (para comparación)

  @Prop({ type: String })
  optimizedTitle?: string; // Título optimizado para Facebook

  @Prop({ type: Array, default: [] })
  mediaUrls: string[]; // URLs de imágenes/videos incluidos

  @Prop({ type: Array, default: [] })
  processedMediaUrls: string[]; // URLs después de procesamiento GetLate

  // 🎯 OPTIMIZACIÓN PARA FACEBOOK
  @Prop({ type: Array, default: [] })
  emojis: string[]; // Emojis utilizados para engagement

  @Prop({ type: Array, default: [] })
  hashtags: string[]; // Hashtags utilizados

  @Prop({ type: Object })
  optimizationData?: {
    aiGeneratedEmojis?: string[]; // Emojis sugeridos por IA
    aiGeneratedHashtags?: string[]; // Hashtags sugeridos por IA
    engagementPrediction?: number; // Predicción de engagement 0-100
    optimalPostTime?: Date; // Hora óptima sugerida para publicar
    audienceTargeting?: {
      demographics?: string[];
      interests?: string[];
      location?: string;
    };
  };

  // ⏰ PROGRAMACIÓN Y PUBLICACIÓN
  @Prop({ required: true })
  scheduledAt: Date; // Fecha/hora programada para publicación

  @Prop()
  publishedAt?: Date; // Fecha/hora real de publicación

  @Prop()
  approvedAt?: Date; // Fecha/hora de aprobación (si requiere aprobación manual)

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId; // Usuario que aprobó el post

  // 📊 ESTADO Y CONTROL
  @Prop({
    required: true,
    enum: ['draft', 'scheduled', 'publishing', 'published', 'failed', 'cancelled', 'pending_approval'],
    default: 'scheduled'
  })
  status: string;

  @Prop({ type: String })
  failureReason?: string; // Razón del fallo si status = failed

  @Prop({ type: Object })
  publishingAttempts?: {
    count?: number;
    lastAttempt?: Date;
    errors?: Array<{
      timestamp: Date;
      error: string;
      httpStatus?: number;
      apiResponse?: Record<string, unknown>;
    }>;
  };

  // 📈 MÉTRICAS DE ENGAGEMENT
  @Prop({ type: Object })
  engagement?: {
    likes?: number;
    comments?: number;
    shares?: number;
    reactions?: {
      like?: number;
      love?: number;
      wow?: number;
      haha?: number;
      sad?: number;
      angry?: number;
    };
    clicks?: number; // Clicks en enlaces
    reach?: number; // Alcance del post
    impressions?: number; // Impresiones
    engagementRate?: number; // Tasa de engagement
    lastUpdated?: Date; // Última actualización de métricas
  };

  @Prop({ type: Object })
  audienceInsights?: {
    topCountries?: Array<{ country: string; percentage: number }>;
    topCities?: Array<{ city: string; percentage: number }>;
    ageGroups?: Array<{ range: string; percentage: number }>;
    gender?: { male: number; female: number };
    deviceTypes?: Array<{ device: string; percentage: number }>;
  };

  // 🔗 ENLACES Y REFERENCIAS
  @Prop({ type: String })
  facebookPostUrl?: string; // URL pública del post en Facebook

  @Prop({ type: String })
  getLatePostUrl?: string; // URL del post en panel GetLate

  @Prop({ type: String })
  originalSourceUrl?: string; // URL de la noticia original

  @Prop({ type: Array, default: [] })
  trackingUrls: string[]; // URLs de tracking para analytics

  // 🏷️ CATEGORIZACIÓN Y METADATA
  @Prop({ type: String })
  category?: string; // Categoría de la noticia (política, deportes, etc.)

  @Prop({ type: Array, default: [] })
  keywords: string[]; // Palabras clave extraídas

  @Prop({ type: Array, default: [] })
  topics: string[]; // Temas identificados por IA

  @Prop({ type: String })
  sentiment?: string; // Sentimiento: positive, negative, neutral

  @Prop({ type: Number })
  contentQualityScore?: number; // Score de calidad del contenido 0-100

  // 📊 MÉTRICAS DE PERFORMANCE
  @Prop({ type: Object })
  performanceMetrics?: {
    generationTime?: number; // Tiempo de generación de contenido (ms)
    publishingTime?: number; // Tiempo de publicación (ms)
    optimizationTime?: number; // Tiempo de optimización (ms)
    totalProcessingTime?: number; // Tiempo total (ms)
    costBreakdown?: {
      aiGeneration?: number; // Costo generación IA
      getLateAPI?: number; // Costo API GetLate
      mediaProcessing?: number; // Costo procesamiento media
      total?: number;
    };
  };

  // 🔄 HISTORIAL Y AUDITORÍA
  @Prop({ type: Array, default: [] })
  revisionHistory: Array<{
    timestamp: Date;
    field: string;
    oldValue?: string;
    newValue?: string;
    updatedBy?: Types.ObjectId;
    reason?: string;
  }>;

  @Prop({ type: Array, default: [] })
  statusHistory: Array<{
    status: string;
    timestamp: Date;
    reason?: string;
    metadata?: Record<string, unknown>;
  }>;

  // 🏆 MÉTRICAS COMPETITIVAS
  @Prop({ type: Object })
  competitiveAnalysis?: {
    similarPostsFound?: number;
    averageEngagementInCategory?: number;
    rankingInCategory?: number; // Posición vs otros posts similares
    uniquenessScore?: number; // Score de originalidad 0-100
  };

  @Prop({ trim: true })
  notes?: string; // Notas adicionales

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const FacebookPostSchema = SchemaFactory.createForClass(FacebookPost);

// 🔍 ÍNDICES PARA PERFORMANCE
FacebookPostSchema.index({ facebookPostId: 1 });
FacebookPostSchema.index({ status: 1, scheduledAt: 1 });
FacebookPostSchema.index({ websiteConfigId: 1, publishedAt: -1 });
FacebookPostSchema.index({ facebookConfigId: 1, status: 1 });
FacebookPostSchema.index({ publishedAt: -1 });
FacebookPostSchema.index({ category: 1, publishedAt: -1 });
FacebookPostSchema.index({ 'engagement.engagementRate': -1 });
FacebookPostSchema.index({ contentQualityScore: -1 });

// 🔍 ÍNDICES COMPUESTOS
FacebookPostSchema.index({ status: 1, scheduledAt: 1, facebookConfigId: 1 });
FacebookPostSchema.index({ websiteConfigId: 1, status: 1, publishedAt: -1 });

// 🧮 VIRTUAL PARA ENGAGEMENT TOTAL
FacebookPostSchema.virtual('totalEngagement').get(function () {
  if (!this.engagement) return 0;
  return (this.engagement.likes || 0) +
         (this.engagement.comments || 0) +
         (this.engagement.shares || 0);
});

// 🧮 VIRTUAL PARA ESTADO CALCULADO
FacebookPostSchema.virtual('isOverdue').get(function () {
  return this.status === 'scheduled' && this.scheduledAt < new Date();
});

FacebookPostSchema.virtual('daysSincePublished').get(function () {
  if (!this.publishedAt) return null;
  return Math.floor((Date.now() - this.publishedAt.getTime()) / (1000 * 60 * 60 * 24));
});

FacebookPostSchema.virtual('engagementVelocity').get(function () {
  if (!this.publishedAt) return 0;
  const totalEng = this.get('totalEngagement') || 0;
  if (!totalEng) return 0;
  const hoursPublished = (Date.now() - this.publishedAt.getTime()) / (1000 * 60 * 60);
  return hoursPublished > 0 ? totalEng / hoursPublished : 0;
});

// 📊 MÉTODOS PARA ACTUALIZAR ENGAGEMENT
FacebookPostSchema.methods.updateEngagement = function (engagementData: Record<string, unknown>) {
  this.engagement = {
    ...this.engagement,
    ...engagementData,
    lastUpdated: new Date(),
  };

  // Calcular engagement rate si tenemos reach
  if (this.engagement.reach && this.engagement.reach > 0) {
    const totalEng = this.get('totalEngagement') || 0;
    this.engagement.engagementRate = (totalEng / this.engagement.reach) * 100;
  }

  return this.save();
};

// 📊 MÉTODO PARA MARCAR COMO PUBLICADO
FacebookPostSchema.methods.markAsPublished = function (facebookPostId: string, facebookPostUrl?: string) {
  this.status = 'published';
  this.publishedAt = new Date();
  this.facebookPostId = facebookPostId;
  if (facebookPostUrl) {
    this.facebookPostUrl = facebookPostUrl;
  }

  // Agregar al historial
  this.statusHistory.push({
    status: 'published',
    timestamp: new Date(),
    reason: 'Successfully published to Facebook',
    metadata: { facebookPostId, facebookPostUrl },
  });

  return this.save();
};

// 📊 MÉTODO PARA MARCAR COMO FALLIDO
FacebookPostSchema.methods.markAsFailed = function (reason: string, errorDetails?: Record<string, unknown>) {
  this.status = 'failed';
  this.failureReason = reason;

  // Actualizar intentos de publicación
  if (!this.publishingAttempts) {
    this.publishingAttempts = { count: 0, errors: [] };
  }

  this.publishingAttempts.count += 1;
  this.publishingAttempts.lastAttempt = new Date();
  this.publishingAttempts.errors.push({
    timestamp: new Date(),
    error: reason,
    ...errorDetails,
  });

  // Agregar al historial
  this.statusHistory.push({
    status: 'failed',
    timestamp: new Date(),
    reason,
    metadata: errorDetails,
  });

  return this.save();
};