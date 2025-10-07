# 🐛 DEBUGGING & REFACTORING DASHBOARD PACHUCA NOTICIAS

**Fecha:** 2025-10-04
**Objetivo:** Estandarizar TODO el proyecto dash-coyote con buenas prácticas 2025-2026

---

## 📋 CHECKLIST MASTER

### FASE 1: ANÁLISIS E2E FLOW DE AUTENTICACIÓN JWT
- [ ] 1.1 - Analizar flujo de login desde frontend → backend
- [ ] 1.2 - Analizar cómo se guarda el token en cookies/localStorage
- [ ] 1.3 - Analizar interceptor de axios y cómo agrega el token
- [ ] 1.4 - Analizar JwtStrategy y cómo extrae el payload
- [ ] 1.5 - Analizar JwtAuthGuard y cómo popula `request.user`
- [ ] 1.6 - Analizar @CurrentUser decorator y su uso correcto
- [ ] 1.7 - Documentar flujo completo con diagrama

### FASE 2: AUDITORÍA DE ZUSTAND STORES
- [ ] 2.1 - Buscar TODOS los usos de `.getState()` en el proyecto
- [ ] 2.2 - Buscar TODOS los imports dinámicos de stores
- [ ] 2.3 - Buscar suscripciones al store completo sin selectors
- [ ] 2.4 - Identificar stores que guardan server state (should use TanStack Query)
- [ ] 2.5 - Listar TODAS las correcciones necesarias

### FASE 3: AUDITORÍA DE TYPESCRIPT TYPES
- [ ] 3.1 - Buscar TODOS los `any` en el proyecto
- [ ] 3.2 - Buscar TODOS los `as Type` sin validación
- [ ] 3.3 - Identificar DTOs del backend sin schemas Zod en frontend
- [ ] 3.4 - Verificar que TanStack Query infiere tipos correctamente
- [ ] 3.5 - Listar TODAS las correcciones necesarias

### FASE 4: CORRECCIÓN DE STORES DE ZUSTAND
- [ ] 4.1 - Corregir authStore
- [ ] 4.2 - Crear custom hooks para selectors comunes
- [ ] 4.3 - Eliminar .getState() mal usado
- [ ] 4.4 - Implementar shallow comparison donde sea necesario
- [ ] 4.5 - Separar server state a TanStack Query

### FASE 5: MAPEO CORRECTO DE API RESPONSES
- [ ] 5.1 - Crear schemas Zod para TODAS las respuestas del backend
- [ ] 5.2 - Implementar validación en runtime en hooks de TanStack Query
- [ ] 5.3 - Eliminar type assertions peligrosos
- [ ] 5.4 - Crear DTOs compartidos (considerar usar trpc o similar)
- [ ] 5.5 - Documentar tipos de cada endpoint

### FASE 6: REFACTOR GENERATOR PRO (CASO DE ESTUDIO)
- [ ] 6.1 - Activar JwtAuthGuard en GeneratorProController
- [ ] 6.2 - Usar @CurrentUser decorator para obtener userId
- [ ] 6.3 - Eliminar userId del body de generateContentWithAgent
- [ ] 6.4 - Implementar eventos de socket correctamente
- [ ] 6.5 - Crear schemas Zod para responses de generator-pro
- [ ] 6.6 - Verificar que todo funciona E2E

### FASE 7: BUILD Y VALIDACIÓN
- [ ] 7.1 - Ejecutar build del backend y verificar 0 errores
- [ ] 7.2 - Verificar que no hay forwardRef (usar EventEmitter2)
- [ ] 7.3 - Verificar que no hay any en el código
- [ ] 7.4 - Testing manual del flujo completo

---

## 🔐 ANÁLISIS E2E: FLUJO DE AUTENTICACIÓN JWT

### 1. LOGIN FLOW (Frontend → Backend)

**Frontend:**
```typescript
// src/features/auth/hooks/useAuth.ts
const loginMutation = useMutation({
  mutationFn: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials)
    return response
  }
})
```

**Backend:**
```typescript
// src/auth/controllers/auth.controller.ts
@Post('login')
async login(@Body() loginDto: LoginDto) {
  const { tokens, user } = await this.authService.login(loginDto)
  // tokens = { accessToken, refreshToken }
  return { tokens, user }
}
```

**¿Dónde se guarda el token?**
```typescript
// src/features/auth/stores/authStore.ts
login: (tokens, user) => set({ tokens, user, isAuthenticated: true })
// Se guarda en Zustand store Y localStorage (persist middleware)
```

