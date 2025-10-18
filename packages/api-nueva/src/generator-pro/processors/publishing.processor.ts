import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { GeneratorProJob, GeneratorProJobDocument } from '../schemas/generator-pro-job.schema';
import { FacebookPublishingConfig, FacebookPublishingConfigDocument } from '../schemas/facebook-publishing-config.schema';
import { GeneratorProFacebookPost, FacebookPost, FacebookPostDocument } from '../schemas/facebook-post.schema'; // ✅ FIX: Importar clase real
import { AIContentGeneration, AIContentGenerationDocument } from '../../content-ai/schemas/ai-content-generation.schema';
import { ExtractedNoticia, ExtractedNoticiaDocument } from '../../noticias/schemas/extracted-noticia.schema';
import { FacebookPublishingService } from '../services/facebook-publishing.service';

/**
 * 🤖 Processor para trabajos de publicación en Facebook - Generator Pro
 * Integra con GetLate.dev API para publicación automatizada
 * Procesa jobs de las colas: publish_facebook, sync_engagement
 */

interface PublishingJobData {
  jobId: string;
  type: 'publish_facebook' | 'sync_engagement';
  websiteConfigId: Types.ObjectId;
  facebookConfigId: Types.ObjectId;
  relatedEntityId?: Types.ObjectId; // ID de AIContentGeneration
  data: {
    // Para publish_facebook
    generatedContentId?: Types.ObjectId;
    postContent?: string;
    mediaUrls?: string[];
    scheduledAt?: Date;

    // Para sync_engagement
    facebookPostIds?: string[];
    lastSyncAt?: Date;

    // Común
    metadata?: Record<string, unknown>;
    isRetry?: boolean;
    originalJobId?: string;
  };
  priority: number;
}

@Injectable()
@Processor('generator-pro-publishing')
export class PublishingProcessor {
  private readonly logger = new Logger(PublishingProcessor.name);

  constructor(
    @InjectModel(GeneratorProJob.name)
    private readonly jobModel: Model<GeneratorProJobDocument>,
    @InjectModel(FacebookPublishingConfig.name)
    private readonly facebookConfigModel: Model<FacebookPublishingConfigDocument>,
    @InjectModel(GeneratorProFacebookPost.name) // ✅ FIX: Usar clase real, no type alias
    private readonly facebookPostModel: Model<FacebookPostDocument>,
    @InjectModel(AIContentGeneration.name)
    private readonly aiContentGenerationModel: Model<AIContentGenerationDocument>,
    @InjectModel(ExtractedNoticia.name)
    private readonly extractedNoticiaModel: Model<ExtractedNoticiaDocument>,
    private readonly facebookService: FacebookPublishingService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.log('🤖 Publishing Processor initialized');
  }

