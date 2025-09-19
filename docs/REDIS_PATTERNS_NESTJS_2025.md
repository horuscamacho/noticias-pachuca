# 🔴 REDIS PATTERNS & CACHING STRATEGIES - NESTJS 2025

## 🎯 CONTEXTO DEL PROYECTO

### Configuración Actual ✅
```typescript
// packages/api-nueva/src/app.module.ts - YA CONFIGURADO
CacheModule.registerAsync({
  isGlobal: true,
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    stores: [
      new KeyvRedis(configService.get<string>('config.redis.url')),
    ],
    ttl: (configService.get<number>('config.cache.ttl') || 600) * 1000, // 10 min default
    max: 1000, // Máximo elementos en cache
  }),
  inject: [ConfigService],
})
```

### Variables de Entorno
```env
# packages/api-nueva/.env
REDIS_URL=redis://localhost:6379
CACHE_TTL=600  # segundos (10 minutos)
```

---

## 📚 PATRONES DE CACHE EN CONTROLLERS

### **Pattern 1: Cache Interceptor Automático**
```typescript
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';

@Controller('news')
export class NewsController {

  // 🔥 AUTOMÁTICO: NestJS cachea automáticamente por URL + método
  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheKey('news_list')              // Key personalizada
  @CacheTTL(300000)                   // 5 minutos en milliseconds
  async findAll(@Query() filterDto: NewsFilterDto) {
    return this.newsService.findAllPaginated(filterDto);
  }

  // 🔥 AUTOMÁTICO: Cache por URL dinámica
  @Get('category/:category')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600000)                   // 10 minutos
  async findByCategory(@Param('category') category: string) {
    return this.newsService.findByCategory(category);
  }
}
```

**Ventajas:**
- ✅ Cero código de cache lógica
- ✅ Cache automático por URL
- ✅ TTL personalizable por endpoint

**Desventajas:**
- ❌ Dificil invalidación granular
- ❌ No funciona bien con query params complejos

---

### **Pattern 2: Cache Manual con Control Total**
```typescript
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Controller('news')
export class NewsController {
  constructor(
    private readonly newsService: NewsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const cacheKey = `news:${id}`;

    // 🔍 PASO 1: Verificar cache
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      console.log(`📦 Cache HIT para ${cacheKey}`);
      return cached;
    }

    // 🔍 PASO 2: Buscar en base de datos
    console.log(`💾 Cache MISS para ${cacheKey} - buscando en DB`);
    const news = await this.newsService.findOne(id);

    if (!news) {
      throw new NotFoundException('News not found');
    }

    // 🔍 PASO 3: Guardar en cache
    await this.cacheManager.set(cacheKey, news, 300000); // 5 min
    console.log(`💾 Cached ${cacheKey} por 5 minutos`);

    return news;
  }

  // 🔥 PATTERN: Cache con Query Parameters
  @Get()
  async findAll(@Query() filterDto: NewsFilterDto) {
    // Crear cache key basado en filtros
    const cacheKey = this.buildCacheKey('news_list', filterDto);

    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.newsService.findAllPaginated(filterDto);

    // Cache más corto para listas paginadas
    await this.cacheManager.set(cacheKey, result, 120000); // 2 min

    return result;
  }

  private buildCacheKey(prefix: string, filterDto: NewsFilterDto): string {
    const parts = [prefix];

    if (filterDto.category) parts.push(`cat:${filterDto.category}`);
    if (filterDto.published !== undefined) parts.push(`pub:${filterDto.published}`);
    if (filterDto.search) parts.push(`q:${filterDto.search.substring(0, 20)}`);

    parts.push(`p:${filterDto.page || 1}`);
    parts.push(`l:${filterDto.limit || 10}`);

    return parts.join(':');
  }
}
```

**Ventajas:**
- ✅ Control total sobre cache keys
- ✅ Invalidación granular
- ✅ Lógica personalizada

**Desventajas:**
- ❌ Más código para escribir
- ❌ Propenso a errores manuales

---

