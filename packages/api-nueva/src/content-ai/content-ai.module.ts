import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';

// Schemas
import { AIProvider, AIProviderSchema } from './schemas/ai-provider.schema';
import { PromptTemplate, PromptTemplateSchema } from './schemas/prompt-template.schema';
import { ContentAgent, ContentAgentSchema } from './schemas/content-agent.schema';
import { AIContentGeneration, AIContentGenerationSchema } from './schemas/ai-content-generation.schema';
import { GenerationJob, GenerationJobSchema } from './schemas/generation-job.schema';
import { GenerationLog, GenerationLogSchema } from './schemas/generation-log.schema';
import { ImageGeneration, ImageGenerationSchema } from './schemas/image-generation.schema';

// Services
import { AIProviderService } from './services/ai-provider.service';
import { PromptTemplateService } from './services/prompt-template.service';
import { ContentGenerationService } from './services/content-generation.service';
import { ContentAgentService } from './services/content-agent.service';
import { ProviderFactoryService } from './services/provider-factory.service';
import { MCPClientService } from './services/mcp-client.service';
import { ContentGenerationQueueService } from './services/content-generation-queue.service';
import { CostMonitoringService } from './services/cost-monitoring.service';
import { DeadLetterQueueService } from './services/dead-letter-queue.service';
import { BrandingService } from './services/branding.service';
import { ImageGenerationService } from './services/image-generation.service';
import { ImageGenerationQueueService } from './services/image-generation-queue.service';
import { ImageGenerationNotifierService } from './services/image-generation-notifier.service';
import { ContentAnalyzerService } from './services/content-analyzer.service';
import { EditorialPromptService } from './services/editorial-prompt.service';
import { MetadataBuilderService } from './services/metadata-builder.service';
import { CopyImproverService } from './services/copy-improver.service';

// Controllers
import { ContentAIController } from './controllers/content-ai.controller';
import { ImageGenerationController } from './controllers/image-generation.controller';

// Processors
import { ContentGenerationProcessor } from './processors/content-generation.processor';
import { ImageGenerationProcessor } from './processors/image-generation.processor';

// Adapters
import { OpenAIAdapter } from './adapters/openai.adapter';
import { AnthropicAdapter } from './adapters/anthropic.adapter';

// External modules
import { CacheService } from '../services/cache.service';
import { PaginationService } from '../common/services/pagination.service';
import { AppConfigService } from '../config/config.service';

// External modules
import { ImageBankModule } from '../image-bank/image-bank.module';
import { NotificationsModule } from '../notifications/notifications.module';

// External schemas needed for content generation
import { ExtractedNoticia, ExtractedNoticiaSchema } from '../noticias/schemas/extracted-noticia.schema';
import { ImageBank, ImageBankSchema } from '../image-bank/schemas/image-bank.schema';

/**
 * 🤖 Módulo Content AI Generation
 *
 * Funcionalidades:
 * - Gestión de proveedores IA (OpenAI, Anthropic, Google)
 * - Templates dinámicos para agentes editoriales
 * - Generación automática de contenido periodístico
 * - Model Context Protocol (MCP) para interoperabilidad
 * - Queue processing con Bull para batch operations
 * - Cost tracking y performance monitoring
 * - Adapter pattern para múltiples providers
 */
