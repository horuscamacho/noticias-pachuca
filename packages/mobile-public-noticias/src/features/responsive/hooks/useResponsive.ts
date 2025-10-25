// features/responsive/hooks/useResponsive.ts
// ✅ PATRÓN - Siguiendo estructura de useAuth

import { useState, useEffect, useCallback } from 'react'
import { Dimensions } from 'react-native'
import { useResponsiveStore } from '../stores/responsiveStore'
import { DeviceDetectionService } from '../services/DeviceDetectionService'
import { ResponsiveApp } from '../types'

export const useResponsive = () => {
  const {
    deviceInfo,
    updateDeviceInfo,
    orientationLocks,
    setOrientationLock,
    removeOrientationLock
  } = useResponsiveStore()

  const deviceService = DeviceDetectionService.getInstance()

  // ✅ PATRÓN - Estado local para cambios inmediatos
  const [isUpdating, setIsUpdating] = useState(false)

  // ✅ PATRÓN - Effect para suscribirse a cambios como en useAuth
  useEffect(() => {
    // Actualizar estado inicial
    const currentDeviceInfo = deviceService.getCurrentDeviceInfo()
    updateDeviceInfo(currentDeviceInfo)

    // Suscribirse a cambios de dimensiones
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setIsUpdating(true)

      const newDeviceInfo = deviceService.getCurrentDeviceInfo()
      updateDeviceInfo(newDeviceInfo)

      setIsUpdating(false)
    })

    return () => subscription?.remove()
  }, [updateDeviceInfo])

  // ✅ PATRÓN - Método de conveniencia como en useAuth
  const getResponsiveValue = useCallback(<T>(
    config: ResponsiveApp.ResponsiveConfig<T>,
    fallback: T
  ): T => {
    return deviceService.getResponsiveValue(config, deviceInfo, fallback)
  }, [deviceInfo, deviceService])

  // ✅ PATRÓN - Métodos para gestión de orientación
  const lockOrientation = useCallback((
    screenName: string,
    lock: ResponsiveApp.OrientationLock
  ) => {
    setOrientationLock(screenName, lock)
  }, [setOrientationLock])

  const unlockOrientation = useCallback((screenName: string) => {
    removeOrientationLock(screenName)
  }, [removeOrientationLock])

  // ✅ PATRÓN - Método de debug como en useAuth
  const logDeviceInfo = useCallback(() => {
    deviceService.logDeviceInfo()
  }, [deviceService])

  return {
    // ✅ PATRÓN - Estado expuesto como en useAuth
    deviceInfo,
    deviceType: deviceInfo.type,
    orientation: deviceInfo.orientation,
    isLandscape: deviceInfo.isLandscape,
    isTablet: deviceInfo.type === 'tablet',
    isPhone: deviceInfo.type === 'phone',

    // Estados de carga
    isUpdating,

    // Métodos
    getResponsiveValue,
    lockOrientation,
    unlockOrientation,
    logDeviceInfo,

    // Configuraciones activas
    orientationLocks
  }
}