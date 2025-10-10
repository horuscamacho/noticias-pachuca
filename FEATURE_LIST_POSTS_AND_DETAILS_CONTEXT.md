# 📋 PLAN DE IMPLEMENTACIÓN - Lista de Posts y Detalles con Generación Masiva

**Proyecto:** Mobile Expo Dashboard - Pachuca Noticias
**Fecha:** 2025-10-09
**Desarrollador:** Jarvis para Coyotito
**Feature:** Sistema de gestión de contenido extraído con generación masiva de agentes

---

## 📊 ANÁLISIS: LO QUE TENEMOS VS LO QUE NECESITAMOS

### ✅ LO QUE YA TENEMOS

#### **Backend (api-nueva)**
- ✅ Endpoint `GET /generator-pro/content` - Lista contenido extraído con paginación
- ✅ Endpoint `GET /generator-pro/agents` - Obtiene agentes con filtros (`isActive: true`)
- ✅ Endpoint `POST /generator-pro/content/generate` - Genera contenido con un agente
- ✅ Socket events `content:generation-started`, `content:generation-completed`, `content:generation-failed`
- ✅ Modelo `ExtractedNoticia` con campos completos (id, title, content, url, websiteId, author, category, imageUrl, publishedAt, extractedAt)
- ✅ Modelo `AIContentGeneration` con campos completos (generatedTitle, generatedContent, socialMediaCopies, metadata)
- ✅ Modelo `ContentAgent` con campos completos (name, agentType, description, personality, writingStyle)

#### **Mobile (mobile-expo)**
- ✅ Patrón establecido: Servicios → Hooks → Componentes
- ✅ ApiClient con auth automática
- ✅ SocketService con listeners
- ✅ Mappers pattern
- ✅ React Query setup
- ✅ UI Components: Card, Button, Badge, Skeleton, Separator, Input, Label, Switch
- ✅ Navegación con Expo Router file-based
- ✅ NativeWind para estilos

#### **Dash Web (dash-coyote) - Referencia**
- ✅ `PostsTab.tsx` con tabla de posts extraídos
- ✅ Selector de agentes por post (Select component)
- ✅ Botón "Procesar Seleccionados" para batch generation
- ✅ Socket listeners para actualizar estados en tiempo real
- ✅ Sheet lateral para ver detalles del post
- ✅ Lista de contenidos generados dentro del post detail
- ✅ Sheet anidado para ver contenido generado completo

---

### ❌ LO QUE NECESITAMOS IMPLEMENTAR

#### **Backend (api-nueva)**
- ❌ Endpoint `GET /generator-pro/agents/:agentId/generated-contents` - Listar contenidos generados por agente
- ❌ Endpoint `POST /generator-pro/content/generate-batch` - Generar múltiples contenidos con diferentes agentes de una sola vez
- ❌ Mejora socket events con payload más completo

#### **Mobile (mobile-expo)**
- ❌ Tipos TypeScript para posts y contenido generado
- ❌ Servicio API `extractedContentApi.ts`
- ❌ Servicio API `generatedContentApi.ts`
- ❌ Servicio API `contentAgentsApi.ts`
- ❌ Mappers para transformación de datos
- ❌ Hooks React Query para cada servicio
- ❌ Hook `useContentGenerationSocket` para eventos en tiempo real
- ❌ Pantalla `/app/(protected)/(tabs)/generate.tsx` - Lista de posts
- ❌ Pantalla `/app/(protected)/extracted/[id].tsx` - Detalles del post + generación
- ❌ Componente `GeneratedContentCard` para preview de contenidos generados
- ❌ Pantalla `/app/(protected)/generated/[id].tsx` - Ver contenido generado completo

---

## 🎯 DIFERENCIAS CLAVE CON EL DASH WEB

