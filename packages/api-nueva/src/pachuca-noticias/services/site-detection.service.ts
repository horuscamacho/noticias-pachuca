import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request } from 'express';
import { Site, SiteDocument } from '../schemas/site.schema';

/**
 * Información del sitio detectado
 */
export interface SiteInfo {
  id: string;
  domain: string;
  slug: string;
  name: string;
  isMainSite: boolean;
  isActive: boolean;
}

/**
 * 🌐 Servicio para detectar el sitio desde el header x-site-domain
 *
 * Similar a PlatformDetectionService pero para sitios multi-tenant
 *
 * Patrón:
 * 1. Lee header 'x-site-domain' del request
 * 2. Busca el sitio en DB (con cache de 5 minutos)
 * 3. Si no encuentra, retorna sitio principal
 * 4. Si no hay sitio principal, lanza error
 */
@Injectable()
export class SiteDetectionService {
  private readonly logger = new Logger(SiteDetectionService.name);
  private cache = new Map<string, { site: SiteInfo; expiresAt: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  constructor(
    @InjectModel(Site.name) private readonly siteModel: Model<SiteDocument>,
  ) {}

  /**
   * Detecta el sitio desde el request
   *
   * @param request - Request de Express
   * @returns SiteInfo con datos del sitio
   */
  async detectSite(request: Request): Promise<SiteInfo> {
    // Leer header x-site-domain
    const siteDomain = request.headers['x-site-domain'] as string | undefined;

    if (!siteDomain) {
      this.logger.debug('No x-site-domain header found, using main site');
      return this.getMainSite();
    }

    // Normalizar domain (lowercase, trim)
    const normalizedDomain = siteDomain.toLowerCase().trim();

    // Revisar cache
    const cached = this.getCachedSite(normalizedDomain);
    if (cached) {
      this.logger.debug(`Cache hit for domain: ${normalizedDomain}`);
      return cached;
    }

    // Buscar sitio en BD
    const site = await this.getSiteByDomain(normalizedDomain);

    if (site) {
      // Cachear resultado
      this.cacheSite(normalizedDomain, site);
      return site;
    }

    // Si no se encuentra, usar sitio principal
    this.logger.warn(`Site not found for domain: ${normalizedDomain}, falling back to main site`);
    return this.getMainSite();
  }

  /**
   * Obtiene sitio por dominio
   */
  async getSiteByDomain(domain: string): Promise<SiteInfo | null> {
    try {
      const site = await this.siteModel
        .findOne({ domain, isActive: true })
        .select('_id domain slug name isMainSite isActive')
        .lean();

      if (!site) {
        return null;
      }

      return {
        id: site._id.toString(),
        domain: site.domain,
        slug: site.slug,
        name: site.name,
        isMainSite: site.isMainSite,
        isActive: site.isActive,
      };
    } catch (error) {
      this.logger.error(`Error fetching site by domain ${domain}:`, error);
      return null;
    }
  }

  /**
   * Obtiene el sitio principal (fallback)
   */
  async getMainSite(): Promise<SiteInfo> {
    const cacheKey = '__main_site__';

    // Revisar cache
    const cached = this.getCachedSite(cacheKey);
    if (cached) {
      return cached;
    }

    // Buscar en BD
    const mainSite = await this.siteModel
      .findOne({ isMainSite: true, isActive: true })
      .select('_id domain slug name isMainSite isActive')
      .lean();

    if (!mainSite) {
      throw new Error(
        'No main site found. Please run: npm run seed:sites'
      );
    }

    const siteInfo: SiteInfo = {
      id: mainSite._id.toString(),
      domain: mainSite.domain,
      slug: mainSite.slug,
      name: mainSite.name,
      isMainSite: mainSite.isMainSite,
      isActive: mainSite.isActive,
    };

    // Cachear
    this.cacheSite(cacheKey, siteInfo);

    return siteInfo;
  }

  /**
   * Invalida cache de un dominio específico
   */
  invalidateCache(domain: string): void {
    const normalizedDomain = domain.toLowerCase().trim();
    this.cache.delete(normalizedDomain);
    this.logger.debug(`Cache invalidated for domain: ${normalizedDomain}`);
  }

  /**
   * Invalida todo el cache
   */
  invalidateAllCache(): void {
    this.cache.clear();
    this.logger.debug('All cache invalidated');
  }

  // ========================================
  // MÉTODOS PRIVADOS DE CACHE
  // ========================================

  private getCachedSite(key: string): SiteInfo | null {
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Verificar si expiró
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.site;
  }

  private cacheSite(key: string, site: SiteInfo): void {
    this.cache.set(key, {
      site,
      expiresAt: Date.now() + this.CACHE_TTL,
    });
  }
}
