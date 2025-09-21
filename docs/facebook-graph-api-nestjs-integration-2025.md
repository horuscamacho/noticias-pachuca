# Integración Facebook Graph API con NestJS - Guía Completa 2025

## Índice
1. [Estado Actual de la API 2025](#estado-actual)
2. [Rate Limits y Restricciones](#rate-limits)
3. [Arquitectura NestJS Recomendada](#arquitectura-nestjs)
4. [Estrategias de Chunking y Rate Limiting](#chunking-strategies)
5. [Servicios Especializados](#servicios-especializados)
6. [Implementación Paso a Paso](#implementacion)
7. [Mejores Prácticas](#mejores-practicas)

## Estado Actual de la API 2025 {#estado-actual}

### Graph API v22.0 (Abril 2025)
- **Versión actual**: Graph API v22.0 y Marketing API v22.0
- **Próxima versión**: Graph API v23.0 (Mayo 2025)
- **SDK recomendado**: facebook-nodejs-business-sdk v23.0.1
- **TypeScript**: @types/facebook-nodejs-business-sdk v23.0.0

### Cambios Importantes 2025
- Restricciones más estrictas en endpoints disponibles
- Políticas de permisos más rigurosas
- Límites de rate más ajustados para fortalecer privacidad
- Métricas de Instagram actualizadas (Views reemplaza Impressions)

## Rate Limits y Restricciones {#rate-limits}

### Cálculo de Rate Limits

#### Límites Platform Rate
```
Llamadas por hora = 200 × Número de Usuarios Activos Diarios
```

**Ejemplo de cálculo:**
- App con 10 usuarios ayer + 5 nuevos logins hoy = 15 usuarios base
- Límite: `(10 + 5) × 200 = 3,000 llamadas API en cualquier ventana de 60 minutos`

#### Límites Business Use Case (BUC)
- Aplicados a nivel de aplicación globalmente
- Basados en ventana deslizante de una hora
- Considera: número de llamadas, tiempo de CPU, tiempo de procesamiento, memoria usada

### Headers de Monitoreo
```http
X-App-Usage: {"call_count":xx,"total_time":xx,"total_cputime":xx}
X-Business-Use-Case-Usage: {"business_id":[{"type":"","call_count":xx,"total_cputime":xx,"total_time":xx,"estimated_time_to_regain_access":xx}]}
```

### Códigos de Error Rate Limit
- **Código 4**: Límite a nivel de aplicación alcanzado
- **Código 17**: Límite de usuarios alcanzado
- **Código 32**: Límite de páginas alcanzado

## Arquitectura NestJS Recomendada {#arquitectura-nestjs}

### Estructura de Módulos

```typescript
// facebook.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    HttpModule,
    BullModule.registerQueue({
      name: 'facebook-api',
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
  ],
  controllers: [FacebookController],
  providers: [
    FacebookService,
    FacebookQueueService,
    FacebookRateLimitService,
    CompetitorAnalysisService,
    PageContentService,
  ],
  exports: [FacebookService],
})
export class FacebookModule {}
```

### Configuración Environment

```typescript
// facebook.config.ts
export interface FacebookConfig {
  appId: string;
  appSecret: string;
  apiVersion: string;
  baseUrl: string;
  rateLimitBuffer: number;
}

export const facebookConfig = (): FacebookConfig => ({
  appId: process.env.FACEBOOK_APP_ID,
  appSecret: process.env.FACEBOOK_APP_SECRET,
  apiVersion: process.env.FACEBOOK_API_VERSION || 'v22.0',
  baseUrl: 'https://graph.facebook.com',
  rateLimitBuffer: parseInt(process.env.RATE_LIMIT_BUFFER) || 75,
});
```

### DTOs y Validación

```typescript
// dto/facebook-request.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class FacebookPageRequestDto {
  @IsString()
  @IsNotEmpty()
  pageId: string;

  @IsArray()
  @IsOptional()
  fields?: string[];

  @IsString()
  @IsOptional()
  accessToken?: string;
}

export class CompetitorAnalysisDto {
  @IsArray()
  @IsNotEmpty()
  competitorPageIds: string[];

  @IsString()
  @IsOptional()
  dateRange?: string;

  @IsArray()
  @IsOptional()
  metrics?: string[];
}
```

## Estrategias de Chunking y Rate Limiting {#chunking-strategies}

### Servicio de Rate Limiting

```typescript
// services/facebook-rate-limit.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class FacebookRateLimitService {
  private readonly logger = new Logger(FacebookRateLimitService.name);
  private readonly rateLimitKey = 'facebook:rate_limit';

  constructor(private readonly redis: RedisService) {}

  async checkRateLimit(appId: string): Promise<boolean> {
    const usage = await this.getCurrentUsage(appId);
    return usage.percentage < 75; // 75% threshold
  }

  async updateUsage(appId: string, headers: any): Promise<void> {
    const usage = this.parseUsageHeaders(headers);
    await this.redis.setex(
      `${this.rateLimitKey}:${appId}`,
      3600, // 1 hour TTL
      JSON.stringify(usage)
    );
  }

  async waitForRateLimit(appId: string): Promise<void> {
    const usage = await this.getCurrentUsage(appId);
    if (usage.estimatedTimeToRegainAccess > 0) {
      const waitTime = Math.min(usage.estimatedTimeToRegainAccess, 300000); // Max 5 min
      this.logger.warn(`Rate limit reached. Waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  private parseUsageHeaders(headers: any) {
    const appUsage = JSON.parse(headers['x-app-usage'] || '{}');
    const bucUsage = JSON.parse(headers['x-business-use-case-usage'] || '{}');

    return {
      callCount: appUsage.call_count || 0,
      totalTime: appUsage.total_time || 0,
      percentage: Math.max(
        (appUsage.call_count / 200) * 100,
        appUsage.total_time || 0
      ),
      estimatedTimeToRegainAccess: bucUsage.estimated_time_to_regain_access || 0
    };
  }
}
```

### Servicio de Cola con Chunking

```typescript
// services/facebook-queue.service.ts
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@Processor('facebook-api')
export class FacebookQueueService {
  private readonly logger = new Logger(FacebookQueueService.name);

  constructor(
    private readonly facebookService: FacebookService,
    private readonly rateLimitService: FacebookRateLimitService
  ) {}

  @Process('batch-request')
  async processBatchRequest(job: Job<any>) {
    const { requests, appId } = job.data;

    // Chunk requests into batches of 50 (Facebook limit)
    const chunks = this.chunkArray(requests, 50);
    const results = [];

    for (const chunk of chunks) {
      // Check rate limit before processing each chunk
      const canProceed = await this.rateLimitService.checkRateLimit(appId);

      if (!canProceed) {
        await this.rateLimitService.waitForRateLimit(appId);
      }

      try {
        const batchResult = await this.facebookService.batchRequest(chunk);
        results.push(...batchResult);

        // Update rate limit usage based on response headers
        await this.rateLimitService.updateUsage(appId, batchResult.headers);

        // Small delay between chunks to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        this.logger.error(`Batch request failed: ${error.message}`);
        throw error;
      }
    }

    return results;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
```

### Implementación de Batch Requests

```typescript
// services/facebook.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FacebookService {
  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService
  ) {}

  async batchRequest(requests: any[]): Promise<any> {
    const batchData = {
      batch: JSON.stringify(requests.map(req => ({
        method: req.method || 'GET',
        relative_url: req.url,
        headers: req.headers || {},
        body: req.body || null
      })))
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.config.get('facebook.baseUrl')}/${this.config.get('facebook.apiVersion')}`,
          batchData,
          {
            params: {
              access_token: this.getAccessToken()
            }
          }
        )
      );

      return {
        data: response.data,
        headers: response.headers
      };
    } catch (error) {
      this.handleApiError(error);
    }
  }

  private handleApiError(error: any): void {
    if (error.response?.data?.error) {
      const fbError = error.response.data.error;

      switch (fbError.code) {
        case 4:
          throw new HttpException(
            'Application request limit reached',
            HttpStatus.TOO_MANY_REQUESTS
          );
        case 17:
          throw new HttpException(
            'User request limit reached',
            HttpStatus.TOO_MANY_REQUESTS
          );
        case 32:
          throw new HttpException(
            'Page request limit reached',
            HttpStatus.TOO_MANY_REQUESTS
          );
        default:
          throw new HttpException(
            fbError.message,
            HttpStatus.BAD_REQUEST
          );
      }
    }

    throw new HttpException(
      'Facebook API request failed',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}
```

## Servicios Especializados {#servicios-especializados}

### Servicio de Análisis de Competidores

```typescript
// services/competitor-analysis.service.ts
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class CompetitorAnalysisService {
  constructor(
    @InjectQueue('facebook-api') private readonly facebookQueue: Queue,
    private readonly facebookService: FacebookService
  ) {}

  async analyzeCompetitors(competitorIds: string[]): Promise<any> {
    const requests = competitorIds.map(pageId => ({
      url: `${pageId}?fields=name,fan_count,talking_about_count,engagement`,
      method: 'GET'
    }));

    // Queue the batch request for processing
    const job = await this.facebookQueue.add('batch-request', {
      requests,
      appId: this.facebookService.getAppId()
    });

    return job.finished();
  }

  async getPagePosts(pageId: string, limit = 25): Promise<any> {
    const requests = [{
      url: `${pageId}/posts?fields=message,created_time,likes.summary(true),comments.summary(true),shares&limit=${limit}`,
      method: 'GET'
    }];

    const job = await this.facebookQueue.add('batch-request', {
      requests,
      appId: this.facebookService.getAppId()
    });

    return job.finished();
  }

  async getPageInsights(pageId: string, metrics: string[]): Promise<any> {
    const metricsParam = metrics.join(',');
    const requests = [{
      url: `${pageId}/insights?metric=${metricsParam}&period=day`,
      method: 'GET'
    }];

    const job = await this.facebookQueue.add('batch-request', {
      requests,
      appId: this.facebookService.getAppId()
    });

    return job.finished();
  }
}
```

### Servicio de Análisis de Contenido

```typescript
// services/page-content.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class PageContentService {
  async analyzePageContent(pageId: string): Promise<any> {
    const analysisData = await Promise.all([
      this.getBasicPageInfo(pageId),
      this.getRecentPosts(pageId),
      this.getEngagementMetrics(pageId),
      this.getPostingPatterns(pageId)
    ]);

    return {
      pageInfo: analysisData[0],
      recentPosts: analysisData[1],
      engagement: analysisData[2],
      postingPatterns: analysisData[3],
      summary: this.generateContentSummary(analysisData)
    };
  }

  private async getBasicPageInfo(pageId: string): Promise<any> {
    const fields = [
      'name',
      'category',
      'fan_count',
      'talking_about_count',
      'checkins',
      'website',
      'about',
      'description'
    ];

    return this.facebookService.getPageData(pageId, fields);
  }

  private async getRecentPosts(pageId: string, limit = 50): Promise<any> {
    const fields = [
      'message',
      'created_time',
      'type',
      'attachments',
      'likes.summary(true)',
      'comments.summary(true)',
      'shares'
    ];

    return this.facebookService.getPagePosts(pageId, fields, limit);
  }

  private generateContentSummary(data: any[]): any {
    const [pageInfo, posts, engagement] = data;

    return {
      totalPosts: posts.length,
      avgLikesPerPost: this.calculateAverage(posts, 'likes'),
      avgCommentsPerPost: this.calculateAverage(posts, 'comments'),
      mostEngagedPostType: this.getMostEngagedType(posts),
      recommendedPostingTime: this.getOptimalPostingTime(posts)
    };
  }
}
```

### Servicio de Monitoreo en Tiempo Real

```typescript
// services/facebook-monitor.service.ts
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class FacebookMonitorService {
  constructor(
    private readonly competitorService: CompetitorAnalysisService,
    private readonly notificationService: NotificationService
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async monitorCompetitors(): Promise<void> {
    const competitors = await this.getMonitoredCompetitors();

    for (const competitor of competitors) {
      try {
        const newPosts = await this.checkForNewPosts(competitor.pageId);

        if (newPosts.length > 0) {
          await this.processNewPosts(competitor, newPosts);
        }
      } catch (error) {
        console.error(`Error monitoring ${competitor.name}:`, error);
      }
    }
  }

  private async checkForNewPosts(pageId: string): Promise<any[]> {
    const lastCheck = await this.getLastCheckTime(pageId);
    const posts = await this.competitorService.getPagePosts(pageId, 10);

    return posts.filter(post =>
      new Date(post.created_time) > lastCheck
    );
  }

  private async processNewPosts(competitor: any, posts: any[]): Promise<void> {
    for (const post of posts) {
      const analysis = await this.analyzePost(post);

      if (analysis.isHighEngagement || analysis.isViralContent) {
        await this.notificationService.sendAlert({
          type: 'competitor_viral_content',
          competitor: competitor.name,
          post: post,
          analysis: analysis
        });
      }
    }
  }
}
```

## Implementación Paso a Paso {#implementacion}

### 1. Configuración Inicial

```bash
# Instalar dependencias
npm install @nestjs/core @nestjs/common @nestjs/axios @nestjs/config
npm install @nestjs/bull bull redis
npm install facebook-nodejs-business-sdk
npm install @types/facebook-nodejs-business-sdk

# Dependencias de validación
npm install class-validator class-transformer
```

### 2. Variables de Entorno

```env
# .env
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_API_VERSION=v22.0
REDIS_HOST=localhost
REDIS_PORT=6379
RATE_LIMIT_BUFFER=75
```

### 3. Configuración del Módulo Principal

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { FacebookModule } from './facebook/facebook.module';
import { facebookConfig } from './config/facebook.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [facebookConfig],
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
      },
    }),
    ScheduleModule.forRoot(),
    FacebookModule,
  ],
})
export class AppModule {}
```

### 4. Implementación del Controlador

```typescript
// facebook.controller.ts
import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { CompetitorAnalysisService } from './services/competitor-analysis.service';

@Controller('facebook')
export class FacebookController {
  constructor(
    private readonly competitorService: CompetitorAnalysisService,
    private readonly pageContentService: PageContentService
  ) {}

  @Post('analyze-competitors')
  async analyzeCompetitors(@Body() dto: CompetitorAnalysisDto) {
    return this.competitorService.analyzeCompetitors(dto.competitorPageIds);
  }

  @Get('page/:pageId/content')
  async getPageContent(@Param('pageId') pageId: string) {
    return this.pageContentService.analyzePageContent(pageId);
  }

  @Get('page/:pageId/posts')
  async getPagePosts(
    @Param('pageId') pageId: string,
    @Query('limit') limit = 25
  ) {
    return this.competitorService.getPagePosts(pageId, limit);
  }

  @Get('page/:pageId/insights')
  async getPageInsights(
    @Param('pageId') pageId: string,
    @Query('metrics') metrics: string
  ) {
    const metricsArray = metrics.split(',');
    return this.competitorService.getPageInsights(pageId, metricsArray);
  }
}
```

### 5. Configuración de Testing

```typescript
// facebook.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { FacebookService } from './facebook.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

describe('FacebookService', () => {
  let service: FacebookService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FacebookService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
            get: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-value'),
          },
        },
      ],
    }).compile();

    service = module.get<FacebookService>(FacebookService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should handle batch requests correctly', async () => {
    // Test implementation
  });
});
```

## Mejores Prácticas {#mejores-practicas}

### 1. Gestión de Rate Limits
- **Monitoreo proactivo**: Implementar alertas al 75% del límite
- **Backoff exponencial**: Aumentar tiempos de espera progresivamente
- **Distribución de carga**: Espaciar llamadas uniformemente a lo largo del tiempo
- **Cache inteligente**: Reducir llamadas innecesarias con Redis

### 2. Seguridad
- **Tokens seguros**: Nunca hardcodear access tokens
- **Rotación de tokens**: Implementar renovación automática
- **Logs seguros**: No logear información sensible
- **Validación estricta**: Validar todos los inputs con class-validator

### 3. Escalabilidad
- **Microservicios**: Separar funcionalidades en servicios independientes
- **Colas de trabajo**: Usar Bull para procesamiento asíncrono
- **Base de datos por servicio**: Evitar coupling de datos
- **Observabilidad**: Implementar métricas y trazabilidad

### 4. Manejo de Errores
- **Retry automático**: Para errores temporales de red
- **Circuit breaker**: Evitar cascadas de fallos
- **Logging estructurado**: Para debug y monitoreo
- **Graceful degradation**: Funcionalidad limitada en caso de fallo

### 5. Performance
- **Conexiones persistentes**: Reutilizar conexiones HTTP
- **Batch requests**: Agrupar múltiples llamadas
- **Pagination eficiente**: Usar cursor-based pagination
- **Compresión**: Habilitar gzip en requests

### 6. Monitoreo y Alertas
- **Métricas clave**: Rate limit usage, response times, error rates
- **Dashboards**: Visualización en tiempo real con Grafana
- **Alertas inteligentes**: Basadas en tendencias, no solo umbrales
- **Health checks**: Verificación regular de servicios

### Ejemplo de Uso Completo

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  await app.listen(3000);
  console.log('Facebook Graph API Integration Server running on port 3000');
}
bootstrap();
```

Esta guía proporciona una base sólida para integrar Facebook Graph API con NestJS en 2025, siguiendo las mejores prácticas de la industria y preparándose para las restricciones más estrictas de la plataforma.

---

**Nota**: Recuerda siempre consultar la documentación oficial de Facebook para las últimas actualizaciones de la API y cumplir con todas las políticas de privacidad y términos de servicio.