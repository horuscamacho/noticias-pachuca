import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';

// ✅ Importar módulos existentes
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

// Schemas
import { CompetitorPage, CompetitorPageSchema } from './schemas/competitor-page.schema';
import { FacebookPost, FacebookPostSchema } from './schemas/facebook-post.schema';
import { MonitoringConfig, MonitoringConfigSchema } from './schemas/monitoring-config.schema';

// Services
import { FacebookService } from './services/facebook.service';
import { FacebookRateLimitService } from './services/facebook-rate-limit.service';
import { FacebookQueueService } from './services/facebook-queue.service';
import { CompetitorAnalysisService } from './services/competitor-analysis.service';
import { PageContentService } from './services/page-content.service';
import { FacebookMonitorService } from './services/facebook-monitor.service';

// Controllers
import { FacebookController } from './controllers/facebook.controller';
import { FacebookWebhooksController } from './controllers/facebook-webhooks.controller';

// Guards
import { FacebookWebhookGuard } from './guards/facebook-webhook.guard';

// Common Services
import { PaginationService } from '../common/services/pagination.service';
import { CacheService } from '../services/cache.service';
import { AppConfigService } from '../config/config.service';

@Global() // Global para reutilizar en otros módulos
@Module({
  imports: [
    // ✅ Reutilizar módulos existentes
    AuthModule,
    NotificationsModule,
    ConfigModule,

    // HTTP Client para llamadas a Facebook API
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        timeout: 30000, // 30 seconds timeout
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Pachuca-Noticias-Bot/1.0',
        },
      }),
      inject: [ConfigService],
    }),

    // ✅ Usar BullModule existente para colas de Facebook
    BullModule.registerQueue({
      name: 'facebook-api',
      // Usa la configuración Redis existente del app.module.ts
    }),

    // Schemas de MongoDB
    MongooseModule.forFeature([
      { name: CompetitorPage.name, schema: CompetitorPageSchema },
      { name: FacebookPost.name, schema: FacebookPostSchema },
      { name: MonitoringConfig.name, schema: MonitoringConfigSchema },
    ]),
  ],

  providers: [
    // Common Services
    PaginationService,
    CacheService,
    AppConfigService,

    // Core Services
    FacebookService,
    FacebookRateLimitService,
    FacebookQueueService,
    CompetitorAnalysisService,
    PageContentService,
    FacebookMonitorService,

    // Guards
    FacebookWebhookGuard,
  ],

  controllers: [
    FacebookController,
    FacebookWebhooksController,
  ],

  exports: [
    // Exportar servicios principales para uso en otros módulos
    FacebookService,
    CompetitorAnalysisService,
    PageContentService,
    FacebookMonitorService,
  ],
})
export class FacebookModule {}