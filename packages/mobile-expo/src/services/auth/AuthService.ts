import { ApiClient } from '@/src/services/api/ApiClient'
import { DeviceInfoService } from './DeviceInfoService'
import { TokenManager } from './TokenManager'
import { AuthMapper, UserMapper, ErrorMapper } from '@/src/utils/mappers'
import { API, App, AuthError } from '@/src/types/auth.types'

export class AuthService {
  // 1. POST /auth/login - Login con email/username
  static async login(credentials: App.LoginCredentials): Promise<App.AuthSession> {
    try {
      const deviceId = await DeviceInfoService.getDeviceId()
      const loginRequest = AuthMapper.loginRequestToAPI(credentials, deviceId)

      const response = await ApiClient.post<API.LoginResponse>('/auth/login', loginRequest)

      const session = AuthMapper.loginResponseToApp(response)

      // Almacenar tokens automáticamente
      await TokenManager.setTokens(session.tokens)

      // Obtener datos del usuario ahora que tenemos los tokens
      try {
        const user = await this.getCurrentUser()
        session.user = user
      } catch (userError) {
        console.warn('Could not fetch user after login:', userError)
        // Continuar sin user, se obtendrá en el siguiente intento
      }

      return session
    } catch (error) {
      throw this.handleAuthError(error, 'LOGIN_FAILED')
    }
  }

  // 2. POST /auth/register - Registro completo
  static async register(userData: App.RegisterData): Promise<App.AuthSession> {
    try {
      const registerRequest = AuthMapper.registerDataToAPI(userData)

      const response = await ApiClient.post<API.LoginResponse>('/auth/register', registerRequest)

      const session = AuthMapper.loginResponseToApp(response)

      // Almacenar tokens automáticamente tras registro exitoso
      await TokenManager.setTokens(session.tokens)

      return session
    } catch (error) {
      throw this.handleAuthError(error, 'REGISTRATION_FAILED')
    }
  }

  // 3. POST /auth/refresh - Renovar tokens
  static async refreshTokens(): Promise<App.TokenPair> {
    try {
      const refreshToken = await TokenManager.getRefreshToken()
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await ApiClient.post<API.RefreshTokenResponse>('/auth/refresh', {
        refresh_token: refreshToken
      })

      const tokens = {
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        token_type: response.token_type,
        expires_in: response.expires_in
      }

      const newTokens = AuthMapper.tokenResponseToApp ?
        AuthMapper.tokenResponseToApp(tokens) :
        {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenType: tokens.token_type,
          expiresIn: tokens.expires_in,
          expiresAt: new Date(Date.now() + tokens.expires_in * 1000)
        }

      // Almacenar nuevos tokens
      await TokenManager.setTokens(newTokens)

      return newTokens
    } catch (error) {
      // Si el refresh falla, limpiar todos los tokens
      await TokenManager.clearTokens()
      throw this.handleAuthError(error, 'REFRESH_FAILED')
    }
  }

  // 4. POST /auth/logout - Logout del dispositivo actual
  static async logout(allDevices = false): Promise<void> {
    try {
      await ApiClient.post('/auth/logout', {
        all_devices: allDevices
      })
    } catch (error) {
      // Log el error pero no fallar - limpiaremos el estado local de todos modos
      console.warn('Logout API call failed:', error)
    } finally {
      // Siempre limpiar estado local
      await TokenManager.clearTokens()
    }
  }

  // 5. POST /auth/logout-all - Logout de todos los dispositivos
  static async logoutAllDevices(): Promise<void> {
    try {
      await ApiClient.post('/auth/logout-all')
    } catch (error) {
      console.warn('Logout all devices API call failed:', error)
    } finally {
      // Siempre limpiar estado local
      await TokenManager.clearTokens()
    }
  }

