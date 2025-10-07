"use client";

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  IconExternalLink,
  IconChevronLeft,
  IconChevronRight,
  IconLoader2,
  IconSearch,
  IconEye,
  IconEdit,
  IconTrash,
  IconStar,
  IconStarFilled,
  IconBolt,
} from '@tabler/icons-react';
import { usePublishedNoticias, useAvailableContentCategories } from '../hooks';
import type { QueryNoticiasDto, PublishedNoticia } from '../types';

/**
 * 📰 Tabla de Noticias Publicadas
 * Muestra todas las noticias con filtros, búsqueda y paginación
 */
export function NoticiasTable() {
  // 🎨 Estados de filtros y paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [pageSize, setPageSize] = useState(20);

  // 🔍 Construir filtros para el query
  const filters: QueryNoticiasDto = {
    page: currentPage,
    limit: pageSize,
    ...(statusFilter !== 'all' && {
      status: statusFilter as 'draft' | 'scheduled' | 'published' | 'unpublished' | 'archived'
    }),
    ...(categoryFilter !== 'all' && { category: categoryFilter }),
    ...(searchText.length > 2 && { search: searchText }),
    sortBy: 'publishedAt',
    sortOrder: 'desc',
  };

  // 🌐 Fetch data con React Query
  const { data, isLoading, error } = usePublishedNoticias(filters);
  const { data: categories } = useAvailableContentCategories();

  // 📊 Helpers
  const getStatusBadge = (status: PublishedNoticia['status']) => {
    const variants = {
      published: 'default',
      draft: 'secondary',
      scheduled: 'outline',
      unpublished: 'destructive',
      archived: 'secondary',
    } as const;

    const labels = {
      published: 'Publicada',
      draft: 'Borrador',
      scheduled: 'Programada',
      unpublished: 'Despublicada',
      archived: 'Archivada',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status]}
      </Badge>
    );
  };

  const getCategoryBadge = (category: string) => {
    return (
      <Badge variant="outline" className="capitalize">
        {category}
      </Badge>
    );
  };

  // 🎨 Renderizado
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>📰 Noticias Publicadas</CardTitle>
          <div className="flex items-center gap-2">
            {data && (
              <span className="text-sm text-muted-foreground">
                {data.pagination.total} noticias
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* 🔍 FILTROS */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          {/* Búsqueda */}
          <div className="relative">
            <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título..."
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1); // Reset a página 1
              }}
              className="pl-8"
            />
          </div>

          {/* Filtro por estado */}
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="published">Publicadas</SelectItem>
              <SelectItem value="draft">Borradores</SelectItem>
              <SelectItem value="scheduled">Programadas</SelectItem>
              <SelectItem value="unpublished">Despublicadas</SelectItem>
              <SelectItem value="archived">Archivadas</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro por categoría */}
          <Select
            value={categoryFilter}
            onValueChange={(value) => {
              setCategoryFilter(value);
              setCurrentPage(1);
            }}
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

          {/* Tamaño de página */}
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Mostrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 por página</SelectItem>
              <SelectItem value="20">20 por página</SelectItem>
              <SelectItem value="50">50 por página</SelectItem>
              <SelectItem value="100">100 por página</SelectItem>
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
            Error cargando noticias. Por favor intenta de nuevo.
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No se encontraron noticias.
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Publicada</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((noticia) => (
                    <TableRow key={noticia._id}>
                      {/* Indicadores */}
                      <TableCell>
                        <div className="flex gap-1">
                          {noticia.isFeatured && (
                            <IconStarFilled className="h-4 w-4 text-yellow-500" title="Destacada" />
                          )}
                          {noticia.isBreaking && (
                            <IconBolt className="h-4 w-4 text-red-500" title="Última hora" />
                          )}
                        </div>
                      </TableCell>

                      {/* Título */}
                      <TableCell className="max-w-md">
                        <div>
                          <div className="font-medium line-clamp-1">
                            {noticia.title}
                          </div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {noticia.summary}
                          </div>
                        </div>
                      </TableCell>

                      {/* Categoría */}
                      <TableCell>{getCategoryBadge(noticia.category)}</TableCell>

                      {/* Estado */}
                      <TableCell>{getStatusBadge(noticia.status)}</TableCell>

                      {/* Fecha de publicación */}
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(noticia.publishedAt), "d MMM yyyy", { locale: es })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(noticia.publishedAt), "HH:mm", { locale: es })}
                        </div>
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {noticia.status === 'published' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              asChild
                            >
                              <a
                                href={noticia.seo.canonicalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Ver en web pública"
                              >
                                <IconExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Ver detalles"
                          >
                            <IconEye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* 📄 PAGINACIÓN */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando{' '}
                <span className="font-medium">
                  {(currentPage - 1) * pageSize + 1}
                </span>{' '}
                a{' '}
                <span className="font-medium">
                  {Math.min(currentPage * pageSize, data.pagination.total)}
                </span>{' '}
                de{' '}
                <span className="font-medium">{data.pagination.total}</span>{' '}
                noticias
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <IconChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>

                <div className="text-sm">
                  Página {currentPage} de {data.pagination.totalPages}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={currentPage >= data.pagination.totalPages}
                >
                  Siguiente
                  <IconChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
