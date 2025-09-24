/**
 * 📰 ExtractedNoticiasTab Component
 * Display and manage extracted news content
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText,
  ExternalLink,
  Image as ImageIcon,
  Calendar,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { useExtractedNoticias } from '../hooks';
import { ExtractedNoticiaDetailSheet } from './ExtractedNoticiaDetailSheet';
import type { NoticiasFilters, ExtractedNoticia } from '../types/noticias.types';

export function ExtractedNoticiasTab() {
  const [filters, setFilters] = useState<NoticiasFilters>({});
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [selectedNoticia, setSelectedNoticia] = useState<ExtractedNoticia | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);

  const { data, isLoading, refetch } = useExtractedNoticias({
    page,
    limit: 15,
    ...filters,
  });

  // Debug logging
  console.log('🐛 ExtractedNoticiasTab Debug:', {
    isLoading,
    data,
    hasData: !!data,
    dataType: typeof data,
    dataKeys: data ? Object.keys(data) : null,
    dataData: data?.data,
    pagination: data?.pagination,
    filters,
    page,
  });

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      searchText: searchText.trim() || undefined,
    }));
    setPage(1);
  };

  const clearSearch = () => {
    setSearchText('');
    setFilters({});
    setPage(1);
  };

  const handleViewDetails = (noticia: ExtractedNoticia) => {
    setSelectedNoticia(noticia);
    setIsDetailSheetOpen(true);
  };

  const handleCloseDetailSheet = () => {
    setIsDetailSheetOpen(false);
    setSelectedNoticia(null);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <span>Buscar Noticias</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              placeholder="Buscar en título o contenido..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={clearSearch}>
              Limpiar
            </Button>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Noticias Table */}
      <Card>
        <CardHeader>
          <CardTitle>Noticias Extraídas</CardTitle>
          <p className="text-muted-foreground">
            {data?.pagination?.total || 0} noticias encontradas
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Cargando noticias...</p>
            </div>
          ) : !data?.data || data.data.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No se encontraron noticias</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Dominio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Imágenes</TableHead>
                    <TableHead>Extraída</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.map((noticia) => (
                    <TableRow key={noticia._id}>
                      <TableCell className="max-w-xs">
                        <div className="font-medium truncate" title={noticia.title}>
                          {noticia.title}
                        </div>
                        {noticia.excerpt && (
                          <div className="text-xs text-muted-foreground truncate mt-1">
                            {noticia.excerpt}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{noticia.domain}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            noticia.status === 'extracted'
                              ? 'default'
                              : noticia.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {noticia.status === 'extracted'
                            ? 'Extraída'
                            : noticia.status === 'failed'
                            ? 'Fallida'
                            : 'Procesando'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {noticia.images.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <ImageIcon className="h-4 w-4" />
                            <span className="text-sm">{noticia.images.length}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {format(new Date(noticia.extractedAt), 'dd/MM/yyyy HH:mm', {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(noticia.sourceUrl, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(noticia)}
                            title="Ver detalles"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data?.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {data.pagination.page} de {data.pagination.totalPages}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={!data.pagination.hasPrev}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={!data.pagination.hasNext}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <ExtractedNoticiaDetailSheet
        noticia={selectedNoticia}
        isOpen={isDetailSheetOpen}
        onClose={handleCloseDetailSheet}
      />
    </div>
  );
}