import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { IMailProvider } from '../config/mail.interfaces';
import { EmailOptions, EmailPriority } from '../types/mail.types';

@Injectable()
export class MailCoreService implements IMailProvider {
  private readonly logger = new Logger(MailCoreService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const queueEnabled =
        this.configService.get('MAIL_QUEUE_ENABLED') === 'true';

      if (queueEnabled) {
        // TODO: Implementar cola cuando se agregue Bull
        this.logger.warn('Mail queue not implemented yet, sending immediately');
        await this.sendEmailImmediate(options);
      } else {
        await this.sendEmailImmediate(options);
      }
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw error;
    }
  }

  private async sendEmailImmediate(options: EmailOptions): Promise<void> {
    const defaultFrom = `${this.configService.get('DEFAULT_FROM_NAME')} <${this.configService.get('DEFAULT_FROM_EMAIL')}>`;

    this.logger.debug(`📧 Attempting to send email with template: ${options.template}`);
    this.logger.debug(`📧 Context: ${JSON.stringify(options.context)}`);

    await this.mailerService.sendMail({
      from: defaultFrom,
      to: options.to,
      subject: options.subject,
      template: options.template,
      context: options.context,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    });

    this.logger.log(
      `Email sent successfully to: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`,
    );
  }

  private getPriorityValue(priority?: EmailPriority): number {
    switch (priority) {
      case EmailPriority.CRITICAL:
        return 10;
      case EmailPriority.HIGH:
        return 7;
      case EmailPriority.NORMAL:
        return 5;
      case EmailPriority.LOW:
        return 1;
      default:
        return 5;
    }
  }

  async sendBulkEmails(emails: EmailOptions[]): Promise<void> {
    this.logger.log(`Sending ${emails.length} bulk emails`);

    const promises = emails.map((email) =>
      this.sendEmail(email).catch((error) => {
        this.logger.error(
          `Failed to send bulk email to ${email.to}: ${error.message}`,
        );
        return null; // Continue with other emails
      }),
    );

    await Promise.allSettled(promises);
    this.logger.log('Bulk email sending completed');
  }
}
