import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NoticiasExtractionJobDocument = NoticiasExtractionJob & Document;

/**
 * 🔄 Schema para jobs de extracción de noticias en la queue
 * Trackea el estado y progreso de extracciones asíncronas
 */
@Schema({ timestamps: true })
export class NoticiasExtractionJob {
  @Prop({ required: true, unique: true, trim: true })
  jobId: string; // ID del job en Bull queue

  @Prop({ required: true, trim: true })
  sourceUrl: string; // URL a extraer

  @Prop({ required: true, trim: true })
  domain: string; // Dominio de la URL

  @Prop({ type: Types.ObjectId, ref: 'NoticiasExtractionConfig', required: true })
  configId: Types.ObjectId; // Configuración a usar

  @Prop({ required: true, trim: true })
  facebookPostId: string; // Post de Facebook origen

  @Prop({ trim: true })
  pageId?: string; // ID de página de Facebook

  @Prop({
    enum: ['pending', 'active', 'completed', 'failed', 'delayed', 'waiting'],
    default: 'pending'
  })
  status: 'pending' | 'active' | 'completed' | 'failed' | 'delayed' | 'waiting';

  @Prop({ min: 0, max: 100, default: 0 })
  progress: number; // Progreso del job (0-100%)

  @Prop()
  startedAt?: Date; // Cuando comenzó el procesamiento

  @Prop()
  completedAt?: Date; // Cuando terminó (exitoso o fallido)

  @Prop({ type: Object })
  result?: {
    extractedNoticiaId?: Types.ObjectId; // ID de la noticia extraída (si exitoso)
    success: boolean;
    processingTime?: number; // Tiempo total de procesamiento (ms)
    method?: 'cheerio' | 'puppeteer'; // Método usado
    contentLength?: number; // Longitud del contenido extraído
    imagesFound?: number; // Número de imágenes encontradas
  };

  @Prop({ type: Object })
  error?: {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
    stackTrace?: string;
    retryCount?: number;
  };

  @Prop({ type: Object, default: {} })
  jobOptions: {
    priority?: number; // Prioridad del job (1-10)
    attempts?: number; // Número de intentos
    delay?: number; // Delay antes de procesar (ms)
    timeout?: number; // Timeout del job (ms)
    removeOnComplete?: boolean;
    removeOnFail?: boolean;
  };

  @Prop({ type: Object })
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    triggeredBy?: 'manual' | 'automatic' | 'scheduled';
    batchId?: string; // Si forma parte de un batch de extracciones
  };

  @Prop({ default: 0 })
  retryCount: number; // Número de reintentos realizados

  @Prop()
  nextRetryAt?: Date; // Cuándo se reintentará (si aplica)

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const NoticiasExtractionJobSchema = SchemaFactory.createForClass(NoticiasExtractionJob);

// Índices para performance de la queue
NoticiasExtractionJobSchema.index({ jobId: 1 });
NoticiasExtractionJobSchema.index({ status: 1 });
NoticiasExtractionJobSchema.index({ sourceUrl: 1 });
NoticiasExtractionJobSchema.index({ domain: 1 });
NoticiasExtractionJobSchema.index({ createdAt: -1 });
NoticiasExtractionJobSchema.index({ completedAt: -1 });
NoticiasExtractionJobSchema.index({ facebookPostId: 1 });

// Índices compuestos para queries de monitoreo
NoticiasExtractionJobSchema.index({ status: 1, createdAt: -1 });
NoticiasExtractionJobSchema.index({ domain: 1, status: 1 });