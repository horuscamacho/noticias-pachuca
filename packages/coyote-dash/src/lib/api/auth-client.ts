// 🌐 Auth API Client con Interceptors - Sin any's permitidos
import axios, { type AxiosInstance, type AxiosResponse, type AxiosError } from 'axios';
import {
  $authState,
  updateTokens,
  clearAuth,
  getAuthHeaders,
  isTokenExpiringSoon
} from '@/stores/auth';
import type {
  TokenResponse,
  RefreshTokenRequest,
  ApiError,
  isApiError
} from '@/lib/auth/types';

// 🎯 Cliente base de API
export const authApiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.DEV ? '/api' : (import.meta.env.PUBLIC_API_URL || 'http://localhost:3000/api'),
  timeout: 10000,
  withCredentials: true, // Para HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
    'x-platform': 'web',
  },
});

// 🔄 Request Interceptor - Agregar headers de auth automáticamente
authApiClient.interceptors.request.use(
  (config) => {
    // Agregar headers de autenticación
    const authHeaders = getAuthHeaders();
    Object.assign(config.headers, authHeaders);

    // Log para desarrollo
    if (import.meta.env.DEV) {
      console.log('🔗 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        headers: config.headers,
      });
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// 🔄 Response Interceptor - Manejar tokens y errores
authApiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log para desarrollo
    if (import.meta.env.DEV) {
      console.log('✅ API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }

    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config;

    // Verificar si es un error 401 y no es un retry
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest.headers['x-retry']
    ) {

      try {
        // Intentar refresh del token
        const refreshed = await refreshAccessToken();

        if (refreshed) {
          // Marcar como retry y reintentar
          originalRequest.headers['x-retry'] = 'true';
          const authHeaders = getAuthHeaders();
          Object.assign(originalRequest.headers, authHeaders);

          return authApiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('🔄 Token refresh failed:', refreshError);

        // Si el refresh falla, limpiar auth y redirigir
        clearAuth();

        // Solo redirigir si estamos en el browser
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    // Para otros errores, crear error estructurado
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || 'Unknown error',
      statusCode: error.response?.status || 500,
      error: error.response?.data?.error || 'Internal Server Error',
      timestamp: new Date().toISOString(),
      path: originalRequest?.url || '',
    };

    console.error('❌ API Error:', apiError);
    return Promise.reject(apiError);
  }
);

// 🔄 Función para refresh de tokens
async function refreshAccessToken(): Promise<boolean> {
  const authState = $authState.get();

  if (!authState.refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const refreshRequest: RefreshTokenRequest = {
      refreshToken: authState.refreshToken,
    };

    // Hacer request sin interceptors para evitar loops
    const baseURL = import.meta.env.DEV ? '/api' : (import.meta.env.PUBLIC_API_URL || 'http://localhost:3000/api');
    const response = await axios.post<TokenResponse>(
      `${baseURL}/auth/refresh`,
      refreshRequest,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-platform': 'web',
        },
        withCredentials: true,
      }
    );

    const tokenData = response.data;

    // Actualizar tokens en el store
    updateTokens({
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresIn: tokenData.expiresIn,
    });

    console.log('✅ Token refreshed successfully');
    return true;

  } catch (error) {
    console.error('❌ Failed to refresh token:', error);
    return false;
  }
}

// 🕒 Auto-refresh proactivo
export function setupAutoRefresh(): void {
  // Solo en el browser
  if (typeof window === 'undefined') {
    return;
  }

  const checkTokenExpiry = async (): Promise<void> => {
    const authState = $authState.get();

    if (!authState.isAuthenticated || !authState.refreshToken) {
      return;
    }

    // Si el token expira en menos de 1 minuto, renovarlo
    if (isTokenExpiringSoon(1)) {
      try {
        await refreshAccessToken();
      } catch (error) {
        console.error('❌ Auto-refresh failed:', error);
        clearAuth();
      }
    }
  };

  // Verificar cada 30 segundos
  setInterval(checkTokenExpiry, 30000);

  // También verificar al enfocar la ventana
  window.addEventListener('focus', checkTokenExpiry);
}

// 🚪 Helper para logout
export async function logoutUser(allDevices = false): Promise<void> {
  try {
    await authApiClient.post('/auth/logout', { allDevices });
  } catch (error) {
    console.error('❌ Logout API call failed:', error);
    // Continuar con el logout local aunque falle la API
  } finally {
    clearAuth();

    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
}

// 🎯 Exportar cliente configurado
export default authApiClient;