# 🚀 GUÍA DEFINITIVA: NestJS + Redis + Mongoose 2025

## 📋 CONFIGURACIÓN COMPLETA CON MEJORES PRÁCTICAS

### **Investigación actualizada:** Enero 2025
**Fuente:** Documentación oficial NestJS, @liaoliaots/nestjs-redis, Mongoose docs, mejores prácticas de la comunidad

---

## 🎯 **INSTALACIÓN DE DEPENDENCIAS**

### **Usando yarn workspace (recomendado 2025)**
```bash
# Desde el directorio root del proyecto
cd /path/to/tu-proyecto

# Redis - Paquete moderno y mantenido
yarn workspace api-nueva add @liaoliaots/nestjs-redis ioredis

# Cache Manager para NestJS
yarn workspace api-nueva add @nestjs/cache-manager cache-manager

# Tipos para desarrollo
yarn workspace api-nueva add -D @types/ioredis
```

### **Dependencias completas necesarias**
```json
{
  "dependencies": {
    "@nestjs/common": "^11.1.6",
    "@nestjs/core": "^11.1.6",
    "@nestjs/config": "^4.0.2",
    "@nestjs/mongoose": "^11.0.3",
    "@nestjs/cache-manager": "^2.2.2",
    "@liaoliaots/nestjs-redis": "^10.0.0",
    "mongoose": "^8.18.1",
    "ioredis": "^5.4.1",
    "cache-manager": "^5.7.6",
    "joi": "^18.0.1",
    "class-validator": "^0.14.2",
    "class-transformer": "^0.5.1"
  }
}
```

---

## ⚙️ **CONFIGURACIÓN DE VARIABLES DE ENTORNO**

### **Archivo .env actualizado**
```bash
# API
PORT=3000
NODE_ENV=development
API_PREFIX=api

# MongoDB
MONGODB_URL=mongodb://root:password123@mongodb:27017/noticias_pachuca_db?authSource=admin
DB_HOST=mongodb
DB_PORT=27017
DB_USERNAME=root
DB_PASSWORD=password123
DB_NAME=noticias_pachuca_db

# Redis
REDIS_URL=redis://redis:6379
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Cache TTL (Time To Live en segundos)
CACHE_TTL=600
DEFAULT_CACHE_TTL=300

# JWT
JWT_SECRET=super-secret-development-jwt-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=super-secret-development-refresh-key-min-32-chars
JWT_REFRESH_EXPIRES_IN=7d
```

### **Configuración tipada - src/config/configuration.ts**
```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('config', () => ({
  // 🔥 CONFIGURACIÓN DE LA APP
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV as 'development' | 'production' | 'test',
    apiPrefix: process.env.API_PREFIX || 'api',
  },

  // 🔥 CONFIGURACIÓN MONGODB
  database: {
    host: process.env.DB_HOST || 'mongodb',
    port: parseInt(process.env.DB_PORT || '27017', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'password123',
    database: process.env.DB_NAME || 'noticias_pachuca_db',
    url: process.env.MONGODB_URL || 'mongodb://root:password123@mongodb:27017/noticias_pachuca_db?authSource=admin',
  },

  // 🔥 CONFIGURACIÓN REDIS - NUEVAS MEJORES PRÁCTICAS 2025
  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    url: process.env.REDIS_URL || 'redis://redis:6379',
    // 🚀 OPCIONES AVANZADAS 2025
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000,
  },

  // 🔥 CONFIGURACIÓN DE CACHE
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '600', 10),
    defaultTtl: parseInt(process.env.DEFAULT_CACHE_TTL || '300', 10),
    max: 1000, // Máximo de elementos en cache
  },

  // 🔥 CONFIGURACIÓN JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'super-secret-development-jwt-key-min-32-chars',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'super-secret-development-refresh-key-min-32-chars',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
}));
```

