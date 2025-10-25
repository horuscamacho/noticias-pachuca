# CREACIÓN DE CONTENIDO ORIGINAL MANUAL - PLAN DE IMPLEMENTACIÓN ACTUALIZADO

**Fecha:** 21 de Octubre, 2025
**Proyecto:** Noticias Pachuca
**Feature:** Manual Content Creation (Urgent + Normal Mode)
**Última Actualización:** 22 de Octubre, 2025

---

## ⚠️ REVISIÓN CRÍTICA: QUÉ YA EXISTE vs QUÉ CREAR

Este documento fue revisado para **EVITAR DUPLICACIÓN** de código existente.

**Hallazgos Clave:**
- ❌ **FASE 2 COMPLETA ELIMINADA** - FileUploadService YA EXISTE como `FileManagementService`
- ⚠️ **FASE 4 SIMPLIFICADA** - ScheduleModule ya instalado, solo falta importar
- ⚠️ **FASES 7-8 AJUSTADAS** - Pattern de Frontend ya establecido
- ⚠️ **FASE 6 MODIFICADA** - Reutilizar servicios de Social Media existentes

**Tiempo Original:** 53-72 horas (6.5-9 días)
**Tiempo Actualizado:** 43-60 horas (5.5-7.5 días)
**Ahorro:** 10-12 horas de trabajo eliminado ✅

---

## TABLA DE CONTENIDOS

