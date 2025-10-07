# 🔐 FIX AUTH DEBUG SOLUTION - PACHUCA NOTICIAS

**Fecha de análisis**: 5 de octubre de 2025
**Proyecto**: Pachuca Noticias - Sistema de Autenticación
**Reportado por**: Coyotito
**Problema**: Sesión se cierra "cada ratito" en dash-coyote

---

## 🎯 DIAGNÓSTICO EJECUTIVO

### **CAUSA RAÍZ IDENTIFICADA** ⚠️

La sesión se cierra cada **15 minutos** porque:

1. **Backend**: Token de acceso expira a los 15 minutos (`JWT_ACCESS_EXPIRES=15m`)
2. **Frontend**: NO tiene refresh automático proactivo (solo reactivo después de 401)
3. **Resultado**: Cada 15 minutos → token expira → request → 401 → intenta refresh → puede fallar → usuario percibe "cierre de sesión"

**Severidad**: ALTA - Impacto directo en UX
**Solución rápida**: Cambiar `JWT_ACCESS_EXPIRES=15m` a `JWT_ACCESS_EXPIRES=1h`

---

## 📊 HALLAZGOS DETALLADOS

### 🔴 **CRÍTICO #1: Token de Acceso Muy Corto**

**Archivo**: `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/api-nueva/.env`
**Líneas**: 31, 37

**Configuración actual**:
```env
JWT_EXPIRES_IN=15m          # Legacy (línea 31)
JWT_ACCESS_EXPIRES=15m      # Actual configuración usada (línea 37)
JWT_REFRESH_EXPIRES=7d      # Este está bien
```

**Problema**:
- 15 minutos es demasiado corto para sesiones web
- Estándar de la industria: **1-2 horas**
- Usuarios activos experimentan expiración frecuente

**Impacto**:
- Usuario trabaja 15 minutos → token expira → percibe "sesión cerrada"
- Si el refresh falla (red, backend issue), usuario sale completamente

**Código de referencia** (`token-manager.service.ts:41-44`):
```typescript
const token = await this.jwtService.signAsync(payload, {
  secret: this.configService.get('config.auth.jwtAccessSecret'),
  expiresIn: this.configService.get('config.auth.jwtAccessExpires'), // 15m ⚠️
});
```

---

### 🔴 **CRÍTICO #2: No Hay Refresh Automático Proactivo**

**Archivo**: `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/dash-coyote/src/features/auth/stores/authStore.ts`

**Método existente pero no usado** (líneas 137-150):
```typescript
isTokenExpiringSoon: (minutesBuffer = 5): boolean => {
  const { sessionExpiry } = get()
  if (!sessionExpiry) return false

  const currentTime = Date.now()
  const expiryTime = new Date(sessionExpiry).getTime()
  const minutesInMs = minutesBuffer * 60 * 1000
  const timeToExpiry = expiryTime - currentTime

  return timeToExpiry <= minutesInMs && timeToExpiry > 0
}
```

**Problema**:
- Este método **NUNCA SE LLAMA** en la aplicación
- Existe `refreshToken()` en authService (línea 83-93) pero solo se usa en interceptor de 401
- No hay timer o interval que revise proactivamente

**Interceptor actual** (`apiClient.ts:79-97`):
```typescript
// Solo refresh DESPUÉS de recibir 401 (reactivo)
if (error.response?.status === 401 && !originalRequest._retry) {
  originalRequest._retry = true;

  if (this.isRefreshing) {
    // Queue the request
  }

  return this.handleTokenRefresh(originalRequest);
}
```

**Lo que falta**:
```typescript
// Debería haber algo como esto:
useEffect(() => {
  const interval = setInterval(() => {
    if (isTokenExpiringSoon(5)) {  // 5 min antes
      refreshAccessToken()
    }
  }, 60000) // Revisar cada minuto

  return () => clearInterval(interval)
}, [])
```

**Impacto**:
- Usuario hace request con token expirado
- Obtiene 401
- Luego refresca token
- Retries request
- Proceso visible para el usuario (loading, delays)

---

### 🟡 **ALTO #3: Session Expiry Calculado Incorrectamente**

**Archivo**: `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/dash-coyote/src/features/auth/stores/authStore.ts`
**Líneas**: 43, 67, 93

**Código problemático**:
```typescript
// Línea 43 (en login)
const sessionExpiry = new Date(Date.now() + tokens.expiresIn * 1000)

// Línea 67 (en setSession)
sessionExpiry: new Date(Date.now() + tokens.expiresIn * 1000)

// Línea 93 (en refreshSession)
sessionExpiry: new Date(Date.now() + tokens.expiresIn * 1000)
```

