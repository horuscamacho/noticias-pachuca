import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Device from 'expo-device'
import * as Application from 'expo-application'
import { Platform } from 'react-native'
import { CONFIG } from '@/src/config/env'
import { DeviceInfo } from '@/src/types/auth.types'

export class DeviceInfoService {
  private static deviceInfo: DeviceInfo | null = null

  static async getDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem(CONFIG.STORAGE.DEVICE_ID_KEY)

      if (!deviceId) {
        // Generar un UUID simple para el dispositivo
        deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        await AsyncStorage.setItem(CONFIG.STORAGE.DEVICE_ID_KEY, deviceId)
      }

      return deviceId
    } catch (error) {
      console.error('Error getting device ID:', error)
      // Fallback a un ID temporal
      return 'device_' + Date.now()
    }
  }

  static async collect(): Promise<DeviceInfo> {
    if (this.deviceInfo) {
      return this.deviceInfo
    }

    try {
      const deviceId = await this.getDeviceId()
      const appVersion = Application.nativeApplicationVersion || '1.0.0'
      const buildNumber = Application.nativeBuildVersion || '1'

      this.deviceInfo = {
        deviceId,
        platform: Platform.OS as 'ios' | 'android',
        osVersion: Platform.Version.toString(),
        appVersion,
        buildNumber,
        model: Device.modelName || undefined,
        brand: Device.brand || undefined,
        isEmulator: !Device.isDevice
      }

      return this.deviceInfo
    } catch (error) {
      console.error('Error collecting device info:', error)

      // Fallback con información mínima
      const deviceId = await this.getDeviceId()

      this.deviceInfo = {
        deviceId,
        platform: Platform.OS as 'ios' | 'android',
        osVersion: Platform.Version.toString(),
        appVersion: '1.0.0',
        buildNumber: '1',
        isEmulator: false
      }

      return this.deviceInfo
    }
  }

  static async updateDeviceInfo(): Promise<DeviceInfo> {
    this.deviceInfo = null
    return this.collect()
  }

  static getPlatformHeaders(): Record<string, string> {
    return {
      'x-platform': Platform.OS,
      'x-platform-version': Platform.Version.toString(),
    }
  }

  static async getFullHeaders(): Promise<Record<string, string>> {
    const deviceInfo = await this.collect()

    return {
      ...this.getPlatformHeaders(),
      'x-device-id': deviceInfo.deviceId,
      'x-app-version': deviceInfo.appVersion,
      'x-build-number': deviceInfo.buildNumber,
      'x-device-model': deviceInfo.model || 'unknown',
      'x-is-emulator': deviceInfo.isEmulator.toString()
    }
  }

  static isIOS(): boolean {
    return Platform.OS === 'ios'
  }

  static isAndroid(): boolean {
    return Platform.OS === 'android'
  }

  static async isEmulator(): Promise<boolean> {
    const deviceInfo = await this.collect()
    return deviceInfo.isEmulator
  }

  static async clearDeviceId(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CONFIG.STORAGE.DEVICE_ID_KEY)
      this.deviceInfo = null
    } catch (error) {
      console.error('Error clearing device ID:', error)
    }
  }
}