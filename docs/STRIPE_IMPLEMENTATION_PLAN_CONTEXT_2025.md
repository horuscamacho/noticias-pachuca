# Plan de Implementación: Módulo de Pagos Stripe - Contexto del Proyecto 2025

## 🎯 ALCANCE DEL PROYECTO

### Funcionalidades Principales
- ✅ **Procesamiento de pagos únicos** (Payment Intents)
- ✅ **Gestión de suscripciones** (Subscriptions)
- ✅ **Manejo de webhooks** de Stripe
- ✅ **Gestión de clientes** (Customers)
- ✅ **Reembolsos** y cancelaciones
- ✅ **Notificaciones en tiempo real** (Socket.io)
- ✅ **Auditoría completa** (PCI DSS)

### 🧪 TESTING MANUAL - TRANSACCIONES DE PRUEBA
- ✅ **Stripe Test Mode** configurado desde el inicio
- ✅ **Tarjetas de prueba** para todos los escenarios
- ✅ **Endpoints de testing** para validación manual
- ✅ **Dashboard de pruebas** para monitoreo
- ✅ **Webhooks locales** con Stripe CLI
- ✅ **Simulación de errores** y edge cases
- ✅ **Testing de suscripciones** completo
- ✅ **Testing de notificaciones** (Push + Socket) integradas

### 📱 Casos de Prueba Manual Incluidos
1. **Pagos Exitosos**: Con diferentes montos y monedas + notificaciones automáticas
2. **Pagos Fallidos**: Tarjetas declinadas, fondos insuficientes + alertas
3. **Suscripciones**: Creación, modificación, cancelación + notificaciones
4. **Webhooks**: Todos los eventos críticos + procesamiento automático
5. **Reembolsos**: Parciales y completos + confirmaciones
6. **Autenticación 3D Secure**: Tarjetas que requieren autenticación
7. **Rate Limiting**: Pruebas de límites de velocidad
8. **Notificaciones Inteligentes**:
   - Web: Socket.io en tiempo real
   - Mobile foreground: Socket.io
   - Mobile background: Push notifications
   - Auto-routing según estado de app

## 📋 Análisis del Proyecto Actual

### Estructura del Proyecto NestJS (api-nueva)
- **Framework**: NestJS v11.0.1 (última versión estable)
- **TypeScript**: v5.7.3 ✅
- **Base de datos**: MongoDB con Mongoose v8.18.1
- **Cache/Redis**: Arquitectura moderna con @nestjs/cache-manager + @keyv/redis
- **Queue System**: Bull Queue para trabajos asíncronos
- **WebSockets**: Socket.io v4.8.1 con Redis Adapter
- **Autenticación**: JWT + Passport completo implementado

### ⚡ Infraestructura Existente APROVECHABLE

#### 🔥 Redis - Arquitectura Moderna 2025
```typescript
// YA CONFIGURADO - src/services/cache.service.ts
// Stack: @nestjs/cache-manager + @keyv/redis + cache-manager v7.2.0
// ✅ PERFECTO para idempotencia de pagos
// ✅ Rate limiting ya disponible
// ✅ Sessions de usuarios ya manejadas
```

