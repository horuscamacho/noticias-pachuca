# 📋 Feature: Sistema de Filtrado y Ordenamiento de Noticias Extraídas

**Fecha:** 10 de Octubre 2025
**Versión:** 1.0
**Estado:** Planificación Completa
**Módulo:** Noticias Extraction System

---

## 📊 RESUMEN EJECUTIVO

### Objetivo del Feature
Implementar un sistema completo de filtrado, ordenamiento y paginación para noticias extraídas (extracted content), permitiendo:

1. **Ordenamiento Inteligente:**
   - Primero por fecha de publicación original (`publishedAt`)
   - Segundo por fecha de extracción (`extractedAt`) como fallback
   - Configurable por usuario (desc/asc)
   - Ordenamiento por título, categoría, autor

2. **Filtrado Multi-criterio:**
   - Por estado (pending, extracted, failed, processing)
   - Por dominio/outlet
   - Por rango de fechas (publishedAt)
   - Por categoría
   - Por autor
   - **Por keywords (CON SELECTOR + INPUT DE BÚSQUEDA)**
   - Por tags
   - Búsqueda de texto en título/contenido

3. **UX Optimizada:**
   - Bottom Sheet con filtros avanzados
   - **Selector de keywords con búsqueda integrada**
   - Chips de filtros activos
   - Paginación infinita con skeleton
   - Pull-to-refresh

---

## 🔍 HALLAZGOS DEL ANÁLISIS

### 1. Backend - Noticias Module

#### ✅ Infraestructura Existente (Muy Sólida)

**Schema: `ExtractedNoticia`**
- Ubicación: `/packages/api-nueva/src/noticias/schemas/extracted-noticia.schema.ts`
- **9 índices** ya configurados (7 simples + 2 compuestos)
- Campos disponibles para ordenamiento:
  - `publishedAt` (Date) - índice ✅
  - `extractedAt` (Date) - índice ✅
  - `title` (String) - sin índice
  - `author` (String) - sin índice
  - `category` (String) - sin índice

**Endpoint Actual:**
```typescript
GET /noticias/extracted
Controller: src/noticias/controllers/noticias.controller.ts (línea 261)
Service: src/noticias/services/noticias-extraction.service.ts
```

**Filtros Ya Implementados:**
- ✅ Estado (status: 'pending' | 'extracted' | 'failed' | 'processing')
- ✅ Dominio (domain: string)
- ✅ Facebook Post ID (facebookPostId: string)
- ✅ Page ID (pageId: string)
- ✅ Has Images (hasImages: boolean)
- ✅ Rango de fechas (dateFrom/dateTo sobre `extractedAt`)
- ✅ Búsqueda de texto (searchText con regex en title/content/excerpt)

**Ordenamiento Actual:**
- ✅ Configurable (sortBy + sortOrder)
- ✅ Por defecto: `{ extractedAt: -1 }` (más reciente primero)

**Paginación:**
- ✅ Page/Limit implementado
- ✅ Total count incluido
- ✅ Metadata: page, limit, total

#### ❌ Funcionalidad Faltante

**1. Filtros No Disponibles**

```typescript
// Campos en schema SIN filtrado implementado:
category?: string;          // ❌ No se puede filtrar
categories: string[];       // ❌ No se puede filtrar por múltiples categorías
author?: string;            // ❌ No se puede filtrar
tags: string[];             // ❌ No se puede filtrar

// Filtro de keywords NO existe como campo en schema
// Necesitamos extraer keywords del contenido
```

**2. Keywords System - NUEVA FUNCIONALIDAD**

**Requerimiento específico:** Selector de keywords con búsqueda integrada.

```typescript
// Opción A: Agregar campo keywords al schema
@Prop({ type: [String], default: [] })
keywords: string[];  // Array de palabras clave extraídas

// Opción B: Usar tags existente
tags: string[];  // Ya existe en schema, sin índice
```

**UX Requerida para Keywords:**
- Selector que muestre lista de keywords disponibles
- Input de búsqueda DENTRO del selector para filtrar keywords
- Multi-select de keywords
- Chips visuales de keywords seleccionadas

**3. Índices Faltantes para Performance**

