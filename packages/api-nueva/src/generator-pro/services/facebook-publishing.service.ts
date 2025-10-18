import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import axios from 'axios';

// ❌ REMOVIDO: FacebookPublishingConfig - No existe en BD
import { GeneratorProFacebookPost, FacebookPost, FacebookPostDocument } from '../schemas/facebook-post.schema'; // ✅ FIX: Importar nuevo nombre
// import { AIContentGeneration, AIContentGenerationDocument } from '../../content-ai/schemas/ai-content-generation.schema';

/**
 * 🤖 Servicio de publicación automática en Facebook - Generator Pro
 * Integra con GetLate.dev API para publicación automatizada
 * Incluye optimización de contenido, emojis, hashtags y engagement
 */

interface FacebookOptimization {
  optimizedContent: string;
  emojis: string[];
  hashtags: string[];
  engagementPrediction: number;
  recommendations: string[];
}

interface PublishResult {
  success: boolean;
  facebookPostId?: string;
  facebookPostUrl?: string;
  getLatePostUrl?: string;
  error?: string;
  engagement?: {
    initialReach?: number;
    estimatedImpressions?: number;
  };
}

interface ConnectionTest {
  isConnected: boolean;
  pageInfo?: {
    name: string;
    followers: number;
    verified: boolean;
  };
  error?: string;
  responseTime?: number;
}

interface MediaUploadResult {
  success: boolean;
  mediaUrl?: string;
  error?: string;
}

@Injectable()
export class FacebookPublishingService {
  private readonly logger = new Logger(FacebookPublishingService.name);
  private readonly getLateBaseUrl = 'https://getlate.dev/api/v1'; // ✅ FIX: URL correcta de GetLate API

  constructor(
    // ❌ REMOVIDO: facebookConfigModel - No existe en BD
    @InjectModel(GeneratorProFacebookPost.name) // ✅ FIX: Usar nuevo nombre
    private readonly facebookPostModel: Model<FacebookPostDocument>,
    // @InjectModel(AIContentGeneration.name)
    // private readonly contentGenerationModel: Model<AIContentGenerationDocument>,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.log('🤖 Facebook Publishing Service initialized (✅ Refactored)');
  }

