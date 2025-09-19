import { QueryClient } from '@tanstack/react-query'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ENV } from '@/src/config/env'
import { App } from '@/src/types/auth.types'

// Query Keys estandarizadas
export const queryKeys = {
  // Autenticación
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
    profile: () => [...queryKeys.auth.all, 'profile'] as const,
    sessions: () => [...queryKeys.auth.all, 'sessions'] as const,
    session: (id: string) => [...queryKeys.auth.sessions(), id] as const
  },

  // Configuraciones
  settings: {
    all: ['settings'] as const,
    biometric: () => [...queryKeys.settings.all, 'biometric'] as const,
    security: () => [...queryKeys.settings.all, 'security'] as const
  },

  // Noticias (para futuro)
  news: {
    all: ['news'] as const,
    lists: () => [...queryKeys.news.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.news.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.news.all, 'detail', id] as const
  },

  // Analytics (para futuro)
  analytics: {
    all: ['analytics'] as const,
    events: () => [...queryKeys.analytics.all, 'events'] as const,
    metrics: () => [...queryKeys.analytics.all, 'metrics'] as const
  }
} as const


// Persister para AsyncStorage
export const createPersister = () => {
  return createAsyncStoragePersister({
    storage: AsyncStorage,
    key: 'tanstack-query-cache',
    // Serializar y deserializar dates correctamente
    serialize: (data) => JSON.stringify(data, (key, value) => {
      if (value instanceof Date) {
        return { __type: 'Date', value: value.toISOString() }
      }
      return value
    }),
    deserialize: (data) => JSON.parse(data, (key, value) => {
      if (value && typeof value === 'object' && value.__type === 'Date') {
        return new Date(value.value)
      }
      return value
    })
  })
}

// Cliente singleton - instancia directa
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 5 minutos
      staleTime: 5 * 60 * 1000,
      // Garbage collection después de 10 minutos
      gcTime: 10 * 60 * 1000,

      // Retry configuration
      retry: (failureCount, error) => {
        // No retry en errores de autenticación
        if (error && typeof error === 'object' && 'response' in error) {
          const status = (error as { response: { status: number } }).response.status
          if (status === 401 || status === 403) return false
        }

        // Máximo 3 reintentos para otros errores
        return failureCount < 3
      },

      // Exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // No refetch en background por defecto (mobile)
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,

      // Network mode
      networkMode: 'online'
    },

    mutations: {
      // Retry solo una vez para mutations
      retry: 1,
      retryDelay: 1000,
      networkMode: 'online'
    }
  }
})

// Configurar persistencia
export const setupQueryPersistence = async () => {
  const persister = createPersister()

  try {
    await persistQueryClient({
      queryClient,
      persister,
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
      // Solo persistir queries específicas
      hydrateOptions: {
        // Función para determinar qué queries persistir
        shouldDehydrateQuery: (query) => {
          // Persistir configuraciones y datos de usuario
          const persistableQueries = [
            'settings',
            'auth.user',
            'auth.profile'
          ]

          return persistableQueries.some(key =>
            query.queryKey[0] === key ||
            query.queryKey.join('.').startsWith(key)
          )
        }
      }
    })

    if (ENV.ENABLE_DEBUG_LOGGING) {
      console.log('Query persistence configured successfully')
    }
  } catch (error) {
    console.error('Failed to setup query persistence:', error)
  }
}

// Utilidades para manejo de cache

// Invalidar queries relacionadas con autenticación
export const invalidateAuthQueries = () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.auth.all })
}

// Limpiar toda la cache
export const clearAllQueries = () => {
  queryClient.clear()
}

// Remover queries específicas de autenticación
export const removeAuthQueries = () => {
  queryClient.removeQueries({ queryKey: queryKeys.auth.all })
}

// Prefetch datos del usuario
export const prefetchUserData = async (userId: string) => {
  // Esto se puede usar después del login para pre-cargar datos
  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: queryKeys.auth.user(),
      queryFn: async () => {
        const { AuthService } = await import('@/src/services/auth/AuthService')
        return AuthService.getCurrentUser()
      },
      staleTime: 10 * 60 * 1000 // 10 minutos
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.auth.sessions(),
      queryFn: async () => {
        const { AuthService } = await import('@/src/services/auth/AuthService')
        return AuthService.getActiveSessions()
      },
      staleTime: 5 * 60 * 1000 // 5 minutos
    })
  ])
}

// Configurar queries relacionadas con auth
export const setAuthQueriesData = (user: App.User) => {
  // Establecer datos del usuario en cache
  queryClient.setQueryData(queryKeys.auth.user(), user)
  queryClient.setQueryData(queryKeys.auth.profile(), user)
}

// Hook para debugging (solo desarrollo)
export const useQueryDevtools = () => {
  if (!ENV.ENABLE_DEBUG_LOGGING) return null

  return {
    getQueryCache: () => queryClient.getQueryCache(),
    getMutationCache: () => queryClient.getMutationCache(),
    getQueriesData: () => queryClient.getQueriesData({ queryKey: [] }),
    invalidateAll: () => queryClient.invalidateQueries(),
    clearAll: clearAllQueries,
    getStats: () => ({
      queries: queryClient.getQueryCache().getAll().length,
      mutations: queryClient.getMutationCache().getAll().length
    })
  }
}

// Tipos para ayuda con TypeScript
export type QueryKeys = typeof queryKeys

// Export de la instancia singleton
export { queryClient }

// Export default
export default queryClient