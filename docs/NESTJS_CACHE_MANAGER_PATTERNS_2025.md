# 🚀 NestJS Cache Manager con @keyv/redis - Patrones y Mejores Prácticas 2025

> **Documentación completa** para implementar cache de manera correcta y eficiente en NestJS 11 con Redis

## 📋 Índice

1. [Configuración Base](#configuración-base)
2. [Patrones de Implementación](#patrones-de-implementación)
3. [Estrategias de Cache](#estrategias-de-cache)
4. [Invalidación de Cache](#invalidación-de-cache)
5. [Manejo de Errores](#manejo-de-errores)
6. [Convenciones y Naming](#convenciones-y-naming)
7. [Services Completos](#services-completos)
8. [Interceptors Personalizados](#interceptors-personalizados)
9. [TTL y Performance](#ttl-y-performance)
10. [Ejemplos Prácticos](#ejemplos-prácticos)

---

## 🔧 Configuración Base

### 1. Instalación de Dependencias

```bash
# Con yarn workspace
yarn workspace api-nueva add @nestjs/cache-manager cache-manager @keyv/redis keyv

# Tipos para TypeScript
yarn workspace api-nueva add -D @types/cache-manager
```

### 2. Configuración en AppModule

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';
import { Keyv } from 'keyv';

@Module({
  imports: [
    // Configuración global de cache
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async (configService: AppConfigService) => ({
        stores: [
          new KeyvRedis(configService.redisUrl), // Redis como store principal
        ],
        ttl: configService.cacheTtl * 1000, // TTL en milisegundos (NestJS 11)
        max: 1000, // Máximo elementos en cache
      }),
      inject: [AppConfigService],
    }),
  ],
})
export class AppModule {}
```

### 3. Configuración Avanzada con Múltiples Stores

```typescript
// Para casos donde necesites múltiples stores
CacheModule.registerAsync({
  isGlobal: true,
  useFactory: async (configService: AppConfigService) => ({
    stores: [
      // Store principal Redis
      new KeyvRedis(configService.redisUrl),
      // Store en memoria como fallback
      new Keyv({ store: new Map() }),
    ],
    ttl: configService.cacheTtl * 1000,
    max: 1000,
  }),
  inject: [AppConfigService],
})
```

---

## 🎯 Patrones de Implementación

### 1. Cache-Aside Pattern (Manual) - RECOMENDADO

**Cuándo usar:** Operaciones CRUD complejas, control fino del cache

```typescript
@Injectable()
export class ArticleService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    @InjectModel(Article.name) private articleModel: Model<Article>,
  ) {}

  // READ: Buscar en cache primero, luego en DB
  async findById(id: string): Promise<Article> {
    const cacheKey = `article:${id}`;

    // 1. Intentar obtener del cache
    const cached = await this.cache.get<Article>(cacheKey);
    if (cached) {
      return cached;
    }

    // 2. Si no está en cache, buscar en MongoDB
    const article = await this.articleModel.findById(id);
    if (!article) {
      throw new NotFoundException(`Article ${id} not found`);
    }

    // 3. Guardar en cache para futuras consultas
    await this.cache.set(cacheKey, article, 300000); // 5 minutos
    return article;
  }

  // CREATE: Guardar en DB y cache
  async create(createArticleDto: CreateArticleDto): Promise<Article> {
    // 1. Crear en MongoDB
    const article = await this.articleModel.create(createArticleDto);

    // 2. Guardar en cache inmediatamente
    const cacheKey = `article:${article._id}`;
    await this.cache.set(cacheKey, article, 300000);

    // 3. Invalidar listas relacionadas
    await this.invalidateListCaches(article.categoryId);

    return article;
  }

  // UPDATE: Actualizar DB y cache
  async update(id: string, updateDto: UpdateArticleDto): Promise<Article> {
    // 1. Actualizar en MongoDB
    const article = await this.articleModel.findByIdAndUpdate(
      id,
      updateDto,
      { new: true }
    );

    if (!article) {
      throw new NotFoundException(`Article ${id} not found`);
    }

    // 2. Actualizar cache específico
    const cacheKey = `article:${id}`;
    await this.cache.set(cacheKey, article, 300000);

    // 3. Invalidar listas relacionadas
    await this.invalidateListCaches(article.categoryId);

    return article;
  }

  // DELETE: Eliminar de DB y cache
  async delete(id: string): Promise<void> {
    // 1. Obtener artículo antes de eliminar (para invalidar cache)
    const article = await this.articleModel.findById(id);
    if (!article) {
      throw new NotFoundException(`Article ${id} not found`);
    }

    // 2. Eliminar de MongoDB
    await this.articleModel.findByIdAndDelete(id);

    // 3. Eliminar del cache
    await this.cache.del(`article:${id}`);

    // 4. Invalidar listas relacionadas
    await this.invalidateListCaches(article.categoryId);
  }

  private async invalidateListCaches(categoryId: string): Promise<void> {
    const keysToInvalidate = [
      'articles:recent',
      'articles:trending',
      `articles:category:${categoryId}`,
    ];

    await Promise.all(
      keysToInvalidate.map(key => this.cache.del(key))
    );
  }
}
```

### 2. Interceptor Automático - Para Endpoints Simples

**Cuándo usar:** Endpoints GET simples sin lógica compleja

```typescript
@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  // Cache automático para listado general
  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(180000) // 3 minutos en milisegundos
  @CacheKey('articles:all')
  async findAll(@Query() query: PaginationDto) {
    return this.articleService.findAll(query);
  }

  // Cache automático por ID
  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000) // 5 minutos
  async findOne(@Param('id') id: string) {
    return this.articleService.findById(id);
  }

  // NO usar interceptor para operaciones de escritura
  @Post()
  async create(@Body() createDto: CreateArticleDto) {
    return this.articleService.create(createDto);
  }
}
```

---

## 🔄 Estrategias de Cache

### 1. Cache Helper Service

```typescript
@Injectable()
export class CacheHelperService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  // Patrón getOrSet para cache-aside
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = 300000,
  ): Promise<T> {
    try {
      // Intentar obtener del cache
      const cached = await this.cache.get<T>(key);
      if (cached !== undefined) {
        return cached;
      }

      // Si no está en cache, ejecutar factory function
      const fresh = await factory();

      // Guardar en cache
      await this.cache.set(key, fresh, ttl);
      return fresh;
    } catch (error) {
      // En caso de error de cache, ejecutar factory sin cache
      return await factory();
    }
  }

  // Cache con refresh automático
  async getOrRefresh<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = 300000,
    refreshThreshold: number = 0.8, // Refresh cuando quede 20% del TTL
  ): Promise<T> {
    const cached = await this.cache.get<T>(key);

    if (cached) {
      // Verificar si necesita refresh (opcional: implementar con TTL restante)
      return cached;
    }

    const fresh = await factory();
    await this.cache.set(key, fresh, ttl);
    return fresh;
  }
}
```

### 2. Cache con Versioning

```typescript
@Injectable()
export class VersionedCacheService {
  private readonly CACHE_VERSION = 'v1';

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  private getVersionedKey(key: string): string {
    return `${this.CACHE_VERSION}:${key}`;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const versionedKey = this.getVersionedKey(key);
    await this.cache.set(versionedKey, value, ttl);
  }

  async get<T>(key: string): Promise<T | undefined> {
    const versionedKey = this.getVersionedKey(key);
    return this.cache.get<T>(versionedKey);
  }

  async del(key: string): Promise<void> {
    const versionedKey = this.getVersionedKey(key);
    await this.cache.del(versionedKey);
  }

  // Método para limpiar versiones anteriores
  async clearOldVersions(): Promise<void> {
    // Implementar lógica para limpiar versiones anteriores
    // Requiere acceso directo a Redis para escanear keys
  }
}
```

---

## 🗑️ Invalidación de Cache

### 1. Service de Invalidación

```typescript
@Injectable()
export class CacheInvalidationService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  // Invalidación específica por artículo
  async invalidateArticle(articleId: string, categoryId?: string): Promise<void> {
    const keysToInvalidate = [
      `article:${articleId}`,
      'articles:recent',
      'articles:trending',
      'articles:featured',
    ];

    // Agregar invalidación por categoría si se proporciona
    if (categoryId) {
      keysToInvalidate.push(`articles:category:${categoryId}`);
      keysToInvalidate.push(`category:${categoryId}:count`);
    }

    // Invalidar todas las keys en paralelo
    await Promise.all(
      keysToInvalidate.map(key => this.cache.del(key))
    );
  }

  // Invalidación por usuario
  async invalidateUser(userId: string): Promise<void> {
    const userKeys = [
      `user:${userId}`,
      `user:${userId}:profile`,
      `user:${userId}:preferences`,
      `user:${userId}:articles`,
      `user:${userId}:favorites`,
    ];

    await Promise.all(userKeys.map(key => this.cache.del(key)));
  }

  // Invalidación por patrón (requiere implementación específica con Redis)
  async invalidateByPattern(pattern: string): Promise<void> {
    // Nota: Esto requiere acceso directo a Redis client para SCAN
    // Se implementaría con ioredis directamente
    console.warn('Pattern invalidation not implemented with cache-manager');
  }

  // Invalidación masiva por tags
  async invalidateByTags(tags: string[]): Promise<void> {
    const keysToInvalidate: string[] = [];

    for (const tag of tags) {
      switch (tag) {
        case 'articles':
          keysToInvalidate.push(
            'articles:recent',
            'articles:trending',
            'articles:featured'
          );
          break;
        case 'users':
          // Implementar según necesidades
          break;
        case 'categories':
          keysToInvalidate.push('categories:all');
          break;
      }
    }

    await Promise.all(keysToInvalidate.map(key => this.cache.del(key)));
  }
}
```

### 2. Decorator para Invalidación Automática

```typescript
// Decorator personalizado para invalidar cache automáticamente
export function InvalidateCache(...keys: string[]) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Ejecutar método original
      const result = await method.apply(this, args);

      // Invalidar cache después de la operación
      const cacheManager = this.cache || this.cacheManager;
      if (cacheManager) {
        await Promise.all(keys.map(key => cacheManager.del(key)));
      }

      return result;
    };
  };
}

