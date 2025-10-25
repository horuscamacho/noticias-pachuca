import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';

// Schemas
import { UserGeneratedContent, UserGeneratedContentDocument } from '../schemas/user-generated-content.schema';
import { AIContentGeneration, AIContentGenerationDocument } from '../../content-ai/schemas/ai-content-generation.schema';
import { PublishedNoticia, PublishedNoticiaDocument } from '../../pachuca-noticias/schemas/published-noticia.schema';
import { ContentAgent, ContentAgentDocument } from '../schemas/content-agent.schema';

// DTOs
import {
  CreateUrgentContentDto,
  CreateNormalContentDto,
  UpdateUrgentContentDto,
} from '../dto/user-generated-content.dto';

// Services
// import { FileManagementService } from '../../files/services/file-management.service'; // TODO FASE 5: Uncomment when implementing file upload endpoint
import { GeneratorProPromptBuilderService } from './generator-pro-prompt-builder.service';
import { ProviderFactoryService } from '../../content-ai/services/provider-factory.service';
import { SocialMediaPublishingService } from './social-media-publishing.service';
import { Site, SiteDocument } from '../../pachuca-noticias/schemas/site.schema';

/**
 * 📝 Servicio para User Generated Content (Contenido Manual)
 * Gestiona creación de contenido original en modo URGENT o NORMAL
 * Sistema de noticias de última hora con auto-cierre después de 2 horas
 */
@Injectable()
export class UserContentService {
  private readonly logger = new Logger(UserContentService.name);

  constructor(
    @InjectModel(UserGeneratedContent.name)
    private readonly userContentModel: Model<UserGeneratedContentDocument>,
    @InjectModel(AIContentGeneration.name)
    private readonly aiContentModel: Model<AIContentGenerationDocument>,
    @InjectModel(PublishedNoticia.name)
    private readonly publishedNoticiaModel: Model<PublishedNoticiaDocument>,
    @InjectModel(Site.name)
    private readonly siteModel: Model<SiteDocument>,
    @InjectModel(ContentAgent.name)
    private readonly agentModel: Model<ContentAgentDocument>,
    // private readonly fileManagementService: FileManagementService, // TODO FASE 5: Uncomment when implementing file upload endpoint
    private readonly promptBuilderService: GeneratorProPromptBuilderService,
    private readonly providerFactoryService: ProviderFactoryService,
    private readonly socialMediaPublishingService: SocialMediaPublishingService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.log('📝 User Content Service initialized');
  }

  // ========================================
  // 🚨 CREAR CONTENIDO URGENT (Breaking News)
  // ========================================

