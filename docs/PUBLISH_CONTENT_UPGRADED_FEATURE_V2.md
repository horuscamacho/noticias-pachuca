# 📱 Feature: Publicación Automática en Redes Sociales Multi-Sitio

**Versión:** 2.1 (APROBADO POR COYOTITO - LISTO PARA IMPLEMENTAR)
**Fecha:** 11 Octubre 2025
**Estado:** ✅ APROBADO - Listo para comenzar

---

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Análisis del Sistema Actual (LO QUE YA EXISTE)](#análisis-del-sistema-actual)
3. [Lo que Falta (GAPS)](#lo-que-falta)
4. [Plan de Implementación por Fases REAL](#plan-de-implementación-por-fases-real)
5. [Checklist de Tareas](#checklist-de-tareas)

---

## 🎯 Resumen Ejecutivo

### Objetivo
Extender el sistema EXISTENTE de publicación para agregar:
1. Soporte multi-sitio (detección por dominio) ✅ APROBADO
2. Integración con Getlate para Facebook/Twitter ✅ APROBADO (Credenciales disponibles)
3. Mejores copies de redes sociales ✅ APROBADO
4. Detección y limpieza de plagios ✅ APROBADO
5. Enriquecimiento HTML brutalista ✅ APROBADO
6. Galería de imágenes por keywords en mobile ✅ APROBADO
7. Tab "Redes" con formulario para crear sitios ✅ APROBADO

### Decisiones Confirmadas por Coyotito
- ✅ **Detección por header**: Usar `X-Site-Domain` en requests
- ✅ **Credenciales Getlate**: Disponibles para integración
- ✅ **Delays aprobados**: Breaking=2min, News=10min, Blog=30min
- ✅ **Fase 6 incluida**: Con formulario de creación de sitios

### Problemas Identificados en Código Real
1. **publish.service.ts:106** - `baseUrl` hardcodeado: `'https://noticiaspachuca.com'`
2. **No hay filtro por dominio** - public-noticias llama `/api/pachuca-noticias?status=published` sin header
3. **Evento `noticia.published` no aprovechado** - Se emite pero nadie publica en redes
4. **Copies genéricos** - No hay revisión posterior del contenido generado
5. **Pantalla `/generated/[id]`** - Existe pero falta galería de imágenes y selector de sitios

---

## 📊 Análisis del Sistema Actual (LO QUE YA EXISTE)

### ✅ Backend (api-nueva) - COMPLETO

#### 1. PublishService (`/src/pachuca-noticias/services/publish.service.ts`)
**Estado**: Funcional pero single-site
```typescript
// LÍNEA 106 - HARDCODED
const baseUrl = 'https://noticiaspachuca.com';

// LÍNEA 42-220 - Método publishNoticia completo
async publishNoticia(dto: PublishNoticiaDto): Promise<PublishedNoticiaDocument> {
  // ✅ Valida que no exista duplicado
  // ✅ Obtiene contenido generado
  // ✅ Genera slug único
  // ✅ Procesa imágenes con S3
  // ✅ Genera structured data
  // ✅ Guarda en PublishedNoticia
  // ✅ Emite evento 'noticia.published' (LÍNEA 202)
  // ❌ Solo publica en noticiaspachuca.com
}
```

#### 2. PublishingQueueService (`/src/pachuca-noticias/services/publishing-queue.service.ts`)
**Estado**: COMPLETO y funcionando
```typescript
// LÍNEA 66-187 - Sistema de cola inteligente COMPLETO
async schedulePublication(dto: SchedulePublicationDto) {
  // ✅ Breaking news → publica inmediato (no entra en cola)
  // ✅ News → prioridad 8, delay calculado
  // ✅ Blog → prioridad 3, delay calculado
  // ✅ Usa BullMQ para jobs
  // ✅ Calcula delays inteligentes
  // ✅ Manejo de errores y recovery
}
```

#### 3. Controller (`/src/pachuca-noticias/controllers/pachuca-noticias.controller.ts`)
**Estado**: COMPLETO
```typescript
// LÍNEA 59-74 - GET /pachuca-noticias
@Get()
async queryNoticias(@Query(ValidationPipe) query: QueryNoticiasDto) {
  // ✅ Paginación
  // ✅ Filtros (status, category, etc)
  // ✅ Cache 5 minutos
  // ❌ No filtra por dominio/sitio
}
```

#### 4. ImageBank (`/src/image-bank/schemas/image-bank.schema.ts`)
**Estado**: COMPLETO
```typescript
// LÍNEA 74-76 - Vincular por keywords
@Prop({ type: [String], default: [], index: true })
keywords: string[];

// ✅ Index en keywords para búsqueda rápida
// ✅ Index compuesto outlet + keywords
// ✅ usedInArticles tracking
```

#### 5. ContentGenerationService (`/src/content-ai/services/content-generation.service.ts`)
**Estado**: Funcional pero prompts mejorables
```typescript
// LÍNEA 873-1041 - preparePromptFromTemplate
private preparePromptFromTemplate(template: any, variables: Record<string, string>): string {
  // ✅ Genera contenido con OpenAI
  // ✅ Incluye prompts para social copies
  // ⚠️ Prompts genéricos, sin fórmulas de engagement 2025
  // ⚠️ No valida plagios
  // ⚠️ No enriquece HTML
}
```

### ✅ Frontend Mobile (mobile-expo) - PARCIALMENTE COMPLETO

#### 1. Pantalla `/generated/[id].tsx`
**Estado**: EXISTE pero incompleta
```typescript
// app/(protected)/generated/[id].tsx
// ✅ Muestra contenido generado
// ✅ Muestra copies de Facebook y Twitter
// ✅ Metadata de generación (tokens, costo, tiempo)
// ❌ Falta galería de imágenes por keywords
// ❌ Falta selector de sitios para publicar
// ❌ Falta botón "Publicar en N sitios"
```

#### 2. Pantalla `/generated/index.tsx`
**Estado**: COMPLETA
```typescript
// app/(protected)/generated/index.tsx
// ✅ Lista con infinite scroll
// ✅ Filtros avanzados (status, tags, category)
// ✅ Ordenamiento híbrido
// ✅ Pull to refresh
```

#### 3. Pantalla `/extracted/[id].tsx`
**Estado**: COMPLETA
```typescript
// app/(protected)/extracted/[id].tsx
// ✅ Muestra contenido extraído
// ✅ Botón "Crear Contenido" → navega a /extracted/[id]/select-agents
// ✅ Socket para logs en tiempo real
```

### ✅ Frontend Public (public-noticias) - COMPLETO SINGLE-SITE

#### 1. Server Actions
**Estado**: Funcional sin multi-sitio
```typescript
// src/features/noticias/server/getNoticias.ts
// LÍNEA 47 - Llama endpoint
const url = `${API_BASE_URL}/pachuca-noticias?${queryParams}`;

// ✅ Paginación
// ✅ Filtros por category, status
// ✅ Cache 2 minutos
// ❌ No pasa header de dominio
// ❌ No filtra por sitio
```

---

## ❌ Lo que Falta (GAPS)

### Backend

#### 1. Multi-Sitio Support
**Archivos a crear/modificar:**
- ❌ Crear `src/sites/` módulo completo (schema, service, controller)
- ❌ Modificar `publish.service.ts:106` - Quitar baseUrl hardcodeado
- ❌ Modificar `PublishedNoticia` schema - Agregar `publishedSites: Types.ObjectId[]`
- ❌ Crear middleware/guard para detectar dominio del request
- ❌ Modificar `queryNoticias()` para filtrar por sitio

#### 2. Integración Getlate
**Archivos a crear:**
- ❌ `src/social-media/getlate/getlate.module.ts`
- ❌ `src/social-media/getlate/getlate.service.ts`
- ❌ `src/social-media/services/social-publisher.service.ts`
- ❌ `src/social-media/processors/social-publishing.processor.ts`

#### 3. Content Editor
**Archivos a crear:**
- ❌ `src/content-ai/services/content-editor.service.ts`
- ❌ `src/content-ai/detectors/plagiarism-detector.ts`
- ❌ `src/content-ai/enrichers/html-enricher.ts`

#### 4. Mejores Prompts
**Archivos a modificar:**
- ⚠️ `src/content-ai/services/content-generation.service.ts:873-1041`

### Frontend Mobile

#### 1. Galería de Imágenes
**Archivos a modificar:**
- ⚠️ `app/(protected)/generated/[id].tsx` - Agregar sección de galería

**Archivos a crear:**
- ❌ `src/components/generated/ImageGallerySection.tsx`
- ❌ `src/hooks/useImagesByKeywords.ts`

#### 2. Selector Multi-Sitio
**Archivos a crear:**
- ❌ `src/components/generated/SiteSelector.tsx`
- ❌ `src/hooks/useSites.ts`
- ❌ `src/hooks/usePublishToSites.ts`

#### 3. Tab "Redes"
**Archivos a modificar:**
- ⚠️ `app/(protected)/(tabs)/_layout.tsx` - Renombrar "stats" → "redes"
- ⚠️ `app/(protected)/(tabs)/stats.tsx` - Renombrar a `redes.tsx`

**Archivos a crear:**
- ❌ `app/(protected)/redes/[siteId].tsx` - Detalle por sitio
- ❌ `src/hooks/useSocialMediaStats.ts`

### Frontend Public

#### 1. Header de Dominio
**Archivos a modificar:**
- ⚠️ `src/features/noticias/server/getNoticias.ts:47` - Agregar header `X-Site-Domain`
- ⚠️ `src/features/noticias/server/getNoticiaBySlug.ts:19` - Agregar header

---

## 📅 Plan de Implementación por Fases REAL

### FASE 1: Backend - Prompts Mejorados y Content Editor
**Duración**: 2-3 horas | **Prioridad**: 🔴 CRÍTICA

#### Archivos a Modificar:
1. `src/content-ai/services/content-generation.service.ts`
   - **Línea 873-1041**: Actualizar `preparePromptFromTemplate()`
   - Agregar fórmulas AIDA PLUS para Facebook
   - Agregar fórmulas Viral 2025 para Twitter
   - Restricción hashtags: 1-2 máximo
   - Longitud tweets: 230-270 chars

#### Archivos a Crear:
1. `src/content-ai/services/content-editor.service.ts`
```typescript
@Injectable()
export class ContentEditorService {
  async reviewAndClean(contentId: string): Promise<void> {
    const content = await this.aiContentModel.findById(contentId);

    // 1. Detectar plagios
    const plagiarisms = this.detectPlagiarisms(content.generatedContent);
    if (plagiarisms.length > 0) {
      content.generatedContent = this.removePlagiarisms(content.generatedContent, plagiarisms);
    }

    // 2. Enriquecer HTML
    content.generatedContent = this.enrichHtml(content.generatedContent);

    // 3. Validar ortografía en citas
    content.generatedContent = this.fixQuotesSpelling(content.generatedContent);

    await content.save();
  }

  private detectPlagiarisms(content: string): string[] {
    const patterns = [
      /[A-Z\s]+,\s\d{1,2}\s[A-Z]{3}\/[^\/]+\/-/g, // "CIUDAD, DD MMM/MEDIO/.-"
      /Hidalgo Sport/gi,
      /Síntesis/gi,
      // ... más patrones
    ];

    const found: string[] = [];
    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) found.push(...matches);
    });

    return found;
  }

  private enrichHtml(content: string): string {
    // Agregar clases brutalistas del sistema de diseño
    let enriched = content;

    // Listas
    enriched = enriched.replace(/<ul>/g, '<ul class="brutal-list">');

    // Citas
    enriched = enriched.replace(/<blockquote>/g, '<blockquote class="brutal-quote">');

    // Énfasis
    enriched = enriched.replace(/<strong>/g, '<strong class="brutal-emphasis">');

    return enriched;
  }
}
```

2. `src/content-ai/detectors/plagiarism-detector.ts`
3. `src/content-ai/enrichers/html-enricher.ts`

#### Testing:
- Probar con 5 noticias reales
- Validar que detecte "PACHUCA DE SOTO / Hidalgo Sport /.-"
- Validar enriquecimiento HTML
- Validar prompts mejorados

#### Entregables:
- ✅ Prompts actualizados
- ✅ ContentEditorService funcionando
- ✅ Tests unitarios
- ✅ **BUILD BACKEND** ✅

---

### FASE 2: Backend - Módulo de Sitios Multi-Sitio
**Duración**: 3-4 horas | **Prioridad**: 🔴 CRÍTICA

#### Archivos a Crear:
1. **Estructura del módulo sites**:
```
src/sites/
├── sites.module.ts
├── schemas/
│   └── site-config.schema.ts
├── services/
│   ├── sites.service.ts
│   └── site-detector.service.ts
├── controllers/
│   └── sites.controller.ts
├── dto/
│   ├── create-site.dto.ts
│   ├── update-site.dto.ts
│   └── query-sites.dto.ts
├── guards/
│   └── site-domain.guard.ts
└── scripts/
    └── seed-sites.ts
```

2. **Schema: `site-config.schema.ts`**
```typescript
@Schema({ timestamps: true })
export class SiteConfig {
  @Prop({ required: true, trim: true, unique: true })
  name: string; // "Noticias Pachuca"

  @Prop({ required: true, trim: true, unique: true })
  domain: string; // "noticiaspachuca.com"

  @Prop({ required: true, trim: true })
  baseUrl: string; // "https://noticiaspachuca.com"

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Object })
  socialProfiles: {
    facebook?: {
      profileId: string; // ID de Getlate
      isActive: boolean;
      maxPostsPerDay: number;
    };
    twitter?: {
      profileId: string; // ID de Getlate
      isActive: boolean;
      maxPostsPerDay: number;
    };
  };

  @Prop({ type: Object })
  publishing: {
    autoPublish: boolean;
    defaultCategory: string;
  };
}
```

#### Archivos a Modificar:

1. **`published-noticia.schema.ts`**
```typescript
// AGREGAR DESPUÉS DE LÍNEA 23:
@Prop({ type: [{ type: Types.ObjectId, ref: 'SiteConfig' }], default: [] })
publishedSites: Types.ObjectId[]; // Array de sitios donde se publicó

// REEMPLAZAR socialMediaPublishing (línea 188-202):
@Prop({ type: [Object], default: [] })
socialMediaPublishing: Array<{
  siteId: Types.ObjectId;
  siteName: string;
  facebook?: {
    published: boolean;
    postId?: string;
    url?: string;
    publishedAt?: Date;
    error?: string;
  };
  twitter?: {
    published: boolean;
    tweetId?: string;
    url?: string;
    publishedAt?: Date;
    error?: string;
  };
}>;
```

2. **`publish.service.ts`**
```typescript
// LÍNEA 106 - REEMPLAZAR:
const baseUrl = 'https://noticiaspachuca.com';

// POR:
const site = await this.sitesService.getSiteById(dto.siteId);
if (!site) throw new NotFoundException('Site not found');
const baseUrl = site.baseUrl;

// LÍNEA 42 - ACTUALIZAR FIRMA:
async publishNoticia(dto: PublishNoticiaDto & { siteIds: string[] }): Promise<PublishedNoticiaDocument[]> {
  const published: PublishedNoticiaDocument[] = [];

  for (const siteId of dto.siteIds) {
    const site = await this.sitesService.getSiteById(siteId);
    // ... publicar para cada sitio
    published.push(noticia);
  }

  return published;
}
```

3. **`pachuca-noticias.controller.ts`**
```typescript
// LÍNEA 66 - AGREGAR HEADER:
@Get()
async queryNoticias(
  @Query(ValidationPipe) query: QueryNoticiasDto,
  @Headers('x-site-domain') siteDomain?: string
) {
  // Detectar sitio por dominio
  let siteId: string | undefined;
  if (siteDomain) {
    const site = await this.sitesService.getSiteByDomain(siteDomain);
    if (site) siteId = site._id.toString();
  }

  const result = await this.publishService.queryNoticias({
    ...query,
    siteId // Filtrar por sitio
  });

  return { success: true, data: result.data, pagination: result.pagination };
}
```

#### Seed Script:
```bash
cd /Users/horuscamachoavila/Documents/pachuca-noticias/packages/api-nueva
node -r ts-node/register src/sites/scripts/seed-sites.ts
```

#### Testing:
- Crear sitio vía POST `/sites`
- Listar sitios vía GET `/sites`
- Buscar por dominio vía GET `/sites/by-domain?domain=noticiaspachuca.com`
- Publicar contenido en múltiples sitios
- Verificar filtrado por header `X-Site-Domain`

#### Entregables:
- ✅ SitesModule completo
- ✅ CRUD funcionando
- ✅ Seed de noticiaspachuca.com
- ✅ PublishedNoticia modificado
- ✅ Filtrado por sitio
- ✅ **BUILD BACKEND** ✅

---

### FASE 3: Mobile - Galería de Imágenes y Selector de Sitios
**Duración**: 3-4 horas | **Prioridad**: 🟡 ALTA

#### Archivos a Modificar:

1. **`app/(protected)/generated/[id].tsx`**
```typescript
// DESPUÉS DE LÍNEA 197 (después de sección 3: Contenido Completo)
// AGREGAR:

{/* Sección 3.5: Galería de Imágenes */}
<Card style={styles.section}>
  <CardHeader>
    <CardTitle>
      <ThemedText variant="title-medium">📸 Galería de Imágenes</ThemedText>
    </CardTitle>
    <CardDescription>
      <ThemedText variant="body-small" color="secondary">
        Selecciona la imagen para publicar
      </ThemedText>
    </CardDescription>
  </CardHeader>
  <CardContent>
    <ImageGallerySection
      keywords={content.generatedKeywords}
      originalNoticiaId={content.originalContent?.id}
      onSelectImage={(imageUrl) => setSelectedImage(imageUrl)}
    />
  </CardContent>
</Card>

{/* Sección 3.6: Selector de Sitios */}
<Card style={styles.section}>
  <CardHeader>
    <CardTitle>
      <ThemedText variant="title-medium">🌐 Publicar en Sitios</ThemedText>
    </CardTitle>
  </CardHeader>
  <CardContent>
    <SiteSelector
      onSitesChange={(sites) => setSelectedSites(sites)}
    />
  </CardContent>
</Card>

{/* Sección 3.7: Botón Publicar */}
<Card style={styles.section}>
  <CardContent>
    <Button
      onPress={handlePublish}
      disabled={selectedSites.length === 0 || isPublishing}
      style={styles.publishButton}
    >
      {isPublishing ? (
        <>
          <ActivityIndicator size="small" color="#000" style={{ marginRight: 8 }} />
          <ThemedText variant="label-medium" style={styles.buttonText}>
            Publicando...
          </ThemedText>
        </>
      ) : (
        <ThemedText variant="label-medium" style={styles.buttonText}>
          ✨ Publicar en {selectedSites.length} {selectedSites.length === 1 ? 'sitio' : 'sitios'}
        </ThemedText>
      )}
    </Button>
  </CardContent>
</Card>
```

#### Archivos a Crear:

1. **`src/components/generated/ImageGallerySection.tsx`**
```typescript
interface ImageGallerySectionProps {
  keywords: string[];
  originalNoticiaId?: string;
  onSelectImage: (imageUrl: string) => void;
}

export function ImageGallerySection({ keywords, originalNoticiaId, onSelectImage }: ImageGallerySectionProps) {
  const { data: images } = useImagesByKeywords(keywords);
  const [selectedTab, setSelectedTab] = useState<'original' | 'ai' | 'related'>('original');

  // Filtrar imágenes por tipo
  const originalImages = images?.filter(img => img.extractedNoticiaId?.toString() === originalNoticiaId) || [];
  const aiImages = images?.filter(img => img.aiGenerated) || [];
  const relatedImages = images?.filter(img => !img.aiGenerated && img.extractedNoticiaId?.toString() !== originalNoticiaId) || [];

  return (
    <View>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity onPress={() => setSelectedTab('original')}>
          <Text style={selectedTab === 'original' ? styles.tabActive : styles.tabInactive}>
            Original ({originalImages.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedTab('ai')}>
          <Text style={selectedTab === 'ai' ? styles.tabActive : styles.tabInactive}>
            AI ({aiImages.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedTab('related')}>
          <Text style={selectedTab === 'related' ? styles.tabActive : styles.tabInactive}>
            Relacionadas ({relatedImages.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Grid de imágenes */}
      <FlatList
        data={selectedTab === 'original' ? originalImages : selectedTab === 'ai' ? aiImages : relatedImages}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => onSelectImage(item.processedUrls.large)}>
            <Image source={{ uri: item.processedUrls.thumbnail }} style={styles.thumbnail} />
          </TouchableOpacity>
        )}
        numColumns={3}
        keyExtractor={(item) => item._id}
      />
    </View>
  );
}
```

2. **`src/hooks/useImagesByKeywords.ts`**
```typescript
export function useImagesByKeywords(keywords: string[]) {
  return useQuery({
    queryKey: ['images', 'keywords', keywords],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/image-bank?keywords=${keywords.join(',')}&limit=50`
      );
      const data = await response.json();
      return data.data as ImageBankImage[];
    },
    enabled: keywords.length > 0,
  });
}
```

3. **`src/components/generated/SiteSelector.tsx`**
```typescript
interface SiteSelectorProps {
  onSitesChange: (siteIds: string[]) => void;
}