```typescript
// Índices necesarios para nuevos filtros:
ExtractedNoticiaSchema.index({ category: 1 });          // ❌ No existe
ExtractedNoticiaSchema.index({ author: 1 });            // ❌ No existe
ExtractedNoticiaSchema.index({ tags: 1 });              // ❌ No existe
ExtractedNoticiaSchema.index({ keywords: 1 });          // ❌ No existe (nuevo campo)
ExtractedNoticiaSchema.index({ title: 'text' });        // ❌ Text index para búsqueda full-text
ExtractedNoticiaSchema.index({ content: 'text' });      // ❌ Text index para búsqueda full-text

// Índices compuestos para queries frecuentes:
ExtractedNoticiaSchema.index({ domain: 1, publishedAt: -1 });       // ❌ No existe
ExtractedNoticiaSchema.index({ status: 1, category: 1 });           // ❌ No existe
ExtractedNoticiaSchema.index({ publishedAt: -1, extractedAt: -1 }); // ❌ Para ordenamiento híbrido
```

**4. Búsqueda de Texto - Performance Issue**

**Problema Actual (líneas 139-149 del service):**
```typescript
// ❌ Regex sin Text Index = FULL COLLECTION SCAN
if (searchText) {
  query.$or = [
    { title: { $regex: searchText, $options: 'i' } },
    { content: { $regex: searchText, $options: 'i' } },
    { excerpt: { $regex: searchText, $options: 'i' } }
  ];
}
```

**Solución:**
```typescript
// ✅ Text Index + $text operator
ExtractedNoticiaSchema.index({ title: 'text', content: 'text', excerpt: 'text' });

// Query optimizado:
if (searchText) {
  query.$text = { $search: searchText };
}
```

**5. Ordenamiento - Mejoras Necesarias**

**Actual (líneas 153-165 del service):**
```typescript
const sortField = sortBy || 'extractedAt';
const sortDirection = sortOrder === 'asc' ? 1 : -1;
const sortOptions = { [sortField]: sortDirection };
```

**Mejorar para ordenamiento híbrido:**
```typescript
// Si sortBy = 'publishedAt', usar fallback a extractedAt
if (sortBy === 'publishedAt') {
  sortOptions = {
    publishedAt: sortDirection,
    extractedAt: sortDirection  // Fallback
  };
}
```

---

### 2. Frontend Analysis

#### ✅ Estado Actual

**Hook: `useExtractedContent`**
- Ubicación: `/packages/mobile-expo/src/hooks/useExtractedContent.ts`
- **useInfiniteQuery** para scroll infinito ✅
- Pull-to-refresh ✅
- Basic caching ✅

**Types:**
- Ubicación: `/packages/mobile-expo/src/types/extracted-content.types.ts`
- Interface básica ✅

**Screen:**
- Ubicación: `/packages/mobile-expo/app/(protected)/(tabs)/generate.tsx`
- Lista con PostCard ✅
- NO tiene filtros UI ❌

#### ❌ Funcionalidad Faltante

**1. No hay sistema de filtros UI**
- ❌ No hay FilterBottomSheet
- ❌ No hay SortSheet
- ❌ No hay FilterChips
- ❌ No hay búsqueda rápida

**2. No hay selector de keywords**
- ❌ No existe componente KeywordSelector
- ❌ No hay endpoint para obtener keywords disponibles
- ❌ No hay búsqueda dentro del selector

**3. Types incompletos**
- ❌ No hay namespace API/App pattern
- ❌ No hay FilterChip types
- ❌ No hay SortOption types

---

## 🎯 PLAN DE IMPLEMENTACIÓN

### Estimación Total: 8-10 horas (1-2 días)

---

### **FASE 1: Backend - Agregar campo keywords + índices (1-2 horas)**

#### Subtareas:

**1.1 Agregar campo `keywords` al schema** (15 min)
- Archivo: `src/noticias/schemas/extracted-noticia.schema.ts`
- Agregar `@Prop({ type: [String], default: [] }) keywords: string[];`

**1.2 Crear 7 índices nuevos** (15 min)
- Índices simples: category, author, tags, keywords
- Text index: title + content + excerpt
- Índices compuestos: domain+publishedAt, status+category, publishedAt+extractedAt

**1.3 Actualizar DTO de filtros** (15 min)
- Archivo: Crear `src/noticias/dto/extracted-content-filters.dto.ts`
- Agregar: category, author, tags[], keywords[], sortBy enum

**1.4 Actualizar service para filtros nuevos** (30 min)
- Archivo: `src/noticias/services/noticias-extraction.service.ts`
- Agregar filtros: category, author, tags, keywords
- Mejorar búsqueda con $text operator
- Mejorar ordenamiento híbrido

**1.5 Crear endpoint para obtener keywords disponibles** (15 min)
- Endpoint: `GET /noticias/extracted/keywords`
- Query param: `search` para filtrar keywords
- Retorna: array de keywords únicos con count

