import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { RapidAPIFacebookPost, RapidAPIFacebookPostDocument } from '../../rapidapi-facebook/schemas/rapidapi-facebook-post.schema';
import { ExternalUrl, ExternalUrlDocument } from '../schemas/external-url.schema';
import { NoticiasConfigService } from './noticias-config.service';
import { CacheService } from '../../services/cache.service';
import { PaginationService } from '../../common/services/pagination.service';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { ExternalUrl as IExternalUrl } from '../interfaces/noticias.interfaces';

/**
 * 🔍 Servicio de detección de URLs externas desde posts Facebook
 * Analiza contenido de posts para encontrar enlaces a sitios de noticias
 */
@Injectable()
export class UrlDetectionService {
  private readonly logger = new Logger(UrlDetectionService.name);
  private readonly cachePrefix = 'noticias:urls:';
  private readonly defaultCacheTtl = 600; // 10 minutos

  // Dominios comunes de redes sociales a excluir
  private readonly socialDomains = new Set([
    'facebook.com',
    'twitter.com',
    'x.com',
    'instagram.com',
    'youtube.com',
    'tiktok.com',
    'linkedin.com',
    'whatsapp.com',
    'telegram.org',
    'snapchat.com',
    'reddit.com',
    'pinterest.com',
    'discord.com',
  ]);

  // Extensiones de archivos a excluir
  private readonly excludedExtensions = new Set([
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
    'mp4', 'mp3', 'avi', 'mov', 'wmv', 'flv',
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'zip', 'rar', '7z', 'exe', 'dmg',
  ]);

  constructor(
    @InjectModel(RapidAPIFacebookPost.name)
    private readonly facebookPostModel: Model<RapidAPIFacebookPostDocument>,
    @InjectModel(ExternalUrl.name)
    private readonly externalUrlModel: Model<ExternalUrlDocument>,
    private readonly configService: NoticiasConfigService,
    private readonly cacheService: CacheService,
    private readonly paginationService: PaginationService,
  ) {}

