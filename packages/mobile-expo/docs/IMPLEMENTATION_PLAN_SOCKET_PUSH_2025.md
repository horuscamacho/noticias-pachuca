# 🚀 Plan de Implementación: Sistema Unificado Socket.IO + Push Notifications
## Checklist Detallado - Mobile Expo 2025

---

## 📋 Overview del Plan

### 🎯 Objetivo
Implementar sistema unificado de notificaciones que combine Socket.IO (foreground) + Push Notifications (background) con invalidación inteligente de TanStack Query.

### 🏗️ Backend Status
```bash
✅ SocketGateway completamente implementado
✅ NotificationRouterService con lógica AUTO routing
✅ SessionManagerService tracking usuarios
✅ ExpoPushService para push notifications
✅ Redis adapter para escalabilidad
✅ Autenticación JWT + Session cookies
```

### 📱 Frontend Status
```bash
✅ TanStack Query configurado
✅ Zustand auth store funcionando
✅ JWT token management con auto-refresh
✅ Device detection y API URL switching
❌ Socket.IO client - NO IMPLEMENTADO
❌ Push notifications - NO IMPLEMENTADO
❌ Unified notification service - NO IMPLEMENTADO
```

---

## 📦 FASE 1: Instalación y Setup Base

### 1.1 Instalar Dependencias
```bash
# Socket.IO Client
[ ] yarn add socket.io-client

# Push Notifications
[ ] yarn add expo-notifications
[ ] yarn add expo-device  # YA INSTALADO ✅
[ ] yarn add expo-constants  # YA INSTALADO ✅

# Permissions
[ ] yarn add expo-permissions
```

### 1.2 Configurar app.json
```json
[ ] Agregar permissions para notifications:
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSUserNotificationUsageDescription": "Esta app usa notificaciones para mantenerte actualizado"
      }
    },
    "android": {
      "permissions": ["RECEIVE_BOOT_COMPLETED", "VIBRATE"]
    }
  }
}
```

### 1.3 Crear Estructura de Archivos (Siguiendo Arquitectura Existente)
```bash
# Features-based architecture (ya existe src/features/)
[ ] mkdir src/features/socket/
[ ] mkdir src/features/socket/services/
[ ] mkdir src/features/socket/hooks/
[ ] mkdir src/features/socket/stores/
[ ] mkdir src/features/socket/types/
[ ] mkdir src/features/socket/utils/

# Siguiendo patrón de features existente (como src/features/analytics/)
[ ] touch src/features/socket/services/SocketService.ts
[ ] touch src/features/socket/services/PushNotificationService.ts
[ ] touch src/features/socket/services/NotificationManager.ts
[ ] touch src/features/socket/hooks/useSocket.ts
[ ] touch src/features/socket/hooks/useNotifications.ts
[ ] touch src/features/socket/hooks/useRealtimeQuery.ts
[ ] touch src/features/socket/stores/socketStore.ts
[ ] touch src/features/socket/stores/notificationStore.ts
[ ] touch src/features/socket/types/socket.types.ts
[ ] touch src/features/socket/types/notification.types.ts
[ ] touch src/features/socket/utils/socketMappers.ts
[ ] touch src/features/socket/index.ts  # Export barrel file
```

---

## 🔌 FASE 2: Implementar Socket.IO Client

### 2.1 Crear SocketService (Singleton Pattern)
```typescript
[ ] Archivo: src/features/socket/services/SocketService.ts

Funcionalidades a implementar (siguiendo patrón de ApiClient existente):
[ ] Singleton pattern para una sola instancia (como ApiClient)
[ ] Auto-reconnection con exponential backoff
[ ] JWT token authentication automática (integración con TokenManager existente)
[ ] Device ID y platform headers (usando DeviceInfoService existente)
[ ] Event listener management con cleanup automático
[ ] Connection state tracking con Zustand
[ ] Error handling robusto (usando ErrorMapper existente)
[ ] Integración con ENV.API_BASE_URL existente

Estructura (siguiendo patrón de servicios existentes):
[ ] class SocketService - Singleton como ApiClient
[ ] private constructor()
[ ] static getInstance(queryClient: QueryClient) - Inyección como en otras services
[ ] connect() - Auto token headers
[ ] disconnect() - Cleanup completo
[ ] emit() - Con error handling
[ ] on() - Con auto-cleanup
[ ] off() - Manejo de listeners
[ ] getConnectionState() - Estado reactivo
[ ] setupEventHandlers() - Configuración inicial
[ ] handleTokenRefresh() - Integración con auth
```