**1.6 Script de migración para keywords** (30 min)
- Extraer keywords del contenido existente usando NLP simple
- Popular campo keywords en documentos existentes

---

### **FASE 2: Frontend - Types + Mappers (45 min)**

#### Subtareas:

**2.1 Crear types completos** (20 min)
- Archivo: `src/types/extracted-content-filters.types.ts`
- API namespace (snake_case)
- App namespace (camelCase)
- FilterChip, SortOption, KeywordOption types

**2.2 Crear mappers** (15 min)
- Archivo: Actualizar `src/utils/mappers.ts`
- ExtractedContentFiltersMapper.toAPI()
- ExtractedContentFiltersMapper.toApp()
- ExtractedContentFiltersMapper.paginatedToApp()

**2.3 Actualizar API Service** (10 min)
- Archivo: `src/services/extracted-content/extractedContentApi.ts`
- Agregar getExtractedContent(filters)
- Agregar getKeywords(search?)
- Agregar getCategories(), getAuthors()

---

### **FASE 3: Frontend - React Query Hooks (30 min)**

#### Subtareas:

**3.1 Actualizar useExtractedContent** (20 min)
- Archivo: `src/hooks/useExtractedContent.ts`
- Cambiar a useInfiniteQuery con filtros
- Query keys con filtros incluidos
- Agregar helpers: getAllExtracted, getTotalItems

**3.2 Crear hooks auxiliares** (10 min)
- useKeywords(search?)
- useCategories()
- useAuthors()

---

### **FASE 4: Frontend - Componente KeywordSelector (1.5-2 horas)**

**COMPONENTE CLAVE** - Selector de keywords con búsqueda integrada

#### Subtareas:

**4.1 Crear KeywordSelector.tsx** (1 hora)
- Input de búsqueda en la parte superior
- Lista de keywords filtradas en tiempo real
- Checkboxes multi-select
- Badge con count de cada keyword
- Scroll vertical
- "Limpiar selección" button

```tsx
// Wireframe ASCII:
┌─────────────────────────────────────┐
│ 🔍 Buscar keywords...         [x]   │ ← Input de búsqueda
├─────────────────────────────────────┤
│ ☑ covid-19                    (234) │ ← Checkbox + label + count
│ ☐ vacunación                  (156) │
│ ☑ salud                       (892) │
│ ☐ hidalgo                     (445) │
│ ☐ pachuca                     (334) │
│   ...más keywords filtradas...      │
├─────────────────────────────────────┤
│ [Limpiar]           [Aplicar (2)]   │ ← Footer
└─────────────────────────────────────┘
```

**4.2 Integrar en FilterBottomSheet** (30 min)
- Agregar sección "🏷️ Keywords"
- Usar KeywordSelector component
- Manejar estado de keywords seleccionadas

---

### **FASE 5: Frontend - Otros Componentes UI (2-3 horas)**

#### Subtareas:

**5.1 ContentCard para extracted** (30 min)
- Similar a ContentCard de generated
- Mostrar: título, outlet, fecha, preview
- Badge de estado
- Keywords chips (primeros 3)

**5.2 FilterChip + FilterChipList** (20 min)
- Reusar del generated content
- Ajustar colores/tipos si necesario

**5.3 SortSheet** (20 min)
- 5 opciones: publishedAt, extractedAt, title, category, author
- Toggle asc/desc

**5.4 FilterBottomSheet** (1-1.5 horas)
- 9 secciones:
  1. Búsqueda (Input)
  2. Estado (4 checkboxes)
  3. Dominio (select)
  4. Categoría (select)
  5. Autor (select)
  6. **Keywords (KeywordSelector component)** ⭐
  7. Tags (chips multi-select)
  8. Rango de fechas (date pickers)
  9. Otros (hasImages checkbox)

**5.5 EmptyState + LoadingState** (20 min)
- Reusar del generated content

---

### **FASE 6: Frontend - Actualizar generate.tsx Screen (1 hora)**

#### Subtareas:

**6.1 Agregar header fijo** (20 min)
- Título + contador
- 3 botones: Búsqueda, Filtros, Ordenar

**6.2 Integrar FilterBottomSheet** (15 min)
- Modal + estado visible/hidden
- Callback onApply

**6.3 Integrar SortSheet** (10 min)
- Modal + callback onSort

**6.4 Integrar FilterChipList** (15 min)
- Crear chips desde filtros activos
- onRemove handlers

---

### **FASE 7: Testing + Polish (1-2 horas)**

#### Subtareas:

**7.1 Testing manual backend** (30 min)
- Probar todos los filtros
- Verificar performance de índices
- Verificar keywords endpoint