1. [Contexto de la Funcionalidad](#1-contexto-de-la-funcionalidad)
2. [Análisis Consolidado](#2-análisis-consolidado)
3. [⚠️ REVISIÓN INFRAESTRUCTURA EXISTENTE](#3-revisión-infraestructura-existente)
4. [Plan de Implementación por Fases (ACTUALIZADO)](#4-plan-de-implementación-por-fases)
5. [Diagramas de Flujo](#5-diagramas-de-flujo)
6. [Cronograma Estimado](#6-cronograma-estimado)
7. [Criterios de Aceptación](#7-criterios-de-aceptación)

---

## 1. CONTEXTO DE LA FUNCIONALIDAD

### 1.1 Problemática Actual

Actualmente el sistema solo permite generar contenido a partir de noticias extraídas (scraping). No existe forma de:
- Crear contenido original manualmente
- Publicar noticias de última hora rápidamente
- Gestionar noticias en desarrollo que requieren actualizaciones

### 1.2 Solución Propuesta

Implementar un sistema de creación de contenido original manual con **DOS MODOS** de operación:

#### MODO 1: URGENT (Breaking News / Última Hora)

**Características:**
- Usuario proporciona: título, contenido, imágenes/videos (opcional)
- IA procesa con **redacción CORTA** (300-500 palabras max)
- Se marca con bandera `urgent: true`
- **Auto-publicación INMEDIATA** sin intervención manual
- **Copys de redes sociales MÁS AGRESIVOS** para maximizar engagement
- Texto final incluye: "**Contenido en desarrollo** - Información en actualización"

**Flujo de 2 Horas:**
- Al crear: Se publica inmediatamente y aparece en cintillo "ÚLTIMO MOMENTO"
- Durante 2 horas: Aparece en tab "Noticias en Progreso"
- **Opción A - SIN actualización después de 2h:**
  - Sistema auto-cierra la noticia
  - IA agrega párrafo final: "Al cierre de este bloque informativo no se recibieron actualizaciones por parte de los involucrados"
  - Se remueve del cintillo pero permanece publicada
- **Opción B - CON actualización antes de 2h:**
  - Usuario reemplaza contenido con nueva información
  - IA re-procesa y re-publica
  - Timer de 2 horas se reinicia

#### MODO 2: NORMAL (Publicación Manual)

**Características:**
- Usuario proporciona: título, contenido, imágenes/videos
- IA procesa con **redacción NORMAL** (500-700 palabras)
- Usuario decide tipo de publicación:
  - **Breaking**: Publicación inmediata con notificación push
  - **Noticia**: Publicación normal con difusión en redes
  - **Post de Blog**: Publicación sin difusión inmediata
- **NO tiene outlet asociado** (contenido original de usuario)
- Proceso de publicación 80% igual al flujo actual

---

## 2. ANÁLISIS CONSOLIDADO

### 2.1 Backend - Componentes Principales

#### Schemas MongoDB Nuevos/Modificados

**NUEVO: `UserGeneratedContent`**
```typescript
{
  // Contenido original
  originalTitle: string;
  originalContent: string;
  uploadedImageUrls: string[];
  uploadedVideoUrls: string[];

  // Modo de publicación
  mode: 'urgent' | 'normal';
  publicationType?: 'breaking' | 'noticia' | 'blog';

  // Gestión de URGENT
  isUrgent: boolean;
  urgentCreatedAt?: Date;
  urgentAutoCloseAt?: Date; // urgentCreatedAt + 2 horas
  urgentClosed: boolean;
  urgentClosedAt?: Date;
  urgentClosedBy?: 'user' | 'system';

  // Contenido procesado por IA
  generatedContentId?: ObjectId; // Ref a AIContentGeneration
  publishedNoticiaId?: ObjectId; // Ref a PublishedNoticia

  // Metadata
  createdBy: ObjectId; // Ref a User
  status: 'draft' | 'processing' | 'published' | 'closed';
}
```

**MODIFICADO: `AIContentGeneration`**
- Agregar campo `urgent: boolean`
- Agregar campo `urgentCopyStyle: 'aggressive' | 'normal'`

**MODIFICADO: `PublishedNoticia`**
- Agregar campo `isUrgent: boolean`
- Agregar índice compuesto `{ isUrgent: 1, publishedAt: -1 }`

---

## 3. ⚠️ REVISIÓN INFRAESTRUCTURA EXISTENTE

### 3.1 BACKEND - LO QUE YA EXISTE

#### ✅ File Upload - COMPLETAMENTE IMPLEMENTADO

**Servicios Existentes:**
```typescript
FileManagementService (src/files/services/file-management.service.ts)
├─ uploadFile(file, options) ✅ líneas 94-150
├─ validateFile(file, fileType) ✅ línea 1087
│  ├─ Valida tamaño máximo
│  ├─ Valida que no esté vacío
│  └─ Valida MIME types permitidos
├─ calculateChecksum(file) ✅ línea 121
└─ Integración completa con S3

AwsS3CoreService (src/files/services/aws-s3-core.service.ts)
├─ S3Client YA configurado ✅
├─ putObject() ✅
├─ getObject() ✅
├─ deleteObject() ✅
├─ getPresignedUrl() ✅
└─ Multipart upload support ✅

StorageProviderService (src/files/services/storage-provider.service.ts)
└─ Abstracción completa de storage providers ✅
```

**DTOs Existentes:**
```typescript
src/files/dto/file-upload.dto.ts:
├─ FileUploadDto ✅
├─ MultipleFileUploadDto ✅ (max 10 archivos)
├─ ImageProcessingDto ✅
├─ VideoProcessingDto ✅
├─ PresignedUrlRequestDto ✅
└─ ChunkUploadInitDto ✅
```

**Interfaces Existentes:**
```typescript
src/files/interfaces/file.interface.ts:
├─ FileValidationRules ✅
│  ├─ maxSize
│  ├─ allowedTypes
│  ├─ allowedMimeTypes
│  ├─ allowedExtensions
│  ├─ requireVirusCheck (definido pero NO implementado)
│  └─ requireImageOptimization
├─ UploadOptions ✅
├─ UploadResult ✅
└─ FileStorageMetadata ✅
```

**⚠️ NOTA IMPORTANTE:**
El campo `requireVirusCheck: boolean` está DEFINIDO en la interface pero **NO HAY IMPLEMENTACIÓN** de detección de contenido malicioso. Solo valida:
- Tamaño de archivo
- MIME type
- Archivo no vacío

#### ✅ Scheduling - YA INSTALADO

**Dependencia:**
```bash
@nestjs/schedule ✅ YA INSTALADO
```

**Servicios que YA usan @Cron:**
- `generator-pro/services/generator-pro-scheduler.service.ts` ✅
- `community-manager/services/scheduled-posts-cron.service.ts` ✅
- `community-manager/services/cleanup.service.ts` ✅
- `community-manager/services/auto-optimization.service.ts` ✅
- `facebook/services/facebook-monitor.service.ts` ✅

**❌ LO QUE FALTA:**
```typescript
// En app.module.ts NO está importado:
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(), // ❌ FALTA AGREGAR ESTO
  ]
})
```

#### ✅ EventEmitter2 - YA CONFIGURADO

```typescript
// app.module.ts línea 6:
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    EventEmitterModule.forRoot(), ✅
  ]
})
```

**Servicios que YA usan EventEmitter2:**
- `generator-pro/services/generator-pro-prompt-builder.service.ts` ✅
- `generator-pro/services/generator-pro-orchestrator.service.ts` ✅
- `generator-pro/services/social-media-publishing.service.ts` ✅
- Y otros 13 servicios más...

#### ✅ Prompt Builder - YA EXISTE

```typescript
GeneratorProPromptBuilderService (línea 17)
├─ buildPrompt() ✅ línea 29
├─ buildAntiFormatRestriction() ✅
├─ buildEnrichedGuidelines() ✅
├─ buildSocialMediaInstructions() ✅
└─ buildSystemPrompt() ✅

SocialMediaCopyGeneratorService ✅
└─ Generación de copys para redes sociales

DirectorEditorialPromptBuilderService ✅
└─ Otro builder de prompts específico
```

#### ✅ Social Media Publishing - YA EXISTE

```typescript
SocialMediaPublishingService (línea 18)
├─ publishToSocialMedia() ✅
├─ publishToFacebook() ✅
└─ publishToTwitter() ✅

FacebookPublishingService ✅
└─ Publicación directa en Facebook

TwitterPublishingService ✅
└─ Publicación directa en Twitter
```

#### ✅ Controller Pattern - YA ESTABLECIDO

```typescript
GeneratorProController (línea 88)
├─ 30+ endpoints existentes ✅
├─ Pattern con DTOs de validación ✅
├─ Decoradores @ApiOperation ✅
├─ Guards @UseGuards(JwtAuthGuard) ✅
└─ CurrentUser decorator ✅
```

---

### 3.2 FRONTEND - LO QUE YA EXISTE

#### ✅ Services API Pattern

**Ubicación:** `packages/mobile-expo/src/services/`

```typescript
Servicios API existentes:
├─ generatedContentApi.ts ✅
├─ imageBankApi.ts ✅
├─ extractedContentApi.ts ✅
├─ publishApi.ts ✅
├─ contentAgentsApi.ts ✅
└─ ApiClient.ts ✅ (cliente base)
```

**Pattern Establecido:**
```typescript
// Ejemplo: generatedContentApi.ts
export const generatedContentApi = {
  getGeneratedContent: async (filters) => {
    // Transformar filtros App → API (camelCase → snake_case)
    const apiFilters = Mapper.toAPI(filters)
    const response = await ApiClient.getRawClient().get('/endpoint', { params: apiFilters })
    return Mapper.toApp(response.data)
  }
}
```

#### ✅ Mappers

**Ubicación:** `packages/mobile-expo/src/utils/mappers/` (NO en `services/mappers/`)

```typescript
GeneratedContentMapper ✅
├─ toAPI() - camelCase → snake_case
└─ toApp() - snake_case → camelCase

GeneratedContentFiltersMapper ✅
├─ toAPI()
└─ paginatedToApp()
```

**⚠️ NOTA:** El plan original decía crear mappers en `services/mappers/` pero ya existen en `utils/mappers/`.

#### ✅ Hooks TanStack Query Pattern

**Ubicación:** `packages/mobile-expo/src/hooks/`

```typescript
Hooks existentes (35+):
├─ useGeneratedContent.ts ✅
├─ useExtractedContent.ts ✅
├─ useUploadImages.ts ✅
├─ usePublishContent.ts ✅
├─ useContentGenerationSocket.ts ✅
├─ useSocialMedia.ts ✅
└─ useImproveCopy.ts ✅
```

**Pattern Establecido:**
```typescript
// Ejemplo: useGeneratedContent.ts
export const generatedContentKeys = {
  all: ['generated-content'] as const,
  lists: () => [...generatedContentKeys.all, 'list'] as const,
  detail: (id: string) => [...generatedContentKeys.details(), id] as const
};

export function useGenerateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request) => generatedContentApi.generateContent(request),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: generatedContentKeys.lists() });
    }
  });
}
```

#### ✅ Socket Service - YA IMPLEMENTADO

**Ubicación:** `packages/mobile-expo/src/features/socket/`

```typescript
SocketService (Singleton) ✅
├─ getInstance(queryClient)
├─ connect()
├─ disconnect()
├─ socket.on(event, handler)
└─ socket.off(event, handler)

useContentGenerationSocket() ✅ (línea 21)
├─ Escucha 'content:generation-started'
├─ Escucha 'content:generation-completed'
├─ Escucha 'content:generation-failed'
├─ Invalida queries automáticamente
└─ Retorna { processingIds, isProcessing }
```

**Pattern Establecido:**
```typescript
export function useContentGenerationSocket(options?) {
  const queryClient = useQueryClient();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const socketService = SocketService.getInstance(queryClient);
    const socket = socketService.socket;

    socket.on('content:generation-started', handleStarted);
    socket.on('content:generation-completed', handleCompleted);

    return () => {
      socket.off('content:generation-started', handleStarted);
      socket.off('content:generation-completed', handleCompleted);
    };
  }, [queryClient]);

  return { processingIds, isProcessing: (id) => processingIds.has(id) };
}
```

#### ✅ Component Patterns

**Ubicación:** `packages/mobile-expo/src/components/`

```typescript
Componentes base existentes:
├─ FilterBottomSheet.tsx ✅ (filtros en bottom sheet)
├─ SortSheet.tsx ✅ (ordenamiento)
├─ ContentCard.tsx ✅ (tarjetas de contenido)
├─ EmptyState.tsx ✅ (estado vacío)
├─ AgentFormFields.tsx ✅ (formularios de agentes)
├─ SiteFormFields.tsx ✅ (formularios de sitios)
├─ GenerateImageModal.tsx ✅ (modal de generación)
└─ FilterChip.tsx ✅ (chips de filtros)
```

#### ✅ Types Pattern

**Ubicación:** `packages/mobile-expo/src/types/`

```typescript
Tipos existentes (18 archivos):
├─ generated-content.types.ts ✅
│  ├─ SocialMediaCopies
│  ├─ GenerationMetadata
│  ├─ PublishingInfo
│  └─ GeneratedContent
├─ extracted-content.types.ts ✅
├─ publish.types.ts ✅
├─ image-bank.types.ts ✅
└─ content-agent.types.ts ✅
```

---

## 4. PLAN DE IMPLEMENTACIÓN POR FASES

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### FASE 1: Backend - Schemas y DTOs (4-6 horas)
### ✅ ESTADO: CREAR NUEVO (no existe duplicación)
### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Objetivo:** Crear la estructura de datos en MongoDB y DTOs de validación.

**Duración Estimada:** 4-6 horas
**Dependencias:** Ninguna

#### ⚠️ REUTILIZAR:
- ✅ Pattern de schemas existentes en `generator-pro/schemas/`
- ✅ Pattern de DTOs existentes en `generator-pro/dto/`
- ✅ Decoradores `@Prop()` ya usados en otros schemas
- ✅ Validaciones class-validator ya implementadas

#### Checklist de Tareas:

**Schemas:**
- [ ] Crear `/src/generator-pro/schemas/user-generated-content.schema.ts`
  - [ ] Definir interface `UserGeneratedContent`
  - [ ] Agregar decoradores `@Prop()` con validaciones
  - [ ] Crear índices para `isUrgent`, `status`, `urgentAutoCloseAt`
  - [ ] Exportar `UserGeneratedContentDocument` type

- [ ] Modificar `/src/generator-pro/schemas/ai-content-generation.schema.ts`
  - [ ] Agregar campo `urgent: boolean` (opcional, default false)
  - [ ] Agregar campo `urgentCopyStyle: 'aggressive' | 'normal'` (opcional)

- [ ] Modificar `/src/noticias/schemas/published-noticia.schema.ts`
  - [ ] Agregar campo `isUrgent: boolean` con default `false`
  - [ ] Agregar índice compuesto `{ isUrgent: 1, publishedAt: -1 }`

**DTOs:**
- [ ] Crear `/src/generator-pro/dto/create-urgent-content.dto.ts`
  ```typescript
  export class CreateUrgentContentDto {
    @IsString() @IsNotEmpty() originalTitle: string;
    @IsString() @IsNotEmpty() originalContent: string;
    @IsArray() @IsOptional() uploadedImageUrls?: string[];
    @IsArray() @IsOptional() uploadedVideoUrls?: string[];
  }
  ```

- [ ] Crear `/src/generator-pro/dto/create-normal-content.dto.ts`
  ```typescript
  export class CreateNormalContentDto extends CreateUrgentContentDto {
    @IsEnum(['breaking', 'noticia', 'blog']) publicationType: string;
  }
  ```

- [ ] Crear `/src/generator-pro/dto/update-urgent-content.dto.ts`
  ```typescript
  export class UpdateUrgentContentDto {
    @IsString() @IsNotEmpty() newContent: string;
    @IsArray() @IsOptional() newImageUrls?: string[];
  }
  ```

**Módulos:**
- [ ] Modificar `/src/generator-pro/generator-pro.module.ts`
  - [ ] Importar `MongooseModule.forFeature([{ name: UserGeneratedContent.name, schema: UserGeneratedContentSchema }])`

**Archivos a Modificar/Crear:**
- `src/generator-pro/schemas/user-generated-content.schema.ts` - CREAR
- `src/generator-pro/schemas/ai-content-generation.schema.ts` - MODIFICAR (agregar 2 campos)
- `src/noticias/schemas/published-noticia.schema.ts` - MODIFICAR (agregar 1 campo + índice)
- `src/generator-pro/dto/create-urgent-content.dto.ts` - CREAR
- `src/generator-pro/dto/create-normal-content.dto.ts` - CREAR
- `src/generator-pro/dto/update-urgent-content.dto.ts` - CREAR
- `src/generator-pro/generator-pro.module.ts` - MODIFICAR (agregar schema a imports)

**Build y Verificación:**
```bash
cd packages/api-nueva
npm run build
# Verificar que no hay errores de TypeScript
```

**Resumen Ejecutivo de la Fase:**
Al completar esta fase tendrás la estructura de datos completa en MongoDB y todos los DTOs de validación listos. Podrás verificar que los schemas están bien definidos y que TypeScript compila sin errores.

---

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### ❌ FASE 2: ELIMINADA - FileUploadService YA EXISTE
### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**⚠️ ESTA FASE FUE ELIMINADA COMPLETAMENTE**

**Razón:** `FileManagementService` YA EXISTE con toda la funcionalidad necesaria.

**Lo que el plan original quería crear:**
- ❌ FileUploadService con uploadImage() y uploadVideo()
- ❌ S3Client configuration
- ❌ Validaciones de tipo y tamaño
- ❌ Upload a S3

**Lo que ya existe:**
- ✅ `FileManagementService.uploadFile()` (líneas 94-150)
- ✅ `AwsS3CoreService` con S3Client configurado
- ✅ `StorageProviderService` con abstracción completa
- ✅ DTOs: `FileUploadDto`, `MultipleFileUploadDto`, etc.

**Acción Requerida:**
En FASE 3, inyectar `FileManagementService` en lugar de crear servicio nuevo.

**Tiempo Ahorrado:** 3-4 horas ✅

---

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### FASE 3 (anteriormente FASE 3): Backend - UserContentService (6-8 horas)
### ✅ ESTADO: CREAR NUEVO pero REUTILIZAR servicios existentes
### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Objetivo:** Crear servicio principal para gestión de contenido generado por usuario.

**Duración Estimada:** 6-8 horas
**Dependencias:** FASE 1 completada

#### ⚠️ CAMBIOS IMPORTANTES:

**❌ NO CREAR:**
- FileUploadService (no existe, usar `FileManagementService`)

**✅ REUTILIZAR:**
- `FileManagementService` para upload de archivos
- `GeneratorProPromptBuilderService` para prompts
- `ProviderFactoryService` para llamadas a IA
- `SocialMediaPublishingService` para publicaciones
- `EventEmitter2` para eventos

#### Checklist de Tareas:

- [ ] Crear `/src/generator-pro/services/user-content.service.ts`
  - [ ] Inyectar dependencias:
    - [ ] `@InjectModel(UserGeneratedContent.name) private userContentModel`
    - [ ] `@InjectModel(AIContentGeneration.name) private aiContentModel`
    - [ ] ⚠️ `FileManagementService` (NO FileUploadService)
    - [ ] `GeneratorProPromptBuilderService`
    - [ ] `ProviderFactoryService`
    - [ ] ⚠️ `SocialMediaPublishingService` (para publicaciones)
    - [ ] `EventEmitter2`
    - [ ] `Logger`

**Métodos Principales:**

- [ ] `createUrgentContent(dto: CreateUrgentContentDto, userId: string): Promise<UserGeneratedContentDocument>`
  - [ ] Crear documento en `UserGeneratedContent` con mode='urgent', isUrgent=true
  - [ ] Calcular `urgentAutoCloseAt` = now + 2 horas
  - [ ] Emitir evento `content.urgent.created` con EventEmitter2
  - [ ] Procesar con IA usando prompt CORTO (300-500 palabras)
  - [ ] Generar copys AGRESIVOS para redes sociales
  - [ ] ⚠️ Usar `SocialMediaPublishingService.publishToSocialMedia()` para auto-publicar
  - [ ] Retornar documento creado

- [ ] `createNormalContent(dto: CreateNormalContentDto, userId: string): Promise<UserGeneratedContentDocument>`
  - [ ] Crear documento en `UserGeneratedContent` con mode='normal'
  - [ ] Procesar con IA usando prompt NORMAL (500-700 palabras)
  - [ ] Generar copys normales para redes sociales
  - [ ] Según `publicationType`:
    - [ ] 'breaking' → Auto-publicar con notificación push
    - [ ] 'noticia' → Auto-publicar sin notificación
    - [ ] 'blog' → Guardar sin publicar
  - [ ] Retornar documento creado

- [ ] `updateUrgentContent(id: string, dto: UpdateUrgentContentDto, userId: string): Promise<UserGeneratedContentDocument>`
  - [ ] Buscar contenido urgent por ID
  - [ ] Verificar que NO esté cerrado (`urgentClosed: false`)
  - [ ] Actualizar `originalContent` con `dto.newContent`
  - [ ] Re-procesar con IA (nueva versión)
  - [ ] Re-publicar
  - [ ] **REINICIAR timer:** `urgentAutoCloseAt` = now + 2 horas
  - [ ] Emitir evento `content.urgent.updated`
  - [ ] Retornar documento actualizado

- [ ] `closeUrgentContent(id: string, closedBy: 'user' | 'system', userId?: string): Promise<UserGeneratedContentDocument>`
  - [ ] Buscar contenido urgent por ID
  - [ ] Marcar como cerrado: `urgentClosed: true`, `urgentClosedAt: now`, `urgentClosedBy`
  - [ ] Si `closedBy === 'system'`:
    - [ ] Generar párrafo de cierre con IA
    - [ ] Actualizar contenido publicado con párrafo de cierre
  - [ ] Emitir evento `content.urgent.closed`
  - [ ] Retornar documento

- [ ] `getActiveUrgentContent(): Promise<UserGeneratedContentDocument[]>`
  - [ ] Query: `{ isUrgent: true, urgentClosed: false, status: 'published' }`
  - [ ] Ordenar por `urgentCreatedAt` DESC
  - [ ] Retornar lista

**EventEmitter2 Events:**
```typescript
this.eventEmitter.emit('content.urgent.created', {
  userContentId: doc._id,
  userId,
  urgentAutoCloseAt: doc.urgentAutoCloseAt,
});

this.eventEmitter.emit('content.urgent.updated', { userContentId: doc._id });
this.eventEmitter.emit('content.urgent.closed', { userContentId: doc._id, closedBy });
```

**Archivos a Modificar/Crear:**
- `src/generator-pro/services/user-content.service.ts` - CREAR
- `src/generator-pro/generator-pro.module.ts` - MODIFICAR (agregar a providers)

**Build y Verificación:**
```bash
npm run build
```

**Resumen Ejecutivo de la Fase:**
Al completar esta fase tendrás el servicio core que maneja toda la lógica de creación, actualización y cierre de contenido urgente y normal. Reutilizarás `FileManagementService` para archivos y `SocialMediaPublishingService` para publicaciones.

---

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### FASE 4 (anteriormente FASE 4): Backend - UrgentContentSchedulerService (3-4 horas)
### ⚠️ MODIFICADO: @nestjs/schedule YA instalado, solo falta ScheduleModule.forRoot()
### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Objetivo:** Implementar auto-cierre de contenido urgent después de 2 horas.

**Duración Estimada:** 3-4 horas (reducido de 4-5)
**Dependencias:** FASE 3 completada

#### ⚠️ CAMBIOS IMPORTANTES:

**❌ NO INSTALAR:**
```bash
# ❌ NO ejecutar esto, ya está instalado:
npm install @nestjs/schedule
```

**✅ SOLO AGREGAR:**
```typescript
// En app.module.ts (aproximadamente línea 30):
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot(...),
    AppConfigModule,
    MongooseModule.forRootAsync(...),
    CacheModule.registerAsync(...),
    ScheduleModule.forRoot(), // ✅ AGREGAR ESTA LÍNEA
    // ... resto de imports
  ]
})
```

#### Checklist de Tareas:

- [ ] ⚠️ Modificar `/src/app.module.ts`
  - [ ] Importar `ScheduleModule` desde '@nestjs/schedule'
  - [ ] Agregar `ScheduleModule.forRoot()` en array de imports

- [ ] Crear `/src/generator-pro/services/urgent-content-scheduler.service.ts`
  - [ ] Inyectar dependencias:
    - [ ] `@InjectModel(UserGeneratedContent.name) private userContentModel`
    - [ ] `UserContentService`
    - [ ] `Logger`

**Método Principal:**

- [ ] Decorar con `@Cron('*/5 * * * *')` para ejecutar cada 5 minutos
- [ ] Método `handleUrgentContentAutoClosure(): Promise<void>`
  - [ ] Query: Buscar contenido con:
    ```typescript
    {
      isUrgent: true,
      urgentClosed: false,
      urgentAutoCloseAt: { $lte: new Date() },
      status: 'published'
    }
    ```
  - [ ] Para cada documento encontrado:
    - [ ] Llamar `userContentService.closeUrgentContent(id, 'system')`
    - [ ] Log: `Contenido urgent ${id} auto-cerrado después de 2 horas`

**Código de Ejemplo:**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserGeneratedContent, UserGeneratedContentDocument } from '../schemas/user-generated-content.schema';
import { UserContentService } from './user-content.service';

@Injectable()
export class UrgentContentSchedulerService {
  private readonly logger = new Logger(UrgentContentSchedulerService.name);

  constructor(
    @InjectModel(UserGeneratedContent.name)
    private readonly userContentModel: Model<UserGeneratedContentDocument>,
    private readonly userContentService: UserContentService,
  ) {}

  /**
   * Cron job que se ejecuta cada 5 minutos
   * Cierra automáticamente contenido urgent que cumplió 2 horas sin actualización
   */
  @Cron('*/5 * * * *')
  async handleUrgentContentAutoClosure(): Promise<void> {
    this.logger.debug('Ejecutando auto-cierre de contenido urgent...');

    const now = new Date();

    const expiredContent = await this.userContentModel.find({
      isUrgent: true,
      urgentClosed: false,
      urgentAutoCloseAt: { $lte: now },
      status: 'published',
    }).exec();

    if (expiredContent.length === 0) {
      this.logger.debug('No hay contenido urgent para cerrar');
      return;
    }

    this.logger.log(`Encontrados ${expiredContent.length} contenidos urgent para auto-cerrar`);

    const closedIds: string[] = [];
    for (const content of expiredContent) {
      try {
        await this.userContentService.closeUrgentContent(
          content._id.toString(),
          'system',
        );
        closedIds.push(content._id.toString());
        this.logger.log(`✅ Contenido urgent ${content._id} auto-cerrado exitosamente`);
      } catch (error) {
        this.logger.error(`❌ Error al auto-cerrar contenido ${content._id}: ${error.message}`);
      }
    }

    this.logger.log(`Auto-cierre completado: ${closedIds.length}/${expiredContent.length} exitosos`);
  }
}
```

- [ ] Agregar `UrgentContentSchedulerService` a `generator-pro.module.ts`
  - [ ] En `providers: [UrgentContentSchedulerService]`

**Archivos a Modificar/Crear:**
- `src/app.module.ts` - MODIFICAR (agregar ScheduleModule.forRoot())
- `src/generator-pro/services/urgent-content-scheduler.service.ts` - CREAR
- `src/generator-pro/generator-pro.module.ts` - MODIFICAR (agregar a providers)

**Build y Verificación:**
```bash
npm run build
```

**Resumen Ejecutivo de la Fase:**
Al completar esta fase tendrás un cron job que automáticamente cierra contenido urgent después de 2 horas sin actualización. El job se ejecuta cada 5 minutos y garantiza que las noticias en desarrollo se cierren automáticamente.

**Tiempo Ahorrado:** 1 hora (no instalar dependencia) ✅

---

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### FASE 5 (anteriormente FASE 5): Backend - Endpoints y Controller (6-8 horas)
### ✅ ESTADO: CREAR NUEVO pero REUTILIZAR patterns existentes
### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Objetivo:** Crear endpoints REST para crear, actualizar, listar y cerrar contenido.

**Duración Estimada:** 6-8 horas
**Dependencias:** FASES 1, 3, 4 completadas

#### ⚠️ REUTILIZAR:

**Pattern de Controller Existente:**
- ✅ `GeneratorProController` tiene 30+ endpoints
- ✅ Pattern con `@ApiOperation`, `@ApiResponse`
- ✅ DTOs de validación con `@Body()`, `@Param()`
- ✅ `@UseGuards(JwtAuthGuard)` ya implementado
- ✅ `@CurrentUser('userId')` decorator ya existe
- ✅ `@UseInterceptors(FilesInterceptor)` ya usado en image-bank

**Multer ya configurado:**
- ✅ `@nestjs/platform-express` ya instalado
- ✅ Ya usado en `image-bank.controller.ts`

#### Checklist de Tareas:

- [ ] Modificar `/src/generator-pro/controllers/generator-pro.controller.ts`
  - [ ] Inyectar `UserContentService` en constructor
  - [ ] ⚠️ Inyectar `FileManagementService` (para endpoint upload)

**Endpoints a Crear:**

- [ ] **POST /api/generator-pro/user-content/urgent** - Crear contenido urgent
  ```typescript
  @Post('user-content/urgent')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear contenido URGENT (última hora)' })
  @ApiResponse({ status: 201, description: 'Contenido urgent creado y publicado' })
  async createUrgentContent(
    @Body() dto: CreateUrgentContentDto,
    @CurrentUser('userId') userId: string,
  ): Promise<{ content: UserGeneratedContentDocument }> {
    this.logger.log(`🚨 Creating URGENT content by user: ${userId}`);
    const content = await this.userContentService.createUrgentContent(dto, userId);
    this.logger.log(`✅ URGENT content created and published: ${content._id}`);
    return { content };
  }
  ```

- [ ] **POST /api/generator-pro/user-content/normal** - Crear contenido normal
- [ ] **PUT /api/generator-pro/user-content/urgent/:id** - Actualizar contenido urgent
- [ ] **POST /api/generator-pro/user-content/close/:id** - Cerrar contenido urgent manualmente
- [ ] **GET /api/generator-pro/user-content/urgent/active** - Listar contenido urgent activo

- [ ] **POST /api/generator-pro/user-content/upload** - Upload de archivos
  ```typescript
  @Post('user-content/upload')
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 archivos
  @ApiOperation({ summary: 'Upload de imágenes/videos' })
  @ApiResponse({ status: 201, description: 'Archivos subidos exitosamente' })
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser('userId') userId: string,
  ): Promise<{ urls: string[] }> {
    this.logger.log(`📤 Uploading ${files.length} files`);

    const urls: string[] = [];
    for (const file of files) {
      // ⚠️ Usar FileManagementService en lugar de servicio propio
      const result = await this.fileManagementService.uploadFile(file, {
        category: 'user-generated-content',
        fileType: file.mimetype.startsWith('image/') ? 'image' : 'video',
        folder: 'user-generated-content',
        userId,
      });
      urls.push(result.url);
    }

    this.logger.log(`✅ Uploaded ${urls.length} files`);
    return { urls };
  }
  ```

**Archivos a Modificar/Crear:**
- `src/generator-pro/controllers/generator-pro.controller.ts` - MODIFICAR (agregar 6 endpoints)

**Build y Verificación:**
```bash
npm run build
```

**Resumen Ejecutivo de la Fase:**
Al completar esta fase tendrás todos los endpoints REST listos. El endpoint de upload reutiliza `FileManagementService` existente en lugar de crear servicio nuevo.

---

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### FASE 6 (anteriormente FASE 6): Backend - Integración con IA (8-10 horas)
### ⚠️ MODIFICADO: REUTILIZAR servicios existentes
### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Objetivo:** Modificar prompts de IA para generar contenido urgent (corto y agresivo) vs normal.

**Duración Estimada:** 8-10 horas
**Dependencias:** FASES anteriores completadas

#### ⚠️ REUTILIZAR:

**Servicios Existentes:**
- ✅ `GeneratorProPromptBuilderService` - Agregar métodos
- ✅ `SocialMediaCopyGeneratorService` - Reutilizar para copys
- ✅ `buildAntiFormatRestriction()` - Ya existe
- ✅ `buildEnrichedGuidelines()` - Ya existe

#### Checklist de Tareas:

- [ ] Modificar `/src/generator-pro/services/generator-pro-prompt-builder.service.ts`
  - [ ] Agregar método `buildUrgentPrompt(input: { title: string; content: string }): { systemPrompt: string; userPrompt: string }`
    - [ ] System Prompt: Incluir restricciones anti-formato + instrucciones de brevedad
    - [ ] User Prompt: "Genera contenido URGENTE de 300-500 palabras con tono de última hora"
    - [ ] Agregar al final: "Incluye al final: **Contenido en desarrollo** - Información en actualización"

  - [ ] Agregar método `buildNormalPrompt(input: { title: string; content: string }): { systemPrompt: string; userPrompt: string }`
    - [ ] Reutilizar lógica actual con prompts de 500-700 palabras

  - [ ] Agregar método `buildAggressiveSocialCopies(): string`
    - [ ] Instrucciones para generar copys MÁS AGRESIVOS
    - [ ] Hooks fuertes: "🚨 ÚLTIMA HORA", "⚠️ AHORA MISMO", "🔴 EN VIVO"
    - [ ] Palabras de impacto: "URGENTE", "BREAKING", "ALERTA"

- [ ] Modificar `UserContentService.createUrgentContent()`
  - [ ] Usar `buildUrgentPrompt()` en lugar de `buildPrompt()`
  - [ ] Usar `buildAggressiveSocialCopies()` para redes sociales

- [ ] Crear método `generateClosingParagraph(content: string): Promise<string>`
  - [ ] Prompt específico para generar párrafo de cierre
  - [ ] Usar en `closeUrgentContent()` cuando `closedBy === 'system'`

**Ejemplo de Prompts:**

```typescript
private buildUrgentPrompt(input: { title: string; content: string }): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `${this.buildAntiFormatRestriction()}

🚨 MODO URGENT - ÚLTIMA HORA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Eres un editor de noticias de última hora. Tu objetivo es informar RÁPIDO y CLARO.

CARACTERÍSTICAS DEL CONTENIDO URGENT:
• BREVEDAD: 300-500 palabras MÁXIMO
• PRECISIÓN: Solo lo esencial, sin relleno
• URGENCIA: Tono que transmite inmediatez
• DESARROLLO: Información puede estar incompleta, eso es normal
• FORMATO: HTML enriquecido pero CORTO

AL FINAL DEL CONTENIDO SIEMPRE INCLUYE:
<p><strong>Contenido en desarrollo</strong> - Información en actualización</p>

${this.buildEnrichedGuidelines()}
${this.buildAggressiveSocialCopies()}
`;

  const userPrompt = `Genera una nota de ÚLTIMA HORA basada en:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📰 TÍTULO:
${input.title}

📄 INFORMACIÓN DISPONIBLE:
${input.content}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 INSTRUCCIONES:
- Redacta en 300-500 palabras (CORTO, es última hora)
- Enfócate en QUÉ pasó, DÓNDE, CUÁNDO
- Si falta información, indícalo claramente ("Se desconoce...", "Aún no se confirma...")
- Usa negritas en datos clave pero SIN EXCESOS
- Incluye al final el texto de "Contenido en desarrollo"
- Genera copys de redes sociales MÁS AGRESIVOS (hooks fuertes, urgencia, emojis)

📦 RESPUESTA FINAL - JSON:
{
  "title": "Título urgente y directo",
  "content": "Contenido HTML de 300-500 palabras con el texto de desarrollo al final",
  "keywords": ["palabras", "clave"],
  "tags": ["tags", "relevantes"],
  "category": "Categoría",
  "summary": "Resumen breve",
  "socialMediaCopies": {
    "facebook": {
      "hook": "🚨 ÚLTIMA HORA en [lugar]",
      "copy": "Copy agresivo de 40-80 palabras con urgencia",
      "emojis": ["🚨", "⚠️"],
      "hookType": "Scary",
      "estimatedEngagement": "high"
    },
    "twitter": {
      "tweet": "🔴 AHORA: Tweet urgente de 200-240 caracteres",
      "hook": "BREAKING",
      "emojis": ["🔴", "🚨"],
      "hookType": "Scary",
      "threadIdeas": ["Contexto", "Actualizaciones", "Impacto"]
    }
  }
}`;

  return { systemPrompt, userPrompt };
}
```

**Archivos a Modificar/Crear:**
- `src/generator-pro/services/generator-pro-prompt-builder.service.ts` - MODIFICAR (agregar 3 métodos)
- `src/generator-pro/services/user-content.service.ts` - MODIFICAR (usar nuevos prompts)

**Build y Verificación:**
```bash
npm run build
```

**Resumen Ejecutivo de la Fase:**
Al completar esta fase tendrás prompts específicos para contenido urgent (corto y agresivo) vs contenido normal (largo y pausado). La IA generará contenido adaptado al modo seleccionado.

---

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### FASE 7: Frontend - Types y API Service (3-4 horas)
### ⚠️ MODIFICADO: Seguir pattern existente
### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Objetivo:** Crear la capa de tipos y servicios API para el frontend.

**Duración Estimada:** 3-4 horas (reducido de 4-5)
**Dependencias:** Backend completo (FASES 1-6)

#### ⚠️ REUTILIZAR PATTERNS:

**Tipos:**
- ✅ Pattern existente en `types/generated-content.types.ts`
- ✅ Interface `SocialMediaCopies` ya existe
- ✅ Interface `GenerationMetadata` ya existe

**API Service:**
- ✅ Pattern existente en `services/generated-content/generatedContentApi.ts`
- ✅ `ApiClient.getRawClient()` ya configurado
- ✅ Pattern: camelCase → snake_case con mappers

**⚠️ Mappers:**
- Ubicación correcta: `packages/mobile-expo/src/utils/mappers/` (NO `services/mappers/`)

#### Checklist de Tareas:

**Types:**
- [ ] Crear `/src/types/user-generated-content.types.ts`
  ```typescript
  export type ContentMode = 'urgent' | 'normal';
  export type PublicationType = 'breaking' | 'noticia' | 'blog';
  export type ContentStatus = 'draft' | 'processing' | 'published' | 'closed';

  export interface UserGeneratedContent {
    id: string;
    originalTitle: string;
    originalContent: string;
    uploadedImageUrls: string[];
    uploadedVideoUrls: string[];
    mode: ContentMode;
    publicationType?: PublicationType;
    isUrgent: boolean;
    urgentCreatedAt?: Date;
    urgentAutoCloseAt?: Date;
    urgentClosed: boolean;
    urgentClosedAt?: Date;
    urgentClosedBy?: 'user' | 'system';
    status: ContentStatus;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface CreateUrgentContentRequest {
    originalTitle: string;
    originalContent: string;
    uploadedImageUrls?: string[];
    uploadedVideoUrls?: string[];
  }

  export interface CreateNormalContentRequest extends CreateUrgentContentRequest {
    publicationType: PublicationType;
  }

  export interface UpdateUrgentContentRequest {
    newContent: string;
    newImageUrls?: string[];
  }
  ```

**Mapper:**
- [ ] Crear `/src/utils/mappers/user-generated-content.mapper.ts`
  ```typescript
  import { UserGeneratedContent } from '@/src/types/user-generated-content.types';

  export class UserGeneratedContentMapper {
    static toApp(apiData: any): UserGeneratedContent {
      return {
        id: apiData._id || apiData.id,
        originalTitle: apiData.original_title || apiData.originalTitle,
        originalContent: apiData.original_content || apiData.originalContent,
        uploadedImageUrls: apiData.uploaded_image_urls || apiData.uploadedImageUrls || [],
        uploadedVideoUrls: apiData.uploaded_video_urls || apiData.uploadedVideoUrls || [],
        mode: apiData.mode,
        publicationType: apiData.publication_type || apiData.publicationType,
        isUrgent: apiData.is_urgent ?? apiData.isUrgent ?? false,
        urgentCreatedAt: apiData.urgent_created_at ? new Date(apiData.urgent_created_at) : undefined,
        urgentAutoCloseAt: apiData.urgent_auto_close_at ? new Date(apiData.urgent_auto_close_at) : undefined,
        urgentClosed: apiData.urgent_closed ?? apiData.urgentClosed ?? false,
        urgentClosedAt: apiData.urgent_closed_at ? new Date(apiData.urgent_closed_at) : undefined,
        urgentClosedBy: apiData.urgent_closed_by || apiData.urgentClosedBy,
        status: apiData.status,
        createdAt: new Date(apiData.created_at || apiData.createdAt),
        updatedAt: new Date(apiData.updated_at || apiData.updatedAt),
      };
    }

    static toAPI(request: any): any {
      if ('newContent' in request) {
        return {
          new_content: request.newContent,
          new_image_urls: request.newImageUrls,
        };
      } else if ('publicationType' in request) {
        return {
          original_title: request.originalTitle,
          original_content: request.originalContent,
          uploaded_image_urls: request.uploadedImageUrls,
          uploaded_video_urls: request.uploadedVideoUrls,
          publication_type: request.publicationType,
        };
      } else {
        return {
          original_title: request.originalTitle,
          original_content: request.originalContent,
          uploaded_image_urls: request.uploadedImageUrls,
          uploaded_video_urls: request.uploadedVideoUrls,
        };
      }
    }
  }
  ```

**API Service:**
- [ ] Crear `/src/services/user-generated-content/userGeneratedContentApi.ts`
  ```typescript
  import { ApiClient } from '@/src/services/api/ApiClient'
  import { UserGeneratedContentMapper } from '@/src/utils/mappers/user-generated-content.mapper'
  import type {
    UserGeneratedContent,
    CreateUrgentContentRequest,
    CreateNormalContentRequest,
    UpdateUrgentContentRequest,
  } from '@/src/types/user-generated-content.types'

  export const userGeneratedContentApi = {
    createUrgent: async (data: CreateUrgentContentRequest): Promise<UserGeneratedContent> => {
      const payload = UserGeneratedContentMapper.toAPI(data)
      const rawClient = ApiClient.getRawClient()
      const response = await rawClient.post('/generator-pro/user-content/urgent', payload)
      return UserGeneratedContentMapper.toApp(response.data.content)
    },

    createNormal: async (data: CreateNormalContentRequest): Promise<UserGeneratedContent> => {
      const payload = UserGeneratedContentMapper.toAPI(data)
      const rawClient = ApiClient.getRawClient()
      const response = await rawClient.post('/generator-pro/user-content/normal', payload)
      return UserGeneratedContentMapper.toApp(response.data.content)
    },

    updateUrgent: async (id: string, data: UpdateUrgentContentRequest): Promise<UserGeneratedContent> => {
      const payload = UserGeneratedContentMapper.toAPI(data)
      const rawClient = ApiClient.getRawClient()
      const response = await rawClient.put(`/generator-pro/user-content/urgent/${id}`, payload)
      return UserGeneratedContentMapper.toApp(response.data.content)
    },

    closeUrgent: async (id: string): Promise<UserGeneratedContent> => {
      const rawClient = ApiClient.getRawClient()
      const response = await rawClient.post(`/generator-pro/user-content/close/${id}`)
      return UserGeneratedContentMapper.toApp(response.data.content)
    },

    getActiveUrgent: async (): Promise<UserGeneratedContent[]> => {
      const rawClient = ApiClient.getRawClient()
      const response = await rawClient.get('/generator-pro/user-content/urgent/active')
      return response.data.content.map(UserGeneratedContentMapper.toApp)
    },

    uploadFiles: async (files: File[]): Promise<string[]> => {
      const formData = new FormData()
      files.forEach((file) => {
        formData.append('files', file)
      })

      const rawClient = ApiClient.getRawClient()
      const response = await rawClient.post('/generator-pro/user-content/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      return response.data.urls
    },
  }
  ```

**Archivos a Crear:**
- `src/types/user-generated-content.types.ts` - CREAR
- `src/utils/mappers/user-generated-content.mapper.ts` - CREAR (ubicación correcta)
- `src/services/user-generated-content/userGeneratedContentApi.ts` - CREAR

**Resumen Ejecutivo de la Fase:**
Al completar esta fase tendrás la capa de tipos TypeScript, mappers en la ubicación correcta (`utils/mappers`), y el servicio API que consume los endpoints del backend siguiendo el pattern existente.

**Tiempo Ahorrado:** 1 hora (pattern ya establecido) ✅

---

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### FASE 8: Frontend - Hooks con TanStack Query (2-3 horas)
### ⚠️ MODIFICADO: Seguir pattern de hooks existentes
### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Objetivo:** Crear hooks custom con TanStack Query para manejo de estado del servidor.

**Duración Estimada:** 2-3 horas (reducido de 3-4)
**Dependencias:** FASE 7 completada

#### ⚠️ REUTILIZAR PATTERNS:

**Hooks Existentes:**
- ✅ `useGeneratedContent.ts` - Pattern de query keys
- ✅ `useUploadImages.ts` - Pattern de upload con FormData
- ✅ `useContentGenerationSocket.ts` - Pattern de socket listeners

**Socket Service:**
- ✅ `SocketService.getInstance(queryClient)` - Singleton ya configurado
- ✅ `socket.on()` y `socket.off()` - Pattern establecido

#### Checklist de Tareas:

- [ ] Crear `/src/hooks/useUserGeneratedContent.ts`
  ```typescript
  import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
  import { userGeneratedContentApi } from '@/src/services/user-generated-content/userGeneratedContentApi';
  import type {
    CreateUrgentContentRequest,
    CreateNormalContentRequest,
    UpdateUrgentContentRequest
  } from '@/src/types/user-generated-content.types';

  // Query keys
  export const userGeneratedContentKeys = {
    all: ['user-generated-content'] as const,
    urgent: () => [...userGeneratedContentKeys.all, 'urgent'] as const,
    active: () => [...userGeneratedContentKeys.urgent(), 'active'] as const,
  };

  // Hook para crear contenido urgent
  export function useCreateUrgentContent() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data: CreateUrgentContentRequest) =>
        userGeneratedContentApi.createUrgent(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: userGeneratedContentKeys.active() });
      },
    });
  }

  // Hook para crear contenido normal
  export function useCreateNormalContent() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data: CreateNormalContentRequest) =>
        userGeneratedContentApi.createNormal(data),
      onSuccess: () => {
        // Invalidar lista de contenido generado
        queryClient.invalidateQueries({ queryKey: ['generated-content'] });
      },
    });
  }

  // Hook para actualizar contenido urgent
  export function useUpdateUrgentContent() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: UpdateUrgentContentRequest }) =>
        userGeneratedContentApi.updateUrgent(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: userGeneratedContentKeys.active() });
      },
    });
  }

  // Hook para cerrar contenido urgent
  export function useCloseUrgentContent() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (id: string) => userGeneratedContentApi.closeUrgent(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: userGeneratedContentKeys.active() });
      },
    });
  }

  // Hook para listar contenido urgent activo
  export function useActiveUrgentContent() {
    return useQuery({
      queryKey: userGeneratedContentKeys.active(),
      queryFn: () => userGeneratedContentApi.getActiveUrgent(),
      refetchInterval: 30000, // Refetch cada 30 segundos
      staleTime: 15000, // Considerar stale después de 15 segundos
    });
  }

  // Hook para upload de archivos
  export function useUploadContentFiles() {
    return useMutation({
      mutationFn: (files: File[]) => userGeneratedContentApi.uploadFiles(files),
    });
  }
  ```

- [ ] Crear `/src/hooks/useUrgentContentSocket.ts`
  ```typescript
  import { useEffect, useCallback } from 'react';
  import { useQueryClient } from '@tanstack/react-query';
  import { SocketService } from '@/src/features/socket/services/SocketService';
  import { userGeneratedContentKeys } from './useUserGeneratedContent';

  interface UrgentContentSocketOptions {
    onUrgentCreated?: (data: any) => void;
    onUrgentUpdated?: (data: any) => void;
    onUrgentClosed?: (data: any) => void;
  }

  export function useUrgentContentSocket(options?: UrgentContentSocketOptions) {
    const queryClient = useQueryClient();

    const onUrgentCreated = useCallback(
      (payload: any) => {
        options?.onUrgentCreated?.(payload);
      },
      [options?.onUrgentCreated]
    );

    const onUrgentUpdated = useCallback(
      (payload: any) => {
        options?.onUrgentUpdated?.(payload);
      },
      [options?.onUrgentUpdated]
    );

    const onUrgentClosed = useCallback(
      (payload: any) => {
        options?.onUrgentClosed?.(payload);
      },
      [options?.onUrgentClosed]
    );

    useEffect(() => {
      const socketService = SocketService.getInstance(queryClient);
      const socket = socketService.socket;

      if (!socket) {
        console.warn('⚠️ [useUrgentContentSocket] Socket not available');
        return;
      }

      console.log('🔌 [useUrgentContentSocket] Setting up urgent content listeners');

      // Handler: Urgent content created
      const handleUrgentCreated = (payload: any) => {
        console.log('📨 [Socket Event] content:urgent:created:', payload);
        queryClient.invalidateQueries({ queryKey: userGeneratedContentKeys.active() });
        onUrgentCreated(payload);
      };

      // Handler: Urgent content updated
      const handleUrgentUpdated = (payload: any) => {
        console.log('📨 [Socket Event] content:urgent:updated:', payload);
        queryClient.invalidateQueries({ queryKey: userGeneratedContentKeys.active() });
        onUrgentUpdated(payload);
      };

      // Handler: Urgent content closed
      const handleUrgentClosed = (payload: any) => {
        console.log('📨 [Socket Event] content:urgent:closed:', payload);
        queryClient.invalidateQueries({ queryKey: userGeneratedContentKeys.active() });
        onUrgentClosed(payload);
      };

      // Registrar listeners
      socket.on('content:urgent:created', handleUrgentCreated);
      socket.on('content:urgent:updated', handleUrgentUpdated);
      socket.on('content:urgent:closed', handleUrgentClosed);

      console.log('✅ [useUrgentContentSocket] All listeners registered');

      // Cleanup
      return () => {
        console.log('🧹 [useUrgentContentSocket] Cleaning up listeners');
        socket.off('content:urgent:created', handleUrgentCreated);
        socket.off('content:urgent:updated', handleUrgentUpdated);
        socket.off('content:urgent:closed', handleUrgentClosed);
      };
    }, [queryClient, onUrgentCreated, onUrgentUpdated, onUrgentClosed]);
  }
  ```

**Archivos a Crear:**
- `src/hooks/useUserGeneratedContent.ts` - CREAR
- `src/hooks/useUrgentContentSocket.ts` - CREAR

**Resumen Ejecutivo de la Fase:**
Al completar esta fase tendrás todos los hooks custom listos siguiendo el pattern existente de `useGeneratedContent` y `useContentGenerationSocket`. Los hooks usan TanStack Query para cache y el socket service singleton para tiempo real.

**Tiempo Ahorrado:** 1 hora (pattern ya establecido) ✅

---

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### FASE 9: Frontend - Formulario y Modal de Creación (6-8 horas)
### ⚠️ MODIFICADO: Reutilizar componentes base existentes
### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Objetivo:** Crear componente de formulario y modal para crear contenido urgent/normal.

**Duración Estimada:** 6-8 horas
**Dependencias:** FASE 8 completada

#### ⚠️ REUTILIZAR PATTERNS:

**Componentes Existentes:**
- ✅ `AgentFormFields.tsx` - Pattern de formularios complejos
- ✅ `SiteFormFields.tsx` - Pattern de formularios con secciones
- ✅ `GenerateImageModal.tsx` - Pattern de modal con formulario
- ✅ `TagArrayInput.tsx` - Pattern de inputs de arrays
- ✅ `ImageBankSelector.tsx` - Pattern de selección de imágenes

**Ver documentos de análisis para código completo de componentes.**

**Archivos a Crear:**
- `src/components/user-content/UserContentFormFields.tsx` - CREAR
- `src/components/user-content/CreateUserContentModal.tsx` - CREAR
- `src/components/user-content/FileUploadSection.tsx` - CREAR

**Resumen Ejecutivo de la Fase:**
Al completar esta fase tendrás un formulario completo con validación, upload de archivos, toggle urgent/normal, y selector de tipo de publicación siguiendo los patterns de componentes existentes.

---

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### FASE 10: Frontend - Tab "Noticias en Progreso" (4-5 horas)
### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Objetivo:** Crear nueva tab que muestra noticias urgent activas con timer y botón de actualización.

**Duración Estimada:** 4-5 horas
**Dependencias:** FASES 7, 8, 9 completadas

Ver documento de análisis frontend para implementación detallada.

---

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### FASE 11: Frontend - Cintillo "ÚLTIMO MOMENTO" (3-4 horas)
### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Objetivo:** Modificar/crear cintillo rotativo que muestra noticias urgent en página principal.

**Duración Estimada:** 3-4 horas
**Dependencias:** FASES anteriores completadas

Ver documento de análisis frontend para implementación detallada.

---

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### FASE 12: Testing Manual y Build Final (2-3 horas)
### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Objetivo:** Probar todo el flujo end-to-end y hacer build final.

**Duración Estimada:** 2-3 horas
**Dependencias:** TODAS las fases anteriores

#### Checklist de Tareas:

**Backend:**
- [ ] Build del backend: `npm run build`
- [ ] Verificar que no hay errores de TypeScript
- [ ] Revisar logs del scheduler (cron job)

**Frontend:**
- [ ] Build del frontend: `npm run build` (Expo)
- [ ] Probar en simulador iOS y Android

**Testing Manual End-to-End:**

**Test 1: Crear Contenido URGENT**
- [ ] Abrir app móvil
- [ ] Ir a tab "Contenidos"
- [ ] Click en botón FAB "+Crear Noticia"
- [ ] Llenar formulario con toggle "URGENT" activado
- [ ] Verificar que aparece en tab "Noticias en Progreso"
- [ ] Verificar que aparece en cintillo "ÚLTIMO MOMENTO"
- [ ] Verificar timer de 2 horas activo

**Test 2: Actualizar Contenido URGENT**
- [ ] Click en botón "Actualizar"
- [ ] Agregar nuevo contenido
- [ ] Verificar que timer se reinició

**Test 3: Auto-cierre de Contenido URGENT**
- [ ] Esperar 2 horas (o modificar timer para testing)
- [ ] Verificar que cron job detecta contenido expirado
- [ ] Verificar que agrega párrafo de cierre
- [ ] Verificar que se remueve de tab y cintillo

**Test 4: Crear Contenido NORMAL**
- [ ] Crear noticia sin toggle "URGENT"
- [ ] Seleccionar tipo "Noticia"
- [ ] Verificar que se procesa normalmente
- [ ] Verificar que NO aparece en urgent

**Resumen Ejecutivo de la Fase:**
Al completar esta fase habrás probado manualmente todo el flujo y verificado que funciona correctamente.

---

## 5. DIAGRAMAS DE FLUJO

### 5.1 Flujo MODO URGENT (Breaking News)

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO MODO URGENT                        │
└─────────────────────────────────────────────────────────────┘

Usuario en App Móvil
  │
  ▼
[Click en botón FAB "+Crear Noticia"]
  │
  ▼
[Modal de Creación se Abre]
  │
  ▼
[Llenar Formulario]
├─ Título: "Accidente en carretera"
├─ Contenido: "Se reporta accidente múltiple..."
├─ Toggle URGENT: ✅ ACTIVADO
└─ Subir imágenes (opcional)
  │
  ▼
[Click en "Crear y Publicar"]
  │
  ▼
┌─────────────────────────────────────┐
│ Frontend: useCreateUrgentContent()  │
│ POST /user-content/urgent           │
└────────────┬────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────┐
│ Backend: UserContentService.createUrgentContent()      │
├────────────────────────────────────────────────────────┤
│ 1. Crear documento en UserGeneratedContent            │
│    - mode: 'urgent'                                    │
│    - isUrgent: true                                    │
│    - urgentCreatedAt: now                              │
│    - urgentAutoCloseAt: now + 2 horas                  │
│    - status: 'processing'                              │
│                                                        │
│ 2. Procesar con IA                                     │
│    - Usar buildUrgentPrompt() (300-500 palabras)      │
│    - Generar copys AGRESIVOS para redes               │
│    - Agregar texto "Contenido en desarrollo..."       │
│                                                        │
│ 3. Auto-publicar INMEDIATAMENTE                        │
│    - ⚠️ Usar SocialMediaPublishingService             │
│    - Crear AIContentGeneration (urgent: true)          │
│    - Crear PublishedNoticia (isUrgent: true)           │
│    - Publicar en redes sociales con copys agresivos    │
│                                                        │
│ 4. Emitir eventos                                      │
│    - EventEmitter2: 'content.urgent.created'           │
│    - Socket.io: 'content:urgent:created'               │
│                                                        │
│ 5. Actualizar status a 'published'                     │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│ Frontend Recibe Respuesta              │
│ - Muestra notificación de éxito        │
│ - Invalida queries con React Query     │
│ - Cierra modal                          │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────┐
│ Contenido Publicado Aparece en:                        │
├────────────────────────────────────────────────────────┤
│ 1. Tab "Noticias en Progreso"                          │
│    - Lista con timer visible (2h restantes)            │
│    - Botón "Actualizar"                                │
│                                                        │
│ 2. Cintillo "ÚLTIMO MOMENTO" (Página principal)        │
│    - Banner rotativo con badge "URGENTE"               │
│    - Auto-actualización cada 30 segundos               │
│                                                        │
│ 3. Redes Sociales                                      │
│    - Facebook: Copy agresivo con emojis 🚨⚠️          │
│    - Twitter: Tweet con "🔴 AHORA:"                    │
└────────────────────────────────────────────────────────┘

             │
             │ [TIMER DE 2 HORAS CORRIENDO]
             │
             ▼
┌─────────────────────────────────────────┐
│ Opciones después de publicar:           │
└─────────────────────────────────────────┘
             │
             ├─────────────┬─────────────┐
             │             │             │
             ▼             ▼             ▼
    [SIN actualización] [Usuario      [Usuario
     (después de 2h)     actualiza]    cierra
                                       manualmente]
             │             │             │
             ▼             ▼             ▼
   ┌─────────────────┐ ┌─────────────┐ ┌────────────┐
   │ AUTO-CIERRE     │ │ ACTUALIZAR  │ │ CERRAR     │
   │ (Sistema)       │ │             │ │ (User)     │
   └────┬────────────┘ └──────┬──────┘ └─────┬──────┘
        │                     │               │
        ▼                     ▼               ▼
   Cron job cada 5 min   PUT /urgent/:id  POST /close/:id
   detecta expirado      - Re-procesa IA  - Marca como
   - Llama closeUrgent   - Re-publica       cerrado
   - IA genera párrafo   - REINICIA timer - Remueve de
     de cierre                               cintillo
   - Actualiza noticia
   - Marca como cerrado
   - Remueve de cintillo
```

