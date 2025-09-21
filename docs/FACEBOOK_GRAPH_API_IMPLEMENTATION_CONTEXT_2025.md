# 🎯 FACEBOOK GRAPH API - CONTEXTO DE IMPLEMENTACIÓN 2025

## 📋 ANÁLISIS DE ARQUITECTURA EXISTENTE

### 🔍 **Estado Actual del Proyecto (api-nueva)**

#### ✅ **Infraestructura Disponible**
- **NestJS v11.0.1** - Framework principal
- **MongoDB + Mongoose v8.18.1** - Base de datos con esquemas
- **Redis + @keyv/redis v5.1.2** - Cache y sesiones
- **Bull Queue v4.16.5** - Sistema de colas asíncronas
- **Socket.IO v4.8.1** - WebSockets con Redis adapter
- **Auth JWT + Sessions** - Sistema dual web/mobile
- **Expo Push v4.0.0** - Notificaciones push móviles
- **Paginación implementada** - PaginationService + DTOs

#### 🏗️ **Módulos Existentes**
```typescript
src/
├── auth/              // ✅ Sistema auth completo
├── notifications/     // ✅ Dual: Socket + Push
├── analytics/         // ✅ Análisis y métricas
├── common/           // ✅ DTOs, servicios compartidos
│   ├── dto/pagination.dto.ts        // ✅ Paginación
│   ├── services/pagination.service.ts
│   └── interfaces/paginated-response.interface.ts
├── services/         // ✅ CacheService
└── config/           // ✅ Configuración tipada
```

#### 🔧 **Servicios Clave Disponibles**
```typescript
// Cache y Redis
- CacheService          // ✅ @nestjs/cache-manager + keyv
- BullModule           // ✅ Queue system configurado

// Autenticación
- AuthService          // ✅ JWT + Sessions
- PlatformDetectionService  // ✅ web/mobile detection

// Notificaciones
- NotificationRouterService  // ✅ Socket + Push routing
- ExpoPushService           // ✅ Push notifications
- SocketGateway            // ✅ WebSocket gateway

// Common
- PaginationService    // ✅ MongoDB pagination
```

---

## 🎯 PLAN DE IMPLEMENTACIÓN FACEBOOK GRAPH API

### 📝 **CHECKLIST DE IMPLEMENTACIÓN**

#### **FASE 1: Configuración Base** ⏰ Estimado: 2-3 horas

- [ ] **1.1 Instalar dependencias Facebook**
  ```bash
  cd packages/api-nueva
  yarn add facebook-nodejs-business-sdk @types/facebook-nodejs-business-sdk
  ```

- [ ] **1.2 Configurar variables de entorno**
  ```env
  # Facebook Graph API
  FACEBOOK_APP_ID=your_app_id
  FACEBOOK_APP_SECRET=your_app_secret
  FACEBOOK_API_VERSION=v22.0
  FACEBOOK_WEBHOOK_VERIFY_TOKEN=your_webhook_token

  # Rate Limiting
  FACEBOOK_RATE_LIMIT_BUFFER=75
  FACEBOOK_BATCH_SIZE=50
  ```

- [ ] **1.3 Actualizar configuración tipada**
  ```typescript
  // src/config/configuration.ts
  facebook: {
    appId: process.env.FACEBOOK_APP_ID,
    appSecret: process.env.FACEBOOK_APP_SECRET,
    apiVersion: process.env.FACEBOOK_API_VERSION || 'v22.0',
    webhookVerifyToken: process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN,
    rateLimitBuffer: parseInt(process.env.FACEBOOK_RATE_LIMIT_BUFFER) || 75,
    batchSize: parseInt(process.env.FACEBOOK_BATCH_SIZE) || 50,
  }
  ```

#### **FASE 2: Estructura de Módulos** ⏰ Estimado: 3-4 horas

- [ ] **2.1 Crear estructura del módulo**
  ```
  src/facebook/
  ├── facebook.module.ts
  ├── controllers/
  │   ├── facebook.controller.ts
  │   └── facebook-webhooks.controller.ts
  ├── services/
  │   ├── facebook.service.ts
  │   ├── facebook-rate-limit.service.ts
  │   ├── facebook-queue.service.ts
  │   ├── competitor-analysis.service.ts
  │   ├── page-content.service.ts
  │   └── facebook-monitor.service.ts
  ├── dto/
  │   ├── facebook-request.dto.ts
  │   ├── competitor-analysis.dto.ts
  │   ├── page-content.dto.ts
  │   └── webhook-payload.dto.ts
  ├── interfaces/
  │   ├── facebook-api.interface.ts
  │   ├── rate-limit.interface.ts
  │   └── competitor-data.interface.ts
  ├── schemas/
  │   ├── competitor-page.schema.ts
  │   ├── facebook-post.schema.ts
  │   └── monitoring-config.schema.ts
  └── guards/
      └── facebook-webhook.guard.ts
  ```

