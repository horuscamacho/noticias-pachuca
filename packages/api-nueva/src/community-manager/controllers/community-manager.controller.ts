import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CommunityManagerService } from '../services/community-manager.service';
import {
  ScheduleContentDto,
  ScheduleRecycledContentDto,
  GetScheduledPostsDto,
  CancelScheduledPostDto,
  ReschedulePostDto,
  ScheduledPostResponseDto,
  StatsResponseDto,
} from '../dto/schedule-content.dto';

/**
 * 🎯 Community Manager Controller
 *
 * FASE 6: Controllers y Endpoints
 *
 * Endpoints REST para gestión de publicaciones en redes sociales:
 *
 * ENDPOINTS PRINCIPALES:
 * - POST /community-manager/schedule-content - Programar contenido nuevo
 * - POST /community-manager/schedule-recycled - Programar reciclaje
 * - GET /community-manager/scheduled-posts - Listar posts programados
 * - DELETE /community-manager/scheduled-posts/:id - Cancelar post
 * - PUT /community-manager/scheduled-posts/:id/reschedule - Reprogramar post
 * - GET /community-manager/stats - Estadísticas del sistema
 *
 * AUTENTICACIÓN:
 * - Todos los endpoints requieren JWT token
 * - Bearer token en header Authorization
 */
@ApiTags('Community Manager')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('community-manager')
export class CommunityManagerController {
  private readonly logger = new Logger(CommunityManagerController.name);

  constructor(
    private readonly communityManagerService: CommunityManagerService,
  ) {}

