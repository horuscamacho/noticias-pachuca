import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';

// Schemas
import { NewsWebsiteConfig, NewsWebsiteConfigSchema } from './schemas/news-website-config.schema';
import { FacebookPublishingConfig, FacebookPublishingConfigSchema } from './schemas/facebook-publishing-config.schema';
import { GeneratorProJob, GeneratorProJobSchema } from './schemas/generator-pro-job.schema';
import { FacebookPost, FacebookPostSchema } from './schemas/facebook-post.schema';
import { ContentAgent, ContentAgentSchema } from './schemas/content-agent.schema';

// Services
import { GeneratorProOrchestratorService } from './services/generator-pro-orchestrator.service';
import { NewsWebsiteService } from './services/news-website.service';
import { FacebookPublishingService } from './services/facebook-publishing.service';
import { GeneratorProQueueService } from './services/generator-pro-queue.service';
import { FacebookPagesService } from './services/facebook-pages.service';
import { ContentAgentService } from './services/content-agent.service';
import { GeneratorProPromptBuilderService } from './services/generator-pro-prompt-builder.service';
import { DirectorEditorialPromptBuilderService } from './services/director-editorial-prompt-builder.service';
import { SocialMediaCopyGeneratorService } from './services/social-media-copy-generator.service';
import { GeneratorProSchedulerService } from './services/generator-pro-scheduler.service';

// Controllers
import { GeneratorProController } from './controllers/generator-pro.controller';

// External modules
import { ContentAIModule } from '../content-ai/content-ai.module';

// Processors
// import { ExtractionProcessor } from './processors/extraction.processor';
// import { GenerationProcessor } from './processors/generation.processor';
// import { PublishingProcessor } from './processors/publishing.processor';

// External schemas - Solo schemas, EventEmitter2 para comunicación con otros módulos
import { ExtractedNoticia, ExtractedNoticiaSchema } from '../noticias/schemas/extracted-noticia.schema';
import { AIContentGeneration, AIContentGenerationSchema } from '../content-ai/schemas/ai-content-generation.schema';
// Temporalmente deshabilitado para testing manual workflow
// import { PromptTemplate, PromptTemplateSchema } from '../content-ai/schemas/prompt-template.schema';

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


    // 🗄️ REGISTRO DE SCHEMAS MONGODB
    MongooseModule.forFeature([
      // Schemas propios de Generator Pro
      { name: NewsWebsiteConfig.name, schema: NewsWebsiteConfigSchema },
      { name: FacebookPublishingConfig.name, schema: FacebookPublishingConfigSchema },
      { name: GeneratorProJob.name, schema: GeneratorProJobSchema },
      { name: FacebookPost.name, schema: FacebookPostSchema },
      { name: ContentAgent.name, schema: ContentAgentSchema },

      // Schemas de módulos existentes
      { name: ExtractedNoticia.name, schema: ExtractedNoticiaSchema },
      { name: AIContentGeneration.name, schema: AIContentGenerationSchema },
      // Temporalmente deshabilitado para testing manual workflow
      // { name: PromptTemplate.name, schema: PromptTemplateSchema },
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

  controllers: [GeneratorProController],

  providers: [
    // 🤖 SERVICIOS PRINCIPALES
    GeneratorProOrchestratorService,
    NewsWebsiteService,
    FacebookPublishingService,
    GeneratorProQueueService,
    FacebookPagesService,
    ContentAgentService,
    GeneratorProPromptBuilderService,
    DirectorEditorialPromptBuilderService,
    SocialMediaCopyGeneratorService,
    GeneratorProSchedulerService,

    // 🔄 PROCESSORS DE COLAS - Temporalmente deshabilitados para testing
    // ExtractionProcessor,
    // GenerationProcessor,
    // PublishingProcessor,
  ],

  exports: [
    // 📤 EXPORTAR SERVICIOS PARA OTROS MÓDULOS
    GeneratorProOrchestratorService,
    NewsWebsiteService,
    FacebookPublishingService,
    GeneratorProQueueService,
  ],
})
export class GeneratorProModule {
  constructor() {
    console.log('🤖 Generator Pro Module initialized');
  }
}