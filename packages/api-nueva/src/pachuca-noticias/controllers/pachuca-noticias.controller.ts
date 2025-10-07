import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { PublishService } from '../services/publish.service';
import { PublishingQueueService } from '../services/publishing-queue.service';
import { PublishingQueueRecoveryService } from '../services/publishing-queue-recovery.service';
import { SeoFeedsService } from '../services/seo-feeds.service';
import { PublishNoticiaDto, UpdateNoticiaDto, QueryNoticiasDto } from '../dto';
import {
  SchedulePublicationDto,
  QueryQueueDto,
  UpdateQueuePriorityDto,
  CancelScheduleDto,
} from '../dto/schedule-publication.dto';
import { PublishingRateLimitGuard } from '../guards/publishing-rate-limit.guard';
import { QueueLimitGuard } from '../guards/queue-limit.guard';

@Controller('pachuca-noticias')
export class PachucaNoticiasController {
  constructor(
    private readonly publishService: PublishService,
    private readonly queueService: PublishingQueueService,
    private readonly recoveryService: PublishingQueueRecoveryService,
    private readonly seoFeedsService: SeoFeedsService,
  ) {}

  /**
   * POST /pachuca-noticias/publish
   * Publica una noticia desde el contenido generado
   * Rate limit: 10 publicaciones por minuto
   */
  @Post('publish')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(PublishingRateLimitGuard)
  async publishNoticia(@Body(ValidationPipe) dto: PublishNoticiaDto) {
    const noticia = await this.publishService.publishNoticia(dto);

    return {
      success: true,
      message: 'Noticia publicada exitosamente',
      data: noticia,
    };
  }

