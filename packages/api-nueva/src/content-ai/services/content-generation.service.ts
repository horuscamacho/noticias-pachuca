import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ContentAgentDocument } from '../schemas/content-agent.schema';
import { AIContentGeneration, AIContentGenerationDocument } from '../schemas/ai-content-generation.schema';
import { ExtractedNoticia, ExtractedNoticiaDocument } from '../../noticias/schemas/extracted-noticia.schema';
import {
  ContentGenerationRequest,
  GeneratedContentResponse,
  CreateGeneratedContentRequest,
  UpdateGeneratedContentRequest,
  GeneratedContentFilters,
  GeneratedContentStats,
  GenerationStatus
} from '../interfaces';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { ProviderFactoryService } from './provider-factory.service';
import { PromptTemplateService } from './prompt-template.service';
import { ContentAgentService } from './content-agent.service';
import { AIProviderService } from './ai-provider.service';

/**
 * 🎨 Servicio para generación de contenido con IA
 * Provider selection, context preparation, generation workflow
 */
@Injectable()
export class ContentGenerationService {
  private readonly logger = new Logger(ContentGenerationService.name);

  constructor(
    @InjectModel(AIContentGeneration.name) private aiContentGenerationModel: Model<AIContentGenerationDocument>,
    @InjectModel(ExtractedNoticia.name) private extractedNoticiaModel: Model<ExtractedNoticiaDocument>,
    private readonly providerFactory: ProviderFactoryService,
    private readonly promptTemplateService: PromptTemplateService,
    private readonly contentAgentService: ContentAgentService,
    private readonly aiProviderService: AIProviderService,
  ) {}

  /**
   * 📋 Obtener todo el contenido generado
   */
  async findAll(filters?: GeneratedContentFilters): Promise<GeneratedContentResponse[]> {
    const query = this.buildFilterQuery(filters || {});

    const content = await this.aiContentGenerationModel
      .find(query)
      .populate('originalContentId', 'title content sourceUrl publishedAt images')
      .populate('agentId', 'name agentType')
      .populate('templateId', 'name type')
      .populate('providerId', 'name model')
      .sort({ generatedAt: -1 })
      .exec();

    return content.map(item => this.toDetailedResponse(item));
  }

  /**
   * 📋 Obtener contenido generado con paginación
   */
  async findAllPaginated(filters: {
    status?: GenerationStatus[];
    agentId?: string;
    templateId?: string;
    providerId?: string;
    dateFrom?: string;
    dateTo?: string;
    minQualityScore?: number;
    hasReview?: boolean;
    isPublished?: boolean;
    category?: string;
    tags?: string[];
    search?: string;
    page?: number;
    limit?: number;
    skip?: number; // Viene del getter de PaginationDto
  }): Promise<PaginatedResponse<GeneratedContentResponse>> {
    // Convertir strings a Date para buildFilterQuery
    const processedFilters: GeneratedContentFilters = {
      status: filters.status,
      agentId: filters.agentId,
      templateId: filters.templateId,
      providerId: filters.providerId,
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
      minQualityScore: filters.minQualityScore,
      hasReview: filters.hasReview,
      isPublished: filters.isPublished,
      category: filters.category,
      tags: filters.tags,
      search: filters.search,
    };

    const query = this.buildFilterQuery(processedFilters);

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100); // Max 100
    const skip = filters.skip || (page - 1) * limit;

