import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpStatus,
  UseGuards,
  Logger
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery
} from '@nestjs/swagger';

import { FacebookExtractionService } from '../services/facebook-extraction.service';
import { FacebookExtractionQueueService } from '../services/facebook-extraction-queue.service';
import { PaginationService } from '../../common/services/pagination.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';

import {
  FacebookExtractionRequestDto,
  FacebookJobListDto,
  ExtractedPostListDto
} from '../dto/facebook-page-management.dto';
import { FacebookExtractionJobDocument } from '../schemas/facebook-extraction-job.schema';
import { ExtractedFacebookPostDocument } from '../schemas/extracted-facebook-post.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@ApiTags('Facebook Content Extraction')
@Controller('content-extraction-facebook/extraction')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class FacebookExtractionController {
  private readonly logger = new Logger(FacebookExtractionController.name);

  constructor(
    private readonly extractionService: FacebookExtractionService,
    private readonly queueService: FacebookExtractionQueueService,
    private readonly paginationService: PaginationService,
    @InjectModel('FacebookExtractionJob')
    private readonly jobModel: Model<FacebookExtractionJobDocument>,
    @InjectModel('ExtractedFacebookPost')
    private readonly postModel: Model<ExtractedFacebookPostDocument>,
  ) {}

  /**
   * 🚀 EJECUTAR EXTRACCIÓN MANUAL
   */
  @Post('manual')
  @ApiOperation({
    summary: 'Start manual Facebook content extraction',
    description: 'Manually trigger content extraction for specified Facebook pages'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Extraction job started successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Extraction job started successfully' },
        jobId: { type: 'string', example: 'manual-1695123456789-abc123' },
        queueJobId: { type: 'string', example: '42' },
        pageIds: { type: 'array', items: { type: 'string' } },
        estimatedDuration: { type: 'string', example: '5-10 minutes' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid page IDs or pages not monitored'
  })
  async startManualExtraction(@Body() extractionRequest: FacebookExtractionRequestDto): Promise<{
    message: string;
    jobId: string;
    queueJobId: string;
    pageIds: string[];
    estimatedDuration: string;
  }> {
    this.logger.log(`Starting manual extraction for ${extractionRequest.pageIds.length} pages`);

    // Agregar a la cola de extracción
    const queueJob = await this.queueService.addManualExtractionJob(
      extractionRequest,
      extractionRequest.priority || 'normal'
    );

    const estimatedMinutes = extractionRequest.pageIds.length * 2; // 2 min por página estimado

    return {
      message: 'Extraction job started successfully',
      jobId: queueJob.data.jobId,
      queueJobId: queueJob.id?.toString() || 'unknown',
      pageIds: extractionRequest.pageIds,
      estimatedDuration: `${estimatedMinutes}-${estimatedMinutes + 5} minutes`
    };
  }

  /**
   * 📋 OBTENER LISTA DE TRABAJOS DE EXTRACCIÓN
   */
  @Get('jobs')
  @ApiOperation({
    summary: 'Get list of extraction jobs',
    description: 'Retrieve paginated list of Facebook extraction jobs with filtering'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Extraction jobs retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              jobId: { type: 'string', example: 'manual-1695123456789-abc123' },
              pageId: { type: 'string', example: '123456789' },
              status: { type: 'string', enum: ['pending', 'running', 'completed', 'failed'] },
              startedAt: { type: 'string', format: 'date-time' },
              completedAt: { type: 'string', format: 'date-time' },
              postsExtracted: { type: 'number', example: 25 },
              apiCallsUsed: { type: 'number', example: 3 },
              errors: { type: 'array', items: { type: 'string' } },
              metadata: {
                type: 'object',
                properties: {
                  requestedBy: { type: 'string', example: 'user_123' },
                  extractionType: { type: 'string', example: 'manual' }
                }
              }
            }
          }
        },
        pagination: { type: 'object' }
      }
    }
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'running', 'completed', 'failed'] })
  @ApiQuery({ name: 'pageId', required: false, type: String, description: 'Filter by page ID' })
  @ApiQuery({ name: 'requestedBy', required: false, type: String, description: 'Filter by requester' })
  async getExtractionJobs(@Query() query: FacebookJobListDto): Promise<PaginatedResponse<FacebookExtractionJobDocument>> {
    this.logger.log(`Getting extraction jobs: ${JSON.stringify(query)}`);

    // Construir filtros
    const filter: Record<string, unknown> = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.pageId) {
      filter.pageId = query.pageId;
    }

    if (query.requestedBy) {
      filter['metadata.requestedBy'] = query.requestedBy;
    }

    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) {
        (filter.createdAt as Record<string, unknown>).$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        (filter.createdAt as Record<string, unknown>).$lte = new Date(query.endDate);
      }
    }

    // Configurar ordenamiento
    const sortField = query.sortBy || 'createdAt';
    const sortDirection: 1 | -1 = query.sortOrder === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortDirection };

    return await this.paginationService.paginate(
      this.jobModel,
      query,
      filter,
      { sort }
    );
  }

  /**
   * 📄 OBTENER DETALLE DE TRABAJO DE EXTRACCIÓN
   */
  @Get('jobs/:jobId')
  @ApiOperation({
    summary: 'Get extraction job details',
    description: 'Retrieve detailed information about a specific extraction job'
  })
  @ApiParam({
    name: 'jobId',
    description: 'Extraction Job ID',
    example: 'manual-1695123456789-abc123'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Job details retrieved successfully'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Job not found'
  })
  async getJobDetails(@Param('jobId') jobId: string): Promise<FacebookExtractionJobDocument> {
    this.logger.log(`Getting job details: ${jobId}`);
    return await this.extractionService.getJobById(jobId);
  }

  /**
   * 📊 OBTENER POSTS EXTRAÍDOS
   */
  @Get('posts')
  @ApiOperation({
    summary: 'Get extracted Facebook posts',
    description: 'Retrieve paginated list of extracted Facebook posts with filtering'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Extracted posts retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              facebookPostId: { type: 'string', example: '123456789_987654321' },
              pageId: { type: 'string', example: '123456789' },
              content: { type: 'string', example: 'Post content here...' },
              createdTime: { type: 'string', format: 'date-time' },
              extractedAt: { type: 'string', format: 'date-time' },
              metrics: {
                type: 'object',
                properties: {
                  likes: { type: 'number', example: 150 },
                  shares: { type: 'number', example: 25 },
                  comments: { type: 'number', example: 45 },
                  reactions: { type: 'object' }
                }
              },
              media: { type: 'array', items: { type: 'object' } },
              hashtags: { type: 'array', items: { type: 'string' } },
              engagementScore: { type: 'number', example: 245 }
            }
          }
        },
        pagination: { type: 'object' }
      }
    }
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'pageId', required: false, type: String, description: 'Filter by page ID' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date filter' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date filter' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in post content' })
  @ApiQuery({ name: 'hashtag', required: false, type: String, description: 'Filter by hashtag' })
  @ApiQuery({ name: 'minEngagement', required: false, type: Number, description: 'Minimum engagement score' })
  async getExtractedPosts(@Query() query: ExtractedPostListDto): Promise<PaginatedResponse<ExtractedFacebookPostDocument>> {
    this.logger.log(`Getting extracted posts: ${JSON.stringify(query)}`);

    // Construir filtros
    const filter: Record<string, unknown> = {};

    if (query.pageId) {
      filter.pageId = query.pageId;
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query.startDate || query.endDate) {
      filter.createdTime = {};
      if (query.startDate) {
        (filter.createdTime as Record<string, unknown>).$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        (filter.createdTime as Record<string, unknown>).$lte = new Date(query.endDate);
      }
    }

    if (query.search) {
      filter.content = new RegExp(query.search, 'i');
    }

    if (query.hashtag) {
      const hashtag = query.hashtag.startsWith('#') ? query.hashtag.slice(1) : query.hashtag;
      filter.hashtags = { $in: [hashtag.toLowerCase()] };
    }

    if (query.minEngagement) {
      filter.engagementScore = { $gte: query.minEngagement };
    }

    // Configurar ordenamiento
    const sortField = query.sortBy || 'createdTime';
    const sortDirection: 1 | -1 = query.sortOrder === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortDirection };

    return await this.paginationService.paginate(
      this.postModel,
      query,
      filter,
      { sort }
    );
  }

  /**
   * 📊 OBTENER ESTADÍSTICAS DE LA COLA
   */
  @Get('queue/stats')
  @ApiOperation({
    summary: 'Get extraction queue statistics',
    description: 'Get current status and statistics of the extraction queue'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Queue statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        waiting: { type: 'number', example: 3 },
        active: { type: 'number', example: 1 },
        completed: { type: 'number', example: 25 },
        failed: { type: 'number', example: 2 },
        delayed: { type: 'number', example: 0 },
        paused: { type: 'boolean', example: false }
      }
    }
  })
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: boolean;
  }> {
    this.logger.log('Getting queue statistics');
    return await this.queueService.getQueueStats();
  }

  /**
   * 🔄 OBTENER TRABAJOS ACTIVOS
   */
  @Get('queue/active')
  @ApiOperation({
    summary: 'Get active extraction jobs',
    description: 'Get list of currently running extraction jobs with progress'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active jobs retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        activeJobs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '42' },
              jobId: { type: 'string', example: 'manual-1695123456789-abc123' },
              progress: {
                type: 'object',
                properties: {
                  percentage: { type: 'number', example: 65 },
                  currentPage: { type: 'string', example: '123456789' },
                  pagesCompleted: { type: 'number', example: 2 },
                  totalPages: { type: 'number', example: 3 },
                  postsExtracted: { type: 'number', example: 47 },
                  apiCallsUsed: { type: 'number', example: 6 },
                  errors: { type: 'array', items: { type: 'string' } }
                }
              },
              startedAt: { type: 'string', format: 'date-time' }
            }
          }
        },
        totalActive: { type: 'number', example: 1 }
      }
    }
  })
  async getActiveJobs(): Promise<{
    activeJobs: Array<{
      id: string;
      jobId: string;
      progress: {
        percentage: number;
        currentPage?: string;
        pagesCompleted: number;
        totalPages: number;
        postsExtracted: number;
        apiCallsUsed: number;
        errors: string[];
      };
      startedAt: Date;
    }>;
    totalActive: number;
  }> {
    this.logger.log('Getting active jobs');

    const activeJobs = await this.queueService.getActiveJobs();

    return {
      activeJobs: activeJobs.map(job => ({
        id: job.id,
        jobId: job.data.jobId,
        progress: job.progress,
        startedAt: job.startedAt
      })),
      totalActive: activeJobs.length
    };
  }

  /**
   * ❌ CANCELAR TRABAJO DE EXTRACCIÓN
   */
  @Post('jobs/:queueJobId/cancel')
  @ApiOperation({
    summary: 'Cancel extraction job',
    description: 'Cancel a pending or running extraction job'
  })
  @ApiParam({
    name: 'queueJobId',
    description: 'Queue Job ID (not the jobId)',
    example: '42'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Job cancelled successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Job cancelled successfully' },
        queueJobId: { type: 'string', example: '42' }
      }
    }
  })
  async cancelJob(@Param('queueJobId') queueJobId: string): Promise<{
    message: string;
    queueJobId: string;
  }> {
    this.logger.log(`Cancelling job: ${queueJobId}`);

    await this.queueService.cancelJob(queueJobId);

    return {
      message: 'Job cancelled successfully',
      queueJobId
    };
  }
}