// 🔐 Auth Types - Sin any permitidos según las reglas del proyecto

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: string | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  sessionExpiry: Date | null;
  isLoading: boolean;
}

export interface LoginCredentials {
  email?: string;
  username?: string;
  password: string;
  deviceId?: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface AuthError {
  message: string;
  code: string;
  statusCode: number;
}

export interface PlatformInfo {
  type: 'web' | 'mobile' | 'api' | 'unknown';
  userAgent: string;
  isNative: boolean;
  deviceInfo?: {
    os?: string;
    version?: string;
    model?: string;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  error: string;
  timestamp: string;
  path: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  allDevices?: boolean;
}

export interface UserProfileResponse {
  user: User;
  platform: PlatformInfo;
  timestamp: string;
}

// Guards de tipo para validación
export const isAuthError = (error: unknown): error is AuthError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'code' in error &&
    'statusCode' in error
  );
};

export const isApiError = (error: unknown): error is ApiError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'statusCode' in error &&
    'error' in error
  );
};

export const isTokenResponse = (response: unknown): response is TokenResponse => {
  return (
    typeof response === 'object' &&
    response !== null &&
    'accessToken' in response &&
    'refreshToken' in response &&
    'tokenType' in response &&
    'expiresIn' in response
  );
};

export const isUser = (user: unknown): user is User => {
  return (
    typeof user === 'object' &&
    user !== null &&
    'id' in user &&
    'username' in user &&
    'email' in user &&
    typeof (user as User).id === 'string' &&
    typeof (user as User).username === 'string' &&
    typeof (user as User).email === 'string'
  );
};