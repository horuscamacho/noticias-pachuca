import { SocketAPI, SocketApp } from '../types/socket.types'
import { NotificationAPI, NotificationApp } from '../types/notification.types'
import { ErrorMapper } from '@/src/utils/mappers'

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

  static roomActionToAPI(roomAction: SocketApp.RoomAction): SocketAPI.JoinRoomRequest {
    return {
      roomId: roomAction.roomId
    }
  }
}

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

  static pushTokenToApp(apiToken: NotificationAPI.ExpoPushToken): NotificationApp.PushToken {
    return {
      token: apiToken.data,
      type: 'expo',
      generatedAt: new Date(),
      isValid: true
    }
  }
}

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
        timestamp: new Date(),
        type: 'delivery'
      }
    }

    return {
      code: 'PUSH_UNKNOWN_ERROR',
      message: 'Unknown push notification error',
      timestamp: new Date(),
      type: 'unknown'
    }
  }
}