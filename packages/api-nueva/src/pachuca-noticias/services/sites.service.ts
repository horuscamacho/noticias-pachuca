import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Site, SiteDocument } from '../schemas/site.schema';
import { ContentAgent, ContentAgentDocument } from '../../content-ai/schemas/content-agent.schema';
import { PublishedNoticia, PublishedNoticiaDocument } from '../schemas/published-noticia.schema';
import { NewsWebsiteConfig, NewsWebsiteConfigDocument } from '../../generator-pro/schemas/news-website-config.schema';
import { SiteDetectionService } from './site-detection.service';
import {
  CreateSiteDto,
  UpdateSiteDto,
  SiteResponseDto,
  StatsResponseDto,
} from '../dto/site.dto';

/**
 * 🌐 FASE 7: SitesService - Gestión de Sites
 */

@Injectable()
export class SitesService {
  constructor(
    @InjectModel(Site.name)
    private readonly siteModel: Model<SiteDocument>,

    @InjectModel(ContentAgent.name)
    private readonly contentAgentModel: Model<ContentAgentDocument>,

    @InjectModel(PublishedNoticia.name)
    private readonly publishedNoticiaModel: Model<PublishedNoticiaDocument>,

    @InjectModel(NewsWebsiteConfig.name)
    private readonly newsWebsiteConfigModel: Model<NewsWebsiteConfigDocument>,

    private readonly siteDetectionService: SiteDetectionService,
  ) {}

  // ========================================
  // MAPPERS & HELPERS
  // ========================================

  /**
   * Mapea un SiteDocument a SiteResponseDto (SIMPLIFICADO)
   */
  private mapToResponseDto(site: SiteDocument): SiteResponseDto {
    return {
      id: (site._id as Types.ObjectId).toString(),
      domain: site.domain,
      slug: site.slug,
      name: site.name,
      description: site.description,

      socialMedia: site.socialMedia
        ? {
            facebookPages: site.socialMedia.facebookPages?.map(page => ({
              pageId: page.pageId,
              pageName: page.pageName,
              publishingConfigId: page.publishingConfigId?.toString(),
              isActive: page.isActive,
              priority: page.priority,
            })),
            twitterAccounts: site.socialMedia.twitterAccounts?.map(account => ({
              accountId: account.accountId,
              username: account.username,
              displayName: account.displayName,
              publishingConfigId: account.publishingConfigId?.toString(),
              isActive: account.isActive,
              priority: account.priority,
            })),
            getLateApiKey: site.socialMedia.getLateApiKey,
          }
        : undefined,

      isActive: site.isActive,
      isMainSite: site.isMainSite,

      totalNoticias: site.totalNoticias || 0,
      totalViews: site.totalViews || 0,
      totalSocialPosts: site.totalSocialPosts || 0,

      createdAt: site.createdAt,
      updatedAt: site.updatedAt,
    };
  }

  /**
   * Genera un slug único a partir del domain
   * Ejemplo: "noticiaspachuca.com" → "noticiaspachuca"
   */
  private generateSlugFromDomain(domain: string): string {
    // Remover https://, http://, www.
    let slug = domain
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '');

    // Tomar solo el nombre principal (antes del primer punto)
    const parts = slug.split('.');
    slug = parts[0];