| Característica | Dash Web | Mobile App |
|----------------|----------|------------|
| **Lista de posts** | Tabla con selector de agente por fila | Cards con tap para ir a detalle |
| **Selección de agentes** | Dropdown inline en tabla | Modal con lista de agentes en pantalla de detalle |
| **Generación batch** | Botón "Procesar Seleccionados" procesa todos los posts con agente asignado | Modal permite seleccionar múltiples agentes y genera varios contenidos del mismo post |
| **Vista de posts** | Sheet lateral (drawer) | Navegación a pantalla completa |
| **Contenidos generados** | Lista dentro del sheet del post | Cards scrollables al final de la pantalla de detalle |
| **Vista de contenido generado** | Sheet anidado | Nueva pantalla completa |

---

## 🏗️ ARQUITECTURA PROPUESTA

```
┌─────────────────────────────────────────────────────────────┐
│  GENERATE SCREEN (Lista de Posts)                           │
│  /app/(protected)/(tabs)/generate.tsx                       │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │ Post Card  │  │ Post Card  │  │ Post Card  │           │
│  │ (Tap here)│  │ (Tap here)│  │ (Tap here)│           │
│  └────────────┘  └────────────┘  └────────────┘           │
└─────────────────────────────────────────────────────────────┘
                        ↓ Navigation
┌─────────────────────────────────────────────────────────────┐
│  EXTRACTED POST DETAIL SCREEN                                │
│  /app/(protected)/extracted/[id].tsx                        │
│                                                              │
│  1. [Imagen del Post]                                       │
│  2. [Título y Contenido Extraído]                          │
│  3. [Botón "Crear Contenido" → Abre Modal de Agentes]     │
│  4. [Lista de Contenidos Generados (Cards)]                │
│     ↓ Tap en Card                                           │
└─────────────────────────────────────────────────────────────┘
                        ↓ Navigation
┌─────────────────────────────────────────────────────────────┐
│  GENERATED CONTENT DETAIL SCREEN                            │
│  /app/(protected)/generated/[id].tsx                        │
│                                                              │
│  - Título generado                                          │
│  - Contenido generado completo                             │
│  - Agente que lo generó                                     │
│  - Social Media Copys (Facebook, Twitter)                  │
│  - Metadata (tokens, costo, tiempo)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 ESTRUCTURA DE DATOS

### **ExtractedContent (Post)**
```typescript
interface ExtractedContent {
  id: string;
  title: string;
  content: string;
  url: string;
  websiteId: string;
  websiteName?: string;
  author?: string;
  category?: string;
  imageUrl?: string;
  publishedAt?: string;
  extractedAt: string;
  status: 'pending' | 'processing' | 'extracted' | 'failed';
  isProcessed: boolean;
  generatedContentCount: number; // Calculado en frontend
}
```

### **ContentAgent**
```typescript
interface ContentAgent {
  id: string;
  name: string;
  agentType: 'reportero' | 'columnista' | 'trascendido' | 'seo-specialist';
  description: string;
  personality: string;
  specializations: string[];
  editorialLean: 'conservative' | 'progressive' | 'neutral' | 'humor' | 'critical' | 'analytical';
  writingStyle: {
    tone: 'formal' | 'informal' | 'humor' | 'academic' | 'conversational';
    vocabulary: 'simple' | 'intermediate' | 'advanced' | 'technical';
    length: 'short' | 'medium' | 'long' | 'variable';
    structure: 'linear' | 'narrative' | 'analytical' | 'opinion';
    audience: 'general' | 'specialized' | 'academic' | 'youth' | 'senior';
  };
  isActive: boolean;
}
```

### **GeneratedContent**
```typescript
interface GeneratedContent {
  id: string;
  extractedNoticiaId: string;
  agentId: string;
  agentName?: string;
  generatedTitle: string;
  generatedContent: string;
  generatedSummary?: string;
  generatedKeywords?: string[];
  generatedTags?: string[];
  generatedCategory?: string;
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
  generationMetadata?: {
    model?: string;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    cost?: number;
    processingTime?: number;
    temperature?: number;
    maxTokens?: number;
    finishReason?: string;
    contentQuality?: number;
    aiProvider?: string;
  };
  createdAt: string;
  status: string;
}
```

---

## 🎨 DISEÑO UX PROPUESTO

### **Pantalla 1: Lista de Posts** (`/generate`)
```
┌─────────────────────────────────────┐
│  < Volver    Generar Contenido     │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📰 Título del Post Extraído     │ │
│ │ Fuente: El Sol de Pachuca       │ │
│ │ ───────────────────────────────  │ │
│ │ Preview: Lorem ipsum dolor...   │ │
│ │                                  │ │
│ │ 🎯 2 contenidos generados        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📰 Otro Post Extraído           │ │
│ │ Fuente: Milenio                 │ │
│ │ ───────────────────────────────  │ │
│ │ Preview: Consectetur adipis...  │ │
│ │                                  │ │
│ │ ⭕ 0 contenidos generados        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### **Pantalla 2: Detalle del Post** (`/extracted/[id]`)
```
┌─────────────────────────────────────┐
│  < Volver    Post Extraído          │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ [Imagen del Post]               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📰 Título del Post              │ │
│ │ ───────────────────────────────  │ │
│ │ Fuente: El Sol de Pachuca       │ │
│ │ Autor: Juan Pérez               │ │
│ │ Fecha: 5 Oct 2025               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Contenido Extraído              │ │
│ │ ───────────────────────────────  │ │
│ │ [Contenido completo en scroll]  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Acciones Rápidas                │ │
│ │ ───────────────────────────────  │ │
│ │ [✨ Crear Contenido]             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Contenidos Generados (2)        │ │
│ │ ───────────────────────────────  │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ 📝 Título Generado 1        │ │ │
│ │ │ Agente: Reportero Serio     │ │ │
│ │ │ Preview: Lorem ipsum...     │ │ │
│ │ └─────────────────────────────┘ │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ 📝 Título Generado 2        │ │ │
│ │ │ Agente: Columnista Humor    │ │ │
│ │ │ Preview: Consectetur...     │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### **Pantalla 2.5: Selección de Agentes** (`/extracted/[id]/select-agents`)
```
┌─────────────────────────────────────┐
│  < Volver    Seleccionar Agentes    │
├─────────────────────────────────────┤
│ Selecciona uno o varios agentes:   │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [ ] 📰 Reportero Serio          │ │
│ │     Estilo formal, académico    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [✓] 😄 Columnista con Humor     │ │
│ │     Estilo informal, divertido  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [✓] 🎯 SEO Specialist            │ │
│ │     Optimizado para búsqueda    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [ ] 💼 Analista Político        │ │
│ │     Análisis profundo, crítico  │ │
│ └─────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│  [Cancelar]  [Generar Contenido]   │
└─────────────────────────────────────┘
```

### **Pantalla 3: Contenido Generado** (`/generated/[id]`)
```
┌─────────────────────────────────────┐
│  < Volver    Contenido Generado     │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 📝 Título Generado por IA       │ │
│ │ ───────────────────────────────  │ │
│ │ Agente: Reportero Serio         │ │
│ │ Generado: 5 Oct 2025 10:30 AM   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Contenido Completo              │ │
│ │ ───────────────────────────────  │ │
│ │ [Contenido generado completo]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📱 Copy de Facebook              │ │
│ │ ───────────────────────────────  │ │
│ │ Hook: ¡Noticia de último momento!│
│ │ Copy: [Texto del post]          │ │
│ │ Emojis: 📰🔥💥                   │ │
│ │ Engagement: high                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🐦 Copy de Twitter               │ │
│ │ ───────────────────────────────  │ │
│ │ Tweet: [280 chars]              │ │
│ │ Hook: ¡Última hora!             │ │
│ │ Ideas hilo: [3 ideas]           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📊 Metadata                      │ │
│ │ ───────────────────────────────  │ │
│ │ Modelo: gpt-4                   │ │
│ │ Tokens: 2,450                   │ │
│ │ Costo: $0.0245                  │ │
│ │ Tiempo: 3.2s                    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### **FASE 1: Mobile - Infraestructura de Tipos y Servicios**
**Objetivo:** Crear toda la capa de datos (tipos, mappers, servicios API)