#### 🔌 Sistema de Notificaciones COMPLETO - ARQUITECTURA PERFECTA
```typescript
// YA CONFIGURADO Y FUNCIONANDO PERFECTAMENTE:

// 🎯 NotificationRouterService - ROUTING INTELIGENTE
// ✅ AUTO routing: Web = Socket, Mobile = Push si background / Socket si foreground
// ✅ DeliveryMethod.AUTO = Decide automáticamente según estado de app
// ✅ DeliveryMethod.SOCKET = Solo WebSocket
// ✅ DeliveryMethod.PUSH = Solo Push notifications

// 🚀 SocketGateway - WEBSOCKETS AVANZADOS
// ✅ Redis Adapter para scaling horizontal
// ✅ Rooms por usuario (`user_${userId}`)
// ✅ Detección automática de plataforma (Web/Mobile)
// ✅ Manejo de estados de app (FOREGROUND/BACKGROUND)

// 📱 ExpoPushService - PUSH NOTIFICATIONS ENTERPRISE
// ✅ Batch notifications (chunking automático)
// ✅ Rate limiting integrado
// ✅ Receipt verification (confirmación de entrega)
// ✅ Retry automático con exponential backoff

// 🗄️ NotificationQueue - PERSISTENCIA Y TRACKING
// ✅ Queue de notificaciones con estados
// ✅ TTL automático (30 días)
// ✅ Retry logic implementado
// ✅ Auditoría completa de entregas

// 🎮 PARA PAGOS SOLO NECESITAMOS:
// ✅ Agregar NotificationType.PAYMENT_*
// ✅ Usar NotificationRouterService.sendNotification()
// ✅ ZERO código adicional de notificaciones!
```

#### 🚀 Queue System (Bull)
```typescript
// YA CONFIGURADO - app.module.ts líneas 91-112
// ✅ PERFECTO para:
//   - Webhooks de Stripe asíncronos
//   - Reintentos automáticos de pagos fallidos
//   - Procesamiento de suscripciones
//   - Generación de reportes de facturación
```

#### 🔐 Sistema de Autenticación Completo
```typescript
// YA IMPLEMENTADO:
// ✅ JWT Access + Refresh tokens
// ✅ Redis para blacklisting de tokens
// ✅ Sessions web + mobile
// ✅ Guards y decoradores
// ✅ Roles de usuario (incluye PREMIUM_USER)
```

#### 🎯 Esquema de Usuario - LISTO PARA STRIPE
```typescript
// src/schemas/user.schema.ts - YA TIENE:
stripeCustomerId?: string;     // ✅ LISTO
stripeSubscriptionId?: string; // ✅ LISTO
subscriptionStatus: SubscriptionStatus; // ✅ LISTO
subscriptionStartDate?: Date;  // ✅ LISTO
subscriptionEndDate?: Date;    // ✅ LISTO
```

### 🚫 Dependencias FALTANTES (para instalar)
```json
{
  "stripe": "^14.x.x",           // SDK principal de Stripe
  "@types/stripe": "^8.x.x",     // Tipos TypeScript
  "helmet": "^7.x.x",            // Seguridad adicional
  "express-rate-limit": "^7.x.x" // Rate limiting específico
}
```

## 📂 Plan de Estructura del Módulo de Pagos

### Estructura Recomendada (aprovechando arquitectura existente)
```
src/payments/
├── payments.module.ts
├── controllers/
│   ├── payments.controller.ts        // Pagos principales
│   ├── subscriptions.controller.ts   // Suscripciones
│   ├── webhooks.controller.ts        // Webhooks de Stripe (crítico)
│   └── customer.controller.ts        // Gestión de clientes
├── services/
│   ├── stripe-core.service.ts        // Cliente Stripe principal
│   ├── payment-processor.service.ts  // Lógica de pagos
│   ├── subscription.service.ts       // Lógica de suscripciones
│   ├── webhook-handler.service.ts    // Procesador de webhooks
│   ├── idempotency.service.ts        // Usando Redis existente
│   └── payment-logger.service.ts     // Auditoría completa
│   // ❌ NO CREAR notification-payment.service.ts
│   // ✅ USAR NotificationRouterService existente
├── dto/
│   ├── create-payment.dto.ts
│   ├── payment-intent.dto.ts
│   ├── subscription.dto.ts
│   ├── webhook-event.dto.ts
│   └── customer.dto.ts
├── schemas/
│   ├── payment.schema.ts
│   ├── payment-method.schema.ts
│   ├── subscription-plan.schema.ts
│   ├── transaction-log.schema.ts
│   └── webhook-event.schema.ts
├── interfaces/
│   ├── payment-gateway.interface.ts
│   ├── subscription.interface.ts
│   └── webhook.interface.ts
├── guards/
│   ├── stripe-webhook.guard.ts       // Validación de firmas
│   └── payment-permission.guard.ts   // Permisos de roles
├── middleware/
│   ├── raw-body.middleware.ts        // CRÍTICO para webhooks
│   └── payment-rate-limit.middleware.ts // Rate limiting específico
├── decorators/
│   ├── stripe-signature.decorator.ts
│   └── payment-user.decorator.ts
└── queues/
    ├── payment-processor.queue.ts    // Integrar con Bull existente
    ├── webhook-processor.queue.ts
    └── subscription-processor.queue.ts
```