---

## 6. CRONOGRAMA ESTIMADO

| Fase | Descripción | Duración Original | Duración Actualizada | Cambios | Build |
|------|-------------|-------------------|----------------------|---------|-------|
| **FASE 1** | Backend - Schemas y DTOs | 4-6 horas | **4-6 horas** | ✅ Sin cambios | ✅ npm run build |
| **~~FASE 2~~** | ~~Backend - FileUploadService~~ | ~~3-4 horas~~ | **❌ ELIMINADA** | ⚠️ Ya existe `FileManagementService` | - |
| **FASE 3** | Backend - UserContentService | 6-8 horas | **6-8 horas** | ⚠️ Inyectar servicios existentes | ✅ npm run build |
| **FASE 4** | Backend - Scheduler Service | 4-5 horas | **3-4 horas** | ⚠️ No instalar @nestjs/schedule | ✅ npm run build |
| **FASE 5** | Backend - Endpoints y Controller | 6-8 horas | **6-8 horas** | ⚠️ Usar `FileManagementService` | ✅ npm run build |
| **FASE 6** | Backend - Integración con IA | 8-10 horas | **8-10 horas** | ⚠️ Reutilizar social media services | ✅ npm run build |
| **FASE 7** | Frontend - Types y API Service | 4-5 horas | **3-4 horas** | ⚠️ Mappers en `utils/mappers` | ❌ |
| **FASE 8** | Frontend - Hooks TanStack Query | 3-4 horas | **2-3 horas** | ⚠️ Seguir pattern existente | ❌ |
| **FASE 9** | Frontend - Formulario y Modal | 6-8 horas | **6-8 horas** | ⚠️ Reutilizar componentes base | ❌ |
| **FASE 10** | Frontend - Tab Noticias en Progreso | 4-5 horas | **4-5 horas** | ✅ Sin cambios | ❌ |
| **FASE 11** | Frontend - Cintillo ÚLTIMO MOMENTO | 3-4 horas | **3-4 horas** | ✅ Sin cambios | ❌ |
| **FASE 12** | Testing Manual y Build Final | 2-3 horas | **2-3 horas** | ✅ Sin cambios | ✅ Build completo |

