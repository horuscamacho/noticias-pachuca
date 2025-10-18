import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SmartExtractionSchedulerService } from '../services/smart-extraction-scheduler.service';
import { UrlExtractionService } from '../services/url-extraction.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UrlExtractionLog, UrlExtractionLogDocument } from '../schemas/url-extraction-log.schema';
import { ExtractedUrlTracking, ExtractedUrlTrackingDocument } from '../schemas/extracted-url-tracking.schema';

/**
 * 🔍 Extraction Management Controller
 *
 * FASE 4: Endpoints para gestión manual de extracción de URLs
 *
 * Endpoints:
 * - POST /extraction/trigger/:websiteId - Forzar extracción inmediata
 * - GET /extraction/status/:websiteId - Obtener estado de scheduling
 * - POST /extraction/pause/:websiteId - Pausar extracción automática
 * - POST /extraction/resume/:websiteId - Reanudar extracción automática
 * - POST /extraction/reschedule/:websiteId - Re-calcular y re-programar
 * - GET /extraction/logs/:websiteId - Obtener logs de extracción
 * - GET /extraction/urls/:websiteId - Obtener URLs trackeadas
 */
@Controller('generator-pro/extraction')
@UseGuards(JwtAuthGuard)
export class ExtractionManagementController {
  constructor(
    private readonly schedulerService: SmartExtractionSchedulerService,
    private readonly extractionService: UrlExtractionService,
    @InjectModel(UrlExtractionLog.name)
    private urlLogModel: Model<UrlExtractionLogDocument>,
    @InjectModel(ExtractedUrlTracking.name)
    private urlTrackingModel: Model<ExtractedUrlTrackingDocument>,
  ) {}

  /**
   * 🔥 Forzar extracción inmediata
   *
   * POST /generator-pro/extraction/trigger/:websiteId
   */
  @Post('trigger/:websiteId')
  @HttpCode(HttpStatus.OK)
  async triggerExtraction(@Param('websiteId') websiteId: string) {
    await this.schedulerService.triggerImmediateExtraction(websiteId);

    return {
      success: true,
      message: 'Extracción forzada exitosamente',
      data: {
        websiteId,
        triggeredAt: new Date(),
      },
    };
  }

  /**
   * 📊 Obtener estado de scheduling
   *
   * GET /generator-pro/extraction/status/:websiteId
   */
  @Get('status/:websiteId')
  async getStatus(@Param('websiteId') websiteId: string) {
    const status = await this.schedulerService.getSchedulingStatus(websiteId);

    return {
      success: true,
      data: status,
    };
  }

  /**
   * ⏸️ Pausar extracción automática
   *
   * POST /generator-pro/extraction/pause/:websiteId
   */
  @Post('pause/:websiteId')
  @HttpCode(HttpStatus.OK)
  async pauseExtraction(@Param('websiteId') websiteId: string) {
    await this.schedulerService.pauseWebsite(websiteId);

    return {
      success: true,
      message: 'Extracción pausada exitosamente',
      data: {
        websiteId,
        pausedAt: new Date(),
      },
    };
  }

  /**
   * ▶️ Reanudar extracción automática
   *
   * POST /generator-pro/extraction/resume/:websiteId
   */
  @Post('resume/:websiteId')
  @HttpCode(HttpStatus.OK)
  async resumeExtraction(@Param('websiteId') websiteId: string) {
    await this.schedulerService.resumeWebsite(websiteId);

    return {
      success: true,
      message: 'Extracción reanudada exitosamente',
      data: {
        websiteId,
        resumedAt: new Date(),
      },
    };
  }

  /**
   * 🔄 Re-programar extracción
   *
   * POST /generator-pro/extraction/reschedule/:websiteId
   */
  @Post('reschedule/:websiteId')
  @HttpCode(HttpStatus.OK)
  async rescheduleExtraction(@Param('websiteId') websiteId: string) {
    await this.schedulerService.rescheduleWebsite(websiteId);

    return {
      success: true,
      message: 'Extracción re-programada exitosamente',
      data: {
        websiteId,
        rescheduledAt: new Date(),
      },
    };
  }

