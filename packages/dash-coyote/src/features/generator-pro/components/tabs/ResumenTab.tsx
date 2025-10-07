import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  IconTrendingUp,
  IconClock,
  IconCheck,
  IconAlertCircle,
  IconActivity,
  IconTargetArrow
} from '@tabler/icons-react'

import { useSystemStatus, useDashboardStats } from '../../hooks'

export function ResumenTab() {
  const { data: systemStatus, isLoading: statusLoading } = useSystemStatus()
  const { data: stats, isLoading: statsLoading } = useDashboardStats()

  if (statusLoading || statsLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando información del sistema...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado General</CardTitle>
            <IconActivity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                systemStatus?.overall === 'healthy' ? 'bg-green-500' :
                systemStatus?.overall === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="text-2xl font-bold capitalize">{systemStatus?.overall || 'unknown'}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Última actualización: {systemStatus?.lastUpdate ? new Date(systemStatus.lastUpdate).toLocaleTimeString() : 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Componentes Activos</CardTitle>
            <IconCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {systemStatus?.components && Object.entries(systemStatus.components).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <Badge variant={value === 'active' || value === 'connected' || value === 'running' ? 'default' : 'secondary'}>
                    {String(value)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Métricas de Hoy</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Extracciones</span>
                <span className="font-semibold">{stats?.websites.extractionsToday || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Contenido generado</span>
                <span className="font-semibold">{stats?.content.generatedToday || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Posts publicados</span>
                <span className="font-semibold">{stats?.facebook.publishedToday || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Processing Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <IconTargetArrow className="h-5 w-5" />
            <span>Pipeline de Procesamiento</span>
          </CardTitle>
          <CardDescription>
            Estado actual del flujo de trabajo automatizado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Extraction Stage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">1. Extracción</h4>
                <Badge variant={systemStatus?.components?.extraction === 'active' ? 'default' : 'secondary'}>
                  {systemStatus?.components?.extraction || 'idle'}
                </Badge>
              </div>
              <Progress value={stats?.websites.active ? (stats.websites.extractionsToday / stats.websites.active) * 100 : 0} />
              <p className="text-xs text-muted-foreground">
                {stats?.websites.extractionsToday || 0} extracciones completadas
              </p>
            </div>

            {/* Generation Stage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">2. Generación</h4>
                <Badge variant={systemStatus?.components?.generation === 'active' ? 'default' : 'secondary'}>
                  {systemStatus?.components?.generation || 'idle'}
                </Badge>
              </div>
              <Progress value={stats?.content.extractedToday ? (stats.content.generatedToday / stats.content.extractedToday) * 100 : 0} />
              <p className="text-xs text-muted-foreground">
                {stats?.content.generatedToday || 0} contenidos generados
              </p>
            </div>

            {/* Publishing Stage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">3. Publicación</h4>
                <Badge variant={systemStatus?.components?.publishing === 'active' ? 'default' : 'secondary'}>
                  {systemStatus?.components?.publishing || 'idle'}
                </Badge>
              </div>
              <Progress value={stats?.content.readyToPublish ? (stats.facebook.publishedToday / stats.content.readyToPublish) * 100 : 0} />
              <p className="text-xs text-muted-foreground">
                {stats?.facebook.publishedToday || 0} posts publicados
              </p>
            </div>

            {/* Performance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">4. Performance</h4>
                <Badge variant="outline">
                  {stats?.facebook.avgEngagementRate ? `${stats.facebook.avgEngagementRate}%` : 'N/A'}
                </Badge>
              </div>
              <Progress value={stats?.facebook.avgEngagementRate || 0} />
              <p className="text-xs text-muted-foreground">
                Engagement promedio
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cola Extracción</CardTitle>
            <IconClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStatus?.metrics?.queueHealth?.extraction || 0}</div>
            <p className="text-xs text-muted-foreground">trabajos pendientes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cola Generación</CardTitle>
            <IconClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStatus?.metrics?.queueHealth?.generation || 0}</div>
            <p className="text-xs text-muted-foreground">trabajos pendientes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cola Publicación</CardTitle>
            <IconClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStatus?.metrics?.queueHealth?.publishing || 0}</div>
            <p className="text-xs text-muted-foreground">trabajos pendientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Issues */}
      {(systemStatus?.overall === 'warning' || systemStatus?.overall === 'error') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-600">
              <IconAlertCircle className="h-5 w-5" />
              <span>Alertas del Sistema</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Aquí se mostrarían las alertas específicas */}
              <div className="flex items-center space-x-2 p-3 bg-orange-50 rounded-lg">
                <IconAlertCircle className="h-4 w-4 text-orange-500" />
                <span className="text-sm">Revisar configuraciones de sistema para óptimo rendimiento</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}