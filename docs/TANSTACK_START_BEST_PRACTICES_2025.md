# 🚀 TanStack Start Best Practices 2025 - SSR & Server Actions

> **Guía definitiva para desarrollo con TanStack Start** con enfoque en SSR, Server Actions y seguridad para el sitio público de Noticias Pachuca

## 🎯 RESUMEN EJECUTIVO

### ¿Por qué TanStack Start sobre TanStack Router?
- **Full-Stack Framework**: SSR nativo + Server Functions + Hydration automática
- **Server Actions**: Lógica del servidor ejecutada de forma segura sin exponer APIs públicas
- **Selective SSR**: Control granular sobre qué se renderiza en servidor vs cliente
- **Streaming SSR**: Entrega progresiva de contenido para performance óptimo
- **Security-First**: Server functions mantienen lógica sensible en el servidor
- **Type-Safe Fullstack**: TypeScript end-to-end entre cliente y servidor

### Stack Recomendado 2025 para Noticias Públicas
```typescript
// Core Framework
"@tanstack/react-start": "^1.94.0"        // Framework principal SSR
"@tanstack/start-devtools": "^1.94.0"     // DevTools development

// Authentication & Security
"@auth/core": "^0.37.0"                   // Auth.js for SSR sessions
"@better-auth/core": "^0.x.x"             // Alternative: Better Auth
"jose": "^5.9.3"                          // JWT handling securo

// Database & API Layer
"drizzle-orm": "^0.x.x"                   // Type-safe ORM
"@prisma/client": "^5.x.x"                // Alternative: Prisma
"zod": "^3.23.0"                          // Schema validation

// UI & Styling
"@shadcn/ui": "latest"                    // Component library
"tailwindcss": "^3.4.0"                  // Styling framework
"class-variance-authority": "^0.7.0"      // CVA patterns

// Content & Analytics
"next-mdx-remote": "^5.0.0"               // MDX para artículos
"@vercel/analytics": "^1.x.x"             // Analytics integration
```

---

## 📁 ARQUITECTURA PARA SITIO PÚBLICO

### Patrón: **SSR-First + Server Actions**

```
src/
├── 📁 routes/                           # File-based routing SSR
│   ├── 📄 __root.tsx                    # Root layout con SSR context
│   ├── 📄 index.tsx                     # Home page - Full SSR
│   ├── 📄 noticias.tsx                  # Lista noticias - SSR + Infinite
│   ├── 📄 noticia.$id.tsx               # Detalle noticia - Full SSR
│   ├── 📄 categoria.$slug.tsx           # Categorías - SSR + Pagination
│   ├── 📄 autor.$id.tsx                 # Perfil autor - SSR optimized
│   ├── 📄 buscar.tsx                    # Búsqueda - Client-side
│   ├── 📁 admin/                        # Panel admin (auth required)
│   │   ├── 📄 route.tsx                 # Auth layout + server validation
│   │   ├── 📄 dashboard.tsx             # Dashboard SSR
│   │   ├── 📄 articulos.tsx             # Gestión artículos
│   │   └── 📄 configuracion.tsx         # Settings
│   └── 📁 api/                          # Server Actions y API routes
│       ├── 📄 auth.$.ts                 # Auth endpoints
│       ├── 📄 newsletter.ts             # Newsletter subscription
│       └── 📄 analytics.ts              # Analytics tracking
├── 📁 features/                         # Feature modules
│   ├── 📁 articles/
│   │   ├── 📁 components/               # ArticleCard, ArticleContent
│   │   ├── 📁 server/                   # Server Actions para artículos
│   │   │   ├── 📄 getArticle.ts         # Server function
│   │   │   ├── 📄 getArticles.ts        # List with pagination
│   │   │   └── 📄 getByCategory.ts      # Category filtering
│   │   ├── 📁 types/                    # Article types + Zod schemas
│   │   └── 📄 index.ts
│   ├── 📁 auth/
│   │   ├── 📁 server/                   # Server-side auth logic
│   │   │   ├── 📄 session.ts            # Session management
│   │   │   ├── 📄 login.ts              # Login server action
│   │   │   └── 📄 logout.ts             # Logout server action
│   │   ├── 📁 components/               # Login forms
│   │   └── 📁 types/                    # Auth types
│   ├── 📁 newsletter/
│   │   ├── 📁 server/                   # Newsletter server actions
│   │   └── 📁 components/               # Subscription forms
│   └── 📁 analytics/
│       ├── 📁 server/                   # Analytics server functions
│       └── 📁 components/               # Analytics widgets
├── 📁 lib/                              # Core utilities
│   ├── 📄 db.ts                         # Database connection
│   ├── 📄 auth.ts                       # Auth configuration
│   ├── 📄 cache.ts                      # Cache strategies
│   ├── 📄 analytics.ts                  # Analytics utils
│   └── 📄 types.ts                      # Global types
└── 📄 app.tsx                           # App entry point SSR
```

