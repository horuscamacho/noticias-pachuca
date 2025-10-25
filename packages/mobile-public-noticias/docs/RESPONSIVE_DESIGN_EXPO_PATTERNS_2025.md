# 📱 Patrones de Diseño Responsivo Expo 2025/2026
## Adaptado a Buenas Prácticas Noticias Pachuca

## 🎯 CONTEXTO DE INTEGRACIÓN

Este documento extiende nuestras **buenas prácticas existentes** con patrones específicos para diseño responsivo (teléfono/tablet) y manejo de orientación, siguiendo **exactamente** nuestra arquitectura feature-based establecida.

---

## 🏗️ ESTRUCTURA DE CARPETAS ADAPTADA

### 📁 Extensión de Nuestra Arquitectura Existente

```
src/
├── components/           # ✅ YA EXISTE - Mantener estructura actual
│   ├── ui/              # UI primitivos existentes
│   │   ├── ResponsiveContainer/    # 🆕 AGREGAR
│   │   │   ├── ResponsiveContainer.tsx
│   │   │   ├── ResponsiveContainer.phone.tsx
│   │   │   ├── ResponsiveContainer.tablet.tsx
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   └── AdaptiveGrid/           # 🆕 AGREGAR
│   │       ├── AdaptiveGrid.tsx
│   │       ├── types.ts
│   │       └── index.ts
│   ├── forms/           # ✅ MANTENER - Formularios existentes
│   ├── layout/          # ✅ MANTENER - Layout components
│   └── shared/          # ✅ MANTENER - Componentes compartidos
├── features/            # ✅ YA EXISTE - Feature-based architecture
│   ├── responsive/      # 🆕 AGREGAR - Feature para responsive
│   │   ├── components/  # Componentes responsivos específicos
│   │   ├── hooks/       # Hooks de responsive y orientación
│   │   ├── services/    # Servicios de detección de dispositivo
│   │   ├── stores/      # Estado Zustand para responsive
│   │   ├── types/       # Tipos TypeScript
│   │   ├── utils/       # Utilidades de breakpoints
│   │   └── index.ts     # Barrel exports
│   ├── auth/            # ✅ MANTENER - Sistema existente
│   ├── analytics/       # ✅ MANTENER - Feature existente
│   └── socket/          # ✅ MANTENER - Feature existente
├── hooks/               # ✅ YA EXISTE - Hooks globales
├── services/            # ✅ YA EXISTE - Servicios HTTP y APIs
├── stores/              # ✅ YA EXISTE - Estado global Zustand
├── types/               # ✅ YA EXISTE - Tipos TypeScript globales
├── utils/               # ✅ YA EXISTE - Utilidades globales
├── constants/           # ✅ YA EXISTE - Constantes
└── config/              # ✅ YA EXISTE - Configuración
```

---

## 📱 FEATURE RESPONSIVE - IMPLEMENTACIÓN

### 🎯 1. Tipos TypeScript (features/responsive/types/index.ts)

```typescript
// features/responsive/types/index.ts
// ✅ PATRÓN - Siguiendo namespace API/App como authStore

export namespace ResponsiveApp {
  export type DeviceType = 'phone' | 'tablet'
  export type OrientationType = 'portrait' | 'landscape'
  export type BreakpointKey = 'phone' | 'tablet'

  export interface DeviceInfo {
    type: DeviceType
    orientation: OrientationType
    width: number
    height: number
    aspectRatio: number
    isLandscape: boolean
  }

  export interface ResponsiveConfig<T> {
    phone?: T
    tablet?: T
    portrait?: T
    landscape?: T
  }

  export interface BreakpointConfig {
    phone: number
    tablet: number
  }

  export interface OrientationLock {
    mode: 'auto' | 'portrait' | 'landscape'
    allowedOrientations?: OrientationType[]
  }
}

// ✅ PATRÓN - Constantes como en ENV
export const RESPONSIVE_BREAKPOINTS: ResponsiveApp.BreakpointConfig = {
  phone: 0,
  tablet: 768
} as const

export const ORIENTATION_MODES = {
  AUTO: 'auto',
  PORTRAIT: 'portrait',
  LANDSCAPE: 'landscape'
} as const
```