  /**
   * 📋 Obtener logs de extracción
   *
   * GET /generator-pro/extraction/logs/:websiteId?limit=50&skip=0
   */
  @Get('logs/:websiteId')
  async getLogs(
    @Param('websiteId') websiteId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
  ) {
    const logs = await this.urlLogModel
      .find({ websiteConfigId: websiteId })
      .sort({ executedAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await this.urlLogModel.countDocuments({
      websiteConfigId: websiteId,
    });

    return {
      success: true,
      data: {
        logs,
        pagination: {
          total,
          limit,
          skip,
          hasMore: skip + limit < total,
        },
      },
    };
  }

  /**
   * 🔗 Obtener URLs trackeadas
   *
   * GET /generator-pro/extraction/urls/:websiteId?status=discovered&limit=100&skip=0
   */
  @Get('urls/:websiteId')
  async getTrackedUrls(
    @Param('websiteId') websiteId: string,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('status') status?: string,
  ) {
    const filter: Record<string, unknown> = { websiteConfigId: websiteId };

    if (status) {
      filter.status = status;
    }

    const urls = await this.urlTrackingModel
      .find(filter)
      .sort({ lastSeenAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await this.urlTrackingModel.countDocuments(filter);

    // Estadísticas por status
    const stats = await this.urlTrackingModel.aggregate([
      { $match: { websiteConfigId: websiteId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const statsByStatus: Record<string, number> = {};
    stats.forEach((stat) => {
      statsByStatus[stat._id] = stat.count;
    });

    return {
      success: true,
      data: {
        urls,
        stats: statsByStatus,
        pagination: {
          total,
          limit,
          skip,
          hasMore: skip + limit < total,
        },
      },
    };
  }

  /**
   * 📊 Obtener estadísticas generales de extracción
   *
   * GET /generator-pro/extraction/stats/:websiteId
   */
  @Get('stats/:websiteId')
  async getStats(@Param('websiteId') websiteId: string) {
    // Estadísticas de logs
    const [successCount, failedCount, lastLog] = await Promise.all([
      this.urlLogModel.countDocuments({
        websiteConfigId: websiteId,
        status: 'success',
      }),
      this.urlLogModel.countDocuments({
        websiteConfigId: websiteId,
        status: 'failed',
      }),
      this.urlLogModel
        .findOne({ websiteConfigId: websiteId })
        .sort({ executedAt: -1 })
        .lean(),
    ]);

    // Estadísticas de URLs
    const [totalUrls, newUrls, completedUrls, failedUrls] = await Promise.all([
      this.urlTrackingModel.countDocuments({ websiteConfigId: websiteId }),
      this.urlTrackingModel.countDocuments({
        websiteConfigId: websiteId,
        status: 'discovered',
      }),
      this.urlTrackingModel.countDocuments({
        websiteConfigId: websiteId,
        status: 'completed',
      }),
      this.urlTrackingModel.countDocuments({
        websiteConfigId: websiteId,
        status: 'failed',
      }),
    ]);

    // Tiempo promedio de procesamiento
    const avgProcessingTime = await this.urlLogModel.aggregate([
      {
        $match: {
          websiteConfigId: websiteId,
          status: 'success',
        },
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$processingTime' },
        },
      },
    ]);

    return {
      success: true,
      data: {
        logs: {
          totalExecutions: successCount + failedCount,
          successfulExecutions: successCount,
          failedExecutions: failedCount,
          lastExecution: lastLog?.executedAt || null,
          averageProcessingTime: avgProcessingTime[0]?.avgTime
            ? Math.round(avgProcessingTime[0].avgTime)
            : 0,
        },
        urls: {
          total: totalUrls,
          discovered: newUrls,
          completed: completedUrls,
          failed: failedUrls,
          pending: totalUrls - completedUrls - failedUrls,
        },
      },
    };
  }
}
