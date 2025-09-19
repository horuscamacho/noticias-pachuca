import { API, App } from '@/src/types/auth.types'

export class UserMapper {
  static toApp(apiUser: any): App.User {
    // El backend devuelve userId en lugar de id, y faltan muchos campos
    return {
      id: apiUser.userId || apiUser.id || '',
      username: apiUser.username || '',
      email: apiUser.email || '',
      firstName: apiUser.first_name || apiUser.firstName || '',
      lastName: apiUser.last_name || apiUser.lastName || '',
      roles: apiUser.roles || [],
      permissions: apiUser.permissions || [],
      isActive: apiUser.is_active ?? apiUser.isActive ?? true,
      emailVerified: apiUser.email_verified ?? apiUser.emailVerified ?? false,
      lastLoginAt: apiUser.last_login_at ? new Date(apiUser.last_login_at) : null,
      createdAt: apiUser.created_at ? new Date(apiUser.created_at) : new Date(),
      updatedAt: apiUser.updated_at ? new Date(apiUser.updated_at) : new Date()
    }
  }

  static toAPI(appUser: App.User): API.User {
    return {
      id: appUser.id,
      username: appUser.username,
      email: appUser.email,
      first_name: appUser.firstName,
      last_name: appUser.lastName,
      roles: appUser.roles,
      permissions: appUser.permissions,
      is_active: appUser.isActive,
      email_verified: appUser.emailVerified,
      last_login_at: appUser.lastLoginAt?.toISOString() || null,
      created_at: appUser.createdAt.toISOString(),
      updated_at: appUser.updatedAt.toISOString()
    }
  }
}

export class AuthMapper {
  static loginRequestToAPI(credentials: App.LoginCredentials, deviceId: string): API.LoginRequest {
    const isEmail = credentials.emailOrUsername.includes('@')

    return {
      ...(isEmail ? { email: credentials.emailOrUsername } : { username: credentials.emailOrUsername }),
      password: credentials.password
      // device_id y platform van en headers, no en body
    }
  }

  static registerDataToAPI(data: App.RegisterData): API.RegisterRequest {
    return {
      email: data.email,
      username: data.username,
      password: data.password,
      confirm_password: data.confirmPassword,
      first_name: data.firstName,
      last_name: data.lastName,
      terms_accepted: data.termsAccepted
    }
  }

  static loginResponseToApp(response: API.LoginResponse): App.AuthSession {
    // El backend solo devuelve tokens, necesitamos obtener el user por separado
    return {
      user: null, // Se obtendrá después con getCurrentUser()
      tokens: TokenMapper.toApp({
        access_token: response.accessToken,
        refresh_token: response.refreshToken,
        token_type: response.tokenType,
        expires_in: response.expiresIn
      }),
      platform: 'mobile',
      authenticatedAt: new Date()
    }
  }

  static changePasswordToAPI(data: App.ChangePasswordData): API.ChangePasswordRequest {
    return {
      current_password: data.currentPassword,
      new_password: data.newPassword
    }
  }

  static forgotPasswordToAPI(data: App.ForgotPasswordData): API.ForgotPasswordRequest {
    return {
      email: data.email
    }
  }

  static resetPasswordToAPI(data: App.ResetPasswordData): API.ResetPasswordRequest {
    return {
      token: data.token,
      new_password: data.newPassword,
      confirm_new_password: data.confirmNewPassword
    }
  }
}

export class TokenMapper {
  static toApp(apiTokens: {
    access_token: string
    refresh_token: string
    token_type: string
    expires_in: number
  }): App.TokenPair {
    return {
      accessToken: apiTokens.access_token,
      refreshToken: apiTokens.refresh_token,
      tokenType: apiTokens.token_type,
      expiresIn: apiTokens.expires_in,
      expiresAt: new Date(Date.now() + apiTokens.expires_in * 1000)
    }
  }

  static refreshResponseToApp(response: API.RefreshTokenResponse): App.TokenPair {
    return TokenMapper.toApp({
      access_token: response.access_token,
      refresh_token: response.refresh_token,
      token_type: response.token_type,
      expires_in: response.expires_in
    })
  }
}

export class ErrorMapper {
  static toAuthError(error: unknown): App.AuthError {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response: { data: { message?: string; code?: string; field?: string } } }
      return {
        code: axiosError.response.data.code || 'UNKNOWN_ERROR',
        message: axiosError.response.data.message || 'An unexpected error occurred',
        field: axiosError.response.data.field
      }
    }

    if (error instanceof Error) {
      return {
        code: 'CLIENT_ERROR',
        message: error.message
      }
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred'
    }
  }
}