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
      .populate('originalContentId', 'title content sourceUrl publishedAt')
      .populate('agentId', 'name agentType')
      .populate('templateId', 'name type')
      .populate('providerId', 'name model')
      .sort({ generatedAt: -1 })
      .exec();

    return content.map(item => this.toDetailedResponse(item));
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
      .populate('originalContentId', 'title content sourceUrl publishedAt')
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
        maxTokens: template.configuration?.maxTokens || 2000,
        temperature: template.configuration?.temperature || 0.7,
        topP: template.configuration?.topP,
        frequencyPenalty: template.configuration?.frequencyPenalty,
        presencePenalty: template.configuration?.presencePenalty,
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
        generatedTitle: parsedContent.title as string || originalContent.title,
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
      title: originalContent.title,
      content: originalContent.content,
      author: originalContent.author || 'Desconocido',
      sourceUrl: originalContent.sourceUrl,
      publishedAt: originalContent.publishedAt?.toISOString() || '',
      domain: originalContent.domain,
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
      ? (content.originalContentId as unknown as { title: string; content: string; sourceUrl: string; publishedAt: Date })
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
    const optimizedPrompt = `Eres Jarvis, el asistente editorial de Pachuca Noticias, especializado en transformar noticias en contenido editorial estructurado.

<thinking>
Voy a procesar esta noticia siguiendo estos pasos:
1. Extraer SOLO los hechos presentes en el input
2. Identificar personajes, fechas, lugares y cifras específicas
3. Determinar el ángulo editorial más relevante para Pachuca
4. Clasificar según nuestras categorías establecidas
5. Generar keywords basadas únicamente en el contenido real
6. Crear summary que capture la esencia única de ESTA noticia específica
</thinking>

REGLAS ESTRICTAS:
- OBLIGATORIO reinterpretar y transformar la información con nuevo enfoque editorial
- PROHIBIDO copiar frases o párrafos completos del original
- REQUERIDO crear nueva narrativa con los mismos hechos pero diferente estructura
- OBLIGATORIO cambiar el ángulo periodístico manteniendo veracidad
- PROHIBIDO usar más del 20% de palabras idénticas al texto original

FÓRMULAS PARA REDES SOCIALES (USA ESTAS TÉCNICAS):
FACEBOOK - Fórmula AIDA:
• Atención: Hook con emoji (🚨📊⚡🔴)
• Interés: Dato específico de la noticia
• Deseo: "¿Por qué te importa?" + beneficio personal
• Acción: CTA específico ("¿Qué opinas?", "Comparte si...", "Tag alguien que...")

TWITTER - Hooks efectivos:
• Estadístico: "📊 El X% de mexicanos/poblanos..."
• Urgencia: "🚨 ÚLTIMA HORA:"
• Pregunta: "¿Sabías que en Pachuca...?"
• Problema-Solución: "[Problema] + [Consecuencia] + [Qué significa]"

INSTAGRAM - Estructura ganadora:
• Emoji + hook impactante primera línea
• Párrafo corto contexto
• Bullets con • para puntos clave
• CTA con pregunta genuine
• Hashtags: mix geográficos (#Pachuca) + temáticos

TÍTULO DE LA NOTICIA:
${variables.title}

CONTENIDO DE LA NOTICIA A PROCESAR:
${variables.content}

${variables.referenceContent ? `CONTENIDO DE REFERENCIA:\n${variables.referenceContent}\n` : ''}

ESQUEMA JSON OBLIGATORIO - DEBES LLENAR TODOS LOS CAMPOS:
{
  "title": "Título editorial TRANSFORMADO con nuevo ángulo periodístico",
  "content": "Artículo de 400-600 palabras REINTERPRETANDO los hechos con nueva estructura narrativa y enfoque editorial diferente",
  "keywords": ["OBLIGATORIO: mínimo 5 keywords extraídas del contenido real", "ejemplo: Pachuca", "ejemplo: Día de Muertos"],
  "tags": ["OBLIGATORIO: mínimo 3 tags basados en temas específicos", "ejemplo: tradición", "ejemplo: cultura"],
  "category": "Una de: deportes|política|cultura|economía|tecnología|salud|general",
  "summary": "2-3 líneas con datos específicos de ESTA noticia",
  "extended_summary": "Resumen ejecutivo detallado de 4-6 párrafos para uso interno o reportes",
  "social_media_copies": {
    "facebook": "Post para Facebook siguiendo fórmula AIDA: Hook impactante con emoji inicial, contexto escanenable, beneficio personal, CTA específico. Usar 2-3 emojis moderados, máximo 2 hashtags. Ejemplo: '🚨 [Dato impactante]\\n[Contexto 1-2 líneas]\\n💡 ¿Por qué te importa? [beneficio]\\n👇 ¿Qué opinas? Comenta'",
    "twitter": "Tweet usando PAS (Problema-Agitación-Solución) o hook estadístico. Máximo 280 chars, 1-2 hashtags relevantes, emoji inicial opcional. Ejemplo: '📊 El 73% de poblanos no sabía que... [dato clave] #Pachuca #Noticias'",
    "instagram": "Caption estructura: Emoji + hook primera línea, párrafo contexto, bullets con puntos clave, CTA con pregunta, hashtags específicos (5-8). Usar líneas espaciadoras con puntos o guiones.",
    "linkedin": "Post profesional para LinkedIn: Contexto profesional relevante, perspectiva de industria/negocio, datos concretos, sin emojis excesivos, hashtags profesionales (#Negocios #Economia #Pachuca), tono autoridad pero accesible."
  },
  "seo_data": {
    "meta_description": "Descripción SEO de 150-160 caracteres basada en el contenido",
    "focus_keyword": "Palabra clave principal extraída del contenido",
    "alt_text": "Texto alternativo descriptivo para imagen relacionada"
  },
  "metadata": {
    "extracted_facts": ["hecho1 textual", "hecho2 textual"],
    "key_people": ["nombres específicos mencionados"],
    "locations": ["lugares específicos del input"],
    "dates": ["fechas específicas mencionadas"],
    "numbers": ["cifras específicas del texto"]
  }
}

IMPORTANTE: TODOS los arrays (keywords, tags, etc.) DEBEN tener contenido. NO dejes arrays vacíos.

RESPONDE ÚNICAMENTE CON EL JSON. NO INCLUYAS EXPLICACIONES ADICIONALES.`;

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