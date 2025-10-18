import { Controller, Get, Logger, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { FacebookPagesService } from '../services/facebook-pages.service';
import { TwitterAccountsService } from '../services/twitter-accounts.service';
import { FacebookPagesResponseDto } from '../dto/facebook-page.dto';
import { TwitterAccountsResponseDto } from '../dto/twitter-account.dto';

/**
 * 📱 Controller para obtener cuentas de redes sociales desde GetLate.dev API
 * Expone endpoints para listar Facebook Pages y Twitter Accounts disponibles
 */
@ApiTags('Social Media Accounts')
@Controller('generator-pro/social-media')
export class SocialMediaAccountsController {
  private readonly logger = new Logger(SocialMediaAccountsController.name);

  constructor(
    private readonly facebookPagesService: FacebookPagesService,
    private readonly twitterAccountsService: TwitterAccountsService,
  ) {
    this.logger.log('📱 Social Media Accounts Controller initialized');
  }

  /**
   * 📘 OBTENER PÁGINAS DE FACEBOOK DESDE GETLATE
   * GET /generator-pro/social-media/facebook/pages
   */
  @Get('facebook/pages')
  @ApiOperation({
    summary: 'Obtener páginas de Facebook desde GetLate.dev',
    description: 'Lista todas las páginas de Facebook conectadas en GetLate.dev disponibles para configurar publicación automática'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de páginas de Facebook obtenida exitosamente',
    type: FacebookPagesResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Error al obtener páginas de Facebook desde GetLate',
  })
  async getFacebookPages(): Promise<FacebookPagesResponseDto> {
    this.logger.log('📘 GET /generator-pro/social-media/facebook/pages - Fetching Facebook pages from GetLate');

    try {
      const result = await this.facebookPagesService.getFacebookPages();

      this.logger.log(`✅ Found ${result.total} Facebook pages`);

      return result;

    } catch (error) {
      this.logger.error(`❌ Failed to fetch Facebook pages: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🐦 OBTENER CUENTAS DE TWITTER DESDE GETLATE
   * GET /generator-pro/social-media/twitter/accounts
   */
  @Get('twitter/accounts')
  @ApiOperation({
    summary: 'Obtener cuentas de Twitter desde GetLate.dev',
    description: 'Lista todas las cuentas de Twitter conectadas en GetLate.dev disponibles para configurar publicación automática'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de cuentas de Twitter obtenida exitosamente',
    type: TwitterAccountsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Error al obtener cuentas de Twitter desde GetLate',
  })
  async getTwitterAccounts(): Promise<TwitterAccountsResponseDto> {
    this.logger.log('🐦 GET /generator-pro/social-media/twitter/accounts - Fetching Twitter accounts from GetLate');

    try {
      const result = await this.twitterAccountsService.getTwitterAccounts();

      this.logger.log(`✅ Found ${result.total} Twitter accounts`);

      return result;

    } catch (error) {
      this.logger.error(`❌ Failed to fetch Twitter accounts: ${error.message}`);
      throw error;
    }
  }
}
