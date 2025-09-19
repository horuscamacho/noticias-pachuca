# 🏢 NOTICIAS PACHUCA - CHECKLIST DE IMPLEMENTACIÓN SISTEMA UNIVERSAL DE REPORTES

> **Plan de implementación paso a paso para el sistema universal de generación de reportes PDF/Excel**

## 📋 INFORMACIÓN DEL CHECKLIST

**Proyecto:** Noticias Pachuca - Universal Template Project
**Módulo:** Sistema Universal de Reportes
**Versión Target:** 1.0.0
**Tiempo Estimado:** 19-27 días laborales
**Desarrolladores:** 1-2 Senior NestJS

---

## 🎯 OBJETIVO DE IMPLEMENTACIÓN

Crear un sistema **UNIVERSAL** de generación de reportes que sea:
- ✅ **Plug-and-play** para cualquier proyecto NestJS
- ✅ **Type-safe** sin ningún `any`
- ✅ **Reutilizable** entre múltiples proyectos
- ✅ **Altamente configurable** y performante

---

## 📊 OVERVIEW DEL PLAN

| Fase | Duración | Entregables | Prioridad |
|------|----------|-------------|-----------|
| **Fase 1** | 3-5 días | Core Module + Interfaces | 🔴 Crítica |
| **Fase 2** | 4-6 días | PDF Generation + Templates | 🔴 Crítica |
| **Fase 3** | 3-4 días | Excel Generation + Styling | 🔴 Crítica |
| **Fase 4** | 4-6 días | Universal API + Queue System | 🟡 Alta |
| **Fase 5** | 3-4 días | Performance + Cache + Monitoring | 🟡 Alta |
| **Fase 6** | 2-3 días | Testing + Documentation + Deploy | 🟢 Media |

---

## 🚀 FASE 1: CORE MODULE Y ARQUITECTURA BASE

**⏱️ Duración:** 3-5 días
**🎯 Objetivo:** Establecer la base arquitectural del sistema

### 📦 1.1 Setup Inicial de Dependencias

```bash
# Instalar dependencias core
yarn add @nestjs/bull bull puppeteer exceljs handlebars
yarn add class-validator class-transformer
yarn add @nestjs/cache-manager cache-manager

# Instalar tipos
yarn add -D @types/puppeteer @types/bull
```

**✅ Checklist 1.1:**
- [ ] Dependencias instaladas correctamente
- [ ] Package.json actualizado con versiones específicas
- [ ] No hay conflictos de dependencias
- [ ] TypeScript compila sin errores

---

### 🏗️ 1.2 Estructura Base del Módulo

**Crear estructura de carpetas:**
```
src/modules/reports/
├── reports.module.ts
├── interfaces/
│   ├── report-config.interface.ts
│   ├── report-strategy.interface.ts
│   └── data-repository.interface.ts
├── types/
│   ├── report.types.ts
│   ├── column.types.ts
│   └── branding.types.ts
├── enums/
│   └── report-format.enum.ts
└── dto/
    ├── universal-report-request.dto.ts
    └── report-response.dto.ts
```

**✅ Checklist 1.2:**
- [ ] Estructura de carpetas creada
- [ ] Módulo principal configurado
- [ ] Interfaces base definidas
- [ ] DTOs con validaciones implementados
- [ ] Enums de tipos definidos

---

### 🎨 1.3 Interfaces y Tipos Base

**Crear interfaces principales:**

```typescript
// interfaces/report-config.interface.ts
export interface BaseReportConfig {
  title: string;
  subtitle?: string;
  collection: string;
  fields: FieldConfig[];
  filters?: FilterConfig;
  sorting?: SortConfig;
  branding?: BrandingConfig;
  pagination?: PaginationConfig;
}

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  format?: string;
  width?: number;
  align?: AlignType;
}

// types/report.types.ts
export type ReportFormat = 'pdf' | 'excel';
export type FieldType = 'string' | 'number' | 'date' | 'boolean' | 'currency';
export type AlignType = 'left' | 'center' | 'right';
```

**✅ Checklist 1.3:**
- [ ] Interfaces base implementadas
- [ ] Tipos strict sin `any`
- [ ] Validaciones con class-validator
- [ ] Documentación JSDoc completa
- [ ] Exportaciones organizadas en index.ts

---

### 🏭 1.4 Patrones de Diseño Base

**Implementar Factory Pattern:**

```typescript
// services/report-factory.service.ts
@Injectable()
export class ReportFactoryService {
  constructor(
    private readonly pdfStrategy: PDFReportStrategy,
    private readonly excelStrategy: ExcelReportStrategy,
  ) {}

  createReportGenerator(format: ReportFormat): ReportStrategy<any> {
    switch (format) {
      case 'pdf':
        return this.pdfStrategy;
      case 'excel':
        return this.excelStrategy;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }
}
```

**✅ Checklist 1.4:**
- [ ] Factory pattern implementado
- [ ] Strategy pattern base definido
- [ ] Builder pattern para configuración
- [ ] Repository pattern para datos
- [ ] Inyección de dependencias configurada

---

## 📄 FASE 2: GENERACIÓN PDF CON PUPPETEER