  /**
   * 🔍 Detectar y obtener URLs externas desde posts Facebook
   * Consulta primero desde la BD, detecta nuevas si es necesario
   */
  async detectExternalUrls(
    filters: {
      dateFrom?: Date;
      dateTo?: Date;
      pageId?: string;
      hasConfig?: boolean;
    } = {},
    pagination: { page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<IExternalUrl>> {
    // Primero detectar y guardar nuevas URLs desde Facebook posts
    await this.detectAndSaveNewUrls(filters);

    this.logger.log('Querying external URLs from database');

    try {
      // Construir filtro para consultar URLs guardadas
      const urlFilter: Record<string, unknown> = {};

      if (filters.pageId) {
        urlFilter.pageId = filters.pageId;
      }

      if (filters.hasConfig !== undefined) {
        urlFilter.hasConfig = filters.hasConfig;
      }

      if (filters.dateFrom || filters.dateTo) {
        urlFilter.detectedAt = {} as Record<string, unknown>;
        if (filters.dateFrom) {
          (urlFilter.detectedAt as Record<string, unknown>).$gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          (urlFilter.detectedAt as Record<string, unknown>).$lte = filters.dateTo;
        }
      }

      // Aplicar paginación usando MongoDB
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const skip = (page - 1) * limit;

      // Generar cache key basado en filtros y paginación
      const cacheKey = `external-urls:${JSON.stringify(filters)}:${page}:${limit}`;

      // Consultar URLs desde la base de datos
      const [urls, total] = await Promise.all([
        this.externalUrlModel
          .find(urlFilter)
          .sort({ detectedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        this.externalUrlModel.countDocuments(urlFilter)
      ]);

      // Convertir a formato de interface
      const mappedUrls: IExternalUrl[] = urls.map(url => ({
        url: url.url,
        domain: url.domain,
        facebookPostId: url.facebookPostId,
        pageId: url.pageId,
        postUrl: url.postUrl,
        detectedAt: url.detectedAt,
        hasConfig: url.hasConfig,
        configId: url.configId,
        extractionStatus: url.extractionStatus,
        lastAttemptAt: url.lastAttemptAt,
      }));

      const result: PaginatedResponse<IExternalUrl> = {
        data: mappedUrls,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: skip + limit < total,
          hasPrev: page > 1,
        },
      };

      // Cache solo si no hay filtros de fecha (para evitar cachear datos antiguos)
      if (!filters.dateFrom && !filters.dateTo) {
        await this.cacheService.set(cacheKey, result, this.defaultCacheTtl);
      }

      this.logger.log(`Retrieved ${mappedUrls.length} external URLs from database (total: ${total})`);

      return result;

    } catch (error) {
      this.logger.error(`Failed to retrieve external URLs: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🔍 Detectar y guardar nuevas URLs desde posts de Facebook
   */
  private async detectAndSaveNewUrls(filters: {
    pageId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<void> {
    try {
      // Construir filtro para posts Facebook
      const postFilter: Record<string, unknown> = {};

      if (filters.pageId) {
        postFilter.pageId = filters.pageId;
      }

      if (filters.dateFrom || filters.dateTo) {
        postFilter.publishedAt = {} as Record<string, unknown>;
        if (filters.dateFrom) {
          (postFilter.publishedAt as Record<string, unknown>).$gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          (postFilter.publishedAt as Record<string, unknown>).$lte = filters.dateTo;
        }
      }

      // Obtener posts de Facebook
      const posts = await this.facebookPostModel.find(postFilter)
        .select('_id pageId facebookPostId postUrl content publishedAt extractedAt')
        .lean();

      this.logger.log(`Processing ${posts.length} Facebook posts for URL detection`);

      for (const post of posts) {
        const urls = this.extractUrlsFromPost(post);

        for (const url of urls) {
          const normalizedUrl = this.normalizeUrl(url);
          const domain = this.extractDomain(normalizedUrl);

          // Skip si no es un dominio válido para noticias
          if (!this.isValidNewsDomain(domain)) {
            continue;
          }

          // Verificar si ya existe en la base de datos
          const existingUrl = await this.externalUrlModel.findOne({ url: normalizedUrl });
          if (existingUrl) {
            continue; // Ya existe, skip
          }

          // Verificar si existe configuración para este dominio
          const config = await this.configService.findByDomain(domain);

          // Crear nueva URL externa
          const newExternalUrl = new this.externalUrlModel({
            url: normalizedUrl,
            domain,
            facebookPostId: post.facebookPostId,
            pageId: post.pageId,
            postUrl: post.postUrl,
            detectedAt: new Date(),
            hasConfig: !!config,
            configId: config?._id ? String(config._id) : undefined,
            extractionStatus: 'pending',
            extractionAttempts: 0,
          });

          await newExternalUrl.save();
          this.logger.log(`💾 Saved new external URL: ${normalizedUrl} (domain: ${domain}, hasConfig: ${!!config})`);
        }
      }

    } catch (error) {
      this.logger.error(`Error detecting and saving URLs: ${error.message}`);
      // No throw, continuar con la consulta
    }
  }

  /**
   * 📊 Obtener estadísticas de URLs detectadas
   */
  async getUrlStats(): Promise<{
    totalUrls: number;
    urlsWithConfig: number;
    urlsWithoutConfig: number;
    topDomains: Array<{ domain: string; count: number; hasConfig: boolean }>;
  }> {
    const cacheKey = `${this.cachePrefix}stats`;
    const cached = await this.cacheService.get<ReturnType<UrlDetectionService['getUrlStats']>>(cacheKey);
    if (cached) {
      return cached;
    }

    this.logger.log('Calculating URL detection statistics from database');

    try {
      // Primero asegurar que tenemos URLs detectadas (pero no fallar si hay error)
      try {
        await this.detectAndSaveNewUrls({});
      } catch (detectionError) {
        this.logger.warn(`Failed to detect new URLs during stats calculation: ${detectionError.message}`);
      }

      // Obtener estadísticas desde la base de datos
      const [totalUrls, urlsWithConfig, urlsWithoutConfig] = await Promise.all([
        this.externalUrlModel.countDocuments(),
        this.externalUrlModel.countDocuments({ hasConfig: true }),
        this.externalUrlModel.countDocuments({ hasConfig: false }),
      ]);

      // Calcular top dominios usando agregación de MongoDB
      const domainStats = await this.externalUrlModel.aggregate([
        {
          $group: {
            _id: '$domain',
            count: { $sum: 1 },
            hasConfig: { $max: '$hasConfig' } // true si al menos una URL tiene config
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 10
        },
        {
          $project: {
            domain: '$_id',
            count: 1,
            hasConfig: 1,
            _id: 0
          }
        }
      ]);

      const stats = {
        totalUrls,
        urlsWithConfig,
        urlsWithoutConfig,
        topDomains: domainStats,
      };

      await this.cacheService.set(cacheKey, stats, this.defaultCacheTtl);

      this.logger.log(`URL Stats: ${totalUrls} total, ${urlsWithConfig} with config, ${urlsWithoutConfig} without config`);

      return stats;

    } catch (error) {
      this.logger.error(`Failed to calculate URL stats: ${error.message}`);

      // Devolver estadísticas por defecto en lugar de fallar
      const defaultStats = {
        totalUrls: 0,
        urlsWithConfig: 0,
        urlsWithoutConfig: 0,
        topDomains: [],
      };

      this.logger.warn('Returning default stats due to error');
      return defaultStats;
    }
  }

  /**
   * 🔗 Extraer URLs de un post Facebook
   */
  private extractUrlsFromPost(post: RapidAPIFacebookPostDocument): string[] {
    const urls: string[] = [];

    this.logger.debug(`🔍 Extracting URLs from post ${post.facebookPostId}:`);

    // URLs del contenido de texto
    if (post.content?.text) {
      const textUrls = this.extractUrlsFromText(post.content.text);
      if (textUrls.length > 0) {
        this.logger.debug(`📝 Found ${textUrls.length} URLs in text: ${textUrls.join(', ')}`);
        urls.push(...textUrls);
      } else {
        this.logger.debug(`📝 No URLs found in text: "${post.content.text.substring(0, 100)}..."`);
      }
    }

    // URLs de links directos
    if (post.content?.links) {
      this.logger.debug(`🔗 Found ${post.content.links.length} direct links: ${post.content.links.join(', ')}`);
      urls.push(...post.content.links);
    }

    // URLs de rawData si existen
    if (post.rawData) {
      const rawUrls = this.extractUrlsFromRawData(post.rawData);
      if (rawUrls.length > 0) {
        this.logger.debug(`📦 Found ${rawUrls.length} URLs in rawData: ${rawUrls.join(', ')}`);
        urls.push(...rawUrls);
      }
    }

    const uniqueUrls = [...new Set(urls)]; // Remover duplicados
    this.logger.debug(`✅ Total unique URLs extracted from post ${post.facebookPostId}: ${uniqueUrls.length}`);

    return uniqueUrls;
  }

  /**
   * 📝 Extraer URLs de texto usando regex mejorado
   */
  private extractUrlsFromText(text: string): string[] {
    const urls: string[] = [];

    // Regex principal para URLs completas con protocolo
    const httpRegex = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&=\/]*)/g;
    const httpMatches = text.match(httpRegex);
    if (httpMatches) {
      urls.push(...httpMatches);
    }

    // Regex para URLs sin protocolo pero con www
    const wwwRegex = /(?:^|\s)(www\.[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&=\/]*))/g;
    const wwwMatches = text.match(wwwRegex);
    if (wwwMatches) {
      wwwMatches.forEach(match => {
        const cleanMatch = match.trim();
        if (cleanMatch.startsWith('www.')) {
          urls.push(`https://${cleanMatch}`);
        }
      });
    }

    // Regex para dominios específicos comunes sin protocolo (solo para noticias mexicanas)
    const domainRegex = /(?:^|\s)((?:pachucabrilla|effeta|milenio|excelsior|eluniversal|jornada|reforma|proceso|aristeguinoticias)\.(?:com|info|mx|org)(?:\/[-a-zA-Z0-9@:%_\+.~#?&=\/]*)?)/gi;
    const domainMatches = text.match(domainRegex);
    if (domainMatches) {
      domainMatches.forEach(match => {
        const cleanMatch = match.trim();
        if (!cleanMatch.startsWith('http')) {
          urls.push(`https://${cleanMatch}`);
        }
      });
    }

    // Limpiar y normalizar URLs encontradas
    const cleanUrls = urls
      .map(url => url.trim())
      .filter(url => url.length > 0)
      .map(url => this.cleanUrlFromText(url));

    return [...new Set(cleanUrls)]; // Remover duplicados
  }

  /**
   * 🧹 Limpiar URL extraída del texto (remover caracteres finales no válidos)
   */
  private cleanUrlFromText(url: string): string {
    // Remover caracteres de puntuación al final que no deberían ser parte de la URL
    return url.replace(/[.,;:!?()]+$/, '');
  }

  /**
   * 🔍 Extraer URLs de datos raw de Facebook
   */
  private extractUrlsFromRawData(rawData: Record<string, unknown>): string[] {
    const urls: string[] = [];

    // Buscar recursivamente en el objeto rawData
    const searchForUrls = (obj: unknown, depth = 0): void => {
      // Prevenir recursión infinita
      if (depth > 10) return;

      if (typeof obj === 'string') {
        // Buscar URLs con protocolo
        if (obj.startsWith('http')) {
          urls.push(obj);
        }
        // También extraer URLs del texto si contiene URLs
        else if (obj.includes('http') || obj.includes('www.') || obj.includes('.com') || obj.includes('.mx')) {
          const extractedUrls = this.extractUrlsFromText(obj);
          urls.push(...extractedUrls);
        }
      } else if (Array.isArray(obj)) {
        obj.forEach(item => searchForUrls(item, depth + 1));
      } else if (obj && typeof obj === 'object') {
        Object.values(obj as Record<string, unknown>).forEach(value => searchForUrls(value, depth + 1));
      }
    };

    searchForUrls(rawData);

    // Limpiar y remover duplicados
    return [...new Set(urls.filter(url => url && url.length > 0))];
  }

  /**
   * 🌐 Normalizar URL (remover parámetros tracking, etc.)
   */
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);

      // Remover parámetros de tracking comunes
      const trackingParams = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'fbclid', 'gclid', 'msclkid', 'ref', 'source',
        '_ga', '_gid', '_gac', 'mc_cid', 'mc_eid',
      ];

      trackingParams.forEach(param => {
        urlObj.searchParams.delete(param);
      });

      // Normalizar hostname (remover www)
      urlObj.hostname = urlObj.hostname.replace(/^www\./, '');

      // Remover fragment (hash)
      urlObj.hash = '';

      // Remover trailing slash si no hay path
      if (urlObj.pathname === '/') {
        urlObj.pathname = '';
      }

      return urlObj.toString();
    } catch {
      return url; // Retornar original si falla el parsing
    }
  }

