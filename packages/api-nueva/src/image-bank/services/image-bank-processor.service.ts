import { Injectable, Logger } from '@nestjs/common';
import { AwsS3CoreService } from '../../files/services/aws-s3-core.service';
import { AppConfigService } from '../../config/config.service';
import * as sharp from 'sharp';
import * as https from 'https';
import * as http from 'http';
import { Types } from 'mongoose';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * URLs procesadas de la imagen en diferentes tamaños
 */
export interface ProcessedImageUrls {
  original: string; // URL CDN de imagen original procesada (max 1920px)
  thumbnail: string; // 400x250px - Para grids y previews
  medium: string; // 800x500px - Para vistas de detalle mobile
  large: string; // 1200x630px - Para OG images y hero sections
  s3BaseKey: string; // Key base en S3: image-bank/{outlet}/{year}/{month}/{id}/
}

/**
 * Metadata de la imagen original antes de procesamiento
 */
export interface OriginalImageMetadata {
  url: string; // URL original de donde se extrajo la imagen
  width: number; // Ancho en píxeles
  height: number; // Alto en píxeles
  format: string; // Formato original (jpeg, png, webp, etc)
  sizeBytes: number; // Tamaño del archivo original en bytes
}

/**
 * Resultado del procesamiento de imagen
 */
export interface ProcessedImageResult {
  processedUrls?: ProcessedImageUrls; // Optional for AI generation (uses processedImages instead)
  processedImages?: ProcessedImage[]; // For AI generation with multi-format
  originalMetadata: OriginalImageMetadata;
  quality: 'high' | 'medium' | 'low';
  metadataRemoved?: boolean;
  processedByVersion?: string;
}

/**
 * Opciones de procesamiento
 */
export interface ProcessingOptions {
  altText?: string;
  caption?: string;
  keywords?: string[];
  categories?: string[];
  tags?: string[];
  extractedNoticiaId?: Types.ObjectId;
  sourceUrl?: string;
}

/**
 * Opciones de procesamiento para imágenes generadas por IA
 */
export interface ProcessAIGeneratedOptions {
  imageBuffer: Buffer;
  format: string;
  outlet: string;
  quality: 'low' | 'medium' | 'high';
  generationId: string;
}

/**
 * Imagen procesada individual (un tamaño + un formato)
 */
export interface ProcessedImage {
  sizeName: string;
  format: string;
  buffer: Buffer;
  width: number;
  height: number | null;
}

// ============================================================================
// SERVICE
// ============================================================================

/**
 * 🖼️ Servicio para procesar imágenes del Image Bank
 *
 * Responsabilidades:
 * - Descargar imagen de URL externa
 * - Generar 4 tamaños (original, thumbnail, medium, large)
 * - Remover metadata EXIF/IPTC/XMP (compliance)
 * - Subir a S3 con key pattern específico para image-bank
 * - Evaluar calidad de imagen
 * - Retornar estructura para guardar en MongoDB
 */
@Injectable()
export class ImageBankProcessorService {
  private readonly logger = new Logger(ImageBankProcessorService.name);

  constructor(
    private readonly s3Service: AwsS3CoreService,
    private readonly configService: AppConfigService,
  ) {}

  /**
   * Método principal: Descarga y procesa una imagen completa
   *
   * @param imageUrl - URL de la imagen a descargar
   * @param outlet - Dominio del sitio de origen (ej: "milenio.com")
   * @param imageId - ID único de la imagen (MongoDB ObjectId en string)
   * @param options - Opciones adicionales de procesamiento
   * @returns Resultado completo del procesamiento
   */
  async downloadAndProcessImage(
    imageUrl: string,
    outlet: string,
    imageId: string,
    options?: ProcessingOptions,
  ): Promise<ProcessedImageResult> {
    try {
      this.logger.log(`🖼️ Iniciando procesamiento de imagen: ${imageUrl}`);
      this.logger.log(`📍 Outlet: ${outlet} | ImageId: ${imageId}`);

      // ========================================
      // PASO 1: Descargar imagen
      // ========================================
      const startDownload = Date.now();
      const imageBuffer = await this.downloadImage(imageUrl);
      const downloadTime = Date.now() - startDownload;
      this.logger.log(`✅ Imagen descargada (${downloadTime}ms, ${imageBuffer.length} bytes)`);

      // ========================================
      // PASO 2: Obtener metadata original
      // ========================================
      const metadata = await sharp(imageBuffer).metadata();
      this.logger.log(
        `📊 Metadata: ${metadata.width}x${metadata.height}, ${metadata.format}, ${imageBuffer.length} bytes`,
      );

      const originalMetadata: OriginalImageMetadata = {
        url: imageUrl,
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        sizeBytes: imageBuffer.length,
      };

      // ========================================
      // PASO 3: Evaluar calidad
      // ========================================
      const quality = await this.assessImageQuality(imageBuffer);
      this.logger.log(`🎯 Calidad evaluada: ${quality}`);

      // ========================================
      // PASO 4: Generar todos los tamaños
      // ========================================
      const startProcessing = Date.now();
      const imageBuffers = await this.generateImageSizes(imageBuffer);
      const processingTime = Date.now() - startProcessing;
      this.logger.log(`✅ Tamaños generados (${processingTime}ms)`);

      // ========================================
      // PASO 5: Generar S3 keys
      // ========================================
      const s3BaseKey = this.generateS3BaseKey(outlet, imageId);
      this.logger.log(`🔑 S3 Base Key: ${s3BaseKey}`);

      // ========================================
      // PASO 6: Subir a S3
      // ========================================
      const startUpload = Date.now();
      const processedUrls = await this.uploadToS3(imageBuffers, s3BaseKey);
      const uploadTime = Date.now() - startUpload;
      this.logger.log(`✅ Imágenes subidas a S3 (${uploadTime}ms)`);

      // ========================================
      // PASO 7: Retornar resultado completo
      // ========================================
      const result: ProcessedImageResult = {
        processedUrls,
        originalMetadata,
        quality,
        metadataRemoved: true, // Sharp remueve metadata por defecto
        processedByVersion: `sharp-${sharp.versions.sharp}`,
      };

      const totalTime = downloadTime + processingTime + uploadTime;
      this.logger.log(`🎉 Procesamiento completado (${totalTime}ms total)`);

      return result;
    } catch (error) {
      this.logger.error('❌ Error en downloadAndProcessImage:', error);
      throw error;
    }
  }

