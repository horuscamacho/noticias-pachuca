import * as LocalAuthentication from 'expo-local-authentication'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { CONFIG } from '@/src/config/env'
import { BiometricConfig } from '@/src/types/auth.types'

export class BiometricManager {
  private static cachedConfig: BiometricConfig | null = null

  // Detectar capacidades biométricas del dispositivo
  static async getCapabilities(): Promise<BiometricConfig> {
    if (this.cachedConfig) {
      return this.cachedConfig
    }

    try {
      const [hasHardware, isEnrolled, availableTypes, isEnabled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        LocalAuthentication.supportedAuthenticationTypesAsync(),
        this.isBiometricEnabled()
      ])

      let biometricType: BiometricConfig['biometricType'] = 'none'

      if (availableTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricType = 'face'
      } else if (availableTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricType = 'fingerprint'
      } else if (availableTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        biometricType = 'iris'
      }

      this.cachedConfig = {
        isSupported: hasHardware,
        isEnrolled,
        biometricType,
        isEnabled: isEnabled && hasHardware && isEnrolled
      }

      return this.cachedConfig
    } catch (error) {
      console.error('Error getting biometric capabilities:', error)

      this.cachedConfig = {
        isSupported: false,
        isEnrolled: false,
        biometricType: 'none',
        isEnabled: false
      }

      return this.cachedConfig
    }
  }

  // Verificar si biometría está habilitada por el usuario
  static async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(CONFIG.STORAGE.BIOMETRIC_ENABLED_KEY)
      return enabled === 'true'
    } catch {
      return false
    }
  }

  // Habilitar/deshabilitar biometría
  static async setBiometricEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(CONFIG.STORAGE.BIOMETRIC_ENABLED_KEY, enabled.toString())
      // Limpiar cache para refrescar configuración
      this.cachedConfig = null
    } catch (error) {
      console.error('Error setting biometric enabled:', error)
      throw new Error('Failed to update biometric settings')
    }
  }

  // Autenticar con biometría
  static async authenticate(options: {
    promptMessage?: string
    cancelLabel?: string
    fallbackLabel?: string
    disableDeviceFallback?: boolean
  } = {}): Promise<{
    success: boolean
    error?: string
    errorCode?: string
  }> {
    try {
      const capabilities = await this.getCapabilities()

      if (!capabilities.isSupported) {
        return {
          success: false,
          error: 'Biometric authentication is not supported on this device',
          errorCode: 'NOT_SUPPORTED'
        }
      }

      if (!capabilities.isEnrolled) {
        return {
          success: false,
          error: 'No biometric credentials are enrolled on this device',
          errorCode: 'NOT_ENROLLED'
        }
      }

      if (!capabilities.isEnabled) {
        return {
          success: false,
          error: 'Biometric authentication is disabled',
          errorCode: 'DISABLED'
        }
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: options.promptMessage || 'Authenticate to access your account',
        cancelLabel: options.cancelLabel || 'Cancel',
        fallbackLabel: options.fallbackLabel || 'Use Passcode',
        disableDeviceFallback: options.disableDeviceFallback || false
      })

      if (result.success) {
        return { success: true }
      }

      // Mapear errores específicos
      let errorCode = 'UNKNOWN_ERROR'
      let errorMessage = 'Authentication failed'

      if (result.error === 'user_cancel') {
        errorCode = 'USER_CANCEL'
        errorMessage = 'Authentication was cancelled by user'
      } else if (result.error === 'user_fallback') {
        errorCode = 'USER_FALLBACK'
        errorMessage = 'User chose to use device passcode'
      } else if (result.error === 'system_cancel') {
        errorCode = 'SYSTEM_CANCEL'
        errorMessage = 'Authentication was cancelled by system'
      } else if (result.error === 'app_cancel') {
        errorCode = 'APP_CANCEL'
        errorMessage = 'Authentication was cancelled by app'
      } else if (result.error === 'invalid_context') {
        errorCode = 'INVALID_CONTEXT'
        errorMessage = 'Authentication context is invalid'
      }

      return {
        success: false,
        error: errorMessage,
        errorCode
      }
    } catch (error) {
      console.error('Biometric authentication error:', error)
      return {
        success: false,
        error: 'An unexpected error occurred during authentication',
        errorCode: 'SYSTEM_ERROR'
      }
    }
  }

  // Verificar si puede usar biometría ahora
  static async canUseBiometrics(): Promise<boolean> {
    const capabilities = await this.getCapabilities()
    return capabilities.isSupported && capabilities.isEnrolled && capabilities.isEnabled
  }

  // Obtener mensaje descriptivo del tipo de biometría
  static async getBiometricTypeMessage(): Promise<string> {
    const capabilities = await this.getCapabilities()

    switch (capabilities.biometricType) {
      case 'face':
        return 'Face ID'
      case 'fingerprint':
        return 'Fingerprint'
      case 'iris':
        return 'Iris recognition'
      default:
        return 'Biometric authentication'
    }
  }

  // Obtener descripción completa del estado
  static async getStatusDescription(): Promise<{
    canUse: boolean
    message: string
    actionRequired?: string
  }> {
    const capabilities = await this.getCapabilities()

    if (!capabilities.isSupported) {
      return {
        canUse: false,
        message: 'This device does not support biometric authentication'
      }
    }

    if (!capabilities.isEnrolled) {
      return {
        canUse: false,
        message: 'No biometric credentials are set up on this device',
        actionRequired: 'Set up Face ID or Touch ID in your device settings'
      }
    }

    if (!capabilities.isEnabled) {
      return {
        canUse: false,
        message: 'Biometric authentication is disabled for this app',
        actionRequired: 'Enable biometric authentication in app settings'
      }
    }

    const typeMessage = await this.getBiometricTypeMessage()
    return {
      canUse: true,
      message: `${typeMessage} is ready to use`
    }
  }

  // Test de biometría (para configuración inicial)
  static async testBiometrics(): Promise<{
    success: boolean
    capabilities: BiometricConfig
    error?: string
  }> {
    try {
      const capabilities = await this.getCapabilities()

      if (!capabilities.isSupported || !capabilities.isEnrolled) {
        return {
          success: false,
          capabilities,
          error: 'Biometric authentication is not available'
        }
      }

      const authResult = await this.authenticate({
        promptMessage: 'Test biometric authentication',
        disableDeviceFallback: true
      })

      return {
        success: authResult.success,
        capabilities,
        error: authResult.error
      }
    } catch (error) {
      console.error('Biometric test error:', error)
      const capabilities = await this.getCapabilities()

      return {
        success: false,
        capabilities,
        error: 'Failed to test biometric authentication'
      }
    }
  }

  // Limpiar configuración de biometría
  static async clearBiometricSettings(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CONFIG.STORAGE.BIOMETRIC_ENABLED_KEY)
      this.cachedConfig = null
    } catch (error) {
      console.error('Error clearing biometric settings:', error)
    }
  }

  // Invalidar cache (útil cuando cambian las configuraciones del dispositivo)
  static invalidateCache(): void {
    this.cachedConfig = null
  }

  // Configuración rápida para habilitar biometría
  static async setupBiometrics(): Promise<{
    success: boolean
    message: string
    capabilities?: BiometricConfig
  }> {
    try {
      const testResult = await this.testBiometrics()

      if (!testResult.success) {
        return {
          success: false,
          message: testResult.error || 'Biometric setup failed',
          capabilities: testResult.capabilities
        }
      }

      await this.setBiometricEnabled(true)

      const typeMessage = await this.getBiometricTypeMessage()

      return {
        success: true,
        message: `${typeMessage} has been enabled successfully`,
        capabilities: testResult.capabilities
      }
    } catch (error) {
      console.error('Biometric setup error:', error)
      return {
        success: false,
        message: 'Failed to set up biometric authentication'
      }
    }
  }
}