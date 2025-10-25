// features/responsive/services/DeviceDetectionService.ts
// ✅ PATRÓN - Clase singleton como ApiClient y AuthService

import { Dimensions } from 'react-native'
import { ResponsiveApp, RESPONSIVE_BREAKPOINTS } from '../types'

export class DeviceDetectionService {
  private static instance: DeviceDetectionService | null = null

  static getInstance(): DeviceDetectionService {
    if (!DeviceDetectionService.instance) {
      DeviceDetectionService.instance = new DeviceDetectionService()
    }
    return DeviceDetectionService.instance
  }

  // ✅ PATRÓN - Método público que devuelve datos tipados
  getCurrentDeviceInfo(): ResponsiveApp.DeviceInfo {
    const { width, height } = Dimensions.get('window')
    const aspectRatio = width / height
    const isLandscape = width > height
    const type = this.getDeviceType(width)

    return {
      type,
      orientation: isLandscape ? 'landscape' : 'portrait',
      width,
      height,
      aspectRatio,
      isLandscape
    }
  }

  private getDeviceType(width: number): ResponsiveApp.DeviceType {
    return width >= RESPONSIVE_BREAKPOINTS.tablet ? 'tablet' : 'phone'
  }

  // ✅ PATRÓN - Utilidad para responsive values
  getResponsiveValue<T>(
    config: ResponsiveApp.ResponsiveConfig<T>,
    deviceInfo: ResponsiveApp.DeviceInfo,
    fallback: T
  ): T {
    // Prioridad: orientación específica > tipo dispositivo > fallback
    if (deviceInfo.isLandscape && config.landscape !== undefined) {
      return config.landscape
    }

    if (!deviceInfo.isLandscape && config.portrait !== undefined) {
      return config.portrait
    }

    if (deviceInfo.type === 'tablet' && config.tablet !== undefined) {
      return config.tablet
    }

    if (config.phone !== undefined) {
      return config.phone
    }

    return fallback
  }

  // ✅ PATRÓN - Método para debug como en otros servicios
  logDeviceInfo(): void {
    const deviceInfo = this.getCurrentDeviceInfo()
    console.log('📱 Device Info:', {
      type: deviceInfo.type,
      orientation: deviceInfo.orientation,
      dimensions: `${deviceInfo.width}x${deviceInfo.height}`,
      aspectRatio: deviceInfo.aspectRatio.toFixed(2)
    })
  }
}