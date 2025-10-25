import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PublishedNoticiaDocument = PublishedNoticia & Document;

/**
 * 📰 Schema para noticias publicadas en el sitio público
 * Representa el contenido final que se muestra en public-noticias
 */
@Schema({
  timestamps: true,
  suppressReservedKeysWarning: true // Permite usar 'errors' como campo
})
export class PublishedNoticia {
  // ========================================
  // 🔗 RELACIONES CON OTROS DOCUMENTOS
  // ========================================

  @Prop({ type: Types.ObjectId, ref: 'AIContentGeneration', required: true, unique: true })
  contentId: Types.ObjectId; // Relación 1:1 con contenido generado

  @Prop({ type: Types.ObjectId, ref: 'ExtractedNoticia' })
  originalNoticiaId?: Types.ObjectId; // Referencia a la noticia original (opcional)

  // ========================================
  // 🌐 MULTI-SITIO (FASE 0)
  // ========================================

  @Prop({ type: [Types.ObjectId], ref: 'Site', default: [], index: true })
  sites: Types.ObjectId[]; // Array de sitios donde está publicada esta noticia

  // ========================================
  // 📝 CONTENIDO PRINCIPAL
  // ========================================

  @Prop({ required: true })
  slug: string; // URL-friendly slug: "migrantes-hidalgo-trabajo-oportunidades-abc123"
  // ⚠️ FASE 5: Uniqueness ahora se garantiza con índice compuesto { sites: 1, slug: 1 }

  @Prop({ required: true, trim: true })
  title: string; // Título generado por IA

  @Prop({ required: true })
  content: string; // Contenido HTML completo (sanitizado)

  @Prop({ required: true, trim: true, maxlength: 400 })
  summary: string; // Resumen corto (2-3 líneas, max 400 caracteres)

  @Prop({ trim: true })
  extendedSummary?: string; // Resumen ejecutivo detallado (4-6 párrafos)

  // ========================================
  // 📸 IMÁGENES (S3)
  // ========================================

  @Prop({ type: Object })
  featuredImage?: {
    original: string; // URL S3: https://cdn.example.com/noticias/2025/10/slug/original.webp
    thumbnail: string; // 400x250px
    medium: string; // 800x500px
    large: string; // 1200x630px (ideal para OG)
    alt: string; // Texto alternativo generado por IA
    width: number;
    height: number;
    s3Key: string; // Key en S3: noticias/2025/10/slug/original.webp
  };

  @Prop({ type: [Object], default: [] })
  additionalImages?: Array<{
    url: string;
    alt: string;
    width: number;
    height: number;
    s3Key: string;
  }>;