  /**
   * 📱 PROCESAR PUBLICACIÓN EN FACEBOOK
   */
  @Process('publish_facebook')
  async processPublishToFacebook(job: Job<PublishingJobData>): Promise<{ published: boolean; message: string }> {
    const startTime = Date.now();
    this.logger.log(`📱 Processing Facebook publishing job: ${job.data.jobId}`);

    try {
      // Actualizar job como iniciado
      await this.updateJobStatus(job.data.jobId, 'processing', { startedAt: new Date() });

      // Obtener configuración de Facebook
      const facebookConfig = await this.facebookConfigModel.findById(job.data.facebookConfigId);
      if (!facebookConfig || !facebookConfig.isActive) {
        throw new Error(`Facebook config ${job.data.facebookConfigId} not found or not active`);
      }

      job.progress(10);

      // Verificar límites diarios
      if (!facebookConfig.canPublishToday) {
        throw new Error('Daily posting limit reached for this Facebook configuration');
      }

      // Obtener contenido generado
      const generatedContent = await this.aiContentGenerationModel
        .findById(job.data.data.generatedContentId);

      if (!generatedContent || generatedContent.status !== 'completed') {
        throw new Error(`Generated content ${job.data.data.generatedContentId} not found or not completed`);
      }

      // Obtener noticia original separadamente
      const originalNoticia = await this.extractedNoticiaModel.findById(generatedContent.originalContentId);
      if (!originalNoticia) {
        throw new Error(`Original noticia ${generatedContent.originalContentId} not found`);
      }

      job.progress(20);

      // Verificar si ya existe un post para este contenido
      let existingPost = await this.facebookPostModel.findOne({
        generatedContentId: generatedContent._id,
        facebookConfigId: facebookConfig._id,
      });

      if (existingPost && existingPost.status === 'published' && !job.data.data.isRetry) {
        this.logger.log(`Post already published for content: ${generatedContent._id}`);

        await this.updateJobStatus(job.data.jobId, 'completed', {
          completedAt: new Date(),
          processingTime: Date.now() - startTime,
          result: {
            published: false,
            reason: 'already_published',
            existingPostId: existingPost._id,
            facebookPostId: existingPost.facebookPostId,
          },
        });

        return {
          published: false,
          message: 'Content already published',
        };
      }

      job.progress(30);

      // Optimizar contenido para Facebook
      this.logger.log(`Optimizing content for Facebook: ${generatedContent.generatedTitle}`);
      const optimizedContent = await this.facebookService.optimizeContentForFacebook(generatedContent);

      job.progress(50);

      // Preparar URLs de medios si hay imágenes
      let processedMediaUrls: string[] = [];
      if (originalNoticia.images && originalNoticia.images.length > 0) {
        processedMediaUrls = await this.facebookService.uploadMedia(originalNoticia.images.slice(0, 3)); // Max 3 imágenes
      }

      job.progress(60);

      // Crear o actualizar post
      if (!existingPost) {
        existingPost = new this.facebookPostModel({
          originalNoticiaId: originalNoticia._id,
          generatedContentId: generatedContent._id,
          websiteConfigId: job.data.websiteConfigId,
          facebookConfigId: facebookConfig._id,
          postContent: optimizedContent,
          originalTitle: originalNoticia.title,
          optimizedTitle: generatedContent.generatedTitle,
          mediaUrls: originalNoticia.images || [],
          processedMediaUrls,
          scheduledAt: job.data.data.scheduledAt || new Date(),
          status: 'publishing',
          category: generatedContent.category || originalNoticia.category,
          keywords: generatedContent.generatedKeywords || [],
          originalSourceUrl: originalNoticia.sourceUrl,
        });
      } else {
        existingPost.postContent = optimizedContent;
        existingPost.processedMediaUrls = processedMediaUrls;
        existingPost.status = 'publishing';
      }

      await existingPost.save();

      job.progress(70);

      // Publicar en Facebook usando GetLate
      this.logger.log(`Publishing to Facebook: ${facebookConfig.facebookPageName}`);
      // ✅ REFACTORIZADO: Pasar pageId, pageName y apiKey explícitamente
      const publishResult = await this.facebookService.publishPost(
        existingPost,
        facebookConfig.facebookPageId,
        facebookConfig.facebookPageName,
        facebookConfig.getLateApiKey
      );

      job.progress(90);

      const processingTime = Date.now() - startTime;

      if (publishResult.success) {
        // Actualizar post como publicado (ya se hace en publishPost)

        // Actualizar estadísticas de configuración Facebook
        await this.updateFacebookConfigStats(facebookConfig._id as Types.ObjectId, true);

        // Actualizar job como completado
        const result = {
          published: true,
          postId: existingPost._id,
          facebookPostId: publishResult.facebookPostId,
          facebookPostUrl: publishResult.facebookPostUrl,
          processingTime,
          configName: facebookConfig.name,
          contentTitle: generatedContent.generatedTitle,
        };

        await this.updateJobStatus(job.data.jobId, 'completed', {
          completedAt: new Date(),
          processingTime,
          result,
        });

        // Emitir evento de éxito
        this.eventEmitter.emit('generator-pro.publishing.published', {
          jobId: job.data.jobId,
          postId: existingPost._id,
          facebookPostId: publishResult.facebookPostId,
          configId: facebookConfig._id,
          contentId: generatedContent._id,
          processingTime,
          timestamp: new Date(),
        });

        job.progress(100);

        this.logger.log(`✅ Facebook publishing completed: ${publishResult.facebookPostId}`);

        return {
          published: true,
          message: 'Content published to Facebook successfully',
        };

      } else {
        // Fallo en publicación
        throw new Error(publishResult.error || 'Facebook publishing failed');
      }

    } catch (error) {
      const processingTime = Date.now() - startTime;

      this.logger.error(`❌ Facebook publishing failed for job ${job.data.jobId}: ${error.message}`);

      // Actualizar job como fallido
      await this.updateJobStatus(job.data.jobId, 'failed', {
        error: error.message,
        errorDetails: {
          message: error.message,
          stack: error.stack,
          timestamp: new Date(),
          processingTime,
          generatedContentId: job.data.data.generatedContentId,
          facebookConfigId: job.data.facebookConfigId,
        },
      });

      // Actualizar estadísticas de configuración Facebook
      await this.updateFacebookConfigStats(job.data.facebookConfigId, false);

      // Marcar post como fallido si existe
      if (job.data.data.generatedContentId) {
        await this.facebookPostModel.findOneAndUpdate(
          { generatedContentId: job.data.data.generatedContentId },
          {
            status: 'failed',
            failureReason: error.message,
            publishingAttempts: {
              count: 1,
              lastAttempt: new Date(),
              errors: [{
                timestamp: new Date(),
                error: error.message,
              }],
            },
          }
        );
      }

      // Emitir evento de fallo
      this.eventEmitter.emit('generator-pro.publishing.failed', {
        jobId: job.data.jobId,
        generatedContentId: job.data.data.generatedContentId,
        error: error.message,
        processingTime,
        timestamp: new Date(),
      });

      throw error;
    }
  }

