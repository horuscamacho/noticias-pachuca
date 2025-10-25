/**
 * useImageGeneration Hook
 *
 * Mutation hook for generating AI images
 * Invalidates queries on success
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { imageGenerationApi } from '@/src/services/api/imageGenerationApi';
import { imageGenerationKeys } from './queryKeys/imageGeneration';
import type { App } from '@/src/types/image-generation.types';

/**
 * Hook to generate a new image with AI
 *
 * @returns Mutation for image generation
 *
 * @example
 * const { mutate, isPending } = useImageGeneration();
 * mutate({
 *   prompt: "Modern tech news header image",
 *   watermarkText: "Pachuca Noticias",
 *   keywords: ["tech", "news"]
 * });
 */
export function useImageGeneration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: App.GenerateImageRequest) =>
      imageGenerationApi.generateImage(request),
    onSuccess: (response) => {
      // Invalidate all generations lists
      queryClient.invalidateQueries({ queryKey: imageGenerationKeys.lists() });

      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: imageGenerationKeys.stats() });

      console.log('[useImageGeneration] Image generation started:', response.jobId);
    },
    onError: (error) => {
      console.error('[useImageGeneration] Error generating image:', error);
    },
  });
}