  /**
   * 📱 PUBLICAR POST EN FACEBOOK VIA GETLATE
   *
   * ✅ REFACTORIZADO: Recibe pageId, pageName y apiKey directamente
   * ❌ ANTERIOR: Buscaba FacebookPublishingConfig (que no existe)
   *
   * @param post - FacebookPost document
   * @param pageId - ID de la página de Facebook en GetLate
   * @param pageName - Nombre de la página de Facebook
   * @param getLateApiKey - API Key de GetLate
   */
  async publishPost(
    post: FacebookPostDocument,
    pageId: string,
    pageName: string,
    getLateApiKey: string
  ): Promise<PublishResult> {
    this.logger.log(`📱 Publishing post to Facebook page ${pageName}: ${post._id}`);

    try {
      // Preparar datos del post para GetLate API
      const postData = {
        content: post.postContent,
        scheduledFor: post.scheduledAt.toISOString(),  // ✅ FIX: scheduledFor (no scheduledDate)
        timezone: "UTC",                                // ✅ FIX: timezone requerido por GetLate API
        platforms: [{
          platform: 'facebook',
          accountId: pageId, // ✅ NUEVO: Usar pageId directamente
          platformSpecificData: {
            firstComment: this.generateFirstComment(post),
          }
        }],
        ...(post.mediaUrls.length > 0 && {
          mediaItems: post.mediaUrls.map(url => ({
            type: 'image',
            url: url,
          }))
        }),
      };

      // 🔍 DIAGNÓSTICO: Loguear REQUEST completo que enviamos a GetLate
      this.logger.debug(`🔍 GetLate API REQUEST:
        URL: ${this.getLateBaseUrl}/posts
        Method: POST
        Body: ${JSON.stringify(postData, null, 2)}
        API Key: ${getLateApiKey.substring(0, 10)}...
      `);

      // Realizar petición a GetLate API
      const response = await axios.post(
        `${this.getLateBaseUrl}/posts`,
        postData,
        {
          headers: {
            'Authorization': `Bearer ${getLateApiKey}`, // ✅ NUEVO: Usar apiKey directamente
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const result = response.data;

      // Extraer información de respuesta
      const facebookResult = result.platforms?.find((p: any) => p.platform === 'facebook');

      if (!facebookResult || facebookResult.status !== 'success') {
        throw new Error(facebookResult?.error || 'Failed to publish to Facebook');
      }

      // Actualizar post con información de publicación
      await post.markAsPublished(
        facebookResult.platformPostId,
        facebookResult.platformPostUrl
      );

      const publishResult: PublishResult = {
        success: true,
        facebookPostId: facebookResult.platformPostId,
        facebookPostUrl: facebookResult.platformPostUrl,
        getLatePostUrl: result.postUrl,
        engagement: {
          initialReach: 0, // Se actualizará después con sync
          estimatedImpressions: 1000, // ✅ NUEVO: Estimación fija (sin config)
        }
      };

      this.eventEmitter.emit('generator-pro.facebook.published', {
        postId: post._id,
        facebookPostId: facebookResult.platformPostId,
        pageId, // ✅ NUEVO: Emitir pageId en lugar de configId
        pageName, // ✅ NUEVO: Emitir pageName
        timestamp: new Date(),
      });

      this.logger.log(`✅ Post published successfully to ${pageName}: ${post._id}`);

      return publishResult;

    } catch (error) {
      // 🔍 DIAGNÓSTICO: Loguear error COMPLETO de GetLate API
      if (error.response) {
        this.logger.error(`❌ GetLate API Error Details:
          Status: ${error.response.status}
          Data: ${JSON.stringify(error.response.data, null, 2)}
          Headers: ${JSON.stringify(error.response.headers, null, 2)}
        `);
      }

      this.logger.error(`❌ Failed to publish post ${post._id} to ${pageName}: ${error.message}`);

      await post.markAsFailed(error.message, {
        httpStatus: error.response?.status,
        apiResponse: error.response?.data,
      });

      this.eventEmitter.emit('generator-pro.facebook.publish_failed', {
        postId: post._id,
        pageId,
        pageName,
        error: error.message,
        timestamp: new Date(),
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 📅 PROGRAMAR POST PARA PUBLICACIÓN FUTURA
   */
  async schedulePost(post: FacebookPostDocument, publishAt: Date): Promise<void> {
    this.logger.log(`📅 Scheduling post ${post._id} for ${publishAt}`);

    try {
      // Actualizar fecha de programación
      post.scheduledAt = publishAt;
      post.status = 'scheduled';
      await post.save();

      this.eventEmitter.emit('generator-pro.facebook.scheduled', {
        postId: post._id,
        scheduledAt: publishAt,
        timestamp: new Date(),
      });

      this.logger.log(`✅ Post scheduled successfully: ${post._id}`);

    } catch (error) {
      this.logger.error(`❌ Failed to schedule post ${post._id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🎯 OPTIMIZAR CONTENIDO PARA FACEBOOK
   */
  async optimizeContentForFacebook(content: any): Promise<string> {
    this.logger.log(`🎯 Optimizing content for Facebook: ${content._id}`);

    try {
      // ✅ FIX: Obtener contenido base (soporta tanto PublishedNoticia como AIContentGeneration)
      const baseContent =
        content.content ||             // ✅ PublishedNoticia
        content.generatedContent ||    // ✅ AIContentGeneration
        content.title ||               // ✅ PublishedNoticia fallback
        content.generatedTitle ||      // ✅ AIContentGeneration fallback
        '';

      if (!baseContent) {
        this.logger.warn(`⚠️ No content found for optimization: ${content._id}`);
        return 'Sin contenido disponible';
      }

      // Generar optimización completa
      const optimization = await this.optimizeForFacebook(baseContent);

      // Construir contenido final
      const optimizedContent = this.buildOptimizedPost(
        optimization.optimizedContent,
        optimization.emojis,
        optimization.hashtags
      );

      this.logger.log(`✅ Content optimized for Facebook: ${content._id}`);

      return optimizedContent;

    } catch (error) {
      this.logger.error(`❌ Failed to optimize content ${content._id}: ${error.message}`);

      // ✅ FIX: Fallback con campos correctos
      return content.content || content.generatedContent || content.title || content.generatedTitle || 'Sin contenido disponible';
    }
  }

  /**
   * 🎯 OPTIMIZACIÓN COMPLETA PARA FACEBOOK
   */
  async optimizeForFacebook(content: string): Promise<FacebookOptimization> {
    this.logger.log('🎯 Running full Facebook optimization');

    try {
      // Generar optimizaciones en paralelo
      const [emojis, hashtags] = await Promise.all([
        this.generateEmojis(content),
        this.generateHashtags(content, 'noticias'),
      ]);

      // Optimizar texto para engagement
      const optimizedContent = this.optimizeTextForEngagement(content);

      // Calcular predicción de engagement
      const engagementPrediction = this.calculateEngagementPrediction(
        optimizedContent,
        emojis,
        hashtags
      );

      // Generar recomendaciones
      const recommendations = this.generateRecommendations(
        optimizedContent,
        emojis,
        hashtags
      );

      return {
        optimizedContent,
        emojis: emojis.slice(0, 3), // Máximo 3 emojis
        hashtags: hashtags.slice(0, 5), // Máximo 5 hashtags
        engagementPrediction,
        recommendations,
      };

    } catch (error) {
      this.logger.error(`Failed to optimize for Facebook: ${error.message}`);

      // Fallback básico
      return {
        optimizedContent: content,
        emojis: ['📰'],
        hashtags: ['#noticias'],
        engagementPrediction: 50,
        recommendations: [],
      };
    }
  }

  /**
   * 😀 GENERAR EMOJIS CONTEXTUALMENTE RELEVANTES
   */
  async generateEmojis(content: string): Promise<string[]> {
    this.logger.log('😀 Generating contextual emojis');

    try {
      const emojis: string[] = [];

      // Análisis por palabras clave
      const keywordEmojis: Record<string, string[]> = {
        política: ['🏛️', '🗳️', '🤝'],
        deportes: ['⚽', '🏀', '🏆'],
        economía: ['💰', '📈', '💼'],
        salud: ['🏥', '💉', '❤️'],
        educación: ['🎓', '📚', '🏫'],
        tecnología: ['💻', '📱', '🚀'],
        cultura: ['🎭', '🎨', '🎵'],
        medio_ambiente: ['🌱', '🌍', '♻️'],
        seguridad: ['👮', '🚨', '⚠️'],
        internacional: ['🌎', '✈️', '🤝'],
        celebración: ['🎉', '🥳', '🎊'],
        problema: ['😟', '⚠️', '🚨'],
        éxito: ['🎉', '👏', '✨'],
      };

      // Detectar categoría y agregar emojis relevantes
      for (const [categoria, emojisCategoria] of Object.entries(keywordEmojis)) {
        if (this.contentContainsKeywords(content, categoria)) {
          emojis.push(...emojisCategoria.slice(0, 1)); // 1 emoji por categoría
        }
      }

      // Si no se encontraron emojis específicos, usar genéricos
      if (emojis.length === 0) {
        emojis.push('📰', '📍'); // Emojis por defecto para noticias
      }

      return emojis;

    } catch (error) {
      this.logger.error(`Failed to generate emojis: ${error.message}`);
      return ['📰']; // Emoji por defecto
    }
  }

  /**
   * #️⃣ GENERAR HASHTAGS RELEVANTES PARA ENGAGEMENT
   */
  async generateHashtags(content: string, category: string): Promise<string[]> {
    this.logger.log(`#️⃣ Generating hashtags for category: ${category}`);

    try {
      const hashtags: string[] = [];

      // Hashtags base por categoría
      const categoryHashtags: Record<string, string[]> = {
        noticias: ['#noticias', '#actualidad', '#mexico'],
        política: ['#política', '#gobierno', '#elecciones'],
        deportes: ['#deportes', '#fútbol', '#ligamx'],
        economía: ['#economía', '#finanzas', '#bolsa'],
        tecnología: ['#tecnología', '#innovación', '#digital'],
        salud: ['#salud', '#medicina', '#bienestar'],
        educación: ['#educación', '#universidad', '#estudiantes'],
        cultura: ['#cultura', '#arte', '#música'],
      };

      // Agregar hashtags de categoría
      const categoryTags = categoryHashtags[category] || categoryHashtags['noticias'];
      hashtags.push(...categoryTags);

      // Generar hashtags dinámicos basados en contenido
      const dynamicTags = this.generateDynamicHashtags(content);
      hashtags.push(...dynamicTags);

      // Agregar hashtags trending (simulado - en producción usar API real)
      const trendingTags = await this.getTrendingHashtags();
      hashtags.push(...trendingTags.slice(0, 2)); // Máximo 2 trending

      // Limpiar duplicados y limitar cantidad
      const uniqueHashtags = [...new Set(hashtags)].slice(0, 7);

      return uniqueHashtags;

    } catch (error) {
      this.logger.error(`Failed to generate hashtags: ${error.message}`);
      return ['#noticias', '#actualidad']; // Hashtags por defecto
    }
  }

  /**
   * 📤 SUBIR MEDIOS A GETLATE
   */
  async uploadMedia(imageUrls: string[]): Promise<string[]> {
    this.logger.log(`📤 Uploading ${imageUrls.length} media files to GetLate`);

    const uploadResults: string[] = [];

    for (const imageUrl of imageUrls) {
      try {
        const result = await this.uploadSingleMedia(imageUrl);
        if (result.success && result.mediaUrl) {
          uploadResults.push(result.mediaUrl);
        }
      } catch (error) {
        this.logger.warn(`Failed to upload media ${imageUrl}: ${error.message}`);
      }
    }

    this.logger.log(`✅ Uploaded ${uploadResults.length}/${imageUrls.length} media files`);

    return uploadResults;
  }

  /**
   * 🔗 VALIDAR CONEXIÓN CON PÁGINA DE FACEBOOK
   */
  async validatePageConnection(pageId: string, apiKey: string): Promise<ConnectionTest> {
    this.logger.log(`🔗 Validating Facebook page connection: ${pageId}`);

    const startTime = Date.now();

    try {
      const response = await axios.get(
        `${this.getLateBaseUrl}/accounts`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
          timeout: 10000,
        }
      );

      const accounts = response.data.accounts || [];
      const facebookAccount = accounts.find((acc: any) =>
        acc.platform === 'facebook' && acc.accountId === pageId
      );

      if (!facebookAccount) {
        return {
          isConnected: false,
          error: 'Facebook page not found in connected accounts',
          responseTime: Date.now() - startTime,
        };
      }

      return {
        isConnected: true,
        pageInfo: {
          name: facebookAccount.name || 'Unknown',
          followers: facebookAccount.followers || 0,
          verified: facebookAccount.verified || false,
        },
        responseTime: Date.now() - startTime,
      };

    } catch (error) {
      this.logger.error(`❌ Page connection validation failed: ${error.message}`);

      return {
        isConnected: false,
        error: error.message,
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * 🔧 MÉTODOS AUXILIARES PRIVADOS
   */

  private async uploadSingleMedia(imageUrl: string): Promise<MediaUploadResult> {
    try {
      // TODO: Implementar subida real a GetLate
      // Por ahora retornamos la URL original
      return {
        success: true,
        mediaUrl: imageUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ❌ REMOVIDO: updateDailyPostCounter() - Ya no usamos FacebookPublishingConfig
  // ❌ REMOVIDO: estimateImpressions() - Ya no usamos FacebookPublishingConfig

  private generateFirstComment(post: FacebookPostDocument): string | undefined {
    // Generar primer comentario si está configurado
    if (post.originalSourceUrl) {
      return `Fuente: ${post.originalSourceUrl}`;
    }
    return undefined;
  }

  private buildOptimizedPost(content: string, emojis: string[], hashtags: string[]): string {
    const emojiString = emojis.length > 0 ? emojis.join(' ') + ' ' : '';
    const hashtagString = hashtags.length > 0 ? '\n\n' + hashtags.join(' ') : '';

    return `${emojiString}${content}${hashtagString}`;
  }

  private optimizeTextForEngagement(content: string): string {
    // Optimizaciones básicas para engagement
    let optimized = content;

    // Agregar call-to-action si es muy corto
    if (optimized.length < 100) {
      optimized += '\n\n¿Qué opinas?';
    }

    // Limitar longitud para optimal engagement
    if (optimized.length > 400) {
      optimized = optimized.substring(0, 397) + '...';
    }

    return optimized;
  }

  private calculateEngagementPrediction(
    content: string,
    emojis: string[],
    hashtags: string[]
  ): number {
    let score = 50; // Base score

    // Factores positivos
    if (content.length >= 100 && content.length <= 300) score += 10;
    if (emojis.length >= 1 && emojis.length <= 3) score += 5;
    if (hashtags.length >= 3 && hashtags.length <= 5) score += 5;
    if (content.includes('?')) score += 5; // Call to action

    // Factores negativos
    if (content.length > 500) score -= 10;
    if (emojis.length > 5) score -= 5;
    if (hashtags.length > 8) score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  private generateRecommendations(
    content: string,
    emojis: string[],
    hashtags: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (content.length > 400) {
      recommendations.push('Consider shortening content for better engagement');
    }

    if (emojis.length === 0) {
      recommendations.push('Add 1-2 relevant emojis to increase visibility');
    }

    if (!content.includes('?') && !content.includes('¿')) {
      recommendations.push('Add a question to encourage interaction');
    }

    return recommendations;
  }

  private contentContainsKeywords(content: string, category: string): boolean {
    const keywords: Record<string, string[]> = {
      política: ['gobierno', 'presidente', 'elecciones', 'congreso', 'político'],
      deportes: ['fútbol', 'liga', 'partido', 'jugador', 'equipo'],
      economía: ['peso', 'dólar', 'bolsa', 'inversión', 'mercado'],
      salud: ['hospital', 'médico', 'salud', 'enfermedad', 'tratamiento'],
      tecnología: ['app', 'software', 'internet', 'digital', 'tecnología'],
    };

    const categoryKeywords = keywords[category] || [];
    const contentLower = content.toLowerCase();

    return categoryKeywords.some(keyword => contentLower.includes(keyword));
  }

  private generateDynamicHashtags(content: string): string[] {
    // Generar hashtags dinámicos basados en palabras clave del contenido
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 4); // Solo palabras > 4 caracteres

    const commonWords = new Set(['para', 'este', 'esta', 'desde', 'hasta', 'entre', 'sobre', 'durante']);
    const relevantWords = words.filter(word => !commonWords.has(word)).slice(0, 3);

    return relevantWords.map(word => `#${word}`);
  }

  private async getTrendingHashtags(): Promise<string[]> {
    // TODO: Integrar con API real de trending hashtags
    // Por ahora retornamos hashtags populares estáticos
    const trending = ['#viral', '#tendencia', '#mexico', '#noticias'];
    return trending.slice(0, 2);
  }

  private hashContent(content: string): string {
    // Simple hash para cache key
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
}