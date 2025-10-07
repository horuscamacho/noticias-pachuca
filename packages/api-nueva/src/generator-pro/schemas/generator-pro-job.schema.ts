import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GeneratorProJobDocument = GeneratorProJob & Document;

/**
 * 🤖 Schema para gestión de trabajos del sistema Generator Pro
 * Maneja la cola de trabajos para extracción, generación y publicación
 * Integra con Bull Queue para procesamiento asíncrono y retry logic
 */
@Schema({ timestamps: true })
export class GeneratorProJob {
  @Prop({ required: true, enum: ['extract_urls', 'extract_content', 'generate_content', 'publish_facebook', 'sync_engagement'] })
  type: string; // Tipo de trabajo a realizar

  @Prop({ required: true, type: Types.ObjectId })
  websiteConfigId: Types.ObjectId; // Referencia al sitio web

  @Prop({ type: Types.ObjectId })
  facebookConfigId?: Types.ObjectId; // Referencia a config Facebook (para publish jobs)

  @Prop({ type: Types.ObjectId })
  relatedEntityId?: Types.ObjectId; // ID de la entidad relacionada (noticia, contenido, etc.)

  @Prop({ required: true, enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'retrying'] })
  status: string;

  @Prop({ default: 5, min: 1, max: 10 })
  priority: number; // 1 = highest priority, 10 = lowest

  // 📋 DATA ESPECÍFICA DEL JOB
  @Prop({ type: Object, default: {} })
  data: {
    // Para extract_urls jobs
    listingUrl?: string;
    maxUrls?: number;

    // Para extract_content jobs
    targetUrl?: string;
    selectors?: Record<string, string>;

    // Para generate_content jobs
    originalContentId?: Types.ObjectId;
    templateId?: Types.ObjectId;
    generationSettings?: Record<string, unknown>;

    // Para publish_facebook jobs
    generatedContentId?: Types.ObjectId;
    postContent?: string;
    mediaUrls?: string[];
    scheduledAt?: Date;

    // Para sync_engagement jobs
    facebookPostIds?: string[];
    lastSyncAt?: Date;

    // Datos compartidos
    metadata?: Record<string, unknown>;
    userAgent?: string;
    customHeaders?: Record<string, string>;
  };

  // 📊 RESULTADO DEL JOB
  @Prop({ type: Object })
  result?: {
    // Para extract_urls jobs
    extractedUrls?: string[];
    urlsCount?: number;

    // Para extract_content jobs
    extractedContent?: {
      title?: string;
      content?: string;
      images?: string[];
      publishedAt?: Date;
      author?: string;
      category?: string;
    };

    // Para generate_content jobs
    generatedContentId?: Types.ObjectId;
    contentQuality?: number; // Score de calidad 0-100

    // Para publish_facebook jobs
    facebookPostId?: string;
    facebookPostUrl?: string;
    getLatePostUrl?: string;
    engagement?: {
      likes?: number;
      comments?: number;
      shares?: number;
    };

    // Para sync_engagement jobs
    syncedPosts?: number;
    totalEngagement?: number;

    // Datos compartidos
    processingStats?: {
      duration?: number; // ms
      memoryUsed?: number; // bytes
      apiCalls?: number;
      bytesProcessed?: number;
    };
  };

  // 🚨 MANEJO DE ERRORES Y RETRY
  @Prop({ type: String })
  error?: string; // Mensaje de error si el job falló

  @Prop({ type: Object })
  errorDetails?: {
    code?: string;
    message?: string;
    stack?: string;
    httpStatus?: number;
    apiResponse?: Record<string, unknown>;
    timestamp?: Date;
  };

  @Prop({ default: 0 })
  retryCount: number; // Número de intentos realizados

  @Prop({ default: 3 })
  maxRetries: number; // Máximo número de reintentos

  @Prop({ type: Array, default: [] })
  retryHistory: Array<{
    attempt: number;
    error: string;
    timestamp: Date;
    duration?: number;
  }>;

  // ⏰ PROGRAMACIÓN Y TIEMPOS
  @Prop({ default: Date.now })
  scheduledAt: Date; // Cuándo debe ejecutarse

  @Prop()
  startedAt?: Date; // Cuándo comenzó la ejecución

  @Prop()
  completedAt?: Date; // Cuándo terminó la ejecución

  @Prop()
  processingTime?: number; // Tiempo total de procesamiento en ms

  @Prop()
  nextRetryAt?: Date; // Cuándo debe reintentarse si falla

  // 🔧 CONFIGURACIÓN DEL JOB
  @Prop({ type: Object, default: {} })
  options: {
    timeout?: number; // Timeout en ms
    delay?: number; // Delay antes de ejecutar
    backoff?: {
      type: 'exponential' | 'fixed';
      delay: number;
    };
    removeOnComplete?: number; // Remover después de N completados
    removeOnFail?: number; // Remover después de N fallos
  };

  // 📈 MÉTRICAS Y TRACKING
  @Prop({ type: Object, default: {} })
  metrics: {
    queueWaitTime?: number; // Tiempo en cola antes de procesar
    executionEfficiency?: number; // Eficiencia 0-100
    resourceUsage?: {
      cpu?: number; // Porcentaje CPU usado
      memory?: number; // MB memoria usada
      network?: number; // KB transferidos
    };
    dependencyLatency?: Record<string, number>; // Latencia APIs externas
  };

  // 🔗 RELACIONES Y DEPENDENCIAS
  @Prop({ type: Array, default: [] })
  dependencies: Types.ObjectId[]; // Jobs que deben completarse antes

  @Prop({ type: Array, default: [] })
  childJobs: Types.ObjectId[]; // Jobs creados por este job

  @Prop({ type: Types.ObjectId })
  parentJobId?: Types.ObjectId; // Job padre si es un subjob

  // 🏷️ TAGS Y CATEGORIZACIÓN
  @Prop({ type: Array, default: [] })
  tags: string[]; // Tags para filtrado y agrupación

  @Prop({ type: String })
  batchId?: string; // ID para agrupar jobs relacionados

  @Prop({ type: String })
  workerId?: string; // ID del worker que procesó el job

  @Prop({ trim: true })
  notes?: string; // Notas adicionales

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const GeneratorProJobSchema = SchemaFactory.createForClass(GeneratorProJob);

