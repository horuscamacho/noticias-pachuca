import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  UseGuards,
  Logger
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery
} from '@nestjs/swagger';

import { FacebookPageManagementService } from '../services/facebook-page-management.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { MonitoredFacebookPageDocument } from '../schemas/monitored-facebook-page.schema';

import {
  CreateFacebookPageDto,
  UpdateFacebookPageDto,
  FacebookPageListDto,
  CreateFacebookPageFromUrlDto
} from '../dto/facebook-page-management.dto';

@ApiTags('Facebook Pages Management')
@Controller('content-extraction-facebook/pages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class FacebookPagesController {
  private readonly logger = new Logger(FacebookPagesController.name);

  constructor(
    private readonly pageManagementService: FacebookPageManagementService
  ) {}

  /**
   * 📋 OBTENER LISTA PAGINADA DE PÁGINAS MONITOREADAS
   */
  @Get()
  @ApiOperation({
    summary: 'Get paginated list of monitored Facebook pages',
    description: 'Retrieve all monitored Facebook pages with filtering, sorting and pagination'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of monitored pages retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pageId: { type: 'string', example: '123456789' },
              pageName: { type: 'string', example: 'Pachuca Noticias' },
              category: { type: 'string', example: 'Media/News Company' },
              isActive: { type: 'boolean', example: true },
              lastExtraction: { type: 'string', format: 'date-time' },
              totalExtractions: { type: 'number', example: 42 },
              extractionConfig: {
                type: 'object',
                properties: {
                  maxPosts: { type: 'number', example: 50 },
                  frequency: { type: 'string', example: 'daily' },
                  fields: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 25 },
            totalPages: { type: 'number', example: 3 },
            hasNext: { type: 'boolean', example: true },
            hasPrev: { type: 'boolean', example: false }
          }
        }
      }
    }
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filter by category' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by page name' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['pageName', 'category', 'lastExtraction', 'totalExtractions', 'createdAt'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async getPages(@Query() query: FacebookPageListDto): Promise<PaginatedResponse<MonitoredFacebookPageDocument>> {
    this.logger.log(`Getting pages list: ${JSON.stringify(query)}`);
    return await this.pageManagementService.getPages(query);
  }

  /**
   * 📄 OBTENER PÁGINA POR ID
   */
  @Get(':pageId')
  @ApiOperation({
    summary: 'Get monitored Facebook page by ID',
    description: 'Retrieve detailed information about a specific monitored Facebook page'
  })
  @ApiParam({
    name: 'pageId',
    description: 'Facebook Page ID',
    example: '123456789'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Page details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        pageId: { type: 'string', example: '123456789' },
        pageName: { type: 'string', example: 'Pachuca Noticias' },
        category: { type: 'string', example: 'Media/News Company' },
        isActive: { type: 'boolean', example: true },
        lastExtraction: { type: 'string', format: 'date-time' },
        totalExtractions: { type: 'number', example: 42 },
        extractionConfig: {
          type: 'object',
          properties: {
            maxPosts: { type: 'number', example: 50 },
            frequency: { type: 'string', example: 'daily' },
            fields: { type: 'array', items: { type: 'string' } }
          }
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Page not found'
  })
  async getPageById(@Param('pageId') pageId: string): Promise<MonitoredFacebookPageDocument> {
    this.logger.log(`Getting page by ID: ${pageId}`);
    return await this.pageManagementService.getPageById(pageId);
  }

  /**
   * ➕ CREAR NUEVA PÁGINA MONITOREADA
   */
  @Post()
  @ApiOperation({
    summary: 'Add new Facebook page to monitor',
    description: 'Add a new Facebook page to the monitoring system. The page must be public and accessible.'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Page added to monitoring successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Page added to monitoring successfully' },
        pageId: { type: 'string', example: '123456789' },
        pageName: { type: 'string', example: 'Pachuca Noticias' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid page ID or page is not accessible'
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Page is already being monitored'
  })
  async createPage(@Body() createPageDto: CreateFacebookPageDto): Promise<{
    message: string;
    pageId: string;
    pageName: string;
  }> {
    this.logger.log(`Creating new monitored page: ${createPageDto.pageId}`);

    const createdPage = await this.pageManagementService.createPage(createPageDto);

    return {
      message: 'Page added to monitoring successfully',
      pageId: createdPage.pageId,
      pageName: createdPage.pageName
    };
  }

  /**
   * 🔗 CREAR PÁGINA DESDE URL
   */
  @Post('from-url')
  @ApiOperation({
    summary: 'Add Facebook page from URL',
    description: 'Add a new Facebook page to monitoring using page URL instead of page ID. Automatically extracts page information.'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Page added from URL successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Page added from URL successfully' },
        pageId: { type: 'string', example: '123456789' },
        pageName: { type: 'string', example: 'Pachuca Noticias' },
        category: { type: 'string', example: 'Media/News Company' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid Facebook URL or page not accessible'
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Page is already being monitored'
  })
  async createPageFromUrl(@Body() createFromUrlDto: CreateFacebookPageFromUrlDto): Promise<{
    message: string;
    pageId: string;
    pageName: string;
    category: string;
  }> {
    this.logger.log(`Creating page from URL: ${createFromUrlDto.pageUrl}`);

    const createdPage = await this.pageManagementService.createPageFromUrl(createFromUrlDto);

    return {
      message: 'Page added from URL successfully',
      pageId: createdPage.pageId,
      pageName: createdPage.pageName,
      category: createdPage.category
    };
  }

  /**
   * ✏️ ACTUALIZAR PÁGINA MONITOREADA
   */
  @Put(':pageId')
  @ApiOperation({
    summary: 'Update monitored Facebook page',
    description: 'Update configuration and settings for a monitored Facebook page'
  })
  @ApiParam({
    name: 'pageId',
    description: 'Facebook Page ID',
    example: '123456789'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Page updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Page updated successfully' },
        pageId: { type: 'string', example: '123456789' },
        changes: { type: 'object', description: 'Applied changes' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Page not found'
  })
  async updatePage(
    @Param('pageId') pageId: string,
    @Body() updatePageDto: UpdateFacebookPageDto
  ): Promise<{
    message: string;
    pageId: string;
    changes: UpdateFacebookPageDto;
  }> {
    this.logger.log(`Updating page: ${pageId} with data: ${JSON.stringify(updatePageDto)}`);

    await this.pageManagementService.updatePage(pageId, updatePageDto);

    return {
      message: 'Page updated successfully',
      pageId,
      changes: updatePageDto
    };
  }

  /**
   * 🗑️ ELIMINAR PÁGINA MONITOREADA
   */
  @Delete(':pageId')
  @ApiOperation({
    summary: 'Remove Facebook page from monitoring',
    description: 'Remove a Facebook page from the monitoring system. This will also delete all associated data.'
  })
  @ApiParam({
    name: 'pageId',
    description: 'Facebook Page ID',
    example: '123456789'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Page removed from monitoring successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Page removed from monitoring successfully' },
        pageId: { type: 'string', example: '123456789' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Page not found'
  })
  async deletePage(@Param('pageId') pageId: string): Promise<{
    message: string;
    pageId: string;
  }> {
    this.logger.log(`Deleting page: ${pageId}`);

    await this.pageManagementService.deletePage(pageId);

    return {
      message: 'Page removed from monitoring successfully',
      pageId
    };
  }

  /**
   * 📊 OBTENER ESTADÍSTICAS GENERALES
   */
  @Get('stats/general')
  @ApiOperation({
    summary: 'Get general monitoring statistics',
    description: 'Get overview statistics about monitored pages and extractions'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalPages: { type: 'number', example: 25 },
        activePages: { type: 'number', example: 20 },
        inactivePages: { type: 'number', example: 5 },
        totalExtractions: { type: 'number', example: 1250 },
        pagesNeedingExtraction: { type: 'number', example: 3 }
      }
    }
  })
  async getGeneralStats(): Promise<{
    totalPages: number;
    activePages: number;
    inactivePages: number;
    totalExtractions: number;
    pagesNeedingExtraction: number;
  }> {
    this.logger.log('Getting general statistics');
    return await this.pageManagementService.getGeneralStats();
  }

  /**
   * 🔄 OBTENER PÁGINAS QUE NECESITAN EXTRACCIÓN
   */
  @Get('pending/extraction')
  @ApiOperation({
    summary: 'Get pages that need extraction',
    description: 'Get list of active pages that are due for extraction based on their frequency settings'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pages needing extraction retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        pages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pageId: { type: 'string', example: '123456789' },
              pageName: { type: 'string', example: 'Pachuca Noticias' },
              lastExtraction: { type: 'string', format: 'date-time' },
              frequency: { type: 'string', example: 'daily' },
              hoursOverdue: { type: 'number', example: 2.5 }
            }
          }
        },
        totalCount: { type: 'number', example: 3 }
      }
    }
  })
  async getPagesNeedingExtraction(): Promise<{
    pages: Array<{
      pageId: string;
      pageName: string;
      lastExtraction: Date;
      frequency: string;
      hoursOverdue: number;
    }>;
    totalCount: number;
  }> {
    this.logger.log('Getting pages needing extraction');

    const pages = await this.pageManagementService.getPagesNeedingExtraction();

    const now = new Date();
    const pagesWithOverdue = pages.map(page => {
      const hoursOverdue = page.lastExtraction
        ? (now.getTime() - page.lastExtraction.getTime()) / (1000 * 60 * 60)
        : 0;

      return {
        pageId: page.pageId,
        pageName: page.pageName,
        lastExtraction: page.lastExtraction || new Date(0),
        frequency: page.extractionConfig?.frequency || 'manual',
        hoursOverdue: Math.round(hoursOverdue * 10) / 10
      };
    });

    return {
      pages: pagesWithOverdue,
      totalCount: pages.length
    };
  }
}