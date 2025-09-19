import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAuthMailService } from '../config/mail.interfaces';
import { EmailPriority } from '../types/mail.types';
import { MailCoreService } from './mail-core.service';

@Injectable()
export class AuthMailService implements IAuthMailService {
  private readonly logger = new Logger(AuthMailService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly mailCoreService: MailCoreService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl =
      this.configService.get<string>('APP_BASE_URL') || 'http://localhost:3000';
  }

  async sendWelcomeEmail(user: { name: string; email: string }): Promise<void> {
    this.logger.log(`Sending welcome email to: ${user.email}`);

    await this.mailCoreService.sendEmail({
      to: user.email,
      subject: '¡Bienvenido a nuestra plataforma!',
      template: 'auth/welcome',
      context: {
        recipientName: user.name,
        recipientEmail: user.email,
        loginUrl: `${this.baseUrl}/auth/login`,
        supportEmail: this.configService.get<string>('SUPPORT_EMAIL'),
      },
      priority: EmailPriority.HIGH,
    });
  }

  async sendEmailConfirmation(
    user: { name: string; email: string },
    token: string,
  ): Promise<void> {
    this.logger.log(`Sending email confirmation to: ${user.email}`);

    const confirmationUrl = `${this.baseUrl}/auth/confirm-email?token=${token}`;

    await this.mailCoreService.sendEmail({
      to: user.email,
      subject: 'Confirma tu dirección de correo electrónico',
      template: 'auth/email-confirmation',
      context: {
        recipientName: user.name,
        recipientEmail: user.email,
        confirmationUrl,
        expirationHours: 24,
      },
      priority: EmailPriority.HIGH,
    });
  }

  async sendPasswordReset(
    user: { name: string; email: string },
    token: string,
  ): Promise<void> {
    this.logger.log(`Sending password reset to: ${user.email}`);

    const resetUrl = `${this.baseUrl}/auth/reset-password?token=${token}`;

    await this.mailCoreService.sendEmail({
      to: user.email,
      subject: 'Recuperación de contraseña',
      template: 'auth/password-reset',
      context: {
        recipientName: user.name,
        recipientEmail: user.email,
        resetUrl,
        expirationHours: 1,
      },
      priority: EmailPriority.CRITICAL,
    });
  }

  async sendPasswordChanged(user: {
    name: string;
    email: string;
  }): Promise<void> {
    this.logger.log(`Sending password changed notification to: ${user.email}`);

    await this.mailCoreService.sendEmail({
      to: user.email,
      subject: 'Contraseña modificada exitosamente',
      template: 'auth/password-changed',
      context: {
        recipientName: user.name,
        recipientEmail: user.email,
        changeDate: new Date().toLocaleString('es-ES'),
        supportEmail: this.configService.get<string>('SUPPORT_EMAIL'),
      },
      priority: EmailPriority.NORMAL,
    });
  }
}
