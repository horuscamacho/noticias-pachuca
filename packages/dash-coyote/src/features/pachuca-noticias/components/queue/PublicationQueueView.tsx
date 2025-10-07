"use client";

import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  IconLoader2,
  IconClock,
  IconArrowUp,
  IconArrowDown,
  IconX,
  IconRocket,
  IconAlertCircle,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import {
  usePublicationQueue,
  useQueueStats,
  useCancelSchedule,
  useChangePriority,
  useForcePublish,
} from '../../hooks';
import type { PublicationQueueItem, QueueStatus, PopulatedNoticia, PopulatedContent } from '../../types/queue.types';
import { PUBLICATION_TYPE_CONFIG, QUEUE_STATUS_CONFIG } from '../../types/queue.types';

/**
 * 📋 Vista principal de la cola de publicación
 * Muestra estadísticas, tabs por estado, y tabla con acciones
 */
export function PublicationQueueView() {
  const [activeTab, setActiveTab] = useState<QueueStatus>('queued');

  // Fetch data
  const { data: queueStats, isLoading: isLoadingStats } = useQueueStats();
  const { data: queueItems, isLoading, refetch } = usePublicationQueue({
    status: activeTab,
  });

  // Mutations
  const { mutate: cancelSchedule } = useCancelSchedule({
    onSuccess: () => {
      toast.success('Publicación cancelada');
      refetch();
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const { mutate: changePriority } = useChangePriority({
    onSuccess: () => {
      toast.success('Prioridad actualizada');
      refetch();
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const { mutate: forcePublish } = useForcePublish({
    onSuccess: () => {
      toast.success('Publicación forzada exitosamente');
      refetch();
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  // Handlers
  const handleCancelSchedule = (queueId: string, title: string) => {
    if (confirm(`¿Cancelar publicación de "${title}"?`)) {
      cancelSchedule({ queueId, reason: 'Cancelado desde dashboard' });
    }
  };

  const handleChangePriority = (queueId: string, currentPriority: number, direction: 'up' | 'down') => {
    const newPriority = direction === 'up'
      ? Math.min(currentPriority + 1, 10)
      : Math.max(currentPriority - 1, 1);

    if (newPriority !== currentPriority) {
      changePriority({ queueId, priority: newPriority });
    }
  };

  const handleForcePublish = (queueId: string, title: string) => {
    if (confirm(`¿Forzar publicación inmediata de "${title}"? Esto saltará la cola.`)) {
      forcePublish(queueId);
    }
  };

  // Helpers
  const getTimeRemaining = (scheduledAt: string) => {
    return formatDistanceToNow(new Date(scheduledAt), {
      addSuffix: true,
      locale: es,
    });
  };

  const getPublicationTypeBadge = (queueType: 'breaking' | 'news' | 'blog') => {
    const config = PUBLICATION_TYPE_CONFIG[queueType];
    return (
      <Badge variant="outline" className="capitalize">
        {config.emoji} {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: QueueStatus) => {
    const config = QUEUE_STATUS_CONFIG[status];
    return (
      <Badge variant={config.variant}>
        {config.emoji} {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas Cards */}
      {queueStats && !isLoadingStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{queueStats.totalQueued}</div>
              <p className="text-xs text-muted-foreground">En Cola</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{queueStats.totalProcessing || 0}</div>
              <p className="text-xs text-muted-foreground">Procesando</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{queueStats.totalPublishedToday || 0}</div>
              <p className="text-xs text-muted-foreground">Publicadas Hoy</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {queueStats.averageIntervalMinutes
                  ? `${Math.round(queueStats.averageIntervalMinutes)} min`
                  : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">Intervalo Promedio</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs de Estados */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as QueueStatus)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="queued">⏳ En Cola</TabsTrigger>
          <TabsTrigger value="processing">⚙️ Procesando</TabsTrigger>
          <TabsTrigger value="published">✅ Publicadas</TabsTrigger>
          <TabsTrigger value="failed">❌ Fallidas</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardContent className="pt-6">
              {/* Tabla */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !queueItems || queueItems.length === 0 ? (
                <div className="py-12 text-center">
                  <IconAlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No hay publicaciones {activeTab === 'queued' ? 'en cola' : activeTab === 'processing' ? 'procesando' : activeTab === 'published' ? 'publicadas' : 'fallidas'}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contenido</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Programada</TableHead>
                        <TableHead>Prioridad</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {queueItems.map((item) => {
                        // Detectar si noticiaId está poblada (status='published')
                        const isNoticiaPopulated = typeof item.noticiaId === 'object' && item.noticiaId !== null;
                        const noticia = isNoticiaPopulated ? (item.noticiaId as PopulatedNoticia) : null;

                        // Detectar si contentId está poblado (siempre debería estarlo)
                        const isContentPopulated = typeof item.contentId === 'object' && item.contentId !== null;
                        const content = isContentPopulated ? (item.contentId as PopulatedContent) : null;

                        return (
                        <TableRow key={item._id}>
                          {/* Contenido */}
                          <TableCell className="max-w-xs">
                            {noticia ? (
                              // Si está publicada, mostrar datos de la noticia
                              <>
                                <div className="font-medium line-clamp-1">
                                  {noticia.title}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {noticia.slug}
                                </div>
                              </>
                            ) : content ? (
                              // Si está en cola, mostrar datos del contenido generado
                              <>
                                <div className="font-medium line-clamp-1">
                                  {content.generatedTitle || 'Sin título'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {content.generatedCategory || 'Sin categoría'}
                                </div>
                              </>
                            ) : (
                              // Fallback
                              <>
                                <div className="font-medium line-clamp-1">
                                  Sin título
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  ID: {String(item._id).slice(-8)}
                                </div>
                              </>
                            )}
                          </TableCell>

                          {/* Tipo */}
                          <TableCell>
                            {getPublicationTypeBadge(item.queueType)}
                          </TableCell>

                          {/* Estado */}
                          <TableCell>
                            {getStatusBadge(item.status)}
                          </TableCell>

                          {/* Programada */}
                          <TableCell>
                            <div className="text-sm">
                              {format(new Date(item.scheduledPublishAt), "d MMM HH:mm", { locale: es })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {getTimeRemaining(item.scheduledPublishAt)}
                            </div>
                          </TableCell>

                          {/* Prioridad */}
                          <TableCell>
                            <Badge variant="secondary">{item.priority}</Badge>
                          </TableCell>

                          {/* Acciones */}
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {/* Cambiar prioridad (solo en queued) */}
                              {item.status === 'queued' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    title="Aumentar prioridad"
                                    onClick={() => handleChangePriority(item._id, item.priority, 'up')}
                                    disabled={item.priority >= 10}
                                  >
                                    <IconArrowUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    title="Reducir prioridad"
                                    onClick={() => handleChangePriority(item._id, item.priority, 'down')}
                                    disabled={item.priority <= 1}
                                  >
                                    <IconArrowDown className="h-4 w-4" />
                                  </Button>
                                </>
                              )}

                              {/* Forzar publicación (solo en queued) */}
                              {item.status === 'queued' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-orange-600"
                                  title="Forzar publicación inmediata"
                                  onClick={() => handleForcePublish(item._id, item.contentId?.toString() || 'Contenido')}
                                >
                                  <IconRocket className="h-4 w-4" />
                                </Button>
                              )}

                              {/* Cancelar (solo en queued o processing) */}
                              {(item.status === 'queued' || item.status === 'processing') && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600"
                                  title="Cancelar publicación"
                                  onClick={() => handleCancelSchedule(item._id, item.contentId?.toString() || 'Contenido')}
                                >
                                  <IconX className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
