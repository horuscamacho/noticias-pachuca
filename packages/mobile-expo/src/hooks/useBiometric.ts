import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { BiometricManager } from '@/src/services/auth/BiometricManager'
import { useAppStore } from '@/src/stores/appStore'
import { queryKeys } from '@/src/config/queryClient'
import { BiometricConfig } from '@/src/types/auth.types'

export const useBiometric = () => {
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const { biometricsEnabled, setBiometricsEnabled } = useAppStore()

  // Query para obtener capacidades biométricas
  const capabilitiesQuery = useQuery({
    queryKey: queryKeys.settings.biometric(),
    queryFn: BiometricManager.getCapabilities,
    staleTime: 5 * 60 * 1000, // 5 minutos (las capacidades no cambian frecuentemente)
    retry: 1
  })

  // Query para estado descriptivo
  const statusQuery = useQuery({
    queryKey: [...queryKeys.settings.biometric(), 'status'],
    queryFn: BiometricManager.getStatusDescription,
    enabled: !!capabilitiesQuery.data,
    staleTime: 2 * 60 * 1000 // 2 minutos
  })

  // Mutation para autenticación biométrica
  const authenticateMutation = useMutation({
    mutationFn: (options?: {
      promptMessage?: string
      cancelLabel?: string
      fallbackLabel?: string
      disableDeviceFallback?: boolean
    }) => BiometricManager.authenticate(options || {}),
    onMutate: () => {
      setIsAuthenticating(true)
    },
    onSettled: () => {
      setIsAuthenticating(false)
    }
  })

  // Mutation para configurar biometría
  const setupMutation = useMutation({
    mutationFn: BiometricManager.setupBiometrics,
    onSuccess: (result) => {
      if (result.success) {
        setBiometricsEnabled(true)
        // Invalidar queries para refrescar estado
        capabilitiesQuery.refetch()
        statusQuery.refetch()
      }
    }
  })

  // Mutation para test de biometría
  const testMutation = useMutation({
    mutationFn: BiometricManager.testBiometrics,
    onMutate: () => {
      setIsAuthenticating(true)
    },
    onSettled: () => {
      setIsAuthenticating(false)
    }
  })

  // Mutation para habilitar/deshabilitar biometría
  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      await BiometricManager.setBiometricEnabled(enabled)
      return enabled
    },
    onSuccess: (enabled) => {
      setBiometricsEnabled(enabled)
      // Invalidar cache para refrescar capacidades
      BiometricManager.invalidateCache()
      capabilitiesQuery.refetch()
      statusQuery.refetch()
    }
  })

  // Invalidar cache cuando cambian las configuraciones del dispositivo
  useEffect(() => {
    const handleAppStateChange = () => {
      // Invalidar cache para detectar cambios en configuración biométrica
      BiometricManager.invalidateCache()
      capabilitiesQuery.refetch()
    }

    // Esto se puede extender para escuchar cambios en settings del dispositivo
    // AppState.addEventListener('change', handleAppStateChange)

    return () => {
      // AppState.removeEventListener('change', handleAppStateChange)
    }
  }, [capabilitiesQuery])

  // Métodos de conveniencia
  const authenticate = useCallback(async (options?: {
    promptMessage?: string
    cancelLabel?: string
    fallbackLabel?: string
    disableDeviceFallback?: boolean
  }) => {
    const result = await authenticateMutation.mutateAsync(options)
    return result
  }, [authenticateMutation])

  const setup = useCallback(async () => {
    const result = await setupMutation.mutateAsync()
    return result
  }, [setupMutation])

  const test = useCallback(async () => {
    const result = await testMutation.mutateAsync()
    return result
  }, [testMutation])

  const enable = useCallback(async () => {
    await toggleMutation.mutateAsync(true)
  }, [toggleMutation])

  const disable = useCallback(async () => {
    await toggleMutation.mutateAsync(false)
  }, [toggleMutation])

  const toggle = useCallback(async () => {
    const newValue = !biometricsEnabled
    await toggleMutation.mutateAsync(newValue)
  }, [toggleMutation, biometricsEnabled])

  // Verificar disponibilidad
  const canUseBiometrics = useCallback(async () => {
    return BiometricManager.canUseBiometrics()
  }, [])

  // Obtener mensaje del tipo de biometría
  const getBiometricTypeMessage = useCallback(async () => {
    return BiometricManager.getBiometricTypeMessage()
  }, [])

  // Limpiar configuraciones
  const clearSettings = useCallback(async () => {
    await BiometricManager.clearBiometricSettings()
    setBiometricsEnabled(false)
    BiometricManager.invalidateCache()
    capabilitiesQuery.refetch()
    statusQuery.refetch()
  }, [setBiometricsEnabled, capabilitiesQuery, statusQuery])

  // Refrescar datos
  const refresh = useCallback(() => {
    BiometricManager.invalidateCache()
    capabilitiesQuery.refetch()
    statusQuery.refetch()
  }, [capabilitiesQuery, statusQuery])

  // Datos derivados
  const capabilities = capabilitiesQuery.data
  const status = statusQuery.data

  return {
    // Estado actual
    capabilities,
    status,
    isEnabled: biometricsEnabled,

    // Capacidades específicas
    isSupported: capabilities?.isSupported ?? false,
    isEnrolled: capabilities?.isEnrolled ?? false,
    biometricType: capabilities?.biometricType ?? 'none',
    canUse: capabilities?.isEnabled ?? false,

    // Estados de carga
    isLoading: capabilitiesQuery.isLoading || statusQuery.isLoading,
    isAuthenticating: isAuthenticating || authenticateMutation.isPending,
    isSettingUp: setupMutation.isPending,
    isTesting: testMutation.isPending,
    isToggling: toggleMutation.isPending,

    // Errores
    error: capabilitiesQuery.error || statusQuery.error,
    authError: authenticateMutation.error,
    setupError: setupMutation.error,
    testError: testMutation.error,

    // Resultados de operaciones
    lastAuthResult: authenticateMutation.data,
    setupResult: setupMutation.data,
    testResult: testMutation.data,

    // Métodos principales
    authenticate,
    setup,
    test,
    enable,
    disable,
    toggle,

    // Métodos utilitarios
    canUseBiometrics,
    getBiometricTypeMessage,
    clearSettings,
    refresh,

    // Validaciones rápidas
    isReady: capabilities?.isSupported && capabilities?.isEnrolled && biometricsEnabled,
    needsSetup: capabilities?.isSupported && !capabilities?.isEnrolled,
    needsEnabling: capabilities?.isSupported && capabilities?.isEnrolled && !biometricsEnabled,

    // Mensajes de ayuda
    statusMessage: status?.message,
    actionRequired: status?.actionRequired,

    // Control de queries
    refetchCapabilities: capabilitiesQuery.refetch,
    refetchStatus: statusQuery.refetch
  }
}

