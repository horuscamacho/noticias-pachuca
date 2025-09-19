# 🔄 Mappers para Socket.IO + Push Notifications
## Siguiendo Arquitectura Existente

---

## 📋 Patrón de Mappers (Siguiendo src/utils/mappers.ts)

### 🏗️ Estructura de Tipos

#### Socket Types (siguiendo patrón API/App namespace)
```typescript
// src/features/socket/types/socket.types.ts

namespace SocketAPI {
  // Tipos que vienen del backend SocketGateway
  interface SocketMessage {
    id: string
    event: string
    data: any
    timestamp: string
    delivered_via: 'socket'
  }

  interface ConnectedResponse {
    message: string
    sessionId: string
    platform: string
    timestamp: string
  }

  interface AppStateUpdateRequest {
    appState: 'FOREGROUND' | 'BACKGROUND'
    deviceId: string
  }

  interface PushTokenUpdateRequest {
    expoPushToken: string
    deviceId: string
  }
}

namespace SocketApp {
  // Tipos para la aplicación
  interface SocketMessage {
    id: string
    event: string
    data: any
    timestamp: Date
    deliveredVia: 'socket'
  }

  interface ConnectionInfo {
    message: string
    sessionId: string
    platform: string
    connectedAt: Date
  }

  interface AppStateChange {
    appState: 'foreground' | 'background'
    deviceId: string
  }

  interface PushTokenUpdate {
    expoPushToken: string
    deviceId: string
  }
}
```

#### Notification Types
```typescript
// src/features/socket/types/notification.types.ts

namespace NotificationAPI {
  // Del backend NotificationRouterService
  interface PushNotification {
    id: string
    type: string
    title: string
    body: string
    data?: Record<string, any>
    actionUrl?: string
    imageUrl?: string
    priority: 'low' | 'normal' | 'high' | 'urgent'
    timestamp: string
  }

  interface NotificationDelivery {
    success: boolean
    socketsSent: number
    pushSent: number
    errors: string[]
    queueId?: string
  }
}

namespace NotificationApp {
  // Para la aplicación
  interface Notification {
    id: string
    type: string
    title: string
    body: string
    data?: Record<string, any>
    actionUrl?: string
    imageUrl?: string
    priority: 'low' | 'normal' | 'high' | 'urgent'
    receivedAt: Date
    isRead: boolean
    source: 'push' | 'socket'
  }

  interface NotificationSettings {
    enabled: boolean
    soundEnabled: boolean
    vibrationEnabled: boolean
    badgeEnabled: boolean
    categories: {
      [key: string]: boolean
    }
  }
}
```

---

## 🔄 Mappers Implementation

### SocketMapper (siguiendo patrón de AuthMapper)
```typescript
// src/features/socket/utils/socketMappers.ts

export class SocketMapper {
  static messageToApp(apiMessage: SocketAPI.SocketMessage): SocketApp.SocketMessage {
    return {
      id: apiMessage.id,
      event: apiMessage.event,
      data: apiMessage.data,
      timestamp: new Date(apiMessage.timestamp),
      deliveredVia: 'socket'
    }
  }

  static connectionInfoToApp(apiResponse: SocketAPI.ConnectedResponse): SocketApp.ConnectionInfo {
    return {
      message: apiResponse.message,
      sessionId: apiResponse.sessionId,
      platform: apiResponse.platform,
      connectedAt: new Date(apiResponse.timestamp)
    }
  }

  static appStateChangeToAPI(appChange: SocketApp.AppStateChange): SocketAPI.AppStateUpdateRequest {
    return {
      appState: appChange.appState === 'foreground' ? 'FOREGROUND' : 'BACKGROUND',
      deviceId: appChange.deviceId
    }
  }

  static pushTokenUpdateToAPI(tokenUpdate: SocketApp.PushTokenUpdate): SocketAPI.PushTokenUpdateRequest {
    return {
      expoPushToken: tokenUpdate.expoPushToken,
      deviceId: tokenUpdate.deviceId
    }
  }
}
```

### NotificationMapper
```typescript
export class NotificationMapper {
  static toApp(apiNotification: NotificationAPI.PushNotification, source: 'push' | 'socket' = 'socket'): NotificationApp.Notification {
    return {
      id: apiNotification.id,
      type: apiNotification.type,
      title: apiNotification.title,
      body: apiNotification.body,
      data: apiNotification.data,
      actionUrl: apiNotification.actionUrl,
      imageUrl: apiNotification.imageUrl,
      priority: apiNotification.priority,
      receivedAt: new Date(apiNotification.timestamp),
      isRead: false,
      source
    }
  }

  static deliveryResultToApp(apiResult: NotificationAPI.NotificationDelivery): {
    success: boolean
    socketsSent: number
    pushSent: number
    errors: string[]
    queueId?: string
  } {
    return {
      success: apiResult.success,
      socketsSent: apiResult.socketsSent,
      pushSent: apiResult.pushSent,
      errors: apiResult.errors,
      queueId: apiResult.queueId
    }
  }
}
```

