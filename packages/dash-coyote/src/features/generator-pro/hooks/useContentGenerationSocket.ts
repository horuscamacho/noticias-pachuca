import { useEffect, useCallback } from 'react';
import { useSocketInstance } from '../../../socket';
import { useQueryClient } from '@tanstack/react-query';
import { generatorProKeys } from './index';
import { toast } from 'sonner';

interface GenerationStartedData {
  extractedContentId: string;
  agentId: string;
  agentName: string;
  timestamp: string;
}

interface GenerationCompletedData {
  extractedContentId: string;
  generatedContentId: string;
  agentId: string;
  agentName: string;
  hasSocialCopies: boolean;
  validationWarnings: string[];
  metadata: {
    processingTime: number;
    totalTokens: number;
    cost: number;
  };
  timestamp: string;
}

interface GenerationFailedData {
  extractedContentId: string;
  agentId: string;
  error: string;
  reason: string;
  timestamp: string;
}

interface UseContentGenerationSocketOptions {
  onGenerationStarted?: (data: GenerationStartedData) => void;
  onGenerationCompleted?: (data: GenerationCompletedData) => void;
  onGenerationFailed?: (data: GenerationFailedData) => void;
}

/**
 * Hook para escuchar eventos de generación de contenido via WebSocket
 */
export function useContentGenerationSocket(options: UseContentGenerationSocketOptions = {}) {
  const socket = useSocketInstance();
  const queryClient = useQueryClient();

  const handleGenerationStarted = useCallback((data: GenerationStartedData) => {
    console.log('🚀 Generación iniciada:', data);

    // Toast informativo
    toast.info(`Generando con ${data.agentName}...`, {
      id: `gen-${data.extractedContentId}`,
      duration: Infinity, // Se mantiene hasta que complete o falle
    });

    // Callback personalizado
    if (options.onGenerationStarted) {
      options.onGenerationStarted(data);
    }
  }, [options]);

  const handleGenerationCompleted = useCallback((data: GenerationCompletedData) => {
    console.log('✅ Generación completada:', data);

    // Dismiss toast de inicio
    toast.dismiss(`gen-${data.extractedContentId}`);

    // Toast de éxito con detalles
    const timeInSeconds = (data.metadata.processingTime / 1000).toFixed(1);
    toast.success(`Contenido generado con ${data.agentName}`, {
      description: `${timeInSeconds}s • ${data.metadata.totalTokens} tokens • $${data.metadata.cost.toFixed(4)}`,
      duration: 5000,
    });

    // Invalidar queries para actualizar UI
    queryClient.invalidateQueries({ queryKey: [...generatorProKeys.all, 'generated-content'] });
    queryClient.invalidateQueries({ queryKey: [...generatorProKeys.all, 'extracted-content'] });
    queryClient.invalidateQueries({ queryKey: generatorProKeys.dashboardStats() });

    // Callback personalizado
    if (options.onGenerationCompleted) {
      options.onGenerationCompleted(data);
    }
  }, [options, queryClient]);

  const handleGenerationFailed = useCallback((data: GenerationFailedData) => {
    console.error('❌ Generación fallida:', data);

    // Dismiss toast de inicio
    toast.dismiss(`gen-${data.extractedContentId}`);

    // Toast de error
    toast.error('Error al generar contenido', {
      description: data.reason,
      duration: 7000,
    });

    // Callback personalizado
    if (options.onGenerationFailed) {
      options.onGenerationFailed(data);
    }
  }, [options]);

  useEffect(() => {
    if (!socket) return;

    // Suscribirse a eventos
    socket.on('content:generation-started', handleGenerationStarted);
    socket.on('content:generation-completed', handleGenerationCompleted);
    socket.on('content:generation-failed', handleGenerationFailed);

    // Cleanup
    return () => {
      socket.off('content:generation-started', handleGenerationStarted);
      socket.off('content:generation-completed', handleGenerationCompleted);
      socket.off('content:generation-failed', handleGenerationFailed);
    };
  }, [socket, handleGenerationStarted, handleGenerationCompleted, handleGenerationFailed]);

  return {
    // Retornar métodos útiles si se necesitan
    isSocketConnected: !!socket?.connected,
  };
}