export function SiteSelector({ onSitesChange }: SiteSelectorProps) {
  const { data: sites } = useSites();
  const [selected, setSelected] = useState<string[]>([]);

  const handleToggle = (siteId: string) => {
    const newSelected = selected.includes(siteId)
      ? selected.filter(id => id !== siteId)
      : [...selected, siteId];

    setSelected(newSelected);
    onSitesChange(newSelected);
  };

  return (
    <View>
      {sites?.map(site => (
        <View key={site.id} style={styles.siteRow}>
          <Checkbox
            checked={selected.includes(site.id)}
            onCheckedChange={() => handleToggle(site.id)}
          />
          <View style={styles.siteInfo}>
            <Text style={styles.siteName}>{site.name}</Text>
            <Text style={styles.siteDomain}>{site.domain}</Text>
            <View style={styles.socialIcons}>
              {site.hasFacebook && <Facebook size={16} />}
              {site.hasTwitter && <Twitter size={16} />}
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
```

4. **`src/hooks/useSites.ts`**
```typescript
interface Site {
  id: string;
  name: string;
  domain: string;
  hasFacebook: boolean;
  hasTwitter: boolean;
}

export function useSites() {
  return useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/sites?isActive=true`);
      const data = await response.json();

      return data.data.map((site: any) => ({
        id: site._id,
        name: site.name,
        domain: site.domain,
        hasFacebook: !!site.socialProfiles?.facebook?.isActive,
        hasTwitter: !!site.socialProfiles?.twitter?.isActive,
      })) as Site[];
    },
  });
}
```

5. **`src/hooks/usePublishToSites.ts`**
```typescript
export function usePublishToSites() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      contentId: string;
      siteIds: string[];
      imageUrl?: string;
    }) => {
      const response = await fetch(`${API_URL}/pachuca-noticias/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: params.contentId,
          siteIds: params.siteIds,
          useOriginalImage: false,
          customImageUrl: params.imageUrl,
          isFeatured: false,
          isBreaking: false,
        }),
      });

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-content'] });
    },
  });
}
```

#### Testing:
- Abrir `/generated/[id]`
- Ver galería de imágenes en 3 tabs
- Seleccionar imagen
- Ver lista de sitios con checkboxes
- Seleccionar 1 o más sitios
- Click "Publicar en N sitios"
- Verificar que se publique correctamente

#### Entregables:
- ✅ Galería de imágenes funcional
- ✅ Selector multi-sitio funcional
- ✅ Botón publicar funcional
- ✅ **NO BUILD FRONT** (solo verificación visual)

---

### FASE 4: Backend - Integración con Getlate
**Duración**: 4-5 horas | **Prioridad**: 🔴 CRÍTICA

#### Paquetes a Instalar:
```bash
cd /Users/horuscamachoavila/Documents/pachuca-noticias/packages/api-nueva
yarn add axios @getlate/sdk
```

#### Variables de Entorno (.env):
```bash
GETLATE_API_KEY=tu_key_aqui
GETLATE_API_URL=https://api.getlate.io/v1
```

#### Archivos a Crear:

1. **Estructura del módulo social-media**:
```
src/social-media/
├── social-media.module.ts
├── getlate/
│   ├── getlate.service.ts
│   └── interfaces/
│       └── getlate.interfaces.ts
├── services/
│   └── social-publisher.service.ts
├── processors/
│   └── social-publishing.processor.ts
└── events/
    └── social-media.events.ts
