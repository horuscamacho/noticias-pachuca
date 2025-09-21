import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';

import { FacebookExtractionJob, FacebookExtractionJobDocument } from '../schemas/facebook-extraction-job.schema';
import { ExtractedFacebookPost, ExtractedFacebookPostDocument } from '../schemas/extracted-facebook-post.schema';
import { MonitoredFacebookPage, MonitoredFacebookPageDocument } from '../schemas/monitored-facebook-page.schema';

import { FacebookService } from '../../facebook/services/facebook.service';
import { CacheService } from '../../services/cache.service';
import { FacebookPageManagementService } from './facebook-page-management.service';

import { FacebookExtractionRequestDto } from '../dto/facebook-page-management.dto';

interface FacebookPostData {
  id: string;
  message?: string;
  created_time: string;
  likes?: { summary: { total_count: number } };
  shares?: { count: number };
  comments?: { summary: { total_count: number } };
  reactions?: Record<string, { summary: { total_count: number } }>;
  attachments?: {
    data: Array<{
      type: string;
      media?: { image?: { src: string } };
      url?: string;
      title?: string;
      description?: string;
    }>;
  };
  permalink_url?: string;
}

@Injectable()
export class FacebookExtractionService {
  private readonly logger = new Logger(FacebookExtractionService.name);

