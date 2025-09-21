import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { MonitoredFacebookPage, MonitoredFacebookPageDocument } from '../schemas/monitored-facebook-page.schema';
import { PaginationService } from '../../common/services/pagination.service';
import { CacheService } from '../../services/cache.service';
import { FacebookService } from '../../facebook/services/facebook.service';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';

import {
  CreateFacebookPageDto,
  UpdateFacebookPageDto,
  FacebookPageListDto,
  CreateFacebookPageFromUrlDto
} from '../dto/facebook-page-management.dto';

@Injectable()
export class FacebookPageManagementService {
  private readonly logger = new Logger(FacebookPageManagementService.name);

  constructor(
    @InjectModel(MonitoredFacebookPage.name)
    private readonly pageModel: Model<MonitoredFacebookPageDocument>,
    private readonly paginationService: PaginationService,
    private readonly cacheService: CacheService,
    private readonly facebookService: FacebookService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * 📋 CREAR NUEVA PÁGINA MONITOREADA
   */
  async createPage(createPageDto: CreateFacebookPageDto): Promise<MonitoredFacebookPageDocument> {
    this.logger.log(`Creating new monitored page: ${createPageDto.pageId}`);

    // Verificar si la página ya existe
    const existingPage = await this.pageModel.findOne({ pageId: createPageDto.pageId });
    if (existingPage) {
      throw new ConflictException(`Page with ID ${createPageDto.pageId} is already being monitored`);
    }

    // Verificar acceso a la página con Facebook API
    try {
      const pageData = await this.facebookService.verifyPageAccess(createPageDto.pageId);
      if (!pageData) {
        throw new BadRequestException(`Cannot access Facebook page ${createPageDto.pageId}. Page may be private or invalid.`);
      }

      this.logger.log(`Page verification successful for ${createPageDto.pageId}`);

    } catch (error) {
      this.logger.error(`Failed to verify Facebook page access: ${error.message}`);
      throw new BadRequestException(`Cannot verify Facebook page access: ${error.message}`);
    }

    // Crear página en base de datos
    const newPage = new this.pageModel({
      ...createPageDto,
      lastExtraction: null,
      totalExtractions: 0,
      extractionConfig: createPageDto.extractionConfig || {
        maxPosts: 50,
        frequency: 'manual',
        fields: ['message', 'created_time', 'likes', 'shares', 'comments']
      }
    });

    const savedPage = await newPage.save();

    // Limpiar cache relacionado
    await this.clearPageListCache();

    // Emitir evento
    this.eventEmitter.emit('facebook.page.created', {
      pageId: savedPage.pageId,
      pageName: savedPage.pageName,
      userId: 'system' // TODO: obtener del contexto de autenticación
    });

    this.logger.log(`Successfully created monitored page: ${savedPage.pageId}`);
    return savedPage;
  }

  /**
   * 🔗 CREAR PÁGINA MONITOREADA DESDE URL
   * Obtiene información desde URL y crea página automáticamente
   */
  async createPageFromUrl(createFromUrlDto: CreateFacebookPageFromUrlDto): Promise<MonitoredFacebookPageDocument> {
    this.logger.log(`Creating page from URL: ${createFromUrlDto.pageUrl}`);

    try {
      // 1. Obtener información de la página desde URL usando servicio principal
      const pageInfo = await this.facebookService.getPageIdFromUrl(createFromUrlDto.pageUrl);

      this.logger.log(`Page info retrieved: ${pageInfo.pageName} (${pageInfo.pageId})`);

      // 2. Verificar si la página ya está siendo monitoreada
      const existingPage = await this.pageModel.findOne({ pageId: pageInfo.pageId });
      if (existingPage) {
        throw new ConflictException(
          `Page "${pageInfo.pageName}" (${pageInfo.pageId}) is already being monitored`
        );
      }

      // 3. Crear DTO para el método estándar de creación
      const createPageDto: CreateFacebookPageDto = {
        pageId: pageInfo.pageId,
        pageName: pageInfo.pageName,
        category: pageInfo.category,
        isActive: createFromUrlDto.isActive ?? true,
        extractionConfig: createFromUrlDto.extractionConfig
      };

      // 4. Usar el método existente createPage() que ya tiene toda la validación
      const createdPage = await this.createPage(createPageDto);

      this.logger.log(`Successfully created page from URL: ${pageInfo.pageName} (${pageInfo.pageId})`);

      // 5. Emitir evento para notificaciones
      this.eventEmitter.emit('facebook.page.created', {
        pageId: pageInfo.pageId,
        pageName: pageInfo.pageName,
        source: 'url',
        url: createFromUrlDto.pageUrl
      });

      return createdPage;

    } catch (error) {
      this.logger.error(`Failed to create page from URL: ${createFromUrlDto.pageUrl}`, error);

      // Re-lanzar errores conocidos
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }

      // Otros errores como errores generales
      throw new BadRequestException(
        `Failed to create page from URL: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 📋 OBTENER LISTA PAGINADA DE PÁGINAS
   */
  async getPages(listDto: FacebookPageListDto): Promise<PaginatedResponse<MonitoredFacebookPageDocument>> {
    this.logger.log(`Getting paginated pages list with filters: ${JSON.stringify(listDto)}`);

    // Generar cache key
    const cacheKey = `facebook:pages:list:${this.generateCacheKey(listDto)}`;

    // Intentar obtener del cache
    const cachedResult = await this.cacheService.get<PaginatedResponse<MonitoredFacebookPageDocument>>(cacheKey);
    if (cachedResult) {
      this.logger.log(`Returning cached pages list`);
      return cachedResult;
    }

    // Construir filtros
    const filter: Record<string, unknown> = {};

    if (listDto.isActive !== undefined) {
      filter.isActive = listDto.isActive;
    }

    if (listDto.category) {
      filter.category = new RegExp(listDto.category, 'i');
    }

    if (listDto.search) {
      filter.pageName = new RegExp(listDto.search, 'i');
    }

    // Configurar ordenamiento
    const sortField = listDto.sortBy || 'createdAt';
    const sortDirection: 1 | -1 = listDto.sortOrder === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortDirection };

    // Ejecutar consulta paginada
    const result = await this.paginationService.paginate(
      this.pageModel,
      listDto,
      filter,
      { sort }
    );

    // Cachear resultado
    await this.cacheService.set(cacheKey, result, 60); // TTL 60 segundos

    this.logger.log(`Returning ${result.data.length} pages from ${result.pagination.total} total`);
    return result;
  }

  /**
   * 📋 OBTENER PÁGINA POR ID
   */
  async getPageById(pageId: string): Promise<MonitoredFacebookPageDocument> {
    this.logger.log(`Getting page by ID: ${pageId}`);

    const cacheKey = `facebook:page:${pageId}`;

    // Intentar cache primero
    const cachedPage = await this.cacheService.get<MonitoredFacebookPageDocument>(cacheKey);
    if (cachedPage) {
      return cachedPage;
    }

    const page = await this.pageModel.findOne({ pageId });
    if (!page) {
      throw new NotFoundException(`Monitored page with ID ${pageId} not found`);
    }

    // Cachear página
    await this.cacheService.set(cacheKey, page, 300); // TTL 5 minutos

    return page;
  }

  /**
   * 📋 ACTUALIZAR PÁGINA
   */
  async updatePage(pageId: string, updateDto: UpdateFacebookPageDto): Promise<MonitoredFacebookPageDocument> {
    this.logger.log(`Updating page: ${pageId}`);

    const page = await this.getPageById(pageId);

    // Aplicar actualizaciones
    Object.assign(page, updateDto);

    const updatedPage = await page.save();

    // Limpiar caches
    await this.clearPageCache(pageId);
    await this.clearPageListCache();

    // Emitir evento
    this.eventEmitter.emit('facebook.page.updated', {
      pageId: updatedPage.pageId,
      pageName: updatedPage.pageName,
      changes: updateDto,
      userId: 'system' // TODO: obtener del contexto
    });

    this.logger.log(`Successfully updated page: ${pageId}`);
    return updatedPage;
  }

  /**
   * 📋 ELIMINAR PÁGINA
   */
  async deletePage(pageId: string): Promise<void> {
    this.logger.log(`Deleting page: ${pageId}`);

    const page = await this.getPageById(pageId);

    await this.pageModel.deleteOne({ pageId });

    // Limpiar caches
    await this.clearPageCache(pageId);
    await this.clearPageListCache();

    // Emitir evento
    this.eventEmitter.emit('facebook.page.deleted', {
      pageId: page.pageId,
      pageName: page.pageName,
      userId: 'system' // TODO: obtener del contexto
    });

    this.logger.log(`Successfully deleted page: ${pageId}`);
  }

  /**
   * 📋 OBTENER PÁGINAS ACTIVAS
   */
  async getActivePages(): Promise<MonitoredFacebookPageDocument[]> {
    this.logger.log('Getting all active pages');

    const cacheKey = 'facebook:pages:active';

    const cachedPages = await this.cacheService.get<MonitoredFacebookPageDocument[]>(cacheKey);
    if (cachedPages) {
      return cachedPages;
    }

    const activePages = await this.pageModel
      .find({ isActive: true })
      .sort({ pageName: 1 })
      .exec();

    await this.cacheService.set(cacheKey, activePages, 180); // TTL 3 minutos

    this.logger.log(`Found ${activePages.length} active pages`);
    return activePages;
  }

  /**
   * 📋 OBTENER PÁGINAS QUE NECESITAN EXTRACCIÓN
   */
  async getPagesNeedingExtraction(): Promise<MonitoredFacebookPageDocument[]> {
    this.logger.log('Getting pages that need extraction');

    const activePages = await this.getActivePages();

    const pagesNeedingExtraction = activePages.filter(page => {
      if (!page.isActive) return false;
      if (!page.extractionConfig || page.extractionConfig.frequency === 'manual') return false;

      if (!page.lastExtraction) return true;

      const now = new Date();
      const diffHours = (now.getTime() - page.lastExtraction.getTime()) / (1000 * 60 * 60);

      switch (page.extractionConfig.frequency) {
        case 'daily':
          return diffHours >= 24;
        case 'weekly':
          return diffHours >= 168; // 24 * 7
        default:
          return false;
      }
    });

    this.logger.log(`Found ${pagesNeedingExtraction.length} pages needing extraction`);
    return pagesNeedingExtraction;
  }

  /**
   * 📋 ACTUALIZAR ESTADÍSTICAS DE EXTRACCIÓN
   */
  async updateExtractionStats(pageId: string, postsExtracted: number): Promise<void> {
    this.logger.log(`Updating extraction stats for page: ${pageId}, posts: ${postsExtracted}`);

    const page = await this.getPageById(pageId);

    // Actualizar estadísticas manualmente
    page.lastExtraction = new Date();
    page.totalExtractions += 1;

    await page.save();

    // Limpiar cache
    await this.clearPageCache(pageId);

    this.eventEmitter.emit('facebook.page.extraction.completed', {
      pageId: page.pageId,
      pageName: page.pageName,
      postsExtracted,
      totalExtractions: page.totalExtractions
    });

    this.logger.log(`Updated extraction stats for page: ${pageId}`);
  }

  /**
   * 📋 OBTENER ESTADÍSTICAS GENERALES
   */
  async getGeneralStats(): Promise<{
    totalPages: number;
    activePages: number;
    inactivePages: number;
    totalExtractions: number;
    pagesNeedingExtraction: number;
  }> {
    this.logger.log('Getting general statistics');

    const cacheKey = 'facebook:pages:stats';

    const cachedStats = await this.cacheService.get<Record<string, number>>(cacheKey);
    if (cachedStats) {
      return cachedStats as {
        totalPages: number;
        activePages: number;
        inactivePages: number;
        totalExtractions: number;
        pagesNeedingExtraction: number;
      };
    }

    const [
      totalPages,
      activePages,
      inactivePages,
      extractionStats,
      pagesNeedingExtraction
    ] = await Promise.all([
      this.pageModel.countDocuments({}),
      this.pageModel.countDocuments({ isActive: true }),
      this.pageModel.countDocuments({ isActive: false }),
      this.pageModel.aggregate([
        { $group: { _id: null, totalExtractions: { $sum: '$totalExtractions' } } }
      ]),
      this.getPagesNeedingExtraction()
    ]);

    const stats = {
      totalPages,
      activePages,
      inactivePages,
      totalExtractions: extractionStats[0]?.totalExtractions || 0,
      pagesNeedingExtraction: pagesNeedingExtraction.length
    };

    await this.cacheService.set(cacheKey, stats, 300); // TTL 5 minutos

    this.logger.log(`General stats: ${JSON.stringify(stats)}`);
    return stats;
  }

  /**
   * 🔧 MÉTODOS HELPER PRIVADOS
   */
  private generateCacheKey(listDto: FacebookPageListDto): string {
    const keyParts = [
      `page:${listDto.page || 1}`,
      `limit:${listDto.limit || 10}`,
      `active:${listDto.isActive || 'all'}`,
      `category:${listDto.category || 'all'}`,
      `search:${listDto.search || 'none'}`,
      `sort:${listDto.sortBy || 'createdAt'}:${listDto.sortOrder || 'desc'}`
    ];

    return Buffer.from(keyParts.join('|')).toString('base64').slice(0, 32);
  }

  private async clearPageCache(pageId: string): Promise<void> {
    await this.cacheService.del(`facebook:page:${pageId}`);
  }

  private async clearPageListCache(): Promise<void> {
    // En un entorno de producción, usarías pattern matching para eliminar múltiples keys
    // Por ahora, limpiamos las caches más comunes
    const commonCacheKeys = [
      'facebook:pages:active',
      'facebook:pages:stats'
    ];

    for (const key of commonCacheKeys) {
      await this.cacheService.del(key);
    }
  }
}