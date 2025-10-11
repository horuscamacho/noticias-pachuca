# 📋 Análisis Completo: Sistema de Extracted Content (Contenido Extraído)

**Fecha:** 10 de Octubre 2025
**Versión:** 1.0
**Estado:** Análisis Técnico Completo
**Módulo:** Noticias Extraction System

---

## 📊 RESUMEN EJECUTIVO

### Propósito del Análisis
Documentar el estado actual del sistema de **Extracted Content** para identificar:
1. ✅ Qué filtros y funcionalidad YA están implementados en backend
2. ❌ Qué falta implementar para filtros avanzados
3. 🔍 Campos disponibles en el schema para filtrado
4. 📈 Índices existentes vs necesarios para performance óptima

### Contexto del Sistema
El módulo de **Noticias Extraction** es responsable de:
- Detectar URLs externas en posts de Facebook (via RapidAPI)
- Extraer contenido de sitios web configurados (scraping)
- Almacenar contenido procesado para generación de contenido AI
- Gestionar jobs de extracción con Bull Queue
- Proveer API REST para consulta de contenidos extraídos

---

## 🏗️ ARQUITECTURA ACTUAL

### Stack Tecnológico
- **Backend:** NestJS 10.x + TypeScript 5.x
- **Database:** MongoDB 7.x con Mongoose ODM
- **Queue:** Bull (Redis-backed) para jobs asíncronos
- **Scraping:** Cheerio (estático) + Puppeteer (dinámico)
- **Cache:** Redis para estadísticas y rate limiting

### Flujo de Datos
```
Facebook Posts (RapidAPI)
    ↓
URL Detection Service
    ↓
Extraction Queue (Bull)
    ↓
Scraping Service (Cheerio/Puppeteer)
    ↓
ExtractedNoticia Collection (MongoDB)
    ↓
API REST (/noticias/extracted)
    ↓
Frontend Consumers
```

---

## 🔍 ANÁLISIS BACKEND

### 1. Schema: ExtractedNoticia

**Ubicación:** `/packages/api-nueva/src/noticias/schemas/extracted-noticia.schema.ts`

#### Campos Disponibles para Filtrado

```typescript
// Identificadores y URLs
sourceUrl: string;              // URL original de la noticia (required, indexed)
domain?: string;                // Dominio extraído (indexed)
facebookPostId?: string;        // ID del post FB origen (indexed)
facebookPostUrl?: string;       // URL completa del post FB
pageId?: string;                // ID de la página FB (no indexed)

// Contenido Extraído
title?: string;                 // Título (no indexed)
content?: string;               // Contenido principal (no indexed)
excerpt?: string;               // Resumen/extracto (no indexed)
images: string[];               // Array de URLs de imágenes (default: [])

// Metadata de Publicación Original
publishedAt?: Date;             // Fecha de publicación original (indexed ⭐)
author?: string;                // Autor extraído (no indexed)
category?: string;              // Categoría principal (no indexed)
categories: string[];           // Categorías múltiples (default: [])
tags: string[];                 // Tags extraídos (default: [])

// Estado y Fechas del Sistema
status: 'pending' | 'extracted' | 'failed' | 'processing'; // (indexed)
extractedAt: Date;              // Timestamp de extracción (required, indexed)
discoveredAt?: Date;            // Cuándo fue descubierta la URL
createdAt: Date;                // (default: Date.now)
updatedAt: Date;                // (default: Date.now)

// Referencias
extractionConfigId?: ObjectId;  // Config usada para extracción (indexed)
generatedContentId?: ObjectId;  // ID del contenido AI generado (ref)
websiteConfigId?: ObjectId;     // Config Generator-Pro (ref)

// Metadata de Procesamiento AI
isProcessed?: boolean;          // Si fue procesado para AI (default: false)
processedAt?: Date;             // Cuándo fue procesado para AI

// Metadata Técnica de Extracción
extractionMetadata?: {
  method?: 'cheerio' | 'puppeteer';
  processingTime?: number;      // Milisegundos
  contentLength?: number;       // Bytes
  imagesCount?: number;         // Cantidad de imágenes
  imageCount?: number;          // Alias para imagesCount
  success?: boolean;
  errors?: string[];
  discoveredBy?: string;
  jobId?: string;               // ID del Bull job
};

// Métricas de Calidad
qualityMetrics?: {
  titleLength?: number;
  contentLength?: number;
  imageQuality?: 'high' | 'medium' | 'low';
  completeness?: number;        // 0-100%
  confidence?: number;          // 0-100%
};

// Datos Raw para Debugging
rawData: Record<string, unknown>; // (Object, no indexed)
```

#### Índices Actuales (Schema Line 120-131)

```typescript
// Índices Simples
ExtractedNoticiaSchema.index({ sourceUrl: 1 });         // Búsqueda por URL
ExtractedNoticiaSchema.index({ domain: 1 });            // Filtrado por dominio
ExtractedNoticiaSchema.index({ facebookPostId: 1 });    // Relación con FB posts
ExtractedNoticiaSchema.index({ extractedAt: -1 });      // Ordenamiento temporal
ExtractedNoticiaSchema.index({ status: 1 });            // Filtrado por estado
ExtractedNoticiaSchema.index({ publishedAt: -1 });      // Ordenamiento por fecha original ⭐
ExtractedNoticiaSchema.index({ extractionConfigId: 1 }); // Relación con configs

// Índices Compuestos para Queries Frecuentes
ExtractedNoticiaSchema.index({ domain: 1, extractedAt: -1 });     // Dominio + tiempo
ExtractedNoticiaSchema.index({ status: 1, extractedAt: -1 });     // Estado + tiempo
```

**Total de Índices:** 9 (7 simples + 2 compuestos)

---

### 2. Controller: NoticiasController

**Ubicación:** `/packages/api-nueva/src/noticias/controllers/noticias.controller.ts`

#### Endpoint Principal: `GET /noticias/extracted`

**Líneas 261-312** del controller.

