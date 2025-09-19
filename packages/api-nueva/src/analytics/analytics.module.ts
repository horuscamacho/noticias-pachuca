import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { PaginationService } from '../common/services/pagination.service';
import { Telemetry, TelemetrySchema } from './schemas/telemetry.schema';
import {
  DeviceSession,
  DeviceSessionSchema,
} from './schemas/device-session.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Telemetry.name, schema: TelemetrySchema },
      { name: DeviceSession.name, schema: DeviceSessionSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, PaginationService],
  exports: [AnalyticsService, PaginationService],
})
export class AnalyticsModule {}
