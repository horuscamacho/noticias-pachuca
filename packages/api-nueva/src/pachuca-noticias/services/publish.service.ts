import { Injectable, BadRequestException, Logger, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PublishedNoticia, PublishedNoticiaDocument } from '../schemas/published-noticia.schema';
import {
  AIContentGeneration,
  AIContentGenerationDocument,
} from '../../content-ai/schemas/ai-content-generation.schema';
import { ExtractedNoticia } from '../../noticias/schemas/extracted-noticia.schema';
import { ContentAgent } from '../../generator-pro/schemas/content-agent.schema';
import { ImageBank, ImageBankDocument } from '../../image-bank/schemas/image-bank.schema';
import { ImageProcessorService, ProcessedImage } from './image-processor.service';
import { SlugGeneratorService } from './slug-generator.service';
import { SiteDetectionService } from './site-detection.service';
import { PublishNoticiaDto } from '../dto/publish-noticia.dto';
import { UpdateNoticiaDto } from '../dto/update-noticia.dto';
import { QueryNoticiasDto } from '../dto/query-noticias.dto';
import { AppConfigService } from '../../config/config.service';
import { SocialMediaPublishingService } from '../../generator-pro/services/social-media-publishing.service'; // 📱 FASE 12

@Injectable()
export class PublishService {
  private readonly logger = new Logger(PublishService.name);

  constructor(
    @InjectModel(PublishedNoticia.name)
    private publishedNoticiaModel: Model<PublishedNoticiaDocument>,
    @InjectModel(AIContentGeneration.name)
    private aiContentModel: Model<AIContentGenerationDocument>,
    @InjectModel(ImageBank.name)
    private imageBankModel: Model<ImageBankDocument>,
    private readonly imageProcessor: ImageProcessorService,
    private readonly slugGenerator: SlugGeneratorService,
    private readonly siteDetectionService: SiteDetectionService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: AppConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly socialMediaPublishingService: SocialMediaPublishingService, // 📱 FASE 12: Social Media Integration
  ) {}

