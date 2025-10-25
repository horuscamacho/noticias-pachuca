import { createServerFn } from '@tanstack/react-start';
import type { ActiveUrgentContentResponse } from '../types/urgent-content.types';
import { getSiteHeaders } from '../../../lib/site-headers';

// 🔧 Configuración de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * 🚨 Server Function: Obtener contenido URGENT activo
 *
 * Esta función se ejecuta en el servidor y hace fetch a la API de NestJS.
 * Obtiene todos los contenidos URGENT (breaking news) que están activos.
 *
 * Características:
 * - Solo contenido con isUrgent: true
 * - urgentClosed: false
 * - status: 'published'
 * - Cache de 30 segundos (contenido time-sensitive)
 *
 * @returns ActiveUrgentContentResponse con array de contenidos urgent activos
 */
export const getActiveUrgentContent = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ActiveUrgentContentResponse> => {
    try {
      const url = `${API_BASE_URL}/generator-pro/user-content/urgent/active`;

      console.log(`[getActiveUrgentContent] Fetching: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: getSiteHeaders(), // 🌐 Header con x-site-domain
        // 🔥 Cache strategy: Revalidar cada 30 segundos (contenido urgent cambia rápido)
        next: { revalidate: 30 },
      });

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`,
        );
      }

      const result: ActiveUrgentContentResponse = await response.json();

      console.log(
        `[getActiveUrgentContent] Success: ${result.total} contenidos activos`,
      );

      return result;
    } catch (error) {
      console.error('[getActiveUrgentContent] Error:', error);

      // Retornar respuesta vacía en caso de error (no mostrar banner)
      return {
        content: [],
        total: 0,
      };
    }
  },
);
