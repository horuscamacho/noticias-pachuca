"use client"

import { useState } from "react"
import { useExtractedNoticias, useGenerateFromNoticia, useMarkNoticiaAsProcessed } from "../../noticias/hooks/useNoticias"
import { useActiveTemplates } from "../hooks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sparkles,
  Clock,
  ExternalLink,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react"

export function GeneratorTab() {
  const [searchQuery, setSearchQuery] = useState("")
  const [domainFilter, setDomainFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [selectedNoticia, setSelectedNoticia] = useState<string>("")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState<string>("") // ID of noticia being processed

  // Build filters for query
  const filters = {
    page,
    limit: 20,
    ...(searchQuery && { search: searchQuery }),
    ...(domainFilter !== "all" && { domain: domainFilter }),
    isProcessed: false // Only show unprocessed news
  }

  const { data: noticiasData, isLoading, error } = useExtractedNoticias(filters)
  const { data: templates = [] } = useActiveTemplates()
  const generateMutation = useGenerateFromNoticia()
  const markProcessedMutation = useMarkNoticiaAsProcessed()

  const handleGenerateContent = async () => {
    if (!selectedNoticia || !selectedTemplate) return

    setIsGenerating(selectedNoticia)

    try {
      const result = await generateMutation.mutateAsync({
        noticiaId: selectedNoticia,
        templateId: selectedTemplate
      })

      // Mark noticia as processed
      await markProcessedMutation.mutateAsync(selectedNoticia)

      console.log('Generation started:', result)

      // Reset form
      setSelectedNoticia("")
      setSelectedTemplate("")
    } catch (error) {
      console.error('Failed to generate content:', error)
    } finally {
      setIsGenerating("")
    }
  }

  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '')
    } catch {
      return 'unknown'
    }
  }

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      if (!dateObj || isNaN(dateObj.getTime())) {
        return 'Fecha no disponible'
      }
      return new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(dateObj)
    } catch (error) {
      return 'Fecha no disponible'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <div className="text-muted-foreground">Cargando noticias extraídas...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <div className="text-red-600">Error al cargar noticias: {error.message}</div>
        </div>
      </div>
    )
  }

  const noticias = noticiasData?.data || []
  const pagination = noticiasData?.pagination

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Generador de Contenido AI</h3>
          <p className="text-sm text-muted-foreground">
            Convierte noticias extraídas en contenido editorial con inteligencia artificial
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar en título o contenido</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar noticias..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Fuente</Label>
              <Select value={domainFilter} onValueChange={setDomainFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las fuentes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las fuentes</SelectItem>
                  <SelectItem value="milenio.com">Milenio</SelectItem>
                  <SelectItem value="eluniversal.com.mx">El Universal</SelectItem>
                  <SelectItem value="jornada.com.mx">La Jornada</SelectItem>
                  <SelectItem value="excelsior.com.mx">Excélsior</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Noticias List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Noticias Disponibles para Generar Contenido
          </CardTitle>
          <CardDescription>
            {pagination?.totalItems || 0} noticias extraídas pendientes de procesar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Noticia</TableHead>
                <TableHead>Fuente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Calidad</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {noticias.map((noticia) => (
                <TableRow key={noticia._id || noticia.id}>
                  <TableCell className="max-w-md">
                    <div className="space-y-2">
                      <div className="font-medium line-clamp-2">{noticia.title}</div>
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {noticia.summary || noticia.content.substring(0, 150) + '...'}
                      </div>
                      {noticia.tags && noticia.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {noticia.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {noticia.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{noticia.tags.length - 3} más
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">
                        {getDomainFromUrl(noticia.sourceUrl)}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
                        onClick={() => window.open(noticia.sourceUrl, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Ver original
                      </Button>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        {formatDate(noticia.publishedAt)}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {noticia.metadata?.readingTime || '?'} min lectura
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <div className="text-sm font-medium">
                          {Math.round(noticia.extractionScore * 100)}%
                        </div>
                        {noticia.extractionScore > 0.8 ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {noticia.metadata?.wordCount || '?'} palabras
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          className="gap-2"
                          disabled={isGenerating === (noticia._id || noticia.id)}
                        >
                          {isGenerating === (noticia._id || noticia.id) ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Generando...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              Generar Contenido
                            </>
                          )}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Generar Contenido Editorial</DialogTitle>
                          <DialogDescription>
                            Selecciona un template para convertir esta noticia en contenido editorial
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="template">Template Editorial</Label>
                            <Select
                              value={selectedTemplate}
                              onValueChange={setSelectedTemplate}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un template" />
                              </SelectTrigger>
                              <SelectContent>
                                {templates.map((template) => (
                                  <SelectItem key={template.id} value={template.id}>
                                    <div className="space-y-1">
                                      <div className="font-medium">{template.name}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {template.type} • {template.agentConfiguration.editorialLine}
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="rounded-md bg-muted p-3 text-sm">
                            <div className="font-medium mb-1">{noticia.title}</div>
                            <div className="text-muted-foreground line-clamp-3">
                              {noticia.content.substring(0, 200)}...
                            </div>
                          </div>
                        </div>

                        <DialogFooter>
                          <Button
                            onClick={async () => {
                              console.log('🎯 BUTTON CLICKED!')
                              console.log('Noticia object:', noticia)
                              console.log('Selected template:', selectedTemplate)

                              if (!selectedTemplate) {
                                alert('Debes seleccionar un template')
                                return
                              }

                              const noticiaId = noticia._id || noticia.id
                              console.log('Using noticia ID:', noticiaId)

                              setIsGenerating(noticiaId)

                              try {
                                const result = await generateMutation.mutateAsync({
                                  noticia: noticia,
                                  templateId: selectedTemplate
                                })

                                await markProcessedMutation.mutateAsync(noticiaId)
                                console.log('Generation started:', result)

                                // Reset form and close modal
                                setSelectedNoticia("")
                                setSelectedTemplate("")

                                // Close the dialog by clicking the close button
                                const closeButton = document.querySelector('[data-dialog-close]') as HTMLElement
                                closeButton?.click()

                              } catch (error) {
                                console.error('Failed to generate content:', error)
                                alert(`Error: ${error.message}`)
                              } finally {
                                setIsGenerating("")
                              }
                            }}
                            disabled={!selectedTemplate || generateMutation.isPending}
                            className="gap-2"
                          >
                            {generateMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Generando...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4" />
                                Generar Contenido
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Página {pagination.currentPage} de {pagination.totalPages}
                ({pagination.totalItems} noticias total)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrev}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNext}
                  onClick={() => setPage(page + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}