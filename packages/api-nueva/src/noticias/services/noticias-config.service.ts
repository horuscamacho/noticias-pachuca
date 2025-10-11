import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { NoticiasExtractionConfig, NoticiasExtractionConfigDocument } from '../schemas/noticias-extraction-config.schema';
import { ExternalUrl, ExternalUrlDocument } from '../schemas/external-url.schema';
import { CreateNoticiasConfigDto, UpdateNoticiasConfigDto, TestExtractionDto, TestSelectorsDto } from '../dto/noticias-config.dto';
import { NoticiasScrapingService } from './noticias-scraping.service';
import { CacheService } from '../../services/cache.service';
import { PaginationService } from '../../common/services/pagination.service';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import {
  NoticiasConfig,
  TestExtractionResponse,
  ExtractionStats,
} from '../interfaces/noticias.interfaces';

/**
 * ⚙️ Servicio para gestión de configuraciones de extracción
 * CRUD completo, validación de selectores y testing
 */
@Injectable()
export class NoticiasConfigService {
  private readonly logger = new Logger(NoticiasConfigService.name);
  private readonly cachePrefix = 'noticias:config:';
  private readonly statsCacheKey = 'noticias:stats';
  private readonly defaultCacheTtl = 300; // 5 minutos

  constructor(
    @InjectModel(NoticiasExtractionConfig.name)
    private readonly configModel: Model<NoticiasExtractionConfigDocument>,
    @InjectModel(ExternalUrl.name)
    private readonly externalUrlModel: Model<ExternalUrlDocument>,
    private readonly scrapingService: NoticiasScrapingService,
    private readonly cacheService: CacheService,
    private readonly paginationService: PaginationService,
  ) {}

