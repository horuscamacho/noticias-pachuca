import { Injectable, Logger } from '@nestjs/common';
import { AwsS3CoreService } from '../../files/services/aws-s3-core.service';
import * as sharp from 'sharp';
import * as https from 'https';
import * as http from 'http';
import { AppConfigService } from '../../config/config.service';

export interface ProcessedImage {
  original: string; // URL pública
  thumbnail: string; // URL pública 400x250
  medium: string; // URL pública 800x500
  large: string; // URL pública 1200x630 (perfect para OG)
  alt: string; // Texto alternativo
  width: number; // Ancho original
  height: number; // Alto original
  s3Key: string; // Key en S3 del original
}

@Injectable()
export class ImageProcessorService {
  private readonly logger = new Logger(ImageProcessorService.name);

  constructor(
    private readonly s3Service: AwsS3CoreService,
    private readonly configService: AppConfigService,
  ) {}

  /**
   * Descarga una imagen desde una URL, la procesa en múltiples tamaños
   * y la sube a S3
   * @param imageUrl - URL de la imagen original
   * @param slug - Slug de la noticia (para organizar en S3)
   * @param altText - Texto alternativo para la imagen
   * @returns Objeto con URLs de todos los tamaños generados
   */
  async processAndUploadImage(
    imageUrl: string,
    slug: string,
    altText: string,
  ): Promise<ProcessedImage> {
    try {
      // 1. Descargar imagen
      this.logger.log(`📥 Descargando imagen: ${imageUrl}`);
      const imageBuffer = await this.downloadImage(imageUrl);

      // 2. Obtener metadata original
      const metadata = await sharp(imageBuffer).metadata();
      this.logger.log(
        `📊 Imagen original: ${metadata.width}x${metadata.height}, ${metadata.format}`,
      );

      // 3. Generar diferentes tamaños con Sharp
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const baseKey = `noticias/${year}/${month}/${slug}`;

      // CDN base URL desde config (específico para Pachuca)
      const cdnBase = this.configService.pachucaCdnUrl;

      // Original (convertir a WebP, max 1920px ancho)
      const originalBuffer = await sharp(imageBuffer)
        .resize(1920, null, {
          withoutEnlargement: true,
          fit: 'inside',
        })
        .webp({ quality: 90 })
        .toBuffer();

      const originalKey = `${baseKey}/original.webp`;
      await this.s3Service.putObject(originalKey, originalBuffer, {
        bucket: this.configService.pachucaS3Bucket,
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000', // 1 año
        metadata: {
          alt: altText,
          slug,
        },
      });

      // Thumbnail (400x250)
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(400, 250, { fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer();

      const thumbnailKey = `${baseKey}/thumbnail.webp`;
      await this.s3Service.putObject(thumbnailKey, thumbnailBuffer, {
        bucket: this.configService.pachucaS3Bucket,
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000',
      });

      // Medium (800x500)
      const mediumBuffer = await sharp(imageBuffer)
        .resize(800, 500, { fit: 'cover' })
        .webp({ quality: 85 })
        .toBuffer();

      const mediumKey = `${baseKey}/medium.webp`;
      await this.s3Service.putObject(mediumKey, mediumBuffer, {
        bucket: this.configService.pachucaS3Bucket,
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000',
      });

      // Large (1200x630 - perfect for OG)
      const largeBuffer = await sharp(imageBuffer)
        .resize(1200, 630, { fit: 'cover' })
        .webp({ quality: 90 })
        .toBuffer();

      const largeKey = `${baseKey}/large.webp`;
      await this.s3Service.putObject(largeKey, largeBuffer, {
        bucket: this.configService.pachucaS3Bucket,
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000',
      });

      // 4. Generar URLs públicas
      const result: ProcessedImage = {
        original: `${cdnBase}/${originalKey}`,
        thumbnail: `${cdnBase}/${thumbnailKey}`,
        medium: `${cdnBase}/${mediumKey}`,
        large: `${cdnBase}/${largeKey}`,
        alt: altText,
        width: metadata.width || 0,
        height: metadata.height || 0,
        s3Key: originalKey,
      };

      this.logger.log(`✅ Imagen procesada y subida: ${originalKey}`);

      return result;
    } catch (error) {
      this.logger.error('❌ Error procesando imagen:', error);
      throw error;
    }
  }

  /**
   * Descarga una imagen desde una URL externa
   * @param url - URL de la imagen
   * @returns Buffer con los datos de la imagen
   */
  private async downloadImage(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;

      const request = protocol.get(url, (response) => {
        // Manejar redirects
        if (
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          this.downloadImage(response.headers.location)
            .then(resolve)
            .catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          reject(
            new Error(
              `Failed to download image: ${response.statusCode} ${response.statusMessage}`,
            ),
          );
          return;
        }

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
   * Valida si una URL es una imagen válida
   * @param url - URL a validar
   * @returns true si es una imagen válida
   */
  async validateImageUrl(url: string): Promise<boolean> {
    try {
      const buffer = await this.downloadImage(url);
      const metadata = await sharp(buffer).metadata();

      // Validar que sea una imagen
      if (!metadata.format) {
        return false;
      }

      // Validar dimensiones mínimas (200x200)
      if (
        !metadata.width ||
        !metadata.height ||
        metadata.width < 200 ||
        metadata.height < 200
      ) {
        return false;
      }

      // Validar tamaño máximo (10MB)
      if (buffer.length > 10 * 1024 * 1024) {
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Error validando imagen:', error);
      return false;
    }
  }
}
