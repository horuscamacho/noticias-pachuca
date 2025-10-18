import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface FacebookPublishingConfigMethods {
  resetDailyCounter(): Promise<FacebookPublishingConfigDocument>;
}

export interface FacebookPublishingConfigVirtuals {
  nextPublishingDue: Date;
  canPublishToday: boolean;
  publishingStatus: string;
}

export type FacebookPublishingConfigDocument = FacebookPublishingConfig & Document & FacebookPublishingConfigMethods & FacebookPublishingConfigVirtuals;

/**
 * 🤖 Schema para configuración de publicación automática en Facebook - Generator Pro
 * Gestiona la integración con GetLate.dev API para publicación automatizada
 * Incluye optimización de contenido para engagement y configuración de frecuencias
 */
@Schema({ timestamps: true })
export class FacebookPublishingConfig {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Site' })
  siteId: Types.ObjectId; // Referencia al sitio destino de publicación

  @Prop({ required: true, trim: true })
  name: string; // "Publicación El Universal", "Milenio Facebook"

  @Prop({ required: true, trim: true })
  facebookPageId: string; // ID de la página de Facebook conectada

  @Prop({ required: true, trim: true })
  facebookPageName: string; // Nombre de la página para mostrar en UI

  @Prop({ required: true, select: false }) // No incluir en queries por defecto por seguridad
  getLateApiKey: string; // API key de GetLate.dev (debe estar encriptada)

  @Prop({ required: true, type: Types.ObjectId, ref: 'PromptTemplate' })
  templateId: Types.ObjectId; // Template de Content-AI para generar contenido

  @Prop({ default: true })
  isActive: boolean;

  // ⏰ CONFIGURACIÓN DE FRECUENCIA DE PUBLICACIÓN
  @Prop({ default: 30 })
  publishingFrequency: number; // Frecuencia en minutos (30 = cada 30 minutos)

  @Prop({ default: 10 })
  maxPostsPerDay: number; // Límite máximo de posts por día

  // 📝 CONFIGURACIÓN DE TEMPLATES PARA POSTS
  @Prop({ type: String, default: '{{title}}\n\n{{summary}}\n\n{{hashtags}}' })
  postTemplate: string; // Template para el copy de Facebook con variables

  @Prop({ type: String })
  fallbackTemplate?: string; // Template alternativo si falla el principal

  // 🎯 CONFIGURACIÓN DE OPTIMIZACIÓN PARA FACEBOOK
  @Prop({ type: Object, default: {} })
  optimizationSettings: {
    useEmojis?: boolean; // Activar generación automática de emojis
    useHashtags?: boolean; // Activar generación automática de hashtags
    maxHashtags?: number; // Máximo número de hashtags (default: 5)
    includeCallToAction?: boolean; // Incluir call-to-action
    optimizeForEngagement?: boolean; // Optimizar copy para engagement
    addSourceReference?: boolean; // Incluir referencia al sitio original
  };

  // 📱 CONFIGURACIÓN DE CONTENIDO MULTIMEDIA
  @Prop({ type: Object, default: {} })
  mediaSettings: {
    includeImages?: boolean; // Incluir imágenes en posts
    imageOptimization?: boolean; // Optimizar imágenes para Facebook
    preferredImageSize?: string; // Tamaño preferido (ej: "1200x630")
    fallbackImageUrl?: string; // Imagen por defecto si no hay imagen
    maxImages?: number; // Máximo número de imágenes por post
  };

  // ⚙️ CONFIGURACIÓN AVANZADA
  @Prop({ type: Object, default: {} })
  advancedSettings: {
    scheduleOptimalTimes?: boolean; // Programar en horarios óptimos
    optimalTimes?: string[]; // Horarios óptimos ["09:00", "13:00", "18:00"]
    skipWeekends?: boolean; // No publicar en fines de semana
    skipHolidays?: boolean; // No publicar en días festivos
    contentFiltering?: {
      minWordCount?: number; // Mínimo de palabras en contenido
      maxWordCount?: number; // Máximo de palabras en contenido
      bannedKeywords?: string[]; // Palabras prohibidas
      requiredKeywords?: string[]; // Palabras que debe contener
    };
    duplicateDetection?: boolean; // Evitar contenido duplicado
    cooldownPeriod?: number; // Tiempo entre posts del mismo sitio (minutos)
  };

