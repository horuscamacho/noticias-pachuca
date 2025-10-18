import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CommunityManagerConfig,
  CommunityManagerConfigDocument,
} from '../schemas/community-manager-config.schema';
import {
  ScheduledPost,
  ScheduledPostDocument,
} from '../schemas/scheduled-post.schema';
import {
  PublishedNoticia,
  PublishedNoticiaDocument,
} from '../../pachuca-noticias/schemas/published-noticia.schema';
import {
  SchedulingResult,
  SchedulingMethod,
  TimeWindow,
  Platform,
  ContentType,
} from '../interfaces/scheduling.interface';

/**
 * 📅 Intelligent Scheduler Service
 *
 * FASE 2: Intelligent Scheduler
 *
 * Calcula tiempos óptimos para publicación en redes sociales basándose en:
 * - Tipo de contenido (breaking_news, normal_news, blog, evergreen)
 * - Plataforma (facebook, twitter)
 * - Mejores prácticas 2026 (research-based optimal times)
 * - Detección de breaking news activo
 * - Evita colisiones en slots ya ocupados
 *
 * REGLAS DE SCHEDULING:
 * 1. Breaking news: INMEDIATO (0-5 minutos)
 * 2. Normal news: RÁPIDO (15-30 minutos, slot moderate/peak)
 * 3. Blog: SIGUIENTE SLOT ÓPTIMO (peak o moderate, mismo día o siguiente)
 * 4. Evergreen: SLOTS BAJOS (low times, solo si NO hay breaking news activo)
 * 5. Recycled: SLOTS BAJOS (low times, fines de semana preferidos)
 */
@Injectable()
export class IntelligentSchedulerService {
  private readonly logger = new Logger(IntelligentSchedulerService.name);

  constructor(
    @InjectModel(CommunityManagerConfig.name)
    private configModel: Model<CommunityManagerConfigDocument>,
    @InjectModel(ScheduledPost.name)
    private scheduledPostModel: Model<ScheduledPostDocument>,
    @InjectModel(PublishedNoticia.name)
    private publishedNoticiaModel: Model<PublishedNoticiaDocument>,
  ) {
    this.logger.log('📅 Intelligent Scheduler Service initialized');
  }

