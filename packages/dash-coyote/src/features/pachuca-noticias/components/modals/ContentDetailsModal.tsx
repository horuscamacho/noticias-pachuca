"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  IconExternalLink,
  IconBrandFacebook,
  IconBrandTwitter,
  IconPhoto,
  IconSend,
  IconX,
  IconAlertTriangle,
  IconClock,
  IconRocket,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import type { AvailableContent } from '../../hooks/useAvailableContent';
import type { PublicationType } from '../../types';
import { PUBLICATION_TYPE_CONFIG } from '../../types';
import { useSchedulePublication, useQueueStats } from '../../hooks';

interface ContentDetailsModalProps {
  content: AvailableContent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 📄 Modal de detalles de contenido generado
 * Muestra el contenido completo, imagen original, y opciones de publicación
 */
export function ContentDetailsModal({
  content,
  open,
  onOpenChange,
}: ContentDetailsModalProps) {
  const [useOriginalImage, setUseOriginalImage] = useState(true);
  const [publicationType, setPublicationType] = useState<PublicationType>('news');

  // Hooks
  const { data: queueStats } = useQueueStats();
  const { mutate: schedulePublication, isPending } = useSchedulePublication({
    onSuccess: (result) => {
      if (result.type === 'published') {
        toast.success('🔴 Noticia publicada inmediatamente');
      } else {
        toast.success('📅 Publicación programada exitosamente');
      }
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Calcular valores antes del early return
  const originalContent = content?.originalContent;
  const hasOriginalImage = originalContent?.images && originalContent.images.length > 0;
  const firstImage = hasOriginalImage ? originalContent.images[0] : null;

  // Resetear checkbox cuando cambie el contenido (ANTES del early return)
  useEffect(() => {
    if (content) {
      setUseOriginalImage(hasOriginalImage);
    }
  }, [content?.id, hasOriginalImage]);

  if (!content) return null;

  const handlePublish = () => {
    if (!content) return;

    schedulePublication({
      contentId: content.id,
      publicationType,
      useOriginalImage,
      isFeatured: false,
    });
  };

  // Calcular hora estimada de publicación
  const getEstimatedPublishTime = (): string => {
    if (publicationType === 'breaking') {
      return 'Inmediato (< 5 segundos)';
    }

    if (!queueStats) return 'Calculando...';

    const avgInterval = queueStats.averageIntervalMinutes;
    const queuedCount = queueStats.totalQueued;

    if (publicationType === 'news') {
      // Alta prioridad: ~30-60 min
      const estimatedMinutes = queuedCount < 10 ? 30 : 60;
      return `~${estimatedMinutes} minutos`;
    }

    // Blog: ~2-4 horas
    const estimatedHours = queuedCount < 10 ? 2 : 4;
    return `~${estimatedHours} horas`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 flex flex-col overflow-hidden">
        {/* HEADER FIJO */}
        <div className="flex-shrink-0 px-6 pt-4 pb-3 border-b bg-background">
          <DialogHeader>
            <DialogTitle className="text-2xl pr-8">
              {content.generatedTitle}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="capitalize">
                  {content.generatedCategory}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Generado {format(new Date(content.createdAt), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                </span>
              </div>
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* CONTENIDO SCROLLEABLE */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-4">
            {/* 📸 IMAGEN ORIGINAL */}
            {hasOriginalImage && firstImage && (
              <div className="mb-6">
                <div className="relative rounded-lg overflow-hidden border">
                  <img
                    src={firstImage}
                    alt={originalContent?.title || content.generatedTitle}
                    className="w-full h-auto max-h-96 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-black/70 text-white">
                      <IconPhoto className="h-3 w-3 mr-1" />
                      Imagen Original
                    </Badge>
                  </div>
                </div>

                {/* Checkbox para usar imagen original */}
                <div className="flex items-center space-x-2 mt-3">
                  <Checkbox
                    id="use-original-image"
                    checked={useOriginalImage}
                    onCheckedChange={(checked) => setUseOriginalImage(checked as boolean)}
                  />
                  <label
                    htmlFor="use-original-image"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Usar esta imagen al publicar
                  </label>
                </div>
              </div>
            )}

            {/* 📝 RESUMEN */}
            {content.generatedSummary && (
              <div className="mb-6">
                <h3 className="font-semibold text-sm mb-2">Resumen</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {content.generatedSummary}
                </p>
              </div>
            )}

            <Separator className="my-4" />

            {/* 📄 CONTENIDO COMPLETO */}
            <div className="mb-6">
              <h3 className="font-semibold text-sm mb-3">Contenido Generado</h3>
              <div className="prose prose-sm max-w-none">
                <div
                  className="text-sm leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: content.generatedContent }}
                />
              </div>
            </div>

            {/* 🏷️ KEYWORDS Y TAGS */}
            {(content.generatedKeywords?.length > 0 || content.generatedTags?.length > 0) && (
              <>
                <Separator className="my-4" />
                <div className="mb-6">
                  {content.generatedKeywords?.length > 0 && (
                    <div className="mb-3">
                      <h3 className="font-semibold text-sm mb-2">Keywords SEO</h3>
                      <div className="flex flex-wrap gap-2">
                        {content.generatedKeywords.map((keyword, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {content.generatedTags?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {content.generatedTags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 🌐 SOCIAL MEDIA */}
            {content.socialMediaCopies && (
              <>
                <Separator className="my-4" />
                <div className="mb-6">
                  <h3 className="font-semibold text-sm mb-3">Copies para Redes Sociales</h3>

                  {content.socialMediaCopies.facebook && (
                    <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                      <div className="flex items-center gap-2 mb-2">
                        <IconBrandFacebook className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-sm">Facebook</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {content.socialMediaCopies.facebook.copy}
                      </p>
                    </div>
                  )}

                  {content.socialMediaCopies.twitter && (
                    <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-950/20">
                      <div className="flex items-center gap-2 mb-2">
                        <IconBrandTwitter className="h-4 w-4 text-sky-500" />
                        <span className="font-medium text-sm">Twitter</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {content.socialMediaCopies.twitter.tweet}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 📰 CONTENIDO ORIGINAL */}
            {originalContent && (
              <>
                <Separator className="my-4" />
                <div className="mb-6">
                  <h3 className="font-semibold text-sm mb-3">Post Original</h3>
                  <div className="space-y-2 text-sm">
                    {originalContent.title && (
                      <div>
                        <span className="font-medium">Título: </span>
                        <span className="text-muted-foreground">{originalContent.title}</span>
                      </div>
                    )}
                    {originalContent.sourceUrl && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Fuente: </span>
                        <a
                          href={originalContent.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          Ver original
                          <IconExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {originalContent.publishedAt && (
                      <div>
                        <span className="font-medium">Publicado: </span>
                        <span className="text-muted-foreground">
                          {format(new Date(originalContent.publishedAt), "d MMM yyyy", { locale: es })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* FOOTER OPTIMIZADO - Tabs compactos */}
        <div className="flex-shrink-0 px-6 py-3 border-t bg-background">
          <Tabs value={publicationType} onValueChange={(v) => setPublicationType(v as PublicationType)}>
            <TabsList className="grid w-full grid-cols-3 h-9">
              <TabsTrigger value="breaking" className="text-xs gap-1">
                🔴 Breaking
              </TabsTrigger>
              <TabsTrigger value="news" className="text-xs gap-1">
                🟡 Noticia
              </TabsTrigger>
              <TabsTrigger value="blog" className="text-xs gap-1">
                🔵 Blog
              </TabsTrigger>
            </TabsList>

            {/* Info compacta inline */}
            <div className="flex items-center justify-between mt-2 text-xs">
              <p className="text-muted-foreground flex items-center gap-1">
                {publicationType === 'breaking' && (
                  <>
                    <IconAlertTriangle className="h-3 w-3 text-red-500" />
                    <span className="text-red-600 font-medium">Publicación inmediata</span>
                  </>
                )}
                {publicationType !== 'breaking' && (
                  <>
                    <IconClock className="h-3 w-3" />
                    <span>Tiempo estimado: <strong>{getEstimatedPublishTime()}</strong></span>
                    {queueStats && <span className="text-muted-foreground ml-1">({queueStats.totalQueued} en cola)</span>}
                  </>
                )}
              </p>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isPending}>
                  Cerrar
                </Button>
                {!content.publishingInfo?.publishedAt && (
                  <Button size="sm" onClick={handlePublish} disabled={isPending}>
                    {isPending ? (
                      <>
                        <IconClock className="h-3 w-3 mr-1 animate-spin" />
                        Procesando...
                      </>
                    ) : publicationType === 'breaking' ? (
                      <>
                        <IconRocket className="h-3 w-3 mr-1" />
                        Publicar Ya
                      </>
                    ) : (
                      <>
                        <IconSend className="h-3 w-3 mr-1" />
                        Agregar
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