---

## 🏗️ CONFIGURACIÓN SSR + SERVER ACTIONS

### 1. Root Route con SSR Context

```typescript
// src/routes/__root.tsx
import { createRootRouteWithContext, Outlet } from '@tanstack/react-start'
import { Suspense } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { Toaster } from '@/components/ui/sonner'
import type { AuthSession } from '@/features/auth/types'

interface RouterContext {
  session: AuthSession | null
  headers: Record<string, string>
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  errorComponent: ({ error, reset }) => (
    <html lang="es">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Error - Noticias Pachuca</title>
      </head>
      <body className="min-h-screen bg-background">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-destructive">
              Error del Servidor
            </h1>
            <p className="text-muted-foreground">{error.message}</p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              Reintentar
            </button>
          </div>
        </div>
      </body>
    </html>
  ),
})

function RootComponent() {
  return (
    <html lang="es">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Noticias Pachuca - Las últimas noticias de Pachuca y Hidalgo" />
        <title>Noticias Pachuca</title>

        {/* SEO Meta Tags */}
        <meta property="og:title" content="Noticias Pachuca" />
        <meta property="og:description" content="Las últimas noticias de Pachuca y Hidalgo" />
        <meta property="og:type" content="website" />

        {/* Security Headers via Meta */}
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://vercel.live;" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Suspense fallback={<LoadingSpinner />}>
          <Outlet />
        </Suspense>

        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}
```

### 2. Server Functions para Artículos

```typescript
// src/features/articles/server/getArticle.ts
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '@/lib/db'
import { articles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { cache } from '@/lib/cache'

// Schema de validación para el input
const getArticleSchema = z.object({
  id: z.string().uuid('ID de artículo inválido'),
  includeRelated: z.boolean().default(false),
})

// 🔥 Server Function con validación y cache
export const getArticle = createServerFn({ method: 'GET' })
  .validator(getArticleSchema)
  .handler(async ({ data, context }) => {
    const { id, includeRelated } = data

    // 📊 Cache key basado en parámetros
    const cacheKey = `article:${id}:related:${includeRelated}`

    // 🚀 Intentar obtener del cache primero
    const cached = await cache.get(cacheKey)
    if (cached) {
      return cached
    }

    try {
      // 🔍 Consulta principal del artículo
      const article = await db
        .select({
          id: articles.id,
          title: articles.title,
          content: articles.content,
          excerpt: articles.excerpt,
          slug: articles.slug,
          publishedAt: articles.publishedAt,
          updatedAt: articles.updatedAt,
          categoryId: articles.categoryId,
          authorId: articles.authorId,
          featuredImage: articles.featuredImage,
          views: articles.views,
          status: articles.status,
        })
        .from(articles)
        .where(eq(articles.id, id))
        .limit(1)

      if (!article[0]) {
        throw new Error('Artículo no encontrado')
      }

      const result = {
        article: article[0],
        related: includeRelated ? await getRelatedArticles(article[0].categoryId, id) : [],
      }

      // 💾 Guardar en cache por 15 minutos
      await cache.set(cacheKey, result, 900)

      // 📈 Incrementar vistas de forma asíncrona (no bloquear response)
      incrementViews(id).catch(console.error)

      return result
    } catch (error) {
      console.error('Error obteniendo artículo:', error)
      throw new Error('Error interno del servidor')
    }
  })

// Función auxiliar para artículos relacionados
async function getRelatedArticles(categoryId: string, excludeId: string) {
  return db
    .select({
      id: articles.id,
      title: articles.title,
      excerpt: articles.excerpt,
      slug: articles.slug,
      featuredImage: articles.featuredImage,
      publishedAt: articles.publishedAt,
    })
    .from(articles)
    .where(
      and(
        eq(articles.categoryId, categoryId),
        ne(articles.id, excludeId),
        eq(articles.status, 'published')
      )
    )
    .orderBy(desc(articles.publishedAt))
    .limit(5)
}

// Función para incrementar vistas (no bloquear)
async function incrementViews(articleId: string) {
  await db
    .update(articles)
    .set({
      views: sql`${articles.views} + 1`,
      updatedAt: new Date()
    })
    .where(eq(articles.id, articleId))
}
```

