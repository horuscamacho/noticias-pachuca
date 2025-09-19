/**
 * 🔥 APP CONTROLLER - DEMOSTRACIÓN REDIS ARQUITECTURA MODERNA 2025
 *
 * ⚠️ IMPORTANTE: Este controller demuestra el uso CORRECTO de Redis en NestJS 2025.
 *
 * 📋 PATRON RECOMENDADO:
 * - Usar CacheService (inyección de dependencia)
 * - Usar CacheInterceptor para cache automático
 * - Usar @CacheTTL para configurar tiempo de vida
 *
 * 🚫 NO HACER:
 * - Importar ioredis directamente
 * - Usar @liaoliaots/nestjs-redis
 * - Crear conexiones Redis manuales
 *
 * ✅ SIEMPRE usar CacheService para CUALQUIER operación Redis nueva
 *
 * 🎯 EJEMPLOS DE USO: Ver endpoints /cache-test
 */

import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { AppService } from './app.service';
import { CacheService } from './services/cache.service';

@ApiTags('App')
@Controller()
@UseInterceptors(CacheInterceptor) // 🔥 Cache automático con interceptor
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly cacheService: CacheService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Saludo de bienvenida con información de cache',
    description: 'Endpoint que demuestra la configuración de Redis y Mongoose',
  })
  @ApiResponse({
    status: 200,
    description: 'Información del sistema con estado de conexiones',
  })
  @CacheTTL(300) // 🔥 Cache por 5 minutos
  async getHello() {
    return await this.appService.getHello();
  }

  @Get('cache-test')
  @ApiOperation({
    summary: 'Prueba de Cache con Redis',
    description:
      'Endpoint para probar las funcionalidades de Cache Manager con Redis',
  })
  async testCache() {
    const data = {
      timestamp: new Date().toISOString(),
      message: 'Datos de prueba para cache con Redis',
      randomValue: Math.random(),
    };

    // Probar Cache Manager con Redis
    await this.cacheService.set('cache-test-key', data, 300);
    const cachedData = await this.cacheService.get('cache-test-key');

    // Probar función helper getOrSet
    const helperData = await this.cacheService.getOrSet(
      'helper-test-key',
      async () => ({
        message: 'Datos generados por función helper',
        timestamp: new Date().toISOString(),
        randomValue: Math.random(),
      }),
      300,
    );

    return {
      message: 'Cache test completed successfully',
      directCache: {
        stored: data,
        retrieved: cachedData,
      },
      helperFunction: {
        data: helperData,
      },
    };
  }

  @Get('config')
  @ApiOperation({
    summary: 'Configuración de la aplicación',
    description: 'Devuelve la configuración actual sin datos sensibles',
  })
  async getConfig() {
    return await this.appService.getConfig();
  }
}
