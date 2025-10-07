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
import { PublishingQueue, PublishingQueueDocument } from '../schemas/publishing-queue.schema';

/**
 * 🛡️ Guard para prevenir sobrecarga de la cola de publicación
 * Límite: 50 items activos en cola (queued + processing)
 */
@Injectable()
export class QueueLimitGuard implements CanActivate {
  private readonly logger = new Logger(QueueLimitGuard.name);
  private readonly MAX_QUEUE_SIZE = 50;

  constructor(
    @InjectModel(PublishingQueue.name)
    private queueModel: Model<PublishingQueueDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Contar items activos en cola (queued o processing)
      const activeQueueCount = await this.queueModel.countDocuments({
        status: { $in: ['queued', 'processing'] },
      });

      if (activeQueueCount >= this.MAX_QUEUE_SIZE) {
        this.logger.warn(`⚠️ Cola de publicación llena: ${activeQueueCount} items activos`);

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: `Cola de publicación llena. Máximo ${this.MAX_QUEUE_SIZE} publicaciones en cola. Actualmente: ${activeQueueCount}`,
            error: 'Queue Full',
            currentQueueSize: activeQueueCount,
            maxQueueSize: this.MAX_QUEUE_SIZE,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('❌ Error verificando límite de cola:', error);
      // En caso de error, permitir la petición (fail-open)
      return true;
    }
  }
}
