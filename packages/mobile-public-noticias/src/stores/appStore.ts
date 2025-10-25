import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Appearance, ColorSchemeName } from 'react-native'

export interface AppState {
  // Primera configuración
  isFirstLaunch: boolean
  hasCompletedOnboarding: boolean

  // Configuraciones de seguridad
  biometricsEnabled: boolean
  autoLockEnabled: boolean
  autoLockTimeout: number // minutos

  // Configuraciones de UI
  theme: 'light' | 'dark' | 'auto'
  selectedLanguage: string
  fontSize: 'small' | 'medium' | 'large'

  // Configuraciones de notificaciones
  notificationsEnabled: boolean
  pushNotificationsEnabled: boolean
  emailNotificationsEnabled: boolean

  // Configuraciones de la app
  analyticsEnabled: boolean
  crashReportingEnabled: boolean
  autoUpdateEnabled: boolean

  // Estado de conectividad
  isOnline: boolean
  lastSyncAt: Date | null

  // Configuraciones de sesión
  rememberLastEmailOrUsername: boolean
  lastEmailOrUsername: string | null

  // Configuraciones de desarrollo
  debugMode: boolean
  showPerformanceMetrics: boolean
}

export interface AppActions {
  // Primera configuración
  setFirstLaunch: (isFirst: boolean) => void
  completeOnboarding: () => void

  // Configuraciones de seguridad
  setBiometricsEnabled: (enabled: boolean) => void
  setAutoLockEnabled: (enabled: boolean) => void
  setAutoLockTimeout: (minutes: number) => void

  // Configuraciones de UI
  setTheme: (theme: 'light' | 'dark' | 'auto') => void
  setLanguage: (language: string) => void
  setFontSize: (size: 'small' | 'medium' | 'large') => void

  // Configuraciones de notificaciones
  setNotificationsEnabled: (enabled: boolean) => void
  setPushNotificationsEnabled: (enabled: boolean) => void
  setEmailNotificationsEnabled: (enabled: boolean) => void

  // Configuraciones de la app
  setAnalyticsEnabled: (enabled: boolean) => void
  setCrashReportingEnabled: (enabled: boolean) => void
  setAutoUpdateEnabled: (enabled: boolean) => void

  // Estado de conectividad
  setOnlineStatus: (isOnline: boolean) => void
  updateLastSync: () => void

  // Configuraciones de sesión
  setRememberLastEmailOrUsername: (remember: boolean) => void
  setLastEmailOrUsername: (emailOrUsername: string | null) => void

  // Configuraciones de desarrollo
  setDebugMode: (enabled: boolean) => void
  setShowPerformanceMetrics: (show: boolean) => void

  // Métodos utilitarios
  resetToDefaults: () => void
  exportSettings: () => AppState
  importSettings: (settings: Partial<AppState>) => void

  // Getters computados
  getEffectiveTheme: () => 'light' | 'dark'
  shouldShowDeveloperOptions: () => boolean
}

export type AppStore = AppState & AppActions