  // ============================================================================
  // HELPERS PRIVADOS
  // ============================================================================

  /**
   * Descarga una imagen desde una URL externa
   *
   * Características:
   * - Maneja redirects automáticamente
   * - Timeout de 30 segundos
   * - Soporta HTTP y HTTPS
   *
   * @param url - URL de la imagen
   * @returns Buffer con los datos de la imagen
   */
  private async downloadImage(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;

      const request = protocol.get(url, (response) => {
        // Manejar redirects (301, 302, 307, 308)
        if (
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          this.logger.log(`🔄 Redirect detectado: ${response.headers.location}`);
          this.downloadImage(response.headers.location)
            .then(resolve)
            .catch(reject);
          return;
        }

        // Validar status code
        if (response.statusCode !== 200) {
          reject(
            new Error(
              `Failed to download image: ${response.statusCode} ${response.statusMessage}`,
            ),
          );
          return;
        }

        // Acumular chunks
        const chunks: Buffer[] = [];

        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', reject);
      });

      request.on('error', reject);

      // Timeout de 30 segundos
      request.setTimeout(30000, () => {
        request.destroy();
        reject(new Error('Image download timeout (30s)'));
      });
    });
  }

  /**
   * Genera todos los tamaños de imagen
   *
   * Tamaños generados:
   * - original: max 1920px ancho, WebP 90% quality
   * - thumbnail: 400x250px, WebP 80% quality (cover)
   * - medium: 800x500px, WebP 85% quality (cover)
   * - large: 1200x630px, WebP 90% quality (cover)
   *
   * IMPORTANTE: Sharp NO usa .withMetadata(), por lo tanto
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
  private async assessImageQuality(
    buffer: Buffer,
  ): Promise<'high' | 'medium' | 'low'> {
    try {
      const metadata = await sharp(buffer).metadata();
      const { width = 0 } = metadata;

      // High quality: >= 1200px width
      if (width >= 1200) {
        return 'high';
      }

      // Medium quality: >= 800px width
      if (width >= 800) {
        return 'medium';
      }

      // Low quality: < 800px width
      return 'low';
    } catch (error) {
      this.logger.error('❌ Error evaluando calidad:', error);
      return 'low'; // Default a low en caso de error
    }
  }

  /**
   * Genera el S3 base key según el patrón del Image Bank
   *
   * Patrón: image-bank/{outlet}/{year}/{month}/{imageId}/
   *
   * Ejemplo:
   * - outlet: "milenio.com"
   * - year: "2025"
   * - month: "10"
   * - imageId: "67890abc123"
   *
   * Resultado: image-bank/milenio.com/2025/10/67890abc123/
   *
   * @param outlet - Dominio del outlet (ej: "milenio.com")
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

  // ============================================================================
  // UTILIDADES PÚBLICAS
  // ============================================================================

  /**
   * 🤖 Procesar imagen generada por IA con conversión multi-formato
   *
   * Genera 12 archivos totales: 3 formatos × 4 tamaños
   * - Formatos: AVIF, WebP, JPEG
   * - Tamaños: original (1920px), large (1200×630), medium (800×500), thumbnail (400×250)
   *
   * @param options - Opciones de procesamiento para imagen AI
   * @returns Resultado con todos los buffers procesados
   */
  async processAIGenerated(options: ProcessAIGeneratedOptions): Promise<ProcessedImageResult> {
    const { imageBuffer, format, outlet, quality, generationId } = options;

    this.logger.log(`🤖 Processing AI-generated image: ${generationId}`);

    // 1. Get metadata from original
    const metadata = await sharp(imageBuffer).metadata();

    // 2. Assess quality
    const assessedQuality = this.assessImageQuality(imageBuffer);

    // 3. Generate 4 sizes in 3 formats (12 files total)
    const processedImages: ProcessedImage[] = [];

    // Sizes configuration
    const sizes = [
      { name: 'original', width: 1920, height: null as number | null },
      { name: 'large', width: 1200, height: 630 },
      { name: 'medium', width: 800, height: 500 },
      { name: 'thumbnail', width: 400, height: 250 },
    ];

    // Formats configuration
    const formats = [
      { ext: 'avif', quality: 80 },
      { ext: 'webp', quality: 85 },
      { ext: 'jpg', quality: 90 },
    ];

    // Generate all combinations
    for (const size of sizes) {
      for (const fmt of formats) {
        let sharpInstance = sharp(imageBuffer).resize(size.width, size.height, {
          fit: size.height ? 'cover' : 'inside',
          withoutEnlargement: true,
        });

        // Apply format-specific processing
        if (fmt.ext === 'avif') {
          sharpInstance = sharpInstance.avif({ quality: fmt.quality });
        } else if (fmt.ext === 'webp') {
          sharpInstance = sharpInstance.webp({ quality: fmt.quality });
        } else if (fmt.ext === 'jpg') {
          sharpInstance = sharpInstance.jpeg({ quality: fmt.quality });
        }

        const processed = await sharpInstance.toBuffer();

        processedImages.push({
          sizeName: size.name,
          format: fmt.ext,
          buffer: processed,
          width: size.width,
          height: size.height,
        });
      }
    }

    this.logger.log(`✅ Generated ${processedImages.length} files (3 formats × 4 sizes)`);

    return {
      processedImages,
      originalMetadata: {
        url: `ai://generation/${generationId}`, // AI images don't have external URL
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || format,
        sizeBytes: imageBuffer.length,
      },
      quality: await assessedQuality,
    };
  }

  /**
   * 🤖 Subir imágenes generadas por IA a S3
   *
   * S3 Key Pattern: ai-generated/{year}/{month}/{generationId}/{sizeName}.{format}
   *
   * @param processedImages - Array de imágenes procesadas
   * @param generationId - ID de la generación
   * @returns Record con URLs de CDN para cada imagen
   */
  async uploadAIGeneratedToS3(
    processedImages: ProcessedImage[],
    generationId: string,
  ): Promise<Record<string, string>> {
    const bucket = this.configService.pachucaS3Bucket;
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const baseKey = `ai-generated/${year}/${month}/${generationId}`;

    this.logger.log(`🔄 Uploading ${processedImages.length} files to S3: ${baseKey}`);

    const uploadPromises = processedImages.map(async (img) => {
      const key = `${baseKey}/${img.sizeName}.${img.format}`;

      await this.s3Service.putObject(key, img.buffer, {
        bucket,
        contentType: `image/${img.format === 'jpg' ? 'jpeg' : img.format}`,
        cacheControl: 'public, max-age=31536000', // 1 year
        serverSideEncryption: 'AES256',
      });

      const url = `${this.configService.pachucaCdnUrl}/${key}`;
      return { [`${img.sizeName}_${img.format}`]: url };
    });

    const results = await Promise.all(uploadPromises);

    // Merge all URL objects
    const urls = Object.assign({}, ...results);

    this.logger.log(`✅ Uploaded ${processedImages.length} files to S3: ${baseKey}`);

    return urls;
  }

  /**
   * Valida si una URL es una imagen válida
   *
   * Validaciones:
   * - Formato de imagen válido
   * - Dimensiones mínimas (200x200)
   * - Tamaño máximo (10MB)
   *
   * @param url - URL a validar
   * @returns true si es una imagen válida
   */
  async validateImageUrl(url: string): Promise<boolean> {
    try {
      const buffer = await this.downloadImage(url);
      const metadata = await sharp(buffer).metadata();

      // Validar que sea una imagen
      if (!metadata.format) {
        this.logger.warn(`⚠️ Formato inválido: ${url}`);
        return false;
      }

      // Validar dimensiones mínimas (200x200)
      if (
        !metadata.width ||
        !metadata.height ||
        metadata.width < 200 ||
        metadata.height < 200
      ) {
        this.logger.warn(
          `⚠️ Dimensiones muy pequeñas: ${metadata.width}x${metadata.height}`,
        );
        return false;
      }

      // Validar tamaño máximo (10MB)
      if (buffer.length > 10 * 1024 * 1024) {
        this.logger.warn(`⚠️ Archivo muy grande: ${buffer.length} bytes`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('❌ Error validando imagen:', error);
      return false;
    }
  }

  /**
   * Obtiene información de una imagen sin procesarla
   *
   * @param url - URL de la imagen
   * @returns Metadata básica de la imagen
   */
  async getImageInfo(url: string): Promise<{
    width: number;
    height: number;
    format: string;
    sizeBytes: number;
  } | null> {
    try {
      const buffer = await this.downloadImage(url);
      const metadata = await sharp(buffer).metadata();

      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        sizeBytes: buffer.length,
      };
    } catch (error) {
      this.logger.error('❌ Error obteniendo info de imagen:', error);
      return null;
    }
  }
}