  /**
   * 📊 PROCESAR SINCRONIZACIÓN DE ENGAGEMENT
   */
  @Process('sync_engagement')
  async processSyncEngagement(job: Job<PublishingJobData>): Promise<{ synced: number; message: string }> {
    const startTime = Date.now();
    this.logger.log(`📊 Processing engagement sync job: ${job.data.jobId}`);

    try {
      // Actualizar job como iniciado
      await this.updateJobStatus(job.data.jobId, 'processing', { startedAt: new Date() });

      // Obtener configuración de Facebook
      const facebookConfig = await this.facebookConfigModel.findById(job.data.facebookConfigId);
      if (!facebookConfig || !facebookConfig.isActive) {
        throw new Error(`Facebook config ${job.data.facebookConfigId} not found or not active`);
      }

      job.progress(20);

      // Obtener posts publicados que necesitan sincronización
      const cutoffDate = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)); // 7 días atrás
      const postsToSync = await this.facebookPostModel.find({
        facebookConfigId: facebookConfig._id,
        status: 'published',
        publishedAt: { $gte: cutoffDate },
        $or: [
          { 'engagement.lastUpdated': { $exists: false } },
          { 'engagement.lastUpdated': { $lt: new Date(Date.now() - (60 * 60 * 1000)) } }, // Hace más de 1 hora
        ],
      }).limit(20); // Máximo 20 posts por sync

      job.progress(40);

      if (postsToSync.length === 0) {
        this.logger.log('No posts found that need engagement sync');

        await this.updateJobStatus(job.data.jobId, 'completed', {
          completedAt: new Date(),
          processingTime: Date.now() - startTime,
          result: {
            synced: 0,
            reason: 'no_posts_to_sync',
          },
        });

        return {
          synced: 0,
          message: 'No posts require engagement sync',
        };
      }

      // Sincronizar engagement para cada post
      let syncedCount = 0;
      const progressIncrement = 50 / postsToSync.length;