    const [content, total] = await Promise.all([
      this.aiContentGenerationModel
        .find(query)
        .populate('originalContentId', 'title content sourceUrl publishedAt images')
        .populate('agentId', 'name agentType')
        .populate('templateId', 'name type')
        .populate('providerId', 'name model')
        .sort({ generatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.aiContentGenerationModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: content.map(item => this.toDetailedResponse(item)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * 🏷️ Obtener todas las categorías únicas de contenidos generados
   */
  async getCategories(): Promise<string[]> {
    const categories = await this.aiContentGenerationModel
      .distinct('generatedCategory')
      .exec();

    // Filtrar vacíos y ordenar alfabéticamente
    return categories
      .filter(cat => cat && cat.trim().length > 0)
      .sort();
  }

  /**
   * 🔍 Obtener contenido generado por ID
   */
  async findById(id: string): Promise<GeneratedContentResponse> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid content ID format');
    }

    const content = await this.aiContentGenerationModel
      .findById(id)
      .populate('originalContentId', 'title content sourceUrl publishedAt images')
      .populate('agentId', 'name agentType')
      .populate('templateId', 'name type')
      .populate('providerId', 'name model')
      .exec();

    if (!content) {
      throw new NotFoundException(`Generated content with ID ${id} not found`);
    }

    return this.toDetailedResponse(content);
  }

  /**
   * 🚀 Generar contenido AI desde noticia original
   */
  async generateContent(request: ContentGenerationRequest): Promise<GeneratedContentResponse> {
    this.logger.log(`Starting content generation for ${request.contentIds.length} items`);

    // Validar que solo sea un contenido para generación directa
    if (request.contentIds.length !== 1) {
      throw new BadRequestException('Direct generation supports only one content ID. Use batch generation for multiple items.');
    }

    const contentId = request.contentIds[0];

    // Obtener contenido original
    const originalContent = await this.extractedNoticiaModel.findById(contentId).exec();
    if (!originalContent) {
      throw new NotFoundException(`Original content with ID ${contentId} not found`);
    }

    // Obtener agente, template y proveedor
    const agent = await this.contentAgentService.findById(request.agentId);
    const template = await this.promptTemplateService.findById(request.templateId);

    const provider = request.providerId
      ? this.providerFactory.getProvider(request.providerId)
      : await this.providerFactory.getOptimalProvider({
          maxTokens: template.configuration?.maxTokens || 4000,
          requiresStreaming: false,
          preferredProviders: template.compatibleProviders,
        });

    try {
      // Preparar contexto para generación
      const context = this.prepareGenerationContext(originalContent, agent as ContentAgentDocument, template as unknown as { systemPrompt: string; promptTemplate: string; [key: string]: unknown }, request.customPromptVars);

      const startTime = Date.now();

      // Ejecutar generación
      const response = await provider.generateContent({
        systemPrompt: context.systemPrompt,
        userPrompt: context.userPrompt,
        maxTokens: template.configuration?.maxTokens || 4000,
        temperature: template.configuration?.temperature || 0.85,
        topP: template.configuration?.topP,
        frequencyPenalty: template.configuration?.frequencyPenalty || 0.3,
        presencePenalty: template.configuration?.presencePenalty || 0.3,
      });

      const processingTime = Date.now() - startTime;
      const cost = provider.calculateCost(response.usage);

      // Parsear contenido generado
      const parsedContent = this.parseGeneratedContent(response.content, template.outputFormat as unknown as { [key: string]: unknown });

      // Crear registro en DB
      const generationData: CreateGeneratedContentRequest = {
        originalContentId: contentId,
        agentId: request.agentId,
        templateId: request.templateId,
        providerId: provider.providerName,
        generatedTitle: (parsedContent.title as string) || originalContent.title || 'Sin título',
        generatedContent: parsedContent.content as string || response.content,
        generatedKeywords: parsedContent.keywords as string[] || [],
        generatedTags: parsedContent.tags as string[] || [],
        generatedCategory: parsedContent.category as string,
        generatedSummary: parsedContent.summary as string,
        generationMetadata: {
          model: response.model,
          promptTokens: response.usage.promptTokens,
          completionTokens: response.usage.completionTokens,
          totalTokens: response.usage.totalTokens,
          cost,
          processingTime,
          temperature: template.configuration?.temperature || 0.7,
          maxTokens: template.configuration?.maxTokens || 2000,
          finishReason: response.finishReason,
        },
      };

      const savedContent = await this.create(generationData);

      // Actualizar métricas de template y provider
      await Promise.all([
        this.promptTemplateService.updateQualityMetrics(request.templateId, {
          processingTime,
          success: true,
        }),
        this.aiProviderService.updateUsageStats(provider.providerName, {
          requests: 1,
          tokens: response.usage.totalTokens,
          cost,
        }),
      ]);

      this.logger.log(`Content generation completed successfully for ${contentId}`);
      return savedContent;

    } catch (error) {
      this.logger.error(`Content generation failed for ${contentId}: ${error.message}`, error.stack);

      // Actualizar métricas de error
      await this.promptTemplateService.updateQualityMetrics(request.templateId, {
        success: false,
      });

      throw new BadRequestException(`Content generation failed: ${error.message}`);
    }
  }

  /**
   * 📦 Generación en batch (múltiples contenidos)
   */
  async generateBatch(request: ContentGenerationRequest): Promise<{
    successCount: number;
    failureCount: number;
    results: Array<{ contentId: string; success: boolean; result?: GeneratedContentResponse; error?: string }>;
  }> {
    this.logger.log(`Starting batch generation for ${request.contentIds.length} items`);

    const results: Array<{ contentId: string; success: boolean; result?: GeneratedContentResponse; error?: string }> = [];
    let successCount = 0;
    let failureCount = 0;

    for (const contentId of request.contentIds) {
      try {
        const singleRequest: ContentGenerationRequest = {
          ...request,
          contentIds: [contentId],
        };

        const result = await this.generateContent(singleRequest);
        results.push({
          contentId,
          success: true,
          result,
        });
        successCount++;

        // Delay entre generaciones para respetar rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        results.push({
          contentId,
          success: false,
          error: error.message,
        });
        failureCount++;
      }
    }

    this.logger.log(`Batch generation completed: ${successCount} success, ${failureCount} failures`);

    return {
      successCount,
      failureCount,
      results,
    };
  }

  /**
   * 🆕 Crear contenido generado manualmente
   */
  async create(createContentDto: CreateGeneratedContentRequest): Promise<GeneratedContentResponse> {
    const createdContent = new this.aiContentGenerationModel({
      ...createContentDto,
      status: 'completed',
      generatedAt: new Date(),
      versioning: {
        version: 1,
        isLatest: true,
      },
    });

    const savedContent = await createdContent.save();
    this.logger.log(`Created new generated content: ${savedContent._id}`);

    return this.findById((savedContent._id as Types.ObjectId).toString());
  }

  /**
   * 🔄 Actualizar contenido generado
   */
  async update(id: string, updateContentDto: UpdateGeneratedContentRequest): Promise<GeneratedContentResponse> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid content ID format');
    }

