import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ImageGenerationJobData } from '../services/image-generation-queue.service';
import { ImageGenerationService } from '../services/image-generation.service';
import { ProviderFactoryService } from '../services/provider-factory.service';
import { MetadataBuilderService } from '../services/metadata-builder.service';
import { ImageBankProcessorService } from '../../image-bank/services/image-bank-processor.service';
import { ImageGenerationStoredEvent } from '../../image-bank/services/image-bank-events.service';
import { ContentAnalysisResult } from '../interfaces/content-analysis.interface';

@Processor('image-generation')
export class ImageGenerationProcessor {
  private readonly logger = new Logger(ImageGenerationProcessor.name);

  constructor(
    private imageGenerationService: ImageGenerationService,
    private providerFactory: ProviderFactoryService,
    private metadataBuilderService: MetadataBuilderService,
    private eventEmitter: EventEmitter2,
    private imageBankProcessorService: ImageBankProcessorService,
  ) {}

  @Process('generate-single-image')
  async handleImageGeneration(job: Job<ImageGenerationJobData>): Promise<{
    generationId: string;
    generatedImageUrl: string;
    cost: number;
    generationTime: number;
  }> {
    const { generationId, prompt, model, quality, size, userId } = job.data;

    try {
      this.logger.log(`▶ Processing job ${job.id}: generation ${generationId}`);

      // Emit started event
      this.eventEmitter.emit('image-generation.started', {
        jobId: job.id,
        generationId,
        userId,
      });

      // Update progress: 10%
      await job.progress(10);
      this.emitProgress(job.id as string | number, generationId, userId, 'initializing', 10, 'Iniciando generación...');

      // Get OpenAI provider
      const provider = await this.providerFactory.getProvider('openai');

      // Verify provider supports image generation
      if (!provider.generateImage) {
        throw new Error('Provider does not support image generation');
      }

      // Generate image
      const startTime = Date.now();
      await job.progress(30);
      this.emitProgress(job.id as string | number, generationId, userId, 'generating', 30, 'Generando imagen con IA...');

      const result = await provider.generateImage({
        prompt,
        quality,
        size,
        outputFormat: 'png',
      });

      const generationTime = Date.now() - startTime;

      // Update progress: 60%
      await job.progress(60);
      this.emitProgress(job.id as string | number, generationId, userId, 'generated', 60, 'Imagen generada exitosamente');

      // ========================================
      // FASE 5: Post-processing y almacenamiento
      // ========================================

      // Step 1: Process image (4 sizes × 3 formats = 12 files)
      const processingStartTime = Date.now();
      await job.progress(70);
      this.emitProgress(job.id as string | number, generationId, userId, 'processing', 70, 'Procesando imagen en múltiples formatos...');

      const processedResult = await this.imageBankProcessorService.processAIGenerated({
        imageBuffer: result.imageBuffer,
        format: result.format,
        outlet: 'pachuca-noticias', // AI images belong to our outlet
        quality: quality as 'low' | 'medium' | 'high',
        generationId,
      });

      const processingTime = Date.now() - processingStartTime;

      // Step 2: Upload to S3 (12 files)
      const uploadStartTime = Date.now();
      await job.progress(80);
      this.emitProgress(job.id as string | number, generationId, userId, 'uploading', 80, 'Subiendo archivos a S3...');

      const urls = await this.imageBankProcessorService.uploadAIGeneratedToS3(
        processedResult.processedImages!,
        generationId,
      );

      const uploadTime = Date.now() - uploadStartTime;

      this.logger.log(`✅ Processed and uploaded 12 files in ${processingTime + uploadTime}ms`);

      // ========================================
      // FASE 5: Generar metadata limpia
      // ========================================
      let metadata;

      if (job.data.basePrompt && job.data.contentAnalysis && job.data.originalTitle) {
        const metadataStartTime = Date.now();
        await job.progress(85);
        this.emitProgress(job.id as string | number, generationId, userId, 'building_metadata', 85, 'Generando metadata limpia...');

        try {
          metadata = this.metadataBuilderService.build({
            basePrompt: job.data.basePrompt,
            contentAnalysis: job.data.contentAnalysis as unknown as ContentAnalysisResult,
            originalTitle: job.data.originalTitle,
            outletName: 'Noticias Pachuca',
          });

          const metadataTime = Date.now() - metadataStartTime;
          this.logger.log(
            `✅ Metadata built: altText=${metadata.altText.length} chars, ` +
            `keywords=${metadata.keywords.length}, ${metadataTime}ms`,
          );
        } catch (error) {
          this.logger.error(`⚠️ Failed to build metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
          // Continue sin metadata si falla
        }
      } else {
        this.logger.warn(`⚠️ Skipping metadata generation: missing basePrompt or contentAnalysis`);
      }

      // Step 3: Update generation record with URLs + metadata
      await job.progress(90);
      this.emitProgress(job.id as string | number, generationId, userId, 'updating', 90, 'Actualizando registro...');

      await this.imageGenerationService.updateGenerationResult(generationId, {
        generatedImageUrl: urls.original_webp, // Use WebP as primary URL
        cost: result.cost,
        generationTime,
        processingTime: processingTime + uploadTime,
        c2paIncluded: true,
        // NUEVO: Metadata limpia
        altText: metadata?.altText,
        caption: metadata?.caption,
        keywords: metadata?.keywords,
      });

      // Step 4: Emit event for ImageBank to create record
      const event: ImageGenerationStoredEvent = {
        generationId,
        outlet: 'pachuca-noticias',
        prompt,
        urls,
        originalMetadata: processedResult.originalMetadata,
        quality: processedResult.quality,
        cost: result.cost,
        userId,
      };

      this.eventEmitter.emit('image-generation.stored', event);

      // Update progress: 100%
      await job.progress(100);
      this.emitProgress(job.id as string | number, generationId, userId, 'completed', 100, 'Generación completada');

      // Emit completed event
      this.eventEmitter.emit('image-generation.completed', {
        jobId: job.id,
        generationId,
        generatedImageUrl: urls.original_webp,
        cost: result.cost,
        userId,
      });

      this.logger.log(`✓ Job ${job.id} completed: $${result.cost.toFixed(4)}`);

      return {
        generationId,
        generatedImageUrl: urls.original_webp,
        cost: result.cost,
        generationTime,
      };
    } catch (error) {
      this.logger.error(`✗ Job ${job.id} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

      // Emit failed event
      this.eventEmitter.emit('image-generation.failed', {
        jobId: job.id,
        generationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });

      throw error;
    }
  }

  @OnQueueActive()
  onActive(job: Job<ImageGenerationJobData>): void {
    this.logger.log(`⏳ Job ${job.id} is now active (generation: ${job.data.generationId})`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job<ImageGenerationJobData>, result: { cost: number }): void {
    this.logger.log(`✅ Job ${job.id} completed successfully (cost: $${result.cost})`);
  }

  @OnQueueFailed()
  onFailed(job: Job<ImageGenerationJobData>, error: Error): void {
    this.logger.error(`❌ Job ${job.id} failed: ${error.message}`);
  }

  /**
   * Emit progress event via EventEmitter2
   */
  private emitProgress(
    jobId: string | number,
    generationId: string,
    userId: string,
    step: string,
    progress: number,
    message: string,
  ): void {
    this.eventEmitter.emit('image-generation.progress', {
      jobId,
      generationId,
      userId,
      step,
      progress,
      message,
    });
  }
}
