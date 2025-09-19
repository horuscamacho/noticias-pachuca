# 📧 MÓDULO MAIL - ARQUITECTURA NESTJS 2025

## 🎯 **OBJETIVO**
Implementar un módulo de email reutilizable, escalable y mantenible que cumpla con los principios de NestJS y Clean Architecture para manejo de correos transaccionales, autenticación y marketing.

---

## 🏗️ **ARQUITECTURA PROPUESTA**

### **Estructura de Directorios**
```
src/modules/mail/
├── config/
│   ├── mail.config.ts           # Configuración del módulo
│   └── mail.interfaces.ts       # Interfaces y tipos
├── services/
│   ├── mail-core.service.ts     # Servicio base/core
│   ├── auth-mail.service.ts     # Emails de autenticación
│   ├── notification-mail.service.ts # Emails de notificación
│   └── marketing-mail.service.ts    # Emails de marketing
├── templates/
│   ├── auth/
│   │   ├── welcome.hbs
│   │   ├── email-confirmation.hbs
│   │   ├── password-reset.hbs
│   │   └── password-changed.hbs
│   ├── notifications/
│   │   ├── system-alert.hbs
│   │   └── update-notification.hbs
│   └── marketing/
│       ├── newsletter.hbs
│       └── promotional.hbs
├── dto/
│   ├── auth-email.dto.ts
│   ├── notification-email.dto.ts
│   └── marketing-email.dto.ts
├── events/
│   ├── mail.events.ts           # Definición de eventos
│   └── mail.listeners.ts        # Event listeners
├── types/
│   └── mail.types.ts            # Tipos y enums
├── mail.module.ts
└── index.ts
```

---

## 🔧 **CONFIGURACIÓN BASE**

### **1. Instalación de Dependencias**
```bash
# Core dependencies
yarn add @nestjs-modules/mailer nodemailer handlebars
yarn add -D @types/nodemailer

# Para Resend (recomendado 2025)
yarn add resend

# Para eventos y colas (opcional pero recomendado)
yarn add @nestjs/event-emitter @nestjs/bull bull redis
```

### **2. Configuración en nest-cli.json**
```json
{
  "compilerOptions": {
    "assets": [
      "modules/mail/templates/**/*"
    ],
    "watchAssets": true
  }
}
```

### **3. Variables de Entorno (.env)**
```env
# Mail Configuration
MAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxx

# SMTP Configuration (alternativo)
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=re_xxxxxxxx

# Email Defaults
DEFAULT_FROM_EMAIL=noreply@coyote-dev.com
DEFAULT_FROM_NAME=Template Universal

# Features
MAIL_QUEUE_ENABLED=true
MAIL_EVENTS_ENABLED=true
```

---

## 🏷️ **TIPOS Y INTERFACES**

### **mail.types.ts**
```typescript
export enum EmailType {
  WELCOME = 'welcome',
  EMAIL_CONFIRMATION = 'email-confirmation',
  PASSWORD_RESET = 'password-reset',
  PASSWORD_CHANGED = 'password-changed',
  SYSTEM_ALERT = 'system-alert',
  NEWSLETTER = 'newsletter',
  PROMOTIONAL = 'promotional'
}

export enum EmailPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical'
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
```

### **mail.interfaces.ts**
```typescript
export interface IMailProvider {
  sendEmail(options: EmailOptions): Promise<void>;
  sendBulkEmails(emails: EmailOptions[]): Promise<void>;
}

export interface IAuthMailService {
  sendWelcomeEmail(user: { name: string; email: string }): Promise<void>;
  sendEmailConfirmation(user: { name: string; email: string }, token: string): Promise<void>;
  sendPasswordReset(user: { name: string; email: string }, token: string): Promise<void>;
  sendPasswordChanged(user: { name: string; email: string }): Promise<void>;
}

export interface INotificationMailService {
  sendSystemAlert(recipients: string[], message: string): Promise<void>;
  sendUpdateNotification(user: { name: string; email: string }, updateInfo: any): Promise<void>;
}

export interface IMarketingMailService {
  sendNewsletter(recipients: string[], content: any): Promise<void>;
  sendPromotionalEmail(recipients: string[], campaign: any): Promise<void>;
}
```