// Uso del decorator
@Injectable()
export class ArticleService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  @InvalidateCache('articles:recent', 'articles:trending')
  async create(createDto: CreateArticleDto): Promise<Article> {
    return this.articleModel.create(createDto);
  }
}
```

---

## 🛡️ Manejo de Errores

### 1. Service Resiliente

```typescript
@Injectable()
export class ResilientCacheService {
  private readonly logger = new Logger(ResilientCacheService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async getWithFallback<T>(
    key: string,
    fallbackFn: () => Promise<T>,
    ttl: number = 300000,
  ): Promise<T> {
    try {
      // Intentar obtener del cache
      const cached = await this.cache.get<T>(key);
      if (cached !== undefined) {
        return cached;
      }
    } catch (error) {
      this.logger.warn(`Cache read failed for key ${key}:`, error.message);
    }

    // Fallback a la fuente original
    const data = await fallbackFn();

    // Intentar guardar en cache (sin bloquear si falla)
    this.setWithoutBlocking(key, data, ttl);

    return data;
  }

  private async setWithoutBlocking<T>(
    key: string,
    value: T,
    ttl: number
  ): Promise<void> {
    try {
      await this.cache.set(key, value, ttl);
    } catch (error) {
      this.logger.warn(`Cache write failed for key ${key}:`, error.message);
      // No re-throw, permitir que la aplicación continúe
    }
  }

  async safeDelete(key: string): Promise<boolean> {
    try {
      await this.cache.del(key);
      return true;
    } catch (error) {
      this.logger.warn(`Cache delete failed for key ${key}:`, error.message);
      return false;
    }
  }

  // Retry con backoff exponencial
  async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt - 1);
        this.logger.warn(
          `Operation failed, attempt ${attempt}/${maxRetries}. Retrying in ${delay}ms`,
          error.message
        );

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}
```

---

## 🏷️ Convenciones y Naming

### 1. Cache Key Builder

```typescript
export class CacheKeys {
  // Entidades individuales
  static article(id: string): string {
    return `article:${id}`;
  }

