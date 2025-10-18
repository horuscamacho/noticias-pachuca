import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ContentRecyclingSchedule,
  ContentRecyclingScheduleDocument,
} from '../schemas/content-recycling-schedule.schema';
import {
  PublishedNoticia,
  PublishedNoticiaDocument,
} from '../../pachuca-noticias/schemas/published-noticia.schema';
import {
  RecycleType,
  EligibilityCheckResult,
  RecyclingEligibilityCriteria,
  RecyclePerformance,
  RecyclingStats,
} from '../interfaces/recycling.interface';

/**
 * 🔄 Content Recycling Service
 *
 * FASE 3: Content Recycling
 *
 * Gestiona el reciclaje automatizado de contenido evergreen:
 * - Detecta contenido elegible (3+ meses, buen performance)
 * - Clasifica por tipo de reciclaje (pure_evergreen, seasonal_evergreen, durable)
 * - Verifica elegibilidad (no reciclado recientemente, buen performance histórico)
 * - Crea schedules de reciclaje (cada 90 días, máximo 3 veces)
 * - Trackea performance de reciclajes vs. publicación original
 *
 * TIPOS DE CONTENIDO RECICLABLE:
 * 1. Pure Evergreen: Contenido atemporal (guías, tutoriales, listas)
 * 2. Seasonal Evergreen: Contenido estacional (Navidad, verano, etc.)
 * 3. Durable: Noticias con vida útil larga (cambios legislativos, inauguraciones)
 * 4. Not Recyclable: Breaking news, noticias temporales
 */
@Injectable()
export class ContentRecyclingService {
  private readonly logger = new Logger(ContentRecyclingService.name);

  // Criterios por defecto para elegibilidad
  private readonly defaultCriteria: RecyclingEligibilityCriteria = {
    minAgeMonths: 3, // 3 meses mínimo desde publicación original
    minPerformanceScore: 0.7, // 70% performance mínimo
    minDaysSinceLastRecycle: 60, // 60 días desde último reciclaje
    maxTotalRecycles: 3, // Máximo 3 reciclajes totales
    excludeIfBreakingNewsActive: true,
  };

  constructor(
    @InjectModel(ContentRecyclingSchedule.name)
    private recycleScheduleModel: Model<ContentRecyclingScheduleDocument>,
    @InjectModel(PublishedNoticia.name)
    private publishedNoticiaModel: Model<PublishedNoticiaDocument>,
  ) {
    this.logger.log('🔄 Content Recycling Service initialized');
  }

  /**
   * 🔍 Encuentra contenido elegible para reciclaje
   *
   * Criterios de elegibilidad:
   * - Publicado hace 3+ meses
   * - Tipo de contenido: evergreen o blog
   * - Performance score >= 0.7 (70%)
   * - No reciclado en últimos 60 días
   * - Máximo 3 reciclajes totales
   *
   * @param limit - Número máximo de resultados (default: 10)
   * @returns Lista de noticias elegibles con metadata
   */
  async findEligibleContent(
    limit: number = 10,
  ): Promise<
    Array<{
      noticia: PublishedNoticiaDocument;
      eligibility: EligibilityCheckResult;
      performanceScore: number;
    }>
  > {
    this.logger.log(`🔍 Buscando contenido elegible para reciclaje (limit: ${limit})`);

    // Calcular fecha mínima (3 meses atrás)
    const minDate = new Date();
    minDate.setMonth(minDate.getMonth() - this.defaultCriteria.minAgeMonths);

    // Buscar contenido evergreen/blog publicado hace 3+ meses
    const candidates = await this.publishedNoticiaModel
      .find({
        contentType: { $in: ['evergreen', 'blog'] },
        publishedAt: { $lte: minDate },
        status: 'published',
      })
      .sort({ publishedAt: -1 })
      .limit(limit * 3) // Buscar más candidatos porque algunos no serán elegibles
      .exec();

    this.logger.log(`📋 ${candidates.length} candidatos encontrados`);

    // Verificar elegibilidad de cada candidato
    const eligible: Array<{
      noticia: PublishedNoticiaDocument;
      eligibility: EligibilityCheckResult;
      performanceScore: number;
    }> = [];

    for (const noticia of candidates) {
      const eligibility = await this.checkEligibility(String(noticia._id));

      if (eligibility.isEligible) {
        const performanceScore = await this.calculatePerformanceScore(
          String(noticia._id),
        );

        eligible.push({
          noticia,
          eligibility,
          performanceScore,
        });

        // Detener cuando tengamos suficientes elegibles
        if (eligible.length >= limit) {
          break;
        }
      }
    }

    // Ordenar por performance score (mejores primero)
    eligible.sort((a, b) => b.performanceScore - a.performanceScore);

    this.logger.log(
      `✅ ${eligible.length} contenidos elegibles encontrados (top ${limit})`,
    );

    return eligible;
  }

