// 📄 Create RapidAPI Page Sheet - Formulario para agregar páginas a monitorear
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRapidAPIPages } from '../hooks/useRapidAPIPages'
import { useRapidAPIConfigs } from '../hooks/useRapidAPIConfigs'
import { useRapidAPIPageSetup } from '../hooks/useRapidAPIPageValidation'
import type { MappedPageDetails } from '../types/rapidapi-facebook.types'

interface PagePreview {
  pageId: string
  pageDetails: MappedPageDetails
  page: {
    _id?: string
    id: string
  }
  samplePosts?: Array<{
    content?: {
      text?: string
    }
    publishedAt: string
  }>
}
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Input,
} from '@/components/ui/input'
import {
  Button,
} from '@/components/ui/button'
import {
  Badge,
} from '@/components/ui/badge'
import {
  Switch,
} from '@/components/ui/switch'
import {
  Separator,
} from '@/components/ui/separator'
import {
  IconLoader2,
  IconCheck,
  IconAlertTriangle,
  IconSearch,
  IconBrandFacebook,
  IconEye,
} from '@tabler/icons-react'

// 📋 Validation Schema
const urlValidationSchema = z.object({
  pageUrl: z.string()
    .min(1, 'URL es requerida')
    .url('Debe ser una URL válida')
    .refine((url) => {
      const facebookPatterns = [
        /facebook\.com\/pages\//,
        /facebook\.com\/[^\/]+\/?$/,
        /facebook\.com\/profile\.php\?id=/,
        /fb\.com\//,
        /m\.facebook\.com\//
      ]
      return facebookPatterns.some(pattern => pattern.test(url))
    }, 'Debe ser una URL válida de Facebook'),
  configId: z.string().min(1, 'Configuración es requerida')
})

const configurationSchema = z.object({
  extractionConfig: z.object({
    isActive: z.boolean(),
    frequency: z.enum(['manual', 'daily', 'weekly']),
    maxPostsPerExtraction: z.number()
      .min(1, 'Mínimo 1 post')
      .max(1000, 'Máximo 1000 posts'),
    extractionFilters: z.object({
      includeComments: z.boolean(),
      includeReactions: z.boolean(),
    })
  })
})

type UrlFormData = z.infer<typeof urlValidationSchema>
type ConfigFormData = z.infer<typeof configurationSchema>

// 🎯 Component Props
interface CreateRapidAPIPageSheetProps {
  children: React.ReactNode
}