### 🎯 2. Store Zustand (features/responsive/stores/responsiveStore.ts)

```typescript
// features/responsive/stores/responsiveStore.ts
// ✅ PATRÓN - Siguiendo estructura de authStore y appStore

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ResponsiveApp } from '../types'

export interface ResponsiveState {
  deviceInfo: ResponsiveApp.DeviceInfo
  lastUpdated: Date | null
  orientationLocks: Record<string, ResponsiveApp.OrientationLock>
}

export interface ResponsiveActions {
  updateDeviceInfo: (deviceInfo: ResponsiveApp.DeviceInfo) => void
  setOrientationLock: (screenName: string, lock: ResponsiveApp.OrientationLock) => void
  removeOrientationLock: (screenName: string) => void
  reset: () => void
}

export type ResponsiveStore = ResponsiveState & ResponsiveActions

const initialState: ResponsiveState = {
  deviceInfo: {
    type: 'phone',
    orientation: 'portrait',
    width: 375,
    height: 667,
    aspectRatio: 0.56,
    isLandscape: false
  },
  lastUpdated: null,
  orientationLocks: {}
}

export const useResponsiveStore = create<ResponsiveStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      updateDeviceInfo: (deviceInfo) => {
        set({
          deviceInfo,
          lastUpdated: new Date()
        })
      },

      setOrientationLock: (screenName, lock) => {
        set((state) => ({
          orientationLocks: {
            ...state.orientationLocks,
            [screenName]: lock
          }
        }))
      },

      removeOrientationLock: (screenName) => {
        set((state) => {
          const { [screenName]: removed, ...rest } = state.orientationLocks
          return { orientationLocks: rest }
        })
      },

      reset: () => {
        set(initialState)
      }
    }),
    {
      name: 'responsive-store',
      storage: createJSONStorage(() => AsyncStorage),
      // ✅ PATRÓN - Solo persistir configuraciones, no estado temporal
      partialize: (state) => ({
        orientationLocks: state.orientationLocks
        // NO persistir deviceInfo (cambio dinámico)
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Reset de estado temporal al hidratar
          state.deviceInfo = initialState.deviceInfo
          state.lastUpdated = null
        }
      }
    }
  )
)

// ✅ PATRÓN - Selectores optimizados como en authStore
export const useDeviceType = () => useResponsiveStore((state) => state.deviceInfo.type)
export const useOrientation = () => useResponsiveStore((state) => state.deviceInfo.orientation)
export const useDeviceInfo = () => useResponsiveStore((state) => state.deviceInfo)
```

### 🎯 3. Servicio de Detección (features/responsive/services/DeviceDetectionService.ts)

```typescript
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
}
```

### 🎯 4. Hook Principal (features/responsive/hooks/useResponsive.ts)

```typescript
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

    // Configuraciones activas
    orientationLocks
  }
}
```

### 🎯 5. Hook de Orientación (features/responsive/hooks/useOrientation.ts)

```typescript
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
```

---

## 🧩 COMPONENTES UI RESPONSIVOS

### 🎯 6. Componente Base Responsivo (components/ui/ResponsiveContainer)

