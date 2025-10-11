// Socket types siguiendo patr�n API/App namespace exacto de auth.types.ts

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

  // Outlet extraction events
  export interface ExtractionStartedEvent {
    outletId: string
    outletName: string
    timestamp: string
  }

  export interface ExtractionProgressEvent {
    outletId: string
    step: 'urls_found' | 'extracting_content' | 'content_extracted' | 'content_error'
    urlsFound?: number
    currentUrl?: string
    currentTitle?: string
    currentIndex?: number
    totalUrls: number
    contentExtracted: number
    percentage: number
    error?: string
    timestamp: string
  }

  export interface ExtractionCompletedEvent {
    outletId: string
    outletName: string
    totalUrls: number
    totalContent: number
    duration: number
    percentage: number
    timestamp: string
  }

  export interface ExtractionFailedEvent {
    outletId: string
    error: string
    urlsFound: number
    contentExtracted: number
    timestamp: string
  }

  // Content generation events
  export interface ContentGenerationStartedEvent {
    extractedContentId: string
    agentId: string
    agentName: string
    timestamp: string
  }

  export interface ContentGenerationCompletedEvent {
    extractedContentId: string
    generatedContentId: string
    agentId: string
    agentName: string
    timestamp: string
  }

  export interface ContentGenerationFailedEvent {
    extractedContentId: string
    agentId: string
    error: string
    timestamp: string
  }

  // Image generation events
  export interface ImageGenerationStartedEvent {
    jobId: string | number
    generationId: string
    prompt: string
    timestamp: string
  }

  export interface ImageGenerationProgressEvent {
    jobId: string | number
    generationId: string
    step: 'validating' | 'generating' | 'watermarking' | 'uploading' | 'saving'
    progress: number
    message?: string
    timestamp: string
  }

  export interface ImageGenerationCompletedEvent {
    jobId: string | number
    generationId: string
    imageUrl: string
    generationTime: number
    cost: number
    timestamp: string
  }

  export interface ImageGenerationFailedEvent {
    jobId: string | number
    generationId: string
    error: string
    timestamp: string
  }
}

export namespace SocketApp {
  // Tipos para la aplicaci�n
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

  // Outlet extraction events (Server to client)
  'outlet:extraction-started': SocketAPI.ExtractionStartedEvent
  'outlet:extraction-progress': SocketAPI.ExtractionProgressEvent
  'outlet:extraction-completed': SocketAPI.ExtractionCompletedEvent
  'outlet:extraction-failed': SocketAPI.ExtractionFailedEvent

  // Content generation events (Server to client)
  'content:generation-started': SocketAPI.ContentGenerationStartedEvent
  'content:generation-completed': SocketAPI.ContentGenerationCompletedEvent
  'content:generation-failed': SocketAPI.ContentGenerationFailedEvent

  // Image generation events (Server to client)
  'image-generation:started': SocketAPI.ImageGenerationStartedEvent
  'image-generation:progress': SocketAPI.ImageGenerationProgressEvent
  'image-generation:completed': SocketAPI.ImageGenerationCompletedEvent
  'image-generation:failed': SocketAPI.ImageGenerationFailedEvent
}