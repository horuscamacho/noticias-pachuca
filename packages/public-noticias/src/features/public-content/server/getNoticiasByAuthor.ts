import { createServerFn } from '@tanstack/react-start';
import type { CategoryNoticasParams, CategoryNoticasResponse } from '../types/public-content.types';
import { getSiteHeaders } from '../../../lib/site-headers';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * ✍️ Server Function: Obtener noticias por autor
 *
 * Fetch de noticias filtradas por autor con paginación
 * 🌐 FASE 6: Incluye header x-site-domain para multi-sitio
 */
export const getNoticiasByAuthor = createServerFn({ method: 'GET' }).handler(
  async ({ data: params }: { data: CategoryNoticasParams }): Promise<CategoryNoticasResponse> => {
    const { slug, page = 1, limit = 20 } = params;

    try {
      const queryParams = new URLSearchParams();
      queryParams.set('page', page.toString());
      queryParams.set('limit', limit.toString());

      const url = `${API_BASE_URL}/public-content/autor/${slug}?${queryParams.toString()}`;

      console.log(`[getNoticiasByAuthor] Fetching: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: getSiteHeaders(), // 🌐 FASE 6: Header con x-site-domain
        next: { revalidate: 120 }, // Cache por 2 minutos
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      console.log(`[getNoticiasByAuthor] Success: ${result.data.length} noticias`);

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      console.error('[getNoticiasByAuthor] Error:', error);
      return {
        success: false,
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      };
    }
  },
);