- [ ] **2.2 Integrar con sistema de colas existente**
  ```typescript
  // Usar BullModule existente
  BullModule.registerQueue({
    name: 'facebook-api',
    // Usar configuración Redis existente
  })
  ```

- [ ] **2.3 Integrar con sistema de notificaciones**
  ```typescript
  // Usar NotificationRouterService existente
  // para alertas de contenido viral de competidores
  ```

#### **FASE 3: DTOs y Validación** ⏰ Estimado: 2-3 horas

- [ ] **3.1 DTOs de Request con validación estricta**
  ```typescript
  // NO usar any - usar interfaces tipadas
  export class FacebookPageRequestDto {
    @IsString() @IsNotEmpty()
    pageId: string;

    @IsArray() @IsOptional()
    @ArrayNotEmpty()
    fields?: string[];

    @ValidateNested()
    @Type(() => PaginationDto)
    pagination?: PaginationDto; // ✅ Usar paginación existente
  }
  ```

- [ ] **3.2 Interfaces tipadas para responses**
  ```typescript
  // Evitar any en toda la implementación
  interface FacebookPageData {
    id: string;
    name: string;
    category: string;
    fan_count: number;
    // ... otros campos tipados
  }
  ```

- [ ] **3.3 DTOs para análisis de competidores**
  ```typescript
  export class CompetitorAnalysisDto {
    @IsArray() @ArrayNotEmpty()
    @IsString({ each: true })
    competitorPageIds: string[];

    @IsOptional() @IsDateString()
    startDate?: string;

    @IsOptional() @IsDateString()
    endDate?: string;
  }
  ```

#### **FASE 4: Servicios Core** ⏰ Estimado: 4-5 horas

- [ ] **4.1 FacebookRateLimitService**
  ```typescript
  @Injectable()
  export class FacebookRateLimitService {
    constructor(
      private readonly cacheService: CacheService // ✅ Usar existente
    ) {}

    async checkRateLimit(appId: string): Promise<boolean>
    async updateUsage(appId: string, headers: Record<string, any>): Promise<void>
    async waitForRateLimit(appId: string): Promise<void>
  }
  ```

- [ ] **4.2 FacebookQueueService con Bull**
  ```typescript
  @Processor('facebook-api')
  export class FacebookQueueService {
    @Process('batch-request')
    async processBatchRequest(job: Job<FacebookBatchRequest>): Promise<FacebookBatchResponse>

    @Process('competitor-analysis')
    async processCompetitorAnalysis(job: Job<CompetitorAnalysisJob>): Promise<void>
  }
  ```

- [ ] **4.3 FacebookService principal**
  ```typescript
  @Injectable()
  export class FacebookService {
    constructor(
      private readonly httpService: HttpService,
      private readonly rateLimitService: FacebookRateLimitService,
      private readonly paginationService: PaginationService // ✅ Usar existente
    ) {}

    // Métodos sin any - todo tipado
    async batchRequest(requests: FacebookRequest[]): Promise<FacebookBatchResponse>
    async getPageData(pageId: string, fields: string[]): Promise<FacebookPageData>
    async getPagePosts(pageId: string, options: PagePostsOptions): Promise<PaginatedResponse<FacebookPost>>
  }
  ```

#### **FASE 5: Servicios Especializados** ⏰ Estimado: 3-4 horas

- [ ] **5.1 CompetitorAnalysisService**
  ```typescript
  @Injectable()
  export class CompetitorAnalysisService {
    async analyzeCompetitors(dto: CompetitorAnalysisDto): Promise<CompetitorAnalysisResult>
    async getPageInsights(pageId: string, metrics: string[]): Promise<PageInsightData[]>
    async compareCompetitors(pageIds: string[]): Promise<CompetitorComparison>
  }
  ```

- [ ] **5.2 PageContentService**
  ```typescript
  @Injectable()
  export class PageContentService {
    async analyzePageContent(pageId: string): Promise<PageContentAnalysis>
    async getPostingPatterns(pageId: string): Promise<PostingPattern[]>
    async getEngagementMetrics(pageId: string): Promise<EngagementMetrics>
  }
  ```

