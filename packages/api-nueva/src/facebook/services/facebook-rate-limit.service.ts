import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../../services/cache.service';
import {
  RateLimitData,
  FacebookRateLimitHeaders,
  AppUsageData,
  BusinessUseCaseData,
  RateLimitStrategy
} from '../interfaces/rate-limit.interface';

/**
 * 🎯 FACEBOOK RATE LIMIT SERVICE
 * Gestión inteligente de límites de la API de Facebook
 * ✅ Usa CacheService existente - NO Redis directo
 */

@Injectable()
export class FacebookRateLimitService {
  private readonly logger = new Logger(FacebookRateLimitService.name);
  private readonly rateLimitKey = 'facebook:rate_limit';
  private readonly strategy: RateLimitStrategy;

  constructor(
    private readonly cacheService: CacheService, // ✅ Usar servicio existente
    private readonly configService: ConfigService
  ) {
    // Configuración de estrategia desde config
    this.strategy = {
      maxCallsPerHour: 200, // Facebook base limit per user
      bufferPercentage: this.configService.get<number>('config.facebook.rateLimitBuffer') || 75,
      backoffMultiplier: 2,
      maxRetries: 3,
      retryDelay: 1000
    };

    this.logger.log('FacebookRateLimitService initialized with strategy:', this.strategy);
  }

  /**
   * Verificar si podemos hacer una llamada a la API
   */
  async checkRateLimit(appId: string): Promise<boolean> {
    try {
      const usage = await this.getCurrentUsage(appId);
      const canProceed = usage.percentage < this.strategy.bufferPercentage;

      if (!canProceed) {
        this.logger.warn(`Rate limit threshold reached for app ${appId}: ${usage.percentage}%`);
      }

      return canProceed;
    } catch (error) {
      this.logger.error('Error checking rate limit:', error);
      // En caso de error, ser conservador y denegar
      return false;
    }
  }

  /**
   * Actualizar uso basado en headers de respuesta de Facebook
   */
  async updateUsage(appId: string, headers: FacebookRateLimitHeaders): Promise<void> {
    try {
      const usage = this.parseUsageHeaders(headers);
      const cacheKey = `${this.rateLimitKey}:${appId}`;

      // Cache por 1 hora (TTL en segundos)
      await this.cacheService.set(cacheKey, usage, 3600);

      // Log si estamos cerca del límite
      if (usage.percentage > 50) {
        this.logger.warn(`Rate limit usage for app ${appId}: ${usage.percentage}%`);
      }

      // Log crítico si estamos muy cerca
      if (usage.percentage > 90) {
        this.logger.error(`CRITICAL: Rate limit usage for app ${appId}: ${usage.percentage}%`);
      }

    } catch (error) {
      this.logger.error('Error updating rate limit usage:', error);
    }
  }

  /**
   * Esperar si hemos alcanzado el límite
   */
  async waitForRateLimit(appId: string): Promise<void> {
    try {
      const usage = await this.getCurrentUsage(appId);

      if (usage.estimatedTimeToRegainAccess > 0) {
        // Máximo 5 minutos de espera
        const waitTime = Math.min(usage.estimatedTimeToRegainAccess, 300000);

        this.logger.warn(
          `Rate limit reached for app ${appId}. Waiting ${waitTime}ms before retry`
        );

        await this.sleep(waitTime);
      }
    } catch (error) {
      this.logger.error('Error in waitForRateLimit:', error);
      // Espera por defecto si hay error
      await this.sleep(5000);
    }
  }

  /**
   * Obtener estadísticas actuales de uso
   */
  async getCurrentUsage(appId: string): Promise<RateLimitData> {
    try {
      const cacheKey = `${this.rateLimitKey}:${appId}`;
      const cached = await this.cacheService.get<RateLimitData>(cacheKey);

      if (cached) {
        return cached;
      }

      // Valores por defecto si no hay datos en cache
      return {
        callCount: 0,
        totalCpuTime: 0,
        totalTime: 0,
        percentage: 0,
        estimatedTimeToRegainAccess: 0
      };

    } catch (error) {
      this.logger.error('Error getting current usage:', error);
      return {
        callCount: 0,
        totalCpuTime: 0,
        totalTime: 0,
        percentage: 0,
        estimatedTimeToRegainAccess: 0
      };
    }
  }

  /**
   * Calcular retraso óptimo antes de la siguiente llamada
   */
  async calculateOptimalDelay(appId: string): Promise<number> {
    try {
      const usage = await this.getCurrentUsage(appId);

      // Sin retraso si estamos por debajo del 50%
      if (usage.percentage < 50) {
        return 0;
      }

      // Retraso progresivo basado en el porcentaje de uso
      const baseDelay = 1000; // 1 segundo base
      const multiplier = Math.pow(usage.percentage / 50, 2);
      const delay = Math.min(baseDelay * multiplier, 30000); // Max 30 segundos

      return Math.round(delay);

    } catch (error) {
      this.logger.error('Error calculating optimal delay:', error);
      return 1000; // 1 segundo por defecto
    }
  }

