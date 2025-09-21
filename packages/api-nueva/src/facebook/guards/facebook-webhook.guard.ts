import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';

@Injectable()
export class FacebookWebhookGuard implements CanActivate {
  private readonly logger = new Logger(FacebookWebhookGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['x-hub-signature-256'] as string;

    if (!signature) {
      this.logger.warn('Missing X-Hub-Signature-256 header');
      throw new UnauthorizedException('Missing signature');
    }

    const appSecret = this.configService.get<string>('config.facebook.appSecret');
    if (!appSecret) {
      this.logger.error('Facebook app secret not configured');
      throw new UnauthorizedException('Configuration error');
    }

    const body = JSON.stringify(request.body);
    const expectedSignature = 'sha256=' + createHmac('sha256', appSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      this.logger.warn('Invalid webhook signature');
      throw new UnauthorizedException('Invalid signature');
    }

    return true;
  }
}