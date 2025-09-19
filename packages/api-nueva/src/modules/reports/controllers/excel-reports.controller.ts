/**
 * 📊 EXCEL REPORTS CONTROLLER
 * Controlador REST para generación de reportes Excel
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UniversalReportService } from '../services/universal-report.service';
import { ReportConfigBuilderService } from '../builders/report-config.builder';
import { DataRepositoryService } from '../services/data-repository.service';
import { ReportFormat } from '../enums';
import {
  ExcelReportConfig,
  ReportJobResponse,
  ReportJobStatusInfo,
  FilterConfig,
  SortConfig,
  PaginationConfig,
} from '../types/report.types';

// DTOs para validación de entrada
export class GenerateExcelReportDto {
  title: string;
  collection: string;
  subtitle?: string;
  fields?: Array<{
    key: string;
    label: string;
    type: string;
    format?: string;
    width?: number;
    align?: string;
  }>;
  filters?: FilterConfig;
  sorting?: SortConfig;
  pagination?: PaginationConfig;
  template?: string;
  worksheet?: {
    name?: string;
    freezeRows?: number;
    freezeColumns?: number;
    autoFilter?: boolean;
  };
  styling?: {
    alternateRowColor?: string;
    headerColor?: string;
  };
  requestedBy?: string;
  priority?: number;
}

export class QuickExcelReportDto {
  title: string;
  collection: string;
  fields?: string[];
  filters?: FilterConfig;
  maxRecords?: number;
  worksheetName?: string;
}

@ApiTags('Excel Reports')
@Controller('reports/excel')
export class ExcelReportsController {
  private readonly logger = new Logger(ExcelReportsController.name);

  constructor(
    private readonly universalReportService: UniversalReportService,
    private readonly configBuilder: ReportConfigBuilderService,
    private readonly dataRepository: DataRepositoryService,
  ) {}

  /**
   * 🚀 Generar reporte Excel asíncrono (método principal)
   */
  @Post('generate')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Generar reporte Excel de forma asíncrona',
    description:
      'Crea un job para generar un reporte Excel y devuelve el ID del job para seguimiento',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Job de reporte creado exitosamente',
    schema: {
      example: {
        jobId: 'uuid-job-id',
        status: 'queued',
        estimatedTime: 10000,
        queuePosition: 2,
        message: 'Report queued successfully',
      },
    },
  })
  async generateExcelReport(
    @Body() dto: GenerateExcelReportDto,
  ): Promise<ReportJobResponse> {
    this.logger.log(
      `Generating Excel report: ${dto.title} from collection: ${dto.collection}`,
    );

    try {
      // Construir configuración usando builder
      const configBuilder = this.configBuilder.createExcel(
        dto.title,
        dto.collection,
      );

      // Configurar campos básicos
      if (dto.subtitle) {
        configBuilder.withSubtitle(dto.subtitle);
      }

      // Configurar worksheet
      if (dto.worksheet) {
        configBuilder.withWorksheet({
          name: dto.worksheet.name || 'Reporte',
          freezeRows: dto.worksheet.freezeRows,
          freezeColumns: dto.worksheet.freezeColumns,
          autoFilter: dto.worksheet.autoFilter ?? true,
          showGridLines: true,
          showHeaders: true,
        });
      }

      // Agregar campos
      if (dto.fields && dto.fields.length > 0) {
        dto.fields.forEach((field) => {
          configBuilder.addField(field.key, field.label, field.type as any, {
            format: field.format,
            width: field.width,
            align: field.align as any,
          });
        });
      } else {
        // Si no se especifican campos, inferirlos de la colección
        const schema = await this.dataRepository.getCollectionSchema(
          dto.collection,
          10,
        );
        this.addFieldsFromSchema(configBuilder, schema);
      }

      // Configurar filtros, ordenamiento y paginación
      if (dto.filters) {
        configBuilder.withFilters(dto.filters);
      }

      if (dto.sorting) {
        configBuilder.withSorting(dto.sorting);
      }

      if (dto.pagination) {
        configBuilder.withPagination(dto.pagination);
      }

      // Configurar template
      if (dto.template) {
        configBuilder.withTemplate(dto.template as any);
      }

      // Configurar estilos personalizados
      if (dto.styling) {
        if (dto.styling.alternateRowColor) {
          configBuilder.withAlternateRowColor(dto.styling.alternateRowColor);
        }

        if (dto.styling.headerColor) {
          configBuilder.withHeaderStyle({
            font: { bold: true, color: 'FFFFFF' },
            fill: {
              type: 'pattern',
              pattern: 'solid',
              fgColor: dto.styling.headerColor,
            },
            alignment: { horizontal: 'center', vertical: 'middle' },
          });
        }
      }

      // Aplicar configuración predeterminada
      configBuilder.asSimpleReport();

      const config = configBuilder.build();

      // Generar reporte asíncrono
      return await this.universalReportService.generateReport(
        ReportFormat.EXCEL,
        config,
        dto.requestedBy,
        dto.priority || 0,
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate Excel report: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(error.message);
    }
  }

  /**
   * ⚡ Generar reporte Excel síncrono (para reportes pequeños)
   */
  @Post('generate-sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generar reporte Excel de forma síncrona',
    description:
      'Genera un reporte Excel inmediatamente y lo devuelve como archivo (máximo 5000 registros)',
  })
  async generateExcelReportSync(
    @Body() dto: QuickExcelReportDto,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log(
      `Generating Excel report sync: ${dto.title} from collection: ${dto.collection}`,
    );

    try {
      const maxRecords = Math.min(dto.maxRecords || 5000, 5000); // Excel permite más registros que PDF

      // Construir configuración simple
      const configBuilder = this.configBuilder.createExcel(
        dto.title,
        dto.collection,
      );

      // Configurar worksheet
      configBuilder.withSimpleWorksheet(dto.worksheetName || 'Datos');

      // Agregar campos especificados o inferir del schema
      if (dto.fields && dto.fields.length > 0) {
        const schema = await this.dataRepository.getCollectionSchema(
          dto.collection,
          5,
        );
        dto.fields.forEach((fieldKey) => {
          const fieldType = this.inferFieldType(schema[fieldKey]);
          configBuilder.addField(
            fieldKey,
            this.formatLabel(fieldKey),
            fieldType as any,
          );
        });
      } else {
        const schema = await this.dataRepository.getCollectionSchema(
          dto.collection,
          15,
        );
        this.addFieldsFromSchema(configBuilder, schema);
      }

      if (dto.filters) {
        configBuilder.withFilters(dto.filters);
      }

      const config = configBuilder.asSimpleReport().build();

      // Generar reporte síncrono
      const { buffer, metadata } =
        await this.universalReportService.generateReportSync(
          ReportFormat.EXCEL,
          config,
          maxRecords,
        );

      // Configurar headers de respuesta
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${this.sanitizeFilename(dto.title)}.xlsx"`,
      );
      res.setHeader('Content-Length', buffer.length);

      // Enviar archivo
      res.send(buffer);
    } catch (error) {
      this.logger.error(
        `Failed to generate Excel report sync: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(error.message);
    }
  }

  /**
   * 📊 Obtener estado de job de reporte
   */
  @Get('status/:jobId')
  @ApiOperation({
    summary: 'Obtener estado de job de reporte Excel',
    description:
      'Consulta el estado y progreso de un job de generación de reporte',
  })
  @ApiParam({ name: 'jobId', description: 'ID del job de reporte' })
  async getJobStatus(
    @Param('jobId') jobId: string,
  ): Promise<ReportJobStatusInfo> {
    try {
      return await this.universalReportService.getJobStatus(jobId);
    } catch (error) {
      this.logger.error(`Failed to get job status: ${error.message}`);
      throw new NotFoundException(`Job ${jobId} not found`);
    }
  }

  /**
   * ❌ Cancelar job de reporte
   */
  @Post('cancel/:jobId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancelar job de reporte Excel',
    description:
      'Cancela un job de generación de reporte que esté en cola o procesándose',
  })
  @ApiParam({ name: 'jobId', description: 'ID del job de reporte a cancelar' })
  async cancelJob(
    @Param('jobId') jobId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const cancelled = await this.universalReportService.cancelJob(jobId);
      return {
        success: cancelled,
        message: cancelled
          ? 'Job cancelled successfully'
          : 'Job could not be cancelled',
      };
    } catch (error) {
      this.logger.error(`Failed to cancel job: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * 📋 Templates predefinidos para Excel
   */
  @Get('templates')
  @ApiOperation({
    summary: 'Obtener templates predefinidos para Excel',
    description:
      'Lista los templates de configuración predefinidos disponibles para Excel',
  })
  getTemplates(): {
    templates: Array<{
      id: string;
      name: string;
      description: string;
      features: string[];
    }>;
  } {
    return {
      templates: [
        {
          id: 'users',
          name: 'Reporte de Usuarios',
          description:
            'Template para reportes de usuarios con filtros automáticos',
          features: [
            'Auto-filtros',
            'Formato de fechas',
            'Columnas optimizadas',
          ],
        },
        {
          id: 'sales',
          name: 'Reporte de Ventas',
          description: 'Template financiero con formato de moneda y totales',
          features: [
            'Formato de moneda',
            'Celdas congeladas',
            'Colores corporativos',
          ],
        },
        {
          id: 'inventory',
          name: 'Reporte de Inventario',
          description: 'Template para productos con códigos SKU y stock',
          features: [
            'Formato numérico',
            'Códigos de colores',
            'Filtros avanzados',
          ],
        },
        {
          id: 'financial',
          name: 'Reporte Financiero',
          description: 'Template profesional para datos financieros',
          features: [
            'Formato contable',
            'Bordes profesionales',
            'Filas alternadas',
          ],
        },
      ],
    };
  }

  /**
   * 🎯 Generar reporte usando template predefinido
   */
  @Post('generate-template/:templateId')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Generar reporte Excel usando template predefinido',
    description:
      'Genera un reporte Excel usando una configuración de template predefinida',
  })
  @ApiParam({
    name: 'templateId',
    description: 'ID del template (users, sales, inventory, financial)',
  })
  async generateFromTemplate(
    @Param('templateId') templateId: string,
    @Body()
    options: {
      title?: string;
      collection?: string;
      filters?: FilterConfig;
      worksheetName?: string;
      requestedBy?: string;
    },
  ): Promise<ReportJobResponse> {
    try {
      let config: ExcelReportConfig;

      switch (templateId) {
        case 'users':
          config = this.configBuilder.createUserReport(
            ReportFormat.EXCEL,
            options.title,
          ) as ExcelReportConfig;
          break;
        case 'sales':
          config = this.configBuilder.createSalesReport(
            ReportFormat.EXCEL,
            options.title,
          ) as ExcelReportConfig;
          break;
        case 'inventory':
          config = this.configBuilder.createInventoryReport(
            ReportFormat.EXCEL,
            options.title,
          ) as ExcelReportConfig;
          break;
        case 'financial':
          config = this.configBuilder.createFinancial(
            ReportFormat.EXCEL,
            options.title || 'Reporte Financiero',
            'transactions',
          ) as ExcelReportConfig;
          break;
        default:
          throw new BadRequestException(`Unknown template: ${templateId}`);
      }

      // Aplicar collection personalizada si se especifica
      if (options.collection) {
        config.collection = options.collection;
      }

      // Aplicar nombre de worksheet personalizado
      if (options.worksheetName) {
        config.worksheet.name = options.worksheetName;
      }

      // Aplicar filtros personalizados
      if (options.filters) {
        config.filters = { ...config.filters, ...options.filters };
      }

      return await this.universalReportService.generateReport(
        ReportFormat.EXCEL,
        config,
        options.requestedBy,
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate Excel report from template: ${error.message}`,
      );
      throw new BadRequestException(error.message);
    }
  }

  /**
   * 🎨 Obtener opciones de formato disponibles
   */
  @Get('formatting-options')
  @ApiOperation({
    summary: 'Obtener opciones de formato disponibles',
    description:
      'Lista las opciones de formato y estilos disponibles para reportes Excel',
  })
  getFormattingOptions(): {
    dateFormats: string[];
    currencyFormats: string[];
    numberFormats: string[];
    colors: { [key: string]: string };
    alignments: string[];
  } {
    return {
      dateFormats: [
        'dd/mm/yyyy',
        'mm/dd/yyyy',
        'yyyy-mm-dd',
        'dd-mmm-yyyy',
        'mmm dd, yyyy',
      ],
      currencyFormats: [
        '$#,##0.00',
        '€#,##0.00',
        '#,##0.00"MXN"',
        '$#,##0.00_);[Red]($#,##0.00)',
      ],
      numberFormats: ['#,##0', '#,##0.00', '0.00%', '#,##0_);[Red](#,##0)'],
      colors: {
        lightBlue: 'E6F3FF',
        lightGreen: 'E6FFE6',
        lightYellow: 'FFFBCC',
        lightGray: 'F5F5F5',
        corporate: '2F4F4F',
        financial: '1F4E79',
      },
      alignments: ['left', 'center', 'right'],
    };
  }

  /**
   * 📊 Vista previa de datos
   */
  @Get('preview/:collection')
  @ApiOperation({
    summary: 'Vista previa de datos de colección',
    description:
      'Obtiene una muestra de datos de la colección para configurar el reporte',
  })
  @ApiParam({ name: 'collection', description: 'Nombre de la colección' })
  @ApiQuery({
    name: 'limit',
    description: 'Número de registros a mostrar',
    required: false,
  })
  async previewData(
    @Param('collection') collection: string,
    @Query('limit') limit?: number,
  ): Promise<{ data: any[]; schema: any; stats: any }> {
    try {
      const sampleSize = Math.min(parseInt(String(limit || '10')) || 10, 50);

      const [queryResult, schema, stats] = await Promise.all([
        this.dataRepository.query(collection, {
          pagination: { page: 1, limit: sampleSize },
        }),
        this.dataRepository.getCollectionSchema(collection, 20),
        this.dataRepository.getCollectionStats(collection),
      ]);

      return {
        data: queryResult.data,
        schema,
        stats,
      };
    } catch (error) {
      this.logger.error(`Failed to preview data: ${error.message}`);
      throw new NotFoundException(`Collection ${collection} not found`);
    }
  }

  /**
   * 🔧 MÉTODOS PRIVADOS
   */

  /**
   * 📊 Agregar campos desde schema inferido
   */
  private addFieldsFromSchema(configBuilder: any, schema: any): void {
    const maxFields = 20; // Excel puede manejar más campos que PDF
    let fieldCount = 0;

    Object.entries(schema).forEach(([key, type]) => {
      if (fieldCount >= maxFields) return;
      if (key.startsWith('_') && key !== '_id') return; // Saltar campos internos excepto _id

      const fieldType = this.inferFieldType(type);
      const label = this.formatLabel(key);
      const width = this.getOptimalColumnWidth(fieldType);

      configBuilder.addField(key, label, fieldType, { width });
      fieldCount++;
    });
  }

  /**
   * 🔍 Inferir tipo de campo desde schema
   */
  private inferFieldType(schemaType: any): string {
    if (typeof schemaType === 'string') {
      switch (schemaType) {
        case 'string':
          return 'string';
        case 'number':
          return 'number';
        case 'date':
          return 'date';
        case 'boolean':
          return 'boolean';
        default:
          return 'string';
      }
    }
    return 'string';
  }

  /**
   * 📏 Obtener ancho óptimo de columna según tipo
   */
  private getOptimalColumnWidth(fieldType: string): number {
    switch (fieldType) {
      case 'date':
        return 12;
      case 'number':
        return 10;
      case 'currency':
        return 12;
      case 'boolean':
        return 8;
      case 'email':
        return 25;
      case 'url':
        return 30;
      default:
        return 15;
    }
  }

  /**
   * 📝 Formatear etiqueta de campo
   */
  private formatLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1') // Separar camelCase
      .replace(/^./, (str) => str.toUpperCase()) // Capitalizar primera letra
      .replace(/_/g, ' ') // Reemplazar underscores
      .trim();
  }

  /**
   * 🧹 Sanitizar nombre de archivo
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9\s-_]/g, '') // Remover caracteres especiales
      .replace(/\s+/g, '_') // Reemplazar espacios con underscores
      .toLowerCase();
  }
}