**TOTAL ORIGINAL:** 53-72 horas (6.5-9 días)
**TOTAL ACTUALIZADO:** **43-60 horas (5.5-7.5 días)**
**TIEMPO AHORRADO:** **10-12 horas** ✅

---

## 7. CRITERIOS DE ACEPTACIÓN

### Por Fase:

**FASE 1:** ✅
- [ ] Schemas compilan sin errores
- [ ] DTOs validando correctamente
- [ ] Build exitoso

**~~FASE 2~~:** ❌ ELIMINADA

**FASE 3:** ✅
- [ ] UserContentService crea urgent y normal
- [ ] Reutiliza `FileManagementService` para archivos
- [ ] Reutiliza `SocialMediaPublishingService` para publicaciones
- [ ] Eventos de EventEmitter2 emitidos
- [ ] No hay dependencias circulares

**FASE 4:** ✅
- [ ] `ScheduleModule.forRoot()` agregado en app.module
- [ ] Cron job se ejecuta cada 5 minutos
- [ ] Detecta contenido expirado correctamente
- [ ] Llama a closeUrgentContent() exitosamente

**FASE 5:** ✅
- [ ] Todos endpoints responden correctamente
- [ ] DTOs validando requests
- [ ] Upload de archivos usa `FileManagementService`