### 2.2 Configuración de Conexión
```typescript
[ ] Archivo: src/features/socket/services/config.ts

Configurar (integrando con arquitectura existente):
[ ] URL del backend usando ENV.API_BASE_URL existente
[ ] Auth headers automáticos con TokenManager.getAccessToken()
[ ] Device ID usando DeviceInfoService.getDeviceId() existente
[ ] Platform detection usando existing Platform detection
[ ] Reconnection settings optimizados para mobile
[ ] Timeout configurations según CONFIG existente

Integración con sistemas existentes:
✅ ENV.API_BASE_URL: ws://192.168.100.34:3000
✅ TokenManager para auth headers
✅ DeviceInfoService para device info
✅ CONFIG para timeouts y settings
```

### 2.3 TypeScript Types
```typescript
[ ] Archivo: src/features/socket/types/socket.types.ts

Definir tipos (siguiendo patrón de namespace API/App existente):
[ ] namespace SocketAPI - tipos que vienen del backend
[ ] namespace SocketApp - tipos para la aplicación
[ ] SocketConnectionState ('disconnected' | 'connecting' | 'connected' | 'error')
[ ] SocketEventMap - mapear eventos del backend SocketGateway
[ ] SocketConfig - configuración del cliente
[ ] SocketError - errores específicos de socket
[ ] DeviceInfo interface - reutilizar del sistema existente
[ ] AuthHeaders interface - integrar con sistema auth

Integración con tipos existentes:
✅ API/App namespace pattern (como en auth.types.ts)
✅ DeviceInfo ya existe en DeviceInfoService
✅ AuthError pattern para SocketError
```

---

## 🔔 FASE 3: Implementar Push Notifications

### 3.1 PushNotificationService
```typescript
[ ] Archivo: src/features/socket/services/PushNotificationService.ts

Funcionalidades (siguiendo patrón de servicios existentes):
[ ] Request permissions con UX consistente
[ ] Get push token con error handling robusto
[ ] Register token con backend usando ApiClient existente
[ ] Handle notification received con query invalidation
[ ] Handle notification pressed con navigation
[ ] Deep linking support usando router
[ ] Badge management multiplataforma
[ ] Notification categories configurables

Integración con sistemas existentes:
✅ ApiClient para requests HTTP
✅ Backend socket event: 'update-push-token'
✅ TokenManager para auth en requests
✅ ErrorMapper para manejo de errores
✅ Router para deep linking
✅ QueryClient para invalidation
```

### 3.2 Permission Management
```typescript
[ ] Función: requestNotificationPermissions()
[ ] Función: checkPermissionStatus()
[ ] Función: openSettingsIfDenied()
[ ] UX: Modal explicativo antes de request
[ ] UX: Fallback message si denied
[ ] Storage: Guardar estado de permission
```

### 3.3 Token Registration
```typescript
[ ] Función: getExpoPushToken()
[ ] Función: registerTokenWithBackend()
[ ] Función: updateTokenOnAuthChange()
[ ] Auto-registration en login success
[ ] Token refresh handling
[ ] Error handling y retry logic

Backend integration:
✅ Socket event: 'update-push-token'
✅ HTTP endpoint: /notifications/push-token
```

---

## 🔄 FASE 4: Integración TanStack Query

