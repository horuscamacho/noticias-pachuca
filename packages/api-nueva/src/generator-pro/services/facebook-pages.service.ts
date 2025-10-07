import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import axios from 'axios';

import { FacebookPageDto, FacebookPagesResponseDto } from '../dto/facebook-page.dto';

/**
 * 📘 Servicio para integración con GetLate.dev API
 * Obtiene páginas de Facebook disponibles usando la API key del usuario
 */
@Injectable()
export class FacebookPagesService {
  private readonly logger = new Logger(FacebookPagesService.name);
  private readonly getLateBaseUrl = 'https://getlate.dev/api/v1';
  private readonly apiKey = 'sk_a7e92958841ee94d4d95b99f88b1f7b0fb7672a60b0fca50f27b190476d98cd8';

  constructor(private readonly eventEmitter: EventEmitter2) {
    this.logger.log('📘 Facebook Pages Service initialized');
  }

  /**
   * 📘 OBTENER PÁGINAS DE FACEBOOK DESDE GETLATE.DEV
   */
  async getFacebookPages(): Promise<FacebookPagesResponseDto> {
    this.logger.log('📘 Fetching Facebook pages from GetLate.dev');

    try {
      // Primero obtenemos los perfiles para encontrar el perfil por defecto
      const profilesResponse = await axios.get(`${this.getLateBaseUrl}/profiles`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      const defaultProfile = (profilesResponse.data?.profiles || []).find((p: any) => p.isDefault);
      if (!defaultProfile) {
        this.logger.warn('⚠️ No default profile found');
        return { pages: [], total: 0 };
      }

      // Obtenemos las cuentas de Facebook conectadas para este perfil
      const accountsResponse = await axios.get(`${this.getLateBaseUrl}/accounts`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        params: {
          profileId: defaultProfile._id
        },
        timeout: 10000,
      });

      this.logger.log(`📘 Retrieved ${accountsResponse.data?.accounts?.length || 0} accounts`);

      // Filtrar solo cuentas de Facebook activas
      const facebookAccounts = (accountsResponse.data?.accounts || []).filter((account: any) =>
        account.platform === 'facebook' && account.isActive
      );

      // Extraer todas las páginas disponibles de todas las cuentas
      const pages: FacebookPageDto[] = [];

      for (const account of facebookAccounts) {
        const availablePages = account.metadata?.availablePages || [];

        for (const page of availablePages) {
          pages.push({
            id: page.id,
            name: page.name,
            username: page.username || `@${page.name?.toLowerCase().replace(/\s+/g, '').replace(/[0-9]/g, '')}`,
            picture: account.profilePicture || '', // Foto del perfil de la cuenta
            followerCount: 0, // GetLate no proporciona follower count en este endpoint
            isVerified: false, // GetLate no proporciona verification status
            accessToken: account.accessToken, // Token de acceso de la cuenta
          });
        }
      }

      const result: FacebookPagesResponseDto = {
        pages,
        total: pages.length,
      };

      // Emitir evento de éxito
      this.eventEmitter.emit('generator-pro.facebook.pages_fetched', {
        total: pages.length,
        timestamp: new Date(),
      });

      return result;

    } catch (error) {
      this.logger.error(`❌ Failed to fetch Facebook pages: ${error.message}`);

      // Emitir evento de error
      this.eventEmitter.emit('generator-pro.facebook.pages_fetch_failed', {
        error: error.message,
        timestamp: new Date(),
      });

      // Retornar resultado vacío en caso de error para no romper el flujo
      return {
        pages: [],
        total: 0,
      };
    }
  }

  /**
   * 📘 VALIDAR CONEXIÓN CON PÁGINA ESPECÍFICA
   */
  async validatePageConnection(pageId: string): Promise<{ isValid: boolean; pageName?: string; error?: string }> {
    this.logger.log(`📘 Validating connection to Facebook page: ${pageId}`);

    try {
      // Obtenemos todas las páginas y verificamos si existe la específica
      const allPages = await this.getFacebookPages();
      const page = allPages.pages.find(p => p.id === pageId);

      if (page) {
        return {
          isValid: true,
          pageName: page.name,
        };
      } else {
        return {
          isValid: false,
          error: 'Page not found in connected Facebook pages',
        };
      }

    } catch (error) {
      this.logger.warn(`⚠️ Page validation failed for ${pageId}: ${error.message}`);

      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  /**
   * 📘 OBTENER INFORMACIÓN DETALLADA DE UNA PÁGINA
   */
  async getPageDetails(pageId: string): Promise<FacebookPageDto | null> {
    this.logger.log(`📘 Getting details for Facebook page: ${pageId}`);

    try {
      // Obtenemos todas las páginas y buscamos la específica
      const allPages = await this.getFacebookPages();
      const page = allPages.pages.find(p => p.id === pageId);

      return page || null;

    } catch (error) {
      this.logger.error(`❌ Failed to get page details for ${pageId}: ${error.message}`);
      return null;
    }
  }
}