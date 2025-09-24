/**
 * 🔍 ExternalUrlsTab Component
 * Display and manage detected external URLs from Facebook posts
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ExternalLink,
  Settings,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Play,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  PlaySquare,
} from 'lucide-react';
import { toast } from 'sonner';

// Hooks
import {
  useExternalUrls,
  useUrlDetectionStats,
  useNoticiasConfigByDomain,
  useExtractFromUrl,
} from '../hooks';
import type { UrlDetectionFilters, ExternalUrl } from '../types/noticias.types';

export function ExternalUrlsTab() {
  const [filters, setFilters] = useState<UrlDetectionFilters>({});
  const [page, setPage] = useState(1);
  const [searchDomain, setSearchDomain] = useState('');
  const [isBulkExtracting, setIsBulkExtracting] = useState(false);

  // Fetch data
  const {
    data: urlsData,
    isLoading,
    error,
    refetch,
  } = useExternalUrls({
    page,
    limit: 20,
    ...filters,
  });

  // const { data: statsData } = useUrlDetectionStats();
  const statsData = null; // Temporarily disabled to fix undefined errors

  // Extraction mutation
  const extractMutation = useExtractFromUrl();

  const handleFilterChange = (key: keyof UrlDetectionFilters, value: string | boolean | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
    setPage(1); // Reset to first page when filtering
  };

  const handleSearch = () => {
    if (searchDomain.trim()) {
      handleFilterChange('pageId', searchDomain.trim());
    }
  };

  const clearFilters = () => {
    setFilters({});
    setSearchDomain('');
    setPage(1);
  };

  const handleRefresh = () => {
    refetch();
    toast.success('URLs actualizadas');
  };

  const handleExtractUrl = async (url: ExternalUrl) => {
    console.log('🚀 handleExtractUrl called with:', {
      url: url.url,
      domain: url.domain,
      hasConfig: url.hasConfig,
      configId: url.configId,
      facebookPostId: url.facebookPostId,
      pageId: url.pageId,
    });

    if (!url.configId) {
      console.error('❌ URL no tiene configId:', url);
      toast.error('URL no tiene configuración asignada');
      return;
    }

    try {
      console.log('📤 Sending extraction request...');
      const result = await extractMutation.mutateAsync({
        configId: url.configId,
        url: url.url,
        facebookPostId: url.facebookPostId,
        pageId: url.pageId,
      });

      console.log('✅ Extraction started:', result);
      toast.success(`Extracción iniciada - Job ID: ${result.jobId}`);
    } catch (error) {
      console.error('❌ Extraction error:', error);
      toast.error('Error al iniciar extracción');
    }
  };

  const handleBulkExtraction = async () => {
    const urls = Array.isArray(urlsData) ? urlsData : urlsData?.data || [];
    const pendingUrls = urls.filter(url =>
      url.hasConfig &&
      url.configId &&
      (!url.extractionStatus || url.extractionStatus === 'pending' || url.extractionStatus === 'failed')
    );

    if (pendingUrls.length === 0) {
      toast.info('No hay URLs configuradas pendientes de extracción');
      return;
    }

    setIsBulkExtracting(true);
    toast.info(`Iniciando extracción masiva de ${pendingUrls.length} URLs...`);

    let successCount = 0;
    let errorCount = 0;

    for (const url of pendingUrls) {
      try {
        await extractMutation.mutateAsync({
          configId: url.configId!,
          url: url.url,
          facebookPostId: url.facebookPostId,
          pageId: url.pageId,
        });
        successCount++;

        // Pequeña pausa entre requests para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ Error extracting ${url.url}:`, error);
        errorCount++;
      }
    }

    setIsBulkExtracting(false);
    toast.success(`Extracción masiva completada: ${successCount} exitosas, ${errorCount} errores`);
  };

  const handleViewExtracted = (url: ExternalUrl) => {
    // TODO: Abrir modal o navegar a vista de contenido extraído
    toast.info('Funcionalidad de visualización en desarrollo');
  };

  // Debug logging
  console.log('ExternalUrlsTab Debug:', {
    isLoading,
    error,
    urlsData,
    dataLength: urlsData?.data?.length,
    hasData: !!urlsData?.data,
    isArray: Array.isArray(urlsData),
    actualDataLength: Array.isArray(urlsData) ? urlsData.length : 'not array',
  });

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error al cargar las URLs externas</p>
        <Button variant="outline" onClick={handleRefresh} className="mt-2">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {statsData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total URLs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData.totalUrls}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Con Configuración</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statsData.urlsWithConfig}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sin Configuración</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {statsData.urlsWithoutConfig}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search by domain/pageId */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar página</label>
              <div className="flex space-x-2">
                <Input
                  placeholder="ID de página..."
                  value={searchDomain}
                  onChange={(e) => setSearchDomain(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button size="sm" onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Has config filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado configuración</label>
              <Select
                value={filters.hasConfig?.toString() || 'all'}
                onValueChange={(value) =>
                  handleFilterChange('hasConfig', value === 'all' ? undefined : value === 'true')
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="true">Con configuración</SelectItem>
                  <SelectItem value="false">Sin configuración</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date from */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha desde</label>
              <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            {/* Date to */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha hasta</label>
              <Input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={clearFilters}>
              Limpiar filtros
            </Button>
            <div className="flex space-x-2">
              <Button
                onClick={handleBulkExtraction}
                disabled={isBulkExtracting || extractMutation.isPending}
                variant="default"
              >
                {isBulkExtracting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Extrayendo...
                  </>
                ) : (
                  <>
                    <PlaySquare className="h-4 w-4 mr-2" />
                    Extraer Pendientes
                  </>
                )}
              </Button>
              <Button onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* URLs Table */}
      <Card>
        <CardHeader>
          <CardTitle>URLs Detectadas</CardTitle>
          <CardDescription>
            {(() => {
              if (Array.isArray(urlsData)) {
                return urlsData.length;
              }
              return urlsData?.pagination?.total || 0;
            })()} URLs encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Cargando URLs...</p>
            </div>
          ) : (() => {
            // Handle both formats: array directly or { data: array, pagination: {} }
            const urls = Array.isArray(urlsData) ? urlsData : urlsData?.data;
            const isEmpty = !urls || urls.length === 0;

            if (isEmpty) {
              return (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No se encontraron URLs (Debug: {JSON.stringify({ hasUrlsData: !!urlsData, isArray: Array.isArray(urlsData), urlsLength: urls?.length })})</p>
                </div>
              );
            }

            return (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>URL</TableHead>
                      <TableHead>Dominio</TableHead>
                      <TableHead>Página FB</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Detectada</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {urls.map((url) => (
                      <UrlRow
                        key={`${url.url}-${url.facebookPostId}`}
                        url={url}
                        onExtract={handleExtractUrl}
                        onViewExtracted={handleViewExtracted}
                      />
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {urlsData?.pagination && urlsData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {urlsData.pagination.page} de {urlsData.pagination.totalPages}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={!urlsData.pagination.hasPrev}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={!urlsData.pagination.hasNext}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                )}
              </>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}

// Individual URL row component
function UrlRow({
  url,
  onExtract,
  onViewExtracted,
}: {
  url: ExternalUrl;
  onExtract: (url: ExternalUrl) => void;
  onViewExtracted: (url: ExternalUrl) => void;
}) {
  // const { data: config } = useNoticiasConfigByDomain(url.domain, !!url.hasConfig);
  const config = null; // Temporarily disabled

  const getStatusInfo = () => {
    if (!url.hasConfig) {
      return {
        color: 'secondary' as const,
        text: 'Sin configurar',
        icon: Settings,
        bgColor: 'bg-gray-200/20',
        textColor: 'text-gray-600',
      };
    }

    switch (url.extractionStatus) {
      case 'extracted':
        return {
          color: 'default' as const,
          text: 'Extraído',
          icon: CheckCircle2,
          bgColor: 'bg-primary/15',
          textColor: 'text-primary',
        };
      case 'failed':
        return {
          color: 'destructive' as const,
          text: 'Falló',
          icon: XCircle,
          bgColor: 'bg-destructive/15',
          textColor: 'text-destructive',
        };
      case 'pending':
      default:
        return {
          color: 'outline' as const,
          text: 'Configurado',
          icon: Clock,
          bgColor: 'bg-gray-800/20',
          textColor: 'text-gray-700',
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const renderActionButton = () => {
    if (!url.hasConfig) {
      return (
        <Button variant="outline" size="sm" title="Configurar extracción">
          <Settings className="h-4 w-4 mr-1" />
          Configurar
        </Button>
      );
    }

    if (url.extractionStatus === 'extracted') {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewExtracted(url)}
          title="Ver contenido extraído"
        >
          <Eye className="h-4 w-4 mr-1" />
          Visualizar
        </Button>
      );
    }

    return (
      <Button
        size="sm"
        onClick={() => onExtract(url)}
        title="Extraer contenido"
        disabled={false}
      >
        <Play className="h-4 w-4 mr-1" />
        Extraer
      </Button>
    );
  };

  return (
    <TableRow className={statusInfo.bgColor}>
      <TableCell className="font-mono text-xs max-w-xs">
        <div className="truncate" title={url.url}>
          {url.url}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{url.domain}</Badge>
      </TableCell>
      <TableCell className="font-mono text-xs">
        {url.pageId || 'N/A'}
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <StatusIcon className="h-4 w-4" />
          <Badge variant={statusInfo.color}>{statusInfo.text}</Badge>
        </div>
      </TableCell>
      <TableCell className="text-xs">
        {format(new Date(url.detectedAt), 'dd/MM/yyyy HH:mm', { locale: es })}
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(url.url, '_blank')}
            title="Abrir URL en nueva pestaña"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          {url.postUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(url.postUrl, '_blank')}
              title="Ver post en Facebook"
            >
              📘
            </Button>
          )}
          {renderActionButton()}
        </div>
      </TableCell>
    </TableRow>
  );
}