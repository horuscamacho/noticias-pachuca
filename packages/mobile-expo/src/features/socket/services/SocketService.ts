import { io, Socket } from 'socket.io-client'
import { QueryClient } from '@tanstack/react-query'
import { SocketEventMap, SocketApp, SocketAPI } from '../types/socket.types'
import { SocketMapper, SocketErrorMapper, NotificationMapper } from '../utils/socketMappers'
import { TokenManager } from '@/src/services/auth/TokenManager'
import { DeviceInfoService } from '@/src/services/auth/DeviceInfoService'
import { ENV } from '@/src/config/env'

export class SocketService {
  private static instance: SocketService | null = null
  private socket: Socket | null = null
  private queryClient: QueryClient
  private connectionPromise: Promise<void> | null = null

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
    // Solo una conexi�n simult�nea (como refreshPromise en ApiClient)
    if (!this.connectionPromise) {
      this.connectionPromise = this.performConnection()
    }

    try {
      await this.connectionPromise
    } finally {
      this.connectionPromise = null
    }
  }

  private async performConnection(): Promise<void> {
    try {
      // Obtener token y device info usando servicios existentes
      const token = await TokenManager.getAccessToken()
      const deviceId = await DeviceInfoService.getDeviceId()

      if (!token) {
        throw new Error('No access token available for socket connection')
      }

      // Configurar socket URL (sin el path /api)
      const socketUrl = ENV.API_BASE_URL.replace(/^https?/, 'ws').replace('/api', '')
      console.log('🔌 Connecting to socket URL:', socketUrl)
      console.log('🔌 Using token:', token ? `${token.substring(0, 20)}...` : 'null')

      this.socket = io(socketUrl, {
        auth: { token },
        extraHeaders: {
          'authorization': `Bearer ${token}`,
          'x-platform': 'mobile',
          'x-device-id': deviceId
        },
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000
      })

      this.setupEventHandlers()

      // Conectar y esperar evento 'connect'
      return new Promise((resolve, reject) => {
        this.socket!.once('connect', () => {
          console.log('🔌 Socket connected successfully!')
          this.updateConnectionState('connected')
          resolve()
        })

        this.socket!.once('connect_error', (error) => {
          console.log('🔌 Socket connection error:', error)
          this.updateConnectionState('error')
          reject(SocketErrorMapper.toSocketError(error))
        })

        this.socket!.connect()
        this.updateConnectionState('connecting')
        console.log('🔌 Socket connection initiated')
      })
    } catch (error) {
      this.updateConnectionState('error')
      throw SocketErrorMapper.toSocketError(error)
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return

    // Connection events
    this.socket.on('connect', () => this.updateConnectionState('connected'))
    this.socket.on('disconnect', () => this.updateConnectionState('disconnected'))
    this.socket.on('connect_error', (error) => {
      this.updateConnectionState('error')
      console.error('Socket connection error:', error)
    })

    // Backend specific events
    this.socket.on('notification', (data: SocketAPI.SocketMessage) => {
      this.handleNotification(data)
    })

    this.socket.on('message', (data: SocketAPI.SocketMessage) => {
      this.handleMessage(data)
    })
  }

  private handleNotification(data: SocketAPI.SocketMessage): void {
    try {
      const notification = NotificationMapper.toApp(data.data as any, 'socket')
      // Invalidar queries relacionadas
      this.queryClient.invalidateQueries({ queryKey: ['notifications'] })
    } catch (error) {
      console.error('Error handling notification:', error)
    }
  }

  private handleMessage(data: SocketAPI.SocketMessage): void {
    try {
      // Invalidar queries de mensajes si tiene roomId
      if (data.data && typeof data.data === 'object' && 'roomId' in data.data) {
        this.queryClient.invalidateQueries({
          queryKey: ['messages', data.data.roomId]
        })
      }
    } catch (error) {
      console.error('Error handling message:', error)
    }
  }

  private updateConnectionState(state: SocketApp.ConnectionState): void {
    console.log('🔌 Updating socket connection state to:', state)
    // Actualizar store cuando est� disponible
    if (typeof require !== 'undefined') {
      try {
        const { useSocketStore } = require('../stores/socketStore')
        useSocketStore.getState().updateConnectionState(state)
        console.log('🔌 Socket store updated successfully')
      } catch (error) {
        console.log('🔌 Socket store not available yet:', error)
        // Store a�n no disponible, silenciar
      }
    }
  }

  // Public methods
  emit<K extends keyof SocketEventMap>(event: K, data: SocketEventMap[K]): boolean {
    if (this.socket?.connected) {
      this.socket.emit(event as string, data)
      return true
    }
    return false
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.updateConnectionState('disconnected')
  }

  // Convenience methods
  async updateAppState(appState: 'foreground' | 'background'): Promise<void> {
    try {
      const deviceId = await DeviceInfoService.getDeviceId()
      const request = SocketMapper.appStateChangeToAPI({ appState, deviceId })
      this.emit('app-state-change', request)
    } catch (error) {
      console.error('Error updating app state:', error)
    }
  }

  joinRoom(roomId: string): void {
    const request = SocketMapper.roomActionToAPI({ roomId })
    this.emit('join-room', request)
  }

  leaveRoom(roomId: string): void {
    const request = SocketMapper.roomActionToAPI({ roomId })
    this.emit('leave-room', request)
  }

  // Getters
  get isConnected(): boolean {
    return this.socket?.connected || false
  }

  get connectionState(): SocketApp.ConnectionState {
    if (!this.socket) return 'disconnected'
    if (this.socket.connected) return 'connected'
    if (this.socket.connecting) return 'connecting'
    return 'disconnected'
  }
}