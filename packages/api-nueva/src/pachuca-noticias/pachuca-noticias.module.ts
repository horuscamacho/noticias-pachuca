import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { MailModule } from '../modules/mail/mail.module';

// Schemas
import { PublishedNoticia, PublishedNoticiaSchema } from './schemas/published-noticia.schema';
import { PublishingQueue, PublishingQueueSchema } from './schemas/publishing-queue.schema';
import { Category, CategorySchema } from './schemas/category.schema';
import { ContactMessage, ContactMessageSchema } from './schemas/contact-message.schema';
import { Newsletter, NewsletterSchema } from './schemas/newsletter.schema';
import { NewsletterSubscriber, NewsletterSubscriberSchema } from './schemas/newsletter-subscriber.schema';
import { AIContentGeneration, AIContentGenerationSchema } from '../content-ai/schemas/ai-content-generation.schema';
import { ExtractedNoticia, ExtractedNoticiaSchema } from '../noticias/schemas/extracted-noticia.schema';

// Services
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

// Processors
import { PublishingQueueProcessor } from './processors/publishing-queue.processor';

// Guards
import { PublishingRateLimitGuard } from './guards/publishing-rate-limit.guard';
import { QueueLimitGuard } from './guards/queue-limit.guard';

// Controllers
import { PachucaNoticiasController } from './controllers/pachuca-noticias.controller';
import { PublicContentController } from './controllers/public-content.controller';

/**
 * 📰 Módulo de Pachuca Noticias
 * Gestiona la publicación de contenido generado en el sitio público
 */
@Module({
  imports: [
    // Mongoose schemas
    MongooseModule.forFeature([
      { name: PublishedNoticia.name, schema: PublishedNoticiaSchema },
      { name: PublishingQueue.name, schema: PublishingQueueSchema },
      { name: Category.name, schema: CategorySchema },
      { name: ContactMessage.name, schema: ContactMessageSchema },
      { name: Newsletter.name, schema: NewsletterSchema },
      { name: NewsletterSubscriber.name, schema: NewsletterSubscriberSchema },
      { name: AIContentGeneration.name, schema: AIContentGenerationSchema },
      { name: ExtractedNoticia.name, schema: ExtractedNoticiaSchema },
    ]),

    // Mail module para envío de emails de contacto
    MailModule,

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
    PachucaNoticiasController,
    PublicContentController,
  ],

  providers: [
    // Services
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
