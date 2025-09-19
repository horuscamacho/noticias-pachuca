/**
 * 📋 REPORT TYPES
 * Tipos base para el sistema de reportes universal
 */

import {
  ReportFormat,
  FieldType,
  AlignType,
  PageSize,
  PageOrientation,
  ReportJobStatus,
  TemplateType,
} from '../enums';

// ===============================
// TIPOS BÁSICOS
// ===============================

export type SortDirection = 1 | -1 | 'asc' | 'desc';

export type FilterOperator =
  | '$eq'
  | '$ne'
  | '$gt'
  | '$gte'
  | '$lt'
  | '$lte'
  | '$in'
  | '$nin'
  | '$regex'
  | '$exists';

export type CurrencyCode =
  | 'USD'
  | 'EUR'
  | 'MXN'
  | 'GBP'
  | 'CAD'
  | 'AUD'
  | 'JPY';

// ===============================
// CONFIGURACIÓN DE CAMPOS
// ===============================

export interface FieldConfig {
  /** Clave del campo en la base de datos */
  key: string;

  /** Etiqueta a mostrar en el reporte */
  label: string;

  /** Tipo de dato para formateo */
  type: FieldType;

  /** Formato específico (ej: 'dd/MM/yyyy' para fechas, 'USD' para moneda) */
  format?: string;

  /** Ancho de columna (PDF en %, Excel en caracteres) */
  width?: number;

  /** Alineación del contenido */
  align?: AlignType;

  /** Si el campo es obligatorio */
  required?: boolean;

  /** Valor por defecto si el campo está vacío */
  defaultValue?: string | number | boolean;

  /** Función de transformación personalizada */
  transformer?: (value: any) => string;
}

// ===============================
// FILTROS Y ORDENAMIENTO
// ===============================

export interface FilterCondition {
  operator: FilterOperator;
  value: any;
}

export interface FilterConfig {
  [field: string]: any | FilterCondition;
}

export interface SortConfig {
  [field: string]: SortDirection;
}

export interface PaginationConfig {
  page: number;
  limit: number;
  maxLimit?: number;
}

// ===============================
// BRANDING Y ESTILOS
// ===============================

export interface BrandingColors {
  primary: string;
  secondary: string;
  accent?: string;
  text: string;
  background?: string;
}

export interface BrandingConfig {
  companyName: string;
  logo?: string;
  colors: BrandingColors;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  fontFamily?: string;
}

// ===============================
// CONFIGURACIÓN BASE DE REPORTES
// ===============================

export interface BaseReportConfig {
  /** Título principal del reporte */
  title: string;

  /** Subtítulo opcional */
  subtitle?: string;

  /** Colección de MongoDB a consultar */
  collection: string;

  /** Configuración de campos a incluir */
  fields: FieldConfig[];

  /** Filtros para la consulta */
  filters?: FilterConfig;

  /** Ordenamiento de los datos */
  sorting?: SortConfig;

  /** Paginación (opcional, sin paginación = todos los registros) */
  pagination?: PaginationConfig;

  /** Configuración de branding */
  branding?: BrandingConfig;

  /** Tipo de template a usar */
  template?: TemplateType;

  /** Configuración de query adicional */
  query?: {
    filters?: FilterConfig;
    aggregations?: unknown[];
  };

  /** Metadatos adicionales */
  metadata?: {
    author?: string;
    subject?: string;
    keywords?: string[];
    createdBy?: string;
    department?: string;
  };
}

// ===============================
// CONFIGURACIÓN ESPECÍFICA PDF
// ===============================

export interface PDFLayoutConfig {
  pageSize: PageSize;
  orientation: PageOrientation;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface PDFHeaderConfig {
  show: boolean;
  title?: string;
  subtitle?: string;
  showDate: boolean;
  showPageNumbers: boolean;
  logo?: string;
  height?: number;
}

export interface PDFFooterConfig {
  show: boolean;
  text?: string;
  showGenerated: boolean;
  showPageNumbers: boolean;
  height?: number;
}

export interface PDFReportConfig extends BaseReportConfig {
  format: ReportFormat.PDF;
  layout: PDFLayoutConfig;
  header: PDFHeaderConfig;
  footer: PDFFooterConfig;

