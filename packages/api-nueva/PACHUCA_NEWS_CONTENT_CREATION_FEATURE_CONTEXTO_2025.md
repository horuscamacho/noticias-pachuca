# 🚀 PACHUCA NEWS CONTENT CREATION FEATURE - CONTEXTO 2025

> **Sistema completo de publicación de contenido generado a la web pública de Noticias Pachuca con SEO optimizado**

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Análisis de Situación Actual](#análisis-de-situación-actual)
3. [Arquitectura Propuesta](#arquitectura-propuesta)
4. [Esquema de Datos: PublishedNoticia](#esquema-de-datos-publishednoticia)
5. [Flow de Publicación](#flow-de-publicación)
6. [SEO & Meta Tags Implementation](#seo--meta-tags-implementation)
7. [Analytics Implementation](#analytics-implementation)
8. [Roadmap de Implementación](#roadmap-de-implementación)
9. [Checklist de Verificación](#checklist-de-verificación)

---

## 📊 RESUMEN EJECUTIVO

### Objetivo
Crear un sistema completo que permita publicar contenido generado desde el **dash-coyote** (generator-pro) hacia el sitio público **public-noticias** (TanStack Start SSR), con optimización SEO, manejo de imágenes en S3, sistema de slugs únicos, y renderizado dinámico SSR.

### Alcance del Feature
- ✅ **Backend**: Nuevo módulo `pachuca-noticias` en `api-nueva`
- ✅ **Frontend Dashboard**: Nueva sección "Pachuca Noticias" en `dash-coyote`
- ✅ **Frontend Público**: Renderizado dinámico SSR en `public-noticias`
- ✅ **Infraestructura**: Manejo de imágenes S3, slugs únicos, SEO completo
- ❌ **Fuera de alcance (Fase 2)**: Publicación en redes sociales, acortador de URLs

### Stack Tecnológico
```typescript
// Backend (NestJS)
- Mongoose schemas + TypeScript
- AWS S3 SDK (ya implementado)
- EventEmitter2 para eventos
- Sharp para procesamiento de imágenes

// Frontend Dashboard (dash-coyote)
- TanStack Router
- React Query
- Socket.io client

// Frontend Público (public-noticias)
- TanStack Start (SSR)
- Server Functions
- Structured Data (Schema.org NewsArticle)
```

---

## 🔍 ANÁLISIS DE SITUACIÓN ACTUAL

### Lo que ya tenemos

#### 1. **Generator-Pro (Backend)**
**Ubicación**: `packages/api-nueva/src/generator-pro/`

**Esquemas clave**:
- ✅ `ExtractedNoticia`: Contenido scrapeado de sitios web
  - Contiene: `sourceUrl`, `title`, `content`, `images[]`, `publishedAt`, `author`, etc.
  - Estado: `pending | extracted | failed | processing`

- ✅ `AIContentGeneration`: Contenido generado por IA a partir de noticias
  - Contiene: Todo el contenido generado (título, contenido, keywords, tags, category, summary)
  - Social media copies (Facebook, Twitter, Instagram, LinkedIn)
  - SEO data parcial (metaDescription, focusKeyword, etc.)
  - Estado: `pending | generating | completed | failed | reviewing | approved | rejected`

**Servicios relevantes**:
- ✅ Sistema de scraping funcional
- ✅ Generación de contenido con IA (OpenAI)
- ✅ Metadata extraction completa
- ✅ Sistema de cola (BullMQ)

#### 2. **Servicio S3 (Backend)**
**Ubicación**: `packages/api-nueva/src/files/`

**Capacidades**:
- ✅ `AwsS3CoreService`: Upload, download, delete, presigned URLs
- ✅ Managed uploads (multipart automático)
- ✅ Metadata management
- ✅ Health checks

**Pendiente**:
- ⚠️ Servicio específico para descargar imágenes externas y subirlas a S3
- ⚠️ Optimización de imágenes (redimensionamiento para diferentes tamaños)

#### 3. **Dash-Coyote (Frontend)**
**Ubicación**: `packages/dash-coyote/`

**Features existentes**:
- ✅ Generator-Pro dashboard (listado de contenidos generados)
- ✅ Socket.io para updates en tiempo real
- ✅ React Query para data fetching
- ✅ Sidebar navigation

**Pendiente**:
- ⚠️ Nueva sección "Pachuca Noticias" en sidebar
- ⚠️ UI para gestionar contenidos publicables
- ⚠️ Botón/acción de "Publicar a web"

#### 4. **Public-Noticias (Frontend SSR)**
**Ubicación**: `packages/public-noticias/`

**Stack**:
- ✅ TanStack Start (SSR framework)
- ✅ TanStack Router (file-based routing)
- ✅ Tailwind CSS v4
- ✅ React 19

**Estado actual**:
- ✅ Página index con diseño brutalist
- ✅ Rutas básicas: `/`, `/articulo/$id`, `/crear-columna`, `/login`, etc.
- ✅ Contenido mock (hardcodeado)

**Pendiente**:
- ⚠️ Server Functions para cargar noticias publicadas desde la API
- ⚠️ Ruta dinámica `/noticia/$slug` con SSR completo
- ⚠️ Meta tags dinámicos (SEO + Open Graph)
- ⚠️ Schema.org NewsArticle structured data
- ⚠️ Analytics privacy-first

### Lo que nos falta

#### Backend
1. **Nuevo módulo `pachuca-noticias`**
   - Esquema `PublishedNoticia` con relación a `AIContentGeneration`
   - Sistema de slugs únicos
   - Servicio de publicación con:
     - Validación (evitar duplicados)
     - Descarga y upload de imágenes a S3
     - Generación de URLs S3 públicas
     - Generación de slug SEO-friendly
   - Controladores REST para CRUD de noticias publicadas
   - Eventos con EventEmitter2 para notificaciones

2. **Servicio de Image Processing**
   - Descarga de imágenes externas
   - Validación de imágenes (formato, tamaño, dimensiones)
   - Optimización con Sharp (webp, diferentes tamaños)
   - Upload a S3 con metadata
   - Generación de URLs CDN

#### Frontend Dashboard (dash-coyote)
1. **Nueva ruta `/pachuca-noticias`**
   - Tabla de contenidos generados (filtrados por estado)
   - Columnas: Título, Categoría, Fecha generación, Estado publicación
   - Acciones: Ver detalle, Publicar, Despublicar
   - Filtros: Por categoría, estado, fecha

2. **Modal/Drawer de Publicación**
   - Preview del contenido generado
   - Selector de imagen (original o subir nueva)
   - Confirmación de publicación
   - Indicador de progreso (descarga imagen → upload S3 → crear registro)

3. **Sidebar item**
   - Nuevo link "Pachuca Noticias"
   - Badge con count de contenidos pendientes de publicar

#### Frontend Público (public-noticias)
1. **Server Functions**
   - `getPublishedNoticias`: Listado paginado de noticias
   - `getNoticiaBySlug`: Obtener noticia por slug (para SSR)
   - `getNoticiasByCategory`: Filtrar por categoría
   - `getRelatedNoticias`: Noticias relacionadas por categoría

2. **Rutas dinámicas**
   - `/` - Home con noticias destacadas
   - `/noticias` - Listado completo con paginación
   - `/noticia/[slug]` - Detalle de noticia (SSR completo)
   - `/categoria/[slug]` - Noticias por categoría

3. **SEO Implementation**
   - Meta tags dinámicos (título, description)
   - Open Graph tags completos
   - Twitter Card tags
   - Schema.org NewsArticle JSON-LD
   - Canonical URLs
   - Sitemap XML (generado dinámicamente)

4. **Analytics**
   - Plausible Analytics integration
   - Privacy-first tracking (sin cookies)
   - Page views, tiempo de lectura, scroll depth
   - Sin PII (Personal Identifiable Information)

---

## 🏗️ ARQUITECTURA PROPUESTA

### Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│                    SCRAPING & GENERATION                         │
│  (Ya implementado en generator-pro)                              │
│                                                                   │
│  ExtractedNoticia → AIContentGeneration (status: completed)      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DASH-COYOTE FRONTEND                          │
│  Usuario selecciona contenido generado y hace clic en "Publicar" │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓ HTTP POST /api/pachuca-noticias/publish
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND: PublishService                       │
│                                                                   │
│  1. Validar que no exista noticia publicada con ese contentId    │
│  2. Obtener AIContentGeneration completo                         │
│  3. Descargar imagen original (si useOriginalImage = true)       │
│  4. Optimizar imagen (Sharp): WebP, varios tamaños               │
│  5. Upload a S3 con naming: /noticias/YYYY/MM/slug/image-*.webp  │
│  6. Generar slug único: "titulo-noticia-uuid"                    │
│  7. Crear registro PublishedNoticia                              │
│  8. Emitir evento: "noticia.published"                           │
│  9. Actualizar AIContentGeneration.publishingInfo                │
│  10. Retornar PublishedNoticia con URLs completas                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓ Socket.io event
┌─────────────────────────────────────────────────────────────────┐
│            DASH-COYOTE: Actualizar UI (optimistic update)        │
│  Mostrar noticia como "Publicada" con link a web pública         │
└─────────────────────────────────────────────────────────────────┘

                             ↓ User navega a public-noticias
┌─────────────────────────────────────────────────────────────────┐
│                PUBLIC-NOTICIAS: SSR Rendering                    │
│                                                                   │
│  1. TanStack Start recibe request: /noticia/titulo-noticia-uuid  │
│  2. Server Function: getNoticiaBySlug(slug)                      │
│  3. Backend retorna PublishedNoticia con todo el contenido       │
│  4. Renderizar HTML en servidor con:                             │
│     - Meta tags (SEO + Open Graph + Twitter Cards)               │
│     - Schema.org NewsArticle JSON-LD                             │
│     - Contenido completo                                         │
│  5. Enviar HTML al cliente                                       │
│  6. Hydration en cliente                                         │
│  7. Track page view (Plausible Analytics)                        │
└─────────────────────────────────────────────────────────────────┘
```

### Estructura de Directorios

```
packages/
├── api-nueva/
│   └── src/
│       ├── pachuca-noticias/          # 🆕 NUEVO MÓDULO
│       │   ├── controllers/
│       │   │   └── pachuca-noticias.controller.ts
│       │   ├── services/
│       │   │   ├── publish.service.ts              # Lógica de publicación
│       │   │   ├── image-processor.service.ts      # Descarga y optimización
│       │   │   └── slug-generator.service.ts       # Slugs únicos
│       │   ├── schemas/
│       │   │   └── published-noticia.schema.ts     # 🔥 Esquema principal
│       │   ├── dto/
│       │   │   ├── publish-noticia.dto.ts
│       │   │   ├── update-noticia.dto.ts
│       │   │   └── query-noticias.dto.ts
│       │   ├── events/
│       │   │   └── noticia-events.ts               # EventEmitter2 events
│       │   └── pachuca-noticias.module.ts
│       │
│       ├── files/                     # Ya existe
│       │   └── services/
│       │       └── aws-s3-core.service.ts          # Reutilizar
│       │
│       └── content-ai/                # Ya existe
│           └── schemas/
│               └── ai-content-generation.schema.ts # Fuente de datos
│
├── dash-coyote/
│   └── src/
│       ├── routes/
│       │   └── _authenticated/
│       │       └── pachuca-noticias.tsx     # 🆕 NUEVA RUTA
│       ├── features/
│       │   └── pachuca-noticias/            # 🆕 NUEVO FEATURE
│       │       ├── components/
│       │       │   ├── NoticiasTable.tsx
│       │       │   ├── PublishModal.tsx
│       │       │   └── NoticiaCard.tsx
│       │       ├── hooks/
│       │       │   ├── usePublishedNoticias.ts
│       │       │   └── usePublishNoticia.ts
│       │       └── types/
│       │           └── published-noticia.types.ts
│       │
│       └── components/
│           └── AppSidebar.tsx               # Modificar: agregar item
│
└── public-noticias/
    └── src/
        ├── routes/
        │   ├── noticia.$slug.tsx            # 🆕 MODIFICAR para SSR
        │   └── noticias.tsx                 # 🆕 MODIFICAR para paginación
        │
        ├── features/
        │   └── noticias/                    # 🆕 NUEVO FEATURE
        │       ├── server/
        │       │   ├── getNoticiaBySlug.ts      # Server function
        │       │   ├── getNoticias.ts           # Server function
        │       │   └── getRelatedNoticias.ts    # Server function
        │       ├── components/
        │       │   ├── NoticiaContent.tsx
        │       │   ├── NoticiaHeader.tsx
        │       │   └── RelatedNoticias.tsx
        │       └── types/
        │           └── noticia.types.ts
        │
        └── lib/
            ├── seo/
            │   ├── generateMetaTags.ts      # 🆕 Helper para meta tags
            │   └── generateStructuredData.ts # 🆕 NewsArticle JSON-LD
            └── analytics/
                └── plausible.ts             # 🆕 Plausible config
```

---

## 📄 ESQUEMA DE DATOS: PublishedNoticia

```typescript
// packages/api-nueva/src/pachuca-noticias/schemas/published-noticia.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PublishedNoticiaDocument = PublishedNoticia & Document;

/**
 * 📰 Schema para noticias publicadas en el sitio público
 * Representa el contenido final que se muestra en public-noticias
 */
@Schema({ timestamps: true })
export class PublishedNoticia {
  // ========================================
  // 🔗 RELACIONES CON OTROS DOCUMENTOS
  // ========================================

  @Prop({ type: Types.ObjectId, ref: 'AIContentGeneration', required: true, unique: true })
  contentId: Types.ObjectId; // Relación 1:1 con contenido generado

  @Prop({ type: Types.ObjectId, ref: 'ExtractedNoticia' })
  originalNoticiaId?: Types.ObjectId; // Referencia a la noticia original (opcional)

  // ========================================
  // 📝 CONTENIDO PRINCIPAL
  // ========================================

  @Prop({ required: true, unique: true, index: true })
  slug: string; // URL-friendly slug: "migrantes-hidalgo-trabajo-oportunidades-abc123"

  @Prop({ required: true, trim: true })
  title: string; // Título generado por IA

  @Prop({ required: true })
  content: string; // Contenido HTML completo (sanitizado)

  @Prop({ required: true, trim: true, maxlength: 300 })
  summary: string; // Resumen corto (2-3 líneas)

  @Prop({ trim: true })
  extendedSummary?: string; // Resumen ejecutivo detallado (4-6 párrafos)

  // ========================================
  // 📸 IMÁGENES (S3)
  // ========================================

  @Prop({ type: Object, required: true })
  featuredImage: {
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

  @Prop({ required: true, trim: true, lowercase: true, index: true })
  category: string; // política | deportes | cultura | economía | salud | tecnología

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
    canonicalUrl: string; // URL canónica: https://noticias-pachuca.com/noticia/slug

    // Open Graph
    ogTitle: string;
    ogDescription: string;
    ogImage: string; // URL de imagen large (1200x630)
    ogType: 'article';
    ogUrl: string;
    ogLocale: 'es_MX';

    // Twitter Cards
    twitterCard: 'summary_large_image';
    twitterTitle: string;
    twitterDescription: string;
    twitterImage: string;

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
  isBreaking: boolean; // Noticia de último momento

  @Prop({ default: 1 })
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

  @Prop({ type: Object })
  socialMediaPublishing?: {
    facebook?: {
      published: boolean;
      postId?: string;
      url?: string;
      publishedAt?: Date;
    };
    twitter?: {
      published: boolean;
      tweetId?: string;
      url?: string;
      publishedAt?: Date;
    };
  };

  // ========================================
  // 🛠️ METADATA DE PUBLICACIÓN
  // ========================================

  @Prop({ type: Object })
  publishingMetadata: {
    publishedBy: Types.ObjectId; // ID del usuario que publicó (Fase 2 con auth)
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

// Índices únicos
PublishedNoticiaSchema.index({ slug: 1 }, { unique: true });
PublishedNoticiaSchema.index({ contentId: 1 }, { unique: true });

// Índices para queries comunes
PublishedNoticiaSchema.index({ status: 1, publishedAt: -1 });
PublishedNoticiaSchema.index({ category: 1, publishedAt: -1 });
PublishedNoticiaSchema.index({ status: 1, category: 1, publishedAt: -1 });
PublishedNoticiaSchema.index({ isFeatured: 1, publishedAt: -1 });
PublishedNoticiaSchema.index({ isBreaking: 1, publishedAt: -1 });

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
  }
  next();
});
```

---

## 🔄 FLOW DE PUBLICACIÓN

### Paso a Paso Detallado

#### 1. **Usuario selecciona contenido en Dashboard**

**Ubicación**: `dash-coyote` → `/pachuca-noticias`

```typescript
// packages/dash-coyote/src/features/pachuca-noticias/hooks/usePublishNoticia.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/features/shared/services/apiClient';
import type { PublishNoticiaDto, PublishedNoticia } from '../types';

export const usePublishNoticia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PublishNoticiaDto) => {
      const response = await apiClient.post<PublishedNoticia>(
        '/pachuca-noticias/publish',
        data
      );
      return response.data;
    },

    onSuccess: (publishedNoticia) => {
      // Invalidar queries para refrescar lista
      queryClient.invalidateQueries({ queryKey: ['published-noticias'] });
      queryClient.invalidateQueries({ queryKey: ['content-ai-generations'] });

      // Optimistic update
      queryClient.setQueryData<PublishedNoticia[]>(
        ['published-noticias'],
        (old = []) => [publishedNoticia, ...old]
      );
    },
  });
};

// DTO de publicación
interface PublishNoticiaDto {
  contentId: string; // ID del AIContentGeneration
  useOriginalImage: boolean; // true = usar imagen original, false = permitir upload
  customImageUrl?: string; // URL de imagen personalizada (si useOriginalImage = false)
  scheduledPublishAt?: Date; // Para publicación programada (Fase 2)
  isFeatured?: boolean;
  isBreaking?: boolean;
}
```

#### 2. **Backend procesa la publicación**

**Ubicación**: `api-nueva` → `pachuca-noticias/services/publish.service.ts`

```typescript
// packages/api-nueva/src/pachuca-noticias/services/publish.service.ts

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PublishedNoticia, PublishedNoticiaDocument } from '../schemas/published-noticia.schema';
import { AIContentGeneration, AIContentGenerationDocument } from '../../content-ai/schemas/ai-content-generation.schema';
import { ImageProcessorService } from './image-processor.service';
import { SlugGeneratorService } from './slug-generator.service';
import { PublishNoticiaDto } from '../dto/publish-noticia.dto';

@Injectable()
export class PublishService {
  private readonly logger = new Logger(PublishService.name);

  constructor(
    @InjectModel(PublishedNoticia.name) private publishedNoticiaModel: Model<PublishedNoticiaDocument>,
    @InjectModel(AIContentGeneration.name) private aiContentModel: Model<AIContentGenerationDocument>,
    private readonly imageProcessor: ImageProcessorService,
    private readonly slugGenerator: SlugGeneratorService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async publishNoticia(dto: PublishNoticiaDto): Promise<PublishedNoticiaDocument> {
    const startTime = Date.now();

    try {
      // 1️⃣ Validar que no exista noticia publicada con ese contentId
      const existingPublished = await this.publishedNoticiaModel.findOne({
        contentId: dto.contentId
      });

      if (existingPublished) {
        throw new BadRequestException(
          `Esta noticia ya está publicada con slug: ${existingPublished.slug}`
        );
      }

      // 2️⃣ Obtener contenido generado completo
      const generatedContent = await this.aiContentModel
        .findById(dto.contentId)
        .populate('originalContentId');

      if (!generatedContent) {
        throw new BadRequestException('Contenido generado no encontrado');
      }

      if (generatedContent.status !== 'completed') {
        throw new BadRequestException(
          'El contenido debe estar completado antes de publicar'
        );
      }

      // 3️⃣ Generar slug único
      const slug = await this.slugGenerator.generateUniqueSlug(
        generatedContent.generatedTitle
      );

      // 4️⃣ Procesar imágenes
      let featuredImage;

      if (dto.useOriginalImage) {
        // Usar imagen del contenido original
        const originalContent = generatedContent.originalContentId as any;
        const imageUrl = originalContent?.images?.[0];

        if (!imageUrl) {
          throw new BadRequestException('No hay imagen original disponible');
        }

        // Descargar, optimizar y subir a S3
        featuredImage = await this.imageProcessor.processAndUploadImage(
          imageUrl,
          slug,
          generatedContent.seoData?.altText || generatedContent.generatedTitle
        );
      } else if (dto.customImageUrl) {
        // Usar imagen personalizada
        featuredImage = await this.imageProcessor.processAndUploadImage(
          dto.customImageUrl,
          slug,
          generatedContent.seoData?.altText || generatedContent.generatedTitle
        );
      } else {
        throw new BadRequestException('Debe especificar una imagen');
      }

      // 5️⃣ Generar canonical URL
      const canonicalUrl = `https://noticias-pachuca.com/noticia/${slug}`;

      // 6️⃣ Generar structured data (Schema.org NewsArticle)
      const structuredData = this.generateStructuredData(
        generatedContent,
        slug,
        canonicalUrl,
        featuredImage.large
      );

      // 7️⃣ Crear registro PublishedNoticia
      const publishedNoticia = new this.publishedNoticiaModel({
        contentId: generatedContent._id,
        originalNoticiaId: generatedContent.originalContentId,
        slug,
        title: generatedContent.generatedTitle,
        content: generatedContent.generatedContent,
        summary: generatedContent.generatedSummary || '',
        extendedSummary: generatedContent.extendedSummary,
        featuredImage,
        category: generatedContent.generatedCategory?.toLowerCase() || 'general',
        tags: generatedContent.generatedTags || [],
        keywords: generatedContent.generatedKeywords || [],
        author: (generatedContent.originalContentId as any)?.author,

        seo: {
          metaTitle: generatedContent.generatedTitle.substring(0, 60),
          metaDescription: generatedContent.seoData?.metaDescription ||
                          generatedContent.generatedSummary?.substring(0, 160) || '',
          focusKeyword: generatedContent.seoData?.focusKeyword || '',
          canonicalUrl,

          ogTitle: generatedContent.seoData?.ogTitle || generatedContent.generatedTitle,
          ogDescription: generatedContent.seoData?.ogDescription ||
                        generatedContent.generatedSummary || '',
          ogImage: featuredImage.large,
          ogType: 'article' as const,
          ogUrl: canonicalUrl,
          ogLocale: 'es_MX' as const,

          twitterCard: 'summary_large_image' as const,
          twitterTitle: generatedContent.generatedTitle.substring(0, 70),
          twitterDescription: generatedContent.generatedSummary?.substring(0, 200) || '',
          twitterImage: featuredImage.large,

          structuredData,
        },

        publishedAt: new Date(),
        originalPublishedAt: (generatedContent.originalContentId as any)?.publishedAt,

        status: 'published',
        isFeatured: dto.isFeatured || false,
        isBreaking: dto.isBreaking || false,
        priority: 5,

        socialMediaCopies: generatedContent.socialMediaCopies,

        publishingMetadata: {
          publishedBy: null, // TODO: Fase 2 con auth
          publishedFrom: 'dashboard',
          imageSource: dto.useOriginalImage ? 'original' : 'uploaded',
          processingTime: 0,
          version: 1,
        },

        stats: {
          views: 0,
          readTime: 0,
          shares: 0,
        },
      });

      await publishedNoticia.save();

      // 8️⃣ Actualizar AIContentGeneration con info de publicación
      generatedContent.publishingInfo = {
        publishedAt: new Date(),
        publishedBy: null,
        platform: 'web',
        url: canonicalUrl,
        socialShares: 0,
        views: 0,
      };
      await generatedContent.save();

      // 9️⃣ Calcular tiempo de procesamiento
      const processingTime = Date.now() - startTime;
      publishedNoticia.publishingMetadata.processingTime = processingTime;
      await publishedNoticia.save();

      // 🔟 Emitir evento
      this.eventEmitter.emit('noticia.published', {
        noticiaId: publishedNoticia._id,
        slug: publishedNoticia.slug,
        title: publishedNoticia.title,
        category: publishedNoticia.category,
        publishedAt: publishedNoticia.publishedAt,
      });

      this.logger.log(`✅ Noticia publicada: ${slug} (${processingTime}ms)`);

      return publishedNoticia;
    } catch (error) {
      this.logger.error('❌ Error publicando noticia:', error);
      throw error;
    }
  }

  private generateStructuredData(
    content: AIContentGenerationDocument,
    slug: string,
    url: string,
    imageUrl: string,
  ): Record<string, unknown> {
    return {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: content.generatedTitle,
      description: content.generatedSummary,
      image: [imageUrl],
      datePublished: (content.originalContentId as any)?.publishedAt?.toISOString() ||
                     new Date().toISOString(),
      dateModified: new Date().toISOString(),
      author: {
        '@type': 'Person',
        name: (content.originalContentId as any)?.author || 'Noticias Pachuca',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Noticias Pachuca',
        logo: {
          '@type': 'ImageObject',
          url: 'https://noticias-pachuca.com/logo.png',
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': url,
      },
      articleSection: content.generatedCategory,
      keywords: content.generatedKeywords?.join(', '),
    };
  }

  // Método para despublicar (cambiar estado a unpublished)
  async unpublishNoticia(slug: string): Promise<PublishedNoticiaDocument> {
    const noticia = await this.publishedNoticiaModel.findOne({ slug });

    if (!noticia) {
      throw new BadRequestException('Noticia no encontrada');
    }

    noticia.status = 'unpublished';
    await noticia.save();

    this.eventEmitter.emit('noticia.unpublished', {
      noticiaId: noticia._id,
      slug: noticia.slug,
    });

    return noticia;
  }
}
```

#### 3. **Image Processor Service**

```typescript
// packages/api-nueva/src/pachuca-noticias/services/image-processor.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { AwsS3CoreService } from '../../files/services/aws-s3-core.service';
import * as sharp from 'sharp';
import * as https from 'https';
import * as http from 'http';

interface ProcessedImage {
  original: string;
  thumbnail: string;
  medium: string;
  large: string;
  alt: string;
  width: number;
  height: number;
  s3Key: string;
}

@Injectable()
export class ImageProcessorService {
  private readonly logger = new Logger(ImageProcessorService.name);

  constructor(private readonly s3Service: AwsS3CoreService) {}

  async processAndUploadImage(
    imageUrl: string,
    slug: string,
    altText: string,
  ): Promise<ProcessedImage> {
    try {
      // 1. Descargar imagen
      this.logger.log(`📥 Descargando imagen: ${imageUrl}`);
      const imageBuffer = await this.downloadImage(imageUrl);

      // 2. Obtener metadata original
      const metadata = await sharp(imageBuffer).metadata();
      this.logger.log(`📊 Imagen original: ${metadata.width}x${metadata.height}, ${metadata.format}`);

      // 3. Generar diferentes tamaños con Sharp
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const baseKey = `noticias/${year}/${month}/${slug}`;

      // Original (convertir a WebP, max 1920px ancho)
      const originalBuffer = await sharp(imageBuffer)
        .resize(1920, null, {
          withoutEnlargement: true,
          fit: 'inside',
        })
        .webp({ quality: 90 })
        .toBuffer();

      const originalKey = `${baseKey}/original.webp`;
      await this.s3Service.putObject(originalKey, originalBuffer, {
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000', // 1 año
        metadata: {
          alt: altText,
          slug,
        },
      });

      // Thumbnail (400x250)
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(400, 250, { fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer();

      const thumbnailKey = `${baseKey}/thumbnail.webp`;
      await this.s3Service.putObject(thumbnailKey, thumbnailBuffer, {
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000',
      });

      // Medium (800x500)
      const mediumBuffer = await sharp(imageBuffer)
        .resize(800, 500, { fit: 'cover' })
        .webp({ quality: 85 })
        .toBuffer();

      const mediumKey = `${baseKey}/medium.webp`;
      await this.s3Service.putObject(mediumKey, mediumBuffer, {
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000',
      });

      // Large (1200x630 - perfect for OG)
      const largeBuffer = await sharp(imageBuffer)
        .resize(1200, 630, { fit: 'cover' })
        .webp({ quality: 90 })
        .toBuffer();

      const largeKey = `${baseKey}/large.webp`;
      await this.s3Service.putObject(largeKey, largeBuffer, {
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000',
      });

      // 4. Generar URLs públicas
      const cdnBase = process.env.CDN_BASE_URL || 'https://cdn.noticias-pachuca.com';

      const result: ProcessedImage = {
        original: `${cdnBase}/${originalKey}`,
        thumbnail: `${cdnBase}/${thumbnailKey}`,
        medium: `${cdnBase}/${mediumKey}`,
        large: `${cdnBase}/${largeKey}`,
        alt: altText,
        width: metadata.width || 0,
        height: metadata.height || 0,
        s3Key: originalKey,
      };

      this.logger.log(`✅ Imagen procesada y subida: ${originalKey}`);

      return result;
    } catch (error) {
      this.logger.error('❌ Error procesando imagen:', error);
      throw error;
    }
  }

  private async downloadImage(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;

      protocol.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download image: ${response.statusCode}`));
          return;
        }

        const chunks: Buffer[] = [];

        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', reject);
      }).on('error', reject);
    });
  }
}
```

#### 4. **Slug Generator Service**

```typescript
// packages/api-nueva/src/pachuca-noticias/services/slug-generator.service.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PublishedNoticia, PublishedNoticiaDocument } from '../schemas/published-noticia.schema';

@Injectable()
export class SlugGeneratorService {
  constructor(
    @InjectModel(PublishedNoticia.name)
    private publishedNoticiaModel: Model<PublishedNoticiaDocument>,
  ) {}

  async generateUniqueSlug(title: string): Promise<string> {
    // 1. Limpiar y formatear título
    let slug = title
      .toLowerCase()
      .normalize('NFD') // Descomponer caracteres acentuados
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
      .trim()
      .replace(/\s+/g, '-') // Espacios a guiones
      .replace(/-+/g, '-') // Múltiples guiones a uno solo
      .substring(0, 60); // Max 60 caracteres para dejar espacio al UUID

    // 2. Agregar UUID corto (primeros 8 caracteres) para garantizar unicidad
    const shortUuid = this.generateShortUuid();
    slug = `${slug}-${shortUuid}`;

    // 3. Verificar que no exista (por seguridad, aunque el UUID debería garantizarlo)
    const exists = await this.publishedNoticiaModel.findOne({ slug });

    if (exists) {
      // Regenerar con nuevo UUID
      const newUuid = this.generateShortUuid();
      slug = `${slug.replace(/-[a-z0-9]{8}$/, '')}-${newUuid}`;
    }

    return slug;
  }

  private generateShortUuid(): string {
    // Generar 8 caracteres aleatorios (a-z, 0-9)
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
```

---

## 🔍 SEO & META TAGS IMPLEMENTATION

### Estructura de Meta Tags (SSR)

**Ubicación**: `public-noticias/src/routes/noticia.$slug.tsx`

```typescript
// packages/public-noticias/src/routes/noticia.$slug.tsx

import { createFileRoute } from '@tanstack/react-start';
import { z } from 'zod';
import { getNoticiaBySlug } from '@/features/noticias/server/getNoticiaBySlug';
import { NoticiaContent } from '@/features/noticias/components/NoticiaContent';
import { RelatedNoticias } from '@/features/noticias/components/RelatedNoticias';

const noticiaParamsSchema = z.object({
  slug: z.string().min(1),
});

export const Route = createFileRoute('/noticia/$slug')({
  params: {
    parse: noticiaParamsSchema.parse,
    stringify: ({ slug }) => ({ slug }),
  },

  // 🎯 SSR Loader - Se ejecuta en el servidor
  loader: async ({ params }) => {
    const noticia = await getNoticiaBySlug({ slug: params.slug });

    if (!noticia) {
      throw new Error('Noticia no encontrada');
    }

    return { noticia };
  },

  // 🎨 Component que recibe los datos SSR
  component: NoticiaPage,

  // 🔧 Meta tags dinámicos para SEO
  head: ({ loaderData }) => {
    if (!loaderData?.noticia) return null;

    const { noticia } = loaderData;
    const seo = noticia.seo;

    return (
      <>
        {/* Basic Meta Tags */}
        <title>{seo.metaTitle}</title>
        <meta name="description" content={seo.metaDescription} />
        <meta name="keywords" content={noticia.keywords.join(', ')} />
        <link rel="canonical" href={seo.canonicalUrl} />

        {/* Open Graph Tags */}
        <meta property="og:title" content={seo.ogTitle} />
        <meta property="og:description" content={seo.ogDescription} />
        <meta property="og:image" content={seo.ogImage} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={seo.ogUrl} />
        <meta property="og:locale" content="es_MX" />
        <meta property="og:site_name" content="Noticias Pachuca" />

        {/* Article-specific OG tags */}
        <meta property="article:published_time" content={noticia.publishedAt.toISOString()} />
        <meta property="article:modified_time" content={noticia.lastModifiedAt.toISOString()} />
        <meta property="article:author" content={noticia.author || 'Noticias Pachuca'} />
        <meta property="article:section" content={noticia.category} />
        {noticia.tags.map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}

        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seo.twitterTitle} />
        <meta name="twitter:description" content={seo.twitterDescription} />
        <meta name="twitter:image" content={seo.twitterImage} />

        {/* Structured Data (JSON-LD) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(seo.structuredData),
          }}
        />

        {/* Additional SEO */}
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="googlebot" content="index, follow" />
        <meta name="author" content={noticia.author || 'Noticias Pachuca'} />
      </>
    );
  },
});

function NoticiaPage() {
  const { noticia } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <article className="max-w-4xl mx-auto">
          <NoticiaContent noticia={noticia} />
        </article>

        {/* Artículos relacionados */}
        <aside className="mt-16">
          <RelatedNoticias category={noticia.category} currentSlug={noticia.slug} />
        </aside>
      </main>
    </div>
  );
}
```

### Server Function para Obtener Noticia

```typescript
// packages/public-noticias/src/features/noticias/server/getNoticiaBySlug.ts

import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

const getNoticiaSchema = z.object({
  slug: z.string().min(1),
});

export const getNoticiaBySlug = createServerFn({ method: 'GET' })
  .validator(getNoticiaSchema)
  .handler(async ({ data }) => {
    const { slug } = data;

    try {
      // Llamar a la API backend
      const response = await fetch(
        `${process.env.API_URL}/pachuca-noticias/slug/${slug}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Error cargando noticia');
      }

      const noticia = await response.json();

      return noticia;
    } catch (error) {
      console.error('Error fetching noticia:', error);
      throw new Error('Error interno del servidor');
    }
  });
```

### Validación de Meta Tags

**Herramientas recomendadas**:

1. **Open Graph Debugger**: https://www.opengraph.xyz/
2. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
3. **Google Rich Results Test**: https://search.google.com/test/rich-results
4. **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/

---

## 📊 ANALYTICS IMPLEMENTATION

### Configuración de Plausible Analytics

```typescript
// packages/public-noticias/src/lib/analytics/plausible.ts

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number> }) => void;
  }
}

export const initPlausible = () => {
  if (typeof window === 'undefined') return;

  const script = document.createElement('script');
  script.defer = true;
  script.dataset.domain = 'noticias-pachuca.com';
  script.src = 'https://plausible.io/js/script.js';

  document.head.appendChild(script);
};

export const trackEvent = (
  eventName: string,
  props?: Record<string, string | number>
) => {
  if (typeof window === 'undefined' || !window.plausible) return;

  window.plausible(eventName, { props });
};

export const trackPageView = (url: string) => {
  if (typeof window === 'undefined' || !window.plausible) return;

  window.plausible('pageview', { props: { url } });
};
```

### Hook de Analytics

```typescript
// packages/public-noticias/src/features/noticias/hooks/useNoticiaAnalytics.ts

import { useEffect, useState, useCallback } from 'react';
import { trackEvent } from '@/lib/analytics/plausible';
import { throttle } from '@/lib/utils';

export const useNoticiaAnalytics = (slug: string, category: string) => {
  const [readingStartTime] = useState(Date.now());
  const [scrollDepthTracked, setScrollDepthTracked] = useState<Set<number>>(new Set());

  // Track tiempo de lectura al desmontar
  useEffect(() => {
    return () => {
      const timeSpent = Math.round((Date.now() - readingStartTime) / 1000);

      trackEvent('Article Read Time', {
        slug,
        category,
        time_spent_seconds: timeSpent,
      });
    };
  }, [slug, category, readingStartTime]);

  // Track scroll depth
  useEffect(() => {
    const handleScroll = throttle(() => {
      const scrollPercentage = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );

      // Track cada 25%
      const milestones = [25, 50, 75, 100];

      for (const milestone of milestones) {
        if (scrollPercentage >= milestone && !scrollDepthTracked.has(milestone)) {
          trackEvent('Article Scroll', {
            slug,
            category,
            scroll_depth: milestone,
          });

          setScrollDepthTracked((prev) => new Set([...prev, milestone]));
        }
      }
    }, 1000);

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [slug, category, scrollDepthTracked]);

  return {
    trackShare: useCallback((platform: string) => {
      trackEvent('Article Share', {
        slug,
        category,
        platform,
      });
    }, [slug, category]),
  };
};
```

---

## 📅 ROADMAP DE IMPLEMENTACIÓN

### 🔹 FASE 1: Backend - Módulo Pachuca Noticias (Semana 1)

#### Día 1-2: Setup y Esquema
- [ ] **Tarea 1.1**: Crear módulo `pachuca-noticias` en `api-nueva/src/`
  - Crear carpeta con estructura: controllers/, services/, schemas/, dto/, events/
  - Archivo: `pachuca-noticias.module.ts`

- [ ] **Tarea 1.2**: Implementar esquema `PublishedNoticia`
  - Archivo: `schemas/published-noticia.schema.ts`
  - Todos los campos según especificación
  - Índices de performance
  - Hooks pre-save

- [ ] **Tarea 1.3**: Crear DTOs
  - `dto/publish-noticia.dto.ts`
  - `dto/update-noticia.dto.ts`
  - `dto/query-noticias.dto.ts`
  - Validación con `class-validator`

#### Día 3-4: Servicios Core
- [ ] **Tarea 1.4**: Implementar `SlugGeneratorService`
  - Archivo: `services/slug-generator.service.ts`
  - Método `generateUniqueSlug(title: string): Promise<string>`
  - Validación de unicidad

- [ ] **Tarea 1.5**: Implementar `ImageProcessorService`
  - Archivo: `services/image-processor.service.ts`
  - Método `downloadImage(url: string): Promise<Buffer>`
  - Método `processAndUploadImage(url, slug, alt): Promise<ProcessedImage>`
  - Integración con Sharp para redimensionamiento
  - 4 tamaños: original (1920px), large (1200x630), medium (800x500), thumbnail (400x250)
  - Formato WebP con calidad óptima

- [ ] **Tarea 1.6**: Implementar `PublishService`
  - Archivo: `services/publish.service.ts`
  - Método `publishNoticia(dto): Promise<PublishedNoticiaDocument>`
  - Validación de duplicados
  - Orquestación completa del proceso
  - Método `unpublishNoticia(slug): Promise<PublishedNoticiaDocument>`

#### Día 3-4 (CONTINUACIÓN): Sistema de Cola de Publicación Inteligente

- [ ] **Tarea 1.7**: Modificar esquema `PublishedNoticia` para cola
  - Agregar campo `isNoticia: boolean` (prioridad alta en cola)
  - Agregar subdocumento `schedulingMetadata` con:
    - `queuedAt`, `originalScheduledAt`, `adjustedScheduledAt`
    - `delayAppliedMs`, `calculationMethod`, `queuePosition`
    - `totalQueuedAtTime`, `randomizationApplied`, `timeWindow`
  - Los campos `scheduledPublishAt`, `isBreaking`, `priority` ya existen

- [ ] **Tarea 1.8**: Crear esquema `PublishingQueue`
  - Archivo: `schemas/publishing-queue.schema.ts`
  - Campos: `noticiaId`, `contentId`, `scheduledPublishAt`, `queueType`, `priority`, `status`, `bullJobId`, `publishedAt`, `processingMetadata`
  - Estados: 'queued' | 'processing' | 'published' | 'failed' | 'cancelled'
  - Índices: `{ scheduledPublishAt: 1, status: 1 }`, `{ priority: -1, scheduledPublishAt: 1 }`, `{ queueType: 1, status: 1 }`, `{ bullJobId: 1 }`

- [ ] **Tarea 1.9**: Crear DTOs para sistema de cola
  - `dto/schedule-publish.dto.ts` - Para programar publicación
    - Campos: contentId, publicationType ('breaking' | 'news' | 'blog'), useOriginalImage, customScheduleTime (opcional)
  - `dto/query-queue.dto.ts` - Para consultar cola
    - Filtros: status, priority, queueType, dateFrom, dateTo

- [ ] **Tarea 1.10**: Implementar `PublishSchedulerService`
  - Archivo: `services/publish-scheduler.service.ts`
  - Método `schedulePublish(dto)`: Programa publicación según tipo
    - Si isBreaking=true → publicar inmediatamente (bypass cola)
    - Si isNoticia=true → agregar a cola con prioridad ALTA (8)
    - Si blog normal → agregar a cola con prioridad NORMAL (3)
  - Método `calculateNextPublishSlot(priority)`: Algoritmo dinámico de intervalos
    - Si queue < 10: intervalo 30-45 min
    - Si queue 10-50: intervalo 15-25 min
    - Si queue 50-100: intervalo 8-12 min
    - Si queue > 100: intervalo 5-8 min
    - Aplicar multiplicador de prioridad (alta: 0.7x, normal: 1.0x)
    - Agregar randomización ±15% (factor 0.85-1.15)
  - Método `adjustForTimeWindow(scheduledTime)`: Ajustar por horarios
    - Horario pico (8am-10pm): publicar normalmente
    - Horario valle (10pm-8am): postponer hasta 8am siguiente
  - Método `getQueuedCount()`: Contar items en cola (status: queued/processing)
  - Método `getLastScheduledPublish()`: Obtener última publicación programada
  - Método `getQueueStatus(filters)`: Listar cola con filtros
  - Método `forcePublishNow(id)`: Forzar publicación inmediata (admin)
  - Método `cancelScheduledPublish(jobId)`: Cancelar programación

- [ ] **Tarea 1.11**: Implementar `PublishingQueueProcessor`
  - Archivo: `processors/publishing-queue.processor.ts`
  - Decorador `@Processor('publishing-queue')`
  - Método `@Process('publish-scheduled-noticia')` - Handler del job
    - Validar que noticia existe y status='scheduled'
    - Actualizar queue entry a status='processing'
    - Ejecutar lógica de publicación (reutilizar ImageProcessorService, etc.)
    - Actualizar noticia: status='published', publishedAt=NOW
    - Actualizar queue entry: status='published', metadata de procesamiento
    - Emitir evento 'noticia.published'
    - Manejo de errores: actualizar a 'failed' con metadata de error
  - Método `executePublication(noticia)`: Lógica de procesamiento
    - Procesar imágenes, subir a S3, generar SEO
    - Reutilizar código existente de PublishService

- [ ] **Tarea 1.12**: Configurar BullMQ Queue
  - Registrar queue 'publishing-queue' en módulo
  - Opciones: attempts: 3, backoff: exponential 5000ms
  - Configurar processor con concurrencia
  - Health checks y monitoring

#### Día 5: Controlador y Testing

- [ ] **Tarea 1.13**: Implementar `PachucaNoticiasController` (actualizado con endpoints de cola)
  - Archivo: `controllers/pachuca-noticias.controller.ts`
  - **Endpoints existentes**:
    - `POST /pachuca-noticias/publish` - Publicar noticia INMEDIATA (modificar para soportar isBreaking)
    - `GET /pachuca-noticias` - Listar noticias (paginado)
    - `GET /pachuca-noticias/slug/:slug` - Obtener por slug
    - `GET /pachuca-noticias/:id` - Obtener por ID
    - `PATCH /pachuca-noticias/:id` - Actualizar
    - `DELETE /pachuca-noticias/:id/unpublish` - Despublicar
  - **Nuevos endpoints para cola**:
    - `POST /pachuca-noticias/schedule` - Programar publicación (cola inteligente)
    - `GET /pachuca-noticias/queue` - Listar cola de publicación con filtros
    - `GET /pachuca-noticias/queue/stats` - Estadísticas de cola (total encolado, frecuencia, próxima publicación)
    - `POST /pachuca-noticias/:id/force-publish` - Forzar publicación inmediata desde cola (admin)
    - `DELETE /pachuca-noticias/queue/:jobId` - Cancelar publicación programada
    - `PATCH /pachuca-noticias/queue/:id/priority` - Cambiar prioridad de item encolado

- [ ] **Tarea 1.14**: Testing del sistema de cola
  - **Publicación inmediata (isBreaking)**:
    - POST /schedule con publicationType='breaking'
    - Verificar que NO entra a cola
    - Verificar que se publica inmediatamente
    - Validar badge "ÚLTIMA NOTICIA" en BD
  - **Cola alta prioridad (isNoticia)**:
    - POST /schedule con publicationType='news'
    - Verificar que entra a cola con priority=8
    - Verificar cálculo de scheduledPublishAt (30-60 min según cantidad)
    - Validar que job se crea en Bull
  - **Cola normal (blog)**:
    - POST /schedule con publicationType='blog'
    - Verificar priority=3
    - Verificar intervalo más largo (2-4h)
  - **Procesamiento automático**:
    - Esperar que job se procese (o simular con tiempo acelerado)
    - Verificar que noticia cambia a status='published'
    - Verificar que publishedAt se actualiza
  - **Algoritmo de intervalos**:
    - Encolar 5 noticias → verificar intervalos ~30-45 min
    - Encolar 30 noticias → verificar intervalos ~15-25 min
    - Encolar 80 noticias → verificar intervalos ~8-12 min
  - **Ventanas de tiempo**:
    - Programar noticia a las 11pm → verificar que se postpone a 8am
  - **Cancelación**:
    - DELETE /queue/:jobId → verificar que job se cancela en Bull
    - Verificar que noticia vuelve a status='draft' o se elimina

- [ ] **Tarea 1.15**: EventEmitter2 events actualizados
  - Archivo: `events/noticia-events.ts`
  - Evento: `noticia.published` (ya existe)
  - Evento: `noticia.unpublished` (ya existe)
  - **Nuevos eventos**:
    - `noticia.scheduled` - Cuando se agrega a cola
    - `noticia.schedule-cancelled` - Cuando se cancela programación
    - `noticia.priority-changed` - Cuando se cambia prioridad
    - `queue.processing-started` - Cuando job empieza a procesarse
    - `queue.processing-failed` - Cuando job falla

- [ ] **Tarea 1.16**: Build del backend
  - Ejecutar `yarn build` en `api-nueva`
  - Resolver errores de TypeScript
  - Verificar que no hay `any` en el código
  - Validar que BullMQ queue se registra correctamente

---

### 🔹 FASE 2: Frontend Dashboard - Pachuca Noticias UI (Semana 2)

#### Día 1-2: Setup y Tipos
- [ ] **Tarea 2.1**: Crear feature `pachuca-noticias` en `dash-coyote`
  - Carpeta: `src/features/pachuca-noticias/`
  - Estructura: components/, hooks/, types/

- [ ] **Tarea 2.2**: Definir tipos TypeScript
  - Archivo: `types/published-noticia.types.ts`
  - Interfaces para PublishedNoticia, DTOs, responses
  - Sincronizar con backend
  - Archivo: `types/queue.types.ts`
  - Interfaces para PublishingQueue:
    - `PublicationType`: 'breaking' | 'news' | 'blog'
    - `QueueStatus`: 'queued' | 'processing' | 'published' | 'failed' | 'cancelled'
    - `PublicationQueueItem`: queueId, contentId, scheduledPublishAt, priority, status, etc.
    - `QueueStats`: totalQueued, byPriority, estimatedNextPublish, averageInterval

- [ ] **Tarea 2.3**: Implementar hooks de React Query
  - Archivo: `hooks/usePublishedNoticias.ts`
  - Hook `useQuery` para listar noticias publicadas
  - Filtros y paginación
  - Archivo: `hooks/usePublicationQueue.ts`
  - Hook `useQuery` para listar cola de publicación
  - Filtros: status, priority, dateRange
  - Hook `useQueueStats` para estadísticas de cola
  - Polling cada 30 segundos para actualización en tiempo real

- [ ] **Tarea 2.4**: Implementar hooks de mutación
  - Archivo: `hooks/usePublishNoticia.ts`
  - Hook `useMutation` para publicar (breaking news - inmediato)
  - Optimistic updates
  - Invalidación de queries
  - Archivo: `hooks/useSchedulePublication.ts`
  - Hook `useMutation` para programar publicación (news/blog - cola)
  - Parámetros: contentId, publicationType, useOriginalImage
  - Invalidar queries de cola tras scheduling
  - Archivo: `hooks/useQueueMutations.ts`
  - Hook `useCancelSchedule`: Cancelar publicación programada
  - Hook `useChangePriority`: Cambiar prioridad en cola
  - Hook `useForcePublish`: Forzar publicación inmediata (admin)

#### Día 3-4: Componentes UI
- [ ] **Tarea 2.5**: Componente `ContenidosDisponiblesTab` (actualizado)
  - Archivo: `components/tabs/ContenidosDisponiblesTab.tsx`
  - Tabla con columnas: Título, Categoría, Tipo Publicación, Estado Cola, Fecha Programada, Acciones
  - Columna "Tipo Publicación" con badges:
    - 🔴 Última Noticia (Breaking) - Badge rojo
    - 🟡 Es Noticia (News) - Badge amarillo
    - 🔵 Blog Normal - Badge azul
  - Columna "Estado Cola" con badges:
    - ⏳ En Cola (Queued) - Badge gris
    - ⚙️ Procesando (Processing) - Badge azul animado
    - ✅ Publicada (Published) - Badge verde
    - ❌ Fallida (Failed) - Badge rojo
    - 🚫 Cancelada (Cancelled) - Badge gris oscuro
  - Columna "Fecha Programada": Mostrar tiempo relativo (ej: "En 15 min", "En 2 horas")
  - Filtros por categoría, tipo de publicación, y estado de cola
  - Paginación
  - Búsqueda por título

- [ ] **Tarea 2.6**: Componente `ContentDetailsModal` (actualizado con cola)
  - Archivo: `components/modals/ContentDetailsModal.tsx`
  - Ya implementado con preview de contenido, imagen original, checkbox para usar imagen
  - **ACTUALIZAR**: Agregar RadioGroup para tipo de publicación:
    - 🔴 **Última Noticia (Breaking)**: "Se publicará INMEDIATAMENTE al confirmar. No entra en cola."
    - 🟡 **Es Noticia (News)**: "Se publicará lo antes posible. Prioridad alta en cola (~30-60 min)."
    - 🔵 **Blog Normal**: "Se publicará cuando corresponda. Prioridad normal en cola (~2-4 horas)."
  - Mostrar preview de hora programada estimada (según tipo seleccionado y estado de cola)
  - Warning visual si selecciona "Última Noticia" (confirmación adicional)
  - Botón "Publicar" cambia a:
    - "Publicar Inmediatamente" (breaking)
    - "Agregar a Cola" (news/blog)
  - Loading state durante publicación/scheduling
  - Manejo de errores con mensajes específicos

- [ ] **Tarea 2.7**: Componente `NoticiaCard`
  - Archivo: `components/NoticiaCard.tsx`
  - Card con imagen, título, excerpt
  - Badge de estado (Publicada/No publicada)
  - Link a web pública (si está publicada)

- [ ] **Tarea 2.8 (NUEVA)**: Componente `PublicationQueueView`
  - Archivo: `components/queue/PublicationQueueView.tsx`
  - Vista principal de la cola de publicación
  - Estadísticas en cards superiores:
    - Total en cola
    - Próxima publicación (countdown timer)
    - Publicaciones hoy
    - Intervalo promedio
  - Tabs:
    - "En Cola" (queued)
    - "Procesando" (processing)
    - "Publicadas Hoy" (published, filtrado por hoy)
    - "Fallidas" (failed)
  - Cada tab muestra tabla con: Título, Tipo, Hora Programada, Tiempo Restante, Acciones
  - Acciones por fila:
    - Cambiar prioridad (↑↓)
    - Cancelar (🚫)
    - Forzar publicación inmediata (⚡ - solo admin)

- [ ] **Tarea 2.9 (NUEVA)**: Componente `QueueTimeline`
  - Archivo: `components/queue/QueueTimeline.tsx`
  - Vista de timeline horizontal/vertical
  - Mostrar próximas 10 publicaciones programadas
  - Cada item muestra:
    - Hora programada
    - Título de la noticia
    - Badge de tipo (breaking/news/blog)
    - Imagen thumbnail
  - Línea de tiempo con indicador de "ahora"
  - Actualización en tiempo real (WebSocket o polling)

- [ ] **Tarea 2.10 (NUEVA)**: Componente `QueueStatsCards`
  - Archivo: `components/queue/QueueStatsCards.tsx`
  - Grid de 4 cards con métricas:
    - **Total en Cola**: Número con breakdown por prioridad
    - **Próxima Publicación**: Countdown timer + título
    - **Publicaciones Hoy**: Número con gráfico de línea mini
    - **Intervalo Promedio**: Tiempo promedio entre publicaciones
  - Cada card con ícono apropiado y colores distintivos
  - Auto-refresh cada 30 segundos

#### Día 5: Rutas, Sidebar y Testing
- [ ] **Tarea 2.11**: Crear ruta `/pachuca-noticias`
  - Archivo: `src/routes/_authenticated/pachuca-noticias.tsx`
  - Layout con Tabs:
    - Tab "Contenidos Disponibles" - ContenidosDisponiblesTab
    - Tab "Cola de Publicación" - PublicationQueueView
    - Tab "Publicadas" - NoticiasTable (solo publicadas)
  - Header con título y selector de tab
  - Layout responsive

- [ ] **Tarea 2.12**: Crear sub-ruta `/pachuca-noticias/queue`
  - Archivo: `src/routes/_authenticated/pachuca-noticias.queue.tsx`
  - Vista dedicada de cola con más espacio
  - QueueStatsCards en header
  - QueueTimeline en sidebar derecho
  - PublicationQueueView en contenido principal

- [ ] **Tarea 2.13**: Agregar item al sidebar
  - Archivo: `src/components/AppSidebar.tsx`
  - Nuevo item "Pachuca Noticias"
  - Ícono apropiado (📰)
  - Badge opcional con count de contenidos en cola
  - Sub-items:
    - "Contenidos" → /pachuca-noticias
    - "Cola Publicación" → /pachuca-noticias/queue

- [ ] **Tarea 2.14**: Testing manual completo
  - **Flujo 1 - Última Noticia (Breaking)**:
    - Seleccionar contenido en tab "Contenidos Disponibles"
    - Abrir modal, seleccionar "Última Noticia"
    - Verificar warning de publicación inmediata
    - Publicar y verificar que aparece inmediatamente en web
    - Confirmar que NO entró en cola
  - **Flujo 2 - Es Noticia (News Queue)**:
    - Seleccionar contenido, elegir "Es Noticia"
    - Ver estimación de tiempo programado
    - Confirmar y verificar que aparece en "Cola de Publicación"
    - Ver en timeline con hora programada
    - Esperar o forzar publicación
    - Verificar que se publica correctamente
  - **Flujo 3 - Blog Normal (Low Priority Queue)**:
    - Seleccionar contenido, elegir "Blog Normal"
    - Verificar intervalo más largo
    - Confirmar y ver en cola
  - **Flujo 4 - Gestión de Cola**:
    - Cambiar prioridad de un item en cola
    - Cancelar publicación programada
    - Forzar publicación inmediata (admin)
    - Verificar que estadísticas se actualizan
  - **Validaciones**:
    - UI se actualiza en tiempo real (polling)
    - Countdown timers funcionan correctamente
    - Badges y estados correctos
    - Notificaciones/toasts informativos

---

### 🔹 FASE 3: Frontend Público - SSR & SEO (Semana 3)

#### Día 1-2: Server Functions
- [ ] **Tarea 3.1**: Crear feature `noticias` en `public-noticias`
  - Carpeta: `src/features/noticias/`
  - Estructura: server/, components/, types/

- [ ] **Tarea 3.2**: Implementar `getNoticiaBySlug`
  - Archivo: `server/getNoticiaBySlug.ts`
  - Server function con validación Zod
  - Fetch a API backend
  - Cache strategy (considerar)

- [ ] **Tarea 3.3**: Implementar `getNoticias`
  - Archivo: `server/getNoticias.ts`
  - Server function con paginación
  - Filtros por categoría
  - Ordenamiento por fecha

- [ ] **Tarea 3.4**: Implementar `getRelatedNoticias`
  - Archivo: `server/getRelatedNoticias.ts`
  - Obtener 5 noticias de la misma categoría
  - Excluir noticia actual

#### Día 3-4: Componentes y Rutas SSR
- [ ] **Tarea 3.5**: Componente `NoticiaContent`
  - Archivo: `components/NoticiaContent.tsx`
  - Renderizar contenido HTML (sanitizado)
  - Imagen featured con srcset
  - Metadata (autor, fecha, categoría)
  - Botones de compartir en redes

- [ ] **Tarea 3.6**: Componente `RelatedNoticias`
  - Archivo: `components/RelatedNoticias.tsx`
  - Grid de noticias relacionadas
  - Cards con imagen y título

- [ ] **Tarea 3.7**: Ruta `/noticia/$slug`
  - Archivo: `src/routes/noticia.$slug.tsx`
  - SSR loader con `getNoticiaBySlug`
  - Head function con meta tags dinámicos
  - Structured data JSON-LD
  - Componente NoticiaPage

- [ ] **Tarea 3.8**: Modificar ruta `/` (Home)
  - Archivo: `src/routes/index.tsx`
  - Reemplazar mock data con `getNoticias`
  - Mostrar últimas 10 noticias
  - Sección de destacadas (isFeatured)
  - Breaking news banner

- [ ] **Tarea 3.9**: Ruta `/noticias` (Listado completo)
  - Archivo: `src/routes/noticias.tsx`
  - Paginación con search params
  - Filtro por categoría
  - SSR completo

#### Día 5: SEO y Analytics
- [ ] **Tarea 3.10**: Helpers de SEO
  - Archivo: `lib/seo/generateMetaTags.ts`
  - Helper para generar meta tags completos

- [ ] **Tarea 3.11**: Structured Data
  - Archivo: `lib/seo/generateStructuredData.ts`
  - Helper para NewsArticle schema

- [ ] **Tarea 3.12**: Configurar Plausible Analytics
  - Archivo: `lib/analytics/plausible.ts`
  - Inicialización del script
  - trackEvent helper
  - trackPageView helper

- [ ] **Tarea 3.13**: Hook `useNoticiaAnalytics`
  - Archivo: `features/noticias/hooks/useNoticiaAnalytics.ts`
  - Track tiempo de lectura
  - Track scroll depth
  - Track shares

- [ ] **Tarea 3.14**: Testing SEO
  - Validar meta tags con Open Graph Debugger
  - Validar Twitter Cards
  - Validar Schema.org con Google Rich Results Test
  - Lighthouse audit (performance, SEO, accessibility)

---

### 🔹 FASE 4: Integración y Optimización (Semana 4)

#### Día 1-2: Optimizaciones Backend
- [ ] **Tarea 4.1**: Implementar cache en endpoints
  - Redis o in-memory cache
  - Cache de 5 minutos para listados
  - Cache de 15 minutos para noticia individual

- [ ] **Tarea 4.2**: Optimizar queries de BD
  - Agregar índices adicionales si es necesario
  - Profiling de queries lentas

- [ ] **Tarea 4.3**: Rate limiting en publicación
  - Evitar spam de publicaciones inmediatas
  - Máximo 10 publicaciones inmediatas por minuto
  - Prevenir scheduling masivo: máximo 50 items en cola por usuario

- [ ] **Tarea 4.3.1 (NUEVA)**: Monitoreo de cola de publicación
  - Implementar logger específico para eventos de cola
  - Métricas a trackear:
    - Tiempo promedio en cola por prioridad
    - Tasa de publicaciones exitosas vs fallidas
    - Distribución de publicaciones por hora del día
    - Jobs que fallaron más de 3 veces (alertar)
  - Dashboard interno con métricas (opcional)
  - Alertas si cola > 200 items o intervalo promedio < 3 min

#### Día 3: Optimizaciones Frontend
- [ ] **Tarea 4.4**: Lazy loading de imágenes
  - Usar loading="lazy" en imgs
  - Blur placeholder mientras carga

- [ ] **Tarea 4.5**: Code splitting en dash-coyote
  - Lazy load de PublishModal
  - Lazy load de rutas pesadas

- [ ] **Tarea 4.6**: Optimización de bundle público
  - Tree shaking
  - Minificación
  - Análisis de bundle size

#### Día 4: Sitemap y RSS
- [ ] **Tarea 4.7**: Generar sitemap.xml dinámico
  - Endpoint en backend: `GET /sitemap.xml`
  - Incluir todas las noticias publicadas
  - Actualización diaria

- [ ] **Tarea 4.8**: RSS feed
  - Endpoint: `GET /rss.xml`
  - Últimas 50 noticias
  - Formato RSS 2.0

#### Día 5: Testing Final y Deploy
- [ ] **Tarea 4.9**: Testing E2E completo
  - **Flow Breaking News**: Generar contenido → Publicar inmediato → Verificar en web (< 5 seg)
  - **Flow News Queue**: Generar contenido → Agregar a cola → Verificar scheduling → Esperar publicación → Verificar en web
  - **Flow Blog Queue**: Generar contenido → Agregar a cola baja prioridad → Verificar intervalo largo
  - **Flow Gestión Cola**: Cambiar prioridad → Cancelar → Forzar publicación → Validar estados
  - Validar imágenes se cargan correctamente
  - Validar slugs únicos
  - Validar SEO completo
  - **Validar Cola**:
    - Intervalos dinámicos se calculan correctamente
    - Randomización funciona (±15%)
    - Time window adjustment (postpone 10pm-8am)
    - No hay publicaciones simultáneas
    - Retry con backoff funciona en fallos

- [ ] **Tarea 4.10**: Documentación
  - README del módulo
  - Ejemplos de uso
  - Troubleshooting común

- [ ] **Tarea 4.11**: Deploy a staging
  - Backend con variables de entorno
  - Frontend público con analytics de staging
  - Dashboard con endpoint de staging

---

## ✅ CHECKLIST DE VERIFICACIÓN

### Backend
- [ ] Esquema PublishedNoticia implementado con todos los campos
- [ ] Campo `isNoticia` agregado para prioridad en cola
- [ ] Subdocumento `schedulingMetadata` implementado
- [ ] Esquema PublishingQueue implementado con índices correctos
- [ ] Validación de duplicados funcionando (1 contenido → 1 noticia publicada)
- [ ] Imágenes se descargan, optimizan y suben a S3 correctamente
- [ ] URLs de S3 se generan con CDN_BASE_URL
- [ ] Slugs son únicos y SEO-friendly
- [ ] Structured data (NewsArticle) se genera correctamente
- [ ] EventEmitter2 emite eventos al publicar/despublicar
- [ ] **Cola de Publicación**:
  - [ ] BullMQ queue configurada correctamente
  - [ ] PublishSchedulerService calcula intervalos dinámicos
  - [ ] Algoritmo de intervalo funciona (30-45min → 5-8min según tamaño)
  - [ ] Priority multiplier aplicado correctamente (alta: 0.7x, normal: 1.0x)
  - [ ] Randomización ±15% funciona
  - [ ] Time window adjustment funciona (postpone 10pm-8am a 8am)
  - [ ] PublishingQueueProcessor procesa jobs correctamente
  - [ ] Retry con exponential backoff funciona (3 intentos)
  - [ ] Eventos de cola se emiten correctamente
  - [ ] Endpoints de cola funcionan: /schedule, /queue, /queue/stats, /force-publish, /cancel, /change-priority
- [ ] No hay `any` en TypeScript
- [ ] Build del backend pasa sin errores
- [ ] Endpoints REST funcionan correctamente

### Frontend Dashboard
- [ ] Nueva ruta `/pachuca-noticias` accesible
- [ ] Tabla muestra contenidos generados
- [ ] Columnas de tabla actualizadas:
  - [ ] Columna "Tipo Publicación" con badges (Breaking/News/Blog)
  - [ ] Columna "Estado Cola" con badges (Queued/Processing/Published/Failed/Cancelled)
  - [ ] Columna "Fecha Programada" con tiempo relativo
- [ ] Modal de publicación actualizado:
  - [ ] RadioGroup para 3 tipos de publicación funciona
  - [ ] Preview de hora estimada se muestra
  - [ ] Warning para breaking news visible
  - [ ] Botón cambia según tipo ("Publicar Inmediatamente" vs "Agregar a Cola")
- [ ] **Vista de Cola de Publicación**:
  - [ ] PublicationQueueView renderiza correctamente
  - [ ] QueueStatsCards muestran métricas actualizadas
  - [ ] QueueTimeline muestra próximas publicaciones
  - [ ] Tabs de cola funcionan (Queued/Processing/Published/Failed)
  - [ ] Countdown timers funcionan
  - [ ] Polling cada 30 seg funciona
  - [ ] Acciones de cola: Cambiar prioridad, Cancelar, Forzar publicación
- [ ] Optimistic updates al publicar
- [ ] Loading states claros
- [ ] Manejo de errores apropiado
- [ ] Sidebar tiene item "Pachuca Noticias" con sub-items
- [ ] UI responsive en mobile

### Frontend Público (SSR)
- [ ] Ruta `/noticia/$slug` renderiza SSR completo
- [ ] Meta tags dinámicos (título, description)
- [ ] Open Graph tags completos y válidos
- [ ] Twitter Card tags completos
- [ ] Schema.org NewsArticle JSON-LD correcto
- [ ] Canonical URL apunta a producción
- [ ] Imágenes con srcset para responsive
- [ ] Analytics de Plausible funcionando
- [ ] Tiempo de lectura se trackea
- [ ] Scroll depth se trackea
- [ ] Sin errores de hydration
- [ ] Lighthouse score > 90 en Performance, SEO, Accessibility

### SEO Validation
- [ ] Open Graph Debugger pasa (opengraph.xyz)
- [ ] Twitter Card Validator pasa
- [ ] Google Rich Results Test pasa (NewsArticle válido)
- [ ] Facebook Sharing Debugger muestra preview correcto
- [ ] Meta tags tienen longitud apropiada:
  - Title: 50-60 caracteres
  - Meta description: 150-160 caracteres
  - OG description: similar
- [ ] Imágenes OG son 1200x630px (aspecto 16:9)
- [ ] Sitemap.xml se genera dinámicamente

### Performance
- [ ] Imágenes en WebP con múltiples tamaños
- [ ] Cache HTTP apropiado (1 año para imágenes)
- [ ] Lazy loading de imágenes
- [ ] Code splitting en dashboard
- [ ] Bundle size optimizado
- [ ] Time to First Byte (TTFB) < 600ms
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] Cumulative Layout Shift (CLS) < 0.1

---

## 📚 REFERENCIAS Y RECURSOS

### Documentación Oficial
- [TanStack Start](https://tanstack.com/start/latest)
- [Schema.org NewsArticle](https://schema.org/NewsArticle)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/markup)
- [Plausible Analytics](https://plausible.io/docs)
- [Sharp (Image Processing)](https://sharp.pixelplumbing.com/)

### Herramientas de Validación
- **Open Graph**: https://www.opengraph.xyz/
- **Twitter Cards**: https://cards-dev.twitter.com/validator
- **Google Rich Results**: https://search.google.com/test/rich-results
- **Facebook Debugger**: https://developers.facebook.com/tools/debug/
- **Lighthouse**: Chrome DevTools

### Best Practices
- SEO para sitios de noticias 2025: Implementar NewsArticle schema en HTML (no solo JavaScript)
- Open Graph imágenes: 1200x630px, < 5MB, formato WebP o JPG
- Slugs: lowercase, guiones, sin acentos, + UUID para unicidad
- Analytics: Privacy-first, sin cookies, sin PII

---

**📅 Documento creado:** 5 Octubre 2025
**👤 Contexto para:** Coyotito - Sistema completo de publicación de contenido a web pública
**🎯 Objetivo:** Implementar feature end-to-end desde generator-pro hasta renderizado SSR en public-noticias

**🚀 Próximos pasos:**
1. Comenzar con Fase 1 (Backend)
2. Build después de cada fase que modifique la API
3. Validar cada micro-tarea antes de continuar
4. No usar `any`, usar EventEmitter2, no levantar servidores manualmente
5. Notificar a Coyotito tras completar cada fase

---

**¡Listo para comenzar la implementación, Coyotito! 🎯**

---

## 🎬 NUEVO FEATURE: DIRECTOR EDITORIAL

### 📋 Resumen del Feature

**Fecha de actualización:** 5 Octubre 2025
**Prioridad:** Alta
**Status:** En implementación

El **Director Editorial** es un nuevo flujo de creación de contenido que permite al usuario escribir instrucciones libres (sin refinar, en español o inglés, redundantes o no) y el agente "El Informante Pachuqueño" genera automáticamente un artículo periodístico completo con el mismo nivel de calidad que Generator-Pro.

---

### 🎯 Objetivo del Feature

Crear un sistema de generación de contenido **desde cero** donde:

1. **El usuario NO necesita una noticia fuente** - Solo escribe lo que quiere comunicar
2. **El agente interpreta la intención** - Usa Chain of Thought para entender qué quiere decir el usuario
3. **Elimina redundancia automáticamente** - Aunque el usuario repita 10 veces lo mismo, el resultado no es redundante
4. **Traduce inglés → español mexicano** - Automáticamente si el input está en inglés
5. **Genera HTML enriquecido** - Contenido con formato semántico listo para publicar
6. **Produce contenido completo** - Mínimo 800 palabras + copys sociales + SEO

---

### 🆚 Diferencias con Generator-Pro

| Aspecto | Generator-Pro | Director Editorial |
|---------|---------------|-------------------|
| **Input** | Noticia extraída de otra fuente | Texto libre del usuario |
| **Proceso** | Reescribir con personalidad | Crear desde cero interpretando intención |
| **Fuente** | ExtractedNoticia (obligatorio) | Solo userInstructions (string) |
| **Agentes** | Cualquier agente configurado | Siempre "El Informante Pachuqueño" |
| **Redundancia** | Control normal | Sistema anti-redundancia avanzado |
| **Idioma input** | Depende de fuente | Español o inglés |
| **Traducción** | No aplica | Automática inglés → español MX |

---

### 👤 Agente: "El Informante Pachuqueño"

**Perfil Completo:**

```typescript
{
  name: 'El Informante Pachuqueño',
  age: 45,
  role: 'Director Editorial / Periodista Senior',
  type: 'reportero',
  editorialLean: 'neutral',

  characteristics: [
    'Absolutamente neutral e imparcial',
    'Objetivo y honesto',
    'Analítico y tecnócrata',
    'Convicciones progresistas de centro',
    'Empático y humano',
    'Tuzo de corazón (aficionado al Pachuca)',
    'Apasionado por la política y las noticias',
    'Conocedor profundo de Pachuca, Hidalgo y México',
  ],

  writingStyle: {
    tone: 'conversational',
    vocabulary: 'advanced',
    length: 'variable',
    structure: 'analytical',
    audience: 'general',
    language: 'Español mexicano contemporáneo',
    approach: 'Profesional pero accesible, nunca acartonado',
  },

  specializations: [
    'política',
    'social',
    'economía',
    'tecnología',
    'internacional',
  ],

  superpower: 'Transformar contenido inglés a español mexicano con naturalidad generacional (40-50 años)',
}
```

---

### 🔄 Flujo de Trabajo

```
┌─────────────────────────────────────────────────────────────┐
│  1. USUARIO EN DASH-COYOTE                                   │
│  Tab "Director Editorial" → Textarea con instrucciones       │
│  Ejemplo: "Quiero publicar sobre el nuevo hospital en        │
│  Pachuca, costará 500 millones, tendrá 200 camas..."         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓ POST /api/generator-pro/director-editorial
┌─────────────────────────────────────────────────────────────┐
│  2. BACKEND: DirectorEditorialPromptBuilderService           │
│                                                               │
│  A. Construir prompts especializados:                        │
│     - SystemPrompt: Personalidad del agente                  │
│     - UserPrompt: Instrucciones + proceso anti-redundancia   │
│                                                               │
│  B. Llamar a OpenAI GPT-4:                                   │
│     - model: 'gpt-4-turbo-preview'                           │
│     - temperature: 0.7                                        │
│     - response_format: { type: 'json_object' }               │
│                                                               │
│  C. Procesar respuesta:                                      │
│     - Parsear JSON                                           │
│     - Validar output (mín 800 palabras, HTML válido)         │
│     - Verificar estructura y anti-redundancia                │
│                                                               │
│  D. Guardar en AIContentGeneration:                          │
│     - type: 'director-editorial'                             │
│     - originalContentId: null (no hay fuente)                │
│     - originalTitle: input del usuario                       │
│     - agentId: El Informante Pachuqueño                      │
│     - generatedContent: HTML enriquecido                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓ Response con contenido generado
┌─────────────────────────────────────────────────────────────┐
│  3. FRONTEND: Visualización                                  │
│                                                               │
│  - Mostrar título generado                                   │
│  - Renderizar HTML con dangerouslySetInnerHTML               │
│  - Mostrar copys de Facebook y Twitter                       │
│  - Botones: "Guardar Borrador" | "Publicar Ahora"           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓ Usuario decide publicar
┌─────────────────────────────────────────────────────────────┐
│  4. PUBLICACIÓN (mismo flujo que Generator-Pro)              │
│  - PublishService procesa el contenido                       │
│  - Descarga/sube imágenes a S3                               │
│  - Genera slug único                                         │
│  - Crea PublishedNoticia                                     │
│  - Noticia visible en public-noticias                        │
└─────────────────────────────────────────────────────────────┘
```

---

### 🧠 Sistema Anti-Redundancia

**Problema:** El usuario puede escribir instrucciones redundantes como:
```
"El parque es grande, el parque tiene árboles, en el parque hay juegos,
el parque es bonito, el parque está en el centro, el parque es nuevo"
```

**Solución - Chain of Thought en el Prompt:**

```
PASO 1 - INTERPRETACIÓN:
• Identificar tema central: "Nuevo parque en el centro"
• Extraer hechos únicos: [grande, árboles, juegos, centro, nuevo]
• Eliminar repeticiones: "el parque" se menciona 6 veces

PASO 2 - ELIMINACIÓN DE REDUNDANCIA:
• Tomar cada hecho UNA SOLA VEZ
• Crear párrafos que aporten información NUEVA
• Variar vocabulario: parque → área verde → espacio recreativo
• Expandir con contexto: ¿Por qué es importante? ¿Para quién?

PASO 3 - EXPANSIÓN:
• Agregar contexto verosímil sobre parques en Pachuca
• Comparar con otros parques de la región
• Mencionar impacto en la comunidad
• Incluir datos técnicos (hectáreas, inversión, etc.)
```

**Resultado:** Artículo de 800+ palabras sin redundancia, aunque input tenga 10 líneas repetitivas.

---

### 📝 Optimizaciones de Prompts (Aplicadas)

#### A. Generator-Pro - HTML Enriquecido

**Modificaciones aplicadas en `generator-pro-prompt-builder.service.ts`:**

1. **Nuevo bloque en contentLengthInstructions (líneas 89-118):**
   ```typescript
   ⚠️ FORMATO HTML OBLIGATORIO:
   El campo "content" DEBE contener HTML válido y semántico.

   TAGS HTML REQUERIDOS:
   • <h2> para títulos de sección (3-4 por artículo)
   • <h3> para subtítulos (2-3 por sección)
   • <p> para CADA párrafo
   • <strong> para énfasis fuerte
   • <em> para énfasis suave
   • <ul>, <ol>, <li> para listas
   • <blockquote> para citas
   ```

2. **Ejemplo de JSON actualizado (línea 293):**
   ```json
   {
     "content": "<h2>Título Sección</h2><p><strong>Lead</strong>...</p>..."
   }
   ```

**Impacto:**
- ✅ El contenido generado ahora incluye HTML semántico
- ✅ Listo para renderizar en frontend sin procesamiento adicional
- ✅ Mejor SEO (estructura semántica)
- ✅ Mejor UX (formato visual apropiado)

#### B. Director Editorial - Prompt Completo Nuevo

**Archivo creado: `director-editorial-prompt-builder.service.ts`**

**Técnicas de Prompt Engineering aplicadas:**

1. **Role Playing Detallado:**
   - Personalidad completa del agente (edad, experiencia, características)
   - Contexto de trabajo (Director Editorial)
   - Superpoder específico (traducción inglés-español MX)

2. **Chain of Thought Explícito:**
   ```
   PASO 1: Interpretar intención
   PASO 2: Eliminar redundancia
   PASO 3: Generar contenido
   ```

3. **Few-Shot Learning:**
   - Ejemplos de HTML correcto
   - Ejemplos de estructura de secciones
   - Ejemplos de hooks virales

4. **Structured Output:**
   - JSON schema específico
   - Validación con método `validateOutput()`
   - Campos obligatorios claramente marcados

5. **Anti-Pattern Instructions:**
   ```
   🚫 PROHIBIDO:
   ❌ Ser redundante
   ❌ Copiar frases del usuario
   ❌ Usar markdown
   ❌ Menos de 800 palabras
   ```

6. **Validation Checklist:**
   ```
   ☑ ¿Content tiene mín 800 palabras?
   ☑ ¿Es HTML válido?
   ☑ ¿Eliminé redundancia?
   ☑ ¿Español mexicano natural?
   ```

---

### 📁 Archivos Nuevos/Modificados

#### Backend

**Nuevos:**
1. `/packages/api-nueva/src/generator-pro/services/director-editorial-prompt-builder.service.ts` (358 líneas)
   - Clase completa con buildPrompt() y validateOutput()
   - Prompts optimizados con Chain of Thought
   - Sistema anti-redundancia
   - Traductor inglés → español MX

2. `/packages/api-nueva/PROMPT_OPTIMIZATIONS_IMPLEMENTATION.md` (391 líneas)
   - Guía completa de implementación
   - Ejemplos de código
   - Checklist de verificación

**Modificados:**
1. `/packages/api-nueva/src/generator-pro/services/generator-pro-prompt-builder.service.ts`
   - Líneas 84-118: Nueva sección de HTML obligatorio
   - Línea 293: Ejemplo de JSON con HTML

**Pendientes de crear:**
1. `/packages/api-nueva/src/generator-pro/generator-pro.module.ts`
   - Agregar DirectorEditorialPromptBuilderService a providers y exports

2. `/packages/api-nueva/src/generator-pro/controllers/generator-pro.controller.ts`
   - Nuevo endpoint POST `/director-editorial`

3. `/packages/api-nueva/src/generator-pro/services/generator-pro.service.ts`
   - Método `generateFromDirectorEditorial()`

#### Frontend (dash-coyote)

**Pendientes de crear:**
1. `/packages/dash-coyote/src/features/pachuca-noticias/components/tabs/DirectorEditorialTab.tsx`
   - Textarea para instrucciones
   - Preview del contenido generado
   - Botones de acción (Guardar / Publicar)

2. `/packages/dash-coyote/src/features/pachuca-noticias/hooks/useDirectorEditorial.ts`
   - Hook useMutation para generar contenido
   - Manejo de loading y errores

#### Frontend (public-noticias)

**Pendientes de modificar:**
1. `/packages/public-noticias/src/routes/noticia.$slug.tsx`
   - Cambiar renderizado de `{content}` a `dangerouslySetInnerHTML`
   - Línea a modificar: ~145 (aprox, en el div del contenido)

2. `/packages/public-noticias/src/routes/index.tsx`
   - Cambiar renderizado en cards de noticias
   - Aplicar mismo patrón de HTML

---

### 🔧 Implementación Técnica

#### Endpoint Backend

```typescript
// generator-pro.controller.ts

@Post('director-editorial')
async generateFromDirectorEditorial(
  @Body() dto: {
    instructions: string;
    language?: 'es' | 'en';
  },
) {
  return this.generatorProService.generateFromDirectorEditorial({
    instructions: dto.instructions,
    language: dto.language || 'es',
  });
}
```

#### Servicio de Generación

```typescript
// generator-pro.service.ts

async generateFromDirectorEditorial(params: {
  instructions: string;
  language: 'es' | 'en';
}) {
  // 1. Obtener agente "El Informante Pachuqueño"
  const agent = await this.agentModel.findOne({
    name: 'El Informante Pachuqueño',
  });

  if (!agent) {
    throw new NotFoundException('Agente no encontrado');
  }

  // 2. Construir prompts
  const { systemPrompt, userPrompt, agentProfile } =
    this.directorEditorialPromptBuilder.buildPrompt({
      userInstructions: params.instructions,
      language: params.language,
    });

  // 3. Llamar a OpenAI
  const completion = await this.openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
  });

  // 4. Parsear y validar
  const generated = JSON.parse(completion.choices[0].message.content);

  const validation = this.directorEditorialPromptBuilder.validateOutput(generated);
  if (!validation.isValid) {
    throw new BadRequestException(`Inválido: ${validation.errors.join(', ')}`);
  }

  // 5. Guardar AIContentGeneration
  const aiContent = new this.aiContentModel({
    originalContentId: null, // NO hay fuente externa
    originalTitle: params.instructions.substring(0, 100),
    originalContent: params.instructions,
    agentId: agent._id,
    templateId: null, // Usar template default
    providerId: null, // Se llena después

    generatedTitle: generated.title,
    generatedContent: generated.content, // HTML enriquecido
    generatedKeywords: generated.keywords,
    generatedTags: generated.tags,
    generatedCategory: generated.category,
    generatedSummary: generated.summary,
    socialMediaCopies: generated.socialMediaCopies,

    status: 'completed',
    generationMetadata: {
      model: 'gpt-4-turbo-preview',
      promptTokens: completion.usage.prompt_tokens,
      completionTokens: completion.usage.completion_tokens,
      totalTokens: completion.usage.total_tokens,
      cost: calculateCost(completion.usage),
      processingTime: Date.now() - startTime,
      temperature: 0.7,
      maxTokens: 4000,
      finishReason: completion.choices[0].finish_reason,
    },

    generatedAt: new Date(),
  });

  await aiContent.save();

  return {
    success: true,
    contentId: aiContent._id,
    content: generated,
  };
}
```

#### Frontend Tab

```tsx
// DirectorEditorialTab.tsx

