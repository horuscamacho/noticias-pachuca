import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SocketService } from '@/src/features/socket/services/SocketService';
import type { SocketAPI } from '@/src/features/socket/types/socket.types';
import { imageGenerationKeys } from './queryKeys/imageGeneration';

interface ImageGenerationSocketOptions {
  onGenerationStarted?: (data: SocketAPI.ImageGenerationStartedEvent) => void;
  onGenerationProgress?: (data: SocketAPI.ImageGenerationProgressEvent) => void;
  onGenerationCompleted?: (data: SocketAPI.ImageGenerationCompletedEvent) => void;
  onGenerationFailed?: (data: SocketAPI.ImageGenerationFailedEvent) => void;
}

/**
 * Hook para escuchar eventos de generación de imágenes en tiempo real
 * Mantiene un Set de generationIds que están siendo procesados
 *
 * PATRÓN: Sigue estructura de useContentGenerationSocket
 *
 * @param options - Callbacks opcionales para los eventos
 * @returns Set de IDs siendo procesados
 */
export function useImageGenerationSocket(options?: ImageGenerationSocketOptions) {
  const queryClient = useQueryClient();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Agregar ID a processingIds
  const addProcessingId = useCallback((id: string) => {
    setProcessingIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
  }, []);

  // Remover ID de processingIds
  const removeProcessingId = useCallback((id: string) => {
    setProcessingIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  // Estabilizar callbacks opcionales con useCallback
  const onGenerationStarted = useCallback(
    (payload: SocketAPI.ImageGenerationStartedEvent) => {
      options?.onGenerationStarted?.(payload);
    },
    [options?.onGenerationStarted]
  );

  const onGenerationProgress = useCallback(
    (payload: SocketAPI.ImageGenerationProgressEvent) => {
      options?.onGenerationProgress?.(payload);
    },
    [options?.onGenerationProgress]
  );

  const onGenerationCompleted = useCallback(
    (payload: SocketAPI.ImageGenerationCompletedEvent) => {
      options?.onGenerationCompleted?.(payload);
    },
    [options?.onGenerationCompleted]
  );

  const onGenerationFailed = useCallback(
    (payload: SocketAPI.ImageGenerationFailedEvent) => {
      options?.onGenerationFailed?.(payload);
    },
    [options?.onGenerationFailed]
  );

  useEffect(() => {
    const socketService = SocketService.getInstance(queryClient);
    const socket = socketService.socket;

    if (!socket) {
      console.warn('⚠️ [useImageGenerationSocket] Socket not available');
      return;
    }

    console.log('🔌 [useImageGenerationSocket] Setting up image generation listeners');

    // Handler: Generación iniciada
    const handleGenerationStarted = (payload: SocketAPI.ImageGenerationStartedEvent) => {
      console.log('📨 [Socket Event] image-generation:started:', payload);
      addProcessingId(payload.generationId);
      onGenerationStarted(payload);
    };

    // Handler: Progreso de generación
    const handleGenerationProgress = (payload: SocketAPI.ImageGenerationProgressEvent) => {
      console.log(`📊 [Socket Event] image-generation:progress: ${payload.progress}%`, payload);
      // Solo log, NO agregar/remover de Set (es solo progreso)
      onGenerationProgress(payload);
    };

    // Handler: Generación completada
    const handleGenerationCompleted = (payload: SocketAPI.ImageGenerationCompletedEvent) => {
      console.log('📨 [Socket Event] image-generation:completed:', payload);
      removeProcessingId(payload.generationId);

      // Invalidar queries relevantes
      queryClient.invalidateQueries({
        queryKey: imageGenerationKeys.lists()
      });

      queryClient.invalidateQueries({
        queryKey: imageGenerationKeys.detail(payload.generationId)
      });

      queryClient.invalidateQueries({
        queryKey: imageGenerationKeys.stats()
      });

      onGenerationCompleted(payload);
      console.log(`✅ [Socket Event] Image generation completed for ${payload.generationId}`);
    };

    // Handler: Generación fallida
    const handleGenerationFailed = (payload: SocketAPI.ImageGenerationFailedEvent) => {
      console.log('📨 [Socket Event] image-generation:failed:', payload);
      removeProcessingId(payload.generationId);

      // Invalidar queries de lists
      queryClient.invalidateQueries({
        queryKey: imageGenerationKeys.lists()
      });

      onGenerationFailed(payload);
      console.error(`❌ [Socket Event] Image generation failed: ${payload.error}`);
    };

    // Registrar listeners
    socket.on('image-generation:started', handleGenerationStarted);
    socket.on('image-generation:progress', handleGenerationProgress);
    socket.on('image-generation:completed', handleGenerationCompleted);
    socket.on('image-generation:failed', handleGenerationFailed);

    console.log('✅ [useImageGenerationSocket] All listeners registered');

    // Cleanup
    return () => {
      console.log('🧹 [useImageGenerationSocket] Cleaning up listeners');
      socket.off('image-generation:started', handleGenerationStarted);
      socket.off('image-generation:progress', handleGenerationProgress);
      socket.off('image-generation:completed', handleGenerationCompleted);
      socket.off('image-generation:failed', handleGenerationFailed);
      console.log('✅ [useImageGenerationSocket] All listeners removed');
    };
  }, [queryClient, addProcessingId, removeProcessingId, onGenerationStarted, onGenerationProgress, onGenerationCompleted, onGenerationFailed]);

  return {
    processingIds,
    isProcessing: (id: string) => processingIds.has(id)
  };
}
