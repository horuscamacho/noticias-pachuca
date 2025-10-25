import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { FacebookPublishingService } from './facebook-publishing.service';
import { TwitterPublishingService } from './twitter-publishing.service';
// ❌ REMOVIDO: FacebookPublishingConfig, TwitterPublishingConfig - No existen en BD
import { GeneratorProFacebookPost, FacebookPost, FacebookPostDocument } from '../schemas/facebook-post.schema'; // ✅ FIX: Importar clase real
import { TwitterPost, TwitterPostDocument } from '../schemas/twitter-post.schema';
import { Site, SiteDocument } from '../../pachuca-noticias/schemas/site.schema';
import { AIContentGeneration, AIContentGenerationDocument } from '../../content-ai/schemas/ai-content-generation.schema'; // ✅ FIX: Para obtener socialMediaCopies

/**
 * 📱 Servicio Orquestador de Publicación en Redes Sociales - Generator Pro
 * Coordina publicaciones en Facebook y Twitter para múltiples sitios
 * Integra con GetLate.dev API para ambas plataformas
 */

interface PublishingOptions {
  platforms?: ('facebook' | 'twitter')[];
  scheduledAt?: Date;
  optimizeContent?: boolean;
}

interface FacebookPublishResult {
  configId: string;
  configName: string;
  facebookPageId: string;
  facebookPageName: string;
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

interface TwitterPublishResult {
  configId: string;
  configName: string;
  twitterAccountId: string;
  twitterUsername: string;
  success: boolean;
  tweetId?: string;
  tweetUrl?: string;
  error?: string;
}

interface SocialMediaPublishingResult {
  noticia: {
    id: string;
    title: string;
    slug: string;
  };
  facebook: {
    total: number;
    successful: number;
    failed: number;
    results: FacebookPublishResult[];
  };
  twitter: {
    total: number;
    successful: number;
    failed: number;
    results: TwitterPublishResult[];
  };
  summary: {
    totalPlatforms: number;
    totalPublished: number;
    totalFailed: number;
    successRate: number;
  };
}

@Injectable()
export class SocialMediaPublishingService {
  private readonly logger = new Logger(SocialMediaPublishingService.name);

  constructor(
    @InjectModel(Site.name)
    private readonly siteModel: Model<SiteDocument>,
    // ❌ REMOVIDO: facebookConfigModel, twitterConfigModel - No existen en BD
    @InjectModel(GeneratorProFacebookPost.name) // ✅ FIX: Usar clase real, no type alias
    private readonly facebookPostModel: Model<FacebookPostDocument>,
    @InjectModel(TwitterPost.name)
    private readonly twitterPostModel: Model<TwitterPostDocument>,
    @InjectModel(AIContentGeneration.name) // ✅ FIX: Para obtener socialMediaCopies
    private readonly aiContentModel: Model<AIContentGenerationDocument>,
    private readonly facebookPublishingService: FacebookPublishingService,
    private readonly twitterPublishingService: TwitterPublishingService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.log('📱 Social Media Publishing Service initialized (✅ Refactored)');
  }

