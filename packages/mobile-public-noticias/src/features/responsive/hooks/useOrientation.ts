// features/responsive/hooks/useOrientation.ts
// ✅ PATRÓN - Hook especializado como useBiometric

import { useEffect, useCallback } from 'react'
import { useResponsive } from './useResponsive'
import { ResponsiveApp } from '../types'
import * as ScreenOrientation from 'expo-screen-orientation'

interface UseOrientationProps {
  screenName?: string
  lockMode?: ResponsiveApp.OrientationLock['mode']
  onOrientationChange?: (orientation: ResponsiveApp.OrientationType) => void
}

export const useOrientation = (props?: UseOrientationProps) => {
  const {
    orientation,
    isLandscape,
    lockOrientation,
    unlockOrientation,
    orientationLocks
  } = useResponsive()

  // ✅ PATRÓN - Effect para aplicar locks como en useBiometric
  useEffect(() => {
    if (props?.screenName && props?.lockMode) {
      const lockConfig: ResponsiveApp.OrientationLock = {
        mode: props.lockMode
      }

      lockOrientation(props.screenName, lockConfig)
      applyOrientationLock(props.lockMode)

      // Cleanup al desmontar
      return () => {
        unlockOrientation(props.screenName)
        ScreenOrientation.unlockAsync()
      }
    }
  }, [props?.screenName, props?.lockMode, lockOrientation, unlockOrientation])

  // ✅ PATRÓN - Callback para notificar cambios
  useEffect(() => {
    props?.onOrientationChange?.(orientation)
  }, [orientation, props?.onOrientationChange])

  // ✅ PATRÓN - Método privado para aplicar locks
  const applyOrientationLock = useCallback(async (mode: ResponsiveApp.OrientationLock['mode']) => {
    try {
      switch (mode) {
        case 'portrait':
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP)
          break
        case 'landscape':
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE)
          break
        case 'auto':
        default:
          await ScreenOrientation.unlockAsync()
          break
      }
    } catch (error) {
      console.warn('Failed to apply orientation lock:', error)
    }
  }, [])

  // ✅ PATRÓN - Métodos públicos para control manual
  const lockToPortrait = useCallback(() => {
    applyOrientationLock('portrait')
  }, [applyOrientationLock])

  const lockToLandscape = useCallback(() => {
    applyOrientationLock('landscape')
  }, [applyOrientationLock])

  const unlock = useCallback(() => {
    applyOrientationLock('auto')
  }, [applyOrientationLock])

  return {
    // Estado actual
    orientation,
    isLandscape,
    isPortrait: !isLandscape,

    // Configuraciones activas
    currentLock: props?.screenName ? orientationLocks[props.screenName] : null,

    // Métodos de control
    lockToPortrait,
    lockToLandscape,
    unlock
  }
}