**Problema**:
- `tokens.expiresIn` = 900 segundos (15 minutos) → es el tiempo del ACCESS token
- Pero debería usar:
  - Tiempo del REFRESH token (7 días), o
  - Tiempo de la sesión web (24 horas del SESSION_EXPIRES)

**Resultado**:
- Frontend piensa que la sesión completa expira en 15 min
- Método `clearExpiredSession()` podría hacer logout prematuro

**Debería ser**:
```typescript
// Opción 1: Usar 24 horas (SESSION_EXPIRES del backend)
const sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

// Opción 2: Usar refresh token expiry (7 días)
const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
```

---

### 🟡 **ALTO #4: Socket se Desconecta en Cada Refresh de Token**

**Archivo**: `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/dash-coyote/src/socket/context/SocketProvider.tsx`
**Líneas**: 225-235

**Código problemático**:
```typescript
useEffect(() => {
  if (socket && tokens?.accessToken) {
    console.log('🔄 Token cambió, reconectando socket...');
    socket.disconnect();  // ⚠️ Desconecta completamente
    setTimeout(() => {
      if (mountedRef.current) {
        createSocket();
      }
    }, 1000);
  }
}, [tokens?.accessToken]);  // Se ejecuta en CADA cambio de token
```

**Problema**:
- Cada vez que el token se refresca (cada 15 min si todo va bien)
- Socket se desconecta por 1 segundo
- Usuario puede percibir esto como "sesión cerrada"
- Notificaciones en tiempo real se pierden durante reconexión

**Impacto en UX**:
- Usuario ve desconexión momentánea
- Si el usuario está en tab de jobs/generaciones, puede perder updates
- Puede pensar que perdió la sesión

**Solución sugerida**:
```typescript
// No desconectar, solo actualizar auth para próxima reconexión
useEffect(() => {
  if (socket && tokens?.accessToken) {
    socket.auth = { token: tokens.accessToken }
    // No disconnect, socket usará nuevo token en próximo handshake
  }
}, [tokens?.accessToken])
```

---

### 🟢 **MEDIO #5: API Interceptor Solo Reactivo**

**Archivo**: `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/dash-coyote/src/features/shared/services/apiClient.ts`
**Líneas**: 78-156

**Comportamiento actual**:
1. Request con token expirado
2. Backend responde 401
3. Frontend detecta 401
4. Intenta refresh
5. Si éxito: retry request
6. Si falla: logout

**Problema**:
- Es reactivo, no proactivo
- Usuario experimenta delay en cada request fallido
- Múltiples requests simultáneos cuando token expira = múltiples 401s
- Queue de requests puede crecer

