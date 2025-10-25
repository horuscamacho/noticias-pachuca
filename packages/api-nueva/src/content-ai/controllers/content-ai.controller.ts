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
  ValidationPipe,
  BadRequestException,
  Logger
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { GenerationStatus } from '../interfaces/content-generation-request.interface';
import { ContentGenerationService } from '../services/content-generation.service';
import { AIProviderService } from '../services/ai-provider.service';
import { PromptTemplateService } from '../services/prompt-template.service';
import { ContentAgentService } from '../services/content-agent.service';
import { ContentGenerationQueueService } from '../services/content-generation-queue.service';
import { CostMonitoringService } from '../services/cost-monitoring.service';
import { DeadLetterQueueService } from '../services/dead-letter-queue.service';
import {
  CreateAIProviderRequest,
  UpdateAIProviderRequest,
  AIProviderResponse,
  CreatePromptTemplateRequest,
  UpdatePromptTemplateRequest,
  PromptTemplateResponse,
  TemplateTestRequest,
  TemplateTestResponse,
  GeneratedContentResponse,
  GeneratedContentStats,
  ContentType,
  WizardPromptRequest,
  WizardPromptResponse,
  CreateTemplateFromWizardRequest
} from '../interfaces';
import { GeneratedContentFiltersDto } from '../dto/generated-content-filters.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { ImproveCopyDto, ImprovedCopyResponseDto } from '../dto/improve-copy.dto';
import { CopyImproverService } from '../services/copy-improver.service';

// DTOs específicos del controller
export class GenerateContentDto {
  contentId: string;
  agentId: string;
  templateId: string;
  providerId?: string;
  customPromptVars?: Record<string, string>;
  priority?: 'urgent' | 'high' | 'normal' | 'low';
  userId?: string;
}

export class BatchGenerateDto {
  requests: GenerateContentDto[];
  batchId?: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  userId?: string;
  options?: {
    parallelLimit?: number;
    failFast?: boolean;
    costLimit?: number;
  };
}

/**
 * 🎮 Controller principal para el sistema AI Content Generation
 * Endpoints para providers, templates, generación y monitoreo
 */
@ApiTags('AI Content Generation')
@Controller('content-ai')
export class ContentAIController {
  private readonly logger = new Logger(ContentAIController.name);

  constructor(
    private readonly contentGenerationService: ContentGenerationService,
    private readonly aiProviderService: AIProviderService,
    private readonly promptTemplateService: PromptTemplateService,
    private readonly contentAgentService: ContentAgentService,
    private readonly queueService: ContentGenerationQueueService,
    private readonly costMonitoringService: CostMonitoringService,
    private readonly dlqService: DeadLetterQueueService,
    private readonly copyImproverService: CopyImproverService,
  ) {}

  // ==================== PROVIDERS ENDPOINTS ====================

  /**
   * 📋 Listar todos los proveedores de AI
   */
  @Get('providers')
  @ApiOperation({ summary: 'Obtener lista de proveedores AI configurados' })
  @ApiResponse({ status: 200, description: 'Lista de proveedores obtenida exitosamente' })
  async getProviders(): Promise<AIProviderResponse[]> {
    return this.aiProviderService.findAll();
  }

  /**
   * 🔍 Obtener proveedor específico por ID
   */
  @Get('providers/:id')
  @ApiOperation({ summary: 'Obtener proveedor AI por ID' })
  @ApiParam({ name: 'id', description: 'ID del proveedor' })
  @ApiResponse({ status: 200, description: 'Proveedor encontrado' })
  @ApiResponse({ status: 404, description: 'Proveedor no encontrado' })
  async getProvider(@Param('id') id: string): Promise<AIProviderResponse> {
    return this.aiProviderService.findById(id);
  }

  /**
   * ✅ Obtener solo proveedores activos
   */
  @Get('providers/active/list')
  @ApiOperation({ summary: 'Obtener lista de proveedores activos' })
  @ApiResponse({ status: 200, description: 'Lista de proveedores activos' })
  async getActiveProviders(): Promise<AIProviderResponse[]> {
    return this.aiProviderService.findActive();
  }

