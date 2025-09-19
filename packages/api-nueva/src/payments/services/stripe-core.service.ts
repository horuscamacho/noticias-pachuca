import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Stripe from 'stripe';
import { AppConfigService } from '../../config/config.service';

@Injectable()
export class StripeCoreService implements OnModuleInit {
  private readonly logger = new Logger(StripeCoreService.name);
  private stripe: Stripe;

  constructor(private readonly configService: AppConfigService) {}

  onModuleInit() {
    this.initializeStripe();
  }

  private initializeStripe(): void {
    try {
      const config = this.configService.stripeConfig;

      this.stripe = new Stripe(config.secretKey, {
        apiVersion: config.apiVersion as Stripe.LatestApiVersion,
        telemetry: false, // Deshabilitar telemetría por seguridad
        timeout: config.timeout,
        maxNetworkRetries: config.maxNetworkRetries,
        // Configuraciones adicionales para producción
        httpAgent: undefined, // Usar agent por defecto
        protocol: 'https',
        host: 'api.stripe.com',
        port: 443,
      });

      this.logger.log(
        `✅ Stripe inicializado correctamente en modo: ${config.environment}`
      );

      if (config.environment === 'test') {
        this.logger.warn(
          '⚠️ Stripe configurado en MODO TEST - Solo para desarrollo'
        );
      }
    } catch (error) {
      this.logger.error('❌ Error inicializando Stripe:', error);
      throw error;
    }
  }

  // Getter para acceder al cliente Stripe
  get client(): Stripe {
    if (!this.stripe) {
      throw new Error('Stripe no ha sido inicializado');
    }
    return this.stripe;
  }

  // Método para verificar conectividad
  async healthCheck(): Promise<boolean> {
    try {
      await this.stripe.balance.retrieve();
      this.logger.log('✅ Conexión con Stripe API verificada');
      return true;
    } catch (error) {
      this.logger.error('❌ Error conectando con Stripe API:', error);
      return false;
    }
  }

  // Método para obtener información de la cuenta
  async getAccountInfo(): Promise<Stripe.Account> {
    try {
      return await this.stripe.accounts.retrieve();
    } catch (error) {
      this.logger.error('❌ Error obteniendo info de cuenta Stripe:', error);
      throw error;
    }
  }

  // Método para verificar webhook signature
  constructEvent(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (error) {
      this.logger.error('❌ Error verificando firma de webhook:', error);
      throw error;
    }
  }

  // Métodos helper para logging seguro (sin exponer datos sensibles)
  private sanitizeForLog(data: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...data };

    // Remover campos sensibles
    const sensitiveFields = [
      'card',
      'payment_method',
      'source',
      'client_secret',
      'customer_email'
    ];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  logStripeOperation(operation: string, data?: Record<string, unknown>): void {
    const sanitizedData = data ? this.sanitizeForLog(data) : {};
    this.logger.log(
      `🔄 Stripe ${operation}`,
      JSON.stringify(sanitizedData, null, 2)
    );
  }

  logStripeError(operation: string, error: unknown, data?: Record<string, unknown>): void {
    const sanitizedData = data ? this.sanitizeForLog(data) : {};
    this.logger.error(
      `❌ Stripe ${operation} failed`,
      {
        error: error instanceof Error ? error.message : String(error),
        data: sanitizedData
      }
    );
  }
}