export function DirectorEditorialTab() {
  const [instructions, setInstructions] = useState('');
  const generateMutation = useGenerateFromDirectorEditorial();

  const handleGenerate = () => {
    generateMutation.mutate({
      instructions,
      language: 'es',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Director Editorial</CardTitle>
          <CardDescription>
            Escribe instrucciones libres sobre lo que quieres publicar.
            El Informante Pachuqueño generará el artículo completo.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Textarea
            placeholder="Ejemplo: Quiero publicar sobre el nuevo hospital..."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={10}
            className="mb-4"
          />

          <Button
            onClick={handleGenerate}
            disabled={!instructions || generateMutation.isPending}
          >
            {generateMutation.isPending ? 'Generando...' : 'Generar Artículo'}
          </Button>
        </CardContent>
      </Card>

      {generateMutation.data && (
        <Card>
          <CardHeader>
            <CardTitle>{generateMutation.data.content.title}</CardTitle>
          </CardHeader>

          <CardContent>
            {/* Renderizar HTML directamente */}
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{
                __html: generateMutation.data.content.content,
              }}
            />

            <div className="mt-6 space-y-4">
              <div>
                <h4 className="font-semibold">Facebook:</h4>
                <p>{generateMutation.data.content.socialMediaCopies.facebook.copy}</p>
              </div>
              <div>
                <h4 className="font-semibold">Twitter:</h4>
                <p>{generateMutation.data.content.socialMediaCopies.twitter.tweet}</p>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <Button variant="outline">Guardar Borrador</Button>
              <Button>Publicar Ahora</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

---

### ✅ Checklist de Implementación

#### Backend
- [x] Crear `director-editorial-prompt-builder.service.ts`
- [x] Modificar `generator-pro-prompt-builder.service.ts` para HTML
- [ ] Agregar servicio a `generator-pro.module.ts`
- [ ] Crear endpoint en `generator-pro.controller.ts`
- [ ] Implementar `generateFromDirectorEditorial()` en servicio
- [ ] Testear generación con instrucciones en español
- [ ] Testear generación con instrucciones en inglés
- [ ] Testear anti-redundancia con input redundante
- [ ] Validar HTML output correcto
- [ ] Validar mínimo 800 palabras

#### Frontend Dashboard
- [ ] Crear `DirectorEditorialTab.tsx`
- [ ] Crear hook `useGenerateFromDirectorEditorial.ts`
- [ ] Agregar tab al componente principal
- [ ] Implementar textarea para instrucciones
- [ ] Implementar preview con HTML rendering
- [ ] Implementar botones Guardar/Publicar
- [ ] Agregar estilos prose para HTML
- [ ] Testear UX completa

#### Frontend Público
- [ ] Modificar `/noticia/$slug` para usar `dangerouslySetInnerHTML`
- [ ] Modificar `/` (home) para usar `dangerouslySetInnerHTML`
- [ ] Modificar `/noticias` para usar `dangerouslySetInnerHTML`
- [ ] Agregar sanitización HTML (DOMPurify)
- [ ] Agregar estilos CSS para contenido HTML
- [ ] Testear renderizado en diferentes dispositivos

---

### 🎯 Casos de Uso

**Caso 1: Instrucciones Redundantes en Español**
```
Input:
"El nuevo parque es grande, el parque tiene árboles, en el parque hay juegos,
el parque está en el centro, el parque es bonito, el parque es nuevo"

Output esperado:
- Artículo 800+ palabras NO redundante
- Secciones variadas: Inauguración, Características, Impacto, Perspectivas
- Vocabulario diverso: parque → área verde → espacio recreativo
- Contexto local de Pachuca agregado
- HTML semántico completo
```

**Caso 2: Instrucciones en Inglés**
```
Input:
"New hospital opening in Pachuca, downtown area, 200 beds, 500 million pesos,
state-of-the-art technology, opening next month"

Output esperado:
- Traducción automática a español mexicano
- Conversión: "downtown" → "centro", "$500M" → "500 millones de pesos"
- Contexto: Comparación con otros hospitales de Hidalgo
- Relevancia local: Impacto en el sistema de salud pachuqueño
- 800+ palabras en español natural
```

**Caso 3: Instrucciones Desorganizadas**
```
Input:
"Hay un evento de música, bandas locales, en el auditorio,
creo que es este sábado o el otro, no estoy seguro, gratis para todos,
organiza el ayuntamiento, 5pm tal vez?"

Output esperado:
- Interpretación: "Concierto de bandas locales organizado por el ayuntamiento"
- Inferencia de detalles faltantes (sábado próximo, 5pm, auditorio municipal)
- Contexto: Historia de eventos culturales en Pachuca
- Estructura profesional completa
- Información organizada y clara
```

---

### 🚀 Beneficios del Feature

1. **Flexibilidad Total:** Usuario no necesita noticia fuente
2. **Reducción de Fricción:** Escribe lo que quieras, como quieras
3. **Bilingüe:** Acepta inglés o español
4. **Anti-Redundancia:** Contenido único aunque input sea repetitivo
5. **HTML Profesional:** Formato listo para publicar
6. **SEO Optimizado:** Estructura semántica + meta datos
7. **Consistencia:** Usa el mismo agente (El Informante Pachuqueño)
8. **Integración:** Se conecta con el flujo de publicación existente

---

### 📊 Métricas de Éxito

**Criterios de Aceptación:**

- ✅ Usuario puede escribir instrucciones libres sin estructura
- ✅ Sistema genera artículos de 800+ palabras siempre
- ✅ No hay redundancia en output aunque input sea redundante
- ✅ Traduce inglés a español mexicano correctamente
- ✅ Genera HTML válido y semántico
- ✅ Copys sociales incluidos (Facebook + Twitter)
- ✅ Puede publicarse igual que Generator-Pro
- ✅ Validación automática de output funciona

**KPIs:**
- Tiempo promedio de generación: < 30 segundos
- Tasa de validación exitosa: > 95%
- Longitud promedio del contenido: 1000-1200 palabras
- Satisfacción del usuario: Feedback positivo sobre flexibilidad

---

**📅 Última actualización:** 5 Octubre 2025
**📝 Próximo paso:** Continuar implementación backend y frontend
**🎯 Status:** Prompts optimizados ✅ | Backend 30% ⏳ | Frontend 0% 🔜