```typescript
// components/ui/ResponsiveContainer/ResponsiveContainer.tsx
// ✅ PATRÓN - Componente base siguiendo estructura de ThemedText

import React from 'react'
import { View, ViewProps } from 'react-native'
import { useResponsive } from '@/src/features/responsive/hooks/useResponsive'
import { ResponsiveApp } from '@/src/features/responsive/types'
import ResponsiveContainerPhone from './ResponsiveContainer.phone'
import ResponsiveContainerTablet from './ResponsiveContainer.tablet'

export interface ResponsiveContainerProps extends ViewProps {
  children?: React.ReactNode
  responsiveProps?: ResponsiveApp.ResponsiveConfig<Partial<ViewProps>>
  phoneComponent?: React.ComponentType<any>
  tabletComponent?: React.ComponentType<any>
  fallbackComponent?: React.ComponentType<any>
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  responsiveProps,
  phoneComponent: PhoneComponent,
  tabletComponent: TabletComponent,
  fallbackComponent: FallbackComponent,
  style,
  ...viewProps
}) => {
  const { deviceType, getResponsiveValue } = useResponsive()

  // ✅ PATRÓN - Resolver props responsivos como en ThemedText
  const resolvedProps = responsiveProps
    ? getResponsiveValue(responsiveProps, {})
    : {}

  const finalProps = {
    ...viewProps,
    ...resolvedProps,
    style: [style, resolvedProps.style]
  }

  // ✅ PATRÓN - Renderizado condicional por dispositivo
  if (deviceType === 'tablet') {
    const TabletComp = TabletComponent || ResponsiveContainerTablet
    return <TabletComp {...finalProps}>{children}</TabletComp>
  }

  const PhoneComp = PhoneComponent || ResponsiveContainerPhone
  return <PhoneComp {...finalProps}>{children}</PhoneComp>
}

export default ResponsiveContainer
```

```typescript
// components/ui/ResponsiveContainer/ResponsiveContainer.phone.tsx
// ✅ PATRÓN - Variante específica como ThemedText variants

import React from 'react'
import { View, StyleSheet, ViewProps } from 'react-native'
import { useOrientation } from '@/src/features/responsive/hooks/useOrientation'

interface ResponsiveContainerPhoneProps extends ViewProps {
  children?: React.ReactNode
}

const ResponsiveContainerPhone: React.FC<ResponsiveContainerPhoneProps> = ({
  children,
  style,
  ...props
}) => {
  const { isLandscape } = useOrientation()

  const styles = createStyles(isLandscape)

  return (
    <View style={[styles.container, style]} {...props}>
      {children}
    </View>
  )
}

const createStyles = (isLandscape: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    padding: isLandscape ? 12 : 16,
    flexDirection: isLandscape ? 'row' : 'column'
  }
})

export default ResponsiveContainerPhone
```

```typescript
// components/ui/ResponsiveContainer/ResponsiveContainer.tablet.tsx
// ✅ PATRÓN - Variante para tablet

import React from 'react'
import { View, StyleSheet, ViewProps } from 'react-native'
import { useOrientation } from '@/src/features/responsive/hooks/useOrientation'

interface ResponsiveContainerTabletProps extends ViewProps {
  children?: React.ReactNode
}

const ResponsiveContainerTablet: React.FC<ResponsiveContainerTabletProps> = ({
  children,
  style,
  ...props
}) => {
  const { isLandscape } = useOrientation()

  const styles = createStyles(isLandscape)

  return (
    <View style={[styles.container, style]} {...props}>
      {children}
    </View>
  )
}

const createStyles = (isLandscape: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    padding: isLandscape ? 32 : 24,
    maxWidth: isLandscape ? undefined : 768,
    alignSelf: 'center'
  }
})

export default ResponsiveContainerTablet
```

---

## 🖼️ IMPLEMENTACIÓN EN PANTALLAS

### 🎯 7. Patrón para Pantallas Responsivas