##### Query Parameters Soportados

```typescript
@Query('page') page?: number;                   // Página actual (default: 1)
@Query('limit') limit?: number;                 // Items por página (default: 10)

// Filtros de Identificación
@Query('domain') domain?: string;               // Filtrar por dominio
@Query('facebookPostId') facebookPostId?: string; // Filtrar por post FB
@Query('pageId') pageId?: string;               // Filtrar por página FB

// Filtros de Estado
@Query('status') status?: string;               // 'pending' | 'extracted' | 'failed' | 'processing'

// Filtros de Contenido
@Query('hasImages') hasImages?: boolean;        // Solo con/sin imágenes

// Filtros Temporales
@Query('dateFrom') dateFrom?: string;           // ISO 8601 date string
@Query('dateTo') dateTo?: string;               // ISO 8601 date string

// Búsqueda de Texto
@Query('searchText') searchText?: string;       // Búsqueda en título/content/excerpt

// Ordenamiento
@Query('sortBy') sortBy?: string;               // Campo para ordenar
@Query('sortOrder') sortOrder?: 'asc' | 'desc'; // Dirección del ordenamiento
```

##### Swagger Documentation

```typescript
@ApiOperation({
  summary: 'Listar noticias extraídas',
  description: 'Obtiene contenido extraído con filtros y paginación'
})
@ApiQuery({ name: 'page', required: false, type: Number })
@ApiQuery({ name: 'limit', required: false, type: Number })
@ApiQuery({ name: 'domain', required: false, type: String })
@ApiQuery({ name: 'status', required: false, type: String })
@ApiQuery({ name: 'facebookPostId', required: false, type: String })
@ApiQuery({ name: 'pageId', required: false, type: String })
@ApiQuery({ name: 'hasImages', required: false, type: Boolean })
@ApiQuery({ name: 'dateFrom', required: false, type: String })
@ApiQuery({ name: 'dateTo', required: false, type: String })
@ApiQuery({ name: 'searchText', required: false, type: String })
@ApiQuery({ name: 'sortBy', required: false, type: String })
@ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
```

---

### 3. Service: NoticiasExtractionService

**Ubicación:** `/packages/api-nueva/src/noticias/services/noticias-extraction.service.ts`

#### Método Principal: `getExtractedNoticias()`

**Líneas 210-276** del service.

##### Implementación de Filtros

```typescript
async getExtractedNoticias(
  filters: NoticiasFilter,
  pagination: NoticiasPaginationOptions
): Promise<PaginatedResponse<ExtractedNoticiaDocument>> {

  // 1️⃣ Construcción de Filtro MongoDB
  const mongoFilter: Record<string, unknown> = {};

  // ✅ Filtro por Dominio (exacto)
  if (filters.domain) {
    mongoFilter.domain = filters.domain;
  }

  // ✅ Filtro por Estado (exacto)
  if (filters.status) {
    mongoFilter.status = filters.status;
  }

  // ✅ Filtro por Facebook Post ID (exacto)
  if (filters.facebookPostId) {
    mongoFilter.facebookPostId = filters.facebookPostId;
  }

  // ✅ Filtro por Page ID (exacto)
  if (filters.pageId) {
    mongoFilter.pageId = filters.pageId;
  }

  // ✅ Filtro por Presencia de Imágenes
  if (filters.hasImages !== undefined) {
    mongoFilter['images.0'] = filters.hasImages
      ? { $exists: true }   // Tiene al menos 1 imagen
      : { $exists: false };  // No tiene imágenes
  }

  // ✅ Filtro por Rango de Fechas (sobre extractedAt)
  if (filters.dateFrom || filters.dateTo) {
    mongoFilter.extractedAt = {} as Record<string, unknown>;
    if (filters.dateFrom) {
      (mongoFilter.extractedAt as Record<string, unknown>).$gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      (mongoFilter.extractedAt as Record<string, unknown>).$lte = new Date(filters.dateTo);
    }
  }

  // ✅ Búsqueda de Texto (case-insensitive regex)
  if (filters.searchText) {
    mongoFilter.$or = [
      { title: { $regex: filters.searchText, $options: 'i' } },
      { content: { $regex: filters.searchText, $options: 'i' } },
      { excerpt: { $regex: filters.searchText, $options: 'i' } },
    ];
  }

  // 2️⃣ Configuración de Ordenamiento
  const sortField = pagination.sortBy || 'extractedAt'; // Default: extractedAt
  const sortOrder = pagination.sortOrder === 'asc' ? 1 : -1; // Default: desc

  // 3️⃣ Query con Paginación
  const result = await this.paginationService.paginate(
    this.extractedNoticiaModel,
    {
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      skip: ((pagination.page || 1) - 1) * (pagination.limit || 10),
    },
    mongoFilter,
    {
      sort: { [sortField]: sortOrder },
      select: '-rawData', // 🚀 Excluir rawData para performance
    }
  );

  return result;
}
```

##### Análisis de Performance

**Optimizaciones Implementadas:**
- ✅ `select: '-rawData'` - Excluye campo pesado de debugging (puede tener HTML completo)
- ✅ Usa `PaginationService` centralizado
- ✅ Count paralelo con `Promise.all` (en pagination service)
- ✅ Índices simples cubren la mayoría de queries

**Posibles Mejoras:**
- ⚠️ Búsqueda de texto con `$regex` NO usa índices (full scan)
- ⚠️ Ordenamiento dinámico por cualquier campo no verificado con índices

---

### 4. Interfaces: NoticiasFilter & NoticiasPaginationOptions

**Ubicación:** `/packages/api-nueva/src/noticias/interfaces/noticias.interfaces.ts`

#### NoticiasFilter (Líneas 183-192)

```typescript
export interface NoticiasFilter {
  domain?: string;                  // ✅ Implementado
  status?: 'pending' | 'extracted' | 'failed' | 'processing'; // ✅ Implementado
  dateFrom?: string;                // ✅ Implementado (sobre extractedAt)
  dateTo?: string;                  // ✅ Implementado (sobre extractedAt)
  hasImages?: boolean;              // ✅ Implementado
  facebookPostId?: string;          // ✅ Implementado
  pageId?: string;                  // ✅ Implementado
  searchText?: string;              // ✅ Implementado (title/content/excerpt)
}
```