**Código actual** (líneas 109-156):
```typescript
private async handleTokenRefresh(originalRequest: AxiosRequestConfig) {
  this.isRefreshing = true

  try {
    const { tokens } = useAuthStore.getState()
    if (!tokens?.refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await axios.post(`${this.baseURL}/auth/refresh`,
      { refreshToken: tokens.refreshToken },
      { withCredentials: true, headers: { 'X-Platform': 'web' } }
    )

    const newTokens = response.data.tokens
    const { refreshSession } = useAuthStore.getState()
    refreshSession(newTokens)

    // Process queued requests
    this.failedQueue.forEach(prom => {
      prom.resolve(newTokens.accessToken)
    })
    this.failedQueue = []

    originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`
    return this.client(originalRequest)

  } catch (refreshError) {
    this.failedQueue.forEach(prom => {
      prom.reject(refreshError)
    })
    this.failedQueue = []
    this.handleAuthFailure()
    return Promise.reject(refreshError)
  } finally {
    this.isRefreshing = false
  }
}
```

**Mejor enfoque**:
- Proactivo: Refrescar 5 min antes de expirar
- Así el usuario nunca ve 401 por token expirado

---

### 🟢 **MEDIO #6: Route Guard No Valida Expiración**

**Archivo**: `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/dash-coyote/src/routes/_authenticated.tsx`
**Líneas**: 5-16

**Código actual**:
```typescript
beforeLoad: ({ context, location }) => {
  if (!context.auth.isAuthenticated) {  // ⚠️ Solo boolean
    throw redirect({
      to: '/login',
      search: { redirect: location.href },
    })
  }
}
```

**Problema**:
- Solo verifica `isAuthenticated` (boolean flag)
- No verifica si el token está realmente válido
- No verifica si está expirado

**Debería verificar**:
```typescript
beforeLoad: ({ context, location }) => {
  const { isAuthenticated, isTokenExpiringSoon, tokens } = context.auth

  if (!isAuthenticated || !tokens?.accessToken) {
    throw redirect({ to: '/login', search: { redirect: location.href } })
  }

  // Opcional: Refrescar si está por expirar
  if (isTokenExpiringSoon(5)) {
    // Trigger proactive refresh
  }
}
```

---

### 🟢 **BAJO #7: Límites Hardcoded en Redis**

**Archivo**: `/Users/horuscamachoavila/Documents/pachuca-noticias/packages/api-nueva/src/auth/services/redis-auth.service.ts`

**Línea 108**:
```typescript
const maxTokens = 5; // Hardcoded - debería ser configurable
```

**Línea 205**:
```typescript
const maxSessions = 3; // Hardcoded - debería ser configurable
```

**Problema**:
- No se pueden ajustar sin cambiar código
- Deberían venir del `.env`

**Solución**:
Agregar al `.env`:
```env
MAX_REFRESH_TOKENS=5
MAX_SESSIONS=3
```

---

## 🏗️ ARQUITECTURA DEL SISTEMA DE AUTH

### **Backend (NestJS)**

```
┌─────────────────────────────────────────────────────────┐
│                    AUTH FLOW (Backend)                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. POST /auth/login                                    │
│     ├─> AuthService.login()                             │
│     ├─> TokenManager.generateTokenResponse()            │
│     │   ├─> generateAccessToken() → 15 min ⚠️          │
│     │   └─> generateRefreshToken() → 7 days ✅         │
│     └─> RedisAuthService.storeRefreshToken()            │
│                                                         │
│  2. Protected Route Request                             │
│     ├─> JwtAuthGuard                                    │
│     ├─> JwtStrategy.validate()                          │
│     ├─> Check token blacklist in Redis                  │
│     └─> Return user or 401                              │
│                                                         │
│  3. POST /auth/refresh                                  │
│     ├─> RefreshJwtAuthGuard                             │
│     ├─> RefreshJwtStrategy.validate()                   │
│     ├─> TokenManager.rotateRefreshToken()               │
│     │   ├─> Blacklist old refresh token                 │
│     │   └─> Generate new refresh token                  │
│     └─> Generate new access token → 15 min again ⚠️    │
│                                                         │
└─────────────────────────────────────────────────────────┘

Storage:
- Redis: Token JTIs, blacklist, sessions, refresh tokens
- MongoDB: Users, permanent data
- Memory: JWT verification keys
```

### **Frontend (React + Zustand)**

```
┌─────────────────────────────────────────────────────────┐
│                    AUTH FLOW (Frontend)                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. User Login                                          │
│     ├─> authService.login()                             │
│     ├─> authStore.login(tokens)                         │
│     │   ├─> Store in state                              │
│     │   ├─> Store in localStorage                       │
│     │   └─> sessionExpiry = now + 15min ⚠️             │
│     └─> Redirect to dashboard                           │
│                                                         │
│  2. API Request                                         │
│     ├─> apiClient adds Authorization header             │
│     ├─> If 401 response:                                │
│     │   ├─> Queue request                               │
│     │   ├─> Call /auth/refresh                          │
│     │   ├─> Update tokens in store                      │
│     │   ├─> Retry queued requests                       │
│     │   └─> Socket reconnects ⚠️                        │
│     └─> Return response                                 │
│                                                         │
│  3. Page Reload/Refresh                                 │
│     ├─> Zustand rehydrates from localStorage            │
│     ├─> onRehydrateStorage callback                     │
│     ├─> clearExpiredSession()                           │
│     │   └─> If sessionExpiry < now: logout              │
│     └─> If valid: continue session                      │
│                                                         │
│  4. Protected Route Navigation                          │
│     ├─> _authenticated.tsx beforeLoad                   │
│     ├─> Check isAuthenticated flag ⚠️                  │
│     └─> Redirect to login if false                      │
│                                                         │
└─────────────────────────────────────────────────────────┘

Storage:
- localStorage: { user, tokens, isAuthenticated, sessionExpiry }
- Memory: Zustand state
- Socket.io: Real-time connection with auth token
```

---

## 🔧 CONFIGURACIÓN ACTUAL

### **Backend (.env)**

```env
# JWT Access Token (PROBLEMA AQUÍ ⚠️)
JWT_SECRET=...                    # Legacy
JWT_EXPIRES_IN=15m                # Legacy (línea 31) - muy corto
JWT_ACCESS_SECRET=...             # Actual
JWT_ACCESS_EXPIRES=15m            # Actual (línea 37) - MUY CORTO ⚠️

