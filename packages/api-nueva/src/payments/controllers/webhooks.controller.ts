import {
  Controller,
  Post,
  Body,
  Headers,
  HttpStatus,
  HttpException,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { StripeWebhookGuard } from '../guards/stripe-webhook.guard';
import { WebhookHandlerService } from '../services/webhook-handler.service';

@ApiTags('Webhooks')
@Controller('payments/webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly webhookHandler: WebhookHandlerService,
  ) {}

  @Post()
  @UseGuards(StripeWebhookGuard)
  @ApiOperation({
    summary: 'Recibir webhooks de Stripe',
    description: 'Endpoint para procesar eventos de webhooks de Stripe',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook procesado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Webhook inválido o firma incorrecta',
  })
  async handleWebhook(
    @Body() body: Buffer,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    try {
      this.logger.log('🔗 Webhook recibido de Stripe');

      await this.webhookHandler.processWebhook(body, signature);

      this.logger.log('✅ Webhook procesado exitosamente');

      return { received: true };
    } catch (error) {
      this.logger.error('❌ Error procesando webhook:', error);
      throw new HttpException(
        'Error procesando webhook',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}