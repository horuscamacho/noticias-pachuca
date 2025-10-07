import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Category,
  CategoryDocument,
} from '../schemas/category.schema';
import {
  PublishedNoticia,
  PublishedNoticiaDocument,
} from '../schemas/published-noticia.schema';
import {
  CategoryResponseDto,
  PublicNoticiaResponseDto,
  SearchResultDto,
  PaginatedResponseDto,
} from '../dto/public-content.dto';

/**
 * 🌐 Public Content Service
 * Servicio para contenido público (categorías, búsqueda)
 * Sin autenticación, con caché y rate limiting
 */
@Injectable()
export class PublicContentService {
  private readonly logger = new Logger(PublicContentService.name);
  private categoriesCache: CategoryResponseDto[] | null = null;
  private cacheTimestamp: number | null = null;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(PublishedNoticia.name) private publishedNoticiaModel: Model<PublishedNoticiaDocument>,
    private eventEmitter: EventEmitter2,
  ) {
    // Escuchar evento para invalidar caché cuando se publique/actualice categoría
    this.eventEmitter.on('category.updated', () => {
      this.invalidateCache();
    });
  }

  /**
   * Obtener lista de categorías activas con contadores
   */
  async getCategories(): Promise<CategoryResponseDto[]> {
    // Revisar caché
    if (this.categoriesCache && this.cacheTimestamp) {
      const age = Date.now() - this.cacheTimestamp;
      if (age < this.CACHE_TTL) {
        this.logger.log('Retornando categorías desde caché');
        return this.categoriesCache;
      }
    }

    // Intentar primero desde colección Category
    const categories = await this.categoryModel
      .find({ isActive: true })
      .sort({ order: 1, name: 1 })
      .lean()
      .exec();

    let categoriesWithCount: CategoryResponseDto[];

    if (categories.length > 0) {
      // Si existen categorías en la colección, usarlas
      categoriesWithCount = await Promise.all(
        categories.map(async (cat) => {
          const count = await this.publishedNoticiaModel.countDocuments({
            category: cat._id,
            status: 'published',
          });

          return {
            id: cat._id.toString(),
            slug: cat.slug,
            name: cat.name,
            description: cat.description,
            color: cat.color,
            icon: cat.icon,
            count,
            seoTitle: cat.seoTitle,
            seoDescription: cat.seoDescription,
          };
        })
      );
    } else {
      // Si no hay categorías en colección, extraer desde noticias publicadas
      this.logger.warn('No se encontraron categorías en Category collection, extrayendo desde noticias publicadas');

      const categoryAggregation = await this.publishedNoticiaModel.aggregate([
        { $match: { status: 'published' } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
      ]);

      categoriesWithCount = categoryAggregation
        .filter((cat) => cat._id && typeof cat._id === 'string')
        .map((cat) => {
          const categoryName = cat._id as string;
          const slug = categoryName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

          return {
            id: slug,
            slug,
            name: categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
            description: `Noticias de ${categoryName}`,
            color: '#854836',
            icon: '',
            count: cat.count,
            seoTitle: `${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} - Noticias Pachuca`,
            seoDescription: `Las mejores noticias de ${categoryName} en Hidalgo`,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    // Guardar en caché
    this.categoriesCache = categoriesWithCount;
    this.cacheTimestamp = Date.now();

    this.logger.log(`Retornando ${categoriesWithCount.length} categorías activas`);
    return categoriesWithCount;
  }

  /**
   * Obtener noticias por categoría (paginadas)
   */
  async getNoticiasByCategory(
    slug: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponseDto<PublicNoticiaResponseDto>> {
    const skip = (page - 1) * limit;

    // Intentar buscar en Category collection primero
    const category = await this.categoryModel.findOne({ slug, isActive: true }).lean().exec();

    let categoryFilter: Record<string, unknown>;

    if (category) {
      // Si existe en Category, buscar por ObjectId
      categoryFilter = { category: category._id, status: 'published' };
    } else {
      // Si no existe, buscar por string (normalizar slug a category name sin acentos)
      const categoryName = slug.replace(/-/g, ' ');

      // Crear regex que ignore acentos
      const normalizedPattern = categoryName
        .replace(/a/gi, '[aáàäâ]')
        .replace(/e/gi, '[eéèëê]')
        .replace(/i/gi, '[iíìïî]')
        .replace(/o/gi, '[oóòöô]')
        .replace(/u/gi, '[uúùüû]')
        .replace(/n/gi, '[nñ]');

      categoryFilter = {
        category: { $regex: new RegExp(`^${normalizedPattern}$`, 'i') },
        status: 'published',
      };
    }

    // Buscar noticias (sin populate si category es string)
    let query = this.publishedNoticiaModel
      .find(categoryFilter)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Solo hacer populate si existe una categoría ObjectId
    if (category) {
      query = query.populate('category');
    }

    const [noticias, total] = await Promise.all([
      query.lean().exec(),
      this.publishedNoticiaModel.countDocuments(categoryFilter),
    ]);

    if (total === 0) {
      throw new NotFoundException(`Categoría "${slug}" no encontrada o sin noticias`);
    }

    const data = noticias.map((noticia) => this.mapToPublicNoticiaDto(noticia));

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  /**
   * Obtener noticias por tag (paginadas)
   */
  async getNoticiasByTag(
    slug: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponseDto<PublicNoticiaResponseDto>> {
    const skip = (page - 1) * limit;

    // Convertir slug a tag (reemplazar guiones por espacios)
    const tag = slug.replace(/-/g, ' ');

    const [noticias, total] = await Promise.all([
      this.publishedNoticiaModel
        .find({
          status: 'published',
          tags: { $regex: new RegExp(`^${tag}$`, 'i') },
        })
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.publishedNoticiaModel.countDocuments({
        status: 'published',
        tags: { $regex: new RegExp(`^${tag}$`, 'i') },
      }),
    ]);

    if (total === 0) {
      throw new NotFoundException(`No se encontraron noticias con el tag "${tag}"`);
    }

    const data = noticias.map((noticia) => this.mapToPublicNoticiaDto(noticia));

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  /**
   * Obtener noticias por autor (paginadas)
   */
  async getNoticiasByAuthor(
    slug: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponseDto<PublicNoticiaResponseDto>> {
    const skip = (page - 1) * limit;

    // Convertir slug a nombre de autor (reemplazar guiones por espacios y capitalizar)
    const authorName = slug.replace(/-/g, ' ');

    const [noticias, total] = await Promise.all([
      this.publishedNoticiaModel
        .find({
          status: 'published',
          author: { $regex: new RegExp(`^${authorName}$`, 'i') },
        })
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.publishedNoticiaModel.countDocuments({
        status: 'published',
        author: { $regex: new RegExp(`^${authorName}$`, 'i') },
      }),
    ]);

    if (total === 0) {
      throw new NotFoundException(`No se encontraron noticias del autor "${authorName}"`);
    }

    const data = noticias.map((noticia) => this.mapToPublicNoticiaDto(noticia));

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  /**
   * Búsqueda full-text de noticias
   */
  async searchNoticias(
    query: string,
    categorySlug?: string,
    sortBy: 'relevance' | 'date' = 'relevance',
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponseDto<SearchResultDto>> {
    const skip = (page - 1) * limit;

    // Construir filtros
    const filters: Record<string, unknown> = {
      status: 'published',
      $text: { $search: query },
    };

    // Filtro por categoría si se proporciona
    let categoryObjectId: Record<string, unknown> | null = null;
    if (categorySlug) {
      const category = await this.categoryModel.findOne({ slug: categorySlug }).lean().exec();
      if (category) {
        filters.category = category._id;
        categoryObjectId = category;
      } else {
        // Si no existe en Category, buscar por string (normalizar slug a category name sin acentos)
        const categoryName = categorySlug.replace(/-/g, ' ');

        // Crear regex que ignore acentos
        const normalizedPattern = categoryName
          .replace(/a/gi, '[aáàäâ]')
          .replace(/e/gi, '[eéèëê]')
          .replace(/i/gi, '[iíìïî]')
          .replace(/o/gi, '[oóòöô]')
          .replace(/u/gi, '[uúùüû]')
          .replace(/n/gi, '[nñ]');

        filters.category = { $regex: new RegExp(`^${normalizedPattern}$`, 'i') };
      }
    }

    // Buscar con full-text search
    let searchQuery = this.publishedNoticiaModel
      .find(filters, sortBy === 'relevance' ? { score: { $meta: 'textScore' } } : {});

    // Aplicar sort según criterio
    if (sortBy === 'relevance') {
      searchQuery = searchQuery.sort({ score: { $meta: 'textScore' }, publishedAt: -1 } as never);
    } else {
      searchQuery = searchQuery.sort({ publishedAt: -1 });
    }

    // Solo hacer populate si encontramos una categoría ObjectId
    if (categoryObjectId) {
      searchQuery = searchQuery.populate('category');
    }

    const [noticias, total] = await Promise.all([
      searchQuery
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.publishedNoticiaModel.countDocuments(filters),
    ]);

    const data = noticias.map((noticia) => this.mapToSearchResultDto(noticia, query));

    const totalPages = Math.ceil(total / limit);

    this.logger.log(`Búsqueda "${query}": ${total} resultados`);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  /**
   * Mapear noticia a DTO público
   */
  private mapToPublicNoticiaDto(noticia: Record<string, unknown>): PublicNoticiaResponseDto {
    const category = noticia.category as Record<string, unknown> | string;

    // Si category es string, generar slug y usar valores por defecto
    let categoryName: string;
    let categorySlug: string;
    let categoryColor: string;

    if (typeof category === 'string') {
      categoryName = category.charAt(0).toUpperCase() + category.slice(1);
      categorySlug = category
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      categoryColor = '#854836';
    } else {
      categoryName = category?.name as string;
      categorySlug = category?.slug as string;
      categoryColor = category?.color as string;
    }

    return {
      id: (noticia._id as Types.ObjectId).toString(),
      slug: noticia.slug as string,
      title: noticia.title as string,
      summary: noticia.summary as string,
      featuredImage: (noticia.featuredImage as Record<string, unknown>)?.medium as string | undefined,
      categoryName,
      categorySlug,
      categoryColor,
      tags: (noticia.tags as string[]) || [],
      publishedAt: (noticia.publishedAt as Date).toISOString(),
      author: noticia.author as string | undefined,
      readTime: this.calculateReadTime(noticia.content as string),
    };
  }

  /**
   * Mapear noticia a DTO de resultado de búsqueda
   */
  private mapToSearchResultDto(noticia: Record<string, unknown>, query: string): SearchResultDto {
    const category = noticia.category as Record<string, unknown> | string;
    const content = noticia.content as string;

    // Si category es string, generar slug y usar valores por defecto
    let categoryName: string;
    let categorySlug: string;

    if (typeof category === 'string') {
      categoryName = category.charAt(0).toUpperCase() + category.slice(1);
      categorySlug = category
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    } else {
      categoryName = category?.name as string;
      categorySlug = category?.slug as string;
    }

    return {
      id: (noticia._id as Types.ObjectId).toString(),
      slug: noticia.slug as string,
      title: noticia.title as string,
      summary: noticia.summary as string,
      featuredImage: (noticia.featuredImage as Record<string, unknown>)?.medium as string | undefined,
      categoryName,
      categorySlug,
      publishedAt: (noticia.publishedAt as Date).toISOString(),
      score: (noticia as Record<string, unknown>).score as number | undefined,
      highlight: this.extractHighlight(content, query),
    };
  }

  /**
   * Extraer fragmento relevante de texto con el término de búsqueda
   */
  private extractHighlight(content: string, query: string): string {
    // Remover HTML
    const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    // Buscar término (case-insensitive)
    const lowerContent = plainText.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerContent.indexOf(lowerQuery);

    if (index === -1) {
      // Si no se encuentra, retornar inicio
      return plainText.substring(0, 150) + '...';
    }

    // Extraer contexto alrededor del término (75 chars antes y después)
    const start = Math.max(0, index - 75);
    const end = Math.min(plainText.length, index + query.length + 75);

    let highlight = plainText.substring(start, end);

    // Agregar elipsis si no es el inicio/fin
    if (start > 0) highlight = '...' + highlight;
    if (end < plainText.length) highlight = highlight + '...';

    // Resaltar término (retornar sin HTML, el frontend lo resaltará)
    return highlight;
  }

  /**
   * Calcular tiempo de lectura estimado (palabras por minuto)
   */
  private calculateReadTime(content: string): number {
    const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = plainText.split(' ').length;
    const wordsPerMinute = 200;
    return Math.ceil(words / wordsPerMinute);
  }

  /**
   * Invalidar caché de categorías
   */
  private invalidateCache(): void {
    this.logger.log('Invalidando caché de categorías');
    this.categoriesCache = null;
    this.cacheTimestamp = null;
  }
}
