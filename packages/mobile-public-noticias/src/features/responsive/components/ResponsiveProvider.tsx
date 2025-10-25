// features/responsive/components/ResponsiveProvider.tsx
// ✅ PATRÓN - Provider siguiendo estructura de AnalyticsProvider

import React, { useEffect } from 'react'
import { useResponsive } from '../hooks/useResponsive'

interface ResponsiveProviderProps {
  children: React.ReactNode
}

export const ResponsiveProvider: React.FC<ResponsiveProviderProps> = ({ children }) => {
  const { deviceType, orientation, logDeviceInfo } = useResponsive()

  // ✅ PATRÓN - Logging para debug como en AnalyticsProvider
  useEffect(() => {
    console.log('📱 Device Info Updated:', { deviceType, orientation })
    logDeviceInfo()
  }, [deviceType, orientation, logDeviceInfo])

  // ✅ PATRÓN - Solo envolver children sin modificarlos
  return <>{children}</>
}