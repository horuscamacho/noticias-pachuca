import Constants from 'expo-constants'
import * as Device from 'expo-device'
import { Platform } from 'react-native'

interface EnvConfig {
  API_BASE_URL: string
  ENABLE_BIOMETRICS: boolean
  ENABLE_DEBUG_LOGGING: boolean
  JWT_SECRET_KEY?: string
}

const getApiBaseUrl = (): string => {
  if (__DEV__) {
    // Usar expo-device para detección correcta
    const isPhysicalDevice = Device.isDevice

    console.log('🔍 Device Detection Debug:', {
      'Device.isDevice': Device.isDevice,
      'Device.deviceName': Device.deviceName,
      'Device.brand': Device.brand,
      'Device.modelName': Device.modelName,
      'Platform.OS': Platform.OS,
      'Constants.deviceName': Constants.deviceName,
      'Calculated isPhysicalDevice': isPhysicalDevice
    })

    if (isPhysicalDevice) {
      // Dispositivo físico - usar IP de red local
      console.log('📱 Using PHYSICAL DEVICE URL')
      return 'http://192.168.100.34:3000/api'
    } else {
      // Simulador - usar localhost
      console.log('🖥️ Using SIMULATOR URL')
      if (Platform.OS === 'android') {
        return 'http://10.0.2.2:3000/api'  // Android emulator localhost
      } else {
        return 'http://localhost:3000/api'  // iOS simulator
      }
    }
  }
  return 'https://your-production-api.com/api'
}

export const ENV: EnvConfig = {
  API_BASE_URL: getApiBaseUrl(),
  ENABLE_BIOMETRICS: true,
  ENABLE_DEBUG_LOGGING: __DEV__,
  JWT_SECRET_KEY: Constants.expoConfig?.extra?.jwtSecret
}

// Función para debugging - muestra qué URL se está usando
export const getDeviceInfo = () => {
  const isPhysicalDevice = Device.isDevice
  const platform = Platform.OS
  const apiUrl = ENV.API_BASE_URL

  return {
    isPhysicalDevice,
    isSimulator: !isPhysicalDevice,
    platform,
    apiUrl,
    deviceName: Device.deviceName || Constants.deviceName || 'Unknown',
    brand: Device.brand,
    modelName: Device.modelName
  }
}

// Log de la configuración al iniciar (solo en desarrollo)
if (__DEV__) {
  const info = getDeviceInfo()
  console.log('🔧 API Configuration:', {
    'Device Type': info.isPhysicalDevice ? 'Physical Device' : 'Simulator',
    'Platform': info.platform,
    'API URL': info.apiUrl,
    'Device': info.deviceName
  })
}

export const CONFIG = {
  TOKEN: {
    ACCESS_TOKEN_DURATION: 15 * 60 * 1000, // 15 minutos
    REFRESH_TOKEN_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 días
    AUTO_REFRESH_THRESHOLD: 2 * 60 * 1000, // Refresh 2 min antes de expirar
  },
  HTTP: {
    TIMEOUT: 10000, // 10 segundos
    MAX_RETRIES: 3,
    RETRY_DELAY_BASE: 1000, // 1 segundo base para exponential backoff
  },
  STORAGE: {
    ACCESS_TOKEN_KEY: 'access_token',
    REFRESH_TOKEN_KEY: 'refresh_token',
    USER_DATA_KEY: 'user_data',
    DEVICE_ID_KEY: 'device_id',
    BIOMETRIC_ENABLED_KEY: 'biometric_enabled',
  }
}