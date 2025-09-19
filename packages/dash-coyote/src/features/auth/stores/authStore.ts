// 🔐 Auth Store - Zustand + Immer + Persist (No ANY allowed)
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { User, AuthTokens, AuthState, AuthStorageData } from '../types/auth.types'

interface AuthActions {
  // Core auth actions
  login: (user: User, tokens: AuthTokens) => void
  logout: () => void
  updateTokens: (tokens: AuthTokens) => void
  updateUser: (userData: Partial<User>) => void
  setLoading: (loading: boolean) => void

  // Session management
  refreshSession: (tokens: AuthTokens) => void
  checkSessionExpiry: () => boolean
  clearExpiredSession: () => void

  // Utilities
  getAuthHeaders: () => Record<string, string>
  isTokenExpiringSoon: (minutesBuffer?: number) => boolean
}

type AuthStore = AuthState & AuthActions

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  sessionExpiry: null,
}

export const useAuthStore = create<AuthStore>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      // 🔑 LOGIN - Set user and tokens
      login: (user: User, tokens: AuthTokens) => {
        set((state) => {
          const sessionExpiry = new Date(Date.now() + tokens.expiresIn * 1000)

          state.user = user
          state.tokens = tokens
          state.isAuthenticated = true
          state.isLoading = false
          state.sessionExpiry = sessionExpiry
        })
      },

      // 🚪 LOGOUT - Clear all auth data
      logout: () => {
        set((state) => {
          state.user = null
          state.tokens = null
          state.isAuthenticated = false
          state.isLoading = false
          state.sessionExpiry = null
        })
      },

      // 🔄 UPDATE TOKENS - Refresh tokens
      updateTokens: (tokens: AuthTokens) => {
        set((state) => {
          const sessionExpiry = new Date(Date.now() + tokens.expiresIn * 1000)

          state.tokens = tokens
          state.sessionExpiry = sessionExpiry
        })
      },

      // 👤 UPDATE USER - Update user data
      updateUser: (userData: Partial<User>) => {
        set((state) => {
          if (state.user) {
            Object.assign(state.user, userData)
          }
        })
      },

      // ⏳ SET LOADING - Loading state
      setLoading: (loading: boolean) => {
        set((state) => {
          state.isLoading = loading
        })
      },

      // 🔄 REFRESH SESSION - Update session with new tokens
      refreshSession: (tokens: AuthTokens) => {
        set((state) => {
          const sessionExpiry = new Date(Date.now() + tokens.expiresIn * 1000)

          state.tokens = tokens
          state.sessionExpiry = sessionExpiry
          state.isLoading = false
        })
      },

      // ⏰ CHECK SESSION EXPIRY - Verify if session is valid
      checkSessionExpiry: (): boolean => {
        const state = get()

        if (!state.sessionExpiry || !state.isAuthenticated) {
          return false
        }

        return new Date(state.sessionExpiry) > new Date()
      },

      // 🧹 CLEAR EXPIRED SESSION - Clean up expired session
      clearExpiredSession: () => {
        const isValid = get().checkSessionExpiry()

        if (!isValid) {
          get().logout()
        }
      },

      // 📝 GET AUTH HEADERS - Headers for API requests
      getAuthHeaders: (): Record<string, string> => {
        const state = get()
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Platform': 'web',
        }

        if (state.tokens?.accessToken && state.isAuthenticated) {
          headers.Authorization = `Bearer ${state.tokens.accessToken}`
        }

        return headers
      },

      // ⚠️ IS TOKEN EXPIRING SOON - Check if token needs refresh
      isTokenExpiringSoon: (minutesBuffer = 5): boolean => {
        const state = get()

        if (!state.sessionExpiry) {
          return false
        }

        const expiryTime = new Date(state.sessionExpiry).getTime()
        const currentTime = Date.now()
        const timeToExpiry = expiryTime - currentTime
        const minutesInMs = minutesBuffer * 60 * 1000

        return timeToExpiry <= minutesInMs && timeToExpiry > 0
      },
    })),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state): AuthStorageData => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
        sessionExpiry: state.sessionExpiry,
      }),
      onRehydrateStorage: () => (state) => {
        // Verify session on rehydration
        if (state) {
          state.clearExpiredSession()
        }
      },
    }
  )
)

// 🎯 OPTIMIZED SELECTORS - Prevent unnecessary re-renders
export const useAuthUser = () => useAuthStore((state) => state.user)
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)
export const useAuthTokens = () => useAuthStore((state) => state.tokens)
export const useAuthLoading = () => useAuthStore((state) => state.isLoading)
export const useAuthSession = () => useAuthStore((state) => ({
  isAuthenticated: state.isAuthenticated,
  sessionExpiry: state.sessionExpiry,
  checkSessionExpiry: state.checkSessionExpiry,
  isTokenExpiringSoon: state.isTokenExpiringSoon,
}))

// 🛠️ UTILITY HOOKS
export const useAuthActions = () => {
  const login = useAuthStore((state) => state.login)
  const logout = useAuthStore((state) => state.logout)
  const updateTokens = useAuthStore((state) => state.updateTokens)
  const updateUser = useAuthStore((state) => state.updateUser)
  const setLoading = useAuthStore((state) => state.setLoading)
  const refreshSession = useAuthStore((state) => state.refreshSession)

  return {
    login,
    logout,
    updateTokens,
    updateUser,
    setLoading,
    refreshSession,
  }
}

export const useAuthHeaders = () => useAuthStore((state) => state.getAuthHeaders)