  // 📊 ESTADÍSTICAS Y CONTROL
  @Prop()
  lastPublishedAt?: Date; // Última publicación realizada

  @Prop({ default: 0 })
  postsToday: number; // Contador de posts publicados hoy

  @Prop()
  dailyReset?: Date; // Última vez que se reseteo el contador diario

  @Prop({ type: Object })
  connectionStatus?: {
    isConnected?: boolean; // Estado de conexión con GetLate
    lastChecked?: Date; // Última verificación de conexión
    errorMessage?: string; // Error si conexión falló
    pageInfo?: {
      name?: string; // Nombre de la página Facebook
      followers?: number; // Número de seguidores
      verified?: boolean; // Si la página está verificada
    };
  };

  // 📈 MÉTRICAS Y ESTADÍSTICAS
  @Prop({ type: Object, default: {} })
  statistics: {
    totalPostsPublished?: number;
    successfulPosts?: number;
    failedPosts?: number;
    averageEngagement?: number; // Promedio de likes + comments + shares
    bestPerformingPost?: {
      postId?: string;
      engagement?: number;
      publishedAt?: Date;
    };
    lastEngagementSync?: Date; // Última sincronización de métricas
  };

  // 🔧 CONFIGURACIÓN DE DEBUGGING Y TESTING
  @Prop({ type: Object })
  testResults?: {
    lastTested?: Date;
    connectionTest?: {
      isWorking?: boolean;
      responseTime?: number; // ms
      errorMessage?: string;
    };
    publishTest?: {
      isWorking?: boolean;
      samplePostId?: string;
      errorMessage?: string;
      publishedAt?: Date;
    };
  };

  @Prop({ trim: true })
  notes?: string; // Notas sobre la configuración

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const FacebookPublishingConfigSchema = SchemaFactory.createForClass(FacebookPublishingConfig);

// 🔍 ÍNDICES PARA PERFORMANCE
FacebookPublishingConfigSchema.index({ siteId: 1 });
FacebookPublishingConfigSchema.index({ isActive: 1 });
FacebookPublishingConfigSchema.index({ facebookPageId: 1 });
FacebookPublishingConfigSchema.index({ lastPublishedAt: -1 });
FacebookPublishingConfigSchema.index({ dailyReset: -1 });

// 🧮 VIRTUAL PARA CALCULAR PRÓXIMA PUBLICACIÓN
FacebookPublishingConfigSchema.virtual('nextPublishingDue').get(function () {
  if (!this.lastPublishedAt) return new Date();
  return new Date(this.lastPublishedAt.getTime() + (this.publishingFrequency * 60 * 1000));
});

// 🧮 VIRTUAL PARA VERIFICAR SI PUEDE PUBLICAR HOY
FacebookPublishingConfigSchema.virtual('canPublishToday').get(function () {
  // Resetear contador si es un nuevo día
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (!this.dailyReset || this.dailyReset < today) {
    return this.maxPostsPerDay > 0;
  }

  return this.postsToday < this.maxPostsPerDay;
});

// 🧮 VIRTUAL PARA ESTADO GENERAL
FacebookPublishingConfigSchema.virtual('status').get(function () {
  if (!this.isActive) return 'inactive';
  if (!this.connectionStatus?.isConnected) return 'disconnected';
  // Calcular canPublishToday manualmente
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let canPublish = this.maxPostsPerDay > 0;

  if (!this.dailyReset || this.dailyReset < today) {
    canPublish = this.maxPostsPerDay > 0;
  } else {
    canPublish = this.postsToday < this.maxPostsPerDay;
  }

  if (!canPublish) return 'daily_limit_reached';
  return 'ready';
});

// 📊 MÉTODO PARA RESETEAR CONTADOR DIARIO
FacebookPublishingConfigSchema.methods.resetDailyCounter = function () {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (!this.dailyReset || this.dailyReset < today) {
    this.postsToday = 0;
    this.dailyReset = today;
    return this.save();
  }
};