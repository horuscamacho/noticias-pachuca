# 🏗️ ARQUITECTURA MOBILE & BACKEND 2025

## 🎯 RESUMEN EJECUTIVO

### Stack Tecnológico
- **Backend**: NestJS + MongoDB + Redis + TanStack Query compatibility
- **Mobile**: Expo SDK 54 + React Native 0.81.4 + TypeScript
- **Monorepo**: Tipos compartidos con `@noticias/shared`
- **HTTP Client**: Axios con middleware de auth automático
- **Estado**: Local state + TanStack Query para server state

---

## 📁 ARQUITECTURA DE DIRECTORIOS MOBILE

### Patrón: **Feature-First Architecture** (Screaming Architecture)

```
packages/mobile-expo/src/
├── 📁 features/                    # Funcionalidades por dominio
│   ├── 📁 auth/
│   │   ├── 📁 components/         # Componentes específicos de auth
│   │   ├── 📁 hooks/              # useAuth, useLogin, useRegister
│   │   ├── 📁 screens/            # LoginScreen, RegisterScreen
│   │   ├── 📁 services/           # auth.service.ts
│   │   ├── 📁 types/              # auth.types.ts (locales, no compartidos)
│   │   └── 📄 index.ts            # Public API de la feature
│   ├── 📁 news/
│   │   ├── 📁 components/         # NewsCard, NewsList
│   │   ├── 📁 hooks/              # useNews, useNewsDetail
│   │   ├── 📁 screens/            # NewsScreen, NewsDetailScreen
│   │   ├── 📁 services/           # news.service.ts
│   │   └── 📄 index.ts
│   ├── 📁 profile/
│   └── 📁 analytics/              # Feature de telemetría
├── 📁 shared/                      # Recursos compartidos entre features
│   ├── 📁 components/             # Componentes reutilizables
│   │   ├── 📁 ui/                # Button, Input, Card básicos
│   │   ├── 📁 forms/             # FormField, Validation wrappers
│   │   ├── 📁 navigation/        # CustomTabBar, HeaderComponents
│   │   └── 📁 feedback/          # Loading, Error, Toast
│   ├── 📁 hooks/                  # Hooks utilitarios globales
│   │   ├── 📄 useApi.ts          # Hook principal para APIs
│   │   ├── 📄 useAuth.ts         # Hook global de auth
│   │   ├── 📄 useTelemetry.ts    # Hook de analytics
│   │   └── 📄 useStorage.ts      # AsyncStorage wrapper
│   ├── 📁 services/               # Servicios base
│   │   ├── 📄 api.service.ts     # Axios instance configurada
│   │   ├── 📄 auth.service.ts    # Auth token management
│   │   ├── 📄 storage.service.ts # AsyncStorage wrapper
│   │   └── 📄 telemetry.service.ts # Analytics tracking
│   ├── 📁 utils/                  # Utilidades
│   │   ├── 📄 validators.ts      # Validaciones con zod
│   │   ├── 📄 formatters.ts      # Date, currency, text formatters
│   │   ├── 📄 constants.ts       # Constantes de la app
│   │   └── 📄 helpers.ts         # Funciones helper
│   ├── 📁 types/                  # Tipos NO compartidos con backend
│   │   ├── 📄 navigation.types.ts # React Navigation types
│   │   ├── 📄 component.types.ts  # Props de componentes
│   │   └── 📄 app.types.ts       # Estados de app específicos
│   └── 📁 constants/              # Configuraciones
│       ├── 📄 api.ts             # API_BASE_URL, timeouts
│       ├── 📄 theme.ts           # Colores, spacing, typography
│       └── 📄 config.ts          # Configuración de la app
├── 📁 mappers/                    # 🔥 DATA MAPPERS (clave para integridad)
│   ├── 📄 user.mapper.ts         # Backend User -> App User
│   ├── 📄 news.mapper.ts         # Backend Article -> App News
│   └── 📄 base.mapper.ts         # Mapper utilities
├── 📁 assets/                     # Recursos estáticos
│   ├── 📁 images/
│   ├── 📁 icons/
│   └── 📁 fonts/
└── 📄 App.tsx                     # Root component
```

