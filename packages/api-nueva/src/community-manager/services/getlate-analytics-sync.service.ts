import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model } from 'mongoose';
import axios from 'axios';
import {
  ScheduledPost,
  ScheduledPostDocument,
} from '../schemas/scheduled-post.schema';
import {
  FacebookPublishingConfig,
  FacebookPublishingConfigDocument,
} from '../../generator-pro/schemas/facebook-publishing-config.schema';
import {
  TwitterPublishingConfig,
  TwitterPublishingConfigDocument,
} from '../../generator-pro/schemas/twitter-publishing-config.schema';

/**
 * 📊 GetLate Analytics Sync Service
 *
 * FASE 8: Sincronización automática de métricas desde GetLate.dev
 *
 * Responsabilidades:
 * - Consultar GetLate API para obtener métricas de posts publicados
 * - Actualizar campo engagement en ScheduledPost con datos reales
 * - Sincronización automática cada 30 minutos mediante cron job
 * - Sincronización manual también disponible mediante endpoints REST
 * - Soporte para Facebook y Twitter
 *
 * CRON JOB: Ejecuta cada 30 minutos para sincronizar métricas de posts
 * publicados en las últimas 48 horas (para capturar engagement reciente)
 */
@Injectable()
export class GetLateAnalyticsSyncService {
  private readonly logger = new Logger(GetLateAnalyticsSyncService.name);
  private readonly GETLATE_API_BASE = 'https://getlate.dev/api/v1'; // ✅ FIX: URL correcta de GetLate API

  constructor(
    @InjectModel(ScheduledPost.name)
    private scheduledPostModel: Model<ScheduledPostDocument>,
    @InjectModel(FacebookPublishingConfig.name)
    private facebookConfigModel: Model<FacebookPublishingConfigDocument>,
    @InjectModel(TwitterPublishingConfig.name)
    private twitterConfigModel: Model<TwitterPublishingConfigDocument>,
  ) {
    this.logger.log('📊 GetLate Analytics Sync Service initialized');
  }

