# 🚀 TanStack Router Best Practices 2025

> **Guía definitiva para desarrollo con TanStack Router v1.x** siguiendo las mejores prácticas de 2025

## 🎯 RESUMEN EJECUTIVO

### ¿Por qué TanStack Router?
- **100% Type-Safe**: Inferencia completa de TypeScript sin configuración manual
- **File-Based Routing**: Estructura de archivos = estructura de rutas (como Next.js)
- **Performance**: Built-in caching, preloading automático, y lazy loading
- **Developer Experience**: DevTools integradas, hot reloading, error boundaries
- **Ecosystem**: Integración perfecta con TanStack Query, shadcn/ui, y Zustand

### Stack Recomendado 2025
```typescript
// Core Router
"@tanstack/react-router": "^1.94.0"     // Router principal
"@tanstack/router-devtools": "^1.94.0"  // DevTools development
"@tanstack/router-plugin": "^1.94.0"    // File-based routing

// State Management
"zustand": "^5.0.1"                     // Client state (recomendado)
"@tanstack/react-query": "^5.61.0"     // Server state

// UI Framework
"@shadcn/ui": "latest"                  // Component library
"tailwindcss": "^3.4.0"               // Styling
"class-variance-authority": "^0.7.0"   // CVA patterns

// Authentication
"@auth/core": "^0.37.0"                // Auth.js integration
"jose": "^5.9.3"                      // JWT handling
```

---

## 📁 ARQUITECTURA DE DIRECTORIOS

### Patrón: **Route-First + Feature Co-location**

```
src/
├── 📁 routes/                          # File-based routing (AUTO-GENERATED)
│   ├── 📄 __root.tsx                   # Root layout + context
│   ├── 📄 index.tsx                    # Home page (/)
│   ├── 📄 about.tsx                    # About page (/about)
│   ├── 📁 _authenticated/              # Protected routes layout
│   │   ├── 📄 route.tsx                # Auth guard + layout
│   │   ├── 📄 dashboard.tsx            # /dashboard
│   │   ├── 📄 profile.tsx              # /profile
│   │   └── 📁 admin/                   # Admin section
│   │       ├── 📄 route.tsx            # Admin-only layout
│   │       ├── 📄 users.tsx            # /admin/users
│   │       └── 📄 settings.tsx         # /admin/settings
│   ├── 📁 _auth/                       # Auth-related routes
│   │   ├── 📄 route.tsx                # Auth layout (redirects if authenticated)
│   │   ├── 📄 login.tsx                # /login
│   │   ├── 📄 register.tsx             # /register
│   │   └── 📄 forgot-password.tsx      # /forgot-password
│   └── 📄 api.users.$userId.tsx        # API route /api/users/123
├── 📁 features/                        # Feature modules (business logic)
│   ├── 📁 auth/
│   │   ├── 📁 components/              # AuthForm, PasswordInput
│   │   ├── 📁 hooks/                   # useAuth, useLogin, useLogout
│   │   ├── 📁 services/                # authApi.ts, tokenService.ts
│   │   ├── 📁 stores/                  # authStore.ts (Zustand)
│   │   ├── 📁 types/                   # auth.types.ts
│   │   └── 📄 index.ts                 # Feature exports
│   ├── 📁 dashboard/
│   │   ├── 📁 components/              # DashboardCard, StatsWidget
│   │   ├── 📁 hooks/                   # useDashboardData
│   │   ├── 📁 services/                # dashboardApi.ts
│   │   └── 📄 index.ts
│   ├── 📁 users/
│   │   ├── 📁 components/              # UserList, UserForm
│   │   ├── 📁 hooks/                   # useUsers, useUserMutations
│   │   ├── 📁 services/                # usersApi.ts
│   │   └── 📄 index.ts
│   └── 📁 shared/                      # Shared across features
│       ├── 📁 components/              # UI components
│       ├── 📁 hooks/                   # Global hooks
│       ├── 📁 services/                # API base, interceptors
│       ├── 📁 stores/                  # Global stores
│       └── 📁 utils/                   # Utilities
├── 📁 components/                      # Global UI components
│   ├── 📁 ui/                          # shadcn/ui components
│   ├── 📁 layout/                      # Header, Footer, Sidebar
│   ├── 📁 forms/                       # Form wrappers
│   └── 📁 feedback/                    # Loading, Error, Toast
├── 📁 lib/                             # Core utilities
│   ├── 📄 router.ts                    # Router configuration
│   ├── 📄 auth.ts                      # Auth utilities
│   ├── 📄 api.ts                       # API client
│   ├── 📄 storage.ts                   # Storage abstraction
│   └── 📄 utils.ts                     # General utilities
├── 📁 stores/                          # Global Zustand stores
│   ├── 📄 authStore.ts                 # Authentication
│   ├── 📄 uiStore.ts                   # UI state (theme, sidebar)
│   └── 📄 index.ts                     # Store exports
├── 📁 types/                           # Global TypeScript types
│   ├── 📄 api.types.ts                 # API interfaces
│   ├── 📄 auth.types.ts                # Auth interfaces
│   └── 📄 global.types.ts              # Global types
└── 📄 main.tsx                         # App entry point
```

