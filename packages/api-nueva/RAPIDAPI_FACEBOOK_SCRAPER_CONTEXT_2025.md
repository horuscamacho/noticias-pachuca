# 🚀 RAPIDAPI FACEBOOK SCRAPER MODULE - CONTEXTO 2025

## 📋 OVERVIEW
Módulo para extracción de datos públicos de Facebook usando APIs de terceros (RapidAPI), diseñado para ser **escalable y configurable** sin depender de variables de entorno fijas.

## 🎯 OBJETIVOS PRINCIPALES

### ✅ Funcionalidades Core
1. **Gestión de Páginas**: CRUD completo de páginas de Facebook monitoreadas
2. **Extracción de Posts**: Obtener posts públicos bajo demanda o programados
3. **Configuración Dinámica**: APIs configurables desde UI (no env vars)
4. **Logging Completo**: Registrar todas las respuestas para mapeo posterior
5. **Escalabilidad**: Fácil cambio entre proveedores de APIs

### ❌ Exclusiones (vs módulo Facebook original)
- ❌ Sin publicación de posts
- ❌ Sin webhooks
- ❌ Sin Graph API de Facebook
- ❌ Sin business verification requerida

## 🏗️ ARQUITECTURA DEL MÓDULO

### 📁 Estructura de Directorios
```
src/rapidapi-facebook/
├── controllers/
│   ├── rapidapi-facebook-pages.controller.ts
│   ├── rapidapi-facebook-posts.controller.ts
│   └── rapidapi-facebook-config.controller.ts
├── services/
│   ├── rapidapi-facebook.service.ts
│   ├── rapidapi-page-management.service.ts
│   ├── rapidapi-post-extraction.service.ts
│   └── rapidapi-config.service.ts
├── schemas/
│   ├── rapidapi-facebook-page.schema.ts
│   ├── rapidapi-facebook-post.schema.ts
│   ├── rapidapi-extraction-log.schema.ts
│   └── rapidapi-api-config.schema.ts
├── dto/
│   ├── rapidapi-page-management.dto.ts
│   ├── rapidapi-post-extraction.dto.ts
│   └── rapidapi-config.dto.ts
├── interfaces/
│   └── rapidapi-facebook.interfaces.ts
└── rapidapi-facebook.module.ts
```

## 🗄️ DISEÑO DE BASE DE DATOS

