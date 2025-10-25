import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  HttpException,
  NotFoundException,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../auth/guards/jwt-auth.guard';

import { GeneratorProOrchestratorService } from '../services/generator-pro-orchestrator.service';
import { NewsWebsiteService } from '../services/news-website.service';
import { FacebookPublishingService } from '../services/facebook-publishing.service';
import { GeneratorProQueueService } from '../services/generator-pro-queue.service';
import { FacebookPagesService } from '../services/facebook-pages.service';
import { ContentAgentService } from '../services/content-agent.service';
import { GeneratorProPromptBuilderService } from '../services/generator-pro-prompt-builder.service';
import { DirectorEditorialPromptBuilderService } from '../services/director-editorial-prompt-builder.service';
import { SocialMediaCopyGeneratorService } from '../services/social-media-copy-generator.service';
import { GeneratorProSchedulerService } from '../services/generator-pro-scheduler.service';
import { UserContentService } from '../services/user-content.service';
import { ProviderFactoryService } from '../../content-ai/services/provider-factory.service';

import {
  CreateWebsiteConfigDto,
  UpdateWebsiteConfigDto,
  CreateFacebookConfigDto,
  UpdateFacebookConfigDto,
  CreateJobDto,
  JobFiltersDto,
  SystemControlDto,
  GeneratorProTestSelectorsDto,
  WebsiteConfigResponseDto,
  FacebookConfigResponseDto,
  JobStatsResponseDto,
  SystemStatusResponseDto,
  TestListingSelectorsDto,
  TestIndividualContentDto,
  TestListingResponseDto,
  TestContentResponseDto,
  ExtractedNoticiaResponseDto,
  ExtractedContentResponseDto,
  GeneratedContentResponseDto,
} from '../dto';

import {
  CreateUrgentContentDto,
  CreateNormalContentDto,
  UpdateUrgentContentDto,
  UserGeneratedContentResponseDto,
  ActiveUrgentContentResponseDto,
} from '../dto/user-generated-content.dto';

import {
  CreateContentAgentDto,
  UpdateContentAgentDto,
  AgentStatisticsDto,
  ContentAgentResponseDto,
  WritingTone,
  VocabularyLevel,
  ContentLength,
  ContentStructure,
  TargetAudience
} from '../dto/content-agent.dto';

import { FacebookPagesResponseDto } from '../dto/facebook-page.dto';

import { NewsWebsiteConfig, NewsWebsiteConfigDocument } from '../schemas/news-website-config.schema';
import { FacebookPublishingConfig, FacebookPublishingConfigDocument } from '../schemas/facebook-publishing-config.schema';
import { GeneratorProJob, GeneratorProJobDocument } from '../schemas/generator-pro-job.schema';
import { ExtractedNoticia, ExtractedNoticiaDocument } from '../../noticias/schemas/extracted-noticia.schema';
import { AIContentGeneration, AIContentGenerationDocument } from '../../content-ai/schemas/ai-content-generation.schema';
import { ContentAgent, ContentAgentDocument } from '../schemas/content-agent.schema';
import { Site, SiteDocument } from '../../pachuca-noticias/schemas/site.schema';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SocketGateway } from '../../notifications/gateways/socket.gateway';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * 🤖 Controller principal para sistema Generator Pro
 * Gestiona configuraciones, trabajos, sistema y monitoreo
 */

