import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';

import {
  ContentRecyclingSchedule,
  ContentRecyclingScheduleSchema,
} from './schemas/content-recycling-schedule.schema';
import {
  ScheduledPost,
  ScheduledPostSchema,
} from './schemas/scheduled-post.schema';
import {
  CommunityManagerConfig,
  CommunityManagerConfigSchema,
} from './schemas/community-manager-config.schema';
import {
  ABTestExperiment,
  ABTestExperimentSchema,
} from './schemas/ab-test-experiment.schema';

// Importar schemas de otros módulos
import {
  AIContentGeneration,
  AIContentGenerationSchema,
} from '../content-ai/schemas/ai-content-generation.schema';
import {
  PublishedNoticia,
  PublishedNoticiaSchema,
} from '../pachuca-noticias/schemas/published-noticia.schema';
import {
  FacebookPublishingConfig,
  FacebookPublishingConfigSchema,
} from '../generator-pro/schemas/facebook-publishing-config.schema';
import {
  TwitterPublishingConfig,
  TwitterPublishingConfigSchema,
} from '../generator-pro/schemas/twitter-publishing-config.schema';

// FASE 1: Services
import { ContentCopyUpdaterService } from './services/content-copy-updater.service';
// FASE 2: Services
import { IntelligentSchedulerService } from './services/intelligent-scheduler.service';
// FASE 3: Services
import { ContentRecyclingService } from './services/content-recycling.service';
// FASE 4: Services
import { CommunityManagerService } from './services/community-manager.service';
// FASE 5: Processors y Listeners
import { ScheduledPostsProcessor } from './processors/scheduled-posts.processor';
import { ScheduledPostListener } from './listeners/scheduled-post.listener';
// FASE 6: Controllers
import { CommunityManagerController } from './controllers/community-manager.controller';
import { ContentRecyclingController } from './controllers/content-recycling.controller';
// FASE 9: Analytics Controller
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsSyncController } from './controllers/analytics-sync.controller';
// FASE 8: Publishing, Cron y Cleanup Services
import { SocialMediaPublisherService } from './services/social-media-publisher.service';
import { ScheduledPostsCronService } from './services/scheduled-posts-cron.service';
import { CleanupService } from './services/cleanup.service';
import { GetLateAnalyticsSyncService } from './services/getlate-analytics-sync.service';
// FASE 9: Advanced Features Services
import { AnalyticsService } from './services/analytics.service';
import { PerformanceAnalyzerService } from './services/performance-analyzer.service';
import { OptimalTimePredictorService } from './services/optimal-time-predictor.service';
import { ABTestingService } from './services/ab-testing.service';
import { AutoOptimizationService } from './services/auto-optimization.service';

// Importar módulos necesarios
import { ContentAIModule } from '../content-ai/content-ai.module';

/**
 * 🤖 Community Manager Module
 *
 * Gestiona publicación inteligente en redes sociales con:
 * - Actualización de copys con URLs usando IA
 * - Scheduling inteligente según mejores prácticas 2026
 * - Reciclaje automatizado de contenido evergreen
 * - Analytics y optimización continua
 *
 * FASE 0: Estructura base y schemas ✅
 * FASE 1: Content Copy Updater Service ✅
 * FASE 2: Intelligent Scheduler Service ✅
 * FASE 3: Content Recycling Service ✅
 * FASE 4: Community Manager Orchestrator ✅
 * FASE 5: BullMQ Queue + Processors ✅
 * FASE 6: Controllers y Endpoints REST ✅
 * FASE 8: Cron Jobs & Auto-Processing ✅
 * FASE 8.5: GetLate Analytics Auto-Sync ✅
 * FASE 9: Advanced Features (Analytics, A/B Testing, Auto-Optimization) ✅
 */
@Module({
  imports: [
    // ⏰ SCHEDULE MODULE - Para cron jobs
    ScheduleModule.forRoot(),

    MongooseModule.forFeature([
      { name: ContentRecyclingSchedule.name, schema: ContentRecyclingScheduleSchema },
      { name: ScheduledPost.name, schema: ScheduledPostSchema },
      { name: CommunityManagerConfig.name, schema: CommunityManagerConfigSchema },
      { name: ABTestExperiment.name, schema: ABTestExperimentSchema }, // FASE 9
      // Schemas de otros módulos
      { name: AIContentGeneration.name, schema: AIContentGenerationSchema },
      { name: PublishedNoticia.name, schema: PublishedNoticiaSchema },
      // Schemas de generator-pro para publicación
      { name: FacebookPublishingConfig.name, schema: FacebookPublishingConfigSchema },
      { name: TwitterPublishingConfig.name, schema: TwitterPublishingConfigSchema },
    ]),
    // 🔄 BULL QUEUE - SCHEDULED POSTS
    BullModule.registerQueue({
      name: 'scheduled-posts',
    }),
    ContentAIModule, // Para usar AIProviderService y ProviderFactoryService
  ],
  controllers: [
    // FASE 6: Controllers REST
    CommunityManagerController,
    ContentRecyclingController,
    // FASE 9: Analytics Controllers
    AnalyticsController,
    AnalyticsSyncController,
  ],
  providers: [
    // FASE 1: Content Copy Updater
    ContentCopyUpdaterService,
    // FASE 2: Intelligent Scheduler
    IntelligentSchedulerService,
    // FASE 3: Content Recycling
    ContentRecyclingService,
    // FASE 4: Orchestrator (usa todos los anteriores)
    CommunityManagerService,
    // FASE 5: Processors y Listeners
    ScheduledPostsProcessor,
    ScheduledPostListener,
    // FASE 8: Publishing, Cron y Cleanup
    SocialMediaPublisherService,
    ScheduledPostsCronService,
    CleanupService,
    GetLateAnalyticsSyncService,
    // FASE 9: Advanced Features
    AnalyticsService,
    PerformanceAnalyzerService,
    OptimalTimePredictorService,
    ABTestingService,
    AutoOptimizationService,
  ],
  exports: [
    // Exports para usar en otros módulos
    ContentCopyUpdaterService,
    IntelligentSchedulerService,
    ContentRecyclingService,
    CommunityManagerService, // Servicio principal orquestador
  ],
})
export class CommunityManagerModule {}