  static user(id: string): string {
    return `user:${id}`;
  }

  static category(id: string): string {
    return `category:${id}`;
  }

  // Listas y colecciones
  static articlesByCategory(categoryId: string, page: number = 1, limit: number = 10): string {
    return `articles:category:${categoryId}:page:${page}:limit:${limit}`;
  }

  static recentArticles(page: number = 1): string {
    return `articles:recent:page:${page}`;
  }

  static trendingArticles(period: 'daily' | 'weekly' | 'monthly' = 'daily'): string {
    const date = new Date().toISOString().split('T')[0];
    return `articles:trending:${period}:${date}`;
  }

  // Perfil de usuario
  static userProfile(userId: string): string {
    return `user:profile:${userId}`;
  }

  static userPreferences(userId: string): string {
    return `user:preferences:${userId}`;
  }

  static userArticles(userId: string, page: number = 1): string {
    return `user:${userId}:articles:page:${page}`;
  }

  // Búsquedas
  static search(query: string, filters: Record<string, any> = {}): string {
    // Normalizar query
    const normalizedQuery = encodeURIComponent(query.toLowerCase().trim());

    // Ordenar filtros para consistencia
    const sortedFilters = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');

    return `search:${normalizedQuery}:${sortedFilters}`;
  }

  // Estadísticas y contadores
  static categoryCount(categoryId: string): string {
    return `category:${categoryId}:count`;
  }

