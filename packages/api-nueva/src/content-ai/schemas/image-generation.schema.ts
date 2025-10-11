import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ImageGenerationDocument = ImageGeneration & Document;

/**
 * 🖼️ Schema para generación de imágenes con IA
 * Almacena el resultado de la generación con branding y metadata completo
 */
@Schema({ timestamps: true })
export class ImageGeneration {
  // Source
  @Prop({ type: Types.ObjectId, ref: 'ImageBank' })
  sourceImageId?: Types.ObjectId; // Si es modificación de imagen existente

  @Prop({ trim: true })
  sourceImageUrl?: string; // URL original para referencia

  @Prop({ type: Types.ObjectId, ref: 'ExtractedNoticia' })
  extractedNoticiaId?: Types.ObjectId; // Noticia relacionada

  // Generation Config
  @Prop({ required: true, trim: true })
  prompt: string; // FASE 5: basePrompt editorial (limpio, sin branding)

  @Prop({ required: true, default: 'gpt-image-1' })
  model: string; // Modelo usado: 'gpt-image-1', 'dall-e-3'

  @Prop({ enum: ['low', 'medium', 'high'], default: 'medium' })
  quality: 'low' | 'medium' | 'high'; // Quality tier

  @Prop({ default: '1024x1024' })
  size: string; // "1024x1024", "1024x1536", "1536x1024"

  // FASE 5: Editorial Analysis Metadata
  @Prop({ type: Object })
  contentAnalysisResult?: Record<string, unknown>; // Resultado del análisis de contenido

  @Prop({ trim: true })
  editorialTemplate?: string; // Template usado: 'portrait', 'scene', 'conceptual', 'documentary'

  // Branding Config
  @Prop({ type: Object, required: true })
  brandingConfig: {
    watermarkText: string; // "NOTICIAS PACHUCA"
    watermarkPosition: string; // "bottom-right"
    includeDecorations: boolean; // Cintillos con keywords
    keywords?: string[]; // Keywords para decoraciones
  };

  // Results
  @Prop({ trim: true })
  generatedImageUrl?: string; // CDN URL de la imagen generada

  @Prop({ type: Types.ObjectId, ref: 'ImageBank' })
  imageBankId?: Types.ObjectId; // Si se almacenó en image bank

  // FASE 5: Clean Metadata (without technical instructions)
  @Prop({ trim: true })
  altText?: string; // Alt text accesible (WAI-ARIA <125 chars)

  @Prop({ trim: true })
  caption?: string; // Caption editorial profesional

  @Prop({ type: [String], default: [] })
  keywords: string[]; // Keywords relevantes (sin términos técnicos)

  // Metadata
  @Prop({ default: 0 })
  cost: number; // Costo en USD

  @Prop()
  generationTime?: number; // Tiempo de generación en milisegundos

  @Prop()
  processingTime?: number; // Tiempo de post-processing en milisegundos

  // Compliance
  @Prop({ required: true, default: true })
  aiGenerated: boolean; // Siempre true para imágenes generadas

  @Prop({ default: false })
  c2paIncluded: boolean; // Si incluye metadata C2PA

  @Prop({ default: false })
  editorialReviewed: boolean; // Si fue revisada por humano

  // Tracking
  @Prop({ type: [Types.ObjectId], ref: 'AIContentGeneration', default: [] })
  usedInArticles: Types.ObjectId[]; // Artículos que usan esta imagen

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId; // Usuario que solicitó la generación

  // Timestamps automáticos
  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ImageGenerationSchema = SchemaFactory.createForClass(ImageGeneration);

// Índices para performance y queries comunes
ImageGenerationSchema.index({ model: 1, createdAt: -1 }); // Query by model
ImageGenerationSchema.index({ quality: 1, createdAt: -1 }); // Query by quality
ImageGenerationSchema.index({ createdBy: 1, createdAt: -1 }); // User's generations
ImageGenerationSchema.index({ extractedNoticiaId: 1 }); // Find by noticia
ImageGenerationSchema.index({ aiGenerated: 1, editorialReviewed: 1 }); // Compliance queries

// Índices compuestos para filtrado frecuente
ImageGenerationSchema.index({ createdBy: 1, model: 1, createdAt: -1 }); // User + model
ImageGenerationSchema.index({ createdBy: 1, quality: 1, createdAt: -1 }); // User + quality
ImageGenerationSchema.index({ editorialReviewed: 1, createdAt: -1 }); // Review queue
