# 📋 Feature: Sistema de Filtrado y Ordenamiento de Contenidos Generados

**Fecha:** 10 de Octubre 2025
**Versión:** 1.0
**Estado:** Planificación Completa

---

## 📊 RESUMEN EJECUTIVO

### Objetivo del Feature
Implementar un sistema completo de filtrado, ordenamiento y paginación para contenidos generados con AI, permitiendo:

1. **Ordenamiento Inteligente:**
   - Primero por fecha de publicación original (si existe)
   - Segundo por fecha de extracción (fallback)
   - Configurable por usuario (desc/asc)

2. **Filtrado Multi-criterio:**
   - Por estado (publicado, borrador, archivado)
   - Por outlet/medio de comunicación
   - Por rango de fechas
   - Por tipo de agente IA
   - Búsqueda de texto

3. **UX Optimizada:**
   - Bottom Sheet con filtros avanzados
   - Chips de filtros activos
   - Paginación infinita con skeleton
   - Pull-to-refresh

---

## 🔍 HALLAZGOS DEL ANÁLISIS

### 1. Backend - Content AI Module

#### ✅ Infraestructura Existente (Muy Sólida)

**Schema: `AIContentGeneration`**
- Ubicación: `/packages/api-nueva/src/content-ai/schemas/ai-content-generation.schema.ts`
- **22 índices** ya configurados (simples + compuestos)
- Campos disponibles para ordenamiento:
  - `generatedAt` (Date) - índice ✅
  - `createdAt` (Date) - sin índice
  - `updatedAt` (Date) - sin índice
  - `publishingInfo.publishedAt` (Date) - índice ✅

**Endpoint Actual:**
```typescript
GET /content-ai/generated
Controller: src/content-ai/controllers/content-ai.controller.ts
DTO: GeneratedContentFiltersDto (extende PaginationDto)
```

**Filtros Ya Implementados:**
- ✅ Estado (status array con $in)
- ✅ Agente, Template, Provider (ObjectId refs)
- ✅ Rango de fechas (dateFrom/dateTo sobre `generatedAt`)
- ✅ Calidad mínima (minQualityScore)
- ✅ Revisión/Publicación (hasReview, isPublished con $exists)
- ✅ Categoría exacta (generatedCategory)
- ✅ Tags (generatedTags con $all)
- ✅ Búsqueda texto (regex case-insensitive)

**Paginación:**
- ✅ Page/Limit validados (max 100)
- ✅ Total count paralelo con Promise.all
- ✅ Metadata: hasNext, hasPrev, totalPages

#### ❌ Funcionalidad Faltante

**1. Ordenamiento Hardcoded**
```typescript
// Actual (línea 287 del service)
.sort({ generatedAt: -1 }) // ❌ Siempre descendente por generatedAt
```

**Necesidad:**
```typescript
// Requerido
.sort({
  originalPublishedAt: -1,  // Primero por fecha de publicación original
  generatedAt: -1           // Luego por fecha de extracción (fallback)
})
```

**2. Campo Denormalizado Faltante**
```typescript
// Schema actual NO tiene:
@Prop()
originalPublishedAt?: Date; // ❌ Necesario para ordenamiento eficiente
```

**Problema:** `publishedAt` está en `ExtractedNoticia` (documento relacionado), no en `AIContentGeneration`. Para ordenar eficientemente SIN aggregation pipeline, necesitamos denormalizar.

**3. Índices Adicionales Necesarios**
```typescript
// Faltan estos índices:
AIContentGenerationSchema.index({ generatedCategory: 1 }); // Para filtrado
AIContentGenerationSchema.index({ generatedTags: 1 }); // Para $all queries
AIContentGenerationSchema.index({
  originalPublishedAt: -1,
  generatedAt: -1
}); // Para ordenamiento híbrido
```

**4. Parámetros de Ordenamiento en DTO**
```typescript
// GeneratedContentFiltersDto NO tiene:
sortBy?: 'generatedAt' | 'publishedAt' | 'title' | 'qualityScore';
sortOrder?: 'asc' | 'desc';
```

---

### 2. Frontend - Mobile App

#### ✅ Arquitectura Existente (Patrón Sólido)

**Patrón Establecido (Referencia: Extracted Content)**
```
API Service → Mapper → TanStack Query Hook → Screen Component
```

**Archivos de Referencia:**
- Screen: `app/(protected)/(tabs)/generate.tsx` (extracted content)
- Hook: `src/hooks/useExtractedContent.ts`
- Service: `src/services/extracted-content/extractedContentApi.ts`
- Mapper: `src/utils/mappers.ts` (ExtractedContentMapper)
- Types: `src/types/extracted-content.types.ts`

**Paginación Implementada:**
- ✅ `useInfiniteQuery` con cursor-based
- ✅ `FlatList` + `onEndReached`
- ✅ Pull-to-refresh con `refetch()`
- ✅ Skeleton loading states
- ✅ Error boundaries con retry

**Componentes UI Disponibles:**
- ✅ `@rn-primitives/button` (5 variants)
- ✅ `@rn-primitives/card`
- ✅ `@rn-primitives/checkbox`
- ✅ `@rn-primitives/switch`
- ✅ `@rn-primitives/separator`
- ✅ `react-native-bottom-sheet` (instalado)

**Stack Técnico:**
- React Native 0.76.5 + Expo SDK 52
- NativeWind (Tailwind CSS)
- TanStack Query v5
- Expo Router v4 (file-based routing)
- Tipografía: Aleo (regular, bold)

#### ❌ Funcionalidad Faltante

**1. NO Existe Lista de Contenidos Generados**
```typescript
// app/(protected)/(tabs)/publish.tsx
// Actualmente es un placeholder vacío
export default function PublishScreen() {
  return <Text>Publish</Text>; // ❌ No implementado
}
```

**2. Hook de Generated Content Falta**
```typescript
// src/hooks/useGeneratedContent.ts
// ❌ NO EXISTE - Necesita crearse siguiendo patrón de useExtractedContent
```

**3. Service API Falta**
```typescript
// src/services/generated-content/generatedContentApi.ts
// ❌ NO EXISTE - Necesita:
// - getGeneratedContent(filters): Fetch paginado
// - Mapper para transformar response
```

**4. Types Falta**
```typescript
// src/types/generated-content.types.ts
// ❌ NO EXISTE - Necesita:
// - GeneratedContent interface
// - GeneratedContentFilters interface
// - PaginatedGeneratedContentResponse
```

**5. Componentes de Filtros NO Existen**
```typescript
// src/components/filters/*
// ❌ TODO POR CREAR:
// - FilterHeader.tsx (search + filter button)
// - ActiveFiltersBar.tsx (chips scrollables)
// - FilterBottomSheet.tsx (opciones avanzadas)
// - ContentCard.tsx (card de contenido generado)
```

---

### 3. UX/UI Design

