import { useEffect, useRef } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { useAuthStore } from '@/src/stores/authStore'
import { TokenManager } from '@/src/services/auth/TokenManager'

/**
 * Hook para refrescar el access token automáticamente ANTES de que expire.
 *
 * Características:
 * - Revisa cada 30 segundos si el token expira pronto (2 minutos)
 * - Refresca el token proactivamente en background
 * - Se pausa cuando la app está en background
 * - Maneja múltiples intentos de refresh simultáneos
 * - Si falla el refresh, hace logout automático
 *
 * @example
 * ```tsx
 * function App() {
 *   useAutoTokenRefresh()
 *   return <YourApp />
 * }
 * ```
 */
export function useAutoTokenRefresh(): void {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isLoggingOut = useAuthStore((state) => state.isLoggingOut)
  const refreshTokens = useAuthStore((state) => state.refreshTokens)
  const logout = useAuthStore((state) => state.logout)

  const refreshingRef = useRef(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const appStateRef = useRef<AppStateStatus>(AppState.currentState)

  useEffect(() => {
    // Solo ejecutar si usuario está autenticado y no está en proceso de logout
    if (!isAuthenticated || isLoggingOut) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    const checkAndRefresh = async (): Promise<void> => {
      // No hacer nada si ya hay un refresh en progreso
      if (refreshingRef.current) {
        return
      }

      // No hacer nada si la app está en background
      if (appStateRef.current !== 'active') {
        return
      }

      try {
        // Verificar si el token necesita refresh (expira en < 2 minutos)
        const shouldRefresh = await TokenManager.shouldRefreshToken()

        if (shouldRefresh) {
          refreshingRef.current = true
          console.log('⏰ Token expira pronto, refrescando proactivamente...')

          // ✅ FIX: Implementar retry logic antes de logout
          const MAX_RETRIES = 3
          const RETRY_DELAY = 2000 // 2 segundos
          let success = false
          let lastError: unknown = null

          for (let attempt = 0; attempt <= MAX_RETRIES && !success; attempt++) {
            try {
              if (attempt > 0) {
                console.log(`🔄 Reintento ${attempt}/${MAX_RETRIES} de refresh proactivo...`)
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt))
              }

              await refreshTokens()
              console.log('✅ Token refrescado exitosamente de forma proactiva')
              success = true
            } catch (error) {
              lastError = error
              console.error(`❌ Intento ${attempt + 1}/${MAX_RETRIES + 1} falló:`, error)
            }
          }

          // Solo hacer logout si todos los reintentos fallaron
          if (!success) {
            console.error('❌ Todos los reintentos de refresh fallaron. Haciendo logout...', lastError)
            await logout()
          }

          refreshingRef.current = false
        }
      } catch (error) {
        console.error('Error checking token expiration:', error)
        refreshingRef.current = false
      }
    }

    // Handler para cambios de estado de la app
    const handleAppStateChange = (nextAppState: AppStateStatus): void => {
      // Si la app vuelve a foreground desde background
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('📱 App volvió a foreground, verificando token...')
        checkAndRefresh()
      }

      appStateRef.current = nextAppState
    }

    // Subscribirse a cambios de estado de la app
    const subscription = AppState.addEventListener('change', handleAppStateChange)

    // Revisar inmediatamente al montar
    checkAndRefresh()

    // Revisar cada 30 segundos
    intervalRef.current = setInterval(checkAndRefresh, 30000)

    // Cleanup
    return (): void => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      subscription.remove()
    }
  }, [isAuthenticated, isLoggingOut, refreshTokens, logout])
}