#### NoticiasPaginationOptions (Líneas 194-200)

```typescript
export interface NoticiasPaginationOptions {
  page?: number;                    // ✅ Implementado
  limit?: number;                   // ✅ Implementado
  sortBy?: string;                  // ✅ Implementado (dinámico, no validado)
  sortOrder?: 'asc' | 'desc';       // ✅ Implementado
}
```

---

## 🔍 ANÁLISIS FRONTEND

### 1. Types: ExtractedContent

**Ubicación:** `/packages/mobile-expo/src/types/extracted-content.types.ts`

#### Interfaz Principal

```typescript
export interface ExtractedContent {
  id: string;
  title: string;
  content: string;
  url: string;
  websiteId: string;          // ⚠️ Mapea a extractionConfigId (backend)
  websiteName?: string;       // ⚠️ Denormalizado, no existe en backend
  author?: string;
  category?: string;
  imageUrl?: string;          // ⚠️ Primera imagen del array images (backend)
  publishedAt?: string;
  extractedAt: string;
  status: 'pending' | 'processing' | 'extracted' | 'failed';
  isProcessed?: boolean;
  processedAt?: string;
  generatedContentId?: string;
}
```

#### Filtros Frontend

```typescript
export interface ExtractedContentFilters {
  websiteId?: string;         // ✅ Mapea a domain en backend (⚠️ naming issue)
  status?: 'pending' | 'processing' | 'extracted' | 'failed';
  limit?: number;
  page?: number;
}
```

**⚠️ ISSUE:** Frontend tiene filtros muy limitados comparado con backend.

---

### 2. API Service: extractedContentApi

**Ubicación:** `/packages/mobile-expo/src/services/extracted-content/extractedContentApi.ts`

#### Implementación Actual

```typescript
export const extractedContentApi = {
  /**
   * GET /generator-pro/content ⚠️ ENDPOINT INCORRECTO
   * Debería ser: GET /noticias/extracted
   */
  getExtractedContent: async (
    filters?: ExtractedContentFilters
  ): Promise<ExtractedContentListResponse> => {
    const rawClient = ApiClient.getRawClient();

    // Construir query params
    const params = new URLSearchParams();
    if (filters?.websiteId) params.append('websiteId', filters.websiteId); // ⚠️
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.page) params.append('page', filters.page.toString());

    const response = await rawClient.get<{
      content: ExtractedContentApiResponse[];
      total: number;
      page: number;
      totalPages: number;
    }>(`/generator-pro/content?${params.toString()}`); // ⚠️ ENDPOINT INCORRECTO

    // Mapear contenidos
    const mappedContent = response.data.content.map((apiContent) =>
      ExtractedContentMapper.toApp(apiContent)
    );

    return {
      content: mappedContent,
      total: response.data.total,
      page: response.data.page,
      totalPages: response.data.totalPages
    };
  },
};
```

**🚨 PROBLEMAS CRÍTICOS:**
1. ❌ Endpoint incorrecto: `/generator-pro/content` en lugar de `/noticias/extracted`
2. ❌ Query param `websiteId` no existe en backend (debería ser `domain`)
3. ❌ NO usa todos los filtros disponibles en backend (dateFrom, dateTo, searchText, etc.)

---

### 3. Hook: useExtractedContent

**Ubicación:** `/packages/mobile-expo/src/hooks/useExtractedContent.ts`

#### Implementación

```typescript
export function useExtractedContentInfinite(
  filters?: Omit<ExtractedContentFilters, 'page' | 'limit'>
) {
  return useInfiniteQuery({
    queryKey: extractedContentKeys.list(filters),
    queryFn: ({ pageParam = 1 }) =>
      extractedContentApi.getExtractedContent({
        ...filters,
        page: pageParam,
        limit: 20 // 20 posts por página
      }),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000     // 5 minutos
  });
}
```

**✅ Patrón Correcto:**
- Usa TanStack Query v5 con `useInfiniteQuery`
- Cursor-based pagination con `getNextPageParam`
- Cache estratégico (2min stale, 5min gc)

**❌ Problema:**
- Filtros limitados por la interfaz `ExtractedContentFilters`

---

## 📊 MATRIZ DE FUNCIONALIDAD: Backend vs Frontend

| Funcionalidad | Backend | Frontend | Gap |
|--------------|---------|----------|-----|
| **Filtros Básicos** ||||
| Por Dominio | ✅ `domain` | ❌ `websiteId` (naming issue) | 🔴 Mapeo incorrecto |
| Por Estado | ✅ `status` | ✅ `status` | ✅ OK |
| Por Facebook Post ID | ✅ `facebookPostId` | ❌ | 🔴 NO disponible |
| Por Facebook Page ID | ✅ `pageId` | ❌ | 🔴 NO disponible |
| **Filtros de Contenido** ||||
| Tiene Imágenes | ✅ `hasImages` | ❌ | 🔴 NO disponible |
| Búsqueda de Texto | ✅ `searchText` | ❌ | 🔴 NO disponible |
| **Filtros Temporales** ||||
| Rango de Fechas (extractedAt) | ✅ `dateFrom/dateTo` | ❌ | 🔴 NO disponible |
| Rango de Fechas (publishedAt) | ⚠️ Posible (sortBy) | ❌ | 🟡 Necesita implementación |
| **Ordenamiento** ||||
| Por extractedAt | ✅ Default | ❌ | 🔴 NO configurable |
| Por publishedAt | ✅ `sortBy=publishedAt` | ❌ | 🔴 NO disponible |
| Por título | ✅ `sortBy=title` | ❌ | 🔴 NO disponible |
| Por categoría | ✅ `sortBy=category` | ❌ | 🔴 NO disponible |
| Dirección (asc/desc) | ✅ `sortOrder` | ❌ | 🔴 NO disponible |
| **Paginación** ||||
| Page/Limit | ✅ | ✅ | ✅ OK |
| Infinite Scroll | N/A | ✅ TanStack Query | ✅ OK |
| Total Count | ✅ | ✅ | ✅ OK |
| **Performance** ||||
| Índices MongoDB | ✅ 9 índices | N/A | ✅ OK |
| Exclusión de campos pesados | ✅ `-rawData` | N/A | ✅ OK |
| Cache Redis | ✅ Estadísticas | ❌ | 🟡 Solo stats cacheadas |
| Cache Client | N/A | ✅ TanStack Query | ✅ OK |

