import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ScheduledPost,
  ScheduledPostDocument,
} from '../schemas/scheduled-post.schema';
import {
  PublishedNoticia,
  PublishedNoticiaDocument,
} from '../../pachuca-noticias/schemas/published-noticia.schema';
import { ContentCopyUpdaterService } from './content-copy-updater.service';
import { IntelligentSchedulerService } from './intelligent-scheduler.service';
import { ContentRecyclingService } from './content-recycling.service';
import { ContentType, Platform } from '../interfaces/scheduling.interface';

/**
 * 🎯 Community Manager Orchestrator Service
 *
 * FASE 4: Community Manager Orchestrator
 *
 * Servicio orquestador principal que coordina todos los componentes del
 * sistema de Community Manager:
 *
 * 1. ContentCopyUpdaterService: Actualiza copys con URLs
 * 2. IntelligentSchedulerService: Calcula tiempos óptimos
 * 3. ContentRecyclingService: Gestiona reciclaje de evergreen
 *
 * WORKFLOW PRINCIPAL:
 * 1. Recibe noticia publicada (con slug y URL final)
 * 2. Actualiza copys de redes sociales con URL (IA)
 * 3. Calcula tiempo óptimo según tipo de contenido y plataforma
 * 4. Crea ScheduledPost en DB
 * 5. Emite evento para que BullMQ lo procese (FASE 5)
 *
 * WORKFLOW RECICLAJE:
 * 1. Detecta contenido elegible (3+ meses, buen performance)
 * 2. Regenera copys completamente nuevos (IA)
 * 3. Programa en slots bajos (fines de semana)
 * 4. Trackea performance vs original
 */
@Injectable()
export class CommunityManagerService {
  private readonly logger = new Logger(CommunityManagerService.name);

  constructor(
    @InjectModel(ScheduledPost.name)
    private scheduledPostModel: Model<ScheduledPostDocument>,
    @InjectModel(PublishedNoticia.name)
    private publishedNoticiaModel: Model<PublishedNoticiaDocument>,
    private readonly copyUpdater: ContentCopyUpdaterService,
    private readonly scheduler: IntelligentSchedulerService,
    private readonly recycling: ContentRecyclingService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.log('🎯 Community Manager Orchestrator Service initialized');
  }