    // Limpiar caracteres especiales
    slug = slug.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    return slug;
  }

  // ========================================
  // CRUD OPERATIONS
  // ========================================

  /**
   * 📋 Obtener todos los sites con filtrado y paginación opcional
   */
  async findAll(filters?: {
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ sites: SiteResponseDto[]; total: number }> {
    const query: Record<string, unknown> = {};

    // Filtro por estado
    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    // Búsqueda por nombre o dominio
    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { domain: { $regex: filters.search, $options: 'i' } },
        { slug: { $regex: filters.search, $options: 'i' } },
      ];
    }

    // Paginación
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const [sites, total] = await Promise.all([
      this.siteModel
        .find(query)
        .sort({ isMainSite: -1, name: 1 }) // Main site primero, luego alfabético
        .skip(skip)
        .limit(limit)
        .exec(),
      this.siteModel.countDocuments(query),
    ]);

    return {
      sites: sites.map((site) => this.mapToResponseDto(site)),
      total,
    };
  }

  /**
   * 🔍 Obtener un site por ID
   */
  async findOne(id: string): Promise<SiteResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de site inválido');
    }

    const site = await this.siteModel.findById(id).exec();

    if (!site) {
      throw new NotFoundException(`Site con ID ${id} no encontrado`);
    }

    return this.mapToResponseDto(site);
  }

  /**
   * ➕ Crear un nuevo site (SIMPLIFICADO)
   */
  async create(dto: CreateSiteDto): Promise<SiteResponseDto> {
    // Normalizar domain
    const normalizedDomain = dto.domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');

    // Generar slug automáticamente desde el domain
    const generatedSlug = this.generateSlugFromDomain(normalizedDomain);

    // Validar que el dominio no exista
    const existingByDomain = await this.siteModel.findOne({ domain: normalizedDomain }).exec();

    if (existingByDomain) {
      throw new BadRequestException(`Ya existe un site con el dominio "${normalizedDomain}"`);
    }

    // Validar que el slug no exista (asegurar unicidad)
    let finalSlug = generatedSlug;
    let slugCounter = 1;
    let existingBySlug = await this.siteModel.findOne({ slug: finalSlug }).exec();

    while (existingBySlug) {
      finalSlug = `${generatedSlug}-${slugCounter}`;
      existingBySlug = await this.siteModel.findOne({ slug: finalSlug }).exec();
      slugCounter++;
    }

    // Si se marca como main site, desmarcar el anterior
    if (dto.isMainSite) {
      await this.siteModel.updateMany({ isMainSite: true }, { isMainSite: false });
    }

    // Crear el site con campos simplificados
    const site = new this.siteModel({
      domain: normalizedDomain,
      slug: finalSlug,
      name: dto.name,
      description: dto.description,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      isMainSite: dto.isMainSite || false,
      socialMedia: {}, // Se agrega en FASE 13
      totalNoticias: 0,
      totalViews: 0,
      totalSocialPosts: 0,
    });

    await site.save();

    // Invalidar caché del servicio de detección
    this.siteDetectionService.invalidateAllCache();

    return this.mapToResponseDto(site);
  }

  /**
   * ✏️ Actualizar un site existente (SIMPLIFICADO)
   */
  async update(id: string, dto: UpdateSiteDto): Promise<SiteResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de site inválido');
    }

    const site = await this.siteModel.findById(id).exec();

    if (!site) {
      throw new NotFoundException(`Site con ID ${id} no encontrado`);
    }

    // Validar dominio único (si se está actualizando)
    if (dto.domain) {
      const normalizedDomain = dto.domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');

      if (normalizedDomain !== site.domain) {
        const existingByDomain = await this.siteModel
          .findOne({
            domain: normalizedDomain,
            _id: { $ne: site._id },
          })
          .exec();

        if (existingByDomain) {
          throw new BadRequestException(`Ya existe un site con el dominio "${normalizedDomain}"`);
        }

        // Si se actualiza el domain, regenerar el slug
        const newSlug = this.generateSlugFromDomain(normalizedDomain);
        site.domain = normalizedDomain;
        site.slug = newSlug;
      }
    }

    // Si se marca como main site, desmarcar el anterior
    if (dto.isMainSite && !site.isMainSite) {
      await this.siteModel.updateMany(
        { isMainSite: true, _id: { $ne: site._id } },
        { isMainSite: false },
      );
    }

    // Aplicar actualizaciones de campos permitidos
    if (dto.name) site.name = dto.name;
    if (dto.description) site.description = dto.description;
    if (dto.isMainSite !== undefined) site.isMainSite = dto.isMainSite;
    if (dto.isActive !== undefined) site.isActive = dto.isActive;

    // FASE 13: Mapear socialMedia de DTO a Schema con tipos correctos
    if (dto.socialMedia) {
      site.socialMedia = {
        facebookPages: dto.socialMedia.facebookPages?.map(page => ({
          pageId: page.pageId,
          pageName: page.pageName,
          publishingConfigId: page.publishingConfigId ? new Types.ObjectId(page.publishingConfigId) : undefined,
          isActive: page.isActive,
          priority: page.priority,
        })),
        twitterAccounts: dto.socialMedia.twitterAccounts?.map(account => ({
          accountId: account.accountId,
          username: account.username,
          displayName: account.displayName,
          publishingConfigId: account.publishingConfigId ? new Types.ObjectId(account.publishingConfigId) : undefined,
          isActive: account.isActive,
          priority: account.priority,
        })),
        getLateApiKey: dto.socialMedia.getLateApiKey,
      };
    }

    await site.save();

    // Invalidar caché del servicio de detección
    this.siteDetectionService.invalidateAllCache();

    return this.mapToResponseDto(site);
  }

  /**
   * 🗑️ Eliminar un site (soft delete)
   */
  async delete(id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de site inválido');
    }

    const site = await this.siteModel.findById(id).exec();

    if (!site) {
      throw new NotFoundException(`Site con ID ${id} no encontrado`);
    }

    // No permitir eliminar el main site
    if (site.isMainSite) {
      throw new BadRequestException('No se puede eliminar el site principal');
    }

    // Soft delete: marcar como inactivo
    site.isActive = false;
    await site.save();

    // Invalidar caché del servicio de detección
    this.siteDetectionService.invalidateAllCache();

    return {
      message: `Site "${site.name}" desactivado correctamente`,
    };
  }

  // ========================================
  // STATISTICS
  // ========================================

  /**
   * 📊 Obtener estadísticas generales
   */
  async getStats(): Promise<StatsResponseDto> {
    const [totalSites, totalAgents, totalNoticias, totalOutlets] = await Promise.all([
      this.siteModel.countDocuments({ isActive: true }),
      this.contentAgentModel.countDocuments({ isActive: true }),
      this.publishedNoticiaModel.countDocuments({ status: 'published' }),
      this.newsWebsiteConfigModel.countDocuments({ isActive: true }),
    ]);

    // Obtener stats detallados por sitio
    const sites = await this.siteModel.find({ isActive: true }).exec();

    const siteStats = await Promise.all(
      sites.map(async (site) => {
        const siteObjectId = site._id;

        const [totalNoticias, totalSocialPosts] = await Promise.all([
          this.publishedNoticiaModel.countDocuments({
            sites: siteObjectId,
            status: 'published',
          }),
          // TODO: Implementar conteo de social posts cuando exista el modelo
          Promise.resolve(0),
        ]);

        return {
          siteId: (site._id as Types.ObjectId).toString(),
          siteName: site.name,
          totalNoticias,
          totalViews: 0, // TODO: Implementar cuando exista analytics
          totalSocialPosts,
        };
      }),
    );

    return {
      totalAgents,
      totalSites,
      totalNoticias,
      totalOutlets,
      siteStats,
    };
  }
}
