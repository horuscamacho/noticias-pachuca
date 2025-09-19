/**
 * 🏗️ EXCEL CONFIG BUILDER
 * Builder Pattern para construcción fluida de configuraciones Excel
 */

import { Injectable } from '@nestjs/common';
import {
  ExcelReportConfig,
  ExcelWorksheetConfig,
  ExcelStylingConfig,
  ExcelFormattingConfig,
  ExcelCellStyle,
  FieldConfig,
  BrandingConfig,
  FilterConfig,
  SortConfig,
  PaginationConfig,
} from '../types/report.types';
import { ReportFormat, FieldType, AlignType, TemplateType } from '../enums';

@Injectable()
export class ExcelConfigBuilderService {
  private config: Partial<ExcelReportConfig> = {};

  /**
   * 🎯 Inicializar builder con configuración básica
   */
  create(title: string, collection: string): ExcelConfigBuilderService {
    this.config = {
      title,
      collection,
      format: ReportFormat.EXCEL,
      fields: [],
    };
    return this;
  }

  /**
   * 📝 Configurar información básica
   */
  withSubtitle(subtitle: string): ExcelConfigBuilderService {
    this.config.subtitle = subtitle;
    return this;
  }

  withTemplate(template: TemplateType): ExcelConfigBuilderService {
    this.config.template = template;
    return this;
  }

  withMetadata(metadata: {
    author?: string;
    subject?: string;
    keywords?: string[];
    createdBy?: string;
    department?: string;
  }): ExcelConfigBuilderService {
    this.config.metadata = metadata;
    return this;
  }

  /**
   * 📊 Configurar campos
   */
  addField(
    key: string,
    label: string,
    type: FieldType,
    options?: {
      format?: string;
      width?: number;
      align?: AlignType;
      required?: boolean;
      defaultValue?: any;
      transformer?: (value: any) => string;
    },
  ): ExcelConfigBuilderService {
    if (!this.config.fields) {
      this.config.fields = [];
    }

    this.config.fields.push({
      key,
      label,
      type,
      ...options,
    });

    return this;
  }

  addFields(fields: FieldConfig[]): ExcelConfigBuilderService {
    this.config.fields = [...(this.config.fields || []), ...fields];
    return this;
  }

  /**
   * 🔍 Configurar filtros y ordenamiento
   */
  withFilters(filters: FilterConfig): ExcelConfigBuilderService {
    this.config.filters = filters;
    return this;
  }

  withSorting(sorting: SortConfig): ExcelConfigBuilderService {
    this.config.sorting = sorting;
    return this;
  }

  withPagination(pagination: PaginationConfig): ExcelConfigBuilderService {
    this.config.pagination = pagination;
    return this;
  }

  /**
   * 📊 Configurar worksheet
   */
  withWorksheet(options: {
    name: string;
    freezeRows?: number;
    freezeColumns?: number;
    autoFilter?: boolean;
    showGridLines?: boolean;
    showHeaders?: boolean;
  }): ExcelConfigBuilderService {
    this.config.worksheet = {
      name: options.name,
      freezeRows: options.freezeRows,
      freezeColumns: options.freezeColumns,
      autoFilter: options.autoFilter ?? true,
      showGridLines: options.showGridLines ?? true,
      showHeaders: options.showHeaders ?? true,
    };
    return this;
  }

  withSimpleWorksheet(name: string): ExcelConfigBuilderService {
    return this.withWorksheet({
      name,
      autoFilter: true,
      showGridLines: true,
      showHeaders: true,
    });
  }

  withFrozenPanes(
    rows: number,
    columns: number = 0,
  ): ExcelConfigBuilderService {
    if (!this.config.worksheet) {
      this.config.worksheet = {
        name: 'Report',
        autoFilter: true,
        showGridLines: true,
        showHeaders: true,
      };
    }

    this.config.worksheet.freezeRows = rows;
    this.config.worksheet.freezeColumns = columns;
    return this;
  }

  /**
   * 🎨 Configurar estilos
   */
  withStyling(styling: ExcelStylingConfig): ExcelConfigBuilderService {
    this.config.styling = styling;
    return this;
  }

  withHeaderStyle(style: ExcelCellStyle): ExcelConfigBuilderService {
    if (!this.config.styling) {
      this.config.styling = {
        headerStyle: style,
        dataStyle: { font: { color: '000000' } },
      };
    } else {
      this.config.styling.headerStyle = style;
    }
    return this;
  }

