# 📰 Análisis: Sistema Multi-Sitio + Redes Sociales para Noticias Pachuca

**Fecha de Análisis**: 14 de Octubre, 2025
**Autor**: Jarvis (Claude Code)
**Objetivo**: Implementar sistema multi-sitio para soportar múltiples subdominios + publicación en redes sociales por sitio

---

## ⚠️ ACLARACIÓN CRÍTICA: `Site` ≠ `NewsWebsiteConfig`

### 🔴 **IMPORTANTE**: Dos Conceptos DIFERENTES

#### **1. `NewsWebsiteConfig` (YA EXISTE) - Sitios de EXTRACCIÓN/SCRAPING**
- **Ubicación**: `packages/api-nueva/src/generator-pro/schemas/news-website-config.schema.ts`
- **Propósito**: Configurar sitios de COMPETIDORES de donde EXTRAEMOS/SCRAPEAMOS noticias
- **Ejemplos**: "El Universal", "Milenio", "Reforma", "La Jornada"
- **Funcionalidad**:
  - Selectores CSS para extraer títulos, contenido, imágenes
  - Configuración de frecuencias de scraping
  - URLs de listados de noticias
  - Estadísticas de extracción
- **Flujo**: SCRAPING → EXTRACCIÓN → GENERACIÓN CON IA → PUBLICACIÓN
- **Módulo**: `GeneratorProModule`

#### **2. `Site` (NO EXISTE - LO PROPONEMOS) - Sitios DESTINO para PUBLICAR**
- **Ubicación**: `packages/api-nueva/src/pachuca-noticias/schemas/site.schema.ts` (NUEVO)
- **Propósito**: Configurar NUESTROS sitios/subdominios donde PUBLICAMOS noticias
- **Ejemplos**: "noticiaspachuca.com", "tuzona.noticiaspachuca.com", "mitoteo.noticiaspachuca.com"
- **Funcionalidad**:
  - Branding (colores, logos, favicon)
  - Configuración CDN (S3, CloudFront)
  - SEO base por sitio
  - **Redes sociales asignadas** (Facebook pages, Twitter accounts)
  - Estadísticas de publicación
- **Flujo**: CONTENIDO GENERADO → SELECCIONAR SITES → PUBLICAR EN MÚLTIPLES SITES + REDES SOCIALES
- **Módulo**: `PachucaNoticiasModule`

#### **🔑 Diferencia Clave**:
```
NewsWebsiteConfig = ORIGEN (de dónde EXTRAEMOS contenido de otros)
Site              = DESTINO (dónde PUBLICAMOS nuestro contenido)
```

#### **Relación en el flujo completo**:
```
1. NewsWebsiteConfig (El Universal) → Extrae noticia
2. ContentAgent (Reportero) → Genera contenido con IA
3. Site (noticiaspachuca.com + tuzona.com) → Publica en NUESTROS sitios
4. Social Media (Facebook + Twitter) → Publica en redes de cada Site
```

---

## 📋 TABLA DE CONTENIDOS

