/**
 * 📊 EXCEL REPORT STRATEGY
 * Strategy Pattern universal para generación de reportes Excel con cache inteligente
 * Soporte para múltiples hojas, estilos avanzados y optimización de memoria
 */

import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExcelReportConfig, ValidationResult } from '../types/report.types';
import { IReportStrategy } from '../services/report-factory.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ReportFormat, FieldType } from '../enums';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExcelReportStrategy implements IReportStrategy {
  private readonly logger = new Logger(ExcelReportStrategy.name);
  private readonly cachePrefix = 'excel-strategy:';
  private readonly cacheTtl: number;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {
    this.cacheTtl = this.configService.get('reports.expirationHours', 24) * 3600; // Convertir a segundos
  }

  /**
   * 🎯 Generar Excel usando ExcelJS con cache inteligente
   */
  async generate(config: ExcelReportConfig, data: Record<string, unknown>[]): Promise<Buffer> {
    const startTime = Date.now();
    this.logger.log(
      `Generating Excel report: ${config.title} (${data.length} records)`,
    );

    try {
      // 1. Validar configuración
      const validation = this.validate(config);
      if (!validation.isValid) {
        throw new BadRequestException(
          `Invalid Excel config: ${validation.errors.join(', ')}`,
        );
      }

      // 2. Verificar cache primero
      const cacheKey = this.generateCacheKey(config, data);
      const cached = await this.cacheManager.get<Buffer>(cacheKey);
      if (cached) {
        this.logger.debug(`Excel cache hit: ${config.title}`);
        return cached;
      }

      // 3. Verificar límites de datos
      this.validateDataLimits(data.length);

      // 4. Crear workbook y worksheet
      const workbook = new ExcelJS.Workbook();
      this.setupWorkbookMetadata(workbook, config);

      const worksheet = workbook.addWorksheet(config.worksheet.name, {
        views: [{ showGridLines: config.worksheet.showGridLines ?? true }],
      });

      // 5. Procesar datos según configuración de campos
      const processedData = this.processData(data, config);

      // 6. Configurar columnas y headers
      this.setupColumns(worksheet, config);
      this.addHeaders(worksheet, config);

      // 7. Agregar datos (en lotes para archivos grandes)
      await this.addDataInBatches(worksheet, processedData, config);

      // 8. Aplicar estilos
      this.applyStyles(worksheet, config, processedData.length);

      // 9. Configurar auto-filtro si está habilitado
      if (config.worksheet.autoFilter) {
        worksheet.autoFilter = {
          from: 'A1',
          to: `${this.getColumnLetter(config.fields.length)}1`,
        };
      }

      // 10. Configurar freeze panes
      if (config.worksheet.freezeRows || config.worksheet.freezeColumns) {
        worksheet.views = [
          {
            state: 'frozen',
            xSplit: config.worksheet.freezeColumns || 0,
            ySplit: config.worksheet.freezeRows || 0,
            topLeftCell: `${String.fromCharCode(65 + (config.worksheet.freezeColumns || 0))}${(config.worksheet.freezeRows || 0) + 1}`,
          },
        ];
      }

      // 11. Agregar hoja de metadatos si está habilitada
      if (config.includeMetadata) {
        this.addMetadataWorksheet(workbook, config, data.length);
      }

      // 12. Generar buffer
      const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

      // 13. Guardar en cache
      await this.cacheManager.set(cacheKey, buffer, this.cacheTtl * 1000);

      const generationTime = Date.now() - startTime;
      this.logger.log(`Excel generated successfully in ${generationTime}ms (${buffer.length} bytes)`);

      return buffer;
    } catch (error) {
      this.logger.error(
        `Excel generation failed: ${error.message}`,
        error.stack,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Excel generation failed: ${error.message}`);
    }
  }

  /**
   * ✅ Validar configuración Excel específica
   */
  validate(config: ExcelReportConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validaciones obligatorias
    if (!config.title?.trim()) {
      errors.push('Title is required');
    }

    if (!config.collection?.trim()) {
      errors.push('Collection is required');
    }

    if (!config.fields || config.fields.length === 0) {
      errors.push('At least one field is required');
    }

    if (config.format !== ReportFormat.EXCEL) {
      errors.push('Invalid format for Excel strategy');
    }

    // Validaciones de worksheet
    if (!config.worksheet) {
      errors.push('Worksheet configuration is required');
    } else {
      if (!config.worksheet.name?.trim()) {
        errors.push('Worksheet name is required');
      }

      if (config.worksheet.name && config.worksheet.name.length > 31) {
        errors.push('Worksheet name must be 31 characters or less');
      }
    }

    // Validaciones de campos
    if (config.fields) {
      config.fields.forEach((field, index) => {
        if (!field.key?.trim()) {
          errors.push(`Field ${index + 1}: key is required`);
        }

        if (!field.label?.trim()) {
          errors.push(`Field ${index + 1}: label is required`);
        }

        if (!Object.values(FieldType).includes(field.type)) {
          errors.push(`Field ${index + 1}: invalid field type`);
        }

        if (field.width && field.width < 0) {
          warnings.push(`Field ${field.key}: width should be positive`);
        }
      });
    }

    // Validaciones de estilos
    if (config.styling) {
      if (config.styling.alternateRowColor) {
        const hexColorRegex = /^[A-Fa-f0-9]{6}$/;
        if (!hexColorRegex.test(config.styling.alternateRowColor)) {
          errors.push(
            'Invalid alternate row color format (use hex FFFFFF without #)',
          );
        }
      }
    }

    // Validaciones de formatos
    if (config.formatting) {
      if (!config.formatting.dateFormat?.trim()) {
        warnings.push('Date format is recommended');
      }

      if (!config.formatting.currencyFormat?.trim()) {
        warnings.push('Currency format is recommended');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * ⏱️ Estimar tiempo de generación (ms)
   */
  getEstimatedTime(recordCount: number): number {
    // Estimaciones basadas en benchmarks empíricos
    const baseTime = 1500; // 1.5s base para setup
    const timePerRecord = 15; // 15ms por registro (optimizado)
    const excelOverhead = 300; // 300ms overhead de ExcelJS
    const cachingOverhead = 200; // 200ms para operaciones de cache

    return baseTime + recordCount * timePerRecord + excelOverhead + cachingOverhead;
  }

  /**
   * 📦 Verificar si el formato es soportado
   */
  supports(format: ReportFormat): boolean {
    return format === ReportFormat.EXCEL;
  }

  /**
   * 🔍 Obtener información de la estrategia
   */
  getInfo(): {
    name: string;
    format: ReportFormat;
    features: string[];
    limitations: string[];
  } {
    return {
      name: 'Excel Report Strategy',
      format: ReportFormat.EXCEL,
      features: [
        'ExcelJS-based Excel generation',
        'Multiple worksheets support',
        'Advanced styling and formatting',
        'Auto-filter and freeze panes',
        'Intelligent caching',
        'Batch processing for large datasets',
        'Metadata worksheets',
        'Field type formatting',
        'Nested data access',
      ],
      limitations: [
        'Memory intensive for very large datasets',
        'Limited to 50,000 records for optimal performance',
        'No real-time collaboration features',
      ],
    };
  }

  /**
   * 📊 Configurar metadatos del workbook
   */
  private setupWorkbookMetadata(
    workbook: ExcelJS.Workbook,
    config: ExcelReportConfig,
  ): void {
    workbook.creator =
      config.metadata?.author ||
      config.excelOptions?.creator ||
      'Report System';
    workbook.lastModifiedBy =
      config.excelOptions?.lastModifiedBy || workbook.creator;
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.lastPrinted = new Date();

    // Propiedades adicionales
    if (config.metadata?.subject) {
      workbook.subject = config.metadata.subject;
    }

    if (config.metadata?.keywords) {
      workbook.keywords = config.metadata.keywords.join(', ');
    }

    workbook.description = `${config.title} - Generated by Universal Reports System`;
  }

  /**
   * 🏗️ Configurar columnas del worksheet
   */
  private setupColumns(
    worksheet: ExcelJS.Worksheet,
    config: ExcelReportConfig,
  ): void {
    worksheet.columns = config.fields.map((field) => ({
      header: field.label,
      key: field.key,
      width: field.width || 15,
    }));
  }

  /**
   * 📋 Agregar headers con estilos
   */
  private addHeaders(
    worksheet: ExcelJS.Worksheet,
    config: ExcelReportConfig,
  ): void {
    const headerRow = worksheet.getRow(1);

    config.fields.forEach((field, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = field.label;

      // Aplicar estilo de header
      if (config.styling?.headerStyle) {
        this.applyCellStyle(cell, config.styling.headerStyle);
      }
    });

    headerRow.commit();
  }

  /**
   * 📊 Agregar datos al worksheet (método legacy)
   */
  private addData(
    worksheet: ExcelJS.Worksheet,
    data: Record<string, unknown>[],
    config: ExcelReportConfig,
  ): void {
    data.forEach((record, rowIndex) => {
      const excelRow = worksheet.addRow(record);
      this.applyRowStyles(excelRow, rowIndex, config);
    });
  }

  /**
   * 🚀 Agregar datos en lotes para mejor performance
   */
  private async addDataInBatches(
    worksheet: ExcelJS.Worksheet,
    data: Record<string, unknown>[],
    config: ExcelReportConfig,
  ): Promise<void> {
    const batchSize = 1000; // Procesar 1000 registros por lote
    const totalBatches = Math.ceil(data.length / batchSize);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const start = batchIndex * batchSize;
      const end = Math.min(start + batchSize, data.length);
      const batch = data.slice(start, end);

      this.logger.debug(`Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} records)`);

      batch.forEach((record, recordIndex) => {
        const globalRowIndex = start + recordIndex;
        const excelRow = worksheet.addRow(record);
        this.applyRowStyles(excelRow, globalRowIndex, config);
      });

      // Permitir que el event loop procese otras tareas
      if (batchIndex < totalBatches - 1) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }
  }

  /**
   * 🎨 Aplicar estilos a una fila
   */
  private applyRowStyles(
    excelRow: ExcelJS.Row,
    rowIndex: number,
    config: ExcelReportConfig,
  ): void {
    // Aplicar estilos alternados si están configurados
    const isEvenRow = (rowIndex + 2) % 2 === 0; // +2 porque la fila 1 es header

    if (config.styling?.evenRowStyle && isEvenRow) {
      config.fields.forEach((_, colIndex) => {
        this.applyCellStyle(
          excelRow.getCell(colIndex + 1),
          config.styling.evenRowStyle,
        );
      });
    } else if (config.styling?.oddRowStyle && !isEvenRow) {
      config.fields.forEach((_, colIndex) => {
        this.applyCellStyle(
          excelRow.getCell(colIndex + 1),
          config.styling.oddRowStyle,
        );
      });
    } else if (config.styling?.dataStyle) {
      config.fields.forEach((_, colIndex) => {
        this.applyCellStyle(
          excelRow.getCell(colIndex + 1),
          config.styling.dataStyle,
        );
      });
    }

    // Aplicar color alternado si está configurado
    if (config.styling?.alternateRowColor && isEvenRow) {
      config.fields.forEach((_, colIndex) => {
        const cell = excelRow.getCell(colIndex + 1);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: `FF${config.styling.alternateRowColor}` },
        };
      });
    }
  }

  /**
   * 🎨 Aplicar estilos generales
   */
  private applyStyles(
    worksheet: ExcelJS.Worksheet,
    config: ExcelReportConfig,
    dataRowCount: number,
  ): void {
    // Aplicar estilos a campos específicos según su tipo
    config.fields.forEach((field, colIndex) => {
      const column = worksheet.getColumn(colIndex + 1);

      // Configurar formato numérico según tipo de campo
      switch (field.type) {
        case FieldType.DATE:
          column.numFmt = config.formatting?.dateFormat || 'dd/mm/yyyy';
          break;
        case FieldType.CURRENCY:
          column.numFmt = config.formatting?.currencyFormat || '$#,##0.00';
          break;
        case FieldType.NUMBER:
          column.numFmt = config.formatting?.numberFormat || '#,##0.00';
          break;
      }

      // Configurar alineación según configuración del campo
      if (field.align) {
        for (let rowIndex = 2; rowIndex <= dataRowCount + 1; rowIndex++) {
          const cell = worksheet.getCell(rowIndex, colIndex + 1);
          cell.alignment = {
            ...cell.alignment,
            horizontal: field.align,
          };
        }
      }
    });
  }

  /**
   * 🖌️ Aplicar estilo a una celda específica
   */
  private applyCellStyle(cell: ExcelJS.Cell, style: any): void {
    if (style.font) {
      cell.font = { ...style.font };
    }

    if (style.fill) {
      cell.fill = { ...style.fill };
    }

    if (style.alignment) {
      cell.alignment = { ...style.alignment };
    }

    if (style.border) {
      cell.border = { ...style.border };
    }

    if (style.numFmt) {
      cell.numFmt = style.numFmt;
    }
  }

  /**
   * 🔄 Procesar datos según configuración de campos
   */
  private processData(data: Record<string, unknown>[], config: ExcelReportConfig): Record<string, unknown>[] {
    return data.map((record, index) => {
      const processedRecord: Record<string, unknown> = {};

      config.fields.forEach((fieldConfig) => {
        const rawValue = this.getNestedValue(record, fieldConfig.key);
        processedRecord[fieldConfig.key] = this.formatValue(
          rawValue,
          fieldConfig.type,
          fieldConfig.format,
          fieldConfig.defaultValue,
          fieldConfig.transformer,
          config.formatting,
        );
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
   * 📄 Agregar hoja de metadatos
   */
  private addMetadataWorksheet(
    workbook: ExcelJS.Workbook,
    config: ExcelReportConfig,
    recordCount: number,
  ): void {
    const metaWorksheet = workbook.addWorksheet('Metadata');

    const metadata = [
      ['Reporte', config.title],
      ['Colección', config.collection],
      ['Total de registros', recordCount],
      ['Generado el', new Date().toLocaleString('es-ES')],
      ['Campos incluidos', config.fields.length],
      ['Formato', 'Excel (.xlsx)'],
      ['Sistema', 'Universal Reports System'],
    ];

    metadata.forEach(([key, value], index) => {
      const row = metaWorksheet.getRow(index + 1);
      row.getCell(1).value = key;
      row.getCell(2).value = value;

      // Estilo para las claves
      row.getCell(1).font = { bold: true };
    });

    // Ajustar ancho de columnas
    metaWorksheet.getColumn(1).width = 20;
    metaWorksheet.getColumn(2).width = 30;
  }

  /**
   * 🔐 Generar clave de cache
   */
  private generateCacheKey(config: ExcelReportConfig, data: Record<string, unknown>[]): string {
    const configHash = JSON.stringify({
      title: config.title,
      collection: config.collection,
      fields: config.fields.map(f => ({ key: f.key, type: f.type, format: f.format })),
      worksheet: {
        name: config.worksheet.name,
        autoFilter: config.worksheet.autoFilter,
        freezeRows: config.worksheet.freezeRows,
        freezeColumns: config.worksheet.freezeColumns,
      },
      styling: config.styling,
      filters: config.query?.filters,
    });

    const dataHash = JSON.stringify({
      length: data.length,
      sample: data.slice(0, 3), // Muestra de los primeros 3 registros
    });

    const combinedHash = Buffer.from(configHash + dataHash).toString('base64').substring(0, 32);
    return `${this.cachePrefix}${combinedHash}`;
  }

  /**
   * ⚠️ Validar límites de datos
   */
  private validateDataLimits(recordCount: number): void {
    const maxRecords = this.configService.get('reports.maxSyncRecords.excel', 50000);

    if (recordCount > maxRecords) {
      throw new BadRequestException(
        `Dataset too large for synchronous processing. Maximum ${maxRecords} records allowed, got ${recordCount}. Consider using async generation.`,
      );
    }

    if (recordCount > 10000) {
      this.logger.warn(
        `Large dataset detected (${recordCount} records). Generation may take longer than usual.`,
      );
    }
  }

  /**
   * 🧹 Limpiar cache de Excel
   */
  async clearCache(): Promise<number> {
    await this.cacheManager.clear();
    return 0; // Cache limpiado
  }

  /**
   * 🎯 Obtener valor anidado de objeto
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * 🎨 Formatear valor según tipo de campo
   */
  private formatValue(
    value: any,
    type: FieldType,
    format?: string,
    defaultValue?: any,
    transformer?: (value: any) => string,
    formatting?: any,
  ): any {
    // Aplicar transformer personalizado primero
    if (transformer && value !== null && value !== undefined) {
      return transformer(value);
    }

    // Usar valor por defecto si está vacío
    if (value === null || value === undefined || value === '') {
      return defaultValue ?? '';
    }

    switch (type) {
      case FieldType.STRING:
      case FieldType.EMAIL:
      case FieldType.URL:
        return String(value);

      case FieldType.NUMBER:
        const num = Number(value);
        return isNaN(num) ? (defaultValue ?? 0) : num;

      case FieldType.CURRENCY:
        const currency = Number(value);
        return isNaN(currency) ? (defaultValue ?? 0) : currency;

      case FieldType.DATE:
        const date = new Date(value);
        return isNaN(date.getTime()) ? (defaultValue ?? '') : date;

      case FieldType.BOOLEAN:
        const booleanFormat = formatting?.booleanFormat;
        if (booleanFormat) {
          return value ? booleanFormat.true : booleanFormat.false;
        }
        return value ? 'Sí' : 'No';

      default:
        return value;
    }
  }

  /**
   * 🔤 Obtener letra de columna Excel (A, B, C, ..., AA, AB, etc.)
   */
  private getColumnLetter(columnNumber: number): string {
    let result = '';
    while (columnNumber > 0) {
      columnNumber--;
      result = String.fromCharCode(65 + (columnNumber % 26)) + result;
      columnNumber = Math.floor(columnNumber / 26);
    }
    return result;
  }
}