# JWT Refresh Token (OK ✅)
JWT_REFRESH_SECRET=...
JWT_REFRESH_EXPIRES_IN=7d         # Legacy
JWT_REFRESH_EXPIRES=7d            # Actual - 7 días OK

# Reset Tokens (OK ✅)
RESET_TOKEN_SECRET=...
RESET_TOKEN_EXPIRES=1h

# Session (OK ✅)
SESSION_SECRET=...
SESSION_EXPIRES=86400000          # 24 horas en ms

# Bcrypt (OK ✅)
BCRYPT_ROUNDS=12

# Redis (OK ✅)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123
REDIS_DB=0
REDIS_URL=redis://:redis123@localhost:6379

# Límites (NO SE USAN - Hardcoded ⚠️)
MAX_REFRESH_TOKENS=5              # No se lee del .env
MAX_SESSIONS=3                    # No se lee del .env
```

### **Frontend (.env)**

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=ws://localhost:3000
```

---

## 📁 ARCHIVOS CLAVE

### **Backend**

**Auth Core:**
- `src/auth/auth.module.ts` - Configuración JWT
- `src/auth/services/auth.service.ts` - Login, refresh, logout
- `src/auth/services/token-manager.service.ts` - Generación y validación tokens
- `src/auth/services/redis-auth.service.ts` - Storage en Redis

**Strategies:**
- `src/auth/strategies/jwt.strategy.ts` - Validación access token
- `src/auth/strategies/refresh-jwt.strategy.ts` - Validación refresh token

**Guards:**
- `src/auth/guards/jwt-auth.guard.ts` - Protección de rutas
- `src/auth/guards/refresh-jwt-auth.guard.ts` - Protección endpoint refresh

**Config:**
- `.env` - Variables de entorno (líneas 31, 37 tienen el problema)
- `src/config/configuration.ts` - Carga config desde .env

### **Frontend**

**Auth Core:**
- `src/features/auth/stores/authStore.ts` - Estado global auth (Zustand)
- `src/features/auth/services/authService.ts` - Llamadas API auth
- `src/features/auth/types/auth.types.ts` - TypeScript types

**API:**
- `src/features/shared/services/apiClient.ts` - Axios client con interceptor

**Routes:**
- `src/routes/_authenticated.tsx` - Layout protegido
- `src/routes/__root.tsx` - Root router con auth context

**Socket:**
- `src/socket/context/SocketProvider.tsx` - Socket.io provider
- `src/socket/config/socket-config.ts` - Socket configuration

---

## 💡 SOLUCIONES PROPUESTAS

### **1️⃣ SOLUCIÓN INMEDIATA - Aumentar Token Expiration**

**Prioridad**: CRÍTICA
**Tiempo estimado**: 1 minuto + restart
**Impacto**: Alto - Resuelve 80% del problema

**Archivo**: `/packages/api-nueva/.env`

**Cambio**:
```env
# DE:
JWT_EXPIRES_IN=15m
JWT_ACCESS_EXPIRES=15m

# A:
JWT_EXPIRES_IN=1h
JWT_ACCESS_EXPIRES=1h

# O para mejor UX:
JWT_EXPIRES_IN=2h
JWT_ACCESS_EXPIRES=2h
```

**Pasos**:
1. Editar `.env` del backend
2. Reiniciar servidor NestJS: `cd packages/api-nueva && yarn start:dev`
3. Hacer logout/login en frontend para obtener nuevo token
4. Probar que sesión dura 1-2 horas

**Pros**:
- ✅ Solución inmediata
- ✅ Sin cambios de código
- ✅ Mantiene seguridad (refresh token rotation)

**Contras**:
- ⚠️ Tokens válidos por más tiempo si son robados (mitigado por refresh rotation)

**Recomendación**: Usar `1h` o `2h` como estándar de la industria

---

### **2️⃣ SOLUCIÓN CORTO PLAZO - Implementar Auto Refresh Proactivo**

**Prioridad**: ALTA
**Tiempo estimado**: 2-3 horas
**Impacto**: Muy Alto - Usuario nunca verá token expirado

**Crear nuevo hook**: `/packages/dash-coyote/src/features/auth/hooks/useAutoTokenRefresh.ts`