---

### 2. AXIOS INTERCEPTOR (Cómo se agrega el token a requests)

**Ubicación:** `src/features/shared/services/apiClient.ts`

```typescript
this.client.interceptors.request.use((config) => {
  const { tokens, isAuthenticated } = useAuthStore.getState(); // ❌ INCORRECTO

  if (tokens?.accessToken && isAuthenticated) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }

  return config;
})
```

**✅ CORRECCIÓN NECESARIA:**
```typescript
// NO usar .getState() - El interceptor se ejecuta FUERA de React
// Opción 1: Leer del localStorage directamente
const tokens = JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.tokens

// Opción 2: Usar una referencia mutable actualizada por el store
let tokenRef = { current: null }
useAuthStore.subscribe((state) => tokenRef.current = state.tokens?.accessToken)
```

---

### 3. BACKEND: JWT STRATEGY (Cómo se valida el token)

**Ubicación:** `src/auth/strategies/jwt.strategy.ts`

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisAuth: RedisAuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // <-- Extrae del header Authorization
      secretOrKey: configService.get('config.auth.jwtAccessSecret'),
      passReqToCallback: true,
    });
  }

  async validate(request: AuthRequest, payload: TokenPayload): Promise<AuthenticatedUser> {
    // payload contiene: { sub: userId, username, email, roles, ... }

    // Verificar blacklist
    if (payload.jti) {
      const isBlacklisted = await this.redisAuth.isTokenBlacklisted(payload.jti);
      if (isBlacklisted) throw new UnauthorizedException('Token revoked');
    }

    // Retornar usuario autenticado
    return {
      userId: payload.sub, // <-- Este es el ID del usuario
      username: payload.username,
      email: payload.email,
      roles: payload.roles || [],
      permissions: payload.permissions || [],
      platform: payload.platform,
      deviceId: payload.deviceId,
      sessionId: payload.sessionId,
    };
  }
}
```

**Nota:** Este método `validate()` se ejecuta automáticamente cuando un endpoint tiene `@UseGuards(JwtAuthGuard)`

---

### 4. JWT AUTH GUARD (Cómo se protegen los endpoints)

**Ubicación:** `src/auth/guards/jwt-auth.guard.ts`

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.get('isPublic', context.getHandler());
    if (isPublic) return true;

    return super.canActivate(context); // <-- Llama a JwtStrategy.validate()
  }
}
```

**Cómo se usa:**
```typescript
@Controller('generator-pro')
@UseGuards(JwtAuthGuard) // <-- Protege TODOS los endpoints del controller
export class GeneratorProController {
  // Ahora TODOS los endpoints tienen acceso a request.user
}
```

---

### 5. @CURRENTUSER DECORATOR (Cómo se accede al usuario en endpoints)

**Ubicación:** `src/auth/decorators/current-user.decorator.ts`

```typescript
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user; // <-- Poblado por JwtStrategy.validate()

    return data ? user?.[data] : user;
  },
);
```

**Uso correcto:**
```typescript
@Post('content/generate')
@UseGuards(JwtAuthGuard) // <-- REQUERIDO para que funcione @CurrentUser
async generateContent(
  @Body() body: GenerateContentDto,
  @CurrentUser() user: AuthenticatedUser, // <-- Usuario completo
  @CurrentUser('userId') userId: string,  // <-- Solo el ID
) {
  // Aquí ya tienes el userId del token JWT
  await this.socketGateway.sendToUser(userId, 'event', data);
}
```

---

### 6. DIAGRAMA DEL FLUJO COMPLETO