  /**
   * Publica una noticia desde el contenido generado por IA
   * 🌐 FASE 4: Soporte multi-sitio
   * @param dto - DTO con los datos para publicar
   * @returns Noticia publicada completa
   */
  async publishNoticia(dto: PublishNoticiaDto): Promise<PublishedNoticiaDocument> {
    const startTime = Date.now();

    try {
      // 0️⃣ 🌐 FASE 4: Determinar sitios donde publicar
      let siteIds: string[];

      if (dto.siteIds && dto.siteIds.length > 0) {
        // Usar sitios especificados en el DTO
        siteIds = dto.siteIds;
        this.logger.log(`📍 Publicando en ${siteIds.length} sitio(s): ${siteIds.join(', ')}`);
      } else {
        // Usar sitio principal por defecto
        const mainSite = await this.siteDetectionService.getMainSite();
        siteIds = [mainSite.id];
        this.logger.log(`📍 Publicando en sitio principal: ${mainSite.name} (${mainSite.id})`);
      }

      // Convertir a ObjectIds para MongoDB
      const siteObjectIds = siteIds.map(id => new Types.ObjectId(id));

      // 1️⃣ Validar que no exista noticia publicada con ese contentId
      const existingPublished = await this.publishedNoticiaModel.findOne({
        contentId: dto.contentId,
      });

      if (existingPublished) {
        throw new BadRequestException(
          `Esta noticia ya está publicada con slug: ${existingPublished.slug}`,
        );
      }

      // 2️⃣ Obtener contenido generado completo
      const generatedContent = await this.aiContentModel
        .findById(dto.contentId)
        .populate('originalContentId')
        .populate('agentId');

      if (!generatedContent) {
        throw new NotFoundException('Contenido generado no encontrado');
      }

      if (generatedContent.status !== 'completed') {
        throw new BadRequestException(
          'El contenido debe estar completado antes de publicar',
        );
      }

      // 3️⃣ Generar slug único (verificando en los sitios especificados)
      const slug = await this.slugGenerator.generateUniqueSlug(
        generatedContent.generatedTitle,
        siteIds, // 🌐 Pasar siteIds para verificación multi-sitio
      );

      // 4️⃣ Procesar imágenes (opcional)
      let featuredImage: ProcessedImage | null = null;

      if (dto.imageBankId) {
        // 🏦 Opción 1: Usar imagen del banco
        const bankImage = await this.imageBankModel.findById(dto.imageBankId);

        if (!bankImage) {
          throw new BadRequestException('Imagen del banco no encontrada');
        }

        // Convertir formato del banco al formato ProcessedImage
        featuredImage = {
          original: bankImage.processedUrls.original,
          thumbnail: bankImage.processedUrls.thumbnail,
          medium: bankImage.processedUrls.medium,
          large: bankImage.processedUrls.large,
          alt: bankImage.altText || generatedContent.seoData?.altText || generatedContent.generatedTitle,
          width: bankImage.originalMetadata.width,
          height: bankImage.originalMetadata.height,
          s3Key: bankImage.processedUrls.s3BaseKey,
        };

        this.logger.log(`🖼️ Usando imagen del banco: ${bankImage._id}`);
      } else if (dto.useOriginalImage) {
        // 📰 Opción 2: Usar imagen del contenido original
        const originalContent = generatedContent.originalContentId as unknown as ExtractedNoticia;
        const imageUrl = originalContent?.images?.[0];

        if (imageUrl) {
          // Descargar, optimizar y subir a S3
          featuredImage = await this.imageProcessor.processAndUploadImage(
            imageUrl,
            slug,
            generatedContent.seoData?.altText || generatedContent.generatedTitle,
          );
        }
        // Si no hay imagen original, continuar sin imagen
      } else if (dto.customImageUrl) {
        // 🔗 Opción 3: Usar imagen personalizada desde URL
        featuredImage = await this.imageProcessor.processAndUploadImage(
          dto.customImageUrl,
          slug,
          generatedContent.seoData?.altText || generatedContent.generatedTitle,
        );
      }
      // Si no hay imagen, continuar sin ella

      // 5️⃣ Generar canonical URL
      const baseUrl = 'https://noticiaspachuca.com'; // TODO: Agregar a config cuando esté en producción
      const canonicalUrl = `${baseUrl}/noticia/${slug}`;

      // 6️⃣ Generar structured data (Schema.org NewsArticle)
      const structuredData = this.generateStructuredData(
        generatedContent,
        slug,
        canonicalUrl,
        featuredImage?.large,
      );

      // 7️⃣ Crear registro PublishedNoticia
      const publishedNoticia = new this.publishedNoticiaModel({
        contentId: generatedContent._id,
        originalNoticiaId: generatedContent.originalContentId,
        slug,
        title: generatedContent.generatedTitle,
        content: generatedContent.generatedContent,
        summary: (generatedContent.generatedSummary || '').substring(0, 400),
        extendedSummary: generatedContent.extendedSummary,
        featuredImage,
        category: generatedContent.generatedCategory?.toLowerCase() || 'general',
        tags: generatedContent.generatedTags || [],
        keywords: generatedContent.generatedKeywords || [],
        author: (generatedContent.agentId as unknown as ContentAgent)?.name || 'Redacción',

        // 🌐 FASE 4: Asignar sitios
        sites: siteObjectIds,

        seo: {
          metaTitle: generatedContent.generatedTitle.substring(0, 60),
          metaDescription:
            generatedContent.seoData?.metaDescription ||
            generatedContent.generatedSummary?.substring(0, 160) ||
            '',
          focusKeyword: generatedContent.seoData?.focusKeyword || '',
          canonicalUrl,

          ogTitle: generatedContent.seoData?.ogTitle || generatedContent.generatedTitle,
          ogDescription:
            generatedContent.seoData?.ogDescription || generatedContent.generatedSummary || '',
          ogImage: featuredImage?.large,
          ogType: 'article' as const,
          ogUrl: canonicalUrl,
          ogLocale: 'es_MX' as const,

          twitterCard: 'summary_large_image' as const,
          twitterTitle: generatedContent.generatedTitle.substring(0, 70),
          twitterDescription: generatedContent.generatedSummary?.substring(0, 200) || '',
          twitterImage: featuredImage?.large,

          structuredData,
        },

        publishedAt: new Date(),
        originalPublishedAt: (generatedContent.originalContentId as unknown as ExtractedNoticia)
          ?.publishedAt,

        status: 'published',
        isFeatured: dto.isFeatured || false,
        isBreaking: dto.isBreaking || false,
        priority: 5,

        socialMediaCopies: generatedContent.socialMediaCopies,

        publishingMetadata: {
          publishedBy: undefined, // TODO: Fase 2 con auth
          publishedFrom: 'dashboard',
          imageSource: dto.imageBankId ? 'image-bank' : dto.useOriginalImage ? 'original' : 'uploaded',
          processingTime: 0,
          version: 1,
        },

        stats: {
          views: 0,
          readTime: 0,
          shares: 0,
        },
      });

      await publishedNoticia.save();

      // 8️⃣ Actualizar AIContentGeneration con info de publicación
      generatedContent.publishingInfo = {
        publishedAt: new Date(),
        publishedBy: undefined,
        platform: 'web',
        url: canonicalUrl,
        socialShares: 0,
        views: 0,
      };
      await generatedContent.save();

      // 9️⃣ Calcular tiempo de procesamiento
      const processingTime = Date.now() - startTime;
      publishedNoticia.publishingMetadata.processingTime = processingTime;
      await publishedNoticia.save();

      // 🔟 Emitir evento
      this.eventEmitter.emit('noticia.published', {
        noticiaId: publishedNoticia._id,
        slug: publishedNoticia.slug,
        title: publishedNoticia.title,
        category: publishedNoticia.category,
        publishedAt: publishedNoticia.publishedAt,
        sites: siteIds, // 🌐 Incluir sitios en el evento
      });

      this.logger.log(
        `✅ Noticia publicada: ${slug} en ${siteIds.length} sitio(s) (${processingTime}ms)`,
      );

      // 🔟 Invalidar cache relacionado
      await this.invalidateRelatedCache(slug, publishedNoticia.category.toString());

      // 1️⃣1️⃣ 📱 FASE 12: Publicar en redes sociales (opcional)
      if (dto.publishToSocialMedia) {
        try {
          this.logger.log(`📱 Publicando en redes sociales: ${slug}`);

          const platforms = dto.socialMediaPlatforms || ['facebook', 'twitter'];
          const optimizeContent = dto.optimizeSocialContent !== false; // Default true

          const socialMediaResult = await this.socialMediaPublishingService.publishToSocialMedia(
            publishedNoticia,
            siteObjectIds,
            {
              platforms,
              optimizeContent,
            },
          );

          // Actualizar PublishedNoticia con tracking de social media
          const facebookPublishing = socialMediaResult.facebook.results.map((result) => ({
            pageId: result.facebookPageId,
            postId: result.postId,
            status: result.success ? ('published' as const) : ('failed' as const),
            engagement: {
              likes: 0,
              comments: 0,
              shares: 0,
            },
          }));

          const twitterPublishing = socialMediaResult.twitter.results.map((result) => ({
            accountId: result.twitterAccountId,
            tweetId: result.tweetId,
            status: result.success ? ('published' as const) : ('failed' as const),
            engagement: {
              likes: 0,
              retweets: 0,
              replies: 0,
            },
          }));

          publishedNoticia.socialMediaPublishing = {
            facebook: facebookPublishing,
            twitter: twitterPublishing,
          };

          await publishedNoticia.save();

          this.logger.log(
            `✅ Publicación en redes sociales completada: ` +
            `${socialMediaResult.summary.totalPublished}/${socialMediaResult.summary.totalPlatforms} exitosas`,
          );

          // Emitir evento de publicación en redes sociales
          this.eventEmitter.emit('noticia.social-media-published', {
            noticiaId: publishedNoticia._id,
            slug: publishedNoticia.slug,
            result: socialMediaResult,
            timestamp: new Date(),
          });

        } catch (error) {
          // NO bloquear la publicación principal si falla social media
          this.logger.error(`⚠️ Error publicando en redes sociales (no crítico): ${error.message}`);

          this.eventEmitter.emit('noticia.social-media-failed', {
            noticiaId: publishedNoticia._id,
            slug: publishedNoticia.slug,
            error: error.message,
            timestamp: new Date(),
          });
        }
      }

      return publishedNoticia;
    } catch (error) {
      this.logger.error('❌ Error publicando noticia:', error);
      throw error;
    }
  }