---

## 🎫 **EVENTOS DEL SISTEMA**

### **mail.events.ts**
```typescript
export class UserRegisteredEvent {
  constructor(
    public readonly user: { name: string; email: string; id: string }
  ) {}
}

export class EmailConfirmationRequestedEvent {
  constructor(
    public readonly user: { name: string; email: string },
    public readonly token: string
  ) {}
}

export class PasswordResetRequestedEvent {
  constructor(
    public readonly user: { name: string; email: string },
    public readonly token: string
  ) {}
}

export class PasswordChangedEvent {
  constructor(
    public readonly user: { name: string; email: string }
  ) {}
}
```

---

## 🔧 **SERVICIOS IMPLEMENTADOS**

### **mail-core.service.ts** - Servicio Base
```typescript
@Injectable()
export class MailCoreService implements IMailProvider {
  private readonly logger = new Logger(MailCoreService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    @InjectQueue('mail') private readonly mailQueue: Queue // Opcional
  ) {}

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      if (this.configService.get('MAIL_QUEUE_ENABLED') === 'true') {
        await this.queueEmail(options);
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
  }

  private async queueEmail(options: EmailOptions): Promise<void> {
    await this.mailQueue.add('send-email', options, {
      priority: this.getPriorityValue(options.priority),
      delay: options.delay || 0,
      attempts: 3,
      backoff: 'exponential',
    });
  }

  private getPriorityValue(priority?: EmailPriority): number {
    switch (priority) {
      case EmailPriority.CRITICAL: return 10;
      case EmailPriority.HIGH: return 7;
      case EmailPriority.NORMAL: return 5;
      case EmailPriority.LOW: return 1;
      default: return 5;
    }
  }

  async sendBulkEmails(emails: EmailOptions[]): Promise<void> {
    const promises = emails.map(email => this.sendEmail(email));
    await Promise.allSettled(promises);
  }
}
```

### **auth-mail.service.ts** - Emails de Autenticación
```typescript
@Injectable()
export class AuthMailService implements IAuthMailService {
  private readonly logger = new Logger(AuthMailService.name);
  private readonly baseUrl = this.configService.get('APP_BASE_URL');

  constructor(
    private readonly mailCoreService: MailCoreService,
    private readonly configService: ConfigService
  ) {}

  async sendWelcomeEmail(user: { name: string; email: string }): Promise<void> {
    await this.mailCoreService.sendEmail({
      to: user.email,
      subject: '¡Bienvenido a nuestra plataforma!',
      template: 'auth/welcome',
      context: {
        recipientName: user.name,
        recipientEmail: user.email,
        loginUrl: `${this.baseUrl}/auth/login`,
        supportEmail: this.configService.get('SUPPORT_EMAIL'),
      },
      priority: EmailPriority.HIGH,
    });
  }

  async sendEmailConfirmation(
    user: { name: string; email: string },
    token: string
  ): Promise<void> {
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
    token: string
  ): Promise<void> {
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

  async sendPasswordChanged(user: { name: string; email: string }): Promise<void> {
    await this.mailCoreService.sendEmail({
      to: user.email,
      subject: 'Contraseña modificada exitosamente',
      template: 'auth/password-changed',
      context: {
        recipientName: user.name,
        recipientEmail: user.email,
        changeDate: new Date().toLocaleString('es-ES'),
        supportEmail: this.configService.get('SUPPORT_EMAIL'),
      },
      priority: EmailPriority.NORMAL,
    });
  }
}
```

---

## 🎧 **EVENT LISTENERS**

