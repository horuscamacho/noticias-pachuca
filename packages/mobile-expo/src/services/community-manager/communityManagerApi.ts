import { ApiClient } from '@/src/services/api/ApiClient'
import {
  ScheduledPost,
  ScheduledPostsFilters,
  ScheduleContentRequest,
  ScheduleRecycledRequest,
  CancelPostRequest,
  ReschedulePostRequest,
  EligibleContent,
  CommunityManagerStats,
  RecyclingStats,
} from '@/src/types/community-manager.types'

/**
 * 🎯 Community Manager API Service
 *
 * Service para comunicación con backend de Community Manager
 * Sigue el mismo patrón que AuthService usando ApiClient
 */
export class CommunityManagerApi {
  // ========================================
  // SCHEDULED POSTS ENDPOINTS
  // ========================================

  /**
   * POST /community-manager/schedule-content
   * Programa publicación de contenido en redes sociales
   */
  static async scheduleContent(data: ScheduleContentRequest): Promise<ScheduledPost> {
    try {
      const response = await ApiClient.post<ScheduledPost>(
        '/community-manager/schedule-content',
        {
          noticiaId: data.noticiaId,
          platform: data.platform,
          originalCopy: data.originalCopy,
          forceImmediate: data.forceImmediate,
          customScheduledTime: data.customScheduledTime,
        }
      )
      return response
    } catch (error) {
      console.error('❌ Error scheduling content:', error)
      throw error
    }
  }

  /**
   * POST /community-manager/schedule-recycled
   * Programa reciclaje de contenido evergreen
   */
  static async scheduleRecycled(data: ScheduleRecycledRequest): Promise<ScheduledPost[]> {
    try {
      const response = await ApiClient.post<ScheduledPost[]>(
        '/community-manager/schedule-recycled',
        {
          noticiaId: data.noticiaId,
          platforms: data.platforms,
        }
      )
      return response
    } catch (error) {
      console.error('❌ Error scheduling recycled content:', error)
      throw error
    }
  }

  /**
   * GET /community-manager/scheduled-posts
   * Lista posts programados con filtros
   */
  static async getScheduledPosts(filters?: ScheduledPostsFilters): Promise<ScheduledPost[]> {
    try {
      // Construir query params
      const params = new URLSearchParams()
      if (filters?.platform) params.append('platform', filters.platform)
      if (filters?.contentType) params.append('contentType', filters.contentType)
      if (filters?.status) params.append('status', filters.status)
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters?.dateTo) params.append('dateTo', filters.dateTo)
      if (filters?.limit) params.append('limit', filters.limit.toString())

      const queryString = params.toString()
      const url = `/community-manager/scheduled-posts${queryString ? `?${queryString}` : ''}`

      const response = await ApiClient.get<ScheduledPost[]>(url)
      return response
    } catch (error) {
      console.error('❌ Error fetching scheduled posts:', error)
      throw error
    }
  }

  /**
   * GET /community-manager/scheduled-posts/:id
   * Obtiene post programado por ID
   */
  static async getScheduledPostById(id: string): Promise<ScheduledPost> {
    try {
      const response = await ApiClient.get<ScheduledPost>(
        `/community-manager/scheduled-posts/${id}`
      )
      return response
    } catch (error) {
      console.error(`❌ Error fetching scheduled post ${id}:`, error)
      throw error
    }
  }

  /**
   * DELETE /community-manager/scheduled-posts/:id
   * Cancela post programado
   */
  static async cancelScheduledPost(data: CancelPostRequest): Promise<ScheduledPost> {
    try {
      const response = await ApiClient.delete<ScheduledPost>(
        `/community-manager/scheduled-posts/${data.scheduledPostId}`,
        data.reason ? { reason: data.reason } : undefined
      )
      return response
    } catch (error) {
      console.error('❌ Error cancelling scheduled post:', error)
      throw error
    }
  }

  /**
   * PUT /community-manager/scheduled-posts/:id/reschedule
   * Reprograma post cancelado o fallido
   */
  static async reschedulePost(data: ReschedulePostRequest): Promise<ScheduledPost> {
    try {
      const response = await ApiClient.put<ScheduledPost>(
        `/community-manager/scheduled-posts/${data.scheduledPostId}/reschedule`,
        data.newScheduledTime ? { newScheduledTime: data.newScheduledTime } : {}
      )
      return response
    } catch (error) {
      console.error('❌ Error rescheduling post:', error)
      throw error
    }
  }

  /**
   * GET /community-manager/stats
   * Obtiene estadísticas del sistema
   */
  static async getStats(): Promise<CommunityManagerStats> {
    try {
      const response = await ApiClient.get<CommunityManagerStats>(
        '/community-manager/stats'
      )
      return response
    } catch (error) {
      console.error('❌ Error fetching CM stats:', error)
      throw error
    }
  }

  // ========================================
  // CONTENT RECYCLING ENDPOINTS
  // ========================================

  /**
   * GET /content-recycling/eligible
   * Lista contenido elegible para reciclaje
   */
  static async getEligibleContent(limit?: number): Promise<EligibleContent[]> {
    try {
      const url = `/content-recycling/eligible${limit ? `?limit=${limit}` : ''}`
      const response = await ApiClient.get<EligibleContent[]>(url)
      return response
    } catch (error) {
      console.error('❌ Error fetching eligible content:', error)
      throw error
    }
  }

  /**
   * GET /content-recycling/eligibility/:id
   * Verifica elegibilidad de noticia específica
   */
  static async checkEligibility(noticiaId: string): Promise<{
    noticiaId: string
    isEligible: boolean
    recycleType: string
    reasons: string[]
    performanceScore?: number
  }> {
    try {
      const response = await ApiClient.get<{
        noticiaId: string
        isEligible: boolean
        recycleType: string
        reasons: string[]
        performanceScore?: number
      }>(`/content-recycling/eligibility/${noticiaId}`)
      return response
    } catch (error) {
      console.error(`❌ Error checking eligibility for ${noticiaId}:`, error)
      throw error
    }
  }

  /**
   * GET /content-recycling/stats
   * Obtiene estadísticas de reciclaje
   */
  static async getRecyclingStats(): Promise<RecyclingStats> {
    try {
      const response = await ApiClient.get<RecyclingStats>('/content-recycling/stats')
      return response
    } catch (error) {
      console.error('❌ Error fetching recycling stats:', error)
      throw error
    }
  }

  /**
   * POST /content-recycling/create-schedule/:id
   * Crea schedule de reciclaje para noticia
   */
  static async createRecycleSchedule(
    noticiaId: string,
    frequencyDays?: number
  ): Promise<{
    scheduleId: string
    noticiaId: string
    recycleType: string
    recycleFrequencyDays: number
    maxRecyclesAllowed: number
    totalRecycles: number
    createdAt: string
  }> {
    try {
      const url = `/content-recycling/create-schedule/${noticiaId}${
        frequencyDays ? `?frequencyDays=${frequencyDays}` : ''
      }`
      const response = await ApiClient.post<{
        scheduleId: string
        noticiaId: string
        recycleType: string
        recycleFrequencyDays: number
        maxRecyclesAllowed: number
        totalRecycles: number
        createdAt: string
      }>(url, {})
      return response
    } catch (error) {
      console.error(`❌ Error creating recycle schedule for ${noticiaId}:`, error)
      throw error
    }
  }
}
