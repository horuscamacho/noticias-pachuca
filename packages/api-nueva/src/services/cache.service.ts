/**
 * 🔥 CACHE SERVICE - ARQUITECTURA MODERNA REDIS 2025
 *
 * ⚠️ IMPORTANTE: Este servicio usa la ARQUITECTURA MODERNA recomendada por NestJS 2025.
 *
 * 📋 STACK TECNOLÓGICO ACTUAL:
 * - @nestjs/cache-manager (NestJS 11+)
 * - cache-manager (v5+)
 * - @keyv/redis (adaptador Redis moderno)
 *
 * 🚫 NO USAR LIBRERÍAS OBSOLETAS:
 * - @liaoliaots/nestjs-redis (DEPRECADO)
 * - nestjs-redis (OBSOLETO)
 * - ioredis directo (NO recomendado para NestJS)
 *
 * ✅ SIEMPRE USAR ESTA IMPLEMENTACIÓN para:
 * - Cache distribuido
 * - Sesiones de usuario
 * - Rate limiting
 * - Datos temporales
 * - Performance optimization
 *
 * 🎯 CONFIGURACIÓN: Ver app.module.ts líneas 64-76
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AppConfigService } from '../config/config.service';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly configService: AppConfigService,
  ) {}

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value) {
        this.logger.log(`Cache hit for key: ${key}`);
      } else {
        this.logger.log(`Cache miss for key: ${key}`);
      }
      return value;
    } catch (error) {
      this.logger.error(`Error getting cache for key ${key}`, error);
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const cacheTtl = ttl || this.configService.defaultCacheTtl;
      await this.cacheManager.set(key, value, cacheTtl * 1000); // Convertir a ms
      this.logger.log(`Cached data for key: ${key} (TTL: ${cacheTtl}s)`);
    } catch (error) {
      this.logger.error(`Error setting cache for key ${key}`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.log(`Deleted cache for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting cache for key ${key}`, error);
    }
  }

  async reset(): Promise<void> {
    try {
      // El método reset no existe en la nueva versión de cache-manager
      // Implementamos reset usando store.reset() si está disponible
      const store = (
        this.cacheManager as Cache & { store?: { reset?: () => Promise<void> } }
      ).store;
      if (store && typeof store.reset === 'function') {
        await store.reset();
      } else {
        this.logger.warn('Reset method not available in cache store');
      }
      this.logger.warn('All cache has been reset');
    } catch (error) {
      this.logger.error('Error resetting cache', error);
    }
  }

  // 🔥 MÉTODO HELPER PARA CACHE CON FUNCIÓN
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    try {
      // Intentar obtener del cache
      let value = await this.get<T>(key);

      if (value === undefined) {
        // Si no está en cache, ejecutar función y cachear resultado
        this.logger.log(`Executing function for cache key: ${key}`);
        value = await fn();
        await this.set(key, value, ttl);
      }

      return value;
    } catch (error) {
      this.logger.error(`Error in getOrSet for key ${key}`, error);
      // En caso de error, ejecutar función sin cache
      return await fn();
    }
  }
}