## ✅ CHECKLIST DETALLADO DE IMPLEMENTACIÓN

### 🔧 FASE 1: Configuración Base (Semana 1)

#### 📦 Instalación de Dependencias
- [ ] `yarn add stripe @types/stripe helmet express-rate-limit`
- [ ] `yarn add @types/express-rate-limit --dev`
- [ ] Verificar compatibilidad con NestJS v11
- [ ] ✅ **NotificationsModule ya importado** - USAR directamente
- [ ] ✅ **ExpoPushService ya disponible** - NO reinstalar
- [ ] ✅ **SocketGateway ya funcionando** - SOLO integrar

#### ⚙️ Configuración de Variables de Entorno
- [ ] Agregar a `src/config/configuration.ts`:
```typescript
stripe: {
  secretKey: process.env.STRIPE_SECRET_KEY,
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  apiVersion: '2023-10-16',
  maxNetworkRetries: 3,
  timeout: 30000,
},
```

- [ ] Actualizar `src/config/validation.schema.ts` con validaciones Joi
- [ ] Crear archivos `.env` específicos por ambiente

#### 🔒 Configuración de Seguridad Base
- [ ] Configurar Helmet en `main.ts`
- [ ] Configurar CORS específico para Stripe
- [ ] **CRÍTICO**: Configurar raw body middleware para webhooks:
```typescript
// main.ts - ANTES de app.useGlobalPipes()
app.use('/api/payments/webhooks', express.raw({ type: 'application/json' }));
```

### 🏗️ FASE 2: Módulo Core y Servicios (Semana 2)

#### 📋 PaymentsModule Principal
- [ ] Crear `payments.module.ts` con:
  - [ ] Importar ConfigModule, MongooseModule
  - [ ] Importar CacheModule (Redis ya configurado)
  - [ ] Importar BullModule (para queues)
  - [ ] Registrar todos los providers

#### 🔧 Servicios Core
- [ ] **StripeCoreService**: Cliente Stripe principal
```typescript
@Injectable()
export class StripeCoreService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(
      this.configService.get<string>('config.stripe.secretKey'),
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

- [ ] **IdempotencyService**: Aprovechando Redis existente
```typescript
@Injectable()
export class IdempotencyService {
  constructor(private cacheService: CacheService) {} // USAR servicio existente

  async processWithIdempotency<T>(
    key: string,
    operation: () => Promise<T>
  ): Promise<T> {
    // Implementación usando cacheService.get/set
  }
}
```

- [ ] **PaymentLoggerService**: Auditoría completa PCI DSS
- [ ] ✅ **USAR NotificationRouterService existente** - NO crear PaymentNotificationService
```typescript
// En PaymentProcessorService
constructor(
  private notificationRouter: NotificationRouterService // IMPORTAR EXISTENTE
) {}

