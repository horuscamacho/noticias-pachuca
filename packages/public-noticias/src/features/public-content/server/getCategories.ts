import { createServerFn } from '@tanstack/react-start';
import type { CategoryResponse, Category } from '../types/public-content.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * 📂 Server Function: Obtener categorías
 *
 * Fetch de todas las categorías activas con contadores de noticias
 */
export const getCategories = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CategoryResponse> => {
    try {
      const url = `${API_BASE_URL}/public-content/categories`;

      console.log(`[getCategories] Fetching: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate: 300 }, // Cache por 5 minutos
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const rawData = await response.json();

      // Mapear respuesta del backend al tipo esperado
      const data: Category[] = Array.isArray(rawData) ? rawData.map((cat: any) => ({
        id: cat.id, // Backend ya retorna id (no _id)
        slug: cat.slug,
        name: cat.name,
        description: cat.description || '',
        color: cat.color || '#854836',
        icon: cat.icon || '',
        count: cat.count || 0,
        seoTitle: cat.seoTitle || cat.name,
        seoDescription: cat.seoDescription || cat.description || '',
      })) : [];

      console.log(`[getCategories] Success: ${data.length} categorías`);

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('[getCategories] Error:', error);
      return {
        success: false,
        data: [],
      };
    }
  },
);
