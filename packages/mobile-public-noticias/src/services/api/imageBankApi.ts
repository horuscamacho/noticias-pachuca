/**
 * 🖼️ API Service for Image Bank
 *
 * Connects to /image-bank endpoint
 */

import { ApiClient } from '@/src/services/api/ApiClient';

const BASE_PATH = '/image-bank';

/**
 * DTO para procesar y almacenar imagen
 */
export interface ProcessImageDto {
  imageUrl: string;
  outlet: string;
  keywords?: string[];
  categories?: string[];
  extractedNoticiaId?: string;
  altText?: string;
  caption?: string;
  tags?: string[];
}

/**
 * DTO para procesar batch de imágenes
 */
export interface ProcessBatchDto {
  images: ProcessImageDto[];
}

/**
 * Respuesta de procesamiento de imagen
 */
export interface ImageBankResponse {
  _id: string;
  processedUrls: {
    original: string;
    thumbnail: string;
    medium: string;
    large: string;
    s3BaseKey: string;
  };
  keywords: string[];
  outlet: string;
  categories: string[];
  extractedNoticiaId?: string;
  sourceUrl: string;
  quality: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

/**
 * Respuesta de procesamiento batch
 */
export interface BatchProcessResponse {
  jobId: string;
  totalImages: number;
  message: string;
}

/**
 * Respuesta de upload manual de imágenes
 */
export interface UploadImageResponse {
  success: boolean;
  uploadedImages: ImageBankResponse[];
  totalUploaded: number;
  errors: Array<{ filename: string; error: string }>;
}

export const imageBankApi = {
  /**
   * Procesar y almacenar una imagen individual
   * POST /image-bank/process
   */
  processSingleImage: async (dto: ProcessImageDto): Promise<ImageBankResponse> => {
    try {
      const rawClient = ApiClient.getRawClient();

      const response = await rawClient.post<ImageBankResponse>(
        `${BASE_PATH}/process`,
        dto
      );

      console.log('[imageBankApi] Image processed successfully:', response.data._id);

      return response.data;
    } catch (error) {
      console.error('[imageBankApi] Error processing single image:', error);
      throw error;
    }
  },

  /**
   * Procesar y almacenar batch de imágenes
   * POST /image-bank/process-batch
   */
  processBatchImages: async (dto: ProcessBatchDto): Promise<BatchProcessResponse> => {
    try {
      const rawClient = ApiClient.getRawClient();

      const response = await rawClient.post<BatchProcessResponse>(
        `${BASE_PATH}/process-batch`,
        dto
      );

      console.log('[imageBankApi] Batch queued successfully:', response.data.jobId);

      return response.data;
    } catch (error) {
      console.error('[imageBankApi] Error processing batch:', error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas del banco de imágenes
   * GET /image-bank/stats
   */
  getStats: async (): Promise<{
    total: number;
    byQuality: Record<string, number>;
    byOutlet: Array<{ outlet: string; count: number }>;
    totalKeywords: number;
    totalCategories: number;
  }> => {
    try {
      const rawClient = ApiClient.getRawClient();

      const response = await rawClient.get(`${BASE_PATH}/stats`);

      return response.data;
    } catch (error) {
      console.error('[imageBankApi] Error fetching stats:', error);
      throw error;
    }
  },

  /**
   * 📤 Upload manual de imágenes desde galería
   * POST /image-bank/upload
   *
   * Sube 1 o más imágenes con metadata manual
   * Requiere FormData con files + metadata
   */
  uploadImages: async (formData: FormData): Promise<UploadImageResponse> => {
    try {
      const rawClient = ApiClient.getRawClient();

      const response = await rawClient.post<UploadImageResponse>(
        `${BASE_PATH}/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          // Timeout más largo para uploads
          timeout: 120000, // 2 minutos
        }
      );

      console.log('[imageBankApi] Images uploaded successfully:', response.data.totalUploaded);

      return response.data;
    } catch (error) {
      console.error('[imageBankApi] Error uploading images:', error);
      throw error;
    }
  },
};
