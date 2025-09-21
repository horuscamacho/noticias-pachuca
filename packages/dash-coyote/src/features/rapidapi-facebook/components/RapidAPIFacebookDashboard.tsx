// 📱 RapidAPI Facebook Dashboard - Panel principal del módulo RapidAPI
import { useState } from 'react'
import { useRapidAPIStats } from '../hooks/useRapidAPIStats'
import { useRapidAPIConfigs } from '../hooks/useRapidAPIConfigs'
import type { RapidAPIConfig, RapidAPIPage } from '../types/rapidapi-facebook.types'
import { useRapidAPIPages } from '../hooks/useRapidAPIPages'
import { PageDetailsModal } from './PageDetailsModal'
import { ExtractionModal } from './ExtractionModal'
import { PostsTable } from './PostsTable'
import { AllPostsTableProper } from './AllPostsTableProper'
import {
  IconApi,
  IconUsers,
  IconServer,
  IconClock,
  IconTrendingUp,
  IconAlertTriangle,
  IconRefresh,
  IconSettings,
  IconPlus,
  IconEye,
  IconPlayerPause,
  IconPlayerPlay,
  IconTrash,
  IconTestPipe,
  IconShield,
} from '@tabler/icons-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Button,
} from '@/components/ui/button'
import {
  Badge,
} from '@/components/ui/badge'
import {
  Progress,
} from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { CreateRapidAPIConfigSheet } from './CreateRapidAPIConfigSheet'
import { EditRapidAPIConfigSheet } from './EditRapidAPIConfigSheet'
import { CreateRapidAPIPageSheet } from './CreateRapidAPIPageSheet'

