import { createServerFn } from '@tanstack/react-start';
import type { NoticiaResponse } from '../types/noticia.types';
import { getSiteHeaders } from '../../../lib/site-headers';

// 🔧 Configuración de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * 🔍 Server Function: Obtener noticia por slug
 *
 * Esta función se ejecuta en el servidor y hace fetch a la API de NestJS.
 * Se usa en el loader de la ruta /noticia/$slug
 * 🌐 FASE 6: Incluye header x-site-domain para multi-sitio
 *
 * @param slug - Slug único de la noticia (ej: "titulo-de-noticia-abc12345")
 * @returns NoticiaResponse con la noticia o null si no existe
 */
export const getNoticiaBySlug = createServerFn({ method: 'GET' }).handler(
  async ({ data: slug }: { data: string }): Promise<NoticiaResponse> => {
    try {
      const url = `${API_BASE_URL}/pachuca-noticias/slug/${slug}`;

      console.log(`[getNoticiaBySlug] Fetching: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: getSiteHeaders(), // 🌐 FASE 6: Header con x-site-domain
        // 🔥 Cache strategy: Revalidar cada 5 minutos
        next: { revalidate: 300 },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            data: null,
            message: 'Noticia no encontrada',
          };
        }

        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`,
        );
      }

      const result: NoticiaResponse = await response.json();

      // Transformar fechas de string a Date
      if (result.data) {
        result.data.publishedAt = new Date(result.data.publishedAt);
        result.data.lastModifiedAt = new Date(result.data.lastModifiedAt);
        result.data.createdAt = new Date(result.data.createdAt);
        result.data.updatedAt = new Date(result.data.updatedAt);

        if (result.data.originalPublishedAt) {
          result.data.originalPublishedAt = new Date(result.data.originalPublishedAt);
        }
      }

      console.log(`[getNoticiaBySlug] Success: ${slug}`);

      return result;
    } catch (error) {
      console.error('[getNoticiaBySlug] Error:', error);

      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
);
