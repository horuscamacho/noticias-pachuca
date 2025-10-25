import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/src/stores/authStore'
import { AuthService } from '@/src/services/auth/AuthService'
import { queryKeys, invalidateAuthQueries, removeAuthQueries, setAuthQueriesData } from '@/src/config/queryClient'
import { App, AuthError } from '@/src/types/auth.types'

export const useAuth = () => {
  const queryClient = useQueryClient()
  const {
    user,
    isAuthenticated,
    isInitialized,
    authMethod,
    isLoading,
    isLoggingIn,
    isLoggingOut,
    isRefreshing,
    error,
    lastLoginAt,
    sessionExpiresAt,
    // Actions
    initialize,
    login: loginAction,
    loginWithBiometrics: loginWithBiometricsAction,
    logout: logoutAction,
    refreshTokens,
    setError,
    clearError
  } = useAuthStore()

  // Query para datos del usuario actual
  const userQuery = useQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: AuthService.getCurrentUser,
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutos
    retry: false // No retry para evitar loops
  })

  // Query para sesiones activas - DESHABILITADA (endpoint no existe)
  const sessionsQuery = useQuery({
    queryKey: queryKeys.auth.sessions(),
    queryFn: AuthService.getActiveSessions,
    enabled: false, // Endpoint no implementado en API
    staleTime: 5 * 60 * 1000 // 5 minutos
  })

  // Mutation para login con credenciales
  const loginMutation = useMutation({
    mutationFn: (credentials: App.LoginCredentials) => loginAction(credentials),
    onSuccess: (session) => {
      // Actualizar cache con datos del usuario
      setAuthQueriesData(session.user)
      // Invalidar queries relacionadas
      invalidateAuthQueries()
      clearError()
    },
    onError: (error: AuthError) => {
      setError(error)
    }
  })

  // Mutation para login biométrico
  const biometricLoginMutation = useMutation({
    mutationFn: () => loginWithBiometricsAction(),
    onSuccess: (session) => {
      setAuthQueriesData(session.user)
      invalidateAuthQueries()
      clearError()
    },
    onError: (error: AuthError) => {
      setError(error)
    }
  })

  // Mutation para registro
  const registerMutation = useMutation({
    mutationFn: (userData: App.RegisterData) => AuthService.register(userData),
    onSuccess: async (session) => {
      // Actualizar store manualmente ya que register no pasa por loginAction
      useAuthStore.getState().setUser(session.user)
      useAuthStore.getState().setAuthenticated(true)
      useAuthStore.getState().setAuthMethod('password')
      useAuthStore.getState().updateLastLogin()

      setAuthQueriesData(session.user)
      invalidateAuthQueries()
      clearError()
    },
    onError: (error: AuthError) => {
      setError(error)
    }
  })

  // Mutation para logout
  const logoutMutation = useMutation({
    mutationFn: (allDevices = false) => logoutAction(allDevices),
    onSuccess: () => {
      // Limpiar todas las queries de auth
      removeAuthQueries()
      clearError()
    },
    onError: (error: AuthError) => {
      // Incluso si falla el logout en servidor, limpiar local
      removeAuthQueries()
      setError(error)
    }
  })

  // Mutation para cambio de contraseña
  const changePasswordMutation = useMutation({
    mutationFn: AuthService.changePassword,
    onSuccess: () => {
      clearError()
    },
    onError: (error: AuthError) => {
      setError(error)
    }
  })

  // Mutation para forgot password
  const forgotPasswordMutation = useMutation({
    mutationFn: AuthService.forgotPassword,
    onError: (error: AuthError) => {
      setError(error)
    }
  })

  // Mutation para reset password
  const resetPasswordMutation = useMutation({
    mutationFn: AuthService.resetPassword,
    onError: (error: AuthError) => {
      setError(error)
    }
  })

  // Mutation para verificar email
  const verifyEmailMutation = useMutation({
    mutationFn: AuthService.verifyEmail,
    onSuccess: () => {
      // Refrescar datos del usuario para actualizar emailVerified
      userQuery.refetch()
      clearError()
    },
    onError: (error: AuthError) => {
      setError(error)
    }
  })

  // Mutation para terminar sesión específica
  const terminateSessionMutation = useMutation({
    mutationFn: AuthService.terminateSession,
    onSuccess: () => {
      // Refrescar lista de sesiones
      sessionsQuery.refetch()
      clearError()
    },
    onError: (error: AuthError) => {
      setError(error)
    }
  })

  // Métodos de conveniencia
  const login = useCallback((credentials: App.LoginCredentials) => {
    clearError()
    return loginMutation.mutateAsync(credentials)
  }, [loginMutation, clearError])

  const loginBiometric = useCallback(() => {
    clearError()
    return biometricLoginMutation.mutateAsync()
  }, [biometricLoginMutation, clearError])

  const register = useCallback((userData: App.RegisterData) => {
    clearError()
    return registerMutation.mutateAsync(userData)
  }, [registerMutation, clearError])

  const logout = useCallback((allDevices = false) => {
    clearError()
    return logoutMutation.mutateAsync(allDevices)
  }, [logoutMutation, clearError])

  const changePassword = useCallback((data: App.ChangePasswordData) => {
    clearError()
    return changePasswordMutation.mutateAsync(data)
  }, [changePasswordMutation, clearError])

  const forgotPassword = useCallback((data: App.ForgotPasswordData) => {
    clearError()
    return forgotPasswordMutation.mutateAsync(data)
  }, [forgotPasswordMutation, clearError])

  const resetPassword = useCallback((data: App.ResetPasswordData) => {
    clearError()
    return resetPasswordMutation.mutateAsync(data)
  }, [resetPasswordMutation, clearError])

  const verifyEmail = useCallback((token: string) => {
    clearError()
    return verifyEmailMutation.mutateAsync(token)
  }, [verifyEmailMutation, clearError])

  const terminateSession = useCallback((sessionId: string) => {
    clearError()
    return terminateSessionMutation.mutateAsync(sessionId)
  }, [terminateSessionMutation, clearError])

  const refresh = useCallback(async () => {
    try {
      await refreshTokens()
      userQuery.refetch()
    } catch (error) {
      console.error('Token refresh failed:', error)
    }
  }, [refreshTokens, userQuery])

  // Verificar disponibilidad de username/email
  const checkUsernameAvailability = useCallback((username: string) => {
    return queryClient.fetchQuery({
      queryKey: ['auth', 'check-username', username],
      queryFn: () => AuthService.checkUsernameAvailability(username),
      staleTime: 30 * 1000 // 30 segundos
    })
  }, [queryClient])

  const checkEmailAvailability = useCallback((email: string) => {
    return queryClient.fetchQuery({
      queryKey: ['auth', 'check-email', email],
      queryFn: () => AuthService.checkEmailAvailability(email),
      staleTime: 30 * 1000 // 30 segundos
    })
  }, [queryClient])

  return {
    // Estado
    user: userQuery.data || user,
    isAuthenticated,
    isInitialized,
    authMethod,
    lastLoginAt,
    sessionExpiresAt,

    // Estados de carga
    isLoading: isLoading || userQuery.isLoading,
    isLoggingIn: isLoggingIn || loginMutation.isPending || biometricLoginMutation.isPending,
    isLoggingOut: isLoggingOut || logoutMutation.isPending,
    isRefreshing: isRefreshing || userQuery.isRefetching,
    isRegistering: registerMutation.isPending,

    // Operaciones específicas
    isChangingPassword: changePasswordMutation.isPending,
    isForgettingPassword: forgotPasswordMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,
    isVerifyingEmail: verifyEmailMutation.isPending,
    isTerminatingSession: terminateSessionMutation.isPending,

    // Errores
    error,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    changePasswordError: changePasswordMutation.error,

    // Datos adicionales
    sessions: sessionsQuery.data || [],
    isLoadingSessions: sessionsQuery.isLoading,

    // Métodos principales
    initialize,
    login,
    loginBiometric,
    register,
    logout,
    refresh,

    // Métodos de gestión
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    terminateSession,

    // Validaciones
    checkUsernameAvailability,
    checkEmailAvailability,
    validatePasswordStrength: AuthService.validatePasswordStrength,
    validateEmail: AuthService.validateEmail,
    validateUsername: AuthService.validateUsername,

    // Utilidades
    clearError,
    hasActiveSession: () => AuthService.hasActiveSession(),

    // Resultados de mutations para acceso a data
    loginResult: loginMutation.data,
    registerResult: registerMutation.data,
    forgotPasswordResult: forgotPasswordMutation.data,
    resetPasswordResult: resetPasswordMutation.data,
    verifyEmailResult: verifyEmailMutation.data
  }
}