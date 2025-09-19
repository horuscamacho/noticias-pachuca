import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { App, AuthError } from '@/src/types/auth.types'
import { TokenManager } from '@/src/services/auth/TokenManager'
import { AuthService } from '@/src/services/auth/AuthService'

export interface AuthState {
  // Estado del usuario
  user: App.User | null
  isAuthenticated: boolean
  isInitialized: boolean

  // Método de autenticación usado
  authMethod: 'password' | 'biometric' | null

  // Estados de carga
  isLoading: boolean
  isLoggingIn: boolean
  isLoggingOut: boolean
  isRefreshing: boolean

  // Error handling
  error: AuthError | null

  // Sesión info
  lastLoginAt: Date | null
  sessionExpiresAt: Date | null
}

export interface AuthActions {
  // Acciones principales
  setUser: (user: App.User | null) => void
  setAuthenticated: (authenticated: boolean) => void
  setAuthMethod: (method: 'password' | 'biometric' | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: AuthError | null) => void

  // Autenticación
  initialize: () => Promise<void>
  login: (credentials: App.LoginCredentials) => Promise<App.AuthSession>
  loginWithBiometrics: () => Promise<App.AuthSession>
  logout: (allDevices?: boolean) => Promise<void>

  // Gestión de tokens
  refreshTokens: () => Promise<void>

  // Reset y limpieza
  reset: () => void
  clearError: () => void

  // Métodos de estado
  updateLastLogin: () => void
  updateSessionExpiry: (expiresAt: Date) => void
}

