import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import { EventEmitterModule } from '@nestjs/event-emitter';
import KeyvRedis from '@keyv/redis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';
import { AppConfigModule } from './config/config.module';
import { CacheService } from './services/cache.service';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './modules/mail/mail.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { PaymentsModule } from './payments/payments.module';
import { FacebookModule } from './facebook/facebook.module';
import { ContentExtractionFacebookModule } from './content-extraction-facebook/content-extraction-facebook.module';
import { RapidAPIFacebookModule } from './rapidapi-facebook/rapidapi-facebook.module';
import { RapidAPITwitterModule } from './rapidapi-twitter/rapidapi-twitter.module';
import { NoticiasModule } from './noticias/noticias.module';
// import { ContentAIModule } from './content-ai/content-ai.module';
import { GeneratorProModule } from './generator-pro/generator-pro.module';
import { PachucaNoticiasModule } from './pachuca-noticias/pachuca-noticias.module';
import { AiExtractionModule } from './ai-extraction/ai-extraction.module';
import { ImageBankModule } from './image-bank/image-bank.module';

// Función para seleccionar .env por ambiente
function getEnvFilePath() {
  const ENV = process.env.NODE_ENV;
  return !ENV ? '.env' : `.env.${ENV}`;
}

@Module({
  imports: [
    // ✅ ConfigModule DEBE ser el primer import
    ConfigModule.forRoot({
      isGlobal: true, // 🔥 Disponible en toda la app
      load: [configuration], // Configuración tipada
      envFilePath: getEnvFilePath(), // .env por ambiente
      validationSchema: validationSchema, // Validación con Joi
      validationOptions: {
        allowUnknown: true, // Permitir variables no definidas (para npm/yarn)
        abortEarly: true, // Falla al primer error
      },
    }),

    // 🔧 AppConfigModule - Global configuration wrapper
    AppConfigModule,

    // 🔥 CONFIGURACIÓN MONGOOSE 2025 CON MEJORES PRÁCTICAS
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('config.database.url'),

        // 🚀 OPCIONES RECOMENDADAS 2025
        maxPoolSize: 10, // Máximo 10 conexiones concurrentes
        serverSelectionTimeoutMS: 5000, // Timeout de conexión
        socketTimeoutMS: 45000, // Timeout de socket
        family: 4, // Usar IPv4, saltarse IPv6

        // 🔧 Configuraciones avanzadas
        retryWrites: true,
        w: 'majority',
        readPreference: 'primary',

        // 🛡️ Configuraciones de seguridad
        // SSL siempre habilitado para MongoDB Atlas (detecta mongodb+srv://)
        ssl: configService.get<string>('config.database.url')?.includes('mongodb+srv://') ||
             configService.get<string>('config.app.nodeEnv') === 'production',
        authSource: configService.get<string>('config.database.url')?.includes('mongodb+srv://') ? undefined : 'admin',

        // 📊 Configuraciones de performance
        bufferCommands: false,
      }),
      inject: [ConfigService],
    }),

    // 🔥 CONFIGURACIÓN CACHE MANAGER CON REDIS 2025 (NestJS 11)
    // ⚠️ ARQUITECTURA MODERNA REDIS - USAR SIEMPRE ESTE PATRÓN
    //
    // ✅ STACK RECOMENDADO 2025:
    // - @nestjs/cache-manager (oficial NestJS)
    // - @keyv/redis (adaptador moderno)
    // - cache-manager v5+
    //
    // 🚫 NO USAR:
    // - @liaoliaots/nestjs-redis (deprecado)
    // - nestjs-redis (obsoleto)
    // - ioredis directo
    //
    // 🎯 Para CUALQUIER operación Redis nueva, usar CacheService
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        stores: [new KeyvRedis(configService.get<string>('config.redis.url'))],
        ttl: (configService.get<number>('config.cache.ttl') || 600) * 1000, // Convertir a ms
        max: 1000, // Máximo elementos en cache
      }),
      inject: [ConfigService],
    }),

    // 🔄 BULL QUEUE CONFIGURATION FOR ASYNC JOBS
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('config.redis.host') || 'localhost',
          port: configService.get<number>('config.redis.port') || 6379,
          password: configService.get<string>('config.redis.password'),
          db: configService.get<number>('config.redis.db') || 0,
          enableOfflineQueue: true, // 🔥 FIX: Persistir cuando Redis está offline
          maxRetriesPerRequest: 3,  // 🔥 FIX: Reintentar conexión
        },
        defaultJobOptions: {
          removeOnComplete: false,  // 🔥 FIX: No eliminar jobs completados
          removeOnFail: false,      // 🔥 FIX: No eliminar jobs fallidos
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
        settings: {
          lockDuration: 30000,       // 30 segundos
          stalledInterval: 5000,     // Check cada 5s si jobs están stalled
          maxStalledCount: 3,        // Máximo 3 veces stalled antes de fail
        },
      }),
      inject: [ConfigService],
    }),

    // 🎯 EVENT EMITTER MODULE - RESOLVER DEPENDENCIAS CIRCULARES
    EventEmitterModule.forRoot(),

    // 📘 RAPIDAPI FACEBOOK MODULE - MOVER AL INICIO PARA DEBUG
    RapidAPIFacebookModule,

    // 🐦 RAPIDAPI TWITTER MODULE
    RapidAPITwitterModule,

    // 🔐 AUTHENTICATION MODULE
    AuthModule,

    // 📧 MAIL MODULE
    MailModule,

    // 📊 ANALYTICS MODULE
    AnalyticsModule,

    // 🔔 NOTIFICATIONS MODULE
    NotificationsModule,

    // 📊 REPORTS MODULE
    ReportsModule,

    // 💳 PAYMENTS MODULE
    PaymentsModule,

    // 📘 FACEBOOK MODULE
    FacebookModule,

    // 📘 CONTENT EXTRACTION FACEBOOK MODULE
    ContentExtractionFacebookModule,

    // 📰 NOTICIAS MODULE - WEB SCRAPING DE NOTICIAS
    NoticiasModule,

    // 🤖 CONTENT AI MODULE - AI CONTENT GENERATION SYSTEM (Temporalmente deshabilitado para testing manual workflow)
    // ContentAIModule,

    // 🤖 GENERATOR PRO MODULE - AUTOMATED NEWS SYSTEM
    GeneratorProModule,

    // 📰 PACHUCA NOTICIAS MODULE - PUBLICACIÓN DE CONTENIDO GENERADO
    PachucaNoticiasModule,

    // 🤖 AI EXTRACTION MODULE - INTELLIGENT SELECTOR DETECTION WITH OPENAI
    AiExtractionModule,

    // 🖼️ IMAGE BANK MODULE - PROCESSED IMAGES BANK WITH METADATA REMOVAL
    ImageBankModule,
  ],
  controllers: [AppController],
  providers: [AppService, CacheService],
  exports: [CacheService],
})
export class AppModule {}