#### Micro-tareas:
1. **Crear tipos TypeScript**
   - Archivo: `/src/types/extracted-content.types.ts` ✨ NUEVO
   - Interfaces: `ExtractedContent`, `ExtractedContentFilters`, `ExtractedContentListResponse`

2. **Crear tipos para contenido generado**
   - Archivo: `/src/types/generated-content.types.ts` ✨ NUEVO
   - Interfaces: `GeneratedContent`, `SocialMediaCopies`, `GenerationMetadata`, `GenerateContentRequest`

3. **Crear tipos para agentes**
   - Archivo: `/src/types/content-agent.types.ts` ✨ NUEVO
   - Interfaces: `ContentAgent`, `WritingStyle`, `AgentFilters`

4. **Extender tipos de Socket**
   - Archivo: `/src/features/socket/types/socket.types.ts` 📝 MODIFICAR
   - Agregar eventos:
     ```typescript
     'content:generation-started': { extractedContentId: string; agentId: string; agentName: string }
     'content:generation-completed': { extractedContentId: string; generatedContentId: string; agentName: string }
     'content:generation-failed': { extractedContentId: string; error: string; agentId: string }
     ```

5. **Crear Mappers**
   - Archivo: `/src/utils/mappers.ts` 📝 MODIFICAR
   - Clases: `ExtractedContentMapper`, `GeneratedContentMapper`, `ContentAgentMapper`
   - Métodos: `toApp()`, `toAPI()`

