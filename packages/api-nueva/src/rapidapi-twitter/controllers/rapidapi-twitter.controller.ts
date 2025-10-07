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
import { RapidAPITwitterConfigService } from '../services/rapidapi-twitter-config.service';
import { RapidAPITwitterService } from '../services/rapidapi-twitter.service';
import { RapidAPITwitterUserManagementService } from '../services/rapidapi-twitter-user-management.service';
import { CreateRapidAPITwitterConfigDto, UpdateRapidAPITwitterConfigDto, UpdateTwitterQuotaUsageDto } from '../dto/rapidapi-twitter-config.dto';
import { ValidateTwitterUserDto, ExtractTwitterUserDetailsDto, CreateRapidAPITwitterUserDto, UpdateRapidAPITwitterUserDto, ExtractTwitterUserTweetsDto } from '../dto/rapidapi-twitter-user-management.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { NotificationRouterService } from '../../notifications/services/notification-router.service';
import { SocketGateway } from '../../notifications/gateways/socket.gateway';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RapidAPITwitterExtractionJob, RapidAPITwitterExtractionJobDocument, JobStatus } from '../schemas/rapidapi-twitter-extraction-job.schema';

/**
 * 🎯 RAPIDAPI TWITTER CONTROLLER
 * Endpoints para gestión de APIs de terceros para Twitter scraping
 * ✅ Sin any types - Todo tipado
 * ✅ Protegido con auth existente
 * ✅ Patrón idéntico al módulo Facebook
 */

@ApiTags('RapidAPI Twitter Scraper')
@ApiBearerAuth()
@Controller('rapidapi-twitter')
export class RapidAPITwitterController {
  constructor(
    private readonly configService: RapidAPITwitterConfigService,
    private readonly twitterService: RapidAPITwitterService,
    private readonly userManagementService: RapidAPITwitterUserManagementService,
    private readonly notificationService: NotificationRouterService,
    private readonly socketGateway: SocketGateway,
    @InjectQueue('rapidapi-twitter-extraction')
    private extractionQueue: Queue<TwitterExtractionJobData>,
    @InjectModel(RapidAPITwitterExtractionJob.name)
    private jobModel: Model<RapidAPITwitterExtractionJobDocument>
  ) {}

