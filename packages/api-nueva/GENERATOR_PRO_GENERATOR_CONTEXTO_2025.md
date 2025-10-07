# 🤖 GENERATOR PRO - GENERADOR DE CONTENIDO CON PERFILES EDITORIALES

## 📋 DOCUMENTO CONTEXTO - GENERACIÓN CON AGENTES

**Generado:** 2025-01-03
**Proyecto:** Pachuca Noticias - Generator Pro
**Para:** Coyotito
**Por:** Jarvis (Claude Sonnet 4.5)

---

## 🎯 OBJETIVO DE ESTE DOCUMENTO

Este documento se enfoca específicamente en la **IMPLEMENTACIÓN DEL SISTEMA DE PERFILES EDITORIALES (Content Agents)** para Generator Pro, que permite generar contenido con diferentes personalidades y estilos editoriales.

### LO QUE VAMOS A IMPLEMENTAR:

1. **PERFILES EDITORIALES (ContentAgent)**
   - Crear/editar perfiles con personalidades únicas
   - Definir línea editorial, estilo de escritura, especializaciones
   - Asociar con templates de prompts

2. **GENERACIÓN CON AGENTES**
   - Seleccionar perfil editorial al generar contenido
   - Procesar contenido extraído con personalidad del agente
   - Opcionalmente agregar textos de referencia para contexto

3. **🔥 GENERACIÓN DE COPYS OPTIMIZADOS PARA REDES SOCIALES (NUEVO)**
   - **Facebook Copy:** Hooks virales + emojis estratégicos + formato vertical
   - **Twitter/X Copy:** Scroll-stoppers + max engagement en 280 chars
   - **Formulas AIDA y 4Cs:** Promise, Picture, Proof, Push
   - **5 Tipos de Hooks:** Scary, Free Value, Strange, Sexy, Familiar
   - **Engagement Maximizado:** Basado en mejores prácticas 2025-2026

4. **VALIDACIONES Y FRECUENCIAS**
   - Validar sitios web antes de guardar (testing obligatorio)
   - Sistema de frecuencias automatizadas
   - Evitar duplicados en extracción

---

## 📊 ANÁLISIS DE ESTADO ACTUAL

### ✅ LO QUE YA EXISTE Y FUNCIONA

#### BACKEND (api-nueva/src/generator-pro/)

**1. SCHEMAS COMPLETOS:**
- ✅ `NewsWebsiteConfig` (packages/api-nueva/src/generator-pro/schemas/news-website-config.schema.ts)
- ✅ `ExtractedNoticia` (packages/api-nueva/src/noticias/schemas/extracted-noticia.schema.ts)
- ✅ `AIContentGeneration` (packages/api-nueva/src/content-ai/schemas/ai-content-generation.schema.ts)
- ✅ `ContentAgent` (packages/api-nueva/src/content-ai/schemas/content-agent.schema.ts) - **YA EXISTE, solo falta integrar**
- ✅ `PromptTemplate` (packages/api-nueva/src/content-ai/schemas/prompt-template.schema.ts) - **YA EXISTE, solo falta integrar**

**2. ENDPOINTS FUNCIONANDO:**
```
✅ GET    /generator-pro/websites              - Listar sitios
✅ POST   /generator-pro/websites              - Crear sitio
✅ PUT    /generator-pro/websites/:id          - Actualizar sitio
✅ DELETE /generator-pro/websites/:id          - Eliminar sitio
✅ POST   /generator-pro/websites/test-listing-selectors   - Validar URLs
✅ POST   /generator-pro/websites/test-individual-content  - Validar contenido
✅ POST   /generator-pro/websites/:id/extract-urls-and-save - Extraer URLs
✅ GET    /generator-pro/urls                  - Listar URLs extraídas
✅ POST   /generator-pro/urls/extract-content  - Extraer contenido
✅ GET    /generator-pro/content               - Listar contenido
✅ POST   /generator-pro/content/generate      - Generar (MOCK - falta integrar agentes)
✅ GET    /generator-pro/generated             - Listar generados
✅ GET    /generator-pro/facebook-pages        - Páginas Facebook
```

**3. SERVICIOS FUNCIONANDO:**
- ✅ NewsWebsiteService
- ✅ GeneratorProQueueService
- ✅ GeneratorProOrchestratorService
- ✅ FacebookPublishingService
- ✅ ContentAgentService (en content-ai module) - **YA EXISTE**
- ✅ PromptTemplateService (en content-ai module) - **YA EXISTE**

#### FRONTEND (dash-coyote/src/features/generator-pro/)

**COMPONENTES FUNCIONANDO:**
- ✅ GeneratorProDashboard - Dashboard con 6 tabs
- ✅ SitiosWebTab - CRUD sitios + validación selectores
- ✅ URLsTab - URLs extraídas (existe pero NO usado en dashboard)
- ✅ ContenidoTab - Contenido extraído
- ✅ FacebookTab - Configuración Facebook
- ✅ PostsTab - Posts publicados
- ✅ JobsLogsTab - Monitoreo de trabajos
- ✅ ResumenTab - Dashboard general

