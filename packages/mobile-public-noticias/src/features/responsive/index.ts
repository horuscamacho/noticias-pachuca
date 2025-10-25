// features/responsive/index.ts
// ✅ PATRÓN - Barrel exports como en features existentes

// Hooks
export { useResponsive } from './hooks/useResponsive'
export { useOrientation } from './hooks/useOrientation'

// Components
export { ResponsiveProvider } from './components/ResponsiveProvider'

// Store
export {
  useResponsiveStore,
  useDeviceType,
  useOrientationSelector,
  useDeviceInfo
} from './stores/responsiveStore'

// Types
export type { ResponsiveApp } from './types'
export { RESPONSIVE_BREAKPOINTS, ORIENTATION_MODES } from './types'

// Services
export { DeviceDetectionService } from './services/DeviceDetectionService'