import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { LogItem, LogType } from '@/src/types/outlet.types';
import { SocketService } from '@/src/features/socket/services/SocketService';
import type { SocketAPI } from '@/src/features/socket/types/socket.types';

const MAX_LOGS = 100;

export function useExtractionLogs(outletId: string) {
  const queryClient = useQueryClient();
  const [logs, setLogs] = useState<LogItem[]>([]);
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
  }, []);

  const isExtracting =
    logs.length > 0 &&
    logs[logs.length - 1]?.type !== 'success' &&
    !logs[logs.length - 1]?.message.includes('✅ Completado') &&
    !logs[logs.length - 1]?.message.includes('❌ Error');

  // Clear logs when outletId changes to a DIFFERENT valid outlet
  // (pero NO limpiar cuando simplemente se abre/cierra el modal)
  const prevOutletIdRef = useRef<string>('');

  useEffect(() => {
    // Solo limpiar si cambiamos de un outlet válido a OTRO outlet válido diferente
    const prevId = prevOutletIdRef.current;
    const currentId = outletId || '';

    if (currentId && prevId && currentId !== prevId) {
      console.log(`🔄 [useExtractionLogs] Outlet changed from ${prevId} to ${currentId}, clearing logs`);
      setLogs([]);
    }

    prevOutletIdRef.current = currentId;
  }, [outletId]);

  useEffect(() => {
    // 🔥 NO HACER NADA SI NO HAY OUTLET ID
    if (!outletId || outletId.length === 0) {
      console.log('⏭️ [useExtractionLogs] No outletId provided, skipping setup');
      return;
    }

    const socketService = SocketService.getInstance(queryClient);

    // 🔥 CONECTAR SOCKET SI NO ESTÁ CONECTADO
    const setupSocket = async () => {
      try {
        await socketService.connect();
        console.log('✅ [useExtractionLogs] Socket connected successfully');
      } catch (error) {
        console.error('❌ [useExtractionLogs] Failed to connect socket:', error);
      }
    };

    const socket = socketService.socket;

    console.log(`🔌 [useExtractionLogs] Setting up listeners for outlet: ${outletId}`);
    console.log(`🔌 [useExtractionLogs] Socket connected: ${socket?.connected}`);
    console.log(`🔌 [useExtractionLogs] Socket ID: ${socket?.id}`);

    // Si no hay socket o no está conectado, conectar
    if (!socket || !socket.connected) {
      console.log('🔄 [useExtractionLogs] Socket not connected, connecting...');
      setupSocket();
    }

    if (!socket) {
      console.warn('⚠️ [useExtractionLogs] Socket not available after setup');
      return;
    }

    const handleExtractionStarted = (payload: SocketAPI.ExtractionStartedEvent) => {
      console.log('📨 [Socket Event] outlet:extraction-started received:', payload);
      if (payload.outletId !== outletId) {
        console.log(`⏭️ [Socket Event] Skipping - outletId mismatch. Expected: ${outletId}, Got: ${payload.outletId}`);
        return;
      }
      console.log('✅ [Socket Event] Adding log - Extraction started');
      addLogRef.current?.('info', `🚀 Extracción iniciada - ${payload.outletName}`);
    };

    const handleExtractionProgress = (payload: SocketAPI.ExtractionProgressEvent) => {
      console.log('📨 [Socket Event] outlet:extraction-progress received:', payload);
      if (payload.outletId !== outletId) {
        console.log(`⏭️ [Socket Event] Skipping - outletId mismatch. Expected: ${outletId}, Got: ${payload.outletId}`);
        return;
      }

      switch (payload.step) {
        case 'urls_found':
          if (payload.urlsFound !== undefined) {
            console.log(`✅ [Socket Event] Adding log - URLs found: ${payload.urlsFound}`);
            addLogRef.current?.('success', `✓ Encontradas: ${payload.urlsFound} URLs`);
          }
          break;
        case 'extracting_content':
          if (payload.currentUrl) {
            console.log(`✅ [Socket Event] Adding log - Extracting: ${payload.currentUrl}`);
            addLogRef.current?.('loading', `⏳ Extrayendo: ${payload.currentUrl}`);
          }
          break;
        case 'content_extracted':
          if (payload.currentTitle) {
            console.log(`✅ [Socket Event] Adding log - Extracted: ${payload.currentTitle}`);
            addLogRef.current?.('success', `✓ Extraído: "${payload.currentTitle}"`);
          }
          break;
        case 'content_error':
          if (payload.error) {
            console.log(`✅ [Socket Event] Adding log - Error: ${payload.error}`);
            addLogRef.current?.('error', `✗ Error: ${payload.error}`);
          }
          break;
      }
    };

    const handleExtractionCompleted = (payload: SocketAPI.ExtractionCompletedEvent) => {
      console.log('📨 [Socket Event] outlet:extraction-completed received:', payload);
      if (payload.outletId !== outletId) {
        console.log(`⏭️ [Socket Event] Skipping - outletId mismatch. Expected: ${outletId}, Got: ${payload.outletId}`);
        return;
      }
      console.log('✅ [Socket Event] Adding log - Extraction completed');
      addLogRef.current?.(
        'success',
        `✅ Completado - ${payload.totalContent}/${payload.totalUrls} contenidos extraídos en ${payload.duration}s`
      );
    };

    const handleExtractionFailed = (payload: SocketAPI.ExtractionFailedEvent) => {
      console.log('📨 [Socket Event] outlet:extraction-failed received:', payload);
      if (payload.outletId !== outletId) {
        console.log(`⏭️ [Socket Event] Skipping - outletId mismatch. Expected: ${outletId}, Got: ${payload.outletId}`);
        return;
      }
      console.log('✅ [Socket Event] Adding log - Extraction failed');
      addLogRef.current?.('error', `❌ Error: ${payload.error}`);
    };

    socket.on('outlet:extraction-started', handleExtractionStarted);
    socket.on('outlet:extraction-progress', handleExtractionProgress);
    socket.on('outlet:extraction-completed', handleExtractionCompleted);
    socket.on('outlet:extraction-failed', handleExtractionFailed);

    console.log('✅ [useExtractionLogs] All listeners registered');

    return () => {
      console.log(`🧹 [useExtractionLogs] Cleaning up listeners for outlet: ${outletId}`);
      socket.off('outlet:extraction-started', handleExtractionStarted);
      socket.off('outlet:extraction-progress', handleExtractionProgress);
      socket.off('outlet:extraction-completed', handleExtractionCompleted);
      socket.off('outlet:extraction-failed', handleExtractionFailed);
      console.log('✅ [useExtractionLogs] All listeners removed');
    };
  }, [outletId, queryClient]);

  return {
    logs,
    addLog,
    clearLogs,
    isExtracting,
  };
}