  /**
   * 📅 Programa la publicación de contenido en redes sociales
   *
   * Workflow completo:
   * 1. Valida que la noticia existe y está publicada
   * 2. Actualiza el copy con la URL final usando IA
   * 3. Calcula el tiempo óptimo según tipo de contenido
   * 4. Crea ScheduledPost en DB
   * 5. Emite evento 'scheduled-post.created' para BullMQ
   *
   * @param noticiaId - ID de la noticia publicada
   * @param platform - Plataforma (facebook, twitter)
   * @param originalCopy - Copy original generado por IA (sin URL)
   * @param options - Opciones adicionales
   * @returns ScheduledPost creado
   */
  async scheduleContentPublication(
    noticiaId: string,
    platform: Platform,
    originalCopy: string,
    options?: {
      forceImmediate?: boolean; // Forzar publicación inmediata (breaking news)
      customScheduledTime?: Date; // Forzar hora específica (manual)
    },
  ): Promise<ScheduledPostDocument> {
    this.logger.log(
      `📅 Programando publicación: noticia=${noticiaId}, platform=${platform}`,
    );

    // 1. Validar noticia
    const noticia = await this.publishedNoticiaModel.findById(noticiaId);
    if (!noticia) {
      throw new NotFoundException(`Noticia ${noticiaId} no encontrada`);
    }

    if (noticia.status !== 'published') {
      throw new Error(
        `Noticia ${noticiaId} no está publicada (status: ${noticia.status})`,
      );
    }

    if (!noticia.slug) {
      throw new Error(`Noticia ${noticiaId} no tiene slug`);
    }

    // Validar contentType
    const validContentTypes: Array<'breaking_news' | 'normal_news' | 'blog' | 'evergreen'> = [
      'breaking_news',
      'normal_news',
      'blog',
      'evergreen',
    ];

    const contentType = noticia.contentType;
    if (!validContentTypes.includes(contentType)) {
      throw new Error(
        `ContentType inválido: ${contentType}. Debe ser uno de: ${validContentTypes.join(', ')}`,
      );
    }

    // Validar plataforma (por ahora solo facebook y twitter soportados)
    if (platform !== 'facebook' && platform !== 'twitter') {
      throw new Error(
        `Plataforma ${platform} no soportada aún. Solo facebook y twitter están disponibles.`,
      );
    }

    // 2. Construir URL de la noticia
    // TODO: Obtener dominio del sitio desde configuración
    const baseDomain = 'https://noticiaspachuca.com';
    const noticiaUrl = `${baseDomain}/noticia/${noticia.slug}`;

    // 3. Actualizar copy con URL usando IA
    this.logger.log(`🎨 Actualizando copy con URL...`);
    const updatedCopy = await this.copyUpdater.updateCopyWithUrl(
      originalCopy,
      noticiaUrl,
      contentType,
      platform,
    );

    // 4. Calcular tiempo óptimo (a menos que sea manual)
    let scheduledAt: Date;
    let schedulingMethod: string;

    if (options?.customScheduledTime) {
      // Scheduling manual
      scheduledAt = options.customScheduledTime;
      schedulingMethod = 'manual';
      this.logger.log(`📅 Scheduling manual: ${scheduledAt.toISOString()}`);
    } else {
      // Scheduling inteligente
      const schedulingResult = await this.scheduler.calculateOptimalTime(
        noticia.contentType as ContentType,
        platform,
        noticiaId,
      );

      scheduledAt = schedulingResult.scheduledAt;
      schedulingMethod = schedulingResult.metadata.calculationMethod;

      this.logger.log(
        `📅 Tiempo óptimo calculado: ${scheduledAt.toISOString()} (${schedulingMethod})`,
      );
      this.logger.log(`💡 Razón: ${schedulingResult.reasoning}`);
    }

    // 5. Determinar prioridad según tipo de contenido
    const priority = this.calculatePriority(noticia.contentType as ContentType);

    // 6. Crear ScheduledPost en DB
    const scheduledPost = await this.scheduledPostModel.create({
      noticiaId: noticia._id,
      contentType: noticia.contentType,
      platform,
      postContent: updatedCopy,
      originalCopy,
      scheduledAt,
      calculatedAt: new Date(),
      schedulingMetadata: {
        requestedAt: new Date(),
        calculationMethod: schedulingMethod,
        timeWindow: 'moderate', // TODO: Obtener del scheduler
        isOptimalTime: schedulingMethod !== 'manual',
        alternativeTimesConsidered: [],
      },
      priority,
      status: 'scheduled',
    });

    this.logger.log(
      `✅ Post programado: ID=${String(scheduledPost._id)}, scheduledAt=${scheduledAt.toISOString()}`,
    );

    // 7. Emitir evento para BullMQ (FASE 5)
    this.eventEmitter.emit('scheduled-post.created', {
      scheduledPostId: String(scheduledPost._id),
      scheduledAt,
      platform,
      contentType: noticia.contentType,
    });

    return scheduledPost;
  }

