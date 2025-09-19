// Socket types siguiendo patrón API/App namespace exacto de auth.types.ts

export namespace SocketAPI {
  // Tipos que vienen del backend SocketGateway
  export interface SocketMessage {
    id: string
    event: string
    data: Record<string, unknown>
    timestamp: string
    delivered_via: 'socket'
  }

  export interface ConnectedResponse {
    message: string
    sessionId: string
    platform: string
    timestamp: string
  }

  export interface AppStateUpdateRequest {
    appState: 'FOREGROUND' | 'BACKGROUND'
    deviceId: string
  }

  export interface PushTokenUpdateRequest {
    expoPushToken: string
    deviceId: string
  }

  export interface JoinRoomRequest {
    roomId: string
  }

  export interface LeaveRoomRequest {
    roomId: string
  }

  export interface SocketError {
    type: string
    description: string
    timestamp: string
  }
}

export namespace SocketApp {
  // Tipos para la aplicación
  export interface SocketMessage {
    id: string
    event: string
    data: Record<string, unknown>
    timestamp: Date
    deliveredVia: 'socket'
  }

  export interface ConnectionInfo {
    message: string
    sessionId: string
    platform: string
    connectedAt: Date
  }

  export interface AppStateChange {
    appState: 'foreground' | 'background'
    deviceId: string
  }

  export interface PushTokenUpdate {
    expoPushToken: string
    deviceId: string
  }

  export interface RoomAction {
    roomId: string
  }

  export interface SocketError {
    code: string
    message: string
    timestamp: Date
  }

  export interface SocketConfig {
    url: string
    reconnection: boolean
    reconnectionAttempts: number
    reconnectionDelay: number
    timeout: number
    autoConnect: boolean
  }

  export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'

  export interface ConnectionStats {
    connectedAt: Date | null
    lastPing: Date | null
    latency: number
    reconnectAttempts: number
  }
}

// Event map para type safety
export interface SocketEventMap {
  // Client to server
  'app-state-change': SocketAPI.AppStateUpdateRequest
  'update-push-token': SocketAPI.PushTokenUpdateRequest
  'join-room': SocketAPI.JoinRoomRequest
  'leave-room': SocketAPI.LeaveRoomRequest

  // Server to client
  'connected': SocketAPI.ConnectedResponse
  'notification': SocketAPI.SocketMessage
  'message': SocketAPI.SocketMessage
  'user-update': SocketAPI.SocketMessage
  'status-change': SocketAPI.SocketMessage
  'room-joined': { roomId: string; success: boolean }
  'room-left': { roomId: string; success: boolean }
  'error': SocketAPI.SocketError
  'disconnect': void

  // Connection events
  'connect': void
  'connect_error': Error
  'reconnect': number
  'reconnect_attempt': number
  'reconnect_error': Error
  'reconnect_failed': void
}