  /**
   * 📱 PUBLICAR NOTICIA EN REDES SOCIALES PARA MÚLTIPLES SITIOS
   */
  async publishToSocialMedia(
    noticia: any,
    siteIds: Types.ObjectId[],
    options: PublishingOptions = {}
  ): Promise<SocialMediaPublishingResult> {
    this.logger.log(`📱 Publishing noticia ${noticia._id} to ${siteIds.length} sites`);

    const {
      platforms = ['facebook', 'twitter'],
      scheduledAt = new Date(),
      optimizeContent = true,
    } = options;

    const allFacebookResults: FacebookPublishResult[] = [];
    const allTwitterResults: TwitterPublishResult[] = [];

    try {
      // Publicar en cada sitio
      for (const siteId of siteIds) {
        const site = await this.siteModel.findById(siteId);
        if (!site || !site.isActive) {
          this.logger.warn(`⚠️ Site ${siteId} not found or inactive, skipping...`);
          continue;
        }

        this.logger.log(`📱 Publishing to site: ${site.name} (${site.domain})`);

        // Publicar en Facebook si está habilitado
        if (platforms.includes('facebook')) {
          const facebookResults = await this.publishToFacebook(noticia, site, scheduledAt, optimizeContent);
          allFacebookResults.push(...facebookResults);
        }

        // Publicar en Twitter si está habilitado
        if (platforms.includes('twitter')) {
          const twitterResults = await this.publishToTwitter(noticia, site, scheduledAt, optimizeContent);
          allTwitterResults.push(...twitterResults);
        }
      }

      // Calcular estadísticas
      const facebookSuccessful = allFacebookResults.filter(r => r.success).length;
      const facebookFailed = allFacebookResults.filter(r => !r.success).length;
      const twitterSuccessful = allTwitterResults.filter(r => r.success).length;
      const twitterFailed = allTwitterResults.filter(r => !r.success).length;

      const totalPublished = facebookSuccessful + twitterSuccessful;
      const totalFailed = facebookFailed + twitterFailed;
      const totalPlatforms = allFacebookResults.length + allTwitterResults.length;
      const successRate = totalPlatforms > 0 ? (totalPublished / totalPlatforms) * 100 : 0;

      const result: SocialMediaPublishingResult = {
        noticia: {
          id: noticia._id.toString(),
          title: noticia.title, // ✅ FIX: PublishedNoticia solo tiene "title"
          slug: noticia.slug,
        },
        facebook: {
          total: allFacebookResults.length,
          successful: facebookSuccessful,
          failed: facebookFailed,
          results: allFacebookResults,
        },
        twitter: {
          total: allTwitterResults.length,
          successful: twitterSuccessful,
          failed: twitterFailed,
          results: allTwitterResults,
        },
        summary: {
          totalPlatforms,
          totalPublished,
          totalFailed,
          successRate: Math.round(successRate * 100) / 100,
        },
      };

      // Emitir evento de resultado
      this.eventEmitter.emit('generator-pro.social-media.publish_completed', {
        noticiaId: noticia._id,
        result,
        timestamp: new Date(),
      });

      this.logger.log(`✅ Social media publishing completed: ${totalPublished}/${totalPlatforms} successful`);

      return result;

    } catch (error) {
      this.logger.error(`❌ Social media publishing failed: ${error.message}`);

      this.eventEmitter.emit('generator-pro.social-media.publish_failed', {
        noticiaId: noticia._id,
        error: error.message,
        timestamp: new Date(),
      });

      throw error;
    }
  }

  /**
   * 📘 PUBLICAR EN TODAS LAS PÁGINAS DE FACEBOOK DEL SITIO
   *
   * ✅ REFACTORIZADO: Usa site.socialMedia.facebookPages[] directamente
   * ❌ ANTERIOR: Buscaba en FacebookPublishingConfig collection (que no existe)
   */
  async publishToFacebook(
    noticia: any,
    site: SiteDocument,
    scheduledAt: Date,
    optimizeContent: boolean
  ): Promise<FacebookPublishResult[]> {
    this.logger.log(`📘 Publishing to Facebook for site: ${site.name}`);

    const results: FacebookPublishResult[] = [];

    try {
      // ✅ NUEVO: Obtener páginas de Facebook desde site.socialMedia
      const facebookPages = site.socialMedia?.facebookPages?.filter(page => page.isActive) || [];

      if (facebookPages.length === 0) {
        this.logger.warn(`⚠️ No active Facebook pages found for site ${site.name}`);
        return results;
      }

      this.logger.log(`📘 Found ${facebookPages.length} active Facebook pages`);

      // Obtener API Key (prioridad: site > fallback hardcodeado)
      const getLateApiKey = site.socialMedia?.getLateApiKey ||
        'sk_a7e92958841ee94d4d95b99f88b1f7b0fb7672a60b0fca50f27b190476d98cd8';

      // ✅ FIX: Obtener AIContentGeneration para acceder a socialMediaCopies
      const aiContent = await this.aiContentModel.findById(noticia.contentId);
      if (!aiContent || !aiContent.socialMediaCopies?.facebook?.copy) {
        this.logger.warn(`⚠️ No social media copy found for noticia ${noticia._id}`);
        return results;
      }

      // ✅ FIX: Construir URL canónica
      const canonicalUrl = `https://${site.domain}/${noticia.slug}`;

      // 🔍 DEBUG: Log COMPLETO de socialMediaCopies para diagnosticar
      this.logger.debug(`🔍 [DEBUG] socialMediaCopies.facebook COMPLETO:
${JSON.stringify(aiContent.socialMediaCopies.facebook, null, 2)}`);

      // Publicar en cada página de Facebook
      for (const page of facebookPages) {
        try {
          // ✅ Publicar SOLO el campo 'copy' con emojis + hashtag + URL
          const { copy, emojis, hashtag } = aiContent.socialMediaCopies.facebook;

          // 🔍 DEBUG: Log de campos individuales
          this.logger.debug(`🔍 [DEBUG] Facebook fields:
  - copy: "${copy}"
  - emojis: ${JSON.stringify(emojis)}
  - hashtag: "${hashtag}" (${hashtag ? 'EXISTS' : 'UNDEFINED'})`);

          const emojiString = emojis && emojis.length > 0 ? emojis.join(' ') + ' ' : '';
          const hashtagString = hashtag ? `\n\n${hashtag}` : '';
          const postContent = `${emojiString}${copy}${hashtagString}\n\n${canonicalUrl}`;

          this.logger.debug(`🔍 [DEBUG] Facebook postContent final:\n${postContent}`);

          // Crear post en la base de datos
          const facebookPost = await this.facebookPostModel.create({
            // 🆕 NUEVO FLUJO: publishedNoticiaId (flujo moderno)
            publishedNoticiaId: noticia._id,
            // 🆕 FLUJO LEGACY: Datos desde PublishedNoticia para compatibilidad
            originalNoticiaId: noticia.originalNoticiaId, // ✅ FIX: Pasar desde PublishedNoticia
            generatedContentId: noticia.contentId,        // ✅ FIX: Pasar desde PublishedNoticia
            siteId: site._id,
            // ✅ NUEVO: facebookConfigId es opcional ahora (deprecado)
            facebookConfigId: page.publishingConfigId || undefined,
            // ✅ NUEVO: Guardamos pageId y pageName directamente
            pageId: page.pageId,
            pageName: page.pageName,
            postContent,
            originalTitle: noticia.title,  // ✅ FIX: Usar "title" no "titulo"
            mediaUrls: noticia.featuredImage?.large ? [noticia.featuredImage.large] : [], // ✅ FIX: Usar featuredImage.large
            scheduledAt,
            status: 'scheduled',
          });

          // ✅ NUEVO: Publicar post con pageId, pageName y apiKey directamente
          const publishResult = await this.facebookPublishingService.publishPost(
            facebookPost,
            page.pageId,
            page.pageName,
            getLateApiKey
          );

          results.push({
            configId: page.publishingConfigId?.toString() || 'direct',
            configName: page.pageName,
            facebookPageId: page.pageId,
            facebookPageName: page.pageName,
            success: publishResult.success,
            postId: publishResult.facebookPostId,
            postUrl: publishResult.facebookPostUrl,
            error: publishResult.error,
          });

        } catch (error) {
          this.logger.error(`❌ Failed to publish to Facebook page ${page.pageName}: ${error.message}`);
          results.push({
            configId: page.publishingConfigId?.toString() || 'direct',
            configName: page.pageName,
            facebookPageId: page.pageId,
            facebookPageName: page.pageName,
            success: false,
            error: error.message,
          });
        }
      }

      return results;

    } catch (error) {
      this.logger.error(`❌ Failed to publish to Facebook: ${error.message}`);
      return results;
    }
  }