### 3. Route con SSR + Server Function

```typescript
// src/routes/noticia.$id.tsx
import { createFileRoute, notFound } from '@tanstack/react-start'
import { Suspense } from 'react'
import { z } from 'zod'
import { getArticle } from '@/features/articles/server/getArticle'
import { ArticleContent } from '@/features/articles/components/ArticleContent'
import { RelatedArticles } from '@/features/articles/components/RelatedArticles'
import { ArticleSkeleton } from '@/features/articles/components/ArticleSkeleton'
import { trackPageView } from '@/features/analytics/server/trackPageView'

// Schema para parámetros de la URL
const articleParamsSchema = z.object({
  id: z.string().uuid(),
})

export const Route = createFileRoute('/noticia/$id')({
  params: {
    parse: articleParamsSchema.parse,
    stringify: ({ id }) => ({ id }),
  },

  // 🎯 SSR Loader - Se ejecuta en el servidor
  loader: async ({ params, context }) => {
    try {
      // Cargar artículo con artículos relacionados
      const data = await getArticle({
        id: params.id,
        includeRelated: true,
      })

      // Track page view de forma asíncrona
      trackPageView({
        page: `/noticia/${params.id}`,
        articleId: params.id,
        userAgent: context.headers['user-agent'] || '',
        ip: context.headers['x-forwarded-for'] || 'unknown',
      }).catch(console.error)

      return data
    } catch (error) {
      console.error('Error loading article:', error)
      throw notFound()
    }
  },

  // 🎨 Component que recibe los datos SSR
  component: ArticlePage,

  // ⚡ Componente de loading mientras se cargan datos
  pendingComponent: () => <ArticleSkeleton />,

  // 🚨 Error boundary específico
  errorComponent: ({ error }) => (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-destructive mb-4">
          Artículo no encontrado
        </h1>
        <p className="text-muted-foreground mb-8">
          El artículo que buscas no existe o ha sido eliminado.
        </p>
        <a
          href="/noticias"
          className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Ver todas las noticias
        </a>
      </div>
    </div>
  ),

  // 🔧 Meta tags dinámicos para SEO
  meta: ({ loaderData }) => [
    {
      title: `${loaderData?.article.title} - Noticias Pachuca`,
    },
    {
      name: 'description',
      content: loaderData?.article.excerpt || 'Noticias de Pachuca',
    },
    {
      property: 'og:title',
      content: loaderData?.article.title,
    },
    {
      property: 'og:description',
      content: loaderData?.article.excerpt,
    },
    {
      property: 'og:image',
      content: loaderData?.article.featuredImage,
    },
    {
      property: 'og:type',
      content: 'article',
    },
  ],
})

function ArticlePage() {
  const { article, related } = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-background">
      {/* Header/Nav component aquí */}

      <main className="container mx-auto px-4 py-8">
        <article className="max-w-4xl mx-auto">
          {/* Contenido principal del artículo */}
          <ArticleContent article={article} />

          {/* Artículos relacionados */}
          {related.length > 0 && (
            <aside className="mt-16">
              <Suspense fallback={<div>Cargando relacionados...</div>}>
                <RelatedArticles articles={related} />
              </Suspense>
            </aside>
          )}
        </article>
      </main>

      {/* Footer component aquí */}
    </div>
  )
}
```

---

## 🔐 AUTENTICACIÓN SEGURA EN SSR

### Patrón: **Session-Based Auth + Server-Side Validation**

### 1. Session Management Server Function