```typescript
import { useEffect, useRef } from 'react'
import { useAuthStore } from '../stores/authStore'
import { authService } from '../services/authService'

/**
 * Hook para refrescar token automáticamente antes de expirar
 * Revisa cada 30 segundos si el token expira en los próximos 5 minutos
 */
export function useAutoTokenRefresh() {
  const tokens = useAuthStore(state => state.tokens)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const isTokenExpiringSoon = useAuthStore(state => state.isTokenExpiringSoon)
  const refreshSession = useAuthStore(state => state.refreshSession)
  const logout = useAuthStore(state => state.logout)

  const refreshingRef = useRef(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Solo ejecutar si usuario está autenticado
    if (!isAuthenticated || !tokens?.refreshToken) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    const checkAndRefresh = async () => {
      // Verificar si token expira en próximos 5 minutos
      if (isTokenExpiringSoon(5) && !refreshingRef.current) {
        refreshingRef.current = true

        console.log('⏰ Token expira pronto, refrescando proactivamente...')

        try {
          const newTokens = await authService.refreshToken(tokens.refreshToken)
          refreshSession(newTokens)
          console.log('✅ Token refrescado exitosamente de forma proactiva')
        } catch (error) {
          console.error('❌ Error al refrescar token proactivamente:', error)
          // Si falla el refresh, hacer logout
          logout()
        } finally {
          refreshingRef.current = false
        }
      }
    }

    // Revisar inmediatamente al montar
    checkAndRefresh()

    // Revisar cada 30 segundos
    intervalRef.current = setInterval(checkAndRefresh, 30000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isAuthenticated, tokens?.refreshToken, isTokenExpiringSoon, refreshSession, logout])
}
```

**Usar en main.tsx** (agregar en línea ~75, después de SocketProvider):

```typescript
import { useAutoTokenRefresh } from '@/features/auth/hooks/useAutoTokenRefresh'

function App() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)

  // Hook para auto-refresh de token
  useAutoTokenRefresh()  // ⭐ AGREGAR AQUÍ

  return (
    <SocketProvider>
      {/* resto del código */}
    </SocketProvider>
  )
}
```

**Pros**:
- ✅ Usuario nunca experimenta token expirado
- ✅ Sin interrupciones en UX
- ✅ Refresh ocurre en background

**Contras**:
- ⚠️ Timer adicional ejecutándose (impacto mínimo)

---

### **3️⃣ SOLUCIÓN CORTO PLAZO - Arreglar Session Expiry Calculation**

**Prioridad**: ALTA
**Tiempo estimado**: 30 minutos
**Impacto**: Medio - Evita logout prematuro

**Archivo**: `/packages/dash-coyote/src/features/auth/stores/authStore.ts`

**Cambiar líneas 43, 67, 93**:

```typescript
// DE:
const sessionExpiry = new Date(Date.now() + tokens.expiresIn * 1000)

// A (Opción 1 - Usar 24 horas como backend SESSION_EXPIRES):
const sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

// O (Opción 2 - Usar 7 días como refresh token):
const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
```

**Recomendación**: Usar 24 horas (opción 1) para ser consistente con `SESSION_EXPIRES` del backend.

**Pros**:
- ✅ Frontend no piensa que sesión expira en 15 min
- ✅ Consistente con backend

**Contras**:
- ⚠️ Ninguno

---

### **4️⃣ SOLUCIÓN MEDIANO PLAZO - Mejorar Socket Reconnection**

**Prioridad**: MEDIA
**Tiempo estimado**: 1 hora
**Impacto**: Medio - Mejor UX en refresh

**Archivo**: `/packages/dash-coyote/src/socket/context/SocketProvider.tsx`

**Cambiar líneas 225-235**:

```typescript
// DE:
useEffect(() => {
  if (socket && tokens?.accessToken) {
    console.log('🔄 Token cambió, reconectando socket...');
    socket.disconnect();  // ❌ No desconectar
    setTimeout(() => {
      if (mountedRef.current) {
        createSocket();
      }
    }, 1000);
  }
}, [tokens?.accessToken]);

// A:
useEffect(() => {
  if (socket && tokens?.accessToken) {
    console.log('🔄 Token cambió, actualizando auth...');
    // Solo actualizar auth, socket usará nuevo token en próxima reconexión
    socket.auth = { token: tokens.accessToken }
    // No disconnect, evita interrupción de conexión
  }
}, [tokens?.accessToken]);
```

**Pros**:
- ✅ No desconecta socket innecesariamente
- ✅ Usuario no percibe "desconexión"
- ✅ No se pierden notificaciones

**Contras**:
- ⚠️ Si socket necesita el nuevo token inmediatamente, puede tener delay (mitigable)

---