  /**
   * 🔄 Cron job de sincronización automática
   *
   * Ejecuta cada 30 minutos para sincronizar métricas de posts
   * publicados en las últimas 48 horas.
   *
   * Frecuencia: Cada 30 minutos
   * Rango: Posts de las últimas 48 horas
   * Límite: 100 posts por ejecución
   */
  @Cron('*/30 * * * *', {
    name: 'sync-getlate-analytics',
    timeZone: 'America/Mexico_City',
  })
  async autoSyncRecentPosts(): Promise<void> {
    this.logger.log('🔄 Iniciando sincronización automática de métricas GetLate...');

    try {
      const result = await this.syncMultiplePosts({
        hoursBack: 48, // Últimas 48 horas
        limit: 100,
      });

      this.logger.log(
        `✅ Sincronización automática completada: ${result.synced} exitosos, ${result.failed} fallidos de ${result.total} posts`,
      );

      if (result.failed > 0) {
        this.logger.warn(
          `⚠️ ${result.failed} posts fallaron en sincronización. Errores: ${JSON.stringify(result.errors.slice(0, 3))}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `❌ Error en sincronización automática: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * 🔄 Sincroniza métricas de un post individual
   *
   * @param scheduledPostId - ID del ScheduledPost a sincronizar
   * @returns Post actualizado con métricas
   */
  async syncPostMetrics(
    scheduledPostId: string,
  ): Promise<ScheduledPostDocument> {
    this.logger.log(`🔄 Sincronizando métricas de post: ${scheduledPostId}`);

    const post = await this.scheduledPostModel.findById(scheduledPostId);

    if (!post) {
      throw new Error(`Post ${scheduledPostId} no encontrado`);
    }

    if (post.status !== 'published') {
      throw new Error(
        `Post ${scheduledPostId} no está publicado (status: ${post.status})`,
      );
    }

    if (!post.platformPostId) {
      throw new Error(
        `Post ${scheduledPostId} no tiene platformPostId (no se publicó en la plataforma)`,
      );
    }

    // Validar plataforma
    if (post.platform !== 'facebook' && post.platform !== 'twitter') {
      throw new Error(`Plataforma ${post.platform} no soportada`);
    }

    // Obtener API key según plataforma
    const apiKey = await this.getApiKeyForPlatform(post.platform, String(post.noticiaId));

    if (!apiKey) {
      throw new Error(
        `No se encontró API key de GetLate para plataforma ${post.platform}`,
      );
    }

    // Consultar métricas desde GetLate
    const metrics = await this.fetchMetricsFromGetLate(
      post.platform,
      post.platformPostId,
      apiKey,
    );

    // Actualizar engagement en post
    post.engagement = {
      likes: metrics.likes || 0,
      comments: metrics.comments || 0,
      shares: metrics.shares || 0,
      clicks: metrics.clicks || 0,
      impressions: metrics.impressions || 0,
      reach: metrics.reach || 0,
      engagementRate:
        metrics.reach > 0
          ? parseFloat(
              (
                ((metrics.likes + metrics.comments + metrics.shares) /
                  metrics.reach) *
                100
              ).toFixed(2),
            )
          : 0,
      lastUpdated: new Date(),
    };

    await post.save();

    this.logger.log(
      `✅ Métricas sincronizadas para post ${scheduledPostId}: ${metrics.likes} likes, ${metrics.reach} reach`,
    );

    return post;
  }

  /**
   * 🔄 Sincroniza métricas de múltiples posts
   *
   * @param filters - Filtros para seleccionar posts
   * @returns Resumen de sincronización
   */
  async syncMultiplePosts(filters?: {
    platform?: 'facebook' | 'twitter';
    hoursBack?: number; // Sincronizar posts de las últimas X horas
    limit?: number;
  }): Promise<{
    total: number;
    synced: number;
    failed: number;
    errors: Array<{ postId: string; error: string }>;
  }> {
    const hoursBack = filters?.hoursBack || 24;
    const limit = filters?.limit || 50;

    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hoursBack);

    const matchStage: Record<string, unknown> = {
      status: 'published',
      publishedAt: { $gte: cutoffDate },
      platformPostId: { $exists: true, $ne: null },
    };

    if (filters?.platform) {
      matchStage.platform = filters.platform;
    }

    const posts = await this.scheduledPostModel
      .find(matchStage)
      .sort({ publishedAt: -1 })
      .limit(limit)
      .exec();

    this.logger.log(
      `🔄 Sincronizando métricas de ${posts.length} posts de las últimas ${hoursBack} horas`,
    );

    let synced = 0;
    let failed = 0;
    const errors: Array<{ postId: string; error: string }> = [];

    for (const post of posts) {
      try {
        await this.syncPostMetrics(String(post._id));
        synced++;
      } catch (error) {
        failed++;
        errors.push({
          postId: String(post._id),
          error: error.message,
        });
        this.logger.error(
          `❌ Error sincronizando post ${String(post._id)}: ${error.message}`,
        );
      }

      // Delay de 100ms entre requests para no saturar API
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.logger.log(
      `📊 Sincronización completada: ${synced} exitosos, ${failed} fallidos`,
    );

    return {
      total: posts.length,
      synced,
      failed,
      errors,
    };
  }

  /**
   * 📈 Consulta métricas desde GetLate API
   *
   * @param platform - Plataforma (facebook, twitter)
   * @param platformPostId - ID del post en la plataforma
   * @param apiKey - API key de GetLate
   * @returns Métricas del post
   */
  private async fetchMetricsFromGetLate(
    platform: 'facebook' | 'twitter',
    platformPostId: string,
    apiKey: string,
  ): Promise<{
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
    impressions: number;
    reach: number;
  }> {
    try {
      // Endpoint de GetLate para obtener métricas de un post
      // Documentación: https://docs.getlate.dev/api/analytics
      const endpoint = `${this.GETLATE_API_BASE}/posts/${platformPostId}/analytics`;

      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 segundos timeout
      });

      const data = response.data;

      // Mapear respuesta de GetLate a nuestro formato
      // Nota: Los campos exactos dependen de la API de GetLate
      // Ajustar según documentación real
      if (platform === 'facebook') {
        return {
          likes: data.reactions || data.likes || 0,
          comments: data.comments || 0,
          shares: data.shares || 0,
          clicks: data.clicks || data.link_clicks || 0,
          impressions: data.impressions || 0,
          reach: data.reach || data.impressions || 0,
        };
      } else {
        // Twitter
        return {
          likes: data.likes || data.favorite_count || 0,
          comments: data.replies || data.reply_count || 0,
          shares: data.retweets || data.retweet_count || 0,
          clicks: data.clicks || data.url_clicks || 0,
          impressions: data.impressions || 0,
          reach: data.impressions || 0, // Twitter no tiene reach separado
        };
      }
    } catch (error) {
      this.logger.error(
        `❌ Error consultando GetLate API: ${error.message}`,
        error.stack,
      );

      // Si es error de API (404, 401, etc), lanzar mensaje específico
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.message;

        if (status === 404) {
          throw new Error(
            `Post ${platformPostId} no encontrado en GetLate (puede que aún no tenga métricas)`,
          );
        } else if (status === 401) {
          throw new Error(`API key de GetLate inválida o expirada`);
        } else if (status === 429) {
          throw new Error(`Rate limit de GetLate excedido, reintentar más tarde`);
        } else {
          throw new Error(`Error GetLate API (${status}): ${message}`);
        }
      }

      throw new Error(`Error conectando con GetLate: ${error.message}`);
    }
  }

  /**
   * 🔑 Obtiene API key de GetLate según plataforma
   *
   * @param platform - Plataforma
   * @param noticiaId - ID de noticia para obtener siteId
   * @returns API key
   */
  private async getApiKeyForPlatform(
    platform: 'facebook' | 'twitter',
    noticiaId: string,
  ): Promise<string | null> {
    try {
      // TODO: Obtener siteId desde la noticia
      // Por ahora buscar configuración activa

      if (platform === 'facebook') {
        const config = await this.facebookConfigModel
          .findOne({ isActive: true })
          .select('+getLateApiKey') // Incluir campo que por defecto no se incluye
          .exec();

        return config?.getLateApiKey || null;
      } else {
        const config = await this.twitterConfigModel
          .findOne({ isActive: true })
          .select('+getLateApiKey')
          .exec();

        return config?.getLateApiKey || null;
      }
    } catch (error) {
      this.logger.error(
        `Error obteniendo API key: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * 📊 Obtiene estadísticas de sincronización
   *
   * @returns Stats de posts sincronizados vs pendientes
   */
  async getSyncStats(): Promise<{
    totalPublished: number;
    withMetrics: number;
    withoutMetrics: number;
    lastSynced: Date | null;
    avgEngagement: number;
  }> {
    const totalPublished = await this.scheduledPostModel.countDocuments({
      status: 'published',
    });

    const withMetrics = await this.scheduledPostModel.countDocuments({
      status: 'published',
      'engagement.lastUpdated': { $exists: true },
    });

    const withoutMetrics = totalPublished - withMetrics;

    // Última sincronización
    const lastSyncedPost = await this.scheduledPostModel
      .findOne({
        status: 'published',
        'engagement.lastUpdated': { $exists: true },
      })
      .sort({ 'engagement.lastUpdated': -1 })
      .exec();

    const lastSynced = lastSyncedPost?.engagement?.lastUpdated || null;

    // Engagement promedio
    const result = await this.scheduledPostModel.aggregate([
      {
        $match: {
          status: 'published',
          'engagement.lastUpdated': { $exists: true },
        },
      },
      {
        $group: {
          _id: null,
          avgEngagement: {
            $avg: {
              $add: [
                { $ifNull: ['$engagement.likes', 0] },
                { $ifNull: ['$engagement.comments', 0] },
                { $ifNull: ['$engagement.shares', 0] },
              ],
            },
          },
        },
      },
    ]);

    const avgEngagement = result.length > 0 ? Math.round(result[0].avgEngagement) : 0;

    return {
      totalPublished,
      withMetrics,
      withoutMetrics,
      lastSynced,
      avgEngagement,
    };
  }

  /**
   * 🧪 Prueba de conexión con GetLate API
   *
   * @param platform - Plataforma a probar
   * @returns Resultado de la prueba
   */
  async testConnection(platform: 'facebook' | 'twitter'): Promise<{
    success: boolean;
    message: string;
    accountInfo?: Record<string, unknown>;
  }> {
    try {
      // Obtener API key
      const apiKey = await this.getApiKeyForPlatform(platform, '');

      if (!apiKey) {
        return {
          success: false,
          message: `No se encontró API key de GetLate para ${platform}`,
        };
      }

      // Probar conexión con endpoint de accounts
      const response = await axios.get(`${this.GETLATE_API_BASE}/accounts`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      return {
        success: true,
        message: `Conexión exitosa con GetLate API para ${platform}`,
        accountInfo: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: `Error conectando con GetLate: ${error.message}`,
      };
    }
  }
}