---

## 🔧 CONFIGURACIÓN INICIAL

### 1. Router Setup

```typescript
// src/lib/router.ts
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { QueryClient } from '@tanstack/react-query'
import { authStore } from '@/stores/authStore'

// Query client para data loading
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,   // 10 minutes (garbage collection)
    },
  },
})

// Router con context tipado
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',     // Preload on hover/focus
  defaultPreloadStaleTime: 0,   // Always fresh
  context: {
    queryClient,
    auth: undefined!,           // Will be populated by RouterProvider
  },
})

// TypeScript module augmentation
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
```

### 2. Root Route con Context

```typescript
// src/routes/__root.tsx
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { QueryClient } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/features/auth'
import type { AuthState } from '@/types/auth.types'

interface RouterContext {
  queryClient: QueryClient
  auth: AuthState
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p className="text-gray-600">{error.message}</p>
      </div>
    </div>
  ),
})

function RootComponent() {
  return (
    <html lang="es">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Noticias Pachuca</title>
      </head>
      <body className="antialiased">
        <AuthProvider>
          <div className="min-h-screen bg-background">
            <Outlet />
          </div>
          <Toaster />
        </AuthProvider>

        {/* DevTools solo en desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <TanStackRouterDevtools router={router} />
        )}
      </body>
    </html>
  )
}
```

### 3. App Entry Point

```typescript
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { router } from './lib/router'
import { queryClient } from './lib/queryClient'
import { useAuthStore } from './stores/authStore'
import './styles/globals.css'

function App() {
  const auth = useAuthStore()

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider
        router={router}
        context={{ queryClient, auth }}
      />

      {/* DevTools */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}

const rootElement = document.getElementById('root')!
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

---

## 🔐 AUTENTICACIÓN SEGURA

### Patrón: **Layout-Based Protection + Context**

### 1. Zustand Auth Store (Recomendado 2025)

```typescript
// src/stores/authStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { User, AuthTokens } from '@/types/auth.types'

interface AuthState {
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  login: (user: User, tokens: AuthTokens) => void
  logout: () => void
  updateTokens: (tokens: AuthTokens) => void
  updateUser: (userData: Partial<User>) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,

      login: (user, tokens) => {
        set((state) => {
          state.user = user
          state.tokens = tokens
          state.isAuthenticated = true
          state.isLoading = false
        })
      },

      logout: () => {
        set((state) => {
          state.user = null
          state.tokens = null
          state.isAuthenticated = false
          state.isLoading = false
        })
      },

      updateTokens: (tokens) => {
        set((state) => {
          state.tokens = tokens
        })
      },

      updateUser: (userData) => {
        set((state) => {
          if (state.user) {
            Object.assign(state.user, userData)
          }
        })
      },

      setLoading: (loading) => {
        set((state) => {
          state.isLoading = loading
        })
      },
    })),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// Selectors optimizados
export const useAuthUser = () => useAuthStore((state) => state.user)
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)
export const useAuthTokens = () => useAuthStore((state) => state.tokens)
```

### 2. Protected Routes Layout

```typescript
// src/routes/_authenticated/route.tsx
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

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
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-semibold">Authentication Error</h1>
        <p className="text-gray-600">{error.message}</p>
      </div>
    </div>
  ),
})

