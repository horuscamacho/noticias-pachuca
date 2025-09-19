# Investigación de Implementación: Pasarela de Pagos Stripe en NestJS 2025

## Resumen Ejecutivo

Este documento presenta una investigación completa sobre la implementación segura y estructurada de la pasarela de pagos Stripe en el proyecto NestJS (api-nueva), basado en las mejores prácticas y estándares de seguridad para 2025-2026.

## 1. Análisis del Proyecto Actual

### Estructura del Proyecto NestJS
- **Ubicación**: `/packages/api-nueva/`
- **Framework**: NestJS v11.0.1
- **Base de datos**: MongoDB (Mongoose)
- **Autenticación**: JWT, Passport
- **Infraestructura**: Redis, Socket.io, Bull Queue
- **Características actuales**: Analytics, notificaciones, módulo de email

### Dependencias Relevantes Existentes
```json
{
  "@nestjs/jwt": "^11.0.0",
  "@nestjs/passport": "^11.0.5",
  "@nestjs/config": "^4.0.2",
  "bcryptjs": "^3.0.2",
  "class-validator": "^0.14.2",
  "joi": "^18.0.1"
}
```

## 2. Arquitectura Recomendada para el Módulo de Pagos

### 2.1 Estructura Modular Sugerida

```
src/
└── payments/
    ├── payments.module.ts
    ├── controllers/
    │   ├── payments.controller.ts
    │   ├── webhooks.controller.ts
    │   └── subscriptions.controller.ts
    ├── services/
    │   ├── stripe-core.service.ts
    │   ├── payment-processor.service.ts
    │   ├── webhook-handler.service.ts
    │   ├── idempotency.service.ts
    │   └── payment-logger.service.ts
    ├── dto/
    │   ├── create-payment.dto.ts
    │   ├── payment-intent.dto.ts
    │   ├── webhook-event.dto.ts
    │   └── subscription.dto.ts
    ├── schemas/
    │   ├── payment.schema.ts
    │   ├── transaction-log.schema.ts
    │   └── idempotency-key.schema.ts
    ├── interfaces/
    │   ├── payment-gateway.interface.ts
    │   ├── payment-method.interface.ts
    │   └── webhook-event.interface.ts
    ├── decorators/
    │   ├── raw-body.decorator.ts
    │   └── stripe-signature.decorator.ts
    ├── guards/
    │   ├── stripe-webhook.guard.ts
    │   └── payment-auth.guard.ts
    └── middleware/
        ├── raw-body.middleware.ts
        └── rate-limit.middleware.ts
```

### 2.2 Patrones de Diseño Recomendados

#### Strategy Pattern para Múltiples Proveedores
```typescript
interface PaymentGateway {
  processPayment(paymentData: PaymentDto): Promise<PaymentResult>;
  handleWebhook(event: WebhookEvent): Promise<void>;
  createSubscription(subscriptionData: SubscriptionDto): Promise<SubscriptionResult>;
}

@Injectable()
export class StripeGateway implements PaymentGateway {
  // Implementación específica para Stripe
}
```

#### Adapter Pattern para Integración
```typescript
@Injectable()
export class PaymentAdapterService {
  constructor(
    @Inject('PAYMENT_STRATEGY') private paymentGateway: PaymentGateway
  ) {}

  async processPayment(paymentData: PaymentDto): Promise<PaymentResult> {
    return this.paymentGateway.processPayment(paymentData);
  }
}
```

## 3. Implementación de Seguridad

### 3.1 Configuración de Variables de Entorno
```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_API_VERSION=2023-10-16

# Security Configuration
PAYMENT_ENCRYPTION_KEY=...
IDEMPOTENCY_TTL=86400
RATE_LIMIT_PAYMENTS=100
```

### 3.2 Validación de Webhooks de Stripe
```typescript
@Controller('stripe/webhooks')
export class StripeWebhooksController {
  constructor(private readonly webhookService: WebhookHandlerService) {}

  @Post()
  @UseGuards(StripeWebhookGuard)
  @RawBody()
  async handleWebhook(
    @Body() body: Buffer,
    @Headers('stripe-signature') signature: string
  ) {
    const event = this.webhookService.validateSignature(body, signature);
    return this.webhookService.processEvent(event);
  }
}
```

### 3.3 Middleware para Raw Body (Crítico para Webhooks)
```typescript
@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.originalUrl.includes('/stripe/webhooks')) {
      req.body = req.body || Buffer.from('');
    }
    next();
  }
}
```

### 3.4 Implementación de Idempotencia
```typescript
@Injectable()
export class IdempotencyService {
  async processWithIdempotency<T>(
    key: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const existing = await this.getIdempotencyResult(key);
    if (existing) {
      return existing;
    }

    const result = await operation();
    await this.storeIdempotencyResult(key, result);
    return result;
  }
}
```

