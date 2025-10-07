import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NewsWebsiteConfigDocument = NewsWebsiteConfig & Document;

/**
 * 🤖 Schema para configuración de sitios web de noticias - Generator Pro
 * Extiende NoticiasExtractionConfig para incluir funcionalidades específicas:
 * - Extracción de URLs desde listados
 * - Configuración de frecuencias automatizadas
 * - Integración con sistema de generación de contenido IA
 */
@Schema({ timestamps: true })
export class NewsWebsiteConfig {
  @Prop({ required: true, unique: true, trim: true })
  name: string; // "El Universal", "Milenio", "Reforma"

  @Prop({ required: true, trim: true })
  baseUrl: string; // "https://www.eluniversal.com.mx"

  @Prop({ required: true, trim: true })
  listingUrl: string; // URL donde están todas las noticias del sitio

  @Prop({ trim: true })
  testUrl?: string; // URL específica para probar selectores de contenido

  @Prop({ default: true })
  isActive: boolean;

  // 📋 CONFIGURACIÓN SELECTORES PARA LISTADO DE NOTICIAS
  @Prop({ type: Object, required: true })
  listingSelectors: {
    articleLinks: string; // CSS selector para obtener URLs de noticias (ej: "a.noticia-link")
    titleSelector?: string; // Selector para título desde listado (opcional)
    imageSelector?: string; // Selector para imagen desde listado (opcional)
    dateSelector?: string; // Selector para fecha desde listado (opcional)
    categorySelector?: string; // Selector para categoría desde listado (opcional)
  };

  // 📰 CONFIGURACIÓN SELECTORES PARA CONTENIDO DE NOTICIA
  @Prop({ type: Object, required: true })
  contentSelectors: {
    titleSelector: string; // CSS selector para título de la noticia
    contentSelector: string; // CSS selector para contenido principal
    imageSelector?: string; // CSS selector para imagen principal
    dateSelector?: string; // CSS selector para fecha de publicación
    authorSelector?: string; // CSS selector para autor
    categorySelector?: string; // CSS selector para categoría
    excerptSelector?: string; // CSS selector para resumen/bajada
    tagsSelector?: string; // CSS selector para tags
  };

  // ⏰ CONFIGURACIÓN DE FRECUENCIAS AUTOMATIZADAS
  @Prop({ default: 60 })
  extractionFrequency: number; // Frecuencia extracción URLs en minutos (60 = cada hora)

  @Prop({ default: 120 })
  contentGenerationFrequency: number; // Frecuencia generación contenido en minutos (120 = cada 2h)

  @Prop({ default: 30 })
  publishingFrequency: number; // Frecuencia publicación en minutos (30 = cada 30min)

  // 🔧 CONFIGURACIÓN TÉCNICA DE EXTRACCIÓN
  @Prop({ type: Object, default: {} })
  extractionSettings: {
    useJavaScript?: boolean; // Si requiere renderizado JS (usar Puppeteer)
    waitTime?: number; // Tiempo de espera antes de scraping (ms)
    rateLimit?: number; // Límite de requests por minuto
    timeout?: number; // Timeout para requests (ms)
    retryAttempts?: number; // Número de reintentos en caso de error
    respectRobots?: boolean; // Respetar robots.txt
    maxUrlsPerRun?: number; // Máximo URLs a extraer por ejecución
    duplicateFilter?: boolean; // Filtrar URLs duplicadas
  };

  @Prop({ type: Object, default: {} })
  customHeaders: Record<string, string>; // Headers personalizados para requests

  // 🤖 CONFIGURACIÓN INTEGRACIÓN CONTENT-AI
  @Prop({ type: Types.ObjectId, ref: 'PromptTemplate' })
  defaultTemplateId?: Types.ObjectId; // Template por defecto para generar contenido

  @Prop({ type: Object, default: {} })
  contentSettings: {
    generateOnExtraction?: boolean; // Auto-generar contenido al extraer
    requireApproval?: boolean; // Requiere aprobación manual antes de publicar
    maxContentPerDay?: number; // Máximo contenido generado por día
    categoryMapping?: Record<string, string>; // Mapeo de categorías del sitio
  };

  // 📊 CONTROL DE EJECUCIÓN Y ESTADO
  @Prop()
  lastExtractionRun?: Date; // Última ejecución de extracción de URLs

  @Prop()
  lastGenerationRun?: Date; // Última ejecución de generación de contenido

  @Prop()
  lastPublishingRun?: Date; // Última ejecución de publicación

  @Prop({ type: Object })
  testResults?: {
    lastTested?: Date;
    listingTest?: {
      isWorking?: boolean;
      urlsFound?: number;
      sampleUrls?: string[];
      errorMessage?: string;
    };
    contentTest?: {
      isWorking?: boolean;
      sampleTitle?: string;
      sampleContent?: string;
      sampleImage?: string;
      errorMessage?: string;
    };
  };

  // 📈 ESTADÍSTICAS Y MÉTRICAS
  @Prop({ type: Object, default: {} })
  statistics: {
    totalUrlsExtracted?: number;
    totalContentGenerated?: number;
    totalPublished?: number;
    successfulExtractions?: number;
    failedExtractions?: number;
    lastExtractionAt?: Date;
    averageExtractionTime?: number; // ms
    averageGenerationTime?: number; // ms
  };

  @Prop({ trim: true })
  notes?: string; // Notas sobre la configuración del sitio

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const NewsWebsiteConfigSchema = SchemaFactory.createForClass(NewsWebsiteConfig);

// 🔍 ÍNDICES PARA PERFORMANCE
NewsWebsiteConfigSchema.index({ name: 1 });
NewsWebsiteConfigSchema.index({ isActive: 1 });
NewsWebsiteConfigSchema.index({ baseUrl: 1 });
NewsWebsiteConfigSchema.index({ lastExtractionRun: -1 });
NewsWebsiteConfigSchema.index({ lastGenerationRun: -1 });
NewsWebsiteConfigSchema.index({ lastPublishingRun: -1 });

// 🔗 VIRTUAL PARA COMPATIBILIDAD CON SISTEMA EXISTENTE
NewsWebsiteConfigSchema.virtual('domain').get(function () {
  try {
    return new URL(this.baseUrl).hostname;
  } catch {
    return this.baseUrl;
  }
});

// 🧮 VIRTUAL PARA CÁLCULOS AUTOMATIZADOS
NewsWebsiteConfigSchema.virtual('nextExtractionDue').get(function () {
  if (!this.lastExtractionRun) return new Date();
  return new Date(this.lastExtractionRun.getTime() + (this.extractionFrequency * 60 * 1000));
});

NewsWebsiteConfigSchema.virtual('nextGenerationDue').get(function () {
  if (!this.lastGenerationRun) return new Date();
  return new Date(this.lastGenerationRun.getTime() + (this.contentGenerationFrequency * 60 * 1000));
});

NewsWebsiteConfigSchema.virtual('nextPublishingDue').get(function () {
  if (!this.lastPublishingRun) return new Date();
  return new Date(this.lastPublishingRun.getTime() + (this.publishingFrequency * 60 * 1000));
});