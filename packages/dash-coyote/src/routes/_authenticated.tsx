// 🔒 Authenticated Layout - Protected routes
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    // 🔒 Verificar autenticación antes de cargar
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          // Guardar la URL para redireccionar después del login
          redirect: location.href,
        },
      })
    }
  },
  component: AuthenticatedLayout,
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-xl font-semibold text-destructive">Error de Autenticación</h1>
        <p className="text-muted-foreground">{error.message}</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Reintentar
        </button>
      </div>
    </div>
  ),
})

function AuthenticatedLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  )
}