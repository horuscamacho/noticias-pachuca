/**
 * 🏗️ REPORT CONFIG BUILDER
 * Builder Pattern principal que coordina PDF y Excel builders
 */

import { Injectable } from '@nestjs/common';
import { ReportFormat } from '../enums';
import {
  ReportConfig,
  PDFReportConfig,
  ExcelReportConfig,
} from '../types/report.types';
import { PDFConfigBuilderService } from './pdf-config.builder';
import { ExcelConfigBuilderService } from './excel-config.builder';

@Injectable()
export class ReportConfigBuilderService {
  constructor(
    private readonly pdfBuilder: PDFConfigBuilderService,
    private readonly excelBuilder: ExcelConfigBuilderService,
  ) {}

  /**
   * 🎯 Crear builder para PDF
   */
  createPDF(title: string, collection: string): PDFConfigBuilderService {
    return this.pdfBuilder.reset().create(title, collection);
  }

  /**
   * 📊 Crear builder para Excel
   */
  createExcel(title: string, collection: string): ExcelConfigBuilderService {
    return this.excelBuilder.reset().create(title, collection);
  }

  /**
   * 🔄 Crear builder según formato
   */
  create(
    format: ReportFormat,
    title: string,
    collection: string,
  ): PDFConfigBuilderService | ExcelConfigBuilderService {
    switch (format) {
      case ReportFormat.PDF:
        return this.createPDF(title, collection);
      case ReportFormat.EXCEL:
        return this.createExcel(title, collection);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * 🎨 Métodos de conveniencia para configuraciones comunes
   */

  /**
   * 📄 Crear reporte PDF simple
   */
  createSimplePDF(title: string, collection: string): PDFReportConfig {
    return this.createPDF(title, collection).asSimpleReport().build();
  }

  /**
   * 📊 Crear reporte Excel simple
   */
  createSimpleExcel(title: string, collection: string): ExcelReportConfig {
    return this.createExcel(title, collection).asSimpleReport().build();
  }

  /**
   * 💼 Crear reporte profesional
   */
  createProfessional(
    format: ReportFormat,
    title: string,
    collection: string,
  ): ReportConfig {
    switch (format) {
      case ReportFormat.PDF:
        return this.createPDF(title, collection).asProfessionalReport().build();
      case ReportFormat.EXCEL:
        return this.createExcel(title, collection)
          .asProfessionalReport()
          .build();
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * 💰 Crear reporte financiero
   */
  createFinancial(
    format: ReportFormat,
    title: string,
    collection: string,
  ): ReportConfig {
    switch (format) {
      case ReportFormat.PDF:
        return this.createPDF(title, collection).asFinancialReport().build();
      case ReportFormat.EXCEL:
        return this.createExcel(title, collection).asFinancialReport().build();
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * ✨ Crear reporte minimalista
   */
  createMinimal(
    format: ReportFormat,
    title: string,
    collection: string,
  ): ReportConfig {
    switch (format) {
      case ReportFormat.PDF:
        return this.createPDF(title, collection).asMinimalReport().build();
      case ReportFormat.EXCEL:
        return this.createExcel(title, collection).asMinimalReport().build();
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * 🚀 Crear configuración por defecto según formato
   */
  createDefault(
    format: ReportFormat,
    title: string,
    collection: string,
  ): ReportConfig {
    return this.createSimple(format, title, collection);
  }

  /**
   * 📋 Crear configuración simple según formato
   */
  createSimple(
    format: ReportFormat,
    title: string,
    collection: string,
  ): ReportConfig {
    switch (format) {
      case ReportFormat.PDF:
        return this.createSimplePDF(title, collection);
      case ReportFormat.EXCEL:
        return this.createSimpleExcel(title, collection);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * 🔧 Validar configuración antes de build
   */
  validateConfig(config: Partial<ReportConfig>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!config.title?.trim()) {
      errors.push('Title is required');
    }

    if (!config.collection?.trim()) {
      errors.push('Collection is required');
    }

    if (!config.fields || config.fields.length === 0) {
      errors.push('At least one field is required');
    }

    if (
      !config.format ||
      !Object.values(ReportFormat).includes(config.format)
    ) {
      errors.push('Valid format is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 📄 Template methods para diferentes tipos de reportes de datos
   */

  /**
   * 👥 Crear reporte de usuarios
   */
  createUserReport(
    format: ReportFormat,
    title: string = 'Reporte de Usuarios',
  ): ReportConfig {
    const builder = this.create(format, title, 'users');

    if (format === ReportFormat.PDF) {
      return (builder as PDFConfigBuilderService)
        .asSimpleReport()
        .addField('_id', 'ID', 'string' as any)
        .addField('name', 'Nombre', 'string' as any)
        .addField('email', 'Email', 'email' as any)
        .addField('createdAt', 'Fecha Registro', 'date' as any, {
          format: 'dd/MM/yyyy',
        })
        .addField('isActive', 'Activo', 'boolean' as any)
        .build();
    } else {
      return (builder as ExcelConfigBuilderService)
        .asSimpleReport()
        .addField('_id', 'ID', 'string' as any)
        .addField('name', 'Nombre', 'string' as any)
        .addField('email', 'Email', 'email' as any)
        .addField('createdAt', 'Fecha Registro', 'date' as any, {
          format: 'dd/MM/yyyy',
        })
        .addField('isActive', 'Activo', 'boolean' as any)
        .build();
    }
  }

  /**
   * 🛒 Crear reporte de ventas
   */
  createSalesReport(
    format: ReportFormat,
    title: string = 'Reporte de Ventas',
  ): ReportConfig {
    const builder = this.create(format, title, 'sales');

    if (format === ReportFormat.PDF) {
      return (builder as PDFConfigBuilderService)
        .asFinancialReport()
        .addField('orderNumber', 'Número Orden', 'string' as any)
        .addField('customer.name', 'Cliente', 'string' as any)
        .addField('total', 'Total', 'currency' as any, { format: 'MXN' })
        .addField('createdAt', 'Fecha', 'date' as any, { format: 'dd/MM/yyyy' })
        .addField('status', 'Estado', 'string' as any)
        .build();
    } else {
      return (builder as ExcelConfigBuilderService)
        .asFinancialReport()
        .addField('orderNumber', 'Número Orden', 'string' as any)
        .addField('customer.name', 'Cliente', 'string' as any)
        .addField('total', 'Total', 'currency' as any, { format: 'MXN' })
        .addField('createdAt', 'Fecha', 'date' as any, { format: 'dd/MM/yyyy' })
        .addField('status', 'Estado', 'string' as any)
        .build();
    }
  }

  /**
   * 📊 Crear reporte de inventario
   */
  createInventoryReport(
    format: ReportFormat,
    title: string = 'Reporte de Inventario',
  ): ReportConfig {
    const builder = this.create(format, title, 'products');

    if (format === ReportFormat.PDF) {
      return (builder as PDFConfigBuilderService)
        .asProfessionalReport()
        .addField('sku', 'SKU', 'string' as any)
        .addField('name', 'Producto', 'string' as any)
        .addField('category', 'Categoría', 'string' as any)
        .addField('stock', 'Stock', 'number' as any)
        .addField('price', 'Precio', 'currency' as any, { format: 'MXN' })
        .addField('lastUpdated', 'Última Actualización', 'date' as any, {
          format: 'dd/MM/yyyy',
        })
        .build();
    } else {
      return (builder as ExcelConfigBuilderService)
        .asProfessionalReport()
        .addField('sku', 'SKU', 'string' as any)
        .addField('name', 'Producto', 'string' as any)
        .addField('category', 'Categoría', 'string' as any)
        .addField('stock', 'Stock', 'number' as any)
        .addField('price', 'Precio', 'currency' as any, { format: 'MXN' })
        .addField('lastUpdated', 'Última Actualización', 'date' as any, {
          format: 'dd/MM/yyyy',
        })
        .build();
    }
  }
}
