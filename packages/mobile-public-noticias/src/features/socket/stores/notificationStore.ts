import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NotificationApp, PermissionStatus } from '../types/notification.types'

export interface NotificationState {
  notifications: NotificationApp.Notification[]
  unreadCount: number
  pushToken: string | null
  permissionStatus: PermissionStatus
  lastNotificationId: string | null
  settings: NotificationApp.NotificationSettings
}

export interface NotificationActions {
  addNotification: (notification: NotificationApp.Notification) => void
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
  updatePushToken: (token: string | null) => void
  updatePermissionStatus: (status: PermissionStatus) => void
  reset: () => void
}

export type NotificationStore = NotificationState & NotificationActions

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  pushToken: null,
  permissionStatus: 'undetermined',
  lastNotificationId: null,
  settings: {
    enabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    badgeEnabled: true,
    categories: {},
    allowCriticalAlerts: false,
    showPreviews: 'whenUnlocked'
  }
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      ...initialState,

      addNotification: (notification) => {
        set((state) => {
          const newNotifications = [notification, ...state.notifications].slice(0, 50)
          const unreadCount = newNotifications.filter(n => !n.isRead).length

          return {
            notifications: newNotifications,
            unreadCount,
            lastNotificationId: notification.id
          }
        })
      },

      markAsRead: (notificationId) => {
        set((state) => {
          const notifications = state.notifications.map(notification =>
            notification.id === notificationId
              ? { ...notification, isRead: true }
              : notification
          )
          const unreadCount = notifications.filter(n => !n.isRead).length

          return { notifications, unreadCount }
        })
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map(notification => ({
            ...notification,
            isRead: true
          })),
          unreadCount: 0
        }))
      },

      clearNotifications: () => {
        set({
          notifications: [],
          unreadCount: 0,
          lastNotificationId: null
        })
      },

      updatePushToken: (token) => {
        set({ pushToken: token })
      },

      updatePermissionStatus: (status) => {
        set({ permissionStatus: status })
      },

      reset: () => {
        set(initialState)
      }
    }),
    {
      name: 'notification-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        pushToken: state.pushToken,
        permissionStatus: state.permissionStatus,
        settings: state.settings
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.notifications = []
          state.unreadCount = 0
          state.lastNotificationId = null
        }
      }
    }
  )
)