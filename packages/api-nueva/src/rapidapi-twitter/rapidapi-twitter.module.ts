import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';

// ✅ Importar módulos existentes
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

// Schemas
import { RapidAPITwitterConfig, RapidAPITwitterConfigSchema } from './schemas/rapidapi-twitter-config.schema';
import { RapidAPITwitterUser, RapidAPITwitterUserSchema } from './schemas/rapidapi-twitter-user.schema';
import { RapidAPITwitterPost, RapidAPITwitterPostSchema } from './schemas/rapidapi-twitter-post.schema';
import { RapidAPITwitterExtractionLog, RapidAPITwitterExtractionLogSchema } from './schemas/rapidapi-twitter-extraction-log.schema';
import { RapidAPITwitterExtractionJob, RapidAPITwitterExtractionJobSchema } from './schemas/rapidapi-twitter-extraction-job.schema';

// Services
import { RapidAPITwitterService } from './services/rapidapi-twitter.service';
import { RapidAPITwitterConfigService } from './services/rapidapi-twitter-config.service';
import { RapidAPITwitterUserManagementService } from './services/rapidapi-twitter-user-management.service';

// Controllers
import { RapidAPITwitterController } from './controllers/rapidapi-twitter.controller';

// Processors
// import { TwitterExtractionProcessor } from './processors/twitter-extraction.processor';

// Common Services - ✅ Usar servicios existentes
import { PaginationService } from '../common/services/pagination.service';
import { CacheService } from '../services/cache.service';
import { AppConfigService } from '../config/config.service';

// EventEmitter2 para comunicación entre módulos sin dependencias circulares

@Global() // Global para reutilizar en otros módulos
@Module({
  imports: [
    // ✅ Reutilizar módulos existentes
    AuthModule,
    ConfigModule,
    NotificationsModule,

    // HTTP Client para llamadas a RapidAPI Twitter
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        timeout: 30000, // 30 seconds timeout
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Pachuca-Noticias-RapidAPI-Twitter/1.0',
        },
      }),
      inject: [ConfigService],
    }),

    // Schemas de MongoDB
    MongooseModule.forFeature([
      { name: RapidAPITwitterConfig.name, schema: RapidAPITwitterConfigSchema },
      { name: RapidAPITwitterUser.name, schema: RapidAPITwitterUserSchema },
      { name: RapidAPITwitterPost.name, schema: RapidAPITwitterPostSchema },
      { name: RapidAPITwitterExtractionLog.name, schema: RapidAPITwitterExtractionLogSchema },
      { name: RapidAPITwitterExtractionJob.name, schema: RapidAPITwitterExtractionJobSchema },
    ]),

    // Bull Queue for async processing
    BullModule.registerQueue({
      name: 'rapidapi-twitter-extraction',
    }),
  ],

  providers: [
    // Common Services - ✅ Usar misma implementación que RapidAPIFacebookModule
    PaginationService,
    AppConfigService,
    CacheService,

    // Core Services
    RapidAPITwitterService,
    RapidAPITwitterConfigService,
    RapidAPITwitterUserManagementService,

    // Comunicación con EventEmitter2 - sin servicios de noticias para evitar referencias circulares

    // Processors
    // TwitterExtractionProcessor, // TODO: Implement processor
  ],

  controllers: [
    RapidAPITwitterController,
  ],

  exports: [
    // Exportar servicios principales para uso en otros módulos
    RapidAPITwitterService,
    RapidAPITwitterConfigService,
    RapidAPITwitterUserManagementService,
  ],
})
export class RapidAPITwitterModule {}