// Para notificar pago exitoso
await this.notificationRouter.sendNotification({
  userId: payment.userId,
  type: NotificationType.PAYMENT_SUCCESS, // AGREGAR este tipo
  deliveryMethod: DeliveryMethod.AUTO, // ROUTING INTELIGENTE
  notification: {
    title: 'Pago exitoso',
    body: `Tu pago de $${payment.amount} fue procesado`,
    data: { paymentId: payment.id }
  }
});
```

### 🎯 FASE 3: DTOs y Validaciones (Semana 2-3)

#### 📝 DTOs con Class-Validator (YA INSTALADO)
- [ ] **IMPORTANTE**: Todos los DTOs con tipado estricto (NO usar `any`)
```typescript
export class CreatePaymentDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsEnum(['usd', 'mxn'])
  currency: 'usd' | 'mxn';

  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;

  @IsOptional()
  @IsString()
  description?: string;
}
```

- [ ] CreatePaymentDto, UpdatePaymentDto
- [ ] CreateSubscriptionDto, UpdateSubscriptionDto
- [ ] WebhookEventDto (con validación de firmas)
- [ ] CustomerDto (para Stripe customers)

### 🗄️ FASE 4: Esquemas de Base de Datos (Semana 3)

#### 📊 Esquemas MongoDB
- [ ] **Payment Schema**:
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
  status: PaymentStatus;

  @Prop({ required: true })
  idempotencyKey: string;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>; // NO usar any
}
```

- [ ] TransactionLog Schema (auditoría PCI DSS)
- [ ] SubscriptionPlan Schema
- [ ] WebhookEvent Schema (para tracking)

### 🎮 FASE 5: Controladores y Endpoints (Semana 4)

#### 🚀 PaymentsController
- [ ] POST `/api/payments/create-intent` - Crear Payment Intent
- [ ] POST `/api/payments/confirm` - Confirmar pago
- [ ] GET `/api/payments/:id` - Obtener pago
- [ ] GET `/api/payments/user/:userId` - Pagos del usuario
- [ ] POST `/api/payments/refund` - Procesar reembolsos

#### 📋 SubscriptionsController
- [ ] POST `/api/payments/subscriptions` - Crear suscripción
- [ ] GET `/api/payments/subscriptions/:id` - Obtener suscripción
- [ ] PUT `/api/payments/subscriptions/:id` - Actualizar suscripción
- [ ] DELETE `/api/payments/subscriptions/:id` - Cancelar suscripción

#### 🔗 WebhooksController - **CRÍTICO**
- [ ] POST `/api/payments/webhooks` - Endpoint principal de webhooks
- [ ] Validación de firma de Stripe
- [ ] Procesamiento asíncrono con Bull Queue
- [ ] Rate limiting específico

### 🔒 FASE 6: Seguridad y Middleware (Semana 4-5)

#### 🛡️ Guards y Middleware
- [ ] **StripeWebhookGuard**: Validación de firmas
```typescript
@Injectable()
export class StripeWebhookGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['stripe-signature'];

    // Validar firma de Stripe usando raw body
    return this.webhookService.validateSignature(request.body, signature);
  }
}
```

- [ ] **PaymentPermissionGuard**: Control de roles
- [ ] **RawBodyMiddleware**: Para webhooks (CRÍTICO)
- [ ] **PaymentRateLimitMiddleware**: Rate limiting específico

#### 🔐 Decoradores Personalizados
- [ ] @StripeSignature() - Extraer firma de webhook
- [ ] @PaymentUser() - Usuario autenticado con permisos de pago

### ⚡ FASE 7: Integración con Infraestructura Existente (Semana 5)

#### 🔔 NOTIFICACIONES - USAR SISTEMA EXISTENTE COMPLETO
- [ ] ✅ **AGREGAR tipos de notificación de pagos** a `notification-queue.schema.ts`:
```typescript
export enum NotificationType {
  // ... tipos existentes
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_PENDING = 'payment_pending',
  SUBSCRIPTION_CREATED = 'subscription_created',
  SUBSCRIPTION_UPDATED = 'subscription_updated',
  SUBSCRIPTION_CANCELLED = 'subscription_cancelled',
  REFUND_PROCESSED = 'refund_processed',
}
```

- [ ] ✅ **IMPORTAR NotificationRouterService** en PaymentsModule:
```typescript
// payments.module.ts
imports: [
  NotificationsModule, // YA EXISTE - solo importar
],
```