**HOOKS FUNCIONANDO:**
- ✅ useWebsiteConfigs, useCreateWebsiteConfig, useUpdateWebsiteConfig
- ✅ useTestListingSelectors, useTestIndividualContent
- ✅ useExtractUrls, useExtractContent, useGenerateContent
- ✅ useFacebookPages

---

### ❌ LO QUE FALTA IMPLEMENTAR

#### BACKEND - 3 COMPONENTES PRINCIPALES:

**1. INTEGRACIÓN DE CONTENT AGENTS**
```
❌ Endpoints CRUD para agentes:
   POST   /generator-pro/agents              - Crear perfil
   GET    /generator-pro/agents              - Listar agentes
   GET    /generator-pro/agents/:id          - Obtener agente
   PUT    /generator-pro/agents/:id          - Actualizar
   DELETE /generator-pro/agents/:id          - Eliminar

❌ Integrar agentes en generación:
   - Modificar POST /generator-pro/content/generate
   - Eliminar MOCK actual
   - Usar ContentGenerationService real
   - Procesar con agentId específico
```

**2. SISTEMA DE PROMPT DINÁMICO + COPYS SOCIALES**
```
❌ GeneratorProPromptBuilder:
   - Recibir: extractedContent, agentId, referenceContent (opcional)
   - Obtener ContentAgent y PromptTemplate
   - Construir prompt con estructura FIJA:
     Input: { title, content, referenceContent? }
     Output: {
       title, content, keywords, tags, category, summary,
       socialMediaCopies: {
         facebook: { hook, copy, emojis, hookType, estimatedEngagement },
         twitter: { tweet, hook, emojis, hookType, threadIdeas }
       }
     }

❌ Servicio SocialMediaCopyGenerator:
   - Generar copys optimizados FB según mejores prácticas 2025
   - Generar tweets virales según estrategias X 2025
   - Aplicar formulas AIDA, 4Cs, PAS
   - Seleccionar hooks estratégicos (Scary, FreeValue, Strange, Sexy, Familiar)
   - Optimizar emojis según plataforma (max 4 FB, max 2 Twitter)
   - Validar longitud óptima por plataforma
```

**3. VALIDACIONES Y FRECUENCIAS**
```
❌ Validación pre-guardado de sitio:
   - Test listado → mínimo 1 URL encontrada
   - Test contenido → título y contenido extraídos
   - Solo guardar si ambos pasan

❌ Scheduler automático:
   - Extracción URLs según extractionFrequency
   - Generación contenido según contentGenerationFrequency
   - Publicación según publishingFrequency
   - Evitar duplicados
```

#### FRONTEND - 2 COMPONENTES PRINCIPALES:

**1. TAB "PERFILES EDITORIALES"**
```
❌ PerfilesEditorialesTab.tsx:
   - CRUD completo de agentes
   - Configurar personalidad, línea editorial, estilo
   - Vista de métricas de cada agente
   - Botones de prueba

❌ Agregar al dashboard entre "Sitios Web" y "Contenido"
```

**2. MEJORAR FLUJO DE GENERACIÓN**
```
❌ En ContenidoTab o GenerarContenidoTab:
   - Selector de contenido extraído
   - Selector de perfil editorial (agente)
   - Campo opcional "Texto de Referencia"
   - Botón generar + preview resultado

❌ Hooks nuevos:
   - useContentAgents()
   - useCreateContentAgent()
   - useUpdateContentAgent()
   - useDeleteContentAgent()
```

---

## 🔥 MEJORES PRÁCTICAS DE ENGAGEMENT 2025-2026

### 📘 FACEBOOK - ESTRATEGIAS DE MÁXIMO ENGAGEMENT

#### ✅ LO QUE FUNCIONA EN 2025-2026:

**1. FORMATOS QUE DOMINAN:**
- ✅ **Videos cortos (Reels):** Máximo engagement
- ✅ **Contenido interactivo:** Polls, preguntas, quizzes
- ✅ **Formato vertical 9:16:** Ocupa más pantalla al scroll
- ✅ **Carrusels con info valiosa:** Alto save rate
- ✅ **UGC (User Generated Content):** Autenticidad = engagement

**2. COPYWRITING QUE CONVIERTE:**
- ✅ **Hooks fuertes en primeras 1-2 líneas:** "Para el scroll"
- ✅ **Copy puede ser largo** si explica beneficios claramente
- ✅ **Preguntas que generen debate:** "¿Estás de acuerdo?"
- ✅ **Hot takes y opiniones polarizantes:** Más comments
- ✅ **Storytelling emocional:** Conexión humana

**3. USO ESTRATÉGICO DE EMOJIS:**
- ✅ **51% más engagement** con emojis bien usados
- ✅ **Máximo 4 emojis por bloque** de texto
- ✅ **Al final de frases**, no al inicio
- ✅ **Emojis reconocibles** en todos los dispositivos
- ✅ **Bullets con emojis:** ✅ ❌ 🔥 💡 📊 ⚠️

**4. ALGORITMO Y TIMING:**
- ✅ **Responder comentarios rápido** (primeros 30-60 min)
- ✅ **El algoritmo favorece conversación continua**
- ✅ **Mobile-first:** 80%+ usuarios en mobile
- ✅ **Hora pico:** 9 AM - 12 PM y 4 PM - 7 PM horario local

