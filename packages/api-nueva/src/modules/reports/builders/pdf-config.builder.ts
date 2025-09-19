/**
 * 🏗️ PDF CONFIG BUILDER
 * Builder Pattern para construcción fluida de configuraciones PDF
 */

import { Injectable } from '@nestjs/common';
import {
  PDFReportConfig,
  PDFLayoutConfig,
  PDFHeaderConfig,
  PDFFooterConfig,
  FieldConfig,
  BrandingConfig,
  FilterConfig,
  SortConfig,
  PaginationConfig,
} from '../types/report.types';
import {
  ReportFormat,
  PageSize,
  PageOrientation,
  FieldType,
  AlignType,
  TemplateType,
} from '../enums';

@Injectable()
export class PDFConfigBuilderService {
  private config: Partial<PDFReportConfig> = {};

  /**
   * 🎯 Inicializar builder con configuración básica
   */
  create(title: string, collection: string): PDFConfigBuilderService {
    this.config = {
      title,
      collection,
      format: ReportFormat.PDF,
      fields: [],
    };
    return this;
  }

  /**
   * 📝 Configurar información básica
   */
  withSubtitle(subtitle: string): PDFConfigBuilderService {
    this.config.subtitle = subtitle;
    return this;
  }

  withTemplate(template: TemplateType): PDFConfigBuilderService {
    this.config.template = template;
    return this;
  }