export type AuthStore = AuthState & AuthActions

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  authMethod: null,
  isLoading: false,
  isLoggingIn: false,
  isLoggingOut: false,
  isRefreshing: false,
  error: null,
  lastLoginAt: null,
  sessionExpiresAt: null
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Setters básicos
      setUser: (user) => {
        set({ user })
      },

      setAuthenticated: (authenticated) => {
        set({ isAuthenticated: authenticated })
      },

      setAuthMethod: (method) => {
        set({ authMethod: method })
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      setError: (error) => {
        set({ error })
      },

      clearError: () => {
        set({ error: null })
      },

      updateLastLogin: () => {
        set({ lastLoginAt: new Date() })
      },

      updateSessionExpiry: (expiresAt) => {
        set({ sessionExpiresAt: expiresAt })
      },

      // Inicialización de la app
      initialize: async () => {
        if (get().isInitialized) {
          console.log('🚨 authStore.initialize() - Already initialized, skipping')
          return
        }

        console.log('🚨 authStore.initialize() - Starting initialization')
        set({ isLoading: true, error: null })

        try {
          // Verificar si hay tokens básicos disponibles (sin intentar refresh)
          const accessToken = await TokenManager.getAccessToken()
          const refreshToken = await TokenManager.getRefreshToken()

          console.log('🚨 authStore.initialize() - Token check:', {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken
          })

          if (accessToken || refreshToken) {
            // Intentar obtener el usuario actual (esto manejará el refresh automáticamente)
            console.log('🚨 authStore.initialize() - Calling getCurrentUser()')
            try {
              const user = await AuthService.getCurrentUser()
              console.log('🚨 authStore.initialize() - getCurrentUser() successful')
              set({
                user,
                isAuthenticated: true,
                isInitialized: true,
                isLoading: false
              })
            } catch (error) {
              console.warn('🚨 authStore.initialize() - getCurrentUser failed:', error)
              // Si falla obtener el usuario, limpiar tokens y estado
              await TokenManager.clearTokens()
              set({
                user: null,
                isAuthenticated: false,
                isInitialized: true,
                isLoading: false,
                isRefreshing: false,
                error: null
              })
              console.log('🚨 authStore.initialize() - State cleaned after getCurrentUser failure')
            }
          } else {
            // No hay tokens en absoluto
            console.log('🚨 authStore.initialize() - No tokens found, setting unauthenticated state')
            set({
              user: null,
              isAuthenticated: false,
              isInitialized: true,
              isLoading: false
            })
          }
        } catch (error) {
          console.error('Auth initialization error:', error)
          set({
            user: null,
            isAuthenticated: false,
            isInitialized: true,
            isLoading: false,
            error: {
              code: 'INITIALIZATION_FAILED',
              message: 'Failed to initialize authentication'
            }
          })
        }
      },

      // Login con credenciales
      login: async (credentials) => {
        set({ isLoggingIn: true, error: null })

        try {
          const session = await AuthService.login(credentials)

          set({
            user: session.user,
            isAuthenticated: true,
            authMethod: 'password',
            isLoggingIn: false,
            lastLoginAt: session.authenticatedAt,
            sessionExpiresAt: session.tokens.expiresAt
          })

          return session
        } catch (error) {
          const authError = error as AuthError
          set({
            isLoggingIn: false,
            error: authError
          })
          throw error
        }
      },

      // Login con biometría
      loginWithBiometrics: async () => {
        set({ isLoggingIn: true, error: null })

        try {
          // Importación dinámica para evitar dependencias circulares
          const { BiometricManager } = await import('@/src/services/auth/BiometricManager')

          // Verificar capacidades biométricas
          const canUse = await BiometricManager.canUseBiometrics()
          if (!canUse) {
            throw {
              code: 'BIOMETRIC_NOT_AVAILABLE',
              message: 'Biometric authentication is not available'
            }
          }

          // Autenticar con biometría
          const authResult = await BiometricManager.authenticate({
            promptMessage: 'Authenticate to access your account'
          })

          if (!authResult.success) {
            throw {
              code: authResult.errorCode || 'BIOMETRIC_FAILED',
              message: authResult.error || 'Biometric authentication failed'
            }
          }

          // Verificar tokens almacenados
          const hasValidTokens = await TokenManager.hasValidTokens()
          if (!hasValidTokens) {
            throw {
              code: 'NO_STORED_SESSION',
              message: 'No valid session found. Please login with your credentials.'
            }
          }

          // Obtener usuario actual
          const user = await AuthService.getCurrentUser()
          const tokenInfo = await TokenManager.getTokenInfo()

          const session: App.AuthSession = {
            user,
            tokens: {
              accessToken: '', // No necesitamos exponer el token aquí
              refreshToken: '',
              tokenType: 'Bearer',
              expiresIn: 0,
              expiresAt: tokenInfo.accessTokenExpiresAt || new Date()
            },
            platform: 'mobile',
            authenticatedAt: new Date()
          }

          set({
            user,
            isAuthenticated: true,
            authMethod: 'biometric',
            isLoggingIn: false,
            lastLoginAt: new Date(),
            sessionExpiresAt: tokenInfo.accessTokenExpiresAt
          })

          return session
        } catch (error) {
          const authError = error as AuthError
          set({
            isLoggingIn: false,
            error: authError
          })
          throw error
        }
      },

      // Logout
      logout: async (allDevices = false) => {
        console.log('🚨 authStore.logout() - Starting logout process', { allDevices })
        set({ isLoggingOut: true, error: null })

        try {
          // Intentar logout en el servidor
          await AuthService.logout(allDevices)
          console.log('🚨 authStore.logout() - Server logout successful')
        } catch (error) {
          console.warn('🚨 authStore.logout() - Server logout failed:', error)
          // Continuar con logout local
        } finally {
          // Siempre limpiar estado local
          console.log('🚨 authStore.logout() - Clearing tokens and resetting state')
          await TokenManager.clearTokens()

          // Reset del estado
          set({
            ...initialState,
            isInitialized: true,
            isLoggingOut: false
          })
          console.log('🚨 authStore.logout() - Logout completed, state reset')
        }
      },

      // Refresh de tokens
      refreshTokens: async () => {
        if (get().isRefreshing) return

        set({ isRefreshing: true, error: null })

        try {
          const tokens = await AuthService.refreshTokens()

          set({
            isRefreshing: false,
            sessionExpiresAt: tokens.expiresAt
          })
        } catch (error) {
          console.error('Token refresh failed:', error)

          // Si el refresh falla, hacer logout
          const authError = error as AuthError
          set({
            isRefreshing: false,
            error: authError
          })

          // Logout silencioso y asegurar que isLoading se limpie
          try {
            await get().logout()
          } catch (logoutError) {
            console.warn('Silent logout failed:', logoutError)
            // Forzar limpieza del estado
            set({
              user: null,
              isAuthenticated: false,
              isInitialized: true,
              isLoading: false,
              isRefreshing: false,
              error: authError
            })
          }
        }
      },

      // Reset completo del estado
      reset: () => {
        set(initialState)
      }
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Solo persistir datos no sensibles
      partialize: (state) => ({
        isInitialized: state.isInitialized,
        authMethod: state.authMethod,
        lastLoginAt: state.lastLoginAt,
        // NO persistir: user, tokens, o datos sensibles
      }),
      // Configuración de hydratación
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Asegurar que el estado esté limpio al hidratar
          state.isLoading = false
          state.isLoggingIn = false
          state.isLoggingOut = false
          state.isRefreshing = false
          state.error = null

          // Resetear inicialización para forzar verificación de tokens
          state.isInitialized = false
          state.user = null
          state.isAuthenticated = false
          state.sessionExpiresAt = null
        }
      }
    }
  )
)

// Hook para acceso al store
export const authStore = useAuthStore

// Selectores optimizados para evitar re-renders innecesarios
export const useAuthUser = () => useAuthStore((state) => state.user)
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)
export const useAuthLoading = () => useAuthStore((state) => ({
  isLoading: state.isLoading,
  isLoggingIn: state.isLoggingIn,
  isLoggingOut: state.isLoggingOut,
  isRefreshing: state.isRefreshing
}))
export const useAuthError = () => useAuthStore((state) => state.error)
export const useAuthMethod = () => useAuthStore((state) => state.authMethod)