  /**
   * 📝 Crear nueva configuración de extracción
   */
  async create(createDto: CreateNoticiasConfigDto): Promise<NoticiasExtractionConfigDocument> {
    this.logger.log(`Creating new extraction config for domain: ${createDto.domain}`);

    try {
      // Verificar que no exista ya una configuración para este dominio
      const existingConfig = await this.configModel.findOne({ domain: createDto.domain });
      if (existingConfig) {
        throw new ConflictException(`Configuration already exists for domain: ${createDto.domain}`);
      }

      // Crear configuración
      const config = new this.configModel({
        domain: createDto.domain,
        name: createDto.name,
        isActive: createDto.isActive ?? true,
        selectors: createDto.selectors,
        extractionSettings: {
          useJavaScript: false,
          waitTime: 1000,
          rateLimit: 30,
          timeout: 30000,
          retryAttempts: 3,
          respectRobots: true,
          ...createDto.extractionSettings,
        },
        customHeaders: createDto.customHeaders || {},
        notes: createDto.notes,
        statistics: {
          totalExtractions: 0,
          successfulExtractions: 0,
          failedExtractions: 0,
        },
      });

      const savedConfig = await config.save();

      // Actualizar URLs existentes para este dominio
      await this.updateExternalUrlsForDomain(createDto.domain, (savedConfig._id as string).toString());

      // Limpiar cache relacionado
      await this.clearDomainCache(createDto.domain);

      this.logger.log(`Successfully created config ${savedConfig._id} for domain: ${createDto.domain}`);

      return savedConfig;

    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Failed to create config for domain ${createDto.domain}: ${error.message}`);
      throw new BadRequestException(`Failed to create configuration: ${error.message}`);
    }
  }

  /**
   * 📄 Obtener todas las configuraciones con paginación
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    isActive?: boolean
  ): Promise<PaginatedResponse<NoticiasExtractionConfigDocument>> {
    const filter: Record<string, unknown> = {};
    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    const cacheKey = `${this.cachePrefix}list:${page}:${limit}:${isActive}`;
    const cached = await this.cacheService.get<PaginatedResponse<NoticiasExtractionConfigDocument>>(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.paginationService.paginate(
      this.configModel,
      { page, limit },
      filter,
      {
        sort: { updatedAt: -1 },
        select: '-rawData -testResults.sampleExtraction',
      }
    );

    await this.cacheService.set(cacheKey, result, this.defaultCacheTtl);

    return result;
  }

  /**
   * 🔍 Obtener configuración por ID
   */
  async findById(id: string): Promise<NoticiasExtractionConfigDocument> {
    const cacheKey = `${this.cachePrefix}${id}`;
    const cached = await this.cacheService.get<NoticiasExtractionConfigDocument>(cacheKey);
    if (cached) {
      return cached;
    }

    const config = await this.configModel.findById(id);
    if (!config) {
      throw new NotFoundException(`Configuration not found with ID: ${id}`);
    }

    await this.cacheService.set(cacheKey, config, this.defaultCacheTtl);

    return config;
  }

  /**
   * 🌐 Obtener configuración por dominio
   */
  async findByDomain(domain: string): Promise<NoticiasExtractionConfigDocument | null> {
    const cacheKey = `${this.cachePrefix}domain:${domain}`;
    const cached = await this.cacheService.get<NoticiasExtractionConfigDocument | null>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const config = await this.configModel.findOne({ domain, isActive: true });

    await this.cacheService.set(cacheKey, config, this.defaultCacheTtl);

    return config;
  }

  /**
   * ✏️ Actualizar configuración
   */
  async update(id: string, updateDto: UpdateNoticiasConfigDto): Promise<NoticiasExtractionConfigDocument> {
    this.logger.log(`Updating extraction config: ${id}`);

    try {
      const config = await this.findById(id);

      // Actualizar campos
      Object.assign(config, updateDto);
      config.updatedAt = new Date();

      const updatedConfig = await config.save();

      // Limpiar cache relacionado
      await this.clearConfigCache(id, config.domain);

      this.logger.log(`Successfully updated config: ${id}`);

      return updatedConfig;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to update config ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to update configuration: ${error.message}`);
    }
  }

  /**
   * 🗑️ Eliminar configuración
   */
  async delete(id: string): Promise<void> {
    this.logger.log(`Deleting extraction config: ${id}`);

    try {
      const config = await this.findById(id);

      await this.configModel.findByIdAndDelete(id);

      // Actualizar URLs para marcarlas como sin configuración
      await this.clearExternalUrlsForDomain(config.domain);

      // Limpiar cache relacionado
      await this.clearConfigCache(id, config.domain);

      this.logger.log(`Successfully deleted config: ${id}`);

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to delete config ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to delete configuration: ${error.message}`);
    }
  }

  /**
   * 🔄 Activar/desactivar configuración
   */
  async toggleActive(id: string): Promise<NoticiasExtractionConfigDocument> {
    const config = await this.findById(id);
    config.isActive = !config.isActive;
    config.updatedAt = new Date();

    const updatedConfig = await config.save();

    // Limpiar cache relacionado
    await this.clearConfigCache(id, config.domain);

    this.logger.log(`Toggled config ${id} to ${config.isActive ? 'active' : 'inactive'}`);

    return updatedConfig;
  }

  /**
   * 🧪 Probar extracción con selectores
   */
  async testExtraction(testDto: TestExtractionDto): Promise<TestExtractionResponse> {
    this.logger.log(`Testing extraction for URL: ${testDto.url}`);

    try {
      // Crear configuración temporal para test
      const domain = new URL(testDto.url).hostname;
      const tempConfig: NoticiasConfig = {
        domain,
        name: 'Test Config',
        isActive: true,
        selectors: testDto.selectors,
        extractionSettings: {
          useJavaScript: false,
          waitTime: 1000,
          timeout: 15000,
          retryAttempts: 1,
          rateLimit: 60,
          respectRobots: false,
          ...testDto.settings,
        },
        customHeaders: testDto.customHeaders || {},
      };

      // Realizar extracción de prueba
      const result = await this.scrapingService.extractFromUrl(testDto.url, tempConfig);

      if (result.success) {
        return {
          success: true,
          extractedData: {
            title: result.data!.title,
            content: result.data!.content.substring(0, 500) + '...', // Truncar para preview
            images: result.data!.images.slice(0, 5), // Solo las primeras 5 imágenes
            publishedAt: result.data!.publishedAt?.toISOString(),
            author: result.data!.author,
            categories: result.data!.categories,
            excerpt: result.data!.excerpt,
            tags: result.data!.tags,
          },
          metadata: {
            processingTime: result.metadata.processingTime,
            method: result.metadata.method,
            contentLength: result.metadata.contentLength,
            imagesCount: result.metadata.imagesFound,
          },
          warnings: result.warnings,
        };
      } else {
        return {
          success: false,
          metadata: {
            processingTime: result.metadata.processingTime,
            method: result.metadata.method,
            contentLength: 0,
            imagesCount: 0,
          },
          error: {
            message: result.error!.message,
            details: result.error!.details,
          },
        };
      }

    } catch (error) {
      this.logger.error(`Test extraction failed for URL ${testDto.url}: ${error.message}`);

      return {
        success: false,
        metadata: {
          processingTime: 0,
          method: 'cheerio',
          contentLength: 0,
          imagesCount: 0,
        },
        error: {
          message: error.message,
          details: { stack: error.stack },
        },
      };
    }
  }

  /**
   * 🧪 Playground de selectores - probar selectores sin configuración en BD
   */
  async testSelectorsPlayground(testDto: TestSelectorsDto): Promise<TestExtractionResponse> {
    this.logger.log(`Testing selectors playground for URL: ${testDto.url}`);

    try {
      // Crear configuración temporal con los selectores proporcionados
      const tempConfig: NoticiasConfig = {
        domain: new URL(testDto.url).hostname,
        name: 'Playground Test',
        isActive: true,
        selectors: {
          title: testDto.selectors.title,
          content: testDto.selectors.content,
          images: testDto.selectors.images || [],
          publishedAt: testDto.selectors.publishedAt || '',
          author: testDto.selectors.author || '',
          categories: testDto.selectors.categories || [],
          excerpt: testDto.selectors.excerpt || '',
          tags: testDto.selectors.tags || [],
        },
        extractionSettings: {
          useJavaScript: testDto.settings?.useJavaScript ?? true,
          waitTime: testDto.settings?.waitTime ?? 1000,
          timeout: testDto.settings?.timeout ?? 15000,
          rateLimit: testDto.settings?.rateLimit ?? 30,
        },
        customHeaders: testDto.customHeaders || {},
      };

      // Realizar extracción de prueba
      const result = await this.scrapingService.extractFromUrl(testDto.url, tempConfig);

      if (result.success) {
        return {
          success: true,
          extractedData: {
            title: result.data!.title,
            content: result.data!.content, // Contenido completo para testing
            images: result.data!.images.slice(0, 10), // Más imágenes para testing
            publishedAt: result.data!.publishedAt?.toISOString(),
            author: result.data!.author,
            categories: result.data!.categories,
            excerpt: result.data!.excerpt,
            tags: result.data!.tags,
          },
          metadata: {
            processingTime: result.metadata.processingTime,
            method: result.metadata.method,
            contentLength: result.data!.content.length,
            imagesCount: result.data!.images.length,
          },
        };
      } else {
        return {
          success: false,
          metadata: {
            processingTime: result.metadata.processingTime,
            method: result.metadata.method,
            contentLength: 0,
            imagesCount: 0,
          },
          error: {
            message: result.error!.message,
            details: result.error!.details,
          },
        };
      }

    } catch (error) {
      this.logger.error(`Selectors playground test failed for URL ${testDto.url}: ${error.message}`);

      return {
        success: false,
        metadata: {
          processingTime: 0,
          method: 'cheerio',
          contentLength: 0,
          imagesCount: 0,
        },
        error: {
          message: error.message,
          details: { stack: error.stack },
        },
      };
    }
  }

  /**
   * 📊 Obtener estadísticas generales
   */
  async getStats(): Promise<ExtractionStats> {
    const cached = await this.cacheService.get<ExtractionStats>(this.statsCacheKey);
    if (cached) {
      return cached;
    }

    const [
      totalConfigs,
      activeConfigs,
      configsWithStats
    ] = await Promise.all([
      this.configModel.countDocuments(),
      this.configModel.countDocuments({ isActive: true }),
      this.configModel.find(
        { 'statistics.totalExtractions': { $gt: 0 } },
        'domain statistics'
      ).lean()
    ]);

    const totalExtractions = configsWithStats.reduce((sum, config) =>
      sum + (config.statistics?.totalExtractions || 0), 0
    );

    const successfulExtractions = configsWithStats.reduce((sum, config) =>
      sum + (config.statistics?.successfulExtractions || 0), 0
    );

    const failedExtractions = configsWithStats.reduce((sum, config) =>
      sum + (config.statistics?.failedExtractions || 0), 0
    );

    const byDomain = configsWithStats.map(config => ({
      domain: config.domain,
      total: config.statistics?.totalExtractions || 0,
      successful: config.statistics?.successfulExtractions || 0,
      failed: config.statistics?.failedExtractions || 0,
      lastExtraction: config.statistics?.lastExtractionAt,
    }));

    const stats: ExtractionStats = {
      total: totalExtractions,
      successful: successfulExtractions,
      failed: failedExtractions,
      pending: 0, // Se calculará desde los jobs
      processing: 0, // Se calculará desde los jobs
      byDomain,
      performance: {
        averageProcessingTime: configsWithStats.reduce((sum, config) =>
          sum + (config.statistics?.averageExtractionTime || 0), 0
        ) / Math.max(configsWithStats.length, 1),
        successRate: totalExtractions > 0 ? (successfulExtractions / totalExtractions) * 100 : 0,
        dailyExtractions: 0, // Se calculará desde logs de hoy
      },
    };

    await this.cacheService.set(this.statsCacheKey, stats, 300); // Cache por 5 minutos

    return stats;
  }

  /**
   * 📈 Actualizar estadísticas de configuración
   */
  async updateConfigStats(
    configId: string,
    success: boolean,
    processingTime: number
  ): Promise<void> {
    try {
      const updateFields: Record<string, unknown> = {
        'statistics.totalExtractions': { $inc: 1 },
        'statistics.lastExtractionAt': new Date(),
      };

      if (success) {
        updateFields['statistics.successfulExtractions'] = { $inc: 1 };
      } else {
        updateFields['statistics.failedExtractions'] = { $inc: 1 };
      }

      // Actualizar tiempo promedio (simplificado)
      const config = await this.configModel.findById(configId);
      if (config && config.statistics) {
        const currentAvg = config.statistics.averageExtractionTime || 0;
        const totalExtractions = (config.statistics.totalExtractions || 0) + 1;
        const newAvg = ((currentAvg * (totalExtractions - 1)) + processingTime) / totalExtractions;

        updateFields['statistics.averageExtractionTime'] = newAvg;
      }

      await this.configModel.findByIdAndUpdate(configId, updateFields);

      // Limpiar cache de estadísticas
      await this.cacheService.del(this.statsCacheKey);

    } catch (error) {
      this.logger.error(`Failed to update config stats for ${configId}: ${error.message}`);
    }
  }

  /**
   * 🧹 Limpiar cache relacionado a configuración
   */
  private async clearConfigCache(configId: string, domain: string): Promise<void> {
    const cacheKeys = [
      `${this.cachePrefix}${configId}`,
      `${this.cachePrefix}domain:${domain}`,
      this.statsCacheKey,
    ];

    // También limpiar cache de listas
    for (let page = 1; page <= 10; page++) {
      for (const limit of [10, 25, 50]) {
        for (const isActive of [true, false, undefined]) {
          cacheKeys.push(`${this.cachePrefix}list:${page}:${limit}:${isActive}`);
        }
      }
    }

    await Promise.all(cacheKeys.map(key => this.cacheService.del(key)));
  }

  /**
   * 🧹 Limpiar cache de dominio
   */
  private async clearDomainCache(domain: string): Promise<void> {
    await this.cacheService.del(`${this.cachePrefix}domain:${domain}`);
    await this.cacheService.del(this.statsCacheKey);
  }

  /**
   * 🔄 Actualizar URLs externas cuando se crea configuración
   */
  private async updateExternalUrlsForDomain(domain: string, configId: string): Promise<void> {
    try {
      const result = await this.externalUrlModel.updateMany(
        { domain, hasConfig: false },
        {
          hasConfig: true,
          configId: configId,
        }
      );

      this.logger.log(`Updated ${result.modifiedCount} external URLs for domain: ${domain}`);
    } catch (error) {
      this.logger.error(`Failed to update external URLs for domain ${domain}: ${error.message}`);
      // No lanzar error para no fallar la creación de configuración
    }
  }

  /**
   * 🧹 Limpiar URLs externas cuando se elimina configuración
   */
  private async clearExternalUrlsForDomain(domain: string): Promise<void> {
    try {
      const result = await this.externalUrlModel.updateMany(
        { domain, hasConfig: true },
        {
          hasConfig: false,
          $unset: { configId: 1 },
        }
      );

      this.logger.log(`Cleared ${result.modifiedCount} external URLs for domain: ${domain}`);
    } catch (error) {
      this.logger.error(`Failed to clear external URLs for domain ${domain}: ${error.message}`);
    }
  }

  /**
   * 🔄 Sincronizar URLs existentes con configuraciones
   */
  async syncUrlsWithConfigs(): Promise<{ updated: number; message: string }> {
    this.logger.log('Starting URL-config synchronization');

    try {
      // Obtener todas las configuraciones activas
      const configs = await this.configModel.find({ isActive: true }, 'domain _id');

      let totalUpdated = 0;

      for (const config of configs) {
        const result = await this.externalUrlModel.updateMany(
          { domain: config.domain, hasConfig: false },
          {
            hasConfig: true,
            configId: (config._id as string).toString(),
          }
        );

        totalUpdated += result.modifiedCount;
        this.logger.log(`Updated ${result.modifiedCount} URLs for domain: ${config.domain}`);
      }

      // Limpiar cache
      await this.cacheService.del('external-urls');

      this.logger.log(`Synchronization complete. Total URLs updated: ${totalUpdated}`);

      return {
        updated: totalUpdated,
        message: `Successfully synchronized ${totalUpdated} URLs with their configurations`
      };

    } catch (error) {
      this.logger.error(`URL synchronization failed: ${error.message}`);
      throw new BadRequestException(`Synchronization failed: ${error.message}`);
    }
  }
}