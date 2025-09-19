import { useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AppState } from 'react-native'
import { useSocketStore } from '../stores/socketStore'
import { useAuth } from '@/src/hooks/useAuth'
import { SocketService } from '../services/SocketService'

export const useSocket = () => {
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuth()
  const {
    connectionState,
    isOnline,
    lastConnected,
    roomsJoined,
    joinRoom: storeJoinRoom,
    leaveRoom: storeLeaveRoom,
    reset
  } = useSocketStore()

  // Auto-connect cuando el usuario esté autenticado
  useEffect(() => {
    if (isAuthenticated) {
      const socketService = SocketService.getInstance(queryClient)
      socketService.connect().catch(error => {
        console.error('Socket connection failed:', error)
      })
    } else {
      const socketService = SocketService.getInstance(queryClient)
      socketService.disconnect()
      reset()
    }
  }, [isAuthenticated, queryClient, reset])

  // Métodos de conveniencia
  const connect = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('User must be authenticated to connect socket')
    }

    const socketService = SocketService.getInstance(queryClient)
    await socketService.connect()
  }, [isAuthenticated, queryClient])

  const disconnect = useCallback(() => {
    const socketService = SocketService.getInstance(queryClient)
    socketService.disconnect()
  }, [queryClient])

  const joinRoom = useCallback((roomId: string) => {
    const socketService = SocketService.getInstance(queryClient)
    socketService.joinRoom(roomId)
    storeJoinRoom(roomId)
  }, [queryClient, storeJoinRoom])

  const leaveRoom = useCallback((roomId: string) => {
    const socketService = SocketService.getInstance(queryClient)
    socketService.leaveRoom(roomId)
    storeLeaveRoom(roomId)
  }, [queryClient, storeLeaveRoom])

  return {
    // Estado
    connectionState,
    isConnected: isOnline,
    lastConnected,
    roomsJoined,

    // Métodos
    connect,
    disconnect,
    joinRoom,
    leaveRoom,

    // Utilidades
    isAuthenticatedAndConnected: isAuthenticated && isOnline
  }
}