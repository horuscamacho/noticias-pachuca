import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface TwitterPostMethods {
  updateEngagement(engagementData: Record<string, unknown>): Promise<TwitterPostDocument>;
  markAsPublished(tweetId: string, tweetUrl?: string): Promise<TwitterPostDocument>;
  markAsFailed(reason: string, errorDetails?: Record<string, unknown>): Promise<TwitterPostDocument>;
}

export interface TwitterPostVirtuals {
  totalEngagement: number;
  isOverdue: boolean;
  daysSincePublished: number | null;
  engagementVelocity: number;
}

export type TwitterPostDocument = TwitterPost & Document & TwitterPostMethods & TwitterPostVirtuals;

/**
 * 🐦 Schema para tweets publicados en Twitter - Generator Pro
 * Gestiona el ciclo completo desde contenido generado hasta métricas de engagement
 * Integra con GetLate.dev API y Twitter API para tracking completo
 */
@Schema({ timestamps: true })
export class TwitterPost {
  @Prop({ required: true, type: Types.ObjectId, ref: 'PublishedNoticia' })
  publishedNoticiaId: Types.ObjectId; // Referencia a la noticia publicada

  @Prop({ required: true, type: Types.ObjectId, ref: 'Site' })
  siteId: Types.ObjectId; // Referencia al sitio destino de publicación

  @Prop({ required: true, type: Types.ObjectId, ref: 'TwitterPublishingConfig' })
  twitterConfigId: Types.ObjectId; // Referencia a la configuración de Twitter

  @Prop({ type: String })
  tweetId?: string; // ID único del tweet en Twitter

  @Prop({ type: String })
  getLateTweetId?: string; // ID del tweet en GetLate.dev

  // 📝 CONTENIDO DEL TWEET
  @Prop({ required: true, trim: true, maxlength: 280 })
  tweetContent: string; // Copy final que se publicó en Twitter (máximo 280 chars)

  @Prop({ type: String })
  originalTitle?: string; // Título original de la noticia (para comparación)

  @Prop({ type: String })
  optimizedTitle?: string; // Título optimizado para Twitter

  @Prop({ type: Array, default: [] })
  mediaUrls: string[]; // URLs de imágenes/videos incluidos (máximo 4 en Twitter)

  @Prop({ type: Array, default: [] })
  processedMediaUrls: string[]; // URLs después de procesamiento GetLate

  // 🐦 OPTIMIZACIÓN PARA TWITTER
  @Prop({ type: Array, default: [], maxlength: 2 })
  emojis: string[]; // Emojis utilizados para engagement (máximo 2)

  @Prop({ type: Array, default: [], maxlength: 3 })
  hashtags: string[]; // Hashtags utilizados (máximo 3)

  @Prop({ type: Object })
  optimizationData?: {
    aiGeneratedEmojis?: string[]; // Emojis sugeridos por IA
    aiGeneratedHashtags?: string[]; // Hashtags sugeridos por IA
    engagementPrediction?: number; // Predicción de engagement 0-100
    optimalTweetTime?: Date; // Hora óptima sugerida para publicar
    audienceTargeting?: {
      demographics?: string[];
      interests?: string[];
      location?: string;
    };
    characterCount?: number; // Conteo de caracteres del tweet
    threadMode?: boolean; // Si es parte de un hilo
    threadPosition?: number; // Posición en el hilo (si aplica)
  };

  // ⏰ PROGRAMACIÓN Y PUBLICACIÓN
  @Prop({ required: true })
  scheduledAt: Date; // Fecha/hora programada para publicación

  @Prop()
  publishedAt?: Date; // Fecha/hora real de publicación

  @Prop()
  approvedAt?: Date; // Fecha/hora de aprobación (si requiere aprobación manual)

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId; // Usuario que aprobó el tweet

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

  // 📈 MÉTRICAS DE ENGAGEMENT (TWITTER)
  @Prop({ type: Object })
  engagement?: {
    likes?: number; // Me gusta
    retweets?: number; // Retweets
    replies?: number; // Respuestas/comentarios
    quotes?: number; // Quote tweets
    bookmarks?: number; // Marcadores
    impressions?: number; // Impresiones
    profileClicks?: number; // Clicks en el perfil
    urlClicks?: number; // Clicks en enlaces
    hashtagClicks?: number; // Clicks en hashtags
    detailExpands?: number; // Expansiones de detalles
    engagementRate?: number; // Tasa de engagement
    lastUpdated?: Date; // Última actualización de métricas
  };