function AuthenticatedLayout() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  )
}
```

### 3. Auth Routes Layout (Redirect if authenticated)

```typescript
// src/routes/_auth/route.tsx
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { AuthLayout } from '@/components/layout/AuthLayout'

export const Route = createFileRoute('/_auth')({
  beforeLoad: ({ context, search }) => {
    // 🔓 Redireccionar a dashboard si ya está autenticado
    if (context.auth.isAuthenticated) {
      const redirectTo = search?.redirect || '/dashboard'
      throw redirect({ to: redirectTo })
    }
  },
  component: AuthLayoutWrapper,
})

function AuthLayoutWrapper() {
  return (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  )
}
```

### 4. Login Route con Search Params

```typescript
// src/routes/_auth/login.tsx
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { z } from 'zod'
import { LoginForm } from '@/features/auth/components/LoginForm'

// Schema para search params
const loginSearchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/_auth/login')({
  component: LoginPage,
  validateSearch: loginSearchSchema,
})

function LoginPage() {
  const router = useRouter()
  const { redirect } = Route.useSearch()

  const handleLoginSuccess = () => {
    // Navegar a la URL de redirección o dashboard
    router.navigate({
      to: redirect || '/dashboard',
      replace: true, // No agregar al historial
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Iniciar Sesión</h1>
          <p className="text-gray-600">Accede a tu cuenta</p>
        </div>

        <LoginForm onSuccess={handleLoginSuccess} />
      </div>
    </div>
  )
}
```

### 5. API Client con Interceptors

```typescript
// src/lib/api.ts
import axios, { AxiosInstance } from 'axios'
import { useAuthStore } from '@/stores/authStore'
import { router } from './router'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
      timeout: 10000,
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // 📤 Request Interceptor - Auto Auth
    this.client.interceptors.request.use(
      (config) => {
        const tokens = useAuthStore.getState().tokens

        if (tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`
        }

        // Headers adicionales
        config.headers['Content-Type'] = 'application/json'
        config.headers['X-Platform'] = 'web'

        return config
      },
      (error) => Promise.reject(error)
    )

    // 📥 Response Interceptor - Token Refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        // Token expirado - intentar refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshed = await this.refreshTokens()
            if (refreshed) {
              // Reintentar la request original
              return this.client(originalRequest)
            }
          } catch {
            // Refresh falló - logout
            this.handleAuthFailure()
          }
        }

        return Promise.reject(error)
      }
    )
  }

  private async refreshTokens(): Promise<boolean> {
    const { tokens, updateTokens } = useAuthStore.getState()

    if (!tokens?.refreshToken) {
      return false
    }

    try {
      const response = await axios.post('/api/auth/refresh', {
        refreshToken: tokens.refreshToken,
      })

      const newTokens = response.data
      updateTokens(newTokens)

      return true
    } catch {
      return false
    }
  }

  private handleAuthFailure() {
    useAuthStore.getState().logout()
    router.navigate({ to: '/login', replace: true })
  }

  // Métodos públicos
  get = this.client.get
  post = this.client.post
  put = this.client.put
  delete = this.client.delete
  patch = this.client.patch
}

export const apiClient = new ApiClient()
```

---

## 🎨 INTEGRACION CON SHADCN/UI

### Setup Automático con Template

```bash
# Crear proyecto con template completo
pnpm dlx create-tsrouter-app@latest my-app \
  --template file-router \
  --tailwind \
  --add-ons shadcn

# O agregar a proyecto existente
pnpm dlx shadcn@canary init
pnpm dlx shadcn@canary add button card input form
```

### Component Pattern con CVA

```typescript
// src/components/ui/button.tsx (shadcn/ui + CVA)
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

### Form Pattern con React Hook Form

```typescript
// src/features/auth/components/LoginForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '../hooks/useAuth'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSuccess?: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { toast } = useToast()
  const { loginMutation } = useAuth()

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: 'Login exitoso',
          description: 'Bienvenido de vuelta',
        })
        onSuccess?.()
      },
      onError: (error) => {
        toast({
          title: 'Error de login',
          description: error.message,
          variant: 'destructive',
        })
      },
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Iniciar Sesión</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...form.register('password')}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? 'Iniciando...' : 'Iniciar Sesión'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

---

## 📊 DATA LOADING PATTERNS

### Pattern 1: Route Loaders (Recomendado)

```typescript
// src/routes/_authenticated/dashboard.tsx
import { createFileRoute } from '@tanstack/react-router'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/features/dashboard/services/dashboardApi'
import { DashboardView } from '@/features/dashboard/components/DashboardView'

// Query options reutilizable
const dashboardQueryOptions = () =>
  queryOptions({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.getDashboardData(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  })

export const Route = createFileRoute('/_authenticated/dashboard')({
  // 🔥 Pre-cargar datos en el loader
  loader: ({ context }) => {
    const query = dashboardQueryOptions()

    // Prefetch o ensure query
    return context.queryClient.ensureQueryData(query)
  },
  component: DashboardPage,
  pendingComponent: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
  errorComponent: ({ error, reset }) => (
    <div className="text-center space-y-4">
      <h2 className="text-xl font-semibold text-destructive">Error loading dashboard</h2>
      <p className="text-gray-600">{error.message}</p>
      <Button onClick={reset}>Try Again</Button>
    </div>
  ),
})

function DashboardPage() {
  // ✅ Datos ya están cargados - no loading state necesario
  const { data } = useSuspenseQuery(dashboardQueryOptions())

  return <DashboardView data={data} />
}
```

### Pattern 2: Search Params + Filters

```typescript
// src/routes/_authenticated/users.tsx
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { usersApi } from '@/features/users/services/usersApi'

// Search params schema
const usersSearchSchema = z.object({
  page: z.number().min(1).catch(1),
  limit: z.number().min(1).max(100).catch(10),
  search: z.string().optional(),
  role: z.enum(['admin', 'user', 'editor']).optional(),
  sort: z.enum(['name', 'email', 'createdAt']).catch('createdAt'),
  order: z.enum(['asc', 'desc']).catch('desc'),
})

const usersQueryOptions = (filters: z.infer<typeof usersSearchSchema>) =>
  queryOptions({
    queryKey: ['users', filters],
    queryFn: () => usersApi.getUsers(filters),
    staleTime: 1000 * 60 * 2,
  })

export const Route = createFileRoute('/_authenticated/users')({
  validateSearch: usersSearchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context, deps }) => {
    return context.queryClient.ensureQueryData(usersQueryOptions(deps.search))
  },
  component: UsersPage,
})

function UsersPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const { data } = useSuspenseQuery(usersQueryOptions(search))

  const updateFilters = (newFilters: Partial<typeof search>) => {
    navigate({
      search: { ...search, ...newFilters, page: 1 }, // Reset to page 1
      replace: true, // No agregar al historial
    })
  }

  return (
    <div className="space-y-6">
      <UserFilters
        filters={search}
        onFiltersChange={updateFilters}
      />
      <UserTable
        data={data}
        pagination={search}
        onPageChange={(page) => updateFilters({ page })}
      />
    </div>
  )
}
```

### Pattern 3: Infinite Loading

```typescript
// src/routes/_authenticated/news.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useIntersection } from '@/hooks/useIntersection'
import { newsApi } from '@/features/news/services/newsApi'

export const Route = createFileRoute('/_authenticated/news')({
  component: NewsPage,
})

function NewsPage() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['news', 'infinite'],
    queryFn: ({ pageParam }) => newsApi.getNews({
      page: pageParam,
      limit: 20,
    }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.hasNext) {
        return pages.length + 1
      }
      return undefined
    },
  })

  // Auto-load más cuando se acerca al final
  const { ref } = useIntersection({
    onIntersect: () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
  })

  if (isLoading) {
    return <NewsListSkeleton />
  }

  const articles = data?.pages.flatMap(page => page.data) ?? []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Noticias</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </div>

      {/* Trigger para infinite scroll */}
      {hasNextPage && (
        <div ref={ref} className="flex justify-center p-4">
          {isFetchingNextPage ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          ) : (
            <Button
              onClick={() => fetchNextPage()}
              variant="outline"
            >
              Cargar más
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
```

---

## 🔄 STATE MANAGEMENT MODERNO

### Zustand Store Patterns (Recomendado 2025)

```typescript
// src/stores/uiStore.ts - UI State Global
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface UiState {
  // Theme
  theme: 'light' | 'dark' | 'system'

  // Layout
  sidebarOpen: boolean
  sidebarCollapsed: boolean

  // Modal/Dialog state
  modals: {
    createUser: boolean
    deleteConfirm: boolean
  }

  // Notifications
  notifications: Array<{
    id: string
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    timestamp: number
  }>

  // Actions
  setTheme: (theme: UiState['theme']) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  openModal: (modal: keyof UiState['modals']) => void
  closeModal: (modal: keyof UiState['modals']) => void
  addNotification: (notification: Omit<UiState['notifications'][0], 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
}

export const useUiStore = create<UiState>()(
  persist(
    immer((set, get) => ({
      theme: 'system',
      sidebarOpen: true,
      sidebarCollapsed: false,
      modals: {
        createUser: false,
        deleteConfirm: false,
      },
      notifications: [],

      setTheme: (theme) => {
        set((state) => {
          state.theme = theme
        })
      },

      toggleSidebar: () => {
        set((state) => {
          state.sidebarOpen = !state.sidebarOpen
        })
      },

      setSidebarCollapsed: (collapsed) => {
        set((state) => {
          state.sidebarCollapsed = collapsed
        })
      },

      openModal: (modal) => {
        set((state) => {
          state.modals[modal] = true
        })
      },

      closeModal: (modal) => {
        set((state) => {
          state.modals[modal] = false
        })
      },

      addNotification: (notification) => {
        set((state) => {
          state.notifications.push({
            ...notification,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
          })
        })
      },

      removeNotification: (id) => {
        set((state) => {
          state.notifications = state.notifications.filter(n => n.id !== id)
        })
      },
    })),
    {
      name: 'ui-store',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)

// Selectors optimizados
export const useTheme = () => useUiStore((state) => state.theme)
export const useSidebar = () => useUiStore((state) => ({
  isOpen: state.sidebarOpen,
  isCollapsed: state.sidebarCollapsed,
  toggle: state.toggleSidebar,
  setCollapsed: state.setSidebarCollapsed,
}))
export const useModals = () => useUiStore((state) => ({
  modals: state.modals,
  open: state.openModal,
  close: state.closeModal,
}))
```

### TanStack Query + Zustand Integration

```typescript
// src/features/users/stores/usersStore.ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface UsersStoreState {
  // Selection state (no necesita persistencia)
  selectedUsers: string[]
  bulkAction: 'delete' | 'activate' | 'deactivate' | null

  // Filters (sincronizados con URL via TanStack Router)
  filters: {
    search: string
    role: string | null
    status: string | null
  }

  // Actions
  selectUser: (userId: string) => void
  selectAllUsers: (userIds: string[]) => void
  clearSelection: () => void
  setBulkAction: (action: UsersStoreState['bulkAction']) => void
  setFilters: (filters: Partial<UsersStoreState['filters']>) => void
}

export const useUsersStore = create<UsersStoreState>()(
  immer((set, get) => ({
    selectedUsers: [],
    bulkAction: null,
    filters: {
      search: '',
      role: null,
      status: null,
    },

    selectUser: (userId) => {
      set((state) => {
        const index = state.selectedUsers.indexOf(userId)
        if (index >= 0) {
          state.selectedUsers.splice(index, 1)
        } else {
          state.selectedUsers.push(userId)
        }
      })
    },

    selectAllUsers: (userIds) => {
      set((state) => {
        const allSelected = userIds.every(id => state.selectedUsers.includes(id))
        if (allSelected) {
          state.selectedUsers = []
        } else {
          state.selectedUsers = userIds
        }
      })
    },

    clearSelection: () => {
      set((state) => {
        state.selectedUsers = []
        state.bulkAction = null
      })
    },

    setBulkAction: (action) => {
      set((state) => {
        state.bulkAction = action
      })
    },

    setFilters: (filters) => {
      set((state) => {
        Object.assign(state.filters, filters)
      })
    },
  }))
)
```

---

## 🏗️ COMPONENT PATTERNS

### 1. Layout Components

```typescript
// src/components/layout/DashboardLayout.tsx
import { Link, useRouter } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/stores/authStore'
import { useSidebar } from '@/stores/uiStore'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const { isOpen, isCollapsed, toggle, setCollapsed } = useSidebar()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.navigate({ to: '/login', replace: true })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-40 h-screen transition-transform",
        isCollapsed ? "w-16" : "w-64",
        !isOpen && "-translate-x-full lg:translate-x-0"
      )}>
        <div className="h-full px-3 py-4 bg-card border-r">
          {/* Logo */}
          <div className="mb-6">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg" />
              {!isCollapsed && (
                <span className="text-xl font-bold">Noticias</span>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <SidebarLink
              to="/dashboard"
              icon={<DashboardIcon />}
              label="Dashboard"
              collapsed={isCollapsed}
            />
            <SidebarLink
              to="/users"
              icon={<UsersIcon />}
              label="Usuarios"
              collapsed={isCollapsed}
            />
            <SidebarLink
              to="/articles"
              icon={<ArticlesIcon />}
              label="Artículos"
              collapsed={isCollapsed}
            />
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn(
        "transition-all",
        isCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              className="lg:hidden"
            >
              <MenuIcon />
            </Button>

            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback>
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Perfil</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings">Configuración</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

interface SidebarLinkProps {
  to: string
  icon: React.ReactNode
  label: string
  collapsed: boolean
}

function SidebarLink({ to, icon, label, collapsed }: SidebarLinkProps) {
  const router = useRouter()
  const isActive = router.state.location.pathname === to

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  )
}
```

### 2. Data Table Pattern

```typescript
// src/components/DataTable.tsx
import { useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  getSortedRowModel,
  type VisibilityState,
  getFilteredRowModel,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey = 'name',
  searchPlaceholder = 'Buscar...',
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnVisibility,
      globalFilter,
    },
  })

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Input
          placeholder={searchPlaceholder}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Columnas
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No hay resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination info */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} de{" "}
          {table.getFilteredRowModel().rows.length} fila(s) seleccionadas.
        </div>
      </div>
    </div>
  )
}
```

---

## 🔒 SECURITY BEST PRACTICES

### 1. JWT Token Management

```typescript
// src/lib/auth/tokenManager.ts
import { jwtDecode } from 'jose'

interface TokenPayload {
  sub: string
  email: string
  role: string
  exp: number
  iat: number
}

export class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'accessToken'
  private static readonly REFRESH_TOKEN_KEY = 'refreshToken'

  static storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken)
  }

  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY)
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY)
  }

  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY)
    localStorage.removeItem(this.REFRESH_TOKEN_KEY)
  }

  static isTokenValid(token: string): boolean {
    try {
      const payload = jwtDecode<TokenPayload>(token)
      const now = Math.floor(Date.now() / 1000)

      // Verificar que no esté expirado
      return payload.exp > now
    } catch {
      return false
    }
  }

  static isTokenExpiringSoon(token: string, minutesBuffer = 5): boolean {
    try {
      const payload = jwtDecode<TokenPayload>(token)
      const now = Math.floor(Date.now() / 1000)
      const bufferSeconds = minutesBuffer * 60

      return payload.exp - now <= bufferSeconds
    } catch {
      return true
    }
  }

  static getTokenPayload(token: string): TokenPayload | null {
    try {
      return jwtDecode<TokenPayload>(token)
    } catch {
      return null
    }
  }
}
```

### 2. CSRF Protection

```typescript
// src/lib/security/csrf.ts
export class CSRFProtection {
  private static readonly CSRF_TOKEN_KEY = 'csrf-token'
  private static csrfToken: string | null = null

  static async getCSRFToken(): Promise<string> {
    if (this.csrfToken) {
      return this.csrfToken
    }

    try {
      const response = await fetch('/api/csrf-token', {
        credentials: 'include',
      })

      const data = await response.json()
      this.csrfToken = data.token

      return this.csrfToken
    } catch (error) {
      console.error('Failed to get CSRF token:', error)
      throw new Error('CSRF token unavailable')
    }
  }

  static async getCSRFHeaders(): Promise<Record<string, string>> {
    const token = await this.getCSRFToken()
    return {
      'X-CSRF-Token': token,
    }
  }

  static clearCSRFToken(): void {
    this.csrfToken = null
  }
}
```

### 3. Input Sanitization

```typescript
// src/lib/security/sanitization.ts
import DOMPurify from 'dompurify'

export class InputSanitizer {
  static sanitizeHTML(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['class'],
    })
  }

  static sanitizeText(text: string): string {
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+="/gi, '')
      .trim()
  }

  static sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255)
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= 254
  }

  static validateURL(url: string): boolean {
    try {
      const parsed = new URL(url)
      return ['http:', 'https:'].includes(parsed.protocol)
    } catch {
      return false
    }
  }
}
```

---

## 📈 PERFORMANCE OPTIMIZATION

### 1. Code Splitting por Routes

```typescript
// src/routes/_authenticated/analytics.lazy.tsx
import { createLazyFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

// Lazy load del componente pesado
const AnalyticsPage = lazy(() =>
  import('@/features/analytics/components/AnalyticsPage').then(module => ({
    default: module.AnalyticsPage
  }))
)

export const Route = createLazyFileRoute('/_authenticated/analytics')({
  component: AnalyticsPage,
})
```

### 2. Virtual Scrolling para Listas Grandes

```typescript
// src/components/VirtualizedList.tsx
import { FixedSizeList } from 'react-window'
import { memo } from 'react'

interface VirtualizedListProps<T> {
  items: T[]
  itemHeight: number
  height: number
  renderItem: (item: T, index: number) => React.ReactNode
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  height,
  renderItem
}: VirtualizedListProps<T>) {
  const Row = memo(({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      {renderItem(items[index], index)}
    </div>
  ))

  return (
    <FixedSizeList
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  )
}
```

### 3. Image Optimization

```typescript
// src/components/OptimizedImage.tsx
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  lazy?: boolean
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  lazy = true
}: OptimizedImageProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const handleLoad = () => setLoading(false)
  const handleError = () => {
    setError(true)
    setLoading(false)
  }

  if (error) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-gray-100 text-gray-400",
        className
      )}>
        <ImageIcon className="w-8 h-8" />
      </div>
    )
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}

      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={lazy ? 'lazy' : 'eager'}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-opacity duration-300",
          loading ? "opacity-0" : "opacity-100"
        )}
      />
    </div>
  )
}
```

---

## 🧪 TESTING STRATEGIES

### 1. Route Testing

```typescript
// src/routes/__tests__/dashboard.test.tsx
import { render, screen } from '@testing-library/react'
import { createMemoryHistory } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from '@/lib/router'

// Mock del auth store
const mockAuthStore = {
  user: { id: '1', name: 'Test User' },
  isAuthenticated: true,
  tokens: { accessToken: 'test-token' },
}

describe('Dashboard Route', () => {
  it('renders dashboard when authenticated', async () => {
    const history = createMemoryHistory({
      initialEntries: ['/dashboard'],
    })

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <router.RouterProvider
          router={router}
          context={{
            queryClient,
            auth: mockAuthStore
          }}
        />
      </QueryClientProvider>
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('redirects to login when not authenticated', async () => {
    const history = createMemoryHistory({
      initialEntries: ['/dashboard'],
    })

    const unauthenticatedStore = {
      ...mockAuthStore,
      isAuthenticated: false,
      user: null,
      tokens: null,
    }

    // Test redirection logic
    expect(history.location.pathname).toBe('/login')
  })
})
```

### 2. Component Testing con MSW

```typescript
// src/features/users/__tests__/UserList.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { UserList } from '../components/UserList'
import { TestWrapper } from '@/test-utils/TestWrapper'

const server = setupServer(
  http.get('/api/users', () => {
    return HttpResponse.json({
      data: [
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
      ],
      pagination: {
        page: 1,
        totalPages: 1,
        total: 2,
      },
    })
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('UserList', () => {
  it('displays users when data loads successfully', async () => {
    render(
      <TestWrapper>
        <UserList />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })
  })

  it('shows error state when API fails', async () => {
    server.use(
      http.get('/api/users', () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    render(
      <TestWrapper>
        <UserList />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/error loading users/i)).toBeInTheDocument()
    })
  })
})
```

---

## 📦 DEPLOYMENT & BUILD

### 1. Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks
          react: ['react', 'react-dom'],
          router: ['@tanstack/react-router'],
          query: ['@tanstack/react-query'],
          ui: ['@radix-ui/react-slot', 'class-variance-authority'],
        },
      },
    },
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