  // ========================================
  // 🏷️ TAXONOMÍA & CATEGORIZACIÓN
  // ========================================

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true, index: true })
  category: Types.ObjectId; // Referencia a Category

  @Prop({ type: [String], default: [], index: true })
  tags: string[]; // Tags generados por IA

  @Prop({ type: [String], default: [] })
  keywords: string[]; // Keywords SEO

  @Prop({ trim: true })
  author?: string; // Autor original (si existe)

  // ========================================
  // 🔍 SEO & META TAGS
  // ========================================

  @Prop({ type: Object, required: true })
  seo: {
    metaTitle: string; // 60 caracteres max
    metaDescription: string; // 150-160 caracteres
    focusKeyword: string; // Keyword principal
    canonicalUrl: string; // URL canónica: https://noticiaspachuca.com/noticia/slug

    // Open Graph
    ogTitle: string;
    ogDescription: string;
    ogImage?: string; // URL de imagen large (1200x630) - opcional si no hay imagen
    ogType: 'article';
    ogUrl: string;
    ogLocale: 'es_MX';

    // Twitter Cards
    twitterCard: 'summary_large_image';
    twitterTitle: string;
    twitterDescription: string;
    twitterImage?: string; // Opcional si no hay imagen

    // Structured Data (Schema.org NewsArticle)
    structuredData: Record<string, unknown>; // JSON-LD completo
  };

  // ========================================
  // 📅 FECHAS & PUBLICACIÓN
  // ========================================

  @Prop({ required: true, index: true })
  publishedAt: Date; // Fecha de publicación en web pública

  @Prop()
  originalPublishedAt?: Date; // Fecha de publicación original (del sitio fuente)

  @Prop({ default: Date.now })
  lastModifiedAt: Date; // Última modificación

  @Prop()
  scheduledPublishAt?: Date; // Para publicación programada (Fase 2)

  // ========================================
  // 📊 ESTADÍSTICAS & ANALYTICS
  // ========================================

  @Prop({ type: Object, default: {} })
  stats: {
    views?: number; // Vistas totales
    readTime?: number; // Tiempo promedio de lectura (segundos)
    shares?: number; // Shares en redes sociales (agregado)
    avgScrollDepth?: number; // % promedio de scroll
    bounceRate?: number; // Tasa de rebote
  };

  // ========================================
  // 🔄 ESTADO & WORKFLOW
  // ========================================

  @Prop({
    enum: ['draft', 'scheduled', 'published', 'unpublished', 'archived'],
    default: 'published',
    index: true
  })
  status: 'draft' | 'scheduled' | 'published' | 'unpublished' | 'archived';

  @Prop({ default: false })
  isFeatured: boolean; // Destacado en home

  @Prop({ default: false })
  isBreaking: boolean; // Noticia de último momento (DEPRECADO: usar contentType)

  @Prop({ default: false })
  isNoticia: boolean; // Es noticia (DEPRECADO: usar contentType)

  // 🆕 CAMPO PARA CONTENIDO URGENT (Breaking News de última hora)
  @Prop({ default: false, index: true })
  isUrgent: boolean; // Contenido de última hora (creado manualmente por usuario)

  // 🆕 COMMUNITY MANAGER: Tipo de contenido (FASE 0)
  @Prop({
    enum: ['breaking_news', 'normal_news', 'blog', 'evergreen'],
    default: 'normal_news',
    index: true,
  })
  contentType: 'breaking_news' | 'normal_news' | 'blog' | 'evergreen';

  @Prop({ default: 5 })
  priority: number; // 1-10, para ordenamiento

  // ========================================
  // 🌐 REDES SOCIALES (NO SE USA EN FASE 1)
  // ========================================

  @Prop({ type: Object })
  socialMediaCopies?: {
    facebook?: {
      hook: string;
      copy: string;
      emojis: string[];
      hookType: string;
    };
    twitter?: {
      tweet: string;
      hook: string;
      emojis: string[];
      threadIdeas: string[];
    };
    instagram?: string;
    linkedin?: string;
  };

  // ========================================
  // 📱 TRACKING DE PUBLICACIÓN EN REDES SOCIALES (FASE 0 - Mejorado)
  // ========================================

  @Prop({ type: Object, default: {} })
  socialMediaPublishing?: {
    facebook?: Array<{
      pageId: string; // ID de la página de Facebook
      pageName?: string; // Nombre de la página (opcional)
      postId?: string; // ID del post en Facebook
      postUrl?: string; // URL del post
      publishedAt?: Date; // Fecha de publicación
      status: 'pending' | 'published' | 'failed'; // Estado de publicación
      errorMessage?: string; // Mensaje de error si falló
      engagement?: {
        likes?: number;
        comments?: number;
        shares?: number;
      };
    }>;

    twitter?: Array<{
      accountId: string; // ID de la cuenta de Twitter
      username?: string; // @username (opcional)
      tweetId?: string; // ID del tweet
      tweetUrl?: string; // URL del tweet
      publishedAt?: Date; // Fecha de publicación
      status: 'pending' | 'published' | 'failed'; // Estado de publicación
      errorMessage?: string; // Mensaje de error si falló
      engagement?: {
        likes?: number;
        retweets?: number;
        replies?: number;
      };
    }>;
  };

  // ========================================
  // 🛠️ METADATA DE PUBLICACIÓN
  // ========================================

  @Prop({ type: Object })
  publishingMetadata: {
    publishedBy: Types.ObjectId | null; // ID del usuario que publicó (Fase 2 con auth)
    publishedFrom: 'dashboard' | 'api' | 'scheduled'; // Origen de publicación
    imageSource: 'original' | 'uploaded' | 'generated'; // De dónde vino la imagen
    processingTime?: number; // Tiempo de procesamiento (ms)
    version: number; // Versión del contenido (para versionamiento)
  };

  @Prop({ type: [String], default: [] })
  errors: string[]; // Errores durante publicación (si los hubo)

  @Prop({ type: [String], default: [] })
  warnings: string[]; // Advertencias

  // ========================================
  // ⏱️ METADATA DE SCHEDULING (COLA)
  // ========================================

  @Prop({ type: Object })
  schedulingMetadata?: {
    queuedAt?: Date; // Cuándo se agregó a la cola
    originalScheduledAt?: Date; // Hora programada original (calculada)
    adjustedScheduledAt?: Date; // Hora programada ajustada (por time window)
    delayAppliedMs?: number; // Delay aplicado en milisegundos
    calculationMethod?: string; // Método usado: 'dynamic' | 'fixed' | 'manual'
    queuePosition?: number; // Posición en cola al momento de scheduling
    totalQueuedAtTime?: number; // Total de items en cola al momento
    randomizationApplied?: number; // Factor de randomización aplicado (0.85-1.15)
    timeWindow?: 'peak' | 'valley' | 'normal'; // Ventana de tiempo
    priorityMultiplier?: number; // Multiplicador de prioridad aplicado (0.7 o 1.0)
  };

  // ========================================
  // 🔧 CONFIGURACIÓN AVANZADA
  // ========================================

  @Prop({ type: Object })
  advanced?: {
    allowComments?: boolean; // Permitir comentarios (Fase 2)
    allowSharing?: boolean; // Mostrar botones de compartir
    showAuthor?: boolean; // Mostrar autor
    showPublishDate?: boolean; // Mostrar fecha
    customCSS?: string; // CSS personalizado (cuidado)
    customJS?: string; // JS personalizado (extremo cuidado)
  };

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const PublishedNoticiaSchema = SchemaFactory.createForClass(PublishedNoticia);

