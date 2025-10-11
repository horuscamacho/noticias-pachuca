import { ApiClient } from '@/src/services/api/ApiClient';
import { OutletMapper } from '@/src/utils/mappers';
import type {
  OutletConfig,
  UpdateFrequenciesDto,
  ExtractAllResponse,
  CreateOutletDto,
  TestListingDto,
  TestListingResponse,
  TestContentDto,
  TestContentResponse,
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
        `/generator-pro/websites/${id}/extract-all`,
        {},
        {
          timeout: 120000 // 2 minutos - las extracciones pueden tardar
        }
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

  /**
   * Crear nuevo outlet
   * POST /generator-pro/websites
   */
  createOutlet: async (data: CreateOutletDto): Promise<OutletConfig> => {
    try {
      const rawClient = ApiClient.getRawClient();

      // El backend acepta camelCase directamente (CreateWebsiteConfigDto)
      const response = await rawClient.post<{ website: Record<string, unknown> }>(
        '/generator-pro/websites',
        data
      );

      return OutletMapper.toApp(response.data.website);
    } catch (error) {
      console.error('Error creating outlet:', error);
      throw error;
    }
  },

  /**
   * Probar selectores de listado
   * POST /generator-pro/websites/test-listing-selectors
   */
  testListingSelectors: async (data: TestListingDto): Promise<TestListingResponse> => {
    try {
      const rawClient = ApiClient.getRawClient();

      const response = await rawClient.post<TestListingResponse>(
        '/generator-pro/websites/test-listing-selectors',
        {
          listingUrl: data.listingUrl,
          articleLinksSelector: data.articleLinksSelector,
        },
        {
          timeout: 30000, // 30 segundos para scraping
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error testing listing selectors:', error);
      throw error;
    }
  },

  /**
   * Probar selectores de contenido individual
   * POST /generator-pro/websites/test-individual-content
   */
  testContentSelectors: async (data: TestContentDto): Promise<TestContentResponse> => {
    try {
      const rawClient = ApiClient.getRawClient();

      const response = await rawClient.post<TestContentResponse>(
        '/generator-pro/websites/test-individual-content',
        {
          testUrl: data.testUrl,
          contentSelectors: {
            titleSelector: data.contentSelectors.titleSelector,
            contentSelector: data.contentSelectors.contentSelector,
            imageSelector: data.contentSelectors.imageSelector,
            dateSelector: data.contentSelectors.dateSelector,
            authorSelector: data.contentSelectors.authorSelector,
            categorySelector: data.contentSelectors.categorySelector,
          },
        },
        {
          timeout: 30000, // 30 segundos para scraping
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error testing content selectors:', error);
      throw error;
    }
  },
};