#### Sistema de Diseño Identificado

**Colores:**
```typescript
const colors = {
  primary: '#f1ef47',        // Amarillo característico
  primaryForeground: '#000', // Texto sobre primary

  background: '#FFFFFF',
  foreground: '#111827',     // Texto principal

  muted: '#F3F4F6',         // Fondo secundario
  mutedForeground: '#6B7280', // Texto secundario

  border: '#E5E7EB',
  accent: '#10B981',        // Verde éxito
  destructive: '#EF4444',   // Rojo error
};
```

**Espaciado:**
```typescript
const spacing = {
  xs: 4,   // 0.25rem
  sm: 8,   // 0.5rem
  md: 12,  // 0.75rem
  lg: 16,  // 1rem
  xl: 20,  // 1.25rem
  '2xl': 24, // 1.5rem
  '3xl': 32, // 2rem
};
```

**Tipografía (Aleo):**
```typescript
const typography = {
  h1: { fontSize: 32, fontFamily: 'Aleo_700Bold', lineHeight: 40 },
  h2: { fontSize: 24, fontFamily: 'Aleo_700Bold', lineHeight: 32 },
  h3: { fontSize: 20, fontFamily: 'Aleo_700Bold', lineHeight: 28 },
  body: { fontSize: 16, fontFamily: 'Aleo_400Regular', lineHeight: 24 },
  caption: { fontSize: 14, fontFamily: 'Aleo_400Regular', lineHeight: 20 },
  small: { fontSize: 12, fontFamily: 'Aleo_400Regular', lineHeight: 16 },
};
```

#### Propuesta UX Diseñada

**Layout Principal:**
```
┌─────────────────────────────────┐
│ [🔍 Buscar...]    [Filtros 🎚️] │ ← Sticky Header
├─────────────────────────────────┤
│ 🏷️ Publicado  🏷️ Outlet1  [×]  │ ← Active Filters (chips)
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 📰 Título del contenido...  │ │
│ │ 📅 Publicado: 09 Oct 2025   │ │ ← Content Card
│ │ 🌐 Síntesis Hidalgo         │ │
│ │ 👤 Agente Reportero         │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ ...                         │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Bottom Sheet de Filtros:**
```
┌─────────────────────────────────┐
│   🎚️ Filtros Avanzados         │
│                                 │
│ Ordenar por:                    │
│ ⚪ Más recientes                │
│ ⚫ Fecha de publicación ↓       │
│ ⚪ Título (A-Z)                 │
│                                 │
│ ─────────────────────────────── │
│ Estado:                         │
│ ☑️ Publicado (12)               │
│ ☐ Borrador (3)                  │
│ ☐ Archivado (7)                 │
│                                 │
│ ─────────────────────────────── │
│ Medio de Comunicación:          │
│ [Seleccionar outlets...] ▼      │
│                                 │
│ ─────────────────────────────── │
│ Rango de Fechas:                │
│ Desde: [09 Oct 2025]            │
│ Hasta: [10 Oct 2025]            │
│                                 │
│ ─────────────────────────────── │
│ [Limpiar]  [Aplicar Filtros]    │
└─────────────────────────────────┘
```

**Flujo de Interacción:**
1. Usuario toca botón "Filtros" → Bottom Sheet sube con animación (300ms)
2. Usuario selecciona filtros → Badge en botón muestra contador
3. Usuario toca "Aplicar" → Sheet baja, chips activos aparecen, lista se actualiza
4. Usuario toca [×] en chip → Filtro se remueve, lista se actualiza
5. Pull-to-refresh → Mantiene filtros activos, actualiza datos

---

## 📐 PLANIFICACIÓN POR FASES

### Fase 1: Backend - Ordenamiento Configurable (2-3 horas)

#### Objetivo
Permitir ordenamiento dinámico por diferentes campos sin denormalización.

#### Tareas

**1.1. Actualizar DTO de Filtros**
- Archivo: `/packages/api-nueva/src/content-ai/dto/generated-content-filters.dto.ts`
- Agregar:
  ```typescript
  @ApiPropertyOptional({
    enum: ['generatedAt', 'publishedAt', 'title', 'qualityScore', 'category'],
    default: 'generatedAt',
  })
  @IsOptional()
  @IsEnum(['generatedAt', 'publishedAt', 'title', 'qualityScore', 'category'])
  sortBy?: 'generatedAt' | 'publishedAt' | 'title' | 'qualityScore' | 'category' = 'generatedAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
  ```

**1.2. Crear Método de Sort Dinámico**
- Archivo: `/packages/api-nueva/src/content-ai/services/content-generation.service.ts`
- Agregar método privado:
  ```typescript
  private buildSortConfig(
    sortBy: string = 'generatedAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Record<string, 1 | -1> {
    const direction = sortOrder === 'asc' ? 1 : -1;

    const sortMap: Record<string, string> = {
      generatedAt: 'generatedAt',
      publishedAt: 'publishingInfo.publishedAt',
      title: 'generatedTitle',
      qualityScore: 'qualityMetrics.humanReviewScore',
      category: 'generatedCategory',
    };

    const field = sortMap[sortBy] || 'generatedAt';

    return {
      [field]: direction,
      generatedAt: -1, // Fallback para desempate
    };
  }
  ```

**1.3. Modificar Método findAllPaginated**
- Reemplazar línea 287:
  ```typescript
  // Antes
  .sort({ generatedAt: -1 })

  // Después
  .sort(this.buildSortConfig(filters.sortBy, filters.sortOrder))
  ```

**1.4. Testing Manual**
- Probar endpoints:
  ```bash
  # Default (generatedAt desc)
  GET /content-ai/generated?page=1&limit=10

  # Ordenar por título A-Z
  GET /content-ai/generated?sortBy=title&sortOrder=asc

  # Ordenar por calidad descendente
  GET /content-ai/generated?sortBy=qualityScore&sortOrder=desc
  ```

**Build:**
```bash
cd /packages/api-nueva && yarn build
```

---

### Fase 2: Backend - Denormalización de Fecha de Publicación (3-4 horas)

#### Objetivo
Agregar campo `originalPublishedAt` al schema para ordenamiento eficiente por fecha de publicación original.

#### Tareas

**2.1. Actualizar Schema**
- Archivo: `/packages/api-nueva/src/content-ai/schemas/ai-content-generation.schema.ts`
- Agregar después de `generatedAt`:
  ```typescript
  @Prop({ type: Date })
  @ApiPropertyOptional({
    description: 'Fecha de publicación del contenido original (denormalizado de ExtractedNoticia)',
    example: '2025-10-09T10:00:00Z'
  })
  originalPublishedAt?: Date;
  ```

**2.2. Agregar Índice Compuesto**
- En el mismo archivo, después de los índices existentes:
  ```typescript
  // Índice para ordenamiento híbrido (publishedAt primero, generatedAt fallback)
  AIContentGenerationSchema.index({
    originalPublishedAt: -1,
    generatedAt: -1
  });
  ```

**2.3. Actualizar Método de Generación de Contenido**
- Archivo: `/packages/api-nueva/src/content-ai/services/content-generation.service.ts`
- Método: `generateContent()` (línea ~150)
- Agregar denormalización:
  ```typescript
  async generateContent(...) {
    // ... código existente ...

    // Populate para obtener publishedAt
    const originalContent = await this.extractedNoticiaModel
      .findById(contentId)
      .select('publishedAt')
      .lean();

    const generatedContent = new this.aiContentGenerationModel({
      // ... campos existentes ...
      originalPublishedAt: originalContent?.publishedAt, // ✅ Denormalizar
    });

    // ... resto del código ...
  }
  ```

**2.4. Script de Migración de Datos Existentes**
- Crear archivo: `/packages/api-nueva/src/content-ai/scripts/migrate-original-published-at.ts`
- Contenido:
  ```typescript
  import { NestFactory } from '@nestjs/core';
  import { AppModule } from '../../app.module';
  import { InjectModel } from '@nestjs/mongoose';
  import { Model } from 'mongoose';
  import { AIContentGeneration } from '../schemas/ai-content-generation.schema';
  import { ExtractedNoticia } from '../../noticias/schemas/extracted-noticia.schema';

  async function migrate() {
    const app = await NestFactory.createApplicationContext(AppModule);

    const aiContentModel = app.get<Model<AIContentGeneration>>('AIContentGenerationModel');
    const extractedModel = app.get<Model<ExtractedNoticia>>('ExtractedNoticiaModel');

    console.log('🚀 Iniciando migración de originalPublishedAt...');

    const contents = await aiContentModel.find({
      originalContentId: { $exists: true },
      originalPublishedAt: { $exists: false }
    });

    console.log(`📊 Encontrados ${contents.length} contenidos a migrar`);

    let updated = 0;
    for (const content of contents) {
      const original = await extractedModel
        .findById(content.originalContentId)
        .select('publishedAt')
        .lean();

      if (original?.publishedAt) {
        await aiContentModel.updateOne(
          { _id: content._id },
          { $set: { originalPublishedAt: original.publishedAt } }
        );
        updated++;
      }
    }

    console.log(`✅ Migración completa: ${updated}/${contents.length} actualizados`);
    await app.close();
  }

  migrate().catch(console.error);
  ```

**2.5. Ejecutar Migración**
```bash
cd /packages/api-nueva
yarn ts-node src/content-ai/scripts/migrate-original-published-at.ts
```

**2.6. Actualizar buildSortConfig para Ordenamiento Híbrido**
- Modificar método `buildSortConfig`:
  ```typescript
  private buildSortConfig(
    sortBy: string = 'generatedAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Record<string, 1 | -1> {
    const direction = sortOrder === 'asc' ? 1 : -1;

    // Si ordena por publishedAt, usar híbrido
    if (sortBy === 'publishedAt') {
      return {
        originalPublishedAt: direction,
        generatedAt: direction, // Mismo orden para fallback
      };
    }

    const sortMap: Record<string, string> = {
      generatedAt: 'generatedAt',
      title: 'generatedTitle',
      qualityScore: 'qualityMetrics.humanReviewScore',
      category: 'generatedCategory',
    };

    const field = sortMap[sortBy] || 'generatedAt';

    return {
      [field]: direction,
      generatedAt: -1, // Fallback para desempate
    };
  }
  ```

**2.7. Testing**
```bash
# Ordenar por fecha de publicación original (descendente)
GET /content-ai/generated?sortBy=publishedAt&sortOrder=desc

