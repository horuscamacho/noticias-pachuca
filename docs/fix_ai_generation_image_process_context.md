# Fix AI Image Generation Process - Context Document

**Fecha:** 11 Octubre 2025
**Proyecto:** Pachuca Noticias - Mobile Expo App
**Feature:** Generación de Imágenes con IA (Image Generation)
**Referencia:** Patrón correcto implementado en módulo Outlets

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Patrón Correcto (Outlets Reference)](#patrón-correcto-outlets-reference)
3. [Issues Críticos Identificados](#issues-críticos-identificados)
4. [Issues High Priority](#issues-high-priority)
5. [Issues Medium/Low Priority](#issues-mediumlow-priority)
6. [Análisis de Causa Raíz](#análisis-de-causa-raíz)
7. [Archivos Afectados](#archivos-afectados)
8. [Plan de Acción por Fases](#plan-de-acción-por-fases)
9. [Impacto Estimado](#impacto-estimado)
10. [Referencias](#referencias)

---

## 📊 RESUMEN EJECUTIVO

### Problema Principal
La implementación del feature de generación de imágenes con IA **viola múltiples patrones arquitectónicos** establecidos en el módulo de Outlets, causando que la funcionalidad esté **completamente rota**.

### Hallazgos
- **24 issues identificados**
- **8 CRITICAL** - Feature no funciona
- **9 HIGH** - Mantenimiento y performance afectados
- **5 MEDIUM** - UX degradada
- **2 LOW** - Polish y logging

### Impacto
- ❌ Generación de imágenes **NO funciona**
- ❌ UI **NO renderiza** estados correctamente
- ❌ Cache **NO se utiliza** eficientemente
- ❌ Código **altamente duplicado** y difícil de mantener

### Causa Raíz
1. No se entendió cómo `ApiClient` unwraps responses
2. Over-engineering con namespace API innecesario (backend usa camelCase)
3. Mappers redundantes que no transforman nada
4. Screens referencian propiedades que no existen en types

---

## 🎯 PATRÓN CORRECTO (Outlets Reference)

### Arquitectura de Capas

```
┌─────────────────────────────────────────────────────────────┐
│ Component/Screen                                            │
│ - Uses React Query hooks                                    │
│ - Consumes App.* types (camelCase)                          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ Custom Hook (useOutlets, useOutletById, etc.)               │
│ - Query keys centralized                                    │
│ - React Query: useQuery, useMutation                        │
│ - Cache invalidation strategy                               │
│ - Cache-first: Check queryClient cache before API call      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ API Service (outletApi)                                     │
│ - Uses ApiClient.getRawClient()                             │
│ - Returns App.* types (after mapping)                       │
│ - Calls mappers for transformation                          │
│ - Accesses nested response: response.data.website           │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ Mapper (OutletMapper.toApp)                                 │
│ - Transforms API response → App types                       │
│ - Handles snake_case → camelCase (if needed)                │
│ - Transforms Date strings → Date objects                    │
│ - Uses spread operators for efficiency                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ ApiClient (Singleton)                                       │
│ - Axios instance with interceptors                          │
│ - Auto-refresh tokens on 401                                │
│ - Unwraps response.data automatically                       │
└─────────────────────────────────────────────────────────────┘
```

### Ejemplo Correcto: Outlets GetById

**Hook (`useOutletById.ts`):**
```typescript
export function useOutletById(id: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: outletKeys.detail(id),
    queryFn: async () => {
      // 1️⃣ CACHE-FIRST: Buscar en cache primero
      const cachedLists = queryClient.getQueriesData({
        queryKey: outletKeys.lists(),
      });

      for (const [, outlets] of cachedLists) {
        if (outlets?.data) {
          const found = outlets.data.find((o) => o.id === id);
          if (found) return found;
        }
      }

      // 2️⃣ Si no está en cache, fetch de API
      return outletApi.getOutletById(id);
    },
    enabled: !!id,
  });
}
```

**API Service (`outletApi.ts`):**
```typescript
async getOutletById(id: string): Promise<App.Outlet> {
  try {
    const rawClient = ApiClient.getRawClient();

    // ApiClient ya unwrappea response.data
    // Backend devuelve: { data: { website: {...} } }
    // rawClient.get() devuelve: { website: {...} }
    const response = await rawClient.get<{ website: App.Outlet }>(
      `/generator-pro/websites/${id}`
    );

    // 3️⃣ Acceder a la estructura anidada
    return response.data.website;
  } catch (error) {
    console.error(`Error fetching outlet ${id}:`, error);
    throw error;
  }
}
```

### Decisiones Arquitectónicas Clave

1. **Type Namespaces**:
   - ❌ NO hay separación API/App namespace si backend usa camelCase
   - ✅ Solo App namespace con transformaciones mínimas

2. **API Client Pattern**:
   - ❌ NUNCA usar `fetch()` directo
   - ✅ SIEMPRE usar `ApiClient.getRawClient()`

3. **Response Unwrapping**:
   - ✅ ApiClient unwrappea `response.data` automáticamente
   - ✅ API Service accede estructura anidada: `response.data.website`

4. **Mapper Pattern**:
   - ❌ NO copiar campos 1:1 si no hay transformación
   - ✅ Usar spread operators + transformaciones específicas
   - ✅ Solo transformar: `_id → id`, `string → Date`

5. **Cache Strategy**:
   - ✅ Hooks deben buscar en cache primero antes de API call
   - ✅ Reduce latency y network requests

---

## 🔴 ISSUES CRÍTICOS IDENTIFICADOS

### Issue #1: Response Structure Handling Incorrecto
**Severidad:** CRITICAL
**Archivo:** `src/services/api/imageGenerationApi.ts:64-68`

**❌ Código actual:**
```typescript
const response = await rawClient.get<API.ImageGeneration>(
  `${BASE_PATH}/${id}`
)

return mapImageGenerationFromAPI(response.data)
```

**❌ Problema:**
- Asume que `response.data` es el entity directamente
- Backend probablemente envuelve en: `{ data: { generation: {...} } }`
- `response.data` está undefined o malformado

**✅ Fix esperado:**
```typescript
const response = await rawClient.get<{ generation: API.ImageGeneration }>(
  `${BASE_PATH}/${id}`
)

return mapImageGenerationFromAPI(response.data.generation)
```

**Impacto:** Runtime errors, data undefined, feature completamente rota

---

### Issue #2: getGenerations() - Mismo Problema
**Severidad:** CRITICAL
**Archivo:** `src/services/api/imageGenerationApi.ts:98-113`

**❌ Código actual:**
```typescript
const response = await rawClient.get<
  API.PaginatedResponse<API.ImageGeneration>
>(url)

return mapPaginatedResponseFromAPI(
  response.data,
  mapImageGenerationFromAPI
)
```

**❌ Problema:**
- No maneja estructura wrapper correcta
- Backend probablemente devuelve: `{ data: [...], pagination: {...} }`

**✅ Fix esperado:**
```typescript
const response = await rawClient.get<{
  data: API.ImageGeneration[];
  pagination: API.PaginationInfo;
}>(url)

return mapPaginatedResponseFromAPI(
  response.data,
  mapImageGenerationFromAPI
)
```

---

### Issue #3: generateImage() - Response Unwrapping Incorrecto
**Severidad:** CRITICAL
**Archivo:** `src/services/api/imageGenerationApi.ts:40-46`

**❌ Código actual:**
```typescript
const response = await rawClient.post<API.GenerateImageResponse>(
  `${BASE_PATH}/generate`,
  apiRequest
)

// ApiClient unwraps response.data automatically
return mapGenerateImageResponseFromAPI(response.data)
```

**❌ Problema:**
- Comentario dice "unwraps automatically" pero es misleading
- Puede estar accediendo a estructura incorrecta

**✅ Fix esperado:**
```typescript
const response = await rawClient.post<{
  message: string;
  generation: API.ImageGeneration;
  jobId: string | number;
  estimatedTime: string;
}>(
  `${BASE_PATH}/generate`,
  apiRequest,
  {
    timeout: 120000 // 2 min para AI generation
  }
)

return mapGenerateImageResponseFromAPI(response.data)
```

---

### Issue #4-6: storeInBank() y getUserStats() - Mismo Pattern
**Severidad:** CRITICAL
**Archivos:**
- `imageGenerationApi.ts:158-163` (storeInBank)
- `imageGenerationApi.ts:180-184` (getUserStats)

**Problema:** Mismo issue de response unwrapping incorrecto

---

### Issue #7: Debug Logging en Producción
**Severidad:** CRITICAL
**Archivo:** `imageGenerationApi.ts:102-108`

**❌ Código actual:**
```typescript
// Debug logging
console.log('[imageGenerationApi] Raw response structure:', {
  responseType: typeof response,
  hasData: !!response.data,
  hasPagination: !!response.data?.pagination,
  dataLength: response.data?.data?.length,
})
```

**❌ Problema:**
- Debug logging en código de producción
- Clutters logs innecesariamente

**✅ Fix:**
- Remover completamente
- O gatear con `if (ENV.ENABLE_DEBUG_LOGGING)`

---

### Issue #8: Namespace API Innecesario - Architectural Issue
**Severidad:** CRITICAL
**Archivo:** `src/types/image-generation.types.ts:9-132`

**❌ Problema:**
```typescript
// Comentario dice que backend usa camelCase
/**
 * NOTA: Backend usa camelCase (convención NestJS/Mongoose)
 */

// Pero luego define namespace API separado que es IDÉNTICO a App
export namespace API {
  export interface ImageGeneration {
    _id: string
    prompt: string
    model: string
    quality: 'low' | 'medium' | 'high'
    size: string
    brandingConfig: { ... } // ← CAMELCASE
    // ... más campos en camelCase
  }
}

export namespace App {
  export interface ImageGeneration {
    id: string // ← Solo cambio: _id → id
    prompt: string
    model: string
    quality: 'low' | 'medium' | 'high'
    size: string
    brandingConfig: { ... } // ← MISMO CAMELCASE
    // ... EXACTAMENTE LOS MISMOS CAMPOS
  }
}
```

**❌ Impacto:**
- Duplicación masiva de código (100+ líneas)
- Mantenimiento difícil (cambio en 1 type = cambio en 2 lugares)
- Confusión sobre cuándo usar API vs App

**✅ Patrón correcto (outlets):**
- Si backend usa camelCase → NO existe namespace API
- Solo App namespace
- Transformaciones en mapper: `_id → id`, `string → Date`

**✅ Fix esperado:**
```typescript
// NO namespace API, solo App
export namespace App {
  export interface ImageGeneration {
    id: string
    prompt: string
    model: string
    quality: 'low' | 'medium' | 'high'
    size: string
    brandingConfig: {
      watermarkText: string
      watermarkPosition: string
      includeDecorations: boolean
      keywords?: string[]
    }
    // ... resto de campos
    createdAt: Date // ← Date object, no string
    updatedAt: Date
  }
}

// Mapper transforma backend response → App type
export function mapImageGenerationFromAPI(
  apiResponse: Record<string, unknown>
): App.ImageGeneration {
  return {
    ...apiResponse,
    id: apiResponse._id as string,
    createdAt: new Date(apiResponse.createdAt as string),
    updatedAt: new Date(apiResponse.updatedAt as string),
  } as App.ImageGeneration
}
```

---

### Issue #17-18: Screens Referencian Propiedades Inexistentes
**Severidad:** CRITICAL
**Archivo:** `app/(protected)/image-generation/result.tsx`

**❌ Código actual (líneas 130-133, 154, 161, 179):**
```typescript
// Línea 130-133
const isInProgress =
  generation.status === 'queued' || generation.status === 'processing';
const isCompleted = generation.status === 'completed';
const isFailed = generation.status === 'failed';

// Línea 154
progress={generation.progress || 0}

// Línea 161
{isCompleted && generation.resultUrl && (

// Línea 179
{generation.error && (
```

**❌ Problema:**
`App.ImageGeneration` type NO tiene estos campos:
- ❌ `status` - No existe
- ❌ `progress` - No existe
- ❌ `resultUrl` - No existe (debe ser `generatedImageUrl`)
- ❌ `error` - No existe

**✅ Revisar types actuales (lines 142-169):**
```typescript
export interface ImageGeneration {
  id: string
  prompt: string
  model: string
  quality: 'low' | 'medium' | 'high'
  size: string
  brandingConfig: { ... }
  generatedImageUrl?: string // ← Existe esto, no "resultUrl"
  imageBankId?: string
  cost: number
  generationTime?: number
  processingTime?: number
  aiGenerated: boolean
  c2paIncluded: boolean
  editorialReviewed: boolean
  usedInArticles: string[]
  createdBy: string
  extractedNoticiaId?: string
  sourceImageId?: string
  sourceImageUrl?: string
  createdAt: Date
  updatedAt: Date
  // ❌ NO TIENE: status, progress, error, resultUrl
}
```

**✅ Fix Options:**

**Opción A:** Agregar campos faltantes al type (si backend los devuelve)
```typescript
export interface ImageGeneration {
  // ... campos existentes
  status?: 'queued' | 'processing' | 'completed' | 'failed'
  progress?: number
  error?: string
  // ... resto
}
```

**Opción B:** Cambiar screen para usar campos correctos
```typescript
// En vez de generation.resultUrl
{isCompleted && generation.generatedImageUrl && (
  <GeneratedImagePreview imageUrl={generation.generatedImageUrl} />
)}
```

**Impacto:** UI NUNCA renderiza correctamente, siempre muestra loading o error states

---

### Issue #21: Missing Backend Response Structure Documentation
**Severidad:** CRITICAL
**Archivo:** Todos los archivos API-related

**❌ Problema:**
- No hay documentación de estructura REAL de responses del backend
- Imposible saber qué estructura correcta sin hacer test requests

**✅ Fix requerido:**
Documentar estructura exacta de cada endpoint:

```typescript
/**
 * GET /image-generation/:id
 *
 * Backend Response:
 * {
 *   "data": {
 *     "generation": {
 *       "_id": "68ea745761f9f6f5ffcd524c",
 *       "prompt": "...",
 *       "model": "gpt-image-1",
 *       "brandingConfig": { ... },
 *       // ... más campos
 *     }
 *   }
 * }
 */
```

**Action Items:**
1. Hacer test requests a cada endpoint
2. Documentar estructura en JSDoc
3. Crear types para wrappers
4. Actualizar API service con estructura correcta

---

## 🟠 ISSUES HIGH PRIORITY

### Issue #9: Duplicate Type Definitions
**Severidad:** HIGH
**Archivo:** `src/types/image-generation.types.ts:17-267`

**Problema:**
- `API.ImageGeneration` y `App.ImageGeneration` son 95% idénticos
- Solo difieren en: `_id` vs `id`, `string` vs `Date` timestamps
- Duplicación de 100+ líneas de código

**Fix:** Eliminar namespace API si backend usa camelCase

---

### Issue #11: Mappers Redundantes (No-ops)
**Severidad:** HIGH
**Archivo:** `src/mappers/image-generation.mappers.ts:51-66`

**❌ Código actual:**
```typescript
export function mapGenerateImageRequestToAPI(
  appRequest: App.GenerateImageRequest
): API.GenerateImageRequest {
  return {
    prompt: appRequest.prompt,
    watermarkText: appRequest.watermarkText,
    includeDecorations: appRequest.includeDecorations,
    keywords: appRequest.keywords,
    model: appRequest.model,
    quality: appRequest.quality,
    size: appRequest.size,
    extractedNoticiaId: appRequest.extractedNoticiaId,
    sourceImageId: appRequest.sourceImageId,
    sourceImageUrl: appRequest.sourceImageUrl,
  }
}
```

**❌ Problema:**
- Esto es un **no-op completo**
- Solo copia campos sin transformar NADA
- Gasto computacional innecesario
- Código verbose sin propósito

**✅ Fix:**
- Si API y App types son idénticos → Eliminar mapper
- O simplemente: `return appRequest` (si types son compatibles)

---

### Issue #12: Mapper Verbose Innecesario
**Severidad:** HIGH
**Archivo:** `src/mappers/image-generation.mappers.ts:13-44`

**❌ Código actual (35 líneas):**
```typescript
export function mapImageGenerationFromAPI(
  apiGeneration: API.ImageGeneration
): App.ImageGeneration {
  return {
    id: apiGeneration._id,
    prompt: apiGeneration.prompt,
    model: apiGeneration.model,
    quality: apiGeneration.quality,
    size: apiGeneration.size,
    brandingConfig: {
      watermarkText: apiGeneration.brandingConfig.watermarkText,
      watermarkPosition: apiGeneration.brandingConfig.watermarkPosition,
      includeDecorations: apiGeneration.brandingConfig.includeDecorations,
      keywords: apiGeneration.brandingConfig.keywords,
    },
    generatedImageUrl: apiGeneration.generatedImageUrl,
    imageBankId: apiGeneration.imageBankId,
    cost: apiGeneration.cost,
    generationTime: apiGeneration.generationTime,
    processingTime: apiGeneration.processingTime,
    aiGenerated: apiGeneration.aiGenerated,
    c2paIncluded: apiGeneration.c2paIncluded,
    editorialReviewed: apiGeneration.editorialReviewed,
    usedInArticles: apiGeneration.usedInArticles,
    createdBy: apiGeneration.createdBy,
    extractedNoticiaId: apiGeneration.extractedNoticiaId,
    sourceImageId: apiGeneration.sourceImageId,
    sourceImageUrl: apiGeneration.sourceImageUrl,
    createdAt: new Date(apiGeneration.createdAt),
    updatedAt: new Date(apiGeneration.updatedAt),
  }
}
```

**✅ Fix (4 líneas):**
```typescript
export function mapImageGenerationFromAPI(
  apiGeneration: Record<string, unknown>
): App.ImageGeneration {
  return {
    ...apiGeneration,
    id: apiGeneration._id as string,
    createdAt: new Date(apiGeneration.createdAt as string),
    updatedAt: new Date(apiGeneration.updatedAt as string),
  } as App.ImageGeneration
}
```

**Beneficios:**
- 87% menos código (35 líneas → 4 líneas)
- Más mantenible (nuevos campos automáticos)
- Menos propenso a errores (no hay que recordar agregar campos)
- Performance ligeramente mejor (menos asignaciones)

---

### Issue #14: Hook No Checa Cache Primero
**Severidad:** HIGH
**Archivo:** `src/hooks/useImageGenerationById.ts:33-48`

**❌ Código actual:**
```typescript
export function useImageGenerationById(
  id: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: imageGenerationKeys.detail(id),
    queryFn: () => imageGenerationApi.getGenerationById(id),
    enabled: options?.enabled ?? true,
    refetchInterval: (data) => {
      // ... polling logic
    },
  })
}
```

**❌ Problema:**
- Va directo a API call
- Ignora cache completamente
- Genera requests innecesarios
- UX más lenta (latency del network request)

**✅ Patrón correcto (outlets):**
```typescript
export function useImageGenerationById(
  id: string,
  options?: { enabled?: boolean }
) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: imageGenerationKeys.detail(id),
    queryFn: async () => {
      // 1️⃣ CACHE-FIRST: Buscar en cache de listas
      const cachedLists = queryClient.getQueriesData<
        App.PaginatedResponse<App.ImageGeneration>
      >({
        queryKey: imageGenerationKeys.lists(),
      })

      for (const [, generations] of cachedLists) {
        if (generations?.data) {
          const found = generations.data.find((g) => g.id === id)
          if (found) {
            console.log(`✅ Found in cache: ${id}`)
            return found
          }
        }
      }

      // 2️⃣ No está en cache, fetch de API
      console.log(`🌐 Fetching from API: ${id}`)
      return imageGenerationApi.getGenerationById(id)
    },
    enabled: options?.enabled ?? true,
    refetchInterval: (data) => {
      // ... polling logic
    },
  })
}
```

**Beneficios:**
- 90% menos requests en casos comunes (ya está en cache)
- Respuesta instantánea desde cache
- Mejor UX
- Menor load en backend

---

### Issue #19: image-detail/[id].tsx Implementa Query Custom
**Severidad:** HIGH
**Archivo:** `app/(protected)/image-detail/[id].tsx:54-88`

**❌ Problema:**
- Screen implementa su propia lógica de cache checking
- Duplica lógica que debería estar en hook
- Inconsistente con patrón de outlets

**✅ Fix:**
Usar `useImageGenerationById` hook después de implementar Issue #14

---

## 🟡 ISSUES MEDIUM/LOW PRIORITY

### Issue #10: Missing Query Param Types
**Severidad:** MEDIUM

**Problema:** Falta definir types para query params si backend espera formato específico

---

### Issue #13: mapFiltersToQueryParams - Posible snake_case Faltante
**Severidad:** MEDIUM
**Archivo:** `src/mappers/image-generation.mappers.ts:146-159`

**Código actual:**
```typescript
if (filters.sortBy) params.sortBy = filters.sortBy
if (filters.sortOrder) params.sortOrder = filters.sortOrder
```

**Problema:**
- Si backend espera `sort_by` y `sort_order`, esto está mal
- Necesita verificación de contrato con backend

---

### Issue #20: useImageGenerationLogs Recibe Param Incorrecto
**Severidad:** MEDIUM
**Archivo:** `app/(protected)/image-generation/result.tsx:51`

**❌ Código:**
```typescript
const logs = useImageGenerationLogs(generationId || '')
```

**❌ Problema:**
- `useImageGenerationLogs` espera `jobId` (BullMQ job ID: número)
- Se le está pasando `generationId` (MongoDB _id: string largo)
- Socket events usan `jobId` para matchear, no `generationId`
- Logs nunca van a matchear

**✅ Fix:**
```typescript
// Fetch generation first to get jobId
const { data: generation } = useImageGenerationById(generationId || '')

// Then use jobId for logs
const logs = useImageGenerationLogs(generation?.jobId || '')
```

**Problema adicional:** `App.ImageGeneration` no tiene campo `jobId` en types (ver Issue #17-18)

---

### Issue #23: Missing Timeout Configuration
**Severidad:** MEDIUM

**Problema:**
- Generación de imágenes puede tomar 10-60+ segundos
- Sin timeout custom, puede fallar prematuramente

**Fix:**
```typescript
const response = await rawClient.post<API.GenerateImageResponse>(
  `${BASE_PATH}/generate`,
  apiRequest,
  {
    timeout: 120000 // 2 minutos
  }
)
```

---

### Issue #24: Logging Inconsistente
**Severidad:** LOW

**Problema:** Prefijos inconsistentes en logs

**Fix:** Estandarizar o remover prefijos

---

## 🔍 ANÁLISIS DE CAUSA RAÍZ

### 1. Malentendido de ApiClient Response Structure

**Problema fundamental:**
No se entendió cómo `ApiClient` unwraps responses.

**Patrón correcto (outlets):**
```typescript
// Backend devuelve:
{
  "data": {
    "website": { id: "123", name: "..." }
  }
}

// ApiClient.getRawClient().get() unwrappea y devuelve:
{
  "website": { id: "123", name: "..." }
}

// API Service debe acceder:
response.data.website
```

**Error en images:**
```typescript
// Asume que response.data ES el entity directamente
return mapImageGenerationFromAPI(response.data)
// ❌ Debería ser: response.data.generation
```

---

### 2. Over-Engineering con Namespace API Innecesario

**Problema:**
- Comentario dice: "Backend usa camelCase"
- Pero implementa namespace API separado como si backend usara snake_case
- Resulta en duplicación masiva sin propósito

**Por qué pasó:**
- Probablemente copiaron template de otro proyecto donde backend SÍ usaba snake_case
- No adaptaron al contexto de este proyecto
- No revisaron patrón de outlets como referencia

---

### 3. Mappers Redundantes (No-ops)

**Problema:**
- Mappers copian campos 1:1 sin transformar nada
- Gasto computacional y de mantenimiento sin beneficio

**Por qué pasó:**
- Se crearon mappers "por si acaso"
- No se aplicó principio de transformación mínima
- No se siguió patrón de outlets (spread operators)

---

### 4. Type/Implementation Mismatch en Screens

**Problema:**
- Screens usan `status`, `progress`, `error`, `resultUrl`
- Ninguno existe en type definitions

**Por qué pasó:**
- Screens se escribieron contra API contract diferente
- Types se actualizaron pero screens no
- O viceversa: screens se escribieron antes de finalizar types

**Evidencia:**
```typescript
// Screen usa:
generation.status
generation.progress
generation.resultUrl
generation.error

// Type tiene:
// ❌ Ninguno de estos campos
```

---

## 📁 ARCHIVOS AFECTADOS

### 🔴 CRÍTICO (Requieren cambios inmediatos)

1. **`src/services/api/imageGenerationApi.ts`**
   - Issues: #1, #2, #3, #4, #5, #6, #7
   - Cambios: Response unwrapping en TODOS los métodos
   - Lines afectadas: 40-46, 64-68, 98-113, 158-163, 180-184

2. **`src/types/image-generation.types.ts`**
   - Issues: #8, #9, #10
   - Cambios: Eliminar namespace API, agregar wrapper types, agregar campos faltantes
   - Lines afectadas: 9-267

3. **`src/mappers/image-generation.mappers.ts`**
   - Issues: #11, #12, #13
   - Cambios: Simplificar todos los mappers, usar spread operators
   - Lines afectadas: 13-189

4. **`app/(protected)/image-generation/result.tsx`**
   - Issues: #17, #18, #20
   - Cambios: Usar propiedades correctas del type
   - Lines afectadas: 51, 130-133, 154, 161, 179

---

### 🟠 HIGH (Requieren cambios para optimization)

5. **`src/hooks/useImageGenerationById.ts`**
   - Issues: #14, #15
   - Cambios: Implementar cache-first strategy
   - Lines afectadas: 26-48

6. **`app/(protected)/image-detail/[id].tsx`**
   - Issues: #19
   - Cambios: Usar hook en vez de query custom
   - Lines afectadas: 54-88

---

### 🟡 MEDIUM (Verificar/ajustar)

7. **`src/hooks/useImageGeneration.ts`** - Verificar únicamente
8. **`src/hooks/useStoreInBank.ts`** - Verificar únicamente
9. **`src/hooks/useImageGenerationStats.ts`** - Verificar únicamente
10. **`src/hooks/useImageGenerationLogs.ts`** - Ajuste menor (Issue #20)

---

### ✅ CORRECTOS (No requieren cambios)

- **`src/hooks/queryKeys/imageGeneration.ts`** - ✅ Sigue patrón correcto
- **`src/hooks/useImageGenerations.ts`** - ✅ Correcto (pending API fixes)

---

## 🎯 PLAN DE ACCIÓN POR FASES

### FASE 1: Verificar Backend (CRÍTICO - HACER PRIMERO)
**Objetivo:** Documentar estructura REAL de responses

**Action Items:**
1. Hacer test requests a cada endpoint:
   ```bash
   # Test GET by ID
   curl -H "Authorization: Bearer TOKEN" \
     http://localhost:3000/api/image-generation/68ea745761f9f6f5ffcd524c

   # Test GET list
   curl -H "Authorization: Bearer TOKEN" \
     http://localhost:3000/api/image-generation?page=1&limit=10

   # Test POST generate
   curl -X POST -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"prompt":"test","quality":"low"}' \
     http://localhost:3000/api/image-generation/generate

   # Test GET stats
   curl -H "Authorization: Bearer TOKEN" \
     http://localhost:3000/api/image-generation/stats/summary
   ```

2. Documentar estructura exacta de cada response
3. Crear documento de API contract
4. Actualizar types con estructura real

**Entregable:**
- Documento: `backend_api_contract_image_generation.md`
- Types actualizados con wrapper interfaces

**Estimado:** 1-2 horas

---

### FASE 2: Fix Types (CRÍTICO)
**Objetivo:** Type system correcto y completo

**Action Items:**
1. Eliminar namespace API si backend usa camelCase
2. Agregar campos faltantes (`status`, `progress`, `error`, etc.)
3. Crear wrapper types para responses
4. Consolidar en single source of truth

**Files:**
- `src/types/image-generation.types.ts`

**Entregable:**
```typescript
// Single App namespace
export namespace App {
  export interface ImageGeneration {
    id: string
    // ... campos completos
    status?: 'queued' | 'processing' | 'completed' | 'failed'
    progress?: number
    error?: string
    // ...
  }

  // Wrapper types
  export interface GetGenerationByIdResponse {
    generation: ImageGeneration
  }

  export interface GetGenerationsResponse {
    data: ImageGeneration[]
    pagination: PaginationInfo
  }
}
```

**Estimado:** 2-3 horas

---

### FASE 3: Fix API Service (CRÍTICO)
**Objetivo:** Correct response unwrapping en TODOS los métodos

**Action Items:**
1. Actualizar `getGenerationById()` con estructura correcta
2. Actualizar `getGenerations()` con paginación correcta
3. Actualizar `generateImage()` con wrapper correcto
4. Actualizar `storeInBank()` y `getUserStats()`
5. Agregar timeout configs (120s para generation)
6. Remover debug logging

**Files:**
- `src/services/api/imageGenerationApi.ts`

**Entregable:**
```typescript
async getGenerationById(id: string): Promise<App.ImageGeneration> {
  try {
    const rawClient = ApiClient.getRawClient()

    const response = await rawClient.get<App.GetGenerationByIdResponse>(
      `${BASE_PATH}/${id}`
    )

    return response.data.generation
  } catch (error) {
    console.error(`Error fetching generation ${id}:`, error)
    throw error
  }
}
```

**Estimado:** 3-4 horas

---

### FASE 4: Simplify Mappers (HIGH)
**Objetivo:** Mappers eficientes y mantenibles

**Action Items:**
1. Simplificar `mapImageGenerationFromAPI` con spread operator
2. Eliminar mappers no-op (`mapGenerateImageRequestToAPI`)
3. Verificar `mapFiltersToQueryParams` contra backend

**Files:**
- `src/mappers/image-generation.mappers.ts`

**Entregable:**
```typescript
export function mapImageGenerationFromAPI(
  apiResponse: Record<string, unknown>
): App.ImageGeneration {
  return {
    ...apiResponse,
    id: apiResponse._id as string,
    createdAt: new Date(apiResponse.createdAt as string),
    updatedAt: new Date(apiResponse.updatedAt as string),
  } as App.ImageGeneration
}
```

**Estimado:** 2 horas

---

### FASE 5: Fix Screens (CRÍTICO)
**Objetivo:** UI renderiza correctamente

**Action Items:**
1. Actualizar `result.tsx` para usar propiedades correctas:
   - `status` → verificar si existe o usar otra lógica
   - `resultUrl` → `generatedImageUrl`
   - `progress` → verificar si existe en type
   - `error` → verificar si existe en type
2. Fix `useImageGenerationLogs` param (generationId → jobId)
3. Verificar otros screens

**Files:**
- `app/(protected)/image-generation/result.tsx`
- `app/(protected)/image-detail/[id].tsx`

**Entregable:**
```typescript
// Si generation tiene status
const isInProgress = generation.status === 'queued' || generation.status === 'processing'

// Si NO tiene status, inferir de otros campos
const isInProgress = !generation.generatedImageUrl && !generation.error

// Use correct field name
{isCompleted && generation.generatedImageUrl && (
  <GeneratedImagePreview imageUrl={generation.generatedImageUrl} />
)}
```

**Estimado:** 3-4 horas

---

### FASE 6: Optimize Hooks (HIGH)
**Objetivo:** Cache-first strategy, mejor performance

**Action Items:**
1. Implementar cache-first en `useImageGenerationById`
2. Refactor `image-detail/[id].tsx` para usar hook
3. Verificar otros hooks

**Files:**
- `src/hooks/useImageGenerationById.ts`
- `app/(protected)/image-detail/[id].tsx`

**Entregable:**
```typescript
export function useImageGenerationById(id: string, options?: { enabled?: boolean }) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: imageGenerationKeys.detail(id),
    queryFn: async () => {
      // Cache-first strategy
      const cachedLists = queryClient.getQueriesData<App.PaginatedResponse<App.ImageGeneration>>({
        queryKey: imageGenerationKeys.lists(),
      })

      for (const [, generations] of cachedLists) {
        if (generations?.data) {
          const found = generations.data.find((g) => g.id === id)
          if (found) return found
        }
      }

      return imageGenerationApi.getGenerationById(id)
    },
    enabled: options?.enabled ?? true,
  })
}
```

**Estimado:** 2-3 horas

---

### FASE 7: Polish (MEDIUM/LOW)
**Objetivo:** Clean code, mejor resilience

**Action Items:**
1. Estandarizar logging
2. Verificar query param transformations
3. Testing end-to-end

**Estimado:** 2 horas

---

## 📊 IMPACTO ESTIMADO

| Fase | Issues Fixed | Severidad | Impact % | Tiempo Est. |
|------|-------------|-----------|----------|-------------|
| **1** | #21 | CRITICAL | 100% - Conocimiento | 1-2h |
| **2** | #8, #9, #10, #17, #18 | CRITICAL | 80% - Types correctos | 2-3h |
| **3** | #1-7 | CRITICAL | 100% - Feature funciona | 3-4h |
| **4** | #11, #12, #13 | HIGH | 20% - Maintenance | 2h |
| **5** | #17, #18, #20 | CRITICAL | 80% - UI funciona | 3-4h |
| **6** | #14, #15, #19 | HIGH | 30% - Performance | 2-3h |
| **7** | #23, #24 | MEDIUM/LOW | 10% - Polish | 2h |

**TOTAL ESTIMADO:** 15-21 horas

### Desglose de Impacto

**Después de Fase 3:**
- ✅ Feature básico funciona
- ✅ API calls exitosos
- ✅ Data se recibe correctamente
- ⚠️ UI puede estar rota aún

**Después de Fase 5:**
- ✅ Feature completamente funcional
- ✅ UI renderiza correctamente
- ✅ User puede generar imágenes
- ⚠️ Performance subóptimo

**Después de Fase 6:**
- ✅ Performance optimizado
- ✅ Cache funciona correctamente
- ✅ UX rápida y fluida

---

## 📚 REFERENCIAS

### Archivos de Referencia (Patrón Correcto)

**API Layer:**
- `src/services/outlets/outletApi.ts` - Patrón correcto de API service

**Hooks:**
- `src/hooks/useOutlets.ts` - Patrón correcto de hook básico
- `src/hooks/useOutletById.ts` - Cache-first strategy reference

**Types:**
- `src/types/outlet.types.ts` - Type system correcto (single namespace)

**Mappers:**
- `src/utils/mappers.ts` - Patrón de transformación eficiente

### Documentos Relacionados

- `BACKEND_API_IMPLEMENTATION.md` - Documentación de backend
- `IMAGE_GENERATION_AI_IMPLEMENTATION_COMPLETE.md` - Feature spec original
- `GENERATION_IMAGE_FEATURE_AI_CONTEXT.md` - Contexto de generación de imágenes

---

## ✅ CHECKLIST DE VALIDACIÓN

### Antes de Empezar Fixes

- [ ] Backend está corriendo y accesible
- [ ] Tengo tokens de autenticación válidos
- [ ] Puedo hacer test requests a endpoints
- [ ] He documentado response structures reales

### Después de Cada Fase

- [ ] Tests manuales pasaron
- [ ] No hay errores de TypeScript
- [ ] Console logs limpios (no errors)
- [ ] UI renderiza correctamente
- [ ] Performance aceptable

### Antes de Considerar "Done"

- [ ] Feature funciona end-to-end
- [ ] Generación de imágenes exitosa
- [ ] UI muestra progreso correctamente
- [ ] Imagen generada se muestra
- [ ] Store in bank funciona
- [ ] Cache funciona correctamente
- [ ] No hay memory leaks
- [ ] Logs limpios
- [ ] Code review interno

---

## 🚨 NOTAS IMPORTANTES

### Principios a Seguir Durante Fixes

1. **Seguir patrón de outlets religiosamente**
   - No improvisar
   - No "mejorar" el patrón
   - Copiar lo que funciona

2. **Test después de cada cambio**
   - No acumular cambios sin probar
   - Un fix a la vez, validar, siguiente

3. **Documentar decisiones**
   - Si estructura backend es diferente a esperado, documentar por qué
   - Agregar comentarios explicativos en código

4. **Mantener compatibilidad**
   - Verificar que cambios en types no rompan otros features
   - Grep por usages antes de cambiar interfaces

### Red Flags a Evitar

- ❌ Usar `fetch()` directo - SIEMPRE usar `ApiClient.getRawClient()`
- ❌ Asumir estructura de response - SIEMPRE verificar con test real
- ❌ Copiar campos en mappers si no hay transformación - Usar spread
- ❌ Duplicar lógica entre screens y hooks - Centralizar en hooks
- ❌ Crear namespace API si backend usa camelCase - Single namespace

---

**FIN DEL DOCUMENTO**

---

**Última actualización:** 11 Octubre 2025
**Autor:** Jarvis (Claude Code Assistant)
**Reviewer:** Coyotito
**Status:** Ready for Implementation