### 1. **RapidAPIConfig** (Configuraciones de APIs)
```typescript
{
  _id: ObjectId,
  name: string,                    // "Facebook Scraper 3"
  provider: string,                // "rapidapi"
  host: string,                    // "facebook-scraper3.p.rapidapi.com"
  apiKey: string,                  // "1c2783bfb6msh69f13f0ff956d42p1be769jsn56ace9497881"
  baseUrl: string,                 // "https://facebook-scraper3.p.rapidapi.com"
  isActive: boolean,               // true/false
  endpoints: {
    getPageId: string,             // "/page/page_id"
    getPageDetails: string,        // "/page/details"
    getPagePosts: string           // "/page/posts"
  },
  rateLimit: {
    requestsPerMinute: number,     // 60
    requestsPerDay: number         // 1000
  },
  pricing: {
    plan: string,                  // "free", "basic", "pro"
    monthlyQuota: number           // 100, 1000, 10000
  },
  metadata: {
    description: string,
    documentation: string,
    supportedFeatures: string[]
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 2. **RapidAPIFacebookPage** (Páginas monitoreadas)
```typescript
{
  _id: ObjectId,
  pageId: string,                  // "100064860875397"
  pageName: string,                // "Facebook Official"
  pageUrl: string,                 // "https://www.facebook.com/facebook"
  configId: ObjectId,              // Referencia a RapidAPIConfig

  // Datos extraídos de la API
  pageDetails: {
    name: string,
    category: string,
    followers: number,
    likes: number,
    about: string,
    website: string,
    location: string,
    verified: boolean,
    profilePicture: string,
    coverPhoto: string,
    // Otros campos dinámicos
    rawData: Object                // JSON completo de la respuesta
  },

  // Control de extracción
  extractionConfig: {
    isActive: boolean,
    frequency: 'manual' | 'daily' | 'weekly',
    lastExtraction: Date,
    nextScheduledExtraction: Date,
    maxPostsPerExtraction: number,
    extractionFilters: {
      startDate: Date,
      endDate: Date,
      includeComments: boolean,
      includeReactions: boolean
    }
  },

  // Estadísticas
  stats: {
    totalPostsExtracted: number,
    lastSuccessfulExtraction: Date,
    extractionErrors: number,
    avgPostsPerDay: number
  },

  createdAt: Date,
  updatedAt: Date
}
```

### 3. **RapidAPIFacebookPost** (Posts extraídos)
```typescript
{
  _id: ObjectId,
  pageId: ObjectId,                // Referencia a RapidAPIFacebookPage

  // Identificadores
  facebookPostId: string,          // ID único del post en Facebook
  postUrl: string,                 // URL directa al post

  // Contenido del post
  content: {
    text: string,
    type: 'text' | 'photo' | 'video' | 'link' | 'event',
    images: string[],
    videos: string[],
    links: string[],
    hashtags: string[],
    mentions: string[]
  },

  // Metadata temporal
  publishedAt: Date,
  extractedAt: Date,

  // Métricas de engagement
  engagement: {
    likes: number,
    comments: number,
    shares: number,
    reactions: {
      love: number,
      wow: number,
      haha: number,
      sad: number,
      angry: number
    }
  },

  // Comentarios (si se extraen)
  comments: [{
    commentId: string,
    text: string,
    author: string,
    publishedAt: Date,
    likes: number,
    replies: number
  }],

  // Control de calidad
  processingStatus: 'raw' | 'processed' | 'error',
  rawData: Object,                 // JSON completo de la respuesta API

  createdAt: Date,
  updatedAt: Date
}
```

### 4. **RapidAPIExtractionLog** (Logs de extracciones)
```typescript
{
  _id: ObjectId,
  pageId: ObjectId,
  configId: ObjectId,

  // Detalles de la llamada
  endpoint: string,                // "/page/posts"
  requestParams: Object,           // { page_id: "123", cursor: "abc" }

  // Resultado
  status: 'success' | 'error' | 'partial',
  httpStatusCode: number,
  responseTime: number,            // ms

  // Datos
  itemsExtracted: number,
  totalApiCreditsUsed: number,

  // Raw response para debugging
  rawRequest: Object,
  rawResponse: Object,

  // Errores
  error: {
    message: string,
    code: string,
    details: Object
  },

  createdAt: Date
}
```

## 🔗 ENDPOINTS DE RAPIDAPI (Actuales)

### Facebook Scraper 3 (facebook-scraper3.p.rapidapi.com)

#### 1. Obtener Page ID
```bash
GET /page/page_id?url=https%3A%2F%2Ffacebook.com%2Ffacebook
Headers:
  x-rapidapi-host: facebook-scraper3.p.rapidapi.com
  x-rapidapi-key: 1c2783bfb6msh69f13f0ff956d42p1be769jsn56ace9497881
```

#### 2. Obtener Detalles de Página
```bash
GET /page/details?url=https%3A%2F%2Fwww.facebook.com%2Ffacebook
Headers:
  x-rapidapi-host: facebook-scraper3.p.rapidapi.com
  x-rapidapi-key: 1c2783bfb6msh69f13f0ff956d42p1be769jsn56ace9497881
```

#### 3. Obtener Posts de Página
```bash
GET /page/posts?page_id=100064860875397&cursor=optional&start_date=yyyy-mm-dd&end_date=yyyy-mm-dd
Headers:
  x-rapidapi-host: facebook-scraper3.p.rapidapi.com
  x-rapidapi-key: 1c2783bfb6msh69f13f0ff956d42p1be769jsn56ace9497881
