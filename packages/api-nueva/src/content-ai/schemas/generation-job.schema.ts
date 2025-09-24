import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GenerationJobDocument = GenerationJob & Document;

/**
 * ⚙️ Schema para jobs de generación de contenido AI
 * Gestiona la cola de procesamiento y batch operations
 */
@Schema({ timestamps: true })
export class GenerationJob {
  @Prop({ required: true, trim: true, unique: true })
  jobId: string; // ID único del job (UUID)

  @Prop({
    required: true,
    enum: ['single', 'batch', 'scheduled', 'retry'],
    trim: true
  })
  jobType: 'single' | 'batch' | 'scheduled' | 'retry'; // Tipo de job

  @Prop({
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'paused'],
    default: 'pending'
  })
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'paused';

  @Prop({ required: true, min: 1, max: 10 })
  priority: number; // Prioridad del job (1-10, 10 = máxima)

  @Prop({ type: [{ type: Types.ObjectId, ref: 'ExtractedNoticia' }], required: true })
  contentIds: Types.ObjectId[]; // IDs de contenido a procesar

  @Prop({ type: Types.ObjectId, ref: 'ContentAgent', required: true })
  agentId: Types.ObjectId; // Agente asignado

  @Prop({ type: Types.ObjectId, ref: 'PromptTemplate', required: true })
  templateId: Types.ObjectId; // Template a usar

  @Prop({ type: Types.ObjectId, ref: 'AIProvider' })
  providerId?: Types.ObjectId; // Proveedor específico (opcional)

  @Prop({ type: Object })
  jobConfiguration?: {
    batchSize?: number; // Tamaño del batch
    maxRetries?: number; // Máximo reintentos
    retryDelay?: number; // Delay entre reintentos (ms)
    timeoutMs?: number; // Timeout por item (ms)
    parallelProcessing?: boolean; // Procesamiento paralelo
    customPromptVars?: Record<string, string>; // Variables custom del prompt
  };

  @Prop({ type: Object })
  progress: {
    totalItems: number; // Total de items a procesar
    processedItems: number; // Items procesados
    successfulItems: number; // Items exitosos
    failedItems: number; // Items fallidos
    currentItem?: number; // Item actual (índice)
    percentComplete: number; // Porcentaje completado 0-100
    estimatedTimeRemaining?: number; // Tiempo estimado restante (ms)
  };

  @Prop({ type: [{ type: Types.ObjectId, ref: 'AIContentGeneration' }], default: [] })
  generatedContentIds: Types.ObjectId[]; // IDs de contenido generado

  @Prop({ type: [String], default: [] })
  errors: string[]; // Errores del job

  @Prop({ type: [String], default: [] })
  warnings: string[]; // Advertencias del job

  @Prop({ type: Object })
  timing: {
    queuedAt: Date; // Cuando se encoló
    startedAt?: Date; // Cuando empezó a procesarse
    completedAt?: Date; // Cuando se completó
    totalDuration?: number; // Duración total (ms)
    avgProcessingTime?: number; // Tiempo promedio por item (ms)
  };

  @Prop({ type: Object })
  resourceUsage?: {
    totalTokens?: number; // Total tokens consumidos
    totalCost?: number; // Costo total del job
    avgTokensPerItem?: number; // Tokens promedio por item
    peakMemoryUsage?: number; // Pico de memoria (MB)
    cpuTime?: number; // Tiempo de CPU (ms)
  };

  @Prop({ type: Types.ObjectId, ref: 'User' })
  requestedBy?: Types.ObjectId; // Usuario que solicitó el job

  @Prop({ trim: true })
  description?: string; // Descripción del job

  @Prop({ type: Object })
  schedulingInfo?: {
    scheduledAt?: Date; // Programado para ejecutarse
    cronPattern?: string; // Patrón cron para jobs recurrentes
    isRecurring?: boolean; // Es un job recurrente
    nextRun?: Date; // Próxima ejecución
    lastRun?: Date; // Última ejecución
  };

  @Prop({ type: Object })
  retryInfo?: {
    retryCount: number; // Número de reintentos
    maxRetries: number; // Máximo reintentos permitidos
    lastRetryAt?: Date; // Último reintento
    originalJobId?: string; // ID del job original
    retryReason?: string; // Razón del reintento
  };

  @Prop({ type: Object })
  callback?: {
    webhookUrl?: string; // URL de webhook para notificar completion
    emailNotification?: string; // Email para notificaciones
    slackChannel?: string; // Canal de Slack para notificar
    notifyOnComplete?: boolean; // Notificar al completar
    notifyOnError?: boolean; // Notificar en errores
  };

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const GenerationJobSchema = SchemaFactory.createForClass(GenerationJob);

// Índices para performance y queries comunes
GenerationJobSchema.index({ jobId: 1 });
GenerationJobSchema.index({ status: 1 });
GenerationJobSchema.index({ priority: -1 });
GenerationJobSchema.index({ jobType: 1 });
GenerationJobSchema.index({ agentId: 1 });
GenerationJobSchema.index({ templateId: 1 });
GenerationJobSchema.index({ providerId: 1 });
GenerationJobSchema.index({ requestedBy: 1 });
GenerationJobSchema.index({ 'timing.queuedAt': 1 });
GenerationJobSchema.index({ 'timing.completedAt': -1 });
GenerationJobSchema.index({ 'schedulingInfo.scheduledAt': 1 });
GenerationJobSchema.index({ 'schedulingInfo.nextRun': 1 });

// Índices compuestos para queue processing
GenerationJobSchema.index({ status: 1, priority: -1, 'timing.queuedAt': 1 });
GenerationJobSchema.index({ status: 1, jobType: 1, priority: -1 });
GenerationJobSchema.index({ agentId: 1, status: 1, 'timing.completedAt': -1 });
GenerationJobSchema.index({ providerId: 1, status: 1, 'resourceUsage.totalCost': -1 });