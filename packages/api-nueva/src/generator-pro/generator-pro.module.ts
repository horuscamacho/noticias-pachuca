import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';

// Schemas
import { NewsWebsiteConfig, NewsWebsiteConfigSchema } from './schemas/news-website-config.schema';
import { FacebookPublishingConfig, FacebookPublishingConfigSchema } from './schemas/facebook-publishing-config.schema';
import { TwitterPublishingConfig, TwitterPublishingConfigSchema } from './schemas/twitter-publishing-config.schema';
import { GeneratorProJob, GeneratorProJobSchema } from './schemas/generator-pro-job.schema';
import { GeneratorProFacebookPost, FacebookPostSchema } from './schemas/facebook-post.schema'; // ✅ FIX: Usar nuevo nombre
import { TwitterPost, TwitterPostSchema } from './schemas/twitter-post.schema';
import { ContentAgent, ContentAgentSchema } from './schemas/content-agent.schema';
import { UserGeneratedContent, UserGeneratedContentSchema } from './schemas/user-generated-content.schema';
import { ExtractedUrlTracking, ExtractedUrlTrackingSchema } from './schemas/extracted-url-tracking.schema';
import { UrlExtractionLog, UrlExtractionLogSchema } from './schemas/url-extraction-log.schema';

// Services
import { GeneratorProOrchestratorService } from './services/generator-pro-orchestrator.service';
import { NewsWebsiteService } from './services/news-website.service';
import { FacebookPublishingService } from './services/facebook-publishing.service';
import { TwitterPublishingService } from './services/twitter-publishing.service';
import { GeneratorProQueueService } from './services/generator-pro-queue.service';
import { FacebookPagesService } from './services/facebook-pages.service';
import { TwitterAccountsService } from './services/twitter-accounts.service';
import { SocialMediaPublishingService } from './services/social-media-publishing.service';
import { ContentAgentService } from './services/content-agent.service';
import { GeneratorProPromptBuilderService } from './services/generator-pro-prompt-builder.service';
import { DirectorEditorialPromptBuilderService } from './services/director-editorial-prompt-builder.service';
import { SocialMediaCopyGeneratorService } from './services/social-media-copy-generator.service';
import { GeneratorProSchedulerService } from './services/generator-pro-scheduler.service';
import { UrlExtractionService } from './services/url-extraction.service';
import { SmartExtractionSchedulerService } from './services/smart-extraction-scheduler.service';
import { UserContentService } from './services/user-content.service';
import { UrgentContentSchedulerService } from './services/urgent-content-scheduler.service';

// Controllers
import { GeneratorProController } from './controllers/generator-pro.controller';
import { SocialMediaAccountsController } from './controllers/social-media-accounts.controller';
import { TwitterPublishingController } from './controllers/twitter-publishing.controller';
import { ExtractionManagementController } from './controllers/extraction-management.controller';

// External modules
import { ContentAIModule } from '../content-ai/content-ai.module';
import { ReportsModule } from '../modules/reports/reports.module'; // 🎭 Import para PuppeteerManagerService

// Processors
import { ExtractionProcessor } from './processors/extraction.processor';

// External schemas - Solo schemas, EventEmitter2 para comunicación con otros módulos
import { ExtractedNoticia, ExtractedNoticiaSchema } from '../noticias/schemas/extracted-noticia.schema';
import { AIContentGeneration, AIContentGenerationSchema } from '../content-ai/schemas/ai-content-generation.schema';
import { PublishedNoticia, PublishedNoticiaSchema } from '../pachuca-noticias/schemas/published-noticia.schema';
import { Site, SiteSchema } from '../pachuca-noticias/schemas/site.schema';

/**
 * 🤖 Módulo Generator Pro - Sistema automatizado completo
 * Extracción → Generación → Publicación en Facebook
 */
