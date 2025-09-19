# 🚀 Astro Best Practices 2025: Guía Completa de Desarrollo

## 📁 Estructura de Proyecto Recomendada

### Estructura Base Obligatoria
```
src/
├── pages/          # Rutas del sitio (obligatorio)
├── components/     # Componentes reutilizables
├── layouts/        # Plantillas de página
├── styles/         # CSS/Sass globales
├── assets/         # Imágenes, fuentes, etc.
├── content/        # Content Collections
├── utils/          # Funciones utilitarias
├── stores/         # Estado global (Nanostores)
└── lib/            # Configuraciones y servicios

public/             # Assets estáticos
├── favicon.ico
├── robots.txt
└── sitemap.xml
```

### Estructura Detallada para Proyectos Grandes
```
src/
├── pages/
│   ├── api/        # API routes
│   ├── blog/       # Blog pages
│   ├── admin/      # Dashboard/admin
│   └── index.astro
├── components/
│   ├── ui/         # Componentes básicos (Button, Input)
│   ├── layout/     # Header, Footer, Sidebar
│   ├── forms/      # Formularios
│   ├── charts/     # Gráficos y visualizaciones
│   └── index.ts    # Re-exportaciones
├── layouts/
│   ├── BaseLayout.astro
│   ├── BlogLayout.astro
│   └── DashboardLayout.astro
├── content/
│   ├── config.ts   # Configuración de collections
│   ├── blog/       # Posts del blog
│   └── docs/       # Documentación
├── styles/
│   ├── global.css  # Estilos globales + shadcn
│   ├── components/ # Estilos por componente
│   └── pages/      # Estilos específicos de página
├── stores/
│   ├── auth.ts     # Estado de autenticación
│   ├── ui.ts       # Estado de UI (tema, sidebar)
│   └── api.ts      # Cliente de API y cache
├── lib/
│   ├── api/        # Clientes y servicios de API
│   ├── auth/       # Utilidades de autenticación
│   ├── utils/      # Funciones helper
│   └── constants/  # Constantes de la app
└── types/
    ├── api.ts      # Tipos de API
    ├── auth.ts     # Tipos de autenticación
    └── global.ts   # Tipos globales
```

## 🏗️ Arquitectura Islands y Hidratación

### Principios Core de Islands Architecture
- **Zero JS by default**: Solo hidrata lo necesario
- **Hidratación selectiva**: Cada island es independiente
- **Progressive Enhancement**: HTML estático como base

### Estrategias de Hidratación 2025
```astro
<!-- Hidratación inmediata (alta prioridad) -->
<Component client:load />

<!-- Hidratación cuando la página esté lista (prioridad media) -->
<Component client:idle />

<!-- Hidratación cuando sea visible (baja prioridad) -->
<Component client:visible />

<!-- Hidratación según media query -->
<Component client:media="(max-width: 768px)" />

<!-- Solo en cliente (sin SSR) -->
<Component client:only="react" />
```

### Mejores Prácticas de Hidratación
```astro
---
// ✅ Correcto: Componentes interactivos específicos
import InteractiveChart from '@/components/charts/InteractiveChart';
import StaticHeader from '@/components/layout/StaticHeader';
---

<!-- Estático por defecto -->
<StaticHeader />

<!-- Solo hidrata lo que necesita interactividad -->
<InteractiveChart client:visible data={chartData} />
```

## 📊 Gestión de Estado y APIs

### 🎯 Guía de Selección de Estado 2025

#### Matriz de Decisión para Gestores de Estado

| Caso de Uso | Recomendación | Justificación |
|-------------|---------------|---------------|
| **Dashboard React-heavy** | Zustand + Nanostores híbrido | Zustand para estado interno, Nanostores para cross-islands |
| **Multi-framework site** | Nanostores | Framework agnostic, cross-islands nativo |
| **Server state complejo** | TanStack Query | Cache, invalidation, fetching avanzado |
| **Sitio estático simple** | Nanostores | Mínimo overhead, máxima compatibilidad |

#### 🏗️ Patrón Dashboard Island (React-Heavy Projects)

**Para dashboards con shadcn/ui y mucho React:**

```astro
---
// src/pages/dashboard.astro
import DashboardApp from '@/components/dashboard/DashboardApp';
---

<Layout>
  <!-- UN SOLO island grande que contiene todo el dashboard -->
  <DashboardApp client:load />
</Layout>
```

```tsx
// src/components/dashboard/DashboardApp.tsx
import { useAuthStore } from '@/stores/auth';
import { useDashboardStore } from '@/stores/dashboard';
import { Header, Sidebar, MainContent } from '@/components/dashboard';

export default function DashboardApp() {
  return (
    <div className="dashboard-layout">
      <Header />      {/* Todos comparten Zustand */}
      <Sidebar />     {/* Dentro del mismo island */}
      <MainContent /> {/* Sin problemas de estado */}
    </div>
  );
}
```

**Ventajas del patrón Dashboard Island:**
- ✅ Zustand funciona perfectamente dentro del island
- ✅ shadcn/ui components comparten contexto
- ✅ No hay problemas de estado entre islands
- ✅ Performance óptima con una sola hidratación

#### 🔄 Patrón Híbrido: Zustand + Nanostores

```typescript
// src/stores/auth.ts (Nanostores - Global)
import { atom } from 'nanostores';

export const $user = atom<User | null>(null);
export const $isAuthenticated = atom(false);
```

```typescript
// src/stores/dashboard.ts (Zustand - Dashboard interno)
import { create } from 'zustand';

interface DashboardState {
  selectedView: string;
  filters: FilterState;
  sidebarOpen: boolean;
  setView: (view: string) => void;
  toggleSidebar: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedView: 'overview',
  filters: {},
  sidebarOpen: true,
  setView: (view) => set({ selectedView: view }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
```

