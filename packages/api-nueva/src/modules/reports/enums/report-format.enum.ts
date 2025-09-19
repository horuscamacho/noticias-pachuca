/**
 * 📊 REPORT FORMAT ENUMS
 * Enumeraciones para formatos de reportes soportados
 */

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
}

export enum FieldType {
  STRING = 'string',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
  CURRENCY = 'currency',
  EMAIL = 'email',
  URL = 'url',
}

export enum AlignType {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right',
}

export enum PageSize {
  A4 = 'A4',
  LETTER = 'Letter',
  LEGAL = 'Legal',
  A3 = 'A3',
}

export enum PageOrientation {
  PORTRAIT = 'portrait',
  LANDSCAPE = 'landscape',
}

export enum ReportJobStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum TemplateType {
  DEFAULT = 'default',
  PROFESSIONAL = 'professional',
  MINIMAL = 'minimal',
  FINANCIAL = 'financial',
  CORPORATE = 'corporate',
}
