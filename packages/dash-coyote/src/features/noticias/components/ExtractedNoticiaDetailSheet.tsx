/**
 * 📰 ExtractedNoticiaDetailSheet Component
 * Modal sheet for viewing detailed extracted news content
 */

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  IconCalendar,
  IconUser,
  IconWorld,
  IconClock,
  IconPhoto,
  IconTag,
  IconFolder,
  IconExternalLink,
  IconCopy,
  IconCheck,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import type { ExtractedNoticia } from '../types/noticias.types';

interface Props {
  noticia: ExtractedNoticia | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ExtractedNoticiaDetailSheet({ noticia, isOpen, onClose }: Props) {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const handleCopyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldName);
      toast.success(`${fieldName} copiado al portapapeles`);

      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedField(null), 2000);
    }).catch(() => {
      toast.error('Error al copiar al portapapeles');
    });
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return {
        formatted: date.toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        relative: formatDistanceToNow(date, { addSuffix: true, locale: es }),
      };
    } catch {
      return { formatted: dateString, relative: '' };
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'extracted':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'pending':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getMethodIcon = (method: string) => {
    return method === 'puppeteer' ? '🤖' : '🕷️';
  };

  if (!noticia) return null;

  const extractionDate = formatDate(noticia.extractedAt);
  const publishedDate = noticia.publishedAt ? formatDate(noticia.publishedAt) : null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-4xl flex flex-col">
        {/* Fixed Header */}
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <IconWorld className="h-5 w-5" />
              <span className="truncate">{noticia.title}</span>
            </div>
            <Badge variant={getStatusBadgeVariant(noticia.status)}>
              {noticia.status}
            </Badge>
          </SheetTitle>
          <SheetDescription className="flex items-center space-x-4 text-sm">
            <span className="flex items-center space-x-1">
              <IconWorld className="h-4 w-4" />
              <span>{noticia.domain}</span>
            </span>
            <span className="flex items-center space-x-1">
              <IconCalendar className="h-4 w-4" />
              <span>{extractionDate.relative}</span>
            </span>
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-6">

          {/* Article Content */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <span>Contenido del Artículo</span>
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyToClipboard(noticia.title, 'Título')}
                >
                  {copiedField === 'Título' ? (
                    <IconCheck className="h-4 w-4" />
                  ) : (
                    <IconCopy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <CardDescription>
                Contenido extraído y procesado del sitio web
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Título</h3>
                </div>
                <p className="text-base leading-relaxed bg-muted p-3 rounded-lg">
                  {noticia.title}
                </p>
              </div>

              <Separator />

              {/* Excerpt */}
              {noticia.excerpt && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-muted-foreground">Resumen</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyToClipboard(noticia.excerpt!, 'Resumen')}
                      >
                        {copiedField === 'Resumen' ? (
                          <IconCheck className="h-3 w-3" />
                        ) : (
                          <IconCopy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg italic">
                      {noticia.excerpt}
                    </p>
                  </div>
                  <Separator />
                </>
              )}

              {/* Content */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">Contenido Completo</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyToClipboard(noticia.content, 'Contenido')}
                  >
                    {copiedField === 'Contenido' ? (
                      <IconCheck className="h-3 w-3" />
                    ) : (
                      <IconCopy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <div className="prose prose-sm max-w-none bg-muted/30 p-4 rounded-lg">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {noticia.content}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <IconTag className="h-5 w-5" />
                <span>Metadatos</span>
              </CardTitle>
              <CardDescription>
                Información adicional y datos del artículo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Author */}
                {noticia.author && (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                      <IconUser className="h-4 w-4" />
                      <span>Autor</span>
                    </div>
                    <p className="text-sm bg-muted p-2 rounded">{noticia.author}</p>
                  </div>
                )}

                {/* Published Date */}
                {publishedDate && (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                      <IconCalendar className="h-4 w-4" />
                      <span>Fecha de Publicación</span>
                    </div>
                    <div className="text-sm bg-muted p-2 rounded space-y-1">
                      <div>{publishedDate.formatted}</div>
                      <div className="text-xs text-muted-foreground">{publishedDate.relative}</div>
                    </div>
                  </div>
                )}

                {/* Source URL */}
                <div className="space-y-1 md:col-span-2">
                  <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                    <IconExternalLink className="h-4 w-4" />
                    <span>URL Original</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm bg-muted p-2 rounded flex-1 font-mono text-xs truncate">
                      {noticia.sourceUrl}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(noticia.sourceUrl, '_blank')}
                    >
                      <IconExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyToClipboard(noticia.sourceUrl, 'URL')}
                    >
                      {copiedField === 'URL' ? (
                        <IconCheck className="h-4 w-4" />
                      ) : (
                        <IconCopy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Categories */}
              {noticia.categories && noticia.categories.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                    <IconFolder className="h-4 w-4" />
                    <span>Categorías</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {noticia.categories.map((category, index) => (
                      <Badge key={index} variant="secondary">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {noticia.tags && noticia.tags.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                    <IconTag className="h-4 w-4" />
                    <span>Etiquetas</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {noticia.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Images */}
              {noticia.images && noticia.images.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                    <IconPhoto className="h-4 w-4" />
                    <span>Imágenes ({noticia.images.length})</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {noticia.images.slice(0, 4).map((image, index) => (
                      <div key={index} className="space-y-2">
                        <img
                          src={image}
                          alt={`Imagen ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {image}
                        </p>
                      </div>
                    ))}
                  </div>
                  {noticia.images.length > 4 && (
                    <p className="text-sm text-muted-foreground">
                      +{noticia.images.length - 4} imágenes más...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Technical Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <IconClock className="h-5 w-5" />
                <span>Detalles Técnicos</span>
              </CardTitle>
              <CardDescription>
                Información sobre el proceso de extracción
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Extraction Method */}
                {noticia.extractionMetadata?.method && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Método</div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getMethodIcon(noticia.extractionMetadata.method)}</span>
                      <span className="text-sm capitalize">{noticia.extractionMetadata.method}</span>
                    </div>
                  </div>
                )}

                {/* Processing Time */}
                {noticia.extractionMetadata?.processingTime && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Tiempo de Procesamiento</div>
                    <div className="text-sm">{noticia.extractionMetadata.processingTime}ms</div>
                  </div>
                )}

                {/* Content Length */}
                {noticia.extractionMetadata?.contentLength && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Longitud del Contenido</div>
                    <div className="text-sm">{noticia.extractionMetadata.contentLength.toLocaleString()} caracteres</div>
                  </div>
                )}

                {/* Images Found */}
                {noticia.extractionMetadata?.imagesFound !== undefined && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Imágenes Encontradas</div>
                    <div className="text-sm">{noticia.extractionMetadata.imagesFound}</div>
                  </div>
                )}

                {/* HTTP Status */}
                {noticia.extractionMetadata?.httpStatusCode && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Código HTTP</div>
                    <div className="text-sm">{noticia.extractionMetadata.httpStatusCode}</div>
                  </div>
                )}

                {/* Extraction Date */}
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Extraído</div>
                  <div className="text-sm space-y-1">
                    <div>{extractionDate.formatted}</div>
                    <div className="text-xs text-muted-foreground">{extractionDate.relative}</div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {noticia.extractionMetadata?.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-sm font-medium text-red-700">Error de Extracción</div>
                  <div className="text-sm text-red-600 mt-1">{noticia.extractionMetadata.error}</div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Fixed Footer */}
        <div className="px-6 py-4 border-t bg-background flex-shrink-0">
          <div className="flex justify-end">
            <Button onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}