import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Telemetry, TelemetryDocument } from './schemas/telemetry.schema';
import {
  DeviceSession,
  DeviceSessionDocument,
} from './schemas/device-session.schema';
import { PaginationService } from '../common/services/pagination.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { BatchTelemetryDto, DeviceSessionDto } from './dto/telemetry.dto';
import {
  TelemetryFilterDto,
  DeviceSessionFilterDto,
} from './dto/analytics-filter.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Telemetry.name)
    private telemetryModel: Model<TelemetryDocument>,
    @InjectModel(DeviceSession.name)
    private deviceSessionModel: Model<DeviceSessionDocument>,
    private readonly paginationService: PaginationService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // 📊 TELEMETRY METHODS

  async storeTelemetryBatch(
    batchDto: BatchTelemetryDto,
  ): Promise<{ success: boolean; processed: number }> {
    try {
      const telemetryEvents = batchDto.events.map((event) => ({
        ...event,
        timestamp: event.timestamp || new Date(),
      }));

      await this.telemetryModel.insertMany(telemetryEvents, { ordered: false });

      // Invalidate related caches
      await this.invalidateTelemetryCache();

      return {
        success: true,
        processed: telemetryEvents.length,
      };
    } catch (error) {
      console.error('Error storing telemetry batch:', error);
      throw new Error('Failed to store telemetry data');
    }
  }

  async getTelemetryData(
    filterDto: TelemetryFilterDto,
  ): Promise<PaginatedResponse<Telemetry>> {
    const cacheKey = this.buildTelemetryCacheKey(filterDto);

    // Try cache first
    const cached =
      await this.cacheManager.get<PaginatedResponse<Telemetry>>(cacheKey);
    if (cached) {
      return cached;
    }

    // Build filter object
    const filter: Record<string, any> = {};

    if (filterDto.sessionId) {
      filter.sessionId = filterDto.sessionId;
    }

    if (filterDto.deviceId) {
      filter.deviceId = filterDto.deviceId;
    }

    if (filterDto.userId) {
      filter.userId = filterDto.userId;
    }

    if (filterDto.eventType) {
      filter.eventType = filterDto.eventType;
    }

    if (filterDto.platform) {
      filter['metadata.platform'] = filterDto.platform;
    }

    if (filterDto.startDate || filterDto.endDate) {
      filter.timestamp = {};
      if (filterDto.startDate) {
        filter.timestamp.$gte = new Date(filterDto.startDate);
      }
      if (filterDto.endDate) {
        filter.timestamp.$lte = new Date(filterDto.endDate);
      }
    }

    const options = {
      sort: { timestamp: -1 as const },
    };

    const result = await this.paginationService.paginate(
      this.telemetryModel,
      filterDto,
      filter,
      options,
    );

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, result, 300000);

    return result;
  }

  // 📱 DEVICE SESSION METHODS

  async createOrUpdateDeviceSession(
    sessionDto: DeviceSessionDto,
  ): Promise<DeviceSession> {
    try {
      const existingSession = await this.deviceSessionModel.findOne({
        sessionId: sessionDto.sessionId,
      });

      if (existingSession) {
        // Update existing session
        const updated = await this.deviceSessionModel.findByIdAndUpdate(
          existingSession._id,
          {
            ...sessionDto,
            updatedAt: new Date(),
          },
          { new: true },
        );

        if (!updated) {
          throw new Error('Failed to update device session');
        }

        return updated;
      } else {
        // Create new session
        const newSession = new this.deviceSessionModel({
          ...sessionDto,
          startTime: new Date(),
          isActive: true,
        });

        return await newSession.save();
      }
    } catch (error) {
      console.error('Error creating/updating device session:', error);
      throw new Error('Failed to create or update device session');
    }
  }

  async endDeviceSession(sessionId: string): Promise<{ success: boolean }> {
    try {
      await this.deviceSessionModel.findOneAndUpdate(
        { sessionId, isActive: true },
        {
          endTime: new Date(),
          isActive: false,
        },
      );

      // Invalidate session cache
      await this.invalidateSessionCache();

      return { success: true };
    } catch (error) {
      console.error('Error ending device session:', error);
      throw new Error('Failed to end device session');
    }
  }

  async getDeviceSessions(
    filterDto: DeviceSessionFilterDto,
  ): Promise<PaginatedResponse<DeviceSession>> {
    const cacheKey = this.buildSessionCacheKey(filterDto);

    // Try cache first
    const cached =
      await this.cacheManager.get<PaginatedResponse<DeviceSession>>(cacheKey);
    if (cached) {
      return cached;
    }

    // Build filter object
    const filter: Record<string, any> = {};

    if (filterDto.deviceId) {
      filter.deviceId = filterDto.deviceId;
    }

    if (filterDto.userId) {
      filter.userId = filterDto.userId;
    }

    if (filterDto.platform) {
      filter['deviceInfo.platform'] = filterDto.platform;
    }

    if (filterDto.isActive !== undefined) {
      filter.isActive = filterDto.isActive;
    }

    if (filterDto.isFirstLaunch !== undefined) {
      filter['appState.isFirstLaunch'] = filterDto.isFirstLaunch;
    }

    if (filterDto.startDate || filterDto.endDate) {
      filter.startTime = {};
      if (filterDto.startDate) {
        filter.startTime.$gte = new Date(filterDto.startDate);
      }
      if (filterDto.endDate) {
        filter.startTime.$lte = new Date(filterDto.endDate);
      }
    }

    const options = {
      sort: { startTime: -1 as const },
    };

    const result = await this.paginationService.paginate(
      this.deviceSessionModel,
      filterDto,
      filter,
      options,
    );

    // Cache for 10 minutes
    await this.cacheManager.set(cacheKey, result, 600000);

    return result;
  }

  // 📈 ANALYTICS METHODS

  async getAnalyticsSummary(): Promise<Record<string, any>> {
    const cacheKey = 'analytics:summary:daily';

    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const [totalSessions, activeSessions, newSessions, totalEvents] =
      await Promise.all([
        this.deviceSessionModel.countDocuments({}),
        this.deviceSessionModel.countDocuments({ isActive: true }),
        this.deviceSessionModel.countDocuments({
          'appState.isFirstLaunch': true,
          startTime: { $gte: yesterday },
        }),
        this.telemetryModel.countDocuments({
          timestamp: { $gte: yesterday },
        }),
      ]);

    const summary = {
      totalSessions,
      activeSessions,
      newSessions,
      totalEvents,
      generatedAt: new Date(),
    };

    // Cache for 1 hour
    await this.cacheManager.set(cacheKey, summary, 3600000);

    return summary;
  }

  // 🗑️ CACHE MANAGEMENT

  private buildTelemetryCacheKey(filterDto: TelemetryFilterDto): string {
    const parts = ['telemetry'];

    if (filterDto.sessionId) parts.push(`session:${filterDto.sessionId}`);
    if (filterDto.deviceId) parts.push(`device:${filterDto.deviceId}`);
    if (filterDto.eventType) parts.push(`event:${filterDto.eventType}`);
    if (filterDto.platform) parts.push(`platform:${filterDto.platform}`);

    parts.push(`p:${filterDto.page || 1}`);
    parts.push(`l:${filterDto.limit || 10}`);

    return parts.join(':');
  }

  private buildSessionCacheKey(filterDto: DeviceSessionFilterDto): string {
    const parts = ['sessions'];

    if (filterDto.deviceId) parts.push(`device:${filterDto.deviceId}`);
    if (filterDto.platform) parts.push(`platform:${filterDto.platform}`);
    if (filterDto.isActive !== undefined)
      parts.push(`active:${filterDto.isActive}`);

    parts.push(`p:${filterDto.page || 1}`);
    parts.push(`l:${filterDto.limit || 10}`);

    return parts.join(':');
  }

  private async invalidateTelemetryCache(): Promise<void> {
    const keysToDelete = ['analytics:summary:daily', 'telemetry:*'];

    await Promise.all(keysToDelete.map((key) => this.cacheManager.del(key)));
  }

  private async invalidateSessionCache(): Promise<void> {
    const keysToDelete = ['analytics:summary:daily', 'sessions:*'];

    await Promise.all(keysToDelete.map((key) => this.cacheManager.del(key)));
  }
}
