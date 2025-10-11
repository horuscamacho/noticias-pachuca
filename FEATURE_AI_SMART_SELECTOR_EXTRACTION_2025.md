# 🤖 PLAN DE IMPLEMENTACIÓN - Extracción Inteligente de Selectores CSS con OpenAI

**Proyecto:** Pachuca Noticias - Sistema de Extracción Inteligente
**Fecha:** 2025-10-09
**Desarrollador:** Jarvis para Coyotito
**Feature:** Sistema automatizado de extracción y validación de selectores CSS usando AI

---

## 📊 ANÁLISIS: LO QUE TENEMOS VS LO QUE NECESITAMOS

### ✅ LO QUE YA TENEMOS

#### **Backend (api-nueva)**
- ✅ Endpoint `POST /generator-pro/websites` - Crea outlets manualmente
- ✅ Endpoint `POST /generator-pro/websites/test-listing-selectors` - Prueba selector de artículos
- ✅ Endpoint `POST /generator-pro/websites/test-individual-content` - Prueba selectores de contenido
- ✅ Endpoint `POST /generator-pro/websites/:id/extract-all` - Ejecuta extracción completa
- ✅ Sistema de Jobs para tracking de extracciones
- ✅ Modelo `WebsiteConfig` con selectores CSS configurables
- ✅ Servicio de extracción con Puppeteer (básico)
- ✅ Validación de selectores CSS

#### **Mobile (mobile-expo)**
- ✅ Formulario de creación de outlets en `/outlet/create.tsx`
- ✅ Hooks React Query: `useCreateOutlet`, `useTestListingSelectors`, `useTestContentSelectors`
- ✅ Servicio API `outletApi.ts` con métodos de testing
- ✅ Pantallas de resultados: `test-listing-result.tsx`, `test-content-result.tsx`
- ✅ Componente `ClaudePromptAlert` (manual, requiere copiar/pegar)
- ✅ Tipos TypeScript completos para outlets

#### **Infraestructura**
- ✅ OpenAI API configurada en el backend
- ✅ Puppeteer instalado y funcionando
- ✅ Sistema de colas con BullMQ
- ✅ MongoDB para almacenamiento

---

### ❌ LO QUE NECESITAMOS IMPLEMENTAR

#### **Backend (api-nueva)**

##### **1. Servicio de Extracción HTML Inteligente**
- ❌ `html-extraction.service.ts` - Servicio para obtener HTML optimizado con Puppeteer
  - Método `extractStaticHTML(url: string)` - Obtiene HTML sin ejecutar JS
  - Método `extractDynamicHTML(url: string)` - Obtiene HTML después de cargar contenido dinámico
  - Método `minimizeHTML(html: string)` - Minifica HTML preservando estructura
  - Método `convertHTMLToMarkdown(html: string)` - Convierte a Markdown para reducir tokens
  - Configuración de timeouts y estrategias de espera

##### **2. Servicio de Análisis con OpenAI**
- ❌ `openai-selector-analyzer.service.ts` - Servicio para análisis inteligente
  - Método `analyzeListingPage(html: string, url: string)` - Detecta selectores de artículos
  - Método `analyzeContentPage(html: string, url: string)` - Detecta selectores de contenido
  - Método `validateAndExtract(url: string, selectors: object)` - Valida selectores y extrae contenido real
  - Prompts optimizados para GPT-4o-mini
  - Structured Output (JSON mode) para respuestas confiables
  - Manejo de errores y reintentos

##### **3. Controlador y Endpoints Nuevos**
- ❌ `POST /generator-pro/websites/ai-analyze-listing` - Analiza página de listado con AI
  - Input: `{ listingUrl: string }`
  - Output: `{ articleLinks: string, urlsFound: string[], preview: object[] }`

- ❌ `POST /generator-pro/websites/ai-analyze-content` - Analiza página de contenido con AI
  - Input: `{ contentUrl: string }`
  - Output: `{ selectors: ContentSelectors, extractedData: object }`

- ❌ `POST /generator-pro/websites/ai-create-outlet` - Crea outlet completo con AI
  - Input: `{ name: string, baseUrl: string, listingUrl: string, testUrl?: string }`
  - Output: `{ outlet: OutletConfig, validationResults: object }`

##### **4. DTOs y Validación**
- ❌ `ai-analyze-listing.dto.ts` - DTO para análisis de listado
- ❌ `ai-analyze-content.dto.ts` - DTO para análisis de contenido
- ❌ `ai-create-outlet.dto.ts` - DTO para creación automática
- ❌ `ai-extraction-result.dto.ts` - DTO para resultados

##### **5. Utilidades**
- ❌ `html-optimizer.util.ts` - Funciones para optimización de HTML
  - `removeScripts()` - Elimina scripts y estilos
  - `preserveStructure()` - Mantiene estructura semántica
  - `calculateTokens()` - Estima tokens antes de enviar a OpenAI
- ❌ `selector-validator.util.ts` - Validación avanzada de selectores
  - `testSelectorUniqueness()` - Verifica si selector es único
  - `testSelectorStability()` - Prueba múltiples páginas
  - `suggestAlternatives()` - Sugiere alternativas más robustas

