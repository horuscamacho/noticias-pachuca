import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { ImageBank, ImageBankSchema } from './schemas/image-bank.schema';
import { ImageBankService } from './services/image-bank.service';
import { ImageBankProcessorService } from './services/image-bank-processor.service';
import { ImageBankUploadService } from './services/image-bank-upload.service';
import { ImageBankEventsService } from './services/image-bank-events.service';
import { ImageBankController } from './controllers/image-bank.controller';
import { ImageBankQueueProcessor } from './processors/image-bank-queue.processor';
import { AwsS3CoreService } from '../files/services/aws-s3-core.service';
import { AppConfigModule } from '../config/config.module';
import { PaginationService } from '../common/services/pagination.service';

/**
 * 🖼️ Image Bank Module
 *
 * Módulo completo para el banco de imágenes procesadas.
 *
 * Responsabilidades:
 * - CRUD de imágenes en el banco
 * - Procesamiento y almacenamiento de imágenes con metadata removal
 * - Filtrado y búsqueda de imágenes
 * - Integración con S3/CloudFront
 *
 * Estructura:
 * - Schema: ImageBank (MongoDB)
 * - Service: ImageBankService (CRUD + búsqueda)
 * - Processor: ImageBankProcessorService (descarga, procesamiento, upload)
 * - Controller: ImageBankController (API REST)
 *
 * Dependencias:
 * - FilesModule: Para acceso a AwsS3CoreService
 * - ConfigModule: Para configuración de S3/CDN
 */
@Module({
  imports: [
    // MongoDB Schema
    MongooseModule.forFeature([{ name: ImageBank.name, schema: ImageBankSchema }]),

    // Bull Queue para procesamiento asíncrono
    BullModule.registerQueue({
      name: 'image-bank-processing',
    }),

    // Módulos externos
    AppConfigModule, // Proveedor de AppConfigService
  ],
  controllers: [ImageBankController],
  providers: [
    ImageBankService,
    ImageBankProcessorService,
    ImageBankUploadService,
    ImageBankEventsService,
    ImageBankQueueProcessor,
    AwsS3CoreService,
    PaginationService,
  ],
  exports: [ImageBankService, ImageBankProcessorService, ImageBankUploadService],
})
export class ImageBankModule {}
