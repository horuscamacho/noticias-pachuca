/**
 * 📰 Noticias Route
 * Main route for the news extraction dashboard
 */

import { createFileRoute } from '@tanstack/react-router';
import { AppSidebar } from '@/components/AppSidebar';
import { SiteHeader } from '@/components/SiteHeader';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { NoticiasDashboard } from '@/features/noticias/components/NoticiasDashboard';

export const Route = createFileRoute('/_authenticated/noticias')({
  component: NoticiasPage,
  meta: () => [
    {
      title: 'Noticias - Extracción de Contenido',
      description: 'Dashboard para gestión de extracción automática de noticias desde URLs externas',
    },
  ],
});

function NoticiasPage() {
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
              <NoticiasDashboard />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}