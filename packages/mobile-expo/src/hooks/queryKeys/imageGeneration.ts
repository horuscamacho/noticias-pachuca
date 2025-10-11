/**
 * Image Generation Query Keys
 *
 * Centralized query keys for React Query
 * Pattern: hierarchical keys for efficient invalidation
 */

import type { App } from '@/src/types/image-generation.types';

export const imageGenerationKeys = {
  all: ['image-generation'] as const,
  lists: () => [...imageGenerationKeys.all, 'list'] as const,
  list: (filters?: App.ImageGenerationFilters) =>
    [...imageGenerationKeys.lists(), filters] as const,
  details: () => [...imageGenerationKeys.all, 'detail'] as const,
  detail: (id: string) => [...imageGenerationKeys.details(), id] as const,
  stats: () => [...imageGenerationKeys.all, 'stats'] as const,
};