#### **Mobile (mobile-expo)**

##### **1. Servicios API**
- ❌ `aiOutletApi.ts` - Servicio para endpoints de AI
  - `analyzeListingWithAI(listingUrl: string)`
  - `analyzeContentWithAI(contentUrl: string)`
  - `createOutletWithAI(data: AiCreateOutletDto)`

##### **2. Hooks React Query**
- ❌ `useAiAnalyzeListing()` - Hook para analizar listado con AI
- ❌ `useAiAnalyzeContent()` - Hook para analizar contenido con AI
- ❌ `useAiCreateOutlet()` - Hook para crear outlet automático

##### **3. Componentes y Pantallas**
- ❌ Modificar `/outlet/create.tsx` - Agregar modo "Automático con AI"
  - Toggle para cambiar entre "Manual" y "AI Automático"
  - Modo AI: solo requiere name, baseUrl, listingUrl, testUrl (opcional)
  - Botón "Analizar con AI" que ejecuta todo el flujo
  - Loading states con progreso paso a paso

- ❌ `/outlet/ai-analysis-result.tsx` - Pantalla de resultados de AI
  - Muestra selectores detectados
  - Preview de URLs encontradas (listado)
  - Preview de contenido extraído (artículo de prueba)
  - Botones: "Aprobar y Guardar" o "Ajustar Manualmente"

##### **4. Tipos TypeScript**
- ❌ `ai-outlet.types.ts` - Tipos para funcionalidad AI
  - `AiAnalyzeListingRequest`
  - `AiAnalyzeListingResponse`
  - `AiAnalyzeContentRequest`
  - `AiAnalyzeContentResponse`
  - `AiCreateOutletRequest`
  - `AiCreateOutletResponse`

---

## 🔬 HALLAZGOS DE INVESTIGACIÓN 2025

### **1. Extracción de HTML (Puppeteer)**

#### **Estrategia Recomendada:**
```typescript
// Opción A: HTML Estático (más rápido, menos tokens)
await page.goto(url, { waitUntil: 'domcontentloaded' });

// Opción B: HTML Dinámico (más completo, para SPAs)
await page.goto(url, { waitUntil: 'networkidle2' });
await page.waitForSelector('article, .post, .news-item', { timeout: 5000 });
```

#### **Minificación Inteligente:**
```typescript
// Eliminar: scripts, styles, comments, data attributes innecesarios
// Preservar: estructura semántica, clases, IDs, atributos aria/data importantes
// Resultado: 60-70% reducción de tamaño sin perder información estructural
```

**Bibliotecas clave:**
- `puppeteer` - Navegador headless
- `cheerio` - Manipulación DOM en Node
- `html-to-text` - Conversión limpia a texto
- `turndown` - HTML → Markdown (reduce ~40% de tokens)

---

### **2. Análisis con OpenAI**

#### **Modelo Recomendado: GPT-4o-mini**
**Razones:**
- ✅ **Costo:** $0.15 / 1M tokens input, $0.60 / 1M output (60% más barato que GPT-3.5)
- ✅ **Context Window:** 128K tokens (suficiente para HTML de páginas completas)
- ✅ **Structured Outputs:** Soporte nativo para JSON Schema
- ✅ **Velocidad:** Más rápido que GPT-4o completo
- ✅ **Precisión:** Excelente para tareas de extracción estructurada

#### **Estimación de Costos:**
```
Página de listado promedio: ~15K tokens (HTML minificado)
Página de artículo promedio: ~10K tokens (HTML minificado)

Análisis completo (listado + contenido):
- Input: ~25K tokens × $0.15/1M = $0.00375
- Output: ~2K tokens × $0.60/1M = $0.0012
- TOTAL por análisis: ~$0.005 USD (5 centavos de dólar por cada 100 outlets)

Costo mensual estimado (10 outlets nuevos/mes): $0.05 USD
```

#### **Structured Output (JSON Schema)**
```typescript
const schema = {
  type: "object",
  properties: {
    listingSelectors: {
      type: "object",
      properties: {
        articleLinks: { type: "string" }
      },
      required: ["articleLinks"]
    },
    confidence: { type: "number", min: 0, max: 1 },
    reasoning: { type: "string" }
  },
  required: ["listingSelectors", "confidence"]
};

// GPT-4o-mini garantiza respuesta en este formato exacto
```

---

### **3. Estrategia de Conversión HTML → Entrada Optimizada**

#### **Opción A: HTML Minificado (Recomendado para GPT-4o-mini)**
```typescript
// 1. Eliminar scripts, styles, comments
// 2. Preservar estructura semántica (article, section, header, main)
// 3. Mantener atributos importantes (class, id, data-*, aria-*)
// 4. Comprimir whitespace

// Resultado: HTML limpio, 60-70% más pequeño, 100% funcional para análisis
```

#### **Opción B: Markdown (Alternativa para casos complejos)**
```typescript
// Usar Turndown para convertir HTML → Markdown
// Reduce ~40% adicional de tokens
// Pierde información de clases/IDs específicos
// Solo útil para análisis de contenido, no para selectores
```

