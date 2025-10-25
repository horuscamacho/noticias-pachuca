# Patrones de Diseño Responsivo en React Native 2025/2026

## Resumen Ejecutivo

Este documento presenta los patrones más modernos y escalables para implementar diseño responsivo en React Native, enfocándose en el soporte para teléfonos, tabletas y múltiples orientaciones con TypeScript estricto.

## 🏗️ Arquitectura Recomendada

### Estructura de Carpetas Feature-Based

```
src/
├── features/
│   └── [feature-name]/
│       ├── components/
│       │   ├── responsive/
│       │   │   ├── [Component]/
│       │   │   │   ├── index.ts
│       │   │   │   ├── [Component].tsx
│       │   │   │   ├── [Component].phone.tsx
│       │   │   │   ├── [Component].tablet.tsx
│       │   │   │   └── types.ts
│       │   └── common/
│       ├── screens/
│       │   ├── [Screen]/
│       │   │   ├── index.ts
│       │   │   ├── [Screen].tsx
│       │   │   ├── [Screen].phone.tsx
│       │   │   ├── [Screen].tablet.tsx
│       │   │   └── types.ts
│       └── hooks/
├── shared/
│   ├── hooks/
│   │   ├── useDeviceType.ts
│   │   ├── useOrientation.ts
│   │   ├── useResponsiveDimensions.ts
│   │   └── useBreakpoints.ts
│   ├── types/
│   │   ├── responsive.ts
│   │   ├── device.ts
│   │   └── orientation.ts
│   └── utils/
│       ├── responsive.ts
│       └── breakpoints.ts
```

## 📱 Detección de Dispositivos

### 1. Hook de Detección de Tipo de Dispositivo

```typescript
// shared/hooks/useDeviceType.ts
import { useState, useEffect } from 'react'
import { Dimensions } from 'react-native'
import { BREAKPOINTS } from '../utils/breakpoints'

export type DeviceType = 'phone' | 'tablet' | 'desktop'

export interface DeviceInfo {
  type: DeviceType
  width: number
  height: number
  isLandscape: boolean
  aspectRatio: number
}

export const useDeviceType = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    const { width, height } = Dimensions.get('window')
    const aspectRatio = width / height

    return {
      type: getDeviceType(width),
      width,
      height,
      isLandscape: width > height,
      aspectRatio
    }
  })

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDeviceInfo({
        type: getDeviceType(window.width),
        width: window.width,
        height: window.height,
        isLandscape: window.width > window.height,
        aspectRatio: window.width / window.height
      })
    })

    return () => subscription?.remove()
  }, [])

  return deviceInfo
}

const getDeviceType = (width: number): DeviceType => {
  if (width >= BREAKPOINTS.desktop) return 'desktop'
  if (width >= BREAKPOINTS.tablet) return 'tablet'
  return 'phone'
}
```

### 2. Sistema de Breakpoints

```typescript
// shared/utils/breakpoints.ts
export const BREAKPOINTS = {
  phone: 0,
  tablet: 768,
  desktop: 1024,
  largeDesktop: 1440
} as const

export type BreakpointKey = keyof typeof BREAKPOINTS

export interface ResponsiveConfig<T> {
  phone?: T
  tablet?: T
  desktop?: T
  largeDesktop?: T
}

export const getResponsiveValue = <T>(
  config: ResponsiveConfig<T>,
  deviceWidth: number,
  fallback: T
): T => {
  if (deviceWidth >= BREAKPOINTS.largeDesktop && config.largeDesktop !== undefined) {
    return config.largeDesktop
  }
  if (deviceWidth >= BREAKPOINTS.desktop && config.desktop !== undefined) {
    return config.desktop
  }
  if (deviceWidth >= BREAKPOINTS.tablet && config.tablet !== undefined) {
    return config.tablet
  }
  if (config.phone !== undefined) {
    return config.phone
  }
  return fallback
}
```

## 🔄 Manejo de Orientación

