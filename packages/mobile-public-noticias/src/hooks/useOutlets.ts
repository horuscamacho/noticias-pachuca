import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { outletApi } from '@/src/services/outlets/outletApi';
import type { UpdateFrequenciesDto, CreateOutletDto, TestListingDto, TestContentDto } from '@/src/types/outlet.types';

/**
 * Query keys para React Query
 */
export const outletKeys = {
  all: ['outlets'] as const,
  lists: () => [...outletKeys.all, 'list'] as const,
  list: (active?: boolean) => [...outletKeys.lists(), { active }] as const,
  details: () => [...outletKeys.all, 'detail'] as const,
  detail: (id: string) => [...outletKeys.details(), id] as const,
};

/**
 * Hook para obtener lista de outlets
 * @param active - Filtrar por outlets activos/inactivos (opcional)
 */
export function useOutlets(active?: boolean) {
  return useQuery({
    queryKey: outletKeys.list(active),
    queryFn: () => outletApi.getOutlets(active),
    staleTime: 3 * 60 * 1000, // 3 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos (antes cacheTime)
  });
}

/**
 * Hook para obtener un outlet específico por ID
 * Filtra localmente del cache de la lista
 * @param id - ID del outlet
 */
export function useOutletById(id: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: outletKeys.detail(id),
    queryFn: async () => {
      // Intentar obtener del cache de la lista primero
      const cachedLists = queryClient.getQueriesData<ReturnType<typeof outletApi.getOutlets>>({
        queryKey: outletKeys.lists(),
      });

      // Buscar en todos los caches de listas
      for (const [, outlets] of cachedLists) {
        if (outlets) {
          const outlet = outlets.find((o) => o.id === id);
          if (outlet) {
            return outlet;
          }
        }
      }

      // Si no está en cache, hacer petición directa
      return outletApi.getOutletById(id);
    },
    staleTime: 3 * 60 * 1000, // 3 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para actualizar frecuencias de un outlet
 */
export function useUpdateFrequencies() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateFrequenciesDto }) =>
      outletApi.updateFrequencies(id, dto),
    onSuccess: (updatedOutlet) => {
      // Invalidar todas las listas
      queryClient.invalidateQueries({ queryKey: outletKeys.lists() });

      // Actualizar el cache del detalle específico
      queryClient.setQueryData(outletKeys.detail(updatedOutlet.id), updatedOutlet);
    },
  });
}

/**
 * Hook para iniciar extracción completa (URLs + Contenido)
 */
export function useStartFullExtraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => outletApi.startFullExtraction(id),
    onSuccess: (_, id) => {
      // Invalidar listas y detalle después de una extracción exitosa
      queryClient.invalidateQueries({ queryKey: outletKeys.lists() });
      queryClient.invalidateQueries({ queryKey: outletKeys.detail(id) });
    },
  });
}

/**
 * Hook para pausar un outlet (isActive = false)
 */
export function usePauseOutlet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => outletApi.pauseOutlet(id),
    onMutate: async (id) => {
      // Cancelar todas las queries relacionadas
      await queryClient.cancelQueries({ queryKey: outletKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: outletKeys.lists() });

      // Snapshot del valor anterior
      const previousOutlet = queryClient.getQueryData(outletKeys.detail(id));
      const previousLists = queryClient.getQueriesData({ queryKey: outletKeys.lists() });

      // Actualizar optimísticamente el detail
      queryClient.setQueryData(outletKeys.detail(id), (old: any) => {
        if (!old) return old;
        return { ...old, isActive: false };
      });

      // Actualizar optimísticamente todas las listas
      queryClient.setQueriesData({ queryKey: outletKeys.lists() }, (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((outlet: any) =>
          outlet.id === id ? { ...outlet, isActive: false } : outlet
        );
      });

      return { previousOutlet, previousLists };
    },
    onError: (err, id, context) => {
      // Revertir en caso de error
      if (context?.previousOutlet) {
        queryClient.setQueryData(outletKeys.detail(id), context.previousOutlet);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (_, id) => {
      // Refetch inmediato para confirmar
      queryClient.invalidateQueries({ queryKey: outletKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: outletKeys.lists() });
    },
  });
}

/**
 * Hook para reanudar un outlet (isActive = true)
 */
export function useResumeOutlet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => outletApi.resumeOutlet(id),
    onMutate: async (id) => {
      // Cancelar todas las queries relacionadas
      await queryClient.cancelQueries({ queryKey: outletKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: outletKeys.lists() });

      // Snapshot del valor anterior
      const previousOutlet = queryClient.getQueryData(outletKeys.detail(id));
      const previousLists = queryClient.getQueriesData({ queryKey: outletKeys.lists() });

      // Actualizar optimísticamente el detail
      queryClient.setQueryData(outletKeys.detail(id), (old: any) => {
        if (!old) return old;
        return { ...old, isActive: true };
      });

      // Actualizar optimísticamente todas las listas
      queryClient.setQueriesData({ queryKey: outletKeys.lists() }, (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((outlet: any) =>
          outlet.id === id ? { ...outlet, isActive: true } : outlet
        );
      });

      return { previousOutlet, previousLists };
    },
    onError: (err, id, context) => {
      // Revertir en caso de error
      if (context?.previousOutlet) {
        queryClient.setQueryData(outletKeys.detail(id), context.previousOutlet);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (_, id) => {
      // Refetch inmediato para confirmar
      queryClient.invalidateQueries({ queryKey: outletKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: outletKeys.lists() });
    },
  });
}

/**
 * Hook para crear un nuevo outlet
 */
export function useCreateOutlet() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: CreateOutletDto) => outletApi.createOutlet(data),
    onSuccess: (newOutlet) => {
      // Invalidar todas las listas para que se recarguen
      queryClient.invalidateQueries({ queryKey: outletKeys.lists() });

      // Agregar al cache del detalle
      queryClient.setQueryData(outletKeys.detail(newOutlet.id), newOutlet);

      // Volver a la lista de outlets
      router.back();
    },
  });
}

/**
 * Hook para probar selectores de listado
 * Navega a la pantalla de resultados al completar
 */
export function useTestListingSelectors() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: TestListingDto) => outletApi.testListingSelectors(data),
    onSuccess: (result) => {
      // Navegar a pantalla de resultados con el resultado
      router.push({
        pathname: '/outlet/test-listing-result',
        params: { result: JSON.stringify(result) },
      });
    },
  });
}

/**
 * Hook para probar selectores de contenido individual
 * Navega a la pantalla de resultados al completar
 */
export function useTestContentSelectors() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: TestContentDto) => outletApi.testContentSelectors(data),
    onSuccess: (result) => {
      // Navegar a pantalla de resultados con el resultado
      router.push({
        pathname: '/outlet/test-content-result',
        params: { result: JSON.stringify(result) },
      });
    },
  });
}