### **Pattern 3: Cache con Invalidación Inteligente**
```typescript
@Controller('news')
export class NewsController {
  constructor(
    private readonly newsService: NewsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateNewsDto) {
    // 🔍 PASO 1: Actualizar en DB
    const updatedNews = await this.newsService.update(id, updateDto);

    // 🔍 PASO 2: Invalidar caches relacionados
    await this.invalidateNewsCache(id, updatedNews);

    return updatedNews;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const news = await this.newsService.findOne(id);
    await this.newsService.remove(id);

    // Invalidar caches
    await this.invalidateNewsCache(id, news);

    return { message: 'News deleted successfully' };
  }

  // 🔥 MÉTODO CENTRAL DE INVALIDACIÓN
  private async invalidateNewsCache(newsId: string, news?: any): Promise<void> {
    const keysToDelete = [
      `news:${newsId}`,                    // Cache individual
      'news_list',                         // Lista general
      'popular_news',                      // Noticias populares
    ];

    // Invalidar por categorías si tenemos la info
    if (news?.categories) {
      news.categories.forEach(category => {
        keysToDelete.push(`news:category:${category}`);
      });
    }

    // Invalidar todas las páginas de listas (brutal pero efectivo)
    for (let page = 1; page <= 10; page++) {
      keysToDelete.push(`news_list:p:${page}`);
    }

    // Borrar todas las keys
    await Promise.all(
      keysToDelete.map(key => this.cacheManager.del(key))
    );

    console.log(`🗑️ Invalidated ${keysToDelete.length} cache keys`);
  }
}
```

---

## 🎛️ PATRONES DE CACHE EN SERVICES

### **Pattern 1: Cache-Aside Strategy**
```typescript
@Injectable()
export class NewsService {
  constructor(
    @InjectModel(Article.name) private articleModel: Model<ArticleDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  // 🔥 EXPENSIVE QUERY CON CACHE
  async findPopularNews(): Promise<Article[]> {
    const cacheKey = 'popular_news';

    // Verificar cache
    const cached = await this.cacheManager.get<Article[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Query costosa con agregaciones
    const popular = await this.articleModel.aggregate([
      { $match: { published: true } },
      { $addFields: {
          popularity: {
            $add: [
              { $multiply: ['$views', 1] },
              { $multiply: ['$likes', 3] },
              { $multiply: ['$comments', 2] }
            ]
          }
        }
      },
      { $sort: { popularity: -1, publishedAt: -1 } },
      { $limit: 10 },
      { $lookup: {
          from: 'users',
          localField: 'authorId',
          foreignField: '_id',
          as: 'author'
        }
      }
    ]);

    // Cache por 30 minutos (datos no críticos)
    await this.cacheManager.set(cacheKey, popular, 1800000);

    return popular;
  }

  // 🔥 CACHE CON WARMING AUTOMÁTICO
  async findTrendingNews(): Promise<Article[]> {
    const cacheKey = 'trending_news';

    const cached = await this.cacheManager.get<Article[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const trending = await this.calculateTrendingNews();

    // Cache por 15 minutos
    await this.cacheManager.set(cacheKey, trending, 900000);

    // 🔥 WARM CACHE: Pre-calcular para la próxima vez
    setTimeout(() => {
      this.warmTrendingCache();
    }, 840000); // 14 minutos - recalcular antes de que expire

    return trending;
  }

  private async warmTrendingCache(): Promise<void> {
    try {
      const trending = await this.calculateTrendingNews();
      await this.cacheManager.set('trending_news', trending, 900000);
      console.log('🔥 Cache warmed: trending_news');
    } catch (error) {
      console.error('❌ Error warming cache:', error);
    }
  }
}
```

