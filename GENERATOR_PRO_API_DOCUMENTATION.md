# Generator Pro - Documentación Completa del Backend API

> Backend NestJS ubicado en: `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/api-nueva`
>
> Base URL: `http://localhost:3000/api`

---

## 1. ENDPOINT DE NEWS WEBSITE CONFIGS

### 1.1 Obtener Lista de Outlets (Websites)

**Endpoint:** `GET /generator-pro/websites`

**Autenticación:** Bearer Token JWT (header `Authorization: Bearer {token}`)

**Query Parameters:**
- `active` (boolean, opcional): Filtrar por estado activo/inactivo
- `limit` (number, default: 50): Límite de resultados por página
- `page` (number, default: 1): Número de página

**Response Structure:**
```typescript
{
  websites: WebsiteConfigResponseDto[];
  total: number;
  page: number;
  limit: number;
}
```

**WebsiteConfigResponseDto:**
```typescript
{
  id: string;                          // ObjectId del sitio
  name: string;                        // "El Universal", "Milenio", etc.
  baseUrl: string;                     // "https://www.eluniversal.com.mx"
  listingUrl: string;                  // URL donde están listadas las noticias
  testUrl?: string;                    // URL de prueba para selectores
  isActive: boolean;                   // Estado activo/inactivo
  extractionFrequency: number;         // Frecuencia en minutos (ej: 60)
  contentGenerationFrequency: number;  // Frecuencia en minutos (ej: 120)
  publishingFrequency: number;         // Frecuencia en minutos (ej: 30)

  // Selectores CSS para extracción de listado
  listingSelectors?: {
    articleLinks: string;              // Selector para links de noticias
    titleSelector?: string;
    imageSelector?: string;
    dateSelector?: string;
    categorySelector?: string;
  };

  // Selectores CSS para contenido individual
  contentSelectors?: {
    titleSelector: string;
    contentSelector: string;
    imageSelector?: string;
    dateSelector?: string;
    authorSelector?: string;
    categorySelector?: string;
    tagsSelector?: string;
  };

  // Configuración de extracción
  extractionSettings?: {
    maxUrlsPerExtraction?: number;
    duplicateFilter?: boolean;
    contentFilters?: {
      minContentLength?: number;
      excludeKeywords?: string[];
      requiredKeywords?: string[];
    };
  };

  // Timestamps de última ejecución
  lastExtractionRun?: Date;
  lastGenerationRun?: Date;
  lastPublishingRun?: Date;

  // Estadísticas
  statistics?: {
    totalUrlsExtracted?: number;
    totalContentGenerated?: number;
    totalPublished?: number;
    successfulExtractions?: number;
    failedExtractions?: number;
    lastExtractionAt?: Date;
  };

  createdAt: Date;
  updatedAt: Date;
}
```

