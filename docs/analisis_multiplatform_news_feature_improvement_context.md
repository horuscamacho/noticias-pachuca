# 📰 Análisis: Sistema Multi-Sitio para Noticias Pachuca

**Fecha de Análisis**: 14 de Octubre, 2025
**Autor**: Jarvis (Claude Code)
**Objetivo**: Implementar sistema multi-sitio para soportar múltiples subdominios (tuzona.noticiaspachuca.com, mitoteo.noticiaspachuca.com, etc.)

---

## 📋 TABLA DE CONTENIDOS

1. [Estado Actual del Sistema](#-1-estado-actual-del-sistema)
2. [Arquitectura Propuesta](#-2-arquitectura-propuesta)
3. [Patrones de Implementación](#-3-patrones-de-implementación)
4. [Fases de Implementación](#-4-fases-de-implementación)
5. [Síntesis Ejecutiva de Fases](#-5-síntesis-ejecutiva-de-fases)

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
}

// Índices actuales
PublishedNoticiaSchema.index({ slug: 1 }, { unique: true }); // 🔴 PROBLEMA: Slug único global
PublishedNoticiaSchema.index({ status: 1, publishedAt: -1 });
PublishedNoticiaSchema.index({ category: 1, publishedAt: -1 });
```

**`Category` Schema** (`category.schema.ts`)
```typescript
@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string; // 🔴 PROBLEMA: Único global, no por sitio

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: true })
  isActive: boolean;

  // 🔴 NO EXISTE: Campo para identificar a qué sitio pertenece
}
```

#### **Services Actuales**

**`PublishService`** (`publish.service.ts`)
- ✅ **Bien estructurado**: Usa `EventEmitter2` para eventos (no ForwardRef)
- ✅ **Sin anys**: Todo está tipado correctamente
- 🔴 **Problema**: Genera canonical URL hardcoded a `noticiaspachuca.com` (línea 106)
  ```typescript
  const baseUrl = 'https://noticiaspachuca.com'; // TODO comentado en código
  const canonicalUrl = `${baseUrl}/noticia/${slug}`;
  ```
- 🔴 **Problema**: No filtra por sitio en queries
- 🔴 **Problema**: Slug único global causa conflictos al publicar misma noticia en varios sitios

**`PublicContentService`** (`public-content.service.ts`)
- ✅ **Patrón correcto**: Usa EventEmitter2 para invalidar caché
- 🔴 **Problema**: No filtra por sitio en `getNoticiasByCategory`, `getNoticiasByTag`, `searchNoticias`
- 🔴 **Problema**: Cache en memoria (líneas 28-30) no considera sitio
  ```typescript
  private categoriesCache: CategoryResponseDto[] | null = null; // Cache global
  ```

**`SlugGeneratorService`** (`slug-generator.service.ts`)
- ✅ **Implementación correcta**: Genera slugs únicos con UUID corto
- 🔴 **Problema**: Verifica unicidad global, no por sitio
  ```typescript
  const exists = await this.publishedNoticiaModel.findOne({ slug }); // Sin filtro de sitio
  ```

#### **Controllers Actuales**

**`PublicContentController`** (`public-content.controller.ts`)
```typescript
@Controller('public-content')
export class PublicContentController {
  // ✅ Sin autenticación (público)
  // 🔴 NO LEE HEADERS: No extrae x-site-domain

  @Get('categories')
  async getCategories(): Promise<CategoryResponseDto[]> {
    return this.publicContentService.getCategories(); // Sin filtro de sitio
  }

  @Get('categoria/:slug')
  async getNoticiasByCategory(@Param('slug') slug: string, @Query() query: CategoryQueryDto) {
    return this.publicContentService.getNoticiasByCategory(slug, page, limit); // Sin filtro
  }
}
```

**`PachucaNoticiasController`** (`pachuca-noticias.controller.ts`)
- ✅ **Rate limiting**: Usa Guards correctamente
- ✅ **Cache**: Usa `@CacheTTL()` correctamente
- 🔴 **NO LEE HEADERS**: No extrae información de sitio

#### **DTOs Actuales**

**`PublishNoticiaDto`**
```typescript
export class PublishNoticiaDto {
  @IsMongoId()
  contentId: string;

  @IsBoolean()
  useOriginalImage: boolean;

  // 🔴 NO EXISTE: Campo siteIds para multi-publicación
}
```

**`QueryNoticiasDto`**
```typescript
export class QueryNoticiasDto {
  @IsOptional() @IsInt() page?: number = 1;
  @IsOptional() @IsInt() limit?: number = 20;
  @IsOptional() @IsEnum(['published', ...]) status?: string;
  @IsOptional() @IsString() category?: string;

  // 🔴 NO EXISTE: Campo siteId para filtrar
}
```

#### **Config Actual**

**Variables de Entorno** (`.env.example`)
```bash
# Pachuca CDN config (específico para un sitio)
PACHUCA_S3_BUCKET=noticiaspachuca-assets
PACHUCA_S3_REGION=mx-central-1
PACHUCA_CDN_URL=https://cdn.noticiaspachuca.com
PACHUCA_CLOUDFRONT_DISTRIBUTION_ID=E1EA8H3LZ4M4FN

# 🔴 NO EXISTEN: Variables para múltiples sitios
```

**`AppConfigService`** (`config.service.ts`)
- ✅ Usa `@nestjs/config` correctamente
- 🔴 **Hardcoded**: Solo lee config de un sitio (Pachuca)

#### **Patrón Existente de Platform Detection**

✅ **YA EXISTE** un patrón similar que podemos usar como referencia:

**`PlatformDetectionService`** (`auth/services/platform-detection.service.ts`)
```typescript
@Injectable()
export class PlatformDetectionService {
  detectPlatform(request: Request): PlatformInfo {
    const userAgent = request.headers['user-agent'] || '';
    const platformHeader = request.headers['x-platform'] as Platform; // 👈 Lee header

    if (platformHeader && this.isValidPlatform(platformHeader)) {
      return { type: platformHeader, userAgent, isNative: platformHeader === 'mobile' };
    }

    return this.detectFromUserAgent(userAgent);
  }
}

// Usado con decorator
export const Platform = createParamDecorator((data, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  if (!request.platformInfo) {
    const platformService = new PlatformDetectionService();
    request.platformInfo = platformService.detectPlatform(request);
  }
  return request.platformInfo;
});
```

**🎯 PATRÓN A REPLICAR**: Podemos crear un `SiteDetectionService` similar que lea `x-site-domain` del header.

---

### 1.2. Frontend (public-noticias)

#### **Server Functions Actuales**

**`getNoticiaBySlug.ts`**
```typescript
export const getNoticiaBySlug = createServerFn({ method: 'GET' }).handler(
  async ({ data: slug }: { data: string }): Promise<NoticiaResponse> => {
    const url = `${API_BASE_URL}/pachuca-noticias/slug/${slug}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // 🔴 NO ENVÍA: 'x-site-domain' header
      },
      next: { revalidate: 300 },
    });

    return response.json();
  },
);
```

**`getNoticias.ts`**
```typescript
export const getNoticias = createServerFn({ method: 'GET' }).handler(
  async ({ data: params = {} }: { data?: GetNoticiasParams }): Promise<NoticiasResponse> => {
    const url = `${API_BASE_URL}/pachuca-noticias?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // 🔴 NO ENVÍA: 'x-site-domain' header
      },
    });

    return response.json();
  },
);
```

**`getCategories.ts`**, **`searchNoticias.ts`**
- 🔴 **Mismo problema**: No envían `x-site-domain` en headers

#### **Variables de Entorno**

**`.env.local`**
```bash
VITE_API_URL=http://localhost:4000/api
VITE_SITE_NAME=Noticias Pachuca
VITE_SITE_URL=http://localhost:3022
VITE_SITE_DESCRIPTION=Las noticias más relevantes de Pachuca y Hidalgo

# 🔴 NO EXISTE: VITE_SITE_DOMAIN o VITE_SITE_ID
```

---

### 1.3. Dashboard (dash-coyote)

#### **Hooks de Publicación**

**`usePublishNoticia.ts`**
```typescript
export function usePublishNoticia() {
  return useMutation({
    mutationFn: async (dto: PublishNoticiaDto) => {
      const response = await api.post('/pachuca-noticias/publish', dto);
      return response.data;
    },
  });
}
```
- 🔴 **Problema**: Solo publica en un sitio a la vez
- 🔴 **No existe**: Opción para seleccionar múltiples sitios

---

## 🏗️ 2. ARQUITECTURA PROPUESTA

### 2.1. Schema Nuevo: `Site` (Platform/Tenant)

**Archivo**: `packages/api-nueva/src/pachuca-noticias/schemas/site.schema.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SiteDocument = Site & Document;

/**
 * 🌐 Schema para sitios/plataformas multi-tenant
 * Representa cada sitio independiente (noticiaspachuca.com, tuzona.noticiaspachuca.com, etc.)
 */
@Schema({ timestamps: true })
export class Site {
  // ========================================
  // 🔑 IDENTIFICACIÓN
  // ========================================

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  domain: string; // "noticiaspachuca.com", "tuzona.noticiaspachuca.com", "mitoteo.noticiaspachuca.com"

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string; // "noticiaspachuca", "tuzona", "mitoteo"

  @Prop({ required: true, trim: true })
  name: string; // "Noticias Pachuca", "Tu Zona", "Mitoteo"

