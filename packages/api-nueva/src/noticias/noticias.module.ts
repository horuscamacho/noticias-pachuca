import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';

// Schemas
import { NoticiasExtractionConfig, NoticiasExtractionConfigSchema } from './schemas/noticias-extraction-config.schema';
import { ExtractedNoticia, ExtractedNoticiaSchema } from './schemas/extracted-noticia.schema';
import { NoticiasExtractionJob, NoticiasExtractionJobSchema } from './schemas/noticias-extraction-job.schema';
import { NoticiasExtractionLog, NoticiasExtractionLogSchema } from './schemas/noticias-extraction-log.schema';
import { ExternalUrl, ExternalUrlSchema } from './schemas/external-url.schema';

// Services
import { NoticiasScrapingService } from './services/noticias-scraping.service';
import { NoticiasConfigService } from './services/noticias-config.service';
import { NoticiasExtractionService } from './services/noticias-extraction.service';
import { UrlDetectionService } from './services/url-detection.service';
import { NoticiasEventsService } from './services/noticias-events.service';

// Controllers
import { NoticiasController } from './controllers/noticias.controller';

// Processors
import { NoticiasExtractionProcessor } from './processors/noticias-extraction.processor';

// External modules
import { PuppeteerManagerService } from '../modules/reports/services/puppeteer-manager.service';
import { CacheService } from '../services/cache.service';
import { PaginationService } from '../common/services/pagination.service';
import { AppConfigService } from '../config/config.service';

// Facebook schemas needed for URL detection
import { RapidAPIFacebookPost, RapidAPIFacebookPostSchema } from '../rapidapi-facebook/schemas/rapidapi-facebook-post.schema';

/**
 * 📰 Módulo de Noticias - Web Scraping
 *
 * Funcionalidades:
 * - Detección de URLs externas desde posts Facebook
 * - Configuración de selectores CSS por dominio
 * - Extracción automática de contenido de noticias
 * - Queue processing con Bull
 * - Dashboard de gestión
 */
@Module({
  imports: [
    // 🗄️ MongoDB Schemas
    MongooseModule.forFeature([
      { name: NoticiasExtractionConfig.name, schema: NoticiasExtractionConfigSchema },
      { name: ExtractedNoticia.name, schema: ExtractedNoticiaSchema },
      { name: NoticiasExtractionJob.name, schema: NoticiasExtractionJobSchema },
      { name: NoticiasExtractionLog.name, schema: NoticiasExtractionLogSchema },
      { name: ExternalUrl.name, schema: ExternalUrlSchema },
      // Facebook schemas needed for URL detection
      { name: RapidAPIFacebookPost.name, schema: RapidAPIFacebookPostSchema },
    ]),

    // 🔄 Bull Queue para procesamiento asíncrono
    BullModule.registerQueue({
      name: 'noticias-extraction',
      defaultJobOptions: {
        removeOnComplete: 50, // Mantener últimos 50 jobs completados
        removeOnFail: 100, // Mantener últimos 100 jobs fallidos
        attempts: 3, // 3 intentos por defecto
        backoff: {
          type: 'exponential',
          delay: 5000, // Start with 5 seconds
        },
      },
    }),
  ],

  controllers: [
    NoticiasController,
  ],

  providers: [
    // 🔧 Core Services
    NoticiasScrapingService,
    NoticiasConfigService,
    NoticiasExtractionService,
    UrlDetectionService,

    // 🎯 Event Handling
    NoticiasEventsService,

    // 🔄 Queue Processor
    NoticiasExtractionProcessor,

    // 📊 External Services (ya existentes)
    PuppeteerManagerService,
    CacheService,
    PaginationService,
    AppConfigService,
  ],

  exports: [
    // Exportar servicios para uso en otros módulos
    NoticiasScrapingService,
    NoticiasConfigService,
    NoticiasExtractionService,
    UrlDetectionService,
  ],
})
export class NoticiasModule {}