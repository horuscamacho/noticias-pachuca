/**
 * 📰 NoticiasDashboard Component
 * Main dashboard for news extraction management with modern design
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  IconArticle,
  IconSettings,
  IconServer,
  IconClock,
  IconTrendingUp,
  IconAlertTriangle,
  IconRefresh,
  IconLink,
  IconEye,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconNews,
} from '@tabler/icons-react';
import { toast } from 'sonner';

// Components
import { ExternalUrlsTab } from './ExternalUrlsTab';
import { ConfigurationsTab } from './ConfigurationsTab';
import { ExtractedNoticiasTab } from './ExtractedNoticiasTab';
import { TestingTab } from './TestingTab';
import { JobsLogsTab } from './JobsLogsTab';

// Hooks
import {
  useExternalUrls,
  useNoticiasConfigs,
  useExtractedNoticias,
  useExtractionStats,
  useUrlDetectionStats,
} from '../hooks';
import type { NoticiasTab } from '../types/noticias.types';

export function NoticiasDashboard() {
  const [selectedTab, setSelectedTab] = useState<NoticiasTab>('urls');

  // 🎣 API Hooks - DISABLED STATS TEMPORARILY
  // const { data: urlsData, refetch: refetchUrls } = useExternalUrls({ page: 1, limit: 1 });
  const { data: configsData, refetch: refetchConfigs } = useNoticiasConfigs({ page: 1, limit: 1 });
  const { data: noticiasData, refetch: refetchNoticias } = useExtractedNoticias({ page: 1, limit: 1 });

  // Fake data to prevent crashes
  const urlsData = null;
  const refetchUrls = () => {};
  // const { data: stats, isLoading: isLoadingStats, refetch: refetchStats, error: statsError } = useExtractionStats();
  // const { data: urlStats, refetch: refetchUrlStats, error: urlStatsError } = useUrlDetectionStats();

  // Fake data to prevent crashes
  const stats = { performance: { successRate: 0, dailyExtractions: 0 }, processing: 0 };
  const urlStats = { totalUrls: 0, urlsWithConfig: 0, urlsWithoutConfig: 0 };
  const isLoadingStats = false;
  const refetchStats = () => {};
  const refetchUrlStats = () => {};
  const statsError = null;
  const urlStatsError = null;

  // 🔄 Loading and error states
  const isLoading = isLoadingStats;

  const handleRefresh = () => {
    refetchUrls();
    refetchConfigs();
    refetchNoticias();
    refetchStats();
    refetchUrlStats();
    toast.success('Datos actualizados');
  };

  // 📊 Calculate health metrics - Safe fallbacks for undefined stats
  const successRate = stats?.performance?.successRate || 0;
  const isHealthy = successRate >= 80;

  // Log errors for debugging
  if (statsError) {
    console.error('Stats error:', statsError);
  }
  if (urlStatsError) {
    console.error('URL stats error:', urlStatsError);
  }
  const hasIssues = successRate < 50;

  return (
    <div className="px-4 lg:px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <IconNews className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Noticias</h1>
            <p className="text-gray-600">Extracción automática de contenido desde URLs externas</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <IconSettings className="w-4 h-4 mr-2" />
            Configurar
          </Button>
          <Button
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <IconRefresh className="w-4 h-4 mr-2" />
            {isLoading ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </div>
      </div>

      {/* Health Alerts */}
      {hasIssues && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-3">
              <IconAlertTriangle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">
                  ⚠️ Tasa de éxito baja ({successRate.toFixed(1)}%)
                </p>
                <p className="text-xs text-red-700">
                  Revisa las configuraciones de extracción para mejorar el rendimiento
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading && !stats && (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-1" />
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </>
        )}

        {(stats || !isLoading) && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">URLs Detectadas</CardTitle>
                <IconLink className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{urlStats?.totalUrls || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {urlStats?.urlsWithConfig || 0} configuradas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Configuraciones Activas</CardTitle>
                <IconSettings className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{configsData?.pagination?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Dominios configurados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Extracciones Hoy</CardTitle>
                <IconClock className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.performance?.dailyExtractions || 0}</div>
                <div className="flex items-center space-x-2 mt-1">
                  <Progress value={successRate} className="flex-1" />
                  <span className="text-xs text-muted-foreground">
                    {successRate.toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estado del Sistema</CardTitle>
                <IconTrendingUp className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold truncate">
                  {isHealthy ? 'Saludable' : hasIssues ? 'Requiere Atención' : 'Normal'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.processing || 0} jobs activos
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="urls">URLs</TabsTrigger>
          <TabsTrigger value="configs">Configuraciones</TabsTrigger>
          <TabsTrigger value="noticias">Noticias</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="jobs">Jobs & Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
                <CardDescription>
                  Operaciones comunes del sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <IconPlus className="w-4 h-4 mr-2" />
                  Nueva Configuración de Dominio
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <IconRefresh className="w-4 h-4 mr-2" />
                  Detectar Nuevas URLs
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <IconPlayerPlay className="w-4 h-4 mr-2" />
                  Procesar Cola de Extracción
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <IconEye className="w-4 h-4 mr-2" />
                  Ver Métricas Detalladas
                </Button>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>Estado del Sistema</CardTitle>
                <CardDescription>
                  Monitoreo de extracción en tiempo real
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Configuraciones Activas</span>
                  <Badge variant="secondary" className="text-green-700 bg-green-100">
                    {configsData?.pagination?.total || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">URLs Monitoreadas</span>
                  <Badge variant="secondary">
                    {urlStats?.urlsWithConfig || 0} configuradas
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tasa de Éxito Global</span>
                  <span className="text-sm text-muted-foreground">
                    {successRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Jobs en Cola</span>
                  <Badge variant={stats?.processing ? 'default' : 'secondary'}>
                    {stats?.processing || 0}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="urls">
          <ExternalUrlsTab />
        </TabsContent>

        <TabsContent value="configs">
          <ConfigurationsTab />
        </TabsContent>

        <TabsContent value="noticias">
          <ExtractedNoticiasTab />
        </TabsContent>

        <TabsContent value="testing">
          <TestingTab />
        </TabsContent>

        <TabsContent value="jobs">
          <JobsLogsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}