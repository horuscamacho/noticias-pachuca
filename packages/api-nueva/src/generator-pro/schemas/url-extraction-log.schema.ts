import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UrlExtractionLogDocument = UrlExtractionLog & Document;

/**
 * 📊 Schema para logs de extracción de URLs desde listados
 *
 * Propósito:
 * - Loggear cada ejecución de extracción de URLs
 * - Trackear cuántas URLs se encontraron
 * - Trackear cuántas URLs son nuevas vs duplicadas
 * - Métricas de performance
 * - Debugging de selectores
 */
@Schema({ timestamps: true })
export class UrlExtractionLog {
  // ========================================
  // 🔑 IDENTIFICACIÓN
  // ========================================

  @Prop({ required: true, type: Types.ObjectId, ref: 'NewsWebsiteConfig', index: true })
  websiteConfigId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  websiteName: string; // Nombre del sitio para búsquedas fáciles

  @Prop({ required: true, trim: true })
  listingUrl: string; // URL del listado escaneado

  // ========================================
  // 📊 RESULTADOS
  // ========================================

  @Prop({ required: true, enum: ['success', 'partial', 'failed'], index: true })
  status: 'success' | 'partial' | 'failed';

  @Prop({ required: true, default: 0 })
  totalUrlsFound: number; // Total de URLs encontradas en el listado

  @Prop({ required: true, default: 0 })
  newUrls: number; // URLs nuevas (no vistas antes)

  @Prop({ required: true, default: 0 })
  duplicateUrls: number; // URLs que ya existían

  @Prop({ required: true, default: 0 })
  skippedUrls: number; // URLs que se saltaron (filtros, etc)

  @Prop({ required: true, default: 0 })
  queuedUrls: number; // URLs agregadas a la cola de procesamiento

  // ========================================
  // ⏱️ MÉTRICAS DE PERFORMANCE
  // ========================================

  @Prop({ required: true })
  processingTime: number; // Tiempo total (ms)

  @Prop()
  fetchTime?: number; // Tiempo de fetch del listado (ms)

  @Prop()
  parsingTime?: number; // Tiempo de parsing con Cheerio/Puppeteer (ms)

  @Prop()
  dbOperationsTime?: number; // Tiempo de operaciones de BD (ms)

  // ========================================
  // 🔍 METADATA TÉCNICA
  // ========================================

  @Prop({ required: true, enum: ['cheerio', 'puppeteer'] })
  method: 'cheerio' | 'puppeteer';

  @Prop({ required: true })
  httpStatusCode: number;

  @Prop({ type: String })
  selector: string; // Selector usado (articleLinks)

  @Prop()
  htmlSize?: number; // Tamaño del HTML descargado (bytes)

  // ========================================
  // ❌ ERRORES Y WARNINGS
  // ========================================

  @Prop({ type: String })
  errorMessage?: string;

  @Prop({ type: String })
  errorType?: 'network' | 'parsing' | 'selector' | 'timeout' | 'rate_limit' | 'unknown';

  @Prop({ type: [String], default: [] })
  warnings: string[]; // Warnings no críticos

  // ========================================
  // 📝 SAMPLES PARA DEBUGGING
  // ========================================

  @Prop({ type: [String], default: [] })
  sampleUrls: string[]; // Primeras 5 URLs encontradas (para debugging)

  // ========================================
  // 🔧 METADATA
  // ========================================

  @Prop({ default: false })
  wasScheduled: boolean; // ¿Fue ejecución automática o manual?

  @Prop({ required: true })
  executedAt: Date; // Cuándo se ejecutó

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const UrlExtractionLogSchema = SchemaFactory.createForClass(UrlExtractionLog);

// ========================================
// 📇 ÍNDICES
// ========================================

UrlExtractionLogSchema.index({ websiteConfigId: 1, executedAt: -1 });
UrlExtractionLogSchema.index({ status: 1, executedAt: -1 });
UrlExtractionLogSchema.index({ websiteName: 1, executedAt: -1 });
UrlExtractionLogSchema.index({ executedAt: -1 }); // Para queries de rango temporal