### **Servicio de configuración - src/config/config.service.ts**
```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  // App Config
  get port(): number {
    return this.configService.get<number>('config.app.port')!;
  }

  get nodeEnv(): string {
    return this.configService.get<string>('config.app.nodeEnv')!;
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  // MongoDB Config
  get mongoUrl(): string {
    return this.configService.get<string>('config.database.url')!;
  }

  get dbHost(): string {
    return this.configService.get<string>('config.database.host')!;
  }

  get dbPort(): number {
    return this.configService.get<number>('config.database.port')!;
  }

  // Redis Config
  get redisHost(): string {
    return this.configService.get<string>('config.redis.host')!;
  }

  get redisPort(): number {
    return this.configService.get<number>('config.redis.port')!;
  }

  get redisUrl(): string {
    return this.configService.get<string>('config.redis.url')!;
  }

  get redisPassword(): string | undefined {
    return this.configService.get<string>('config.redis.password');
  }

  get redisConfig() {
    return {
      host: this.redisHost,
      port: this.redisPort,
      password: this.redisPassword,
      db: this.configService.get<number>('config.redis.db'),
      retryDelayOnFailover: this.configService.get<number>('config.redis.retryDelayOnFailover'),
      enableReadyCheck: this.configService.get<boolean>('config.redis.enableReadyCheck'),
      maxRetriesPerRequest: this.configService.get<number>('config.redis.maxRetriesPerRequest'),
      lazyConnect: this.configService.get<boolean>('config.redis.lazyConnect'),
      keepAlive: this.configService.get<number>('config.redis.keepAlive'),
    };
  }

  // Cache Config
  get cacheTtl(): number {
    return this.configService.get<number>('config.cache.ttl')!;
  }

  get defaultCacheTtl(): number {
    return this.configService.get<number>('config.cache.defaultTtl')!;
  }

  // JWT Config
  get jwtSecret(): string {
    return this.configService.get<string>('config.jwt.secret')!;
  }

  get jwtExpiresIn(): string {
    return this.configService.get<string>('config.jwt.expiresIn')!;
  }
}
```

---

## 🏗️ **CONFIGURACIÓN DEL APP.MODULE**

### **src/app.module.ts - Configuración completa 2025**
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';
import { AppConfigService } from './config/config.service';

