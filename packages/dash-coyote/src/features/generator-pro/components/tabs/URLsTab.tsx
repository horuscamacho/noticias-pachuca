import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  IconWorld,
  IconClock,
  IconCheck,
  IconX,
  IconRefresh,
  IconSearch,
  IconFilter
} from '@tabler/icons-react';

import {
  useExtractedUrls,
  useExtractUrlsAndSave,
  useWebsiteConfigs
} from '../../hooks';

/**
 * 🔗 URLs Tab - Lista URLs extraídas con opción de extracción manual
 * Segunda pestaña del 6-tab workflow: Sitios Web → URLs → Contenido → Generados → Facebook → Posts
 */
export function URLsTab() {
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchUrl, setSearchUrl] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  // Data fetching
  const { data: websites, isLoading: isWebsitesLoading } = useWebsiteConfigs();
  const { data: urlsData, isLoading: isUrlsLoading, refetch: refetchUrls } = useExtractedUrls({
    websiteId: selectedWebsiteId,
    status: selectedStatus,
    page: currentPage,
    limit: 50
  });

  // Actions
  const extractUrlsAndSave = useExtractUrlsAndSave();

  // Handlers
  const handleExtractUrls = async (websiteId: string, websiteName: string) => {
    try {
      await extractUrlsAndSave.mutateAsync(websiteId);
      refetchUrls();
      console.log(`✅ URLs extraídas exitosamente de ${websiteName}`);
    } catch (error) {
      console.error('❌ Error extrayendo URLs:', error);
    }
  };

  const handleClearFilters = () => {
    setSelectedWebsiteId('');
    setSelectedStatus('');
    setSearchUrl('');
    setCurrentPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'extracted': return 'default';
      case 'processing': return 'outline';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'extracted': return 'Extraído';
      case 'processing': return 'Procesando';
      case 'failed': return 'Falló';
      default: return 'Desconocido';
    }
  };

  if (isWebsitesLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-pulse rounded-full h-8 w-8 bg-blue-200 mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Cargando configuraciones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <IconWorld className="h-6 w-6" />
            URLs Extraídas
          </h2>
          <p className="text-muted-foreground">
            URLs extraídas de sitios web configurados
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            Total: {urlsData?.total || 0}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchUrls()}
            disabled={isUrlsLoading}
          >
            <IconRefresh className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <IconWorld className="h-5 w-5" />
            Extraer URLs Manualmente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {websites?.map((website) => (
              <div key={website.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{website.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {website.baseUrl}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <IconClock className="h-3 w-3" />
                    {website.extractionFrequency}m
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleExtractUrls(website.id, website.name)}
                  disabled={extractUrlsAndSave.isPending}
                  className="ml-2"
                >
                  {extractUrlsAndSave.isPending ? (
                    <div className="animate-pulse rounded-full h-4 w-4 bg-white/50"></div>
                  ) : (
                    <IconWorld className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <IconFilter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Sitio Web</label>
              <Select value={selectedWebsiteId} onValueChange={setSelectedWebsiteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los sitios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los sitios</SelectItem>
                  {websites?.map((website) => (
                    <SelectItem key={website.id} value={website.id}>
                      {website.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Estado</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="extracted">Extraído</SelectItem>
                  <SelectItem value="processing">Procesando</SelectItem>
                  <SelectItem value="failed">Falló</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Buscar URL</label>
              <div className="relative">
                <IconSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por URL..."
                  value={searchUrl}
                  onChange={(e) => setSearchUrl(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="w-full"
              >
                <IconX className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* URLs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            URLs Listadas
            {urlsData && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (Página {urlsData.page} de {urlsData.totalPages})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isUrlsLoading ? (
            <div className="text-center py-8">
              <div className="animate-pulse rounded-full h-8 w-8 bg-blue-200 mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Cargando URLs...</p>
            </div>
          ) : urlsData?.urls.length ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Sitio Web</TableHead>
                    <TableHead>Extraído</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {urlsData.urls
                    .filter(url => searchUrl ? url.url.toLowerCase().includes(searchUrl.toLowerCase()) : true)
                    .map((url) => {
                      const website = websites?.find(w => w.id === url.websiteConfigId);
                      return (
                        <TableRow key={url.id}>
                          <TableCell className="max-w-md">
                            <a
                              href={url.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm truncate block"
                              title={url.url}
                            >
                              {url.url}
                            </a>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <span className="text-sm truncate block" title={url.title}>
                              {url.title || 'Sin título'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(url.extractionStatus)}>
                              {getStatusText(url.extractionStatus)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {website?.name || 'Desconocido'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {url.extractedAt
                                ? new Date(url.extractedAt).toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : '-'
                              }
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {urlsData.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {urlsData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(urlsData.totalPages, prev + 1))}
                    disabled={currentPage === urlsData.totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <IconWorld className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No hay URLs extraídas aún
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Extrae URLs de tus sitios web configurados usando los botones de arriba
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}