#### 🌟 Cuándo Usar Cada Uno

**Nanostores (286 bytes):**
- Auth state global
- Theme/UI preferences
- Cross-framework communication
- Sitios con múltiples islands pequeñas

**Zustand (2.4kb):**
- Dashboard state interno
- Form state complejo
- UI state con muchas interacciones
- Cuando trabajas principalmente en React

**TanStack Query:**
- Server state management
- Data fetching con cache
- Real-time updates
- API synchronization

### TanStack Query con Astro (Recomendado 2025)

#### Configuración Inicial
```typescript
// src/lib/api/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000,   // 10 minutos (antes cacheTime)
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});
```

#### Uso en Componentes
```tsx
// src/components/dashboard/AnalyticsChart.tsx
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/api/queryClient';
import { getAnalyticsData } from '@/lib/api/analytics';

export function AnalyticsChart() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: getAnalyticsData,
  }, queryClient);

  if (isLoading) return <ChartSkeleton />;
  if (error) return <ErrorMessage error={error} />;

  return <Chart data={data} />;
}
```

#### Wrapper para Islands
```astro
---
// src/components/QueryProvider.astro
---
<div id="query-provider">
  <slot />
</div>

<script>
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
  import { queryClient } from '@/lib/api/queryClient';

  // Solo para islands específicas que lo necesiten
  if (typeof window !== 'undefined') {
    // Configuración adicional del cliente
  }
</script>
```

### Nanostores para Estado Global
```typescript
// src/stores/auth.ts
import { atom, computed } from 'nanostores';

export const $user = atom<User | null>(null);
export const $isAuthenticated = computed($user, (user) => !!user);

export function setUser(user: User) {
  $user.set(user);
}

export function logout() {
  $user.set(null);
}
```

### Clientes de API Estructurados
```typescript
// src/lib/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.PUBLIC_API_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { apiClient };

// src/lib/api/analytics.ts
import { apiClient } from './client';
import type { AnalyticsData, AnalyticsFilters } from '@/types/api';

export async function getAnalyticsData(filters?: AnalyticsFilters): Promise<AnalyticsData> {
  const { data } = await apiClient.get('/analytics', { params: filters });
  return data;
}

export async function getSessionData(sessionId: string) {
  const { data } = await apiClient.get(`/analytics/sessions/${sessionId}`);
  return data;
}
```

## 🧭 View Transitions y Navegación

### Configuración de View Transitions 2025
```astro
---
// src/layouts/BaseLayout.astro
import { ViewTransitions } from 'astro:transitions';
---

<html>
  <head>
    <ViewTransitions />
    <!-- Alternativa nativa para navegadores modernos -->
    <!-- <meta name="view-transition" content="same-origin" /> -->
  </head>
  <body>
    <slot />
  </body>
</html>
```

### Transiciones Personalizadas
```css
/* src/styles/transitions.css */
@view-transition {
  navigation: auto;
}

::view-transition-old(root) {
  animation: fade-out 0.3s ease-out;
}

::view-transition-new(root) {
  animation: fade-in 0.3s ease-in;
}

/* Transiciones específicas para dashboards */
.dashboard-content {
  view-transition-name: dashboard-main;
}

::view-transition-old(dashboard-main),
::view-transition-new(dashboard-main) {
  animation-duration: 0.5s;
}
```

### Persistencia de Estado en Navegación
```astro
---
// src/components/PersistentSidebar.astro
---
<aside transition:persist="sidebar">
  <!-- Contenido que persiste entre navegaciones -->
</aside>
```

## 📄 Content Collections y Validación

### Configuración de Collections
```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.date(),
    author: z.string(),
    tags: z.array(z.enum(['astro', 'web-dev', 'javascript', 'typescript'])),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const analyticsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    metrics: z.array(z.object({
      name: z.string(),
      value: z.number(),
      change: z.number().optional(),
    })),
    period: z.enum(['daily', 'weekly', 'monthly']),
    updatedAt: z.date(),
  }),
});

export const collections = {
  blog: blogCollection,
  analytics: analyticsCollection,
};
```

### Uso de Collections en Páginas
```astro
---
// src/pages/blog/index.astro
import { getCollection } from 'astro:content';
import BlogCard from '@/components/blog/BlogCard.astro';

const posts = await getCollection('blog', ({ data }) => {
  return !data.draft && data.publishDate <= new Date();
});

const featuredPosts = posts.filter(post => post.data.featured);
const recentPosts = posts
  .sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime())
  .slice(0, 6);
---

<Layout title="Blog">
  <section class="featured-posts">
    {featuredPosts.map(post => (
      <BlogCard post={post} featured />
    ))}
  </section>

  <section class="recent-posts">
    {recentPosts.map(post => (
      <BlogCard post={post} />
    ))}
  </section>
</Layout>
```

## 🎨 Integración con shadcn/ui

### ⚠️ Consideraciones Críticas de Islands Architecture

**Problema:** shadcn/ui components requieren React Context, pero Astro islands están aislados.

```astro
<!-- ❌ ESTO NO FUNCIONA -->
<Header client:load>
  <Button>Click me</Button> <!-- No comparte contexto -->
</Header>
<Sidebar client:load>
  <Button>Another</Button> <!-- Contexto diferente -->
</Sidebar>
```

**Solución: Wrapper Components**
```astro
<!-- ✅ ESTO SÍ FUNCIONA -->
<DashboardWrapper client:load>
  <!-- Todos los componentes shadcn dentro del mismo island -->
</DashboardWrapper>
```

### 📋 Patrones de Implementación shadcn/ui

