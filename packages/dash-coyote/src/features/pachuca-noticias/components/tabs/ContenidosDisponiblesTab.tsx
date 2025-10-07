"use client";

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  IconSearch,
  IconSend,
  IconEye,
  IconBrandFacebook,
  IconBrandTwitter,
} from '@tabler/icons-react';
import { useAvailableContent, useAvailableContentCategories } from '../../hooks';
import type { AvailableContentFilters, AvailableContent } from '../../hooks';
import { ContentDetailsModal } from '../modals/ContentDetailsModal';

/**
 * 📋 Tab de Contenidos Disponibles para Publicar
 * Muestra contenidos de AIContentGeneration con status completed
 */
export function ContenidosDisponiblesTab() {
  // 🎨 Estados de filtros
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // 🎨 Estado del modal
  const [selectedContent, setSelectedContent] = useState<AvailableContent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewDetails = (content: AvailableContent) => {
    setSelectedContent(content);
    setIsModalOpen(true);
  };

  // 🔍 Construir filtros
  const filters: AvailableContentFilters = {
    status: 'completed',
    onlyUnpublished: true, // Solo mostrar NO publicados
    ...(categoryFilter !== 'all' && { category: categoryFilter }),
    ...(searchText.length > 2 && { search: searchText }),
    limit: 100, // Traer todos los disponibles
  };

  // 🌐 Fetch data
  const { data: contents, isLoading, error } = useAvailableContent(filters);
  const { data: categories } = useAvailableContentCategories();

  // 📊 Helpers
  const getCategoryBadge = (category: string) => {
    return (
      <Badge variant="outline" className="capitalize">
        {category}
      </Badge>
    );
  };

  const getPublishingStatusBadge = (content: typeof contents[0]) => {
    if (content.publishingInfo?.publishedAt) {
      return (
        <Badge variant="default" className="bg-green-600">
          ✓ Publicado
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        Listo para publicar
      </Badge>
    );
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {/* 🔍 FILTROS */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          {/* Búsqueda */}
          <div className="relative md:col-span-2">
            <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título o contenido..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Filtro por categoría */}
          <Select
            value={categoryFilter}
            onValueChange={setCategoryFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat} value={cat} className="capitalize">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 📊 TABLA */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="py-12 text-center text-destructive">
            Error cargando contenidos. Por favor intenta de nuevo.
          </div>
        ) : !contents || contents.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No hay contenidos disponibles para publicar.
            </p>
            <p className="text-sm text-muted-foreground">
              Ve a <strong>Generator Pro</strong> para generar nuevo contenido.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {contents.length} contenido{contents.length !== 1 ? 's' : ''} disponible{contents.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Generado</TableHead>
                    <TableHead>Redes</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contents.map((content) => (
                    <TableRow key={content.id}>
                      {/* Título */}
                      <TableCell className="max-w-md">
                        <div>
                          <div className="font-medium line-clamp-1">
                            {content.generatedTitle}
                          </div>
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {content.generatedSummary}
                          </div>
                        </div>
                      </TableCell>

                      {/* Categoría */}
                      <TableCell>{getCategoryBadge(content.generatedCategory)}</TableCell>

                      {/* Fecha de generación */}
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(content.createdAt), "d MMM yyyy", { locale: es })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(content.createdAt), "HH:mm", { locale: es })}
                        </div>
                      </TableCell>

                      {/* Social Media */}
                      <TableCell>
                        <div className="flex gap-1">
                          {content.socialMediaCopies?.facebook && (
                            <IconBrandFacebook className="h-4 w-4 text-blue-600" title="Copy para Facebook" />
                          )}
                          {content.socialMediaCopies?.twitter && (
                            <IconBrandTwitter className="h-4 w-4 text-sky-500" title="Copy para Twitter" />
                          )}
                        </div>
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Ver detalles"
                            onClick={() => handleViewDetails(content)}
                          >
                            <IconEye className="h-4 w-4" />
                          </Button>

                          {!content.publishingInfo?.publishedAt && (
                            <Button
                              variant="default"
                              size="sm"
                              title="Publicar ahora"
                              onClick={() => handleViewDetails(content)}
                            >
                              <IconSend className="h-4 w-4 mr-1" />
                              Publicar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>

      {/* 📄 MODAL DE DETALLES */}
      <ContentDetailsModal
        content={selectedContent}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </Card>
  );
}
