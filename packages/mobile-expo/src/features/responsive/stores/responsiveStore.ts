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
export const useOrientationSelector = () => useResponsiveStore((state) => state.deviceInfo.orientation)
export const useDeviceInfo = () => useResponsiveStore((state) => state.deviceInfo)