  /**
   * Genera el structured data de Schema.org NewsArticle
   * @param content - Contenido generado por IA
   * @param slug - Slug de la noticia
   * @param url - URL canónica
   * @param imageUrl - URL de la imagen principal (opcional)
   * @returns JSON-LD structured data
   */
  private generateStructuredData(
    content: AIContentGenerationDocument,
    slug: string,
    url: string,
    imageUrl?: string,
  ): Record<string, unknown> {
    const structuredData: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: content.generatedTitle,
      description: content.generatedSummary,
      datePublished:
        (content.originalContentId as unknown as ExtractedNoticia)?.publishedAt?.toISOString() ||
        new Date().toISOString(),
      dateModified: new Date().toISOString(),
      author: {
        '@type': 'Person',
        name:
          (content.agentId as unknown as ContentAgent)?.name ||
          'Redacción',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Noticias Pachuca',
        logo: {
          '@type': 'ImageObject',
          url: 'https://noticiaspachuca.com/logo.png',
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': url,
      },
      articleSection: content.generatedCategory,
      keywords: content.generatedKeywords?.join(', '),
    };

    // Agregar imagen solo si existe
    if (imageUrl) {
      structuredData.image = [imageUrl];
    }

    return structuredData;
  }

  /**
   * Despublica una noticia (cambia estado a unpublished)
   * @param slug - Slug de la noticia
   * @returns Noticia despublicada
   */
  async unpublishNoticia(slug: string): Promise<PublishedNoticiaDocument> {
    const noticia = await this.publishedNoticiaModel.findOne({ slug });

    if (!noticia) {
      throw new NotFoundException('Noticia no encontrada');
    }

    noticia.status = 'unpublished';
    await noticia.save();

    this.eventEmitter.emit('noticia.unpublished', {
      noticiaId: noticia._id,
      slug: noticia.slug,
    });

    this.logger.log(`📴 Noticia despublicada: ${slug}`);

    // Invalidar cache relacionado
    await this.invalidateRelatedCache(slug, noticia.category.toString());

    return noticia;
  }