  /**
   * ✅ Verifica si un contenido es elegible para reciclaje
   *
   * @param noticiaId - ID de la noticia
   * @param customCriteria - Criterios personalizados (opcional)
   * @returns Resultado de elegibilidad con razones
   */
  async checkEligibility(
    noticiaId: string,
    customCriteria?: Partial<RecyclingEligibilityCriteria>,
  ): Promise<EligibilityCheckResult> {
    const criteria = { ...this.defaultCriteria, ...customCriteria };
    const reasons: string[] = [];

    // 1. Verificar que la noticia existe
    const noticia = await this.publishedNoticiaModel.findById(noticiaId);
    if (!noticia) {
      return {
        isEligible: false,
        recycleType: 'not_recyclable',
        reasons: ['Noticia no encontrada'],
      };
    }

    // 2. Verificar tipo de contenido (solo evergreen y blog)
    if (!['evergreen', 'blog'].includes(noticia.contentType)) {
      return {
        isEligible: false,
        recycleType: 'not_recyclable',
        reasons: [`Tipo de contenido no reciclable: ${noticia.contentType}`],
      };
    }

    // 3. Determinar tipo de reciclaje
    const recycleType = this.determineRecycleType(noticia);

    // 4. Verificar edad mínima (3+ meses)
    const ageInMonths = this.getAgeInMonths(noticia.publishedAt);
    if (ageInMonths < criteria.minAgeMonths) {
      return {
        isEligible: false,
        recycleType,
        reasons: [
          `Contenido muy reciente: ${ageInMonths.toFixed(1)} meses (mínimo ${criteria.minAgeMonths})`,
        ],
        nextAllowedRecycleDate: this.calculateNextAllowedDate(
          noticia.publishedAt,
          criteria.minAgeMonths,
        ),
      };
    }
    reasons.push(`✓ Edad suficiente: ${ageInMonths.toFixed(1)} meses`);

    // 5. Verificar performance score
    const performanceScore = await this.calculatePerformanceScore(noticiaId);
    if (performanceScore < criteria.minPerformanceScore) {
      return {
        isEligible: false,
        recycleType,
        reasons: [
          `Performance insuficiente: ${(performanceScore * 100).toFixed(0)}% (mínimo ${(criteria.minPerformanceScore * 100).toFixed(0)}%)`,
        ],
        performanceScore,
      };
    }
    reasons.push(
      `✓ Performance aceptable: ${(performanceScore * 100).toFixed(0)}%`,
    );

    // 6. Verificar schedule existente
    const schedule = await this.recycleScheduleModel.findOne({
      noticiaId: noticia._id,
    });

    if (schedule) {
      // Verificar máximo de reciclajes
      const totalRecycles = schedule.performanceHistory.length;
      if (totalRecycles >= criteria.maxTotalRecycles) {
        return {
          isEligible: false,
          recycleType,
          reasons: [
            `Máximo de reciclajes alcanzado: ${totalRecycles}/${criteria.maxTotalRecycles}`,
          ],
          performanceScore,
        };
      }
      reasons.push(`✓ Reciclajes: ${totalRecycles}/${criteria.maxTotalRecycles}`);

      // Verificar días desde último reciclaje
      if (totalRecycles > 0) {
        const lastRecycle =
          schedule.performanceHistory[schedule.performanceHistory.length - 1];
        const daysSinceLastRecycle = Math.floor(
          (Date.now() - new Date(lastRecycle.recycleDate).getTime()) /
            (1000 * 60 * 60 * 24),
        );

        if (daysSinceLastRecycle < criteria.minDaysSinceLastRecycle) {
          return {
            isEligible: false,
            recycleType,
            reasons: [
              `Reciclado muy recientemente: ${daysSinceLastRecycle} días (mínimo ${criteria.minDaysSinceLastRecycle})`,
            ],
            nextAllowedRecycleDate: new Date(
              new Date(lastRecycle.recycleDate).getTime() +
                criteria.minDaysSinceLastRecycle * 24 * 60 * 60 * 1000,
            ),
            performanceScore,
          };
        }
        reasons.push(
          `✓ Último reciclaje hace ${daysSinceLastRecycle} días (suficiente)`,
        );
      }
    } else {
      reasons.push('✓ Nunca reciclado (primera vez)');
    }

    // 7. TODO: Verificar si hay breaking news activo (si está configurado)
    // Esta verificación se hace en el scheduler al programar

    // ✅ ELEGIBLE
    return {
      isEligible: true,
      recycleType,
      reasons,
      performanceScore,
    };
  }

