/**
 * 🌐 Utilidad para headers de sitio multi-tenant
 *
 * FASE 6: Agrega header x-site-domain a las requests del backend
 * para que el SiteInterceptor detecte el sitio correcto
 */

/**
 * Extrae el dominio del VITE_SITE_URL
 *
 * Ejemplos:
 * - http://localhost:3022 → localhost:3022
 * - https://noticiaspachuca.com → noticiaspachuca.com
 * - https://tuzona.noticiaspachuca.com → tuzona.noticiaspachuca.com
 */
function getSiteDomain(): string {
  const siteUrl = import.meta.env.VITE_SITE_URL;

  if (!siteUrl) {
    console.warn('[getSiteDomain] VITE_SITE_URL no está definido, usando localhost:3022 por defecto');
    return 'localhost:3022';
  }

  try {
    const url = new URL(siteUrl);
    // Retornar domain + port si existe
    const domain = url.port ? `${url.hostname}:${url.port}` : url.hostname;
    return domain;
  } catch (error) {
    console.error('[getSiteDomain] Error parseando VITE_SITE_URL:', error);
    return 'localhost:3022';
  }
}

/**
 * 🌐 Retorna headers con x-site-domain para requests al backend
 *
 * Uso:
 * ```typescript
 * const response = await fetch(url, {
 *   method: 'GET',
 *   headers: getSiteHeaders(),
 * });
 * ```
 */
export function getSiteHeaders(): Record<string, string> {
  const siteDomain = getSiteDomain();

  return {
    'Content-Type': 'application/json',
    'x-site-domain': siteDomain,
  };
}

/**
 * 🌐 Retorna headers personalizados con x-site-domain
 *
 * Permite agregar headers adicionales manteniendo x-site-domain
 *
 * Uso:
 * ```typescript
 * const response = await fetch(url, {
 *   method: 'POST',
 *   headers: getSiteHeadersWithCustom({
 *     'Authorization': 'Bearer token',
 *   }),
 *   body: JSON.stringify(data),
 * });
 * ```
 */
export function getSiteHeadersWithCustom(customHeaders: Record<string, string> = {}): Record<string, string> {
  return {
    ...getSiteHeaders(),
    ...customHeaders,
  };
}