### 4.1 Query Invalidation Patterns
```typescript
[ ] Archivo: src/features/socket/hooks/useQueryInvalidation.ts

Socket events → Query invalidation mapping (usando queryKeys existentes):
[ ] 'notification' → queryKeys.auth.all (si es auth-related)
[ ] 'message' → ['messages', roomId] (nuevos query keys)
[ ] 'user-update' → queryKeys.auth.user(), queryKeys.auth.profile()
[ ] 'status-change' → ['status', userId]
[ ] 'data-sync' → invalidateAll() selectivo

Funciones (siguiendo patrón de hooks existentes):
[ ] setupQueryInvalidation(queryClient: QueryClient)
[ ] invalidateBySocketEvent(event: string, data: any)
[ ] batchInvalidation(events: Array<{key: string[], data: any}>)
[ ] optimisticUpdate(queryKey: string[], updateFn: Function)

Integración con sistemas existentes:
✅ queryKeys pattern del queryClient.ts
✅ queryClient instance única
✅ Error handling con ErrorMapper
```

### 4.2 Real-time Query Hooks
```typescript
[ ] Archivo: src/hooks/socket/useRealtimeQuery.ts

Custom hooks:
[ ] useRealtimeNotifications()
[ ] useRealtimeMessages(roomId)
[ ] useRealtimeUserStatus(userId)
[ ] useRealtimeData(queryKey, socketEvent)

Características:
[ ] Auto-setup socket listeners
[ ] Auto-cleanup en unmount
[ ] Stale time management
[ ] Background refetch control
```

### 4.3 Optimistic Updates
```typescript
[ ] Implementar optimistic updates para:
[ ] Envío de mensajes
[ ] Marcar notificaciones como leídas
[ ] Updates de estado
[ ] Reactions y likes

Rollback strategy:
[ ] Error handling
[ ] Revert optimistic changes
[ ] Show error toast
[ ] Retry mechanism
```

---

## 📱 FASE 5: State Management (Zustand)

### 5.1 Socket Store
```typescript
[ ] Archivo: src/features/socket/stores/socketStore.ts

Estado (siguiendo patrón de authStore existente):
[ ] connectionState: 'disconnected' | 'connecting' | 'connected' | 'error'
[ ] lastConnected: Date | null
[ ] reconnectAttempts: number
[ ] isOnline: boolean
[ ] latency: number
[ ] roomsJoined: string[] (para tracking de rooms)

Acciones (siguiendo patrón de authStore):
[ ] connect()
[ ] disconnect()
[ ] updateConnectionState(state: ConnectionState)
[ ] incrementReconnectAttempts()
[ ] resetReconnectAttempts()
[ ] joinRoom(roomId: string)
[ ] leaveRoom(roomId: string)
[ ] setLatency(ms: number)

Persistencia (como authStore):
[ ] persist middleware solo para configuraciones no sensibles
[ ] NO persistir connection state (solo session)
[ ] onRehydrateStorage para limpieza
```

### 5.2 Notification Store
```typescript
[ ] Archivo: src/features/socket/stores/notificationStore.ts

Estado (siguiendo patrón de authStore):
[ ] notifications: App.Notification[]
[ ] unreadCount: number
[ ] pushToken: string | null
[ ] permissionStatus: PermissionStatus
[ ] lastNotificationId: string | null
[ ] settings: NotificationSettings

Acciones (siguiendo patrón consistente):
[ ] addNotification(notification: App.Notification)
[ ] markAsRead(notificationId: string)
[ ] markAllAsRead()
[ ] removeNotification(notificationId: string)
[ ] updatePushToken(token: string | null)
[ ] updatePermissionStatus(status: PermissionStatus)
[ ] clearNotifications()
[ ] updateSettings(settings: Partial<NotificationSettings>)

Integración con tipos existentes:
✅ App namespace para tipos de notificación
✅ Persistencia usando AsyncStorage como authStore
✅ Error handling con ErrorMapper
```

### 5.3 Persistencia
```typescript
[ ] Configurar persist middleware para:
[ ] pushToken (importante mantener)
[ ] permissionStatus
[ ] lastNotificationId
[ ] NO persistir: notifications array (security)
```

---

## 🎯 FASE 6: Unified Notification Manager

### 6.1 NotificationManager (Orchestrator)
```typescript
[ ] Archivo: src/services/notifications/NotificationManager.ts

Responsabilidades:
[ ] Decide routing: Socket vs Push
[ ] Handle app state changes
[ ] Coordinate con SocketService
[ ] Coordinate con PushNotificationService
[ ] Query invalidation coordination
[ ] Error handling centralizado

Métodos principales:
[ ] initialize()
[ ] handleNotification()
[ ] routeNotification()
[ ] handleAppStateChange()
[ ] handleSocketEvent()
[ ] handlePushNotification()
```

