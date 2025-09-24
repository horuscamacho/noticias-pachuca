"use client"

import { useState } from "react"
import { useProviders, useProviderHealthCheck, useUpdateProvider, useCreateProvider, useDeleteProvider, useAvailableStrategies } from "../hooks"
import { useSystemMetrics, useCostReport } from "../hooks/useJobs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  Zap,
  Plus,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Activity,
  RefreshCw,
  Edit,
  Trash2
} from "lucide-react"

interface AIProvider {
  id: string
  name: string
  model: string
  isActive: boolean
  apiKey: string
  baseUrl: string
  maxTokens: number
  temperature: number
  costPerToken: number
  rateLimits: {
    requestsPerMinute: number
    requestsPerHour: number
  }
  lastHealthCheck?: {
    isHealthy: boolean
    responseTime: number
    checkedAt: Date
    error?: string
  }
  usageStats?: {
    totalRequests: number
    successRate: number
    averageResponseTime: number
    totalCost: number
  }
}

// Mock data - TODO: Replace with real TanStack Query
const mockProviders: AIProvider[] = [
  {
    id: "1",
    name: "OpenAI",
    model: "gpt-4o",
    isActive: true,
    apiKey: "sk-...abc123",
    baseUrl: "https://api.openai.com/v1",
    maxTokens: 4096,
    temperature: 0.7,
    costPerToken: 0.000005,
    rateLimits: {
      requestsPerMinute: 500,
      requestsPerHour: 10000
    },
    lastHealthCheck: {
      isHealthy: true,
      responseTime: 245,
      checkedAt: new Date(),
    },
    usageStats: {
      totalRequests: 1247,
      successRate: 98.4,
      averageResponseTime: 1200,
      totalCost: 15.67
    }
  },
  {
    id: "2",
    name: "Anthropic",
    model: "claude-4",
    isActive: true,
    apiKey: "ant-...xyz789",
    baseUrl: "https://api.anthropic.com/v1",
    maxTokens: 8192,
    temperature: 0.5,
    costPerToken: 0.000008,
    rateLimits: {
      requestsPerMinute: 300,
      requestsPerHour: 5000
    },
    lastHealthCheck: {
      isHealthy: true,
      responseTime: 189,
      checkedAt: new Date(),
    },
    usageStats: {
      totalRequests: 823,
      successRate: 99.1,
      averageResponseTime: 950,
      totalCost: 12.34
    }
  }
]