# Verificar que contenidos SIN publishedAt usan generatedAt como fallback
GET /content-ai/generated?sortBy=publishedAt&sortOrder=asc&limit=5
```

**Build:**
```bash
cd /packages/api-nueva && yarn build
```

---

### Fase 3: Backend - Índices Adicionales (1 hora)

#### Objetivo
Optimizar performance de queries de filtrado frecuente.

#### Tareas

**3.1. Agregar Índices Simples**
- Archivo: `/packages/api-nueva/src/content-ai/schemas/ai-content-generation.schema.ts`
- Agregar después de índices existentes:
  ```typescript
  // Para filtrado por categoría (frecuente)
  AIContentGenerationSchema.index({ generatedCategory: 1 });

  // Para filtrado por tags ($all queries)
  AIContentGenerationSchema.index({ generatedTags: 1 });

  // Para ordenamiento por título
  AIContentGenerationSchema.index({ generatedTitle: 1 });

  // Índice compuesto para filtrado + ordenamiento frecuente
  AIContentGenerationSchema.index({
    status: 1,
    generatedCategory: 1,
    generatedAt: -1
  });
  ```

**3.2. Rebuild de Índices en MongoDB**
```bash
# Conectar a MongoDB
mongosh "mongodb://localhost:27017/pachuca-noticias"

# Rebuild índices
use pachuca-noticias
db.aicontentgenerations.reIndex()

# Verificar índices creados
db.aicontentgenerations.getIndexes()
```

**3.3. Testing de Performance**
```bash
# Probar query con explain
db.aicontentgenerations.find({
  status: 'completed',
  generatedCategory: 'política'
}).sort({ generatedAt: -1 }).explain('executionStats')