```
┌─────────────┐
│  FRONTEND   │
└──────┬──────┘
       │ 1. Login con credentials
       ├────────────────────────────────┐
       │                                │
       ▼                                ▼
┌──────────────────┐          ┌─────────────────┐
│ POST /auth/login │          │  AuthService    │
└──────┬───────────┘          │  .login()       │
       │                      └────────┬────────┘
       │ 2. Retorna tokens            │
       │    { accessToken, ... }      │ 3. TokenManager
       │                              │    .generateAccessToken()
       ▼                              ▼
┌──────────────────┐          ┌─────────────────┐
│  authStore       │          │  JWT Token      │
│  .login(tokens)  │          │  { sub: userId, │
└──────┬───────────┘          │    username,... }│
       │                      └─────────────────┘
       │ 4. Guarda en Zustand + localStorage
       │
       ▼
┌──────────────────────────────────────┐
│  FUTURE REQUESTS                     │
│  ─────────────────────────────────   │
│  Axios Interceptor agrega:           │
│  Authorization: Bearer <token>       │
└──────┬───────────────────────────────┘
       │ 5. Request con token
       │
       ▼
┌──────────────────────────────────────┐
│  BACKEND ENDPOINT                    │
│  @UseGuards(JwtAuthGuard)            │
└──────┬───────────────────────────────┘
       │ 6. Guard ejecuta JwtStrategy
       │
       ▼
┌──────────────────────────────────────┐
│  JwtStrategy.validate()              │
│  ─────────────────────────────────   │
│  1. Extrae token del header          │
│  2. Verifica firma con secret        │
│  3. Decodifica payload               │
│  4. Checa blacklist                  │
│  5. Retorna AuthenticatedUser        │
└──────┬───────────────────────────────┘
       │ 7. Popula request.user
       │
       ▼
┌──────────────────────────────────────┐
│  CONTROLLER METHOD                   │
│  @CurrentUser() user                 │
│  ─────────────────────────────────   │
│  user.userId = payload.sub           │
└──────────────────────────────────────┘
```

---

## 🏪 AUDITORÍA COMPLETA DE ZUSTAND STORES

### STORES ENCONTRADAS

✅ **Total de stores:** 1
1. **authStore** - `src/features/auth/stores/authStore.ts`

**Conclusión:** Solo hay UNA store de Zustand en todo el proyecto (authStore). Esto es BUENO.

---

### USOS INCORRECTOS ENCONTRADOS

#### ❌ INCORRECTO #1: `.getState()` en apiClient.ts

**Archivo:** `src/features/shared/services/apiClient.ts`
**Líneas:** 40, 97, 155

```typescript
// ❌ MAL: .getState() fuera de event handlers
const { tokens, isAuthenticated } = useAuthStore.getState();
```

**Problema:** `.getState()` NO suscribe a cambios y no debería usarse fuera de event handlers/callbacks.

**✅ SOLUCIÓN:**
```typescript
// Opción 1: Leer de localStorage directamente
const authStorage = JSON.parse(localStorage.getItem('auth-storage') || '{}');
const tokens = authStorage?.state?.tokens;

// Opción 2: Usar suscripción mutable
let tokensRef = { current: null };
useAuthStore.subscribe((state) => tokensRef.current = state.tokens);
// Luego en el interceptor:
if (tokensRef.current?.accessToken) { ... }
```

---

#### ❌ INCORRECTO #2: Import dinámico en hooks/index.ts

**Archivo:** `src/features/generator-pro/hooks/index.ts`
**Línea:** 195-196

```typescript
// ❌ MAL: Import dinámico de store
const { user } = await import('../../auth/stores/authStore').then(m => m.useAuthStore.getState());
```

**Problema:** ABERRACIÓN TOTAL. Nunca se deben hacer imports dinámicos de stores.

**✅ SOLUCIÓN:** NO enviar userId del frontend. El backend lo extrae del token JWT.

---

### MEJORAS NECESARIAS EN authStore

**Archivo actual:** `src/features/auth/stores/authStore.ts`

```typescript
// PENDIENTE: Revisar implementación actual y aplicar:
// 1. Crear custom hooks con selectors
// 2. Separar actions de state
// 3. Usar slices pattern si crece
```

---

## 🚨 AUDITORÍA COMPLETA: FETCH() DIRECTOS SIN APICLIENT

### ❌ CRÍTICO: USOS DE FETCH() ENCONTRADOS

**Total:** 13 usos de `fetch()` directos que NO usan apiClient

#### ARCHIVO: `src/features/content-ai/components/PromptGeneratorWizard.tsx`

**❌ Línea 165:**
```typescript
const response = await fetch('/api/content-ai/generate-prompt-from-wizard', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
```

**❌ Línea 249:**
```typescript
const response = await fetch('/api/content-ai/create-template-from-wizard', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
```

**✅ DEBE SER:**
```typescript
const response = await apiClient.post('/content-ai/generate-prompt-from-wizard', data)
```

---

#### ARCHIVO: `src/features/content-ai/hooks/useJobs.ts`

**❌ MÚLTIPLES USOS (Líneas 135, 143, 151, 164, 186, 194, 202, 211, 225, 250, 262, 280, 307)**