  /**
   * 🆕 Crear nuevo proveedor AI
   */
  @Post('providers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear nuevo proveedor AI' })
  @ApiResponse({ status: 201, description: 'Proveedor creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  async createProvider(
    @Body(ValidationPipe) createProviderDto: CreateAIProviderRequest
  ): Promise<AIProviderResponse> {
    return this.aiProviderService.create(createProviderDto);
  }

  /**
   * 🔄 Actualizar proveedor existente
   */
  @Put('providers/:id')
  @ApiOperation({ summary: 'Actualizar proveedor AI' })
  @ApiParam({ name: 'id', description: 'ID del proveedor a actualizar' })
  @ApiResponse({ status: 200, description: 'Proveedor actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Proveedor no encontrado' })
  async updateProvider(
    @Param('id') id: string,
    @Body(ValidationPipe) updateProviderDto: UpdateAIProviderRequest
  ): Promise<AIProviderResponse> {
    return this.aiProviderService.update(id, updateProviderDto);
  }

  /**
   * 🗑️ Eliminar proveedor
   */
  @Delete('providers/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar proveedor AI' })
  @ApiParam({ name: 'id', description: 'ID del proveedor a eliminar' })
  @ApiResponse({ status: 204, description: 'Proveedor eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Proveedor no encontrado' })
  async deleteProvider(@Param('id') id: string): Promise<void> {
    return this.aiProviderService.delete(id);
  }

  /**
   * 🏥 Ejecutar health check en proveedor
   */
  @Post('providers/:id/health-check')
  @ApiOperation({ summary: 'Ejecutar health check en proveedor específico' })
  @ApiParam({ name: 'id', description: 'ID del proveedor' })
  @ApiResponse({ status: 200, description: 'Health check ejecutado' })
  async healthCheckProvider(@Param('id') id: string): Promise<{
    isHealthy: boolean;
    responseTime: number;
    error?: string;
  }> {
    return this.aiProviderService.performHealthCheck(id);
  }

  /**
   * 🏥 Health check de todos los proveedores
   */
  @Post('providers/health-check/all')
  @ApiOperation({ summary: 'Ejecutar health check en todos los proveedores activos' })
  @ApiResponse({ status: 200, description: 'Health checks ejecutados' })
  async healthCheckAllProviders(): Promise<Record<string, {
    isHealthy: boolean;
    responseTime: number;
    error?: string;
  }>> {
    return this.aiProviderService.performAllHealthChecks();
  }

  /**
   * 🎯 Obtener estrategias de proveedores disponibles
   */
  @Get('providers/strategies/available')
  @ApiOperation({ summary: 'Obtener estrategias de proveedores configuradas en el backend' })
  @ApiResponse({ status: 200, description: 'Estrategias disponibles obtenidas' })
  async getAvailableStrategies(): Promise<Array<{
    name: string;
    displayName: string;
    models: string[];
    capabilities: {
      maxTokens: number;
      supportsStreaming: boolean;
      costPerInputToken: number;
      costPerOutputToken: number;
    };
  }>> {
    return this.aiProviderService.getAvailableStrategies();
  }

  // ==================== TEMPLATES ENDPOINTS ====================

  /**
   * 📋 Listar todos los templates
   */
  @Get('templates')
  @ApiOperation({ summary: 'Obtener lista de templates de prompts' })
  @ApiQuery({ name: 'type', required: false, description: 'Filtrar por tipo de contenido' })
  @ApiQuery({ name: 'active', required: false, description: 'Filtrar por templates activos' })
  @ApiResponse({ status: 200, description: 'Lista de templates obtenida' })
  async getTemplates(
    @Query('type') type?: ContentType,
    @Query('active') active?: boolean
  ): Promise<PromptTemplateResponse[]> {
    if (active === true) {
      return this.promptTemplateService.findActive();
    }
    if (type) {
      return this.promptTemplateService.findByType(type);
    }
    return this.promptTemplateService.findAll();
  }

  /**
   * 🔍 Obtener template específico por ID
   */
  @Get('templates/:id')
  @ApiOperation({ summary: 'Obtener template por ID' })
  @ApiParam({ name: 'id', description: 'ID del template' })
  @ApiResponse({ status: 200, description: 'Template encontrado' })
  @ApiResponse({ status: 404, description: 'Template no encontrado' })
  async getTemplate(@Param('id') id: string): Promise<PromptTemplateResponse> {
    return this.promptTemplateService.findById(id);
  }

  /**
   * 🎯 Obtener templates por tipo de contenido
   */
  @Get('templates/type/:type')
  @ApiOperation({ summary: 'Obtener templates por tipo de contenido' })
  @ApiParam({ name: 'type', description: 'Tipo de contenido' })
  @ApiResponse({ status: 200, description: 'Templates encontrados por tipo' })
  async getTemplatesByType(@Param('type') type: ContentType): Promise<PromptTemplateResponse[]> {
    return this.promptTemplateService.findByType(type);
  }

  /**
   * 🎪 Obtener templates por agente
   */
  @Get('templates/agent/:agentType')
  @ApiOperation({ summary: 'Obtener templates compatibles con un agente' })
  @ApiParam({ name: 'agentType', description: 'Tipo de agente editorial' })
  @ApiResponse({ status: 200, description: 'Templates encontrados para el agente' })
  async getTemplatesByAgent(@Param('agentType') agentType: string): Promise<PromptTemplateResponse[]> {
    return this.promptTemplateService.findByAgentType(agentType);
  }

  /**
   * 🆕 Crear nuevo template
   */
  @Post('templates')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear nuevo template de prompt' })
  @ApiResponse({ status: 201, description: 'Template creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Error de validación en template' })
  async createTemplate(
    @Body(ValidationPipe) createTemplateDto: CreatePromptTemplateRequest
  ): Promise<PromptTemplateResponse> {
    return this.promptTemplateService.create(createTemplateDto);
  }

  /**
   * 🔄 Actualizar template existente
   */
  @Put('templates/:id')
  @ApiOperation({ summary: 'Actualizar template de prompt' })
  @ApiParam({ name: 'id', description: 'ID del template a actualizar' })
  @ApiResponse({ status: 200, description: 'Template actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Template no encontrado' })
  async updateTemplate(
    @Param('id') id: string,
    @Body(ValidationPipe) updateTemplateDto: UpdatePromptTemplateRequest
  ): Promise<PromptTemplateResponse> {
    return this.promptTemplateService.update(id, updateTemplateDto);
  }

  /**
   * 🗑️ Eliminar template
   */
  @Delete('templates/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar template de prompt' })
  @ApiParam({ name: 'id', description: 'ID del template a eliminar' })
  @ApiResponse({ status: 204, description: 'Template eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Template no encontrado' })
  async deleteTemplate(@Param('id') id: string): Promise<void> {
    return this.promptTemplateService.delete(id);
  }

  /**
   * 🧪 Probar template con datos de muestra
   */
  @Post('templates/:id/test')
  @ApiOperation({ summary: 'Probar template con datos de muestra' })
  @ApiParam({ name: 'id', description: 'ID del template a probar' })
  @ApiResponse({ status: 200, description: 'Test de template ejecutado' })
  @ApiResponse({ status: 400, description: 'Error en test de template' })
  async testTemplate(
    @Param('id') templateId: string,
    @Body(ValidationPipe) testRequest: TemplateTestRequest
  ): Promise<TemplateTestResponse> {
    // Combinar ID del parámetro con el body
    const completeTestRequest = { ...testRequest, templateId };
    return this.promptTemplateService.testTemplate(completeTestRequest);
  }

  /**
   * 🔍 Buscar templates
   */
  @Get('templates/search/query')
  @ApiOperation({ summary: 'Buscar templates con criterios específicos' })
  @ApiQuery({ name: 'text', required: false, description: 'Texto a buscar' })
  @ApiQuery({ name: 'type', required: false, description: 'Tipo de contenido' })
  @ApiQuery({ name: 'category', required: false, description: 'Categoría' })
  @ApiQuery({ name: 'minQualityScore', required: false, description: 'Puntuación mínima de calidad' })
  @ApiResponse({ status: 200, description: 'Resultados de búsqueda' })
  async searchTemplates(
    @Query('text') text?: string,
    @Query('type') type?: ContentType,
    @Query('category') category?: string,
    @Query('minQualityScore') minQualityScore?: number
  ): Promise<PromptTemplateResponse[]> {
    return this.promptTemplateService.search({
      text,
      type,
      category,
      minQualityScore,
    });
  }

  // ==================== CONTENT GENERATION ENDPOINTS ====================

  /**
   * 🚀 Generar contenido individual
   */
  @Post('generate')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Generar contenido con IA (async)' })
  @ApiResponse({ status: 202, description: 'Job de generación encolado exitosamente' })
  @ApiResponse({ status: 400, description: 'Parámetros de generación inválidos' })
  async generateContent(@Body(ValidationPipe) generateDto: GenerateContentDto): Promise<{
    jobId: string;
    status: string;
    message: string;
    estimatedTime?: number;
  }> {
    try {
      const jobId = await this.queueService.enqueueGeneration({
        contentId: generateDto.contentId,
        agentId: generateDto.agentId,
        templateId: generateDto.templateId,
        providerId: generateDto.providerId,
        customPromptVars: generateDto.customPromptVars,
      }, generateDto.priority || 'normal', generateDto.userId);

      return {
        jobId,
        status: 'queued',
        message: 'Contenido encolado para generación',
        estimatedTime: 60000, // 1 minuto estimado
      };
    } catch (error) {
      this.logger.error(`Failed to enqueue content generation: ${error.message}`);
      throw new BadRequestException(`Error al encolar generación: ${error.message}`);
    }
  }

  /**
   * 📦 Generar lote de contenidos
   */
  @Post('generate/batch')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Generar lote de contenidos con IA (async)' })
  @ApiResponse({ status: 202, description: 'Batch de generación encolado exitosamente' })
  @ApiResponse({ status: 400, description: 'Parámetros de batch inválidos' })
  async generateBatchContent(@Body(ValidationPipe) batchDto: BatchGenerateDto): Promise<{
    batchId: string;
    jobIds: string[];
    totalEstimatedCost: number;
    status: string;
    message: string;
  }> {
    try {
      const result = await this.queueService.enqueueBatch({
        requests: batchDto.requests.map(req => ({
          contentId: req.contentId,
          agentId: req.agentId,
          templateId: req.templateId,
          providerId: req.providerId,
          customPromptVars: req.customPromptVars,
        })),
        batchId: batchDto.batchId,
        priority: batchDto.priority,
        userId: batchDto.userId,
        options: batchDto.options,
      });

      return {
        ...result,
        status: 'queued',
        message: `Batch de ${result.jobIds.length} jobs encolado exitosamente`,
      };
    } catch (error) {
      this.logger.error(`Failed to enqueue batch generation: ${error.message}`);
      throw new BadRequestException(`Error al encolar batch: ${error.message}`);
    }
  }

  /**
   * 📊 Obtener estado de job de generación
   */
  @Get('generate/status/:jobId')
  @ApiOperation({ summary: 'Obtener estado de job de generación' })
  @ApiParam({ name: 'jobId', description: 'ID del job de generación' })
  @ApiResponse({ status: 200, description: 'Estado del job obtenido' })
  @ApiResponse({ status: 404, description: 'Job no encontrado' })
  async getJobStatus(@Param('jobId') jobId: string) {
    const status = await this.queueService.getJobStatus(jobId);
    if (!status) {
      throw new BadRequestException('Job no encontrado');
    }
    return status;
  }

  /**
   * 🗑️ Cancelar job de generación
   */
  @Delete('generate/:jobId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancelar job de generación' })
  @ApiParam({ name: 'jobId', description: 'ID del job a cancelar' })
  @ApiResponse({ status: 204, description: 'Job cancelado exitosamente' })
  @ApiResponse({ status: 404, description: 'Job no encontrado' })
  async cancelJob(@Param('jobId') jobId: string): Promise<void> {
    const cancelled = await this.queueService.cancelJob(jobId);
    if (!cancelled) {
      throw new BadRequestException('No se pudo cancelar el job');
    }
  }

  /**
   * 📈 Obtener estadísticas de la cola
   */
  @Get('generate/queue/stats')
  @ApiOperation({ summary: 'Obtener estadísticas de la cola de generación' })
  @ApiResponse({ status: 200, description: 'Estadísticas de cola obtenidas' })
  async getQueueStats() {
    return this.queueService.getQueueStats();
  }

  // ==================== GENERATED CONTENT ENDPOINTS ====================

  /**
   * 📋 Listar contenido generado con paginación
   */
  @Get('generated')
  @ApiOperation({ summary: 'Obtener lista paginada de contenido generado' })
  @ApiResponse({ status: 200, description: 'Lista paginada de contenido generado' })
  async getGeneratedContent(
    @Query() filters: GeneratedContentFiltersDto
  ): Promise<PaginatedResponse<GeneratedContentResponse>> {
    return this.contentGenerationService.findAllPaginated(filters);
  }

  /**
   * 🏷️ Obtener todas las categorías únicas de contenidos generados
   */
  @Get('generated/categories/all')
  @ApiOperation({ summary: 'Obtener todas las categorías únicas' })
  @ApiResponse({ status: 200, description: 'Lista de categorías obtenida' })
  async getCategories(): Promise<string[]> {
    return this.contentGenerationService.getCategories();
  }

  /**
   * 🔍 Obtener contenido generado por ID
   */
  @Get('generated/:id')
  @ApiOperation({ summary: 'Obtener contenido generado por ID' })
  @ApiParam({ name: 'id', description: 'ID del contenido generado' })
  @ApiResponse({ status: 200, description: 'Contenido generado encontrado' })
  @ApiResponse({ status: 404, description: 'Contenido no encontrado' })
  async getGeneratedContentById(@Param('id') id: string): Promise<GeneratedContentResponse> {
    return this.contentGenerationService.findById(id);
  }

  /**
   * 📊 Obtener estadísticas de contenido generado
   */
  @Get('generated/stats/summary')
  @ApiOperation({ summary: 'Obtener estadísticas de contenido generado' })
  @ApiQuery({ name: 'timeframe', required: false, description: 'Periodo de tiempo' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas' })
  async getGeneratedContentStats(
    @Query('timeframe') timeframe?: 'day' | 'week' | 'month'
  ): Promise<GeneratedContentStats> {
    return this.contentGenerationService.getStats(timeframe);
  }

  // ==================== COST MONITORING ENDPOINTS ====================

  /**
   * 💰 Obtener reporte de costos
   */
  @Get('costs/report')
  @ApiOperation({ summary: 'Obtener reporte detallado de costos' })
  @ApiQuery({ name: 'timeframe', required: false, description: 'Periodo del reporte' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Fecha de inicio (ISO)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Fecha de fin (ISO)' })
  @ApiResponse({ status: 200, description: 'Reporte de costos generado' })
  async getCostReport(
    @Query('timeframe') timeframe: 'hour' | 'day' | 'week' | 'month' = 'day',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.costMonitoringService.generateCostReport(
      timeframe,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  /**
   * 🚨 Obtener alertas activas de costo
   */
  @Get('costs/alerts')
  @ApiOperation({ summary: 'Obtener alertas activas de costo' })
  @ApiResponse({ status: 200, description: 'Alertas activas obtenidas' })
  async getActiveAlerts() {
    return this.costMonitoringService.getActiveAlerts();
  }

  /**
   * ✅ Confirmar alerta de costo
   */
  @Post('costs/alerts/:alertId/acknowledge')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Confirmar/reconocer alerta de costo' })
  @ApiParam({ name: 'alertId', description: 'ID de la alerta' })
  @ApiResponse({ status: 204, description: 'Alerta confirmada' })
  async acknowledgeAlert(@Param('alertId') alertId: string): Promise<void> {
    const acknowledged = await this.costMonitoringService.acknowledgeAlert(alertId);
    if (!acknowledged) {
      throw new BadRequestException('Alerta no encontrada');
    }
  }

  /**
   * 💡 Obtener recomendaciones de optimización
   */
  @Get('costs/recommendations')
  @ApiOperation({ summary: 'Obtener recomendaciones de optimización de costos' })
  @ApiResponse({ status: 200, description: 'Recomendaciones obtenidas' })
  async getOptimizationRecommendations() {
    return this.costMonitoringService.getOptimizationRecommendations();
  }

  // ==================== DEAD LETTER QUEUE ENDPOINTS ====================

  /**
   * ⚰️ Obtener estadísticas del DLQ
   */
  @Get('dlq/stats')
  @ApiOperation({ summary: 'Obtener estadísticas del Dead Letter Queue' })
  @ApiResponse({ status: 200, description: 'Estadísticas del DLQ obtenidas' })
  async getDLQStats() {
    return this.dlqService.getDLQStats();
  }

  /**
   * 📋 Obtener entries del DLQ
   */
  @Get('dlq/entries')
  @ApiOperation({ summary: 'Obtener entries del Dead Letter Queue' })
  @ApiQuery({ name: 'resolved', required: false, description: 'Filtrar por estado resuelto' })
  @ApiQuery({ name: 'failureReason', required: false, description: 'Filtrar por razón de fallo' })
  @ApiQuery({ name: 'provider', required: false, description: 'Filtrar por proveedor' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset para paginación' })
  @ApiResponse({ status: 200, description: 'Entries del DLQ obtenidas' })
  async getDLQEntries(
    @Query('resolved') resolved?: boolean,
    @Query('failureReason') failureReason?: string,
    @Query('provider') provider?: string,
    @Query('contentId') contentId?: string,
    @Query('userId') userId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    return this.dlqService.getDLQEntries({
      resolved,
      failureReason,
      provider,
      contentId,
      userId,
      limit,
      offset,
    });
  }

  /**
   * 🔄 Reintentar entry del DLQ
   */
  @Post('dlq/entries/:entryId/retry')
  @ApiOperation({ summary: 'Reintentar entry del Dead Letter Queue' })
  @ApiParam({ name: 'entryId', description: 'ID del entry a reintentar' })
  @ApiResponse({ status: 200, description: 'Retry ejecutado' })
  async retryDLQEntry(
    @Param('entryId') entryId: string,
    @Body() options?: {
      forceDifferentProvider?: boolean;
      resolvedBy?: string;
      notes?: string;
    }
  ) {
    return this.dlqService.retryDLQEntry(entryId, options);
  }

  /**
   * ✅ Marcar entry del DLQ como resuelto
   */
  @Post('dlq/entries/:entryId/resolve')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Marcar entry del DLQ como resuelto' })
  @ApiParam({ name: 'entryId', description: 'ID del entry a resolver' })
  @ApiResponse({ status: 204, description: 'Entry marcado como resuelto' })
  async resolveDLQEntry(
    @Param('entryId') entryId: string,
    @Body() resolution: {
      method: 'manual_retry' | 'data_fix' | 'provider_fix' | 'abandoned';
      resolvedBy: string;
      notes?: string;
    }
  ): Promise<void> {
    const resolved = await this.dlqService.resolveDLQEntry(entryId, resolution);
    if (!resolved) {
      throw new BadRequestException('Entry no encontrado');
    }
  }

  // ==================== AGENTS ENDPOINTS ====================

  /**
   * 👤 Listar agentes de contenido
   */
  @Get('agents')
  @ApiOperation({ summary: 'Obtener lista de agentes editoriales' })
  @ApiResponse({ status: 200, description: 'Lista de agentes obtenida' })
  async getAgents() {
    return this.contentAgentService.findAll();
  }

  /**
   * 🔍 Obtener agente por ID
   */
  @Get('agents/:id')
  @ApiOperation({ summary: 'Obtener agente editorial por ID' })
  @ApiParam({ name: 'id', description: 'ID del agente' })
  @ApiResponse({ status: 200, description: 'Agente encontrado' })
  @ApiResponse({ status: 404, description: 'Agente no encontrado' })
  async getAgent(@Param('id') id: string) {
    return this.contentAgentService.findById(id);
  }

  // ==================== ADMIN ENDPOINTS ====================

  /**
   * 🧹 Limpiar cola de jobs
   */
  @Post('admin/queue/clean')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Limpiar jobs antiguos de la cola' })
  @ApiResponse({ status: 204, description: 'Cola limpiada exitosamente' })
  async cleanQueue(
    @Body() options?: {
      grace?: number;
      limit?: number;
      type?: 'completed' | 'failed' | 'active';
    }
  ): Promise<void> {
    await this.queueService.cleanQueue(options);
  }

  /**
   * 📊 Obtener métricas generales del sistema
   */
  @Get('admin/metrics')
  @ApiOperation({ summary: 'Obtener métricas generales del sistema AI' })
  @ApiResponse({ status: 200, description: 'Métricas del sistema obtenidas' })
  async getSystemMetrics() {
    const [queueStats, dlqStats, activeAlerts, costReport] = await Promise.all([
      this.queueService.getQueueStats(),
      this.dlqService.getDLQStats(),
      this.costMonitoringService.getActiveAlerts(),
      this.costMonitoringService.generateCostReport('day'),
    ]);

    return {
      queue: queueStats,
      deadLetterQueue: dlqStats,
      alerts: {
        active: activeAlerts.length,
        critical: activeAlerts.filter(a => a.severity === 'critical').length,
      },
      costs: {
        today: costReport.totals.cost,
        totalJobs: costReport.totals.jobs,
        averageCostPerJob: costReport.totals.jobs > 0 ? costReport.totals.cost / costReport.totals.jobs : 0,
      },
      timestamp: new Date(),
    };
  }

  // ==================== NEWS TO CONTENT ENDPOINT (NEW) ====================

  /**
   * 📰 Endpoint principal: Generar contenido desde noticias
   * Flujo simplificado: title + content → agente configurado → JSON estandarizado
   */
  @Post('generate-from-news')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Generar contenido editorial desde noticia',
    description: 'Endpoint principal para transformar título y contenido de noticia en contenido editorial usando agentes configurados'
  })
  @ApiResponse({
    status: 202,
    description: 'Job de generación creado exitosamente',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        status: { type: 'string', enum: ['pending', 'processing'] },
        templateUsed: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            agentPersona: { type: 'string' }
          }
        },
        estimatedProcessingTime: { type: 'number' },
        estimatedCost: { type: 'number' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Request inválido o template incompatible' })
  @ApiResponse({ status: 404, description: 'Template no encontrado' })
  async generateFromNews(
    @Body(ValidationPipe) request: {
      title: string;
      content: string;
      templateId: string;
      referenceContent?: string;
      priority?: number;
      description?: string;
    }
  ) {
    this.logger.log(`🎯 Nueva generación desde noticia: template=${request.templateId}, title="${request.title.substring(0, 50)}..."`);

    // Validar que el template existe y es compatible
    const template = await this.promptTemplateService.findById(request.templateId);
    if (!template) {
      throw new BadRequestException(`Template con ID ${request.templateId} no encontrado`);
    }

    if (!template.isActive) {
      throw new BadRequestException(`Template ${template.name} está inactivo`);
    }

    // Validar si requiere contenido de referencia
    if (template.agentConfiguration?.requiresReference && !request.referenceContent) {
      throw new BadRequestException(
        `El agente "${template.name}" requiere contenido de referencia para funcionar correctamente`
      );
    }

    // Validar contenido político si es necesario
    if (request.referenceContent && !template.agentConfiguration?.canHandlePolitics) {
      this.logger.warn(`Template ${template.name} recibió contenido de referencia pero no puede manejar política`);
    }

    try {
      // Crear job de generación
      const jobResult = await this.queueService.addGenerationJob({
        type: 'news-to-content',
        data: {
          title: request.title.trim(),
          content: request.content.trim(),
          templateId: request.templateId,
          referenceContent: request.referenceContent?.trim(),
        },
        priority: request.priority || 5,
        description: request.description || `Generación desde noticia: ${request.title.substring(0, 100)}`,
      });

      return {
        jobId: jobResult.jobId,
        status: jobResult.status,
        templateUsed: {
          id: template.id,
          name: template.name,
          agentPersona: template.agentPersona,
          editorialLine: template.agentConfiguration?.editorialLine || 'neutral',
        },
        estimatedProcessingTime: jobResult.estimatedProcessingTime,
        estimatedCost: jobResult.estimatedCost,
        queuePosition: jobResult.queuePosition,
        message: `Job de generación creado exitosamente. El contenido será procesado por "${template.name}"`
      };

    } catch (error) {
      this.logger.error(`❌ Error creando job de generación: ${error.message}`, error.stack);
      throw new BadRequestException(`Error procesando request: ${error.message}`);
    }
  }

  /**
   * 📋 Obtener resultado de generación específica
   */
  @Get('generate-from-news/:jobId')
  @ApiOperation({ summary: 'Obtener resultado de generación desde noticia' })
  @ApiParam({ name: 'jobId', description: 'ID del job de generación' })
  @ApiResponse({ status: 200, description: 'Resultado de generación obtenido' })
  @ApiResponse({ status: 404, description: 'Job no encontrado' })
  async getNewsGenerationResult(@Param('jobId') jobId: string) {
    const result = await this.queueService.getJobResult(jobId);
    if (!result) {
      throw new BadRequestException(`Job con ID ${jobId} no encontrado`);
    }

    return result;
  }

  // ==================== WIZARD PROMPT GENERATION ENDPOINTS (NEW) ====================

  /**
   * 🧙‍♂️ Generar prompt usando IA basado en configuración del wizard
   * El wizard envía datos del usuario y el backend genera el prompt completo
   */
  @Post('generate-prompt-from-wizard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generar prompt con IA desde datos del wizard',
    description: 'Recibe configuración del wizard y genera prompt completo usando IA para crear agentes editoriales'
  })
  @ApiResponse({
    status: 200,
    description: 'Prompt generado exitosamente con IA',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        generatedPrompt: {
          type: 'object',
          properties: {
            promptTemplate: { type: 'string' },
            systemPrompt: { type: 'string' },
            reasoning: { type: 'string' }
          }
        },
        agentConfiguration: { type: 'object' },
        templatePreview: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos del wizard inválidos' })
  @ApiResponse({ status: 500, description: 'Error generando prompt con IA' })
  async generatePromptFromWizard(
    @Body(ValidationPipe) wizardData: WizardPromptRequest
  ): Promise<WizardPromptResponse> {

    this.logger.log(`🧙‍♂️ Generando prompt con IA: ${wizardData.agentType} - ${wizardData.specialization}`);

    try {
      // Validar datos básicos del wizard
      if (!wizardData.templateName || wizardData.templateName.trim().length < 3) {
        throw new BadRequestException('El nombre del template debe tener al menos 3 caracteres');
      }

      if (!wizardData.agentPersonality || wizardData.agentPersonality.trim().length < 10) {
        throw new BadRequestException('La personalidad del agente debe ser más descriptiva (mínimo 10 caracteres)');
      }

      if (wizardData.politicalIntensity < 0 || wizardData.politicalIntensity > 100) {
        throw new BadRequestException('La intensidad política debe estar entre 0 y 100');
      }

      // Verificar que no existe template con el mismo nombre
      const existingTemplates = await this.promptTemplateService.search({ text: wizardData.templateName });
      const duplicateName = existingTemplates.find(t =>
        t.name.toLowerCase().trim() === wizardData.templateName.toLowerCase().trim()
      );

      if (duplicateName) {
        throw new BadRequestException(`Ya existe un template con el nombre "${wizardData.templateName}"`);
      }

      const startTime = Date.now();

      // Generar prompt usando IA
      const aiGeneratedPrompt = await this.promptTemplateService.generatePromptWithAI({
        agentType: wizardData.agentType,
        specialization: wizardData.specialization,
        editorialLine: wizardData.editorialLine,
        politicalIntensity: wizardData.politicalIntensity,
        agentPersonality: wizardData.agentPersonality,
        canHandlePolitics: wizardData.canHandlePolitics,
        requiresReference: wizardData.requiresReference,
        examples: wizardData.examples,
        additionalInstructions: wizardData.additionalInstructions,
      });

      const processingTime = Date.now() - startTime;

      // Preparar datos para crear el template final
      const createTemplateData = {
        name: wizardData.templateName.trim(),
        type: wizardData.templateType,
        agentPersona: wizardData.agentPersonality.trim(),
        promptTemplate: aiGeneratedPrompt.promptTemplate,
        systemPrompt: aiGeneratedPrompt.systemPrompt,
        staticInputStructure: aiGeneratedPrompt.staticInputStructure,
        staticOutputFormat: aiGeneratedPrompt.staticOutputFormat,
        variables: ['title', 'content', 'referenceContent'],
        agentConfiguration: aiGeneratedPrompt.agentConfiguration,
        category: wizardData.category?.trim(),
        isActive: true,
        compatibleProviders: ['OpenAI', 'Anthropic'], // Por defecto
        examples: wizardData.examples?.map(ex => ({
          sampleInput: {
            title: ex.input.substring(0, 100),
            content: ex.input,
            referenceContent: ex.description || ''
          },
          expectedOutput: {
            title: ex.expectedOutput.substring(0, 100),
            content: ex.expectedOutput,
            category: wizardData.templateType,
            summary: ex.expectedOutput.substring(0, 200)
          },
          description: ex.description
        }))
      };

      // Crear preview del template
      const templatePreview = {
        name: wizardData.templateName,
        type: wizardData.templateType,
        variables: ['title', 'content', 'referenceContent'],
        compatibleProviders: ['OpenAI', 'Anthropic']
      };

      const response: WizardPromptResponse = {
        success: true,
        generatedPrompt: {
          promptTemplate: aiGeneratedPrompt.promptTemplate,
          systemPrompt: aiGeneratedPrompt.systemPrompt,
          reasoning: `Prompt generado para agente ${wizardData.agentType} con especialización en ${wizardData.specialization} y línea editorial ${wizardData.editorialLine}`
        },
        agentConfiguration: aiGeneratedPrompt.agentConfiguration,
        staticInputStructure: aiGeneratedPrompt.staticInputStructure,
        staticOutputFormat: aiGeneratedPrompt.staticOutputFormat,
        processing: {
          aiProvider: 'OpenAI', // TODO: Get from ProviderFactory
          tokensUsed: 2500, // TODO: Get real value
          cost: 0.05, // TODO: Calculate real cost
          processingTime
        },
        templatePreview,
        createTemplateData,
        suggestions: [
          'Revisa el prompt generado para asegurarte que refleje la personalidad deseada',
          'Puedes modificar la intensidad política después de crear el template',
          wizardData.examples && wizardData.examples.length > 0
            ? 'Los ejemplos proporcionados han sido incluidos para mejorar la calidad'
            : 'Considera agregar ejemplos específicos para mejorar la precisión del agente'
        ]
      };

      this.logger.log(`✅ Prompt generado exitosamente en ${processingTime}ms: ${wizardData.templateName}`);
      return response;

    } catch (error) {
      this.logger.error(`❌ Error generando prompt con IA: ${error.message}`, error.stack);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(`Error generando prompt: ${error.message}`);
    }
  }

  /**
   * 📋 Crear template final desde datos del wizard y prompt generado
   */
  @Post('create-template-from-wizard')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear template final desde wizard',
    description: 'Crea el template definitivo usando datos del wizard y prompt generado por IA'
  })
  @ApiResponse({ status: 201, description: 'Template creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de creación inválidos' })
  async createTemplateFromWizard(
    @Body(ValidationPipe) request: CreateTemplateFromWizardRequest
  ): Promise<PromptTemplateResponse> {

    this.logger.log(`📋 Creando template final desde wizard: ${request.wizardData.templateName}`);

    if (!request.userApproval) {
      throw new BadRequestException('El usuario debe aprobar la creación del template');
    }

    try {
      // Aplicar modificaciones del usuario si las hay
      const finalPromptTemplate = request.userModifications?.promptTemplate || request.generatedPrompt.promptTemplate;
      const finalSystemPrompt = request.userModifications?.systemPrompt || request.generatedPrompt.systemPrompt;
      const finalTemplateName = request.userModifications?.templateName || request.wizardData.templateName;
      const finalCategory = request.userModifications?.category || request.wizardData.category;

      // Crear el template usando el servicio existente
      const createTemplateRequest: CreatePromptTemplateRequest = {
        name: finalTemplateName.trim(),
        type: request.wizardData.templateType,
        agentPersona: request.wizardData.agentPersonality.trim(),
        promptTemplate: finalPromptTemplate,
        systemPrompt: finalSystemPrompt,
        outputFormat: {
          title: 'string',
          content: 'string',
          keywords: ['string'],
          tags: ['string'],
          category: 'string',
          summary: 'string'
        },
        staticInputStructure: {
          title: 'string',
          content: 'string',
          referenceContent: 'string?'
        },
        staticOutputFormat: {
          title: 'string',
          content: 'string',
          keywords: ['string'],
          tags: ['string'],
          category: 'string',
          summary: 'string'
        },
        variables: ['title', 'content', 'referenceContent'],
        isActive: true,
        agentConfiguration: {
          editorialLine: request.wizardData.editorialLine,
          politicalIntensity: request.wizardData.politicalIntensity,
          agentPersonality: request.wizardData.agentPersonality,
          canHandlePolitics: request.wizardData.canHandlePolitics,
          requiresReference: request.wizardData.requiresReference,
        },
        category: finalCategory?.trim(),
        compatibleProviders: ['OpenAI', 'Anthropic'],
        examples: request.wizardData.examples?.map(ex => ({
          sampleInput: {
            title: ex.input.substring(0, 100),
            content: ex.input,
            referenceContent: ex.description || ''
          },
          expectedOutput: {
            title: ex.expectedOutput.substring(0, 100),
            content: ex.expectedOutput,
            category: finalCategory || request.wizardData.templateType,
            summary: ex.expectedOutput.substring(0, 200)
          },
          description: ex.description
        }))
      };

      const createdTemplate = await this.promptTemplateService.create(createTemplateRequest);

      this.logger.log(`✅ Template creado exitosamente desde wizard: ${createdTemplate.name} (ID: ${createdTemplate.id})`);
      return createdTemplate;

    } catch (error) {
      this.logger.error(`❌ Error creando template desde wizard: ${error.message}`, error.stack);
      throw new BadRequestException(`Error creando template: ${error.message}`);
    }
  }

  // ==================== COPY IMPROVER ENDPOINTS ====================

  /**
   * 📱 Mejorar copy de redes sociales con agente especializado
   * Se usa antes de publicar en redes sociales para optimizar hooks y copys
   *
   * ⚠️ DESACTIVADO TEMPORALMENTE (2025-10-21)
   * Razón: Según análisis PROMPT_ANALYSIS_CONTENT_GENERATION.md, este servicio
   * está EMPEORANDO el contenido al homogenizar aún más los copys.
   * El nuevo prompt (v2.0) ya genera copys de alta calidad directamente.
   *
   * Beneficios de desactivar:
   * - Reducción de 40% en latencia
   * - Reducción de 50% en costos de API
   * - Mayor variación natural en copys
   */
  // @Post('improve-copy')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({
  //   summary: 'Mejorar copy de redes sociales con IA',
  //   description: 'Mejora los copys de Facebook y Twitter de un contenido generado usando un agente especializado. Agrega URL canónica y optimiza hooks.'
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Copy mejorado exitosamente',
  //   type: ImprovedCopyResponseDto
  // })
  // @ApiResponse({ status: 404, description: 'Contenido no encontrado' })
  // @ApiResponse({ status: 400, description: 'Datos inválidos' })
  // async improveSocialMediaCopy(
  //   @Body(ValidationPipe) dto: ImproveCopyDto
  // ): Promise<{
  //   success: boolean;
  //   message: string;
  //   data: ImprovedCopyResponseDto;
  // }> {
  //   this.logger.log(`📱 Improving social media copy for content ${dto.contentId}`);

  //   try {
  //     const improvedCopy = await this.copyImproverService.improveSocialMediaCopy(
  //       dto.contentId,
  //       dto.canonicalUrl
  //     );

  //     return {
  //       success: true,
  //       message: 'Copy mejorado exitosamente',
  //       data: improvedCopy
  //     };

  //   } catch (error) {
  //     this.logger.error(`❌ Error improving copy: ${error.message}`, error.stack);
  //     throw error;
  //   }
  // }
}