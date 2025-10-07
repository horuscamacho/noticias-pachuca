import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generatorProApi } from '@/src/services/generator-pro/generatorProApi';

// Query keys
export const generatorProKeys = {
  all: ['generator-pro'] as const,
  websites: () => [...generatorProKeys.all, 'websites'] as const,
};

// Website hooks
export function useWebsiteConfigs() {
  return useQuery({
    queryKey: generatorProKeys.websites(),
    queryFn: generatorProApi.getWebsites,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Manual workflow hooks
export function useExtractUrlsAndSave() {
  return useMutation({
    mutationFn: generatorProApi.extractUrlsAndSave,
  });
}

export function useExtractContentFromUrls() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generatorProApi.extractContentFromUrls,
    onSuccess: () => {
      // Invalidar cualquier query relevante después de extraer contenido
      queryClient.invalidateQueries({ queryKey: generatorProKeys.all });
    },
  });
}
