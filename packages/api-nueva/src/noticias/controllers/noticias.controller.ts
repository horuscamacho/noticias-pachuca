import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

import { NoticiasConfigService } from '../services/noticias-config.service';
import { NoticiasExtractionService } from '../services/noticias-extraction.service';
import { UrlDetectionService } from '../services/url-detection.service';
import { CreateNoticiasConfigDto, UpdateNoticiasConfigDto, TestExtractionDto, TestSelectorsDto } from '../dto/noticias-config.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { NoticiasExtractionConfigDocument } from '../schemas/noticias-extraction-config.schema';
import { ExtractedNoticiaDocument } from '../schemas/extracted-noticia.schema';
import { NoticiasExtractionJobDocument } from '../schemas/noticias-extraction-job.schema';
import {
  ExternalUrl,
  NoticiasFilter,
  NoticiasPaginationOptions,
  ExtractionStats,
  TestExtractionResponse,
} from '../interfaces/noticias.interfaces';

/**
 * 🎯 Controller principal del módulo Noticias
 * Gestiona URLs externas, configuraciones y extracciones de contenido
 */
@ApiTags('Noticias')
@ApiBearerAuth()
@Controller('noticias')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class NoticiasController {
  constructor(
    private readonly configService: NoticiasConfigService,
    private readonly extractionService: NoticiasExtractionService,
    private readonly urlDetectionService: UrlDetectionService,
  ) {}

  // ============================================================================
  // 🔍 DETECCIÓN DE URLs EXTERNAS
  // ============================================================================

  @Get('external-urls')
  @ApiOperation({
    summary: 'Detectar URLs externas desde posts Facebook',
    description: 'Analiza posts de Facebook para encontrar enlaces a sitios de noticias'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Límite por página (default: 10)' })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, description: 'Fecha desde (ISO)' })
  @ApiQuery({ name: 'dateTo', required: false, type: String, description: 'Fecha hasta (ISO)' })
  @ApiQuery({ name: 'pageId', required: false, type: String, description: 'ID de página Facebook' })
  @ApiQuery({ name: 'hasConfig', required: false, type: Boolean, description: 'Solo URLs con configuración' })
  @ApiResponse({ status: 200, description: 'URLs externas detectadas con paginación' })
  async getExternalUrls(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('pageId') pageId?: string,
    @Query('hasConfig') hasConfig?: boolean,
  ): Promise<PaginatedResponse<ExternalUrl>> {
    const filters = {
      ...(dateFrom && { dateFrom: new Date(dateFrom) }),
      ...(dateTo && { dateTo: new Date(dateTo) }),
      ...(pageId && { pageId }),
      ...(hasConfig !== undefined && { hasConfig }),
    };

    const pagination = {
      page: page || 1,
      limit: limit || 10,
    };

    return await this.urlDetectionService.detectExternalUrls(filters, pagination);
  }

  @Get('external-urls/stats')
  @ApiOperation({
    summary: 'Estadísticas de URLs detectadas',
    description: 'Obtiene métricas sobre URLs detectadas y configuraciones'
  })
  @ApiResponse({ status: 200, description: 'Estadísticas de detección de URLs' })
  async getUrlStats() {
    return await this.urlDetectionService.getUrlStats();
  }

  // ============================================================================
  // ⚙️ CONFIGURACIONES DE EXTRACCIÓN
  // ============================================================================

  @Get('configs')
  @ApiOperation({
    summary: 'Listar configuraciones de extracción',
    description: 'Obtiene todas las configuraciones con paginación y filtros'
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Lista paginada de configuraciones' })
  async getConfigs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('isActive') isActive?: boolean,
  ): Promise<PaginatedResponse<NoticiasExtractionConfigDocument>> {
    return await this.configService.findAll(page, limit, isActive);
  }

  @Get('configs/:id')
  @ApiOperation({
    summary: 'Obtener configuración por ID',
    description: 'Devuelve una configuración específica con todos sus detalles'
  })
  @ApiResponse({ status: 200, description: 'Configuración encontrada' })
  @ApiResponse({ status: 404, description: 'Configuración no encontrada' })
  async getConfigById(@Param('id') id: string): Promise<NoticiasExtractionConfigDocument> {
    return await this.configService.findById(id);
  }

  @Get('configs/domain/:domain')
  @ApiOperation({
    summary: 'Obtener configuración por dominio',
    description: 'Busca configuración activa para un dominio específico'
  })
  @ApiResponse({ status: 200, description: 'Configuración del dominio' })
  @ApiResponse({ status: 404, description: 'No hay configuración activa para este dominio' })
  async getConfigByDomain(@Param('domain') domain: string): Promise<NoticiasExtractionConfigDocument | null> {
    return await this.configService.findByDomain(domain);
  }

  @Post('configs')
  @ApiOperation({
    summary: 'Crear nueva configuración',
    description: 'Crea configuración de extracción para un dominio'
  })
  @ApiResponse({ status: 201, description: 'Configuración creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Ya existe configuración para este dominio' })
  async createConfig(@Body() createDto: CreateNoticiasConfigDto): Promise<NoticiasExtractionConfigDocument> {
    return await this.configService.create(createDto);
  }

  @Put('configs/:id')
  @ApiOperation({
    summary: 'Actualizar configuración',
    description: 'Modifica una configuración existente'
  })
  @ApiResponse({ status: 200, description: 'Configuración actualizada' })
  @ApiResponse({ status: 404, description: 'Configuración no encontrada' })
  async updateConfig(
    @Param('id') id: string,
    @Body() updateDto: UpdateNoticiasConfigDto,
  ): Promise<NoticiasExtractionConfigDocument> {
    return await this.configService.update(id, updateDto);
  }

  @Put('configs/:id/toggle')
  @ApiOperation({
    summary: 'Activar/desactivar configuración',
    description: 'Cambia el estado activo de la configuración'
  })
  @ApiResponse({ status: 200, description: 'Estado cambiado' })
  async toggleConfig(@Param('id') id: string): Promise<NoticiasExtractionConfigDocument> {
    return await this.configService.toggleActive(id);
  }

  @Delete('configs/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar configuración',
    description: 'Elimina permanentemente una configuración'
  })
  @ApiResponse({ status: 204, description: 'Configuración eliminada' })
  @ApiResponse({ status: 404, description: 'Configuración no encontrada' })
  async deleteConfig(@Param('id') id: string): Promise<void> {
    return await this.configService.delete(id);
  }

  @Post('configs/test-extraction')
  @ApiOperation({
    summary: 'Probar extracción',
    description: 'Prueba selectores CSS contra una URL específica'
  })
  @ApiResponse({ status: 200, description: 'Resultado de la prueba de extracción' })
  async testExtraction(@Body() testDto: TestExtractionDto): Promise<TestExtractionResponse> {
    return await this.configService.testExtraction(testDto);
  }

  @Post('test-selectors')
  @ApiOperation({
    summary: 'Playground de selectores CSS',
    description: 'Prueba selectores CSS personalizados contra cualquier URL sin configuración en BD'
  })
  @ApiResponse({ status: 200, description: 'Resultado del testing de selectores' })
  async testSelectorsPlayground(@Body() testDto: TestSelectorsDto): Promise<TestExtractionResponse> {
    return await this.configService.testSelectorsPlayground(testDto);
  }

  // ============================================================================
  // 🚀 EXTRACCIÓN DE CONTENIDO
  // ============================================================================

  @Post('extract/:configId')
  @ApiOperation({
    summary: 'Trigger extracción individual',
    description: 'Inicia extracción de contenido para una URL específica'
  })
  @ApiResponse({ status: 200, description: 'Job de extracción creado' })
  async extractSingleUrl(
    @Param('configId') configId: string,
    @Body() extractionData: {
      url: string;
      facebookPostId: string;
      pageId?: string;
      priority?: number;
      forceReExtraction?: boolean;
    },
  ): Promise<{ jobId: string; message: string }> {
    return await this.extractionService.extractSingleUrl(
      extractionData.url,
      configId,
      extractionData.facebookPostId,
      {
        pageId: extractionData.pageId,
        priority: extractionData.priority,
        forceReExtraction: extractionData.forceReExtraction,
      },
    );
  }

  @Post('extract/domain/:domain')
  @ApiOperation({
    summary: 'Extracción en lote por dominio',
    description: 'Inicia extracción masiva de URLs de un dominio'
  })
  @ApiResponse({ status: 200, description: 'Batch job creado' })
  async extractByDomain(
    @Param('domain') domain: string,
    @Body() options: {
      limit?: number;
      priority?: number;
      forceReExtraction?: boolean;
    } = {},
  ): Promise<{ batchId: string; totalJobs: number; message: string }> {
    return await this.extractionService.extractByDomain(domain, options);
  }

  @Get('extracted')
  @ApiOperation({
    summary: 'Listar noticias extraídas',
    description: 'Obtiene contenido extraído con filtros y paginación'
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'domain', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'facebookPostId', required: false, type: String })
  @ApiQuery({ name: 'pageId', required: false, type: String })
  @ApiQuery({ name: 'hasImages', required: false, type: Boolean })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  @ApiQuery({ name: 'searchText', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Noticias extraídas con paginación' })
  async getExtractedNoticias(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('domain') domain?: string,
    @Query('status') status?: string,
    @Query('facebookPostId') facebookPostId?: string,
    @Query('pageId') pageId?: string,
    @Query('hasImages') hasImages?: boolean,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('searchText') searchText?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ): Promise<PaginatedResponse<ExtractedNoticiaDocument>> {
    const filters: NoticiasFilter = {
      ...(domain && { domain }),
      ...(status && { status: status as 'pending' | 'extracted' | 'failed' | 'processing' }),
      ...(facebookPostId && { facebookPostId }),
      ...(pageId && { pageId }),
      ...(hasImages !== undefined && { hasImages }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
      ...(searchText && { searchText }),
    };

    const pagination: NoticiasPaginationOptions = {
      page: page || 1,
      limit: limit || 10,
      ...(sortBy && { sortBy }),
      ...(sortOrder && { sortOrder }),
    };

    return await this.extractionService.getExtractedNoticias(filters, pagination);
  }

  // ============================================================================
  // 📋 GESTIÓN DE JOBS
  // ============================================================================

  @Get('jobs')
  @ApiOperation({
    summary: 'Listar jobs de extracción',
    description: 'Obtiene historial de jobs con filtros'
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'domain', required: false, type: String })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Lista paginada de jobs' })
  async getJobs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('domain') domain?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<PaginatedResponse<NoticiasExtractionJobDocument>> {
    const filters = {
      ...(status && { status }),
      ...(domain && { domain }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
    };

    const pagination = {
      page: page || 1,
      limit: limit || 10,
    };

    return await this.extractionService.getJobs(filters, pagination);
  }

  @Get('jobs/:jobId')
  @ApiOperation({
    summary: 'Obtener estado de job',
    description: 'Consulta estado específico de un job'
  })
  @ApiResponse({ status: 200, description: 'Estado del job' })
  @ApiResponse({ status: 404, description: 'Job no encontrado' })
  async getJobStatus(@Param('jobId') jobId: string): Promise<NoticiasExtractionJobDocument | null> {
    return await this.extractionService.getJobStatus(jobId);
  }

  @Post('jobs/:jobId/retry')
  @ApiOperation({
    summary: 'Reintentar job fallido',
    description: 'Crea nuevo job para reintentar extracción fallida'
  })
  @ApiResponse({ status: 200, description: 'Job de reintento creado' })
  async retryFailedJob(@Param('jobId') jobId: string): Promise<{ newJobId: string; message: string }> {
    return await this.extractionService.retryFailedJob(jobId);
  }

  // ============================================================================
  // 📊 ESTADÍSTICAS
  // ============================================================================

  @Get('stats')
  @ApiOperation({
    summary: 'Estadísticas generales',
    description: 'Métricas completas del sistema de extracción'
  })
  @ApiResponse({ status: 200, description: 'Estadísticas del sistema' })
  async getStats(): Promise<ExtractionStats> {
    return await this.extractionService.getExtractionStats();
  }

  @Get('configs/stats')
  @ApiOperation({
    summary: 'Estadísticas de configuraciones',
    description: 'Métricas sobre configuraciones y su rendimiento'
  })
  @ApiResponse({ status: 200, description: 'Estadísticas de configuraciones' })
  async getConfigStats(): Promise<ExtractionStats> {
    return await this.configService.getStats();
  }

  @Post('configs/sync-urls')
  @ApiOperation({
    summary: 'Sincronizar URLs con configuraciones',
    description: 'Actualiza URLs existentes para vincularlas con sus configuraciones'
  })
  @ApiResponse({ status: 200, description: 'URLs sincronizadas' })
  async syncUrlsWithConfigs(): Promise<{ updated: number; message: string }> {
    return await this.configService.syncUrlsWithConfigs();
  }
}