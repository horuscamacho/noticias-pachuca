# 📱 Feature: Publicación Automática en Redes Sociales Multi-Sitio

**Versión:** 2.0 (REVISADO con análisis de código real)
**Fecha:** 11 Octubre 2025
**Estado:** 🟡 Pendiente de Aprobación

---

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Análisis del Sistema Actual](#análisis-del-sistema-actual)
3. [Cambios Necesarios](#cambios-necesarios)
4. [Plan de Implementación por Fases](#plan-de-implementación-por-fases)
5. [Checklist de Tareas](#checklist-de-tareas)

---

## 🎯 Resumen Ejecutivo

### Objetivo
Extender el sistema actual de publicación para:
- Mejorar copies de redes sociales con engagement alto pero serio
- Detectar y eliminar plagios automáticamente
- Enriquecer HTML con clases brutalistas
- Soportar multi-sitio (noticiaspachuca.com, tuzona.noticiaspachuca.com, etc)
- Publicar automáticamente en Facebook y Twitter vía Getlate
- Agregar galería de imágenes por keywords en mobile

### Problemas Actuales Identificados
1. ❌ **Copies genéricos**: OpenAI genera copies poco engaging
2. ❌ **Plagios evidentes**: "PACHUCA DE SOTO / Hidalgo Sport /.-" en contenido
3. ❌ **HTML plano**: Sin clases para diseño brutalista
4. ❌ **Single-site hardcoded**: `baseUrl = 'https://noticiaspachuca.com'` (línea 106, publish.service.ts)
5. ❌ **Sin Getlate**: No hay integración con redes sociales
6. ❌ **UX incompleta**: Falta galería de imágenes en `/generated/[id]`

---

## 🔍 Investigación y Análisis

### 1. Mejores Prácticas de Engagement 2025

#### Estrategias Generales
- **Posting Frequency**: 48-72 posts por semana (7-10 diarios)
- **Response Time**: <1 hora para respuestas aumenta lealtad
- **Contenido Mix**: 60-80% entretener/educar, 20-40% promover
- **Video First**: Prioridad a Reels, TikTok, video corto

#### Breaking News Específico
- **Velocidad crítica**: Primeros 24 horas = 17% más engagement
- **Actualización continua**: Threads en Twitter para desarrollos
- **Personal Stories**: Romper fatiga de noticias políticas
- **Datos concretos**: Números específicos > descripciones generales

### 2. Análisis de Getlate API

#### Capacidades
- **Plan Unlimited**: $999/mes, posts ilimitados
- **Platforms**: Facebook, Twitter, Instagram, LinkedIn, TikTok, YouTube, Threads, Reddit, Pinterest, Bluesky
- **Rate Handling**: Automático por platform
- **Uptime**: 99.97%
- **Docs**: https://getlate.dev/docs

#### Rate Limits Reales
- Facebook: ~200 posts/día (API limit)
- Twitter: ~2400 tweets/día (standard limit)
- **Nuestra estrategia**: Máximo 10-15 posts/día por plataforma por sitio

### 3. Estrategia de Hashtags 2025

#### Twitter/X
- **Cantidad**: 1-2 hashtags máximo
- **Longitud**: <11 caracteres
- **Engagement**: -17% con >2 hashtags
- **Trending**: Participar solo cuando sea relevante

#### Facebook
- **Cantidad**: 1-2 hashtags máximo
- **Correlación**: <5% impacto en engagement
- **Estrategia**: Usar más para categorización interna que viral

#### Formato Recomendado
```
Noticias Generales:
#Pachuca #Hidalgo + 1 específico (#Deportes, #Política, etc)

Breaking News:
#ÚltimaHora #Pachuca + trending relacionado
```

### 4. Writes Copies Engaging pero Serios

#### Fórmula Facebook (AIDA PLUS)
```
[Hook provocativo con dato sorprendente]

[Contexto en 2-3 líneas que amplía hook]

[Beneficio personal: "Esto significa que tú..."]

[CTA específico con urgencia]

Emojis: 2-3 estratégicos, no saturar
```

#### Fórmula Twitter (Viral 2025)
```
[Mini-titular impactante]
[Dato concreto verificable]
[Implicación personal]
[Pregunta de engagement]

Hashtags: 1-2 relevantes
Emojis: 1-2 máximo
```

### 5. Análisis del Sistema Actual

#### Backend (api-nueva)

**Schemas Existentes:**
- `AIContentGeneration`: ✅ Tiene `socialMediaCopies` básico
- `ExtractedNoticia`: ✅ Tiene keywords para banco de imágenes
- `PublishedNoticia`: ⚠️ Tiene `socialMediaPublishing` pero single-site

**Servicios Existentes:**
- `ContentGenerationService`: ✅ Genera contenido con OpenAI
- `PaginationService`: ✅ Listo para filtros
- No existe: ❌ EditorService, ❌ PublisherService, ❌ SocialMediaService

**Módulos Existentes:**
- `ImageBankModule`: ✅ Listo para vincular por keywords

#### Frontend (mobile-expo)

**Pantallas Existentes:**
- `app/(protected)/(tabs)/extract.tsx`: ✅ Lista de outlets
- `app/(protected)/extracted/[id].tsx`: ✅ Detalle de contenido extraído (modificar)
- `app/(protected)/generated/[id].tsx`: ❌ No existe (crear)
- `app/(protected)/(tabs)/stats.tsx`: ⚠️ Renombrar a "Redes"

**Hooks Existentes:**
- `useExtractedContent`: ✅
- `useGeneratedContent`: ✅
- `useContentGenerationSocket`: ✅ Para logs en tiempo real
- No existe: ❌ usePublishContent, ❌ useSocialMediaSites

---

## 🏗️ Arquitectura del Sistema

### Flujo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                    1. EXTRACCIÓN (Existente)                     │
│                                                                   │
│  ExtractedNoticia → keywords → ImageBank (vincular)              │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│              2. GENERACIÓN CON PROMPTS MEJORADOS                 │
│                                                                   │
│  ContentGenerationService (MEJORADO)                             │
│  ├─ Prompt optimizado con fórmulas AIDA + Viral 2025            │
│  ├─ Genera: title, content, socialCopies MEJORADO               │
│  └─ Output: AIContentGeneration (status: completed)             │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│              3. REVISIÓN EDITORIAL (NUEVO)                       │
│                                                                   │
│  ContentEditorService (CREAR)                                    │
│  ├─ Detecta plagios (ej: "PACHUCA DE SOTO / Hidalgo Sport")    │
│  ├─ Corrige ortografía en citas                                 │
│  ├─ Enriquece HTML con tags brutalistas                         │
│  ├─ Valida copys sociales (no genéricos)                        │
│  └─ Output: AIContentGeneration (status: reviewed)              │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│              4. SELECCIÓN DE SITIOS (NUEVO - Mobile)             │
│                                                                   │
│  Screen: generated/[id].tsx                                      │
│  ├─ Muestra contenido generado + revisado                        │
│  ├─ Galería de imágenes (3 secciones):                          │
│  │   ├─ Original (si está en banco)                             │
│  │   ├─ Generadas AI                                            │
│  │   └─ Relacionadas por keywords                               │
│  ├─ Selector multi-sitio (checkboxes)                           │
│  │   └─ Cada sitio muestra: nombre, dominio, FB/Twitter icons   │
│  └─ Botón: "Publicar en N sitios"                               │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│              5. PUBLICACIÓN WEB (MEJORADO)                       │
│                                                                   │
│  PublishingService (MODIFICAR)                                   │
│  ├─ Crea PublishedNoticia POR CADA sitio seleccionado           │
│  ├─ publishTargets: SiteConfig[] (NUEVO campo)                  │
│  ├─ Genera slug único: {slug}-{siteId}                          │
│  ├─ Cola inteligente por tipo:                                  │
│  │   ├─ Breaking: prioridad 9, delay 2-5 min                    │
│  │   ├─ Noticia: prioridad 5, delay 10-20 min                   │
│  │   └─ Blog: prioridad 3, delay 30-60 min                      │
│  └─ Emite evento: content.published                             │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│         6. PUBLICACIÓN REDES SOCIALES (NUEVO)                    │
│                                                                   │
│  SocialMediaPublisherService (CREAR)                             │
│  ├─ Escucha: content.published                                  │
│  ├─ Por cada sitio publicado:                                   │
│  │   ├─ Obtiene SiteConfig → social profiles (Getlate IDs)     │
│  │   ├─ Construye copy con URL real del sitio                   │
│  │   ├─ Publica via Getlate API:                                │
│  │   │   ├─ Facebook: hook + copy + link + 2-3 emojis          │
│  │   │   └─ Twitter: tweet + link + 1-2 hashtags               │
│  │   └─ Guarda metadata en publishedNoticia.socialMediaPublishing│
│  └─ Manejo de errores y retry                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Nuevo Schema: SiteConfig

```typescript
{
  _id: ObjectId,
  name: "Noticias Pachuca", // Nombre display
  domain: "noticiaspachuca.com", // Para filtrar requests
  baseUrl: "https://noticiaspachuca.com",
  isActive: boolean,

  // Perfiles de Getlate
  socialProfiles: {
    facebook?: {
      profileId: string, // Getlate profile ID
      isActive: boolean,
      maxPostsPerDay: 10
    },
    twitter?: {
      profileId: string,
      isActive: boolean,
      maxPostsPerDay: 15
    }
  },

  // Configuración de publicación
  publishing: {
    autoPublish: boolean,
    defaultCategory: ObjectId,
    defaultAuthor: string
  },

  createdAt: Date,
  updatedAt: Date
}
```

### Modificaciones a PublishedNoticia

```typescript
// AGREGAR estos campos:

@Prop({ type: [Types.ObjectId], ref: 'SiteConfig', required: true })
publishedSites: Types.ObjectId[]; // Array de sitios donde se publicó

@Prop({ type: [Object] })
socialMediaPublishing: Array<{
  siteId: Types.ObjectId; // Referencia al sitio
  siteName: string; // Denormalizado para queries
  facebook?: {
    published: boolean;
    postId?: string; // Getlate post ID
    url?: string; // URL del post en Facebook
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

---

## 📅 Plan de Implementación por Fases

### FASE 1: Mejora de Prompts y Editor AI (Backend)
**Duración**: 2-3 horas
**Prioridad**: 🔴 Crítica

#### Tareas:
1. **Mejorar prompts en ContentGenerationService**
   - Archivo: `content-generation.service.ts:873-1041`
   - Actualizar `preparePromptFromTemplate()` con fórmulas AIDA + Viral
   - Agregar ejemplos de hooks efectivos
   - Incluir restricciones de hashtags (1-2 max)
   - Validar longitud de copies

2. **Crear ContentEditorService (NUEVO)**
   - Ubicación: `src/content-ai/services/content-editor.service.ts`
   - Métodos:
     ```typescript
     async reviewAndEditContent(contentId: string): Promise<void>
     private detectPlagiarism(content: string): PlagiarismResult
     private enrichHtml(content: string): string
     private validateSocialCopies(copies: SocialCopies): ValidationResult
     ```
   - Agente estático (no LLM) para velocidad
   - Reglas de detección:
     - Buscar patrones: "CIUDAD, FECHA / MEDIO /.-"
     - Buscar nombres de medios conocidos en primeros 200 chars
     - Detectar quotes mal formateados

3. **Enriquecimiento HTML para Brutalismo**
   - Agregar clases del sistema de diseño de public-noticias
   - Detectar listas y agregar `<ul class="brutal-list">`
   - Detectar citas y agregar `<blockquote class="brutal-quote">`
   - Detectar énfasis y agregar `<strong class="brutal-emphasis">`

4. **Testing de prompts**
   - Probar con 5 noticias reales
   - Comparar engagement estimado vs anterior
   - Validar que no haya contenido genérico

#### Entregables:
- ✅ Prompts actualizados y documentados
- ✅ ContentEditorService funcionando
- ✅ Tests unitarios del editor
- ✅ Build exitoso del backend

---

### FASE 2: Módulo de Sitios (Backend)
**Duración**: 2-3 horas
**Prioridad**: 🟡 Alta

#### Tareas:
1. **Crear SitesModule**
   - Ubicación: `src/sites/`
   - Schema: `SiteConfig` (ver arquitectura)
   - Service: `SitesService`
   - Controller: `SitesController`
   - DTOs: Create, Update, Filters

2. **CRUD completo para sitios**
   ```typescript
   POST   /sites              // Crear sitio
   GET    /sites              // Listar todos
   GET    /sites/:id          // Obtener uno
   PUT    /sites/:id          // Actualizar
   DELETE /sites/:id          // Eliminar
   GET    /sites/by-domain    // Buscar por dominio (para filtros)
   ```

3. **Seed inicial con noticiaspachuca.com**
   - Script: `src/sites/scripts/seed-sites.ts`
   - Configuración inicial con perfiles de Getlate (fake por ahora)

4. **Modificar PublishedNoticia schema**
   - Agregar `publishedSites: Types.ObjectId[]`
   - Agregar `socialMediaPublishing` array (ver arquitectura)
   - Migración de datos existentes

5. **Actualizar filtros de noticias publicadas**
   - Detectar dominio del request (header `X-Site-Domain`)
   - Filtrar por `publishedSites` contenga el siteId
   - Mantener compatibilidad con API actual

#### Entregables:
- ✅ SitesModule completo y funcional
- ✅ Endpoints testeados con Postman/REST Client
- ✅ Seed de noticiaspachuca.com
- ✅ Filtros por sitio funcionando
- ✅ Build exitoso del backend

---

### FASE 3: Pantalla de Contenido Generado (Mobile)
**Duración**: 3-4 horas
**Prioridad**: 🟡 Alta

#### Tareas:
1. **Crear screen: generated/[id].tsx**
   - Layout similar a extracted/[id].tsx
   - Secciones:
     1. Header con título generado
     2. Preview del contenido HTML (WebView)
     3. Galería de imágenes (3 tabs):
        - Original (de extracted)
        - AI Generated (del banco)
        - Relacionadas (por keywords)
     4. Selector de sitios (multi-select)
     5. Preview de copies sociales
     6. Botón publish

2. **Hook: useImagesByKeywords**
   ```typescript
   interface ImageGalleryData {
     original: ImageBankImage | null;
     aiGenerated: ImageBankImage[];
     related: ImageBankImage[];
   }

   useImagesByKeywords(keywords: string[]): ImageGalleryData
   ```

3. **Hook: useSites**
   ```typescript
   interface Site {
     id: string;
     name: string;
     domain: string;
     hasF acebook: boolean;
     hasTwitter: boolean;
   }

   useSites(): Site[]
   ```

4. **Componente: SiteSelector**
   - Multi-select con checkboxes
   - Muestra iconos de redes activas
   - Preview de URLs finales

5. **Hook: usePublishContent**
   ```typescript
   usePublishContent(
     contentId: string,
     selectedSites: string[],
     selectedImage: string
   ): MutationResult
   ```

6. **Modificar extracted/[id].tsx**
   - Cambiar navegación de "Crear Contenido"
   - Después de generar → navegar a `/generated/[generatedId]`
   - Mostrar indicador si ya tiene contenido generado

#### Entregables:
- ✅ Pantalla generated/[id] funcional
- ✅ Galería de imágenes por keywords
- ✅ Selector multi-sitio
- ✅ Navegación actualizada
- ✅ NO correr builds del front (solo verificación visual)

---

### FASE 4: Integración con Getlate (Backend)
**Duración**: 3-4 horas
**Prioridad**: 🔴 Crítica

#### Tareas:
1. **Instalar SDK de Getlate**
   ```bash
   yarn add @getlate/sdk
   ```

2. **Crear GetlateModule**
   - Ubicación: `src/social-media/getlate/`
   - Service: `GetlateService`
   - Configuración en `.env`:
     ```
     GETLATE_API_KEY=your_key_here
     GETLATE_API_URL=https://api.getlate.io/v1
     ```

3. **GetlateService métodos**
   ```typescript
   async publishToFacebook(params: FacebookPostParams): Promise<PostResult>
   async publishToTwitter(params: TwitterPostParams): Promise<PostResult>
   async getPostStatus(postId: string): Promise<PostStatus>
   async deletePost(postId: string): Promise<void>
   private handleRateLimit(error: any): Promise<void>
   ```

4. **Crear SocialMediaPublisherService**
   - Ubicación: `src/social-media/services/publisher.service.ts`
   - Escucha evento `content.published`
   - Por cada sitio en `publishedSites`:
     - Obtiene SiteConfig
     - Construye copy con URL real
     - Llama GetlateService
     - Guarda resultado en PublishedNoticia

5. **Sistema de colas para redes**
   - Queue: `social-media-publishing`
   - Procesador: `SocialMediaPublishingProcessor`
   - Delay según prioridad:
     - Breaking: 2-5 min
     - Normal: 10-20 min
     - Blog: 30-60 min
   - Retry: 3 intentos con backoff exponencial

6. **Endpoint manual de publicación**
   ```typescript
   POST /published/:id/publish-social
   Body: {
     sites: string[]; // IDs de sitios
     platforms: ('facebook' | 'twitter')[];
   }
   ```

#### Entregables:
- ✅ GetlateModule configurado
- ✅ Publicación en Facebook funcionando
- ✅ Publicación en Twitter funcionando
- ✅ Cola de procesamiento activa
- ✅ Manejo de errores y retries
- ✅ Build exitoso del backend

---

### FASE 5: Sistema de Colas Inteligente
**Duración**: 2-3 horas
**Prioridad**: 🟡 Media

#### Tareas:
1. **Crear PublishingQueueService**
   - Ubicación: `src/publishing/services/publishing-queue.service.ts`
   - Calcula delay óptimo según:
     - Tipo de contenido (isBreaking, isNoticia, priority)
     - Hora del día (peak vs valley)
     - Cola actual de publicaciones
     - Frecuencia histórica del sitio

2. **Algoritmo de delay**
   ```typescript
   calculateOptimalDelay(content: GeneratedContent, site: SiteConfig): number {
     const baseDelay = content.isBreaking ? 2 : content.isNoticia ? 10 : 30;
     const hourMultiplier = isPeakHour() ? 0.7 : 1.3;
     const queueMultiplier = getQueueLoad() > 10 ? 1.5 : 1.0;
     const randomJitter = 0.85 + (Math.random() * 0.3); // 0.85-1.15

     return baseDelay * hourMultiplier * queueMultiplier * randomJitter;
   }
   ```

3. **Dashboard de métricas**
   - Endpoint: `GET /publishing/queue/stats`
   - Respuesta:
     ```typescript
     {
       queued: number;
       processing: number;
       completed: number;
       failed: number;
       averageDelay: number;
       nextScheduled: Date;
     }
     ```

4. **Actualizar PublishingService**
   - Usar PublishingQueueService para calcular delay
   - Guardar metadata en `schedulingMetadata`

#### Entregables:
- ✅ PublishingQueueService funcionando
- ✅ Delays inteligentes aplicados
- ✅ Dashboard de métricas
- ✅ Build exitoso del backend

---

### FASE 6: Tab de Redes (Mobile)
**Duración**: 2-3 horas
**Prioridad**: 🟢 Baja

#### Tareas:
1. **Renombrar stats → redes**
   - Archivo: `app/(protected)/(tabs)/_layout.tsx`
   - Cambiar label y icono

2. **Crear screen: redes.tsx**
   - Lista de sitios configurados
   - Por cada sitio:
     - Card con nombre + dominio
     - Estados de redes (activa/inactiva)
     - Estadísticas:
       - Posts publicados hoy
       - Engagement promedio
       - Últimos 5 posts
     - Botón "Ver Dashboard" → navega a detalle

3. **Screen detalle: redes/[siteId].tsx**
   - Tabs:
     - Facebook: Posts, estadísticas, configuración
     - Twitter: Tweets, estadísticas, configuración
   - Timeline de posts recientes
   - Gráfica de engagement

4. **Hook: useSocialMediaStats**
   ```typescript
   interface SocialStats {
     site: Site;
     facebook: {
       postsToday: number;
       avgEngagement: number;
       recentPosts: Post[];
     };
     twitter: {
       tweetsToday: number;
       avgEngagement: number;
       recentTweets: Tweet[];
     };
   }

   useSocialMediaStats(siteId: string): SocialStats
   ```

#### Entregables:
- ✅ Tab "Redes" funcional
- ✅ Lista de sitios con estadísticas
- ✅ Pantalla de detalle por sitio
- ✅ NO correr builds del front

---

### FASE 7: Testing y Refinamiento
**Duración**: 2-3 horas
**Prioridad**: 🔴 Crítica

#### Tareas:
1. **Testing end-to-end**
   - Flujo completo: Extract → Generate → Review → Publish → Social
   - Validar cada paso con logs detallados
   - Verificar metadata guardada correctamente

2. **Testing de edge cases**
   - Contenido sin imágenes
   - Contenido muy largo (>5000 palabras)
   - Sitio sin perfiles de redes
   - Fallo de Getlate API
   - Cola saturada

3. **Refinamiento de prompts**
   - Revisar 10 contenidos generados
   - Ajustar si detectamos patrones negativos
   - Documentar mejores prácticas

4. **Optimización de performance**
   - Índices de MongoDB
   - Cache de SiteConfigs
   - Batch processing de imágenes

5. **Documentación**
   - README de cada módulo nuevo
   - Postman collection actualizada
   - Diagramas de arquitectura

#### Entregables:
- ✅ Suite de tests completa
- ✅ Edge cases cubiertos
- ✅ Performance optimizado
- ✅ Documentación actualizada
- ✅ Build final del backend

---

## ✅ Checklist de Tareas Completo

### FASE 1: Prompts y Editor ✅
- [ ] Actualizar prompts con fórmulas AIDA + Viral 2025
- [ ] Crear ContentEditorService con detección de plagios
- [ ] Implementar enriquecimiento HTML brutalista
- [ ] Validar copys sociales (hooks, hashtags, longitud)
- [ ] Tests unitarios del editor
- [ ] **BUILD BACKEND** ✅

### FASE 2: Módulo de Sitios ✅
- [ ] Crear SitesModule (schema, service, controller, DTOs)
- [ ] Implementar CRUD completo
- [ ] Seed de noticiaspachuca.com
- [ ] Modificar PublishedNoticia schema (publishedSites, socialMediaPublishing)
- [ ] Actualizar filtros por dominio
- [ ] Tests de endpoints
- [ ] **BUILD BACKEND** ✅

### FASE 3: Pantalla Generado ✅
- [ ] Crear screen generated/[id].tsx
- [ ] Implementar galería de imágenes (3 secciones)
- [ ] Hook useImagesByKeywords
- [ ] Hook useSites
- [ ] Componente SiteSelector (multi-select)
- [ ] Hook usePublishContent
- [ ] Modificar extracted/[id].tsx (navegación)
- [ ] **NO BUILD FRONT** (solo verificación visual)

### FASE 4: Getlate Integration ✅
- [ ] Instalar @getlate/sdk
- [ ] Crear GetlateModule (service, config)
- [ ] Implementar publishToFacebook()
- [ ] Implementar publishToTwitter()
- [ ] Crear SocialMediaPublisherService
- [ ] Sistema de colas para redes
- [ ] Endpoint manual de publicación
- [ ] Manejo de errores y retries
- [ ] **BUILD BACKEND** ✅

### FASE 5: Colas Inteligentes ✅
- [ ] Crear PublishingQueueService
- [ ] Algoritmo de delay óptimo
- [ ] Dashboard de métricas de cola
- [ ] Actualizar PublishingService
- [ ] Tests de cálculo de delays
- [ ] **BUILD BACKEND** ✅

### FASE 6: Tab Redes ✅
- [ ] Renombrar tab stats → redes
- [ ] Crear screen redes.tsx (lista sitios)
- [ ] Crear screen redes/[siteId].tsx (detalle)
- [ ] Hook useSocialMediaStats
- [ ] Timeline de posts recientes
- [ ] **NO BUILD FRONT**

### FASE 7: Testing Final ✅
- [ ] Testing end-to-end completo
- [ ] Testing edge cases
- [ ] Refinamiento de prompts (revisar 10 contenidos)
- [ ] Optimización de performance (índices, cache)
- [ ] Documentación completa (READMEs, Postman)
- [ ] **BUILD BACKEND FINAL** ✅

---

## 📊 Métricas de Éxito

### KPIs Técnicos
- ✅ 0 plagios detectados en revisión manual
- ✅ <500ms tiempo de detección de plagios
- ✅ 99% uptime de publicación en Getlate
- ✅ <5min delay promedio para breaking news
- ✅ 0 errores no manejados en cola

### KPIs de Negocio
- 🎯 +50% engagement vs copies anteriores
- 🎯 80% de posts publicados automáticamente
- 🎯 3 sitios activos al final del Q1 2026
- 🎯 10-15 posts/día por sitio sostenible

### KPIs de Calidad
- ✅ 100% de contenido sin marcas de fuente
- ✅ 0 errores ortográficos en 50 posts revisados
- ✅ HTML enriquecido en 100% de contenidos
- ✅ 1-2 hashtags en 100% de posts

---

## 🔒 Consideraciones de Seguridad

1. **API Keys de Getlate**
   - Almacenar en `.env` nunca en código
   - Rotar cada 90 días
   - Monitorear uso para detectar anomalías

2. **Validación de Contenido**
   - Sanitizar HTML antes de enriquecer
   - Validar URLs antes de publicar
   - Rate limiting en endpoints de publicación

3. **Multi-tenancy**
   - Validar que usuario solo publique en sitios autorizados
   - Logs de auditoría por sitio
   - Separación de perfiles de Getlate

---

## 📝 Notas Finales

### Cambios No Invasivos
- ✅ No modificamos esquemas existentes (solo agregamos campos)
- ✅ Filtros actuales siguen funcionando (backward compatible)
- ✅ Contenido existente migra automáticamente
- ✅ Cada fase es independiente y rollbackeable

### Próximos Pasos Después de Fase 7
1. Agregar Instagram y LinkedIn a Getlate
2. Analytics dashboard con métricas reales de engagement
3. A/B testing de copies automático
4. Sistema de aprobación manual para breaking news sensibles
5. Integración con WhatsApp Business API

---

**Documento creado por:** Jarvis AI Assistant
**Última actualización:** 11 Octubre 2025
**Versión:** 1.0