### 1. Hook de Orientación Avanzado

```typescript
// shared/hooks/useOrientation.ts
import { useState, useEffect } from 'react'
import { Dimensions } from 'react-native'
import Orientation, { OrientationType } from 'react-native-orientation-locker'

export type OrientationMode = 'portrait' | 'landscape' | 'auto'

export interface OrientationInfo {
  current: OrientationType
  isLandscape: boolean
  isPortrait: boolean
  canRotate: boolean
}

export interface UseOrientationProps {
  lockMode?: OrientationMode
  allowedOrientations?: OrientationType[]
}

export const useOrientation = (props?: UseOrientationProps): OrientationInfo => {
  const [orientation, setOrientation] = useState<OrientationType>('portrait')
  const [canRotate, setCanRotate] = useState(true)

  useEffect(() => {
    // Obtener orientación inicial
    Orientation.getOrientation((orientation) => {
      setOrientation(orientation)
    })

    // Escuchar cambios de orientación
    const listener = Orientation.addOrientationListener(handleOrientationChange)

    // Aplicar bloqueo si se especifica
    if (props?.lockMode && props.lockMode !== 'auto') {
      applyOrientationLock(props.lockMode)
      setCanRotate(false)
    } else if (props?.allowedOrientations) {
      // Permitir solo orientaciones específicas
      setCanRotate(props.allowedOrientations.length > 1)
    }

    return () => {
      Orientation.removeOrientationListener(listener)
      // Restaurar orientación automática al desmontar
      if (props?.lockMode && props.lockMode !== 'auto') {
        Orientation.unlockAllOrientations()
      }
    }
  }, [props?.lockMode, props?.allowedOrientations])

  const handleOrientationChange = (orientation: OrientationType) => {
    if (props?.allowedOrientations) {
      if (props.allowedOrientations.includes(orientation)) {
        setOrientation(orientation)
      }
    } else {
      setOrientation(orientation)
    }
  }

  const applyOrientationLock = (mode: OrientationMode) => {
    switch (mode) {
      case 'portrait':
        Orientation.lockToPortrait()
        break
      case 'landscape':
        Orientation.lockToLandscape()
        break
      case 'auto':
        Orientation.unlockAllOrientations()
        break
    }
  }

  return {
    current: orientation,
    isLandscape: orientation.includes('landscape'),
    isPortrait: orientation.includes('portrait'),
    canRotate
  }
}
```

### 2. Componente de Control de Orientación por Pantalla

```typescript
// shared/components/OrientationController.tsx
import { useEffect } from 'react'
import { useOrientation, OrientationMode } from '../hooks/useOrientation'

interface OrientationControllerProps {
  mode: OrientationMode
  children: React.ReactNode
  onOrientationChange?: (orientation: string) => void
}

export const OrientationController: React.FC<OrientationControllerProps> = ({
  mode,
  children,
  onOrientationChange
}) => {
  const { current } = useOrientation({ lockMode: mode })

  useEffect(() => {
    onOrientationChange?.(current)
  }, [current, onOrientationChange])

  return <>{children}</>
}
```

## 🖥️ Componentes Responsivos

### 1. Componente Base Responsivo