// 🔍 ÍNDICES PARA PERFORMANCE
GeneratorProJobSchema.index({ type: 1, status: 1 });
GeneratorProJobSchema.index({ websiteConfigId: 1, status: 1 });
GeneratorProJobSchema.index({ scheduledAt: 1, status: 1 });
GeneratorProJobSchema.index({ priority: 1, scheduledAt: 1 });
GeneratorProJobSchema.index({ status: 1, nextRetryAt: 1 });
GeneratorProJobSchema.index({ batchId: 1 });
GeneratorProJobSchema.index({ tags: 1 });
GeneratorProJobSchema.index({ createdAt: -1 });

// 🧮 VIRTUAL PARA ESTADO CALCULADO
GeneratorProJobSchema.virtual('isOverdue').get(function () {
  return this.scheduledAt < new Date() && ['pending', 'retrying'].includes(this.status);
});

GeneratorProJobSchema.virtual('canRetry').get(function () {
  return this.retryCount < this.maxRetries && this.status === 'failed';
});

GeneratorProJobSchema.virtual('totalProcessingTime').get(function () {
  if (this.startedAt && this.completedAt) {
    return this.completedAt.getTime() - this.startedAt.getTime();
  }
  return this.processingTime || 0;
});

// 📊 MÉTODOS PARA ACTUALIZAR ESTADO
GeneratorProJobSchema.methods.markAsStarted = function () {
  this.status = 'processing';
  this.startedAt = new Date();
  return this.save();
};

GeneratorProJobSchema.methods.markAsCompleted = function (result?: Record<string, unknown>) {
  this.status = 'completed';
  this.completedAt = new Date();
  if (this.startedAt) {
    this.processingTime = this.completedAt.getTime() - this.startedAt.getTime();
  }
  if (result) {
    this.result = { ...this.result, ...result };
  }
  return this.save();
};

GeneratorProJobSchema.methods.markAsFailed = function (error: string, errorDetails?: Record<string, unknown>) {
  this.status = 'failed';
  this.error = error;
  if (errorDetails) {
    this.errorDetails = { ...errorDetails, timestamp: new Date() };
  }

  // Agregar al historial de reintentos
  this.retryHistory.push({
    attempt: this.retryCount + 1,
    error,
    timestamp: new Date(),
    duration: this.startedAt ? Date.now() - this.startedAt.getTime() : 0,
  });

  return this.save();
};

GeneratorProJobSchema.methods.scheduleRetry = function (delayMs = 60000) {
  if (this.canRetry) {
    this.status = 'retrying';
    this.retryCount += 1;
    this.nextRetryAt = new Date(Date.now() + delayMs);
    return this.save();
  }
  throw new Error('Job cannot be retried');
};