# Verificar que:
# - executionStats.totalKeysExamined ≈ executionStats.nReturned
# - executionStats.executionTimeMillis < 200ms
# - winningPlan.inputStage.indexName incluye el índice compuesto
```

**Build:**
```bash
cd /packages/api-nueva && yarn build
```

---

### Fase 4: Frontend - Types y Mappers (1-2 horas)

#### Objetivo
Crear tipos TypeScript y mapper para transformar responses del backend.

#### Tareas

**4.1. Crear Types de Generated Content**
- Crear archivo: `/packages/mobile-expo/src/types/generated-content.types.ts`
- Contenido:
  ```typescript
  export interface GeneratedContent {
    id: string;
    generatedTitle: string;
    generatedContent: string;
    generatedSummary?: string;
    generatedCategory?: string;
    generatedTags: string[];

    // Fechas
    generatedAt: Date;
    originalPublishedAt?: Date;

    // Estado
    status: 'pending' | 'generating' | 'completed' | 'failed' | 'reviewing' | 'approved' | 'rejected';

    // Relaciones
    originalContent?: {
      id: string;
      title: string;
      sourceUrl: string;
      publishedAt?: Date;
    };

    agent?: {
      id: string;
      name: string;
      agentType: string;
    };

    template?: {
      id: string;
      name: string;
      type: string;
    };

    provider?: {
      id: string;
      name: string;
      model: string;
    };

    // Métricas
    qualityMetrics?: {
      humanReviewScore?: number;
      readabilityScore?: number;
      seoScore?: number;
      userRating?: number;
    };

    // Publicación
    publishingInfo?: {
      publishedAt?: Date;
      publishedBy?: string;
      platformUrl?: string;
    };

    // Metadata
    createdAt: Date;
    updatedAt: Date;
  }

  export interface GeneratedContentFilters {
    page?: number;
    limit?: number;

    // Ordenamiento
    sortBy?: 'generatedAt' | 'publishedAt' | 'title' | 'qualityScore' | 'category';
    sortOrder?: 'asc' | 'desc';

    // Filtros
    status?: Array<'pending' | 'generating' | 'completed' | 'failed' | 'reviewing' | 'approved' | 'rejected'>;
    agentId?: string;
    templateId?: string;
    providerId?: string;
    category?: string;
    tags?: string[];

    // Fechas
    dateFrom?: string; // ISO string
    dateTo?: string;

    // Calidad
    minQualityScore?: number;

    // Booleanos
    hasReview?: boolean;
    isPublished?: boolean;

    // Búsqueda
    search?: string;
  }

  export interface PaginatedGeneratedContentResponse {
    data: GeneratedContent[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }
  ```

**4.2. Crear Mapper en mappers.ts**
- Archivo: `/packages/mobile-expo/src/utils/mappers.ts`
- Agregar al final del archivo:
  ```typescript
  export class GeneratedContentMapper {
    static toApp(apiResponse: Record<string, unknown>): GeneratedContent {
      const original = apiResponse.originalContentId as Record<string, unknown> | undefined;
      const agent = apiResponse.agentId as Record<string, unknown> | undefined;
      const template = apiResponse.templateId as Record<string, unknown> | undefined;
      const provider = apiResponse.providerId as Record<string, unknown> | undefined;
      const qualityMetrics = apiResponse.qualityMetrics as Record<string, unknown> | undefined;
      const publishingInfo = apiResponse.publishingInfo as Record<string, unknown> | undefined;

      return {
        id: apiResponse._id as string,
        generatedTitle: apiResponse.generated_title as string,
        generatedContent: apiResponse.generated_content as string,
        generatedSummary: apiResponse.generated_summary as string | undefined,
        generatedCategory: apiResponse.generated_category as string | undefined,
        generatedTags: (apiResponse.generated_tags as string[]) || [],

        generatedAt: new Date(apiResponse.generated_at as string),
        originalPublishedAt: apiResponse.original_published_at
          ? new Date(apiResponse.original_published_at as string)
          : undefined,

        status: apiResponse.status as GeneratedContent['status'],

        originalContent: original ? {
          id: original._id as string,
          title: original.title as string,
          sourceUrl: original.source_url as string,
          publishedAt: original.published_at ? new Date(original.published_at as string) : undefined,
        } : undefined,

        agent: agent ? {
          id: agent._id as string,
          name: agent.name as string,
          agentType: agent.agent_type as string,
        } : undefined,

        template: template ? {
          id: template._id as string,
          name: template.name as string,
          type: template.type as string,
        } : undefined,

        provider: provider ? {
          id: provider._id as string,
          name: provider.name as string,
          model: provider.model as string,
        } : undefined,

        qualityMetrics: qualityMetrics ? {
          humanReviewScore: qualityMetrics.human_review_score as number | undefined,
          readabilityScore: qualityMetrics.readability_score as number | undefined,
          seoScore: qualityMetrics.seo_score as number | undefined,
          userRating: qualityMetrics.user_rating as number | undefined,
        } : undefined,

        publishingInfo: publishingInfo ? {
          publishedAt: publishingInfo.published_at
            ? new Date(publishingInfo.published_at as string)
            : undefined,
          publishedBy: publishingInfo.published_by as string | undefined,
          platformUrl: publishingInfo.platform_url as string | undefined,
        } : undefined,

        createdAt: new Date(apiResponse.created_at as string),
        updatedAt: new Date(apiResponse.updated_at as string),
      };
    }

    static paginatedToApp(
      apiResponse: Record<string, unknown>
    ): PaginatedGeneratedContentResponse {
      const data = apiResponse.data as Array<Record<string, unknown>>;
      const pagination = apiResponse.pagination as Record<string, unknown>;

      return {
        data: data.map(item => GeneratedContentMapper.toApp(item)),
        pagination: {
          page: pagination.page as number,
          limit: pagination.limit as number,
          total: pagination.total as number,
          totalPages: pagination.total_pages as number,
          hasNext: pagination.has_next as boolean,
          hasPrev: pagination.has_prev as boolean,
        },
      };
    }
  }
  ```

**NO hay build en esta fase (solo TypeScript types).**

---

### Fase 5: Frontend - API Service (1 hora)

#### Objetivo
Crear servicio API para comunicarse con el backend.

#### Tareas

**5.1. Crear Service de Generated Content**
- Crear directorio: `/packages/mobile-expo/src/services/generated-content/`
- Crear archivo: `generatedContentApi.ts`
- Contenido:
  ```typescript
  import { ApiClient } from '../api/ApiClient';
  import { GeneratedContentMapper } from '@/src/utils/mappers';
  import type {
    GeneratedContent,
    GeneratedContentFilters,
    PaginatedGeneratedContentResponse
  } from '@/src/types/generated-content.types';

  /**
   * 🤖 Generated Content API Service
   * Servicio para gestión de contenidos generados con IA
   */
  export const generatedContentApi = {
    /**
     * Obtener lista paginada de contenidos generados con filtros
     * GET /content-ai/generated
     */
    getGeneratedContent: async (
      filters: GeneratedContentFilters = {}
    ): Promise<PaginatedGeneratedContentResponse> => {
      const rawClient = ApiClient.getRawClient();

      // Construir query params
      const params: Record<string, string | number | boolean> = {};

      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;
      if (filters.sortBy) params.sortBy = filters.sortBy;
      if (filters.sortOrder) params.sortOrder = filters.sortOrder;

      if (filters.status && filters.status.length > 0) {
        params.status = filters.status.join(',');
      }
      if (filters.agentId) params.agentId = filters.agentId;
      if (filters.templateId) params.templateId = filters.templateId;
      if (filters.providerId) params.providerId = filters.providerId;
      if (filters.category) params.category = filters.category;
      if (filters.tags && filters.tags.length > 0) {
        params.tags = filters.tags.join(',');
      }

      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;

      if (filters.minQualityScore !== undefined) {
        params.minQualityScore = filters.minQualityScore;
      }
      if (filters.hasReview !== undefined) {
        params.hasReview = filters.hasReview;
      }
      if (filters.isPublished !== undefined) {
        params.isPublished = filters.isPublished;
      }

      if (filters.search) params.search = filters.search;

      const response = await rawClient.get<Record<string, unknown>>(
        '/content-ai/generated',
        { params }
      );

      return GeneratedContentMapper.paginatedToApp(response.data);
    },

    /**
     * Obtener contenido generado por ID
     * GET /content-ai/generated/:id
     */
    getGeneratedContentById: async (id: string): Promise<GeneratedContent> => {
      const rawClient = ApiClient.getRawClient();

      const response = await rawClient.get<Record<string, unknown>>(
        `/content-ai/generated/${id}`
      );

      return GeneratedContentMapper.toApp(response.data);
    },
  };
  ```

**NO hay build en esta fase.**

---

### Fase 6: Frontend - TanStack Query Hook (1 hora)

#### Objetivo
Crear hook con TanStack Query para gestión de estado y paginación.

#### Tareas

**6.1. Crear Hook useGeneratedContent**
- Crear archivo: `/packages/mobile-expo/src/hooks/useGeneratedContent.ts`
- Contenido:
  ```typescript
  import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
  import { generatedContentApi } from '@/src/services/generated-content/generatedContentApi';
  import type { GeneratedContentFilters } from '@/src/types/generated-content.types';

  /**
   * 🔑 Query Keys para Generated Content
   */
  export const generatedContentKeys = {
    all: ['generated-content'] as const,
    lists: () => [...generatedContentKeys.all, 'list'] as const,
    list: (filters: GeneratedContentFilters) =>
      [...generatedContentKeys.lists(), filters] as const,
    details: () => [...generatedContentKeys.all, 'detail'] as const,
    detail: (id: string) => [...generatedContentKeys.details(), id] as const,
  };

  /**
   * Hook para obtener lista paginada de contenidos generados (infinite scroll)
   */
  export function useGeneratedContentList(filters: GeneratedContentFilters = {}) {
    return useInfiniteQuery({
      queryKey: generatedContentKeys.list(filters),
      queryFn: ({ pageParam = 1 }) =>
        generatedContentApi.getGeneratedContent({
          ...filters,
          page: pageParam,
          limit: filters.limit || 20,
        }),
      getNextPageParam: (lastPage) => {
        if (lastPage.pagination.hasNext) {
          return lastPage.pagination.page + 1;
        }
        return undefined;
      },
      initialPageParam: 1,
      staleTime: 30 * 1000, // 30 segundos
      gcTime: 5 * 60 * 1000, // 5 minutos
    });
  }

  /**
   * Hook para obtener detalle de un contenido generado
   */
  export function useGeneratedContentDetail(id: string) {
    return useQuery({
      queryKey: generatedContentKeys.detail(id),
      queryFn: () => generatedContentApi.getGeneratedContentById(id),
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
      enabled: !!id, // Solo ejecutar si hay ID
    });
  }

  /**
   * Hook para invalidar queries de generated content
   */
  export function useInvalidateGeneratedContent() {
    const queryClient = useQueryClient();

    return {
      invalidateList: () =>
        queryClient.invalidateQueries({
          queryKey: generatedContentKeys.lists()
        }),
      invalidateDetail: (id: string) =>
        queryClient.invalidateQueries({
          queryKey: generatedContentKeys.detail(id)
        }),
      invalidateAll: () =>
        queryClient.invalidateQueries({
          queryKey: generatedContentKeys.all
        }),
    };
  }
  ```

**NO hay build en esta fase.**

---

### Fase 7: Frontend - Componentes UI Base (2-3 horas)

#### Objetivo
Crear componentes de UI reutilizables para filtros y cards.

#### Tareas

**7.1. Crear FilterHeader Component**
- Crear archivo: `/packages/mobile-expo/src/components/filters/FilterHeader.tsx`
- Contenido:
  ```typescript
  import { View, TextInput } from 'react-native';
  import { useState } from 'react';
  import { Search, SlidersHorizontal } from 'lucide-react-native';
  import { Button } from '@/components/ui/button';
  import { Badge } from '@/components/ui/badge';

  interface FilterHeaderProps {
    searchValue: string;
    onSearchChange: (value: string) => void;
    onFilterPress: () => void;
    activeFiltersCount: number;
  }

  export function FilterHeader({
    searchValue,
    onSearchChange,
    onFilterPress,
    activeFiltersCount,
  }: FilterHeaderProps) {
    return (
      <View className="flex-row items-center gap-3 px-4 py-3 bg-white border-b border-border">
        {/* Search Input */}
        <View className="flex-1 flex-row items-center bg-muted rounded-lg px-3 py-2.5">
          <Search size={20} color="#6B7280" />
          <TextInput
            className="flex-1 ml-2 text-base font-aleo-regular text-foreground"
            placeholder="Buscar contenidos..."
            placeholderTextColor="#9CA3AF"
            value={searchValue}
            onChangeText={onSearchChange}
            returnKeyType="search"
          />
        </View>

        {/* Filter Button */}
        <View className="relative">
          <Button
            variant="outline"
            size="icon"
            onPress={onFilterPress}
          >
            <SlidersHorizontal size={20} color="#111827" />
          </Button>

          {/* Badge de filtros activos */}
          {activeFiltersCount > 0 && (
            <View className="absolute -top-2 -right-2">
              <Badge variant="default" className="min-w-[20px] h-5 rounded-full">
                <Text className="text-xs font-aleo-bold">{activeFiltersCount}</Text>
              </Badge>
            </View>
          )}
        </View>
      </View>
    );
  }
  ```

**7.2. Crear ActiveFiltersBar Component**
- Crear archivo: `/packages/mobile-expo/src/components/filters/ActiveFiltersBar.tsx`
- Contenido:
  ```typescript
  import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
  import { X } from 'lucide-react-native';

  export interface ActiveFilter {
    key: string;
    label: string;
    value: string | number | boolean;
  }

  interface ActiveFiltersBarProps {
    filters: ActiveFilter[];
    onRemove: (key: string) => void;
    onClearAll: () => void;
  }

  export function ActiveFiltersBar({ filters, onRemove, onClearAll }: ActiveFiltersBarProps) {
    if (filters.length === 0) return null;

    return (
      <View className="bg-muted border-b border-border">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-4 py-2.5 gap-2"
        >
          {filters.map((filter) => (
            <View
              key={filter.key}
              className="flex-row items-center bg-white rounded-full px-3 py-1.5 border border-border"
            >
              <Text className="text-sm font-aleo-regular text-foreground mr-1.5">
                {filter.label}
              </Text>
              <TouchableOpacity
                onPress={() => onRemove(filter.key)}
                activeOpacity={0.7}
              >
                <X size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          ))}

          {/* Botón Limpiar Todo */}
          {filters.length > 1 && (
            <TouchableOpacity
              onPress={onClearAll}
              activeOpacity={0.7}
              className="bg-destructive rounded-full px-3 py-1.5"
            >
              <Text className="text-sm font-aleo-bold text-white">
                Limpiar todo
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  }
  ```

**7.3. Crear ContentCard Component**
- Crear archivo: `/packages/mobile-expo/src/components/generated/ContentCard.tsx`
- Contenido:
  ```typescript
  import { View, Text, TouchableOpacity } from 'react-native';
  import { Calendar, Globe, User, Star } from 'lucide-react-native';
  import { useRouter } from 'expo-router';
  import { Badge } from '@/components/ui/badge';
  import type { GeneratedContent } from '@/src/types/generated-content.types';
  import { format } from 'date-fns';
  import { es } from 'date-fns/locale';

  interface ContentCardProps {
    content: GeneratedContent;
  }

  export function ContentCard({ content }: ContentCardProps) {
    const router = useRouter();

    const statusColors = {
      completed: 'bg-accent',
      approved: 'bg-accent',
      pending: 'bg-yellow-500',
      generating: 'bg-blue-500',
      reviewing: 'bg-purple-500',
      failed: 'bg-destructive',
      rejected: 'bg-destructive',
    };

    const statusLabels = {
      completed: 'Completado',
      approved: 'Aprobado',
      pending: 'Pendiente',
      generating: 'Generando...',
      reviewing: 'En revisión',
      failed: 'Fallido',
      rejected: 'Rechazado',
    };

    const displayDate = content.originalPublishedAt || content.generatedAt;
    const dateLabel = content.originalPublishedAt ? 'Publicado' : 'Generado';

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push(`/generated/${content.id}`)}
        className="bg-white rounded-xl border border-border p-4 mb-3 mx-4"
      >
        {/* Header con Badge de Estado */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-2">
            <Text className="text-lg font-aleo-bold text-foreground" numberOfLines={2}>
              {content.generatedTitle}
            </Text>
          </View>
          <Badge className={statusColors[content.status]}>
            <Text className="text-xs font-aleo-bold text-white">
              {statusLabels[content.status]}
            </Text>
          </Badge>
        </View>

        {/* Summary */}
        {content.generatedSummary && (
          <Text className="text-sm font-aleo-regular text-muted-foreground mb-3" numberOfLines={3}>
            {content.generatedSummary}
          </Text>
        )}

        {/* Metadata */}
        <View className="gap-2">
          {/* Fecha */}
          <View className="flex-row items-center">
            <Calendar size={16} color="#6B7280" />
            <Text className="text-sm font-aleo-regular text-muted-foreground ml-2">
              {dateLabel}: {format(displayDate, "d 'de' MMMM, yyyy", { locale: es })}
            </Text>
          </View>

          {/* Outlet Original */}
          {content.originalContent && (
            <View className="flex-row items-center">
              <Globe size={16} color="#6B7280" />
              <Text className="text-sm font-aleo-regular text-muted-foreground ml-2" numberOfLines={1}>
                {new URL(content.originalContent.sourceUrl).hostname}
              </Text>
            </View>
          )}

          {/* Agente */}
          {content.agent && (
            <View className="flex-row items-center">
              <User size={16} color="#6B7280" />
              <Text className="text-sm font-aleo-regular text-muted-foreground ml-2">
                {content.agent.name}
              </Text>
            </View>
          )}

          {/* Calidad */}
          {content.qualityMetrics?.humanReviewScore && (
            <View className="flex-row items-center">
              <Star size={16} color="#F59E0B" />
              <Text className="text-sm font-aleo-regular text-muted-foreground ml-2">
                Calidad: {content.qualityMetrics.humanReviewScore}/10
              </Text>
            </View>
          )}
        </View>

        {/* Categoría y Tags */}
        {(content.generatedCategory || content.generatedTags.length > 0) && (
          <View className="flex-row flex-wrap gap-2 mt-3">
            {content.generatedCategory && (
              <Badge variant="secondary">
                <Text className="text-xs font-aleo-regular">
                  {content.generatedCategory}
                </Text>
              </Badge>
            )}
            {content.generatedTags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline">
                <Text className="text-xs font-aleo-regular">
                  #{tag}
                </Text>
              </Badge>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  }
  ```

**NO hay build en esta fase.**

---

### Fase 8: Frontend - Bottom Sheet de Filtros (3-4 horas)

#### Objetivo
Crear Bottom Sheet con todos los controles de filtrado avanzado.

#### Tareas

**8.1. Instalar Dependencias Adicionales**
```bash
cd /packages/mobile-expo
npx expo install react-native-date-picker
```

**8.2. Crear FilterBottomSheet Component**
- Crear archivo: `/packages/mobile-expo/src/components/filters/FilterBottomSheet.tsx`
- Contenido muy extenso (300+ líneas), incluye:
  - Sección de Ordenamiento (radio buttons)
  - Sección de Estado (checkboxes múltiples)
  - Sección de Outlet (select modal)
  - Sección de Rango de Fechas (date pickers)
  - Sección de Tipo de Agente (dropdown)
  - Botones Limpiar y Aplicar

**Estructura básica:**
```typescript
import BottomSheet, { BottomSheetView, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { View, Text, TouchableOpacity } from 'react-native';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import DatePicker from 'react-native-date-picker';
import type { GeneratedContentFilters } from '@/src/types/generated-content.types';

export interface FilterBottomSheetRef {
  open: () => void;
  close: () => void;
}

interface FilterBottomSheetProps {
  initialFilters: GeneratedContentFilters;
  onApply: (filters: GeneratedContentFilters) => void;
  outlets: Array<{ id: string; name: string }>; // Para select de outlets
  agents: Array<{ id: string; name: string; type: string }>; // Para select de agentes
}

export const FilterBottomSheet = forwardRef<FilterBottomSheetRef, FilterBottomSheetProps>(
  ({ initialFilters, onApply, outlets, agents }, ref) => {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const [tempFilters, setTempFilters] = useState(initialFilters);

    useImperativeHandle(ref, () => ({
      open: () => bottomSheetRef.current?.expand(),
      close: () => bottomSheetRef.current?.close(),
    }));

    // ... resto de la implementación con todas las secciones ...
  }
);
```

**NO hay build en esta fase.**

---

### Fase 9: Frontend - Screen Principal (2-3 horas)

#### Objetivo
Implementar pantalla completa con lista, filtros y paginación infinita.

#### Tareas

**9.1. Actualizar Publish Screen**
- Archivo: `/packages/mobile-expo/app/(protected)/(tabs)/publish.tsx`
- Contenido completo:
  ```typescript
  import { View, FlatList, Text, ActivityIndicator, RefreshControl } from 'react-native';
  import { useState, useRef, useCallback } from 'react';
  import { Stack } from 'expo-router';
  import { useGeneratedContentList } from '@/src/hooks/useGeneratedContent';
  import { FilterHeader } from '@/src/components/filters/FilterHeader';
  import { ActiveFiltersBar, type ActiveFilter } from '@/src/components/filters/ActiveFiltersBar';
  import { ContentCard } from '@/src/components/generated/ContentCard';
  import { FilterBottomSheet, type FilterBottomSheetRef } from '@/src/components/filters/FilterBottomSheet';
  import type { GeneratedContentFilters, GeneratedContent } from '@/src/types/generated-content.types';

  export default function PublishScreen() {
    const [filters, setFilters] = useState<GeneratedContentFilters>({
      sortBy: 'publishedAt',
      sortOrder: 'desc',
      limit: 20,
    });
    const [searchText, setSearchText] = useState('');
    const filterSheetRef = useRef<FilterBottomSheetRef>(null);

    const {
      data,
      isLoading,
      isError,
      error,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
      refetch,
      isRefetching,
    } = useGeneratedContentList(filters);

    // Flat list de contenidos de todas las páginas
    const contents = data?.pages.flatMap(page => page.data) || [];

    // Calcular filtros activos para chips
    const activeFilters: ActiveFilter[] = [];
    if (filters.status && filters.status.length > 0) {
      activeFilters.push({
        key: 'status',
        label: `Estado: ${filters.status.join(', ')}`,
        value: filters.status,
      });
    }
    // ... más filtros activos ...

    const handleApplyFilters = useCallback((newFilters: GeneratedContentFilters) => {
      setFilters(newFilters);
      filterSheetRef.current?.close();
    }, []);

    const handleRemoveFilter = useCallback((key: string) => {
      setFilters(prev => {
        const updated = { ...prev };
        delete updated[key as keyof GeneratedContentFilters];
        return updated;
      });
    }, []);

    const handleClearAllFilters = useCallback(() => {
      setFilters({
        sortBy: 'publishedAt',
        sortOrder: 'desc',
        limit: 20,
      });
    }, []);

    const renderItem = useCallback(({ item }: { item: GeneratedContent }) => (
      <ContentCard content={item} />
    ), []);

    const renderFooter = () => {
      if (!isFetchingNextPage) return null;
      return (
        <View className="py-4">
          <ActivityIndicator size="small" color="#f1ef47" />
        </View>
      );
    };

    const renderEmpty = () => {
      if (isLoading) return null;
      return (
        <View className="flex-1 justify-center items-center py-12 px-6">
          <Text className="text-xl font-aleo-bold text-foreground mb-2">
            No hay contenidos
          </Text>
          <Text className="text-sm font-aleo-regular text-muted-foreground text-center">
            {activeFilters.length > 0
              ? 'Intenta ajustar los filtros'
              : 'Aún no se han generado contenidos'}
          </Text>
        </View>
      );
    };

    return (
      <View className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />

        <FilterHeader
          searchValue={searchText}
          onSearchChange={setSearchText}
          onFilterPress={() => filterSheetRef.current?.open()}
          activeFiltersCount={activeFilters.length}
        />

        <ActiveFiltersBar
          filters={activeFilters}
          onRemove={handleRemoveFilter}
          onClearAll={handleClearAllFilters}
        />

        <FlatList
          data={contents}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#f1ef47"
            />
          }
          contentContainerStyle={{ paddingVertical: 12 }}
        />

        <FilterBottomSheet
          ref={filterSheetRef}
          initialFilters={filters}
          onApply={handleApplyFilters}
          outlets={[]} // TODO: Cargar outlets reales
          agents={[]} // TODO: Cargar agentes reales
        />
      </View>
    );
  }
  ```

**NO hay build en esta fase.**

---

### Fase 10: Testing y Polish (2 horas)

#### Objetivo
Probar flujo completo y ajustar detalles de UX.

#### Tareas

**10.1. Testing Manual - Backend**
```bash
# 1. Ordenamiento por fecha de publicación
curl "http://localhost:3000/content-ai/generated?sortBy=publishedAt&sortOrder=desc&limit=10"

# 2. Filtrado + Ordenamiento
curl "http://localhost:3000/content-ai/generated?status=completed,approved&sortBy=qualityScore&sortOrder=desc"

# 3. Búsqueda + Paginación
curl "http://localhost:3000/content-ai/generated?search=política&page=2&limit=20"

# 4. Verificar que contenidos sin publishedAt usan generatedAt
curl "http://localhost:3000/content-ai/generated?sortBy=publishedAt&sortOrder=asc" | jq '.data[0:5] | .[] | {title, originalPublishedAt, generatedAt}'
```

**10.2. Testing Manual - Frontend**
- [ ] Scroll infinito funciona correctamente
- [ ] Pull-to-refresh actualiza datos
- [ ] Bottom Sheet abre/cierra suavemente
- [ ] Filtros se aplican correctamente
- [ ] Chips de filtros activos funcionan
- [ ] Búsqueda debounced (300ms)
- [ ] Loading states se muestran
- [ ] Empty states se muestran
- [ ] Error handling con retry

**10.3. Ajustes de Performance**
- [ ] Verificar que FlatList usa `removeClippedSubviews`
- [ ] Verificar que queries tienen `staleTime` configurado
- [ ] Verificar que no hay re-renders innecesarios
- [ ] Probar con 100+ items para verificar virtualización

**10.4. Ajustes de UX**
- [ ] Haptic feedback en acciones (aplicar filtros, remover chip)
- [ ] Animaciones suaves (Bottom Sheet, chips)
- [ ] Contraste de colores accesible
- [ ] Touch targets > 44px
- [ ] Mensajes de error claros

**NO hay build final - solo testing.**

---

## 🎯 CHECKLIST FINAL DE IMPLEMENTACIÓN

### Backend
- [ ] Fase 1: Ordenamiento configurable (sortBy, sortOrder) - 2-3h
- [ ] Fase 2: Denormalización originalPublishedAt + migración - 3-4h
- [ ] Fase 3: Índices adicionales (category, tags, compuestos) - 1h
- [ ] Build: `yarn build` en `/packages/api-nueva`

### Frontend
- [ ] Fase 4: Types y Mappers (GeneratedContent, filters) - 1-2h
- [ ] Fase 5: API Service (generatedContentApi.ts) - 1h
- [ ] Fase 6: TanStack Query Hook (useGeneratedContent) - 1h
- [ ] Fase 7: Componentes UI base (FilterHeader, ActiveFiltersBar, ContentCard) - 2-3h
- [ ] Fase 8: FilterBottomSheet completo - 3-4h
- [ ] Fase 9: Screen principal (publish.tsx) - 2-3h
- [ ] Fase 10: Testing y polish - 2h

### Tiempo Total Estimado
- Backend: 6-8 horas
- Frontend: 10-13 horas
- **Total: 16-21 horas** (2-3 días de trabajo)

---

## 🚫 RESTRICCIONES TÉCNICAS (CRÍTICAS)

### Backend (NestJS)
1. ❌ **NO usar `forwardRef()`** → Usar EventEmitter2 para referencias circulares
2. ❌ **NO usar `any` types** → Tipar correctamente TODO
3. ✅ Extender `PaginationDto` para consistencia
4. ✅ Usar `@Transform()` decorators para conversión de tipos
5. ✅ Validar con `class-validator` todos los query params
6. ✅ Documentar con `@ApiPropertyOptional()` para Swagger
7. ✅ Usar índices compuestos para queries frecuentes
8. ✅ Limitar resultados a máximo 100 por página

### Frontend (React Native)
1. ❌ **NO usar `any` types** → Tipar correctamente TODO
2. ✅ Seguir patrón: API Service → Mapper → TanStack Query Hook → Component
3. ✅ Usar `ApiClient.getRawClient()` para requests
4. ✅ Mappers transforman snake_case → camelCase
5. ✅ TanStack Query con `useInfiniteQuery` para paginación
6. ✅ FlatList con `onEndReached` para scroll infinito
7. ✅ Pull-to-refresh con `refetch()`
8. ✅ Componentes de `@rn-primitives` para UI

### General
1. ❌ **NO levantar servidores** (ya están corriendo)
2. ❌ **NO verificar lint/tsc por ahora** (se hará después)
3. ✅ Build solo en backend cuando se modifica API
4. ✅ Builds deben ser exitosos antes de continuar
5. ✅ Commit después de cada fase completada

---

## 📝 NOTAS ADICIONALES

### Performance MongoDB
- Queries con índices: < 200ms
- Full scan prohibido en producción
- Usar `.explain('executionStats')` para verificar
- `totalKeysExamined` ≈ `nReturned` (uso eficiente de índices)

### Cache Strategy
- TanStack Query `staleTime`: 30s para listas, 5min para detalles
- TanStack Query `gcTime`: 5min para listas, 10min para detalles
- Pull-to-refresh invalida cache completo
- Filtros cambiados invalidan cache anterior

### Debouncing
- Búsqueda de texto: 300ms debounce
- Filtros: Aplicar solo al presionar "Aplicar Filtros"
- NO aplicar filtros en tiempo real (mala UX + performance)

### Accesibilidad
- Touch targets: Mínimo 44x44px
- Contraste: Ratio > 4.5:1 (WCAG AA)
- Labels semánticos en todos los controles
- Focus navigation con teclado (tablet)

---

## 🎨 WIREFRAME ASCII COMPLETO

```
┌───────────────────────────────────────────┐
│ ← Publicar                                │ ← Header
├───────────────────────────────────────────┤
│ [🔍 Buscar...]          [Filtros 🎚️ (3)] │ ← FilterHeader (sticky)
├───────────────────────────────────────────┤
│ 🏷️ Publicado  🏷️ Síntesis  🏷️ Oct [×] │ ← ActiveFiltersBar (scroll horizontal)
├───────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐   │
│ │ 📰 Gobierno anuncia nuevas medidas  │   │
│ │    para impulsar la economía...     │   │ ← ContentCard
│ │ ────────────────────────────────────│   │
│ │ 📅 Publicado: 09 Oct 2025           │   │
│ │ 🌐 Síntesis Hidalgo                 │   │
│ │ 👤 Agente Reportero                  │   │
│ │ ⭐ Calidad: 8.5/10                  │   │
│ │ 🏷️ política  🏷️ economía           │   │
│ └─────────────────────────────────────┘   │
│ ┌─────────────────────────────────────┐   │
│ │ 📰 Se inaugura nueva infraestructura│   │
│ │    en Pachuca para el transporte... │   │
│ │ ────────────────────────────────────│   │
│ │ 📅 Generado: 09 Oct 2025            │   │ ← Sin publishedAt
│ │ 🌐 La Crónica Hidalgo               │   │
│ │ 👤 Agente Columnista                 │   │
│ └─────────────────────────────────────┘   │
│ ┌─────────────────────────────────────┐   │
│ │ ...más contenidos...                │   │
│ └─────────────────────────────────────┘   │
│                                           │
│        [○ Cargando más...]                │ ← isFetchingNextPage
└───────────────────────────────────────────┘

╔═══════════════════════════════════════════╗
║  🎚️ Filtros Avanzados                    ║ ← Bottom Sheet
╠═══════════════════════════════════════════╣
║                                           ║
║  Ordenar por:                             ║
║  ⚪ Más recientes (generatedAt ↓)        ║
║  ⚫ Fecha de publicación ↓               ║
║  ⚪ Título (A-Z)                          ║
║  ⚪ Calidad (mejor primero)               ║
║                                           ║
║  ─────────────────────────────────────   ║
║  Estado:                                  ║
║  ☑️ Publicado (12)                        ║
║  ☑️ Aprobado (5)                          ║
║  ☐ Borrador (3)                           ║
║  ☐ En revisión (2)                        ║
║  ☐ Archivado (7)                          ║
║                                           ║
║  ─────────────────────────────────────   ║
║  Medio de Comunicación:                   ║
║  [Seleccionar outlets...] ▼               ║
║                                           ║
║  ─────────────────────────────────────   ║
║  Rango de Fechas:                         ║
║  Desde: [09 Oct 2025] 📅                 ║
║  Hasta: [10 Oct 2025] 📅                 ║
║                                           ║
║  ─────────────────────────────────────   ║
║  Tipo de Agente:                          ║
║  [Todos los agentes] ▼                    ║
║                                           ║
║  ═════════════════════════════════════   ║
║  [Limpiar]        [Aplicar Filtros]       ║
╚═══════════════════════════════════════════╝
```

---

## 🔗 ARCHIVOS CLAVE PARA REFERENCIA

### Backend
- Schema: `/packages/api-nueva/src/content-ai/schemas/ai-content-generation.schema.ts`
- Controller: `/packages/api-nueva/src/content-ai/controllers/content-ai.controller.ts`
- Service: `/packages/api-nueva/src/content-ai/services/content-generation.service.ts`
- DTO Filtros: `/packages/api-nueva/src/content-ai/dto/generated-content-filters.dto.ts`
- DTO Paginación: `/packages/api-nueva/src/common/dto/pagination.dto.ts`

### Frontend
- Screen: `/packages/mobile-expo/app/(protected)/(tabs)/publish.tsx`
- Hook: `/packages/mobile-expo/src/hooks/useGeneratedContent.ts`
- Service: `/packages/mobile-expo/src/services/generated-content/generatedContentApi.ts`
- Types: `/packages/mobile-expo/src/types/generated-content.types.ts`
- Mapper: `/packages/mobile-expo/src/utils/mappers.ts`
- Componentes: `/packages/mobile-expo/src/components/filters/*`

### Documentación
- Este documento: `/docs/FILTROS_CONTENIDOS_CONTEXT_FEATURE.md`
- UX Design: `/docs/FILTRADO_CONTENIDOS_UX_DESIGN.md`

---

**FIN DEL DOCUMENTO DE PLANIFICACIÓN**

_Documento generado el 10 de Octubre 2025 por Jarvis con análisis de 3 agentes especializados (Backend Architect, Frontend Developer, UI/UX Designer)._