```typescript
// shared/components/ResponsiveView.tsx
import React from 'react'
import { View, ViewProps } from 'react-native'
import { useDeviceType } from '../hooks/useDeviceType'
import { useOrientation } from '../hooks/useOrientation'
import { ResponsiveConfig } from '../utils/breakpoints'

export interface ResponsiveViewProps extends ViewProps {
  phoneComponent?: React.ComponentType<any>
  tabletComponent?: React.ComponentType<any>
  desktopComponent?: React.ComponentType<any>
  responsiveProps?: ResponsiveConfig<any>
  orientationProps?: {
    portrait?: any
    landscape?: any
  }
}

export const ResponsiveView: React.FC<ResponsiveViewProps> = ({
  phoneComponent: PhoneComponent,
  tabletComponent: TabletComponent,
  desktopComponent: DesktopComponent,
  responsiveProps,
  orientationProps,
  children,
  ...viewProps
}) => {
  const { type, width } = useDeviceType()
  const { isLandscape } = useOrientation()

  // Resolver props basado en orientación
  const orientationSpecificProps = isLandscape
    ? orientationProps?.landscape
    : orientationProps?.portrait

  // Resolver props responsivos
  const deviceSpecificProps = responsiveProps
    ? getResponsiveValue(responsiveProps, width, {})
    : {}

  // Combinar props
  const finalProps = {
    ...viewProps,
    ...deviceSpecificProps,
    ...orientationSpecificProps
  }

  // Renderizar componente específico del dispositivo
  if (type === 'desktop' && DesktopComponent) {
    return <DesktopComponent {...finalProps}>{children}</DesktopComponent>
  }

  if (type === 'tablet' && TabletComponent) {
    return <TabletComponent {...finalProps}>{children}</TabletComponent>
  }

  if (type === 'phone' && PhoneComponent) {
    return <PhoneComponent {...finalProps}>{children}</PhoneComponent>
  }

  // Fallback al componente base
  return <View {...finalProps}>{children}</View>
}
```

### 2. Hook de Dimensiones Responsivas

```typescript
// shared/hooks/useResponsiveDimensions.ts
import { useMemo } from 'react'
import { useDeviceType } from './useDeviceType'
import { ResponsiveConfig, getResponsiveValue } from '../utils/breakpoints'

export interface ResponsiveDimensions {
  spacing: ResponsiveConfig<number>
  fontSize: ResponsiveConfig<number>
  iconSize: ResponsiveConfig<number>
  borderRadius: ResponsiveConfig<number>
}

const DEFAULT_DIMENSIONS: ResponsiveDimensions = {
  spacing: { phone: 16, tablet: 24, desktop: 32 },
  fontSize: { phone: 14, tablet: 16, desktop: 18 },
  iconSize: { phone: 24, tablet: 28, desktop: 32 },
  borderRadius: { phone: 8, tablet: 12, desktop: 16 }
}

export const useResponsiveDimensions = (
  customDimensions?: Partial<ResponsiveDimensions>
) => {
  const { width } = useDeviceType()

  const dimensions = useMemo(() => {
    const merged = { ...DEFAULT_DIMENSIONS, ...customDimensions }

    return {
      spacing: getResponsiveValue(merged.spacing, width, 16),
      fontSize: getResponsiveValue(merged.fontSize, width, 14),
      iconSize: getResponsiveValue(merged.iconSize, width, 24),
      borderRadius: getResponsiveValue(merged.borderRadius, width, 8)
    }
  }, [width, customDimensions])

  return dimensions
}
```

## 📄 Implementación en Pantallas

### 1. Patrón de Pantalla Responsiva

```typescript
// features/home/screens/HomeScreen/HomeScreen.tsx
import React from 'react'
import { useDeviceType } from '@/shared/hooks/useDeviceType'
import { OrientationController } from '@/shared/components/OrientationController'
import HomeScreenPhone from './HomeScreen.phone'
import HomeScreenTablet from './HomeScreen.tablet'

interface HomeScreenProps {
  navigation: any
  route: any
}

export const HomeScreen: React.FC<HomeScreenProps> = (props) => {
  const { type } = useDeviceType()

  return (
    <OrientationController mode="auto">
      {type === 'tablet' ? (
        <HomeScreenTablet {...props} />
      ) : (
        <HomeScreenPhone {...props} />
      )}
    </OrientationController>
  )
}

export default HomeScreen
```

### 2. Implementación Específica para Teléfono

