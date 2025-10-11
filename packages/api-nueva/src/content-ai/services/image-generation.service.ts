import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ImageGeneration, ImageGenerationDocument } from '../schemas/image-generation.schema';
import { BrandingService } from './branding.service';
import { ContentAnalyzerService } from './content-analyzer.service';
import { EditorialPromptService } from './editorial-prompt.service';
import { MetadataBuilderService } from './metadata-builder.service';
import { ImageGenerationQueueService } from './image-generation-queue.service';
import { AppConfigService } from '../../config/config.service';
import {
  GenerateNewsImageDto,
  GenerationResultDto,
  ImageGenerationFilters,
} from '../dto/image-generation.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { ExtractedNoticia, ExtractedNoticiaDocument } from '../../noticias/schemas/extracted-noticia.schema';

/**
 * 🖼️ Servicio para generación de imágenes con IA
 * Gestiona el ciclo completo de generación de imágenes con branding
 */
@Injectable()
export class ImageGenerationService {
  private readonly logger = new Logger(ImageGenerationService.name);

  constructor(
    @InjectModel(ImageGeneration.name)
    private imageGenerationModel: Model<ImageGenerationDocument>,
    @InjectModel(ExtractedNoticia.name)
    private extractedNoticiaModel: Model<ExtractedNoticiaDocument>,
    private brandingService: BrandingService,
    private contentAnalyzerService: ContentAnalyzerService,
    private editorialPromptService: EditorialPromptService,
    private metadataBuilderService: MetadataBuilderService,
    private imageGenerationQueueService: ImageGenerationQueueService,
    private configService: AppConfigService,
  ) {}

  /**
   * Genera una nueva imagen de noticia con branding
   * NUEVA ARQUITECTURA (FASE 5):
   * 1. Analiza contenido con ContentAnalyzerService
   * 2. Construye prompt profesional con EditorialPromptService
   * 3. Aplica branding con separación limpia (BrandingService.applyBranding)
   * 4. Guarda basePrompt (limpio) en metadata
   * 5. Envía fullPrompt (con branding) al processor
   *
   * @param dto - Datos de generación
   * @param userId - ID del usuario que solicita la generación
   * @returns Registro de generación creado y jobId de la cola
   */
  async generateNewsImage(
    dto: GenerateNewsImageDto,
    userId: string,
  ): Promise<{ generation: ImageGeneration; jobId: string | number }> {
    this.logger.log(`🎨 Starting image generation for user ${userId}`);

    // ==========================================
    // STEP 1: Obtener contenido si hay extractedNoticiaId
    // ==========================================
    let extractedNoticia: ExtractedNoticia | null = null;
    let originalTitle = dto.prompt; // Fallback al prompt si no hay noticia

    if (dto.extractedNoticiaId) {
      if (!Types.ObjectId.isValid(dto.extractedNoticiaId)) {
        throw new BadRequestException(`Invalid extractedNoticiaId: ${dto.extractedNoticiaId}`);
      }

      extractedNoticia = await this.extractedNoticiaModel
        .findById(dto.extractedNoticiaId)
        .lean();

      if (!extractedNoticia) {
        this.logger.warn(`ExtractedNoticia not found: ${dto.extractedNoticiaId}, using fallback prompt`);
      } else {
        originalTitle = extractedNoticia.title || dto.prompt;
        this.logger.log(`✓ Found extracted noticia: "${originalTitle.substring(0, 50)}..."`);
      }
    }

    // ==========================================
    // STEP 2: Analizar contenido con ContentAnalyzerService
    // ==========================================
    let contentAnalysis;

    if (extractedNoticia && extractedNoticia.content) {
      this.logger.log(`📊 Analyzing content for editorial prompt...`);

      contentAnalysis = await this.contentAnalyzerService.analyze({
        title: originalTitle,
        content: extractedNoticia.content.substring(0, 2000), // Limitar contenido
        suggestedCategory: extractedNoticia.category,
      });

      this.logger.log(
        `✓ Content analyzed: subject="${contentAnalysis.mainSubject}", ` +
        `action="${contentAnalysis.action}", tone="${contentAnalysis.tone}"`,
      );
    } else {
      // Fallback: análisis simple sin contenido
      this.logger.log(`⚠️ No content available, using simple analysis from title`);

      contentAnalysis = await this.contentAnalyzerService.analyze({
        title: originalTitle,
      });
    }

    // ==========================================
    // STEP 3: Construir prompt editorial profesional
    // ==========================================
    this.logger.log(`📸 Building editorial prompt...`);

    const editorialPromptResult = this.editorialPromptService.build({
      contentAnalysis,
      originalTitle,
    });

    this.logger.log(
      `✓ Editorial prompt built: ${editorialPromptResult.prompt.length} chars, ` +
      `template="${editorialPromptResult.templateUsed}"`,
    );

    // ==========================================
    // STEP 4: Aplicar branding con separación limpia
    // ==========================================
    this.logger.log(`🎨 Applying branding with clean separation...`);

    const brandingResult = await this.brandingService.applyBranding({
      basePrompt: editorialPromptResult.prompt,
      watermarkText: dto.watermarkText || 'NOTICIAS PACHUCA',
      includeDecorations: dto.includeDecorations,
      keywords: dto.keywords,
    });

    this.logger.log(
      `✓ Branding applied: basePrompt=${brandingResult.basePrompt.length} chars, ` +
      `fullPrompt=${brandingResult.fullPrompt.length} chars`,
    );

    // ==========================================
    // STEP 5: Crear registro de generación
    // CRÍTICO: Guardar SOLO basePrompt (limpio)
    // ==========================================
    const generation = await this.imageGenerationModel.create({
      prompt: brandingResult.basePrompt, // ✅ LIMPIO, sin instrucciones de branding
      model: dto.model || 'gpt-image-1',
      quality: dto.quality || 'medium',
      size: dto.size || '1024x1024',
      brandingConfig: brandingResult.config,
      extractedNoticiaId: dto.extractedNoticiaId ? new Types.ObjectId(dto.extractedNoticiaId) : undefined,
      sourceImageId: dto.sourceImageId ? new Types.ObjectId(dto.sourceImageId) : undefined,
      sourceImageUrl: dto.sourceImageUrl,
      aiGenerated: true,
      c2paIncluded: false, // Will be true after generation
      editorialReviewed: false,
      usedInArticles: [],
      createdBy: new Types.ObjectId(userId),
      cost: 0, // Will be updated after generation
      // NUEVO: Guardar metadata de análisis
      contentAnalysisResult: contentAnalysis as unknown as Record<string, unknown>,
      editorialTemplate: editorialPromptResult.templateUsed,
    });

    // ==========================================
    // STEP 6: Encolar job con fullPrompt
    // El processor usará fullPrompt para OpenAI
    // ==========================================
    const job = await this.imageGenerationQueueService.addGenerationJob({
      generationId: (generation._id as Types.ObjectId).toString(),
      prompt: brandingResult.fullPrompt, // ✅ Con branding para OpenAI
      model: generation.model,
      quality: generation.quality,
      size: generation.size,
      userId,
      extractedNoticiaId: dto.extractedNoticiaId,
      // NUEVO: Pasar basePrompt y análisis al processor
      basePrompt: brandingResult.basePrompt,
      contentAnalysis: contentAnalysis as unknown as Record<string, unknown>,
      originalTitle,
    });

    this.logger.log(
      `✅ Image generation created and queued: ${generation._id}, job: ${job.id}`,
    );

    return {
      generation,
      jobId: job.id as string | number,
    };
  }