**5. ESTRUCTURA VIRAL:**
```
[HOOK FUERTE] - Primera línea = scroll-stopper
[CONTEXTO/HISTORIA] - 2-3 líneas de setup
[VALOR/BENEFICIO] - Qué gana el lector
[PRUEBA SOCIAL] - Datos, testimonios, autoridad
[CTA CLARA] - ¿Qué quieres que hagan?
[EMOJIS ESTRATÉGICOS] - Máximo 4, al final de líneas
```

### 𝕏 TWITTER/X - ESTRATEGIAS DE VIRALIDAD 2025

#### ✅ LO QUE FUNCIONA EN 2025:

**1. ANATOMÍA DE UN TWEET VIRAL:**
- ✅ **Primeras 1-2 líneas = CRÍTICAS:** Scroll-stopper en 1.7 segundos
- ✅ **280 caracteres max:** Cada palabra cuenta
- ✅ **Videos e imágenes:** 94% más engagement
- ✅ **Polls:** Engagement magnets automáticos
- ✅ **Hilos con valor:** Mayor dwell time

**2. LOS 5 TIPOS DE HOOKS QUE VIRALIZAN:**
- 🔴 **Scary (Miedo/Urgencia):** "Si no haces esto, vas a perder..."
- 🎁 **Free Value (Valor gratis):** "Thread: 10 herramientas que..."
- 🤯 **Strange (Inesperado):** "Nadie habla de esto, pero..."
- ✨ **Sexy (Aspiracional):** "Así es como logré 10x..."
- 🏠 **Familiar (Relatable):** "Todos hemos estado ahí cuando..."

**3. CONTENIDO QUE EXPLOTA:**
- ✅ **Humor bien ejecutado:** Memes contextuales
- ✅ **Controversia calculada:** Opiniones polarizantes
- ✅ **Storytelling en hilos:** Narrativa envolvente
- ✅ **Insights valiosos:** Aprendizajes únicos
- ✅ **Real-time trends:** Jumping on trending topics

**4. ENGAGEMENT TACTICS:**
- ✅ **70% tiempo engaging, 30% posting**
- ✅ **Responder en primeras 2-3 horas:** Critical window
- ✅ **Engagement rate > volumen:** Calidad sobre cantidad
- ✅ **Dwell time maximizado:** Contenido que retiene

**5. TIMING Y FRECUENCIA:**
- ✅ **Horarios pico:** 9 AM - 12 PM y 4 PM - 7 PM (local)
- ✅ **Consistencia > Volumen:** No spam
- ✅ **Algoritmo prioriza engagement rate inicial**

### 📐 FORMULAS UNIVERSALES DE COPYWRITING

#### **1. AIDA (Attention, Interest, Desire, Action)**
```
[A] ATTENTION: Hook que para el scroll
[I] INTEREST: Contexto que engancha
[D] DESIRE: Beneficios claros y tangibles
[A] ACTION: CTA específico y simple
```

#### **2. 4Cs (Promise, Picture, Proof, Push)**
```
[Promise] "Descubre cómo triplicar tu engagement..."
[Picture] Pinta el resultado específico
[Proof] Datos, casos, testimonios
[Push] CTA fácil de ejecutar
```

#### **3. PAS (Problem, Agitate, Solve)**
```
[Problem] Identificar dolor específico
[Agitate] Amplificar consecuencias
[Solve] Presentar solución clara
```

### 🎯 LONGITUD ÓPTIMA POR PLATAFORMA

**FACEBOOK:**
- ✅ **Hook:** 10-15 palabras máximo
- ✅ **Copy total:** 40-80 palabras (puede ser más si hay valor)
- ✅ **Párrafos:** 1-2 líneas máximo
- ✅ **Emojis:** 3-4 estratégicos

**TWITTER/X:**
- ✅ **Hook:** 8-12 palabras
- ✅ **Tweet completo:** 200-240 caracteres (no usar 280 completos)
- ✅ **Hilos:** 5-7 tweets óptimo
- ✅ **Emojis:** 1-2 por tweet

### 📊 MÉTRICAS QUE IMPORTAN 2025

**FACEBOOK:**
1. **Shares & Saves** > Likes
2. **Comments quality** > Comments quantity
3. **Dwell time** (tiempo en post)
4. **Click-through rate**

**TWITTER/X:**
1. **Engagement rate** (likes + RTs + replies / impresiones)
2. **Dwell time** (cuánto leen)
3. **Quote tweets** (shares con comentario)
4. **Bookmark rate** (saves)

---

## 🏗️ ARQUITECTURA - FLUJO COMPLETO

### FLUJO DE DATOS PASO A PASO

