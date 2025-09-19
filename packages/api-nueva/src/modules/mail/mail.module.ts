import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { join } from 'path';

// Services
import { MailCoreService } from './services/mail-core.service';
import { AuthMailService } from './services/auth-mail.service';

// Event listeners
import { MailEventListeners } from './events/mail.listeners';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const provider = configService.get<string>('MAIL_PROVIDER');

        if (provider === 'resend') {
          return {
            transport: {
              host: configService.get<string>('SMTP_HOST'),
              port: configService.get<number>('SMTP_PORT'),
              secure: false,
              auth: {
                user: configService.get<string>('SMTP_USER'),
                pass: configService.get<string>('SMTP_PASSWORD'),
              },
            },
            defaults: {
              from: `${configService.get<string>('DEFAULT_FROM_NAME')} <${configService.get<string>('DEFAULT_FROM_EMAIL')}>`,
            },
            template: {
              dir: join(__dirname, 'templates'),
              adapter: new HandlebarsAdapter(),
              options: {
                strict: true,
              },
            },
          };
        }

        // Configuración SMTP tradicional (fallback)
        return {
          transport: {
            host: configService.get<string>('SMTP_HOST'),
            port: configService.get<number>('SMTP_PORT'),
            secure: false,
            auth: {
              user: configService.get<string>('SMTP_USER'),
              pass: configService.get<string>('SMTP_PASSWORD'),
            },
          },
          defaults: {
            from: `${configService.get<string>('DEFAULT_FROM_NAME')} <${configService.get<string>('DEFAULT_FROM_EMAIL')}>`,
          },
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
      inject: [ConfigService],
    }),

    // Solo importar EventEmitterModule si está habilitado
    EventEmitterModule.forRoot(),
  ],
  providers: [MailCoreService, AuthMailService, MailEventListeners],
  exports: [MailCoreService, AuthMailService],
})
export class MailModule {}
