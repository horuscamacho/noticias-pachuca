// 🔐 Auth Service - Integration with NestJS Hybrid Auth API
import { apiClient } from '../../shared/services/apiClient'
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  User,
  AuthTokens,
} from '../types/auth.types'
import { UserRole } from '../types/auth.types'

class AuthService {
  // 🔑 LOGIN - Authenticate user
  async login(credentials: LoginRequest): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      // Call login endpoint
      const loginResponse = await apiClient.post<LoginResponse>('/auth/login', credentials)

      // Transform response to expected format
      const tokens: AuthTokens = {
        accessToken: loginResponse.accessToken,
        refreshToken: loginResponse.refreshToken,
        expiresIn: loginResponse.expiresIn,
      }

      // Create a temporary user object (the backend should return user data)
      const user: User = {
        id: '1', // TODO: Get from backend response
        email: credentials.email,
        username: credentials.email.split('@')[0],
        firstName: 'Usuario',
        lastName: 'Temporal',
        avatar: undefined,
        phone: undefined,
        dateOfBirth: undefined,
        role: UserRole.FREE_USER, // TODO: Get from backend
        isActive: true,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      return {
        user,
        tokens,
      }
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  // 📝 REGISTER - Create new user account
  async register(userData: RegisterRequest): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      // Call register endpoint
      const registerResponse = await apiClient.post<RegisterResponse>('/auth/register', userData)

      // Get user profile after successful registration
      const userProfile = await this.getCurrentUser()

      // Transform response (assuming register returns similar to login)
      const tokens: AuthTokens = {
        accessToken: registerResponse.tokens.accessToken,
        refreshToken: registerResponse.tokens.refreshToken,
        expiresIn: registerResponse.tokens.expiresIn,
      }

      return {
        user: userProfile,
        tokens,
      }
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  }

  // 🔄 REFRESH TOKEN - Get new access token
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const refreshRequest: RefreshTokenRequest = { refreshToken }

      const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh', refreshRequest)

      return response.tokens
    } catch (error) {
      console.error('Token refresh failed:', error)
      throw error
    }
  }

  // 👤 GET CURRENT USER - Fetch user profile
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<{ user: User }>('/auth/me')
      return response.user
    } catch (error) {
      console.error('Failed to get current user:', error)
      throw error
    }
  }

  // 🚪 LOGOUT - Logout from current device
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout')
    } catch (error) {
      console.error('Logout failed:', error)
      // Don't throw error, still clear local state
    }
  }

  // 🚪🚪 LOGOUT ALL - Logout from all devices
  async logoutAll(): Promise<void> {
    try {
      await apiClient.post('/auth/logout-all')
    } catch (error) {
      console.error('Logout all failed:', error)
      // Don't throw error, still clear local state
    }
  }

  // 🔐 CHANGE PASSWORD - Change user password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      })
    } catch (error) {
      console.error('Change password failed:', error)
      throw error
    }
  }

  // 📧 FORGOT PASSWORD - Request password reset
  async forgotPassword(email: string): Promise<void> {
    try {
      await apiClient.post('/auth/forgot-password', { email })
    } catch (error) {
      console.error('Forgot password failed:', error)
      throw error
    }
  }

  // 🔑 RESET PASSWORD - Reset password with token
  async resetPassword(token: string, password: string): Promise<void> {
    try {
      await apiClient.post('/auth/reset-password', {
        token,
        password,
      })
    } catch (error) {
      console.error('Reset password failed:', error)
      throw error
    }
  }

  // ✅ VERIFY EMAIL - Verify email with token
  async verifyEmail(token: string): Promise<void> {
    try {
      await apiClient.post('/auth/verify-email', { token })
    } catch (error) {
      console.error('Email verification failed:', error)
      throw error
    }
  }

  // 👤 UPDATE PROFILE - Update user profile
  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put<User>('/auth/profile', userData)
      return response
    } catch (error) {
      console.error('Profile update failed:', error)
      throw error
    }
  }

  // 🔍 CHECK SESSION - Verify if current session is valid
  async checkSession(): Promise<boolean> {
    try {
      await this.getCurrentUser()
      return true
    } catch (error) {
      return false
    }
  }
}

// Export singleton instance
export const authService = new AuthService()