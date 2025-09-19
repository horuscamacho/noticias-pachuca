// 👥 Clientes Route - Gestión de clientes
import { createFileRoute } from '@tanstack/react-router'
import { AppSidebar } from '@/components/AppSidebar'
import { SiteHeader } from '@/components/SiteHeader'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { IconUsers, IconUserPlus, IconSearch, IconPhone, IconMail, IconMapPin } from '@tabler/icons-react'

export const Route = createFileRoute('/_authenticated/clientes')({
  component: ClientesPage,
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold text-destructive">Error loading clientes</h2>
        <p className="text-gray-600">{error.message}</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    </div>
  ),
  pendingComponent: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span>Loading clientes...</span>
      </div>
    </div>
  ),
})

function ClientesPage() {
  const mockClientes = [
    {
      id: 1,
      nombre: "María González",
      email: "maria@empresa.com",
      telefono: "+52 81 1234 5678",
      empresa: "Tech Solutions SA",
      ubicacion: "Monterrey, NL",
      estado: "Activo",
      fechaRegistro: "2024-01-15",
      avatar: "/avatars/maria.jpg"
    },
    {
      id: 2,
      nombre: "Carlos Hernández",
      email: "carlos@startup.mx",
      telefono: "+52 55 9876 5432",
      empresa: "Startup Innovadora",
      ubicacion: "Ciudad de México",
      estado: "Potencial",
      fechaRegistro: "2024-02-20",
      avatar: "/avatars/carlos.jpg"
    },
    {
      id: 3,
      nombre: "Ana Rodríguez",
      email: "ana@corporativo.com",
      telefono: "+52 33 5555 1234",
      empresa: "Corporativo GDL",
      ubicacion: "Guadalajara, JAL",
      estado: "Activo",
      fechaRegistro: "2024-01-30",
      avatar: "/avatars/ana.jpg"
    }
  ]

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Header */}
              <div className="px-4 lg:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
                    <p className="text-muted-foreground">
                      Gestiona tu base de clientes y prospectos
                    </p>
                  </div>
                  <Button>
                    <IconUserPlus className="mr-2 h-4 w-4" />
                    Nuevo Cliente
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="px-4 lg:px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
                      <IconUsers className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">2,543</div>
                      <p className="text-xs text-muted-foreground">
                        +180 este mes
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Activos</CardTitle>
                      <IconUsers className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">1,897</div>
                      <p className="text-xs text-muted-foreground">
                        74.6% del total
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Nuevos</CardTitle>
                      <IconUserPlus className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">234</div>
                      <p className="text-xs text-muted-foreground">
                        +20% vs mes anterior
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Potenciales</CardTitle>
                      <IconUsers className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">412</div>
                      <p className="text-xs text-muted-foreground">
                        16.2% del total
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Search Bar */}
              <div className="px-4 lg:px-6">
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1 max-w-sm">
                    <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar clientes..." className="pl-8" />
                  </div>
                </div>
              </div>

              {/* Clients List */}
              <div className="px-4 lg:px-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Lista de Clientes</CardTitle>
                    <CardDescription>
                      Administra la información de tus clientes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockClientes.map((cliente) => (
                        <div key={cliente.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarImage src={cliente.avatar} alt={cliente.nombre} />
                              <AvatarFallback>
                                {cliente.nombre.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <p className="font-medium">{cliente.nombre}</p>
                                <Badge
                                  variant={cliente.estado === "Activo" ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {cliente.estado}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium text-muted-foreground">{cliente.empresa}</p>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <div className="flex items-center space-x-1">
                                  <IconMail className="h-3 w-3" />
                                  <span>{cliente.email}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <IconPhone className="h-3 w-3" />
                                  <span>{cliente.telefono}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <IconMapPin className="h-3 w-3" />
                                  <span>{cliente.ubicacion}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              Registrado: {new Date(cliente.fechaRegistro).toLocaleDateString('es-MX')}
                            </p>
                            <div className="flex space-x-2 mt-2">
                              <Button variant="outline" size="sm">
                                Ver Perfil
                              </Button>
                              <Button variant="outline" size="sm">
                                Contactar
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}