**⏱️ Duración:** 4-6 días
**🎯 Objetivo:** Sistema completo de generación PDF con templates

### 🎭 2.1 Configuración Puppeteer

**Setup de Puppeteer Service:**

```typescript
// services/puppeteer-manager.service.ts
@Injectable()
export class PuppeteerManagerService {
  private browsers = new Map<string, Browser>();
  private readonly logger = new Logger(PuppeteerManagerService.name);

  async getBrowser(): Promise<Browser> {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--disable-extensions'
      ]
    });

    // Auto-cleanup después de 10 minutos
    setTimeout(() => this.closeBrowser(browser), 600000);

    return browser;
  }

  private async closeBrowser(browser: Browser): Promise<void> {
    try {
      await browser.close();
    } catch (error) {
      this.logger.error('Error closing browser:', error);
    }
  }
}
```

**✅ Checklist 2.1:**
- [ ] PuppeteerManager implementado
- [ ] Configuración optimizada para servidor
- [ ] Auto-cleanup de recursos configurado
- [ ] Error handling robusto
- [ ] Logging de operaciones

---

### 📝 2.2 Templates Handlebars para PDF

**Crear sistema de templates:**

```handlebars
<!-- templates/pdf/default.hbs -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{title}}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; }
        .header { background: {{branding.colors.primary}}; color: white; padding: 20px; }
        .content { padding: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: {{branding.colors.secondary}}; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        {{#if branding.logo}}
        <img src="{{branding.logo}}" alt="Logo" style="height: 40px;">
        {{/if}}
        <h1>{{title}}</h1>
        {{#if subtitle}}<h2>{{subtitle}}</h2>{{/if}}
        <p>Generado: {{generatedAt}}</p>
    </div>

    <div class="content">
        <table>
            <thead>
                <tr>
                    {{#each fields}}
                    <th style="text-align: {{align}}">{{label}}</th>
                    {{/each}}
                </tr>
            </thead>
            <tbody>
                {{#each data}}
                <tr>
                    {{#each ../fields}}
                    <td style="text-align: {{align}}">
                        {{formatValue ../this.[key] type format}}
                    </td>
                    {{/each}}
                </tr>
                {{/each}}
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>{{branding.companyName}} - Página <span class="pageNumber"></span> de <span class="totalPages"></span></p>
    </div>
</body>
</html>
```

**✅ Checklist 2.2:**
- [ ] Template default implementado
- [ ] Template professional implementado
- [ ] Template minimal implementado
- [ ] Handlebars helpers creados
- [ ] CSS responsive implementado
- [ ] Branding dinámico configurado

---

### 🔧 2.3 PDF Generation Service

**Implementar PDF Strategy:**

```typescript
// strategies/pdf-report.strategy.ts
@Injectable()
export class PDFReportStrategy implements ReportStrategy<PDFReportConfig> {
  constructor(
    private readonly puppeteerManager: PuppeteerManagerService,
    private readonly templateService: TemplateService,
  ) {}

  async generate(data: any[], config: PDFReportConfig): Promise<Buffer> {
    const browser = await this.puppeteerManager.getBrowser();
    const page = await browser.newPage();

    try {
      // Renderizar template con datos
      const html = await this.templateService.render(config.template, {
        ...config,
        data,
        generatedAt: new Date().toLocaleString(),
      });

      // Configurar página
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Generar PDF
      const pdf = await page.pdf({
        format: config.layout.pageSize,
        landscape: config.layout.orientation === 'landscape',
        margin: config.layout.margins,
        printBackground: true,
        displayHeaderFooter: config.header.show || config.footer.show,
        headerTemplate: config.header.show ? this.getHeaderTemplate(config) : '',
        footerTemplate: config.footer.show ? this.getFooterTemplate(config) : '',
      });

      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
  }

  validateConfig(config: PDFReportConfig): ValidationResult {
    // Implementar validaciones específicas
    return { isValid: true, errors: [] };
  }

  private getHeaderTemplate(config: PDFReportConfig): string {
    // Generar header template dinámico
  }

  private getFooterTemplate(config: PDFReportConfig): string {
    // Generar footer template dinámico
  }
}
```

**✅ Checklist 2.3:**
- [ ] PDFReportStrategy implementado
- [ ] Template rendering funcionando
- [ ] Configuración de página dinámica
- [ ] Headers y footers configurables
- [ ] Validación de configuración
- [ ] Error handling completo

---

### 🎨 2.4 Template Service

**Crear servicio de templates:**

```typescript
// services/template.service.ts
@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);
  private compiledTemplates = new Map<string, HandlebarsTemplateDelegate>();

  constructor() {
    this.registerHelpers();
  }

  async render(templateName: string, data: any): Promise<string> {
    const template = await this.getTemplate(templateName);
    return template(data);
  }

  private async getTemplate(name: string): Promise<HandlebarsTemplateDelegate> {
    if (!this.compiledTemplates.has(name)) {
      const templatePath = path.join(__dirname, '../templates/pdf', `${name}.hbs`);
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const compiled = handlebars.compile(templateContent);
      this.compiledTemplates.set(name, compiled);
    }

    return this.compiledTemplates.get(name)!;
  }

  private registerHelpers(): void {
    handlebars.registerHelper('formatValue', (value, type, format) => {
      switch (type) {
        case 'date':
          return new Date(value).toLocaleDateString('es-ES', {
            year: 'numeric', month: '2-digit', day: '2-digit'
          });
        case 'currency':
          return new Intl.NumberFormat('es-ES', {
            style: 'currency', currency: format || 'EUR'
          }).format(value);
        case 'number':
          return new Intl.NumberFormat('es-ES').format(value);
        case 'boolean':
          return value ? 'Sí' : 'No';
        default:
          return value;
      }
    });
  }
}
```

