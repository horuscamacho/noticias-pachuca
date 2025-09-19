import type { Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from './socket-events';

// 🔌 Socket tipado
export type TypedClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// 🚦 Estados de conexión
export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

// 🎯 Estado del socket
export interface SocketState {
  socket: TypedClientSocket | null;
  isConnected: boolean;
  connectionState: ConnectionState;
  lastPing: number | null;
  currentRooms: string[];
  connectionId?: string;
}

// 🎯 Contexto del socket
export interface SocketContextType extends SocketState {
  // Control de conexión
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;

  // Emisión de eventos
  emit: (event: string, data?: any) => boolean;

  // Manejo de salas
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  leaveAllRooms: () => void;
}

// 🎯 Configuración del provider
export interface SocketProviderConfig {
  url: string;
  autoConnect?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  timeout?: number;
}

// 🎯 Opciones de hooks
export interface UseSocketRoomOptions {
  roomId: string;
  autoJoin?: boolean;
  autoLeave?: boolean;
  events?: Record<string, (data: any) => void>;
}

export interface UseRealTimeSyncOptions {
  eventQueryMap: Record<string, string[]>;
  optimisticUpdates?: Record<string, (data: any, queryClient: any) => void>;
  eventFilters?: Record<string, (data: any) => boolean>;
}

// 🎯 Tipos de respuesta
export interface SocketResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// 🎯 Eventos con tipado estricto
export type SocketEventNames = keyof ServerToClientEvents;
export type SocketEventData<T extends SocketEventNames> = Parameters<ServerToClientEvents[T]>[0];

// 🎯 Helper para crear eventos tipados
export type SocketEventHandler<T extends SocketEventNames> = (
  data: SocketEventData<T>
) => void;

// 🔔 Tipos específicos para notificaciones
export interface NotificationPayload {
  id: string;
  type: 'breaking_news' | 'new_article' | 'system_alert' | 'custom';
  title: string;
  body: string;
  data?: Record<string, any>;
  actionUrl?: string;
  imageUrl?: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category?: string;
  delivered_via: 'socket' | 'push';
}

export interface NotificationState {
  notifications: NotificationPayload[];
  unreadCount: number;
  isLoading: boolean;
  hasPermission: boolean;
}