import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { QueryClient } from '@tanstack/react-query'
import type { AuthContext } from '../features/auth/types/auth.types'

interface RouterContext {
  queryClient: QueryClient
  auth: AuthContext
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-6">
        <h1 className="text-2xl font-bold text-destructive">Error de Aplicación</h1>
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

function RootComponent() {
  return (
    <>
      <main className="min-h-screen bg-background">
        <Outlet />
      </main>

      {/* DevTools solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <TanStackRouterDevtools />
      )}
    </>
  )
}
