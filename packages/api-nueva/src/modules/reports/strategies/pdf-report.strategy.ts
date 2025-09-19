/**
 * 📄 PDF REPORT STRATEGY
 * Strategy Pattern universal para generación de reportes PDF con cache inteligente
 * Soporte para templates dinámicos y configuraciones avanzadas
 */

import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PDFReportConfig, ValidationResult } from '../types/report.types';
import { IReportStrategy } from '../services/report-factory.service';
import { TemplateService, TemplateData, TemplateConfig } from '../services/template.service';
import { PuppeteerManagerService, PDFOptions } from '../services/puppeteer-manager.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ReportFormat, FieldType } from '../enums';

@Injectable()
export class PDFReportStrategy implements IReportStrategy {
  private readonly logger = new Logger(PDFReportStrategy.name);
  private readonly cachePrefix = 'pdf-strategy:';
  private readonly cacheTtl: number;

  constructor(
    private readonly templateService: TemplateService,
    private readonly puppeteerManager: PuppeteerManagerService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {
    this.cacheTtl = this.configService.get('reports.expirationHours', 24) * 3600; // Convertir a segundos
  }

  /**
   * 🎯 Generar PDF usando Puppeteer + Handlebars con cache inteligente
   */
  async generate(config: PDFReportConfig, data: Record<string, unknown>[]): Promise<Buffer> {
    const startTime = Date.now();
    this.logger.log(
      `Generating PDF report: ${config.title} (${data.length} records)`,
    );

    try {
      // 1. Validar configuración
      const validation = this.validate(config);
      if (!validation.isValid) {
        throw new BadRequestException(`Invalid PDF config: ${validation.errors.join(', ')}`);
      }

      // 2. Verificar cache primero
      const cacheKey = this.generateCacheKey(config, data);
      const cached = await this.cacheManager.get<Buffer>(cacheKey);
      if (cached) {
        this.logger.debug(`PDF cache hit: ${config.title}`);
        return cached;
      }

      // 3. Procesar datos según configuración de campos
      const processedData = this.processData(data, config);

      // 4. Preparar datos para template universal
      const templateData: TemplateData = {
        title: config.title,
        subtitle: config.subtitle,
        data: processedData,
        metadata: {
          generatedAt: new Date(),
          totalRecords: data.length,
          collection: config.collection,
          filters: config.query?.filters,
        },
        brand: {
          companyName: config.branding?.companyName || 'Sistema de Reportes',
          primaryColor: config.branding?.colors?.primary || '#007bff',
          secondaryColor: config.branding?.colors?.secondary || '#6c757d',
          accentColor: config.branding?.colors?.accent || '#28a745',
          logoUrl: config.branding?.logo,
          fontFamily: config.branding?.fontFamily,
        },
      };

      const templateConfig: TemplateConfig = {
        name: config.template || 'default',
        format: 'pdf',
        brand: templateData.brand,
      };

      // 5. Generar HTML usando template universal
      const htmlContent = await this.templateService.generateHTML(
        templateConfig.name,
        templateData,
        templateConfig,
      );

      // 6. Preparar opciones PDF
      const pdfOptions: PDFOptions = {
        format: config.layout.pageSize,
        landscape: config.layout.orientation === 'landscape',
        margin: config.layout.margins,
        printBackground: config.pdfOptions?.printBackground ?? true,
        displayHeaderFooter: config.pdfOptions?.displayHeaderFooter ?? false,
        preferCSSPageSize: config.pdfOptions?.preferCSSPageSize ?? true,
        timeout: this.getTimeoutForDataSize(data.length),
        scale: config.pdfOptions?.scale || 1,
      };

      // 7. Generar PDF con Puppeteer
      const pdfBuffer = await this.puppeteerManager.generatePDF(htmlContent, pdfOptions);

      // 8. Guardar en cache
      await this.cacheManager.set(cacheKey, pdfBuffer, this.cacheTtl * 1000);

      const generationTime = Date.now() - startTime;
      this.logger.log(`PDF generated successfully in ${generationTime}ms (${pdfBuffer.length} bytes)`);

      return pdfBuffer;
    } catch (error) {
      this.logger.error(`PDF generation failed: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * ✅ Validar configuración PDF específica
   */
  validate(config: PDFReportConfig): ValidationResult {
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

    if (config.format !== ReportFormat.PDF) {
      errors.push('Invalid format for PDF strategy');
    }

    // Validaciones de layout
    if (!config.layout) {
      errors.push('Layout configuration is required');
    } else {
      if (!config.layout.pageSize) {
        errors.push('Page size is required');
      }

      if (!config.layout.orientation) {
        errors.push('Page orientation is required');
      }

      if (!config.layout.margins) {
        errors.push('Page margins are required');
      } else {
        const { top, right, bottom, left } = config.layout.margins;
        if (top < 0 || right < 0 || bottom < 0 || left < 0) {
          errors.push('Margins must be non-negative');
        }
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

        if (field.width && (field.width < 0 || field.width > 100)) {
          warnings.push(`Field ${field.key}: width should be between 0-100%`);
        }
      });
    }

    // Validaciones de header/footer
    if (config.header?.height && config.header.height < 0) {
      warnings.push('Header height should be non-negative');
    }

    if (config.footer?.height && config.footer.height < 0) {
      warnings.push('Footer height should be non-negative');
    }

    // Validaciones de branding
    if (config.branding) {
      if (!config.branding.companyName?.trim()) {
        warnings.push('Company name is recommended for branding');
      }

      if (config.branding.colors) {
        const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (!hexColorRegex.test(config.branding.colors.primary)) {
          errors.push('Invalid primary color format (use hex #000000)');
        }
        if (!hexColorRegex.test(config.branding.colors.secondary)) {
          errors.push('Invalid secondary color format (use hex #000000)');
        }
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
    const baseTime = 3000; // 3s base para setup (incluye template rendering)
    const timePerRecord = 25; // 25ms por registro (optimizado)
    const puppeteerOverhead = 1500; // 1.5s overhead de Puppeteer
    const templateOverhead = 500; // 500ms para procesamiento de template

    return baseTime + recordCount * timePerRecord + puppeteerOverhead + templateOverhead;
  }

  /**
   * 📦 Verificar si el formato es soportado
   */
  supports(format: ReportFormat): boolean {
    return format === ReportFormat.PDF;
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
      name: 'PDF Report Strategy',
      format: ReportFormat.PDF,
      features: [
        'Puppeteer-based PDF generation',
        'Handlebars templates',
        'Multiple page sizes and orientations',
        'Custom branding and styling',
        'Intelligent caching',
        'Field type formatting',
        'Nested data access',
      ],
      limitations: [
        'Requires Puppeteer (memory intensive)',
        'Limited to 10,000 records for optimal performance',
        'No real-time collaboration features',
      ],
    };
  }

  /**
   * 🔄 Procesar datos según configuración de campos
   */
  private processData(data: Record<string, unknown>[], config: PDFReportConfig): Record<string, unknown>[] {
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
   * 🔐 Generar clave de cache
   */
  private generateCacheKey(config: PDFReportConfig, data: Record<string, unknown>[]): string {
    const configHash = JSON.stringify({
      title: config.title,
      collection: config.collection,
      fields: config.fields.map(f => ({ key: f.key, type: f.type, format: f.format })),
      template: config.template,
      layout: config.layout,
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
   * ⏰ Calcular timeout basado en tamaño de datos
   */
  private getTimeoutForDataSize(recordCount: number): number {
    const baseTimeout = 30000; // 30 segundos base
    const timeoutPerRecord = 5; // 5ms por registro
    const maxTimeout = 300000; // 5 minutos máximo

    return Math.min(baseTimeout + recordCount * timeoutPerRecord, maxTimeout);
  }

  /**
   * 🧹 Limpiar cache de PDFs
   */
  async clearCache(): Promise<number> {
    await this.cacheManager.clear();
    return 0; // Cache limpiado
  }

  /**
   * 🎯 Obtener valor anidado de objeto (ej: 'user.profile.name')
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
  ): string {
    // Aplicar transformer personalizado primero
    if (transformer && value !== null && value !== undefined) {
      return transformer(value);
    }

    // Usar valor por defecto si está vacío
    if (value === null || value === undefined || value === '') {
      return defaultValue?.toString() ?? '';
    }

    switch (type) {
      case FieldType.STRING:
        return String(value);

      case FieldType.NUMBER:
        const num = Number(value);
        if (isNaN(num)) return defaultValue?.toString() ?? '0';
        return format
          ? num.toLocaleString('es-MX', { minimumFractionDigits: 2 })
          : num.toString();

      case FieldType.CURRENCY:
        const currency = Number(value);
        if (isNaN(currency)) return defaultValue?.toString() ?? '$0.00';
        const currencyCode = format || 'MXN';
        return new Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency: currencyCode,
        }).format(currency);

      case FieldType.DATE:
        const date = new Date(value);
        if (isNaN(date.getTime())) return defaultValue?.toString() ?? '';
        const dateFormat = format || 'dd/MM/yyyy';
        return this.formatDate(date, dateFormat);

      case FieldType.BOOLEAN:
        return value ? 'Sí' : 'No';

      case FieldType.EMAIL:
        return String(value);

      case FieldType.URL:
        return String(value);

      default:
        return String(value);
    }
  }

  /**
   * 📅 Formatear fecha según patrón
   */
  private formatDate(date: Date, pattern: string): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();

    return pattern
      .replace('dd', day)
      .replace('MM', month)
      .replace('yyyy', year);
  }
}
