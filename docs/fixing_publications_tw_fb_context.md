# 🔧 FIXING SOCIAL MEDIA PUBLICATIONS - ANÁLISIS Y PLAN DE CORRECCIÓN

> **Documento de Diagnóstico y Planificación**
>
> **Fecha**: 18 de Octubre de 2025
> **Autor**: Jarvis (Claude Code Assistant)
> **Solicitado por**: Coyotito
> **Prioridad**: 🔴 CRÍTICA

---

## 📋 TABLA DE CONTENIDOS

1. [🔍 Diagnóstico del Problema](#diagnóstico-del-problema)
2. [🏗️ Arquitectura Actual (INCORRECTA)](#arquitectura-actual-incorrecta)
3. [✅ Arquitectura Objetivo (CORRECTA)](#arquitectura-objetivo-correcta)
4. [📊 Análisis de Impacto](#análisis-de-impacto)
5. [🚀 Plan de Implementación por Fases](#plan-de-implementación-por-fases)
6. [📖 Resumen Ejecutivo](#resumen-ejecutivo)

---

## 🔍 DIAGNÓSTICO DEL PROBLEMA

### 🎯 Problema Principal

**El sistema NO publica en Facebook ni Twitter porque busca configuraciones en colecciones que NO EXISTEN.**

### 📍 Evidencia del Error

**Logs del sistema:**
```
[SocialMediaPublishingService] 📘 Publishing to Facebook for site: Noticias Pachuca
⚠️ No active Facebook configs found for site Noticias Pachuca

[SocialMediaPublishingService] 🐦 Publishing to Twitter for site: Noticias Pachuca
⚠️ No active Twitter configs found for site Noticias Pachuca

[SocialMediaPublishingService] ✅ Social media publishing completed: 0/0 successful
```

### 🔎 Causa Raíz

**Líneas problemáticas en `social-media-publishing.service.ts`:**

```typescript
// LÍNEA 215-218 (INCORRECTO)
const facebookConfigs = await this.facebookConfigModel.find({
  siteId: site._id,
  isActive: true,
});

// LÍNEA 312-315 (INCORRECTO)
const twitterConfigs = await this.twitterConfigModel.find({
  siteId: site._id,
  isActive: true,
});
```

**Busca en:**
- Collection: `facebookpublishingconfigs` ❌ (NO EXISTE)
- Collection: `twitterpublishingconfigs` ❌ (NO EXISTE)

**Debería usar:**
- `site.socialMedia.facebookPages[]` ✅ (YA EXISTE EN EL DOCUMENTO)
- `site.socialMedia.twitterAccounts[]` ✅ (YA EXISTE EN EL DOCUMENTO)

---

## 🏗️ ARQUITECTURA ACTUAL (INCORRECTA)

### 📦 Sistema Implementado (COMPLEJO E INCORRECTO)

```
┌─────────────────────────────────────────────────────────────┐
│  FLUJO ACTUAL (NO FUNCIONA)                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. PublishService.publishNoticia()                        │
│      └─> publishToSocialMedia = true                      │
│                                                             │
│  2. SocialMediaPublishingService.publishToSocialMedia()    │
│      ├─> busca: FacebookPublishingConfig ❌ (NO EXISTE)    │
│      └─> busca: TwitterPublishingConfig ❌ (NO EXISTE)     │
│                                                             │
│  3. RESULTADO: 0/0 successful (NADA SE PUBLICA)           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 🗂️ Collections Buscadas (QUE NO EXISTEN)

#### 1. **FacebookPublishingConfig** (Collection inexistente)
```typescript
// Schema: facebook-publishing-config.schema.ts
{
  siteId: Types.ObjectId,
  name: string,
  facebookPageId: string,
  facebookPageName: string,
  getLateApiKey: string,
  templateId: Types.ObjectId,
  isActive: boolean,
  publishingFrequency: number,
  maxPostsPerDay: number,
  // ... 100+ líneas más de configuraciones complejas
}
```

**Problema:** Este schema existe PERO no hay documentos en la colección.

#### 2. **TwitterPublishingConfig** (Collection inexistente)
```typescript
// Schema: twitter-publishing-config.schema.ts
{
  siteId: Types.ObjectId,
  name: string,
  twitterAccountId: string,
  twitterUsername: string,
  twitterDisplayName: string,
  getLateApiKey: string,
  templateId: Types.ObjectId,
  isActive: boolean,
  publishingFrequency: number,
  maxTweetsPerDay: number,
  // ... 100+ líneas más de configuraciones complejas
}
```

**Problema:** Este schema existe PERO no hay documentos en la colección.

### 🔗 Servicios Afectados

| Servicio | Archivo | Problema |
|----------|---------|----------|
| **SocialMediaPublishingService** | `social-media-publishing.service.ts` | Busca en collections inexistentes (líneas 215, 312) |
| **FacebookPublishingService** | `facebook-publishing.service.ts` | Usa `FacebookPublishingConfig` (línea 78) |
| **TwitterPublishingService** | `twitter-publishing.service.ts` | Usa `TwitterPublishingConfig` (línea 81) |
| **PublishService** | `publish.service.ts` | Llama a `SocialMediaPublishingService` (línea 252) |

### 📄 Schemas Afectados

| Schema | Archivo | Problema |
|--------|---------|----------|
| **FacebookPost** | `facebook-post.schema.ts` | Referencia a `FacebookPublishingConfig` (línea 35) |
| **TwitterPost** | `twitter-post.schema.ts` | Referencia a `TwitterPublishingConfig` (línea 35) |

### 🎛️ Controllers Afectados

| Controller | Archivo | Problema |
|-----------|---------|----------|
| **TwitterPublishingController** | `twitter-publishing.controller.ts` | CRUD para configs inexistentes |
| **GeneratorProController** | `generator-pro.controller.ts` | Endpoint `POST /facebook-configs` (línea 812) |

---

## ✅ ARQUITECTURA OBJETIVO (CORRECTA)

### 📦 Sistema Objetivo (SIMPLE Y FUNCIONAL)

```
┌─────────────────────────────────────────────────────────────┐
│  FLUJO OBJETIVO (LO QUE DEBE FUNCIONAR)                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. PublishService.publishNoticia()                        │
│      └─> publishToSocialMedia = true                      │
│                                                             │
│  2. SocialMediaPublishingService.publishToSocialMedia()    │
│      ├─> usa: site.socialMedia.facebookPages[] ✅          │
│      └─> usa: site.socialMedia.twitterAccounts[] ✅        │
│                                                             │
│  3. Para cada página/cuenta ACTIVA:                        │
│      ├─> FacebookPublishingService.publishPost()           │
│      │    └─> GetLate.dev API                              │
│      └─> TwitterPublishingService.publishTweet()           │
│           └─> GetLate.dev API                              │
│                                                             │
│  4. RESULTADO: N/N successful (TODO SE PUBLICA)            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 🗃️ Datos Existentes (LO QUE YA FUNCIONA)

#### **Site Document** (Collection: `sites`)
```json
{
  "_id": "68efdad29c7e78311d99902a",
  "domain": "noticiaspachuca.com",
  "name": "Noticias Pachuca",
  "isActive": true,
  "socialMedia": {
    "facebookPages": [
      {
        "pageId": "872015802652894",
        "pageName": "Noticias Pachuca",
        "isActive": true,
        "priority": 1
      }
    ],
    "twitterAccounts": [
      {
        "accountId": "68efe856352ee82c852957fa",
        "username": "PachucaNoticias",
        "displayName": "Noticias Pachuca",
        "isActive": true,
        "priority": 1
      }
    ]
  }
}
```

**Estado:** ✅ CORRECTO - Los datos YA ESTÁN configurados correctamente.

### 🔄 Flujo de Configuración (YA IMPLEMENTADO)

1. **App Móvil** → Obtiene páginas/cuentas desde GetLate:
   ```
   GET /generator-pro/social-media/facebook/pages
   GET /generator-pro/social-media/twitter/accounts
   ```

2. **App Móvil** → Actualiza sitio con páginas/cuentas seleccionadas:
   ```
   PATCH /pachuca-noticias/sites/:id
   {
     "socialMedia": {
       "facebookPages": [...],
       "twitterAccounts": [...]
     }
   }
   ```

3. **SitesService** → Guarda en `site.socialMedia` ✅
   - Archivo: `sites.service.ts` (líneas 280-300)
   - Estado: **FUNCIONA CORRECTAMENTE**

---

## 📊 ANÁLISIS DE IMPACTO

### 🗂️ Archivos a Modificar

#### 🔴 CRÍTICOS (Bloquean funcionalidad)

| # | Archivo | Cambios Necesarios | Líneas Afectadas |
|---|---------|-------------------|------------------|
| 1 | `social-media-publishing.service.ts` | Reescribir métodos `publishToFacebook()` y `publishToTwitter()` | 203-397 (~195 líneas) |
| 2 | `facebook-publishing.service.ts` | Adaptar `publishPost()` para no usar config | 74-200 (~126 líneas) |
| 3 | `twitter-publishing.service.ts` | Adaptar `publishTweet()` para no usar config | 77-195 (~118 líneas) |

#### 🟡 SECUNDARIOS (No bloquean, pero inconsistentes)

| # | Archivo | Cambios Necesarios | Líneas Afectadas |
|---|---------|-------------------|------------------|
| 4 | `facebook-post.schema.ts` | Hacer `facebookConfigId` opcional | 35-36 |
| 5 | `twitter-post.schema.ts` | Hacer `twitterConfigId` opcional | 35-36 |
| 6 | `generator-pro.module.ts` | Remover providers de configs (opcional) | Por determinar |

#### ⚪ OPCIONALES (Limpieza futura)

| # | Archivo | Acción | Justificación |
|---|---------|--------|---------------|
| 7 | `facebook-publishing-config.schema.ts` | Deprecar/Eliminar | Ya no se usa |
| 8 | `twitter-publishing-config.schema.ts` | Deprecar/Eliminar | Ya no se usa |
| 9 | `twitter-publishing.controller.ts` | Deprecar/Eliminar | CRUD de configs inexistentes |
| 10 | `generator-pro.controller.ts` | Eliminar endpoints `/facebook-configs` | Líneas 809-880 |

### 📐 Complejidad por Archivo

```
social-media-publishing.service.ts:  🔴🔴🔴🔴⚪ (Alta - 195 líneas)
facebook-publishing.service.ts:      🔴🔴🔴⚪⚪ (Media-Alta - 126 líneas)
twitter-publishing.service.ts:       🔴🔴🔴⚪⚪ (Media-Alta - 118 líneas)
facebook-post.schema.ts:             🟡⚪⚪⚪⚪ (Baja - 2 líneas)
twitter-post.schema.ts:              🟡⚪⚪⚪⚪ (Baja - 2 líneas)
```

### ⏱️ Estimación de Tiempo

| Fase | Tiempo Estimado | Responsable | Complejidad |
|------|----------------|-------------|-------------|
| FASE 0 | 1 hora | Jarvis | Baja (Análisis y preparación) |
| FASE 1 | 3-4 horas | Jarvis | Alta (Core services) |
| FASE 2 | 2-3 horas | Jarvis | Media (Schemas y DTOs) |
| FASE 3 | Variable | **Coyotito** | Media (Testing manual) |
| FASE 4 | 1 hora | Jarvis | Baja (Limpieza opcional) |
| **TOTAL (Jarvis)** | **7-9 horas** | Jarvis | Media-Alta |
| **TOTAL (Coyotito)** | **Variable** | Coyotito | Testing y validación |

---

## 🚀 PLAN DE IMPLEMENTACIÓN POR FASES

---

### 🎯 FASE 0: PREPARACIÓN Y RESPALDO

**Objetivo:** Preparar el entorno y crear respaldos antes de modificar código.

**Duración Estimada:** 1 hora

#### ✅ Checklist FASE 0

- [ ] **0.1** Crear branch de feature
  ```bash
  git checkout -b fix/social-media-publications-system
  ```

- [ ] **0.2** Crear backup de archivos críticos
  ```bash
  # Respaldar en carpeta temporal
  cp social-media-publishing.service.ts social-media-publishing.service.ts.backup
  cp facebook-publishing.service.ts facebook-publishing.service.ts.backup
  cp twitter-publishing.service.ts twitter-publishing.service.ts.backup
  ```

- [ ] **0.3** Verificar estado actual de Site en MongoDB
  ```bash
  # Confirmar que socialMedia.facebookPages y twitterAccounts existen
  db.sites.findOne({ "slug": "noticiaspachuca" })
  ```

- [ ] **0.4** Documentar GetLate API Key
  - Ubicación actual: `facebook-pages.service.ts:15`
  - Valor: `sk_a7e92958841ee94d4d95b99f88b1f7b0fb7672a60b0fca50f27b190476d98cd8`
  - Acción: Verificar que funciona con GetLate API

- [ ] **0.5** Verificar que NO existen documentos en collections incorrectas
  ```bash
  db.facebookpublishingconfigs.count() # Debe ser 0
  db.twitterpublishingconfigs.count()  # Debe ser 0
  ```

#### 📋 Entregables FASE 0

✅ Branch creado
✅ Backups creados
✅ Estado de BD documentado
✅ GetLate API Key verificada

---

### 🔴 FASE 1: REFACTORIZAR CORE SERVICES

**Objetivo:** Modificar los servicios principales para usar `site.socialMedia` en lugar de collections inexistentes.

**Duración Estimada:** 3-4 horas

#### 📁 Archivos a Modificar

1. `social-media-publishing.service.ts` (195 líneas)
2. `facebook-publishing.service.ts` (126 líneas)
3. `twitter-publishing.service.ts` (118 líneas)

---

#### 🔧 **Tarea 1.1: Modificar SocialMediaPublishingService**

**Archivo:** `src/generator-pro/services/social-media-publishing.service.ts`

##### ✅ Checklist Tarea 1.1

- [ ] **1.1.1** Remover imports de schemas de configs
  ```typescript
  // ELIMINAR:
  import { FacebookPublishingConfig, FacebookPublishingConfigDocument } from '../schemas/facebook-publishing-config.schema';
  import { TwitterPublishingConfig, TwitterPublishingConfigDocument } from '../schemas/twitter-publishing-config.schema';
  ```

- [ ] **1.1.2** Remover inyección de modelos de configs en constructor
  ```typescript
  // ELIMINAR del constructor:
  @InjectModel(FacebookPublishingConfig.name)
  private readonly facebookConfigModel: Model<FacebookPublishingConfigDocument>,
  @InjectModel(TwitterPublishingConfig.name)
  private readonly twitterConfigModel: Model<TwitterPublishingConfigDocument>,
  ```

- [ ] **1.1.3** Reescribir método `publishToFacebook()` (líneas 203-295)

  **Código ANTES (INCORRECTO):**
  ```typescript
  async publishToFacebook(
    noticia: any,
    site: SiteDocument,
    scheduledAt: Date,
    optimizeContent: boolean
  ): Promise<FacebookPublishResult[]> {
    const results: FacebookPublishResult[] = [];

    // ❌ INCORRECTO: Busca en collection inexistente
    const facebookConfigs = await this.facebookConfigModel.find({
      siteId: site._id,
      isActive: true,
    });

    if (facebookConfigs.length === 0) {
      this.logger.warn(`⚠️ No active Facebook configs found`);
      return results;
    }

    for (const config of facebookConfigs) {
      // ... lógica con config
    }
  }
  ```

  **Código DESPUÉS (CORRECTO):**
  ```typescript
  async publishToFacebook(
    noticia: any,
    site: SiteDocument,
    scheduledAt: Date,
    optimizeContent: boolean
  ): Promise<FacebookPublishResult[]> {
    this.logger.log(`📘 Publishing to Facebook for site: ${site.name}`);

    const results: FacebookPublishResult[] = [];

    try {
      // ✅ CORRECTO: Usa site.socialMedia directamente
      const facebookPages = site.socialMedia?.facebookPages || [];
      const activePages = facebookPages.filter(page => page.isActive);

      if (activePages.length === 0) {
        this.logger.warn(`⚠️ No active Facebook pages found for site ${site.name}`);
        return results;
      }

      this.logger.log(`📘 Found ${activePages.length} active Facebook pages`);

      // Publicar en cada página activa
      for (const page of activePages) {
        try {
          // Optimizar contenido si está habilitado
          let postContent = noticia.generatedContent || noticia.titulo;
          if (optimizeContent) {
            postContent = await this.facebookPublishingService.optimizeContentForFacebook(noticia);
          }

          // Crear post en la base de datos
          const facebookPost = await this.facebookPostModel.create({
            publishedNoticiaId: noticia._id,
            siteId: site._id,
            facebookConfigId: undefined, // Ya no se usa
            pageId: page.pageId,        // ← NUEVO: Guardar pageId directamente
            pageName: page.pageName,    // ← NUEVO: Guardar pageName
            postContent,
            originalTitle: noticia.titulo,
            mediaUrls: noticia.imagenDestacada ? [noticia.imagenDestacada] : [],
            scheduledAt,
            status: 'scheduled',
          });

          // Publicar post via GetLate API
          const publishResult = await this.facebookPublishingService.publishPost(
            facebookPost,
            page.pageId,              // ← NUEVO: Pasar pageId
            site.socialMedia?.getLateApiKey // ← NUEVO: Pasar API key desde site
          );

          results.push({
            configId: page.pageId,     // ← NUEVO: Usar pageId como identificador
            configName: page.pageName,
            facebookPageId: page.pageId,
            facebookPageName: page.pageName,
            success: publishResult.success,
            postId: publishResult.facebookPostId,
            postUrl: publishResult.facebookPostUrl,
            error: publishResult.error,
          });

        } catch (error) {
          this.logger.error(`❌ Failed to publish to Facebook page ${page.pageName}: ${error.message}`);
          results.push({
            configId: page.pageId,
            configName: page.pageName,
            facebookPageId: page.pageId,
            facebookPageName: page.pageName,
            success: false,
            error: error.message,
          });
        }
      }

      return results;

    } catch (error) {
      this.logger.error(`❌ Failed to publish to Facebook: ${error.message}`);
      return results;
    }
  }
  ```

- [ ] **1.1.4** Reescribir método `publishToTwitter()` (líneas 300-397)

  **Aplicar el mismo patrón que Facebook:**
  ```typescript
  async publishToTwitter(
    noticia: any,
    site: SiteDocument,
    scheduledAt: Date,
    optimizeContent: boolean
  ): Promise<TwitterPublishResult[]> {
    this.logger.log(`🐦 Publishing to Twitter for site: ${site.name}`);

    const results: TwitterPublishResult[] = [];

    try {
      // ✅ CORRECTO: Usa site.socialMedia directamente
      const twitterAccounts = site.socialMedia?.twitterAccounts || [];
      const activeAccounts = twitterAccounts.filter(account => account.isActive);

      if (activeAccounts.length === 0) {
        this.logger.warn(`⚠️ No active Twitter accounts found for site ${site.name}`);
        return results;
      }

      this.logger.log(`🐦 Found ${activeAccounts.length} active Twitter accounts`);

      // Publicar en cada cuenta activa
      for (const account of activeAccounts) {
        try {
          // Optimizar contenido si está habilitado
          let tweetContent = noticia.generatedContent || noticia.titulo;
          if (optimizeContent) {
            tweetContent = await this.twitterPublishingService.optimizeContentForTwitter(noticia);
          }

          // Validar longitud del tweet
          if (tweetContent.length > 280) {
            this.logger.warn(`⚠️ Tweet content exceeds 280 characters, truncating...`);
            tweetContent = tweetContent.substring(0, 277) + '...';
          }

          // Crear tweet en la base de datos
          const twitterPost = await this.twitterPostModel.create({
            publishedNoticiaId: noticia._id,
            siteId: site._id,
            twitterConfigId: undefined,    // Ya no se usa
            accountId: account.accountId,  // ← NUEVO: Guardar accountId
            username: account.username,    // ← NUEVO: Guardar username
            tweetContent,
            originalTitle: noticia.titulo,
            mediaUrls: noticia.imagenDestacada ? [noticia.imagenDestacada] : [],
            scheduledAt,
            status: 'scheduled',
          });

          // Publicar tweet via GetLate API
          const publishResult = await this.twitterPublishingService.publishTweet(
            twitterPost,
            account.accountId,              // ← NUEVO: Pasar accountId
            site.socialMedia?.getLateApiKey // ← NUEVO: Pasar API key
          );

          results.push({
            configId: account.accountId,
            configName: account.username,
            twitterAccountId: account.accountId,
            twitterUsername: account.username,
            success: publishResult.success,
            tweetId: publishResult.tweetId,
            tweetUrl: publishResult.tweetUrl,
            error: publishResult.error,
          });

        } catch (error) {
          this.logger.error(`❌ Failed to publish to Twitter account ${account.username}: ${error.message}`);
          results.push({
            configId: account.accountId,
            configName: account.username,
            twitterAccountId: account.accountId,
            twitterUsername: account.username,
            success: false,
            error: error.message,
          });
        }
      }

      return results;

    } catch (error) {
      this.logger.error(`❌ Failed to publish to Twitter: ${error.message}`);
      return results;
    }
  }
  ```

- [ ] **1.1.5** Actualizar tipos de interfaces de resultado
  ```typescript
  // Actualizar interfaces para que no dependan de configId
  interface FacebookPublishResult {
    configId: string;          // Ahora es pageId en lugar de configId
    configName: string;        // Ahora es pageName
    facebookPageId: string;
    facebookPageName: string;
    success: boolean;
    postId?: string;
    postUrl?: string;
    error?: string;
  }

  interface TwitterPublishResult {
    configId: string;          // Ahora es accountId
    configName: string;        // Ahora es username
    twitterAccountId: string;
    twitterUsername: string;
    success: boolean;
    tweetId?: string;
    tweetUrl?: string;
    error?: string;
  }
  ```

- [ ] **1.1.6** Verificar compilación sin errores de TypeScript
  ```bash
  npm run build
  ```

##### 📋 Entregables Tarea 1.1

✅ Imports actualizados
✅ Constructor sin modelos de configs
✅ `publishToFacebook()` refactorizado
✅ `publishToTwitter()` refactorizado
✅ Interfaces actualizadas
✅ Compilación exitosa

---

#### 🔧 **Tarea 1.2: Adaptar FacebookPublishingService**

**Archivo:** `src/generator-pro/services/facebook-publishing.service.ts`

##### ✅ Checklist Tarea 1.2

- [ ] **1.2.1** Remover inyección de `FacebookPublishingConfig` model
  ```typescript
  // ELIMINAR del constructor:
  @InjectModel(FacebookPublishingConfig.name)
  private readonly facebookConfigModel: Model<FacebookPublishingConfigDocument>,
  ```

- [ ] **1.2.2** Modificar firma del método `publishPost()` (línea 74)

  **ANTES:**
  ```typescript
  async publishPost(post: FacebookPostDocument): Promise<PublishResult>
  ```

  **DESPUÉS:**
  ```typescript
  async publishPost(
    post: FacebookPostDocument,
    pageId: string,           // ← NUEVO: Recibir pageId como parámetro
    getLateApiKey?: string    // ← NUEVO: Recibir API key como parámetro
  ): Promise<PublishResult>
  ```

- [ ] **1.2.3** Actualizar método `publishPost()` para NO buscar config (líneas 78-86)

  **ELIMINAR:**
  ```typescript
  const facebookConfig = await this.facebookConfigModel.findById(post.facebookConfigId);
  if (!facebookConfig) {
    throw new Error(`Facebook config ${post.facebookConfigId} not found`);
  }

  if (!facebookConfig.canPublishToday) {
    throw new Error('Daily posting limit reached');
  }
  ```

  **REEMPLAZAR CON:**
  ```typescript
  // Usar API key pasada como parámetro o la hardcodeada como fallback
  const apiKey = getLateApiKey || this.getDefaultApiKey();

  // TODO FUTURO: Implementar límites diarios usando Redis
  // Por ahora, no validamos límites
  ```

- [ ] **1.2.4** Actualizar llamada a GetLate API (línea 93)

  **CAMBIAR:**
  ```typescript
  platforms: [{
    platform: 'facebook',
    accountId: facebookConfig.facebookPageId, // ❌ Ya no existe config
    // ...
  }]
  ```

  **POR:**
  ```typescript
  platforms: [{
    platform: 'facebook',
    accountId: pageId, // ✅ Usar pageId del parámetro
    // ...
  }]
  ```

- [ ] **1.2.5** Actualizar método `testConnection()` (si existe)
  ```typescript
  // Cambiar firma para recibir pageId y apiKey como parámetros
  async testConnection(pageId: string, getLateApiKey: string): Promise<ConnectionTest>
  ```

- [ ] **1.2.6** Agregar método helper para API key por defecto
  ```typescript
  private getDefaultApiKey(): string {
    return 'sk_a7e92958841ee94d4d95b99f88b1f7b0fb7672a60b0fca50f27b190476d98cd8';
  }
  ```

- [ ] **1.2.7** Actualizar método `optimizeContentForFacebook()` (si usa config)
  ```typescript
  // Verificar que NO dependa de FacebookPublishingConfig
  // Si depende, refactorizar para recibir configuración como parámetros
  ```

##### 📋 Entregables Tarea 1.2

✅ Model de config removido
✅ Firma de `publishPost()` actualizada
✅ Lógica sin búsqueda de config
✅ GetLate API usando pageId
✅ Método helper de API key agregado

---

#### 🔧 **Tarea 1.3: Adaptar TwitterPublishingService**

**Archivo:** `src/generator-pro/services/twitter-publishing.service.ts`

##### ✅ Checklist Tarea 1.3

- [ ] **1.3.1** Remover inyección de `TwitterPublishingConfig` model
  ```typescript
  // ELIMINAR del constructor:
  @InjectModel(TwitterPublishingConfig.name)
  private readonly twitterConfigModel: Model<TwitterPublishingConfigDocument>,
  ```

- [ ] **1.3.2** Modificar firma del método `publishTweet()` (línea 77)

  **ANTES:**
  ```typescript
  async publishTweet(tweet: TwitterPostDocument): Promise<PublishResult>
  ```

  **DESPUÉS:**
  ```typescript
  async publishTweet(
    tweet: TwitterPostDocument,
    accountId: string,        // ← NUEVO: Recibir accountId como parámetro
    getLateApiKey?: string    // ← NUEVO: Recibir API key como parámetro
  ): Promise<PublishResult>
  ```

- [ ] **1.3.3** Actualizar método `publishTweet()` para NO buscar config (líneas 81-88)

  **ELIMINAR:**
  ```typescript
  const twitterConfig = await this.twitterConfigModel.findById(tweet.twitterConfigId);
  if (!twitterConfig) {
    throw new Error(`Twitter config ${tweet.twitterConfigId} not found`);
  }

  if (!twitterConfig.canPublishToday) {
    throw new Error('Daily tweet limit reached');
  }
  ```

  **REEMPLAZAR CON:**
  ```typescript
  // Usar API key pasada como parámetro o la hardcodeada como fallback
  const apiKey = getLateApiKey || this.getDefaultApiKey();

  // TODO FUTURO: Implementar límites diarios usando Redis
  // Por ahora, no validamos límites
  ```

- [ ] **1.3.4** Actualizar llamada a GetLate API (línea 100)

  **CAMBIAR:**
  ```typescript
  platforms: [{
    platform: 'twitter',
    accountId: twitterConfig.twitterAccountId, // ❌ Ya no existe config
    // ...
  }]
  ```

  **POR:**
  ```typescript
  platforms: [{
    platform: 'twitter',
    accountId: accountId, // ✅ Usar accountId del parámetro
    // ...
  }]
  ```

- [ ] **1.3.5** Actualizar método `testConnection()` (si existe)
  ```typescript
  // Cambiar firma para recibir accountId y apiKey como parámetros
  async testConnection(accountId: string, getLateApiKey: string): Promise<ConnectionTest>
  ```

- [ ] **1.3.6** Agregar método helper para API key por defecto
  ```typescript
  private getDefaultApiKey(): string {
    return 'sk_a7e92958841ee94d4d95b99f88b1f7b0fb7672a60b0fca50f27b190476d98cd8';
  }
  ```

- [ ] **1.3.7** Actualizar método `optimizeContentForTwitter()` (si usa config)
  ```typescript
  // Verificar que NO dependa de TwitterPublishingConfig
  // Si depende, refactorizar para recibir configuración como parámetros
  ```

##### 📋 Entregables Tarea 1.3

✅ Model de config removido
✅ Firma de `publishTweet()` actualizada
✅ Lógica sin búsqueda de config
✅ GetLate API usando accountId
✅ Método helper de API key agregado

---

#### 📋 Entregables FASE 1

✅ `SocialMediaPublishingService` refactorizado
✅ `FacebookPublishingService` adaptado
✅ `TwitterPublishingService` adaptado
✅ Todos los servicios compilando sin errores
✅ Sin dependencias de collections inexistentes

---

### 🟡 FASE 2: ACTUALIZAR SCHEMAS Y MODELS

**Objetivo:** Hacer que los schemas de Post NO dependan de configs inexistentes.

**Duración Estimada:** 2-3 horas

#### 📁 Archivos a Modificar

1. `facebook-post.schema.ts` (2 líneas)
2. `twitter-post.schema.ts` (2 líneas)
3. `generator-pro.module.ts` (remover providers)

---

#### 🔧 **Tarea 2.1: Actualizar FacebookPost Schema**

**Archivo:** `src/generator-pro/schemas/facebook-post.schema.ts`

##### ✅ Checklist Tarea 2.1

- [ ] **2.1.1** Hacer `facebookConfigId` opcional (línea 35-36)

  **ANTES:**
  ```typescript
  @Prop({ required: true, type: Types.ObjectId, ref: 'FacebookPublishingConfig' })
  facebookConfigId: Types.ObjectId;
  ```

  **DESPUÉS:**
  ```typescript
  @Prop({ required: false, type: Types.ObjectId, ref: 'FacebookPublishingConfig' })
  facebookConfigId?: Types.ObjectId; // Deprecado: Ya no se usa, se usa pageId
  ```

- [ ] **2.1.2** Agregar campos nuevos para almacenar pageId y pageName
  ```typescript
  // AGREGAR después de facebookConfigId:

  @Prop({ type: String })
  pageId?: string; // ID de la página de Facebook (desde GetLate)

  @Prop({ type: String })
  pageName?: string; // Nombre de la página (para logs/UI)
  ```

- [ ] **2.1.3** Actualizar índices del schema (al final del archivo)
  ```typescript
  // AGREGAR nuevo índice:
  FacebookPostSchema.index({ pageId: 1 });
  FacebookPostSchema.index({ siteId: 1, pageId: 1 });
  ```

- [ ] **2.1.4** Deprecar referencia a config en comentarios
  ```typescript
  // Actualizar comentario de línea 35 para indicar deprecación:
  /**
   * @deprecated Ya no se usa. Use `pageId` en su lugar.
   * Se mantiene por compatibilidad con posts antiguos.
   */
  ```

##### 📋 Entregables Tarea 2.1

✅ `facebookConfigId` opcional
✅ Campos `pageId` y `pageName` agregados
✅ Índices actualizados
✅ Comentarios de deprecación agregados

---

#### 🔧 **Tarea 2.2: Actualizar TwitterPost Schema**

**Archivo:** `src/generator-pro/schemas/twitter-post.schema.ts`

##### ✅ Checklist Tarea 2.2

- [ ] **2.2.1** Hacer `twitterConfigId` opcional (línea 35-36)

  **ANTES:**
  ```typescript
  @Prop({ required: true, type: Types.ObjectId, ref: 'TwitterPublishingConfig' })
  twitterConfigId: Types.ObjectId;
  ```

  **DESPUÉS:**
  ```typescript
  @Prop({ required: false, type: Types.ObjectId, ref: 'TwitterPublishingConfig' })
  twitterConfigId?: Types.ObjectId; // Deprecado: Ya no se usa, se usa accountId
  ```

- [ ] **2.2.2** Agregar campos nuevos para almacenar accountId y username
  ```typescript
  // AGREGAR después de twitterConfigId:

  @Prop({ type: String })
  accountId?: string; // ID de la cuenta de Twitter (desde GetLate)

  @Prop({ type: String })
  username?: string; // Username de la cuenta (para logs/UI)
  ```

- [ ] **2.2.3** Actualizar índices del schema (al final del archivo)
  ```typescript
  // AGREGAR nuevo índice:
  TwitterPostSchema.index({ accountId: 1 });
  TwitterPostSchema.index({ siteId: 1, accountId: 1 });
  ```

- [ ] **2.2.4** Deprecar referencia a config en comentarios
  ```typescript
  // Actualizar comentario de línea 35 para indicar deprecación:
  /**
   * @deprecated Ya no se usa. Use `accountId` en su lugar.
   * Se mantiene por compatibilidad con tweets antiguos.
   */
  ```

##### 📋 Entregables Tarea 2.2

✅ `twitterConfigId` opcional
✅ Campos `accountId` y `username` agregados
✅ Índices actualizados
✅ Comentarios de deprecación agregados

---

#### 🔧 **Tarea 2.3: Actualizar GeneratorProModule**

**Archivo:** `src/generator-pro/generator-pro.module.ts`

##### ✅ Checklist Tarea 2.3

- [ ] **2.3.1** Verificar providers actuales
  ```typescript
  // Buscar en el array de providers:
  // - FacebookPublishingService ✅ (MANTENER - se usa)
  // - TwitterPublishingService ✅ (MANTENER - se usa)
  // - SocialMediaPublishingService ✅ (MANTENER - se usa)
  ```

- [ ] **2.3.2** Remover imports innecesarios de schemas (OPCIONAL)
  ```typescript
  // SI NO SE USAN EN OTRO LUGAR DEL MÓDULO:
  // ELIMINAR:
  import { FacebookPublishingConfig, FacebookPublishingConfigSchema } from './schemas/facebook-publishing-config.schema';
  import { TwitterPublishingConfig, TwitterPublishingConfigSchema } from './schemas/twitter-publishing-config.schema';
  ```

- [ ] **2.3.3** Remover de `MongooseModule.forFeature()` (OPCIONAL)
  ```typescript
  // SI NO SE USAN EN OTRO LUGAR DEL MÓDULO:
  // ELIMINAR de la lista de schemas:
  { name: FacebookPublishingConfig.name, schema: FacebookPublishingConfigSchema },
  { name: TwitterPublishingConfig.name, schema: TwitterPublishingConfigSchema },
  ```

- [ ] **2.3.4** Verificar que módulo compile sin errores
  ```bash
  npm run build
  ```

##### 📋 Entregables Tarea 2.3

✅ Providers verificados
✅ Imports innecesarios removidos (opcional)
✅ Schemas innecesarios removidos de forFeature (opcional)
✅ Módulo compilando sin errores

---

#### 📋 Entregables FASE 2

✅ `FacebookPost` schema actualizado
✅ `TwitterPost` schema actualizado
✅ `GeneratorProModule` limpio
✅ Sin errores de compilación
✅ Schemas con campos deprecados documentados

---

### 🧪 FASE 3: TESTING Y VALIDACIÓN (EJECUTADO POR COYOTITO)

**Objetivo:** Lista de pruebas para validar que el sistema funciona end-to-end con el nuevo flujo.

**Responsable:** Coyotito (Jarvis NO ejecuta tests ni levanta servidores)

**Duración Estimada:** Variable (según disponibilidad de Coyotito)

#### ✅ Checklist FASE 3 - PRUEBAS A REALIZAR

**NOTA IMPORTANTE:** Esta fase la ejecuta Coyotito. Jarvis solo entrega el código modificado.

- [ ] **3.1** Compilar proyecto sin errores
  ```bash
  npm run build
  ```

- [ ] **3.2** Iniciar servidor en modo desarrollo
  ```bash
  npm run start:dev
  ```

- [ ] **3.3** Verificar logs de inicio sin errores
  ```
  ✅ [FacebookPublishingService] initialized
  ✅ [TwitterPublishingService] initialized
  ✅ [SocialMediaPublishingService] initialized
  ✅ [PublishService] initialized
  ```

- [ ] **3.4** Verificar estado del sitio en MongoDB
  ```javascript
  db.sites.findOne({ slug: "noticiaspachuca" }, {
    "socialMedia.facebookPages": 1,
    "socialMedia.twitterAccounts": 1
  })
  // Debe mostrar las páginas/cuentas configuradas
  ```

- [ ] **3.5** Publicar una noticia de prueba con redes sociales
  ```bash
  # Desde app móvil o Postman:
  POST /pachuca-noticias/noticias
  {
    "contentId": "<ID_DE_CONTENIDO_GENERADO>",
    "publishToSocialMedia": true,
    "socialMediaPlatforms": ["facebook", "twitter"],
    "optimizeSocialContent": true
  }
  ```

- [ ] **3.6** Verificar logs durante publicación
  ```
  ✅ [PublishService] 📱 Publicando en redes sociales: <slug>
  ✅ [SocialMediaPublishingService] 📱 Publishing noticia <id> to 1 sites
  ✅ [SocialMediaPublishingService] 📘 Publishing to Facebook for site: Noticias Pachuca
  ✅ [SocialMediaPublishingService] 📘 Found 1 active Facebook pages
  ✅ [FacebookPublishingService] 📱 Publishing post to Facebook: <id>
  ✅ [SocialMediaPublishingService] 🐦 Publishing to Twitter for site: Noticias Pachuca
  ✅ [SocialMediaPublishingService] 🐦 Found 1 active Twitter accounts
  ✅ [TwitterPublishingService] 🐦 Publishing tweet to Twitter: <id>
  ✅ [SocialMediaPublishingService] ✅ Social media publishing completed: 2/2 successful
  ```

- [ ] **3.7** Verificar posts creados en MongoDB
  ```javascript
  // Facebook
  db.facebookposts.find({ publishedNoticiaId: ObjectId("<ID>") }).pretty()
  // Debe tener: pageId, pageName, status: "published"

  // Twitter
  db.twitterposts.find({ publishedNoticiaId: ObjectId("<ID>") }).pretty()
  // Debe tener: accountId, username, status: "published"
  ```

- [ ] **3.8** Verificar publicación en GetLate.dev
  ```bash
  # Ir a dashboard de GetLate
  # Verificar que los posts aparezcan como scheduled/published
  ```

- [ ] **3.9** Verificar publicación real en Facebook/Twitter
  ```bash
  # Ir a la página de Facebook
  # Verificar que el post esté publicado

  # Ir al perfil de Twitter
  # Verificar que el tweet esté publicado
  ```

- [ ] **3.10** Probar con múltiples sitios (si aplica)
  ```bash
  # Publicar noticia en 2+ sitios diferentes
  # Verificar que se publique en todas las páginas/cuentas configuradas
  ```

- [ ] **3.11** Probar caso: sitio sin redes sociales configuradas
  ```bash
  # Crear sitio sin socialMedia
  # Intentar publicar noticia
  # Verificar logs: "No active Facebook pages found"
  # NO debe fallar, solo no publicar en redes
  ```

- [ ] **3.12** Probar caso: error en GetLate API
  ```bash
  # Simular error (API key inválida temporal)
  # Verificar que el error se capture correctamente
  # Verificar que la noticia se publique en BD pero con status failed en redes
  ```

#### 📋 Entregables FASE 3

**Responsable de validación:** Coyotito

✅ Compilación exitosa (verificada por Coyotito)
✅ Servidor iniciando sin errores (verificado por Coyotito)
✅ Publicación en Facebook funcionando (verificada por Coyotito)
✅ Publicación en Twitter funcionando (verificada por Coyotito)
✅ Posts guardados en MongoDB con nuevos campos (verificado por Coyotito)
✅ Publicaciones visibles en GetLate/Facebook/Twitter (verificado por Coyotito)
✅ Casos edge manejados correctamente (verificados por Coyotito)
✅ Logs informativos y claros (verificados por Coyotito)

---

### ⚪ FASE 4: LIMPIEZA Y DEPRECACIÓN (OPCIONAL)

**Objetivo:** Limpiar código legacy que ya no se usa.

**Duración Estimada:** 1 hora

**NOTA:** Esta fase es OPCIONAL y puede hacerse en un PR separado futuro.

#### ✅ Checklist FASE 4

- [ ] **4.1** Deprecar schemas de configs

  **Opción A: Agregar comentarios de deprecación**
  ```typescript
  // En facebook-publishing-config.schema.ts y twitter-publishing-config.schema.ts
  /**
   * @deprecated Este schema ya no se usa en el sistema actual.
   * La configuración de redes sociales se maneja directamente en Site.socialMedia
   * Se mantiene por compatibilidad histórica pero puede ser eliminado en futuras versiones.
   *
   * Fecha de deprecación: 18 de Octubre de 2025
   * PR: #XXX
   */
  ```

  **Opción B: Eliminar archivos**
  ```bash
  # SOLO si no hay referencias en ningún lugar
  rm facebook-publishing-config.schema.ts
  rm twitter-publishing-config.schema.ts
  ```

- [ ] **4.2** Deprecar controllers de configs

  **Archivo:** `twitter-publishing.controller.ts`

  **Opción A: Agregar decorador @Deprecated**
  ```typescript
  @Controller('generator-pro/twitter-config')
  @ApiTags('Twitter Publishing')
  @ApiDeprecated() // ← Agregar
  export class TwitterPublishingController {
    // ...
  }
  ```

  **Opción B: Eliminar controller**
  ```bash
  rm twitter-publishing.controller.ts
  # Y removerlo de generator-pro.module.ts
  ```

- [ ] **4.3** Limpiar endpoints de configs en GeneratorProController

  **Archivo:** `generator-pro.controller.ts`

  **Eliminar endpoints (líneas 809-880):**
  ```typescript
  // ELIMINAR:
  @Post('facebook-configs')
  async createFacebookConfig(...) { ... }

  @Get('facebook-configs')
  async getFacebookConfigs(...) { ... }

  @Get('facebook-configs/:id')
  async getFacebookConfig(...) { ... }

  @Patch('facebook-configs/:id')
  async updateFacebookConfig(...) { ... }

  @Delete('facebook-configs/:id')
  async deleteFacebookConfig(...) { ... }
  ```

- [ ] **4.4** Actualizar documentación de API
  ```bash
  # Regenerar Swagger docs
  npm run build
  # Verificar que endpoints deprecados tengan badge
  ```

- [ ] **4.5** Crear migration script para limpiar colecciones vacías (OPCIONAL)
  ```javascript
  // scripts/cleanup-legacy-collections.ts
  import { MongoClient } from 'mongodb';

  async function cleanup() {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();

    // Verificar que estén vacías
    const fbCount = await db.collection('facebookpublishingconfigs').count();
    const twCount = await db.collection('twitterpublishingconfigs').count();

    if (fbCount === 0 && twCount === 0) {
      // Eliminar colecciones
      await db.collection('facebookpublishingconfigs').drop();
      await db.collection('twitterpublishingconfigs').drop();
      console.log('✅ Colecciones legacy eliminadas');
    } else {
      console.log('⚠️ Colecciones no vacías, no se eliminaron');
    }

    await client.close();
  }
  ```

- [ ] **4.6** Actualizar CHANGELOG.md
  ```markdown
  ## [Unreleased]

  ### Changed
  - Sistema de publicación en redes sociales refactorizado para usar `Site.socialMedia`

  ### Deprecated
  - `FacebookPublishingConfig` schema (usar `Site.socialMedia.facebookPages`)
  - `TwitterPublishingConfig` schema (usar `Site.socialMedia.twitterAccounts`)
  - Endpoints `/generator-pro/facebook-configs/*`
  - Endpoints `/generator-pro/twitter-config/*`

  ### Fixed
  - Publicación en Facebook/Twitter ahora funciona correctamente (#XXX)
  ```

#### 📋 Entregables FASE 4

✅ Schemas deprecados o eliminados
✅ Controllers deprecados o eliminados
✅ Endpoints legacy removidos
✅ Documentación actualizada
✅ CHANGELOG actualizado

---

## 📖 RESUMEN EJECUTIVO

### 🎯 Objetivo del Plan

Corregir el sistema de publicación en redes sociales para que use la configuración existente en `Site.socialMedia` en lugar de buscar en colecciones inexistentes.

---

### 📊 Distribución de Trabajo por Fase

```
FASE 0: Preparación (Jarvis)       [████░░░░░░] 12%  (1 hora)
FASE 1: Core Services (Jarvis)     [████████░░] 50%  (3-4 horas)
FASE 2: Schemas y Models (Jarvis)  [█████░░░░░] 30%  (2-3 horas)
FASE 3: Testing (COYOTITO)         [░░░░░░░░░░]  -   (Variable - Coyotito)
FASE 4: Limpieza (Jarvis OPCIONAL) [██░░░░░░░░]  8%  (1 hora)
                                   ─────────────────
                          TOTAL JARVIS: 7-9 horas
                       TOTAL COYOTITO: Variable (testing manual)
```

---

### 📁 Archivos Modificados por Fase

#### FASE 0: PREPARACIÓN
```
✅ Git branch
✅ Backups de archivos críticos
```

#### FASE 1: CORE SERVICES (3 archivos, ~440 líneas)
```
🔴 social-media-publishing.service.ts    (~195 líneas modificadas)
   ├─ publishToFacebook()                (Reescritura completa)
   ├─ publishToTwitter()                 (Reescritura completa)
   └─ Remover imports de configs

🔴 facebook-publishing.service.ts        (~126 líneas modificadas)
   ├─ publishPost() signature            (Agregar parámetros)
   ├─ Remover búsqueda de config
   └─ Usar pageId directamente

🔴 twitter-publishing.service.ts         (~118 líneas modificadas)
   ├─ publishTweet() signature           (Agregar parámetros)
   ├─ Remover búsqueda de config
   └─ Usar accountId directamente
```

#### FASE 2: SCHEMAS Y MODELS (3 archivos, ~10 líneas)
```
🟡 facebook-post.schema.ts               (~6 líneas modificadas)
   ├─ facebookConfigId → opcional
   ├─ Agregar: pageId, pageName
   └─ Actualizar índices

🟡 twitter-post.schema.ts                (~6 líneas modificadas)
   ├─ twitterConfigId → opcional
   ├─ Agregar: accountId, username
   └─ Actualizar índices

🟡 generator-pro.module.ts               (~2-4 líneas removidas)
   └─ Limpiar imports/providers (opcional)
```

#### FASE 3: TESTING (EJECUTADO POR COYOTITO)
```
📋 Lista de 12 casos de prueba documentados
📋 Guía de validación end-to-end
📋 Checklist de verificación en GetLate/Facebook/Twitter

⚠️ NOTA: Esta fase la ejecuta Coyotito, no Jarvis
⚠️ Jarvis solo entrega el código listo para probar
```

#### FASE 4: LIMPIEZA (OPCIONAL)
```
⚪ facebook-publishing-config.schema.ts  (Deprecar/Eliminar)
⚪ twitter-publishing-config.schema.ts   (Deprecar/Eliminar)
⚪ twitter-publishing.controller.ts      (Deprecar/Eliminar)
⚪ generator-pro.controller.ts           (Eliminar endpoints)
⚪ CHANGELOG.md                           (Actualizar)
```

---

### 🎨 Cambios Arquitectónicos Clave

#### ANTES (Arquitectura Incorrecta)
```
PublishService
   └─> SocialMediaPublishingService
        ├─> facebookConfigModel.find() ❌ COLECCIÓN VACÍA
        │    └─> FacebookPublishingService
        │
        └─> twitterConfigModel.find() ❌ COLECCIÓN VACÍA
             └─> TwitterPublishingService

RESULTADO: 0/0 successful (NADA FUNCIONA)
```

#### DESPUÉS (Arquitectura Correcta)
```
PublishService
   └─> SocialMediaPublishingService
        ├─> site.socialMedia.facebookPages[] ✅ DATOS EXISTEN
        │    └─> FacebookPublishingService.publishPost(post, pageId, apiKey)
        │         └─> GetLate API ✅
        │
        └─> site.socialMedia.twitterAccounts[] ✅ DATOS EXISTEN
             └─> TwitterPublishingService.publishTweet(tweet, accountId, apiKey)
                  └─> GetLate API ✅

RESULTADO: N/N successful (TODO FUNCIONA)
```

---

### ⚡ Cambios Técnicos Principales

#### 1. **SocialMediaPublishingService** (El más crítico)

**Cambio Principal:**
```typescript
// ANTES ❌
const configs = await this.facebookConfigModel.find({ siteId, isActive: true });

// DESPUÉS ✅
const pages = site.socialMedia?.facebookPages?.filter(page => page.isActive) || [];
```

**Impacto:**
- Elimina dependencia de colecciones inexistentes
- Usa datos que YA ESTÁN en el documento de Site
- Simplifica lógica (no más queries a MongoDB)

---

#### 2. **FacebookPublishingService / TwitterPublishingService**

**Cambio Principal:**
```typescript
// ANTES ❌
async publishPost(post: FacebookPostDocument): Promise<PublishResult> {
  const config = await this.facebookConfigModel.findById(post.facebookConfigId);
  // ... usa config
}

// DESPUÉS ✅
async publishPost(
  post: FacebookPostDocument,
  pageId: string,
  getLateApiKey?: string
): Promise<PublishResult> {
  // ... usa pageId directamente
}
```

**Impacto:**
- Servicios se vuelven stateless (no dependen de DB)
- Reciben todos los datos como parámetros
- Más fácil de testear

---

#### 3. **Schemas de Post**

**Cambio Principal:**
```typescript
// ANTES ❌
@Prop({ required: true, type: Types.ObjectId, ref: 'FacebookPublishingConfig' })
facebookConfigId: Types.ObjectId;

// DESPUÉS ✅
@Prop({ required: false, type: Types.ObjectId })
facebookConfigId?: Types.ObjectId; // Deprecado

@Prop({ type: String })
pageId?: string; // Nuevo: ID desde GetLate
```

**Impacto:**
- Mantiene compatibilidad con posts antiguos
- Agrega campos necesarios para nuevo flujo
- Documenta deprecación

---

### 🔐 Reglas de Implementación

#### ✅ LO QUE SE DEBE HACER

1. **Sin `any` types**
   - Todos los tipos deben estar explícitos
   - Usar interfaces/types definidos

2. **Sin `forwardRef()`**
   - Reorganizar imports para evitar dependencias circulares
   - Si es necesario, refactorizar arquitectura

3. **Sin atajos**
   - No usar `@ts-ignore` o `as any`
   - Solucionar problemas de tipos correctamente

4. **Documentación completa**
   - Cada cambio debe tener comentario explicativo
   - Métodos deprecados con `@deprecated` tag

5. **Testing obligatorio (ejecutado por Coyotito)**
   - FASE 3 no se puede saltear
   - Jarvis entrega lista completa de casos de prueba
   - Coyotito ejecuta y verifica TODOS los casos

#### ❌ LO QUE NO SE DEBE HACER

1. **NO crear nuevas colecciones**
   - Ya existe `Site.socialMedia`
   - No duplicar datos

2. **NO romper compatibilidad**
   - Mantener campos antiguos como opcionales
   - Migración gradual, no abrupta

3. **NO hardcodear valores**
   - Usar configuración desde `Site.socialMedia`
   - GetLate API key desde site o config

4. **NO eliminar logs existentes**
   - Mantener trazabilidad
   - Agregar logs informativos nuevos

---

### 📈 Criterios de Éxito

#### ✅ Criterios Técnicos (Jarvis)

- [ ] Compilación sin errores de TypeScript
- [ ] Sin warnings de tipos `any` o `@ts-ignore`
- [ ] Código listo para probar (compila sin errores)
- [ ] Logs claros e informativos

#### ✅ Criterios Funcionales (Validados por Coyotito en FASE 3)

- [ ] Todos los tests de FASE 3 pasando
- [ ] Publicación en Facebook funciona
- [ ] Publicación en Twitter funciona
- [ ] Posts se guardan en MongoDB con campos correctos
- [ ] Posts aparecen en GetLate dashboard
- [ ] Posts se publican en Facebook/Twitter real

#### ✅ Criterios de Calidad

- [ ] Código sin duplicación
- [ ] Métodos con responsabilidad única
- [ ] Interfaces bien definidas
- [ ] Documentación actualizada

---

### 🚀 Siguiente Paso

**Comenzar con FASE 0: Preparación**

1. Crear branch: `fix/social-media-publications-system`
2. Crear backups de archivos críticos
3. Verificar estado actual en MongoDB
4. Confirmar GetLate API key funcional

**Después proceder a FASE 1 → FASE 2 → FASE 3 → (Opcional) FASE 4**

---

### 📞 Puntos de Validación

Después de cada FASE, validar con Coyotito:

- ✅ **FASE 0 (Jarvis):** ¿Branch creado? ¿Backups listos?
- ✅ **FASE 1 (Jarvis):** ¿Services refactorizados? ¿Compila sin errores?
- ✅ **FASE 2 (Jarvis):** ¿Schemas actualizados? ¿Sin breaking changes?
- ⚠️ **FASE 3 (COYOTITO):** ¿Todos los tests pasaron? ¿Publicaciones funcionan? ← **Ejecutado por Coyotito**
- ✅ **FASE 4 (Jarvis OPCIONAL):** ¿Limpieza completada? ¿Documentación actualizada?

**IMPORTANTE:** Jarvis NO ejecuta tests ni levanta servidores. FASE 3 es responsabilidad de Coyotito.

---

**FIN DEL DOCUMENTO**
