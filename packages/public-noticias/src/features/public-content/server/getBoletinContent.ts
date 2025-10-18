import { createServerFn } from '@tanstack/react-start';
import { getSiteHeaders } from '../../../lib/site-headers';

/**
 * 📰 Obtiene contenido de boletines desde el backend
 */
export interface BoletinNoticia {
  id: string;
  title: string;
  summary: string;
  slug: string;
  featuredImage?: string;
  category: {
    _id: string;
    name: string;
    slug: string;
  };
  views?: number;
  publishedAt: string;
}

export interface BoletinContent {
  tipo: 'manana' | 'tarde' | 'semanal' | 'deportes';
  fecha: string;
  noticias: BoletinNoticia[];
  totalNoticias: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * 📰 Server Function: Obtener contenido de boletines
 *
 * Fetch del contenido generado para cada tipo de boletín
 * 🌐 FASE 6: Incluye header x-site-domain para multi-sitio
 */
export const getBoletinContent = createServerFn({ method: 'GET' }).handler(
  async ({ data }: { data: { tipo: 'manana' | 'tarde' | 'semanal' | 'deportes' } }): Promise<BoletinContent> => {
    const { tipo } = data;

    try {
      const url = `${API_BASE_URL}/public-content/boletin/${tipo}`;

      console.log(`[getBoletinContent] Fetching: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: getSiteHeaders(), // 🌐 FASE 6: Header con x-site-domain
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`No hay contenido disponible para el boletín ${tipo}`);
        }
        const error = await response.json();
        throw new Error(error.message || 'Error al obtener contenido del boletín');
      }

      const result = await response.json();

      console.log(`[getBoletinContent] Success: ${result.totalNoticias} noticias`);

      return result;
    } catch (error) {
      console.error('[getBoletinContent] Error:', error);
      throw new Error(error instanceof Error ? error.message : 'Error de conexión con el servidor');
    }
  },
);