6. **Crear servicio extractedContentApi**
   - Archivo: `/src/services/extracted-content/extractedContentApi.ts` ✨ NUEVO
   - Funciones:
     - `getExtractedContent(filters)` - GET /generator-pro/content
     - `getExtractedContentById(id)` - Filtrar localmente del array

7. **Crear servicio generatedContentApi**
   - Archivo: `/src/services/generated-content/generatedContentApi.ts` ✨ NUEVO
   - Funciones:
     - `getGeneratedContentByPostId(extractedNoticiaId)` - Filtrar por extractedNoticiaId
     - `getGeneratedContentById(id)` - Obtener uno específico
     - `generateContent(request)` - POST /generator-pro/content/generate
     - `generateBatch(request)` - POST /generator-pro/content/generate-batch (si existe) o múltiples llamadas

8. **Crear servicio contentAgentsApi**
   - Archivo: `/src/services/content-agents/contentAgentsApi.ts` ✨ NUEVO
   - Funciones:
     - `getAgents(filters)` - GET /generator-pro/agents?isActive=true

---

### **FASE 2: Mobile - Hooks con React Query (incluye useInfiniteQuery)**
**Objetivo:** Crear hooks para consumir los servicios con React Query

#### Micro-tareas:
1. **Crear hooks para extracted content con paginación**
   - Archivo: `/src/hooks/useExtractedContent.ts` ✨ NUEVO
   - Hooks:
     - `useExtractedContentInfinite(filters)` - **useInfiniteQuery** para scroll infinito con paginación
       - Página inicial: `page=1`, `limit=20`
       - `getNextPageParam` calcula siguiente página
       - `data.pages` contiene todas las páginas cargadas
     - `useExtractedContentById(id)` - Query para uno específico

2. **Crear hooks para generated content**
   - Archivo: `/src/hooks/useGeneratedContent.ts` ✨ NUEVO
   - Hooks:
     - `useGeneratedContentByPostId(postId)` - Query para lista por post
     - `useGeneratedContentById(id)` - Query para uno específico
     - `useGenerateContent()` - Mutation para generar uno
     - `useGenerateBatch()` - Mutation para generar varios