```typescript
// src/features/auth/server/session.ts
import { createServerFn } from '@tanstack/react-start'
import { getCookie, setCookie } from 'vinxi/http'
import { SignJWT, jwtVerify } from 'jose'
import { z } from 'zod'
import { db } from '@/lib/db'
import { users, sessions } from '@/lib/db/schema'
import { eq, and, gt } from 'drizzle-orm'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)

interface SessionData {
  userId: string
  email: string
  role: 'admin' | 'editor' | 'user'
  sessionId: string
}

// 🔐 Crear sesión segura
export const createSession = createServerFn({ method: 'POST' })
  .validator(z.object({
    userId: z.string(),
    email: z.string().email(),
    role: z.enum(['admin', 'editor', 'user']),
    rememberMe: z.boolean().default(false),
  }))
  .handler(async ({ data, context }) => {
    const { userId, email, role, rememberMe } = data

    try {
      // 1. Crear registro de sesión en BD
      const sessionId = crypto.randomUUID()
      const expiresAt = new Date(
        Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)
      ) // 30 días o 1 día

      await db.insert(sessions).values({
        id: sessionId,
        userId,
        expiresAt,
        userAgent: context.headers['user-agent'] || '',
        ipAddress: context.headers['x-forwarded-for'] || 'unknown',
      })

      // 2. Crear JWT con datos mínimos
      const sessionData: SessionData = {
        userId,
        email,
        role,
        sessionId,
      }

      const jwt = await new SignJWT(sessionData)
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime(expiresAt)
        .setIssuedAt()
        .sign(JWT_SECRET)

      // 3. Establecer cookie segura HttpOnly
      setCookie('auth-session', jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
        path: '/',
      })

      return { success: true, session: sessionData }
    } catch (error) {
      console.error('Error creating session:', error)
      throw new Error('Error interno del servidor')
    }
  })

// 🔍 Obtener sesión actual
export const getSession = createServerFn({ method: 'GET' })
  .handler(async ({ context }) => {
    try {
      const sessionCookie = getCookie('auth-session')

      if (!sessionCookie) {
        return null
      }

      // Verificar y decodificar JWT
      const { payload } = await jwtVerify(sessionCookie, JWT_SECRET)
      const sessionData = payload as unknown as SessionData

      // Verificar que la sesión existe y no ha expirado en BD
      const session = await db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.id, sessionData.sessionId),
            gt(sessions.expiresAt, new Date())
          )
        )
        .limit(1)

      if (!session[0]) {
        // Sesión inválida - limpiar cookie
        setCookie('auth-session', '', {
          httpOnly: true,
          maxAge: 0,
          path: '/',
        })
        return null
      }

      return sessionData
    } catch (error) {
      console.error('Error verifying session:', error)
      return null
    }
  })

// 🚪 Logout - Destruir sesión
export const logout = createServerFn({ method: 'POST' })
  .handler(async ({ context }) => {
    try {
      const sessionCookie = getCookie('auth-session')

      if (sessionCookie) {
        const { payload } = await jwtVerify(sessionCookie, JWT_SECRET)
        const sessionData = payload as unknown as SessionData

        // Eliminar sesión de BD
        await db
          .delete(sessions)
          .where(eq(sessions.id, sessionData.sessionId))
      }

      // Limpiar cookie
      setCookie('auth-session', '', {
        httpOnly: true,
        maxAge: 0,
        path: '/',
      })

      return { success: true }
    } catch (error) {
      console.error('Error during logout:', error)
      // Aún así limpiar la cookie
      setCookie('auth-session', '', {
        httpOnly: true,
        maxAge: 0,
        path: '/',
      })

      return { success: true }
    }
  })
```

### 2. Admin Route Protection

```typescript
// src/routes/admin/route.tsx
import { createFileRoute, redirect, Outlet } from '@tanstack/react-start'
import { getSession } from '@/features/auth/server/session'
import { AdminLayout } from '@/components/layout/AdminLayout'

export const Route = createFileRoute('/admin')({
  // 🔒 Validación de autenticación en el servidor
  beforeLoad: async ({ context }) => {
    const session = await getSession()

    // Verificar que esté logueado
    if (!session) {
      throw redirect({
        to: '/login',
        search: {
          redirect: context.location.pathname,
        },
      })
    }

    // Verificar permisos de admin
    if (!['admin', 'editor'].includes(session.role)) {
      throw redirect({
        to: '/',
        search: {
          error: 'no-permissions',
        },
      })
    }

    // Inyectar sesión en el context para rutas hijas
    return {
      session,
    }
  },

  // Layout protegido para admin
  component: AdminLayoutWrapper,

  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-destructive">
          Acceso Denegado
        </h1>
        <p className="text-muted-foreground mt-2">
          No tienes permisos para acceder a esta sección.
        </p>
        <a
          href="/"
          className="inline-block mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg"
        >
          Volver al inicio
        </a>
      </div>
    </div>
  ),
})

function AdminLayoutWrapper() {
  const { session } = Route.useRouteContext()

  return (
    <AdminLayout session={session}>
      <Outlet />
    </AdminLayout>
  )
}
```

### 3. Login Server Action

