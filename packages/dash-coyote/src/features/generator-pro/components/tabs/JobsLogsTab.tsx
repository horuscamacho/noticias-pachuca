import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  IconListDetails,
  IconRefresh,
  IconTrash,
  IconClock,
  IconCheck,
  IconExclamationCircle
} from '@tabler/icons-react'

import { useGeneratorProJobs, useRetryJob, useClearQueue } from '../../hooks'

export function JobsLogsTab() {
  const { data: jobs, isLoading } = useGeneratorProJobs()
  const retryJob = useRetryJob()
  const clearQueue = useClearQueue()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'processing': return 'bg-blue-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <IconCheck className="h-4 w-4" />
      case 'processing': return <IconClock className="h-4 w-4" />
      case 'failed': return <IconExclamationCircle className="h-4 w-4" />
      default: return <IconClock className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Cargando jobs...</p>
      </div>
    )
  }

  const pendingJobs = jobs?.filter(job => job.status === 'pending') || []
  const processingJobs = jobs?.filter(job => job.status === 'processing') || []
  const completedJobs = jobs?.filter(job => job.status === 'completed') || []
  const failedJobs = jobs?.filter(job => job.status === 'failed') || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Jobs & Logs</h2>
          <p className="text-muted-foreground">
            Monitor de trabajos del sistema y logs de actividad
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearQueue.mutate('extraction')}
            disabled={clearQueue.isPending}
          >
            <IconTrash className="h-4 w-4 mr-2" />
            Limpiar Cola
          </Button>
        </div>
      </div>

      {/* Job Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <div className="w-3 h-3 rounded-full bg-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingJobs.length}</div>
            <p className="text-xs text-muted-foreground">en cola</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Procesando</CardTitle>
            <div className="w-3 h-3 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processingJobs.length}</div>
            <p className="text-xs text-muted-foreground">activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedJobs.length}</div>
            <p className="text-xs text-muted-foreground">exitosos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fallidos</CardTitle>
            <div className="w-3 h-3 rounded-full bg-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedJobs.length}</div>
            <p className="text-xs text-muted-foreground">con errores</p>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <IconListDetails className="h-5 w-5" />
            <span>Jobs Recientes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {jobs && jobs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Progreso</TableHead>
                  <TableHead>Tiempo</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.slice(0, 10).map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{job.type.replace('_', ' ')}</div>
                        <div className="text-sm text-muted-foreground">ID: {job.id.substring(0, 8)}...</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(job.status)}`} />
                        <Badge variant={
                          job.status === 'completed' ? 'default' :
                          job.status === 'failed' ? 'destructive' : 'secondary'
                        }>
                          {job.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Progress value={job.progress} className="h-2" />
                        <div className="text-xs text-muted-foreground">{job.progress}%</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {job.processingTime ? `${job.processingTime}ms` : '-'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(job.createdAt).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {job.status === 'failed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => retryJob.mutate(job.id)}
                          disabled={retryJob.isPending}
                        >
                          <IconRefresh className="h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <IconListDetails className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay jobs registrados</h3>
              <p className="text-muted-foreground">
                Los trabajos aparecerán aquí cuando el sistema comience a procesar tareas
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}