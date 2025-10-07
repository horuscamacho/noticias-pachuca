import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  IconRobot,
  IconWorld,
  IconBrandFacebook,
  IconFileText,
  IconSend,
  IconListDetails,
  IconPlayerPlay,
  IconPlayerStop,
  IconRefresh,
  IconBrain
} from '@tabler/icons-react'

import { useSystemStatus, useDashboardStats, useStartSystem, useStopSystem } from '../hooks'
import { ResumenTab } from './tabs/ResumenTab'
import { SitiosWebTab } from './tabs/SitiosWebTab'
import { PerfilesEditorialesTab } from './tabs/PerfilesEditorialesTab'
import { FacebookTab } from './tabs/FacebookTab'
import { ContenidoTab } from './tabs/ContenidoTab'
import { PostsTab } from './tabs/PostsTab'
import { JobsLogsTab } from './tabs/JobsLogsTab'

export function GeneratorProDashboard() {
  const [activeTab, setActiveTab] = useState('resumen')

  const { data: systemStatus, isLoading: statusLoading } = useSystemStatus()
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats()
  const startSystem = useStartSystem()
  const stopSystem = useStopSystem()

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const tabs = [
    {
      id: 'resumen',
      label: 'Resumen',
      icon: IconRobot,
      component: ResumenTab,
    },
    {
      id: 'sitios-web',
      label: 'Sitios Web',
      icon: IconWorld,
      component: SitiosWebTab,
    },
    {
      id: 'perfiles',
      label: 'Perfiles Editoriales',
      icon: IconBrain,
      component: PerfilesEditorialesTab,
    },
    {
      id: 'facebook',
      label: 'Facebook',
      icon: IconBrandFacebook,
      component: FacebookTab,
    },
    {
      id: 'contenido',
      label: 'Contenido',
      icon: IconFileText,
      component: ContenidoTab,
    },
    {
      id: 'posts',
      label: 'Posts',
      icon: IconSend,
      component: PostsTab,
    },
    {
      id: 'jobs-logs',
      label: 'Jobs & Logs',
      icon: IconListDetails,
      component: JobsLogsTab,
    },
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header con status y controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <IconRobot className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Generator Pro</h1>
              <p className="text-muted-foreground">Sistema automatizado de noticias y publicación</p>
            </div>
          </div>

          {/* Status indicator */}
          {!statusLoading && systemStatus && (
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(systemStatus.overall)}`} />
              <Badge variant={systemStatus.overall === 'healthy' ? 'default' : 'secondary'}>
                {systemStatus.overall === 'healthy' ? 'Sistema Activo' :
                 systemStatus.overall === 'warning' ? 'Advertencias' : 'Errores'}
              </Badge>
            </div>
          )}
        </div>

        {/* System controls */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <IconRefresh className="h-4 w-4 mr-2" />
            Actualizar
          </Button>

          {systemStatus?.overall === 'healthy' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => stopSystem.mutate()}
              disabled={stopSystem.isPending}
            >
              <IconPlayerStop className="h-4 w-4 mr-2" />
              Detener Sistema
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => startSystem.mutate()}
              disabled={startSystem.isPending}
            >
              <IconPlayerPlay className="h-4 w-4 mr-2" />
              Iniciar Sistema
            </Button>
          )}
        </div>
      </div>

      {/* Quick stats cards */}
      {!statsLoading && dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sitios Activos</CardTitle>
              <IconWorld className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.websites.active}</div>
              <p className="text-xs text-muted-foreground">
                de {dashboardStats.websites.total} configurados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contenido Hoy</CardTitle>
              <IconFileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.content.generatedToday}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats.content.readyToPublish} listos para publicar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Posts Hoy</CardTitle>
              <IconSend className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.facebook.publishedToday}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats.facebook.scheduledPosts} programados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jobs Activos</CardTitle>
              <IconListDetails className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.jobs.processing}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats.jobs.failed} fallidos hoy
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-7 w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center space-x-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {tabs.map((tab) => {
          const Component = tab.component
          return (
            <TabsContent key={tab.id} value={tab.id} className="space-y-4">
              <Component />
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}