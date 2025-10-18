import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SitesService } from '../services/sites.service';
import {
  CreateSiteDto,
  UpdateSiteDto,
  SiteResponseDto,
  StatsResponseDto,
} from '../dto/site.dto';

/**
 * 🌐 FASE 7: SitesController - API REST para gestión de Sites
 *
 * Endpoints:
 * - GET    /api/pachuca-noticias/sites - Listar sites
 * - GET    /api/pachuca-noticias/sites/stats - Estadísticas generales
 * - GET    /api/pachuca-noticias/sites/:id - Obtener site
 * - POST   /api/pachuca-noticias/sites - Crear site
 * - PATCH  /api/pachuca-noticias/sites/:id - Actualizar site
 * - DELETE /api/pachuca-noticias/sites/:id - Eliminar site (soft delete)
 */
@Controller('pachuca-noticias/sites')
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  // ========================================
  // GET - LISTAR SITES
  // ========================================

  /**
   * 📋 GET /api/pachuca-noticias/sites
   *
   * Lista todos los sites con filtrado y paginación opcional.
   *
   * Query params:
   * - isActive: boolean (opcional) - Filtrar por estado activo/inactivo
   * - search: string (opcional) - Buscar por nombre, dominio o slug
   * - page: number (opcional, default: 1)
   * - limit: number (opcional, default: 50)
   *
   * @returns { sites: SiteResponseDto[], total: number }
   */
  @Get()
  async findAll(
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ sites: SiteResponseDto[]; total: number }> {
    const filters: {
      isActive?: boolean;
      search?: string;
      page?: number;
      limit?: number;
    } = {};

    // Convertir query params
    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }

    if (search) {
      filters.search = search;
    }

    if (page) {
      filters.page = parseInt(page, 10);
    }

    if (limit) {
      filters.limit = parseInt(limit, 10);
    }

    return this.sitesService.findAll(filters);
  }

  // ========================================
  // GET - ESTADÍSTICAS
  // ========================================

  /**
   * 📊 GET /api/pachuca-noticias/sites/stats
   *
   * Obtiene estadísticas generales del sistema:
   * - Total de agents, sites, noticias, outlets
   * - Stats detallados por cada site (noticias, views, social posts)
   *
   * NOTA: Este endpoint debe ir ANTES de GET /:id para evitar
   * que "stats" se interprete como un ID.
   *
   * @returns StatsResponseDto
   */
  @Get('stats')
  async getStats(): Promise<StatsResponseDto> {
    return this.sitesService.getStats();
  }

  // ========================================
  // GET - OBTENER UN SITE
  // ========================================

  /**
   * 🔍 GET /api/pachuca-noticias/sites/:id
   *
   * Obtiene un site específico por su ID.
   *
   * @param id - ID del site (ObjectId)
   * @returns SiteResponseDto
   * @throws NotFoundException si el site no existe
   * @throws BadRequestException si el ID es inválido
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<SiteResponseDto> {
    return this.sitesService.findOne(id);
  }

  // ========================================
  // POST - CREAR SITE
  // ========================================

  /**
   * ➕ POST /api/pachuca-noticias/sites
   *
   * Crea un nuevo site. Valida que:
   * - El dominio sea único
   * - El slug sea único
   * - Si se marca como main site, desmarca el anterior
   *
   * @param dto - CreateSiteDto con todos los datos del site
   * @returns SiteResponseDto del site creado
   * @throws BadRequestException si el dominio o slug ya existen
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateSiteDto): Promise<SiteResponseDto> {
    return this.sitesService.create(dto);
  }

  // ========================================
  // PATCH - ACTUALIZAR SITE
  // ========================================

  /**
   * ✏️ PATCH /api/pachuca-noticias/sites/:id
   *
   * Actualiza un site existente. Todos los campos son opcionales.
   * Valida unicidad de dominio/slug si se actualizan.
   * Invalida el caché de detección de sites.
   *
   * @param id - ID del site (ObjectId)
   * @param dto - UpdateSiteDto con los campos a actualizar
   * @returns SiteResponseDto del site actualizado
   * @throws NotFoundException si el site no existe
   * @throws BadRequestException si el ID, dominio o slug son inválidos
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSiteDto,
  ): Promise<SiteResponseDto> {
    return this.sitesService.update(id, dto);
  }

  // ========================================
  // DELETE - ELIMINAR SITE
  // ========================================

  /**
   * 🗑️ DELETE /api/pachuca-noticias/sites/:id
   *
   * Elimina un site (soft delete: marca isActive = false).
   * No permite eliminar el site principal.
   * Invalida el caché de detección de sites.
   *
   * @param id - ID del site (ObjectId)
   * @returns { message: string }
   * @throws NotFoundException si el site no existe
   * @throws BadRequestException si se intenta eliminar el main site
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    return this.sitesService.delete(id);
  }
}
