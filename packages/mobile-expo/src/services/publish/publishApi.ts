import { ApiClient } from '../api/ApiClient';
import type {
  PublishContentRequest,
  PublishContentResponse,
  ImproveCopyRequest,
  ImproveCopyResponse,
} from '@/src/types/publish.types';

/**
 * 📱 API para publicación de contenido generado
 * Incluye publicación directa, programada y mejora de copy con IA
 */
export const publishApi = {
  /**
   * 📰 Publica contenido generado inmediatamente o lo programa
   * Si es "breaking" publica inmediatamente
   * Si es "news" o "blog" programa en cola inteligente
   */
  publishContent: async (request: PublishContentRequest): Promise<PublishContentResponse> => {
    const rawClient = ApiClient.getRawClient();

    // Decidir endpoint según tipo de publicación
    if (request.publicationType === 'breaking') {
      // 🔴 Publicación INMEDIATA
      const response = await rawClient.post('/pachuca-noticias/publish', {
        contentId: request.contentId,
        siteIds: request.siteIds,
        publishToSocialMedia: request.publishToSocialMedia,
        socialMediaPlatforms: request.socialMediaPlatforms,
        useOriginalImage: request.useOriginalImage,
        customImageUrl: request.customImageUrl,
      });
      return response.data;
    } else {
      // 🟡 Publicación PROGRAMADA (cola inteligente)
      const response = await rawClient.post('/pachuca-noticias/schedule', {
        contentId: request.contentId,
        publicationType: request.publicationType,
        useOriginalImage: request.useOriginalImage,
        customImageUrl: request.customImageUrl,
      });
      return response.data;
    }
  },

  /**
   * ✨ Mejora copy de redes sociales con agente especializado
   * Agrega URL canónica y optimiza hooks antes de publicar
   */
  improveCopy: async (request: ImproveCopyRequest): Promise<ImproveCopyResponse> => {
    const rawClient = ApiClient.getRawClient();
    const response = await rawClient.post('/content-ai/improve-copy', request);
    return response.data;
  },
};