  @Prop({ required: true, trim: true, maxlength: 500 })
  description: string;

  // ========================================
  // 🎨 BRANDING
  // ========================================

  @Prop({ required: true })
  primaryColor: string; // "#854836"

  @Prop({ required: true })
  secondaryColor: string; // "#D4A373"

  @Prop()
  logoUrl?: string; // URL del logo en S3

  @Prop()
  faviconUrl?: string; // URL del favicon

  // ========================================
  // ☁️ CDN & STORAGE
  // ========================================

  @Prop({ type: Object, required: true })
  cdn: {
    s3Bucket: string; // "tuzona-assets"
    s3Region: string; // "mx-central-1"
    cdnUrl: string; // "https://cdn.tuzona.noticiaspachuca.com"
    cloudfrontDistributionId?: string;
  };

  // ========================================
  // 🔍 SEO BASE
  // ========================================

  @Prop({ required: true })
  baseUrl: string; // "https://tuzona.noticiaspachuca.com"

  @Prop({ required: true, trim: true, maxlength: 60 })
  defaultSeoTitle: string;

  @Prop({ required: true, trim: true, maxlength: 160 })
  defaultSeoDescription: string;

  @Prop({ type: [String], default: [] })
  defaultKeywords: string[];

  // ========================================
  // ⚙️ CONFIGURACIÓN
  // ========================================

  @Prop({ default: true })
  isActive: boolean; // Sitio activo/inactivo

  @Prop({ default: false })
  isMainSite: boolean; // ¿Es el sitio principal? (noticiaspachuca.com)

  @Prop({ type: Object })
  features?: {
    enableComments?: boolean;
    enableNewsletter?: boolean;
    enableSocialSharing?: boolean;
    enableAds?: boolean;
  };

  // ========================================
  // 📊 ESTADÍSTICAS
  // ========================================

  @Prop({ default: 0 })
  totalNoticias: number;

  @Prop({ default: 0 })
  totalViews: number;

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

// ========================================
// 🪝 MIDDLEWARES
// ========================================

SiteSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});
```

---

### 2.2. Modificaciones a `PublishedNoticia`

**Cambios en el schema**:

```typescript
@Schema({ timestamps: true })
export class PublishedNoticia {
  // ========================================
  // 🌐 NUEVO: MULTI-SITIO
  // ========================================

  @Prop({ type: [Types.ObjectId], ref: 'Site', required: true, index: true })
  sites: Types.ObjectId[]; // Array de sitios donde está publicada

  // ========================================
  // 🔗 RELACIONES (MODIFICADO)
  // ========================================

  @Prop({ required: true }) // ⚠️ YA NO UNIQUE (puede estar en varios sitios)
  slug: string; // Slug puede repetirse entre sitios diferentes

  // ... resto de campos sin cambios ...

  @Prop({ type: Object, required: true })
  seo: {
    canonicalUrl: string; // 🔧 AHORA DINÁMICO: Generado según sitio en runtime
    // ... resto de SEO
  };
}

// ========================================
// 📇 ÍNDICES ACTUALIZADOS
// ========================================

// ⚠️ CAMBIO CRÍTICO: Slug ya NO es único global, sino único POR SITIO
PublishedNoticiaSchema.index({ slug: 1 }, { unique: false }); // Remover unique
PublishedNoticiaSchema.index({ sites: 1, slug: 1 }, { unique: true }); // Nuevo: Unique por sitio + slug

// Índices existentes + nuevos
PublishedNoticiaSchema.index({ sites: 1, status: 1, publishedAt: -1 });
PublishedNoticiaSchema.index({ sites: 1, category: 1, publishedAt: -1 });
PublishedNoticiaSchema.index({ sites: 1, status: 1, category: 1, publishedAt: -1 });
```

---

### 2.3. Modificaciones a `Category`

```typescript
@Schema({ timestamps: true })
export class Category {
  // ========================================
  // 🌐 NUEVO: MULTI-SITIO
  // ========================================

  @Prop({ type: [Types.ObjectId], ref: 'Site', default: [] })
  sites: Types.ObjectId[]; // Array vacío = disponible para todos los sitios

  @Prop({ required: true, lowercase: true, trim: true })
  slug: string; // ⚠️ YA NO UNIQUE global

  // ... resto de campos ...
}

// ========================================
// 📇 ÍNDICES ACTUALIZADOS
// ========================================

CategorySchema.index({ slug: 1 }, { unique: false }); // Remover unique
CategorySchema.index({ sites: 1, slug: 1 }, { unique: true }); // Nuevo
CategorySchema.index({ sites: 1, isActive: 1, order: 1 });
```

---

### 2.4. Nuevo Servicio: `SiteDetectionService`

**Archivo**: `packages/api-nueva/src/pachuca-noticias/services/site-detection.service.ts`

```typescript
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request } from 'express';
import { Site, SiteDocument } from '../schemas/site.schema';

export interface SiteInfo {
  id: string;
  domain: string;
  slug: string;
  name: string;
  baseUrl: string;
  cdnUrl: string;
  isMainSite: boolean;
}

@Injectable()
export class SiteDetectionService {
  private siteCache: Map<string, SiteInfo> = new Map();
  private cacheTimestamp: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  constructor(
    @InjectModel(Site.name) private siteModel: Model<SiteDocument>,
  ) {}

  /**
   * Detecta el sitio desde el request basado en headers
   * @param request - Express Request
   * @returns SiteInfo del sitio detectado
   */
  async detectSite(request: Request): Promise<SiteInfo> {
    // 1. Header explícito (prioridad)
    const siteHeader = request.headers['x-site-domain'] as string;

    if (siteHeader) {
      return this.getSiteByDomain(siteHeader);
    }

    // 2. Host header (para requests directos al dominio)
    const host = request.headers['host'] as string;

    if (host) {
      const domain = this.extractDomain(host);
      return this.getSiteByDomain(domain);
    }

    // 3. Fallback al sitio principal
    return this.getMainSite();
  }

  /**
   * Obtiene información de un sitio por dominio (con cache)
   * @param domain - Dominio del sitio (ej: "tuzona.noticiaspachuca.com")
   * @returns SiteInfo
   */
  async getSiteByDomain(domain: string): Promise<SiteInfo> {
    // Revisar cache
    const cached = this.siteCache.get(domain);
    const cacheTime = this.cacheTimestamp.get(domain);

    if (cached && cacheTime && (Date.now() - cacheTime) < this.CACHE_TTL) {
      return cached;
    }

    // Buscar en DB
    const site = await this.siteModel
      .findOne({ domain: domain.toLowerCase(), isActive: true })
      .lean()
      .exec();

    if (!site) {
      throw new NotFoundException(`Sitio no encontrado para dominio: ${domain}`);
    }

    const siteInfo: SiteInfo = {
      id: site._id.toString(),
      domain: site.domain,
      slug: site.slug,
      name: site.name,
      baseUrl: site.baseUrl,
      cdnUrl: site.cdn.cdnUrl,
      isMainSite: site.isMainSite,
    };

    // Guardar en cache
    this.siteCache.set(domain, siteInfo);
    this.cacheTimestamp.set(domain, Date.now());

    return siteInfo;
  }

  /**
   * Obtiene el sitio principal (fallback)
   * @returns SiteInfo del sitio principal
   */
  async getMainSite(): Promise<SiteInfo> {
    const site = await this.siteModel
      .findOne({ isMainSite: true, isActive: true })
      .lean()
      .exec();

    if (!site) {
      throw new BadRequestException('No se encontró el sitio principal configurado');
    }

    return {
      id: site._id.toString(),
      domain: site.domain,
      slug: site.slug,
      name: site.name,
      baseUrl: site.baseUrl,
      cdnUrl: site.cdn.cdnUrl,
      isMainSite: true,
    };
  }

  /**
   * Extrae dominio limpio del host header
   * @param host - Host header (puede incluir puerto)
   * @returns Dominio limpio
   */
  private extractDomain(host: string): string {
    // Remover puerto si existe (localhost:3000 -> localhost)
    return host.split(':')[0].toLowerCase();
  }

  /**
   * Invalida cache de un sitio
   * @param domain - Dominio del sitio
   */
  invalidateCache(domain: string): void {
    this.siteCache.delete(domain);
    this.cacheTimestamp.delete(domain);
  }

  /**
   * Invalida todo el cache
   */
  invalidateAllCache(): void {
    this.siteCache.clear();
    this.cacheTimestamp.clear();
  }
}
```

---

### 2.5. Nuevo Decorator: `@Site()`

**Archivo**: `packages/api-nueva/src/pachuca-noticias/decorators/site.decorator.ts`

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator para extraer SiteInfo del request
 * Usa el SiteInterceptor que debe estar aplicado globalmente o en el controller
 *
 * @example
 * async getCategories(@Site() site: SiteInfo) {
 *   // site contiene { id, domain, slug, name, baseUrl, cdnUrl, isMainSite }
 * }
 */
export const Site = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    if (!request.siteInfo) {
      throw new Error(
        'SiteInfo no disponible. Asegúrate de usar SiteInterceptor.',
      );
    }

    return data ? request.siteInfo[data] : request.siteInfo;
  },
);
```

---

### 2.6. Nuevo Interceptor: `SiteInterceptor`