#### Patrón 1: Component Wrappers (.astro)
```astro
---
// src/components/ui/Button.astro - Para uso en templates estáticos
export interface Props {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  class?: string;
}

const { variant = 'default', size = 'default', class: className, ...props } = Astro.props;
---

<button
  class:list={[
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'disabled:pointer-events-none disabled:opacity-50',
    {
      'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
      'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
      'border border-input bg-background hover:bg-accent hover:text-accent-foreground': variant === 'outline',
      'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
      'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
      'text-primary underline-offset-4 hover:underline': variant === 'link',
    },
    {
      'h-10 px-4 py-2': size === 'default',
      'h-9 rounded-md px-3': size === 'sm',
      'h-11 rounded-md px-8': size === 'lg',
      'h-10 w-10': size === 'icon',
    },
    className
  ]}
  {...props}
>
  <slot />
</button>
```

#### Patrón 2: React Components (.tsx) - Para Dashboards
```tsx
// src/components/ui/Button.tsx - Para uso en React islands
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
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
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
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

#### Patrón 3: Dashboard Island Completo
```tsx
// src/components/dashboard/DashboardApp.tsx
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useDashboardStore } from "@/stores/dashboard"

export default function DashboardApp() {
  const { sidebarOpen, toggleSidebar } = useDashboardStore();

  return (
    <div className="dashboard-layout">
      <header className="border-b">
        <Button onClick={toggleSidebar}>Toggle Sidebar</Button>
      </header>

      <aside className={cn("sidebar", { hidden: !sidebarOpen })}>
        <Card>
          <CardHeader>
            <CardTitle>Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Sidebar content */}
          </CardContent>
        </Card>
      </aside>

      <main>
        {/* Main dashboard content */}
      </main>
    </div>
  );
}
```

### 🎯 Reglas de Oro para shadcn/ui + Astro

1. **Un Island = Un Contexto**: Mantén componentes shadcn dentro del mismo island
2. **Wrapper Strategy**: Crea un wrapper React para secciones interactivas
3. **Static First**: Usa componentes .astro para UI estática
4. **React Heavy**: Usa componentes .tsx para dashboards complejos

## 📝 Manejo de Formularios con shadcn/ui + React Hook Form

### 🎯 Arquitectura de Formularios 2025

#### Stack Recomendado
- **React Hook Form** - Manejo de estado y performance
- **Zod** - Validación type-safe
- **shadcn/ui Form** - Componentes accesibles
- **@hookform/resolvers** - Integración Zod + RHF

#### Dependencias Requeridas
```bash
yarn add react-hook-form zod @hookform/resolvers
npx shadcn@latest add form
```

### 🏗️ Patrones de Implementación

#### Patrón 1: Formulario Crítico (`client:load`)
```tsx
// src/components/forms/LoginForm.tsx
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

// Schema con validación robusta
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email es requerido")
    .email("Formato de email inválido"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Debe contener mayúscula, minúscula y número"),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
  isLoading?: boolean;
}

export function LoginForm({ onSubmit, isLoading = false }: LoginFormProps) {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const handleSubmit = async (data: LoginFormData) => {
    try {
      await onSubmit(data)
    } catch (error) {
      // Error handling integrado con form
      form.setError("root", {
        message: "Credenciales inválidas"
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="tu@email.com"
                  type="email"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input
                  placeholder="••••••••"
                  type="password"
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <div className="text-sm font-medium text-destructive">
            {form.formState.errors.root.message}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
        </Button>
      </form>
    </Form>
  )
}
```

#### Patrón 2: Formulario Secundario (`client:idle`)
```tsx
// src/components/forms/ContactForm.tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const contactSchema = z.object({
  name: z.string().min(2, "Nombre muy corto"),
  email: z.string().email("Email inválido"),
  message: z.string().min(10, "Mensaje muy corto"),
  // Validación condicional
  phone: z.string().optional().refine((val) => {
    if (!val) return true
    return /^\+?[\d\s-()]+$/.test(val)
  }, "Formato de teléfono inválido"),
})

export function ContactForm() {
  const form = useForm({
    resolver: zodResolver(contactSchema),
    mode: "onBlur", // Validar al perder foco
  })

  // Async validation example
  const checkEmailExists = async (email: string) => {
    const response = await fetch(`/api/check-email?email=${email}`)
    return response.ok
  }

  return (
    <Form {...form}>
      <form className="space-y-4">
        {/* Campos del formulario */}
      </form>
    </Form>
  )
}
```

#### Patrón 3: Formulario Multi-Step
```tsx
// src/components/forms/MultiStepForm.tsx
import { useState } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

// Schemas por paso
const step1Schema = z.object({
  firstName: z.string().min(1, "Nombre requerido"),
  lastName: z.string().min(1, "Apellido requerido"),
})

const step2Schema = z.object({
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Teléfono requerido"),
})

const fullSchema = step1Schema.merge(step2Schema)

export function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState(1)

  const methods = useForm({
    resolver: zodResolver(
      currentStep === 1 ? step1Schema :
      currentStep === 2 ? step2Schema :
      fullSchema
    ),
    mode: "onChange",
  })

  return (
    <FormProvider {...methods}>
      <form>
        {currentStep === 1 && <Step1 />}
        {currentStep === 2 && <Step2 />}

        <div className="flex justify-between">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(prev => prev - 1)}
            >
              Anterior
            </Button>
          )}

          <Button
            type="button"
            onClick={() => setCurrentStep(prev => prev + 1)}
            disabled={!methods.formState.isValid}
          >
            {currentStep === 2 ? "Enviar" : "Siguiente"}
          </Button>
        </div>
      </form>
    </FormProvider>
  )
}
```

### 🎭 Client Directives para Formularios

#### Matriz de Decisión Client Directives

| Tipo de Formulario | Directive | Justificación |
|-------------------|-----------|---------------|
| **Login/Register** | `client:load` | Interacción inmediata requerida |
| **Checkout/Payment** | `client:load` | Crítico para conversión |
| **Contact/Newsletter** | `client:idle` | No crítico, optimiza LCP |
| **Search Filters** | `client:visible` | Solo cuando usuario ve filtros |
| **User Profile** | `client:idle` | Formulario secundario |

#### Implementación en Astro
```astro
---
// src/pages/login.astro
import LoginForm from '@/components/forms/LoginForm';
import ContactForm from '@/components/forms/ContactForm';
---

