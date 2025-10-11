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

  @Prop({ trim: true })
  domain?: string; // Dominio extraído de sourceUrl

  @Prop({ trim: true })
  facebookPostId?: string; // ID del post de Facebook que contenía esta URL

  @Prop({ trim: true })
  title?: string; // Título extraído

  @Prop({ type: String })
  content?: string; // Contenido principal extraído

  @Prop({ type: [String], default: [] })
  images: string[]; // URLs de imágenes extraídas

  @Prop()
  publishedAt?: Date; // Fecha de publicación original

  @Prop({ trim: true })
  author?: string; // Autor extraído

  @Prop({ trim: true })
  category?: string; // Categoría principal de la noticia

  @Prop({ type: [String], default: [] })
  categories: string[]; // Categorías extraídas

  @Prop({ trim: true })
  excerpt?: string; // Resumen/extracto extraído

  @Prop({ type: [String], default: [] })
  tags: string[]; // Tags extraídos

  @Prop({ type: [String], default: [] })
  keywords: string[]; // Keywords/palabras clave extraídas

  @Prop({ required: true })
  extractedAt: Date; // Timestamp de cuando se extrajo

  @Prop({ type: Types.ObjectId, ref: 'NoticiasExtractionConfig' })
  extractionConfigId?: Types.ObjectId; // Referencia a la configuración usada

  @Prop({
    enum: ['pending', 'extracted', 'failed', 'processing'],
    default: 'pending',
  })
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

  // Campos adicionales para Generator-Pro
  @Prop({ default: false })
  isProcessed?: boolean; // Si ya fue procesado para generación

  @Prop()
  processedAt?: Date; // Cuándo fue procesado

  @Prop({ type: Types.ObjectId, ref: 'AIContentGeneration' })
  generatedContentId?: Types.ObjectId; // ID del contenido generado

  @Prop({ type: Types.ObjectId, ref: 'NewsWebsiteConfig' })
  websiteConfigId?: Types.ObjectId; // Referencia config Generator-Pro

  // Nuevas propiedades que faltaban
  @Prop({ type: Object })
  extractionMetadata?: {
    method?: 'cheerio' | 'puppeteer';
    processingTime?: number;
    contentLength?: number;
    imagesCount?: number;
    success?: boolean;
    errors?: string[];
    discoveredBy?: string;
    jobId?: string;
    imageCount?: number; // Alias para imagesCount
  };

  @Prop()
  discoveredAt?: Date; // Cuándo fue descubierta la URL

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

export const ExtractedNoticiaSchema =
  SchemaFactory.createForClass(ExtractedNoticia);

// Índices para performance y queries comunes
ExtractedNoticiaSchema.index({ sourceUrl: 1 });
ExtractedNoticiaSchema.index({ domain: 1 });
ExtractedNoticiaSchema.index({ facebookPostId: 1 });
ExtractedNoticiaSchema.index({ extractedAt: -1 });
ExtractedNoticiaSchema.index({ status: 1 });
ExtractedNoticiaSchema.index({ publishedAt: -1 });
ExtractedNoticiaSchema.index({ extractionConfigId: 1 });

// Nuevos índices para filtrado avanzado
ExtractedNoticiaSchema.index({ category: 1 });
ExtractedNoticiaSchema.index({ author: 1 });
ExtractedNoticiaSchema.index({ tags: 1 });
ExtractedNoticiaSchema.index({ keywords: 1 });

// Índice compuesto para queries frecuentes
ExtractedNoticiaSchema.index({ domain: 1, extractedAt: -1 });
ExtractedNoticiaSchema.index({ status: 1, extractedAt: -1 });
ExtractedNoticiaSchema.index({ category: 1, publishedAt: -1 });
ExtractedNoticiaSchema.index({ status: 1, category: 1, publishedAt: -1 });

// Text Index para búsqueda full-text (mejor performance que regex)
ExtractedNoticiaSchema.index({
  title: 'text',
  content: 'text',
  excerpt: 'text',
});