### **Pattern 2: Multi-Level Cache Keys**
```typescript
@Injectable()
export class NewsService {
  constructor(
    @InjectModel(Article.name) private articleModel: Model<ArticleDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  // 🔥 CACHE JERÁRQUICO POR CATEGORÍA Y PÁGINA
  async findByCategory(category: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<Article>> {
    const cacheKey = `news:category:${category}:page:${page}:limit:${limit}`;

    const cached = await this.cacheManager.get<PaginatedResponse<Article>>(cacheKey);
    if (cached) {
      return cached;
    }

    // Usar el servicio de paginación
    const filter = { categories: category, published: true };
    const result = await this.paginationService.paginate(
      this.articleModel,
      { page, limit },
      filter,
      { sort: { publishedAt: -1 } }
    );

    // Cache por 10 minutos
    await this.cacheManager.set(cacheKey, result, 600000);

    return result;
  }

  // 🔥 CACHE CON FALLBACK STRATEGY
  async findRelatedNews(newsId: string): Promise<Article[]> {
    const primaryKey = `related:${newsId}`;
    const fallbackKey = `related:fallback`;

    // Intentar cache específico
    let related = await this.cacheManager.get<Article[]>(primaryKey);
    if (related) {
      return related;
    }

    try {
      // Buscar noticias relacionadas (query compleja)
      const news = await this.articleModel.findById(newsId);
      if (!news) return [];

      related = await this.articleModel
        .find({
          _id: { $ne: newsId },
          $or: [
            { categories: { $in: news.categories } },
            { tags: { $in: news.tags } }
          ],
          published: true
        })
        .sort({ publishedAt: -1 })
        .limit(5)
        .exec();

      // Cache específico por 1 hora
      await this.cacheManager.set(primaryKey, related, 3600000);

    } catch (error) {
      console.error('Error finding related news:', error);

      // Fallback: obtener noticias populares
      related = await this.cacheManager.get<Article[]>(fallbackKey);
      if (!related) {
        related = await this.findPopularNews();
        await this.cacheManager.set(fallbackKey, related.slice(0, 5), 1800000);
      }
    }

    return related;
  }
}
```

---

## ⚡ CACHE PERFORMANCE PATTERNS

### **Pattern 1: Background Cache Refresh**
```typescript
@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  // 🔥 REFRESH CACHE SIN BLOQUEAR REQUEST
  async getWithBackgroundRefresh<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 600000,
    refreshThreshold: number = 0.8 // Refresh al 80% del TTL
  ): Promise<T> {

    const cached = await this.cacheManager.get<{
      data: T;
      timestamp: number;
      ttl: number;
    }>(key);

    if (cached) {
      const age = Date.now() - cached.timestamp;
      const shouldRefresh = age > (cached.ttl * refreshThreshold);

      if (shouldRefresh) {
        // 🔥 REFRESH EN BACKGROUND - no bloquear
        setImmediate(async () => {
          try {
            const fresh = await fetcher();
            await this.cacheManager.set(key, {
              data: fresh,
              timestamp: Date.now(),
              ttl
            }, ttl);
            console.log(`🔄 Background refreshed: ${key}`);
          } catch (error) {
            console.error(`❌ Background refresh failed for ${key}:`, error);
          }
        });
      }

      return cached.data;
    }

    // No hay cache, fetch sync
    const data = await fetcher();
    await this.cacheManager.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    }, ttl);

    return data;
  }
}
```

### **Pattern 2: Circuit Breaker Pattern**
```typescript
@Injectable()
export class CacheService {
  private circuitBreaker = new Map<string, {
    failures: number;
    lastFailure: number;
    isOpen: boolean;
  }>();

  // 🔥 CIRCUIT BREAKER PARA CACHE FAILURES
  async getWithCircuitBreaker<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 600000
  ): Promise<T> {

    const circuit = this.circuitBreaker.get(key) || {
      failures: 0,
      lastFailure: 0,
      isOpen: false
    };

    // Si el circuit está abierto, saltar cache
    if (circuit.isOpen) {
      const timeSinceLastFailure = Date.now() - circuit.lastFailure;
      if (timeSinceLastFailure < 60000) { // 1 minuto de cooldown
        console.log(`⚡ Circuit OPEN para ${key}, saltando cache`);
        return await fetcher();
      } else {
        // Reset circuit después del cooldown
        circuit.isOpen = false;
        circuit.failures = 0;
        this.circuitBreaker.set(key, circuit);
      }
    }

    try {
      // Intentar usar cache
      const cached = await this.cacheManager.get<T>(key);
      if (cached) {
        // Reset failures on success
        if (circuit.failures > 0) {
          circuit.failures = 0;
          this.circuitBreaker.set(key, circuit);
        }
        return cached;
      }

      // Fetch fresh data
      const data = await fetcher();

      try {
        await this.cacheManager.set(key, data, ttl);
      } catch (cacheError) {
        console.error(`❌ Cache SET failed for ${key}:`, cacheError);
        this.handleCircuitBreakerFailure(key, circuit);
      }

      return data;

    } catch (error) {
      console.error(`❌ Cache GET failed for ${key}:`, error);
      this.handleCircuitBreakerFailure(key, circuit);

      // Fallback: fetch sin cache
      return await fetcher();
    }
  }

  private handleCircuitBreakerFailure(key: string, circuit: any): void {
    circuit.failures++;
    circuit.lastFailure = Date.now();

    if (circuit.failures >= 3) {
      circuit.isOpen = true;
      console.log(`⚡ Circuit OPENED para ${key} después de ${circuit.failures} fallos`);
    }

    this.circuitBreaker.set(key, circuit);
  }
}
```