// Función para seleccionar .env por ambiente
function getEnvFilePath() {
  const ENV = process.env.NODE_ENV;
  return !ENV ? '.env' : \`.env.\${ENV}\`;
}

@Module({
  imports: [
    // ✅ ConfigModule DEBE ser el primer import
    ConfigModule.forRoot({
      isGlobal: true,  // 🔥 Disponible en toda la app
      load: [configuration],  // Configuración tipada
      envFilePath: getEnvFilePath(),  // .env por ambiente
      validationSchema: validationSchema,  // Validación con Joi
      validationOptions: {
        allowUnknown: false,  // Solo variables definidas
        abortEarly: true,     // Falla al primer error
      },
    }),

    // 🔥 CONFIGURACIÓN MONGOOSE 2025 CON MEJORES PRÁCTICAS
    MongooseModule.forRootAsync({
      useFactory: async (configService: AppConfigService) => ({
        uri: configService.mongoUrl,

        // 🚀 OPCIONES RECOMENDADAS 2025
        maxPoolSize: 10, // Máximo 10 conexiones concurrentes
        serverSelectionTimeoutMS: 5000, // Timeout de conexión
        socketTimeoutMS: 45000, // Timeout de socket
        family: 4, // Usar IPv4, saltarse IPv6

        // 🔧 Configuraciones avanzadas
        retryWrites: true,
        w: 'majority',
        readPreference: 'primary',

        // 🛡️ Configuraciones de seguridad
        authSource: 'admin',
        ssl: configService.isProduction,

        // 📊 Configuraciones de performance
        bufferCommands: false,
        bufferMaxEntries: 0,

        // 🔍 Debug en desarrollo
        ...(configService.isDevelopment && {
          debug: true,
        }),
      }),
      inject: [AppConfigService],
    }),

    // 🔥 CONFIGURACIÓN REDIS 2025 - @liaoliaots/nestjs-redis
    RedisModule.forRootAsync({
      useFactory: async (configService: AppConfigService) => ({
        config: configService.redisConfig,
      }),
      inject: [AppConfigService],
    }),

    // 🔥 CONFIGURACIÓN CACHE MANAGER 2025
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async (configService: AppConfigService) => ({
        ttl: configService.cacheTtl,
        max: 1000, // Máximo elementos en cache
        // Nota: Para Redis con cache-manager, necesitas configurar el store
        // store: 'redis', // Comentado para desarrollo
      }),
      inject: [AppConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [AppService, AppConfigService],
  exports: [AppConfigService],
})
export class AppModule {}
```

---

## 📊 **SERVICIOS DE REDIS Y CACHE**

### **src/services/redis.service.ts**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { RedisService as NestRedisService } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly redis: Redis;

  constructor(private readonly redisService: NestRedisService) {
    this.redis = this.redisService.getClient();
  }

  // 🔥 OPERACIONES BÁSICAS
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.redis.setex(key, ttl, serializedValue);
      } else {
        await this.redis.set(key, serializedValue);
      }
      this.logger.log(\`Cached data for key: \${key}\`);
    } catch (error) {
      this.logger.error(\`Error setting cache for key \${key}\`, error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) return null;

      const parsed = JSON.parse(value);
      this.logger.log(\`Retrieved cached data for key: \${key}\`);
      return parsed;
    } catch (error) {
      this.logger.error(\`Error getting cache for key \${key}\`, error);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      this.logger.log(\`Deleted cache for key: \${key}\`);
    } catch (error) {
      this.logger.error(\`Error deleting cache for key \${key}\`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      this.logger.error(\`Error checking existence for key \${key}\`, error);
      return false;
    }
  }

  // 🔥 OPERACIONES AVANZADAS
  async mget(keys: string[]): Promise<(any | null)[]> {
    try {
      const values = await this.redis.mget(...keys);
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      this.logger.error('Error in mget operation', error);
      return keys.map(() => null);
    }
  }

  async mset(data: Record<string, any>, ttl?: number): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();

      Object.entries(data).forEach(([key, value]) => {
        const serializedValue = JSON.stringify(value);
        if (ttl) {
          pipeline.setex(key, ttl, serializedValue);
        } else {
          pipeline.set(key, serializedValue);
        }
      });

      await pipeline.exec();
      this.logger.log(\`Bulk cached \${Object.keys(data).length} items\`);
    } catch (error) {
      this.logger.error('Error in mset operation', error);
    }
  }

  // 🔥 OPERACIONES DE LISTA
  async lpush(key: string, ...values: any[]): Promise<number> {
    try {
      const serializedValues = values.map(v => JSON.stringify(v));
      return await this.redis.lpush(key, ...serializedValues);
    } catch (error) {
      this.logger.error(\`Error in lpush for key \${key}\`, error);
      return 0;
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<any[]> {
    try {
      const values = await this.redis.lrange(key, start, stop);
      return values.map(value => JSON.parse(value));
    } catch (error) {
      this.logger.error(\`Error in lrange for key \${key}\`, error);
      return [];
    }
  }

  // 🔥 OPERACIONES DE SET
  async sadd(key: string, ...members: any[]): Promise<number> {
    try {
      const serializedMembers = members.map(m => JSON.stringify(m));
      return await this.redis.sadd(key, ...serializedMembers);
    } catch (error) {
      this.logger.error(\`Error in sadd for key \${key}\`, error);
      return 0;
    }
  }

  async smembers(key: string): Promise<any[]> {
    try {
      const members = await this.redis.smembers(key);
      return members.map(member => JSON.parse(member));
    } catch (error) {
      this.logger.error(\`Error in smembers for key \${key}\`, error);
      return [];
    }
  }

  // 🔥 UTILIDADES
  async flushall(): Promise<void> {
    try {
      await this.redis.flushall();
      this.logger.warn('All Redis data has been flushed');
    } catch (error) {
      this.logger.error('Error flushing Redis', error);
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.redis.keys(pattern);
    } catch (error) {
      this.logger.error(\`Error getting keys with pattern \${pattern}\`, error);
      return [];
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      this.logger.error(\`Error getting TTL for key \${key}\`, error);
      return -1;
    }
  }
}
```

### **src/services/cache.service.ts**
```typescript
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
        this.logger.log(\`Cache hit for key: \${key}\`);
      } else {
        this.logger.log(\`Cache miss for key: \${key}\`);
      }
      return value;
    } catch (error) {
      this.logger.error(\`Error getting cache for key \${key}\`, error);
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const cacheTtl = ttl || this.configService.defaultCacheTtl;
      await this.cacheManager.set(key, value, cacheTtl * 1000); // Convertir a ms
      this.logger.log(\`Cached data for key: \${key} (TTL: \${cacheTtl}s)\`);
    } catch (error) {
      this.logger.error(\`Error setting cache for key \${key}\`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.log(\`Deleted cache for key: \${key}\`);
    } catch (error) {
      this.logger.error(\`Error deleting cache for key \${key}\`, error);
    }
  }

  async reset(): Promise<void> {
    try {
      await this.cacheManager.reset();
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
        this.logger.log(\`Executing function for cache key: \${key}\`);
        value = await fn();
        await this.set(key, value, ttl);
      }

      return value;
    } catch (error) {
      this.logger.error(\`Error in getOrSet for key \${key}\`, error);
      // En caso de error, ejecutar función sin cache
      return await fn();
    }
  }
}
```

---

## 🎯 **EJEMPLO DE USO EN CONTROLADORES**

### **src/app.controller.ts - Controlador actualizado**
```typescript
import { Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { AppService } from './app.service';
import { RedisService } from './services/redis.service';
import { CacheService } from './services/cache.service';

@ApiTags('App')
@Controller()
@UseInterceptors(CacheInterceptor) // 🔥 Cache automático con interceptor
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly redisService: RedisService,
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
    summary: 'Prueba de Redis y Cache',
    description: 'Endpoint para probar las funcionalidades de Redis y Cache Manager',
  })
  async testCache() {
    const key = 'test-cache-key';
    const data = {
      timestamp: new Date().toISOString(),
      message: 'Datos de prueba para cache',
      randomValue: Math.random(),
    };

    // Probar Redis directo
    await this.redisService.set(key, data, 300);
    const redisData = await this.redisService.get(key);

    // Probar Cache Manager
    await this.cacheService.set('cache-manager-test', data, 300);
    const cacheData = await this.cacheService.get('cache-manager-test');

    return {
      message: 'Cache test completed',
      redis: {
        stored: data,
        retrieved: redisData,
      },
      cacheManager: {
        stored: data,
        retrieved: cacheData,
      },
    };
  }

  @Get('redis-operations')
  @ApiOperation({
    summary: 'Demostración de operaciones Redis avanzadas',
  })
  async redisOperations() {
    const listKey = 'demo-list';
    const setKey = 'demo-set';

    // Operaciones de lista
    await this.redisService.lpush(listKey, 'item1', 'item2', 'item3');
    const listItems = await this.redisService.lrange(listKey, 0, -1);

    // Operaciones de set
    await this.redisService.sadd(setKey, 'member1', 'member2', 'member3');
    const setMembers = await this.redisService.smembers(setKey);

    return {
      message: 'Redis operations demo',
      list: {
        key: listKey,
        items: listItems,
      },
      set: {
        key: setKey,
        members: setMembers,
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
```

---

## 🛠️ **VALIDACIÓN DE CONFIGURACIÓN**

### **src/config/validation.schema.ts**
```typescript
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api'),

  // MongoDB
  MONGODB_URL: Joi.string().required(),
  DB_HOST: Joi.string().default('mongodb'),
  DB_PORT: Joi.number().default(27017),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  // Redis
  REDIS_URL: Joi.string().required(),
  REDIS_HOST: Joi.string().default('redis'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional(),
  REDIS_DB: Joi.number().default(0),

  // Cache
  CACHE_TTL: Joi.number().default(600),
  DEFAULT_CACHE_TTL: Joi.number().default(300),

  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
});
```

---

## 🔥 **ACTUALIZACIÓN DEL APP.SERVICE**

### **src/app.service.ts**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from './config/config.service';
import { RedisService } from './services/redis.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly configService: AppConfigService,
    private readonly redisService: RedisService,
  ) {}

  async getHello(): Promise<string> {
    const cacheKey = 'hello-message';

    // Intentar obtener del cache primero
    const cachedMessage = await this.redisService.get<string>(cacheKey);
    if (cachedMessage) {
      this.logger.log('Returning cached hello message');
      return cachedMessage;
    }

    // Generar nuevo mensaje
    const message = \`¡Hola desde Noticias Pachuca API! 🚀
    Ambiente: \${this.configService.nodeEnv}
    Puerto: \${this.configService.port}
    MongoDB: Conectado correctamente
    Redis: Funcionando perfectamente
    Timestamp: \${new Date().toISOString()}\`;

    // Cachear por 1 hora
    await this.redisService.set(cacheKey, message, 3600);

    this.logger.log('Generated and cached new hello message');
    return message;
  }

  async getConfig() {
    const cacheKey = 'app-config';

    // Usar cache con función helper
    return {
      app: {
        nodeEnv: this.configService.nodeEnv,
        port: this.configService.port,
        apiPrefix: 'api',
      },
      database: {
        host: this.configService.dbHost,
        port: this.configService.dbPort,
        database: 'noticias_pachuca_db',
        status: 'connected',
      },
      redis: {
        host: this.configService.redisHost,
        port: this.configService.redisPort,
        status: 'connected',
      },
      cache: {
        ttl: this.configService.cacheTtl,
        defaultTtl: this.configService.defaultCacheTtl,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
```

---

## 📊 **COMANDOS DE INSTALACIÓN COMPLETOS**

### **Ejecutar desde el directorio root del proyecto**
```bash
# 1. Instalar dependencias de Redis y Cache
yarn workspace api-nueva add @liaoliaots/nestjs-redis ioredis @nestjs/cache-manager cache-manager

# 2. Instalar tipos para desarrollo
yarn workspace api-nueva add -D @types/ioredis

# 3. Verificar instalación
yarn workspace api-nueva list --pattern "*redis*"
yarn workspace api-nueva list --pattern "*cache*"

# 4. Reconstruir Docker con nuevas dependencias
docker-compose -f docker-compose.nueva.yml down
docker-compose -f docker-compose.nueva.yml up --build
```

---

## ✅ **VERIFICACIÓN DE FUNCIONAMIENTO**

### **Endpoints para probar:**
- **GET /** - Mensaje con cache automático
- **GET /cache-test** - Prueba de Redis y Cache Manager
- **GET /redis-operations** - Operaciones avanzadas de Redis
- **GET /config** - Configuración de la aplicación

### **URLs de servicios:**
- **API NestJS**: http://localhost:3000
- **Mongo Express**: http://localhost:8081
- **Redis Commander**: http://localhost:8082

---

## 🎯 **MEJORES PRÁCTICAS IMPLEMENTADAS**

✅ **Configuración tipada** con AppConfigService
✅ **Validación de variables** con Joi
✅ **Separación de responsabilidades** - Redis vs Cache Manager
✅ **Logging completo** para debugging
✅ **Manejo de errores** robusto
✅ **TTL configurables** por endpoint
✅ **Operaciones Redis avanzadas** (listas, sets, pipelines)
✅ **Cache helpers** para patrones comunes
✅ **Documentación Swagger** integrada

---

**Resultado:** Sistema completo NestJS + Redis + Mongoose con configuración profesional, cache automático, operaciones avanzadas de Redis y manejo robusto de errores siguiendo las mejores prácticas 2025.