**Archivo**: `packages/api-nueva/src/pachuca-noticias/interceptors/site.interceptor.ts`

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { SiteDetectionService } from '../services/site-detection.service';

/**
 * Interceptor global para detectar y agregar SiteInfo al request
 * Debe aplicarse globalmente en el módulo o en controllers específicos
 */
@Injectable()
export class SiteInterceptor implements NestInterceptor {
  constructor(private readonly siteDetectionService: SiteDetectionService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest();

    // Detectar sitio y agregar al request
    try {
      const siteInfo = await this.siteDetectionService.detectSite(request);
      request.siteInfo = siteInfo;
    } catch (error) {
      // Si falla, intentar con sitio principal como fallback
      const mainSite = await this.siteDetectionService.getMainSite();
      request.siteInfo = mainSite;
    }

    return next.handle();
  }
}
```

---

### 2.7. DTOs Modificados

**`PublishNoticiaDto` - Actualizado**:

```typescript
import { IsBoolean, IsMongoId, IsOptional, IsUrl, IsArray } from 'class-validator';

export class PublishNoticiaDto {
  @IsMongoId({ message: 'contentId debe ser un ObjectId válido' })
  contentId: string;

  // ========================================
  // 🌐 NUEVO: MULTI-SITIO
  // ========================================

  @IsArray()
  @IsMongoId({ each: true, message: 'Cada siteId debe ser un ObjectId válido' })
  siteIds: string[]; // Array de IDs de sitios donde publicar

  @IsBoolean()
  useOriginalImage: boolean;

  @IsOptional()
  @IsUrl()
  customImageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isBreaking?: boolean;
}
```

**`QueryNoticiasDto` - Actualizado**:

```typescript
export class QueryNoticiasDto {
  // ... campos existentes ...

  // ========================================
  // 🌐 NUEVO: FILTRO POR SITIO
  // ========================================

  @IsOptional()
  @IsMongoId()
  siteId?: string; // Filtrar por sitio específico
}
```

---

### 2.8. Modificaciones a Services

#### **PublishService - Cambios Clave**

```typescript
@Injectable()
export class PublishService {
  constructor(
    @InjectModel(PublishedNoticia.name) private publishedNoticiaModel: Model<PublishedNoticiaDocument>,
    @InjectModel(Site.name) private siteModel: Model<SiteDocument>, // 🔧 NUEVO
    // ... otros
  ) {}

  /**
   * Publica una noticia en uno o múltiples sitios
   */
  async publishNoticia(dto: PublishNoticiaDto): Promise<PublishedNoticiaDocument> {
    const startTime = Date.now();

    // 1️⃣ Validar que los sitios existen y están activos
    const sites = await this.siteModel
      .find({ _id: { $in: dto.siteIds }, isActive: true })
      .exec();

    if (sites.length !== dto.siteIds.length) {
      throw new BadRequestException('Uno o más sitios no existen o están inactivos');
    }

    // 2️⃣ Validar que no exista noticia publicada con ese contentId en ALGUNO de esos sitios
    const existingPublished = await this.publishedNoticiaModel.findOne({
      contentId: dto.contentId,
      sites: { $in: dto.siteIds },
    });

    if (existingPublished) {
      throw new BadRequestException(
        `Esta noticia ya está publicada en uno de los sitios seleccionados`,
      );
    }

    // 3️⃣ Obtener contenido generado
    const generatedContent = await this.aiContentModel.findById(dto.contentId).populate('originalContentId');

    if (!generatedContent || generatedContent.status !== 'completed') {
      throw new BadRequestException('El contenido debe estar completado antes de publicar');
    }

    // 4️⃣ Generar slug único (ahora POR sitios)
    const slug = await this.slugGenerator.generateUniqueSlugForSites(
      generatedContent.generatedTitle,
      dto.siteIds,
    );

    // 5️⃣ Procesar imágenes (subirlas al bucket del PRIMER sitio o sitio principal)
    const mainSite = sites.find(s => s.isMainSite) || sites[0];
    let featuredImage: ProcessedImage | null = null;

    if (dto.useOriginalImage || dto.customImageUrl) {
      // Subir a S3 del sitio principal (o podrías subirla a TODOS los buckets)
      featuredImage = await this.imageProcessor.processAndUploadImageToSite(
        imageUrl,
        slug,
        altText,
        mainSite.cdn.s3Bucket,
        mainSite.cdn.s3Region,
      );
    }

    // 6️⃣ Generar canonical URL (usaremos el sitio principal o el primero)
    const canonicalUrl = `${mainSite.baseUrl}/noticia/${slug}`;

    // 7️⃣ Generar structured data
    const structuredData = this.generateStructuredData(generatedContent, slug, canonicalUrl, featuredImage?.large);

    // 8️⃣ Crear registro PublishedNoticia
    const publishedNoticia = new this.publishedNoticiaModel({
      contentId: generatedContent._id,
      originalNoticiaId: generatedContent.originalContentId,
      sites: dto.siteIds, // 🔧 ARRAY DE SITIOS
      slug,
      title: generatedContent.generatedTitle,
      content: generatedContent.generatedContent,
      summary: (generatedContent.generatedSummary || '').substring(0, 300),
      extendedSummary: generatedContent.extendedSummary,
      featuredImage,
      category: generatedContent.generatedCategory,
      tags: generatedContent.generatedTags || [],
      keywords: generatedContent.generatedKeywords || [],
      author: generatedContent.agentId?.name || 'Redacción',

      seo: {
        metaTitle: generatedContent.generatedTitle.substring(0, 60),
        metaDescription: generatedContent.seoData?.metaDescription || generatedContent.generatedSummary?.substring(0, 160) || '',
        focusKeyword: generatedContent.seoData?.focusKeyword || '',
        canonicalUrl, // URL del sitio principal

        ogTitle: generatedContent.seoData?.ogTitle || generatedContent.generatedTitle,
        ogDescription: generatedContent.seoData?.ogDescription || generatedContent.generatedSummary || '',
        ogImage: featuredImage?.large,
        ogType: 'article' as const,
        ogUrl: canonicalUrl,
        ogLocale: 'es_MX' as const,

        twitterCard: 'summary_large_image' as const,
        twitterTitle: generatedContent.generatedTitle.substring(0, 70),
        twitterDescription: generatedContent.generatedSummary?.substring(0, 200) || '',
        twitterImage: featuredImage?.large,

        structuredData,
      },

      publishedAt: new Date(),
      status: 'published',
      isFeatured: dto.isFeatured || false,
      isBreaking: dto.isBreaking || false,
      priority: 5,

      publishingMetadata: {
        publishedBy: undefined,
        publishedFrom: 'dashboard',
        imageSource: dto.useOriginalImage ? 'original' : 'uploaded',
        processingTime: 0,
        version: 1,
      },

      stats: { views: 0, readTime: 0, shares: 0 },
    });

    await publishedNoticia.save();

    // 9️⃣ Actualizar contadores de sitios
    await this.siteModel.updateMany(
      { _id: { $in: dto.siteIds } },
      { $inc: { totalNoticias: 1 } },
    );

    // 🔟 Emitir eventos
    this.eventEmitter.emit('noticia.published', {
      noticiaId: publishedNoticia._id,
      slug: publishedNoticia.slug,
      title: publishedNoticia.title,
      siteIds: dto.siteIds,
      publishedAt: publishedNoticia.publishedAt,
    });

    // 1️⃣1️⃣ Invalidar cache relacionado (para CADA sitio)
    for (const site of sites) {
      await this.invalidateRelatedCacheForSite(slug, publishedNoticia.category.toString(), site._id.toString());
    }

    const processingTime = Date.now() - startTime;
    this.logger.log(`✅ Noticia publicada en ${sites.length} sitio(s): ${slug} (${processingTime}ms)`);

    return publishedNoticia;
  }

  /**
   * Obtiene una noticia por slug en un sitio específico
   */
  async getNoticiaBySlugAndSite(slug: string, siteId: string): Promise<PublishedNoticiaDocument | null> {
    return this.publishedNoticiaModel.findOne({
      slug,
      sites: siteId,
      status: 'published',
    });
  }

  /**
   * Lista noticias con filtros (incluyendo sitio)
   */
  async queryNoticias(query: QueryNoticiasDto): Promise<{ data: PublishedNoticiaDocument[]; pagination: unknown }> {
    const { page = 1, limit = 20, status, category, isFeatured, isBreaking, search, siteId, sortBy = 'publishedAt', sortOrder = 'desc' } = query;

    // Construir filtro
    const filter: Record<string, unknown> = {};

    if (status) filter.status = status;
    if (category) filter.category = category.toLowerCase();
    if (isFeatured !== undefined) filter.isFeatured = isFeatured;
    if (isBreaking !== undefined) filter.isBreaking = isBreaking;
    if (search) filter.$text = { $search: search };

    // 🔧 FILTRO POR SITIO
    if (siteId) {
      filter.sites = siteId;
    }

    // Ordenamiento
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Ejecutar query con paginación
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.publishedNoticiaModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.publishedNoticiaModel.countDocuments(filter),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Invalida cache relacionado para un sitio específico
   */
  private async invalidateRelatedCacheForSite(slug: string, category: string, siteId: string): Promise<void> {
    try {
      // Invalidar con keys específicos por sitio
      await this.cacheManager.del(`/pachuca-noticias:${siteId}`);
      await this.cacheManager.del(`/pachuca-noticias/slug/${slug}:${siteId}`);
      await this.cacheManager.del(`/pachuca-noticias/related/${category}/${slug}:${siteId}`);

      this.logger.debug(`🗑️ Cache invalidado para noticia: ${slug} en sitio: ${siteId}`);
    } catch (error) {
      this.logger.warn('⚠️ Error invalidando cache:', error);
    }
  }
}
```

#### **PublicContentService - Cambios Clave**

```typescript
@Injectable()
export class PublicContentService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(PublishedNoticia.name) private publishedNoticiaModel: Model<PublishedNoticiaDocument>,
    @InjectModel(Site.name) private siteModel: Model<SiteDocument>, // 🔧 NUEVO
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Obtener categorías activas para un sitio específico
   */
  async getCategories(siteId: string): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryModel
      .find({
        isActive: true,
        $or: [
          { sites: siteId }, // Categorías específicas del sitio
          { sites: { $size: 0 } }, // Categorías globales (array vacío)
        ],
      })
      .sort({ order: 1, name: 1 })
      .lean()
      .exec();

    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await this.publishedNoticiaModel.countDocuments({
          category: cat._id,
          sites: siteId,
          status: 'published',
        });

