# 🎨 FEATURE: AI IMAGE GENERATION & BRANDING - GENERACIÓN DE IMÁGENES CON IA

**Fecha de creación**: 2025-10-10
**Estado**: En planificación
**Prioridad**: Alta
**Versión**: 1.0
**Estado de aprobación**: ✅ APROBADO - Listo para implementación

---

## ✅ DECISIONES TOMADAS

**Fecha de aprobación**: 2025-10-10

1. **Modelo seleccionado**: `gpt-image-1` con calidad **medium**
   - Costo: $0.04 por imagen (1024×1024)
   - Justificación: Óptimo balance costo/calidad para watermarks profesionales

2. **Presupuesto autorizado**: **$60/mes** (conservador)
   - Volumen: 50 imágenes/día
   - Total mensual: ~1,500 imágenes/mes

3. **Fases de implementación**: **TODAS LAS 11 FASES** confirmadas
   - Incluye Fase 10 (Batch Generation)
   - Duración estimada: 10-14 días

4. **Sin modificaciones al plan**: Proceder según documento

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

### ¿Qué es AI Image Generation & Branding?

Un módulo completo de backend y frontend para generar imágenes brandedas con IA a partir de noticias extraídas. Permite a los usuarios:

- Generar imágenes profesionales con watermark de "NOTICIAS PACHUCA"
- Modificar imágenes existentes para evitar copyright
- Brandear automáticamente con elementos visuales del sitio
- Optimizar imágenes en formatos modernos (AVIF, WebP, JPEG)
- Almacenar en banco de imágenes con metadata SEO
- Usar imágenes generadas para redes sociales y artículos

### Hallazgos Clave de la Investigación

1. **Modelo Recomendado**: **gpt-image-1** (lanzado abril 2025)
   - Mejor renderizado de texto para watermarks
   - Superior comprensión de prompts vs DALL-E 3
   - Costo-efectivo: $0.04/imagen (calidad medium)
   - Soporte hasta 4096×4096 píxeles

2. **Reutilización**: 90% del código existente es reutilizable:
   - `OpenAIAdapter` (solo extender con método `generateImage()`)
   - `ImageBankProcessorService` (post-procesamiento)
   - `ContentGenerationQueueService` (patrón de queue)
   - `ProviderFactoryService` (failover automático)

3. **Arquitectura**: Integración con sistema OpenAI existente y banco de imágenes.

4. **Compliance**: C2PA watermarking automático + etiquetado "AI-Generated" obligatorio.

5. **Presupuesto Aprobado**: $60/mes para 1,500 imágenes/mes con calidad medium (conservador).

---

## 🎯 OBJETIVOS DEL FEATURE

### Funcionales

1. **Backend**:
   - Extender `OpenAIAdapter` con método `generateImage()`
   - Nuevo servicio `ImageGenerationService`
   - API REST para generación de imágenes
   - Queue system para procesamiento asíncrono
   - Post-procesamiento: branding + optimización multi-formato
   - Integración con `image-bank` para almacenamiento

2. **Frontend Mobile**:
   - Botón "Generar con IA" en detalle de imagen
   - Modal de configuración (prompt, quality, branding options)
   - Progress tracking en tiempo real (socket)
   - Preview de imagen generada
   - Botón "Almacenar en banco" post-generación
   - Logs de generación en tiempo real

### No Funcionales

- **Performance**: Generar imagen < 15s (medium quality)
- **Costo**: Optimizar calidad/costo (medium por defecto)
- **Ética**: Etiquetado "AI-Generated" obligatorio
- **Escalabilidad**: Queue workers para batch processing
- **SEO**: Imágenes optimizadas en AVIF/WebP/JPEG

---

## 🔬 INVESTIGACIÓN TÉCNICA

### 1. Modelos OpenAI Disponibles (2025)

#### **gpt-image-1** (RECOMENDADO)

**Características**:
- Lanzado: Abril 2025
- Base: GPT-4o multimodal framework
- Mejor renderizado de texto en imágenes
- Superior seguimiento de instrucciones
- Resoluciones: 1024×1024 hasta 4096×4096
- Capacidad de edición (inpainting)
- C2PA watermarking automático

**Pricing**:
```
Low quality:    $0.01 / imagen (1024×1024)
Medium quality: $0.04 / imagen (1024×1024)  ← RECOMENDADO
High quality:   $0.17 / imagen (1024×1024)
```

**Ventajas**:
- ✅ Mejor para watermarks y branding
- ✅ Comprensión de contexto superior
- ✅ Soporte de edición de imágenes
- ✅ Comercialmente viable

**Desventajas**:
- ❌ No tiene modificadores de estilo (vivid/natural)
- ❌ Solo 1 imagen por request en edición
- ❌ Output siempre en base64

#### **DALL-E 3** (Alternativa)

**Pricing**:
```
Standard 1024×1024:  $0.04 / imagen
HD 1024×1024:        $0.08 / imagen
Standard 1024×1792:  $0.08 / imagen
HD 1024×1792:        $0.12 / imagen
```

**Ventajas**:
- ✅ Calidad artística excepcional
- ✅ Modificadores de estilo (vivid/natural)
- ✅ ChatGPT Plus: unlimited ($20/mes)

**Desventajas**:
- ❌ Solo 1 imagen por request
- ❌ Sin edición de imágenes
- ❌ Renderizado de texto inferior a gpt-image-1

#### **DALL-E 2** (Legacy)

**Pricing**: $0.02 / imagen (1024×1024)

**NO RECOMENDADO** para este feature:
- Calidad inferior
- Renderizado de texto pobre
- No sirve para branding profesional