---

## 🎯 MEJORES PRÁCTICAS POR ENDPOINT

### **Noticias (High Traffic)**
```typescript
// TTL corto para datos frecuentes
@Get()
@UseInterceptors(CacheInterceptor)
@CacheTTL(120000) // 2 minutos
async findAllNews() { }

// TTL medio para noticias individuales
@Get(':id')
// Manual cache: 5 minutos
async findOneNews() { }
```

### **Categorías (Low Change)**
```typescript
// TTL largo para datos estáticos
@Get('categories')
@UseInterceptors(CacheInterceptor)
@CacheTTL(3600000) // 1 hora
async findAllCategories() { }
```

### **Analytics/Stats (Expensive)**
```typescript
// Background refresh + circuit breaker
@Get('analytics/popular')
async getPopularNews() {
  return this.cacheService.getWithBackgroundRefresh(
    'analytics:popular',
    () => this.analyticsService.calculatePopular(),
    1800000 // 30 minutos
  );
}
```

---

## 🛠️ DEBUGGING Y MONITORING

### **Cache Hit Rate Monitor**
```typescript
@Injectable()
export class CacheMonitorService {
  private stats = {
    hits: 0,
    misses: 0,
    errors: 0
  };

  logCacheHit(key: string): void {
    this.stats.hits++;
    console.log(`📦 CACHE HIT: ${key} | Hit Rate: ${this.getHitRate()}%`);
  }

  logCacheMiss(key: string): void {
    this.stats.misses++;
    console.log(`💾 CACHE MISS: ${key} | Hit Rate: ${this.getHitRate()}%`);
  }

  logCacheError(key: string, error: any): void {
    this.stats.errors++;
    console.error(`❌ CACHE ERROR: ${key}`, error);
  }

  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? Math.round((this.stats.hits / total) * 100) : 0;
  }

  getStats() {
    return { ...this.stats, hitRate: this.getHitRate() };
  }
}
```

### **Cache Debug Endpoint**
```typescript
@Controller('admin/cache')
export class CacheDebugController {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private cacheMonitor: CacheMonitorService
  ) {}

  @Get('stats')
  getCacheStats() {
    return this.cacheMonitor.getStats();
  }

  @Delete('clear/:pattern')
  async clearCache(@Param('pattern') pattern: string) {
    // Implementar clear por pattern
    console.log(`🗑️ Clearing cache pattern: ${pattern}`);
    // Esta funcionalidad depende del store específico
  }
}
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### **Setup Inicial** ✅
- [x] Configuración Redis en `app.module.ts`
- [x] Variables de entorno configuradas
- [ ] Service de cache utilities creado
- [ ] Patterns básicos implementados

### **Controllers**
- [ ] Cache interceptor en endpoints GET frecuentes
- [ ] Cache manual en endpoints complejos
- [ ] Invalidación en endpoints PUT/DELETE
- [ ] Cache keys consistentes y descriptivas

### **Services**
- [ ] Cache-aside pattern en queries costosas
- [ ] Background refresh para datos críticos
- [ ] Circuit breaker para robustez
- [ ] Multi-level cache keys

### **Monitoring**
- [ ] Cache hit rate logging
- [ ] Error tracking
- [ ] Performance metrics
- [ ] Debug endpoints para admin

---

**📅 Documento creado:** 16 Sept 2025
**🔄 Última actualización:** 16 Sept 2025
**👤 Contexto para:** Coyotito - Noticias Pachuca Project

**🎯 Objetivo:** Implementar caching inteligente para mejorar performance del API