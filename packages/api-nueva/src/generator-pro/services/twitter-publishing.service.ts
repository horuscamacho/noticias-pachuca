import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import axios from 'axios';

// ❌ REMOVIDO: TwitterPublishingConfig - No existe en BD
import { TwitterPost, TwitterPostDocument } from '../schemas/twitter-post.schema';

/**
 * 🐦 Servicio de publicación automática en Twitter - Generator Pro
 * Integra con GetLate.dev API para publicación automatizada en Twitter
 * Incluye optimización de contenido (280 chars max), emojis (max 2) y hashtags (max 3)
 */

interface TwitterOptimization {
  optimizedContent: string;
  emojis: string[];
  hashtags: string[];
  characterCount: number;
  engagementPrediction: number;
  recommendations: string[];
}

interface PublishResult {
  success: boolean;
  tweetId?: string;
  tweetUrl?: string;
  getLateTweetUrl?: string;
  error?: string;
  engagement?: {
    initialImpressions?: number;
    estimatedEngagement?: number;
  };
}

interface ConnectionTest {
  isConnected: boolean;
  accountInfo?: {
    username: string;
    displayName: string;
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
export class TwitterPublishingService {
  private readonly logger = new Logger(TwitterPublishingService.name);
  private readonly getLateBaseUrl = 'https://getlate.dev/api/v1'; // ✅ FIX: URL correcta de GetLate API
  private readonly MAX_TWEET_LENGTH = 280;
  private readonly RECOMMENDED_TWEET_LENGTH = 240; // Óptimo para engagement
  private readonly MAX_EMOJIS = 2;
  private readonly MAX_HASHTAGS = 3;

  constructor(
    // ❌ REMOVIDO: twitterConfigModel - No existe en BD
    @InjectModel(TwitterPost.name)
    private readonly twitterPostModel: Model<TwitterPostDocument>,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.log('🐦 Twitter Publishing Service initialized (✅ Refactored)');
  }

  /**
   * 🐦 PUBLICAR TWEET VIA GETLATE
   *
   * ✅ REFACTORIZADO: Recibe accountId, username y apiKey directamente
   * ❌ ANTERIOR: Buscaba TwitterPublishingConfig (que no existe)
   *
   * @param tweet - TwitterPost document
   * @param accountId - ID de la cuenta de Twitter en GetLate
   * @param username - Username de Twitter (@noticiaspachuca)
   * @param getLateApiKey - API Key de GetLate
   */
  async publishTweet(
    tweet: TwitterPostDocument,
    accountId: string,
    username: string,
    getLateApiKey: string
  ): Promise<PublishResult> {
    this.logger.log(`🐦 Publishing tweet to Twitter account ${username}: ${tweet._id}`);

    try {
      // Validar longitud del tweet
      if (tweet.tweetContent.length > this.MAX_TWEET_LENGTH) {
        throw new Error(`Tweet exceeds ${this.MAX_TWEET_LENGTH} characters`);
      }

      // Preparar datos del tweet para GetLate API
      const postData = {
        content: tweet.tweetContent,
        scheduledFor: tweet.scheduledAt.toISOString(),  // ✅ FIX: scheduledFor (no scheduledDate)
        timezone: "UTC",                                 // ✅ FIX: timezone requerido por GetLate API
        platforms: [{
          platform: 'twitter',
          accountId: accountId, // ✅ NUEVO: Usar accountId directamente
        }],
        ...(tweet.mediaUrls.length > 0 && {
          mediaItems: tweet.mediaUrls.map(url => ({
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
      const twitterResult = result.platforms?.find((p: any) => p.platform === 'twitter');

      if (!twitterResult || twitterResult.status !== 'success') {
        throw new Error(twitterResult?.error || 'Failed to publish to Twitter');
      }

      // Actualizar tweet con información de publicación
      await tweet.markAsPublished(
        twitterResult.platformPostId,
        twitterResult.platformPostUrl
      );

      const publishResult: PublishResult = {
        success: true,
        tweetId: twitterResult.platformPostId,
        tweetUrl: twitterResult.platformPostUrl,
        getLateTweetUrl: result.postUrl,
        engagement: {
          initialImpressions: 0, // Se actualizará después con sync
          estimatedEngagement: 500, // ✅ NUEVO: Estimación fija (sin config)
        }
      };

      this.eventEmitter.emit('generator-pro.twitter.published', {
        tweetId: tweet._id,
        platformTweetId: twitterResult.platformPostId,
        accountId, // ✅ NUEVO: Emitir accountId en lugar de configId
        username, // ✅ NUEVO: Emitir username
        timestamp: new Date(),
      });

      this.logger.log(`✅ Tweet published successfully to ${username}: ${tweet._id}`);

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

      this.logger.error(`❌ Failed to publish tweet ${tweet._id} to ${username}: ${error.message}`);

      await tweet.markAsFailed(error.message, {
        httpStatus: error.response?.status,
        apiResponse: error.response?.data,
      });

      this.eventEmitter.emit('generator-pro.twitter.publish_failed', {
        tweetId: tweet._id,
        accountId,
        username,
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
   * 📅 PROGRAMAR TWEET PARA PUBLICACIÓN FUTURA
   */
  async scheduleTweet(tweet: TwitterPostDocument, publishAt: Date): Promise<void> {
    this.logger.log(`📅 Scheduling tweet ${tweet._id} for ${publishAt}`);

    try {
      // Actualizar fecha de programación
      tweet.scheduledAt = publishAt;
      tweet.status = 'scheduled';
      await tweet.save();

      this.eventEmitter.emit('generator-pro.twitter.scheduled', {
        tweetId: tweet._id,
        scheduledAt: publishAt,
        timestamp: new Date(),
      });

      this.logger.log(`✅ Tweet scheduled successfully: ${tweet._id}`);

    } catch (error) {
      this.logger.error(`❌ Failed to schedule tweet ${tweet._id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🎯 OPTIMIZAR CONTENIDO PARA TWITTER
   */
  async optimizeContentForTwitter(content: any): Promise<string> {
    this.logger.log(`🎯 Optimizing content for Twitter: ${content._id}`);

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
      const optimization = await this.optimizeForTwitter(baseContent);

      // Construir tweet final
      const optimizedTweet = this.buildOptimizedTweet(
        optimization.optimizedContent,
        optimization.emojis,
        optimization.hashtags
      );

      this.logger.log(`✅ Content optimized for Twitter: ${content._id} (${optimization.characterCount} chars)`);

      return optimizedTweet;

    } catch (error) {
      this.logger.error(`❌ Failed to optimize content ${content._id}: ${error.message}`);

      // ✅ FIX: Fallback con campos correctos
      const fallback = content.content || content.generatedContent || content.title || content.generatedTitle || 'Sin contenido disponible';
      return this.truncateToTwitterLength(fallback);
    }
  }

  /**
   * 🎯 OPTIMIZACIÓN COMPLETA PARA TWITTER
   */
  async optimizeForTwitter(content: string): Promise<TwitterOptimization> {
    this.logger.log('🎯 Running full Twitter optimization');

    try {
      // Generar optimizaciones en paralelo
      const [emojis, hashtags] = await Promise.all([
        this.generateEmojis(content),
        this.generateHashtags(content, 'noticias'),
      ]);

      // Optimizar texto para Twitter
      const optimizedContent = this.optimizeTextForTwitter(content, emojis, hashtags);

      // Calcular caracteres
      const characterCount = this.calculateCharacterCount(optimizedContent, emojis, hashtags);

      // Calcular predicción de engagement
      const engagementPrediction = this.calculateEngagementPrediction(
        optimizedContent,
        emojis,
        hashtags,
        characterCount
      );

      // Generar recomendaciones
      const recommendations = this.generateRecommendations(
        optimizedContent,
        emojis,
        hashtags,
        characterCount
      );

      return {
        optimizedContent,
        emojis: emojis.slice(0, this.MAX_EMOJIS), // Máximo 2 emojis
        hashtags: hashtags.slice(0, this.MAX_HASHTAGS), // Máximo 3 hashtags
        characterCount,
        engagementPrediction,
        recommendations,
      };

    } catch (error) {
      this.logger.error(`Failed to optimize for Twitter: ${error.message}`);

      // Fallback básico
      return {
        optimizedContent: this.truncateToTwitterLength(content),
        emojis: ['📰'],
        hashtags: ['#noticias'],
        characterCount: content.length,
        engagementPrediction: 50,
        recommendations: [],
      };
    }
  }

  /**
   * 😀 GENERAR EMOJIS CONTEXTUALMENTE RELEVANTES (MAX 2 PARA TWITTER)
   */
  async generateEmojis(content: string): Promise<string[]> {
    this.logger.log('😀 Generating contextual emojis for Twitter (max 2)');

    try {
      const emojis: string[] = [];

      // Análisis por palabras clave (igual que Facebook pero limitado a 2)
      const keywordEmojis: Record<string, string[]> = {
        política: ['🏛️', '🗳️'],
        deportes: ['⚽', '🏆'],
        economía: ['💰', '📈'],
        salud: ['🏥', '❤️'],
        educación: ['🎓', '📚'],
        tecnología: ['💻', '🚀'],
        cultura: ['🎭', '🎨'],
        medio_ambiente: ['🌱', '🌍'],
        seguridad: ['👮', '🚨'],
        internacional: ['🌎', '✈️'],
        celebración: ['🎉', '🥳'],
        problema: ['😟', '⚠️'],
        éxito: ['🎉', '👏'],
      };

      // Detectar categoría y agregar emojis relevantes
      for (const [categoria, emojisCategoria] of Object.entries(keywordEmojis)) {
        if (this.contentContainsKeywords(content, categoria)) {
          emojis.push(...emojisCategoria.slice(0, 1)); // 1 emoji por categoría
          if (emojis.length >= this.MAX_EMOJIS) break;
        }
      }

      // Si no se encontraron emojis específicos, usar genéricos
      if (emojis.length === 0) {
        emojis.push('📰'); // Emoji por defecto para noticias
      }

      return emojis.slice(0, this.MAX_EMOJIS);

    } catch (error) {
      this.logger.error(`Failed to generate emojis: ${error.message}`);
      return ['📰']; // Emoji por defecto
    }
  }

  /**
   * #️⃣ GENERAR HASHTAGS RELEVANTES PARA TWITTER (MAX 3)
   */
  async generateHashtags(content: string, category: string): Promise<string[]> {
    this.logger.log(`#️⃣ Generating hashtags for Twitter category: ${category} (max 3)`);

    try {
      const hashtags: string[] = [];

      // Hashtags base por categoría
      const categoryHashtags: Record<string, string[]> = {
        noticias: ['#noticias', '#actualidad', '#mexico'],
        política: ['#política', '#gobierno', '#mexico'],
        deportes: ['#deportes', '#fútbol', '#ligamx'],
        economía: ['#economía', '#finanzas', '#mexico'],
        tecnología: ['#tecnología', '#innovación', '#tech'],
        salud: ['#salud', '#medicina', '#bienestar'],
        educación: ['#educación', '#universidad', '#mexico'],
        cultura: ['#cultura', '#arte', '#mexico'],
      };

      // Agregar hashtags de categoría
      const categoryTags = categoryHashtags[category] || categoryHashtags['noticias'];
      hashtags.push(...categoryTags.slice(0, 2)); // Solo 2 de categoría

      // Generar 1 hashtag dinámico basado en contenido
      const dynamicTags = this.generateDynamicHashtags(content);
      if (dynamicTags.length > 0) {
        hashtags.push(dynamicTags[0]); // Solo 1 dinámico
      }

      // Limpiar duplicados y limitar cantidad
      const uniqueHashtags = [...new Set(hashtags)].slice(0, this.MAX_HASHTAGS);

      return uniqueHashtags;

    } catch (error) {
      this.logger.error(`Failed to generate hashtags: ${error.message}`);
      return ['#noticias', '#mexico']; // Hashtags por defecto
    }
  }

  /**
   * 📤 SUBIR MEDIOS A GETLATE (MAX 4 IMÁGENES EN TWITTER)
   */
  async uploadMedia(imageUrls: string[]): Promise<string[]> {
    this.logger.log(`📤 Uploading ${imageUrls.length} media files to GetLate for Twitter`);

    const uploadResults: string[] = [];
    const maxImages = 4; // Twitter permite máximo 4 imágenes

    for (const imageUrl of imageUrls.slice(0, maxImages)) {
      try {
        const result = await this.uploadSingleMedia(imageUrl);
        if (result.success && result.mediaUrl) {
          uploadResults.push(result.mediaUrl);
        }
      } catch (error) {
        this.logger.warn(`Failed to upload media ${imageUrl}: ${error.message}`);
      }
    }

    this.logger.log(`✅ Uploaded ${uploadResults.length}/${Math.min(imageUrls.length, maxImages)} media files`);

    return uploadResults;
  }

  /**
   * 🔗 VALIDAR CONEXIÓN CON CUENTA DE TWITTER
   */
  async validateAccountConnection(accountId: string, apiKey: string): Promise<ConnectionTest> {
    this.logger.log(`🔗 Validating Twitter account connection: ${accountId}`);

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
      const twitterAccount = accounts.find((acc: any) =>
        acc.platform === 'twitter' && acc.accountId === accountId
      );

      if (!twitterAccount) {
        return {
          isConnected: false,
          error: 'Twitter account not found in connected accounts',
          responseTime: Date.now() - startTime,
        };
      }

      return {
        isConnected: true,
        accountInfo: {
          username: twitterAccount.username || 'unknown',
          displayName: twitterAccount.displayName || 'Unknown',
          followers: twitterAccount.followers || 0,
          verified: twitterAccount.verified || false,
        },
        responseTime: Date.now() - startTime,
      };

    } catch (error) {
      this.logger.error(`❌ Account connection validation failed: ${error.message}`);

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

  // ❌ REMOVIDO: updateDailyTweetCounter() - Ya no usamos TwitterPublishingConfig
  // ❌ REMOVIDO: estimateEngagement() - Ya no usamos TwitterPublishingConfig

  private buildOptimizedTweet(content: string, emojis: string[], hashtags: string[]): string {
    const emojiString = emojis.length > 0 ? emojis.join(' ') + ' ' : '';
    const hashtagString = hashtags.length > 0 ? ' ' + hashtags.join(' ') : '';

    const tweet = `${emojiString}${content}${hashtagString}`;

    // Validar longitud final
    if (tweet.length > this.MAX_TWEET_LENGTH) {
      return this.truncateToTwitterLength(tweet);
    }

    return tweet;
  }

  private optimizeTextForTwitter(content: string, emojis: string[], hashtags: string[]): string {
    // Calcular espacio disponible
    const emojiSpace = emojis.length > 0 ? emojis.join(' ').length + 1 : 0;
    const hashtagSpace = hashtags.length > 0 ? hashtags.join(' ').length + 1 : 0;
    const availableSpace = this.RECOMMENDED_TWEET_LENGTH - emojiSpace - hashtagSpace;

    // Truncar contenido si es necesario
    if (content.length > availableSpace) {
      return content.substring(0, availableSpace - 3) + '...';
    }

    return content;
  }

  private truncateToTwitterLength(text: string): string {
    if (text.length <= this.MAX_TWEET_LENGTH) {
      return text;
    }
    return text.substring(0, this.MAX_TWEET_LENGTH - 3) + '...';
  }

  private calculateCharacterCount(content: string, emojis: string[], hashtags: string[]): number {
    const emojiString = emojis.length > 0 ? emojis.join(' ') + ' ' : '';
    const hashtagString = hashtags.length > 0 ? ' ' + hashtags.join(' ') : '';
    return (emojiString + content + hashtagString).length;
  }

  private calculateEngagementPrediction(
    content: string,
    emojis: string[],
    hashtags: string[],
    characterCount: number
  ): number {
    let score = 50; // Base score

    // Factores positivos para Twitter
    if (characterCount >= 100 && characterCount <= 240) score += 15; // Sweet spot
    if (emojis.length >= 1 && emojis.length <= 2) score += 10;
    if (hashtags.length >= 2 && hashtags.length <= 3) score += 10;
    if (content.includes('?') || content.includes('¿')) score += 5; // Questions engage

    // Factores negativos
    if (characterCount > 270) score -= 10; // Muy largo
    if (emojis.length > 2) score -= 10; // Demasiados emojis
    if (hashtags.length > 3) score -= 10; // Demasiados hashtags

    return Math.max(0, Math.min(100, score));
  }

  private generateRecommendations(
    content: string,
    emojis: string[],
    hashtags: string[],
    characterCount: number
  ): string[] {
    const recommendations: string[] = [];

    if (characterCount > 240) {
      recommendations.push('Tweet is long. Consider shortening to 200-240 chars for better engagement');
    }

    if (emojis.length === 0) {
      recommendations.push('Add 1-2 relevant emojis to increase visibility');
    }

    if (hashtags.length < 2) {
      recommendations.push('Add 2-3 relevant hashtags for better discoverability');
    }

    if (!content.includes('?') && !content.includes('¿')) {
      recommendations.push('Consider adding a question to encourage replies');
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
    const relevantWords = words.filter(word => !commonWords.has(word)).slice(0, 1); // Solo 1 dinámico

    return relevantWords.map(word => `#${word}`);
  }
}
