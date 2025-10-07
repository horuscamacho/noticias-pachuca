"use client";

import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  IconLoader2,
  IconClock,
  IconCalendarEvent,
  IconAlertCircle,
} from '@tabler/icons-react';
import { usePublicationQueue } from '../../hooks';
import { PUBLICATION_TYPE_CONFIG } from '../../types/queue.types';

/**
 * 🕐 Timeline de próximas publicaciones programadas
 * Muestra las próximas 10 publicaciones en orden cronológico
 */
export function QueueTimeline() {
  const { data: queueItems, isLoading } = usePublicationQueue({
    status: 'queued',
    limit: 10,
  });

  const getTimeLabel = (scheduledAt: string) => {
    const date = new Date(scheduledAt);

    if (isPast(date)) {
      return <Badge variant="destructive" className="text-xs">Retrasado</Badge>;
    }

    if (isToday(date)) {
      return <Badge className="bg-green-600 text-xs">Hoy</Badge>;
    }

    if (isTomorrow(date)) {
      return <Badge variant="secondary" className="text-xs">Mañana</Badge>;
    }

    return (
      <Badge variant="outline" className="text-xs">
        {format(date, "d MMM", { locale: es })}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <IconCalendarEvent className="h-5 w-5" />
          Próximas Publicaciones
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !queueItems || queueItems.length === 0 ? (
          <div className="py-8 text-center">
            <IconAlertCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No hay publicaciones programadas
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {queueItems.map((item, index) => {
                const config = PUBLICATION_TYPE_CONFIG[item.queueType];
                const scheduledDate = new Date(item.scheduledPublishAt);

                return (
                  <div key={item._id}>
                    {/* Timeline Item */}
                    <div className="relative pl-6">
                      {/* Timeline connector */}
                      {index < queueItems.length - 1 && (
                        <div className="absolute left-[7px] top-8 bottom-0 w-px bg-border" />
                      )}

                      {/* Timeline dot */}
                      <div
                        className="absolute left-0 top-2 h-4 w-4 rounded-full border-2 border-background"
                        style={{ backgroundColor: config.color || '#666' }}
                      />

                      {/* Content */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {format(scheduledDate, "HH:mm", { locale: es })}
                          </span>
                          {getTimeLabel(item.scheduledPublishAt)}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs">{config.emoji}</span>
                          <span className="text-sm text-muted-foreground line-clamp-1">
                            {item.contentId?.toString().slice(-8) || 'Sin título'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <IconClock className="h-3 w-3" />
                          <span>Prioridad: {item.priority}</span>
                        </div>
                      </div>
                    </div>

                    {/* Separator between items */}
                    {index < queueItems.length - 1 && (
                      <Separator className="my-4" />
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
