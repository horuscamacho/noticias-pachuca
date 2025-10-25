import { ApiClient } from '../api/ApiClient';
import { AiOutletMapper } from '@/src/utils/mappers';
import type {
  AiAnalyzeListingRequest,
  AiAnalyzeListingResponse,
  AiAnalyzeContentRequest,
  AiAnalyzeContentResponse,
  AiCreateOutletRequest,
  AiCreateOutletResponse,
} from '@/src/types/ai-outlet.types';

/**
 * 🤖 AI Outlet API Service
 * Servicio para endpoints de análisis inteligente con OpenAI
 */

export const aiOutletApi = {
  /**
   * Analiza página de listado con AI
   */
  analyzeListing: async (data: AiAnalyzeListingRequest): Promise<AiAnalyzeListingResponse> => {
    const rawClient = ApiClient.getRawClient();
    const response = await rawClient.post<Record<string, unknown>>(
      '/generator-pro/websites/ai/analyze-listing',
      data,
      { timeout: 45000 }, // 45 segundos - extracción + análisis AI
    );
    return AiOutletMapper.listingToApp(response.data as Record<string, unknown>);
  },

  /**
   * Analiza página de contenido con AI
   */
  analyzeContent: async (data: AiAnalyzeContentRequest): Promise<AiAnalyzeContentResponse> => {
    const rawClient = ApiClient.getRawClient();
    const response = await rawClient.post<Record<string, unknown>>(
      '/generator-pro/websites/ai/analyze-content',
      data,
      { timeout: 45000 }, // 45 segundos
    );
    return AiOutletMapper.contentToApp(response.data as Record<string, unknown>);
  },

  /**
   * Crea outlet completo automáticamente con AI
   */
  createOutletWithAI: async (data: AiCreateOutletRequest): Promise<AiCreateOutletResponse> => {
    console.log('📡 Calling AI Create Outlet API with:', data);
    try {
      const rawClient = ApiClient.getRawClient();
      const response = await rawClient.post<Record<string, unknown>>(
        '/generator-pro/websites/ai/create-outlet',
        data,
        { timeout: 90000 }, // 90 segundos - flujo completo
      );
      console.log('📡 AI Create Outlet API Response (raw):', response.data);
      const mappedResponse = AiOutletMapper.toApp(response.data as Record<string, unknown>);
      console.log('📡 AI Create Outlet API Response (mapped):', mappedResponse);
      return mappedResponse;
    } catch (error) {
      console.error('📡 AI Create Outlet API Error:', error);
      throw error;
    }
  },
};
