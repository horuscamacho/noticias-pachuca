import { ApiClient } from '@/src/services/api/ApiClient';
import { SiteMapper } from '@/src/utils/mappers';
import type {
  Site,
  CreateSitePayload,
  UpdateSitePayload,
  SitesListResponse,
  SiteStatsResponse,
  SitesFilters,
} from '@/src/types/site.types';

/**
 * 🌐 FASE 8: Servicio de API para gestión de Sites
 * Usa ApiClient.getRawClient() para peticiones directas
 */
export const sitesApi = {
  /**
   * Obtener lista de sites con filtros
   * GET /pachuca-noticias/sites
   */
  getSites: async (filters?: SitesFilters): Promise<SitesListResponse> => {
    try {
      const rawClient = ApiClient.getRawClient();

      // Construir query params
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      const queryString = params.toString();
      const url = queryString
        ? `/pachuca-noticias/sites?${queryString}`
        : '/pachuca-noticias/sites';

      const response = await rawClient.get<{ sites: Record<string, unknown>[]; total: number }>(url);

      // Mapear sites usando SiteMapper
      const mappedSites = response.data.sites.map((apiSite) => SiteMapper.toApp(apiSite));

      return {
        sites: mappedSites,
        total: response.data.total
      };
    } catch (error) {
      console.error('Error fetching sites:', error);
      throw error;
    }
  },

  /**
   * Obtener un site por ID
   * GET /pachuca-noticias/sites/:id
   */
  getSiteById: async (id: string): Promise<Site | null> => {
    try {
      const rawClient = ApiClient.getRawClient();

      const response = await rawClient.get<Record<string, unknown>>(
        `/pachuca-noticias/sites/${id}`
      );

      return SiteMapper.toApp(response.data);
    } catch (error) {
      console.error(`Error fetching site ${id}:`, error);
      // Si es 404, retornar null
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
   * Obtener estadísticas generales
   * GET /pachuca-noticias/sites/stats
   */
  getStats: async (): Promise<SiteStatsResponse> => {
    try {
      const rawClient = ApiClient.getRawClient();

      const response = await rawClient.get<SiteStatsResponse>(
        '/pachuca-noticias/sites/stats'
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching site stats:', error);
      throw error;
    }
  },

  /**
   * Crear un nuevo site
   * POST /pachuca-noticias/sites
   */
  createSite: async (data: CreateSitePayload): Promise<Site> => {
    try {
      const rawClient = ApiClient.getRawClient();

      // Transformar payload para API (camelCase - 5 campos)
      const apiPayload = SiteMapper.createToAPI(data);

      const response = await rawClient.post<Record<string, unknown>>(
        '/pachuca-noticias/sites',
        apiPayload
      );

      return SiteMapper.toApp(response.data);
    } catch (error) {
      console.error('Error creating site:', error);
      throw error;
    }
  },

  /**
   * Actualizar un site existente
   * PATCH /pachuca-noticias/sites/:id
   */
  updateSite: async (id: string, data: UpdateSitePayload): Promise<Site> => {
    try {
      const rawClient = ApiClient.getRawClient();

      // Transformar payload para API (camelCase - campos permitidos)
      const apiPayload = SiteMapper.updateToAPI(data);

      const response = await rawClient.patch<Record<string, unknown>>(
        `/pachuca-noticias/sites/${id}`,
        apiPayload
      );

      return SiteMapper.toApp(response.data);
    } catch (error) {
      console.error(`Error updating site ${id}:`, error);
      throw error;
    }
  },

  /**
   * Eliminar un site (soft delete)
   * DELETE /pachuca-noticias/sites/:id
   */
  deleteSite: async (id: string): Promise<{ message: string }> => {
    try {
      const rawClient = ApiClient.getRawClient();

      const response = await rawClient.delete<{ message: string }>(
        `/pachuca-noticias/sites/${id}`
      );

      return response.data;
    } catch (error) {
      console.error(`Error deleting site ${id}:`, error);
      throw error;
    }
  },
};
