import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  HttpException,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { TwitterPublishingConfig, TwitterPublishingConfigDocument } from '../schemas/twitter-publishing-config.schema';
import { TwitterPublishingService } from '../services/twitter-publishing.service';
import { Site, SiteDocument } from '../../pachuca-noticias/schemas/site.schema';
import { CreateTwitterConfigDto } from '../dto/create-twitter-config.dto';
import { UpdateTwitterConfigDto } from '../dto/update-twitter-config.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * 🐦 Controller para gestión de configuraciones de publicación en Twitter
 * CRUD completo para TwitterPublishingConfig
 */

interface TwitterConfigResponseDto {
  id: string;
  siteId: string;
  name: string;
  twitterAccountId: string;
  twitterUsername: string;
  twitterDisplayName: string;
  templateId: string;
  isActive: boolean;
  publishingFrequency: number;
  maxTweetsPerDay: number;
  tweetsToday: number;
  lastPublishedAt?: Date;
  connectionStatus?: any;
  statistics?: any;
  createdAt: Date;
  updatedAt: Date;
}

@ApiTags('Twitter Publishing')
@Controller('generator-pro/twitter-config')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class TwitterPublishingController {
  private readonly logger = new Logger(TwitterPublishingController.name);

  constructor(
    @InjectModel(TwitterPublishingConfig.name)
    private readonly twitterConfigModel: Model<TwitterPublishingConfigDocument>,
    @InjectModel(Site.name)
    private readonly siteModel: Model<SiteDocument>,
    private readonly twitterService: TwitterPublishingService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.log('🐦 Twitter Publishing Controller initialized');
  }

  /**
   * 📋 LISTAR CONFIGURACIONES DE TWITTER
   * GET /generator-pro/twitter-config
   */
  @Get()
  @ApiOperation({
    summary: 'Listar configuraciones de Twitter',
    description: 'Obtiene lista de configuraciones de Twitter con filtros opcionales'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de configuraciones Twitter obtenida exitosamente',
  })
  async getTwitterConfigs(
    @Query('siteId') siteId?: string,
    @Query('active') active?: boolean,
    @Query('limit') limit = 50,
    @Query('page') page = 1
  ): Promise<{ configs: TwitterConfigResponseDto[]; total: number; page: number; limit: number }> {
    this.logger.log(`🐦 Getting Twitter configs - siteId: ${siteId}, active: ${active}`);

    try {
      const filter: Record<string, unknown> = {};

      if (siteId) {
        filter.siteId = new Types.ObjectId(siteId);
      }

      if (active !== undefined) {
        filter.isActive = active;
      }

      const skip = (page - 1) * limit;
      const [configs, total] = await Promise.all([
        this.twitterConfigModel
          .find(filter)
          .populate('siteId', 'name domain')
          .populate('templateId', 'name type')
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .lean(),
        this.twitterConfigModel.countDocuments(filter),
      ]);

      const responseConfigs: TwitterConfigResponseDto[] = configs.map(config => ({
        id: config._id.toString(),
        siteId: config.siteId.toString(),
        name: config.name,
        twitterAccountId: config.twitterAccountId,
        twitterUsername: config.twitterUsername,
        twitterDisplayName: config.twitterDisplayName,
        templateId: config.templateId.toString(),
        isActive: config.isActive,
        publishingFrequency: config.publishingFrequency,
        maxTweetsPerDay: config.maxTweetsPerDay,
        tweetsToday: config.tweetsToday,
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
      this.logger.error(`❌ Failed to get Twitter configs: ${error.message}`);
      throw new HttpException('Failed to fetch Twitter configurations', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * ➕ CREAR CONFIGURACIÓN DE TWITTER
   * POST /generator-pro/twitter-config
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear configuración de Twitter',
    description: 'Crea una nueva configuración de publicación automática en Twitter via GetLate.dev'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Configuración Twitter creada exitosamente',
  })
  async createTwitterConfig(@Body() createDto: CreateTwitterConfigDto): Promise<{ config: TwitterConfigResponseDto; message: string }> {
    this.logger.log(`🐦 Creating Twitter config: ${createDto.name}`);

    try {
      // Validar que existe el sitio destino
      const site = await this.siteModel.findById(createDto.siteId);
      if (!site) {
        throw new HttpException('Site not found', HttpStatus.NOT_FOUND);
      }

      // Crear nueva configuración Twitter
      const twitterConfig = new this.twitterConfigModel({
        ...createDto,
        siteId: new Types.ObjectId(createDto.siteId),
        templateId: new Types.ObjectId(createDto.templateId),
        isActive: createDto.isActive ?? true,
        publishingFrequency: createDto.publishingFrequency ?? 30,
        maxTweetsPerDay: createDto.maxTweetsPerDay ?? 10,
        tweetsToday: 0,
        dailyReset: new Date(),
      });

      const savedConfig = await twitterConfig.save();

      // Test de conexión inicial
      const connectionTest = await this.twitterService.validateAccountConnection(
        savedConfig.twitterAccountId,
        savedConfig.getLateApiKey
      );

      // Actualizar estado de conexión
      savedConfig.connectionStatus = {
        isConnected: connectionTest.isConnected,
        lastChecked: new Date(),
        accountInfo: connectionTest.accountInfo,
        errorMessage: connectionTest.error,
      };

      await savedConfig.save();

      this.eventEmitter.emit('generator-pro.twitter.created', {
        configId: savedConfig._id,
        name: savedConfig.name,
        siteId: savedConfig.siteId,
        timestamp: new Date(),
      });

      const responseDto: TwitterConfigResponseDto = {
        id: (savedConfig._id as Types.ObjectId).toString(),
        siteId: savedConfig.siteId.toString(),
        name: savedConfig.name,
        twitterAccountId: savedConfig.twitterAccountId,
        twitterUsername: savedConfig.twitterUsername,
        twitterDisplayName: savedConfig.twitterDisplayName,
        templateId: savedConfig.templateId.toString(),
        isActive: savedConfig.isActive,
        publishingFrequency: savedConfig.publishingFrequency,
        maxTweetsPerDay: savedConfig.maxTweetsPerDay,
        tweetsToday: savedConfig.tweetsToday,
        lastPublishedAt: savedConfig.lastPublishedAt,
        connectionStatus: savedConfig.connectionStatus,
        statistics: savedConfig.statistics,
        createdAt: savedConfig.createdAt,
        updatedAt: savedConfig.updatedAt,
      };

      return {
        config: responseDto,
        message: 'Twitter configuration created successfully',
      };

    } catch (error) {
      this.logger.error(`❌ Failed to create Twitter config: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException('Failed to create Twitter configuration', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 🔍 OBTENER CONFIGURACIÓN DE TWITTER POR ID
   * GET /generator-pro/twitter-config/:id
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener configuración de Twitter por ID',
    description: 'Obtiene los detalles completos de una configuración específica de Twitter'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Configuración encontrada',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Configuración no encontrada',
  })
  async getTwitterConfigById(@Param('id') id: string): Promise<TwitterConfigResponseDto> {
    this.logger.log(`🐦 Getting Twitter config by ID: ${id}`);

    try {
      const config = await this.twitterConfigModel
        .findById(id)
        .populate('siteId', 'name domain')
        .populate('templateId', 'name type')
        .lean();

      if (!config) {
        throw new HttpException('Twitter configuration not found', HttpStatus.NOT_FOUND);
      }

      return {
        id: config._id.toString(),
        siteId: config.siteId.toString(),
        name: config.name,
        twitterAccountId: config.twitterAccountId,
        twitterUsername: config.twitterUsername,
        twitterDisplayName: config.twitterDisplayName,
        templateId: config.templateId.toString(),
        isActive: config.isActive,
        publishingFrequency: config.publishingFrequency,
        maxTweetsPerDay: config.maxTweetsPerDay,
        tweetsToday: config.tweetsToday,
        lastPublishedAt: config.lastPublishedAt,
        connectionStatus: config.connectionStatus,
        statistics: config.statistics,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      };

    } catch (error) {
      this.logger.error(`❌ Failed to get Twitter config: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException('Failed to fetch Twitter configuration', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * ✏️ ACTUALIZAR CONFIGURACIÓN DE TWITTER
   * PATCH /generator-pro/twitter-config/:id
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar configuración de Twitter',
    description: 'Actualiza parcialmente una configuración existente de Twitter'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Configuración actualizada exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Configuración no encontrada',
  })
  async updateTwitterConfig(
    @Param('id') id: string,
    @Body() updateDto: UpdateTwitterConfigDto
  ): Promise<{ config: TwitterConfigResponseDto; message: string }> {
    this.logger.log(`🐦 Updating Twitter config: ${id}`);

    try {
      const config = await this.twitterConfigModel.findById(id);

      if (!config) {
        throw new HttpException('Twitter configuration not found', HttpStatus.NOT_FOUND);
      }

      // Actualizar campos
      Object.assign(config, updateDto);
      config.updatedAt = new Date();

      const updatedConfig = await config.save();

      // Si se actualizó la cuenta de Twitter, revalidar conexión
      if (updateDto.twitterAccountId || updateDto.getLateApiKey) {
        const connectionTest = await this.twitterService.validateAccountConnection(
          updatedConfig.twitterAccountId,
          updatedConfig.getLateApiKey
        );

        updatedConfig.connectionStatus = {
          isConnected: connectionTest.isConnected,
          lastChecked: new Date(),
          accountInfo: connectionTest.accountInfo,
          errorMessage: connectionTest.error,
        };

        await updatedConfig.save();
      }

      this.eventEmitter.emit('generator-pro.twitter.updated', {
        configId: updatedConfig._id,
        name: updatedConfig.name,
        timestamp: new Date(),
      });

      const responseDto: TwitterConfigResponseDto = {
        id: (updatedConfig._id as Types.ObjectId).toString(),
        siteId: updatedConfig.siteId.toString(),
        name: updatedConfig.name,
        twitterAccountId: updatedConfig.twitterAccountId,
        twitterUsername: updatedConfig.twitterUsername,
        twitterDisplayName: updatedConfig.twitterDisplayName,
        templateId: updatedConfig.templateId.toString(),
        isActive: updatedConfig.isActive,
        publishingFrequency: updatedConfig.publishingFrequency,
        maxTweetsPerDay: updatedConfig.maxTweetsPerDay,
        tweetsToday: updatedConfig.tweetsToday,
        lastPublishedAt: updatedConfig.lastPublishedAt,
        connectionStatus: updatedConfig.connectionStatus,
        statistics: updatedConfig.statistics,
        createdAt: updatedConfig.createdAt,
        updatedAt: updatedConfig.updatedAt,
      };

      return {
        config: responseDto,
        message: 'Twitter configuration updated successfully',
      };

    } catch (error) {
      this.logger.error(`❌ Failed to update Twitter config: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException('Failed to update Twitter configuration', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * ❌ ELIMINAR CONFIGURACIÓN DE TWITTER
   * DELETE /generator-pro/twitter-config/:id
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar configuración de Twitter',
    description: 'Elimina (soft delete) una configuración de Twitter'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Configuración eliminada exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Configuración no encontrada',
  })
  async deleteTwitterConfig(@Param('id') id: string): Promise<{ message: string }> {
    this.logger.log(`🐦 Deleting Twitter config: ${id}`);

    try {
      const config = await this.twitterConfigModel.findById(id);

      if (!config) {
        throw new HttpException('Twitter configuration not found', HttpStatus.NOT_FOUND);
      }

      // Soft delete: desactivar en lugar de eliminar
      config.isActive = false;
      await config.save();

      this.eventEmitter.emit('generator-pro.twitter.deleted', {
        configId: config._id,
        name: config.name,
        timestamp: new Date(),
      });

      return {
        message: 'Twitter configuration deleted successfully',
      };

    } catch (error) {
      this.logger.error(`❌ Failed to delete Twitter config: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException('Failed to delete Twitter configuration', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