  /**
   * 🐦 PUBLICAR EN TODAS LAS CUENTAS DE TWITTER DEL SITIO
   *
   * ✅ REFACTORIZADO: Usa site.socialMedia.twitterAccounts[] directamente
   * ❌ ANTERIOR: Buscaba en TwitterPublishingConfig collection (que no existe)
   */
  async publishToTwitter(
    noticia: any,
    site: SiteDocument,
    scheduledAt: Date,
    optimizeContent: boolean
  ): Promise<TwitterPublishResult[]> {
    this.logger.log(`🐦 Publishing to Twitter for site: ${site.name}`);

    const results: TwitterPublishResult[] = [];

    try {
      // ✅ NUEVO: Obtener cuentas de Twitter desde site.socialMedia
      const twitterAccounts = site.socialMedia?.twitterAccounts?.filter(account => account.isActive) || [];

      if (twitterAccounts.length === 0) {
        this.logger.warn(`⚠️ No active Twitter accounts found for site ${site.name}`);
        return results;
      }

      this.logger.log(`🐦 Found ${twitterAccounts.length} active Twitter accounts`);

      // Obtener API Key (prioridad: site > fallback hardcodeado)
      const getLateApiKey = site.socialMedia?.getLateApiKey ||
        'sk_a7e92958841ee94d4d95b99f88b1f7b0fb7672a60b0fca50f27b190476d98cd8';

      // ✅ FIX: Obtener AIContentGeneration para acceder a socialMediaCopies
      const aiContent = await this.aiContentModel.findById(noticia.contentId);
      if (!aiContent || !aiContent.socialMediaCopies?.twitter?.tweet) {
        this.logger.warn(`⚠️ No social media copy found for noticia ${noticia._id}`);
        return results;
      }

      // ✅ FIX: Construir URL canónica
      const canonicalUrl = `https://${site.domain}/${noticia.slug}`;

      // 🔍 DEBUG: Log COMPLETO de socialMediaCopies para diagnosticar
      this.logger.debug(`🔍 [DEBUG] socialMediaCopies.twitter COMPLETO:
${JSON.stringify(aiContent.socialMediaCopies.twitter, null, 2)}`);

      // Publicar en cada cuenta de Twitter
      for (const account of twitterAccounts) {
        try {
          // ✅ Publicar SOLO el campo 'tweet' con emojis + hashtags (SIN URL en el texto)
          // La URL se pasará en platformSpecificData.url para que no consuma caracteres
          const { tweet, emojis, hashtags } = aiContent.socialMediaCopies.twitter;

          // 🔍 DEBUG: Log de campos individuales
          this.logger.debug(`🔍 [DEBUG] Twitter fields:
  - tweet: "${tweet}"
  - emojis: ${JSON.stringify(emojis)}
  - hashtags: ${JSON.stringify(hashtags)} (${hashtags ? 'EXISTS' : 'UNDEFINED'})`);

          const emojiString = emojis && emojis.length > 0 ? emojis.join(' ') + ' ' : '';
          const hashtagsString = hashtags && hashtags.length > 0 ? ' ' + hashtags.join(' ') : '';

          // Construir tweet: emojis + tweet + hashtags (SIN URL)
          // Twitter cuenta URLs como 23 caracteres, pero usando platformSpecificData.url no consume caracteres
          const fullTweet = `${emojiString}${tweet}${hashtagsString}`;

          this.logger.debug(`🔍 [DEBUG] Twitter fullTweet (SIN URL):\n${fullTweet}`);

          let tweetContent: string;

          if (fullTweet.length <= 280) {
            // ✅ Cabe completo
            tweetContent = fullTweet;
          } else {
            // No cabe - truncar tweet pero mantener emojis y hashtags
            this.logger.warn(`⚠️ Tweet exceeds 280 characters, truncating...`);
            const fixedLength = emojiString.length + hashtagsString.length + 3; // +3 para "..."
            const maxTweetLength = 280 - fixedLength;
            const truncatedTweet = tweet.substring(0, maxTweetLength) + '...';
            tweetContent = `${emojiString}${truncatedTweet}${hashtagsString}`;
          }

          // Crear tweet en la base de datos
          const twitterPost = await this.twitterPostModel.create({
            publishedNoticiaId: noticia._id,
            siteId: site._id,
            // ✅ NUEVO: twitterConfigId es opcional ahora (deprecado)
            twitterConfigId: account.publishingConfigId || undefined,
            // ✅ NUEVO: Guardamos accountId y username directamente
            accountId: account.accountId,
            username: account.username,
            tweetContent,
            originalTitle: noticia.title,  // ✅ FIX: Usar "title" no "titulo"
            mediaUrls: noticia.featuredImage?.large ? [noticia.featuredImage.large] : [], // ✅ FIX: Usar featuredImage.large
            scheduledAt,
            status: 'scheduled',
          });

          // ✅ NUEVO: Publicar tweet con accountId, username, apiKey y canonical URL
          const publishResult = await this.twitterPublishingService.publishTweet(
            twitterPost,
            account.accountId,
            account.username,
            getLateApiKey,
            canonicalUrl  // 🆕 Pasar URL canónica para platformSpecificData
          );

          results.push({
            configId: account.publishingConfigId?.toString() || 'direct',
            configName: account.displayName,
            twitterAccountId: account.accountId,
            twitterUsername: account.username,
            success: publishResult.success,
            tweetId: publishResult.tweetId,
            tweetUrl: publishResult.tweetUrl,
            error: publishResult.error,
          });

        } catch (error) {
          this.logger.error(`❌ Failed to publish to Twitter account ${account.username}: ${error.message}`);
          results.push({
            configId: account.publishingConfigId?.toString() || 'direct',
            configName: account.displayName,
            twitterAccountId: account.accountId,
            twitterUsername: account.username,
            success: false,
            error: error.message,
          });
        }
      }

      return results;

    } catch (error) {
      this.logger.error(`❌ Failed to publish to Twitter: ${error.message}`);
      return results;
    }
  }

  /**
   * 📊 ACTUALIZAR NOTICIA CON TRACKING DE REDES SOCIALES
   */
  async updateNoticiaWithSocialMediaTracking(
    noticiaId: Types.ObjectId,
    results: SocialMediaPublishingResult
  ): Promise<void> {
    this.logger.log(`📊 Updating noticia ${noticiaId} with social media tracking`);

    try {
      // TODO: Implementar actualización del documento PublishedNoticia con estadísticas
      // Por ahora solo emitimos evento
      this.eventEmitter.emit('generator-pro.noticia.social-media-updated', {
        noticiaId,
        totalPublished: results.summary.totalPublished,
        totalFailed: results.summary.totalFailed,
        timestamp: new Date(),
      });

      this.logger.log(`✅ Noticia ${noticiaId} updated with social media tracking`);

    } catch (error) {
      this.logger.error(`❌ Failed to update noticia with tracking: ${error.message}`);
      throw error;
    }
  }
}