**Leyenda:**
- ✅ = Implementado y funcional
- ⚠️ = Implementado parcialmente
- ❌ = NO implementado
- 🔴 = Gap crítico
- 🟡 = Gap menor

---

## 🎯 HALLAZGOS CLAVE

### ✅ Fortalezas del Sistema Actual

#### Backend
1. **Filtros Robustos:** 8 filtros diferentes implementados
2. **Ordenamiento Dinámico:** Configurable por cualquier campo
3. **Índices Eficientes:** 9 índices MongoDB para queries comunes
4. **Performance:** Excluye campo `rawData` pesado en queries
5. **Paginación:** Sistema centralizado con `PaginationService`
6. **Swagger:** Documentación completa de API
7. **Búsqueda de Texto:** Regex case-insensitive en 3 campos

#### Frontend
1. **Patrón Sólido:** API Service → Mapper → Hook → Component
2. **TanStack Query:** Cache inteligente con infinite scroll
3. **Types TypeScript:** Interfaces bien definidas
4. **Hook Reutilizable:** `useExtractedContentInfinite` encapsula lógica

---

### ❌ Gaps Críticos Identificados

#### 1. Frontend NO Consume Backend Correcto

**Problema:**
```typescript
// Frontend apunta a:
GET /generator-pro/content

// Backend real:
GET /noticias/extracted
```

**Impacto:** 🔴 **CRÍTICO** - Frontend probablemente NO funciona o consume endpoint equivocado.

**Solución:**
- Cambiar endpoint en `extractedContentApi.ts`
- Actualizar mapper para coincidir con response real
- Testing completo de integración

---

#### 2. Filtros Avanzados NO Disponibles en Frontend

**Filtros Faltantes:**
- ❌ Búsqueda de texto (`searchText`)
- ❌ Rango de fechas (`dateFrom/dateTo`)
- ❌ Filtro por imágenes (`hasImages`)
- ❌ Filtro por Facebook Post ID (`facebookPostId`)
- ❌ Filtro por Facebook Page ID (`pageId`)

**Impacto:** 🟡 **MEDIO** - Usuario no puede filtrar contenido extraído eficientemente.

**Solución:**
- Extender `ExtractedContentFilters` interface
- Actualizar `extractedContentApi` para pasar nuevos params
- Crear UI para filtros (similar a Generated Content)

---

#### 3. Ordenamiento NO Configurable en Frontend

**Problema:**
```typescript
// Frontend NO permite:
- Ordenar por publishedAt (fecha original)
- Ordenar por título alfabéticamente
- Cambiar dirección (asc/desc)
```

**Impacto:** 🟡 **MEDIO** - Lista siempre ordenada por `extractedAt` descendente.

**Solución:**
- Agregar `sortBy` y `sortOrder` a filters
- Crear UI selector de ordenamiento
- Default: `publishedAt` descendente (más recientes primero)

---

#### 4. Campos del Schema NO Tienen Índices para Filtros Avanzados

**Campos Sin Índice pero Filtrables:**
- ❌ `author` (no indexed) - Filtro futuro por autor
- ❌ `category` (no indexed) - Filtro por categoría
- ❌ `categories` (no indexed) - Filtro por categorías múltiples
- ❌ `tags` (no indexed) - Filtro por tags
- ❌ `pageId` (no indexed) - Actualmente filtrable pero sin índice

**Impacto:** 🟡 **MEDIO** - Performance degradada si se implementan estos filtros.

**Solución:**
- Agregar índices selectivos según queries futuras
- Monitorear uso con `explain('executionStats')`

---

#### 5. Búsqueda de Texto NO Usa Text Index

**Problema:**
```typescript
// Implementación actual (línea 249-255 del service)
if (filters.searchText) {
  mongoFilter.$or = [
    { title: { $regex: filters.searchText, $options: 'i' } },
    { content: { $regex: filters.searchText, $options: 'i' } },
    { excerpt: { $regex: filters.searchText, $options: 'i' } },
  ];
}
```

**Impacto:** 🔴 **CRÍTICO** - Full collection scan en búsquedas de texto.

**Solución:**
- Crear MongoDB Text Index:
  ```typescript
  ExtractedNoticiaSchema.index({
    title: 'text',
    content: 'text',
    excerpt: 'text'
  });
  ```
- Cambiar query a:
  ```typescript
  mongoFilter.$text = { $search: filters.searchText };
  ```

---

#### 6. Filtro por Rango de Fechas Solo Sobre `extractedAt`

**Problema:**
```typescript
// Actual (línea 239-247)
if (filters.dateFrom || filters.dateTo) {
  mongoFilter.extractedAt = { /* ... */ }; // ❌ Solo sobre extractedAt
}
```

**Caso de Uso Faltante:**
- Usuario quiere filtrar por "noticias publicadas entre 1-5 de Octubre"
- `extractedAt` es cuando se extrajo (puede ser días después)
- Necesita filtrar por `publishedAt` (fecha original de publicación)

**Impacto:** 🟡 **MEDIO** - Filtrado temporal impreciso.

**Solución:**
- Agregar parámetro opcional `dateField: 'extractedAt' | 'publishedAt'`
- Default: `extractedAt` (compatibilidad)
- Permitir filtrar por fecha de publicación original

---