  // 6. GET /auth/me - Obtener perfil del usuario actual
  static async getCurrentUser(): Promise<App.User> {
    try {
      const response = await ApiClient.get<API.AuthMeResponse>('/auth/me')
      console.log('🔍 Backend /auth/me response:', JSON.stringify(response, null, 2))
      console.log('🔍 Backend user data:', JSON.stringify(response.user, null, 2))
      return UserMapper.toApp(response.user)
    } catch (error) {
      throw this.handleAuthError(error, 'GET_USER_FAILED')
    }
  }

  // 7. GET /auth/profile - Perfil detallado del usuario
  static async getUserProfile(): Promise<App.User> {
    try {
      const response = await ApiClient.get<API.User>('/auth/profile')
      return UserMapper.toApp(response)
    } catch (error) {
      throw this.handleAuthError(error, 'GET_PROFILE_FAILED')
    }
  }

  // 8. POST /auth/change-password - Cambiar contraseña
  static async changePassword(data: App.ChangePasswordData): Promise<void> {
    try {
      // Validar que las contraseñas nuevas coincidan
      if (data.newPassword !== data.confirmNewPassword) {
        throw {
          response: {
            data: {
              code: 'PASSWORDS_DONT_MATCH',
              message: 'New passwords do not match',
              field: 'confirmNewPassword'
            }
          }
        }
      }

      const changePasswordRequest = AuthMapper.changePasswordToAPI(data)

      await ApiClient.post('/auth/change-password', changePasswordRequest)
    } catch (error) {
      throw this.handleAuthError(error, 'CHANGE_PASSWORD_FAILED')
    }
  }

  // 9. POST /auth/forgot-password - Solicitar reset de contraseña
  static async forgotPassword(data: App.ForgotPasswordData): Promise<{ message: string }> {
    try {
      const forgotPasswordRequest = AuthMapper.forgotPasswordToAPI(data)

      const response = await ApiClient.post<{ message: string }>('/auth/forgot-password', forgotPasswordRequest)

      return response
    } catch (error) {
      throw this.handleAuthError(error, 'FORGOT_PASSWORD_FAILED')
    }
  }

  // 10. POST /auth/reset-password - Reset con token
  static async resetPassword(data: App.ResetPasswordData): Promise<{ message: string }> {
    try {
      // Validar que las contraseñas coincidan
      if (data.newPassword !== data.confirmNewPassword) {
        throw {
          response: {
            data: {
              code: 'PASSWORDS_DONT_MATCH',
              message: 'New passwords do not match',
              field: 'confirmNewPassword'
            }
          }
        }
      }

      const resetPasswordRequest = AuthMapper.resetPasswordToAPI(data)

      const response = await ApiClient.post<{ message: string }>('/auth/reset-password', resetPasswordRequest)

      return response
    } catch (error) {
      throw this.handleAuthError(error, 'RESET_PASSWORD_FAILED')
    }
  }

  // 11. POST /auth/verify-email - Verificar email
  static async verifyEmail(token: string): Promise<{ message: string }> {
    try {
      const response = await ApiClient.post<{ message: string }>('/auth/verify-email', {
        token
      })

      return response
    } catch (error) {
      throw this.handleAuthError(error, 'EMAIL_VERIFICATION_FAILED')
    }
  }

  // Métodos auxiliares de validación

  // Verificar disponibilidad de username
  static async checkUsernameAvailability(username: string): Promise<{ available: boolean; suggestions?: string[] }> {
    try {
      const response = await ApiClient.get<{ available: boolean; suggestions?: string[] }>(`/auth/check-username/${encodeURIComponent(username)}`)
      return response
    } catch (error) {
      throw this.handleAuthError(error, 'USERNAME_CHECK_FAILED')
    }
  }

  // Verificar disponibilidad de email
  static async checkEmailAvailability(email: string): Promise<{ available: boolean }> {
    try {
      const response = await ApiClient.get<{ available: boolean }>(`/auth/check-email/${encodeURIComponent(email)}`)
      return response
    } catch (error) {
      throw this.handleAuthError(error, 'EMAIL_CHECK_FAILED')
    }
  }