  /**
   * Verificar si necesitamos aplicar backoff exponencial
   */
  shouldApplyBackoff(retryCount: number): boolean {
    return retryCount > 0 && retryCount <= this.strategy.maxRetries;
  }

  /**
   * Calcular retraso de backoff exponencial
   */
  calculateBackoffDelay(retryCount: number): number {
    const delay = this.strategy.retryDelay * Math.pow(this.strategy.backoffMultiplier, retryCount);
    return Math.min(delay, 60000); // Max 1 minuto
  }

  /**
   * Obtener métricas de rate limiting para monitoreo
   */
  async getRateLimitMetrics(appId: string): Promise<{
    currentUsage: RateLimitData;
    strategy: RateLimitStrategy;
    status: 'safe' | 'warning' | 'critical';
    recommendedAction: string;
  }> {
    const usage = await this.getCurrentUsage(appId);
    let status: 'safe' | 'warning' | 'critical' = 'safe';
    let recommendedAction = 'Continue normal operations';

    if (usage.percentage >= 90) {
      status = 'critical';
      recommendedAction = 'Stop all non-essential API calls immediately';
    } else if (usage.percentage >= this.strategy.bufferPercentage) {
      status = 'warning';
      recommendedAction = 'Reduce API call frequency and implement delays';
    }

    return {
      currentUsage: usage,
      strategy: this.strategy,
      status,
      recommendedAction
    };
  }

  /**
   * Resetear datos de rate limiting (para testing o casos especiales)
   */
  async resetRateLimit(appId: string): Promise<void> {
    try {
      const cacheKey = `${this.rateLimitKey}:${appId}`;
      await this.cacheService.del(cacheKey);
      this.logger.log(`Rate limit data reset for app ${appId}`);
    } catch (error) {
      this.logger.error('Error resetting rate limit:', error);
    }
  }

  /**
   * Parsear headers de respuesta de Facebook
   */
  private parseUsageHeaders(headers: FacebookRateLimitHeaders): RateLimitData {
    let usage: RateLimitData = {
      callCount: 0,
      totalCpuTime: 0,
      totalTime: 0,
      percentage: 0,
      estimatedTimeToRegainAccess: 0
    };

    try {
      // Parse App Usage
      if (headers['x-app-usage']) {
        const appUsage: AppUsageData = JSON.parse(headers['x-app-usage']);
        usage.callCount = appUsage.call_count || 0;
        usage.totalCpuTime = appUsage.total_cputime || 0;
        usage.totalTime = appUsage.total_time || 0;

        // Calcular porcentaje basado en el más alto de los valores
        const callPercentage = (usage.callCount / 200) * 100; // 200 calls per hour per user
        const timePercentage = usage.totalTime || 0;
        const cpuPercentage = usage.totalCpuTime || 0;

        usage.percentage = Math.max(callPercentage, timePercentage, cpuPercentage);
      }

      // Parse Business Use Case (si está disponible)
      if (headers['x-business-use-case-usage']) {
        const bucUsage: BusinessUseCaseData = JSON.parse(headers['x-business-use-case-usage']);

        // Buscar el tiempo estimado de recuperación más alto
        let maxEstimatedTime = 0;
        for (const businessId in bucUsage) {
          const businessData = bucUsage[businessId];
          if (Array.isArray(businessData)) {
            for (const item of businessData) {
              if (item.estimated_time_to_regain_access > maxEstimatedTime) {
                maxEstimatedTime = item.estimated_time_to_regain_access;
              }
            }
          }
        }

        usage.estimatedTimeToRegainAccess = maxEstimatedTime * 1000; // Convertir a ms
      }

    } catch (error) {
      this.logger.error('Error parsing usage headers:', error);
    }

    return usage;
  }

  /**
   * Utilidad para sleep/delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Verificar si un error es de rate limiting
   */
  isRateLimitError(error: unknown): boolean {
    if (typeof error === 'object' && error !== null) {
      const errorObj = error as Record<string, unknown>;

      // Códigos de error de Facebook para rate limiting
      const rateLimitCodes = [4, 17, 32, 613];

      if (errorObj.code && typeof errorObj.code === 'number') {
        return rateLimitCodes.includes(errorObj.code);
      }

      // Check en mensaje de error
      if (errorObj.message && typeof errorObj.message === 'string') {
        const message = errorObj.message.toLowerCase();
        return message.includes('rate limit') ||
               message.includes('too many calls') ||
               message.includes('user request limit');
      }
    }

    return false;
  }

  /**
   * Obtener información de configuración actual
   */
  getStrategy(): RateLimitStrategy {
    return { ...this.strategy };
  }

  /**
   * Actualizar estrategia de rate limiting
   */
  updateStrategy(newStrategy: Partial<RateLimitStrategy>): void {
    Object.assign(this.strategy, newStrategy);
    this.logger.log('Rate limiting strategy updated:', this.strategy);
  }
}