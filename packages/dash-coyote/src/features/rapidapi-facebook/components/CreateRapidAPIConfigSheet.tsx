// 🔧 Create RapidAPI Configuration Sheet - Formulario para agregar configuraciones de API
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRapidAPIConfigs } from '../hooks/useRapidAPIConfigs'
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
  Input,
} from '@/components/ui/input'
import {
  Button,
} from '@/components/ui/button'
import {
  Badge,
} from '@/components/ui/badge'
import {
  Separator,
} from '@/components/ui/separator'
import {
  IconLoader2,
  IconCheck,
  IconAlertTriangle,
  IconTestPipe,
} from '@tabler/icons-react'

// 📋 Validation Schema
const configValidationSchema = z.object({
  name: z.string()
    .min(1, 'Nombre es requerido')
    .min(3, 'Nombre debe tener al menos 3 caracteres')
    .max(50, 'Nombre no puede exceder 50 caracteres'),
  host: z.string()
    .min(1, 'Host es requerido')
    .regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Formato de host inválido (ej: api.example.com)'),
  apiKey: z.string()
    .min(1, 'API Key es requerida')
    .min(10, 'API Key debe tener al menos 10 caracteres'),
  baseUrl: z.string()
    .min(1, 'Base URL es requerida')
    .url('Debe ser una URL válida'),
  quotaLimits: z.object({
    requestsPerHour: z.number()
      .min(1, 'Mínimo 1 request por hora')
      .max(10000, 'Máximo 10,000 requests por hora'),
    requestsPerDay: z.number()
      .min(1, 'Mínimo 1 request por día')
      .max(100000, 'Máximo 100,000 requests por día'),
    requestsPerMonth: z.number()
      .min(1, 'Mínimo 1 request por mes')
      .max(1000000, 'Máximo 1,000,000 requests por mes'),
  })
})

type ConfigFormData = z.infer<typeof configValidationSchema>

// 🎯 Component Props
interface CreateRapidAPIConfigSheetProps {
  children: React.ReactNode
}