- [ ] ✅ **USAR NotificationRouterService** en servicios de pago:
```typescript
// PaymentProcessorService
async notifyPaymentSuccess(userId: string, paymentData: PaymentResult) {
  return this.notificationRouter.sendNotification({
    userId,
    type: NotificationType.PAYMENT_SUCCESS,
    deliveryMethod: DeliveryMethod.AUTO, // ROUTING AUTOMÁTICO
    notification: {
      title: '✅ Pago exitoso',
      body: `Tu pago de $${paymentData.amount} ${paymentData.currency.toUpperCase()} fue procesado exitosamente`,
      data: {
        paymentId: paymentData.id,
        amount: paymentData.amount,
        currency: paymentData.currency,
        timestamp: new Date().toISOString()
      },
      priority: 'high',
      actionUrl: `/payments/${paymentData.id}`
    }
  });
  // ✅ AUTOMÁTICAMENTE:
  // - Web usuarios: Socket.io en tiempo real
  // - Mobile foreground: Socket.io
  // - Mobile background: Push notification
}
```

#### 🔄 Queues Asíncronas
- [ ] Configurar Bull Queues para:
  - [ ] Procesamiento de webhooks
  - [ ] Reintentos de pagos fallidos
  - [ ] Actualización de suscripciones
  - [ ] Generación de reportes

#### 💾 Cache con Redis
- [ ] Cache de Payment Intents por TTL corto
- [ ] Cache de datos de customer por usuario
- [ ] Idempotencia con TTL de 24h

### 🧪 FASE 8: Testing y Validación (Semana 6)

#### 🔬 Tests Unitarios
- [ ] Tests de servicios con mocks de Stripe
- [ ] Tests de validación de DTOs
- [ ] Tests de idempotencia
- [ ] Tests de webhook signature validation

#### 🌐 Tests de Integración
- [ ] Tests con Stripe Test Mode
- [ ] Tests de webhooks con Stripe CLI
- [ ] Tests de rate limiting
- [ ] Tests de notificaciones Socket.io

#### 🧰 Configuración de Testing
- [ ] Mock del StripeService para tests
- [ ] Setup de base de datos de testing
- [ ] Configuración de Redis test

### 📊 FASE 9: Monitoreo y Logging (Semana 7)

#### 📈 Métricas y Monitoring
- [ ] Dashboard de pagos en tiempo real
- [ ] Alertas de pagos fallidos
- [ ] Métricas de conversión
- [ ] Health checks de Stripe API

#### 📝 Logging PCI DSS Compliant
- [ ] Log de todos los intentos de pago
- [ ] Log de accesos a datos sensibles
- [ ] Auditoría de cambios en suscripciones
- [ ] Retención de logs por compliance

### 🚀 FASE 10: Despliegue y Optimización (Semana 8)

#### 🔧 Configuración de Producción
- [ ] Variables de entorno por ambiente
- [ ] SSL/TLS obligatorio para webhooks
- [ ] Rate limiting en producción
- [ ] Backup automático de logs de pago

#### ⚡ Optimizaciones de Performance
- [ ] Cache de consultas frecuentes
- [ ] Índices de base de datos optimizados
- [ ] Connection pooling optimizado
- [ ] CDN para assets estáticos

## 🛠️ Comandos de Instalación y Setup

### 📦 Instalación de Dependencias
```bash
# En /packages/api-nueva
yarn add stripe @types/stripe helmet express-rate-limit

# Dev dependencies si necesario
yarn add --dev @types/express-rate-limit

# ✅ YA INSTALADO - NO INSTALAR:
# - expo-server-sdk (para push notifications)
# - @nestjs/cache-manager (para Redis)
# - socket.io (para WebSockets)
# - ioredis (para Redis)
```

### 🎯 CONFIGURACIÓN DE TESTING MANUAL STRIPE

