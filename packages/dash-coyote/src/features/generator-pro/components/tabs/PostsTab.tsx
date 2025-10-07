import { useState } from 'react'
import { toast } from 'sonner'
import {
  IconEye,
  IconSparkles,
  IconLoader2,
  IconAlertCircle,
  IconCheck,
  IconClock,
  IconBrandFacebook,
  IconBrandTwitter,
  IconHash,
  IconCalendar,
  IconUser,
  IconCoins,
  IconClock2,
} from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import {
  useExtractedContent,
  useContentAgents,
  useGenerateContentWithAgent,
  useGeneratedContent,
  useContentGenerationSocket,
} from '../../hooks'

interface ExtractedContent {
  id: string
  title: string
  content: string
  url: string
  websiteId: string
  websiteName?: string
  author?: string
  category?: string
  imageUrl?: string
  publishedAt?: string
  extractedAt: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

interface ContentAgent {
  id: string
  name: string
  agentType: string
  description: string
  isActive: boolean
}

interface GeneratedContent {
  id: string
  extractedNoticiaId: string // Cambiado de extractedContentId
  agentId: string
  agentName?: string
  generatedTitle: string
  generatedContent: string
  generatedSummary?: string
  generatedKeywords?: string[]
  generatedTags?: string[]
  generatedCategory?: string
  socialMediaCopies?: {
    facebook?: {
      hook: string
      copy: string
      emojis: string[]
      hookType: 'Scary' | 'FreeValue' | 'Strange' | 'Sexy' | 'Familiar'
      estimatedEngagement: 'high' | 'medium' | 'low'
    }
    twitter?: {
      tweet: string
      hook: string
      emojis: string[]
      hookType: string
      threadIdeas: string[]
    }
    instagram?: string
    linkedin?: string
  }
  generationMetadata?: {
    model?: string
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
    cost?: number
    processingTime?: number
    temperature?: number
    maxTokens?: number
    finishReason?: string
    contentQuality?: number
    aiProvider?: string
    tokensUsed?: number
    costEstimate?: number
  }
  createdAt: string
  status: string
}

export function PostsTab() {
  const [selectedAgents, setSelectedAgents] = useState<Record<string, string>>({})
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [selectedGeneratedContentId, setSelectedGeneratedContentId] = useState<string | null>(null)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  // Queries
  const { data: postsData, isLoading: isLoadingPosts } = useExtractedContent({
    status: 'extracted',
  })
  const { data: agentsData, isLoading: isLoadingAgents } = useContentAgents({ isActive: true })
  const { data: generatedData } = useGeneratedContent({})
  const generateMutation = useGenerateContentWithAgent()

  // Socket para eventos de generación en tiempo real
  useContentGenerationSocket({
    onGenerationStarted: (data) => {
      setProcessingIds((prev) => new Set(prev).add(data.extractedContentId))
    },
    onGenerationCompleted: (data) => {
      setProcessingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(data.extractedContentId)
        return newSet
      })
    },
    onGenerationFailed: (data) => {
      setProcessingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(data.extractedContentId)
        return newSet
      })
    },
  })

  const posts = postsData?.content || []
  const agents = agentsData || []
  const generatedContents = generatedData?.generated || []

  // Helper: Get generated count for a post
  const getGeneratedCount = (postId: string): number => {
    return generatedContents.filter((g) => g.extractedNoticiaId === postId).length
  }

  // Helper: Get status based on generated count
  const getPostStatus = (postId: string): 'pending' | 'processing' | 'completed' => {
    const count = getGeneratedCount(postId)
    if (processingIds.has(postId)) return 'processing'
    if (count > 0) return 'completed'
    return 'pending'
  }

  // Helper: Get badge variant for status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { variant: 'default' as const, icon: IconCheck, text: 'Completado', className: 'bg-green-500' }
      case 'processing':
        return { variant: 'secondary' as const, icon: IconLoader2, text: 'Procesando', className: 'bg-blue-500' }
      case 'pending':
        return { variant: 'outline' as const, icon: IconClock, text: 'Pendiente', className: '' }
      default:
        return { variant: 'outline' as const, icon: IconAlertCircle, text: 'Desconocido', className: '' }
    }
  }

  // Handlers
  const handleAgentSelect = (postId: string, agentId: string) => {
    setSelectedAgents((prev) => ({
      ...prev,
      [postId]: agentId,
    }))
  }

  const handleGenerateSingle = async (postId: string) => {
    const agentId = selectedAgents[postId]
    if (!agentId) {
      toast.error('Selecciona un agente primero')
      return
    }

    try {
      // Agregar a processingIds inmediatamente para feedback visual instantáneo
      setProcessingIds((prev) => new Set(prev).add(postId))

      // Disparar la request, los eventos de socket actualizarán el estado
      await generateMutation.mutateAsync({
        extractedContentId: postId,
        agentId,
      })

      // Toast ya se muestra en el socket hook
    } catch (error) {
      console.error('Error generating content:', error)
      // Remover de processingIds si falla antes de que llegue el evento del socket
      setProcessingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
      toast.error('Error al iniciar la generación')
    }
  }

  const handleGenerateBatch = async () => {
    const postsToProcess = posts.filter((post) => selectedAgents[post.id])

    if (postsToProcess.length === 0) {
      toast.error('Selecciona al menos un agente para procesar')
      return
    }

    toast.info(`Iniciando generación de ${postsToProcess.length} posts...`, { duration: 3000 })

    // Disparar todas las requests, los eventos de socket manejan el estado individual
    for (const post of postsToProcess) {
      try {
        await generateMutation.mutateAsync({
          extractedContentId: post.id,
          agentId: selectedAgents[post.id],
        })
      } catch (error) {
        console.error(`Error processing post ${post.id}:`, error)
      }
    }

    // Los toasts de éxito/error se muestran individualmente en el socket hook
  }

  const handleViewPost = (postId: string) => {
    setSelectedPostId(postId)
  }

  const handleCloseSheet = () => {
    setSelectedPostId(null)
  }

  const handleOpenGeneratedContent = (generatedContentId: string) => {
    setSelectedGeneratedContentId(generatedContentId)
    setSelectedPostId(null) // Cerrar el sheet de post details
  }

  const handleCloseGeneratedContent = () => {
    setSelectedGeneratedContentId(null)
    // Volver a abrir el sheet de post details si hay un post seleccionado
    if (selectedPost) {
      setSelectedPostId(selectedPost.id)
    }
  }

  // Get selected post and its generated contents
  const selectedPost = posts.find((p) => p.id === selectedPostId)
  const selectedPostGeneratedContents = selectedPostId
    ? generatedContents.filter((g) => g.extractedNoticiaId === selectedPostId)
    : []

  // Get selected generated content
  const selectedGeneratedContent = selectedGeneratedContentId
    ? generatedContents.find((g) => g.id === selectedGeneratedContentId)
    : null

  const hasSelectedAgents = Object.keys(selectedAgents).length > 0

  if (isLoadingPosts || isLoadingAgents) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Cargando posts...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Posts Extraídos</h2>
          <p className="text-muted-foreground">
            Gestiona qué agente procesa cada post extraído
          </p>
        </div>
        <Button
          onClick={handleGenerateBatch}
          disabled={!hasSelectedAgents || generateMutation.isPending}
          size="lg"
        >
          {generateMutation.isPending ? (
            <>
              <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <IconSparkles className="mr-2 h-4 w-4" />
              Procesar Seleccionados
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{posts.length}</div>
            <p className="text-xs text-muted-foreground">posts extraídos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Con Agente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(selectedAgents).length}</div>
            <p className="text-xs text-muted-foreground">asignados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Generados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{generatedContents.length}</div>
            <p className="text-xs text-muted-foreground">contenidos creados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Agentes Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.length}</div>
            <p className="text-xs text-muted-foreground">disponibles</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Posts</CardTitle>
          <CardDescription>
            Selecciona un agente para cada post y genera contenido
          </CardDescription>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <IconAlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay posts extraídos</h3>
              <p className="text-muted-foreground">
                Ve a la pestaña "Contenido" para extraer posts de sitios web
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[45%]">Título / Contenido</TableHead>
                    <TableHead>Sitio Web</TableHead>
                    <TableHead>Fecha Extracción</TableHead>
                    <TableHead className="w-[200px]">Agente</TableHead>
                    <TableHead className="text-center"># Generados</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => {
                    const status = getPostStatus(post.id)
                    const statusBadge = getStatusBadge(status)
                    const generatedCount = getGeneratedCount(post.id)
                    const StatusIcon = statusBadge.icon

                    return (
                      <TableRow key={post.id}>
                        <TableCell className="max-w-md">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="space-y-2">
                                  <div className="font-medium line-clamp-2 cursor-help">
                                    {post.title}
                                  </div>
                                  <div className="text-xs text-muted-foreground line-clamp-2">
                                    {post.content?.substring(0, 100)}...
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-md">
                                <p>{post.title}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>

                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {post.websiteName || 'N/A'}
                          </span>
                        </TableCell>

                        <TableCell>
                          <span className="text-sm">
                            {new Date(post.extractedAt).toLocaleDateString('es-MX', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </span>
                        </TableCell>

                        <TableCell>
                          <Select
                            value={selectedAgents[post.id] || ''}
                            onValueChange={(value) => handleAgentSelect(post.id, value)}
                            disabled={processingIds.has(post.id)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar agente" />
                            </SelectTrigger>
                            <SelectContent>
                              {agents.map((agent) => (
                                <SelectItem key={agent.id} value={agent.id}>
                                  {agent.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge variant={generatedCount > 0 ? 'default' : 'secondary'}>
                            {generatedCount}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge
                            variant={statusBadge.variant}
                            className={statusBadge.className}
                          >
                            <StatusIcon
                              className={`h-3 w-3 mr-1 ${
                                status === 'processing' ? 'animate-spin' : ''
                              }`}
                            />
                            {statusBadge.text}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewPost(post.id)}
                            >
                              <IconEye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleGenerateSingle(post.id)}
                              disabled={
                                !selectedAgents[post.id] || processingIds.has(post.id)
                              }
                            >
                              {processingIds.has(post.id) ? (
                                <IconLoader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <IconSparkles className="h-4 w-4 mr-1" />
                                  Generar
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sheet para Ver Contenido */}
      <Sheet open={!!selectedPostId} onOpenChange={handleCloseSheet}>
        <SheetContent className="w-full sm:max-w-4xl flex flex-col">
          {selectedPost && (
            <>
              {/* Fixed Header */}
              <SheetHeader className="px-6 py-4 border-b flex-shrink-0">
                <SheetTitle className="text-lg font-semibold">
                  {selectedPost.title}
                </SheetTitle>
                <SheetDescription className="text-sm">
                  Extraído de sitio desconocido el{' '}
                  {new Date(selectedPost.extractedAt).toLocaleDateString('es-MX')}
                </SheetDescription>
              </SheetHeader>

              {/* Scrollable Content */}
              <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-6">

                {/* Imagen del Post */}
                {selectedPost.imageUrl && (
                  <Card>
                    <CardContent className="p-4">
                      <img
                        src={selectedPost.imageUrl}
                        alt={selectedPost.title}
                        className="w-full h-auto rounded-lg object-cover max-h-96"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Información del Post */}
                <Card>
                  <CardHeader>
                    <CardTitle>Información del Post</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {selectedPost.author && (
                        <div>
                          <span className="font-medium text-muted-foreground">Autor:</span>
                          <p className="mt-1">{selectedPost.author}</p>
                        </div>
                      )}
                      {selectedPost.category && (
                        <div>
                          <span className="font-medium text-muted-foreground">Categoría:</span>
                          <p className="mt-1">{selectedPost.category}</p>
                        </div>
                      )}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-muted-foreground">URL:</span>
                      <a
                        href={selectedPost.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline block mt-1 break-all"
                      >
                        {selectedPost.url}
                      </a>
                    </div>
                  </CardContent>
                </Card>

                {/* Contenido Extraído */}
                <Card>
                  <CardHeader>
                    <CardTitle>Contenido Extraído</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-4 rounded-lg max-h-64 overflow-y-auto">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {selectedPost.content}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Acciones Rápidas */}
                <Card>
                  <CardHeader>
                    <CardTitle>Acciones Rápidas</CardTitle>
                    <CardDescription>
                      Genera contenido con un agente específico
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {agents.map((agent) => (
                        <Button
                          key={agent.id}
                          variant="outline"
                          className="justify-start"
                          onClick={async () => {
                            try {
                              await generateMutation.mutateAsync({
                                extractedContentId: selectedPost.id,
                                agentId: agent.id,
                              })
                              toast.success(`Contenido generado con ${agent.name}`)
                            } catch (error) {
                              toast.error('Error al generar contenido')
                            }
                          }}
                          disabled={generateMutation.isPending}
                        >
                          <IconSparkles className="mr-2 h-4 w-4" />
                          {agent.name}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Contenidos Generados */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Contenidos Generados ({selectedPostGeneratedContents.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedPostGeneratedContents.length === 0 ? (
                      <div className="text-center py-8">
                        <IconAlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Aún no se ha generado contenido de este post
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedPostGeneratedContents.map((generated) => (
                          <Card key={generated.id}>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base">
                                {generated.generatedTitle}
                              </CardTitle>
                              <CardDescription>
                                Generado el{' '}
                                {new Date(generated.createdAt).toLocaleDateString('es-MX')}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm line-clamp-3">
                                {generated.generatedContent}
                              </p>
                              <Button
                                variant="default"
                                className="mt-2"
                                onClick={() => handleOpenGeneratedContent(generated.id)}
                              >
                                Ver contenido completo
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Sheet para Ver Contenido Generado Completo */}
      <Sheet open={!!selectedGeneratedContentId} onOpenChange={handleCloseGeneratedContent}>
        <SheetContent className="w-full sm:max-w-4xl flex flex-col">
          {selectedGeneratedContent && (
            <>
              {/* Header */}
              <div className="flex-shrink-0 sticky top-0 bg-background z-10 pb-4 border-b px-6 pt-6">
                <SheetHeader>
                  <SheetTitle className="text-xl font-bold">
                    {selectedGeneratedContent.generatedTitle}
                  </SheetTitle>
                  <SheetDescription className="text-sm">
                    Generado el{' '}
                    {new Date(selectedGeneratedContent.createdAt).toLocaleDateString('es-MX', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </SheetDescription>
                </SheetHeader>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {/* Agente Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <IconUser className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-sm">Agente Utilizado</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium">
                      {selectedGeneratedContent.agentName || 'Agente desconocido'}
                    </p>
                  </CardContent>
                </Card>

                {/* Contenido Completo */}
                <Card>
                  <CardHeader>
                    <CardTitle>Contenido Generado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={selectedGeneratedContent.generatedContent}
                      readOnly
                      className="min-h-[300px] resize-none bg-muted font-mono text-sm"
                    />
                  </CardContent>
                </Card>

                {/* Resumen */}
                {selectedGeneratedContent.generatedSummary && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Resumen</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedGeneratedContent.generatedSummary}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Copys de Facebook */}
                {selectedGeneratedContent.socialMediaCopies?.facebook && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <IconBrandFacebook className="h-5 w-5 text-blue-600" />
                        <CardTitle>Copy de Facebook</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Hook ({selectedGeneratedContent.socialMediaCopies.facebook.hookType})
                        </p>
                        <p className="text-sm font-semibold">
                          {selectedGeneratedContent.socialMediaCopies.facebook.hook}
                        </p>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Copy</p>
                        <p className="text-sm whitespace-pre-wrap">
                          {selectedGeneratedContent.socialMediaCopies.facebook.copy}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-muted-foreground">Emojis:</p>
                        <div className="flex gap-1">
                          {selectedGeneratedContent.socialMediaCopies.facebook.emojis.map(
                            (emoji, idx) => (
                              <span key={idx} className="text-lg">
                                {emoji}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          Engagement Estimado:
                        </p>
                        <Badge
                          variant={
                            selectedGeneratedContent.socialMediaCopies.facebook
                              .estimatedEngagement === 'high'
                              ? 'default'
                              : selectedGeneratedContent.socialMediaCopies.facebook
                                  .estimatedEngagement === 'medium'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {selectedGeneratedContent.socialMediaCopies.facebook.estimatedEngagement}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Copys de Twitter/X */}
                {selectedGeneratedContent.socialMediaCopies?.twitter && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <IconBrandTwitter className="h-5 w-5 text-blue-500" />
                        <CardTitle>Copy de Twitter/X</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Hook ({selectedGeneratedContent.socialMediaCopies.twitter.hookType})
                        </p>
                        <p className="text-sm font-semibold">
                          {selectedGeneratedContent.socialMediaCopies.twitter.hook}
                        </p>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Tweet</p>
                        <p className="text-sm whitespace-pre-wrap">
                          {selectedGeneratedContent.socialMediaCopies.twitter.tweet}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-muted-foreground">Emojis:</p>
                        <div className="flex gap-1">
                          {selectedGeneratedContent.socialMediaCopies.twitter.emojis.map(
                            (emoji, idx) => (
                              <span key={idx} className="text-lg">
                                {emoji}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                      {selectedGeneratedContent.socialMediaCopies.twitter.threadIdeas &&
                        selectedGeneratedContent.socialMediaCopies.twitter.threadIdeas.length >
                          0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                              Ideas para Hilo:
                            </p>
                            <ul className="list-disc list-inside space-y-1">
                              {selectedGeneratedContent.socialMediaCopies.twitter.threadIdeas.map(
                                (idea, idx) => (
                                  <li key={idx} className="text-sm">
                                    {idea}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                )}

                {/* Keywords */}
                {selectedGeneratedContent.generatedKeywords &&
                  selectedGeneratedContent.generatedKeywords.length > 0 && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <IconHash className="h-4 w-4 text-muted-foreground" />
                          <CardTitle>Keywords Generados</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {selectedGeneratedContent.generatedKeywords.map((keyword, idx) => (
                            <Badge key={idx} variant="secondary">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Tags */}
                {selectedGeneratedContent.generatedTags &&
                  selectedGeneratedContent.generatedTags.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Tags</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {selectedGeneratedContent.generatedTags.map((tag, idx) => (
                            <Badge key={idx} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Categoría */}
                {selectedGeneratedContent.generatedCategory && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Categoría</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="default">{selectedGeneratedContent.generatedCategory}</Badge>
                    </CardContent>
                  </Card>
                )}

                {/* Metadata de Generación */}
                {selectedGeneratedContent.generationMetadata && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Metadata de Generación</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {selectedGeneratedContent.generationMetadata.model && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Modelo</p>
                            <p className="mt-1 font-mono text-xs">
                              {selectedGeneratedContent.generationMetadata.model}
                            </p>
                          </div>
                        )}
                        {selectedGeneratedContent.generationMetadata.totalTokens && (
                          <div className="flex items-center gap-2">
                            <IconHash className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Tokens</p>
                              <p className="mt-1">
                                {selectedGeneratedContent.generationMetadata.totalTokens.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )}
                        {selectedGeneratedContent.generationMetadata.cost !== undefined && (
                          <div className="flex items-center gap-2">
                            <IconCoins className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Costo</p>
                              <p className="mt-1">
                                ${selectedGeneratedContent.generationMetadata.cost.toFixed(4)}
                              </p>
                            </div>
                          </div>
                        )}
                        {selectedGeneratedContent.generationMetadata.processingTime && (
                          <div className="flex items-center gap-2">
                            <IconClock2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Tiempo</p>
                              <p className="mt-1">
                                {(
                                  selectedGeneratedContent.generationMetadata.processingTime / 1000
                                ).toFixed(2)}{' '}
                                s
                              </p>
                            </div>
                          </div>
                        )}
                        {selectedGeneratedContent.generationMetadata.temperature !== undefined && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">
                              Temperatura
                            </p>
                            <p className="mt-1">
                              {selectedGeneratedContent.generationMetadata.temperature}
                            </p>
                          </div>
                        )}
                        {selectedGeneratedContent.generationMetadata.contentQuality && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">
                              Calidad del Contenido
                            </p>
                            <p className="mt-1">
                              {selectedGeneratedContent.generationMetadata.contentQuality}%
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Información de Fecha */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <IconCalendar className="h-4 w-4 text-muted-foreground" />
                      <CardTitle>Información de Generación</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      <p className="text-muted-foreground">Fecha de generación</p>
                      <p className="mt-1 font-medium">
                        {new Date(selectedGeneratedContent.createdAt).toLocaleString('es-MX', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