### 2. Docker Multi-stage Build

```dockerfile
# Dockerfile
FROM node:20-alpine AS base
RUN corepack enable pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 3. Nginx Configuration

```nginx
# nginx.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_comp_level 9;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://api:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 📋 CHECKLIST DE MIGRACIÓN

### ✅ **Desde Astro hacia TanStack Router**

#### **Setup Inicial**
- [ ] Instalar TanStack Router + dependencias
- [ ] Configurar file-based routing con plugin
- [ ] Setup TypeScript con strict mode
- [ ] Configurar shadcn/ui + Tailwind CSS
- [ ] Instalar Zustand para state management

#### **Autenticación**
- [ ] Migrar Nanostores auth a Zustand
- [ ] Implementar `beforeLoad` guards en rutas protegidas
- [ ] Configurar layout routes `_authenticated/` y `_auth/`
- [ ] Setup API client con interceptors automáticos
- [ ] Implementar token refresh logic

#### **Arquitectura**
- [ ] Crear estructura de directorios feature-first
- [ ] Migrar componentes Astro a React/TSX
- [ ] Implementar layouts con `<Outlet />`
- [ ] Configurar data loaders por ruta
- [ ] Setup error boundaries globales

#### **Data Loading**
- [ ] Integrar TanStack Query con route loaders
- [ ] Implementar search params con validación
- [ ] Setup infinite queries para listas
- [ ] Configurar cache strategies
- [ ] Implementar optimistic updates

