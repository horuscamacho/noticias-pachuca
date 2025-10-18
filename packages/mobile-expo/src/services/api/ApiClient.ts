import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { ENV, CONFIG } from '@/src/config/env'
import { TokenManager } from '@/src/services/auth/TokenManager'
import { DeviceInfoService } from '@/src/services/auth/DeviceInfoService'

export interface ApiResponse<T = unknown> {
  data: T
  message?: string
  timestamp: string
}

export interface ApiError {
  code: string
  message: string
  field?: string
  details?: Record<string, unknown>
  timestamp: string
}

class ApiClientImpl {
  private client: AxiosInstance
  private refreshPromise: Promise<string> | null = null
  private deviceId: string | null = null

  constructor() {
    this.client = axios.create({
      baseURL: ENV.API_BASE_URL,
      timeout: CONFIG.HTTP.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'x-platform': 'mobile',
        'x-app-version': '1.0.0',
      }
    })

    this.setupInterceptors()
    this.initializeDeviceId()
  }

  private async initializeDeviceId(): Promise<void> {
    try {
      this.deviceId = await DeviceInfoService.getDeviceId()
    } catch (error) {
      console.warn('Failed to get device ID:', error)
    }
  }

  private setupInterceptors(): void {
    // Request interceptor - Agregar token y device ID
    this.client.interceptors.request.use(
      async (config) => {
        try {
          // Agregar token de acceso
          const token = await TokenManager.getAccessToken()
          if (token) {
            config.headers.Authorization = `Bearer ${token}`
          }

          // Agregar device ID
          if (this.deviceId) {
            config.headers['x-device-id'] = this.deviceId
          }

          // Logging en desarrollo
          if (ENV.ENABLE_DEBUG_LOGGING) {
            console.log(`🌐 ${config.method?.toUpperCase()} ${config.url}`, {
              headers: config.headers,
              data: config.data
            })
          }
        } catch (error) {
          console.warn('Request interceptor error:', error)
        }

        return config
      },
      (error) => {
        console.error('Request interceptor error:', error)
        return Promise.reject(error)
      }
    )

    // Response interceptor - Manejo de errores y auto-refresh
    this.client.interceptors.response.use(
      (response) => {
        if (ENV.ENABLE_DEBUG_LOGGING) {
          console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            status: response.status,
            data: response.data
          })
        }
        return response
      },
      async (error: AxiosError) => {
        const originalRequest = error.config

        if (ENV.ENABLE_DEBUG_LOGGING) {
          console.log(`❌ ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
            status: error.response?.status,
            message: error.message
          })
        }

        // Auto-refresh en 401 (token expirado) - EXCEPTO para endpoints de auth
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          // No intentar refresh si ya estamos en endpoints de auth que no necesitan retry
          const isAuthEndpoint = originalRequest.url?.includes('/auth/')
          const isProtectedEndpoint = !isAuthEndpoint || originalRequest.url?.includes('/auth/me')

          if (!isProtectedEndpoint) {
            console.log('🚨 ApiClient interceptor - 401 on auth endpoint, skipping refresh')
            throw error
          }

          console.log('🚨 ApiClient interceptor - 401 detected, attempting token refresh')
          originalRequest._retry = true

          try {
            await this.handleTokenRefresh()
            console.log('🚨 ApiClient interceptor - Token refresh successful, retrying original request')
            // Reintentar request original con nuevo token
            return this.client.request(originalRequest)
          } catch (refreshError) {
            console.log('🚨 ApiClient interceptor - Token refresh failed, calling handleAuthFailure')
            // Si el refresh falla, limpiar sesión
            await this.handleAuthFailure()
            throw error
          }
        }

        // Otros errores de autenticación
        if (error.response?.status === 403) {
          await this.handleAuthFailure()
        }

        return Promise.reject(this.formatError(error))
      }
    )
  }

  private async handleTokenRefresh(): Promise<void> {
    console.log('🚨 ApiClient.handleTokenRefresh() - Starting token refresh')

    // Solo un refresh simultáneo
    if (!this.refreshPromise) {
      this.refreshPromise = TokenManager.refreshToken()
    }

    try {
      await this.refreshPromise
      console.log('🚨 ApiClient.handleTokenRefresh() - Token refresh successful')
    } catch (error) {
      console.log('🚨 ApiClient.handleTokenRefresh() - Token refresh failed:', error)
      throw error
    } finally {
      this.refreshPromise = null
    }
  }

  private async handleAuthFailure(): Promise<void> {
    console.log('🚨 ApiClient.handleAuthFailure() - Starting auth failure cleanup')

    // Importación dinámica para evitar dependencias circulares
    const { authStore } = await import('@/src/stores/authStore')

    const state = authStore.getState()
    console.log('🚨 ApiClient.handleAuthFailure() - Current auth state:', {
      isLoggingOut: state.isLoggingOut,
      isAuthenticated: state.isAuthenticated,
      isInitialized: state.isInitialized
    })

    // Solo hacer logout si estamos autenticados y no ya en proceso de logout
    if (state.isAuthenticated && !state.isLoggingOut) {
      console.log('🚨 ApiClient.handleAuthFailure() - Calling logout()')
      await state.logout()
      console.log('🚨 ApiClient.handleAuthFailure() - Logout completed')
    } else {
      console.log('🚨 ApiClient.handleAuthFailure() - Skipping logout (not authenticated or already logging out)')
      // Si no estamos autenticados, al menos limpiar tokens
      const { TokenManager } = await import('@/src/services/auth/TokenManager')
      await TokenManager.clearTokens()
    }
  }

  private formatError(error: AxiosError): ApiError {
    const response = error.response?.data as { message?: string; code?: string; field?: string }

    return {
      code: response?.code || `HTTP_${error.response?.status}` || 'NETWORK_ERROR',
      message: response?.message || error.message || 'Network error occurred',
      field: response?.field,
      timestamp: new Date().toISOString()
    }
  }

  // Métodos HTTP principales

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, config)

    // Para auth endpoints que devuelven data directamente
    if (url.includes('/auth/')) {
      return response.data as T
    }

    // ✅ FIX: Verificar que data existe antes de retornar
    if (!response.data) {
      console.error('❌ API response has no data:', url)
      throw new Error('API response has no data')
    }

    // ✅ FIX: Si data.data no existe, retornar response.data directamente
    if (response.data.data === undefined) {
      console.warn('⚠️ API response.data.data is undefined, returning response.data:', url)
      return response.data as unknown as T
    }

    return response.data.data
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config)

    // Para auth endpoints que devuelven data directamente
    if (url.includes('/auth/')) {
      return response.data as T
    }

    return response.data.data
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config)
    return response.data.data
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config)
    return response.data.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url, config)
    return response.data.data
  }

  // Helpers especializados

  async uploadFile<T>(
    url: string,
    file: File | Blob,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)

    return this.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      }
    })
  }

  async downloadFile(url: string, filename?: string): Promise<Blob> {
    const response = await this.client.get(url, {
      responseType: 'blob'
    })

    if (filename) {
      const blob = new Blob([response.data])
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    }

    return response.data
  }

  // Métodos utilitarios

  getBaseURL(): string {
    return this.client.defaults.baseURL || ''
  }

  setAuthToken(token: string): void {
    this.client.defaults.headers.common.Authorization = `Bearer ${token}`
  }

  removeAuthToken(): void {
    delete this.client.defaults.headers.common.Authorization
  }

  // Para casos especiales donde se necesita acceso directo
  getRawClient(): AxiosInstance {
    return this.client
  }
}

// Singleton - ÚNICO cliente para toda la app
export const ApiClient = new ApiClientImpl()

// Agregar el tipo de _retry a AxiosRequestConfig
declare module 'axios' {
  interface AxiosRequestConfig {
    _retry?: boolean
  }
}