**DECISIÓN:** Usar HTML Minificado (Opción A) para preservar selectores CSS intactos.

---

### **4. Flujo de Análisis Inteligente**

#### **FASE 1: Análisis de Listado**
```
1. Usuario ingresa: listingUrl
2. Backend extrae HTML con Puppeteer (waitForSelector para artículos)
3. Backend minifica HTML
4. Backend envía a GPT-4o-mini con prompt:
   "Analiza esta página de noticias y encuentra el selector CSS que captura
    TODOS los enlaces de artículos. Devuelve JSON con el selector y confianza."
5. GPT-4o-mini responde con: { articleLinks: "selector", confidence: 0.95 }
6. Backend VALIDA ejecutando selector en página real
7. Backend extrae 5-10 URLs de prueba
8. Respuesta al frontend: { selector, urls, confidence }
```

#### **FASE 2: Análisis de Contenido**
```
1. Usuario ingresa: testUrl (URL de un artículo)
2. Backend extrae HTML con Puppeteer
3. Backend minifica HTML
4. Backend envía a GPT-4o-mini con prompt:
   "Analiza este artículo y encuentra selectores para: título, contenido,
    imagen, autor, fecha, categoría. Devuelve JSON estructurado."
5. GPT-4o-mini responde con selectores
6. Backend VALIDA ejecutando selectores en página real
7. Backend extrae contenido de prueba
8. Respuesta al frontend: { selectors, extractedPreview, confidence }
```

#### **FASE 3: Validación Cruzada**
```
1. Backend toma URLs del listado
2. Prueba selectores de contenido en 3-5 artículos aleatorios
3. Calcula tasa de éxito
4. Si éxito < 80%: refina selectores con GPT-4o-mini
5. Retorna resultado final con métricas de confianza
```

---

## 🏗️ ARQUITECTURA PROPUESTA

