import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ContentRecyclingService } from '../services/content-recycling.service';
import { RecyclingStats } from '../interfaces/recycling.interface';

/**
 * Response DTO para contenido elegible
 */
export class EligibleContentResponseDto {
  noticiaId: string;
  noticiaTitle: string;
  noticiaSlug: string;
  publishedAt: Date;
  contentType: string;
  performanceScore: number;
  recycleType: string;
  eligibilityReasons: string[];
  ageMonths: number;
}

/**
 * 🔄 Content Recycling Controller
 *
 * FASE 6: Controllers y Endpoints
 *
 * Endpoints específicos para gestión de reciclaje de contenido evergreen:
 *
 * ENDPOINTS:
 * - GET /content-recycling/eligible - Contenido elegible para reciclaje
 * - GET /content-recycling/eligibility/:id - Verifica elegibilidad de noticia
 * - GET /content-recycling/stats - Estadísticas de reciclaje
 * - POST /content-recycling/create-schedule/:id - Crea schedule de reciclaje
 *
 * AUTENTICACIÓN:
 * - Todos los endpoints requieren JWT token
 */
@ApiTags('Content Recycling')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('content-recycling')
export class ContentRecyclingController {
  private readonly logger = new Logger(ContentRecyclingController.name);

  constructor(
    private readonly recyclingService: ContentRecyclingService,
  ) {}

  /**
   * 📋 Lista contenido elegible para reciclaje
   *
   * GET /content-recycling/eligible
   *
   * Criterios de elegibilidad:
   * - 3+ meses desde publicación
   * - Tipo: evergreen o blog
   * - Performance score >= 70%
   * - No reciclado en últimos 60 días
   * - Máximo 3 reciclajes totales
   *
   * @param limit - Número máximo de resultados (default: 10)
   * @returns Lista de contenido elegible ordenado por performance
   */
  @Get('eligible')
  @ApiOperation({
    summary: 'Lista contenido elegible para reciclaje',
    description:
      'Obtiene lista de contenido evergreen elegible para reciclaje. ' +
      'Ordenado por performance score (mejores primero).',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de contenido elegible',
    type: [EligibleContentResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token JWT requerido',
  })
  async getEligibleContent(
    @Query('limit') limit?: number,
  ): Promise<EligibleContentResponseDto[]> {
    this.logger.log(`📋 GET /eligible - limit=${limit || 10}`);

    const eligible = await this.recyclingService.findEligibleContent(
      limit || 10,
    );

    return eligible.map((item) => ({
      noticiaId: String(item.noticia._id),
      noticiaTitle: item.noticia.title,
      noticiaSlug: item.noticia.slug,
      publishedAt: item.noticia.publishedAt,
      contentType: item.noticia.contentType,
      performanceScore: item.performanceScore,
      recycleType: item.eligibility.recycleType,
      eligibilityReasons: item.eligibility.reasons,
      ageMonths: this.calculateAgeMonths(item.noticia.publishedAt),
    }));
  }

  /**
   * ✅ Verifica elegibilidad de una noticia específica
   *
   * GET /content-recycling/eligibility/:id
   *
   * @param id - ID de la noticia
   * @returns Resultado de elegibilidad con detalles
   */
  @Get('eligibility/:id')
  @ApiOperation({
    summary: 'Verifica elegibilidad de noticia para reciclaje',
    description:
      'Verifica si una noticia específica es elegible para reciclaje y ' +
      'proporciona razones detalladas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Resultado de verificación de elegibilidad',
  })
  @ApiResponse({
    status: 404,
    description: 'Noticia no encontrada',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token JWT requerido',
  })
  async checkEligibility(@Param('id') id: string) {
    this.logger.log(`✅ GET /eligibility/${id}`);

    const eligibility = await this.recyclingService.checkEligibility(id);

    return {
      noticiaId: id,
      isEligible: eligibility.isEligible,
      recycleType: eligibility.recycleType,
      reasons: eligibility.reasons,
      nextAllowedRecycleDate: eligibility.nextAllowedRecycleDate,
      performanceScore: eligibility.performanceScore,
    };
  }

  /**
   * 📊 Obtiene estadísticas del sistema de reciclaje
   *
   * GET /content-recycling/stats
   *
   * Incluye:
   * - Total de contenido reciclado
   * - Total de contenido elegible
   * - Performance promedio vs original
   * - Distribución por tipo de reciclaje
   * - Top 10 reciclajes con mejor performance
   *
   * @returns Estadísticas completas de reciclaje
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Obtiene estadísticas del sistema de reciclaje',
    description:
      'Estadísticas completas del sistema de reciclaje: totales, promedios, ' +
      'distribución por tipo, y top performers.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de reciclaje',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token JWT requerido',
  })
  async getRecyclingStats(): Promise<RecyclingStats> {
    this.logger.log('📊 GET /stats');

    const stats = await this.recyclingService.getRecyclingStats();

    return stats;
  }

  /**
   * 📅 Crea schedule de reciclaje para una noticia
   *
   * POST /content-recycling/create-schedule/:id
   *
   * Crea o actualiza el schedule de reciclaje para una noticia elegible.
   * Permite configurar frecuencia personalizada.
   *
   * @param id - ID de la noticia
   * @param frequencyDays - Frecuencia en días (opcional, default: 90)
   * @returns Schedule creado/actualizado
   */
  @Post('create-schedule/:id')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crea schedule de reciclaje para noticia',
    description:
      'Crea o actualiza el schedule de reciclaje automático para una noticia. ' +
      'Permite configurar frecuencia personalizada.',
  })
  @ApiResponse({
    status: 201,
    description: 'Schedule creado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Noticia no elegible para reciclaje',
  })
  @ApiResponse({
    status: 404,
    description: 'Noticia no encontrada',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token JWT requerido',
  })
  async createRecycleSchedule(
    @Param('id') id: string,
    @Query('frequencyDays') frequencyDays?: number,
  ) {
    this.logger.log(
      `📅 POST /create-schedule/${id} - frequency=${frequencyDays || 90}`,
    );

    // Verificar elegibilidad primero
    const eligibility = await this.recyclingService.checkEligibility(id);

    if (!eligibility.isEligible) {
      throw new Error(
        `Noticia no elegible: ${eligibility.reasons.join(', ')}`,
      );
    }

    // Crear schedule
    const schedule = await this.recyclingService.createRecycleSchedule(
      id,
      eligibility.recycleType,
      frequencyDays,
    );

    return {
      scheduleId: String(schedule._id),
      noticiaId: String(schedule.noticiaId),
      recycleType: schedule.recycleType,
      recycleFrequencyDays: schedule.recycleFrequencyDays,
      maxRecyclesAllowed: schedule.maxRecyclesAllowed,
      totalRecycles: schedule.performanceHistory.length,
      createdAt: schedule.createdAt,
    };
  }

  /**
   * 📅 Calcula edad en meses
   *
   * @param publishedAt - Fecha de publicación
   * @returns Edad en meses
   */
  private calculateAgeMonths(publishedAt: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - publishedAt.getTime());
    return Number((diffTime / (1000 * 60 * 60 * 24 * 30)).toFixed(1));
  }
}