@Module({
  imports: [
    // ⚙️ CONFIGURACIÓN GLOBAL
    ConfigModule,

    // ⏰ SCHEDULER MODULE
    ScheduleModule.forRoot(),

    // 🤖 CONTENT AI MODULE
    ContentAIModule,

    // 🎭 REPORTS MODULE (para PuppeteerManagerService)
    ReportsModule,


    // 🗄️ REGISTRO DE SCHEMAS MONGODB
    MongooseModule.forFeature([
      // Schemas propios de Generator Pro
      { name: NewsWebsiteConfig.name, schema: NewsWebsiteConfigSchema },
      { name: FacebookPublishingConfig.name, schema: FacebookPublishingConfigSchema },
      { name: TwitterPublishingConfig.name, schema: TwitterPublishingConfigSchema }, // 🐦 FASE 10: Twitter config
      { name: GeneratorProJob.name, schema: GeneratorProJobSchema },
      { name: GeneratorProFacebookPost.name, schema: FacebookPostSchema }, // ✅ FIX: Nuevo nombre para evitar conflicto
      { name: TwitterPost.name, schema: TwitterPostSchema }, // 🐦 FASE 10: Twitter posts
      { name: ContentAgent.name, schema: ContentAgentSchema },
      { name: UserGeneratedContent.name, schema: UserGeneratedContentSchema }, // 📝 FASE 1: User Generated Content (Manual)
      { name: ExtractedUrlTracking.name, schema: ExtractedUrlTrackingSchema }, // 🔍 Smart URL Extraction: Tracking
      { name: UrlExtractionLog.name, schema: UrlExtractionLogSchema }, // 🔍 Smart URL Extraction: Logs

      // Schemas de módulos existentes
      { name: ExtractedNoticia.name, schema: ExtractedNoticiaSchema },
      { name: AIContentGeneration.name, schema: AIContentGenerationSchema },
      { name: PublishedNoticia.name, schema: PublishedNoticiaSchema }, // 📝 FASE 3: Para UserContentService
      { name: Site.name, schema: SiteSchema }, // 🌐 FASE 9: Agregar Site schema
    ]),

    // 🔄 CONFIGURACIÓN DE COLAS BULL QUEUE
    BullModule.registerQueue(
      // Cola para extracción de URLs y contenido
      {
        name: 'generator-pro-extraction',
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 100,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      },
      // Cola para generación de contenido con IA
      {
        name: 'generator-pro-generation',
        defaultJobOptions: {
          removeOnComplete: 30,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 10000,
          },
        },
      },
      // Cola para publicación en Facebook
      {
        name: 'generator-pro-publishing',
        defaultJobOptions: {
          removeOnComplete: 20,
          removeOnFail: 30,
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 30000,
          },
        },
      },
    ),
  ],

  controllers: [
    GeneratorProController,
    SocialMediaAccountsController, // 📱 FASE 11: Social Media Accounts (GetLate)
    TwitterPublishingController, // 🐦 FASE 11: Twitter Publishing Config CRUD
    ExtractionManagementController, // 🔍 FASE 4: Extraction Management (Smart URL Extraction)
  ],

  providers: [
    // 🤖 SERVICIOS PRINCIPALES
    GeneratorProOrchestratorService,
    NewsWebsiteService,
    FacebookPublishingService,
    TwitterPublishingService, // 🐦 FASE 10: Twitter publishing
    GeneratorProQueueService,
    FacebookPagesService,
    TwitterAccountsService, // 🐦 FASE 10: Twitter accounts
    SocialMediaPublishingService, // 📱 FASE 10: Orquestador multi-plataforma
    ContentAgentService,
    GeneratorProPromptBuilderService,
    DirectorEditorialPromptBuilderService,
    SocialMediaCopyGeneratorService,
    GeneratorProSchedulerService,

    // 🔍 SMART URL EXTRACTION SYSTEM
    UrlExtractionService,
    SmartExtractionSchedulerService,

    // 📝 USER GENERATED CONTENT (Manual Content Creation)
    UserContentService,
    UrgentContentSchedulerService, // ⏰ Auto-cierre de contenido urgent después de 2 horas

    // 🔄 PROCESSOR - Solo extracción de contenido
    ExtractionProcessor,
  ],

  exports: [
    // 📤 EXPORTAR SERVICIOS PARA OTROS MÓDULOS
    GeneratorProOrchestratorService,
    NewsWebsiteService,
    FacebookPublishingService,
    TwitterPublishingService, // 🐦 FASE 10: Twitter publishing
    SocialMediaPublishingService, // 📱 FASE 12: Social media orchestrator
    GeneratorProQueueService,
    UrlExtractionService, // 🔍 Smart URL Extraction
    SmartExtractionSchedulerService, // 🔍 Smart Extraction Scheduler
  ],
})
export class GeneratorProModule {
  constructor() {
    console.log('🤖 Generator Pro Module initialized');
  }
}