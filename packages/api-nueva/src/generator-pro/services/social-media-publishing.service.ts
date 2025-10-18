import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { FacebookPublishingService } from './facebook-publishing.service';
import { TwitterPublishingService } from './twitter-publishing.service';
import { FacebookPublishingConfig, FacebookPublishingConfigDocument } from '../schemas/facebook-publishing-config.schema';
import { TwitterPublishingConfig, TwitterPublishingConfigDocument } from '../schemas/twitter-publishing-config.schema';
import { FacebookPost, FacebookPostDocument } from '../schemas/facebook-post.schema';
import { TwitterPost, TwitterPostDocument } from '../schemas/twitter-post.schema';
import { Site, SiteDocument } from '../../pachuca-noticias/schemas/site.schema';

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
    @InjectModel(FacebookPublishingConfig.name)
    private readonly facebookConfigModel: Model<FacebookPublishingConfigDocument>,
    @InjectModel(TwitterPublishingConfig.name)
    private readonly twitterConfigModel: Model<TwitterPublishingConfigDocument>,
    @InjectModel(FacebookPost.name)
    private readonly facebookPostModel: Model<FacebookPostDocument>,
    @InjectModel(TwitterPost.name)
    private readonly twitterPostModel: Model<TwitterPostDocument>,
    private readonly facebookPublishingService: FacebookPublishingService,
    private readonly twitterPublishingService: TwitterPublishingService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.log('📱 Social Media Publishing Service initialized');
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
          title: noticia.titulo || noticia.title,
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
      // Obtener configuraciones de Facebook para este sitio
      const facebookConfigs = await this.facebookConfigModel.find({
        siteId: site._id,
        isActive: true,
      });

      if (facebookConfigs.length === 0) {
        this.logger.warn(`⚠️ No active Facebook configs found for site ${site.name}`);
        return results;
      }

      this.logger.log(`📘 Found ${facebookConfigs.length} active Facebook configs`);

      // Publicar en cada configuración de Facebook
      for (const config of facebookConfigs) {
        try {
          // Verificar límites diarios
          if (!config.canPublishToday) {
            this.logger.warn(`⚠️ Daily limit reached for Facebook config ${config.name}`);
            results.push({
              configId: (config._id as Types.ObjectId).toString(),
              configName: config.name,
              facebookPageId: config.facebookPageId,
              facebookPageName: config.facebookPageName,
              success: false,
              error: 'Daily posting limit reached',
            });
            continue;
          }

          // Optimizar contenido si está habilitado
          let postContent = noticia.generatedContent || noticia.titulo;
          if (optimizeContent) {
            postContent = await this.facebookPublishingService.optimizeContentForFacebook(noticia);
          }

          // Crear post en la base de datos
          const facebookPost = await this.facebookPostModel.create({
            publishedNoticiaId: noticia._id,
            siteId: site._id,
            facebookConfigId: config._id,
            postContent,
            originalTitle: noticia.titulo,
            mediaUrls: noticia.imagenDestacada ? [noticia.imagenDestacada] : [],
            scheduledAt,
            status: 'scheduled',
          });

          // Publicar post
          const publishResult = await this.facebookPublishingService.publishPost(facebookPost);

          results.push({
            configId: (config._id as Types.ObjectId).toString(),
            configName: config.name,
            facebookPageId: config.facebookPageId,
            facebookPageName: config.facebookPageName,
            success: publishResult.success,
            postId: publishResult.facebookPostId,
            postUrl: publishResult.facebookPostUrl,
            error: publishResult.error,
          });

        } catch (error) {
          this.logger.error(`❌ Failed to publish to Facebook config ${config.name}: ${error.message}`);
          results.push({
            configId: (config._id as Types.ObjectId).toString(),
            configName: config.name,
            facebookPageId: config.facebookPageId,
            facebookPageName: config.facebookPageName,
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
      // Obtener configuraciones de Twitter para este sitio
      const twitterConfigs = await this.twitterConfigModel.find({
        siteId: site._id,
        isActive: true,
      });

      if (twitterConfigs.length === 0) {
        this.logger.warn(`⚠️ No active Twitter configs found for site ${site.name}`);
        return results;
      }

      this.logger.log(`🐦 Found ${twitterConfigs.length} active Twitter configs`);

      // Publicar en cada configuración de Twitter
      for (const config of twitterConfigs) {
        try {
          // Verificar límites diarios
          if (!config.canPublishToday) {
            this.logger.warn(`⚠️ Daily limit reached for Twitter config ${config.name}`);
            results.push({
              configId: (config._id as Types.ObjectId).toString(),
              configName: config.name,
              twitterAccountId: config.twitterAccountId,
              twitterUsername: config.twitterUsername,
              success: false,
              error: 'Daily tweet limit reached',
            });
            continue;
          }

          // Optimizar contenido si está habilitado
          let tweetContent = noticia.generatedContent || noticia.titulo;
          if (optimizeContent) {
            tweetContent = await this.twitterPublishingService.optimizeContentForTwitter(noticia);
          }

          // Validar longitud del tweet
          if (tweetContent.length > 280) {
            this.logger.warn(`⚠️ Tweet content exceeds 280 characters, truncating...`);
            tweetContent = tweetContent.substring(0, 277) + '...';
          }

          // Crear tweet en la base de datos
          const twitterPost = await this.twitterPostModel.create({
            publishedNoticiaId: noticia._id,
            siteId: site._id,
            twitterConfigId: config._id,
            tweetContent,
            originalTitle: noticia.titulo,
            mediaUrls: noticia.imagenDestacada ? [noticia.imagenDestacada] : [],
            scheduledAt,
            status: 'scheduled',
          });

          // Publicar tweet
          const publishResult = await this.twitterPublishingService.publishTweet(twitterPost);

          results.push({
            configId: (config._id as Types.ObjectId).toString(),
            configName: config.name,
            twitterAccountId: config.twitterAccountId,
            twitterUsername: config.twitterUsername,
            success: publishResult.success,
            tweetId: publishResult.tweetId,
            tweetUrl: publishResult.tweetUrl,
            error: publishResult.error,
          });

        } catch (error) {
          this.logger.error(`❌ Failed to publish to Twitter config ${config.name}: ${error.message}`);
          results.push({
            configId: (config._id as Types.ObjectId).toString(),
            configName: config.name,
            twitterAccountId: config.twitterAccountId,
            twitterUsername: config.twitterUsername,
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
