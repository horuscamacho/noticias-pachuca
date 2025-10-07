import { createServerFn } from '@tanstack/react-start';
import type { NoticiasResponse, GetNoticiasParams } from '../types/noticia.types';

// 🔧 Configuración de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * 📋 Server Function: Obtener listado de noticias
 *
 * Esta función se ejecuta en el servidor y hace fetch a la API de NestJS.
 * Soporta paginación, filtrado por categoría, y ordenamiento.
 *
 * @param params - Parámetros de búsqueda (page, limit, category, etc.)
 * @returns NoticiasResponse con array de noticias y metadata de paginación
 */
export const getNoticias = createServerFn({ method: 'GET' }).handler(
  async ({ data: params = {} }: { data?: GetNoticiasParams }): Promise<NoticiasResponse> => {
    // Aplicar defaults
    const page = params.page || 1;
    const limit = params.limit || 20;
    try {
      // Construir query string
      const queryParams = new URLSearchParams();

      queryParams.set('page', page.toString());
      queryParams.set('limit', limit.toString());

      if (params.category) {
        queryParams.set('category', params.category);
      }

      if (params.status) {
        queryParams.set('status', params.status);
      } else {
        // Por defecto solo mostrar publicadas en el sitio público
        queryParams.set('status', 'published');
      }

      if (params.sortBy) {
        queryParams.set('sortBy', params.sortBy);
      }

      if (params.sortOrder) {
        queryParams.set('sortOrder', params.sortOrder);
      }

      const url = `${API_BASE_URL}/pachuca-noticias?${queryParams.toString()}`;

      console.log(`[getNoticias] Fetching: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // 🔥 Cache strategy: Revalidar cada 2 minutos
        next: { revalidate: 120 },
      });

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`,
        );
      }

      const result: NoticiasResponse = await response.json();

      // Transformar fechas de string a Date para cada noticia
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
        `[getNoticias] Success: ${result.data.length} noticias, page ${result.pagination.page}`,
      );

      return result;
    } catch (error) {
      console.error('[getNoticias] Error:', error);

      // Retornar respuesta vacía en caso de error
      return {
        success: false,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }
  },
);
