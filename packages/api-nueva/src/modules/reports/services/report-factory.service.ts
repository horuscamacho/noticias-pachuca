/**
 * 🏭 REPORT FACTORY SERVICE
 * Factory Pattern para crear reportes PDF/Excel de forma dinámica
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { ReportFormat, ReportJobStatus } from '../enums';
import {
  ReportConfig,
  PDFReportConfig,
  ExcelReportConfig,
  ReportJobData,
  ReportResult,
  ValidationResult,
} from '../types/report.types';
import { PDFReportStrategy } from '../strategies/pdf-report.strategy';
import { ExcelReportStrategy } from '../strategies/excel-report.strategy';
import { v4 as uuidv4 } from 'uuid';

export interface IReportStrategy {
  generate(config: ReportConfig, data: any[]): Promise<Buffer>;
  validate(config: ReportConfig): ValidationResult;
  getEstimatedTime(recordCount: number): number;
}

@Injectable()
export class ReportFactoryService {
  constructor(
    private readonly pdfStrategy: PDFReportStrategy,
    private readonly excelStrategy: ExcelReportStrategy,
  ) {}

  /**
   * 🎯 Factory Method: Crear trabajo de reporte
   */
  createReportJob(
    format: ReportFormat,
    config: ReportConfig,
    requestedBy?: string,
    priority: number = 0,
  ): ReportJobData {
    // Validar configuración
    const validation = this.validateConfig(format, config);
    if (!validation.isValid) {
      throw new BadRequestException(
        `Invalid config: ${validation.errors.join(', ')}`,
      );
    }

    const jobId = uuidv4();

    return {
      jobId,
      format,
      config,
      requestedBy,
      priority,
    };
  }

  /**
   * 🔧 Obtener strategy apropiado según formato
   */
  getStrategy(format: ReportFormat): IReportStrategy {
    switch (format) {
      case ReportFormat.PDF:
        return this.pdfStrategy;
      case ReportFormat.EXCEL:
        return this.excelStrategy;
      default:
        throw new BadRequestException(`Unsupported format: ${format}`);
    }
  }

  /**
   * ✅ Validar configuración según formato
   */
  validateConfig(format: ReportFormat, config: ReportConfig): ValidationResult {
    const strategy = this.getStrategy(format);
    return strategy.validate(config);
  }

  /**
   * ⏱️ Estimar tiempo de generación
   */
  estimateGenerationTime(format: ReportFormat, recordCount: number): number {
    const strategy = this.getStrategy(format);
    return strategy.getEstimatedTime(recordCount);
  }

  /**
   * 📊 Crear resultado inicial
   */
  createInitialResult(jobId: string, format: ReportFormat): ReportResult {
    return {
      jobId,
      status: ReportJobStatus.QUEUED,
      format,
      generatedAt: new Date(),
    };
  }

  /**
   * 🚀 Generar reporte usando strategy apropiado
   */
  async generateReport(
    format: ReportFormat,
    config: ReportConfig,
    data: any[],
  ): Promise<Buffer> {
    const strategy = this.getStrategy(format);
    return await strategy.generate(config, data);
  }

  /**
   * 📋 Obtener formatos soportados
   */
  getSupportedFormats(): ReportFormat[] {
    return Object.values(ReportFormat);
  }

  /**
   * 🔍 Verificar si el formato es soportado
   */
  isFormatSupported(format: string): format is ReportFormat {
    return Object.values(ReportFormat).includes(format as ReportFormat);
  }

  /**
   * 🎨 Crear configuración por defecto según formato
   */
  createDefaultConfig(
    format: ReportFormat,
    collection: string,
    title: string,
  ): ReportConfig {
    const baseConfig = {
      title,
      collection,
      fields: [],
    };

    switch (format) {
      case ReportFormat.PDF:
        return {
          ...baseConfig,
          format: ReportFormat.PDF,
          layout: {
            pageSize: 'A4' as const,
            orientation: 'portrait' as const,
            margins: { top: 50, right: 50, bottom: 50, left: 50 },
          },
          header: {
            show: true,
            showDate: true,
            showPageNumbers: true,
          },
          footer: {
            show: true,
            showGenerated: true,
            showPageNumbers: true,
          },
        } as PDFReportConfig;

      case ReportFormat.EXCEL:
        return {
          ...baseConfig,
          format: ReportFormat.EXCEL,
          worksheet: {
            name: 'Report',
            autoFilter: true,
            showGridLines: true,
            showHeaders: true,
          },
          styling: {
            headerStyle: {
              font: { bold: true, color: '000000' },
              fill: { type: 'pattern', pattern: 'solid', fgColor: 'E0E0E0' },
            },
            dataStyle: {
              font: { color: '000000' },
            },
          },
          formatting: {
            dateFormat: 'dd/mm/yyyy',
            numberFormat: '#,##0.00',
            currencyFormat: '$#,##0.00',
            percentFormat: '0.00%',
            booleanFormat: { true: 'Sí', false: 'No' },
          },
        } as ExcelReportConfig;

      default:
        throw new BadRequestException(
          `Cannot create default config for format: ${format}`,
        );
    }
  }
}
