import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Model, Types } from 'mongoose';
import { Queue } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  PublishingQueue,
  PublishingQueueDocument,
} from '../schemas/publishing-queue.schema';
import {
  PublishedNoticia,
  PublishedNoticiaDocument,
} from '../schemas/published-noticia.schema';
import {
  AIContentGeneration,
  AIContentGenerationDocument,
} from '../../content-ai/schemas/ai-content-generation.schema';
import { PublishSchedulerService } from './publish-scheduler.service';
import { PublishService } from './publish.service';
import {
  SchedulePublicationDto,
  QueryQueueDto,
  UpdateQueuePriorityDto,
  CancelScheduleDto,
} from '../dto/schedule-publication.dto';
import { PublishingJobData } from '../processors/publishing-queue.processor';
import { PublishNoticiaDto } from '../dto/publish-noticia.dto';

/**
 * 📋 Servicio para gestionar la cola de publicación inteligente
 */
@Injectable()
export class PublishingQueueService {
  private readonly logger = new Logger(PublishingQueueService.name);

  // Mapeo de prioridades según tipo
  private readonly PRIORITY_MAP = {
    breaking: 10, // Inmediato (no entra en cola)
    news: 8, // Alta prioridad
    blog: 3, // Prioridad normal
  };

  constructor(
    @InjectModel(PublishingQueue.name)
    private publishingQueueModel: Model<PublishingQueueDocument>,
    @InjectModel(PublishedNoticia.name)
    private publishedNoticiaModel: Model<PublishedNoticiaDocument>,
    @InjectModel(AIContentGeneration.name)
    private aiContentModel: Model<AIContentGenerationDocument>,
    @InjectQueue('publishing-queue')
    private publishingQueue: Queue<PublishingJobData>,
    private readonly publishScheduler: PublishSchedulerService,
    private readonly publishService: PublishService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * 📅 Programa una publicación (o publica inmediatamente si es breaking)
   */
  async schedulePublication(dto: SchedulePublicationDto): Promise<PublishedNoticiaDocument | PublishingQueueDocument> {
    // 1️⃣ Validar que el contenido existe y está completo
    const content = await this.aiContentModel.findById(dto.contentId);
    if (!content) {
      throw new NotFoundException('Contenido generado no encontrado');
    }

    if (content.status !== 'completed') {
      throw new BadRequestException('El contenido debe estar completado antes de publicar');
    }

    // 2️⃣ Validar que no esté ya publicado
    const existingPublished = await this.publishedNoticiaModel.findOne({
      contentId: dto.contentId,
    });

    if (existingPublished) {
      throw new BadRequestException(
        `Este contenido ya está publicado con slug: ${existingPublished.slug}`,
      );
    }

    // 3️⃣ Validar que no esté ya en cola
    const existingQueue = await this.publishingQueueModel.findOne({
      contentId: dto.contentId,
      status: { $in: ['queued', 'processing'] },
    });

    if (existingQueue) {
      throw new BadRequestException('Este contenido ya está en cola de publicación');
    }

    // 4️⃣ Si es BREAKING NEWS, publicar inmediatamente (no entra en cola)
    if (dto.publicationType === 'breaking') {
      this.logger.log(`🔴 Breaking news detected - Publishing immediately: ${dto.contentId}`);

      const publishDto: PublishNoticiaDto = {
        contentId: dto.contentId,
        useOriginalImage: dto.useOriginalImage,
        customImageUrl: dto.customImageUrl,
        isFeatured: dto.isFeatured,
        isBreaking: true,
      };

      const publishedNoticia = await this.publishService.publishNoticia(publishDto);

      this.eventEmitter.emit('noticia.breaking-published', {
        noticiaId: publishedNoticia._id,
        contentId: dto.contentId,
        slug: publishedNoticia.slug,
      });

      return publishedNoticia;
    }

    // 5️⃣ Para NEWS y BLOG, agregar a cola inteligente
    const priority = this.PRIORITY_MAP[dto.publicationType];

    // Calcular próximo slot de publicación
    const { scheduledAt, metadata } = await this.publishScheduler.calculateNextPublishSlot(
      priority,
      dto.manualScheduleAt,
    );

    // 6️⃣ Crear documento en PublishingQueue
    const queueItem = new this.publishingQueueModel({
      contentId: dto.contentId,
      scheduledPublishAt: scheduledAt,
      queueType: dto.publicationType,
      priority,
      status: 'queued',
      calculationMetadata: metadata,
      processingMetadata: {
        attemptCount: 0,
      },
    });

    const savedQueueItem = await queueItem.save();

    // 7️⃣ Crear job en BullMQ con delay calculado
    const delayMs = scheduledAt.getTime() - Date.now();

    const job = await this.publishingQueue.add(
      'publish-scheduled',
      {
        queueId: (savedQueueItem._id as string).toString(),
        contentId: dto.contentId,
        useOriginalImage: dto.useOriginalImage,
        customImageUrl: dto.customImageUrl,
        isFeatured: dto.isFeatured,
        isNoticia: dto.publicationType === 'news',
        scheduledAt,
      },
      {
        delay: Math.max(0, delayMs), // Asegurar que delay no sea negativo
        priority, // Mayor número = mayor prioridad en BullMQ
        jobId: (savedQueueItem._id as string).toString(), // Usar ID de mongo como jobId
      },
    );

    // Actualizar bullJobId en el documento
    savedQueueItem.bullJobId = job.id.toString();
    await savedQueueItem.save();

    this.logger.log(
      `📅 Scheduled publication: ${dto.publicationType.toUpperCase()} | ` +
      `Content: ${dto.contentId} | ` +
      `Scheduled: ${scheduledAt.toISOString()} | ` +
      `Delay: ${Math.round(delayMs / 60000)}min | ` +
      `JobId: ${job.id}`,
    );

    this.eventEmitter.emit('noticia.scheduled', {
      queueId: savedQueueItem._id,
      contentId: dto.contentId,
      queueType: dto.publicationType,
      scheduledAt,
      priority,
    });

    return savedQueueItem;
  }

  /**
   * 📋 Lista cola de publicación con filtros
   */
  async queryQueue(query: QueryQueueDto): Promise<{
    data: PublishingQueueDocument[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    // Construir filtro
    const filter: Record<string, unknown> = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.queueType) {
      filter.queueType = query.queueType;
    }

    if (query.dateFrom || query.dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (query.dateFrom) {
        dateFilter.$gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        dateFilter.$lte = new Date(query.dateTo);
      }
      filter.scheduledPublishAt = dateFilter;
    }

    // Ejecutar queries
    let queryBuilder = this.publishingQueueModel
      .find(filter)
      .sort({ scheduledPublishAt: 1 }) // Ordenar por fecha programada
      .skip(skip)
      .limit(limit)
      .populate('contentId', 'generatedTitle generatedCategory generatedSummary');

    // Si status es 'published', popular también la noticia para mostrar datos útiles
    if (query.status === 'published') {
      queryBuilder = queryBuilder.populate(
        'noticiaId',
        'slug title summary category tags publishedAt status'
      );
    }

    const [data, total] = await Promise.all([
      queryBuilder.exec(),
      this.publishingQueueModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * 📊 Obtiene estadísticas de la cola
   */
  async getQueueStats(): Promise<{
    totalQueued: number;
    byPriority: { high: number; normal: number };
    byType: { breaking: number; news: number; blog: number };
    estimatedNextPublish: Date | null;
    averageIntervalMinutes: number;
    publishedToday: number;
  }> {
    const stats = await this.publishScheduler.getQueueStats();

    // Adicionales por tipo
    const [newsCount, blogCount, publishedToday] = await Promise.all([
      this.publishingQueueModel.countDocuments({ status: 'queued', queueType: 'news' }),
      this.publishingQueueModel.countDocuments({ status: 'queued', queueType: 'blog' }),
      this.publishingQueueModel.countDocuments({
        status: 'published',
        publishedAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      }),
    ]);

    return {
      ...stats,
      byType: {
        breaking: 0, // Breaking nunca entra en cola
        news: newsCount,
        blog: blogCount,
      },
      publishedToday,
    };
  }

  /**
   * ⚡ Fuerza publicación inmediata (admin)
   */
  async forcePublish(queueId: string): Promise<PublishedNoticiaDocument> {
    const queueItem = await this.publishingQueueModel.findById(queueId);

    if (!queueItem) {
      throw new NotFoundException('Item de cola no encontrado');
    }

    if (queueItem.status === 'published') {
      throw new BadRequestException('Este contenido ya fue publicado');
    }

    if (queueItem.status === 'cancelled') {
      throw new BadRequestException('Este contenido fue cancelado');
    }

    this.logger.log(`⚡ Force publishing queue item: ${queueId}`);

    // Cancelar job en BullMQ
    if (queueItem.bullJobId) {
      const job = await this.publishingQueue.getJob(queueItem.bullJobId);
      if (job) {
        await job.remove();
      }
    }

    // Publicar inmediatamente
    const publishDto: PublishNoticiaDto = {
      contentId: queueItem.contentId.toString(),
      useOriginalImage: true, // Por defecto usar original
      isFeatured: false,
      isBreaking: false,
    };

    const publishedNoticia = await this.publishService.publishNoticia(publishDto);

    // Actualizar estado en cola y guardar noticiaId
    queueItem.status = 'published';
    queueItem.noticiaId = publishedNoticia._id as Types.ObjectId; // 🔑 CRITICAL: Guardar ID de noticia publicada
    queueItem.publishedAt = new Date();
    await queueItem.save();

    this.eventEmitter.emit('noticia.force-published', {
      queueId,
      noticiaId: publishedNoticia._id,
      slug: publishedNoticia.slug,
    });

    return publishedNoticia;
  }

  /**
   * 🚫 Cancela publicación programada
   */
  async cancelSchedule(queueId: string, dto: CancelScheduleDto): Promise<PublishingQueueDocument> {
    const queueItem = await this.publishingQueueModel.findById(queueId);

    if (!queueItem) {
      throw new NotFoundException('Item de cola no encontrado');
    }

    if (queueItem.status === 'published') {
      throw new BadRequestException('Este contenido ya fue publicado, no se puede cancelar');
    }

    if (queueItem.status === 'cancelled') {
      throw new BadRequestException('Este contenido ya está cancelado');
    }

    this.logger.log(`🚫 Cancelling schedule: ${queueId} | Reason: ${dto.reason || 'N/A'}`);

    // Cancelar job en BullMQ
    if (queueItem.bullJobId) {
      const job = await this.publishingQueue.getJob(queueItem.bullJobId);
      if (job) {
        await job.remove();
      }
    }

    // Actualizar estado
    queueItem.status = 'cancelled';
    queueItem.cancelledAt = new Date();
    queueItem.cancelReason = dto.reason;
    await queueItem.save();

    this.eventEmitter.emit('noticia.schedule-cancelled', {
      queueId,
      contentId: queueItem.contentId,
      reason: dto.reason,
    });

    return queueItem;
  }

  /**
   * 🔄 Cambia prioridad de item en cola
   */
  async updatePriority(queueId: string, dto: UpdateQueuePriorityDto): Promise<PublishingQueueDocument> {
    const queueItem = await this.publishingQueueModel.findById(queueId);

    if (!queueItem) {
      throw new NotFoundException('Item de cola no encontrado');
    }

    if (queueItem.status !== 'queued') {
      throw new BadRequestException('Solo se puede cambiar prioridad de items en cola');
    }

    this.logger.log(
      `🔄 Updating priority: ${queueId} | ${queueItem.priority} → ${dto.priority}`,
    );

    const oldPriority = queueItem.priority;

    // Actualizar prioridad en documento
    queueItem.priority = dto.priority;
    await queueItem.save();

    // Actualizar prioridad en BullMQ job
    // Nota: BullMQ no permite cambiar prioridad de jobs existentes
    // Se debe remover y recrear el job
    if (queueItem.bullJobId) {
      const job = await this.publishingQueue.getJob(queueItem.bullJobId);
      if (job) {
        const jobData = job.data;
        const delay = job.opts.delay || 0;

        // Remover job anterior
        await job.remove();

        // Crear nuevo job con nueva prioridad
        const newJob = await this.publishingQueue.add(
          'publish-scheduled',
          jobData,
          {
            delay,
            priority: dto.priority,
            jobId: (queueItem._id as string).toString(),
          },
        );

        queueItem.bullJobId = newJob.id.toString();
        await queueItem.save();
      }
    }

    this.eventEmitter.emit('queue.priority-changed', {
      queueId,
      oldPriority,
      newPriority: dto.priority,
    });

    return queueItem;
  }
}
