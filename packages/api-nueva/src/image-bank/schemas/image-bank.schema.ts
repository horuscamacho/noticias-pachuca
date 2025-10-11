import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ImageBankDocument = ImageBank & Document;

/**
 * 📸 URLs procesadas de la imagen en diferentes tamaños
 * Todas las imágenes están en S3 con metadata removida
 */
export class ProcessedImageUrls {
  @Prop({ required: true })
  original: string; // URL CDN de imagen original procesada (max 1920px)

  @Prop({ required: true })
  thumbnail: string; // 400x250px - Para grids y previews

  @Prop({ required: true })
  medium: string; // 800x500px - Para vistas de detalle mobile

  @Prop({ required: true })
  large: string; // 1200x630px - Para OG images y hero sections

  @Prop({ required: true })
  s3BaseKey: string; // Key base en S3: image-bank/{outlet}/{year}/{month}/{id}/
}

/**
 * 📊 Metadata de la imagen original antes de procesamiento
 * Preservado para referencia y debugging
 */
export class OriginalImageMetadata {
  @Prop({ required: true })
  url: string; // URL original de donde se extrajo la imagen

  @Prop({ required: true })
  width: number; // Ancho en píxeles

  @Prop({ required: true })
  height: number; // Alto en píxeles

  @Prop({ required: true })
  format: string; // Formato original (jpeg, png, webp, etc)

  @Prop({ required: true })
  sizeBytes: number; // Tamaño del archivo original en bytes
}

/**
 * 🏦 Schema principal del Image Bank
 * Almacena imágenes procesadas y listas para reutilización
 */
@Schema({ timestamps: true })
export class ImageBank {
  // ========================================
  // 📸 URLs Y METADATA PROCESADA
  // ========================================

  @Prop({ type: ProcessedImageUrls, required: true })
  processedUrls: ProcessedImageUrls; // URLs de todas las versiones procesadas

  @Prop({ type: OriginalImageMetadata, required: true })
  originalMetadata: OriginalImageMetadata; // Metadata de la imagen original

  // ========================================
  // 🏷️ TEXTO Y METADATA
  // ========================================

  @Prop({ trim: true })
  altText?: string; // Texto alternativo para accesibilidad

  @Prop({ trim: true })
  caption?: string; // Caption o descripción de la imagen

  @Prop({ type: [String], default: [], index: true })
  keywords: string[]; // Keywords para búsqueda (extraídas del contexto)

  @Prop({ required: true, trim: true, index: true })
  outlet: string; // Sitio de origen (dominio)

  @Prop({ type: [String], default: [], index: true })
  categories: string[]; // Categorías asociadas

  @Prop({ type: [String], default: [] })
  tags: string[]; // Tags adicionales

  // ========================================
  // 🔗 RELACIONES Y ORIGEN
  // ========================================

  @Prop({ type: Types.ObjectId, ref: 'ExtractedNoticia', index: true })
  extractedNoticiaId?: Types.ObjectId; // Referencia a la noticia de origen

  @Prop({ required: true, trim: true })
  sourceUrl: string; // URL del artículo/página donde se encontró

  @Prop({ required: true })
  extractedAt: Date; // Cuándo se extrajo la imagen original

  @Prop()
  processedAt?: Date; // Cuándo se procesó y almacenó en S3

  // ========================================
  // 📊 TRACKING DE USO
  // ========================================

  @Prop({ default: 0 })
  usageCount: number; // Veces que se ha usado la imagen

  @Prop({ type: [{ type: Types.ObjectId, ref: 'PublishedNoticia' }], default: [] })
  usedInArticles: Types.ObjectId[]; // Referencias a artículos donde se usó

  @Prop()
  lastUsedAt?: Date; // Última vez que se usó

  // ========================================
  // 🔍 CLASIFICACIÓN Y ESTADO
  // ========================================

  @Prop({
    enum: ['high', 'medium', 'low'],
    default: 'medium',
    index: true,
  })
  quality: 'high' | 'medium' | 'low'; // Calidad de la imagen

  @Prop({ default: true, index: true })
  isActive: boolean; // Si está disponible para uso

  @Prop({ default: false })
  isFeatured: boolean; // Si es destacada (para sugerencias)

  // ========================================
  // 🔒 COMPLIANCE Y PROCESAMIENTO
  // ========================================

  @Prop({ default: true })
  metadataRemoved: boolean; // Flag de compliance: metadata EXIF/IPTC/XMP removida

  @Prop({ trim: true })
  processedByVersion?: string; // Versión del procesador que la procesó (ej: "sharp-0.33.0")

  // ========================================
  // 🤖 AI GENERATION FLAGS
  // ========================================

  @Prop({ default: false, index: true })
  aiGenerated: boolean; // Flag si la imagen fue generada por IA

  @Prop({ default: false })
  c2paIncluded: boolean; // Flag si la imagen incluye metadata C2PA de autenticidad

  @Prop({ type: Types.ObjectId, ref: 'ImageGeneration' })
  imageGenerationId?: Types.ObjectId; // Referencia al documento de generación IA

  // ========================================
  // ⏱️ TIMESTAMPS (auto-generados por timestamps: true)
  // ========================================

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ImageBankSchema = SchemaFactory.createForClass(ImageBank);

// ============================================================================
// INDEXES FOR PERFORMANCE
// ============================================================================

// ========================================
// 🔍 SINGLE FIELD INDEXES
// ========================================

// Filtrar por outlet (sitio de origen)
ImageBankSchema.index({ outlet: 1 });

// Buscar imágenes de una noticia específica
ImageBankSchema.index({ extractedNoticiaId: 1 });

// Búsqueda por keywords (multikey index para array)
ImageBankSchema.index({ keywords: 1 });

// Filtrar por categorías (multikey index para array)
ImageBankSchema.index({ categories: 1 });

// Ordenar por fecha de creación (descending para mostrar más recientes primero)
ImageBankSchema.index({ createdAt: -1 });

// Ordenar por fecha de procesamiento
ImageBankSchema.index({ processedAt: -1 });

// Filtrar imágenes activas/inactivas
ImageBankSchema.index({ isActive: 1 });

// Filtrar por calidad de imagen
ImageBankSchema.index({ quality: 1 });

// ========================================
// 🚀 COMPOUND INDEXES (ESR Rule: Equality, Sort, Range)
// ========================================

// Query: Listar imágenes de un outlet ordenadas por fecha
// Uso: Filtrar por outlet + ordenar por más recientes
ImageBankSchema.index({ outlet: 1, createdAt: -1 });

// Query: Obtener imágenes activas de alta calidad
// Uso: Dashboard de imágenes destacadas y sugerencias
ImageBankSchema.index({ isActive: 1, quality: 1, createdAt: -1 });

// Query: Buscar por outlet + keyword específico
// Uso: Búsqueda refinada dentro de un sitio
ImageBankSchema.index({ outlet: 1, keywords: 1 });

// Query: Navegar por categoría ordenado por fecha
// Uso: Explorar imágenes de una categoría específica
ImageBankSchema.index({ categories: 1, createdAt: -1 });

// Query: Filtrar por imágenes generadas con IA con C2PA
// Uso: Dashboard de imágenes de IA, compliance checks
ImageBankSchema.index({ aiGenerated: 1, c2paIncluded: 1, createdAt: -1 });

// ========================================
// 📝 TEXT INDEX (Full-text search)
// ========================================

// Búsqueda de texto completo en altText, caption y keywords
// Uso: Barra de búsqueda global del image bank
ImageBankSchema.index({
  altText: 'text',
  caption: 'text',
  keywords: 'text',
});
