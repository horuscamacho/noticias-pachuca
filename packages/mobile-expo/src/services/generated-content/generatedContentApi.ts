import { ApiClient } from '@/src/services/api/ApiClient';
import { GeneratedContentMapper } from '@/src/utils/mappers';
import type {
  GeneratedContent,
  GenerateContentRequest,
  GeneratedContentApiResponse
} from '@/src/types/generated-content.types';

/**
 * Servicio de API para manejo de Contenido Generado por IA
 * Usa ApiClient.getRawClient() para peticiones directas
 */
export const generatedContentApi = {
  /**
   * Obtener contenidos generados para un post específico
   * Nota: El backend no tiene endpoint dedicado, obtenemos todos y filtramos
   */
  getGeneratedContentByPostId: async (
    extractedNoticiaId: string
  ): Promise<GeneratedContent[]> => {
    try {
      const rawClient = ApiClient.getRawClient();

      // El backend devuelve todos los generados, filtramos en el cliente
      // Si en el futuro hay endpoint con filtro, se puede usar:
      // `/generator-pro/content/generated?extractedNoticiaId=${extractedNoticiaId}`

      // Por ahora, obtener lista completa (esto se puede mejorar en el backend)
      const response = await rawClient.get<{ generated: Record<string, unknown>[] }>(
        '/generator-pro/content/generated'
      );

      const allGenerated = response.data.generated || [];

      // Filtrar por extractedNoticiaId
      const filteredGenerated = allGenerated.filter(
        (item) => item.extractedNoticiaId === extractedNoticiaId
      );

      // Mapear a tipo App
      return filteredGenerated.map((item) => GeneratedContentMapper.toApp(item));
    } catch (error) {
      console.error(
        `Error fetching generated content for post ${extractedNoticiaId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Obtener un contenido generado por ID
   */
  getGeneratedContentById: async (id: string): Promise<GeneratedContent | null> => {
    try {
      const rawClient = ApiClient.getRawClient();

      // Endpoint específico para obtener uno
      const response = await rawClient.get<{ generated: Record<string, unknown> }>(
        `/generator-pro/content/generated/${id}`
      );

      if (!response.data.generated) {
        return null;
      }

      return GeneratedContentMapper.toApp(response.data.generated);
    } catch (error) {
      console.error(`Error fetching generated content ${id}:`, error);
      // Si es 404, retornar null en lugar de throw
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number } };
        if (axiosError.response.status === 404) {
          return null;
        }
      }
      throw error;
    }
  },

  /**
   * Generar contenido con un agente
   * POST /generator-pro/content/generate
   */
  generateContent: async (
    request: GenerateContentRequest
  ): Promise<GeneratedContentApiResponse> => {
    try {
      const rawClient = ApiClient.getRawClient();

      const response = await rawClient.post<{ generatedContent: GeneratedContentApiResponse }>(
        '/generator-pro/content/generate',
        request
      );

      return response.data.generatedContent;
    } catch (error) {
      console.error('Error generating content:', error);
      throw error;
    }
  }
};