---

## 🎯 NOMENCLATURAS Y CONVENCIONES

### **Archivos y Directorios**
```typescript
// ✅ Correcto
useAuthQuery.ts         // Hooks con "use" prefix
AuthService.ts          // Services con "Service" suffix
UserMapper.ts           // Mappers con "Mapper" suffix
LoginScreen.tsx         // Screens con "Screen" suffix
NewsCard.tsx            // Components PascalCase
auth.types.ts           // Types en lowercase
api.constants.ts        // Constants con namespace

// ❌ Incorrecto
authHook.ts
userService.js
loginComponent.tsx
AuthTypes.ts
```

### **Hooks Naming Convention**
```typescript
// Data fetching hooks
useNewsQuery()          // GET requests
useNewsListQuery()      // GET lists
useNewsMutation()       // POST/PUT/DELETE
useNewsInfiniteQuery()  // Infinite scroll

// Feature hooks
useAuth()               // Auth state management
useAuthToken()          // Token specific
useAuthLogin()          // Login flow specific

// Utility hooks
useLocalStorage()       // Storage operations
useTelemetry()          // Analytics tracking
usePermissions()        // Device permissions
```

### **Component Naming**
```typescript
// UI Components (shared/components/ui/)
<Button />
<Input />
<Card />
<LoadingSpinner />
<ErrorBoundary />

// Feature Components (features/*/components/)
<NewsCard />
<NewsListItem />
<AuthLoginForm />
<ProfileHeader />

// Screen Components (features/*/screens/)
<LoginScreen />
<NewsDetailScreen />
<ProfileEditScreen />
```

---

## 🔗 TIPOS COMPARTIDOS DEL MONOREPO

### **Configuración Actual**
```json
// packages/shared/package.json - YA CONFIGURADO ✅
{
  "name": "@noticias/shared",
  "dependencies": {
    "zod": "^3.22.4",           // Validaciones
    "date-fns": "^3.0.6"       // Manejo de fechas
  }
}
```

### **Tipos Disponibles** (desde `@noticias/shared`)
```typescript
// YA TENEMOS ESTOS TIPOS ✅
import {
  User,              // Usuario del sistema
  Article,           // Artículo/noticia
  Category,          // Categoría de noticias
  ApiResponse,       // Response wrapper estándar
  generateSlug,      // Utility para slugs
  formatDate,        // Utility para fechas
  z                  // Zod para validaciones
} from '@noticias/shared';

// AGREGAR ESTOS TIPOS NUEVOS 🆕
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface TelemetryData {
  deviceInfo: DeviceInfo;
  networkInfo: NetworkInfo;
  performance: PerformanceMetrics;
  userSession: SessionInfo;
}
```

---

## 🌐 AXIOS HELPER CON AUTH MIDDLEWARE

### **Configuración Base**
```typescript
// packages/mobile-expo/src/shared/services/api.service.ts

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { AuthService } from './auth.service';
import { API_BASE_URL, API_TIMEOUT } from '../constants/api';

class ApiService {
  private axiosInstance: AxiosInstance;
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
    this.axiosInstance = this.createAxiosInstance();
    this.setupInterceptors();
  }

  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  private setupInterceptors(): void {
    // 🔥 REQUEST INTERCEPTOR - Auto Auth Token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await this.authService.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add telemetry headers
        config.headers['X-Device-ID'] = await this.getDeviceId();
        config.headers['X-Session-ID'] = this.getSessionId();

        return config;
      },
      (error) => Promise.reject(error)
    );

    // 🔥 RESPONSE INTERCEPTOR - Handle Auth Errors
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await this.authService.logout();
          // Navigate to login
        }
        return Promise.reject(error);
      }
    );
  }

  // 🔥 GENERIC REQUEST METHODS
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get(url, config);
    return response.data;
  }

  async post<T, D = any>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.post(url, data, config);
    return response.data;
  }

  async put<T, D = any>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.put(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.delete(url, config);
    return response.data;
  }
}

export const apiService = new ApiService();
```

