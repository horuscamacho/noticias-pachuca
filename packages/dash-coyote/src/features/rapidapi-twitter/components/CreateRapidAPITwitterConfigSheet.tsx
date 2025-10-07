// 🔧 Create RapidAPI Twitter Config Sheet
import { useState } from 'react'
import { useRapidAPITwitterConfigs } from '../hooks/useRapidAPITwitterConfigs'
import type { CreateRapidAPITwitterConfigDto } from '../types/rapidapi-twitter.types'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
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
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { IconPlus, IconLoader2 } from '@tabler/icons-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const createConfigSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
  host: z.string().min(1, 'El host es requerido').default('twitter241.p.rapidapi.com'),
  apiKey: z.string().min(1, 'La API key es requerida').min(10, 'La API key parece muy corta'),
  baseUrl: z.string().url('Debe ser una URL válida').default('https://twitter241.p.rapidapi.com'),
  isActive: z.boolean().default(true),
  quotaLimits: z.object({
    requestsPerHour: z.number().min(1).max(10000).default(100),
    requestsPerDay: z.number().min(1).max(100000).default(1000),
    requestsPerMonth: z.number().min(1).max(1000000).default(10000),
  }),
})

type CreateConfigFormData = z.infer<typeof createConfigSchema>

interface CreateRapidAPITwitterConfigSheetProps {
  onConfigCreated?: () => void
}

export function CreateRapidAPITwitterConfigSheet({ onConfigCreated }: CreateRapidAPITwitterConfigSheetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { createConfig } = useRapidAPITwitterConfigs()

  const form = useForm<CreateConfigFormData>({
    resolver: zodResolver(createConfigSchema),
    defaultValues: {
      name: '',
      host: 'twitter241.p.rapidapi.com',
      apiKey: '',
      baseUrl: 'https://twitter241.p.rapidapi.com',
      isActive: true,
      quotaLimits: {
        requestsPerHour: 100,
        requestsPerDay: 1000,
        requestsPerMonth: 10000,
      },
    },
  })

  const handleSubmit = async (data: CreateConfigFormData) => {
    try {
      setIsLoading(true)

      const createDto: CreateRapidAPITwitterConfigDto = {
        name: data.name,
        host: data.host,
        apiKey: data.apiKey,
        baseUrl: data.baseUrl,
        quotaLimits: data.quotaLimits,
      }

      await createConfig(createDto)

      // Reset form and close sheet
      form.reset()
      setIsOpen(false)

      // Notify parent
      onConfigCreated?.()

      console.log('Configuración de Twitter creada exitosamente') // TODO: Replace with toast
    } catch (error: any) {
      console.error('Error al crear configuración:', error)
      // TODO: Show error toast
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button>
          <IconPlus className="h-4 w-4 mr-2" />
          Nueva Configuración
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            🐦 Nueva Configuración de Twitter API
          </SheetTitle>
          <SheetDescription>
            Configura una nueva API de Twitter para extraer datos de usuarios y tweets.
            Necesitas una API key válida de RapidAPI.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mt-6">
            {/* 📝 Información básica */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Información Básica</h4>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Configuración *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ej: Twitter API Principal"
                        disabled={isLoading}
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
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RapidAPI Key *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Tu RapidAPI key aquí..."
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Tu clave de API de RapidAPI para acceder a la API de Twitter
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 🔗 Configuración de endpoint */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Configuración del Endpoint</h4>

              <FormField
                control={form.control}
                name="host"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Host de la API</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="twitter241.p.rapidapi.com"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      El host de RapidAPI para la API de Twitter (generalmente no necesita cambios)
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
                        {...field}
                        placeholder="https://twitter241.p.rapidapi.com"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      La URL base completa para las llamadas a la API
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 📊 Límites de cuota */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Límites de Cuota</h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="quotaLimits.requestsPerHour"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Por Hora</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min={1}
                          max={10000}
                          disabled={isLoading}
                          onChange={(e) => field.onChange(Number(e.target.value))}
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
                      <FormLabel>Por Día</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min={1}
                          max={100000}
                          disabled={isLoading}
                          onChange={(e) => field.onChange(Number(e.target.value))}
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
                      <FormLabel>Por Mes</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min={1}
                          max={1000000}
                          disabled={isLoading}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormDescription className="text-sm">
                Establece los límites según tu plan de RapidAPI para evitar exceder la cuota
              </FormDescription>
            </div>

            {/* ⚙️ Configuración adicional */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Configuración Adicional</h4>

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Activar Configuración
                      </FormLabel>
                      <FormDescription>
                        Activar esta configuración inmediatamente después de crearla
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* 🚀 Botones de acción */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <IconPlus className="h-4 w-4 mr-2" />
                    Crear Configuración
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}