```typescript
// src/features/auth/server/login.ts
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { createSession } from './session'
import { rateLimiter } from '@/lib/rate-limiter'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña debe tener mínimo 6 caracteres'),
  rememberMe: z.boolean().default(false),
})

export const login = createServerFn({ method: 'POST' })
  .validator(loginSchema)
  .handler(async ({ data, context }) => {
    const { email, password, rememberMe } = data
    const clientIP = context.headers['x-forwarded-for'] || 'unknown'

    try {
      // 🛡️ Rate limiting por IP
      const rateLimitKey = `login-attempts:${clientIP}`
      const attempts = await rateLimiter.check(rateLimitKey, 5, 900) // 5 intentos por 15 min

      if (!attempts.allowed) {
        throw new Error(`Demasiados intentos. Intenta en ${Math.ceil(attempts.resetTime / 60)} minutos.`)
      }

      // 🔍 Buscar usuario por email
      const user = await db
        .select({
          id: users.id,
          email: users.email,
          password: users.password,
          role: users.role,
          status: users.status,
          emailVerified: users.emailVerified,
        })
        .from(users)
        .where(
          and(
            eq(users.email, email.toLowerCase()),
            eq(users.status, 'active')
          )
        )
        .limit(1)

      if (!user[0]) {
        await rateLimiter.increment(rateLimitKey)
        throw new Error('Credenciales inválidas')
      }

      // 🔐 Verificar contraseña
      const isValidPassword = await bcrypt.compare(password, user[0].password)

      if (!isValidPassword) {
        await rateLimiter.increment(rateLimitKey)
        throw new Error('Credenciales inválidas')
      }

      // 📧 Verificar email verificado
      if (!user[0].emailVerified) {
        throw new Error('Por favor verifica tu email antes de iniciar sesión')
      }

      // ✅ Crear sesión exitosa
      const sessionResult = await createSession({
        userId: user[0].id,
        email: user[0].email,
        role: user[0].role,
        rememberMe,
      })

      // 🎯 Reset rate limit en login exitoso
      await rateLimiter.reset(rateLimitKey)

      return {
        success: true,
        user: {
          id: user[0].id,
          email: user[0].email,
          role: user[0].role,
        },
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  })
```

---

## 📊 API TYPES MAPPING & SEGURIDAD

### Patrón: **Zod Schemas + Type-Safe Mappers**

### 1. API Response Mappers

```typescript
// src/lib/api/mappers.ts
import { z } from 'zod'

// 🎯 Schema base para respuestas de la API externa
const BaseApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  timestamp: z.string().datetime(),
})

// 🗞️ Schema para artículo desde API externa
const ExternalArticleSchema = z.object({
  article_id: z.string(),
  headline: z.string(),
  content_body: z.string(),
  summary: z.string().optional(),
  published_date: z.string(),
  last_modified: z.string(),
  category_name: z.string(),
  author_name: z.string(),
  featured_img_url: z.string().url().optional(),
  view_count: z.number().default(0),
  publication_status: z.enum(['draft', 'published', 'archived']),
})

const ExternalArticlesResponseSchema = BaseApiResponseSchema.extend({
  data: z.object({
    articles: z.array(ExternalArticleSchema),
    pagination: z.object({
      current_page: z.number(),
      total_pages: z.number(),
      total_items: z.number(),
      items_per_page: z.number(),
    }),
  }),
})

// 🎨 Schema interno de nuestra app (más limpio)
export const InternalArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  excerpt: z.string().optional(),
  publishedAt: z.date(),
  updatedAt: z.date(),
  category: z.string(),
  author: z.string(),
  featuredImage: z.string().url().optional(),
  views: z.number(),
  status: z.enum(['draft', 'published', 'archived']),
})

export const InternalArticlesResponseSchema = z.object({
  articles: z.array(InternalArticleSchema),
  pagination: z.object({
    page: z.number(),
    totalPages: z.number(),
    total: z.number(),
    limit: z.number(),
  }),
})

// 🔄 Mapper de API externa a formato interno
export class ApiMapper {
  static mapArticle(externalArticle: z.infer<typeof ExternalArticleSchema>) {
    return InternalArticleSchema.parse({
      id: externalArticle.article_id,
      title: externalArticle.headline,
      content: externalArticle.content_body,
      excerpt: externalArticle.summary,
      publishedAt: new Date(externalArticle.published_date),
      updatedAt: new Date(externalArticle.last_modified),
      category: externalArticle.category_name,
      author: externalArticle.author_name,
      featuredImage: externalArticle.featured_img_url,
      views: externalArticle.view_count,
      status: externalArticle.publication_status,
    })
  }

  static mapArticlesResponse(externalResponse: unknown) {
    // Validar respuesta externa
    const validatedExternal = ExternalArticlesResponseSchema.parse(externalResponse)

    // Mapear a formato interno
    return InternalArticlesResponseSchema.parse({
      articles: validatedExternal.data.articles.map(this.mapArticle),
      pagination: {
        page: validatedExternal.data.pagination.current_page,
        totalPages: validatedExternal.data.pagination.total_pages,
        total: validatedExternal.data.pagination.total_items,
        limit: validatedExternal.data.pagination.items_per_page,
      },
    })
  }
}

// 📡 Tipos TypeScript exportados
export type InternalArticle = z.infer<typeof InternalArticleSchema>
export type InternalArticlesResponse = z.infer<typeof InternalArticlesResponseSchema>
```