1. [Estado Actual del Sistema](#-1-estado-actual-del-sistema)
2. [Sistema de Redes Sociales Existente](#-2-sistema-de-redes-sociales-existente)
3. [Arquitectura Propuesta Multi-Sitio](#-3-arquitectura-propuesta-multi-sitio)
4. [Integración Redes Sociales con Multi-Sitio](#-4-integracion-redes-sociales-con-multi-sitio)
5. [Patrones de Implementación Backend](#-5-patrones-de-implementacion-backend)
6. [Patrones de Implementación Frontend (mobile-expo)](#-6-patrones-de-implementacion-frontend-mobile-expo)
7. [Fases de Implementación](#-7-fases-de-implementacion)
8. [Síntesis Ejecutiva de Fases](#-8-sintesis-ejecutiva-de-fases)

---

## 🔍 1. ESTADO ACTUAL DEL SISTEMA

### 1.1. Backend (api-nueva)

#### **Schemas Actuales**

**`PublishedNoticia` Schema** (`published-noticia.schema.ts`)
```typescript
@Schema({ timestamps: true })
export class PublishedNoticia {
  @Prop({ type: Types.ObjectId, ref: 'AIContentGeneration', required: true, unique: true })
  contentId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  slug: string; // 🔴 PROBLEMA: Único a nivel global, no por sitio

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true, index: true })
  category: Types.ObjectId;

  @Prop({ type: Object, required: true })
  seo: {
    canonicalUrl: string; // 🔴 PROBLEMA: Hardcoded a noticiaspachuca.com
    // ... más campos SEO
  };

  @Prop({ enum: ['draft', 'scheduled', 'published', 'unpublished', 'archived'], default: 'published' })
  status: string;

  // 🔴 NO EXISTE: Campo para identificar a qué sitio pertenece
  // 🔴 NO EXISTE: Campo para identificar en qué redes sociales se publicó
}

// Índices actuales
PublishedNoticiaSchema.index({ slug: 1 }, { unique: true }); // 🔴 PROBLEMA: Slug único global
PublishedNoticiaSchema.index({ status: 1, publishedAt: -1 });
PublishedNoticiaSchema.index({ category: 1, publishedAt: -1 });
```

---

## 📱 2. SISTEMA DE REDES SOCIALES EXISTENTE

### 2.1. **GetLate.dev - Sistema de PUBLICACIÓN**

#### **✅ Implementado: Facebook Publishing**

**`FacebookPublishingConfig` Schema** (`facebook-publishing-config.schema.ts`)
```typescript
@Schema({ timestamps: true })
export class FacebookPublishingConfig {
  @Prop({ required: true, type: Types.ObjectId, ref: 'NewsWebsiteConfig' })
  websiteConfigId: Types.ObjectId; // 🔴 PROBLEMA: Referencia a NewsWebsiteConfig, no a Site

  @Prop({ required: true, trim: true })
  name: string; // "Publicación El Universal"

  @Prop({ required: true, trim: true })
  facebookPageId: string; // ID de la página de Facebook

  @Prop({ required: true, trim: true })
  facebookPageName: string;

  @Prop({ required: true, select: false })
  getLateApiKey: string; // API key de GetLate.dev

  @Prop({ required: true, type: Types.ObjectId, ref: 'PromptTemplate' })
  templateId: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  // ⏰ CONFIGURACIÓN DE FRECUENCIA
  @Prop({ default: 30 })
  publishingFrequency: number; // minutos

  @Prop({ default: 10 })
  maxPostsPerDay: number;

  // 📝 TEMPLATE PARA POSTS
  @Prop({ type: String, default: '{{title}}\n\n{{summary}}\n\n{{hashtags}}' })
  postTemplate: string;

  // 🎯 OPTIMIZACIÓN
  @Prop({ type: Object, default: {} })
  optimizationSettings: {
    useEmojis?: boolean;
    useHashtags?: boolean;
    maxHashtags?: number;
    includeCallToAction?: boolean;
  };

  // 📊 ESTADÍSTICAS
  @Prop()
  lastPublishedAt?: Date;

  @Prop({ default: 0 })
  postsToday: number;
}
```

**`FacebookPublishingService`** - Usa GetLate API
```typescript
@Injectable()
export class FacebookPublishingService {
  private readonly getLateBaseUrl = 'https://api.getlate.dev/v1';

  async publishPost(post: FacebookPostDocument): Promise<PublishResult> {
    // Prepara datos para GetLate API
    const postData = {
      content: post.postContent,
      platforms: [{
        platform: 'facebook',
        accountId: facebookConfig.facebookPageId,
      }],
      mediaItems: post.mediaUrls.map(url => ({ type: 'image', url })),
      scheduledDate: post.scheduledAt.toISOString(),
    };

    // POST a GetLate API
    const response = await axios.post(
      `${this.getLateBaseUrl}/posts`,
      postData,
      {
        headers: {
          'Authorization': `Bearer ${facebookConfig.getLateApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Retorna info de publicación
    return {
      success: true,
      facebookPostId: facebookResult.platformPostId,
      facebookPostUrl: facebookResult.platformPostUrl,
    };
  }

  // Optimización de contenido
  async optimizeContentForFacebook(content: any): Promise<string>
  async generateEmojis(content: string): Promise<string[]>
  async generateHashtags(content: string, category: string): Promise<string[]>
}
```

**`FacebookPagesService`** - Obtiene páginas desde GetLate
```typescript
@Injectable()
export class FacebookPagesService {
  private readonly getLateBaseUrl = 'https://getlate.dev/api/v1';

  async getFacebookPages(): Promise<FacebookPagesResponseDto> {
    // 1. Obtener perfiles de GetLate
    const profilesResponse = await axios.get(`${this.getLateBaseUrl}/profiles`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });

    const defaultProfile = profilesResponse.data.profiles.find(p => p.isDefault);

    // 2. Obtener cuentas de Facebook del perfil
    const accountsResponse = await axios.get(`${this.getLateBaseUrl}/accounts`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
      params: { profileId: defaultProfile._id }
    });

    // 3. Filtrar solo Facebook activas
    const facebookAccounts = accountsResponse.data.accounts.filter(
      account => account.platform === 'facebook' && account.isActive
    );

    // 4. Extraer páginas disponibles
    const pages: FacebookPageDto[] = [];
    for (const account of facebookAccounts) {
      const availablePages = account.metadata?.availablePages || [];
      for (const page of availablePages) {
        pages.push({
          id: page.id,
          name: page.name,
          username: page.username,
          picture: account.profilePicture,
          accessToken: account.accessToken,
        });
      }
    }

    return { pages, total: pages.length };
  }
}
```

#### **⚠️ PENDIENTE: Twitter Publishing**

**🔴 NO EXISTE AÚN**: Schema `TwitterPublishingConfig`
**🔴 NO EXISTE AÚN**: Service `TwitterPublishingService`

Pero GetLate.dev **SÍ SOPORTA TWITTER**:
```typescript
// GetLate API permite publicar en Twitter
const postData = {
  content: 'Tweet content',
  platforms: [{
    platform: 'twitter', // ✅ GetLate soporta Twitter
    accountId: twitterAccountId,
  }],
  scheduledDate: scheduledAt.toISOString(),
};
```

---

### 2.2. **RapidAPI - Sistema de EXTRACCIÓN (Scraping)**

#### **✅ Implementado: Facebook Extraction**

**`RapidAPIFacebookModule`** - Módulo completo
- Extrae posts de páginas de Facebook de competidores
- Usa RapidAPI `facebook-scraper3.p.rapidapi.com`
- Schemas: `RapidAPIFacebookPage`, `RapidAPIFacebookPost`, `RapidAPIConfig`
- NO es para publicar, solo para scrapear contenido

#### **✅ Implementado: Twitter Extraction**

**`RapidAPITwitterModule`** - Módulo completo
- Extrae tweets de usuarios de Twitter
- Usa RapidAPI `twitter241.p.rapidapi.com`
- Schemas: `RapidAPITwitterUser`, `RapidAPITwitterPost`, `RapidAPITwitterConfig`
- NO es para publicar, solo para scrapear contenido

---

### 2.3. **Social Media Copy Generator**

**`SocialMediaCopyGeneratorService`** - Valida copys para ambas redes
```typescript
@Injectable()
export class SocialMediaCopyGeneratorService {
  /**
   * Validar Facebook Copy
   * - Hook: 10-15 palabras
   * - Copy: 40-80 palabras mínimo
   * - Emojis: máximo 4
   */
  validateFacebookCopy(copy: {
    hook: string;
    copy: string;
    emojis: string[];
  }): { valid: boolean; errors: string[] }

  /**
   * Validar Twitter Copy
   * - Tweet: 200-240 chars recomendado
   * - Emojis: máximo 2
   */
  validateTwitterCopy(copy: {
    tweet: string;
    emojis: string[];
  }): { valid: boolean; errors: string[] }

  /**
   * Validar todos los copys
   */
  validateAllCopies(
    copys: {
      facebook?: { hook: string; copy: string; emojis: string[] };
      twitter?: { tweet: string; emojis: string[] };
    },
    context?: { extractedContentId?: string; agentId?: string },
  ): {
    valid: boolean;
    facebookValidation?: { valid: boolean; errors: string[] };
    twitterValidation?: { valid: boolean; errors: string[] };
    overallErrors: string[];
  }
}
```

---

## 🏗️ 3. ARQUITECTURA PROPUESTA MULTI-SITIO

### 3.1. Schema Nuevo: `Site` (Platform/Tenant)

**Archivo**: `packages/api-nueva/src/pachuca-noticias/schemas/site.schema.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SiteDocument = Site & Document;

/**
 * 🌐 Schema SIMPLIFICADO para sitios/plataformas multi-tenant
 *
 * ⚠️ PROPÓSITO: Este schema define DÓNDE se publica contenido (destinos de publicación)
 *
 * Sites = Destinos donde publicamos nuestro contenido generado
 * Ejemplos: noticiaspachuca.com, tuzona.noticiaspachuca.com, mitoteo.noticiaspachuca.com
 *
 * IMPORTANTE:
 * - Cada frontend maneja su propio SEO, CDN, branding en su código
 * - Este schema solo indica el destino y las redes sociales asignadas
 * - NO confundir con NewsWebsiteConfig (sitios de extracción/scraping)
 */
@Schema({ timestamps: true })
export class Site {
  // ========================================
  // 🔑 IDENTIFICACIÓN (REQUERIDO)
  // ========================================

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  domain: string; // "noticiaspachuca.com", "tuzona.noticiaspachuca.com"

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string; // "noticiaspachuca", "tuzona", "mitoteo"

  @Prop({ required: true, trim: true })
  name: string; // "Noticias Pachuca", "Tu Zona", "Mitoteo"

  @Prop({ required: true, trim: true, maxlength: 500 })
  description: string;

  // ========================================
  // 📱 REDES SOCIALES (GetLate.dev) - NÚCLEO DEL SCHEMA
  // ========================================

  @Prop({ type: Object, default: {} })
  socialMedia: {
    // Facebook Pages asignadas a este sitio
    facebookPages?: Array<{
      pageId: string; // ID de página en GetLate
      pageName: string;
      isActive: boolean;
      priority: number; // Orden de publicación (si hay varias)
    }>;

    // Twitter Accounts asignadas a este sitio
    twitterAccounts?: Array<{
      accountId: string; // ID de cuenta en GetLate
      username: string; // @noticiaspachuca
      displayName: string;
      isActive: boolean;
      priority: number;
    }>;

    // GetLate API Key (opcional - puede ser global en env vars)
    getLateApiKey?: string; // Encriptada si es por sitio
  };

  // ========================================
  // ⚙️ STATUS
  // ========================================

  @Prop({ default: true })
  isActive: boolean; // Sitio activo/inactivo

  @Prop({ default: false })
  isMainSite: boolean; // ¿Es el sitio principal?

  // ========================================
  // 📊 ESTADÍSTICAS (AUTO-GENERADAS)
  // ========================================

  @Prop({ default: 0 })
  totalNoticias: number;

  @Prop({ default: 0 })
  totalViews: number;

  @Prop({ default: 0 })
  totalSocialPosts: number;

  // ========================================
  // 🔧 METADATA
  // ========================================

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const SiteSchema = SchemaFactory.createForClass(Site);

// ========================================
// 📇 ÍNDICES
// ========================================

SiteSchema.index({ domain: 1 }, { unique: true });
SiteSchema.index({ slug: 1 }, { unique: true });
SiteSchema.index({ isActive: 1 });
```

---

### 3.2. Schema Nuevo: `TwitterPublishingConfig`

**Archivo**: `packages/api-nueva/src/generator-pro/schemas/twitter-publishing-config.schema.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TwitterPublishingConfigDocument = TwitterPublishingConfig & Document;

/**
 * 🐦 Schema para configuración de publicación automática en Twitter - Generator Pro
 * Gestiona la integración con GetLate.dev API para publicación automatizada en Twitter/X
 */
@Schema({ timestamps: true })
export class TwitterPublishingConfig {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Site' }) // 🔧 CAMBIO: Ref a Site, no NewsWebsiteConfig
  siteId: Types.ObjectId; // Referencia al sitio

  @Prop({ required: true, trim: true })
  name: string; // "Twitter Noticias Pachuca", "Twitter Tu Zona"

  @Prop({ required: true, trim: true })
  twitterAccountId: string; // ID de la cuenta de Twitter en GetLate

  @Prop({ required: true, trim: true })
  twitterUsername: string; // @noticiaspachuca

  @Prop({ required: true, trim: true })
  twitterDisplayName: string; // Nombre mostrado

  @Prop({ required: true, select: false })
  getLateApiKey: string; // API key de GetLate.dev (encriptada)

  @Prop({ required: true, type: Types.ObjectId, ref: 'PromptTemplate' })
  templateId: Types.ObjectId; // Template de Content-AI para generar contenido

  @Prop({ default: true })
  isActive: boolean;

  // ⏰ CONFIGURACIÓN DE FRECUENCIA DE PUBLICACIÓN
  @Prop({ default: 30 })
  publishingFrequency: number; // minutos

  @Prop({ default: 15 })
  maxTweetsPerDay: number; // Límite de tweets por día

  // 📝 CONFIGURACIÓN DE TEMPLATES PARA TWEETS
  @Prop({ type: String, default: '{{title}}\n\n{{link}}' })
  tweetTemplate: string; // Template para el tweet con variables

  @Prop({ type: String })
  fallbackTemplate?: string;

  // 🎯 CONFIGURACIÓN DE OPTIMIZACIÓN PARA TWITTER
  @Prop({ type: Object, default: {} })
  optimizationSettings: {
    useEmojis?: boolean; // Máximo 2 emojis
    useHashtags?: boolean; // Hashtags relevantes
    maxHashtags?: number; // Default: 2-3
    includeLink?: boolean; // Incluir link a noticia
    shortenUrls?: boolean; // Acortar URLs
    addThreads?: boolean; // Crear threads para contenido largo
    optimizeForEngagement?: boolean;
  };

  // 📱 CONFIGURACIÓN DE CONTENIDO MULTIMEDIA
  @Prop({ type: Object, default: {} })
  mediaSettings: {
    includeImages?: boolean;
    imageOptimization?: boolean;
    preferredImageRatio?: string; // "16:9", "1:1", "4:5"
    maxImages?: number; // Twitter: 1-4 imágenes
  };

  // ⚙️ CONFIGURACIÓN AVANZADA
  @Prop({ type: Object, default: {} })
  advancedSettings: {
    scheduleOptimalTimes?: boolean;
    optimalTimes?: string[]; // ["09:00", "13:00", "18:00"]
    skipWeekends?: boolean;
    skipHolidays?: boolean;
    contentFiltering?: {
      maxCharacters?: number; // Twitter: 280 (pero recomendamos 200-240)
      bannedKeywords?: string[];
      requiredKeywords?: string[];
    };
    duplicateDetection?: boolean;
    cooldownPeriod?: number; // minutos
  };

  // 📊 ESTADÍSTICAS Y CONTROL
  @Prop()
  lastPublishedAt?: Date;

  @Prop({ default: 0 })
  tweetsToday: number;

  @Prop()
  dailyReset?: Date;

  @Prop({ type: Object })
  connectionStatus?: {
    isConnected?: boolean;
    lastChecked?: Date;
    errorMessage?: string;
    accountInfo?: {
      username?: string;
      followers?: number;
      verified?: boolean;
      isBlueVerified?: boolean;
    };
  };

  // 📈 MÉTRICAS Y ESTADÍSTICAS
  @Prop({ type: Object, default: {} })
  statistics: {
    totalTweetsPublished?: number;
    successfulTweets?: number;
    failedTweets?: number;
    averageEngagement?: number; // Promedio de likes + retweets + replies
    bestPerformingTweet?: {
      tweetId?: string;
      engagement?: number;
      publishedAt?: Date;
    };
    lastEngagementSync?: Date;
  };

  @Prop({ trim: true })
  notes?: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const TwitterPublishingConfigSchema = SchemaFactory.createForClass(TwitterPublishingConfig);

// 🔍 ÍNDICES
TwitterPublishingConfigSchema.index({ siteId: 1 });
TwitterPublishingConfigSchema.index({ isActive: 1 });
TwitterPublishingConfigSchema.index({ twitterAccountId: 1 });
TwitterPublishingConfigSchema.index({ lastPublishedAt: -1 });
```

---

### 3.3. Schema Modificado: `PublishedNoticia`

```typescript
@Schema({ timestamps: true })
export class PublishedNoticia {
  // ========================================
  // 🌐 NUEVO: MULTI-SITIO
  // ========================================

  @Prop({ type: [Types.ObjectId], ref: 'Site', required: true, index: true })
  sites: Types.ObjectId[]; // Array de sitios donde está publicada

  // ========================================
  // 📱 NUEVO: TRACKING DE REDES SOCIALES
  // ========================================

  @Prop({ type: Object, default: {} })
  socialMediaPublishing: {
    facebook?: Array<{
      pageId: string;
      postId?: string; // ID del post en Facebook
      postUrl?: string;
      publishedAt?: Date;
      status: 'pending' | 'published' | 'failed';
      engagement?: {
        likes?: number;
        comments?: number;
        shares?: number;
      };
    }>;

    twitter?: Array<{
      accountId: string;
      tweetId?: string; // ID del tweet
      tweetUrl?: string;
      publishedAt?: Date;
      status: 'pending' | 'published' | 'failed';
      engagement?: {
        likes?: number;
        retweets?: number;
        replies?: number;
      };
    }>;
  };

  // ========================================
  // 🔗 RELACIONES (MODIFICADO)
  // ========================================

  @Prop({ required: true }) // ⚠️ YA NO UNIQUE global
  slug: string; // Slug puede repetirse entre sitios diferentes

  // ... resto de campos sin cambios ...
}

// ========================================
// 📇 ÍNDICES ACTUALIZADOS
// ========================================

PublishedNoticiaSchema.index({ slug: 1 }, { unique: false }); // Remover unique global
PublishedNoticiaSchema.index({ sites: 1, slug: 1 }, { unique: true }); // Único por sitio + slug

PublishedNoticiaSchema.index({ sites: 1, status: 1, publishedAt: -1 });
PublishedNoticiaSchema.index({ sites: 1, category: 1, publishedAt: -1 });
```

---

## 🔗 4. INTEGRACIÓN REDES SOCIALES CON MULTI-SITIO

### 4.1. Flujo de Publicación con Redes Sociales

```
1. Usuario selecciona noticia para publicar
2. Selecciona sitio(s) donde publicar (ej: noticiaspachuca.com, tuzona.noticiaspachuca.com)
3. Sistema verifica redes sociales asignadas a cada sitio:
   - noticiaspachuca.com → Facebook Page "Noticias Pachuca", Twitter "@noticiaspachuca"
   - tuzona.noticiaspachuca.com → Facebook Page "Tu Zona", Twitter "@tuzona"
4. Usuario puede elegir:
   - Publicar solo en sitio web
   - Publicar en sitio web + redes sociales automáticamente
   - Programar publicación en redes sociales
5. Sistema publica:
   - Noticia en PublishedNoticia con sites: [site1, site2]
   - Posts en Facebook via GetLate (si está habilitado)
   - Tweets en Twitter via GetLate (si está habilitado)
6. Tracking de publicación en socialMediaPublishing
```

### 4.2. Service: `SocialMediaPublishingService`

**Archivo**: `packages/api-nueva/src/generator-pro/services/social-media-publishing.service.ts`

```typescript
@Injectable()
export class SocialMediaPublishingService {
  constructor(
    @InjectModel(Site.name) private siteModel: Model<SiteDocument>,
    @InjectModel(FacebookPublishingConfig.name) private facebookConfigModel: Model<FacebookPublishingConfigDocument>,
    @InjectModel(TwitterPublishingConfig.name) private twitterConfigModel: Model<TwitterPublishingConfigDocument>,
    private facebookPublishingService: FacebookPublishingService,
    private twitterPublishingService: TwitterPublishingService, // 🔧 NUEVO
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Publica noticia en redes sociales de todos los sitios seleccionados
   */
  async publishToSocialMedia(
    noticia: PublishedNoticiaDocument,
    siteIds: Types.ObjectId[],
    options?: {
      platforms?: ('facebook' | 'twitter')[]; // Si no se especifica, publica en todas
      scheduled?: boolean;
      scheduledAt?: Date;
    }
  ): Promise<SocialMediaPublishingResult> {
    const results: SocialMediaPublishingResult = {
      facebook: [],
      twitter: [],
    };

    for (const siteId of siteIds) {
      const site = await this.siteModel.findById(siteId);
      if (!site || !site.isActive) continue;

      // Publicar en Facebook si tiene páginas asignadas
      if (!options?.platforms || options.platforms.includes('facebook')) {
        const facebookResults = await this.publishToFacebook(noticia, site);
        results.facebook.push(...facebookResults);
      }

      // Publicar en Twitter si tiene cuentas asignadas
      if (!options?.platforms || options.platforms.includes('twitter')) {
        const twitterResults = await this.publishToTwitter(noticia, site);
        results.twitter.push(...twitterResults);
      }
    }

    // Actualizar tracking en noticia
    await this.updateNoticiaWithSocialMediaTracking(noticia, results);

    // Emitir evento
    this.eventEmitter.emit('social-media.published', {
      noticiaId: noticia._id,
      siteIds,
      results,
      timestamp: new Date(),
    });

    return results;
  }

  /**
   * Publica en todas las páginas de Facebook del sitio
   */
  private async publishToFacebook(
    noticia: PublishedNoticiaDocument,
    site: SiteDocument
  ): Promise<FacebookPublishResult[]> {
    const results: FacebookPublishResult[] = [];
    const facebookPages = site.socialMedia?.facebookPages || [];

    for (const page of facebookPages) {
      if (!page.isActive) continue;

      try {
        // Obtener config de publicación
        const config = await this.facebookConfigModel.findById(page.publishingConfigId);
        if (!config || !config.isActive) continue;

        // Optimizar contenido para Facebook
        const optimizedContent = await this.facebookPublishingService.optimizeContentForFacebook(noticia);

        // Crear post
        const facebookPost = await this.createFacebookPost(noticia, config, optimizedContent);

        // Publicar
        const publishResult = await this.facebookPublishingService.publishPost(facebookPost);

        results.push({
          pageId: page.pageId,
          pageName: page.pageName,
          success: publishResult.success,
          postId: publishResult.facebookPostId,
          postUrl: publishResult.facebookPostUrl,
        });

      } catch (error) {
        results.push({
          pageId: page.pageId,
          pageName: page.pageName,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Publica en todas las cuentas de Twitter del sitio
   */
  private async publishToTwitter(
    noticia: PublishedNoticiaDocument,
    site: SiteDocument
  ): Promise<TwitterPublishResult[]> {
    const results: TwitterPublishResult[] = [];
    const twitterAccounts = site.socialMedia?.twitterAccounts || [];

    for (const account of twitterAccounts) {
      if (!account.isActive) continue;

      try {
        // Obtener config de publicación
        const config = await this.twitterConfigModel.findById(account.publishingConfigId);
        if (!config || !config.isActive) continue;

        // Optimizar contenido para Twitter (280 chars)
        const optimizedContent = await this.twitterPublishingService.optimizeContentForTwitter(noticia);

        // Crear tweet
        const tweet = await this.createTweet(noticia, config, optimizedContent);

        // Publicar via GetLate
        const publishResult = await this.twitterPublishingService.publishTweet(tweet);

        results.push({
          accountId: account.accountId,
          username: account.username,
          success: publishResult.success,
          tweetId: publishResult.tweetId,
          tweetUrl: publishResult.tweetUrl,
        });

      } catch (error) {
        results.push({
          accountId: account.accountId,
          username: account.username,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  private async updateNoticiaWithSocialMediaTracking(
    noticia: PublishedNoticiaDocument,
    results: SocialMediaPublishingResult
  ): Promise<void> {
    noticia.socialMediaPublishing = {
      facebook: results.facebook.map(r => ({
        pageId: r.pageId,
        postId: r.postId,
        postUrl: r.postUrl,
        publishedAt: r.success ? new Date() : undefined,
        status: r.success ? 'published' : 'failed',
      })),
      twitter: results.twitter.map(r => ({
        accountId: r.accountId,
        tweetId: r.tweetId,
        tweetUrl: r.tweetUrl,
        publishedAt: r.success ? new Date() : undefined,
        status: r.success ? 'published' : 'failed',
      })),
    };

    await noticia.save();
  }
}

interface SocialMediaPublishingResult {
  facebook: FacebookPublishResult[];
  twitter: TwitterPublishResult[];
}

interface FacebookPublishResult {
  pageId: string;
  pageName: string;
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

interface TwitterPublishResult {
  accountId: string;
  username: string;
  success: boolean;
  tweetId?: string;
  tweetUrl?: string;
  error?: string;
}
```

---

### 4.3. Service: `TwitterPublishingService`

**Archivo**: `packages/api-nueva/src/generator-pro/services/twitter-publishing.service.ts`

```typescript
@Injectable()
export class TwitterPublishingService {
  private readonly logger = new Logger(TwitterPublishingService.name);
  private readonly getLateBaseUrl = 'https://api.getlate.dev/v1';

  constructor(
    @InjectModel(TwitterPublishingConfig.name)
    private readonly twitterConfigModel: Model<TwitterPublishingConfigDocument>,
    @InjectModel(TwitterPost.name) // 🔧 NUEVO schema
    private readonly twitterPostModel: Model<TwitterPostDocument>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Publicar Tweet via GetLate API
   */
  async publishTweet(tweet: TwitterPostDocument): Promise<PublishResult> {
    try {
      const twitterConfig = await this.twitterConfigModel.findById(tweet.twitterConfigId);
      if (!twitterConfig) {
        throw new Error(`Twitter config ${tweet.twitterConfigId} not found`);
      }

      // Verificar límites diarios
      if (!twitterConfig.canPublishToday) {
        throw new Error('Daily tweet limit reached');
      }

      // Preparar datos para GetLate API
      const postData = {
        content: tweet.tweetContent,
        platforms: [{
          platform: 'twitter', // ✅ GetLate soporta Twitter
          accountId: twitterConfig.twitterAccountId,
        }],
        ...(tweet.mediaUrls.length > 0 && {
          mediaItems: tweet.mediaUrls.map(url => ({
            type: 'image',
            url: url,
          }))
        }),
        scheduledDate: tweet.scheduledAt.toISOString(),
      };

      // POST a GetLate API
      const response = await axios.post(
        `${this.getLateBaseUrl}/posts`,
        postData,
        {
          headers: {
            'Authorization': `Bearer ${twitterConfig.getLateApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const result = response.data;
      const twitterResult = result.platforms?.find((p: any) => p.platform === 'twitter');

      if (!twitterResult || twitterResult.status !== 'success') {
        throw new Error(twitterResult?.error || 'Failed to publish to Twitter');
      }

      // Actualizar tweet
      await tweet.markAsPublished(
        twitterResult.platformPostId,
        twitterResult.platformPostUrl
      );

      // Actualizar contador diario
      await this.updateDailyTweetCounter(twitterConfig._id as Types.ObjectId);

      this.eventEmitter.emit('generator-pro.twitter.published', {
        tweetId: tweet._id,
        twitterPostId: twitterResult.platformPostId,
        configId: twitterConfig._id,
        timestamp: new Date(),
      });

      return {
        success: true,
        tweetId: twitterResult.platformPostId,
        tweetUrl: twitterResult.platformPostUrl,
      };

    } catch (error) {
      this.logger.error(`Failed to publish tweet ${tweet._id}: ${error.message}`);

      await tweet.markAsFailed(error.message);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Optimizar contenido para Twitter
   * - Máximo 280 caracteres (recomendado 200-240)
   * - Máximo 2 emojis
   * - Hashtags relevantes (2-3)
   */
  async optimizeContentForTwitter(content: any): Promise<string> {
    try {
      const baseContent = content.generatedTitle || content.title;

      // Generar optimización
      const optimization = await this.optimizeForTwitter(baseContent);

      // Construir tweet (máximo 240 chars)
      const tweet = this.buildOptimizedTweet(
        optimization.optimizedContent,
        optimization.emojis,
        optimization.hashtags,
        240 // Max chars recomendado
      );

      return tweet;

    } catch (error) {
      this.logger.error(`Failed to optimize content: ${error.message}`);
      // Fallback
      return (content.generatedTitle || content.title).substring(0, 240);
    }
  }

  /**
   * Optimización completa para Twitter
   */
  async optimizeForTwitter(content: string): Promise<TwitterOptimization> {
    const [emojis, hashtags] = await Promise.all([
      this.generateEmojis(content),
      this.generateHashtags(content),
    ]);

    const optimizedContent = this.optimizeTextForTwitter(content);

    return {
      optimizedContent,
      emojis: emojis.slice(0, 2), // Máximo 2 emojis
      hashtags: hashtags.slice(0, 3), // Máximo 3 hashtags
    };
  }

  private buildOptimizedTweet(
    content: string,
    emojis: string[],
    hashtags: string[],
    maxLength: number
  ): string {
    const emojiString = emojis.length > 0 ? emojis.join(' ') + ' ' : '';
    const hashtagString = hashtags.length > 0 ? ' ' + hashtags.join(' ') : '';

    let tweet = `${emojiString}${content}${hashtagString}`;

    // Truncar si excede máximo
    if (tweet.length > maxLength) {
      const availableChars = maxLength - emojiString.length - hashtagString.length - 3; // -3 por "..."
      tweet = `${emojiString}${content.substring(0, availableChars)}...${hashtagString}`;
    }

    return tweet;
  }

  private optimizeTextForTwitter(content: string): string {
    // Optimizar para engagement en Twitter
    let optimized = content;

    // Limitar longitud óptima (200 chars para dejar espacio a hashtags/emojis)
    if (optimized.length > 200) {
      optimized = optimized.substring(0, 197) + '...';
    }

    return optimized;
  }

  async generateEmojis(content: string): Promise<string[]> {
    // Similar a FacebookPublishingService pero con máximo 2 emojis
    const emojis: string[] = [];

    const keywordEmojis: Record<string, string[]> = {
      política: ['🏛️', '🗳️'],
      deportes: ['⚽', '🏀'],
      economía: ['💰', '📈'],
      salud: ['🏥', '💉'],
      tecnología: ['💻', '📱'],
      cultura: ['🎭', '🎨'],
      // ... más categorías
    };

    for (const [categoria, emojisCategoria] of Object.entries(keywordEmojis)) {
      if (this.contentContainsKeywords(content, categoria)) {
        emojis.push(emojisCategoria[0]); // Solo 1 emoji por categoría
        if (emojis.length >= 2) break; // Máximo 2
      }
    }

    if (emojis.length === 0) {
      emojis.push('📰'); // Emoji por defecto
    }

    return emojis;
  }

  async generateHashtags(content: string): Promise<string[]> {
    // Generar hashtags relevantes (2-3 para Twitter)
    const hashtags: string[] = [];

    const categoryHashtags: Record<string, string[]> = {
      noticias: ['#Noticias', '#México'],
      política: ['#Política', '#Gobierno'],
      deportes: ['#Deportes', '#LigaMX'],
      // ... más categorías
    };

    // Detectar categoría y agregar hashtags base
    for (const [categoria, tags] of Object.entries(categoryHashtags)) {
      if (this.contentContainsKeywords(content, categoria)) {
        hashtags.push(...tags.slice(0, 2)); // Máximo 2 por categoría
        break;
      }
    }

    // Si no hay hashtags, usar genéricos
    if (hashtags.length === 0) {
      hashtags.push('#Noticias', '#México');
    }

    return hashtags.slice(0, 3); // Máximo 3 total
  }

  private contentContainsKeywords(content: string, category: string): boolean {
    const keywords: Record<string, string[]> = {
      política: ['gobierno', 'presidente', 'elecciones'],
      deportes: ['fútbol', 'liga', 'partido'],
      economía: ['peso', 'dólar', 'bolsa'],
      // ... más
    };

    const categoryKeywords = keywords[category] || [];
    const contentLower = content.toLowerCase();

    return categoryKeywords.some(keyword => contentLower.includes(keyword));
  }

  private async updateDailyTweetCounter(twitterConfigId: Types.ObjectId): Promise<void> {
    const config = await this.twitterConfigModel.findById(twitterConfigId);
    if (config) {
      await config.resetDailyCounter(); // Método del schema
      config.tweetsToday += 1;
      config.lastPublishedAt = new Date();
      await config.save();
    }
  }
}

interface TwitterOptimization {
  optimizedContent: string;
  emojis: string[];
  hashtags: string[];
}

interface PublishResult {
  success: boolean;
  tweetId?: string;
  tweetUrl?: string;
  error?: string;
}
```

---

### 4.4. Schema: `TwitterPost`

**Archivo**: `packages/api-nueva/src/generator-pro/schemas/twitter-post.schema.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TwitterPostDocument = TwitterPost & Document;

/**
 * 🐦 Schema para tweets publicados - Generator Pro
 * Similar a FacebookPost pero optimizado para Twitter/X
 */
@Schema({ timestamps: true })
export class TwitterPost {
  @Prop({ required: true, type: Types.ObjectId, ref: 'PublishedNoticia' })
  publishedNoticiaId: Types.ObjectId; // Referencia a la noticia publicada

  @Prop({ required: true, type: Types.ObjectId, ref: 'Site' })
  siteId: Types.ObjectId; // Referencia al sitio

  @Prop({ required: true, type: Types.ObjectId, ref: 'TwitterPublishingConfig' })
  twitterConfigId: Types.ObjectId;

  @Prop({ type: String })
  twitterPostId?: string; // ID del tweet en Twitter

  @Prop({ type: String })
  getLatePostId?: string; // ID en GetLate.dev

  // 📝 CONTENIDO DEL TWEET
  @Prop({ required: true, trim: true, maxlength: 280 })
  tweetContent: string; // Tweet final (max 280 chars)

  @Prop({ type: String })
  originalTitle?: string;

  @Prop({ type: Array, default: [] })
  mediaUrls: string[];

  @Prop({ type: Array, default: [] })
  emojis: string[]; // Máximo 2

  @Prop({ type: Array, default: [] })
  hashtags: string[]; // Máximo 3

  // ⏰ PROGRAMACIÓN
  @Prop({ required: true })
  scheduledAt: Date;

  @Prop()
  publishedAt?: Date;

  // 📊 ESTADO
  @Prop({
    required: true,
    enum: ['draft', 'scheduled', 'publishing', 'published', 'failed'],
    default: 'scheduled'
  })
  status: string;

  @Prop({ type: String })
  failureReason?: string;

  // 📈 ENGAGEMENT
  @Prop({ type: Object })
  engagement?: {
    likes?: number;
    retweets?: number;
    replies?: number;
    impressions?: number;
    lastUpdated?: Date;
  };

  // 🔗 ENLACES
  @Prop({ type: String })
  twitterPostUrl?: string; // URL del tweet

  @Prop({ type: String })
  getLatePostUrl?: string;

  @Prop({ type: String })
  originalSourceUrl?: string; // URL de la noticia

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const TwitterPostSchema = SchemaFactory.createForClass(TwitterPost);

// Índices
TwitterPostSchema.index({ twitterPostId: 1 });
TwitterPostSchema.index({ status: 1, scheduledAt: 1 });
TwitterPostSchema.index({ siteId: 1, publishedAt: -1 });
TwitterPostSchema.index({ twitterConfigId: 1, status: 1 });

// Métodos
TwitterPostSchema.methods.markAsPublished = function (twitterPostId: string, twitterPostUrl?: string) {
  this.status = 'published';
  this.publishedAt = new Date();
  this.twitterPostId = twitterPostId;
  if (twitterPostUrl) {
    this.twitterPostUrl = twitterPostUrl;
  }
  return this.save();
};

TwitterPostSchema.methods.markAsFailed = function (reason: string) {
  this.status = 'failed';
  this.failureReason = reason;
  return this.save();
};
```

---

## 🛠️ 5. PATRONES DE IMPLEMENTACIÓN BACKEND

### 5.1. Patrones del Backend (NestJS)

#### ✅ **Patrón 1: EventEmitter2 para Dependencias Circulares**

**NUNCA usar `forwardRef()`**. Usar `EventEmitter2` para comunicación entre módulos.

```typescript
// PublishService emite eventos
this.eventEmitter.emit('noticia.published', {
  noticiaId: publishedNoticia._id,
  slug: publishedNoticia.slug,
  siteIds,
});

// SocialMediaPublishingService escucha eventos
this.eventEmitter.on('noticia.published', async (payload) => {
  await this.publishToSocialMedia(payload.noticiaId, payload.siteIds);
});
```

#### ✅ **Patrón 2: Decorators + Interceptors**

```typescript
// Decorator extrae sitio del request
export const Site = createParamDecorator((data, ctx) => {
  const request = ctx.switchToHttp().getRequest();
  return request.siteInfo;
});

// Interceptor detecta y agrega al request
@Injectable()
export class SiteInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    request.siteInfo = await this.siteDetectionService.detectSite(request);
    return next.handle();
  }
}
```

#### ✅ **Patrón 3: Tipado Estricto (No `any`)**

```typescript
// ❌ MAL
async getNoticia(slug: string): Promise<any> {
  return this.model.findOne({ slug });
}

// ✅ BIEN
async getNoticia(slug: string): Promise<PublishedNoticiaDocument | null> {
  return this.model.findOne({ slug });
}
```

---

## 📱 6. PATRONES DE IMPLEMENTACIÓN FRONTEND (mobile-expo)

### 6.1. Arquitectura de API Calls

#### **Capa 1: ApiClient (Singleton)**
**Archivo**: `packages/mobile-expo/src/services/api/ApiClient.ts`

```typescript
// Singleton de Axios con auto-refresh de tokens
export const ApiClient = new ApiClientImpl()

// Configuración automática:
- baseURL: ENV.API_BASE_URL
- Headers automáticos:
  - 'x-platform': 'mobile'
  - 'x-app-version': '1.0.0'
  - 'Authorization': `Bearer ${token}` (auto-inyectado)
  - 'x-device-id': ${deviceId} (auto-inyectado)

// Interceptors:
- Request: Agrega token + device ID automáticamente
- Response: Auto-refresh en 401, manejo de errores
```

**Métodos disponibles**:
```typescript
ApiClient.get<T>(url, config)      // GET con tipo genérico
ApiClient.post<T>(url, data)       // POST
ApiClient.put<T>(url, data)        // PUT
ApiClient.patch<T>(url, data)      // PATCH
ApiClient.delete<T>(url)           // DELETE
ApiClient.getRawClient()           // Acceso directo a instancia Axios
```

---

#### **Capa 2: API Service (contentAgentsApi.ts)**
**Archivo**: `packages/mobile-expo/src/services/content-agents/contentAgentsApi.ts`

**Patrón**: Objeto con métodos async que usan ApiClient

```typescript
export const contentAgentsApi = {
  /**
   * GET /generator-pro/agents?agentType=reportero&isActive=true
   */
  getAgents: async (filters?: AgentFilters): Promise<ContentAgent[]> => {
    const rawClient = ApiClient.getRawClient();

    // Construir query params manualmente
    const params = new URLSearchParams();
    if (filters?.agentType) params.append('agentType', filters.agentType);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));

    const queryString = params.toString();
    const url = queryString ? `/generator-pro/agents?${queryString}` : '/generator-pro/agents';

    const response = await rawClient.get<ContentAgentListResponse>(url);
    const agents = response.data.agents || [];

    // Mapear snake_case (API) → camelCase (App)
    return agents.map((apiAgent) => ContentAgentMapper.toApp(apiAgent));
  },

  /**
   * POST /generator-pro/agents
   */
  createAgent: async (data: CreateContentAgentRequest): Promise<ContentAgent> => {
    const rawClient = ApiClient.getRawClient();
    const response = await rawClient.post<ContentAgentResponse>('/generator-pro/agents', data);
    return ContentAgentMapper.toApp(response.data.agent);
  },

  // PUT, DELETE similar...
}
```

---

#### **Capa 3: Mappers (ContentAgentMapper)**
**Archivo**: `packages/mobile-expo/src/utils/mappers.ts`

**Patrón**: Clase estática con `toApp()` y `toAPI()`

```typescript
export class ContentAgentMapper {
  /**
   * API (snake_case) → App (camelCase)
   */
  static toApp(apiAgent: Record<string, unknown>): ContentAgent {
    return {
      id: apiAgent.id as string,
      name: apiAgent.name as string,
      agentType: apiAgent.agentType as 'reportero' | 'columnista',
      isActive: apiAgent.isActive as boolean,
      createdAt: apiAgent.createdAt as string,
      updatedAt: apiAgent.updatedAt as string,
      // ... más campos
    }
  }

  /**
   * App (camelCase) → API (snake_case)
   */
  static toAPI(appAgent: ContentAgent): Record<string, unknown> {
    return {
      id: appAgent.id,
      name: appAgent.name,
      agent_type: appAgent.agentType, // camelCase → snake_case
      is_active: appAgent.isActive,
      // ... más campos
    }
  }
}
```

**Ejemplo de uso**:
```typescript
// De API a App
const apiResponse = await axios.get('/agents')
const agent = ContentAgentMapper.toApp(apiResponse.data)

// De App a API
const payload = ContentAgentMapper.toAPI(agentFormData)
await axios.post('/agents', payload)
```

---

#### **Capa 4: Hooks con TanStack Query (useContentAgents.ts)**
**Archivo**: `packages/mobile-expo/src/hooks/useContentAgents.ts`

**Patrón**: Hooks que envuelven API calls con TanStack Query

```typescript
// Query Keys (para cache y invalidación)
export const contentAgentsKeys = {
  all: ['content-agents'] as const,
  lists: () => [...contentAgentsKeys.all, 'list'] as const,
  list: (filters?: AgentFilters) => [...contentAgentsKeys.lists(), filters] as const,
  details: () => [...contentAgentsKeys.all, 'detail'] as const,
  detail: (id: string) => [...contentAgentsKeys.details(), id] as const
}

/**
 * GET - Hook de lectura
 */
export function useContentAgents(filters?: AgentFilters) {
  return useQuery({
    queryKey: contentAgentsKeys.list(filters),
    queryFn: () => contentAgentsApi.getAgents(filters),
    staleTime: 5 * 60 * 1000,  // 5 minutos (los agentes cambian poco)
    gcTime: 10 * 60 * 1000      // 10 minutos
  });
}

/**
 * POST - Hook de mutación
 */
export function useCreateContentAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateContentAgentRequest) => contentAgentsApi.createAgent(data),
    onSuccess: () => {
      // Invalidar cache para refrescar listas
      queryClient.invalidateQueries({ queryKey: contentAgentsKeys.all });
    }
  });
}
```

**Uso en componentes**:
```typescript
function AgentsScreen() {
  // GET - Auto-fetching con cache
  const { data: agents, isLoading } = useContentAgents({ isActive: true });

  // POST - Mutation con loading states
  const createMutation = useCreateContentAgent();

  const handleCreate = async (data) => {
    await createMutation.mutateAsync(data);
    // Cache se invalida automáticamente en onSuccess
  };

  return (
    <View>
      {isLoading && <Spinner />}
      {agents?.map(agent => <AgentCard key={agent.id} agent={agent} />)}
    </View>
  );
}
```

---

### 6.2. Patrón de UI en Home Screen

**Archivo**: `packages/mobile-expo/app/(protected)/(tabs)/home.tsx`

#### **Estructura actual**:
```typescript
export default function HomeScreen() {
  const { user } = useAuth();
  const { isTablet } = useResponsive();
  const router = useRouter();

  // Obtener datos con hooks
  const { data: agents, isLoading: isLoadingAgents } = useContentAgents({ isActive: true });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header con bienvenida */}
        <View style={styles.header}>
          <ThemedText variant="title-large">Inicio</ThemedText>
          <ThemedText variant="body-medium" color="secondary">
            Bienvenido, {user?.username}
          </ThemedText>
        </View>

        {/* Sección de Agentes Disponibles */}
        <Card style={styles.agentsSection}>
          <CardHeader>
            <View style={styles.sectionHeader}>
              <CardTitle>Agentes Disponibles</CardTitle>
              <Pressable onPress={() => router.push('/agents/create')}>
                <ThemedText>+</ThemedText>
              </Pressable>
            </View>
          </CardHeader>
          <CardContent>
            {isLoadingAgents ? (
              <ActivityIndicator />
            ) : (
              <FlatList
                horizontal
                data={agents?.slice(0, 5)}
                renderItem={({ item }) => (
                  <AgentItem agent={item} onPress={() => router.push(`/agents/${item.id}/edit`)} />
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* 🔧 AQUÍ AGREGAREMOS: Sección de Sitios Disponibles */}
        {/* 🔧 AQUÍ AGREGAREMOS: Cards con Stats */}
      </ScrollView>
    </SafeAreaView>
  );
}
```

#### **Patrón a replicar para Sitios**:

```typescript
// Hook similar a useContentAgents
const { data: sites, isLoading: isLoadingSites } = useSites({ isActive: true });

// Card Section similar
<Card style={styles.sitesSection}>
  <CardHeader>
    <View style={styles.sectionHeader}>
      <CardTitle>Sitios Disponibles</CardTitle>
      <Pressable onPress={() => router.push('/sites/create')}>
        <ThemedText style={styles.addButton}>+</ThemedText>
      </Pressable>
    </View>
  </CardHeader>
  <CardContent>
    <FlatList
      horizontal
      data={sites?.slice(0, 5)}
      renderItem={({ item }) => (
        <SiteItem
          site={item}
          onPress={() => router.push(`/sites/${item.id}/edit`)}
        />
      )}
    />
  </CardContent>
</Card>
```

#### **Stats Cards a agregar en Home**:

```typescript
// Hooks para stats
const { data: statsAgents } = useStatsAgents();
const { data: statsSites } = useStatsSites();
const { data: statsNoticias } = useStatsNoticias();
const { data: statsOutlets } = useStatsOutlets(); // NewsWebsiteConfig

// UI de Stats Cards
<View style={styles.statsGrid}>
  <StatsCard
    icon="🤖"
    title="Agentes"
    value={statsAgents?.total || 0}
    subtitle={`${statsAgents?.active || 0} activos`}
  />
  <StatsCard
    icon="🌐"
    title="Sitios"
    value={statsSites?.total || 0}
    subtitle={`${statsSites?.published || 0} publicados`}
  />
  <StatsCard
    icon="📰"
    title="Noticias"
    value={statsNoticias?.total || 0}
    subtitle={`${statsNoticias?.today || 0} hoy`}
  />
  <StatsCard
    icon="📊"
    title="Outlets" // NewsWebsiteConfig
    value={statsOutlets?.total || 0}
    subtitle={`${statsOutlets?.active || 0} activos`}
  />
</View>
```

---

### 6.3. Flujo completo de implementación para Sites

#### **Paso 1: Crear types**
```typescript
// packages/mobile-expo/src/types/site.types.ts
export interface Site {
  id: string;
  domain: string;
  name: string;
  description: string;
  primaryColor: string;
  logoUrl?: string;
  isActive: boolean;
  socialMedia?: {
    facebookPages?: Array<{ pageId: string; pageName: string }>;
    twitterAccounts?: Array<{ accountId: string; username: string }>;
  };
  totalNoticias: number;
  createdAt: string;
  updatedAt: string;
}
```

#### **Paso 2: Crear Mapper**
```typescript
// packages/mobile-expo/src/utils/mappers.ts
export class SiteMapper {
  static toApp(apiSite: Record<string, unknown>): Site {
    return {
      id: apiSite.id as string,
      domain: apiSite.domain as string,
      name: apiSite.name as string,
      primaryColor: apiSite.primaryColor as string || apiSite.primary_color as string,
      isActive: apiSite.isActive as boolean ?? apiSite.is_active as boolean,
      // ... más campos
    };
  }
}
```

#### **Paso 3: Crear API Service**
```typescript
// packages/mobile-expo/src/services/sites/sitesApi.ts
export const sitesApi = {
  getSites: async (filters?: SiteFilters): Promise<Site[]> => {
    const rawClient = ApiClient.getRawClient();
    const response = await rawClient.get<SiteListResponse>('/pachuca-noticias/sites');
    return response.data.sites.map(site => SiteMapper.toApp(site));
  },

  createSite: async (data: CreateSiteRequest): Promise<Site> => {
    const rawClient = ApiClient.getRawClient();
    const response = await rawClient.post<SiteResponse>('/pachuca-noticias/sites', data);
    return SiteMapper.toApp(response.data.site);
  }
}
```

#### **Paso 4: Crear Hooks**
```typescript
// packages/mobile-expo/src/hooks/useSites.ts
export const sitesKeys = {
  all: ['sites'] as const,
  lists: () => [...sitesKeys.all, 'list'] as const,
  list: (filters?: SiteFilters) => [...sitesKeys.lists(), filters] as const
}

export function useSites(filters?: SiteFilters) {
  return useQuery({
    queryKey: sitesKeys.list(filters),
    queryFn: () => sitesApi.getSites(filters),
    staleTime: 5 * 60 * 1000
  });
}
```

#### **Paso 5: UI en Home**
```typescript
// app/(protected)/(tabs)/home.tsx
const { data: sites } = useSites({ isActive: true });

<Card>
  <CardHeader>
    <CardTitle>Sitios Disponibles</CardTitle>
  </CardHeader>
  <CardContent>
    <FlatList horizontal data={sites} ... />
  </CardContent>
</Card>
```

---

## 📋 7. FASES DE IMPLEMENTACIÓN

### FASE 0: Preparación y Migraciones

**Objetivo**: Preparar base de datos y schemas sin afectar funcionalidad actual

#### Tareas:

- [ ] **0.1**: Crear `Site` schema en `packages/api-nueva/src/pachuca-noticias/schemas/site.schema.ts`
  - Incluir todos los campos de identificación, branding, CDN, SEO
  - **Incluir campo `socialMedia`** con arrays de Facebook pages y Twitter accounts
  - Agregar índices únicos para `domain` y `slug`

- [ ] **0.2**: Crear seed de sitio principal
  - Archivo: `packages/api-nueva/src/pachuca-noticias/seeds/sites.seed.ts`
  - Insertar registro de "Noticias Pachuca" como sitio principal
  - Ejecutar seed: `npm run seed:sites`

- [ ] **0.3**: Modificar `PublishedNoticia` schema
  - Agregar campo `sites: Types.ObjectId[]` (default: `[]` temporalmente)
  - **Agregar campo `socialMediaPublishing`** para tracking de posts en redes
  - **NO REMOVER** `unique: true` del slug todavía
  - Build del backend: `npm run build`

- [ ] **0.4**: Modificar `Category` schema
  - Agregar campo `sites: Types.ObjectId[]` (default: `[]`)
  - Build: `npm run build`

- [ ] **0.5**: Script de migración de datos existentes
  - Archivo: `packages/api-nueva/src/scripts/migrate-to-multitenant.ts`
  - Asignar todas las noticias existentes al sitio principal
  - Ejecutar: `npm run migrate:multitenant`

- [ ] **0.6**: Validación post-migración
  - Verificar que todas las queries actuales siguen funcionando
  - Verificar que el frontend sigue cargando noticias
  - **NO PASAR A FASE 1** hasta validar

---

### FASE 1: Core Multi-Sitio (Backend)

**Objetivo**: Implementar sistema de detección de sitios y servicios base

#### Tareas:

- [ ] **1.1**: Crear `SiteDetectionService`
  - Archivo: `packages/api-nueva/src/pachuca-noticias/services/site-detection.service.ts`
  - Implementar `detectSite(request)` con lectura de `x-site-domain` header
  - Implementar cache en memoria (5 min TTL)
  - Implementar `getSiteByDomain()`, `getMainSite()`

- [ ] **1.2**: Crear `@Site()` decorator
  - Archivo: `packages/api-nueva/src/pachuca-noticias/decorators/site.decorator.ts`
  - Extraer `siteInfo` del request

- [ ] **1.3**: Crear `SiteInterceptor`
  - Archivo: `packages/api-nueva/src/pachuca-noticias/interceptors/site.interceptor.ts`
  - Detectar sitio y agregar `request.siteInfo`

- [ ] **1.4**: Agregar providers al `PachucaNoticiasModule`
  - Importar `SiteSchema`
  - Agregar `SiteDetectionService` y `SiteInterceptor`
  - Build: `npm run build`

---

### FASE 2: Controllers y Endpoints Públicos

#### Tareas:

- [ ] **2.1**: Aplicar `SiteInterceptor` a `PublicContentController`
  - Agregar `@UseInterceptors(SiteInterceptor)`

- [ ] **2.2**: Modificar endpoints para usar `@Site() site: SiteInfo`
  - `getCategories`
  - `getNoticiasByCategory`
  - `searchNoticias`
  - `getNoticiasByTag`
  - `getNoticiasByAuthor`

---

### FASE 3: Services - Filtrado por Sitio

#### Tareas:

- [ ] **3.1**: Modificar `PublicContentService.getCategories()`
  - Agregar parámetro `siteId: string`
  - Filtrar: `$or: [{ sites: siteId }, { sites: { $size: 0 } }]`

- [ ] **3.2**: Modificar `PublicContentService.getNoticiasByCategory()`
  - Agregar filtro `sites: siteId`

- [ ] **3.3-3.6**: Modificar otros métodos de `PublicContentService`
  - Agregar filtro `siteId` a todas las queries de noticias

---

### FASE 4: Publicación Multi-Sitio

#### Tareas:

- [ ] **4.1**: Actualizar `PublishNoticiaDto`
  - Cambiar `siteId` → `siteIds: string[]`
  - Agregar validación `@IsArray()` y `@IsMongoId({ each: true })`

- [ ] **4.2**: Modificar `SlugGeneratorService.generateUniqueSlugForSites()`
  - Agregar parámetro `siteIds: string[]`
  - Verificar unicidad: `slug, sites: { $in: siteIds }`

- [ ] **4.3**: Modificar `PublishService.publishNoticia()`
  - Validar que todos los `siteIds` existen y están activos
  - Asignar `sites: siteIds` al crear noticia
  - Actualizar contadores de sitios
  - Invalidar cache para CADA sitio

---

### FASE 5: Índices y Migraciones Finales

#### Tareas:

- [ ] **5.1**: Modificar índices de `PublishedNoticia`
  - REMOVER: `{ slug: 1 }, { unique: true }`
  - AGREGAR: `{ sites: 1, slug: 1 }, { unique: true }`
  - AGREGAR: `{ sites: 1, status: 1, publishedAt: -1 }`

- [ ] **5.2**: Modificar índices de `Category`
  - REMOVER unique de slug
  - AGREGAR: `{ sites: 1, slug: 1 }, { unique: true }`

- [ ] **5.3**: Script para recrear índices en MongoDB
  - Archivo: `packages/api-nueva/src/scripts/recreate-indexes.ts`
  - Drop índices viejos, crear nuevos

---

### FASE 6: Frontend (public-noticias)

#### Tareas:

- [ ] **6.1**: Agregar `VITE_SITE_DOMAIN` a `.env.local`

- [ ] **6.2**: Crear helper `getSiteDomain()`
  - Archivo: `packages/public-noticias/src/utils/getSiteDomain.ts`
  - Detectar dominio en dev (env) y producción (window.location.host)

- [ ] **6.3-6.11**: Actualizar server functions para enviar header
  - `getNoticiaBySlug.ts`
  - `getNoticias.ts`
  - `getCategories.ts`
  - `searchNoticias.ts`
  - Todas agregar: `'x-site-domain': getSiteDomain()`

---

### FASE 7: Backend - API de Sites

**Objetivo**: Crear endpoints del backend para gestión de Sites

#### Tareas:

- [ ] **7.1**: Crear controller de Sites
  - Archivo: `packages/api-nueva/src/pachuca-noticias/controllers/sites.controller.ts`
  - Endpoints:
    - `GET /pachuca-noticias/sites` - Lista de sitios (con filtros)
    - `GET /pachuca-noticias/sites/:id` - Obtener sitio por ID
    - `POST /pachuca-noticias/sites` - Crear nuevo sitio
    - `PATCH /pachuca-noticias/sites/:id` - Actualizar sitio
    - `DELETE /pachuca-noticias/sites/:id` - Eliminar sitio
    - `GET /pachuca-noticias/sites/stats` - Estadísticas generales

- [ ] **7.2**: Crear DTOs SIMPLIFICADOS para Sites
  - Archivo: `packages/api-nueva/src/pachuca-noticias/dto/site.dto.ts`
  - **`CreateSiteDto`** - SOLO campos esenciales:
    - `domain` (required, @IsUrl())
    - `name` (required, @IsString())
    - `description` (required, @IsString(), @MaxLength(500))
    - `isMainSite` (optional, @IsBoolean())
    - **NO incluir**: CDN, SEO, branding, features
    - **socialMedia se agrega en FASE 13**
  - **`UpdateSiteDto`** - Todos opcionales con @IsOptional()
  - **`QuerySitesDto`** - Filtros (isActive, search, page, limit)
  - **`SiteResponseDto`** - Response con datos de sitio

- [ ] **7.3**: Crear SitesService
  - Archivo: `packages/api-nueva/src/pachuca-noticias/services/sites.service.ts`
  - CRUD completo:
    - `findAll(filters)` - Con paginación
    - `findOne(id)` - Con validación
    - `create(data)` - Con validación de dominio único
    - `update(id, data)` - Con validación
    - `delete(id)` - Soft delete (marcar como inactivo)
    - `getStats()` - Estadísticas de todos los sitios

- [ ] **7.4**: Agregar providers al módulo
  - En `PachucaNoticiasModule`:
    - Importar `SiteSchema`
    - Agregar `SitesService` a providers
    - Agregar `SitesController` a controllers
  - Build: `npm run build`

- [ ] **7.5**: Crear endpoint de estadísticas
  - `GET /pachuca-noticias/stats` - Stats generales
  - Retornar:
    - `totalAgents`, `activeAgents` (desde Generator Pro)
    - `totalSites`, `activeSites` (desde Sites)
    - `totalNoticias`, `noticiasToday` (desde PublishedNoticia)
    - `totalOutlets`, `activeOutlets` (desde NewsWebsiteConfig)

---

### FASE 8: Mobile App - UI de Sites en Home

**Objetivo**: Implementar UI de Sites en mobile-expo siguiendo patrón de Agentes

#### Tareas:

- [ ] **8.1**: Crear types SIMPLIFICADOS para Sites
  - Archivo: `packages/mobile-expo/src/types/site.types.ts`
  - **`Site` interface** - SOLO campos esenciales:
    - `id`, `domain`, `slug`, `name`, `description`
    - `isActive`, `isMainSite`
    - `socialMedia?` (opcional, se agrega en FASE 13)
    - `totalNoticias`, `totalViews`, `totalSocialPosts` (stats)
    - `createdAt`, `updatedAt`
    - **NO incluir**: CDN, SEO, branding (primaryColor, secondaryColor, logoUrl), features
  - **`SiteFilters`** (isActive, search, page, limit)
  - **`CreateSitePayload`**, **`UpdateSitePayload`**

- [ ] **8.2**: Crear Mapper de Sites
  - Archivo: `packages/mobile-expo/src/utils/mappers.ts` (agregar)
  - `SiteMapper.toApp(apiSite)` - snake_case → camelCase
  - `SiteMapper.toAPI(appSite)` - camelCase → snake_case

- [ ] **8.3**: Crear API Service de Sites
  - Archivo: `packages/mobile-expo/src/services/sites/sitesApi.ts`
  - `sitesApi.getSites(filters)` - GET lista
  - `sitesApi.getSiteById(id)` - GET by ID
  - `sitesApi.createSite(data)` - POST
  - `sitesApi.updateSite(id, data)` - PUT
  - `sitesApi.deleteSite(id)` - DELETE
  - Usar `ApiClient.getRawClient()` y `SiteMapper`

- [ ] **8.4**: Crear Hooks de Sites
  - Archivo: `packages/mobile-expo/src/hooks/useSites.ts`
  - `sitesKeys` - Query keys para cache
  - `useSites(filters)` - useQuery para lista
  - `useSiteById(id)` - useQuery para detalle
  - `useCreateSite()` - useMutation para crear
  - `useUpdateSite()` - useMutation para actualizar
  - `useDeleteSite()` - useMutation para eliminar

- [ ] **8.5**: Crear hooks de Stats
  - Archivo: `packages/mobile-expo/src/hooks/useStats.ts`
  - `useStatsAgents()` - Stats de agentes
  - `useStatsSites()` - Stats de sitios
  - `useStatsNoticias()` - Stats de noticias
  - `useStatsOutlets()` - Stats de outlets (NewsWebsiteConfig)

- [ ] **8.6**: Crear componente StatsCard
  - Archivo: `packages/mobile-expo/src/components/stats/StatsCard.tsx`
  - Props: `icon`, `title`, `value`, `subtitle`
  - UI similar a Cards de shadcn/ui
  - Variantes: default, primary, secondary

- [ ] **8.7**: Agregar sección de Stats en Home
  - En `app/(protected)/(tabs)/home.tsx`:
  - Agregar grid de 4 StatsCards antes de secciones
  - Layout responsive (2 cols en mobile, 4 cols en tablet)
  - Cards: Agentes 🤖, Sitios 🌐, Noticias 📰, Outlets 📊

- [ ] **8.8**: Agregar sección de Sitios Disponibles en Home
  - En `app/(protected)/(tabs)/home.tsx`:
  - Similar a "Agentes Disponibles"
  - Card con header "Sitios Disponibles" + botón "+"
  - FlatList horizontal con primeros 5 sitios
  - Item muestra: domain, name, badge si es main site
  - onPress navega a `/sites/${id}/edit`

- [ ] **8.9**: Crear pantalla SIMPLIFICADA de crear Site
  - Archivo: `app/(protected)/sites/create.tsx`
  - **Formulario con SOLO 1 sección** (Card "Información Básica"):
    - `domain` (Input con validación de URL)
    - `name` (Input)
    - `description` (Textarea, max 500 chars)
    - `isMainSite` (Switch, default false)
    - `isActive` (Switch, default true)
  - **Total: 5 campos** (vs 20+ campos en propuesta original)
  - Validación client-side básica
  - Usar `useCreateSite` mutation
  - **NO incluir**: Colors, Logo, SEO, CDN, Features

- [ ] **8.10**: Crear pantalla SIMPLIFICADA de editar Site
  - Archivo: `app/(protected)/sites/[id]/edit.tsx`
  - Mismos campos que crear (pre-cargados)
  - **Sección de Redes Sociales se agrega en FASE 13**
  - Botón de "Eliminar sitio" con confirmación
  - Usar `useUpdateSite` mutation

- [ ] **8.11**: Exportar hooks en index
  - En `packages/mobile-expo/src/hooks/index.ts`:
  - Agregar exports:
    - `export { useSites, useSiteById, useCreateSite, useUpdateSite } from './useSites'`
    - `export { useStatsAgents, useStatsSites, useStatsNoticias, useStatsOutlets } from './useStats'`

---

### FASE 9: Redes Sociales - Schemas Twitter

**Objetivo**: Crear schemas para publicación en Twitter

#### Tareas:

- [ ] **9.1**: Crear `TwitterPublishingConfig` schema
  - Archivo: `packages/api-nueva/src/generator-pro/schemas/twitter-publishing-config.schema.ts`
  - Similar a `FacebookPublishingConfig` pero para Twitter
  - **IMPORTANTE**: `siteId` debe referenciar `Site`, NO `NewsWebsiteConfig`
  - Campos: `siteId` (ref: 'Site'), `twitterAccountId`, `twitterUsername`, `getLateApiKey`
  - Configuración: `publishingFrequency`, `maxTweetsPerDay`
  - Templates y optimización para Twitter (280 chars)

- [ ] **9.2**: Crear `TwitterPost` schema
  - Archivo: `packages/api-nueva/src/generator-pro/schemas/twitter-post.schema.ts`
  - Campos: `publishedNoticiaId`, `siteId`, `twitterConfigId`
  - Contenido: `tweetContent` (max 280 chars), `emojis` (max 2), `hashtags` (max 3)
  - Engagement: `likes`, `retweets`, `replies`

- [ ] **9.3**: Build y validación
  - `npm run build`
  - Verificar que no hay errores TypeScript

---

### FASE 10: Redes Sociales - Services Twitter

**Objetivo**: Implementar servicios de publicación en Twitter

#### Tareas:

- [ ] **10.0**: Actualizar `FacebookPublishingConfig` schema existente
  - Archivo: `packages/api-nueva/src/generator-pro/schemas/facebook-publishing-config.schema.ts`
  - **CAMBIO CRÍTICO**: Reemplazar `websiteConfigId` (ref: 'NewsWebsiteConfig') → `siteId` (ref: 'Site')
  - Actualizar relación: Facebook configs ahora se asocian a Sites, no a NewsWebsiteConfig
  - Build: `npm run build`

- [ ] **10.1**: Crear `TwitterPublishingService`
  - Archivo: `packages/api-nueva/src/generator-pro/services/twitter-publishing.service.ts`
  - Método `publishTweet()` - Publica via GetLate API
  - Método `optimizeContentForTwitter()` - Optimiza a 280 chars
  - Método `generateEmojis()` - Máximo 2 emojis
  - Método `generateHashtags()` - Máximo 3 hashtags

- [ ] **10.2**: Crear `TwitterAccountsService`
  - Archivo: `packages/api-nueva/src/generator-pro/services/twitter-accounts.service.ts`
  - Método `getTwitterAccounts()` - Obtiene cuentas desde GetLate API
  - Similar a `FacebookPagesService`

- [ ] **10.3**: Crear `SocialMediaPublishingService`
  - Archivo: `packages/api-nueva/src/generator-pro/services/social-media-publishing.service.ts`
  - Método `publishToSocialMedia()` - Publica en Facebook Y Twitter
  - Método `publishToFacebook()` - Publica en páginas de FB
  - Método `publishToTwitter()` - Publica en cuentas de Twitter
  - Método `updateNoticiaWithSocialMediaTracking()` - Actualiza tracking

- [ ] **10.4**: Build y validación

---

### FASE 11: Redes Sociales - Controller y Módulo

#### Tareas:

- [ ] **11.1**: Crear controller de Social Media Accounts (GetLate)
  - Archivo: `packages/api-nueva/src/generator-pro/controllers/social-media-accounts.controller.ts`
  - **Endpoints para listar cuentas desde GetLate**:
    - `GET /social-media/facebook/pages` - Lista Facebook Pages disponibles desde GetLate
    - `GET /social-media/twitter/accounts` - Lista Twitter Accounts disponibles desde GetLate
  - Usa `FacebookPagesService.getFacebookPages()` existente
  - Usa `TwitterAccountsService.getTwitterAccounts()` nuevo

- [ ] **11.2**: Crear controller de Twitter Config
  - Archivo: `packages/api-nueva/src/generator-pro/controllers/twitter-publishing.controller.ts`
  - Endpoints: `POST /twitter-config`, `GET /twitter-config`, `PATCH /twitter-config/:id`, `DELETE /twitter-config/:id`

- [ ] **11.3**: Actualizar `GeneratorProModule`
  - Importar schemas: `TwitterPublishingConfig`, `TwitterPost`
  - Agregar services: `TwitterPublishingService`, `TwitterAccountsService`, `SocialMediaPublishingService`
  - Agregar controllers: `SocialMediaAccountsController`, `TwitterPublishingController`

- [ ] **11.4**: Build y test de endpoints
  - Test: `GET /social-media/facebook/pages` retorna páginas de GetLate
  - Test: `GET /social-media/twitter/accounts` retorna cuentas de GetLate

---

### FASE 12: Redes Sociales - Integración con Publicación

#### Tareas:

- [ ] **12.1**: Modificar `PublishService.publishNoticia()`
  - Después de publicar noticia, llamar a `SocialMediaPublishingService.publishToSocialMedia()`
  - Pasar `noticia`, `siteIds` y opciones de plataformas

- [ ] **12.2**: Agregar opciones al DTO `PublishNoticiaDto`
  ```typescript
  @IsOptional()
  @IsBoolean()
  publishToSocialMedia?: boolean; // Si auto-publicar en redes

  @IsOptional()
  @IsArray()
  socialPlatforms?: ('facebook' | 'twitter')[]; // Qué plataformas

  @IsOptional()
  @IsBoolean()
  scheduleSocialMedia?: boolean; // Programar o inmediato
  ```

- [ ] **12.3**: Test de flujo completo
  - Publicar noticia en 2 sitios
  - Verificar que se publica en Facebook pages de ambos sitios
  - Verificar que se publica en Twitter accounts de ambos sitios
  - Verificar tracking en `socialMediaPublishing`

---

### FASE 13: Dashboard - UI Redes Sociales

#### Tareas:

- [ ] **13.1**: Crear componente `SocialMediaSelector`
  - Checkboxes para Facebook y Twitter
  - Muestra cuentas asignadas a cada sitio seleccionado

- [ ] **13.2**: Integrar en formulario de publicación
  - Después de seleccionar sitios, mostrar `SocialMediaSelector`
  - Opción: "Publicar automáticamente en redes sociales"

- [ ] **13.3**: Crear página de configuración de redes sociales
  - Ruta: `/sites/:id/social-media`
  - Formulario para asignar Facebook pages (selector desde GetLate)
  - Formulario para asignar Twitter accounts (selector desde GetLate)

- [ ] **13.4**: Crear hooks para redes sociales
  - Archivo: `packages/mobile-expo/src/hooks/useSocialMedia.ts`
  - **Hooks para listar cuentas de GetLate**:
    - `useFacebookPages()` - Lista páginas de Facebook desde GetLate (GET /social-media/facebook/pages)
    - `useTwitterAccounts()` - Lista cuentas de Twitter desde GetLate (GET /social-media/twitter/accounts)
  - **Hooks para asignar a Sites**:
    - `useAssignSocialMediaToSite()` - Mutation para actualizar Site.socialMedia
  - **Hooks de configuraciones**:
    - `useTwitterPublishingConfigs()` - Configuraciones de Twitter
    - `useSocialMediaStats()` - Estadísticas de publicaciones

- [ ] **13.5**: Dashboard de métricas de redes sociales
  - Total posts en Facebook por sitio
  - Total tweets por sitio
  - Engagement promedio
  - Últimas publicaciones

---

### FASE 14: Deployment y Testing

#### Tareas:

- [ ] **14.1**: Crear sitios en DB de producción
  - Seed de sitio principal: "Noticias Pachuca"
  - Crear sitio "Tu Zona"
  - Crear sitio "Mitoteo"

- [ ] **14.2**: Configurar redes sociales en producción
  - Asignar Facebook page a cada sitio
  - Asignar Twitter account a cada sitio
  - Configurar GetLate API keys

- [ ] **14.3**: Ejecutar migraciones en producción
  - Backup de DB
  - Ejecutar script de migración
  - Recrear índices

- [ ] **14.4**: Build y deploy
  - Build backend
  - Build frontends (noticiaspachuca, tuzona, mitoteo)
  - Configurar DNS para subdominios

- [ ] **14.5**: Test end-to-end en producción
  - Publicar noticia en todos los sitios
  - Verificar que aparece en cada subdominio
  - Verificar publicación en Facebook pages
  - Verificar publicación en Twitter accounts
  - Verificar tracking de engagement

---

## 📊 7. SÍNTESIS EJECUTIVA DE FASES

### FASE 0: Preparación y Migraciones ⏱️ ~4 horas
**QUÉ SE HACE**: Crear schema `Site` con campo `socialMedia`, agregar campos `sites[]` y `socialMediaPublishing` a noticias, migrar datos.
**IMPACTO**: Sin impacto en funcionalidad actual. Prepara infraestructura.
**VALIDACIÓN**: Queries actuales siguen funcionando.

---

### FASE 1: Core Multi-Sitio (Backend) ⏱️ ~6 horas
**QUÉ SE HACE**: Crear `SiteDetectionService`, `@Site()` decorator, `SiteInterceptor`.
**IMPACTO**: Infraestructura lista, endpoints no filtran todavía.
**VALIDACIÓN**: Postman detecta sitio correctamente con header.

---

### FASE 2: Controllers y Endpoints Públicos ⏱️ ~3 horas
**QUÉ SE HACE**: Aplicar `SiteInterceptor`, agregar `@Site()` a endpoints.
**IMPACTO**: Endpoints extraen sitio del request.

---

### FASE 3: Services - Filtrado por Sitio ⏱️ ~8 horas
**QUÉ SE HACE**: Modificar `PublicContentService` para filtrar por `siteId`.
**IMPACTO**: **CRÍTICO** - Cada sitio ve solo su contenido.
**VALIDACIÓN**: Sitio A no ve noticias de sitio B.

---

### FASE 4: Publicación Multi-Sitio ⏱️ ~10 horas
**QUÉ SE HACE**: Modificar `PublishService` para soportar múltiples sitios.
**IMPACTO**: **CRÍTICO** - Publica en varios sitios a la vez.
**VALIDACIÓN**: Noticia aparece en sitios seleccionados.

---

### FASE 5: Índices y Migraciones Finales ⏱️ ~4 horas
**QUÉ SE HACE**: Cambiar índices de slug a `(sites, slug)` único compuesto.
**IMPACTO**: **CRÍTICO** - Permite slugs repetidos entre sitios.
**VALIDACIÓN**: Índices creados, queries optimizadas.

---

### FASE 6: Frontend (public-noticias) ⏱️ ~5 horas
**QUÉ SE HACE**: Agregar header `x-site-domain` a server functions.
**IMPACTO**: **CRÍTICO** - Frontend identifica su sitio.
**VALIDACIÓN**: Frontend carga contenido correcto.

---

### FASE 7: Backend - API de Sites ⏱️ ~3 horas (SIMPLIFICADO - antes 6h)
**QUÉ SE HACE**: Controller, DTOs SIMPLIFICADOS (4 campos), Service y endpoints CRUD de Sites.
**IMPACTO**: Backend listo para gestionar Sites desde mobile-expo. Schema simplificado sin CDN, SEO, branding.
**VALIDACIÓN**: Endpoints responden correctamente en Postman.

---

### FASE 8: Mobile App - UI de Sites en Home ⏱️ ~6 horas (SIMPLIFICADO - antes 14h)
**QUÉ SE HACE**: Types, Mappers, API Service, Hooks, StatsCards, UI en Home (Sitios + Stats), pantallas crear/editar SIMPLIFICADAS (5 campos).
**IMPACTO**: **CRÍTICO** - Mobile app permite gestionar Sites con UI minimalista. Formularios de 1 sección vs 7 secciones.
**VALIDACIÓN**: Home muestra stats + sitios, crear/editar site funciona con campos básicos.

---

### FASE 9: Redes Sociales - Schemas Twitter ⏱️ ~3 horas
**QUÉ SE HACE**: Crear `TwitterPublishingConfig` y `TwitterPost` schemas.
**IMPACTO**: Infraestructura para Twitter lista.
**VALIDACIÓN**: Build sin errores.

---

### FASE 10: Redes Sociales - Services Twitter ⏱️ ~9 horas (incluye migración FB)
**QUÉ SE HACE**: Actualizar `FacebookPublishingConfig` (ref Site), crear `TwitterPublishingService`, `TwitterAccountsService`, `SocialMediaPublishingService`.
**IMPACTO**: **CRÍTICO** - Sistema puede publicar en Twitter via GetLate. Facebook configs ahora referencian Sites.
**VALIDACIÓN**: Test manual de publicación en Twitter y Facebook desde Sites.

---

### FASE 11: Redes Sociales - Controller y Módulo ⏱️ ~5 horas (incluye endpoints GetLate)
**QUÉ SE HACE**: Controller de Social Media Accounts (GET /facebook-pages, GET /twitter-accounts), Controller de Twitter, actualizar `GeneratorProModule`.
**IMPACTO**: Endpoints de GetLate y Twitter disponibles. Mobile puede listar páginas/cuentas.
**VALIDACIÓN**: Endpoints retornan páginas de Facebook y cuentas de Twitter desde GetLate.

---

### FASE 12: Redes Sociales - Integración con Publicación ⏱️ ~6 horas
**QUÉ SE HACE**: Integrar `SocialMediaPublishingService` en flujo de publicación.
**IMPACTO**: **CRÍTICO** - Auto-publicación en redes sociales funciona.
**VALIDACIÓN**: Publicar noticia publica automáticamente en FB y Twitter de todos los sitios.

---

### FASE 13: Dashboard - UI Redes Sociales ⏱️ ~10 horas
**QUÉ SE HACE**: `SocialMediaSelector`, configuración de cuentas, dashboard de métricas.
**IMPACTO**: Dashboard completo para gestionar redes sociales por sitio.
**VALIDACIÓN**: Asignar Facebook pages y Twitter accounts a sitios.

---

### FASE 14: Deployment y Testing ⏱️ ~8 horas
**QUÉ SE HACE**: Deploy en producción, configurar subdominios, test end-to-end.
**IMPACTO**: **CRÍTICO** - Sistema multi-sitio + redes sociales en producción.
**VALIDACIÓN**: Todo funciona en producción.

---

## 🕐 TIEMPO TOTAL ESTIMADO: ~87 horas (~11 días de trabajo)
**Reducción: -12 horas gracias a simplificación de Sites (FASE 7: -3h, FASE 8: -8h, FASE 11: +1h)**

---

## 🎯 RESUMEN EJECUTIVO FINAL

### **⚡ CAMBIO IMPORTANTE - SCHEMA SIMPLIFICADO**:

El schema `Site` ha sido **SIMPLIFICADO** para enfocarse en su propósito principal:

**❌ ELIMINADOS** (cada frontend los maneja):
- CDN & Storage (s3Bucket, cdnUrl, cloudfrontDistributionId)
- SEO Base (baseUrl, defaultSeoTitle, defaultSeoDescription, keywords)
- Branding (primaryColor, secondaryColor, logoUrl, faviconUrl)
- Features (enableComments, enableNewsletter, enableAds, etc.)

**✅ MANTIENE SOLO LO ESENCIAL**:
- Identificación: `domain`, `slug`, `name`, `description`
- **Redes Sociales**: `socialMedia` (Facebook Pages + Twitter Accounts de GetLate) **← NÚCLEO DEL SCHEMA**
- Status: `isActive`, `isMainSite`
- Stats: `totalNoticias`, `totalViews`, `totalSocialPosts`

**🎯 PROPÓSITO**: Sites indica **DÓNDE** publicar contenido (incluyendo redes sociales), NO gestiona configuración técnica.

---

### **ACLARACIÓN CRÍTICA**:
⚠️ **`Site` ≠ `NewsWebsiteConfig`**

**`NewsWebsiteConfig`** (YA EXISTE):
- Sitios de EXTRACCIÓN/SCRAPING (El Universal, Milenio, Reforma)
- De donde EXTRAEMOS contenido de competidores
- Módulo: `GeneratorProModule`

**`Site`** (NO EXISTE - PROPUESTO SIMPLIFICADO):
- Sitios DESTINO para PUBLICAR (noticiaspachuca.com, tuzona.com, mitoteo.com)
- Donde PUBLICAMOS nuestro contenido generado
- **SOLO indica destino + redes sociales asignadas**
- Módulo: `PachucaNoticiasModule`

---

### **LO QUE TENEMOS**:
- ✅ Sistema de publicación de noticias mono-sitio (noticiaspachuca.com)
- ✅ Publicación en Facebook via GetLate.dev (`FacebookPublishingService`)
- ✅ Extracción de contenido via `NewsWebsiteConfig` (scraping competidores)
- ✅ Extracción de Facebook y Twitter via RapidAPI
- ✅ Validación de copys sociales (`SocialMediaCopyGeneratorService`)
- ✅ Mobile App (mobile-expo) con patrón establecido: ApiClient + Mappers + Hooks + TanStack Query
- 🔴 **NO EXISTE**: Schema `Site` para sitios DESTINO (multi-tenant)
- 🔴 **NO EXISTE**: Sistema multi-sitio
- 🔴 **NO EXISTE**: Publicación en Twitter via GetLate
- 🔴 **NO EXISTE**: Asignación de redes sociales por sitio

### **LO QUE NECESITAMOS**:
1. **Schema `Site` SIMPLIFICADO** - Solo: domain, name, description, socialMedia (Facebook pages + Twitter accounts), status, stats
2. **Campo `sites[]` en noticias** - Array de sitios donde está publicada
3. **Campo `socialMediaPublishing` en noticias** - Tracking de posts en redes
4. **`TwitterPublishingConfig` y `TwitterPost` schemas** - Para publicar en Twitter (ref: Site)
5. **Actualizar `FacebookPublishingConfig`** - Cambiar ref de NewsWebsiteConfig → Site
6. **`TwitterPublishingService`** - Publica en Twitter via GetLate.dev API
7. **`SocialMediaPublishingService`** - Orquesta publicación en Facebook Y Twitter
8. **Endpoints GetLate** - GET /social-media/facebook/pages, GET /social-media/twitter/accounts
9. **UI en dashboard** - Formularios SIMPLIFICADOS (5 campos) + selector redes sociales
10. **Frontend actualizado** - Envía `x-site-domain` en headers

### **FLUJO FINAL**:
```
1. Usuario crea contenido con IA
2. Usuario selecciona sitios donde publicar (ej: noticiaspachuca + tuzona)
3. Usuario selecciona: "Auto-publicar en redes sociales"
4. Sistema publica:
   - Noticia en PublishedNoticia con sites: [noticiaspachuca, tuzona]
   - Post en Facebook page de noticiaspachuca via GetLate
   - Post en Facebook page de tuzona via GetLate
   - Tweet en Twitter @noticiaspachuca via GetLate
   - Tweet en Twitter @tuzona via GetLate
5. Sistema guarda tracking en socialMediaPublishing
6. Dashboard muestra métricas de engagement por sitio y red social
```

### **ARQUITECTURA CLAVE**:
- **GetLate.dev** = PUBLICAR en Facebook + Twitter (outbound)
- **RapidAPI** = EXTRAER contenido de Facebook + Twitter (inbound/scraping)
- **Site** = Multi-tenancy con redes sociales asignadas
- **NewsWebsiteConfig** = Configuración de sitios ORIGEN para scraping
- **EventEmitter2** = Comunicación entre módulos (NO forwardRef)
- **Header `x-site-domain`** = Identificación de sitio en requests

### **PATRÓN DE IMPLEMENTACIÓN MOBILE-EXPO**:
```
1. Types (site.types.ts)
2. Mapper (SiteMapper.toApp / toAPI)
3. API Service (sitesApi con ApiClient.getRawClient())
4. Hooks (useSites con TanStack Query)
5. UI Components (Home con Stats + Sitios)
```

**Capas**:
- **ApiClient**: Singleton Axios con auto-refresh de tokens
- **API Service**: Métodos async que usan ApiClient + Mappers
- **Mappers**: Conversión snake_case (API) ↔ camelCase (App)
- **Hooks**: TanStack Query con queryKeys, staleTime, gcTime
- **UI**: React Native con FlatList, Cards, responsive design

### **UI EN MOBILE-EXPO (Home)**:
- ✅ **Stats Cards**: 4 cards (Agentes 🤖, Sitios 🌐, Noticias 📰, Outlets 📊)
- ✅ **Sección Agentes**: FlatList horizontal con agentes activos + botón "+"
- 🔧 **Sección Sitios** (NUEVO): FlatList horizontal con sitios activos + botón "+"
- 🔧 **Pantallas CRUD Sites**: `/sites/create.tsx`, `/sites/[id]/edit.tsx`

---

**✅ APROBACIÓN REQUERIDA**: ¿Procedo con la implementación? ¿Algún cambio a las fases propuestas?
