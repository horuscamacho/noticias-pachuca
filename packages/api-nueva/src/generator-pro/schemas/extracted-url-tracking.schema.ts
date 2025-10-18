import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Interface para métodos del documento
 */
export interface ExtractedUrlTrackingMethods {
  markAsQueued(): Promise<ExtractedUrlTrackingDocument>;
  markAsProcessing(): Promise<ExtractedUrlTrackingDocument>;
  markAsCompleted(extractedNoticiaId?: Types.ObjectId, processingTime?: number): Promise<ExtractedUrlTrackingDocument>;
  markAsFailed(reason: string): Promise<ExtractedUrlTrackingDocument>;
  updateLastSeen(): Promise<ExtractedUrlTrackingDocument>;
}

export type ExtractedUrlTrackingDocument = ExtractedUrlTracking & Document & ExtractedUrlTrackingMethods;

/**
 * 🔗 Schema para trackear URLs extraídas y evitar duplicados
 *
 * Propósito:
 * - Guardar todas las URLs extraídas de listados
 * - Detectar URLs duplicadas
 * - Trackear estado de procesamiento de cada URL
 * - Permitir re-extracción después de X días (contenido actualizado)
 */
@Schema({ timestamps: true })
export class ExtractedUrlTracking {
  // ========================================
  // 🔑 IDENTIFICACIÓN
  // ========================================

  @Prop({ required: true, type: Types.ObjectId, ref: 'NewsWebsiteConfig', index: true })
  websiteConfigId: Types.ObjectId; // Sitio del que se extrajo

  @Prop({ required: true, trim: true, index: true })
  url: string; // URL completa de la noticia

  @Prop({ required: true, trim: true, index: true })
  urlHash: string; // Hash SHA-256 de la URL (para búsquedas rápidas)

  @Prop({ required: true, trim: true })
  domain: string; // Dominio extraído de la URL

  // ========================================
  // 📊 ESTADO DE PROCESAMIENTO
  // ========================================

  @Prop({
    required: true,
    enum: ['discovered', 'queued', 'processing', 'completed', 'failed', 'skipped'],
    default: 'discovered',
    index: true,
  })
  status: 'discovered' | 'queued' | 'processing' | 'completed' | 'failed' | 'skipped';

  @Prop()
  queuedAt?: Date; // Cuándo se agregó a la cola

  @Prop()
  processedAt?: Date; // Cuándo se procesó completamente

  @Prop({ type: String })
  failureReason?: string; // Razón de fallo si status = 'failed'

  // ========================================
  // 🔍 METADATA DE EXTRACCIÓN
  // ========================================

  @Prop({ required: true })
  firstDiscoveredAt: Date; // Primera vez que se descubrió

  @Prop({ required: true })
  lastSeenAt: Date; // Última vez que apareció en el listado

  @Prop({ default: 1 })
  timesDiscovered: number; // Cuántas veces ha aparecido en listados

  @Prop({ type: String })
  title?: string; // Título si se pudo extraer del listado

  @Prop({ type: String })
  imageUrl?: string; // Imagen si se pudo extraer del listado

  // ========================================
  // 🔄 CONTROL DE RE-EXTRACCIÓN
  // ========================================

  @Prop({ default: false })
  allowReExtraction: boolean; // ¿Permitir re-extraer después de X días?

  @Prop({ default: 30 })
  reExtractionDays: number; // Días después de los cuales se puede re-extraer (default: 30)

  @Prop()
  nextReExtractionAllowedAt?: Date; // Cuándo se permite re-extraer

  // ========================================
  // 📝 REFERENCIAS
  // ========================================

  @Prop({ type: Types.ObjectId, ref: 'ExtractedNoticia' })
  extractedNoticiaId?: Types.ObjectId; // Referencia a contenido extraído (si existe)

  @Prop({ type: Types.ObjectId, ref: 'AIContentGeneration' })
  generatedContentId?: Types.ObjectId; // Referencia a contenido generado (si existe)

  @Prop({ type: Types.ObjectId, ref: 'PublishedNoticia' })
  publishedNoticiaId?: Types.ObjectId; // Referencia a noticia publicada (si existe)

  // ========================================
  // 📊 MÉTRICAS
  // ========================================

  @Prop({ default: 0 })
  extractionAttempts: number; // Intentos de extracción

  @Prop()
  lastExtractionAttempt?: Date;

  @Prop({ type: Number })
  processingTime?: number; // Tiempo de procesamiento (ms)

  // ========================================
  // 🔧 METADATA
  // ========================================

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ExtractedUrlTrackingSchema = SchemaFactory.createForClass(ExtractedUrlTracking);

// ========================================
// 📇 ÍNDICES
// ========================================

// Índice único: Un sitio no puede tener la misma URL dos veces
ExtractedUrlTrackingSchema.index(
  { websiteConfigId: 1, urlHash: 1 },
  { unique: true },
);

// Índices de búsqueda
ExtractedUrlTrackingSchema.index({ url: 1 });
ExtractedUrlTrackingSchema.index({ domain: 1, status: 1 });
ExtractedUrlTrackingSchema.index({ status: 1, createdAt: -1 });
ExtractedUrlTrackingSchema.index({ websiteConfigId: 1, status: 1, lastSeenAt: -1 });

// Índice para re-extracción
ExtractedUrlTrackingSchema.index({
  status: 1,
  allowReExtraction: 1,
  nextReExtractionAllowedAt: 1,
});

// ========================================
// 🔧 MÉTODOS
// ========================================

ExtractedUrlTrackingSchema.methods.markAsQueued = function (): Promise<ExtractedUrlTrackingDocument> {
  this.status = 'queued';
  this.queuedAt = new Date();
  return this.save();
};

ExtractedUrlTrackingSchema.methods.markAsProcessing = function (): Promise<ExtractedUrlTrackingDocument> {
  this.status = 'processing';
  this.extractionAttempts += 1;
  this.lastExtractionAttempt = new Date();
  return this.save();
};

ExtractedUrlTrackingSchema.methods.markAsCompleted = function (
  extractedNoticiaId?: Types.ObjectId,
  processingTime?: number,
): Promise<ExtractedUrlTrackingDocument> {
  this.status = 'completed';
  this.processedAt = new Date();
  if (extractedNoticiaId) {
    this.extractedNoticiaId = extractedNoticiaId;
  }
  if (processingTime) {
    this.processingTime = processingTime;
  }
  // Calcular próxima re-extracción si está habilitada
  if (this.allowReExtraction) {
    this.nextReExtractionAllowedAt = new Date(
      Date.now() + this.reExtractionDays * 24 * 60 * 60 * 1000,
    );
  }
  return this.save();
};

ExtractedUrlTrackingSchema.methods.markAsFailed = function (reason: string): Promise<ExtractedUrlTrackingDocument> {
  this.status = 'failed';
  this.failureReason = reason;
  this.processedAt = new Date();
  return this.save();
};

ExtractedUrlTrackingSchema.methods.updateLastSeen = function (): Promise<ExtractedUrlTrackingDocument> {
  this.lastSeenAt = new Date();
  this.timesDiscovered += 1;
  return this.save();
};