## 4. Configuraciones de Seguridad PCI DSS 4.0.1 (2025)

### 4.1 Requisitos Obligatorios desde Marzo 2025

#### Cifrado de Datos
- **Algoritmo mínimo**: AES-256
- **Gestión de claves**: Separación y rotación automática
- **Transmisión**: TLS 1.3 obligatorio

#### Logging y Monitoreo
```typescript
@Injectable()
export class PaymentLoggerService {
  async logPaymentAttempt(paymentData: PaymentAttemptDto) {
    // Log con timestamp, usuario, monto, resultado
    await this.auditService.log({
      event: 'PAYMENT_ATTEMPT',
      timestamp: new Date(),
      userId: paymentData.userId,
      amount: paymentData.amount,
      currency: paymentData.currency,
      result: paymentData.result,
      ipAddress: this.getClientIp(),
      userAgent: this.getUserAgent()
    });
  }
}
```

#### Análisis de Riesgos Automatizado
```typescript
@Injectable()
export class RiskAnalysisService {
  async analyzePayment(paymentData: PaymentDto): Promise<RiskScore> {
    const factors = {
      amount: this.analyzeAmount(paymentData.amount),
      location: await this.analyzeLocation(paymentData.clientIp),
      frequency: await this.analyzeFrequency(paymentData.userId),
      device: this.analyzeDevice(paymentData.deviceFingerprint)
    };

    return this.calculateRiskScore(factors);
  }
}
```

### 4.2 Controles de Acceso
```typescript
@Injectable()
export class PaymentAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Verificar permisos específicos para pagos
    const userPermissions = this.getUserPermissions(request.user);
    return userPermissions.includes('PROCESS_PAYMENTS');
  }
}
```

## 5. Implementación del SDK de Stripe

### 5.1 Configuración del Cliente Stripe
```typescript
@Injectable()
export class StripeCoreService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY'),
      {
        apiVersion: '2023-10-16',
        telemetry: false, // Por seguridad
        timeout: 30000,
        maxNetworkRetries: 3
      }
    );
  }
}
```

### 5.2 Procesamiento de Pagos con Manejo de Errores
```typescript
@Injectable()
export class PaymentProcessorService {
  async createPaymentIntent(
    paymentData: CreatePaymentDto
  ): Promise<PaymentIntentResult> {
    try {
      const idempotencyKey = this.generateIdempotencyKey(paymentData);

      return await this.idempotencyService.processWithIdempotency(
        idempotencyKey,
        async () => {
          const paymentIntent = await this.stripe.paymentIntents.create({
            amount: paymentData.amount,
            currency: paymentData.currency,
            customer: paymentData.customerId,
            payment_method: paymentData.paymentMethodId,
            confirmation_method: 'manual',
            confirm: true,
            return_url: paymentData.returnUrl
          }, {
            idempotencyKey
          });

          await this.logPaymentAttempt(paymentData, paymentIntent);
          return this.mapPaymentIntentToResult(paymentIntent);
        }
      );
    } catch (error) {
      await this.handlePaymentError(error, paymentData);
      throw new PaymentProcessingException(error.message);
    }
  }
}
```

### 5.3 Manejo de Suscripciones
```typescript
@Injectable()
export class SubscriptionService {
  async createSubscription(
    subscriptionData: CreateSubscriptionDto
  ): Promise<SubscriptionResult> {
    const subscription = await this.stripe.subscriptions.create({
      customer: subscriptionData.customerId,
      items: [{
        price: subscriptionData.priceId,
        quantity: subscriptionData.quantity
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription'
      },
      expand: ['latest_invoice.payment_intent']
    });

    return this.mapSubscriptionToResult(subscription);
  }
}
```

## 6. Gestión de Webhooks

### 6.1 Configuración de Bootstrap para Raw Body
```typescript
// main.ts
app.use('/stripe/webhooks', express.raw({ type: 'application/json' }));
```

### 6.2 Procesador de Eventos
```typescript
@Injectable()
export class WebhookHandlerService {
  async processEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        this.logger.warn(`Unhandled event type: ${event.type}`);
    }
  }
}
```

## 7. Esquemas de Base de Datos

### 7.1 Schema de Pagos
```typescript
@Schema({ timestamps: true })
export class Payment {
  @Prop({ required: true })
  stripePaymentIntentId: string;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true, enum: ['pending', 'succeeded', 'failed', 'canceled'] })
  status: string;

  @Prop()
  description?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop()
  failureReason?: string;

  @Prop({ required: true })
  idempotencyKey: string;
}
```

### 7.2 Schema de Logs de Transacciones
```typescript
@Schema({ timestamps: true })
export class TransactionLog {
  @Prop({ required: true })
  eventType: string;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Payment' })
  paymentId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ type: Object })
  eventData: Record<string, any>;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop({ required: true })
  checksum: string; // Para integridad de datos
}
```