  static dailyStats(date: string = new Date().toISOString().split('T')[0]): string {
    return `stats:daily:${date}`;
  }

  // Configuración y metadata
  static appConfig(key: string): string {
    return `config:${key}`;
  }

  static metadata(type: string, id: string): string {
    return `metadata:${type}:${id}`;
  }
}
```

### 2. TTL Constants

```typescript
export const CacheTTL = {
  // Datos estáticos (24 horas)
  STATIC: 24 * 60 * 60 * 1000,

  // Datos semi-estáticos (6 horas)
  SEMI_STATIC: 6 * 60 * 60 * 1000,

  // Datos dinámicos (1 hora)
  DYNAMIC: 60 * 60 * 1000,

  // Datos frecuentes (15 minutos)
  FREQUENT: 15 * 60 * 1000,

  // Datos en tiempo real (5 minutos)
  REALTIME: 5 * 60 * 1000,

  // Datos temporales (1 minuto)
  TEMPORARY: 60 * 1000,

  // Por tipo de contenido
  ARTICLE: 5 * 60 * 1000,        // 5 minutos
  USER_PROFILE: 15 * 60 * 1000,  // 15 minutos
  CATEGORY: 60 * 60 * 1000,      // 1 hora
  CONFIG: 24 * 60 * 60 * 1000,   // 24 horas
  SEARCH: 10 * 60 * 1000,        // 10 minutos
  STATS: 5 * 60 * 1000,          // 5 minutos
} as const;
```

---

## 🎯 Services Completos

### 1. Article Cache Service

```typescript
@Injectable()
export class ArticleCacheService {
  private readonly logger = new Logger(ArticleCacheService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly resilientCache: ResilientCacheService,
    private readonly invalidation: CacheInvalidationService,
  ) {}

  // Obtener artículo individual
  async getArticle(id: string): Promise<Article | null> {
    const key = CacheKeys.article(id);

    return this.resilientCache.getWithFallback(
      key,
      async () => {
        // Fallback a base de datos
        return null; // Service específico debe manejar DB query
      },
      CacheTTL.ARTICLE,
    );
  }

  // Cachear artículo
  async cacheArticle(article: Article): Promise<void> {
    const key = CacheKeys.article(article.id);
    await this.resilientCache.setWithoutBlocking(key, article, CacheTTL.ARTICLE);
  }

