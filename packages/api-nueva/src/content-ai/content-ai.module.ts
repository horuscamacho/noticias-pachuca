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

// Controllers
import { ContentAIController } from './controllers/content-ai.controller';

// Processors
import { ContentGenerationProcessor } from './processors/content-generation.processor';

// Adapters
import { OpenAIAdapter } from './adapters/openai.adapter';
import { AnthropicAdapter } from './adapters/anthropic.adapter';

// External modules
import { CacheService } from '../services/cache.service';
import { PaginationService } from '../common/services/pagination.service';
import { AppConfigService } from '../config/config.service';

// External schemas needed for content generation
import { ExtractedNoticia, ExtractedNoticiaSchema } from '../noticias/schemas/extracted-noticia.schema';

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
      // External schemas needed for content reference
      { name: ExtractedNoticia.name, schema: ExtractedNoticiaSchema },
    ]),

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
  ],

  controllers: [
    ContentAIController,
  ],

  providers: [
    // 🔧 Core Services
    AIProviderService,
    PromptTemplateService,
    ContentGenerationService,
    ContentAgentService,

    // 🔄 Queue Services
    ContentGenerationQueueService,
    CostMonitoringService,
    DeadLetterQueueService,

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
  ],
})
export class ContentAIModule {}