  @Prop({ type: Object })
  audienceInsights?: {
    topCountries?: Array<{ country: string; percentage: number }>;
    topCities?: Array<{ city: string; percentage: number }>;
    followerGrowth?: number; // Crecimiento de seguidores desde tweet
    deviceTypes?: Array<{ device: string; percentage: number }>;
  };

  // 🔗 ENLACES Y REFERENCIAS
  @Prop({ type: String })
  tweetUrl?: string; // URL pública del tweet en Twitter

  @Prop({ type: String })
  getLateTweetUrl?: string; // URL del tweet en panel GetLate

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
    similarTweetsFound?: number;
    averageEngagementInCategory?: number;
    rankingInCategory?: number; // Posición vs otros tweets similares
    uniquenessScore?: number; // Score de originalidad 0-100
    viralityScore?: number; // Score de viralidad 0-100
  };

  @Prop({ trim: true })
  notes?: string; // Notas adicionales

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const TwitterPostSchema = SchemaFactory.createForClass(TwitterPost);

// 🔍 ÍNDICES PARA PERFORMANCE
TwitterPostSchema.index({ tweetId: 1 });
TwitterPostSchema.index({ status: 1, scheduledAt: 1 });
TwitterPostSchema.index({ siteId: 1, publishedAt: -1 });
TwitterPostSchema.index({ twitterConfigId: 1, status: 1 });
TwitterPostSchema.index({ publishedAt: -1 });
TwitterPostSchema.index({ category: 1, publishedAt: -1 });
TwitterPostSchema.index({ 'engagement.engagementRate': -1 });
TwitterPostSchema.index({ contentQualityScore: -1 });
TwitterPostSchema.index({ publishedNoticiaId: 1 });

// 🔍 ÍNDICES COMPUESTOS
TwitterPostSchema.index({ status: 1, scheduledAt: 1, twitterConfigId: 1 });
TwitterPostSchema.index({ siteId: 1, status: 1, publishedAt: -1 });
TwitterPostSchema.index({ publishedNoticiaId: 1, siteId: 1 });

// 🧮 VIRTUAL PARA ENGAGEMENT TOTAL
TwitterPostSchema.virtual('totalEngagement').get(function () {
  if (!this.engagement) return 0;
  return (this.engagement.likes || 0) +
         (this.engagement.retweets || 0) +
         (this.engagement.replies || 0) +
         (this.engagement.quotes || 0);
});

// 🧮 VIRTUAL PARA ESTADO CALCULADO
TwitterPostSchema.virtual('isOverdue').get(function () {
  return this.status === 'scheduled' && this.scheduledAt < new Date();
});

TwitterPostSchema.virtual('daysSincePublished').get(function () {
  if (!this.publishedAt) return null;
  return Math.floor((Date.now() - this.publishedAt.getTime()) / (1000 * 60 * 60 * 24));
});

TwitterPostSchema.virtual('engagementVelocity').get(function () {
  if (!this.publishedAt) return 0;
  const totalEng = this.get('totalEngagement') || 0;
  if (!totalEng) return 0;
  const hoursPublished = (Date.now() - this.publishedAt.getTime()) / (1000 * 60 * 60);
  return hoursPublished > 0 ? totalEng / hoursPublished : 0;
});

// 📊 MÉTODOS PARA ACTUALIZAR ENGAGEMENT
TwitterPostSchema.methods.updateEngagement = function (engagementData: Record<string, unknown>) {
  this.engagement = {
    ...this.engagement,
    ...engagementData,
    lastUpdated: new Date(),
  };

  // Calcular engagement rate si tenemos impressions
  if (this.engagement.impressions && this.engagement.impressions > 0) {
    const totalEng = this.get('totalEngagement') || 0;
    this.engagement.engagementRate = (totalEng / this.engagement.impressions) * 100;
  }

  return this.save();
};

// 📊 MÉTODO PARA MARCAR COMO PUBLICADO
TwitterPostSchema.methods.markAsPublished = function (tweetId: string, tweetUrl?: string) {
  this.status = 'published';
  this.publishedAt = new Date();
  this.tweetId = tweetId;
  if (tweetUrl) {
    this.tweetUrl = tweetUrl;
  }

  // Agregar al historial
  this.statusHistory.push({
    status: 'published',
    timestamp: new Date(),
    reason: 'Successfully published to Twitter',
    metadata: { tweetId, tweetUrl },
  });

  return this.save();
};

// 📊 MÉTODO PARA MARCAR COMO FALLIDO
TwitterPostSchema.methods.markAsFailed = function (reason: string, errorDetails?: Record<string, unknown>) {
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
