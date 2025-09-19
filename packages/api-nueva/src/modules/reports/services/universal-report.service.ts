/**
 * 🌐 UNIVERSAL REPORT SERVICE
 * Servicio principal que coordina todo el sistema de reportes
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  ReportConfig,
  ReportJobData,
  ReportJobResponse,
  ReportJobStatusInfo,
  ReportResult,
  ReportMetrics,
  HealthStatus,
} from '../types/report.types';
import { ReportFormat, ReportJobStatus } from '../enums';
import { ReportFactoryService } from './report-factory.service';
import { DataRepositoryService, QueryOptions } from './data-repository.service';

@Injectable()
export class UniversalReportService {
  private readonly logger = new Logger(UniversalReportService.name);

  constructor(
    @InjectQueue('reports') private readonly reportQueue: Queue,
    private readonly reportFactory: ReportFactoryService,
    private readonly dataRepository: DataRepositoryService,
  ) {}

  /**
   * 🚀 Generar reporte de forma asíncrona (método principal)
   */
  async generateReport(
    format: ReportFormat,
    config: ReportConfig,
    requestedBy?: string,
    priority: number = 0,
  ): Promise<ReportJobResponse> {
    this.logger.log(`Generating ${format} report: ${config.title}`);

    try {
      // 1. Validar formato soportado
      if (!this.reportFactory.isFormatSupported(format)) {
        throw new BadRequestException(`Unsupported format: ${format}`);
      }

      // 2. Validar configuración
      const validation = this.reportFactory.validateConfig(format, config);
      if (!validation.isValid) {
        throw new BadRequestException(
          `Invalid config: ${validation.errors.join(', ')}`,
        );
      }

      // 3. Verificar que la colección existe
      const collections = await this.dataRepository.listCollections();
      if (!collections.includes(config.collection)) {
        throw new BadRequestException(
          `Collection '${config.collection}' does not exist`,
        );
      }

      // 4. Estimar tiempo de generación
      const stats = await this.dataRepository.getCollectionStats(
        config.collection,
      );
      const estimatedTime = this.reportFactory.estimateGenerationTime(
        format,
        stats.count,
      );

      // 5. Crear job de reporte
      const jobData = this.reportFactory.createReportJob(
        format,
        config,
        requestedBy,
        priority,
      );

      // 6. Agregar a cola de procesamiento
      const job = await this.reportQueue.add('generate-report', jobData, {
        priority: priority,
        delay: 0,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });

      // 7. Obtener posición en cola
      const queueInfo = await this.getQueueInfo();

      return {
        jobId: jobData.jobId,
        status: ReportJobStatus.QUEUED,
        estimatedTime,
        queuePosition: queueInfo.waiting + 1,
        message: `Report queued successfully. Estimated generation time: ${Math.round(estimatedTime / 1000)}s`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate report: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 🎯 Generar reporte de forma síncrona (para reportes pequeños)
   */
  async generateReportSync(
    format: ReportFormat,
    config: ReportConfig,
    maxRecords: number = 1000,
  ): Promise<{ buffer: Buffer; metadata: any }> {
    this.logger.log(
      `Generating ${format} report synchronously: ${config.title}`,
    );

    try {
      // 1. Validaciones
      if (!this.reportFactory.isFormatSupported(format)) {
        throw new BadRequestException(`Unsupported format: ${format}`);
      }

      const validation = this.reportFactory.validateConfig(format, config);
      if (!validation.isValid) {
        throw new BadRequestException(
          `Invalid config: ${validation.errors.join(', ')}`,
        );
      }

      // 2. Verificar límite de registros
      const stats = await this.dataRepository.getCollectionStats(
        config.collection,
      );
      if (stats.count > maxRecords) {
        throw new BadRequestException(
          `Collection has ${stats.count} records. Use async generation for collections > ${maxRecords} records.`,
        );
      }

      // 3. Obtener datos
      const queryOptions: QueryOptions = {
        filters: config.filters,
        sorting: config.sorting,
        pagination: config.pagination,
      };

      const queryResult = await this.dataRepository.query(
        config.collection,
        queryOptions,
      );

      // 4. Generar reporte
      const buffer = await this.reportFactory.generateReport(
        format,
        config,
        queryResult.data,
      );

      // 5. Preparar metadata
      const metadata = {
        format,
        title: config.title,
        collection: config.collection,
        recordCount: queryResult.data.length,
        totalRecords: queryResult.total,
        generatedAt: new Date(),
        fileSize: buffer.length,
      };

      this.logger.log(
        `Sync report generated successfully: ${buffer.length} bytes`,
      );

      return { buffer, metadata };
    } catch (error) {
      this.logger.error(
        `Sync report generation failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 📊 Obtener estado de job de reporte
   */
  async getJobStatus(jobId: string): Promise<ReportJobStatusInfo> {
    try {
      const job = await this.reportQueue.getJob(jobId);

      if (!job) {
        throw new BadRequestException(`Job ${jobId} not found`);
      }

      const status = await this.mapJobStatus(job);

      return {
        jobId,
        status,
        progress: job.progress(),
        createdAt: new Date(job.timestamp),
        processedAt: job.processedOn ? new Date(job.processedOn) : undefined,
        finishedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
        failedReason: job.failedReason,
        result: job.returnvalue ? job.returnvalue : undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to get job status: ${error.message}`);
      throw error;
    }
  }

  /**
   * ❌ Cancelar job de reporte
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const job = await this.reportQueue.getJob(jobId);

      if (!job) {
        throw new BadRequestException(`Job ${jobId} not found`);
      }

      const currentStatus = await this.mapJobStatus(job);

      if (
        currentStatus === ReportJobStatus.COMPLETED ||
        currentStatus === ReportJobStatus.FAILED
      ) {
        throw new BadRequestException(
          `Cannot cancel job in status: ${currentStatus}`,
        );
      }

      await job.remove();
      this.logger.log(`Job ${jobId} cancelled successfully`);

      return true;
    } catch (error) {
      this.logger.error(`Failed to cancel job: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📋 Listar jobs activos
   */
  async listActiveJobs(limit: number = 50): Promise<ReportJobStatusInfo[]> {
    try {
      const jobs = await this.reportQueue.getJobs(
        ['waiting', 'active', 'completed', 'failed'],
        0,
        limit - 1,
      );

      const jobInfos = await Promise.all(
        jobs.map(async (job) => {
          const status = await this.mapJobStatus(job);
          return {
            jobId: job.id.toString(),
            status,
            progress: job.progress(),
            createdAt: new Date(job.timestamp),
            processedAt: job.processedOn
              ? new Date(job.processedOn)
              : undefined,
            finishedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
            failedReason: job.failedReason,
            result: job.returnvalue,
          };
        }),
      );

      return jobInfos.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
    } catch (error) {
      this.logger.error(`Failed to list active jobs: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📊 Obtener métricas del sistema
   */
  async getMetrics(): Promise<ReportMetrics> {
    try {
      const queueInfo = await this.getQueueInfo();
      const jobs = await this.reportQueue.getJobs(
        ['completed', 'failed'],
        0,
        999,
      );

      // Calcular métricas de generación
      const completedJobs = jobs.filter((job) => job.finishedOn);
      const failedJobs = jobs.filter((job) => job.failedReason);

      const totalReports = completedJobs.length;
      const averageTime =
        totalReports > 0
          ? completedJobs.reduce(
              (sum, job) => sum + (job.finishedOn! - job.processedOn!),
              0,
            ) / totalReports
          : 0;

      const failureRate =
        totalReports > 0
          ? (failedJobs.length / (totalReports + failedJobs.length)) * 100
          : 0;

      // Distribución de formatos
      const formatDistribution: Record<ReportFormat, number> = {
        [ReportFormat.PDF]: 0,
        [ReportFormat.EXCEL]: 0,
      };

      completedJobs.forEach((job) => {
        if (job.data?.format) {
          formatDistribution[job.data.format] =
            (formatDistribution[job.data.format] || 0) + 1;
        }
      });

      return {
        generation: {
          totalReports,
          averageTime,
          failureRate,
          formatDistribution,
        },
        performance: {
          memoryUsage: process.memoryUsage().heapUsed,
          concurrentJobs: queueInfo.active,
          queueSize: queueInfo.waiting,
          cacheHitRate: 0, // TODO: Implementar cuando se agregue cache
        },
        usage: {
          popularCollections: [], // TODO: Implementar analytics
          averageRecordCount: 0, // TODO: Calcular desde jobs completados
          peakHours: [], // TODO: Implementar analytics
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get metrics: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🏥 Verificar salud del sistema
   */
  async getHealthStatus(): Promise<HealthStatus> {
    try {
      const queueInfo = await this.getQueueInfo();
      const metrics = await this.getMetrics();

      // Determinar estado de salud
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

      if (
        queueInfo.waiting > 50 ||
        metrics.performance.memoryUsage > 500 * 1024 * 1024
      ) {
        status = 'degraded';
      }

      if (queueInfo.waiting > 100 || metrics.generation.failureRate > 50) {
        status = 'unhealthy';
      }

      return {
        status,
        metrics: {
          queueSize: queueInfo.waiting,
          cacheHitRate: metrics.performance.cacheHitRate,
          averageResponseTime: metrics.generation.averageTime,
          errorRate: metrics.generation.failureRate,
        },
        timestamp: new Date(),
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
      };
    }
  }

  /**
   * 🔧 MÉTODOS PRIVADOS
   */

  /**
   * 🔄 Mapear estado de Bull Job a ReportJobStatus
   */
  private async mapJobStatus(job: any): Promise<ReportJobStatus> {
    const state = await job.getState();

    switch (state) {
      case 'waiting':
      case 'delayed':
        return ReportJobStatus.QUEUED;
      case 'active':
        return ReportJobStatus.PROCESSING;
      case 'completed':
        return ReportJobStatus.COMPLETED;
      case 'failed':
        return ReportJobStatus.FAILED;
      default:
        return ReportJobStatus.QUEUED;
    }
  }

  /**
   * 📊 Obtener información de la cola
   */
  private async getQueueInfo(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    const waiting = await this.reportQueue.getWaiting();
    const active = await this.reportQueue.getActive();
    const completed = await this.reportQueue.getCompleted();
    const failed = await this.reportQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }
}
