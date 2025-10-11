/**
 * useImageGenerationLogs Hook
 *
 * Socket.IO listener hook for real-time image generation logs
 * CRITICAL: Follows EXACTLY the pattern from useExtractionLogs.ts
 *
 * Socket Events:
 * - image-generation:started
 * - image-generation:progress
 * - image-generation:completed
 * - image-generation:failed
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { LogItem, LogType } from '@/src/types/outlet.types';
import { SocketService } from '@/src/features/socket/services/SocketService';
import type { SocketAPI } from '@/src/features/socket/types/socket.types';

const MAX_LOGS = 100;

/**
 * Hook to listen to image generation logs via Socket.IO
 *
 * @param jobId - BullMQ job ID to filter events
 * @returns Logs array, progress percentage, and isGenerating flag
 *
 * @example
 * const { logs, progress, isGenerating, clearLogs } = useImageGenerationLogs('job-123');
 */
export function useImageGenerationLogs(jobId: string | number) {
  const queryClient = useQueryClient();
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const addLogRef = useRef<(type: LogType, message: string) => void>();

  const addLog = useCallback((type: LogType, message: string) => {
    const newLog: LogItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      timestamp: new Date(),
    };

    setLogs((prev) => {
      const updated = [...prev, newLog];
      return updated.slice(-MAX_LOGS);
    });
  }, []);

  // Keep ref updated
  addLogRef.current = addLog;

  const clearLogs = useCallback(() => {
    setLogs([]);
    setProgress(0);
  }, []);

  const isGenerating =
    logs.length > 0 &&
    logs[logs.length - 1]?.type !== 'success' &&
    !logs[logs.length - 1]?.message.includes('✅') &&
    !logs[logs.length - 1]?.message.includes('❌');

  // Clear logs when jobId changes to a DIFFERENT valid job
  const prevJobIdRef = useRef<string | number>('');

  useEffect(() => {
    const prevId = prevJobIdRef.current;
    const currentId = jobId || '';

    if (currentId && prevId && currentId !== prevId) {
      console.log(`🔄 [useImageGenerationLogs] Job changed from ${prevId} to ${currentId}, clearing logs`);
      setLogs([]);
      setProgress(0);
    }

    prevJobIdRef.current = currentId;
  }, [jobId]);

  useEffect(() => {
    // NO HACER NADA SI NO HAY JOB ID
    if (!jobId || (typeof jobId === 'string' && jobId.length === 0)) {
      console.log('⏭️ [useImageGenerationLogs] No jobId provided, skipping setup');
      return;
    }

    const socketService = SocketService.getInstance(queryClient);

    // CONECTAR SOCKET SI NO ESTÁ CONECTADO
    const setupSocket = async () => {
      try {
        await socketService.connect();
        console.log('✅ [useImageGenerationLogs] Socket connected successfully');
      } catch (error) {
        console.error('❌ [useImageGenerationLogs] Failed to connect socket:', error);
      }
    };

    const socket = socketService.socket;

    console.log(`🔌 [useImageGenerationLogs] Setting up listeners for job: ${jobId}`);
    console.log(`🔌 [useImageGenerationLogs] Socket connected: ${socket?.connected}`);
    console.log(`🔌 [useImageGenerationLogs] Socket ID: ${socket?.id}`);

    // Si no hay socket o no está conectado, conectar
    if (!socket || !socket.connected) {
      console.log('🔄 [useImageGenerationLogs] Socket not connected, connecting...');
      setupSocket();
    }

    if (!socket) {
      console.warn('⚠️ [useImageGenerationLogs] Socket not available after setup');
      return;
    }

    const handleGenerationStarted = (payload: SocketAPI.ImageGenerationStartedEvent) => {
      console.log('📨 [Socket Event] image-generation:started received:', payload);
      if (String(payload.jobId) !== String(jobId)) {
        console.log(`⏭️ [Socket Event] Skipping - jobId mismatch. Expected: ${jobId}, Got: ${payload.jobId}`);
        return;
      }
      console.log('✅ [Socket Event] Adding log - Generation started');
      addLogRef.current?.('info', `🚀 Generación iniciada - ${payload.prompt}`);
      setProgress(0);
    };

    const handleGenerationProgress = (payload: SocketAPI.ImageGenerationProgressEvent) => {
      console.log('📨 [Socket Event] image-generation:progress received:', payload);
      if (String(payload.jobId) !== String(jobId)) {
        console.log(`⏭️ [Socket Event] Skipping - jobId mismatch. Expected: ${jobId}, Got: ${payload.jobId}`);
        return;
      }

      // Update progress
      if (payload.progress !== undefined) {
        setProgress(payload.progress);
      }

      // Add progress logs based on step
      switch (payload.step) {
        case 'validating':
          console.log('✅ [Socket Event] Adding log - Validating');
          addLogRef.current?.('loading', '⏳ Validando solicitud...');
          break;
        case 'generating':
          console.log('✅ [Socket Event] Adding log - Generating');
          addLogRef.current?.('loading', '⏳ Generando imagen con IA...');
          break;
        case 'watermarking':
          console.log('✅ [Socket Event] Adding log - Watermarking');
          addLogRef.current?.('loading', '⏳ Aplicando marca de agua...');
          break;
        case 'uploading':
          console.log('✅ [Socket Event] Adding log - Uploading');
          addLogRef.current?.('loading', '⏳ Subiendo a S3...');
          break;
        case 'saving':
          console.log('✅ [Socket Event] Adding log - Saving');
          addLogRef.current?.('loading', '⏳ Guardando en base de datos...');
          break;
        default:
          if (payload.message) {
            console.log(`✅ [Socket Event] Adding log - ${payload.message}`);
            addLogRef.current?.('loading', `⏳ ${payload.message}`);
          }
      }
    };

    const handleGenerationCompleted = (payload: SocketAPI.ImageGenerationCompletedEvent) => {
      console.log('📨 [Socket Event] image-generation:completed received:', payload);
      if (String(payload.jobId) !== String(jobId)) {
        console.log(`⏭️ [Socket Event] Skipping - jobId mismatch. Expected: ${jobId}, Got: ${payload.jobId}`);
        return;
      }
      console.log('✅ [Socket Event] Adding log - Generation completed');
      setProgress(100);
      addLogRef.current?.(
        'success',
        `✅ Completado - Imagen generada en ${payload.generationTime}s (Costo: $${payload.cost})`
      );

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['image-generation'] });
    };

    const handleGenerationFailed = (payload: SocketAPI.ImageGenerationFailedEvent) => {
      console.log('📨 [Socket Event] image-generation:failed received:', payload);
      if (String(payload.jobId) !== String(jobId)) {
        console.log(`⏭️ [Socket Event] Skipping - jobId mismatch. Expected: ${jobId}, Got: ${payload.jobId}`);
        return;
      }
      console.log('✅ [Socket Event] Adding log - Generation failed');
      setProgress(0);
      addLogRef.current?.('error', `❌ Error: ${payload.error}`);
    };

    socket.on('image-generation:started', handleGenerationStarted);
    socket.on('image-generation:progress', handleGenerationProgress);
    socket.on('image-generation:completed', handleGenerationCompleted);
    socket.on('image-generation:failed', handleGenerationFailed);

    console.log('✅ [useImageGenerationLogs] All listeners registered');

    return () => {
      console.log(`🧹 [useImageGenerationLogs] Cleaning up listeners for job: ${jobId}`);
      socket.off('image-generation:started', handleGenerationStarted);
      socket.off('image-generation:progress', handleGenerationProgress);
      socket.off('image-generation:completed', handleGenerationCompleted);
      socket.off('image-generation:failed', handleGenerationFailed);
      console.log('✅ [useImageGenerationLogs] All listeners removed');
    };
  }, [jobId, queryClient]);

  return {
    logs,
    addLog,
    clearLogs,
    progress,
    isGenerating,
  };
}
