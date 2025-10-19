import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, PipelineStage } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ImageBank, ImageBankDocument } from '../schemas/image-bank.schema';
import { ImageBankProcessorService } from './image-bank-processor.service';
import { PaginationService } from '../../common/services/pagination.service';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import {
  CreateImageBankDto,
  UpdateImageBankDto,
  ImageBankFiltersDto,
  ProcessImageDto,
} from '../dto/image-bank.dto';
import {
  IMAGE_BANK_EVENTS,
  ImageCreatedEvent,
  ImageUpdatedEvent,
  ImageDeletedEvent,
} from '../events/image-bank.events';

/**
 * 🖼️ Image Bank Service
 *
 * Servicio principal del banco de imágenes.
 *
 * Responsabilidades:
 * - CRUD de imágenes en MongoDB
 * - Filtrado y búsqueda con paginación
 * - Agregaciones (keywords, outlets, categories)
 * - Coordinación con ImageBankProcessorService para procesamiento
 * - Estadísticas del banco
 */
@Injectable()
export class ImageBankService {
  private readonly logger = new Logger(ImageBankService.name);

  constructor(
    @InjectModel(ImageBank.name)
    private readonly imageBankModel: Model<ImageBankDocument>,
    private readonly processorService: ImageBankProcessorService,
    private readonly paginationService: PaginationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ============================================================================
  // CRUD BÁSICO
  // ============================================================================

  /**
   * Crear imagen manualmente en el banco
   */
  async create(createDto: CreateImageBankDto): Promise<ImageBankDocument> {
    this.logger.log(`📝 Creando imagen en banco: ${createDto.outlet}`);

    const imageBank = new this.imageBankModel({
      processedUrls: createDto.processedUrls,
      originalMetadata: createDto.originalMetadata,
      keywords: createDto.keywords || [],
      outlet: createDto.outlet,
      categories: createDto.categories || [],
      extractedNoticiaId: createDto.extractedNoticiaId
        ? new Types.ObjectId(createDto.extractedNoticiaId)
        : undefined,
      sourceUrl: createDto.sourceUrl,
      extractedAt: createDto.extractedAt,
      altText: createDto.altText,
      caption: createDto.caption,
      tags: createDto.tags || [],
      quality: createDto.quality || 'medium',
      metadataRemoved: true,
      processedAt: new Date(),
      processedByVersion: 'sharp-0.33.5',
      isActive: true,
    });

    const saved = await imageBank.save();
    this.logger.log(`✅ Imagen creada con ID: ${saved._id}`);

    // Emitir evento de creación
    const event: ImageCreatedEvent = {
      imageId: String(saved._id),
      outlet: saved.outlet,
      keywords: saved.keywords,
      categories: saved.categories,
      quality: saved.quality,
      extractedNoticiaId: saved.extractedNoticiaId?.toString(),
      createdAt: saved.createdAt,
    };
    this.eventEmitter.emit(IMAGE_BANK_EVENTS.IMAGE_CREATED, event);

    return saved;
  }

  /**
   * Procesar imagen desde URL y almacenar en banco
   */
  async processAndStore(processDto: ProcessImageDto): Promise<ImageBankDocument> {
    this.logger.log(`🖼️ Procesando y almacenando imagen: ${processDto.imageUrl}`);

    try {
      // Generar ID temporal para la imagen
      const imageId = new Types.ObjectId().toString();

      // Procesar imagen (descarga, resize, upload a S3, metadata removal)
      const processed = await this.processorService.downloadAndProcessImage(
        processDto.imageUrl,
        processDto.outlet,
        imageId,
      );

      if (!processed.processedUrls) {
        throw new Error('Image processing failed: no URLs returned');
      }

      // Crear entrada en MongoDB
      const createDto: CreateImageBankDto = {
        processedUrls: processed.processedUrls,
        originalMetadata: {
          url: processDto.imageUrl,
          width: processed.originalMetadata.width,
          height: processed.originalMetadata.height,
          format: processed.originalMetadata.format,
          sizeBytes: processed.originalMetadata.sizeBytes,
        },
        keywords: processDto.keywords || [],
        outlet: processDto.outlet,
        categories: processDto.categories || [],
        extractedNoticiaId: processDto.extractedNoticiaId,
        sourceUrl: processDto.imageUrl,
        extractedAt: new Date(),
        altText: processDto.altText,
        caption: processDto.caption,
        tags: processDto.tags || [],
        quality: processed.quality,
      };

      const imageBank = await this.create(createDto);

      this.logger.log(
        `✅ Imagen procesada y almacenada exitosamente: ${imageBank._id}`,
      );

      return imageBank;
    } catch (error) {
      this.logger.error('❌ Error procesando y almacenando imagen:', error);
      throw error;
    }
  }

  /**
   * Buscar imagen por ID
   */
  async findById(id: string): Promise<ImageBankDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      this.logger.warn(`⚠️ ID inválido: ${id}`);
      return null;
    }

