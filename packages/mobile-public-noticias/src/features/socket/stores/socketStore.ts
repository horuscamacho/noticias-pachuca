import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SocketApp } from '../types/socket.types'

export interface SocketState {
  connectionState: SocketApp.ConnectionState
  lastConnected: Date | null
  reconnectAttempts: number
  isOnline: boolean
  latency: number
  roomsJoined: string[]
  sessionId: string | null
}

export interface SocketActions {
  updateConnectionState: (state: SocketApp.ConnectionState) => void
  setLastConnected: (date: Date) => void
  incrementReconnectAttempts: () => void
  resetReconnectAttempts: () => void
  joinRoom: (roomId: string) => void
  leaveRoom: (roomId: string) => void
  reset: () => void
}

export type SocketStore = SocketState & SocketActions

const initialState: SocketState = {
  connectionState: 'disconnected',
  lastConnected: null,
  reconnectAttempts: 0,
  isOnline: false,
  latency: 0,
  roomsJoined: [],
  sessionId: null
}

export const useSocketStore = create<SocketStore>()(
  persist(
    (set) => ({
      ...initialState,

      updateConnectionState: (state) => {
        set({
          connectionState: state,
          isOnline: state === 'connected'
        })
      },

      setLastConnected: (date) => {
        set({ lastConnected: date })
      },

      incrementReconnectAttempts: () => {
        set((state) => ({
          reconnectAttempts: state.reconnectAttempts + 1
        }))
      },

      resetReconnectAttempts: () => {
        set({ reconnectAttempts: 0 })
      },

      joinRoom: (roomId) => {
        set((state) => ({
          roomsJoined: [...new Set([...state.roomsJoined, roomId])]
        }))
      },

      leaveRoom: (roomId) => {
        set((state) => ({
          roomsJoined: state.roomsJoined.filter(id => id !== roomId)
        }))
      },

      reset: () => {
        set(initialState)
      }
    }),
    {
      name: 'socket-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        roomsJoined: state.roomsJoined,
        lastConnected: state.lastConnected
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.connectionState = 'disconnected'
          state.isOnline = false
          state.reconnectAttempts = 0
          state.latency = 0
          state.sessionId = null
        }
      }
    }
  )
)