```typescript
// features/home/screens/HomeScreen/HomeScreen.phone.tsx
import React from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { useOrientation } from '@/shared/hooks/useOrientation'
import { useResponsiveDimensions } from '@/shared/hooks/useResponsiveDimensions'

interface HomeScreenPhoneProps {
  navigation: any
  route: any
}

export const HomeScreenPhone: React.FC<HomeScreenPhoneProps> = ({
  navigation,
  route
}) => {
  const { isLandscape } = useOrientation()
  const { spacing, fontSize } = useResponsiveDimensions()

  const styles = createStyles({ spacing, fontSize, isLandscape })

  return (
    <ScrollView style={styles.container}>
      {/* Contenido específico para teléfono */}
    </ScrollView>
  )
}

const createStyles = ({ spacing, fontSize, isLandscape }: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: spacing,
      flexDirection: isLandscape ? 'row' : 'column'
    }
  })

export default HomeScreenPhone
```

## 🎨 Estilos Responsivos

### 1. Sistema de Estilos Adaptativo

```typescript
// shared/utils/responsiveStyles.ts
import { StyleSheet, TextStyle, ViewStyle, ImageStyle } from 'react-native'
import { useDeviceType } from '../hooks/useDeviceType'
import { useOrientation } from '../hooks/useOrientation'
import { ResponsiveConfig, getResponsiveValue } from './breakpoints'

type Style = ViewStyle | TextStyle | ImageStyle

export interface ResponsiveStyleSheet<T> {
  [key: string]: ResponsiveConfig<T> | T
}

export const createResponsiveStyles = <T extends ResponsiveStyleSheet<Style>>(
  styles: T,
  deviceWidth: number
): StyleSheet.NamedStyles<{ [K in keyof T]: Style }> => {
  const processedStyles: any = {}

  Object.keys(styles).forEach((key) => {
    const style = styles[key]

    if (isResponsiveConfig(style)) {
      processedStyles[key] = getResponsiveValue(style, deviceWidth, {})
    } else {
      processedStyles[key] = style
    }
  })

  return StyleSheet.create(processedStyles)
}

const isResponsiveConfig = (value: any): value is ResponsiveConfig<Style> => {
  return value && typeof value === 'object' &&
    ('phone' in value || 'tablet' in value || 'desktop' in value)
}

// Hook para usar estilos responsivos
export const useResponsiveStyles = <T extends ResponsiveStyleSheet<Style>>(
  styleSheet: T
) => {
  const { width } = useDeviceType()

  return useMemo(() => {
    return createResponsiveStyles(styleSheet, width)
  }, [styleSheet, width])
}
```

## 📋 Tipos TypeScript

### 1. Definiciones de Tipos Principales

```typescript
// shared/types/responsive.ts
export interface DeviceConfig {
  type: 'phone' | 'tablet' | 'desktop'
  orientation: 'portrait' | 'landscape'
  width: number
  height: number
  aspectRatio: number
}

export interface ResponsiveComponentProps<T = any> {
  phoneProps?: T
  tabletProps?: T
  desktopProps?: T
  orientationProps?: {
    portrait?: T
    landscape?: T
  }
}

export interface ScreenConfiguration {
  allowedOrientations?: ('portrait' | 'landscape')[]
  lockOrientation?: 'portrait' | 'landscape' | 'auto'
  responsiveBreakpoints?: {
    enableTabletLayout?: boolean
    customBreakpoint?: number
  }
}
```

### 2. Configuración de Pantallas

```typescript
// shared/types/screen.ts
export interface ScreenConfig {
  name: string
  orientation: {
    lock?: 'portrait' | 'landscape' | 'auto'
    allowed?: ('portrait' | 'landscape')[]
  }
  responsive: {
    hasTabletVersion: boolean
    hasDesktopVersion?: boolean
    breakpoint?: number
  }
  navigation?: {
    headerShown?: boolean
    gestureEnabled?: boolean
  }
}

export const SCREEN_CONFIGS: Record<string, ScreenConfig> = {
  HomeScreen: {
    name: 'Home',
    orientation: {
      lock: 'auto',
      allowed: ['portrait', 'landscape']
    },
    responsive: {
      hasTabletVersion: true,
      hasDesktopVersion: false
    }
  },
  LoginScreen: {
    name: 'Login',
    orientation: {
      lock: 'portrait'
    },
    responsive: {
      hasTabletVersion: true
    }
  },
  VideoPlayerScreen: {
    name: 'VideoPlayer',
    orientation: {
      lock: 'auto',
      allowed: ['portrait', 'landscape']
    },
    responsive: {
      hasTabletVersion: true
    }
  }
}
```

