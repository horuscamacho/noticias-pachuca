/**
 * useImageGenerationStats Hook
 *
 * Query hook for fetching user image generation statistics
 * Includes total, cost, model breakdown, quality breakdown
 */

import { useQuery } from '@tanstack/react-query';
import { imageGenerationApi } from '@/src/services/api/imageGenerationApi';
import { imageGenerationKeys } from './queryKeys/imageGeneration';

/**
 * Hook to get user image generation statistics
 *
 * @returns Query result with stats
 *
 * @example
 * const { data, isLoading, refetch } = useImageGenerationStats();
 *
 * // data structure:
 * // {
 * //   total: 42,
 * //   totalCost: 1.25,
 * //   averageCost: 0.03,
 * //   byModel: { 'dall-e-3': 30, 'stable-diffusion': 12 },
 * //   byQuality: { 'high': 20, 'medium': 15, 'low': 7 },
 * //   reviewed: 10,
 * //   pending: 32
 * // }
 */
export function useImageGenerationStats() {
  return useQuery({
    queryKey: imageGenerationKeys.stats(),
    queryFn: () => imageGenerationApi.getUserStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
  });
}
