// 📱 Page Details Modal - Vista completa de información de página
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  IconExternalLink,
  IconPhone,
  IconMail,
  IconGlobe,
  IconMapPin,
  IconUsers,
  IconSettings,
  IconCalendar,
  IconTrendingUp
} from '@tabler/icons-react'
import type { RapidAPIPage } from '../types/rapidapi-facebook.types'

interface PageDetailsModalProps {
  page: RapidAPIPage | null
  isOpen: boolean
  onClose: () => void
  onEditConfig?: (pageId: string) => void
}

export function PageDetailsModal({ page, isOpen, onClose, onEditConfig }: PageDetailsModalProps) {
  if (!page) return null

  const formatNumber = (num?: number) => {
    if (!num) return '0'
    return num >= 1000 ? `${(num / 1000).toFixed(1)}K` : num.toString()
  }

  const formatDate = (date?: string) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        className="!w-[90vw] sm:!w-[80vw] lg:!w-[70vw] xl:!w-[60vw] !max-w-none h-full overflow-y-auto p-0 flex flex-col"
        side="right"
        style={{ width: '70vw', maxWidth: 'none' }}
      >
        <SheetHeader className="px-6 py-6 border-b">
          <SheetTitle className="flex items-center space-x-3">
            {page.pageDetails?.profilePicture ? (
              <img
                src={page.pageDetails.profilePicture}
                alt={page.pageDetails.name || page.pageName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                {(page.pageDetails?.name || page.pageName || 'P')[0].toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold">
                {page.pageDetails?.name || page.pageName || 'Sin nombre'}
                {page.pageDetails?.verified && (
                  <span className="ml-2 text-blue-500">✓</span>
                )}
              </h2>
              <p className="text-sm text-muted-foreground">
                Detalles completos de la página
              </p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="px-6 py-6 flex-1">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Información General */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <IconUsers className="w-5 h-5" />
                <span>Información General</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* URL de Facebook */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Página de Facebook:</span>
                <a
                  href={page.pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-blue-600 hover:underline text-sm"
                >
                  <span>Ver página</span>
                  <IconExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Categoría */}
              {page.pageDetails?.category && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Categoría:</span>
                  <Badge variant="secondary">{page.pageDetails.category}</Badge>
                </div>
              )}

              {/* Descripción/About */}
              {page.pageDetails?.about && (
                <div>
                  <span className="text-sm font-medium block mb-2">Descripción:</span>
                  <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
                    {page.pageDetails.about}
                  </p>
                </div>
              )}

              {/* Verificación */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Verificada:</span>
                <Badge variant={page.pageDetails?.verified ? "default" : "secondary"}>
                  {page.pageDetails?.verified ? "✓ Verificada" : "No verificada"}
                </Badge>
              </div>

              <Separator />

              {/* Métricas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatNumber(page.pageDetails?.followers)}
                  </div>
                  <div className="text-xs text-muted-foreground">Seguidores</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {page.stats?.totalPostsExtracted || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Posts Extraídos</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de Contacto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <IconPhone className="w-5 h-5" />
                <span>Información de Contacto</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Website */}
              {page.pageDetails?.website && (
                <div className="flex items-center space-x-3">
                  <IconGlobe className="w-4 h-4 text-muted-foreground" />
                  <a
                    href={page.pageDetails.website.startsWith('http')
                      ? page.pageDetails.website
                      : `https://${page.pageDetails.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {page.pageDetails.website}
                  </a>
                </div>
              )}

              {/* Teléfono */}
              {page.pageDetails?.phone && (
                <div className="flex items-center space-x-3">
                  <IconPhone className="w-4 h-4 text-muted-foreground" />
                  <a href={`tel:${page.pageDetails.phone}`} className="text-sm">
                    {page.pageDetails.phone}
                  </a>
                </div>
              )}

              {/* Email */}
              {page.pageDetails?.email && (
                <div className="flex items-center space-x-3">
                  <IconMail className="w-4 h-4 text-muted-foreground" />
                  <a href={`mailto:${page.pageDetails.email}`} className="text-sm">
                    {page.pageDetails.email}
                  </a>
                </div>
              )}

              {/* Ubicación */}
              {page.pageDetails?.location && (
                <div className="flex items-center space-x-3">
                  <IconMapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{page.pageDetails.location}</span>
                </div>
              )}

              {/* Imagen de portada */}
              {page.pageDetails?.coverPhoto && (
                <div>
                  <span className="text-sm font-medium block mb-2">Imagen de portada:</span>
                  <img
                    src={page.pageDetails.coverPhoto}
                    alt="Portada"
                    className="w-full h-24 object-cover rounded-lg"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuración de Extracción */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <IconSettings className="w-5 h-5" />
                <span>Configuración de Extracción</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium block">Estado:</span>
                  <Badge variant={page.extractionConfig?.isActive ? "default" : "secondary"}>
                    {page.extractionConfig?.isActive ? "Activa" : "Pausada"}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm font-medium block">Frecuencia:</span>
                  <span className="text-sm text-muted-foreground capitalize">
                    {page.extractionConfig?.frequency || 'Manual'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-sm font-medium block">Posts por extracción:</span>
                <span className="text-sm text-muted-foreground">
                  {page.extractionConfig?.maxPostsPerExtraction || 10}
                </span>
              </div>

              <div>
                <span className="text-sm font-medium block mb-2">Filtros:</span>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={page.extractionConfig?.extractionFilters?.includeComments ? "default" : "outline"}>
                    {page.extractionConfig?.extractionFilters?.includeComments ? "✓" : "✗"} Comentarios
                  </Badge>
                  <Badge variant={page.extractionConfig?.extractionFilters?.includeReactions ? "default" : "outline"}>
                    {page.extractionConfig?.extractionFilters?.includeReactions ? "✓" : "✗"} Reacciones
                  </Badge>
                </div>
              </div>

              {onEditConfig && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => onEditConfig(page.id)}
                >
                  <IconSettings className="w-4 h-4 mr-2" />
                  Editar Configuración
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Estadísticas y Historial */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <IconTrendingUp className="w-5 h-5" />
                <span>Estadísticas y Historial</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium block">Errores de extracción:</span>
                  <span className="text-lg font-bold text-red-600">
                    {page.stats?.extractionErrors || 0}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium block">Promedio posts/día:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {page.stats?.avgPostsPerDay || 0}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-sm font-medium block">Última extracción exitosa:</span>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <IconCalendar className="w-4 h-4" />
                  <span>{formatDate(page.stats?.lastSuccessfulExtraction)}</span>
                </div>
              </div>

              <div>
                <span className="text-sm font-medium block">Configuración asociada:</span>
                <Badge variant="outline" className="mt-1">
                  {typeof page.configId === 'object' ? page.configId?.name : page.configName || 'Sin configuración'}
                </Badge>
                {typeof page.configId === 'object' && page.configId?.host && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Host: {page.configId.host}
                  </p>
                )}
                {typeof page.configId === 'string' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ID: {page.configId}
                  </p>
                )}
              </div>

              <Separator />

              <div>
                <span className="text-sm font-medium block mb-2">Fechas importantes:</span>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div>Creada: {formatDate(page.createdAt)}</div>
                  <div>Actualizada: {formatDate(page.updatedAt)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 px-6 py-4 border-t mt-auto">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button variant="default" asChild>
            <a
              href={page.pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2"
            >
              <IconExternalLink className="w-4 h-4" />
              <span>Ver en Facebook</span>
            </a>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}