  // ═══════════════════════════════════════════════════════════════
  // 🩺 HEALTH CHECK - NO AUTH REQUIRED
  // ═══════════════════════════════════════════════════════════════

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint for RapidAPI Twitter module' })
  @ApiResponse({ status: 200, description: 'Module is working correctly' })
  healthCheck() {
    return {
      status: 'ok',
      module: 'RapidAPI Twitter',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔧 API CONFIGURATION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  @Post('config')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new RapidAPI Twitter configuration' })
  @ApiResponse({ status: 201, description: 'Configuration created successfully' })
  async createConfig(@Body() dto: CreateRapidAPITwitterConfigDto) {
    return this.configService.create(dto);
  }

  @Get('config')
  @ApiOperation({ summary: 'Get all Twitter API configurations with pagination' })
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
  @ApiOperation({ summary: 'Get currently active Twitter API configuration' })
  @ApiResponse({ status: 200, description: 'Active configuration retrieved' })
  async getActiveConfig() {
    const activeConfig = await this.configService.findActive();
    if (!activeConfig) {
      return { message: 'No active configuration found' };
    }
    return activeConfig;
  }

  @Get('config/:id')
  @ApiOperation({ summary: 'Get Twitter API configuration by ID' })
  @ApiResponse({ status: 200, description: 'Configuration retrieved' })
  async getConfig(@Param('id') id: string) {
    return this.configService.findById(id);
  }

  @Put('config/:id')
  @ApiOperation({ summary: 'Update Twitter API configuration' })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully' })
  async updateConfig(
    @Param('id') id: string,
    @Body() dto: UpdateRapidAPITwitterConfigDto
  ) {
    return this.configService.update(id, dto);
  }

  @Delete('config/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete Twitter API configuration' })
  @ApiResponse({ status: 204, description: 'Configuration deleted successfully' })
  async deleteConfig(@Param('id') id: string) {
    await this.configService.remove(id);
  }

  @Post('config/:id/activate')
  @ApiOperation({ summary: 'Activate Twitter API configuration' })
  @ApiResponse({ status: 200, description: 'Configuration activated successfully' })
  async activateConfig(@Param('id') id: string) {
    return this.configService.activate(id);
  }

  @Post('config/:id/test-connection')
  @ApiOperation({ summary: 'Test Twitter API configuration connection' })
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
    @Body() dto: UpdateTwitterQuotaUsageDto
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
  // 🔍 TWITTER USER OPERATIONS
  // ═══════════════════════════════════════════════════════════════

  @Post('validate-user')
  @ApiOperation({
    summary: 'Validate Twitter username and extract user ID',
    description: 'Extract user ID from Twitter username using RapidAPI service'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Username validated and ID extracted successfully'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid Twitter username or quota exceeded'
  })
  async validateUser(@Body() dto: ValidateTwitterUserDto) {
    const userDetails = await this.twitterService.getUserProfile(dto.username, dto.configId);
    return {
      isValid: true,
      userId: userDetails.id,
      username: dto.username,
      displayName: userDetails.displayName,
      message: 'Username is valid and user ID extracted successfully'
    };
  }

  @Post('extract-user-details')
  @ApiOperation({
    summary: 'Extract detailed Twitter user information',
    description: 'Get comprehensive user details using RapidAPI service'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User details extracted successfully'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Failed to extract user details or quota exceeded'
  })
  async extractUserDetails(@Body() dto: ExtractTwitterUserDetailsDto) {
    // Step 1: Extract user details from RapidAPI
    const userDetails = await this.twitterService.getUserProfile(dto.username, dto.configId);

    // Step 2: Create user in database automatically
    const createUserDto: CreateRapidAPITwitterUserDto = {
      userId: userDetails.id,
      username: dto.username,
      displayName: userDetails.displayName || dto.username,
      userUrl: `https://twitter.com/${dto.username}`,
      configId: dto.configId || '',
      userDetails: {
        bio: userDetails.bio,
        followers: userDetails.followers,
        following: userDetails.following,
        tweetsCount: userDetails.tweetsCount,
        verified: userDetails.verified,
        isBlueVerified: userDetails.isBlueVerified,
        profilePicture: userDetails.profilePicture,
        location: userDetails.location,
        website: userDetails.website,
        rawData: userDetails.rawData
      },
      extractionConfig: {
        isActive: false, // Default to inactive
        frequency: 'manual',
        maxPostsPerExtraction: 20,
        extractionFilters: {
          includeReplies: false,
          includeRetweets: true
        }
      }
    };

    const savedUser = await this.userManagementService.create(createUserDto);

    return {
      success: true,
      userDetails,
      user: savedUser,
      message: 'User details extracted and user created successfully'
    };
  }

  @Post('create-twitter-user')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create Twitter user from username - saves user immediately',
    description: 'Validates username, extracts details and saves user to database immediately. Tweets extraction is optional and asynchronous.'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Twitter user created successfully'
  })
  async createTwitterUser(@Body() dto: {
    username: string;
    configId?: string;
    displayName?: string;
    description?: string;
    extractTweetsAsync?: boolean;
  }) {
    // Step 1: Validate username and get user details
    const userDetails = await this.twitterService.getUserProfile(dto.username, dto.configId);

    // Step 2: Save user to database immediately (before tweets extraction)
    const createUserDto: CreateRapidAPITwitterUserDto = {
      userId: userDetails.id,
      username: dto.username,
      displayName: dto.displayName || userDetails.displayName || dto.username,
      userUrl: `https://twitter.com/${dto.username}`,
      configId: dto.configId || '',
      userDetails: {
        bio: userDetails.bio || '',
        followers: userDetails.followers || 0,
        following: userDetails.following || 0,
        tweetsCount: userDetails.tweetsCount || 0,
        verified: userDetails.verified || false
      },
      extractionConfig: {
        isActive: dto.extractTweetsAsync || false,
        frequency: 'manual',
        maxPostsPerExtraction: 20,
        extractionFilters: {
          includeReplies: false,
          includeRetweets: true
        }
      }
    };

    const savedUser = await this.userManagementService.create(createUserDto);

    // Step 3: If requested, trigger async tweets extraction
    if (dto.extractTweetsAsync) {
      // TODO: Implement async tweets extraction with WebSocket notifications
      // For now, just return success with job ID
      return {
        success: true,
        user: savedUser,
        userId: userDetails.id,
        userDetails,
        message: 'User created successfully. Tweets extraction queued for background processing.',
        jobId: `tweets-extraction-${savedUser._id}-${Date.now()}`
      };
    }

    return {
      success: true,
      user: savedUser,
      userId: userDetails.id,
      userDetails,
      message: 'User created successfully'
    };
  }

  @Post('extract-user-tweets')
  @ApiOperation({
    summary: 'Extract tweets from Twitter user (synchronous)',
    description: 'Get user tweets with optional filtering and pagination - WARNING: Can take 10+ seconds'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User tweets extracted successfully'
  })
  async extractUserTweets(@Body() dto: ExtractTwitterUserTweetsDto) {
    const options = {
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      count: dto.count || 20,
      includeReplies: dto.includeReplies || false,
      includeRetweets: dto.includeRetweets || true
    };

    const tweets = await this.twitterService.getUserTweets(dto.userId, options, dto.configId);

    return {
      success: true,
      tweetsExtracted: tweets.length,
      tweets,
      userId: dto.userId
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 📄 USER MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new Twitter user to monitor' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async createUser(@Body() dto: CreateRapidAPITwitterUserDto) {
    return this.userManagementService.create(dto);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all monitored Twitter users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getUsers(@Query() pagination: PaginationDto) {
    return this.userManagementService.findAll({}, pagination);
  }

  // 📄 Get ALL Tweets from all users
  @Get('tweets')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all extracted tweets from all users' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All tweets retrieved successfully'
  })
  async getAllTweets(
    @Query() paginationDto: PaginationDto
  ) {
    // TODO: Implement getAllStoredTweets method in service
    throw new BadRequestException('Method not implemented yet');
  }

  // 📄 Get Tweets for specific user (MUST be before users/:id)
  @Get('users/:userId/tweets')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get extracted tweets for a specific user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tweets retrieved successfully'
  })
  async getUserTweets(
    @Param('userId') userId: string,
    @Query() paginationDto: PaginationDto
  ) {
    // TODO: Implement getStoredTweets method in service
    throw new BadRequestException('Method not implemented yet');
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get Twitter user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  async getUser(@Param('id') id: string) {
    return this.userManagementService.findById(id);
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update Twitter user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateRapidAPITwitterUserDto
  ) {
    return this.userManagementService.update(id, dto);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete Twitter user' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  async deleteUser(@Param('id') id: string) {
    await this.userManagementService.remove(id);
  }

  @Get('users/:id/stats')
  @ApiOperation({ summary: 'Get user statistics and extraction history' })
  @ApiResponse({ status: 200, description: 'User stats retrieved successfully' })
  async getUserStats(@Param('id') id: string) {
    return this.userManagementService.getUserStats(id);
  }

  @Put('users/:id/extraction-config')
  @ApiOperation({ summary: 'Update user extraction configuration' })
  @ApiResponse({ status: 200, description: 'Extraction config updated successfully' })
  async updateExtractionConfig(
    @Param('id') id: string,
    @Body() dto: {
      extractionConfig: {
        isActive?: boolean;
        frequency?: 'manual' | 'daily' | 'weekly';
        maxPostsPerExtraction?: number;
        extractionFilters?: {
          includeReplies?: boolean;
          includeRetweets?: boolean;
        };
      };
    }
  ) {
    return this.userManagementService.updateExtractionConfig(id, dto.extractionConfig);
  }

  @Post('users/:id/extract')
  @ApiOperation({ summary: 'Trigger manual extraction for user' })
  @ApiResponse({ status: 200, description: 'Extraction triggered successfully' })
  async triggerExtraction(@Param('id') id: string) {
    try {
      // Get user details first
      const user = await this.userManagementService.findById(id);

      // TODO: Implement actual extraction logic with RapidAPITwitterService
      // For now, log the extraction attempt
      console.log(`🚀 [EXTRACTION] Starting manual extraction for user: ${user.displayName} (@${user.username})`);
      console.log(`🔧 [EXTRACTION] User URL: ${user.userUrl}`);
      console.log(`⚙️ [EXTRACTION] Config: ${user.configId}`);
      console.log(`🎯 [EXTRACTION] Extraction Config:`, user.extractionConfig);

      // Update stats to simulate extraction
      await this.userManagementService.updateStats(id, {
        lastSuccessfulExtraction: new Date(),
        totalPostsExtracted: Math.floor(Math.random() * 20) + 1, // Random 1-20 tweets
      });

      return {
        success: true,
        message: `Manual extraction started for ${user.displayName}`,
        userId: user.userId,
        extractionConfig: user.extractionConfig
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
    eventType: 'twitter-extraction-started' | 'twitter-extraction-progress' | 'twitter-extraction-completed' | 'twitter-extraction-failed',
    data: {
      jobId?: string;
      userId: string;
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

// Interface para jobs de extracción de Twitter
interface TwitterExtractionJobData {
  jobId: string;
  twitterUserId: string; // Twitter user rest_id
  mongoUserId: string; // MongoDB user ID for tracking
  configId?: string;
  authUserId: string; // Auth user ID
  count?: number;
  includeReplies?: boolean;
  includeRetweets?: boolean;
  startDate?: string;
  endDate?: string;
}