  constructor(
    @InjectModel(FacebookExtractionJob.name)
    private readonly jobModel: Model<FacebookExtractionJobDocument>,
    @InjectModel(ExtractedFacebookPost.name)
    private readonly postModel: Model<ExtractedFacebookPostDocument>,
    @InjectModel(MonitoredFacebookPage.name)
    private readonly pageModel: Model<MonitoredFacebookPageDocument>,
    private readonly facebookService: FacebookService,
    private readonly cacheService: CacheService,
    private readonly pageManagementService: FacebookPageManagementService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * 🚀 EJECUTAR EXTRACCIÓN MANUAL
   */
  async executeExtraction(requestDto: FacebookExtractionRequestDto): Promise<FacebookExtractionJobDocument> {
    this.logger.log(`Starting extraction for ${requestDto.pageIds.length} pages`);

    // Validar que todas las páginas existen y están activas
    await this.validatePagesForExtraction(requestDto.pageIds);

    // Crear job de extracción
    const job = await this.createExtractionJob(requestDto);

    // Ejecutar extracción de forma asíncrona
    this.performExtraction(job).catch(error => {
      this.logger.error(`Extraction job ${job.jobId} failed: ${error.message}`, error.stack);
    });

    return job;
  }

  /**
   * 🔄 REALIZAR EXTRACCIÓN (PROCESO PRINCIPAL)
   */
  private async performExtraction(job: FacebookExtractionJobDocument): Promise<void> {
    try {
      this.logger.log(`Starting extraction job: ${job.jobId}`);

      // Marcar job como running
      job.status = 'running';
      job.startedAt = new Date();
      await job.save();

      let totalPostsExtracted = 0;
      let totalApiCalls = 0;

      // Procesar cada página
      for (const pageId of job.metadata.filters?.pageIds as string[] || []) {
        try {
          const result = await this.extractPagePosts(
            pageId,
            job.metadata.filters?.maxPosts as number || 25,
            job.metadata.filters?.fields as string[] || ['message', 'created_time', 'likes', 'shares', 'comments']
          );

          totalPostsExtracted += result.postsExtracted;
          totalApiCalls += result.apiCallsUsed;

          this.logger.log(`Extracted ${result.postsExtracted} posts from page ${pageId}`);

        } catch (error) {
          this.logger.error(`Failed to extract from page ${pageId}: ${error.message}`);
          job.errors.push(`Page ${pageId}: ${error.message}`);
        }
      }

      // Marcar job como completado
      job.status = 'completed';
      job.completedAt = new Date();
      job.postsExtracted = totalPostsExtracted;
      job.apiCallsUsed = totalApiCalls;
      await job.save();

      // Emitir evento de finalización
      this.eventEmitter.emit('facebook.extraction.completed', {
        jobId: job.jobId,
        postsExtracted: totalPostsExtracted,
        apiCallsUsed: totalApiCalls,
        duration: job.completedAt ? job.completedAt.getTime() - job.startedAt.getTime() : 0
      });

      this.logger.log(`Extraction job ${job.jobId} completed successfully`);

    } catch (error) {
      // Marcar job como fallido
      job.status = 'failed';
      job.completedAt = new Date();
      job.errors.push(error.message);
      await job.save();

      this.eventEmitter.emit('facebook.extraction.failed', {
        jobId: job.jobId,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * 📄 EXTRAER POSTS DE UNA PÁGINA
   */
  private async extractPagePosts(
    pageId: string,
    maxPosts: number,
    fields: string[]
  ): Promise<{ postsExtracted: number; apiCallsUsed: number }> {
    this.logger.log(`Extracting posts from page: ${pageId}, maxPosts: ${maxPosts}`);

    let postsExtracted = 0;
    let apiCallsUsed = 0;

    try {
      // Obtener posts de Facebook API
      const startTime = Date.now();
      const facebookPosts = await this.facebookService.getPagePosts(pageId, {
        limit: maxPosts,
        fields
      });
      apiCallsUsed += 1;

      const responseTime = Date.now() - startTime;
      this.logger.log(`Facebook API call took ${responseTime}ms, returned ${facebookPosts.length} posts`);

      // Procesar cada post
      for (const fbPost of facebookPosts) {
        try {
          await this.saveExtractedPost(pageId, fbPost);
          postsExtracted += 1;
        } catch (error) {
          this.logger.warn(`Failed to save post ${fbPost.id}: ${error.message}`);
        }
      }

      // Actualizar estadísticas de la página
      await this.pageManagementService.updateExtractionStats(pageId, postsExtracted);

      // Limpiar cache de posts
      await this.clearPostsCache(pageId);

      return { postsExtracted, apiCallsUsed };

    } catch (error) {
      this.logger.error(`Failed to extract posts from page ${pageId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * 💾 GUARDAR POST EXTRAÍDO
   */
  private async saveExtractedPost(pageId: string, fbPost: FacebookPostData): Promise<void> {
    // Verificar si el post ya existe
    const existingPost = await this.postModel.findOne({ facebookPostId: fbPost.id });
    if (existingPost) {
      // Actualizar métricas si el post ya existe
      existingPost.metrics = this.extractMetrics(fbPost);
      existingPost.extractedAt = new Date();
      await existingPost.save();
      return;
    }

    // Crear nuevo post
    const extractedPost = new this.postModel({
      facebookPostId: fbPost.id,
      pageId,
      content: fbPost.message || '',
      createdTime: new Date(fbPost.created_time),
      extractedAt: new Date(),
      metrics: this.extractMetrics(fbPost),
      media: this.extractMedia(fbPost),
      link: fbPost.permalink_url || '',
      postType: this.determinePostType(fbPost),
      isActive: true
    });

    await extractedPost.save();

    this.eventEmitter.emit('facebook.post.extracted', {
      postId: extractedPost.facebookPostId,
      pageId: extractedPost.pageId,
      content: extractedPost.content.slice(0, 100),
      engagementScore: extractedPost.engagementScore
    });
  }

  /**
   * 📊 EXTRAER MÉTRICAS DEL POST
   */
  private extractMetrics(fbPost: FacebookPostData): {
    likes: number;
    shares: number;
    comments: number;
    reactions: Record<string, number>;
  } {
    const metrics = {
      likes: fbPost.likes?.summary?.total_count || 0,
      shares: fbPost.shares?.count || 0,
      comments: fbPost.comments?.summary?.total_count || 0,
      reactions: {} as Record<string, number>
    };

    // Extraer reacciones específicas
    if (fbPost.reactions) {
      Object.entries(fbPost.reactions).forEach(([type, data]) => {
        if (data && data.summary) {
          metrics.reactions[type] = data.summary.total_count;
        }
      });
    }

    return metrics;
  }

  /**
   * 🎬 EXTRAER MEDIA DEL POST
   */
  private extractMedia(fbPost: FacebookPostData): Array<{
    type: 'photo' | 'video' | 'link';
    url: string;
    description?: string;
    thumbnailUrl?: string;
  }> {
    const media: Array<{
      type: 'photo' | 'video' | 'link';
      url: string;
      description?: string;
      thumbnailUrl?: string;
    }> = [];

    if (fbPost.attachments && fbPost.attachments.data) {
      fbPost.attachments.data.forEach(attachment => {
        let mediaType: 'photo' | 'video' | 'link' = 'link';
        let url = attachment.url || '';

        if (attachment.type === 'photo' && attachment.media?.image?.src) {
          mediaType = 'photo';
          url = attachment.media.image.src;
        } else if (attachment.type === 'video') {
          mediaType = 'video';
        }

        if (url) {
          media.push({
            type: mediaType,
            url,
            description: attachment.title || attachment.description,
            thumbnailUrl: attachment.media?.image?.src
          });
        }
      });
    }

    return media;
  }

  /**
   * 🏷️ DETERMINAR TIPO DE POST
   */
  private determinePostType(fbPost: FacebookPostData): string {
    if (fbPost.attachments && fbPost.attachments.data.length > 0) {
      const attachmentTypes = fbPost.attachments.data.map(a => a.type);
      if (attachmentTypes.includes('photo')) return 'photo';
      if (attachmentTypes.includes('video')) return 'video';
      if (attachmentTypes.includes('link')) return 'link';
    }

    return fbPost.message ? 'text' : 'status';
  }

  /**
   * ✅ VALIDAR PÁGINAS PARA EXTRACCIÓN
   */
  private async validatePagesForExtraction(pageIds: string[]): Promise<void> {
    this.logger.log(`Validating ${pageIds.length} pages for extraction`);

    for (const pageId of pageIds) {
      const page = await this.pageModel.findOne({ pageId });

      if (!page) {
        throw new BadRequestException(`Page ${pageId} is not being monitored`);
      }

      if (!page.isActive) {
        throw new BadRequestException(`Page ${pageId} is not active for monitoring`);
      }
    }

    this.logger.log('All pages validated successfully');
  }

  /**
   * 📝 CREAR JOB DE EXTRACCIÓN
   */
  private async createExtractionJob(requestDto: FacebookExtractionRequestDto): Promise<FacebookExtractionJobDocument> {
    const jobId = uuidv4();

    const job = new this.jobModel({
      jobId,
      pageId: requestDto.pageIds[0], // Para compatibilidad, usar primera página
      status: 'pending',
      startedAt: new Date(),
      postsExtracted: 0,
      apiCallsUsed: 0,
      errors: [],
      metadata: {
        requestedBy: requestDto.requestedBy || 'system',
        extractionType: 'manual',
        filters: {
          pageIds: requestDto.pageIds,
          maxPosts: requestDto.maxPosts || 25,
          fields: requestDto.fields || ['message', 'created_time', 'likes', 'shares', 'comments'],
          priority: requestDto.priority || 'normal'
        }
      }
    });

    const savedJob = await job.save();

    this.eventEmitter.emit('facebook.extraction.started', {
      jobId: savedJob.jobId,
      pageIds: requestDto.pageIds,
      requestedBy: requestDto.requestedBy
    });

    this.logger.log(`Created extraction job: ${jobId}`);
    return savedJob;
  }

  /**
   * 📋 OBTENER JOB POR ID
   */
  async getJobById(jobId: string): Promise<FacebookExtractionJobDocument> {
    const job = await this.jobModel.findOne({ jobId });
    if (!job) {
      throw new BadRequestException(`Extraction job ${jobId} not found`);
    }
    return job;
  }

  /**
   * 🧹 LIMPIAR CACHE DE POSTS
   */
  private async clearPostsCache(pageId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const cacheKeys = [
      `facebook:posts:${pageId}:${today}`,
      `facebook:posts:${pageId}:latest`
    ];

    for (const key of cacheKeys) {
      await this.cacheService.del(key);
    }
  }
}