```typescript
// app/(protected)/dashboard.tsx
// ✅ PATRÓN - Implementación en pantalla siguiendo router structure

import React from 'react'
import { View } from 'react-native'
import { Stack } from 'expo-router'
import { useOrientation } from '@/src/features/responsive/hooks/useOrientation'
import ResponsiveContainer from '@/src/components/ui/ResponsiveContainer'
import { ThemedText } from '@/src/components/ThemedText'

export default function DashboardScreen() {
  // ✅ PATRÓN - Hook de orientación con configuración por pantalla
  const { isLandscape } = useOrientation({
    screenName: 'Dashboard',
    lockMode: 'auto', // Permitir rotación libre
    onOrientationChange: (orientation) => {
      console.log('Dashboard orientation changed:', orientation)
    }
  })

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Dashboard',
          headerShown: !isLandscape // Ocultar header en landscape
        }}
      />

      <ResponsiveContainer
        responsiveProps={{
          phone: {
            style: { backgroundColor: '#f5f5f5' }
          },
          tablet: {
            style: { backgroundColor: '#ffffff' }
          },
          landscape: {
            style: { paddingHorizontal: 40 }
          },
          portrait: {
            style: { paddingHorizontal: 20 }
          }
        }}
      >
        <ThemedText variant="title">Dashboard</ThemedText>
        {/* Contenido del dashboard */}
      </ResponsiveContainer>
    </>
  )
}
```

### 🎯 8. Hook Personalizado para Pantallas

```typescript
// features/responsive/hooks/useResponsiveScreen.ts
// ✅ PATRÓN - Hook especializado para pantallas

import { useEffect } from 'react'
import { useOrientation } from './useOrientation'
import { ResponsiveApp } from '../types'

interface ResponsiveScreenConfig {
  screenName: string
  orientationLock?: ResponsiveApp.OrientationLock['mode']
  onDeviceChange?: (deviceType: ResponsiveApp.DeviceType) => void
  onOrientationChange?: (orientation: ResponsiveApp.OrientationType) => void
}

export const useResponsiveScreen = (config: ResponsiveScreenConfig) => {
  const {
    orientation,
    isLandscape,
    lockToPortrait,
    lockToLandscape,
    unlock
  } = useOrientation({
    screenName: config.screenName,
    lockMode: config.orientationLock,
    onOrientationChange: config.onOrientationChange
  })

  // ✅ PATRÓN - Auto-gestión de orientación por pantalla
  useEffect(() => {
    return () => {
      // Cleanup: restaurar orientación libre al salir
      unlock()
    }
  }, [unlock])

  return {
    orientation,
    isLandscape,
    isPortrait: !isLandscape,

    // Métodos de control
    lockToPortrait,
    lockToLandscape,
    unlock
  }
}
```

---

## 🎯 INTEGRACIÓN CON EXPO ROUTER

### 🎯 9. Layout Responsivo Global

```typescript
// app/_layout.tsx - Actualización para responsive
// ✅ PATRÓN - Integrar con layout existente

import { useFonts } from "expo-font"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { QueryClientProvider } from "@tanstack/react-query"
import queryClient from '@/src/config/queryClient'
import { AnalyticsProvider } from "@/src/features/analytics/components/AnalyticsProvider"
import { ResponsiveProvider } from "@/src/features/responsive/components/ResponsiveProvider" // 🆕

export default function RootLayout() {
  const [loaded] = useFonts({
    // ✅ MANTENER - Configuración de fuentes existente
    "Aleo-Regular": require("@/assets/fonts/Aleo-Regular.ttf"),
    // ... resto de fuentes
  })

  if (!loaded) return null

  return (
    <QueryClientProvider client={queryClient}>
      <AnalyticsProvider>
        <ResponsiveProvider> {/* 🆕 AGREGAR - Provider responsivo */}
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
            <Stack.Screen name="(protected)/dashboard" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </ResponsiveProvider>
      </AnalyticsProvider>
    </QueryClientProvider>
  )
}
```

### 🎯 10. Provider Responsivo

```typescript
// features/responsive/components/ResponsiveProvider.tsx
// ✅ PATRÓN - Provider siguiendo estructura de AnalyticsProvider

import React, { useEffect } from 'react'
import { useResponsive } from '../hooks/useResponsive'

interface ResponsiveProviderProps {
  children: React.ReactNode
}

export const ResponsiveProvider: React.FC<ResponsiveProviderProps> = ({ children }) => {
  const { deviceType, orientation } = useResponsive()

  // ✅ PATRÓN - Logging para debug como en AnalyticsProvider
  useEffect(() => {
    console.log('📱 Device Info Updated:', { deviceType, orientation })
  }, [deviceType, orientation])

  return <>{children}</>
}
```