        return {
          id: cat._id.toString(),
          slug: cat.slug,
          name: cat.name,
          description: cat.description,
          color: cat.color,
          icon: cat.icon,
          count,
          seoTitle: cat.seoTitle,
          seoDescription: cat.seoDescription,
        };
      })
    );

    return categoriesWithCount;
  }

  /**
   * Obtener noticias por categoría para un sitio
   */
  async getNoticiasByCategory(
    slug: string,
    siteId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponseDto<PublicNoticiaResponseDto>> {
    const skip = (page - 1) * limit;

    // Buscar categoría
    const category = await this.categoryModel.findOne({
      slug,
      isActive: true,
      $or: [{ sites: siteId }, { sites: { $size: 0 } }],
    }).lean().exec();

    if (!category) {
      throw new NotFoundException(`Categoría "${slug}" no encontrada`);
    }

    // Buscar noticias
    const [noticias, total] = await Promise.all([
      this.publishedNoticiaModel
        .find({
          category: category._id,
          sites: siteId, // 🔧 FILTRO POR SITIO
          status: 'published',
        })
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('category')
        .lean()
        .exec(),
      this.publishedNoticiaModel.countDocuments({
        category: category._id,
        sites: siteId, // 🔧 FILTRO POR SITIO
        status: 'published',
      }),
    ]);

    const data = noticias.map((noticia) => this.mapToPublicNoticiaDto(noticia));
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  /**
   * Búsqueda full-text para un sitio
   */
  async searchNoticias(
    query: string,
    siteId: string,
    categorySlug?: string,
    sortBy: 'relevance' | 'date' = 'relevance',
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponseDto<SearchResultDto>> {
    const skip = (page - 1) * limit;

    const filters: Record<string, unknown> = {
      status: 'published',
      sites: siteId, // 🔧 FILTRO POR SITIO
      $text: { $search: query },
    };

    // ... resto de la lógica de búsqueda ...
  }
}
```

#### **SlugGeneratorService - Cambios**

```typescript
@Injectable()
export class SlugGeneratorService {
  constructor(
    @InjectModel(PublishedNoticia.name) private publishedNoticiaModel: Model<PublishedNoticiaDocument>,
  ) {}

  /**
   * Genera un slug único para uno o múltiples sitios
   */
  async generateUniqueSlugForSites(title: string, siteIds: string[]): Promise<string> {
    // 1. Limpiar y formatear título
    let slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 60)
      .replace(/^-+|-+$/g, '');

    if (!slug || slug.length === 0) {
      slug = 'noticia';
    }

    // 2. Agregar UUID corto
    const shortUuid = this.generateShortUuid();
    slug = `${slug}-${shortUuid}`;

    // 3. Verificar que no exista en NINGUNO de los sitios seleccionados
    const exists = await this.publishedNoticiaModel.findOne({
      slug,
      sites: { $in: siteIds },
    });

    if (exists) {
      // Regenerar con nuevo UUID
      const newUuid = this.generateShortUuid();
      slug = `${slug.replace(/-[a-z0-9]{8}$/, '')}-${newUuid}`;
    }

    return slug;
  }

  private generateShortUuid(): string {
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

### 2.9. Modificaciones a Controllers

#### **PublicContentController - Cambios**

```typescript
@Controller('public-content')
@UseInterceptors(SiteInterceptor) // 🔧 APLICAR INTERCEPTOR
export class PublicContentController {
  constructor(
    private readonly publicContentService: PublicContentService,
    private readonly contactMailService: ContactMailService,
    private readonly newsletterService: NewsletterService,
    @InjectModel(ContactMessage.name) private readonly contactMessageModel: Model<ContactMessageDocument>,
  ) {}

  /**
   * GET /api/public-content/categories
   * Lista de categorías activas del sitio
   */
  @Get('categories')
  @HttpCode(HttpStatus.OK)
  async getCategories(@Site() site: SiteInfo): Promise<CategoryResponseDto[]> {
    return this.publicContentService.getCategories(site.id);
  }

  /**
   * GET /api/public-content/categoria/:slug
   * Noticias por categoría (filtradas por sitio)
   */
  @Get('categoria/:slug')
  @HttpCode(HttpStatus.OK)
  async getNoticiasByCategory(
    @Param('slug') slug: string,
    @Query() query: CategoryQueryDto,
    @Site() site: SiteInfo, // 🔧 EXTRAE SITIO
  ): Promise<PaginatedResponseDto<PublicNoticiaResponseDto>> {
    const page = query.page || 1;
    const limit = query.limit || 20;

    return this.publicContentService.getNoticiasByCategory(slug, site.id, page, limit);
  }

  /**
   * GET /api/public-content/busqueda/:query
   * Búsqueda full-text (filtrada por sitio)
   */
  @Get('busqueda/:query')
  @HttpCode(HttpStatus.OK)
  async searchNoticias(
    @Param('query') query: string,
    @Query() searchQuery: SearchQueryDto,
    @Site() site: SiteInfo, // 🔧 EXTRAE SITIO
  ): Promise<PaginatedResponseDto<SearchResultDto>> {
    const page = searchQuery.page || 1;
    const limit = searchQuery.limit || 20;
    const sortBy = searchQuery.sortBy || 'relevance';
    const categorySlug = searchQuery.category;

    return this.publicContentService.searchNoticias(query, site.id, categorySlug, sortBy, page, limit);
  }

  // ... resto de endpoints con @Site() decorator ...
}
```

#### **PachucaNoticiasController - Cambios**

```typescript
@Controller('pachuca-noticias')
@UseInterceptors(SiteInterceptor) // 🔧 APLICAR INTERCEPTOR
export class PachucaNoticiasController {
  constructor(
    private readonly publishService: PublishService,
    private readonly queueService: PublishingQueueService,
    private readonly recoveryService: PublishingQueueRecoveryService,
    private readonly seoFeedsService: SeoFeedsService,
  ) {}

  /**
   * POST /pachuca-noticias/publish
   * Publica una noticia en uno o múltiples sitios
   */
  @Post('publish')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(PublishingRateLimitGuard)
  async publishNoticia(@Body(ValidationPipe) dto: PublishNoticiaDto) {
    const noticia = await this.publishService.publishNoticia(dto);

    return {
      success: true,
      message: `Noticia publicada exitosamente en ${dto.siteIds.length} sitio(s)`,
      data: noticia,
    };
  }

  /**
   * GET /pachuca-noticias
   * Lista noticias (filtradas por sitio si se proporciona)
   */
  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  async queryNoticias(
    @Query(ValidationPipe) query: QueryNoticiasDto,
    @Site() site: SiteInfo, // 🔧 OPCIONAL: Para dashboard puede no usarse
  ) {
    // Si no se proporciona siteId en query, usar el del header
    if (!query.siteId) {
      query.siteId = site.id;
    }

    const result = await this.publishService.queryNoticias(query);

    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };
  }

  /**
   * GET /pachuca-noticias/slug/:slug
   * Obtiene noticia por slug (filtrada por sitio)
   */
  @Get('slug/:slug')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(900)
  async getNoticiaBySlug(
    @Param('slug') slug: string,
    @Site() site: SiteInfo, // 🔧 EXTRAE SITIO
  ) {
    const noticia = await this.publishService.getNoticiaBySlugAndSite(slug, site.id);

    if (!noticia) {
      return {
        success: false,
        message: 'Noticia no encontrada',
        data: null,
      };
    }

    return {
      success: true,
      data: noticia,
    };
  }

  // ... resto de endpoints con @Site() decorator donde sea necesario ...
}
```

---

### 2.10. Modificaciones al Module

**`PachucaNoticiasModule`** - Actualizado:

```typescript
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PublishedNoticia.name, schema: PublishedNoticiaSchema },
      { name: PublishingQueue.name, schema: PublishingQueueSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Site.name, schema: SiteSchema }, // 🔧 NUEVO
      { name: ContactMessage.name, schema: ContactMessageSchema },
      { name: Newsletter.name, schema: NewsletterSchema },
      { name: NewsletterSubscriber.name, schema: NewsletterSubscriberSchema },
      { name: AIContentGeneration.name, schema: AIContentGenerationSchema },
      { name: ExtractedNoticia.name, schema: ExtractedNoticiaSchema },
    ]),

    MailModule,

    BullModule.registerQueue({
      name: 'publishing-queue',
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: false,
        removeOnFail: false,
      },
    }),
  ],

  controllers: [
    PachucaNoticiasController,
    PublicContentController,
  ],

  providers: [
    // Services existentes
    PublishService,
    PublishSchedulerService,
    PublishingQueueService,
    PublishingQueueRecoveryService,
    PublicContentService,
    ContactMailService,
    NewsletterService,
    ImageProcessorService,
    SlugGeneratorService,
    SeoFeedsService,
    AwsS3CoreService,

    // 🔧 NUEVO: Site Services
    SiteDetectionService,

    // Processors
    PublishingQueueProcessor,

    // Guards
    PublishingRateLimitGuard,
    QueueLimitGuard,

    // 🔧 NUEVO: Interceptors
    SiteInterceptor,
  ],

  exports: [
    PublishService,
    PublishSchedulerService,
    PublishingQueueService,
    ImageProcessorService,
    SlugGeneratorService,
    SiteDetectionService, // 🔧 EXPORTAR
  ],
})
export class PachucaNoticiasModule {}
```

---

### 2.11. Frontend (public-noticias) - Cambios

#### **Modificar Server Functions para enviar `x-site-domain`**

**Opción 1: Variable de entorno**

**`.env.local`** (Actualizado):
```bash
VITE_API_URL=http://localhost:4000/api
VITE_SITE_NAME=Noticias Pachuca
VITE_SITE_URL=http://localhost:3022
VITE_SITE_DESCRIPTION=Las noticias más relevantes de Pachuca y Hidalgo
VITE_SITE_DOMAIN=noticiaspachuca.com  # 🔧 NUEVO
```

**Opción 2: Detectar desde host (para subdominios)**

**Archivo helper**: `src/utils/getSiteDomain.ts`
```typescript
/**
 * Obtiene el dominio del sitio actual
 * En desarrollo usa variable de entorno
 * En producción detecta desde window.location.host
 */
export function getSiteDomain(): string {
  // En desarrollo, usar env var
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_SITE_DOMAIN || 'noticiaspachuca.com';
  }

  // En producción, detectar desde host
  if (typeof window !== 'undefined') {
    return window.location.host; // "tuzona.noticiaspachuca.com"
  }

  // Fallback (SSR)
  return import.meta.env.VITE_SITE_DOMAIN || 'noticiaspachuca.com';
}
```

#### **Actualizar Server Functions**

**`getNoticiaBySlug.ts`** - Actualizado:
```typescript
import { createServerFn } from '@tanstack/react-start';
import type { NoticiaResponse } from '../types/noticia.types';
import { getSiteDomain } from '@/utils/getSiteDomain';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const getNoticiaBySlug = createServerFn({ method: 'GET' }).handler(
  async ({ data: slug }: { data: string }): Promise<NoticiaResponse> => {
    try {
      const url = `${API_BASE_URL}/pachuca-noticias/slug/${slug}`;
      const siteDomain = getSiteDomain(); // 🔧 OBTENER DOMINIO

      console.log(`[getNoticiaBySlug] Fetching: ${url} for site: ${siteDomain}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-site-domain': siteDomain, // 🔧 ENVIAR HEADER
        },
        next: { revalidate: 300 },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, data: null, message: 'Noticia no encontrada' };
        }
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result: NoticiaResponse = await response.json();

      // Transformar fechas
      if (result.data) {
        result.data.publishedAt = new Date(result.data.publishedAt);
        result.data.lastModifiedAt = new Date(result.data.lastModifiedAt);
        result.data.createdAt = new Date(result.data.createdAt);
        result.data.updatedAt = new Date(result.data.updatedAt);

        if (result.data.originalPublishedAt) {
          result.data.originalPublishedAt = new Date(result.data.originalPublishedAt);
        }
      }

      console.log(`[getNoticiaBySlug] Success: ${slug}`);

      return result;
    } catch (error) {
      console.error('[getNoticiaBySlug] Error:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
);
```

**`getNoticias.ts`**, **`getCategories.ts`**, **`searchNoticias.ts`** - Mismo patrón:
```typescript
const siteDomain = getSiteDomain();

const response = await fetch(url, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'x-site-domain': siteDomain, // 🔧 AGREGAR A TODOS
  },
  next: { revalidate: XXX },
});
```

---

### 2.12. Dashboard (dash-coyote) - Cambios

#### **Nuevo Hook: `useSites`**

**Archivo**: `packages/dash-coyote/src/features/pachuca-noticias/hooks/useSites.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