```
┌─────────────────────────────────────────────────────────────────┐
│                    MOBILE APP                                    │
│  /outlet/create.tsx                                             │
│                                                                  │
│  [Toggle: Manual / AI Automático]                              │
│                                                                  │
│  Modo AI Automático:                                            │
│  ┌─────────────────────────────────────────────────────┐       │
│  │  1. Nombre del Sitio                                │       │
│  │  2. URL Base                                        │       │
│  │  3. URL de Listado                                  │       │
│  │  4. URL de Prueba (opcional)                        │       │
│  │                                                      │       │
│  │  [Botón: 🤖 Analizar con AI]                       │       │
│  └─────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                 POST /websites/ai-create-outlet
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND - AI ANALYSIS                         │
│                                                                  │
│  1. HTMLExtractionService                                       │
│     ├─ extractHTML(listingUrl) → HTML minificado               │
│     ├─ extractHTML(testUrl) → HTML minificado                  │
│     └─ Puppeteer + Cheerio + html-minifier                     │
│                                                                  │
│  2. OpenAISelectorAnalyzer                                      │
│     ├─ analyzeListingPage(html)                                │
│     │   → { articleLinks: "selector" }                         │
│     │                                                            │
│     ├─ analyzeContentPage(html)                                │
│     │   → { title, content, image, date, author, category }    │
│     │                                                            │
│     └─ GPT-4o-mini + Structured Output                         │
│                                                                  │
│  3. SelectorValidator                                           │
│     ├─ validateListingSelector(url, selector)                  │
│     │   → extrae URLs reales                                    │
│     │                                                            │
│     ├─ validateContentSelectors(url, selectors)                │
│     │   → extrae contenido real                                 │
│     │                                                            │
│     └─ Puppeteer para validación en vivo                       │
│                                                                  │
│  4. WebsiteConfigService                                        │
│     ├─ Crea outlet con selectores validados                    │
│     ├─ Guarda en MongoDB                                        │
│     └─ Retorna outlet + preview                                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                 Response con resultados
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    MOBILE APP                                    │
│  /outlet/ai-analysis-result.tsx                                │
│                                                                  │
│  ✅ Análisis completado con confianza: 95%                     │
│                                                                  │
│  📋 Selectores Detectados:                                      │
│  ├─ Listado: .article-card a.title-link                        │
│  ├─ Título: h1.entry-title                                     │
│  ├─ Contenido: .entry-content                                  │
│  └─ Imagen: .featured-image img                                │
│                                                                  │
│  🔍 Preview de Extracción:                                      │
│  ├─ 12 artículos encontrados                                   │
│  └─ [Muestra títulos extraídos]                                │
│                                                                  │
│  [Botón: ✅ Aprobar y Guardar]                                 │
│  [Botón: ✏️ Ajustar Manualmente]                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 PLAN DE IMPLEMENTACIÓN (7 FASES)

### **FASE 1: Setup e Infraestructura Backend** ⏱️ 2-3 horas

**Objetivo:** Preparar servicios base y dependencias

**Tareas:**
1. Instalar dependencias NPM:
   ```bash
   yarn add cheerio turndown html-minifier-terser
   ```
2. Crear estructura de carpetas:
   ```
   src/
   ├── ai-extraction/
   │   ├── services/
   │   │   ├── html-extraction.service.ts
   │   │   ├── openai-selector-analyzer.service.ts
   │   │   └── selector-validator.service.ts
   │   ├── controllers/
   │   │   └── ai-outlet.controller.ts
   │   ├── dtos/
   │   │   ├── ai-analyze-listing.dto.ts
   │   │   ├── ai-analyze-content.dto.ts
   │   │   └── ai-create-outlet.dto.ts
   │   └── utils/
   │       ├── html-optimizer.util.ts
   │       └── selector-validator.util.ts
   ```
3. Configurar variables de entorno para OpenAI
4. Verificar que Puppeteer esté configurado correctamente

**Archivos nuevos:**
- `src/ai-extraction/` (carpeta completa)

**Archivos modificados:**
- `.env` - Agregar OPENAI_API_KEY
- `package.json` - Nuevas dependencias

---

### **FASE 2: Servicio de Extracción HTML** ⏱️ 3-4 horas

**Objetivo:** Implementar extracción y optimización de HTML

**Implementar:**
1. **HTMLExtractionService** (`html-extraction.service.ts`)
   - `extractStaticHTML(url: string)` - Sin ejecutar JS
   - `extractDynamicHTML(url: string)` - Con carga completa
   - `minimizeHTML(html: string)` - Minificación inteligente
   - Configuración de timeouts y user-agents

2. **HTMLOptimizer Utility** (`html-optimizer.util.ts`)
   - `removeUnnecessaryTags()` - Elimina scripts, styles
   - `preserveSemanticStructure()` - Mantiene article, section, etc.
   - `cleanAttributes()` - Mantiene solo class, id, data-*, aria-*
   - `compressWhitespace()` - Reduce espacios
   - `estimateTokens()` - Calcula tokens aproximados

**Tests:**
- Probar con 3-5 sitios de noticias reales
- Verificar reducción de tamaño (target: 60-70%)
- Validar que estructura semántica se preserva

**Archivos nuevos:**
- `src/ai-extraction/services/html-extraction.service.ts`
- `src/ai-extraction/utils/html-optimizer.util.ts`
- `src/ai-extraction/services/html-extraction.service.spec.ts` (tests)

---

### **FASE 3: Servicio de Análisis OpenAI** ⏱️ 4-5 horas

**Objetivo:** Implementar análisis inteligente con GPT-4o-mini

**Implementar:**
1. **OpenAISelectorAnalyzerService** (`openai-selector-analyzer.service.ts`)
   - Configurar cliente de OpenAI
   - Crear prompts optimizados para:
     - Análisis de página de listado
     - Análisis de página de contenido
   - Implementar Structured Outputs (JSON Schema)
   - Manejo de errores y reintentos
   - Rate limiting

2. **Prompts Especializados:**
   ```typescript
   const LISTING_ANALYSIS_PROMPT = `
   Eres un experto en web scraping. Analiza el siguiente HTML de una página
   de noticias y encuentra el selector CSS que captura TODOS los enlaces (<a>)
   de artículos individuales.

   CRITERIOS:
   - El selector debe matchear múltiples elementos (lista de artículos)
   - Prioriza selectores específicos y estables (clases, IDs)
   - Evita selectores genéricos como "a" o "div > a"
   - El selector debe apuntar al <a> que contiene el enlace

   HTML:
   {html}

   Responde SOLO con JSON siguiendo este schema exacto.
   `;

   const CONTENT_ANALYSIS_PROMPT = `
   Eres un experto en web scraping. Analiza el siguiente HTML de un artículo
   de noticias y encuentra los selectores CSS para extraer:

   1. titleSelector - Título principal del artículo
   2. contentSelector - Cuerpo completo del artículo (todos los párrafos)
   3. imageSelector - Imagen principal (opcional)
   4. dateSelector - Fecha de publicación (opcional)
   5. authorSelector - Autor del artículo (opcional)
   6. categorySelector - Categoría/sección (opcional)

   CRITERIOS:
   - Selectores específicos y estables
   - contentSelector debe capturar TODO el texto, no solo un párrafo
   - Si un campo opcional no existe, devuelve ""

   HTML:
   {html}

   Responde SOLO con JSON siguiendo este schema exacto.
   `;
   ```

3. **JSON Schemas para Structured Output:**
   ```typescript
   const listingSchema = {
     type: "object",
     properties: {
       articleLinks: { type: "string" },
       confidence: { type: "number", minimum: 0, maximum: 1 },
       reasoning: { type: "string" }
     },
     required: ["articleLinks", "confidence"]
   };

   const contentSchema = {
     type: "object",
     properties: {
       titleSelector: { type: "string" },
       contentSelector: { type: "string" },
       imageSelector: { type: "string" },
       dateSelector: { type: "string" },
       authorSelector: { type: "string" },
       categorySelector: { type: "string" },
       confidence: { type: "number", minimum: 0, maximum: 1 },
       reasoning: { type: "string" }
     },
     required: ["titleSelector", "contentSelector", "confidence"]
   };
   ```

**Tests:**
- Probar con 5+ páginas de noticias diferentes
- Validar que respuestas cumplan JSON Schema
- Medir precisión de selectores (deben funcionar en validación)

**Archivos nuevos:**
- `src/ai-extraction/services/openai-selector-analyzer.service.ts`
- `src/ai-extraction/services/openai-selector-analyzer.service.spec.ts`
- `src/ai-extraction/prompts/listing-analysis.prompt.ts`
- `src/ai-extraction/prompts/content-analysis.prompt.ts`

---

### **FASE 4: Validador de Selectores** ⏱️ 3-4 horas

**Objetivo:** Validar selectores en páginas reales

**Implementar:**
1. **SelectorValidatorService** (`selector-validator.service.ts`)
   - `validateListingSelector(url, selector)` - Ejecuta selector, extrae URLs
   - `validateContentSelectors(url, selectors)` - Extrae contenido real
   - `testSelectorStability(urls, selectors)` - Prueba en múltiples páginas
   - `calculateSuccessRate()` - Tasa de éxito de extracción

2. **Lógica de Validación:**
   ```typescript
   async validateListingSelector(url: string, selector: string) {
     const page = await this.puppeteerService.getPage();
     await page.goto(url);

     // Ejecutar selector
     const links = await page.$$eval(selector, (elements) =>
       elements.map(el => el.href).filter(Boolean)
     );

     // Validaciones
     if (links.length === 0) return { valid: false, reason: 'No URLs found' };
     if (links.length < 3) return { valid: false, reason: 'Too few URLs' };

     // Verificar que sean URLs absolutas o relativas válidas
     const validUrls = links.filter(url =>
       url.startsWith('http') || url.startsWith('/')
     );

     return {
       valid: validUrls.length >= 3,
       urls: validUrls.slice(0, 10), // Primeras 10
       count: validUrls.length
     };
   }
   ```

**Tests:**
- Probar con selectores válidos e inválidos
- Verificar que detecta selectores que no matchean nada
- Validar extracción de contenido real

**Archivos nuevos:**
- `src/ai-extraction/services/selector-validator.service.ts`
- `src/ai-extraction/services/selector-validator.service.spec.ts`
- `src/ai-extraction/utils/selector-validator.util.ts`

---

### **FASE 5: Controlador y Endpoints Backend** ⏱️ 3-4 horas

**Objetivo:** Exponer funcionalidad vía API REST

**Implementar:**
1. **DTOs:**
   ```typescript
   // ai-analyze-listing.dto.ts
   export class AiAnalyzeListingDto {
     @IsUrl()
     listingUrl: string;
   }

   // ai-analyze-content.dto.ts
   export class AiAnalyzeContentDto {
     @IsUrl()
     contentUrl: string;
   }

   // ai-create-outlet.dto.ts
   export class AiCreateOutletDto {
     @IsString()
     @MinLength(3)
     name: string;

     @IsUrl()
     baseUrl: string;

     @IsUrl()
     listingUrl: string;

     @IsUrl()
     @IsOptional()
     testUrl?: string;
   }
   ```

2. **AiOutletController** (`ai-outlet.controller.ts`)
   ```typescript
   @Controller('generator-pro/websites/ai')
   export class AiOutletController {
     @Post('analyze-listing')
     async analyzeListing(@Body() dto: AiAnalyzeListingDto) {
       // 1. Extraer HTML
       const html = await this.htmlExtraction.extractDynamicHTML(dto.listingUrl);

       // 2. Analizar con OpenAI
       const analysis = await this.openaiAnalyzer.analyzeListingPage(html, dto.listingUrl);

       // 3. Validar selector
       const validation = await this.validator.validateListingSelector(
         dto.listingUrl,
         analysis.articleLinks
       );

       // 4. Retornar resultado
       return {
         selector: analysis.articleLinks,
         confidence: analysis.confidence,
         urlsFound: validation.urls,
         count: validation.count,
         reasoning: analysis.reasoning
       };
     }

     @Post('analyze-content')
     async analyzeContent(@Body() dto: AiAnalyzeContentDto) {
       // Similar flow para contenido
     }

     @Post('create-outlet')
     async createOutletWithAI(@Body() dto: AiCreateOutletDto) {
       // Flujo completo: listing + content + validación + creación
     }
   }
   ```

**Tests:**
- Probar endpoints con Postman/Insomnia
- Validar responses cumplen contratos
- Medir tiempos de respuesta (target: < 15 segundos)

**Archivos nuevos:**
- `src/ai-extraction/controllers/ai-outlet.controller.ts`
- `src/ai-extraction/dtos/ai-analyze-listing.dto.ts`
- `src/ai-extraction/dtos/ai-analyze-content.dto.ts`
- `src/ai-extraction/dtos/ai-create-outlet.dto.ts`
- `src/ai-extraction/ai-extraction.module.ts`

**Archivos modificados:**
- `src/app.module.ts` - Importar AiExtractionModule

---

### **FASE 6: Mobile App - Servicios y Hooks** ⏱️ 3-4 horas

**Objetivo:** Integrar funcionalidad AI en mobile app

**Implementar:**
1. **Tipos TypeScript** (`ai-outlet.types.ts`)
   ```typescript
   export interface AiAnalyzeListingRequest {
     listingUrl: string;
   }

   export interface AiAnalyzeListingResponse {
     selector: string;
     confidence: number;
     urlsFound: string[];
     count: number;
     reasoning: string;
   }

   export interface AiAnalyzeContentRequest {
     contentUrl: string;
   }

   export interface AiAnalyzeContentResponse {
     selectors: {
       titleSelector: string;
       contentSelector: string;
       imageSelector?: string;
       dateSelector?: string;
       authorSelector?: string;
       categorySelector?: string;
     };
     confidence: number;
     extractedPreview: {
       title: string;
       content: string;
       image?: string;
       date?: string;
       author?: string;
       category?: string;
     };
     reasoning: string;
   }

   export interface AiCreateOutletRequest {
     name: string;
     baseUrl: string;
     listingUrl: string;
     testUrl?: string;
   }

   export interface AiCreateOutletResponse {
     outlet: OutletConfig;
     listingAnalysis: AiAnalyzeListingResponse;
     contentAnalysis: AiAnalyzeContentResponse;
     validationResults: {
       listingSuccess: boolean;
       contentSuccess: boolean;
       overallConfidence: number;
     };
   }
   ```

2. **Servicio API** (`aiOutletApi.ts`)
   ```typescript
   import { rawClient } from '../apiClient';
   import type {
     AiAnalyzeListingRequest,
     AiAnalyzeListingResponse,
     AiAnalyzeContentRequest,
     AiAnalyzeContentResponse,
     AiCreateOutletRequest,
     AiCreateOutletResponse
   } from '@/src/types/ai-outlet.types';

   export const aiOutletApi = {
     analyzeListing: async (data: AiAnalyzeListingRequest) => {
       const response = await rawClient.post<AiAnalyzeListingResponse>(
         '/generator-pro/websites/ai/analyze-listing',
         data,
         { timeout: 30000 } // 30 segundos
       );
       return response.data;
     },

     analyzeContent: async (data: AiAnalyzeContentRequest) => {
       const response = await rawClient.post<AiAnalyzeContentResponse>(
         '/generator-pro/websites/ai/analyze-content',
         data,
         { timeout: 30000 }
       );
       return response.data;
     },

     createOutletWithAI: async (data: AiCreateOutletRequest) => {
       const response = await rawClient.post<AiCreateOutletResponse>(
         '/generator-pro/websites/ai/create-outlet',
         data,
         { timeout: 60000 } // 60 segundos para flujo completo
       );
       return response.data;
     }
   };
   ```

3. **Hooks React Query** (`useAiOutlets.ts`)
   ```typescript
   import { useMutation, useQueryClient } from '@tanstack/react-query';
   import { useRouter } from 'expo-router';
   import { aiOutletApi } from '@/src/services/outlets/aiOutletApi';
   import { outletKeys } from './useOutlets';

   export function useAiAnalyzeListing() {
     return useMutation({
       mutationFn: aiOutletApi.analyzeListing,
       // No navigation, solo retorna datos
     });
   }

   export function useAiAnalyzeContent() {
     return useMutation({
       mutationFn: aiOutletApi.analyzeContent,
     });
   }

   export function useAiCreateOutlet() {
     const queryClient = useQueryClient();
     const router = useRouter();

     return useMutation({
       mutationFn: aiOutletApi.createOutletWithAI,
       onSuccess: (result) => {
         // Invalidar lista de outlets
         queryClient.invalidateQueries({ queryKey: outletKeys.lists() });

         // Navegar a pantalla de resultados con análisis completo
         router.push({
           pathname: '/outlet/ai-analysis-result',
           params: { result: JSON.stringify(result) }
         });
       },
     });
   }
   ```

**Tests:**
- Verificar que requests lleguen correctamente al backend
- Validar manejo de loading states
- Probar manejo de errores (timeout, network)

**Archivos nuevos:**
- `src/types/ai-outlet.types.ts`
- `src/services/outlets/aiOutletApi.ts`
- `src/hooks/useAiOutlets.ts`

---

### **FASE 7: Mobile App - UI/UX** ⏱️ 4-5 horas

**Objetivo:** Implementar interfaz para creación automática con AI

**Implementar:**

1. **Modificar `/outlet/create.tsx`**
   ```typescript
   // Agregar estado para modo
   const [mode, setMode] = useState<'manual' | 'ai'>('manual');

   // Agregar formulario simplificado para modo AI
   {mode === 'ai' && (
     <Card>
       <CardContent>
         <Input label="Nombre" />
         <Input label="URL Base" />
         <Input label="URL de Listado" />
         <Input label="URL de Prueba (opcional)" />

         <Button
           onPress={handleAiAnalyze}
           loading={aiCreateOutlet.isPending}
         >
           🤖 Analizar con AI
         </Button>
       </CardContent>
     </Card>
   )}
   ```

2. **Crear `/outlet/ai-analysis-result.tsx`**
   ```typescript
   export default function AiAnalysisResultScreen() {
     const params = useLocalSearchParams<{ result: string }>();
     const result: AiCreateOutletResponse = JSON.parse(params.result);

     return (
       <ScrollView>
         {/* Header con confianza */}
         <Card>
           <Text>Análisis completado</Text>
           <Text>Confianza: {result.validationResults.overallConfidence}%</Text>
         </Card>

         {/* Selectores detectados */}
         <Card>
           <CardTitle>Selectores Detectados</CardTitle>
           <Text>Listado: {result.listingAnalysis.selector}</Text>
           <Text>Título: {result.contentAnalysis.selectors.titleSelector}</Text>
           {/* ... más selectores */}
         </Card>

         {/* Preview de extracción */}
         <Card>
           <CardTitle>Preview de Extracción</CardTitle>
           <Text>{result.listingAnalysis.count} artículos encontrados</Text>
           {result.listingAnalysis.urlsFound.map((url, i) => (
             <Text key={i}>{url}</Text>
           ))}
         </Card>

         <Card>
           <CardTitle>Contenido Extraído (Prueba)</CardTitle>
           <Text>{result.contentAnalysis.extractedPreview.title}</Text>
           <Text numberOfLines={5}>
             {result.contentAnalysis.extractedPreview.content}
           </Text>
         </Card>

         {/* Botones de acción */}
         <View>
           <Button onPress={handleApprove}>
             ✅ Aprobar y Guardar
           </Button>
           <Button variant="outline" onPress={handleEdit}>
             ✏️ Ajustar Manualmente
           </Button>
         </View>
       </ScrollView>
     );
   }
   ```

3. **Loading States Mejorados**
   - Agregar ActivityIndicator con mensajes contextuales
   - "Extrayendo HTML..."
   - "Analizando con AI..."
   - "Validando selectores..."
   - "Creando outlet..."

**Tests:**
- Probar flujo completo end-to-end
- Verificar que loading states se muestran correctamente
- Validar navegación entre pantallas
- Probar con URLs reales de sitios de noticias

**Archivos nuevos:**
- `app/(protected)/outlet/ai-analysis-result.tsx`

**Archivos modificados:**
- `app/(protected)/outlet/create.tsx` - Agregar modo AI

---

## 📐 DECISIONES TÉCNICAS

### **1. ¿Por qué GPT-4o-mini y no GPT-4o completo?**
- **Costo:** 60% más barato que GPT-3.5, 80% más barato que GPT-4o
- **Velocidad:** Más rápido para tareas de extracción estructurada
- **Precisión:** Suficiente para análisis de HTML (no requiere razonamiento complejo)
- **Context Window:** 128K tokens es más que suficiente para páginas web

### **2. ¿HTML Minificado o Markdown?**
- **HTML Minificado (Elegido)**
  - ✅ Preserva selectores CSS intactos
  - ✅ Mantiene estructura semántica completa
  - ✅ 60-70% reducción de tamaño
  - ❌ Más tokens que Markdown

- **Markdown (Descartado para selectores)**
  - ✅ ~40% adicional de reducción de tokens
  - ❌ Pierde clases, IDs y atributos
  - ❌ No sirve para extraer selectores CSS
  - ✅ Útil solo para análisis de contenido (no para este caso)

### **3. ¿Validación en Backend o Frontend?**
- **Backend (Elegido)**
  - ✅ Puppeteer solo puede ejecutarse en Node.js
  - ✅ Evita exponer HTML completo al frontend (menos datos)
  - ✅ Control total sobre validación
  - ❌ Aumenta tiempo de respuesta del endpoint

### **4. ¿Flujo Sincrónico o Asíncrono (Jobs)?**
- **Sincrónico con timeout largo (Elegido)**
  - ✅ UX más simple (user espera resultado inmediato)
  - ✅ No requiere polling o WebSockets adicionales
  - ✅ Análisis toma ~10-15 segundos (aceptable)
  - ❌ Usuario debe esperar en pantalla

- **Asíncrono con Jobs (Alternativa futura)**
  - ✅ No bloquea UI
  - ✅ Puede procesar múltiples en paralelo
  - ❌ Requiere polling o WebSockets
  - ❌ UX más compleja

---

## 🎯 MÉTRICAS DE ÉXITO

### **KPIs Técnicos:**
- ✅ Precisión de selectores: > 80% de éxito en validación
- ✅ Tiempo de análisis: < 20 segundos por outlet
- ✅ Reducción de tamaño HTML: 60-70% post-minificación
- ✅ Costo por análisis: < $0.01 USD
- ✅ Tasa de error: < 10%

### **KPIs de Negocio:**
- ✅ Tiempo de configuración de outlet: De 20 minutos → 2 minutos (90% reducción)
- ✅ Tasa de adopción: 80% de usuarios usan modo AI vs manual
- ✅ Satisfacción: NPS > 8/10

---

## 🔐 CONSIDERACIONES DE SEGURIDAD

1. **Rate Limiting OpenAI:**
   - Limitar requests a 10/minuto por usuario
   - Implementar cola si se excede límite

2. **Validación de URLs:**
   - Verificar que URLs sean válidas
   - Bloquear URLs locales (localhost, 192.168.x.x)
   - Timeout en Puppeteer: 30 segundos máximo

3. **Sanitización HTML:**
   - Eliminar scripts antes de enviar a OpenAI
   - Validar que HTML no contenga malware

4. **API Key Protection:**
   - OPENAI_API_KEY en .env, nunca en código
   - Usar variable de entorno en producción

---

## 📦 DEPENDENCIAS NUEVAS

```json
{
  "dependencies": {
    "cheerio": "^1.0.0-rc.12",
    "turndown": "^7.1.2",
    "html-minifier-terser": "^7.2.0"
  }
}
```

---

## 🧪 TESTING STRATEGY

### **Unit Tests:**
- HTMLOptimizer utilities
- Selector validator utilities
- OpenAI response parsers

### **Integration Tests:**
- HTMLExtractionService con Puppeteer
- OpenAISelectorAnalyzer con API real (mock opcional)
- SelectorValidator end-to-end

### **E2E Tests:**
- Flujo completo: crear outlet con AI → validar → guardar
- Probar con 5+ sitios de noticias reales

---

## 📊 ESTIMACIÓN TOTAL

| Fase | Duración | Dependencias |
|------|----------|--------------|
| FASE 1: Setup | 2-3h | - |
| FASE 2: HTML Extraction | 3-4h | FASE 1 |
| FASE 3: OpenAI Analyzer | 4-5h | FASE 1, FASE 2 |
| FASE 4: Validator | 3-4h | FASE 2 |
| FASE 5: Backend API | 3-4h | FASE 2, FASE 3, FASE 4 |
| FASE 6: Mobile Services | 3-4h | FASE 5 |
| FASE 7: Mobile UI | 4-5h | FASE 6 |
| **TOTAL** | **22-29 horas** | **~3-4 días** |

---

## 🚀 ORDEN DE IMPLEMENTACIÓN

```
DÍA 1:
├─ FASE 1: Setup (2-3h)
├─ FASE 2: HTML Extraction (3-4h)
└─ FASE 3: OpenAI Analyzer (inicio, 2h)

