# 📋 CONTEXTO: ContentExtractionFacebookModule

## 🎯 OBJETIVO
Crear un módulo de administración para gestionar páginas de Facebook, ejecutar extracciones manuales y monitorear métricas de uso de API, **integrando completamente** con la arquitectura existente del proyecto Pachuca Noticias.

## 🏗️ INTEGRACIÓN CON SISTEMA EXISTENTE

### ✅ SERVICIOS REUTILIZADOS:
- **PaginationService** (`src/common/services/pagination.service.ts`) - Sistema estándar de paginado con skip/limit
- **CacheService** (`src/services/cache.service.ts`) - Redis con @nestjs/cache-manager moderno, TTL configurado
- **AppConfigService** - Configuración global tipada, variables .env
- **FacebookService** (`src/facebook/services/facebook.service.ts`) - API calls técnicos existentes
- **NotificationsModule** - Para alertas de extracción y notificaciones
- **BullModule** - Cola de trabajos async ya configurada con Redis

### ✅ ARQUITECTURA BASE EXISTENTE:
- **MongoDB + Mongoose** - Schemas tipados estrictos, **SIN `any` EN NINGÚN LADO**
- **Redis Cache** - TTL global 600s, @keyv/redis adapter
- **Bull Queues** - Trabajos asíncronos con retry y backoff
- **EventEmitter2** - Comunicación entre servicios sin dependencias circulares
- **Swagger** - Documentación automática de endpoints
- **NestJS 11** - Arquitectura modular con dependency injection
- **TypeScript estricto** - **PROHIBIDO usar `any`**

### ✅ CONFIGURACIÓN EXISTENTE:
```env
# Redis ya configurado
REDIS_URL=redis://:redis123@localhost:6379
CACHE_TTL=600

# Facebook API ya configurado
FACEBOOK_APP_ID=611087962045616
FACEBOOK_APP_SECRET=853b92fad4997f1a409adb8d9dcc800a
FACEBOOK_API_VERSION=v22.0
FACEBOOK_RATE_LIMIT_BUFFER=75
FACEBOOK_BATCH_SIZE=50
```

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### 🔥 FASE 1: ESTRUCTURA Y SCHEMAS
- [ ] **1.1** Crear directorio `src/content-extraction-facebook/schemas/`
- [ ] **1.2** Schema `MonitoredFacebookPage`:
  ```typescript
  interface MonitoredFacebookPageDocument {
    pageId: string;           // Único, índice
    pageName: string;         // Nombre de la página
    category: string;         // Categoría FB
    isActive: boolean;        // Si está monitoreando
    lastExtraction: Date;     // Última vez extraído
    totalExtractions: number; // Contador total
    extractionConfig: {
      maxPosts: number;       // Máximo posts por extracción
      frequency: 'manual' | 'daily' | 'weekly';
      fields: string[];       // Campos a extraer
    };
    createdAt: Date;
    updatedAt: Date;
  }
  ```
- [ ] **1.3** Schema `FacebookExtractionJob`:
  ```typescript
  interface FacebookExtractionJobDocument {
    jobId: string;                    // UUID único
    pageId: string;                   // Referencia a página
    status: 'pending' | 'running' | 'completed' | 'failed';
    startedAt: Date;
    completedAt?: Date;
    postsExtracted: number;           // Cantidad extraída
    apiCallsUsed: number;             // Calls consumidas
    errors: string[];                 // Errores si los hay
    metadata: {
      requestedBy: string;            // Usuario que solicitó
      extractionType: 'manual' | 'scheduled';
      filters?: Record<string, unknown>;
    };
    createdAt: Date;
  }
  ```
- [ ] **1.4** Schema `ExtractedFacebookPost`:
  ```typescript
  interface ExtractedFacebookPostDocument {
    facebookPostId: string;           // ID único de FB
    pageId: string;                   // Página origen
    content: string;                  // Texto del post
    createdTime: Date;                // Fecha original FB
    extractedAt: Date;                // Cuándo se extrajo
    metrics: {
      likes: number;
      shares: number;
      comments: number;
      reactions: Record<string, number>;
    };
    media: Array<{
      type: 'photo' | 'video' | 'link';
      url: string;
      description?: string;
    }>;
    hashtags: string[];               // Hashtags extraídos
    mentions: string[];               // Menciones extraídas
    isActive: boolean;                // Si sigue disponible
  }
  ```
- [ ] **1.5** Schema `FacebookApiUsageMetrics`:
  ```typescript
  interface FacebookApiUsageMetricsDocument {
    date: Date;                       // Fecha del métricas (día)
    totalCalls: number;               // Total calls ese día
    callsRemaining: number;           // Calls restantes
    averageResponseTime: number;      // Tiempo promedio ms
    errorRate: number;                // % de errores
    topPages: Array<{                 // Páginas más consultadas
      pageId: string;
      pageName: string;
      calls: number;
    }>;
    hourlyBreakdown: Array<{          // Desglose por hora
      hour: number;
      calls: number;
      errors: number;
    }>;
  }
  ```

### 🔥 FASE 2: DTOs CON PAGINACIÓN ESTÁNDAR
- [ ] **2.1** `FacebookPageListDto extends PaginationDto`:
  ```typescript
  class FacebookPageListDto extends PaginationDto {
    @IsOptional() isActive?: boolean;
    @IsOptional() category?: string;
    @IsOptional() search?: string;     // Buscar por nombre
  }
  ```