  /**
   * 🔄 Programa la publicación de contenido reciclado
   *
   * Workflow:
   * 1. Verifica elegibilidad para reciclaje
   * 2. Regenera copys completamente nuevos usando IA
   * 3. Calcula tiempo óptimo (slots bajos, fines de semana)
   * 4. Crea ScheduledPost con contentType='recycled'
   * 5. Actualiza RecyclingSchedule
   *
   * @param noticiaId - ID de la noticia a reciclar
   * @param platforms - Plataformas donde reciclar (default: ['facebook', 'twitter'])
   * @returns Lista de ScheduledPost creados
   */
  async scheduleRecycledContent(
    noticiaId: string,
    platforms: Platform[] = ['facebook', 'twitter'],
  ): Promise<ScheduledPostDocument[]> {
    this.logger.log(`🔄 Programando reciclaje: noticia=${noticiaId}`);

    // 1. Validar noticia
    const noticia = await this.publishedNoticiaModel.findById(noticiaId);
    if (!noticia) {
      throw new NotFoundException(`Noticia ${noticiaId} no encontrada`);
    }

    // 2. Verificar elegibilidad
    const eligibility = await this.recycling.checkEligibility(noticiaId);
    if (!eligibility.isEligible) {
      throw new Error(
        `Noticia no elegible para reciclaje: ${eligibility.reasons.join(', ')}`,
      );
    }

    this.logger.log(
      `✅ Noticia elegible (tipo: ${eligibility.recycleType}, score: ${(eligibility.performanceScore! * 100).toFixed(0)}%)`,
    );

    // 3. Regenerar copys con IA
    this.logger.log(`🎨 Regenerando copys para reciclaje...`);
    const regeneratedCopies = await this.copyUpdater.regenerateSocialCopies(
      noticia,
    );

    // 4. Programar en cada plataforma
    const scheduledPosts: ScheduledPostDocument[] = [];

    for (const platform of platforms) {
      const copy =
        platform === 'facebook'
          ? regeneratedCopies.facebook
          : regeneratedCopies.twitter;

      // Calcular tiempo óptimo para recycled (slots bajos)
      const schedulingResult = await this.scheduler.calculateOptimalTime(
        'recycled',
        platform,
        noticiaId,
      );

      // Crear ScheduledPost
      const scheduledPost = await this.scheduledPostModel.create({
        noticiaId: noticia._id,
        contentType: 'recycled',
        platform,
        postContent: copy,
        isRecycled: true,
        scheduledAt: schedulingResult.scheduledAt,
        calculatedAt: new Date(),
        schedulingMetadata: {
          requestedAt: new Date(),
          calculationMethod: schedulingResult.metadata.calculationMethod,
          timeWindow: schedulingResult.metadata.timeWindow,
          isOptimalTime: schedulingResult.metadata.isOptimalTime,
          alternativeTimesConsidered: schedulingResult.metadata.alternativeTimesConsidered,
        },
        priority: 1, // Baja prioridad
        status: 'scheduled',
      });

      scheduledPosts.push(scheduledPost);

      this.logger.log(
        `✅ Reciclaje programado en ${platform}: ${schedulingResult.scheduledAt.toISOString()}`,
      );

      // Emitir evento
      this.eventEmitter.emit('scheduled-post.created', {
        scheduledPostId: String(scheduledPost._id),
        scheduledAt: schedulingResult.scheduledAt,
        platform,
        contentType: 'recycled',
        isRecycled: true,
      });
    }

    // 5. Crear/actualizar RecyclingSchedule
    await this.recycling.createRecycleSchedule(
      noticiaId,
      eligibility.recycleType,
    );

    this.logger.log(
      `🔄 Reciclaje completo: ${scheduledPosts.length} posts programados`,
    );

    return scheduledPosts;
  }

  /**
   * 📋 Obtiene posts programados con filtros
   *
   * @param filters - Filtros de búsqueda
   * @returns Lista de posts programados
   */
  async getScheduledPosts(filters?: {
    platform?: Platform;
    contentType?: ContentType | 'recycled';
    status?: 'scheduled' | 'processing' | 'published' | 'failed' | 'cancelled';
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
  }): Promise<ScheduledPostDocument[]> {
    const query: any = {};

    if (filters?.platform) {
      query.platform = filters.platform;
    }

    if (filters?.contentType) {
      query.contentType = filters.contentType;
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      query.scheduledAt = {};
      if (filters.dateFrom) {
        query.scheduledAt.$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        query.scheduledAt.$lte = filters.dateTo;
      }
    }

    const posts = await this.scheduledPostModel
      .find(query)
      .sort({ scheduledAt: 1 })
      .limit(filters?.limit || 100)
      .populate('noticiaId')
      .exec();

    return posts;
  }

  /**
   * ❌ Cancela un post programado
   *
   * @param scheduledPostId - ID del post programado
   * @param reason - Razón de cancelación (opcional)
   * @returns Post actualizado
   */
  async cancelScheduledPost(
    scheduledPostId: string,
    reason?: string,
  ): Promise<ScheduledPostDocument> {
    this.logger.log(`❌ Cancelando post programado: ${scheduledPostId}`);

    const post = await this.scheduledPostModel.findById(scheduledPostId);
    if (!post) {
      throw new NotFoundException(`Post programado ${scheduledPostId} no encontrado`);
    }

    if (post.status !== 'scheduled') {
      throw new Error(
        `No se puede cancelar post con status: ${post.status}`,
      );
    }

    post.status = 'cancelled';
    if (reason) {
      post.failureReason = reason;
    }

    await post.save();

    // Emitir evento
    this.eventEmitter.emit('scheduled-post.cancelled', {
      scheduledPostId: String(post._id),
      reason,
    });

    this.logger.log(`✅ Post cancelado: ${scheduledPostId}`);

    return post;
  }

