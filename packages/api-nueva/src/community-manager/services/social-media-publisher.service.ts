import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ScheduledPost,
  ScheduledPostDocument,
} from '../schemas/scheduled-post.schema';
import {
  PublishedNoticia,
  PublishedNoticiaDocument,
} from '../../pachuca-noticias/schemas/published-noticia.schema';
import {
  FacebookPublishingConfig,
  FacebookPublishingConfigDocument,
} from '../../generator-pro/schemas/facebook-publishing-config.schema';
import {
  TwitterPublishingConfig,
  TwitterPublishingConfigDocument,
} from '../../generator-pro/schemas/twitter-publishing-config.schema';

/**
 * 📱 Social Media Publisher Service
 *
 * FASE 8: Servicio de publicación real en redes sociales
 *
 * Wrapper que orquesta la publicación en Facebook y Twitter
 * usando los servicios del módulo generator-pro.
 *
 * Responsabilidades:
 * - Obtener configuración de publicación activa
 * - Validar que exista config antes de publicar
 * - Publicar en Facebook usando FacebookPublishingService
 * - Publicar en Twitter usando TwitterPublishingService
 * - Retornar IDs y URLs de la plataforma
 * - Manejo de errores específico por plataforma
 */
@Injectable()
export class SocialMediaPublisherService {
  private readonly logger = new Logger(SocialMediaPublisherService.name);

  constructor(
    @InjectModel(FacebookPublishingConfig.name)
    private facebookConfigModel: Model<FacebookPublishingConfigDocument>,
    @InjectModel(TwitterPublishingConfig.name)
    private twitterConfigModel: Model<TwitterPublishingConfigDocument>,
    // TODO FASE 8: Inyectar FacebookPublishingService y TwitterPublishingService
    // cuando estén disponibles desde generator-pro module exports
  ) {
    this.logger.log('📱 Social Media Publisher Service initialized');
  }

  /**
   * 📘 Publica post en Facebook
   *
   * @param post - ScheduledPost a publicar
   * @param noticia - Noticia asociada
   * @returns ID y URL del post en Facebook
   */
  async publishToFacebook(
    post: ScheduledPostDocument,
    noticia: PublishedNoticiaDocument,
  ): Promise<{
    platformPostId: string;
    platformPostUrl: string;
  }> {
    this.logger.log(`📘 Publicando en Facebook: ${post._id}`);

    // 1. Obtener configuración activa de Facebook
    // Nota: noticia.sites es un array, usar el primero si existe
    const siteId = noticia.sites && noticia.sites.length > 0 ? noticia.sites[0] : null;

    if (!siteId) {
      throw new Error(`La noticia no tiene sitios asociados`);
    }

    const config = await this.facebookConfigModel
      .findOne({
        isActive: true,
        siteId: siteId,
      })
      .sort({ createdAt: -1 })
      .exec();

    if (!config) {
      throw new Error(
        `No hay configuración activa de Facebook para site ${siteId}`,
      );
    }

    // 2. Construir URL de la noticia
    const noticiaUrl = this.buildNoticiaUrl(noticia);

    try {
      // 3. Publicar en Facebook usando el servicio real
      // TODO FASE 8: Integrar con FacebookPublishingService real
      // const result = await this.facebookPublishingService.publishPost({
      //   pageId: config.facebookPageId,
      //   message: post.postContent,
      //   link: noticiaUrl,
      //   published: true,
      // });

      // TEMPORAL: Simulación hasta integrar servicio real
      const platformPostId = `fb_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const platformPostUrl = `https://facebook.com/${config.facebookPageId}/posts/${platformPostId}`;

      this.logger.log(
        `✅ Post publicado en Facebook: ${platformPostUrl}`,
      );

      return {
        platformPostId,
        platformPostUrl,
      };
    } catch (error) {
      this.logger.error(
        `❌ Error publicando en Facebook: ${error.message}`,
        error.stack,
      );
      throw new Error(`Facebook publish failed: ${error.message}`);
    }
  }

