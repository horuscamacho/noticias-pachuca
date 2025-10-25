import { useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { useNotificationStore } from '../stores/notificationStore'
import { useAuth } from '@/src/hooks/useAuth'
import { SocketService } from '../services/SocketService'
import { NotificationMapper, SocketErrorMapper } from '../utils/socketMappers'
import { NotificationApp, PermissionStatus } from '../types/notification.types'

export const useNotifications = () => {
  const queryClient = useQueryClient()
  const { isAuthenticated, user } = useAuth()
  const {
    notifications,
    unreadCount,
    pushToken,
    permissionStatus,
    settings,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    updatePushToken,
    updatePermissionStatus
  } = useNotificationStore()

  // Auto-setup notifications cuando el usuario está autenticado
  useEffect(() => {
    if (isAuthenticated && Device.isDevice) {
      setupNotifications().catch(error => {
        console.error('Notification setup failed:', error)
      })
    }
  }, [isAuthenticated])

  // Configurar handlers de notificaciones
  useEffect(() => {
    if (!Device.isDevice) return

    // Handler para notificaciones recibidas en foreground
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      const appNotification = NotificationMapper.toApp(notification.request.content as any, 'push')
      addNotification(appNotification)
    })

    // Handler para respuestas a notificaciones
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      const notification = response.notification
      const appNotification = NotificationMapper.toApp(notification.request.content as any, 'push')

      // Marcar como leída y navegar si hay actionUrl
      markAsRead(appNotification.id)

      if (appNotification.actionUrl) {
        // TODO: Integrar con navegación cuando esté disponible
        console.log('Navigate to:', appNotification.actionUrl)
      }
    })

    return () => {
      foregroundSubscription.remove()
      responseSubscription.remove()
    }
  }, [addNotification, markAsRead])

  const setupNotifications = useCallback(async (): Promise<void> => {
    try {
      if (!Device.isDevice) {
        throw new Error('Must use physical device for push notifications')
      }

      // Solicitar permisos
      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }

      updatePermissionStatus(finalStatus as PermissionStatus)

      if (finalStatus !== 'granted') {
        throw new Error('Permission not granted for push notifications')
      }

      // Configurar canal de notificaciones para Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
          enableVibrate: true
        })
      }

      // Configurar comportamiento de notificaciones
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: settings.enabled,
          shouldPlaySound: settings.soundEnabled,
          shouldSetBadge: settings.badgeEnabled,
        }),
      })

      // Obtener token de push
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID
      })

      updatePushToken(tokenData.data)

      // Registrar token en el backend
      await registerPushToken(tokenData.data)

    } catch (error) {
      console.error('Error setting up notifications:', error)
      throw SocketErrorMapper.toPushError(error)
    }
  }, [updatePermissionStatus, updatePushToken, settings])

  const registerPushToken = useCallback(async (token: string): Promise<void> => {
    if (!isAuthenticated || !user) return

    try {
      const socketService = SocketService.getInstance(queryClient)

      // Usar el método del SocketService cuando esté disponible
      if (socketService.isConnected) {
        // TODO: Implementar método updatePushToken en SocketService
        socketService.emit('push-token-update', {
          expoPushToken: token,
          deviceId: await import('@/src/services/auth/DeviceInfoService').then(m => m.DeviceInfoService.getDeviceId())
        })
      } else {
        // Fallback: usar API directamente
        // TODO: Implementar llamada a API para registrar push token
        console.log('Socket not connected, should register via API')
      }
    } catch (error) {
      console.error('Error registering push token:', error)
      throw SocketErrorMapper.toPushError(error)
    }
  }, [isAuthenticated, user, queryClient])

  const requestPermissions = useCallback(async (): Promise<PermissionStatus> => {
    try {
      if (!Device.isDevice) {
        updatePermissionStatus('denied')
        return 'denied'
      }

      const { status } = await Notifications.requestPermissionsAsync()
      updatePermissionStatus(status as PermissionStatus)

      if (status === 'granted') {
        await setupNotifications()
      }

      return status as PermissionStatus
    } catch (error) {
      console.error('Error requesting permissions:', error)
      updatePermissionStatus('denied')
      return 'denied'
    }
  }, [updatePermissionStatus, setupNotifications])

  const sendLocalNotification = useCallback(async (
    notification: Omit<NotificationApp.Notification, 'id' | 'receivedAt' | 'isRead' | 'source'>
  ): Promise<void> => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          priority: notification.priority === 'high' ?
            Notifications.AndroidNotificationPriority.HIGH :
            Notifications.AndroidNotificationPriority.DEFAULT
        },
        trigger: null // Inmediata
      })
    } catch (error) {
      console.error('Error sending local notification:', error)
      throw SocketErrorMapper.toPushError(error)
    }
  }, [])

  const getNotificationById = useCallback((id: string): NotificationApp.Notification | undefined => {
    return notifications.find(notification => notification.id === id)
  }, [notifications])

  const getUnreadNotifications = useCallback((): NotificationApp.Notification[] => {
    return notifications.filter(notification => !notification.isRead)
  }, [notifications])

  const getNotificationsByType = useCallback((type: string): NotificationApp.Notification[] => {
    return notifications.filter(notification => notification.type === type)
  }, [notifications])

  return {
    // Estado
    notifications,
    unreadCount,
    pushToken,
    permissionStatus,
    settings,

    // Acciones principales
    setupNotifications,
    requestPermissions,
    registerPushToken,
    sendLocalNotification,

    // Gestión de notificaciones
    markAsRead,
    markAllAsRead,
    clearNotifications,

    // Utilidades
    getNotificationById,
    getUnreadNotifications,
    getNotificationsByType,

    // Estados derivados
    hasPermission: permissionStatus === 'granted',
    canReceivePush: Device.isDevice && permissionStatus === 'granted' && !!pushToken,
    isSetupComplete: !!pushToken && permissionStatus === 'granted'
  }
}