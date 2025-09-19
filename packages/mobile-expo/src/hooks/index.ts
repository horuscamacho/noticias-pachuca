// Hooks de autenticación
export { useAuth } from './useAuth'
export { useBiometric, useBiometricAvailability, useBiometricSetup } from './useBiometric'

// Re-export hooks de stores para conveniencia
export {
  useAuthUser,
  useIsAuthenticated,
  useAuthLoading,
  useAuthError,
  useAuthMethod
} from '@/stores/authStore'

export {
  useTheme,
  useLanguage,
  useBiometricSettings,
  useNotificationSettings,
  useOnboardingStatus,
  useConnectivityStatus,
  useDeveloperSettings,
  useSessionSettings
} from '@/stores/appStore'