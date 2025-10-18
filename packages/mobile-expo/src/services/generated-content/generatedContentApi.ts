import { ApiClient } from '@/src/services/api/ApiClient'
import { GeneratedContentMapper, GeneratedContentFiltersMapper } from '@/src/utils/mappers'
import type {
  GeneratedContent,
  GenerateContentRequest,
  GeneratedContentApiResponse,
} from '@/src/types/generated-content.types'
import type { API as FilterAPI, App as FilterApp } from '@/src/types/generated-content-filters.types'

/**
 * 🎯 API Service para contenido generado con IA
 * Patrón: ApiClient → Mapper → TanStack Query Hook
 */
export const generatedContentApi = {
  // ============================================================
  // FILTROS Y LISTADO (NUEVO SISTEMA)
  // ============================================================

  /**
   * Obtener contenido generado con filtros y paginación
   */
  getGeneratedContent: async (
    filters: FilterApp.GeneratedContentFilters
  ): Promise<FilterApp.PaginatedGeneratedContentResponse> => {
    // Transformar filtros App → API (camelCase → snake_case)
    const apiFilters = GeneratedContentFiltersMapper.toAPI(filters)

    // Usar getRawClient() para manejar respuesta manualmente
    const rawClient = ApiClient.getRawClient()
    const response = await rawClient.get<FilterAPI.PaginatedGeneratedContentResponse>(
      '/content-ai/generated',
      { params: apiFilters }
    )

    // Transformar respuesta API → App (snake_case → camelCase)
    return GeneratedContentFiltersMapper.paginatedToApp(response.data)
  },

  /**
   * Obtener agentes disponibles para filtros
   */
  getAgents: async (): Promise<Array<{ id: string; name: string; type: string }>> => {
    const rawClient = ApiClient.getRawClient()
    const response = await rawClient.get<{
      data: Array<{ id: string; name: string; agent_type: string }>
    }>('/content-ai/agents')

    return response.data.data.map((agent) => ({
      id: agent.id,
      name: agent.name,
      type: agent.agent_type,
    }))
  },

  /**
   * Obtener templates disponibles para filtros
   */
  getTemplates: async (): Promise<Array<{ id: string; name: string; type: string }>> => {
    const rawClient = ApiClient.getRawClient()
    const response = await rawClient.get<{
      data: Array<{ id: string; name: string; type: string }>
    }>('/content-ai/templates')

    return response.data.data.map((template) => ({
      id: template.id,
      name: template.name,
      type: template.type,
    }))
  },

  /**
   * Obtener proveedores de IA disponibles para filtros
   */
  getProviders: async (): Promise<Array<{ id: string; name: string; model: string }>> => {
    const rawClient = ApiClient.getRawClient()
    const response = await rawClient.get<{
      data: Array<{ id: string; name: string; model: string }>
    }>('/content-ai/providers')

    return response.data.data.map((provider) => ({
      id: provider.id,
      name: provider.name,
      model: provider.model,
    }))
  },

  /**
   * Obtener categorías únicas para filtros
   */
  getCategories: async (): Promise<string[]> => {
    const rawClient = ApiClient.getRawClient()
    const response = await rawClient.get<{ data: string[] }>(
      '/content-ai/generated/categories/all'
    )

    return response.data.data
  },

  /**
   * Obtener tags únicos para filtros
   */
  getTags: async (): Promise<string[]> => {
    const rawClient = ApiClient.getRawClient()
    const response = await rawClient.get<{ data: string[] }>('/content-ai/generated/tags/all')

    return response.data.data
  },

  /**
   * Actualizar estado de contenido generado
   */
  updateContentStatus: async (
    id: string,
    status: FilterApp.GenerationStatus
  ): Promise<FilterApp.GeneratedContent> => {
    const rawClient = ApiClient.getRawClient()
    const response = await rawClient.patch<FilterAPI.GeneratedContentResponse>(
      `/content-ai/generated/${id}/status`,
      { status }
    )

    return GeneratedContentFiltersMapper.contentToApp(response.data)
  },

  /**
   * Eliminar contenido generado
   */
  deleteContent: async (id: string): Promise<void> => {
    const rawClient = ApiClient.getRawClient()
    await rawClient.delete(`/content-ai/generated/${id}`)
  },

  /**
   * Regenerar contenido
   */
  regenerateContent: async (
    id: string,
    options?: {
      agentId?: string
      templateId?: string
      providerId?: string
    }
  ): Promise<FilterApp.GeneratedContent> => {
    const rawClient = ApiClient.getRawClient()
    const response = await rawClient.post<FilterAPI.GeneratedContentResponse>(
      `/content-ai/generated/${id}/regenerate`,
      options
    )

    return GeneratedContentFiltersMapper.contentToApp(response.data)
  },

  // ============================================================
  // LEGACY ENDPOINTS (COMPATIBILIDAD CON CÓDIGO EXISTENTE)
  // ============================================================

  /**
   * Obtener contenidos generados para un post específico
   * Usa el endpoint /generator-pro/generated con filtro extractedNoticiaId
   */
  getGeneratedContentByPostId: async (extractedNoticiaId: string): Promise<GeneratedContent[]> => {
    try {
      const rawClient = ApiClient.getRawClient()

      // Usar query param para filtrar por extractedNoticiaId
      const response = await rawClient.get<{ generated: Record<string, unknown>[] }>(
        '/generator-pro/generated',
        {
          params: {
            extractedNoticiaId,
            limit: 100, // Límite alto porque queremos todos los generados de un post
          },
        }
      )

      const generated = response.data.generated || []

      // Mapear a tipo App
      return generated.map((item) => GeneratedContentMapper.toApp(item))
    } catch (error) {
      console.error(`Error fetching generated content for post ${extractedNoticiaId}:`, error)
      throw error
    }
  },

  /**
   * Obtener un contenido generado por ID
   */
  getGeneratedContentById: async (id: string): Promise<GeneratedContent | null> => {
    try {
      const rawClient = ApiClient.getRawClient()

      // Endpoint específico para obtener uno
      const response = await rawClient.get<{ generated: Record<string, unknown> }>(
        `/generator-pro/generated/${id}`
      )

      if (!response.data.generated) {
        return null
      }

      return GeneratedContentMapper.toApp(response.data.generated)
    } catch (error) {
      console.error(`Error fetching generated content ${id}:`, error)
      // Si es 404, retornar null en lugar de throw
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number } }
        if (axiosError.response.status === 404) {
          return null
        }
      }
      throw error
    }
  },

  /**
   * Generar contenido con un agente
   * POST /generator-pro/content/generate
   * NOTA: Endpoint asíncrono - responde cuando inicia, no cuando termina
   * Los resultados se obtienen vía socket events
   */
  generateContent: async (
    request: GenerateContentRequest
  ): Promise<GeneratedContentApiResponse> => {
    try {
      const rawClient = ApiClient.getRawClient()

      const response = await rawClient.post<{
        generatedContent: GeneratedContentApiResponse
      }>(
        '/generator-pro/content/generate',
        request,
        {
          timeout: 120000, // 2 minutos - generación puede tardar
        }
      )

      return response.data.generatedContent
    } catch (error) {
      console.error('Error generating content:', error)
      throw error
    }
  },
}
