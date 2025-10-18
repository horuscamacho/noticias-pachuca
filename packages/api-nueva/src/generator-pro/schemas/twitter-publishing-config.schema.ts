import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface TwitterPublishingConfigMethods {
  resetDailyCounter(): Promise<TwitterPublishingConfigDocument>;
}

export interface TwitterPublishingConfigVirtuals {
  nextPublishingDue: Date;
  canPublishToday: boolean;
  publishingStatus: string;
}

export type TwitterPublishingConfigDocument = TwitterPublishingConfig & Document & TwitterPublishingConfigMethods & TwitterPublishingConfigVirtuals;

/**
 * 🐦 Schema para configuración de publicación automática en Twitter - Generator Pro
 * Gestiona la integración con GetLate.dev API para publicación automatizada en Twitter
 * Incluye optimización de contenido para Twitter (280 chars, emojis, hashtags)
 */
@Schema({ timestamps: true })
export class TwitterPublishingConfig {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Site' })
  siteId: Types.ObjectId; // Referencia al sitio destino de publicación

  @Prop({ required: true, trim: true })
  name: string; // "Twitter Noticias Pachuca", "Twitter Tu Zona"

  @Prop({ required: true, trim: true })
  twitterAccountId: string; // ID de la cuenta de Twitter conectada

  @Prop({ required: true, trim: true })
  twitterUsername: string; // @username de Twitter (sin @)

  @Prop({ required: true, trim: true })
  twitterDisplayName: string; // Nombre de display de la cuenta para UI

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
  maxTweetsPerDay: number; // Límite máximo de tweets por día

  // 📝 CONFIGURACIÓN DE TEMPLATES PARA TWEETS
  @Prop({ type: String, default: '{{title}}\n\n{{summary}}\n\n{{hashtags}}' })
  tweetTemplate: string; // Template para el tweet con variables

  @Prop({ type: String })
  fallbackTemplate?: string; // Template alternativo si falla el principal

  // 🐦 CONFIGURACIÓN DE OPTIMIZACIÓN PARA TWITTER
  @Prop({ type: Object, default: {} })
  optimizationSettings: {
    useEmojis?: boolean; // Activar generación automática de emojis (max 2)
    maxEmojis?: number; // Máximo número de emojis (default: 2)
    useHashtags?: boolean; // Activar generación automática de hashtags (max 3)
    maxHashtags?: number; // Máximo número de hashtags (default: 3)
    includeCallToAction?: boolean; // Incluir call-to-action
    optimizeForEngagement?: boolean; // Optimizar copy para engagement
    addSourceReference?: boolean; // Incluir referencia al sitio original
    maxTweetLength?: number; // Máximo de caracteres (default: 280)
  };

  // 📱 CONFIGURACIÓN DE CONTENIDO MULTIMEDIA
  @Prop({ type: Object, default: {} })
  mediaSettings: {
    includeImages?: boolean; // Incluir imágenes en tweets
    imageOptimization?: boolean; // Optimizar imágenes para Twitter
    preferredImageSize?: string; // Tamaño preferido (ej: "1200x675")
    fallbackImageUrl?: string; // Imagen por defecto si no hay imagen
    maxImages?: number; // Máximo número de imágenes por tweet (Twitter permite 4)
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
    cooldownPeriod?: number; // Tiempo entre tweets del mismo sitio (minutos)
    threadMode?: boolean; // Crear hilos si el contenido es largo
  };

  // 📊 ESTADÍSTICAS Y CONTROL
  @Prop()
  lastPublishedAt?: Date; // Último tweet publicado

  @Prop({ default: 0 })
  tweetsToday: number; // Contador de tweets publicados hoy

  @Prop()
  dailyReset?: Date; // Última vez que se reseteo el contador diario

  @Prop({ type: Object })
  connectionStatus?: {
    isConnected?: boolean; // Estado de conexión con GetLate
    lastChecked?: Date; // Última verificación de conexión
    errorMessage?: string; // Error si conexión falló
    accountInfo?: {
      username?: string; // @username de Twitter
      displayName?: string; // Nombre de display
      followers?: number; // Número de seguidores
      verified?: boolean; // Si la cuenta está verificada
    };
  };

  // 📈 MÉTRICAS Y ESTADÍSTICAS
  @Prop({ type: Object, default: {} })
  statistics: {
    totalTweetsPublished?: number;
    successfulTweets?: number;
    failedTweets?: number;
    averageEngagement?: number; // Promedio de likes + retweets + replies
    bestPerformingTweet?: {
      tweetId?: string;
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
      sampleTweetId?: string;
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

export const TwitterPublishingConfigSchema = SchemaFactory.createForClass(TwitterPublishingConfig);

// 🔍 ÍNDICES PARA PERFORMANCE
TwitterPublishingConfigSchema.index({ siteId: 1 });
TwitterPublishingConfigSchema.index({ isActive: 1 });
TwitterPublishingConfigSchema.index({ twitterAccountId: 1 });
TwitterPublishingConfigSchema.index({ lastPublishedAt: -1 });
TwitterPublishingConfigSchema.index({ dailyReset: -1 });

// 🧮 VIRTUAL PARA CALCULAR PRÓXIMA PUBLICACIÓN
TwitterPublishingConfigSchema.virtual('nextPublishingDue').get(function () {
  if (!this.lastPublishedAt) return new Date();
  return new Date(this.lastPublishedAt.getTime() + (this.publishingFrequency * 60 * 1000));
});

// 🧮 VIRTUAL PARA VERIFICAR SI PUEDE PUBLICAR HOY
TwitterPublishingConfigSchema.virtual('canPublishToday').get(function () {
  // Resetear contador si es un nuevo día
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (!this.dailyReset || this.dailyReset < today) {
    return this.maxTweetsPerDay > 0;
  }

  return this.tweetsToday < this.maxTweetsPerDay;
});

// 🧮 VIRTUAL PARA ESTADO GENERAL
TwitterPublishingConfigSchema.virtual('status').get(function () {
  if (!this.isActive) return 'inactive';
  if (!this.connectionStatus?.isConnected) return 'disconnected';
  // Calcular canPublishToday manualmente
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let canPublish = this.maxTweetsPerDay > 0;

  if (!this.dailyReset || this.dailyReset < today) {
    canPublish = this.maxTweetsPerDay > 0;
  } else {
    canPublish = this.tweetsToday < this.maxTweetsPerDay;
  }

  if (!canPublish) return 'daily_limit_reached';
  return 'ready';
});

// 📊 MÉTODO PARA RESETEAR CONTADOR DIARIO
TwitterPublishingConfigSchema.methods.resetDailyCounter = function () {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (!this.dailyReset || this.dailyReset < today) {
    this.tweetsToday = 0;
    this.dailyReset = today;
    return this.save();
  }
};