  /**
   * Obtiene una generación por ID
   * @param id - ID de la generación
   * @returns Registro de generación
   */
  async findById(id: string): Promise<ImageGeneration> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid generation ID: ${id}`);
    }

    const generation = await this.imageGenerationModel
      .findById(id)
      .populate('extractedNoticiaId', 'title sourceUrl')
      .populate('createdBy', 'name email')
      .lean();

    if (!generation) {
      throw new NotFoundException(`Generation not found: ${id}`);
    }

    return generation;
  }

  /**
   * Obtiene las generaciones de un usuario con filtros y paginación
   * @param userId - ID del usuario
   * @param filters - Filtros opcionales
   * @returns Respuesta paginada con generaciones
   */
  async findByUser(
    userId: string,
    filters?: ImageGenerationFilters,
  ): Promise<PaginatedResponse<ImageGeneration>> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException(`Invalid user ID: ${userId}`);
    }

    const query: Record<string, unknown> = { createdBy: new Types.ObjectId(userId) };

    // Apply filters
    if (filters?.model) {
      query.model = filters.model;
    }
    if (filters?.quality) {
      query.quality = filters.quality;
    }
    if (filters?.aiGenerated !== undefined) {
      query.aiGenerated = filters.aiGenerated;
    }
    if (filters?.editorialReviewed !== undefined) {
      query.editorialReviewed = filters.editorialReviewed;
    }

    const page = filters?.page || 1;
    const limit = Math.min(filters?.limit || 20, 100); // Max 100
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.imageGenerationModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('extractedNoticiaId', 'title sourceUrl')
        .populate('createdBy', 'name email')
        .lean(),
      this.imageGenerationModel.countDocuments(query),
    ]);

    this.logger.log(`Found ${data.length} generations for user: ${userId}`);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
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
   * Actualiza el resultado de una generación (llamado por queue processor)
   * NUEVA ARQUITECTURA (FASE 5): Ahora recibe metadata limpia
   *
   * @param id - ID de la generación
   * @param result - Resultado de la generación (incluye metadata limpia)
   * @returns Registro actualizado
   */
  async updateGenerationResult(
    id: string,
    result: GenerationResultDto,
  ): Promise<ImageGeneration> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid generation ID: ${id}`);
    }

    const generation = await this.imageGenerationModel.findById(id);

    if (!generation) {
      throw new NotFoundException(`Generation not found: ${id}`);
    }

    // Update with results
    generation.generatedImageUrl = result.generatedImageUrl;
    generation.cost = result.cost;
    generation.generationTime = result.generationTime;
    generation.processingTime = result.processingTime;
    generation.c2paIncluded = result.c2paIncluded !== undefined ? result.c2paIncluded : true;

    // NUEVO: Actualizar metadata limpia (si viene del processor)
    if (result.altText) {
      generation.altText = result.altText;
    }
    if (result.caption) {
      generation.caption = result.caption;
    }
    if (result.keywords && result.keywords.length > 0) {
      generation.keywords = result.keywords;
    }

    await generation.save();

    this.logger.log(
      `✅ Generation updated: ${id}, cost: $${result.cost.toFixed(4)}, ` +
      `time: ${result.generationTime}ms, metadata: ${result.altText ? 'yes' : 'no'}`,
    );

    return generation;
  }

  /**
   * Marca una generación como revisada editorialmente
   * @param id - ID de la generación
   * @param reviewed - Si fue revisada o no
   * @returns Registro actualizado
   */
  async markAsReviewed(id: string, reviewed: boolean): Promise<ImageGeneration> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid generation ID: ${id}`);
    }

    const generation = await this.imageGenerationModel.findById(id);

    if (!generation) {
      throw new NotFoundException(`Generation not found: ${id}`);
    }

    generation.editorialReviewed = reviewed;
    await generation.save();

    this.logger.log(`Generation ${id} marked as ${reviewed ? 'reviewed' : 'not reviewed'}`);

    return generation;
  }

  /**
   * Asocia una generación con un artículo
   * @param id - ID de la generación
   * @param articleId - ID del artículo
   * @returns Registro actualizado
   */
  async addArticleUsage(id: string, articleId: string): Promise<ImageGeneration> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid generation ID: ${id}`);
    }
    if (!Types.ObjectId.isValid(articleId)) {
      throw new BadRequestException(`Invalid article ID: ${articleId}`);
    }

    const generation = await this.imageGenerationModel.findById(id);

    if (!generation) {
      throw new NotFoundException(`Generation not found: ${id}`);
    }

    const articleObjectId = new Types.ObjectId(articleId);

    // Check if already added
    if (!generation.usedInArticles.some(id => id.equals(articleObjectId))) {
      generation.usedInArticles.push(articleObjectId);
      await generation.save();
      this.logger.log(`Article ${articleId} added to generation ${id}`);
    }

    return generation;
  }

  /**
   * Elimina una generación
   * @param id - ID de la generación
   */
  async delete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid generation ID: ${id}`);
    }

    const result = await this.imageGenerationModel.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      throw new NotFoundException(`Generation not found: ${id}`);
    }

    this.logger.log(`Generation deleted: ${id}`);
  }

  /**
   * Obtiene estadísticas de generación de un usuario
   * @param userId - ID del usuario
   * @returns Estadísticas de uso
   */
  async getUserStats(userId: string): Promise<{
    total: number;
    totalCost: number;
    averageCost: number;
    byModel: Record<string, number>;
    byQuality: Record<string, number>;
    reviewed: number;
    pending: number;
  }> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException(`Invalid user ID: ${userId}`);
    }

    const generations = await this.imageGenerationModel
      .find({ createdBy: new Types.ObjectId(userId) })
      .lean();

    const stats = {
      total: generations.length,
      totalCost: generations.reduce((sum, gen) => sum + gen.cost, 0),
      averageCost: 0,
      byModel: {} as Record<string, number>,
      byQuality: {} as Record<string, number>,
      reviewed: generations.filter(g => g.editorialReviewed).length,
      pending: generations.filter(g => !g.generatedImageUrl).length,
    };

    stats.averageCost = stats.total > 0 ? stats.totalCost / stats.total : 0;

    // Count by model
    generations.forEach(gen => {
      stats.byModel[gen.model] = (stats.byModel[gen.model] || 0) + 1;
    });

    // Count by quality
    generations.forEach(gen => {
      stats.byQuality[gen.quality] = (stats.byQuality[gen.quality] || 0) + 1;
    });

    return stats;
  }
}
