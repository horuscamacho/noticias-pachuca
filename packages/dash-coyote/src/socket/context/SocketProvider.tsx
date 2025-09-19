import {
  ReactNode,
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo
} from 'react';
import { io, Socket } from 'socket.io-client';
import { SocketContext } from './SocketContext';
import { SOCKET_CONFIG } from '../config/socket-config';
import { useAuthTokens } from '@/features/auth/stores/authStore';
import type {
  SocketContextType,
  ConnectionState
} from '../types/socket-state';

interface SocketProviderProps {
  children: ReactNode;
  url?: string;
  autoConnect?: boolean;
}

export const SocketProvider = ({
  children,
  url = SOCKET_CONFIG.url,
  autoConnect = true
}: SocketProviderProps) => {
  // Estados principales
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [lastPing, setLastPing] = useState<number | null>(null);
  const [currentRooms, setCurrentRooms] = useState<Set<string>>(new Set());

  // Auth tokens desde el store
  const tokens = useAuthTokens();

  // Refs para cleanup
  const mountedRef = useRef(true);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🔌 Crear conexión Socket.IO
  const createSocket = useCallback(() => {
    if (socket) {
      socket.disconnect();
    }

    // Agregar token al query string como alternativa
    const socketOptions = {
      ...SOCKET_CONFIG.options,
      query: {
        token: tokens?.accessToken || '',
        platform: 'web'
      },
      extraHeaders: {
        ...SOCKET_CONFIG.options.extraHeaders,
        'Authorization': tokens?.accessToken ? `Bearer ${tokens.accessToken}` : '',
      }
    };

    const newSocket = io(url, socketOptions);

    // Event listeners principales
    newSocket.on('connect', () => {
      if (!mountedRef.current) return;

      console.log('🔌 [FRONTEND] Socket conectado exitosamente:', newSocket.id);
      console.log('🔌 [FRONTEND] Estado actual antes de connect:', { isConnected, connectionState });
      setIsConnected(true);
      setConnectionState('connected');
      setLastPing(Date.now());
      console.log('🔌 [FRONTEND] Estado actualizado a conectado');
    });

    newSocket.on('disconnect', (reason) => {
      if (!mountedRef.current) return;

      console.log('🔌 [FRONTEND] Socket desconectado:', reason);
      setIsConnected(false);
      setConnectionState('disconnected');
      setCurrentRooms(new Set());
    });

    newSocket.on('reconnect', (attemptNumber) => {
      if (!mountedRef.current) return;

      console.log('🔄 Socket reconectado en intento:', attemptNumber);
      setConnectionState('connected');
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      if (!mountedRef.current) return;

      console.log('🔄 Intentando reconectar:', attemptNumber);
      setConnectionState('reconnecting');
    });

    newSocket.on('connect_error', (error) => {
      if (!mountedRef.current) return;

      console.error('❌ Error de conexión:', error);
      setConnectionState('error');
    });

    // Ping/Pong para verificar conexión
    newSocket.on('pong', () => {
      if (!mountedRef.current) return;
      setLastPing(Date.now());
    });

    // Eventos específicos del dashboard
    newSocket.on('connected', (data) => {
      console.log('✅ [FRONTEND] Sesión establecida desde backend:', data);
      // Asegurar que el estado se actualice cuando el backend confirma la conexión
      setIsConnected(true);
      setConnectionState('connected');
      setLastPing(Date.now());
    });

    newSocket.on('notification', (notification) => {
      console.log('🔔 Notificación recibida:', notification);
      // Disparar evento personalizado para otros componentes
      window.dispatchEvent(new CustomEvent('socket:notification', {
        detail: notification
      }));
    });

    newSocket.on('error', (error) => {
      console.error('❌ Error del servidor:', error);
    });

    setSocket(newSocket);

    if (autoConnect) {
      newSocket.connect();
    }

    return newSocket;
  }, [url, autoConnect]);

  // 🏠 Manejo de rooms/salas
  const joinRoom = useCallback((roomId: string) => {
    if (!socket || !isConnected) {
      console.warn('⚠️ No se puede unir a room: socket no conectado');
      return;
    }

    socket.emit('room:join', roomId);
    setCurrentRooms(prev => new Set([...prev, roomId]));
    console.log(`🏠 Unido a room: ${roomId}`);
  }, [socket, isConnected]);

  const leaveRoom = useCallback((roomId: string) => {
    if (!socket) return;

    socket.emit('room:leave', roomId);
    setCurrentRooms(prev => {
      const newRooms = new Set(prev);
      newRooms.delete(roomId);
      return newRooms;
    });
    console.log(`🚪 Salió de room: ${roomId}`);
  }, [socket]);

  const leaveAllRooms = useCallback(() => {
    currentRooms.forEach(roomId => {
      leaveRoom(roomId);
    });
  }, [currentRooms, leaveRoom]);

  // 🔧 Funciones de control
  const connect = useCallback(() => {
    if (socket && !isConnected) {
      setConnectionState('connecting');
      socket.connect();
    } else if (!socket) {
      createSocket();
    }
  }, [socket, isConnected, createSocket]);

  const disconnect = useCallback(() => {
    if (socket) {
      leaveAllRooms();
      socket.disconnect();
    }
  }, [socket, leaveAllRooms]);

  const reconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setTimeout(() => {
        socket.connect();
      }, 1000);
    }
  }, [socket]);

  // 📡 Enviar eventos
  const emit = useCallback((event: string, data?: any) => {
    if (!socket || !isConnected) {
      console.warn(`⚠️ No se puede enviar evento '${event}': socket no conectado`);
      return false;
    }

    socket.emit(event, data);
    return true;
  }, [socket, isConnected]);

  // 🎯 Inicialización
  useEffect(() => {
    if (autoConnect && tokens?.accessToken) {
      console.log('🔌 Iniciando socket con token:', tokens.accessToken ? 'Token presente' : 'Sin token');
      createSocket();
    }

    return () => {
      mountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [createSocket, autoConnect, tokens?.accessToken]);

  // 🔄 Reconectar cuando cambie el token
  useEffect(() => {
    if (socket && tokens?.accessToken) {
      console.log('🔄 Token cambió, reconectando socket...');
      socket.disconnect();
      setTimeout(() => {
        if (mountedRef.current) {
          createSocket();
        }
      }, 1000);
    }
  }, [tokens?.accessToken]);

  // 🧹 Cleanup en unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
      }
    };
  }, [socket]);

  // 📊 Context value memoizado
  const contextValue = useMemo<SocketContextType>(() => ({
    // Estado
    socket,
    isConnected,
    connectionState,
    lastPing,
    currentRooms: Array.from(currentRooms),

    // Funciones de control
    connect,
    disconnect,
    reconnect,
    emit,

    // Room management
    joinRoom,
    leaveRoom,
    leaveAllRooms
  }), [
    socket,
    isConnected,
    connectionState,
    lastPing,
    currentRooms,
    connect,
    disconnect,
    reconnect,
    emit,
    joinRoom,
    leaveRoom,
    leaveAllRooms
  ]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};