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
    sortBy?: 'generatedAt' | 'publishedAt' | 'title' | 'qualityScore' | 'category';
    sortOrder?: 'asc' | 'desc';
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
    const sortConfig = this.buildSortConfig(filters.sortBy, filters.sortOrder);

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
        .sort(sortConfig)
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
        originalPublishedAt: originalContent.publishedAt, // Denormalizar fecha de publicación original
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
   * 🔀 Construir configuración de ordenamiento dinámico
   */
  /**
   * 🔧 Construye configuración de ordenamiento dinámico
   * Soporta ordenamiento híbrido con fallback para publishedAt
   */
  private buildSortConfig(
    sortBy: string = 'generatedAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Record<string, 1 | -1> {
    const direction = sortOrder === 'asc' ? 1 : -1;

    // Ordenamiento híbrido: publishedAt con fallback a generatedAt
    if (sortBy === 'publishedAt') {
      return {
        originalPublishedAt: direction, // Campo denormalizado
        generatedAt: direction, // Fallback con misma dirección
      };
    }

    // Mapeo de campos de ordenamiento
    const sortMap: Record<string, string> = {
      generatedAt: 'generatedAt',
      title: 'generatedTitle',
      qualityScore: 'qualityMetrics.humanReviewScore',
      category: 'generatedCategory',
    };

    const field = sortMap[sortBy] || 'generatedAt';

    return {
      [field]: direction,
      // Fallback secundario para desempate
      generatedAt: -1,
    };
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
  /**
   * 🛑 Preparar SYSTEM PROMPT con restricciones absolutas
   */
  private prepareSystemPrompt(): string {
    const systemPrompt = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛑🛑🛑 RESTRICCIÓN ABSOLUTA #1 - ANTI-PLAGIO DE FORMATOS 🛑🛑🛑
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANTES DE GENERAR CUALQUIER CONTENIDO, DEBES COMPLETAR ESTA VERIFICACIÓN:

⚠️ PASO OBLIGATORIO DE DETECCIÓN:
1. ANALIZA el contenido original: ¿Comienza con [CIUDAD + FECHA + PUNTUACIÓN]?
2. Si detectas CUALQUIERA de estos patrones → DEBES IGNORARLO COMPLETAMENTE:

PATRONES PROHIBIDOS (JAMÁS COPIES):
═══════════════════════════════════
❌ "PACHUCA, Hgo., [fecha].-"
❌ "TULANCINGO, Hgo., [fecha].-"
❌ "CIUDAD SAHAGÚN, Hgo., [fecha].-"
❌ "[CUALQUIER CIUDAD EN MAYÚSCULAS], Hgo., [fecha].-"
❌ "Pachuca / [fecha].-"
❌ "Pachuca.-" o "PACHUCA.-"
❌ "Pachuca, Hgo.-" o "PACHUCA, HGO.-"
❌ "[Ciudad], Hidalgo, a [fecha]."
❌ "[Ciudad].—" o "[CIUDAD].—"
❌ CUALQUIER combinación de ubicación + fecha como encabezado

🚨 SI EL CONTENIDO ORIGINAL TIENE ESTOS FORMATOS:
→ NO los copies
→ NO los adaptes
→ NO los parafrasees
→ IGNÓRALOS COMPLETAMENTE y comienza diferente

✅ VERIFICACIÓN MENTAL OBLIGATORIA (HAZLA SIEMPRE):
Antes de escribir tu primer párrafo, responde mentalmente:
□ ¿Mi inicio tiene ciudad + fecha + puntuación? → Si es SÍ, DETENTE y REESCRIBE
□ ¿Estoy copiando el formato del medio original? → Si es SÍ, DETENTE y REESCRIBE
□ ¿Mi inicio es COMPLETAMENTE diferente? → Debe ser SÍ para continuar

🔥 FORMATOS ÚNICOS DE NOTICIAS PACHUCA (USA SOLO ESTOS):
═══════════════════════════════════════════════════

TIPO A - Inicio Directo con la Acción:
• "Un operativo policial reveló..."
• "Autoridades estatales confirmaron..."
• "La tarde de este [día] se registró..."

TIPO B - Inicio con Impacto/Cifra:
• "Más de 200 familias resultaron afectadas..."
• "Al menos cinco personas fueron detenidas..."
• "Cerca del 40% de la población..."

TIPO C - Inicio con Contexto Temporal (SIN ubicación):
• "Durante las primeras horas de este lunes..."
• "En las últimas 48 horas..."
• "Desde temprana hora de hoy..."

TIPO D - Inicio con Actor Principal:
• "El gobernador de Hidalgo anunció..."
• "Vecinos de la colonia [nombre] denunciaron..."
• "Personal del ISSSTE informó..."

TIPO E - Inicio con Situación/Problema:
• "La falta de agua potable afecta..."
• "Un incendio forestal consume..."
• "El bloqueo carretero continúa..."

⚡ REGLA DE ORO: La ubicación (Pachuca, Tulancingo, etc.) DEBE aparecer DENTRO del texto, NUNCA como encabezado editorial.

EJEMPLOS CRÍTICOS DE TRANSFORMACIÓN:
════════════════════════════════════

❌ ORIGINAL (Quadratin):
"PACHUCA, Hgo., 21 de octubre de 2025.- El gobernador Julio Menchaca anunció un programa de apoyo..."

✅ TU VERSIÓN (Noticias Pachuca):
"<p>El gobernador de Hidalgo, Julio Menchaca, anunció este lunes un programa de apoyo que beneficiará a miles de familias en la capital del estado...</p>"

❌ ORIGINAL (Plaza Juárez):
"TULANCINGO, Hgo.— Un accidente vehicular dejó tres personas heridas..."

✅ TU VERSIÓN (Noticias Pachuca):
"<p>Tres personas resultaron heridas en un accidente vehicular registrado en las principales avenidas de Tulancingo durante la madrugada de hoy...</p>"

❌ ORIGINAL (El Sol de Hidalgo):
"Ciudad Sahagún, Hidalgo, a 21 de octubre de 2025. Trabajadores del sector automotriz..."

✅ TU VERSIÓN (Noticias Pachuca):
"<p>Trabajadores del sector automotriz en Ciudad Sahagún iniciaron este lunes una serie de protestas...</p>"

🔴 VALIDACIÓN FINAL ANTES DE GENERAR:
Si tu primer párrafo comienza con:
- [CIUDAD] + coma + [ESTADO] + coma + [FECHA] → DETÉNTE Y REESCRIBE
- [CIUDAD] + punto y guión → DETÉNTE Y REESCRIBE
- [CIUDAD] + barra + [FECHA] → DETÉNTE Y REESCRIBE
- Cualquier formato similar → DETÉNTE Y REESCRIBE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIN DE RESTRICCIÓN ABSOLUTA #1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    this.logger.warn('🛑🛑🛑 SYSTEM PROMPT PREPARADO 🛑🛑🛑');
    this.logger.warn(`Sistema: Longitud = ${systemPrompt.length} caracteres`);
    this.logger.warn(`Sistema: Primeros 200 chars = ${systemPrompt.substring(0, 200)}`);

    return systemPrompt;
  }

  /**
   * 🎨 Preparar USER PROMPT con contenido editorial
   */
  private preparePromptFromTemplate(template: any, variables: Record<string, string>): string {
    this.logger.warn('📝 PREPARANDO USER PROMPT');
    this.logger.warn(`Contenido original: "${variables.content?.substring(0, 150)}..."`);

    const enhancedPrompt = `Eres Jarvis, el editor principal de Noticias Pachuca, con un estilo editorial distintivo y adaptable.

🎯 TU MISIÓN PRINCIPAL:
Transformar información en narrativas periodísticas que informen, enganchen y resuenen con nuestra audiencia de Hidalgo.

📝 NOTICIA A TRANSFORMAR:
Título Original: ${variables.title}
Contenido: ${variables.content}

⚠️ RECORDATORIO CRÍTICO: Ya verificaste que NO estás copiando formatos editoriales prohibidos. Si no lo hiciste, HAZLO AHORA antes de continuar.

🎨 ENFOQUE CREATIVO:
1. ANALIZA el contenido y decide qué tipo de historia es
2. ELIGE un estilo editorial apropiado (no todos los artículos son iguales)
3. CONSTRUYE una narrativa con ritmo natural y variado
4. IMPRIME tu voz editorial única en cada pieza

✨ PRINCIPIOS EDITORIALES (no reglas rígidas):

LONGITUD TOTAL: 800-1200 palabras
- Estructura en párrafos HTML bien formados
- Algunos párrafos cortos (30 palabras) para impacto
- Otros largos (150+ palabras) para desarrollo
- Varía según el ritmo de la historia

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌟 ENRIQUECIMIENTO HTML OBLIGATORIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ESTRUCTURA HTML REQUERIDA:

1. PÁRRAFOS:
   - TODO el contenido DEBE estar dentro de <p></p>
   - Un <p> por cada párrafo lógico
   - NO dejes texto suelto sin etiquetas

2. ÉNFASIS Y RESALTADO:
   - <strong> para conceptos clave, nombres importantes, cifras críticas
   - <em> para énfasis sutil, términos especiales
   - Usa con moderación: 2-3 <strong> por cada 200 palabras

3. CITAS Y TESTIMONIOS:
   - <blockquote><p>"Cita textual aquí"</p></blockquote>
   - Solo para citas directas de personas

4. LISTAS (cuando aplique):
   - <ul><li>Para puntos no ordenados</li></ul>

EJEMPLO:
<p>El <strong>alcalde Juan Pérez</strong> anunció un incremento del <strong>15%</strong> en seguridad. Esta medida representa una <em>inversión histórica</em>.</p>

<blockquote>
<p>"Es momento de tomar acciones contundentes", expresó el alcalde.</p>
</blockquote>

REGLAS HTML:
✅ SIEMPRE cerrar todas las etiquetas
✅ NO anidar <p> dentro de <p>
✅ NO usar <br> - usa párrafos separados
✅ NO usar estilos inline (style="")
✅ NO usar <b>, <i> - usa <strong>, <em>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ESTRUCTURA ORGÁNICA:
- No fuerces 5 secciones si 3 funcionan mejor
- Deja que el contenido dicte la forma
- Puede ser cronológica, temática, o narrativa
- Prioriza fluidez sobre fórmula

VOZ Y ESTILO:
- Profesional pero accesible
- Usa lenguaje vivo y específico de Hidalgo
- Evita jerga periodística trillada
- Conecta con experiencias locales auténticas

TÍTULOS VARIABLES:
- A veces pregunta provocadora
- A veces declaración impactante
- A veces narrativa intrigante
- NUNCA genérico o predecible

🛡️ ANTI-PLAGIO Y TRANSFORMACIÓN CREATIVA:

MANTÉN EXACTO (Precisión es sagrada):
• Nombres de instituciones, personas, cargos políticos
• Cifras, fechas, lugares específicos
• Términos técnicos y nombres propios

TRANSFORMA 100% (Esto SÍ previene plagio):
• CAMBIA el orden en que presentas la información
• USA un ángulo narrativo diferente (no cuentes igual que el original)
• ENFOCA en aspectos que el original no enfatizó
• CONECTA ideas con transiciones propias
• AGREGA contexto LOCAL relevante de Pachuca

PROHIBIDO (Esto ES plagio):
• Copiar secuencias de 3+ palabras del original (excepto nombres/datos)
• Parafrasear oración por oración
• Mantener la misma estructura de párrafos
• Usar el mismo orden de información

EVITA ESTOS CLICHÉS:
❌ "En un evento sin precedentes..."
❌ "Las autoridades informaron que..."
❌ "¿Cómo te afecta esto?" (de forma obvia y mecánica)
❌ Inicios con "El día de hoy..."
❌ Cierres con "Solo el tiempo dirá..."
❌ Frases de relleno como "es importante destacar..."

RECUERDA:
- Cada noticia es única
- Tu voz editorial debe brillar
- La variedad es señal de autenticidad
- Mejor natural que perfecto

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️⚠️⚠️ PRECISIÓN FACTUAL - NO NEGOCIABLE ⚠️⚠️⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COPIA TEXTUALMENTE del contenido original:
• NOMBRES con CARGOS EXACTOS (NO cambies "presidenta" por "jefa de gobierno")
• FECHAS tal cual aparecen
• CIFRAS y números exactos
• LUGARES específicos
• TÉRMINOS TÉCNICOS exactos

⛔ PROHIBIDO:
• Usar conocimiento previo que no esté en el texto
• Cambiar cargos políticos
• "Corregir" información
• Agregar contexto de tu memoria

✅ VERIFICACIÓN:
1. ¿Este dato está en el texto? NO → No lo uses
2. ¿El cargo es exacto? NO → Corrígelo
3. ¿Estoy agregando información? SÍ → Elimínala

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔄 VERIFICACIÓN FINAL ANTI-FORMATO:
Antes de enviar tu respuesta, confirma:
□ Mi primer párrafo NO comienza con [CIUDAD, Estado, fecha.-]
□ NO copié el formato editorial del medio original
□ La ubicación está integrada DENTRO del texto, no como encabezado
□ Usé uno de los 5 tipos de inicio permitidos (A-E)

Si alguno es NO → REESCRIBE tu inicio antes de continuar

FORMATO DE RESPUESTA (JSON):
{
  "title": "Título único y creativo (sin HTML, solo texto)",
  "content": "Artículo de 800-1200 palabras COMPLETAMENTE ENRIQUECIDO CON HTML. Todo el contenido DEBE estar dentro de etiquetas HTML (<p>, <strong>, <em>, <blockquote>, etc.). NO envíes texto plano.",
  "keywords": ["mínimo 8 keywords específicas"],
  "tags": ["mínimo 5 tags relevantes"],
  "category": "Política|Deportes|Cultura|Economía|Seguridad|Salud|Educación|Tecnología",
  "summary": "Resumen de 3-4 líneas con puntos clave (sin HTML, solo texto)",
  "social_media_copies": {
    "facebook": {
      "hook": "Hook atractivo y variable",
      "copy": "Post de 80-120 palabras",
      "emojis": ["máximo 3 emojis relevantes"],
      "hookType": "Scary|FreeValue|Strange|Sexy|Familiar",
      "estimatedEngagement": "high|medium|low"
    },
    "twitter": {
      "tweet": "Tweet de 230-270 caracteres",
      "hook": "Hook conciso",
      "emojis": ["1-2 emojis"],
      "hookType": "Informativo|Provocador|Factual",
      "threadIdeas": ["2-3 ideas para thread"]
    }
  }
}

⚠️ CRÍTICO: El campo "content" DEBE contener HTML válido y bien formado. NO texto plano.

Ejemplo correcto de "content":
"<p>El <strong>alcalde</strong> anunció hoy...</p>\n\n<p>Durante la conferencia...</p>"

Ejemplo INCORRECTO:
"El alcalde anunció hoy...\n\nDurante la conferencia..."

Ahora, transforma esta noticia en algo que la gente QUIERA leer, no solo que DEBA leer.

RESPONDE SOLO CON EL JSON. NO AGREGUES EXPLICACIONES.`;

    this.logger.warn('📝 USER PROMPT CONSTRUIDO');
    this.logger.warn(`User: Longitud = ${enhancedPrompt.length} caracteres`);
    this.logger.warn(`User: Primeros 200 chars = ${enhancedPrompt.substring(0, 200)}`);

    return enhancedPrompt;
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

      // ✅ VALIDACIÓN ESTRICTA DE CATEGORÍAS
      const ALLOWED_CATEGORIES = [
        'Política',
        'Deportes',
        'Cultura',
        'Economía',
        'Seguridad',
        'Salud',
        'Educación',
        'Tecnología'
      ];

      const categoryNormalized = parsed.category.trim();

      if (!ALLOWED_CATEGORIES.includes(categoryNormalized)) {
        // Intentar encontrar coincidencia case-insensitive
        const matchedCategory = ALLOWED_CATEGORIES.find(
          cat => cat.toLowerCase() === categoryNormalized.toLowerCase()
        );

        if (matchedCategory) {
          // Corregir capitalización
          parsed.category = matchedCategory;
          this.logger.warn(`⚠️ Categoría corregida de "${categoryNormalized}" a "${matchedCategory}"`);
        } else {
          throw new Error(
            `Categoría inválida: "${categoryNormalized}". Solo se permiten: ${ALLOWED_CATEGORIES.join(', ')}`
          );
        }
      }

      if (typeof parsed.summary !== 'string' || parsed.summary.trim().length === 0) {
        throw new Error('Summary debe ser un string no vacío');
      }

      // ✅ VALIDACIÓN DE HTML EN CONTENT
      const hasHTMLTags = /<p>.*<\/p>/s.test(parsed.content);
      if (!hasHTMLTags) {
        this.logger.warn('⚠️ El contenido NO tiene etiquetas HTML <p>. Se esperaba contenido enriquecido.');
        // NO fallar, solo advertir (para retrocompatibilidad)
      }

      // Verificar balance básico de etiquetas
      const openPTags = (parsed.content.match(/<p>/g) || []).length;
      const closePTags = (parsed.content.match(/<\/p>/g) || []).length;
      if (openPTags !== closePTags) {
        this.logger.warn(`⚠️ Etiquetas <p> desbalanceadas: ${openPTags} abiertas, ${closePTags} cerradas`);
      }

      // Verificar que no use etiquetas obsoletas
      const obsoleteTags = /<\s*(b|i|font|center)\s*>/gi;
      if (obsoleteTags.test(parsed.content)) {
        this.logger.warn('⚠️ El contenido usa etiquetas HTML obsoletas (<b>, <i>, <font>, <center>)');
      }

      // ✅ VALIDACIÓN DE FORMATOS EDITORIALES PROHIBIDOS
      const editorialFormatPatterns = [
        // Quadratin/Criterio: "PACHUCA, Hgo., fecha.-" o dentro de HTML
        {
          pattern: /^(<p>)?(<strong>)?[A-ZÁÉÍÓÚÑ\s]+,\s*Hgo\.,\s*\d{1,2}\s+de\s+\w+(\s+de\s+\d{4})?\s*(<\/strong>)?\.?-/i,
          name: 'Quadratin/Criterio (CIUDAD, Hgo., fecha.-)'
        },
        // El Sol/Milenio: "Pachuca / fecha.-"
        {
          pattern: /^(<p>)?(<strong>)?[A-ZÁÉÍÓÚÑa-záéíóúñ\s]+\s*\/\s*\d{1,2}\s+de\s+\w+/i,
          name: 'El Sol/Milenio (Ciudad / fecha.-)'
        },
        // Plaza Juárez: "PACHUCA.—"
        {
          pattern: /^(<p>)?(<strong>)?[A-ZÁÉÍÓÚÑ\s]+\.—/,
          name: 'Plaza Juárez (CIUDAD.—)'
        },
        // La Silla Rota: "Pachuca.-" o "Pachuca, Hgo.-"
        {
          pattern: /^(<p>)?(<strong>)?[A-ZÁÉÍÓÚÑa-záéíóúñ\s]+,?\s*(Hgo\.)?\s*\.-/i,
          name: 'La Silla Rota (Ciudad.- o Ciudad, Hgo.-)'
        },
        // Genérico: Ciudad-fecha al inicio
        {
          pattern: /^(<p>)?(<strong>)?[A-ZÁÉÍÓÚÑa-záéíóúñ\s,]+\d{1,2}\s+(de\s+)?\w+(\s+de\s+\d{4})?\s*[\.-]/i,
          name: 'Formato genérico ciudad-fecha'
        }
      ];

      const contentStart = parsed.content.substring(0, 200); // Revisar primeros 200 caracteres

      this.logger.error('🔍🔍🔍 VALIDANDO FORMATOS EDITORIALES 🔍🔍🔍');
      this.logger.error(`Inicio del contenido generado: "${contentStart}"`);

      for (const { pattern, name } of editorialFormatPatterns) {
        this.logger.warn(`Probando patrón: ${name}`);
        this.logger.warn(`Regex: ${pattern}`);

        if (pattern.test(contentStart)) {
          this.logger.error(`🚫🚫🚫 PLAGIO DE FORMATO EDITORIAL DETECTADO: ${name} 🚫🚫🚫`);
          this.logger.error(`   Inicio del contenido: ${contentStart.substring(0, 100)}...`);
          this.logger.error(`   Patrón que coincidió: ${pattern}`);

          // ⚠️ MODO ESTRICTO ACTIVADO: Rechazar contenido con formatos prohibidos
          throw new Error(
            `Plagio de formato editorial detectado: ${name}. ` +
            `El contenido NO debe comenzar con formatos de otros medios. ` +
            `Inicio detectado: "${contentStart.substring(0, 80)}..."`
          );
        }
      }

      this.logger.log('✅ NO se detectó plagio de formato editorial');
      this.logger.error('🔍🔍🔍 FIN VALIDACIÓN 🔍🔍🔍');

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
   * 🔍 Verificar fidelidad factual del contenido generado
   * Compara el contenido generado con el original para detectar alucinaciones
   */
  private verifyFactualFidelity(
    generatedContent: string,
    originalContent: string,
    generatedTitle?: string
  ): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    try {
      // Extraer nombres propios del original y generado
      const originalNames = this.extractProperNouns(originalContent);
      const generatedNames = this.extractProperNouns(generatedContent);

      // Verificar que los nombres importantes del original aparezcan en el generado
      for (const originalName of originalNames) {
        const found = generatedNames.some(genName =>
          genName.toLowerCase().includes(originalName.toLowerCase()) ||
          originalName.toLowerCase().includes(genName.toLowerCase())
        );

        if (!found && originalName.length > 5) { // Solo nombres significativos
          warnings.push(`⚠️ Posible omisión: "${originalName}" del original no encontrado en generado`);
        }
      }

      // Verificar cargos/títulos comunes que no deben cambiar
      const criticalTerms = [
        { original: /\bpresidenta?\b/gi, term: 'presidente/presidenta' },
        { original: /\balcalde(sa)?\b/gi, term: 'alcalde/alcaldesa' },
        { original: /\bsecretario(a)?\b/gi, term: 'secretario/secretaria' },
        { original: /\bgobernador(a)?\b/gi, term: 'gobernador/gobernadora' },
        { original: /\bdiputado(a)?\b/gi, term: 'diputado/diputada' },
        { original: /\bsenador(a)?\b/gi, term: 'senador/senadora' },
        { original: /\bministro(a)?\b/gi, term: 'ministro/ministra' },
      ];

      for (const { original: regex, term } of criticalTerms) {
        const originalMatches = originalContent.match(regex);
        const generatedMatches = generatedContent.match(regex);

        if (originalMatches && !generatedMatches) {
          warnings.push(`⚠️ Cargo político faltante: "${term}" aparece en original pero no en generado`);
        }

        // Verificar que el contexto del cargo sea similar
        if (originalMatches && generatedMatches) {
          const originalContexts = this.extractContext(originalContent, regex);
          const generatedContexts = this.extractContext(generatedContent, regex);

          for (const origCtx of originalContexts) {
            const similar = generatedContexts.some(genCtx =>
              this.contextSimilarity(origCtx, genCtx) > 0.5
            );

            if (!similar) {
              warnings.push(`⚠️ Posible cambio de contexto en cargo: "${origCtx.substring(0, 50)}..."`);
            }
          }
        }
      }

      // Verificar fechas
      const dateRegex = /\b\d{1,2}\s+de\s+\w+\s+de\s+\d{4}\b|\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\/\d{1,2}\/\d{4}\b/gi;
      const originalDates = originalContent.match(dateRegex) || [];
      const generatedDates = generatedContent.match(dateRegex) || [];

      for (const origDate of originalDates) {
        const found = generatedDates.some(genDate => genDate === origDate);
        if (!found && originalDates.length <= 3) {
          warnings.push(`⚠️ Fecha del original no encontrada: "${origDate}"`);
        }
      }

      // Verificar números/cifras importantes
      const numberRegex = /\b\d{1,3}(?:,?\d{3})*(?:\.\d+)?\s*(?:millones?|mil(?:es)?|billones?|personas?|muertos?|desaparecidos?|pesos?|dólares?|%|porcentaje|por\s+ciento)\b/gi;
      const originalNumbers = originalContent.match(numberRegex) || [];
      const generatedNumbers = generatedContent.match(numberRegex) || [];

      for (const origNum of originalNumbers) {
        const found = generatedNumbers.some((genNum: string) =>
          genNum.toLowerCase().includes(origNum.toLowerCase().split(/\s+/)[0])
        );

        if (!found) {
          warnings.push(`⚠️ Cifra importante del original no encontrada: "${origNum}"`);
        }
      }

      // Log de warnings
      if (warnings.length > 0) {
        this.logger.warn(`🔍 Verificación de fidelidad factual encontró ${warnings.length} advertencia(s):`);
        warnings.forEach(w => this.logger.warn(w));
      } else {
        this.logger.log(`✅ Verificación de fidelidad factual: contenido fiel al original`);
      }

      return {
        isValid: warnings.length === 0,
        warnings
      };

    } catch (error) {
      this.logger.error(`Error en verificación de fidelidad: ${error.message}`);
      return {
        isValid: true, // No fallar la generación por error en verificación
        warnings: [`Error en verificación: ${error.message}`]
      };
    }
  }

  /**
   * 📝 Extraer nombres propios de un texto
   */
  private extractProperNouns(text: string): string[] {
    // Regex para nombres propios (palabras capitalizadas)
    const regex = /\b[A-ZÑÁÉÍÓÚ][a-zñáéíóúü]+(?:\s+(?:de|del|la|los|las|y|e)\s+)?(?:[A-ZÑÁÉÍÓÚ][a-zñáéíóúü]+)*\b/g;
    const matches = text.match(regex) || [];

    // Filtrar stopwords comunes que pueden estar capitalizadas
    const stopwords = ['El', 'La', 'Los', 'Las', 'Un', 'Una', 'Este', 'Esta', 'Ese', 'Esa', 'Aquel', 'Aquella'];
    return matches.filter((name: string) => !stopwords.includes(name) && name.length > 2);
  }

  /**
   * 🔍 Extraer contexto alrededor de un patrón
   */
  private extractContext(text: string, regex: RegExp, contextLength: number = 100): string[] {
    const contexts: string[] = [];
    const matches = text.matchAll(new RegExp(regex, 'gi'));

    for (const match of matches) {
      const index = match.index || 0;
      const start = Math.max(0, index - contextLength);
      const end = Math.min(text.length, index + match[0].length + contextLength);
      contexts.push(text.substring(start, end));
    }

    return contexts;
  }

  /**
   * 📊 Calcular similitud entre dos contextos
   */
  private contextSimilarity(context1: string, context2: string): number {
    const words1 = context1.toLowerCase().split(/\s+/);
    const words2 = context2.toLowerCase().split(/\s+/);

    const commonWords = words1.filter(word => words2.includes(word)).length;
    const totalWords = Math.max(words1.length, words2.length);

    return totalWords > 0 ? commonWords / totalWords : 0;
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
      const systemPromptToSend = this.prepareSystemPrompt();

      this.logger.error('🚨🚨🚨 ENVIANDO AL AI 🚨🚨🚨');
      this.logger.error(`SYSTEM PROMPT (primeros 300 chars):`);
      this.logger.error(systemPromptToSend.substring(0, 300));
      this.logger.error(`\nUSER PROMPT (primeros 300 chars):`);
      this.logger.error(dynamicPrompt.substring(0, 300));
      this.logger.error('🚨🚨🚨 FIN LOG AI 🚨🚨🚨');

      const aiResponse = await providerInstance.generateContent({
        systemPrompt: systemPromptToSend, // ⚠️ v3.0: RESTRICCIÓN ABSOLUTA en system message
        userPrompt: dynamicPrompt,
        maxTokens: Math.min(provider.maxTokens, 4000), // Limitar a 4000 tokens
        temperature: provider.temperature,
        stopSequences: [],
      });

      this.logger.error('🤖🤖🤖 RESPUESTA DEL AI RECIBIDA 🤖🤖🤖');
      this.logger.error(`Respuesta (primeros 500 chars):`);
      this.logger.error(aiResponse.content.substring(0, 500));
      this.logger.error('🤖🤖🤖 FIN RESPUESTA AI 🤖🤖🤖');

      result = this.parseAndValidateResponse(aiResponse.content, template.staticOutputFormat || {});

      // Verificar fidelidad factual del contenido generado
      const fidelityCheck = this.verifyFactualFidelity(
        result.content || '',
        request.content,
        result.title
      );

      // Log de verificación
      if (!fidelityCheck.isValid) {
        this.logger.warn(`⚠️ Verificación de fidelidad detectó ${fidelityCheck.warnings.length} problemas potenciales`);
      }

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
        // Agregar warnings de verificación de fidelidad factual
        warnings: fidelityCheck.warnings.length > 0 ? fidelityCheck.warnings : [],
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