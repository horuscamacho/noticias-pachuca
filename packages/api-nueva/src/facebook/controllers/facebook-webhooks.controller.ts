import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Headers,
  HttpStatus,
  HttpCode,
  HttpException,
  Logger,
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { FacebookWebhookGuard } from '../guards/facebook-webhook.guard';
import { FacebookWebhookPayload } from '../interfaces/facebook-api.interface';
import { FacebookMonitorService } from '../services/facebook-monitor.service';
import { WebhookEventDto } from '../dto/webhook-event.dto';

@ApiTags('Facebook Webhooks')
@Controller('facebook/webhooks')
export class FacebookWebhooksController {
  private readonly logger = new Logger(FacebookWebhooksController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly monitorService: FacebookMonitorService
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.challenge') challenge: string,
    @Query('hub.verify_token') verifyToken: string
  ): Promise<string> {
    const expectedToken = this.configService.get<string>('config.facebook.webhookVerifyToken');

    if (mode === 'subscribe' && verifyToken === expectedToken) {
      this.logger.log('Webhook verified successfully');
      return challenge;
    }

    this.logger.warn('Webhook verification failed');
    throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(FacebookWebhookGuard)
  @ApiOperation({ summary: 'Receive Facebook webhook events' })
  @ApiResponse({ status: 200, description: 'Event processed successfully' })
  async receiveWebhook(
    @Body() payload: FacebookWebhookPayload,
    @Headers('x-hub-signature-256') signature: string
  ): Promise<{ status: string; processed: number }> {
    this.logger.debug('Webhook event received');

    let processedCount = 0;

    if (payload.object === 'page' && payload.entry) {
      for (const entry of payload.entry) {
        try {
          const eventDto: WebhookEventDto = {
            pageId: entry.id,
            timestamp: new Date(entry.time * 1000),
            changes: entry.changes || []
          };

          await this.monitorService.processWebhookEvent(eventDto);
          processedCount++;
        } catch (error) {
          this.logger.error(`Failed to process webhook event for page ${entry.id}:`, error);
        }
      }
    }

    return {
      status: 'success',
      processed: processedCount
    };
  }
}