Ejemplos:

```typescript
// ❌ Línea 135
const response = await fetch(`${API_BASE_URL}/content-ai/generate/status/${jobId}`)

// ❌ Línea 143
const response = await fetch(`${API_BASE_URL}/content-ai/generate/queue/stats`)

// ❌ Línea 151
const response = await fetch(`${API_BASE_URL}/content-ai/generate/${jobId}`, { method: 'DELETE' })
```

**✅ DEBEN SER:**
```typescript
const response = await apiClient.get(`/content-ai/generate/status/${jobId}`)
const response = await apiClient.get(`/content-ai/generate/queue/stats`)
const response = await apiClient.delete(`/content-ai/generate/${jobId}`)
```

**PROBLEMA:** Este archivo NO agrega el token JWT a las requests. Todas fallarán si el endpoint require autenticación.

---

## 🚨 AUDITORÍA COMPLETA: ANY EN TYPESCRIPT

### ❌ CRÍTICO: 51 USOS DE `any` ENCONTRADOS

#### DISTRIBUCIÓN POR ARCHIVO:

1. **generator-pro/hooks/index.ts** - 14 anys
2. **content-ai/hooks/useJobs.ts** - 6 anys
3. **rapidapi-facebook/hooks/useRapidAPIPages.ts** - 2 anys
4. **generator-pro/components/tabs/SitiosWebTab.tsx** - 2 anys
5. **Otros** - 27 anys

---

#### EJEMPLOS CRÍTICOS:

**❌ generator-pro/hooks/index.ts (Líneas 113-217)**

```typescript
// ❌ Línea 113-114
getFacebookPages: async (): Promise<{ pages: any[] }> => {
  return apiClient.get<{ pages: any[] }>('/generator-pro/facebook-pages')
}

// ❌ Línea 143-144
extractUrlsAndSave: async (websiteId: string): Promise<{ extractedUrls: any[]; totalUrls: number }> => {
  return apiClient.post<{ extractedUrls: any[]; totalUrls: number }>(`/generator-pro/websites/${websiteId}/extract-urls-and-save`)
}

// ❌ Línea 194-199
generateContentWithAgent: async (data: { ... }): Promise<{ generatedContent: any }> => {
  return apiClient.post<{ generatedContent: any }>('/generator-pro/content/generate', { ... })
}
```

**✅ DEBE SER (con Zod schemas):**

```typescript
// 1. Crear schemas
const FacebookPageSchema = z.object({
  id: z.string(),
  name: z.string(),
  // ... campos reales
})

const ExtractedUrlSchema = z.object({
  url: z.string(),
  title: z.string().optional(),
  // ... campos reales
})

const GeneratedContentSchema = z.object({
  id: z.string(),
  generatedTitle: z.string(),
  generatedContent: z.string(),
  // ... campos reales
})

// 2. Inferir tipos
type FacebookPage = z.infer<typeof FacebookPageSchema>
type ExtractedUrl = z.infer<typeof ExtractedUrlSchema>
type GeneratedContent = z.infer<typeof GeneratedContentSchema>

// 3. Usar en APIs con validación
getFacebookPages: async (): Promise<{ pages: FacebookPage[] }> => {
  const response = await apiClient.get<{ pages: unknown[] }>('/generator-pro/facebook-pages')
  return {
    pages: response.pages.map(p => FacebookPageSchema.parse(p))
  }
}
```

---

#### ❌ content-ai/hooks/useJobs.ts

```typescript
// ❌ Línea 117
jobData: any

// ❌ Línea 295
deadLetterQueue: any

// ❌ Línea 388
export function useDLQEntries(filters?: any) {
  // ...
}
```

**✅ DEBE SER:**
```typescript
// Crear schemas y tipos específicos
const JobDataSchema = z.object({ /* campos reales */ })
type JobData = z.infer<typeof JobDataSchema>

const DLQSchema = z.object({ /* campos reales */ })
type DeadLetterQueue = z.infer<typeof DLQSchema>

interface DLQFilters {
  status?: string
  type?: string
  // ... filtros específicos
}
```

---

## 🚨 RESUMEN DE ISSUES CRÍTICAS

### PRIORIDAD ALTA (Rompen funcionalidad)

