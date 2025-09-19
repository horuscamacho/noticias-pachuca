import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  ValidationPipe,
  UseInterceptors,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL, CacheKey } from '@nestjs/cache-manager';
import { AnalyticsService } from './analytics.service';
import { BatchTelemetryDto, DeviceSessionDto } from './dto/telemetry.dto';
import {
  TelemetryFilterDto,
  DeviceSessionFilterDto,
} from './dto/analytics-filter.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // 📊 TELEMETRY ENDPOINTS

  @Post('telemetry')
  @HttpCode(HttpStatus.CREATED)
  async storeTelemetryBatch(
    @Body(ValidationPipe) batchDto: BatchTelemetryDto,
  ): Promise<{ success: boolean; processed: number }> {
    return this.analyticsService.storeTelemetryBatch(batchDto);
  }

  @Get('telemetry')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000) // 5 minutes
  async getTelemetryData(@Query(ValidationPipe) filterDto: TelemetryFilterDto) {
    return this.analyticsService.getTelemetryData(filterDto);
  }

  // 📱 DEVICE SESSION ENDPOINTS

  @Post('session')
  @HttpCode(HttpStatus.CREATED)
  async createOrUpdateDeviceSession(
    @Body(ValidationPipe) sessionDto: DeviceSessionDto,
  ) {
    return this.analyticsService.createOrUpdateDeviceSession(sessionDto);
  }

  @Post('session/:sessionId/end')
  @HttpCode(HttpStatus.OK)
  async endDeviceSession(
    @Param('sessionId') sessionId: string,
  ): Promise<{ success: boolean }> {
    return this.analyticsService.endDeviceSession(sessionId);
  }

  @Get('sessions')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600000) // 10 minutes
  async getDeviceSessions(
    @Query(ValidationPipe) filterDto: DeviceSessionFilterDto,
  ) {
    return this.analyticsService.getDeviceSessions(filterDto);
  }

  // 📈 ANALYTICS ENDPOINTS

  @Get('summary')
  @UseInterceptors(CacheInterceptor)
  @CacheKey('analytics_summary')
  @CacheTTL(3600000) // 1 hour
  async getAnalyticsSummary() {
    return this.analyticsService.getAnalyticsSummary();
  }

  // 🏥 HEALTH CHECK

  @Get('health')
  @HttpCode(HttpStatus.OK)
  async healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'analytics',
    };
  }
}