```
┌─────────────────────────────────────────────────────────────────┐
│              1. CONFIGURACIÓN DE PERFILES EDITORIALES            │
│                                                                  │
│  Usuario → PerfilesEditorialesTab → ContentAgent                │
│    ↓                                                             │
│  Crea perfil editorial:                                         │
│    - Nombre: "Reportero Objetivo"                               │
│    - Personalidad: "Eres un reportero objetivo que..."          │
│    - Línea editorial: neutral / crítica / humor                 │
│    - Estilo: formal / informal / conversacional                 │
│    - Especializaciones: política, deportes, social              │
│    ↓                                                             │
│  Asocia con PromptTemplate que define input/output              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                2. EXTRACCIÓN DE CONTENIDO (YA FUNCIONA)          │
│                                                                  │
│  NewsWebsiteConfig → NewsWebsiteService                         │
│    ↓                                                             │
│  1. Extraer URLs del listingUrl                                 │
│  2. Guardar en ExtractedNoticia (status: pending)               │
│  3. Extraer contenido de cada URL                               │
│  4. Actualizar ExtractedNoticia (status: extracted)             │
│    - title, content, images, author, category                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│           3. GENERACIÓN CON PERFIL EDITORIAL (NUEVO)             │
│                                                                  │
│  ENTRADA:                                                        │
│    - extractedNoticiaId                                         │
│    - agentId (perfil editorial seleccionado)                    │
│    - referenceContent (opcional - contexto adicional)           │
│                                                                  │
│  PROCESO:                                                        │
│    1. Obtener ExtractedNoticia                                  │
│    2. Obtener ContentAgent                                      │
│    3. Obtener PromptTemplate del agente                         │
│    4. Construir prompt:                                         │
│       {                                                          │
│         title: extractedNoticia.title,                          │
│         content: extractedNoticia.content,                      │
│         referenceContent: "Contexto político..." (opcional)     │
│       }                                                          │
│    5. Llamar OpenAI con:                                        │
│       - systemPrompt del template                               │
│       - personality del agent                                   │
│       - prompt procesado                                        │
│                                                                  │
│  SALIDA ESPERADA (FORMATO FIJO):                                │
│       {                                                          │
│         title: "Título transformado",                           │
│         content: "Contenido reescrito completamente",           │
│         keywords: ["kw1", "kw2"],                               │
│         tags: ["tag1", "tag2"],                                 │
│         category: "política",                                   │
│         summary: "Resumen ejecutivo",                           │
│                                                                  │
│         // 🔥 NUEVO: Copys optimizados para redes sociales      │
│         socialMediaCopies: {                                    │
│           facebook: {                                           │
│             hook: "🚨 Esto cambia TODO...",                     │
│             copy: "Copy completo FB con estructura viral",      │
│             emojis: ["🚨", "💡", "✅"],                         │
│             hookType: "Scary" // Scary, FreeValue, Strange...  │
│             estimatedEngagement: "high" // high, medium, low    │
│           },                                                     │
│           twitter: {                                            │
│             tweet: "Tweet optimizado 200-240 chars",            │
│             hook: "Nadie habla de esto:",                       │
│             emojis: ["🔥"],                                     │
│             hookType: "Strange",                                │
│             threadIdeas: ["Tweet 2...", "Tweet 3..."]           │
│           }                                                      │
│         }                                                        │
│       }                                                          │
│    6. Guardar en AIContentGeneration con agentId                │
│    7. Actualizar ExtractedNoticia con generatedContentId        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 PLAN DE IMPLEMENTACIÓN - 6 FASES

### 🎯 FASE 1: BACKEND - CRUD DE CONTENT AGENTS

**Objetivo:** Crear endpoints completos para gestionar perfiles editoriales

#### MICROTAREA 1.1: DTOs para ContentAgent
**Archivo:** `packages/api-nueva/src/generator-pro/dto/content-agent.dto.ts`

**Crear:**
- CreateContentAgentDto
- UpdateContentAgentDto
- ContentAgentResponseDto

**Validaciones:**
- name: required, minLength: 3
- agentType: enum required
- personality: required, minLength: 50
- editorialLean: enum required

**✅ Criterio de completado:**
- DTOs exportados en index.ts
- class-validator implementado
- NO usar `any`
- yarn build ✅

#### MICROTAREA 1.2: Servicio ContentAgentService
**Archivo:** Usar existente `packages/api-nueva/src/content-ai/services/content-agent.service.ts`

**Agregar métodos:**
```typescript
async createAgent(createDto: CreateContentAgentDto)
async findAll(filters?: { agentType?, isActive? })
async findById(id: string)
async updateAgent(id: string, updateDto: UpdateContentAgentDto)
async deleteAgent(id: string)
async getAgentStatistics(id: string)
```

**⚠️ IMPORTANTE:**
- NO usar forwardRef
- Si hay circular reference → EventEmitter2
- Validar que agente existe antes de update/delete

**✅ Criterio de completado:**
- Todos los métodos implementados
- Manejo de errores correcto
- yarn build ✅

#### MICROTAREA 1.3: Endpoints en Controller
**Archivo:** `packages/api-nueva/src/generator-pro/controllers/generator-pro.controller.ts`

**Agregar:**
```typescript
@Get('agents')
@Post('agents')
@Get('agents/:id')
@Put('agents/:id')
@Delete('agents/:id')
@Get('agents/:id/statistics')
```

**✅ Criterio de completado:**
- Swagger docs completos
- EventEmitter events (agent.created, etc)
- yarn build ✅

---

### 🎯 FASE 2: BACKEND - INTEGRACIÓN AGENTES CON GENERACIÓN

**Objetivo:** Conectar agentes con sistema de generación real

#### MICROTAREA 2.1: Servicio PromptBuilder
**Archivo:** `packages/api-nueva/src/generator-pro/services/generator-pro-prompt-builder.service.ts`

**Crear servicio completo:**
```typescript
class GeneratorProPromptBuilderService {
  async buildPrompt(params: {
    extractedNoticia: ExtractedNoticiaDocument;
    agentId: string;
    referenceContent?: string;
  }): Promise<{
    systemPrompt: string;
    userPrompt: string;
    expectedFormat: object;
    agentConfig: object;
  }>
}
```

**Lógica:**
1. Obtener ContentAgent por agentId
2. Obtener PromptTemplate del agente
3. Construir input con estructura fija
4. Procesar variables del template
5. Retornar prompts listos

**✅ Criterio de completado:**
- Servicio inyectado en módulo
- NO usar `any`
- Manejo de errores
- yarn build ✅

#### MICROTAREA 2.2: Modificar endpoint generate
**Archivo:** `packages/api-nueva/src/generator-pro/controllers/generator-pro.controller.ts`

**Actualizar método `generateContent`:**
```typescript
@Post('content/generate')
async generateContent(@Body() body: {
  extractedContentId: string;
  agentId: string;
  templateId?: string;
  providerId?: string;
  referenceContent?: string;  // ← NUEVO
})
```

**Cambios:**
1. ❌ Eliminar código MOCK actual
2. ✅ Integrar GeneratorProPromptBuilder
3. ✅ Llamar ContentGenerationService real
4. ✅ Guardar con agentId correcto
5. ✅ Agregar campo referenceContent opcional

**⚠️ IMPORTANTE:**
- Si ContentGenerationService causa circular → EventEmitter2
- Validar agent existe
- Validar extractedContent existe

**✅ Criterio de completado:**
- Generación funcional con agentes
- Elimina MOCK completamente
- yarn build ✅
- Prueba manual: generar con agente ✅

#### MICROTAREA 2.3: Servicio SocialMediaCopyGenerator (NUEVO)
**Archivo:** `packages/api-nueva/src/generator-pro/services/social-media-copy-generator.service.ts`

**Crear servicio completo:**
```typescript
@Injectable()
class SocialMediaCopyGeneratorService {
  // Generar copy completo para Facebook
  async generateFacebookCopy(params: {
    content: string;
    title: string;
    agentPersonality: string;
    category?: string;
  }): Promise<FacebookCopyResult> {
    // 1. Seleccionar hook type según contenido
    // 2. Aplicar formula viral (AIDA, 4Cs, PAS)
    // 3. Generar hook scroll-stopper (10-15 palabras)
    // 4. Construir copy completo (40-80 palabras)
    // 5. Agregar emojis estratégicos (max 4)
    // 6. Validar estructura y longitud
    // 7. Estimar engagement potencial
    return {
      hook: "🚨 Esto te va a sorprender...",
      copy: "Copy completo con estructura viral...",
      emojis: ["🚨", "💡", "✅", "🔥"],
      hookType: "Strange",
      estimatedEngagement: "high"
    };
  }