#### 7. NO Hay Validación de `sortBy` Dinámico

**Problema:**
```typescript
// Línea 258-259 del service
const sortField = pagination.sortBy || 'extractedAt'; // ❌ NO validado
const sortOrder = pagination.sortOrder === 'asc' ? 1 : -1;
```

**Riesgo:** Usuario puede pasar cualquier campo (`sortBy=maliciousField`)

**Impacto:** 🟡 **MEDIO-BAJO** - Posible error MongoDB o información sensible expuesta.

**Solución:**
- Crear whitelist de campos permitidos:
  ```typescript
  const ALLOWED_SORT_FIELDS = [
    'extractedAt',
    'publishedAt',
    'title',
    'author',
    'category'
  ];

  const sortField = ALLOWED_SORT_FIELDS.includes(pagination.sortBy)
    ? pagination.sortBy
    : 'extractedAt';
  ```

---

## 📋 IMPLEMENTACIÓN RECOMENDADA: Filtros Avanzados

### Fase 1: Backend - Índices Adicionales (30 min)

**Objetivo:** Preparar BD para filtros avanzados con performance óptima.

#### Tareas

**1.1. Agregar Text Index para Búsqueda**
```typescript
// En extracted-noticia.schema.ts (después de índices existentes)

// Índice de texto completo para búsquedas
ExtractedNoticiaSchema.index({
  title: 'text',
  content: 'text',
  excerpt: 'text'
}, {
  weights: {
    title: 10,      // Título más relevante
    excerpt: 5,     // Extracto medianamente relevante
    content: 1      // Contenido menos relevante
  },
  name: 'extracted_content_text_search'
});
```

**1.2. Agregar Índices para Filtros Futuros**
```typescript
// Para filtrado por autor
ExtractedNoticiaSchema.index({ author: 1 });

// Para filtrado por categoría
ExtractedNoticiaSchema.index({ category: 1 });

// Para filtrado por tags (array)
ExtractedNoticiaSchema.index({ tags: 1 });

// Para filtrado por pageId (actualmente sin índice)
ExtractedNoticiaSchema.index({ pageId: 1 });

// Índice compuesto: filtro común (status + publishedAt)
ExtractedNoticiaSchema.index({
  status: 1,
  publishedAt: -1
});

// Índice compuesto: domain + publishedAt
ExtractedNoticiaSchema.index({
  domain: 1,
  publishedAt: -1
});
```

**1.3. Rebuild Índices en MongoDB**
```bash
mongosh "mongodb://localhost:27017/pachuca-noticias"
use pachuca-noticias
db.extractednoticias.reIndex()
db.extractednoticias.getIndexes()
```

**Build:**
```bash
cd /packages/api-nueva && yarn build
```

---

### Fase 2: Backend - Mejorar Service (1 hora)

**Objetivo:** Implementar búsqueda con Text Index + validación de sortBy.

#### Tareas

**2.1. Actualizar Método getExtractedNoticias**

**Ubicación:** `/packages/api-nueva/src/noticias/services/noticias-extraction.service.ts`

```typescript
// Constantes al inicio de la clase
private readonly ALLOWED_SORT_FIELDS = [
  'extractedAt',
  'publishedAt',
  'title',
  'author',
  'category',
  'discoveredAt',
  'createdAt'
];

async getExtractedNoticias(
  filters: NoticiasFilter,
  pagination: NoticiasPaginationOptions
): Promise<PaginatedResponse<ExtractedNoticiaDocument>> {

  const mongoFilter: Record<string, unknown> = {};

  // ... filtros existentes ...

  // 🔧 MEJORAR: Búsqueda de texto con Text Index
  if (filters.searchText) {
    mongoFilter.$text = {
      $search: filters.searchText,
      $caseSensitive: false
    };
    // Agregar score para relevancia
    // (se usa en sort más abajo)
  }

  // 🆕 NUEVO: Filtro por autor
  if (filters.author) {
    mongoFilter.author = { $regex: filters.author, $options: 'i' };
  }

  // 🆕 NUEVO: Filtro por categoría
  if (filters.category) {
    mongoFilter.category = filters.category;
  }

  // 🆕 NUEVO: Filtro por tags (debe incluir TODOS los tags)
  if (filters.tags && filters.tags.length > 0) {
    mongoFilter.tags = { $all: filters.tags };
  }

  // 🆕 NUEVO: Filtro por rango de fechas configurable
  const dateField = filters.dateField || 'extractedAt'; // Default: extractedAt
  if (filters.dateFrom || filters.dateTo) {
    mongoFilter[dateField] = {} as Record<string, unknown>;
    if (filters.dateFrom) {
      (mongoFilter[dateField] as Record<string, unknown>).$gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      (mongoFilter[dateField] as Record<string, unknown>).$lte = new Date(filters.dateTo);
    }
  }

  // 🔧 MEJORAR: Validar sortBy
  const sortField = this.ALLOWED_SORT_FIELDS.includes(pagination.sortBy)
    ? pagination.sortBy
    : 'extractedAt';
  const sortOrder = pagination.sortOrder === 'asc' ? 1 : -1;

  // Configurar sort con score si hay búsqueda de texto
  const sortConfig: Record<string, number> = {};
  if (filters.searchText) {
    sortConfig.score = { $meta: 'textScore' }; // Ordenar por relevancia
  }
  sortConfig[sortField] = sortOrder;

  const result = await this.paginationService.paginate(
    this.extractedNoticiaModel,
    {
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      skip: ((pagination.page || 1) - 1) * (pagination.limit || 10),
    },
    mongoFilter,
    {
      sort: sortConfig,
      select: '-rawData',
      // Proyectar score si hay búsqueda
      ...(filters.searchText && {
        projection: { score: { $meta: 'textScore' } }
      })
    }
  );

  return result;
}
```

**2.2. Actualizar Interface NoticiasFilter**

**Ubicación:** `/packages/api-nueva/src/noticias/interfaces/noticias.interfaces.ts`

