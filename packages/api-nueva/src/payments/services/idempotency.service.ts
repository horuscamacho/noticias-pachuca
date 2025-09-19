import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '../../services/cache.service';
import { AppConfigService } from '../../config/config.service';
import { IdempotencyResult } from '../interfaces/payment.interface';
import { createHash } from 'crypto';

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly configService: AppConfigService,
  ) {}

  /**
   * Procesa una operación con idempotencia
   * Si la operación ya fue ejecutada, retorna el resultado cacheado
   * Si no, ejecuta la operación y cachea el resultado
   */
  async processWithIdempotency<T>(
    key: string,
    operation: () => Promise<T>,
    ttlSeconds?: number,
  ): Promise<IdempotencyResult<T>> {
    const cacheKey = this.generateCacheKey(key);
    const ttl = ttlSeconds || this.configService.paymentIdempotencyTtl;

    try {
      // Intentar obtener del cache
      const cachedResult = await this.cacheService.get<T>(cacheKey);

      if (cachedResult !== undefined) {
        this.logger.log(`🎯 Idempotency HIT para key: ${this.maskKey(key)}`);
        return {
          isFromCache: true,
          data: cachedResult,
          cacheKey,
        };
      }

      // Si no está en cache, ejecutar operación
      this.logger.log(`🔄 Ejecutando operación para key: ${this.maskKey(key)}`);
      const result = await operation();

      // Cachear resultado
      await this.cacheService.set(cacheKey, result, ttl);

      this.logger.log(
        `✅ Operación completada y cacheada para key: ${this.maskKey(key)}`
      );

      return {
        isFromCache: false,
        data: result,
        cacheKey,
      };
    } catch (error) {
      this.logger.error(
        `❌ Error en operación idempotente para key ${this.maskKey(key)}:`,
        error
      );

      // Si la operación falla, no cachear el error
      // Permitir retry en el siguiente intento
      throw error;
    }
  }

  /**
   * Genera un idempotency key único basado en datos del usuario y operación
   */
  generateIdempotencyKey(
    userId: string,
    operation: string,
    data: Record<string, unknown>,
  ): string {
    const timestamp = Math.floor(Date.now() / 1000); // Timestamp en segundos
    const payload = {
      userId,
      operation,
      data,
      timestamp: Math.floor(timestamp / 300), // Ventana de 5 minutos
    };

    const hash = createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');

    return `${operation}_${userId}_${hash.substring(0, 16)}`;
  }

  /**
   * Verifica si una operación ya fue procesada
   */
  async isProcessed(key: string): Promise<boolean> {
    const cacheKey = this.generateCacheKey(key);
    const result = await this.cacheService.get(cacheKey);
    return result !== undefined;
  }

  /**
   * Invalida un idempotency key (forzar re-ejecución)
   */
  async invalidate(key: string): Promise<void> {
    const cacheKey = this.generateCacheKey(key);
    await this.cacheService.del(cacheKey);
    this.logger.log(`🗑️ Idempotency key invalidada: ${this.maskKey(key)}`);
  }

  /**
   * Obtiene el resultado cacheado sin ejecutar operación
   */
  async getCachedResult<T>(key: string): Promise<T | undefined> {
    const cacheKey = this.generateCacheKey(key);
    return await this.cacheService.get<T>(cacheKey);
  }

  /**
   * Almacena un resultado manualmente en el cache
   */
  async storeResult<T>(
    key: string,
    result: T,
    ttlSeconds?: number,
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(key);
    const ttl = ttlSeconds || this.configService.paymentIdempotencyTtl;

    await this.cacheService.set(cacheKey, result, ttl);
    this.logger.log(
      `💾 Resultado almacenado manualmente para key: ${this.maskKey(key)}`
    );
  }

  /**
   * Genera la clave de cache con prefijo
   */
  private generateCacheKey(key: string): string {
    return `idempotency:payment:${key}`;
  }

  /**
   * Enmascara la key para logging seguro
   */
  private maskKey(key: string): string {
    if (key.length <= 8) {
      return '***';
    }
    return `${key.substring(0, 4)}***${key.substring(key.length - 4)}`;
  }

  /**
   * Limpia keys expiradas (maintenance)
   */
  async cleanupExpired(): Promise<void> {
    // El TTL automático de Redis se encarga de esto
    // Este método puede extenderse para cleanup manual si es necesario
    this.logger.log('🧹 Cleanup de idempotency keys completado');
  }

  /**
   * Obtiene estadísticas de uso
   */
  async getStats(): Promise<{
    totalKeys: number;
    hitRate: number;
  }> {
    // Implementación básica - puede extenderse con métricas reales
    return {
      totalKeys: 0, // Placeholder
      hitRate: 0,   // Placeholder
    };
  }
}