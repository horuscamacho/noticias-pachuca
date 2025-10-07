"use client"

import { useState } from "react"
import { useGeneratedContent, usePublishContent, useExportContent, useRateContent } from "../hooks"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sparkles,
  Search,
  MoreHorizontal,
  Eye,
  Download,
  Share,
  Filter,
  Calendar,
  Clock,
  Star,
  TrendingUp,
  CheckCircle,
  XCircle,
  RefreshCw
} from "lucide-react"

interface GeneratedContent {
  id: string
  originalTitle: string
  originalContent: string
  generatedTitle: string
  generatedContent: string
  keywords: string[]
  tags: string[]
  category: string
  summary: string
  templateName: string
  templateType: 'noticia' | 'columna' | 'trascendido' | 'seo-metadata'
  editorialLine: 'neutral' | 'izquierda' | 'derecha' | 'crítica'
  status: 'completed' | 'failed' | 'processing'
  qualityScore?: number
  generatedAt: Date
  processingTime: number // ms
  tokensUsed: number
  cost: number
  aiProvider: string
  isPublished: boolean
  publishedAt?: Date
}

// Mock data - TODO: Replace with real TanStack Query
const mockGeneratedContent: GeneratedContent[] = [
  {
    id: "1",
    originalTitle: "Nuevo estadio de fútbol será inaugurado en diciembre",
    originalContent: "La construcción del nuevo estadio de fútbol avanza según cronograma...",
    generatedTitle: "Pachuca estrena estadio de última generación: Una joya arquitectónica que revoluciona el deporte local",
    generatedContent: "El esperado momento ha llegado. Pachuca se prepara para inaugurar una obra maestra del deporte moderno...",
    keywords: ["estadio", "fútbol", "Pachuca", "inauguración", "arquitectura"],
    tags: ["deportes", "infraestructura", "ciudad"],
    category: "Deportes",
    summary: "Pachuca inaugura un estadio de última generación con tecnología de punta.",
    templateName: "Reportero Deportivo",
    templateType: "noticia",
    editorialLine: "neutral",
    status: "completed",
    qualityScore: 9.2,
    generatedAt: new Date('2025-01-15T10:30:00'),
    processingTime: 2340,
    tokensUsed: 1247,
    cost: 0.0623,
    aiProvider: "OpenAI",
    isPublished: true,
    publishedAt: new Date('2025-01-15T11:00:00')
  },
  {
    id: "2",
    originalTitle: "Reforma fiscal genera debate en congreso",
    originalContent: "Los diputados discuten los puntos principales de la nueva reforma fiscal...",
    generatedTitle: "La reforma fiscal que nadie pidió: Cuando el gobierno juega al Monopoly con nuestro dinero",
    generatedContent: "Ah, qué sorpresa. Otra reforma fiscal. Como si fuera Navidad, pero al revés...",
    keywords: ["reforma", "fiscal", "congreso", "impuestos", "política"],
    tags: ["política", "economía", "gobierno"],
    category: "Política",
    summary: "Análisis humorístico de la reforma fiscal y sus implicaciones para los ciudadanos.",
    templateName: "Columnista Humor",
    templateType: "columna",
    editorialLine: "crítica",
    status: "completed",
    qualityScore: 8.7,
    generatedAt: new Date('2025-01-14T15:45:00'),
    processingTime: 3100,
    tokensUsed: 1680,
    cost: 0.084,
    aiProvider: "Anthropic",
    isPublished: false
  },
  {
    id: "3",
    originalTitle: "Empresa minera solicita nuevos permisos",
    originalContent: "La empresa minera XYZ ha presentado documentación para obtener permisos...",
    generatedTitle: "Trascendido: Minera negocia en secreto expansión millonaria con funcionarios estatales",
    generatedContent: "Fuentes cercanas al gobierno estatal revelan que la empresa minera XYZ mantiene reuniones reservadas...",
    keywords: ["minería", "permisos", "gobierno", "negociaciones", "exclusiva"],
    tags: ["investigación", "minería", "corrupción"],
    category: "Investigación",
    summary: "Revelaciones sobre negociaciones secretas entre empresa minera y gobierno.",
    templateName: "Trascendido Político",
    templateType: "trascendido",
    editorialLine: "neutral",
    status: "completed",
    qualityScore: 9.5,
    generatedAt: new Date('2025-01-13T09:15:00'),
    processingTime: 4200,
    tokensUsed: 2130,
    cost: 0.1065,
    aiProvider: "Anthropic",
    isPublished: true,
    publishedAt: new Date('2025-01-13T12:00:00')
  },
  {
    id: "4",
    originalTitle: "Festival cultural en el centro histórico",
    originalContent: "El próximo fin de semana se realizará el festival cultural anual...",
    generatedTitle: "ERROR: Procesamiento fallido",
    generatedContent: "",
    keywords: [],
    tags: [],
    category: "",
    summary: "",
    templateName: "Reportero Cultural",
    templateType: "noticia",
    editorialLine: "neutral",
    status: "failed",
    generatedAt: new Date('2025-01-12T14:20:00'),
    processingTime: 15000,
    tokensUsed: 0,
    cost: 0,
    aiProvider: "OpenAI",
    isPublished: false
  }
]