  withDataStyle(style: ExcelCellStyle): ExcelConfigBuilderService {
    if (!this.config.styling) {
      this.config.styling = {
        headerStyle: { font: { bold: true, color: '000000' } },
        dataStyle: style,
      };
    } else {
      this.config.styling.dataStyle = style;
    }
    return this;
  }

  withAlternateRowColor(color: string): ExcelConfigBuilderService {
    if (!this.config.styling) {
      this.config.styling = {
        headerStyle: { font: { bold: true, color: '000000' } },
        dataStyle: { font: { color: '000000' } },
      };
    }
    this.config.styling.alternateRowColor = color;
    return this;
  }

  withRowStyles(
    evenRowStyle: ExcelCellStyle,
    oddRowStyle: ExcelCellStyle,
  ): ExcelConfigBuilderService {
    if (!this.config.styling) {
      this.config.styling = {
        headerStyle: { font: { bold: true, color: '000000' } },
        dataStyle: { font: { color: '000000' } },
      };
    }
    this.config.styling.evenRowStyle = evenRowStyle;
    this.config.styling.oddRowStyle = oddRowStyle;
    return this;
  }

  /**
   * 📐 Configurar formateo
   */
  withFormatting(formatting: ExcelFormattingConfig): ExcelConfigBuilderService {
    this.config.formatting = formatting;
    return this;
  }

  withDateFormat(format: string): ExcelConfigBuilderService {
    if (!this.config.formatting) {
      this.config.formatting = {
        dateFormat: format,
        numberFormat: '#,##0.00',
        currencyFormat: '$#,##0.00',
        percentFormat: '0.00%',
        booleanFormat: { true: 'Sí', false: 'No' },
      };
    } else {
      this.config.formatting.dateFormat = format;
    }
    return this;
  }

  withCurrencyFormat(format: string): ExcelConfigBuilderService {
    if (!this.config.formatting) {
      this.config.formatting = {
        dateFormat: 'dd/mm/yyyy',
        numberFormat: '#,##0.00',
        currencyFormat: format,
        percentFormat: '0.00%',
        booleanFormat: { true: 'Sí', false: 'No' },
      };
    } else {
      this.config.formatting.currencyFormat = format;
    }
    return this;
  }

  withNumberFormat(format: string): ExcelConfigBuilderService {
    if (!this.config.formatting) {
      this.config.formatting = {
        dateFormat: 'dd/mm/yyyy',
        numberFormat: format,
        currencyFormat: '$#,##0.00',
        percentFormat: '0.00%',
        booleanFormat: { true: 'Sí', false: 'No' },
      };
    } else {
      this.config.formatting.numberFormat = format;
    }
    return this;
  }

  withBooleanFormat(
    trueValue: string,
    falseValue: string,
  ): ExcelConfigBuilderService {
    if (!this.config.formatting) {
      this.config.formatting = {
        dateFormat: 'dd/mm/yyyy',
        numberFormat: '#,##0.00',
        currencyFormat: '$#,##0.00',
        percentFormat: '0.00%',
        booleanFormat: { true: trueValue, false: falseValue },
      };
    } else {
      this.config.formatting.booleanFormat = {
        true: trueValue,
        false: falseValue,
      };
    }
    return this;
  }

  /**
   * 🎨 Configurar branding
   */
  withBranding(branding: BrandingConfig): ExcelConfigBuilderService {
    this.config.branding = branding;
    return this;
  }

  /**
   * ⚙️ Configurar opciones específicas de Excel
   */
  withExcelOptions(options: {
    compression?: boolean;
    password?: string;
    creator?: string;
    lastModifiedBy?: string;
  }): ExcelConfigBuilderService {
    this.config.excelOptions = options;
    return this;
  }

  /**
   * 🎯 Configuraciones predefinidas comunes
   */
  asSimpleReport(): ExcelConfigBuilderService {
    return this.withSimpleWorksheet('Reporte')
      .withHeaderStyle({
        font: { bold: true, color: '000000' },
        fill: { type: 'pattern', pattern: 'solid', fgColor: 'E0E0E0' },
        alignment: { horizontal: 'center', vertical: 'middle' },
      })
      .withDataStyle({
        font: { color: '000000' },
        alignment: { vertical: 'middle' },
      })
      .withFormatting({
        dateFormat: 'dd/mm/yyyy',
        numberFormat: '#,##0.00',
        currencyFormat: '$#,##0.00',
        percentFormat: '0.00%',
        booleanFormat: { true: 'Sí', false: 'No' },
      });
  }

