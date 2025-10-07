"use client"

import { useState } from "react"
import { useTemplates, useDeleteTemplate, useTestTemplate } from "../hooks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
  FileText,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Play,
  Users,
  Calendar,
  Star,
  TrendingUp,
  Wand2
} from "lucide-react"
import { CreateTemplateSheet } from "./CreateTemplateSheet"
import { PromptGeneratorWizard } from "./PromptGeneratorWizard"

interface PromptTemplate {
  id: string
  name: string
  type: 'noticia' | 'columna' | 'trascendido' | 'seo-metadata'
  agentPersona: string
  isActive: boolean
  category?: string
  agentConfiguration: {
    editorialLine: 'neutral' | 'izquierda' | 'derecha' | 'crítica'
    politicalIntensity: number
    canHandlePolitics: boolean
    requiresReference: boolean
  }
  qualityMetrics?: {
    averageQualityScore: number
    usageCount: number
    successRate: number
    lastUsed?: Date | string
    userRatings: number[]
  }
  compatibleProviders?: string[]
  createdAt: Date
  updatedAt: Date
}

// Mock data - TODO: Replace with real TanStack Query
const mockTemplates: PromptTemplate[] = [
  {
    id: "1",
    name: "Reportero Objetivo",
    type: "noticia",
    agentPersona: "Periodista objetivo que presenta hechos de manera imparcial",
    isActive: true,
    category: "Periodismo",
    agentConfiguration: {
      editorialLine: "neutral",
      politicalIntensity: 0,
      canHandlePolitics: false,
      requiresReference: false
    },
    qualityMetrics: {
      averageQualityScore: 8.7,
      usageCount: 247,
      successRate: 98.4,
      lastUsed: new Date('2025-01-15'),
      userRatings: [5, 4, 5, 5, 4]
    },
    compatibleProviders: ["OpenAI", "Anthropic"],
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-15')
  },
  {
    id: "2",
    name: "Columnista Humor",
    type: "columna",
    agentPersona: "Columnista que analiza con humor inteligente y sarcasmo constructivo",
    isActive: true,
    category: "Opinión",
    agentConfiguration: {
      editorialLine: "crítica",
      politicalIntensity: 35,
      canHandlePolitics: true,
      requiresReference: false
    },
    qualityMetrics: {
      averageQualityScore: 9.2,
      usageCount: 156,
      successRate: 96.8,
      lastUsed: new Date('2025-01-14'),
      userRatings: [5, 5, 4, 5, 5]
    },
    compatibleProviders: ["OpenAI", "Anthropic"],
    createdAt: new Date('2025-01-08'),
    updatedAt: new Date('2025-01-14')
  },
  {
    id: "3",
    name: "Trascendido Político",
    type: "trascendido",
    agentPersona: "Especialista en rumores políticos fundamentados con fuentes reservadas",
    isActive: true,
    category: "Política",
    agentConfiguration: {
      editorialLine: "neutral",
      politicalIntensity: 60,
      canHandlePolitics: true,
      requiresReference: true
    },
    qualityMetrics: {
      averageQualityScore: 8.9,
      usageCount: 89,
      successRate: 94.2,
      lastUsed: new Date('2025-01-13'),
      userRatings: [4, 5, 5, 4, 5]
    },
    compatibleProviders: ["Anthropic"],
    createdAt: new Date('2025-01-05'),
    updatedAt: new Date('2025-01-13')
  },
  {
    id: "4",
    name: "SEO Optimizer",
    type: "seo-metadata",
    agentPersona: "Especialista en optimización SEO y metadata para contenido web",
    isActive: false,
    category: "Técnico",
    agentConfiguration: {
      editorialLine: "neutral",
      politicalIntensity: 0,
      canHandlePolitics: false,
      requiresReference: false
    },
    qualityMetrics: {
      averageQualityScore: 7.8,
      usageCount: 34,
      successRate: 91.2,
      lastUsed: new Date('2025-01-10'),
      userRatings: [4, 4, 3, 4, 4]
    },
    compatibleProviders: ["OpenAI"],
    createdAt: new Date('2025-01-02'),
    updatedAt: new Date('2025-01-10')
  }
]

