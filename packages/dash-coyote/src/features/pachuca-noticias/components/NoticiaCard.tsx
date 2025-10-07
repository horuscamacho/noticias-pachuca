"use client";

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  IconExternalLink,
  IconEye,
  IconClock,
  IconCalendar,
} from '@tabler/icons-react';

interface NoticiaCardProps {
  noticia: {
    _id: string;
    slug: string;
    title: string;
    summary: string;
    category: string;
    featuredImage?: {
      thumbnail: string;
      alt: string;
    };
    status: 'draft' | 'scheduled' | 'published' | 'unpublished' | 'archived';
    publishedAt: string | Date;
    isFeatured?: boolean;
    isBreaking?: boolean;
  };
  onViewDetails?: (id: string) => void;
}

/**
 * 📰 Card de noticia publicada
 * Muestra preview de noticia con imagen, título, estado y acciones
 */
export function NoticiaCard({ noticia, onViewDetails }: NoticiaCardProps) {
  const isPublished = noticia.status === 'published';
  const publicUrl = isPublished
    ? `https://noticiaspachuca.com/noticia/${noticia.slug}`
    : null;

  const getStatusBadge = () => {
    switch (noticia.status) {
      case 'published':
        return <Badge className="bg-green-600">✓ Publicada</Badge>;
      case 'scheduled':
        return <Badge variant="secondary">📅 Programada</Badge>;
      case 'draft':
        return <Badge variant="outline">📝 Borrador</Badge>;
      case 'unpublished':
        return <Badge variant="destructive">🚫 Despublicada</Badge>;
      case 'archived':
        return <Badge variant="secondary">📦 Archivada</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Imagen destacada */}
      {noticia.featuredImage ? (
        <div className="relative h-48 overflow-hidden bg-muted">
          <img
            src={noticia.featuredImage.thumbnail}
            alt={noticia.featuredImage.alt}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />

          {/* Badges flotantes */}
          <div className="absolute top-2 left-2 flex gap-2">
            {noticia.isBreaking && (
              <Badge className="bg-red-600">🔴 ÚLTIMA NOTICIA</Badge>
            )}
            {noticia.isFeatured && (
              <Badge className="bg-yellow-600">⭐ DESTACADA</Badge>
            )}
          </div>

          {/* Badge de categoría */}
          <div className="absolute bottom-2 left-2">
            <Badge variant="outline" className="bg-black/70 text-white capitalize">
              {noticia.category}
            </Badge>
          </div>
        </div>
      ) : (
        <div className="relative h-48 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
          <IconEye className="h-12 w-12 text-muted-foreground/30" />

          {/* Badges flotantes sin imagen */}
          <div className="absolute top-2 left-2 flex gap-2">
            {noticia.isBreaking && (
              <Badge className="bg-red-600">🔴 ÚLTIMA NOTICIA</Badge>
            )}
            {noticia.isFeatured && (
              <Badge className="bg-yellow-600">⭐ DESTACADA</Badge>
            )}
          </div>
        </div>
      )}

      {/* Contenido */}
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-lg line-clamp-2 leading-tight">
            {noticia.title}
          </h3>
          {getStatusBadge()}
        </div>

        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
          {noticia.summary}
        </p>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <IconCalendar className="h-3 w-3" />
            <span>
              {format(new Date(noticia.publishedAt), "d MMM yyyy", { locale: es })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <IconClock className="h-3 w-3" />
            <span>
              {format(new Date(noticia.publishedAt), "HH:mm", { locale: es })}
            </span>
          </div>
        </div>
      </CardContent>

      {/* Footer con acciones */}
      <CardFooter className="pt-0 flex gap-2">
        {onViewDetails && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewDetails(noticia._id)}
          >
            <IconEye className="h-4 w-4 mr-1" />
            Ver Detalles
          </Button>
        )}

        {publicUrl && (
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            asChild
          >
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <IconExternalLink className="h-4 w-4 mr-1" />
              Ver en Web
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
