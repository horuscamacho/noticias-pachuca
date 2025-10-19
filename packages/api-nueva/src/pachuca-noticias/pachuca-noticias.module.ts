import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { MailModule } from '../modules/mail/mail.module';
import { GeneratorProModule } from '../generator-pro/generator-pro.module'; // 📱 FASE 12: Para SocialMediaPublishingService

// Schemas
import { Site, SiteSchema } from './schemas/site.schema';
import { PublishedNoticia, PublishedNoticiaSchema } from './schemas/published-noticia.schema';
import { PublishingQueue, PublishingQueueSchema } from './schemas/publishing-queue.schema';
import { Category, CategorySchema } from './schemas/category.schema';
import { ContactMessage, ContactMessageSchema } from './schemas/contact-message.schema';
import { Newsletter, NewsletterSchema } from './schemas/newsletter.schema';
import { NewsletterSubscriber, NewsletterSubscriberSchema } from './schemas/newsletter-subscriber.schema';
import { AIContentGeneration, AIContentGenerationSchema } from '../content-ai/schemas/ai-content-generation.schema';
import { ExtractedNoticia, ExtractedNoticiaSchema } from '../noticias/schemas/extracted-noticia.schema';
import { ContentAgent, ContentAgentSchema } from '../content-ai/schemas/content-agent.schema';
import { NewsWebsiteConfig, NewsWebsiteConfigSchema } from '../generator-pro/schemas/news-website-config.schema';
import { ImageBank, ImageBankSchema } from '../image-bank/schemas/image-bank.schema';

// Services
import { SiteDetectionService } from './services/site-detection.service';
import { SitesService } from './services/sites.service'; // 🌐 FASE 7: Gestión de Sites
import { PublishService } from './services/publish.service';
import { PublishSchedulerService } from './services/publish-scheduler.service';
import { PublishingQueueService } from './services/publishing-queue.service';
import { PublishingQueueRecoveryService } from './services/publishing-queue-recovery.service';
import { PublicContentService } from './services/public-content.service';
import { ContactMailService } from './services/contact-mail.service';
import { NewsletterService } from './services/newsletter.service';
import { ImageProcessorService } from './services/image-processor.service';
import { SlugGeneratorService } from './services/slug-generator.service';
import { SeoFeedsService } from './services/seo-feeds.service';
import { AwsS3CoreService } from '../files/services/aws-s3-core.service';

// Interceptors
import { SiteInterceptor } from './interceptors/site.interceptor';

// Processors
import { PublishingQueueProcessor } from './processors/publishing-queue.processor';

// Guards
import { PublishingRateLimitGuard } from './guards/publishing-rate-limit.guard';
import { QueueLimitGuard } from './guards/queue-limit.guard';

// Controllers
import { PachucaNoticiasController } from './controllers/pachuca-noticias.controller';
import { PublicContentController } from './controllers/public-content.controller';
import { SitesController } from './controllers/sites.controller'; // 🌐 FASE 7: API de Sites

/**
 * 📰 Módulo de Pachuca Noticias
 * Gestiona la publicación de contenido generado en el sitio público
 */
@Module({
  imports: [
    // Mongoose schemas
    MongooseModule.forFeature([
      { name: Site.name, schema: SiteSchema }, // 🌐 FASE 0: Multi-sitio
      { name: PublishedNoticia.name, schema: PublishedNoticiaSchema },
      { name: PublishingQueue.name, schema: PublishingQueueSchema },
      { name: Category.name, schema: CategorySchema },
      { name: ContactMessage.name, schema: ContactMessageSchema },
      { name: Newsletter.name, schema: NewsletterSchema },
      { name: NewsletterSubscriber.name, schema: NewsletterSubscriberSchema },
      { name: AIContentGeneration.name, schema: AIContentGenerationSchema },
      { name: ExtractedNoticia.name, schema: ExtractedNoticiaSchema },
      { name: ContentAgent.name, schema: ContentAgentSchema }, // 🌐 FASE 7: Para stats de Sites
      { name: NewsWebsiteConfig.name, schema: NewsWebsiteConfigSchema }, // 🌐 FASE 7: Para stats de Sites
      { name: ImageBank.name, schema: ImageBankSchema }, // 🖼️ FASE 8: Image Bank para publicación
    ]),

    // Mail module para envío de emails de contacto
    MailModule,

    // 📱 FASE 12: Generator Pro Module para Social Media Publishing
    GeneratorProModule,

    // BullMQ queue para publicación programada
    BullModule.registerQueue({
      name: 'publishing-queue',
      defaultJobOptions: {
        attempts: 3, // Reintentar hasta 3 veces
        backoff: {
          type: 'exponential', // Backoff exponencial
          delay: 5000, // 5s, 10s, 20s
        },
        removeOnComplete: false, // 🔥 FIX: No eliminar jobs para persistencia entre reinicios
        removeOnFail: false, // 🔥 FIX: No eliminar jobs fallidos para debugging y recovery
      },
    }),
  ],

  controllers: [
    SitesController, // 🌐 FASE 7: API REST de Sites (DEBE IR PRIMERO - prefijo más específico)
    PublicContentController,
    PachucaNoticiasController, // ← Va al final (prefijo más genérico)
  ],

  providers: [
    // Services
    SiteDetectionService, // 🌐 FASE 1: Detección de sitios multi-tenant
    SitesService, // 🌐 FASE 7: Gestión CRUD de Sites
    PublishService,
    PublishSchedulerService,
    PublishingQueueService,
    PublishingQueueRecoveryService, // 🔥 NUEVO: Recovery automático de jobs
    PublicContentService, // 🌐 FASE 2: APIs públicas
    ContactMailService, // 📧 FASE 3: Servicio de contacto y emails
    NewsletterService, // 📧 FASE 4: Servicio de boletines
    ImageProcessorService,
    SlugGeneratorService,
    SeoFeedsService,
    AwsS3CoreService,

    // Interceptors
    SiteInterceptor, // 🌐 FASE 1: Interceptor de detección de sitios

    // Processors
    PublishingQueueProcessor,

    // Guards
    PublishingRateLimitGuard,
    QueueLimitGuard,
  ],

  exports: [
    PublishService,
    PublishSchedulerService,
    PublishingQueueService,
    ImageProcessorService,
    SlugGeneratorService,
  ],
})
export class PachucaNoticiasModule {}
