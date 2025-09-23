import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NoticiasExtractionLogDocument = NoticiasExtractionLog & Document;

/**
 * 📊 Schema para logs detallados de extracción de noticias
 * Permite monitoreo, debugging y análisis de performance
 */
@Schema({ timestamps: true })
export class NoticiasExtractionLog {
  @Prop({ required: true, trim: true })
  sourceUrl: string; // URL que se intentó extraer

  @Prop({ required: true, trim: true })
  domain: string; // Dominio de la URL

  @Prop({ type: Types.ObjectId, ref: 'NoticiasExtractionConfig' })
  configId?: Types.ObjectId; // Configuración usada (null si no existe config)

  @Prop({ trim: true })
  jobId?: string; // ID del job en Bull queue (si aplica)

  @Prop({ required: true, trim: true })
  facebookPostId: string; // Post de Facebook origen

  @Prop({ enum: ['success', 'error', 'partial', 'skipped'], required: true })
  status: 'success' | 'error' | 'partial' | 'skipped';

  @Prop({ required: true })
  method: 'cheerio' | 'puppeteer' | 'manual'; // Método usado para extracción

  @Prop({ required: true })
  processingTime: number; // Tiempo total de procesamiento (ms)

  @Prop({ required: true })
  httpStatusCode: number; // Status code de la respuesta HTTP

  @Prop({ type: Object })
  extractedData?: {
    title?: string;
    contentLength?: number;
    imagesCount?: number;
    categoriesCount?: number;
    tagsCount?: number;
    hasAuthor?: boolean;
    hasPublishedDate?: boolean;
  };

  @Prop({ type: Object })
  error?: {
    message: string;
    code?: string;
    type: 'network' | 'parsing' | 'selector' | 'timeout' | 'rate_limit' | 'unknown';
    details?: Record<string, unknown>;
    stackTrace?: string;
  };

  @Prop({ type: Object })
  requestMetadata: {
    userAgent: string;
    headers: Record<string, string>;
    timeout: number;
    retryAttempt: number;
    ipAddress?: string;
  };

  @Prop({ type: Object })
  responseMetadata?: {
    size: number; // Tamaño de la respuesta en bytes
    contentType?: string;
    encoding?: string;
    redirects?: number;
    finalUrl?: string; // URL final después de redirects
  };

  @Prop({ type: Object })
  qualityAssessment?: {
    titleQuality: 'good' | 'fair' | 'poor';
    contentQuality: 'good' | 'fair' | 'poor';
    structureScore: number; // 0-100
    completenessScore: number; // 0-100
    confidenceScore: number; // 0-100
  };

  @Prop({ type: [String], default: [] })
  warnings: string[]; // Warnings durante extracción

  @Prop({ type: Object })
  performanceMetrics?: {
    dnsLookupTime?: number;
    connectionTime?: number;
    tlsHandshakeTime?: number;
    firstByteTime?: number;
    downloadTime?: number;
    parsingTime?: number;
  };

  @Prop({ type: Object })
  cacheInfo?: {
    hit: boolean;
    key?: string;
    ttl?: number;
  };

  @Prop({ type: Object })
  rawResponse?: Record<string, unknown>; // Respuesta raw para debugging

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const NoticiasExtractionLogSchema = SchemaFactory.createForClass(NoticiasExtractionLog);

// Índices para análisis y monitoreo
NoticiasExtractionLogSchema.index({ sourceUrl: 1 });
NoticiasExtractionLogSchema.index({ domain: 1 });
NoticiasExtractionLogSchema.index({ status: 1 });
NoticiasExtractionLogSchema.index({ createdAt: -1 });
NoticiasExtractionLogSchema.index({ facebookPostId: 1 });
NoticiasExtractionLogSchema.index({ method: 1 });

// Índices compuestos para análisis de performance
NoticiasExtractionLogSchema.index({ domain: 1, status: 1, createdAt: -1 });
NoticiasExtractionLogSchema.index({ status: 1, processingTime: 1 });
NoticiasExtractionLogSchema.index({ 'error.type': 1, createdAt: -1 });