  // Generar tweet optimizado para X/Twitter
  async generateTwitterCopy(params: {
    content: string;
    title: string;
    agentPersonality: string;
    category?: string;
  }): Promise<TwitterCopyResult> {
    // 1. Seleccionar hook type viral
    // 2. Construir tweet 200-240 chars
    // 3. Primeras 1-2 líneas = scroll-stopper
    // 4. Agregar emojis (max 2)
    // 5. Generar ideas para thread (opcional)
    // 6. Validar longitud y engagement
    return {
      tweet: "Nadie habla de esto pero... [resto del tweet]",
      hook: "Nadie habla de esto:",
      emojis: ["🔥"],
      hookType: "Strange",
      threadIdeas: [
        "Tweet 2: Profundizar en punto 1",
        "Tweet 3: Datos específicos",
        "Tweet 4: Conclusión + CTA"
      ]
    };
  }

  // Seleccionar mejor hook type según contenido
  private selectHookType(content: string, category: string): HookType {
    // Scary: urgencia, peligro, pérdida
    // FreeValue: tips, listas, herramientas
    // Strange: inesperado, contraintuitivo
    // Sexy: resultados aspiracionales
    // Familiar: relatable, común
  }

  // Aplicar formula de copywriting
  private applyFormula(
    formula: 'AIDA' | '4Cs' | 'PAS',
    content: string
  ): string {
    // Implementar formulas
  }

