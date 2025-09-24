"use client"

import { useState } from "react"
import { useQueueStats, useCostReport, useActiveAlerts, useCancelJob, useSystemMetrics } from "../hooks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Activity,
  MoreHorizontal,
  RefreshCw,
  Pause,
  Play,
  X,
  Clock,
  DollarSign,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  TrendingUp,
  Calendar,
  Users
} from "lucide-react"

interface GenerationJob {
  id: string
  type: 'news-to-content' | 'batch-generation' | 'template-test'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  title: string
  templateName: string
  priority: number
  progress: number // 0-100
  estimatedTime: number // ms
  actualTime?: number // ms
  queuePosition?: number
  startedAt?: Date
  completedAt?: Date
  createdAt: Date
  userId?: string
  aiProvider: string
  tokensUsed?: number
  cost?: number
  errorMessage?: string
  retryCount: number
  maxRetries: number
}

interface CostSummary {
  totalCostToday: number
  totalCostMonth: number
  totalTokensToday: number
  totalTokensMonth: number
  averageCostPerJob: number
  projectedMonthlyCost: number
  topExpensiveProvider: string
  budgetUsed: number // percentage
  budgetLimit: number
}

// Mock data - TODO: Replace with real TanStack Query
const mockJobs: GenerationJob[] = [
  {
    id: "job_1",
    type: "news-to-content",
    status: "processing",
    title: "Generando noticia: Nuevo estadio deportivo",
    templateName: "Reportero Deportivo",
    priority: 5,
    progress: 75,
    estimatedTime: 3000,
    queuePosition: 0,
    startedAt: new Date(Date.now() - 120000), // 2 min ago
    createdAt: new Date(Date.now() - 180000), // 3 min ago
    aiProvider: "OpenAI",
    tokensUsed: 1200,
    cost: 0.06,
    retryCount: 0,
    maxRetries: 3
  },
  {
    id: "job_2",
    type: "news-to-content",
    status: "pending",
    title: "Generando columna: Reforma fiscal",
    templateName: "Columnista Humor",
    priority: 3,
    progress: 0,
    estimatedTime: 4500,
    queuePosition: 1,
    createdAt: new Date(Date.now() - 60000), // 1 min ago
    aiProvider: "Anthropic",
    retryCount: 0,
    maxRetries: 3
  },
  {
    id: "job_3",
    type: "template-test",
    status: "completed",
    title: "Test: Template Trascendido Político",
    templateName: "Trascendido Político",
    priority: 7,
    progress: 100,
    estimatedTime: 2800,
    actualTime: 3200,
    startedAt: new Date(Date.now() - 300000), // 5 min ago
    completedAt: new Date(Date.now() - 120000), // 2 min ago
    createdAt: new Date(Date.now() - 360000), // 6 min ago
    aiProvider: "Anthropic",
    tokensUsed: 1850,
    cost: 0.148,
    retryCount: 0,
    maxRetries: 3
  },
  {
    id: "job_4",
    type: "news-to-content",
    status: "failed",
    title: "Generando noticia: Festival cultural",
    templateName: "Reportero Cultural",
    priority: 4,
    progress: 35,
    estimatedTime: 3500,
    actualTime: 15000,
    startedAt: new Date(Date.now() - 600000), // 10 min ago
    completedAt: new Date(Date.now() - 420000), // 7 min ago
    createdAt: new Date(Date.now() - 720000), // 12 min ago
    aiProvider: "OpenAI",
    cost: 0,
    errorMessage: "Rate limit exceeded - OpenAI API",
    retryCount: 3,
    maxRetries: 3
  }
]

const mockCostSummary: CostSummary = {
  totalCostToday: 8.47,
  totalCostMonth: 156.23,
  totalTokensToday: 42500,
  totalTokensMonth: 785000,
  averageCostPerJob: 0.085,
  projectedMonthlyCost: 245.80,
  topExpensiveProvider: "Anthropic",
  budgetUsed: 62.5,
  budgetLimit: 250
}

