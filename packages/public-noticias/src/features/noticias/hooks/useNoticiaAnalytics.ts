import { useEffect, useRef } from 'react';
import { trackReadTime, trackScrollDepth, trackShare } from '../../../lib/analytics/plausible';

/**
 * 📊 Hook para trackear analytics de una noticia
 *
 * Automáticamente trackea:
 * - Tiempo de lectura (cuando el usuario cierra o cambia de página)
 * - Scroll depth (25%, 50%, 75%, 100%)
 *
 * Uso:
 * ```tsx
 * const { handleShare } = useNoticiaAnalytics(noticia.slug);
 *
 * // En botón de share
 * <button onClick={() => handleShare('facebook')}>Share</button>
 * ```
 */
export function useNoticiaAnalytics(slug: string) {
  const startTimeRef = useRef<number>(Date.now());
  const scrollDepthsTracked = useRef<Set<number>>(new Set());

  // Track tiempo de lectura cuando el usuario sale de la página
  useEffect(() => {
    // Reset start time cuando monta el componente
    startTimeRef.current = Date.now();

    const handleBeforeUnload = () => {
      const timeSpent = (Date.now() - startTimeRef.current) / 1000; // Convertir a segundos
      if (timeSpent > 5) {
        // Solo trackear si pasaron al menos 5 segundos
        trackReadTime(slug, timeSpent);
      }
    };

    // Trackear cuando el usuario cierra la pestaña o navega a otra página
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      // Trackear tiempo al desmontar componente (navegación SPA)
      const timeSpent = (Date.now() - startTimeRef.current) / 1000;
      if (timeSpent > 5) {
        trackReadTime(slug, timeSpent);
      }

      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [slug]);

  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      // Calcular porcentaje de scroll
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;

      const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100;

      // Trackear en intervalos: 25%, 50%, 75%, 100%
      const milestones = [25, 50, 75, 100];

      for (const milestone of milestones) {
        if (scrollPercentage >= milestone && !scrollDepthsTracked.current.has(milestone)) {
          scrollDepthsTracked.current.add(milestone);
          trackScrollDepth(slug, milestone);
        }
      }
    };

    // Throttle scroll events (máximo 1 vez por segundo)
    let throttleTimeout: NodeJS.Timeout | null = null;
    const throttledHandleScroll = () => {
      if (throttleTimeout) return;

      throttleTimeout = setTimeout(() => {
        handleScroll();
        throttleTimeout = null;
      }, 1000);
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [slug]);

  /**
   * Handler para trackear shares en redes sociales
   */
  const handleShare = (platform: 'facebook' | 'twitter' | 'whatsapp') => {
    trackShare(slug, platform);
  };

  return {
    handleShare,
  };
}
