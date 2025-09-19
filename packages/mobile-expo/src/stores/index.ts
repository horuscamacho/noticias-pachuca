// Stores principales
export { useAuthStore, authStore } from './authStore'
export { useAppStore, appStore } from './appStore'

// Selectores optimizados
export {
  useAuthUser,
  useIsAuthenticated,
  useAuthLoading,
  useAuthError,
  useAuthMethod
} from './authStore'

export {
  useTheme,
  useLanguage,
  useBiometricSettings,
  useNotificationSettings,
  useOnboardingStatus,
  useConnectivityStatus,
  useDeveloperSettings,
  useSessionSettings
} from './appStore'

// Tipos
export type { AuthStore, AuthState, AuthActions } from './authStore'
export type { AppStore, AppState, AppActions } from './appStore'