import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../shared/services/apiClient';
import type {
  PublishedNoticia,
  PublishedNoticiasResponse,
  QueryNoticiasDto,
} from '../types';

/**
 * 🌐 API Functions para Noticias Publicadas
 */
const publishedNoticiasApi = {
  /**
   * Lista noticias con filtros y paginación
   */
  getAll: async (filters?: QueryNoticiasDto): Promise<PublishedNoticiasResponse> => {
    const params: Record<string, string> = {};

    if (filters?.page) params.page = filters.page.toString();
    if (filters?.limit) params.limit = filters.limit.toString();
    if (filters?.status) params.status = filters.status;
    if (filters?.category) params.category = filters.category;
    if (filters?.isFeatured !== undefined) params.isFeatured = filters.isFeatured.toString();
    if (filters?.isBreaking !== undefined) params.isBreaking = filters.isBreaking.toString();
    if (filters?.search) params.search = filters.search;
    if (filters?.sortBy) params.sortBy = filters.sortBy;
    if (filters?.sortOrder) params.sortOrder = filters.sortOrder;

    return apiClient.get<PublishedNoticiasResponse>('/pachuca-noticias', { params });
  },

  /**
   * Obtiene una noticia por ID
   */
  getById: async (id: string): Promise<PublishedNoticia> => {
    return apiClient.get<PublishedNoticia>(`/pachuca-noticias/${id}`);
  },

  /**
   * Obtiene una noticia por slug
   */
  getBySlug: async (slug: string): Promise<PublishedNoticia> => {
    return apiClient.get<PublishedNoticia>(`/pachuca-noticias/slug/${slug}`);
  },
};

/**
 * 🔑 Query Keys para React Query
 */
export const publishedNoticiasKeys = {
  all: ['publishedNoticias'] as const,
  lists: () => [...publishedNoticiasKeys.all, 'list'] as const,
  list: (filters?: QueryNoticiasDto) => [...publishedNoticiasKeys.lists(), filters] as const,
  details: () => [...publishedNoticiasKeys.all, 'detail'] as const,
  detail: (id: string) => [...publishedNoticiasKeys.details(), id] as const,
  slug: (slug: string) => [...publishedNoticiasKeys.all, 'slug', slug] as const,
};

/**
 * 📋 Hook para listar noticias publicadas con filtros
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = usePublishedNoticias({
 *   page: 1,
 *   limit: 20,
 *   status: 'published',
 *   category: 'política'
 * });
 * ```
 */
export function usePublishedNoticias(filters?: QueryNoticiasDto) {
  return useQuery({
    queryKey: publishedNoticiasKeys.list(filters),
    queryFn: () => publishedNoticiasApi.getAll(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos (antes era cacheTime)
  });
}

/**
 * 📄 Hook para obtener una noticia por ID
 *
 * @example
 * ```tsx
 * const { data: noticia } = usePublishedNoticiaById('507f1f77bcf86cd799439012');
 * ```
 */
export function usePublishedNoticiaById(id: string, enabled = true) {
  return useQuery({
    queryKey: publishedNoticiasKeys.detail(id),
    queryFn: () => publishedNoticiasApi.getById(id),
    enabled: !!id && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * 🔗 Hook para obtener una noticia por slug
 *
 * @example
 * ```tsx
 * const { data: noticia } = usePublishedNoticiaBySlug('migrantes-hidalgo-abc123');
 * ```
 */
export function usePublishedNoticiaBySlug(slug: string, enabled = true) {
  return useQuery({
    queryKey: publishedNoticiasKeys.slug(slug),
    queryFn: () => publishedNoticiasApi.getBySlug(slug),
    enabled: !!slug && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