- [ ] **5.3 FacebookMonitorService**
  ```typescript
  @Injectable()
  export class FacebookMonitorService {
    constructor(
      private readonly notificationRouter: NotificationRouterService // ✅ Usar existente
    ) {}

    @Cron(CronExpression.EVERY_30_MINUTES)
    async monitorCompetitors(): Promise<void>

    private async sendViralContentAlert(data: ViralContentAlert): Promise<void> {
      // ✅ Usar sistema de notificaciones existente
      await this.notificationRouter.sendNotification({
        type: 'competitor_viral_content',
        platform: 'all', // web + mobile
        data: data
      });
    }
  }
  ```

#### **FASE 6: Schemas y Base de Datos** ⏰ Estimado: 2-3 horas

- [ ] **6.1 Schemas para MongoDB**
  ```typescript
  // src/facebook/schemas/competitor-page.schema.ts
  @Schema({ timestamps: true })
  export class CompetitorPage {
    @Prop({ required: true, unique: true })
    pageId: string;

    @Prop({ required: true })
    name: string;

    @Prop({ type: Object })
    lastAnalysis: PageAnalysisData;

    @Prop({ default: true })
    isActive: boolean;
  }
  ```

- [ ] **6.2 Schema para posts monitoreados**
  ```typescript
  @Schema({ timestamps: true })
  export class FacebookPost {
    @Prop({ required: true })
    postId: string;

    @Prop({ required: true })
    pageId: string;

    @Prop({ type: Object })
    engagementData: EngagementData;

    @Prop({ default: false })
    isViralContent: boolean;
  }
  ```

#### **FASE 7: Controladores y Endpoints** ⏰ Estimado: 2-3 horas

- [ ] **7.1 FacebookController principal**
  ```typescript
  @Controller('facebook')
  @UseGuards(JwtAuthGuard) // ✅ Usar auth existente
  export class FacebookController {
    @Post('analyze-competitors')
    @UsePipes(new ValidationPipe({ transform: true }))
    async analyzeCompetitors(@Body() dto: CompetitorAnalysisDto): Promise<CompetitorAnalysisResult>

    @Get('page/:pageId/content')
    async getPageContent(@Param('pageId') pageId: string): Promise<PageContentAnalysis>

    @Get('page/:pageId/posts')
    async getPagePosts(
      @Param('pageId') pageId: string,
      @Query() pagination: PaginationDto // ✅ Usar paginación existente
    ): Promise<PaginatedResponse<FacebookPost>>
  }
  ```

- [ ] **7.2 Webhook controller para monitoreo**
  ```typescript
  @Controller('facebook/webhooks')
  export class FacebookWebhooksController {
    @Get('verify')
    verifyWebhook(@Query() query: WebhookVerificationDto): string

    @Post('callback')
    @UseGuards(FacebookWebhookGuard)
    handleWebhook(@Body() payload: FacebookWebhookPayload): Promise<void>
  }
  ```

#### **FASE 8: Integración con Sistemas Existentes** ⏰ Estimado: 3-4 horas

- [ ] **8.1 Integrar con NotificationRouterService**
  ```typescript
  // Para alertas de contenido viral de competidores
  async sendCompetitorAlert(data: CompetitorAlertData): Promise<void> {
    await this.notificationRouter.sendNotification({
      type: 'facebook_competitor_alert',
      target: 'dashboard_users', // Solo usuarios del dashboard
      platforms: ['web'], // Solo web, no mobile para alertas admin
      socketRoom: 'admin-dashboard',
      data: {
        competitorName: data.competitorName,
        postType: data.postType,
        engagementScore: data.engagementScore,
        url: data.postUrl,
        timestamp: new Date().toISOString()
      }
    });
  }
  ```

- [ ] **8.2 Usar CacheService para optimización**
  ```typescript
  // Cache de datos de páginas para evitar rate limits
  async getCachedPageData(pageId: string): Promise<FacebookPageData | null> {
    return this.cacheService.get(`facebook:page:${pageId}`);
  }

  async setCachedPageData(pageId: string, data: FacebookPageData): Promise<void> {
    await this.cacheService.set(`facebook:page:${pageId}`, data, 3600); // 1 hour
  }
  ```

- [ ] **8.3 Usar sistema de paginación existente**
  ```typescript
  async getCompetitorPosts(
    pageId: string,
    pagination: PaginationDto
  ): Promise<PaginatedResponse<FacebookPost>> {
    return this.paginationService.paginate(
      this.facebookPostModel,
      pagination,
      { pageId: pageId },
      { sort: { createdAt: -1 } }
    );
  }
  ```

#### **FASE 9: Testing** ⏰ Estimado: 2-3 horas