## 🛠️ Dependencias Recomendadas

### Librerías Principales (2025/2026)

```json
{
  "dependencies": {
    "react-native-orientation-locker": "^1.7.0",
    "react-native-responsive-screen": "^1.4.2",
    "react-native-super-grid": "^6.0.2",
    "react-native-vector-icons": "^10.0.3"
  },
  "devDependencies": {
    "@types/react-native-orientation-locker": "^1.1.5"
  }
}
```

### Configuración TypeScript Estricta

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

## 🎯 Ejemplo de Implementación Completa

### Dashboard Responsivo

```typescript
// features/dashboard/screens/DashboardScreen/DashboardScreen.tsx
import React from 'react'
import { SafeAreaView } from 'react-native'
import { ResponsiveView } from '@/shared/components/ResponsiveView'
import { OrientationController } from '@/shared/components/OrientationController'
import { SCREEN_CONFIGS } from '@/shared/types/screen'
import DashboardPhone from './Dashboard.phone'
import DashboardTablet from './Dashboard.tablet'

export const DashboardScreen: React.FC = () => {
  const screenConfig = SCREEN_CONFIGS.DashboardScreen

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <OrientationController mode={screenConfig.orientation.lock}>
        <ResponsiveView
          phoneComponent={DashboardPhone}
          tabletComponent={DashboardTablet}
          responsiveProps={{
            phone: { columns: 1 },
            tablet: { columns: 2 }
          }}
          orientationProps={{
            portrait: { headerHeight: 60 },
            landscape: { headerHeight: 40 }
          }}
        />
      </OrientationController>
    </SafeAreaView>
  )
}

export default DashboardScreen
```

## 📊 Mejores Prácticas y Recomendaciones

### ✅ Hacer

1. **Usar hooks personalizados** para lógica de responsive
2. **Implementar TypeScript estricto** en todos los componentes
3. **Organizar por características**, no por tipos
4. **Definir breakpoints consistentes** en toda la app
5. **Manejar orientación por pantalla** según necesidades UX
6. **Implementar fallbacks** para dispositivos no soportados
7. **Optimizar re-renders** con useMemo y useCallback

### ❌ Evitar

1. **Hardcodear dimensiones** en píxeles absolutos
2. **Usar Dimensions.get()** directamente en componentes
3. **Ignorar cambios de orientación** durante montaje
4. **Crear componentes gigantes** que manejen todo
5. **No tipear props responsivas** adecuadamente
6. **Cambiar orientación sin** considerar UX
7. **Asumir dispositivos específicos** sin detección

## 🔮 Tendencias Futuras (2025-2026)

1. **Dispositivos Plegables**: Soporte nativo para Samsung Galaxy Fold, etc.
2. **JSI Integration**: Rendimiento nativo para cálculos de layout
3. **Server-Driven UI**: Layouts definidos desde backend
4. **AI-Powered Responsive**: Layouts adaptativos con ML
5. **Web3 Integration**: Responsive design para dApps móviles

---

## 📝 Conclusión

Este documento presenta un enfoque moderno y escalable para el diseño responsivo en React Native. La arquitectura propuesta permite:

- **Separación clara** entre componentes de teléfono y tablet
- **Control granular** de orientación por pantalla
- **TypeScript estricto** para seguridad de tipos
- **Escalabilidad** para proyectos grandes
- **Rendimiento optimizado** con hooks especializados

La implementación de estos patrones garantiza una base sólida para aplicaciones React Native que funcionen perfectamente en cualquier dispositivo y orientación.