@Module({
  imports: [
    // 🗄️ MongoDB Schemas
    MongooseModule.forFeature([
      { name: AIProvider.name, schema: AIProviderSchema },
      { name: PromptTemplate.name, schema: PromptTemplateSchema },
      { name: ContentAgent.name, schema: ContentAgentSchema },
      { name: AIContentGeneration.name, schema: AIContentGenerationSchema },
      { name: GenerationJob.name, schema: GenerationJobSchema },
      { name: GenerationLog.name, schema: GenerationLogSchema },
      { name: ImageGeneration.name, schema: ImageGenerationSchema },
      // External schemas needed for content reference
      { name: ExtractedNoticia.name, schema: ExtractedNoticiaSchema },
      { name: ImageBank.name, schema: ImageBankSchema },
    ]),

    // 🖼️ Image Bank Module (for AI image processing)
    ImageBankModule,

    // 📡 Notifications Module (for socket communication)
    NotificationsModule,

    // 🔄 Bull Queue para AI content generation
    BullModule.registerQueue({
      name: 'content-generation',
      defaultJobOptions: {
        removeOnComplete: 100, // Mantener últimos 100 jobs completados
        removeOnFail: 200, // Mantener últimos 200 jobs fallidos para debugging
        attempts: 3, // 3 intentos por defecto con failover
        backoff: {
          type: 'exponential',
          delay: 2000, // Start with 2 seconds
        },
      },
      settings: {
        stalledInterval: 30 * 1000, // 30 seconds
        maxStalledCount: 1, // Max 1 stalled job antes de marcarlo como failed
      },
    }),

    // 🔄 Bull Queue para dead letter queue (jobs fallidos)
    BullModule.registerQueue({
      name: 'dead-letter-queue',
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 100, // Mantener más jobs fallidos en DLQ
        attempts: 1, // Solo 1 intento en DLQ
        backoff: {
          type: 'fixed',
          delay: 5000,
        },
      },
      settings: {
        stalledInterval: 60 * 1000, // 60 seconds para DLQ
        maxStalledCount: 1,
      },
    }),

    // 🔄 Bull Queue para cost tracking y analytics (DISABLED - not used yet)
    // BullModule.registerQueue({
    //   name: 'content-ai-analytics',
    //   defaultJobOptions: {
    //     removeOnComplete: 50,
    //     removeOnFail: 50,
    //     attempts: 2,
    //     backoff: {
    //       type: 'fixed',
    //       delay: 5000,
    //     },
    //   },
    // }),

    // 🔄 Bull Queue para image generation
    BullModule.registerQueue({
      name: 'image-generation',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: false,
        removeOnFail: false,
      },
    }),
  ],

  controllers: [
    ContentAIController,
    ImageGenerationController,
  ],

  providers: [
    // 🔧 Core Services
    AIProviderService,
    PromptTemplateService,
    ContentGenerationService,
    ContentAgentService,
    BrandingService,
    ImageGenerationService,
    ContentAnalyzerService,
    EditorialPromptService,
    MetadataBuilderService,
    CopyImproverService,

    // 🔄 Queue Services
    ContentGenerationQueueService,
    ImageGenerationQueueService,
    CostMonitoringService,
    DeadLetterQueueService,

    // 📡 Socket Notifiers
    ImageGenerationNotifierService,

    // 🏭 Factory Pattern
    ProviderFactoryService,

    // 🌐 Model Context Protocol
    MCPClientService,

    // 🔌 Provider Adapters with Configuration
    {
      provide: OpenAIAdapter,
      useFactory: async (configService: AppConfigService) => {
        const adapter = new OpenAIAdapter();
        const openAIConfig = configService.openAIConfig;

        await adapter.configure({
          apiKey: openAIConfig.apiKey,
          model: openAIConfig.model,
          defaultParams: {
            maxTokens: openAIConfig.maxTokens,
            temperature: openAIConfig.temperature,
          },
        });

        return adapter;
      },
      inject: [AppConfigService],
    },
    AnthropicAdapter,

    // 🔄 Queue Processors
    ContentGenerationProcessor,
    ImageGenerationProcessor,

    // 📊 External Services (ya existentes)
    CacheService,
    PaginationService,
    AppConfigService,
  ],

  exports: [
    // Exportar servicios para uso en otros módulos
    ContentGenerationService,
    AIProviderService,
    PromptTemplateService,
    ContentAgentService,
    ProviderFactoryService,
    MCPClientService,
    BrandingService,
    ImageGenerationService,
    ImageGenerationQueueService,
    ContentAnalyzerService,
    EditorialPromptService,
    MetadataBuilderService,
  ],
})
export class ContentAIModule {}