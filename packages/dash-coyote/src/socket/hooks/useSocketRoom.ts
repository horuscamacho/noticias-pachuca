import { useEffect, useCallback, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import type { UseSocketRoomOptions } from '../types/socket-state';

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

    socket.emit('room:send-message', {
      roomId,
      content: data,
      type: 'text',
      metadata: { event }
    });
    return true;
  }, [socket, roomId, isInRoom]);

  // 🎯 Configurar listeners de la sala
  useEffect(() => {
    if (!socket || !isInRoom) return;

    // Listener para miembros de la sala
    const handleRoomMembers = (data: { roomId: string; members: string[] }) => {
      if (data.roomId === roomId) {
        setRoomMembers(data.members);
      }
    };

    // Listener cuando alguien se une
    const handleUserJoined = (data: { roomId: string; userId: string }) => {
      if (data.roomId === roomId) {
        setRoomMembers(prev => [...prev, data.userId]);
      }
    };

    // Listener cuando alguien se va
    const handleUserLeft = (data: { roomId: string; userId: string }) => {
      if (data.roomId === roomId) {
        setRoomMembers(prev => prev.filter(u => u !== data.userId));
      }
    };

    // Eventos del room
    socket.on('room:members', handleRoomMembers);
    socket.on('room:user-joined', handleUserJoined);
    socket.on('room:user-left', handleUserLeft);

    // Eventos personalizados
    Object.entries(events).forEach(([eventName, handler]) => {
      const roomEvent = `room:${eventName}`;
      socket.on(roomEvent, handler);
    });

    return () => {
      socket.off('room:members', handleRoomMembers);
      socket.off('room:user-joined', handleUserJoined);
      socket.off('room:user-left', handleUserLeft);

      Object.keys(events).forEach(eventName => {
        const roomEvent = `room:${eventName}`;
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