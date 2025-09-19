import { useEffect, useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { toast } from 'sonner';
import type { NotificationPayload } from '../types/socket-state';

interface NotificationToastProps {
  autoShow?: boolean;
  playSound?: boolean;
}

export const NotificationToast = ({
  autoShow = true,
  playSound = true
}: NotificationToastProps) => {
  const { notifications } = useNotifications();
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(null);

  // 🔔 Mostrar toast para notificaciones nuevas
  useEffect(() => {
    if (!autoShow || notifications.length === 0) return;

    const latestNotification = notifications[0];

    // Solo mostrar si es una notificación nueva
    if (latestNotification.id !== lastNotificationId) {
      setLastNotificationId(latestNotification.id);

      // Determinar tipo de toast según prioridad
      const toastFn = latestNotification.priority === 'urgent' ? toast.error :
                      latestNotification.priority === 'high' ? toast.warning :
                      latestNotification.priority === 'low' ? toast.info :
                      toast.success;

      toastFn(latestNotification.title, {
        description: latestNotification.body,
        action: latestNotification.actionUrl ? {
          label: 'Ver más',
          onClick: () => window.open(latestNotification.actionUrl, '_blank')
        } : undefined,
        duration: latestNotification.priority === 'urgent' ? Infinity : 5000,
      });

      // Reproducir sonido si está habilitado
      if (playSound && 'Audio' in window) {
        try {
          const audio = new Audio('/notification-sound.mp3');
          audio.volume = 0.3;
          audio.play().catch(() => {
            // Ignorar errores de audio (autoplay policy)
          });
        } catch (error) {
          console.warn('No se pudo reproducir sonido de notificación:', error);
        }
      }
    }
  }, [notifications, lastNotificationId, autoShow, playSound]);

  // Este componente no renderiza nada visible
  return null;
};