export function RapidAPIFacebookDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview')
  const [editingConfig, setEditingConfig] = useState<RapidAPIConfig | null>(null)

  // 🎣 API Hooks
  const { stats, quotas, isLoading: isLoadingStats, error: statsError, refetch: refetchStats } = useRapidAPIStats()
  const {
    configs,
    isLoading: isLoadingConfigs,
    error: configsError,
    activateConfig,
    testConnection,
    deleteConfig,
    refetch: refetchConfigs
  } = useRapidAPIConfigs()
  const {
    pages,
    extractPosts,
    updateExtractionConfig,
    deletePage,
    triggerExtraction,
    refetch: refetchPages,
    isLoading: isLoadingPages,
    error: pagesError,
  } = useRapidAPIPages()

  // 🔄 Loading and error states
  const isLoading = isLoadingStats || isLoadingConfigs
  const hasError = statsError || configsError || pagesError

  // 🎯 Individual action loading states
  const [actionLoading, setActionLoading] = useState<{[key: string]: string}>({})

  // 📱 Modal state for page details
  const [selectedPage, setSelectedPage] = useState<RapidAPIPage | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 📄 Posts view state
  const [selectedPageForPosts, setSelectedPageForPosts] = useState<RapidAPIPage | null>(null)
  const [showPostsView, setShowPostsView] = useState(false)

  // 🔄 Handler for extraction with date range
  const handleExtractionWithDates = async (pageId: string, startDate?: Date, endDate?: Date) => {
    await handleActionWithLoading(
      pageId,
      'extract',
      () => triggerExtraction(pageId, startDate, endDate),
      `Extracción iniciada para página ${pages.find(p => (p.id || p._id) === pageId)?.pageDetails?.name || 'desconocida'}`
    )
  }

  const handleViewDetails = (page: RapidAPIPage) => {
    setSelectedPage(page)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedPage(null)
  }

  const handleActionWithLoading = async (
    pageId: string,
    action: string,
    asyncAction: () => Promise<any>,
    successMessage?: string
  ) => {
    try {
      setActionLoading(prev => ({ ...prev, [pageId]: action }))
      await asyncAction()
      if (successMessage) {
        // TODO: Implementar toast/notification system
        console.log(successMessage)
      }
    } catch (error) {
      console.error(`Error en ${action}:`, error)
      // TODO: Implementar error notification
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev }
        delete newState[pageId]
        return newState
      })
    }
  }

  // 📊 Calculate overall quota status
  const overallQuotaPercentage = quotas.length > 0
    ? quotas.reduce((sum, quota) => sum + quota.percentage, 0) / quotas.length
    : 0

  const criticalQuotas = quotas.filter(q => q.status === 'critical').length
  const warningQuotas = quotas.filter(q => q.status === 'warning').length

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <div className="w-2 h-2 bg-green-500 rounded-full" />
      case 'paused':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />
      case 'error':
        return <div className="w-2 h-2 bg-red-500 rounded-full" />
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="secondary" className="text-green-700 bg-green-100">Activo</Badge>
      case 'paused':
        return <Badge variant="secondary" className="text-yellow-700 bg-yellow-100">Pausado</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="outline">Pendiente</Badge>
    }
  }

  const getConfigStatusBadge = (isActive: boolean, usage?: { requestsToday: number }, limits?: { requestsPerDay: number }) => {
    if (!isActive) {
      return <Badge variant="outline">Inactivo</Badge>
    }

    const usagePercentage = usage && limits ? (usage.requestsToday / limits.requestsPerDay) * 100 : 0

    if (usagePercentage >= 90) {
      return <Badge variant="destructive">Crítico</Badge>
    } else if (usagePercentage >= 75) {
      return <Badge variant="secondary" className="text-yellow-700 bg-yellow-100">Advertencia</Badge>
    } else {
      return <Badge variant="secondary" className="text-green-700 bg-green-100">Activo</Badge>
    }
  }

  // 🚨 Error Display
  if (hasError) {
    return (
      <div className="px-4 lg:px-6 space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-3">
              <IconAlertTriangle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">
                  Error al cargar los datos de RapidAPI Facebook
                </p>
                <p className="text-xs text-red-700">
                  {statsError?.message || configsError?.message || pagesError?.message || 'Error desconocido'}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  refetchStats()
                  refetchConfigs()
                  refetchPages()
                }}
              >
                <IconRefresh className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="px-4 lg:px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <IconApi className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold">RapidAPI Facebook Scraper</h1>
            <p className="text-gray-600">Gestión de APIs de terceros para extracción de Facebook</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <IconSettings className="w-4 h-4 mr-2" />
            Configurar
          </Button>
          <Button
            size="sm"
            disabled={overallQuotaPercentage >= 100 || isLoading}
            onClick={() => {
              refetchStats()
              refetchConfigs()
              refetchPages()
            }}
          >
            <IconRefresh className="w-4 h-4 mr-2" />
            {isLoading ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </div>
      </div>

      {/* Quota Alerts */}
      {criticalQuotas > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-3">
              <IconAlertTriangle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">
                  ⚠️ {criticalQuotas} configuración{criticalQuotas > 1 ? 'es' : ''} con cuota crítica (&gt;90%)
                </p>
                <p className="text-xs text-red-700">
                  Revisa el uso de las APIs para evitar interrupciones del servicio
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {warningQuotas > 0 && criticalQuotas === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-3">
              <IconAlertTriangle className="w-5 h-5 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  ⚠️ {warningQuotas} configuración{warningQuotas > 1 ? 'es' : ''} próxima{warningQuotas > 1 ? 's' : ''} al límite (&gt;75%)
                </p>
                <p className="text-xs text-yellow-700">
                  Considera ajustar la frecuencia de extracción o activar configuraciones adicionales
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
                <CardTitle className="text-sm font-medium">Configuraciones Activas</CardTitle>
                <IconServer className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeConfigs || 0}</div>
                <p className="text-xs text-muted-foreground">
                  de {configs.length} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Páginas Monitoreadas</CardTitle>
                <IconUsers className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.pagesMonitored || pages.length}</div>
                <p className="text-xs text-muted-foreground">
                  +{pages.filter(p => p.status === 'active').length} activas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Requests Hoy</CardTitle>
                <IconClock className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.requestsToday || 0}</div>
                <div className="flex items-center space-x-2 mt-1">
                  <Progress value={overallQuotaPercentage} className="flex-1" />
                  <span className="text-xs text-muted-foreground">
                    {Math.round(overallQuotaPercentage)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Proveedor Principal</CardTitle>
                <IconTrendingUp className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold truncate">{stats?.topPerformingConfig || 'N/A'}</div>
                <p className="text-xs text-muted-foreground">
                  Mayor uso actual
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
          <TabsTrigger value="configs">Configuraciones</TabsTrigger>
          <TabsTrigger value="pages">Páginas</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="quotas">Cuotas</TabsTrigger>
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
                <CreateRapidAPIConfigSheet>
                  <Button className="w-full justify-start" variant="outline">
                    <IconPlus className="w-4 h-4 mr-2" />
                    Agregar Nueva Configuración API
                  </Button>
                </CreateRapidAPIConfigSheet>
                <CreateRapidAPIPageSheet>
                  <Button className="w-full justify-start" variant="outline">
                    <IconPlus className="w-4 h-4 mr-2" />
                    Agregar Página a Monitorear
                  </Button>
                </CreateRapidAPIPageSheet>
                <Button className="w-full justify-start" variant="outline">
                  <IconRefresh className="w-4 h-4 mr-2" />
                  Extraer Todas las Páginas
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
                  Monitoreo de APIs en tiempo real
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">APIs Activas</span>
                  <Badge variant="secondary" className="text-green-700 bg-green-100">
                    {stats?.activeConfigs || 0} / {configs.length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Páginas en Extracción</span>
                  <Badge variant="secondary">
                    {pages.filter(p => p.status === 'active').length} activas
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Uso Global de Cuota</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(overallQuotaPercentage)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="configs" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Configuraciones de API</h3>
            <CreateRapidAPIConfigSheet>
              <Button size="sm">
                <IconPlus className="w-4 h-4 mr-2" />
                Agregar Configuración
              </Button>
            </CreateRapidAPIConfigSheet>
          </div>

          <Card>
            {isLoadingConfigs ? (
              <div className="p-6">
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="h-4 w-4 bg-gray-200 rounded-full animate-pulse" />
                      <div className="flex-1 space-y-1">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
                      </div>
                      <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                      <div className="flex space-x-1">
                        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Configuración</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Uso Hoy</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.map((config) => {
                    const configQuota = quotas.find(q => q.configId === config.id)
                    return (
                      <TableRow key={config.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{config.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Límite: {config.quotaLimits.requestsPerDay}/día
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {config.host}
                          </code>
                        </TableCell>
                        <TableCell>
                          {getConfigStatusBadge(config.isActive, config.currentUsage, config.quotaLimits)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              {config.currentUsage?.requestsToday || 0} / {config.quotaLimits.requestsPerDay}
                            </div>
                            {configQuota && (
                              <Progress value={configQuota.percentage} className="w-16" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => testConnection(config.id)}
                              disabled={isLoading}
                            >
                              <IconTestPipe className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-blue-600"
                              onClick={() => setEditingConfig(config)}
                              disabled={isLoading}
                            >
                              <IconSettings className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className={config.isActive ? "text-yellow-600" : "text-green-600"}
                              onClick={() => activateConfig(config.id)}
                              disabled={isLoading}
                            >
                              {config.isActive ? <IconPlayerPause className="w-4 h-4" /> : <IconPlayerPlay className="w-4 h-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600"
                              onClick={() => {
                                if (confirm(`¿Estás seguro de eliminar la configuración "${config.name}"?`)) {
                                  deleteConfig(config.id)
                                }
                              }}
                              disabled={isLoading}
                            >
                              <IconTrash className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Páginas Monitoreadas</h3>
            <CreateRapidAPIPageSheet>
              <Button size="sm">
                <IconPlus className="w-4 h-4 mr-2" />
                Agregar Página
              </Button>
            </CreateRapidAPIPageSheet>
          </div>

          <Card>
            {isLoadingPages ? (
              <div className="p-6">
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="h-4 w-4 bg-gray-200 rounded-full animate-pulse" />
                      <div className="flex-1 space-y-1">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
                      </div>
                      <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                      <div className="flex space-x-1">
                        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Página</TableHead>
                    <TableHead>Configuración</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Métricas</TableHead>
                    <TableHead>Última Extracción</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map((page) => (
                    <TableRow key={page.id || page._id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {/* Avatar de la página */}
                          <div className="flex-shrink-0">
                            {page.pageDetails?.profilePicture ? (
                              <img
                                src={page.pageDetails.profilePicture}
                                alt={page.pageDetails.name || page.pageName}
                                className="w-10 h-10 rounded-full object-cover bg-gray-100"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (nextSibling) {
                                    nextSibling.style.display = 'flex';
                                  }
                                }}
                              />
                            ) : null}
                            <div
                              className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm"
                              style={{ display: page.pageDetails?.profilePicture ? 'none' : 'flex' }}
                            >
                              {(page.pageDetails?.name || page.pageName || 'P')[0].toUpperCase()}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            {/* Nombre real de la página */}
                            <div className="flex items-center space-x-2">
                              <div className="font-medium text-sm">
                                {page.pageDetails?.name || page.pageName || 'Sin nombre'}
                              </div>
                              {page.pageDetails?.verified && (
                                <div className="text-blue-500 text-xs">✓</div>
                              )}
                            </div>
                            {/* URL clickeable */}
                            <div className="text-xs text-muted-foreground truncate">
                              <a
                                href={page.pageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-blue-600 hover:underline"
                              >
                                {page.pageUrl}
                              </a>
                            </div>
                            {/* Categoría como tag */}
                            {page.pageDetails?.category && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                {page.pageDetails.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <Badge
                            variant="outline"
                            className={typeof page.configId === 'object' && page.configId?.isActive ? "border-green-500 text-green-600" : "border-gray-300"}
                          >
                            {typeof page.configId === 'object' ? page.configId?.name : page.configName || 'Sin config'}
                          </Badge>
                          {typeof page.configId === 'object' && page.configId?.host && (
                            <div className="text-xs text-muted-foreground">
                              {page.configId.host}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(page.status || 'pending')}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          {/* Posts extraídos */}
                          <div className="flex items-center space-x-1 text-sm">
                            <span className="text-muted-foreground">📊</span>
                            <span className="font-medium">{page.stats?.totalPostsExtracted || 0}</span>
                            <span className="text-xs text-muted-foreground">posts</span>
                          </div>
                          {/* Seguidores si están disponibles */}
                          {page.pageDetails?.followers && (
                            <div className="flex items-center space-x-1 text-sm">
                              <span className="text-muted-foreground">👥</span>
                              <span className="font-medium">
                                {page.pageDetails.followers >= 1000
                                  ? `${(page.pageDetails.followers / 1000).toFixed(0)}K`
                                  : page.pageDetails.followers}
                              </span>
                              <span className="text-xs text-muted-foreground">seguidores</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {page.stats?.lastSuccessfulExtraction
                          ? new Date(page.stats.lastSuccessfulExtraction).toLocaleDateString()
                          : 'Nunca'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Ver detalles completos"
                            disabled={!!actionLoading[page.id]}
                            onClick={() => handleViewDetails(page)}
                          >
                            <IconEye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={page.extractionConfig?.isActive ? "text-yellow-600" : "text-green-600"}
                            onClick={() => {
                              console.log('Page data:', page);
                              console.log('Page ID:', page.id);
                              console.log('Page _id:', page._id);
                              handleActionWithLoading(
                                page.id || page._id,
                                'toggle-config',
                                () => updateExtractionConfig(page.id || page._id, {
                                  isActive: !page.extractionConfig?.isActive
                                }),
                                page.extractionConfig?.isActive
                                  ? `Extracción pausada para ${page.pageDetails?.name || page.pageName}`
                                  : `Extracción activada para ${page.pageDetails?.name || page.pageName}`
                              )
                            }}
                            disabled={isLoading || !!actionLoading[page.id || page._id]}
                            title={page.extractionConfig?.isActive ? "Pausar extracción automática" : "Activar extracción automática"}
                          >
                            {actionLoading[page.id || page._id] === 'toggle-config' ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : page.extractionConfig?.isActive ? (
                              <IconPlayerPause className="w-4 h-4" />
                            ) : (
                              <IconPlayerPlay className="w-4 h-4" />
                            )}
                          </Button>
                          <ExtractionModal
                            pageId={page.id || page._id}
                            pageName={page.pageDetails?.name || page.pageName || 'Página sin nombre'}
                            onExtract={handleExtractionWithDates}
                            isLoading={isLoading || !!actionLoading[page.id || page._id]}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-600"
                            onClick={() => {
                              setSelectedPageForPosts(page)
                              setShowPostsView(true)
                            }}
                            title="Ver posts extraídos"
                          >
                            <IconEye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => {
                              const pageName = page.pageDetails?.name || page.pageName || 'esta página';
                              const followers = page.pageDetails?.followers
                                ? ` (${page.pageDetails.followers >= 1000 ? `${(page.pageDetails.followers / 1000).toFixed(0)}K` : page.pageDetails.followers} seguidores)`
                                : '';

                              if (confirm(
                                `⚠️ ELIMINAR PÁGINA\n\n` +
                                `Página: ${pageName}${followers}\n` +
                                `Posts extraídos: ${page.stats?.totalPostsExtracted || 0}\n\n` +
                                `Esta acción no se puede deshacer.\n` +
                                `¿Estás completamente seguro?`
                              )) {
                                handleActionWithLoading(
                                  page.id || page._id,
                                  'delete',
                                  () => deletePage(page.id || page._id),
                                  `Página "${pageName}" eliminada correctamente`
                                )
                              }
                            }}
                            disabled={isLoading || !!actionLoading[page.id || page._id]}
                            title="Eliminar página permanentemente"
                          >
                            {actionLoading[page.id || page._id] === 'delete' ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <IconTrash className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          <AllPostsTableProper />
        </TabsContent>

        <TabsContent value="quotas" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Monitoreo de Cuotas</h3>
            <Button size="sm" variant="outline">
              <IconShield className="w-4 h-4 mr-2" />
              Ver Histórico
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quotas.map((quota) => (
              <Card key={quota.configId} className={
                quota.status === 'critical' ? 'border-red-200 bg-red-50' :
                quota.status === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                'border-green-200 bg-green-50'
              }>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{quota.configName}</CardTitle>
                    <Badge variant={
                      quota.status === 'critical' ? 'destructive' :
                      quota.status === 'warning' ? 'secondary' :
                      'secondary'
                    } className={
                      quota.status === 'warning' ? 'text-yellow-700 bg-yellow-100' :
                      quota.status === 'normal' ? 'text-green-700 bg-green-100' : ''
                    }>
                      {quota.status === 'critical' ? 'Crítico' :
                       quota.status === 'warning' ? 'Advertencia' : 'Normal'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Uso actual:</span>
                    <span className="text-sm font-medium">
                      {quota.current} / {quota.limit}
                    </span>
                  </div>
                  <Progress value={quota.percentage} className="w-full" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{Math.round(quota.percentage)}% utilizado</span>
                    <span>Reset: {new Date(quota.resetTime).toLocaleTimeString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {quotas.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <IconServer className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hay configuraciones activas para monitorear</p>
                  <p className="text-sm">Agrega una configuración de API para ver las cuotas</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Page Details Modal */}
      <PageDetailsModal
        page={selectedPage}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onEditConfig={(pageId) => {
          // TODO: Implement edit config flow for specific page
          console.log('Edit config for page:', pageId)
          handleCloseModal()
        }}
      />

      {/* Edit Configuration Sheet */}
      {editingConfig && (
        <EditRapidAPIConfigSheet
          config={editingConfig}
          isOpen={!!editingConfig}
          onClose={() => setEditingConfig(null)}
        />
      )}

      {/* 📄 Posts View Modal */}
      {showPostsView && selectedPageForPosts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                Posts - {selectedPageForPosts.pageDetails?.name || selectedPageForPosts.pageName}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowPostsView(false)
                  setSelectedPageForPosts(null)
                }}
              >
                ✕
              </Button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <PostsTable
                pageId={selectedPageForPosts.id || selectedPageForPosts._id}
                pageName={selectedPageForPosts.pageDetails?.name || selectedPageForPosts.pageName}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}