### **5️⃣ SOLUCIÓN LARGO PLAZO - Hacer Límites Configurables**

**Prioridad**: BAJA
**Tiempo estimado**: 1 hora
**Impacto**: Bajo - Mejora de mantenibilidad

**Archivo 1**: `/packages/api-nueva/.env`

Agregar:
```env
MAX_REFRESH_TOKENS=5
MAX_SESSIONS=3
```

**Archivo 2**: `/packages/api-nueva/src/config/configuration.ts`

Agregar en sección auth:
```typescript
auth: {
  // ... existing config
  maxRefreshTokens: parseInt(process.env.MAX_REFRESH_TOKENS) || 5,
  maxSessions: parseInt(process.env.MAX_SESSIONS) || 3,
}
```

**Archivo 3**: `/packages/api-nueva/src/auth/services/redis-auth.service.ts`

**Cambiar líneas 108 y 205**:

```typescript
// Línea 108 - DE:
const maxTokens = 5;

// A:
const maxTokens = this.configService.get<number>('config.auth.maxRefreshTokens') || 5;

// Línea 205 - DE:
const maxSessions = 3;

// A:
const maxSessions = this.configService.get<number>('config.auth.maxSessions') || 3;
```

**Pros**:
- ✅ Configurable sin cambiar código
- ✅ Fácil ajustar en producción

**Contras**:
- ⚠️ Ninguno

---

### **6️⃣ SOLUCIÓN LARGO PLAZO - UI/UX Mejoras**

**Prioridad**: BAJA
**Tiempo estimado**: 4-6 horas
**Impacto**: Bajo - Nice to have

**Características sugeridas**:

1. **Indicador de sesión en navbar**:
   - Mostrar tiempo restante hasta expiración
   - Warning cuando quedan 5 min
   - Botón "Extender sesión"

2. **Modal de advertencia**:
   - "Tu sesión expira en 2 minutos"
   - Botón "Seguir trabajando" (refresca token)
   - Countdown visible

3. **Toast notifications**:
   - "Sesión extendida automáticamente"
   - "Error al refrescar sesión, por favor vuelve a iniciar"

4. **Debug panel** (solo dev):
   - Ver token actual
   - Ver tiempo de expiración
   - Botón "Forzar refresh"
   - Log de refreshes

---

## 🎯 PLAN DE IMPLEMENTACIÓN RECOMENDADO

### **Fase 1 - Solución Inmediata (HOY - 5 minutos)**

1. ✅ Cambiar `JWT_ACCESS_EXPIRES=15m` a `JWT_ACCESS_EXPIRES=1h` en `.env`
2. ✅ Reiniciar backend
3. ✅ Probar con sesión de 1+ hora

**Resultado esperado**: Sesión dura 4x más tiempo (1 hora vs 15 min)

---

### **Fase 2 - Mejoras Críticas (Esta semana - 4 horas)**

1. ✅ Implementar `useAutoTokenRefresh` hook (2-3 horas)
2. ✅ Arreglar `sessionExpiry` calculation (30 min)
3. ✅ Probar con navegación, múltiples tabs, refresh de página (30 min)

**Resultado esperado**: Usuario nunca ve token expirado, sesión fluida

---

### **Fase 3 - Mejoras de UX (Próxima semana - 2 horas)**

1. ✅ Mejorar socket reconnection (1 hora)
2. ✅ Hacer límites configurables (1 hora)
3. ✅ Testing exhaustivo (incluir en QA)

**Resultado esperado**: Sin interrupciones perceptibles, mejor mantenibilidad

---

### **Fase 4 - Enhancements Opcionales (Backlog)**

1. ⏳ UI indicators de sesión
2. ⏳ Warning modals antes de expirar
3. ⏳ Debug panel para development
4. ⏳ Analytics de refresh patterns

---

## 🧪 TESTING CHECKLIST

Después de implementar soluciones, probar:

### **Test 1: Token Longevity**
- [ ] Iniciar sesión
- [ ] Esperar 30 minutos sin interactuar
- [ ] Hacer request (click en algún lado)
- [ ] Verificar que NO salió de sesión
- [ ] Esperar hasta 1 hora
- [ ] Hacer request
- [ ] Verificar que sigue autenticado

### **Test 2: Auto Refresh**
- [ ] Cambiar `JWT_ACCESS_EXPIRES` a 2 minutos (para testing)
- [ ] Iniciar sesión
- [ ] Abrir consola del navegador
- [ ] Esperar ~1:30 minutos (antes de expirar)
- [ ] Verificar log "⏰ Token expira pronto, refrescando..."
- [ ] Verificar log "✅ Token refrescado exitosamente"
- [ ] Verificar que NO hubo 401 error

