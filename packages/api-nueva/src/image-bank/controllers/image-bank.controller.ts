import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UsePipes,
  ValidationPipe,
  BadRequestException,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ImageBankService } from '../services/image-bank.service';
import { ImageBankUploadService } from '../services/image-bank-upload.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { ImageBankDocument } from '../schemas/image-bank.schema';
import {
  CreateImageBankDto,
  UpdateImageBankDto,
  ImageBankFiltersDto,
  ProcessImageDto,
} from '../dto/image-bank.dto';
import {
  UploadImageMetadataDto,
  UploadImageResponseDto,
} from '../dto/upload-image.dto';
import { TransformJsonArraysInterceptor } from '../interceptors/transform-json-arrays.interceptor';

/**
 * 🖼️ Image Bank Controller
 *
 * Endpoints API para el banco de imágenes procesadas.
 *
 * Endpoints principales:
 * - GET /image-bank - Lista de imágenes con filtros y paginación
 * - GET /image-bank/:id - Detalle de una imagen
 * - POST /image-bank - Crear manualmente una imagen en el banco
 * - POST /image-bank/process - Procesar y almacenar una imagen desde URL
 * - PATCH /image-bank/:id - Actualizar metadata de imagen
 * - DELETE /image-bank/:id - Eliminar imagen del banco (soft delete)
 * - GET /image-bank/keywords - Obtener keywords disponibles
 * - GET /image-bank/outlets - Obtener outlets disponibles
 * - GET /image-bank/categories - Obtener categorías disponibles
 */
