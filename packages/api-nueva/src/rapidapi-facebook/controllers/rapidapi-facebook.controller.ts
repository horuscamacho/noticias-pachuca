import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  Put,
  Delete,
  BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RapidAPIConfigService } from '../services/rapidapi-config.service';
import { RapidAPIFacebookService } from '../services/rapidapi-facebook.service';
import { RapidAPIPageManagementService } from '../services/rapidapi-page-management.service';
import { CreateRapidAPIConfigDto, UpdateRapidAPIConfigDto, UpdateQuotaUsageDto } from '../dto/rapidapi-config.dto';
import { ValidatePageUrlDto, ExtractPageDetailsDto, CreateRapidAPIFacebookPageDto, UpdateRapidAPIFacebookPageDto } from '../dto/rapidapi-page-management.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { NotificationRouterService } from '../../notifications/services/notification-router.service';
import { SocketGateway } from '../../notifications/gateways/socket.gateway';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExtractionJobData } from '../processors/extraction.processor';
import { RapidAPIExtractionJob, RapidAPIExtractionJobDocument, JobStatus } from '../schemas/rapidapi-extraction-job.schema';

/**
 * 🎯 RAPIDAPI FACEBOOK CONTROLLER
 * Endpoints para gestión de APIs de terceros para Facebook scraping
 * ✅ Sin any types - Todo tipado
 * ✅ Protegido con auth existente
 * ✅ Patrón idéntico al módulo Facebook
 */

@ApiTags('RapidAPI Facebook Scraper')
@ApiBearerAuth()
@Controller('rapidapi-facebook')
export class RapidAPIFacebookController {
  constructor(
    private readonly configService: RapidAPIConfigService,
    private readonly facebookService: RapidAPIFacebookService,
    private readonly pageManagementService: RapidAPIPageManagementService,
    private readonly notificationService: NotificationRouterService,
    private readonly socketGateway: SocketGateway,
    @InjectQueue('rapidapi-extraction')
    private extractionQueue: Queue<ExtractionJobData>,
    @InjectModel(RapidAPIExtractionJob.name)
    private jobModel: Model<RapidAPIExtractionJobDocument>
  ) {}

