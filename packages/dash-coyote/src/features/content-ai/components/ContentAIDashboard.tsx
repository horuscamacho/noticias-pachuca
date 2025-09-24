"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  BarChart3,
  Brain,
  FileText,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Activity,
  Wand2
} from "lucide-react"
import { PromptGeneratorWizard } from "./PromptGeneratorWizard"
import { CreateTemplateSheet } from "./CreateTemplateSheet"
import { GeneratorTab } from "./GeneratorTab"
import { ProvidersTab } from "./ProvidersTab"
import { TemplatesTab } from "./TemplatesTab"
import { GeneratedContentTab } from "./GeneratedContentTab"
import { JobsCostsTab } from "./JobsCostsTab"
import { useSystemMetrics, useActiveProviders, useActiveTemplates, useGeneratedContentStats } from "../hooks"

interface StatCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ElementType
  trend?: {
    value: number
    isPositive: boolean
  }
  status?: "success" | "warning" | "error"
}

function StatCard({ title, value, description, icon: Icon, trend, status }: StatCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case "success": return "text-green-600"
      case "warning": return "text-yellow-600"
      case "error": return "text-red-600"
      default: return "text-muted-foreground"
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${getStatusColor()}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className={`text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'} flex items-center gap-1 mt-1`}>
            <TrendingUp className="h-3 w-3" />
            {trend.isPositive ? '+' : ''}{trend.value}% vs mes anterior
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function ContentAIDashboard() {
  const [activeTab, setActiveTab] = useState("resumen")

  // Real data from backend
  const { data: systemMetrics } = useSystemMetrics()
  const { data: activeProviders = [] } = useActiveProviders()
  const { data: activeTemplates = [] } = useActiveTemplates()
  const { data: contentStats } = useGeneratedContentStats('day')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Content AI Dashboard</h1>
        <p className="text-muted-foreground">
          Centro de control para generación de contenido periodístico con inteligencia artificial
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="resumen" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="generador" className="gap-2">
            <Wand2 className="h-4 w-4" />
            Generador
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="proveedores" className="gap-2">
            <Settings className="h-4 w-4" />
            Proveedores
          </TabsTrigger>
          <TabsTrigger value="generado" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Generado
          </TabsTrigger>
          <TabsTrigger value="jobs" className="gap-2">
            <Activity className="h-4 w-4" />
            Jobs & Costs
          </TabsTrigger>
        </TabsList>

        {/* Resumen Tab */}
        <TabsContent value="resumen" className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Contenido Generado Hoy"
              value={contentStats?.totalGenerated || 0}
              description="Artículos procesados"
              icon={Brain}
              trend={{ value: 12, isPositive: true }}
              status="success"
            />
            <StatCard
              title="Costo Total Hoy"
              value={`$${systemMetrics?.costs.today.toFixed(2) || '0.00'}`}
              description="Gasto en APIs hoy"
              icon={DollarSign}
              trend={{ value: -5, isPositive: false }}
              status="warning"
            />
            <StatCard
              title="Templates Activos"
              value={activeTemplates.length}
              description="Prompts configurados"
              icon={FileText}
              status="success"
            />
            <StatCard
              title="Tasa de Éxito"
              value={`${contentStats?.successRate.toFixed(1) || '0'}%`}
              description="Generaciones exitosas"
              icon={CheckCircle}
              status="success"
            />
          </div>

          {/* Provider Status */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Estado de Proveedores AI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeProviders.length > 0 ? (
                  activeProviders.map(provider => (
                    <div key={provider.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${
                          provider.lastHealthCheck?.isHealthy
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`} />
                        <span className="text-sm">{provider.name} {provider.model}</span>
                      </div>
                      <Badge variant={provider.isActive ? "secondary" : "outline"}>
                        {provider.isActive
                          ? (provider.lastHealthCheck?.isHealthy ? "Online" : "Error")
                          : "Inactivo"
                        }
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    No hay proveedores configurados
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Actividad Reciente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Jobs en cola</span>
                    <span className="font-medium">{systemMetrics?.queue.currentQueueSize || 0}</span>
                  </div>
                  <Progress value={
                    systemMetrics?.queue.currentQueueSize && systemMetrics?.queue.processingCapacity
                      ? (systemMetrics.queue.currentQueueSize / systemMetrics.queue.processingCapacity) * 100
                      : 0
                  } className="h-1" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Jobs totales hoy</span>
                    <span className="font-medium">{systemMetrics?.costs.totalJobs || 0}</span>
                  </div>
                  <Progress value={
                    systemMetrics?.costs.totalJobs
                      ? Math.min((systemMetrics.costs.totalJobs / 100) * 100, 100)
                      : 0
                  } className="h-1" />
                </div>
                <div className="text-xs text-muted-foreground">
                  Costo promedio: ${systemMetrics?.costs.averageCostPerJob.toFixed(4) || '0.0000'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
              <CardDescription>
                Operaciones frecuentes para gestión de contenido AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Wand2 className="h-4 w-4" />
                  Generación Masiva
                </Button>
                <CreateTemplateSheet
                  trigger={
                    <Button variant="outline" size="sm" className="gap-2">
                      <FileText className="h-4 w-4" />
                      Nuevo Template
                    </Button>
                  }
                />
                <Button variant="outline" size="sm" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Ver Reportes
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Configurar APIs
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Generador Tab */}
        <TabsContent value="generador" className="space-y-8">
          <GeneratorTab />
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-8">
          <TemplatesTab />
        </TabsContent>

        {/* Proveedores Tab */}
        <TabsContent value="proveedores" className="space-y-6">
          <ProvidersTab />
        </TabsContent>

        <TabsContent value="generado" className="space-y-6">
          <GeneratedContentTab />
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          <JobsCostsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}