  // Optimizar emojis según plataforma
  private optimizeEmojis(
    text: string,
    platform: 'facebook' | 'twitter',
    maxEmojis: number
  ): string[] {
    // Seleccionar emojis relevantes
    // Validar que sean reconocibles
    // No más de maxEmojis
  }
}
```

**Integración con OpenAI:**
```typescript
// Agregar instrucciones específicas al systemPrompt para generar copys
const systemPromptWithSocial = `
${originalSystemPrompt}

IMPORTANTE: Además del contenido principal, DEBES generar:

1. FACEBOOK COPY:
- Hook viral de 10-15 palabras (usa uno de estos tipos: Scary, FreeValue, Strange, Sexy, Familiar)
- Copy completo de 40-80 palabras siguiendo estructura:
  * Hook scroll-stopper
  * Contexto breve (2-3 líneas)
  * Valor/beneficio claro
  * CTA específico
- Máximo 4 emojis estratégicos al final de líneas
- Estimación de engagement: high/medium/low

2. TWITTER COPY:
- Tweet de 200-240 caracteres (NO usar 280 completos)
- Primeras 1-2 líneas = scroll-stopper crítico
- Hook viral (mismo tipo que FB)
- Máximo 2 emojis relevantes
- 3-4 ideas para thread (opcional)

FORMULAS A USAR:
- AIDA: Attention → Interest → Desire → Action
- 4Cs: Promise → Picture → Proof → Push
- PAS: Problem → Agitate → Solve

TIPOS DE HOOKS:
- Scary: "Si no haces X, vas a perder Y..."
- FreeValue: "Thread: 10 formas de..."
- Strange: "Nadie habla de esto pero..."
- Sexy: "Así es como logré 10x en..."
- Familiar: "Todos hemos pasado por..."
`;
```

**⚠️ IMPORTANTE:**
- Usar OpenAI para generar copys inteligentes, NO templates estáticos
- Aplicar mejores prácticas 2025-2026 investigadas
- Validar longitud según plataforma
- Emojis contextuales y estratégicos

**✅ Criterio de completado:**
- Servicio implementado e inyectado
- Integrado con generación de contenido
- Copys optimizados según research 2025
- Validaciones de longitud y emojis
- yarn build ✅
- Prueba manual: copys generados con engagement ✅

---

### 🎯 FASE 3: FRONTEND - TAB PERFILES EDITORIALES

**Objetivo:** UI completa para gestionar agentes

#### MICROTAREA 3.1: Hooks para ContentAgent
**Archivo:** `packages/dash-coyote/src/features/generator-pro/hooks/useContentAgents.ts`

**Crear hooks:**
```typescript
useContentAgents(filters?)
useCreateContentAgent()
useUpdateContentAgent()
useDeleteContentAgent()
```

**✅ Criterio de completado:**
- Hooks exportados en index.ts
- Tipos correctos (NO `any`)
- Invalidación de queries

#### MICROTAREA 3.2: Componente PerfilesEditorialesTab
**Archivo:** `packages/dash-coyote/src/features/generator-pro/components/tabs/PerfilesEditorialesTab.tsx`

**Crear componente completo con:**

**1. Tabla de agentes:**
- Columnas: Nombre, Tipo, Línea Editorial, Especializaciones, Métricas
- Acciones: Editar, Eliminar, Ver stats

**2. Dialog crear/editar:**
- Input: Nombre
- Select: Tipo (reportero, columnista, trascendido, seo)
- Textarea: Descripción
- Textarea: Personalidad (prompt detallado)
- Select: Línea editorial (neutral, crítica, humor, etc)
- Multi-select: Especializaciones
- Sección "Estilo de Escritura":
  - Tone (formal, informal, humor)
  - Vocabulary (simple, intermediate, advanced)
  - Length (short, medium, long)
  - Structure (linear, narrative, analytical)
  - Audience (general, specialized)
- Switch: Activo/Inactivo

**3. Vista previa:**
- Preview del prompt generado
- Ejemplo de uso

**🎨 USAR SHADCN:**
- Card, Button, Input, Textarea, Select
- Dialog, Table, Badge, Switch
- Tema del proyecto

**✅ Criterio de completado:**
- CRUD funcional
- Validaciones formulario
- UI/UX consistente
- NO `any`

#### MICROTAREA 3.3: Agregar tab al Dashboard
**Archivo:** `packages/dash-coyote/src/features/generator-pro/components/GeneratorProDashboard.tsx`

**Modificar array de tabs:**
```typescript
const tabs = [
  { id: 'resumen', ... },
  { id: 'sitios-web', ... },
  {
    id: 'perfiles',
    label: 'Perfiles Editoriales',
    icon: IconBrain,
    component: PerfilesEditorialesTab
  }, // ← NUEVO
  { id: 'contenido', ... },
  ...
];
```

**✅ Criterio de completado:**
- Tab visible
- Navegación funcional
- Icono correcto

---

### 🎯 FASE 4: FRONTEND - MEJORAR GENERACIÓN

**Objetivo:** Integrar selección de agentes en generación

#### MICROTAREA 4.1: Modificar ContenidoTab
**Archivo:** `packages/dash-coyote/src/features/generator-pro/components/tabs/ContenidoTab.tsx`

**Agregar sección "Generar Contenido con IA":**
```typescript
- Select: Contenido extraído
  * Autocomplete con búsqueda
  * Mostrar: título, URL, fecha

- Select: Perfil Editorial
  * Listar agentes activos
  * Mostrar: nombre, tipo, línea editorial
  * Badge con color según línea

- Textarea: Texto de Referencia (opcional)
  * Label: "Contexto adicional (opcional)"
  * Placeholder: "Información de contexto, perspectiva..."
  * Contador de caracteres
  * Hint: "Opcional. Contexto adicional para el agente"