### 2. Secure API Client Server Function

```typescript
// src/lib/api/client.ts
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { ApiMapper } from './mappers'
import { rateLimiter } from '@/lib/rate-limiter'
import { cache } from '@/lib/cache'

const API_BASE_URL = process.env.EXTERNAL_API_URL!
const API_KEY = process.env.EXTERNAL_API_KEY!

// 🔐 Cliente API seguro (solo server-side)
class SecureApiClient {
  private headers: Record<string, string>

  constructor() {
    this.headers = {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'NoticiaPachuca/1.0',
      'Accept': 'application/json',
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`

    // 🛡️ Rate limiting interno
    await rateLimiter.check(`api-client:${endpoint}`, 100, 60) // 100 req/min por endpoint

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers,
        },
        // Timeout de 10 segundos
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error)
      throw new Error('Error al comunicarse con el servicio externo')
    }
  }
}

// 🗞️ Server Function para obtener artículos
export const fetchArticles = createServerFn({ method: 'GET' })
  .validator(z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(50).default(20),
    category: z.string().optional(),
    search: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const { page, limit, category, search } = data

    // 🔑 Cache key único basado en parámetros
    const cacheKey = `articles:${page}:${limit}:${category || 'all'}:${search || 'none'}`

    // 🚀 Verificar cache primero
    const cached = await cache.get(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const client = new SecureApiClient()

      // 🔗 Construir query string
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(category && { category }),
        ...(search && { search }),
      })

      // 📡 Llamada a API externa
      const externalResponse = await client.request(`/articles?${params}`)

      // 🎨 Mapear a formato interno
      const mappedResponse = ApiMapper.mapArticlesResponse(externalResponse)

      // 💾 Guardar en cache por 5 minutos
      await cache.set(cacheKey, mappedResponse, 300)

      return mappedResponse
    } catch (error) {
      console.error('Error fetching articles:', error)
      throw new Error('Error al cargar las noticias')
    }
  })

// 📰 Server Function para obtener artículo específico
export const fetchArticleById = createServerFn({ method: 'GET' })
  .validator(z.object({
    id: z.string().min(1, 'ID requerido'),
  }))
  .handler(async ({ data }) => {
    const { id } = data
    const cacheKey = `article:${id}`

    const cached = await cache.get(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const client = new SecureApiClient()
      const externalResponse = await client.request(`/articles/${id}`)

      // Validar respuesta individual
      const article = ApiMapper.mapArticle(externalResponse.data)

      // Cache por 15 minutos
      await cache.set(cacheKey, article, 900)

      return article
    } catch (error) {
      console.error('Error fetching article:', error)
      throw new Error('Artículo no encontrado')
    }
  })
```

### 3. Route con Type-Safe Data Loading

```typescript
// src/routes/noticias.tsx
import { createFileRoute } from '@tanstack/react-start'
import { z } from 'zod'
import { fetchArticles } from '@/lib/api/client'
import { ArticleGrid } from '@/features/articles/components/ArticleGrid'
import { Pagination } from '@/components/ui/pagination'
import { SearchFilters } from '@/features/articles/components/SearchFilters'

// Schema para search params con defaults
const articlesSearchSchema = z.object({
  page: z.number().min(1).catch(1),
  limit: z.number().min(1).max(50).catch(20),
  category: z.string().optional(),
  search: z.string().optional(),
})

export const Route = createFileRoute('/noticias')({
  validateSearch: articlesSearchSchema,

  // 🔄 Loader que reacciona a cambios en search params
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    // deps contiene los search params validados
    return await fetchArticles(deps)
  },

  component: NoticiasPage,

  // 🎯 Meta tags dinámicos
  meta: ({ search }) => [
    {
      title: search.search
        ? `Búsqueda: ${search.search} - Noticias Pachuca`
        : search.category
        ? `${search.category} - Noticias Pachuca`
        : 'Noticias - Pachuca',
    },
    {
      name: 'description',
      content: search.search
        ? `Resultados de búsqueda para "${search.search}" en Noticias Pachuca`
        : 'Las últimas noticias de Pachuca y Hidalgo',
    },
  ],
})

