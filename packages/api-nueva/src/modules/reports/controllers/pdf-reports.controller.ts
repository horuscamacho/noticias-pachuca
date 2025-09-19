/**
 * 📄 PDF REPORTS CONTROLLER
 * Controlador REST para generación de reportes PDF
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
import { IsString, IsOptional, IsArray, IsNumber, IsObject } from 'class-validator';
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
import { TemplateService } from '../services/template.service';
import { ReportFormat } from '../enums';
import {
  PDFReportConfig,
  ReportJobResponse,
  ReportJobStatusInfo,
  FilterConfig,
  SortConfig,
  PaginationConfig,
} from '../types/report.types';

// DTOs para validación de entrada
export class GeneratePDFReportDto {
  @IsString()
  title: string;

  @IsString()
  collection: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsArray()
  fields?: Array<{
    key: string;
    label: string;
    type: string;
    format?: string;
    width?: number;
    align?: string;
  }>;

  @IsOptional()
  @IsObject()
  filters?: FilterConfig;

  @IsOptional()
  @IsObject()
  sorting?: SortConfig;

  @IsOptional()
  @IsObject()
  pagination?: PaginationConfig;

  @IsOptional()
  @IsString()
  template?: string;

  @IsOptional()
  @IsObject()
  branding?: {
    companyName?: string;
    logo?: string;
    colors?: {
      primary: string;
      secondary: string;
      text?: string;
    };
  };

  @IsOptional()
  @IsString()
  requestedBy?: string;

  @IsOptional()
  @IsNumber()
  priority?: number;
}

export class QuickPDFReportDto {
  @IsString()
  title: string;

  @IsString()
  collection: string;

  @IsOptional()
  @IsArray()
  fields?: string[];

  @IsOptional()
  @IsObject()
  filters?: FilterConfig;

  @IsOptional()
  @IsNumber()
  maxRecords?: number;
}

@ApiTags('PDF Reports')
@Controller('reports/pdf')
export class PDFReportsController {
  private readonly logger = new Logger(PDFReportsController.name);

  constructor(
    private readonly universalReportService: UniversalReportService,
    private readonly configBuilder: ReportConfigBuilderService,
    private readonly dataRepository: DataRepositoryService,
    private readonly templateService: TemplateService,
  ) {}

  /**
   * 🚀 Generar reporte PDF asíncrono (método principal)
   */
  @Post('generate')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Generar reporte PDF de forma asíncrona',
    description:
      'Crea un job para generar un reporte PDF y devuelve el ID del job para seguimiento',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Job de reporte creado exitosamente',
    schema: {
      example: {
        jobId: 'uuid-job-id',
        status: 'queued',
        estimatedTime: 15000,
        queuePosition: 3,
        message: 'Report queued successfully',
      },
    },
  })
  async generatePDFReport(
    @Body() dto: GeneratePDFReportDto,
  ): Promise<ReportJobResponse> {
    this.logger.log(
      `Generating PDF report: ${dto.title} from collection: ${dto.collection}`,
    );

    try {
      // Construir configuración usando builder
      const configBuilder = this.configBuilder.createPDF(
        dto.title,
        dto.collection,
      );

      // Configurar campos básicos
      if (dto.subtitle) {
        configBuilder.withSubtitle(dto.subtitle);
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

      // Configurar template y branding
      if (dto.template) {
        configBuilder.withTemplate(dto.template as any);
      }

      if (dto.branding) {
        configBuilder.withBranding(dto.branding as any);
      }

      // Aplicar configuración predeterminada
      configBuilder.asSimpleReport();

      const config = configBuilder.build();

      // Generar reporte asíncrono
      return await this.universalReportService.generateReport(
        ReportFormat.PDF,
        config,
        dto.requestedBy,
        dto.priority || 0,
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate PDF report: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(error.message);
    }
  }

  /**
   * ⚡ Generar reporte PDF síncrono (para reportes pequeños)
   */
  @Post('generate-sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generar reporte PDF de forma síncrona',
    description:
      'Genera un reporte PDF inmediatamente y lo devuelve como archivo (máximo 1000 registros)',
  })
  async generatePDFReportSync(
    @Body() dto: QuickPDFReportDto,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log(
      `Generating PDF report sync: ${dto.title} from collection: ${dto.collection}`,
    );

    try {
      const maxRecords = Math.min(dto.maxRecords || 1000, 1000);

      // Construir configuración simple
      const configBuilder = this.configBuilder.createPDF(
        dto.title,
        dto.collection,
      );

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
          10,
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
          ReportFormat.PDF,
          config,
          maxRecords,
        );

      // Configurar headers de respuesta
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${this.sanitizeFilename(dto.title)}.pdf"`,
      );
      res.setHeader('Content-Length', buffer.length);

      // Enviar archivo
      res.send(buffer);
    } catch (error) {
      this.logger.error(
        `Failed to generate PDF report sync: ${error.message}`,
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
    summary: 'Obtener estado de job de reporte PDF',
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
    summary: 'Cancelar job de reporte PDF',
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
   * 📋 Listar colecciones disponibles
   */
  @Get('collections')
  @ApiOperation({
    summary: 'Listar colecciones disponibles',
    description:
      'Obtiene la lista de todas las colecciones MongoDB disponibles para reportes',
  })
  async listCollections(): Promise<{ collections: string[] }> {
    try {
      const collections = await this.dataRepository.listCollections();
      return { collections };
    } catch (error) {
      this.logger.error(`Failed to list collections: ${error.message}`);
      throw new BadRequestException('Failed to fetch collections');
    }
  }

  /**
   * 🔍 Obtener schema de colección
   */
  @Get('collections/:collection/schema')
  @ApiOperation({
    summary: 'Obtener schema de colección',
    description:
      'Analiza una colección y devuelve su estructura para ayudar en la configuración de reportes',
  })
  @ApiParam({ name: 'collection', description: 'Nombre de la colección' })
  @ApiQuery({
    name: 'sampleSize',
    description: 'Número de documentos a analizar',
    required: false,
  })
  async getCollectionSchema(
    @Param('collection') collection: string,
    @Query('sampleSize') sampleSize?: number,
  ): Promise<{ schema: any; stats: any }> {
    try {
      const [schema, stats] = await Promise.all([
        this.dataRepository.getCollectionSchema(collection, sampleSize || 100),
        this.dataRepository.getCollectionStats(collection),
      ]);

      return { schema, stats };
    } catch (error) {
      this.logger.error(`Failed to get collection schema: ${error.message}`);
      throw new NotFoundException(`Collection ${collection} not found`);
    }
  }

  /**
   * 📋 Templates predefinidos
   */
  @Get('templates')
  @ApiOperation({
    summary: 'Obtener templates predefinidos',
    description:
      'Lista los templates de configuración predefinidos disponibles',
  })
  getTemplates(): {
    templates: Array<{ id: string; name: string; description: string }>;
  } {
    return {
      templates: [
        {
          id: 'users',
          name: 'Reporte de Usuarios',
          description: 'Template para reportes de usuarios',
        },
        {
          id: 'sales',
          name: 'Reporte de Ventas',
          description: 'Template para reportes financieros de ventas',
        },
        {
          id: 'inventory',
          name: 'Reporte de Inventario',
          description: 'Template para reportes de productos/inventario',
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
    summary: 'Generar reporte usando template predefinido',
    description:
      'Genera un reporte PDF usando una configuración de template predefinida',
  })
  @ApiParam({
    name: 'templateId',
    description: 'ID del template (users, sales, inventory)',
  })
  async generateFromTemplate(
    @Param('templateId') templateId: string,
    @Body()
    options: {
      title?: string;
      collection?: string;
      filters?: FilterConfig;
      requestedBy?: string;
    },
  ): Promise<ReportJobResponse> {
    try {
      let config: PDFReportConfig;

      switch (templateId) {
        case 'users':
          config = this.configBuilder.createUserReport(
            ReportFormat.PDF,
            options.title,
          ) as PDFReportConfig;
          break;
        case 'sales':
          config = this.configBuilder.createSalesReport(
            ReportFormat.PDF,
            options.title,
          ) as PDFReportConfig;
          break;
        case 'inventory':
          config = this.configBuilder.createInventoryReport(
            ReportFormat.PDF,
            options.title,
          ) as PDFReportConfig;
          break;
        default:
          throw new BadRequestException(`Unknown template: ${templateId}`);
      }

      // Aplicar collection personalizada si se especifica
      if (options.collection) {
        config.collection = options.collection;
      }

      // Aplicar filtros personalizados
      if (options.filters) {
        config.filters = { ...config.filters, ...options.filters };
      }

      return await this.universalReportService.generateReport(
        ReportFormat.PDF,
        config,
        options.requestedBy,
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate report from template: ${error.message}`,
      );
      throw new BadRequestException(error.message);
    }
  }

  /**
   * 🐛 Endpoint de debug para ver HTML generado
   */
  @Post('debug-html')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Debug HTML generado para PDF',
    description: 'Devuelve el HTML que se usaría para generar el PDF (solo para debug)',
  })
  async debugHTML(
    @Body() dto: QuickPDFReportDto,
  ): Promise<{ html: string; data: any }> {
    try {
      const maxRecords = Math.min(dto.maxRecords || 100, 100);

      // Construir configuración simple
      const configBuilder = this.configBuilder.createPDF(
        dto.title,
        dto.collection,
      );

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
          10,
        );
        this.addFieldsFromSchema(configBuilder, schema);
      }

      if (dto.filters) {
        configBuilder.withFilters(dto.filters);
      }

      const config = configBuilder.asSimpleReport().build();

      // Obtener datos
      const data = await this.dataRepository.query(dto.collection, {
        filters: config.query?.filters,
        pagination: { page: 1, limit: maxRecords },
      });

      // Usar exactamente los mismos datos que el PDF Strategy
      const processedData = this.processDataForTemplate(data.data, config);

      const templateData = {
        title: config.title,
        subtitle: config.subtitle,
        data: processedData,
        metadata: {
          generatedAt: new Date(),
          totalRecords: data.total,
          collection: config.collection,
          filters: config.query?.filters,
        },
        brand: {
          companyName: config.branding?.companyName || 'Sistema de Reportes',
          primaryColor: config.branding?.colors?.primary || '#007bff',
          secondaryColor: config.branding?.colors?.secondary || '#6c757d',
          accentColor: config.branding?.colors?.accent || '#28a745',
        },
        config: config, // AGREGAR LA CONFIG COMPLETA
        hasHeader: true,
      };

      const html = await this.templateService.generateHTML(
        'default',
        templateData,
        { name: 'default', format: 'pdf' },
      );

      return {
        html,
        data: templateData,
      };
    } catch (error) {
      this.logger.error(`Failed to debug HTML: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * 🔧 MÉTODOS PRIVADOS
   */

  /**
   * 📊 Agregar campos desde schema inferido
   */
  private addFieldsFromSchema(configBuilder: any, schema: any): void {
    const maxFields = 10; // Límite de campos automáticos
    let fieldCount = 0;

    Object.entries(schema).forEach(([key, type]) => {
      if (fieldCount >= maxFields) return;
      if (key.startsWith('_') && key !== '_id') return; // Saltar campos internos excepto _id

      const fieldType = this.inferFieldType(type);
      const label = this.formatLabel(key);

      configBuilder.addField(key, label, fieldType);
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

  /**
   * 🔄 Procesar datos para template (igual que PDFReportStrategy)
   */
  private processDataForTemplate(data: Record<string, unknown>[], config: any): Record<string, unknown>[] {
    return data.map((record, index) => {
      const processedRecord: Record<string, unknown> = {};

      config.fields.forEach((fieldConfig: any) => {
        const rawValue = this.getNestedValue(record, fieldConfig.key);
        processedRecord[fieldConfig.key] = rawValue; // Simplificado para debug
      });

      // Agregar metadatos útiles
      processedRecord['_meta'] = {
        index: index + 1,
        isFirst: index === 0,
        isLast: index === data.length - 1,
        isEven: index % 2 === 0,
        isOdd: index % 2 !== 0,
      };

      return processedRecord;
    });
  }

  /**
   * 🎯 Obtener valor anidado de objeto (ej: 'user.profile.name')
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
