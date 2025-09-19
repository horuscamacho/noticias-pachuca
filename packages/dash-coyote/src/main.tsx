import { StrictMode, useMemo } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Import auth store
import { useAuthStore } from './features/auth/stores/authStore'

// Import Socket.IO provider
import { SocketProvider } from './socket'

import './styles.css'
import reportWebVitals from './reportWebVitals.ts'

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,   // 10 minutes (garbage collection)
      retry: (failureCount, error) => {
        // Don't retry on 401/403 errors
        if (error && 'status' in error && [401, 403].includes(error.status as number)) {
          return false
        }
        return failureCount < 3
      },
    },
  },
})

// Create router instance with context
const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
  context: {
    queryClient,
    auth: undefined!, // Will be populated by RouterProvider
  },
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// App component with context providers
function App() {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isLoading = useAuthStore((state) => state.isLoading)

  const auth = useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
  }), [user, isAuthenticated, isLoading])

  const context = useMemo(() => ({
    queryClient,
    auth
  }), [auth])

  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider
        url={import.meta.env.VITE_SOCKET_URL}
        autoConnect={isAuthenticated}
      >
        <RouterProvider
          router={router}
          context={context}
        />

        {/* DevTools solo en desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </SocketProvider>
    </QueryClientProvider>
  )
}

// Render the app
const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