#### Tarjetas de Prueba Principales
```bash
# Tarjetas exitosas
4242424242424242  # Visa
4000056655665556  # Visa (debit)
5555555555554444  # Mastercard
2223003122003222  # Mastercard (2-series)
4000002500003155  # Visa (prepaid)

# Tarjetas que fallan
4000000000000002  # Declined
4000000000009995  # Insufficient funds
4000000000009987  # Lost card
4000000000009979  # Stolen card

# 3D Secure (requiere autenticación)
4000002760003184  # 3D Secure required
4000003800000446  # 3D Secure required (UK)
```

### 🧪 Setup de Testing con Stripe
```bash
# Instalar Stripe CLI globalmente
yarn global add @stripe/stripe-cli

# o con npm
npm install -g @stripe/stripe-cli

# Para testing local de webhooks
stripe listen --forward-to localhost:3000/api/payments/webhooks
```

### 🔧 Scripts de Package.json Adicionales
```json
{
  "scripts": {
    "stripe:listen": "stripe listen --forward-to localhost:3000/api/payments/webhooks",
    "test:payments": "jest --testPathPattern=payments",
    "test:webhooks": "jest --testPathPattern=webhooks"
  }
}
```

## ⚠️ CONSIDERACIONES CRÍTICAS DE IMPLEMENTACIÓN

### 🚫 PROHIBICIONES ESTRICTAS
- **NUNCA usar `any` en TypeScript** - Todos los types deben ser explícitos
- **NUNCA hardcodear claves** - Siempre usar variables de entorno
- **NUNCA loggear datos sensibles** - PCI DSS compliance
- **NUNCA procesar pagos sin idempotencia** - Prevenir cargos duplicados

### 🔥 VENTAJAS DE LA ARQUITECTURA ACTUAL
- ✅ **Redis ya configurado** - Perfecto para idempotencia y rate limiting
- ✅ **Socket.io implementado** - Notificaciones en tiempo real listas
- ✅ **Bull Queue disponible** - Procesamiento asíncrono de webhooks
- ✅ **Sistema auth completo** - JWT + roles + guards ya implementados
- ✅ **User schema preparado** - Campos de Stripe ya definidos
- ✅ **MongoDB con índices** - Performance optimizada desde el inicio

### 🎯 INTEGRACIÓN CON EXISTENTE
- **CacheService**: Usar para idempotencia y cache de datos
- **SocketGateway**: Notificaciones de pagos en tiempo real
- **RedisAuthService**: Sesiones y autenticación ya manejadas
- **User Schema**: Campos de Stripe ya preparados
- **Config Service**: Configuración tipada ya implementada

### 📋 CHECKLIST DE VERIFICACIÓN FINAL
- [ ] Todos los endpoints protegidos con guards apropiados
- [ ] Todos los DTOs validados con class-validator
- [ ] Todos los schemas con índices optimizados
- [ ] Todos los servicios con proper error handling
- [ ] Todos los webhooks con validación de firma
- [ ] Todos los pagos con idempotencia implementada
- [ ] Todos los logs PCI DSS compliant
- [ ] Todas las notificaciones integradas con Socket.io
- [ ] Todos los tests unitarios y de integración
- [ ] Toda la documentación actualizada

## 🎯 CRONOGRAMA ESTIMADO

- **Semana 1**: Configuración base y dependencias
- **Semana 2**: Servicios core y DTOs
- **Semana 3**: Esquemas y validaciones
- **Semana 4**: Controladores y endpoints
- **Semana 5**: Integración con infraestructura existente
- **Semana 6**: Testing exhaustivo
- **Semana 7**: Monitoreo y logging
- **Semana 8**: Despliegue y optimización

**Total: 8 semanas para implementación completa**

---

**Fecha de Creación**: Septiembre 2025
**Versión**: 1.0
**Próxima Revisión**: Al completar cada fase

**IMPORTANTE**: Este plan aprovecha al máximo la infraestructura ya implementada en el proyecto, evitando duplicación de código y maximizando la eficiencia de desarrollo.