  /**
   * 🎯 Calcula el tiempo óptimo para publicar contenido
   *
   * @param contentType - Tipo de contenido (breaking_news, normal_news, blog, evergreen, recycled)
   * @param platform - Plataforma de destino (facebook, twitter)
   * @param noticiaId - ID de la noticia (opcional, para logging)
   * @returns SchedulingResult con fecha calculada y metadata
   */
  async calculateOptimalTime(
    contentType: ContentType,
    platform: Platform,
    noticiaId?: string,
  ): Promise<SchedulingResult> {
    this.logger.log(
      `🎯 Calculando tiempo óptimo para ${contentType} en ${platform}`,
    );

    const config = await this.getConfig();
    const now = new Date();

    // REGLA 1: Breaking news -> INMEDIATO
    if (contentType === 'breaking_news') {
      const scheduledAt = new Date(now.getTime() + 2 * 60 * 1000); // +2 minutos

      return {
        scheduledAt,
        calculatedAt: new Date(),
        reasoning: 'Breaking news se publica inmediatamente (2 min delay para procesamiento)',
        metadata: {
          requestedAt: now,
          calculationMethod: 'immediate',
          timeWindow: 'peak',
          isOptimalTime: true,
          alternativeTimesConsidered: [],
        },
      };
    }

    // REGLA 2: Normal news -> RÁPIDO (15-30 minutos)
    if (contentType === 'normal_news') {
      const targetTime = new Date(now.getTime() + 20 * 60 * 1000); // +20 minutos
      const slot = await this.findNextAvailableSlot(
        targetTime,
        platform,
        ['peak', 'moderate'],
        30, // Buscar en ventana de 30 minutos
      );

      return {
        scheduledAt: slot.time,
        calculatedAt: new Date(),
        reasoning: `Normal news publicada rápidamente en slot ${slot.window}`,
        metadata: {
          requestedAt: now,
          calculationMethod: 'quick',
          timeWindow: slot.window,
          isOptimalTime: slot.window === 'peak',
          alternativeTimesConsidered: slot.alternatives,
        },
      };
    }

    // REGLA 3: Blog -> SIGUIENTE SLOT ÓPTIMO (peak o moderate)
    if (contentType === 'blog') {
      const slot = await this.findNextOptimalSlot(
        platform,
        ['peak', 'moderate'],
        config,
      );

      return {
        scheduledAt: slot.time,
        calculatedAt: new Date(),
        reasoning: `Blog publicado en siguiente slot ${slot.window} óptimo`,
        metadata: {
          requestedAt: now,
          calculationMethod: 'optimal',
          timeWindow: slot.window,
          isOptimalTime: slot.window === 'peak',
          alternativeTimesConsidered: slot.alternatives,
        },
      };
    }

    // REGLA 4 y 5: Evergreen y Recycled -> SLOTS BAJOS
    if (contentType === 'evergreen' || contentType === 'recycled') {
      // Verificar si hay breaking news activo
      const hasActiveBreaking = await this.shouldPauseEvergreen();
      if (hasActiveBreaking) {
        this.logger.warn(
          '⚠️ Breaking news activo detectado, posponiendo evergreen/recycled',
        );
        // Buscar slot en 3 horas (después de ventana de breaking news)
        const delayedStart = new Date(now.getTime() + 3 * 60 * 60 * 1000);
        const slot = await this.findNextAvailableSlot(
          delayedStart,
          platform,
          ['low'],
          180, // Ventana de 3 horas
        );

        return {
          scheduledAt: slot.time,
          calculatedAt: new Date(),
          reasoning: `${contentType} pospuesto por breaking news activo, publicado en slot low`,
          metadata: {
            requestedAt: now,
            calculationMethod: 'delayed_low',
            timeWindow: slot.window,
            isOptimalTime: false,
            alternativeTimesConsidered: slot.alternatives,
          },
        };
      }

      // Sin breaking news, buscar slot low óptimo
      const slot = await this.findNextOptimalSlot(platform, ['low'], config);

      return {
        scheduledAt: slot.time,
        calculatedAt: new Date(),
        reasoning: `${contentType} publicado en slot low (menor competencia)`,
        metadata: {
          requestedAt: now,
          calculationMethod: 'low_traffic',
          timeWindow: slot.window,
          isOptimalTime: true, // Es óptimo para evergreen (menos competencia)
          alternativeTimesConsidered: slot.alternatives,
        },
      };
    }

    // Fallback: publicar en 1 hora
    this.logger.warn(`⚠️ Tipo de contenido no reconocido: ${contentType}`);
    return {
      scheduledAt: new Date(now.getTime() + 60 * 60 * 1000),
      calculatedAt: new Date(),
      reasoning: 'Fallback: tipo de contenido no reconocido',
      metadata: {
        requestedAt: now,
        calculationMethod: 'fallback',
        timeWindow: 'moderate',
        isOptimalTime: false,
        alternativeTimesConsidered: [],
      },
    };
  }

  /**
   * 🔍 Encuentra el siguiente slot disponible sin colisiones
   *
   * @param startTime - Tiempo inicial desde donde buscar
   * @param platform - Plataforma
   * @param allowedWindows - Ventanas de tiempo permitidas (peak, moderate, low)
   * @param searchWindowMinutes - Ventana de búsqueda en minutos
   * @returns Slot con tiempo, ventana, y alternativas consideradas
   */
  async findNextAvailableSlot(
    startTime: Date,
    platform: Platform,
    allowedWindows: TimeWindow[],
    searchWindowMinutes: number = 60,
  ): Promise<{
    time: Date;
    window: TimeWindow;
    alternatives: Date[];
  }> {
    const alternatives: Date[] = [];
    const endTime = new Date(
      startTime.getTime() + searchWindowMinutes * 60 * 1000,
    );

    // Obtener posts ya programados en esta ventana
    const existingPosts = await this.scheduledPostModel
      .find({
        platform,
        scheduledAt: {
          $gte: startTime,
          $lte: endTime,
        },
        status: { $in: ['scheduled', 'processing'] },
      })
      .sort({ scheduledAt: 1 })
      .lean();

    // Buscar slots de 15 minutos sin colisiones
    let currentTime = new Date(startTime);
    const slotDuration = 15 * 60 * 1000; // 15 minutos

    while (currentTime <= endTime) {
      const window = this.getTimeWindow(currentTime, platform);

      // Verificar si esta ventana es permitida
      if (allowedWindows.includes(window)) {
        // Verificar si hay colisión (post dentro de ±10 minutos)
        const hasCollision = existingPosts.some((post) => {
          const diff = Math.abs(
            new Date(post.scheduledAt).getTime() - currentTime.getTime(),
          );
          return diff < 10 * 60 * 1000; // Menos de 10 minutos
        });

        if (!hasCollision) {
          // Encontrado slot disponible
          return {
            time: currentTime,
            window,
            alternatives,
          };
        }

        // Si hay colisión, guardar como alternativa
        alternatives.push(new Date(currentTime));
      }

      // Avanzar al siguiente slot
      currentTime = new Date(currentTime.getTime() + slotDuration);
    }

    // Si no se encontró slot libre, devolver el último slot considerado
    this.logger.warn(
      `⚠️ No se encontró slot disponible en ventana de ${searchWindowMinutes} min, usando último slot`,
    );
    return {
      time: currentTime,
      window: this.getTimeWindow(currentTime, platform),
      alternatives,
    };
  }