  // Obtener artículos por categoría
  async getArticlesByCategory(
    categoryId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<Article[]> {
    const key = CacheKeys.articlesByCategory(categoryId, page, limit);

    return this.resilientCache.getWithFallback(
      key,
      async () => {
        // Fallback a base de datos
        return [];
      },
      CacheTTL.DYNAMIC,
    );
  }

  // Cachear lista de artículos
  async cacheArticlesList(
    categoryId: string,
    page: number,
    limit: number,
    articles: Article[],
  ): Promise<void> {
    const key = CacheKeys.articlesByCategory(categoryId, page, limit);
    await this.resilientCache.setWithoutBlocking(key, articles, CacheTTL.DYNAMIC);
  }

  // Obtener artículos recientes
  async getRecentArticles(page: number = 1): Promise<Article[]> {
    const key = CacheKeys.recentArticles(page);

    return this.resilientCache.getWithFallback(
      key,
      async () => [],
      CacheTTL.FREQUENT,
    );
  }

  // Invalidar cache relacionado con artículo
  async invalidateArticleCache(articleId: string, categoryId?: string): Promise<void> {
    await this.invalidation.invalidateArticle(articleId, categoryId);
  }

  // Limpiar todos los cache de artículos
  async clearAllArticleCache(): Promise<void> {
    await this.invalidation.invalidateByTags(['articles']);
  }
}
```

### 2. User Cache Service

```typescript
@Injectable()
export class UserCacheService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly resilientCache: ResilientCacheService,
  ) {}

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const key = CacheKeys.userProfile(userId);

    return this.resilientCache.getWithFallback(
      key,
      async () => null,
      CacheTTL.USER_PROFILE,
    );
  }

  async cacheUserProfile(userId: string, profile: UserProfile): Promise<void> {
    const key = CacheKeys.userProfile(userId);
    await this.resilientCache.setWithoutBlocking(key, profile, CacheTTL.USER_PROFILE);
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const key = CacheKeys.userPreferences(userId);

    return this.resilientCache.getWithFallback(
      key,
      async () => null,
      CacheTTL.SEMI_STATIC,
    );
  }

  async invalidateUserCache(userId: string): Promise<void> {
    const keys = [
      CacheKeys.userProfile(userId),
      CacheKeys.userPreferences(userId),
      CacheKeys.userArticles(userId),
    ];

    await Promise.all(keys.map(key => this.resilientCache.safeDelete(key)));
  }
}
```

---

## 🎛️ Interceptors Personalizados

### 1. Smart Cache Interceptor

```typescript
@Injectable()
export class SmartCacheInterceptor implements NestInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();

    // Solo cachear GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    // Generar cache key dinámico
    const cacheKey = this.generateCacheKey(request, handler);
    const ttl = this.reflector.get<number>('cache_ttl', handler) || CacheTTL.DYNAMIC;

    try {
      const cached = await this.cache.get(cacheKey);
      if (cached !== undefined) {
        return of(cached);
      }
    } catch (error) {
      console.warn('Cache read failed:', error);
    }

    return next.handle().pipe(
      tap(async (response) => {
        try {
          await this.cache.set(cacheKey, response, ttl);
        } catch (error) {
          console.warn('Cache write failed:', error);
        }
      }),
    );
  }

  private generateCacheKey(request: any, handler: Function): string {
    const { url, query, user, params } = request;

    // Incluir user ID si está autenticado
    const userKey = user?.id || 'anonymous';

    // Normalizar query parameters
    const normalizedQuery = this.normalizeQuery(query);

    // Incluir params de la ruta
    const normalizedParams = this.normalizeQuery(params);

    return `${userKey}:${url}:${normalizedQuery}:${normalizedParams}`;
  }

  private normalizeQuery(obj: Record<string, any>): string {
    if (!obj || Object.keys(obj).length === 0) return '';

    return Object.entries(obj)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
  }
}
```

### 2. Conditional Cache Interceptor

```typescript
@Injectable()
export class ConditionalCacheInterceptor implements NestInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();

    // Verificar si el caching está habilitado para este endpoint
    const cacheEnabled = this.reflector.get<boolean>('cache_enabled', handler) ?? true;
    const skipCache = request.headers['x-skip-cache'] === 'true';

    if (!cacheEnabled || skipCache || request.method !== 'GET') {
      return next.handle();
    }

    // Verificar condiciones específicas
    const cacheCondition = this.reflector.get<Function>('cache_condition', handler);
    if (cacheCondition && !cacheCondition(request)) {
      return next.handle();
    }

    const cacheKey = this.generateCacheKey(request);
    const ttl = this.reflector.get<number>('cache_ttl', handler) || CacheTTL.DYNAMIC;

    try {
      const cached = await this.cache.get(cacheKey);
      if (cached !== undefined) {
        return of(cached);
      }
    } catch (error) {
      console.warn('Cache read failed:', error);
    }

    return next.handle().pipe(
      tap(async (response) => {
        // Solo cachear respuestas exitosas
        if (response && !response.error) {
          try {
            await this.cache.set(cacheKey, response, ttl);
          } catch (error) {
            console.warn('Cache write failed:', error);
          }
        }
      }),
    );
  }

  private generateCacheKey(request: any): string {
    // Implementación similar al SmartCacheInterceptor
    return `conditional:${request.url}:${JSON.stringify(request.query)}`;
  }
}
```

---

## ⚡ TTL y Performance

### 1. Dynamic TTL Service

```typescript
@Injectable()
export class DynamicTTLService {
  // TTL basado en tipo de contenido
  getTTLByContentType(contentType: string): number {
    const ttlMap: Record<string, number> = {
      'article': CacheTTL.ARTICLE,
      'user_profile': CacheTTL.USER_PROFILE,
      'category': CacheTTL.CATEGORY,
      'search': CacheTTL.SEARCH,
      'config': CacheTTL.CONFIG,
      'stats': CacheTTL.STATS,
    };

    return ttlMap[contentType] || CacheTTL.DYNAMIC;
  }

