import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  IconSparkles,
  IconCopy,
  IconChevronDown,
  IconCheck,
  IconEdit,
  IconBrandFacebook,
  IconBrandTwitter,
  IconX,
  IconLoader2,
} from '@tabler/icons-react'
import { toast } from 'sonner'
import { useExtractedContent, useContentAgents, useGenerateContentWithAgent } from '../../hooks'
import type { GeneratedContent } from '../../types/content-generation.types'
import type { ContentAgent } from '../../hooks/useContentAgents'

export function ContenidoTab() {

  // Form state
  const [selectedContentId, setSelectedContentId] = useState<string>('')
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')
  const [referenceContent, setReferenceContent] = useState<string>('')
  const [generatedResult, setGeneratedResult] = useState<GeneratedContent | null>(null)
  const [isThreadExpanded, setIsThreadExpanded] = useState(false)

  // Queries
  const { data: contentData, isLoading: isLoadingContent } = useExtractedContent({
    status: 'completed',
    page: 1,
    limit: 100,
  })

  const { data: agentsData, isLoading: isLoadingAgents } = useContentAgents({ isActive: true })

  // Mutation
  const generateMutation = useGenerateContentWithAgent()

  const extractedContent = contentData?.content || []
  const agents = agentsData || []

  const selectedContent = extractedContent.find((c) => c.id === selectedContentId)
  const selectedAgent = agents.find((a: ContentAgent) => a.id === selectedAgentId)

  const canGenerate = selectedContentId && selectedAgentId && !generateMutation.isPending

  const handleGenerate = async () => {
    if (!canGenerate) return

    try {
      const result = await generateMutation.mutateAsync({
        extractedContentId: selectedContentId,
        agentId: selectedAgentId,
        referenceContent: referenceContent || undefined,
      })

      setGeneratedResult(result.generatedContent)

      toast.success('El contenido ha sido generado exitosamente')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ocurrió un error desconocido')
    }
  }

  const handleCopyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copiado exitosamente`)
    } catch (error) {
      toast.error('No se pudo copiar al portapapeles')
    }
  }

  const handleDiscard = () => {
    setGeneratedResult(null)
  }

  const getAgentTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'reportero':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
      case 'columnista':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400'
      case 'trascendido':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
      case 'seo-specialist':
        return 'bg-green-500/10 text-green-700 dark:text-green-400'
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400'
    }
  }

  const getEditorialLeanBadgeColor = (lean: string) => {
    switch (lean) {
      case 'conservative':
        return 'bg-red-500/10 text-red-700 dark:text-red-400'
      case 'progressive':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
      case 'neutral':
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400'
      case 'humor':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
      case 'critical':
        return 'bg-orange-500/10 text-orange-700 dark:text-orange-400'
      case 'analytical':
        return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400'
    }
  }

  const getHookTypeBadgeColor = (hookType: string) => {
    switch (hookType) {
      case 'Scary':
        return 'bg-red-500/10 text-red-700 dark:text-red-400'
      case 'FreeValue':
        return 'bg-green-500/10 text-green-700 dark:text-green-400'
      case 'Strange':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400'
      case 'Sexy':
        return 'bg-pink-500/10 text-pink-700 dark:text-pink-400'
      case 'Familiar':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400'
    }
  }

  const getEngagementBadgeColor = (engagement: string) => {
    switch (engagement) {
      case 'high':
        return 'bg-green-500/10 text-green-700 dark:text-green-400'
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
      case 'low':
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400'
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400'
    }
  }

  const getTweetCharCount = (tweet: string) => {
    const count = tweet.length
    const isWarning = count > 240
    return { count, isWarning }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Contenido Generado con IA</h2>
        <p className="text-muted-foreground">
          Genera contenido editorial optimizado con agentes especializados
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <IconSparkles className="h-5 w-5" />
            <span>Generar Contenido con IA</span>
          </CardTitle>
          <CardDescription>
            Selecciona contenido extraído y un agente editorial para generar contenido optimizado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SELECT CONTENIDO EXTRAÍDO */}
            <div className="space-y-2">
              <Label htmlFor="content-select">Contenido Extraído</Label>
              <Select value={selectedContentId} onValueChange={setSelectedContentId}>
                <SelectTrigger id="content-select">
                  <SelectValue placeholder="Selecciona contenido a transformar..." />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingContent ? (
                    <SelectItem value="loading" disabled>
                      Cargando...
                    </SelectItem>
                  ) : extractedContent.length === 0 ? (
                    <SelectItem value="empty" disabled>
                      No hay contenido disponible
                    </SelectItem>
                  ) : (
                    extractedContent.map((content) => (
                      <SelectItem key={content.id} value={content.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{content.title || 'Sin título'}</span>
                          <span className="text-xs text-muted-foreground truncate">
                            {content.url}
                          </span>
                          {content.extractedAt && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(content.extractedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedContent && (
                <p className="text-xs text-muted-foreground">
                  Fuente: {selectedContent.url}
                </p>
              )}
            </div>

            {/* SELECT PERFIL EDITORIAL */}
            <div className="space-y-2">
              <Label htmlFor="agent-select">Perfil Editorial</Label>
              <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                <SelectTrigger id="agent-select">
                  <SelectValue placeholder="Selecciona agente editorial..." />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingAgents ? (
                    <SelectItem value="loading" disabled>
                      Cargando...
                    </SelectItem>
                  ) : agents.length === 0 ? (
                    <SelectItem value="empty" disabled>
                      No hay agentes disponibles
                    </SelectItem>
                  ) : (
                    agents.map((agent: ContentAgent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{agent.name}</span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={getAgentTypeBadgeColor(agent.agentType)}>
                              {agent.agentType}
                            </Badge>
                            <Badge className={getEditorialLeanBadgeColor(agent.editorialLean)}>
                              {agent.editorialLean}
                            </Badge>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedAgent && (
                <p className="text-xs text-muted-foreground">{selectedAgent.description}</p>
              )}
            </div>
          </div>

          {/* TEXTAREA TEXTO DE REFERENCIA */}
          <div className="space-y-2">
            <Label htmlFor="reference-content">Contexto adicional (opcional)</Label>
            <Textarea
              id="reference-content"
              placeholder="Agrega contexto político, perspectiva deseada, o información de referencia que el agente debe considerar..."
              value={referenceContent}
              onChange={(e) => setReferenceContent(e.target.value)}
              className="min-h-[120px] resize-y"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Este campo es opcional. Úsalo para darle más contexto al agente sobre cómo generar
                el contenido.
              </p>
              <span className="text-xs text-muted-foreground">
                {referenceContent.length} caracteres
              </span>
            </div>
          </div>

          {/* BOTÓN GENERAR */}
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full"
            size="lg"
          >
            {generateMutation.isPending ? (
              <>
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <IconSparkles className="mr-2 h-4 w-4" />
                Generar Contenido
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* CARD PREVIEW DEL RESULTADO */}
      {generatedResult && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center space-x-2">
                  <IconCheck className="h-5 w-5 text-green-500" />
                  <span>Contenido Generado</span>
                </CardTitle>
                <CardDescription>
                  Generado el {new Date(generatedResult.generatedAt).toLocaleString()}
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={handleDiscard}>
                <IconX className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="contenido" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="contenido">Contenido</TabsTrigger>
                <TabsTrigger value="facebook">
                  <IconBrandFacebook className="mr-2 h-4 w-4" />
                  Facebook
                </TabsTrigger>
                <TabsTrigger value="twitter">
                  <IconBrandTwitter className="mr-2 h-4 w-4" />
                  Twitter
                </TabsTrigger>
              </TabsList>

              {/* TAB CONTENIDO */}
              <TabsContent value="contenido" className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold mb-2">{generatedResult.title}</h3>
                  <p className="text-muted-foreground italic">{generatedResult.summary}</p>
                </div>

                <div className="space-y-2">
                  <Label>Keywords</Label>
                  <div className="flex flex-wrap gap-2">
                    {generatedResult.keywords.map((keyword, idx) => (
                      <Badge key={idx} variant="secondary">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {generatedResult.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <div>
                    <Badge className="text-base px-3 py-1">{generatedResult.category}</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Contenido Completo</Label>
                  <div className="max-h-[400px] overflow-y-auto border rounded-md p-4 bg-muted/30">
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: generatedResult.content }}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* TAB FACEBOOK */}
              <TabsContent value="facebook" className="space-y-4">
                <div className="space-y-4 border rounded-lg p-4 bg-blue-50/30 dark:bg-blue-950/30">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Hook Viral</Label>
                      <Badge className={getHookTypeBadgeColor(generatedResult.socialMediaCopies.facebook.hookType)}>
                        {generatedResult.socialMediaCopies.facebook.hookType}
                      </Badge>
                    </div>
                    <p className="text-lg font-medium">
                      {generatedResult.socialMediaCopies.facebook.hook}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Copy Completo</Label>
                    <div className="border rounded-md p-4 bg-white dark:bg-gray-950 whitespace-pre-wrap">
                      {generatedResult.socialMediaCopies.facebook.copy}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Emojis Utilizados</Label>
                      <div className="flex flex-wrap gap-2">
                        {generatedResult.socialMediaCopies.facebook.emojis.map((emoji, idx) => (
                          <span key={idx} className="text-2xl">
                            {emoji}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Engagement Estimado</Label>
                      <div>
                        <Badge
                          className={getEngagementBadgeColor(
                            generatedResult.socialMediaCopies.facebook.estimatedEngagement
                          )}
                        >
                          {generatedResult.socialMediaCopies.facebook.estimatedEngagement}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() =>
                      handleCopyToClipboard(
                        generatedResult.socialMediaCopies.facebook.copy,
                        'Copy de Facebook'
                      )
                    }
                    className="w-full"
                  >
                    <IconCopy className="mr-2 h-4 w-4" />
                    Copiar Copy FB
                  </Button>
                </div>
              </TabsContent>

              {/* TAB TWITTER */}
              <TabsContent value="twitter" className="space-y-4">
                <div className="space-y-4 border rounded-lg p-4 bg-sky-50/30 dark:bg-sky-950/30">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Tweet Principal</Label>
                      <span
                        className={`text-sm font-medium ${
                          getTweetCharCount(generatedResult.socialMediaCopies.twitter.tweet)
                            .isWarning
                            ? 'text-orange-500'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {getTweetCharCount(generatedResult.socialMediaCopies.twitter.tweet).count}
                        /280
                      </span>
                    </div>
                    <div className="border rounded-md p-4 bg-white dark:bg-gray-950">
                      {generatedResult.socialMediaCopies.twitter.tweet}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Hook</Label>
                      <Badge className={getHookTypeBadgeColor(generatedResult.socialMediaCopies.twitter.hookType)}>
                        {generatedResult.socialMediaCopies.twitter.hookType}
                      </Badge>
                    </div>
                    <p className="text-lg font-medium">
                      {generatedResult.socialMediaCopies.twitter.hook}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Emojis Utilizados</Label>
                    <div className="flex flex-wrap gap-2">
                      {generatedResult.socialMediaCopies.twitter.emojis.map((emoji, idx) => (
                        <span key={idx} className="text-2xl">
                          {emoji}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => setIsThreadExpanded(!isThreadExpanded)}
                    >
                      <span>Ideas para Thread</span>
                      <IconChevronDown
                        className={`h-4 w-4 transition-transform ${isThreadExpanded ? 'rotate-180' : ''}`}
                      />
                    </Button>
                    {isThreadExpanded && (
                      <div className="mt-4 space-y-2">
                        <div className="border rounded-md p-4 bg-white dark:bg-gray-950 space-y-3">
                          {generatedResult.socialMediaCopies.twitter.threadIdeas.map((idea, idx) => (
                            <div key={idx} className="flex items-start space-x-2">
                              <span className="text-sm font-medium text-muted-foreground">
                                {idx + 1}.
                              </span>
                              <p className="text-sm">{idea}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() =>
                      handleCopyToClipboard(
                        generatedResult.socialMediaCopies.twitter.tweet,
                        'Tweet'
                      )
                    }
                    className="w-full"
                  >
                    <IconCopy className="mr-2 h-4 w-4" />
                    Copiar Tweet
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {/* BOTONES DE ACCIÓN */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <Button
                variant="outline"
                onClick={() => toast.info('Función de edición en desarrollo')}
              >
                <IconEdit className="mr-2 h-4 w-4" />
                Editar
              </Button>

              <Button
                variant="outline"
                onClick={() => toast.info('Publicación en Facebook en desarrollo')}
              >
                <IconBrandFacebook className="mr-2 h-4 w-4" />
                Publicar FB
              </Button>

              <Button
                variant="outline"
                onClick={() => toast.info('Publicación en Twitter en desarrollo')}
              >
                <IconBrandTwitter className="mr-2 h-4 w-4" />
                Publicar Twitter
              </Button>

              <Button variant="destructive" onClick={handleDiscard}>
                <IconX className="mr-2 h-4 w-4" />
                Descartar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* EMPTY STATE */}
      {!generatedResult && !generateMutation.isPending && (
        <Card className="border-dashed">
          <CardContent className="py-12">
            <div className="text-center">
              <IconSparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay contenido generado</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Selecciona contenido extraído y un agente editorial para generar contenido
                optimizado con copys para redes sociales
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