3. **Crear hooks para content agents**
   - Archivo: `/src/hooks/useContentAgents.ts` ✨ NUEVO
   - Hooks:
     - `useContentAgents(filters)` - Query para lista con `isActive: true`

4. **Crear hook para socket de generación**
   - Archivo: `/src/hooks/useContentGenerationSocket.ts` ✨ NUEVO
   - Escuchar eventos: `content:generation-started`, `content:generation-completed`, `content:generation-failed`
   - Invalidar queries de React Query cuando se completen generaciones
   - Mantener Set de `processingIds` para mostrar spinners

---

### **FASE 3: Mobile - Pantalla de Lista de Posts (con Scroll Infinito)**
**Objetivo:** Implementar `/app/(protected)/(tabs)/generate.tsx`

#### Micro-tareas:
1. **Crear estructura base con FlatList**
   - Archivo: `/app/(protected)/(tabs)/generate.tsx` 📝 MODIFICAR
   - Layout: SafeAreaView + **FlatList** (NO ScrollView)
   - Usar hook `useExtractedContentInfinite()`
   - Flatten todas las páginas: `data.pages.flatMap(page => page.content)`

2. **Implementar scroll infinito**
   - Prop `onEndReached={() => fetchNextPage()}`
   - Prop `onEndReachedThreshold={0.5}` (cargar cuando esté al 50% del final)
   - `ListFooterComponent`: ActivityIndicator cuando `isFetchingNextPage === true`
   - Mostrar "No hay más posts" cuando `!hasNextPage`

3. **Implementar loading state inicial**
   - Mostrar Skeleton mientras `isLoading === true`
   - Usar FlatList con skeleton items

4. **Implementar lista de posts como Cards**
   - Componente: `Pressable` wrapping `Card`
   - Prop `renderItem` de FlatList
   - Mostrar: título, fuente (websiteName), preview del contenido (100 chars)
   - Badge con número de contenidos generados
   - onPress: `router.push(\`/extracted/\${post.id}\`)`

5. **Implementar empty state**
   - Prop `ListEmptyComponent` de FlatList
   - Mensaje cuando no hay posts
   - Sugerencia de ir a tab "Extraer"

6. **Implementar error state**
   - Card con mensaje de error si `isError === true`
   - Botón de retry: `refetch()`

---

### **FASE 4: Mobile - Pantalla de Detalle del Post**
**Objetivo:** Implementar `/app/(protected)/extracted/[id].tsx`

#### Micro-tareas:
1. **Crear estructura base**
   - Archivo: `/app/(protected)/extracted/[id].tsx` ✨ NUEVO
   - Layout: SafeAreaView + ScrollView
   - Obtener id de params: `const { id } = useLocalSearchParams<{ id: string }>()`
   - Hooks: `useExtractedContentById(id)`, `useGeneratedContentByPostId(id)`, `useContentAgents({ isActive: true })`

2. **Sección 1: Imagen del Post**
   - Card con imagen si existe `imageUrl`
   - Componente: `<Image>` con fallback si falla

3. **Sección 2: Información del Post**
   - Card con: título, websiteName, author, category, publishedAt, url
   - URL como link externo

4. **Sección 3: Contenido Extraído**
   - Card con contenido completo
   - Usar ScrollView con maxHeight si es muy largo

5. **Sección 4: Acciones Rápidas**
   - Card con botón "✨ Crear Contenido"
   - onPress: Abrir Modal de selección de agentes

6. **Sección 5: Contenidos Generados**
   - Card con título "Contenidos Generados (X)"
   - Si no hay: Empty state con mensaje
   - Si hay: Lista de `GeneratedContentCard` components

7. **Navegación a selección de agentes**
   - Botón "Crear Contenido" navega a: `router.push(\`/extracted/\${id}/select-agents\`)`
   - NO usar Modal ni Sheet
   - La pantalla de selección se implementa en FASE 5