#### **Performance**
- [ ] Configurar code splitting con lazy routes
- [ ] Implementar preloading strategies
- [ ] Optimizar bundle con manual chunks
- [ ] Setup compression y caching
- [ ] Implementar virtual scrolling para listas grandes

#### **Testing**
- [ ] Setup testing environment con Vitest
- [ ] Implementar route testing patterns
- [ ] Configurar MSW para API mocking
- [ ] Crear test utilities y wrappers
- [ ] Setup coverage reports

#### **Deployment**
- [ ] Configurar Vite build optimizado
- [ ] Setup Docker multi-stage build
- [ ] Configurar Nginx para SPA routing
- [ ] Implementar CI/CD pipeline
- [ ] Setup monitoring y logging

---

## 🎯 **EQUIVALENCIAS ASTRO ↔ TANSTACK ROUTER**

| **Aspecto** | **Astro (Actual)** | **TanStack Router (Nuevo)** |
|-------------|-------------------|---------------------------|
| **Routing** | Pages directory + `.astro` | File-based `/routes/*.tsx` |
| **Layouts** | Layout components | Route layouts + `<Outlet />` |
| **State** | Nanostores + persistence | Zustand + persist middleware |
| **Auth** | Middleware + client protection | `beforeLoad` guards + context |
| **Data** | API routes + fetch | Route loaders + TanStack Query |
| **Forms** | Astro forms + actions | React Hook Form + Zod |
| **Styles** | Global CSS + scoped | Tailwind + CVA patterns |
| **Islands** | `client:load` hydration | Component-level React |
| **SSR** | Built-in SSR | SPA with optional SSR |
| **Dev Tools** | Astro DevTools | Router + Query DevTools |

---

**📅 Documento creado:** 17 Sept 2025
**🔄 Última actualización:** 17 Sept 2025
**👤 Contexto para:** Coyotito - TanStack Router Migration Guide
**🎯 Objetivo:** Migración completa desde Astro hacia TanStack Router con mejores prácticas 2025

**🚀 Próximos pasos:** Revisar checklist y empezar migración incremental por features