// ========================================
// 📇 ÍNDICES PARA PERFORMANCE
// ========================================

// 🌐 FASE 5: Índice único compuesto (mismo slug puede existir en diferentes sitios)
PublishedNoticiaSchema.index({ sites: 1, slug: 1 }, { unique: true });

// Índices para multi-sitio (FASE 0)
PublishedNoticiaSchema.index({ sites: 1 });
PublishedNoticiaSchema.index({ sites: 1, status: 1, publishedAt: -1 });
PublishedNoticiaSchema.index({ sites: 1, category: 1, publishedAt: -1 });

// Índices para queries comunes
PublishedNoticiaSchema.index({ status: 1, publishedAt: -1 });
PublishedNoticiaSchema.index({ category: 1, publishedAt: -1 });
PublishedNoticiaSchema.index({ status: 1, category: 1, publishedAt: -1 });
PublishedNoticiaSchema.index({ isFeatured: 1, publishedAt: -1 });
PublishedNoticiaSchema.index({ isBreaking: 1, publishedAt: -1 });

// 🆕 ÍNDICE PARA CONTENIDO URGENT (Breaking News de última hora)
PublishedNoticiaSchema.index({ isUrgent: 1, publishedAt: -1 });

// 🆕 COMMUNITY MANAGER: Índice para contentType (FASE 0)
PublishedNoticiaSchema.index({ contentType: 1, publishedAt: -1 });
PublishedNoticiaSchema.index({ contentType: 1, status: 1 });

// Índices para búsqueda de texto (Fase 2)
PublishedNoticiaSchema.index({ title: 'text', summary: 'text', content: 'text' });

// ========================================
// 🪝 MIDDLEWARES & HOOKS
// ========================================

// Pre-save: Actualizar lastModifiedAt
PublishedNoticiaSchema.pre('save', function(next) {
  this.lastModifiedAt = new Date();
  next();
});

// Pre-save: Validar que slug sea URL-friendly
PublishedNoticiaSchema.pre('save', function(next) {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugRegex.test(this.slug)) {
    next(new Error('Slug debe ser URL-friendly (lowercase, guiones, sin espacios)'));
    return;
  }
  next();
});