DÍA 2:
├─ FASE 3: OpenAI Analyzer (continuación, 2-3h)
├─ FASE 4: Validator (3-4h)
└─ FASE 5: Backend API (inicio, 2h)

DÍA 3:
├─ FASE 5: Backend API (continuación, 1-2h)
├─ FASE 6: Mobile Services (3-4h)
└─ FASE 7: Mobile UI (inicio, 2h)

DÍA 4:
├─ FASE 7: Mobile UI (continuación, 2-3h)
├─ Testing E2E (2h)
└─ Bug fixes y refinamiento (2h)
```

---

## 🎓 REFERENCIAS Y RECURSOS

### **Documentación Oficial:**
- [Puppeteer Docs](https://pptr.dev/)
- [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
- [Cheerio API](https://cheerio.js.org/)
- [Turndown Usage](https://github.com/mixmark-io/turndown)

### **Artículos Investigados:**
- [Web scraping with GPT-4 and Puppeteer (2025)](https://www.browserless.io/blog/ultimate-guide-to-puppeteer-web-scraping-in-2025)
- [GPT-4o mini: advancing cost-efficient intelligence](https://openai.com/index/gpt-4o-mini-advancing-cost-efficient-intelligence/)
- [HTML Parsing with AI (SerpApi experiment)](https://serpapi.com/blog/web-scraping-and-parsing-experiment-with-ai-openai/)
- [Visual Web Scraping with GPT Vision 2025](https://brightdata.com/blog/ai/web-scraping-with-gpt-vision)

### **Librerías Clave:**
- `puppeteer` - Navegador headless
- `cheerio` - DOM manipulation en Node
- `html-minifier-terser` - Minificación HTML
- `turndown` - HTML → Markdown
- `openai` (SDK) - Cliente oficial de OpenAI

---

## ✅ CHECKLIST DE ENTREGABLES

### **Backend:**
- [ ] HTMLExtractionService funcionando
- [ ] OpenAISelectorAnalyzerService funcionando
- [ ] SelectorValidatorService funcionando
- [ ] Endpoints AI implementados y documentados
- [ ] Tests unitarios > 80% coverage
- [ ] Tests E2E con sitios reales

### **Mobile:**
- [ ] Tipos TypeScript completos
- [ ] aiOutletApi service
- [ ] Hooks React Query
- [ ] Modo AI en /outlet/create.tsx
- [ ] Pantalla /outlet/ai-analysis-result.tsx
- [ ] Loading states y error handling

### **Documentación:**
- [ ] README con guía de uso
- [ ] API docs (Swagger/Postman)
- [ ] Diagramas de flujo actualizados

---

## 🎯 SIGUIENTE PASO DESPUÉS DE IMPLEMENTACIÓN

Una vez completado este feature:
1. **Monitorear costos de OpenAI** durante primeras 2 semanas
2. **Recopilar feedback** de usuarios sobre precisión
3. **Iterar prompts** si precisión < 80%
4. **Considerar caché** de análisis para URLs comunes
5. **Implementar modo offline** con selectores pre-aprobados

---

**FIN DEL DOCUMENTO**
