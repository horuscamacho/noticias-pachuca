import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { RapidAPIConfig, RapidAPIConfigDocument } from '../schemas/rapidapi-config.schema';
import { CreateRapidAPIConfigDto, UpdateRapidAPIConfigDto, UpdateQuotaUsageDto } from '../dto/rapidapi-config.dto';

@Injectable()
export class RapidAPIConfigService {
  private readonly logger = new Logger(RapidAPIConfigService.name);

  constructor(
    @InjectModel(RapidAPIConfig.name)
    private configModel: Model<RapidAPIConfigDocument>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createConfigDto: CreateRapidAPIConfigDto): Promise<RapidAPIConfigDocument> {
    const existingConfig = await this.configModel.findOne({
      name: createConfigDto.name
    }).exec();

    if (existingConfig) {
      throw new ConflictException(`Configuration with name '${createConfigDto.name}' already exists`);
    }

    if (createConfigDto.isActive) {
      await this.deactivateAllConfigs();
    }

    const now = new Date();
    const configWithUsage = {
      ...createConfigDto,
      currentUsage: {
        requestsToday: 0,
        requestsThisMonth: 0,
        lastResetDate: now,
        remainingDailyRequests: createConfigDto.quotaLimits.requestsPerDay,
        remainingMonthlyRequests: createConfigDto.quotaLimits.requestsPerMonth
      }
    };

    const config = new this.configModel(configWithUsage);
    return config.save();
  }

  async findAll(): Promise<RapidAPIConfigDocument[]> {
    return this.configModel.find().sort({ createdAt: -1 }).exec();
  }

  async findActive(): Promise<RapidAPIConfigDocument | null> {
    return this.configModel.findOne({ isActive: true }).exec();
  }

  async findById(id: string): Promise<RapidAPIConfigDocument> {
    const config = await this.configModel.findById(id).exec();
    if (!config) {
      throw new NotFoundException(`Configuration with ID '${id}' not found`);
    }
    return config;
  }

  async update(id: string, updateConfigDto: UpdateRapidAPIConfigDto): Promise<RapidAPIConfigDocument> {
    const config = await this.findById(id);

    if (updateConfigDto.name && updateConfigDto.name !== config.name) {
      const existingConfig = await this.configModel.findOne({
        name: updateConfigDto.name,
        _id: { $ne: id }
      }).exec();

      if (existingConfig) {
        throw new ConflictException(`Configuration with name '${updateConfigDto.name}' already exists`);
      }
    }

    if (updateConfigDto.isActive === true) {
      await this.deactivateAllConfigs();
    }

    Object.assign(config, updateConfigDto);
    return config.save();
  }

  async remove(id: string): Promise<void> {
    const config = await this.findById(id);
    await this.configModel.findByIdAndDelete(id).exec();
    this.logger.log(`Configuration '${config.name}' deleted`);
  }

  async activate(id: string): Promise<RapidAPIConfigDocument> {
    const config = await this.findById(id);

    await this.deactivateAllConfigs();

    config.isActive = true;
    return config.save();
  }

  async deactivate(id: string): Promise<RapidAPIConfigDocument> {
    const config = await this.findById(id);
    config.isActive = false;
    return config.save();
  }

  async testConnection(id: string): Promise<{ success: boolean; message: string; responseTime?: number }> {
    const config = await this.findById(id);

    const startTime = Date.now();

    try {
      // Import axios dynamically to avoid circular dependencies
      const axios = await import('axios');

      const testUrl = `${config.baseUrl}/test`;
      const headers = {
        'x-rapidapi-host': config.host,
        'x-rapidapi-key': config.apiKey,
        'User-Agent': 'Pachuca-Noticias/1.0'
      };

      await axios.default.get(testUrl, {
        headers,
        timeout: 10000,
        validateStatus: (status) => status < 500 // Accept any status < 500 as connection success
      });

      const responseTime = Date.now() - startTime;

      return {
        success: true,
        message: 'Connection successful',
        responseTime
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return {
          success: false,
          message: 'Connection refused or host not found',
          responseTime
        };
      }

      if (error.response?.status === 401 || error.response?.status === 403) {
        return {
          success: false,
          message: 'Authentication failed - check API key',
          responseTime
        };
      }

      if (error.response?.status === 404) {
        return {
          success: true, // 404 is expected for test endpoint, connection is working
          message: 'Connection successful (404 expected for test endpoint)',
          responseTime
        };
      }

      return {
        success: false,
        message: `Connection test failed: ${error.message}`,
        responseTime
      };
    }
  }