<Layout title="Forms Demo">
  <!-- Formulario crítico - carga inmediata -->
  <section class="hero">
    <LoginForm client:load />
  </section>

  <!-- Formulario secundario - carga cuando browser idle -->
  <section class="contact">
    <ContactForm client:idle />
  </section>
</Layout>
```

### 🔒 Validación Avanzada con Zod

#### Validaciones Personalizadas
```typescript
// src/lib/validations/auth.ts
import { z } from "zod"

export const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .regex(/^(?=.*[a-z])/, "Debe contener al menos una minúscula")
  .regex(/^(?=.*[A-Z])/, "Debe contener al menos una mayúscula")
  .regex(/^(?=.*\d)/, "Debe contener al menos un número")
  .regex(/^(?=.*[@$!%*?&])/, "Debe contener un carácter especial")

// Validación condicional
export const userSchema = z.object({
  type: z.enum(["personal", "business"]),
  name: z.string().min(1),
  // Campo condicional
  businessName: z.string().optional(),
  taxId: z.string().optional(),
}).refine((data) => {
  if (data.type === "business") {
    return data.businessName && data.taxId
  }
  return true
}, {
  message: "Business name and tax ID required for business accounts",
  path: ["businessName"],
})

// Validación asíncrona
export const emailSchema = z
  .string()
  .email("Email inválido")
  .refine(async (email) => {
    const exists = await checkEmailExists(email)
    return !exists
  }, "Email ya está registrado")
```

#### Error Handling Robusto
```tsx
// src/components/forms/FormWithErrors.tsx
export function FormWithErrors() {
  const form = useForm({
    resolver: zodResolver(schema),
    // Configurar manejo de errores
    shouldFocusError: true,
    criteriaMode: "all", // Mostrar todos los errores
  })

  const onError = (errors: FieldErrors) => {
    // Log para debugging
    console.error("Form validation errors:", errors)

    // Mostrar toast de error
    toast({
      title: "Error en el formulario",
      description: "Por favor revisa los campos marcados",
      variant: "destructive",
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onError)}>
        {/* Campos */}
      </form>
    </Form>
  )
}
```

### 🚀 Performance y Optimización

#### Lazy Loading de Validaciones
```typescript
// src/lib/validations/lazy.ts
import { z } from "zod"

// Schema lazy para validaciones complejas
export const heavyValidationSchema = z.lazy(() =>
  z.object({
    complexField: z.string().refine(async (val) => {
      // Validación costosa solo cuando necesaria
      return await expensiveValidation(val)
    })
  })
)
```

#### Debounced Validation
```tsx
// src/hooks/useDebouncedValidation.ts
import { useEffect } from "react"
import { useFormContext } from "react-hook-form"
import { useDebouncedCallback } from "use-debounce"

export function useDebouncedValidation(fieldName: string, delay = 500) {
  const { watch, trigger } = useFormContext()
  const fieldValue = watch(fieldName)

  const debouncedValidation = useDebouncedCallback(() => {
    trigger(fieldName)
  }, delay)

  useEffect(() => {
    if (fieldValue) {
      debouncedValidation()
    }
  }, [fieldValue, debouncedValidation])
}
```

### 📋 Checklist de Formularios

**✅ Setup y Configuración:**
- [ ] React Hook Form + Zod instalados
- [ ] shadcn/ui Form component añadido
- [ ] Resolver configurado correctamente
- [ ] Tipos TypeScript definidos

**✅ Validación:**
- [ ] Schemas Zod definidos
- [ ] Validaciones síncronas implementadas
- [ ] Validaciones asíncronas cuando necesario
- [ ] Error messages user-friendly

**✅ UX y Accesibilidad:**
- [ ] Labels apropiados para screen readers
- [ ] Autocompletado configurado
- [ ] Loading states durante submit
- [ ] Error focus management
- [ ] Keyboard navigation funcional

**✅ Performance:**
- [ ] Client directive apropiado
- [ ] Validación debounced para campos async
- [ ] Lazy loading de validaciones complejas
- [ ] Re-renders minimizados

**✅ Islands Architecture:**
- [ ] Formularios críticos: `client:load`
- [ ] Formularios secundarios: `client:idle`
- [ ] Formularios fuera del viewport: `client:visible`
- [ ] Context sharing dentro del mismo island

### Configuración de Componentes
```astro
---
// src/components/ui/Button.astro
export interface Props {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  class?: string;
}

const { variant = 'default', size = 'default', class: className, ...props } = Astro.props;
---

<button
  class:list={[
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'disabled:pointer-events-none disabled:opacity-50',
    {
      'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
      'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
      'border border-input bg-background hover:bg-accent hover:text-accent-foreground': variant === 'outline',
      'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
      'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
      'text-primary underline-offset-4 hover:underline': variant === 'link',
    },
    {
      'h-10 px-4 py-2': size === 'default',
      'h-9 rounded-md px-3': size === 'sm',
      'h-11 rounded-md px-8': size === 'lg',
      'h-10 w-10': size === 'icon',
    },
    className
  ]}
  {...props}
>
  <slot />
