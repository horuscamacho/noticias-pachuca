import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginationService } from '../../common/services/pagination.service';
import { CacheService } from '../../services/cache.service';
import { RapidAPITwitterUser, RapidAPITwitterUserDocument } from '../schemas/rapidapi-twitter-user.schema';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';

import { CreateRapidAPITwitterUserDto, UpdateRapidAPITwitterUserDto } from '../dto/rapidapi-twitter-user-management.dto';

/**
 * 🎯 RAPIDAPI TWITTER USER MANAGEMENT SERVICE
 * Servicio para gestión de usuarios de Twitter monitoreados
 * ✅ Sin any types - Todo tipado
 * ✅ Integrado con servicios existentes (Cache, Pagination)
 */

@Injectable()
export class RapidAPITwitterUserManagementService {
  private readonly logger = new Logger(RapidAPITwitterUserManagementService.name);
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    @InjectModel(RapidAPITwitterUser.name)
    private userModel: Model<RapidAPITwitterUserDocument>,
    private readonly paginationService: PaginationService, // ✅ Usar existente
    private readonly cacheService: CacheService, // ✅ Usar existente
  ) {
    // Clear any existing incorrect cache on startup
    this.clearUsersCache().catch(error =>
      this.logger.error('Failed to clear users cache on startup:', error)
    );
  }

  async create(createUserDto: CreateRapidAPITwitterUserDto): Promise<RapidAPITwitterUserDocument> {
    // Verificar si ya existe un usuario con el mismo userId
    const existingUser = await this.userModel.findOne({
      userId: createUserDto.userId
    }).exec();

    if (existingUser) {
      throw new NotFoundException(`User with ID '${createUserDto.userId}' already exists`);
    }

    const user = new this.userModel({
      ...createUserDto,
      stats: {
        totalPostsExtracted: 0,
        extractionErrors: 0
      }
    });

    const savedUser = await user.save();

    // Clear cache
    await this.clearUsersCache();

    this.logger.log(`Created new Twitter user: ${savedUser.displayName} (@${savedUser.username})`);
    return savedUser;
  }

  async findAll(
    filters?: Record<string, string | boolean>,
    pagination?: PaginationDto
  ): Promise<PaginatedResponse<RapidAPITwitterUserDocument>> {
    // Build query
    const query: Record<string, unknown> = {};
    if (filters?.configId) {
      query.configId = filters.configId;
    }
    if (filters?.isActive !== undefined) {
      query['extractionConfig.isActive'] = filters.isActive;
    }
    if (filters?.status) {
      query.status = filters.status;
    }

    // Use pagination service with populate
    const paginationDto = pagination || new PaginationDto();
    const result = await this.paginationService.paginate(
      this.userModel,
      paginationDto,
      query,
      {
        populate: { path: 'configId', select: 'name host isActive' }
      }
    );

    return result;
  }

  async findById(id: string): Promise<RapidAPITwitterUserDocument> {
    const cacheKey = `rapidapi-twitter-user-${id}`;

    // Try cache first
    const cached = await this.cacheService.get<RapidAPITwitterUserDocument>(cacheKey);
    if (cached) {
      return cached;
    }

    const user = await this.userModel
      .findById(id)
      .populate('configId', 'name host isActive')
      .exec();

    if (!user) {
      throw new NotFoundException(`Twitter user with ID '${id}' not found`);
    }

    // Cache result
    await this.cacheService.set(cacheKey, user, this.CACHE_TTL);

    return user;
  }

  async findByUserId(userId: string): Promise<RapidAPITwitterUserDocument | null> {
    return this.userModel
      .findOne({ userId })
      .populate('configId', 'name host isActive')
      .exec();
  }

  async findByUsername(username: string): Promise<RapidAPITwitterUserDocument | null> {
    return this.userModel
      .findOne({ username })
      .populate('configId', 'name host isActive')
      .exec();
  }

  async update(id: string, updateUserDto: UpdateRapidAPITwitterUserDto): Promise<RapidAPITwitterUserDocument> {
    const user = await this.findById(id);

    Object.assign(user, updateUserDto);
    const updatedUser = await user.save();

    // Clear cache
    await this.clearUserCache(id);
    await this.clearUsersCache();

    this.logger.log(`Updated Twitter user: ${updatedUser.displayName} (@${updatedUser.username})`);
    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.userModel.findByIdAndDelete(id).exec();

    // Clear cache
    await this.clearUserCache(id);
    await this.clearUsersCache();

    this.logger.log(`Deleted Twitter user: ${user.displayName} (@${user.username})`);
  }

  async getUserStats(id: string): Promise<{
    user: RapidAPITwitterUserDocument;
    extractionHistory: {
      totalExtractions: number;
      successfulExtractions: number;
      failedExtractions: number;
      lastExtraction?: Date;
      avgTweetsPerExtraction: number;
    };
    quotaUsage: {
      configName: string;
      requestsUsed: number;
      requestsRemaining: number;
    };
  }> {
    const user = await this.findById(id);

    // TODO: Implement extraction history from logs collection
    // For now, return basic stats from user document
    const extractionHistory = {
      totalExtractions: 0, // Calculate from logs
      successfulExtractions: 0, // Calculate from logs
      failedExtractions: 0, // Calculate from logs
      lastExtraction: user.stats.lastSuccessfulExtraction,
      avgTweetsPerExtraction: 0 // Calculate from logs
    };

    // TODO: Get quota usage from config
    const quotaUsage = {
      configName: 'Default Config', // Get from populated config
      requestsUsed: 0,
      requestsRemaining: 1000
    };

    return {
      user,
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
        includeReplies?: boolean;
        includeRetweets?: boolean;
      };
    }
  ): Promise<RapidAPITwitterUserDocument> {
    const user = await this.findById(id);

    if (config.isActive !== undefined) {
      user.extractionConfig.isActive = config.isActive;
    }

    if (config.frequency) {
      user.extractionConfig.frequency = config.frequency;
    }

    if (config.maxPostsPerExtraction !== undefined) {
      user.extractionConfig.maxPostsPerExtraction = config.maxPostsPerExtraction;
    }

    if (config.extractionFilters) {
      if (config.extractionFilters.includeReplies !== undefined) {
        user.extractionConfig.extractionFilters.includeReplies = config.extractionFilters.includeReplies;
      }
      if (config.extractionFilters.includeRetweets !== undefined) {
        user.extractionConfig.extractionFilters.includeRetweets = config.extractionFilters.includeRetweets;
      }
    }

    const updatedUser = await user.save();

    // Clear cache
    await this.clearUserCache(id);

    this.logger.log(`Updated extraction config for Twitter user: ${updatedUser.displayName}`);
    return updatedUser;
  }

  async updateStats(
    id: string,
    stats: {
      totalPostsExtracted?: number;
      lastSuccessfulExtraction?: Date;
      lastError?: string;
    }
  ): Promise<void> {
    const updateQuery: Record<string, Record<string, unknown>> = {};

    if (stats.totalPostsExtracted !== undefined) {
      updateQuery['$inc'] = { 'stats.totalPostsExtracted': stats.totalPostsExtracted };
    }

    if (stats.lastSuccessfulExtraction) {
      updateQuery['$set'] = {
        ...updateQuery['$set'],
        'stats.lastSuccessfulExtraction': stats.lastSuccessfulExtraction
      };
    }

    if (stats.lastError !== undefined) {
      updateQuery['$set'] = {
        ...updateQuery['$set'],
        'stats.lastError': stats.lastError
      };
    }

    if (Object.keys(updateQuery).length > 0) {
      await this.userModel.findByIdAndUpdate(id, updateQuery).exec();
    }

    // Clear cache
    await this.clearUserCache(id);
  }

  async updateStatus(id: string, status: 'active' | 'paused' | 'error'): Promise<RapidAPITwitterUserDocument> {
    const user = await this.findById(id);
    user.status = status;
    const updatedUser = await user.save();

    // Clear cache
    await this.clearUserCache(id);

    this.logger.log(`Updated status for Twitter user ${updatedUser.displayName}: ${status}`);
    return updatedUser;
  }

  private async clearUserCache(id: string): Promise<void> {
    const cacheKey = `rapidapi-twitter-user-${id}`;
    await this.cacheService.del(cacheKey);
  }

  private async clearUsersCache(): Promise<void> {
    // Clear all users list cache variations
    const cacheKeys = [
      'rapidapi-twitter-users-all',
      'rapidapi-twitter-users-list',
      'rapidapi-twitter-users',
      'twitter-users-rapidapi'
    ];

    for (const key of cacheKeys) {
      try {
        await this.cacheService.del(key);
      } catch (error) {
        this.logger.warn(`Failed to clear cache key ${key}:`, error);
      }
    }

    this.logger.debug('Twitter users cache cleared');
  }
}