  /** Opciones específicas de PDF */
  pdfOptions?: {
    printBackground?: boolean;
    displayHeaderFooter?: boolean;
    preferCSSPageSize?: boolean;
    quality?: number;
    scale?: number;
  };
}

// ===============================
// CONFIGURACIÓN ESPECÍFICA EXCEL
// ===============================

export interface ExcelCellStyle {
  font?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    color?: string;
    size?: number;
    name?: string;
  };
  fill?: {
    type: 'pattern';
    pattern: 'solid' | 'gray125' | 'gray0625';
    fgColor?: string;
    bgColor?: string;
  };
  alignment?: {
    horizontal?: 'left' | 'center' | 'right';
    vertical?: 'top' | 'middle' | 'bottom';
    wrapText?: boolean;
  };
  border?: {
    top?: { style: 'thin' | 'medium' | 'thick'; color?: string };
    left?: { style: 'thin' | 'medium' | 'thick'; color?: string };
    bottom?: { style: 'thin' | 'medium' | 'thick'; color?: string };
    right?: { style: 'thin' | 'medium' | 'thick'; color?: string };
  };
  numFmt?: string;
}

export interface ExcelWorksheetConfig {
  name: string;
  freezeRows?: number;
  freezeColumns?: number;
  autoFilter: boolean;
  showGridLines?: boolean;
  showHeaders?: boolean;
}

export interface ExcelStylingConfig {
  headerStyle: ExcelCellStyle;
  dataStyle: ExcelCellStyle;
  alternateRowColor?: string;
  evenRowStyle?: ExcelCellStyle;
  oddRowStyle?: ExcelCellStyle;
}

export interface ExcelFormattingConfig {
  dateFormat: string;
  numberFormat: string;
  currencyFormat: string;
  percentFormat: string;
  booleanFormat: {
    true: string;
    false: string;
  };
}

export interface ExcelReportConfig extends BaseReportConfig {
  format: ReportFormat.EXCEL;
  worksheet: ExcelWorksheetConfig;
  styling: ExcelStylingConfig;
  formatting: ExcelFormattingConfig;

  /** Incluir hoja de metadatos */
  includeMetadata?: boolean;

  /** Opciones específicas de Excel */
  excelOptions?: {
    compression?: boolean;
    password?: string;
    creator?: string;
    lastModifiedBy?: string;
  };
}

// ===============================
// TIPOS DE CONFIGURACIÓN UNIFICADOS
// ===============================

export type ReportConfig = PDFReportConfig | ExcelReportConfig;

export type ReportConfigByFormat<T extends ReportFormat> =
  T extends ReportFormat.PDF
    ? PDFReportConfig
    : T extends ReportFormat.EXCEL
      ? ExcelReportConfig
      : never;

// ===============================
// TIPOS DE RESULTADO
// ===============================

export interface ReportResult {
  jobId: string;
  status: ReportJobStatus;
  format: ReportFormat;
  fileSize?: number;
  recordCount?: number;
  downloadUrl?: string;
  expiresAt?: Date;
  generatedAt: Date;
  processingTime?: number;
  error?: string;
}

export interface ReportJobData {
  jobId: string;
  format: ReportFormat;
  config: ReportConfig;
  requestedBy?: string;
  priority?: number;
}

export interface ReportJobResponse {
  jobId: string;
  status: ReportJobStatus;
  estimatedTime?: number;
  queuePosition?: number;
  message?: string;
}

export interface ReportJobStatusInfo {
  jobId: string;
  status: ReportJobStatus;
  progress: number;
  createdAt: Date;
  processedAt?: Date;
  finishedAt?: Date;
  failedReason?: string;
  result?: ReportResult;
}

// ===============================
// MÉTRICAS Y MONITORING
// ===============================

export interface ReportMetrics {
  generation: {
    totalReports: number;
    averageTime: number;
    failureRate: number;
    formatDistribution: Record<ReportFormat, number>;
  };
  performance: {
    memoryUsage: number;
    concurrentJobs: number;
    queueSize: number;
    cacheHitRate: number;
  };
  usage: {
    popularCollections: string[];
    averageRecordCount: number;
    peakHours: number[];
  };
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  metrics: {
    queueSize: number;
    cacheHitRate: number;
    averageResponseTime: number;
    errorRate: number;
  };
  timestamp: Date;
}

// ===============================
// UTILIDADES DE VALIDACIÓN
// ===============================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  compress?: boolean;
}
