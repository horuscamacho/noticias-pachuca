/**
 * ⚙️ REPORTS ADMIN CONTROLLER
 * Controlador de administración para métricas, salud y gestión de jobs
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Logger,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UniversalReportService } from '../services/universal-report.service';
import { DataRepositoryService } from '../services/data-repository.service';
import { PuppeteerManagerService } from '../services/puppeteer-manager.service';
import {
  ReportMetrics,
  HealthStatus,
  ReportJobStatusInfo,
} from '../types/report.types';
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'; // Descomentar cuando esté disponible

@ApiTags('Reports Admin')
@Controller('reports/admin')
// @UseGuards(JwtAuthGuard) // Descomentar para proteger endpoints
// @ApiBearerAuth() // Descomentar para documentar autenticación
export class ReportsAdminController {
  private readonly logger = new Logger(ReportsAdminController.name);

  constructor(
    private readonly universalReportService: UniversalReportService,
    private readonly dataRepository: DataRepositoryService,
    private readonly puppeteerManager: PuppeteerManagerService,
  ) {}

  /**
   * 📊 Obtener métricas del sistema de reportes
   */
  @Get('metrics')
  @ApiOperation({
    summary: 'Obtener métricas del sistema de reportes',
    description: 'Devuelve estadísticas completas sobre generación, performance y uso',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas obtenidas exitosamente',
    schema: {
      example: {
        generation: {
          totalReports: 156,
          averageTime: 4500,
          failureRate: 2.5,
          formatDistribution: { pdf: 89, excel: 67 },
        },
        performance: {
          memoryUsage: 128000000,
          concurrentJobs: 2,
          queueSize: 5,
          cacheHitRate: 85.2,
        },
        usage: {
          popularCollections: ['users', 'orders', 'products'],
          averageRecordCount: 1250,
          peakHours: [9, 10, 14, 16],
        },
      },
    },
  })
  async getMetrics(): Promise<ReportMetrics> {
    try {
      return await this.universalReportService.getMetrics();
    } catch (error) {
      this.logger.error(`Failed to get metrics: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🏥 Verificar salud del sistema
   */
  @Get('health')
  @ApiOperation({
    summary: 'Verificar salud del sistema de reportes',
    description: 'Revisa el estado de todos los componentes del sistema',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de salud obtenido',
    schema: {
      example: {
        status: 'healthy',
        metrics: {
          queueSize: 3,
          cacheHitRate: 85.2,
          averageResponseTime: 4500,
          errorRate: 2.1,
        },
        timestamp: '2025-01-15T10:30:00.000Z',
        components: {
          database: 'healthy',
          redis: 'healthy',
          puppeteer: 'healthy',
          queue: 'healthy',
        },
      },
    },
  })
  async getHealthStatus(): Promise<{
    status: string;
    metrics: any;
    timestamp: Date;
    components: any;
  }> {
    try {
      const [
        systemHealth,
        puppeteerMetrics,
        collections,
      ] = await Promise.all([
        this.universalReportService.getHealthStatus(),
        this.puppeteerManager.getBrowserMetrics(),
        this.dataRepository.listCollections().catch(() => []),
      ]);

      return {
        ...systemHealth,
        components: {
          database: collections.length > 0 ? 'healthy' : 'degraded',
          redis: systemHealth.metrics.queueSize >= 0 ? 'healthy' : 'unhealthy',
          puppeteer: puppeteerMetrics.isReady ? 'healthy' : 'degraded',
          queue: systemHealth.metrics.queueSize < 50 ? 'healthy' : 'degraded',
        },
      };
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
      return {
        status: 'unhealthy',
        metrics: {
          queueSize: -1,
          cacheHitRate: 0,
          averageResponseTime: -1,
          errorRate: 100,
        },
        timestamp: new Date(),
        components: {
          database: 'unknown',
          redis: 'unknown',
          puppeteer: 'unknown',
          queue: 'unknown',
        },
      };
    }
  }

  /**
   * 📋 Listar todos los jobs activos
   */
  @Get('jobs')
  @ApiOperation({
    summary: 'Listar jobs de reportes',
    description: 'Obtiene todos los jobs activos, completados y fallidos',
  })
  @ApiQuery({ name: 'limit', description: 'Número máximo de jobs', required: false })
  @ApiQuery({ name: 'status', description: 'Filtrar por estado', required: false })
  async listJobs(
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ): Promise<{
    jobs: ReportJobStatusInfo[];
    total: number;
    summary: { [key: string]: number };
  }> {
    try {
      const maxLimit = Math.min(limit || 50, 200);
      const jobs = await this.universalReportService.listActiveJobs(maxLimit);

      // Filtrar por estado si se especifica
      const filteredJobs = status
        ? jobs.filter(job => job.status === status)
        : jobs;

      // Crear resumen por estado
      const summary = jobs.reduce((acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      return {
        jobs: filteredJobs,
        total: filteredJobs.length,
        summary,
      };
    } catch (error) {
      this.logger.error(`Failed to list jobs: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🗑️ Limpiar jobs completados
   */
  @Delete('jobs/cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Limpiar jobs completados',
    description: 'Elimina jobs completados y fallidos antiguos',
  })
  @ApiQuery({ name: 'olderThan', description: 'Eliminar jobs más antiguos que X horas', required: false })
  async cleanupJobs(
    @Query('olderThan') olderThan?: number,
  ): Promise<{ cleaned: number; message: string }> {
    try {
      const hoursThreshold = olderThan || 24;
      this.logger.log(`Cleaning up jobs older than ${hoursThreshold} hours`);

      // TODO: Implementar limpieza real cuando sea necesario
      // Por ahora devolver simulación
      const cleaned = 0;

      return {
        cleaned,
        message: `Cleaned ${cleaned} jobs older than ${hoursThreshold} hours`,
      };
    } catch (error) {
      this.logger.error(`Failed to cleanup jobs: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🔄 Reiniciar Puppeteer
   */
  @Post('puppeteer/restart')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reiniciar Puppeteer',
    description: 'Reinicia el browser de Puppeteer en caso de problemas',
  })
  async restartPuppeteer(): Promise<{ success: boolean; message: string }> {
    try {
      await this.puppeteerManager.restartBrowser();
      return {
        success: true,
        message: 'Puppeteer browser restarted successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to restart Puppeteer: ${error.message}`);
      return {
        success: false,
        message: `Failed to restart Puppeteer: ${error.message}`,
      };
    }
  }

  /**
   * 📊 Métricas de Puppeteer
   */
  @Get('puppeteer/metrics')
  @ApiOperation({
    summary: 'Obtener métricas de Puppeteer',
    description: 'Estado y métricas del browser Puppeteer',
  })
  async getPuppeteerMetrics(): Promise<any> {
    try {
      return await this.puppeteerManager.getBrowserMetrics();
    } catch (error) {
      this.logger.error(`Failed to get Puppeteer metrics: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📋 Información de colecciones disponibles
   */
  @Get('collections')
  @ApiOperation({
    summary: 'Listar colecciones con estadísticas',
    description: 'Obtiene todas las colecciones MongoDB con sus estadísticas',
  })
  async getCollectionsInfo(): Promise<{
    collections: Array<{
      name: string;
      count: number;
      size: number;
      avgObjSize: number;
      indexes: number;
    }>;
    total: number;
  }> {
    try {
      const collections = await this.dataRepository.listCollections();

      const collectionsInfo = await Promise.all(
        collections.map(async (name) => {
          try {
            const stats = await this.dataRepository.getCollectionStats(name);
            return { name, ...stats };
          } catch (error) {
            this.logger.warn(`Failed to get stats for collection ${name}: ${error.message}`);
            return {
              name,
              count: 0,
              size: 0,
              avgObjSize: 0,
              indexes: 0,
            };
          }
        })
      );

      return {
        collections: collectionsInfo.sort((a, b) => b.count - a.count),
        total: collections.length,
      };
    } catch (error) {
      this.logger.error(`Failed to get collections info: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🔍 Análisis de esquema de colección
   */
  @Get('collections/:collection/analyze')
  @ApiOperation({
    summary: 'Analizar esquema de colección',
    description: 'Análisis detallado de estructura y tipos de datos',
  })
  @ApiParam({ name: 'collection', description: 'Nombre de la colección' })
  @ApiQuery({ name: 'sampleSize', description: 'Tamaño de muestra para análisis', required: false })
  async analyzeCollection(
    @Param('collection') collection: string,
    @Query('sampleSize') sampleSize?: number,
  ): Promise<{
    collection: string;
    stats: any;
    schema: any;
    recommendations: string[];
  }> {
    try {
      const sample = Math.min(sampleSize || 100, 1000);

      const [stats, schema] = await Promise.all([
        this.dataRepository.getCollectionStats(collection),
        this.dataRepository.getCollectionSchema(collection, sample),
      ]);

      // Generar recomendaciones básicas
      const recommendations: string[] = [];

      if (stats.count > 10000) {
        recommendations.push('Consider using async generation for large datasets');
      }

      if (Object.keys(schema).length > 20) {
        recommendations.push('Too many fields detected, consider field selection for better performance');
      }

      if (stats.count === 0) {
        recommendations.push('Collection is empty - no reports can be generated');
      }

      return {
        collection,
        stats,
        schema,
        recommendations,
      };
    } catch (error) {
      this.logger.error(`Failed to analyze collection ${collection}: ${error.message}`);
      throw new NotFoundException(`Collection ${collection} not found or analysis failed`);
    }
  }

  /**
   * 🧪 Testing del sistema
   */
  @Get('test')
  @ApiOperation({
    summary: 'Test básico del sistema',
    description: 'Ejecuta pruebas básicas de funcionalidad',
  })
  async testSystem(): Promise<{
    success: boolean;
    timestamp: Date;
    tests: Array<{ name: string; status: 'pass' | 'fail'; message: string }>;
    summary: { passed: number; failed: number; total: number };
  }> {
    const tests: Array<{ name: string; status: 'pass' | 'fail'; message: string }> = [];

    // Test 1: Verificar que los servicios estén disponibles
    try {
      const health = await this.universalReportService.getHealthStatus();
      tests.push({
        name: 'Universal Report Service',
        status: health.status === 'unhealthy' ? 'fail' : 'pass',
        message: `Status: ${health.status}`,
      });
    } catch (error) {
      tests.push({
        name: 'Universal Report Service',
        status: 'fail',
        message: error.message,
      });
    }

    // Test 2: Verificar conexión a MongoDB
    try {
      const collections = await this.dataRepository.listCollections();
      tests.push({
        name: 'MongoDB Connection',
        status: 'pass',
        message: `Connected - ${collections.length} collections available`,
      });
    } catch (error) {
      tests.push({
        name: 'MongoDB Connection',
        status: 'fail',
        message: error.message,
      });
    }

    // Test 3: Verificar Puppeteer
    try {
      const puppeteerHealth = await this.puppeteerManager.checkHealth();
      tests.push({
        name: 'Puppeteer Browser',
        status: puppeteerHealth ? 'pass' : 'fail',
        message: puppeteerHealth ? 'Browser ready' : 'Browser not ready',
      });
    } catch (error) {
      tests.push({
        name: 'Puppeteer Browser',
        status: 'fail',
        message: error.message,
      });
    }

    // Test 4: Verificar métricas
    try {
      const metrics = await this.universalReportService.getMetrics();
      tests.push({
        name: 'Metrics Collection',
        status: 'pass',
        message: `Queue size: ${metrics.performance.queueSize}`,
      });
    } catch (error) {
      tests.push({
        name: 'Metrics Collection',
        status: 'fail',
        message: error.message,
      });
    }

    const passed = tests.filter(t => t.status === 'pass').length;
    const failed = tests.filter(t => t.status === 'fail').length;
    const success = failed === 0;

    return {
      success,
      timestamp: new Date(),
      tests,
      summary: {
        passed,
        failed,
        total: tests.length,
      },
    };
  }

  /**
   * 📊 Dashboard de resumen
   */
  @Get('dashboard')
  @ApiOperation({
    summary: 'Dashboard de administración',
    description: 'Resumen completo del estado del sistema de reportes',
  })
  async getDashboard(): Promise<{
    system: any;
    activity: any;
    usage: any;
    alerts: string[];
  }> {
    try {
      const [health, metrics, jobs] = await Promise.all([
        this.getHealthStatus(),
        this.universalReportService.getMetrics(),
        this.universalReportService.listActiveJobs(10),
      ]);

      // Generar alertas basadas en métricas
      const alerts: string[] = [];

      if (health.status === 'unhealthy') {
        alerts.push('System is unhealthy - check components');
      }

      if (metrics.generation.failureRate > 10) {
        alerts.push(`High failure rate: ${metrics.generation.failureRate.toFixed(1)}%`);
      }

      if (metrics.performance.queueSize > 20) {
        alerts.push(`Large queue size: ${metrics.performance.queueSize} jobs pending`);
      }

      return {
        system: {
          status: health.status,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          components: health.components,
        },
        activity: {
          recentJobs: jobs.slice(0, 5),
          queueSize: metrics.performance.queueSize,
          concurrentJobs: metrics.performance.concurrentJobs,
        },
        usage: {
          totalReports: metrics.generation.totalReports,
          averageTime: metrics.generation.averageTime,
          formatDistribution: metrics.generation.formatDistribution,
        },
        alerts,
      };
    } catch (error) {
      this.logger.error(`Failed to get dashboard: ${error.message}`);
      throw error;
    }
  }
}