  /**
   * 🏷️ Extraer dominio de URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  }

  /**
   * ✅ Verificar si es dominio válido para noticias
   */
  private isValidNewsDomain(domain: string): boolean {
    if (!domain || domain.length < 4) {
      return false;
    }

    // Excluir redes sociales
    if (this.socialDomains.has(domain)) {
      return false;
    }

    // Excluir extensiones de archivos
    const extension = domain.split('.').pop()?.toLowerCase();
    if (extension && this.excludedExtensions.has(extension)) {
      return false;
    }

    // Excluir dominios muy genéricos
    const genericDomains = [
      'bit.ly', 'tinyurl.com', 'short.link', 'ow.ly',
      'google.com', 'googleapis.com', 'microsoft.com',
      'amazon.com', 'cloudfront.net', 'amazonaws.com',
    ];

    if (genericDomains.includes(domain)) {
      return false;
    }

    // Debe tener al menos un punto (dominio.tld)
    if (!domain.includes('.')) {
      return false;
    }

    return true;
  }

  /**
   * 🧹 Limpiar cache de URLs
   */
  async clearUrlCache(): Promise<void> {
    // En una implementación real, usaríamos pattern matching para limpiar todas las keys
    await this.cacheService.del(`${this.cachePrefix}stats`);
    this.logger.log('URL detection cache cleared');
  }