// Hook especializado para verificación rápida
export const useBiometricAvailability = () => {
  const [canUse, setCanUse] = useState<boolean | null>(null)

  useEffect(() => {
    BiometricManager.canUseBiometrics().then(setCanUse)
  }, [])

  return {
    canUse,
    isLoading: canUse === null,
    refresh: () => BiometricManager.canUseBiometrics().then(setCanUse)
  }
}

// Hook para configuración inicial
export const useBiometricSetup = () => {
  const { capabilities, setup, test, isSettingUp, isTesting, setupResult, testResult } = useBiometric()

  const [setupStep, setSetupStep] = useState<'check' | 'test' | 'enable' | 'complete'>('check')

  const startSetup = useCallback(async () => {
    try {
      setSetupStep('test')
      const testResult = await test()

      if (testResult.success) {
        setSetupStep('enable')
        const setupResult = await setup()

        if (setupResult.success) {
          setSetupStep('complete')
          return { success: true, message: setupResult.message }
        } else {
          setSetupStep('check')
          return { success: false, message: setupResult.message }
        }
      } else {
        setSetupStep('check')
        return { success: false, message: testResult.error || 'Biometric test failed' }
      }
    } catch (error) {
      setSetupStep('check')
      return { success: false, message: 'Setup failed unexpectedly' }
    }
  }, [test, setup])

  const resetSetup = useCallback(() => {
    setSetupStep('check')
  }, [])

  return {
    capabilities,
    setupStep,
    isWorking: isSettingUp || isTesting,
    startSetup,
    resetSetup,
    canStartSetup: capabilities?.isSupported && capabilities?.isEnrolled,
    setupResult,
    testResult
  }
}