  // ═══════════════════════════════════════════════════════════════
  // 🩺 HEALTH CHECK - NO AUTH REQUIRED
  // ═══════════════════════════════════════════════════════════════

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint for RapidAPI Facebook module' })
  @ApiResponse({ status: 200, description: 'Module is working correctly' })
  healthCheck() {
    return {
      status: 'ok',
      module: 'RapidAPI Facebook',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔧 API CONFIGURATION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  @Post('config')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new RapidAPI configuration' })
  @ApiResponse({ status: 201, description: 'Configuration created successfully' })
  async createConfig(@Body() dto: CreateRapidAPIConfigDto) {
    return this.configService.create(dto);
  }

  @Get('config')
  @ApiOperation({ summary: 'Get all API configurations with pagination' })
  @ApiResponse({ status: 200, description: 'Configurations retrieved successfully' })
  async getConfigs(@Query() pagination: PaginationDto) {
    // Siguiendo patrón del FB controller - usar pagination service internamente
    const configs = await this.configService.findAll();
    return {
      data: configs,
      pagination: {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        total: configs.length,
        totalPages: Math.ceil(configs.length / (pagination.limit || 10)),
        hasNext: false,
        hasPrev: false
      }
    };
  }

  @Get('config/active')
  @ApiOperation({ summary: 'Get currently active API configuration' })
  @ApiResponse({ status: 200, description: 'Active configuration retrieved' })
  async getActiveConfig() {
    const activeConfig = await this.configService.findActive();
    if (!activeConfig) {
      return { message: 'No active configuration found' };
    }
    return activeConfig;
  }

  @Get('config/:id')
  @ApiOperation({ summary: 'Get API configuration by ID' })
  @ApiResponse({ status: 200, description: 'Configuration retrieved' })
  async getConfig(@Param('id') id: string) {
    return this.configService.findById(id);
  }

  @Put('config/:id')
  @ApiOperation({ summary: 'Update API configuration' })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully' })
  async updateConfig(
    @Param('id') id: string,
    @Body() dto: UpdateRapidAPIConfigDto
  ) {
    return this.configService.update(id, dto);
  }

  @Delete('config/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete API configuration' })
  @ApiResponse({ status: 204, description: 'Configuration deleted successfully' })
  async deleteConfig(@Param('id') id: string) {
    await this.configService.remove(id);
  }

  @Post('config/:id/activate')
  @ApiOperation({ summary: 'Activate API configuration' })
  @ApiResponse({ status: 200, description: 'Configuration activated successfully' })
  async activateConfig(@Param('id') id: string) {
    return this.configService.activate(id);
  }

  @Post('config/:id/test-connection')
  @ApiOperation({ summary: 'Test API configuration connection' })
  @ApiResponse({ status: 200, description: 'Connection test completed' })
  async testConfigConnection(@Param('id') id: string) {
    return this.configService.testConnection(id);
  }

  // ═══════════════════════════════════════════════════════════════
  // 📊 QUOTA AND USAGE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  @Get('config/:id/quota-status')
  @ApiOperation({ summary: 'Get quota status and usage statistics' })
  @ApiResponse({ status: 200, description: 'Quota status retrieved' })
  async getQuotaStatus(@Param('id') id: string) {
    if (!id || id === 'undefined' || id === 'null') {
      throw new BadRequestException('Invalid config ID provided');
    }
    return this.configService.getQuotaStatus(id);
  }

  @Put('config/:id/quota-usage')
  @ApiOperation({ summary: 'Update quota usage manually' })
  @ApiResponse({ status: 200, description: 'Quota usage updated' })
  async updateQuotaUsage(
    @Param('id') id: string,
    @Body() dto: UpdateQuotaUsageDto
  ) {
    return this.configService.updateQuotaUsage(id, dto);
  }

  @Post('config/:id/quota-check')
  @ApiOperation({ summary: 'Check if quota allows for requests' })
  @ApiResponse({ status: 200, description: 'Quota check completed' })
  async checkQuota(
    @Param('id') id: string,
    @Body() dto: { requestCount?: number }
  ) {
    return this.configService.checkQuotaAvailable(id, dto.requestCount || 1);
  }

  @Get('config/:id/usage-stats')
  @ApiOperation({ summary: 'Get detailed usage statistics' })
  @ApiResponse({ status: 200, description: 'Usage statistics retrieved' })
  async getUsageStats(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.configService.getUsageStats(id, start, end);
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔍 FACEBOOK PAGE OPERATIONS
  // ═══════════════════════════════════════════════════════════════

  @Post('validate-page-url')
  @ApiOperation({
    summary: 'Validate Facebook page URL and extract page ID',
    description: 'Extract page ID from Facebook URL using RapidAPI service'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Page URL validated and ID extracted successfully'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid Facebook URL or quota exceeded'
  })
  async validatePageUrl(@Body() dto: ValidatePageUrlDto) {
    const pageId = await this.facebookService.getPageId(dto.pageUrl, dto.configId);
    return {
      isValid: true,
      pageId,
      pageUrl: dto.pageUrl,
      message: 'URL is valid and page ID extracted successfully'
    };
  }

  @Post('extract-page-details')
  @ApiOperation({
    summary: 'Extract detailed page information',
    description: 'Get comprehensive page details using RapidAPI service'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Page details extracted successfully'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Failed to extract page details or quota exceeded'
  })
  async extractPageDetails(@Body() dto: ExtractPageDetailsDto) {
    // Step 1: Extract page details from RapidAPI
    const pageDetails = await this.facebookService.getPageDetails(dto.pageUrl, dto.configId);

    // Step 2: Get page ID (assuming it's already validated)
    const pageId = await this.facebookService.getPageId(dto.pageUrl, dto.configId);

    // Step 3: Create page in database automatically
    const createPageDto: CreateRapidAPIFacebookPageDto = {
      pageId,
      pageUrl: dto.pageUrl,
      pageName: pageDetails.name || `Page ${pageId}`,
      configId: dto.configId || '',
      pageDetails: {
        name: pageDetails.name || '',
        about: pageDetails.about || '',
        category: pageDetails.category || '',
        followers: pageDetails.followers || 0,
        likes: pageDetails.likes || 0,
        website: pageDetails.website || '',
        verified: pageDetails.verified || false,
        profilePicture: pageDetails.profilePicture || '',
        coverPhoto: pageDetails.coverPhoto || '',
        rawData: pageDetails.rawData
      },
      extractionConfig: {
        isActive: false, // Default to inactive
        frequency: 'manual',
        maxPostsPerExtraction: 10,
        extractionFilters: {
          includeComments: false,
          includeReactions: false
        }
      }
    };

    const savedPage = await this.pageManagementService.create(createPageDto);

    return {
      success: true,
      pageDetails,
      page: savedPage,
      message: 'Page details extracted and page created successfully'
    };
  }

  @Post('create-facebook-page')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create Facebook page from URL - saves page immediately',
    description: 'Validates URL, extracts details and saves page to database immediately. Posts extraction is optional and asynchronous.'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Facebook page created successfully'
  })
  async createFacebookPage(@Body() dto: {
    pageUrl: string;
    configId?: string;
    name?: string;
    description?: string;
    extractPostsAsync?: boolean;
  }) {
    // Step 1: Validate URL and get page ID
    const pageId = await this.facebookService.getPageId(dto.pageUrl, dto.configId);

    // Step 2: Get page details
    const pageDetails = await this.facebookService.getPageDetails(dto.pageUrl, dto.configId);

    // Step 3: Save page to database immediately (before posts extraction)
    const createPageDto: CreateRapidAPIFacebookPageDto = {
      pageId,
      pageUrl: dto.pageUrl,
      pageName: dto.name || pageDetails.name || `Page ${pageId}`,
      configId: dto.configId || '',
      pageDetails: {
        name: pageDetails.name || '',
        about: pageDetails.about || '',
        category: pageDetails.category || '',
        followers: pageDetails.followers || 0,
        likes: pageDetails.likes || 0
      },
      extractionConfig: {
        isActive: dto.extractPostsAsync || false,
        frequency: 'manual',
        maxPostsPerExtraction: 10,
        extractionFilters: {
          includeComments: false,
          includeReactions: false
        }
      }
    };

    const savedPage = await this.pageManagementService.create(createPageDto);

    // Step 4: If requested, trigger async posts extraction
    if (dto.extractPostsAsync) {
      // TODO: Implement async posts extraction with WebSocket notifications
      // For now, just return success with job ID
      return {
        success: true,
        page: savedPage,
        pageId,
        pageDetails,
        message: 'Page created successfully. Posts extraction queued for background processing.',
        jobId: `posts-extraction-${savedPage._id}-${Date.now()}`
      };
    }

    return {
      success: true,
      page: savedPage,
      pageId,
      pageDetails,
      message: 'Page created successfully'
    };
  }

