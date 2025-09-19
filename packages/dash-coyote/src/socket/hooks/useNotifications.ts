import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import type { NotificationPayload } from '../types/socket-state';

/**
 * Hook especializado para notificaciones en tiempo real
 */
export const useNotifications = () => {
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // 🔔 Manejar nueva notificación
  const handleNewNotification = useCallback((notification: NotificationPayload) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Mostrar notificación nativa del navegador si es permitido
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
    socket.on('notification:pending-list', (pendingNotifications: NotificationPayload[]) => {
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