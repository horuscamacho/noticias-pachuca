"use client";

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  IconLoader2,
  IconClock,
  IconCalendarStats,
  IconChartLine,
  IconStack2,
} from '@tabler/icons-react';
import { useQueueStats, usePublicationQueue } from '../../hooks';

/**
 * 📊 Cards de estadísticas de la cola de publicación
 * Grid de 4 cards con métricas en tiempo real
 */
export function QueueStatsCards() {
  const { data: queueStats, isLoading: isLoadingStats } = useQueueStats();
  const { data: nextInQueue } = usePublicationQueue({
    status: 'queued',
    limit: 1,
  });

  const [countdown, setCountdown] = useState<string>('');

  // Countdown timer para próxima publicación
  useEffect(() => {
    if (!nextInQueue || nextInQueue.length === 0) {
      setCountdown('');
      return;
    }

    const updateCountdown = () => {
      const nextPublishAt = new Date(nextInQueue[0].scheduledPublishAt);
      const distance = formatDistanceToNow(nextPublishAt, {
        addSuffix: true,
        locale: es,
      });
      setCountdown(distance);
    };

    // Actualizar inmediatamente
    updateCountdown();

    // Actualizar cada segundo
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [nextInQueue]);

  if (isLoadingStats) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-4">
                <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!queueStats) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {/* Total en Cola */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Total en Cola</CardTitle>
          <IconStack2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{queueStats.totalQueued}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {queueStats.byPriority?.high || 0} alta prioridad
          </p>
        </CardContent>
      </Card>

      {/* Próxima Publicación */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Próxima Publicación</CardTitle>
          <IconClock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {nextInQueue && nextInQueue.length > 0 ? (
            <>
              <div className="text-2xl font-bold truncate">
                {countdown || 'Calculando...'}
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                ID: {nextInQueue[0].contentId?.toString().slice(-8)}
              </p>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground mt-1">
                Sin publicaciones pendientes
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Publicaciones Hoy */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Publicadas Hoy</CardTitle>
          <IconCalendarStats className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {queueStats.totalPublishedToday || 0}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {queueStats.totalPublishedToday && queueStats.totalPublishedToday > 0
              ? 'Ritmo normal'
              : 'Aún sin publicar'}
          </p>
        </CardContent>
      </Card>

      {/* Intervalo Promedio */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Intervalo Promedio</CardTitle>
          <IconChartLine className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {queueStats.averageIntervalMinutes
              ? `${Math.round(queueStats.averageIntervalMinutes)} min`
              : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {queueStats.averageIntervalMinutes
              ? queueStats.averageIntervalMinutes < 15
                ? 'Ritmo rápido'
                : queueStats.averageIntervalMinutes < 45
                ? 'Ritmo normal'
                : 'Ritmo lento'
              : 'Sin datos'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
