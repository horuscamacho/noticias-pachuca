// === EXPORT PRINCIPAL DEL SISTEMA DE AUTENTICACIÓN ===

// Configuración
export { ENV, CONFIG } from './config/env'
export { queryClient, queryKeys, setupQueryPersistence } from './config/queryClient'

// Servicios
export * from './services/auth'
export { ApiClient } from './services/api/ApiClient'

// Stores
export * from './stores'

// Hooks
export * from './hooks'

// Tipos
export * from './types/auth.types'

// Utilidades
export * from './utils/mappers'

// === INICIALIZACIÓN RÁPIDA ===

export const AuthSystem = {
  // Servicios principales
  AuthService: () => import('./services/auth/AuthService').then(m => m.AuthService),
  TokenManager: () => import('./services/auth/TokenManager').then(m => m.TokenManager),
  BiometricManager: () => import('./services/auth/BiometricManager').then(m => m.BiometricManager),

  // Cliente HTTP único
  ApiClient: () => import('./services/api/ApiClient').then(m => m.ApiClient),

  // Configuración
  initialize: async () => {
    const { setupQueryPersistence } = await import('./config/queryClient')
    await setupQueryPersistence()
  }
}