  /**
   * 📅 Programa la publicación de contenido en redes sociales
   *
   * POST /community-manager/schedule-content
   *
   * Workflow:
   * 1. Valida noticia publicada
   * 2. Actualiza copy con URL (IA)
   * 3. Calcula tiempo óptimo (inteligente o manual)
   * 4. Crea ScheduledPost
   * 5. Agrega job a BullMQ queue
   *
   * @param dto - Datos del contenido a programar
   * @returns ScheduledPost creado
   */
  @Post('schedule-content')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Programa publicación de contenido en redes sociales',
    description:
      'Programa la publicación de una noticia en una plataforma de redes sociales. ' +
      'El sistema calcula automáticamente el mejor horario según el tipo de contenido, ' +
      'o permite especificar un horario manual.',
  })
  @ApiResponse({
    status: 201,
    description: 'Post programado exitosamente',
    type: ScheduledPostResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o noticia no encontrada',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token JWT requerido',
  })
  async scheduleContent(
    @Body() dto: ScheduleContentDto,
  ): Promise<ScheduledPostResponseDto> {
    this.logger.log(
      `📅 POST /schedule-content - noticia=${dto.noticiaId}, platform=${dto.platform}`,
    );

    const scheduledPost = await this.communityManagerService.scheduleContentPublication(
      dto.noticiaId,
      dto.platform,
      dto.originalCopy,
      {
        forceImmediate: dto.forceImmediate,
        customScheduledTime: dto.customScheduledTime,
      },
    );

    return this.mapToResponseDto(scheduledPost);
  }

  /**
   * 🔄 Programa el reciclaje de contenido evergreen
   *
   * POST /community-manager/schedule-recycled
   *
   * Workflow:
   * 1. Verifica elegibilidad (3+ meses, buen performance)
   * 2. Regenera copys con IA
   * 3. Programa en slots bajos
   * 4. Crea ScheduledPosts para cada plataforma
   *
   * @param dto - Datos del contenido a reciclar
   * @returns Lista de ScheduledPosts creados
   */
  @Post('schedule-recycled')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Programa reciclaje de contenido evergreen',
    description:
      'Recicla contenido evergreen elegible (3+ meses, buen performance). ' +
      'Regenera copys completamente nuevos y programa en horarios de bajo tráfico.',
  })
  @ApiResponse({
    status: 201,
    description: 'Reciclaje programado exitosamente',
    type: [ScheduledPostResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Contenido no elegible para reciclaje',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token JWT requerido',
  })
  async scheduleRecycled(
    @Body() dto: ScheduleRecycledContentDto,
  ): Promise<ScheduledPostResponseDto[]> {
    this.logger.log(
      `🔄 POST /schedule-recycled - noticia=${dto.noticiaId}, platforms=${dto.platforms?.join(',')}`,
    );

    const scheduledPosts = await this.communityManagerService.scheduleRecycledContent(
      dto.noticiaId,
      dto.platforms,
    );

    return scheduledPosts.map((post) => this.mapToResponseDto(post));
  }

  /**
   * 📋 Lista posts programados con filtros
   *
   * GET /community-manager/scheduled-posts
   *
   * Filtros disponibles:
   * - platform: facebook, twitter, instagram
   * - contentType: breaking_news, normal_news, blog, evergreen, recycled
   * - status: scheduled, processing, published, failed, cancelled
   * - dateFrom: fecha desde
   * - dateTo: fecha hasta
   * - limit: número máximo de resultados
   *
   * @param query - Filtros de búsqueda
   * @returns Lista de posts programados
   */
  @Get('scheduled-posts')
  @ApiOperation({
    summary: 'Lista posts programados con filtros',
    description:
      'Obtiene lista de posts programados. Soporta filtros por plataforma, tipo de contenido, ' +
      'status, rango de fechas y límite de resultados.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de posts programados',
    type: [ScheduledPostResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token JWT requerido',
  })
  async getScheduledPosts(
    @Query() query: GetScheduledPostsDto,
  ): Promise<ScheduledPostResponseDto[]> {
    this.logger.log(
      `📋 GET /scheduled-posts - filters: ${JSON.stringify(query)}`,
    );

    const posts = await this.communityManagerService.getScheduledPosts(query);

    return posts.map((post) => this.mapToResponseDto(post));
  }

  /**
   * 🔍 Obtiene un post programado por ID
   *
   * GET /community-manager/scheduled-posts/:id
   *
   * @param id - ID del post programado
   * @returns Post programado
   */
  @Get('scheduled-posts/:id')
  @ApiOperation({
    summary: 'Obtiene post programado por ID',
    description: 'Obtiene los detalles completos de un post programado específico.',
  })
  @ApiResponse({
    status: 200,
    description: 'Post programado encontrado',
    type: ScheduledPostResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Post no encontrado',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token JWT requerido',
  })
  async getScheduledPost(
    @Param('id') id: string,
  ): Promise<ScheduledPostResponseDto> {
    this.logger.log(`🔍 GET /scheduled-posts/${id}`);

    const posts = await this.communityManagerService.getScheduledPosts({
      limit: 1,
    });

    const post = posts.find((p) => String(p._id) === id);
    if (!post) {
      throw new Error(`Post ${id} no encontrado`);
    }

    return this.mapToResponseDto(post);
  }

  /**
   * ❌ Cancela un post programado
   *
   * DELETE /community-manager/scheduled-posts/:id
   *
   * Solo puede cancelar posts en status "scheduled"
   * Remueve el job de la queue de BullMQ
   *
   * @param id - ID del post a cancelar
   * @param dto - Razón de cancelación (opcional)
   * @returns Post actualizado con status "cancelled"
   */
  @Delete('scheduled-posts/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancela post programado',
    description:
      'Cancela un post programado (solo si está en status "scheduled"). ' +
      'Remueve el job de la queue automáticamente.',
  })
  @ApiResponse({
    status: 200,
    description: 'Post cancelado exitosamente',
    type: ScheduledPostResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede cancelar post (ya ejecutado o en progreso)',
  })
  @ApiResponse({
    status: 404,
    description: 'Post no encontrado',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token JWT requerido',
  })
  async cancelScheduledPost(
    @Param('id') id: string,
    @Body() dto?: CancelScheduledPostDto,
  ): Promise<ScheduledPostResponseDto> {
    this.logger.log(`❌ DELETE /scheduled-posts/${id}`);

    const post = await this.communityManagerService.cancelScheduledPost(
      id,
      dto?.reason,
    );

    return this.mapToResponseDto(post);
  }

  /**
   * 🔄 Reprograma un post cancelado o fallido
   *
   * PUT /community-manager/scheduled-posts/:id/reschedule
   *
   * Solo puede reprogramar posts en status "cancelled" o "failed"
   * Calcula nuevo horario óptimo o permite especificar uno manual
   *
   * @param id - ID del post a reprogramar
   * @param dto - Nueva fecha (opcional)
   * @returns Post reprogramado
   */
  @Put('scheduled-posts/:id/reschedule')
  @ApiOperation({
    summary: 'Reprograma post cancelado o fallido',
    description:
      'Reprograma un post que fue cancelado o falló. ' +
      'Puede especificar nueva fecha o dejar que el sistema calcule el óptimo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Post reprogramado exitosamente',
    type: ScheduledPostResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede reprogramar post (debe estar cancelled o failed)',
  })
  @ApiResponse({
    status: 404,
    description: 'Post no encontrado',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token JWT requerido',
  })
  async reschedulePost(
    @Param('id') id: string,
    @Body() dto?: ReschedulePostDto,
  ): Promise<ScheduledPostResponseDto> {
    this.logger.log(`🔄 PUT /scheduled-posts/${id}/reschedule`);

    const post = await this.communityManagerService.reschedulePost(
      id,
      dto?.newScheduledTime,
    );

    return this.mapToResponseDto(post);
  }

  /**
   * 📊 Obtiene estadísticas del sistema
   *
   * GET /community-manager/stats
   *
   * Estadísticas incluyen:
   * - Total de posts programados
   * - Distribución por plataforma
   * - Distribución por tipo de contenido
   * - Distribución por status
   * - Estadísticas de reciclaje
   *
   * @returns Estadísticas completas
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Obtiene estadísticas del sistema',
    description:
      'Estadísticas completas del Community Manager: posts programados, ' +
      'distribuciones por plataforma/tipo/status, y métricas de reciclaje.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas del sistema',
    type: StatsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token JWT requerido',
  })
  async getStats(): Promise<StatsResponseDto> {
    this.logger.log('📊 GET /stats');

    const stats = await this.communityManagerService.getStats();

    return stats;
  }

  /**
   * 🔄 Mapea ScheduledPostDocument a DTO de respuesta
   *
   * @param post - Post de DB
   * @returns DTO para respuesta
   */
  private mapToResponseDto(post: any): ScheduledPostResponseDto {
    return {
      id: String(post._id),
      noticiaId: String(post.noticiaId),
      noticiaTitle: post.noticiaId?.title, // Si está populated
      contentType: post.contentType,
      platform: post.platform,
      postContent: post.postContent,
      scheduledAt: post.scheduledAt,
      priority: post.priority,
      status: post.status,
      metadata: post.schedulingMetadata,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }
}