    return await this.imageBankModel.findById(id).exec();
  }

  /**
   * Buscar imagen por filtro genérico
   */
  async findOne(filter: Record<string, unknown>): Promise<ImageBankDocument | null> {
    return await this.imageBankModel.findOne(filter).exec();
  }

  /**
   * Actualizar imagen
   */
  async update(
    id: string,
    updateDto: UpdateImageBankDto,
  ): Promise<ImageBankDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      this.logger.warn(`⚠️ ID inválido: ${id}`);
      return null;
    }

    this.logger.log(`📝 Actualizando imagen: ${id}`);

    const updated = await this.imageBankModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();

    if (updated) {
      this.logger.log(`✅ Imagen actualizada: ${id}`);

      // Emitir evento de actualización
      const event: ImageUpdatedEvent = {
        imageId: String(updated._id),
        updatedFields: Object.keys(updateDto),
        outlet: updated.outlet,
        updatedAt: updated.updatedAt,
      };
      this.eventEmitter.emit(IMAGE_BANK_EVENTS.IMAGE_UPDATED, event);
    } else {
      this.logger.warn(`⚠️ Imagen no encontrada: ${id}`);
    }

    return updated;
  }

  /**
   * Soft delete de imagen
   */
  async softDelete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      this.logger.warn(`⚠️ ID inválido: ${id}`);
      return false;
    }

    this.logger.log(`🗑️ Eliminando imagen (soft delete): ${id}`);

    // Buscar imagen antes de eliminar para emitir evento con datos
    const image = await this.imageBankModel.findById(id).exec();

    const result = await this.imageBankModel
      .updateOne({ _id: id }, { isActive: false })
      .exec();

    if (result.matchedCount > 0) {
      this.logger.log(`✅ Imagen eliminada (soft delete): ${id}`);

      // Emitir evento de eliminación
      if (image) {
        const event: ImageDeletedEvent = {
          imageId: id,
          outlet: image.outlet,
          deletedAt: new Date(),
        };
        this.eventEmitter.emit(IMAGE_BANK_EVENTS.IMAGE_DELETED, event);
      }

      return true;
    } else {
      this.logger.warn(`⚠️ Imagen no encontrada: ${id}`);
      return false;
    }
  }

  // ============================================================================
  // BÚSQUEDA Y FILTRADO
  // ============================================================================

  /**
   * Buscar imágenes con filtros y paginación
   */
  async findWithFilters(
    filtersDto: ImageBankFiltersDto,
  ): Promise<PaginatedResponse<ImageBankDocument>> {
    this.logger.log('🔍 Buscando imágenes con filtros');

    // Construir filtro MongoDB
    const filter: Record<string, unknown> = {};

    // Filtro de isActive (default: true)
    if (filtersDto.isActive !== undefined) {
      filter.isActive = filtersDto.isActive;
    } else {
      filter.isActive = true;
    }

    // Filtro por outlet
    if (filtersDto.outlet) {
      filter.outlet = filtersDto.outlet;
    }

    // Filtro por quality
    if (filtersDto.quality) {
      filter.quality = filtersDto.quality;
    }

    // Filtro por keywords (array $in)
    if (filtersDto.keywords) {
      const keywordsArray = filtersDto.keywords.split(',').map((k) => k.trim());
      filter.keywords = { $in: keywordsArray };
    }

    // Filtro por categories (array $in)
    if (filtersDto.categories) {
      const categoriesArray = filtersDto.categories
        .split(',')
        .map((c) => c.trim());
      filter.categories = { $in: categoriesArray };
    }

    // Filtro por author
    if (filtersDto.author) {
      filter.author = { $regex: filtersDto.author, $options: 'i' };
    }

    // Filtro por captureType
    if (filtersDto.captureType) {
      filter.captureType = filtersDto.captureType;
    }

    // Búsqueda de texto (usando text index)
    if (filtersDto.searchText) {
      filter.$text = { $search: filtersDto.searchText };
    }

    // Opciones de paginación
    const paginationOptions = {
      page: filtersDto.page || 1,
      limit: filtersDto.limit || 10,
    };

    // Opciones de sorting
    const sortOptions: Record<string, 1 | -1> = {};

    if (filtersDto.sortBy) {
      sortOptions[filtersDto.sortBy] =
        filtersDto.sortOrder === 'asc' ? 1 : -1;
    } else {
      // Default: ordenar por createdAt descendente
      sortOptions.createdAt = -1;
    }

    // Ejecutar búsqueda con paginación
    const result = await this.paginationService.paginate(
      this.imageBankModel,
      paginationOptions,
      filter,
      {
        sort: sortOptions,
      },
    );

    this.logger.log(`✅ Encontradas ${result.pagination.total} imágenes`);

    return result;
  }

  // ============================================================================
  // AGREGACIONES
  // ============================================================================

  /**
   * Obtener keywords con conteo
   */
  async getKeywordsAggregation(
    search?: string,
  ): Promise<Array<{ keyword: string; count: number }>> {
    this.logger.log('📊 Agregando keywords');

    const pipeline: PipelineStage[] = [
      { $match: { isActive: true } },
      { $unwind: '$keywords' },
    ];

    // Si hay búsqueda, filtrar keywords
    if (search) {
      pipeline.push({
        $match: {
          keywords: { $regex: search, $options: 'i' },
        },
      });
    }

    pipeline.push(
      {
        $group: {
          _id: '$keywords',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          keyword: '$_id',
          count: 1,
        },
      },
      { $sort: { count: -1 } },
      { $limit: 100 },
    );

    const results = await this.imageBankModel.aggregate(pipeline).exec();

    this.logger.log(`✅ ${results.length} keywords encontrados`);

    return results;
  }

  /**
   * Obtener outlets con conteo
   */
  async getOutletsAggregation(): Promise<
    Array<{ outlet: string; count: number }>
  > {
    this.logger.log('📊 Agregando outlets');

    const results = await this.imageBankModel
      .aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$outlet',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            outlet: '$_id',
            count: 1,
          },
        },
        { $sort: { count: -1 } },
      ])
      .exec();

    this.logger.log(`✅ ${results.length} outlets encontrados`);

    return results;
  }

  /**
   * Obtener categorías con conteo
   */
  async getCategoriesAggregation(): Promise<
    Array<{ category: string; count: number }>
  > {
    this.logger.log('📊 Agregando categorías');

    const results = await this.imageBankModel
      .aggregate([
        { $match: { isActive: true } },
        { $unwind: '$categories' },
        {
          $group: {
            _id: '$categories',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            category: '$_id',
            count: 1,
          },
        },
        { $sort: { count: -1 } },
      ])
      .exec();

    this.logger.log(`✅ ${results.length} categorías encontradas`);

    return results;
  }

  /**
   * Obtener estadísticas generales
   */
  async getStats(): Promise<{
    total: number;
    byQuality: Record<string, number>;
    byOutlet: Array<{ outlet: string; count: number }>;
    totalKeywords: number;
    totalCategories: number;
  }> {
    this.logger.log('📊 Obteniendo estadísticas generales');

    // Total de imágenes activas
    const total = await this.imageBankModel
      .countDocuments({ isActive: true })
      .exec();

    // Por calidad
    const byQualityAgg = await this.imageBankModel
      .aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$quality',
            count: { $sum: 1 },
          },
        },
      ])
      .exec();

    const byQuality: Record<string, number> = {
      high: 0,
      medium: 0,
      low: 0,
    };

    byQualityAgg.forEach((item) => {
      byQuality[item._id] = item.count;
    });

    // Por outlet (top 10)
    const byOutlet = await this.getOutletsAggregation();

    // Total keywords únicas
    const keywordsAgg = await this.imageBankModel
      .aggregate([
        { $match: { isActive: true } },
        { $unwind: '$keywords' },
        { $group: { _id: '$keywords' } },
        { $count: 'total' },
      ])
      .exec();

    const totalKeywords = keywordsAgg[0]?.total || 0;

    // Total categorías únicas
    const categoriesAgg = await this.imageBankModel
      .aggregate([
        { $match: { isActive: true } },
        { $unwind: '$categories' },
        { $group: { _id: '$categories' } },
        { $count: 'total' },
      ])
      .exec();

    const totalCategories = categoriesAgg[0]?.total || 0;

    this.logger.log(`✅ Estadísticas obtenidas: ${total} imágenes totales`);

    return {
      total,
      byQuality,
      byOutlet: byOutlet.slice(0, 10),
      totalKeywords,
      totalCategories,
    };
  }
}