---

## 🎛️ CONFIGURACIÓN EXPO ACTUALIZADA

### 🎯 11. App.config.js con Soporte Responsive

```javascript
// app.config.js - Actualización
// ✅ PATRÓN - Mantener configuración existente + responsive

export default {
  expo: {
    name: "Noticias Pachuca",
    slug: "noticias-pachuca-mobile",
    version: "1.0.0",

    // ✅ MANTENER - Configuración base existente
    privacy: "unlisted",
    assetBundlePatterns: ["**/*"],

    // 🆕 ACTUALIZAR - Soporte para tablets y orientación
    orientation: "default", // Cambiar de "portrait" a "default"

    ios: {
      supportsTablet: true,        // 🆕 CAMBIAR - Habilitar tablets
      requireFullScreen: false,    // 🆕 CAMBIAR - Permitir split view
      bundleIdentifier: "com.noticiaspachuca.mobile"
    },

    android: {
      package: "com.noticiaspachuca.mobile",
      versionCode: 1,
      // 🆕 AGREGAR - Configuración responsiva Android
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      },
      permissions: [
        "USE_BIOMETRIC",
        "USE_FINGERPRINT",
        "INTERNET",
        "ACCESS_NETWORK_STATE"
      ]
    },

    // 🆕 AGREGAR - Plugins para orientación
    plugins: [
      "expo-screen-orientation"
    ]
  }
}
```

### 🎯 12. Dependencias Actualizadas

```json
// package.json - Agregar dependencias responsive
{
  "dependencies": {
    // ✅ MANTENER - Dependencias existentes
    "@tanstack/react-query": "^5.89.0",
    "zustand": "^4.5.0",
    "axios": "^1.12.2",

    // 🆕 AGREGAR - Dependencias responsivas
    "expo-screen-orientation": "^7.0.7",
    "react-native-orientation-locker": "^1.7.0"
  }
}
```

---

## 🎯 EJEMPLOS DE USO PRÁCTICOS

### 🎯 13. Login Screen Responsivo

```typescript
// app/(auth)/login.tsx
// ✅ PATRÓN - Pantalla con orientación bloqueada

import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Stack } from 'expo-router'
import { useResponsiveScreen } from '@/src/features/responsive/hooks/useResponsiveScreen'
import ResponsiveContainer from '@/src/components/ui/ResponsiveContainer'
import { ThemedText } from '@/src/components/ThemedText'

export default function LoginScreen() {
  // ✅ PATRÓN - Bloquear a portrait para login
  const { isLandscape } = useResponsiveScreen({
    screenName: 'Login',
    orientationLock: 'portrait' // Forzar portrait para login
  })

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ResponsiveContainer
        responsiveProps={{
          phone: {
            style: styles.phoneContainer
          },
          tablet: {
            style: styles.tabletContainer
          }
        }}
      >
        <ThemedText variant="title">Iniciar Sesión</ThemedText>
        {/* Formulario de login */}
      </ResponsiveContainer>
    </>
  )
}

const styles = StyleSheet.create({
  phoneContainer: {
    padding: 20,
    justifyContent: 'center'
  },
  tabletContainer: {
    padding: 40,
    maxWidth: 400,
    alignSelf: 'center',
    justifyContent: 'center'
  }
})
```

### 🎯 14. Video Player Responsivo

