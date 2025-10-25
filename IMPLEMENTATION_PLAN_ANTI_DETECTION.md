# Plan de Implementación Detallado - Sistema Anti-Detección
## Scraping con Rotación de Proxies para NestJS Backend

**Proyecto:** Noticias Pachuca - Backend API
**Fecha:** 21 de Octubre de 2025
**Elaborado por:** Jarvis (Backend Architect + Technical Researcher)

---

## Índice

1. [Preguntas Clave Antes de Arrancar](#preguntas-clave-antes-de-arrancar)
2. [Visión General](#visión-general)
3. [Análisis del Sistema Actual](#análisis-del-sistema-actual)
4. [Arquitectura Propuesta](#arquitectura-propuesta)
5. [Plan de Implementación por Fases](#plan-de-implementación-por-fases)
6. [Checklist Detallado](#checklist-detallado)
7. [Resumen Ejecutivo por Fase](#resumen-ejecutivo-por-fase)
8. [Métricas de Éxito](#métricas-de-éxito)

---

## Preguntas Clave Antes de Arrancar

### 🚦 IMPORTANTE: Responder ANTES de Iniciar la Implementación

Estas preguntas definen el alcance, presupuesto y estrategia del proyecto. Es fundamental responderlas antes de empezar cualquier fase de desarrollo.

---

#### 1. ¿Qué estrategia de implementación prefieres?

**Opción A: RÁPIDA (Empezar con lo básico)**
- ✅ **Alcance:** Solo Fase 0 + Fase 1 (Quick Wins)
- ⏱️ **Duración:** 9-12 horas total
- 💰 **Costo:** $0
- 📈 **Mejora esperada:** +10-15% en tasa de éxito inmediata
- 🎯 **Ideal para:** Validar el concepto antes de invertir más tiempo
- **Después:** Evaluar resultados y decidir si continuar con más fases

**Opción B: GRADUAL (Recomendada)**
- ✅ **Alcance:** Implementación por etapas con validación
  - Etapa 1: Fase 0+1 → Validar → Aprobar siguiente etapa
  - Etapa 2: Fase 2+3 → Validar → Aprobar siguiente etapa
  - Etapa 3: Fase 4+5+6+7 → Deploy a producción
- ⏱️ **Duración:** 8-12 semanas (flexible)
- 💰 **Costo:** Incremental ($0 → $30-50/mes)
- 📈 **Mejora esperada:** 70% → 85% → 92%+
- 🎯 **Ideal para:** Minimizar riesgos, validar cada paso

**Opción C: COMPLETA (Máximo impacto)**
- ✅ **Alcance:** Todas las fases secuenciales (0-7)
- ⏱️ **Duración:** 8-12 semanas continuas
- 💰 **Costo:** $40-70/mes desde el inicio
- 📈 **Mejora esperada:** 70% → 92%+ al final
- 🎯 **Ideal para:** Si ya estás seguro del ROI y quieres máxima mejora

**📝 Tu respuesta:**
```
[ ] Opción A - RÁPIDA (validar primero)
[ ] Opción B - GRADUAL (recomendada)
[ ] Opción C - COMPLETA (full implementation)
[ ] Otra: _________________________________
```

---

#### 2. ¿Cuál es tu presupuesto mensual máximo?

Este presupuesto define qué tipo de proxies y servicios podemos usar:

**Opción A: $0 (Solo soluciones gratuitas)**
- ✅ Proxies: Webshare (10 gratis) + Free proxy lists (GitHub)
- ✅ CAPTCHA: Manual o sin resolver
- ✅ Framework: Crawlee + rebrowser-patches (gratis)
- ⚠️ **Limitaciones:**
  - Success rate limitado (~75-80%)
  - Proxies no confiables
  - No apto para sitios con protección fuerte
- 🎯 **Ideal para:** Testing, proyectos personales, POC

**Opción B: $20-30/mes (Budget consciente)**
- ✅ Proxies: ProxyWing ($2.50/GB residential, ~10GB)
- ✅ CAPTCHA: NoCaptchaAI ($10 = 71,428 CAPTCHAs)
- ✅ Framework: Crawlee + rebrowser-patches (gratis)
- ✅ **Capacidad:** ~50,000 requests/mes
- 📈 **Success rate esperado:** 85-90%
- 🎯 **Ideal para:** Startups, freelancers, MVPs

**Opción C: $50-100/mes (Producción)**
- ✅ Proxies: Smartproxy ($3.50/GB, ~20-30GB) o ScraperAPI ($49/mes)
- ✅ CAPTCHA: 2Captcha ($20-30)
- ✅ Framework: Crawlee + rebrowser-patches + fallback a API
- ✅ **Capacidad:** 500K-2M requests/mes
- 📈 **Success rate esperado:** 90-95%
- 🎯 **Ideal para:** Producción, negocios establecidos

**Opción D: $100+/mes (Sin límite)**
- ✅ Proxies: Bright Data, Oxylabs (premium)
- ✅ CAPTCHA: Servicios premium
- ✅ Framework: ScraperAPI Enterprise + custom solutions
- ✅ **Capacidad:** 10M+ requests/mes
- 📈 **Success rate esperado:** 95-99%
- 🎯 **Ideal para:** Enterprise, alto volumen

**📝 Tu respuesta:**
```
Presupuesto mensual máximo: $__________

Desglose preferido:
- Proxies: $__________
- CAPTCHA: $__________
- Otros: $__________
```

---

#### 3. ¿Qué fases quieres aprobar para implementación?

Marca con ✅ las fases que autorizas. Puedes aprobar todas o solo algunas:

```
[ ] FASE 0: Preparación (4-6h)
    - Backup, instalación de dependencias, configuración
    - Riesgo: 🟢 Muy bajo | Costo: $0

[ ] FASE 1: Quick Wins (5-6h) ⭐ ALTA PRIORIDAD
    - User-Agents 2025, Sec-CH-UA headers, rebrowser, rate limiting
    - Riesgo: 🟢 Muy bajo | Costo: $0 | Impacto: +10-15% inmediato

[ ] FASE 2: Módulo ScrapingModule Base (12-16h)
    - Servicios de proxies, fingerprints, métricas
    - Riesgo: 🟡 Medio | Costo: $0

[ ] FASE 3: Anti-Detección Avanzada (12-18h)
    - AdvancedScrapingService, fallback chain (Cheerio→Rebrowser→Crawlee)
    - Riesgo: 🟡 Medio | Costo: $0

[ ] FASE 4: CAPTCHA & Métricas (8-12h)
    - CaptchaSolverService, dashboard de métricas
    - Riesgo: 🟢 Bajo | Costo: $10-20/mes

[ ] FASE 5: Integración con Módulos Existentes (8-10h) ⚠️ CRÍTICA
    - Modificar NoticiasModule y GeneratorProModule
    - Riesgo: 🔴 Alto | Costo: $0
    - ⚠️ Requiere aprobación EXPLÍCITA (cambia código core)

[ ] FASE 6: Testing Completo (12-16h)
    - Testing extensivo, configuración de proxies reales
    - Riesgo: 🟡 Medio | Costo: $30-50/mes

[ ] FASE 7: Deploy a Producción (4-6h)
    - Staging → Producción con monitoring
    - Riesgo: 🟡 Medio | Costo: $40-70/mes
```

---

#### 4. ¿Qué nivel de mejora esperas/necesitas?

Define tus expectativas de success rate:

**Escenario A: Mejora Básica**
- 📊 **Objetivo:** 70% → 80-85%
- ✅ **Fases necesarias:** 0, 1, 2, 3
- ⏱️ **Tiempo:** ~4-6 semanas
- 💰 **Costo:** $0-20/mes

**Escenario B: Mejora Significativa (Recomendado)**
- 📊 **Objetivo:** 70% → 90-92%
- ✅ **Fases necesarias:** 0, 1, 2, 3, 4, 5, 6
- ⏱️ **Tiempo:** ~8-10 semanas
- 💰 **Costo:** $30-50/mes

**Escenario C: Máxima Optimización**
- 📊 **Objetivo:** 70% → 95%+
- ✅ **Fases necesarias:** Todas (0-7) + optimizaciones continuas
- ⏱️ **Tiempo:** ~10-12 semanas + ongoing
- 💰 **Costo:** $50-100/mes

**📝 Tu respuesta:**
```
Success rate objetivo: ______%
Tiempo disponible: ______ semanas
```

---

#### 5. ¿Cuándo quieres empezar?

**Opción A: Ahora (inmediatamente)**
- Empezamos con Fase 0 en cuanto apruebes
- Timeline agresivo

**Opción B: Fecha específica**
- Inicio planificado: ___/___/2025
- Permite preparación y coordinación

**Opción C: Más adelante**
- Plan queda documentado para implementación futura
- Sin fecha definida aún

**📝 Tu respuesta:**
```
Fecha de inicio preferida: ___/___/2025
```

---

#### 6. ¿Quién hará el testing manual?

Como mencionaste que NO haremos testing automático:

**📝 Tu respuesta:**
```
Persona responsable de testing: _______________________
Disponibilidad para testing: _______ horas/semana
Horario preferido: _______________________
```

---

#### 7. ¿Tienes alguna restricción o requerimiento especial?

Marca todas las que apliquen:

```
[ ] No podemos tener downtime en producción
[ ] Necesitamos mantener el código 100% compatible con versión actual
[ ] Tenemos restricciones de presupuesto muy estrictas
[ ] Necesitamos documentación exhaustiva de cada cambio
[ ] Queremos poder hacer rollback fácilmente
[ ] Tenemos ventanas de deploy específicas (especificar: _______)
[ ] Necesitamos aprobar cada fase individualmente
[ ] Otros: _________________________________
```

---

### 📋 Resumen de Decisiones

Una vez respondidas las preguntas, completa este resumen:

```
=================================================
CONFIGURACIÓN DEL PROYECTO - ANTI-DETECCIÓN SYSTEM
=================================================

Estrategia: [ ] Rápida  [ ] Gradual  [ ] Completa
Presupuesto mensual: $__________
Fases aprobadas: ___________________________
Success rate objetivo: ______%
Fecha de inicio: ___/___/2025
Responsable de testing: _____________________

Notas adicionales:
_________________________________________________
_________________________________________________
_________________________________________________

Aprobado por: ________________  Fecha: ___/___/2025
```

---

## Visión General

### Objetivo Principal
Implementar un sistema avanzado de scraping con anti-detección que mejore la tasa de éxito del 70% actual a 92%+ mediante:
- Rotación inteligente de proxies (tiered escalation)
- Tecnología anti-detección moderna (rebrowser-patches)
- Resolución de CAPTCHAs
- Gestión de rate limiting avanzada
- Sistema de métricas y monitoreo

### Filosofía de Implementación
✅ **SIN forwardRef** - Usar EventEmitter2 para comunicación entre módulos
✅ **SIN any types** - Tipado estricto TypeScript
✅ **SIN testing automático** - Testing manual por el equipo
✅ **Build después de cada fase** - Verificar que el servidor levanta sin errores
✅ **Implementación incremental** - Cada fase es funcional e independiente

### Presupuesto Estimado
- **Desarrollo:** 0 horas (solución open-source)
- **Infraestructura:** $30-50/mes
  - ProxyWing: $25/mes (10GB residential)
  - NoCaptchaAI: $10/mes
  - VPS actual: $0 (ya existente)

---

## Análisis del Sistema Actual

### Flujo de Extracción Actual

#### 1. Extracción de URLs (Módulo Generator-Pro)
```
RapidAPI Facebook → UrlDetectionService
                        ↓
            Extracción de URLs de posts
                        ↓
            Almacenamiento en ExternalUrl
                        ↓
            UrlExtractionService.extractUrls()
                        ↓
            Scraping de listing pages (Cheerio/Puppeteer)
                        ↓
            Parsing con CSS selectors (listingSelectors.articleLinks)
                        ↓
            Hash SHA-256 para deduplicación
                        ↓
            Verificación en ExtractedUrlTracking
                        ↓
            Queue en Bull (extract_content)
```

#### 2. Extracción de Contenido
```
Bull Queue → NoticiasExtractionProcessor / ExtractionProcessor
                        ↓
            Cache check (Redis, 30 min TTL)
                        ↓
            ┌─────────────────────┐
            │   Cache HIT?        │
            └─────────┬───────────┘
                      │
        ┌─────────────┴─────────────┐
        │ YES                       │ NO
        │                           │
        ▼                           ▼
    Return cached            Scraping Execution
                                    │
                    ┌───────────────┴───────────────┐
                    │ useJavaScript?                │
                    └───────┬───────────────────────┘
                            │
                ┌───────────┴───────────┐
                │ NO                    │ YES
                │                       │
                ▼                       ▼
        Cheerio (Static)        Puppeteer (Dynamic)
        - axios.get()           - PuppeteerManagerService
        - cheerio.load()        - Browser pool (max 5)
        - CSS selectors         - Stealth config
                                - Request interception
                │                       │
                └───────────┬───────────┘
                            ▼
                    Extracción de datos
                    - title, content, images
                    - date, author, categories
                    - keywords (frequency analysis)
                            ▼
                    Data cleaning
                    - Remove scripts, styles
                    - Normalize whitespace
                    - Extract keywords
                            ▼
                    Quality metrics
                    - Title/content quality
                    - Completeness (0-100%)
                    - Confidence score
                            ▼
                    Almacenamiento
                    - ExtractedNoticia (MongoDB)
                    - NoticiasExtractionLog
                    - Update URL status
```

### Servicios Involucrados

#### Módulo Noticias
```typescript
// packages/api-nueva/src/noticias/

NoticiasScrapingService
├─ extractFromUrl(url, config)
├─ extractWithCheerio(url, config)
├─ extractWithPuppeteer(url, config)
├─ enforceRateLimit(domain)
├─ getRandomUserAgent()
└─ parseHtml(html, selectors)

NoticiasExtractionService
├─ queueExtraction(configId, urls)
├─ processBatch(urls)
└─ retryFailed(jobId)

NoticiasConfigService
├─ create(config)
├─ update(id, config)
└─ testSelectors(url, selectors)

UrlDetectionService
└─ findExternalUrls(facebookPosts)

NoticiasEventsService (EventEmitter2)
└─ emitExtractionComplete(data)
```

#### Módulo Generator-Pro
```typescript
// packages/api-nueva/src/generator-pro/

NewsWebsiteService
├─ extractNewsContent(url, configId)
├─ scrapeWithCheerio(url)
└─ scrapeWithPuppeteer(url)

UrlExtractionService
├─ extractUrls(websiteConfigId)
├─ processExtractedUrls(urls)
└─ deduplicateUrls(urls)

GeneratorProOrchestratorService
├─ runFullPipeline(websiteConfigId)
├─ orchestrateExtraction()
├─ orchestrateGeneration()
└─ orchestratePublishing()
```

#### Módulo Reports (Compartido)
```typescript
// packages/api-nueva/src/modules/reports/

PuppeteerManagerService
├─ launchBrowser()
├─ getRenderedHTML(url, options)
├─ healthCheck()
├─ cleanup()
└─ metrics tracking (uptime, errors)
```

### Tecnologías Actuales
- **HTTP Client:** axios v1.12.2
- **HTML Parser:** cheerio v1.1.2
- **Browser:** puppeteer v24.25.0 + puppeteer-extra + stealth plugin
- **Queue:** bull v4.16.5 (Redis backend)
- **Cache:** @nestjs/cache-manager v3+ (@keyv/redis)
- **Events:** @nestjs/event-emitter v3.0.1

### Capacidades Anti-Detección Actuales
✅ User-Agent rotation (5 UAs - **versiones 2024**)
✅ Rate limiting (domain-specific, Redis-backed)
✅ Cache strategy (SHA-256 keys, 30 min TTL)
✅ Custom headers (realistic pero **sin Sec-CH-UA**)
✅ Puppeteer optimization flags
✅ Request interception (bloquea imágenes/CSS/fonts)

❌ **NO hay rotación de proxies**
❌ **NO hay rebrowser-patches** (Cloudflare bypass)
❌ **NO hay resolución de CAPTCHAs**
❌ **NO hay fingerprint moderno** (2025)
❌ **NO hay TLS fingerprinting fixes**
❌ **NO hay métricas de éxito por dominio**

### Problemas Identificados
1. **Bloqueos por IP** - Sin proxies, requests desde misma IP
2. **Cloudflare challenges** - Stealth plugin no funciona en 2025
3. **User-Agents desactualizados** - Chrome 120 → debe ser Chrome 131
4. **Headers incompletos** - Falta Sec-CH-UA (requerido 2025)
5. **Sin fallback strategy** - Si Cheerio/Puppeteer fallan, no hay plan B
6. **Sin métricas** - No se sabe qué dominios bloquean más

---

## Arquitectura Propuesta

### Nuevo Módulo: ScrapingModule

**Ubicación:** `/packages/api-nueva/src/scraping/`

**Estructura:**
```
src/scraping/
├── scraping.module.ts
├── services/
│   ├── advanced-scraping.service.ts       # Core: Lógica principal con fallback chain
│   ├── proxy-configuration.service.ts     # Gestión de proxies (tiered escalation)
│   ├── fingerprint-generator.service.ts   # Generación de fingerprints modernos
│   ├── captcha-solver.service.ts          # Integración NoCaptchaAI / 2Captcha
│   ├── rate-limiter.service.ts            # Bottleneck + exponential backoff
│   └── scraping-metrics.service.ts        # Métricas de éxito por dominio
├── dto/
│   ├── scraper-config.dto.ts              # DTOs con validación
│   └── scraping-result.dto.ts
├── interfaces/
│   ├── proxy.interface.ts
│   ├── fingerprint.interface.ts
│   └── scraping.interface.ts
└── utils/
    ├── user-agents.util.ts                # UAs 2025 (Chrome 131, Firefox 133)
    └── headers.util.ts                    # Headers con Sec-CH-UA
```

### Principios de Diseño

#### 1. Centralización sin Circular Dependencies
```typescript
// ❌ MAL (circular)
NoticiasModule → ScrapingModule → NoticiasModule

// ✅ BIEN (unidireccional)
ScrapingModule (independiente)
    ↑
    │ usa
    │
    ├─ NoticiasModule
    └─ GeneratorProModule
```

#### 2. Comunicación con EventEmitter2
```typescript
// Sin forwardRef, comunicación por eventos
@Injectable()
export class ScrapingMetricsService {
  constructor(private eventEmitter: EventEmitter2) {}

  recordSuccess(url: string, data: any) {
    this.eventEmitter.emit('scraping.success', { url, ...data });
  }
}

// Otros módulos escuchan
@Injectable()
export class NoticiasEventsService {
  @OnEvent('scraping.success')
  handleScrapingSuccess(payload: any) {
    // Actualizar estadísticas
  }
}
```

#### 3. Tipado Estricto (Sin Any)
```typescript
// ❌ MAL
async scrape(url: string, config: any): Promise<any>

// ✅ BIEN
async scrape(url: string, config: ScraperConfig): Promise<ScrapingResult>

interface ScraperConfig {
  selectors: SelectorConfig;
  useProxy: boolean;
  useJavaScript: boolean;
  timeout: number;
  proxyOptions?: ProxyOptions;
}

interface ScrapingResult {
  success: boolean;
  data: ExtractedContent;
  metadata: ScrapingMetadata;
  method: 'cheerio' | 'rebrowser' | 'crawlee' | 'scraperapi';
  cost: number;
}
```

### Flujo Mejorado con Anti-Detección

```
URL a scraper
      ↓
RateLimiterService.checkAndWait(url)
      ↓
ProxyConfigurationService.getProxy(url)
      ├─ Consulta métricas del dominio
      ├─ Si dominio bloqueado por Cloudflare → proxy residential/mobile
      ├─ Si dominio sin problemas → sin proxy o datacenter
      └─ Retorna proxy con health check
      ↓
FingerprintGeneratorService.generate()
      ├─ Genera UA moderno (Chrome 131, Firefox 133)
      ├─ Genera Sec-CH-UA headers consistentes
      ├─ Genera viewport, screen resolution
      └─ Retorna fingerprint completo
      ↓
AdvancedScrapingService.scrape(url, config, proxy, fingerprint)
      ↓
Fallback Chain (intentar hasta que funcione):
      ├─ 1. Cheerio (rápido, barato, sin JS) → Si falla...
      ├─ 2. Rebrowser-Puppeteer (anti-detección, bypasa Cloudflare) → Si falla...
      ├─ 3. Crawlee (máxima automatización) → Si falla...
      └─ 4. ScraperAPI (garantizado, caro) → Si falla → Error
      ↓
Si CAPTCHA detectado:
      ├─ CaptchaSolverService.solveCaptcha(page, url)
      ├─ NoCaptchaAI / 2Captcha
      └─ Retry navegación
      ↓
Extracción exitosa
      ↓
ScrapingMetricsService.recordAttempt(url, result)
      ├─ Incrementa success/failure counters
      ├─ Actualiza proxy metrics
      ├─ Emite evento 'scraping.success' o 'scraping.failure'
      └─ Trigger alertas si tasa de fallo > 50%
      ↓
Return ScrapingResult
```

### Integración con Módulos Existentes

#### NoticiasScrapingService (MODIFICAR)
```typescript
@Injectable()
export class NoticiasScrapingService {
  constructor(
    // Existentes
    private puppeteerManager: PuppeteerManagerService,
    private cacheService: CacheService,
    // NUEVO
    private advancedScrapingService: AdvancedScrapingService,
  ) {}

  async extractFromUrl(url: string, config: NoticiasExtractionConfig) {
    // Delegar al nuevo servicio
    return this.advancedScrapingService.scrape(url, {
      selectors: config.selectors,
      useProxy: config.extractionSettings.useProxy ?? true,
      useJavaScript: config.extractionSettings.useJavaScript ?? false,
      timeout: config.extractionSettings.timeout ?? 30000,
    });
  }
}
```

#### NewsWebsiteService (MODIFICAR)
```typescript
@Injectable()
export class NewsWebsiteService {
  constructor(
    // NUEVO
    private advancedScrapingService: AdvancedScrapingService,
  ) {}

  async extractNewsContent(url: string, configId: string) {
    const config = await this.websiteConfigModel.findById(configId);

    return this.advancedScrapingService.scrape(url, {
      selectors: config.contentSelectors,
      useProxy: true, // Siempre usar proxy en generator-pro
      useJavaScript: config.extractionSettings?.useJavaScript ?? false,
    });
  }
}
```

---

## Plan de Implementación por Fases

### Fase 0: Preparación (1 día)
**Duración:** 4-6 horas
**Build requerido:** Sí

**Objetivo:** Preparar el entorno y dependencias sin romper nada

#### Tareas:
1. Backup de base de datos
2. Crear branch feature/advanced-anti-detection
3. Instalar dependencias nuevas
4. Configurar variables de entorno
5. Verificar build exitoso

---

### Fase 1: Quick Wins (1 día)
**Duración:** 5-6 horas
**Build requerido:** Sí
**Impacto esperado:** +10-15% tasa de éxito inmediata

**Objetivo:** Mejoras rápidas sin cambios arquitectónicos

#### Tareas:
1. Actualizar User-Agents a 2025
2. Agregar headers Sec-CH-UA
3. Instalar rebrowser-puppeteer-core
4. Instalar Bottleneck para rate limiting
5. Testing manual

---

### Fase 2: Módulo ScrapingModule Base (2-3 días)
**Duración:** 12-16 horas
**Build requerido:** Sí (después de cada servicio)

**Objetivo:** Crear infraestructura central sin romper módulos existentes

#### Tareas:
1. Crear estructura de carpetas
2. Crear interfaces y DTOs
3. Implementar AdvancedScrapingService (solo estructura)
4. Implementar ProxyConfigurationService
5. Implementar FingerprintGeneratorService
6. Implementar RateLimiterService
7. Testing manual de cada servicio

---

### Fase 3: Anti-Detección Avanzada (2-3 días)
**Duración:** 12-18 horas
**Build requerido:** Sí

**Objetivo:** Implementar lógica de scraping con rebrowser y Crawlee

#### Tareas:
1. Implementar scrapeWithRebrowser()
2. Implementar scrapeWithCrawlee()
3. Implementar fallback chain
4. Integrar fingerprints
5. Integrar proxies
6. Testing manual contra sitios protegidos

---

### Fase 4: CAPTCHA & Métricas (1-2 días)
**Duración:** 8-12 horas
**Build requerido:** Sí

**Objetivo:** Completar funcionalidades avanzadas

#### Tareas:
1. Implementar CaptchaSolverService
2. Implementar ScrapingMetricsService
3. Integrar eventos con EventEmitter2
4. Dashboard de métricas (API endpoint)
5. Testing manual

---

### Fase 5: Integración con Módulos Existentes (1-2 días)
**Duración:** 8-10 horas
**Build requerido:** Sí (crítico)

**Objetivo:** Conectar nuevo sistema con NoticiasModule y GeneratorProModule

#### Tareas:
1. Modificar NoticiasScrapingService
2. Modificar NewsWebsiteService
3. Actualizar módulos (imports)
4. Testing manual de flujo completo
5. Verificar backward compatibility

---

### Fase 6: Testing Completo & Ajustes (2-3 días)
**Duración:** 12-16 horas
**Build requerido:** Sí

**Objetivo:** Validar que todo funciona en conjunto

#### Tareas:
1. Testing manual de noticias module
2. Testing manual de generator-pro module
3. Testing contra sitios reales con protección
4. Ajustar configuraciones de proxies
5. Optimizar rate limiting
6. Documentar cambios

---

### Fase 7: Deploy a Producción (1 día)
**Duración:** 4-6 horas
**Build requerido:** Sí

**Objetivo:** Despliegue seguro sin downtime

#### Tareas:
1. Configurar proxies en producción
2. Configurar API keys de CAPTCHA
3. Deploy a staging
4. Monitoring 24h en staging
5. Deploy a producción (ventana de bajo tráfico)
6. Monitoring post-deploy

---

## Checklist Detallado

### FASE 0: PREPARACIÓN ⏱️ 4-6 horas

#### 0.1 Backup y Seguridad
- [ ] **Backup de MongoDB** (producción y desarrollo)
  ```bash
  mongodump --uri="mongodb://..." --out=backup-$(date +%Y%m%d)
  ```
- [ ] **Documentar estado actual de queues** (Redis)
  ```bash
  redis-cli KEYS "bull:*" > queue-snapshot.txt
  ```
- [ ] **Export de configuraciones** (NoticiasExtractionConfig, NewsWebsiteConfig)
  ```bash
  mongoexport --db=... --collection=noticiasextractionconfigs --out=configs-backup.json
  ```

#### 0.2 Git Workflow
- [ ] **Crear branch desde main**
  ```bash
  git checkout main
  git pull origin main
  git checkout -b feature/advanced-anti-detection
  ```
- [ ] **Proteger branch main** (GitHub settings)

#### 0.3 Instalación de Dependencias
- [ ] **Instalar rebrowser-puppeteer-core**
  ```bash
  cd packages/api-nueva
  npm install rebrowser-puppeteer-core --save
  ```
- [ ] **Instalar Crawlee + Playwright**
  ```bash
  npm install crawlee playwright --save
  ```
- [ ] **Instalar proxy agents**
  ```bash
  npm install https-proxy-agent socks-proxy-agent --save
  ```
- [ ] **Instalar Bottleneck**
  ```bash
  npm install bottleneck --save
  npm install @types/bottleneck --save-dev
  ```
- [ ] **Instalar 2captcha (opcional para Fase 4)**
  ```bash
  npm install 2captcha --save
  ```

#### 0.4 Variables de Entorno
- [ ] **Actualizar .env.example**
  ```bash
  # Anti-Detection Configuration
  DATACENTER_PROXY_URLS=
  RESIDENTIAL_PROXY_URLS=
  MOBILE_PROXY_URLS=

  # CAPTCHA Services
  NOCAPTCHAAI_API_KEY=
  TWOCAPTCHA_API_KEY=

  # ScraperAPI (fallback)
  SCRAPERAPI_KEY=
  SCRAPERAPI_ENABLED=false

  # Puppeteer
  MAX_CONCURRENT_BROWSERS=5
  BROWSER_POOL_SIZE=10

  # Rate Limiting
  DEFAULT_RATE_LIMIT=30
  ADAPTIVE_RATE_LIMITING=true

  # Monitoring
  ENABLE_SCRAPING_METRICS=true
  ```

- [ ] **Copiar a .env local**
  ```bash
  cp .env.example .env
  # Editar .env con valores reales (proxies en Fase 3)
  ```

#### 0.5 Verificación de Build
- [ ] **Build del proyecto**
  ```bash
  cd packages/api-nueva
  yarn build
  ```
- [ ] **Verificar output** - Sin errores de TypeScript
- [ ] **Verificar que servidor levanta** (NO ejecutar, solo verificar)
  ```bash
  # NO ejecutar: yarn start:dev
  # Solo verificar que build pasó
  ```

---

### FASE 1: QUICK WINS ⏱️ 5-6 horas

#### 1.1 Actualizar User-Agents (30 min)
- [ ] **Crear archivo de utilidad**
  ```bash
  mkdir -p src/scraping/utils
  touch src/scraping/utils/user-agents.util.ts
  ```

- [ ] **Implementar user-agents modernos**
  ```typescript
  // src/scraping/utils/user-agents.util.ts
  export const MODERN_USER_AGENTS_2025 = [
    // Chrome 131 (Diciembre 2025)
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',

    // Firefox 133 (Diciembre 2025)
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:133.0) Gecko/20100101 Firefox/133.0',
    'Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0',
  ];

  export function getRandomUserAgent(): string {
    return MODERN_USER_AGENTS_2025[
      Math.floor(Math.random() * MODERN_USER_AGENTS_2025.length)
    ];
  }
  ```

- [ ] **Actualizar NoticiasScrapingService**
  ```typescript
  // packages/api-nueva/src/noticias/services/noticias-scraping.service.ts
  import { MODERN_USER_AGENTS_2025, getRandomUserAgent } from '../../scraping/utils/user-agents.util';

  // Reemplazar userAgents antiguos:
  private readonly userAgents = MODERN_USER_AGENTS_2025;

  // O usar función:
  private getRandomUserAgent() {
    return getRandomUserAgent();
  }
  ```

- [ ] **Actualizar NewsWebsiteService** (mismo cambio)

#### 1.2 Agregar Headers Sec-CH-UA (1 hora)
- [ ] **Crear archivo de utilidad**
  ```bash
  touch src/scraping/utils/headers.util.ts
  ```

- [ ] **Implementar generador de headers**
  ```typescript
  // src/scraping/utils/headers.util.ts
  export function generateModernHeaders(userAgent: string): Record<string, string> {
    const isChrome = userAgent.includes('Chrome');
    const isFirefox = userAgent.includes('Firefox');

    const baseHeaders = {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };

    if (isChrome) {
      return {
        ...baseHeaders,
        'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
      };
    }

    return baseHeaders;
  }
  ```

- [ ] **Actualizar NoticiasScrapingService** (método extractWithCheerio)
  ```typescript
  import { generateModernHeaders } from '../../scraping/utils/headers.util';

  const userAgent = this.getRandomUserAgent();
  const headers = generateModernHeaders(userAgent);

  const response = await axios.get(url, {
    headers,
    timeout: config.extractionSettings.timeout || 30000,
  });
  ```

- [ ] **Actualizar PuppeteerManagerService**
  ```typescript
  import { generateModernHeaders } from '../../scraping/utils/headers.util';

  const userAgent = getRandomUserAgent();
  await page.setUserAgent(userAgent);
  await page.setExtraHTTPHeaders(generateModernHeaders(userAgent));
  ```

#### 1.3 Integrar Rebrowser-Puppeteer (2 horas)
- [ ] **Modificar PuppeteerManagerService**
  ```typescript
  // packages/api-nueva/src/modules/reports/services/puppeteer-manager.service.ts

  // Cambiar import
  // import puppeteer from 'puppeteer'; // ❌ VIEJO
  import puppeteer from 'rebrowser-puppeteer-core'; // ✅ NUEVO

  async launchBrowser() {
    // Configurar rebrowser patches
    process.env.REBROWSER_PATCHES_RUNTIME_FIX_MODE = 'addBinding';
    process.env.REBROWSER_PATCHES_SOURCE_URL = 'app.js';

    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled', // Ya existe
        // ... resto de args existentes
      ],
    });
  }
  ```

#### 1.4 Integrar Bottleneck Rate Limiting (2 horas)
- [ ] **Crear RateLimiterService básico**
  ```bash
  mkdir -p src/scraping/services
  touch src/scraping/services/rate-limiter.service.ts
  ```

- [ ] **Implementar servicio**
  ```typescript
  // src/scraping/services/rate-limiter.service.ts
  import { Injectable } from '@nestjs/common';
  import Bottleneck from 'bottleneck';

  @Injectable()
  export class RateLimiterService {
    private limiter: Bottleneck;

    constructor() {
      this.limiter = new Bottleneck({
        maxConcurrent: 5,      // Max 5 requests concurrentes
        minTime: 200,          // Min 200ms entre requests (5 req/sec)
      });
    }

    async schedule<T>(fn: () => Promise<T>): Promise<T> {
      return this.limiter.schedule(fn);
    }

    wrap<T extends (...args: any[]) => Promise<any>>(fn: T): T {
      return this.limiter.wrap(fn) as T;
    }
  }
  ```

- [ ] **Crear módulo temporal**
  ```bash
  touch src/scraping/scraping.module.ts
  ```
  ```typescript
  // src/scraping/scraping.module.ts
  import { Module } from '@nestjs/common';
  import { RateLimiterService } from './services/rate-limiter.service';

  @Module({
    providers: [RateLimiterService],
    exports: [RateLimiterService],
  })
  export class ScrapingModule {}
  ```

- [ ] **Importar en AppModule**
  ```typescript
  // src/app.module.ts
  import { ScrapingModule } from './scraping/scraping.module';

  @Module({
    imports: [
      // ... existentes
      ScrapingModule, // NUEVO
    ],
  })
  export class AppModule {}
  ```

- [ ] **Usar en NoticiasScrapingService**
  ```typescript
  constructor(
    // ... existentes
    private rateLimiter: RateLimiterService, // NUEVO
  ) {}

  async extractFromUrl(url: string, config: any) {
    // Wrap con rate limiting
    return this.rateLimiter.schedule(async () => {
      // Lógica existente de extracción
    });
  }
  ```

#### 1.5 Testing Manual (30 min)
- [ ] **Build del proyecto**
  ```bash
  yarn build
  ```
- [ ] **Verificar sin errores de TypeScript**
- [ ] **Levantar servidor en modo dev** (Coyotito lo hace)
- [ ] **Probar extracción de 1 URL de prueba**
- [ ] **Verificar headers en Network tab** (deben aparecer Sec-CH-UA)
- [ ] **Verificar logs** (debe usar UAs modernos)

#### 1.6 Commit de Fase 1
- [ ] **Commit cambios**
  ```bash
  git add .
  git commit -m "feat: Phase 1 - Quick wins (modern UAs, Sec-CH-UA, rebrowser, rate limiting)"
  git push origin feature/advanced-anti-detection
  ```

---

### FASE 2: MÓDULO SCRAPINGMODULE BASE ⏱️ 12-16 horas

#### 2.1 Estructura de Carpetas (15 min)
- [ ] **Crear estructura completa**
  ```bash
  mkdir -p src/scraping/services
  mkdir -p src/scraping/dto
  mkdir -p src/scraping/interfaces
  mkdir -p src/scraping/utils
  ```

#### 2.2 Interfaces y DTOs (1-2 horas)
- [ ] **Crear interfaces**
  ```bash
  touch src/scraping/interfaces/proxy.interface.ts
  touch src/scraping/interfaces/fingerprint.interface.ts
  touch src/scraping/interfaces/scraping.interface.ts
  ```

- [ ] **Implementar proxy.interface.ts**
  ```typescript
  export type ProxyType = 'datacenter' | 'residential' | 'mobile';
  export type ProxyTier = 'datacenter' | 'residential' | 'mobile';

  export interface Proxy {
    url: string;
    host: string;
    port: number;
    username?: string;
    password?: string;
    type: ProxyType;
  }

  export interface ProxyOptions {
    tier?: ProxyTier;
    forceRotation?: boolean;
  }

  export interface ProxyMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    failureRate: number;
    avgResponseTime: number;
    lastUsed: Date;
  }
  ```

- [ ] **Implementar fingerprint.interface.ts**
  ```typescript
  export interface Fingerprint {
    userAgent: string;
    secChUa: string;
    secChUaMobile: string;
    secChUaPlatform: string;
    platform: string;
    viewport: {
      width: number;
      height: number;
    };
    screen: {
      width: number;
      height: number;
      colorDepth: number;
    };
    timezone: string;
    languages: string[];
    hardwareConcurrency: number;
  }
  ```

- [ ] **Implementar scraping.interface.ts**
  ```typescript
  export interface ScraperConfig {
    selectors: SelectorConfig;
    useProxy: boolean;
    useJavaScript: boolean;
    timeout: number;
    proxyOptions?: ProxyOptions;
    retryAttempts?: number;
  }

  export interface SelectorConfig {
    title: string;
    content: string;
    images?: string | string[];
    publishedAt?: string;
    author?: string;
    categories?: string | string[];
    tags?: string | string[];
  }

  export interface ScrapingResult {
    success: boolean;
    data: ExtractedContent;
    metadata: ScrapingMetadata;
    method: 'cheerio' | 'rebrowser' | 'crawlee' | 'scraperapi';
    cost: number;
  }

  export interface ExtractedContent {
    title: string;
    content: string;
    images: string[];
    publishedAt?: Date;
    author?: string;
    categories?: string[];
    tags?: string[];
    keywords?: string[];
  }

  export interface ScrapingMetadata {
    url: string;
    processingTime: number;
    proxyUsed?: string;
    proxyType?: ProxyType;
    captchaEncountered: boolean;
    captchaSolved: boolean;
    blockedByCloudflare: boolean;
    blockedByDataDome: boolean;
    httpStatus: number;
    contentLength: number;
  }
  ```

- [ ] **Crear DTOs con validación**
  ```bash
  touch src/scraping/dto/scraper-config.dto.ts
  touch src/scraping/dto/scraping-result.dto.ts
  ```

- [ ] **Implementar DTOs** (con class-validator)
  ```typescript
  // scraper-config.dto.ts
  import { IsBoolean, IsNumber, IsObject, IsOptional, Min, Max } from 'class-validator';

  export class ScraperConfigDto {
    @IsObject()
    selectors: any; // Usar SelectorConfig en producción

    @IsBoolean()
    @IsOptional()
    useProxy?: boolean = true;

    @IsBoolean()
    @IsOptional()
    useJavaScript?: boolean = false;

    @IsNumber()
    @Min(1000)
    @Max(120000)
    @IsOptional()
    timeout?: number = 30000;
  }
  ```

#### 2.3 ProxyConfigurationService (3-4 horas)
- [ ] **Crear servicio**
  ```bash
  touch src/scraping/services/proxy-configuration.service.ts
  ```

- [ ] **Implementar lógica completa**
  - [ ] loadProxies() - Leer de ENV y parsear
  - [ ] getProxy() - Seleccionar proxy basado en métricas
  - [ ] determineRequiredTier() - Escalación inteligente
  - [ ] selectBestProxy() - Round-robin con health check
  - [ ] trackProxyUsage() - Registrar uso
  - [ ] updateProxyMetrics() - Actualizar métricas post-request

- [ ] **Ver implementación completa en rotation_scraper_for_escape_blockers.md líneas 522-638**

- [ ] **Testing manual**
  ```typescript
  // Crear test temporal en controller
  @Get('test/proxy')
  async testProxy() {
    const proxy = await this.proxyService.getProxy('https://example.com');
    return proxy;
  }
  ```

#### 2.4 FingerprintGeneratorService (2-3 horas)
- [ ] **Crear servicio**
  ```bash
  touch src/scraping/services/fingerprint-generator.service.ts
  ```

- [ ] **Implementar métodos**
  ```typescript
  @Injectable()
  export class FingerprintGeneratorService {
    generate(): Fingerprint {
      const userAgent = getRandomUserAgent();
      const isChrome = userAgent.includes('Chrome');

      return {
        userAgent,
        secChUa: isChrome ? '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"' : '',
        secChUaMobile: '?0',
        secChUaPlatform: '"Windows"',
        platform: 'Win32',
        viewport: this.generateViewport(),
        screen: this.generateScreen(),
        timezone: 'America/Mexico_City',
        languages: ['es-MX', 'es', 'en-US', 'en'],
        hardwareConcurrency: 8,
      };
    }

    private generateViewport() {
      const common = [
        { width: 1920, height: 1080 },
        { width: 1366, height: 768 },
        { width: 1440, height: 900 },
      ];
      return common[Math.floor(Math.random() * common.length)];
    }

    private generateScreen() {
      const viewport = this.generateViewport();
      return {
        width: viewport.width,
        height: viewport.height,
        colorDepth: 24,
      };
    }

    async applyToPage(page: any, fingerprint: Fingerprint): Promise<void> {
      await page.setViewport(fingerprint.viewport);

      await page.evaluateOnNewDocument((fp) => {
        Object.defineProperty(navigator, 'platform', { get: () => fp.platform });
        Object.defineProperty(navigator, 'languages', { get: () => fp.languages });
        Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => fp.hardwareConcurrency });
        Object.defineProperty(screen, 'width', { get: () => fp.screen.width });
        Object.defineProperty(screen, 'height', { get: () => fp.screen.height });
      }, fingerprint);
    }
  }
  ```

- [ ] **Testing manual** (con Puppeteer)

#### 2.5 ScrapingMetricsService (2-3 horas)
- [ ] **Crear servicio**
  ```bash
  touch src/scraping/services/scraping-metrics.service.ts
  ```

- [ ] **Implementar con EventEmitter2**
  ```typescript
  @Injectable()
  export class ScrapingMetricsService {
    private metrics = new Map<string, DomainMetrics>();

    constructor(private eventEmitter: EventEmitter2) {}

    async recordSuccess(url: string, metadata: ScrapingMetadata) {
      const domain = new URL(url).hostname;
      const domainMetrics = this.getOrCreateMetrics(domain);

      domainMetrics.totalRequests++;
      domainMetrics.successfulRequests++;
      domainMetrics.lastSuccessAt = new Date();

      this.eventEmitter.emit('scraping.success', { url, domain, metadata });
    }

    async recordFailure(url: string, error: string, metadata: Partial<ScrapingMetadata>) {
      const domain = new URL(url).hostname;
      const domainMetrics = this.getOrCreateMetrics(domain);

      domainMetrics.totalRequests++;
      domainMetrics.failedRequests++;

      if (metadata.blockedByCloudflare) domainMetrics.blockedByCloudflare++;
      if (metadata.blockedByDataDome) domainMetrics.blockedByDataDome++;
      if (metadata.captchaEncountered) domainMetrics.captchaEncountered++;

      this.eventEmitter.emit('scraping.failure', { url, domain, error, metadata });

      // Alertas
      if (this.getFailureRate(domain) > 0.5) {
        this.eventEmitter.emit('scraping.alert.high-failure-rate', { domain });
      }
    }

    getDomainMetrics(domain: string): DomainMetrics {
      return this.metrics.get(domain) || this.createDefaultMetrics();
    }

    getFailureRate(domain: string): number {
      const metrics = this.getDomainMetrics(domain);
      return metrics.totalRequests > 0
        ? metrics.failedRequests / metrics.totalRequests
        : 0;
    }
  }

  interface DomainMetrics {
    domain: string;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    blockedByCloudflare: number;
    blockedByDataDome: number;
    captchaEncountered: number;
    avgResponseTime: number;
    lastSuccessAt: Date;
    lastFailureAt: Date;
  }
  ```

- [ ] **Crear endpoint de métricas** (para dashboard)
  ```typescript
  @Get('scraping/metrics')
  async getMetrics() {
    return this.scrapingMetrics.getAllMetrics();
  }
  ```

#### 2.6 Actualizar ScrapingModule (30 min)
- [ ] **Registrar todos los servicios**
  ```typescript
  // src/scraping/scraping.module.ts
  import { Module } from '@nestjs/common';
  import { ConfigModule } from '@nestjs/config';
  import { CacheModule } from '@nestjs/cache-manager';

  import { RateLimiterService } from './services/rate-limiter.service';
  import { ProxyConfigurationService } from './services/proxy-configuration.service';
  import { FingerprintGeneratorService } from './services/fingerprint-generator.service';
  import { ScrapingMetricsService } from './services/scraping-metrics.service';

  @Module({
    imports: [ConfigModule, CacheModule],
    providers: [
      RateLimiterService,
      ProxyConfigurationService,
      FingerprintGeneratorService,
      ScrapingMetricsService,
    ],
    exports: [
      RateLimiterService,
      ProxyConfigurationService,
      FingerprintGeneratorService,
      ScrapingMetricsService,
    ],
  })
  export class ScrapingModule {}
  ```

#### 2.7 Testing y Build de Fase 2 (1 hora)
- [ ] **Build del proyecto**
  ```bash
  yarn build
  ```
- [ ] **Verificar sin errores**
- [ ] **Testing manual de cada servicio** (endpoints temporales)
- [ ] **Commit**
  ```bash
  git add .
  git commit -m "feat: Phase 2 - Base ScrapingModule (proxies, fingerprints, metrics)"
  git push origin feature/advanced-anti-detection
  ```

---

### FASE 3: ANTI-DETECCIÓN AVANZADA ⏱️ 12-18 horas

#### 3.1 AdvancedScrapingService - Estructura (2 horas)
- [ ] **Crear servicio principal**
  ```bash
  touch src/scraping/services/advanced-scraping.service.ts
  ```

- [ ] **Implementar estructura base**
  ```typescript
  @Injectable()
  export class AdvancedScrapingService {
    private readonly logger = new Logger(AdvancedScrapingService.name);

    constructor(
      private proxyService: ProxyConfigurationService,
      private fingerprintService: FingerprintGeneratorService,
      private rateLimiter: RateLimiterService,
      private metricsService: ScrapingMetricsService,
      private cacheService: CacheService,
    ) {}

    async scrape(url: string, config: ScraperConfig): Promise<ScrapingResult> {
      const startTime = Date.now();

      try {
        // 1. Rate limiting
        await this.rateLimiter.schedule(async () => {});

        // 2. Proxy (si configurado)
        const proxy = config.useProxy
          ? await this.proxyService.getProxy(url, config.proxyOptions)
          : null;

        // 3. Fingerprint
        const fingerprint = await this.fingerprintService.generate();

        // 4. Fallback chain
        const result = await this.executeWithFallback(url, config, proxy, fingerprint);

        // 5. Métricas
        await this.metricsService.recordSuccess(url, result.metadata);

        return result;
      } catch (error) {
        await this.metricsService.recordFailure(url, error.message, {
          url,
          processingTime: Date.now() - startTime,
        } as any);
        throw error;
      }
    }

    private async executeWithFallback(
      url: string,
      config: ScraperConfig,
      proxy: Proxy | null,
      fingerprint: Fingerprint,
    ): Promise<ScrapingResult> {
      // A implementar en siguientes pasos
      throw new Error('Not implemented');
    }
  }
  ```

#### 3.2 Método: scrapeWithCheerio (2 horas)
- [ ] **Implementar scraping estático**
  ```typescript
  private async scrapeWithCheerio(
    url: string,
    config: ScraperConfig,
    proxy: Proxy | null,
  ): Promise<ScrapingResult> {
    const startTime = Date.now();

    const axiosConfig: any = {
      timeout: config.timeout || 30000,
      headers: generateModernHeaders(getRandomUserAgent()),
    };

    if (proxy) {
      const { HttpsProxyAgent } = require('https-proxy-agent');
      axiosConfig.httpsAgent = new HttpsProxyAgent(proxy.url);
    }

    const response = await axios.get(url, axiosConfig);
    const html = response.data;

    const content = this.parseWithCheerio(html, config.selectors);

    return {
      success: true,
      data: content,
      metadata: {
        url,
        processingTime: Date.now() - startTime,
        proxyUsed: proxy?.url,
        proxyType: proxy?.type,
        captchaEncountered: false,
        captchaSolved: false,
        blockedByCloudflare: false,
        blockedByDataDome: false,
        httpStatus: response.status,
        contentLength: html.length,
      },
      method: 'cheerio',
      cost: 0,
    };
  }

  private parseWithCheerio(html: string, selectors: SelectorConfig): ExtractedContent {
    const $ = cheerio.load(html);

    return {
      title: $(selectors.title).first().text().trim(),
      content: $(selectors.content).text().trim(),
      images: this.extractImages($, selectors.images),
      publishedAt: selectors.publishedAt ? this.parseDate($(selectors.publishedAt).text()) : undefined,
      author: selectors.author ? $(selectors.author).text().trim() : undefined,
      categories: selectors.categories ? this.extractArray($, selectors.categories) : [],
      tags: selectors.tags ? this.extractArray($, selectors.tags) : [],
      keywords: this.extractKeywords($(selectors.content).text()),
    };
  }
  ```

#### 3.3 Método: scrapeWithRebrowser (3-4 horas)
- [ ] **Implementar scraping con rebrowser-patches**
  ```typescript
  private async scrapeWithRebrowser(
    url: string,
    config: ScraperConfig,
    proxy: Proxy | null,
    fingerprint: Fingerprint,
  ): Promise<ScrapingResult> {
    const startTime = Date.now();

    // Configurar rebrowser patches
    process.env.REBROWSER_PATCHES_RUNTIME_FIX_MODE = 'addBinding';
    process.env.REBROWSER_PATCHES_SOURCE_URL = 'app.js';

    const puppeteer = require('rebrowser-puppeteer-core');

    const launchOptions: any = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-gpu',
      ],
    };

    if (proxy) {
      launchOptions.args.push(`--proxy-server=${proxy.url}`);
    }

    const browser = await puppeteer.launch(launchOptions);

    try {
      const page = await browser.newPage();

      // Aplicar fingerprint
      await this.fingerprintService.applyToPage(page, fingerprint);

      // Headers modernos
      await page.setExtraHTTPHeaders({
        'User-Agent': fingerprint.userAgent,
        'sec-ch-ua': fingerprint.secChUa,
        'sec-ch-ua-mobile': fingerprint.secChUaMobile,
        'sec-ch-ua-platform': fingerprint.secChUaPlatform,
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'es-ES,es;q=0.9,en;q=0.8',
      });

      // Navegar
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: config.timeout || 30000,
      });

      // Delay humano
      await this.randomDelay(1000, 3000);

      // Extraer HTML
      const html = await page.content();
      const content = this.parseWithCheerio(html, config.selectors);

      return {
        success: true,
        data: content,
        metadata: {
          url,
          processingTime: Date.now() - startTime,
          proxyUsed: proxy?.url,
          proxyType: proxy?.type,
          captchaEncountered: false, // A detectar en Fase 4
          captchaSolved: false,
          blockedByCloudflare: false,
          blockedByDataDome: false,
          httpStatus: 200,
          contentLength: html.length,
        },
        method: 'rebrowser',
        cost: 0.001, // Estimado de costo de proxy
      };
    } finally {
      await browser.close();
    }
  }

  private async randomDelay(min: number, max: number): Promise<void> {
    const delay = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
  ```

#### 3.4 Método: scrapeWithCrawlee (3-4 horas)
- [ ] **Implementar scraping con Crawlee**
  ```typescript
  private async scrapeWithCrawlee(
    url: string,
    config: ScraperConfig,
    proxy: Proxy | null,
  ): Promise<ScrapingResult> {
    const { PlaywrightCrawler, ProxyConfiguration, Dataset } = require('crawlee');
    const startTime = Date.now();

    let extractedData: any = null;

    const proxyConfiguration = proxy
      ? new ProxyConfiguration({ proxyUrls: [proxy.url] })
      : undefined;

    const crawler = new PlaywrightCrawler({
      proxyConfiguration,
      maxConcurrency: 1,

      requestHandler: async ({ page }) => {
        await page.waitForLoadState('networkidle');
        const html = await page.content();
        extractedData = this.parseWithCheerio(html, config.selectors);
      },

      failedRequestHandler: async ({ request }, error) => {
        throw new Error(`Crawlee failed: ${error.message}`);
      },
    });

    await crawler.run([url]);

    if (!extractedData) {
      throw new Error('No data extracted');
    }

    return {
      success: true,
      data: extractedData,
      metadata: {
        url,
        processingTime: Date.now() - startTime,
        proxyUsed: proxy?.url,
        proxyType: proxy?.type,
        captchaEncountered: false,
        captchaSolved: false,
        blockedByCloudflare: false,
        blockedByDataDome: false,
        httpStatus: 200,
        contentLength: 0,
      },
      method: 'crawlee',
      cost: 0.001,
    };
  }
  ```

#### 3.5 Fallback Chain (1-2 horas)
- [ ] **Implementar lógica de fallback**
  ```typescript
  private async executeWithFallback(
    url: string,
    config: ScraperConfig,
    proxy: Proxy | null,
    fingerprint: Fingerprint,
  ): Promise<ScrapingResult> {
    const methods = [
      {
        name: 'cheerio',
        fn: () => this.scrapeWithCheerio(url, config, proxy),
        shouldTry: !config.useJavaScript,
      },
      {
        name: 'rebrowser',
        fn: () => this.scrapeWithRebrowser(url, config, proxy, fingerprint),
        shouldTry: true,
      },
      {
        name: 'crawlee',
        fn: () => this.scrapeWithCrawlee(url, config, proxy),
        shouldTry: true,
      },
    ];

    for (const method of methods) {
      if (!method.shouldTry) continue;

      try {
        this.logger.log(`Trying ${method.name} for ${url}`);
        const result = await method.fn();
        this.logger.log(`✅ Success with ${method.name}`);
        return result;
      } catch (error) {
        this.logger.warn(`❌ ${method.name} failed: ${error.message}`);

        // Si es el último método, throw error
        const isLast = methods.filter(m => m.shouldTry).indexOf(method) === methods.filter(m => m.shouldTry).length - 1;
        if (isLast) {
          throw error;
        }
      }
    }

    throw new Error('All scraping methods exhausted');
  }
  ```

#### 3.6 Registrar en Módulo (30 min)
- [ ] **Actualizar ScrapingModule**
  ```typescript
  import { AdvancedScrapingService } from './services/advanced-scraping.service';

  @Module({
    imports: [ConfigModule, CacheModule],
    providers: [
      // ... existentes
      AdvancedScrapingService, // NUEVO
    ],
    exports: [
      // ... existentes
      AdvancedScrapingService, // NUEVO
    ],
  })
  export class ScrapingModule {}
  ```

#### 3.7 Testing Manual de Fase 3 (2 horas)
- [ ] **Crear endpoint de testing temporal**
  ```typescript
  @Post('test/scrape')
  async testScrape(@Body() body: { url: string }) {
    return this.advancedScrapingService.scrape(body.url, {
      selectors: { title: 'h1', content: '.content' },
      useProxy: false,
      useJavaScript: false,
      timeout: 30000,
    });
  }
  ```

- [ ] **Probar contra sitios reales**
  - [ ] Sitio sin protección (blog)
  - [ ] Sitio con Cloudflare
  - [ ] Sitio con JS rendering

- [ ] **Verificar logs** - Debe mostrar qué método funcionó

- [ ] **Build**
  ```bash
  yarn build
  ```

- [ ] **Commit**
  ```bash
  git add .
  git commit -m "feat: Phase 3 - Advanced anti-detection (rebrowser, crawlee, fallback chain)"
  git push origin feature/advanced-anti-detection
  ```

---

### FASE 4: CAPTCHA & MÉTRICAS ⏱️ 8-12 horas

#### 4.1 CaptchaSolverService (4-5 horas)
- [ ] **Crear servicio**
  ```bash
  touch src/scraping/services/captcha-solver.service.ts
  ```

- [ ] **Implementar integración con 2Captcha/NoCaptchaAI**
  ```typescript
  import { Injectable, Logger } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';

  @Injectable()
  export class CaptchaSolverService {
    private readonly logger = new Logger(CaptchaSolverService.name);
    private solver: any;

    constructor(private configService: ConfigService) {
      const apiKey = this.configService.get('TWOCAPTCHA_API_KEY');
      if (apiKey) {
        const Captcha = require('2captcha');
        this.solver = new Captcha.Solver(apiKey);
      }
    }

    async detectCaptcha(page: any): Promise<boolean> {
      const selectors = [
        'iframe[src*="recaptcha"]',
        'iframe[src*="hcaptcha"]',
        '.cf-turnstile',
        '#captcha',
        '.g-recaptcha',
      ];

      for (const selector of selectors) {
        const element = await page.$(selector);
        if (element) {
          this.logger.log(`CAPTCHA detected: ${selector}`);
          return true;
        }
      }

      return false;
    }

    async solveCaptcha(page: any, url: string): Promise<boolean> {
      if (!this.solver) {
        this.logger.warn('CAPTCHA solver not configured');
        return false;
      }

      // Detectar tipo de CAPTCHA
      const recaptcha = await page.$('iframe[src*="recaptcha"]');

      if (recaptcha) {
        return this.solveRecaptcha(page, url);
      }

      return false;
    }

    private async solveRecaptcha(page: any, url: string): Promise<boolean> {
      try {
        // Extraer site key
        const siteKey = await page.evaluate(() => {
          const iframe = document.querySelector('iframe[src*="recaptcha"]') as HTMLIFrameElement;
          return iframe?.src.match(/k=([^&]+)/)?.[1];
        });

        if (!siteKey) {
          this.logger.error('Could not extract reCAPTCHA site key');
          return false;
        }

        this.logger.log(`Solving reCAPTCHA for site key: ${siteKey}`);

        // Resolver con 2Captcha
        const result = await this.solver.recaptcha({
          pageurl: url,
          googlekey: siteKey,
        });

        // Inyectar token
        await page.evaluate((token: string) => {
          const textarea = document.getElementById('g-recaptcha-response') as HTMLTextAreaElement;
          if (textarea) {
            textarea.innerHTML = token;
            textarea.value = token;
          }
        }, result.data);

        this.logger.log('✅ CAPTCHA solved successfully');
        return true;
      } catch (error) {
        this.logger.error(`Failed to solve CAPTCHA: ${error.message}`);
        return false;
      }
    }
  }
  ```

- [ ] **Integrar en AdvancedScrapingService**
  ```typescript
  constructor(
    // ... existentes
    private captchaSolver: CaptchaSolverService, // NUEVO
  ) {}

  // En scrapeWithRebrowser(), después de page.goto():
  const hasCaptcha = await this.captchaSolver.detectCaptcha(page);
  if (hasCaptcha) {
    this.logger.log('CAPTCHA detected, attempting to solve...');
    const solved = await this.captchaSolver.solveCaptcha(page, url);

    if (solved) {
      await this.randomDelay(2000, 4000); // Esperar después de resolver
      // Continuar con extracción
    } else {
      throw new Error('Failed to solve CAPTCHA');
    }
  }
  ```

#### 4.2 Mejorar ScrapingMetricsService (2-3 horas)
- [ ] **Agregar persistencia (opcional - MongoDB)**
  ```typescript
  // Crear schema para métricas
  @Schema()
  export class ScrapingMetric {
    @Prop({ required: true })
    domain: string;

    @Prop({ required: true })
    url: string;

    @Prop({ required: true, enum: ['success', 'failure'] })
    result: string;

    @Prop()
    method: string;

    @Prop()
    proxyUsed: string;

    @Prop()
    proxyType: string;

    @Prop({ default: false })
    captchaEncountered: boolean;

    @Prop({ default: false })
    blockedByCloudflare: boolean;

    @Prop()
    processingTime: number;

    @Prop({ default: Date.now })
    createdAt: Date;
  }
  ```

- [ ] **Agregar método para obtener métricas agregadas**
  ```typescript
  async getOverallMetrics(): Promise<any> {
    const allMetrics = Array.from(this.metrics.values());

    const total = allMetrics.reduce((sum, m) => sum + m.totalRequests, 0);
    const successful = allMetrics.reduce((sum, m) => sum + m.successfulRequests, 0);

    return {
      overall: {
        totalRequests: total,
        successfulRequests: successful,
        failedRequests: total - successful,
        successRate: total > 0 ? (successful / total) * 100 : 0,
      },
      byDomain: Object.fromEntries(
        allMetrics.map(m => [
          m.domain,
          {
            totalRequests: m.totalRequests,
            successRate: m.totalRequests > 0
              ? (m.successfulRequests / m.totalRequests) * 100
              : 0,
            blockedByCloudflare: m.blockedByCloudflare,
          }
        ])
      ),
      last24Hours: await this.getLast24HoursMetrics(),
    };
  }
  ```

#### 4.3 API Endpoints para Métricas (1-2 horas)
- [ ] **Crear controller temporal o agregar a NoticiasController**
  ```typescript
  @Get('scraping/metrics/overview')
  async getScrapingMetrics() {
    return this.scrapingMetricsService.getOverallMetrics();
  }

  @Get('scraping/metrics/domain/:domain')
  async getDomainMetrics(@Param('domain') domain: string) {
    return this.scrapingMetricsService.getDomainMetrics(domain);
  }

  @Get('scraping/metrics/proxy-health')
  async getProxyHealth() {
    return this.proxyConfigurationService.getProxyHealthMetrics();
  }
  ```

#### 4.4 Registrar en Módulo (15 min)
- [ ] **Actualizar ScrapingModule**
  ```typescript
  import { CaptchaSolverService } from './services/captcha-solver.service';

  providers: [
    // ... existentes
    CaptchaSolverService, // NUEVO
  ],
  exports: [
    // ... existentes
    CaptchaSolverService, // NUEVO
  ],
  ```

#### 4.5 Testing Manual de Fase 4 (1-2 horas)
- [ ] **Configurar API key de CAPTCHA** (en .env)
  ```bash
  TWOCAPTCHA_API_KEY=tu_api_key_aqui
  ```

- [ ] **Probar contra sitio con CAPTCHA**
  - [ ] Verificar detección
  - [ ] Verificar resolución
  - [ ] Verificar inyección de token

- [ ] **Probar endpoints de métricas**
  ```bash
  curl http://localhost:3000/scraping/metrics/overview
  curl http://localhost:3000/scraping/metrics/domain/example.com
  ```

- [ ] **Build**
  ```bash
  yarn build
  ```

- [ ] **Commit**
  ```bash
  git add .
  git commit -m "feat: Phase 4 - CAPTCHA solving and metrics dashboard"
  git push origin feature/advanced-anti-detection
  ```

---

### FASE 5: INTEGRACIÓN CON MÓDULOS EXISTENTES ⏱️ 8-10 horas

#### 5.1 Modificar NoticiasModule (2-3 horas)
- [ ] **Importar ScrapingModule en NoticiasModule**
  ```typescript
  // packages/api-nueva/src/noticias/noticias.module.ts
  import { ScrapingModule } from '../scraping/scraping.module';

  @Module({
    imports: [
      // ... existentes
      ScrapingModule, // NUEVO
    ],
    // ... resto
  })
  export class NoticiasModule {}
  ```

- [ ] **Modificar NoticiasScrapingService**
  ```typescript
  // packages/api-nueva/src/noticias/services/noticias-scraping.service.ts
  import { AdvancedScrapingService } from '../../scraping/services/advanced-scraping.service';
  import { ScraperConfig, ScrapingResult } from '../../scraping/interfaces/scraping.interface';

  @Injectable()
  export class NoticiasScrapingService {
    constructor(
      // Mantener existentes
      @InjectModel(ExtractedNoticia.name) private extractedNoticiaModel: Model<ExtractedNoticia>,
      @InjectModel(NoticiasExtractionConfig.name) private configModel: Model<NoticiasExtractionConfig>,
      private cacheService: CacheService,
      private paginationService: PaginationService,
      // NUEVO
      private advancedScrapingService: AdvancedScrapingService,
    ) {}

    async extractFromUrl(
      url: string,
      config: NoticiasExtractionConfig,
    ): Promise<ScrapingResult> {
      // Cache check (mantener lógica existente)
      const cacheKey = this.generateCacheKey(url, config);
      const cached = await this.cacheService.get<ScrapingResult>(cacheKey);
      if (cached) {
        this.logger.log(`Cache HIT for ${url}`);
        return cached;
      }

      // NUEVO: Delegar al servicio avanzado
      const scraperConfig: ScraperConfig = {
        selectors: config.selectors,
        useProxy: config.extractionSettings.useProxy ?? false,
        useJavaScript: config.extractionSettings.useJavaScript ?? false,
        timeout: config.extractionSettings.timeout ?? 30000,
        retryAttempts: config.extractionSettings.retryAttempts ?? 3,
      };

      const result = await this.advancedScrapingService.scrape(url, scraperConfig);

      // Cache result
      await this.cacheService.set(cacheKey, result, 1800); // 30 min

      return result;
    }

    // MANTENER métodos auxiliares existentes para compatibilidad
    private generateCacheKey(url: string, config: any): string {
      // Lógica existente
    }
  }
  ```

- [ ] **Verificar que no se rompan otros métodos del servicio**

#### 5.2 Modificar GeneratorProModule (2-3 horas)
- [ ] **Importar ScrapingModule**
  ```typescript
  // packages/api-nueva/src/generator-pro/generator-pro.module.ts
  import { ScrapingModule } from '../scraping/scraping.module';

  @Module({
    imports: [
      // ... existentes
      ScrapingModule, // NUEVO
    ],
    // ... resto
  })
  export class GeneratorProModule {}
  ```

- [ ] **Modificar NewsWebsiteService**
  ```typescript
  // packages/api-nueva/src/generator-pro/services/news-website.service.ts
  import { AdvancedScrapingService } from '../../scraping/services/advanced-scraping.service';
  import { ScraperConfig } from '../../scraping/interfaces/scraping.interface';

  @Injectable()
  export class NewsWebsiteService {
    constructor(
      // Mantener existentes
      @InjectModel(NewsWebsiteConfig.name) private websiteConfigModel: Model<NewsWebsiteConfig>,
      @InjectModel(ExtractedNoticia.name) private extractedNoticiaModel: Model<ExtractedNoticia>,
      // NUEVO
      private advancedScrapingService: AdvancedScrapingService,
    ) {}

    async extractNewsContent(
      url: string,
      websiteConfigId: string,
    ): Promise<any> {
      const config = await this.websiteConfigModel.findById(websiteConfigId);

      if (!config) {
        throw new Error('Website config not found');
      }

      // NUEVO: Usar servicio avanzado
      const scraperConfig: ScraperConfig = {
        selectors: config.contentSelectors,
        useProxy: true, // Siempre usar proxy en generator-pro
        useJavaScript: config.extractionSettings?.useJavaScript ?? false,
        timeout: config.extractionSettings?.timeout ?? 30000,
      };

      const result = await this.advancedScrapingService.scrape(url, scraperConfig);

      // Transformar a formato esperado y guardar
      return this.saveExtractedContent(result, config);
    }

    private async saveExtractedContent(result: any, config: any) {
      // Lógica existente de guardado
    }
  }
  ```

- [ ] **Modificar UrlExtractionService** (para extracción de listing pages)
  ```typescript
  async extractUrls(websiteConfigId: string) {
    const config = await this.websiteConfigModel.findById(websiteConfigId);

    // NUEVO: Usar servicio avanzado para scraping de listing page
    const result = await this.advancedScrapingService.scrape(config.listingUrl, {
      selectors: { content: 'body' }, // Extrae HTML completo
      useProxy: true,
      useJavaScript: config.extractionSettings?.useJavaScript ?? false,
      timeout: 30000,
    });

    // Parsear links del HTML
    const $ = cheerio.load(result.data.content || '');
    const links = $(config.listingSelectors.articleLinks)
      .map((i, el) => $(el).attr('href'))
      .get();

    // Resto de lógica existente (deduplicación, etc.)
  }
  ```

#### 5.3 Actualizar Configuraciones (1 hora)
- [ ] **Agregar campo useProxy a NoticiasExtractionConfig schema**
  ```typescript
  // packages/api-nueva/src/noticias/schemas/noticias-extraction-config.schema.ts
  @Prop({
    type: {
      // ... campos existentes
      useProxy: { type: Boolean, default: false }, // NUEVO
    },
  })
  extractionSettings: {
    useJavaScript: boolean;
    waitTime: number;
    rateLimit: number;
    timeout: number;
    retryAttempts: number;
    respectRobots: boolean;
    useProxy: boolean; // NUEVO
  };
  ```

- [ ] **Actualizar DTOs**
  ```typescript
  // noticias-extraction-config.dto.ts
  export class ExtractionSettingsDto {
    // ... existentes
    @IsBoolean()
    @IsOptional()
    useProxy?: boolean;
  }
  ```

#### 5.4 Testing Manual de Integración (2-3 horas)
- [ ] **Crear configuración de prueba en Noticias**
  - [ ] Crear NoticiasExtractionConfig para sitio de prueba
  - [ ] Probar extracción con useProxy: false
  - [ ] Probar extracción con useProxy: true
  - [ ] Verificar que datos se guardan en ExtractedNoticia

- [ ] **Probar Generator-Pro**
  - [ ] Crear NewsWebsiteConfig para sitio de prueba
  - [ ] Probar extracción de URLs (listing page)
  - [ ] Probar extracción de contenido (article page)
  - [ ] Verificar pipeline completo

- [ ] **Verificar métricas**
  - [ ] Verificar que se registran attempts
  - [ ] Verificar success/failure rates
  - [ ] Verificar que proxies se rotan

- [ ] **Verificar backward compatibility**
  - [ ] Configuraciones existentes deben seguir funcionando
  - [ ] Jobs existentes en queue deben procesarse

#### 5.5 Build de Fase 5 (30 min)
- [ ] **Build completo**
  ```bash
  yarn build
  ```
- [ ] **Verificar sin errores de TypeScript**
- [ ] **Verificar que servidor levanta**

- [ ] **Commit**
  ```bash
  git add .
  git commit -m "feat: Phase 5 - Integration with NoticiasModule and GeneratorProModule"
  git push origin feature/advanced-anti-detection
  ```

---

### FASE 6: TESTING COMPLETO & AJUSTES ⏱️ 12-16 horas

#### 6.1 Configurar Proxies Reales (1-2 horas)
- [ ] **Registrarse en ProxyWing** (o proveedor elegido)
- [ ] **Obtener URLs de proxies**
  - [ ] Datacenter proxies (para empezar)
  - [ ] Residential proxies (si presupuesto permite)

- [ ] **Configurar en .env**
  ```bash
  DATACENTER_PROXY_URLS=http://user:pass@proxy1.proxywing.com:8080,http://user:pass@proxy2.proxywing.com:8080
  RESIDENTIAL_PROXY_URLS=http://user:pass@residential.proxywing.com:8080
  ```

- [ ] **Verificar conectividad de proxies**
  ```bash
  curl --proxy http://user:pass@proxy1.proxywing.com:8080 https://httpbin.org/ip
  ```

#### 6.2 Testing de Noticias Module (3-4 horas)
- [ ] **Sitios sin protección**
  - [ ] Seleccionar 5 sitios de noticias locales (México)
  - [ ] Crear configuraciones
  - [ ] Probar extracción sin proxy
  - [ ] Verificar success rate > 95%

- [ ] **Sitios con protección ligera**
  - [ ] Seleccionar 3 sitios con Cloudflare básico
  - [ ] Crear configuraciones
  - [ ] Probar sin proxy → Debería fallar
  - [ ] Probar con proxy datacenter → Puede funcionar
  - [ ] Probar con proxy residential → Debe funcionar
  - [ ] Verificar success rate > 80%

- [ ] **Verificar datos extraídos**
  - [ ] Title completo y limpio
  - [ ] Content sin scripts/styles
  - [ ] Images correctamente extraídas
  - [ ] publishedAt parseado
  - [ ] Keywords extraídos

- [ ] **Probar queue processing**
  - [ ] Agregar 50 URLs a la cola
  - [ ] Verificar que se procesan sin bloquear
  - [ ] Verificar logs de éxito/fallo
  - [ ] Verificar métricas actualizadas

#### 6.3 Testing de Generator-Pro Module (3-4 horas)
- [ ] **Configurar 2 sitios de noticias completos**
  - [ ] Sitio 1: Blog sin protección
  - [ ] Sitio 2: Sitio de noticias con Cloudflare

- [ ] **Probar extracción de URLs**
  - [ ] Verificar que listing page se scrapea
  - [ ] Verificar que URLs se extraen correctamente
  - [ ] Verificar deduplicación (no duplicados en ExtractedUrlTracking)

- [ ] **Probar extracción de contenido**
  - [ ] Verificar que cada URL se procesa
  - [ ] Verificar que datos se guardan en ExtractedNoticia
  - [ ] Verificar que status se actualiza

- [ ] **Probar pipeline completo**
  - [ ] Ejecutar runFullPipeline()
  - [ ] Verificar extraction → generation → publishing
  - [ ] Verificar logs en cada etapa

- [ ] **Probar manejo de errores**
  - [ ] URL inválida → debe registrar error
  - [ ] CAPTCHA no resuelto → debe fallar con mensaje claro
  - [ ] Timeout → debe reintentar

#### 6.4 Testing Contra Sitios Protegidos (2-3 horas)
- [ ] **Cloudflare**
  - [ ] Probar con sitio protegido por Cloudflare
  - [ ] Verificar bypass con rebrowser
  - [ ] Medir success rate (objetivo: > 80%)

- [ ] **CAPTCHA**
  - [ ] Probar con sitio que muestra CAPTCHA
  - [ ] Verificar detección
  - [ ] Verificar resolución (si API key configurada)
  - [ ] Medir success rate (objetivo: > 90%)

- [ ] **Rate Limiting**
  - [ ] Hacer 100 requests al mismo dominio
  - [ ] Verificar que se respeta rate limit
  - [ ] Verificar que no hay bloqueos

#### 6.5 Optimización y Ajustes (2-3 horas)
- [ ] **Ajustar rate limiting**
  - [ ] Revisar métricas de bloqueos
  - [ ] Si muchos bloqueos → reducir velocidad
  - [ ] Si ningún bloqueo → puede incrementar

- [ ] **Ajustar proxy tiers**
  - [ ] Revisar qué dominios necesitan proxies mejores
  - [ ] Ajustar lógica de escalación en ProxyConfigurationService

- [ ] **Optimizar timeouts**
  - [ ] Revisar tiempos de procesamiento promedio
  - [ ] Ajustar timeout defaults si es necesario

- [ ] **Optimizar cache TTL**
  - [ ] Revisar si 30 min es adecuado
  - [ ] Considerar TTL diferente para sitios que cambian más/menos

#### 6.6 Documentación de Cambios (1 hora)
- [ ] **Actualizar README del proyecto**
  - [ ] Agregar sección "Anti-Detection System"
  - [ ] Documentar nuevas variables de entorno
  - [ ] Documentar cómo configurar proxies

- [ ] **Documentar endpoints nuevos**
  - [ ] GET /scraping/metrics/overview
  - [ ] GET /scraping/metrics/domain/:domain
  - [ ] GET /scraping/metrics/proxy-health

- [ ] **Crear guía de troubleshooting**
  ```markdown
  ## Troubleshooting

  ### Cloudflare no se bypasea
  1. Verificar que rebrowser-patches está instalado
  2. Verificar env vars REBROWSER_PATCHES_*
  3. Probar con proxy residential

  ### Proxies no funcionan
  1. Verificar conectividad: curl --proxy ...
  2. Verificar credenciales en .env
  3. Verificar que ProxyConfigurationService carga proxies

  ### CAPTCHA no se resuelve
  1. Verificar API key de 2Captcha
  2. Verificar balance en cuenta
  3. Verificar logs de CaptchaSolverService
  ```

#### 6.7 Build Final de Fase 6 (30 min)
- [ ] **Build completo**
  ```bash
  yarn build
  ```
- [ ] **Testing de smoke test completo**
  - [ ] Levantar servidor
  - [ ] Probar 1 extracción de noticias
  - [ ] Probar 1 extracción de generator-pro
  - [ ] Verificar métricas

- [ ] **Commit final**
  ```bash
  git add .
  git commit -m "feat: Phase 6 - Complete testing, adjustments, and documentation"
  git push origin feature/advanced-anti-detection
  ```

---

### FASE 7: DEPLOY A PRODUCCIÓN ⏱️ 4-6 horas

#### 7.1 Preparación de Staging (1 hora)
- [ ] **Configurar proxies en staging**
  - [ ] Copiar URLs de proxies a .env de staging
  - [ ] Copiar API keys de CAPTCHA

- [ ] **Deploy a staging**
  ```bash
  # Método según infraestructura actual
  git checkout feature/advanced-anti-detection
  git pull origin feature/advanced-anti-detection
  # Deploy script
  ```

- [ ] **Verificar que levanta sin errores**
  ```bash
  pm2 logs api-nueva
  # o método de logs actual
  ```

#### 7.2 Testing en Staging (2-3 horas)
- [ ] **Smoke tests**
  - [ ] Probar endpoint /health
  - [ ] Probar /scraping/metrics/overview
  - [ ] Probar extracción de 1 noticia

- [ ] **Load test ligero**
  - [ ] Encolar 100 URLs
  - [ ] Monitorear CPU/memoria
  - [ ] Verificar que se procesan sin errores

- [ ] **Monitorear 24 horas**
  - [ ] Configurar alertas (si no existen)
  - [ ] Revisar métricas cada 6 horas
  - [ ] Verificar logs de errores
  - [ ] Verificar que queues se procesan

#### 7.3 Deploy a Producción (1 hora)
- [ ] **Backup de producción**
  ```bash
  mongodump --uri="mongodb://..." --out=backup-prod-$(date +%Y%m%d)
  redis-cli SAVE
  ```

- [ ] **Merge a main**
  ```bash
  git checkout main
  git pull origin main
  git merge feature/advanced-anti-detection
  git push origin main
  ```

- [ ] **Deploy en ventana de bajo tráfico**
  - [ ] Notificar al equipo
  - [ ] Ejecutar deploy
  - [ ] Verificar que levanta

#### 7.4 Post-Deploy Monitoring (1-2 horas)
- [ ] **Monitoring inmediato (primeras 2 horas)**
  - [ ] Revisar logs cada 15 min
  - [ ] Verificar métricas de scraping
  - [ ] Verificar queue processing
  - [ ] Verificar uso de proxies
  - [ ] Verificar costos de CAPTCHA

- [ ] **Configurar alertas**
  - [ ] Alerta si success rate < 70%
  - [ ] Alerta si queue crece sin control
  - [ ] Alerta si costos de CAPTCHA > budget

- [ ] **Documentar métricas baseline**
  ```
  Success rate Day 1: X%
  Avg processing time: X ms
  Proxies used: X requests
  CAPTCHAs solved: X
  Cost Day 1: $X
  ```

#### 7.5 Rollback Plan (si es necesario)
- [ ] **Si hay errores críticos**
  ```bash
  git revert HEAD
  git push origin main
  # Re-deploy
  ```

- [ ] **Restaurar DB si es necesario**
  ```bash
  mongorestore backup-prod-YYYYMMDD/
  ```

---

## Resumen Ejecutivo por Fase

### FASE 0: PREPARACIÓN
**Duración:** 4-6 horas | **Build:** ✅ Sí

**¿Qué se hace?**
- Backup de datos críticos
- Instalación de dependencias (rebrowser, crawlee, bottleneck, proxies)
- Configuración de variables de entorno
- Verificación de build exitoso

**¿Qué esperar?**
- Proyecto sigue funcionando igual
- Nuevas dependencias instaladas sin conflictos
- Build exitoso sin errores de TypeScript

**¿Qué aprobar?**
✅ Dependencias instaladas
✅ Variables de entorno configuradas
✅ Build exitoso

**Riesgos:**
🟡 Conflictos de versiones de dependencias (probabilidad baja)

---

### FASE 1: QUICK WINS
**Duración:** 5-6 horas | **Build:** ✅ Sí | **Impacto:** +10-15% éxito

**¿Qué se hace?**
- Actualizar User-Agents a Chrome 131, Firefox 133 (2025)
- Agregar headers Sec-CH-UA (requeridos en 2025)
- Integrar rebrowser-puppeteer-core (bypass Cloudflare)
- Integrar Bottleneck (rate limiting avanzado)

**¿Qué esperar?**
- Mejora inmediata de 10-15% en tasa de éxito
- Headers modernos enviados en requests
- Rate limiting más inteligente
- Logs muestran UAs modernos

**¿Qué aprobar?**
✅ Headers Sec-CH-UA presentes en requests
✅ User-Agents modernos (verificar en logs)
✅ Rebrowser instalado y funcionando
✅ Rate limiting funcional

**Riesgos:**
🟢 Bajo - Cambios mínimos, alta compatibilidad

---

### FASE 2: MÓDULO SCRAPINGMODULE BASE
**Duración:** 12-16 horas | **Build:** ✅ Sí después de cada servicio

**¿Qué se hace?**
- Crear estructura completa del módulo ScrapingModule
- Implementar ProxyConfigurationService (rotación inteligente)
- Implementar FingerprintGeneratorService (fingerprints modernos)
- Implementar ScrapingMetricsService (tracking de éxito/fallo)

**¿Qué esperar?**
- Módulo nuevo funcionando de forma independiente
- Proxies se rotan automáticamente (si configurados)
- Métricas disponibles via API
- Sistema preparado para siguiente fase

**¿Qué aprobar?**
✅ Módulo compila sin errores
✅ Servicios funcionan individualmente (tests manuales)
✅ ProxyConfigurationService selecciona proxies correctamente
✅ Métricas se registran correctamente

**Riesgos:**
🟡 Medio - Módulo nuevo, pero aislado del resto

---

### FASE 3: ANTI-DETECCIÓN AVANZADA
**Duración:** 12-18 horas | **Build:** ✅ Sí

**¿Qué se hace?**
- Implementar AdvancedScrapingService (core del sistema)
- Implementar scrapeWithCheerio() (método rápido)
- Implementar scrapeWithRebrowser() (bypass Cloudflare)
- Implementar scrapeWithCrawlee() (máxima automatización)
- Implementar fallback chain (intentar métodos hasta que funcione)

**¿Qué esperar?**
- Sistema completo de anti-detección funcionando
- Fallback automático si un método falla
- Cloudflare bypasseado con rebrowser
- Logs muestran qué método funcionó para cada URL

**¿Qué aprobar?**
✅ Extracción exitosa de sitio sin protección (Cheerio)
✅ Extracción exitosa de sitio con Cloudflare (Rebrowser)
✅ Fallback chain funciona (si Cheerio falla, intenta Rebrowser)
✅ Datos extraídos son correctos y completos

**Riesgos:**
🟡 Medio - Lógica compleja, requiere testing exhaustivo

---

### FASE 4: CAPTCHA & MÉTRICAS
**Duración:** 8-12 horas | **Build:** ✅ Sí

**¿Qué se hace?**
- Implementar CaptchaSolverService (integración 2Captcha/NoCaptchaAI)
- Mejorar ScrapingMetricsService (persistencia, métricas agregadas)
- Crear API endpoints para dashboard de métricas

**¿Qué esperar?**
- CAPTCHAs se detectan y resuelven automáticamente
- Métricas completas por dominio, método, proxy
- Dashboard de métricas accesible vía API
- Alertas si tasa de fallo > 50%

**¿Qué aprobar?**
✅ CAPTCHA detectado en sitio de prueba
✅ CAPTCHA resuelto correctamente (si API key configurada)
✅ Métricas disponibles en /scraping/metrics/overview
✅ Métricas son precisas (comparar con logs)

**Riesgos:**
🟢 Bajo - Funcionalidades opcionales, no críticas

---

### FASE 5: INTEGRACIÓN CON MÓDULOS EXISTENTES
**Duración:** 8-10 horas | **Build:** ✅ Sí (CRÍTICO)

**¿Qué se hace?**
- Modificar NoticiasScrapingService para usar AdvancedScrapingService
- Modificar NewsWebsiteService para usar AdvancedScrapingService
- Actualizar schemas para agregar campo useProxy
- Testing de backward compatibility

**¿Qué esperar?**
- Módulos existentes usan nuevo sistema anti-detección
- Configuraciones existentes siguen funcionando (backward compatible)
- Datos se guardan en mismo formato que antes
- Mejora en tasa de éxito visible en producción

**¿Qué aprobar?**
✅ NoticiasModule funciona con nuevo sistema
✅ GeneratorProModule funciona con nuevo sistema
✅ Configuraciones existentes NO se rompen
✅ Datos extraídos tienen mismo formato
✅ Build exitoso sin errores
✅ Servidor levanta sin errores

**Riesgos:**
🔴 Alto - Cambios en módulos core, requiere testing exhaustivo

**CRITICAL:** Esta fase requiere aprobación explícita antes de continuar.

---

### FASE 6: TESTING COMPLETO & AJUSTES
**Duración:** 12-16 horas | **Build:** ✅ Sí

**¿Qué se hace?**
- Configurar proxies reales (ProxyWing u otro proveedor)
- Testing extensivo de NoticiasModule (5-10 sitios)
- Testing extensivo de GeneratorProModule (2-3 sitios)
- Testing contra sitios protegidos (Cloudflare, CAPTCHA)
- Optimización de rate limiting, timeouts, cache
- Documentación completa

**¿Qué esperar?**
- Sistema completamente funcional con proxies reales
- Success rate > 85% en sitios protegidos
- Documentación completa de configuración
- Guía de troubleshooting
- Sistema listo para producción

**¿Qué aprobar?**
✅ Success rate > 85% en testing
✅ Cloudflare bypasseado consistentemente
✅ CAPTCHAs resueltos > 90%
✅ No hay memory leaks
✅ Documentación completa
✅ Costos dentro de presupuesto ($30-50/mes)

**Riesgos:**
🟡 Medio - Requiere ajustes finos, puede tomar más tiempo

---

### FASE 7: DEPLOY A PRODUCCIÓN
**Duración:** 4-6 horas | **Build:** ✅ Sí

**¿Qué se hace?**
- Deploy a staging
- Monitoring 24h en staging
- Deploy a producción (ventana de bajo tráfico)
- Post-deploy monitoring intensivo
- Configuración de alertas

**¿Qué esperar?**
- Sistema funcionando en producción sin errores
- Mejora visible en success rate
- Costos controlados
- Métricas accesibles en dashboard

**¿Qué aprobar?**
✅ Staging funciona 24h sin errores críticos
✅ Producción deploy exitoso
✅ Success rate > 85% en producción
✅ No hay errores en logs críticos
✅ Costos están dentro de presupuesto

**Riesgos:**
🟡 Medio - Producción siempre tiene riesgos

**ROLLBACK PLAN:** Preparado para revertir si hay errores críticos

---

## Métricas de Éxito

### Métricas Técnicas

| Métrica | Actual | Objetivo Fase 1 | Objetivo Final |
|---------|--------|-----------------|----------------|
| **Success Rate** | 70% | 80-85% | 92%+ |
| **Cloudflare Bypass** | 0% | 50-60% | 87%+ |
| **Avg Extraction Time** | 5-10s | 4-8s | 3-5s |
| **CAPTCHA Solve Rate** | N/A | N/A | 95%+ |
| **URLs Processed/Day** | 1,000 | 1,500 | 10,000 |

### Métricas de Costos

| Concepto | Estimado Mes 1 | Estimado Mes 3 |
|----------|----------------|----------------|
| **Proxies** | $20-30 | $30-50 |
| **CAPTCHA** | $5-10 | $10-20 |
| **Infraestructura** | $0 (existente) | $0 |
| **TOTAL** | $25-40 | $40-70 |

### Métricas de Calidad

| Métrica | Objetivo |
|---------|----------|
| **Data Completeness** | > 90% |
| **Title Quality** | > 95% |
| **Content Quality** | > 90% |
| **Image Extraction** | > 85% |

---

## Apéndice

### A. Comandos Útiles

```bash
# Build
yarn build

# Verificar que servidor levanta (no ejecutar)
yarn start:dev

# Verificar logs de queue
redis-cli KEYS "bull:*"

# Verificar métricas de scraping
curl http://localhost:3000/scraping/metrics/overview

# Testing manual de proxy
curl --proxy http://user:pass@proxy.com:8080 https://httpbin.org/ip

# Verificar balance de 2Captcha
curl https://2captcha.com/res.php?key=YOUR_API_KEY&action=getbalance
```

### B. Variables de Entorno Completas

```bash
# Anti-Detection
DATACENTER_PROXY_URLS=
RESIDENTIAL_PROXY_URLS=
MOBILE_PROXY_URLS=
NOCAPTCHAAI_API_KEY=
TWOCAPTCHA_API_KEY=
SCRAPERAPI_KEY=
SCRAPERAPI_ENABLED=false

# Puppeteer
MAX_CONCURRENT_BROWSERS=5
BROWSER_POOL_SIZE=10
PUPPETEER_HEADLESS=true
PUPPETEER_TIMEOUT=30000

# Rate Limiting
DEFAULT_RATE_LIMIT=30
ADAPTIVE_RATE_LIMITING=true
RATE_LIMIT_PER_DOMAIN=true

# Monitoring
ENABLE_SCRAPING_METRICS=true
METRICS_RETENTION_DAYS=30
LOG_SCRAPING_DETAILS=true
ALERT_ON_FAILURE_RATE=0.5
```

### C. Proveedores Recomendados

**Proxies (Budget):**
- ProxyWing: https://proxywing.com ($2.50/GB residential)
- Webshare: https://webshare.io (10 free proxies)

**CAPTCHA:**
- NoCaptchaAI: https://nocaptchaai.com ($0.14/1000)
- 2Captcha: https://2captcha.com ($0.50/1000)

---

## Notas Finales

### Restricciones Recordadas
✅ **SIN forwardRef** - Usar EventEmitter2 para comunicación entre módulos
✅ **SIN any types** - Tipado estricto TypeScript en todo momento
✅ **SIN testing automático** - Testing manual por Coyotito
✅ **Build después de cada fase** - Verificar que servidor levanta

### Puntos Críticos
🔴 **FASE 5 es crítica** - Cambios en módulos core, requiere aprobación explícita
🔴 **FASE 7 requiere ventana de bajo tráfico** - Coordinar con equipo
🟡 **Monitoreo post-deploy es crucial** - Primeras 48h críticas

### Próximos Pasos Después de Implementación
1. Monitorear costos mensuales
2. Ajustar configuraciones basado en métricas
3. Agregar más dominios a scraping
4. Considerar upgrade a proxies premium si necesario
5. Explorar ScraperAPI para dominios muy difíciles

---

**Fin del documento**

**Versión:** 1.0
**Última actualización:** 21 de Octubre de 2025
**Próxima revisión:** Después de Fase 7 (deploy a producción)