  // TTL basado en popularidad del contenido
  getTTLByPopularity(viewCount: number): number {
    if (viewCount > 10000) return CacheTTL.STATIC;      // Muy popular
    if (viewCount > 1000) return CacheTTL.SEMI_STATIC;  // Popular
    if (viewCount > 100) return CacheTTL.DYNAMIC;       // Moderado
    return CacheTTL.FREQUENT;                           // Poco popular
  }

  // TTL basado en tiempo de creación
  getTTLByAge(createdAt: Date): number {
    const ageInHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

    if (ageInHours < 1) return CacheTTL.TEMPORARY;      // Muy reciente
    if (ageInHours < 24) return CacheTTL.FREQUENT;      // Reciente
    if (ageInHours < 168) return CacheTTL.DYNAMIC;      // Esta semana
    return CacheTTL.STATIC;                             // Antiguo
  }

  // TTL combinado inteligente
  getSmartTTL(
    contentType: string,
    viewCount: number = 0,
    createdAt?: Date,
  ): number {
    const baseTTL = this.getTTLByContentType(contentType);
    const popularityTTL = this.getTTLByPopularity(viewCount);
    const ageTTL = createdAt ? this.getTTLByAge(createdAt) : baseTTL;

    // Usar el TTL más largo (más cache para contenido popular/estable)
    return Math.max(baseTTL, popularityTTL, ageTTL);
  }
}
```

### 2. Cache Warming Service

```typescript
@Injectable()
export class CacheWarmingService {
  private readonly logger = new Logger(CacheWarmingService.name);

  constructor(
    private readonly articleCache: ArticleCacheService,
    private readonly userCache: UserCacheService,
  ) {}

  // Calentar cache de artículos populares
  async warmPopularArticles(): Promise<void> {
    try {
      // Obtener artículos populares de la DB
      const popularArticles = await this.getPopularArticlesFromDB();

      // Cachear cada artículo
      for (const article of popularArticles) {
        await this.articleCache.cacheArticle(article);
      }

      this.logger.log(`Warmed cache for ${popularArticles.length} popular articles`);
    } catch (error) {
      this.logger.error('Failed to warm popular articles cache', error);
    }
  }

  // Calentar cache de categorías
  async warmCategories(): Promise<void> {
    try {
      const categories = await this.getCategoriesFromDB();

      for (const category of categories) {
        // Cachear artículos recientes por categoría
        const recentArticles = await this.getRecentArticlesByCategoryFromDB(category.id);
        await this.articleCache.cacheArticlesList(category.id, 1, 10, recentArticles);
      }

      this.logger.log(`Warmed cache for ${categories.length} categories`);
    } catch (error) {
      this.logger.error('Failed to warm categories cache', error);
    }
  }