const initialState: AppState = {
  // Primera configuración
  isFirstLaunch: true,
  hasCompletedOnboarding: false,

  // Configuraciones de seguridad
  biometricsEnabled: false,
  autoLockEnabled: true,
  autoLockTimeout: 5, // 5 minutos

  // Configuraciones de UI
  theme: 'auto',
  selectedLanguage: 'es', // Español por defecto
  fontSize: 'medium',

  // Configuraciones de notificaciones
  notificationsEnabled: true,
  pushNotificationsEnabled: true,
  emailNotificationsEnabled: true,

  // Configuraciones de la app
  analyticsEnabled: true,
  crashReportingEnabled: true,
  autoUpdateEnabled: true,

  // Estado de conectividad
  isOnline: true,
  lastSyncAt: null,

  // Configuraciones de sesión
  rememberLastEmailOrUsername: true,
  lastEmailOrUsername: null,

  // Configuraciones de desarrollo
  debugMode: __DEV__,
  showPerformanceMetrics: false
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Primera configuración
      setFirstLaunch: (isFirst) => {
        set({ isFirstLaunch: isFirst })
      },

      completeOnboarding: () => {
        set({
          hasCompletedOnboarding: true,
          isFirstLaunch: false
        })
      },

      // Configuraciones de seguridad
      setBiometricsEnabled: (enabled) => {
        set({ biometricsEnabled: enabled })
      },

      setAutoLockEnabled: (enabled) => {
        set({ autoLockEnabled: enabled })
      },

      setAutoLockTimeout: (minutes) => {
        // Validar rango (1-60 minutos)
        const timeout = Math.max(1, Math.min(60, minutes))
        set({ autoLockTimeout: timeout })
      },

      // Configuraciones de UI
      setTheme: (theme) => {
        set({ theme })
      },

      setLanguage: (language) => {
        set({ selectedLanguage: language })
      },

      setFontSize: (size) => {
        set({ fontSize: size })
      },

      // Configuraciones de notificaciones
      setNotificationsEnabled: (enabled) => {
        set({ notificationsEnabled: enabled })

        // Si se deshabilitan las notificaciones generales, deshabilitar todas
        if (!enabled) {
          set({
            pushNotificationsEnabled: false,
            emailNotificationsEnabled: false
          })
        }
      },

      setPushNotificationsEnabled: (enabled) => {
        set({ pushNotificationsEnabled: enabled })

        // Si se habilitan push notifications, habilitar notificaciones generales
        if (enabled && !get().notificationsEnabled) {
          set({ notificationsEnabled: true })
        }
      },

      setEmailNotificationsEnabled: (enabled) => {
        set({ emailNotificationsEnabled: enabled })

        // Si se habilitan email notifications, habilitar notificaciones generales
        if (enabled && !get().notificationsEnabled) {
          set({ notificationsEnabled: true })
        }
      },

      // Configuraciones de la app
      setAnalyticsEnabled: (enabled) => {
        set({ analyticsEnabled: enabled })
      },

      setCrashReportingEnabled: (enabled) => {
        set({ crashReportingEnabled: enabled })
      },

      setAutoUpdateEnabled: (enabled) => {
        set({ autoUpdateEnabled: enabled })
      },

      // Estado de conectividad
      setOnlineStatus: (isOnline) => {
        set({ isOnline })
      },

      updateLastSync: () => {
        set({ lastSyncAt: new Date() })
      },

      // Configuraciones de sesión
      setRememberLastEmailOrUsername: (remember) => {
        set({ rememberLastEmailOrUsername: remember })

        // Si se deshabilita, limpiar el último email/username
        if (!remember) {
          set({ lastEmailOrUsername: null })
        }
      },

      setLastEmailOrUsername: (emailOrUsername) => {
        const { rememberLastEmailOrUsername } = get()

        if (rememberLastEmailOrUsername) {
          set({ lastEmailOrUsername: emailOrUsername })
        }
      },

      // Configuraciones de desarrollo
      setDebugMode: (enabled) => {
        set({ debugMode: enabled })
      },

      setShowPerformanceMetrics: (show) => {
        set({ showPerformanceMetrics: show })
      },

      // Métodos utilitarios
      resetToDefaults: () => {
        const currentLanguage = get().selectedLanguage
        const currentOnboardingStatus = get().hasCompletedOnboarding

        set({
          ...initialState,
          // Preservar idioma y estado de onboarding
          selectedLanguage: currentLanguage,
          hasCompletedOnboarding: currentOnboardingStatus,
          isFirstLaunch: false
        })
      },

      exportSettings: () => {
        const state = get()
        // Excluir datos temporales del export
        const { isOnline, lastSyncAt, debugMode, ...exportableState } = state
        return exportableState as AppState
      },

      importSettings: (settings) => {
        // Validar y aplicar configuraciones importadas
        const validatedSettings = { ...settings }

        // Validaciones específicas
        if (validatedSettings.autoLockTimeout) {
          validatedSettings.autoLockTimeout = Math.max(1, Math.min(60, validatedSettings.autoLockTimeout))
        }

        if (validatedSettings.theme && !['light', 'dark', 'auto'].includes(validatedSettings.theme)) {
          validatedSettings.theme = 'auto'
        }

        if (validatedSettings.fontSize && !['small', 'medium', 'large'].includes(validatedSettings.fontSize)) {
          validatedSettings.fontSize = 'medium'
        }

        set(validatedSettings)
      },

      // Getters computados
      getEffectiveTheme: () => {
        const { theme } = get()

        if (theme === 'auto') {
          const systemTheme = Appearance.getColorScheme()
          return systemTheme === 'dark' ? 'dark' : 'light'
        }

        return theme
      },

      shouldShowDeveloperOptions: () => {
        const { debugMode } = get()
        return __DEV__ || debugMode
      }
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Persistir todas las configuraciones excepto estado temporal
      partialize: (state) => {
        const { isOnline, ...persistedState } = state
        return persistedState
      },
      // Configuración de hydratación
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Restablecer estado online al inicializar
          state.isOnline = true

          // Si es desarrollo, habilitar debug mode
          if (__DEV__) {
            state.debugMode = true
          }
        }
      }
    }
  )
)

// Hook para acceso al store
export const appStore = useAppStore

// Selectores optimizados para evitar re-renders innecesarios
export const useTheme = () => useAppStore((state) => ({
  theme: state.theme,
  effectiveTheme: state.getEffectiveTheme()
}))

export const useLanguage = () => useAppStore((state) => state.selectedLanguage)

export const useBiometricSettings = () => useAppStore((state) => ({
  enabled: state.biometricsEnabled,
  autoLockEnabled: state.autoLockEnabled,
  autoLockTimeout: state.autoLockTimeout
}))

export const useNotificationSettings = () => useAppStore((state) => ({
  notificationsEnabled: state.notificationsEnabled,
  pushNotificationsEnabled: state.pushNotificationsEnabled,
  emailNotificationsEnabled: state.emailNotificationsEnabled
}))

export const useOnboardingStatus = () => useAppStore((state) => ({
  isFirstLaunch: state.isFirstLaunch,
  hasCompletedOnboarding: state.hasCompletedOnboarding
}))

export const useConnectivityStatus = () => useAppStore((state) => ({
  isOnline: state.isOnline,
  lastSyncAt: state.lastSyncAt
}))

export const useDeveloperSettings = () => useAppStore((state) => ({
  debugMode: state.debugMode,
  showPerformanceMetrics: state.showPerformanceMetrics,
  shouldShowDeveloperOptions: state.shouldShowDeveloperOptions()
}))

export const useSessionSettings = () => useAppStore((state) => ({
  rememberLastEmailOrUsername: state.rememberLastEmailOrUsername,
  lastEmailOrUsername: state.lastEmailOrUsername
}))