// 📊 Dashboard Route - Implementación completa siguiendo TanStack Router best practices
import { createFileRoute } from '@tanstack/react-router'
import { AppSidebar } from '@/components/AppSidebar'
import { SectionCards } from '@/components/dashboard/SectionCards'
import { ChartAreaInteractive } from '@/components/dashboard/ChartAreaInteractive'
import { DataTable } from '@/components/dashboard/DataTable'
import { SiteHeader } from '@/components/SiteHeader'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { tableData } from '@/data/mockData'

// Socket.IO components
import { useDashboardRealTime, ConnectionStatus, NotificationToast } from '@/socket'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold text-destructive">Error loading dashboard</h2>
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
        <span>Loading dashboard...</span>
      </div>
    </div>
  ),
})

function DashboardPage() {
  // 🔌 Activar sincronización en tiempo real
  useDashboardRealTime();

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
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <div className="px-4 lg:px-6">
                <DataTable data={tableData} />
              </div>

              {/* Socket.IO Status */}
              <div className="px-4 lg:px-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Estado de Conexión</h2>
                  <ConnectionStatus showDetails={true} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Toast notifications */}
      <NotificationToast autoShow={true} playSound={true} />
    </SidebarProvider>
  )
}