export function ProvidersTab() {
  const { data: providers = [], isLoading, error } = useProviders()
  const { data: availableStrategies = [], isLoading: loadingStrategies } = useAvailableStrategies()
  const { data: systemMetrics } = useSystemMetrics()
  const { data: costReport } = useCostReport('day')
  const healthCheckMutation = useProviderHealthCheck()
  const updateProviderMutation = useUpdateProvider()
  const createProviderMutation = useCreateProvider()
  const deleteProviderMutation = useDeleteProvider()
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const [formData, setFormData] = useState({
    provider: '',
    model: '',
    apiKey: '',
    name: ''
  })

  const getHealthStatus = (provider: AIProvider) => {
    if (!provider.lastHealthCheck) {
      return { icon: AlertTriangle, color: "text-yellow-500", label: "Sin verificar" }
    }

    if (provider.lastHealthCheck.isHealthy) {
      return { icon: CheckCircle, color: "text-green-500", label: "Online" }
    }

    return { icon: XCircle, color: "text-red-500", label: "Error" }
  }


  const resetForm = () => {
    setFormData({
      provider: '',
      model: '',
      apiKey: '',
      name: ''
    })
  }

  const handleCreateProvider = async () => {
    try {
      // Crear el payload según la interface CreateAIProviderRequest
      const selectedStrategy = availableStrategies.find(s => s.name === formData.provider)
      const payload = {
        name: formData.name || `${formData.provider} - ${formData.model}`,
        model: formData.model,
        apiKey: formData.apiKey,
        baseUrl: selectedStrategy?.name === 'openai' ? 'https://api.openai.com/v1' :
                 selectedStrategy?.name === 'anthropic' ? 'https://api.anthropic.com' :
                 'https://api.openai.com/v1', // fallback
        maxTokens: selectedStrategy?.capabilities.maxTokens || 4000,
        temperature: 0.7,
        costPerToken: selectedStrategy?.capabilities.costPerInputToken || 0.001,
        rateLimits: {
          requestsPerMinute: 60,
          requestsPerHour: 3600
        }
      }

      await createProviderMutation.mutateAsync(payload)
      setIsCreateOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error creating provider:', error)
    }
  }

  const handleToggleProvider = async (providerId: string, isActive: boolean) => {
    try {
      await updateProviderMutation.mutateAsync({
        id: providerId,
        data: { isActive }
      })
    } catch (error) {
      console.error('Error updating provider:', error)
    }
  }

  const handleHealthCheck = async (providerId: string) => {
    try {
      await healthCheckMutation.mutateAsync(providerId)
    } catch (error) {
      console.error('Health check failed:', error)
    }
  }

  const handleDeleteProvider = async (providerId: string) => {
    try {
      await deleteProviderMutation.mutateAsync(providerId)
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="text-muted-foreground">Cargando proveedores...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="text-red-600">Error al cargar proveedores: {error.message}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Configuración de Proveedores AI</h3>
          <p className="text-sm text-muted-foreground">
            Gestiona tus APIs y configuraciones de modelos de inteligencia artificial
          </p>
        </div>
        <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <SheetTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Agregar API Key
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-[480px] flex flex-col p-0">
            <div className="px-6 py-6">
              <SheetHeader className="space-y-3">
                <SheetTitle>Agregar Nueva API Key</SheetTitle>
                <SheetDescription>
                  Selecciona un proveedor configurado y agrega tu API key
                </SheetDescription>
              </SheetHeader>
            </div>

            <div className="flex-1 px-6 pb-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="provider">Proveedor</Label>
                    <Select
                      value={formData.provider}
                      onValueChange={(value) => {
                        setFormData(prev => ({
                          ...prev,
                          provider: value,
                          model: '' // Reset model when provider changes
                        }))
                      }}
                      disabled={loadingStrategies}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingStrategies ? "Cargando..." : "Selecciona un proveedor"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStrategies.map((strategy) => (
                          <SelectItem key={strategy.name} value={strategy.name}>
                            {strategy.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.provider && (
                    <div className="space-y-2">
                      <Label htmlFor="model">Modelo</Label>
                      <Select
                        value={formData.model}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, model: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un modelo" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableStrategies
                            .find(s => s.name === formData.provider)
                            ?.models.map((model) => (
                              <SelectItem key={model} value={model}>
                                {model}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={formData.apiKey}
                      onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="sk-..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre (opcional)</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder={formData.provider && formData.model ? `${formData.provider} - ${formData.model}` : "ej. Mi OpenAI Personal"}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="border-t px-6 py-4 bg-muted/50">
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateOpen(false)
                    resetForm()
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateProvider}
                  disabled={!formData.provider || !formData.model || !formData.apiKey || createProviderMutation.isPending}
                >
                  {createProviderMutation.isPending ? "Creando..." : "Agregar"}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Providers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Proveedores Configurados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proveedor</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Uso</TableHead>
                <TableHead>Costo</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.map((provider) => {
                const health = getHealthStatus(provider)
                const HealthIcon = health.icon

                return (
                  <TableRow key={provider.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{provider.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {provider.model}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <HealthIcon className={`h-4 w-4 ${health.color}`} />
                        <Badge variant={provider.isActive ? "default" : "secondary"}>
                          {provider.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      {provider.lastHealthCheck && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {provider.lastHealthCheck.responseTime}ms
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {provider.apiKey || "No API Key"}
                        </code>
                      </div>
                    </TableCell>

                    <TableCell>
                      {provider.usageStats && (
                        <div className="space-y-1">
                          <div className="text-sm">
                            {provider.usageStats.totalRequests.toLocaleString()} requests
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {provider.usageStats.successRate}% éxito
                          </div>
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      {provider.usageStats && (
                        <div className="text-sm">
                          ${provider.usageStats.totalCost.toFixed(2)}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleHealthCheck(provider.id)}
                          title="Health Check"
                        >
                          <Activity className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Editar"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Eliminar"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción eliminará permanentemente el proveedor {provider.name}.
                                Los templates que lo usen dejarán de funcionar.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteProvider(provider.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Requests Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemMetrics?.costs.totalJobs?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Requests procesados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Costo Total Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${costReport?.totals.cost?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Costo promedio: ${systemMetrics?.costs.averageCostPerJob?.toFixed(4) || '0.0000'}/job
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Proveedores Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {providers.filter(p => p.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              de {providers.length} total
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}