  asProfessionalReport(): ExcelConfigBuilderService {
    return this.withTemplate(TemplateType.PROFESSIONAL)
      .withWorksheet({
        name: 'Reporte Profesional',
        freezeRows: 1,
        autoFilter: true,
        showGridLines: true,
        showHeaders: true,
      })
      .withHeaderStyle({
        font: { bold: true, color: 'FFFFFF', size: 12 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: '2F4F4F' },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thin', color: '000000' },
          left: { style: 'thin', color: '000000' },
          bottom: { style: 'thin', color: '000000' },
          right: { style: 'thin', color: '000000' },
        },
      })
      .withDataStyle({
        font: { color: '000000' },
        alignment: { vertical: 'middle' },
        border: {
          top: { style: 'thin', color: 'CCCCCC' },
          left: { style: 'thin', color: 'CCCCCC' },
          bottom: { style: 'thin', color: 'CCCCCC' },
          right: { style: 'thin', color: 'CCCCCC' },
        },
      })
      .withAlternateRowColor('F5F5F5');
  }

  asFinancialReport(): ExcelConfigBuilderService {
    return this.withTemplate(TemplateType.FINANCIAL)
      .withWorksheet({
        name: 'Reporte Financiero',
        freezeRows: 1,
        freezeColumns: 1,
        autoFilter: true,
        showGridLines: true,
        showHeaders: true,
      })
      .withHeaderStyle({
        font: { bold: true, color: 'FFFFFF', size: 11 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: '1F4E79' },
        alignment: { horizontal: 'center', vertical: 'middle' },
      })
      .withDataStyle({
        font: { color: '000000' },
        alignment: { vertical: 'middle' },
      })
      .withFormatting({
        dateFormat: 'dd/mm/yyyy',
        numberFormat: '#,##0.00',
        currencyFormat: '$#,##0.00_);[Red]($#,##0.00)',
        percentFormat: '0.00%',
        booleanFormat: { true: 'Sí', false: 'No' },
      });
  }

  asMinimalReport(): ExcelConfigBuilderService {
    return this.withTemplate(TemplateType.MINIMAL)
      .withSimpleWorksheet('Datos')
      .withHeaderStyle({
        font: { bold: true, color: '000000' },
      })
      .withDataStyle({
        font: { color: '000000' },
      })
      .withFormatting({
        dateFormat: 'dd/mm/yyyy',
        numberFormat: '0.00',
        currencyFormat: '$0.00',
        percentFormat: '0%',
        booleanFormat: { true: '✓', false: '✗' },
      });
  }

  /**
   * 🏗️ Construir configuración final
   */
  build(): ExcelReportConfig {
    // Validar configuración mínima requerida
    if (!this.config.title) {
      throw new Error('Title is required');
    }

    if (!this.config.collection) {
      throw new Error('Collection is required');
    }

    if (!this.config.fields || this.config.fields.length === 0) {
      throw new Error('At least one field is required');
    }

    // Aplicar valores por defecto
    const defaultConfig: ExcelReportConfig = {
      title: this.config.title,
      collection: this.config.collection,
      format: ReportFormat.EXCEL,
      fields: this.config.fields,

      worksheet: this.config.worksheet || {
        name: 'Report',
        autoFilter: true,
        showGridLines: true,
        showHeaders: true,
      },

      styling: this.config.styling || {
        headerStyle: {
          font: { bold: true, color: '000000' },
          fill: { type: 'pattern', pattern: 'solid', fgColor: 'E0E0E0' },
        },
        dataStyle: {
          font: { color: '000000' },
        },
      },

      formatting: this.config.formatting || {
        dateFormat: 'dd/mm/yyyy',
        numberFormat: '#,##0.00',
        currencyFormat: '$#,##0.00',
        percentFormat: '0.00%',
        booleanFormat: { true: 'Sí', false: 'No' },
      },

      ...this.config,
    };

    return defaultConfig;
  }

  /**
   * 🔄 Reset builder para reutilización
   */
  reset(): ExcelConfigBuilderService {
    this.config = {};
    return this;
  }

  /**
   * 📋 Clonar configuración actual
   */
  clone(): ExcelConfigBuilderService {
    const newBuilder = new ExcelConfigBuilderService();
    newBuilder.config = JSON.parse(JSON.stringify(this.config));
    return newBuilder;
  }
}
