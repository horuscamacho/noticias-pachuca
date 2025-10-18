# 📰 Análisis: Flujo de Publicación de Contenido Generado con IA

**Fecha de Análisis**: 16 de Octubre, 2025
**Autor**: Jarvis (Claude Code)
**Objetivo**: Implementar pantalla de publicación multi-sitio + redes sociales para contenido generado por IA desde mobile-expo

---

## 📋 TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#-resumen-ejecutivo)
2. [Estado Actual del Sistema](#-1-estado-actual-del-sistema)
3. [Hallazgos: Lo que Existe vs Lo que se Necesita](#-2-hallazgos-lo-que-existe-vs-lo-que-se-necesita)
4. [Flujo Actual de Generación y Publicación](#-3-flujo-actual-de-generacion-y-publicacion)
5. [Flujo Deseado de Publicación](#-4-flujo-deseado-de-publicacion)
6. [Patrones de Implementación](#-5-patrones-de-implementacion)
7. [Fases de Implementación](#-6-fases-de-implementacion)
8. [Síntesis Ejecutiva de Fases](#-7-sintesis-ejecutiva-de-fases)

---

## 🎯 RESUMEN EJECUTIVO

### **PROBLEMA IDENTIFICADO**

Actualmente, el sistema tiene toda la infraestructura para:
- ✅ Generar contenido con IA (títulos, contenido, copys de Facebook/Twitter)
- ✅ Publicar en múltiples sitios
- ✅ Publicar en redes sociales (Facebook y Twitter via GetLate.dev)
- ✅ Programar publicaciones según tipo (breaking news, noticia normal, blog)

**PERO NO HAY INTERFAZ MOBILE** para que el usuario pueda:
- ❌ Seleccionar a qué sitio(s) publicar el contenido generado
- ❌ Elegir el tipo de publicación (breaking news, noticia normal, blog)
- ❌ Decidir si publicar automáticamente en redes sociales
- ❌ Ver si un contenido ya fue publicado
- ❌ Mejorar el copy con un agente antes de publicar en redes sociales

### **SOLUCIÓN PROPUESTA**

Crear una nueva pantalla de publicación en mobile-expo (`/generated/[id]/publish`) que permita:

1. **Seleccionar sitios** donde publicar (multi-selector)
2. **Elegir tipo de publicación** (breaking news, noticia normal, blog) con radio buttons
3. **Opción de publicar en redes sociales** con switch
4. **Mejorar copy automáticamente** antes de publicar con agente especializado
5. **Ver estado de publicación** en la card de contenido generado
6. **Tracking de publicación** (en qué sitios está publicado, en qué redes sociales)

---

## 🔍 1. ESTADO ACTUAL DEL SISTEMA

### 1.1. Backend (api-nueva)

#### **✅ Schemas Existentes**

**`AIContentGeneration` Schema** (`ai-content-generation.schema.ts`)
```typescript
@Schema({ timestamps: true })
export class AIContentGeneration {
  @Prop({ type: Types.ObjectId, ref: 'ExtractedNoticia' })
  originalContentId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ContentAgent', required: true })
  agentId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  generatedTitle: string;

  @Prop({ required: true })
  generatedContent: string;

  @Prop({ type: [String], default: [] })
  generatedKeywords: string[];

  @Prop({ type: [String], default: [] })
  generatedTags: string[];

  @Prop({ trim: true })
  generatedCategory?: string;

  @Prop({ trim: true })
  generatedSummary?: string;

  // 📱 COPY DE REDES SOCIALES (YA GENERADO)
  @Prop({ type: Object })
  socialMediaCopies?: {
    facebook?: {
      hook: string;
      copy: string;
      emojis: string[];
      hookType: 'Scary' | 'FreeValue' | 'Strange' | 'Sexy' | 'Familiar';
      estimatedEngagement: 'high' | 'medium' | 'low';
    };
    twitter?: {
      tweet: string;
      hook: string;
      emojis: string[];
      hookType: string;
      threadIdeas: string[];
    };
  };

  // Estado de generación
  @Prop({ enum: ['pending', 'generating', 'completed', 'failed'], default: 'pending' })
  status: string;

  // 📊 METADATA DE GENERACIÓN
  @Prop({ type: Object, required: true })
  generationMetadata: {
    model: string;
    totalTokens: number;
    cost: number;
    processingTime: number;
  };

  // 🔗 INFORMACIÓN DE PUBLICACIÓN (SE ACTUALIZA AL PUBLICAR)
  @Prop({ type: Object })
  publishingInfo?: {
    publishedAt?: Date;
    platform?: string;
    url?: string;
  };
}
```

**`PublishedNoticia` Schema** (`published-noticia.schema.ts`)
```typescript
@Schema({ timestamps: true })
export class PublishedNoticia {
  @Prop({ type: Types.ObjectId, ref: 'AIContentGeneration', required: true, unique: true })
  contentId: Types.ObjectId; // Relación 1:1 con contenido generado

  // 🌐 MULTI-SITIO (YA IMPLEMENTADO)
  @Prop({ type: [Types.ObjectId], ref: 'Site', default: [], index: true })
  sites: Types.ObjectId[]; // Array de sitios donde está publicada

  @Prop({ required: true })
  slug: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category: Types.ObjectId;

  // 🆕 TIPO DE CONTENIDO (YA IMPLEMENTADO)
  @Prop({
    enum: ['breaking_news', 'normal_news', 'blog', 'evergreen'],
    default: 'normal_news',
    index: true,
  })
  contentType: 'breaking_news' | 'normal_news' | 'blog' | 'evergreen';

  // 📱 TRACKING DE REDES SOCIALES (YA IMPLEMENTADO)
  @Prop({ type: Object, default: {} })
  socialMediaPublishing?: {
    facebook?: Array<{
      pageId: string;
      pageName?: string;
      postId?: string;
      postUrl?: string;
      publishedAt?: Date;
      status: 'pending' | 'published' | 'failed';
      errorMessage?: string;
      engagement?: {
        likes?: number;
        comments?: number;
        shares?: number;
      };
    }>;

    twitter?: Array<{
      accountId: string;
      username?: string;
      tweetId?: string;
      tweetUrl?: string;
      publishedAt?: Date;
      status: 'pending' | 'published' | 'failed';
      errorMessage?: string;
      engagement?: {
        likes?: number;
        retweets?: number;
        replies?: number;
      };
    }>;
  };

  @Prop({ type: Object })
  socialMediaCopies?: {
    facebook?: { hook: string; copy: string; emojis: string[] };
    twitter?: { tweet: string; hook: string; emojis: string[] };
  };

  @Prop({ enum: ['draft', 'scheduled', 'published', 'unpublished'], default: 'published' })
  status: string;
}

// Índice único compuesto (mismo slug puede existir en diferentes sitios)
PublishedNoticiaSchema.index({ sites: 1, slug: 1 }, { unique: true });
```

---

#### **✅ DTOs Existentes**

**`PublishNoticiaDto`** (`publish-noticia.dto.ts`)
```typescript
export class PublishNoticiaDto {
  @IsMongoId()
  contentId: string; // ID del AIContentGeneration

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

  // 🌐 MULTI-SITIO (YA IMPLEMENTADO)
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  siteIds?: string[]; // Array de IDs de sitios donde publicar

  // 📱 REDES SOCIALES (YA IMPLEMENTADO)
  @IsOptional()
  @IsBoolean()
  publishToSocialMedia?: boolean; // Habilitar publicación en redes sociales

  @IsOptional()
  @IsArray()
  @IsIn(['facebook', 'twitter'], { each: true })
  socialMediaPlatforms?: ('facebook' | 'twitter')[];

  @IsOptional()
  @IsBoolean()
  optimizeSocialContent?: boolean; // Optimizar contenido para cada plataforma
}
```

**`SchedulePublicationDto`** (`schedule-publication.dto.ts`)
```typescript
export class SchedulePublicationDto {
  @IsMongoId()
  contentId: string;

  // 🔴 TIPO DE PUBLICACIÓN (YA IMPLEMENTADO)
  @IsEnum(['breaking', 'news', 'blog'])
  publicationType: 'breaking' | 'news' | 'blog';

  @IsBoolean()
  useOriginalImage: boolean;

  @IsOptional()
  @IsUrl()
  customImageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsDateString()
  manualScheduleAt?: Date; // Programación manual
}
```

---

#### **✅ Services Existentes**

**`PublishService.publishNoticia()`** (`publish.service.ts`)
```typescript
async publishNoticia(dto: PublishNoticiaDto): Promise<PublishedNoticiaDocument> {
  // 1️⃣ Validar que no exista noticia publicada con ese contentId
  const existingPublished = await this.publishedNoticiaModel.findOne({
    contentId: dto.contentId,
  });

  if (existingPublished) {
    throw new BadRequestException('Esta noticia ya está publicada');
  }

  // 2️⃣ Determinar sitios donde publicar
  let siteIds: string[];
  if (dto.siteIds && dto.siteIds.length > 0) {
    siteIds = dto.siteIds;
  } else {
    const mainSite = await this.siteDetectionService.getMainSite();
    siteIds = [mainSite.id];
  }

  // 3️⃣ Obtener contenido generado
  const generatedContent = await this.aiContentModel.findById(dto.contentId)
    .populate('originalContentId')
    .populate('agentId');

  // 4️⃣ Generar slug único
  const slug = await this.slugGenerator.generateUniqueSlug(
    generatedContent.generatedTitle,
    siteIds
  );

  // 5️⃣ Procesar imágenes (opcional)
  let featuredImage = null;
  if (dto.useOriginalImage || dto.customImageUrl) {
    featuredImage = await this.imageProcessor.processAndUploadImage(...);
  }

  // 6️⃣ Crear registro PublishedNoticia
  const publishedNoticia = new this.publishedNoticiaModel({
    contentId: generatedContent._id,
    slug,
    title: generatedContent.generatedTitle,
    content: generatedContent.generatedContent,
    sites: siteObjectIds, // 🌐 Multi-sitio
    category: generatedContent.generatedCategory,
    socialMediaCopies: generatedContent.socialMediaCopies,
    status: 'published',
    // ... más campos
  });

  await publishedNoticia.save();

  // 7️⃣ 📱 Publicar en redes sociales (si está habilitado)
  if (dto.publishToSocialMedia) {
    const socialMediaResult = await this.socialMediaPublishingService.publishToSocialMedia(
      publishedNoticia,
      siteObjectIds,
      {
        platforms: dto.socialMediaPlatforms || ['facebook', 'twitter'],
        optimizeContent: dto.optimizeSocialContent !== false,
      }
    );

    // Actualizar tracking
    publishedNoticia.socialMediaPublishing = {
      facebook: socialMediaResult.facebook.results.map(...),
      twitter: socialMediaResult.twitter.results.map(...),
    };

    await publishedNoticia.save();
  }

  return publishedNoticia;
}
```

**`SocialMediaPublishingService.publishToSocialMedia()`** (`social-media-publishing.service.ts`)
```typescript
async publishToSocialMedia(
  noticia: any,
  siteIds: Types.ObjectId[],
  options: PublishingOptions = {}
): Promise<SocialMediaPublishingResult> {
  const { platforms = ['facebook', 'twitter'], optimizeContent = true } = options;

  const allFacebookResults: FacebookPublishResult[] = [];
  const allTwitterResults: TwitterPublishResult[] = [];

  // Publicar en cada sitio
  for (const siteId of siteIds) {
    const site = await this.siteModel.findById(siteId);
    if (!site || !site.isActive) continue;

    // Publicar en Facebook si está habilitado
    if (platforms.includes('facebook')) {
      const facebookResults = await this.publishToFacebook(noticia, site, scheduledAt, optimizeContent);
      allFacebookResults.push(...facebookResults);
    }

    // Publicar en Twitter si está habilitado
    if (platforms.includes('twitter')) {
      const twitterResults = await this.publishToTwitter(noticia, site, scheduledAt, optimizeContent);
      allTwitterResults.push(...twitterResults);
    }
  }

  return {
    facebook: { total, successful, failed, results: allFacebookResults },
    twitter: { total, successful, failed, results: allTwitterResults },
    summary: { totalPlatforms, totalPublished, totalFailed, successRate },
  };
}
```

---

#### **✅ Endpoints Existentes**

**`PachucaNoticiasController`** (`pachuca-noticias.controller.ts`)

```typescript
// 1️⃣ Publicación directa (inmediata)
@Post('publish')
@UseGuards(PublishingRateLimitGuard)
async publishNoticia(@Body(ValidationPipe) dto: PublishNoticiaDto) {
  const noticia = await this.publishService.publishNoticia(dto);
  return { success: true, message: 'Noticia publicada exitosamente', data: noticia };
}

// 2️⃣ Publicación programada (cola inteligente)
@Post('schedule')
@UseGuards(QueueLimitGuard)
async schedulePublication(@Body(ValidationPipe) dto: SchedulePublicationDto) {
  const result = await this.queueService.schedulePublication(dto);

  // Si es breaking, publica inmediatamente
  if ('slug' in result) {
    return { success: true, message: 'Noticia publicada inmediatamente (breaking news)', type: 'published' };
  }

  // Si es news/blog, programa en cola
  return { success: true, message: 'Publicación programada exitosamente', type: 'scheduled' };
}
```

---

### 1.2. Frontend Mobile (mobile-expo)

#### **✅ Pantallas Existentes**

**Pantalla de lista de contenido generado** (`/generated/index.tsx`)
- Lista todos los contenidos generados por IA
- Usa `GeneratedContentCard` para cada item
- Permite navegar a detalle del contenido

**Pantalla de detalle de contenido generado** (`/generated/[id].tsx`)
- Muestra título, contenido completo, resumen
- Muestra copys de Facebook (hook, copy, emojis, engagement estimado)
- Muestra copys de Twitter (tweet, hook, emojis, thread ideas)
- Muestra keywords, tags, categoría
- Muestra metadata de generación (modelo, tokens, costo, tiempo)

**🔴 NO EXISTE**: Pantalla de publicación (`/generated/[id]/publish`)

---

#### **✅ Componentes UI Disponibles**

**Sistema de Diseño** (`components/ui/`)
```typescript
// Select con modal (dropdown)
<Select
  value={selectedValue}
  onValueChange={(value) => setSelectedValue(value)}
  options={[
    { label: 'Opción 1', value: 'opt1' },
    { label: 'Opción 2', value: 'opt2' },
  ]}
  placeholder="Seleccionar..."
/>

// Textarea
<Textarea
  value={text}
  onChangeText={setText}
  placeholder="Escribe aquí..."
  maxLength={500}
/>

// Card, CardHeader, CardTitle, CardDescription, CardContent
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descripción</CardDescription>
  </CardHeader>
  <CardContent>Contenido</CardContent>
</Card>

// Badge
<Badge variant="default">Badge</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>

// Button
<Button onPress={handlePress}>
  <ThemedText>Texto</ThemedText>
</Button>

// Switch
<Switch value={enabled} onValueChange={setEnabled} />

// Checkbox
<Checkbox checked={checked} onCheckedChange={setChecked} />

// Radio Group (no existe actualmente - NECESARIO CREAR)
```

**🔴 NO EXISTE**: Componente `RadioGroup` (necesario para seleccionar tipo de publicación)
**🔴 NO EXISTE**: Multi-select (versión modificada de `Select` para múltiples selecciones)

---

#### **✅ Hooks Existentes**

```typescript
// Obtener contenido generado por ID
const { data: content, isLoading } = useGeneratedContentById(id);

// Obtener sitios disponibles
const { data: sites } = useSites({ isActive: true });

// Obtener stats
const { data: stats } = useStats();

// Social media (YA EXISTE - PERO VACÍO)
const { data: socialMediaAccounts } = useSocialMedia();
```

**🔴 NO EXISTE**: Hook `usePublishContent` para publicar contenido

---

## 🔍 2. HALLAZGOS: LO QUE EXISTE VS LO QUE SE NECESITA

### ✅ **LO QUE YA EXISTE (Backend)**

| Componente | Estado | Descripción |
|------------|--------|-------------|
| **Schema `AIContentGeneration`** | ✅ EXISTE | Contenido generado con copys de Facebook/Twitter |
| **Schema `PublishedNoticia`** | ✅ EXISTE | Noticia publicada con `sites[]`, `socialMediaPublishing`, `contentType` |
| **DTO `PublishNoticiaDto`** | ✅ EXISTE | Campos: `siteIds[]`, `publishToSocialMedia`, `socialMediaPlatforms[]` |
| **DTO `SchedulePublicationDto`** | ✅ EXISTE | Campo: `publicationType: 'breaking' \| 'news' \| 'blog'` |
| **Service `PublishService`** | ✅ EXISTE | Método `publishNoticia()` con soporte multi-sitio |
| **Service `SocialMediaPublishingService`** | ✅ EXISTE | Orquesta publicación en Facebook y Twitter via GetLate.dev |
| **Endpoint `POST /publish`** | ✅ EXISTE | Publicación directa (inmediata) |
| **Endpoint `POST /schedule`** | ✅ EXISTE | Publicación programada (cola inteligente) |
| **Sistema de cola** | ✅ EXISTE | Queue inteligente que ajusta horarios según tipo |

### ❌ **LO QUE NO EXISTE (Mobile)**

| Componente | Estado | Descripción |
|------------|--------|-------------|
| **Pantalla `/generated/[id]/publish`** | ❌ NO EXISTE | Pantalla para publicar contenido generado |
| **Multi-selector de sitios** | ❌ NO EXISTE | Componente para seleccionar múltiples sitios |
| **Radio buttons para tipo** | ❌ NO EXISTE | Selector de tipo (breaking news, noticia, blog) |
| **Hook `usePublishContent`** | ❌ NO EXISTE | Hook para publicar/programar contenido |
| **Indicador de publicación en card** | ❌ NO EXISTE | Badge o icono que muestre si ya está publicado |
| **Tracking de sitios publicados** | ❌ NO EXISTE | Visualización de en qué sitios está publicado |
| **Agente de mejorar copy** | ❌ NO INTEGRADO | No se ejecuta automáticamente antes de publicar |

### 🔄 **LO QUE NECESITA MEJORARSE**

| Componente | Estado Actual | Mejora Necesaria |
|------------|--------------|-----------------|
| **`GeneratedContentCard`** | Muestra metadata básica | Agregar badge "Publicado" si `publishingInfo.publishedAt` existe |
| **Flujo de copy mejorado** | El copy se genera al crear contenido | Agregar paso de "mejorar copy" antes de publicar en redes sociales |
| **URL de noticia en copy** | No se incluye automáticamente | Agregar URL canónica al copy de redes sociales |

---

## 🔄 3. FLUJO ACTUAL DE GENERACIÓN Y PUBLICACIÓN

### 3.1. Flujo de Generación (LO QUE YA FUNCIONA)

```
1. Usuario extrae noticia de un sitio competidor
   ↓
2. Usuario selecciona agente (Reportero, Columnista, etc.)
   ↓
3. Sistema genera contenido con IA:
   - Título generado
   - Contenido completo
   - Resumen
   - Keywords y Tags
   - Categoría
   - Copy de Facebook (hook, copy, emojis)
   - Copy de Twitter (tweet, hook, emojis, thread ideas)
   ↓
4. Se crea documento `AIContentGeneration` con status='completed'
   ↓
5. Usuario puede ver el contenido generado en `/generated/[id]`
```

### 3.2. Flujo de Publicación (SOLO BACKEND - NO HAY UI MOBILE)

```
OPCIÓN 1: Publicación Directa (Inmediata)
────────────────────────────────────────────
1. POST /pachuca-noticias/publish
   Body: {
     contentId: "...",
     siteIds: ["site1", "site2"],
     publishToSocialMedia: true,
     socialMediaPlatforms: ["facebook", "twitter"],
     useOriginalImage: true
   }
   ↓
2. PublishService.publishNoticia()
   - Genera slug único
   - Procesa imágenes
   - Crea PublishedNoticia con sites: [site1, site2]
   - Publica en Facebook pages de site1 y site2
   - Publica en Twitter accounts de site1 y site2
   - Actualiza socialMediaPublishing tracking
   ↓
3. Retorna noticia publicada


OPCIÓN 2: Publicación Programada (Cola)
────────────────────────────────────────────
1. POST /pachuca-noticias/schedule
   Body: {
     contentId: "...",
     publicationType: "breaking" | "news" | "blog",
     useOriginalImage: true
   }
   ↓
2. PublishingQueueService.schedulePublication()
   - Si es "breaking": publica inmediatamente
   - Si es "news" o "blog": agrega a cola inteligente
   - Calcula horario óptimo según tipo y cola actual
   ↓
3. Retorna:
   - Si breaking: noticia publicada
   - Si news/blog: item de cola programado
```

---

## 🎯 4. FLUJO DESEADO DE PUBLICACIÓN

### 4.1. Flujo Desde Mobile App

```
1. Usuario ve contenido generado en `/generated/[id]`
   ↓
2. Usuario presiona botón "Publicar" en la card superior
   ↓
3. Navega a nueva pantalla `/generated/[id]/publish`
   ↓
4. Pantalla de publicación muestra:

   ┌─────────────────────────────────────────────┐
   │  📰 Publicar Contenido                      │
   ├─────────────────────────────────────────────┤
   │                                             │
   │  Card Superior (Resumen)                    │
   │  ┌─────────────────────────────────────┐  │
   │  │ 💰 Costo: $0.0045                   │  │
   │  │ ⏱️ Tiempo: 12.5s                    │  │
   │  │ 🤖 Modelo: gpt-4o-mini              │  │
   │  │                                      │  │
   │  │        [Botón Publicar]              │  │ ← Este botón abre la nueva pantalla
   │  └─────────────────────────────────────┘  │
   │                                             │
   │  ────────── NUEVA PANTALLA ───────────────  │
   │                                             │
   │  Sección 1: Seleccionar Sitios              │
   │  ┌─────────────────────────────────────┐  │
   │  │ 🌐 ¿Dónde publicar?                 │  │
   │  │                                      │  │
   │  │ ☑ Noticias Pachuca (Principal)     │  │
   │  │ ☐ Tu Zona                           │  │
   │  │ ☐ Mitoteo                           │  │
   │  └─────────────────────────────────────┘  │
   │                                             │
   │  Sección 2: Tipo de Publicación             │
   │  ┌─────────────────────────────────────┐  │
   │  │ 📌 ¿Cómo publicar?                  │  │
   │  │                                      │  │
   │  │ ◉ Breaking News (inmediato)         │  │
   │  │ ○ Noticia Normal (cola inteligente) │  │
   │  │ ○ Blog Post (cola inteligente)      │  │
   │  └─────────────────────────────────────┘  │
   │                                             │
   │  Sección 3: Redes Sociales                  │
   │  ┌─────────────────────────────────────┐  │
   │  │ 📱 Publicar en redes sociales       │  │
   │  │ [ Switch activado ]                  │  │
   │  │                                      │  │
   │  │ Plataformas:                         │  │
   │  │ ☑ Facebook                          │  │
   │  │ ☑ Twitter                           │  │
   │  │                                      │  │
   │  │ ☑ Mejorar copy con IA antes de      │  │
   │  │   publicar                           │  │
   │  └─────────────────────────────────────┘  │
   │                                             │
   │  Sección 4: Imagen                          │
   │  ┌─────────────────────────────────────┐  │
   │  │ 🖼️ Imagen destacada                 │  │
   │  │                                      │  │
   │  │ ◉ Usar imagen original              │  │
   │  │ ○ Subir imagen personalizada        │  │
   │  └─────────────────────────────────────┘  │
   │                                             │
   │        [Cancelar]  [Publicar Ahora]         │
   │                                             │
   └─────────────────────────────────────────────┘

   ↓
5. Usuario presiona "Publicar Ahora"
   ↓
6. Sistema valida selecciones:
   - Al menos 1 sitio seleccionado
   - Tipo de publicación seleccionado
   ↓
7. Si "Mejorar copy con IA" está activado:
   - Llama a agente de "mejora de copy"
   - Agrega URL canónica al copy mejorado
   - Actualiza AIContentGeneration.socialMediaCopies
   ↓
8. Llama a endpoint correspondiente:
   - Si "Breaking News": POST /pachuca-noticias/publish
   - Si "Noticia" o "Blog": POST /pachuca-noticias/schedule
   ↓
9. Muestra resultado:
   - Success: "Publicado en X sitios"
   - Success: "Programado para publicación"
   - Error: Mensaje de error
   ↓
10. Actualiza card de contenido generado:
    - Muestra badge "Publicado"
    - Muestra sitios donde está publicado
    - Muestra redes sociales donde se publicó
```

### 4.2. Actualización de Card de Contenido Generado

**ANTES** (actual):
```
┌────────────────────────────────────────┐
│  📰 Migrantes encuentran trabajo...    │
│  🤖 Reportero • 12 Oct, 14:30          │
│  ────────────────────────────────────  │
│  Preview del contenido...              │
│                                        │
│  [gpt-4o-mini] [1,234 tokens]         │
│  [📱 Facebook] [🐦 Twitter]           │
│                                        │
│  Toca para ver completo →             │
└────────────────────────────────────────┘
```

**DESPUÉS** (mejorado):
```
┌────────────────────────────────────────┐
│  📰 Migrantes encuentran trabajo...    │
│  🤖 Reportero • 12 Oct, 14:30          │
│  ✅ Publicado en 2 sitios              │  ← NUEVO
│  ────────────────────────────────────  │
│  Preview del contenido...              │
│                                        │
│  [gpt-4o-mini] [1,234 tokens]         │
│  [📱 Facebook: 2] [🐦 Twitter: 2]     │  ← MEJORADO (muestra cantidad)
│                                        │
│  Toca para ver completo →             │
└────────────────────────────────────────┘
```

---

## 🛠️ 5. PATRONES DE IMPLEMENTACIÓN

### 5.1. Backend (No requiere cambios)

El backend ya tiene toda la funcionalidad necesaria:
- ✅ Multi-sitio (`siteIds[]`)
- ✅ Tipos de publicación (`publicationType`)
- ✅ Publicación en redes sociales (`publishToSocialMedia`, `socialMediaPlatforms[]`)
- ✅ Cola inteligente

**ÚNICO CAMBIO NECESARIO**: Crear endpoint/service para "mejorar copy" con agente

---

### 5.2. Frontend Mobile (Arquitectura)

#### **Patrón de Capas (YA ESTABLECIDO)**

```
┌─────────────────────────────────────────────────────┐
│  Capa 1: UI Components (Screens)                   │
│  app/(protected)/generated/[id]/publish.tsx         │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  Capa 2: Hooks (TanStack Query)                    │
│  hooks/usePublishContent.ts                         │
│  hooks/useImproveCopy.ts (NUEVO)                    │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  Capa 3: API Services                              │
│  services/publish/publishApi.ts (NUEVO)             │
│  services/content-ai/contentAiApi.ts                │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  Capa 4: Mappers                                   │
│  utils/mappers.ts                                   │
│  PublishRequestMapper.toAPI()                       │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  Capa 5: ApiClient (Singleton)                     │
│  services/api/ApiClient.ts                          │
└─────────────────────────────────────────────────────┘
```

---

### 5.3. Componentes Nuevos Necesarios

#### **1. MultiSelect Component**

```typescript
// components/ui/multi-select.tsx
interface MultiSelectProps {
  value: string[];  // Array de valores seleccionados
  onValueChange: (values: string[]) => void;
  options: SelectOption[];
  placeholder?: string;
}

export function MultiSelect({ value, onValueChange, options, placeholder }: MultiSelectProps) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <Pressable onPress={() => setModalVisible(true)}>
        <View>
          {value.length === 0 ? (
            <Text>{placeholder}</Text>
          ) : (
            <Text>{value.length} seleccionados</Text>
          )}
        </View>
      </Pressable>

      <Modal visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View>
          {options.map((option) => (
            <Checkbox
              key={option.value}
              checked={value.includes(option.value)}
              onCheckedChange={(checked) => {
                if (checked) {
                  onValueChange([...value, option.value]);
                } else {
                  onValueChange(value.filter(v => v !== option.value));
                }
              }}
              label={option.label}
            />
          ))}
        </View>
      </Modal>
    </>
  );
}
```

#### **2. RadioGroup Component**

```typescript
// components/ui/radio-group.tsx
interface RadioGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
}

export function RadioGroup({ value, onValueChange, options }: RadioGroupProps) {
  return (
    <View>
      {options.map((option) => (
        <Pressable
          key={option.value}
          onPress={() => onValueChange(option.value)}
          style={styles.radioOption}
        >
          <View style={styles.radioCircle}>
            {value === option.value && <View style={styles.radioSelected} />}
          </View>
          <View style={styles.radioLabel}>
            <ThemedText variant="body-medium">{option.label}</ThemedText>
            {option.description && (
              <ThemedText variant="body-small" color="secondary">
                {option.description}
              </ThemedText>
            )}
          </View>
        </Pressable>
      ))}
    </View>
  );
}
```

---

## 📋 6. FASES DE IMPLEMENTACIÓN

### **FASE 0: Preparación - Backend (Copy Improver Agent)**

**Objetivo**: Crear servicio/endpoint para mejorar copy con agente especializado

#### Tareas:

- [ ] **0.1**: Crear `CopyImproverService` en `content-ai`
  - Archivo: `packages/api-nueva/src/content-ai/services/copy-improver.service.ts`
  - Método `improveSocialMediaCopy(contentId, canonicalUrl)`:
    - Obtiene `AIContentGeneration` por ID
    - Extrae copys de Facebook y Twitter
    - Llama a agente "CopyImprover" con prompt especializado
    - Agrega URL canónica al copy mejorado
    - Actualiza `AIContentGeneration.socialMediaCopies`
    - Retorna copys mejorados

- [ ] **0.2**: Crear endpoint en `ContentAIController`
  - Archivo: `packages/api-nueva/src/content-ai/controllers/content-ai.controller.ts`
  - Endpoint: `POST /content-ai/improve-copy`
  - Body: `{ contentId: string, canonicalUrl?: string }`
  - Response: `{ facebook: {...}, twitter: {...} }`

- [ ] **0.3**: Build y test manual
  - `npm run build`
  - Test con Postman: `POST /content-ai/improve-copy`

---

### **FASE 1: Mobile - Componentes UI Base**

**Objetivo**: Crear componentes reutilizables necesarios

#### Tareas:

- [ ] **1.1**: Crear `MultiSelect` component
  - Archivo: `packages/mobile-expo/components/ui/multi-select.tsx`
  - Props: `value: string[]`, `onValueChange: (values: string[]) => void`, `options`
  - UI: Modal con checkboxes
  - Test: Crear pantalla de prueba

- [ ] **1.2**: Crear `RadioGroup` component
  - Archivo: `packages/mobile-expo/components/ui/radio-group.tsx`
  - Props: `value: string`, `onValueChange`, `options`
  - UI: Lista de opciones con radio buttons
  - Test: Crear pantalla de prueba

---

### **FASE 2: Mobile - Types y API Services**

**Objetivo**: Crear types, mappers y API services

#### Tareas:

- [ ] **2.1**: Crear types para publicación
  - Archivo: `packages/mobile-expo/src/types/publish.types.ts`
  ```typescript
  export interface PublishContentRequest {
    contentId: string;
    siteIds: string[];
    publicationType: 'breaking' | 'news' | 'blog';
    publishToSocialMedia: boolean;
    socialMediaPlatforms: ('facebook' | 'twitter')[];
    improveCopy: boolean;
    useOriginalImage: boolean;
    customImageUrl?: string;
  }

  export interface PublishContentResponse {
    success: boolean;
    message: string;
    data: {
      id: string;
      slug: string;
      sites: string[];
      publishedAt?: string;
      scheduledAt?: string;
      socialMediaPublishing?: {
        facebook: Array<{
          pageId: string;
          status: 'pending' | 'published' | 'failed';
        }>;
        twitter: Array<{
          accountId: string;
          status: 'pending' | 'published' | 'failed';
        }>;
      };
    };
  }

  export interface ImproveCopyRequest {
    contentId: string;
    canonicalUrl?: string;
  }

  export interface ImproveCopyResponse {
    facebook: {
      hook: string;
      copy: string;
      emojis: string[];
    };
    twitter: {
      tweet: string;
      hook: string;
      emojis: string[];
    };
  }
  ```

- [ ] **2.2**: Crear `publishApi.ts`
  - Archivo: `packages/mobile-expo/src/services/publish/publishApi.ts`
  ```typescript
  export const publishApi = {
    /**
     * Publica contenido generado inmediatamente o lo programa
     */
    publishContent: async (request: PublishContentRequest): Promise<PublishContentResponse> => {
      const rawClient = ApiClient.getRawClient();

      // Decidir endpoint según tipo
      if (request.publicationType === 'breaking') {
        // Publicación inmediata
        const response = await rawClient.post('/pachuca-noticias/publish', {
          contentId: request.contentId,
          siteIds: request.siteIds,
          publishToSocialMedia: request.publishToSocialMedia,
          socialMediaPlatforms: request.socialMediaPlatforms,
          useOriginalImage: request.useOriginalImage,
          customImageUrl: request.customImageUrl,
        });
        return response.data;
      } else {
        // Publicación programada
        const response = await rawClient.post('/pachuca-noticias/schedule', {
          contentId: request.contentId,
          publicationType: request.publicationType,
          useOriginalImage: request.useOriginalImage,
          customImageUrl: request.customImageUrl,
        });
        return response.data;
      }
    },

    /**
     * Mejora copy con agente especializado
     */
    improveCopy: async (request: ImproveCopyRequest): Promise<ImproveCopyResponse> => {
      const rawClient = ApiClient.getRawClient();
      const response = await rawClient.post('/content-ai/improve-copy', request);
      return response.data;
    },
  };
  ```

---

### **FASE 3: Mobile - Hooks**

**Objetivo**: Crear hooks de TanStack Query

#### Tareas:

- [ ] **3.1**: Crear `usePublishContent.ts`
  - Archivo: `packages/mobile-expo/src/hooks/usePublishContent.ts`
  ```typescript
  export function usePublishContent() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (request: PublishContentRequest) => publishApi.publishContent(request),
      onSuccess: (data) => {
        // Invalidar cache de contenido generado
        queryClient.invalidateQueries({ queryKey: ['generated-content'] });

        // Invalidar cache de noticias publicadas
        queryClient.invalidateQueries({ queryKey: ['published-noticias'] });
      },
    });
  }
  ```

- [ ] **3.2**: Crear `useImproveCopy.ts`
  - Archivo: `packages/mobile-expo/src/hooks/useImproveCopy.ts`
  ```typescript
  export function useImproveCopy() {
    return useMutation({
      mutationFn: (request: ImproveCopyRequest) => publishApi.improveCopy(request),
    });
  }
  ```

- [ ] **3.3**: Exportar en `hooks/index.ts`

---

### **FASE 4: Mobile - Pantalla de Publicación**

**Objetivo**: Crear pantalla `/generated/[id]/publish`

#### Tareas:

- [ ] **4.1**: Crear pantalla de publicación
  - Archivo: `packages/mobile-expo/app/(protected)/generated/[id]/publish.tsx`
  - Estructura:
    ```typescript
    export default function PublishContentScreen() {
      const { id } = useLocalSearchParams<{ id: string }>();
      const router = useRouter();

      // Hooks
      const { data: content } = useGeneratedContentById(id);
      const { data: sites } = useSites({ isActive: true });
      const publishMutation = usePublishContent();
      const improveCopyMutation = useImproveCopy();

      // State
      const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
      const [publicationType, setPublicationType] = useState<'breaking' | 'news' | 'blog'>('news');
      const [publishToSocialMedia, setPublishToSocialMedia] = useState(false);
      const [selectedPlatforms, setSelectedPlatforms] = useState<('facebook' | 'twitter')[]>(['facebook', 'twitter']);
      const [improveCopy, setImproveCopy] = useState(true);
      const [useOriginalImage, setUseOriginalImage] = useState(true);

      const handlePublish = async () => {
        try {
          // 1. Validaciones
          if (selectedSiteIds.length === 0) {
            Alert.alert('Error', 'Selecciona al menos un sitio');
            return;
          }

          // 2. Mejorar copy si está activado
          let improvedCopy = null;
          if (improveCopy && publishToSocialMedia) {
            const result = await improveCopyMutation.mutateAsync({
              contentId: id,
              canonicalUrl: undefined, // Se calculará en backend
            });
            improvedCopy = result;
          }

          // 3. Publicar
          const result = await publishMutation.mutateAsync({
            contentId: id,
            siteIds: selectedSiteIds,
            publicationType,
            publishToSocialMedia,
            socialMediaPlatforms: selectedPlatforms,
            improveCopy,
            useOriginalImage,
          });

          // 4. Mostrar resultado
          Alert.alert('Éxito', result.message);

          // 5. Navegar de regreso
          router.back();

        } catch (error) {
          Alert.alert('Error', error.message);
        }
      };

      return (
        <SafeAreaView>
          <ScrollView>
            {/* Card Superior con Resumen */}
            <Card>
              <CardContent>
                <ThemedText>💰 Costo: ${content?.generationMetadata?.cost}</ThemedText>
                <ThemedText>⏱️ Tiempo: {content?.generationMetadata?.processingTime}ms</ThemedText>
              </CardContent>
            </Card>

            {/* Sección 1: Seleccionar Sitios */}
            <Card>
              <CardHeader>
                <CardTitle>🌐 ¿Dónde publicar?</CardTitle>
              </CardHeader>
              <CardContent>
                <MultiSelect
                  value={selectedSiteIds}
                  onValueChange={setSelectedSiteIds}
                  options={sites?.map(site => ({
                    label: site.name,
                    value: site.id,
                  }))}
                  placeholder="Seleccionar sitios..."
                />
              </CardContent>
            </Card>

            {/* Sección 2: Tipo de Publicación */}
            <Card>
              <CardHeader>
                <CardTitle>📌 ¿Cómo publicar?</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={publicationType}
                  onValueChange={(value) => setPublicationType(value as any)}
                  options={[
                    { value: 'breaking', label: 'Breaking News', description: 'Publica inmediatamente' },
                    { value: 'news', label: 'Noticia Normal', description: 'Cola inteligente' },
                    { value: 'blog', label: 'Blog Post', description: 'Cola inteligente' },
                  ]}
                />
              </CardContent>
            </Card>

            {/* Sección 3: Redes Sociales */}
            <Card>
              <CardHeader>
                <CardTitle>📱 Publicar en redes sociales</CardTitle>
              </CardHeader>
              <CardContent>
                <Switch
                  value={publishToSocialMedia}
                  onValueChange={setPublishToSocialMedia}
                />

                {publishToSocialMedia && (
                  <>
                    <Checkbox
                      checked={selectedPlatforms.includes('facebook')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPlatforms([...selectedPlatforms, 'facebook']);
                        } else {
                          setSelectedPlatforms(selectedPlatforms.filter(p => p !== 'facebook'));
                        }
                      }}
                      label="Facebook"
                    />

                    <Checkbox
                      checked={selectedPlatforms.includes('twitter')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPlatforms([...selectedPlatforms, 'twitter']);
                        } else {
                          setSelectedPlatforms(selectedPlatforms.filter(p => p !== 'twitter'));
                        }
                      }}
                      label="Twitter"
                    />

                    <Checkbox
                      checked={improveCopy}
                      onCheckedChange={setImproveCopy}
                      label="Mejorar copy con IA antes de publicar"
                    />
                  </>
                )}
              </CardContent>
            </Card>

            {/* Botones de Acción */}
            <View>
              <Button onPress={() => router.back()}>
                <ThemedText>Cancelar</ThemedText>
              </Button>
              <Button onPress={handlePublish}>
                <ThemedText>Publicar Ahora</ThemedText>
              </Button>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }
    ```

- [ ] **4.2**: Agregar botón "Publicar" en `/generated/[id]`
  - Archivo: `packages/mobile-expo/app/(protected)/generated/[id].tsx`
  - Agregar botón en la card superior
  - Al presionar, navegar a `/generated/${id}/publish`

---

### **FASE 5: Mobile - Actualizar Card de Contenido**

**Objetivo**: Mostrar estado de publicación en la card

#### Tareas:

- [ ] **5.1**: Modificar `GeneratedContentCard`
  - Archivo: `packages/mobile-expo/src/components/content/GeneratedContentCard.tsx`
  - Agregar badge "Publicado" si `content.publishingInfo?.publishedAt` existe
  - Mostrar cantidad de sitios publicados
  - Mostrar cantidad de posts en redes sociales

  ```typescript
  // Verificar si está publicado
  const isPublished = !!content.publishingInfo?.publishedAt;

  // En el render:
  {isPublished && (
    <Badge variant="default" style={styles.publishedBadge}>
      <ThemedText variant="label-small">
        ✅ Publicado en {content.sitesCount || 0} sitios
      </ThemedText>
    </Badge>
  )}
  ```

---

### **FASE 6: Testing y Ajustes**

**Objetivo**: Probar flujo completo end-to-end

#### Tareas:

- [ ] **6.1**: Test de publicación inmediata (breaking news)
  - Seleccionar 1 sitio
  - Tipo: Breaking News
  - Publicar sin redes sociales
  - Verificar que se publica inmediatamente

- [ ] **6.2**: Test de publicación programada (news)
  - Seleccionar 2 sitios
  - Tipo: Noticia Normal
  - Publicar sin redes sociales
  - Verificar que se programa en cola

- [ ] **6.3**: Test de publicación con redes sociales
  - Seleccionar 1 sitio
  - Tipo: Breaking News
  - Activar redes sociales (Facebook + Twitter)
  - Activar "Mejorar copy"
  - Verificar que:
    - Copy se mejora antes de publicar
    - URL canónica se agrega al copy
    - Se publica en Facebook y Twitter
    - Tracking se actualiza en `socialMediaPublishing`

- [ ] **6.4**: Test de card actualizada
  - Ver contenido publicado en lista
  - Verificar que muestra badge "Publicado"
  - Verificar que muestra cantidad de sitios

---

## 📊 7. SÍNTESIS EJECUTIVA DE FASES

### **FASE 0: Preparación - Backend (Copy Improver Agent)** ⏱️ ~4 horas
**QUÉ SE HACE**: Crear servicio y endpoint para mejorar copy con agente especializado
**IMPACTO**: Permite mejorar copy automáticamente antes de publicar en redes sociales
**VALIDACIÓN**: Test con Postman de endpoint `/content-ai/improve-copy`

---

### **FASE 1: Mobile - Componentes UI Base** ⏱️ ~6 horas
**QUÉ SE HACE**: Crear `MultiSelect` y `RadioGroup` components
**IMPACTO**: Componentes reutilizables para la pantalla de publicación
**VALIDACIÓN**: Pantallas de prueba funcionando correctamente

---

### **FASE 2: Mobile - Types y API Services** ⏱️ ~4 horas
**QUÉ SE HACE**: Crear types, API service `publishApi.ts`
**IMPACTO**: Capa de comunicación con backend lista
**VALIDACIÓN**: API calls funcionando en Postman

---

### **FASE 3: Mobile - Hooks** ⏱️ ~3 horas
**QUÉ SE HACE**: Crear hooks `usePublishContent`, `useImproveCopy`
**IMPACTO**: Integración con TanStack Query para manejo de estado
**VALIDACIÓN**: Hooks funcionando con cache invalidation

---

### **FASE 4: Mobile - Pantalla de Publicación** ⏱️ ~12 horas
**QUÉ SE HACE**: Crear pantalla `/generated/[id]/publish` completa
**IMPACTO**: **CRÍTICO** - UI completa para publicar contenido
**VALIDACIÓN**: Pantalla funcional con todas las secciones

---

### **FASE 5: Mobile - Actualizar Card de Contenido** ⏱️ ~3 horas
**QUÉ SE HACE**: Agregar badge "Publicado" y tracking en card
**IMPACTO**: Usuario puede ver estado de publicación fácilmente
**VALIDACIÓN**: Card muestra información correcta

---

### **FASE 6: Testing y Ajustes** ⏱️ ~6 horas
**QUÉ SE HACE**: Testing end-to-end de todos los flujos
**IMPACTO**: **CRÍTICO** - Validación de funcionamiento completo
**VALIDACIÓN**: Todos los flujos funcionando correctamente

---

## 🕐 TIEMPO TOTAL ESTIMADO: ~38 horas (~5 días de trabajo)

---

## 🎯 RESUMEN EJECUTIVO FINAL

### **LO QUE TENEMOS**:
- ✅ Backend completo con multi-sitio
- ✅ Backend completo con redes sociales (Facebook + Twitter via GetLate.dev)
- ✅ Sistema de cola inteligente (breaking, news, blog)
- ✅ Tracking de publicación en `socialMediaPublishing`
- ✅ Copys de Facebook y Twitter generados por IA
- ✅ Pantalla de detalle de contenido generado en mobile

### **LO QUE NECESITAMOS**:
1. **Backend**: Servicio/endpoint para "mejorar copy" con agente
2. **Mobile**: Componentes UI (`MultiSelect`, `RadioGroup`)
3. **Mobile**: Pantalla de publicación (`/generated/[id]/publish`)
4. **Mobile**: Hooks (`usePublishContent`, `useImproveCopy`)
5. **Mobile**: Actualización de card de contenido generado

### **FLUJO FINAL DESEADO**:
```
1. Usuario ve contenido generado en lista
2. Presiona "Publicar" en la card
3. Navega a pantalla de publicación
4. Selecciona sitios (multi-select)
5. Selecciona tipo (breaking, news, blog)
6. Activa redes sociales (opcional)
7. Activa "Mejorar copy" (opcional)
8. Presiona "Publicar Ahora"
9. Sistema:
   - Mejora copy con agente (si está activado)
   - Publica en sitios seleccionados
   - Publica en redes sociales (si está activado)
   - Actualiza tracking
10. Usuario ve resultado y vuelve a la lista
11. Card ahora muestra badge "Publicado"
```

### **ARQUITECTURA CLAVE**:
- **Backend**: Usa endpoints existentes + nuevo endpoint para mejorar copy
- **Mobile**: Patrón de capas (UI → Hooks → API Services → ApiClient)
- **Componentes**: Reutilización de sistema de diseño existente + nuevos (`MultiSelect`, `RadioGroup`)
- **Estado**: TanStack Query para cache y mutations
- **NO se usa**: `forwardRef`, `any`, testing se hace manualmente por el usuario

---

**✅ APROBACIÓN REQUERIDA**: ¿Procedo con la implementación? ¿Algún cambio a las fases propuestas?
