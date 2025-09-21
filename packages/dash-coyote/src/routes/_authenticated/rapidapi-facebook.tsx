// 📄 RapidAPI Facebook Route - Dashboard de APIs de terceros para Facebook
import { createFileRoute } from '@tanstack/react-router'
import { AppSidebar } from '@/components/AppSidebar'
import { SiteHeader } from '@/components/SiteHeader'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { RapidAPIFacebookDashboard } from '../../features/rapidapi-facebook/components/RapidAPIFacebookDashboard'

export const Route = createFileRoute('/_authenticated/rapidapi-facebook')({
  component: RapidAPIFacebookPage,
  meta: () => [
    {
      title: 'RapidAPI Facebook - Pachuca Noticias',
      description: 'Gestión de APIs de terceros para extracción de Facebook'
    }
  ]
})

function RapidAPIFacebookPage() {
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
              <RapidAPIFacebookDashboard />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}