8. **Implementar estados de carga**
   - Skeleton mientras carga post
   - Deshabilitar botón "Crear Contenido" mientras genera
   - Mostrar ActivityIndicator en botón

---

### **FASE 5: Mobile - Pantalla de Selección de Agentes**
**Objetivo:** Implementar `/app/(protected)/extracted/[id]/select-agents.tsx`

#### Micro-tareas:
1. **Crear estructura base**
   - Archivo: `/app/(protected)/extracted/[id]/select-agents.tsx` ✨ NUEVO
   - Layout: SafeAreaView + ScrollView
   - Obtener id de params: `const { id } = useLocalSearchParams<{ id: string }>()`
   - Hook: `useContentAgents({ isActive: true })`

2. **Lista de agentes con checkboxes**
   - Usar FlatList o ScrollView
   - Cada item: Card con Checkbox
   - Mostrar: nombre del agente, descripción, tipo (badge)
   - Estado local: `selectedAgentIds: string[]`
   - Toggle checkbox: agregar/quitar de array

3. **Botones de acción**
   - Botón "Cancelar": `router.back()`
   - Botón "Generar Contenido": Ejecutar generación masiva
   - Deshabilitar "Generar" si no hay agentes seleccionados

4. **Lógica de generación masiva**
   - Hook: `useGenerateContent()`
   - Por cada `selectedAgentId`: llamar `generateContent.mutateAsync({ extractedContentId: id, agentId })`
   - Usar `Promise.all()` o loop secuencial
   - Mostrar ActivityIndicator durante generación

5. **Navegación de vuelta**
   - Al completar: `router.back()`
   - Los socket events actualizarán la pantalla de detalle automáticamente

---

### **FASE 6: Mobile - Componente GeneratedContentCard**
**Objetivo:** Crear card reutilizable para preview de contenido generado

#### Micro-tareas:
1. **Crear componente**
   - Archivo: `/src/components/content/GeneratedContentCard.tsx` ✨ NUEVO
   - Props: `generatedContent: GeneratedContent`, `onPress: () => void`

2. **Layout del componente**
   - Card clickeable (Pressable)
   - Mostrar: generatedTitle (bold)
   - Mostrar: agentName (muted)
   - Mostrar: preview de generatedContent (líneas limitadas, 2-3 líneas)
   - Badge con agentType

3. **Navegación**
   - onPress: `router.push(\`/generated/\${content.id}\`)`

---

### **FASE 7: Mobile - Pantalla de Contenido Generado Completo (Ruta Dedicada)**
**Objetivo:** Implementar `/app/(protected)/generated/[id].tsx`

#### Micro-tareas:
1. **Crear estructura base**
   - Archivo: `/app/(protected)/generated/[id].tsx` ✨ NUEVO
   - Layout: SafeAreaView + ScrollView
   - Obtener id de params
   - Hook: `useGeneratedContentById(id)`

2. **Sección 1: Header**
   - Card con: generatedTitle, agentName, createdAt

3. **Sección 2: Contenido Generado**
   - Card con generatedContent completo
   - Usar Textarea readonly o Text con scroll

4. **Sección 3: Resumen**
   - Card con generatedSummary si existe

5. **Sección 4: Social Media Copy - Facebook**
   - Card con: hook, copy, emojis, hookType, estimatedEngagement
   - Íconos de Facebook

6. **Sección 5: Social Media Copy - Twitter**
   - Card con: tweet, hook, emojis, hookType, threadIdeas
   - Íconos de Twitter

7. **Sección 6: Keywords y Tags**
   - Card con Badges para keywords
   - Card con Badges para tags

8. **Sección 7: Metadata**
   - Card con grid de metadata: model, tokens, cost, processingTime

9. **Sección 8: Información de Generación**
   - Card con createdAt formateado

---

### **FASE 8: Mobile - Estados y Manejo de Errores**
**Objetivo:** Implementar UX para loading, error y empty states

