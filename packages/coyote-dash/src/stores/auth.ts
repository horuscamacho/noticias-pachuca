// 🔐 Auth Store con Nanostores - Cross-Islands State Management
import { atom, computed } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';
import type { AuthState, User, AuthError } from '@/lib/auth/types';

// Estado inicial
const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  sessionExpiry: null,
  isLoading: false,
};

// 🎯 Estado principal persistente - se mantiene entre reloads
export const $authState = persistentAtom<AuthState>('auth-state', initialAuthState, {
  encode: JSON.stringify,
  decode: (str: string): AuthState => {
    try {
      const parsed = JSON.parse(str) as AuthState;

      // Validar que la sesión no haya expirado
      if (parsed.sessionExpiry) {
        const expiryDate = new Date(parsed.sessionExpiry);
        if (expiryDate <= new Date()) {
          return initialAuthState;
        }
      }

      return parsed;
    } catch {
      return initialAuthState;
    }
  },
});

// 🔒 Computed stores derivados del estado principal
export const $user = computed($authState, (state) => state.user);
export const $isAuthenticated = computed($authState, (state) => state.isAuthenticated);
export const $isLoading = computed($authState, (state) => state.isLoading);
export const $accessToken = computed($authState, (state) => state.accessToken);
export const $refreshToken = computed($authState, (state) => state.refreshToken);

// ⏰ Computed para validación de sesión
export const $isSessionValid = computed($authState, (state) => {
  if (!state.sessionExpiry || !state.isAuthenticated) {
    return false;
  }
  return new Date(state.sessionExpiry) > new Date();
});

// ⚠️ Estado de error separado (no persistente)
export const $authError = atom<AuthError | null>(null);

// 🛠️ Actions para modificar el estado

export function setAuthLoading(loading: boolean): void {
  $authState.set({
    ...$authState.get(),
    isLoading: loading,
  });
}

export function setAuthSuccess(user: User, tokens: {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}): void {
  const sessionExpiry = new Date(Date.now() + tokens.expiresIn * 1000);

  $authState.set({
    user,
    isAuthenticated: true,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    sessionExpiry,
    isLoading: false,
  });

  // Limpiar errores
  $authError.set(null);
}

export function updateTokens(tokens: {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}): void {
  const currentState = $authState.get();
  const sessionExpiry = new Date(Date.now() + tokens.expiresIn * 1000);

  $authState.set({
    ...currentState,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    sessionExpiry,
  });
}

export function setAuthError(error: AuthError): void {
  $authError.set(error);
  setAuthLoading(false);
}

export function clearAuth(): void {
  $authState.set(initialAuthState);
  $authError.set(null);
}

export function updateUser(userData: Partial<User>): void {
  const currentState = $authState.get();

  if (currentState.user) {
    $authState.set({
      ...currentState,
      user: {
        ...currentState.user,
        ...userData,
      },
    });
  }
}

// 🔍 Utility functions para el estado

export function getAuthHeaders(): Record<string, string> {
  const state = $authState.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-platform': 'web',
  };

  if (state.accessToken) {
    headers.Authorization = `Bearer ${state.accessToken}`;
  }

  return headers;
}

export function isTokenExpiringSoon(minutesBeforeExpiry = 1): boolean {
  const state = $authState.get();

  if (!state.sessionExpiry) {
    return false;
  }

  const expiryTime = new Date(state.sessionExpiry).getTime();
  const currentTime = Date.now();
  const timeToExpiry = expiryTime - currentTime;
  const minutesInMs = minutesBeforeExpiry * 60 * 1000;

  return timeToExpiry <= minutesInMs && timeToExpiry > 0;
}

export function getTimeUntilExpiry(): number {
  const state = $authState.get();

  if (!state.sessionExpiry) {
    return 0;
  }

  return Math.max(0, new Date(state.sessionExpiry).getTime() - Date.now());
}

// 🔄 Store reset para logout completo
export function resetAuthStore(): void {
  clearAuth();

  // También limpiar localStorage manualmente por si acaso
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('auth-state');
    } catch {
      // Ignorar errores de localStorage
    }
  }
}