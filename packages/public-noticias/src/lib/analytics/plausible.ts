/**
 * 📊 PLAUSIBLE ANALYTICS - PRIVACY-FIRST ANALYTICS
 *
 * Plausible es una alternativa a Google Analytics que:
 * - No usa cookies
 * - Es GDPR compliant
 * - Lightweight (< 1KB)
 * - Open source
 *
 * Docs: https://plausible.io/docs
 */

// Declarar window.plausible para TypeScript
declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: {
        props?: Record<string, string | number | boolean>;
        callback?: () => void;
      }
    ) => void;
  }
}

/**
 * Verifica si Plausible está cargado
 */
export function isPlausibleLoaded(): boolean {
  return typeof window !== 'undefined' && typeof window.plausible === 'function';
}

/**
 * Track un evento personalizado
 *
 * @param eventName - Nombre del evento (ej: "Article Read", "Share")
 * @param props - Propiedades adicionales del evento
 * @param callback - Callback opcional después de enviar
 */
export function trackEvent(
  eventName: string,
  props?: Record<string, string | number | boolean>,
  callback?: () => void
): void {
  if (!isPlausibleLoaded()) {
    console.warn('[Plausible] Script not loaded yet');
    return;
  }

  try {
    window.plausible?.(eventName, {
      props,
      callback,
    });
  } catch (error) {
    console.error('[Plausible] Error tracking event:', error);
  }
}

/**
 * Track una pageview manualmente
 * Nota: TanStack Start con Plausible trackea pageviews automáticamente,
 * solo usar este helper si necesitas forzar un pageview manual
 */
export function trackPageView(url?: string): void {
  if (!isPlausibleLoaded()) {
    console.warn('[Plausible] Script not loaded yet');
    return;
  }

  try {
    window.plausible?.('pageview', {
      props: url ? { url } : undefined,
    });
  } catch (error) {
    console.error('[Plausible] Error tracking pageview:', error);
  }
}

/**
 * Track tiempo de lectura de un artículo
 *
 * @param slug - Slug del artículo
 * @param timeInSeconds - Tiempo de lectura en segundos
 */
export function trackReadTime(slug: string, timeInSeconds: number): void {
  trackEvent('Article Read Time', {
    slug,
    time: Math.round(timeInSeconds),
    bucket: getTimeBucket(timeInSeconds),
  });
}

/**
 * Track scroll depth del artículo
 *
 * @param slug - Slug del artículo
 * @param percentage - Porcentaje de scroll (25, 50, 75, 100)
 */
export function trackScrollDepth(slug: string, percentage: number): void {
  trackEvent('Scroll Depth', {
    slug,
    depth: `${percentage}%`,
  });
}

/**
 * Track share en redes sociales
 *
 * @param slug - Slug del artículo
 * @param platform - Plataforma (facebook, twitter, whatsapp)
 */
export function trackShare(slug: string, platform: 'facebook' | 'twitter' | 'whatsapp'): void {
  trackEvent('Article Share', {
    slug,
    platform,
  });
}

/**
 * Helper: Categorizar tiempo de lectura en buckets
 */
function getTimeBucket(seconds: number): string {
  if (seconds < 30) return '0-30s';
  if (seconds < 60) return '30-60s';
  if (seconds < 120) return '1-2min';
  if (seconds < 300) return '2-5min';
  if (seconds < 600) return '5-10min';
  return '10min+';
}

/**
 * Configuración de Plausible para el sitio
 */
export const PLAUSIBLE_CONFIG = {
  domain: 'noticiaspachuca.com',
  apiHost: 'https://plausible.io', // Cambiar si es self-hosted
  trackLocalhost: false, // Set true para testing en localhost
} as const;
