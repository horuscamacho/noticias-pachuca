import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NoticiasExtractionConfigDocument = NoticiasExtractionConfig & Document;

/**
 * 🎯 Schema para configuración de extracción de noticias por dominio
 * Permite configurar CSS selectors específicos para cada sitio web
 */
@Schema({ timestamps: true })
export class NoticiasExtractionConfig {
  @Prop({ required: true, unique: true, trim: true })
  domain: string; // "ejemplo.com"

  @Prop({ required: true, trim: true })
  name: string; // "Ejemplo Noticias"

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Object, required: true })
  selectors: {
    title: string; // CSS selector para título (ej: "h1.post-title")
    content: string; // CSS selector para contenido (ej: ".post-content")
    images?: string[]; // Selectores para imágenes (ej: ["img.featured", ".gallery img"])
    publishedAt?: string; // Selector para fecha (ej: ".post-date")
    author?: string; // Selector para autor (ej: ".author-name")
    categories?: string[]; // Selectores para categorías (ej: [".category-tag"])
    excerpt?: string; // Selector para resumen (ej: ".post-excerpt")
    tags?: string[]; // Selectores para tags (ej: [".tag-link"])
  };

  @Prop({ type: Object, default: {} })
  extractionSettings: {
    useJavaScript?: boolean; // Si requiere renderizado JS (usar Puppeteer)
    waitTime?: number; // Tiempo de espera antes de scraping (ms)
    rateLimit?: number; // Límite de requests por minuto
    timeout?: number; // Timeout para requests (ms)
    retryAttempts?: number; // Número de reintentos en caso de error
    respectRobots?: boolean; // Respetar robots.txt
  };

  @Prop({ type: Object, default: {} })
  customHeaders: Record<string, string>; // Headers personalizados para requests

  @Prop({ type: Object })
  testResults?: {
    lastTested?: Date;
    isWorking?: boolean;
    errorMessage?: string;
    sampleExtraction?: {
      title?: string;
      content?: string;
      images?: string[];
      publishedAt?: string;
    };
  };

  @Prop({ type: Object, default: {} })
  statistics: {
    totalExtractions?: number;
    successfulExtractions?: number;
    failedExtractions?: number;
    lastExtractionAt?: Date;
    averageExtractionTime?: number; // ms
  };

  @Prop({ trim: true })
  notes?: string; // Notas sobre la configuración

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const NoticiasExtractionConfigSchema = SchemaFactory.createForClass(NoticiasExtractionConfig);

// Índices para performance
NoticiasExtractionConfigSchema.index({ domain: 1 });
NoticiasExtractionConfigSchema.index({ isActive: 1 });
NoticiasExtractionConfigSchema.index({ 'statistics.lastExtractionAt': -1 });