function NoticiasPage() {
  const { articles, pagination } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const updateFilters = (newFilters: Partial<typeof search>) => {
    navigate({
      search: { ...search, ...newFilters, page: 1 },
      replace: true,
    })
  }

  const changePage = (page: number) => {
    navigate({
      search: { ...search, page },
      replace: true,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">
              {search.search ? `Búsqueda: ${search.search}` : 'Noticias'}
            </h1>
            {search.category && (
              <p className="text-xl text-muted-foreground">
                Categoría: {search.category}
              </p>
            )}
          </div>

          {/* Filtros de búsqueda */}
          <SearchFilters
            currentFilters={search}
            onFiltersChange={updateFilters}
          />

          {/* Grid de artículos */}
          <ArticleGrid articles={articles} />

          {/* Paginación */}
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={changePage}
          />
        </div>
      </div>
    </div>
  )
}
```

---

## 🚀 ANALYTICS & PERFORMANCE

### Server-Side Analytics Tracking

```typescript
// src/features/analytics/server/track.ts
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '@/lib/db'
import { analytics, pageViews } from '@/lib/db/schema'

const trackEventSchema = z.object({
  event: z.string(),
  page: z.string(),
  userId: z.string().optional(),
  properties: z.record(z.any()).optional(),
  userAgent: z.string(),
  ip: z.string(),
})

export const trackEvent = createServerFn({ method: 'POST' })
  .validator(trackEventSchema)
  .handler(async ({ data }) => {
    try {
      // No bloquear la respuesta - tracking asíncrono
      setImmediate(async () => {
        await db.insert(analytics).values({
          id: crypto.randomUUID(),
          event: data.event,
          page: data.page,
          userId: data.userId,
          properties: data.properties,
          userAgent: data.userAgent,
          ipAddress: data.ip,
          timestamp: new Date(),
        })
      })

      return { success: true }
    } catch (error) {
      console.error('Analytics tracking error:', error)
      // No fallar la request principal por analytics
      return { success: false }
    }
  })

// Tracking específico para page views
export const trackPageView = createServerFn({ method: 'POST' })
  .validator(z.object({
    page: z.string(),
    articleId: z.string().optional(),
    userAgent: z.string(),
    ip: z.string(),
    referrer: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    try {
      setImmediate(async () => {
        await db.insert(pageViews).values({
          id: crypto.randomUUID(),
          page: data.page,
          articleId: data.articleId,
          userAgent: data.userAgent,
          ipAddress: data.ip,
          referrer: data.referrer,
          timestamp: new Date(),
        })
      })

      return { success: true }
    } catch (error) {
      console.error('Page view tracking error:', error)
      return { success: false }
    }
  })
```

---

## 🛡️ SECURITY CHECKLIST

### ✅ **Security Implementation Checklist**

#### **Server Functions Security**
- [ ] Input validation con Zod en todos los server functions
- [ ] Rate limiting por IP y endpoint
- [ ] SQL injection protection con ORM prepared statements
- [ ] XSS protection con input sanitization
- [ ] CSRF protection con tokens en formularios
- [ ] Error handling que no exponga información sensible

#### **Authentication & Sessions**
- [ ] JWT secrets fuertes en variables de entorno
- [ ] HttpOnly cookies para sesiones
- [ ] Secure cookies en producción
- [ ] SameSite cookies para CSRF protection
- [ ] Session expiration y cleanup automático
- [ ] Rate limiting en login endpoints

#### **API Security**
- [ ] API keys nunca expuestas al cliente
- [ ] Timeout en requests externos (10 segundos)
- [ ] Validación de respuestas de APIs externas
- [ ] Error boundaries que no filtren datos sensibles
- [ ] Cache invalidation para datos sensibles

#### **SSR Security**
- [ ] Content Security Policy headers
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Server-side validation de todos los inputs
- [ ] Sanitización de contenido HTML de artículos

---

## 📈 PERFORMANCE OPTIMIZATION

### 1. Selective SSR Configuration

```typescript
// src/routes/buscar.tsx - Cliente-side para búsqueda interactiva
import { createFileRoute } from '@tanstack/react-start'

export const Route = createFileRoute('/buscar')({
  // ⚡ Deshabilitar SSR para búsqueda interactiva
  ssr: false,
  component: SearchPage,
})

// src/routes/noticia.$id.tsx - Full SSR para SEO
export const Route = createFileRoute('/noticia/$id')({
  // 🎯 Full SSR para artículos (SEO crítico)
  ssr: true,
  component: ArticlePage,
})

// src/routes/admin/dashboard.tsx - Data-only SSR
export const Route = createFileRoute('/admin/dashboard')({
  // 📊 Solo cargar datos en servidor, renderizar en cliente
  ssr: 'data-only',
  component: AdminDashboard,
})
```

### 2. Streaming & Suspense

```typescript
// src/routes/noticias.tsx con Streaming
export const Route = createFileRoute('/noticias')({
  loader: async ({ deps }) => {
    // Retornar Promise para streaming
    return {
      articles: fetchArticles(deps), // Promise
      categories: fetchCategories(), // Promise
    }
  },
  component: StreamingNoticiasPage,
})

function StreamingNoticiasPage() {
  const { articles, categories } = Route.useLoaderData()

  return (
    <div>
      {/* Header se renderiza inmediatamente */}
      <header>
        <h1>Noticias</h1>
      </header>

      {/* Sidebar con categorías se renderiza cuando esté listo */}
      <aside>
        <Suspense fallback={<CategoriesSkeleton />}>
          <CategoriesList categoriesPromise={categories} />
        </Suspense>
      </aside>

      {/* Artículos principales se renderizan cuando estén listos */}
      <main>
        <Suspense fallback={<ArticlesSkeleton />}>
          <ArticlesGrid articlesPromise={articles} />
        </Suspense>
      </main>
    </div>
  )
}
```

---

## 🔄 MIGRATION FROM TANSTACK ROUTER

### ✅ **Pasos de Migración Router → Start**

#### **1. Instalación y Setup**
```bash
# Remover TanStack Router
pnpm remove @tanstack/react-router @tanstack/router-devtools

# Instalar TanStack Start
pnpm add @tanstack/react-start
pnpm add -D @tanstack/start-devtools
```

#### **2. Cambios en Configuración**
```typescript
// Antes: vite.config.ts
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

// Después: vite.config.ts
import { TanStackStartVite } from '@tanstack/start-vite'

export default defineConfig({
  plugins: [
    TanStackStartVite({
      // Configuración SSR
    }),
  ],
})
```

#### **3. Migrar Routes**
```typescript
// Antes: createFileRoute()
import { createFileRoute } from '@tanstack/react-router'

// Después: createFileRoute() con SSR options
import { createFileRoute } from '@tanstack/react-start'

export const Route = createFileRoute('/noticia/$id')({
  // Nuevo: configuración SSR
  ssr: true,
  loader: async ({ params }) => {
    // Nuevo: server-side data loading
    return await fetchArticle(params.id)
  },
  component: ArticlePage,
})
```

#### **4. Migrar Client API → Server Functions**
```typescript
// Antes: Cliente API
const fetchArticles = async () => {
  const response = await fetch('/api/articles')
  return response.json()
}

// Después: Server Function
export const fetchArticles = createServerFn({ method: 'GET' })
  .handler(async () => {
    // Se ejecuta en el servidor
    return await db.select().from(articles)
  })
```

---

## 📋 DEPLOYMENT & BUILD

### Production Build Configuration

```typescript
// vite.config.ts para producción
export default defineConfig({
  plugins: [
    TanStackStartVite({
      routesDirectory: './src/routes',
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'start-vendor': ['@tanstack/react-start'],
          'ui-vendor': ['@radix-ui/react-slot', 'class-variance-authority'],
        },
      },
    },
    ssr: true, // Habilitar SSR build
    minify: 'terser',
    sourcemap: false, // Deshabilitar en producción
  },
  ssr: {
    // Configuración SSR específica
    noExternal: ['@tanstack/react-start'],
  },
})
```

---

**📅 Documento creado:** 19 Sept 2025
**🔄 Última actualización:** 19 Sept 2025
**👤 Contexto para:** Coyotito - TanStack Start SSR & Server Actions Guide
**🎯 Objetivo:** Implementación completa de TanStack Start con enfoque en SSR, Server Actions y seguridad para sitio público de noticias

**🚀 Próximos pasos:**
1. Configurar TanStack Start en el proyecto `public-noticias`
2. Implementar server functions para artículos con cache Redis
3. Configurar autenticación SSR con sessions seguras
4. Implementar analytics server-side
5. Deploy con SSR optimizado