  /**
   * 📊 Calcula el score de performance de una noticia (0.0 - 1.0)
   *
   * Basado en métricas de engagement en redes sociales:
   * - Facebook: likes, comments, shares, reach
   * - Twitter: likes, retweets, replies, impressions
   *
   * Score normalizado:
   * - 0.0 = Sin engagement
   * - 0.5 = Engagement promedio
   * - 1.0 = Engagement excepcional
   *
   * @param noticiaId - ID de la noticia
   * @returns Score de 0.0 a 1.0
   */
  async calculatePerformanceScore(noticiaId: string): Promise<number> {
    // TODO: En producción, obtener métricas reales de FacebookPost y TwitterPost
    // Por ahora, usar valores simulados basados en metadata de la noticia

    const noticia = await this.publishedNoticiaModel.findById(noticiaId);
    if (!noticia) {
      return 0;
    }

    // Simulación de métricas (en producción, buscar en FacebookPost y TwitterPost)
    // Valores simulados basados en tipo de contenido
    let baseScore = 0.5; // Score base

    // Ajustes por tipo de contenido
    if (noticia.contentType === 'evergreen') {
      baseScore = 0.75; // Evergreen típicamente tiene mejor performance
    } else if (noticia.contentType === 'blog') {
      baseScore = 0.65; // Blogs tienen buen engagement
    }

    // Ajustes por edad (contenido más viejo que sigue activo es valioso)
    const ageInMonths = this.getAgeInMonths(noticia.publishedAt);
    if (ageInMonths > 6) {
      baseScore += 0.1; // Bonus por longevidad
    }

    // Ajustes por presencia de imagen
    if (noticia.featuredImage) {
      baseScore += 0.05; // Bonus por imagen
    }

    // Normalizar entre 0 y 1
    const score = Math.min(Math.max(baseScore, 0), 1);

    return Number(score.toFixed(2));
  }

  /**
   * 📅 Crea un schedule de reciclaje para una noticia
   *
   * @param noticiaId - ID de la noticia
   * @param recycleType - Tipo de reciclaje
   * @param customFrequencyDays - Frecuencia personalizada (opcional)
   * @returns Schedule creado o actualizado
   */
  async createRecycleSchedule(
    noticiaId: string,
    recycleType: RecycleType,
    customFrequencyDays?: number,
  ): Promise<ContentRecyclingScheduleDocument> {
    this.logger.log(
      `📅 Creando schedule de reciclaje para noticia ${noticiaId} (tipo: ${recycleType})`,
    );

    // Verificar elegibilidad primero
    const eligibility = await this.checkEligibility(noticiaId);
    if (!eligibility.isEligible) {
      throw new Error(
        `Noticia no elegible para reciclaje: ${eligibility.reasons.join(', ')}`,
      );
    }

    // Buscar schedule existente
    let schedule = await this.recycleScheduleModel.findOne({
      noticiaId: noticiaId,
    });

    if (schedule) {
      // Actualizar schedule existente
      schedule.recycleType = recycleType;
      if (customFrequencyDays) {
        schedule.recycleFrequencyDays = customFrequencyDays;
      }
      schedule.lastCheckedAt = new Date();

      await schedule.save();
      this.logger.log(`✅ Schedule existente actualizado`);
    } else {
      // Crear nuevo schedule
      schedule = await this.recycleScheduleModel.create({
        noticiaId,
        recycleType,
        recycleFrequencyDays: customFrequencyDays || 90, // Default 90 días
        maxRecyclesAllowed: 3,
        performanceHistory: [],
        lastCheckedAt: new Date(),
      });

      this.logger.log(`✅ Nuevo schedule creado`);
    }

    return schedule;
  }

  /**
   * 📈 Trackea el performance de un reciclaje ejecutado
   *
   * @param noticiaId - ID de la noticia
   * @param performance - Datos de performance del reciclaje
   * @returns Schedule actualizado
   */
  async trackRecyclePerformance(
    noticiaId: string,
    performance: Omit<RecyclePerformance, 'recycleNumber'>,
  ): Promise<ContentRecyclingScheduleDocument> {
    this.logger.log(
      `📈 Trackeando performance de reciclaje para noticia ${noticiaId}`,
    );

    const schedule = await this.recycleScheduleModel.findOne({ noticiaId });
    if (!schedule) {
      throw new Error('Schedule de reciclaje no encontrado');
    }

    // Agregar performance al historial
    const recycleNumber = schedule.performanceHistory.length + 1;
    schedule.performanceHistory.push({
      ...performance,
      recycleNumber,
    } as RecyclePerformance);

    schedule.lastCheckedAt = new Date();
    await schedule.save();

    this.logger.log(
      `✅ Performance trackeado (reciclaje #${recycleNumber}, ${(performance.performanceVsOriginal * 100).toFixed(0)}% vs original)`,
    );

    return schedule;
  }

