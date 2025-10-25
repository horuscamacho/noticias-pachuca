import { ApiClient } from '../api/ApiClient';
import type {
  ImageBankDocument,
  ImageBankFilters,
  ImageBankPaginatedResponse,
} from '@/src/types/image-bank.types';

/**
 * 🖼️ API para Image Bank
 * Servicios para gestionar el banco de imágenes procesadas
 */
export const imageBankApi = {
  /**
   * 📋 Obtener lista de imágenes con filtros y paginación
   */
  getImageBank: async (filters: ImageBankFilters): Promise<ImageBankPaginatedResponse> => {
    const rawClient = ApiClient.getRawClient();

    // Construir query params
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.keywords) params.append('keywords', filters.keywords);
    if (filters.outlet) params.append('outlet', filters.outlet);
    if (filters.categories) params.append('categories', filters.categories);
    if (filters.quality) params.append('quality', filters.quality);
    if (filters.searchText) params.append('searchText', filters.searchText);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters.author) params.append('author', filters.author);
    if (filters.captureType) params.append('captureType', filters.captureType);

    const response = await rawClient.get(`/image-bank?${params.toString()}`);
    return response.data;
  },

  /**
   * 🔍 Obtener imagen por ID
   */
  getImageById: async (id: string): Promise<ImageBankDocument> => {
    const rawClient = ApiClient.getRawClient();
    const response = await rawClient.get(`/image-bank/${id}`);
    return response.data;
  },

  /**
   * 🔑 Obtener keywords disponibles
   */
  getKeywords: async (search?: string): Promise<Array<{ keyword: string; count: number }>> => {
    const rawClient = ApiClient.getRawClient();
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await rawClient.get(`/image-bank/aggregations/keywords${params}`);
    return response.data;
  },

  /**
   * 🏢 Obtener outlets disponibles
   */
  getOutlets: async (): Promise<Array<{ outlet: string; count: number }>> => {
    const rawClient = ApiClient.getRawClient();
    const response = await rawClient.get('/image-bank/aggregations/outlets');
    return response.data;
  },

  /**
   * 📂 Obtener categorías disponibles
   */
  getCategories: async (): Promise<Array<{ category: string; count: number }>> => {
    const rawClient = ApiClient.getRawClient();
    const response = await rawClient.get('/image-bank/aggregations/categories');
    return response.data;
  },

  /**
   * 📊 Obtener estadísticas del banco
   */
  getStats: async (): Promise<{
    total: number;
    byQuality: Record<string, number>;
    byOutlet: Array<{ outlet: string; count: number }>;
    totalKeywords: number;
    totalCategories: number;
  }> => {
    const rawClient = ApiClient.getRawClient();
    const response = await rawClient.get('/image-bank/stats/summary');
    return response.data;
  },

  /**
   * ✏️ Actualizar metadata de imagen
   */
  updateImage: async (
    id: string,
    data: Partial<Pick<ImageBankDocument, 'altText' | 'caption' | 'keywords' | 'tags' | 'categories' | 'author' | 'license' | 'attribution'>>
  ): Promise<ImageBankDocument> => {
    const rawClient = ApiClient.getRawClient();
    const response = await rawClient.patch(`/image-bank/${id}`, data);
    return response.data;
  },

  /**
   * 🗑️ Eliminar imagen (soft delete)
   */
  deleteImage: async (id: string): Promise<void> => {
    const rawClient = ApiClient.getRawClient();
    await rawClient.delete(`/image-bank/${id}`);
  },
};