  // Ejecutar warming completo
  async performFullWarmup(): Promise<void> {
    const startTime = Date.now();

    await Promise.all([
      this.warmPopularArticles(),
      this.warmCategories(),
    ]);

    const duration = Date.now() - startTime;
    this.logger.log(`Cache warming completed in ${duration}ms`);
  }

  // Métodos privados para acceso a DB (implementar según tu modelo)
  private async getPopularArticlesFromDB(): Promise<Article[]> {
    // Implementar query a MongoDB
    return [];
  }

  private async getCategoriesFromDB(): Promise<Category[]> {
    // Implementar query a MongoDB
    return [];
  }

  private async getRecentArticlesByCategoryFromDB(categoryId: string): Promise<Article[]> {
    // Implementar query a MongoDB
    return [];
  }
}
```

---

## 📝 Ejemplos Prácticos

### 1. Controller Completo con Cache

```typescript
@Controller('articles')
@ApiTags('Articles')
export class ArticleController {
  constructor(
    private readonly articleService: ArticleService,
    private readonly articleCache: ArticleCacheService,
  ) {}

  // Listado con cache automático
  @Get()
  @UseInterceptors(SmartCacheInterceptor)
  @CacheTTL(CacheTTL.DYNAMIC)
  @ApiOperation({ summary: 'Get articles list' })
  async findAll(@Query() query: PaginationDto) {
    return this.articleService.findAll(query);
  }

  // Artículo individual con cache manual
  @Get(':id')
  @ApiOperation({ summary: 'Get article by ID' })
  async findOne(@Param('id') id: string) {
    // Intentar obtener del cache primero
    let article = await this.articleCache.getArticle(id);

    if (!article) {
      // Si no está en cache, obtener de la base de datos
      article = await this.articleService.findById(id);

      if (article) {
        // Cachear para futuras consultas
        await this.articleCache.cacheArticle(article);
      }
    }

    return article;
  }

  // Crear artículo (invalidar cache relacionado)
  @Post()
  @ApiOperation({ summary: 'Create new article' })
  async create(@Body() createDto: CreateArticleDto) {
    const article = await this.articleService.create(createDto);

    // Cachear el nuevo artículo
    await this.articleCache.cacheArticle(article);

    // Invalidar listas relacionadas
    await this.articleCache.invalidateArticleCache(article.id, article.categoryId);

    return article;
  }

  // Actualizar artículo (invalidar y actualizar cache)
  @Put(':id')
  @ApiOperation({ summary: 'Update article' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateArticleDto) {
    const article = await this.articleService.update(id, updateDto);

    // Actualizar cache del artículo
    await this.articleCache.cacheArticle(article);

    // Invalidar listas relacionadas
    await this.articleCache.invalidateArticleCache(id, article.categoryId);

    return article;
  }

  // Eliminar artículo (invalidar cache)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete article' })
  async delete(@Param('id') id: string) {
    const article = await this.articleService.findById(id);
    await this.articleService.delete(id);

    // Invalidar todo el cache relacionado
    await this.articleCache.invalidateArticleCache(id, article?.categoryId);

    return { message: 'Article deleted successfully' };
  }

  // Endpoint para limpiar cache manualmente
  @Delete('cache/clear')
  @ApiOperation({ summary: 'Clear articles cache' })
  async clearCache() {
    await this.articleCache.clearAllArticleCache();
    return { message: 'Articles cache cleared successfully' };
  }
}
```

### 2. Service Completo con Cache Integrado

```typescript
@Injectable()
export class ArticleService {
  constructor(
    @InjectModel(Article.name) private articleModel: Model<Article>,
    private readonly articleCache: ArticleCacheService,
    private readonly dynamicTTL: DynamicTTLService,
  ) {}

  async findById(id: string): Promise<Article> {
    // Usar cache service helper
    return this.articleCache.getWithFallback(
      CacheKeys.article(id),
      async () => {
        const article = await this.articleModel.findById(id);
        if (!article) {
          throw new NotFoundException(`Article ${id} not found`);
        }
        return article;
      },
      CacheTTL.ARTICLE,
    );
  }