**7.2 Testing manual frontend** (30 min)
- Probar flujo completo de filtros
- Verificar KeywordSelector con búsqueda
- Verificar scroll infinito con filtros
- Verificar pull-to-refresh

**7.3 Polish UI/UX** (30 min)
- Ajustar colores
- Ajustar spacing
- Ajustar feedback visual

---

## 📋 FASES RESUMIDAS PARA APROBACIÓN

| # | Fase | Tiempo | Descripción |
|---|------|--------|-------------|
| 1 | Backend keywords + índices | 1-2h | Agregar campo keywords, 7 índices, filtros, endpoint keywords |
| 2 | Frontend Types + Mappers | 45m | Types completos, mappers, API service |
| 3 | Frontend React Query Hooks | 30m | useExtractedContent con filtros, hooks auxiliares |
| 4 | **KeywordSelector Component** | 1.5-2h | **Selector con búsqueda integrada ⭐** |
| 5 | Otros Componentes UI | 2-3h | ContentCard, FilterChip, SortSheet, FilterBottomSheet |
| 6 | Actualizar generate.tsx Screen | 1h | Header fijo, integrar modals, chips |
| 7 | Testing + Polish | 1-2h | Testing manual, ajustes UI/UX |

**TOTAL: 8-10 horas (1-2 días)**

---

## 🎯 CARACTERÍSTICAS CLAVE

### 1. Keywords System con Búsqueda Integrada

**Backend:**
- Campo `keywords[]` en schema
- Endpoint `GET /noticias/extracted/keywords?search=covid`
- Retorna keywords con count
- Índice para performance

**Frontend:**
- Component `KeywordSelector` dedicado
- Input de búsqueda en tiempo real
- Multi-select con checkboxes
- Visual feedback (count badges)

### 2. Filtros Avanzados

**9 secciones de filtrado:**
1. Búsqueda de texto (full-text con Text Index)
2. Estado (4 opciones)
3. Dominio/Outlet
4. Categoría
5. Autor
6. **Keywords (con selector especial)**
7. Tags
8. Rango de fechas
9. Otros (hasImages)

### 3. Ordenamiento Híbrido

- publishedAt → extractedAt (fallback)
- 5 opciones: publishedAt, extractedAt, title, category, author
- asc/desc configurable

---

## ⚠️ RESTRICCIONES Y CONSIDERACIONES

### Restricciones del Documento Original

**De `/docs/FILTROS_CONTENIDOS_CONTEXT_FEATURE.md`:**

1. **NO usar `any` en TypeScript** ✅
2. **NO usar `forwardRef()`** - usar EventEmitter2 ✅
3. **TODAS las llamadas API con TanStack Query** ✅
4. **TODAS las respuestas mapeadas** (snake_case → camelCase) ✅
5. **Patrón obligatorio:** API Service → Mapper → TanStack Query Hook → Component ✅
6. **React Query Cache** para data grande (no URL params) ✅
7. **react-native-reusables** para UI components ✅

### Consideraciones Adicionales

**Performance:**
- Text Index puede impactar writes (aceptable para este caso)
- 16 índices total (9 existentes + 7 nuevos) - monitorear uso de RAM

**Data Migration:**
- Script para popular keywords en ~18 documentos existentes
- Extracción simple: split + frequency + top 10

**Mobile UX:**
- KeywordSelector debe funcionar bien en pantallas pequeñas
- Scroll dentro del selector (max-height)
- Búsqueda con debounce (300ms)

---

## 📊 COMPARACIÓN: ANTES vs DESPUÉS

| Característica | Antes | Después |
|----------------|-------|---------|
| **Filtros disponibles** | 7 | 13 (+6) |
| **Índices** | 9 | 16 (+7) |
| **Ordenamiento** | Básico | Híbrido |
| **Búsqueda** | Regex (lento) | Text Index (rápido) |
| **Keywords** | ❌ No existe | ✅ Selector + búsqueda |
| **UI de filtros** | ❌ No existe | ✅ Bottom Sheet completo |
| **Filter chips** | ❌ No | ✅ Sí |
| **Performance** | Regular | Optimizado |

---

## 📁 ARCHIVOS A CREAR/MODIFICAR

### Backend (7 archivos)

**Modificar:**
1. `src/noticias/schemas/extracted-noticia.schema.ts` - Agregar keywords + índices
2. `src/noticias/controllers/noticias.controller.ts` - Agregar endpoint keywords
3. `src/noticias/services/noticias-extraction.service.ts` - Agregar filtros

