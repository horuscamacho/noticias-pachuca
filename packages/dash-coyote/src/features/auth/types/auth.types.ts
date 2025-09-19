// 🔐 Auth Types - 100% Type Safe, No ANY allowed
export interface User {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  avatar?: string
  phone?: string
  dateOfBirth?: Date
  role: UserRole
  isActive: boolean
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  SUBSCRIBER = 'subscriber',
  FREE_USER = 'free_user',
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number // seconds
}

export interface AuthState {
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
  sessionExpiry: Date | null
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  tokens: AuthTokens
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
  firstName: string
  lastName: string
}

export interface RegisterResponse {
  user: User
  tokens: AuthTokens
  message: string
}

export interface AuthError {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface ApiError {
  status: number
  message: string
  error?: string
}

// Form validation schemas
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  email: string
  username: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
}

export interface ForgotPasswordFormData {
  email: string
}

export interface ResetPasswordFormData {
  token: string
  password: string
  confirmPassword: string
}

// Router context types
export interface AuthContext {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

// Storage types
export interface AuthStorageData {
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  sessionExpiry: Date | null
}