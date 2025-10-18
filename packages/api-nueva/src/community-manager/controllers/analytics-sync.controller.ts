import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetLateAnalyticsSyncService } from '../services/getlate-analytics-sync.service';

/**
 * 📊 Analytics Sync Controller
 *
 * FASE 8: Endpoints para sincronización manual de métricas desde GetLate
 *
 * Endpoints:
 * - POST /sync/:postId - Sincroniza métricas de un post específico
 * - POST /sync/batch - Sincroniza múltiples posts con filtros
 * - GET /sync/stats - Obtiene estadísticas de sincronización
 * - POST /sync/test/:platform - Prueba conexión con GetLate API
 *
 * Nota: La sincronización automática corre cada 30 minutos,
 * estos endpoints son para sincronización manual on-demand
 */
@Controller('community-manager/analytics-sync')
@UseGuards(JwtAuthGuard)
export class AnalyticsSyncController {
  constructor(
    private readonly syncService: GetLateAnalyticsSyncService,
  ) {}

  /**
   * 🔄 Sincroniza métricas de un post específico
   *
   * POST /community-manager/analytics-sync/:postId
   */
  @Post(':postId')
  @HttpCode(HttpStatus.OK)
  async syncPost(@Param('postId') postId: string) {
    const post = await this.syncService.syncPostMetrics(postId);

    return {
      success: true,
      message: 'Métricas sincronizadas exitosamente',
      data: {
        postId: String(post._id),
        platform: post.platform,
        engagement: post.engagement,
        syncedAt: post.engagement?.lastUpdated,
      },
    };
  }

  /**
   * 🔄 Sincroniza múltiples posts con filtros
   *
   * POST /community-manager/analytics-sync/batch
   * Query params:
   * - platform: facebook | twitter (opcional)
   * - hoursBack: número de horas hacia atrás (default: 24)
   * - limit: máximo de posts (default: 50)
   */
  @Post('batch/sync')
  @HttpCode(HttpStatus.OK)
  async syncBatch(
    @Query('platform') platform?: 'facebook' | 'twitter',
    @Query('hoursBack') hoursBack?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.syncService.syncMultiplePosts({
      platform,
      hoursBack: hoursBack ? parseInt(hoursBack) : 24,
      limit: limit ? parseInt(limit) : 50,
    });

    return {
      success: true,
      message: `Sincronización completada: ${result.synced} exitosos, ${result.failed} fallidos`,
      data: result,
    };
  }

  /**
   * 📊 Obtiene estadísticas de sincronización
   *
   * GET /community-manager/analytics-sync/stats
   */
  @Get('stats')
  async getStats() {
    const stats = await this.syncService.getSyncStats();

    return {
      success: true,
      data: stats,
    };
  }

  /**
   * 🧪 Prueba conexión con GetLate API
   *
   * POST /community-manager/analytics-sync/test/:platform
   */
  @Post('test/:platform')
  @HttpCode(HttpStatus.OK)
  async testConnection(
    @Param('platform') platform: 'facebook' | 'twitter',
  ) {
    const result = await this.syncService.testConnection(platform);

    return {
      success: result.success,
      message: result.message,
      data: result.accountInfo,
    };
  }
}
