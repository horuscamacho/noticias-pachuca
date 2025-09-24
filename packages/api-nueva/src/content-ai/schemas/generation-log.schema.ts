import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GenerationLogDocument = GenerationLog & Document;

/**
 * 📊 Schema para logs de generación de contenido AI
 * Auditoría completa, debugging y cost tracking
 */
@Schema({ timestamps: true })
export class GenerationLog {
  @Prop({ type: Types.ObjectId, ref: 'GenerationJob', required: true })
  jobId: Types.ObjectId; // Referencia al job

  @Prop({ type: Types.ObjectId, ref: 'AIContentGeneration' })
  generationId?: Types.ObjectId; // Referencia al contenido generado (si exitoso)

  @Prop({ type: Types.ObjectId, ref: 'AIProvider', required: true })
  providerId: Types.ObjectId; // Proveedor utilizado

  @Prop({ type: Types.ObjectId, ref: 'ContentAgent', required: true })
  agentId: Types.ObjectId; // Agente utilizado

  @Prop({ type: Types.ObjectId, ref: 'PromptTemplate', required: true })
  templateId: Types.ObjectId; // Template utilizado

  @Prop({
    required: true,
    enum: ['started', 'completed', 'failed', 'warning', 'info', 'debug'],
    trim: true
  })
  logLevel: 'started' | 'completed' | 'failed' | 'warning' | 'info' | 'debug';

  @Prop({ required: true })
  message: string; // Mensaje del log

  @Prop({ type: Object })
  requestData?: {
    originalTitle?: string; // Título original
    originalContentLength?: number; // Longitud contenido original
    promptVariables?: Record<string, string>; // Variables del prompt
    modelParameters?: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      frequencyPenalty?: number;
      presencePenalty?: number;
    };
  };

  @Prop({ type: Object })
  responseData?: {
    generatedTitle?: string; // Título generado
    generatedContentLength?: number; // Longitud contenido generado
    finishReason?: string; // Razón de finalización
    filterResults?: string[]; // Resultados de filtros de contenido
  };

  @Prop({ type: Object })
  usage?: {
    promptTokens: number; // Tokens del prompt
    completionTokens: number; // Tokens de completion
    totalTokens: number; // Total tokens
    cost: number; // Costo de la operación
    processingTime: number; // Tiempo de procesamiento (ms)
    waitTime?: number; // Tiempo en cola (ms)
    rateLimitDelay?: number; // Delay por rate limiting (ms)
  };

  @Prop({ type: Object })
  errorDetails?: {
    errorCode?: string; // Código de error del provider
    errorMessage?: string; // Mensaje de error
    httpStatus?: number; // Status HTTP del error
    retryable?: boolean; // Si el error es reintentable
    suggestedAction?: string; // Acción sugerida
    stackTrace?: string; // Stack trace (solo en debug)
  };

  @Prop({ type: Object })
  performance?: {
    requestLatency?: number; // Latencia del request (ms)
    throughput?: number; // Tokens por segundo
    queuePosition?: number; // Posición en cola al inicio
    systemLoad?: number; // Carga del sistema 0-100%
    memoryUsage?: number; // Uso de memoria (MB)
  };

  @Prop({ type: Object })
  context?: {
    sessionId?: string; // ID de sesión
    userId?: Types.ObjectId; // Usuario asociado
    ipAddress?: string; // IP del request
    userAgent?: string; // User agent
    apiVersion?: string; // Versión de API usada
    environment?: 'development' | 'staging' | 'production'; // Ambiente
  };

  @Prop({ type: [String], default: [] })
  tags: string[]; // Tags para categorización: ["urgent", "batch", "retry"]

  @Prop({ type: Object })
  metadata?: {
    correlationId?: string; // ID de correlación para debugging
    parentLogId?: Types.ObjectId; // Log padre (para sub-operaciones)
    batchId?: string; // ID del batch si aplica
    experimentId?: string; // ID de experimento A/B
    modelVersion?: string; // Versión específica del modelo
  };

  @Prop({ default: Date.now })
  timestamp: Date; // Timestamp exacto del evento

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const GenerationLogSchema = SchemaFactory.createForClass(GenerationLog);

// Índices para performance y queries comunes
GenerationLogSchema.index({ jobId: 1 });
GenerationLogSchema.index({ generationId: 1 });
GenerationLogSchema.index({ providerId: 1 });
GenerationLogSchema.index({ agentId: 1 });
GenerationLogSchema.index({ templateId: 1 });
GenerationLogSchema.index({ logLevel: 1 });
GenerationLogSchema.index({ timestamp: -1 });
GenerationLogSchema.index({ tags: 1 });
GenerationLogSchema.index({ 'context.userId': 1 });
GenerationLogSchema.index({ 'context.environment': 1 });
GenerationLogSchema.index({ 'metadata.correlationId': 1 });
GenerationLogSchema.index({ 'metadata.batchId': 1 });

// Índices compuestos para analytics y debugging
GenerationLogSchema.index({ providerId: 1, logLevel: 1, timestamp: -1 });
GenerationLogSchema.index({ agentId: 1, logLevel: 1, timestamp: -1 });
GenerationLogSchema.index({ jobId: 1, timestamp: 1 }); // Para timeline de job
GenerationLogSchema.index({ logLevel: 1, timestamp: -1, providerId: 1 }); // Para error tracking
GenerationLogSchema.index({ 'usage.cost': -1, timestamp: -1 }); // Para cost tracking
GenerationLogSchema.index({ 'performance.requestLatency': -1, timestamp: -1 }); // Para performance monitoring

// Índice TTL para auto-limpieza de logs antiguos (opcional, 90 días)
GenerationLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 días