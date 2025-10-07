import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PublishedNoticia, PublishedNoticiaDocument } from '../schemas/published-noticia.schema';

/**
 * 🛡️ Guard para prevenir spam de publicaciones inmediatas
 * Límite: 10 publicaciones en los últimos 60 segundos
 */
@Injectable()
export class PublishingRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(PublishingRateLimitGuard.name);
  private readonly MAX_PUBLISHES_PER_MINUTE = 10;
  private readonly WINDOW_MS = 60 * 1000; // 60 segundos

  constructor(
    @InjectModel(PublishedNoticia.name)
    private publishedNoticiaModel: Model<PublishedNoticiaDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Obtener timestamp de hace 1 minuto
      const oneMinuteAgo = new Date(Date.now() - this.WINDOW_MS);

      // Contar publicaciones en el último minuto
      const recentPublishCount = await this.publishedNoticiaModel.countDocuments({
        publishedAt: { $gte: oneMinuteAgo },
        'publishingMetadata.publishedFrom': 'dashboard', // Solo contar publicaciones manuales
      });

      if (recentPublishCount >= this.MAX_PUBLISHES_PER_MINUTE) {
        this.logger.warn(
          `⚠️ Rate limit excedido: ${recentPublishCount} publicaciones en el último minuto`,
        );

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: `Límite de publicaciones excedido. Máximo ${this.MAX_PUBLISHES_PER_MINUTE} publicaciones por minuto.`,
            error: 'Too Many Requests',
            retryAfter: 60, // segundos
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('❌ Error verificando rate limit:', error);
      // En caso de error, permitir la petición (fail-open)
      return true;
    }
  }
}