  async getUsageStats(id: string, startDate?: Date, endDate?: Date): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    totalCreditsUsed: number;
  }> {
    const config = await this.findById(id);

    // Import the log model dynamically to avoid circular dependencies
    const { InjectModel } = await import('@nestjs/mongoose');
    const { RapidAPIExtractionLog } = await import('../schemas/rapidapi-extraction-log.schema');

    const matchCondition: Record<string, unknown> = {
      configId: config._id
    };

    if (startDate || endDate) {
      matchCondition.createdAt = {};
      if (startDate) {
        (matchCondition.createdAt as Record<string, Date>)['$gte'] = startDate;
      }
      if (endDate) {
        (matchCondition.createdAt as Record<string, Date>)['$lte'] = endDate;
      }
    }

    const stats = await this.configModel.aggregate([
      {
        $lookup: {
          from: 'rapidapiextractionlogs',
          localField: '_id',
          foreignField: 'configId',
          as: 'logs'
        }
      },
      {
        $unwind: {
          path: '$logs',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          _id: config._id,
          ...(Object.keys(matchCondition).length > 1 && { 'logs.createdAt': matchCondition.createdAt })
        }
      },
      {
        $group: {
          _id: '$_id',
          totalRequests: { $sum: { $cond: [{ $ifNull: ['$logs', false] }, 1, 0] } },
          successfulRequests: { $sum: { $cond: [{ $eq: ['$logs.status', 'success'] }, 1, 0] } },
          failedRequests: { $sum: { $cond: [{ $eq: ['$logs.status', 'error'] }, 1, 0] } },
          averageResponseTime: { $avg: '$logs.responseTime' },
          totalCreditsUsed: { $sum: '$logs.totalApiCreditsUsed' }
        }
      }
    ]);

    if (!stats.length) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        totalCreditsUsed: 0
      };
    }

    return {
      totalRequests: stats[0].totalRequests || 0,
      successfulRequests: stats[0].successfulRequests || 0,
      failedRequests: stats[0].failedRequests || 0,
      averageResponseTime: Math.round(stats[0].averageResponseTime || 0),
      totalCreditsUsed: stats[0].totalCreditsUsed || 0
    };
  }

  async updateQuotaUsage(id: string, updateUsageDto: UpdateQuotaUsageDto): Promise<RapidAPIConfigDocument> {
    const config = await this.findById(id);

    if (updateUsageDto.resetDaily) {
      config.currentUsage.requestsToday = 0;
      config.currentUsage.remainingDailyRequests = config.quotaLimits.requestsPerDay;
      config.currentUsage.lastResetDate = new Date();
    }

    if (updateUsageDto.resetMonthly) {
      config.currentUsage.requestsThisMonth = 0;
      config.currentUsage.remainingMonthlyRequests = config.quotaLimits.requestsPerMonth;
    }

    if (updateUsageDto.requestsToday !== undefined) {
      config.currentUsage.requestsToday = updateUsageDto.requestsToday;
      config.currentUsage.remainingDailyRequests = Math.max(0, config.quotaLimits.requestsPerDay - updateUsageDto.requestsToday);
    }

    if (updateUsageDto.requestsThisMonth !== undefined) {
      config.currentUsage.requestsThisMonth = updateUsageDto.requestsThisMonth;
      config.currentUsage.remainingMonthlyRequests = Math.max(0, config.quotaLimits.requestsPerMonth - updateUsageDto.requestsThisMonth);
    }

    if (updateUsageDto.addRequests) {
      config.currentUsage.requestsToday += updateUsageDto.addRequests;
      config.currentUsage.requestsThisMonth += updateUsageDto.addRequests;
      config.currentUsage.remainingDailyRequests = Math.max(0, config.quotaLimits.requestsPerDay - config.currentUsage.requestsToday);
      config.currentUsage.remainingMonthlyRequests = Math.max(0, config.quotaLimits.requestsPerMonth - config.currentUsage.requestsThisMonth);
    }

    return config.save();
  }

  async incrementUsage(id: string, requestCount: number = 1): Promise<void> {
    this.logger.log(`📈 Starting incrementUsage for config ${id}, count: ${requestCount}`);
    const config = await this.findById(id);
    this.logger.log(`📋 Current usage BEFORE: ${JSON.stringify(config.currentUsage, null, 2)}`);

    // Auto-reset daily if needed
    const now = new Date();
    const lastReset = new Date(config.currentUsage.lastResetDate);
    const daysDiff = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff >= 1) {
      config.currentUsage.requestsToday = 0;
      config.currentUsage.lastResetDate = now;
    }

    // Auto-reset monthly if needed
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      config.currentUsage.requestsThisMonth = 0;
    }

    // Increment counters
    config.currentUsage.requestsToday += requestCount;
    config.currentUsage.requestsThisMonth += requestCount;
    config.currentUsage.lastRequestDate = now;

    // Update remaining requests
    config.currentUsage.remainingDailyRequests = Math.max(0, config.quotaLimits.requestsPerDay - config.currentUsage.requestsToday);
    config.currentUsage.remainingMonthlyRequests = Math.max(0, config.quotaLimits.requestsPerMonth - config.currentUsage.requestsThisMonth);

    this.logger.log(`📋 Current usage AFTER: ${JSON.stringify(config.currentUsage, null, 2)}`);

    // Force Mongoose to detect changes in nested object
    config.markModified('currentUsage');
    const savedConfig = await config.save();

    this.logger.log(`💾 Config saved successfully`);
    this.logger.log(`🔍 Verified saved data: ${JSON.stringify(savedConfig.currentUsage, null, 2)}`);
  }

  async checkQuotaAvailable(id: string, requestCount: number = 1): Promise<{
    canProceed: boolean;
    dailyRemaining: number;
    monthlyRemaining: number;
    warnings: string[];
  }> {
    const config = await this.findById(id);

    const warnings: string[] = [];
    const dailyRemaining = config.currentUsage.remainingDailyRequests;
    const monthlyRemaining = config.currentUsage.remainingMonthlyRequests;

    // Check if request would exceed limits
    const canProceedDaily = dailyRemaining >= requestCount;
    const canProceedMonthly = monthlyRemaining >= requestCount;

    // Generate warnings
    const dailyUsagePercent = (config.currentUsage.requestsToday / config.quotaLimits.requestsPerDay) * 100;
    const monthlyUsagePercent = (config.currentUsage.requestsThisMonth / config.quotaLimits.requestsPerMonth) * 100;

    if (dailyUsagePercent >= 80) {
      warnings.push(`Daily quota at ${dailyUsagePercent.toFixed(1)}% (${config.currentUsage.requestsToday}/${config.quotaLimits.requestsPerDay})`);
    }

    if (monthlyUsagePercent >= 80) {
      warnings.push(`Monthly quota at ${monthlyUsagePercent.toFixed(1)}% (${config.currentUsage.requestsThisMonth}/${config.quotaLimits.requestsPerMonth})`);
    }

    if (!canProceedDaily) {
      warnings.push(`Daily limit exceeded. Remaining: ${dailyRemaining}`);
    }

    if (!canProceedMonthly) {
      warnings.push(`Monthly limit exceeded. Remaining: ${monthlyRemaining}`);
    }

    return {
      canProceed: canProceedDaily && canProceedMonthly,
      dailyRemaining,
      monthlyRemaining,
      warnings
    };
  }

  async getQuotaStatus(id: string): Promise<{
    config: RapidAPIConfigDocument;
    dailyUsage: { used: number; limit: number; remaining: number; percentage: number };
    monthlyUsage: { used: number; limit: number; remaining: number; percentage: number };
    status: 'healthy' | 'warning' | 'critical';
  }> {
    const config = await this.findById(id);

    const dailyUsage = {
      used: config.currentUsage.requestsToday,
      limit: config.quotaLimits.requestsPerDay,
      remaining: config.currentUsage.remainingDailyRequests,
      percentage: (config.currentUsage.requestsToday / config.quotaLimits.requestsPerDay) * 100
    };

    const monthlyUsage = {
      used: config.currentUsage.requestsThisMonth,
      limit: config.quotaLimits.requestsPerMonth,
      remaining: config.currentUsage.remainingMonthlyRequests,
      percentage: (config.currentUsage.requestsThisMonth / config.quotaLimits.requestsPerMonth) * 100
    };

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    if (dailyUsage.percentage >= 95 || monthlyUsage.percentage >= 95) {
      status = 'critical';
    } else if (dailyUsage.percentage >= 80 || monthlyUsage.percentage >= 80) {
      status = 'warning';
    }

    return {
      config,
      dailyUsage,
      monthlyUsage,
      status
    };
  }

  private async deactivateAllConfigs(): Promise<void> {
    await this.configModel.updateMany(
      { isActive: true },
      { $set: { isActive: false } }
    ).exec();
  }

  @OnEvent('quota.check')
  async handleQuotaCheck(payload: { configId: string; requestCount: number }): Promise<void> {
    try {
      const result = await this.checkQuotaAvailable(payload.configId, payload.requestCount);
      this.eventEmitter.emit('quota.check.response', result);
    } catch (error) {
      this.eventEmitter.emit('quota.check.response', { canProceed: false, warnings: [error.message] });
    }
  }

  @OnEvent('quota.increment')
  async handleQuotaIncrement(payload: { configId: string; requestCount: number }): Promise<void> {
    this.logger.log(`🎯 Received quota.increment event for config: ${payload.configId}, count: ${payload.requestCount}`);
    try {
      await this.incrementUsage(payload.configId, payload.requestCount);
      this.logger.log(`✅ Successfully incremented quota usage for config: ${payload.configId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to increment quota usage: ${error.message}`);
    }
  }
}