  // Validar fortaleza de contraseña
  static validatePasswordStrength(password: string): {
    isValid: boolean
    score: number
    requirements: {
      minLength: boolean
      hasUppercase: boolean
      hasLowercase: boolean
      hasNumbers: boolean
      hasSpecialChars: boolean
    }
    suggestions: string[]
  } {
    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }

    const suggestions: string[] = []
    let score = 0

    if (!requirements.minLength) {
      suggestions.push('Use at least 8 characters')
    } else {
      score += 1
    }

    if (!requirements.hasUppercase) {
      suggestions.push('Add uppercase letters (A-Z)')
    } else {
      score += 1
    }

    if (!requirements.hasLowercase) {
      suggestions.push('Add lowercase letters (a-z)')
    } else {
      score += 1
    }

    if (!requirements.hasNumbers) {
      suggestions.push('Add numbers (0-9)')
    } else {
      score += 1
    }

    if (!requirements.hasSpecialChars) {
      suggestions.push('Add special characters (!@#$%^&*)')
    } else {
      score += 1
    }

    return {
      isValid: score >= 4, // Al menos 4 de 5 requisitos
      score,
      requirements,
      suggestions
    }
  }

  // Validar formato de email
  static validateEmail(email: string): { isValid: boolean; message?: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!email) {
      return { isValid: false, message: 'Email is required' }
    }

    if (!emailRegex.test(email)) {
      return { isValid: false, message: 'Please enter a valid email address' }
    }

    return { isValid: true }
  }

  // Validar username
  static validateUsername(username: string): { isValid: boolean; message?: string } {
    if (!username) {
      return { isValid: false, message: 'Username is required' }
    }

    if (username.length < 3) {
      return { isValid: false, message: 'Username must be at least 3 characters' }
    }

    if (username.length > 20) {
      return { isValid: false, message: 'Username must be less than 20 characters' }
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return { isValid: false, message: 'Username can only contain letters, numbers, underscore and dash' }
    }

    return { isValid: true }
  }

  // Verificar si hay sesión activa
  static async hasActiveSession(): Promise<boolean> {
    try {
      await this.getCurrentUser()
      return true
    } catch {
      return false
    }
  }

  // Manejo centralizado de errores
  private static handleAuthError(error: unknown, defaultCode: string): AuthError {
    const authError = ErrorMapper.toAuthError(error)

    // Agregar código por defecto si no hay uno específico
    if (authError.code === 'UNKNOWN_ERROR') {
      authError.code = defaultCode
    }

    return authError
  }

  // Reenviar email de verificación
  static async resendVerificationEmail(): Promise<{ message: string }> {
    try {
      const response = await ApiClient.post<{ message: string }>('/auth/resend-verification')
      return response
    } catch (error) {
      throw this.handleAuthError(error, 'RESEND_VERIFICATION_FAILED')
    }
  }

  // Obtener sesiones activas del usuario
  static async getActiveSessions(): Promise<Array<{
    id: string
    deviceInfo: string
    lastActive: Date
    isCurrent: boolean
  }>> {
    try {
      const response = await ApiClient.get<Array<{
        id: string
        device_info: string
        last_active: string
        is_current: boolean
      }>>('/auth/sessions')

      return response.map(session => ({
        id: session.id,
        deviceInfo: session.device_info,
        lastActive: new Date(session.last_active),
        isCurrent: session.is_current
      }))
    } catch (error) {
      throw this.handleAuthError(error, 'GET_SESSIONS_FAILED')
    }
  }

  // Terminar sesión específica
  static async terminateSession(sessionId: string): Promise<void> {
    try {
      await ApiClient.delete(`/auth/sessions/${sessionId}`)
    } catch (error) {
      throw this.handleAuthError(error, 'TERMINATE_SESSION_FAILED')
    }
  }
}