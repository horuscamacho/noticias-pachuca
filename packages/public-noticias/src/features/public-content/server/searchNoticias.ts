import { createServerFn } from '@tanstack/react-start';
import type { SearchParams, SearchResponse } from '../types/public-content.types';
import { getSiteHeaders } from '../../../lib/site-headers';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * 🔍 Server Function: Buscar noticias
 *
 * Full-text search con filtros y ordenamiento
 * 🌐 FASE 6: Incluye header x-site-domain para multi-sitio
 */
export const searchNoticias = createServerFn({ method: 'GET' }).handler(
  async ({ data: params }: { data: SearchParams }): Promise<SearchResponse> => {
    const { query, category, sortBy = 'relevance', page = 1, limit = 20 } = params;

    try {
      const queryParams = new URLSearchParams();
      queryParams.set('page', page.toString());
      queryParams.set('limit', limit.toString());
      queryParams.set('sortBy', sortBy);

      if (category) {
        queryParams.set('category', category);
      }

      const url = `${API_BASE_URL}/public-content/busqueda/${encodeURIComponent(query)}?${queryParams.toString()}`;

      console.log(`[searchNoticias] Fetching: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: getSiteHeaders(), // 🌐 FASE 6: Header con x-site-domain
        next: { revalidate: 60 }, // Cache por 1 minuto
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      console.log(`[searchNoticias] Success: ${result.data.length} resultados`);

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      console.error('[searchNoticias] Error:', error);
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