1. ✅ **JwtAuthGuard desactivado** en GeneratorProController → Los sockets NO reciben userId
2. ❌ **13 fetch() directos** en useJobs.ts → NO envían token JWT, fallarán en producción
3. ❌ **4 .getState() mal usados** en apiClient.ts → Pueden causar inconsistencias
4. ❌ **1 .getState() mal usado** en generator-pro/hooks/index.ts → Ya corregido anteriormente

### PRIORIDAD MEDIA (Mantenibilidad)

5. ❌ **51 any en TypeScript** → Sin type safety en 51 lugares
6. ❌ **14 any solo en generator-pro/hooks** → Endpoints sin tipar correctamente

### PRIORIDAD BAJA (Best practices)

7. ✅ **authStore bien implementada** → Solo hay 1 store, bien usada en componentes
8. ✅ **No hay axios directos** → Todas las requests usan apiClient (excepto fetch())

---

## 📦 BUENAS PRÁCTICAS 2025-2026

### ZUSTAND

1. ✅ **Usar custom hooks con selectors**
   ```typescript
   export const useUser = () => useAuthStore((s) => s.user)
   export const useAuthActions = () => useAuthStore((s) => ({ login: s.login, logout: s.logout }))
   ```

2. ❌ **NO usar `.getState()` en render**
   ```typescript
   // MAL
   const user = useAuthStore.getState().user

   // BIEN
   const user = useAuthStore((s) => s.user)
   ```

3. ✅ **Usar `shallow` para objetos/arrays**
   ```typescript
   import { useShallow } from 'zustand/react/shallow'
   const { items, total } = useStore(useShallow((s) => ({ items: s.items, total: s.total })))
   ```

4. ✅ **Server State → TanStack Query, NO Zustand**
   ```typescript
   // MAL: guardar posts de API en Zustand
   const posts = useStore((s) => s.posts)

   // BIEN: usar TanStack Query
   const { data: posts } = useQuery({ queryKey: ['posts'], queryFn: fetchPosts })
   ```

---

### TYPESCRIPT API MAPPING

1. ✅ **Zod schema first + type inference**
   ```typescript
   const UserSchema = z.object({ id: z.number(), email: z.string() })
   type User = z.infer<typeof UserSchema>
   ```

2. ✅ **Validar en runtime**
   ```typescript
   const { data } = useQuery({
     queryFn: async () => {
       const res = await fetch('/api/user')
       return UserSchema.parse(await res.json())
     }
   })
   ```

3. ❌ **NO usar `as Type` sin validación**
   ```typescript
   // MAL
   const user = data as User

   // BIEN
   const user = UserSchema.parse(data)
   ```

4. ✅ **Use safeParse para error handling**
   ```typescript
   const result = UserSchema.safeParse(data)
   if (!result.success) {
     console.error(result.error.issues)
     throw new Error('Invalid data')
   }
   ```

---

### TANSTACK QUERY

1. ✅ **Custom hook por endpoint**
   ```typescript
   export const useUser = (id: number) => {
     return useQuery({
       queryKey: ['user', id],
       queryFn: () => fetchUser(id)
     })
   }
   ```

2. ❌ **NO crear wrappers genéricos**
   ```typescript
   // MAL
   const useGenericQuery = <T>(key, fetcher, options) => { ... }
   ```

3. ✅ **Dejar que TanStack Query infiera tipos**
   ```typescript
   const { data } = useQuery({
     queryFn: async (): Promise<Post[]> => { ... }
   })
   // data es Post[] | undefined automáticamente
   ```

---

## 🎯 CASO DE ESTUDIO: GENERATOR PRO SOCKET FIX

### PROBLEMA ORIGINAL

**Frontend enviaba userId en body:**
```typescript
// ❌ MAL
await apiClient.post('/generator-pro/content/generate', {
  extractedContentId,
  agentId,
  userId // <-- NO debería venir del frontend
})
```

**Backend esperaba userId del body:**
```typescript
// ❌ MAL
async generateContent(@Body() body: { userId?: string }) {
  if (body.userId) {
    await this.socketGateway.sendToUser(body.userId, 'event', data)
  }
}
```

---

### SOLUCIÓN CORRECTA

#### 1. Activar JwtAuthGuard

**Archivo:** `src/generator-pro/controllers/generator-pro.controller.ts`

```typescript
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('generator-pro')
@UseGuards(JwtAuthGuard) // <-- Activar guard
export class GeneratorProController {
  // ...
}
```

---

#### 2. Usar @CurrentUser decorator

