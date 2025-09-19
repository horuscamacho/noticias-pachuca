export enum EmailType {
  WELCOME = 'welcome',
  EMAIL_CONFIRMATION = 'email-confirmation',
  PASSWORD_RESET = 'password-reset',
  PASSWORD_CHANGED = 'password-changed',
  SYSTEM_ALERT = 'system-alert',
  NEWSLETTER = 'newsletter',
  PROMOTIONAL = 'promotional',
}

export enum EmailPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface BaseEmailContext {
  recipientName?: string;
  recipientEmail: string;
  [key: string]: any;
}

export interface EmailTemplate {
  type: EmailType;
  subject: string;
  template: string;
  context: BaseEmailContext;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  context?: Record<string, any>;
  html?: string;
  text?: string;
  priority?: EmailPriority;
  delay?: number; // Para colas
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
  }>;
}