**FASE 6:** ✅
- [ ] Prompts urgent generan 300-500 palabras
- [ ] Prompts normal generan 500-700 palabras
- [ ] Copys agresivos generados para urgent
- [ ] Párrafo de cierre generado correctamente

**FASE 7:** ✅
- [ ] Types TypeScript definidos
- [ ] Mapper en `utils/mappers/` (ubicación correcta)
- [ ] API Service consumiendo endpoints

**FASE 8:** ✅
- [ ] Hooks custom funcionando
- [ ] TanStack Query invalidando cache
- [ ] Socket hook escuchando eventos

**FASE 9:** ✅
- [ ] Formulario valida campos
- [ ] Upload de archivos funciona
- [ ] Modal abre y cierra correctamente

**FASE 10:** ✅
- [ ] Tab muestra noticias urgent
- [ ] Timer cuenta regresiva visible
- [ ] Botón actualizar funciona

**FASE 11:** ✅
- [ ] Cintillo muestra noticias urgent
- [ ] Auto-actualización cada 30 segundos
- [ ] Badge "URGENTE" visible

**FASE 12:** ✅
- [ ] Flujo completo urgent funciona
- [ ] Flujo completo normal funciona
- [ ] Auto-cierre después de 2 horas funciona
- [ ] Builds exitosos backend y frontend