- [ ] **2.2** `CreateFacebookPageDto` con validaciones class-validator estrictas
- [ ] **2.3** `UpdateFacebookPageDto` con campos opcionales
- [ ] **2.4** `FacebookExtractionRequestDto`:
  ```typescript
  class FacebookExtractionRequestDto {
    @IsArray() @IsString({ each: true }) pageIds: string[];
    @IsOptional() @IsNumber() maxPosts?: number;
    @IsOptional() @IsArray() fields?: string[];
    @IsOptional() @IsEnum(['high', 'normal', 'low']) priority?: string;
  }
  ```
- [ ] **2.5** `ExtractedPostListDto extends PaginationDto` con filtros fecha/página

### 🔥 FASE 3: SERVICIOS CORE
- [ ] **3.1** `FacebookPageManagementService`:
  - CRUD páginas usando `PaginationService`
  - Cache con `CacheService` keys: `facebook:page:{pageId}`
  - Validación pageId con `FacebookService.verifyPageAccess()`
  - **NO usar `any` en ningún tipo**
- [ ] **3.2** `FacebookExtractionService`:
  - Usar `FacebookService` para llamadas API
  - Tracking métricas de API calls
  - Guards contra posts duplicados
  - Rate limiting integration
- [ ] **3.3** `FacebookMetricsService`:
  - Agregación datos uso diario/semanal
  - Cache métricas TTL 600s
  - Reportes por período customizable
- [ ] **3.4** `FacebookExtractionQueueService`:
  - Cola Bull `facebook-extraction`
  - Progress tracking en Redis
  - Error handling con retry exponencial

### 🔥 FASE 4: CONTROLLERS CON SWAGGER
- [ ] **4.1** `FacebookPagesController`:
  - `GET /api/content-extraction-facebook/pages` - Lista paginada
  - `POST /api/content-extraction-facebook/pages` - Crear página
  - `PUT /api/content-extraction-facebook/pages/:id` - Actualizar
  - `DELETE /api/content-extraction-facebook/pages/:id` - Eliminar
  - `GET /api/content-extraction-facebook/pages/:id` - Detalle página
- [ ] **4.2** `FacebookExtractionController`:
  - `POST /api/content-extraction-facebook/extract` - Extracción manual múltiple
  - `GET /api/content-extraction-facebook/jobs` - Lista trabajos paginada
  - `GET /api/content-extraction-facebook/jobs/:id` - Detalle trabajo
  - `GET /api/content-extraction-facebook/posts` - Posts extraídos paginados
- [ ] **4.3** `FacebookMetricsController`:
  - `GET /api/content-extraction-facebook/metrics` - Métricas globales
  - `GET /api/content-extraction-facebook/metrics/usage` - Uso API detallado
  - `GET /api/content-extraction-facebook/metrics/pages` - Stats por página

### 🔥 FASE 5: INTEGRACIÓN APP MODULE
- [ ] **5.1** Registrar schemas en `MongooseModule.forFeature([...])`
- [ ] **5.2** Crear `ContentExtractionFacebookModule`:
  ```typescript
  @Module({
    imports: [
      FacebookModule,           // Reutilizar servicios
      NotificationsModule,      // Alertas
      BullModule.registerQueue({
        name: 'facebook-extraction'
      }),
      MongooseModule.forFeature([...schemas])
    ],
    providers: [
      PaginationService,        // Servicio paginación
      CacheService,            // Redis cache
      // Servicios nuevos...
    ],
    controllers: [...],
    exports: [...]
  })
  ```
- [ ] **5.3** Agregar a `app.module.ts` imports
- [ ] **5.4** Verificar rutas con prefijo `/api/content-extraction-facebook`

### 🔥 FASE 6: TESTING Y VALIDACIÓN
- [ ] **6.1** Test endpoints Swagger UI http://localhost:3000/api
- [ ] **6.2** Validar paginación con PaginationService estándar
- [ ] **6.3** Verificar cache Redis keys correctos
- [ ] **6.4** Test integración FacebookService (página pública)
- [ ] **6.5** Compilación TypeScript **SIN errores `any`**
- [ ] **6.6** Test cola Bull con trabajo async
- [ ] **6.7** Verificar métricas en tiempo real

## 🔧 CONFIGURACIÓN TÉCNICA

### Cache Keys Standard:
```typescript
// Páginas monitoreadas
`facebook:page:${pageId}`                    // TTL 300s
`facebook:pages:list:${hash}`                // Lista paginada TTL 60s

// Métricas
`facebook:metrics:daily:${date}`             // TTL 3600s
`facebook:metrics:usage:${date}`             // TTL 1800s

// Posts extraídos
`facebook:posts:${pageId}:${date}`           // TTL 900s
```

### Queue Jobs:
```typescript
// Trabajos de extracción
'facebook-extraction:manual'     // Extracción manual dashboard
'facebook-extraction:bulk'       // Extracción múltiples páginas
'facebook-extraction:metrics'    // Agregación métricas diarias
```

### TypeScript Strict Rules:
```typescript
// ❌ ABSOLUTAMENTE PROHIBIDO
const data: any = await service.getData();
const result: any = response.data;

// ✅ SIEMPRE TIPADO ESTRICTO
const data: MonitoredFacebookPage = await service.getData();
const result: FacebookApiResponse = response.data;
```

## 🚨 ESTADO ACTUAL
- **FacebookModule**: ✅ Implementado y funcionando
- **Servicios base**: ✅ PaginationService, CacheService, AppConfigService
- **Redis/MongoDB**: ✅ Configurados y funcionando
- **API Facebook**: ✅ Credentials configurados y validados

## 🎯 PRÓXIMO PASO
**FASE 1.1**: Crear directorio y primer schema `MonitoredFacebookPage`

---
**ÚLTIMA ACTUALIZACIÓN**: 2025-09-19 - Documento creado para evitar pérdida de contexto
**USUARIO**: Coyotito
**PROYECTO**: Pachuca Noticias API Nueva