import { createFileRoute } from '@tanstack/react-router';
import { AppSidebar } from '@/components/AppSidebar';
import { SiteHeader } from '@/components/SiteHeader';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { GeneratorProDashboard } from '@/features/generator-pro/components/GeneratorProDashboard';

export const Route = createFileRoute('/_authenticated/generator-pro')({
  component: GeneratorProPage,
  meta: () => [
    {
      title: 'Generator Pro - Sistema Automatizado',
      description: 'Dashboard para automatización de noticias y publicación en Facebook',
    },
  ],
});

function GeneratorProPage() {
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
                <div className="space-y-6">
                  <GeneratorProDashboard />
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}