  /**
   * 🎯 Encuentra el siguiente slot óptimo según configuración y mejores prácticas
   *
   * @param platform - Plataforma
   * @param allowedWindows - Ventanas permitidas
   * @param config - Configuración del sistema
   * @returns Slot óptimo
   */
  async findNextOptimalSlot(
    platform: Platform,
    allowedWindows: TimeWindow[],
    config: CommunityManagerConfigDocument,
  ): Promise<{
    time: Date;
    window: TimeWindow;
    alternatives: Date[];
  }> {
    const now = new Date();
    const platformConfig = config.optimalTimes[platform];

    // Buscar en peak times primero (si está permitido)
    if (allowedWindows.includes('peak')) {
      const peakSlots = platformConfig.peak;
      for (const slot of peakSlots) {
        const nextPeakTime = this.findNextMatchingTime(now, slot.day, slot.hours);
        const result = await this.findNextAvailableSlot(
          nextPeakTime,
          platform,
          ['peak'],
          15, // Buscar en ventana de 15 minutos
        );
        if (result.time.getTime() <= nextPeakTime.getTime() + 15 * 60 * 1000) {
          return result; // Encontrado en peak
        }
      }
    }

    // Si no hay peak disponible, buscar en moderate
    if (allowedWindows.includes('moderate')) {
      const moderateSlots = platformConfig.moderate;
      for (const slot of moderateSlots) {
        const nextModerateTime = this.findNextMatchingTime(
          now,
          slot.day,
          slot.hours,
        );
        const result = await this.findNextAvailableSlot(
          nextModerateTime,
          platform,
          ['moderate'],
          30,
        );
        if (
          result.time.getTime() <=
          nextModerateTime.getTime() + 30 * 60 * 1000
        ) {
          return result; // Encontrado en moderate
        }
      }
    }

    // Si no hay moderate, buscar en low
    if (allowedWindows.includes('low')) {
      const lowSlots = platformConfig.low;
      for (const slot of lowSlots) {
        const nextLowTime = this.findNextMatchingTime(now, slot.day, slot.hours);
        const result = await this.findNextAvailableSlot(
          nextLowTime,
          platform,
          ['low'],
          60,
        );
        return result; // Devolver cualquier slot low
      }
    }

    // Fallback: +1 hora
    return {
      time: new Date(now.getTime() + 60 * 60 * 1000),
      window: 'moderate',
      alternatives: [],
    };
  }