### 2. Integración con Sistema Existente

#### OpenAI Infrastructure Disponible

**Ya Implementado** en `api-nueva/src/content-ai/`:

```typescript
// OpenAIAdapter ya existe (líneas 1-511)
class OpenAIAdapter implements IAIProviderAdapter {
  // Métodos existentes:
  generateContent()        ✅
  generateContentStream()  ✅
  generateBatch()          ✅
  calculateCost()          ✅

  // FALTA AGREGAR:
  generateImage()          ❌ NUEVO
  editImage()              ❌ NUEVO
}
```

**Config ya disponible** (ConfigService):
```typescript
OPENAI_API_KEY           ✅
OPENAI_ORGANIZATION_ID   ✅
OPENAI_PROJECT_ID        ✅
OPENAI_MODEL             ✅
OPENAI_MAX_TOKENS        ✅
OPENAI_TEMPERATURE       ✅
```

#### Image Bank Integration

**Ya Implementado** en `api-nueva/src/image-bank/`:

```typescript
// ImageBankProcessorService (líneas 1-504)
class ImageBankProcessorService {
  // Métodos reutilizables:
  generateImageSizes()     ✅  // AVIF, WebP, JPEG
  uploadToS3()             ✅  // S3 + CDN
  assessImageQuality()     ✅  // high/medium/low

  // FALTA AGREGAR:
  applyBranding()          ❌  // NUEVO
  processAIGenerated()     ❌  // NUEVO
}
```

### 3. Branding Strategy

#### Watermarking Approaches

**Opción 1: Prompt-Based (RECOMENDADO)**

