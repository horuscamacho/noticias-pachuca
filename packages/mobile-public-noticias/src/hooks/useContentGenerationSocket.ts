import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SocketService } from '@/src/features/socket/services/SocketService';
import type { SocketAPI } from '@/src/features/socket/types/socket.types';
import { generatedContentKeys } from './useGeneratedContent';
import { extractedContentKeys } from './useExtractedContent';

interface ContentGenerationSocketOptions {
  onGenerationStarted?: (data: SocketAPI.ContentGenerationStartedEvent) => void;
  onGenerationCompleted?: (data: SocketAPI.ContentGenerationCompletedEvent) => void;
  onGenerationFailed?: (data: SocketAPI.ContentGenerationFailedEvent) => void;
}

/**
 * Hook para escuchar eventos de generación de contenido en tiempo real
 * Mantiene un Set de extractedContentIds que están siendo procesados
 *
 * @param options - Callbacks opcionales para los eventos
 * @returns Set de IDs siendo procesados
 */
export function useContentGenerationSocket(options?: ContentGenerationSocketOptions) {
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
    (payload: SocketAPI.ContentGenerationStartedEvent) => {
      options?.onGenerationStarted?.(payload);
    },
    [options?.onGenerationStarted]
  );

  const onGenerationCompleted = useCallback(
    (payload: SocketAPI.ContentGenerationCompletedEvent) => {
      options?.onGenerationCompleted?.(payload);
    },
    [options?.onGenerationCompleted]
  );

  const onGenerationFailed = useCallback(
    (payload: SocketAPI.ContentGenerationFailedEvent) => {
      options?.onGenerationFailed?.(payload);
    },
    [options?.onGenerationFailed]
  );

  useEffect(() => {
    const socketService = SocketService.getInstance(queryClient);
    const socket = socketService.socket;

    if (!socket) {
      console.warn('⚠️ [useContentGenerationSocket] Socket not available');
      return;
    }

    console.log('🔌 [useContentGenerationSocket] Setting up content generation listeners');

    // Handler: Generación iniciada
    const handleGenerationStarted = (payload: SocketAPI.ContentGenerationStartedEvent) => {
      console.log('📨 [Socket Event] content:generation-started:', payload);
      addProcessingId(payload.extractedContentId);
      onGenerationStarted(payload);
    };

    // Handler: Generación completada
    const handleGenerationCompleted = (payload: SocketAPI.ContentGenerationCompletedEvent) => {
      console.log('📨 [Socket Event] content:generation-completed:', payload);
      removeProcessingId(payload.extractedContentId);

      // Invalidar queries relevantes
      queryClient.invalidateQueries({
        queryKey: generatedContentKeys.listByPost(payload.extractedContentId)
      });

      queryClient.invalidateQueries({
        queryKey: extractedContentKeys.lists()
      });

      queryClient.invalidateQueries({
        queryKey: extractedContentKeys.detail(payload.extractedContentId)
      });

      onGenerationCompleted(payload);
      console.log(`✅ [Socket Event] Content generation completed for ${payload.extractedContentId}`);
    };

    // Handler: Generación fallida
    const handleGenerationFailed = (payload: SocketAPI.ContentGenerationFailedEvent) => {
      console.log('📨 [Socket Event] content:generation-failed:', payload);
      removeProcessingId(payload.extractedContentId);
      onGenerationFailed(payload);
      console.error(`❌ [Socket Event] Content generation failed: ${payload.error}`);
    };

    // Registrar listeners
    socket.on('content:generation-started', handleGenerationStarted);
    socket.on('content:generation-completed', handleGenerationCompleted);
    socket.on('content:generation-failed', handleGenerationFailed);

    console.log('✅ [useContentGenerationSocket] All listeners registered');

    // Cleanup
    return () => {
      console.log('🧹 [useContentGenerationSocket] Cleaning up listeners');
      socket.off('content:generation-started', handleGenerationStarted);
      socket.off('content:generation-completed', handleGenerationCompleted);
      socket.off('content:generation-failed', handleGenerationFailed);
      console.log('✅ [useContentGenerationSocket] All listeners removed');
    };
  }, [queryClient, addProcessingId, removeProcessingId, onGenerationStarted, onGenerationCompleted, onGenerationFailed]);

  return {
    processingIds,
    isProcessing: (id: string) => processingIds.has(id)
  };
}
