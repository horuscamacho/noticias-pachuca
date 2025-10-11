import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ImageGenerationService } from '../services/image-generation.service';
import { ImageGenerationQueueService } from '../services/image-generation-queue.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  GenerateNewsImageDto,
  EditImageDto,
  ImageGenerationQueryDto,
  StoreInBankDto,
} from '../dto/image-generation.dto';
import { MetadataUpdateEvent } from '../../image-bank/services/image-bank-events.service';

/**
 * 🖼️ Controller para generación de imágenes con IA
 * Gestiona el ciclo completo de creación y gestión de imágenes generadas
 */
@ApiTags('Image Generation')
@Controller('image-generation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ImageGenerationController {
  private readonly logger = new Logger(ImageGenerationController.name);

  constructor(
    private imageGenerationService: ImageGenerationService,
    private imageGenerationQueueService: ImageGenerationQueueService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Genera una nueva imagen con IA
   */
  @Post('generate')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Generate new image with AI' })
  @ApiResponse({ status: 202, description: 'Image generation queued successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT required' })
  async generateImage(@Body() dto: GenerateNewsImageDto, @Request() req: { user: { userId: string } }) {
    const userId = req.user.userId;

    this.logger.log(`Generating image for user: ${userId}`);

    const result = await this.imageGenerationService.generateNewsImage(dto, userId);

    return {
      message: 'Image generation queued successfully',
      generation: result.generation,
      jobId: result.jobId,
      estimatedTime: '15-30 seconds',
    };
  }

  /**
   * Edita una imagen existente con IA
   */
  @Post('edit')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Edit existing image with AI' })
  @ApiResponse({ status: 202, description: 'Image edit queued successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input parameters' })
  @ApiResponse({ status: 404, description: 'Source image not found' })
  @ApiResponse({ status: 501, description: 'Feature not implemented yet' })
  async editImage(@Body() dto: EditImageDto, @Request() req: { user: { userId: string } }) {
    // TODO: Implement edit functionality in FASE 5
    // For now, return not implemented
    throw new BadRequestException('Image editing will be implemented in FASE 5');
  }

  /**
   * Obtiene una generación específica por ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get image generation by ID' })
  @ApiResponse({ status: 200, description: 'Generation found successfully' })
  @ApiResponse({ status: 404, description: 'Generation not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT required' })
  async getGeneration(@Param('id') id: string, @Request() req: { user: { userId: string } }) {
    const generation = await this.imageGenerationService.findById(id);

    // Verify user owns this generation
    if (generation.createdBy.toString() !== req.user.userId) {
      throw new NotFoundException('Generation not found');
    }

    return generation;
  }

  /**
   * Lista las generaciones del usuario con filtros y paginación
   */
  @Get()
  @ApiOperation({ summary: 'List user\'s image generations' })
  @ApiResponse({ status: 200, description: 'List of generations retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT required' })
  async listGenerations(
    @Query() query: ImageGenerationQueryDto,
    @Request() req: { user: { userId: string } },
  ) {
    const userId = req.user.userId;

    this.logger.log(`Listing generations for user: ${userId}, page: ${query.page}, limit: ${query.limit}`);

    const result = await this.imageGenerationService.findByUser(userId, {
      model: query.model,
      quality: query.quality,
      page: query.page,
      limit: query.limit,
    });

    return result;
  }

  /**
   * Obtiene el estado de un job de generación en la cola
   */
  @Get('job/:jobId/status')
  @ApiOperation({ summary: 'Get job status in queue' })
  @ApiResponse({ status: 200, description: 'Job status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Job not found in queue' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT required' })
  async getJobStatus(@Param('jobId') jobId: string) {
    const status = await this.imageGenerationQueueService.getJobStatus(jobId);

    if (!status) {
      throw new NotFoundException(`Job not found: ${jobId}`);
    }

    return status;
  }

  /**
   * Actualiza metadata de una imagen ya almacenada en el banco
   * NOTA: La imagen se almacena automáticamente al generarse.
   * Este endpoint solo actualiza metadata adicional.
   */
  @Post(':id/store-in-bank')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update metadata of generated image in bank' })
  @ApiResponse({ status: 200, description: 'Metadata update queued successfully' })
  @ApiResponse({ status: 404, description: 'Generation not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT required' })
  async storeInBank(
    @Param('id') id: string,
    @Body() dto: StoreInBankDto,
    @Request() req: { user: { userId: string } },
  ) {
    const generation = await this.imageGenerationService.findById(id);

    // Verify user owns this generation
    if (generation.createdBy.toString() !== req.user.userId) {
      throw new NotFoundException('Generation not found');
    }

    // Emit event to update ImageBank metadata
    const event: MetadataUpdateEvent = {
      imageGenerationId: id,
      keywords: dto.keywords,
      categories: dto.categories,
      altText: dto.altText,
      caption: dto.caption,
    };

    this.eventEmitter.emit('image-bank.update-metadata', event);

    this.logger.log(`Metadata update queued for generation: ${id}`);

    return {
      message: 'Metadata update queued successfully',
      generationId: id,
      updated: {
        keywords: dto.keywords !== undefined,
        categories: dto.categories !== undefined,
        altText: dto.altText !== undefined,
        caption: dto.caption !== undefined,
      },
    };
  }

  /**
   * Obtiene estadísticas de uso del usuario
   */
  @Get('stats/summary')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT required' })
  async getStats(@Request() req: { user: { userId: string } }) {
    const userId = req.user.userId;

    this.logger.log(`Getting stats for user: ${userId}`);

    const stats = await this.imageGenerationService.getUserStats(userId);

    return stats;
  }

  /**
   * Elimina una generación de imagen
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete image generation' })
  @ApiResponse({ status: 204, description: 'Generation deleted successfully' })
  @ApiResponse({ status: 404, description: 'Generation not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT required' })
  async deleteGeneration(@Param('id') id: string, @Request() req: { user: { userId: string } }) {
    const generation = await this.imageGenerationService.findById(id);

    // Verify user owns this generation
    if (generation.createdBy.toString() !== req.user.userId) {
      throw new NotFoundException('Generation not found');
    }

    await this.imageGenerationService.delete(id);

    this.logger.log(`Generation deleted: ${id} by user: ${req.user.userId}`);
  }

  /**
   * Obtiene estadísticas de la cola de procesamiento
   */
  @Get('queue/stats')
  @ApiOperation({ summary: 'Get queue statistics' })
  @ApiResponse({ status: 200, description: 'Queue stats retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT required' })
  async getQueueStats() {
    const stats = await this.imageGenerationQueueService.getQueueStats();

    this.logger.log(`Queue stats: ${JSON.stringify(stats)}`);

    return stats;
  }
}