```typescript
const prompt = `
Professional news photograph of ${title}.
Include 'NOTICIAS PACHUCA' watermark in bottom-right corner.
Watermark style: subtle, semi-transparent, professional.
Brand colors: yellow (#f1ef47) and black.
`.trim();
```

**Ventajas**:
- ✅ Integración natural con la imagen
- ✅ gpt-image-1 renderiza texto perfectamente
- ✅ No requiere post-procesamiento adicional

**Opción 2: Post-Processing Overlay**

```typescript
// Usar Sharp para overlay después de generación
await sharp(generatedImage)
  .composite([{
    input: watermarkBuffer,
    gravity: 'southeast'
  }])
  .toBuffer()
```

**Ventajas**:
- ✅ Control preciso de posición
- ✅ Reutilizable para imágenes no-AI

**Desventajas**:
- ❌ Paso adicional de procesamiento
- ❌ Puede verse menos natural

**DECISIÓN**: Usar **Opción 1** (prompt-based) como primaria, con Opción 2 como fallback.

#### Branding Elements

**Elementos a incluir**:
1. Watermark "NOTICIAS PACHUCA" (obligatorio)
2. Decoración sutil con colores del sitio (#f1ef47)
3. Cintillos/banners opcionales con keywords de la noticia
4. Evitar exceso de texto (penalización Facebook)

**Restricciones**:
- Máximo 20% de la imagen con texto
- Mantener profesionalismo (no ridiculizar)
- Watermark semi-transparente
- Respetar composición de la imagen

### 4. Formato de Imágenes Optimizado

#### Multi-Format Generation

**Formatos a generar** (según `OptimizedImage.tsx`):

```typescript
{
  avif: 'image.avif',    // -50% vs WebP (primera opción)
  webp: 'image.webp',    // -30% vs JPEG (segunda opción)
  jpeg: 'image.jpg'      // Fallback universal
}
```

**Tamaños** (según `ImageBankProcessorService`):

```typescript
{
  original:  { width: 1920, format: 'avif', quality: 90 },
  large:     { width: 1200, height: 630, format: 'webp', quality: 90 },
  medium:    { width: 800, height: 500, format: 'webp', quality: 85 },
  thumbnail: { width: 400, height: 250, format: 'webp', quality: 80 }
}
```

**Pipeline**:
```
1. gpt-image-1 genera PNG 1024×1024
   ↓
2. Sharp resize a 4 tamaños
   ↓
3. Convertir cada tamaño a AVIF + WebP + JPEG
   ↓
4. Upload a S3 (12 archivos totales)
   ↓
5. Guardar en ImageBank con processedUrls
```

### 5. Real-Time Progress Tracking

**Socket Events** (patrón de `useExtractionLogs`):

```typescript
// Backend emite:
socket.emit('image-generation:started', {
  jobId,
  imageId,
  prompt,
  quality
})

socket.emit('image-generation:progress', {
  jobId,
  step: 'generating' | 'optimizing' | 'uploading',
  progress: 0-100,
  message: string
})

socket.emit('image-generation:completed', {
  jobId,
  imageId,
  processedUrls,
  cost
})

socket.emit('image-generation:failed', {
  jobId,
  error: string
})
```

**Frontend hook** (similar a `useExtractionLogs`):

```typescript
const { logs, progress, isGenerating } = useImageGenerationLogs(jobId);

// Logs tipo:
[
  { type: 'loading', message: '⏳ Generando imagen con IA...' },
  { type: 'success', message: '✓ Imagen generada' },
  { type: 'loading', message: '⏳ Optimizando formatos (AVIF, WebP)...' },
  { type: 'success', message: '✓ 12 archivos creados' },
  { type: 'loading', message: '⏳ Subiendo a CDN...' },
  { type: 'success', message: '✓ Imagen almacenada' },
]
```

### 6. Ethical Guidelines

**Ética en Periodismo con IA** (Leiden University, 2025):

**PERMITIDO**:
- ✅ Ilustraciones de artículos de opinión
- ✅ Conceptos abstractos
- ✅ Recreaciones históricas
- ✅ Imágenes de temas no fotografiables
- ✅ Gráficos de redes sociales
- ✅ Headers de secciones

**PROHIBIDO**:
- ❌ Reemplazar fotoperiodismo real
- ❌ Noticias de última hora como foto real
- ❌ Retratos de personas reales
- ❌ Escenas de crimen/accidentes
- ❌ Cualquier contenido que engañe

**OBLIGATORIO**:
- 🔴 Etiquetar TODAS las imágenes AI como "AI-Generated"
- 🔴 Mantener metadata C2PA
- 🔴 Revisión editorial humana
- 🔴 Documentar prompts usados

### 7. Cost Analysis

#### Escenarios de Uso

**Micro Operation** (25 imágenes/día):
```
Costo diario:   25 × $0.04 = $1.00
Costo mensual:  $30.00
Modelo:         gpt-image-1 medium
```

**Small Operation** (100 imágenes/día):
```
Costo diario:   100 × $0.04 = $4.00
Costo mensual:  $120.00
Modelo:         gpt-image-1 medium
Alternativa:    ChatGPT Plus $20/mes (unlimited DALL-E 3)
```

**Medium Operation** (300 imágenes/día):
```
Mix de calidades:
- 60% low ($0.01):     180 × $0.01 = $1.80
- 30% medium ($0.04):   90 × $0.04 = $3.60
- 10% high ($0.17):     30 × $0.17 = $5.10

Costo diario:   $10.50
Costo mensual:  $315.00
```

**RECOMENDACIÓN PARA PACHUCA NOTICIAS**:

```
Fase 1 (Prueba):
- 50 imágenes/día × $0.04 = $60/mes
- Solo medium quality
- Monitorear uso y ajustar

Fase 2 (Escala):
- ChatGPT Plus $20/mes (unlimited)
- API para integración automática
- Quality routing automático
```

---

## 🏗️ ARQUITECTURA PROPUESTA

### Backend

```
api-nueva/src/

content-ai/
├── adapters/
│   └── openai.adapter.ts              ← EXTENDER (agregar generateImage)
│
├── services/
│   ├── image-generation.service.ts    ← NUEVO
│   └── branding.service.ts            ← NUEVO
│
├── processors/
│   └── image-generation.processor.ts  ← NUEVO (Bull Queue)
│
├── controllers/
│   └── image-generation.controller.ts ← NUEVO
│
├── dto/
│   └── image-generation.dto.ts        ← NUEVO
│
└── events/
    └── image-generation.events.ts     ← NUEVO

image-bank/
└── services/
    └── image-bank-processor.service.ts  ← EXTENDER (AI processing)
```

### Frontend

```
mobile-expo/

app/(protected)/
├── image-detail/
│   └── [id].tsx                       ← MODIFICAR (agregar botón "Generar IA")
│
└── image-generation/
    └── result.tsx                     ← NUEVO (preview + almacenar)

src/
├── hooks/
│   ├── useImageGeneration.ts          ← NUEVO
│   └── useImageGenerationLogs.ts      ← NUEVO
│
├── services/
│   └── api/
│       └── imageGenerationApi.ts      ← NUEVO
│
├── components/
│   └── image-generation/
│       ├── GenerateImageModal.tsx     ← NUEVO
│       ├── GenerationProgress.tsx     ← NUEVO
│       └── BrandingOptions.tsx        ← NUEVO
│
└── types/
    └── image-generation.types.ts      ← NUEVO
```

### Schema Extensions

#### New: ImageGeneration Collection

```typescript
{
  _id: ObjectId,

  // Source
  sourceImageId?: ObjectId,          // Si es modificación de imagen existente
  sourceImageUrl?: string,           // URL de imagen original
  extractedNoticiaId?: ObjectId,     // Noticia relacionada

  // Generation Config
  prompt: string,                    // Prompt usado
  model: 'gpt-image-1' | 'dall-e-3', // Modelo usado
  quality: 'low' | 'medium' | 'high',
  size: string,                      // "1024x1024"

  // Branding
  brandingConfig: {
    watermarkText: string,           // "NOTICIAS PACHUCA"
    watermarkPosition: string,       // "bottom-right"
    includeDecorations: boolean,     // Cintillos, etc.
    keywords?: string[]              // Para cintillos
  },

  // Results
  generatedImageUrl: string,         // URL CDN de imagen generada
  imageBankId?: ObjectId,            // Si se almacenó en banco

  // Metadata
  cost: number,                      // Costo en USD
  generationTime: number,            // Milisegundos
  processingTime: number,            // Post-processing

  // Compliance
  aiGenerated: true,                 // Siempre true
  c2paIncluded: boolean,             // C2PA metadata
  editorialReviewed: boolean,        // Revisión humana

  // Tracking
  usedInArticles: ObjectId[],        // Artículos donde se usó

  createdAt: Date,
  createdBy: ObjectId                // Usuario que generó
}
```

### API Endpoints

```
POST   /api/image-generation/generate                  # Generar nueva imagen
POST   /api/image-generation/edit                      # Editar imagen existente
GET    /api/image-generation/:id                       # Obtener generación
GET    /api/image-generation/job/:jobId/status         # Status de job
POST   /api/image-generation/:id/store-in-bank         # Almacenar en banco
GET    /api/image-generation/stats                     # Estadísticas de uso/costo
DELETE /api/image-generation/:id                       # Eliminar generación
```

### OpenAIAdapter Extension

```typescript
// Agregar a openai.adapter.ts (líneas ~512+)

export class OpenAIAdapter implements IAIProviderAdapter {

  // ... métodos existentes ...

  /**
   * Generate image with gpt-image-1
   */
  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    const {
      prompt,
      quality = 'medium',
      size = '1024x1024',
      outputFormat = 'png'
    } = options;

    const response = await this.openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size,
      quality,
      output_format: outputFormat
    });

    // gpt-image-1 returns base64
    const imageData = response.data[0].b64_json;
    const buffer = Buffer.from(imageData, 'base64');

    // Calculate cost
    const cost = this.calculateImageCost(quality, size);

    // Track usage
    await this.updateUsageStats({
      cost,
      model: 'gpt-image-1',
      operation: 'image-generation'
    });

    return {
      imageBuffer: buffer,
      format: outputFormat,
      cost,
      size,
      quality
    };
  }

  /**
   * Edit existing image with inpainting
   */
  async editImage(options: ImageEditOptions): Promise<ImageGenerationResult> {
    const {
      imageBuffer,
      prompt,
      maskBuffer,
      size = '1024x1024'
    } = options;

    // Convert buffers to File objects for API
    const imageFile = new File([imageBuffer], 'image.png', { type: 'image/png' });
    const maskFile = maskBuffer
      ? new File([maskBuffer], 'mask.png', { type: 'image/png' })
      : undefined;

    const response = await this.openai.images.edit({
      model: 'gpt-image-1',
      image: imageFile,
      mask: maskFile,
      prompt,
      size
    });

    const imageData = response.data[0].b64_json;
    const buffer = Buffer.from(imageData, 'base64');

    // Edit costs same as generation
    const cost = this.calculateImageCost('medium', size);

    await this.updateUsageStats({
      cost,
      model: 'gpt-image-1',
      operation: 'image-editing'
    });

    return {
      imageBuffer: buffer,
      format: 'png',
      cost,
      size,
      quality: 'medium'
    };
  }

  /**
   * Calculate image generation cost
   */
  private calculateImageCost(
    quality: 'low' | 'medium' | 'high',
    size: string
  ): number {
    const baseCosts = {
      low: 0.01,
      medium: 0.04,
      high: 0.17
    };

    // Base cost for 1024×1024
    let cost = baseCosts[quality];

    // Scale for larger sizes (proportional to pixels)
    const [width, height] = size.split('×').map(Number);
    const basePixels = 1024 * 1024;
    const actualPixels = width * height;
    const scaleFactor = actualPixels / basePixels;

    return cost * scaleFactor;
  }
}
```

### ImageGenerationService

```typescript
// Nuevo: api-nueva/src/content-ai/services/image-generation.service.ts

@Injectable()
export class ImageGenerationService {

  constructor(
    @InjectModel(ImageGeneration.name)
    private imageGenerationModel: Model<ImageGeneration>,

    private providerFactory: ProviderFactoryService,
    private imageBankProcessor: ImageBankProcessorService,
    private brandingService: BrandingService,
    private queueService: ImageGenerationQueueService,
    private eventEmitter: EventEmitter2,
    private logger: Logger
  ) {}

  /**
   * Generate branded news image
   */
  async generateNewsImage(
    dto: GenerateNewsImageDto,
    userId: string
  ): Promise<ImageGeneration> {
    // 1. Build enhanced prompt with branding
    const enhancedPrompt = await this.brandingService.buildPrompt({
      basePrompt: dto.prompt,
      watermarkText: 'NOTICIAS PACHUCA',
      includeDecorations: dto.includeDecorations,
      keywords: dto.keywords
    });

    // 2. Queue generation job
    const job = await this.queueService.addGenerationJob({
      prompt: enhancedPrompt,
      model: dto.model || 'gpt-image-1',
      quality: dto.quality || 'medium',
      size: dto.size || '1024x1024',
      userId,
      extractedNoticiaId: dto.extractedNoticiaId
    });

    // 3. Create generation record
    const generation = await this.imageGenerationModel.create({
      prompt: enhancedPrompt,
      model: dto.model || 'gpt-image-1',
      quality: dto.quality || 'medium',
      size: dto.size || '1024x1024',
      brandingConfig: {
        watermarkText: 'NOTICIAS PACHUCA',
        watermarkPosition: 'bottom-right',
        includeDecorations: dto.includeDecorations || false,
        keywords: dto.keywords
      },
      extractedNoticiaId: dto.extractedNoticiaId,
      createdBy: userId,
      aiGenerated: true
    });

    // 4. Emit started event
    this.eventEmitter.emit('image-generation.started', {
      generationId: generation._id,
      jobId: job.id,
      userId
    });

    return generation;
  }

  /**
   * Process generation (called by queue worker)
   */
  async processGeneration(jobId: string, generationId: string): Promise<void> {
    const generation = await this.imageGenerationModel.findById(generationId);
    if (!generation) throw new NotFoundException('Generation not found');

    try {
      // 1. Get OpenAI provider
      const provider = await this.providerFactory.getProvider('openai');

      // 2. Generate image with AI
      const startTime = Date.now();
      const result = await provider.generateImage({
        prompt: generation.prompt,
        quality: generation.quality,
        size: generation.size
      });
      const generationTime = Date.now() - startTime;

      // Emit progress
      this.eventEmitter.emit('image-generation.progress', {
        jobId,
        generationId,
        step: 'generated',
        progress: 33
      });

      // 3. Post-process: optimize multi-format
      const processStartTime = Date.now();
      const processed = await this.imageBankProcessor.processAIGenerated({
        imageBuffer: result.imageBuffer,
        format: result.format,
        outlet: 'ai-generated',
        quality: generation.quality
      });
      const processingTime = Date.now() - processStartTime;

      // Emit progress
      this.eventEmitter.emit('image-generation.progress', {
        jobId,
        generationId,
        step: 'optimized',
        progress: 66
      });

      // 4. Upload to S3/CDN
      const s3BaseKey = await this.imageBankProcessor.generateS3BaseKey({
        outlet: 'ai-generated',
        imageId: generation._id.toString()
      });

      const uploadedUrls = await this.imageBankProcessor.uploadToS3({
        processedImages: processed,
        s3BaseKey
      });

      // Emit progress
      this.eventEmitter.emit('image-generation.progress', {
        jobId,
        generationId,
        step: 'uploaded',
        progress: 100
      });

      // 5. Update generation record
      generation.generatedImageUrl = uploadedUrls.original;
      generation.cost = result.cost;
      generation.generationTime = generationTime;
      generation.processingTime = processingTime;
      generation.c2paIncluded = true;
      await generation.save();

      // 6. Emit completed event
      this.eventEmitter.emit('image-generation.completed', {
        jobId,
        generationId,
        generatedImageUrl: uploadedUrls.original,
        cost: result.cost
      });

      this.logger.log(`✓ Image generation completed: ${generationId}`);

    } catch (error) {
      this.logger.error(`✗ Image generation failed: ${error.message}`);

      // Emit failed event
      this.eventEmitter.emit('image-generation.failed', {
        jobId,
        generationId,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Store generated image in image bank
   */
  async storeInImageBank(generationId: string): Promise<ImageBank> {
    const generation = await this.imageGenerationModel.findById(generationId);
    if (!generation) throw new NotFoundException('Generation not found');
    if (!generation.generatedImageUrl) {
      throw new BadRequestException('Image not generated yet');
    }

    // Create ImageBank record
    const imageBank = await this.imageBankService.create({
      processedUrls: {
        original: generation.generatedImageUrl,
        // ... otros tamaños
      },
      keywords: generation.brandingConfig.keywords || [],
      outlet: 'ai-generated',
      extractedNoticiaId: generation.extractedNoticiaId,
      sourceUrl: 'ai-generated',
      quality: generation.quality,
      isActive: true,
      metadataRemoved: true,
      aiGenerated: true,
      c2paIncluded: generation.c2paIncluded
    });

    // Update generation with bank reference
    generation.imageBankId = imageBank._id;
    await generation.save();

    return imageBank;
  }
}
```

### BrandingService

```typescript
// Nuevo: api-nueva/src/content-ai/services/branding.service.ts

@Injectable()
export class BrandingService {

  /**
   * Build enhanced prompt with branding instructions
   */
  async buildPrompt(options: BrandingOptions): Promise<string> {
    const {
      basePrompt,
      watermarkText,
      includeDecorations,
      keywords
    } = options;

    let enhancedPrompt = basePrompt;

    // Add watermark instruction
    enhancedPrompt += `\n\nInclude '${watermarkText}' watermark in the bottom-right corner.`;
    enhancedPrompt += `\nWatermark style: subtle, semi-transparent, professional news style.`;
    enhancedPrompt += `\nBrand colors: vibrant yellow (#f1ef47) and black.`;

    // Add decorative elements if requested
    if (includeDecorations && keywords && keywords.length > 0) {
      enhancedPrompt += `\n\nOptionally include subtle decorative banners with keywords: ${keywords.slice(0, 3).join(', ')}.`;
      enhancedPrompt += `\nKeep text minimal (max 20% of image) to avoid social media penalties.`;
    }

    // Professional constraints
    enhancedPrompt += `\n\nIMPORTANT CONSTRAINTS:`;
    enhancedPrompt += `\n- Maintain professional journalism standards`;
    enhancedPrompt += `\n- Do not add waterdrops or excessive decorative elements`;
    enhancedPrompt += `\n- Keep branding subtle and tasteful`;
    enhancedPrompt += `\n- Preserve the essence and composition of the original concept`;

    return enhancedPrompt.trim();
  }

  /**
   * Validate generated image has proper branding
   */
  async validateBranding(imageBuffer: Buffer): Promise<BrandingValidation> {
    // Use GPT-4o vision to validate branding
    // (Implementar validación con vision API)

    return {
      hasWatermark: true,
      textPercentage: 15,
      brandingQuality: 'good',
      recommendations: []
    };
  }
}
```

---

## 📅 PLAN DE IMPLEMENTACIÓN POR FASES

### FASE 1: Backend - OpenAI Adapter Extension
**Duración estimada**: 1 día
**Agentes**: backend-architect

#### Tareas:
- [ ] 1.1 - Extender `OpenAIAdapter` con método `generateImage()`
- [ ] 1.2 - Extender `OpenAIAdapter` con método `editImage()`
- [ ] 1.3 - Agregar `calculateImageCost()` privado
- [ ] 1.4 - Actualizar interface `IAIProviderAdapter` con métodos de imagen
- [ ] 1.5 - Build del backend: `yarn build`

**Entregables**:
- Adapter extendido con generación de imágenes
- Tracking de costos implementado
- Build exitoso

---

### FASE 2: Backend - Core Services
**Duración estimada**: 2 días
**Agentes**: backend-architect

#### Tareas:
- [ ] 2.1 - Crear schema `ImageGeneration` con todos los campos
- [ ] 2.2 - Crear indexes en MongoDB (model, quality, createdAt, createdBy)
- [ ] 2.3 - Crear `BrandingService` con `buildPrompt()` y `validateBranding()`
- [ ] 2.4 - Crear `ImageGenerationService` con CRUD completo
- [ ] 2.5 - Implementar `generateNewsImage()` método principal
- [ ] 2.6 - Implementar `processGeneration()` para queue worker
- [ ] 2.7 - Implementar `storeInImageBank()` integración
- [ ] 2.8 - Build del backend: `yarn build`

**Entregables**:
- Schema completo con indexes
- BrandingService funcional
- ImageGenerationService completo
- Build exitoso

---

### FASE 3: Backend - Queue & Events
**Duración estimada**: 1-2 días
**Agentes**: backend-architect

#### Tareas:
- [ ] 3.1 - Configurar Bull Queue `image-generation`
- [ ] 3.2 - Crear `ImageGenerationQueueService`
- [ ] 3.3 - Crear `image-generation.processor.ts` con jobs
- [ ] 3.4 - Implementar job `generate-single-image`
- [ ] 3.5 - Implementar job `generate-batch-images`
- [ ] 3.6 - Crear eventos con EventEmitter2:
  - `image-generation.started`
  - `image-generation.progress`
  - `image-generation.completed`
  - `image-generation.failed`
- [ ] 3.7 - Integrar eventos con Socket.IO gateway
- [ ] 3.8 - Build del backend: `yarn build`

**Entregables**:
- Queue system funcionando
- Eventos en tiempo real
- Socket integration
- Build exitoso

---

### FASE 4: Backend - API & Controllers
**Duración estimada**: 1 día
**Agentes**: backend-architect

#### Tareas:
- [ ] 4.1 - Crear DTOs de request/response con validación
- [ ] 4.2 - Crear `ImageGenerationController` con endpoints
- [ ] 4.3 - Endpoint `POST /generate` con validación
- [ ] 4.4 - Endpoint `GET /:id` para obtener generación
- [ ] 4.5 - Endpoint `GET /job/:jobId/status` para tracking
- [ ] 4.6 - Endpoint `POST /:id/store-in-bank` para almacenar
- [ ] 4.7 - Endpoint `GET /stats` para estadísticas
- [ ] 4.8 - Documentación Swagger completa
- [ ] 4.9 - Build del backend: `yarn build`

**Entregables**:
- API REST completa
- Swagger docs actualizados
- Validación implementada
- Build exitoso

---

### FASE 5: Backend - Image Bank Integration
**Duración estimada**: 1 día
**Agentes**: backend-architect

#### Tareas:
- [ ] 5.1 - Extender `ImageBankProcessorService` con `processAIGenerated()`
- [ ] 5.2 - Agregar flag `aiGenerated: boolean` a schema ImageBank
- [ ] 5.3 - Agregar flag `c2paIncluded: boolean` a schema
- [ ] 5.4 - Modificar S3 key pattern para AI images: `ai-generated/{year}/{month}/{id}/`
- [ ] 5.5 - Implementar metadata especial para AI images
- [ ] 5.6 - Build del backend: `yarn build`

**Entregables**:
- ImageBank con soporte AI
- Metadata compliance
- Build exitoso

---

### FASE 6: Frontend - Types & API Client
**Duración estimada**: 1 día
**Agentes**: frontend-developer

#### Tareas:
- [ ] 6.1 - Crear `image-generation.types.ts` (API y App namespaces)
- [ ] 6.2 - Definir interfaces: `ImageGeneration`, `GenerationConfig`, `BrandingOptions`
- [ ] 6.3 - Crear `imageGenerationApi.ts` con getRawClient pattern
- [ ] 6.4 - Implementar métodos API:
  - `generateImage()`
  - `getGenerationById()`
  - `getJobStatus()`
  - `storeInBank()`
  - `getStats()`
- [ ] 6.5 - Crear mappers API → App (camelCase)

**Entregables**:
- Types completos
- API client funcional
- Mappers implementados

---

### FASE 7: Frontend - Hooks
**Duración estimada**: 1 día
**Agentes**: frontend-developer

#### Tareas:
- [ ] 7.1 - Crear `useImageGeneration.ts` mutation hook
- [ ] 7.2 - Crear `useGenerationById.ts` query hook
- [ ] 7.3 - Crear `useImageGenerationLogs.ts` socket hook (patrón useExtractionLogs)
- [ ] 7.4 - Implementar socket listeners:
  - `image-generation:started`
  - `image-generation:progress`
  - `image-generation:completed`
  - `image-generation:failed`
- [ ] 7.5 - Crear `useStoreInBank.ts` mutation hook

**Entregables**:
- Hooks de React Query funcionando
- Socket integration en tiempo real
- State management correcto

---

### FASE 8: Frontend - UI Components
**Duración estimada**: 2 días
**Agentes**: frontend-developer, ui-ux-designer

#### Tareas:
- [ ] 8.1 - Crear `GenerateImageModal.tsx` (modal de configuración)
  - Input para prompt custom
  - Dropdown de quality (low/medium/high con costos)
  - Toggle para decoraciones
  - Preview de branding
- [ ] 8.2 - Crear `BrandingOptions.tsx` component
  - Keywords selector para cintillos
  - Preview de watermark
- [ ] 8.3 - Crear `GenerationProgress.tsx` component
  - Progress bar 0-100%
  - Logs en tiempo real (reutilizar LogList)
  - Cost indicator
- [ ] 8.4 - Crear `GeneratedImagePreview.tsx` component
  - Hero image display
  - Botones: "Almacenar", "Regenerar", "Cancelar"
  - Metadata display
- [ ] 8.5 - Diseño UX completo (brand color #f1ef47)

**Entregables**:
- Componentes UI completos
- UX clara y fluida
- Diseño consistente con app

---

### FASE 9: Frontend - Image Detail Integration
**Duración estimada**: 1 día
**Agentes**: frontend-developer

#### Tareas:
- [ ] 9.1 - Modificar `image-detail/[id].tsx`
- [ ] 9.2 - Agregar botón "Generar con IA" en actions
- [ ] 9.3 - Mostrar GenerateImageModal al presionar
- [ ] 9.4 - Navegar a result screen tras generación
- [ ] 9.5 - Crear `image-generation/result.tsx` screen
- [ ] 9.6 - Implementar preview de imagen generada
- [ ] 9.7 - Integrar progress tracking en tiempo real
- [ ] 9.8 - Implementar botón "Almacenar en banco"

**Entregables**:
- Integración completa en image detail
- Result screen funcional
- Navegación correcta

---

### FASE 10: Frontend - Batch Generation (Opcional)
**Duración estimada**: 1 día
**Agentes**: frontend-developer

#### Tareas:
- [ ] 10.1 - Agregar botón "Generar IA (batch)" en multi-select
- [ ] 10.2 - Modal de configuración batch
- [ ] 10.3 - Progress tracking de múltiples jobs
- [ ] 10.4 - Lista de resultados con preview
- [ ] 10.5 - Acción bulk "Almacenar todos"

**Entregables**:
- Batch generation funcional
- Multi-job tracking
- Bulk actions

---

### FASE 11: Testing & Documentation
**Duración estimada**: 1 día
**Agentes**: backend-architect, frontend-developer

#### Tareas:
- [ ] 11.1 - Testing manual de flujo completo
- [ ] 11.2 - Verificar compliance (AI labels, C2PA metadata)
- [ ] 11.3 - Documentación de API (Swagger completo)
- [ ] 11.4 - Documentación de componentes frontend
- [ ] 11.5 - Guía de usuario con screenshots
- [ ] 11.6 - Documentación de costos y límites
- [ ] 11.7 - Build final del backend: `yarn build`
- [ ] 11.8 - Verificación de producción

**Entregables**:
- Feature completamente probado
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

6. **PROHIBIDO levantar servidores en implementación**
   - Backend: solo `yarn build`
   - Frontend: NO hacer `yarn start` ni dev servers

7. **PROHIBIDO usar React.forwardRef**
   - Usar componentes funcionales simples
   - Seguir patterns de react-native-reusables

### Requerimientos

1. **Usar agentes especializados**
   - backend-architect: Backend tasks
   - frontend-developer: Frontend mobile tasks
   - ui-ux-designer: Diseño y UX

2. **Marcar tareas completadas**
   - Actualizar checklist inmediatamente
   - No batchear completions

3. **Build al final de cada fase backend**
   - Fases 1, 2, 3, 4, 5, 11: `yarn build` obligatorio
   - Reportar errores antes de continuar

4. **Validar con usuario**
   - Al final de cada fase: mostrar progreso
   - Esperar luz verde para siguiente fase

5. **Etiquetar imágenes AI**
   - TODAS las imágenes generadas deben tener flag `aiGenerated: true`
   - Metadata C2PA debe preservarse
   - UI debe mostrar claramente "AI-Generated"

---

## 🚨 RIESGOS Y MITIGACIONES

### Riesgo 1: Costos OpenAI fuera de control
**Impacto**: ALTO - Financiero
**Probabilidad**: MEDIA

**Mitigación**:
- Implementar límites de uso diario/mensual
- Dashboard de monitoreo de costos en tiempo real
- Alertas cuando se excede presupuesto
- Quality routing automático (low para pruebas)
- Considerar ChatGPT Plus para volumen alto ($20/mes unlimited)

### Riesgo 2: Imágenes AI usadas como fotoperiodismo
**Impacto**: CRÍTICO - Ética/Reputación
**Probabilidad**: MEDIA

**Mitigación**:
- Etiquetado "AI-Generated" OBLIGATORIO en UI
- Flag `aiGenerated: true` en toda la cadena
- Preservar metadata C2PA
- Guías editoriales claras para usuarios
- Revisión editorial antes de publicación
- Training de equipo sobre ética AI

### Riesgo 3: Watermark no visible o removible
**Impacto**: MEDIO - Branding
**Probabilidad**: BAJA

**Mitigación**:
- Prompt-based watermarking (integrado en imagen)
- Validación post-generación con vision API
- Fallback a post-processing overlay si falla
- Monitoreo manual de primeras 100 imágenes
- Iteración de prompts según resultados

### Riesgo 4: Generación lenta (> 30s)
**Impacto**: MEDIO - UX
**Probabilidad**: MEDIA

**Mitigación**:
- Queue asíncrono (usuario no espera bloqueado)
- Progress tracking en tiempo real
- Socket notifications al completar
- Procesamiento paralelo de tamaños
- CDN upload paralelo

### Riesgo 5: Copyright de imágenes base
**Impacto**: ALTO - Legal
**Probabilidad**: BAJA

**Mitigación**:
- OpenAI garantiza derechos comerciales
- Documentar prompts usados
- Mantener metadata C2PA (proof of AI origin)
- No solicitar estilos de artistas específicos
- Compliance con políticas OpenAI

### Riesgo 6: API OpenAI down
**Impacto**: MEDIO - Disponibilidad
**Probabilidad**: BAJA

**Mitigación**:
- ProviderFactoryService con failover
- Considerar DALL-E 3 como backup
- Queue retry con exponential backoff
- Health checks de provider
- Mensajes de error claros al usuario

### Riesgo 7: Imágenes generadas de baja calidad
**Impacto**: MEDIO - UX/Reputación
**Probabilidad**: MEDIA

**Mitigación**:
- Quality tier por defecto: medium
- Preview antes de almacenar (usuario decide)
- Botón "Regenerar" disponible
- Iteración de prompts según feedback
- Validación de branding automática

---

## 📊 ESTIMACIÓN TOTAL

**Tiempo total estimado**: 10-14 días
**Sprints**: 2 sprints de 1 semana

**Desglose**:
- Backend (Fases 1-5): 6-8 días
- Frontend (Fases 6-10): 4-5 días
- Testing & Docs (Fase 11): 1 día

**Recursos**:
- 1 Backend Developer (con backend-architect agent)
- 1 Frontend Developer (con frontend-developer agent)
- UX Designer (ui-ux-designer agent)

---

## ✅ CRITERIOS DE ACEPTACIÓN

### Backend
- [ ] OpenAIAdapter extendido con `generateImage()` y `editImage()`
- [ ] ImageGenerationService completo y funcional
- [ ] BrandingService generando prompts correctos
- [ ] Queue processing < 15s por imagen (medium quality)
- [ ] Socket events en tiempo real funcionando
- [ ] API documentada en Swagger
- [ ] Integración con ImageBank funcionando
- [ ] C2PA metadata preservada
- [ ] Tracking de costos implementado
- [ ] Build exitoso: `yarn build`

### Frontend
- [ ] Botón "Generar con IA" visible en image detail
- [ ] Modal de configuración completo (prompt, quality, branding)
- [ ] Progress tracking en tiempo real (socket)
- [ ] Preview de imagen generada funcional
- [ ] Botón "Almacenar en banco" funcionando
- [ ] Etiqueta "AI-Generated" visible
- [ ] Cost indicator mostrado
- [ ] Navegación fluida entre screens

### Compliance & Ética
- [ ] TODAS las imágenes AI tienen flag `aiGenerated: true`
- [ ] Metadata C2PA preservada en pipeline
- [ ] Etiqueta "AI-Generated" visible en UI
- [ ] Guías editoriales documentadas
- [ ] Prompts documentados para auditoría
- [ ] Límites de uso configurados

### Performance & Costos
- [ ] Generación medium quality < 15s
- [ ] Post-processing (formatos) < 10s
- [ ] Upload a S3 < 5s
- [ ] Total end-to-end < 30s
- [ ] Dashboard de costos funcional
- [ ] Alertas de presupuesto configuradas

---

## 💰 PRESUPUESTO APROBADO

### Costos OpenAI (Mensual)

**Modelo**: `gpt-image-1` calidad **medium**
**Costo por imagen**: $0.04

**Volumen planificado**: 50 imágenes/día
```
50 × $0.04 × 30 días = $60/mes
Total: ~1,500 imágenes/mes
```

### Costos de Infraestructura

**S3 Storage** (imágenes AI):
```
1,500 imágenes/mes × 12 archivos × 500KB promedio = 9GB
S3: $0.023/GB = $0.21/mes
```

**CloudFront CDN**:
```
2GB transfer/mes = $0.17/mes
```

**Bull Queue / Redis**:
```
Ya incluido en infraestructura actual
```

### Total Aprobado

```
OpenAI API (gpt-image-1 medium):  $60.00/mes
S3 Storage (9GB):                  $0.21/mes
CDN Transfer (2GB):                $0.17/mes
--------------------------------------------------
TOTAL MENSUAL:                    $60.38/mes
```

**ROI Esperado**:
- Ahorro vs fotógrafos freelance: $500-800/mes
- Ahorro vs stock photos: $150-300/mes
- Incremento engagement social media: 15-20%
- Tiempo ahorrado editorial: 8-12 hrs/semana

---

## 📚 REFERENCIAS

### Documentación OpenAI
- gpt-image-1 API: https://platform.openai.com/docs/guides/image-generation
- Pricing: https://openai.com/api/pricing/
- Usage Policies: https://openai.com/policies/creating-images-and-videos-in-line-with-our-policies/
- C2PA Metadata: https://c2pa.org/

### Documentación Técnica Externa
- Sharp: https://sharp.pixelplumbing.com/
- Bull: https://docs.bullmq.io/
- EventEmitter2: https://github.com/EventEmitter2/EventEmitter2
- expo-image: https://docs.expo.dev/versions/latest/sdk/image/

### Investigación Académica
- Leiden University (2025): "Guidelines for AI-generated images in journalism"
- MIT Technology Review (2025): "OpenAI's gpt-image-1 for practical design"

### Código Existente Reutilizable
- OpenAIAdapter: `/api-nueva/src/content-ai/adapters/openai.adapter.ts`
- ImageBankProcessorService: `/api-nueva/src/image-bank/services/image-bank-processor.service.ts`
- ProviderFactoryService: `/api-nueva/src/content-ai/services/provider-factory.service.ts`
- ContentGenerationQueueService: `/api-nueva/src/content-ai/services/content-generation-queue.service.ts`
- useExtractionLogs: `/mobile-expo/src/hooks/useExtractionLogs.ts`
- OptimizedImage: `/public-noticias/src/components/OptimizedImage.tsx`

---

**Documento creado**: 2025-10-10
**Última actualización**: 2025-10-10 (v1.0)
**Autor**: AI Assistant (Jarvis) + Coyotito
**Estado**: ✅ APROBADO - Listo para implementación

---

## 🎯 SIGUIENTE PASO

**INICIAR FASE 1: Backend - OpenAI Adapter Extension**

Comenzar con la extensión del `OpenAIAdapter` existente para agregar capacidades de generación de imágenes con `gpt-image-1`.