  /**
   * Obtiene una noticia por slug
   * @param slug - Slug de la noticia
   * @returns Noticia encontrada
   */
  async getNoticiaBySlug(slug: string): Promise<PublishedNoticiaDocument | null> {
    return this.publishedNoticiaModel.findOne({ slug });
  }

  /**
   * Obtiene una noticia por ID
   * @param id - ID de la noticia
   * @returns Noticia encontrada
   */
  async getNoticiaById(id: string): Promise<PublishedNoticiaDocument | null> {
    return this.publishedNoticiaModel.findById(id);
  }

  /**
   * Actualiza una noticia existente
   * @param id - ID de la noticia
   * @param dto - Datos a actualizar
   * @returns Noticia actualizada
   */
  async updateNoticia(
    id: string,
    dto: UpdateNoticiaDto,
  ): Promise<PublishedNoticiaDocument> {
    const noticia = await this.publishedNoticiaModel.findById(id);

    if (!noticia) {
      throw new NotFoundException('Noticia no encontrada');
    }

    Object.assign(noticia, dto);
    await noticia.save();

    this.logger.log(`✏️ Noticia actualizada: ${noticia.slug}`);

    return noticia;
  }

  /**
   * Lista noticias con filtros y paginación
   * @param query - Parámetros de consulta
   * @returns Lista de noticias y metadata de paginación
   */
  async queryNoticias(query: QueryNoticiasDto): Promise<{
    data: PublishedNoticiaDocument[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      isFeatured,
      isBreaking,
      isUrgent,
      search,
      sortBy = 'publishedAt',
      sortOrder = 'desc',
    } = query;

    // Construir filtro
    const filter: Record<string, unknown> = {};

    if (status) {
      filter.status = status;
    }

    if (category) {
      filter.category = category.toLowerCase();
    }

    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured;
    }

    if (isBreaking !== undefined) {
      filter.isBreaking = isBreaking;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    // Filtro para noticias urgentes
    // Si isUrgent === true, mostrar SOLO noticias urgentes
    // Si isUrgent === false o undefined, EXCLUIR noticias urgentes (usar $ne: true)
    // Esto maneja correctamente documentos donde isUrgent no existe, es null, o es false
    if (isUrgent === true) {
      filter.isUrgent = true;
    } else {
      // Para false o undefined, excluir urgentes (incluye: undefined, null, false)
      filter.isUrgent = { $ne: true };
    }

    // Ordenamiento
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Ejecutar query con paginación
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.publishedNoticiaModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.publishedNoticiaModel.countDocuments(filter),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtiene noticias relacionadas por categoría
   * @param category - Categoría
   * @param excludeSlug - Slug a excluir
   * @param limit - Límite de resultados
   * @returns Lista de noticias relacionadas
   */
  async getRelatedNoticias(
    category: string,
    excludeSlug: string,
    limit: number = 5,
  ): Promise<PublishedNoticiaDocument[]> {
    return this.publishedNoticiaModel
      .find({
        category: category.toLowerCase(),
        slug: { $ne: excludeSlug },
        status: 'published',
      })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Invalida cache relacionado a una noticia
   * @param slug - Slug de la noticia
   * @param category - Categoría de la noticia
   */
  private async invalidateRelatedCache(slug: string, category: string): Promise<void> {
    try {
      // Invalidar listado general de noticias
      // Como el cache usa query params, necesitamos invalidar patrones
      await this.cacheManager.del('/pachuca-noticias');

      // Invalidar noticia específica por slug
      await this.cacheManager.del(`/pachuca-noticias/slug/${slug}`);

      // Invalidar noticias relacionadas de esta categoría
      await this.cacheManager.del(`/pachuca-noticias/related/${category}/${slug}`);

      this.logger.debug(`🗑️ Cache invalidado para noticia: ${slug}`);
    } catch (error) {
      this.logger.warn('⚠️ Error invalidando cache:', error);
      // No lanzar error, solo log warning
    }
  }
}