  /**
   * 📊 Obtiene estadísticas del sistema de reciclaje
   *
   * @returns Estadísticas completas
   */
  async getRecyclingStats(): Promise<RecyclingStats> {
    this.logger.log('📊 Generando estadísticas de reciclaje');

    // Obtener todos los schedules
    const allSchedules = await this.recycleScheduleModel.find().lean();

    // Calcular estadísticas
    const totalRecycled = allSchedules.reduce(
      (sum, s) => sum + s.performanceHistory.length,
      0,
    );

    // Contar elegibles (contenido que puede ser reciclado ahora)
    const eligible = await this.findEligibleContent(100);
    const totalEligible = eligible.length;

    // Performance promedio vs original
    const allPerformances = allSchedules.flatMap((s) => s.performanceHistory);
    const averagePerformanceVsOriginal =
      allPerformances.length > 0
        ? allPerformances.reduce((sum, p) => sum + p.performanceVsOriginal, 0) /
          allPerformances.length
        : 0;

    // Por tipo de reciclaje
    const byRecycleType: Record<RecycleType, number> = {
      pure_evergreen: 0,
      seasonal_evergreen: 0,
      durable: 0,
      not_recyclable: 0,
    };
    allSchedules.forEach((s) => {
      byRecycleType[s.recycleType] =
        (byRecycleType[s.recycleType] || 0) + s.performanceHistory.length;
    });

    // Top performing recycles
    const topPerformingRecycles = allSchedules
      .flatMap((schedule) =>
        schedule.performanceHistory.map((perf) => ({
          noticiaId: schedule.noticiaId.toString(),
          title: '', // TODO: Obtener título desde noticia
          recycleNumber: perf.recycleNumber,
          performanceVsOriginal: perf.performanceVsOriginal,
        })),
      )
      .sort((a, b) => b.performanceVsOriginal - a.performanceVsOriginal)
      .slice(0, 10);

    return {
      totalRecycled,
      totalEligible,
      averagePerformanceVsOriginal,
      byRecycleType,
      topPerformingRecycles,
    };
  }

  /**
   * 🔍 Determina el tipo de reciclaje según contenido de la noticia
   *
   * @param noticia - Noticia a clasificar
   * @returns Tipo de reciclaje
   */
  private determineRecycleType(noticia: PublishedNoticiaDocument): RecycleType {
    // Si no es evergreen ni blog, no es reciclable
    if (!['evergreen', 'blog'].includes(noticia.contentType)) {
      return 'not_recyclable';
    }

    // Detectar keywords para clasificación
    const title = noticia.title.toLowerCase();
    const summary = noticia.summary?.toLowerCase() || '';
    const content = (title + ' ' + summary).toLowerCase();

    // Pure Evergreen: Guías, tutoriales, listas, "cómo hacer"
    const evergreenKeywords = [
      'guía',
      'tutorial',
      'cómo',
      'pasos',
      'lista',
      'mejores',
      'top',
      'consejos',
      'tips',
      'trucos',
    ];
    if (evergreenKeywords.some((kw) => content.includes(kw))) {
      return 'pure_evergreen';
    }

    // Seasonal Evergreen: Eventos estacionales, fechas especiales
    const seasonalKeywords = [
      'navidad',
      'año nuevo',
      'verano',
      'invierno',
      'primavera',
      'otoño',
      'vacaciones',
      'día de',
      'festival',
    ];
    if (seasonalKeywords.some((kw) => content.includes(kw))) {
      return 'seasonal_evergreen';
    }

    // Durable: Contenido con vida útil larga
    const durableKeywords = [
      'inauguración',
      'apertura',
      'nuevo',
      'ley',
      'reforma',
      'cambio',
      'actualización',
    ];
    if (durableKeywords.some((kw) => content.includes(kw))) {
      return 'durable';
    }

    // Default: Pure evergreen si es marcado como evergreen
    if (noticia.contentType === 'evergreen') {
      return 'pure_evergreen';
    }

    // Blogs por defecto son durable
    return 'durable';
  }

  /**
   * 📅 Calcula la edad de una noticia en meses
   *
   * @param publishedAt - Fecha de publicación
   * @returns Edad en meses
   */
  private getAgeInMonths(publishedAt: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - publishedAt.getTime());
    const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30); // Aproximado
    return diffMonths;
  }

  /**
   * 📅 Calcula la próxima fecha permitida para reciclaje
   *
   * @param publishedAt - Fecha de publicación
   * @param minAgeMonths - Edad mínima en meses
   * @returns Próxima fecha permitida
   */
  private calculateNextAllowedDate(
    publishedAt: Date,
    minAgeMonths: number,
  ): Date {
    const nextDate = new Date(publishedAt);
    nextDate.setMonth(nextDate.getMonth() + minAgeMonths);
    return nextDate;
  }
}