@ApiTags('Generator Pro')
@Controller('generator-pro')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class GeneratorProController {
  private readonly logger = new Logger(GeneratorProController.name);

  constructor(
    @InjectModel(NewsWebsiteConfig.name)
    private readonly websiteConfigModel: Model<NewsWebsiteConfigDocument>,
    @InjectModel(FacebookPublishingConfig.name)
    private readonly facebookConfigModel: Model<FacebookPublishingConfigDocument>,
    @InjectModel(GeneratorProJob.name)
    private readonly jobModel: Model<GeneratorProJobDocument>,
    @InjectModel(ExtractedNoticia.name)
    private readonly extractedNoticiaModel: Model<ExtractedNoticiaDocument>,
    @InjectModel(AIContentGeneration.name)
    private readonly aiContentGenerationModel: Model<AIContentGenerationDocument>,
    @InjectModel(ContentAgent.name)
    private readonly contentAgentModel: Model<ContentAgentDocument>,
    @InjectModel(Site.name)
    private readonly siteModel: Model<SiteDocument>,
    private readonly orchestratorService: GeneratorProOrchestratorService,
    private readonly websiteService: NewsWebsiteService,
    private readonly facebookService: FacebookPublishingService,
    private readonly queueService: GeneratorProQueueService,
    private readonly facebookPagesService: FacebookPagesService,
    private readonly contentAgentService: ContentAgentService,
    private readonly promptBuilderService: GeneratorProPromptBuilderService,
    private readonly directorEditorialPromptBuilder: DirectorEditorialPromptBuilderService,
    private readonly socialCopyService: SocialMediaCopyGeneratorService,
    private readonly schedulerService: GeneratorProSchedulerService,
    private readonly providerFactory: ProviderFactoryService,
    private readonly eventEmitter: EventEmitter2,
    private readonly socketGateway: SocketGateway,
    private readonly userContentService: UserContentService, // 📝 FASE 5: Manual Content Creation
  ) {
    this.logger.log('🤖 Generator Pro Controller initialized');
  }

  // ===================================
  // 🌐 GESTIÓN DE SITIOS WEB
  // ===================================

  @Get('websites')
  @ApiOperation({ summary: 'Listar configuraciones de sitios web' })
  @ApiResponse({ status: 200, description: 'Lista de sitios web configurados', type: [WebsiteConfigResponseDto] })
  async getWebsites(
    @Query('active') active?: boolean,
    @Query('limit') limit = 50,
    @Query('page') page = 1
  ): Promise<{ websites: WebsiteConfigResponseDto[]; total: number; page: number; limit: number }> {
    this.logger.log(`🌐 Getting websites - active: ${active}, page: ${page}, limit: ${limit}`);

    try {
      const filter: Record<string, unknown> = {};
      if (active !== undefined) {
        filter.isActive = active;
      }

      const skip = (page - 1) * limit;
      const [websites, total] = await Promise.all([
        this.websiteConfigModel
          .find(filter)
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .lean(),
        this.websiteConfigModel.countDocuments(filter),
      ]);

      const responseWebsites: WebsiteConfigResponseDto[] = websites.map(site => ({
        id: site._id.toString(),
        name: site.name,
        baseUrl: site.baseUrl,
        listingUrl: site.listingUrl,
        testUrl: site.testUrl,
        isActive: site.isActive,
        extractionFrequency: site.extractionFrequency,
        contentGenerationFrequency: site.contentGenerationFrequency,
        publishingFrequency: site.publishingFrequency,
        listingSelectors: site.listingSelectors,
        contentSelectors: site.contentSelectors,
        extractionSettings: site.extractionSettings,
        lastExtractionRun: site.lastExtractionRun,
        lastGenerationRun: site.lastGenerationRun,
        lastPublishingRun: site.lastPublishingRun,
        statistics: site.statistics,
        createdAt: site.createdAt,
        updatedAt: site.updatedAt,
      }));

      return {
        websites: responseWebsites,
        total,
        page,
        limit,
      };

    } catch (error) {
      this.logger.error(`❌ Failed to get websites: ${error.message}`);
      throw new HttpException('Failed to fetch websites', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('websites')
  @ApiOperation({ summary: 'Crear nueva configuración de sitio web' })
  @ApiResponse({ status: 201, description: 'Configuración creada exitosamente', type: WebsiteConfigResponseDto })
  async createWebsite(@Body() createDto: CreateWebsiteConfigDto): Promise<{ website: WebsiteConfigResponseDto; message: string }> {
    this.logger.log(`🌐 Creating website: ${createDto.name}`);

    try {
      // Validar que no existe un sitio con el mismo baseUrl
      const existingSite = await this.websiteConfigModel.findOne({ baseUrl: createDto.baseUrl });
      if (existingSite) {
        throw new HttpException('Website with this baseUrl already exists', HttpStatus.CONFLICT);
      }

      // Crear nueva configuración
      const websiteConfig = new this.websiteConfigModel({
        name: createDto.name,
        baseUrl: createDto.baseUrl,
        listingUrl: createDto.listingUrl,
        testUrl: createDto.testUrl,
        listingSelectors: createDto.listingSelectors,
        contentSelectors: createDto.contentSelectors,
        extractionSettings: createDto.extractionSettings,
        customHeaders: createDto.customHeaders || {},
        defaultTemplateId: createDto.defaultTemplateId ? new Types.ObjectId(createDto.defaultTemplateId) : undefined,
        contentSettings: createDto.contentSettings,
        notes: createDto.notes,
        isActive: createDto.isActive ?? true,
        extractionFrequency: createDto.extractionFrequency ?? 60,
        contentGenerationFrequency: createDto.generationFrequency ?? 120,
        publishingFrequency: createDto.publishingFrequency ?? 30,
      });

      const savedConfig = await websiteConfig.save();

      this.eventEmitter.emit('generator-pro.website.created', {
        websiteId: savedConfig._id,
        name: savedConfig.name,
        timestamp: new Date(),
      });

      const responseDto: WebsiteConfigResponseDto = {
        id: (savedConfig._id as Types.ObjectId).toString(),
        name: savedConfig.name,
        baseUrl: savedConfig.baseUrl,
        listingUrl: savedConfig.listingUrl,
        isActive: savedConfig.isActive,
        extractionFrequency: savedConfig.extractionFrequency,
        contentGenerationFrequency: savedConfig.contentGenerationFrequency,
        publishingFrequency: savedConfig.publishingFrequency,
        lastExtractionRun: savedConfig.lastExtractionRun,
        lastGenerationRun: savedConfig.lastGenerationRun,
        lastPublishingRun: savedConfig.lastPublishingRun,
        statistics: savedConfig.statistics,
        createdAt: savedConfig.createdAt,
        updatedAt: savedConfig.updatedAt,
      };

      return {
        website: responseDto,
        message: 'Website configuration created successfully',
      };

    } catch (error) {
      this.logger.error(`❌ Failed to create website: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException('Failed to create website configuration', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put('websites/:id')
  @ApiOperation({ summary: 'Actualizar configuración de sitio web' })
  @ApiResponse({ status: 200, description: 'Configuración actualizada exitosamente' })
  async updateWebsite(
    @Param('id') id: string,
    @Body() updateDto: UpdateWebsiteConfigDto
  ): Promise<{ website: WebsiteConfigResponseDto; message: string }> {
    this.logger.log(`🌐 Updating website: ${id}`);

    try {
      const updatedConfig = await this.websiteConfigModel.findByIdAndUpdate(
        id,
        {
          ...updateDto,
          defaultTemplateId: updateDto.defaultTemplateId ? new Types.ObjectId(updateDto.defaultTemplateId) : undefined,
          updatedAt: new Date(),
        },
        { new: true, runValidators: true }
      );

      if (!updatedConfig) {
        throw new HttpException('Website configuration not found', HttpStatus.NOT_FOUND);
      }

      this.eventEmitter.emit('generator-pro.website.updated', {
        websiteId: updatedConfig._id,
        name: updatedConfig.name,
        timestamp: new Date(),
      });

      const responseDto: WebsiteConfigResponseDto = {
        id: (updatedConfig._id as Types.ObjectId).toString(),
        name: updatedConfig.name,
        baseUrl: updatedConfig.baseUrl,
        listingUrl: updatedConfig.listingUrl,
        isActive: updatedConfig.isActive,
        extractionFrequency: updatedConfig.extractionFrequency,
        contentGenerationFrequency: updatedConfig.contentGenerationFrequency,
        publishingFrequency: updatedConfig.publishingFrequency,
        lastExtractionRun: updatedConfig.lastExtractionRun,
        lastGenerationRun: updatedConfig.lastGenerationRun,
        lastPublishingRun: updatedConfig.lastPublishingRun,
        statistics: updatedConfig.statistics,
        createdAt: updatedConfig.createdAt,
        updatedAt: updatedConfig.updatedAt,
      };

      return {
        website: responseDto,
        message: 'Website configuration updated successfully',
      };

    } catch (error) {
      this.logger.error(`❌ Failed to update website ${id}: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException('Failed to update website configuration', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete('websites/:id')
  @ApiOperation({ summary: 'Eliminar configuración de sitio web' })
  @ApiResponse({ status: 200, description: 'Configuración eliminada exitosamente' })
  async deleteWebsite(@Param('id') id: string): Promise<{ message: string }> {
    this.logger.log(`🌐 Deleting website: ${id}`);

    try {
      // Pausar sitio web antes de eliminar
      await this.orchestratorService.pauseWebsite(id);

      // Eliminar configuración
      const deletedConfig = await this.websiteConfigModel.findByIdAndDelete(id);

      if (!deletedConfig) {
        throw new HttpException('Website configuration not found', HttpStatus.NOT_FOUND);
      }

      // Eliminar configuraciones de Facebook asociadas
      await this.facebookConfigModel.deleteMany({ websiteConfigId: new Types.ObjectId(id) });

      this.eventEmitter.emit('generator-pro.website.deleted', {
        websiteId: id,
        name: deletedConfig.name,
        timestamp: new Date(),
      });

      return {
        message: 'Website configuration deleted successfully',
      };

    } catch (error) {
      this.logger.error(`❌ Failed to delete website ${id}: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException('Failed to delete website configuration', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 📊 GET /websites/:id/statistics
   * Obtener estadísticas reales del outlet desde extractednoticias
   */
  @Get('websites/:id/statistics')
  @ApiOperation({ summary: 'Get real outlet statistics from database' })
  @ApiResponse({ status: 200, description: 'Outlet statistics retrieved successfully' })
  async getOutletStatistics(
    @Param('id') websiteId: string
  ): Promise<{
    totalUrlsExtracted: number;
    totalContentExtracted: number;
    totalFailed: number;
    successRate: number;
  }> {
    this.logger.log(`📊 Fetching statistics for outlet: ${websiteId}`);

    try {
      // Validar que el website existe
      const websiteConfig = await this.websiteConfigModel.findById(websiteId);
      if (!websiteConfig) {
        throw new NotFoundException('Website configuration not found');
      }

      // Contar noticias por website
      const totalUrlsExtracted = await this.extractedNoticiaModel.countDocuments({
        websiteConfigId: new Types.ObjectId(websiteId),
      });

      const totalContentExtracted = await this.extractedNoticiaModel.countDocuments({
        websiteConfigId: new Types.ObjectId(websiteId),
        status: 'extracted',
      });

      const totalFailed = await this.extractedNoticiaModel.countDocuments({
        websiteConfigId: new Types.ObjectId(websiteId),
        status: 'failed',
      });

      const successRate = totalUrlsExtracted > 0
        ? (totalContentExtracted / totalUrlsExtracted) * 100
        : 0;

      return {
        totalUrlsExtracted,
        totalContentExtracted,
        totalFailed,
        successRate: Math.round(successRate * 10) / 10, // Round to 1 decimal
      };

    } catch (error) {
      this.logger.error(`❌ Failed to fetch statistics for outlet ${websiteId}: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to fetch outlet statistics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 📜 GET /websites/:id/extraction-history
   * Obtener historial de extracciones del outlet desde jobs
   */
  @Get('websites/:id/extraction-history')
  @ApiOperation({ summary: 'Get extraction history from jobs' })
  @ApiResponse({ status: 200, description: 'Extraction history retrieved successfully' })
  async getExtractionHistory(
    @Param('id') websiteId: string,
    @Query('limit') limit?: number
  ): Promise<{
    history: Array<{
      id: string;
      websiteConfigId: string;
      startedAt: Date;
      completedAt: Date | null;
      duration: number;
      totalUrlsFound: number;
      totalContentExtracted: number;
      totalFailed: number;
      status: 'in_progress' | 'completed' | 'failed' | 'partial';
      errorMessage?: string;
    }>;
    total: number;
  }> {
    this.logger.log(`📜 Fetching extraction history for outlet: ${websiteId}`);

    try {
      // Validar que el website existe
      const websiteConfig = await this.websiteConfigModel.findById(websiteId);
      if (!websiteConfig) {
        throw new NotFoundException('Website configuration not found');
      }

      const limitValue = Math.min(limit || 5, 20); // Max 20 items

      // Obtener jobs de tipo 'extract_urls' completados
      const jobs = await this.jobModel
        .find({
          websiteConfigId: new Types.ObjectId(websiteId),
          type: { $in: ['extract_urls', 'extract_content'] },
          status: { $in: ['completed', 'failed'] },
        })
        .sort({ createdAt: -1 })
        .limit(limitValue)
        .lean();

      const total = await this.jobModel.countDocuments({
        websiteConfigId: new Types.ObjectId(websiteId),
        type: { $in: ['extract_urls', 'extract_content'] },
        status: { $in: ['completed', 'failed'] },
      });

      // Agrupar jobs por batchId para obtener estadísticas completas
      const historyMap = new Map<string, {
        id: string;
        startedAt: Date;
        completedAt: Date | null;
        duration: number;
        totalUrlsFound: number;
        totalContentExtracted: number;
        totalFailed: number;
        status: 'in_progress' | 'completed' | 'failed' | 'partial';
        errorMessage?: string;
      }>();

      for (const job of jobs) {
        const batchKey = job.batchId || job._id.toString();

        if (!historyMap.has(batchKey)) {
          // Calcular estadísticas desde extractednoticias para este batch
          const batchStartTime = job.startedAt || job.createdAt;
          const batchEndTime = job.completedAt || null;

          // Buscar noticias extraídas en el periodo del job
          const urlsFromBatch = await this.extractedNoticiaModel.countDocuments({
            websiteConfigId: new Types.ObjectId(websiteId),
            extractedAt: {
              $gte: new Date(batchStartTime.getTime() - 60000), // 1 min antes
              $lte: batchEndTime || new Date(batchStartTime.getTime() + 3600000), // 1h después o completedAt
            },
          });

          const extractedFromBatch = await this.extractedNoticiaModel.countDocuments({
            websiteConfigId: new Types.ObjectId(websiteId),
            extractedAt: {
              $gte: new Date(batchStartTime.getTime() - 60000),
              $lte: batchEndTime || new Date(batchStartTime.getTime() + 3600000),
            },
            status: 'extracted',
          });

          const failedFromBatch = await this.extractedNoticiaModel.countDocuments({
            websiteConfigId: new Types.ObjectId(websiteId),
            extractedAt: {
              $gte: new Date(batchStartTime.getTime() - 60000),
              $lte: batchEndTime || new Date(batchStartTime.getTime() + 3600000),
            },
            status: 'failed',
          });

          const durationSeconds = batchEndTime && batchStartTime
            ? Math.floor((batchEndTime.getTime() - batchStartTime.getTime()) / 1000)
            : 0;

          let status: 'in_progress' | 'completed' | 'failed' | 'partial' = 'completed';
          if (job.status === 'failed') {
            status = 'failed';
          } else if (failedFromBatch > 0 && extractedFromBatch > 0) {
            status = 'partial';
          } else if (!batchEndTime) {
            status = 'in_progress';
          }

          historyMap.set(batchKey, {
            id: job._id.toString(),
            startedAt: batchStartTime,
            completedAt: batchEndTime,
            duration: durationSeconds,
            totalUrlsFound: urlsFromBatch,
            totalContentExtracted: extractedFromBatch,
            totalFailed: failedFromBatch,
            status,
            errorMessage: job.error || undefined,
          });
        }
      }

      const history = Array.from(historyMap.values())
        .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
        .slice(0, limitValue);

      return {
        history: history.map(h => ({
          ...h,
          websiteConfigId: websiteId,
        })),
        total,
      };

    } catch (error) {
      this.logger.error(`❌ Failed to fetch extraction history for outlet ${websiteId}: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to fetch extraction history',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('websites/test-listing-selectors')
  @ApiOperation({ summary: 'Probar selectores de listado - extrae URLs de noticias' })
  @ApiResponse({ status: 200, description: 'Test de selectores de listado completado', type: TestListingResponseDto })
  async testListingSelectors(@Body() testDto: TestListingSelectorsDto): Promise<TestListingResponseDto> {
    this.logger.log(`🧪 Testing listing selectors for: ${testDto.baseUrl}`);

    try {
      const result = await this.websiteService.testListingSelectors(testDto);

      this.eventEmitter.emit('generator-pro.test.listing_completed', {
        baseUrl: testDto.baseUrl,
        urlsFound: result.totalUrls,
        success: result.success,
        timestamp: new Date(),
      });

      return result;

    } catch (error) {
      this.logger.error(`❌ Failed to test listing selectors: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException('Failed to test listing selectors', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('websites/test-individual-content')
  @ApiOperation({ summary: 'Probar selectores de contenido - extrae contenido de una noticia específica' })
  @ApiResponse({ status: 200, description: 'Test de selectores de contenido completado', type: TestContentResponseDto })
  async testIndividualContent(@Body() testDto: TestIndividualContentDto): Promise<TestContentResponseDto> {
    this.logger.log(`🧪 Testing individual content for: ${testDto.testUrl}`);

    try {
      const result = await this.websiteService.testIndividualContent(testDto);

      this.eventEmitter.emit('generator-pro.test.content_completed', {
        testUrl: testDto.testUrl,
        success: result.success,
        contentLength: result.extractedContent.content?.length || 0,
        timestamp: new Date(),
      });

      return result;

    } catch (error) {
      this.logger.error(`❌ Failed to test individual content: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException('Failed to test individual content', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('websites/test-selectors')
  @ApiOperation({ summary: 'Probar selectores CSS (método legacy - deprecated)' })
  @ApiResponse({ status: 200, description: 'Prueba de selectores completada' })
  async testSelectors(@Body() testDto: GeneratorProTestSelectorsDto): Promise<{ testResult: unknown; message: string }> {
    this.logger.log(`🌐 Testing selectors for: ${testDto.baseUrl}`);

    try {
      const testResult = await this.websiteService.testExtraction({
        _id: new Types.ObjectId(),
        name: 'Test Configuration',
        baseUrl: testDto.baseUrl,
        listingUrl: testDto.listingUrl,
        listingSelectors: testDto.listingSelectors || {
          linkSelector: 'a[href]',
          titleSelector: 'h1, h2, h3',
        },
        contentSelectors: testDto.contentSelectors,
        customHeaders: {},
        isActive: true,
        extractionFrequency: 60,
        contentGenerationFrequency: 120,
        publishingFrequency: 30,
        extractionSettings: {
          maxUrlsPerRun: 10,
          duplicateFilter: true,
          useJavaScript: false,
          waitTime: 1000,
          rateLimit: 100,
          timeout: 30000,
          retryAttempts: 3,
          respectRobots: true,
        },
        contentSettings: {
          generateOnExtraction: false,
          requireApproval: true,
          maxContentPerDay: 50,
          categoryMapping: {},
        },
        statistics: {
          totalUrlsExtracted: 0,
          successfulExtractions: 0,
          failedExtractions: 0,
          averageExtractionTime: 0,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return {
        testResult,
        message: 'Selectors tested successfully',
      };

    } catch (error) {
      this.logger.error(`❌ Failed to test selectors: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException('Failed to test selectors', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('websites/:id/test')
  @ApiOperation({ summary: 'Probar selectores de sitio web existente' })
  @ApiResponse({ status: 200, description: 'Prueba de selectores completada' })
  async testWebsiteSelectors(@Param('id') id: string): Promise<{ testResult: unknown; message: string }> {
    this.logger.log(`🌐 Testing selectors for website: ${id}`);

    try {
      const websiteConfig = await this.websiteConfigModel.findById(id);

      if (!websiteConfig) {
        throw new HttpException('Website configuration not found', HttpStatus.NOT_FOUND);
      }

      const testResult = await this.websiteService.testExtraction({ ...websiteConfig.toObject(), _id: websiteConfig._id as Types.ObjectId });

      return {
        testResult,
        message: 'Website selectors tested successfully',
      };

    } catch (error) {
      this.logger.error(`❌ Failed to test website ${id}: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException('Failed to test website selectors', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ===================================
  // 📱 GESTIÓN DE CONFIGURACIONES FACEBOOK
  // ===================================

  @Get('facebook-configs')
  @ApiOperation({ summary: 'Listar configuraciones de Facebook' })
  @ApiResponse({ status: 200, description: 'Lista de configuraciones Facebook', type: [FacebookConfigResponseDto] })
  async getFacebookConfigs(
    @Query('websiteId') websiteId?: string,
    @Query('active') active?: boolean,
    @Query('limit') limit = 50,
    @Query('page') page = 1
  ): Promise<{ configs: FacebookConfigResponseDto[]; total: number; page: number; limit: number }> {
    this.logger.log(`📱 Getting Facebook configs - websiteId: ${websiteId}, active: ${active}`);

    try {
      const filter: Record<string, unknown> = {};

      if (websiteId) {
        filter.websiteConfigId = new Types.ObjectId(websiteId);
      }

      if (active !== undefined) {
        filter.isActive = active;
      }

      const skip = (page - 1) * limit;
      const [configs, total] = await Promise.all([
        this.facebookConfigModel
          .find(filter)
          .populate('websiteConfigId', 'name baseUrl')
          .populate('templateId', 'name type')
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .lean(),
        this.facebookConfigModel.countDocuments(filter),
      ]);

      const responseConfigs: FacebookConfigResponseDto[] = configs.map(config => ({
        id: config._id.toString(),
        siteId: config.siteId.toString(),
        name: config.name,
        facebookPageId: config.facebookPageId,
        facebookPageName: config.facebookPageName,
        templateId: config.templateId.toString(),
        isActive: config.isActive,
        publishingFrequency: config.publishingFrequency,
        maxPostsPerDay: config.maxPostsPerDay,
        postsToday: config.postsToday,
        lastPublishedAt: config.lastPublishedAt,
        connectionStatus: config.connectionStatus,
        statistics: config.statistics,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      }));

      return {
        configs: responseConfigs,
        total,
        page,
        limit,
      };

    } catch (error) {
      this.logger.error(`❌ Failed to get Facebook configs: ${error.message}`);
      throw new HttpException('Failed to fetch Facebook configurations', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('facebook-configs')
  @ApiOperation({ summary: 'Crear configuración de Facebook' })
  @ApiResponse({ status: 201, description: 'Configuración Facebook creada', type: FacebookConfigResponseDto })
  async createFacebookConfig(@Body() createDto: CreateFacebookConfigDto): Promise<{ config: FacebookConfigResponseDto; message: string }> {
    this.logger.log(`📱 Creating Facebook config: ${createDto.name}`);

    try {
      // Validar que existe el sitio destino
      const site = await this.siteModel.findById(createDto.siteId);
      if (!site) {
        throw new HttpException('Site not found', HttpStatus.NOT_FOUND);
      }

      // Crear nueva configuración Facebook
      const facebookConfig = new this.facebookConfigModel({
        ...createDto,
        siteId: new Types.ObjectId(createDto.siteId),
        templateId: new Types.ObjectId(createDto.templateId),
        isActive: createDto.isActive ?? true,
        publishingFrequency: createDto.publishingFrequency ?? 30,
        maxPostsPerDay: createDto.maxPostsPerDay ?? 10,
        postsToday: 0,
        dailyReset: new Date(),
      });

      const savedConfig = await facebookConfig.save();

      // Test de conexión inicial
      const connectionTest = await this.facebookService.validatePageConnection(
        savedConfig.facebookPageId,
        savedConfig.getLateApiKey
      );

      // Actualizar estado de conexión
      savedConfig.connectionStatus = {
        isConnected: connectionTest.isConnected,
        lastChecked: new Date(),
        pageInfo: connectionTest.pageInfo,
        errorMessage: connectionTest.error,
      };

      await savedConfig.save();

      this.eventEmitter.emit('generator-pro.facebook.created', {
        configId: savedConfig._id,
        name: savedConfig.name,
        siteId: savedConfig.siteId,
        timestamp: new Date(),
      });

      const responseDto: FacebookConfigResponseDto = {
        id: (savedConfig._id as Types.ObjectId).toString(),
        siteId: savedConfig.siteId.toString(),
        name: savedConfig.name,
        facebookPageId: savedConfig.facebookPageId,
        facebookPageName: savedConfig.facebookPageName,
        templateId: savedConfig.templateId.toString(),
        isActive: savedConfig.isActive,
        publishingFrequency: savedConfig.publishingFrequency,
        maxPostsPerDay: savedConfig.maxPostsPerDay,
        postsToday: savedConfig.postsToday,
        lastPublishedAt: savedConfig.lastPublishedAt,
        connectionStatus: savedConfig.connectionStatus,
        statistics: savedConfig.statistics,
        createdAt: savedConfig.createdAt,
        updatedAt: savedConfig.updatedAt,
      };

      return {
        config: responseDto,
        message: 'Facebook configuration created successfully',
      };

    } catch (error) {
      this.logger.error(`❌ Failed to create Facebook config: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException('Failed to create Facebook configuration', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ===================================
  // 🔧 CONTROL DEL SISTEMA
  // ===================================

  @Get('status')
  @ApiOperation({ summary: 'Obtener estado general del sistema' })
  @ApiResponse({ status: 200, description: 'Estado del sistema', type: SystemStatusResponseDto })
  async getSystemStatus(): Promise<SystemStatusResponseDto> {
    this.logger.log('🔧 Getting system status');

    try {
      const [systemStatus, queueHealth] = await Promise.all([
        this.orchestratorService.getSystemStatus(),
        this.queueService.getQueueHealth(),
      ]);

      const response: SystemStatusResponseDto = {
        ...systemStatus,
        queueHealth: queueHealth.map(queue => ({
          name: queue.name,
          isHealthy: queue.isHealthy,
          activeJobs: queue.activeJobs,
          waitingJobs: queue.waitingJobs,
          errorRate: queue.errorRate,
        })),
      };

      return response;

    } catch (error) {
      this.logger.error(`❌ Failed to get system status: ${error.message}`);
      throw new HttpException('Failed to get system status', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('system/control')
  @ApiOperation({ summary: 'Controlar el sistema (start/stop/pause/resume)' })
  @ApiResponse({ status: 200, description: 'Acción de control ejecutada' })
  async controlSystem(@Body() controlDto: SystemControlDto): Promise<{ message: string }> {
    this.logger.log(`🔧 System control: ${controlDto.action} - websiteId: ${controlDto.websiteId}`);

    try {
      let result: { message: string };

      switch (controlDto.action) {
        case 'start':
          result = await this.orchestratorService.initializeSystem();
          break;

        case 'stop':
          result = await this.orchestratorService.stopSystem();
          break;

        case 'pause':
          if (!controlDto.websiteId) {
            throw new HttpException('Website ID required for pause action', HttpStatus.BAD_REQUEST);
          }
          result = await this.orchestratorService.pauseWebsite(controlDto.websiteId);
          break;

        case 'resume':
          if (!controlDto.websiteId) {
            throw new HttpException('Website ID required for resume action', HttpStatus.BAD_REQUEST);
          }
          result = await this.orchestratorService.resumeWebsite(controlDto.websiteId);
          break;

        default:
          throw new HttpException('Invalid action', HttpStatus.BAD_REQUEST);
      }

      return result;

    } catch (error) {
      this.logger.error(`❌ System control failed: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException('System control action failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ===================================
  // 📊 TRABAJOS Y ESTADÍSTICAS
  // ===================================

  @Get('jobs')
  @ApiOperation({ summary: 'Listar trabajos con filtros' })
  @ApiResponse({ status: 200, description: 'Lista de trabajos' })
  async getJobs(@Query() filters: JobFiltersDto): Promise<{ jobs: GeneratorProJobDocument[]; total: number }> {
    this.logger.log(`📊 Getting jobs with filters: ${JSON.stringify(filters)}`);

    try {
      // Construir filtro MongoDB
      const mongoFilter: Record<string, unknown> = {};

      if (filters.status) {
        mongoFilter.status = filters.status;
      }

      if (filters.type) {
        mongoFilter.type = filters.type;
      }

      if (filters.websiteConfigId) {
        mongoFilter.websiteConfigId = new Types.ObjectId(filters.websiteConfigId);
      }

      if (filters.facebookConfigId) {
        mongoFilter.facebookConfigId = new Types.ObjectId(filters.facebookConfigId);
      }

      if (filters.dateFrom || filters.dateTo) {
        mongoFilter.createdAt = {};
        if (filters.dateFrom) {
          (mongoFilter.createdAt as any).$gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          (mongoFilter.createdAt as any).$lte = new Date(filters.dateTo);
        }
      }

      // Configurar paginación y ordenamiento
      const limit = Math.min(filters.limit || 50, 100);
      const skip = ((filters.page || 1) - 1) * limit;

      const sortField = filters.sortBy || 'createdAt';
      const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;

      const [jobs, total] = await Promise.all([
        this.jobModel
          .find(mongoFilter)
          .populate('websiteConfigId', 'name baseUrl')
          .populate('facebookConfigId', 'name facebookPageName')
          .sort({ [sortField]: sortOrder })
          .skip(skip)
          .limit(limit),
        this.jobModel.countDocuments(mongoFilter),
      ]);

      return {
        jobs,
        total,
      };

    } catch (error) {
      this.logger.error(`❌ Failed to get jobs: ${error.message}`);
      throw new HttpException('Failed to fetch jobs', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('jobs/stats')
  @ApiOperation({ summary: 'Obtener estadísticas de trabajos' })
  @ApiResponse({ status: 200, description: 'Estadísticas de trabajos', type: JobStatsResponseDto })
  async getJobStats(): Promise<JobStatsResponseDto> {
    this.logger.log('📊 Getting job statistics');

    try {
      const stats = await this.queueService.getJobStats();
      return stats;

    } catch (error) {
      this.logger.error(`❌ Failed to get job stats: ${error.message}`);
      throw new HttpException('Failed to get job statistics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('dashboard-stats')
  @ApiOperation({ summary: 'Obtener estadísticas para el dashboard' })
  @ApiResponse({ status: 200, description: 'Estadísticas del dashboard' })
  async getDashboardStats(): Promise<any> {
    this.logger.log('📊 Getting dashboard statistics');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Obtener estadísticas de sitios web
      const [totalWebsites, activeWebsites] = await Promise.all([
        this.websiteConfigModel.countDocuments(),
        this.websiteConfigModel.countDocuments({ isActive: true })
      ]);

      // Obtener estadísticas de configuraciones Facebook
      const [totalFacebookConfigs, activeFacebookConfigs, postsToday] = await Promise.all([
        this.facebookConfigModel.countDocuments(),
        this.facebookConfigModel.countDocuments({ isActive: true }),
        this.facebookConfigModel.aggregate([
          { $match: { dailyReset: { $gte: today } } },
          { $group: { _id: null, total: { $sum: '$postsToday' } } }
        ]).then(result => result[0]?.total || 0)
      ]);

      // Obtener estadísticas de jobs
      const jobStats = await this.queueService.getJobStats();

      // Construir respuesta según el formato esperado por el frontend
      const dashboardStats = {
        websites: {
          total: totalWebsites,
          active: activeWebsites,
          extractionsToday: 0, // TODO: calcular desde jobs de hoy
          avgProcessingTime: 0 // TODO: calcular promedio
        },
        content: {
          extractedToday: 0, // TODO: calcular desde jobs completados hoy
          generatedToday: 0, // TODO: calcular desde jobs de generación hoy
          readyToPublish: 0 // TODO: calcular contenido listo
        },
        facebook: {
          totalConfigs: totalFacebookConfigs,
          activeConfigs: activeFacebookConfigs,
          publishedToday: postsToday,
          scheduledPosts: 0 // TODO: calcular posts programados
        },
        jobs: {
          processing: jobStats.total.active,
          failed: jobStats.total.failed,
          completed: jobStats.total.completed,
          pending: jobStats.total.waiting
        }
      };

      return dashboardStats;

    } catch (error) {
      this.logger.error(`❌ Failed to get dashboard stats: ${error.message}`);
      throw new HttpException('Failed to get dashboard statistics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('jobs/:id/retry')
  @ApiOperation({ summary: 'Reintentar trabajo fallido' })
  @ApiResponse({ status: 200, description: 'Trabajo reintentado exitosamente' })
  async retryJob(@Param('id') id: string): Promise<{ message: string }> {
    this.logger.log(`📊 Retrying job: ${id}`);

    try {
      const job = await this.jobModel.findById(id);

      if (!job) {
        throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
      }

      if (job.status !== 'failed') {
        throw new HttpException('Job is not in failed state', HttpStatus.BAD_REQUEST);
      }

      // Crear nuevo job basado en el fallido
      const newJobData = {
        type: job.type as any,
        websiteConfigId: job.websiteConfigId.toString(),
        facebookConfigId: job.facebookConfigId,
        relatedEntityId: job.relatedEntityId,
        data: {
          ...job.data,
          isRetry: true,
          originalJobId: (job._id as Types.ObjectId).toString(),
        },
        priority: Math.min(job.priority + 1, 10),
      };

      let newJob: GeneratorProJobDocument | null = null;

      if (['extract_urls', 'extract_content'].includes(job.type)) {
        newJob = await this.queueService.addExtractionJob(newJobData);
      } else if (job.type === 'generate_content') {
        newJob = await this.queueService.addGenerationJob(newJobData);
      } else if (['publish_facebook', 'sync_engagement'].includes(job.type)) {
        newJob = await this.queueService.addPublishingJob(newJobData);
      }

      if (!newJob) {
        throw new HttpException('Failed to create retry job', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      // Marcar job original como reintentado
      await this.jobModel.findByIdAndUpdate(id, {
        status: 'retrying',
        retryCount: job.retryCount + 1,
        nextRetryAt: new Date(),
      });

      return {
        message: 'Job retry initiated successfully',
      };

    } catch (error) {
      this.logger.error(`❌ Failed to retry job ${id}: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException('Failed to retry job', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ===================================
  // 📘 GESTIÓN DE FACEBOOK PAGES
  // ===================================

  @Get('facebook-pages')
  @ApiOperation({
    summary: 'Obtener páginas de Facebook disponibles desde GetLate.dev',
    description: 'Lista todas las páginas de Facebook conectadas a la cuenta de GetLate.dev'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de páginas de Facebook obtenida exitosamente',
    type: FacebookPagesResponseDto
  })
  @ApiResponse({
    status: 500,
    description: 'Error al obtener páginas de Facebook'
  })
  async getFacebookPages(): Promise<FacebookPagesResponseDto> {
    this.logger.log('📘 Getting Facebook pages from GetLate.dev');

    try {
      const result = await this.facebookPagesService.getFacebookPages();

      this.logger.log(`✅ Retrieved ${result.total} Facebook pages successfully`);

      return result;

    } catch (error) {
      this.logger.error(`❌ Failed to get Facebook pages: ${error.message}`);

      throw new HttpException('Failed to retrieve Facebook pages', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('facebook-pages/:pageId')
  @ApiOperation({
    summary: 'Obtener detalles de una página de Facebook específica',
    description: 'Obtiene información detallada de una página de Facebook específica'
  })
  @ApiResponse({
    status: 200,
    description: 'Detalles de la página obtenidos exitosamente'
  })
  @ApiResponse({
    status: 404,
    description: 'Página de Facebook no encontrada'
  })
  async getFacebookPageDetails(
    @Param('pageId') pageId: string
  ): Promise<{ page: any; message: string }> {
    this.logger.log(`📘 Getting details for Facebook page: ${pageId}`);

    try {
      const pageDetails = await this.facebookPagesService.getPageDetails(pageId);

      if (!pageDetails) {
        throw new HttpException('Facebook page not found', HttpStatus.NOT_FOUND);
      }

      return {
        page: pageDetails,
        message: 'Page details retrieved successfully',
      };

    } catch (error) {
      this.logger.error(`❌ Failed to get page details for ${pageId}: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException('Failed to retrieve page details', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('facebook-pages/:pageId/validate')
  @ApiOperation({
    summary: 'Validar conexión con página de Facebook',
    description: 'Valida que la página de Facebook esté correctamente conectada y accesible'
  })
  @ApiResponse({
    status: 200,
    description: 'Validación completada exitosamente'
  })
  async validateFacebookPage(
    @Param('pageId') pageId: string
  ): Promise<{ isValid: boolean; pageName?: string; error?: string; message: string }> {
    this.logger.log(`📘 Validating Facebook page connection: ${pageId}`);

    try {
      const validationResult = await this.facebookPagesService.validatePageConnection(pageId);

      return {
        ...validationResult,
        message: validationResult.isValid
          ? 'Page connection validated successfully'
          : 'Page connection validation failed',
      };

    } catch (error) {
      this.logger.error(`❌ Failed to validate page ${pageId}: ${error.message}`);

      return {
        isValid: false,
        error: error.message,
        message: 'Validation failed due to error',
      };
    }
  }

  /**
   * 🔄 MANUAL WORKFLOW ENDPOINTS
   */

  @Post('websites/:id/extract-urls')
  @ApiOperation({ summary: 'Ejecutar extracción manual de URLs de noticias' })
  @ApiResponse({ status: 200, description: 'URLs extraídas exitosamente' })
  async extractUrlsManually(@Param('id') websiteId: string) {
    this.logger.log(`🔄 Manual URL extraction for website: ${websiteId}`);

    try {
      // Buscar la configuración del sitio web
      const websiteConfig = await this.websiteConfigModel.findById(websiteId).exec();
      if (!websiteConfig) {
        throw new HttpException('Website configuration not found', HttpStatus.NOT_FOUND);
      }

      // Ejecutar extracción de URLs
      const extractedUrls = await this.websiteService.extractNewsUrls(websiteConfig._id as Types.ObjectId);

      this.logger.log(`✅ Extracted ${extractedUrls.length} URLs from ${websiteConfig.name}`);

      return {
        websiteId,
        websiteName: websiteConfig.name,
        extractedUrls,
        totalUrls: extractedUrls.length,
        extractedAt: new Date(),
        message: 'URLs extracted successfully'
      };

    } catch (error) {
      this.logger.error(`❌ Failed to extract URLs for ${websiteId}: ${error.message}`);
      throw new HttpException(
        `Failed to extract URLs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }


  @Post('websites/:id/extract-content')
  @ApiOperation({ summary: 'Ejecutar extracción manual de contenido de URLs específicas' })
  @ApiResponse({ status: 200, description: 'Contenido extraído exitosamente' })
  async extractContentManually(
    @Param('id') websiteId: string,
    @Body() body: { urls: string[] }
  ) {
    this.logger.log(`🔄 Manual content extraction for ${body.urls.length} URLs from website: ${websiteId}`);

    try {
      // Buscar la configuración del sitio web
      const websiteConfig = await this.websiteConfigModel.findById(websiteId).exec();
      if (!websiteConfig) {
        throw new HttpException('Website configuration not found', HttpStatus.NOT_FOUND);
      }

      const extractedContent: Array<{
        url: string;
        success: boolean;
        content?: any;
        error?: string;
      }> = [];

      // Extraer contenido de cada URL
      for (const url of body.urls) {
        try {
          const content = await this.websiteService.extractNewsContent(url, websiteConfig._id as Types.ObjectId);
          extractedContent.push({
            url,
            success: true,
            content
          });
        } catch (error) {
          extractedContent.push({
            url,
            success: false,
            error: error.message
          });
        }
      }

      const successfulExtractions = extractedContent.filter(item => item.success);

      this.logger.log(`✅ Extracted content from ${successfulExtractions.length}/${body.urls.length} URLs`);

      return {
        websiteId,
        websiteName: websiteConfig.name,
        extractedContent,
        totalUrls: body.urls.length,
        successfulExtractions: successfulExtractions.length,
        extractedAt: new Date(),
        message: `Content extracted from ${successfulExtractions.length}/${body.urls.length} URLs`
      };

    } catch (error) {
      this.logger.error(`❌ Failed to extract content for ${websiteId}: ${error.message}`);
      throw new HttpException(
        `Failed to extract content: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('content/generate-from-extracted')
  @ApiOperation({ summary: 'Generar contenido editorial desde contenido extraído usando agente/template específico' })
  @ApiResponse({ status: 200, description: 'Contenido editorial generado exitosamente' })
  async generateContentFromExtracted(@Body() body: {
    extractedContent: {
      title: string;
      content: string;
      url: string;
      author?: string;
      category?: string;
    };
    templateId: string;
    providerId?: string;
    customPromptVars?: Record<string, string>;
  }) {
    this.logger.log(`🎨 Manual content generation using template: ${body.templateId}`);

    try {
      // TODO: Implementar integración con ContentGenerationService
      // Temporal mock response hasta resolver dependencia circular
      const mockGeneratedContent = {
        id: `mock_${Date.now()}`,
        generatedText: `Contenido editorial generado basado en: "${body.extractedContent.title}"`,
        title: `Editorial: ${body.extractedContent.title}`,
        summary: 'Resumen generado automáticamente',
        keywords: ['noticia', 'editorial'],
        generatedAt: new Date()
      };

      this.logger.log(`✅ Mock content generated for template ${body.templateId}`);

      return {
        originalContent: body.extractedContent,
        generatedContent: mockGeneratedContent,
        templateId: body.templateId,
        providerId: body.providerId,
        generatedAt: new Date(),
        message: 'Mock content generated successfully - ContentGenerationService integration pending'
      };

    } catch (error) {
      this.logger.error(`❌ Failed to generate content: ${error.message}`);
      throw new HttpException(
        `Failed to generate content: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('templates')
  @ApiOperation({ summary: 'Obtener lista de templates/agentes disponibles para generación' })
  @ApiResponse({ status: 200, description: 'Lista de templates disponibles' })
  async getAvailableTemplates() {
    this.logger.log(`📋 Getting available templates`);

    try {
      // Aquí necesitaríamos acceder al PromptTemplateService
      // Por ahora retornamos una respuesta básica que luego expandiremos
      return {
        templates: [],
        message: 'Templates service integration pending - use existing Content-AI endpoint'
      };

    } catch (error) {
      this.logger.error(`❌ Failed to get templates: ${error.message}`);
      throw new HttpException(
        `Failed to get templates: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 🔗 URLs TAB ENDPOINTS - Para 6-tab workflow

  /**
   * 🔗 Extract URLs and save them to database
   * Endpoint para Tab URLs - Extraer y guardar URLs en BD
   */
  @Post('websites/:id/extract-urls-and-save')
  @HttpCode(HttpStatus.OK)
  async extractUrlsAndSave(
    @Param('id') websiteId: string
  ): Promise<{ extractedUrls: ExtractedNoticiaResponseDto[]; totalUrls: number }> {
    try {
      console.log(`🔗 Extracting and saving URLs for website: ${websiteId}`);

      // Validate website exists
      const websiteConfig = await this.websiteService.findById(websiteId);
      if (!websiteConfig) {
        throw new HttpException('Website configuration not found', HttpStatus.NOT_FOUND);
      }

      // Extract URLs using existing logic
      const extractedUrls = await this.websiteService.extractUrlsManually(websiteId);
      console.log(`🔗 Extracted ${extractedUrls.length} URLs from ${websiteConfig.name}`);

      // Save each URL to database
      const savedUrls: ExtractedNoticiaResponseDto[] = [];
      for (const url of extractedUrls) {
        try {
          // Check if URL already exists
          const existingNoticia = await this.websiteService.findByUrl(url);
          if (existingNoticia) {
            console.log(`⚠️ URL already exists in database: ${url}`);
            savedUrls.push({
              id: (existingNoticia._id as Types.ObjectId).toString(),
              url: existingNoticia.sourceUrl,
              title: existingNoticia.title,
              extractionStatus: existingNoticia.status,
              websiteConfigId: (existingNoticia.websiteConfigId as Types.ObjectId).toString(),
              createdAt: existingNoticia.createdAt,
              extractedAt: existingNoticia.extractedAt
            });
            continue;
          }

          // Save new URL to database
          const savedNoticia = await this.websiteService.saveExtractedUrl({
            sourceUrl: url,
            websiteConfigId: new Types.ObjectId(websiteId),
            status: 'pending',
            title: undefined, // Will be extracted later
            content: undefined,
            author: undefined,
            publishedAt: undefined,
            category: undefined,
            extractedAt: new Date()
          });

          savedUrls.push({
            id: (savedNoticia._id as Types.ObjectId).toString(),
            url: savedNoticia.sourceUrl,
            title: savedNoticia.title || 'Título pendiente',
            extractionStatus: savedNoticia.status,
            websiteConfigId: (savedNoticia.websiteConfigId as Types.ObjectId).toString(),
            createdAt: savedNoticia.createdAt,
            extractedAt: savedNoticia.extractedAt
          });

        } catch (error) {
          console.error(`❌ Error saving URL ${url}:`, error.message);
          // Continue with other URLs even if one fails
        }
      }

      // Update website last extraction run
      await this.websiteService.updateLastExtractionRun(websiteId);

      // Emit event
      this.eventEmitter.emit('generator-pro.urls.extracted', {
        websiteId,
        totalUrls: savedUrls.length,
        timestamp: new Date(),
      });

      console.log(`✅ Successfully saved ${savedUrls.length} URLs to database`);

      return {
        extractedUrls: savedUrls,
        totalUrls: savedUrls.length
      };

    } catch (error) {
      console.error(`❌ Error extracting and saving URLs for website ${websiteId}:`, error);
      throw new HttpException(
        error.message || 'Failed to extract and save URLs',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 🚀 Extract ALL: URLs + Content (Full Extraction)
   * Endpoint completo que extrae URLs y luego todo el contenido
   * Con notificaciones en tiempo real vía WebSocket
   */
  @Post('websites/:id/extract-all')
  @HttpCode(HttpStatus.OK)
  async extractAll(
    @Param('id') websiteId: string,
    @CurrentUser() user: { userId: string }
  ): Promise<{
    totalUrls: number;
    totalContentExtracted: number;
    duration: number;
    message: string
  }> {
    const startTime = Date.now();
    let urlsFound = 0;
    let contentExtracted = 0;
    const userId = user.userId;
    let job: any = null; // Job para registrar en historial

    try {
      this.logger.log(`🚀 Starting full extraction for website: ${websiteId}`);

      // Validate website exists
      const websiteConfig = await this.websiteService.findById(websiteId);
      if (!websiteConfig) {
        throw new HttpException('Website configuration not found', HttpStatus.NOT_FOUND);
      }

      // 🔥 CREAR JOB PARA REGISTRAR EN HISTORIAL
      job = await this.jobModel.create({
        type: 'extract_content',
        websiteConfigId: new Types.ObjectId(websiteId),
        status: 'processing',
        priority: 5,
        data: {
          metadata: {
            userId,
            triggeredBy: 'manual',
          },
        },
        startedAt: new Date(),
      });
      this.logger.log(`📝 Job created: ${job._id}`);

      await job.markAsStarted();

      // ============================================
      // NOTIFICACIÓN: Extracción iniciada
      // ============================================
      await this.socketGateway.sendToUser(userId, 'outlet:extraction-started', {
        outletId: websiteId,
        outletName: websiteConfig.name,
        timestamp: new Date().toISOString(),
      });

      // ============================================
      // PASO 1: Extraer URLs
      // ============================================
      this.logger.log(`📝 Step 1: Extracting URLs from ${websiteConfig.name}...`);

      const extractedUrls = await this.websiteService.extractUrlsManually(websiteId);
      urlsFound = extractedUrls.length;

      this.logger.log(`✅ Found ${urlsFound} URLs`);

      // Emitir progreso: URLs encontradas
      await this.socketGateway.sendToUser(userId, 'outlet:extraction-progress', {
        outletId: websiteId,
        step: 'urls_found',
        urlsFound,
        totalUrls: urlsFound,
        percentage: 10,
        timestamp: new Date().toISOString(),
      });

      // Guardar URLs en BD
      const savedUrls: string[] = [];
      for (const url of extractedUrls) {
        try {
          const existingNoticia = await this.websiteService.findByUrl(url);
          if (existingNoticia) {
            savedUrls.push(url);
            continue;
          }

          await this.websiteService.saveExtractedUrl({
            sourceUrl: url,
            websiteConfigId: new Types.ObjectId(websiteId),
            status: 'pending',
            title: undefined,
            content: undefined,
            author: undefined,
            publishedAt: undefined,
            category: undefined,
            extractedAt: new Date(),
          });

          savedUrls.push(url);
        } catch (error) {
          this.logger.error(`❌ Error saving URL ${url}: ${error.message}`);
        }
      }

      // ============================================
      // PASO 2: Extraer contenido de cada URL
      // ============================================
      this.logger.log(`📄 Step 2: Extracting content from ${savedUrls.length} URLs...`);

      for (let i = 0; i < savedUrls.length; i++) {
        const url = savedUrls[i];
        const currentIndex = i + 1;

        try {
          // Emitir progreso: extrayendo URL actual
          await this.socketGateway.sendToUser(userId, 'outlet:extraction-progress', {
            outletId: websiteId,
            step: 'extracting_content',
            currentUrl: url,
            currentIndex,
            totalUrls: savedUrls.length,
            contentExtracted,
            percentage: Math.round(10 + (currentIndex / savedUrls.length) * 85),
            timestamp: new Date().toISOString(),
          });

          // Buscar noticia en BD
          const noticia = await this.websiteService.findByUrl(url);
          if (!noticia) {
            this.logger.warn(`⚠️ URL not found in DB: ${url}`);
            continue;
          }

          // Skip si ya tiene contenido
          if (noticia.status === 'extracted' && noticia.content && noticia.content.length > 0) {
            this.logger.log(`✅ Content already exists for: ${url}`);
            contentExtracted++;

            // Emitir progreso: contenido ya extraído
            await this.socketGateway.sendToUser(userId, 'outlet:extraction-progress', {
              outletId: websiteId,
              step: 'content_extracted',
              currentTitle: noticia.title || 'Sin título',
              currentUrl: url,
              currentIndex,
              totalUrls: savedUrls.length,
              contentExtracted,
              percentage: Math.round(10 + (currentIndex / savedUrls.length) * 85),
              timestamp: new Date().toISOString(),
            });

            continue;
          }

          // Extraer contenido
          const content = await this.websiteService.extractNewsContent(
            url,
            websiteConfig._id as Types.ObjectId
          );

          if (content && content.title) {
            // 🔥 GUARDAR CONTENIDO EN BD - Actualizar noticia de 'pending' a 'extracted'
            await this.extractedNoticiaModel.findByIdAndUpdate(
              noticia._id,
              {
                title: content.title,
                content: content.content,
                author: content.author,
                publishedAt: content.publishedAt,
                category: content.category,
                images: content.images,
                tags: content.tags,
                status: 'extracted', // 🎯 Cambiar de 'pending' a 'extracted'
                isProcessed: false,
                extractedAt: new Date()
              },
              { new: true }
            );

            contentExtracted++;

            // Emitir progreso: contenido extraído exitosamente
            await this.socketGateway.sendToUser(userId, 'outlet:extraction-progress', {
              outletId: websiteId,
              step: 'content_extracted',
              currentTitle: content.title,
              currentUrl: url,
              currentIndex,
              totalUrls: savedUrls.length,
              contentExtracted,
              percentage: Math.round(10 + (currentIndex / savedUrls.length) * 85),
              timestamp: new Date().toISOString(),
            });

            this.logger.log(`✅ Extracted content from: ${content.title}`);
          }
        } catch (error) {
          this.logger.error(`❌ Error extracting content from ${url}: ${error.message}`);

          // 🔥 MARCAR COMO FAILED EN BD
          const noticia = await this.websiteService.findByUrl(url);
          if (noticia) {
            await this.extractedNoticiaModel.findByIdAndUpdate(
              noticia._id,
              {
                status: 'failed',
                extractedAt: new Date()
              }
            );
          }

          // Emitir progreso con error (pero continuar)
          await this.socketGateway.sendToUser(userId, 'outlet:extraction-progress', {
            outletId: websiteId,
            step: 'content_error',
            currentUrl: url,
            error: error.message,
            currentIndex,
            totalUrls: savedUrls.length,
            contentExtracted,
            percentage: Math.round(10 + (currentIndex / savedUrls.length) * 85),
            timestamp: new Date().toISOString(),
          });
        }
      }

      // ============================================
      // PASO 3: Actualizar estadísticas
      // ============================================
      await this.websiteService.updateLastExtractionRun(websiteId);

      const duration = Math.round((Date.now() - startTime) / 1000);

      // 🔥 MARCAR JOB COMO COMPLETADO
      if (job) {
        await job.markAsCompleted({
          urlsCount: urlsFound,
          contentExtractedCount: contentExtracted,
          processingStats: {
            duration: duration * 1000, // en ms
            startTime: new Date(startTime),
            endTime: new Date(),
          },
        });
        this.logger.log(`✅ Job marked as completed: ${job._id}`);
      }

      // Emit event
      this.eventEmitter.emit('generator-pro.extraction.completed', {
        websiteId,
        totalUrls: urlsFound,
        totalContentExtracted: contentExtracted,
        duration,
        timestamp: new Date(),
      });

      // ============================================
      // NOTIFICACIÓN: Extracción completada
      // ============================================
      await this.socketGateway.sendToUser(userId, 'outlet:extraction-completed', {
        outletId: websiteId,
        outletName: websiteConfig.name,
        totalUrls: urlsFound,
        totalContent: contentExtracted,
        duration,
        percentage: 100,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(
        `✅ Full extraction completed - URLs: ${urlsFound}, Content: ${contentExtracted}, Duration: ${duration}s`
      );

      return {
        totalUrls: urlsFound,
        totalContentExtracted: contentExtracted,
        duration,
        message: `Extraction completed successfully: ${contentExtracted}/${urlsFound} contents extracted in ${duration}s`,
      };
    } catch (error) {
      this.logger.error(`❌ Full extraction failed for ${websiteId}: ${error.message}`);

      // 🔥 MARCAR JOB COMO FALLIDO
      if (job) {
        await job.markAsFailed(error.message, {
          urlsFound,
          contentExtracted,
          errorStack: error.stack,
        });
        this.logger.log(`❌ Job marked as failed: ${job._id}`);
      }

      // ============================================
      // NOTIFICACIÓN: Extracción fallida
      // ============================================
      await this.socketGateway.sendToUser(userId, 'outlet:extraction-failed', {
        outletId: websiteId,
        error: error.message,
        urlsFound,
        contentExtracted,
        timestamp: new Date().toISOString(),
      });

      throw new HttpException(
        error.message || 'Failed to complete full extraction',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 📋 List extracted URLs with filters
   * Endpoint para Tab URLs - Listar URLs extraídas
   */
  @Get('urls')
  @HttpCode(HttpStatus.OK)
  async listExtractedUrls(
    @Query('websiteId') websiteId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number
  ): Promise<{
    urls: ExtractedNoticiaResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      console.log(`📋 Listing extracted URLs with filters: websiteId=${websiteId}, status=${status}`);

      const filters: any = {};
      if (websiteId) filters.websiteConfigId = new Types.ObjectId(websiteId);
      if (status) filters.extractionStatus = status;

      const pageSize = Math.min(limit || 50, 100);
      const currentPage = Math.max(page || 1, 1);
      const skip = (currentPage - 1) * pageSize;

      // Get total count
      const total = await this.websiteService.countExtractedUrls(filters);

      // Get URLs with pagination
      const urls = await this.websiteService.findExtractedUrls(filters, {
        limit: pageSize,
        skip,
        sort: { createdAt: -1 } // Most recent first
      });

      const responseUrls: ExtractedNoticiaResponseDto[] = urls.map(noticia => ({
        id: (noticia._id as Types.ObjectId).toString(),
        url: noticia.sourceUrl,
        title: noticia.title || 'Título pendiente',
        extractionStatus: noticia.status,
        websiteConfigId: (noticia.websiteConfigId as Types.ObjectId).toString(),
        createdAt: noticia.createdAt,
        extractedAt: noticia.extractedAt
      }));

      const totalPages = Math.ceil(total / pageSize);

      console.log(`✅ Found ${total} URLs, returning page ${currentPage}/${totalPages}`);

      return {
        urls: responseUrls,
        total,
        page: currentPage,
        totalPages
      };

    } catch (error) {
      console.error(`❌ Error listing extracted URLs:`, error);
      throw new HttpException(
        'Failed to list extracted URLs',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 📄 CONTENIDO TAB ENDPOINTS - Para extraer contenido de URLs

  /**
   * 📄 Extract content from URLs and save to database
   * Endpoint para Tab Contenido - Extraer contenido de URLs específicas
   */
  @Post('urls/extract-content')
  @HttpCode(HttpStatus.OK)
  async extractContentFromUrls(
    @Body() body: { urls: string[]; websiteId: string }
  ): Promise<{ extractedContent: ExtractedContentResponseDto[]; totalProcessed: number }> {
    try {
      console.log(`📄 Extracting content from ${body.urls.length} URLs for website: ${body.websiteId}`);

      // Validate website exists
      const websiteConfig = await this.websiteService.findById(body.websiteId);
      if (!websiteConfig) {
        throw new HttpException('Website configuration not found', HttpStatus.NOT_FOUND);
      }

      const extractedContent: ExtractedContentResponseDto[] = [];

      for (const url of body.urls) {
        try {
          // Find existing URL record in database
          const existingNoticia = await this.websiteService.findByUrl(url);
          if (!existingNoticia) {
            console.log(`⚠️ URL not found in database: ${url}`);
            continue;
          }

          // Skip if content already extracted
          if (existingNoticia.status === 'extracted' && existingNoticia.content && existingNoticia.content.length > 0) {
            console.log(`✅ Content already exists for URL: ${url}`);
            extractedContent.push({
              id: (existingNoticia._id as Types.ObjectId).toString(),
              url: existingNoticia.sourceUrl,
              title: existingNoticia.title || 'Sin título',
              content: existingNoticia.content || '',
              author: existingNoticia.author,
              category: existingNoticia.category,
              imageUrl: existingNoticia.images?.[0],
              publishedDate: existingNoticia.publishedAt,
              extractionStatus: existingNoticia.status,
              websiteConfigId: (existingNoticia.websiteConfigId as Types.ObjectId).toString(),
              extractedAt: existingNoticia.extractedAt,
              createdAt: existingNoticia.createdAt
            });
            continue;
          }

          // Extract content from URL
          const contentData = await this.websiteService.extractNewsContent(
            url,
            websiteConfig._id as Types.ObjectId
          );

          // Update database record with extracted content
          const updatedNoticia = await this.extractedNoticiaModel.findByIdAndUpdate(
            existingNoticia._id,
            {
              title: contentData.title || existingNoticia.title,
              content: contentData.content || '',
              author: contentData.author || existingNoticia.author,
              category: contentData.category || existingNoticia.category,
              images: contentData.images && contentData.images.length > 0 ? contentData.images : existingNoticia.images,
              publishedAt: contentData.publishedAt || existingNoticia.publishedAt,
              status: 'extracted',
              extractedAt: new Date(),
              rawData: {
                ...existingNoticia.rawData,
                contentExtractionMethod: 'manual',
                extractedFields: Object.keys(contentData)
              }
            },
            { new: true }
          ).exec();

          if (updatedNoticia) {
            extractedContent.push({
              id: (updatedNoticia._id as Types.ObjectId).toString(),
              url: updatedNoticia.sourceUrl,
              title: updatedNoticia.title || 'Sin título',
              content: updatedNoticia.content || '',
              author: updatedNoticia.author,
              category: updatedNoticia.category,
              imageUrl: updatedNoticia.images?.[0],
              publishedDate: updatedNoticia.publishedAt,
              extractionStatus: updatedNoticia.status,
              websiteConfigId: (updatedNoticia.websiteConfigId as Types.ObjectId).toString(),
              extractedAt: updatedNoticia.extractedAt,
              createdAt: updatedNoticia.createdAt
            });
          }

        } catch (error) {
          console.error(`❌ Error extracting content from ${url}:`, error.message);
          // Continue with other URLs even if one fails
        }
      }

      // Emit event
      this.eventEmitter.emit('generator-pro.content.extracted', {
        websiteId: body.websiteId,
        totalProcessed: extractedContent.length,
        timestamp: new Date(),
      });

      console.log(`✅ Successfully extracted content from ${extractedContent.length}/${body.urls.length} URLs`);

      return {
        extractedContent,
        totalProcessed: extractedContent.length
      };

    } catch (error) {
      console.error(`❌ Error extracting content:`, error);
      throw new HttpException(
        error.message || 'Failed to extract content',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 📋 List extracted content with filters
   * Endpoint para Tab Contenido - Listar contenido extraído
   */
  @Get('content')
  @HttpCode(HttpStatus.OK)
  async listExtractedContent(
    @Query('websiteId') websiteId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number
  ): Promise<{
    content: ExtractedContentResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      console.log(`📋 Listing extracted content with filters: websiteId=${websiteId}, status=${status}`);

      // Valid statuses for ExtractedNoticia: 'pending', 'extracted', 'failed', 'processing'
      const validStatuses = ['pending', 'extracted', 'failed', 'processing'];
      const filters: any = { status: 'extracted' }; // Default: only extracted content
      if (websiteId) filters.websiteConfigId = new Types.ObjectId(websiteId);
      if (status && validStatuses.includes(status)) {
        filters.status = status;
      }

      const pageSize = Math.min(limit || 50, 100);
      const currentPage = Math.max(page || 1, 1);
      const skip = (currentPage - 1) * pageSize;

      // Get total count
      const total = await this.websiteService.countExtractedUrls(filters);

      // Get content with pagination and populate website config
      const content = await this.extractedNoticiaModel
        .find(filters)
        .populate('websiteConfigId', 'name baseUrl')
        .limit(pageSize)
        .skip(skip)
        .sort({ extractedAt: -1 })
        .exec();

      const responseContent: ExtractedContentResponseDto[] = content
        .filter(noticia => noticia.content && noticia.content.length > 0) // Only items with content
        .map(noticia => {
          const websiteConfig = noticia.websiteConfigId as any;
          return {
            id: (noticia._id as Types.ObjectId).toString(),
            url: noticia.sourceUrl,
            title: noticia.title || 'Sin título',
            content: noticia.content || '',
            author: noticia.author,
            category: noticia.category,
            imageUrl: noticia.images?.[0],
            publishedDate: noticia.publishedAt,
            extractionStatus: noticia.status,
            websiteConfigId: websiteConfig?._id ? (websiteConfig._id as Types.ObjectId).toString() : '',
            websiteName: websiteConfig?.name || 'N/A',
            extractedAt: noticia.extractedAt,
            createdAt: noticia.createdAt
          };
        });

      const totalPages = Math.ceil(total / pageSize);

      console.log(`✅ Found ${total} content items, returning page ${currentPage}/${totalPages}`);

      return {
        content: responseContent,
        total,
        page: currentPage,
        totalPages
      };

    } catch (error) {
      console.error(`❌ Error listing extracted content:`, error);
      throw new HttpException(
        'Failed to list extracted content',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 🤖 CONTENT AGENTS ENDPOINTS - Para selección de agentes

  /**
   * 🤖 List available content agents
   * Endpoint para Tab Contenido - Listar agentes disponibles para generación
   */
  @Get('content-agents')
  @HttpCode(HttpStatus.OK)
  async listContentAgents(): Promise<{
    agents: Array<{
      id: string;
      name: string;
      type: string;
      category: string;
      description?: string;
      isActive: boolean;
      compatibleProviders: string[];
      createdAt: Date;
    }>;
    total: number;
  }> {
    try {
      console.log(`🤖 Listing available content agents`);

      // TODO: Implementar cuando esté disponible ContentAI module
      // Por ahora devolver agentes mock para testing
      const mockAgents = [
        {
          id: 'agent-news-summarizer',
          name: 'News Summarizer',
          type: 'summarization',
          category: 'news',
          description: 'Genera resúmenes concisos de noticias',
          isActive: true,
          compatibleProviders: ['openai', 'anthropic'],
          createdAt: new Date('2024-01-01')
        },
        {
          id: 'agent-facebook-optimizer',
          name: 'Facebook Post Optimizer',
          type: 'social-media',
          category: 'facebook',
          description: 'Optimiza contenido para Facebook con emojis y hashtags',
          isActive: true,
          compatibleProviders: ['openai'],
          createdAt: new Date('2024-01-01')
        },
        {
          id: 'agent-news-rewriter',
          name: 'News Rewriter',
          type: 'rewriting',
          category: 'news',
          description: 'Reescribe noticias manteniendo el mensaje original',
          isActive: true,
          compatibleProviders: ['openai', 'anthropic', 'gemini'],
          createdAt: new Date('2024-01-01')
        },
        {
          id: 'agent-seo-optimizer',
          name: 'SEO Content Optimizer',
          type: 'seo',
          category: 'marketing',
          description: 'Optimiza contenido para SEO y engagement',
          isActive: true,
          compatibleProviders: ['openai'],
          createdAt: new Date('2024-01-01')
        }
      ];

      console.log(`✅ Found ${mockAgents.length} available content agents`);

      return {
        agents: mockAgents,
        total: mockAgents.length
      };

    } catch (error) {
      console.error(`❌ Error listing content agents:`, error);
      throw new HttpException(
        'Failed to list content agents',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 🎯 GENERADOS TAB ENDPOINTS - Para generación de contenido con IA

  /**
   * 🎯 Generate content with AI from extracted content + Social Media Copys
   * Endpoint para Tab Generados - Generar contenido con IA + copys optimizados FB/Twitter
   */
  @Post('content/generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generar contenido con agente editorial + copys sociales' })
  @ApiResponse({ status: 200, description: 'Contenido generado exitosamente con copys sociales' })
  async generateContent(
    @Body() body: {
      extractedContentId: string;
      agentId: string;
      templateId?: string;
      providerId?: string;
      referenceContent?: string;
    },
    @CurrentUser('userId') userId: string,
  ): Promise<{ generatedContent: GeneratedContentResponseDto }> {
    this.logger.log(`🎯 Generating content for ID: ${body.extractedContentId} with agent: ${body.agentId} (userId: ${userId})`);

    const startTime = Date.now();

    try {
      // 1. Obtener ExtractedNoticia
      const extractedContent = await this.extractedNoticiaModel.findById(body.extractedContentId).exec();
      if (!extractedContent) {
        throw new NotFoundException('Extracted content not found');
      }

      // 2. Validar que agentId existe
      const agent = await this.contentAgentModel.findById(body.agentId).exec();
      if (!agent) {
        throw new NotFoundException('Content Agent not found');
      }

      // 🔌 SOCKET EVENT: Generación iniciada
      await this.socketGateway.sendToUser(userId, 'content:generation-started', {
        extractedContentId: body.extractedContentId,
        agentId: body.agentId,
        agentName: agent.name,
      });

      // 3. Usar GeneratorProPromptBuilder para construir prompts
      const promptData = await this.promptBuilderService.buildPrompt({
        extractedNoticia: extractedContent,
        agentId: body.agentId,
        referenceContent: body.referenceContent,
      });

      this.logger.log(`✅ Prompts built successfully for agent: ${agent.name}`);

      // 4. Obtener proveedor de IA (OpenAI o Anthropic)
      const provider = this.providerFactory.getProvider('openai');

      // Variables para almacenar respuesta de IA
      let mockAIResponse: any;
      let realMetadata: any;

      try {
        // 5. Generar contenido con IA usando prompts del GeneratorProPromptBuilder
        const startTime = Date.now();

        // 🚨 LOG ANTES DE ENVIAR AL AI
        this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.logger.error('🚨🚨🚨 ENVIANDO AL AI 🚨🚨🚨');
        this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.logger.error(`SYSTEM PROMPT (primeros 500 chars):`);
        this.logger.error(promptData.systemPrompt.substring(0, 500));
        this.logger.error(`\nUSER PROMPT (primeros 500 chars):`);
        this.logger.error(promptData.userPrompt.substring(0, 500));
        this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const aiResponse = await provider.generateContent({
          systemPrompt: promptData.systemPrompt,
          userPrompt: promptData.userPrompt,
          maxTokens: 4000,
          temperature: agent.writingStyle.tone === 'formal' ? 0.7 : 0.85,
          frequencyPenalty: 0.3,
          presencePenalty: 0.3,
        });

        const processingTime = Date.now() - startTime;

        // 🚨 LOG DESPUÉS DE RECIBIR RESPUESTA DEL AI
        this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.logger.error('🤖🤖🤖 RESPUESTA DEL AI RECIBIDA 🤖🤖🤖');
        this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.logger.error(`Respuesta (primeros 500 chars):`);
        this.logger.error(aiResponse.content.substring(0, 500));
        this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        this.logger.log(`✅ AI generation completed in ${processingTime}ms`);

        // 6. Parsear respuesta JSON de IA
        try {
          let contentToParse = aiResponse.content.trim();

          // Remover bloques de código markdown si existen
          if (contentToParse.startsWith('```json')) {
            contentToParse = contentToParse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (contentToParse.startsWith('```')) {
            contentToParse = contentToParse.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }

          // Intentar parsear directamente
          try {
            mockAIResponse = JSON.parse(contentToParse);
          } catch (directParseError) {
            // Si falla, intentar extraer JSON del contenido
            const jsonMatch = contentToParse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              mockAIResponse = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error('No JSON found in response');
            }
          }

          // Validar que tiene la estructura mínima requerida
          if (!mockAIResponse.title || !mockAIResponse.content) {
            throw new Error('Parsed JSON missing required fields');
          }

          // 🛑 VALIDAR FORMATO EDITORIAL ANTES DE CONTINUAR
          this.validateEditorialFormat(mockAIResponse.content);

        } catch (parseError) {
          this.logger.error(`Failed to parse AI response as JSON: ${parseError.message}`);
          this.logger.debug(`Raw AI response: ${aiResponse.content.substring(0, 500)}`);

          // Fallback: usar contenido como texto plano
          mockAIResponse = {
            title: extractedContent.title,
            content: aiResponse.content,
            keywords: ['autogenerado'],
            tags: ['ai-generated'],
            category: extractedContent.category || 'general',
            summary: aiResponse.content.substring(0, 150) + '...',
            socialMediaCopies: {
              facebook: {
                hook: 'Mantente informado sobre las últimas noticias',
                copy: 'Lee más sobre esta noticia importante. Información actualizada y verificada.',
                emojis: ['📰', '🔔'],
                hookType: 'FreeValue',
                estimatedEngagement: 'medium'
              },
              twitter: {
                tweet: 'Última noticia: ' + (extractedContent.title || 'Sin título').substring(0, 200),
                hook: 'Mantente informado',
                emojis: ['📰'],
                hookType: 'FreeValue',
                threadIdeas: ['Contexto de la noticia', 'Impacto en la comunidad', 'Fuentes oficiales']
              }
            }
          };
        }

        // 7. Calcular costo real basado en tokens
        const cost = provider.calculateCost(aiResponse.usage);

        // 8. Metadata real de la generación
        realMetadata = {
          model: aiResponse.model,
          promptTokens: aiResponse.usage.promptTokens,
          completionTokens: aiResponse.usage.completionTokens,
          totalTokens: aiResponse.usage.totalTokens,
          cost,
          processingTime,
          temperature: agent.writingStyle.tone === 'formal' ? 0.7 : 0.85,
          maxTokens: 4000,
          finishReason: aiResponse.finishReason,
          aiProvider: 'openai',
          tokensUsed: aiResponse.usage.totalTokens,
          costEstimate: cost,
        };

        this.logger.log(`📊 Generation stats: ${aiResponse.usage.totalTokens} tokens, $${cost.toFixed(4)}, ${processingTime}ms`);

      } catch (aiError) {
        this.logger.error(`❌ AI provider error: ${aiError.message}`);
        throw new HttpException(
          `AI generation failed: ${aiError.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      // 9. Validar copys sociales
      const validation = this.socialCopyService.validateAllCopies(
        mockAIResponse.socialMediaCopies,
        {
          extractedContentId: body.extractedContentId,
          agentId: body.agentId,
        },
      );

      if (!validation.valid) {
        this.logger.warn(`⚠️ Social copy validation warnings: ${validation.overallErrors.join(', ')}`);
      }

      // 10. Guardar en AIContentGeneration
      const defaultTemplateId = body.templateId || '60d5ecb74d3f4f001f1d3456';
      const defaultProviderId = body.providerId || '60d5ecb74d3f4f001f1d3457';

      const aiContentGeneration = new this.aiContentGenerationModel({
        originalContentId: new Types.ObjectId(body.extractedContentId),
        originalTitle: extractedContent.title,
        originalContent: extractedContent.content,
        originalSourceUrl: extractedContent.sourceUrl,
        agentId: new Types.ObjectId(body.agentId),
        templateId: new Types.ObjectId(defaultTemplateId),
        providerId: new Types.ObjectId(defaultProviderId),
        generatedTitle: mockAIResponse.title,
        generatedContent: mockAIResponse.content,
        generatedSummary: mockAIResponse.summary,
        generatedKeywords: mockAIResponse.keywords,
        generatedTags: mockAIResponse.tags,
        generatedCategory: mockAIResponse.category,
        socialMediaCopies: mockAIResponse.socialMediaCopies,
        status: 'completed',
        generationMetadata: realMetadata,
      });

      const savedGeneration = await aiContentGeneration.save();

      // 8. Actualizar ExtractedNoticia con generatedContentId
      await this.extractedNoticiaModel.findByIdAndUpdate(
        body.extractedContentId,
        {
          generatedContentId: savedGeneration._id,
          isProcessed: true,
          processedAt: new Date(),
        },
      ).exec();

      // 9. Emitir evento 'content.generated'
      this.eventEmitter.emit('content.generated', {
        extractedContentId: body.extractedContentId,
        generatedContentId: (savedGeneration._id as Types.ObjectId).toString(),
        agentId: body.agentId,
        agentName: agent.name,
        hasSocialCopies: true,
        validationWarnings: validation.overallErrors,
        timestamp: new Date(),
      });

      // 10. Retornar resultado completo
      const response: GeneratedContentResponseDto = {
        id: (savedGeneration._id as Types.ObjectId).toString(),
        extractedNoticiaId: body.extractedContentId,
        templateId: defaultTemplateId,
        agentId: body.agentId,
        generatedContent: savedGeneration.generatedContent,
        generatedTitle: savedGeneration.generatedTitle,
        generatedSummary: savedGeneration.generatedSummary,
        status: 'generated',
        metadata: {
          wordCount: mockAIResponse.content.split(/\s+/).length,
          keywords: mockAIResponse.keywords,
        },
        generatedAt: savedGeneration.createdAt,
        createdAt: savedGeneration.createdAt,
      };

      this.logger.log(`✅ Content generated successfully with social copys: ${savedGeneration._id}`);

      // 🔌 SOCKET EVENT: Generación completada
      const processingTime = Date.now() - startTime;
      await this.socketGateway.sendToUser(userId, 'content:generation-completed', {
        extractedContentId: body.extractedContentId,
        generatedContentId: (savedGeneration._id as Types.ObjectId).toString(),
        agentId: body.agentId,
        agentName: agent.name,
        hasSocialCopies: true,
        validationWarnings: validation.overallErrors,
        metadata: {
          processingTime,
          totalTokens: realMetadata?.totalTokens || 0,
          cost: realMetadata?.cost || 0,
        },
      });

      return { generatedContent: response };

    } catch (error) {
      this.logger.error(`❌ Error generating content: ${error.message}`, error.stack);

      // 🔌 SOCKET EVENT: Generación fallida
      await this.socketGateway.sendToUser(userId, 'content:generation-failed', {
        extractedContentId: body.extractedContentId,
        agentId: body.agentId,
        error: error.message,
        reason: error instanceof HttpException ? error.message : 'Internal server error',
      });

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        error.message || 'Failed to generate content',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 🎬 DIRECTOR EDITORIAL - Generar contenido desde instrucciones libres
   * Endpoint para Tab Director Editorial - El usuario escribe lo que quiere y el agente genera
   */
  @Post('director-editorial')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generar artículo desde instrucciones libres del usuario' })
  @ApiResponse({ status: 200, description: 'Artículo generado exitosamente' })
  async generateFromDirectorEditorial(
    @Body() body: {
      instructions: string;
      language?: 'es' | 'en';
    },
    @CurrentUser() user: any
  ): Promise<{ generatedContent: GeneratedContentResponseDto }> {
    const startTime = Date.now();
    const userId = user?.id || 'system';

    try {
      this.logger.log(`🎬 Director Editorial: Generating content from instructions (${body.instructions.length} chars)`);

      // 1. Validar instrucciones
      if (!body.instructions || body.instructions.trim().length < 20) {
        throw new HttpException('Instructions too short (minimum 20 characters)', HttpStatus.BAD_REQUEST);
      }

      // 2. Obtener agente "El Informante Pachuqueño"
      const agent = await this.contentAgentModel.findOne({
        name: 'El Informante Pachuqueño'
      });

      if (!agent) {
        throw new NotFoundException('Agente "El Informante Pachuqueño" no encontrado. Créalo primero.');
      }

      // 3. Construir prompts especializados usando el agente real
      const { systemPrompt, userPrompt } = this.directorEditorialPromptBuilder.buildPrompt({
        agent: agent,
        userInstructions: body.instructions,
        language: body.language || 'es',
      });

      // 4. Llamar a OpenAI
      const provider = this.providerFactory.getProvider('openai');
      const aiResponse = await provider.generateContent({
        systemPrompt,
        userPrompt,
        temperature: 0.7,
        maxTokens: 4000,
      });

      // 5. Parsear respuesta
      const mockAIResponse = JSON.parse(aiResponse.content);

      // 6. Validar output
      const validation = this.directorEditorialPromptBuilder.validateOutput(mockAIResponse);
      if (!validation.isValid) {
        throw new HttpException(
          `Output inválido: ${validation.errors.join(', ')}`,
          HttpStatus.BAD_REQUEST
        );
      }

      // 7. Preparar metadata
      const realMetadata = {
        model: aiResponse.model || 'gpt-4-turbo-preview',
        promptTokens: aiResponse.usage?.promptTokens || 0,
        completionTokens: aiResponse.usage?.completionTokens || 0,
        totalTokens: aiResponse.usage?.totalTokens || 0,
        cost: 0, // Se calcula después
        processingTime: Date.now() - startTime,
        temperature: 0.7,
        maxTokens: 4000,
        finishReason: aiResponse.finishReason || 'stop',
      };

      // 8. Guardar en AIContentGeneration
      const defaultTemplateId = '60d5ecb74d3f4f001f1d3456';
      const defaultProviderId = '60d5ecb74d3f4f001f1d3457';

      const aiContentGeneration = new this.aiContentGenerationModel({
        originalContentId: null, // NO hay fuente externa
        originalTitle: body.instructions.substring(0, 100),
        originalContent: body.instructions,
        originalSourceUrl: null,
        agentId: agent._id as Types.ObjectId,
        templateId: new Types.ObjectId(defaultTemplateId),
        providerId: new Types.ObjectId(defaultProviderId),
        generatedTitle: mockAIResponse.title,
        generatedContent: mockAIResponse.content,
        generatedSummary: mockAIResponse.summary,
        generatedKeywords: mockAIResponse.keywords,
        generatedTags: mockAIResponse.tags,
        generatedCategory: mockAIResponse.category,
        socialMediaCopies: mockAIResponse.socialMediaCopies,
        status: 'completed',
        generationMetadata: realMetadata,
      });

      const savedGeneration = await aiContentGeneration.save();

      // 9. Emitir evento
      this.eventEmitter.emit('content.generated', {
        extractedContentId: null,
        generatedContentId: (savedGeneration._id as Types.ObjectId).toString(),
        agentId: agent._id.toString(),
        agentName: agent.name,
        hasSocialCopies: true,
        validationWarnings: validation.errors,
        timestamp: new Date(),
        source: 'director-editorial',
      });

      // 10. Retornar resultado
      const response: GeneratedContentResponseDto = {
        id: (savedGeneration._id as Types.ObjectId).toString(),
        extractedNoticiaId: null,
        templateId: defaultTemplateId,
        agentId: agent._id.toString(),
        generatedContent: savedGeneration.generatedContent,
        generatedTitle: savedGeneration.generatedTitle,
        generatedSummary: savedGeneration.generatedSummary,
        status: 'generated',
        metadata: {
          wordCount: mockAIResponse.content.split(/\s+/).length,
          keywords: mockAIResponse.keywords,
        },
        generatedAt: savedGeneration.createdAt,
        createdAt: savedGeneration.createdAt,
      };

      this.logger.log(`✅ Director Editorial: Content generated successfully: ${savedGeneration._id}`);

      // 🔌 SOCKET EVENT
      const processingTime = Date.now() - startTime;
      await this.socketGateway.sendToUser(userId, 'content:generation-completed', {
        extractedContentId: null,
        generatedContentId: (savedGeneration._id as Types.ObjectId).toString(),
        agentId: agent._id.toString(),
        agentName: agent.name,
        hasSocialCopies: true,
        validationWarnings: validation.errors,
        metadata: {
          processingTime,
          totalTokens: realMetadata.totalTokens,
          cost: realMetadata.cost,
        },
        source: 'director-editorial',
      });

      return { generatedContent: response };

    } catch (error) {
      this.logger.error(`❌ Director Editorial error: ${error.message}`, error.stack);

      // 🔌 SOCKET EVENT: Generación fallida
      await this.socketGateway.sendToUser(userId, 'content:generation-failed', {
        error: error.message,
        reason: error instanceof HttpException ? error.message : 'Internal server error',
        source: 'director-editorial',
      });

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        error.message || 'Failed to generate content from instructions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 📋 List generated content
   * Endpoint para Tab Generados - Listar contenido generado
   */
  @Get('generated')
  @HttpCode(HttpStatus.OK)
  async listGeneratedContent(
    @Query('status') status?: string,
    @Query('agentId') agentId?: string,
    @Query('extractedNoticiaId') extractedNoticiaId?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number
  ): Promise<{
    generated: GeneratedContentResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      console.log(`📋 Listing generated content with filters: status=${status}, agentId=${agentId}, extractedNoticiaId=${extractedNoticiaId}`);

      const filters: any = {};
      if (status) filters.status = status;
      if (agentId) filters.agentId = new Types.ObjectId(agentId);
      if (extractedNoticiaId) filters.originalContentId = new Types.ObjectId(extractedNoticiaId);

      const pageSize = Math.min(limit || 50, 100);
      const currentPage = Math.max(page || 1, 1);
      const skip = (currentPage - 1) * pageSize;

      // Get total count
      const total = await this.aiContentGenerationModel.countDocuments(filters).exec();

      // Get generated content with pagination and populate agent
      const generatedContent = await this.aiContentGenerationModel
        .find(filters)
        .populate('agentId', 'name') // Populate agent name
        .sort({ createdAt: -1 }) // Most recent first
        .skip(skip)
        .limit(pageSize)
        .exec();

      const responseContent: GeneratedContentResponseDto[] = generatedContent.map(content => {
        const agent = content.agentId as unknown as { _id: Types.ObjectId; name: string } | null;

        return {
          id: (content._id as Types.ObjectId).toString(),
          extractedNoticiaId: (content.originalContentId as Types.ObjectId)?.toString() || '',
          templateId: (content.templateId as Types.ObjectId)?.toString() || '',
          agentId: agent?._id ? (agent._id as Types.ObjectId).toString() : '',
          agentName: agent?.name || 'Unknown Agent',
          generatedContent: content.generatedContent,
          generatedTitle: content.generatedTitle,
          generatedSummary: content.generatedSummary,
          generatedKeywords: content.generatedKeywords || [],
          generatedTags: content.generatedTags || [],
          generatedCategory: content.generatedCategory,
          status: content.status || 'generated',
          socialMediaCopies: content.socialMediaCopies,
          metadata: {
            wordCount: content.generatedContent?.split(' ').length || 0,
            keywords: content.generatedKeywords || [],
          },
          generationMetadata: content.generationMetadata,
          generatedAt: content.createdAt,
          createdAt: content.createdAt
        };
      });

      const totalPages = Math.ceil(total / pageSize);

      console.log(`✅ Found ${total} generated content items, returning page ${currentPage}/${totalPages}`);

      return {
        generated: responseContent,
        total,
        page: currentPage,
        totalPages
      };

    } catch (error) {
      console.error(`❌ Error listing generated content:`, error);
      throw new HttpException(
        'Failed to list generated content',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 📋 Get single generated content by ID
   * Endpoint para obtener un contenido generado específico
   */
  @Get('generated/:id')
  @HttpCode(HttpStatus.OK)
  async getGeneratedContentById(
    @Param('id') id: string
  ): Promise<{ generated: GeneratedContentResponseDto }> {
    try {
      console.log(`🔍 Getting generated content by ID: ${id}`);

      if (!Types.ObjectId.isValid(id)) {
        throw new HttpException('Invalid ID format', HttpStatus.BAD_REQUEST);
      }

      const content = await this.aiContentGenerationModel
        .findById(id)
        .populate('agentId', 'name')
        .exec();

      if (!content) {
        throw new NotFoundException(`Generated content with ID ${id} not found`);
      }

      const agent = content.agentId as unknown as { _id: Types.ObjectId; name: string } | null;

      const response: GeneratedContentResponseDto = {
        id: (content._id as Types.ObjectId).toString(),
        extractedNoticiaId: (content.originalContentId as Types.ObjectId)?.toString() || '',
        templateId: (content.templateId as Types.ObjectId)?.toString() || '',
        agentId: agent?._id ? (agent._id as Types.ObjectId).toString() : '',
        agentName: agent?.name || 'Unknown Agent',
        generatedContent: content.generatedContent,
        generatedTitle: content.generatedTitle,
        generatedSummary: content.generatedSummary,
        generatedKeywords: content.generatedKeywords || [],
        generatedTags: content.generatedTags || [],
        generatedCategory: content.generatedCategory,
        status: content.status || 'generated',
        socialMediaCopies: content.socialMediaCopies,
        metadata: {
          wordCount: content.generatedContent?.split(' ').length || 0,
          keywords: content.generatedKeywords || [],
        },
        generationMetadata: content.generationMetadata,
        generatedAt: content.createdAt,
        createdAt: content.createdAt
      };

      console.log(`✅ Found generated content: ${response.generatedTitle}`);

      return { generated: response };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error(`❌ Error getting generated content by ID:`, error);
      throw new HttpException(
        'Failed to get generated content',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ===================================
  // 👤 GESTIÓN DE CONTENT AGENTS
  // ===================================

  @Get('agents')
  @ApiOperation({ summary: 'Listar Content Agents (Perfiles Editoriales)' })
  @ApiResponse({ status: 200, description: 'Lista de agentes disponibles', type: [ContentAgentResponseDto] })
  async getContentAgents(
    @Query('agentType') agentType?: string,
    @Query('isActive') isActive?: boolean
  ): Promise<{ agents: ContentAgentResponseDto[]; total: number }> {
    this.logger.log(`👤 Getting content agents - agentType: ${agentType}, isActive: ${isActive}`);

    try {
      const filters: { agentType?: string; isActive?: boolean } = {};
      if (agentType) filters.agentType = agentType;
      if (isActive !== undefined) filters.isActive = isActive;

      const agents = await this.contentAgentService.findAll(filters);

      const responseAgents: ContentAgentResponseDto[] = agents.map(agent => {
        const writingStyle = agent.writingStyle as unknown as {
          tone: string;
          vocabulary: string;
          length: string;
          structure: string;
          audience: string;
        };

        return {
          id: (agent._id as Types.ObjectId).toString(),
          name: agent.name,
          agentType: agent.agentType,
          description: agent.description,
          personality: agent.personality,
          specializations: agent.specializations,
          editorialLean: agent.editorialLean,
          writingStyle: {
            tone: writingStyle.tone as WritingTone,
            vocabulary: writingStyle.vocabulary as VocabularyLevel,
            length: writingStyle.length as ContentLength,
            structure: writingStyle.structure as ContentStructure,
            audience: writingStyle.audience as TargetAudience
          },
          defaultTemplates: agent.defaultTemplates?.map(id => id.toString()),
          isActive: agent.isActive,
          configuration: agent.configuration,
          constraints: agent.constraints,
          workflow: agent.workflow,
          sampleOutputs: agent.sampleOutputs,
          performanceMetrics: agent.performanceMetrics as {
            totalArticles: number;
            averageQuality: number;
            averageTime: number;
            successRate: number;
            userRatings: number;
            lastActive: Date;
          },
          createdAt: agent.createdAt,
          updatedAt: agent.updatedAt
        };
      });

      return {
        agents: responseAgents,
        total: agents.length
      };

    } catch (error) {
      this.logger.error(`❌ Failed to get content agents: ${error.message}`);
      throw new HttpException('Failed to fetch content agents', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('agents')
  @ApiOperation({ summary: 'Crear nuevo Content Agent' })
  @ApiResponse({ status: 201, description: 'Agente creado exitosamente', type: ContentAgentResponseDto })
  async createContentAgent(@Body() createDto: CreateContentAgentDto): Promise<{ agent: ContentAgentResponseDto; message: string }> {
    this.logger.log(`👤 Creating content agent: ${createDto.name}`);

    try {
      const agent = await this.contentAgentService.createAgent(createDto);

      const writingStyle = agent.writingStyle as unknown as {
        tone: string;
        vocabulary: string;
        length: string;
        structure: string;
        audience: string;
      };

      const responseAgent: ContentAgentResponseDto = {
        id: (agent._id as Types.ObjectId).toString(),
        name: agent.name,
        agentType: agent.agentType,
        description: agent.description,
        personality: agent.personality,
        specializations: agent.specializations,
        editorialLean: agent.editorialLean,
        writingStyle: {
          tone: writingStyle.tone as WritingTone,
          vocabulary: writingStyle.vocabulary as VocabularyLevel,
          length: writingStyle.length as ContentLength,
          structure: writingStyle.structure as ContentStructure,
          audience: writingStyle.audience as TargetAudience
        },
        defaultTemplates: agent.defaultTemplates?.map(id => id.toString()),
        isActive: agent.isActive,
        configuration: agent.configuration,
        constraints: agent.constraints,
        workflow: agent.workflow,
        sampleOutputs: agent.sampleOutputs,
        performanceMetrics: agent.performanceMetrics as {
          totalArticles: number;
          averageQuality: number;
          averageTime: number;
          successRate: number;
          userRatings: number;
          lastActive: Date;
        },
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt
      };

      return {
        agent: responseAgent,
        message: 'Content agent created successfully'
      };

    } catch (error) {
      this.logger.error(`❌ Failed to create content agent: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException('Failed to create content agent', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('agents/:id')
  @ApiOperation({ summary: 'Obtener Content Agent por ID' })
  @ApiResponse({ status: 200, description: 'Agente encontrado', type: ContentAgentResponseDto })
  @ApiResponse({ status: 404, description: 'Agente no encontrado' })
  async getContentAgent(@Param('id') id: string): Promise<{ agent: ContentAgentResponseDto }> {
    this.logger.log(`👤 Getting content agent: ${id}`);

    try {
      const agent = await this.contentAgentService.findById(id);

      const writingStyle = agent.writingStyle as unknown as {
        tone: string;
        vocabulary: string;
        length: string;
        structure: string;
        audience: string;
      };

      const responseAgent: ContentAgentResponseDto = {
        id: (agent._id as Types.ObjectId).toString(),
        name: agent.name,
        agentType: agent.agentType,
        description: agent.description,
        personality: agent.personality,
        specializations: agent.specializations,
        editorialLean: agent.editorialLean,
        writingStyle: {
          tone: writingStyle.tone as WritingTone,
          vocabulary: writingStyle.vocabulary as VocabularyLevel,
          length: writingStyle.length as ContentLength,
          structure: writingStyle.structure as ContentStructure,
          audience: writingStyle.audience as TargetAudience
        },
        defaultTemplates: agent.defaultTemplates?.map(id => id.toString()),
        isActive: agent.isActive,
        configuration: agent.configuration,
        constraints: agent.constraints,
        workflow: agent.workflow,
        sampleOutputs: agent.sampleOutputs,
        performanceMetrics: agent.performanceMetrics as {
          totalArticles: number;
          averageQuality: number;
          averageTime: number;
          successRate: number;
          userRatings: number;
          lastActive: Date;
        },
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt
      };

      return { agent: responseAgent };

    } catch (error) {
      this.logger.error(`❌ Failed to get content agent ${id}: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException('Failed to fetch content agent', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put('agents/:id')
  @ApiOperation({ summary: 'Actualizar Content Agent' })
  @ApiResponse({ status: 200, description: 'Agente actualizado exitosamente', type: ContentAgentResponseDto })
  @ApiResponse({ status: 404, description: 'Agente no encontrado' })
  async updateContentAgent(
    @Param('id') id: string,
    @Body() updateDto: UpdateContentAgentDto
  ): Promise<{ agent: ContentAgentResponseDto; message: string }> {
    this.logger.log(`👤 Updating content agent: ${id}`);

    try {
      const agent = await this.contentAgentService.updateAgent(id, updateDto);

      const writingStyle = agent.writingStyle as unknown as {
        tone: string;
        vocabulary: string;
        length: string;
        structure: string;
        audience: string;
      };

      const responseAgent: ContentAgentResponseDto = {
        id: (agent._id as Types.ObjectId).toString(),
        name: agent.name,
        agentType: agent.agentType,
        description: agent.description,
        personality: agent.personality,
        specializations: agent.specializations,
        editorialLean: agent.editorialLean,
        writingStyle: {
          tone: writingStyle.tone as WritingTone,
          vocabulary: writingStyle.vocabulary as VocabularyLevel,
          length: writingStyle.length as ContentLength,
          structure: writingStyle.structure as ContentStructure,
          audience: writingStyle.audience as TargetAudience
        },
        defaultTemplates: agent.defaultTemplates?.map(id => id.toString()),
        isActive: agent.isActive,
        configuration: agent.configuration,
        constraints: agent.constraints,
        workflow: agent.workflow,
        sampleOutputs: agent.sampleOutputs,
        performanceMetrics: agent.performanceMetrics as {
          totalArticles: number;
          averageQuality: number;
          averageTime: number;
          successRate: number;
          userRatings: number;
          lastActive: Date;
        },
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt
      };

      return {
        agent: responseAgent,
        message: 'Content agent updated successfully'
      };

    } catch (error) {
      this.logger.error(`❌ Failed to update content agent ${id}: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException('Failed to update content agent', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete('agents/:id')
  @ApiOperation({ summary: 'Eliminar Content Agent' })
  @ApiResponse({ status: 200, description: 'Agente eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Agente no encontrado' })
  async deleteContentAgent(@Param('id') id: string): Promise<{ message: string }> {
    this.logger.log(`👤 Deleting content agent: ${id}`);

    try {
      await this.contentAgentService.deleteAgent(id);

      return {
        message: 'Content agent deleted successfully'
      };

    } catch (error) {
      this.logger.error(`❌ Failed to delete content agent ${id}: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException('Failed to delete content agent', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('agents/:id/statistics')
  @ApiOperation({ summary: 'Obtener estadísticas de un Content Agent' })
  @ApiResponse({ status: 200, description: 'Estadísticas del agente', type: AgentStatisticsDto })
  @ApiResponse({ status: 404, description: 'Agente no encontrado' })
  async getAgentStatistics(@Param('id') id: string): Promise<{ statistics: AgentStatisticsDto }> {
    this.logger.log(`👤 Getting statistics for content agent: ${id}`);

    try {
      const statistics = await this.contentAgentService.getAgentStatistics(id);

      return { statistics };

    } catch (error) {
      this.logger.error(`❌ Failed to get statistics for agent ${id}: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException('Failed to fetch agent statistics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ===================================
  // ⏰ SCHEDULER ENDPOINTS
  // ===================================

  @Post('websites/:id/force-schedule')
  @ApiOperation({ summary: 'Forzar ejecución de todos los jobs para un sitio' })
  @ApiResponse({ status: 200, description: 'Jobs programados exitosamente' })
  async forceSchedule(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`⏰ Force scheduling jobs for website: ${id}`);

    try {
      return await this.schedulerService.forceSchedule(id);

    } catch (error) {
      this.logger.error(`❌ Failed to force schedule for website ${id}: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException('Failed to force schedule jobs', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ===================================
  // 📝 USER GENERATED CONTENT (Manual Content Creation)
  // ===================================

  /**
   * 🚨 Crear contenido URGENT (Breaking News / Última Hora)
   * - Se publica automáticamente
   * - Redacción corta (300-500 palabras)
   * - Copys agresivos para redes sociales
   * - Auto-cierre después de 2 horas sin actualización
   */
  @Post('user-content/urgent')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear contenido URGENT (última hora)' })
  @ApiResponse({
    status: 201,
    description: 'Contenido urgent creado y publicado automáticamente',
    type: UserGeneratedContentResponseDto
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async createUrgentContent(
    @Body() dto: CreateUrgentContentDto,
    @CurrentUser('userId') userId: string,
  ): Promise<{ content: UserGeneratedContentResponseDto }> {
    this.logger.log(`🚨 Creating URGENT content by user: ${userId}`);
    this.logger.log(`Title: ${dto.originalTitle}`);

    try {
      const content = await this.userContentService.createUrgentContent(dto, userId);

      const response: UserGeneratedContentResponseDto = {
        id: (content._id as Types.ObjectId).toString(),
        originalTitle: content.originalTitle,
        mode: content.mode,
        status: content.status,
        isUrgent: content.isUrgent,
        urgentAutoCloseAt: content.urgentAutoCloseAt,
        createdAt: content.createdAt,
        updatedAt: content.updatedAt,
      };

      this.logger.log(`✅ URGENT content created and published: ${response.id}`);
      return { content: response };

    } catch (error) {
      this.logger.error(`❌ Failed to create urgent content: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to create urgent content',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 📝 Crear contenido NORMAL (Publicación Manual)
   * - Usuario decide tipo de publicación (breaking/noticia/blog)
   * - Redacción normal (500-700 palabras)
   * - Copys normales para redes sociales
   * - NO se auto-cierra
   */
  @Post('user-content/normal')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear contenido NORMAL (publicación manual)' })
  @ApiResponse({
    status: 201,
    description: 'Contenido normal creado exitosamente',
    type: UserGeneratedContentResponseDto
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async createNormalContent(
    @Body() dto: CreateNormalContentDto,
    @CurrentUser('userId') userId: string,
  ): Promise<{ content: UserGeneratedContentResponseDto }> {
    this.logger.log(`📝 Creating NORMAL content by user: ${userId}`);
    this.logger.log(`Title: ${dto.originalTitle}, Type: ${dto.publicationType}`);

    try {
      const content = await this.userContentService.createNormalContent(dto, userId);

      const response: UserGeneratedContentResponseDto = {
        id: (content._id as Types.ObjectId).toString(),
        originalTitle: content.originalTitle,
        mode: content.mode,
        status: content.status,
        isUrgent: content.isUrgent,
        createdAt: content.createdAt,
        updatedAt: content.updatedAt,
      };

      this.logger.log(`✅ NORMAL content created: ${response.id}`);
      return { content: response };

    } catch (error) {
      this.logger.error(`❌ Failed to create normal content: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to create normal content',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * ✏️ Actualizar contenido URGENT
   * - Reemplaza el contenido existente
   * - Re-procesa con IA
   * - Re-publica
   * - REINICIA el timer de 2 horas
   */
  @Put('user-content/urgent/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar contenido URGENT (reinicia timer)' })
  @ApiResponse({
    status: 200,
    description: 'Contenido urgent actualizado y timer reiniciado',
    type: UserGeneratedContentResponseDto
  })
  @ApiResponse({ status: 404, description: 'Contenido no encontrado' })
  @ApiResponse({ status: 400, description: 'Solo contenido URGENT puede ser actualizado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async updateUrgentContent(
    @Param('id') id: string,
    @Body() dto: UpdateUrgentContentDto,
    @CurrentUser('userId') userId: string,
  ): Promise<{ content: UserGeneratedContentResponseDto }> {
    this.logger.log(`✏️ Updating URGENT content: ${id}`);

    try {
      const content = await this.userContentService.updateUrgentContent(id, dto, userId);

      const response: UserGeneratedContentResponseDto = {
        id: (content._id as Types.ObjectId).toString(),
        originalTitle: content.originalTitle,
        mode: content.mode,
        status: content.status,
        isUrgent: content.isUrgent,
        urgentAutoCloseAt: content.urgentAutoCloseAt,
        createdAt: content.createdAt,
        updatedAt: content.updatedAt,
      };

      this.logger.log(`✅ URGENT content updated and timer restarted: ${response.id}`);
      return { content: response };

    } catch (error) {
      this.logger.error(`❌ Failed to update urgent content: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to update urgent content',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 🔒 Cerrar contenido URGENT manualmente
   * - Usuario decide cerrar antes de las 2 horas
   * - Se remueve del cintillo "ÚLTIMO MOMENTO"
   * - NO se agrega párrafo de cierre automático
   */
  @Post('user-content/close/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar contenido URGENT manualmente' })
  @ApiResponse({
    status: 200,
    description: 'Contenido urgent cerrado exitosamente',
    type: UserGeneratedContentResponseDto
  })
  @ApiResponse({ status: 404, description: 'Contenido no encontrado' })
  @ApiResponse({ status: 400, description: 'Solo contenido URGENT puede ser cerrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async closeUrgentContent(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ): Promise<{ content: UserGeneratedContentResponseDto }> {
    this.logger.log(`🔒 Closing URGENT content manually: ${id}`);

    try {
      const content = await this.userContentService.closeUrgentContent(id, 'user', userId);

      const response: UserGeneratedContentResponseDto = {
        id: (content._id as Types.ObjectId).toString(),
        originalTitle: content.originalTitle,
        mode: content.mode,
        status: content.status,
        isUrgent: content.isUrgent,
        urgentAutoCloseAt: content.urgentAutoCloseAt,
        createdAt: content.createdAt,
        updatedAt: content.updatedAt,
      };

      this.logger.log(`✅ URGENT content closed manually: ${response.id}`);
      return { content: response };

    } catch (error) {
      this.logger.error(`❌ Failed to close urgent content: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to close urgent content',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 📋 Listar contenido URGENT activo (PÚBLICO - para cintillo)
   * - isUrgent: true
   * - urgentClosed: false
   * - status: 'published'
   * Ordenado por urgentCreatedAt DESC
   */
  @Public()
  @Get('user-content/urgent/active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar contenido URGENT activo' })
  @ApiResponse({
    status: 200,
    description: 'Lista de contenido urgent activo',
    type: ActiveUrgentContentResponseDto
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async getActiveUrgentContent(): Promise<ActiveUrgentContentResponseDto> {
    this.logger.log('📋 Getting active URGENT content...');

    try {
      const activeContent = await this.userContentService.getActiveUrgentContent();

      const contentList: UserGeneratedContentResponseDto[] = activeContent.map(content => {
        // Extraer datos de PublishedNoticia populated
        const publishedNoticia = content.publishedNoticiaId as any;

        return {
          id: (content._id as Types.ObjectId).toString(),
          originalTitle: content.originalTitle,
          mode: content.mode,
          status: content.status,
          isUrgent: content.isUrgent,
          urgentAutoCloseAt: content.urgentAutoCloseAt,
          createdAt: content.createdAt,
          updatedAt: content.updatedAt,
          // Agregar datos de PublishedNoticia para el cintillo
          publishedNoticiaId: publishedNoticia?._id?.toString(),
          slug: publishedNoticia?.slug,
          title: publishedNoticia?.title,
        };
      });

      this.logger.log(`✅ Found ${contentList.length} active URGENT content items`);

      return {
        content: contentList,
        total: contentList.length,
      };

    } catch (error) {
      this.logger.error(`❌ Failed to get active urgent content: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to get active urgent content',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 📤 Upload de archivos (imágenes/videos)
   * TODO FASE 6: Implementar con FileManagementService
   * Por ahora retorna placeholder
   */
  @Post('user-content/upload')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload de archivos para contenido manual (TODO FASE 6)' })
  @ApiResponse({
    status: 201,
    description: 'Archivos subidos exitosamente',
  })
  async uploadContentFiles(
    @CurrentUser('userId') userId: string,
  ): Promise<{ urls: string[]; message: string }> {
    this.logger.warn('⚠️ Upload endpoint not fully implemented yet (TODO FASE 6)');

    // TODO FASE 6: Implementar con FileManagementService y @UseInterceptors(FilesInterceptor('files', 10))
    // Por ahora retornamos placeholder

    return {
      urls: [],
      message: 'Upload endpoint not implemented yet - will be completed in FASE 6',
    };
  }

  // ===================================
  // 🛑 VALIDACIÓN ANTI-PLAGIO DE FORMATOS EDITORIALES
  // ===================================

  /**
   * Validar que el contenido generado NO copie formatos editoriales de medios ajenos
   * @throws HttpException si se detecta plagio de formato editorial
   */
  private validateEditorialFormat(generatedContent: string): void {
    this.logger.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.logger.warn('🔍 VALIDANDO FORMATOS EDITORIALES');
    this.logger.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Extraer primeros 200 caracteres para validar
    const contentStart = generatedContent.substring(0, 200).trim();
    this.logger.warn(`Inicio del contenido generado (200 chars):`);
    this.logger.warn(contentStart);

    // Patrones de formatos editoriales prohibidos
    const editorialFormatPatterns = [
      { pattern: /^PACHUCA,\s*Hgo\.,.*?\.[-—–]/i, name: 'Quadratín Pachuca (PACHUCA, Hgo., fecha.-)' },
      { pattern: /^TULANCINGO,\s*Hgo\.,.*?\.[-—–]/i, name: 'Quadratín Tulancingo' },
      { pattern: /^CIUDAD SAHAGÚN,\s*Hgo\.,.*?\.[-—–]/i, name: 'Quadratín Ciudad Sahagún' },
      { pattern: /^MINERAL DE LA REFORMA,\s*Hgo\.,.*?\.[-—–]/i, name: 'Quadratín Mineral de la Reforma' },
      { pattern: /^[A-ZÁÉÍÓÚÑ\s]+,\s*Hgo\.,.*?\.[-—–]/i, name: 'Formato Quadratín genérico' },
      { pattern: /^[A-Z][a-záéíóúñ]+,\s*Hidalgo,\s*a\s+\d{1,2}\s+de\s+[a-z]+\s+de\s+\d{4}\./i, name: 'El Sol de Hidalgo (Ciudad, Hidalgo, a fecha.)' },
      { pattern: /^[A-ZÁÉÍÓÚÑ\s]+\.[-—–]/i, name: 'Plaza Juárez (CIUDAD.—)' },
      { pattern: /^[A-Z][a-záéíóúñ]+\.[-—–]/i, name: 'Formato con ciudad y guion largo' },
    ];

    // Validar contra cada patrón
    for (const { pattern, name } of editorialFormatPatterns) {
      this.logger.warn(`Probando patrón: ${name}`);

      if (pattern.test(contentStart)) {
        this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.logger.error(`🚫🚫🚫 PLAGIO DE FORMATO EDITORIAL DETECTADO: ${name}`);
        this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.logger.error(`Contenido rechazado: "${contentStart}"`);
        this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        throw new HttpException(
          `Plagio de formato editorial detectado: ${name}. El contenido debe comenzar con un lead informativo original, sin copiar formatos de medios externos.`,
          HttpStatus.UNPROCESSABLE_ENTITY
        );
      }
    }

    this.logger.log('✅ Validación de formato editorial APROBADA - No se detectó plagio');
    this.logger.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}