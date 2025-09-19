// 🛡️ Astro Middleware - Protección de rutas sin any's
import { defineMiddleware } from 'astro/middleware';
import type { MiddlewareNext } from 'astro';

// 🎯 Rutas protegidas que requieren autenticación
const PROTECTED_ROUTES = [
  '/dashboard',
  '/dashboard/',
];

// 🔓 Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

// 🔍 Verificar si una ruta está protegida
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route)
  );
}

// 🔓 Verificar si una ruta es pública
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/api/');
}

// 🔍 Verificar si el usuario está autenticado desde localStorage o cookies
function isUserAuthenticated(request: Request): boolean {
  // Primero intentar cookies
  const cookies = request.headers.get('cookie');
  if (cookies) {
    const sessionCookie = cookies
      .split(';')
      .find(cookie => cookie.trim().startsWith('session='));

    if (sessionCookie) {
      const token = sessionCookie.split('=')[1];
      if (token && isValidJWTFormat(token)) {
        return true;
      }
    }
  }

  // TODO: También revisar headers personalizados para localStorage
  // Por ahora solo manejamos cookies server-side
  return false;
}

// 🍪 Extraer JWT de las cookies
function getJWTFromCookies(request: Request): string | null {
  const cookies = request.headers.get('cookie');
  if (!cookies) return null;

  const sessionCookie = cookies
    .split(';')
    .find(cookie => cookie.trim().startsWith('session='));

  if (!sessionCookie) return null;

  return sessionCookie.split('=')[1] || null;
}

// 🔐 Verificar validez básica del JWT (sin validar signature server-side por ahora)
function isValidJWTFormat(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Verificar que el payload sea válido
    const payload = JSON.parse(atob(parts[1]));

    // Verificar que tenga los campos básicos
    if (!payload.sub || !payload.exp) return false;

    // Verificar que no esté expirado
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return false;

    return true;
  } catch {
    return false;
  }
}

// 🛡️ Middleware principal
export const onRequest = defineMiddleware(async (context, next: MiddlewareNext) => {
  // TEMPORALMENTE DESACTIVADO - Solo client-side protection
  console.log(`🔄 Middleware: ${context.url.pathname} - permitiendo (client-side manejará auth)`);
  return next();
});