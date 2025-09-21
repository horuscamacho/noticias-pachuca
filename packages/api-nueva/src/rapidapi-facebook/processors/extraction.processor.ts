import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job } from 'bull';
import {
  RapidAPIExtractionJob,
  RapidAPIExtractionJobDocument,
  JobStatus,
  JobProgress
} from '../schemas/rapidapi-extraction-job.schema';
import { RapidAPIFacebookService } from '../services/rapidapi-facebook.service';
import { RapidAPIPageManagementService } from '../services/rapidapi-page-management.service';
import { NotificationRouterService } from '../../notifications/services/notification-router.service';
import { NotificationType } from '../../notifications/schemas/notification-queue.schema';

export interface ExtractionJobData {
  jobId: string;
  pageId: string; // Real Facebook Page ID
  mongoPageId?: string; // MongoDB document ID
  configId?: string;
  userId: string;
  limit?: number;
  includeComments?: boolean;
  includeReactions?: boolean;
  startDate?: string;
  endDate?: string;
}

@Processor('rapidapi-extraction')
export class ExtractionProcessor {
  private readonly logger = new Logger(ExtractionProcessor.name);

  constructor(
    @InjectModel(RapidAPIExtractionJob.name)
    private jobModel: Model<RapidAPIExtractionJobDocument>,
    private readonly facebookService: RapidAPIFacebookService,
    private readonly pageManagementService: RapidAPIPageManagementService,
    private readonly notificationService: NotificationRouterService,
  ) {}

  @Process('extract-posts')
  async handleExtractionJob(job: Job<ExtractionJobData>): Promise<void> {
    const { jobId, pageId, mongoPageId, configId, userId, limit, includeComments, includeReactions, startDate, endDate } = job.data;

    this.logger.log(`🚀 Starting extraction job: ${jobId} for Facebook page: ${pageId} (MongoDB: ${mongoPageId})`);

    try {
      // 1. Update job status to processing
      await this.updateJobStatus(jobId, JobStatus.PROCESSING, {
        totalExpected: limit || 10,
        postsProcessed: 0,
        currentStep: 'Conectando con RapidAPI',
        percentage: 0
      });

      // 2. Notify extraction started - usar AUTO routing
      await this.notificationService.sendToAllDevices(userId, {
        type: NotificationType.FACEBOOK_EXTRACTION_STARTED,
        title: 'Extracción iniciada',
        body: `Extrayendo posts de la página...`,
        data: {
          jobId,
          pageId,
          expectedPosts: limit || 10
        }
      });

      // 3. Extract posts from RapidAPI
      const options = {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        limit: limit || 10,
        includeComments: includeComments || false,
        includeReactions: includeReactions || false
      };

      // Update progress
      await this.updateJobProgress(jobId, {
        currentStep: 'Extrayendo posts via RapidAPI',
        percentage: 25
      });

      const posts = await this.facebookService.getPagePosts(pageId, options, configId);

      // Update progress
      await this.updateJobProgress(jobId, {
        postsProcessed: posts.length,
        currentStep: 'Guardando posts en base de datos',
        percentage: 75
      });

      // 4. Update page stats using MongoDB ID
      if (mongoPageId) {
        await this.pageManagementService.updateStats(mongoPageId, {
          totalPostsExtracted: posts.length,
          lastSuccessfulExtraction: new Date()
        });
      }

      // 5. Mark job as completed
      const result = {
        postsExtracted: posts.length,
        postsSkipped: 0,
        duration: Date.now() - job.timestamp,
        creditsUsed: 1 // TODO: Get real credits from RapidAPI response
      };

      await this.updateJobStatus(jobId, JobStatus.COMPLETED, {
        totalExpected: limit || 10,
        postsProcessed: posts.length,
        currentStep: 'Completado',
        percentage: 100
      }, result);

      // 6. Notify extraction completed - usar AUTO routing
      await this.notificationService.sendToAllDevices(userId, {
        type: NotificationType.FACEBOOK_EXTRACTION_COMPLETED,
        title: 'Extracción completada',
        body: `Se extrajeron ${posts.length} posts exitosamente`,
        data: {
          jobId,
          pageId,
          postsExtracted: posts.length,
          duration: result.duration,
          errors: []
        }
      });

      this.logger.log(`✅ Extraction job completed: ${jobId} - ${posts.length} posts extracted`);

    } catch (error) {
      this.logger.error(`❌ Extraction job failed: ${jobId}`, error);

      // Mark job as failed
      await this.updateJobStatus(jobId, JobStatus.FAILED, {
        currentStep: 'Error en extracción',
        percentage: 0
      }, undefined, {
        code: error.code || 'EXTRACTION_ERROR',
        message: error.message,
        stack: error.stack,
        rapidApiError: error.response?.data
      });

      // Notify extraction failed - usar AUTO routing
      await this.notificationService.sendToAllDevices(userId, {
        type: NotificationType.FACEBOOK_EXTRACTION_FAILED,
        title: 'Error en extracción',
        body: `Error: ${error.message}`,
        data: {
          jobId,
          pageId,
          error: error.message,
          retryCount: 0
        }
      });

      throw error; // Re-throw for Bull to handle retry
    }
  }

  private async updateJobStatus(
    jobId: string,
    status: JobStatus,
    progress?: Partial<JobProgress>,
    result?: { postsExtracted: number; postsSkipped: number; duration: number; creditsUsed: number },
    errorDetails?: { code: string; message: string; stack?: string; rapidApiError?: Record<string, unknown> }
  ): Promise<void> {
    const updateData: Record<string, unknown> = { status };

    if (status === JobStatus.PROCESSING && !await this.jobExists(jobId, 'startedAt')) {
      updateData.startedAt = new Date();
    }

    if (status === JobStatus.COMPLETED || status === JobStatus.FAILED) {
      updateData.completedAt = new Date();
    }

    if (progress) {
      updateData.progress = progress;
    }

    if (result) {
      updateData.result = result;
      updateData.postsExtracted = result.postsExtracted;
    }

    if (errorDetails) {
      updateData.errorDetails = errorDetails;
      updateData.$push = { errors: errorDetails.message };
    }

    await this.jobModel.findOneAndUpdate({ jobId }, updateData);
  }

  private async updateJobProgress(jobId: string, progressUpdate: { currentStep?: string; percentage?: number; postsProcessed?: number }): Promise<void> {
    const updateFields: Record<string, unknown> = {};

    if (progressUpdate.currentStep !== undefined) {
      updateFields['progress.currentStep'] = progressUpdate.currentStep;
    }
    if (progressUpdate.percentage !== undefined) {
      updateFields['progress.percentage'] = progressUpdate.percentage;
    }
    if (progressUpdate.postsProcessed !== undefined) {
      updateFields['progress.postsProcessed'] = progressUpdate.postsProcessed;
    }

    await this.jobModel.findOneAndUpdate(
      { jobId },
      { $set: updateFields }
    );
  }

  private async jobExists(jobId: string, field: string): Promise<boolean> {
    const job = await this.jobModel.findOne({ jobId }).select(field);
    return job && job[field];
  }
}