- Button: "Generar Contenido"
  * Disabled si falta contenido o agente
  * Loading state

- Card Preview:
  * Título generado
  * Contenido (con scroll)
  * Keywords (chips)
  * Tags (chips)
  * Categoría
  * Resumen

  * 🔥 NUEVO: Sección "Copys para Redes Sociales"
    - Tab Facebook:
      · Hook viral destacado
      · Copy completo formateado
      · Emojis usados (badges)
      · Tipo de hook (badge con color)
      · Engagement estimado (high/medium/low)
      · Botón "Copiar Copy FB"

    - Tab Twitter:
      · Tweet principal (con contador chars)
      · Hook destacado
      · Emojis usados (badges)
      · Tipo de hook (badge con color)
      · Ideas para thread (lista expandible)
      · Botón "Copiar Tweet"

  * Botones: Editar, Publicar en FB, Publicar en Twitter, Descartar
```

**✅ Criterio de completado:**
- UI intuitiva
- Validaciones correctas
- Preview claro
- NO `any`

#### MICROTAREA 4.2: Actualizar hook useGenerateContent
**Archivo:** `packages/dash-coyote/src/features/generator-pro/hooks/index.ts`

**Modificar:**
```typescript
useGenerateContent() {
  mutationFn: (data: {
    extractedContentId: string;
    agentId: string;
    templateId?: string;
    providerId?: string;
    referenceContent?: string;  // ← NUEVO
  })
}
```

**✅ Criterio de completado:**
- Hook actualizado
- Tipos correctos
- Funciona con referenceContent opcional

---

### 🎯 FASE 5: VALIDACIONES Y FRECUENCIAS

**Objetivo:** Sistema completo de validaciones y automatización

#### MICROTAREA 5.1: Validación pre-guardado (Frontend)
**Archivo:** `packages/dash-coyote/src/features/generator-pro/components/tabs/SitiosWebTab.tsx`

**Modificar handleSubmit:**
```typescript
const handleSubmit = async () => {
  // 1. Validar Listado
  const listingResult = await testListingSelectors.mutateAsync(...);

  if (!listingResult.success || listingResult.totalUrls === 0) {
    toast.error('Error: No se extrajo ninguna URL');
    return;
  }

  // 2. Validar Contenido
  if (!formData.testUrl) {
    toast.error('Debes proporcionar URL de prueba');
    return;
  }

  const contentResult = await testIndividualContent.mutateAsync(...);

  if (!contentResult.success || !contentResult.extractedContent.title) {
    toast.error('Error: No se extrajo contenido');
    return;
  }

  // 3. Guardar solo si todo OK
  await createWebsite.mutateAsync(formData);
  toast.success('✅ Sitio configurado y validado');
};
```

**✅ Criterio de completado:**
- No se guarda sin validar
- Mensajes de error claros
- UX no bloqueante

#### MICROTAREA 5.2: Sistema de Scheduler (Backend)
**Archivo:** `packages/api-nueva/src/generator-pro/services/generator-pro-scheduler.service.ts`

**Crear servicio:**
```typescript
@Injectable()
class GeneratorProSchedulerService implements OnModuleInit {
  @Cron('*/5 * * * *') // Cada 5 min revisar
  async scheduleExtractionJobs() {
    const websites = await this.websiteModel.find({ isActive: true });

    for (const website of websites) {
      const nextRun = this.calculateNextRun(
        website.lastExtractionRun,
        website.extractionFrequency
      );

      if (Date.now() >= nextRun.getTime()) {
        await this.queueService.addExtractionJob(...);
        await this.websiteModel.findByIdAndUpdate(website._id, {
          lastExtractionRun: new Date()
        });
      }
    }
  }

