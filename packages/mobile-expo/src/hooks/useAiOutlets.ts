import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { aiOutletApi } from '@/src/services/outlets/aiOutletApi';
import { outletKeys } from './useOutlets';
import type { AiCreateOutletResponse } from '@/src/types/ai-outlet.types';

/**
 * 🤖 AI Outlets Hooks
 * Hooks React Query para análisis inteligente con OpenAI
 */

/**
 * Query keys para AI Outlets
 */
export const aiOutletKeys = {
  all: ['ai-outlets'] as const,
  analysis: () => [...aiOutletKeys.all, 'analysis'] as const,
  latestAnalysis: () => [...aiOutletKeys.analysis(), 'latest'] as const,
};

/**
 * Hook para analizar página de listado con AI
 */
export function useAiAnalyzeListing() {
  return useMutation({
    mutationFn: aiOutletApi.analyzeListing,
    // No navigation, solo retorna datos para usar en el formulario
  });
}

/**
 * Hook para analizar página de contenido con AI
 */
export function useAiAnalyzeContent() {
  return useMutation({
    mutationFn: aiOutletApi.analyzeContent,
  });
}

/**
 * Hook para crear outlet automáticamente con AI
 */
export function useAiCreateOutlet() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: aiOutletApi.createOutletWithAI,
    onSuccess: (result, variables) => {
      console.log('✅ AI Create Outlet Success:', result);

      // Guardar resultado en React Query Cache
      queryClient.setQueryData(aiOutletKeys.latestAnalysis(), result);

      // Invalidar lista de outlets (por si se creó el outlet)
      queryClient.invalidateQueries({ queryKey: outletKeys.lists() });

      // Navegar a pantalla de resultados con params originales para poder guardar
      router.push({
        pathname: '/outlet/ai-analysis-result',
        params: {
          name: variables.name,
          baseUrl: variables.baseUrl,
          listingUrl: variables.listingUrl,
          testUrl: variables.testUrl || '',
        },
      });
    },
    onError: (error) => {
      console.error('❌ AI Create Outlet Error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    },
    onMutate: (variables) => {
      console.log('🚀 AI Create Outlet Started with:', variables);
    },
  });
}

/**
 * Hook para obtener el último análisis AI desde el cache
 * Se usa en la pantalla de resultados
 */
export function useLatestAiAnalysis() {
  return useQuery<AiCreateOutletResponse | null>({
    queryKey: aiOutletKeys.latestAnalysis(),
    queryFn: () => null, // No hace fetch, solo lee cache
    staleTime: Infinity, // Nunca se vuelve stale
    gcTime: 10 * 60 * 1000, // 10 minutos en cache
  });
}
