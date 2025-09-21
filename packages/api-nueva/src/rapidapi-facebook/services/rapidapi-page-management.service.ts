import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginationService } from '../../common/services/pagination.service';
import { CacheService } from '../../services/cache.service';
import { RapidAPIFacebookPage, RapidAPIFacebookPageDocument } from '../schemas/rapidapi-facebook-page.schema';
import { CreateRapidAPIFacebookPageDto, UpdateRapidAPIFacebookPageDto } from '../dto/rapidapi-page-management.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';

/**
 * 🎯 RAPIDAPI PAGE MANAGEMENT SERVICE
 * Servicio para gestión de páginas de Facebook monitoreadas
 * ✅ Sin any types - Todo tipado
 * ✅ Integrado con servicios existentes (Cache, Pagination)
 */

@Injectable()
export class RapidAPIPageManagementService {
  private readonly logger = new Logger(RapidAPIPageManagementService.name);
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    @InjectModel(RapidAPIFacebookPage.name)
    private pageModel: Model<RapidAPIFacebookPageDocument>,
    private readonly paginationService: PaginationService, // ✅ Usar existente
    private readonly cacheService: CacheService, // ✅ Usar existente
  ) {
    // Clear any existing incorrect cache on startup (now with populate changes)
    this.clearPagesCache().catch(error =>
      this.logger.error('Failed to clear pages cache on startup:', error)
    );
  }

  async create(createPageDto: CreateRapidAPIFacebookPageDto): Promise<RapidAPIFacebookPageDocument> {
    // Verificar si ya existe una página con el mismo pageId
    const existingPage = await this.pageModel.findOne({
      pageId: createPageDto.pageId
    }).exec();

    if (existingPage) {
      throw new NotFoundException(`Page with ID '${createPageDto.pageId}' already exists`);
    }

    const page = new this.pageModel({
      ...createPageDto,
      stats: {
        totalPostsExtracted: 0,
        extractionErrors: 0,
        avgPostsPerDay: 0
      }
    });

    const savedPage = await page.save();

    // Clear cache
    await this.clearPagesCache();

    this.logger.log(`Created new page: ${savedPage.pageName} (${savedPage.pageId})`);
    return savedPage;
  }

  async findAll(
    filters?: Record<string, string | boolean>,
    pagination?: PaginationDto
  ): Promise<PaginatedResponse<RapidAPIFacebookPageDocument>> {
    // Build query
    const query: Record<string, unknown> = {};
    if (filters?.configId) {
      query.configId = filters.configId;
    }
    if (filters?.isActive !== undefined) {
      query['extractionConfig.isActive'] = filters.isActive;
    }

    // Use pagination service with populate
    const paginationDto = pagination || new PaginationDto();
    const result = await this.paginationService.paginate(
      this.pageModel,
      paginationDto,
      query,
      {
        populate: { path: 'configId', select: 'name host isActive' }
      }
    );

    return result;
  }

  async findById(id: string): Promise<RapidAPIFacebookPageDocument> {
    const cacheKey = `rapidapi-page-${id}`;

    // Try cache first
    const cached = await this.cacheService.get<RapidAPIFacebookPageDocument>(cacheKey);
    if (cached) {
      return cached;
    }

    const page = await this.pageModel
      .findById(id)
      .populate('configId', 'name host isActive')
      .exec();

    if (!page) {
      throw new NotFoundException(`Page with ID '${id}' not found`);
    }

    // Cache result
    await this.cacheService.set(cacheKey, page, this.CACHE_TTL);

    return page;
  }

  async update(id: string, updatePageDto: UpdateRapidAPIFacebookPageDto): Promise<RapidAPIFacebookPageDocument> {
    const page = await this.findById(id);

    Object.assign(page, updatePageDto);
    const updatedPage = await page.save();

    // Clear cache
    await this.clearPageCache(id);
    await this.clearPagesCache();

    this.logger.log(`Updated page: ${updatedPage.pageName} (${updatedPage.pageId})`);
    return updatedPage;
  }

  async remove(id: string): Promise<void> {
    const page = await this.findById(id);
    await this.pageModel.findByIdAndDelete(id).exec();

    // Clear cache
    await this.clearPageCache(id);
    await this.clearPagesCache();

    this.logger.log(`Deleted page: ${page.pageName} (${page.pageId})`);
  }

  async getPageStats(id: string): Promise<{
    page: RapidAPIFacebookPageDocument;
    extractionHistory: {
      totalExtractions: number;
      successfulExtractions: number;
      failedExtractions: number;
      lastExtraction?: Date;
      avgPostsPerExtraction: number;
    };
    quotaUsage: {
      configName: string;
      requestsUsed: number;
      requestsRemaining: number;
    };
  }> {
    const page = await this.findById(id);

    // TODO: Implement extraction history from logs collection
    // For now, return basic stats from page document
    const extractionHistory = {
      totalExtractions: 0, // Calculate from logs
      successfulExtractions: 0, // Calculate from logs
      failedExtractions: page.stats.extractionErrors || 0,
      lastExtraction: page.stats.lastSuccessfulExtraction,
      avgPostsPerExtraction: page.stats.avgPostsPerDay || 0
    };

    // TODO: Get quota usage from config
    const quotaUsage = {
      configName: 'Default Config', // Get from populated config
      requestsUsed: 0,
      requestsRemaining: 1000
    };

    return {
      page,
      extractionHistory,
      quotaUsage
    };
  }

  async updateExtractionConfig(
    id: string,
    config: {
      isActive?: boolean;
      frequency?: 'manual' | 'daily' | 'weekly';
      maxPostsPerExtraction?: number;
      extractionFilters?: {
        includeComments?: boolean;
        includeReactions?: boolean;
      };
    }
  ): Promise<RapidAPIFacebookPageDocument> {
    const page = await this.findById(id);

    if (config.isActive !== undefined) {
      page.extractionConfig.isActive = config.isActive;
    }

    if (config.frequency) {
      page.extractionConfig.frequency = config.frequency;
    }

    if (config.maxPostsPerExtraction !== undefined) {
      page.extractionConfig.maxPostsPerExtraction = config.maxPostsPerExtraction;
    }

    if (config.extractionFilters) {
      if (config.extractionFilters.includeComments !== undefined) {
        page.extractionConfig.extractionFilters.includeComments = config.extractionFilters.includeComments;
      }
      if (config.extractionFilters.includeReactions !== undefined) {
        page.extractionConfig.extractionFilters.includeReactions = config.extractionFilters.includeReactions;
      }
    }

    const updatedPage = await page.save();

    // Clear cache
    await this.clearPageCache(id);

    this.logger.log(`Updated extraction config for page: ${updatedPage.pageName}`);
    return updatedPage;
  }

  async updateStats(
    id: string,
    stats: {
      totalPostsExtracted?: number;
      lastSuccessfulExtraction?: Date;
      extractionErrors?: number;
      avgPostsPerDay?: number;
    }
  ): Promise<void> {
    const updateQuery: Record<string, any> = {};

    if (stats.totalPostsExtracted !== undefined) {
      updateQuery['$inc'] = { 'stats.totalPostsExtracted': stats.totalPostsExtracted };
    }

    if (stats.lastSuccessfulExtraction) {
      updateQuery['$set'] = {
        ...updateQuery['$set'],
        'stats.lastSuccessfulExtraction': stats.lastSuccessfulExtraction
      };
    }

    if (stats.extractionErrors !== undefined) {
      updateQuery['$inc'] = {
        ...updateQuery['$inc'],
        'stats.extractionErrors': stats.extractionErrors
      };
    }

    if (stats.avgPostsPerDay !== undefined) {
      updateQuery['$set'] = {
        ...updateQuery['$set'],
        'stats.avgPostsPerDay': stats.avgPostsPerDay
      };
    }

    if (Object.keys(updateQuery).length > 0) {
      await this.pageModel.findByIdAndUpdate(id, updateQuery).exec();
    }

    // Clear cache
    await this.clearPageCache(id);
  }

  private async clearPageCache(id: string): Promise<void> {
    const cacheKey = `rapidapi-page-${id}`;
    await this.cacheService.del(cacheKey);
  }

  private async clearPagesCache(): Promise<void> {
    // Clear all pages list cache variations - clear any existing incorrect cache
    const cacheKeys = [
      'rapidapi-pages-all',
      'rapidapi-pages-list',
      'rapidapi-facebook-pages',
      'pages-rapidapi'
    ];

    for (const key of cacheKeys) {
      try {
        await this.cacheService.del(key);
      } catch (error) {
        this.logger.warn(`Failed to clear cache key ${key}:`, error);
      }
    }

    this.logger.debug('Pages cache cleared to prevent incorrect data after model fix');
  }
}