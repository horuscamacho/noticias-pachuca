// Notification types siguiendo patrón API/App namespace

export namespace NotificationAPI {
  // Del backend NotificationRouterService
  export interface PushNotification {
    id: string
    type: string
    title: string
    body: string
    data?: Record<string, unknown>
    actionUrl?: string
    imageUrl?: string
    priority: 'low' | 'normal' | 'high' | 'urgent'
    timestamp: string
  }

  export interface NotificationDelivery {
    success: boolean
    socketsSent: number
    pushSent: number
    errors: string[]
    queueId?: string
  }

  export interface ExpoPushToken {
    data: string
    type: 'expo'
  }
}

export namespace NotificationApp {
  // Para la aplicación
  export interface Notification {
    id: string
    type: string
    title: string
    body: string
    data?: Record<string, unknown>
    actionUrl?: string
    imageUrl?: string
    priority: 'low' | 'normal' | 'high' | 'urgent'
    receivedAt: Date
    isRead: boolean
    source: 'push' | 'socket'
  }

  export interface NotificationSettings {
    enabled: boolean
    soundEnabled: boolean
    vibrationEnabled: boolean
    badgeEnabled: boolean
    categories: {
      [key: string]: boolean
    }
    allowCriticalAlerts: boolean
    showPreviews: 'always' | 'whenUnlocked' | 'never'
  }

  export interface PushToken {
    token: string
    type: 'expo'
    generatedAt: Date
    isValid: boolean
  }

  export interface NotificationPermission {
    status: 'undetermined' | 'denied' | 'granted'
    canAskAgain: boolean
    expires: 'never' | number
  }

  export interface NotificationError {
    code: string
    message: string
    timestamp: Date
    type: 'permission' | 'token' | 'delivery' | 'unknown'
  }
}

// Permission status type
export type PermissionStatus = 'undetermined' | 'denied' | 'granted'

// Notification priority levels
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

// Notification source
export type NotificationSource = 'push' | 'socket'