### 6.2 App State Management
```typescript
[ ] Integración con AppState API
[ ] Sync app state con backend vía socket
[ ] Handle foreground/background transitions
[ ] Update notification routing strategy

Estados:
[ ] 'active' → Use Socket.IO
[ ] 'background' → Use Push only
[ ] 'inactive' → Hybrid approach
```

### 6.3 Fallback Logic
```typescript
[ ] Socket disconnected → Use push API
[ ] Push token unavailable → Socket only
[ ] Both unavailable → Polling fallback
[ ] Network unavailable → Queue locally
```

---

## 🔗 FASE 7: Integración con Sistema Auth

### 7.1 Auth Hook Integration (Modificación Mínima del Sistema Existente)
```typescript
[ ] Modificar src/hooks/useAuth.ts (SOLO agregar integración socket):

Agregar integraciones NO invasivas:
[ ] Socket auto-connect en login success usando onSuccess callback
[ ] Socket disconnect en logout usando existing logout function
[ ] Push token registration usando existing mutation pattern
[ ] Socket token refresh usando existing refreshTokens function
[ ] Device info sync usando existing DeviceInfoService

Nuevos hooks especializados (NO modificar useAuth existente):
[ ] src/features/socket/hooks/useAuthSocket.ts - lifecycle socket
[ ] src/features/socket/hooks/useAuthNotifications.ts - lifecycle push
[ ] Integración mediante useEffect en componentes que los usen

Principio: NO romper la funcionalidad existente de useAuth
```

### 7.2 Token Management
```typescript
[ ] Auto-refresh socket connection en token refresh
[ ] Handle token expiry gracefully
[ ] Re-authenticate socket con nuevo token
[ ] Update push token si cambia usuario
[ ] Cleanup en logout
```

### 7.3 Multi-device Support
```typescript
[ ] Device ID consistent across sessions
[ ] Multiple socket connections por usuario
[ ] Push token por device
[ ] Session management coordination

Backend ya soporta:
✅ Multiple sessions per user
✅ Device tracking
✅ Platform-specific handling
```

---

## 🧪 FASE 8: Testing y Debugging

### 8.1 Development Tools
```typescript
[ ] Socket.IO debug mode en __DEV__
[ ] Console logs para debugging
[ ] State inspection tools
[ ] Connection health monitoring
[ ] Performance metrics tracking

Debug tools:
[ ] Socket connection status component
[ ] Notification history viewer
[ ] Query invalidation logger
[ ] Performance profiler
```

### 8.2 Test Scenarios
```typescript
[ ] Test foreground → background transitions
[ ] Test socket disconnect/reconnect
[ ] Test push notification delivery
[ ] Test query invalidation timing
[ ] Test auth token refresh
[ ] Test multi-device scenarios
[ ] Test network loss recovery
[ ] Test permission denial handling
```

### 8.3 Error Handling
```typescript
[ ] Socket connection errors
[ ] Push notification errors
[ ] Permission errors
[ ] Token refresh errors
[ ] Network errors
[ ] Backend errors
[ ] Graceful degradation
```

---

## 🔧 FASE 9: Configuración y Environment

### 9.1 Environment Variables
```typescript
[ ] Agregar a src/config/env.ts:

SOCKET_URL: Backend socket endpoint
PUSH_NOTIFICATIONS_ENABLED: Feature flag
DEBUG_SOCKET: Debug mode toggle
RECONNECT_ATTEMPTS: Max attempts
RECONNECT_DELAY: Delay entre attempts
```

### 9.2 Feature Flags
```typescript
[ ] Implementar feature flags para:
[ ] Socket.IO habilitado/deshabilitado
[ ] Push notifications habilitado/deshabilitado
[ ] Debug mode
[ ] Fallback mode
[ ] Query invalidation aggressiveness
```