@ApiTags('Image Bank')
@ApiBearerAuth()
@Controller('image-bank')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class ImageBankController {
  constructor(
    private readonly imageBankService: ImageBankService,
    private readonly uploadService: ImageBankUploadService,
  ) {}

  // ============================================================================
  // 📋 CRUD PRINCIPAL
  // ============================================================================

  /**
   * GET /image-bank
   * Lista paginada de imágenes con filtros
   */
  @Get()
  @ApiOperation({
    summary: 'Listar imágenes del banco',
    description:
      'Obtiene lista paginada de imágenes con soporte de filtros múltiples',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Página (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Límite por página (default: 10, max: 100)',
  })
  @ApiQuery({
    name: 'keywords',
    required: false,
    type: String,
    description: 'Keywords separadas por coma',
  })
  @ApiQuery({
    name: 'outlet',
    required: false,
    type: String,
    description: 'Filtrar por outlet (dominio)',
  })
  @ApiQuery({
    name: 'categories',
    required: false,
    type: String,
    description: 'Categorías separadas por coma',
  })
  @ApiQuery({
    name: 'quality',
    required: false,
    enum: ['high', 'medium', 'low'],
    description: 'Filtrar por calidad de imagen',
  })
  @ApiQuery({
    name: 'searchText',
    required: false,
    type: String,
    description: 'Búsqueda de texto en altText, caption, keywords',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'quality', 'outlet'],
    description: 'Campo para ordenar',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Orden ascendente o descendente',
  })
  @ApiQuery({
    name: 'author',
    required: false,
    type: String,
    description: 'Filtrar por autor/fuente',
  })
  @ApiQuery({
    name: 'captureType',
    required: false,
    enum: ['wikipedia', 'unsplash', 'pexels', 'video_screenshot', 'social_screenshot', 'staff_photo', 'news_agency', 'other'],
    description: 'Filtrar por tipo de captura',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de imágenes con paginación',
  })
  async getImageBankList(
    @Query() filters: ImageBankFiltersDto,
  ): Promise<PaginatedResponse<ImageBankDocument>> {
    return await this.imageBankService.findWithFilters(filters);
  }

  /**
   * GET /image-bank/:id
   * Obtener detalle de una imagen por ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener imagen por ID',
    description: 'Retorna el detalle completo de una imagen del banco',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la imagen (MongoDB ObjectId)',
  })
  @ApiResponse({ status: 200, description: 'Imagen encontrada' })
  @ApiResponse({ status: 404, description: 'Imagen no encontrada' })
  async getImageById(@Param('id') id: string): Promise<ImageBankDocument> {
    const image = await this.imageBankService.findById(id);

    if (!image) {
      throw new BadRequestException(`Image with ID ${id} not found`);
    }

    return image;
  }

  /**
   * POST /image-bank
   * Crear manualmente una imagen en el banco
   */
  @Post()
  @ApiOperation({
    summary: 'Crear imagen manualmente',
    description:
      'Crea una entrada manual en el banco (las URLs procesadas deben existir)',
  })
  @ApiResponse({ status: 201, description: 'Imagen creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async createImage(
    @Body() createDto: CreateImageBankDto,
  ): Promise<ImageBankDocument> {
    return await this.imageBankService.create(createDto);
  }

  /**
   * POST /image-bank/process
   * Procesar y almacenar una imagen desde URL externa
   */
  @Post('process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Procesar imagen desde URL',
    description:
      'Descarga, procesa (metadata removal), sube a S3 y almacena en banco',
  })
  @ApiResponse({
    status: 200,
    description: 'Imagen procesada y almacenada exitosamente',
  })
  @ApiResponse({ status: 400, description: 'URL inválida o procesamiento falló' })
  async processImage(
    @Body() processDto: ProcessImageDto,
  ): Promise<ImageBankDocument> {
    return await this.imageBankService.processAndStore(processDto);
  }

  /**
   * POST /image-bank/upload
   * Upload manual de imágenes desde mobile app
   */
  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FilesInterceptor('files', 10), // Max 10 archivos
    TransformJsonArraysInterceptor, // Transform JSON strings to arrays
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload manual de imágenes',
    description:
      'Sube 1 o más imágenes desde galería del celular con metadata manual. ' +
      'Procesa, remueve EXIF, sube a S3 y almacena en banco.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['files', 'outlet'],
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Archivos de imagen (jpeg, png, webp) - Max 10MB c/u',
        },
        outlet: {
          type: 'string',
          description: 'Outlet/dominio de origen (REQUERIDO)',
          example: 'noticiaspachuca.com',
        },
        author: {
          type: 'string',
          description: 'Autor/fuente de la imagen (OPCIONAL)',
          example: 'Juan Pérez / Wikimedia Commons',
        },
        license: {
          type: 'string',
          description: 'Licencia de la imagen (OPCIONAL)',
          example: 'CC BY-SA 4.0',
        },
        attribution: {
          type: 'string',
          description: 'Texto completo de atribución (OPCIONAL)',
          example: 'Juan Pérez. (2025). Palacio de Gobierno [Digital image]. Wikimedia Commons.',
        },
        captureType: {
          type: 'string',
          enum: ['wikipedia', 'unsplash', 'pexels', 'video_screenshot', 'social_screenshot', 'staff_photo', 'news_agency', 'other'],
          description: 'Tipo de captura/fuente (OPCIONAL)',
        },
        photographerName: {
          type: 'string',
          description: 'Nombre del fotógrafo (OPCIONAL)',
          example: 'Juan Pérez',
        },
        keywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'Keywords para búsqueda (OPCIONAL)',
          example: ['hidalgo', 'política', 'gobierno'],
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags adicionales (OPCIONAL)',
          example: ['elecciones', 'municipio'],
        },
        categories: {
          type: 'array',
          items: { type: 'string' },
          description: 'Categorías (OPCIONAL)',
          example: ['Política', 'Gobierno'],
        },
        altText: {
          type: 'string',
          description: 'Texto alternativo para accesibilidad (OPCIONAL)',
          example: 'Palacio de Gobierno de Hidalgo',
        },
        caption: {
          type: 'string',
          description: 'Caption o descripción (OPCIONAL)',
          example: 'Vista frontal del Palacio de Gobierno del estado de Hidalgo',
        },
        quality: {
          type: 'string',
          enum: ['high', 'medium', 'low'],
          description: 'Calidad de la imagen (OPCIONAL - se evalúa automáticamente si no se provee)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Imágenes subidas exitosamente',
    type: UploadImageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Archivos inválidos o metadata incorrecta',
  })
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() metadata: UploadImageMetadataDto,
  ): Promise<UploadImageResponseDto> {
    // Validar que se hayan subido archivos
    if (!files || files.length === 0) {
      throw new BadRequestException('No se han subido archivos');
    }

    // Convertir archivos de Multer al formato esperado por el servicio
    const uploadedFiles = files.map((file) => ({
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      buffer: file.buffer,
      size: file.size,
    }));

    // Llamar al servicio de upload
    const result = await this.uploadService.uploadMultiple(
      uploadedFiles,
      metadata,
    );

    return result;
  }

  /**
   * PATCH /image-bank/:id
   * Actualizar metadata de una imagen
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar metadata de imagen',
    description: 'Actualiza altText, caption, keywords, categories, etc.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la imagen (MongoDB ObjectId)',
  })
  @ApiResponse({ status: 200, description: 'Imagen actualizada exitosamente' })
  @ApiResponse({ status: 404, description: 'Imagen no encontrada' })
  async updateImage(
    @Param('id') id: string,
    @Body() updateDto: UpdateImageBankDto,
  ): Promise<ImageBankDocument> {
    const updated = await this.imageBankService.update(id, updateDto);

    if (!updated) {
      throw new BadRequestException(`Image with ID ${id} not found`);
    }

    return updated;
  }

  /**
   * DELETE /image-bank/:id
   * Eliminar imagen del banco (soft delete)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar imagen del banco',
    description: 'Soft delete - marca la imagen como inactiva',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la imagen (MongoDB ObjectId)',
  })
  @ApiResponse({ status: 204, description: 'Imagen eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Imagen no encontrada' })
  async deleteImage(@Param('id') id: string): Promise<void> {
    const deleted = await this.imageBankService.softDelete(id);

    if (!deleted) {
      throw new BadRequestException(`Image with ID ${id} not found`);
    }
  }

  // ============================================================================
  // 🔍 FILTROS Y AGREGACIONES
  // ============================================================================

  /**
   * GET /image-bank/aggregations/keywords
   * Obtener keywords disponibles con conteo
   */
  @Get('aggregations/keywords')
  @ApiOperation({
    summary: 'Obtener keywords disponibles',
    description: 'Lista de keywords únicos con conteo de uso',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Buscar keywords que contengan este texto',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de keywords con conteo',
  })
  async getKeywords(
    @Query('search') search?: string,
  ): Promise<Array<{ keyword: string; count: number }>> {
    return await this.imageBankService.getKeywordsAggregation(search);
  }

  /**
   * GET /image-bank/aggregations/outlets
   * Obtener outlets disponibles con conteo
   */
  @Get('aggregations/outlets')
  @ApiOperation({
    summary: 'Obtener outlets disponibles',
    description: 'Lista de outlets (dominios) únicos con conteo de imágenes',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de outlets con conteo',
  })
  async getOutlets(): Promise<Array<{ outlet: string; count: number }>> {
    return await this.imageBankService.getOutletsAggregation();
  }

  /**
   * GET /image-bank/aggregations/categories
   * Obtener categorías disponibles con conteo
   */
  @Get('aggregations/categories')
  @ApiOperation({
    summary: 'Obtener categorías disponibles',
    description: 'Lista de categorías únicas con conteo de imágenes',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de categorías con conteo',
  })
  async getCategories(): Promise<Array<{ category: string; count: number }>> {
    return await this.imageBankService.getCategoriesAggregation();
  }

  /**
   * GET /image-bank/stats
   * Estadísticas generales del banco de imágenes
   */
  @Get('stats/summary')
  @ApiOperation({
    summary: 'Estadísticas del banco de imágenes',
    description: 'Métricas generales: total, por calidad, por outlet, etc.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas generales',
  })
  async getStats(): Promise<{
    total: number;
    byQuality: Record<string, number>;
    byOutlet: Array<{ outlet: string; count: number }>;
    totalKeywords: number;
    totalCategories: number;
  }> {
    return await this.imageBankService.getStats();
  }
}