#### Micro-tareas:
1. **Loading states**
   - Skeleton en lista de posts
   - Skeleton en detalle de post
   - Skeleton en contenido generado
   - ActivityIndicator en botones durante generación

2. **Error states**
   - Card con mensaje de error en lista
   - Card con mensaje de error en detalle
   - Botón de retry

3. **Empty states**
   - Mensaje cuando no hay posts extraídos
   - Mensaje cuando no hay contenidos generados
   - Mensaje cuando no hay agentes activos

4. **Estados de generación en tiempo real**
   - Hook `useContentGenerationSocket` para actualizar estado
   - Mostrar spinner en cards mientras se genera
   - Toast de éxito cuando completa
   - Toast de error cuando falla

5. **Cache invalidation**
   - Invalidar `extracted-content` queries después de generar
   - Invalidar `generated-content` queries después de generar

---

### **FASE 9: Testing y Refinamiento (incluye Scroll Infinito)**
**Objetivo:** Probar flujo completo y ajustar detalles

#### Micro-tareas:
1. **Probar navegación**
   - Lista → Detalle → Contenido generado
   - Volver atrás funciona correctamente

2. **Probar generación simple**
   - Seleccionar un agente
   - Generar contenido
   - Ver logs en consola
   - Verificar que aparezca en la lista

3. **Probar generación masiva**
   - Seleccionar múltiples agentes
   - Generar contenidos
   - Verificar que aparezcan todos

4. **Probar socket events**
   - Verificar que lleguen eventos
   - Verificar que se actualicen estados en tiempo real
   - Verificar toasts

5. **Probar estados de error**
   - Red desconectada
   - Post no encontrado
   - Agente no disponible

6. **Probar scroll infinito**
   - Hacer scroll hasta el final de la lista
   - Verificar que cargue siguiente página automáticamente
   - Verificar ActivityIndicator al final mientras carga
   - Verificar mensaje "No hay más posts" cuando termina

7. **Probar pantalla de selección de agentes**
   - Verificar checkboxes funcionan
   - Verificar multi-selección
   - Verificar navegación de ida y vuelta
   - Verificar que la pantalla de detalle se actualice con socket events

---

## 📂 ESTRUCTURA DE ARCHIVOS A CREAR/MODIFICAR

### **Mobile (mobile-expo)**
```
mobile-expo/
├── src/
│   ├── types/
│   │   ├── extracted-content.types.ts         ✨ NUEVO
│   │   ├── generated-content.types.ts         ✨ NUEVO
│   │   └── content-agent.types.ts             ✨ NUEVO
│   ├── services/
│   │   ├── extracted-content/
│   │   │   └── extractedContentApi.ts         ✨ NUEVO
│   │   ├── generated-content/
│   │   │   └── generatedContentApi.ts         ✨ NUEVO
│   │   └── content-agents/
│   │       └── contentAgentsApi.ts            ✨ NUEVO
│   ├── hooks/
│   │   ├── useExtractedContent.ts             ✨ NUEVO
│   │   ├── useGeneratedContent.ts             ✨ NUEVO
│   │   ├── useContentAgents.ts                ✨ NUEVO
│   │   └── useContentGenerationSocket.ts      ✨ NUEVO
│   ├── components/
│   │   └── content/
│   │       └── GeneratedContentCard.tsx       ✨ NUEVO
│   ├── features/socket/types/
│   │   └── socket.types.ts                    📝 MODIFICAR
│   └── utils/
│       └── mappers.ts                         📝 MODIFICAR
├── app/
│   └── (protected)/
│       ├── (tabs)/
│       │   └── generate.tsx                   📝 MODIFICAR (implementar con FlatList + scroll infinito)
│       ├── extracted/
│       │   ├── [id].tsx                       ✨ NUEVO (detalle del post)
│       │   └── [id]/
│       │       └── select-agents.tsx          ✨ NUEVO (selección de agentes - ruta dedicada)
│       └── generated/
│           └── [id].tsx                       ✨ NUEVO (contenido generado completo - ruta dedicada)
```

