import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PublishingQueueDocument = PublishingQueue & Document;

/**
 * 📋 Schema para cola de publicación inteligente
 * Administra la programación y publicación automática de noticias
 */
@Schema({
  timestamps: true,
  collection: 'publishing_queue'
})
export class PublishingQueue {
  // ========================================
  // 🔗 RELACIONES
  // ========================================

  @Prop({ type: Types.ObjectId, ref: 'PublishedNoticia' })
  noticiaId?: Types.ObjectId; // ID de la noticia publicada (se guarda después de publicar)

  @Prop({ type: Types.ObjectId, ref: 'AIContentGeneration', required: true })
  contentId: Types.ObjectId; // ID del contenido generado original

  // ========================================
  // ⏰ SCHEDULING
  // ========================================

  @Prop({ required: true, index: true })
  scheduledPublishAt: Date; // Fecha/hora programada para publicación

  @Prop({
    enum: ['breaking', 'news', 'blog'],
    required: true,
    index: true
  })
  queueType: 'breaking' | 'news' | 'blog'; // Tipo de publicación

  @Prop({ required: true, index: true })
  priority: number; // 10 (breaking), 8 (news), 3 (blog)

  // ========================================
  // 📊 ESTADO
  // ========================================

  @Prop({
    enum: ['queued', 'processing', 'published', 'failed', 'cancelled'],
    default: 'queued',
    required: true,
    index: true
  })
  status: 'queued' | 'processing' | 'published' | 'failed' | 'cancelled';

  @Prop()
  bullJobId?: string; // ID del job en BullMQ

  @Prop({ index: true })
  publishedAt?: Date; // Cuándo se publicó realmente

  // ========================================
  // 🛠️ METADATA DE PROCESAMIENTO
  // ========================================

  @Prop({ type: Object })
  processingMetadata?: {
    attemptCount: number; // Número de intentos de publicación
    lastAttemptAt?: Date; // Último intento
    lastError?: string; // Último error encontrado
    processingStartedAt?: Date; // Cuándo inició el procesamiento
    processingCompletedAt?: Date; // Cuándo completó el procesamiento
    actualPublishTime?: Date; // Timestamp real de publicación
    delayFromScheduled?: number; // Delay en ms vs hora programada
  };

  // ========================================
  // 📐 METADATA DE CÁLCULO
  // ========================================

  @Prop({ type: Object })
  calculationMetadata?: {
    queueSizeAtScheduling: number; // Tamaño de cola al momento del scheduling
    queuePositionAtScheduling: number; // Posición en cola
    baseIntervalMs: number; // Intervalo base calculado (sin randomización)
    priorityMultiplier: number; // Multiplicador aplicado (0.7 o 1.0)
    randomizationFactor: number; // Factor de randomización (0.85-1.15)
    finalIntervalMs: number; // Intervalo final aplicado
    timeWindow: 'peak' | 'valley' | 'normal'; // Ventana de tiempo detectada
    adjustedForTimeWindow: boolean; // Si se ajustó por time window
    originalScheduledAt?: Date; // Hora original antes de ajustes
  };

  // ========================================
  // 🔄 AUDITORÍA
  // ========================================

  @Prop({ type: Types.ObjectId, ref: 'User' })
  scheduledBy?: Types.ObjectId; // Usuario que programó (Fase 2 con auth)

  @Prop()
  cancelledAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  cancelledBy?: Types.ObjectId;

  @Prop()
  cancelReason?: string;

  @Prop({ type: [String], default: [] })
  errors: string[]; // Historial de errores

  @Prop({ type: [String], default: [] })
  warnings: string[]; // Advertencias

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const PublishingQueueSchema = SchemaFactory.createForClass(PublishingQueue);

// ========================================
// 📇 ÍNDICES PARA PERFORMANCE
// ========================================

// Índice compuesto para queries de cola activa
PublishingQueueSchema.index({ status: 1, scheduledPublishAt: 1 });

// Índice para ordenar por prioridad
PublishingQueueSchema.index({ priority: -1, scheduledPublishAt: 1 });

// Índice para buscar por tipo de cola
PublishingQueueSchema.index({ queueType: 1, status: 1 });

// Índice para buscar jobs de BullMQ
PublishingQueueSchema.index({ bullJobId: 1 });

// Índice para buscar por contentId (evitar duplicados en cola)
PublishingQueueSchema.index({ contentId: 1, status: 1 });

// ========================================
// 🪝 MIDDLEWARES & HOOKS
// ========================================

// Pre-save: Actualizar updatedAt
PublishingQueueSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});
