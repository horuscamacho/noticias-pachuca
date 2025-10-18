import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import axios from 'axios';

import { TwitterAccountDto, TwitterAccountsResponseDto } from '../dto/twitter-account.dto';

/**
 * 🐦 Servicio para integración con GetLate.dev API - Twitter
 * Obtiene cuentas de Twitter disponibles usando la API key del usuario
 */
@Injectable()
export class TwitterAccountsService {
  private readonly logger = new Logger(TwitterAccountsService.name);
  private readonly getLateBaseUrl = 'https://getlate.dev/api/v1';
  private readonly apiKey = 'sk_a7e92958841ee94d4d95b99f88b1f7b0fb7672a60b0fca50f27b190476d98cd8';

  constructor(private readonly eventEmitter: EventEmitter2) {
    this.logger.log('🐦 Twitter Accounts Service initialized');
  }

  /**
   * 🐦 OBTENER CUENTAS DE TWITTER DESDE GETLATE.DEV
   */
  async getTwitterAccounts(): Promise<TwitterAccountsResponseDto> {
    this.logger.log('🐦 Fetching Twitter accounts from GetLate.dev');

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
        return { accounts: [], total: 0 };
      }

      // Obtenemos las cuentas de Twitter conectadas para este perfil
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

      this.logger.log(`🐦 Retrieved ${accountsResponse.data?.accounts?.length || 0} accounts`);

      // Filtrar solo cuentas de Twitter activas
      const twitterAccounts = (accountsResponse.data?.accounts || []).filter((account: any) =>
        account.platform === 'twitter' && account.isActive
      );

      // Mapear cuentas de Twitter al formato DTO
      const accounts: TwitterAccountDto[] = twitterAccounts.map((account: any) => ({
        id: account._id || account.accountId,
        username: account.username?.replace('@', '') || 'unknown', // Remover @ si existe
        displayName: account.displayName || account.name || account.username || 'Unknown',
        profilePicture: account.profilePicture || '',
        followerCount: account.metadata?.followerCount || 0,
        isVerified: account.metadata?.verified || false,
        accessToken: account.accessToken,
      }));

      const result: TwitterAccountsResponseDto = {
        accounts,
        total: accounts.length,
      };

      // Emitir evento de éxito
      this.eventEmitter.emit('generator-pro.twitter.accounts_fetched', {
        total: accounts.length,
        timestamp: new Date(),
      });

      return result;

    } catch (error) {
      this.logger.error(`❌ Failed to fetch Twitter accounts: ${error.message}`);

      // Emitir evento de error
      this.eventEmitter.emit('generator-pro.twitter.accounts_fetch_failed', {
        error: error.message,
        timestamp: new Date(),
      });

      // Retornar resultado vacío en caso de error para no romper el flujo
      return {
        accounts: [],
        total: 0,
      };
    }
  }

  /**
   * 🐦 VALIDAR CONEXIÓN CON CUENTA ESPECÍFICA
   */
  async validateAccountConnection(accountId: string): Promise<{ isValid: boolean; accountName?: string; error?: string }> {
    this.logger.log(`🐦 Validating connection to Twitter account: ${accountId}`);

    try {
      // Obtenemos todas las cuentas y verificamos si existe la específica
      const allAccounts = await this.getTwitterAccounts();
      const account = allAccounts.accounts.find(a => a.id === accountId);

      if (account) {
        return {
          isValid: true,
          accountName: account.displayName,
        };
      } else {
        return {
          isValid: false,
          error: 'Account not found in connected Twitter accounts',
        };
      }

    } catch (error) {
      this.logger.warn(`⚠️ Account validation failed for ${accountId}: ${error.message}`);

      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  /**
   * 🐦 OBTENER INFORMACIÓN DETALLADA DE UNA CUENTA
   */
  async getAccountDetails(accountId: string): Promise<TwitterAccountDto | null> {
    this.logger.log(`🐦 Getting details for Twitter account: ${accountId}`);

    try {
      // Obtenemos todas las cuentas y buscamos la específica
      const allAccounts = await this.getTwitterAccounts();
      const account = allAccounts.accounts.find(a => a.id === accountId);

      return account || null;

    } catch (error) {
      this.logger.error(`❌ Failed to get account details for ${accountId}: ${error.message}`);
      return null;
    }
  }
}
