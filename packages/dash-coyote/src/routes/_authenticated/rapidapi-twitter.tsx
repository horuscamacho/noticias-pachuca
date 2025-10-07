// 🐦 RapidAPI Twitter Route - Dashboard de APIs de terceros para Twitter
import { createFileRoute } from '@tanstack/react-router'
import { AppSidebar } from '@/components/AppSidebar'
import { SiteHeader } from '@/components/SiteHeader'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { RapidAPITwitterDashboard } from '../../features/rapidapi-twitter/components/RapidAPITwitterDashboard'

export const Route = createFileRoute('/_authenticated/rapidapi-twitter')({
  component: RapidAPITwitterPage,
  meta: () => [
    {
      title: 'RapidAPI Twitter - Pachuca Noticias',
      description: 'Gestión de APIs de terceros para extracción de Twitter'
    }
  ]
})

function RapidAPITwitterPage() {
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
              <RapidAPITwitterDashboard />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}