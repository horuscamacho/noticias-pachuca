import { EmailOptions } from '../types/mail.types';

export interface IMailProvider {
  sendEmail(options: EmailOptions): Promise<void>;
  sendBulkEmails(emails: EmailOptions[]): Promise<void>;
}

export interface IAuthMailService {
  sendWelcomeEmail(user: { name: string; email: string }): Promise<void>;
  sendEmailConfirmation(
    user: { name: string; email: string },
    token: string,
  ): Promise<void>;
  sendPasswordReset(
    user: { name: string; email: string },
    token: string,
  ): Promise<void>;
  sendPasswordChanged(user: { name: string; email: string }): Promise<void>;
}

export interface INotificationMailService {
  sendSystemAlert(recipients: string[], message: string): Promise<void>;
  sendUpdateNotification(
    user: { name: string; email: string },
    updateInfo: any,
  ): Promise<void>;
}

export interface IMarketingMailService {
  sendNewsletter(recipients: string[], content: any): Promise<void>;
  sendPromotionalEmail(recipients: string[], campaign: any): Promise<void>;
}
