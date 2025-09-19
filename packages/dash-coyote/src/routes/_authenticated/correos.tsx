// 📧 Correos Route - Gestión de correos electrónicos
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
import { IconMail, IconSend, IconInbox, IconTrash } from '@tabler/icons-react'

export const Route = createFileRoute('/_authenticated/correos')({
  component: CorreosPage,
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold text-destructive">Error loading correos</h2>
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
        <span>Loading correos...</span>
      </div>
    </div>
  ),
})

function CorreosPage() {
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
                    <h1 className="text-2xl font-semibold tracking-tight">Correos Electrónicos</h1>
                    <p className="text-muted-foreground">
                      Gestiona y monitorea tus campañas de correo electrónico
                    </p>
                  </div>
                  <Button>
                    <IconSend className="mr-2 h-4 w-4" />
                    Nueva Campaña
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="px-4 lg:px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Enviados Hoy</CardTitle>
                      <IconMail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">1,234</div>
                      <p className="text-xs text-muted-foreground">
                        +20.1% desde ayer
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Tasa de Apertura</CardTitle>
                      <IconInbox className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">23.5%</div>
                      <p className="text-xs text-muted-foreground">
                        +2.5% desde el mes pasado
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Bounces</CardTitle>
                      <IconTrash className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">45</div>
                      <p className="text-xs text-muted-foreground">
                        -10% desde la semana pasada
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Recent Campaigns */}
              <div className="px-4 lg:px-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Campañas Recientes</CardTitle>
                    <CardDescription>
                      Últimas campañas de correo electrónico enviadas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        {
                          name: "Newsletter Semanal",
                          sent: "2,543",
                          opened: "1,234",
                          status: "Entregado",
                          date: "Hace 2 horas"
                        },
                        {
                          name: "Promoción Black Friday",
                          sent: "5,678",
                          opened: "3,456",
                          status: "Enviando",
                          date: "Hace 1 día"
                        },
                        {
                          name: "Bienvenida Nuevos Usuarios",
                          sent: "234",
                          opened: "156",
                          status: "Entregado",
                          date: "Hace 3 días"
                        }
                      ].map((campaign, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <p className="font-medium">{campaign.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {campaign.sent} enviados • {campaign.opened} abiertos
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={campaign.status === "Entregado" ? "default" : "secondary"}>
                              {campaign.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">{campaign.date}</span>
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