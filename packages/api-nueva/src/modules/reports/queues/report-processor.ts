/**
 * ⚡ REPORT PROCESSOR
 * Bull Queue Processor para generación asíncrona de reportes
 */

import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import {
  ReportJobData,
  ReportResult,
  ReportJobStatusInfo,
} from '../types/report.types';
import { ReportJobStatus } from '../enums';
import { ReportFactoryService } from '../services/report-factory.service';
import {
  DataRepositoryService,
  QueryOptions,
} from '../services/data-repository.service';

@Processor('reports')
export class ReportProcessor {
  private readonly logger = new Logger(ReportProcessor.name);

  constructor(
    private readonly reportFactory: ReportFactoryService,
    private readonly dataRepository: DataRepositoryService,
  ) {}

  /**
   * 🎯 Procesar job de generación de reporte
   */
  @Process('generate-report')
  async handleReportGeneration(job: Job<ReportJobData>): Promise<ReportResult> {
    const { jobId, format, config, requestedBy } = job.data;
    const startTime = Date.now();

    this.logger.log(
      `Processing report job ${jobId}: ${format} - ${config.title}`,
    );

    try {
      // 1. Actualizar progreso: Iniciando
      await job.progress(10);
      await this.updateJobStatus(
        job,
        ReportJobStatus.PROCESSING,
        'Iniciando generación...',
      );

      // 2. Validar configuración
      const validation = this.reportFactory.validateConfig(format, config);
      if (!validation.isValid) {
        throw new Error(`Invalid config: ${validation.errors.join(', ')}`);
      }

      await job.progress(20);
      await this.updateJobStatus(
        job,
        ReportJobStatus.PROCESSING,
        'Configuración validada',
      );

      // 3. Consultar datos de la base de datos
      const queryOptions: QueryOptions = {
        filters: config.filters,
        sorting: config.sorting,
        pagination: config.pagination,
      };

      this.logger.log(`Querying collection: ${config.collection}`);
      const queryResult = await this.dataRepository.query(
        config.collection,
        queryOptions,
      );

      await job.progress(50);
      await this.updateJobStatus(
        job,
        ReportJobStatus.PROCESSING,
        `Datos obtenidos: ${queryResult.data.length}/${queryResult.total} registros`,
      );

      // 4. Verificar si hay datos
      if (queryResult.data.length === 0) {
        this.logger.warn(`No data found for collection: ${config.collection}`);
        // Continuar con reporte vacío
      }

      // 5. Generar reporte usando strategy apropiado
      this.logger.log(
        `Generating ${format} report with ${queryResult.data.length} records`,
      );
      const buffer = await this.reportFactory.generateReport(
        format,
        config,
        queryResult.data,
      );

      await job.progress(90);
      await this.updateJobStatus(
        job,
        ReportJobStatus.PROCESSING,
        'Reporte generado, finalizando...',
      );

      // 6. Calcular tiempo de procesamiento
      const processingTime = Date.now() - startTime;

      // 7. Crear resultado exitoso
      const result: ReportResult = {
        jobId,
        status: ReportJobStatus.COMPLETED,
        format,
        fileSize: buffer.length,
        recordCount: queryResult.data.length,
        downloadUrl: this.generateDownloadUrl(jobId, format),
        expiresAt: this.calculateExpirationDate(),
        generatedAt: new Date(),
        processingTime,
      };

      // 8. Simular guardado del archivo (en implementación real, guardar en storage)
      await this.saveReportFile(jobId, format, buffer);

      await job.progress(100);
      this.logger.log(
        `Report job ${jobId} completed successfully in ${processingTime}ms`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Report job ${jobId} failed: ${error.message}`,
        error.stack,
      );

      // Crear resultado fallido
      const result: ReportResult = {
        jobId,
        status: ReportJobStatus.FAILED,
        format,
        generatedAt: new Date(),
        processingTime: Date.now() - startTime,
        error: error.message,
      };

      throw error; // Re-throw para que Bull marque el job como fallido
    }
  }

  /**
   * 📊 Event listener: Job completado
   */
  @Process('job-completed')
  async onJobCompleted(job: Job<ReportJobData>): Promise<void> {
    const { jobId, config, requestedBy } = job.data;
    this.logger.log(`Report job completed: ${jobId} - ${config.title}`);

    // Aquí se pueden agregar notificaciones, analytics, etc.
    if (requestedBy) {
      await this.sendCompletionNotification(requestedBy, jobId, config.title);
    }
  }

  /**
   * ❌ Event listener: Job fallido
   */
  @Process('job-failed')
  async onJobFailed(job: Job<ReportJobData>, error: Error): Promise<void> {
    const { jobId, config, requestedBy } = job.data;
    this.logger.error(
      `Report job failed: ${jobId} - ${config.title}`,
      error.stack,
    );

    // Notificar fallo si es necesario
    if (requestedBy) {
      await this.sendFailureNotification(
        requestedBy,
        jobId,
        config.title,
        error.message,
      );
    }
  }

  /**
   * 🔄 Event listener: Job con progreso
   */
  @Process('job-progress')
  async onJobProgress(
    job: Job<ReportJobData>,
    progress: number,
  ): Promise<void> {
    const { jobId, config } = job.data;
    this.logger.debug(
      `Report job progress: ${jobId} - ${progress}% - ${config.title}`,
    );

    // Enviar actualizaciones de progreso en tiempo real si es necesario
    // await this.sendProgressUpdate(jobId, progress);
  }

  /**
   * 🔧 MÉTODOS PRIVADOS
   */

  /**
   * 📊 Actualizar estado del job
   */
  private async updateJobStatus(
    job: Job,
    status: ReportJobStatus,
    message?: string,
  ): Promise<void> {
    try {
      // Almacenar metadata adicional en el job
      await job.update({
        ...job.data,
        currentStatus: status,
        statusMessage: message,
        lastUpdated: new Date(),
      });

      this.logger.debug(
        `Job ${job.data.jobId} status updated: ${status} - ${message}`,
      );
    } catch (error) {
      this.logger.warn(`Failed to update job status: ${error.message}`);
    }
  }

  /**
   * 🔗 Generar URL de descarga
   */
  private generateDownloadUrl(jobId: string, format: string): string {
    // En implementación real, esto sería una URL signed o protegida
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/api/reports/download/${jobId}.${format.toLowerCase()}`;
  }

  /**
   * ⏰ Calcular fecha de expiración
   */
  private calculateExpirationDate(): Date {
    const expirationHours = parseInt(
      process.env.REPORT_EXPIRATION_HOURS || '24',
      10,
    );
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);
    return expiresAt;
  }

  /**
   * 💾 Guardar archivo del reporte
   */
  private async saveReportFile(
    jobId: string,
    format: string,
    buffer: Buffer,
  ): Promise<void> {
    try {
      // En implementación real, guardar en:
      // - Sistema de archivos local
      // - S3, Google Cloud Storage, Azure Blob
      // - Base de datos (para archivos pequeños)

      const fileName = `${jobId}.${format.toLowerCase()}`;

      // Simulación de guardado
      this.logger.debug(
        `Saving report file: ${fileName} (${buffer.length} bytes)`,
      );

      // TODO: Implementar storage real
      // await this.storageService.save(fileName, buffer);
    } catch (error) {
      this.logger.error(`Failed to save report file: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📧 Enviar notificación de completado
   */
  private async sendCompletionNotification(
    userId: string,
    jobId: string,
    reportTitle: string,
  ): Promise<void> {
    try {
      // En implementación real, enviar:
      // - Email
      // - Push notification
      // - WebSocket event
      // - Sistema de notificaciones interno

      this.logger.log(
        `Sending completion notification to user ${userId} for job ${jobId}`,
      );

      // TODO: Implementar sistema de notificaciones
      // await this.notificationService.sendReportCompleted(userId, jobId, reportTitle);
    } catch (error) {
      this.logger.warn(
        `Failed to send completion notification: ${error.message}`,
      );
    }
  }

  /**
   * ⚠️ Enviar notificación de fallo
   */
  private async sendFailureNotification(
    userId: string,
    jobId: string,
    reportTitle: string,
    errorMessage: string,
  ): Promise<void> {
    try {
      this.logger.log(
        `Sending failure notification to user ${userId} for job ${jobId}`,
      );

      // TODO: Implementar sistema de notificaciones
      // await this.notificationService.sendReportFailed(userId, jobId, reportTitle, errorMessage);
    } catch (error) {
      this.logger.warn(`Failed to send failure notification: ${error.message}`);
    }
  }

  /**
   * 📊 Enviar actualización de progreso
   */
  private async sendProgressUpdate(
    jobId: string,
    progress: number,
  ): Promise<void> {
    try {
      // En implementación real, enviar via WebSocket o Server-Sent Events
      // await this.websocketService.sendProgressUpdate(jobId, progress);
    } catch (error) {
      this.logger.warn(`Failed to send progress update: ${error.message}`);
    }
  }
}
