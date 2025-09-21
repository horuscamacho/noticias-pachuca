import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { FacebookModule } from '../facebook/facebook.module';
import { PaginationService } from '../common/services/pagination.service';
import { CacheService } from '../services/cache.service';
import { AppConfigService } from '../config/config.service';

import {
  MonitoredFacebookPage,
  MonitoredFacebookPageSchema
} from './schemas/monitored-facebook-page.schema';
import {
  FacebookExtractionJob,
  FacebookExtractionJobSchema
} from './schemas/facebook-extraction-job.schema';
import {
  ExtractedFacebookPost,
  ExtractedFacebookPostSchema
} from './schemas/extracted-facebook-post.schema';
import {
  FacebookApiUsageMetrics,
  FacebookApiUsageMetricsSchema
} from './schemas/facebook-api-usage-metrics.schema';

import { FacebookPageManagementService } from './services/facebook-page-management.service';
import { FacebookExtractionService } from './services/facebook-extraction.service';
import { FacebookMetricsService } from './services/facebook-metrics.service';
import { FacebookExtractionQueueService } from './services/facebook-extraction-queue.service';

import { FacebookPagesController } from './controllers/facebook-pages.controller';
import { FacebookExtractionController } from './controllers/facebook-extraction.controller';
import { FacebookMetricsController } from './controllers/facebook-metrics.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MonitoredFacebookPage.name, schema: MonitoredFacebookPageSchema },
      { name: FacebookExtractionJob.name, schema: FacebookExtractionJobSchema },
      { name: ExtractedFacebookPost.name, schema: ExtractedFacebookPostSchema },
      { name: FacebookApiUsageMetrics.name, schema: FacebookApiUsageMetricsSchema },
    ]),
    BullModule.registerQueue({
      name: 'facebook-extraction',
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 100,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    }),
    EventEmitterModule,
    FacebookModule,
  ],
  controllers: [
    FacebookPagesController,
    FacebookExtractionController,
    FacebookMetricsController,
  ],
  providers: [
    PaginationService,
    AppConfigService,
    CacheService,
    FacebookPageManagementService,
    FacebookExtractionService,
    FacebookMetricsService,
    FacebookExtractionQueueService,
  ],
  exports: [
    FacebookPageManagementService,
    FacebookExtractionService,
    FacebookMetricsService,
    FacebookExtractionQueueService,
  ],
})
export class ContentExtractionFacebookModule {}