```

## 🎯 FLUJO DE TRABAJO

### 1. **Configuración Inicial**
1. Admin crea configuración de API en `/rapidapi-facebook/config`
2. Sistema valida conectividad con la API
3. Configuración queda activa y disponible

### 2. **Agregar Página para Monitoreo**
1. Usuario ingresa URL de Facebook: `https://www.facebook.com/PachucaBrilla`
2. Sistema llama a `/page/page_id` para obtener Page ID
3. Sistema llama a `/page/details` para obtener información completa
4. Se guarda página en BD con configuración seleccionada
5. Se programa primera extracción (opcional)

### 3. **Extracción de Posts**
1. Usuario/Sistema dispara extracción manual o programada
2. Sistema llama a `/page/posts` con filtros específicos
3. Posts se procesan y guardan en BD
4. Se registra log completo de la operación
5. Stats de la página se actualizan

### 4. **Cambio de API Provider**
1. Admin crea nueva configuración (ej: Facebook Scraper 4)
2. Se mapean endpoints equivalentes
3. Páginas existentes pueden cambiar de configuración
4. Sistema mantiene historial de extracciones por configuración

## 🚀 ESCALABILIDAD FUTURA

### Soporte Multi-Provider
```typescript
// Interfaz genérica para cualquier provider
interface SocialMediaScraperProvider {
  getPageId(url: string): Promise<string>;
  getPageDetails(identifier: string): Promise<PageDetails>;
  getPagePosts(identifier: string, options: PostOptions): Promise<Post[]>;
}

// Implementaciones específicas
class RapidAPIFacebookProvider implements SocialMediaScraperProvider
class ApifyProvider implements SocialMediaScraperProvider
class BrightDataProvider implements SocialMediaScraperProvider
```

### Mapeo de Respuestas Dinámico
```typescript
// Configuración de mapeo por provider
interface ResponseMapping {
  pageDetails: {
    name: string,           // "data.name" | "response.page_name"
    followers: string,      // "data.followers" | "response.follower_count"
    // ... más campos
  }
}
```

## 📊 MÉTRICAS Y MONITOREO

### Dashboard de APIs
- Requests consumidos por día/mes
- Rate limits por configuración
- Costos por provider
- Uptime y errores por API
- Comparativa de calidad de datos

### Alertas
- Cuota mensual cerca del límite
- API provider caído
- Errores de extracción consecutivos
- Cambios significativos en formato de respuesta

## 🔐 SEGURIDAD

### API Keys
- Encriptación de API keys en BD
- Rotación programada de keys
- Logs de acceso a configuraciones
- Permisos por usuario para gestión de APIs

### Rate Limiting
- Control automático de rate limits por provider
- Queue de requests para evitar bloqueos
- Backoff automático en caso de errores

## 🎯 BENEFICIOS DE ESTA ARQUITECTURA

1. **✅ Flexibilidad**: Cambiar APIs sin downtime
2. **✅ Escalabilidad**: Agregar nuevos providers fácilmente
3. **✅ Observabilidad**: Logs completos para debugging
4. **✅ Costo-efectivo**: Optimizar uso de quotas
5. **✅ Mantenibilidad**: Configuración visual, no código
6. **✅ Resiliencia**: Fallback entre providers
7. **✅ Auditoría**: Trazabilidad completa de extracciones

---

## 📝 NOTAS DE IMPLEMENTACIÓN

### Prioridades de Desarrollo
1. **MVP**: CRUD básico con una sola configuración
2. **V1**: Multi-configuración y logs completos
3. **V2**: Dashboard de métricas y alertas
4. **V3**: Multi-provider y mapeo dinámico

### Consideraciones Técnicas
- Usar DTOs flexibles para diferentes formatos de respuesta
- Implementar retry logic con backoff exponencial
- Cache inteligente para evitar re-extracciones innecesarias
- Validación de schemas de respuesta para detectar cambios en APIs

---

**Documento creado**: 2025-01-20
**Autor**: Jarvis AI Assistant
**Versión**: 1.0
**Estado**: Listo para implementación