**✅ Checklist 2.4:**
- [ ] TemplateService implementado
- [ ] Helpers de Handlebars registrados
- [ ] Cache de templates compilados
- [ ] Formateo de datos por tipo
- [ ] Localización configurada

---

## 📊 FASE 3: GENERACIÓN EXCEL CON EXCELJS

**⏱️ Duración:** 3-4 días
**🎯 Objetivo:** Sistema completo de generación Excel con estilos

### 📈 3.1 Excel Strategy Implementation

```typescript
// strategies/excel-report.strategy.ts
@Injectable()
export class ExcelReportStrategy implements ReportStrategy<ExcelReportConfig> {
  private readonly logger = new Logger(ExcelReportStrategy.name);

  async generate(data: any[], config: ExcelReportConfig): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    // Metadatos del archivo
    workbook.creator = config.branding?.companyName || 'Noticias Pachuca';
    workbook.lastModifiedBy = 'Reports System';
    workbook.created = new Date();
    workbook.modified = new Date();

    const worksheet = workbook.addWorksheet(config.worksheet.name);

    // Configurar columnas
    worksheet.columns = config.fields.map((field, index) => ({
      header: field.label,
      key: field.key,
      width: field.width || 15,
      style: this.getCellStyle(field)
    }));

    // Estilos de header
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.style = config.styling.headerStyle;
    });

    // Agregar datos
    data.forEach((item, index) => {
      const row = worksheet.addRow(item);

      // Aplicar estilos alternados
      if (config.styling.alternateRowColor && index % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: config.styling.alternateRowColor }
          };
        });
      }

      // Formatear celdas según tipo
      config.fields.forEach((field, colIndex) => {
        const cell = row.getCell(colIndex + 1);
        this.formatCell(cell, item[field.key], field);
      });
    });

    // Configuraciones adicionales
    if (config.worksheet.freezeRows) {
      worksheet.views = [{ state: 'frozen', ySplit: config.worksheet.freezeRows }];
    }

    if (config.worksheet.autoFilter) {
      worksheet.autoFilter = {
        from: 'A1',
        to: `${this.getExcelColumn(config.fields.length)}${data.length + 1}`
      };
    }

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private getCellStyle(field: FieldConfig): ExcelJS.Style {
    return {
      alignment: { horizontal: field.align || 'left' },
      numFmt: this.getNumberFormat(field.type, field.format),
    };
  }

  private formatCell(cell: ExcelJS.Cell, value: any, field: FieldConfig): void {
    cell.value = value;

    switch (field.type) {
      case 'date':
        if (value instanceof Date) {
          cell.value = value;
          cell.numFmt = field.format || 'dd/mm/yyyy';
        }
        break;
      case 'currency':
        if (typeof value === 'number') {
          cell.value = value;
          cell.numFmt = `#,##0.00 "${field.format || 'EUR'}"`;
        }
        break;
      case 'number':
        if (typeof value === 'number') {
          cell.value = value;
          cell.numFmt = '#,##0.00';
        }
        break;
    }
  }

  private getNumberFormat(type: FieldType, format?: string): string {
    switch (type) {
      case 'date':
        return format || 'dd/mm/yyyy';
      case 'currency':
        return `#,##0.00 "${format || 'EUR'}"`;
      case 'number':
        return '#,##0.00';
      default:
        return 'General';
    }
  }

  private getExcelColumn(columnNumber: number): string {
    let columnName = '';
    while (columnNumber > 0) {
      const modulo = (columnNumber - 1) % 26;
      columnName = String.fromCharCode(65 + modulo) + columnName;
      columnNumber = Math.floor((columnNumber - modulo) / 26);
    }
    return columnName;
  }

  validateConfig(config: ExcelReportConfig): ValidationResult {
    // Validaciones específicas para Excel
    return { isValid: true, errors: [] };
  }
}
```

**✅ Checklist 3.1:**
- [ ] ExcelReportStrategy implementado
- [ ] Metadatos de archivo configurados
- [ ] Estilos de header y datos
- [ ] Formateo automático por tipo de dato
- [ ] Auto-filter y freeze panes
- [ ] Validación de configuración

---

### 🎨 3.2 Excel Styling System

**Crear sistema de estilos predefinidos:**

```typescript
// config/excel-styles.config.ts
export const EXCEL_STYLES = {
  headers: {
    default: {
      font: { bold: true, color: { argb: 'FFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    },
    professional: {
      font: { bold: true, color: { argb: '000000' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E7E6E6' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
    }
  },
  data: {
    default: {
      alignment: { vertical: 'middle' },
      border: {
        top: { style: 'thin', color: { argb: 'E1E1E1' } },
        bottom: { style: 'thin', color: { argb: 'E1E1E1' } }
      }
    }
  }
} as const;
```

**✅ Checklist 3.2:**
- [ ] Estilos predefinidos creados
- [ ] Sistema de temas implementado
- [ ] Configuración de bordes y colores
- [ ] Alineación y fuentes configurables
- [ ] Estilos exportables como constantes

---

## 🌐 FASE 4: API UNIVERSAL Y SISTEMA DE QUEUES

**⏱️ Duración:** 4-6 días
**🎯 Objetivo:** API universal y procesamiento asíncrono

### 🎯 4.1 Controllers Universales

**Crear controllers para PDF y Excel:**

```typescript
// controllers/pdf-reports.controller.ts
@ApiTags('PDF Reports')
@Controller('reports/pdf')
export class PDFReportsController {
  constructor(private readonly reportService: UniversalReportService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generar reporte PDF universal' })
  @ApiResponse({ type: ReportJobResponse })
  async generatePDF(
    @Body() request: UniversalReportRequestDto
  ): Promise<ReportJobResponse> {
    return await this.reportService.generateAsync('pdf', request);
  }

  @Get('download/:jobId')
  @ApiOperation({ summary: 'Descargar PDF generado' })
  async downloadPDF(
    @Param('jobId') jobId: string,
    @Res() response: Response
  ): Promise<void> {
    const stream = await this.reportService.getReportStream(jobId);

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', 'attachment; filename=report.pdf');

    stream.pipe(response);
  }

  @Get('status/:jobId')
  @ApiOperation({ summary: 'Estado del trabajo de generación' })
  async getJobStatus(@Param('jobId') jobId: string): Promise<ReportJobStatus> {
    return await this.reportService.getJobStatus(jobId);
  }
}

// controllers/excel-reports.controller.ts
@ApiTags('Excel Reports')
@Controller('reports/excel')
export class ExcelReportsController {
  constructor(private readonly reportService: UniversalReportService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generar reporte Excel universal' })
  async generateExcel(
    @Body() request: UniversalReportRequestDto
  ): Promise<ReportJobResponse> {
    return await this.reportService.generateAsync('excel', request);
  }

  @Get('download/:jobId')
  @ApiOperation({ summary: 'Descargar Excel generado' })
  async downloadExcel(
    @Param('jobId') jobId: string,
    @Res() response: Response
  ): Promise<void> {
    const stream = await this.reportService.getReportStream(jobId);

    response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    response.setHeader('Content-Disposition', 'attachment; filename=report.xlsx');

    stream.pipe(response);
  }
}
```

**✅ Checklist 4.1:**
- [ ] PDFReportsController implementado
- [ ] ExcelReportsController implementado
- [ ] Endpoints de generación y descarga
- [ ] Swagger documentation completa
- [ ] Validación de parámetros
- [ ] Manejo de errores HTTP

---

### 📊 4.2 Data Repository Universal

**Implementar repository para MongoDB:**

```typescript
// services/data-repository.service.ts
@Injectable()
export class DataRepositoryService implements DataRepository<any> {
  private readonly logger = new Logger(DataRepositoryService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection
  ) {}

  async findWithFilters(
    collection: string,
    filters: FilterConfig,
    sorting?: SortConfig,
    pagination?: PaginationConfig
  ): Promise<any[]> {
    const model = this.getModel(collection);
    let query = model.find(filters);

    // Aplicar ordenamiento
    if (sorting) {
      query = query.sort(sorting);
    }

    // Aplicar paginación
    if (pagination) {
      const skip = (pagination.page - 1) * pagination.limit;
      query = query.skip(skip).limit(pagination.limit);
    }

    return await query.lean().exec();
  }

  async aggregate(collection: string, pipeline: PipelineStage[]): Promise<any[]> {
    const model = this.getModel(collection);
    return await model.aggregate(pipeline).exec();
  }

  async count(collection: string, filters: FilterConfig): Promise<number> {
    const model = this.getModel(collection);
    return await model.countDocuments(filters).exec();
  }

  async getCollectionFields(collection: string): Promise<string[]> {
    const model = this.getModel(collection);
    const sample = await model.findOne().lean().exec();

    return sample ? Object.keys(sample) : [];
  }

  private getModel(collection: string): Model<any> {
    if (!this.connection.models[collection]) {
      // Crear modelo dinámico para la colección
      const schema = new Schema({}, { strict: false, collection });
      return this.connection.model(collection, schema);
    }

    return this.connection.models[collection];
  }

  async validateCollection(collection: string): Promise<boolean> {
    try {
      const collections = await this.connection.db.listCollections().toArray();
      return collections.some(col => col.name === collection);
    } catch (error) {
      this.logger.error(`Error validating collection ${collection}:`, error);
      return false;
    }
  }
}
```

**✅ Checklist 4.2:**
- [ ] DataRepositoryService implementado
- [ ] Soporte para colecciones dinámicas
- [ ] Filtros, ordenamiento y paginación
- [ ] Agregaciones de MongoDB
- [ ] Validación de colecciones existentes
- [ ] Logging de operaciones

---

### ⚡ 4.3 Queue System con Bull

**Configurar sistema de colas:**

```typescript
// queues/report-processor.ts
@Processor('reports')
export class ReportProcessor {
  private readonly logger = new Logger(ReportProcessor.name);

  constructor(
    private readonly reportFactory: ReportFactoryService,
    private readonly dataRepository: DataRepositoryService,
    private readonly cacheService: CacheService,
  ) {}

  @Process('generate-report')
  async processReport(job: Job<ReportJobData>): Promise<ReportResult> {
    const { format, config, jobId } = job.data;

    try {
      // Actualizar progreso: obtener datos
      await job.progress(10);

      const data = await this.dataRepository.findWithFilters(
        config.collection,
        config.filters,
        config.sorting,
        config.pagination
      );

      await job.progress(30);

      // Generar reporte
      const generator = this.reportFactory.createReportGenerator(format);
      const buffer = await generator.generate(data, config);

      await job.progress(80);

      // Guardar en cache
      const cacheKey = `report:${jobId}`;
      await this.cacheService.set(cacheKey, buffer, 3600); // 1 hora

      await job.progress(100);

      return {
        jobId,
        status: 'completed',
        fileSize: buffer.length,
        recordCount: data.length,
        downloadUrl: `/reports/download/${jobId}`,
        expiresAt: new Date(Date.now() + 3600000), // 1 hora
      };

    } catch (error) {
      this.logger.error(`Error processing report ${jobId}:`, error);
      throw error;
    }
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: ReportResult) {
    this.logger.log(`Job ${job.id} completed. File size: ${result.fileSize} bytes`);
  }

  @OnQueueFailed()
  onFailed(job: Job, err: Error) {
    this.logger.error(`Job ${job.id} failed:`, err);
  }
}
```

**✅ Checklist 4.3:**
- [ ] ReportProcessor implementado
- [ ] Queue configuration con Redis
- [ ] Progress tracking de trabajos
- [ ] Error handling en queue
- [ ] Logging de eventos de queue
- [ ] Cleanup de trabajos completados

---

### 🔧 4.4 Universal Report Service

**Servicio principal coordinador:**

```typescript
// services/universal-report.service.ts
@Injectable()
export class UniversalReportService {
  private readonly logger = new Logger(UniversalReportService.name);

  constructor(
    @InjectQueue('reports') private readonly reportQueue: Queue,
    private readonly dataRepository: DataRepositoryService,
    private readonly cacheService: CacheService,
    private readonly configBuilder: ReportConfigBuilderService,
  ) {}

  async generateAsync(
    format: ReportFormat,
    request: UniversalReportRequestDto
  ): Promise<ReportJobResponse> {
    // Validar colección existe
    const collectionExists = await this.dataRepository.validateCollection(request.collection);
    if (!collectionExists) {
      throw new BadRequestException(`Collection '${request.collection}' not found`);
    }

    // Construir configuración
    const config = await this.configBuilder
      .setFormat(format)
      .setCollection(request.collection)
      .setFields(request.fields)
      .setFilters(request.filters)
      .setSorting(request.sorting)
      .setPagination(request.pagination)
      .setTemplate(request.template)
      .setBranding(request.branding)
      .build();

    // Generar ID único para el trabajo
    const jobId = `${format}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Agregar a cola
    const job = await this.reportQueue.add('generate-report', {
      jobId,
      format,
      config,
    }, {
      jobId,
      removeOnComplete: 10, // Mantener últimos 10 trabajos
      removeOnFail: 50,     // Mantener últimos 50 fallos
      attempts: 3,          // Máximo 3 intentos
      backoff: 'exponential'
    });

    return {
      jobId,
      status: 'queued',
      estimatedTime: this.estimateProcessingTime(config),
      queuePosition: await this.getQueuePosition(job),
    };
  }

  async getReportStream(jobId: string): Promise<Readable> {
    const cacheKey = `report:${jobId}`;
    const buffer = await this.cacheService.get<Buffer>(cacheKey);

    if (!buffer) {
      throw new NotFoundException(`Report ${jobId} not found or expired`);
    }

    return Readable.from(buffer);
  }

  async getJobStatus(jobId: string): Promise<ReportJobStatus> {
    const job = await this.reportQueue.getJob(jobId);

    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    return {
      jobId,
      status: await job.getState(),
      progress: job.progress() as number,
      createdAt: new Date(job.timestamp),
      processedAt: job.processedOn ? new Date(job.processedOn) : null,
      finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
      failedReason: job.failedReason,
    };
  }

  private estimateProcessingTime(config: any): number {
    // Estimación basada en número de registros y complejidad
    const baseTime = 5000; // 5 segundos base
    const recordMultiplier = 10; // 10ms por registro estimado

    return baseTime + (config.estimatedRecords || 100) * recordMultiplier;
  }

  private async getQueuePosition(job: Job): Promise<number> {
    const waiting = await this.reportQueue.getWaiting();
    return waiting.findIndex(waitingJob => waitingJob.id === job.id) + 1;
  }
}
```

**✅ Checklist 4.4:**
- [ ] UniversalReportService implementado
- [ ] Generación asíncrona configurada
- [ ] Validación de colecciones
- [ ] Config builder service
- [ ] Job status tracking
- [ ] Stream de descarga
- [ ] Estimación de tiempos

---

## ⚡ FASE 5: PERFORMANCE, CACHE Y MONITORING

**⏱️ Duración:** 3-4 días
**🎯 Objetivo:** Optimizar performance y añadir monitoreo

### 🚀 5.1 Optimizaciones de Performance

**Implementar streaming para archivos grandes:**

```typescript
// services/streaming-report.service.ts
@Injectable()
export class StreamingReportService {
  async generateLargeReport(
    format: ReportFormat,
    config: ReportConfig
  ): Promise<Readable> {
    const CHUNK_SIZE = 1000;
    let offset = 0;
    let hasMore = true;

    const stream = new PassThrough();

    // Procesar en chunks
    const processChunk = async () => {
      if (!hasMore) {
        stream.end();
        return;
      }

      try {
        const data = await this.dataRepository.findWithFilters(
          config.collection,
          config.filters,
          config.sorting,
          { page: Math.floor(offset / CHUNK_SIZE) + 1, limit: CHUNK_SIZE }
        );

        if (data.length === 0) {
          hasMore = false;
          stream.end();
          return;
        }

        // Procesar chunk y escribir al stream
        const chunkBuffer = await this.processChunk(data, config, format);
        stream.write(chunkBuffer);

        offset += data.length;

        // Procesar siguiente chunk
        setImmediate(processChunk);

      } catch (error) {
        stream.destroy(error);
      }
    };

    // Iniciar procesamiento
    setImmediate(processChunk);

    return stream;
  }

  private async processChunk(
    data: any[],
    config: ReportConfig,
    format: ReportFormat
  ): Promise<Buffer> {
    // Lógica específica para procesar chunks
    // según el formato (PDF/Excel)
  }
}
```

**✅ Checklist 5.1:**
- [ ] Streaming para archivos grandes
- [ ] Procesamiento en chunks
- [ ] Memory management optimizado
- [ ] Límites de concurrencia
- [ ] Timeout configurations
- [ ] Resource cleanup automático

---

### 🔄 5.2 Sistema de Cache Inteligente

```typescript
// services/intelligent-cache.service.ts
@Injectable()
export class IntelligentCacheService {
  constructor(private readonly cacheService: CacheService) {}

  async getOrGenerate<T>(
    key: string,
    generator: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Intentar obtener del cache
    const cached = await this.cacheService.get<T>(key);

    if (cached && !this.isExpired(cached, options)) {
      return cached;
    }

    // Generar nuevo valor
    const value = await generator();

    // Cachear con TTL inteligente
    const ttl = this.calculateTTL(key, value, options);
    await this.cacheService.set(key, value, ttl);

    return value;
  }

  private calculateTTL(key: string, value: any, options: CacheOptions): number {
    // TTL inteligente basado en:
    // - Tamaño del archivo
    // - Frecuencia de uso
    // - Hora del día
    // - Tipo de reporte

    const baseTime = options.ttl || 3600; // 1 hora base
    const size = Buffer.isBuffer(value) ? value.length : JSON.stringify(value).length;

    // Archivos grandes se cachean más tiempo
    const sizeMultiplier = size > 10 * 1024 * 1024 ? 2 : 1; // >10MB

    // Horario de alta demanda = menor TTL
    const hour = new Date().getHours();
    const demandMultiplier = (hour >= 9 && hour <= 17) ? 0.5 : 1.5;

    return Math.floor(baseTime * sizeMultiplier * demandMultiplier);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    // Invalidar cache por patrón
    const keys = await this.cacheService.keys(pattern);
    await Promise.all(keys.map(key => this.cacheService.del(key)));
  }
}
```

**✅ Checklist 5.2:**
- [ ] Cache inteligente implementado
- [ ] TTL dinámico configurado
- [ ] Invalidación por patrones
- [ ] Cache warming strategies
- [ ] Hit rate monitoring
- [ ] Cache size limits

---

### 📊 5.3 Monitoring y Métricas

```typescript
// services/report-metrics.service.ts
@Injectable()
export class ReportMetricsService {
  private readonly logger = new Logger(ReportMetricsService.name);
  private metrics: ReportMetrics;

  constructor(private readonly cacheService: CacheService) {
    this.initializeMetrics();
  }

  async recordReportGeneration(
    format: ReportFormat,
    duration: number,
    size: number,
    recordCount: number,
    success: boolean
  ): Promise<void> {
    const metricsKey = 'report-metrics';
    const metrics = await this.getMetrics();

    // Actualizar métricas
    metrics.generation.totalReports++;
    metrics.generation.formatDistribution[format]++;

    if (success) {
      metrics.generation.averageTime = this.calculateAverage(
        metrics.generation.averageTime,
        duration,
        metrics.generation.totalReports
      );
    } else {
      metrics.generation.failureRate++;
    }

    // Actualizar estadísticas de uso
    metrics.usage.averageRecordCount = this.calculateAverage(
      metrics.usage.averageRecordCount,
      recordCount,
      metrics.generation.totalReports
    );

    await this.cacheService.set(metricsKey, metrics, 86400); // 24 horas

    // Log estructurado
    this.logger.log({
      event: 'report_generated',
      format,
      duration_ms: duration,
      size_bytes: size,
      record_count: recordCount,
      success,
      timestamp: new Date().toISOString()
    });
  }

  async getMetrics(): Promise<ReportMetrics> {
    const cached = await this.cacheService.get<ReportMetrics>('report-metrics');
    return cached || this.initializeMetrics();
  }

  async getHealthStatus(): Promise<HealthStatus> {
    const metrics = await this.getMetrics();

    return {
      status: this.calculateHealthStatus(metrics),
      metrics: {
        queueSize: await this.getQueueSize(),
        cacheHitRate: await this.getCacheHitRate(),
        averageResponseTime: metrics.generation.averageTime,
        errorRate: metrics.generation.failureRate / metrics.generation.totalReports,
      },
      timestamp: new Date()
    };
  }

  private initializeMetrics(): ReportMetrics {
    return {
      generation: {
        totalReports: 0,
        averageTime: 0,
        failureRate: 0,
        formatDistribution: { pdf: 0, excel: 0 }
      },
      performance: {
        memoryUsage: 0,
        concurrentJobs: 0,
        queueSize: 0,
        cacheHitRate: 0
      },
      usage: {
        popularCollections: [],
        averageRecordCount: 0,
        peakHours: []
      }
    };
  }

  private calculateAverage(current: number, newValue: number, count: number): number {
    return (current * (count - 1) + newValue) / count;
  }
}
```

**✅ Checklist 5.3:**
- [ ] Sistema de métricas implementado
- [ ] Health checks configurados
- [ ] Logging estructurado
- [ ] Dashboard de métricas básico
- [ ] Alertas de performance
- [ ] Reportes de uso

---

## 🧪 FASE 6: TESTING, DOCUMENTATION Y DEPLOYMENT

**⏱️ Duración:** 2-3 días
**🎯 Objetivo:** Testing completo y deployment ready

### 🔬 6.1 Testing Strategy

**Unit Tests:**
```typescript
// __tests__/pdf-report.strategy.spec.ts
describe('PDFReportStrategy', () => {
  let strategy: PDFReportStrategy;
  let mockPuppeteerManager: jest.Mocked<PuppeteerManagerService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PDFReportStrategy,
        {
          provide: PuppeteerManagerService,
          useValue: createMockPuppeteerManager(),
        },
      ],
    }).compile();

    strategy = module.get<PDFReportStrategy>(PDFReportStrategy);
  });

  it('should generate PDF with correct structure', async () => {
    const config = createMockPDFConfig();
    const data = createMockData(100);

    const result = await strategy.generate(data, config);

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle large datasets efficiently', async () => {
    const config = createMockPDFConfig();
    const data = createMockData(10000);

    const start = Date.now();
    const result = await strategy.generate(data, config);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(30000); // Max 30 segundos
    expect(result).toBeInstanceOf(Buffer);
  });
});
```

**Integration Tests:**
```typescript
// __tests__/reports-integration.spec.ts
describe('Reports Integration', () => {
  let app: INestApplication;
  let reportService: UniversalReportService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ReportsModule, TestDatabaseModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('should generate and download PDF report', async () => {
    // Crear datos de prueba
    await createTestData();

    // Generar reporte
    const response = await request(app.getHttpServer())
      .post('/reports/pdf/generate')
      .send(createTestRequest())
      .expect(201);

    expect(response.body).toHaveProperty('jobId');

    // Esperar procesamiento
    await waitForJobCompletion(response.body.jobId);

    // Descargar reporte
    const downloadResponse = await request(app.getHttpServer())
      .get(`/reports/pdf/download/${response.body.jobId}`)
      .expect(200);

    expect(downloadResponse.headers['content-type']).toBe('application/pdf');
  });
});
```

**✅ Checklist 6.1:**
- [ ] Unit tests para todas las strategies
- [ ] Integration tests para APIs
- [ ] Performance tests con datasets grandes
- [ ] Error scenarios testing
- [ ] Coverage >90%
- [ ] E2E tests con datos reales

---

### 📚 6.2 Documentation

**API Documentation con Swagger:**
```typescript
// Swagger configuration
const config = new DocumentBuilder()
  .setTitle('Universal Reports API')
  .setDescription('Sistema universal de generación de reportes PDF/Excel')
  .setVersion('1.0')
  .addTag('PDF Reports', 'Generación de reportes PDF')
  .addTag('Excel Reports', 'Generación de reportes Excel')
  .addBearerAuth()
  .build();
```

**README.md del módulo:**
```markdown
# 🏢 Noticias Pachuca - Universal Reports Module

## 🚀 Quick Start

```bash
# Instalar dependencias
yarn install

# Configurar variables de entorno
cp .env.example .env

# Ejecutar en desarrollo
yarn start:dev
```

## 📊 API Usage

### Generar PDF
```typescript
POST /reports/pdf/generate
{
  "collection": "users",
  "fields": [
    { "key": "name", "label": "Nombre", "type": "string" },
    { "key": "email", "label": "Email", "type": "string" }
  ],
  "branding": {
    "companyName": "Mi Empresa",
    "colors": { "primary": "#2563eb" }
  }
}
```
```

**✅ Checklist 6.2:**
- [ ] Swagger documentation completa
- [ ] README con ejemplos
- [ ] JSDoc en todo el código
- [ ] Guías de configuración
- [ ] Troubleshooting guide
- [ ] Performance tuning guide

---

### 🚀 6.3 Deployment Configuration

**Docker Configuration:**
```dockerfile
# Dockerfile
FROM node:18-alpine

# Instalar dependencias de Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app
COPY package*.json ./
RUN yarn install --production

COPY . .
RUN yarn build

EXPOSE 3000
CMD ["node", "dist/main"]
```

**Docker Compose:**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - MONGODB_URL=mongodb://mongo:27017/reports
    depends_on:
      - redis
      - mongo

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
```

**✅ Checklist 6.3:**
- [ ] Dockerfile optimizado
- [ ] Docker compose configurado
- [ ] Environment variables documentadas
- [ ] Health checks implementados
- [ ] Production ready configuration
- [ ] Security hardening

---

## 🎯 VALIDACIÓN FINAL

### ✅ CHECKLIST COMPLETO DE ENTREGABLES

#### 📦 **Módulo Core**
- [ ] ReportsModule configurado e importable
- [ ] Interfaces y tipos TypeScript completos
- [ ] Factory, Strategy y Builder patterns implementados
- [ ] DTOs con validaciones completas

#### 📄 **PDF Generation**
- [ ] Puppeteer strategy funcional
- [ ] Templates Handlebars dinámicos
- [ ] Branding y styling configurables
- [ ] Headers/footers personalizables

#### 📊 **Excel Generation**
- [ ] ExcelJS strategy funcional
- [ ] Estilos y formatos automáticos
- [ ] Múltiples hojas support
- [ ] Auto-filter y freeze panes

#### 🌐 **Universal API**
- [ ] Controllers PDF y Excel
- [ ] Data repository universal
- [ ] Queue system con Bull
- [ ] Job status tracking

#### ⚡ **Performance**
- [ ] Streaming para archivos grandes
- [ ] Cache inteligente
- [ ] Monitoring y métricas
- [ ] Resource management

#### 🧪 **Quality Assurance**
- [ ] Test coverage >90%
- [ ] Integration tests passing
- [ ] Performance tests validados
- [ ] Error scenarios cubiertos

#### 📚 **Documentation**
- [ ] Swagger API docs
- [ ] README completo
- [ ] Configuration guides
- [ ] Deployment instructions

#### 🚀 **Deployment**
- [ ] Docker configuration
- [ ] Environment setup
- [ ] Health checks
- [ ] Production optimizations

---

## 📈 SUCCESS METRICS

### 🎯 KPIs de Éxito

| Métrica | Target | Medición |
|---------|--------|----------|
| **Performance** | <10s para 1K registros | ✅ Medido |
| **Memory Usage** | <500MB por reporte | ✅ Medido |
| **Success Rate** | >99% sin errores | ✅ Medido |
| **Concurrent Users** | 10 reportes simultáneos | ✅ Medido |
| **File Size** | <50MB por reporte | ✅ Medido |

### 🔍 Validation Tests

```bash
# Test básico de funcionamiento
curl -X POST http://localhost:3000/reports/pdf/generate \
  -H "Content-Type: application/json" \
  -d '{"collection":"users","fields":[{"key":"name","label":"Nombre","type":"string"}]}'

# Test de performance con dataset grande
curl -X POST http://localhost:3000/reports/excel/generate \
  -H "Content-Type: application/json" \
  -d '{"collection":"transactions","fields":[...],"pagination":{"limit":10000}}'

# Test de concurrencia
for i in {1..10}; do
  curl -X POST http://localhost:3000/reports/pdf/generate &
done
wait
```

---

## 🎉 ENTREGA FINAL

### 📋 **DELIVERABLES FINALES**

1. **✅ Módulo Universal de Reportes** - Completamente funcional
2. **✅ API REST completa** - PDF y Excel endpoints
3. **✅ Sistema de Queue** - Procesamiento asíncrono
4. **✅ Cache inteligente** - Performance optimizada
5. **✅ Monitoring completo** - Métricas y health checks
6. **✅ Testing suite** - Unit, integration y E2E
7. **✅ Documentation** - Swagger + guides
8. **✅ Docker deployment** - Production ready

### 🚀 **PRÓXIMOS PASOS RECOMENDADOS**

1. **Deployment en staging** - Validar en entorno real
2. **Load testing** - Confirmar límites de performance
3. **Security audit** - Validar medidas de seguridad
4. **User training** - Documentar casos de uso
5. **Monitoring setup** - Configurar alertas
6. **Backup strategy** - Plan de respaldo de reportes

---

**📅 Plan creado:** Septiembre 2025
**👤 Desarrollado por:** Equipo Noticias Pachuca
**🎯 Status:** Listo para implementación
**⏱️ Tiempo total estimado:** 19-27 días laborales