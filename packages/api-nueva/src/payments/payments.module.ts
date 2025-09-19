import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

// Importar NotificationsModule existente
import { NotificationsModule } from '../notifications/notifications.module';

// Importar servicios comunes
import { PaginationService } from '../common/services/pagination.service';
import { AppConfigService } from '../config/config.service';
import { CacheService } from '../services/cache.service';

// Schemas
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { TransactionLog, TransactionLogSchema } from './schemas/transaction-log.schema';

// Controllers
import { PaymentsController } from './controllers/payments.controller';
import { WebhooksController } from './controllers/webhooks.controller';
import { SubscriptionsController } from './controllers/subscriptions.controller';

// Services
import { StripeCoreService } from './services/stripe-core.service';
import { PaymentProcessorService } from './services/payment-processor.service';
import { IdempotencyService } from './services/idempotency.service';
import { WebhookHandlerService } from './services/webhook-handler.service';
import { PaymentLoggerService } from './services/payment-logger.service';
import { SubscriptionService } from './services/subscription.service';

// Guards
import { StripeWebhookGuard } from './guards/stripe-webhook.guard';

@Module({
  imports: [
    ConfigModule,

    // 🔔 IMPORTAR SISTEMA DE NOTIFICACIONES EXISTENTE
    NotificationsModule,

    // Schemas de MongoDB
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: TransactionLog.name, schema: TransactionLogSchema },
    ]),
  ],

  controllers: [
    PaymentsController,
    WebhooksController,
    SubscriptionsController,
  ],

  providers: [
    // Core Services
    StripeCoreService,
    PaymentProcessorService,
    IdempotencyService,
    WebhookHandlerService,
    PaymentLoggerService,
    SubscriptionService,

    // Common Services
    PaginationService,
    AppConfigService,
    CacheService,

    // Guards
    StripeWebhookGuard,
  ],

  exports: [
    PaymentProcessorService,
    SubscriptionService,
    IdempotencyService,
    PaymentLoggerService,
  ],
})
export class PaymentsModule {}