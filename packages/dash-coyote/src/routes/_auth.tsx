// 🔓 Auth Layout - Redirect if already authenticated
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth')({
  beforeLoad: ({ context, search }) => {
    // 🔓 Redirect to dashboard if already authenticated
    if (context.auth.isAuthenticated) {
      const redirectTo = (search as { redirect?: string })?.redirect || '/dashboard'
      throw redirect({ to: redirectTo })
    }
  },
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md space-y-6 p-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Coyote Dash</h1>
          <p className="text-muted-foreground">Panel de administración</p>
        </div>

        <div className="bg-card rounded-lg border shadow-sm p-6">
          <Outlet />
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Noticias Pachuca. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  )
}