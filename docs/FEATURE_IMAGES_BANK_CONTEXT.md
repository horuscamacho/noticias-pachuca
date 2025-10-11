# 🏦 FEATURE: IMAGE BANK - BANCO DE IMÁGENES

**Fecha de creación**: 2025-10-10
**Estado**: En planificación
**Prioridad**: Alta
**Versión**: 2.0 (Sin Tests)

---

## 📋 TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Objetivos del Feature](#objetivos-del-feature)
3. [Investigación Técnica](#investigación-técnica)
4. [Arquitectura Propuesta](#arquitectura-propuesta)
5. [Plan de Implementación por Fases](#plan-de-implementación-por-fases)
6. [Reglas de Implementación](#reglas-de-implementación)
7. [Riesgos y Mitigaciones](#riesgos-y-mitigaciones)

---

## 🎯 RESUMEN EJECUTIVO

### ¿Qué es el Image Bank?

Un módulo completo de backend y frontend para almacenar, organizar y gestionar imágenes extraídas de contenidos web. Permite a los usuarios:

- Navegar imágenes extraídas en una galería de 3 columnas
- Filtrar por keywords, outlet, categorías
- Seleccionar múltiples imágenes para procesamiento en batch
- Almacenar imágenes procesadas en S3 con metadata removida
- Reutilizar imágenes para publicaciones futuras

### Hallazgos Clave de la Investigación

1. **Metadata Removal**: Sharp v0.33.0 (ya instalado) remueve EXIF/IPTC/XMP por defecto. NO se necesita librería adicional.

2. **Reutilización**: 80% del código existente es reutilizable:
   - ImageProcessorService (descarga, resize, S3 upload)
   - PaginationService (filtros y paginación)
   - UI components (Card, Badge, Skeleton, FilterBottomSheet)

3. **Arquitectura**: EventEmitter2 para evitar dependencias circulares entre ImageBank y ExtractedNoticia.

4. **Performance**: Bull Queue para procesamiento batch asíncrono.

---

## 🎯 OBJETIVOS DEL FEATURE

### Funcionales

1. **Backend**:
   - Nuevo módulo `image-bank` con schema MongoDB
   - API REST para CRUD de imágenes
   - Procesamiento de imágenes con metadata removal
   - Batch processing con queue system
   - Filtrado por keywords, outlet, categorías, fecha

2. **Frontend Mobile**:
   - Tab "Imagenes" (renombrar "publicar")
   - Grid de 3 columnas con infinite scroll
   - Multi-selección con long-press
   - Pantalla de detalle de imagen
   - Filtros (keywords, date sort)
   - Acción "Almacenar" (procesar y guardar)
   - Acción "Generar con IA" (placeholder)

### No Funcionales

- **Performance**: Procesar 100+ imágenes sin bloquear
- **Seguridad**: Remover TODA metadata de imágenes
- **Escalabilidad**: Queue workers distribuidos
- **UX**: Respuesta < 3s, feedback visual inmediato

---

## 🔬 INVESTIGACIÓN TÉCNICA

### 1. Metadata Removal

**Librería**: Sharp v0.33.0 (ya instalada)

**Hallazgo Crítico**: Sharp remueve metadata por defecto. El código actual YA cumple requisito.

```typescript
// ACTUAL (ya remueve metadata)
const buffer = await sharp(imageBuffer)
  .resize(1920, null)
  .webp({ quality: 90 })
  .toBuffer()
// ✅ EXIF, IPTC, XMP automáticamente removidos
```

### 2. Paginación

**Servicio Existente**: `PaginationService` (100% reutilizable)

```typescript
await this.paginationService.paginate(
  this.imageBankModel,
  { page: 1, limit: 30 },
  { keywords: { $in: ['accidente'] }, isActive: true },
  { sort: { createdAt: -1 } }
)
```

### 3. UI Components Disponibles

**react-native-reusables**:
- Card, CardHeader, CardTitle, CardContent
- Button, Badge, Skeleton
- Checkbox (para multi-selección)
- FilterBottomSheet, SortDropdown (reusables)

**expo-image**: v3.0.9 (mejor performance que RN Image)

### 4. Evitar Referencias Circulares

**Solución**: EventEmitter2 (ya instalado)

```typescript
// ExtractedNoticiaService emite evento
this.eventEmitter.emit('noticia.extracted', {
  noticiaId, images, keywords
})

// ImageBankEventsService escucha
@OnEvent('noticia.extracted')
async handleNoticiaExtracted(payload) {
  // Procesar imágenes automáticamente
}
```

---

## 🏗️ ARQUITECTURA PROPUESTA

### Backend

```
image-bank/
├── schemas/
│   └── image-bank.schema.ts         # MongoDB schema
├── services/
│   ├── image-bank.service.ts        # CRUD operations
│   ├── image-bank-processor.service.ts  # Image processing
│   └── image-bank-events.service.ts # EventEmitter handlers
├── processors/
│   └── image-bank-queue.processor.ts   # Bull queue worker
├── controllers/
│   └── image-bank.controller.ts     # REST API
├── dto/
│   └── image-bank.dto.ts           # Request/response DTOs
└── image-bank.module.ts
```

### Frontend

```
app/(protected)/(tabs)/
  images.tsx                 # Grid view (3 columnas)

app/(protected)/images/
  [id].tsx                   # Detail screen

src/hooks/
  useImages.ts               # useInfiniteQuery hook

src/services/api/
  imagesApi.ts              # API client

src/components/images/
  ImageCard.tsx             # Card individual
  ImageGrid.tsx             # Grid 3 columnas
  MultiSelectOverlay.tsx    # Overlay de selección
```

### Schema ImageBank

```typescript
{
  processedUrls: {
    original: string,      // CDN URL
    thumbnail: string,     // 400x250
    medium: string,        // 800x500
    large: string          // 1200x630
  },
  originalMetadata: {
    url: string,           // URL original
    width: number,
    height: number,
    format: string,
    sizeBytes: number
  },
  keywords: string[],      // Keywords de búsqueda
  outlet: string,          // Sitio origen
  categories: string[],    // Categorías
  extractedNoticiaId: ObjectId,
  sourceUrl: string,       // URL del artículo
  extractedAt: Date,
  processedAt: Date,
  usageCount: number,      // Veces usada
  isActive: boolean,
  metadataRemoved: boolean,  // Compliance flag
  quality: 'high' | 'medium' | 'low'
}
```

### API Endpoints

```
GET    /image-bank                    # Lista paginada con filtros
GET    /image-bank/:id                # Detalle de imagen
POST   /image-bank/store              # Almacenar imagen individual
POST   /image-bank/store-batch        # Batch de imágenes
POST   /image-bank/extract-from-noticia/:id  # Extraer de noticia
GET    /image-bank/search?query=...   # Búsqueda full-text
GET    /image-bank/stats              # Estadísticas
PATCH  /image-bank/:id/usage          # Tracking de uso
DELETE /image-bank/:id                # Soft delete
```

---

## 📅 PLAN DE IMPLEMENTACIÓN POR FASES

### FASE 1: Backend Core Infrastructure
**Duración estimada**: 1-2 días
**Agentes**: backend-architect

#### Tareas:
- [ ] 1.1 - Crear `image-bank.schema.ts` con todos los campos
- [ ] 1.2 - Crear indexes en MongoDB (keywords, outlet, dates)
- [ ] 1.3 - Crear `ImageBankProcessorService` (reutilizar ImageProcessor)
- [ ] 1.4 - Configurar S3 keys pattern (`image-bank/{outlet}/{year}/{month}/{id}/`)
- [ ] 1.5 - Build del backend: `yarn build`

**Entregables**:
- Schema completo con indexes
- Servicio de procesamiento funcional
- Build exitoso

---

### FASE 2: Backend API & Services
**Duración estimada**: 2 días
**Agentes**: backend-architect

#### Tareas:
- [ ] 2.1 - Crear `image-bank.service.ts` con CRUD completo
- [ ] 2.2 - Integrar `PaginationService` con filtros custom
- [ ] 2.3 - Crear DTOs de request/response con validación
- [ ] 2.4 - Crear `image-bank.controller.ts` con todos los endpoints
- [ ] 2.5 - Documentación Swagger de endpoints
- [ ] 2.6 - Build del backend: `yarn build`

**Entregables**:
- API REST completa
- Paginación con filtros funcionando
- Swagger docs actualizados

---

### FASE 3: Backend Queue & Events
**Duración estimada**: 1-2 días
**Agentes**: backend-architect

#### Tareas:
- [ ] 3.1 - Configurar Bull Queue `image-bank-processing`
- [ ] 3.2 - Crear `image-bank-queue.processor.ts`
- [ ] 3.3 - Implementar jobs: `store-single-image`, `store-batch-images`
- [ ] 3.4 - Crear `image-bank-events.service.ts` con EventEmitter2
- [ ] 3.5 - Listener de evento `noticia.extracted`
- [ ] 3.6 - Emitir evento `imageBank.imageStored`
- [ ] 3.7 - Build del backend: `yarn build`

**Entregables**:
- Queue system funcionando
- Procesamiento batch asíncrono
- Eventos desacoplados

---

### FASE 4: Frontend - Tab & Navigation
**Duración estimada**: 1 día
**Agentes**: frontend-developer, ui-ux-designer

#### Tareas:
- [ ] 4.1 - Renombrar tab "publicar" → "imagenes" en `_layout.tsx`
- [ ] 4.2 - Cambiar icono a `photo.stack`
- [ ] 4.3 - Crear estructura de navegación `app/(protected)/images/[id].tsx`
- [ ] 4.4 - Configurar stack navigator para detalle
- [ ] 4.5 - Diseño UX de flujo completo (wireframes texto)

**Entregables**:
- Tab renombrado y funcional
- Navegación configurada
- UX flow documentado

---

### FASE 5: Frontend - API Integration
**Duración estimada**: 1-2 días
**Agentes**: frontend-developer

#### Tareas:
- [ ] 5.1 - Crear types en `image-bank.types.ts` (API y App namespaces)
- [ ] 5.2 - Crear `imagesApi.ts` con getRawClient pattern
- [ ] 5.3 - Crear mappers API → App (camelCase)
- [ ] 5.4 - Crear `useImages.ts` hook con useInfiniteQuery
- [ ] 5.5 - Crear `useImageById.ts` hook

**Entregables**:
- API client completo
- Hooks de React Query funcionando
- Types correctamente definidos

---

### FASE 6: Frontend - Image Grid View
**Duración estimada**: 2 días
**Agentes**: frontend-developer, ui-ux-designer

#### Tareas:
- [ ] 6.1 - Crear `ImageCard.tsx` component (card individual)
- [ ] 6.2 - Implementar grid en `images.tsx` (FlatList 3 columnas)
- [ ] 6.3 - Integrar expo-image con caching
- [ ] 6.4 - Implementar infinite scroll (onEndReached)
- [ ] 6.5 - Pull-to-refresh con RefreshControl
- [ ] 6.6 - Loading states (skeleton, spinner)
- [ ] 6.7 - Empty state component

**Entregables**:
- Grid funcional con 3 columnas
- Infinite scroll operativo
- Estados de carga correctos

---

### FASE 7: Frontend - Filters & Sort
**Duración estimada**: 1-2 días
**Agentes**: frontend-developer, ui-ux-designer

#### Tareas:
- [ ] 7.1 - Adaptar `KeywordSelector` para imágenes
- [ ] 7.2 - Adaptar `SortDropdown` para date sort
- [ ] 7.3 - Implementar FilterChipList para active filters
- [ ] 7.4 - State management de filtros (local state)
- [ ] 7.5 - Integrar filtros con useImages hook
- [ ] 7.6 - Diseño UX de filtros (brand color #f1ef47)

**Entregables**:
- Sistema de filtros completo
- Keywords filter funcional
- Sort by date (asc/desc)

---

### FASE 8: Frontend - Multi-Selection
**Duración estimada**: 1-2 días
**Agentes**: frontend-developer, ui-ux-designer

#### Tareas:
- [ ] 8.1 - Implementar estado de selección (Set<string>)
- [ ] 8.2 - Long-press gesture para activar multi-select
- [ ] 8.3 - Tap para toggle selección
- [ ] 8.4 - Overlay visual con checkbox
- [ ] 8.5 - Action bar con contador de seleccionados
- [ ] 8.6 - Botón "Almacenar" para batch
- [ ] 8.7 - Botón "Cancelar selección"
- [ ] 8.8 - Haptic feedback en selección

**Entregables**:
- Multi-selección funcional
- UX clara y fluida
- Feedback táctil

---

### FASE 9: Frontend - Detail Screen
**Duración estimada**: 1-2 días
**Agentes**: frontend-developer, ui-ux-designer

#### Tareas:
- [ ] 9.1 - Crear pantalla `[id].tsx` con layout
- [ ] 9.2 - Hero image (full width)
- [ ] 9.3 - Metadata display (source, date, keywords)
- [ ] 9.4 - Botones de acción ("Almacenar", "Generar con IA")
- [ ] 9.5 - Carousel de imágenes relacionadas (si existen)
- [ ] 9.6 - Multi-selección en carousel
- [ ] 9.7 - Navegación back

**Entregables**:
- Pantalla de detalle completa
- Botones de acción integrados
- Related images carousel

---

### FASE 10: Integration - "Almacenar" Action
**Duración estimada**: 1-2 días
**Agentes**: frontend-developer, backend-architect

#### Tareas:
- [ ] 10.1 - Hook `useStoreImage` mutation
- [ ] 10.2 - Hook `useStoreBatch` mutation
- [ ] 10.3 - Loading indicators durante procesamiento
- [ ] 10.4 - Success/error notifications
- [ ] 10.5 - Invalidación de cache de React Query
- [ ] 10.6 - Toast messages con feedback

**Entregables**:
- Acción "Almacenar" funcional
- Feedback visual completo
- Cache actualizado correctamente

---

### FASE 11: Documentation & Deploy
**Duración estimada**: 1 día
**Agentes**: backend-architect, frontend-developer

#### Tareas:
- [ ] 11.1 - Documentación de API (Swagger completo)
- [ ] 11.2 - Documentación de componentes frontend
- [ ] 11.3 - README de feature
- [ ] 11.4 - Guía de usuario (screenshots)
- [ ] 11.5 - Build final del backend: `yarn build`
- [ ] 11.6 - Verificación de producción

**Entregables**:
- Documentación completa
- Feature en producción

---

## ⚠️ REGLAS DE IMPLEMENTACIÓN

### Prohibiciones

1. **PROHIBIDO usar `any`** en TypeScript
   - Usar `unknown` y type guards si es necesario
   - Definir tipos explícitos para todo

2. **PROHIBIDO referencias circulares**
   - Usar EventEmitter2 para desacoplar módulos
   - Verificar con `madge` antes de cada build

3. **PROHIBIDO decisiones unilaterales**
   - Preguntar antes de cambiar arquitectura
   - Reportar antes de agregar dependencias

4. **PROHIBIDO commits sin build exitoso**
   - Backend: `yarn build` debe pasar
   - Frontend: no aplica (solo desarrollo)

5. **PROHIBIDO tests unitarios y E2E**
   - NO crear archivos .spec.ts
   - NO crear tests de integración
   - CI/CD ya funciona bien

### Requerimientos

1. **Usar agentes especializados**
   - backend-architect: Backend tasks
   - frontend-developer: Frontend mobile tasks
   - ui-ux-designer: Diseño y UX

2. **Marcar tareas completadas**
   - Actualizar checklist inmediatamente
   - No batchear completions

3. **Build al final de cada fase backend**
   - Fase 1, 2, 3, 11: `yarn build` obligatorio
   - Reportar errores antes de continuar

4. **Validar con usuario**
   - Al final de cada fase: mostrar progreso
   - Esperar luz verde para siguiente fase

---

## 🚨 RIESGOS Y MITIGACIONES

### Riesgo 1: Metadata no completamente removida
**Impacto**: ALTO - Legal/Privacy
**Mitigación**:
- Sharp default behavior removes metadata
- Documentar compliance para auditorías
- Verificar manualmente con sharp.metadata()

### Riesgo 2: Performance con 1000+ imágenes
**Impacto**: MEDIO - UX
**Mitigación**:
- Infinite scroll con virtualization
- Indexes MongoDB optimizados
- CDN caching agresivo

### Riesgo 3: Queue jobs fallando
**Impacto**: MEDIO - Data loss
**Mitigación**:
- Bull retry mechanism (3 attempts)
- Dead letter queue
- Logging exhaustivo

### Riesgo 4: S3 upload failures
**Impacto**: MEDIO - User frustration
**Mitigación**:
- Exponential backoff
- User feedback visible
- Retry button en UI

### Riesgo 5: Circular dependency ExtractedNoticia
**Impacto**: BAJO - Build errors
**Mitigación**:
- EventEmitter2 pattern desde inicio
- Verificar con madge

---

## 📊 ESTIMACIÓN TOTAL

**Tiempo total estimado**: 12-18 días
**Sprints**: 2-3 sprints de 1 semana

**Desglose**:
- Backend (Fases 1-3): 4-6 días
- Frontend (Fases 4-9): 7-10 días
- Integration (Fase 10): 1-2 días
- Docs (Fase 11): 1 día

**Recursos**:
- 1 Backend Developer (con backend-architect agent)
- 1 Frontend Developer (con frontend-developer agent)
- UX Designer (ui-ux-designer agent)

---

## ✅ CRITERIOS DE ACEPTACIÓN

### Backend
- [ ] API completa documentada en Swagger
- [ ] Metadata removal verificado manualmente
- [ ] Queue processing < 3s por imagen
- [ ] Paginación con todos los filtros
- [ ] EventEmitter2 sin circular deps
- [ ] Build exitoso: `yarn build`

### Frontend
- [ ] Grid 3 columnas responsive
- [ ] Multi-selección fluida (< 100ms feedback)
- [ ] Infinite scroll sin lag
- [ ] Filtros aplicados correctamente
- [ ] Detail screen completa
- [ ] "Almacenar" procesa y notifica

### Performance
- [ ] Grid carga < 2s (20 imágenes)
- [ ] Scroll 60fps consistente
- [ ] Batch 10 imágenes < 30s
- [ ] Cache hit rate > 80%

---

## 📚 REFERENCIAS

### Documentación Externa
- Sharp: https://sharp.pixelplumbing.com/api-operation#withmetadata
- Bull: https://docs.bullmq.io/
- EventEmitter2: https://github.com/EventEmitter2/EventEmitter2
- expo-image: https://docs.expo.dev/versions/latest/sdk/image/

### Código Existente
- ImageProcessorService: `/api-nueva/src/pachuca-noticias/services/image-processor.service.ts`
- PaginationService: `/api-nueva/src/common/services/pagination.service.ts`
- useExtractedNews: `/mobile-expo/src/hooks/useExtractedNewsFilters.ts`
- generate.tsx: `/mobile-expo/app/(protected)/(tabs)/generate.tsx`

---

**Documento creado**: 2025-10-10
**Última actualización**: 2025-10-10 (v2.0 - Sin Tests)
**Autor**: AI Assistant (Jarvis) + Coyotito
**Estado**: Pendiente de aprobación