- [ ] **9.1 Unit tests para servicios**
  ```typescript
  describe('FacebookService', () => {
    // Mock de HttpService y RateLimitService
    // Tests sin any types
  });
  ```

- [ ] **9.2 Integration tests**
  ```typescript
  describe('Facebook Module Integration', () => {
    // Tests de integración con Redis y MongoDB
  });
  ```

- [ ] **9.3 E2E tests para endpoints**
  ```typescript
  describe('FacebookController (e2e)', () => {
    // Tests end-to-end usando auth existente
  });
  ```

#### **FASE 10: Documentación y Configuración** ⏰ Estimado: 1-2 horas

- [ ] **10.1 Swagger documentation**
  ```typescript
  @ApiTags('Facebook Graph API')
  @ApiBearerAuth()
  @Controller('facebook')
  export class FacebookController {
    @ApiOperation({ summary: 'Analyze competitors' })
    @ApiResponse({ type: CompetitorAnalysisResult })
    async analyzeCompetitors(@Body() dto: CompetitorAnalysisDto)
  }
  ```

- [ ] **10.2 Actualizar app.module.ts**
  ```typescript
  @Module({
    imports: [
      // ... módulos existentes
      FacebookModule, // ✅ Agregar nuevo módulo
    ],
  })
  export class AppModule {}
  ```

---

## 🚨 **CONSIDERACIONES CRÍTICAS**

### ⚠️ **PROHIBICIONES ESTRICTAS**
- [ ] **❌ NO usar `any` type** - Todo debe estar tipado
- [ ] **❌ NO crear nuevos sistemas de cache** - Usar CacheService existente
- [ ] **❌ NO crear nuevos sistemas de cola** - Usar Bull existente
- [ ] **❌ NO duplicar paginación** - Usar PaginationService existente
- [ ] **❌ NO reinventar notificaciones** - Usar NotificationRouterService

### ✅ **OBLIGACIONES DE INTEGRACIÓN**
- [ ] **✅ Usar auth existente** - JwtAuthGuard para endpoints
- [ ] **✅ Usar Redis existente** - Para rate limiting y cache
- [ ] **✅ Usar MongoDB existente** - Schemas y connections
- [ ] **✅ Seguir patrones DTO** - Validación con class-validator
- [ ] **✅ Usar configuración tipada** - ConfigService patterns

### 🔄 **FLUJO DE NOTIFICACIONES PLANIFICADO**

```typescript
// Cuando se detecta contenido viral de competidor:
FacebookMonitorService
  → DetectaContenidoViral
  → NotificationRouterService
  → SocketGateway (web dashboard)
  → Cliente recibe alerta en dashboard
```

### 📊 **TIPOS DE NOTIFICACIONES FACEBOOK**

```typescript
interface FacebookNotificationTypes {
  'competitor_viral_content': {
    competitorName: string;
    postId: string;
    engagementScore: number;
    platform: 'web'; // Solo dashboard web
    room: 'admin-dashboard';
  };

  'rate_limit_warning': {
    percentage: number;
    estimatedWaitTime: number;
    platform: 'web';
    room: 'admin-dashboard';
  };

  'analysis_complete': {
    competitorCount: number;
    analysisId: string;
    platform: 'web';
    room: 'admin-dashboard';
  };
}
```

---

## 🎯 **RESULTADO ESPERADO**

### ✅ **Al Completar la Implementación**

1. **Sistema de análisis de competidores** integrado con arquitectura existente
2. **Rate limiting inteligente** con cache Redis existente
3. **Monitoreo en tiempo real** con notificaciones a dashboard web
4. **API endpoints tipados** sin uso de `any`
5. **Sistema de colas** para procesamiento asíncrono
6. **Webhooks Facebook** para actualizaciones automáticas
7. **Paginación optimizada** para grandes datasets
8. **Cache inteligente** para optimizar llamadas API

### 🔗 **Puntos de Integración Clave**

- **NotificationRouterService** → Alertas de contenido viral
- **CacheService** → Cache de datos Facebook
- **PaginationService** → Paginado de posts/insights
- **AuthModule** → Protección de endpoints
- **BullModule** → Procesamiento asíncrono
- **SocketGateway** → Notificaciones en tiempo real al dashboard

### ⏱️ **Estimación Total: 20-25 horas**
**Distribución:**
- Configuración y estructura: 5-7 horas
- Servicios core: 7-9 horas
- Integración: 3-4 horas
- Testing: 2-3 horas
- Documentación: 1-2 horas

---

**✨ Esta implementación aprovecha al máximo la arquitectura existente, manteniendo consistency y evitando duplicación de código.**