---

## 8. RESTRICCIONES TÉCNICAS

### Backend

❌ **PROHIBIDO:**
- Crear `FileUploadService` (usar `FileManagementService`)
- Instalar `@nestjs/schedule` (ya está instalado)
- Usar `forwardRef` para resolver dependencias circulares
- Usar `any` en TypeScript
- Modificar outlets existentes para forzar contenido manual

✅ **OBLIGATORIO:**
- Usar `FileManagementService` para upload de archivos
- Usar `SocialMediaPublishingService` para publicaciones
- Usar `EventEmitter2` para comunicación entre servicios
- Tipado estricto en TypeScript
- Hacer build después de cada fase backend
- Agregar `ScheduleModule.forRoot()` en app.module

### Frontend

✅ **OBLIGATORIO:**
- Seguir patrón Services → Mappers (en `utils/mappers`) → Hooks → Components
- Usar TanStack Query para data fetching
- Usar `SocketService.getInstance()` para tiempo real
- Reutilizar componentes base existentes (FilterBottomSheet, ContentCard, etc.)

---

## 9. DOCUMENTOS DE REFERENCIA

- **Backend Analysis:** `/packages/api-nueva/CREATE_ORIGINAL_CONTENT_BACKEND_ANALYSIS.md`
- **Frontend Analysis:** `/CREATE_ORIGINAL_CONTENT_FRONTEND_ANALYSIS.md`
- **Flujo Actual:** `/packages/api-nueva/SCRAPING_FLOW_DIAGRAMS.md`

---

**FIN DEL PLAN DE IMPLEMENTACIÓN ACTUALIZADO**

Este documento ha sido revisado exhaustivamente para **ELIMINAR DUPLICACIÓN** de código existente y **REUTILIZAR** infraestructura ya implementada. Cada fase indica claramente qué crear nuevo vs qué reutilizar.
