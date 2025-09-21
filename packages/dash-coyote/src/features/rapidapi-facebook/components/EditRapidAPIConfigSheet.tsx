// ✏️ Edit RapidAPI Configuration Sheet - Formulario para editar configuraciones de API
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRapidAPIConfigs } from '../hooks/useRapidAPIConfigs'
import type { RapidAPIConfig } from '../types/rapidapi-facebook.types'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
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
  Switch,
} from '@/components/ui/switch'
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
const editConfigValidationSchema = z.object({
  name: z.string()
    .min(1, 'Nombre es requerido')
    .min(3, 'Nombre debe tener al menos 3 caracteres')
    .max(50, 'Nombre no puede exceder 50 caracteres'),
  host: z.string()
    .min(1, 'Host es requerido')
    .refine((host) => {
      try {
        new URL(`https://${host}`)
        return true
      } catch {
        return false
      }
    }, 'Host debe ser un dominio válido (ej: api.example.com)'),
  apiKey: z.string()
    .min(1, 'API Key es requerida')
    .min(10, 'API Key debe tener al menos 10 caracteres'),
  baseUrl: z.string()
    .min(1, 'Base URL es requerida')
    .url('Debe ser una URL válida'),
  isActive: z.boolean(),
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

type EditConfigFormData = z.infer<typeof editConfigValidationSchema>

// 🎯 Component Props
interface EditRapidAPIConfigSheetProps {
  config: RapidAPIConfig
  isOpen: boolean
  onClose: () => void
}

export function EditRapidAPIConfigSheet({ config, isOpen, onClose }: EditRapidAPIConfigSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  const { updateConfig, testConnection } = useRapidAPIConfigs()

  // 📝 Form Setup
  const form = useForm<EditConfigFormData>({
    resolver: zodResolver(editConfigValidationSchema),
    defaultValues: {
      name: '',
      host: '',
      apiKey: '',
      baseUrl: '',
      isActive: true,
      quotaLimits: {
        requestsPerHour: 1000,
        requestsPerDay: 1000,
        requestsPerMonth: 10000,
      }
    }
  })

  // 🔄 Update form when config changes
  useEffect(() => {
    if (config) {
      form.reset({
        name: config.name,
        host: config.host,
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        isActive: config.isActive,
        quotaLimits: {
          requestsPerHour: config.quotaLimits.requestsPerHour,
          requestsPerDay: config.quotaLimits.requestsPerDay,
          requestsPerMonth: config.quotaLimits.requestsPerMonth,
        }
      })
    }
  }, [config, form])

  // 🧪 Test Connection Handler
  const handleTestConnection = async () => {
    if (!config) return

    setIsTesting(true)
    setTestResult(null)

    try {
      const result = await testConnection(config._id || config.id)
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Error al probar la conexión'
      })
    } finally {
      setIsTesting(false)
    }
  }

  // 💾 Submit Handler
  const handleSubmit = async (data: EditConfigFormData) => {
    if (!config) return

    setIsSubmitting(true)
    try {
      await updateConfig(config._id || config.id, data)
      form.reset()
      setTestResult(null)
      onClose()
    } catch (error) {
      console.error('Error updating config:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 🎨 Render Test Result Badge
  const renderTestResult = () => {
    if (!testResult) return null

    return (
      <div className={`flex items-center space-x-2 p-3 rounded-lg ${
        testResult.success
          ? 'bg-green-50 border border-green-200'
          : 'bg-red-50 border border-red-200'
      }`}>
        {testResult.success ? (
          <IconCheck className="w-5 h-5 text-green-600" />
        ) : (
          <IconAlertTriangle className="w-5 h-5 text-red-600" />
        )}
        <span className={`text-sm ${
          testResult.success ? 'text-green-700' : 'text-red-700'
        }`}>
          {testResult.message}
        </span>
      </div>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:max-w-[600px] p-6 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar Configuración de API</SheetTitle>
          <SheetDescription>
            Modifica la configuración de RapidAPI para Facebook scraping
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mt-6">

            {/* 📝 Información Básica */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium">Información Básica</h4>
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Configuración</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ej: RapidAPI Facebook Principal"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Un nombre descriptivo para identificar esta configuración
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Configuración Activa
                      </FormLabel>
                      <FormDescription>
                        Si está activa, se usará para las operaciones de scraping
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

            <Separator />

            {/* 🔗 Configuración de API */}
            <div className="space-y-4">
              <h4 className="font-medium">Configuración de API</h4>

              <FormField
                control={form.control}
                name="host"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Host de la API</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ej: facebook-scraper3.p.rapidapi.com"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      El dominio de la API de RapidAPI
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
                    <FormLabel>URL Base</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ej: https://facebook-scraper3.p.rapidapi.com"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      La URL completa base de la API
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
                        placeholder="Tu RapidAPI Key"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Tu clave de API de RapidAPI (se mantiene segura)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* 📊 Límites de Cuota */}
            <div className="space-y-4">
              <h4 className="font-medium">Límites de Cuota</h4>

              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="quotaLimits.requestsPerHour"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requests por Hora</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
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
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
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
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 🧪 Test Connection */}
            <div className="space-y-4">
              <Separator />
              <div className="flex items-center space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTesting || !config}
                  className="flex items-center space-x-2"
                >
                  {isTesting ? (
                    <IconLoader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <IconTestPipe className="w-4 h-4" />
                  )}
                  <span>{isTesting ? 'Probando...' : 'Probar Conexión'}</span>
                </Button>
              </div>

              {renderTestResult()}
            </div>

            <SheetFooter className="space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <IconLoader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <IconCheck className="w-4 h-4" />
                )}
                <span>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</span>
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}