import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Types } from 'mongoose';
import { ImageBankService } from './image-bank.service';

// ============================================================================
// EVENT INTERFACES
// ============================================================================

/**
 * Event payload when an AI image is generated and stored
 */
export interface ImageGenerationStoredEvent {
  generationId: string;
  outlet: string;
  prompt: string;
  urls: Record<string, string>; // All 12 URLs (4 sizes × 3 formats)
  originalMetadata: {
    width: number;
    height: number;
    format: string;
    sizeBytes: number;
  };
  quality: 'high' | 'medium' | 'low';
  cost: number;
  userId: string;
}

/**
 * Event payload to update ImageBank metadata
 */
export interface MetadataUpdateEvent {
  imageGenerationId: string;
  keywords?: string[];
  categories?: string[];
  altText?: string;
  caption?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

/**
 * 🎯 Image Bank Events Service
 *
 * Servicio que escucha eventos del sistema y crea/actualiza registros
 * en el Image Bank sin crear dependencias circulares.
 *
 * Eventos que escucha:
 * - image-generation.stored: Cuando se genera y almacena una imagen AI
 * - image-bank.update-metadata: Cuando se actualiza metadata de una imagen
 */
@Injectable()
export class ImageBankEventsService {
  private readonly logger = new Logger(ImageBankEventsService.name);

  constructor(private readonly imageBankService: ImageBankService) {}

  /**
   * Listener: image-generation.stored
   *
   * Cuando ImageGenerationProcessor genera y almacena una imagen AI,
   * este listener crea un registro en el Image Bank automáticamente.
   */
  @OnEvent('image-generation.stored')
  async handleImageGenerationStored(
    payload: ImageGenerationStoredEvent,
  ): Promise<void> {
    this.logger.log(
      `🎯 Evento recibido: image-generation.stored - ${payload.generationId}`,
    );

    try {
      // Extract keywords from prompt (simple strategy: split by spaces, filter)
      const keywords = payload.prompt
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 3)
        .slice(0, 10); // Max 10 keywords

      // Create ImageBank record
      const imageBank = await this.imageBankService.create({
        processedUrls: {
          // Use WebP URLs as default (legacy format)
          original: payload.urls.original_webp,
          large: payload.urls.large_webp,
          medium: payload.urls.medium_webp,
          thumbnail: payload.urls.thumbnail_webp,
          s3BaseKey: `ai-generated/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${payload.generationId}`,
        },
        originalMetadata: {
          url: payload.urls.original_webp, // AI images don't have external URL
          width: payload.originalMetadata.width,
          height: payload.originalMetadata.height,
          format: payload.originalMetadata.format,
          sizeBytes: payload.originalMetadata.sizeBytes,
        },
        keywords,
        outlet: payload.outlet,
        categories: ['ia-generada'], // Default category for AI images
        sourceUrl: `ai://generation/${payload.generationId}`, // Virtual source
        extractedAt: new Date(),
        altText: payload.prompt, // Use prompt as initial alt text
        caption: `Imagen generada con IA: ${payload.prompt.slice(0, 100)}`,
        quality: payload.quality,
        aiGenerated: true,
        c2paIncluded: true, // AI images include C2PA metadata
        imageGenerationId: payload.generationId,
      });

      this.logger.log(
        `✅ ImageBank record created: ${imageBank._id} from generation ${payload.generationId}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Error creating ImageBank record from generation ${payload.generationId}:`,
        error,
      );
      // Don't throw - this is an event listener, we don't want to break the flow
    }
  }

  /**
   * Listener: image-bank.update-metadata
   *
   * Actualiza metadata de una imagen AI en el Image Bank.
   */
  @OnEvent('image-bank.update-metadata')
  async handleMetadataUpdate(payload: MetadataUpdateEvent): Promise<void> {
    this.logger.log(
      `🎯 Evento recibido: image-bank.update-metadata - ${payload.imageGenerationId}`,
    );

    try {
      // Find ImageBank record by imageGenerationId
      const imageBank = await this.imageBankService.findOne({
        imageGenerationId: new Types.ObjectId(payload.imageGenerationId),
      });

      if (!imageBank) {
        this.logger.warn(
          `⚠️ ImageBank record not found for generation ${payload.imageGenerationId}`,
        );
        return;
      }

      // Update metadata fields if provided
      if (payload.keywords !== undefined) {
        imageBank.keywords = payload.keywords;
      }
      if (payload.categories !== undefined) {
        imageBank.categories = payload.categories;
      }
      if (payload.altText !== undefined) {
        imageBank.altText = payload.altText;
      }
      if (payload.caption !== undefined) {
        imageBank.caption = payload.caption;
      }

      await imageBank.save();

      this.logger.log(
        `✅ ImageBank metadata updated for generation ${payload.imageGenerationId}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Error updating ImageBank metadata for generation ${payload.imageGenerationId}:`,
        error,
      );
      // Don't throw - this is an event listener
    }
  }
}