  /**
   * 🔄 Reprograma un post cancelado o fallido
   *
   * @param scheduledPostId - ID del post a reprogramar
   * @param newScheduledTime - Nueva fecha (opcional, si no se calcula óptima)
   * @returns Post reprogramado
   */
  async reschedulePost(
    scheduledPostId: string,
    newScheduledTime?: Date,
  ): Promise<ScheduledPostDocument> {
    this.logger.log(`🔄 Reprogramando post: ${scheduledPostId}`);

    const post = await this.scheduledPostModel.findById(scheduledPostId);
    if (!post) {
      throw new NotFoundException(`Post programado ${scheduledPostId} no encontrado`);
    }

    if (!['cancelled', 'failed'].includes(post.status)) {
      throw new Error(
        `Solo se pueden reprogramar posts cancelados o fallidos (status actual: ${post.status})`,
      );
    }

    // Calcular nuevo tiempo
    let scheduledAt: Date;
    if (newScheduledTime) {
      scheduledAt = newScheduledTime;
    } else {
      const noticia = await this.publishedNoticiaModel.findById(post.noticiaId);
      if (!noticia) {
        throw new Error('Noticia asociada no encontrada');
      }

      const schedulingResult = await this.scheduler.calculateOptimalTime(
        noticia.contentType as ContentType,
        post.platform as Platform,
        String(post.noticiaId),
      );

      scheduledAt = schedulingResult.scheduledAt;
    }

    // Guardar tiempo anterior
    const previousScheduledAt = post.scheduledAt;

    // Actualizar post
    post.scheduledAt = scheduledAt;
    post.status = 'scheduled';
    post.calculatedAt = new Date();

    await post.save();

    // Emitir evento
    this.eventEmitter.emit('scheduled-post.created', {
      scheduledPostId: String(post._id),
      scheduledAt,
      platform: post.platform,
      contentType: post.contentType,
      isRescheduled: true,
      previousScheduledAt,
    });

    this.logger.log(`✅ Post reprogramado: ${scheduledAt.toISOString()}`);

    return post;
  }

  /**
   * 📊 Obtiene estadísticas del sistema
   *
   * @returns Estadísticas completas
   */
  async getStats(): Promise<{
    scheduledPosts: {
      total: number;
      byPlatform: Record<Platform, number>;
      byContentType: Record<string, number>;
      byStatus: Record<string, number>;
    };
    recycling: {
      totalRecycled: number;
      totalEligible: number;
      averagePerformance: number;
    };
  }> {
    // Stats de posts programados
    const allPosts = await this.scheduledPostModel.find().lean();

    const byPlatform: Record<Platform, number> = {
      facebook: 0,
      twitter: 0,
      instagram: 0,
    };

    const byContentType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    allPosts.forEach((post) => {
      // Por plataforma
      byPlatform[post.platform as Platform] =
        (byPlatform[post.platform as Platform] || 0) + 1;

      // Por tipo de contenido
      byContentType[post.contentType] =
        (byContentType[post.contentType] || 0) + 1;

      // Por status
      byStatus[post.status] = (byStatus[post.status] || 0) + 1;
    });

    // Stats de reciclaje
    const recyclingStats = await this.recycling.getRecyclingStats();

    return {
      scheduledPosts: {
        total: allPosts.length,
        byPlatform,
        byContentType,
        byStatus,
      },
      recycling: {
        totalRecycled: recyclingStats.totalRecycled,
        totalEligible: recyclingStats.totalEligible,
        averagePerformance: recyclingStats.averagePerformanceVsOriginal,
      },
    };
  }

  /**
   * 🎯 Calcula prioridad según tipo de contenido
   *
   * Breaking news = 10 (máxima prioridad)
   * Normal news = 7
   * Blog = 5
   * Evergreen = 3
   * Recycled = 1 (mínima prioridad)
   *
   * @param contentType - Tipo de contenido
   * @returns Prioridad (1-10)
   */
  private calculatePriority(contentType: ContentType | 'recycled'): number {
    const priorityMap: Record<string, number> = {
      breaking_news: 10,
      normal_news: 7,
      blog: 5,
      evergreen: 3,
      recycled: 1,
    };

    return priorityMap[contentType] || 5;
  }
}
