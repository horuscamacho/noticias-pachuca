# 🚀 Guía Completa Socket.IO Frontend Dashboard 2025
## TanStack Router + TypeScript + Real-time Integration

---

## 📋 Índice de Implementación

1. [🔧 Setup y Dependencias](#setup-dependencias)
2. [🏗️ Arquitectura Base](#arquitectura-base)
3. [🎯 Context Provider Universal](#context-provider)
4. [🔌 Hooks Especializados](#hooks-especializados)
5. [🚦 TanStack Router Integration](#tanstack-integration)
6. [💾 TanStack Query Sync](#query-sync)
7. [🛡️ TypeScript Event System](#typescript-events)
8. [🎨 Componentes UI](#componentes-ui)
9. [⚡ Performance & Cleanup](#performance)
10. [🧪 Testing Patterns](#testing)

---

## 🔧 Setup y Dependencias {#setup-dependencias}

### **📦 Package.json Dependencies**

```json
{
  "dependencies": {
    "socket.io-client": "^4.8.0",
    "@tanstack/router": "^1.65.0",
    "@tanstack/react-query": "^5.40.0",
    "react": "^18.3.0",
    "typescript": "^5.5.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/socket.io-client": "^3.0.0",
    "vite": "^5.3.0"
  }
}
```

### **⚙️ Configuración Base**

```bash
# Solo instalar Socket.IO client (ya tienes el resto)
yarn add socket.io-client

# Estructura de carpetas recomendada
src/
├── socket/
│   ├── context/
│   │   ├── SocketContext.tsx
│   │   └── SocketProvider.tsx
│   ├── hooks/
│   │   ├── useSocket.ts
│   │   ├── useRealTimeSync.ts
│   │   └── useSocketRoom.ts
│   ├── types/
│   │   ├── socket-events.ts
│   │   └── socket-state.ts
│   ├── utils/
│   │   ├── socket-client.ts
│   │   └── connection-manager.ts
│   └── components/
│       ├── ConnectionStatus.tsx
│       └── NotificationToast.tsx
```

---

## 🏗️ Arquitectura Base {#arquitectura-base}

### **🎯 Principios de Diseño**

```typescript
/**
 * ARQUITECTURA SOCKET.IO DASHBOARD 2025
 *
 * 1. Single Socket Connection per App
 * 2. Context API para estado global
 * 3. Room-based subscriptions
 * 4. Auto-cleanup en route changes
 * 5. TypeScript-first approach
 * 6. Performance-optimized
 */

// Niveles de la arquitectura:
// App Level     → SocketProvider (conexión global)
// Router Level  → Route context (room management)
// Page Level    → useSocket hooks (eventos específicos)
// Component     → useRealTimeSync (invalidación automática)
```

### **🔌 Configuración Principal**

```typescript
// src/socket/config/socket-config.ts
export const SOCKET_CONFIG = {
  // URL del backend (desde .env)
  url: import.meta.env.VITE_SOCKET_URL || 'ws://localhost:3000',

  // Opciones de conexión
  options: {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    forceNew: false,

    // Headers de autenticación
    extraHeaders: {
      'x-platform': 'web',
      'x-device-id': `web_${Date.now()}`,
    },

    // Transports
    transports: ['websocket', 'polling'],

    // Auth
    auth: (cb) => {
      // Token desde localStorage/cookies
      const token = localStorage.getItem('authToken');
      cb({ token });
    }
  }
} as const;
```

---

## 🎯 Context Provider Universal {#context-provider}

### **📁 `src/socket/context/SocketContext.tsx`**

```typescript
import { createContext, useContext } from 'react';
import type { Socket } from 'socket.io-client';
import type { SocketState, SocketContextType } from '../types/socket-state';

// Contexto principal
export const SocketContext = createContext<SocketContextType | null>(null);

// Hook para usar el contexto
export const useSocket = () => {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error(
      '🚨 useSocket debe usarse dentro de SocketProvider. ' +
      'Asegúrate de envolver tu app con <SocketProvider>'
    );
  }

  return context;
};

// Hook para socket instance directa
export const useSocketInstance = () => {
  const { socket } = useSocket();
  return socket;
};

// Hook para estado de conexión
export const useConnectionStatus = () => {
  const { isConnected, connectionState, lastPing } = useSocket();
  return { isConnected, connectionState, lastPing };
};
```

### **📁 `src/socket/context/SocketProvider.tsx`**

```typescript
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
import type {
  SocketState,
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

  // Refs para cleanup
  const mountedRef = useRef(true);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🔌 Crear conexión Socket.IO
  const createSocket = useCallback(() => {
    if (socket) {
      socket.disconnect();
    }

    const newSocket = io(url, SOCKET_CONFIG.options);

    // Event listeners principales
    newSocket.on('connect', () => {
      if (!mountedRef.current) return;

      console.log('🔌 Socket conectado:', newSocket.id);
      setIsConnected(true);
      setConnectionState('connected');
      setLastPing(Date.now());
    });

    newSocket.on('disconnect', (reason) => {
      if (!mountedRef.current) return;

      console.log('🔌 Socket desconectado:', reason);
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
      console.log('✅ Sesión establecida:', data);
    });

    newSocket.on('notification', (notification) => {
      console.log('🔔 Notificación recibida:', notification);
      // Aquí puedes disparar eventos para invalidar queries
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

    socket.emit('join-room', roomId);
    setCurrentRooms(prev => new Set([...prev, roomId]));
    console.log(`🏠 Unido a room: ${roomId}`);
  }, [socket, isConnected]);

  const leaveRoom = useCallback((roomId: string) => {
    if (!socket) return;

    socket.emit('leave-room', roomId);
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
    if (autoConnect) {
      createSocket();
    }

    return () => {
      mountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [createSocket, autoConnect]);

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
```

---

## 🔌 Hooks Especializados {#hooks-especializados}

### **📁 `src/socket/hooks/useRealTimeSync.ts`**

```typescript
import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../context/SocketContext';

interface UseRealTimeSyncOptions {
  // Mapeo de eventos de socket a invalidación de queries
  eventQueryMap: Record<string, string[]>;

  // Eventos de actualización optimista
  optimisticUpdates?: Record<string, (data: any, queryClient: any) => void>;

  // Filtros de eventos
  eventFilters?: Record<string, (data: any) => boolean>;
}

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
      'user:update': ['current-user', 'user-profile'],
      'metrics:update': ['dashboard-metrics', 'analytics'],
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
      'user:update': (data) => {
        // Solo procesar si es el usuario actual
        const currentUserId = localStorage.getItem('userId');
        return data.userId === currentUserId;
      }
    }
  });
};
```

### **📁 `src/socket/hooks/useSocketRoom.ts`**

```typescript
import { useEffect, useCallback, useState } from 'react';
import { useSocket } from '../context/SocketContext';

interface UseSocketRoomOptions {
  roomId: string;
  autoJoin?: boolean;
  autoLeave?: boolean;
  events?: Record<string, (data: any) => void>;
}

/**
 * Hook para manejar rooms/salas específicas
 * Útil para chats, colaboración en tiempo real, etc.
 */
export const useSocketRoom = ({
  roomId,
  autoJoin = true,
  autoLeave = true,
  events = {}
}: UseSocketRoomOptions) => {
  const { socket, joinRoom, leaveRoom, isConnected } = useSocket();
  const [isInRoom, setIsInRoom] = useState(false);
  const [roomMembers, setRoomMembers] = useState<string[]>([]);

  // 🏠 Unirse a la sala
  const join = useCallback(() => {
    if (!isConnected || isInRoom) return;

    joinRoom(roomId);
    setIsInRoom(true);
  }, [joinRoom, roomId, isConnected, isInRoom]);

  // 🚪 Salir de la sala
  const leave = useCallback(() => {
    if (!isInRoom) return;

    leaveRoom(roomId);
    setIsInRoom(false);
    setRoomMembers([]);
  }, [leaveRoom, roomId, isInRoom]);

  // 📡 Enviar mensaje a la sala
  const sendToRoom = useCallback((event: string, data: any) => {
    if (!socket || !isInRoom) {
      console.warn(`⚠️ No se puede enviar a room ${roomId}: no conectado`);
      return false;
    }

    socket.emit('room:message', {
      roomId,
      event,
      data
    });
    return true;
  }, [socket, roomId, isInRoom]);

  // 🎯 Configurar listeners de la sala
  useEffect(() => {
    if (!socket || !isInRoom) return;

    // Listener para miembros de la sala
    const handleRoomMembers = (members: string[]) => {
      setRoomMembers(members);
    };

    // Listener cuando alguien se une
    const handleUserJoined = (user: string) => {
      setRoomMembers(prev => [...prev, user]);
    };

    // Listener cuando alguien se va
    const handleUserLeft = (user: string) => {
      setRoomMembers(prev => prev.filter(u => u !== user));
    };

    // Eventos del room
    socket.on(`room:${roomId}:members`, handleRoomMembers);
    socket.on(`room:${roomId}:user-joined`, handleUserJoined);
    socket.on(`room:${roomId}:user-left`, handleUserLeft);

    // Eventos personalizados
    Object.entries(events).forEach(([eventName, handler]) => {
      const roomEvent = `room:${roomId}:${eventName}`;
      socket.on(roomEvent, handler);
    });

    return () => {
      socket.off(`room:${roomId}:members`, handleRoomMembers);
      socket.off(`room:${roomId}:user-joined`, handleUserJoined);
      socket.off(`room:${roomId}:user-left`, handleUserLeft);

      Object.keys(events).forEach(eventName => {
        const roomEvent = `room:${roomId}:${eventName}`;
        socket.off(roomEvent);
      });
    };
  }, [socket, roomId, isInRoom, events]);

  // 🔄 Auto join/leave
  useEffect(() => {
    if (autoJoin && isConnected && !isInRoom) {
      join();
    }
  }, [autoJoin, isConnected, isInRoom, join]);

  useEffect(() => {
    return () => {
      if (autoLeave && isInRoom) {
        leave();
      }
    };
  }, [autoLeave, isInRoom, leave]);

  return {
    isInRoom,
    roomMembers,
    join,
    leave,
    sendToRoom,
    memberCount: roomMembers.length
  };
};
```

### **📁 `src/socket/hooks/useNotifications.ts`**

```typescript
import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  timestamp: string;
  read: boolean;
}

/**
 * Hook especializado para notificaciones en tiempo real
 */
export const useNotifications = () => {
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // 🔔 Manejar nueva notificación
  const handleNewNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Mostrar toast/banner si es necesario
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.body,
        icon: '/notification-icon.png',
        badge: '/badge-icon.png',
        data: notification.data
      });
    }
  }, []);

  // ✅ Marcar como leída
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId
          ? { ...n, read: true }
          : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Informar al servidor
    if (socket) {
      socket.emit('notification:mark-read', notificationId);
    }
  }, [socket]);

  // ✅ Marcar todas como leídas
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(0);

    if (socket) {
      socket.emit('notification:mark-all-read');
    }
  }, [socket]);

  // 🗑️ Limpiar notificaciones
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // 🎯 Configurar listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('notification', handleNewNotification);

    // Solicitar notificaciones pendientes al conectar
    socket.on('connect', () => {
      socket.emit('notification:get-pending');
    });

    // Cargar notificaciones pendientes
    socket.on('notification:pending-list', (pendingNotifications: Notification[]) => {
      setNotifications(pendingNotifications);
      setUnreadCount(pendingNotifications.filter(n => !n.read).length);
    });

    return () => {
      socket.off('notification', handleNewNotification);
      socket.off('notification:pending-list');
    };
  }, [socket, handleNewNotification]);

  // 📢 Solicitar permisos de notificación
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    requestNotificationPermission,
    hasNotifications: notifications.length > 0,
    hasUnread: unreadCount > 0
  };
};
```

---

## 🚦 TanStack Router Integration {#tanstack-integration}

### **📁 `src/router/socket-router-context.ts`**

```typescript
import { createContext } from 'react';
import type { Socket } from 'socket.io-client';

// Contexto para TanStack Router
export interface RouterSocketContext {
  socket: Socket | null;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  currentRoom?: string;
}

export const routerSocketContext = createContext<RouterSocketContext>({
  socket: null,
  joinRoom: () => {},
  leaveRoom: () => {},
});
```

### **📁 `src/router/routes-with-socket.tsx`**

```typescript
import { createRoute, createRouter, createRootRoute } from '@tanstack/router';
import { useSocket } from '../socket/context/SocketContext';
import { useSocketRoom } from '../socket/hooks/useSocketRoom';

// Root route con contexto socket
const rootRoute = createRootRoute({
  component: () => {
    const socketContext = useSocket();

    return (
      <RouterProvider
        router={router}
        context={{ socket: socketContext }}
      />
    );
  }
});

// Route para dashboard general
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  beforeLoad: ({ context }) => {
    // Auto-join a sala general del dashboard
    if (context.socket?.isConnected) {
      context.socket.joinRoom('dashboard-general');
    }

    return {
      socketRoom: 'dashboard-general'
    };
  },
  onLeave: ({ context }) => {
    // Auto-leave al salir
    if (context.socket?.isConnected) {
      context.socket.leaveRoom('dashboard-general');
    }
  },
  component: DashboardPage
});

// Route para salas específicas (ej: chat, colaboración)
const roomRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/room/$roomId',
  beforeLoad: ({ params, context }) => {
    // Validar acceso a la sala
    const { roomId } = params;

    // Auto-join a sala específica
    if (context.socket?.isConnected) {
      context.socket.joinRoom(`room-${roomId}`);
    }

    return {
      socketRoom: `room-${roomId}`,
      roomId
    };
  },
  onLeave: ({ context, params }) => {
    const { roomId } = params;
    if (context.socket?.isConnected) {
      context.socket.leaveRoom(`room-${roomId}`);
    }
  },
  component: RoomPage
});

// Componente de página con socket room
function RoomPage() {
  const { roomId } = useParams({ from: roomRoute });
  const { socket } = useSocket();

  // Hook específico para esta sala
  const {
    isInRoom,
    roomMembers,
    sendToRoom
  } = useSocketRoom({
    roomId: `room-${roomId}`,
    autoJoin: true,
    autoLeave: true,
    events: {
      'message': (message) => {
        console.log('Nuevo mensaje:', message);
      },
      'user-typing': (user) => {
        console.log('Usuario escribiendo:', user);
      }
    }
  });

  return (
    <div className="room-page">
      <h1>Sala: {roomId}</h1>
      <p>Conectado: {isInRoom ? '✅' : '❌'}</p>
      <p>Miembros: {roomMembers.length}</p>

      {/* Componentes de chat/colaboración */}
    </div>
  );
}

const router = createRouter({
  routeTree: rootRoute.addChildren([
    dashboardRoute.addChildren([
      roomRoute
    ])
  ])
});
```

### **📁 `src/router/route-guards.ts`**

```typescript
import type { BeforeLoadContext } from '@tanstack/router';

/**
 * Guard para verificar conexión socket antes de cargar ruta
 */
export const requireSocketConnection = (context: BeforeLoadContext) => {
  const { socket } = context;

  if (!socket?.isConnected) {
    throw new Error('Se requiere conexión Socket.IO para esta página');
  }

  return true;
};

/**
 * Guard para verificar acceso a sala específica
 */
export const requireRoomAccess = async (
  context: BeforeLoadContext,
  roomId: string
) => {
  const { socket } = context;

  if (!socket?.isConnected) {
    throw new Error('Sin conexión Socket.IO');
  }

  // Verificar permisos de acceso a la sala
  return new Promise((resolve, reject) => {
    socket.emit('room:check-access', roomId, (response: any) => {
      if (response.hasAccess) {
        resolve(true);
      } else {
        reject(new Error(`No tienes acceso a la sala: ${roomId}`));
      }
    });
  });
};

// Uso en rutas:
const protectedRoomRoute = createRoute({
  path: '/room/$roomId',
  beforeLoad: async ({ params, context }) => {
    requireSocketConnection(context);
    await requireRoomAccess(context, params.roomId);

    return { roomId: params.roomId };
  },
  component: ProtectedRoomPage
});
```

---

## 💾 TanStack Query Sync {#query-sync}

### **📁 `src/socket/integrations/query-sync.ts`**

```typescript
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../context/SocketContext';
import { useEffect, useCallback } from 'react';

/**
 * Integración avanzada Socket.IO + TanStack Query
 * Sincronización bidireccional de estado
 */
export const useSocketQuerySync = () => {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  // 🔄 Configurar invalidación automática por eventos
  useEffect(() => {
    if (!socket) return;

    const invalidationMap = {
      // Notificaciones
      'notification': ['notifications', 'unread-count'],
      'notification:mark-read': ['notifications', 'unread-count'],

      // Usuario
      'user:profile-updated': ['user-profile', 'current-user'],
      'user:preferences-updated': ['user-preferences'],

      // Dashboard
      'metrics:updated': ['dashboard-metrics'],
      'analytics:updated': ['analytics-data'],

      // Sistema
      'system:config-changed': ['system-config'],
      'system:maintenance': ['system-status'],
    };

    Object.entries(invalidationMap).forEach(([event, queryKeys]) => {
      const handler = (data?: any) => {
        console.log(`🔄 Invalidando queries por ${event}:`, queryKeys);

        queryKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      };

      socket.on(event, handler);
    });

    return () => {
      Object.keys(invalidationMap).forEach(event => {
        socket.off(event);
      });
    };
  }, [socket, queryClient]);

  // ⚡ Actualizaciones optimistas
  useEffect(() => {
    if (!socket) return;

    // Nueva notificación: agregar inmediatamente
    const handleNewNotification = (notification: any) => {
      queryClient.setQueryData(['notifications'], (old: any[]) => [
        notification,
        ...(old || []).slice(0, 49) // Mantener solo 50
      ]);

      queryClient.setQueryData(['unread-count'], (old: number) =>
        (old || 0) + 1
      );
    };

    // Métrica actualizada: update inmediato
    const handleMetricUpdate = (metric: any) => {
      queryClient.setQueryData(['dashboard-metrics'], (old: any) => ({
        ...old,
        [metric.key]: metric.value,
        lastUpdated: new Date().toISOString()
      }));
    };

    // Usuario escribiendo: estado temporal
    const handleUserTyping = (data: any) => {
      queryClient.setQueryData(['typing-users', data.roomId], (old: string[]) => {
        const users = old || [];
        if (!users.includes(data.userId)) {
          return [...users, data.userId];
        }
        return users;
      });

      // Limpiar después de 3 segundos
      setTimeout(() => {
        queryClient.setQueryData(['typing-users', data.roomId], (old: string[]) =>
          (old || []).filter(id => id !== data.userId)
        );
      }, 3000);
    };

    socket.on('notification', handleNewNotification);
    socket.on('metric:update', handleMetricUpdate);
    socket.on('user:typing', handleUserTyping);

    return () => {
      socket.off('notification', handleNewNotification);
      socket.off('metric:update', handleMetricUpdate);
      socket.off('user:typing', handleUserTyping);
    };
  }, [socket, queryClient]);

  // 🎯 Funciones helper para componentes
  const optimisticUpdate = useCallback((
    queryKey: string[],
    updater: (old: any) => any
  ) => {
    queryClient.setQueryData(queryKey, updater);
  }, [queryClient]);

  const invalidateQueries = useCallback((queryKeys: string[]) => {
    queryKeys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
  }, [queryClient]);

  const prefetchOnSocketEvent = useCallback((
    event: string,
    queryKey: string[],
    queryFn: () => Promise<any>
  ) => {
    if (!socket) return;

    const handler = () => {
      queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: 1000 * 60 * 5 // 5 minutos
      });
    };

    socket.on(event, handler);

    return () => socket.off(event, handler);
  }, [socket, queryClient]);

  return {
    optimisticUpdate,
    invalidateQueries,
    prefetchOnSocketEvent
  };
};

// 🎨 Hook para componentes de lista con real-time
export const useRealTimeList = <T>(
  queryKey: string[],
  socketEvents: {
    add?: string;
    update?: string;
    remove?: string;
  }
) => {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    const handlers: Array<() => void> = [];

    // Agregar item
    if (socketEvents.add) {
      const handleAdd = (item: T) => {
        queryClient.setQueryData(queryKey, (old: T[]) => [
          ...(old || []),
          item
        ]);
      };
      socket.on(socketEvents.add, handleAdd);
      handlers.push(() => socket.off(socketEvents.add!, handleAdd));
    }

    // Actualizar item
    if (socketEvents.update) {
      const handleUpdate = (updatedItem: T & { id: string }) => {
        queryClient.setQueryData(queryKey, (old: T[]) =>
          (old || []).map((item: any) =>
            item.id === updatedItem.id ? { ...item, ...updatedItem } : item
          )
        );
      };
      socket.on(socketEvents.update, handleUpdate);
      handlers.push(() => socket.off(socketEvents.update!, handleUpdate));
    }

    // Remover item
    if (socketEvents.remove) {
      const handleRemove = (itemId: string) => {
        queryClient.setQueryData(queryKey, (old: T[]) =>
          (old || []).filter((item: any) => item.id !== itemId)
        );
      };
      socket.on(socketEvents.remove, handleRemove);
      handlers.push(() => socket.off(socketEvents.remove!, handleRemove));
    }

    return () => {
      handlers.forEach(cleanup => cleanup());
    };
  }, [socket, queryClient, queryKey, socketEvents]);
};
```

---

## 🛡️ TypeScript Event System {#typescript-events}

### **📁 `src/socket/types/socket-events.ts`**

```typescript
// 🎯 EVENTOS DEL SERVIDOR AL CLIENTE
export interface ServerToClientEvents {
  // ✅ Conexión y sesión
  connected: (data: {
    sessionId: string;
    platform: string;
    timestamp: string;
  }) => void;

  // 🔔 Notificaciones
  notification: (notification: {
    id: string;
    type: 'breaking_news' | 'new_article' | 'system_alert' | 'custom';
    title: string;
    body: string;
    data?: Record<string, any>;
    actionUrl?: string;
    imageUrl?: string;
    timestamp: string;
    delivered_via: 'socket' | 'push';
  }) => void;

  // 👤 Usuario
  'user:status': (status: {
    userId: string;
    isOnline: boolean;
    lastSeen: string;
  }) => void;

  'user:typing': (data: {
    userId: string;
    roomId: string;
    isTyping: boolean;
  }) => void;

  // 🏠 Salas/Rooms
  'room:joined': (data: {
    roomId: string;
    userId: string;
    timestamp: string;
  }) => void;

  'room:left': (data: {
    roomId: string;
    userId: string;
    timestamp: string;
  }) => void;

  'room:message': (message: {
    id: string;
    roomId: string;
    userId: string;
    content: string;
    type: 'text' | 'image' | 'file';
    timestamp: string;
  }) => void;

  'room:members': (data: {
    roomId: string;
    members: string[];
    count: number;
  }) => void;

  // 📊 Métricas y Analytics
  'metrics:update': (metric: {
    key: string;
    value: number | string;
    timestamp: string;
    category: 'dashboard' | 'analytics' | 'system';
  }) => void;

  // ⚠️ Sistema
  'system:alert': (alert: {
    id: string;
    level: 'info' | 'warning' | 'error' | 'critical';
    title: string;
    message: string;
    timestamp: string;
  }) => void;

  'system:maintenance': (data: {
    scheduled: boolean;
    startTime: string;
    endTime: string;
    message: string;
  }) => void;

  // ❌ Errores
  error: (error: {
    code: string;
    message: string;
    timestamp: string;
  }) => void;

  // 📡 Estados
  'app-state-updated': (data: {
    success: boolean;
    appState: 'foreground' | 'background';
    timestamp: string;
  }) => void;

  'push-token-updated': (data: {
    success: boolean;
    timestamp: string;
  }) => void;
}

// 🎯 EVENTOS DEL CLIENTE AL SERVIDOR
export interface ClientToServerEvents {
  // 🏠 Manejo de salas
  'join-room': (roomId: string) => void;
  'leave-room': (roomId: string) => void;

  // 💬 Mensajes
  'room:message': (data: {
    roomId: string;
    event: string;
    data: any;
  }) => void;

  'room:typing': (data: {
    roomId: string;
    isTyping: boolean;
  }) => void;

  // 📱 Estado de la app
  'app-state-change': (data: {
    appState: 'foreground' | 'background';
    deviceId?: string;
  }) => void;

  // 🔔 Push notifications
  'update-push-token': (data: {
    expoPushToken: string;
    deviceId?: string;
  }) => void;

  // 📊 Eventos de tracking
  'track-event': (event: {
    name: string;
    properties?: Record<string, any>;
    timestamp: string;
  }) => void;

  // 🔔 Notificaciones
  'notification:mark-read': (notificationId: string) => void;
  'notification:mark-all-read': () => void;
  'notification:get-pending': () => void;

  // 🏠 Verificación de acceso a salas
  'room:check-access': (
    roomId: string,
    callback: (response: { hasAccess: boolean }) => void
  ) => void;

  // 🔄 Ping manual
  ping: () => void;
}

// 🎯 DATOS INTER-SERVIDOR (para scaling)
export interface InterServerEvents {
  'user:broadcast': (data: {
    userId: string;
    event: string;
    data: any;
  }) => void;

  'room:broadcast': (data: {
    roomId: string;
    event: string;
    data: any;
    excludeUserId?: string;
  }) => void;
}

// 🎯 DATOS DEL SOCKET
export interface SocketData {
  userId: string;
  platform: 'web' | 'mobile' | 'api';
  deviceId: string;
  sessionId: string;
  rooms: string[];
}

// 🎯 TIPOS COMBINADOS PARA USO
export type TypedSocket = Socket<
  ServerToClientEvents,
  ClientToServerEvents
>;

export type TypedSocketServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
```

### **📁 `src/socket/types/socket-state.ts`**

```typescript
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
```

### **📁 `src/socket/types/notification-types.ts`**

```typescript
// 🔔 Tipos específicos para notificaciones
export interface NotificationPayload {
  id: string;
  type: NotificationType;
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

export type NotificationType =
  | 'breaking_news'
  | 'new_article'
  | 'daily_digest'
  | 'subscription_expiry'
  | 'comment_reply'
  | 'system_alert'
  | 'custom';

export interface NotificationState {
  notifications: NotificationPayload[];
  unreadCount: number;
  isLoading: boolean;
  hasPermission: boolean;
}

export interface NotificationPreferences {
  enabled: boolean;
  types: Record<NotificationType, boolean>;
  sound: boolean;
  desktop: boolean;
  email: boolean;
  push: boolean;
}
```

---

## 🎨 Componentes UI {#componentes-ui}

### **📁 `src/socket/components/ConnectionStatus.tsx`**

```typescript
import { useState, useEffect } from 'react';
import { useConnectionStatus } from '../context/SocketContext';

interface ConnectionStatusProps {
  showDetails?: boolean;
  className?: string;
}

export const ConnectionStatus = ({
  showDetails = false,
  className = ''
}: ConnectionStatusProps) => {
  const { isConnected, connectionState, lastPing } = useConnectionStatus();
  const [pingTime, setPingTime] = useState<number | null>(null);

  // 📊 Calcular latencia
  useEffect(() => {
    if (lastPing) {
      setPingTime(Date.now() - lastPing);
    }
  }, [lastPing]);

  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected': return 'text-green-500';
      case 'connecting':
      case 'reconnecting': return 'text-yellow-500';
      case 'error':
      case 'disconnected': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (connectionState) {
      case 'connected': return '🟢';
      case 'connecting':
      case 'reconnecting': return '🟡';
      case 'error':
      case 'disconnected': return '🔴';
      default: return '⚪';
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Conectando...';
      case 'reconnecting': return 'Reconectando...';
      case 'disconnected': return 'Desconectado';
      case 'error': return 'Error de conexión';
      default: return 'Estado desconocido';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm">{getStatusIcon()}</span>
      <span className={`text-sm font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </span>

      {showDetails && isConnected && (
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          {pingTime && (
            <span>
              📡 {pingTime}ms
            </span>
          )}
          <span>
            ⏰ {new Date(lastPing || 0).toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
};

// 🎯 Componente compacto para header
export const ConnectionIndicator = () => {
  const { isConnected, connectionState } = useConnectionStatus();

  return (
    <div className="flex items-center">
      <div className={`
        w-2 h-2 rounded-full mr-2 transition-colors duration-300
        ${isConnected ? 'bg-green-500' : 'bg-red-500'}
        ${connectionState === 'connecting' || connectionState === 'reconnecting'
          ? 'animate-pulse bg-yellow-500' : ''}
      `} />
      <span className="text-xs text-gray-600">
        {isConnected ? 'En línea' : 'Sin conexión'}
      </span>
    </div>
  );
};
```

### **📁 `src/socket/components/NotificationToast.tsx`**

```typescript
import { useEffect, useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import type { NotificationPayload } from '../types/notification-types';

interface NotificationToastProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  autoHideDuration?: number;
  maxVisible?: number;
}

export const NotificationToast = ({
  position = 'top-right',
  autoHideDuration = 5000,
  maxVisible = 3
}: NotificationToastProps) => {
  const { notifications } = useNotifications();
  const [visibleNotifications, setVisibleNotifications] = useState<NotificationPayload[]>([]);

  // 🔔 Mostrar notificaciones nuevas
  useEffect(() => {
    const newNotifications = notifications
      .filter(n => !n.read)
      .slice(0, maxVisible);

    setVisibleNotifications(newNotifications);
  }, [notifications, maxVisible]);

  // ⏰ Auto-hide notificaciones
  useEffect(() => {
    if (visibleNotifications.length === 0) return;

    const timer = setTimeout(() => {
      setVisibleNotifications(prev => prev.slice(1));
    }, autoHideDuration);

    return () => clearTimeout(timer);
  }, [visibleNotifications, autoHideDuration]);

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right': return 'top-4 right-4';
      case 'top-left': return 'top-4 left-4';
      case 'bottom-right': return 'bottom-4 right-4';
      case 'bottom-left': return 'bottom-4 left-4';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'normal': return 'border-blue-500 bg-blue-50';
      case 'low': return 'border-gray-500 bg-gray-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  if (visibleNotifications.length === 0) return null;

  return (
    <div className={`fixed z-50 space-y-2 ${getPositionClasses()}`}>
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          className={`
            max-w-sm p-4 rounded-lg border-l-4 shadow-lg
            transform transition-all duration-300 ease-in-out
            ${getPriorityColor(notification.priority)}
            ${index === 0 ? 'animate-slide-in' : ''}
          `}
          style={{
            animationDelay: `${index * 100}ms`
          }}
        >
          <div className="flex items-start space-x-3">
            {notification.imageUrl && (
              <img
                src={notification.imageUrl}
                alt="Notification"
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
              />
            )}

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 truncate">
                {notification.title}
              </h4>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {notification.body}
              </p>

              {notification.actionUrl && (
                <a
                  href={notification.actionUrl}
                  className="text-xs text-blue-600 hover:text-blue-800 mt-2 inline-block"
                >
                  Ver más →
                </a>
              )}
            </div>

            <button
              onClick={() => {
                setVisibleNotifications(prev =>
                  prev.filter(n => n.id !== notification.id)
                );
              }}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              {new Date(notification.timestamp).toLocaleTimeString()}
            </span>
            <span className="text-xs text-gray-500">
              📡 {notification.delivered_via}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// 🎯 CSS para animaciones (agregar a tu CSS global)
const styles = `
@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
`;
```

### **📁 `src/socket/components/RealTimeUserList.tsx`**

```typescript
import { useSocketRoom } from '../hooks/useSocketRoom';
import { useConnectionStatus } from '../context/SocketContext';

interface User {
  id: string;
  name: string;
  avatar?: string;
  isTyping?: boolean;
  lastSeen?: string;
}

interface RealTimeUserListProps {
  roomId: string;
  className?: string;
  showTypingIndicator?: boolean;
}

export const RealTimeUserList = ({
  roomId,
  className = '',
  showTypingIndicator = true
}: RealTimeUserListProps) => {
  const { isConnected } = useConnectionStatus();

  const {
    isInRoom,
    roomMembers,
    memberCount
  } = useSocketRoom({
    roomId,
    autoJoin: true,
    autoLeave: true,
    events: {
      'user-joined': (user: User) => {
        console.log('Usuario se unió:', user);
      },
      'user-left': (user: User) => {
        console.log('Usuario se fue:', user);
      },
      'user-typing': (data: { userId: string; isTyping: boolean }) => {
        console.log('Usuario escribiendo:', data);
      }
    }
  });

  if (!isConnected || !isInRoom) {
    return (
      <div className={`text-center text-gray-500 ${className}`}>
        <p className="text-sm">
          {!isConnected ? '📡 Sin conexión' : '🏠 No conectado a la sala'}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">
          Usuarios en línea
        </h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {memberCount}
        </span>
      </div>

      <div className="space-y-1">
        {roomMembers.map(userId => (
          <UserItem
            key={userId}
            userId={userId}
            roomId={roomId}
            showTypingIndicator={showTypingIndicator}
          />
        ))}
      </div>

      {memberCount === 0 && (
        <p className="text-xs text-gray-500 text-center py-4">
          No hay usuarios conectados
        </p>
      )}
    </div>
  );
};

// 🎯 Componente individual de usuario
const UserItem = ({
  userId,
  roomId,
  showTypingIndicator
}: {
  userId: string;
  roomId: string;
  showTypingIndicator: boolean;
}) => {
  // Aquí podrías usar una query para obtener info del usuario
  // const { data: user } = useQuery(['user', userId], () => fetchUser(userId));

  return (
    <div className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg">
      <div className="relative">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
          {userId.charAt(0).toUpperCase()}
        </div>
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          Usuario {userId.slice(0, 8)}
        </p>
        {showTypingIndicator && (
          <p className="text-xs text-gray-500">
            En línea
          </p>
        )}
      </div>
    </div>
  );
};
```

---

## ⚡ Performance & Cleanup {#performance}

### **📁 `src/socket/utils/performance.ts`**

```typescript
import { useEffect, useRef, useCallback } from 'react';
import type { Socket } from 'socket.io-client';

/**
 * Hook para prevenir memory leaks en Socket.IO
 */
export const useSocketCleanup = (socket: Socket | null) => {
  const mountedRef = useRef(true);
  const listenersRef = useRef<Set<string>>(new Set());

  // 🧹 Registrar listener para cleanup
  const registerListener = useCallback((event: string) => {
    listenersRef.current.add(event);
  }, []);

  // 🗑️ Remover todos los listeners
  const cleanupListeners = useCallback(() => {
    if (!socket) return;

    listenersRef.current.forEach(event => {
      socket.off(event);
    });

    listenersRef.current.clear();
  }, [socket]);

  // 📡 Wrapper seguro para socket.on
  const safeOn = useCallback((
    event: string,
    handler: (...args: any[]) => void
  ) => {
    if (!socket || !mountedRef.current) return;

    const safeHandler = (...args: any[]) => {
      if (mountedRef.current) {
        handler(...args);
      }
    };

    socket.on(event, safeHandler);
    registerListener(event);

    return () => {
      socket.off(event, safeHandler);
      listenersRef.current.delete(event);
    };
  }, [socket, registerListener]);

  // 🔄 Cleanup en unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cleanupListeners();
    };
  }, [cleanupListeners]);

  return {
    safeOn,
    cleanupListeners,
    isComponentMounted: () => mountedRef.current
  };
};

/**
 * Throttle para eventos de alta frecuencia
 */
export const useSocketThrottle = (
  callback: (...args: any[]) => void,
  delay: number = 100
) => {
  const lastCall = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback((...args: any[]) => {
    const now = Date.now();

    if (now - lastCall.current >= delay) {
      lastCall.current = now;
      callback(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        lastCall.current = Date.now();
        callback(...args);
      }, delay - (now - lastCall.current));
    }
  }, [callback, delay]);
};

/**
 * Debounce para eventos como typing
 */
export const useSocketDebounce = (
  callback: (...args: any[]) => void,
  delay: number = 300
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

/**
 * Pool de conexiones para múltiples namespaces
 */
export class SocketPool {
  private static instance: SocketPool;
  private connections: Map<string, Socket> = new Map();

  static getInstance(): SocketPool {
    if (!SocketPool.instance) {
      SocketPool.instance = new SocketPool();
    }
    return SocketPool.instance;
  }

  getConnection(namespace: string): Socket | null {
    return this.connections.get(namespace) || null;
  }

  addConnection(namespace: string, socket: Socket): void {
    this.connections.set(namespace, socket);
  }

  removeConnection(namespace: string): void {
    const socket = this.connections.get(namespace);
    if (socket) {
      socket.disconnect();
      this.connections.delete(namespace);
    }
  }

  cleanup(): void {
    this.connections.forEach(socket => socket.disconnect());
    this.connections.clear();
  }
}

/**
 * Metrics para monitoreo de performance
 */
export class SocketMetrics {
  private static events: Array<{
    event: string;
    timestamp: number;
    latency?: number;
  }> = [];

  static trackEvent(event: string, latency?: number): void {
    this.events.push({
      event,
      timestamp: Date.now(),
      latency
    });

    // Mantener solo últimos 1000 eventos
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
  }

  static getMetrics() {
    const last100 = this.events.slice(-100);
    const avgLatency = last100
      .filter(e => e.latency)
      .reduce((sum, e) => sum + (e.latency || 0), 0) / last100.length;

    return {
      totalEvents: this.events.length,
      recentEvents: last100.length,
      averageLatency: avgLatency || 0,
      eventRate: last100.length / 60 // eventos por segundo (aprox)
    };
  }
}
```

---

## 🧪 Testing Patterns {#testing}

### **📁 `src/socket/__tests__/socket-hooks.test.tsx`**

```typescript
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSocket } from '../context/SocketContext';
import { useRealTimeSync } from '../hooks/useRealTimeSync';
import { MockSocket } from './mocks/MockSocket';

// 🎭 Mock Socket.IO
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => new MockSocket())
}));

describe('Socket Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  test('useRealTimeSync invalida queries correctamente', () => {
    const mockSocket = new MockSocket();

    const { result } = renderHook(
      () => useRealTimeSync({
        eventQueryMap: {
          'notification': ['notifications', 'unread-count']
        }
      }),
      { wrapper }
    );

    // Simular evento de socket
    act(() => {
      mockSocket.emit('notification', {
        id: '1',
        title: 'Test',
        body: 'Test notification'
      });
    });

    // Verificar que se invalidaron las queries
    expect(queryClient.getQueryState(['notifications'])?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(['unread-count'])?.isInvalidated).toBe(true);
  });
});
```

### **📁 `src/socket/__tests__/mocks/MockSocket.ts`**

```typescript
import { EventEmitter } from 'events';

export class MockSocket extends EventEmitter {
  connected = false;
  disconnected = false;
  id = 'mock-socket-id';

  connect() {
    this.connected = true;
    this.emit('connect');
    return this;
  }

  disconnect() {
    this.connected = false;
    this.disconnected = true;
    this.emit('disconnect');
    return this;
  }

  emit(event: string, ...args: any[]) {
    super.emit(event, ...args);
    return this;
  }

  // Mock de métodos Socket.IO específicos
  volatile = this;
  broadcast = this;

  to(room: string) {
    return this;
  }

  join(room: string) {
    this.emit('join', room);
    return this;
  }

  leave(room: string) {
    this.emit('leave', room);
    return this;
  }

  // Helper para testing
  simulateEvent(event: string, data: any) {
    this.emit(event, data);
  }

  simulateError(error: Error) {
    this.emit('error', error);
  }

  simulateReconnect() {
    this.emit('disconnect');
    setTimeout(() => {
      this.emit('connect');
    }, 100);
  }
}
```

---

## 🎯 Setup Final en App.tsx

### **📁 `src/App.tsx`**

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/router';
import { SocketProvider } from './socket/context/SocketProvider';
import { NotificationToast } from './socket/components/NotificationToast';
import { ConnectionStatus } from './socket/components/ConnectionStatus';
import { routeTree } from './router/routes';

// Crear query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      refetchOnWindowFocus: false,
    },
  },
});

// Crear router
const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
});

// Declarar tipos para TanStack Router
declare module '@tanstack/router' {
  interface Register {
    router: typeof router;
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider
        url={import.meta.env.VITE_SOCKET_URL}
        autoConnect={true}
      >
        <div className="app">
          {/* Header con estado de conexión */}
          <header className="app-header">
            <ConnectionStatus showDetails={true} />
          </header>

          {/* Router principal */}
          <RouterProvider router={router} />

          {/* Notificaciones toast */}
          <NotificationToast
            position="top-right"
            autoHideDuration={5000}
            maxVisible={3}
          />
        </div>
      </SocketProvider>
    </QueryClientProvider>
  );
}

export default App;
```

---

## 🚀 Quick Start Guide

### **1. Instalación rápida:**
```bash
# Solo necesitas esto (ya tienes TanStack Router, Query y Zustand)
yarn add socket.io-client
```

### **2. Setup básico:**
```typescript
// En tu App.tsx
<SocketProvider url="ws://localhost:3000">
  <RouterProvider router={router} />
</SocketProvider>
```

### **3. Usar en componentes:**
```typescript
// Hook básico
const { socket, isConnected } = useSocket();

// Real-time sync
useDashboardRealTime();

// Room específico
const { isInRoom, sendToRoom } = useSocketRoom({
  roomId: 'dashboard-chat',
  autoJoin: true
});

// Notificaciones
const { notifications, markAsRead } = useNotifications();
```

### **4. Variables de entorno:**
```env
VITE_SOCKET_URL=ws://localhost:3000
VITE_APP_ENV=development
```

---

## ✅ Checklist de Implementación

- [ ] ✅ Socket.IO Client configurado
- [ ] ✅ Context Provider implementado
- [ ] ✅ Hooks especializados creados
- [ ] ✅ TanStack Router integrado
- [ ] ✅ TanStack Query sync configurado
- [ ] ✅ TypeScript events definidos
- [ ] ✅ Componentes UI implementados
- [ ] ✅ Performance optimizations aplicadas
- [ ] ✅ Testing setup completado
- [ ] ✅ Error handling implementado
- [ ] ✅ Cleanup automático configurado

---

**🎯 ¡Listo Coyotito! Este es tu sistema Socket.IO frontend universal y reutilizable para todos tus proyectos de dashboard 2025!**