interface Site {
  id: string;
  domain: string;
  slug: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  isActive: boolean;
  isMainSite: boolean;
  totalNoticias: number;
  createdAt: string;
  updatedAt: string;
}

interface SitesResponse {
  success: boolean;
  data: Site[];
}

/**
 * Hook para obtener lista de sitios activos
 */
export function useSites() {
  return useQuery<SitesResponse>({
    queryKey: ['sites'],
    queryFn: async () => {
      const response = await api.get<SitesResponse>('/sites');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener un sitio específico por ID
 */
export function useSite(siteId: string) {
  return useQuery<{ success: boolean; data: Site }>({
    queryKey: ['sites', siteId],
    queryFn: async () => {
      const response = await api.get(`/sites/${siteId}`);
      return response.data;
    },
    enabled: !!siteId,
  });
}
```

#### **Modificar Hook de Publicación**

**`usePublishNoticia.ts`** - Actualizado:
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

interface PublishNoticiaDto {
  contentId: string;
  siteIds: string[]; // 🔧 CAMBIADO: Array de sitios
  useOriginalImage: boolean;
  customImageUrl?: string;
  isFeatured?: boolean;
  isBreaking?: boolean;
}

export function usePublishNoticia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: PublishNoticiaDto) => {
      const response = await api.post('/pachuca-noticias/publish', dto);
      return response.data;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['published-noticias'] });
      queryClient.invalidateQueries({ queryKey: ['sites'] }); // Actualizar contadores
    },
  });
}
```

#### **Componente de UI: Selector de Sitios**

**Archivo**: `packages/dash-coyote/src/features/pachuca-noticias/components/SiteSelector.tsx`

```typescript
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useSites } from '../hooks/useSites';

interface SiteSelectorProps {
  selectedSiteIds: string[];
  onChange: (siteIds: string[]) => void;
}

export function SiteSelector({ selectedSiteIds, onChange }: SiteSelectorProps) {
  const { data: sitesResponse, isLoading } = useSites();

  if (isLoading) {
    return <div>Cargando sitios...</div>;
  }

  const sites = sitesResponse?.data || [];

  const handleToggle = (siteId: string) => {
    if (selectedSiteIds.includes(siteId)) {
      onChange(selectedSiteIds.filter(id => id !== siteId));
    } else {
      onChange([...selectedSiteIds, siteId]);
    }
  };

  const handleSelectAll = () => {
    onChange(sites.map(site => site.id));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">
          Seleccionar Sitios ({selectedSiteIds.length} de {sites.length})
        </Label>
        <div className="space-x-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-sm text-blue-600 hover:underline"
          >
            Seleccionar todos
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="text-sm text-gray-600 hover:underline"
          >
            Limpiar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sites.map((site) => (
          <div
            key={site.id}
            className={`
              flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors
              ${selectedSiteIds.includes(site.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
            onClick={() => handleToggle(site.id)}
          >
            <Checkbox
              checked={selectedSiteIds.includes(site.id)}
              onCheckedChange={() => handleToggle(site.id)}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Label className="font-medium cursor-pointer">
                  {site.name}
                </Label>
                {site.isMainSite && (
                  <Badge variant="secondary" className="text-xs">
                    Principal
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">{site.domain}</p>
              <p className="text-xs text-gray-400 mt-1">
                {site.totalNoticias} noticia{site.totalNoticias !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        ))}
      </div>

      {selectedSiteIds.length === 0 && (
        <p className="text-sm text-red-600">
          ⚠️ Debes seleccionar al menos un sitio para publicar
        </p>
      )}
    </div>
  );
}
```

---

## 🛠️ 3. PATRONES DE IMPLEMENTACIÓN

### 3.1. Patrones del Backend (NestJS)

#### ✅ **Patrón 1: EventEmitter2 para Dependencias Circulares**

**NUNCA usar `forwardRef()`**. Usar `EventEmitter2` para comunicación entre módulos.

**Ejemplo Existente**:
```typescript
// PublishService emite eventos
this.eventEmitter.emit('noticia.published', {
  noticiaId: publishedNoticia._id,
  slug: publishedNoticia.slug,
});

// PublicContentService escucha eventos
this.eventEmitter.on('category.updated', () => {
  this.invalidateCache();
});
```

**Aplicación para Multi-Sitio**:
```typescript
// Event: Sitio actualizado
this.eventEmitter.emit('site.updated', { siteId: site._id });

// Listener: Invalidar cache
this.eventEmitter.on('site.updated', (payload) => {
  this.siteDetectionService.invalidateCache(payload.siteId);
});
```

#### ✅ **Patrón 2: Decorators + Interceptors**

Usar decorators para extraer información del request, con interceptors para preprocesar.

**Ejemplo Existente**: `@Platform()` decorator + `PlatformDetectionService`

**Nuevo**: `@Site()` decorator + `SiteInterceptor`

```typescript
// Decorator extrae del request
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

**MAL**:
```typescript
async getNoticia(slug: string): Promise<any> { // ❌ any
  return this.model.findOne({ slug });
}
```

**BIEN**:
```typescript
async getNoticia(slug: string): Promise<PublishedNoticiaDocument | null> { // ✅ Tipado
  return this.model.findOne({ slug });
}
```

#### ✅ **Patrón 4: DTOs con Validación**

Usar `class-validator` en todos los DTOs.

```typescript
export class PublishNoticiaDto {
  @IsMongoId({ message: 'contentId debe ser un ObjectId válido' })
  contentId: string;

  @IsArray()
  @IsMongoId({ each: true })
  siteIds: string[];

  @IsBoolean()
  useOriginalImage: boolean;
}
```

#### ✅ **Patrón 5: Índices Compuestos para Multi-Tenancy**

```typescript
// Índice compuesto: único por sitio + slug
PublishedNoticiaSchema.index({ sites: 1, slug: 1 }, { unique: true });

// Índices de query optimizados
PublishedNoticiaSchema.index({ sites: 1, status: 1, publishedAt: -1 });
PublishedNoticiaSchema.index({ sites: 1, category: 1, publishedAt: -1 });
```

#### ✅ **Patrón 6: Cache por Sitio**

Incluir `siteId` en las keys del cache:

```typescript
// Cache key específico por sitio
const cacheKey = `/pachuca-noticias/slug/${slug}:${siteId}`;
await this.cacheManager.set(cacheKey, data, ttl);

// Invalidar cache de un sitio
await this.cacheManager.del(`/pachuca-noticias:${siteId}`);
```

---

### 3.2. Patrones del Frontend (TanStack Start)

#### ✅ **Patrón 1: Server Functions con Headers**

```typescript
export const getData = createServerFn({ method: 'GET' }).handler(
  async ({ data: params }) => {
    const siteDomain = getSiteDomain(); // Helper para obtener dominio

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'x-site-domain': siteDomain, // 🔧 Siempre incluir
      },
    });

    return response.json();
  },
);
```

#### ✅ **Patrón 2: Variables de Entorno por Sitio**

```bash
# .env.local (Desarrollo)
VITE_API_URL=http://localhost:4000/api
VITE_SITE_DOMAIN=noticiaspachuca.com

# .env.tuzona (Producción - Tu Zona)
VITE_API_URL=https://api.noticiaspachuca.com/api
VITE_SITE_DOMAIN=tuzona.noticiaspachuca.com
VITE_SITE_NAME=Tu Zona
VITE_SITE_PRIMARY_COLOR=#FF5733
```

#### ✅ **Patrón 3: Detección de Dominio**

```typescript
export function getSiteDomain(): string {
  // Desarrollo: usar env
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_SITE_DOMAIN || 'noticiaspachuca.com';
  }

  // Producción: detectar desde host
  if (typeof window !== 'undefined') {
    return window.location.host;
  }

  // SSR fallback
  return import.meta.env.VITE_SITE_DOMAIN || 'noticiaspachuca.com';
}
```

---

### 3.3. Patrones del Dashboard (dash-coyote)

#### ✅ **Patrón 1: Multi-Select con React Hook Form**

```typescript
import { useForm } from 'react-hook-form';
import { SiteSelector } from '../components/SiteSelector';

interface PublishForm {
  contentId: string;
  siteIds: string[];
  useOriginalImage: boolean;
}

function PublishNoticiaForm() {
  const { control, handleSubmit } = useForm<PublishForm>({
    defaultValues: {
      contentId: '',
      siteIds: [],
      useOriginalImage: true,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="siteIds"
        control={control}
        rules={{ validate: (value) => value.length > 0 || 'Selecciona al menos un sitio' }}
        render={({ field }) => (
          <SiteSelector
            selectedSiteIds={field.value}
            onChange={field.onChange}
          />
        )}
      />
      {/* resto del form */}
    </form>
  );
}
```

---

## 📋 4. FASES DE IMPLEMENTACIÓN

### FASE 0: Preparación y Migraciones

**Objetivo**: Preparar base de datos y schemas sin afectar funcionalidad actual

#### Tareas:

- [ ] **0.1**: Crear `Site` schema en `packages/api-nueva/src/pachuca-noticias/schemas/site.schema.ts`
  - Incluir todos los campos especificados en sección 2.1
  - Agregar índices únicos para `domain` y `slug`
  - Agregar pre-save middleware para `updatedAt`

- [ ] **0.2**: Crear seed de sitio principal
  - Archivo: `packages/api-nueva/src/pachuca-noticias/seeds/sites.seed.ts`
  - Insertar registro de "Noticias Pachuca" como sitio principal
  - Ejecutar seed: `npm run seed:sites`

- [ ] **0.3**: Modificar `PublishedNoticia` schema
  - Agregar campo `sites: Types.ObjectId[]` (default: `[]` temporalmente)
  - **NO REMOVER** `unique: true` del slug todavía (lo haremos en FASE 1)
  - Build del backend: `npm run build`

- [ ] **0.4**: Modificar `Category` schema
  - Agregar campo `sites: Types.ObjectId[]` (default: `[]`)
  - **NO REMOVER** `unique: true` del slug todavía
  - Build del backend: `npm run build`

- [ ] **0.5**: Script de migración de datos existentes
  - Archivo: `packages/api-nueva/src/scripts/migrate-to-multitenant.ts`
  - Asignar todas las noticias existentes al sitio principal
  - Asignar todas las categorías existentes al sitio principal
  - Ejecutar: `npm run migrate:multitenant`
  - Validar: Todas las noticias tienen `sites` no vacío

- [ ] **0.6**: Validación post-migración
  - Verificar que todas las queries actuales siguen funcionando
  - Verificar que el frontend sigue cargando noticias correctamente
  - Verificar que la publicación sigue funcionando
  - **NO PASAR A FASE 1** hasta validar que todo funciona

---

### FASE 1: Core Multi-Sitio (Backend)

**Objetivo**: Implementar sistema de detección de sitios y servicios base

#### Tareas:

- [ ] **1.1**: Crear `SiteDetectionService`
  - Archivo: `packages/api-nueva/src/pachuca-noticias/services/site-detection.service.ts`
  - Implementar `detectSite(request)` con lectura de `x-site-domain` header
  - Implementar cache en memoria (5 min TTL)
  - Implementar `getSiteByDomain()`, `getMainSite()`
  - Agregar logging detallado

- [ ] **1.2**: Crear `@Site()` decorator
  - Archivo: `packages/api-nueva/src/pachuca-noticias/decorators/site.decorator.ts`
  - Extraer `siteInfo` del request
  - Throw error si no existe (requiere interceptor)

- [ ] **1.3**: Crear `SiteInterceptor`
  - Archivo: `packages/api-nueva/src/pachuca-noticias/interceptors/site.interceptor.ts`
  - Detectar sitio y agregar `request.siteInfo`
  - Fallback a sitio principal si falla
  - Logging de sitio detectado

- [ ] **1.4**: Agregar providers al `PachucaNoticiasModule`
  - Importar `SiteSchema` en `MongooseModule.forFeature()`
  - Agregar `SiteDetectionService` a providers
  - Agregar `SiteInterceptor` a providers
  - Exportar `SiteDetectionService`
  - Build: `npm run build`

- [ ] **1.5**: Test manual del sistema de detección
  - Usar Postman/Insomnia para enviar request con `x-site-domain: noticiaspachuca.com`
  - Verificar logs del servidor que detecta sitio correctamente
  - Verificar que fallback funciona sin header

---

### FASE 2: Controllers y Endpoints Públicos

**Objetivo**: Modificar controllers públicos para usar sistema de sitios

#### Tareas:

- [ ] **2.1**: Aplicar `SiteInterceptor` a `PublicContentController`
  - Agregar `@UseInterceptors(SiteInterceptor)` a nivel de controller
  - Build: `npm run build`

- [ ] **2.2**: Modificar `getCategories` endpoint
  - Agregar `@Site() site: SiteInfo` como parámetro
  - Pasar `site.id` a `publicContentService.getCategories()`
  - Test con Postman

- [ ] **2.3**: Modificar `getNoticiasByCategory` endpoint
  - Agregar `@Site() site: SiteInfo`
  - Pasar `site.id` a service
  - Test con Postman

- [ ] **2.4**: Modificar `searchNoticias` endpoint
  - Agregar `@Site() site: SiteInfo`
  - Pasar `site.id` a service
  - Test con Postman

- [ ] **2.5**: Modificar `getNoticiasByTag` endpoint
  - Agregar `@Site() site: SiteInfo`
  - Pasar `site.id` a service
  - Test con Postman

- [ ] **2.6**: Modificar `getNoticiasByAuthor` endpoint
  - Agregar `@Site() site: SiteInfo`
  - Pasar `site.id` a service
  - Test con Postman

---

### FASE 3: Services - Filtrado por Sitio

**Objetivo**: Actualizar services para filtrar por sitio

#### Tareas:

- [ ] **3.1**: Modificar `PublicContentService.getCategories()`
  - Agregar parámetro `siteId: string`
  - Filtrar categorías con `$or: [{ sites: siteId }, { sites: { $size: 0 } }]`
  - Contar noticias solo del sitio: `sites: siteId`
  - Test: Verificar que retorna categorías correctas

- [ ] **3.2**: Modificar `PublicContentService.getNoticiasByCategory()`
  - Agregar parámetro `siteId: string`
  - Agregar filtro `sites: siteId` a query de noticias
  - Test: Verificar que retorna solo noticias del sitio

- [ ] **3.3**: Modificar `PublicContentService.getNoticiasByTag()`
  - Agregar parámetro `siteId: string`
  - Agregar filtro `sites: siteId`
  - Test

- [ ] **3.4**: Modificar `PublicContentService.getNoticiasByAuthor()`
  - Agregar parámetro `siteId: string`
  - Agregar filtro `sites: siteId`
  - Test

- [ ] **3.5**: Modificar `PublicContentService.searchNoticias()`
  - Agregar parámetro `siteId: string`
  - Agregar filtro `sites: siteId`
  - Test con búsquedas de texto

- [ ] **3.6**: Actualizar cache para incluir `siteId` en keys
  - Cambiar keys de cache: `/public-content/categories:${siteId}`
  - Actualizar invalidación de cache
  - Test: Verificar que cache es independiente por sitio

---

### FASE 4: Publicación Multi-Sitio

**Objetivo**: Permitir publicar noticias en múltiples sitios

#### Tareas:

- [ ] **4.1**: Actualizar `PublishNoticiaDto`
  - Cambiar campo `siteId: string` → `siteIds: string[]`
  - Agregar validación: `@IsArray()` y `@IsMongoId({ each: true })`
  - Build

- [ ] **4.2**: Modificar `SlugGeneratorService.generateUniqueSlugForSites()`
  - Agregar parámetro `siteIds: string[]`
  - Verificar unicidad con: `slug, sites: { $in: siteIds }`
  - Test: Generar slug para múltiples sitios

- [ ] **4.3**: Modificar `PublishService.publishNoticia()` - Parte 1
  - Validar que todos los `siteIds` existen y están activos
  - Validar que noticia no existe en ninguno de los sitios: `contentId, sites: { $in: siteIds }`
  - Llamar a `generateUniqueSlugForSites()` con array de sitios

- [ ] **4.4**: Modificar `PublishService.publishNoticia()` - Parte 2
  - Asignar array `sites: siteIds` al crear `PublishedNoticia`
  - Usar sitio principal para canonical URL (o primer sitio)
  - Generar structured data con URL del sitio principal

- [ ] **4.5**: Modificar `PublishService.publishNoticia()` - Parte 3
  - Actualizar contadores: `await siteModel.updateMany({ _id: { $in: siteIds } }, { $inc: { totalNoticias: 1 } })`
  - Emitir evento con `siteIds: dto.siteIds`
  - Invalidar cache para CADA sitio en un loop

- [ ] **4.6**: Test de publicación multi-sitio
  - Crear 2 sitios de prueba en DB
  - Publicar noticia en ambos sitios
  - Verificar que noticia aparece en ambos
  - Verificar contadores actualizados

---

### FASE 5: Índices y Migraciones Finales

**Objetivo**: Actualizar índices y completar migración de unicidad

#### Tareas:

- [ ] **5.1**: Modificar índices de `PublishedNoticia`
  - **REMOVER** índice único de slug: `PublishedNoticiaSchema.index({ slug: 1 }, { unique: false })`
  - **AGREGAR** índice compuesto: `PublishedNoticiaSchema.index({ sites: 1, slug: 1 }, { unique: true })`
  - Agregar índices de query: `{ sites: 1, status: 1, publishedAt: -1 }`
  - Agregar: `{ sites: 1, category: 1, publishedAt: -1 }`
  - Build

- [ ] **5.2**: Modificar índices de `Category`
  - **REMOVER** índice único de slug
  - **AGREGAR** índice compuesto: `{ sites: 1, slug: 1 }, { unique: true }`
  - Agregar: `{ sites: 1, isActive: 1, order: 1 }`
  - Build

- [ ] **5.3**: Script para recrear índices en MongoDB
  - Archivo: `packages/api-nueva/src/scripts/recreate-indexes.ts`
  - Drop índices viejos
  - Crear índices nuevos
  - Ejecutar: `npm run recreate:indexes`

- [ ] **5.4**: Validar índices en MongoDB
  - Conectar a MongoDB con Compass/CLI
  - Verificar índices de `publishednoticias` collection
  - Verificar índices de `categories` collection
  - Verificar que no hay índices duplicados

- [ ] **5.5**: Test de queries con índices nuevos
  - Ejecutar query de noticias por sitio y verificar que usa índice
  - Verificar performance (explain query)
  - Test con dataset grande (>1000 noticias)

---

### FASE 6: Frontend (public-noticias)

**Objetivo**: Actualizar frontend para enviar `x-site-domain` header

#### Tareas:

- [ ] **6.1**: Agregar `VITE_SITE_DOMAIN` a `.env.local`
  - Ejemplo: `VITE_SITE_DOMAIN=noticiaspachuca.com`

- [ ] **6.2**: Crear helper `getSiteDomain()`
  - Archivo: `packages/public-noticias/src/utils/getSiteDomain.ts`
  - Detectar dominio en dev (env) y producción (window.location.host)
  - Test en dev: Verificar que retorna dominio correcto

- [ ] **6.3**: Actualizar `getNoticiaBySlug.ts`
  - Importar `getSiteDomain()`
  - Agregar header: `'x-site-domain': getSiteDomain()`
  - Test: Cargar noticia en dev

- [ ] **6.4**: Actualizar `getNoticias.ts`
  - Agregar header `x-site-domain`
  - Test: Cargar listado de noticias

- [ ] **6.5**: Actualizar `getCategories.ts`
  - Agregar header `x-site-domain`
  - Test: Cargar categorías

- [ ] **6.6**: Actualizar `searchNoticias.ts`
  - Agregar header `x-site-domain`
  - Test: Búsqueda de noticias

- [ ] **6.7**: Actualizar `getNoticiasByCategory.ts`
  - Agregar header `x-site-domain`
  - Test: Filtrar por categoría

- [ ] **6.8**: Actualizar `getNoticiasByTag.ts`
  - Agregar header `x-site-domain`
  - Test

- [ ] **6.9**: Actualizar `getNoticiasByAuthor.ts`
  - Agregar header `x-site-domain`
  - Test

- [ ] **6.10**: Actualizar `getRelatedNoticias.ts`
  - Agregar header `x-site-domain`
  - Test

- [ ] **6.11**: Test end-to-end del frontend
  - Build: `npm run build`
  - Verificar que todas las páginas cargan
  - Verificar que filtros funcionan
  - Verificar que búsqueda funciona

---

### FASE 7: Dashboard (dash-coyote) - UI Multi-Sitio

**Objetivo**: Agregar UI para seleccionar sitios al publicar

#### Tareas:

- [ ] **7.1**: Crear controller de Sitios en backend
  - Archivo: `packages/api-nueva/src/pachuca-noticias/controllers/sites.controller.ts`
  - Endpoint: `GET /sites` - Lista todos los sitios activos
  - Endpoint: `GET /sites/:id` - Obtiene un sitio por ID
  - Endpoint: `POST /sites` - Crea nuevo sitio (admin)
  - Endpoint: `PATCH /sites/:id` - Actualiza sitio (admin)
  - Endpoint: `DELETE /sites/:id` - Desactiva sitio (admin)
  - Build backend

- [ ] **7.2**: Crear DTOs para sitios
  - Archivo: `packages/api-nueva/src/pachuca-noticias/dto/site.dto.ts`
  - `CreateSiteDto`, `UpdateSiteDto`, `QuerySitesDto`
  - Validaciones con `class-validator`

- [ ] **7.3**: Crear service de sitios
  - Archivo: `packages/api-nueva/src/pachuca-noticias/services/sites.service.ts`
  - CRUD completo de sitios
  - Método para activar/desactivar
  - Método para actualizar contadores

- [ ] **7.4**: Crear hook `useSites()` en dashboard
  - Archivo: `packages/dash-coyote/src/features/pachuca-noticias/hooks/useSites.ts`
  - Query para obtener lista de sitios
  - Query para obtener sitio por ID
  - Stale time: 5 minutos

- [ ] **7.5**: Crear componente `SiteSelector`
  - Archivo: `packages/dash-coyote/src/features/pachuca-noticias/components/SiteSelector.tsx`
  - UI con checkboxes para seleccionar múltiples sitios
  - Botones "Seleccionar todos" / "Limpiar"
  - Mostrar badge "Principal" en sitio main
  - Mostrar contador de noticias por sitio

- [ ] **7.6**: Modificar `usePublishNoticia` hook
  - Cambiar interface: `siteIds: string[]`
  - Actualizar endpoint: `/pachuca-noticias/publish`
  - Invalidar queries de sitios al publicar

- [ ] **7.7**: Integrar `SiteSelector` en formulario de publicación
  - Agregar campo `siteIds` al form
  - Validación: Al menos 1 sitio seleccionado
  - Mostrar error si no selecciona ninguno

- [ ] **7.8**: Test de publicación multi-sitio desde dashboard
  - Login al dashboard
  - Crear contenido con IA
  - Publicar seleccionando 2+ sitios
  - Verificar que noticia se creó con múltiples sitios
  - Verificar contadores actualizados

---

### FASE 8: Gestión de Sitios (Admin)

**Objetivo**: UI completa para gestionar sitios desde el dashboard

#### Tareas:

- [ ] **8.1**: Crear página de gestión de sitios
  - Ruta: `/sites` en dashboard
  - Tabla con lista de sitios
  - Columnas: Nombre, Dominio, Estado, Noticias, Acciones

- [ ] **8.2**: Crear formulario de creación de sitio
  - Modal/página para crear nuevo sitio
  - Campos: domain, slug, name, description, colors, CDN config, features
  - Validaciones en tiempo real

- [ ] **8.3**: Crear formulario de edición de sitio
  - Modal/página para editar sitio existente
  - Pre-cargar datos actuales
  - Validaciones

- [ ] **8.4**: Agregar acciones de activar/desactivar
  - Botón toggle en tabla
  - Confirmación antes de desactivar
  - Actualizar lista después de acción

- [ ] **8.5**: Agregar estadísticas por sitio
  - Dashboard con cards de cada sitio
  - Mostrar: Total noticias, vistas, última publicación
  - Gráficas de noticias por día

- [ ] **8.6**: Test completo de gestión
  - Crear nuevo sitio "Tu Zona"
  - Configurar CDN y colores
  - Activar/desactivar
  - Ver estadísticas

---

### FASE 9: Deployment y Testing en Producción

**Objetivo**: Deploy seguro del sistema multi-sitio

#### Tareas:

- [ ] **9.1**: Crear sitios en DB de producción
  - Seed de sitio principal: "Noticias Pachuca"
  - Crear sitio "Tu Zona"
  - Crear sitio "Mitoteo"
  - Verificar que todos están activos

- [ ] **9.2**: Ejecutar migraciones en producción
  - Backup de DB antes de migrar
  - Ejecutar script de migración
  - Validar que todas las noticias tienen `sites`

- [ ] **9.3**: Recrear índices en producción
  - Ejecutar script de índices
  - Validar con MongoDB Atlas/Compass
  - Verificar performance de queries

- [ ] **9.4**: Build del backend
  - `npm run build` en api-nueva
  - Verificar que no hay errores de TypeScript
  - Deploy a servidor/contenedor

- [ ] **9.5**: Configurar variables de entorno para cada sitio
  - Crear `.env.tuzona` con `VITE_SITE_DOMAIN=tuzona.noticiaspachuca.com`
  - Crear `.env.mitoteo` con `VITE_SITE_DOMAIN=mitoteo.noticiaspachuca.com`
  - Configurar scripts de build por sitio

- [ ] **9.6**: Build de frontends
  - Build de public-noticias (noticiaspachuca.com)
  - Build de tuzona.noticiaspachuca.com
  - Build de mitoteo.noticiaspachuca.com
  - Verificar que cada uno tiene su VITE_SITE_DOMAIN

- [ ] **9.7**: Configurar DNS y subdominios
  - Crear registro CNAME para `tuzona.noticiaspachuca.com`
  - Crear registro CNAME para `mitoteo.noticiaspachuca.com`
  - Configurar SSL/HTTPS para subdominios
  - Verificar que resuelven correctamente

- [ ] **9.8**: Test end-to-end en producción
  - Publicar noticia de prueba en todos los sitios
  - Verificar que aparece en noticiaspachuca.com
  - Verificar que aparece en tuzona.noticiaspachuca.com
  - Verificar que aparece en mitoteo.noticiaspachuca.com
  - Verificar que filtros funcionan independientemente

- [ ] **9.9**: Monitoreo y logs
  - Configurar logging de detección de sitio
  - Configurar alertas si falla detección
  - Monitorear performance de queries con índices nuevos

- [ ] **9.10**: Documentación final
  - Actualizar README con instrucciones de multi-sitio
  - Documentar cómo agregar nuevo sitio
  - Documentar variables de entorno por sitio

---

## 📊 5. SÍNTESIS EJECUTIVA DE FASES

### FASE 0: Preparación y Migraciones ⏱️ ~4 horas
**QUÉ SE HACE**: Crear schema de `Site`, agregar campos `sites[]` a noticias y categorías, migrar datos existentes al sitio principal.
**IMPACTO**: Sin impacto en funcionalidad actual. Prepara infraestructura para multi-sitio.
**VALIDACIÓN**: Todas las noticias tienen `sites` no vacío, queries actuales siguen funcionando.

---

### FASE 1: Core Multi-Sitio (Backend) ⏱️ ~6 horas
**QUÉ SE HACE**: Crear `SiteDetectionService`, `@Site()` decorator, `SiteInterceptor`. Detectar sitio desde header `x-site-domain`.
**IMPACTO**: Infraestructura lista, pero endpoints aún no filtran por sitio.
**VALIDACIÓN**: Postman con header `x-site-domain` detecta sitio correctamente. Logs muestran sitio detectado.

---

### FASE 2: Controllers y Endpoints Públicos ⏱️ ~3 horas
**QUÉ SE HACE**: Aplicar `SiteInterceptor` a `PublicContentController`, agregar `@Site()` a todos los endpoints públicos.
**IMPACTO**: Endpoints extraen sitio del request, pero services aún no filtran.
**VALIDACIÓN**: Postman muestra que `@Site()` extrae info correctamente.

---

### FASE 3: Services - Filtrado por Sitio ⏱️ ~8 horas
**QUÉ SE HACE**: Modificar `PublicContentService` para filtrar noticias y categorías por `siteId`. Actualizar cache con keys por sitio.
**IMPACTO**: **CRÍTICO** - Endpoints ahora filtran contenido por sitio. Cada sitio ve solo su contenido.
**VALIDACIÓN**: Request con `x-site-domain` de sitio A no ve noticias de sitio B.

---

### FASE 4: Publicación Multi-Sitio ⏱️ ~10 horas
**QUÉ SE HACE**: Modificar `PublishService` para soportar publicación en múltiples sitios a la vez. Actualizar DTOs, slug generator, contadores.
**IMPACTO**: **CRÍTICO** - Permite publicar misma noticia en varios sitios con un solo request.
**VALIDACIÓN**: Publicar noticia en 2 sitios, verificar que aparece en ambos, contadores actualizados.

---

### FASE 5: Índices y Migraciones Finales ⏱️ ~4 horas
**QUÉ SE HACE**: Cambiar índices de `slug` único global a `(sites, slug)` único compuesto. Recrear índices en MongoDB.
**IMPACTO**: **CRÍTICO** - Permite slugs repetidos entre sitios diferentes. Mejora performance de queries por sitio.
**VALIDACIÓN**: Índices creados correctamente, queries usan índices nuevos, performance optimizada.

---

### FASE 6: Frontend (public-noticias) ⏱️ ~5 horas
**QUÉ SE HACE**: Agregar header `x-site-domain` a todas las server functions. Crear helper `getSiteDomain()`.
**IMPACTO**: **CRÍTICO** - Frontend ahora identifica su sitio y solicita contenido correcto al backend.
**VALIDACIÓN**: Frontend carga solo noticias de su sitio, filtros funcionan correctamente.

---

### FASE 7: Dashboard (dash-coyote) - UI Multi-Sitio ⏱️ ~12 horas
**QUÉ SE HACE**: Crear endpoints de gestión de sitios, hook `useSites()`, componente `SiteSelector`, integrar en formulario de publicación.
**IMPACTO**: **CRÍTICO** - Dashboard permite seleccionar múltiples sitios al publicar.
**VALIDACIÓN**: Publicar noticia desde dashboard seleccionando 2+ sitios, verificar que se creó correctamente.

---

### FASE 8: Gestión de Sitios (Admin) ⏱️ ~10 horas
**QUÉ SE HACE**: UI completa para CRUD de sitios, estadísticas por sitio, activar/desactivar sitios.
**IMPACTO**: Dashboard permite gestionar sitios sin tocar DB directamente.
**VALIDACIÓN**: Crear/editar/desactivar sitio, ver estadísticas.

---

### FASE 9: Deployment y Testing en Producción ⏱️ ~8 horas
**QUÉ SE HACE**: Crear sitios en producción, ejecutar migraciones, build de frontends por sitio, configurar DNS, deploy.
**IMPACTO**: **CRÍTICO** - Sistema multi-sitio en producción.
**VALIDACIÓN**: Subdominios funcionando, cada uno muestra su contenido, publicación multi-sitio funcionando.

---

### 🕐 TIEMPO TOTAL ESTIMADO: ~70 horas (~9 días de trabajo)

---

## 🎯 PREGUNTAS PARA APROBACIÓN

Antes de comenzar la implementación, necesito confirmar:

1. **¿Apruebas la arquitectura propuesta?** (Schema de `Site`, campos `sites[]` en noticias/categorías)
2. **¿Apruebas el patrón de detección por header `x-site-domain`?** (Similar a `x-platform`)
3. **¿Apruebas que los slugs puedan repetirse entre sitios?** (Único por sitio, no global)
4. **¿Apruebas la estrategia de imágenes?** (Subir al bucket del sitio principal o ¿cada sitio su bucket?)
5. **¿Quieres que empiece por alguna fase específica?** (Recomiendo secuencial: FASE 0 → FASE 1 → ...)
6. **¿Hay algún cambio que quieras hacer a la propuesta?**

Dime **qué fases apruebas** o si quieres que modifique algo antes de empezar a codear. 🚀