export function TemplatesTab() {
  const { data: templates = [], isLoading, error } = useTemplates()
  const deleteTemplateMutation = useDeleteTemplate()
  const testTemplateMutation = useTestTemplate()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [showWizard, setShowWizard] = useState(false)

  // Use real data from backend, fallback to empty array if loading
  const templatesData = templates || []
  const filteredTemplates = templatesData.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.agentPersona.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === "all" || template.type === filterType
    return matchesSearch && matchesType
  })

  const getTypeColor = (type: string) => {
    switch (type) {
      case "noticia": return "bg-blue-100 text-blue-800"
      case "columna": return "bg-purple-100 text-purple-800"
      case "trascendido": return "bg-orange-100 text-orange-800"
      case "seo-metadata": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getEditorialLineColor = (line: string) => {
    switch (line) {
      case "neutral": return "bg-gray-100 text-gray-700"
      case "izquierda": return "bg-red-100 text-red-700"
      case "derecha": return "bg-blue-100 text-blue-700"
      case "crítica": return "bg-yellow-100 text-yellow-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteTemplateMutation.mutateAsync(templateId)
    } catch (error) {
      console.error('Delete template failed:', error)
    }
  }

  const handleTestTemplate = async (templateId: string) => {
    try {
      await testTemplateMutation.mutateAsync({
        templateId,
        testData: {
          title: "Título de prueba",
          content: "Contenido de prueba para el template",
          referenceContent: "Contenido de referencia opcional"
        }
      })
    } catch (error) {
      console.error('Test template failed:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="text-muted-foreground">Cargando templates...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="text-red-600">Error al cargar templates: {error.message}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Templates de Prompts</h3>
          <p className="text-sm text-muted-foreground">
            Gestiona tus templates reutilizables para diferentes tipos de contenido
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowWizard(true)}
          >
            <Wand2 className="h-4 w-4" />
            Generar con Wizard
          </Button>
          <CreateTemplateSheet />
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              {filterType === "all" ? "Todos los tipos" : filterType}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterType("all")}>
              Todos los tipos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType("noticia")}>
              Noticias
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType("columna")}>
              Columnas
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType("trascendido")}>
              Trascendidos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType("seo-metadata")}>
              SEO/Metadata
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Templates Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Línea Editorial</TableHead>
                <TableHead>Uso</TableHead>
                <TableHead>Calidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {template.agentPersona.substring(0, 60)}...
                      </div>
                      <div className="flex items-center gap-1">
                        {(template.compatibleProviders || []).map(provider => (
                          <Badge key={provider} variant="outline" className="text-xs">
                            {provider}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge className={getTypeColor(template.type)}>
                      {template.type}
                    </Badge>
                    {template.category && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {template.category}
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    <Badge className={getEditorialLineColor(template.agentConfiguration.editorialLine)}>
                      {template.agentConfiguration.editorialLine}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {template.agentConfiguration.politicalIntensity}% intensidad
                    </div>
                  </TableCell>

                  <TableCell>
                    {template.qualityMetrics && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="h-3 w-3" />
                          {template.qualityMetrics.usageCount || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {template.qualityMetrics.successRate || 0}% éxito
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {template.qualityMetrics.lastUsed ?
                            new Date(template.qualityMetrics.lastUsed).toLocaleDateString() :
                            'Nunca usado'
                          }
                        </div>
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    {template.qualityMetrics && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="text-sm">
                          {template.qualityMetrics.averageQualityScore || 0}/10
                        </span>
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    <Badge variant={template.isActive ? "default" : "secondary"}>
                      {template.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleTestTemplate(template.id)}>
                          <Play className="h-4 w-4 mr-2" />
                          Probar Template
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar template?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción eliminará permanentemente el template "{template.name}".
                                Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteTemplate(template.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templatesData.length}</div>
            <p className="text-xs text-muted-foreground">
              {templatesData.filter(t => t.isActive).length} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Más Usado</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const mostUsed = templatesData
                .filter(t => t.qualityMetrics?.usageCount)
                .sort((a, b) => (b.qualityMetrics?.usageCount || 0) - (a.qualityMetrics?.usageCount || 0))[0]
              return mostUsed ? (
                <>
                  <div className="text-sm font-medium">{mostUsed.name}</div>
                  <p className="text-xs text-muted-foreground">{mostUsed.qualityMetrics?.usageCount || 0} usos</p>
                </>
              ) : (
                <>
                  <div className="text-sm font-medium">-</div>
                  <p className="text-xs text-muted-foreground">Sin datos</p>
                </>
              )
            })()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Calidad Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const templatesWithQuality = templatesData.filter(t => t.qualityMetrics?.averageQualityScore)
              const avgQuality = templatesWithQuality.length > 0
                ? templatesWithQuality.reduce((sum, t) => sum + (t.qualityMetrics?.averageQualityScore || 0), 0) / templatesWithQuality.length
                : 0
              return (
                <>
                  <div className="text-2xl font-bold">{avgQuality.toFixed(1)}/10</div>
                  <p className="text-xs text-muted-foreground">Promedio general</p>
                </>
              )
            })()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tasa de Éxito</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const templatesWithSuccess = templatesData.filter(t => t.qualityMetrics?.successRate)
              const avgSuccess = templatesWithSuccess.length > 0
                ? templatesWithSuccess.reduce((sum, t) => sum + (t.qualityMetrics?.successRate || 0), 0) / templatesWithSuccess.length
                : 0
              return (
                <>
                  <div className="text-2xl font-bold">{avgSuccess.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Promedio general</p>
                </>
              )
            })()}
          </CardContent>
        </Card>
      </div>

      {/* 🧙‍♂️ Wizard Modal/Overlay */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-4xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Generador de Prompts con IA</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWizard(false)}
                className="text-white hover:bg-white/20"
              >
                ✕ Cerrar
              </Button>
            </div>
            <PromptGeneratorWizard />
          </div>
        </div>
      )}
    </div>
  )
}