import { useQuery } from '@tanstack/react-query';
import { socialMediaApi } from '@/src/services/social-media/socialMediaApi';
import type {
  FacebookPagesResponse,
  TwitterAccountsResponse,
} from '@/src/services/social-media/socialMediaApi';

/**
 * 📱 FASE 13: Hooks para obtener cuentas de redes sociales desde GetLate.dev
 */

/**
 * Hook para obtener páginas de Facebook desde GetLate
 */
export function useGetLateFacebookPages() {
  return useQuery<FacebookPagesResponse, Error>({
    queryKey: ['getlate', 'facebook', 'pages'],
    queryFn: socialMediaApi.getFacebookPages,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (antes cacheTime)
  });
}

/**
 * Hook para obtener cuentas de Twitter desde GetLate
 */
export function useGetLateTwitterAccounts() {
  return useQuery<TwitterAccountsResponse, Error>({
    queryKey: ['getlate', 'twitter', 'accounts'],
    queryFn: socialMediaApi.getTwitterAccounts,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}