## 8. Testing y Validación

### 8.1 Testing de Webhooks en Desarrollo
```bash
# Instalar Stripe CLI
npm install -g stripe-cli

# Escuchar webhooks locales
stripe listen --forward-to localhost:3000/stripe/webhooks

# Disparar eventos de prueba
stripe trigger payment_intent.succeeded
```

### 8.2 Tests Unitarios Críticos
```typescript
describe('PaymentProcessorService', () => {
  it('should handle duplicate payment attempts with idempotency', async () => {
    const paymentData = createMockPaymentData();
    const firstResult = await service.createPaymentIntent(paymentData);
    const secondResult = await service.createPaymentIntent(paymentData);

    expect(firstResult.id).toBe(secondResult.id);
    expect(mockStripe.paymentIntents.create).toHaveBeenCalledTimes(1);
  });
});
```

## 9. Configuración de Rate Limiting

### 9.1 Protección contra Ataques
```typescript
@Injectable()
export class PaymentRateLimitGuard implements CanActivate {
  constructor(private redis: Redis) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const key = `payment_rate_limit:${userId}`;

    const current = await this.redis.incr(key);
    if (current === 1) {
      await this.redis.expire(key, 3600); // 1 hora
    }

    return current <= 50; // Máximo 50 intentos por hora
  }
}
```

## 10. Monitoreo y Alertas

### 10.1 Métricas Clave
- Tasa de éxito de pagos
- Tiempo de respuesta promedio
- Errores de webhook
- Intentos de fraude detectados
- Volumen de transacciones por periodo

### 10.2 Alertas Automáticas
```typescript
@Injectable()
export class PaymentMonitoringService {
  async checkPaymentHealth(): Promise<HealthStatus> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const metrics = {
      successRate: await this.calculateSuccessRate(last24Hours),
      averageResponseTime: await this.calculateAverageResponseTime(last24Hours),
      errorCount: await this.countErrors(last24Hours)
    };

    if (metrics.successRate < 0.95) {
      await this.sendAlert('LOW_SUCCESS_RATE', metrics);
    }

    return metrics;
  }
}
```

## 11. Consideraciones de Despliegue

### 11.1 Variables de Entorno por Ambiente
```yaml
# development.env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# production.env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...
```

### 11.2 Configuración de HTTPS Obligatoria
```typescript
// Solo para producción
if (process.env.NODE_ENV === 'production') {
  app.use(helmet());
  app.use(enforceHttps());
}
```

## 12. Roadmap de Implementación

### Fase 1: Configuración Básica (Semana 1-2)
- [ ] Configurar módulo de pagos
- [ ] Implementar servicio básico de Stripe
- [ ] Configurar variables de entorno
- [ ] Implementar DTOs y validaciones

### Fase 2: Funcionalidades Core (Semana 3-4)
- [ ] Implementar procesamiento de pagos
- [ ] Configurar webhooks con validación de firma
- [ ] Implementar sistema de idempotencia
- [ ] Agregar logging de transacciones

### Fase 3: Seguridad Avanzada (Semana 5-6)
- [ ] Implementar análisis de riesgos
- [ ] Configurar rate limiting
- [ ] Implementar cifrado de datos sensibles
- [ ] Configurar monitoreo automático

### Fase 4: Testing y Optimización (Semana 7-8)
- [ ] Tests unitarios completos
- [ ] Tests de integración con Stripe
- [ ] Optimización de performance
- [ ] Documentación técnica

## 13. Dependencias Requeridas

### 13.1 Paquetes NPM Adicionales
```json
{
  "stripe": "^14.x.x",
  "@types/stripe": "^8.x.x",
  "helmet": "^7.x.x",
  "express-rate-limit": "^7.x.x",
  "crypto": "^1.x.x"
}
```

### 13.2 Configuración de Package.json
```json
{
  "scripts": {
    "stripe:listen": "stripe listen --forward-to localhost:3000/stripe/webhooks",
    "test:payments": "jest --testPathPattern=payments"
  }
}
```

## Conclusiones

La implementación de Stripe en NestJS para 2025 requiere un enfoque integral que priorice:

1. **Seguridad PCI DSS 4.0.1**: Cumplimiento obligatorio de nuevos requisitos
2. **Arquitectura Modular**: Uso de patrones Strategy y Adapter para escalabilidad
3. **Manejo Robusto de Errores**: Implementación de idempotencia y retry logic
4. **Monitoreo Continuo**: Alertas automáticas y métricas en tiempo real
5. **Testing Exhaustivo**: Cobertura completa de casos edge y webhooks

Este enfoque garantiza una implementación segura, escalable y mantenible que cumple con los estándares más exigentes de la industria de pagos.

---

**Fecha de Investigación**: Septiembre 2025
**Versión del Documento**: 1.0
**Próxima Revisión**: Octubre 2025