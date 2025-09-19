import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';

import { StripeCoreService } from '../services/stripe-core.service';
import { AppConfigService } from '../../config/config.service';

@Injectable()
export class StripeWebhookGuard implements CanActivate {
  private readonly logger = new Logger(StripeWebhookGuard.name);

  constructor(
    private readonly stripeService: StripeCoreService,
    private readonly configService: AppConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    try {
      // Obtener el signature header
      const signature = request.headers['stripe-signature'] as string;

      if (!signature) {
        this.logger.error('❌ Webhook sin firma de Stripe');
        throw new UnauthorizedException('Webhook signature missing');
      }

      // Obtener el body raw
      const body = request.body;

      if (!body) {
        this.logger.error('❌ Webhook sin body');
        throw new UnauthorizedException('Webhook body missing');
      }

      // Verificar la firma usando el servicio de Stripe
      const webhookSecret = this.configService.stripeWebhookSecret;

      if (!webhookSecret) {
        this.logger.error('❌ Webhook secret no configurado');
        throw new UnauthorizedException('Webhook secret not configured');
      }

      // Intentar construir el evento - esto verifica la firma
      const event = this.stripeService.constructEvent(
        body,
        signature,
        webhookSecret,
      );

      // Agregar el evento verificado al request para uso posterior
      (request as any).stripeEvent = event;

      this.logger.log(`✅ Webhook verificado: ${event.type} - ID: ${event.id}`);

      return true;
    } catch (error) {
      this.logger.error('❌ Error verificando webhook de Stripe:', error);
      throw new UnauthorizedException('Invalid webhook signature');
    }
  }
}