</button>
```

### Componentes React con shadcn
```tsx
// src/components/ui/DataTable.tsx
import { useReactTable, getCoreRowModel, type ColumnDef } from '@tanstack/react-table';
import { Button } from './Button';
import { Input } from './Input';

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  searchKey?: keyof T;
}

export function DataTable<T>({ columns, data, searchKey }: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      {searchKey && (
        <Input
          placeholder={`Buscar por ${String(searchKey)}...`}
          className="max-w-sm"
        />
      )}
      <div className="rounded-md border">
        {/* Tabla implementation */}
      </div>
    </div>
  );
}
```

## 🔧 Configuración del Proyecto

### astro.config.mjs Optimizado
```javascript
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

export default defineConfig({
  output: 'hybrid', // Permite SSG y SSR por ruta
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false, // Usar solo shadcn styles
    }),
  ],
  vite: {
    optimizeDeps: {
      include: ['@tanstack/react-query', 'axios'],
    },
    define: {
      __DEV__: process.env.NODE_ENV === 'development',
    },
  },
  experimental: {
    serverIslands: true, // Para components dinámicos
  },
});
```

### TypeScript Configuración
```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/layouts/*": ["./src/layouts/*"],
      "@/pages/*": ["./src/pages/*"],
      "@/styles/*": ["./src/styles/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/stores/*": ["./src/stores/*"],
      "@/types/*": ["./src/types/*"]
    },
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

## 🚦 Patrones de Rendado y Performance

### Estrategias de Output por Ruta
```astro
---
// src/pages/blog/[slug].astro (SSG)
export const prerender = true;

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(post => ({
    params: { slug: post.slug },
    props: { post },
  }));
}
---

---
// src/pages/api/analytics.ts (SSR)
export const prerender = false;

export async function GET({ request }) {
  // API endpoint dinámico
}
---

---
// src/pages/dashboard/[...path].astro (SSR)
export const prerender = false;
// Dashboard dinámico con datos en tiempo real
---
```

### Optimización de Imágenes
```astro
---
import { Image } from 'astro:assets';
import heroImage from '@/assets/hero.jpg';
---

<!-- Optimización automática -->
<Image
  src={heroImage}
  alt="Hero image"
  width={1200}
  height={600}
  format="webp"
  quality={80}
  loading="eager"
/>

<!-- Para imágenes dinámicas -->
<Image
  src={`/uploads/${post.data.image}`}
  alt={post.data.title}
  width={800}
  height={400}
  loading="lazy"
/>
```

## 🛡️ Seguridad y Variables de Entorno

### Gestión de Variables de Entorno
```typescript
// src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // Públicas (disponibles en cliente)
  PUBLIC_API_URL: z.string().url(),
  PUBLIC_APP_NAME: z.string(),

  // Privadas (solo servidor)
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  RESEND_API_KEY: z.string(),
});

export const env = envSchema.parse(import.meta.env);
```

### API Routes Seguras
```typescript
// src/pages/api/protected/analytics.ts
import type { APIRoute } from 'astro';
import { verifyJWT } from '@/lib/auth';

export const GET: APIRoute = async ({ request }) => {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return new Response('Unauthorized', { status: 401 });
    }

    const user = await verifyJWT(token);
    if (!user) {
      return new Response('Invalid token', { status: 401 });
    }

    // Lógica de la API...
    const data = await getAnalyticsData(user.id);

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Internal Server Error', { status: 500 });
  }
};
```

## 📱 Responsive y Accesibilidad

### Diseño Responsive con Tailwind
```astro
<!-- src/components/dashboard/StatsGrid.astro -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {stats.map(stat => (
    <div class="bg-card p-6 rounded-lg border">
      <h3 class="text-sm font-medium text-muted-foreground">{stat.title}</h3>
      <p class="text-2xl font-bold">{stat.value}</p>
      <p class="text-xs text-muted-foreground">
        <span class={stat.change > 0 ? 'text-green-600' : 'text-red-600'}>
          {stat.change > 0 ? '+' : ''}{stat.change}%
        </span>
        vs último mes
      </p>
    </div>
  ))}
</div>
```

### Accesibilidad
```astro
<!-- Estructura semántica correcta -->
<main role="main" aria-label="Dashboard principal">
  <h1 class="sr-only">Panel de Control de Analytics</h1>

  <section aria-labelledby="stats-heading">
    <h2 id="stats-heading" class="text-xl font-semibold mb-4">
      Estadísticas Generales
    </h2>
    <!-- Stats content -->
  </section>

  <section aria-labelledby="charts-heading">
    <h2 id="charts-heading" class="text-xl font-semibold mb-4">
      Gráficos de Rendimiento
    </h2>
    <!-- Charts content -->
  </section>
</main>
```

## 🧪 Testing y Quality Assurance

### Testing con Vitest
```typescript
// src/lib/__tests__/utils.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate, calculatePercentageChange } from '../utils';

describe('utils', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2025-01-15');
      expect(formatDate(date)).toBe('15 de enero, 2025');
    });
  });

  describe('calculatePercentageChange', () => {
    it('should calculate positive change', () => {
      expect(calculatePercentageChange(100, 120)).toBe(20);
    });

    it('should calculate negative change', () => {
      expect(calculatePercentageChange(120, 100)).toBe(-16.67);
    });
  });
});
```

## 🚀 Build y Deploy

### Scripts de Package.json
```json
{
  "scripts": {
    "dev": "astro dev",
    "start": "astro dev",
    "build": "astro check && astro build",
    "preview": "astro preview",
    "astro": "astro",
    "check": "astro check",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx,.astro",
    "lint:fix": "eslint src --ext .ts,.tsx,.astro --fix",
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  }
}
```

## 📋 Checklist de Mejores Prácticas

### ✅ Estructura y Organización
- [ ] Estructura de carpetas consistente
- [ ] Nomenclatura clara y descriptiva
- [ ] Separación de concerns (UI, lógica, datos)
- [ ] Configuración de path aliases

### ✅ Performance
- [ ] Hidratación selectiva con client directives
- [ ] Imágenes optimizadas con Astro:assets
- [ ] Code splitting por ruta
- [ ] Preloading de recursos críticos

### ✅ Developer Experience
- [ ] TypeScript estricto configurado
- [ ] ESLint y Prettier configurados
- [ ] Testing setup con Vitest
- [ ] Hot reload funcionando

### ✅ Estado y APIs
- [ ] **Patrón seleccionado**: Dashboard Island vs Multi-Island
- [ ] **Dashboard React-heavy**: Zustand + Nanostores híbrido
- [ ] **Multi-framework**: Solo Nanostores
- [ ] TanStack Query para server state
- [ ] Error boundaries implementados
- [ ] Loading states consistentes

### ✅ shadcn/ui + Islands
- [ ] **Wrapper strategy**: Un island = un contexto
- [ ] **Component architecture**: .astro para estático, .tsx para interactivo
- [ ] **Context sharing**: Componentes shadcn dentro del mismo island
- [ ] **State management**: Zustand funcional dentro del dashboard island

### ✅ Seguridad
- [ ] Variables de entorno validadas
- [ ] Autenticación en API routes
- [ ] Sanitización de inputs
- [ ] CORS configurado correctamente

## 🔐 Autenticación y Manejo de Sesión Segura

### 🎯 Estrategia de Autenticación 2025

#### Principios de Seguridad Core

**1. Secure Cookie Implementation**
- HttpOnly cookies para prevenir ataques XSS
- Secure flag para HTTPS-only
- SameSite attribute para CSRF protection
- Expiration times apropiados (2-4 horas para access tokens)

**2. JWT Best Practices**
- Validación completa de tokens (signature, issuer, audience, expiration)
- Refresh token rotation para máxima seguridad
- Blacklist de tokens revocados
- Algoritmos de signature seguros (RS256/ES256)

**3. Session Lifecycle Management**
- Proper logout en todos los dispositivos
- Session timeout automático
- Detection de múltiples logins simultáneos

### 🏗️ Arquitectura de Autenticación Astro

#### Patrón Recomendado: Híbrido JWT + Sessions

```typescript
// src/lib/auth/types.ts
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  sessionExpiry: Date | null;
}

export interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
}
```

#### Estado Global con Nanostores (Cross-Islands)

```typescript
// src/stores/auth.ts
import { atom, computed } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';

// Estado persistente para mantener sesión entre reloads
export const $authState = persistentAtom<AuthState>('auth', {
  user: null,
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  sessionExpiry: null,
}, {
  encode: JSON.stringify,
  decode: JSON.parse,
});

// Computed values
export const $user = computed($authState, (state) => state.user);
export const $isAuthenticated = computed($authState, (state) => state.isAuthenticated);
export const $isSessionValid = computed($authState, (state) => {
  if (!state.sessionExpiry) return false;
  return new Date() < new Date(state.sessionExpiry);
});

// Actions
export function setAuth(authData: Partial<AuthState>) {
  $authState.set({ ...$authState.get(), ...authData });
}

export function clearAuth() {
  $authState.set({
    user: null,
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    sessionExpiry: null,
  });
}
```

#### Cliente de API con Interceptors

```typescript
// src/lib/api/auth-client.ts
import axios from 'axios';
import { $authState, setAuth, clearAuth } from '@/stores/auth';

const authApiClient = axios.create({
  baseURL: import.meta.env.PUBLIC_API_URL,
  withCredentials: true, // Para cookies HttpOnly
  timeout: 10000,
});

// Request interceptor - agregar tokens
authApiClient.interceptors.request.use((config) => {
  const authState = $authState.get();

  if (authState.accessToken) {
    config.headers.Authorization = `Bearer ${authState.accessToken}`;
  }

  // Header para detección de plataforma
  config.headers['x-platform'] = 'web';

  return config;
});

// Response interceptor - manejar token refresh
authApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshed = await refreshTokens();
        if (refreshed) {
          originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`;
          return authApiClient(originalRequest);
        }
      } catch (refreshError) {
        clearAuth();
        // Redirect to login
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

async function refreshTokens() {
  const authState = $authState.get();

  if (!authState.refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await authApiClient.post('/auth/refresh', {
    refreshToken: authState.refreshToken,
  });

  const { accessToken, refreshToken, expiresIn } = response.data;

  const newAuthState = {
    ...authState,
    accessToken,
    refreshToken,
    sessionExpiry: new Date(Date.now() + expiresIn * 1000),
  };

  setAuth(newAuthState);
  return newAuthState;
}

export { authApiClient };
```

#### Middleware de Protección de Rutas

```typescript
// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';
import { verifyJWT } from './lib/auth/jwt-utils';

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, redirect, cookies } = context;
  const url = new URL(request.url);

  // Rutas protegidas
  const protectedRoutes = ['/dashboard', '/admin', '/profile'];
  const isProtectedRoute = protectedRoutes.some(route =>
    url.pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Verificar token en Authorization header
    const authHeader = request.headers.get('Authorization');
    let isValid = false;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      isValid = await verifyJWT(token);
    }

    // Fallback: verificar cookie de sesión
    if (!isValid) {
      const sessionCookie = cookies.get('authjs.session-token');
      if (sessionCookie) {
        isValid = await verifySessionCookie(sessionCookie.value);
      }
    }

    if (!isValid) {
      return redirect('/login');
    }
  }

  return next();
});
```

#### Componente de Autenticación

```tsx
// src/components/auth/AuthProvider.tsx
import { useStore } from '@nanostores/react';
import { useEffect } from 'react';
import { $authState, $isSessionValid, clearAuth } from '@/stores/auth';
import { authApiClient } from '@/lib/api/auth-client';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authState = useStore($authState);
  const isSessionValid = useStore($isSessionValid);

  useEffect(() => {
    // Verificar validez de sesión al cargar
    if (authState.isAuthenticated && !isSessionValid) {
      clearAuth();
      window.location.href = '/login';
    }
  }, [authState.isAuthenticated, isSessionValid]);

  useEffect(() => {
    // Auto-refresh tokens antes de que expiren
    if (authState.sessionExpiry) {
      const timeToExpiry = new Date(authState.sessionExpiry).getTime() - Date.now();
      const refreshTime = Math.max(timeToExpiry - 60000, 0); // 1 min antes

      const timeout = setTimeout(async () => {
        try {
          await authApiClient.post('/auth/refresh', {
            refreshToken: authState.refreshToken,
          });
        } catch {
          clearAuth();
        }
      }, refreshTime);

      return () => clearTimeout(timeout);
    }
  }, [authState.sessionExpiry]);

  return <>{children}</>;
}
```

### 🛡️ Security Headers y Configuración

#### Astro Config Seguro

```javascript
// astro.config.mjs
export default defineConfig({
  output: 'hybrid',
  security: {
    checkOrigin: true,
  },
  vite: {
    define: {
      __SECURE_COOKIE__: process.env.NODE_ENV === 'production',
    },
  },
  integrations: [
    react(),
    // Security headers middleware
  ],
});
```

#### Headers de Seguridad

```typescript
// src/lib/security/headers.ts
export const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' " + import.meta.env.PUBLIC_API_URL,
  ].join('; '),
};
```

### 📋 Checklist de Seguridad Auth

**✅ Tokens y Cookies:**
- [ ] HttpOnly cookies para session tokens
- [ ] Secure flag en producción
- [ ] SameSite=Strict para CSRF protection
- [ ] JWT signature validation
- [ ] Token expiration times apropiados
- [ ] Refresh token rotation

**✅ Estado y Persistencia:**
- [ ] Nanostores con @nanostores/persistent
- [ ] Estado auth global cross-islands
- [ ] Session validation en page load
- [ ] Auto-refresh antes de expiry
- [ ] Proper logout y cleanup

**✅ Protección de Rutas:**
- [ ] Middleware de autenticación
- [ ] Verificación server-side
- [ ] Redirect a login si no autenticado
- [ ] Role-based access control

**✅ API Integration:**
- [ ] Axios interceptors para tokens
- [ ] Automatic token refresh
- [ ] Error handling 401/403
- [ ] Platform detection headers

## 📋 PLAN DE IMPLEMENTACIÓN: Manejo de Sesión Segura

### 🎯 Resumen de Hallazgos

**Según nuestra investigación y documentación:**

1. **Estado Recomendado**: Nanostores para auth global + Zustand para dashboard interno
2. **API Existente**: Ya implementa JWT + cookies híbrido con detección de plataforma
3. **Seguridad**: HttpOnly cookies + JWT Bearer tokens con refresh rotation
4. **Persistencia**: @nanostores/persistent para mantener sesión entre reloads

### 🚀 Fases de Implementación

#### **Fase 1: Setup Base de Estado (Nanostores)**

**📦 Dependencias a instalar:**
```bash
yarn add nanostores @nanostores/persistent @nanostores/react axios
```

**🗂️ Archivos a crear:**
- `src/lib/auth/types.ts` - Interfaces de auth
- `src/stores/auth.ts` - Estado global con Nanostores
- `src/lib/api/auth-client.ts` - Cliente axios con interceptors

**⏱️ Tiempo estimado**: 2-3 horas

#### **Fase 2: Integración con API Existente**

**🔗 Conectar con endpoints existentes:**
- `POST /auth/login` - Login con platform detection
- `POST /auth/refresh` - Refresh tokens automático
- `GET /auth/me` - Perfil de usuario
- `POST /auth/logout` - Logout seguro

**🛠️ Funcionalidades:**
- Auto-refresh de tokens antes de expiry
- Platform detection header (`x-platform: 'web'`)
- Error handling 401/403 con redirect

**⏱️ Tiempo estimado**: 3-4 horas

#### **Fase 3: Middleware y Protección de Rutas**

**🛡️ Implementar:**
- `src/middleware.ts` - Middleware de autenticación
- Protección de rutas `/dashboard/*`
- Verificación server-side de tokens
- Redirect automático a `/login`

**⏱️ Tiempo estimado**: 2-3 horas

#### **Fase 4: Componentes de Auth**

**🧩 Componentes a actualizar:**
- `LoginForm.astro` - Integrar con API real
- `AuthProvider.tsx` - Wrapper para dashboard
- `ProtectedRoute.tsx` - HOC para protección

**⏱️ Tiempo estimado**: 2-3 horas

#### **Fase 5: Dashboard Integration**

**🎛️ Dashboard Island Pattern:**
- `DashboardApp.tsx` - Island principal con Zustand
- Estado auth global accesible desde Nanostores
- Session validation automática
- Logout functionality

**⏱️ Tiempo estimado**: 3-4 horas

### 🎯 Arquitectura Final Planificada

```
┌─────────────────────────────────────────┐
│                ASTRO APP                │
├─────────────────────────────────────────┤
│  📄 Pages (SSG/SSR)                    │
│  ├── /login (public)                   │
│  ├── /dashboard/* (protected)          │
│  └── /api/* (middleware protected)     │
├─────────────────────────────────────────┤
│  🛡️ Middleware                         │
│  ├── Route protection                  │
│  ├── JWT verification                  │
│  └── Redirect logic                    │
├─────────────────────────────────────────┤
│  🏝️ Islands Architecture               │
│  ├── LoginForm (React + shadcn)        │
│  └── DashboardApp (React + shadcn)     │
├─────────────────────────────────────────┤
│  📊 State Management                   │
│  ├── Nanostores (Auth global)          │
│  ├── Zustand (Dashboard internal)      │
│  └── @nanostores/persistent            │
├─────────────────────────────────────────┤
│  🔗 API Client                         │
│  ├── Axios interceptors                │
│  ├── Auto-refresh tokens               │
│  ├── Platform detection                │
│  └── Error handling                    │
├─────────────────────────────────────────┤
│  🔐 Security                           │
│  ├── HttpOnly cookies                  │
│  ├── JWT Bearer tokens                 │
│  ├── Token rotation                    │
│  └── Session validation                │
└─────────────────────────────────────────┘
```

### 📝 Criterios de Éxito

**✅ Funcionalidades Requeridas:**
- [ ] Login funcional con API
- [ ] Dashboard protegido por autenticación
- [ ] Session persistente entre reloads
- [ ] Auto-refresh de tokens
- [ ] Logout de todos los dispositivos
- [ ] Redirect automático si no autenticado
- [ ] Estado compartido entre islands

**🔒 Seguridad Implementada:**
- [ ] HttpOnly cookies habilitadas
- [ ] JWT con expiration apropiada
- [ ] Headers de seguridad configurados
- [ ] CSRF protection activada
- [ ] XSS prevention implementada

**🚀 Performance Optimizada:**
- [ ] Nanostores minimal bundle impact
- [ ] Dashboard island única (no re-hidratación)
- [ ] Lazy loading de rutas protegidas
- [ ] Token refresh solo cuando necesario

### ⚡ Orden de Implementación Recomendado

1. **Instalar dependencias** (Fase 1)
2. **Crear stores de auth** (Fase 1)
3. **Configurar API client** (Fase 2)
4. **Integrar LoginForm** (Fase 4)
5. **Implementar middleware** (Fase 3)
6. **Crear dashboard protegido** (Fase 5)
7. **Testing y refinamiento** (Final)

**⏱️ Tiempo total estimado**: 12-17 horas
**👥 Recursos**: 1 desarrollador senior
**🏁 Entregable**: Dashboard funcional con autenticación segura integrada con API existente

### ✅ UX y Accesibilidad
- [ ] View Transitions implementadas
- [ ] Responsive design
- [ ] Semantic HTML
- [ ] ARIA labels donde necesario
- [ ] Keyboard navigation

---

## 🎯 Conclusión

Esta guía establece las mejores prácticas para desarrollar aplicaciones Astro en 2025, priorizando:

1. **Performance**: Zero JS por defecto con hidratación selectiva
2. **Developer Experience**: TypeScript, tooling moderno y estructura clara
3. **Escalabilidad**: Arquitectura modular y patrones consistentes
4. **Modernidad**: View Transitions, TanStack Query y las últimas APIs web

Siguiendo estos patrones tendrás una base sólida para construir aplicaciones web modernas, rápidas y mantenibles con Astro.

---

## 🔐 **Autenticación: Lecciones Críticas Aprendidas**

### ⚠️ **Problemas Comunes y Soluciones**

#### 1. **Middleware vs Client-Side Protection**
```typescript
// ❌ PROBLEMA: Middleware server-side no puede leer localStorage
export const onRequest = defineMiddleware(async (context, next) => {
  // No puede acceder a localStorage desde servidor
  const token = localStorage.getItem('auth'); // ❌ Error
});

// ✅ SOLUCIÓN: Client-side protection inmediata
<script>
  const authData = localStorage.getItem('auth-state');
  if (!authData) window.location.href = '/login';
</script>
```

#### 2. **Configuración Crítica para SSR**
```javascript
// astro.config.mjs
export default defineConfig({
  output: 'server', // ✅ Requerido para middleware
  vite: {
    server: {
      proxy: { '/api': { target: 'http://localhost:3000' } } // ✅ Evita CORS
    }
  }
});
```

#### 3. **Protección Dashboard (Funciona)**
```astro
<!-- src/pages/dashboard.astro -->
<script>
  if (typeof window !== 'undefined') {
    const authData = localStorage.getItem('auth-state');
    if (!authData) {
      window.location.href = '/login';
    } else {
      try {
        const parsed = JSON.parse(authData);
        if (!parsed.isAuthenticated || !parsed.accessToken) {
          window.location.href = '/login';
        }
      } catch (e) {
        window.location.href = '/login';
      }
    }
  }
</script>
```

#### 4. **Redirección Login → Dashboard (Funciona)**
```astro
<!-- src/pages/login.astro -->
<script>
  if (typeof window !== 'undefined') {
    const authData = localStorage.getItem('auth-state');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed.isAuthenticated && parsed.accessToken) {
          window.location.href = '/dashboard';
        }
      } catch (e) {
        localStorage.removeItem('auth-state');
      }
    }
  }
</script>
```

### 🚫 **Errores Fatales a Evitar**

1. **Loop Infinito**: Middleware que redirige rutas que él mismo procesa
2. **User-Agent Manual**: Browser rechaza headers User-Agent personalizados
3. **prerender vs server**: Páginas prerenderizadas no pueden usar middleware
4. **CORS en Desarrollo**: Usar proxy Vite, no configuración manual

### ✅ **Patrón que Funciona 100%**

```typescript
// 1. Client-side protection en cada página
// 2. Nanostores para estado persistente
// 3. Proxy Vite para API externa
// 4. output: 'server' en config
// 5. Script inmediato en <head>
```