---

## 🚨 RESTRICCIONES Y CONSIDERACIONES

### **TypeScript**
- ❌ **PROHIBIDO usar `any`**
- ✅ Interfaces explícitas para todos los DTOs
- ✅ Tipar eventos de Socket con `SocketEventMap`

### **Backend (api-nueva)**
- ❌ **PROHIBIDO levantar servidor**
- ✅ Solo hacer build: `yarn build`
- ⚠️ Endpoint batch es OPCIONAL - Decidir antes de implementar

### **Mobile**
- ✅ Seguir patrón: Servicios → Hooks → Componentes
- ✅ Usar ApiClient.getRawClient() para peticiones
- ✅ Usar mappers para transformar API ↔ App
- ✅ Cache invalidation en mutaciones exitosas
- ✅ Socket listeners con cleanup en useEffect

### **Navegación**
- ✅ Usar Expo Router file-based
- ✅ Pasar params con `router.push()`
- ✅ Usar `useLocalSearchParams()` para obtener params

### **UX**
- ✅ Loading states con Skeleton
- ✅ Error states con retry button
- ✅ Empty states con mensajes claros
- ✅ Toasts para feedback de acciones
- ✅ ActivityIndicator en botones durante loading

---

## 📊 DECISIONES PENDIENTES (PARA COYOTITO)

### **1. Endpoint Batch en Backend**
✅ **DECISIÓN TOMADA:** NO crear endpoint batch, usar múltiples llamadas al endpoint existente `POST /generator-pro/content/generate`

**Razón:** Más simple de implementar, no requiere modificar backend. El frontend manejará la concurrencia.

---

### **2. Paginación en Lista de Posts**
✅ **DECISIÓN TOMADA:** Implementar scroll infinito con TanStack Query (useInfiniteQuery)

**Implementación:**
- Usar `useInfiniteQuery` de React Query
- Página inicial: `page=1`, `limit=20`
- Detectar scroll al final con `onEndReached` de FlatList
- Cargar siguiente página automáticamente
- Mostrar ActivityIndicator al final mientras carga más

---

### **3. Selección de Agentes - Ruta Dedicada**
✅ **DECISIÓN TOMADA:** Usar ruta dedicada en lugar de Modal/Sheet

**Nueva pantalla:** `/app/(protected)/extracted/[id]/select-agents.tsx`

**Flujo:**
1. Botón "Crear Contenido" → `router.push(\`/extracted/\${id}/select-agents\`)`
2. Pantalla de selección con checkboxes para cada agente
3. Botón "Generar" → Ejecuta generación y vuelve atrás: `router.back()`
4. Socket events actualizan la pantalla de detalle en tiempo real

**Alternativa para AlertDialog:**
- Si prefieres AlertDialog, podemos usar `alert-dialog` de react-native-reusables
- Pero la ruta dedicada da mejor UX para multi-select

---

### **4. Almacenamiento de Estado de Generación**
✅ **DECISIÓN TOMADA:** Solo React Query (sin Zustand por ahora)

**Razón:** Más simple. Socket events + Query invalidation es suficiente para actualizar estados en tiempo real.

---

## 📈 MÉTRICAS DE ÉXITO

- ✅ Navegación fluida entre pantallas
- ✅ Carga de posts extraídos con filtros
- ✅ Selección de múltiples agentes funcional
- ✅ Generación masiva de contenidos funcional
- ✅ Socket events actualizan UI en tiempo real
- ✅ Cards de contenido generado navegables
- ✅ Pantalla de detalle muestra toda la información
- ✅ Social media copys visibles y legibles
- ✅ Metadata de generación completa
- ✅ Loading, error y empty states implementados
- ✅ Sin errores de TypeScript (no `any`)
- ✅ Backend compila sin errores (si se modifica)

---

**FIN DEL DOCUMENTO DE CONTEXTO**