  /**
   * Crear contenido URGENT (última hora)
   * - Se publica automáticamente
   * - Redacción corta (300-500 palabras)
   * - Copys agresivos para redes sociales
   * - Auto-cierre después de 2 horas sin actualización
   */
  async createUrgentContent(
    dto: CreateUrgentContentDto,
    userId: string,
  ): Promise<UserGeneratedContentDocument> {
    this.logger.log(`🚨 Creating URGENT content by user: ${userId}`);
    this.logger.log(`Title: ${dto.originalTitle}`);
    this.logger.log(`Site ID: ${dto.siteId}`);

    try {
      // 1. Verificar que el sitio existe y está activo
      const site = await this.siteModel.findById(dto.siteId).exec();
      if (!site) {
        throw new Error(`Site with ID ${dto.siteId} not found`);
      }
      if (!site.isActive) {
        throw new Error(`Site ${site.domain} is not active`);
      }
      this.logger.log(`Using site: ${site.domain} (${site._id})`);

      // 2. Calcular fecha de auto-cierre (2 horas)
      const now = new Date();
      const urgentAutoCloseAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // +2 horas

      // 3. Crear documento en UserGeneratedContent
      const userContent = new this.userContentModel({
        originalTitle: dto.originalTitle,
        originalContent: dto.originalContent,
        uploadedImageUrls: dto.uploadedImageUrls || [],
        uploadedVideoUrls: dto.uploadedVideoUrls || [],
        mode: 'urgent',
        isUrgent: true,
        urgentCreatedAt: now,
        urgentAutoCloseAt,
        urgentClosed: false,
        agentId: new Types.ObjectId(dto.agentId),
        createdBy: new Types.ObjectId(userId),
        status: 'processing',
      });

      await userContent.save();
      this.logger.log(`✅ User content document created: ${userContent._id}`);

      // 3. Emitir evento de creación
      this.eventEmitter.emit('content.urgent.created', {
        userContentId: (userContent._id as Types.ObjectId).toString(),
        userId,
        urgentAutoCloseAt,
      });

      // 4. Procesar con IA (modo URGENT - 300-500 palabras)
      this.logger.log('🤖 Processing with AI (URGENT mode)...');

      // TODO FASE 6: Aquí usaremos buildUrgentPrompt()
      // Por ahora usamos el prompt builder existente como placeholder
      const aiResult = await this.processWithAI(userContent, 'urgent', dto.agentId, site);

      // 5. Actualizar referencias
      userContent.generatedContentId = aiResult.generatedContentId;
      userContent.publishedNoticiaId = aiResult.publishedNoticiaId;
      userContent.status = 'published';
      await userContent.save();

      // 6. Auto-publicar en redes sociales
      this.logger.log('📱 Auto-publishing to social media...');
      await this.autoPublishToSocialMedia(aiResult.publishedNoticiaId);

      this.logger.log(`✅ URGENT content published successfully: ${userContent._id}`);
      return userContent;
    } catch (error) {
      this.logger.error(`❌ Error creating urgent content: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error creating urgent content');
    }
  }

  // ========================================
  // 📝 CREAR CONTENIDO NORMAL
  // ========================================

  /**
   * Crear contenido NORMAL (publicación manual)
   * - Usuario decide tipo de publicación
   * - Redacción normal (500-700 palabras)
   * - Copys normales para redes sociales
   * - NO se auto-cierra
   */
  async createNormalContent(
    dto: CreateNormalContentDto,
    userId: string,
  ): Promise<UserGeneratedContentDocument> {
    this.logger.log(`📝 Creating NORMAL content by user: ${userId}`);
    this.logger.log(`Title: ${dto.originalTitle}, Type: ${dto.publicationType}`);
    this.logger.log(`Site ID: ${dto.siteId}`);
    this.logger.log(`📝 [BACKEND] DTO completo recibido: ${JSON.stringify(dto)}`);

    try {
      // 1. Verificar que el sitio existe y está activo
      const site = await this.siteModel.findById(dto.siteId).exec();
      if (!site) {
        throw new Error(`Site with ID ${dto.siteId} not found`);
      }
      if (!site.isActive) {
        throw new Error(`Site ${site.domain} is not active`);
      }
      this.logger.log(`Using site: ${site.domain} (${site._id})`);

      // 2. Crear documento en UserGeneratedContent
      const userContent = new this.userContentModel({
        originalTitle: dto.originalTitle,
        originalContent: dto.originalContent,
        uploadedImageUrls: dto.uploadedImageUrls || [],
        uploadedVideoUrls: dto.uploadedVideoUrls || [],
        mode: 'normal',
        publicationType: dto.publicationType,
        isUrgent: false,
        agentId: new Types.ObjectId(dto.agentId),
        createdBy: new Types.ObjectId(userId),
        status: 'processing',
      });

      this.logger.log(`📝 [BACKEND] UserGeneratedContent ANTES de guardar - mode: ${userContent.mode}, isUrgent: ${userContent.isUrgent}`);
      await userContent.save();
      this.logger.log(`✅ User content document created: ${userContent._id}`);
      this.logger.log(`📝 [BACKEND] UserGeneratedContent DESPUÉS de guardar - mode: ${userContent.mode}, isUrgent: ${userContent.isUrgent}`);

      // 2. Procesar con IA (modo NORMAL - 500-700 palabras)
      this.logger.log('🤖 Processing with AI (NORMAL mode)...');

      // TODO FASE 6: Aquí usaremos buildNormalPrompt()
      const aiResult = await this.processWithAI(userContent, 'normal', dto.agentId, site);

      // 3. Actualizar referencias
      userContent.generatedContentId = aiResult.generatedContentId;
      userContent.publishedNoticiaId = aiResult.publishedNoticiaId;
      userContent.status = 'published';
      await userContent.save();

      // 4. Publicar según tipo
      if (dto.publicationType === 'breaking' || dto.publicationType === 'noticia') {
        this.logger.log(`📱 Publishing to social media (type: ${dto.publicationType})...`);
        await this.autoPublishToSocialMedia(aiResult.publishedNoticiaId);
      } else {
        this.logger.log('📝 Blog post - skipping social media publication');
      }

      this.logger.log(`✅ NORMAL content published successfully: ${userContent._id}`);
      return userContent;
    } catch (error) {
      this.logger.error(`❌ Error creating normal content: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error creating normal content');
    }
  }

  // ========================================
  // ✏️ ACTUALIZAR CONTENIDO URGENT
  // ========================================

  /**
   * Actualizar contenido URGENT
   * - Reemplaza el contenido existente
   * - Re-procesa con IA
   * - Re-publica
   * - REINICIA el timer de 2 horas
   */
  async updateUrgentContent(
    id: string,
    dto: UpdateUrgentContentDto,
    userId: string,
  ): Promise<UserGeneratedContentDocument> {
    this.logger.log(`✏️ Updating URGENT content: ${id}`);

    try {
      // 1. Buscar contenido urgent
      const userContent = await this.userContentModel.findById(id);
      if (!userContent) {
        throw new NotFoundException(`Content with ID ${id} not found`);
      }

      // 2. Verificar que sea urgent y no esté cerrado
      if (!userContent.isUrgent) {
        throw new BadRequestException('Only URGENT content can be updated');
      }

      if (userContent.urgentClosed) {
        throw new BadRequestException('Cannot update closed URGENT content');
      }

      // 3. Actualizar contenido original
      userContent.originalContent = dto.newContent;
      if (dto.newImageUrls) {
        userContent.uploadedImageUrls = dto.newImageUrls;
      }

      // 4. Obtener sitio del PublishedNoticia existente
      const existingPublished = await this.publishedNoticiaModel.findById(userContent.publishedNoticiaId).exec();
      if (!existingPublished || !existingPublished.sites || existingPublished.sites.length === 0) {
        throw new Error('Cannot find site for existing published content');
      }
      const siteId = existingPublished.sites[0];
      const site = await this.siteModel.findById(siteId).exec();
      if (!site) {
        throw new Error(`Site with ID ${siteId} not found`);
      }
      this.logger.log(`Using existing site: ${site.domain} (${site._id})`);

      // 5. REINICIAR timer de 2 horas
      const now = new Date();
      userContent.urgentAutoCloseAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      userContent.status = 'processing';

      await userContent.save();

      // 6. Re-procesar con IA
      this.logger.log('🤖 Re-processing with AI...');
      const aiResult = await this.processWithAI(
        userContent,
        'urgent',
        (userContent.agentId as Types.ObjectId).toString(),
        site,
      );

      // 6. Actualizar referencias
      userContent.generatedContentId = aiResult.generatedContentId;
      userContent.publishedNoticiaId = aiResult.publishedNoticiaId;
      userContent.status = 'published';

      // 7. Incrementar contador de actualizaciones
      if (!userContent.urgentMetrics) {
        userContent.urgentMetrics = {};
      }
      userContent.urgentMetrics.updatesCount = (userContent.urgentMetrics.updatesCount || 0) + 1;

      await userContent.save();

      // 8. Re-publicar en redes sociales
      this.logger.log('📱 Re-publishing to social media...');
      await this.autoPublishToSocialMedia(aiResult.publishedNoticiaId);

      // 9. Emitir evento de actualización
      this.eventEmitter.emit('content.urgent.updated', {
        userContentId: (userContent._id as Types.ObjectId).toString(),
        userId,
        newAutoCloseAt: userContent.urgentAutoCloseAt,
      });

      this.logger.log(`✅ URGENT content updated and timer restarted: ${userContent._id}`);
      return userContent;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`❌ Error updating urgent content: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error updating urgent content');
    }
  }

  // ========================================
  // 🔒 CERRAR CONTENIDO URGENT
  // ========================================

  /**
   * Cerrar contenido URGENT
   * - Puede ser manual (usuario) o automático (sistema después de 2h)
   * - Si es sistema, IA agrega párrafo de cierre
   * - Se remueve del cintillo "ÚLTIMO MOMENTO"
   */
  async closeUrgentContent(
    id: string,
    closedBy: 'user' | 'system',
    userId?: string,
  ): Promise<UserGeneratedContentDocument> {
    this.logger.log(`🔒 Closing URGENT content: ${id} (closedBy: ${closedBy})`);

    try {
      // 1. Buscar contenido urgent
      const userContent = await this.userContentModel.findById(id);
      if (!userContent) {
        throw new NotFoundException(`Content with ID ${id} not found`);
      }

      // 2. Verificar que sea urgent
      if (!userContent.isUrgent) {
        throw new BadRequestException('Only URGENT content can be closed');
      }

      // 3. Si ya está cerrado, retornar
      if (userContent.urgentClosed) {
        this.logger.warn(`Content ${id} already closed`);
        return userContent;
      }

      // 4. Si es cierre automático del sistema, agregar párrafo de cierre
      if (closedBy === 'system' && userContent.publishedNoticiaId) {
        this.logger.log('🤖 Generating closing paragraph with AI...');

        // TODO FASE 6: Implementar generateClosingParagraph()
        // Por ahora agregamos un texto estático
        const closingParagraph = `<p><em>Al cierre de este bloque informativo no se recibieron actualizaciones por parte de los involucrados.</em></p>`;

        // Actualizar contenido publicado
        const publishedNoticia = await this.publishedNoticiaModel.findById(
          userContent.publishedNoticiaId,
        );
        if (publishedNoticia) {
          publishedNoticia.content += `\n\n${closingParagraph}`;
          publishedNoticia.lastModifiedAt = new Date();
          await publishedNoticia.save();
          this.logger.log('✅ Closing paragraph added to published content');
        }
      }

      // 5. Marcar como cerrado
      userContent.urgentClosed = true;
      userContent.urgentClosedAt = new Date();
      userContent.urgentClosedBy = closedBy;
      userContent.status = 'closed';

      // 6. Calcular tiempo activo
      if (userContent.urgentCreatedAt) {
        const timeActive = Date.now() - userContent.urgentCreatedAt.getTime();
        if (!userContent.urgentMetrics) {
          userContent.urgentMetrics = {};
        }
        userContent.urgentMetrics.timeActive = timeActive;
        userContent.urgentMetrics.closureReason =
          closedBy === 'user' ? 'manual' : 'timeout';
      }

      await userContent.save();

      // 7. Emitir evento de cierre
      this.eventEmitter.emit('content.urgent.closed', {
        userContentId: (userContent._id as Types.ObjectId).toString(),
        closedBy,
        userId,
      });

      this.logger.log(`✅ URGENT content closed: ${userContent._id}`);
      return userContent;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`❌ Error closing urgent content: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error closing urgent content');
    }
  }

  // ========================================
  // 📋 LISTAR CONTENIDO URGENT ACTIVO
  // ========================================

  /**
   * Obtener contenido URGENT activo
   * - isUrgent: true
   * - urgentClosed: false
   * - status: 'published'
   * Ordenado por urgentCreatedAt DESC
   * PÚBLICO: Para cintillo de breaking news
   */
  async getActiveUrgentContent(): Promise<UserGeneratedContentDocument[]> {
    this.logger.log('📋 Getting active URGENT content...');

    try {
      const activeContent = await this.userContentModel
        .find({
          isUrgent: true,
          urgentClosed: false,
          status: 'published',
        })
        .populate('publishedNoticiaId', 'slug title') // Populate para obtener slug y title
        .sort({ urgentCreatedAt: -1 })
        .exec();

      this.logger.log(`✅ Found ${activeContent.length} active URGENT content items`);
      return activeContent;
    } catch (error) {
      this.logger.error(`❌ Error getting active urgent content: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error getting active urgent content');
    }
  }

  // ========================================
  // 🔧 MÉTODOS PRIVADOS AUXILIARES
  // ========================================

  /**
   * Procesar contenido con IA
   * Genera contenido enriquecido + copys sociales según modo (urgent/normal)
   */
  private async processWithAI(
    userContent: UserGeneratedContentDocument,
    mode: 'urgent' | 'normal',
    agentId: string,
    site: SiteDocument,
  ): Promise<{ generatedContentId: Types.ObjectId; publishedNoticiaId: Types.ObjectId }> {
    this.logger.log(`🤖 Processing with AI (mode: ${mode})...`);

    try {
      const startTime = Date.now();

      // 1. Crear ExtractedNoticiaDocument dummy para usar el prompt builder existente
      const dummyExtractedNoticia = {
        title: userContent.originalTitle,
        content: userContent.originalContent,
        _id: new Types.ObjectId(), // ID temporal
      } as any; // ExtractedNoticiaDocument

      // 2. Usar el prompt builder existente que SÍ inyecta la personalidad del agente
      this.logger.log('🎭 Building prompt with agent personality...');
      const promptResult = await this.promptBuilderService.buildPrompt({
        extractedNoticia: dummyExtractedNoticia,
        agentId: agentId,
      });

      // 3. Obtener configuración del agente para temperatura
      const agent = await this.agentModel.findById(agentId);
      if (!agent) {
        throw new Error(`Agent not found: ${agentId}`);
      }
      this.logger.log(`Using agent: ${agent.name} (${agent.agentType})`);
      this.logger.log(`Agent editorial lean: ${agent.editorialLean}`);
      this.logger.log(`Agent tone: ${agent.writingStyle.tone}`);

      // 4. Obtener proveedor óptimo (OpenAI)
      const providerAdapter = await this.providerFactoryService.getOptimalProvider({
        maxTokens: mode === 'urgent' ? 2000 : 3000,
        preferredProviders: ['openai'], // Usar solo OpenAI (ya configurado)
      });

      // 5. Usar IDs hardcodeados (mismo patrón que generateContent en controller)
      const defaultTemplateId = '60d5ecb74d3f4f001f1d3456';
      const defaultProviderId = '60d5ecb74d3f4f001f1d3457';

      // 6. Agregar contexto URGENT/NORMAL al systemPrompt base del agente
      const systemPrompt = mode === 'urgent'
        ? this.addUrgentContext(promptResult.systemPrompt)
        : this.addNormalContext(promptResult.systemPrompt);

      const userPrompt = promptResult.userPrompt;

      this.logger.debug(`System prompt length: ${systemPrompt.length} chars`);
      this.logger.debug(`User prompt length: ${userPrompt.length} chars`);

      this.logger.log(`Using provider: ${providerAdapter.providerName}`);

      // 7. Generar contenido con IA (temperatura ALTA para romper patrones)
      const temperature = agent.writingStyle.tone === 'formal' ? 1.1 : 1.3;
      this.logger.log(`Using temperature: ${temperature} (tone: ${agent.writingStyle.tone})`);
      this.logger.log('🔥 Using HIGH temperature to break robotic patterns');

      const response = await providerAdapter.generateContent({
        systemPrompt,
        userPrompt,
        maxTokens: mode === 'urgent' ? 2000 : 3000,
        temperature,
        frequencyPenalty: 0.8,  // ← Penaliza repeticiones más fuerte
        presencePenalty: 0.6,   // ← Fomenta temas nuevos
        // Stop sequences para evitar frases robóticas
        stopSequences: ['En resumen', 'En síntesis', 'En conclusión', 'Expertos señalan', 'Analistas indican'],
      });

      const processingTime = Date.now() - startTime;
      const cost = providerAdapter.calculateCost(response.usage);

      this.logger.log(`AI generation completed in ${processingTime}ms (${response.usage.totalTokens} tokens, $${cost})`);

      // 6. Parsear respuesta JSON
      const parsedContent = this.parseAIResponse(response.content);

      // 7. Crear documento AIContentGeneration
      const aiContent = new this.aiContentModel({
        originalTitle: userContent.originalTitle,
        originalContent: userContent.originalContent,
        generatedTitle: parsedContent.title || userContent.originalTitle,
        generatedContent: parsedContent.content,
        generatedKeywords: parsedContent.keywords || [],
        generatedTags: parsedContent.tags || [],
        generatedCategory: parsedContent.category || 'Noticias',
        generatedSummary: parsedContent.summary || '',
        urgent: mode === 'urgent',
        urgentCopyStyle: mode === 'urgent' ? 'aggressive' : 'normal',
        status: 'completed',
        // Referencias requeridas (IDs hardcodeados como en generateContent)
        agentId: agent._id,
        providerId: new Types.ObjectId(defaultProviderId),
        templateId: new Types.ObjectId(defaultTemplateId),
        generationMetadata: {
          model: response.model,
          promptTokens: response.usage.promptTokens,
          completionTokens: response.usage.completionTokens,
          totalTokens: response.usage.totalTokens,
          cost,
          processingTime,
          temperature, // ← Temperatura ajustada según agente
          maxTokens: mode === 'urgent' ? 2000 : 3000,
          finishReason: response.finishReason,
        },
        socialMediaCopies: parsedContent.socialMediaCopies,
      });

      await aiContent.save();
      this.logger.log(`✅ AIContentGeneration saved: ${aiContent._id}`);

      // 8. Crear documento PublishedNoticia
      const slug = this.generateSlug(parsedContent.title || userContent.originalTitle);
      this.logger.log(`📝 [BACKEND CRITICAL] Creando PublishedNoticia con mode="${mode}" -> isUrgent será: ${mode === 'urgent'}`);
      const publishedNoticia = new this.publishedNoticiaModel({
        contentId: aiContent._id,
        sites: [site._id], // 🌐 CRITICAL: Use site from DTO for multi-site filtering
        slug,
        title: parsedContent.title || userContent.originalTitle,
        content: parsedContent.content,
        summary: (parsedContent.summary || parsedContent.content.substring(0, 200)).substring(0, 400),
        category: parsedContent.category || 'Noticias',
        author: agent.name, // 👤 NUEVO: Nombre del agente editorial como autor
        isUrgent: mode === 'urgent',
        status: 'published',
        publishedAt: new Date(),
        // Featured image (primera imagen subida)
        ...(userContent.uploadedImageUrls.length > 0 && {
          featuredImage: {
            original: userContent.uploadedImageUrls[0],
            thumbnail: userContent.uploadedImageUrls[0],
            medium: userContent.uploadedImageUrls[0],
            large: userContent.uploadedImageUrls[0],
            alt: `${parsedContent.title || userContent.originalTitle}`,
            width: 1200,
            height: 630,
            s3Key: '',
          }
        }),
        // Additional images (resto de imágenes)
        ...(userContent.uploadedImageUrls.length > 1 && {
          additionalImages: userContent.uploadedImageUrls.slice(1).map((url, index) => ({
            url,
            alt: `Imagen ${index + 2} - ${parsedContent.title}`,
            width: 800,
            height: 500,
            s3Key: '',
          })),
        }),
        videos: userContent.uploadedVideoUrls.map((url, index) => ({
          url,
          provider: 'uploaded' as const,
          title: `Video ${index + 1}`,
          thumbnail: '',
        })),
        seo: {
          metaTitle: parsedContent.title || userContent.originalTitle,
          metaDescription: parsedContent.summary?.substring(0, 160) || parsedContent.content.substring(0, 160),
          focusKeyword: parsedContent.keywords?.[0] || 'noticias',
          canonicalUrl: `https://noticiaspachuca.com/${slug}`,
          ogTitle: parsedContent.title || userContent.originalTitle,
          ogDescription: parsedContent.summary?.substring(0, 160) || parsedContent.content.substring(0, 160),
          ogType: 'article' as const,
          ogUrl: `https://noticiaspachuca.com/${slug}`,
          ogImage: userContent.uploadedImageUrls[0],
          ogLocale: 'es_MX' as const,
          twitterCard: 'summary_large_image' as const,
          twitterTitle: parsedContent.title || userContent.originalTitle,
          twitterDescription: parsedContent.summary?.substring(0, 160) || parsedContent.content.substring(0, 160),
          twitterImage: userContent.uploadedImageUrls[0],
          structuredData: {},
        },
        publishingMetadata: {
          publishedBy: userContent.createdBy,
          publishedFrom: 'api' as const,
          imageSource: 'uploaded' as const,
          version: 1,
        },
      });

      await publishedNoticia.save();
      this.logger.log(`✅ PublishedNoticia saved: ${publishedNoticia._id}`);
      this.logger.log(`📝 [BACKEND CRITICAL] PublishedNoticia guardado con isUrgent: ${publishedNoticia.isUrgent}`);

      return {
        generatedContentId: aiContent._id as Types.ObjectId,
        publishedNoticiaId: publishedNoticia._id as Types.ObjectId,
      };
    } catch (error) {
      this.logger.error(`❌ Error in AI processing: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Auto-publicar en redes sociales
   * Usa SocialMediaPublishingService existente
   */
  private async autoPublishToSocialMedia(publishedNoticiaId: Types.ObjectId): Promise<void> {
    try {
      this.logger.log(`📱 Auto-publishing to social media: ${publishedNoticiaId}`);

      // 1. Obtener noticia publicada con copys sociales
      const publishedNoticia = await this.publishedNoticiaModel
        .findById(publishedNoticiaId)
        .populate('contentId')
        .exec();

      if (!publishedNoticia) {
        throw new Error(`Published noticia ${publishedNoticiaId} not found`);
      }

      // 2. Obtener Site principal (por ahora usamos el primero activo)
      const site = await this.siteModel.findOne({ isActive: true }).exec();
      if (!site) {
        this.logger.warn('⚠️ No active site found, skipping social media publication');
        return;
      }

      // 3. Verificar que tenga copys sociales en contentId (AIContentGeneration)
      const aiContent = publishedNoticia.contentId as unknown as AIContentGenerationDocument;
      if (!aiContent?.socialMediaCopies) {
        this.logger.warn('No social media copies found, skipping publication');
        return;
      }

      // 4. Publicar en Facebook
      if (aiContent.socialMediaCopies.facebook) {
        try {
          const facebookResults = await this.socialMediaPublishingService.publishToFacebook(
            publishedNoticia,
            site,
            new Date(), // Publicar inmediatamente
            false, // No optimizar contenido (ya viene optimizado)
          );
          const successCount = facebookResults.filter(r => r.success).length;
          this.logger.log(`✅ Published to ${successCount}/${facebookResults.length} Facebook pages`);
        } catch (error) {
          this.logger.error(`❌ Facebook publication failed: ${error.message}`);
        }
      }

      // 5. Publicar en Twitter
      if (aiContent.socialMediaCopies.twitter) {
        try {
          const twitterResults = await this.socialMediaPublishingService.publishToTwitter(
            publishedNoticia,
            site,
            new Date(), // Publicar inmediatamente
            false, // No optimizar contenido (ya viene optimizado)
          );
          const successCount = twitterResults.filter(r => r.success).length;
          this.logger.log(`✅ Published to ${successCount}/${twitterResults.length} Twitter accounts`);
        } catch (error) {
          this.logger.error(`❌ Twitter publication failed: ${error.message}`);
        }
      }

      this.logger.log('✅ Social media publication completed');
    } catch (error) {
      this.logger.error(`❌ Error publishing to social media: ${error.message}`, error.stack);
      // No lanzamos excepción para no bloquear el flujo principal
    }
  }


  /**
   * Parsear respuesta JSON de la IA
   */
  private parseAIResponse(content: string): {
    title: string;
    content: string;
    keywords: string[];
    tags: string[];
    category: string;
    summary: string;
    socialMediaCopies?: {
      facebook?: {
        hook: string;
        copy: string;
        emojis: string[];
        hashtag?: string; // 🆕 NUEVO: Hashtag único para Facebook
        hookType: string;
        estimatedEngagement: string;
        cta?: string; // 🆕 NUEVO: Call-to-action
        localAngle?: string; // 🆕 NUEVO: Ángulo local
        trustSignal?: string; // 🆕 NUEVO: Señal de confianza
        urgencySignal?: string; // 🆕 NUEVO: Señal de urgencia (breaking news)
        credibilitySource?: string; // 🆕 NUEVO: Fuente de credibilidad
      };
      twitter?: {
        tweet: string;
        hook: string;
        emojis: string[];
        hashtags?: string[]; // 🆕 NUEVO: Hashtags para Twitter (1-2 máximo)
        hookType: string;
        threadIdeas: string[];
      };
    };
  } {
    try {
      // Limpiar markdown si viene envuelto
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\n/, '').replace(/\n```$/, '');
      }