```typescript
export interface NoticiasFilter {
  // Filtros existentes
  domain?: string;
  status?: 'pending' | 'extracted' | 'failed' | 'processing';
  dateFrom?: string;
  dateTo?: string;
  hasImages?: boolean;
  facebookPostId?: string;
  pageId?: string;
  searchText?: string;

  // 🆕 NUEVOS Filtros
  author?: string;                 // Búsqueda parcial por autor
  category?: string;               // Filtro exacto por categoría
  tags?: string[];                 // Filtro por tags (debe incluir todos)
  dateField?: 'extractedAt' | 'publishedAt'; // Campo para rango de fechas
  isProcessed?: boolean;           // Filtrar solo procesados/no procesados
}
```

**2.3. Actualizar Controller con Nuevos Params**

**Ubicación:** `/packages/api-nueva/src/noticias/controllers/noticias.controller.ts`

```typescript
@Get('extracted')
@ApiOperation({ /* ... */ })
// Query params existentes...
@ApiQuery({ name: 'author', required: false, type: String, description: 'Filtrar por autor (parcial)' })
@ApiQuery({ name: 'category', required: false, type: String, description: 'Filtrar por categoría' })
@ApiQuery({ name: 'tags', required: false, type: [String], description: 'Filtrar por tags (debe incluir todos)' })
@ApiQuery({ name: 'dateField', required: false, enum: ['extractedAt', 'publishedAt'], description: 'Campo para filtro de fechas (default: extractedAt)' })
@ApiQuery({ name: 'isProcessed', required: false, type: Boolean, description: 'Solo procesados/no procesados' })
async getExtractedNoticias(
  // Params existentes...
  @Query('author') author?: string,
  @Query('category') category?: string,
  @Query('tags') tags?: string[],
  @Query('dateField') dateField?: 'extractedAt' | 'publishedAt',
  @Query('isProcessed') isProcessed?: boolean,
): Promise<PaginatedResponse<ExtractedNoticiaDocument>> {

  const filters: NoticiasFilter = {
    // Filtros existentes...
    ...(author && { author }),
    ...(category && { category }),
    ...(tags && tags.length > 0 && { tags }),
    ...(dateField && { dateField }),
    ...(isProcessed !== undefined && { isProcessed }),
  };

  // ... resto del código
}
```

**Build:**
```bash
cd /packages/api-nueva && yarn build
```

---

### Fase 3: Frontend - Actualizar Types y Service (45 min)

**Objetivo:** Sincronizar frontend con backend actualizado.

#### Tareas

**3.1. Actualizar ExtractedContentFilters**

**Ubicación:** `/packages/mobile-expo/src/types/extracted-content.types.ts`

```typescript
export interface ExtractedContentFilters {
  page?: number;
  limit?: number;

  // 🔧 FIX: Cambiar websiteId → domain
  domain?: string;                 // Filtrar por dominio

  status?: 'pending' | 'processing' | 'extracted' | 'failed';

  // 🆕 NUEVOS Filtros
  searchText?: string;             // Búsqueda de texto
  hasImages?: boolean;             // Solo con/sin imágenes
  facebookPostId?: string;         // Filtrar por post FB
  pageId?: string;                 // Filtrar por página FB

  author?: string;                 // Filtrar por autor
  category?: string;               // Filtrar por categoría
  tags?: string[];                 // Filtrar por tags

  dateFrom?: string;               // ISO date string
  dateTo?: string;                 // ISO date string
  dateField?: 'extractedAt' | 'publishedAt'; // Campo para rango

  isProcessed?: boolean;           // Solo procesados/no procesados

  // Ordenamiento
  sortBy?: 'extractedAt' | 'publishedAt' | 'title' | 'author' | 'category';
  sortOrder?: 'asc' | 'desc';
}
```

**3.2. Actualizar extractedContentApi**

**Ubicación:** `/packages/mobile-expo/src/services/extracted-content/extractedContentApi.ts`

```typescript
export const extractedContentApi = {
  getExtractedContent: async (
    filters: ExtractedContentFilters = {}
  ): Promise<ExtractedContentListResponse> => {
    const rawClient = ApiClient.getRawClient();

    // Construir query params
    const params: Record<string, string | number | boolean> = {};

    // Paginación
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;

    // Ordenamiento
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.sortOrder) params.sortOrder = filters.sortOrder;

    // Filtros básicos
    if (filters.domain) params.domain = filters.domain; // 🔧 FIX
    if (filters.status) params.status = filters.status;
    if (filters.facebookPostId) params.facebookPostId = filters.facebookPostId;
    if (filters.pageId) params.pageId = filters.pageId;

    // Filtros de contenido
    if (filters.searchText) params.searchText = filters.searchText;
    if (filters.hasImages !== undefined) params.hasImages = filters.hasImages;
    if (filters.author) params.author = filters.author;
    if (filters.category) params.category = filters.category;
    if (filters.tags && filters.tags.length > 0) {
      params.tags = filters.tags.join(',');
    }

    // Filtros temporales
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (filters.dateField) params.dateField = filters.dateField;

    // Otros
    if (filters.isProcessed !== undefined) params.isProcessed = filters.isProcessed;

    // 🔧 FIX: Cambiar endpoint
    const response = await rawClient.get<{
      data: ExtractedContentApiResponse[]; // 🔧 FIX: data en lugar de content
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>('/noticias/extracted', { params }); // 🔧 FIX: Endpoint correcto

    // Mapear contenidos
    const mappedContent = response.data.data.map((apiContent) =>
      ExtractedContentMapper.toApp(apiContent)
    );

    return {
      content: mappedContent,
      total: response.data.pagination.total,
      page: response.data.pagination.page,
      totalPages: response.data.pagination.totalPages
    };
  },
};
```

**3.3. Actualizar Mapper (si es necesario)**

Verificar que `ExtractedContentMapper.toApp()` mapea correctamente los campos del backend.

**NO hay build en esta fase.**

---

### Fase 4: Frontend - Componentes de Filtros (3-4 horas)