```typescript
@Post('content/generate')
async generateContent(
  @Body() body: GenerateContentDto, // Sin userId
  @CurrentUser('userId') userId: string, // <-- Del token JWT
) {
  this.logger.log(`🎯 Generating content for user: ${userId}`);

  // Emitir evento de socket con userId del token
  await this.socketGateway.sendToUser(userId, 'content:generation-started', {
    extractedContentId: body.extractedContentId,
    agentId: body.agentId,
  });

  // ... resto del código
}
```

---

#### 3. Eliminar userId del DTO

**Archivo:** `src/generator-pro/dto/generate-content.dto.ts` (crear si no existe)

```typescript
import { IsString, IsOptional } from 'class-validator';

export class GenerateContentDto {
  @IsString()
  extractedContentId: string;

  @IsString()
  agentId: string;

  @IsString()
  @IsOptional()
  templateId?: string;

  @IsString()
  @IsOptional()
  providerId?: string;

  @IsString()
  @IsOptional()
  referenceContent?: string;

  // NO userId - viene del token
}
```

---

#### 4. Frontend: Eliminar envío de userId

**Archivo:** `src/features/generator-pro/hooks/index.ts`

```typescript
// ✅ CORRECTO
generateContentWithAgent: async (data: {
  extractedContentId: string;
  agentId: string;
  templateId?: string;
  providerId?: string;
  referenceContent?: string;
}): Promise<{ generatedContent: GeneratedContentResponseDto }> => {
  // NO enviar userId - el backend lo extrae del token
  return apiClient.post<{ generatedContent: GeneratedContentResponseDto }>(
    '/generator-pro/content/generate',
    data
  )
},
```

---

## 📝 PLAN DE ACCIÓN COMPLETO

### FASE 1: FIXES CRÍTICOS (PRIORIDAD ALTA)

- [ ] **1.1** Reemplazar 13 fetch() en useJobs.ts por apiClient
- [ ] **1.2** Reemplazar 2 fetch() en PromptGeneratorWizard.tsx por apiClient
- [ ] **1.3** Activar JwtAuthGuard en GeneratorProController
- [ ] **1.4** Usar @CurrentUser decorator en generateContent endpoint
- [ ] **1.5** Eliminar userId del body en generateContentWithAgent API
- [ ] **1.6** Corregir 4 .getState() en apiClient.ts (usar localStorage o ref mutable)
- [ ] **1.7** Testing E2E del flujo de sockets con userId del token

### FASE 2: TYPING CON ZOD (PRIORIDAD MEDIA)

- [ ] **2.1** Crear schemas Zod para generator-pro (14 anys)
- [ ] **2.2** Crear schemas Zod para content-ai (6 anys)
- [ ] **2.3** Crear schemas Zod para rapidapi-facebook (2 anys)
- [ ] **2.4** Reemplazar ANY restantes (27 anys en otros archivos)
- [ ] **2.5** Verificar type safety en TanStack Query hooks

### FASE 3: MEJORAS DE AUTHSTORE (PRIORIDAD BAJA)

- [ ] **3.1** Crear custom hooks con selectors (useUser, useAuthActions)
- [ ] **3.2** Implementar shallow comparison para objetos
- [ ] **3.3** Separar actions de state (slices pattern)
- [ ] **3.4** Documentar uso correcto de la store

### FASE 4: VALIDACIÓN FINAL

- [ ] **4.1** Build del backend (yarn build en api-nueva)
- [ ] **4.2** Verificar 0 errores TypeScript
- [ ] **4.3** Verificar 0 any en el código
- [ ] **4.4** Verificar que TODOS los fetch() usan apiClient
- [ ] **4.5** Testing E2E completo de generator-pro con sockets

---

## 🚨 REGLAS ESTRICTAS

1. ❌ **PROHIBIDO** `any` en TypeScript
2. ❌ **PROHIBIDO** builds en frontend durante desarrollo
3. ❌ **PROHIBIDO** `forwardRef` (usar EventEmitter2)
4. ❌ **PROHIBIDO** `.getState()` fuera de event handlers
5. ❌ **PROHIBIDO** `as Type` sin validación runtime
6. ✅ **OBLIGATORIO** Zod schemas para API responses
7. ✅ **OBLIGATORIO** JwtAuthGuard + @CurrentUser para userId
8. ✅ **OBLIGATORIO** TanStack Query para server state

---

**FIN DEL DOCUMENTO DE ANÁLISIS**

_Actualizado: 2025-10-04_