```

2. **`getlate/getlate.service.ts`**
```typescript
import axios, { AxiosInstance } from 'axios';

interface FacebookPostParams {
  profileId: string;
  text: string;
  link?: string;
  imageUrl?: string;
}

interface TwitterPostParams {
  profileId: string;
  text: string;
  imageUrl?: string;
}

interface PostResult {
  success: boolean;
  postId?: string;
  url?: string;
  error?: string;
}

@Injectable()
export class GetlateService {
  private readonly logger = new Logger(GetlateService.name);
  private readonly client: AxiosInstance;

  constructor(private configService: AppConfigService) {
    this.client = axios.create({
      baseURL: this.configService.get('GETLATE_API_URL'),
      headers: {
        'Authorization': `Bearer ${this.configService.get('GETLATE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async publishToFacebook(params: FacebookPostParams): Promise<PostResult> {
    try {
      const response = await this.client.post('/posts', {
        profileId: params.profileId,
        platform: 'facebook',
        content: {
          text: params.text,
          link: params.link,
          imageUrl: params.imageUrl,
        },
      });

      return {
        success: true,
        postId: response.data.id,
        url: response.data.url,
      };
    } catch (error) {
      this.logger.error(`Facebook publish error: ${error.message}`);

      // Manejo de rate limit
      if (error.response?.status === 429) {
        await this.handleRateLimit(error.response.headers['retry-after']);
        return this.publishToFacebook(params); // Retry
      }

      return {
        success: false,
        error: error.message,
      };
    }
  }

  async publishToTwitter(params: TwitterPostParams): Promise<PostResult> {
    try {
      const response = await this.client.post('/posts', {
        profileId: params.profileId,
        platform: 'twitter',
        content: {
          text: params.text,
          imageUrl: params.imageUrl,
        },
      });

      return {
        success: true,
        postId: response.data.id,
        url: response.data.url,
      };
    } catch (error) {
      this.logger.error(`Twitter publish error: ${error.message}`);

      if (error.response?.status === 429) {
        await this.handleRateLimit(error.response.headers['retry-after']);
        return this.publishToTwitter(params);
      }

      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async handleRateLimit(retryAfter?: string): Promise<void> {
    const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
    this.logger.warn(`Rate limit hit, waiting ${waitMs}ms`);
    await new Promise(resolve => setTimeout(resolve, waitMs));
  }
}
```

3. **`services/social-publisher.service.ts`**
```typescript
@Injectable()
export class SocialPublisherService {
  private readonly logger = new Logger(SocialPublisherService.name);

  constructor(
    @InjectModel(PublishedNoticia.name)
    private publishedNoticiaModel: Model<PublishedNoticiaDocument>,
    @InjectModel(SiteConfig.name)
    private siteConfigModel: Model<SiteConfigDocument>,
    private readonly getlateService: GetlateService,
    @InjectQueue('social-publishing')
    private socialQueue: Queue,
  ) {}

  @OnEvent('noticia.published')
  async handleNoticiaPublished(event: { noticiaId: string; slug: string }) {
    this.logger.log(`Handling published noticia: ${event.noticiaId}`);

    // Obtener noticia publicada
    const noticia = await this.publishedNoticiaModel
      .findById(event.noticiaId)
      .populate('publishedSites');

    if (!noticia) {
      this.logger.error(`Noticia ${event.noticiaId} not found`);
      return;
    }

    // Por cada sitio publicado, encolar publicación en redes
    for (const siteId of noticia.publishedSites) {
      const site = await this.siteConfigModel.findById(siteId);
      if (!site) continue;

      // Calcular delay según tipo de noticia
      const delayMs = this.calculateDelay(noticia);

      await this.socialQueue.add(
        'publish-social',
        {
          noticiaId: event.noticiaId,
          siteId: site._id.toString(),
          siteName: site.name,
          baseUrl: site.baseUrl,
          slug: event.slug,
          socialProfiles: site.socialProfiles,
        },
        {
          delay: delayMs,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 60000, // 1 min
          },
        }
      );
    }
  }

  private calculateDelay(noticia: PublishedNoticiaDocument): number {
    if (noticia.isBreaking) return 2 * 60 * 1000; // 2 minutos
    if (noticia.isNoticia) return 10 * 60 * 1000; // 10 minutos
    return 30 * 60 * 1000; // 30 minutos
  }
}
```

4. **`processors/social-publishing.processor.ts`**
```typescript
@Processor('social-publishing')
export class SocialPublishingProcessor {
  private readonly logger = new Logger(SocialPublishingProcessor.name);

  constructor(
    @InjectModel(PublishedNoticia.name)
    private publishedNoticiaModel: Model<PublishedNoticiaDocument>,
    private readonly getlateService: GetlateService,
  ) {}

  @Process('publish-social')
  async handlePublishSocial(job: Job<{
    noticiaId: string;
    siteId: string;
    siteName: string;
    baseUrl: string;
    slug: string;
    socialProfiles: any;
  }>) {
    const { noticiaId, siteId, siteName, baseUrl, slug, socialProfiles } = job.data;

    this.logger.log(`Publishing to social media: ${noticiaId} for ${siteName}`);

    // Obtener noticia
    const noticia = await this.publishedNoticiaModel.findById(noticiaId);
    if (!noticia) throw new Error('Noticia not found');

    const url = `${baseUrl}/noticia/${slug}`;
    const results: any = {};

    // Publicar en Facebook
    if (socialProfiles.facebook?.isActive) {
      const fbCopy = noticia.socialMediaCopies?.facebook;
      if (fbCopy) {
        const text = `${fbCopy.hook}\n\n${fbCopy.copy}\n\n${url}`;

        const result = await this.getlateService.publishToFacebook({
          profileId: socialProfiles.facebook.profileId,
          text,
          link: url,
          imageUrl: noticia.featuredImage?.large,
        });

        results.facebook = {
          published: result.success,
          postId: result.postId,
          url: result.url,
          publishedAt: result.success ? new Date() : undefined,
          error: result.error,
        };
      }
    }

    // Publicar en Twitter
    if (socialProfiles.twitter?.isActive) {
      const twitterCopy = noticia.socialMediaCopies?.twitter;
      if (twitterCopy) {
        const text = `${twitterCopy.tweet}\n\n${url}`;

        const result = await this.getlateService.publishToTwitter({
          profileId: socialProfiles.twitter.profileId,
          text,
          imageUrl: noticia.featuredImage?.large,
        });

        results.twitter = {
          published: result.success,
          tweetId: result.postId,
          url: result.url,
          publishedAt: result.success ? new Date() : undefined,
          error: result.error,
        };
      }
    }

    // Guardar resultados en noticia
    if (!noticia.socialMediaPublishing) {
      noticia.socialMediaPublishing = [];
    }

    noticia.socialMediaPublishing.push({
      siteId: new Types.ObjectId(siteId),
      siteName,
      ...results,
    });

    await noticia.save();

    this.logger.log(`Social publishing completed for ${noticiaId} in ${siteName}`);

    return results;
  }
}
```

#### Registrar Módulo:
```typescript
// src/social-media/social-media.module.ts
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PublishedNoticia.name, schema: PublishedNoticiaSchema },
      { name: SiteConfig.name, schema: SiteConfigSchema },
    ]),
    BullModule.registerQueue({
      name: 'social-publishing',
    }),
  ],
  providers: [
    GetlateService,
    SocialPublisherService,
    SocialPublishingProcessor,
  ],
  exports: [GetlateService],
})
export class SocialMediaModule {}
```

```typescript
// src/app.module.ts - AGREGAR:
import { SocialMediaModule } from './social-media/social-media.module';

@Module({
  imports: [
    // ... existing imports
    SocialMediaModule,
  ],
})
export class AppModule {}
```

#### Testing:
1. Publicar una noticia en 2 sitios
2. Verificar que se agregue a cola `social-publishing`
3. Esperar delay
4. Verificar post en Facebook (manualmente o via API de Getlate)
5. Verificar tweet en Twitter
6. Verificar metadata en `socialMediaPublishing` array

#### Entregables:
- ✅ Getlate SDK configurado
- ✅ Publicación Facebook funcional
- ✅ Publicación Twitter funcional
- ✅ Cola de procesamiento activa
- ✅ Manejo de errores y retries
- ✅ **BUILD BACKEND** ✅

---

### FASE 5: Frontend Public - Header de Dominio
**Duración**: 1-2 horas | **Prioridad**: 🟡 MEDIA

#### Archivos a Modificar:

1. **`src/features/noticias/server/getNoticias.ts`**
```typescript
// LÍNEA 47-58 - REEMPLAZAR:
const url = `${API_BASE_URL}/pachuca-noticias?${queryParams.toString()}`;

const response = await fetch(url, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  next: { revalidate: 120 },
});

// POR:
const url = `${API_BASE_URL}/pachuca-noticias?${queryParams.toString()}`;

// Obtener dominio del request actual
const currentDomain = typeof window !== 'undefined'
  ? window.location.hostname
  : 'noticiaspachuca.com'; // Default para SSR

const response = await fetch(url, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'X-Site-Domain': currentDomain, // AGREGAR ESTE HEADER
  },
  next: { revalidate: 120 },
});
```

2. **`src/features/noticias/server/getNoticiaBySlug.ts`**
```typescript
// LÍNEA 19-30 - REEMPLAZAR:
const url = `${API_BASE_URL}/pachuca-noticias/slug/${slug}`;

const response = await fetch(url, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  next: { revalidate: 300 },
});

// POR:
const url = `${API_BASE_URL}/pachuca-noticias/slug/${slug}`;

const currentDomain = typeof window !== 'undefined'
  ? window.location.hostname
  : 'noticiaspachuca.com';

const response = await fetch(url, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'X-Site-Domain': currentDomain,
  },
  next: { revalidate: 300 },
});
```

3. **Repetir para otros server actions**:
- `getNoticiasByCategory.ts`
- `getNoticiasByTag.ts`
- `getNoticiasByAuthor.ts`
- `searchNoticias.ts`
- `getRelatedNoticias.ts`

#### Testing:
1. Abrir noticiaspachuca.com
2. Verificar que se filtren noticias de ese sitio
3. Abrir tuzona.noticiaspachuca.com (cuando exista)
4. Verificar que se filtren noticias de ese sitio

#### Entregables:
- ✅ Header agregado en todos los server actions
- ✅ Filtrado por dominio funcional
- ✅ **NO BUILD FRONT** (TanStack Start auto-rebuild)

---

### FASE 6: Mobile - Tab "Redes", Dashboard y Formulario de Creación
**Duración**: 4-5 horas | **Prioridad**: 🟡 MEDIA (APROBADA por Coyotito)

#### Archivos a Modificar:

1. **`app/(protected)/(tabs)/_layout.tsx`**
```typescript
// Cambiar tab "stats" por "redes"
<Tabs.Screen
  name="redes" // CAMBIAR DE "stats"
  options={{
    title: 'Redes',
    tabBarIcon: ({ color }) => <Share2 size={24} color={color} />,
  }}
/>
```

2. **Renombrar archivo**:
```bash
mv app/(protected)/(tabs)/stats.tsx app/(protected)/(tabs)/redes.tsx
```

3. **Agregar ruta para crear sitio**:
```bash
# Crear nueva ruta
touch app/(protected)/redes/create.tsx
```

#### Archivos a Crear:

1. **`app/(protected)/(tabs)/redes.tsx`**
```typescript
export default function RedesScreen() {
  const { data: sites, isLoading } = useSites();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header con botón crear */}
        <View style={styles.header}>
          <ThemedText variant="title-large" style={styles.title}>
            Redes Sociales
          </ThemedText>
          <TouchableOpacity
            onPress={() => router.push('/redes/create')}
            activeOpacity={0.7}
            style={styles.createButton}
          >
            <View style={styles.createButtonContent}>
              <Plus size={20} color="#000" strokeWidth={2.5} />
              <Text style={styles.createButtonText}>Crear Sitio</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Lista de sitios */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#f1ef47" />
        ) : (
          <>
            {sites?.map(site => (
              <Card key={site.id} style={styles.siteCard}>
                <CardHeader>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <CardTitle>{site.name}</CardTitle>
                      <CardDescription>{site.domain}</CardDescription>
                    </View>
                    <Badge variant={site.isActive ? 'default' : 'secondary'}>
                      <Text style={styles.badgeText}>
                        {site.isActive ? 'Activo' : 'Inactivo'}
                      </Text>
                    </Badge>
                  </View>
                </CardHeader>
                <CardContent>
                  {/* Iconos de redes sociales */}
                  <View style={styles.socialIcons}>
                    {site.hasFacebook && (
                      <Badge variant="outline" style={styles.socialBadge}>
                        <Facebook size={14} color="#1877f2" />
                        <Text style={styles.socialText}>Facebook</Text>
                      </Badge>
                    )}
                    {site.hasTwitter && (
                      <Badge variant="outline" style={styles.socialBadge}>
                        <Twitter size={14} color="#1da1f2" />
                        <Text style={styles.socialText}>Twitter</Text>
                      </Badge>
                    )}
                  </View>

                  {/* Estadísticas rápidas */}
                  <View style={styles.stats}>
                    <View style={styles.statItem}>
                      <ThemedText variant="label-small" color="secondary">
                        Posts hoy
                      </ThemedText>
                      <ThemedText variant="title-medium">12</ThemedText>
                    </View>
                    <View style={styles.statItem}>
                      <ThemedText variant="label-small" color="secondary">
                        Engagement
                      </ThemedText>
                      <ThemedText variant="title-medium">4.2%</ThemedText>
                    </View>
                  </View>

                  <Separator style={{ marginVertical: 12 }} />

                  <Button
                    onPress={() => router.push(`/redes/${site.id}`)}
                    variant="outline"
                  >
                    Ver Dashboard Completo
                  </Button>
                </CardContent>
              </Card>
            ))}

            {/* Empty state */}
            {sites?.length === 0 && (
              <Card style={styles.emptyCard}>
                <CardContent style={styles.emptyContent}>
                  <Globe size={48} color="#9CA3AF" />
                  <ThemedText variant="title-medium" style={styles.emptyTitle}>
                    No hay sitios configurados
                  </ThemedText>
                  <ThemedText variant="body-medium" color="secondary" style={styles.emptyText}>
                    Crea tu primer sitio para comenzar a publicar en redes sociales
                  </ThemedText>
                  <Button
                    onPress={() => router.push('/redes/create')}
                    style={{ marginTop: 16 }}
                  >
                    Crear Primer Sitio
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
```

2. **`app/(protected)/redes/[siteId].tsx`**
```typescript
export default function RedesDetailScreen() {
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  const { data: stats } = useSocialMediaStats(siteId!);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <ThemedText variant="title-large">{stats?.site.name}</ThemedText>

        <Card>
          <CardHeader>
            <CardTitle>📘 Facebook</CardTitle>
          </CardHeader>
          <CardContent>
            <ThemedText>Posts hoy: {stats?.facebook.postsToday}</ThemedText>
            <ThemedText>Engagement: {stats?.facebook.avgEngagement}%</ThemedText>

            {/* Lista de posts recientes */}
            <FlatList
              data={stats?.facebook.recentPosts}
              renderItem={({ item }) => (
                <View style={styles.postItem}>
                  <ThemedText>{item.text}</ThemedText>
                  <ThemedText variant="label-small" color="secondary">
                    {item.publishedAt}
                  </ThemedText>
                </View>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🐦 Twitter</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Similar a Facebook */}
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
```

3. **`app/(protected)/redes/create.tsx` (NUEVO)**
```typescript
import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, Switch } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/src/components/ThemedText';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useCreateSite } from '@/src/hooks/useSites';

export default function CreateSiteScreen() {
  const router = useRouter();
  const createSite = useCreateSite();

  // State del formulario
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    baseUrl: '',
    isActive: true,
    // Facebook
    facebookEnabled: false,
    facebookProfileId: '',
    facebookMaxPosts: 10,
    // Twitter
    twitterEnabled: false,
    twitterProfileId: '',
    twitterMaxPosts: 15,
    // Publishing
    autoPublish: true,
    defaultCategory: 'general',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.domain.trim()) {
      newErrors.domain = 'El dominio es requerido';
    } else if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(formData.domain)) {
      newErrors.domain = 'Formato de dominio inválido (ej: noticiaspachuca.com)';
    }

    if (!formData.baseUrl.trim()) {
      newErrors.baseUrl = 'La URL base es requerida';
    } else if (!/^https?:\/\/.+/.test(formData.baseUrl)) {
      newErrors.baseUrl = 'Debe ser una URL válida (ej: https://noticiaspachuca.com)';
    }

    if (formData.facebookEnabled && !formData.facebookProfileId.trim()) {
      newErrors.facebookProfileId = 'El Profile ID de Facebook es requerido si está habilitado';
    }

    if (formData.twitterEnabled && !formData.twitterProfileId.trim()) {
      newErrors.twitterProfileId = 'El Profile ID de Twitter es requerido si está habilitado';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await createSite.mutateAsync({
        name: formData.name,
        domain: formData.domain,
        baseUrl: formData.baseUrl,
        isActive: formData.isActive,
        socialProfiles: {
          facebook: formData.facebookEnabled ? {
            profileId: formData.facebookProfileId,
            isActive: true,
            maxPostsPerDay: formData.facebookMaxPosts,
          } : undefined,
          twitter: formData.twitterEnabled ? {
            profileId: formData.twitterProfileId,
            isActive: true,
            maxPostsPerDay: formData.twitterMaxPosts,
          } : undefined,
        },
        publishing: {
          autoPublish: formData.autoPublish,
          defaultCategory: formData.defaultCategory,
        },
      });

      // Éxito - navegar de regreso
      router.back();
    } catch (error) {
      setErrors({ submit: 'Error al crear el sitio. Intenta de nuevo.' });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Crear Sitio' }} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Información General */}
        <Card style={styles.section}>
          <CardHeader>
            <CardTitle>
              <ThemedText variant="title-medium">Información General</ThemedText>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.field}>
              <Label>Nombre del Sitio *</Label>
              <Input
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Noticias Pachuca"
                error={errors.name}
              />
            </View>

            <View style={styles.field}>
              <Label>Dominio *</Label>
              <Input
                value={formData.domain}
                onChangeText={(text) => setFormData({ ...formData, domain: text.toLowerCase() })}
                placeholder="noticiaspachuca.com"
                keyboardType="url"
                autoCapitalize="none"
                error={errors.domain}
              />
              <ThemedText variant="body-small" color="secondary" style={{ marginTop: 4 }}>
                Solo el dominio, sin https://
              </ThemedText>
            </View>

            <View style={styles.field}>
              <Label>URL Base *</Label>
              <Input
                value={formData.baseUrl}
                onChangeText={(text) => setFormData({ ...formData, baseUrl: text })}
                placeholder="https://noticiaspachuca.com"
                keyboardType="url"
                autoCapitalize="none"
                error={errors.baseUrl}
              />
            </View>

            <View style={styles.switchField}>
              <View style={{ flex: 1 }}>
                <Label>Sitio Activo</Label>
                <ThemedText variant="body-small" color="secondary">
                  Permite publicar contenido
                </ThemedText>
              </View>
              <Switch
                value={formData.isActive}
                onValueChange={(value) => setFormData({ ...formData, isActive: value })}
              />
            </View>
          </CardContent>
        </Card>

        {/* Facebook */}
        <Card style={styles.section}>
          <CardHeader>
            <View style={styles.cardHeaderWithSwitch}>
              <CardTitle>
                <ThemedText variant="title-medium">📘 Facebook</ThemedText>
              </CardTitle>
              <Switch
                value={formData.facebookEnabled}
                onValueChange={(value) => setFormData({ ...formData, facebookEnabled: value })}
              />
            </View>
          </CardHeader>
          {formData.facebookEnabled && (
            <CardContent>
              <View style={styles.field}>
                <Label>Profile ID de Getlate *</Label>
                <Input
                  value={formData.facebookProfileId}
                  onChangeText={(text) => setFormData({ ...formData, facebookProfileId: text })}
                  placeholder="abc123xyz"
                  error={errors.facebookProfileId}
                />
                <ThemedText variant="body-small" color="secondary" style={{ marginTop: 4 }}>
                  Obtén este ID desde tu dashboard de Getlate
                </ThemedText>
              </View>

              <View style={styles.field}>
                <Label>Máximo de Posts por Día</Label>
                <Input
                  value={formData.facebookMaxPosts.toString()}
                  onChangeText={(text) => setFormData({ ...formData, facebookMaxPosts: parseInt(text) || 10 })}
                  keyboardType="number-pad"
                />
              </View>
            </CardContent>
          )}
        </Card>

        {/* Twitter */}
        <Card style={styles.section}>
          <CardHeader>
            <View style={styles.cardHeaderWithSwitch}>
              <CardTitle>
                <ThemedText variant="title-medium">🐦 Twitter</ThemedText>
              </CardTitle>
              <Switch
                value={formData.twitterEnabled}
                onValueChange={(value) => setFormData({ ...formData, twitterEnabled: value })}
              />
            </View>
          </CardHeader>
          {formData.twitterEnabled && (
            <CardContent>
              <View style={styles.field}>
                <Label>Profile ID de Getlate *</Label>
                <Input
                  value={formData.twitterProfileId}
                  onChangeText={(text) => setFormData({ ...formData, twitterProfileId: text })}
                  placeholder="xyz789abc"
                  error={errors.twitterProfileId}
                />
              </View>

              <View style={styles.field}>
                <Label>Máximo de Tweets por Día</Label>
                <Input
                  value={formData.twitterMaxPosts.toString()}
                  onChangeText={(text) => setFormData({ ...formData, twitterMaxPosts: parseInt(text) || 15 })}
                  keyboardType="number-pad"
                />
              </View>
            </CardContent>
          )}
        </Card>

        {/* Configuración de Publicación */}
        <Card style={styles.section}>
          <CardHeader>
            <CardTitle>
              <ThemedText variant="title-medium">⚙️ Configuración</ThemedText>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.switchField}>
              <View style={{ flex: 1 }}>
                <Label>Auto-Publicar</Label>
                <ThemedText variant="body-small" color="secondary">
                  Publicar automáticamente cuando se genera contenido
                </ThemedText>
              </View>
              <Switch
                value={formData.autoPublish}
                onValueChange={(value) => setFormData({ ...formData, autoPublish: value })}
              />
            </View>

            <View style={styles.field}>
              <Label>Categoría por Defecto</Label>
              <Input
                value={formData.defaultCategory}
                onChangeText={(text) => setFormData({ ...formData, defaultCategory: text })}
                placeholder="general"
              />
            </View>
          </CardContent>
        </Card>

        {/* Error de submit */}
        {errors.submit && (
          <Card style={[styles.section, styles.errorCard]}>
            <CardContent>
              <ThemedText variant="body-medium" style={styles.errorText}>
                ❌ {errors.submit}
              </ThemedText>
            </CardContent>
          </Card>
        )}

        {/* Botones */}
        <View style={styles.buttons}>
          <Button
            variant="outline"
            onPress={() => router.back()}
            style={{ flex: 1 }}
          >
            Cancelar
          </Button>

          <Button
            onPress={handleSubmit}
            disabled={createSite.isPending}
            style={{ flex: 1, backgroundColor: '#f1ef47' }}
          >
            {createSite.isPending ? 'Creando...' : 'Crear Sitio'}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  switchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  cardHeaderWithSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  errorCard: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#DC2626',
  },
});
```

4. **`src/hooks/useSocialMediaStats.ts`**
```typescript
export function useSocialMediaStats(siteId: string) {
  return useQuery({
    queryKey: ['social-stats', siteId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/sites/${siteId}/social-stats`);
      return response.json();
    },
  });
}
```

5. **`src/hooks/useSites.ts` - ACTUALIZAR con mutation**
```typescript
// AGREGAR al hook existente:
export function useCreateSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSiteDto) => {
      const response = await fetch(`${API_URL}/sites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear sitio');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
  });
}

export function useUpdateSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSiteDto }) => {
      const response = await fetch(`${API_URL}/sites/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar sitio');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
  });
}