**Ejemplo de Request:**
```bash
GET http://localhost:3000/api/generator-pro/websites?active=true&limit=10&page=1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 1.2 Crear Nuevo Website Config

**Endpoint:** `POST /generator-pro/websites`

**Autenticación:** Bearer Token JWT

**Request Body (CreateWebsiteConfigDto):**
```typescript
{
  name: string;                    // Requerido
  baseUrl: string;                 // Requerido
  listingUrl: string;              // Requerido
  testUrl?: string;
  listingSelectors: {              // Requerido
    articleLinks: string;
    titleSelector?: string;
    imageSelector?: string;
    dateSelector?: string;
    categorySelector?: string;
  };
  contentSelectors: {              // Requerido
    titleSelector: string;
    contentSelector: string;
    imageSelector?: string;
    dateSelector?: string;
    authorSelector?: string;
    categorySelector?: string;
    tagsSelector?: string;
  };
  extractionSettings?: {
    useJavaScript?: boolean;
    waitTime?: number;
    rateLimit?: number;
    timeout?: number;
    retryAttempts?: number;
    respectRobots?: boolean;
    maxUrlsPerRun?: number;
    duplicateFilter?: boolean;
  };
  customHeaders?: Record<string, string>;
  defaultTemplateId?: string;      // ObjectId del template
  contentSettings?: {
    generateOnExtraction?: boolean;
    requireApproval?: boolean;
    maxContentPerDay?: number;
    categoryMapping?: Record<string, string>;
  };
  notes?: string;
  isActive?: boolean;              // Default: true
  extractionFrequency?: number;    // Default: 60 minutos
  generationFrequency?: number;    // Default: 120 minutos
  publishingFrequency?: number;    // Default: 30 minutos
}
```

**Response:**
```typescript
{
  website: WebsiteConfigResponseDto;
  message: string;
}
```

---

### 1.3 Actualizar Website Config

**Endpoint:** `PUT /generator-pro/websites/:id`

**Autenticación:** Bearer Token JWT

**Path Params:**
- `id`: ObjectId del website config

**Request Body:** Same as CreateWebsiteConfigDto (todos los campos opcionales)

**Response:**
```typescript
{
  website: WebsiteConfigResponseDto;
  message: string;
}
```

---

### 1.4 Eliminar Website Config

**Endpoint:** `DELETE /generator-pro/websites/:id`

**Autenticación:** Bearer Token JWT

**Path Params:**
- `id`: ObjectId del website config

**Response:**
```typescript
{
  message: string;
}
```

**Nota:** Pausará el sitio antes de eliminarlo y eliminará todas las configuraciones de Facebook asociadas.

---

## 2. ESTRUCTURA COMPLETA DE LA TABLA/SCHEMA

**MongoDB Collection:** `newswebsiteconfigs`

**Archivo Schema:** `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/api-nueva/src/generator-pro/schemas/news-website-config.schema.ts`

**Campos Completos:**

```typescript
{
  // IDENTIFICACIÓN
  _id: ObjectId;
  name: string;                      // Unique, required
  baseUrl: string;                   // Required
  listingUrl: string;                // Required
  testUrl?: string;

  // ESTADO
  isActive: boolean;                 // Default: true

  // SELECTORES PARA LISTADO
  listingSelectors: {
    articleLinks: string;            // Required - CSS selector para links
    titleSelector?: string;
    imageSelector?: string;
    dateSelector?: string;
    categorySelector?: string;
  };

  // SELECTORES PARA CONTENIDO
  contentSelectors: {
    titleSelector: string;           // Required
    contentSelector: string;         // Required
    imageSelector?: string;
    dateSelector?: string;
    authorSelector?: string;
    categorySelector?: string;
    excerptSelector?: string;
    tagsSelector?: string;
  };

  // FRECUENCIAS (en minutos)
  extractionFrequency: number;       // Default: 60
  contentGenerationFrequency: number; // Default: 120
  publishingFrequency: number;       // Default: 30

  // CONFIGURACIÓN TÉCNICA
  extractionSettings: {
    useJavaScript?: boolean;         // Usar Puppeteer si requiere JS
    waitTime?: number;               // ms
    rateLimit?: number;              // requests por minuto
    timeout?: number;                // ms
    retryAttempts?: number;
    respectRobots?: boolean;
    maxUrlsPerRun?: number;
    duplicateFilter?: boolean;
  };

  customHeaders: Record<string, string>; // Headers HTTP personalizados

  // INTEGRACIÓN CONTENT-AI
  defaultTemplateId?: ObjectId;      // Ref: 'PromptTemplate'

  contentSettings: {
    generateOnExtraction?: boolean;
    requireApproval?: boolean;
    maxContentPerDay?: number;
    categoryMapping?: Record<string, string>;
  };

  // CONTROL DE EJECUCIÓN
  lastExtractionRun?: Date;
  lastGenerationRun?: Date;
  lastPublishingRun?: Date;

  // RESULTADOS DE TESTING
  testResults?: {
    lastTested?: Date;
    listingTest?: {
      isWorking?: boolean;
      urlsFound?: number;
      sampleUrls?: string[];
      errorMessage?: string;
    };
    contentTest?: {
      isWorking?: boolean;
      sampleTitle?: string;
      sampleContent?: string;
      sampleImage?: string;
      errorMessage?: string;
    };
  };

  // ESTADÍSTICAS
  statistics: {
    totalUrlsExtracted?: number;
    totalContentGenerated?: number;
    totalPublished?: number;
    successfulExtractions?: number;
    failedExtractions?: number;
    lastExtractionAt?: Date;
    averageExtractionTime?: number;  // ms
    averageGenerationTime?: number;  // ms
  };

  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Índices:**
- `name` (unique)
- `isActive`
- `baseUrl`
- `lastExtractionRun` (desc)
- `lastGenerationRun` (desc)
- `lastPublishingRun` (desc)

**Virtuals:**
- `domain`: Extrae el hostname del baseUrl
- `nextExtractionDue`: Calcula cuándo debe ejecutarse la próxima extracción
- `nextGenerationDue`: Calcula cuándo debe generarse contenido
- `nextPublishingDue`: Calcula cuándo debe publicarse

---

## 3. ENDPOINTS DE ACCIONES

### 3.1 Extraer URLs Manualmente

**Endpoint:** `POST /generator-pro/websites/:id/extract-urls`

**Autenticación:** Bearer Token JWT

**Path Params:**
- `id`: ObjectId del website config

**Descripción:** Ejecuta extracción manual de URLs de noticias desde el listingUrl del sitio.

**Response:**
```typescript
{
  success: boolean;
  extractedUrls: string[];
  totalUrls: number;
  message: string;
}
```

**Archivo Controller:** Línea 1087

---

### 3.2 Extraer Contenido Manualmente

**Endpoint:** `POST /generator-pro/websites/:id/extract-content`

**Autenticación:** Bearer Token JWT

**Path Params:**
- `id`: ObjectId del website config

**Request Body:**
```typescript
{
  urls: string[];  // Array de URLs para extraer contenido
}
```

**Response:**
```typescript
{
  success: boolean;
  extractedContent: Array<{
    url: string;
    title: string;
    content: string;
    images: string[];
    author?: string;
    category?: string;
    publishedAt?: Date;
  }>;
  totalExtracted: number;
  message: string;
}
```

**Archivo Controller:** Línea 1124

---

### 3.3 Extraer URLs y Guardar en BD

**Endpoint:** `POST /generator-pro/websites/:id/extract-urls-and-save`

**Autenticación:** Bearer Token JWT

**Path Params:**
- `id`: ObjectId del website config

**Descripción:** Extrae URLs y las guarda directamente en la colección `extractednoticias` con status 'url_extracted'.

**Response:**
```typescript
{
  success: boolean;
  savedUrls: number;
  message: string;
}
```

**Archivo Controller:** Línea 1266

---

### 3.4 Pausar Outlet

**Endpoint:** `POST /generator-pro/system/control`

**Autenticación:** Bearer Token JWT

**Request Body:**
```typescript
{
  action: "pause";
  websiteId: string;  // Requerido para pause
}
```

**Response:**
```typescript
{
  message: string;
}
```

**Archivo Controller:** Línea 707

---

### 3.5 Reanudar Outlet

**Endpoint:** `POST /generator-pro/system/control`

**Autenticación:** Bearer Token JWT

**Request Body:**
```typescript
{
  action: "resume";
  websiteId: string;  // Requerido para resume
}
```

**Response:**
```typescript
{
  message: string;
}
```

---

### 3.6 Inicializar Sistema Completo

**Endpoint:** `POST /generator-pro/system/control`

**Autenticación:** Bearer Token JWT

**Request Body:**
```typescript
{
  action: "start";
}
```

**Descripción:** Inicia el sistema Generator Pro completo (todos los schedulers y colas).

---

### 3.7 Detener Sistema Completo

**Endpoint:** `POST /generator-pro/system/control`

**Autenticación:** Bearer Token JWT

**Request Body:**
```typescript
{
  action: "stop";
}
```

**Descripción:** Detiene el sistema Generator Pro completo.

---

### 3.8 Cambiar Frecuencias

**Endpoint:** `PUT /generator-pro/websites/:id`

**Autenticación:** Bearer Token JWT

**Request Body:**
```typescript
{
  extractionFrequency?: number;        // Minutos
  contentGenerationFrequency?: number; // Minutos
  publishingFrequency?: number;        // Minutos
}
```

**Ejemplo:**
```json
{
  "extractionFrequency": 30,
  "contentGenerationFrequency": 60,
  "publishingFrequency": 15
}
```

---

### 3.9 Forzar Ejecución de Jobs

**Endpoint:** `POST /generator-pro/websites/:id/force-schedule`

**Autenticación:** Bearer Token JWT

**Path Params:**
- `id`: ObjectId del website config

**Descripción:** Fuerza la ejecución inmediata de todos los jobs programados para un sitio.

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

**Archivo Controller:** Línea 2591

---

## 4. ENDPOINTS DE TESTING Y VALIDACIÓN

### 4.1 Probar Selectores de Listado

**Endpoint:** `POST /generator-pro/websites/test-listing-selectors`

**Autenticación:** Bearer Token JWT

**Request Body:**
```typescript
{
  baseUrl: string;
  listingUrl: string;
  listingSelectors: {
    articleLinks: string;
    titleSelector?: string;
    imageSelector?: string;
    dateSelector?: string;
    categorySelector?: string;
  };
  limit?: number;  // Límite de URLs a extraer en el test
}
```

**Response:**
```typescript
{
  extractedUrls: Array<{
    url: string;
    title?: string;
    image?: string;
  }>;
  totalUrls: number;
  processingTime: number;  // ms
  success: boolean;
  error?: string;
}
```

**Archivo Controller:** Línea 365

---

### 4.2 Probar Selectores de Contenido

**Endpoint:** `POST /generator-pro/websites/test-individual-content`

**Autenticación:** Bearer Token JWT

**Request Body:**
```typescript
{
  testUrl: string;  // URL de una noticia específica
  contentSelectors: {
    titleSelector: string;
    contentSelector: string;
    imageSelector?: string;
    dateSelector?: string;
    authorSelector?: string;
    categorySelector?: string;
    tagsSelector?: string;
  };
}
```

**Response:**
```typescript
{
  extractedContent: {
    url: string;
    title?: string;
    content?: string;
    images?: string[];
    publishedAt?: string;  // ISO date
    author?: string;
    category?: string;
    tags?: string[];
  };
  processingTime: number;  // ms
  success: boolean;
  error?: string;
  details?: string;
}
```

**Archivo Controller:** Línea 394

---

### 4.3 Probar Configuración Existente

**Endpoint:** `POST /generator-pro/websites/:id/test`

**Autenticación:** Bearer Token JWT

**Path Params:**
- `id`: ObjectId del website config

**Descripción:** Ejecuta test completo (listing + content) usando la configuración guardada.

**Response:**
```typescript
{
  testResult: {
    success: boolean;
    listingTest?: {
      urlsFound: number;
      sampleUrls: string[];
      errors?: string[];
    };
    contentTest?: {
      sampleContent: {
        title: string;
        content: string;
        images: string[];
        // ... otros campos
      };
      errors?: string[];
    };
    errorMessage?: string;
    duration?: number;  // ms
  };
  message: string;
}
```

**Archivo Controller:** Línea 487

---

## 5. AUTENTICACIÓN

### 5.1 Tipo de Autenticación

**Método:** JWT Bearer Token

**Guards Utilizados:**
- `JwtAuthGuard` - Aplicado a nivel de controller completo
- Todos los endpoints requieren autenticación

### 5.2 Headers Requeridos

```
Authorization: Bearer {jwt_token}
Content-Type: application/json
X-Platform: web
```

### 5.3 Estructura del Token JWT

El token debe ser válido y contener la información del usuario autenticado. Se obtiene del endpoint de login del sistema de autenticación.

**Endpoint de Login (fuera de Generator Pro):**
```
POST /auth/login
Body: { email, password }
```

**Response:**
```typescript
{
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  user: {
    id: string;
    email: string;
    name: string;
    // ... otros campos
  };
}
```

### 5.4 Refresh Token

**Endpoint:** `POST /auth/refresh`

**Body:**
```typescript
{
  refreshToken: string;
}
```

**Headers:**
```
X-Platform: web
Content-Type: application/json
```

---

## 6. ARCHIVOS CLAVE DEL BACKEND

### 6.1 Controllers
- **Ruta:** `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/api-nueva/src/generator-pro/controllers/generator-pro.controller.ts`
- **Líneas:** 2609 líneas
- **Descripción:** Controller principal con todos los endpoints

### 6.2 Services
- **NewsWebsiteService:** `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/api-nueva/src/generator-pro/services/news-website.service.ts`
  - Extracción de URLs y contenido
  - Validación de selectores
  - Testing de configuraciones

- **GeneratorProOrchestratorService:** Orquestación del sistema completo
- **GeneratorProQueueService:** Gestión de colas BullMQ
- **GeneratorProSchedulerService:** Schedulers automatizados

### 6.3 Schemas
- **NewsWebsiteConfig:** `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/api-nueva/src/generator-pro/schemas/news-website-config.schema.ts`
- **ExtractedNoticia:** `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/api-nueva/src/noticias/schemas/extracted-noticia.schema.ts`
- **FacebookPublishingConfig:** `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/api-nueva/src/generator-pro/schemas/facebook-publishing-config.schema.ts`

### 6.4 DTOs
- **Directorio:** `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/api-nueva/src/generator-pro/dto/`
- **Index:** `index.ts` - Exportaciones centralizadas
- **Response DTOs:** `response.dto.ts`
- **Create DTOs:** `create-website-config.dto.ts`
- **Update DTOs:** `update-website-config.dto.ts`
- **Testing DTOs:** `test-selectors-advanced.dto.ts`

---

## 7. EJEMPLOS DE PAYLOADS

### 7.1 Crear Website Config Completo

```json
{
  "name": "El Universal",
  "baseUrl": "https://www.eluniversal.com.mx",
  "listingUrl": "https://www.eluniversal.com.mx/ultima-hora",
  "testUrl": "https://www.eluniversal.com.mx/ejemplo-noticia",
  "isActive": true,
  "listingSelectors": {
    "articleLinks": "article.story a.story-link",
    "titleSelector": "h2.story-title",
    "imageSelector": "img.story-image",
    "dateSelector": "time.story-date"
  },
  "contentSelectors": {
    "titleSelector": "h1.article-title",
    "contentSelector": "div.article-body",
    "imageSelector": "figure.main-image img",
    "dateSelector": "time.publish-date",
    "authorSelector": "span.author-name",
    "categorySelector": "a.category-link"
  },
  "extractionSettings": {
    "useJavaScript": false,
    "waitTime": 1000,
    "rateLimit": 30,
    "timeout": 30000,
    "retryAttempts": 3,
    "respectRobots": true,
    "maxUrlsPerRun": 50,
    "duplicateFilter": true
  },
  "extractionFrequency": 60,
  "generationFrequency": 120,
  "publishingFrequency": 30,
  "contentSettings": {
    "generateOnExtraction": false,
    "requireApproval": true,
    "maxContentPerDay": 100
  },
  "notes": "Sitio de noticias nacionales - configuración inicial"
}
```

### 7.2 Actualizar Solo Frecuencias

```json
{
  "extractionFrequency": 30,
  "contentGenerationFrequency": 60,
  "publishingFrequency": 15
}
```

### 7.3 Pausar/Reanudar Outlet

```json
{
  "action": "pause",
  "websiteId": "65f4a8b9c1234567890abcde"
}
```

### 7.4 Test de Selectores

```json
{
  "baseUrl": "https://www.eluniversal.com.mx",
  "listingUrl": "https://www.eluniversal.com.mx/ultima-hora",
  "listingSelectors": {
    "articleLinks": "article.story a.story-link"
  },
  "limit": 10
}
```

---

## 8. CÓDIGOS DE ESTADO HTTP

- `200 OK` - Operación exitosa
- `201 Created` - Recurso creado exitosamente
- `400 Bad Request` - Datos inválidos en el request
- `401 Unauthorized` - Token JWT inválido o expirado
- `403 Forbidden` - Sin permisos para la operación
- `404 Not Found` - Recurso no encontrado
- `409 Conflict` - Conflicto (ej: website con baseUrl duplicado)
- `500 Internal Server Error` - Error del servidor

---

## 9. NOTAS IMPORTANTES

### 9.1 Rate Limiting
- El sistema respeta los límites configurados en `extractionSettings.rateLimit`
- Por defecto: 30 requests/minuto por sitio

### 9.2 Duplicados
- Por defecto, el sistema filtra URLs duplicadas automáticamente
- Se puede desactivar con `extractionSettings.duplicateFilter = false`

### 9.3 Schedulers Automatizados
- Los schedulers se ejecutan según las frecuencias configuradas
- Para control manual, usar los endpoints de acciones

### 9.4 Estados del Sistema
- **Activo (isActive: true)**: El sitio está siendo procesado por los schedulers
- **Inactivo (isActive: false)**: El sitio está pausado, no se procesan jobs
- **Pausado (via control)**: Temporalmente detenido, se puede reanudar

### 9.5 Testing Antes de Producción
- SIEMPRE probar selectores con los endpoints de testing antes de activar
- Usar `testUrl` para validar extracción de contenido
- Verificar que `listingSelectors.articleLinks` encuentre URLs válidas

---

## 10. WORKFLOWS RECOMENDADOS

### 10.1 Setup Inicial de Nuevo Outlet

1. **Test de Selectores de Listado**
   ```
   POST /generator-pro/websites/test-listing-selectors
   ```

2. **Test de Selectores de Contenido**
   ```
   POST /generator-pro/websites/test-individual-content
   ```

3. **Crear Configuración**
   ```
   POST /generator-pro/websites
   ```

4. **Ejecutar Test Completo**
   ```
   POST /generator-pro/websites/:id/test
   ```

5. **Activar Outlet**
   ```
   PUT /generator-pro/websites/:id
   Body: { "isActive": true }
   ```

### 10.2 Extracción Manual

1. **Extraer URLs**
   ```
   POST /generator-pro/websites/:id/extract-urls
   ```

2. **Extraer Contenido**
   ```
   POST /generator-pro/websites/:id/extract-content
   Body: { "urls": ["url1", "url2"] }
   ```

### 10.3 Cambio de Configuración

1. **Pausar Outlet**
   ```
   POST /generator-pro/system/control
   Body: { "action": "pause", "websiteId": "..." }
   ```

2. **Actualizar Config**
   ```
   PUT /generator-pro/websites/:id
   ```

3. **Probar Nuevos Selectores**
   ```
   POST /generator-pro/websites/:id/test
   ```

4. **Reanudar Outlet**
   ```
   POST /generator-pro/system/control
   Body: { "action": "resume", "websiteId": "..." }
   ```

---

## RESUMEN DE ENDPOINTS

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/generator-pro/websites` | Lista de outlets |
| POST | `/generator-pro/websites` | Crear outlet |
| PUT | `/generator-pro/websites/:id` | Actualizar outlet |
| DELETE | `/generator-pro/websites/:id` | Eliminar outlet |
| POST | `/generator-pro/websites/:id/extract-urls` | Extraer URLs manual |
| POST | `/generator-pro/websites/:id/extract-content` | Extraer contenido manual |
| POST | `/generator-pro/websites/:id/extract-urls-and-save` | Extraer y guardar |
| POST | `/generator-pro/websites/:id/test` | Test completo |
| POST | `/generator-pro/websites/:id/force-schedule` | Forzar jobs |
| POST | `/generator-pro/websites/test-listing-selectors` | Test selectores listado |
| POST | `/generator-pro/websites/test-individual-content` | Test selectores contenido |
| POST | `/generator-pro/system/control` | Control sistema (start/stop/pause/resume) |
| GET | `/generator-pro/status` | Estado del sistema |

---

**Documentación generada:** 2025-10-09
**Backend Version:** NestJS
**Base Path:** `/api/generator-pro`
