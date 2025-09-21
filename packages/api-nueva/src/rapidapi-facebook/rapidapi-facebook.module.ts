import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';

// ✅ Importar módulos existentes
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

// Schemas
import { RapidAPIConfig, RapidAPIConfigSchema } from './schemas/rapidapi-config.schema';
import { RapidAPIFacebookPage, RapidAPIFacebookPageSchema } from './schemas/rapidapi-facebook-page.schema';
import { RapidAPIFacebookPost, RapidAPIFacebookPostSchema } from './schemas/rapidapi-facebook-post.schema';
import { RapidAPIExtractionLog, RapidAPIExtractionLogSchema } from './schemas/rapidapi-extraction-log.schema';
import { RapidAPIExtractionJob, RapidAPIExtractionJobSchema } from './schemas/rapidapi-extraction-job.schema';

// Services
import { RapidAPIFacebookService } from './services/rapidapi-facebook.service';
import { RapidAPIConfigService } from './services/rapidapi-config.service';
import { RapidAPIPageManagementService } from './services/rapidapi-page-management.service';

// Controllers
import { RapidAPIFacebookController } from './controllers/rapidapi-facebook.controller';

// Processors
import { ExtractionProcessor } from './processors/extraction.processor';

// Common Services - ✅ Usar servicios existentes
import { PaginationService } from '../common/services/pagination.service';
import { CacheService } from '../services/cache.service';
import { AppConfigService } from '../config/config.service';

@Global() // Global para reutilizar en otros módulos
@Module({
  imports: [
    // ✅ Reutilizar módulos existentes
    AuthModule,
    ConfigModule,
    NotificationsModule,

    // HTTP Client para llamadas a RapidAPI
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        timeout: 30000, // 30 seconds timeout
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Pachuca-Noticias-RapidAPI/1.0',
        },
      }),
      inject: [ConfigService],
    }),

    // Schemas de MongoDB
    MongooseModule.forFeature([
      { name: RapidAPIConfig.name, schema: RapidAPIConfigSchema },
      { name: RapidAPIFacebookPage.name, schema: RapidAPIFacebookPageSchema },
      { name: RapidAPIFacebookPost.name, schema: RapidAPIFacebookPostSchema },
      { name: RapidAPIExtractionLog.name, schema: RapidAPIExtractionLogSchema },
      { name: RapidAPIExtractionJob.name, schema: RapidAPIExtractionJobSchema },
    ]),

    // Bull Queue for async processing
    BullModule.registerQueue({
      name: 'rapidapi-extraction',
    }),
  ],

  providers: [
    // Common Services - ✅ Usar misma implementación que ContentExtractionFacebookModule
    PaginationService,
    AppConfigService,
    CacheService,

    // Core Services
    RapidAPIFacebookService,
    RapidAPIConfigService,
    RapidAPIPageManagementService,

    // Processors
    ExtractionProcessor,
  ],

  controllers: [
    RapidAPIFacebookController,
  ],

  exports: [
    // Exportar servicios principales para uso en otros módulos
    RapidAPIFacebookService,
    RapidAPIConfigService,
    RapidAPIPageManagementService,
  ],
})
export class RapidAPIFacebookModule {}