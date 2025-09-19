// 🔄 AuthRedirect - Maneja redirecciones automáticas según auth state
import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $authState } from '@/stores/auth';

interface AuthRedirectProps {
  redirectTo?: string;
  redirectFrom?: 'login' | 'dashboard';
  children?: React.ReactNode;
}

export function AuthRedirect({
  redirectTo = '/dashboard',
  redirectFrom = 'login',
  children
}: AuthRedirectProps) {
  const authState = useStore($authState);

  useEffect(() => {
    if (redirectFrom === 'login') {
      // Si estamos en login y ya estamos autenticados, redirigir a dashboard
      if (authState.isAuthenticated && authState.accessToken) {
        console.log('✅ Usuario ya autenticado, redirigiendo a dashboard...');
        window.location.href = redirectTo;
      }
    } else if (redirectFrom === 'dashboard') {
      // Si estamos en dashboard y NO estamos autenticados, redirigir a login
      if (!authState.isAuthenticated || !authState.accessToken) {
        console.log('❌ Usuario no autenticado, redirigiendo a login...');
        window.location.href = '/login';
      }
    }
  }, [authState.isAuthenticated, authState.accessToken, redirectTo, redirectFrom]);

  // Mostrar children solo si la condición de auth es correcta
  if (redirectFrom === 'login') {
    // En login, mostrar solo si NO está autenticado
    return (!authState.isAuthenticated || !authState.accessToken) ? <>{children}</> : null;
  } else {
    // En dashboard, mostrar solo si SÍ está autenticado
    return (authState.isAuthenticated && authState.accessToken) ? <>{children}</> : null;
  }
}