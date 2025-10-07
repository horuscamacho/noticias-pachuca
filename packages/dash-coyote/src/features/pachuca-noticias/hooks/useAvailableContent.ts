import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../shared/services/apiClient';

/**
 * 📰 Datos del contenido original extraído (del backend)
 */
export interface OriginalContent {
  id: string;
  title: string;
  content: string;
  sourceUrl?: string;
  publishedAt?: Date;
  images?: string[];
}

/**
 * 📋 Contenido generado disponible para publicar
 * Interface basada en GeneratedContentResponse del backend
 */
export interface AvailableContent {
  id: string;
  originalContent: OriginalContent;

  // Contenido generado
  generatedTitle: string;
  generatedContent: string;
  generatedSummary: string;
  extendedSummary?: string;
  generatedKeywords: string[];
  generatedTags: string[];
  generatedCategory: string;

  // SEO
  seoData?: {
    metaDescription?: string;
    focusKeyword?: string;
    altText?: string;
    ogTitle?: string;
    ogDescription?: string;
  };

  // Social media
  socialMediaCopies?: {
    facebook?: {
      hook: string;
      copy: string;
      emojis: string[];
      hookType: string;
    };
    twitter?: {
      tweet: string;
      hook: string;
      emojis: string[];
      threadIdeas: string[];
    };
  };

  // Estado
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'reviewing' | 'approved' | 'rejected';

  // Info de publicación
  publishingInfo?: {
    publishedAt?: string;
    publishedBy?: string;
    platform?: string;
    url?: string;
    socialShares?: number;
    views?: number;
  };

  // Metadata
  generationMetadata?: {
    provider: string;
    model: string;
    tokensUsed: number;
    cost: number;
    processingTime: number;
  };

  createdAt: string;
  updatedAt: string;
}

/**
 * Filtros para contenidos disponibles
 */
export interface AvailableContentFilters {
  status?: 'pending' | 'generating' | 'completed' | 'failed' | 'reviewing' | 'approved' | 'rejected' | Array<'pending' | 'generating' | 'completed' | 'failed' | 'reviewing' | 'approved' | 'rejected'>;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  onlyUnpublished?: boolean; // Solo contenidos que NO han sido publicados
}

/**
 * Respuesta del endpoint (paginada)
 */
interface AvailableContentResponse {
  data: AvailableContent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * 🌐 API Functions
 */
const availableContentApi = {
  /**
   * Obtiene contenidos generados disponibles para publicar
   */
  getAll: async (filters?: AvailableContentFilters): Promise<AvailableContent[]> => {
    // Crear params como URLSearchParams para manejar arrays correctamente
    const params = new URLSearchParams();

    // NestJS convertirá automáticamente string a array con Transform
    if (filters?.status) {
      const statusValue = Array.isArray(filters.status) ? filters.status[0] : filters.status;
      params.append('status', statusValue);
    } else {
      // Por defecto, solo contenidos completados
      params.append('status', 'completed');
    }

    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);

    // Backend usa page/limit (PaginationDto estándar)
    const page = filters?.page || 1;
    const limit = filters?.limit || 100;
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    // Endpoint de content-ai para obtener contenidos generados (ahora con paginación)
    const response = await apiClient.get<AvailableContentResponse>(
      `/content-ai/generated?${params.toString()}`
    );

    // Extraer array de data de la respuesta paginada
    const contents = response.data;

    // Si solo queremos no publicados, filtrar en cliente
    // (el backend aún no tiene este filtro específico)
    if (filters?.onlyUnpublished) {
      return contents.filter(content => !content.publishingInfo?.publishedAt);
    }

    return contents;
  },

  /**
   * Obtiene un contenido por ID
   */
  getById: async (id: string): Promise<AvailableContent> => {
    return apiClient.get<AvailableContent>(`/content-ai/generated/${id}`);
  },

  /**
   * Obtiene todas las categorías únicas
   */
  getCategories: async (): Promise<string[]> => {
    return apiClient.get<string[]>('/content-ai/generated/categories/all');
  },
};

/**
 * 🔑 Query Keys
 */
export const availableContentKeys = {
  all: ['availableContent'] as const,
  lists: () => [...availableContentKeys.all, 'list'] as const,
  list: (filters?: AvailableContentFilters) => [...availableContentKeys.lists(), filters] as const,
  details: () => [...availableContentKeys.all, 'detail'] as const,
  detail: (id: string) => [...availableContentKeys.details(), id] as const,
  categories: () => [...availableContentKeys.all, 'categories'] as const,
};

/**
 * 📋 Hook para listar contenidos disponibles para publicar
 *
 * @example
 * ```tsx
 * const { data: contents, isLoading } = useAvailableContent({
 *   status: 'completed',
 *   onlyUnpublished: true,
 *   page: 1,
 *   limit: 20
 * });
 * ```
 */
export function useAvailableContent(filters?: AvailableContentFilters) {
  return useQuery({
    queryKey: availableContentKeys.list(filters),
    queryFn: () => availableContentApi.getAll(filters),
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 3 * 60 * 1000, // 3 minutos
  });
}

/**
 * 📄 Hook para obtener un contenido disponible por ID
 *
 * @example
 * ```tsx
 * const { data: content } = useAvailableContentById('507f1f77bcf86cd799439011');
 * ```
 */
export function useAvailableContentById(id: string, enabled = true) {
  return useQuery({
    queryKey: availableContentKeys.detail(id),
    queryFn: () => availableContentApi.getById(id),
    enabled: !!id && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 🏷️ Hook para obtener todas las categorías únicas
 *
 * @example
 * ```tsx
 * const { data: categories } = useAvailableContentCategories();
 * ```
 */
export function useAvailableContentCategories() {
  return useQuery({
    queryKey: availableContentKeys.categories(),
    queryFn: () => availableContentApi.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutos (categorías no cambian tan frecuentemente)
    gcTime: 30 * 60 * 1000, // 30 minutos
  });
}
