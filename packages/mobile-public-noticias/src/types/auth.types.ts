// Namespaces para separar tipos de API vs App
export namespace API {
  export interface User {
    id: string
    username: string
    email: string
    first_name: string
    last_name: string
    roles: string[]
    permissions: string[]
    is_active: boolean
    email_verified: boolean
    last_login_at: string | null
    created_at: string
    updated_at: string
  }

  export interface LoginRequest {
    email?: string
    username?: string
    password: string
    // device_id y platform van en headers, no en body
  }

  export interface RegisterRequest {
    email: string
    username: string
    password: string
    confirm_password: string
    first_name: string
    last_name: string
    terms_accepted: boolean
  }

  export interface LoginResponse {
    accessToken: string
    refreshToken: string
    tokenType: string
    expiresIn: number
    // El backend actual no devuelve user, platform ni timestamp en login
    // Solo devuelve los tokens
  }

  export interface RefreshTokenRequest {
    refresh_token: string
  }

  export interface RefreshTokenResponse {
    access_token: string
    refresh_token: string
    token_type: string
    expires_in: number
  }

  export interface LogoutRequest {
    all_devices?: boolean
  }

  export interface ChangePasswordRequest {
    current_password: string
    new_password: string
  }

  export interface ForgotPasswordRequest {
    email: string
  }

  export interface ResetPasswordRequest {
    token: string
    new_password: string
    confirm_new_password: string
  }

  export interface VerifyEmailRequest {
    token: string
  }

  export interface AuthMeResponse {
    user: User
    platform: string
    timestamp: string
  }
}

export namespace App {
  export interface User {
    id: string
    username: string
    email: string
    firstName: string
    lastName: string
    roles: string[]
    permissions: string[]
    isActive: boolean
    emailVerified: boolean
    lastLoginAt: Date | null
    createdAt: Date
    updatedAt: Date
  }

  export interface LoginCredentials {
    emailOrUsername: string
    password: string
    rememberMe?: boolean
  }

  export interface RegisterData {
    email: string
    username: string
    password: string
    confirmPassword: string
    firstName: string
    lastName: string
    termsAccepted: boolean
  }

  export interface TokenPair {
    accessToken: string
    refreshToken: string
    tokenType: string
    expiresIn: number
    expiresAt: Date
  }

  export interface ChangePasswordData {
    currentPassword: string
    newPassword: string
    confirmNewPassword: string
  }

  export interface ForgotPasswordData {
    email: string
  }

  export interface ResetPasswordData {
    token: string
    newPassword: string
    confirmNewPassword: string
  }

  export interface AuthSession {
    user: User
    tokens: TokenPair
    platform: string
    authenticatedAt: Date
  }
}

export interface DeviceInfo {
  deviceId: string
  platform: 'ios' | 'android' | 'web'
  osVersion: string
  appVersion: string
  buildNumber: string
  model?: string
  brand?: string
  isEmulator: boolean
}

export interface BiometricConfig {
  isSupported: boolean
  isEnrolled: boolean
  biometricType: 'fingerprint' | 'face' | 'iris' | 'none'
  isEnabled: boolean
}

export interface AuthError {
  code: string
  message: string
  field?: string
  details?: Record<string, unknown>
}

export interface AuthConfig {
  enableBiometrics: boolean
  enableDebugLogging: boolean
  autoRefreshTokens: boolean
  persistSession: boolean
  requireEmailVerification: boolean
}