# 📸 ANÁLISIS COMPLETO: SISTEMA DE BANCO DE IMÁGENES

**Fecha**: 18 de octubre 2025
**Alcance**: Arquitectura completa del sistema de imágenes (extracción, generación AI, almacenamiento, y consumo)

---

## 📋 ÍNDICE

1. [Arquitectura General](#arquitectura-general)
2. [Esquemas de Base de Datos](#esquemas-de-base-de-datos)
3. [Flujos Principales](#flujos-principales)
4. [API Endpoints](#api-endpoints)
5. [Integración Mobile-Expo](#integración-mobile-expo)
6. [Dependencias y Relaciones](#dependencias-y-relaciones)
7. [Casos de Uso](#casos-de-uso)

---

## 🏗️ ARQUITECTURA GENERAL

### Componentes Principales

```
┌─────────────────────────────────────────────────────────────────┐
│                      MOBILE-EXPO APP                            │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  Image Bank UI   │  │ Image Gen UI     │                    │
│  │  - Search        │  │ - Generate       │                    │
│  │  - Filters       │  │ - Monitor Jobs   │                    │
│  │  - Select        │  │ - Store in Bank  │                    │
│  └────────┬─────────┘  └────────┬─────────┘                    │
└───────────┼─────────────────────┼──────────────────────────────┘
            │                     │
            │ API Calls           │ WebSocket Events
            ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NESTJS API                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  IMAGE BANK MODULE                                       │  │
│  │  ────────────────────                                    │  │
│  │  Controllers:                                            │  │
│  │   - GET /image-bank (list + filters + pagination)       │  │
│  │   - GET /image-bank/:id                                  │  │
│  │   - POST /image-bank/process (process URL)              │  │
│  │   - POST /image-bank/process-batch                      │  │
│  │   - GET /image-bank/aggregations/keywords               │  │
│  │   - GET /image-bank/stats                               │  │
│  │                                                           │  │
│  │  Services:                                               │  │
│  │   - ImageBankService (CRUD + filters)                   │  │
│  │   - ImageBankProcessorService (download, sharp, S3)     │  │
│  │   - ImageBankEventsService (emite eventos)              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  IMAGE GENERATION MODULE (AI)                            │  │
│  │  ────────────────────────────                            │  │
│  │  Controllers:                                            │  │
│  │   - POST /image-generation/generate                     │  │
│  │   - GET /image-generation/:id                           │  │
│  │   - GET /image-generation (list user gens)              │  │
│  │   - GET /image-generation/job/:jobId/status             │  │
│  │   - POST /image-generation/:id/store-in-bank            │  │
│  │   - GET /image-generation/stats/summary                 │  │
│  │                                                           │  │
│  │  Services:                                               │  │
│  │   - ImageGenerationService (orchestration)              │  │
│  │   - ContentAnalyzerService (AI analysis)                │  │
│  │   - EditorialPromptService (prompt builder)             │  │
│  │   - BrandingService (watermark + decorations)           │  │
│  │   - MetadataBuilderService (alt, caption, keywords)     │  │
│  │   - ImageGenerationQueueService (BullMQ)                │  │
│  │   - ImageGenerationNotifierService (WebSocket)          │  │
│  │                                                           │  │
│  │  Processor:                                              │  │
│  │   - ImageGenerationProcessor (BullMQ worker)            │  │
│  │     • Llama OpenAI API                                   │  │
│  │     • Aplica post-processing                            │  │
│  │     • Sube a S3                                          │  │
│  │     • Emite eventos WebSocket                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
            │                     │
            ▼                     ▼
┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   MongoDB       │  │  AWS S3          │  │  Redis (BullMQ)  │
│   Collections:  │  │  Buckets:        │  │  Queues:         │
│   - imagebanks  │  │  - image-bank/   │  │  - image-gen     │
│   - imagegene   │  │  - ai-generated/ │  └──────────────────┘
│     rations     │  └──────────────────┘
└─────────────────┘
```

---

## 🗄️ ESQUEMAS DE BASE DE DATOS

### 1. ImageBank Schema

**Ubicación**: `/packages/api-nueva/src/image-bank/schemas/image-bank.schema.ts`

**Propósito**: Almacenar imágenes procesadas (de extracción o generadas con IA)

**Estructura**:

```typescript
{
  // 📸 URLs PROCESADAS (S3 + CDN)
  processedUrls: {
    original: string,    // Max 1920px
    thumbnail: string,   // 400x250px - grids/previews
    medium: string,      // 800x500px - mobile detail
    large: string,       // 1200x630px - OG images/hero
    s3BaseKey: string    // image-bank/{outlet}/{year}/{month}/{id}/
  },

  // 📊 METADATA ORIGINAL
  originalMetadata: {
    url: string,
    width: number,
    height: number,
    format: string,
    sizeBytes: number
  },

  // 🏷️ CLASIFICACIÓN Y TEXTO
  altText?: string,
  caption?: string,
  keywords: string[],     // ✅ Para búsqueda
  outlet: string,         // ✅ Dominio de origen
  categories: string[],   // ✅ Categorías
  tags: string[],

  // 🔗 RELACIONES
  extractedNoticiaId?: ObjectId,  // Si viene de extracción
  sourceUrl: string,
  extractedAt: Date,
  processedAt?: Date,

  // 📊 TRACKING
  usageCount: number,
  usedInArticles: ObjectId[],     // Referencias a PublishedNoticia
  lastUsedAt?: Date,

  // 🔍 ESTADO
  quality: 'high' | 'medium' | 'low',
  isActive: boolean,
  isFeatured: boolean,

  // 🔒 COMPLIANCE
  metadataRemoved: boolean,       // EXIF/IPTC/XMP removed
  processedByVersion?: string,

  // 🤖 AI FLAGS
  aiGenerated: boolean,           // ✅ Si fue generada con IA
  c2paIncluded: boolean,
  imageGenerationId?: ObjectId    // ✅ Ref a ImageGeneration
}
```

**Índices Importantes**:
```javascript
// Single field
{ outlet: 1 }
{ extractedNoticiaId: 1 }
{ keywords: 1 }
{ categories: 1 }
{ isActive: 1 }
{ quality: 1 }

// Compound (ESR Rule)
{ outlet: 1, createdAt: -1 }
{ isActive: 1, quality: 1, createdAt: -1 }
{ aiGenerated: 1, c2paIncluded: 1, createdAt: -1 }

// Text search
{ altText: 'text', caption: 'text', keywords: 'text' }
```

---

### 2. ImageGeneration Schema

**Ubicación**: `/packages/api-nueva/src/content-ai/schemas/image-generation.schema.ts`

**Propósito**: Registro de generaciones de imágenes con IA (tracking completo)

**Estructura**:

```typescript
{
  // 🎨 SOURCE
  sourceImageId?: ObjectId,       // Si es modificación
  sourceImageUrl?: string,
  extractedNoticiaId?: ObjectId,  // Noticia relacionada

  // 🖼️ GENERATION CONFIG
  prompt: string,                 // ✅ FASE 5: basePrompt limpio (sin branding)
  model: string,                  // 'gpt-image-1', 'dall-e-3'
  quality: 'low' | 'medium' | 'high',
  size: string,                   // '1024x1024', '1024x1536', '1536x1024'

  // 📊 EDITORIAL ANALYSIS (FASE 5)
  contentAnalysisResult?: object, // Resultado del análisis de contenido
  editorialTemplate?: string,     // 'portrait', 'scene', 'conceptual', 'documentary'

  // 🏷️ BRANDING CONFIG
  brandingConfig: {
    watermarkText: string,        // "NOTICIAS PACHUCA"
    watermarkPosition: string,    // "bottom-right"
    includeDecorations: boolean,
    keywords?: string[]
  },

  // 🎁 RESULTS
  generatedImageUrl?: string,     // CDN URL
  imageBankId?: ObjectId,         // ✅ Si se guardó en image bank

  // 📝 CLEAN METADATA (FASE 5)
  altText?: string,               // WAI-ARIA <125 chars
  caption?: string,
  keywords: string[],

  // 💰 TRACKING
  cost: number,                   // USD
  generationTime?: number,        // ms
  processingTime?: number,        // ms

  // 🔒 COMPLIANCE
  aiGenerated: boolean,           // Siempre true
  c2paIncluded: boolean,
  editorialReviewed: boolean,

  // 📊 USAGE
  usedInArticles: ObjectId[],     // AIContentGeneration refs
  createdBy: ObjectId,            // ✅ Usuario que solicitó
}
```

**Índices Importantes**:
```javascript
{ model: 1, createdAt: -1 }
{ quality: 1, createdAt: -1 }
{ createdBy: 1, createdAt: -1 }
{ extractedNoticiaId: 1 }
{ createdBy: 1, model: 1, createdAt: -1 }
{ editorialReviewed: 1, createdAt: -1 }
```

---

## 🔄 FLUJOS PRINCIPALES

### FLUJO 1: Extracción de Imágenes de Noticias

```
1. ExtractedNoticia se crea con URLs de imágenes
   ├─> ExtractedNoticia.mainImages: string[]
   └─> ExtractedNoticia.additionalImages: string[]

2. (OPCIONAL) Procesamiento automático o manual
   ├─> POST /image-bank/process
   │   Body: {
   │     imageUrl: "https://source.com/image.jpg",
   │     outlet: "plazajuarez.com",
   │     extractedNoticiaId: "68f...",
   │     keywords: ["hidalgo", "política"],
   │     categories: ["Política"]
   │   }
   │
   └─> ImageBankProcessorService.processAndStore()
       ├─> 1. Download image from URL
       ├─> 2. Process with Sharp
       │   ├─> Remove EXIF/IPTC/XMP metadata
       │   ├─> Resize to 4 versions (original, thumbnail, medium, large)
       │   └─> Convert to WebP (optimized)
       ├─> 3. Upload to S3
       │   └─> s3://bucket/image-bank/{outlet}/{year}/{month}/{id}/{size}.webp
       ├─> 4. Save to ImageBank collection
       └─> 5. Emit event: image-bank.processed

3. ImageBank creado y disponible
   └─> Puede ser usado en PublishedNoticia.featuredImage
```

---

### FLUJO 2: Generación de Imágenes con IA (FASE 5)

```
CLIENTE (Mobile App):
POST /image-generation/generate
Body: {
  extractedNoticiaId: "68f...",  // Opcional
  prompt: "noticia sobre...",    // Opcional si hay extractedNoticiaId
  model: "gpt-image-1",
  quality: "medium",
  size: "1024x1024",
  watermarkText: "NOTICIAS PACHUCA",
  includeDecorations: true,
  keywords: ["Hidalgo", "Gobierno"]
}

↓

BACKEND (ImageGenerationService.generateNewsImage):

STEP 1: Obtener contenido
  ├─> Si extractedNoticiaId existe:
  │   └─> Fetch ExtractedNoticia de MongoDB
  └─> originalTitle = extractedNoticia.title || dto.prompt

STEP 2: Análisis de Contenido (ContentAnalyzerService)
  ├─> Envía title + content (max 2000 chars) a GPT-4
  └─> Recibe:
      {
        mainSubject: "Brigadas médicas",
        action: "despliegan",
        context: "tras tormenta Priscilla",
        tone: "informative",
        visualSuggestion: "documentary style"
      }

STEP 3: Construir Prompt Editorial (EditorialPromptService)
  ├─> Usa contentAnalysis + originalTitle
  ├─> Selecciona template: 'documentary', 'portrait', 'scene', 'conceptual'
  └─> Genera basePrompt:
      "Photojournalistic scene: medical brigades deployed
       after storm Priscilla in Hidalgo, Mexico.
       Documentary style, professional lighting..."

STEP 4: Aplicar Branding (BrandingService.applyBranding)
  ├─> Recibe: basePrompt
  ├─> Agrega watermark instructions:
  │   "Include watermark 'NOTICIAS PACHUCA' bottom-right,
  │    white text with shadow"
  ├─> Agrega decorations (si includeDecorations = true):
  │   "Add decorative ribbons with keywords: Hidalgo, Gobierno"
  └─> Retorna:
      {
        basePrompt: "...",     // ✅ Sin branding (se guarda en DB)
        fullPrompt: "...",     // ✅ Con branding (se envía a OpenAI)
        config: { ... }
      }

STEP 5: Crear registro de generación
  └─> ImageGeneration.create({
        prompt: basePrompt,           // ✅ LIMPIO
        model: "gpt-image-1",
        brandingConfig: config,
        contentAnalysisResult: contentAnalysis,
        editorialTemplate: "documentary",
        createdBy: userId
      })

STEP 6: Descargar imagen de referencia (si aplica)
  └─> Si dto.sourceImageId || dto.sourceImageUrl:
      └─> Download con sharp y convertir a Buffer

STEP 7: Encolar job (BullMQ)
  └─> ImageGenerationQueueService.addGenerationJob({
        generationId: generation._id,
        prompt: fullPrompt,         // ✅ CON BRANDING para OpenAI
        basePrompt: basePrompt,     // Para metadata
        contentAnalysis: contentAnalysis,
        referenceImageBuffer: buffer,  // Si aplica
        model: "gpt-image-1",
        ...
      })

↓

WORKER (ImageGenerationProcessor - BullMQ)

STEP 8: Procesar job
  ├─> 1. Llamar OpenAI API
  │   ├─> Si NO hay referenceImageBuffer:
  │   │   └─> POST /v1/images/generations
  │   │       Body: { prompt: fullPrompt, model, size, quality }
  │   └─> Si HAY referenceImageBuffer:
  │       └─> POST /v1/images/edits
  │           Body: { image: buffer, prompt: fullPrompt, model, size }
  │
  ├─> 2. Descargar imagen generada
  │   └─> imageUrl = response.data[0].url
  │
  ├─> 3. Post-processing con Sharp
  │   ├─> Resize si es necesario
  │   ├─> Aplicar filtros (opcional)
  │   └─> Optimizar calidad
  │
  ├─> 4. Subir a S3
  │   └─> s3://bucket/ai-generated/{userId}/{year}/{month}/{generationId}.webp
  │
  ├─> 5. Generar metadata clean (MetadataBuilderService)
  │   ├─> Usa basePrompt + contentAnalysis (NO fullPrompt con branding)
  │   └─> Genera:
  │       {
  │         altText: "Medical brigades deployed in Hidalgo",
  │         caption: "IMSS brigades assist communities after storm",
  │         keywords: ["medical", "emergency", "Hidalgo"]
  │       }
  │
  ├─> 6. Actualizar ImageGeneration
  │   └─> Update({
  │         generatedImageUrl: s3Url,
  │         altText, caption, keywords,
  │         cost: 0.02,
  │         generationTime: 15000,
  │         c2paIncluded: true
  │       })
  │
  └─> 7. Emitir eventos
      ├─> EventEmitter: image-generation.completed
      └─> WebSocket: image-generation:completed
          └─> Mobile App recibe notificación en tiempo real

↓

RESPUESTA AL CLIENTE:
{
  message: "Image generation completed",
  generation: { ... },
  jobId: "1234"
}
```

---

### FLUJO 3: Guardar Imagen Generada en Image Bank

```
CLIENTE:
POST /image-generation/:id/store-in-bank
Body: {
  keywords: ["medical", "emergency"],
  categories: ["Salud"],
  altText: "Updated alt text",
  caption: "Updated caption"
}

↓

BACKEND (ImageGenerationController.storeInBank):

1. Fetch ImageGeneration por ID
   └─> Validar que generatedImageUrl existe

2. Crear entrada en ImageBank
   └─> ImageBank.create({
         processedUrls: {
           original: generation.generatedImageUrl,
           thumbnail: generation.generatedImageUrl,
           medium: generation.generatedImageUrl,
           large: generation.generatedImageUrl,
           s3BaseKey: "ai-generated/..."
         },
         altText: dto.altText || generation.altText,
         caption: dto.caption || generation.caption,
         keywords: dto.keywords,
         categories: dto.categories,
         outlet: "ai-generated",
         aiGenerated: true,
         c2paIncluded: generation.c2paIncluded,
         imageGenerationId: generation._id,
         quality: generation.quality
       })

3. Actualizar ImageGeneration
   └─> generation.imageBankId = imageBankEntry._id

4. Emitir evento
   └─> image-generation.stored-in-bank

↓

RESPUESTA:
{
  success: true,
  imageBankId: "68f...",
  message: "Image stored in bank successfully"
}
```

---

## 📡 API ENDPOINTS

### Image Bank Endpoints

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| **GET** | `/image-bank` | Lista con filtros + paginación | ✅ |
| **GET** | `/image-bank/:id` | Detalle de imagen | ✅ |
| **POST** | `/image-bank` | Crear manual | ✅ |
| **POST** | `/image-bank/process` | Procesar desde URL | ✅ |
| **POST** | `/image-bank/process-batch` | Procesar batch | ✅ |
| **PATCH** | `/image-bank/:id` | Actualizar metadata | ✅ |
| **DELETE** | `/image-bank/:id` | Soft delete | ✅ |
| **GET** | `/image-bank/aggregations/keywords` | Keywords con conteo | ✅ |
| **GET** | `/image-bank/aggregations/outlets` | Outlets con conteo | ✅ |
| **GET** | `/image-bank/aggregations/categories` | Categorías con conteo | ✅ |
| **GET** | `/image-bank/stats/summary` | Estadísticas generales | ✅ |

**Filtros disponibles** (`/image-bank`):
- `page` (default: 1)
- `limit` (default: 10, max: 100)
- `keywords` (comma-separated)
- `outlet` (dominio)
- `categories` (comma-separated)
- `quality` (high|medium|low)
- `searchText` (full-text en altText, caption, keywords)
- `sortBy` (createdAt|quality|outlet)
- `sortOrder` (asc|desc)

---

### Image Generation Endpoints

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| **POST** | `/image-generation/generate` | Generar imagen con IA | ✅ |
| **GET** | `/image-generation` | Lista de generaciones del user | ✅ |
| **GET** | `/image-generation/:id` | Detalle de generación | ✅ |
| **GET** | `/image-generation/job/:jobId/status` | Estado del job (BullMQ) | ✅ |
| **POST** | `/image-generation/:id/store-in-bank` | Guardar en image bank | ✅ |
| **GET** | `/image-generation/stats/summary` | Estadísticas del usuario | ✅ |
| **DELETE** | `/image-generation/:id` | Eliminar generación | ✅ |

**Request** (`/image-generation/generate`):
```typescript
{
  extractedNoticiaId?: string,
  prompt?: string,              // Si no hay extractedNoticiaId
  model?: 'gpt-image-1' | 'dall-e-3',
  quality?: 'low' | 'medium' | 'high',
  size?: '1024x1024' | '1024x1536' | '1536x1024',
  watermarkText?: string,       // Default: "NOTICIAS PACHUCA"
  includeDecorations?: boolean,
  keywords?: string[],
  sourceImageId?: string,       // Para /images/edits
  sourceImageUrl?: string       // Para /images/edits
}
```

**Response** (`/image-generation/generate`):
```typescript
{
  message: "Image generation started",
  generation: ImageGeneration,
  jobId: string | number,
  estimatedTime: number         // seconds
}
```

---

## 📱 INTEGRACIÓN MOBILE-EXPO

### Servicios API

**Ubicación**: `/packages/mobile-expo/src/services/api/`

#### 1. `imageBankApi.ts`

```typescript
imageBankApi = {
  // POST /image-bank/process
  processSingleImage(dto: ProcessImageDto): Promise<ImageBankResponse>

  // POST /image-bank/process-batch
  processBatchImages(dto: ProcessBatchDto): Promise<BatchProcessResponse>

  // GET /image-bank/stats
  getStats(): Promise<Stats>
}
```

#### 2. `imageGenerationApi.ts`

```typescript
imageGenerationApi = {
  // POST /image-generation/generate
  generateImage(request: GenerateImageRequest): Promise<GenerateImageResponse>

  // GET /image-generation/:id
  getGenerationById(id: string): Promise<ImageGeneration>

  // GET /image-generation
  getGenerations(filters?: Filters): Promise<PaginatedResponse<ImageGeneration>>

  // GET /image-generation/job/:jobId/status
  getJobStatus(jobId: string | number): Promise<JobStatus>

  // POST /image-generation/:id/store-in-bank
  storeInBank(id: string, metadata: StoreInBankMetadata): Promise<StoreInBankResponse>

  // GET /image-generation/stats/summary
  getUserStats(): Promise<UserStats>

  // DELETE /image-generation/:id
  deleteGeneration(id: string): Promise<void>
}
```

---

### Custom Hooks

**Ubicación**: `/packages/mobile-expo/src/hooks/`

#### Generación de Imágenes

```typescript
// useImageGeneration.ts
useImageGeneration() => {
  generateImage: (request) => Promise<GenerateImageResponse>,
  isGenerating: boolean,
  error: Error | null
}

// useImageGenerations.ts
useImageGenerations(filters?) => {
  generations: ImageGeneration[],
  pagination: PaginationInfo,
  isLoading: boolean,
  refetch: () => void
}

// useImageGenerationById.ts
useImageGenerationById(id: string) => {
  generation: ImageGeneration | null,
  isLoading: boolean,
  error: Error | null
}

// useImageGenerationStats.ts
useImageGenerationStats() => {
  stats: UserStats | null,
  isLoading: boolean
}

// useImageGenerationSocket.ts
useImageGenerationSocket() => {
  subscribe: (generationId: string, callback: (event) => void) => void,
  unsubscribe: (generationId: string) => void
}
```

---

### WebSocket Events

**Servidor** emite:
```typescript
// Cuando inicia generación
event: 'image-generation:started'
payload: { generationId, jobId, estimatedTime }

// Cuando completa generación
event: 'image-generation:completed'
payload: { generationId, imageUrl, altText, caption, keywords }

// Cuando falla generación
event: 'image-generation:failed'
payload: { generationId, error, reason }

// Progreso (opcional)
event: 'image-generation:progress'
payload: { generationId, progress: number }
```

**Cliente** escucha:
```typescript
useImageGenerationSocket() => {
  const subscribe = (generationId, callback) => {
    socket.on(`image-generation:${generationId}:completed`, callback);
    socket.on(`image-generation:${generationId}:failed`, callback);
  };
}
```

---

## 🔗 DEPENDENCIAS Y RELACIONES

### Relaciones entre Schemas

```
ExtractedNoticia (1) ──┬──> (N) ImageBank
                       │     (extractedNoticiaId)
                       │
                       └──> (N) ImageGeneration
                             (extractedNoticiaId)

ImageGeneration (1) ────> (0..1) ImageBank
                          (imageBankId)

ImageBank (1) ────> (0..1) ImageGeneration
                    (imageGenerationId)

PublishedNoticia (1) ──> (N) ImageBank
                          (featuredImage ref, usedInArticles)

AIContentGeneration (1) ──> (N) ImageGeneration
                             (usedInArticles)

User (1) ────> (N) ImageGeneration
               (createdBy)
```

---

### Servicios y Dependencias

```
ImageGenerationService
├─> ImageGenerationQueueService (BullMQ)
├─> ContentAnalyzerService (GPT-4 analysis)
├─> EditorialPromptService (prompt builder)
├─> BrandingService (watermark + decorations)
├─> MetadataBuilderService (clean metadata)
└─> ImageGenerationNotifierService (WebSocket)

ImageGenerationProcessor (Worker)
├─> OpenAI API Client
├─> Sharp (image processing)
├─> S3 Upload Service
├─> MetadataBuilderService
└─> EventEmitter2 (events)

ImageBankService
├─> ImageBankProcessorService (download + sharp + S3)
└─> ImageBankEventsService (events)
```

---

## 💡 CASOS DE USO

### Caso 1: Editor Busca Imagen en el Banco

```
MOBILE APP:
1. User abre "Image Bank"
2. Aplica filtros:
   - outlet: "plazajuarez.com"
   - keywords: ["Hidalgo", "Gobierno"]
   - quality: "high"
3. GET /image-bank?outlet=plazajuarez.com&keywords=Hidalgo,Gobierno&quality=high

BACKEND:
1. ImageBankService.findWithFilters()
2. Construye query MongoDB con filtros
3. Aplica paginación
4. Retorna lista de imágenes

MOBILE APP:
1. Muestra grid de thumbnails
2. User selecciona imagen
3. Muestra detalle con metadata
4. User puede:
   - Copiar URL (processedUrls.large)
   - Ver imágenes que usan esta
   - Editar metadata
```

---

### Caso 2: Generar Imagen para Noticia Extraída

```
MOBILE APP:
1. User ve ExtractedNoticia sin imagen
2. Click "Generate AI Image"
3. Formulario:
   - extractedNoticiaId: "68f..."
   - model: "gpt-image-1"
   - quality: "high"
   - watermarkText: "NOTICIAS PACHUCA"
   - includeDecorations: true
   - keywords: ["Hidalgo", "Seguridad"]
4. POST /image-generation/generate

BACKEND:
1. Análisis de contenido con GPT-4
2. Construcción de prompt editorial
3. Aplicación de branding
4. Creación de ImageGeneration
5. Encolado de job
6. Retorna { generation, jobId }

MOBILE APP:
1. Muestra "Generating..." con jobId
2. Suscribe a WebSocket: image-generation:{generationId}:*
3. Recibe evento "completed"
4. Muestra imagen generada
5. User puede:
   - Ver/editar metadata
   - Guardar en image bank (POST /:id/store-in-bank)
   - Usar en publicación
```

---

### Caso 3: Publicar Noticia con Imagen del Banco

```
MOBILE APP:
1. User crea PublishedNoticia
2. Selecciona "Featured Image"
3. Abre selector de Image Bank
4. Filtros: categories=["Política"], quality="high"
5. Selecciona imagen
6. Guarda publicación con featuredImage: imageBankId

BACKEND:
1. PublishedNoticiaService.create()
2. Valida que imageBankId existe
3. Crea PublishedNoticia con referencia
4. Actualiza ImageBank:
   - usageCount += 1
   - usedInArticles.push(publishedNoticiaId)
   - lastUsedAt = new Date()
5. Retorna PublishedNoticia con featuredImage populated
```

---

## 📦 RESUMEN DE FLUJOS

| Flujo | Origen | Proceso | Destino |
|-------|--------|---------|---------|
| **Extracción** | URL externa | Download → Sharp → S3 | ImageBank |
| **Generación IA** | Prompt/Noticia | GPT-4 analysis → OpenAI → Post-process → S3 | ImageGeneration |
| **Guardar en Banco** | ImageGeneration | Copy metadata | ImageBank |
| **Publicación** | ImageBank | Referencia | PublishedNoticia |
| **Búsqueda** | Filtros | Query MongoDB | Lista ImageBank |

---

## 🎯 PRÓXIMOS PASOS SUGERIDOS

Si quieres crear algo nuevo relacionado con el banco de imágenes, considera:

1. **Nuevo Módulo de Edición de Imágenes**
   - Integrar con Canvas API o similar
   - Permitir crop, resize, filters en el banco

2. **Sistema de Colecciones/Albums**
   - Agrupar imágenes por tema
   - Compartir colecciones entre users

3. **Mejoras en Búsqueda**
   - Búsqueda por similaridad visual (AI embeddings)
   - Reverse image search

4. **Analytics y Reporting**
   - Dashboard de uso de imágenes
   - Métricas de performance (más usadas, etc.)

5. **Integración con Otros Módulos**
   - Uso automático en Generator Pro
   - Sugerencias inteligentes basadas en contenido

---

**FIN DEL ANÁLISIS**