export function GeneratedContentTab() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Build filters for query
  const filters = {
    ...(statusFilter !== "all" && { status: statusFilter as 'pending' | 'processing' | 'completed' | 'failed' }),
    // limit: 50  // Temporalmente deshabilitado para debug
  }

  const { data: content = [], isLoading, error } = useGeneratedContent(filters)
  const publishContentMutation = usePublishContent()
  const exportContentMutation = useExportContent()
  const rateContentMutation = useRateContent()

  const filteredContent = content.filter(item => {
    const originalTitle = item.originalContent?.title || ""
    const generatedTitle = item.generatedTitle || ""
    const templateName = item.template?.name || ""

    const matchesSearch = originalTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         generatedTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         templateName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800"
      case "failed": return "bg-red-100 text-red-800"
      case "processing": return "bg-yellow-100 text-yellow-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4" />
      case "failed": return <XCircle className="h-4 w-4" />
      case "processing": return <RefreshCw className="h-4 w-4 animate-spin" />
      default: return null
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

  const handleExport = async (contentId: string, format: 'json' | 'html' | 'markdown' = 'json') => {
    try {
      const blob = await exportContentMutation.mutateAsync({ id: contentId, format })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `content-${contentId}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handlePublish = async (contentId: string) => {
    try {
      await publishContentMutation.mutateAsync(contentId)
    } catch (error) {
      console.error('Publish failed:', error)
    }
  }

  const handleRate = async (contentId: string, rating: number, feedback?: string) => {
    try {
      await rateContentMutation.mutateAsync({ id: contentId, rating, feedback })
    } catch (error) {
      console.error('Rating failed:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="text-muted-foreground">Cargando contenido generado...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="text-red-600">Error al cargar contenido: {error.message}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Contenido Generado</h3>
          <p className="text-sm text-muted-foreground">
            Historial y gestión de todo el contenido creado con IA
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Todo
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contenido..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              {statusFilter === "all" ? "Todos los estados" : statusFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>
              Todos los estados
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("completed")}>
              Completados
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("failed")}>
              Fallidos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("processing")}>
              Procesando
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contenido</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Calidad</TableHead>
                <TableHead>Costo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContent.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="space-y-1 max-w-md">
                      <div className="font-medium text-sm">
                        {item.status === "completed" ? item.generatedTitle : (item.originalContent?.title || 'Sin título')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Original: {item.originalContent?.title?.substring(0, 50) || 'No disponible'}...
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {item.category || "Sin categoría"}
                        </Badge>
                        <Badge className={getEditorialLineColor(item.editorialLine)}>
                          {item.editorialLine}
                        </Badge>
                        {item.isPublished && (
                          <Badge variant="default" className="text-xs">
                            Publicado
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">{item.template?.name}</div>
                      <div className="text-xs text-muted-foreground">{item.templateType}</div>
                      <div className="text-xs text-muted-foreground">{item.provider?.name}</div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status || 'pending')}
                      <Badge className={getStatusColor(item.status || 'pending')}>
                        {item.status || 'pending'}
                      </Badge>
                    </div>
                    {item.status === "completed" && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {item.processingTime}ms
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    {item.qualityScore && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="text-sm">{item.qualityScore}/10</span>
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">${(item.generationMetadata?.cost || 0).toFixed(4)}</div>
                      <div className="text-xs text-muted-foreground">
                        {(item.generationMetadata?.totalTokens || 0).toLocaleString()} tokens
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        {item.generatedAt ? new Date(item.generatedAt).toLocaleDateString() : 'Fecha no disponible'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.generatedAt ? new Date(item.generatedAt).toLocaleTimeString() : 'Hora no disponible'}
                      </div>
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
                        <Dialog>
                          <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Comparación
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DialogContent className="!max-w-[85vw] !w-[85vw] max-h-[90vh] overflow-hidden sm:!max-w-[85vw] flex flex-col">
                            <div className="flex-shrink-0 sticky top-0 bg-background z-0 pb-4 border-b">
                              <DialogHeader>
                                <DialogTitle>Comparación: Original vs Generado</DialogTitle>
                                <DialogDescription className="text-muted-foreground">
                                  Template: {item.template?.name} | Proveedor: {item.provider?.name}
                                </DialogDescription>
                              </DialogHeader>
                            </div>
                            <div className="flex-1 overflow-y-auto py-4">
                              <div className="grid grid-cols-2 gap-6">
                                <Card className="h-fit">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">📄 Contenido Original</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                      <h5 className="font-semibold text-sm mb-2 leading-tight line-clamp-2">{item.originalContent?.title || 'Sin título disponible'}</h5>
                                      <div className="prose prose-sm max-w-none">
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{item.originalContent?.content || 'Sin contenido disponible'}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                                <Card className="h-fit">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">✨ Contenido Generado</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                      <h5 className="font-semibold text-sm mb-2 leading-tight line-clamp-2">{item.generatedTitle}</h5>
                                      <div className="prose prose-sm max-w-none">
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{item.generatedContent}</p>
                                      </div>
                                    </div>
                                    {item.generatedKeywords?.length > 0 && (
                                      <div className="border-t pt-3">
                                        <p className="text-xs font-semibold mb-2">🏷️ Keywords:</p>
                                        <div className="flex gap-2 flex-wrap">
                                          {item.generatedKeywords.map(keyword => (
                                            <Badge key={keyword} variant="secondary" className="text-xs">
                                              {keyword}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {item.status === "completed" && !item.isPublished && (
                          <DropdownMenuItem onClick={() => handlePublish(item.id)}>
                            <Share className="h-4 w-4 mr-2" />
                            Publicar
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem onClick={() => handleExport(item.id)}>
                          <Download className="h-4 w-4 mr-2" />
                          Exportar
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

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Generado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{content.length}</div>
            <p className="text-xs text-muted-foreground">
              {content.filter(c => c.status === "completed").length} exitosos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tasa de Éxito</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((content.filter(c => c.status === "completed").length / content.length) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">+2.1% vs mes anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Costo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${content.reduce((sum, c) => sum + c.cost, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Calidad Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(content.filter(c => c.qualityScore).reduce((sum, c) => sum + (c.qualityScore || 0), 0) /
                content.filter(c => c.qualityScore).length).toFixed(1)}/10
            </div>
            <p className="text-xs text-muted-foreground">+0.3 vs mes anterior</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}