**Objetivo:** Crear UI para filtros avanzados similar a Generated Content.

#### Tareas

**4.1. Crear FilterHeader Component**
- Similar a Generated Content
- Search bar + botón de filtros con badge

**4.2. Crear ActiveFiltersBar Component**
- Chips scrollables horizontales
- Botón para remover filtros individuales
- Botón "Limpiar todo"

**4.3. Crear FilterBottomSheet Component**
- Sección de Ordenamiento
- Sección de Estado
- Sección de Dominio (select)
- Sección de Fechas (date pickers)
- Sección de Autor
- Sección de Categoría
- Toggle "Solo con imágenes"
- Toggle "Solo procesados"

**4.4. Actualizar Screen**
- Integrar componentes de filtros
- Conectar con `useExtractedContentInfinite`
- Manejar estado de filtros

**Referencia:** `/docs/FILTROS_CONTENIDOS_CONTEXT_FEATURE.md` (Fases 7-9)

**NO hay build en esta fase.**

---

## 📊 ÍNDICES RECOMENDADOS: Antes vs Después

### Índices Actuales (9 índices)

```typescript
// Simples (7)
{ sourceUrl: 1 }
{ domain: 1 }
{ facebookPostId: 1 }
{ extractedAt: -1 }
{ status: 1 }
{ publishedAt: -1 }
{ extractionConfigId: 1 }

// Compuestos (2)
{ domain: 1, extractedAt: -1 }
{ status: 1, extractedAt: -1 }
```

### Índices Recomendados (16 índices)

```typescript
// Simples (11) - 4 nuevos
{ sourceUrl: 1 }
{ domain: 1 }
{ facebookPostId: 1 }
{ extractedAt: -1 }
{ status: 1 }
{ publishedAt: -1 }
{ extractionConfigId: 1 }
{ author: 1 }                    // 🆕 NUEVO
{ category: 1 }                  // 🆕 NUEVO
{ tags: 1 }                      // 🆕 NUEVO
{ pageId: 1 }                    // 🆕 NUEVO

// Text Index (1) - 1 nuevo
{ title: 'text', content: 'text', excerpt: 'text' } // 🆕 NUEVO

// Compuestos (4) - 2 nuevos
{ domain: 1, extractedAt: -1 }
{ status: 1, extractedAt: -1 }
{ status: 1, publishedAt: -1 }   // 🆕 NUEVO
{ domain: 1, publishedAt: -1 }   // 🆕 NUEVO
```

**Crecimiento:** 9 → 16 índices (+77%)

**Impacto en Storage:**
- Text Index: ~15-25% del tamaño de la colección
- Índices adicionales: ~5-10% del tamaño de la colección
- Total estimado: +20-35% storage overhead

**Justificación:**
- Queries frecuentes: filtrado + ordenamiento
- Text search sin full scan
- Performance crítica para UX

---

## 🎯 CHECKLIST DE IMPLEMENTACIÓN

### Backend

- [ ] **Fase 1: Índices** (30 min)
  - [ ] Agregar Text Index (title, content, excerpt)
  - [ ] Agregar índice simple: author
  - [ ] Agregar índice simple: category
  - [ ] Agregar índice simple: tags
  - [ ] Agregar índice simple: pageId
  - [ ] Agregar índice compuesto: (status, publishedAt)
  - [ ] Agregar índice compuesto: (domain, publishedAt)
  - [ ] Rebuild índices en MongoDB
  - [ ] Verificar con `getIndexes()`
  - [ ] Build: `yarn build`

- [ ] **Fase 2: Service** (1 hora)
  - [ ] Crear constante `ALLOWED_SORT_FIELDS`
  - [ ] Actualizar búsqueda de texto con Text Index
  - [ ] Agregar filtro por autor
  - [ ] Agregar filtro por categoría
  - [ ] Agregar filtro por tags
  - [ ] Agregar parámetro `dateField`
  - [ ] Agregar filtro `isProcessed`
  - [ ] Validar `sortBy` con whitelist
  - [ ] Agregar sort por relevancia (text score)
  - [ ] Testing manual con curl
  - [ ] Build: `yarn build`

- [ ] **Actualizar Controller** (15 min)
  - [ ] Agregar @ApiQuery para nuevos params
  - [ ] Pasar nuevos filtros al service
  - [ ] Actualizar documentación Swagger
  - [ ] Build: `yarn build`

- [ ] **Actualizar Interfaces** (10 min)
  - [ ] Extender `NoticiasFilter` con nuevos campos
  - [ ] Documentar cada campo con JSDoc

### Frontend

- [ ] **Fase 3: Types y Service** (45 min)
  - [ ] Actualizar `ExtractedContentFilters` interface
  - [ ] Cambiar `websiteId` → `domain`
  - [ ] Agregar nuevos filtros a interface
  - [ ] Actualizar `extractedContentApi.ts`
  - [ ] Cambiar endpoint `/generator-pro/content` → `/noticias/extracted`
  - [ ] Construir query params con todos los filtros
  - [ ] Actualizar mapper si es necesario
  - [ ] Testing con Postman/curl

- [ ] **Fase 4: Componentes UI** (3-4 horas)
  - [ ] Crear `FilterHeader.tsx`
  - [ ] Crear `ActiveFiltersBar.tsx`
  - [ ] Crear `FilterBottomSheet.tsx` con todas las secciones
  - [ ] Crear `ExtractedContentCard.tsx` (mejorado)
  - [ ] Integrar en screen principal
  - [ ] Testing manual en app

### Testing Final

- [ ] **Backend Testing** (30 min)
  - [ ] Probar cada filtro individualmente
  - [ ] Probar combinaciones de filtros
  - [ ] Verificar Text Index con `explain()`
  - [ ] Verificar performance < 200ms
  - [ ] Probar ordenamiento por todos los campos

- [ ] **Frontend Testing** (30 min)
  - [ ] Verificar integración con backend correcto
  - [ ] Probar filtros avanzados en UI
  - [ ] Verificar chips de filtros activos
  - [ ] Probar scroll infinito + filtros
  - [ ] Verificar pull-to-refresh mantiene filtros