### **mail.listeners.ts**
```typescript
@Injectable()
export class MailEventListeners {
  private readonly logger = new Logger(MailEventListeners.name);

  constructor(
    private readonly authMailService: AuthMailService,
    private readonly notificationMailService: NotificationMailService
  ) {}

  @OnEvent('user.registered')
  async handleUserRegistered(event: UserRegisteredEvent) {
    this.logger.log(`Sending welcome email to: ${event.user.email}`);

    try {
      await this.authMailService.sendWelcomeEmail({
        name: event.user.name,
        email: event.user.email,
      });
    } catch (error) {
      this.logger.error(`Failed to send welcome email: ${error.message}`);
    }
  }

  @OnEvent('email.confirmation.requested')
  async handleEmailConfirmationRequested(event: EmailConfirmationRequestedEvent) {
    this.logger.log(`Sending email confirmation to: ${event.user.email}`);

    try {
      await this.authMailService.sendEmailConfirmation(event.user, event.token);
    } catch (error) {
      this.logger.error(`Failed to send email confirmation: ${error.message}`);
    }
  }

  @OnEvent('password.reset.requested')
  async handlePasswordResetRequested(event: PasswordResetRequestedEvent) {
    this.logger.log(`Sending password reset to: ${event.user.email}`);

    try {
      await this.authMailService.sendPasswordReset(event.user, event.token);
    } catch (error) {
      this.logger.error(`Failed to send password reset: ${error.message}`);
    }
  }

  @OnEvent('password.changed')
  async handlePasswordChanged(event: PasswordChangedEvent) {
    this.logger.log(`Sending password changed notification to: ${event.user.email}`);

    try {
      await this.authMailService.sendPasswordChanged(event.user);
    } catch (error) {
      this.logger.error(`Failed to send password changed notification: ${error.message}`);
    }
  }
}
```

---

## 📦 **MÓDULO PRINCIPAL**

### **mail.module.ts**
```typescript
@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const provider = configService.get('MAIL_PROVIDER');

        if (provider === 'resend') {
          return {
            transport: {
              host: 'smtp.resend.com',
              port: 587,
              secure: false,
              auth: {
                user: 'resend',
                pass: configService.get('RESEND_API_KEY'),
              },
            },
            defaults: {
              from: `${configService.get('DEFAULT_FROM_NAME')} <${configService.get('DEFAULT_FROM_EMAIL')}>`,
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

        // Configuración SMTP tradicional
        return {
          transport: {
            host: configService.get('SMTP_HOST'),
            port: configService.get('SMTP_PORT'),
            secure: false,
            auth: {
              user: configService.get('SMTP_USER'),
              pass: configService.get('SMTP_PASSWORD'),
            },
          },
          defaults: {
            from: `${configService.get('DEFAULT_FROM_NAME')} <${configService.get('DEFAULT_FROM_EMAIL')}>`,
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

    // Solo si usamos colas
    BullModule.registerQueue({
      name: 'mail',
    }),

    // Solo si usamos eventos
    EventEmitterModule.forRoot(),
  ],
  providers: [
    MailCoreService,
    AuthMailService,
    NotificationMailService,
    MarketingMailService,
    MailEventListeners,
  ],
  exports: [
    MailCoreService,
    AuthMailService,
    NotificationMailService,
    MarketingMailService,
  ],
})
export class MailModule {}
```

---

## 🎨 **PLANTILLAS DE EJEMPLO**

### **templates/auth/welcome.hbs**
```handlebars
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>¡Bienvenido!</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; background: #007bff; color: white; padding: 20px; }
    .content { padding: 20px; background: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; font-size: 14px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>¡Bienvenido, {{recipientName}}!</h1>
    </div>

    <div class="content">
      <p>Nos complace darte la bienvenida a nuestra plataforma.</p>

      <p>Tu cuenta ha sido creada exitosamente. Ahora puedes acceder a todas nuestras funcionalidades.</p>

      <p style="text-align: center;">
        <a href="{{loginUrl}}" class="button">Iniciar Sesión</a>
      </p>

      <p>Si tienes alguna pregunta, no dudes en contactarnos en {{supportEmail}}.</p>
    </div>

    <div class="footer">
      <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>
```

### **templates/auth/email-confirmation.hbs**
```handlebars
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Confirma tu correo electrónico</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; background: #28a745; color: white; padding: 20px; }
    .content { padding: 20px; background: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 4px; }
    .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 15px 0; }
    .footer { text-align: center; padding: 20px; font-size: 14px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Confirma tu correo electrónico</h1>
    </div>

    <div class="content">
      <p>Hola {{recipientName}},</p>

      <p>Para completar tu registro, necesitamos verificar tu dirección de correo electrónico.</p>

      <p style="text-align: center;">
        <a href="{{confirmationUrl}}" class="button">Confirmar Email</a>
      </p>

      <div class="warning">
        <strong>⚠️ Importante:</strong> Este enlace expira en {{expirationHours}} horas.
      </div>

      <p>Si no puedes hacer clic en el botón, copia y pega la siguiente URL en tu navegador:</p>
      <p style="word-break: break-all; font-size: 12px;">{{confirmationUrl}}</p>
    </div>

    <div class="footer">
      <p>Si no solicitaste este correo, puedes ignorarlo de forma segura.</p>
    </div>
  </div>
</body>
</html>
```

