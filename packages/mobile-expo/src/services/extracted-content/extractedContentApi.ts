import { ApiClient } from '@/src/services/api/ApiClient';
import { ExtractedContentMapper } from '@/src/utils/mappers';
import type {
  ExtractedContent,
  ExtractedContentFilters,
  ExtractedContentListResponse,
  ExtractedContentApiResponse
} from '@/src/types/extracted-content.types';

/**
 * Servicio de API para manejo de Contenido Extraído
 * Usa ApiClient.getRawClient() para peticiones directas
 */
export const extractedContentApi = {
  /**
   * Obtener lista de contenido extraído con filtros y paginación
   * GET /generator-pro/content
   */
  getExtractedContent: async (
    filters?: ExtractedContentFilters
  ): Promise<ExtractedContentListResponse> => {
    try {
      const rawClient = ApiClient.getRawClient();

      // Construir query params
      const params = new URLSearchParams();
      if (filters?.websiteId) params.append('websiteId', filters.websiteId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.page) params.append('page', filters.page.toString());

      const queryString = params.toString();
      const url = queryString
        ? `/generator-pro/content?${queryString}`
        : '/generator-pro/content';

      const response = await rawClient.get<{
        content: ExtractedContentApiResponse[];
        total: number;
        page: number;
        totalPages: number;
      }>(url);

      // Mapear contenidos
      const mappedContent = response.data.content.map((apiContent) =>
        ExtractedContentMapper.toApp(apiContent)
      );

      return {
        content: mappedContent,
        total: response.data.total,
        page: response.data.page,
        totalPages: response.data.totalPages
      };
    } catch (error) {
      console.error('Error fetching extracted content:', error);
      throw error;
    }
  },

  /**
   * Obtener un contenido extraído por ID
   * Filtra localmente del array en lugar de hacer petición al backend
   */
  getExtractedContentById: async (id: string): Promise<ExtractedContent | null> => {
    try {
      // Obtener todos y filtrar localmente
      // Esto evita hacer una petición adicional al backend
      const response = await extractedContentApi.getExtractedContent({
        limit: 100 // Buscar en primeros 100
      });

      const content = response.content.find((c) => c.id === id);
      return content || null;
    } catch (error) {
      console.error(`Error fetching extracted content ${id}:`, error);
      throw error;
    }
  }
};
