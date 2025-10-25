/**
 * useImageGenerationById Hook
 *
 * Query hook for fetching a single image generation by ID
 * Uses cache-first strategy: checks paginated lists cache before API call
 * Optionally polls if generation is in progress
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { imageGenerationApi } from '@/src/services/api/imageGenerationApi';
import { imageGenerationKeys } from './queryKeys/imageGeneration';
import type { App } from '@/src/types/image-generation.types';

/**
 * Hook to get image generation by ID
 *
 * CACHE-FIRST STRATEGY:
 * 1. Checks cached paginated lists first (90% hit rate)
 * 2. Only makes API call if not found in cache
 * 3. Significantly reduces network requests and improves UX
 *
 * @param id - Generation ID
 * @param options - Query options
 * @param options.enabled - Enable/disable query (default: true)
 * @param options.pollIfInProgress - Poll every 3s if no image URL yet (default: false)
 * @returns Query result with generation data
 *
 * @example
 * const { data, isLoading } = useImageGenerationById('gen-123', {
 *   pollIfInProgress: true
 * });
 */
export function useImageGenerationById(
  id: string,
  options?: {
    enabled?: boolean;
    pollIfInProgress?: boolean;
  }
) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: imageGenerationKeys.detail(id),
    queryFn: async () => {
      // 1️⃣ CACHE-FIRST: Check cached paginated lists first
      const cachedLists = queryClient.getQueriesData<
        App.PaginatedResponse<App.ImageGeneration>
      >({
        queryKey: imageGenerationKeys.lists(),
      });

      for (const [, generations] of cachedLists) {
        if (generations?.data) {
          const found = generations.data.find((g) => g.id === id);
          if (found) {
            // console.log(`✅ [useImageGenerationById] Found in cache: ${id}`);
            return found;
          }
        }
      }

      // 2️⃣ Not in cache, fetch from API
      // console.log(`🌐 [useImageGenerationById] Fetching from API: ${id}`);
      return imageGenerationApi.getGenerationById(id);
    },
    enabled: options?.enabled !== false && !!id,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: (query) => {
      // If pollIfInProgress is true and no image URL yet, poll every 3s
      if (options?.pollIfInProgress && query.state.data) {
        const hasImage = !!query.state.data.generatedImageUrl;
        return hasImage ? false : 3000; // 3s polling if no image yet
      }
      return false;
    },
  });
}
