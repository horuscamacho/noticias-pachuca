import { createFileRoute } from '@tanstack/react-router';
import { AppSidebar } from '@/components/AppSidebar';
import { SiteHeader } from '@/components/SiteHeader';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { PachucaNoticiasDashboard } from '@/features/pachuca-noticias/components';

export const Route = createFileRoute('/_authenticated/pachuca-noticias')({
  component: PachucaNoticiasPage,
  meta: () => [
    {
      title: 'Pachuca Noticias - Gestión de Publicaciones',
      description: 'Dashboard para gestionar noticias publicadas en el sitio público',
    },
  ],
});

function PachucaNoticiasPage() {
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
              <div className="px-4 lg:px-6">
                {/* 📰 Header */}
                <div className="mb-6">
                  <h1 className="text-3xl font-bold tracking-tight">
                    📰 Pachuca Noticias
                  </h1>
                  <p className="text-muted-foreground mt-2">
                    Gestiona contenidos generados y publicaciones en el sitio público noticiaspachuca.com
                  </p>
                </div>

                {/* 📊 Dashboard con Tabs */}
                <PachucaNoticiasDashboard />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
