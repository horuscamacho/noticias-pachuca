import { ApiClient } from '@/src/services/api/ApiClient';
import { OutletMapper } from '@/src/utils/mappers';
import type {
  OutletConfig,
  UpdateFrequenciesDto,
  ExtractAllResponse,
} from '@/src/types/outlet.types';

/**
 * Servicio de API para manejo de Outlets/Websites
 * Usa ApiClient.getRawClient() para peticiones directas
 */
export const outletApi = {
  /**
   * Obtener todos los outlets (opcionalmente filtrados por activos)
   */
  getOutlets: async (active?: boolean): Promise<OutletConfig[]> => {
    try {
      const rawClient = ApiClient.getRawClient();
      const response = await rawClient.get<{ websites: Record<string, unknown>[] }>(
        '/generator-pro/websites'
      );

      const websites = response.data.websites || [];
      const mappedOutlets = websites.map((apiOutlet) => OutletMapper.toApp(apiOutlet));

      // Filtrar por activos si se especifica
      if (active !== undefined) {
        return mappedOutlets.filter((outlet) => outlet.isActive === active);
      }

      return mappedOutlets;
    } catch (error) {
      console.error('Error fetching outlets:', error);
      throw error;
    }
  },

  /**
   * Obtener un outlet por ID (filtra localmente del GET /websites)
   */
  getOutletById: async (id: string): Promise<OutletConfig | null> => {
    try {
      const outlets = await outletApi.getOutlets();
      const outlet = outlets.find((o) => o.id === id);
      return outlet || null;
    } catch (error) {
      console.error(`Error fetching outlet ${id}:`, error);
      throw error;
    }
  },

  /**
   * Actualizar frecuencias de un outlet
   * PATCH /generator-pro/websites/:id/frequencies
   */
  updateFrequencies: async (
    id: string,
    dto: UpdateFrequenciesDto
  ): Promise<OutletConfig> => {
    try {
      const rawClient = ApiClient.getRawClient();
      const payload = OutletMapper.toUpdateDto(dto);

      const response = await rawClient.patch<{ website: Record<string, unknown> }>(
        `/generator-pro/websites/${id}/frequencies`,
        payload
      );

      return OutletMapper.toApp(response.data.website);
    } catch (error) {
      console.error(`Error updating frequencies for outlet ${id}:`, error);
      throw error;
    }
  },

  /**
   * Iniciar extracción completa (URLs + Contenido)
   * POST /generator-pro/websites/:id/extract-all
   */
  startFullExtraction: async (id: string): Promise<ExtractAllResponse> => {
    try {
      const rawClient = ApiClient.getRawClient();

      const response = await rawClient.post<ExtractAllResponse>(
        `/generator-pro/websites/${id}/extract-all`
      );

      return response.data;
    } catch (error) {
      console.error(`Error starting full extraction for outlet ${id}:`, error);
      throw error;
    }
  },

  /**
   * Pausar outlet (set isActive = false)
   * PATCH /generator-pro/websites/:id
   */
  pauseOutlet: async (id: string): Promise<void> => {
    try {
      const rawClient = ApiClient.getRawClient();

      await rawClient.patch(`/generator-pro/websites/${id}`, {
        is_active: false,
      });
    } catch (error) {
      console.error(`Error pausing outlet ${id}:`, error);
      throw error;
    }
  },

  /**
   * Reanudar outlet (set isActive = true)
   * PATCH /generator-pro/websites/:id
   */
  resumeOutlet: async (id: string): Promise<void> => {
    try {
      const rawClient = ApiClient.getRawClient();

      await rawClient.patch(`/generator-pro/websites/${id}`, {
        is_active: true,
      });
    } catch (error) {
      console.error(`Error resuming outlet ${id}:`, error);
      throw error;
    }
  },
};