export function CreateRapidAPIConfigSheet({ children }: CreateRapidAPIConfigSheetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState<'basic' | 'quotas' | 'test'>('basic')
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const { createConfig, testConnection } = useRapidAPIConfigs()

  // 📝 Form Setup
  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configValidationSchema),
    defaultValues: {
      name: '',
      host: '',
      apiKey: '',
      baseUrl: '',
      quotaLimits: {
        requestsPerHour: 200,
        requestsPerDay: 1000,
        requestsPerMonth: 25000,
      }
    }
  })

  const { isSubmitting } = form.formState

  // 🔄 Step Navigation
  const nextStep = () => {
    if (currentStep === 'basic') setCurrentStep('quotas')
    else if (currentStep === 'quotas') setCurrentStep('test')
  }

  const prevStep = () => {
    if (currentStep === 'quotas') setCurrentStep('basic')
    else if (currentStep === 'test') setCurrentStep('quotas')
  }

  // 🧪 Test Configuration
  const handleTestConnection = async () => {
    try {
      // Create a temporary config for testing
      const formData = form.getValues()
      const tempConfig = await createConfig(formData)

      // Test the connection
      const result = await testConnection(tempConfig.id)
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido'
      })
    }
  }

  // ✅ Submit Form
  const onSubmit = async (data: ConfigFormData) => {
    try {
      await createConfig(data)
      setIsOpen(false)
      form.reset()
      setCurrentStep('basic')
      setTestResult(null)
    } catch (error) {
      console.error('Error creating config:', error)
    }
  }

  // 🎨 Render Step Content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Configuración</FormLabel>
                  <FormControl>
                    <Input placeholder="RapidAPI Facebook Scraper" {...field} />
                  </FormControl>
                  <FormDescription>
                    Nombre descriptivo para identificar esta configuración
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="host"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Host de RapidAPI</FormLabel>
                  <FormControl>
                    <Input placeholder="facebook-scraper.p.rapidapi.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Host del servicio en RapidAPI (sin https://)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Tu API Key de RapidAPI"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Tu clave de API de RapidAPI (se almacena de forma segura)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="baseUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://facebook-scraper.p.rapidapi.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    URL base completa del servicio
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )


      case 'quotas':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Límites de Cuota</h4>
              <p className="text-sm text-muted-foreground">
                Configura los límites de uso según tu plan de RapidAPI
              </p>
            </div>

            <FormField
              control={form.control}
              name="quotaLimits.requestsPerHour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requests por Hora</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="200"
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Máximo número de requests por hora
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quotaLimits.requestsPerDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requests por Día</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="1000"
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Máximo número de requests por día
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quotaLimits.requestsPerMonth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requests por Mes</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="25000"
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Máximo número de requests por mes
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )

      case 'test':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Probar Configuración</h4>
              <p className="text-sm text-muted-foreground">
                Verifica que la configuración funciona correctamente
              </p>
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Test de Conexión</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <IconTestPipe className="w-4 h-4 mr-2" />
                  )}
                  Probar
                </Button>
              </div>

              {testResult && (
                <div className={`flex items-start space-x-2 p-3 rounded-md border ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800'
                    : 'bg-destructive/10 border-destructive/20'
                }`}>
                  {testResult.success ? (
                    <IconCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  ) : (
                    <IconAlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      testResult.success ? 'text-emerald-800 dark:text-emerald-200' : 'text-destructive'
                    }`}>
                      {testResult.success ? 'Conexión exitosa' : 'Error de conexión'}
                    </p>
                    <p className={`text-xs ${
                      testResult.success ? 'text-emerald-700 dark:text-emerald-300' : 'text-destructive/80'
                    }`}>
                      {testResult.message}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h5 className="text-sm font-medium text-primary mb-2">Resumen de Configuración</h5>
              <div className="space-y-2 text-xs text-primary/80">
                <div className="flex justify-between">
                  <span>Nombre:</span>
                  <span>{form.getValues('name') || 'Sin nombre'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Host:</span>
                  <span>{form.getValues('host') || 'Sin host'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cuota diaria:</span>
                  <span>{form.getValues('quotaLimits.requestsPerDay')} requests</span>
                </div>
              </div>
            </div>
          </div>
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
      <SheetContent className="w-[600px] sm:max-w-[600px] p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <SheetHeader className="space-y-4">
              <SheetTitle>Agregar Configuración de RapidAPI</SheetTitle>
              <SheetDescription>
                Configura una nueva API de terceros para extracción de Facebook
              </SheetDescription>
            </SheetHeader>

            {/* Progress Indicator */}
            <div className="flex items-center space-x-2 px-4 py-6">
              {['basic', 'quotas', 'test'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    currentStep === step
                      ? 'bg-primary text-primary-foreground'
                      : index < ['basic', 'quotas', 'test'].indexOf(currentStep)
                      ? 'bg-emerald-600 text-white dark:bg-emerald-700'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  {index < 2 && (
                    <div className={`w-8 h-0.5 mx-1 ${
                      index < ['basic', 'quotas', 'test'].indexOf(currentStep)
                        ? 'bg-emerald-600 dark:bg-emerald-700'
                        : 'bg-muted'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            <Separator />

            {/* Step Content */}
            <div className="px-2 py-4">
              {renderStepContent()}
            </div>

            <SheetFooter className="pt-6">
              <div className="flex items-center justify-between w-full">
                <div className="flex space-x-2">
                  {currentStep !== 'basic' && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      disabled={isSubmitting}
                    >
                      Anterior
                    </Button>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>

                  {currentStep !== 'test' ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={isSubmitting}
                    >
                      Siguiente
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting || (testResult && !testResult.success)}
                    >
                      {isSubmitting ? (
                        <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <IconCheck className="w-4 h-4 mr-2" />
                      )}
                      Crear Configuración
                    </Button>
                  )}
                </div>
              </div>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}