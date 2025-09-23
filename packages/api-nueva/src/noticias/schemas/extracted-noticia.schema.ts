import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExtractedNoticiaDocument = ExtractedNoticia & Document;

/**
 * 📰 Schema para noticias extraídas de sitios web
 * Contiene el contenido procesado y metadata de extracción
 */
@Schema({ timestamps: true })
export class ExtractedNoticia {
  @Prop({ required: true, trim: true })
  sourceUrl: string; // URL original de la noticia

  @Prop({ required: true, trim: true })
  domain: string; // Dominio extraído de sourceUrl

  @Prop({ required: true, trim: true })
  facebookPostId: string; // ID del post de Facebook que contenía esta URL

  @Prop({ required: true, trim: true })
  title: string; // Título extraído

  @Prop({ required: true, type: String })
  content: string; // Contenido principal extraído

  @Prop({ type: [String], default: [] })
  images: string[]; // URLs de imágenes extraídas

  @Prop()
  publishedAt?: Date; // Fecha de publicación original

  @Prop({ trim: true })
  author?: string; // Autor extraído

  @Prop({ type: [String], default: [] })
  categories: string[]; // Categorías extraídas

  @Prop({ trim: true })
  excerpt?: string; // Resumen/extracto extraído

  @Prop({ type: [String], default: [] })
  tags: string[]; // Tags extraídos

  @Prop({ required: true })
  extractedAt: Date; // Timestamp de cuando se extrajo

  @Prop({ type: Types.ObjectId, ref: 'NoticiasExtractionConfig', required: true })
  extractionConfigId: Types.ObjectId; // Referencia a la configuración usada

  @Prop({ type: Object })
  extractionMetadata: {
    method: 'cheerio' | 'puppeteer'; // Método usado para extracción
    processingTime: number; // Tiempo de procesamiento (ms)
    contentLength: number; // Longitud del contenido extraído
    imagesCount: number; // Número de imágenes encontradas
    success: boolean; // Si la extracción fue exitosa
    errors?: string[]; // Errores durante extracción
  };

  @Prop({ enum: ['pending', 'extracted', 'failed', 'processing'], default: 'pending' })
  status: 'pending' | 'extracted' | 'failed' | 'processing';

  @Prop({ type: Object })
  rawData: Record<string, unknown>; // Datos raw del scraping para debugging

  @Prop({ type: Object })
  qualityMetrics?: {
    titleLength?: number;
    contentLength?: number;
    imageQuality?: 'high' | 'medium' | 'low';
    completeness?: number; // 0-100%
    confidence?: number; // 0-100%
  };

  // Referencia al post original de Facebook
  @Prop({ trim: true })
  facebookPostUrl?: string;

  @Prop({ trim: true })
  pageId?: string; // ID de la página de Facebook que compartió la URL

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ExtractedNoticiaSchema = SchemaFactory.createForClass(ExtractedNoticia);

// Índices para performance y queries comunes
ExtractedNoticiaSchema.index({ sourceUrl: 1 });
ExtractedNoticiaSchema.index({ domain: 1 });
ExtractedNoticiaSchema.index({ facebookPostId: 1 });
ExtractedNoticiaSchema.index({ extractedAt: -1 });
ExtractedNoticiaSchema.index({ status: 1 });
ExtractedNoticiaSchema.index({ publishedAt: -1 });
ExtractedNoticiaSchema.index({ extractionConfigId: 1 });

// Índice compuesto para queries frecuentes
ExtractedNoticiaSchema.index({ domain: 1, extractedAt: -1 });
ExtractedNoticiaSchema.index({ status: 1, extractedAt: -1 });