  // Similar para generation y publishing...
}
```

**⚠️ IMPORTANTE:**
- NO forwardRef
- EventEmitter2 para comunicación
- Verificar duplicados

**✅ Criterio de completado:**
- Scheduler funciona
- Jobs según frecuencias
- Sin duplicados
- yarn build ✅

---

### 🎯 FASE 6: TESTING FINAL

**Objetivo:** Validar flujo completo

#### MICROTAREA 6.1: Testing manual
**Secuencia:**
1. Configurar sitio con validaciones
2. Crear 2-3 perfiles editoriales diferentes
3. Extraer URLs
4. Extraer contenido
5. Generar con diferentes agentes
6. Comparar resultados
7. Publicar en Facebook

**✅ Criterio de completado:**
- Flujo completo funciona
- Cada agente genera contenido diferente
- Sin duplicados
- Frecuencias funcionan

#### MICROTAREA 6.2: Builds finales
```bash
cd packages/api-nueva
yarn build  # ✅ Debe compilar sin errores
```

**✅ Criterio de completado:**
- Backend compila ✅
- Sin warnings `any`
- Sin forwardRef

---

## ⚠️ REGLAS OBLIGATORIAS

### 🔴 PROHIBICIONES:

1. **NO usar `any`** → Tipar todo
2. **NO usar `forwardRef`** → EventEmitter2
3. **NO levantar servidores** → Solo yarn build
4. **NO crear archivos innecesarios**

### ✅ REGLAS:

1. **Después de cada fase → yarn build**
2. **Shadcn correctamente** → usar tema
3. **Cada fase completada → releer reglas**
4. **Commits apropiados** → al final de cada fase

### 📋 CHECKLIST POR MICROTAREA:

```
□ ¿Tipado correcto? (NO any)
□ ¿Imports correctos?
□ ¿NO usa forwardRef?
□ ¿yarn build ✅?
□ ¿Exportado en index.ts?
□ ¿Documentado?
□ ¿Manejo de errores?
□ ¿EventEmitter para eventos?
□ ¿Validaciones?
□ ¿NO rompe existente?
```

---

## 📊 RESUMEN EJECUTIVO

### LO QUE FUNCIONA:
✅ Configuración sitios + validación selectores
✅ Extracción URLs y contenido
✅ Sistema de jobs y procesadores
✅ Integración Facebook
✅ Dashboard con 6 tabs
✅ Schemas ContentAgent y PromptTemplate (no integrados)

### LO QUE FALTA (6 FASES):
❌ Fase 1: Endpoints CRUD ContentAgent
❌ Fase 2: Integración agentes con generación + 🔥 COPYS SOCIALES
❌ Fase 3: Tab Perfiles Editoriales
❌ Fase 4: Mejorar flujo generación + Preview copys sociales
❌ Fase 5: Validaciones + scheduler
❌ Fase 6: Testing final

### 🔥 NUEVAS FUNCIONALIDADES AGREGADAS:
✅ Generación automática de copys optimizados para FB y Twitter
✅ Aplicación de mejores prácticas de engagement 2025-2026
✅ Formulas virales (AIDA, 4Cs, PAS)
✅ 5 tipos de hooks estratégicos (Scary, FreeValue, Strange, Sexy, Familiar)
✅ Optimización de emojis por plataforma
✅ Validación de longitud según plataforma
✅ Estimación de engagement potencial

### ESTIMACIÓN ACTUALIZADA:
- Fase 1: ~2-3 horas
- Fase 2: ~3-4 horas (+ servicio SocialMediaCopyGenerator)
- Fase 3: ~3-4 horas
- Fase 4: ~3 horas (+ UI para copys sociales)
- Fase 5: ~2 horas
- Fase 6: ~1 hora

**Total: ~14-18 horas** (por copys sociales +2-3 horas)

---

## 🚀 PRÓXIMOS PASOS

1. **AHORA:** Revisar este documento
2. **Confirmar** plan con Coyotito
3. **Empezar Fase 1** - DTOs ContentAgent
4. **Verificar** checklist cada microtarea
5. **yarn build** después de cada fase

---

## 🎯 NOTAS FINALES CRÍTICAS

### 🔥 SOBRE LOS COPYS DE REDES SOCIALES

**ESTE ES EL DIFERENCIADOR CLAVE DEL SISTEMA:**

La generación automática de copys optimizados para Facebook y Twitter/X basados en las **mejores prácticas de engagement 2025-2026** es lo que separa este sistema de un simple generador de contenido.

**POR QUÉ ES CRÍTICO:**

1. **Engagement = Alcance algorítmico**
   - FB y Twitter priorizan contenido con alto engagement inicial
   - Un copy mal optimizado = 0 alcance orgánico
   - Un copy viral = 10x-100x más impresiones

2. **ROI de publicación**
   - Sin optimización: contenido muerto en < 1 hora
   - Con optimización: contenido viral que genera tráfico días/semanas

3. **Basado en research real 2025-2026**
   - No son "buenas prácticas genéricas"
   - Son estrategias PROBADAS por creators exitosos en 2025
   - Formulas específicas que funcionan HOY

4. **Automatización del expertise**
   - Copys manuales = 30-60 min por post
   - Copys generados por IA + mejores prácticas = 30 segundos
   - Calidad = igual o superior a copy manual

**IMPLEMENTACIÓN NO NEGOCIABLE:**

- ✅ Hooks virales según tipo de contenido
- ✅ Emojis estratégicos (no decorativos)
- ✅ Longitud optimizada por plataforma
- ✅ Formulas de copywriting aplicadas
- ✅ Estimación de engagement
- ✅ Thread ideas para Twitter

**RESULTADO ESPERADO:**

Cada contenido generado vendrá con copys listos para publicar que:
- Paran el scroll en < 2 segundos
- Generan engagement inmediato (comments, shares, saves)
- Maximizan alcance algorítmico
- Requieren 0 edición manual

---

**IMPORTANTE:** Este documento se enfoca SOLO en el sistema de perfiles editoriales. El documento general de Generator Pro (GENERATOR_PRO_CONTEXTO_2025.md) tiene información adicional sobre otras partes del sistema.

**RESEARCH SOURCES:**
- Brand24: X (Twitter) Tips for 2025
- Zebracat: How to Go Viral on X 2025
- Sprout Social: Twitter Algorithm 2025
- LocaliQ: Facebook Ads Best Practices 2025
- Social Pilot: Facebook Best Practices 2025
- ContentStudio: Social Media Hooks 2025
- Buffer: Copywriting Formulas
- Planable: Social Media Engagement Rate 2025
