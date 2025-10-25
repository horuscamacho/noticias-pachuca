import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { QueryClient } from '@tanstack/react-query'
import { NotificationApp, PermissionStatus } from '../types/notification.types'
import { NotificationMapper, SocketErrorMapper } from '../utils/socketMappers'

export class PushNotificationService {
  private static instance: PushNotificationService | null = null
  private queryClient: QueryClient
  private foregroundSubscription: Notifications.Subscription | null = null
  private responseSubscription: Notifications.Subscription | null = null

  private constructor(queryClient: QueryClient) {
    this.queryClient = queryClient
  }

  static getInstance(queryClient: QueryClient): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService(queryClient)
    }
    return PushNotificationService.instance
  }

  async initialize(): Promise<void> {
    if (!Device.isDevice) {
      throw new Error('Push notifications require a physical device')
    }

    await this.setupNotificationChannel()
    this.setupNotificationHandler()
    this.setupEventListeners()
  }

  private async setupNotificationChannel(): Promise<void> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        showBadge: true
      })
    }
  }

  private setupNotificationHandler(): void {
    Notifications.setNotificationHandler({
      handleNotification: async () => {
        const settings = this.getNotificationSettings()
        return {
          shouldShowAlert: settings.enabled,
          shouldPlaySound: settings.soundEnabled,
          shouldSetBadge: settings.badgeEnabled,
        }
      }
    })
  }

  private setupEventListeners(): void {
    this.foregroundSubscription = Notifications.addNotificationReceivedListener(
      this.handleForegroundNotification.bind(this)
    )

    this.responseSubscription = Notifications.addNotificationResponseReceivedListener(
      this.handleNotificationResponse.bind(this)
    )
  }

  private handleForegroundNotification(notification: Notifications.Notification): void {
    try {
      const appNotification = NotificationMapper.toApp(notification.request.content as any, 'push')

      if (typeof require !== 'undefined') {
        try {
          const { useNotificationStore } = require('../stores/notificationStore')
          useNotificationStore.getState().addNotification(appNotification)
        } catch (error) {
          console.error('Error updating notification store:', error)
        }
      }

      this.queryClient.invalidateQueries({ queryKey: ['notifications'] })
    } catch (error) {
      console.error('Error handling foreground notification:', error)
    }
  }

  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    try {
      const notification = response.notification
      const appNotification = NotificationMapper.toApp(notification.request.content as any, 'push')

      if (typeof require !== 'undefined') {
        try {
          const { useNotificationStore } = require('../stores/notificationStore')
          useNotificationStore.getState().markAsRead(appNotification.id)
        } catch (error) {
          console.error('Error marking notification as read:', error)
        }
      }

      if (appNotification.actionUrl) {
        console.log('Handle notification action:', appNotification.actionUrl)
      }
    } catch (error) {
      console.error('Error handling notification response:', error)
    }
  }

  private getNotificationSettings(): NotificationApp.NotificationSettings {
    try {
      if (typeof require !== 'undefined') {
        const { useNotificationStore } = require('../stores/notificationStore')
        return useNotificationStore.getState().settings
      }
    } catch (error) {
      // Fallback
    }

    return {
      enabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      badgeEnabled: true,
      categories: {},
      allowCriticalAlerts: false,
      showPreviews: 'whenUnlocked'
    }
  }

  async requestPermissions(): Promise<PermissionStatus> {
    try {
      if (!Device.isDevice) return 'denied'

      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      if (existingStatus === 'granted') return 'granted'

      const { status } = await Notifications.requestPermissionsAsync()
      return status as PermissionStatus
    } catch (error) {
      console.error('Error requesting permissions:', error)
      return 'denied'
    }
  }

  async generatePushToken(): Promise<string> {
    try {
      if (!Device.isDevice) {
        throw new Error('Must use physical device for push notifications')
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID
      })

      return tokenData.data
    } catch (error) {
      throw SocketErrorMapper.toPushError(error)
    }
  }

  async scheduleLocalNotification(
    notification: Omit<NotificationApp.Notification, 'id' | 'receivedAt' | 'isRead' | 'source'>
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          priority: notification.priority === 'high' ?
            Notifications.AndroidNotificationPriority.HIGH :
            Notifications.AndroidNotificationPriority.DEFAULT
        },
        trigger: null
      })

      return notificationId
    } catch (error) {
      throw SocketErrorMapper.toPushError(error)
    }
  }

  destroy(): void {
    this.foregroundSubscription?.remove()
    this.responseSubscription?.remove()
    this.foregroundSubscription = null
    this.responseSubscription = null
  }

  get isInitialized(): boolean {
    return this.foregroundSubscription !== null && this.responseSubscription !== null
  }
}