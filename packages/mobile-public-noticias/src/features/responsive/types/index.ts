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