import { createFileRoute } from '@tanstack/react-router';
import { AppSidebar } from '@/components/AppSidebar';
import { SiteHeader } from '@/components/SiteHeader';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import {
  PublicationQueueView,
  QueueStatsCards,
  QueueTimeline
} from '@/features/pachuca-noticias/components';

export const Route = createFileRoute('/_authenticated/pachuca-noticias/queue')({
  component: QueuePage,
  meta: () => [
    {
      title: 'Cola de Publicación - Pachuca Noticias',
      description: 'Gestión de cola inteligente de publicaciones programadas',
    },
  ],
});

function QueuePage() {
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
                {/* 📋 Header */}
                <div className="mb-6">
                  <h1 className="text-3xl font-bold tracking-tight">
                    📋 Cola de Publicación
                  </h1>
                  <p className="text-muted-foreground mt-2">
                    Sistema inteligente de programación y gestión de publicaciones
                  </p>
                </div>

                {/* 📊 Stats Cards */}
                <div className="mb-6">
                  <QueueStatsCards />
                </div>

                {/* 📋 Layout: Queue View + Timeline */}
                <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
                  {/* Main content: Queue View */}
                  <div>
                    <PublicationQueueView />
                  </div>

                  {/* Sidebar: Timeline */}
                  <aside className="hidden lg:block">
                    <QueueTimeline />
                  </aside>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