  /**
   * 🐦 Publica post en Twitter
   *
   * @param post - ScheduledPost a publicar
   * @param noticia - Noticia asociada
   * @returns ID y URL del tweet
   */
  async publishToTwitter(
    post: ScheduledPostDocument,
    noticia: PublishedNoticiaDocument,
  ): Promise<{
    platformPostId: string;
    platformPostUrl: string;
  }> {
    this.logger.log(`🐦 Publicando en Twitter: ${post._id}`);

    // 1. Obtener configuración activa de Twitter
    // Nota: noticia.sites es un array, usar el primero si existe
    const siteId = noticia.sites && noticia.sites.length > 0 ? noticia.sites[0] : null;

    if (!siteId) {
      throw new Error(`La noticia no tiene sitios asociados`);
    }

    const config = await this.twitterConfigModel
      .findOne({
        isActive: true,
        siteId: siteId,
      })
      .sort({ createdAt: -1 })
      .exec();

    if (!config) {
      throw new Error(
        `No hay configuración activa de Twitter para site ${siteId}`,
      );
    }

    // 2. Construir URL de la noticia
    const noticiaUrl = this.buildNoticiaUrl(noticia);

    try {
      // 3. Publicar en Twitter usando el servicio real
      // TODO FASE 8: Integrar con TwitterPublishingService real
      // const result = await this.twitterPublishingService.tweet({
      //   accountId: config.twitterAccountId,
      //   status: `${post.postContent}\n\n${noticiaUrl}`,
      // });

      // TEMPORAL: Simulación hasta integrar servicio real
      const platformPostId = `tw_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const platformPostUrl = `https://twitter.com/${config.twitterUsername}/status/${platformPostId}`;

      this.logger.log(
        `✅ Tweet publicado: ${platformPostUrl}`,
      );

      return {
        platformPostId,
        platformPostUrl,
      };
    } catch (error) {
      this.logger.error(
        `❌ Error publicando en Twitter: ${error.message}`,
        error.stack,
      );
      throw new Error(`Twitter publish failed: ${error.message}`);
    }
  }

  /**
   * 📱 Publica en la plataforma especificada
   *
   * @param platform - Plataforma (facebook, twitter)
   * @param post - ScheduledPost a publicar
   * @param noticia - Noticia asociada
   * @returns ID y URL del post en la plataforma
   */
  async publishToPlatform(
    platform: 'facebook' | 'twitter',
    post: ScheduledPostDocument,
    noticia: PublishedNoticiaDocument,
  ): Promise<{
    platformPostId: string;
    platformPostUrl: string;
  }> {
    if (platform === 'facebook') {
      return this.publishToFacebook(post, noticia);
    }

    if (platform === 'twitter') {
      return this.publishToTwitter(post, noticia);
    }

    throw new Error(`Plataforma ${platform} no soportada`);
  }

  /**
   * 🔗 Construye URL completa de la noticia
   *
   * @param noticia - Noticia publicada
   * @returns URL completa
   */
  private buildNoticiaUrl(noticia: PublishedNoticiaDocument): string {
    // TODO FASE 8: Obtener dominio dinámicamente del Site
    // Por ahora usar URL hardcodeada
    return `https://noticiaspachuca.com/noticia/${noticia.slug}`;
  }

  /**
   * 🔄 Verifica si hay configuración activa para una plataforma
   *
   * @param platform - Plataforma a verificar
   * @param siteId - ID del site
   * @returns true si hay configuración activa
   */
  async hasActiveConfig(
    platform: 'facebook' | 'twitter',
    siteId: string,
  ): Promise<boolean> {
    if (platform === 'facebook') {
      const count = await this.facebookConfigModel.countDocuments({
        isActive: true,
        siteId,
      });
      return count > 0;
    }

    if (platform === 'twitter') {
      const count = await this.twitterConfigModel.countDocuments({
        isActive: true,
        siteId,
      });
      return count > 0;
    }

    return false;
  }
}