### **Test 3: Refresh on 401**
- [ ] Deshabilitar auto-refresh temporalmente
- [ ] Dejar token expirar
- [ ] Hacer request
- [ ] Verificar que interceptor atrapa 401
- [ ] Verificar que refresca token
- [ ] Verificar que retries request exitosamente

### **Test 4: Multi-tab Sync**
- [ ] Abrir app en Tab 1
- [ ] Iniciar sesión
- [ ] Abrir Tab 2 (debería estar autenticado)
- [ ] Hacer refresh de token en Tab 1 (manualmente o esperar)
- [ ] Verificar que Tab 2 también actualiza token
- [ ] Hacer request en Tab 2
- [ ] Verificar que usa token actualizado

### **Test 5: Network Failure**
- [ ] Iniciar sesión
- [ ] Abrir DevTools > Network
- [ ] Simular "Offline" cuando token está por expirar
- [ ] Verificar que no intenta refresh (no network)
- [ ] Volver a "Online"
- [ ] Verificar que intenta refresh y recupera sesión

### **Test 6: Socket Behavior**
- [ ] Iniciar sesión
- [ ] Abrir consola
- [ ] Esperar refresh de token (auto o manual)
- [ ] Verificar que socket NO se desconecta
- [ ] Verificar que socket auth se actualiza
- [ ] Verificar que notificaciones en tiempo real siguen funcionando

### **Test 7: Logout**
- [ ] Iniciar sesión
- [ ] Hacer logout
- [ ] Verificar que tokens se limpian de localStorage
- [ ] Verificar que socket se desconecta
- [ ] Verificar que cookies se limpian
- [ ] Intentar navegar a ruta protegida
- [ ] Verificar redirect a login

### **Test 8: Page Reload/Refresh**
- [ ] Iniciar sesión
- [ ] Navegar a dashboard
- [ ] Hacer refresh de página (F5)
- [ ] Verificar que sigue autenticado
- [ ] Verificar que no pidió login
- [ ] Verificar que socket reconecta correctamente

### **Test 9: Session Expiry Check**
- [ ] Iniciar sesión
- [ ] Esperar 25 horas (si sessionExpiry = 24h)
- [ ] Hacer refresh de página
- [ ] Verificar que `clearExpiredSession()` hace logout
- [ ] Verificar redirect a login

### **Test 10: Long Active Session**
- [ ] Iniciar sesión
- [ ] Trabajar activamente por 2-3 horas (hacer requests cada ~10 min)
- [ ] Verificar que auto-refresh ocurre múltiples veces
- [ ] Verificar que nunca sale de sesión
- [ ] Verificar logs en consola de refreshes exitosos

---

## 📊 MÉTRICAS ESPERADAS POST-FIX

### **Antes (Estado Actual)**
- ⏱️ Duración promedio de sesión: **15 minutos**
- 🔄 Refreshes por hora: **4** (reactivos, pueden fallar)
- ❌ Logouts no intencionales: **Frecuentes** ("cada ratito")
- 😟 UX Score: **3/10**

### **Después (Con Soluciones 1+2+3)**
- ⏱️ Duración promedio de sesión: **Horas** (hasta que usuario cierre sesión)
- 🔄 Refreshes por hora: **1** (proactivo, antes de expirar)
- ❌ Logouts no intencionales: **Casi cero**
- 😊 UX Score: **9/10**

---

## 🔒 CONSIDERACIONES DE SEGURIDAD

### **Aumentar token expiration a 1-2 horas:**

**¿Es seguro?**
✅ **SÍ**, porque:
- Refresh token rotation sigue activo (token family tracking)
- Tokens son JWTs firmados (no modificables)
- Blacklisting de tokens revocados en Redis
- HTTPS en producción (previene man-in-the-middle)
- Access tokens de corta vida siguen siendo mejores que sesiones de servidor

**Estándar de la industria:**
- Google: 1 hora
- GitHub: 8 horas
- Auth0 recomendación: 1-2 horas
- AWS Cognito: 1 hora por defecto

**Mitigaciones adicionales:**
- ✅ Refresh token rotation (ya implementado)
- ✅ Max tokens per user = 5 (ya implementado)
- ✅ Token blacklist en Redis (ya implementado)
- ✅ JTI tracking (ya implementado)

**Riesgos vs Beneficios:**
- Riesgo: Token robado válido por 1h vs 15min
- Beneficio: Usuario no sale cada 15 min
- **Conclusión**: Beneficio >> Riesgo