```typescript
// app/(protected)/video/[id].tsx
// ✅ PATRÓN - Pantalla con orientación libre

import React from 'react'
import { View } from 'react-native'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useResponsiveScreen } from '@/src/features/responsive/hooks/useResponsiveScreen'

export default function VideoPlayerScreen() {
  const { id } = useLocalSearchParams()

  // ✅ PATRÓN - Permitir rotación libre para video
  const { isLandscape } = useResponsiveScreen({
    screenName: 'VideoPlayer',
    orientationLock: 'auto', // Libre rotación
    onOrientationChange: (orientation) => {
      console.log('Video orientation:', orientation)
    }
  })

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: !isLandscape, // Ocultar header en landscape
          title: 'Video Player'
        }}
      />

      <View style={{
        flex: 1,
        backgroundColor: isLandscape ? '#000' : '#fff'
      }}>
        {/* Video player component */}
      </View>
    </>
  )
}
```

---

## 🎯 BARREL EXPORTS

### 🎯 15. Exports del Feature Responsive

```typescript
// features/responsive/index.ts
// ✅ PATRÓN - Barrel exports como en features existentes

// Hooks
export { useResponsive } from './hooks/useResponsive'
export { useOrientation } from './hooks/useOrientation'
export { useResponsiveScreen } from './hooks/useResponsiveScreen'

// Components
export { ResponsiveProvider } from './components/ResponsiveProvider'

// Store
export { useResponsiveStore, useDeviceType, useOrientation as useOrientationStore } from './stores/responsiveStore'

// Types
export type { ResponsiveApp } from './types'
export { RESPONSIVE_BREAKPOINTS, ORIENTATION_MODES } from './types'

// Services
export { DeviceDetectionService } from './services/DeviceDetectionService'
```

---

## 🎯 MEJORES PRÁCTICAS ESPECÍFICAS

### ✅ DO's (Hacer)

1. **Seguir arquitectura existente**: Usar feature-based structure establecida
2. **Mantener consistencia**: Seguir patrones de authStore, useAuth, etc.
3. **Tipado estricto**: Usar namespace API/App pattern establecido
4. **Orientación por pantalla**: Configurar según necesidades UX específicas
5. **Performance**: Usar selectores optimizados del store
6. **Persistencia selectiva**: Solo persistir configuraciones, no estado temporal

### ❌ DON'Ts (No hacer)

1. **No romper arquitectura existente**: Mantener estructura de carpetas establecida
2. **No duplicar lógica**: Reutilizar servicios y patrones existentes
3. **No forzar orientación global**: Configurar por pantalla según necesidad
4. **No persistir estado temporal**: DeviceInfo cambia dinámicamente
5. **No hardcodear breakpoints**: Usar constantes configurables
6. **No ignorar cleanup**: Restaurar orientación al desmontar componentes

---

## 📊 IMPLEMENTACIÓN GRADUAL

### 🎯 Fase 1: Fundación
1. ✅ Crear feature `responsive` con estructura básica
2. ✅ Implementar store y hooks fundamentales
3. ✅ Agregar provider al layout principal

### 🎯 Fase 2: Componentes Base
1. ✅ Crear `ResponsiveContainer` en `components/ui`
2. ✅ Implementar variantes phone/tablet
3. ✅ Integrar con `ThemedText` existente

### 🎯 Fase 3: Pantallas Específicas
1. ✅ Actualizar pantallas críticas (Login, Dashboard)
2. ✅ Configurar orientación por pantalla
3. ✅ Testing en dispositivos reales

### 🎯 Fase 4: Optimización
1. ✅ Performance tuning
2. ✅ Testing completo
3. ✅ Documentación final

---

## 🎯 CONCLUSIÓN

Esta implementación:

✅ **Respeta completamente** tu arquitectura feature-based existente
✅ **Sigue exactamente** los patrones de authStore, useAuth, ApiClient
✅ **Mantiene consistencia** con componentes como ThemedText
✅ **Extiende sin romper** la estructura establecida
✅ **Integra perfectamente** con Expo Router y proveedores existentes

La implementación es **gradual, escalable y mantenible**, siguiendo tus buenas prácticas establecidas.

---

*🎯 CONTEXTO: Responsive Design Expo 2025 | Integrado con arquitectura existente, Coyotito.*