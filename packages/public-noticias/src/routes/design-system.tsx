import { createFileRoute } from '@tanstack/react-router'
import { Showroom } from '@/components/design-system'

export const Route = createFileRoute('/design-system')({
  component: DesignSystemPage,
  meta: () => [
    {
      title: 'Design System - Noticias Pachuca',
    },
    {
      name: 'description',
      content: 'Sistema de diseño brutalist para el sitio web de Noticias Pachuca',
    },
  ],
})

function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="container mx-auto">
        <Showroom />
      </div>
    </div>
  )
}