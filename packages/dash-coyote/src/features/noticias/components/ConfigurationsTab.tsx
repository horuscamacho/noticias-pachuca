/**
 * ⚙️ ConfigurationsTab Component
 * CRUD interface for CSS selector configurations
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
  IconSettings,
  IconPlus,
  IconEdit,
  IconTrash,
  IconTestPipe,
  IconPlayerPlay,
  IconPlayerPause,
  IconRefresh,
  IconFilter,
  IconChevronLeft,
  IconChevronRight,
  IconExternalLink,
  IconAlertTriangle,
  IconCheck,
} from '@tabler/icons-react';
import { toast } from 'sonner';

// Hooks
import {
  useNoticiasConfigs,
  useUpdateNoticiasConfig,
  useToggleNoticiasConfig,
  useDeleteNoticiasConfig,
  useTestExtraction,
  useSyncUrlsWithConfigs,
} from '../hooks';
import type { NoticiasConfig } from '../types/noticias.types';

// Components
import { CreateConfigSheet } from './CreateConfigSheet';

export function ConfigurationsTab() {
  const [filters, setFilters] = useState<{
    isActive?: boolean;
    searchTerm?: string;
  }>({});
  const [page, setPage] = useState(1);
  const [selectedConfig, setSelectedConfig] = useState<NoticiasConfig | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<NoticiasConfig | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  // Fetch data
  const {
    data: configsData,
    isLoading,
    error,
    refetch,
  } = useNoticiasConfigs({
    page,
    limit: 20,
    isActive: filters.isActive,
  });

  // Mutations
  const updateConfigMutation = useUpdateNoticiasConfig();
  const toggleConfigMutation = useToggleNoticiasConfig();
  const deleteConfigMutation = useDeleteNoticiasConfig();
  const testExtractionMutation = useTestExtraction();
  const syncUrlsMutation = useSyncUrlsWithConfigs();

  const handleFilterChange = (key: string, value: string | boolean | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
    setPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({});
    setPage(1);
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Configuraciones actualizadas');
  };

  const handleToggleConfig = async (config: NoticiasConfig) => {
    try {
      await toggleConfigMutation.mutateAsync(config._id);
      toast.success(
        config.isActive
          ? `Configuración "${config.name}" desactivada`
          : `Configuración "${config.name}" activada`
      );
    } catch (error) {
      toast.error('Error al cambiar estado de la configuración');
    }
  };

  const handleDeleteConfig = async (config: NoticiasConfig) => {
    if (!confirm(`¿Eliminar configuración "${config.name}" para ${config.domain}?`)) {
      return;
    }

    try {
      await deleteConfigMutation.mutateAsync(config._id);
      toast.success(`Configuración "${config.name}" eliminada`);
    } catch (error) {
      toast.error('Error al eliminar configuración');
    }
  };

  const handleTestExtraction = async (config: NoticiasConfig) => {
    // TODO: Implement test extraction modal
    setSelectedConfig(config);
    setIsTestModalOpen(true);
  };

  const handleSyncUrls = async () => {
    try {
      const result = await syncUrlsMutation.mutateAsync();
      toast.success(`Sincronización exitosa: ${result.updated} URLs actualizadas`);
    } catch (error) {
      toast.error('Error al sincronizar URLs');
    }
  };

  const handleQuickTest = async () => {
    try {
      const result = await testExtractionMutation.mutateAsync({
        url: 'https://pachucabrilla.com/cine-gratuito-semana-entres-recintos-culturales-hidalgo/',
        selectors: {
          title: 'h1.entry-title',
          content: 'div.entry-content',
          images: ['figure.post-featured-image', '.page-single-img-wrap'],
          publishedAt: '',
          author: '',
          categories: [],
          excerpt: '',
          tags: [],
        },
        settings: {
          useJavaScript: true,
          waitTime: 1000,
          timeout: 15000,
        }
      });

      console.log('🧪 Test result:', result);

      if (result.success) {
        toast.success(`Test exitoso - Título: ${result.extractedData?.title?.substring(0, 50)}...`);
      } else {
        toast.error(`Test falló: ${result.error?.message}`);
      }
    } catch (error) {
      console.error('Test error:', error);
      toast.error('Error en test de extracción');
    }
  };

  const handleEditConfig = (config: NoticiasConfig) => {
    setEditingConfig(config);
    setIsEditModalOpen(true);
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <IconAlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
        <p className="text-destructive">Error al cargar las configuraciones</p>
        <Button variant="outline" onClick={handleRefresh} className="mt-2">
          <IconRefresh className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  // Debug logging
  console.log('ConfigurationsTab Debug:', {
    isLoading,
    error,
    configsData,
    dataLength: configsData?.data?.length,
    hasData: !!configsData?.data,
    page,
    filters,
  });

  const configs = configsData?.data || [];
  const pagination = configsData?.pagination;

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Configuraciones de Extracción</h2>
          <p className="text-sm text-muted-foreground">
            Gestiona CSS selectors para diferentes dominios de noticias
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleQuickTest}
            disabled={testExtractionMutation.isPending}
          >
            <IconTestPipe className="h-4 w-4 mr-2" />
            {testExtractionMutation.isPending ? 'Testando...' : 'Test Selectores'}
          </Button>
          <Button
            variant="outline"
            onClick={handleSyncUrls}
            disabled={syncUrlsMutation.isPending}
          >
            <IconRefresh className="h-4 w-4 mr-2" />
            {syncUrlsMutation.isPending ? 'Sincronizando...' : 'Sincronizar URLs'}
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <IconPlus className="h-4 w-4 mr-2" />
            Nueva Configuración
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <IconFilter className="h-4 w-4" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <Input
                placeholder="Dominio o nombre..."
                value={filters.searchTerm || ''}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              />
            </div>

            {/* Status filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select
                value={filters.isActive?.toString() || 'all'}
                onValueChange={(value) =>
                  handleFilterChange('isActive', value === 'all' ? undefined : value === 'true')
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="true">Activas</SelectItem>
                  <SelectItem value="false">Inactivas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex items-end space-x-2">
              <Button variant="outline" onClick={clearFilters}>
                Limpiar
              </Button>
              <Button onClick={handleRefresh}>
                <IconRefresh className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Configuraciones</CardTitle>
          <CardDescription>
            {pagination?.total || 0} configuraciones encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <IconRefresh className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Cargando configuraciones...</p>
            </div>
          ) : configs.length === 0 ? (
            <div className="text-center py-8">
              <IconSettings className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No hay configuraciones</p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <IconPlus className="h-4 w-4 mr-2" />
                Crear primera configuración
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dominio / Nombre</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Selectores</TableHead>
                    <TableHead>Estadísticas</TableHead>
                    <TableHead>Última Actualización</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.map((config) => (
                    <ConfigurationRow
                      key={config._id}
                      config={config}
                      onToggle={handleToggleConfig}
                      onEdit={handleEditConfig}
                      onDelete={handleDeleteConfig}
                      onTest={handleTestExtraction}
                      isLoading={
                        toggleConfigMutation.isPending ||
                        deleteConfigMutation.isPending ||
                        updateConfigMutation.isPending
                      }
                    />
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {pagination.page} de {pagination.totalPages} ({pagination.total} total)
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={!pagination.hasPrev}
                    >
                      <IconChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={!pagination.hasNext}
                    >
                      <IconChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Config Sheet */}
      <CreateConfigSheet
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Config Sheet */}
      <CreateConfigSheet
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingConfig(null);
        }}
        editingConfig={editingConfig}
        isEditing={true}
      />

      {/* TODO: TestExtractionModal */}
      {isTestModalOpen && selectedConfig && (
        <div>TODO: TestExtractionModal</div>
      )}
    </div>
  );
}