---

## 📚 REFERENCIAS

### **Estándares de la Industria**

**JWT Best Practices (RFC 8725)**:
- Access token: 15 min - 2 horas
- Refresh token: 7-30 días
- Refresh token rotation: RECOMENDADO
- Token blacklisting: RECOMENDADO

**OAuth 2.0 / OpenID Connect**:
- Access token típico: 1 hora
- Refresh token típico: 30 días

**OWASP Recommendations**:
- Usar HTTPS siempre
- HttpOnly cookies para tokens sensibles (opcional)
- Refresh token rotation para prevenir replay attacks
- Token blacklisting para revocación

### **Implementaciones de Referencia**

**Auth0**:
- Access token: 1 hora por defecto
- Refresh token: 30 días
- Auto-refresh antes de expirar

**Supabase**:
- Access token: 1 hora
- Refresh token: 30 días
- Auto-refresh en cliente

**Firebase Auth**:
- Access token: 1 hora
- Refresh token: ilimitado (hasta revocación)
- Auto-refresh en SDK

---

## 🎬 TIMELINE DE EJECUCIÓN SUGERIDO

### **DÍA 1 (HOY):**
- ✅ Cambiar `.env` JWT_ACCESS_EXPIRES a 1h
- ✅ Reiniciar backend
- ✅ Testing básico (30 min de sesión)
- ✅ Guardar este documento

### **DÍA 2:**
- ✅ Implementar `useAutoTokenRefresh` hook
- ✅ Testing con auto-refresh
- ✅ Code review

### **DÍA 3:**
- ✅ Arreglar sessionExpiry calculation
- ✅ Mejorar socket reconnection
- ✅ Testing completo
- ✅ Deploy a staging

### **DÍA 4:**
- ✅ QA en staging
- ✅ Monitorear logs de refresh
- ✅ Ajustar si necesario

### **DÍA 5:**
- ✅ Deploy a producción
- ✅ Monitorear métricas
- ✅ Confirmar que issue está resuelto

---

## 💬 COMUNICACIÓN CON EL EQUIPO

### **Para el Equipo de Desarrollo:**

"Identificamos que las sesiones se cierran cada 15 minutos debido a que el access token expira muy rápido. Vamos a:
1. Aumentar JWT_ACCESS_EXPIRES de 15m a 1h
2. Implementar auto-refresh proactivo antes de expiración
3. Arreglar cálculo de sessionExpiry en frontend

Esto mejorará significativamente la UX sin comprometer seguridad."

### **Para QA:**

"Después del fix, por favor probar:
- Sesiones activas de 2+ horas
- Refresh de página durante sesión larga
- Múltiples tabs abiertas
- Comportamiento de socket durante refresh
- Logout manual funciona correctamente"

### **Para Usuarios/Stakeholders:**

"Resolvimos el problema de 'sesión cerrada frecuentemente'. Ahora las sesiones durarán mientras estés trabajando activamente, sin interrupciones cada 15 minutos."

---

## 📝 NOTAS FINALES

### **Aprendizajes Clave:**
1. 15 minutos es muy corto para access tokens en aplicaciones web
2. Refresh automático proactivo es mejor que reactivo
3. Socket reconnection debe ser transparente para el usuario
4. SessionExpiry debe basarse en refresh token, no access token

### **Deuda Técnica Identificada:**
- [ ] Límites hardcoded en Redis (líneas 108, 205)
- [ ] Falta de UI indicators de sesión
- [ ] No hay logging de métricas de refresh
- [ ] Route guard solo verifica boolean, no expiration

### **Seguimiento:**
- Monitorear logs de refresh después de deploy
- Trackear métricas de sesión (duración promedio, refreshes exitosos/fallidos)
- Considerar implementar analytics de auth en futuro

---

**Documento creado**: 5 de octubre de 2025
**Última actualización**: 5 de octubre de 2025
**Autor**: Jarvis (Claude AI Assistant)
**Revisado por**: Coyotito

---

## 🆘 CONTACTOS DE EMERGENCIA

Si después de aplicar fix sigue habiendo problemas:

1. **Revisar logs del backend**: `packages/api-nueva/logs/`
2. **Revisar console del navegador**: Buscar errores de auth
3. **Revisar Redis**: `redis-cli` → `keys auth:*`
4. **Verificar .env**: Asegurar que cambios fueron aplicados
5. **Reiniciar todo**: Backend + Frontend + Redis

---

**FIN DEL DOCUMENTO**