  /**
   * GET /pachuca-noticias
   * Lista noticias con filtros y paginación
   * Cache: 5 minutos
   */
  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300) // 5 minutos
  async queryNoticias(@Query(ValidationPipe) query: QueryNoticiasDto) {
    const result = await this.publishService.queryNoticias(query);

    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };
  }

  // ========================================
  // 📅 ENDPOINTS DE COLA DE PUBLICACIÓN
  // ========================================
  // IMPORTANTE: Las rutas específicas deben ir ANTES de las rutas parametrizadas (:id)

  /**
   * POST /pachuca-noticias/schedule
   * Programa una publicación en la cola inteligente
   * Si es breaking news, publica inmediatamente
   * Rate limit: Máximo 50 items en cola
   */
  @Post('schedule')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(QueueLimitGuard)
  async schedulePublication(@Body(ValidationPipe) dto: SchedulePublicationDto) {
    const result = await this.queueService.schedulePublication(dto);

    // Si es breaking, retorna la noticia publicada
    if ('slug' in result) {
      return {
        success: true,
        message: 'Noticia publicada inmediatamente (breaking news)',
        data: result,
        type: 'published',
      };
    }

    // Si es news/blog, retorna el item de cola
    return {
      success: true,
      message: 'Publicación programada exitosamente',
      data: result,
      type: 'scheduled',
    };
  }

  /**
   * GET /pachuca-noticias/queue/stats
   * Obtiene estadísticas de la cola
   * Cache: 30 segundos
   */
  @Get('queue/stats')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30) // 30 segundos
  async getQueueStats() {
    const stats = await this.queueService.getQueueStats();

    return {
      success: true,
      data: stats,
    };
  }

  /**
   * GET /pachuca-noticias/queue/health
   * Verifica sincronización entre MongoDB y BullMQ
   */
  @Get('queue/health')
  async getQueueHealth() {
    const health = await this.recoveryService.checkSyncHealth();

    return {
      success: true,
      healthy: health.healthy,
      data: health,
    };
  }

  /**
   * GET /pachuca-noticias/queue
   * Lista items en cola de publicación con filtros
   * Cache: 30 segundos
   */
  @Get('queue')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30) // 30 segundos
  async getQueue(@Query(ValidationPipe) query: QueryQueueDto) {
    const result = await this.queueService.queryQueue(query);

    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };
  }

  /**
   * DELETE /pachuca-noticias/queue/:id
   * Cancela una publicación programada
   */
  @Delete('queue/:id')
  @HttpCode(HttpStatus.OK)
  async cancelSchedule(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: CancelScheduleDto,
  ) {
    const queueItem = await this.queueService.cancelSchedule(id, dto);

    return {
      success: true,
      message: 'Publicación cancelada exitosamente',
      data: queueItem,
    };
  }

  /**
   * PATCH /pachuca-noticias/queue/:id/priority
   * Cambia la prioridad de un item en cola
   */
  @Patch('queue/:id/priority')
  async updateQueuePriority(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateQueuePriorityDto,
  ) {
    const queueItem = await this.queueService.updatePriority(id, dto);

    return {
      success: true,
      message: 'Prioridad actualizada exitosamente',
      data: queueItem,
    };
  }

  /**
   * GET /pachuca-noticias/slug/:slug
   * Obtiene una noticia por su slug (para el sitio público)
   * Cache: 15 minutos
   */
  @Get('slug/:slug')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(900) // 15 minutos
  async getNoticiaBySlug(@Param('slug') slug: string) {
    const noticia = await this.publishService.getNoticiaBySlug(slug);

    if (!noticia) {
      return {
        success: false,
        message: 'Noticia no encontrada',
        data: null,
      };
    }

    return {
      success: true,
      data: noticia,
    };
  }

  /**
   * GET /pachuca-noticias/related/:category/:slug
   * Obtiene noticias relacionadas por categoría
   * Cache: 5 minutos
   */
  @Get('related/:category/:slug')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300) // 5 minutos
  async getRelatedNoticias(
    @Param('category') category: string,
    @Param('slug') slug: string,
    @Query('limit') limit?: string,
  ) {
    const noticias = await this.publishService.getRelatedNoticias(
      category,
      slug,
      limit ? parseInt(limit) : 5,
    );

    return {
      success: true,
      data: noticias,
    };
  }

  /**
   * POST /pachuca-noticias/:id/force-publish
   * Fuerza publicación inmediata de un item en cola (admin)
   */
  @Post(':id/force-publish')
  @HttpCode(HttpStatus.OK)
  async forcePublish(@Param('id') id: string) {
    const noticia = await this.queueService.forcePublish(id);

    return {
      success: true,
      message: 'Publicación forzada exitosamente',
      data: noticia,
    };
  }

  /**
   * DELETE /pachuca-noticias/:id/unpublish
   * Despublica una noticia (cambia estado a unpublished)
   */
  @Delete(':id/unpublish')
  @HttpCode(HttpStatus.OK)
  async unpublishNoticia(@Param('id') id: string) {
    // Primero obtener la noticia para tener el slug
    const noticia = await this.publishService.getNoticiaById(id);

    if (!noticia) {
      return {
        success: false,
        message: 'Noticia no encontrada',
      };
    }

    const unpublished = await this.publishService.unpublishNoticia(noticia.slug);

    return {
      success: true,
      message: 'Noticia despublicada exitosamente',
      data: unpublished,
    };
  }

  // ========================================
  // 🔍 RUTAS PARAMETRIZADAS (DEBEN IR AL FINAL)
  // ========================================

  /**
   * GET /pachuca-noticias/:id
   * Obtiene una noticia por su ID
   */
  @Get(':id')
  async getNoticiaById(@Param('id') id: string) {
    const noticia = await this.publishService.getNoticiaById(id);

    if (!noticia) {
      return {
        success: false,
        message: 'Noticia no encontrada',
        data: null,
      };
    }

    return {
      success: true,
      data: noticia,
    };
  }

  /**
   * PATCH /pachuca-noticias/:id
   * Actualiza una noticia existente
   */
  @Patch(':id')
  async updateNoticia(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateNoticiaDto,
  ) {
    const noticia = await this.publishService.updateNoticia(id, dto);

    return {
      success: true,
      message: 'Noticia actualizada exitosamente',
      data: noticia,
    };
  }

  // ========================================
  // 🗺️ SEO & FEEDS ENDPOINTS
  // ========================================

  /**
   * GET /pachuca-noticias/sitemap.xml
   * Genera sitemap dinámico con todas las noticias publicadas
   * Cache: 24 horas
   */
  @Get('sitemap.xml')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(86400) // 24 horas
  async getSitemap() {
    const xml = await this.seoFeedsService.generateSitemap();
    return xml;
  }

  /**
   * GET /pachuca-noticias/rss.xml
   * Genera RSS feed con las últimas 50 noticias
   * Cache: 1 hora
   */
  @Get('rss.xml')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600) // 1 hora
  async getRssFeed() {
    const xml = await this.seoFeedsService.generateRssFeed();
    return xml;
  }
}