---

## 🚀 **EJEMPLO DE IMPLEMENTACIÓN: REGISTRO DE USUARIO**

### **En AuthService (registro de usuario)**
```typescript
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2, // Para eventos
    private readonly authMailService: AuthMailService // Para envío directo
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    // 1. Crear usuario
    const user = await this.userService.create({
      name: registerDto.name,
      email: registerDto.email,
      password: await bcrypt.hash(registerDto.password, 12),
      isEmailVerified: false,
    });

    // 2. Generar token de confirmación
    const confirmationToken = this.jwtService.sign(
      { userId: user.id, type: 'email-confirmation' },
      { expiresIn: '24h' }
    );

    // OPCIÓN A: Usar eventos (recomendado para desacoplamiento)
    this.eventEmitter.emit('user.registered', new UserRegisteredEvent(user));
    this.eventEmitter.emit('email.confirmation.requested',
      new EmailConfirmationRequestedEvent(
        { name: user.name, email: user.email },
        confirmationToken
      )
    );

    // OPCIÓN B: Llamada directa al servicio
    // await this.authMailService.sendWelcomeEmail(user);
    // await this.authMailService.sendEmailConfirmation(user, confirmationToken);

    return {
      message: 'Usuario registrado exitosamente. Revisa tu email para confirmar tu cuenta.'
    };
  }

  async confirmEmail(token: string): Promise<{ message: string }> {
    try {
      const payload = this.jwtService.verify(token);

      if (payload.type !== 'email-confirmation') {
        throw new UnauthorizedException('Token inválido');
      }

      await this.userService.confirmEmail(payload.userId);

      return { message: 'Email confirmado exitosamente' };
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
```

### **En AuthController**
```typescript
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('confirm-email')
  async confirmEmail(@Query('token') token: string) {
    return this.authService.confirmEmail(token);
  }
}
```

---

## 🎯 **BENEFICIOS DE ESTA ARQUITECTURA**

### ✅ **Principios SOLID**
- **S**: Cada servicio tiene una responsabilidad específica
- **O**: Fácil extensión con nuevos tipos de email
- **L**: Los servicios son intercambiables
- **I**: Interfaces específicas para cada dominio
- **D**: Dependencias inyectadas, no hard-coded

### ✅ **Patrón de NestJS**
- Módulos bien definidos
- Inyección de dependencias
- Decoradores para eventos
- Configuración environment-based

### ✅ **Escalabilidad**
- Sistema de colas para emails masivos
- Event-driven para desacoplamiento
- Templates reutilizables
- Fácil adición de nuevos proveedores

### ✅ **Mantenibilidad**
- Separación clara de responsabilidades
- Tests unitarios factibles
- Logging centralizado
- Manejo de errores robusto

---

## 🔄 **PRÓXIMOS PASOS**

1. **Configurar dominio en Resend** usando las DNS de AWS
2. **Implementar servicios base** (MailCoreService, AuthMailService)
3. **Crear plantillas básicas** (welcome, email-confirmation)
4. **Integrar con AuthModule** existente
5. **Agregar tests unitarios**
6. **Configurar monitoreo y métricas**

---

## 📝 **NOTAS IMPORTANTES**

- **Templates**: Usar Handlebars para máxima flexibilidad
- **Colas**: Bull + Redis para procesar emails en background
- **Eventos**: EventEmitter2 para desacoplamiento total
- **Configuración**: Todo via environment variables
- **Logging**: Logger de NestJS en todos los servicios
- **Errores**: Manejo graceful con reintentos automáticos

Este módulo será la base sólida para todos los emails de tu aplicación, siguiendo las mejores prácticas de NestJS 2025. 🚀