  /**
   * 🔄 Actualizar estado de extracción para URL
   */
  async updateExtractionStatus(
    url: string,
    status: 'pending' | 'extracted' | 'failed' | 'skipped',
    errorMessage?: string
  ): Promise<void> {
    this.logger.log(`Updating extraction status for ${url}: ${status}`);

    try {
      const updateData: Record<string, unknown> = {
        extractionStatus: status,
        lastAttemptAt: new Date(),
      };

      // Si es un fallo, incrementar intentos y guardar error
      if (status === 'failed') {
        updateData.$inc = { extractionAttempts: 1 };
        if (errorMessage) {
          updateData.lastError = errorMessage;
        }
      }

      // Si es exitoso, limpiar error previo
      if (status === 'extracted') {
        updateData.lastError = null;
      }

      const result = await this.externalUrlModel.updateOne(
        { url },
        updateData
      );

      if (result.matchedCount === 0) {
        this.logger.warn(`No external URL found to update status for: ${url}`);
      } else {
        this.logger.log(`✅ Successfully updated extraction status for ${url}: ${status}`);
      }

      // Limpiar cache relacionado
      await this.clearUrlCache();

    } catch (error) {
      this.logger.error(`Failed to update extraction status for ${url}: ${error.message}`);
      throw error;
    }
  }
}