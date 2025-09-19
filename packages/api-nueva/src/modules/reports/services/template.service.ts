/**
 * 🎨 TEMPLATE SERVICE
 * Servicio universal para manejo de templates Handlebars con cache inteligente
 * Soporte para branding dinámico y templates predefinidos
 */

import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Handlebars from 'handlebars';
import { promises as fs } from 'fs';
import { join } from 'path';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PDFReportConfig } from '../types/report.types';
import { TemplateType } from '../enums';

// 🎯 Tipos para templates universales
export interface TemplateConfig {
  name: string;
  format: 'pdf' | 'excel';
  brand?: BrandConfig;
  customCss?: string;
  customJs?: string;
}

export interface BrandConfig {
  companyName: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily?: string;
}

export interface TemplateData {
  title: string;
  subtitle?: string;
  data: Record<string, unknown>[];
  metadata: {
    generatedAt: Date;
    totalRecords: number;
    collection: string;
    filters?: Record<string, unknown>;
  };
  brand: BrandConfig;
  customStyles?: string;
}

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);
  private handlebars: typeof Handlebars;
  private readonly templatesPath: string;
  private readonly cachePrefix = 'template:';
  private readonly cacheTtl = 3600; // 1 hora
  private readonly compiledTemplates = new Map<
    string,
    HandlebarsTemplateDelegate
  >();

  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.handlebars = Handlebars.create();
    this.templatesPath = join(process.cwd(), 'src', 'modules', 'reports', 'templates');
    this.registerHelpers();
    this.precompileTemplates();
  }

  /**
   * 🎯 Renderizar template PDF principal (compatibilidad)
   */
  async renderPDFTemplate(
    config: PDFReportConfig,
    data: Record<string, unknown>[],
  ): Promise<string> {
    try {
      const templateData: TemplateData = {
        title: config.title,
        subtitle: config.subtitle,
        data,
        metadata: {
          generatedAt: new Date(),
          totalRecords: data.length,
          collection: 'legacy',
          filters: config.query?.filters,
        },
        brand: {
          companyName: config.branding?.companyName || 'Sistema de Reportes',
          primaryColor: config.branding?.colors?.primary || '#007bff',
          secondaryColor: config.branding?.colors?.secondary || '#6c757d',
          accentColor: config.branding?.colors?.accent || '#28a745',
        },
      };

      const templateConfig: TemplateConfig = {
        name: config.template || TemplateType.DEFAULT,
        format: 'pdf',
        brand: templateData.brand,
      };

      return await this.generateHTML(templateConfig.name, templateData, templateConfig);
    } catch (error) {
      this.logger.error(
        `Template rendering failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 🎨 Generar HTML desde template (Nuevo método universal)
   */
  async generateHTML(
    templateName: string,
    data: TemplateData,
    config: TemplateConfig = { name: templateName, format: 'pdf' },
  ): Promise<string> {
    try {
      const cacheKey = `${this.cachePrefix}html:${templateName}:${this.generateDataHash(data)}`;

      // Verificar cache
      const cached = await this.cacheManager.get<string>(cacheKey);
      if (cached) {
        this.logger.debug(`Template HTML cache hit: ${templateName}`);
        return cached;
      }

      // Obtener template compilado (primero intentar desde archivo, luego precompilado)
      const template = await this.getTemplateFromFile(templateName, 'html');

      // Preparar datos con brand por defecto
      const templateData = {
        ...data,
        brand: { ...this.getDefaultBrand(), ...data.brand },
        config,
        helpers: {
          currentYear: new Date().getFullYear(),
          currentDate: new Date(),
          reportId: this.generateReportId(),
        },
      };

      this.logger.debug(`Template data keys: ${Object.keys(templateData).join(', ')}`);
      this.logger.debug(`Data array length: ${Array.isArray(templateData.data) ? templateData.data.length : 'not array'}`);
      this.logger.debug(`Title: ${templateData.title}`);

      // Generar HTML
      const html = template(templateData);
      this.logger.debug(`Generated HTML length: ${html.length}`);
      this.logger.debug(`HTML preview: ${html.substring(0, 200)}...`);

      // Aplicar estilos personalizados
      const styledHtml = await this.applyCustomStyles(html, config);
      this.logger.debug(`Styled HTML length: ${styledHtml.length}`);

      // Guardar en cache
      await this.cacheManager.set(cacheKey, styledHtml, this.cacheTtl * 1000);

      this.logger.log(`HTML generated successfully for template: ${templateName}`);
      return styledHtml;

    } catch (error) {
      this.logger.error(`Failed to generate HTML for template ${templateName}: ${error.message}`);
      throw new BadRequestException(`Template generation failed: ${error.message}`);
    }
  }

  /**
   * 📊 Generar configuración para Excel
   */
  async generateExcelConfig(
    templateName: string,
    data: TemplateData,
    config: TemplateConfig = { name: templateName, format: 'excel' },
  ): Promise<{
    workbook: unknown;
    worksheets: unknown[];
    styles: unknown;
  }> {
    try {
      const cacheKey = `${this.cachePrefix}excel:${templateName}:${this.generateDataHash(data)}`;

      // Verificar cache
      const cached = await this.cacheManager.get<unknown>(cacheKey);
      if (cached) {
        this.logger.debug(`Template Excel cache hit: ${templateName}`);
        return cached as { workbook: unknown; worksheets: unknown[]; styles: unknown };
      }

      // Obtener configuración del template
      const template = await this.getTemplateForExcel(templateName);

      // Preparar datos
      const templateData = {
        ...data,
        brand: { ...this.getDefaultBrand(), ...data.brand },
        config,
      };

      // Generar configuración Excel como string
      const excelConfigStr = template(templateData);

      // Parsear a objeto
      const excelConfig = {
        workbook: JSON.parse(excelConfigStr).workbook || {},
        worksheets: JSON.parse(excelConfigStr).worksheets || [],
        styles: JSON.parse(excelConfigStr).styles || {},
      };

      // Guardar en cache
      await this.cacheManager.set(cacheKey, excelConfig, this.cacheTtl * 1000);

      this.logger.log(`Excel config generated successfully for template: ${templateName}`);
      return excelConfig;

    } catch (error) {
      this.logger.error(`Failed to generate Excel config for template ${templateName}: ${error.message}`);
      throw new BadRequestException(`Excel template generation failed: ${error.message}`);
    }
  }

  /**
   * 🏗️ Obtener template compilado (legacy)
   */
  private getCompiledTemplate(
    templateType: TemplateType | string,
  ): HandlebarsTemplateDelegate {
    // Mapear string a TemplateType si es necesario
    let templateKey: string;
    if (typeof templateType === 'string') {
      switch (templateType.toLowerCase()) {
        case 'default':
          templateKey = TemplateType.DEFAULT;
          break;
        case 'professional':
          templateKey = TemplateType.PROFESSIONAL;
          break;
        case 'minimal':
          templateKey = TemplateType.MINIMAL;
          break;
        case 'financial':
          templateKey = TemplateType.FINANCIAL;
          break;
        case 'corporate':
          templateKey = TemplateType.CORPORATE;
          break;
        default:
          templateKey = TemplateType.DEFAULT; // Fallback al default
          break;
      }
    } else {
      templateKey = templateType;
    }

    const template = this.compiledTemplates.get(templateKey);
    if (!template) {
      // Si no se encuentra, usar el template por defecto
      const defaultTemplate = this.compiledTemplates.get(TemplateType.DEFAULT);
      if (!defaultTemplate) {
        throw new Error(`Default template not found`);
      }
      return defaultTemplate;
    }
    return template;
  }

  /**
   * 📂 Obtener template compilado desde archivo
   */
  private async getTemplateFromFile(
    templateName: string,
    type: 'html' | 'excel',
  ): Promise<HandlebarsTemplateDelegate> {
    const cacheKey = `${this.cachePrefix}compiled:${templateName}:${type}`;

    // Verificar cache
    const cached = await this.cacheManager.get<string>(cacheKey);
    if (cached) {
      return this.handlebars.compile(cached);
    }

    // Leer archivo de template
    const templatePath = join(this.templatesPath, type, `${templateName}.${type === 'html' ? 'hbs' : 'json'}`);

    try {
      const templateContent = await fs.readFile(templatePath, 'utf-8');

      // Guardar en cache
      await this.cacheManager.set(cacheKey, templateContent, this.cacheTtl * 24 * 1000); // 24 horas

      return this.handlebars.compile(templateContent);

    } catch (error) {
      if (error.code === 'ENOENT') {
        // Si no existe el template, usar el compilado
        return this.getCompiledTemplate(templateName);
      }
      throw error;
    }
  }

  /**
   * 📊 Obtener template para Excel
   */
  private async getTemplateForExcel(templateName: string): Promise<HandlebarsTemplateDelegate> {
    try {
      return await this.getTemplateFromFile(templateName, 'excel');
    } catch {
      // Fallback a template por defecto
      return this.getDefaultExcelTemplate();
    }
  }

  /**
   * 📋 Pre-compilar todos los templates
   */
  private precompileTemplates(): void {
    // Template por defecto
    this.compiledTemplates.set(
      TemplateType.DEFAULT,
      this.handlebars.compile(this.getDefaultTemplate()),
    );

    // Template profesional
    this.compiledTemplates.set(
      TemplateType.PROFESSIONAL,
      this.handlebars.compile(this.getProfessionalTemplate()),
    );

    // Template minimalista
    this.compiledTemplates.set(
      TemplateType.MINIMAL,
      this.handlebars.compile(this.getMinimalTemplate()),
    );

    // Template financiero
    this.compiledTemplates.set(
      TemplateType.FINANCIAL,
      this.handlebars.compile(this.getFinancialTemplate()),
    );

    // Template corporativo
    this.compiledTemplates.set(
      TemplateType.CORPORATE,
      this.handlebars.compile(this.getCorporateTemplate()),
    );

    this.logger.log(`Precompiled ${this.compiledTemplates.size} templates`);
  }

  /**
   * 🛠️ Registrar helpers de Handlebars
   */
  private registerHelpers(): void {
    // Helper para formatear fechas
    this.handlebars.registerHelper(
      'formatDate',
      (date: Date, format: string = 'dd/MM/yyyy') => {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';

        switch (format) {
          case 'dd/MM/yyyy':
            return d.toLocaleDateString('es-ES');
          case 'yyyy-MM-dd':
            return d.toISOString().split('T')[0];
          case 'full':
            return d.toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
          default:
            return d.toLocaleDateString('es-ES');
        }
      },
    );

    // Helper para formatear números
    this.handlebars.registerHelper(
      'formatNumber',
      (value: number, decimals: number = 2) => {
        if (typeof value !== 'number') return value;
        return value.toLocaleString('es-ES', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
      },
    );

    // Helper para formatear moneda
    this.handlebars.registerHelper(
      'formatCurrency',
      (value: number, currency: string = 'MXN') => {
        if (typeof value !== 'number') return value;
        return new Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency: currency,
        }).format(value);
      },
    );

    // Helper condicional
    this.handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
      return arg1 == arg2 ? options.fn(this) : options.inverse(this);
    });

    this.handlebars.registerHelper('ifNotEquals', function (arg1, arg2, options) {
      return arg1 != arg2 ? options.fn(this) : options.inverse(this);
    });

    // Helper para índice de fila
    this.handlebars.registerHelper('rowIndex', (index: number) => index + 1);

    // Helper para clases CSS alternadas
    this.handlebars.registerHelper('rowClass', (index: number) => {
      return index % 2 === 0 ? 'even-row' : 'odd-row';
    });
    this.logger.debug('Registered rowClass helper');

    // Helper para loops con índice
    this.handlebars.registerHelper('eachWithIndex', function (array, options) {
      let result = '';
      for (let i = 0; i < array.length; i++) {
        result += options.fn({
          ...array[i],
          index: i,
          isFirst: i === 0,
          isLast: i === array.length - 1,
          isEven: i % 2 === 0,
          isOdd: i % 2 !== 0,
        });
      }
      return result;
    });

    // Helper para truncar texto
    this.handlebars.registerHelper('truncate', (str: string, length = 50) => {
      if (!str || str.length <= length) return str;
      return str.substring(0, length) + '...';
    });

    // Helper para capitalizar
    this.handlebars.registerHelper('capitalize', (str: string) => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    });

    // Helper para JSON stringify
    this.handlebars.registerHelper('json', (obj: unknown) => {
      return JSON.stringify(obj, null, 2);
    });

    this.logger.log('Handlebars helpers registered successfully');
  }

  /**
   * 🎨 Aplicar estilos personalizados
   */
  private async applyCustomStyles(html: string, config: TemplateConfig): Promise<string> {
    let styledHtml = html;

    // Aplicar CSS personalizado
    if (config.customCss) {
      const customStyles = `<style>${config.customCss}</style>`;
      styledHtml = styledHtml.replace('</head>', `${customStyles}</head>`);
    }

    // Aplicar JS personalizado
    if (config.customJs) {
      const customScript = `<script>${config.customJs}</script>`;
      styledHtml = styledHtml.replace('</body>', `${customScript}</body>`);
    }

    return styledHtml;
  }

  /**
   * 🎯 Brand por defecto
   */
  private getDefaultBrand(): BrandConfig {
    return {
      companyName: 'Sistema de Reportes',
      primaryColor: '#007bff',
      secondaryColor: '#6c757d',
      accentColor: '#28a745',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    };
  }

  /**
   * 🔐 Generar hash de datos para cache
   */
  private generateDataHash(data: TemplateData): string {
    const key = JSON.stringify({
      dataLength: data.data.length,
      collection: data.metadata.collection,
      title: data.title,
      brand: data.brand,
    });
    return Buffer.from(key).toString('base64').substring(0, 16);
  }

  /**
   * 🎲 Generar ID único de reporte
   */
  private generateReportId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `RPT-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * 📋 Listar templates disponibles
   */
  async getAvailableTemplates(): Promise<{
    html: string[];
    excel: string[];
  }> {
    try {
      const htmlPath = join(this.templatesPath, 'html');
      const excelPath = join(this.templatesPath, 'excel');

      const [htmlFiles, excelFiles] = await Promise.all([
        fs.readdir(htmlPath).catch(() => []),
        fs.readdir(excelPath).catch(() => []),
      ]);

      return {
        html: htmlFiles.filter(f => f.endsWith('.hbs')).map(f => f.replace('.hbs', '')),
        excel: excelFiles.filter(f => f.endsWith('.json')).map(f => f.replace('.json', '')),
      };
    } catch (error) {
      this.logger.warn(`Failed to list templates: ${error.message}`);
      return { html: ['default'], excel: ['default'] };
    }
  }

  /**
   * 🧹 Limpiar cache de templates
   */
  async clearCache(templateName?: string): Promise<number> {
    const pattern = templateName
      ? `${this.cachePrefix}*${templateName}*`
      : `${this.cachePrefix}*`;

    // CacheManager no tiene del por patrón, usaremos clear para todo el cache
    await this.cacheManager.clear();
    return 0; // Cache limpiado
  }

  /**
   * 📊 Template por defecto para Excel
   */
  private getDefaultExcelTemplate(): HandlebarsTemplateDelegate {
    const defaultExcel = JSON.stringify({
      workbook: {
        properties: {
          title: '{{title}}',
          subject: '{{subtitle}}',
          creator: '{{brand.companyName}}',
        },
      },
      worksheets: [
        {
          name: 'Datos',
          columns: '{{json data.0}}',
          rows: '{{json data}}',
        },
      ],
      styles: {
        header: {
          font: { bold: true, color: { argb: 'FFFFFF' } },
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '{{brand.primaryColor}}' } },
        },
      },
    });
    return this.handlebars.compile(defaultExcel);
  }

  /**
   * 📄 TEMPLATES HTML
   */

  private getDefaultTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{title}}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #eee;
        }

        .title {
            font-size: 24px;
            font-weight: bold;
            color: {{#if brand.primaryColor}}{{brand.primaryColor}}{{else}}#2c3e50{{/if}};
            margin-bottom: 10px;
        }

        .subtitle {
            font-size: 16px;
            color: #666;
            margin-bottom: 15px;
        }

        .metadata {
            font-size: 11px;
            color: #888;
        }

        .table-container {
            width: 100%;
            overflow-x: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }

        th {
            background-color: {{#if branding.colors.primary}}{{branding.colors.primary}}{{else}}#34495e{{/if}};
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
            font-size: 11px;
        }

        td {
            padding: 10px 8px;
            border-bottom: 1px solid #ddd;
            font-size: 11px;
        }

        .even-row {
            background-color: #f9f9f9;
        }

        .odd-row {
            background-color: white;
        }

        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            font-size: 10px;
            color: #888;
        }

        .page-break {
            page-break-before: always;
        }
    </style>
</head>
<body>
    {{#if hasHeader}}
    <div class="header">
        <div class="title">{{title}}</div>
        {{#if subtitle}}
        <div class="subtitle">{{subtitle}}</div>
        {{/if}}
        <div class="metadata">
            Generado el {{formatDate metadata.generatedAt 'dd/MM/yyyy'}} | Total de registros: {{metadata.totalRecords}}
            {{#if brand.companyName}} | {{brand.companyName}}{{/if}}
        </div>
    </div>
    {{/if}}

    <div class="table-container">
        <table>
            <thead>
                <tr>
                    {{#each config.fields}}
                    <th style="{{#if width}}width: {{width}}%;{{/if}} {{#if align}}text-align: {{align}};{{/if}}">
                        {{label}}
                    </th>
                    {{/each}}
                </tr>
            </thead>
            <tbody>
                {{#each data}}
                <tr class="{{rowClass @index}}">
                    {{#each ../config.fields}}
                    <td style="{{#if align}}text-align: {{align}};{{/if}}">
                        {{#ifEquals type 'date'}}
                            {{formatDate (lookup ../this key) format}}
                        {{else}}{{#ifEquals type 'currency'}}
                            {{formatCurrency (lookup ../this key) format}}
                        {{else}}{{#ifEquals type 'number'}}
                            {{formatNumber (lookup ../this key)}}
                        {{else}}
                            {{lookup ../this key}}
                        {{/ifEquals}}{{/ifEquals}}{{/ifEquals}}
                    </td>
                    {{/each}}
                </tr>
                {{/each}}
            </tbody>
        </table>
    </div>

    {{#if hasFooter}}
    <div class="footer">
        {{#if config.footer.text}}{{config.footer.text}}<br>{{/if}}
        {{#if config.footer.showGenerated}}Generado automáticamente por Sistema de Reportes{{/if}}
    </div>
    {{/if}}
</body>
</html>`;
  }

  private getProfessionalTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{title}}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #2c3e50;
            background: white;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            margin-bottom: 40px;
        }

        .title {
            font-size: 28px;
            font-weight: 300;
            margin-bottom: 10px;
            letter-spacing: 1px;
        }

        .subtitle {
            font-size: 16px;
            opacity: 0.9;
            margin-bottom: 20px;
        }

        .metadata {
            font-size: 12px;
            opacity: 0.8;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
        }

        th {
            background: #34495e;
            color: white;
            padding: 15px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        td {
            padding: 12px;
            border-bottom: 1px solid #ecf0f1;
            font-size: 11px;
        }

        .even-row {
            background-color: #f8f9fa;
        }

        .footer {
            margin-top: 40px;
            padding: 20px;
            text-align: center;
            font-size: 11px;
            color: #7f8c8d;
            background: #ecf0f1;
            border-radius: 6px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">{{config.title}}</div>
        {{#if config.subtitle}}<div class="subtitle">{{config.subtitle}}</div>{{/if}}
        <div class="metadata">
            {{formatDate metadata.generatedAt 'dd/MM/yyyy'}} | {{metadata.recordCount}} registros
            {{#if branding.companyName}} | {{branding.companyName}}{{/if}}
        </div>
    </div>

    <table>
        <thead>
            <tr>
                {{#each config.fields}}
                <th style="{{#if width}}width: {{width}}%;{{/if}} {{#if align}}text-align: {{align}};{{/if}}">{{label}}</th>
                {{/each}}
            </tr>
        </thead>
        <tbody>
            {{#each data}}
            <tr class="{{rowClass @index}}">
                {{#each ../config.fields}}
                <td style="{{#if align}}text-align: {{align}};{{/if}}">
                    {{#ifEquals type 'date'}}{{formatDate (lookup ../this key) format}}
                    {{else}}{{#ifEquals type 'currency'}}{{formatCurrency (lookup ../this key) format}}
                    {{else}}{{#ifEquals type 'number'}}{{formatNumber (lookup ../this key)}}
                    {{else}}{{lookup ../this key}}{{/ifEquals}}{{/ifEquals}}{{/ifEquals}}
                </td>
                {{/each}}
            </tr>
            {{/each}}
        </tbody>
    </table>

    <div class="footer">
        {{#if config.footer.text}}{{config.footer.text}}<br>{{/if}}
        Reporte generado automáticamente | {{formatDate metadata.generatedAt 'dd/MM/yyyy HH:mm'}}
    </div>
</body>
</html>`;
  }

  private getMinimalTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{title}}</title>
    <style>
        body { font-family: monospace; font-size: 11px; margin: 20px; }
        h1 { font-size: 18px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border: 1px solid #ddd; }
        th { background-color: #f5f5f5; font-weight: bold; }
    </style>
</head>
<body>
    <h1>{{config.title}}</h1>
    <table>
        <thead>
            <tr>{{#each config.fields}}<th>{{label}}</th>{{/each}}</tr>
        </thead>
        <tbody>
            {{#each data}}
            <tr>
                {{#each ../config.fields}}
                <td>{{lookup ../this key}}</td>
                {{/each}}
            </tr>
            {{/each}}
        </tbody>
    </table>
</body>
</html>`;
  }

  private getFinancialTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{title}}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            font-size: 11px;
            color: #1a1a1a;
            margin: 0;
            padding: 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            border: 2px solid #2c3e50;
        }

        .title {
            font-size: 22px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .confidential {
            color: #e74c3c;
            font-weight: bold;
            font-size: 12px;
            margin-top: 15px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            border: 2px solid #2c3e50;
        }

        th {
            background-color: #2c3e50;
            color: white;
            padding: 12px 8px;
            text-align: center;
            font-weight: bold;
            font-size: 10px;
            text-transform: uppercase;
            border: 1px solid #34495e;
        }

        td {
            padding: 8px;
            border: 1px solid #bdc3c7;
            font-size: 10px;
            text-align: right;
        }

        .currency {
            font-weight: bold;
            color: #27ae60;
        }

        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 9px;
            color: #7f8c8d;
            border-top: 1px solid #bdc3c7;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">{{config.title}}</div>
        {{#if config.subtitle}}<div class="subtitle">{{config.subtitle}}</div>{{/if}}
        <div class="metadata">
            Período: {{formatDate metadata.generatedAt 'dd/MM/yyyy'}} | {{metadata.recordCount}} registros
        </div>
        <div class="confidential">CONFIDENCIAL - Solo para uso interno</div>
    </div>

    <table>
        <thead>
            <tr>
                {{#each config.fields}}
                <th style="{{#if align}}text-align: {{align}};{{/if}}">{{label}}</th>
                {{/each}}
            </tr>
        </thead>
        <tbody>
            {{#each data}}
            <tr>
                {{#each ../config.fields}}
                <td style="{{#if align}}text-align: {{align}};{{/if}}"
                    class="{{#ifEquals type 'currency'}}currency{{/ifEquals}}">
                    {{#ifEquals type 'date'}}{{formatDate (lookup ../this key) format}}
                    {{else}}{{#ifEquals type 'currency'}}{{formatCurrency (lookup ../this key) format}}
                    {{else}}{{#ifEquals type 'number'}}{{formatNumber (lookup ../this key)}}
                    {{else}}{{lookup ../this key}}{{/ifEquals}}{{/ifEquals}}{{/ifEquals}}
                </td>
                {{/each}}
            </tr>
            {{/each}}
        </tbody>
    </table>

    <div class="footer">
        Este documento contiene información confidencial y está destinado únicamente para uso autorizado.<br>
        Generado automáticamente el {{formatDate metadata.generatedAt 'dd/MM/yyyy HH:mm'}}
    </div>
</body>
</html>`;
  }

  private getCorporateTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{title}}</title>
    <style>
        body {
            font-family: 'Helvetica', Arial, sans-serif;
            font-size: 12px;
            color: #333;
            margin: 0;
            padding: 0;
        }

        .header {
            background: {{#if branding.colors.primary}}{{branding.colors.primary}}{{else}}#1e3a8a{{/if}};
            color: white;
            padding: 40px 30px;
            position: relative;
        }

        .logo {
            position: absolute;
            top: 20px;
            right: 30px;
            max-height: 60px;
        }

        .title {
            font-size: 26px;
            font-weight: 300;
            margin-bottom: 10px;
        }

        .company {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 15px;
        }

        .content {
            padding: 30px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        th {
            background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
            color: #495057;
            padding: 15px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 11px;
            border-bottom: 2px solid #dee2e6;
        }

        td {
            padding: 12px;
            border-bottom: 1px solid #dee2e6;
            font-size: 11px;
        }

        .even-row {
            background-color: #f8f9fa;
        }

        .footer {
            background: #f8f9fa;
            padding: 20px 30px;
            margin-top: 30px;
            border-top: 3px solid {{#if branding.colors.primary}}{{branding.colors.primary}}{{else}}#1e3a8a{{/if}};
            font-size: 10px;
            color: #6c757d;
        }
    </style>
</head>
<body>
    <div class="header">
        {{#if branding.logo}}<img src="{{branding.logo}}" class="logo" alt="Logo">{{/if}}
        <div class="title">{{config.title}}</div>
        <div class="company">{{#if branding.companyName}}{{branding.companyName}}{{else}}Empresa{{/if}}</div>
        {{#if config.subtitle}}<div class="subtitle">{{config.subtitle}}</div>{{/if}}
    </div>

    <div class="content">
        <table>
            <thead>
                <tr>
                    {{#each config.fields}}
                    <th style="{{#if align}}text-align: {{align}};{{/if}}">{{label}}</th>
                    {{/each}}
                </tr>
            </thead>
            <tbody>
                {{#each data}}
                <tr class="{{rowClass @index}}">
                    {{#each ../config.fields}}
                    <td style="{{#if align}}text-align: {{align}};{{/if}}">
                        {{#ifEquals type 'date'}}{{formatDate (lookup ../this key) format}}
                        {{else}}{{#ifEquals type 'currency'}}{{formatCurrency (lookup ../this key) format}}
                        {{else}}{{#ifEquals type 'number'}}{{formatNumber (lookup ../this key)}}
                        {{else}}{{lookup ../this key}}{{/ifEquals}}{{/ifEquals}}{{/ifEquals}}
                    </td>
                    {{/each}}
                </tr>
                {{/each}}
            </tbody>
        </table>
    </div>

    <div class="footer">
        <strong>{{#if branding.companyName}}{{branding.companyName}}{{else}}Empresa{{/if}}</strong><br>
        {{#if branding.address}}{{branding.address}}<br>{{/if}}
        {{#if branding.phone}}Tel: {{branding.phone}}{{/if}}
        {{#if branding.email}} | Email: {{branding.email}}{{/if}}
        {{#if branding.website}} | {{branding.website}}{{/if}}<br>
        Reporte generado el {{formatDate metadata.generatedAt 'dd/MM/yyyy HH:mm'}}
    </div>
</body>
</html>`;
  }
}