**Crear:**
4. `src/noticias/dto/extracted-content-filters.dto.ts` - DTO completo
5. `src/noticias/scripts/migrate-keywords.ts` - Script de migración

### Frontend (10 archivos)

**Crear:**
6. `src/types/extracted-content-filters.types.ts` - Types completos
7. `src/components/extracted-content/KeywordSelector.tsx` - **Componente clave**
8. `src/components/extracted-content/ContentCard.tsx`
9. `src/components/extracted-content/FilterBottomSheet.tsx`
10. `src/components/extracted-content/SortSheet.tsx`
11. `src/components/extracted-content/FilterChip.tsx`
12. `src/components/extracted-content/EmptyState.tsx`
13. `src/components/extracted-content/LoadingState.tsx`
14. `src/components/extracted-content/index.ts`

**Modificar:**
15. `src/utils/mappers.ts` - Agregar ExtractedContentFiltersMapper
16. `src/services/extracted-content/extractedContentApi.ts` - Agregar métodos
17. `src/hooks/useExtractedContent.ts` - Actualizar con filtros
18. `app/(protected)/(tabs)/generate.tsx` - Integrar todo

---

## 🎨 WIREFRAMES

### KeywordSelector Component (Vista detallada)

```
┌─────────────────────────────────────────────────────────┐
│ Keywords                                          [×]    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🔍 [Buscar keywords...                        ]        │ ← Input con debounce
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                   │   │
│  │  ☑ covid-19                              (234)   │   │ ← Checkbox + label + count
│  │  ☐ vacunación                            (156)   │   │
│  │  ☑ salud                                 (892)   │   │
│  │  ☐ hidalgo                               (445)   │   │
│  │  ☐ pachuca                               (334)   │   │
│  │  ☐ gobierno                              (289)   │   │
│  │  ☐ elecciones                            (198)   │   │
│  │  ☐ seguridad                             (176)   │   │
│  │  ☐ educación                             (145)   │   │
│  │  ☐ turismo                               (123)   │   │
│  │                                                   │   │
│  │  ...más keywords...                              │   │
│  │                                                   │   │
│  └─────────────────────────────────────────────────┘   │ ← Scroll area
│                                                          │
├─────────────────────────────────────────────────────────┤
│  [Limpiar selección]              [Aplicar (2)] →      │ ← Footer con acciones
└─────────────────────────────────────────────────────────┘
```

### FilterBottomSheet con Keywords

```
┌─────────────────────────────────────────────────────────┐
│ ═══  Filtros                                      [×]   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🔍 Búsqueda                                             │
│  [Buscar en título, contenido...                ]      │
│                                                          │
│  📊 Estado                                               │
│  ☑ Extraído  ☐ Pendiente  ☐ Fallido  ☐ Procesando     │
│                                                          │
│  🌐 Dominio                                              │
│  ⚪ Todos  ⚪ sintesis.mx  ⚪ independiente.com.mx       │
│                                                          │
│  📁 Categoría                                            │
│  ⚪ Todas  ⚪ Política  ⚪ Deportes  ⚪ Cultura           │
│                                                          │
│  ✍️ Autor                                                │
│  ⚪ Todos  ⚪ Redacción  ⚪ Juan Pérez                   │
│                                                          │
│  🏷️ Keywords                                    [Buscar]│ ← Abre KeywordSelector
│  Selected: covid-19, salud                      (2)     │
│                                                          │
│  📅 Rango de Fechas                                      │
│  Desde: [10/01/2025]  Hasta: [10/10/2025]              │
│                                                          │
│  ⚙️ Otros                                                │
│  ☑ Solo con imágenes                                    │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  [Resetear]                    [Aplicar (8)] →         │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST DE APROBACIÓN

**Por favor revisa y aprueba/rechaza cada fase:**

- [ ] **Fase 1:** Backend keywords + índices (1-2h)
- [ ] **Fase 2:** Frontend Types + Mappers (45m)
- [ ] **Fase 3:** Frontend React Query Hooks (30m)
- [ ] **Fase 4:** KeywordSelector Component (1.5-2h) ⭐
- [ ] **Fase 5:** Otros Componentes UI (2-3h)
- [ ] **Fase 6:** Actualizar generate.tsx Screen (1h)
- [ ] **Fase 7:** Testing + Polish (1-2h)

**Comentarios o ajustes requeridos:**
```
[Escribe aquí tus comentarios]
```

---

**Documentado por:** Claude Code (Jarvis)
**Fecha:** 10 de Octubre 2025
**Versión:** 1.0.0
