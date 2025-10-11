/**
 * useImageGenerations Hook
 *
 * Query hook for fetching paginated list of image generations
 * Supports filtering by model, quality, sorting
 */

import { useQuery } from '@tanstack/react-query';
import { imageGenerationApi } from '@/src/services/api/imageGenerationApi';
import { imageGenerationKeys } from './queryKeys/imageGeneration';
import type { App } from '@/src/types/image-generation.types';

/**
 * Hook to list image generations with pagination and filters
 *
 * @param filters - Optional filters (page, limit, model, quality, sort)
 * @returns Query result with paginated generations
 *
 * @example
 * const { data, isLoading, refetch } = useImageGenerations({
 *   page: 1,
 *   limit: 20,
 *   quality: 'high',
 *   sortBy: 'createdAt',
 *   sortOrder: 'desc'
 * });
 */
export function useImageGenerations(filters?: App.ImageGenerationFilters) {
  return useQuery({
    queryKey: imageGenerationKeys.list(filters),
    queryFn: () => imageGenerationApi.getGenerations(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