export function useDeleteSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_URL}/sites/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar sitio');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
  });
}
```

#### Backend Endpoint (BONUS):
```typescript
// src/sites/controllers/sites.controller.ts
@Get(':id/social-stats')
async getSocialStats(@Param('id') id: string) {
  const site = await this.sitesService.findById(id);

  // Obtener estadísticas de publishedNoticias
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const noticias = await this.publishedNoticiaModel.find({
    publishedSites: id,
    'socialMediaPublishing.publishedAt': { $gte: today },
  }).limit(10);

  return {
    site: {
      name: site.name,
      domain: site.domain,
    },
    facebook: {
      postsToday: noticias.filter(n => n.socialMediaPublishing.some(s => s.facebook?.published)).length,
      avgEngagement: 4.2, // TODO: Calcular real
      recentPosts: noticias.map(n => ({
        text: n.socialMediaCopies?.facebook?.copy,
        publishedAt: n.publishedAt,
      })),
    },
    twitter: {
      tweetsToday: noticias.filter(n => n.socialMediaPublishing.some(s => s.twitter?.published)).length,
      avgEngagement: 3.8,
      recentTweets: noticias.map(n => ({
        text: n.socialMediaCopies?.twitter?.tweet,
        publishedAt: n.publishedAt,
      })),
    },
  };
}
```

#### Testing:
- Navegar a tab "Redes"
- Ver lista de sitios (o empty state si no hay)
- Click en "Crear Sitio"
- Llenar formulario completo
- Habilitar Facebook y/o Twitter
- Guardar
- Verificar que aparezca en la lista
- Click en "Ver Dashboard"
- Ver estadísticas de Facebook y Twitter
- Ver lista de posts recientes

#### Entregables:
- ✅ Tab "Redes" funcional con botón crear
- ✅ Formulario completo de creación de sitios
- ✅ Validaciones del formulario
- ✅ Lista de sitios con badges de redes
- ✅ Pantalla de detalle con estadísticas
- ✅ Mutations (create, update, delete)
- ✅ Empty state cuando no hay sitios
- ✅ **NO BUILD FRONT**

---

## ✅ Checklist de Tareas Completo

### FASE 1: Prompts y Editor ✅
- [ ] `content-generation.service.ts:873-1041` - Actualizar prompts
- [ ] Crear `content-editor.service.ts`
- [ ] Crear `plagiarism-detector.ts`
- [ ] Crear `html-enricher.ts`
- [ ] Tests unitarios
- [ ] **BUILD BACKEND** ✅

### FASE 2: Multi-Sitio ✅
- [ ] Crear módulo `sites/` completo
- [ ] Schema `SiteConfig`
- [ ] CRUD completo en `sites.controller.ts`
- [ ] Seed noticiaspachuca.com
- [ ] Modificar `PublishedNoticia` schema
- [ ] Modificar `publish.service.ts:106` - Quitar hardcode
- [ ] Modificar `publish.service.ts:42` - Publicar en múltiples sitios
- [ ] Modificar `pachuca-noticias.controller.ts:66` - Agregar header detection
- [ ] Modificar `publishService.queryNoticias()` - Filtrar por sitio
- [ ] **BUILD BACKEND** ✅

### FASE 3: Mobile Galería ✅
- [ ] Modificar `generated/[id].tsx` - Agregar galería
- [ ] Crear `ImageGallerySection.tsx`
- [ ] Crear `useImagesByKeywords.ts`
- [ ] Crear `SiteSelector.tsx`
- [ ] Crear `useSites.ts`
- [ ] Crear `usePublishToSites.ts`
- [ ] **NO BUILD FRONT**

### FASE 4: Getlate ✅
- [ ] Install `axios @getlate/sdk`
- [ ] Agregar `.env` keys
- [ ] Crear módulo `social-media/`
- [ ] Crear `GetlateService`
- [ ] Crear `SocialPublisherService`
- [ ] Crear `SocialPublishingProcessor`
- [ ] Registrar en `app.module.ts`
- [ ] Testing manual en Facebook/Twitter
- [ ] **BUILD BACKEND** ✅

### FASE 5: Public Header ✅
- [ ] Modificar `getNoticias.ts:47` - Agregar header
- [ ] Modificar `getNoticiaBySlug.ts:19` - Agregar header
- [ ] Modificar `getNoticiasByCategory.ts` - Agregar header
- [ ] Modificar `getNoticiasByTag.ts` - Agregar header
- [ ] Modificar `getNoticiasByAuthor.ts` - Agregar header
- [ ] Modificar `searchNoticias.ts` - Agregar header
- [ ] Modificar `getRelatedNoticias.ts` - Agregar header
- [ ] **NO BUILD FRONT**

### FASE 6: Tab Redes ✅ (APROBADA)
- [ ] Modificar `(tabs)/_layout.tsx` - Cambiar "stats" → "redes"
- [ ] Renombrar `stats.tsx` → `redes.tsx`
- [ ] Crear `redes/create.tsx` - Formulario completo
- [ ] Crear `redes/[siteId].tsx` - Dashboard detallado
- [ ] Actualizar `useSites.ts` - Agregar mutations (create, update, delete)
- [ ] Crear `useSocialMediaStats.ts`
- [ ] Agregar componentes UI faltantes (Input, Label, Switch)
- [ ] Crear endpoint `GET /sites/:id/social-stats`
- [ ] Empty state en lista de sitios
- [ ] Validaciones del formulario
- [ ] **NO BUILD FRONT**

---

## 📝 Notas Finales

### ¿Por qué este plan es MEJOR?
1. ✅ Basado en código REAL existente
2. ✅ Líneas de código específicas a modificar
3. ✅ Archivos exactos que existen y que faltan
4. ✅ No duplica lo que ya funciona
5. ✅ Cada fase es independiente
6. ✅ Backward compatible

### Estimación Total Actualizada
- **Backend**: 10-14 horas
- **Mobile**: 8-11 horas (incluye formulario de sitios)
- **Public**: 1-2 horas
- **Testing**: 3-4 horas
- **TOTAL**: 22-31 horas (~3-4 días)

### Componentes UI Faltantes a Verificar
En Fase 6 necesitamos estos componentes en mobile. Verificar si existen:
- `components/ui/input.tsx` - Para formulario
- `components/ui/label.tsx` - Para labels de campos
- Si no existen, crearlos basados en shadcn/ui React Native

### Prioridades Actualizadas (Aprobadas por Coyotito)
1. 🔴 **Fase 1 y 2**: Sin esto, no hay multi-sitio ni mejoras - CRÍTICO
2. 🔴 **Fase 4**: Core feature de redes sociales con Getlate - CRÍTICO
3. 🟡 **Fase 3 y 5**: Mejoran UX del mobile y public - ALTA
4. 🟡 **Fase 6**: Tab Redes CON formulario de creación - MEDIA (Aprobada)

---

**Documento creado por:** Jarvis AI Assistant
**Última actualización:** 11 Octubre 2025
**Versión:** 2.0 (REAL CODE ANALYSIS)