  /**
   * 🚨 Verifica si hay breaking news activo (últimas 2 horas)
   *
   * Si hay breaking news activo, el sistema debe:
   * - Pausar publicación de evergreen y recycled
   * - Priorizar breaking news en todos los slots
   *
   * @returns true si hay breaking news activo
   */
  async shouldPauseEvergreen(): Promise<boolean> {
    const config = await this.getConfig();
    const windowHours = config.breakingNewsRules.breakingNewsWindowHours;
    const cutoffTime = new Date(Date.now() - windowHours * 60 * 60 * 1000);

    // Buscar breaking news publicado recientemente
    const activeBreaking = await this.publishedNoticiaModel.countDocuments({
      contentType: 'breaking_news',
      publishedAt: { $gte: cutoffTime },
      status: 'published',
    });

    // Buscar breaking news programado en las próximas 2 horas
    const upcomingBreaking = await this.scheduledPostModel.countDocuments({
      contentType: 'breaking_news',
      scheduledAt: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 2 * 60 * 60 * 1000),
      },
      status: 'scheduled',
    });

    const shouldPause = activeBreaking > 0 || upcomingBreaking > 0;

    if (shouldPause) {
      this.logger.log(
        `🚨 Breaking news activo detectado (${activeBreaking} recientes, ${upcomingBreaking} próximos)`,
      );
    }

    return shouldPause;
  }

  /**
   * 🕐 Determina la ventana de tiempo (peak/moderate/low) para un timestamp
   *
   * Basado en research de mejores prácticas 2026:
   *
   * TWITTER:
   * - Peak: Miércoles 9:00 AM, Martes-Jueves 9-11 AM
   * - Moderate: Lunes-Viernes 9 AM - 2 PM (excepto peak)
   * - Low: Todo lo demás
   *
   * FACEBOOK:
   * - Peak: Lunes 7:00 AM, Lunes-Viernes 7-9 AM
   * - Moderate: Lunes-Viernes 9 AM - 5 PM
   * - Low: Todo lo demás
   *
   * @param time - Timestamp a evaluar
   * @param platform - Plataforma
   * @returns TimeWindow (peak, moderate, low)
   */
  getTimeWindow(time: Date, platform: Platform): TimeWindow {
    const dayOfWeek = time.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
    const hour = time.getHours();

    if (platform === 'twitter') {
      // Peak: Miércoles 9-11 AM o Martes/Jueves 9-11 AM
      if (
        (dayOfWeek === 3 && hour >= 9 && hour < 11) || // Miércoles 9-11 AM
        ([2, 4].includes(dayOfWeek) && hour >= 9 && hour < 11) // Mar/Jue 9-11 AM
      ) {
        return 'peak';
      }

      // Moderate: Lunes-Viernes 9 AM - 2 PM (excepto peak)
      if (dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 9 && hour < 14) {
        return 'moderate';
      }

      // Low: Todo lo demás
      return 'low';
    }

    if (platform === 'facebook') {
      // Peak: Lunes-Viernes 7-9 AM
      if (dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 7 && hour < 9) {
        return 'peak';
      }

      // Moderate: Lunes-Viernes 9 AM - 5 PM
      if (dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 9 && hour < 17) {
        return 'moderate';
      }

      // Low: Todo lo demás
      return 'low';
    }

    // Plataforma no reconocida, devolver moderate por defecto
    return 'moderate';
  }

  /**
   * 🔍 Encuentra el próximo timestamp que coincida con día y hora específicos
   *
   * @param from - Timestamp desde donde buscar
   * @param allowedDays - Días permitidos (0=Dom, 1=Lun, ..., 6=Sáb)
   * @param allowedHours - Horas permitidas (0-23)
   * @returns Próximo timestamp que coincida
   */
  private findNextMatchingTime(
    from: Date,
    allowedDays: number[],
    allowedHours: number[],
  ): Date {
    let current = new Date(from);
    const maxIterations = 14; // Máximo 2 semanas

    for (let i = 0; i < maxIterations; i++) {
      const dayOfWeek = current.getDay();
      const hour = current.getHours();

      // Verificar si coincide día y hora
      if (allowedDays.includes(dayOfWeek)) {
        // Buscar hora permitida más cercana
        const nextHour = allowedHours.find((h) => h >= hour);
        if (nextHour !== undefined) {
          current.setHours(nextHour, 0, 0, 0);
          return current;
        }
      }

      // Avanzar 1 hora
      current = new Date(current.getTime() + 60 * 60 * 1000);
    }

    // Fallback: devolver from + 1 día
    return new Date(from.getTime() + 24 * 60 * 60 * 1000);
  }

  /**
   * 🔧 Obtiene la configuración activa del sistema
   *
   * @returns Configuración o crea una por defecto
   */
  private async getConfig(): Promise<CommunityManagerConfigDocument> {
    let config = await this.configModel.findOne({ isActive: true });

    if (!config) {
      // Crear configuración por defecto basada en research 2026
      config = await this.configModel.create({
        isActive: true,
        optimalTimes: {
          twitter: {
            peak: [
              { day: [3], hours: [9, 10] }, // Miércoles 9-11 AM
              { day: [2, 4], hours: [9, 10] }, // Mar/Jue 9-11 AM
            ],
            moderate: [
              { day: [1, 2, 3, 4, 5], hours: [9, 10, 11, 12, 13] }, // Lun-Vie 9AM-2PM
            ],
            low: [
              { day: [0, 1, 2, 3, 4, 5, 6], hours: [0, 1, 2, 3, 4, 5, 6, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23] }, // Resto
            ],
          },
          facebook: {
            peak: [
              { day: [1, 2, 3, 4, 5], hours: [7, 8] }, // Lun-Vie 7-9 AM
            ],
            moderate: [
              { day: [1, 2, 3, 4, 5], hours: [9, 10, 11, 12, 13, 14, 15, 16] }, // Lun-Vie 9AM-5PM
            ],
            low: [
              { day: [0, 1, 2, 3, 4, 5, 6], hours: [0, 1, 2, 3, 4, 5, 6, 17, 18, 19, 20, 21, 22, 23] }, // Resto
            ],
          },
        },
        recyclingSettings: {
          defaultFrequencyDays: 90,
          maxRecyclesPerContent: 3,
          minDaysBetweenRecycles: 60,
          minPerformanceScore: 0.7,
        },
        breakingNewsRules: {
          pauseEvergreenDuringBreaking: true,
          breakingNewsWindowHours: 2,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      this.logger.log('✅ Configuración por defecto creada');
    }

    return config;
  }
}
