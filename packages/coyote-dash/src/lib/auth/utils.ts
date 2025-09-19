// 🛠️ Auth Utilities - Funciones helper sin any's
import authApiClient, { logoutUser, setupAutoRefresh } from '@/lib/api/auth-client';
import {
  setAuthLoading,
  setAuthSuccess,
  setAuthError,
  clearAuth,
  $authState,
  $isAuthenticated,
} from '@/stores/auth';
import type {
  LoginCredentials,
  TokenResponse,
  User,
  UserProfileResponse,
  AuthError,
} from '@/lib/auth/types';
import {
  isTokenResponse,
  isUser,
  isApiError,
} from '@/lib/auth/types';

// 🔐 Función de login principal
export async function loginUser(credentials: LoginCredentials): Promise<User> {
  setAuthLoading(true);

  try {
    const response = await authApiClient.post<TokenResponse>('/auth/login', credentials);

    if (!isTokenResponse(response.data)) {
      throw new Error('Invalid token response format');
    }

    const tokenData = response.data;

    // Crear usuario temporal para debugging
    const tempUser: User = {
      id: '1',
      username: 'temp-user',
      email: credentials.email || 'user@example.com',
      firstName: 'Usuario',
      lastName: 'Temporal',
      roles: ['user'],
      permissions: ['read'],
      isActive: true,
      emailVerified: true,
      lastLoginAt: new Date().toISOString(),
    };

    // Guardar en store
    setAuthSuccess(tempUser, {
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresIn: tokenData.expiresIn,
    });

    // Configurar auto-refresh
    setupAutoRefresh();

    return tempUser;

  } catch (error) {
    const authError: AuthError = createAuthError(error);
    setAuthError(authError);
    throw authError;
  }
}

// 👤 Obtener perfil de usuario
export async function getUserProfile(accessToken?: string): Promise<User> {
  try {
    // Crear headers temporales si se pasa token
    const headers = accessToken ? {
      'Authorization': `Bearer ${accessToken}`,
      'x-platform': 'web',
    } : undefined;

    const response = await authApiClient.get<UserProfileResponse>('/auth/me', { headers });

    if (!isUser(response.data.user)) {
      throw new Error('Invalid user data received');
    }

    return response.data.user;

  } catch (error) {
    throw createAuthError(error);
  }
}

// 🚪 Logout con opciones
export async function logout(allDevices = false): Promise<void> {
  setAuthLoading(true);

  try {
    await logoutUser(allDevices);
  } catch (error) {
    console.error('Logout failed:', error);
    // Continuar con logout local
    clearAuth();
  }
}

// 🔍 Verificar si el usuario está autenticado
export function isUserAuthenticated(): boolean {
  return $isAuthenticated.get();
}

// ⏰ Verificar estado de autenticación al cargar la app
export async function initializeAuth(): Promise<void> {
  const authState = $authState.get();

  // Si no hay estado de auth, no hacer nada
  if (!authState.isAuthenticated || !authState.accessToken) {
    return;
  }

  try {
    // Verificar que el token sigue siendo válido
    await getUserProfile();

    // Si llegamos aquí, el token es válido
    setupAutoRefresh();

  } catch (error) {
    console.warn('Auth initialization failed, clearing state:', error);
    clearAuth();
  }
}

// 🔒 Verificar permisos de usuario
export function hasPermission(permission: string): boolean {
  const authState = $authState.get();

  if (!authState.user) {
    return false;
  }

  return authState.user.permissions.includes(permission);
}

// 🏷️ Verificar roles de usuario
export function hasRole(role: string): boolean {
  const authState = $authState.get();

  if (!authState.user) {
    return false;
  }

  return authState.user.roles.includes(role);
}

// 🔄 Forzar refresh de perfil de usuario
export async function refreshUserProfile(): Promise<User> {
  try {
    const user = await getUserProfile();

    // Actualizar solo la información del usuario en el store
    const currentState = $authState.get();
    if (currentState.user) {
      setAuthSuccess(user, {
        accessToken: currentState.accessToken!,
        refreshToken: currentState.refreshToken!,
        expiresIn: Math.floor((new Date(currentState.sessionExpiry!).getTime() - Date.now()) / 1000),
      });
    }

    return user;

  } catch (error) {
    throw createAuthError(error);
  }
}

// 🎯 Helper para crear errores de auth consistentes
function createAuthError(error: unknown): AuthError {
  // Si ya es un ApiError del interceptor
  if (isApiError(error)) {
    return {
      message: error.message,
      code: error.error,
      statusCode: error.statusCode,
    };
  }

  // Si es un Error estándar
  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'UNKNOWN_ERROR',
      statusCode: 500,
    };
  }

  // Fallback para casos inesperados
  return {
    message: 'An unexpected error occurred',
    code: 'UNEXPECTED_ERROR',
    statusCode: 500,
  };
}

// 🔐 Generar headers de autorización
export function getAuthorizationHeaders(): Record<string, string> {
  const authState = $authState.get();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-platform': 'web',
  };

  if (authState.accessToken) {
    headers.Authorization = `Bearer ${authState.accessToken}`;
  }

  return headers;
}

// ⚡ Utility para verificar si estamos en el browser
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

// 🔄 Reinicializar auth después de cambios
export function reinitializeAuth(): void {
  if (isBrowser()) {
    setupAutoRefresh();
  }
}

// 🎯 Exportar funciones principales para uso fácil
export const auth = {
  login: loginUser,
  logout,
  getUserProfile,
  refreshUserProfile,
  isAuthenticated: isUserAuthenticated,
  hasPermission,
  hasRole,
  initialize: initializeAuth,
  reinitialize: reinitializeAuth,
} as const;