/**
 * useStoreInBank Hook
 *
 * Mutation hook for storing generated image in Image Bank
 * Invalidates ImageBank and ImageGeneration queries on success
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { imageGenerationApi } from '@/src/services/api/imageGenerationApi';
import { imageGenerationKeys } from './queryKeys/imageGeneration';
import type { App } from '@/src/types/image-generation.types';

/**
 * Hook to store generated image in Image Bank
 *
 * @returns Mutation for storing in bank
 *
 * @example
 * const { mutate, isPending } = useStoreInBank();
 * mutate({
 *   id: 'gen-123',
 *   metadata: {
 *     keywords: ['tech', 'news'],
 *     categories: ['technology'],
 *     altText: 'Modern tech news header',
 *     caption: 'AI generated image for tech article'
 *   }
 * });
 */
export function useStoreInBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, metadata }: { id: string; metadata: App.StoreInBankMetadata }) =>
      imageGenerationApi.storeInBank(id, metadata),
    onSuccess: (response, variables) => {
      // Invalidate Image Bank queries
      queryClient.invalidateQueries({ queryKey: ['image-bank'] });

      // Invalidate the specific generation detail
      queryClient.invalidateQueries({
        queryKey: imageGenerationKeys.detail(variables.id),
      });

      // Invalidate all generations lists
      queryClient.invalidateQueries({ queryKey: imageGenerationKeys.lists() });

      console.log('[useStoreInBank] Image stored in bank:', response.generationId);
    },
    onError: (error) => {
      console.error('[useStoreInBank] Error storing in bank:', error);
    },
  });
}
