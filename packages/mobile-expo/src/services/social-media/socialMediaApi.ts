import { ApiClient } from '@/src/services/api/ApiClient';

/**
 * 📱 FASE 13: Servicio de API para obtener cuentas de redes sociales desde GetLate.dev
 */

export interface GetLateFacebookPage {
  id: string;
  name: string;
  username?: string;
  picture?: string;
  followerCount?: number;
  isVerified?: boolean;
}

export interface GetLateTwitterAccount {
  id: string;
  username: string;
  displayName: string;
  profilePicture?: string;
  followerCount?: number;
  isVerified?: boolean;
}

export interface FacebookPagesResponse {
  pages: GetLateFacebookPage[];
  total: number;
}

export interface TwitterAccountsResponse {
  accounts: GetLateTwitterAccount[];
  total: number;
}

export const socialMediaApi = {
  /**
   * Obtener páginas de Facebook desde GetLate.dev
   * GET /generator-pro/social-media/facebook/pages
   */
  getFacebookPages: async (): Promise<FacebookPagesResponse> => {
    try {
      const rawClient = ApiClient.getRawClient();

      const response = await rawClient.get<FacebookPagesResponse>(
        '/generator-pro/social-media/facebook/pages'
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching Facebook pages from GetLate:', error);
      throw error;
    }
  },

  /**
   * Obtener cuentas de Twitter desde GetLate.dev
   * GET /generator-pro/social-media/twitter/accounts
   */
  getTwitterAccounts: async (): Promise<TwitterAccountsResponse> => {
    try {
      const rawClient = ApiClient.getRawClient();

      const response = await rawClient.get<TwitterAccountsResponse>(
        '/generator-pro/social-media/twitter/accounts'
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching Twitter accounts from GetLate:', error);
      throw error;
    }
  },
};
