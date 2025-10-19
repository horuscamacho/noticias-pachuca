import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as sharp from 'sharp';
import { AwsS3CoreService } from '../../files/services/aws-s3-core.service';
import { AppConfigService } from '../../config/config.service';
import { ImageBank, ImageBankDocument } from '../schemas/image-bank.schema';
import { UploadImageMetadataDto, ImageQuality } from '../dto/upload-image.dto';
import {
  ProcessedImageUrls,
  OriginalImageMetadata,
} from './image-bank-processor.service';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * File object from Multer
 */
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

/**
 * Result of processing a single uploaded image
 */
export interface UploadResult {
  success: boolean;
  filename: string;
  imageBank?: ImageBankDocument;
  error?: string;
}

/**
 * Event payload when manual upload completes
 */
export interface ImageUploadedEvent {
  imageBankId: string;
  outlet: string;
  filename: string;
  processedUrls: ProcessedImageUrls;
  metadata: UploadImageMetadataDto;
}

// ============================================================================
// SERVICE
// ============================================================================

/**
 * 📤 Image Bank Upload Service
 *
 * Servicio especializado en upload manual de imágenes desde mobile app.
 *
 * Responsabilidades:
 * - Validar archivos de imagen (formato, tamaño, dimensiones)
 * - Procesar imágenes en 4 tamaños (original, thumbnail, medium, large)
 * - Remover metadata EXIF/IPTC/XMP (compliance)
 * - Subir a S3 con estructura: image-bank/{outlet}/{year}/{month}/{id}/
 * - Crear registros en ImageBank con metadata completa
 * - Emitir eventos de upload completado
 * - Manejo de errores individuales en batch uploads
 */
@Injectable()
export class ImageBankUploadService {
  private readonly logger = new Logger(ImageBankUploadService.name);

  // Formatos permitidos
  private readonly ALLOWED_FORMATS = ['jpeg', 'jpg', 'png', 'webp'];

  // Tamaño máximo: 10MB
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024;

  // Dimensiones mínimas: 400x400px
  private readonly MIN_WIDTH = 400;
  private readonly MIN_HEIGHT = 400;