export function JobsCostsTab() {
  const { data: queueStats, isLoading: loadingQueue } = useQueueStats()
  const { data: costReport, isLoading: loadingCosts } = useCostReport('day')
  const { data: activeAlerts = [] } = useActiveAlerts()
  const { data: systemMetrics } = useSystemMetrics()
  const cancelJobMutation = useCancelJob()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800"
      case "processing": return "bg-blue-100 text-blue-800"
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "failed": return "bg-red-100 text-red-800"
      case "cancelled": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4" />
      case "processing": return <RefreshCw className="h-4 w-4 animate-spin" />
      case "pending": return <Clock className="h-4 w-4" />
      case "failed": return <XCircle className="h-4 w-4" />
      case "cancelled": return <X className="h-4 w-4" />
      default: return null
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return "bg-red-100 text-red-800"
    if (priority >= 5) return "bg-yellow-100 text-yellow-800"
    return "bg-green-100 text-green-800"
  }

  const getPriorityLabel = (priority: number) => {
    if (priority >= 8) return "Alta"
    if (priority >= 5) return "Media"
    return "Baja"
  }

  const handleCancelJob = async (jobId: string) => {
    try {
      await cancelJobMutation.mutateAsync(jobId)
    } catch (error) {
      console.error('Cancel job failed:', error)
    }
  }

  const handleRetryJob = (jobId: string) => {
    // TODO: Implement retry logic with DLQ
    console.log(`Retrying job ${jobId}`)
  }

  if (loadingQueue || loadingCosts) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="text-muted-foreground">Cargando métricas...</div>
        </div>
      </div>
    )
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffMinutes < 1) return "Ahora"
    if (diffMinutes < 60) return `${diffMinutes}m`
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Jobs y Monitoreo de Costos</h3>
          <p className="text-sm text-muted-foreground">
            Seguimiento en tiempo real de trabajos de generación y análisis de costos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Reportes
          </Button>
        </div>
      </div>

      {/* Cost Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Costo Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${costReport?.totals.cost.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {costReport?.totals.tokens.toLocaleString() || '0'} tokens
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Jobs Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {costReport?.totals.jobs || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Promedio: ${costReport?.totals.averageCostPerJob.toFixed(4) || '0.0000'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Jobs Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {queueStats?.currentQueueSize || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Capacidad: {queueStats?.processingCapacity || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeAlerts.filter(a => a.severity === 'critical').length} críticas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Jobs de Generación
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Progreso</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Tiempo</TableHead>
                <TableHead>Costo</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{job.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {job.templateName} • {job.aiProvider}
                      </div>
                      {job.queuePosition !== undefined && job.status === 'pending' && (
                        <Badge variant="outline" className="text-xs">
                          Posición {job.queuePosition + 1}
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(job.status)}
                      <Badge className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                    </div>
                    {job.errorMessage && (
                      <div className="text-xs text-red-600 mt-1 max-w-xs">
                        {job.errorMessage}
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="space-y-2">
                      <Progress value={job.progress} className="w-20" />
                      <div className="text-xs text-muted-foreground">
                        {job.progress}%
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge className={getPriorityColor(job.priority)}>
                      {getPriorityLabel(job.priority)}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      P{job.priority}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      {job.status === 'processing' && job.startedAt && (
                        <div className="text-sm">
                          {formatDuration(Date.now() - job.startedAt.getTime())}
                        </div>
                      )}
                      {job.actualTime && (
                        <div className="text-sm">
                          {formatDuration(job.actualTime)}
                        </div>
                      )}
                      {!job.actualTime && job.status !== 'processing' && (
                        <div className="text-sm text-muted-foreground">
                          Est: {formatDuration(job.estimatedTime)}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {getTimeAgo(job.createdAt)}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        {job.cost ? `$${job.cost.toFixed(4)}` : '-'}
                      </div>
                      {job.tokensUsed && (
                        <div className="text-xs text-muted-foreground">
                          {job.tokensUsed.toLocaleString()} tokens
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {job.status === 'processing' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Pause className="h-4 w-4 mr-2" />
                                Cancelar Job
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Cancelar job?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  El job "{job.title}" será cancelado y no se podrá recuperar.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>No cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleCancelJob(job.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Cancelar Job
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}

                        {job.status === 'failed' && job.retryCount < job.maxRetries && (
                          <DropdownMenuItem onClick={() => handleRetryJob(job.id)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reintentar
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem>
                          <Activity className="h-4 w-4 mr-2" />
                          Ver Detalles
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Provider Costs Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Desglose por Proveedor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-blue-500 rounded-full" />
                <div>
                  <div className="font-medium">OpenAI</div>
                  <div className="text-sm text-muted-foreground">GPT-4o</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">$67.45</div>
                <div className="text-sm text-muted-foreground">43.2% del total</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-purple-500 rounded-full" />
                <div>
                  <div className="font-medium">Anthropic</div>
                  <div className="text-sm text-muted-foreground">Claude 4</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">$88.78</div>
                <div className="text-sm text-muted-foreground">56.8% del total</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}