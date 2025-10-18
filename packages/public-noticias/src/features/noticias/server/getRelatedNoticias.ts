import { createServerFn } from '@tanstack/react-start';
import type { NoticiasResponse } from '../types/noticia.types';
import { getSiteHeaders } from '../../../lib/site-headers';

// 🔧 Configuración de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export interface GetRelatedNoticiasParams {
  category: string;
  slug: string;
  limit?: number;
}

/**
 * 🔗 Server Function: Obtener noticias relacionadas
 *
 * Obtiene noticias de la misma categoría, excluyendo la noticia actual.
 * Se usa para mostrar sugerencias al final de cada artículo.
 * 🌐 FASE 6: Incluye header x-site-domain para multi-sitio
 *
 * @param params - category, slug de la noticia actual, y limit (default: 5)
 * @returns Array con noticias relacionadas
 */
export const getRelatedNoticias = createServerFn({ method: 'GET' }).handler(
  async ({ data: params }: { data: GetRelatedNoticiasParams }): Promise<NoticiasResponse> => {
    try {
      const { category, slug } = params;
      const limit = params.limit || 5;

      const url = `${API_BASE_URL}/pachuca-noticias/related/${encodeURIComponent(category)}/${encodeURIComponent(slug)}?limit=${limit}`;

      console.log(`[getRelatedNoticias] Fetching: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: getSiteHeaders(), // 🌐 FASE 6: Header con x-site-domain
        // 🔥 Cache strategy: Revalidar cada 5 minutos
        next: { revalidate: 300 },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: true,
            data: [],
            pagination: {
              page: 1,
              limit,
              total: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false,
            },
          };
        }

        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`,
        );
      }

      const result: NoticiasResponse = await response.json();

      // Transformar fechas de string a Date
      if (result.data && Array.isArray(result.data)) {
        result.data = result.data.map((noticia) => ({
          ...noticia,
          publishedAt: new Date(noticia.publishedAt),
          lastModifiedAt: new Date(noticia.lastModifiedAt),
          createdAt: new Date(noticia.createdAt),
          updatedAt: new Date(noticia.updatedAt),
          originalPublishedAt: noticia.originalPublishedAt
            ? new Date(noticia.originalPublishedAt)
            : undefined,
        }));
      }

      console.log(
        `[getRelatedNoticias] Success: ${result.data.length} related noticias for category "${category}"`,
      );

      return result;
    } catch (error) {
      console.error('[getRelatedNoticias] Error:', error);

      // Retornar array vacío en caso de error
      return {
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: params.limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }
  });