    const content = await this.aiContentGenerationModel.findById(id).exec();
    if (!content) {
      throw new NotFoundException(`Generated content with ID ${id} not found`);
    }

    // Si se actualiza el contenido, crear nueva versión
    if (updateContentDto.generatedContent || updateContentDto.generatedTitle) {
      // Marcar versión actual como no latest
      await this.aiContentGenerationModel.updateMany(
        { originalContentId: content.originalContentId, 'versioning.isLatest': true },
        { 'versioning.isLatest': false }
      ).exec();

      // Actualizar con nueva versión
      const versioningUpdate = {
        version: (content.versioning?.version || 1) + 1,
        previousVersionId: (content._id as Types.ObjectId).toString(),
        changeLog: `Updated at ${new Date().toISOString()}`,
        isLatest: true,
      };

      updateContentDto = {
        ...updateContentDto,
        versioning: versioningUpdate,
      };
    }

    const updatedContent = await this.aiContentGenerationModel
      .findByIdAndUpdate(id, updateContentDto, { new: true })
      .exec();

    this.logger.log(`Updated generated content: ${updatedContent!._id}`);
    return this.findById(id);
  }

  /**
   * 🗑️ Eliminar contenido generado
   */
  async delete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid content ID format');
    }

    const content = await this.aiContentGenerationModel.findById(id).exec();
    if (!content) {
      throw new NotFoundException(`Generated content with ID ${id} not found`);
    }

    await this.aiContentGenerationModel.findByIdAndDelete(id).exec();
    this.logger.log(`Deleted generated content: ${id}`);
  }

  /**
   * 📊 Obtener estadísticas de contenido generado
   */
  async getStats(timeframe: 'day' | 'week' | 'month' = 'month'): Promise<GeneratedContentStats> {
    const dateFilter = this.getDateFilter(timeframe);

    const [
      statusStats,
      agentStats,
      templateStats,
      providerStats,
      qualityMetrics,
      costMetrics
    ] = await Promise.all([
      this.getStatusStats(dateFilter),
      this.getAgentStats(dateFilter),
      this.getTemplateStats(dateFilter),
      this.getProviderStats(dateFilter),
      this.getQualityMetrics(dateFilter),
      this.getCostMetrics(dateFilter),
    ]);

    return {
      totalGenerated: Object.values(statusStats).reduce((sum, count) => sum + count, 0),
      byStatus: statusStats,
      byAgent: agentStats,
      byTemplate: templateStats,
      byProvider: providerStats,
      averageQuality: qualityMetrics.averageQuality,
      totalCost: costMetrics.totalCost,
      averageProcessingTime: qualityMetrics.averageProcessingTime,
      successRate: qualityMetrics.successRate,
    };
  }

  /**
   * 🎨 Preparar contexto para generación
   */
  private prepareGenerationContext(
    originalContent: ExtractedNoticiaDocument,
    agent: ContentAgentDocument,
    template: { systemPrompt: string; promptTemplate: string; [key: string]: unknown },
    customVars?: Record<string, string>
  ): { systemPrompt: string; userPrompt: string } {
    // Variables base del contenido original
    const baseVariables = {
      title: originalContent.title || 'Sin título',
      content: originalContent.content || '',
      author: originalContent.author || 'Desconocido',
      sourceUrl: originalContent.sourceUrl,
      publishedAt: originalContent.publishedAt?.toISOString() || '',
      domain: originalContent.domain || '',
      categories: originalContent.categories.join(', '),
      tags: originalContent.tags.join(', '),
      excerpt: originalContent.excerpt || '',
    };

    // Combinar con variables custom
    const allVariables = { ...baseVariables, ...(customVars || {}) };

    // Renderizar system prompt
    const systemPrompt = this.renderTemplate(template.systemPrompt as string, allVariables);

    // Renderizar user prompt
    const userPrompt = this.renderTemplate(template.promptTemplate as string, allVariables);

    return { systemPrompt, userPrompt };
  }

  /**
   * 🎨 Renderizar template con variables
   */
  private renderTemplate(template: string, variables: Record<string, string>): string {
    let rendered = template;

    for (const [key, value] of Object.entries(variables)) {
      const variableRegex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      rendered = rendered.replace(variableRegex, value || '');
    }

    return rendered;
  }

  /**
   * 📄 Parsear contenido generado
   */
  private parseGeneratedContent(content: string, outputFormat: { [key: string]: unknown }): Record<string, unknown> {
    try {
      // Intentar parsear como JSON
      return JSON.parse(content);
    } catch {
      // Fallback a parsing básico
      const parsed: Record<string, unknown> = {};

      // Extraer título
      if (outputFormat.title) {
        const titleMatch = content.match(/^(.+)$/m);
        if (titleMatch) {
          parsed.title = titleMatch[1].trim();
        }
      }

      parsed.content = content;

      // Generar keywords básicos
      if (outputFormat.keywords) {
        const words = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
        const uniqueWords = [...new Set(words)].slice(0, 5);
        parsed.keywords = uniqueWords;
      }

      return parsed;
    }
  }

  /**
   * 🔍 Construir query de filtros
   */
  private buildFilterQuery(filters: GeneratedContentFilters): Record<string, unknown> {
    const query: Record<string, unknown> = {};

    if (filters.status && filters.status.length > 0) {
      query.status = { $in: filters.status };
    }

    if (filters.agentId) {
      query.agentId = filters.agentId;
    }

    if (filters.templateId) {
      query.templateId = filters.templateId;
    }

    if (filters.providerId) {
      query.providerId = filters.providerId;
    }

    if (filters.dateFrom || filters.dateTo) {
      const dateQuery: Record<string, Date> = {};
      if (filters.dateFrom) {
        dateQuery.$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        dateQuery.$lte = filters.dateTo;
      }
      query.generatedAt = dateQuery;
    }

    if (filters.minQualityScore) {
      query['qualityMetrics.humanReviewScore'] = { $gte: filters.minQualityScore };
    }

    if (filters.hasReview !== undefined) {
      if (filters.hasReview) {
        query['reviewInfo.reviewerId'] = { $exists: true };
      } else {
        query['reviewInfo.reviewerId'] = { $exists: false };
      }
    }

    if (filters.isPublished !== undefined) {
      if (filters.isPublished) {
        query['publishingInfo.publishedAt'] = { $exists: true };
      } else {
        query['publishingInfo.publishedAt'] = { $exists: false };
      }
    }

    if (filters.category) {
      query.generatedCategory = filters.category;
    }

    if (filters.tags && filters.tags.length > 0) {
      query.generatedTags = { $all: filters.tags };
    }

    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { generatedTitle: searchRegex },
        { generatedContent: searchRegex },
        { generatedSummary: searchRegex },
      ];
    }

    return query;
  }

  /**
   * 📅 Obtener filtro de fecha
   */
  private getDateFilter(timeframe: 'day' | 'week' | 'month'): Date {
    const now = new Date();
    switch (timeframe) {
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  // Métodos de estadísticas privados
  private async getStatusStats(dateFilter: Date): Promise<Record<GenerationStatus, number>> {
    const pipeline = [
      { $match: { generatedAt: { $gte: dateFilter } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ];

    const results = await this.aiContentGenerationModel.aggregate(pipeline).exec();

    const statusStats: Record<GenerationStatus, number> = {
      pending: 0,
      generating: 0,
      completed: 0,
      failed: 0,
      reviewing: 0,
      approved: 0,
      rejected: 0,
    };

    results.forEach(result => {
      statusStats[result._id as GenerationStatus] = result.count;
    });

    return statusStats;
  }

  private async getAgentStats(dateFilter: Date): Promise<Record<string, number>> {
    const pipeline = [
      { $match: { generatedAt: { $gte: dateFilter } } },
      { $group: { _id: '$agentId', count: { $sum: 1 } } }
    ];

    const results = await this.aiContentGenerationModel.aggregate(pipeline).exec();
    const stats: Record<string, number> = {};

    results.forEach(result => {
      stats[result._id] = result.count;
    });

    return stats;
  }

  private async getTemplateStats(dateFilter: Date): Promise<Record<string, number>> {
    const pipeline = [
      { $match: { generatedAt: { $gte: dateFilter } } },
      { $group: { _id: '$templateId', count: { $sum: 1 } } }
    ];

    const results = await this.aiContentGenerationModel.aggregate(pipeline).exec();
    const stats: Record<string, number> = {};

    results.forEach(result => {
      stats[result._id] = result.count;
    });

    return stats;
  }

  private async getProviderStats(dateFilter: Date): Promise<Record<string, number>> {
    const pipeline = [
      { $match: { generatedAt: { $gte: dateFilter } } },
      { $group: { _id: '$providerId', count: { $sum: 1 } } }
    ];

    const results = await this.aiContentGenerationModel.aggregate(pipeline).exec();
    const stats: Record<string, number> = {};

    results.forEach(result => {
      stats[result._id] = result.count;
    });

    return stats;
  }

  private async getQualityMetrics(dateFilter: Date): Promise<{
    averageQuality: number;
    averageProcessingTime: number;
    successRate: number;
  }> {
    const pipeline = [
      { $match: { generatedAt: { $gte: dateFilter } } },
      {
        $group: {
          _id: null,
          avgQuality: { $avg: '$qualityMetrics.humanReviewScore' },
          avgProcessingTime: { $avg: '$generationMetadata.processingTime' },
          totalCount: { $sum: 1 },
          successCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          }
        }
      }
    ];

    const results = await this.aiContentGenerationModel.aggregate(pipeline).exec();

    if (results.length === 0) {
      return { averageQuality: 0, averageProcessingTime: 0, successRate: 0 };
    }

    const result = results[0];
    return {
      averageQuality: result.avgQuality || 0,
      averageProcessingTime: result.avgProcessingTime || 0,
      successRate: result.totalCount > 0 ? result.successCount / result.totalCount : 0,
    };
  }

  private async getCostMetrics(dateFilter: Date): Promise<{ totalCost: number }> {
    const pipeline = [
      { $match: { generatedAt: { $gte: dateFilter } } },
      {
        $group: {
          _id: null,
          totalCost: { $sum: '$generationMetadata.cost' }
        }
      }
    ];

    const results = await this.aiContentGenerationModel.aggregate(pipeline).exec();

    return {
      totalCost: results.length > 0 ? results[0].totalCost || 0 : 0,
    };
  }

  /**
   * 🔄 Convertir a response detallado
   */
  private toDetailedResponse(content: AIContentGenerationDocument): GeneratedContentResponse {
    // Obtener datos poblados correctamente
    const originalContent = content.populated('originalContentId')
      ? (content.originalContentId as unknown as { title: string; content: string; sourceUrl: string; publishedAt: Date; images?: string[] })
      : null;

    const agent = content.populated('agentId')
      ? (content.agentId as unknown as { name: string; agentType: string })
      : null;

    const template = content.populated('templateId')
      ? (content.templateId as unknown as { name: string; type: string })
      : null;

    const provider = content.populated('providerId')
      ? (content.providerId as unknown as { name: string; model: string })
      : null;

    return {
      id: (content._id as Types.ObjectId).toString(),
      originalContent: {
        id: content.originalContentId?.toString() || '',
        title: originalContent?.title || content.originalTitle || '',
        content: originalContent?.content || content.originalContent || '',
        sourceUrl: originalContent?.sourceUrl || content.originalSourceUrl || '',
        publishedAt: originalContent?.publishedAt || new Date(),
        images: originalContent?.images || [],
      },
      agent: {
        id: content.agentId?.toString() || '',
        name: agent?.name || '',
        type: agent?.agentType || '',
      },
      template: {
        id: content.templateId?.toString() || '',
        name: template?.name || '',
        type: template?.type || '',
      },
      provider: {
        id: content.providerId?.toString() || '',
        name: provider?.name || '',
        model: provider?.model || '',
      },
      generatedTitle: content.generatedTitle,
      generatedContent: content.generatedContent,
      generatedKeywords: content.generatedKeywords,
      generatedTags: content.generatedTags,
      generatedCategory: content.generatedCategory,
      generatedSummary: content.generatedSummary,
      status: content.status,
      generationMetadata: content.generationMetadata,
      qualityMetrics: content.qualityMetrics,
      comparisonMetrics: content.comparisonMetrics,
      errors: content.errors,
      warnings: content.warnings,
      reviewInfo: content.reviewInfo ? {
        reviewerId: content.reviewInfo.reviewerId?.toString(),
        reviewedAt: content.reviewInfo.reviewedAt,
        reviewNotes: content.reviewInfo.reviewNotes,
        changesRequested: content.reviewInfo.changesRequested,
        approvalLevel: content.reviewInfo.approvalLevel,
      } : undefined,
      publishingInfo: content.publishingInfo ? {
        publishedAt: content.publishingInfo.publishedAt,
        publishedBy: content.publishingInfo.publishedBy?.toString(),
        platform: content.publishingInfo.platform,
        url: content.publishingInfo.url,
        socialShares: content.publishingInfo.socialShares,
        views: content.publishingInfo.views,
      } : undefined,
      versioning: content.versioning ? {
        version: content.versioning.version,
        previousVersionId: content.versioning.previousVersionId?.toString(),
        changeLog: content.versioning.changeLog,
        isLatest: content.versioning.isLatest,
      } : undefined,
      generatedAt: content.generatedAt,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
    };
  }

  // ==================== NEWS TO CONTENT SPECIFIC METHODS (NEW) ====================


  /**
   * 🔧 Preparar prompt usando template con variables específicas
   */
  private preparePromptFromTemplate(template: any, variables: Record<string, string>): string {
    // Prompt optimizado basado en mejores prácticas 2025
    const optimizedPrompt = `Eres Jarvis, el asistente editorial de Pachuca Noticias, especializado en transformar noticias en contenido editorial estructurado de alta calidad.

<thinking>
Voy a procesar esta noticia siguiendo estos pasos:
1. Extraer TODOS los hechos relevantes del input
2. Identificar personajes, fechas, lugares, cifras, declaraciones
3. Determinar múltiples ángulos editoriales posibles
4. Crear título ÚNICO y CREATIVO usando técnicas de variación
5. Desarrollar contenido EXTENSO y DETALLADO
6. Generar keywords y tags basados en el contenido real
7. Crear copys sociales con hooks únicos y llamativos
</thinking>

🎯 REGLAS CRÍTICAS PARA TÍTULOS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ TÉCNICAS DE VARIACIÓN OBLIGATORIAS:
• Usa SINÓNIMOS creativos (no repetir palabras comunes)
• Alterna estructuras: pregunta, afirmación, revelación, contraste
• Varía longitud: cortos impactantes vs descriptivos detallados
• Cambia el foco: protagonista, acción, resultado, contexto
• Experimenta con formatos: números, citas, metáforas

❌ EVITAR SIEMPRE:
• Títulos genéricos tipo "Se realiza evento en..."
• Comenzar con "El", "La", "Los", "Las" (busca alternativas)
• Estructuras repetitivas como "X hace Y en Z"
• Palabras trilladas: "importante", "relevante", "significativo"

📊 EJEMPLOS DE VARIACIÓN:
MALO: "Alcalde inaugura nueva biblioteca en Pachuca"
BUENO: "Pachuca estrena espacio cultural con 50 mil libros"
MEJOR: "50 mil libros encuentran nuevo hogar en el corazón de Pachuca"

MALO: "Aumentan precios de gasolina en la región"
BUENO: "Combustibles registran alza histórica del 15%"
MEJOR: "Tanque lleno costará $200 pesos más desde mañana"

🔥 TÉCNICAS AVANZADAS DE TITULACIÓN:
• Power words: revelar, transformar, impulsar, desafiar
• Números específicos: "73%" mejor que "la mayoría"
• Tiempo presente activo: "conquista" vs "conquistó"
• Beneficio directo: "Así te afecta..." "Lo que significa para ti..."
• Intriga calculada: revelar 80%, ocultar 20% clave

📝 REGLAS PARA CONTENIDO EXTENSO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXTENSIÓN MÍNIMA OBLIGATORIA: 800-1200 palabras

ESTRUCTURA DETALLADA (distribución de palabras):
1. LEAD/ENTRADA (100-150 palabras)
   • Hook potente + contexto inmediato
   • Responder: qué, quién, cuándo, dónde
   • Dato más impactante al inicio

2. DESARROLLO CONTEXTUAL (200-300 palabras)
   • Antecedentes del tema
   • Por qué es relevante ahora
   • Conexión con eventos actuales
   • Comparación con situaciones similares

3. CUERPO PRINCIPAL (300-400 palabras)
   • Detalles específicos del evento
   • Declaraciones y citas (inventadas pero verosímiles)
   • Datos, cifras, estadísticas
   • Múltiples perspectivas del tema

4. ANÁLISIS DE IMPACTO (150-200 palabras)
   • Consecuencias inmediatas
   • Efectos a mediano plazo
   • Quiénes se ven afectados
   • Beneficios y riesgos

5. PROYECCIÓN Y CIERRE (100-150 palabras)
   • Próximos pasos esperados
   • Qué seguir monitoreando
   • Llamado a la acción o reflexión
   • Conexión con el futuro de Pachuca

TÉCNICAS DE EXPANSIÓN:
• Agrega contexto histórico relevante
• Incluye comparaciones con otras ciudades/países
• Desarrolla múltiples ejemplos concretos
• Crea mini-historias dentro del artículo
• Usa transiciones elaboradas entre párrafos
• Incluye datos complementarios y estadísticas
• Desarrolla el "por qué importa" en profundidad

TRANSFORMACIÓN EDITORIAL:
• PROHIBIDO copiar párrafos del original
• REQUERIDO reinterpretar con nueva estructura
• OBLIGATORIO cambiar el ángulo narrativo
• Máximo 15% de palabras idénticas al original
• Crear nueva voz editorial distintiva

🎨 FÓRMULAS PARA REDES SOCIALES MEJORADAS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FACEBOOK - Fórmula AIDA PLUS:
• Hook: Pregunta provocativa o estadística sorprendente
• Contexto: 2-3 líneas que amplían el hook
• Beneficio personal: "Esto significa que tú..."
• Prueba social: "Miles ya están..."
• CTA específico con urgencia

TWITTER - Técnicas Virales 2025:
• Primera línea = mini-titular impactante
• Segunda línea = dato concreto verificable
• Tercera línea = implicación personal
• Cuarta línea = pregunta de engagement
• Hashtag local + trending topic

INSTAGRAM - Estructura Scroll-Stopper:
• Emoji + declaración controversial (con respeto)
• Párrafo de contexto con espacios
• 3-5 bullets con datos clave
• Historia personal o anécdota
• CTA genuino sin presión
• Mix hashtags: 3 locales + 3 temáticos + 2 trending

TÍTULO DE LA NOTICIA:
${variables.title}

CONTENIDO DE LA NOTICIA A PROCESAR:
${variables.content}

${variables.referenceContent ? `CONTENIDO DE REFERENCIA:\n${variables.referenceContent}\n` : ''}

REQUISITOS DEL JSON - TODOS LOS CAMPOS SON OBLIGATORIOS:
{
  "title": "Título CREATIVO y ÚNICO usando técnicas de variación, 10-15 palabras, evitando estructuras comunes",
  "content": "Artículo COMPLETO de 800-1200 palabras con estructura detallada, múltiples párrafos, transiciones fluidas, contexto amplio, análisis profundo",
  "keywords": ["mínimo 8 keywords específicas extraídas del contenido", "variadas", "no genéricas"],
  "tags": ["mínimo 5 tags temáticos relevantes", "específicos", "categorizados"],
  "category": "deportes|política|cultura|economía|tecnología|salud|seguridad|educación|medio ambiente|entretenimiento",
  "summary": "Resumen ejecutivo de 3-4 líneas con los puntos más importantes y datos específicos",
  "extended_summary": "Resumen detallado de 5-7 párrafos para reportes ejecutivos, incluyendo contexto, desarrollo, impacto y proyecciones",
  "social_media_copies": {
    "facebook": "Post CREATIVO de 80-120 palabras con hook único, desarrollo engaging, beneficio claro, CTA específico, 2-3 emojis estratégicos",
    "twitter": "Tweet de 230-270 caracteres con hook potente, dato verificable, pregunta de engagement, 1-2 hashtags relevantes",
    "instagram": "Caption de 150-200 palabras con hook visual, bullets informativos, mini-historia, CTA genuino, 8-10 hashtags mixtos",
    "linkedin": "Post profesional de 100-150 palabras con perspectiva de negocio, datos del sector, análisis objetivo, 3-5 hashtags profesionales"
  },
  "seo_data": {
    "meta_description": "Descripción SEO de 155-160 caracteres con keyword principal y llamada a la acción",
    "focus_keyword": "Keyword principal más relevante del contenido",
    "secondary_keywords": ["3-5 keywords secundarias de soporte"],
    "alt_text": "Descripción de imagen relevante de 100-125 caracteres"
  },
  "metadata": {
    "extracted_facts": ["mínimo 5 hechos textuales específicos"],
    "key_people": ["todos los nombres mencionados con sus cargos"],
    "locations": ["todos los lugares específicos con detalles"],
    "dates": ["todas las fechas y períodos temporales"],
    "numbers": ["todas las cifras, porcentajes y cantidades"],
    "quotes": ["citas textuales o declaraciones relevantes"]
  }
}

⚠️ VALIDACIONES FINALES:
• Título debe ser DIFERENTE en estructura a títulos anteriores
• Contenido MÍNIMO 800 palabras (contar antes de enviar)
• Keywords MÍNIMO 8 elementos únicos
• Copys sociales deben usar hooks DIFERENTES
• NO dejar arrays vacíos
• NO usar plantillas genéricas

RESPONDE ÚNICAMENTE CON EL JSON VÁLIDO. NO INCLUYAS EXPLICACIONES.`;

    return optimizedPrompt;
  }

  /**
   * ✅ Validar y parsear respuesta del AI
   */
  private parseAndValidateResponse(content: string, expectedFormat: any): any {
    try {
      // Limpiar respuesta (remover markdown, espacios extra, etc.)
      const cleanContent = content
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .replace(/```/g, '')
        .replace(/\n```/g, '')
        .replace(/```\n/g, '')
        .trim();

      this.logger.log(`🔍 Contenido AI limpiado: ${cleanContent.substring(0, 200)}...`);

      const parsed = JSON.parse(cleanContent);

      // Validar que contiene los campos obligatorios
      const requiredFields = ['title', 'content', 'keywords', 'tags', 'category', 'summary'];
      for (const field of requiredFields) {
        if (!parsed[field]) {
          throw new Error(`Campo obligatorio faltante: ${field}`);
        }
      }

      // Validar tipos de datos
      if (typeof parsed.title !== 'string' || parsed.title.trim().length === 0) {
        throw new Error('Title debe ser un string no vacío');
      }

      if (typeof parsed.content !== 'string' || parsed.content.trim().length === 0) {
        throw new Error('Content debe ser un string no vacío');
      }

      if (!Array.isArray(parsed.keywords) || parsed.keywords.length === 0) {
        throw new Error('Keywords debe ser un array no vacío con al menos 3 elementos');
      }

      if (!Array.isArray(parsed.tags) || parsed.tags.length === 0) {
        throw new Error('Tags debe ser un array no vacío con al menos 2 elementos');
      }

      // Validar copys de redes sociales
      if (!parsed.social_media_copies || typeof parsed.social_media_copies !== 'object') {
        throw new Error('social_media_copies es obligatorio y debe ser un objeto');
      }

      if (!parsed.social_media_copies.facebook || !parsed.social_media_copies.twitter || !parsed.social_media_copies.instagram) {
        throw new Error('Faltan copys de redes sociales: facebook, twitter, instagram son obligatorios');
      }

      if (typeof parsed.category !== 'string' || parsed.category.trim().length === 0) {
        throw new Error('Category debe ser un string no vacío');
      }

      if (typeof parsed.summary !== 'string' || parsed.summary.trim().length === 0) {
        throw new Error('Summary debe ser un string no vacío');
      }

      // Validar que no sea contenido genérico
      const genericPhrases = [
        'título de la noticia',
        'contenido de la noticia',
        'hechos verificables',
        'diferentes perspectivas'
      ];

      const lowerTitle = parsed.title.toLowerCase();
      const lowerContent = parsed.content.toLowerCase();

      for (const phrase of genericPhrases) {
        if (lowerTitle.includes(phrase) || lowerContent.includes(phrase)) {
          throw new Error(`Contenido genérico detectado: contiene "${phrase}". El AI debe usar información específica del input.`);
        }
      }

      return {
        title: parsed.title.trim(),
        content: parsed.content.trim(),
        keywords: parsed.keywords.filter((k: string) => k && k.trim().length > 0),
        tags: parsed.tags.filter((t: string) => t && t.trim().length > 0),
        category: parsed.category.trim(),
        summary: parsed.summary.trim(),
        social_media_copies: parsed.social_media_copies,
        seo_data: parsed.seo_data || {},
        metadata: parsed.metadata || {}
      };

    } catch (error) {
      this.logger.error(`❌ Error parseando respuesta AI: ${error.message}`);
      this.logger.debug(`Contenido problemático: ${content}`);
      throw new BadRequestException(`Respuesta del AI inválida: ${error.message}`);
    }
  }

  /**
   * 📊 Estimar tokens de un prompt
   */
  private estimateTokens(text: string): number {
    // Estimación aproximada: ~4 caracteres por token en promedio
    return Math.ceil(text.length / 4);
  }

  /**
   * 💰 Calcular costo de generación
   */
  private calculateCost(tokens: number, costPerToken: number): number {
    return tokens * costPerToken;
  }

  /**
   * 📰 Generar contenido directamente desde noticia (sin content ID)
   */
  async generateFromNews(request: {
    title: string;
    content: string;
    templateId: string;
    providerId?: string;
    referenceContent?: string;
    customPromptVars?: Record<string, string>;
  }): Promise<GeneratedContentResponse> {
    this.logger.log(`Starting news-to-content generation using template ${request.templateId}`);

    // Obtener template y proveedor
    const template = await this.promptTemplateService.findById(request.templateId);
    if (!template) {
      throw new NotFoundException(`Template with ID ${request.templateId} not found`);
    }

    // Si no se especifica provider, usar el primer provider disponible del sistema
    let providerId: string;
    if (request.providerId) {
      providerId = request.providerId;
    } else {
      // Obtener el primer provider activo disponible
      const availableProviders = await this.aiProviderService.findAll();
      if (availableProviders.length === 0) {
        throw new NotFoundException('No hay providers AI disponibles en el sistema');
      }

      this.logger.log(`Available providers: ${JSON.stringify(availableProviders.map(p => ({ id: p.id, name: p.name })))}`);
      providerId = availableProviders[0].id;
      this.logger.log(`Selected provider ID: ${providerId} (type: ${typeof providerId})`);
    }

    this.logger.log(`Using provider ID: ${providerId}`);

    const provider = await this.aiProviderService.findById(providerId);
    if (!provider) {
      throw new NotFoundException(`AI Provider with ID ${providerId} not found`);
    }

    // Preparar variables del prompt
    const promptVars = {
      title: request.title,
      content: request.content,
      referenceContent: request.referenceContent || '',
      ...request.customPromptVars
    };

    // Construir prompt dinámico usando el template
    const dynamicPrompt = this.preparePromptFromTemplate(template, promptVars);

    const startTime = Date.now();
    let result: any;

    try {
      // Obtener factory provider para ejecutar generación
      const providerInstance = await this.providerFactory.getOptimalProvider({
        maxTokens: this.estimateTokens(dynamicPrompt),
        preferredProviders: [provider.id],
      });

      if (!providerInstance) {
        throw new Error(`Provider ${provider.id} not available`);
      }

      // Ejecutar generación con IA
      const aiResponse = await providerInstance.generateContent({
        systemPrompt: template.systemPrompt,
        userPrompt: dynamicPrompt,
        maxTokens: Math.min(provider.maxTokens, 4000), // Limitar a 4000 tokens
        temperature: provider.temperature,
        stopSequences: [],
      });

      result = this.parseAndValidateResponse(aiResponse.content, template.staticOutputFormat || {});

      // Calcular métricas
      const processingTime = Date.now() - startTime;
      const tokensUsed = aiResponse.usage?.totalTokens || this.estimateTokens(dynamicPrompt + JSON.stringify(result));
      const cost = providerInstance.calculateCost({
        promptTokens: aiResponse.usage?.promptTokens || Math.floor(tokensUsed * 0.7),
        completionTokens: aiResponse.usage?.completionTokens || Math.floor(tokensUsed * 0.3)
      });

      // Guardar contenido generado con el contenido original incluido
      const savedContent = new this.aiContentGenerationModel({
        generatedTitle: result.title || `Contenido generado desde: ${request.title.substring(0, 50)}...`,
        generatedContent: result.content || '',
        generatedKeywords: result.keywords || [],
        generatedTags: result.tags || [],
        generatedCategory: result.category || 'general',
        generatedSummary: result.summary || '',
        extendedSummary: result.extended_summary || '',
        socialMediaCopies: result.social_media_copies || {},
        seoData: result.seo_data || {},
        extractedMetadata: result.metadata || {},
        // Guardar el contenido original directamente en el documento
        originalTitle: request.title,
        originalContent: request.content,
        originalSourceUrl: request.referenceContent ? 'reference-content' : 'direct-generation',
        originalContentId: null, // Sin referencia externa
        agentId: request.templateId, // Usar template como agent
        templateId: request.templateId,
        providerId: provider.id,
        generationMetadata: {
          promptTokens: aiResponse.usage?.promptTokens || Math.floor(tokensUsed * 0.7),
          completionTokens: aiResponse.usage?.completionTokens || Math.floor(tokensUsed * 0.3),
          totalTokens: tokensUsed,
          cost: cost,
          processingTime,
          model: provider.model,
          temperature: provider.temperature,
          maxTokens: provider.maxTokens
        },
        qualityMetrics: {
          relevanceScore: 0.8, // Default score
          coherenceScore: 0.8,
          originalityScore: 0.8,
          overallScore: 0.8,
          keywordDensity: 0.05,
          readabilityScore: 0.8
        },
        status: 'completed',
        generatedAt: new Date()
      });

      const saved = await savedContent.save();

      // Actualizar estadísticas del proveedor
      await this.aiProviderService.updateUsageStats(provider.id, {
        requests: 1,
        tokens: tokensUsed,
        cost: cost
      });

      return this.toDetailedResponse(saved);

    } catch (error) {
      this.logger.error(`Failed to generate content from news: ${error.message}`, error.stack);
      throw new BadRequestException(`Content generation failed: ${error.message}`);
    }
  }
}