  async findAll(query: PaginationDto): Promise<PaginatedResult<Article>> {
    const { page = 1, limit = 10, category, search } = query;

    // Generar cache key específico para la consulta
    const cacheKey = search
      ? CacheKeys.search(search, { category, page, limit })
      : CacheKeys.articlesByCategory(category || 'all', page, limit);

    return this.articleCache.getWithFallback(
      cacheKey,
      async () => {
        // Query a MongoDB
        const filter: any = {};
        if (category) filter.categoryId = category;
        if (search) filter.$text = { $search: search };

        const total = await this.articleModel.countDocuments(filter);
        const articles = await this.articleModel
          .find(filter)
          .skip((page - 1) * limit)
          .limit(limit)
          .sort({ createdAt: -1 })
          .exec();

        return {
          data: articles,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        };
      },
      CacheTTL.DYNAMIC,
    );
  }

  async create(createDto: CreateArticleDto): Promise<Article> {
    const article = await this.articleModel.create(createDto);

    // Cachear inmediatamente con TTL inteligente
    const smartTTL = this.dynamicTTL.getSmartTTL('article', 0, article.createdAt);
    await this.articleCache.cacheArticle(article, smartTTL);

    // Invalidar listas relacionadas
    await this.articleCache.invalidateArticleCache(article.id, article.categoryId);

    return article;
  }

  async update(id: string, updateDto: UpdateArticleDto): Promise<Article> {
    const article = await this.articleModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();

    if (!article) {
      throw new NotFoundException(`Article ${id} not found`);
    }

    // Actualizar cache con TTL inteligente
    const smartTTL = this.dynamicTTL.getSmartTTL(
      'article',
      article.viewCount || 0,
      article.createdAt
    );
    await this.articleCache.cacheArticle(article, smartTTL);

    // Invalidar listas relacionadas
    await this.articleCache.invalidateArticleCache(id, article.categoryId);

    return article;
  }

  async incrementViewCount(id: string): Promise<void> {
    // Incrementar en MongoDB
    await this.articleModel.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } }
    );

    // Invalidar cache para forzar refresh con nuevo viewCount
    await this.articleCache.invalidateArticleCache(id);
  }
}
```

---

## 🎯 Resumen de Implementación

### 1. Checklist de Implementación

- [ ] **Configurar Cache Module** con `@keyv/redis`
- [ ] **Crear CacheKeys utility** para naming consistente
- [ ] **Implementar CacheHelperService** con métodos getOrSet
- [ ] **Crear services específicos** (ArticleCacheService, UserCacheService)
- [ ] **Implementar invalidación** automática en operaciones de escritura
- [ ] **Configurar interceptors** para endpoints GET simples
- [ ] **Añadir TTL dinámico** basado en contenido
- [ ] **Implementar manejo de errores** resiliente
- [ ] **Crear cache warming** para datos críticos
- [ ] **Añadir logging** para debugging y monitoreo

### 2. Patrones Recomendados por Caso de Uso

| Caso de Uso | Patrón Recomendado | TTL Sugerido |
|-------------|-------------------|---------------|
| Artículo individual | Cache-aside manual | 5 minutos |
| Lista de artículos | Interceptor automático | 3 minutos |
| Perfil de usuario | Cache-aside manual | 15 minutos |
| Configuración | Cache-aside manual | 24 horas |
| Búsquedas | Interceptor con key dinámica | 10 minutos |
| Estadísticas | Cache-aside con refresh | 5 minutos |

### 3. Notas Importantes

- **NestJS 11** usa TTL en **milisegundos** (no segundos)
- **`@keyv/redis`** es la forma oficial para Redis con NestJS 11
- **Cache-aside manual** para control fino, **interceptors** para simplicidad
- **Siempre manejar errores** de cache sin romper la funcionalidad
- **Invalidar cache relacionado** en operaciones de escritura
- **Usar logging** para debugging y monitoreo de performance

---

¡Listo para implementar cache de manera profesional en tu proyecto de Noticias Pachuca! 🚀