  constructor(
    @InjectModel(ImageBank.name)
    private readonly imageBankModel: Model<ImageBankDocument>,
    private readonly s3Service: AwsS3CoreService,
    private readonly configService: AppConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * 📤 Upload múltiples imágenes con metadata común
   *
   * Procesa cada imagen individualmente, recolectando errores sin
   * fallar todo el batch.
   *
   * @param files - Array de archivos de Multer
   * @param metadata - Metadata común para todas las imágenes
   * @returns Resultado del upload con éxitos y errores
   */
  async uploadMultiple(
    files: UploadedFile[],
    metadata: UploadImageMetadataDto,
  ): Promise<{
    success: boolean;
    uploadedImages: ImageBankDocument[];
    totalUploaded: number;
    errors: Array<{ filename: string; error: string }>;
  }> {
    this.logger.log(
      `📤 Iniciando upload de ${files.length} imágenes para outlet: ${metadata.outlet}`,
    );

    const results: UploadResult[] = [];

    // Procesar cada archivo individualmente
    for (const file of files) {
      try {
        const result = await this.uploadSingle(file, metadata);
        results.push(result);
      } catch (error) {
        this.logger.error(
          `❌ Error procesando archivo ${file.originalname}:`,
          error,
        );
        results.push({
          success: false,
          filename: file.originalname,
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    }

    // Separar éxitos y errores
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    const uploadedImages = successful
      .map((r) => r.imageBank)
      .filter((img): img is ImageBankDocument => img !== undefined);

    const errors = failed.map((r) => ({
      filename: r.filename,
      error: r.error || 'Error desconocido',
    }));

    this.logger.log(
      `✅ Upload completado: ${successful.length} éxitos, ${failed.length} errores`,
    );

    return {
      success: successful.length > 0,
      uploadedImages,
      totalUploaded: successful.length,
      errors,
    };
  }

  /**
   * 📤 Upload una sola imagen
   *
   * @param file - Archivo de Multer
   * @param metadata - Metadata de la imagen
   * @returns Resultado del upload
   */
  private async uploadSingle(
    file: UploadedFile,
    metadata: UploadImageMetadataDto,
  ): Promise<UploadResult> {
    const filename = file.originalname;
    this.logger.log(`📸 Procesando: ${filename}`);

    try {
      // ========================================
      // PASO 1: Validar archivo
      // ========================================
      await this.validateImageFile(file);

      // ========================================
      // PASO 2: Obtener metadata original
      // ========================================
      const sharpMetadata = await sharp(file.buffer).metadata();
      const originalMetadata: OriginalImageMetadata = {
        url: filename, // For manual uploads, use filename as URL
        width: sharpMetadata.width || 0,
        height: sharpMetadata.height || 0,
        format: sharpMetadata.format || 'unknown',
        sizeBytes: file.size,
      };

      this.logger.log(
        `📊 Metadata: ${originalMetadata.width}x${originalMetadata.height}, ${originalMetadata.format}, ${originalMetadata.sizeBytes} bytes`,
      );

      // ========================================
      // PASO 3: Evaluar calidad
      // ========================================
      const quality = metadata.quality || (await this.assessImageQuality(file.buffer));
      this.logger.log(`🎯 Calidad: ${quality}`);

      // ========================================
      // PASO 4: Generar todos los tamaños
      // ========================================
      const imageBuffers = await this.generateImageSizes(file.buffer);

      // ========================================
      // PASO 5: Crear documento temporal para obtener ID
      // ========================================
      const tempImageBank = new this.imageBankModel({
        outlet: metadata.outlet,
        sourceUrl: `upload://${filename}`,
        extractedAt: new Date(),
      });

      const imageId = String(tempImageBank._id);

      // ========================================
      // PASO 6: Generar S3 keys y subir
      // ========================================
      const s3BaseKey = this.generateS3BaseKey(metadata.outlet, imageId);
      const processedUrls = await this.uploadToS3(imageBuffers, s3BaseKey);

      this.logger.log(`✅ Imágenes subidas a S3: ${s3BaseKey}`);

      // ========================================
      // PASO 7: Guardar documento completo
      // ========================================
      tempImageBank.processedUrls = processedUrls;
      tempImageBank.originalMetadata = originalMetadata;
      tempImageBank.quality = quality;
      tempImageBank.metadataRemoved = true;
      tempImageBank.processedByVersion = `sharp-${sharp.versions.sharp}`;
      tempImageBank.processedAt = new Date();

      // Metadata opcional del DTO
      if (metadata.altText) tempImageBank.altText = metadata.altText;
      if (metadata.caption) tempImageBank.caption = metadata.caption;
      if (metadata.keywords) tempImageBank.keywords = metadata.keywords;
      if (metadata.tags) tempImageBank.tags = metadata.tags;
      if (metadata.categories) tempImageBank.categories = metadata.categories;

      // Author/Attribution fields
      if (metadata.author) tempImageBank.author = metadata.author;
      if (metadata.license) tempImageBank.license = metadata.license;
      if (metadata.attribution) tempImageBank.attribution = metadata.attribution;
      if (metadata.captureType) tempImageBank.captureType = metadata.captureType;
      if (metadata.photographerName)
        tempImageBank.photographerName = metadata.photographerName;

      await tempImageBank.save();

      this.logger.log(
        `✅ ImageBank creado: ${tempImageBank._id} - ${filename}`,
      );

      // ========================================
      // PASO 8: Emitir evento
      // ========================================
      this.eventEmitter.emit('image-bank.uploaded', {
        imageBankId: String(tempImageBank._id),
        outlet: metadata.outlet,
        filename,
        processedUrls,
        metadata,
      } as ImageUploadedEvent);

      return {
        success: true,
        filename,
        imageBank: tempImageBank,
      };
    } catch (error) {
      this.logger.error(`❌ Error procesando ${filename}:`, error);
      throw error;
    }
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  /**
   * Valida un archivo de imagen
   *
   * Validaciones:
   * - Formato permitido (jpeg, png, webp)
   * - Tamaño máximo (10MB)
   * - Dimensiones mínimas (400x400px)
   *
   * @param file - Archivo de Multer
   * @throws BadRequestException si no cumple validaciones
   */
  private async validateImageFile(file: UploadedFile): Promise<void> {
    // Validar mimetype
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Formato no permitido: ${file.mimetype}. Solo se permiten: ${allowedMimeTypes.join(', ')}`,
      );
    }

    // Validar tamaño de archivo
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `Archivo muy grande: ${(file.size / 1024 / 1024).toFixed(2)}MB. Máximo permitido: 10MB`,
      );
    }

    // Validar que sea una imagen válida con Sharp
    try {
      const metadata = await sharp(file.buffer).metadata();

      // Validar que tenga formato
      if (!metadata.format || !this.ALLOWED_FORMATS.includes(metadata.format)) {
        throw new BadRequestException(
          `Formato de imagen no soportado: ${metadata.format}`,
        );
      }

      // Validar dimensiones mínimas
      if (
        !metadata.width ||
        !metadata.height ||
        metadata.width < this.MIN_WIDTH ||
        metadata.height < this.MIN_HEIGHT
      ) {
        throw new BadRequestException(
          `Dimensiones muy pequeñas: ${metadata.width}x${metadata.height}. Mínimo requerido: ${this.MIN_WIDTH}x${this.MIN_HEIGHT}`,
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `No se pudo procesar la imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }

  // ============================================================================
  // IMAGE PROCESSING
  // ============================================================================

  /**
   * Genera todos los tamaños de imagen
   *
   * Tamaños generados:
   * - original: max 1920px ancho, WebP 90% quality
   * - thumbnail: 400x250px, WebP 80% quality (cover)
   * - medium: 800x500px, WebP 85% quality (cover)
   * - large: 1200x630px, WebP 90% quality (cover)
   *
   * Sharp NO usa .withMetadata(), por lo tanto
   * la metadata EXIF/IPTC/XMP es REMOVIDA automáticamente
   *
   * @param buffer - Buffer de la imagen original
   * @returns Objeto con todos los buffers procesados
   */
  private async generateImageSizes(buffer: Buffer): Promise<{
    original: Buffer;
    thumbnail: Buffer;
    medium: Buffer;
    large: Buffer;
  }> {
    try {
      // Original (max 1920px ancho, mantener aspect ratio)
      const original = await sharp(buffer)
        .resize(1920, null, {
          withoutEnlargement: true,
          fit: 'inside',
        })
        .webp({ quality: 90 })
        .toBuffer();

      // Thumbnail (400x250, crop center)
      const thumbnail = await sharp(buffer)
        .resize(400, 250, { fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer();

      // Medium (800x500, crop center)
      const medium = await sharp(buffer)
        .resize(800, 500, { fit: 'cover' })
        .webp({ quality: 85 })
        .toBuffer();

      // Large (1200x630, crop center - perfect for OG)
      const large = await sharp(buffer)
        .resize(1200, 630, { fit: 'cover' })
        .webp({ quality: 90 })
        .toBuffer();

      return { original, thumbnail, medium, large };
    } catch (error) {
      this.logger.error('❌ Error generando tamaños:', error);
      throw error;
    }
  }

  /**
   * Evalúa la calidad de la imagen basándose en dimensiones
   *
   * Criterios:
   * - high: >= 1200px de ancho
   * - medium: >= 800px de ancho
   * - low: < 800px de ancho
   *
   * @param buffer - Buffer de la imagen
   * @returns Nivel de calidad
   */
  private async assessImageQuality(buffer: Buffer): Promise<ImageQuality> {
    try {
      const metadata = await sharp(buffer).metadata();
      const { width = 0 } = metadata;

      if (width >= 1200) {
        return ImageQuality.HIGH;
      }

      if (width >= 800) {
        return ImageQuality.MEDIUM;
      }

      return ImageQuality.LOW;
    } catch (error) {
      this.logger.error('❌ Error evaluando calidad:', error);
      return ImageQuality.LOW;
    }
  }

  // ============================================================================
  // S3 UPLOAD
  // ============================================================================

  /**
   * Genera el S3 base key según el patrón del Image Bank
   *
   * Patrón: image-bank/{outlet}/{year}/{month}/{imageId}/
   *
   * @param outlet - Dominio del outlet
   * @param imageId - ID único de la imagen
   * @returns S3 base key (sin el nombre del archivo)
   */
  private generateS3BaseKey(outlet: string, imageId: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    return `image-bank/${outlet}/${year}/${month}/${imageId}`;
  }

  /**
   * Sube todos los tamaños de imagen a S3
   *
   * Genera URLs públicas usando el CDN configurado
   *
   * @param imageBuffers - Buffers de todos los tamaños
   * @param baseKey - S3 base key (sin nombre de archivo)
   * @returns URLs públicas de todas las imágenes
   */
  private async uploadToS3(
    imageBuffers: {
      original: Buffer;
      thumbnail: Buffer;
      medium: Buffer;
      large: Buffer;
    },
    baseKey: string,
  ): Promise<ProcessedImageUrls> {
    try {
      const bucket = this.configService.pachucaS3Bucket;
      const cdnUrl = this.configService.pachucaCdnUrl;

      // Configuración común para todas las imágenes
      const uploadOptions = {
        bucket,
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000', // 1 año
        serverSideEncryption: 'AES256',
      };

      // Subir todas las imágenes en paralelo
      await Promise.all([
        this.s3Service.putObject(
          `${baseKey}/original.webp`,
          imageBuffers.original,
          uploadOptions,
        ),
        this.s3Service.putObject(
          `${baseKey}/thumbnail.webp`,
          imageBuffers.thumbnail,
          uploadOptions,
        ),
        this.s3Service.putObject(
          `${baseKey}/medium.webp`,
          imageBuffers.medium,
          uploadOptions,
        ),
        this.s3Service.putObject(
          `${baseKey}/large.webp`,
          imageBuffers.large,
          uploadOptions,
        ),
      ]);

      // Generar URLs públicas
      const processedUrls: ProcessedImageUrls = {
        original: `${cdnUrl}/${baseKey}/original.webp`,
        thumbnail: `${cdnUrl}/${baseKey}/thumbnail.webp`,
        medium: `${cdnUrl}/${baseKey}/medium.webp`,
        large: `${cdnUrl}/${baseKey}/large.webp`,
        s3BaseKey: baseKey,
      };

      return processedUrls;
    } catch (error) {
      this.logger.error('❌ Error subiendo a S3:', error);
      throw error;
    }
  }
}
