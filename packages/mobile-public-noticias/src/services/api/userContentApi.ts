/**
 * 📝 API Service for User Generated Content
 *
 * Connects to /generator-pro/user-content endpoint
 * Maneja contenido manual creado por usuarios (URGENT y NORMAL)
 */

import { ApiClient } from '@/src/services/api/ApiClient';
import {
  CreateUrgentContentDto,
  CreateNormalContentDto,
  UpdateUrgentContentDto,
  CreateUrgentContentResponse,
  CreateNormalContentResponse,
  UpdateUrgentContentResponse,
  CloseUrgentContentResponse,
  ActiveUrgentContentResponse,
  UploadFileResponse,
  UserGeneratedContentDetail,
} from '@/src/types/user-generated-content.types';

const BASE_PATH = '/generator-pro/user-content';

/**
 * 📝 User Content API
 *
 * Endpoints:
 * - POST /urgent - Crear contenido URGENT (breaking news)
 * - POST /normal - Crear contenido NORMAL
 * - PUT /urgent/:id - Actualizar contenido URGENT (reinicia timer)
 * - POST /close/:id - Cerrar contenido URGENT manualmente
 * - GET /urgent/active - Listar contenido URGENT activo
 * - POST /upload - Upload de archivos multimedia
 */
export const userContentApi = {
  /**
   * 🚨 Crear contenido URGENT (Breaking News de última hora)
   * POST /generator-pro/user-content/urgent
   *
   * - Auto-publica inmediatamente
   * - Redacción corta (300-500 palabras)
   * - Copys agresivos para redes sociales
   * - Auto-cierre después de 2 horas sin actualización
   */
  createUrgent: async (dto: CreateUrgentContentDto): Promise<CreateUrgentContentResponse> => {
    try {
      const rawClient = ApiClient.getRawClient();

      console.log('[userContentApi] Creating URGENT content:', {
        title: dto.originalTitle,
        contentLength: dto.originalContent.length,
        images: dto.uploadedImageUrls?.length || 0,
        videos: dto.uploadedVideoUrls?.length || 0,
      });

      const response = await rawClient.post<CreateUrgentContentResponse>(
        `${BASE_PATH}/urgent`,
        dto
      );

      console.log('[userContentApi] URGENT content created:', response.data.content.id);

      return response.data;
    } catch (error) {
      console.error('[userContentApi] Error creating URGENT content:', error);
      throw error;
    }
  },

  /**
   * 📝 Crear contenido NORMAL (Publicación estándar)
   * POST /generator-pro/user-content/normal
   *
   * - Usuario decide tipo de publicación (breaking/noticia/blog)
   * - Redacción normal (500-700 palabras)
   * - Copys normales para redes sociales
   * - NO se auto-cierra
   */
  createNormal: async (dto: CreateNormalContentDto): Promise<CreateNormalContentResponse> => {
    try {
      const rawClient = ApiClient.getRawClient();

      console.log('[userContentApi] Creating NORMAL content:', {
        title: dto.originalTitle,
        type: dto.publicationType,
        contentLength: dto.originalContent.length,
        images: dto.uploadedImageUrls?.length || 0,
        videos: dto.uploadedVideoUrls?.length || 0,
      });

      const response = await rawClient.post<CreateNormalContentResponse>(
        `${BASE_PATH}/normal`,
        dto
      );

      console.log('[userContentApi] NORMAL content created:', response.data.content.id);

      return response.data;
    } catch (error) {
      console.error('[userContentApi] Error creating NORMAL content:', error);
      throw error;
    }
  },

  /**
   * ✏️ Actualizar contenido URGENT
   * PUT /generator-pro/user-content/urgent/:id
   *
   * - Reemplaza el contenido existente
   * - Re-procesa con IA
   * - Re-publica
   * - REINICIA el timer de 2 horas
   */
  updateUrgent: async (
    id: string,
    dto: UpdateUrgentContentDto
  ): Promise<UpdateUrgentContentResponse> => {
    try {
      const rawClient = ApiClient.getRawClient();

      console.log('[userContentApi] Updating URGENT content:', {
        id,
        contentLength: dto.newContent.length,
        newImages: dto.newImageUrls?.length || 0,
      });

      const response = await rawClient.put<UpdateUrgentContentResponse>(
        `${BASE_PATH}/urgent/${id}`,
        dto
      );

      console.log('[userContentApi] URGENT content updated, timer restarted:', id);

      return response.data;
    } catch (error) {
      console.error('[userContentApi] Error updating URGENT content:', error);
      throw error;
    }
  },

  /**
   * 🔒 Cerrar contenido URGENT manualmente
   * POST /generator-pro/user-content/close/:id
   *
   * - Cierre manual por usuario (antes de 2 horas)
   * - Se remueve del cintillo "ÚLTIMO MOMENTO"
   * - NO agrega párrafo de cierre (solo sistema lo hace)
   */
  closeUrgent: async (id: string): Promise<CloseUrgentContentResponse> => {
    try {
      const rawClient = ApiClient.getRawClient();

      console.log('[userContentApi] Closing URGENT content manually:', id);

      const response = await rawClient.post<CloseUrgentContentResponse>(
        `${BASE_PATH}/close/${id}`
      );

      console.log('[userContentApi] URGENT content closed:', id);

      return response.data;
    } catch (error) {
      console.error('[userContentApi] Error closing URGENT content:', error);
      throw error;
    }
  },

  /**
   * 📋 Obtener contenido URGENT activo
   * GET /generator-pro/user-content/urgent/active
   *
   * - Lista todos los contenidos URGENT activos
   * - isUrgent: true, urgentClosed: false, status: 'published'
   * - Ordenado por urgentCreatedAt DESC
   */
  getActiveUrgent: async (): Promise<ActiveUrgentContentResponse> => {
    try {
      const rawClient = ApiClient.getRawClient();

      console.log('[userContentApi] Fetching active URGENT content...');

      const response = await rawClient.get<ActiveUrgentContentResponse>(
        `${BASE_PATH}/urgent/active`
      );

      console.log('[userContentApi] Found active URGENT content:', response.data.total);

      return response.data;
    } catch (error) {
      console.error('[userContentApi] Error fetching active URGENT content:', error);
      throw error;
    }
  },

  /**
   * 📤 Upload de archivos multimedia (imágenes y videos)
   * POST /generator-pro/user-content/upload
   *
   * - Sube archivos a S3
   * - Retorna URLs públicas
   * - Máximo 10 imágenes + 5 videos
   */
  uploadFiles: async (formData: FormData): Promise<UploadFileResponse> => {
    try {
      const rawClient = ApiClient.getRawClient();

      console.log('[userContentApi] Uploading files...');

      const response = await rawClient.post<UploadFileResponse>(
        `${BASE_PATH}/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          // Timeout más largo para uploads
          timeout: 180000, // 3 minutos
        }
      );

      console.log('[userContentApi] Files uploaded successfully:', response.data.urls.length);

      return response.data;
    } catch (error) {
      console.error('[userContentApi] Error uploading files:', error);
      throw error;
    }
  },

  /**
   * 🔍 Obtener detalle de contenido por ID
   * GET /generator-pro/user-content/:id
   *
   * - Incluye contenido generado por IA
   * - Incluye contenido publicado
   * - Incluye métricas y metadata
   */
  getById: async (id: string): Promise<UserGeneratedContentDetail> => {
    try {
      const rawClient = ApiClient.getRawClient();

      console.log('[userContentApi] Fetching content detail:', id);

      const response = await rawClient.get<UserGeneratedContentDetail>(
        `${BASE_PATH}/${id}`
      );

      console.log('[userContentApi] Content detail fetched:', id);

      return response.data;
    } catch (error) {
      console.error('[userContentApi] Error fetching content detail:', error);
      throw error;
    }
  },
};