### SocketErrorMapper (extendiendo ErrorMapper existente)
```typescript
export class SocketErrorMapper {
  static toSocketError(error: unknown): SocketApp.SocketError {
    if (error && typeof error === 'object') {
      // Socket.IO errors
      if ('type' in error && 'description' in error) {
        const socketError = error as { type: string; description: string }
        return {
          code: `SOCKET_${socketError.type.toUpperCase()}`,
          message: socketError.description,
          timestamp: new Date()
        }
      }

      // Connection errors
      if ('message' in error) {
        const connectionError = error as { message: string }
        return {
          code: 'SOCKET_CONNECTION_ERROR',
          message: connectionError.message,
          timestamp: new Date()
        }
      }
    }

    // Fallback a ErrorMapper existente
    const authError = ErrorMapper.toAuthError(error)
    return {
      code: `SOCKET_${authError.code}`,
      message: authError.message,
      timestamp: new Date()
    }
  }

  static toPushError(error: unknown): NotificationApp.NotificationError {
    if (error && typeof error === 'object' && 'code' in error) {
      const pushError = error as { code: string; message?: string }
      return {
        code: `PUSH_${pushError.code}`,
        message: pushError.message || 'Push notification error',
        timestamp: new Date()
      }
    }

    // Fallback
    return {
      code: 'PUSH_UNKNOWN_ERROR',
      message: 'Unknown push notification error',
      timestamp: new Date()
    }
  }
}
```

---

## 🎯 Integración con Sistema Existente

### Hook useSocket (siguiendo patrón de useAuth)
```typescript
// src/features/socket/hooks/useSocket.ts

export const useSocket = () => {
  const queryClient = useQueryClient()
  const authStore = useAuthStore()
  const socketStore = useSocketStore()

  // Conexión automática al autenticarse
  useEffect(() => {
    if (authStore.isAuthenticated) {
      const socketService = SocketService.getInstance(queryClient)
      socketService.connect()
    }
  }, [authStore.isAuthenticated])

  const sendMessage = useCallback((event: string, data: any) => {
    const socketService = SocketService.getInstance(queryClient)
    return socketService.emit(event, data)
  }, [queryClient])

  const joinRoom = useCallback((roomId: string) => {
    const socketService = SocketService.getInstance(queryClient)
    socketService.emit('join-room', { roomId })
    socketStore.joinRoom(roomId)
  }, [socketStore])

  return {
    connectionState: socketStore.connectionState,
    isConnected: socketStore.connectionState === 'connected',
    lastConnected: socketStore.lastConnected,
    latency: socketStore.latency,
    roomsJoined: socketStore.roomsJoined,
    sendMessage,
    joinRoom,
    disconnect: () => SocketService.getInstance(queryClient).disconnect()
  }
}
```

### Hook useNotifications (integrando con TanStack Query)
```typescript
// src/features/socket/hooks/useNotifications.ts

export const useNotifications = () => {
  const queryClient = useQueryClient()
  const notificationStore = useNotificationStore()
  const { isAuthenticated } = useAuth()

  // Query para notificaciones (usando patrón queryKeys existente)
  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      // Usar ApiClient existente
      const apiClient = ApiClient.getInstance()
      const response = await apiClient.get('/notifications')
      return response.map((notif: NotificationAPI.PushNotification) =>
        NotificationMapper.toApp(notif)
      )
    },
    enabled: isAuthenticated,
    staleTime: 30 * 1000 // 30 segundos
  })

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const apiClient = ApiClient.getInstance()
      await apiClient.post(`/notifications/${notificationId}/read`)
    },
    onSuccess: (_, notificationId) => {
      notificationStore.markAsRead(notificationId)
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  return {
    notifications: notificationsQuery.data || [],
    unreadCount: notificationStore.unreadCount,
    isLoading: notificationsQuery.isLoading,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: notificationStore.markAllAsRead,
    refetch: notificationsQuery.refetch
  }
}
```

---

## 🚀 Service Integration Pattern

### SocketService siguiendo patrón de ApiClient
```typescript
// src/features/socket/services/SocketService.ts

export class SocketService {
  private static instance: SocketService | null = null
  private socket: Socket | null = null
  private queryClient: QueryClient
  private reconnectPromise: Promise<void> | null = null

  private constructor(queryClient: QueryClient) {
    this.queryClient = queryClient
  }

  static getInstance(queryClient: QueryClient): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService(queryClient)
    }
    return SocketService.instance
  }

  async connect(): Promise<void> {
    try {
      const token = await TokenManager.getAccessToken()
      const deviceId = await DeviceInfoService.getDeviceId()

      this.socket = io(ENV.API_BASE_URL.replace('http', 'ws'), {
        auth: { token },
        extraHeaders: {
          'x-platform': 'mobile',
          'x-device-id': deviceId
        }
      })

      this.setupEventHandlers()
    } catch (error) {
      const socketError = SocketErrorMapper.toSocketError(error)
      useSocketStore.getState().updateConnectionState('error')
      throw socketError
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return

    this.socket.on('connect', () => {
      useSocketStore.getState().updateConnectionState('connected')
      useSocketStore.getState().resetReconnectAttempts()
    })

    this.socket.on('notification', (data: SocketAPI.SocketMessage) => {
      const notification = NotificationMapper.toApp(data.data, 'socket')
      useNotificationStore.getState().addNotification(notification)

      // Invalidar queries relacionadas
      this.queryClient.invalidateQueries({ queryKey: ['notifications'] })
    })

    this.socket.on('disconnect', () => {
      useSocketStore.getState().updateConnectionState('disconnected')
    })
  }

  emit(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    }
  }
}
```

---

*🎯 Mappers siguiendo exactamente los patrones existentes de la arquitectura Coyotito*