// Individual configuration row component
function ConfigurationRow({
  config,
  onToggle,
  onEdit,
  onDelete,
  onTest,
  isLoading,
}: {
  config: NoticiasConfig;
  onToggle: (config: NoticiasConfig) => void;
  onEdit: (config: NoticiasConfig) => void;
  onDelete: (config: NoticiasConfig) => void;
  onTest: (config: NoticiasConfig) => void;
  isLoading: boolean;
}) {
  const selectorCount = Object.keys(config.selectors || {}).length;
  const stats = config.statistics;

  return (
    <TableRow>
      <TableCell>
        <div className="space-y-1">
          <div className="font-medium">{config.name}</div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="font-mono text-xs">
              {config.domain}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`https://${config.domain}`, '_blank')}
            >
              <IconExternalLink className="h-3 w-3" />
            </Button>
          </div>
          {config.notes && (
            <p className="text-xs text-muted-foreground truncate max-w-xs">
              {config.notes}
            </p>
          )}
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center space-x-2">
          <Badge variant={config.isActive ? 'default' : 'secondary'}>
            {config.isActive ? (
              <><IconCheck className="h-3 w-3 mr-1" /> Activa</>
            ) : (
              <><IconPlayerPause className="h-3 w-3 mr-1" /> Inactiva</>
            )}
          </Badge>
        </div>
      </TableCell>

      <TableCell>
        <div className="space-y-1">
          <div className="text-sm">
            <span className="font-medium">{selectorCount}</span> selectores
          </div>
          <div className="flex flex-wrap gap-1">
            {config.selectors?.title && (
              <Badge variant="outline" className="text-xs">title</Badge>
            )}
            {config.selectors?.content && (
              <Badge variant="outline" className="text-xs">content</Badge>
            )}
            {config.selectors?.images && (
              <Badge variant="outline" className="text-xs">images</Badge>
            )}
            {config.selectors?.publishedAt && (
              <Badge variant="outline" className="text-xs">date</Badge>
            )}
          </div>
        </div>
      </TableCell>

      <TableCell>
        {stats ? (
          <div className="space-y-1">
            <div className="text-sm">
              <span className="font-medium text-green-600">{stats.successfulExtractions}</span> /
              <span className="text-muted-foreground"> {stats.totalExtractions} total</span>
            </div>
            {stats.totalExtractions > 0 && (
              <div className="text-xs text-muted-foreground">
                {Math.round((stats.successfulExtractions / stats.totalExtractions) * 100)}% éxito
              </div>
            )}
            {stats.lastExtractionAt && (
              <div className="text-xs text-muted-foreground">
                Última: {format(new Date(stats.lastExtractionAt), 'dd/MM/yyyy', { locale: es })}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Sin estadísticas</div>
        )}
      </TableCell>

      <TableCell className="text-xs text-muted-foreground">
        {format(new Date(config.updatedAt), 'dd/MM/yyyy HH:mm', { locale: es })}
      </TableCell>

      <TableCell>
        <div className="flex items-center space-x-1">
          {/* Toggle Active */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggle(config)}
            disabled={isLoading}
            title={config.isActive ? 'Desactivar' : 'Activar'}
          >
            {config.isActive ? (
              <IconPlayerPause className="h-4 w-4 text-yellow-600" />
            ) : (
              <IconPlayerPlay className="h-4 w-4 text-green-600" />
            )}
          </Button>

          {/* Test Extraction */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTest(config)}
            disabled={isLoading}
            title="Probar extracción"
          >
            <IconTestPipe className="h-4 w-4 text-blue-600" />
          </Button>

          {/* Edit */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(config)}
            disabled={isLoading}
            title="Editar configuración"
          >
            <IconEdit className="h-4 w-4" />
          </Button>

          {/* Delete */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(config)}
            disabled={isLoading}
            title="Eliminar configuración"
          >
            <IconTrash className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}