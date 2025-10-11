import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SocketGateway } from '../../notifications/gateways/socket.gateway';
import {
  IMAGE_GENERATION_EVENTS,
  ImageGenerationStartedEvent,
  ImageGenerationProgressEvent,
  ImageGenerationCompletedEvent,
  ImageGenerationFailedEvent,
} from '../events/image-generation.events';

/**
 * 📡 Image Generation Notifier Service
 * Escucha eventos de image generation y los envía por sockets al usuario correcto
 *
 * PATRÓN: EventEmitter2 → Service → SocketGateway.sendToUser()
 * (Igual que funciona extracción de contenido)
 *
 * RESPONSABILIDAD:
 * - Escuchar eventos de generación de imágenes
 * - Enviar notificaciones por socket SOLO al usuario que generó
 * - Usar SocketGateway principal (no gateway separado)
 *
 * REGLAS APLICADAS:
 * ✅ NO usa forwardRef (EventEmitter2 desacopla)
 * ✅ NO usa any (todos los tipos explícitos)
 * ✅ Usa EventEmitter2 para comunicación entre módulos
 */
@Injectable()
export class ImageGenerationNotifierService {
  private readonly logger = new Logger(ImageGenerationNotifierService.name);

  constructor(
    private readonly socketGateway: SocketGateway,
  ) {
    this.logger.log('📡 Image Generation Notifier Service initialized');
  }

  /**
   * 🚀 Generation Started
   * Emitido cuando el processor inicia el procesamiento del job
   */
  @OnEvent(IMAGE_GENERATION_EVENTS.STARTED)
  async handleGenerationStarted(event: ImageGenerationStartedEvent): Promise<void> {
    this.logger.log(`📡 Sending started event to user ${event.userId}`);

    try {
      await this.socketGateway.sendToUser(
        event.userId,
        'image-generation:started',
        {
          jobId: event.jobId,
          generationId: event.generationId,
          message: 'Generación de imagen iniciada',
        },
      );
    } catch (error) {
      this.logger.error(`Error sending started event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 📊 Generation Progress
   * Emitido múltiples veces durante el proceso:
   * - 10%: Inicializando
   * - 30%: Generando con IA
   * - 60%: Imagen generada
   * - 70%: Procesando formatos
   * - 80%: Subiendo a S3
   * - 90%: Actualizando registro
   * - 100%: Completado
   */
  @OnEvent(IMAGE_GENERATION_EVENTS.PROGRESS)
  async handleGenerationProgress(event: ImageGenerationProgressEvent): Promise<void> {
    this.logger.debug(`📡 Sending progress ${event.progress}% to user ${event.userId}`);

    try {
      await this.socketGateway.sendToUser(
        event.userId,
        'image-generation:progress',
        {
          jobId: event.jobId,
          generationId: event.generationId,
          step: event.step,
          progress: event.progress,
          message: event.message,
        },
      );
    } catch (error) {
      this.logger.error(`Error sending progress event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * ✅ Generation Completed
   * Emitido cuando la imagen se generó y almacenó exitosamente
   */
  @OnEvent(IMAGE_GENERATION_EVENTS.COMPLETED)
  async handleGenerationCompleted(event: ImageGenerationCompletedEvent): Promise<void> {
    this.logger.log(`📡 Sending completed event to user ${event.userId}`);

    try {
      await this.socketGateway.sendToUser(
        event.userId,
        'image-generation:completed',
        {
          jobId: event.jobId,
          generationId: event.generationId,
          generatedImageUrl: event.generatedImageUrl,
          cost: event.cost,
          message: 'Imagen generada exitosamente',
        },
      );
    } catch (error) {
      this.logger.error(`Error sending completed event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * ❌ Generation Failed
   * Emitido cuando ocurre un error durante la generación
   */
  @OnEvent(IMAGE_GENERATION_EVENTS.FAILED)
  async handleGenerationFailed(event: ImageGenerationFailedEvent): Promise<void> {
    this.logger.error(`📡 Sending failed event to user ${event.userId}`);

    try {
      await this.socketGateway.sendToUser(
        event.userId,
        'image-generation:failed',
        {
          jobId: event.jobId,
          generationId: event.generationId,
          error: event.error,
          message: 'Error generando imagen',
        },
      );
    } catch (error) {
      this.logger.error(`Error sending failed event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