export function CreateRapidAPIPageSheet({ children }: CreateRapidAPIPageSheetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState<'url' | 'preview' | 'config'>('url')
  const [pagePreview, setPagePreview] = useState<PagePreview | null>(null)

  const { updateExtractionConfig } = useRapidAPIPages()
  const { configs } = useRapidAPIConfigs()
  const { setupPage, isLoading: isValidating } = useRapidAPIPageSetup()

  // 📝 Form Setup - URL Validation
  const urlForm = useForm<UrlFormData>({
    resolver: zodResolver(urlValidationSchema),
    defaultValues: {
      pageUrl: '',
      configId: ''
    }
  })

  // 📝 Form Setup - Configuration
  const configForm = useForm<ConfigFormData>({
    resolver: zodResolver(configurationSchema),
    defaultValues: {
      extractionConfig: {
        isActive: true,
        frequency: 'daily',
        maxPostsPerExtraction: 50,
        extractionFilters: {
          includeComments: false,
          includeReactions: false,
        }
      }
    }
  })

  const { isSubmitting: isSubmittingUrl } = urlForm.formState
  const { isSubmitting: isSubmittingConfig } = configForm.formState

  // 🔍 Validate URL and Get Preview
  const handleValidateUrl = async (data: UrlFormData) => {
    try {
      const result = await setupPage(data.pageUrl, data.configId)
      setPagePreview(result)
      setCurrentStep('preview')
    } catch (error) {
      urlForm.setError('pageUrl', {
        message: error instanceof Error ? error.message : 'Error validando la URL'
      })
    }
  }

  // ✅ Submit Final Configuration - UPDATE EXTRACTION CONFIG
  const handleSubmitConfiguration = async (data: ConfigFormData) => {
    if (!pagePreview || !pagePreview.page) return

    try {
      // UPDATE extraction configuration for existing page (use MongoDB ID)
      await updateExtractionConfig(pagePreview.page._id || pagePreview.page.id, data.extractionConfig)

      // Reset and close
      setIsOpen(false)
      urlForm.reset()
      configForm.reset()
      setCurrentStep('url')
      setPagePreview(null)
    } catch (error) {
      console.error('Error updating extraction config:', error)
    }
  }

  // 🔄 Step Navigation
  const goBack = () => {
    if (currentStep === 'preview') {
      setCurrentStep('url')
      setPagePreview(null)
    } else if (currentStep === 'config') {
      setCurrentStep('preview')
    }
  }

  const goToConfig = () => {
    setCurrentStep('config')
  }

  // 🎨 Render Step Content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'url':
        return (
          <Form {...urlForm}>
            <form onSubmit={urlForm.handleSubmit(handleValidateUrl)} className="space-y-4">
              <FormField
                control={urlForm.control}
                name="pageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL de la Página de Facebook</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://facebook.com/pages/example"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Introduce la URL completa de la página de Facebook que quieres monitorear
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={urlForm.control}
                name="configId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Configuración de API</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una configuración" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {configs.filter(config => config._id || config.id).map((config, index) => (
                          <SelectItem key={`config-${config._id || config.id || index}`} value={config._id || config.id}>
                            <div className="flex items-center space-x-2">
                              <span>{config.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {config.currentUsage?.requestsToday || 0}/{config.quotaLimits.requestsPerDay}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Selecciona qué configuración de API usar para esta página
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {configs.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <IconAlertTriangle className="w-4 h-4 text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                      No hay configuraciones activas. Primero debes agregar una configuración de API.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmittingUrl || isValidating}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingUrl || isValidating || configs.length === 0}
                >
                  {isSubmittingUrl || isValidating ? (
                    <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <IconSearch className="w-4 h-4 mr-2" />
                  )}
                  Validar Página
                </Button>
              </div>
            </form>
          </Form>
        )

      case 'preview':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Vista Previa de la Página</h4>
              <p className="text-sm text-muted-foreground">
                Revisa la información extraída de la página de Facebook
              </p>
            </div>

            {pagePreview && (
              <div className="border rounded-lg p-4 space-y-4">
                {/* Page Details */}
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center overflow-hidden">
                    {pagePreview.pageDetails.image ? (
                      <img
                        src={pagePreview.pageDetails.image}
                        alt={pagePreview.pageDetails.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <IconBrandFacebook className="w-8 h-8 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h5 className="font-medium">{pagePreview.pageDetails.name}</h5>
                      {pagePreview.pageDetails.verified && (
                        <Badge variant="secondary" className="text-xs">
                          ✓ Verificada
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      ID: {pagePreview.pageId}
                    </p>
                    {pagePreview.pageDetails.intro && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {pagePreview.pageDetails.intro}
                      </p>
                    )}
                    {pagePreview.pageDetails.categories && pagePreview.pageDetails.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {pagePreview.pageDetails.categories.slice(0, 2).map((category, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Page Stats */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {pagePreview.pageDetails.followers.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Seguidores</div>
                  </div>
                  {pagePreview.pageDetails.likes && (
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {pagePreview.pageDetails.likes.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Me gusta</div>
                    </div>
                  )}
                  {pagePreview.pageDetails.rating && (
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {pagePreview.pageDetails.rating}/100
                      </div>
                      <div className="text-xs text-muted-foreground">Rating</div>
                    </div>
                  )}
                  {pagePreview.pageDetails.website && (
                    <div className="text-center">
                      <div className="text-xs font-medium text-blue-600 truncate">
                        {pagePreview.pageDetails.website}
                      </div>
                      <div className="text-xs text-muted-foreground">Sitio web</div>
                    </div>
                  )}
                </div>

                {/* Sample Posts */}
                {pagePreview.samplePosts && pagePreview.samplePosts.length > 0 && (
                  <div className="pt-2 border-t">
                    <h6 className="text-sm font-medium mb-2">
                      Posts de Muestra ({pagePreview.samplePosts.length})
                    </h6>
                    <div className="space-y-2">
                      {pagePreview.samplePosts.slice(0, 3).map((post, index: number) => (
                        <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                          <div className="font-medium truncate">
                            {post.content?.text || 'Post sin texto'}
                          </div>
                          <div className="text-muted-foreground">
                            {new Date(post.publishedAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
              >
                Cambiar URL
              </Button>
              <Button
                type="button"
                onClick={goToConfig}
              >
                <IconCheck className="w-4 h-4 mr-2" />
                Continuar
              </Button>
            </div>
          </div>
        )

      case 'config':
        return (
          <Form {...configForm}>
            <form onSubmit={configForm.handleSubmit(handleSubmitConfiguration)} className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Configuración de Extracción</h4>
                <p className="text-sm text-muted-foreground">
                  Define cómo y cuándo se extraerán los posts de esta página
                </p>
              </div>

              <FormField
                control={configForm.control}
                name="extractionConfig.isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Extracción Activa
                      </FormLabel>
                      <FormDescription>
                        Habilitar la extracción automática de posts
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={configForm.control}
                name="extractionConfig.frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frecuencia de Extracción</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem key="manual" value="manual">Manual</SelectItem>
                        <SelectItem key="daily" value="daily">Diaria</SelectItem>
                        <SelectItem key="weekly" value="weekly">Semanal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Con qué frecuencia se extraerán automáticamente los posts
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={configForm.control}
                name="extractionConfig.maxPostsPerExtraction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Máximo Posts por Extracción</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="50"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Número máximo de posts a extraer en cada ejecución
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <FormLabel>Filtros de Extracción</FormLabel>

                <FormField
                  control={configForm.control}
                  name="extractionConfig.extractionFilters.includeComments"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">
                          Incluir Comentarios
                        </FormLabel>
                        <FormDescription className="text-xs">
                          Extraer comentarios de los posts (consume más cuota)
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={configForm.control}
                  name="extractionConfig.extractionFilters.includeReactions"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">
                          Incluir Reacciones
                        </FormLabel>
                        <FormDescription className="text-xs">
                          Extraer reacciones detalladas de los posts
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  disabled={isSubmittingConfig}
                >
                  Anterior
                </Button>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsOpen(false)}
                    disabled={isSubmittingConfig}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingConfig}
                  >
                    {isSubmittingConfig ? (
                      <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <IconCheck className="w-4 h-4 mr-2" />
                    )}
                    Actualizar Configuración
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        )

      default:
        return null
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-[500px] sm:max-w-[500px] p-6">
        <SheetHeader>
          <SheetTitle>Agregar Página a Monitorear</SheetTitle>
          <SheetDescription>
            Configura una nueva página de Facebook para extraer contenido usando RapidAPI
          </SheetDescription>
        </SheetHeader>

        {/* Progress Indicator */}
        <div className="flex items-center space-x-2 my-6">
          {['url', 'preview', 'config'].map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                currentStep === step
                  ? 'bg-primary text-primary-foreground'
                  : index < ['url', 'preview', 'config'].indexOf(currentStep)
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {index + 1}
              </div>
              {index < 2 && (
                <div className={`w-8 h-0.5 mx-1 ${
                  index < ['url', 'preview', 'config'].indexOf(currentStep)
                    ? 'bg-green-600'
                    : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        <Separator />

        {/* Step Content */}
        <div className="py-6 min-h-[400px] max-h-[500px] overflow-y-auto">
          {renderStepContent()}
        </div>
      </SheetContent>
    </Sheet>
  )
}