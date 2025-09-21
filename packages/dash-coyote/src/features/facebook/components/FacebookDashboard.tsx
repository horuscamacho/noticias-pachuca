// 📱 Facebook Dashboard - Panel principal del módulo Facebook
import { useState } from 'react'
import { useFacebookStats } from '../hooks/useFacebookStats'
import { useFacebookPages } from '../hooks/useFacebookPages'
import { useFacebookRecentPosts } from '../hooks/useFacebookPosts'
import {
  IconBrandFacebook,
  IconUsers,
  IconFileText,
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
import { CreateFacebookPageSheet } from './CreateFacebookPageSheet'

// Fallback data for when API is not available
const fallbackData = {
  recentPosts: [
    {
      id: '1',
      title: "Gran inauguración del nuevo centro deportivo en Pachuca",
      pageName: "Pachuca Noticias",
      extractedAt: "2h ago",
      engagement: { likes: 45, comments: 12, shares: 8 },
      hasImage: true,
    },
    {
      id: '2',
      title: "Resultados del partido de esta tarde - Victoria 3-1",
      pageName: "Deportes Pachuca",
      extractedAt: "4h ago",
      engagement: { likes: 23, comments: 5, shares: 2 },
      hasImage: false,
    },
    {
      id: '3',
      title: "Festival de música tradicional este fin de semana",
      pageName: "Cultura Pachuca",
      extractedAt: "6h ago",
      engagement: { likes: 67, comments: 15, shares: 12 },
      hasImage: true,
    },
  ],
}

export function FacebookDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview')

  // 🎣 API Hooks
  const { stats, quota, isLoading: isLoadingStats, error: statsError, refetch: refetchStats } = useFacebookStats()
  const {
    pages,
    isLoading: isLoadingPages,
    error: pagesError,
    toggleExtraction,
    deletePage,
    refetch: refetchPages
  } = useFacebookPages()
  const {
    data: recentPosts = fallbackData.recentPosts,
    isLoading: isLoadingPosts,
    refetch: refetchPosts
  } = useFacebookRecentPosts()

  // 🔄 Loading and error states
  const isLoading = isLoadingStats || isLoadingPages
  const hasError = statsError || pagesError

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
        return <Badge variant="outline">Desconocido</Badge>
    }
  }

  const quotaPercentage = quota ? quota.percentage : (stats ? (stats.extractionsHour / stats.quotaLimit) * 100 : 0)

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
                  Error al cargar los datos de Facebook
                </p>
                <p className="text-xs text-red-700">
                  {statsError?.message || pagesError?.message || 'Error desconocido'}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  refetchStats()
                  refetchPages()
                  refetchPosts()
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
          <IconBrandFacebook className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Facebook Extractor</h1>
            <p className="text-gray-600">Gestión de páginas y extracción de contenido</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <IconSettings className="w-4 h-4 mr-2" />
            Configurar
          </Button>
          <Button
            size="sm"
            disabled={quotaPercentage >= 100 || isLoading}
            onClick={() => {
              refetchStats()
              refetchPages()
              refetchPosts()
            }}
          >
            <IconRefresh className="w-4 h-4 mr-2" />
            {isLoading ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </div>
      </div>

      {/* Quota Alert */}
      {quotaPercentage > 80 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-3">
              <IconAlertTriangle className="w-5 h-5 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  Límite de cuota próximo: {stats?.extractionsHour || 0}/{stats?.quotaLimit || 200} requests por hora
                </p>
                <p className="text-xs text-yellow-700">
                  Considera reducir la frecuencia de extracción o esperar al reset
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
            <CardTitle className="text-sm font-medium">Páginas Activas</CardTitle>
            <IconUsers className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pagesActive || 0}</div>
            <p className="text-xs text-muted-foreground">
              +2 desde ayer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts Extraídos Hoy</CardTitle>
            <IconFileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.postsToday || 0}</div>
            <p className="text-xs text-muted-foreground">
              +12% vs ayer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cuota por Hora</CardTitle>
            <IconClock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.extractionsHour || 0}/{stats?.quotaLimit || 200}</div>
            <div className="flex items-center space-x-2 mt-1">
              <Progress value={quotaPercentage} className="flex-1" />
              <span className="text-xs text-muted-foreground">
                {Math.round(quotaPercentage)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiencia</CardTitle>
            <IconTrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.efficiency || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Extracciones exitosas
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
          <TabsTrigger value="pages">Páginas</TabsTrigger>
          <TabsTrigger value="posts">Posts Recientes</TabsTrigger>
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
                <CreateFacebookPageSheet>
                  <Button className="w-full justify-start" variant="outline">
                    <IconPlus className="w-4 h-4 mr-2" />
                    Agregar Nueva Página
                  </Button>
                </CreateFacebookPageSheet>
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
                  Monitoreo en tiempo real
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">API de Facebook</span>
                  <Badge variant="secondary" className="text-green-700 bg-green-100">
                    Conectado
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cola de Trabajos</span>
                  <Badge variant="secondary">
                    3 pendientes
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Reset de Cuota</span>
                  <span className="text-sm text-muted-foreground">
                    en 43 minutos
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Páginas de Facebook</h3>
            <CreateFacebookPageSheet>
              <Button size="sm">
                <IconPlus className="w-4 h-4 mr-2" />
                Agregar Página
              </Button>
            </CreateFacebookPageSheet>
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
                      <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
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
                  <TableHead>Página</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Última Extracción</TableHead>
                  <TableHead>Posts</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(page.status)}
                        <div>
                          <div className="font-medium">{page.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {page.url}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(page.status)}
                    </TableCell>
                    <TableCell>{page.lastExtraction}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{page.postsCount}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="ghost">
                          <IconEye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={page.extractionEnabled ? "text-yellow-600" : "text-green-600"}
                          onClick={() => toggleExtraction(page.id, !page.extractionEnabled)}
                          disabled={isLoading}
                        >
                          {page.extractionEnabled ? <IconPlayerPause className="w-4 h-4" /> : <IconPlayerPlay className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600"
                          onClick={() => {
                            if (confirm(`¿Estás seguro de eliminar la página "${page.name}"?`)) {
                              deletePage(page.id)
                            }
                          }}
                          disabled={isLoading}
                        >
                          <IconTrash className="w-4 h-4" />
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
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Posts Extraídos Recientes</h3>
            <Button size="sm" variant="outline">
              Ver Todos
            </Button>
          </div>

          <div className="space-y-4">
            {isLoadingPosts ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                          <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                          <div className="h-3 w-2 bg-gray-200 rounded animate-pulse" />
                          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
                          <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
                          <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              recentPosts.map((post) => (
              <Card key={post.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start space-x-4">
                    {post.hasImage && (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <IconFileText className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium line-clamp-2">{post.title}</h4>
                        <Button size="sm" variant="outline">
                          Ver
                        </Button>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{post.pageName}</span>
                        <span>•</span>
                        <span>{post.extractedAt}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <span>👍 {post.engagement.likes}</span>
                        <span>💬 {post.engagement.comments}</span>
                        <span>🔗 {post.engagement.shares}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}