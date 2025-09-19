import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../context/SocketContext';
import type { UseRealTimeSyncOptions } from '../types/socket-state';

/**
 * Hook para sincronizar Socket.IO con TanStack Query
 * Invalida automáticamente queries cuando llegan eventos
 */
export const useRealTimeSync = (options: UseRealTimeSyncOptions) => {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  const {
    eventQueryMap,
    optimisticUpdates = {},
    eventFilters = {}
  } = options;

  // 🔄 Invalidar queries automáticamente
  const setupEventListeners = useCallback(() => {
    if (!socket) return;

    Object.entries(eventQueryMap).forEach(([eventName, queryKeys]) => {
      const handler = (data: any) => {
        // Aplicar filtro si existe
        const filter = eventFilters[eventName];
        if (filter && !filter(data)) {
          return;
        }

        console.log(`🔄 Invalidando queries por evento: ${eventName}`, queryKeys);

        // Invalidar cada query key
        queryKeys.forEach(queryKey => {
          queryClient.invalidateQueries({
            queryKey: [queryKey]
          });
        });
      };

      socket.on(eventName, handler);
    });

    // Configurar actualizaciones optimistas
    Object.entries(optimisticUpdates).forEach(([eventName, updateFn]) => {
      const handler = (data: any) => {
        console.log(`⚡ Actualización optimista: ${eventName}`);
        updateFn(data, queryClient);
      };

      socket.on(eventName, handler);
    });

  }, [socket, eventQueryMap, optimisticUpdates, eventFilters, queryClient]);

  // 🧹 Limpiar listeners
  const cleanupEventListeners = useCallback(() => {
    if (!socket) return;

    Object.keys(eventQueryMap).forEach(eventName => {
      socket.off(eventName);
    });

    Object.keys(optimisticUpdates).forEach(eventName => {
      socket.off(eventName);
    });
  }, [socket, eventQueryMap, optimisticUpdates]);

  useEffect(() => {
    setupEventListeners();
    return cleanupEventListeners;
  }, [setupEventListeners, cleanupEventListeners]);

  return {
    invalidateQuery: (queryKey: string) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },

    updateQueryData: (queryKey: string, updater: (data: any) => any) => {
      queryClient.setQueryData([queryKey], updater);
    }
  };
};

// 🎯 Hook específico para dashboard
export const useDashboardRealTime = () => {
  return useRealTimeSync({
    eventQueryMap: {
      'notification': ['notifications', 'unread-count'],
      'user:profile-updated': ['current-user', 'user-profile'],
      'metric:updated': ['dashboard-metrics', 'analytics'],
      'system:alert': ['system-status', 'alerts'],
    },

    optimisticUpdates: {
      'notification': (notification, queryClient) => {
        // Agregar notificación inmediatamente
        queryClient.setQueryData(['notifications'], (old: any[]) => [
          notification,
          ...(old || [])
        ]);

        // Incrementar contador
        queryClient.setQueryData(['unread-count'], (old: number) =>
          (old || 0) + 1
        );
      }
    },

    eventFilters: {
      'user:profile-updated': (data) => {
        // Solo procesar si es el usuario actual
        const currentUserId = localStorage.getItem('userId');
        return data.userId === currentUserId;
      }
    }
  });
};