### Tiempo Total Estimado
- Backend: 2 horas
- Frontend: 4-5 horas
- Testing: 1 hora
- **Total: 7-8 horas** (1 día de trabajo)

---

## 🚫 RESTRICCIONES TÉCNICAS

### Backend
1. ❌ **NO usar `any` types** → Tipar correctamente TODO
2. ✅ Validar TODOS los query params con whitelist
3. ✅ Documentar con `@ApiQuery()` para Swagger
4. ✅ Limitar `limit` a máximo 100
5. ✅ Usar Text Index para búsquedas (NO regex en producción)
6. ✅ Monitorear performance con `explain('executionStats')`

### Frontend
1. ❌ **NO usar `any` types** → Tipar correctamente TODO
2. ✅ Usar endpoint correcto: `/noticias/extracted`
3. ✅ Mapear correctamente snake_case ↔ camelCase
4. ✅ Componentes de `@rn-primitives` para UI
5. ✅ TanStack Query para state management

### General
1. ❌ **NO levantar servidores**
2. ✅ Build solo en backend cuando se modifica
3. ✅ Commit después de cada fase

---

## 📝 NOTAS ADICIONALES

### Performance MongoDB

**Text Index:**
- Peso: 15-25% del tamaño de la colección
- Query: < 100ms para búsquedas simples
- Soporta búsquedas parciales y relevancia

**Índices Compuestos:**
- Más eficientes que múltiples índices simples
- Cubren queries comunes: (filtro + ordenamiento)

**Monitoring:**
```bash
# Verificar uso de índices
db.extractednoticias.find({
  status: 'extracted',
  publishedAt: { $gte: ISODate('2025-10-01') }
}).sort({ publishedAt: -1 }).explain('executionStats')

# Verificar que:
# - executionStats.totalKeysExamined ≈ nReturned
# - executionStats.executionTimeMillis < 200ms
# - winningPlan.inputStage.indexName está presente
```

### Cache Strategy

**Backend (Redis):**
- Estadísticas: 5 minutos
- Rate limiting: Por dominio

**Frontend (TanStack Query):**
- `staleTime`: 2 minutos (lista)
- `gcTime`: 5 minutos (lista)
- Invalidar al aplicar filtros

### Debouncing

**Búsqueda de texto:**
- 300ms debounce en input
- Previene queries excesivas

**Filtros:**
- Aplicar solo al presionar "Aplicar Filtros"
- NO aplicar en tiempo real (performance)

---

## 🎨 DISEÑO UX PROPUESTO

### Layout Principal

```
┌───────────────────────────────────────────┐
│ [🔍 Buscar...]          [Filtros 🎚️ (3)] │ ← FilterHeader
├───────────────────────────────────────────┤
│ 🏷️ Extraído  🏷️ Con imágenes  [×]       │ ← ActiveFiltersBar
├───────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐   │
│ │ 📰 Título del contenido extraído... │   │
│ │ 📅 Publicado: 09 Oct 2025           │   │
│ │ 🌐 sintesis-hidalgo.mx              │   │ ← ExtractedContentCard
│ │ 👤 Juan Pérez                        │   │
│ │ 🖼️ 5 imágenes                       │   │
│ └─────────────────────────────────────┘   │
│ ...más cards...                            │
└───────────────────────────────────────────┘
```

### Bottom Sheet de Filtros

```
╔═══════════════════════════════════════════╗
║  🎚️ Filtros Avanzados                    ║
╠═══════════════════════════════════════════╣
║  Ordenar por:                             ║
║  ⚫ Fecha de publicación ↓                ║
║  ⚪ Fecha de extracción ↓                 ║
║  ⚪ Título (A-Z)                          ║
║  ─────────────────────────────────────   ║
║  Estado:                                  ║
║  ☑️ Extraído (45)                         ║
║  ☐ Pendiente (12)                         ║
║  ☐ Fallido (3)                            ║
║  ─────────────────────────────────────   ║
║  Dominio:                                 ║
║  [Seleccionar dominio...] ▼               ║
║  ─────────────────────────────────────   ║
║  Rango de Fechas:                         ║
║  📅 Fecha de publicación original         ║
║  Desde: [09 Oct 2025]                     ║
║  Hasta: [10 Oct 2025]                     ║
║  ─────────────────────────────────────   ║
║  Opciones:                                ║
║  ☑️ Solo con imágenes                     ║
║  ☐ Solo procesados para AI                ║
║  ═════════════════════════════════════   ║
║  [Limpiar]        [Aplicar Filtros]       ║
╚═══════════════════════════════════════════╝
```

---

## 🔗 ARCHIVOS CLAVE

### Backend
- **Schema:** `/packages/api-nueva/src/noticias/schemas/extracted-noticia.schema.ts`
- **Controller:** `/packages/api-nueva/src/noticias/controllers/noticias.controller.ts`
- **Service:** `/packages/api-nueva/src/noticias/services/noticias-extraction.service.ts`
- **Interfaces:** `/packages/api-nueva/src/noticias/interfaces/noticias.interfaces.ts`

### Frontend
- **Types:** `/packages/mobile-expo/src/types/extracted-content.types.ts`
- **Service:** `/packages/mobile-expo/src/services/extracted-content/extractedContentApi.ts`
- **Hook:** `/packages/mobile-expo/src/hooks/useExtractedContent.ts`
- **Mapper:** `/packages/mobile-expo/src/utils/mappers.ts`

### Documentación
- **Este documento:** `/docs/EXTRACTED_CONTENT_ANALYSIS_2025.md`
- **Referencia:** `/docs/FILTROS_CONTENIDOS_CONTEXT_FEATURE.md`

---

**FIN DEL DOCUMENTO DE ANÁLISIS**

_Documento generado el 10 de Octubre 2025 por análisis técnico exhaustivo del sistema Extracted Content._