### 9.3 Performance Configuration
```typescript
[ ] Socket.IO config optimizations:
[ ] transports: ['websocket', 'polling']
[ ] reconnection: true
[ ] reconnectionAttempts: 5
[ ] reconnectionDelay: 1000
[ ] timeout: 20000

[ ] Query config optimizations:
[ ] staleTime for realtime queries
[ ] gcTime for notifications
[ ] refetchOnWindowFocus: false (mobile)
```

---

## 📊 FASE 10: Monitoring y Analytics

### 10.1 Metrics Collection
```typescript
[ ] Socket connection success rate
[ ] Average reconnection time
[ ] Push notification delivery rate
[ ] Query invalidation frequency
[ ] Error rates por tipo
[ ] Performance metrics
```

### 10.2 Analytics Integration
```typescript
[ ] Integrar con analytics existente:
[ ] src/features/analytics/ (YA EXISTE ✅)
[ ] Track notification events
[ ] Track socket events
[ ] Track user engagement
[ ] Track error events
```

---

## 🚀 Orden de Implementación Recomendado

### Sprint 1 (2-3 días)
```bash
✅ FASE 1: Setup y dependencias
✅ FASE 2.1: SocketService básico
✅ FASE 3.1: PushNotificationService básico
✅ FASE 5.1: Socket store básico
```

### Sprint 2 (2-3 días)
```bash
✅ FASE 4.1: Query invalidation básica
✅ FASE 6.1: NotificationManager básico
✅ FASE 7.1: Auth integration
✅ FASE 8.1: Debug tools básicos
```

### Sprint 3 (2-3 días)
```bash
✅ FASE 2.2-2.3: Socket avanzado
✅ FASE 3.2-3.3: Push avanzado
✅ FASE 4.2-4.3: Queries avanzadas
✅ FASE 6.2-6.3: Manager avanzado
```

### Sprint 4 (1-2 días)
```bash
✅ FASE 8.2-8.3: Testing completo
✅ FASE 9: Configuración
✅ FASE 10: Monitoring
✅ Polish y optimizaciones
```

---

## 🎯 Criterios de Éxito

### Funcionales
- [ ] Socket conecta automáticamente en login
- [ ] Push notifications funcionan en background
- [ ] Query invalidation funciona correctamente
- [ ] App state sync funciona
- [ ] Multi-device funciona
- [ ] Fallbacks funcionan correctamente

### No Funcionales
- [ ] Conexión en <2 segundos
- [ ] Reconnect en <5 segundos
- [ ] Push delivery rate >95%
- [ ] Memory usage estable
- [ ] Battery impact mínimo
- [ ] Error rate <1%

### UX
- [ ] Notificaciones instantáneas en foreground
- [ ] Notificaciones confiables en background
- [ ] Sin interrupciones en UX
- [ ] Feedback visual de estado de conexión
- [ ] Deep linking funciona desde push

---

## 🚨 Riesgos y Mitigaciones

### Riesgo: Push notifications no funcionan en Expo Go
**Mitigación**: Usar development build para testing completo

### Riesgo: Socket connections en background se pierden
**Mitigación**: Push notifications como fallback principal

### Riesgo: Query invalidation muy agresiva
**Mitigación**: Debounce y batch invalidations

### Riesgo: Memory leaks por event listeners
**Mitigación**: Cleanup estricto en useEffect

### Riesgo: Backend overload por reconnections
**Mitigación**: Exponential backoff y rate limiting

---

## 📝 Notas de Implementación

### Backend API Endpoints Disponibles
```bash
✅ WebSocket: ws://192.168.100.34:3000
✅ Events: 'app-state-change', 'update-push-token'
✅ HTTP: POST /notifications/send
✅ Auth: JWT token en headers/query
```

### Frontend Architecture Existente
```bash
✅ TanStack Query configurado
✅ Zustand stores funcionando
✅ JWT auth con auto-refresh
✅ Device detection working
✅ Environment configuration ready
```

### Integration Points
```bash
✅ useAuth hook - entry point principal
✅ queryClient - invalidation target
✅ authStore - token source
✅ env.ts - configuration source
```

---

*📋 Checklist detallado para implementación sistemática del sistema unificado de notificaciones - Enero 2025*