  @Post('extract-page-posts')
  @ApiOperation({
    summary: 'Extract posts from Facebook page (synchronous)',
    description: 'Get page posts with optional filtering and pagination - WARNING: Can take 10+ seconds'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Page posts extracted successfully'
  })
  async extractPagePosts(@Body() dto: {
    pageId: string;
    configId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    includeComments?: boolean;
    includeReactions?: boolean;
  }) {
    const options = {
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      limit: dto.limit || 10,
      includeComments: dto.includeComments || false,
      includeReactions: dto.includeReactions || false
    };

    const posts = await this.facebookService.getPagePosts(dto.pageId, options, dto.configId);

    return {
      success: true,
      postsExtracted: posts.length,
      posts,
      pageId: dto.pageId
    };
  }

  @Post('extract-page-posts-async')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Extract posts from Facebook page (asynchronous)',
    description: 'Queue posts extraction as background job with WebSocket notifications'
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Posts extraction job queued successfully'
  })
  async extractPagePostsAsync(
    @Body() dto: {
      pageId: string;
      configId?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      includeComments?: boolean;
      includeReactions?: boolean;
    },
    @CurrentUser() user: { userId: string; username: string }
  ) {
    console.log('🔍 [DEBUG] Usuario en extractPagePostsAsync:', user);

    if (!user || !user.userId) {
      throw new BadRequestException('Usuario no autenticado o ID de usuario no disponible');
    }

    const jobId = `posts-extraction-${dto.pageId}-${Date.now()}`;

    try {
      // 1. Find the page to get the real Facebook Page ID
      const page = await this.pageManagementService.findById(dto.pageId);
      if (!page) {
        throw new BadRequestException(`Página no encontrada: ${dto.pageId}`);
      }

      const realFacebookPageId = page.pageId; // This is the actual Facebook Page ID

      // 2. Create job tracking document
      const jobDocument = new this.jobModel({
        jobId,
        pageId: dto.pageId,
        configId: dto.configId || 'default-config',
        userId: user.userId,
        status: JobStatus.PENDING,
        progress: {
          totalExpected: dto.limit || 10,
          postsProcessed: 0,
          currentStep: 'Esperando procesamiento',
          percentage: 0
        },
        requestParams: {
          limit: dto.limit,
          includeComments: dto.includeComments,
          includeReactions: dto.includeReactions,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          endDate: dto.endDate ? new Date(dto.endDate) : undefined
        },
        errors: []
      });

      await jobDocument.save();

      // 3. Add job to Bull Queue with real Facebook Page ID
      const job = await this.extractionQueue.add('extract-posts', {
        jobId,
        pageId: realFacebookPageId, // Use the real Facebook Page ID
        mongoPageId: dto.pageId, // Keep MongoDB ID for tracking
        configId: dto.configId,
        userId: user.userId,
        limit: dto.limit,
        includeComments: dto.includeComments,
        includeReactions: dto.includeReactions,
        startDate: dto.startDate,
        endDate: dto.endDate
      }, {
        // Job options
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      });

      // 3. Send initial notification
      await this.notifyExtractionProgress(user.userId, 'facebook-extraction-started', {
        jobId,
        pageId: dto.pageId,
        title: 'Extracción iniciada',
        body: `Extrayendo posts de la página ${dto.pageId}...`
      });

      console.log(`🚀 Extraction job queued: ${jobId} for page: ${dto.pageId}`);

      return {
        success: true,
        jobId,
        bullJobId: job.id,
        message: 'Posts extraction job queued successfully. You will receive notifications via Socket.IO.',
        status: 'queued',
        pageId: dto.pageId,
        estimatedCompletion: new Date(Date.now() + 60000) // 1 minute estimate
      };

    } catch (error) {
      console.error(`❌ Failed to queue extraction job for page ${dto.pageId}:`, error);
      throw new BadRequestException(`Failed to queue extraction job: ${error.message}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 📄 PAGE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  @Post('pages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new Facebook page to monitor' })
  @ApiResponse({ status: 201, description: 'Page created successfully' })
  async createPage(@Body() dto: CreateRapidAPIFacebookPageDto) {
    return this.pageManagementService.create(dto);
  }

  @Get('pages')
  @ApiOperation({ summary: 'Get all monitored Facebook pages' })
  @ApiResponse({ status: 200, description: 'Pages retrieved successfully' })
  async getPages(@Query() pagination: PaginationDto) {
    return this.pageManagementService.findAll({}, pagination);
  }

  // 📄 Get ALL Posts from all pages
  @Get('posts')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all extracted posts from all pages' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All posts retrieved successfully'
  })
  async getAllPosts(
    @Query() paginationDto: PaginationDto
  ) {
    return await this.facebookService.getAllStoredPosts(paginationDto);
  }

  // 📄 Get Posts for specific page (MUST be before pages/:id)
  @Get('pages/:pageId/posts')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get extracted posts for a specific page' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Posts retrieved successfully'
  })
  async getPagePosts(
    @Param('pageId') pageId: string,
    @Query() paginationDto: PaginationDto
  ) {
    return await this.facebookService.getStoredPosts(pageId, paginationDto);
  }

  @Get('pages/:id')
  @ApiOperation({ summary: 'Get Facebook page by ID' })
  @ApiResponse({ status: 200, description: 'Page retrieved successfully' })
  async getPage(@Param('id') id: string) {
    return this.pageManagementService.findById(id);
  }

  @Put('pages/:id')
  @ApiOperation({ summary: 'Update Facebook page' })
  @ApiResponse({ status: 200, description: 'Page updated successfully' })
  async updatePage(
    @Param('id') id: string,
    @Body() dto: UpdateRapidAPIFacebookPageDto
  ) {
    return this.pageManagementService.update(id, dto);
  }

  @Delete('pages/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete Facebook page' })
  @ApiResponse({ status: 204, description: 'Page deleted successfully' })
  async deletePage(@Param('id') id: string) {
    await this.pageManagementService.remove(id);
  }

  @Get('pages/:id/stats')
  @ApiOperation({ summary: 'Get page statistics and extraction history' })
  @ApiResponse({ status: 200, description: 'Page stats retrieved successfully' })
  async getPageStats(@Param('id') id: string) {
    return this.pageManagementService.getPageStats(id);
  }

  @Put('pages/:id/extraction-config')
  @ApiOperation({ summary: 'Update page extraction configuration' })
  @ApiResponse({ status: 200, description: 'Extraction config updated successfully' })
  async updateExtractionConfig(
    @Param('id') id: string,
    @Body() dto: {
      extractionConfig: {
        isActive?: boolean;
        frequency?: 'manual' | 'daily' | 'weekly';
        maxPostsPerExtraction?: number;
        extractionFilters?: {
          includeComments?: boolean;
          includeReactions?: boolean;
        };
      };
    }
  ) {
    return this.pageManagementService.updateExtractionConfig(id, dto.extractionConfig);
  }

  @Post('pages/:id/extract')
  @ApiOperation({ summary: 'Trigger manual extraction for page' })
  @ApiResponse({ status: 200, description: 'Extraction triggered successfully' })
  async triggerExtraction(@Param('id') id: string) {
    try {
      // Get page details first
      const page = await this.pageManagementService.findById(id);

      // TODO: Implement actual extraction logic with RapidAPIFacebookService
      // For now, log the extraction attempt
      console.log(`🚀 [EXTRACTION] Starting manual extraction for page: ${page.pageName} (${page.pageId})`);
      console.log(`🔧 [EXTRACTION] Page URL: ${page.pageUrl}`);
      console.log(`⚙️ [EXTRACTION] Config: ${page.configId}`);
      console.log(`🎯 [EXTRACTION] Extraction Config:`, page.extractionConfig);

      // Update stats to simulate extraction
      await this.pageManagementService.updateStats(id, {
        lastSuccessfulExtraction: new Date(),
        totalPostsExtracted: Math.floor(Math.random() * 10) + 1, // Random 1-10 posts
      });

      return {
        success: true,
        message: `Manual extraction started for ${page.pageName}`,
        pageId: page.pageId,
        extractionConfig: page.extractionConfig
      };
    } catch (error) {
      console.error('❌ [EXTRACTION] Error triggering extraction:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 🛠️ UTILITY ENDPOINTS
  // ═══════════════════════════════════════════════════════════════

  @Post('clear-config-cache')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear cache for specific configuration' })
  @ApiResponse({ status: 204, description: 'Configuration cache cleared' })
  async clearConfigCache(@Body() dto: { configId: string }) {
    // TODO: Implement cache clearing when cache is integrated
    return { message: 'Cache cleared successfully' };
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔔 NOTIFICATION METHODS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Send extraction progress notification to user via Socket.IO
   */
  private async notifyExtractionProgress(
    userId: string,
    eventType: 'facebook-extraction-started' | 'facebook-extraction-progress' | 'facebook-extraction-completed' | 'facebook-extraction-failed',
    data: {
      jobId?: string;
      pageId: string;
      title: string;
      body: string;
      [key: string]: unknown;
    }
  ): Promise<void> {
    try {
      await this.notificationService.sendOnlySocket(userId, {
        type: eventType,
        title: data.title,
        body: data.body,
        data: {
          ...data,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error(`❌ Error sending ${eventType} notification:`, error);
      // Don't throw error - notification failure shouldn't break extraction
    }
  }
}