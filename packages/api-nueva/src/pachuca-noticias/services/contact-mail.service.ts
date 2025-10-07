import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailCoreService } from '../../modules/mail/services/mail-core.service';
import { EmailPriority } from '../../modules/mail/types/mail.types';

/**
 * 📧 Contact Mail Service
 * Servicio para envío de emails de contacto usando el sistema de mail existente
 */
@Injectable()
export class ContactMailService {
  private readonly logger = new Logger(ContactMailService.name);
  private readonly adminEmail: string;
  private readonly frontendUrl: string;

  constructor(
    private readonly mailCoreService: MailCoreService,
    private readonly configService: ConfigService,
  ) {
    this.adminEmail = this.configService.get<string>('ADMIN_EMAIL', 'contacto@noticiaspachuca.com');
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'https://noticiaspachuca.com');
  }

  /**
   * Enviar notificación de contacto al admin
   */
  async sendContactNotification(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<void> {
    try {
      await this.mailCoreService.sendEmail({
        to: this.adminEmail,
        subject: `[Contacto] ${data.subject}`,
        template: 'contact/contact-notification',
        context: {
          recipientEmail: this.adminEmail,
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
          timestamp: new Date().toISOString(),
        },
        priority: EmailPriority.HIGH,
      });

      this.logger.log(`📧 Notificación de contacto enviada: ${data.subject}`);
    } catch (error) {
      this.logger.error('❌ Error enviando notificación de contacto:', error);
      throw error;
    }
  }

  /**
   * Enviar confirmación al usuario que contactó
   */
  async sendContactConfirmation(data: {
    name: string;
    email: string;
    subject: string;
  }): Promise<void> {
    try {
      await this.mailCoreService.sendEmail({
        to: data.email,
        subject: 'Hemos recibido tu mensaje - Noticias Pachuca',
        template: 'contact/contact-confirmation',
        context: {
          recipientName: data.name,
          recipientEmail: data.email,
          subject: data.subject,
          frontendUrl: this.frontendUrl,
        },
        priority: EmailPriority.NORMAL,
      });

      this.logger.log(`✉️ Confirmación enviada a: ${data.email}`);
    } catch (error) {
      this.logger.error('❌ Error enviando confirmación:', error);
      // No lanzar error aquí, la notificación al admin es más importante
    }
  }
}