### **Hook para TanStack Query**
```typescript
// packages/mobile-expo/src/shared/hooks/useApi.ts

import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { apiService } from '../services/api.service';

export function useApiQuery<T>(
  key: string[],
  url: string,
  options?: UseQueryOptions<T>
) {
  return useQuery({
    queryKey: key,
    queryFn: () => apiService.get<T>(url),
    ...options,
  });
}

export function useApiMutation<T, D = any>(
  url: string,
  method: 'POST' | 'PUT' | 'DELETE' = 'POST',
  options?: UseMutationOptions<T, Error, D>
) {
  return useMutation({
    mutationFn: (data: D) => {
      switch (method) {
        case 'POST': return apiService.post<T, D>(url, data);
        case 'PUT': return apiService.put<T, D>(url, data);
        case 'DELETE': return apiService.delete<T>(url);
        default: throw new Error(`Unsupported method: ${method}`);
      }
    },
    ...options,
  });
}
```

---

## 📊 BACKEND: PATRÓN DE PAGINACIÓN REUTILIZABLE

### **DTO Base para Paginación**
```typescript
// packages/api-nueva/src/common/dto/pagination.dto.ts

import { IsOptional, IsPositive, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}

// DTO extendible para filtros específicos
export class NewsFilterDto extends PaginationDto {
  @IsOptional()
  category?: string;

  @IsOptional()
  published?: boolean = true;

  @IsOptional()
  search?: string;
}
```

### **Response Interface**
```typescript
// packages/api-nueva/src/common/interfaces/paginated-response.interface.ts

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

### **Service Genérico**
```typescript
// packages/api-nueva/src/common/services/pagination.service.ts

import { Injectable } from '@nestjs/common';
import { Model, Document } from 'mongoose';
import { PaginationDto } from '../dto/pagination.dto';
import { PaginatedResponse } from '../interfaces/paginated-response.interface';

@Injectable()
export class PaginationService {
  async paginate<T extends Document>(
    model: Model<T>,
    paginationDto: PaginationDto,
    filter: any = {},
    options: any = {}
  ): Promise<PaginatedResponse<T>> {

    const { page, limit, skip } = paginationDto;

    // Count total documents
    const total = await model.countDocuments(filter);

    // Fetch paginated data
    const data = await model
      .find(filter)
      .sort(options.sort || { createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select(options.select)
      .populate(options.populate)
      .exec();

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    };
  }
}
```

### **Controller Usage**
```typescript
// packages/api-nueva/src/features/news/news.controller.ts

@Controller('news')
export class NewsController {
  constructor(
    private readonly newsService: NewsService,
    private readonly paginationService: PaginationService
  ) {}

  @Get()
  async findAll(@Query() filterDto: NewsFilterDto) {
    return this.newsService.findAllPaginated(filterDto);
  }
}

// packages/api-nueva/src/features/news/news.service.ts
@Injectable()
export class NewsService {
  constructor(
    @InjectModel(Article.name) private articleModel: Model<ArticleDocument>,
    private readonly paginationService: PaginationService
  ) {}

