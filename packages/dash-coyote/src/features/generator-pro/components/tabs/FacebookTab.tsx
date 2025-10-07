import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IconBrandFacebook, IconPlus, IconSettings } from '@tabler/icons-react'

import { useFacebookConfigs } from '../../hooks'

export function FacebookTab() {
  const { data: facebookConfigs, isLoading } = useFacebookConfigs()

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Cargando configuraciones de Facebook...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configuraciones de Facebook</h2>
          <p className="text-muted-foreground">
            Gestiona las páginas de Facebook donde publicar contenido
          </p>
        </div>
        <Button>
          <IconPlus className="h-4 w-4 mr-2" />
          Agregar Página
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {facebookConfigs && facebookConfigs.length > 0 ? (
          facebookConfigs.map((config) => (
            <Card key={config.id}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <IconBrandFacebook className="h-5 w-5" />
                  <span>{config.name}</span>
                </CardTitle>
                <CardDescription>{config.facebookPageName}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Estado</span>
                    <Badge variant={config.isActive ? "default" : "secondary"}>
                      {config.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Posts hoy</span>
                    <span className="font-semibold">{config.postsToday}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Límite diario</span>
                    <span className="font-semibold">{config.maxPostsPerDay}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  <IconSettings className="h-3 w-3 mr-2" />
                  Configurar
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-3 text-center py-8">
            <IconBrandFacebook className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay páginas configuradas</h3>
            <p className="text-muted-foreground">
              Agrega tu primera página de Facebook para publicar contenido
            </p>
          </div>
        )}
      </div>
    </div>
  )
}