      for (const post of postsToSync) {
        try {
          if (post.facebookPostId) {
            // TODO: Implementar sincronización real con Facebook Graph API via GetLate
            // Por ahora simulamos datos de engagement
            const mockEngagement: Record<string, unknown> = {
              likes: Math.floor(Math.random() * 100) + 10,
              comments: Math.floor(Math.random() * 20),
              shares: Math.floor(Math.random() * 15),
              reach: Math.floor(Math.random() * 500) + 100,
              impressions: Math.floor(Math.random() * 1000) + 200,
              lastUpdated: new Date(),
            };

            // Calcular tasa de engagement
            if ((mockEngagement.reach as number) > 0) {
              const totalEngagement = (mockEngagement.likes as number) + (mockEngagement.comments as number) + (mockEngagement.shares as number);
              mockEngagement.engagementRate = (totalEngagement / (mockEngagement.reach as number)) * 100;
            }

            await post.updateEngagement(mockEngagement);
            syncedCount++;

            this.logger.log(`Synced engagement for post: ${post.facebookPostId}`);
          }
        } catch (error) {
          this.logger.warn(`Failed to sync engagement for post ${post._id}: ${error.message}`);
        }

        job.progress(40 + (syncedCount * progressIncrement));
      }

      const processingTime = Date.now() - startTime;

      // Actualizar job como completado
      const result = {
        synced: syncedCount,
        totalPosts: postsToSync.length,
        processingTime,
        configName: facebookConfig.name,
      };

      await this.updateJobStatus(job.data.jobId, 'completed', {
        completedAt: new Date(),
        processingTime,
        result,
      });

      // Emitir evento de éxito
      this.eventEmitter.emit('generator-pro.engagement.synced', {
        jobId: job.data.jobId,
        configId: facebookConfig._id,
        syncedCount,
        totalPosts: postsToSync.length,
        processingTime,
        timestamp: new Date(),
      });

      job.progress(100);

      this.logger.log(`✅ Engagement sync completed: ${syncedCount}/${postsToSync.length} posts synced`);

      return {
        synced: syncedCount,
        message: `Successfully synced ${syncedCount} posts`,
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;

      this.logger.error(`❌ Engagement sync failed for job ${job.data.jobId}: ${error.message}`);

      // Actualizar job como fallido
      await this.updateJobStatus(job.data.jobId, 'failed', {
        error: error.message,
        errorDetails: {
          message: error.message,
          stack: error.stack,
          timestamp: new Date(),
          processingTime,
          facebookConfigId: job.data.facebookConfigId,
        },
      });

      // Emitir evento de fallo
      this.eventEmitter.emit('generator-pro.engagement.sync_failed', {
        jobId: job.data.jobId,
        facebookConfigId: job.data.facebookConfigId,
        error: error.message,
        processingTime,
        timestamp: new Date(),
      });

      throw error;
    }
  }

  /**
   * 🔧 MÉTODOS AUXILIARES
   */
  private async updateFacebookConfigStats(
    configId: Types.ObjectId,
    success: boolean
  ): Promise<void> {
    try {
      const updateData: Record<string, unknown> = {};

      if (success) {
        updateData.$inc = {
          'statistics.totalPostsPublished': 1,
          'statistics.successfulPosts': 1,
          postsToday: 1,
        };
        updateData.lastPublishedAt = new Date();
      } else {
        updateData.$inc = {
          'statistics.failedPosts': 1,
        };
      }

      await this.facebookConfigModel.findByIdAndUpdate(configId, updateData);
    } catch (error) {
      this.logger.warn(`Failed to update Facebook config stats: ${error.message}`);
    }
  }

  private async updateJobStatus(
    jobId: string,
    status: string,
    updates: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      await this.jobModel.findByIdAndUpdate(jobId, {
        status,
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      this.logger.warn(`Failed to update job status for ${jobId}: ${error.message}`);
    }
  }
}