  async findAllPaginated(filterDto: NewsFilterDto): Promise<PaginatedResponse<Article>> {
    // Build filter object
    const filter: any = {};

    if (filterDto.category) {
      filter.categories = { $in: [filterDto.category] };
    }

    if (filterDto.published !== undefined) {
      filter.published = filterDto.published;
    }

    if (filterDto.search) {
      filter.$or = [
        { title: { $regex: filterDto.search, $options: 'i' } },
        { content: { $regex: filterDto.search, $options: 'i' } }
      ];
    }

    const options = {
      sort: { publishedAt: -1, createdAt: -1 },
      populate: ['authorId', 'categories']
    };

    return this.paginationService.paginate(
      this.articleModel,
      filterDto,
      filter,
      options
    );
  }
}
```

---

## 🔴 REDIS CACHING PATTERNS

### **Configuración Base** (YA TIENES)
```typescript
// packages/api-nueva/src/app.module.ts - CONFIGURADO ✅
CacheModule.registerAsync({
  isGlobal: true,
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    stores: [
      new KeyvRedis(configService.get<string>('config.redis.url')),
    ],
    ttl: (configService.get<number>('config.cache.ttl') || 600) * 1000,
    max: 1000,
  }),
  inject: [ConfigService],
})
```

### **Controller Cache Patterns**
```typescript
// packages/api-nueva/src/features/news/news.controller.ts

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Controller('news')
export class NewsController {
  constructor(
    private readonly newsService: NewsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  // 🔥 PATTERN 1: Cache Interceptor Automático
  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheKey('news_list')
  @CacheTTL(300000) // 5 minutos
  async findAll(@Query() filterDto: NewsFilterDto) {
    return this.newsService.findAllPaginated(filterDto);
  }

  // 🔥 PATTERN 2: Cache Manual con Invalidación
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const cacheKey = `news:${id}`;

    // Try cache first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const news = await this.newsService.findOne(id);

    // Cache result
    await this.cacheManager.set(cacheKey, news, 300000); // 5 min

    return news;
  }

  // 🔥 PATTERN 3: Cache Invalidation on Update
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateNewsDto) {
    const result = await this.newsService.update(id, updateDto);

    // Invalidate related caches
    await this.cacheManager.del(`news:${id}`);
    await this.cacheManager.del('news_list');

    return result;
  }
}
```

### **Service Cache Patterns**
```typescript
// packages/api-nueva/src/features/news/news.service.ts

@Injectable()
export class NewsService {
  constructor(
    @InjectModel(Article.name) private articleModel: Model<ArticleDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  // 🔥 PATTERN: Cache with Cache-Aside Strategy
  async findPopularNews(): Promise<Article[]> {
    const cacheKey = 'popular_news';

    // Check cache
    const cached = await this.cacheManager.get<Article[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Expensive database query
    const popular = await this.articleModel
      .find({ published: true })
      .sort({ views: -1, likes: -1 })
      .limit(10)
      .exec();

    // Cache for 30 minutes
    await this.cacheManager.set(cacheKey, popular, 1800000);

    return popular;
  }

  // 🔥 PATTERN: Multi-level Cache Keys
  async findByCategory(category: string, page: number = 1): Promise<Article[]> {
    const cacheKey = `news:category:${category}:page:${page}`;

    const cached = await this.cacheManager.get<Article[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const articles = await this.articleModel
      .find({ categories: category, published: true })
      .skip((page - 1) * 10)
      .limit(10)
      .exec();

    await this.cacheManager.set(cacheKey, articles, 600000); // 10 min

    return articles;
  }
}
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### **Backend Setup** ✅
- [ ] Crear `PaginationDto` base con defaults (page=1, limit=10)
- [ ] Crear `PaginationService` genérico reutilizable
- [ ] Implementar `PaginatedResponse<T>` interface
- [ ] Agregar Redis cache patterns a controllers existentes
- [ ] Crear endpoints de telemetría con cache
- [ ] Agregar tipos compartidos al package `@noticias/shared`

### **Mobile Setup** 📱
- [ ] Crear estructura de directorios feature-first
- [ ] Configurar `ApiService` con axios + auth interceptors
- [ ] Implementar mappers para integridad de datos
- [ ] Crear hooks base: `useApiQuery`, `useApiMutation`
- [ ] Setup constantes y configuración
- [ ] Agregar dependencies: `expo-device`, `expo-constants`, etc.

### **Integración** 🔗
- [ ] Conectar mobile con endpoints paginados
- [ ] Probar auth flow completo con tokens
- [ ] Implementar telemetría básica
- [ ] Testing de mappers con respuestas reales
- [ ] Validar cache performance en desarrollo

---

**📅 Documento creado:** 16 Sept 2025
**🔄 Última actualización:** 16 Sept 2025
**👤 Contexto para:** Coyotito - Noticias Pachuca Project

**🎯 Patrón Principal:** Feature-First + Cache-Aside + Type-Safe APIs