      const parsed = JSON.parse(cleanContent);

      return {
        title: parsed.title || 'Sin título',
        content: parsed.content || '',
        keywords: parsed.keywords || [],
        tags: parsed.tags || [],
        category: parsed.category || 'Noticias',
        summary: parsed.summary || '',
        socialMediaCopies: parsed.socialMediaCopies,
      };
    } catch (error) {
      this.logger.error(`Error parsing AI response: ${error.message}`);
      this.logger.debug(`Raw content: ${content.substring(0, 500)}`);
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  }

  /**
   * Generar slug SEO-friendly
   * Maneja caracteres Unicode especiales (bold, italic, etc.)
   */
  private generateSlug(title: string): string {
    // 1. Convertir Unicode Mathematical characters a ASCII normal
    let normalized = this.normalizeUnicodeToAscii(title);

    // 2. Proceso normal de slug
    let slug = normalized
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
      .trim()
      .replace(/\s+/g, '-') // Reemplazar espacios con guiones
      .replace(/-+/g, '-') // Remover guiones duplicados
      .substring(0, 100); // Limitar longitud

    // 3. Validar que el slug no esté vacío
    if (!slug || slug === '' || slug === '-') {
      slug = 'noticia'; // Fallback si el título no generó slug válido
    }

    // 4. Agregar timestamp para unicidad
    return `${slug}-${Date.now()}`;
  }

  /**
   * Convertir caracteres Unicode especiales a ASCII
   * Maneja Mathematical Bold, Italic, y otros caracteres decorativos
   */
  private normalizeUnicodeToAscii(text: string): string {
    return text.replace(/[\uD800-\uDFFF]./g, (char) => {
      const code = char.codePointAt(0) || 0;

      // Si el código es 0 (inválido), retornar original
      if (!code) return char;

      // Mathematical Bold Capital Letters (U+1D400 - U+1D419)
      if (code >= 0x1D400 && code <= 0x1D419) {
        return String.fromCharCode(0x41 + (code - 0x1D400)); // A-Z
      }
      // Mathematical Bold Small Letters (U+1D41A - U+1D433)
      if (code >= 0x1D41A && code <= 0x1D433) {
        return String.fromCharCode(0x61 + (code - 0x1D41A)); // a-z
      }
      // Mathematical Bold Italic Capital (U+1D468 - U+1D481)
      if (code >= 0x1D468 && code <= 0x1D481) {
        return String.fromCharCode(0x41 + (code - 0x1D468)); // A-Z
      }
      // Mathematical Bold Italic Small (U+1D482 - U+1D49B)
      if (code >= 0x1D482 && code <= 0x1D49B) {
        return String.fromCharCode(0x61 + (code - 0x1D482)); // a-z
      }
      // Mathematical Sans-Serif Bold Capital (U+1D5D4 - U+1D5ED) ← El que usa el usuario
      if (code >= 0x1D5D4 && code <= 0x1D5ED) {
        return String.fromCharCode(0x41 + (code - 0x1D5D4)); // A-Z
      }
      // Mathematical Sans-Serif Bold Small (U+1D5EE - U+1D607)
      if (code >= 0x1D5EE && code <= 0x1D607) {
        return String.fromCharCode(0x61 + (code - 0x1D5EE)); // a-z
      }
      // Mathematical Bold Digits (U+1D7CE - U+1D7D7) ← Números bold como 𝟭
      if (code >= 0x1D7CE && code <= 0x1D7D7) {
        return String.fromCharCode(0x30 + (code - 0x1D7CE)); // 0-9
      }
      // Mathematical Sans-Serif Bold Digits (U+1D7EC - U+1D7F5) ← El que usa el usuario
      if (code >= 0x1D7EC && code <= 0x1D7F5) {
        return String.fromCharCode(0x30 + (code - 0x1D7EC)); // 0-9
      }

      // Si no es un carácter Unicode matemático, retornar el original
      return char;
    });
  }

  // ========================================
  // 🎯 FUNCIONES HELPER - CONTEXTO URGENT/NORMAL
  // ========================================

  /**
   * Agregar contexto URGENT al systemPrompt base del agente
   */
  private addUrgentContext(baseSystemPrompt: string): string {
    return `${baseSystemPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 MODO URGENT - BREAKING NEWS DE ÚLTIMA HORA 🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 OBJETIVO ESPECÍFICO PARA ESTE CONTENIDO:
Aplicar tu voz y personalidad editorial al siguiente contenido de ÚLTIMA HORA:

⚡ REDACCIÓN CORTA: 300-500 palabras (MÁXIMO)
• Mantén tu estilo pero prioriza brevedad
• Lead con lo más impactante según tu criterio editorial
• 2-4 párrafos máximo con información esencial

🔥 COPYS AGRESIVOS: Hooks impactantes
• Usa tu voz para generar urgencia responsable
• Aplica tu línea editorial al enfoque de la urgencia
• Directo, sin rodeos, pero con tu perspectiva única

📱 BREAKING NEWS - Directrices según tu personalidad:
• Tono: Urgente + tu estilo personal
• Lead: Primera oración impactante filtrada por tu criterio
• Desarrollo: Información esencial con tu enfoque editorial
• Cierre: Abierto para actualizaciones (tu voz presente)
• NO uses frases largas ni descripciones extensas
• Prioriza HECHOS, pero interpreta según tu línea editorial

📱 COPYS DE REDES SOCIALES:
• Facebook: 40-60 palabras, urgencia + tu perspectiva
• Twitter: 200-240 caracteres, impacto + tu voz
• Emojis según tu estilo y audiencia
• Hashtags: 1 para FB, 1-2 para Twitter
• IMPORTANTE: Los campos hashtag/hashtags son OBLIGATORIOS

⚠️ RECUERDA: Eres tú escribiendo breaking news, no un bot genérico.
Tu personalidad, criterio y voz editorial SON LA PRIORIDAD.`;
  }

  /**
   * Agregar contexto NORMAL al systemPrompt base del agente
   */
  private addNormalContext(baseSystemPrompt: string): string {
    return `${baseSystemPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 MODO NORMAL - CONTENIDO PERIODÍSTICO ESTÁNDAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 OBJETIVO ESPECÍFICO PARA ESTE CONTENIDO:
Aplicar tu voz y personalidad editorial al siguiente contenido:

📰 REDACCIÓN ESTÁNDAR: 500-700 palabras
• Despliega completamente tu estilo de redacción
• Lead con tu enfoque editorial característico
• 4-8 párrafos con contexto según tu criterio

📱 COPYS BALANCEADOS: Hooks informativos
• Usa tu voz para construir valor
• Aplica tu línea editorial al ángulo de la noticia
• Informativo, pero filtrado por tu perspectiva única

✍️ DIRECTRICES según tu personalidad:
• Tono: Tu tono característico aplicado al contenido
• Lead: Información clave con tu enfoque editorial
• Desarrollo: Contexto y detalles según tu criterio
• Cierre: Conclusión o perspectiva desde tu voz
• Usa tu riqueza narrativa y vocabulario característico
• Incluye contexto/antecedentes según tu línea editorial

📜 HTML ENRIQUECIDO:
• Aplica enriquecimiento según tu estilo
• <strong> en nombres propios, datos críticos (tu criterio)
• <em> para énfasis editorial (máximo 2-5 veces)
• <blockquote> si citas textualmente (máximo 1-2)
• 10-15% del texto con enriquecimiento

📱 COPYS DE REDES SOCIALES:
• Facebook: 40-80 palabras, valor + tu perspectiva
• Twitter: 200-240 caracteres, información + tu voz
• Emojis según tu estilo y audiencia
• Hashtags: 1 para FB, 1-2 para Twitter
• IMPORTANTE: Los campos hashtag/hashtags son OBLIGATORIOS

⚠️ RECUERDA: Eres tú escribiendo contenido periodístico, no un bot genérico.
Tu personalidad, criterio y voz editorial SON LA PRIORIDAD.`;
  }
}