  withMetadata(metadata: {
    author?: string;
    subject?: string;
    keywords?: string[];
    createdBy?: string;
    department?: string;
  }): PDFConfigBuilderService {
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
  ): PDFConfigBuilderService {
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

  addFields(fields: FieldConfig[]): PDFConfigBuilderService {
    this.config.fields = [...(this.config.fields || []), ...fields];
    return this;
  }

  /**
   * 🔍 Configurar filtros y ordenamiento
   */
  withFilters(filters: FilterConfig): PDFConfigBuilderService {
    this.config.filters = filters;
    return this;
  }

  withSorting(sorting: SortConfig): PDFConfigBuilderService {
    this.config.sorting = sorting;
    return this;
  }

  withPagination(pagination: PaginationConfig): PDFConfigBuilderService {
    this.config.pagination = pagination;
    return this;
  }

  /**
   * 📄 Configurar layout de página
   */
  withLayout(
    pageSize: PageSize,
    orientation: PageOrientation,
    margins?: { top: number; right: number; bottom: number; left: number },
  ): PDFConfigBuilderService {
    this.config.layout = {
      pageSize,
      orientation,
      margins: margins || { top: 50, right: 50, bottom: 50, left: 50 },
    };
    return this;
  }

  withCustomLayout(layout: PDFLayoutConfig): PDFConfigBuilderService {
    this.config.layout = layout;
    return this;
  }

  /**
   * 📋 Configurar header
   */
  withHeader(options: {
    show: boolean;
    title?: string;
    subtitle?: string;
    showDate?: boolean;
    showPageNumbers?: boolean;
    logo?: string;
    height?: number;
  }): PDFConfigBuilderService {
    this.config.header = {
      show: options.show,
      title: options.title,
      subtitle: options.subtitle,
      showDate: options.showDate ?? true,
      showPageNumbers: options.showPageNumbers ?? true,
      logo: options.logo,
      height: options.height,
    };
    return this;
  }

  withSimpleHeader(title?: string, subtitle?: string): PDFConfigBuilderService {
    return this.withHeader({
      show: true,
      title,
      subtitle,
      showDate: true,
      showPageNumbers: true,
    });
  }

  withoutHeader(): PDFConfigBuilderService {
    this.config.header = {
      show: false,
      showDate: false,
      showPageNumbers: false,
    };
    return this;
  }

  /**
   * 📄 Configurar footer
   */
  withFooter(options: {
    show: boolean;
    text?: string;
    showGenerated?: boolean;
    showPageNumbers?: boolean;
    height?: number;
  }): PDFConfigBuilderService {
    this.config.footer = {
      show: options.show,
      text: options.text,
      showGenerated: options.showGenerated ?? true,
      showPageNumbers: options.showPageNumbers ?? true,
      height: options.height,
    };
    return this;
  }

  withSimpleFooter(text?: string): PDFConfigBuilderService {
    return this.withFooter({
      show: true,
      text,
      showGenerated: true,
      showPageNumbers: true,
    });
  }

  withoutFooter(): PDFConfigBuilderService {
    this.config.footer = {
      show: false,
      showGenerated: false,
      showPageNumbers: false,
    };
    return this;
  }

  /**
   * 🎨 Configurar branding
   */
  withBranding(branding: BrandingConfig): PDFConfigBuilderService {
    this.config.branding = branding;
    return this;
  }

  withSimpleBranding(
    companyName: string,
    primaryColor: string,
    secondaryColor: string,
    logo?: string,
  ): PDFConfigBuilderService {
    this.config.branding = {
      companyName,
      logo,
      colors: {
        primary: primaryColor,
        secondary: secondaryColor,
        text: '#000000',
      },
    };
    return this;
  }

  /**
   * ⚙️ Configurar opciones específicas de PDF
   */
  withPDFOptions(options: {
    printBackground?: boolean;
    displayHeaderFooter?: boolean;
    preferCSSPageSize?: boolean;
    quality?: number;
  }): PDFConfigBuilderService {
    this.config.pdfOptions = options;
    return this;
  }

  /**
   * 🎯 Configuraciones predefinidas comunes
   */
  asSimpleReport(): PDFConfigBuilderService {
    return this.withLayout(PageSize.A4, PageOrientation.PORTRAIT)
      .withSimpleHeader()
      .withSimpleFooter()
      .withPDFOptions({
        printBackground: true,
        displayHeaderFooter: false,
        preferCSSPageSize: true,
      });
  }

  asProfessionalReport(): PDFConfigBuilderService {
    return this.withTemplate(TemplateType.PROFESSIONAL)
      .withLayout(PageSize.A4, PageOrientation.PORTRAIT, {
        top: 60,
        right: 40,
        bottom: 60,
        left: 40,
      })
      .withHeader({
        show: true,
        showDate: true,
        showPageNumbers: true,
        height: 80,
      })
      .withFooter({
        show: true,
        showGenerated: true,
        showPageNumbers: true,
        height: 60,
      })
      .withPDFOptions({
        printBackground: true,
        displayHeaderFooter: true,
        preferCSSPageSize: true,
        quality: 100,
      });
  }

  asFinancialReport(): PDFConfigBuilderService {
    return this.withTemplate(TemplateType.FINANCIAL)
      .withLayout(PageSize.A4, PageOrientation.LANDSCAPE)
      .withSimpleHeader()
      .withSimpleFooter('Confidencial - Solo para uso interno')
      .withPDFOptions({
        printBackground: true,
        displayHeaderFooter: false,
        preferCSSPageSize: true,
      });
  }

  asMinimalReport(): PDFConfigBuilderService {
    return this.withTemplate(TemplateType.MINIMAL)
      .withLayout(PageSize.A4, PageOrientation.PORTRAIT, {
        top: 30,
        right: 30,
        bottom: 30,
        left: 30,
      })
      .withoutHeader()
      .withoutFooter()
      .withPDFOptions({
        printBackground: false,
        displayHeaderFooter: false,
        preferCSSPageSize: true,
      });
  }

  /**
   * 🏗️ Construir configuración final
   */
  build(): PDFReportConfig {
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
    const defaultConfig: PDFReportConfig = {
      title: this.config.title,
      collection: this.config.collection,
      format: ReportFormat.PDF,
      fields: this.config.fields,

      layout: this.config.layout || {
        pageSize: PageSize.A4,
        orientation: PageOrientation.PORTRAIT,
        margins: { top: 50, right: 50, bottom: 50, left: 50 },
      },

      header: this.config.header || {
        show: true,
        showDate: true,
        showPageNumbers: true,
      },

      footer: this.config.footer || {
        show: true,
        showGenerated: true,
        showPageNumbers: true,
      },

      pdfOptions: this.config.pdfOptions || {
        printBackground: true,
        displayHeaderFooter: false,
        preferCSSPageSize: true,
      },

      ...this.config,
    };

    return defaultConfig;
  }

  /**
   * 🔄 Reset builder para reutilización
   */
  reset(): PDFConfigBuilderService {
    this.config = {};
    return this;
  }

  /**
   * 📋 Clonar configuración actual
   */
  clone(): PDFConfigBuilderService {
    const newBuilder = new PDFConfigBuilderService();
    newBuilder.config = JSON.parse(JSON.stringify(this.config));
    return newBuilder;
  }
}
