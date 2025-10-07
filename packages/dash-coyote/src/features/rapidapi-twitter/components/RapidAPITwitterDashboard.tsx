// 🐦 RapidAPI Twitter Dashboard - Panel principal del módulo RapidAPI Twitter
import { useState } from 'react'
import { useRapidAPITwitterStats } from '../hooks/useRapidAPITwitterStats'
import { useRapidAPITwitterConfigs } from '../hooks/useRapidAPITwitterConfigs'
import type { RapidAPITwitterConfig, RapidAPITwitterUser } from '../types/rapidapi-twitter.types'
import { useRapidAPITwitterUsers } from '../hooks/useRapidAPITwitterUsers'
import { UserDetailsModal } from './UserDetailsModal'
import { ExtractionModal } from './ExtractionModal'
import { TweetsTable } from './TweetsTable'
import { AllTweetsTableProper } from './AllTweetsTableProper'
import {
  IconBrandTwitter,
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
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { CreateRapidAPITwitterConfigSheet } from './CreateRapidAPITwitterConfigSheet'
import { EditRapidAPITwitterConfigSheet } from './EditRapidAPITwitterConfigSheet'
import { CreateRapidAPITwitterUserSheet } from './CreateRapidAPITwitterUserSheet'

/**
 * 🐦 RapidAPI Twitter Dashboard
 * Panel completo para gestión de configuraciones de Twitter, usuarios monitoreados y tweets extraídos
 */
export function RapidAPITwitterDashboard() {
  // 📊 Stats y configuraciones
  const { stats, quotas, isLoading: statsLoading, refetch: refetchStats } = useRapidAPITwitterStats()
  const {
    configs,
    isLoading: configsLoading,
    createConfig,
    updateConfig,
    deleteConfig,
    activateConfig,
    testConnection,
    refetch: refetchConfigs
  } = useRapidAPITwitterConfigs()

  // 🐦 Users management
  const {
    users,
    isLoading: usersLoading,
    createUser,
    updateUser,
    deleteUser,
    updateExtractionConfig,
    triggerExtraction,
    refetch: refetchUsers
  } = useRapidAPITwitterUsers()

  // 🎛️ UI State
  const [selectedUser, setSelectedUser] = useState<RapidAPITwitterUser | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isExtractionModalOpen, setIsExtractionModalOpen] = useState(false)
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedUserForTweets, setSelectedUserForTweets] = useState<RapidAPITwitterUser | null>(null)
  const [showTweetsView, setShowTweetsView] = useState(false)

  // 🔄 Handler for extraction with date range
  const handleExtractionWithDates = async (userId: string, startDate?: Date, endDate?: Date) => {
    await handleActionWithLoading(
      userId,
      'extract',
      () => triggerExtraction(userId, startDate, endDate),
      `Extracción iniciada para usuario ${users.find(u => (u.id || u._id) === userId)?.displayName || 'desconocido'}`
    )
  }

  const handleViewDetails = (user: RapidAPITwitterUser) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedUser(null)
  }

  const handleActionWithLoading = async (
    userId: string,
    action: string,
    asyncAction: () => Promise<unknown>,
    successMessage?: string
  ) => {
    try {
      setLoadingActions(prev => ({ ...prev, [`${userId}_${action}`]: true }))
      await asyncAction()
      if (successMessage) {
        console.log(successMessage) // TODO: Replace with toast notification
      }
      refetchUsers()
      refetchStats()
    } catch (error: unknown) {
      console.error(`Error en ${action}:`, error)
      // TODO: Show error toast
    } finally {
      setLoadingActions(prev => ({ ...prev, [`${userId}_${action}`]: false }))
    }
  }

  const handleConfigAction = async (
    configId: string,
    action: string,
    asyncAction: () => Promise<unknown>,
    successMessage?: string
  ) => {
    try {
      setLoadingActions(prev => ({ ...prev, [`config_${configId}_${action}`]: true }))
      await asyncAction()
      if (successMessage) {
        console.log(successMessage)
      }
      refetchConfigs()
      refetchStats()
    } catch (error: unknown) {
      console.error(`Error en ${action} de configuración:`, error)
    } finally {
      setLoadingActions(prev => ({ ...prev, [`config_${configId}_${action}`]: false }))
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'paused': return 'secondary'
      case 'error': return 'destructive'
      default: return 'outline'
    }
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Nunca'
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: es })
    } catch {
      return 'Fecha inválida'
    }
  }

  // Si estamos en vista de tweets de un usuario específico
  if (showTweetsView && selectedUserForTweets) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => {
              setShowTweetsView(false)
              setSelectedUserForTweets(null)
            }}
          >
            ← Volver al Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Tweets de @{selectedUserForTweets.username}</h1>
            <p className="text-muted-foreground">{selectedUserForTweets.displayName}</p>
          </div>
        </div>
        <TweetsTable userId={selectedUserForTweets.id} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 🎯 Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <IconBrandTwitter className="h-8 w-8 text-blue-500" />
            RapidAPI Twitter
          </h1>
          <p className="text-muted-foreground">
            Gestión de APIs de terceros para extracción de datos de Twitter
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              refetchStats()
              refetchConfigs()
              refetchUsers()
            }}
          >
            <IconRefresh className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* 📊 Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configuraciones Activas</CardTitle>
            <IconServer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.activeConfigs || 0}
            </div>
            <p className="text-xs text-muted-foreground">APIs configuradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Monitoreados</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.usersMonitored || users?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Usuarios de Twitter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requests Hoy</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.requestsToday || 0}
            </div>
            <p className="text-xs text-muted-foreground">Llamadas a la API</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uso de Quota</CardTitle>
            <IconClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : `${Math.round(stats?.quotaUsagePercentage || 0)}%`}
            </div>
            <Progress
              value={stats?.quotaUsagePercentage || 0}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground">Quota utilizada</p>
          </CardContent>
        </Card>
      </div>

      {/* 📋 Panel principal con tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="configs">Configuraciones</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="tweets">Todos los Tweets</TabsTrigger>
        </TabsList>

        {/* 📈 Tab: Resumen */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 🔧 Estado de Configuraciones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconSettings className="h-5 w-5" />
                  Estado de Configuraciones
                </CardTitle>
                <CardDescription>
                  Estado actual de las APIs configuradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {configsLoading ? (
                    <p>Cargando configuraciones...</p>
                  ) : configs.length === 0 ? (
                    <p className="text-muted-foreground">No hay configuraciones creadas</p>
                  ) : (
                    configs.slice(0, 3).map((config) => (
                      <div key={config.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${config.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <div>
                            <p className="font-medium">{config.name}</p>
                            <p className="text-sm text-muted-foreground">{config.host}</p>
                          </div>
                        </div>
                        <Badge variant={config.isActive ? 'default' : 'secondary'}>
                          {config.isActive ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 🐦 Usuarios Recientes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconUsers className="h-5 w-5" />
                  Usuarios Recientes
                </CardTitle>
                <CardDescription>
                  Usuarios de Twitter agregados recientemente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {usersLoading ? (
                    <p>Cargando usuarios...</p>
                  ) : users.length === 0 ? (
                    <p className="text-muted-foreground">No hay usuarios monitoreados</p>
                  ) : (
                    users.slice(0, 3).map((user) => (
                      <div key={user.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {user.userDetails?.profilePicture ? (
                            <img
                              src={user.userDetails.profilePicture}
                              alt={user.displayName}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                              <span className="text-white text-sm font-bold">
                                {user.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{user.displayName}</p>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                          </div>
                        </div>
                        <Badge variant={getStatusBadgeVariant(user.status)}>
                          {user.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ⚙️ Tab: Configuraciones */}
        <TabsContent value="configs" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Configuraciones de API</h3>
            <CreateRapidAPITwitterConfigSheet onConfigCreated={refetchConfigs} />
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Uso Diario</TableHead>
                    <TableHead>Última Actividad</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Cargando configuraciones...
                      </TableCell>
                    </TableRow>
                  ) : configs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No hay configuraciones creadas. Crea una nueva para comenzar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    configs.map((config) => (
                      <TableRow key={config.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${config.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                            <span className="font-medium">{config.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{config.host}</TableCell>
                        <TableCell>
                          <Badge variant={config.isActive ? 'default' : 'secondary'}>
                            {config.isActive ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm">
                              {config.currentUsage?.requestsToday || 0} / {config.quotaLimits?.requestsPerDay || 0}
                            </span>
                            <Progress
                              value={(config.currentUsage?.requestsToday || 0) / (config.quotaLimits?.requestsPerDay || 1) * 100}
                              className="h-2"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDate(config.currentUsage?.lastRequestDate)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleConfigAction(
                                config.id,
                                'test',
                                () => testConnection(config.id),
                                'Conexión probada exitosamente'
                              )}
                              disabled={loadingActions[`config_${config.id}_test`]}
                            >
                              <IconTestPipe className="h-4 w-4" />
                            </Button>

                            {config.isActive ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleConfigAction(
                                  config.id,
                                  'deactivate',
                                  () => updateConfig(config.id, { isActive: false }),
                                  'Configuración desactivada'
                                )}
                                disabled={loadingActions[`config_${config.id}_deactivate`]}
                              >
                                <IconPlayerPause className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleConfigAction(
                                  config.id,
                                  'activate',
                                  () => activateConfig(config.id),
                                  'Configuración activada'
                                )}
                                disabled={loadingActions[`config_${config.id}_activate`]}
                              >
                                <IconPlayerPlay className="h-4 w-4" />
                              </Button>
                            )}

                            <EditRapidAPITwitterConfigSheet
                              config={config}
                              onConfigUpdated={refetchConfigs}
                            />

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleConfigAction(
                                config.id,
                                'delete',
                                () => deleteConfig(config.id),
                                'Configuración eliminada'
                              )}
                              disabled={loadingActions[`config_${config.id}_delete`]}
                            >
                              <IconTrash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 🐦 Tab: Usuarios */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Usuarios de Twitter Monitoreados</h3>
            <CreateRapidAPITwitterUserSheet onUserCreated={refetchUsers} />
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Configuración</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Tweets Extraídos</TableHead>
                    <TableHead>Última Extracción</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Cargando usuarios...
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No hay usuarios monitoreados. Agrega un usuario para comenzar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {user.userDetails?.profilePicture ? (
                              <img
                                src={user.userDetails.profilePicture}
                                alt={user.displayName}
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                                <span className="text-white text-sm font-bold">
                                  {user.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{user.displayName}</p>
                              <p className="text-sm text-muted-foreground">@{user.username}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{user.configName || 'Sin configuración'}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(user.status)}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">
                            {user.stats?.totalPostsExtracted || 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          {formatDate(user.stats?.lastSuccessfulExtraction)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(user)}
                            >
                              <IconEye className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUserForTweets(user)
                                setShowTweetsView(true)
                              }}
                            >
                              Ver Tweets
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleActionWithLoading(
                                user.id,
                                'extract',
                                () => triggerExtraction(user.id),
                                `Extracción iniciada para @${user.username}`
                              )}
                              disabled={loadingActions[`${user.id}_extract`]}
                            >
                              <IconRefresh className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleActionWithLoading(
                                user.id,
                                'delete',
                                () => deleteUser(user.id),
                                `Usuario @${user.username} eliminado`
                              )}
                              disabled={loadingActions[`${user.id}_delete`]}
                            >
                              <IconTrash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 📝 Tab: Todos los Tweets */}
        <TabsContent value="tweets" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Todos los Tweets Extraídos</h3>
          </div>
          <AllTweetsTableProper />
        </TabsContent>
      </Tabs>

      {/* 📋 Modales */}
      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onUpdateExtractionConfig={(config) =>
            updateExtractionConfig(selectedUser.id, config)
          }
        />
      )}

      <ExtractionModal
        isOpen={isExtractionModalOpen}
        onClose={() => setIsExtractionModalOpen(false)}
        onExtract={handleExtractionWithDates}
        selectedUser={selectedUser}
      />
    </div>
  )
}