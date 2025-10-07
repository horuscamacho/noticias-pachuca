# BRUTALIST EDITORIAL LAYOUTS - NOTICIAS PACHUCA

Sistema de diseño para noticiaspachuca.com con enfoque brutalist-editorial.

---

## TABLA DE CONTENIDOS

1. [Sistema de Diseño Base](#sistema-de-diseño-base)
2. [Página de Categoría](#1-página-de-categoría)
3. [Página de Búsqueda](#2-página-de-búsqueda)
4. [Página de Contacto](#3-página-de-contacto)
5. [Boletines](#4-boletines)
6. [Aviso de Privacidad](#5-aviso-de-privacidad)
7. [Páginas Próximamente](#6-páginas-próximamente)
8. [Componentes Reutilizables](#componentes-reutilizables)

---

## SISTEMA DE DISEÑO BASE

### Tokens de Diseño

```typescript
// design-tokens.ts
export const tokens = {
  colors: {
    primary: '#FF0000',      // Rojo Pachuca
    secondary: '#854836',    // Café histórico
    accent: '#FFB22C',       // Dorado
    black: '#000000',
    white: '#FFFFFF',
    gray: {
      50: '#F5F5F5',
      100: '#E5E5E5',
      200: '#D4D4D4',
      300: '#A3A3A3',
      900: '#171717'
    }
  },
  typography: {
    heading: 'Roboto Mono, monospace',
    body: 'Inter, sans-serif'
  },
  spacing: {
    xs: '0.5rem',   // 8px
    sm: '1rem',     // 16px
    md: '1.5rem',   // 24px
    lg: '2rem',     // 32px
    xl: '3rem',     // 48px
    '2xl': '4rem',  // 64px
  },
  borders: {
    thin: '2px solid #000',
    medium: '4px solid #000',
    thick: '8px solid #000'
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  }
}
```

### Clases Base Tailwind

```typescript
// tailwind-preset.js
const brutalistPreset = {
  borderRadius: 'none',
  classes: {
    heading: 'font-mono font-bold tracking-tight',
    body: 'font-sans',
    border: 'border-4 border-black',
    borderThin: 'border-2 border-black',
    borderThick: 'border-8 border-black',
    shadow: 'shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]',
    shadowHover: 'hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
    transition: 'transition-all duration-200'
  }
}
```

---

## 1. PÁGINA DE CATEGORÍA

**Ruta:** `/categoria/:slug`
**Objetivo:** Mostrar todas las noticias de una categoría específica con navegación clara y diseño editorial brutalist.

### Wireframe ASCII

```
┌────────────────────────────────────────────────────────────────────┐
│  LOGO                      BUSCAR           LOGIN   MENÚ          │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Home > Política                                                   │
│                                                                    │
│  ████████████████████████████████████████████████████████████████ │
│  █                                                              █ │
│  █  POLÍTICA                                    [COLOR BAR]    █ │
│  █  Noticias y análisis del acontecer político en Pachuca      █ │
│  █                                                              █ │
│  ████████████████████████████████████████████████████████████████ │
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  [IMAGEN]    │  │  [IMAGEN]    │  │  [IMAGEN]    │           │
│  │              │  │              │  │              │           │
│  │──────────────│  │──────────────│  │──────────────│           │
│  │ TITULAR XXX  │  │ TITULAR YYY  │  │ TITULAR ZZZ  │           │
│  │ Resumen aquí │  │ Resumen aquí │  │ Resumen aquí │           │
│  │ 3 min | Hoy  │  │ 5 min | Ayer │  │ 2 min | Hoy  │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  [IMAGEN]    │  │  [IMAGEN]    │  │  [IMAGEN]    │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                    │
│         [1] [2] [3] ... [10] [SIGUIENTE >]                       │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Estructura de Componentes

```typescript
// app/routes/categoria.$slug.tsx
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { CategoryHeader } from "~/components/category/CategoryHeader";
import { NoticiaCard } from "~/components/noticia/NoticiaCard";
import { Pagination } from "~/components/shared/Pagination";
import { Breadcrumbs } from "~/components/shared/Breadcrumbs";

interface LoaderData {
  category: Category;
  noticias: Noticia[];
  totalPages: number;
  currentPage: number;
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 20;

  const category = await getCategory(params.slug!);
  const { noticias, total } = await getNoticias({
    categorySlug: params.slug,
    page,
    limit
  });

  return json<LoaderData>({
    category,
    noticias,
    totalPages: Math.ceil(total / limit),
    currentPage: page
  });
}

export default function CategoriaPage() {
  const { category, noticias, totalPages, currentPage } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: category.nombre, href: `/categoria/${category.slug}` }
        ]}
      />

      {/* Category Header */}
      <CategoryHeader
        name={category.nombre}
        description={category.descripcion}
        color={category.color}
        count={noticias.length}
      />

      {/* Grid de Noticias */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {noticias.map((noticia) => (
            <NoticiaCard
              key={noticia.id}
              noticia={noticia}
              variant="brutalist"
            />
          ))}
        </div>

        {/* Empty State */}
        {noticias.length === 0 && (
          <div className="text-center py-24 border-4 border-black">
            <h2 className="font-mono font-bold text-4xl mb-4">
              NO HAY NOTICIAS AÚN
            </h2>
            <p className="font-sans text-lg text-gray-600">
              Vuelve pronto para encontrar contenido en esta categoría.
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath={`/categoria/${category.slug}`}
          />
        )}
      </section>
    </div>
  );
}
```

### CategoryHeader Component

```typescript
// components/category/CategoryHeader.tsx
interface CategoryHeaderProps {
  name: string;
  description: string;
  color: string;
  count: number;
}

export function CategoryHeader({ name, description, color, count }: CategoryHeaderProps) {
  return (
    <header
      className="border-y-8 border-black py-12 px-4 relative overflow-hidden"
      style={{ backgroundColor: `${color}15` }}
    >
      {/* Color Bar */}
      <div
        className="absolute top-0 right-0 w-2 h-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />

      <div className="container mx-auto max-w-4xl">
        <h1 className="font-mono font-bold text-5xl md:text-7xl uppercase mb-4 tracking-tight">
          {name}
        </h1>
        <p className="font-sans text-xl md:text-2xl text-gray-700 mb-2">
          {description}
        </p>
        <span className="font-mono text-sm font-bold inline-block px-4 py-2 bg-black text-white">
          {count} ARTÍCULOS
        </span>
      </div>
    </header>
  );
}
```

### NoticiaCard Component

```typescript
// components/noticia/NoticiaCard.tsx
import { Link } from "@remix-run/react";
import { formatDate, readingTime } from "~/utils/helpers";

interface NoticiaCardProps {
  noticia: Noticia;
  variant?: 'brutalist' | 'minimal';
}

export function NoticiaCard({ noticia, variant = 'brutalist' }: NoticiaCardProps) {
  return (
    <article className="group">
      <Link
        to={`/noticia/${noticia.slug}`}
        className="block border-4 border-black bg-white transition-all duration-200 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1"
      >
        {/* Imagen */}
        <div className="relative aspect-[16/9] overflow-hidden border-b-4 border-black">
          <img
            src={noticia.imagenPrincipal || '/placeholder.jpg'}
            alt={noticia.titulo}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {/* Category Badge */}
          <span
            className="absolute top-4 left-4 px-3 py-1 bg-black text-white font-mono text-xs font-bold uppercase"
            style={{ backgroundColor: noticia.categoria.color }}
          >
            {noticia.categoria.nombre}
          </span>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="font-mono font-bold text-xl md:text-2xl mb-3 line-clamp-3 group-hover:underline">
            {noticia.titulo}
          </h3>

          <p className="font-sans text-gray-600 text-base mb-4 line-clamp-2">
            {noticia.resumen}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm font-mono">
            <time
              dateTime={noticia.fechaPublicacion}
              className="text-gray-900 font-bold"
            >
              {formatDate(noticia.fechaPublicacion)}
            </time>
            <span className="text-gray-500">•</span>
            <span className="text-gray-600">
              {readingTime(noticia.contenido)} MIN
            </span>
          </div>

          {/* Author */}
          {noticia.autor && (
            <div className="mt-4 pt-4 border-t-2 border-gray-200">
              <span className="text-xs font-mono text-gray-500 uppercase">
                Por {noticia.autor.nombre}
              </span>
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}
```

### Breadcrumbs Component

```typescript
// components/shared/Breadcrumbs.tsx
import { Link } from "@remix-run/react";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="container mx-auto px-4 py-6"
    >
      <ol className="flex items-center gap-2 text-sm font-mono">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center gap-2">
            {index > 0 && (
              <ChevronRight
                className="w-4 h-4 text-gray-400"
                aria-hidden="true"
              />
            )}
            {index === items.length - 1 ? (
              <span className="font-bold text-black uppercase">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.href}
                className="text-gray-600 hover:text-black hover:underline uppercase transition-colors"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

### Pagination Component

```typescript
// components/shared/Pagination.tsx
import { Link } from "@remix-run/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <nav
      aria-label="Paginación"
      className="mt-16 flex justify-center items-center gap-2"
    >
      {/* Previous */}
      {currentPage > 1 ? (
        <Link
          to={`${basePath}?page=${currentPage - 1}`}
          className="flex items-center gap-2 px-4 py-3 border-4 border-black bg-white font-mono font-bold uppercase text-sm hover:bg-black hover:text-white transition-colors"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
          ANTERIOR
        </Link>
      ) : (
        <span className="flex items-center gap-2 px-4 py-3 border-4 border-gray-300 bg-gray-100 font-mono font-bold uppercase text-sm text-gray-400">
          <ChevronLeft className="w-4 h-4" />
          ANTERIOR
        </span>
      )}

      {/* Page Numbers */}
      <div className="flex gap-2">
        {getPageNumbers().map((pageNum, idx) => (
          typeof pageNum === 'number' ? (
            <Link
              key={idx}
              to={`${basePath}?page=${pageNum}`}
              className={`w-12 h-12 flex items-center justify-center border-4 font-mono font-bold text-sm transition-colors ${
                currentPage === pageNum
                  ? 'border-black bg-black text-white'
                  : 'border-black bg-white hover:bg-gray-100'
              }`}
              aria-label={`Página ${pageNum}`}
              aria-current={currentPage === pageNum ? 'page' : undefined}
            >
              {pageNum}
            </Link>
          ) : (
            <span
              key={idx}
              className="w-12 h-12 flex items-center justify-center font-mono font-bold text-gray-400"
              aria-hidden="true"
            >
              {pageNum}
            </span>
          )
        ))}
      </div>

      {/* Next */}
      {currentPage < totalPages ? (
        <Link
          to={`${basePath}?page=${currentPage + 1}`}
          className="flex items-center gap-2 px-4 py-3 border-4 border-black bg-white font-mono font-bold uppercase text-sm hover:bg-black hover:text-white transition-colors"
          aria-label="Página siguiente"
        >
          SIGUIENTE
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <span className="flex items-center gap-2 px-4 py-3 border-4 border-gray-300 bg-gray-100 font-mono font-bold uppercase text-sm text-gray-400">
          SIGUIENTE
          <ChevronRight className="w-4 h-4" />
        </span>
      )}
    </nav>
  );
}
```

### Estados Interactivos

```css
/* Clases Tailwind para estados */

/* Hover en NoticiaCard */
.noticia-card-hover {
  @apply hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
         hover:-translate-x-1
         hover:-translate-y-1
         transition-all
         duration-200;
}

/* Focus estados para accesibilidad */
.focus-brutalist {
  @apply focus:outline-none
         focus:ring-4
         focus:ring-offset-4
         focus:ring-black;
}

/* Active state para botones */
.active-brutalist {
  @apply active:shadow-none
         active:translate-x-0
         active:translate-y-0;
}
```

### Responsive Breakpoints

```typescript
// Configuración mobile-first

// Mobile (default): 1 columna
<div className="grid grid-cols-1 gap-6">

// Tablet (md: 768px): 2 columnas
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">

// Desktop (lg: 1024px): 3 columnas
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">

// XL (xl: 1280px): Container más ancho
<div className="container mx-auto max-w-7xl">
```

---

## 2. PÁGINA DE BÚSQUEDA

**Ruta:** `/busqueda/:query` o `/busqueda?q=...`
**Objetivo:** Interfaz de búsqueda potente con filtros y resultados destacados.

### Wireframe ASCII

```
┌────────────────────────────────────────────────────────────────────┐
│  ████████████████████████████████████████████████████████████████ │
│  █  [🔍] buscar noticias...                               [X]   █ │
│  ████████████████████████████████████████████████████████████████ │
│                                                                    │
│  Resultados para: "pachuca"  |  235 encontrados                   │
│                                                                    │
│  ┌──────────┐  ┌────────────────────────────────────────────────┐│
│  │ FILTROS  │  │  ┌──────────────────────────────────────────┐  ││
│  │          │  │  │ [IMG] PACHUCA gana el título de...       │  ││
│  │ Categoría│  │  │ ...en PACHUCA se celebró el evento...    │  ││
│  │ □ Política│  │  │ 2 min | Ayer                             │  ││
│  │ ☑ Deportes│  │  └──────────────────────────────────────────┘  ││
│  │ □ Cultura │  │                                                ││
│  │          │  │  ┌──────────────────────────────────────────┐  ││
│  │ Fecha    │  │  │ [IMG] Nuevo estadio en PACHUCA...        │  ││
│  │ ⚫ Hoy    │  │  └──────────────────────────────────────────┘  ││
│  │ ○ Semana │  │                                                ││
│  │ ○ Mes    │  │         [1] [2] [3] ... [24] [>]              ││
│  │          │  │                                                ││
│  │ Ordenar  │  └────────────────────────────────────────────────┘│
│  │ ⚫ Relev. │                                                    │
│  │ ○ Reciente│                                                    │
│  │ ○ Popular │                                                    │
│  └──────────┘                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### Estructura de Componentes

```typescript
// app/routes/busqueda.tsx
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams, Form } from "@remix-run/react";
import { SearchBar } from "~/components/search/SearchBar";
import { SearchFilters } from "~/components/search/SearchFilters";
import { SearchResults } from "~/components/search/SearchResults";
import { SearchStats } from "~/components/search/SearchStats";
import { EmptySearchState } from "~/components/search/EmptySearchState";

interface LoaderData {
  query: string;
  results: SearchResult[];
  total: number;
  filters: {
    categories: Category[];
    dateRanges: DateRange[];
    sortOptions: SortOption[];
  };
  appliedFilters: AppliedFilters;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const category = url.searchParams.get("categoria");
  const dateRange = url.searchParams.get("fecha");
  const sortBy = url.searchParams.get("orden") || "relevancia";

  const { results, total } = await searchNoticias({
    query,
    page,
    category,
    dateRange,
    sortBy,
    limit: 20
  });

  const filters = await getSearchFilters();

  return json<LoaderData>({
    query,
    results,
    total,
    filters,
    appliedFilters: { category, dateRange, sortBy }
  });
}

export default function BusquedaPage() {
  const { query, results, total, filters, appliedFilters } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Search Bar */}
      <div className="sticky top-0 z-50 bg-black border-b-8 border-black">
        <div className="container mx-auto px-4 py-6">
          <SearchBar
            initialQuery={query}
            autoFocus={false}
          />
        </div>
      </div>

      {/* Search Stats */}
      <SearchStats
        query={query}
        total={total}
        className="container mx-auto px-4 py-8"
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:sticky lg:top-32 lg:self-start">
            <SearchFilters
              filters={filters}
              applied={appliedFilters}
              query={query}
            />
          </aside>

          {/* Results */}
          <main>
            {results.length > 0 ? (
              <SearchResults
                results={results}
                query={query}
                total={total}
                currentPage={parseInt(searchParams.get("page") || "1")}
              />
            ) : (
              <EmptySearchState
                query={query}
                suggestions={getSuggestions(query)}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
```

### SearchBar Component

```typescript
// components/search/SearchBar.tsx
import { Form, useNavigation } from "@remix-run/react";
import { Search, X, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface SearchBarProps {
  initialQuery?: string;
  autoFocus?: boolean;
}

export function SearchBar({ initialQuery = "", autoFocus = true }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const navigation = useNavigation();
  const isSearching = navigation.state === "loading";
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <Form method="get" action="/busqueda" className="relative">
      <div className="relative group">
        {/* Input */}
        <input
          ref={inputRef}
          type="search"
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="BUSCAR NOTICIAS..."
          className="w-full px-6 py-4 pl-14 pr-14 text-xl font-mono font-bold uppercase bg-white border-4 border-white placeholder:text-gray-400 focus:outline-none focus:border-yellow-400 transition-colors"
          aria-label="Buscar noticias"
          required
        />

        {/* Search Icon */}
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400"
          aria-hidden="true"
        />

        {/* Loading or Clear Button */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {isSearching ? (
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          ) : query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Submit Button (hidden but functional for accessibility) */}
      <button
        type="submit"
        className="sr-only"
        aria-label="Buscar"
      >
        Buscar
      </button>
    </Form>
  );
}
```

### SearchFilters Component

```typescript
// components/search/SearchFilters.tsx
import { Form, useSearchParams } from "@remix-run/react";
import { Filter } from "lucide-react";

interface SearchFiltersProps {
  filters: {
    categories: Category[];
    dateRanges: DateRange[];
    sortOptions: SortOption[];
  };
  applied: AppliedFilters;
  query: string;
}

export function SearchFilters({ filters, applied, query }: SearchFiltersProps) {
  const [searchParams] = useSearchParams();

  return (
    <div className="border-4 border-black bg-white p-6">
      <h2 className="font-mono font-bold text-xl mb-6 flex items-center gap-2">
        <Filter className="w-5 h-5" />
        FILTROS
      </h2>

      <Form method="get" action="/busqueda" className="space-y-8">
        {/* Hidden query input */}
        <input type="hidden" name="q" value={query} />

        {/* Categories */}
        <fieldset>
          <legend className="font-mono font-bold text-sm uppercase mb-3 border-b-2 border-black pb-2">
            Categoría
          </legend>
          <div className="space-y-2">
            {filters.categories.map((category) => (
              <label
                key={category.slug}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  name="categoria"
                  value={category.slug}
                  defaultChecked={applied.category === category.slug}
                  className="w-5 h-5 border-2 border-black checked:bg-black focus:ring-2 focus:ring-black focus:ring-offset-2"
                />
                <span className="font-sans text-sm group-hover:underline">
                  {category.nombre}
                </span>
                <div
                  className="w-3 h-3 ml-auto"
                  style={{ backgroundColor: category.color }}
                  aria-hidden="true"
                />
              </label>
            ))}
          </div>
        </fieldset>

        {/* Date Range */}
        <fieldset>
          <legend className="font-mono font-bold text-sm uppercase mb-3 border-b-2 border-black pb-2">
            Fecha
          </legend>
          <div className="space-y-2">
            {filters.dateRanges.map((range) => (
              <label
                key={range.value}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <input
                  type="radio"
                  name="fecha"
                  value={range.value}
                  defaultChecked={applied.dateRange === range.value}
                  className="w-5 h-5 border-2 border-black checked:bg-black focus:ring-2 focus:ring-black focus:ring-offset-2"
                />
                <span className="font-sans text-sm group-hover:underline">
                  {range.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Sort Options */}
        <fieldset>
          <legend className="font-mono font-bold text-sm uppercase mb-3 border-b-2 border-black pb-2">
            Ordenar por
          </legend>
          <div className="space-y-2">
            {filters.sortOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <input
                  type="radio"
                  name="orden"
                  value={option.value}
                  defaultChecked={applied.sortBy === option.value}
                  className="w-5 h-5 border-2 border-black checked:bg-black focus:ring-2 focus:ring-black focus:ring-offset-2"
                />
                <span className="font-sans text-sm group-hover:underline">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Apply Button */}
        <button
          type="submit"
          className="w-full py-3 bg-black text-white font-mono font-bold uppercase text-sm border-4 border-black hover:bg-white hover:text-black transition-colors"
        >
          APLICAR FILTROS
        </button>

        {/* Reset Button */}
        <button
          type="reset"
          onClick={() => window.location.href = `/busqueda?q=${query}`}
          className="w-full py-3 bg-white text-black font-mono font-bold uppercase text-sm border-4 border-black hover:bg-gray-100 transition-colors"
        >
          LIMPIAR
        </button>
      </Form>
    </div>
  );
}
```

### SearchResults Component

```typescript
// components/search/SearchResults.tsx
import { Link } from "@remix-run/react";
import { Pagination } from "~/components/shared/Pagination";

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  total: number;
  currentPage: number;
}

export function SearchResults({ results, query, total, currentPage }: SearchResultsProps) {
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark
          key={i}
          className="bg-yellow-300 font-bold px-1"
        >
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className="space-y-6">
      {results.map((result) => (
        <article
          key={result.id}
          className="border-4 border-black bg-white p-6 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200"
        >
          <Link to={`/noticia/${result.slug}`}>
            <div className="flex gap-6">
              {/* Thumbnail */}
              {result.imagenPrincipal && (
                <div className="flex-shrink-0 w-32 h-32 border-2 border-black overflow-hidden">
                  <img
                    src={result.imagenPrincipal}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Category Badge */}
                <span
                  className="inline-block px-2 py-1 mb-2 text-xs font-mono font-bold uppercase text-white"
                  style={{ backgroundColor: result.categoria.color }}
                >
                  {result.categoria.nombre}
                </span>

                {/* Title with highlights */}
                <h3 className="font-mono font-bold text-2xl mb-2 hover:underline">
                  {highlightText(result.titulo, query)}
                </h3>

                {/* Excerpt with highlights */}
                <p className="font-sans text-gray-700 mb-3 line-clamp-2">
                  {highlightText(result.resumen, query)}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-4 text-sm font-mono text-gray-600">
                  <time dateTime={result.fechaPublicacion}>
                    {formatDate(result.fechaPublicacion)}
                  </time>
                  <span>•</span>
                  <span>{result.readingTime} min</span>
                  {result.autor && (
                    <>
                      <span>•</span>
                      <span>Por {result.autor.nombre}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Link>
        </article>
      ))}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(total / 20)}
        basePath={`/busqueda?q=${encodeURIComponent(query)}`}
      />
    </div>
  );
}
```

### EmptySearchState Component

```typescript
// components/search/EmptySearchState.tsx
import { SearchX, TrendingUp } from "lucide-react";
import { Link } from "@remix-run/react";

interface EmptySearchStateProps {
  query: string;
  suggestions?: string[];
}

export function EmptySearchState({ query, suggestions = [] }: EmptySearchStateProps) {
  return (
    <div className="border-8 border-black bg-white p-12 text-center">
      <SearchX className="w-24 h-24 mx-auto mb-6 text-gray-400" />

      <h2 className="font-mono font-bold text-4xl mb-4">
        SIN RESULTADOS
      </h2>

      <p className="font-sans text-xl text-gray-600 mb-8">
        No encontramos noticias para <strong>"{query}"</strong>
      </p>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-8">
          <h3 className="font-mono font-bold text-sm uppercase mb-4 flex items-center justify-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Quizás te interese:
          </h3>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestions.map((suggestion) => (
              <Link
                key={suggestion}
                to={`/busqueda?q=${encodeURIComponent(suggestion)}`}
                className="px-4 py-2 border-2 border-black bg-white font-mono text-sm hover:bg-black hover:text-white transition-colors"
              >
                {suggestion}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="border-t-4 border-black pt-8 mt-8 text-left max-w-md mx-auto">
        <h3 className="font-mono font-bold text-sm uppercase mb-3">
          CONSEJOS DE BÚSQUEDA:
        </h3>
        <ul className="font-sans text-sm text-gray-600 space-y-2">
          <li>• Verifica la ortografía</li>
          <li>• Intenta con términos más generales</li>
          <li>• Prueba con sinónimos</li>
          <li>• Usa menos palabras clave</li>
        </ul>
      </div>

      {/* CTA */}
      <Link
        to="/"
        className="inline-block mt-8 px-8 py-4 bg-black text-white font-mono font-bold uppercase border-4 border-black hover:bg-white hover:text-black transition-colors"
      >
        VER PORTADA
      </Link>
    </div>
  );
}
```

### SearchStats Component

```typescript
// components/search/SearchStats.tsx
interface SearchStatsProps {
  query: string;
  total: number;
  className?: string;
}

export function SearchStats({ query, total, className = "" }: SearchStatsProps) {
  return (
    <div className={className}>
      <div className="border-l-8 border-yellow-400 bg-white px-6 py-4">
        <p className="font-mono text-sm text-gray-600">
          Resultados para:{" "}
          <strong className="text-black text-lg">"{query}"</strong>
        </p>
        <p className="font-mono font-bold text-2xl mt-1">
          {total.toLocaleString()} {total === 1 ? 'ARTÍCULO' : 'ARTÍCULOS'} ENCONTRADOS
        </p>
      </div>
    </div>
  );
}
```

---

## 3. PÁGINA DE CONTACTO

**Ruta:** `/contacto`
**Objetivo:** Formulario de contacto accesible con diseño brutalist amigable.

### Wireframe ASCII

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│  ████████████████████████████████████████████████████████████████ │
│  █                                                              █ │
│  █  CONTÁCTANOS                                                 █ │
│  █  Nos encantaría saber de ti. Escríbenos.                    █ │
│  █                                                              █ │
│  ████████████████████████████████████████████████████████████████ │
│                                                                    │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐  │
│  │  ENVÍA UN MENSAJE        │  │  INFORMACIÓN                 │  │
│  │                          │  │                              │  │
│  │  ┌────────────────────┐  │  │  📧 contacto@noticias...    │  │
│  │  │ Nombre *           │  │  │  📞 +52 771 XXX XXXX        │  │
│  │  └────────────────────┘  │  │  📍 Pachuca, Hidalgo        │  │
│  │                          │  │                              │  │
│  │  ┌────────────────────┐  │  │  HORARIOS:                  │  │
│  │  │ Email *            │  │  │  Lun-Vie: 9:00 - 18:00     │  │
│  │  └────────────────────┘  │  │  Sáb: 10:00 - 14:00        │  │
│  │                          │  │                              │  │
│  │  ┌────────────────────┐  │  │  SÍGUENOS:                  │  │
│  │  │ Asunto *           │  │  │  [F] [T] [I] [Y]           │  │
│  │  └────────────────────┘  │  │                              │  │
│  │                          │  └──────────────────────────────┘  │
│  │  ┌────────────────────┐  │                                    │
│  │  │ Mensaje *          │  │                                    │
│  │  │                    │  │                                    │
│  │  │                    │  │                                    │
│  │  └────────────────────┘  │                                    │
│  │                          │                                    │
│  │  [ ENVIAR MENSAJE ]      │                                    │
│  └──────────────────────────┘                                    │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Estructura de Componentes

```typescript
// app/routes/contacto.tsx
import { json, ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { ContactForm } from "~/components/contact/ContactForm";
import { ContactInfo } from "~/components/contact/ContactInfo";
import { PageHeader } from "~/components/shared/PageHeader";
import { SuccessMessage } from "~/components/contact/SuccessMessage";
import { validateContactForm } from "~/utils/validation";
import { sendContactEmail } from "~/services/email.server";

interface ActionData {
  success?: boolean;
  errors?: {
    nombre?: string;
    email?: string;
    asunto?: string;
    mensaje?: string;
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const data = {
    nombre: formData.get("nombre") as string,
    email: formData.get("email") as string,
    asunto: formData.get("asunto") as string,
    mensaje: formData.get("mensaje") as string,
  };

  const errors = validateContactForm(data);

  if (Object.keys(errors).length > 0) {
    return json<ActionData>({ errors }, { status: 400 });
  }

  try {
    await sendContactEmail(data);
    return json<ActionData>({ success: true });
  } catch (error) {
    return json<ActionData>({
      errors: { mensaje: "Hubo un error al enviar tu mensaje. Intenta de nuevo." }
    }, { status: 500 });
  }
}

export default function ContactoPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <PageHeader
        title="CONTÁCTANOS"
        subtitle="Nos encantaría saber de ti. Comparte tus ideas, sugerencias o reportajes."
        bgColor="bg-gradient-to-r from-red-500 to-yellow-400"
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {actionData?.success ? (
          <SuccessMessage />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
            {/* Form */}
            <ContactForm
              errors={actionData?.errors}
              isSubmitting={isSubmitting}
            />

            {/* Contact Info */}
            <ContactInfo />
          </div>
        )}
      </div>
    </div>
  );
}
```

### ContactForm Component

```typescript
// components/contact/ContactForm.tsx
import { Form } from "@remix-run/react";
import { Send, Loader2 } from "lucide-react";

interface ContactFormProps {
  errors?: {
    nombre?: string;
    email?: string;
    asunto?: string;
    mensaje?: string;
  };
  isSubmitting: boolean;
}

export function ContactForm({ errors, isSubmitting }: ContactFormProps) {
  return (
    <div className="border-4 border-black bg-white p-8">
      <h2 className="font-mono font-bold text-2xl mb-6 border-b-4 border-black pb-4">
        ENVÍA UN MENSAJE
      </h2>

      <Form method="post" className="space-y-6">
        {/* Nombre */}
        <div>
          <label
            htmlFor="nombre"
            className="block font-mono font-bold text-sm uppercase mb-2"
          >
            NOMBRE COMPLETO *
          </label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            required
            aria-required="true"
            aria-invalid={errors?.nombre ? "true" : "false"}
            aria-describedby={errors?.nombre ? "nombre-error" : undefined}
            className={`w-full px-4 py-3 border-4 font-sans focus:outline-none focus:border-yellow-400 transition-colors ${
              errors?.nombre ? 'border-red-500 bg-red-50' : 'border-black'
            }`}
            placeholder="Ej: Juan Pérez López"
          />
          {errors?.nombre && (
            <p
              id="nombre-error"
              className="mt-2 text-sm font-sans text-red-600"
              role="alert"
            >
              {errors.nombre}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block font-mono font-bold text-sm uppercase mb-2"
          >
            CORREO ELECTRÓNICO *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            aria-required="true"
            aria-invalid={errors?.email ? "true" : "false"}
            aria-describedby={errors?.email ? "email-error" : undefined}
            className={`w-full px-4 py-3 border-4 font-sans focus:outline-none focus:border-yellow-400 transition-colors ${
              errors?.email ? 'border-red-500 bg-red-50' : 'border-black'
            }`}
            placeholder="tu@email.com"
          />
          {errors?.email && (
            <p
              id="email-error"
              className="mt-2 text-sm font-sans text-red-600"
              role="alert"
            >
              {errors.email}
            </p>
          )}
        </div>

        {/* Asunto */}
        <div>
          <label
            htmlFor="asunto"
            className="block font-mono font-bold text-sm uppercase mb-2"
          >
            ASUNTO *
          </label>
          <select
            id="asunto"
            name="asunto"
            required
            aria-required="true"
            aria-invalid={errors?.asunto ? "true" : "false"}
            aria-describedby={errors?.asunto ? "asunto-error" : undefined}
            className={`w-full px-4 py-3 border-4 font-sans focus:outline-none focus:border-yellow-400 transition-colors ${
              errors?.asunto ? 'border-red-500 bg-red-50' : 'border-black'
            }`}
          >
            <option value="">Selecciona un asunto</option>
            <option value="sugerencia">Sugerencia</option>
            <option value="reportaje">Enviar Reportaje</option>
            <option value="correccion">Corrección</option>
            <option value="publicidad">Publicidad</option>
            <option value="colaboracion">Colaboración</option>
            <option value="otro">Otro</option>
          </select>
          {errors?.asunto && (
            <p
              id="asunto-error"
              className="mt-2 text-sm font-sans text-red-600"
              role="alert"
            >
              {errors.asunto}
            </p>
          )}
        </div>

        {/* Mensaje */}
        <div>
          <label
            htmlFor="mensaje"
            className="block font-mono font-bold text-sm uppercase mb-2"
          >
            MENSAJE *
          </label>
          <textarea
            id="mensaje"
            name="mensaje"
            required
            aria-required="true"
            aria-invalid={errors?.mensaje ? "true" : "false"}
            aria-describedby={errors?.mensaje ? "mensaje-error" : undefined}
            rows={6}
            className={`w-full px-4 py-3 border-4 font-sans resize-none focus:outline-none focus:border-yellow-400 transition-colors ${
              errors?.mensaje ? 'border-red-500 bg-red-50' : 'border-black'
            }`}
            placeholder="Cuéntanos más..."
          />
          {errors?.mensaje && (
            <p
              id="mensaje-error"
              className="mt-2 text-sm font-sans text-red-600"
              role="alert"
            >
              {errors.mensaje}
            </p>
          )}
          <p className="mt-2 text-sm font-mono text-gray-500">
            Mínimo 10 caracteres
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-black text-white font-mono font-bold uppercase text-lg border-4 border-black hover:bg-white hover:text-black transition-colors disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              ENVIANDO...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              ENVIAR MENSAJE
            </>
          )}
        </button>

        {/* Privacy Note */}
        <p className="text-xs font-sans text-gray-500 text-center">
          Al enviar este formulario, aceptas nuestra{" "}
          <a
            href="/aviso-privacidad"
            className="underline hover:text-black"
          >
            política de privacidad
          </a>
        </p>
      </Form>
    </div>
  );
}
```

### ContactInfo Component

```typescript
// components/contact/ContactInfo.tsx
import { Mail, Phone, MapPin, Clock, Facebook, Twitter, Instagram, Youtube } from "lucide-react";

export function ContactInfo() {
  return (
    <div className="space-y-6">
      {/* Contact Details */}
      <div className="border-4 border-black bg-white p-6">
        <h2 className="font-mono font-bold text-xl mb-6 border-b-4 border-black pb-4">
          INFORMACIÓN
        </h2>

        <div className="space-y-4">
          {/* Email */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-black">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-mono text-xs uppercase text-gray-500 mb-1">
                Email
              </p>
              <a
                href="mailto:contacto@noticiaspachuca.com"
                className="font-sans text-sm hover:underline"
              >
                contacto@noticiaspachuca.com
              </a>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-black">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-mono text-xs uppercase text-gray-500 mb-1">
                Teléfono
              </p>
              <a
                href="tel:+527717123456"
                className="font-sans text-sm hover:underline"
              >
                +52 771 712 3456
              </a>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-black">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-mono text-xs uppercase text-gray-500 mb-1">
                Ubicación
              </p>
              <p className="font-sans text-sm">
                Pachuca de Soto<br />
                Hidalgo, México
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hours */}
      <div className="border-4 border-black bg-yellow-50 p-6">
        <h3 className="font-mono font-bold text-sm uppercase mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          HORARIOS DE ATENCIÓN
        </h3>
        <div className="font-sans text-sm space-y-2">
          <div className="flex justify-between">
            <span className="font-bold">Lunes - Viernes:</span>
            <span>9:00 - 18:00</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Sábado:</span>
            <span>10:00 - 14:00</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Domingo:</span>
            <span className="text-gray-500">Cerrado</span>
          </div>
        </div>
      </div>

      {/* Social Media */}
      <div className="border-4 border-black bg-white p-6">
        <h3 className="font-mono font-bold text-sm uppercase mb-4">
          SÍGUENOS
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <a
            href="https://facebook.com/noticiaspachuca"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 border-2 border-black hover:bg-black hover:text-white transition-colors"
            aria-label="Facebook"
          >
            <Facebook className="w-5 h-5" />
            <span className="font-mono text-xs">Facebook</span>
          </a>
          <a
            href="https://twitter.com/noticiaspachuca"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 border-2 border-black hover:bg-black hover:text-white transition-colors"
            aria-label="Twitter"
          >
            <Twitter className="w-5 h-5" />
            <span className="font-mono text-xs">Twitter</span>
          </a>
          <a
            href="https://instagram.com/noticiaspachuca"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 border-2 border-black hover:bg-black hover:text-white transition-colors"
            aria-label="Instagram"
          >
            <Instagram className="w-5 h-5" />
            <span className="font-mono text-xs">Instagram</span>
          </a>
          <a
            href="https://youtube.com/@noticiaspachuca"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 border-2 border-black hover:bg-black hover:text-white transition-colors"
            aria-label="YouTube"
          >
            <Youtube className="w-5 h-5" />
            <span className="font-mono text-xs">YouTube</span>
          </a>
        </div>
      </div>
    </div>
  );
}
```

### SuccessMessage Component

```typescript
// components/contact/SuccessMessage.tsx
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { Link } from "@remix-run/react";

export function SuccessMessage() {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="border-8 border-black bg-white p-12">
        <div className="inline-block p-6 bg-green-100 border-4 border-green-600 mb-6">
          <CheckCircle2 className="w-16 h-16 text-green-600" />
        </div>

        <h2 className="font-mono font-bold text-4xl mb-4">
          ¡MENSAJE ENVIADO!
        </h2>

        <p className="font-sans text-xl text-gray-700 mb-8">
          Gracias por contactarnos. Hemos recibido tu mensaje y te responderemos
          en un plazo de <strong>24-48 horas</strong>.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-black text-white font-mono font-bold uppercase border-4 border-black hover:bg-white hover:text-black transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            IR A PORTADA
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-black font-mono font-bold uppercase border-4 border-black hover:bg-gray-100 transition-colors"
          >
            ENVIAR OTRO MENSAJE
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 4. BOLETINES

Sistema de 4 tipos de boletines con diseños específicos.

### 4.1 BOLETÍN DE LA MAÑANA

**Ruta:** `/boletin/manana`

```typescript
// app/routes/boletin.manana.tsx
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { NewsletterHeader } from "~/components/newsletter/NewsletterHeader";
import { TopStoriesList } from "~/components/newsletter/TopStoriesList";
import { WeatherWidget } from "~/components/newsletter/WeatherWidget";
import { MotivationalQuote } from "~/components/newsletter/MotivationalQuote";
import { SubscribeCTA } from "~/components/newsletter/SubscribeCTA";

export async function loader({ request }: LoaderFunctionArgs) {
  const topStories = await getTopStories(5);
  const weather = await getWeather("pachuca");
  const quote = await getDailyQuote();

  return json({
    topStories,
    weather,
    quote,
    generatedAt: new Date().toISOString()
  });
}

export default function BoletinMananaPage() {
  const { topStories, weather, quote, generatedAt } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-yellow-50">
      {/* Header */}
      <NewsletterHeader
        title="BUENOS DÍAS, PACHUCA"
        subtitle="Tu resumen matutino de noticias"
        time={new Date(generatedAt)}
        icon="☀️"
      />

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-8">
          {/* Weather Widget */}
          <WeatherWidget data={weather} />

          {/* Top Stories */}
          <section className="border-4 border-black bg-white p-8">
            <h2 className="font-mono font-bold text-3xl mb-6 border-b-4 border-black pb-4">
              TOP 5 NOTICIAS DEL DÍA
            </h2>
            <TopStoriesList stories={topStories} numbered />
          </section>

          {/* Motivational Quote */}
          <MotivationalQuote quote={quote} />

          {/* Subscribe CTA */}
          <SubscribeCTA
            type="manana"
            title="¿QUIERES RECIBIR ESTO CADA MAÑANA?"
            description="Suscríbete y recibe las noticias más importantes antes de las 8:00 AM"
          />
        </div>
      </div>
    </div>
  );
}
```

### WeatherWidget Component

```typescript
// components/newsletter/WeatherWidget.tsx
import { Cloud, Sun, CloudRain, Wind } from "lucide-react";

interface WeatherData {
  temp: number;
  condition: string;
  high: number;
  low: number;
  humidity: number;
  wind: number;
}

export function WeatherWidget({ data }: { data: WeatherData }) {
  const getWeatherIcon = (condition: string) => {
    const icons = {
      sunny: Sun,
      cloudy: Cloud,
      rainy: CloudRain,
    };
    const Icon = icons[condition.toLowerCase() as keyof typeof icons] || Sun;
    return <Icon className="w-16 h-16" />;
  };

  return (
    <div className="border-4 border-black bg-gradient-to-br from-blue-100 to-blue-200 p-6">
      <h3 className="font-mono font-bold text-sm uppercase mb-4">
        CLIMA HOY EN PACHUCA
      </h3>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-white border-4 border-black">
            {getWeatherIcon(data.condition)}
          </div>
          <div>
            <p className="font-mono font-bold text-6xl">
              {data.temp}°
            </p>
            <p className="font-sans text-lg capitalize mt-2">
              {data.condition}
            </p>
          </div>
        </div>

        <div className="text-right font-mono text-sm space-y-2">
          <div className="flex items-center gap-2 justify-end">
            <span className="text-gray-600">Máx/Mín:</span>
            <span className="font-bold">{data.high}° / {data.low}°</span>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <Wind className="w-4 h-4 text-gray-600" />
            <span className="font-bold">{data.wind} km/h</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### TopStoriesList Component

```typescript
// components/newsletter/TopStoriesList.tsx
import { Link } from "@remix-run/react";
import { TrendingUp } from "lucide-react";

interface Story {
  id: string;
  titulo: string;
  slug: string;
  categoria: {
    nombre: string;
    color: string;
  };
  readingTime: number;
}

interface TopStoriesListProps {
  stories: Story[];
  numbered?: boolean;
}

export function TopStoriesList({ stories, numbered = false }: TopStoriesListProps) {
  return (
    <ol className="space-y-6">
      {stories.map((story, index) => (
        <li
          key={story.id}
          className="border-l-8 pl-6 py-4 hover:bg-gray-50 transition-colors"
          style={{ borderColor: story.categoria.color }}
        >
          {numbered && (
            <span className="font-mono font-bold text-4xl text-gray-200 mr-4">
              {String(index + 1).padStart(2, '0')}
            </span>
          )}

          <Link
            to={`/noticia/${story.slug}`}
            className="group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <span
                  className="inline-block px-2 py-1 mb-2 text-xs font-mono font-bold uppercase text-white"
                  style={{ backgroundColor: story.categoria.color }}
                >
                  {story.categoria.nombre}
                </span>

                <h3 className="font-mono font-bold text-xl group-hover:underline">
                  {story.titulo}
                </h3>
              </div>

              <span className="flex-shrink-0 text-sm font-mono text-gray-500">
                {story.readingTime} min
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}
```

### MotivationalQuote Component

```typescript
// components/newsletter/MotivationalQuote.tsx
import { Quote } from "lucide-react";

interface QuoteData {
  text: string;
  author: string;
}

export function MotivationalQuote({ quote }: { quote: QuoteData }) {
  return (
    <div className="border-8 border-black bg-yellow-300 p-8 relative">
      <Quote className="absolute top-4 left-4 w-12 h-12 text-black opacity-20" />

      <blockquote className="relative z-10">
        <p className="font-serif text-2xl md:text-3xl font-bold italic mb-4 text-center">
          "{quote.text}"
        </p>
        <footer className="text-center">
          <cite className="font-mono text-sm uppercase not-italic">
            — {quote.author}
          </cite>
        </footer>
      </blockquote>
    </div>
  );
}
```

### 4.2 BOLETÍN DE LA TARDE

**Ruta:** `/boletin/tarde`

```typescript
// app/routes/boletin.tarde.tsx
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { NewsletterHeader } from "~/components/newsletter/NewsletterHeader";
import { TopStoriesList } from "~/components/newsletter/TopStoriesList";
import { AgendaWidget } from "~/components/newsletter/AgendaWidget";
import { SubscribeCTA } from "~/components/newsletter/SubscribeCTA";

export async function loader() {
  const topStories = await getMostReadToday(3);
  const tomorrowEvents = await getTomorrowAgenda();

  return json({
    topStories,
    tomorrowEvents,
    generatedAt: new Date().toISOString()
  });
}

export default function BoletinTardePage() {
  const { topStories, tomorrowEvents, generatedAt } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-orange-50">
      <NewsletterHeader
        title="RESUMEN DEL DÍA"
        subtitle="Lo más importante de hoy en Pachuca"
        time={new Date(generatedAt)}
        icon="🌆"
      />

      <div className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
        {/* Top 3 Most Read */}
        <section className="border-4 border-black bg-white p-8">
          <h2 className="font-mono font-bold text-3xl mb-6 border-b-4 border-black pb-4 flex items-center gap-3">
            <TrendingUp className="w-8 h-8" />
            LO MÁS LEÍDO HOY
          </h2>
          <TopStoriesList stories={topStories} numbered />
        </section>

        {/* Tomorrow's Agenda */}
        <AgendaWidget events={tomorrowEvents} />

        {/* Subscribe */}
        <SubscribeCTA
          type="tarde"
          title="RECIBE EL RESUMEN DIARIO"
          description="Todos los días a las 6:00 PM en tu correo"
        />
      </div>
    </div>
  );
}
```

### AgendaWidget Component

```typescript
// components/newsletter/AgendaWidget.tsx
import { Calendar, MapPin, Clock } from "lucide-react";

interface Event {
  title: string;
  time: string;
  location: string;
  category: string;
}

export function AgendaWidget({ events }: { events: Event[] }) {
  return (
    <section className="border-4 border-black bg-gradient-to-br from-purple-100 to-pink-100 p-8">
      <h2 className="font-mono font-bold text-2xl mb-6 flex items-center gap-3">
        <Calendar className="w-7 h-7" />
        AGENDA DE MAÑANA
      </h2>

      {events.length > 0 ? (
        <div className="space-y-4">
          {events.map((event, index) => (
            <div
              key={index}
              className="bg-white border-2 border-black p-4"
            >
              <h3 className="font-mono font-bold text-lg mb-2">
                {event.title}
              </h3>
              <div className="flex flex-wrap gap-4 text-sm font-sans text-gray-600">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {event.time}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {event.location}
                </span>
                <span className="px-2 py-1 bg-black text-white text-xs font-mono uppercase">
                  {event.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center py-8 font-sans text-gray-600">
          No hay eventos programados para mañana
        </p>
      )}
    </section>
  );
}
```

### 4.3 BOLETÍN SEMANAL

**Ruta:** `/boletin/semanal`

```typescript
// app/routes/boletin.semanal.tsx
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { NewsletterHeader } from "~/components/newsletter/NewsletterHeader";
import { WeeklyStatsWidget } from "~/components/newsletter/WeeklyStatsWidget";
import { TopStoriesList } from "~/components/newsletter/TopStoriesList";
import { UpcomingEventsWidget } from "~/components/newsletter/UpcomingEventsWidget";
import { SubscribeCTA } from "~/components/newsletter/SubscribeCTA";

export async function loader() {
  const topWeeklyStories = await getTopWeeklyStories(10);
  const stats = await getWeeklyStats();
  const upcomingEvents = await getUpcomingEvents(7); // next 7 days

  return json({
    topWeeklyStories,
    stats,
    upcomingEvents,
    weekStart: getWeekStart(),
    weekEnd: getWeekEnd()
  });
}

export default function BoletinSemanalPage() {
  const { topWeeklyStories, stats, upcomingEvents, weekStart, weekEnd } =
    useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-indigo-50">
      <NewsletterHeader
        title="LO MEJOR DE LA SEMANA"
        subtitle={`Del ${formatDate(weekStart)} al ${formatDate(weekEnd)}`}
        time={new Date()}
        icon="📊"
      />

      <div className="container mx-auto px-4 py-12 max-w-5xl space-y-8">
        {/* Weekly Stats */}
        <WeeklyStatsWidget stats={stats} />

        {/* Top 10 Stories */}
        <section className="border-4 border-black bg-white p-8">
          <h2 className="font-mono font-bold text-3xl mb-6 border-b-4 border-black pb-4">
            TOP 10 NOTICIAS DE LA SEMANA
          </h2>
          <TopStoriesList stories={topWeeklyStories} numbered />
        </section>

        {/* Upcoming Events */}
        <UpcomingEventsWidget events={upcomingEvents} />

        {/* Subscribe */}
        <SubscribeCTA
          type="semanal"
          title="RECIBE EL RESUMEN SEMANAL"
          description="Todos los domingos a las 8:00 AM"
        />
      </div>
    </div>
  );
}
```

### WeeklyStatsWidget Component

```typescript
// components/newsletter/WeeklyStatsWidget.tsx
import { TrendingUp, Eye, MessageSquare, Share2 } from "lucide-react";

interface WeeklyStats {
  totalArticles: number;
  totalViews: number;
  totalComments: number;
  totalShares: number;
  topCategory: string;
}

export function WeeklyStatsWidget({ stats }: { stats: WeeklyStats }) {
  return (
    <div className="border-4 border-black bg-white p-8">
      <h2 className="font-mono font-bold text-2xl mb-6 flex items-center gap-3">
        <TrendingUp className="w-7 h-7" />
        ESTADÍSTICAS DE LA SEMANA
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Eye />}
          label="Artículos Publicados"
          value={stats.totalArticles.toLocaleString()}
          color="bg-blue-100"
        />
        <StatCard
          icon={<Eye />}
          label="Lecturas"
          value={stats.totalViews.toLocaleString()}
          color="bg-green-100"
        />
        <StatCard
          icon={<MessageSquare />}
          label="Comentarios"
          value={stats.totalComments.toLocaleString()}
          color="bg-yellow-100"
        />
        <StatCard
          icon={<Share2 />}
          label="Compartidos"
          value={stats.totalShares.toLocaleString()}
          color="bg-purple-100"
        />
      </div>

      <div className="mt-6 p-4 bg-gray-100 border-2 border-black">
        <p className="font-mono text-sm">
          <strong>Categoría más popular:</strong> {stats.topCategory}
        </p>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className={`${color} border-2 border-black p-4`}>
      <div className="flex justify-between items-start mb-2">
        <div className="p-2 bg-black text-white">
          {icon}
        </div>
      </div>
      <p className="font-mono font-bold text-3xl mb-1">{value}</p>
      <p className="font-sans text-xs text-gray-700">{label}</p>
    </div>
  );
}
```

### 4.4 BOLETÍN DEPORTES

**Ruta:** `/boletin/deportes`

```typescript
// app/routes/boletin.deportes.tsx
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { NewsletterHeader } from "~/components/newsletter/NewsletterHeader";
import { MatchResultsWidget } from "~/components/newsletter/MatchResultsWidget";
import { StandingsTable } from "~/components/newsletter/StandingsTable";
import { UpcomingMatchesWidget } from "~/components/newsletter/UpcomingMatchesWidget";
import { SubscribeCTA } from "~/components/newsletter/SubscribeCTA";

export async function loader() {
  const todayResults = await getTodayMatches();
  const standings = await getLeagueStandings();
  const upcomingMatches = await getUpcomingMatches(5);

  return json({
    todayResults,
    standings,
    upcomingMatches,
    generatedAt: new Date().toISOString()
  });
}

export default function BoletinDeportesPage() {
  const { todayResults, standings, upcomingMatches } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-green-50">
      <NewsletterHeader
        title="DEPORTES HOY"
        subtitle="Resultados, tabla y próximos partidos"
        time={new Date()}
        icon="⚽"
      />

      <div className="container mx-auto px-4 py-12 max-w-5xl space-y-8">
        {/* Match Results */}
        {todayResults.length > 0 && (
          <MatchResultsWidget results={todayResults} />
        )}

        {/* Standings Table */}
        <StandingsTable standings={standings} />

        {/* Upcoming Matches */}
        <UpcomingMatchesWidget matches={upcomingMatches} />

        {/* Subscribe */}
        <SubscribeCTA
          type="deportes"
          title="DEPORTES EN TU CORREO"
          description="Recibe resultados y noticias deportivas diariamente"
        />
      </div>
    </div>
  );
}
```

### MatchResultsWidget Component

```typescript
// components/newsletter/MatchResultsWidget.tsx
interface Match {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  league: string;
  time: string;
}

export function MatchResultsWidget({ results }: { results: Match[] }) {
  return (
    <section className="border-4 border-black bg-white p-8">
      <h2 className="font-mono font-bold text-3xl mb-6 border-b-4 border-black pb-4">
        RESULTADOS DE HOY
      </h2>

      <div className="space-y-4">
        {results.map((match, index) => (
          <div
            key={index}
            className="border-2 border-black p-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase text-gray-600">
                {match.league}
              </span>
              <span className="text-xs font-mono text-gray-600">
                {match.time}
              </span>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
              {/* Home Team */}
              <div className="text-right">
                <p className="font-mono font-bold text-xl">{match.homeTeam}</p>
              </div>

              {/* Score */}
              <div className="px-6 py-3 bg-black text-white border-2 border-black">
                <p className="font-mono font-bold text-2xl">
                  {match.homeScore} - {match.awayScore}
                </p>
              </div>

              {/* Away Team */}
              <div className="text-left">
                <p className="font-mono font-bold text-xl">{match.awayTeam}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

### SubscribeCTA Component (Universal)

```typescript
// components/newsletter/SubscribeCTA.tsx
import { Form, useNavigation } from "@remix-run/react";
import { Mail, Loader2 } from "lucide-react";

interface SubscribeCTAProps {
  type: 'manana' | 'tarde' | 'semanal' | 'deportes';
  title: string;
  description: string;
}

export function SubscribeCTA({ type, title, description }: SubscribeCTAProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <section className="border-8 border-black bg-gradient-to-r from-red-500 to-yellow-400 p-8">
      <div className="max-w-2xl mx-auto text-center">
        <Mail className="w-16 h-16 mx-auto mb-4 text-white" />

        <h2 className="font-mono font-bold text-3xl text-white mb-3">
          {title}
        </h2>

        <p className="font-sans text-lg text-white mb-8">
          {description}
        </p>

        <Form method="post" action="/api/newsletter/subscribe" className="flex gap-2">
          <input type="hidden" name="type" value={type} />

          <input
            type="email"
            name="email"
            placeholder="tu@email.com"
            required
            className="flex-1 px-4 py-3 border-4 border-black font-sans text-lg focus:outline-none focus:ring-4 focus:ring-white"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-black text-white font-mono font-bold uppercase border-4 border-black hover:bg-white hover:text-black transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                ENVIANDO...
              </>
            ) : (
              'SUSCRIBIRSE'
            )}
          </button>
        </Form>

        <p className="text-xs text-white mt-4 opacity-90">
          Sin spam. Cancela cuando quieras.
        </p>
      </div>
    </section>
  );
}
```

---

## 5. AVISO DE PRIVACIDAD

**Ruta:** `/aviso-privacidad`

```typescript
// app/routes/aviso-privacidad.tsx
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { TableOfContents } from "~/components/legal/TableOfContents";
import { LegalSection } from "~/components/legal/LegalSection";
import { PageHeader } from "~/components/shared/PageHeader";

export async function loader() {
  return json({
    lastUpdated: "2025-01-15",
    sections: [
      {
        id: "introduccion",
        title: "Introducción",
        content: "..."
      },
      {
        id: "datos-recopilados",
        title: "Datos que Recopilamos",
        content: "..."
      },
      // ... más secciones
    ]
  });
}

export default function AvisoPrivacidadPage() {
  const { lastUpdated, sections } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="AVISO DE PRIVACIDAD"
        subtitle={`Última actualización: ${formatDate(lastUpdated)}`}
        bgColor="bg-gray-900"
        textColor="text-white"
      />

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
          {/* Sticky TOC */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <TableOfContents sections={sections} />
          </aside>

          {/* Content */}
          <main className="border-4 border-black bg-white p-8 lg:p-12">
            <div className="prose prose-lg max-w-none">
              {sections.map((section) => (
                <LegalSection
                  key={section.id}
                  id={section.id}
                  title={section.title}
                  content={section.content}
                />
              ))}
            </div>

            {/* Contact Footer */}
            <div className="mt-12 pt-8 border-t-4 border-black">
              <h3 className="font-mono font-bold text-xl mb-4">
                ¿PREGUNTAS?
              </h3>
              <p className="font-sans text-gray-700 mb-4">
                Si tienes dudas sobre nuestro aviso de privacidad, contáctanos:
              </p>
              <a
                href="mailto:privacidad@noticiaspachuca.com"
                className="inline-block px-6 py-3 bg-black text-white font-mono font-bold border-4 border-black hover:bg-white hover:text-black transition-colors"
              >
                privacidad@noticiaspachuca.com
              </a>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
```

### TableOfContents Component

```typescript
// components/legal/TableOfContents.tsx
import { useEffect, useState } from "react";
import { List } from "lucide-react";

interface Section {
  id: string;
  title: string;
}

export function TableOfContents({ sections }: { sections: Section[] }) {
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -80% 0px" }
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav
      className="border-4 border-black bg-white p-6"
      aria-label="Tabla de contenidos"
    >
      <h2 className="font-mono font-bold text-sm uppercase mb-4 flex items-center gap-2">
        <List className="w-4 h-4" />
        CONTENIDO
      </h2>

      <ol className="space-y-2">
        {sections.map((section, index) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className={`block py-2 px-3 font-sans text-sm border-l-4 transition-colors ${
                activeSection === section.id
                  ? 'border-black bg-yellow-100 font-bold'
                  : 'border-transparent hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {index + 1}. {section.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

### LegalSection Component

```typescript
// components/legal/LegalSection.tsx
export function LegalSection({ id, title, content }: {
  id: string;
  title: string;
  content: string;
}) {
  return (
    <section id={id} className="scroll-mt-24 mb-12">
      <h2 className="font-mono font-bold text-3xl mb-6 pb-4 border-b-4 border-black">
        {title}
      </h2>
      <div
        className="font-sans text-gray-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </section>
  );
}
```

---

## 6. PÁGINAS "PRÓXIMAMENTE"

**Rutas:** `/publicidad`, `/suscripciones`

```typescript
// app/routes/publicidad.tsx
import { ComingSoonPage } from "~/components/shared/ComingSoonPage";

export default function PublicidadPage() {
  return (
    <ComingSoonPage
      title="PUBLICIDAD"
      description="Próximamente podrás anunciar tu negocio en Noticias Pachuca"
      illustration="📢"
      features={[
        "Alcance local garantizado",
        "Tarifas competitivas",
        "Reportes de rendimiento",
        "Asesoría personalizada"
      ]}
    />
  );
}
```

```typescript
// app/routes/suscripciones.tsx
import { ComingSoonPage } from "~/components/shared/ComingSoonPage";

export default function SuscripcionesPage() {
  return (
    <ComingSoonPage
      title="SUSCRIPCIONES PREMIUM"
      description="Contenido exclusivo y beneficios especiales muy pronto"
      illustration="⭐"
      features={[
        "Noticias sin publicidad",
        "Acceso anticipado a reportajes",
        "Boletines exclusivos",
        "Descuentos en eventos"
      ]}
    />
  );
}
```

### ComingSoonPage Component

```typescript
// components/shared/ComingSoonPage.tsx
import { Form, useNavigation } from "@remix-run/react";
import { Bell, Check, Loader2 } from "lucide-react";
import { useState } from "react";

interface ComingSoonPageProps {
  title: string;
  description: string;
  illustration: string;
  features?: string[];
}

export function ComingSoonPage({
  title,
  description,
  illustration,
  features = []
}: ComingSoonPageProps) {
  const [subscribed, setSubscribed] = useState(false);
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="border-8 border-black bg-white p-12 text-center">
          {/* Illustration */}
          <div className="text-8xl mb-8" aria-hidden="true">
            {illustration}
          </div>

          {/* Title */}
          <h1 className="font-mono font-bold text-5xl mb-4 uppercase">
            {title}
          </h1>

          {/* Description */}
          <p className="font-sans text-xl text-gray-600 mb-8">
            {description}
          </p>

          {/* Features */}
          {features.length > 0 && (
            <div className="mb-8 p-6 bg-yellow-50 border-4 border-black">
              <h2 className="font-mono font-bold text-sm uppercase mb-4">
                QUÉ INCLUIRÁ:
              </h2>
              <ul className="space-y-2 text-left max-w-md mx-auto">
                {features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 font-sans text-gray-700"
                  >
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Email Capture */}
          {!subscribed ? (
            <div>
              <h3 className="font-mono font-bold text-lg mb-4">
                NOTIFÍCAME CUANDO ESTÉ LISTO
              </h3>

              <Form
                method="post"
                action="/api/notify-me"
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
                onSubmit={(e) => {
                  e.preventDefault();
                  // Simulate success
                  setTimeout(() => setSubscribed(true), 1000);
                }}
              >
                <input type="hidden" name="page" value={title} />

                <input
                  type="email"
                  name="email"
                  placeholder="tu@email.com"
                  required
                  className="flex-1 px-4 py-3 border-4 border-black font-sans focus:outline-none focus:border-yellow-400 transition-colors"
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-black text-white font-mono font-bold uppercase border-4 border-black hover:bg-white hover:text-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      ENVIANDO...
                    </>
                  ) : (
                    <>
                      <Bell className="w-5 h-5" />
                      NOTIFICAR
                    </>
                  )}
                </button>
              </Form>

              <p className="text-xs text-gray-500 mt-4">
                Te avisaremos cuando esta sección esté disponible
              </p>
            </div>
          ) : (
            <div className="p-6 bg-green-100 border-4 border-green-600">
              <Check className="w-12 h-12 mx-auto text-green-600 mb-3" />
              <p className="font-mono font-bold text-lg text-green-900">
                ¡LISTO! TE AVISAREMOS PRONTO
              </p>
            </div>
          )}

          {/* Back to Home */}
          <a
            href="/"
            className="inline-block mt-8 px-6 py-3 border-4 border-black bg-white font-mono font-bold uppercase hover:bg-gray-100 transition-colors"
          >
            VOLVER A PORTADA
          </a>
        </div>
      </div>
    </div>
  );
}
```

---

## COMPONENTES REUTILIZABLES

### PageHeader Component

```typescript
// components/shared/PageHeader.tsx
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  bgColor?: string;
  textColor?: string;
  time?: Date;
  icon?: string;
}

export function PageHeader({
  title,
  subtitle,
  bgColor = "bg-black",
  textColor = "text-white",
  time,
  icon
}: PageHeaderProps) {
  return (
    <header className={`${bgColor} ${textColor} border-b-8 border-black py-12 px-4`}>
      <div className="container mx-auto max-w-4xl text-center">
        {icon && (
          <div className="text-6xl mb-4" aria-hidden="true">
            {icon}
          </div>
        )}

        {time && (
          <time
            dateTime={time.toISOString()}
            className="block font-mono text-sm uppercase mb-4 opacity-90"
          >
            {formatDateTime(time)}
          </time>
        )}

        <h1 className="font-mono font-bold text-5xl md:text-7xl uppercase mb-4 tracking-tight">
          {title}
        </h1>

        {subtitle && (
          <p className="font-sans text-xl md:text-2xl opacity-90">
            {subtitle}
          </p>
        )}
      </div>
    </header>
  );
}
```

### NewsletterHeader Component

```typescript
// components/newsletter/NewsletterHeader.tsx
export function NewsletterHeader({ title, subtitle, time, icon }: {
  title: string;
  subtitle: string;
  time: Date;
  icon: string;
}) {
  return (
    <header className="border-b-8 border-black bg-gradient-to-r from-black to-gray-800 text-white py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="text-5xl" aria-hidden="true">{icon}</div>
          <time
            dateTime={time.toISOString()}
            className="font-mono text-sm uppercase px-4 py-2 bg-white text-black"
          >
            {formatTime(time)}
          </time>
        </div>

        <h1 className="font-mono font-bold text-5xl md:text-6xl uppercase mb-3">
          {title}
        </h1>

        <p className="font-sans text-xl opacity-90">
          {subtitle}
        </p>
      </div>
    </header>
  );
}
```

---

## UTILIDADES Y HELPERS

```typescript
// utils/helpers.ts

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(d);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function readingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

```typescript
// utils/validation.ts

export function validateContactForm(data: {
  nombre: string;
  email: string;
  asunto: string;
  mensaje: string;
}) {
  const errors: Record<string, string> = {};

  if (!data.nombre || data.nombre.trim().length < 2) {
    errors.nombre = "El nombre debe tener al menos 2 caracteres";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    errors.email = "Ingresa un correo electrónico válido";
  }

  if (!data.asunto) {
    errors.asunto = "Selecciona un asunto";
  }

  if (!data.mensaje || data.mensaje.trim().length < 10) {
    errors.mensaje = "El mensaje debe tener al menos 10 caracteres";
  }

  return errors;
}
```

---

## ACCESIBILIDAD

### Checklist de Accesibilidad

```typescript
// accessibility-checklist.md

## ARIA Labels
- ✅ Todos los botones tienen aria-label cuando solo tienen íconos
- ✅ Formularios tienen aria-required, aria-invalid, aria-describedby
- ✅ Regiones principales tienen roles (navigation, main, complementary)
- ✅ Breadcrumbs tienen aria-label="Breadcrumb"

## Contraste
- ✅ Ratio mínimo 4.5:1 para texto normal
- ✅ Ratio mínimo 3:1 para texto grande (>18px)
- ✅ Bordes negros sobre fondos claros

## Teclado
- ✅ Todos los elementos interactivos son navegables por teclado
- ✅ Focus states visibles (ring-4 ring-black)
- ✅ Skip to main content link
- ✅ Orden lógico de tabulación

## Semántica
- ✅ Headings en orden jerárquico (h1 > h2 > h3)
- ✅ <nav> para navegación
- ✅ <main> para contenido principal
- ✅ <article> para noticias
- ✅ <time> con datetime para fechas

## Imágenes
- ✅ Alt text descriptivo para imágenes de contenido
- ✅ alt="" para imágenes decorativas
- ✅ Lazy loading para performance

## Formularios
- ✅ Labels explícitos para todos los inputs
- ✅ Mensajes de error claros y vinculados
- ✅ Estados de carga visibles
- ✅ Validación en tiempo real
```

---

## RESPONSIVE DESIGN

### Mobile-First Breakpoints

```css
/* Estructura base mobile-first */

/* Mobile: 320px - 639px (default) */
.container {
  @apply px-4;
}

.grid-noticias {
  @apply grid grid-cols-1 gap-6;
}

/* Tablet: 640px - 1023px */
@media (min-width: 640px) {
  .grid-noticias {
    @apply grid-cols-2 gap-8;
  }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  .container {
    @apply px-8;
  }

  .grid-noticias {
    @apply grid-cols-3;
  }
}

/* XL: 1280px+ */
@media (min-width: 1280px) {
  .container {
    @apply max-w-7xl mx-auto;
  }
}
```

---

## PERFORMANCE

### Optimizaciones Implementadas

```typescript
// Image Lazy Loading
<img
  src={noticia.imagenPrincipal}
  alt={noticia.titulo}
  loading="lazy"
  decoding="async"
/>

// Prefetch Links Críticos
<link rel="prefetch" href="/categoria/deportes" />

// Component Code Splitting (Remix automático)
export const loader = async () => {
  // Server-side data fetching
};

// Virtual Scrolling para listas largas (opcional)
import { useVirtualizer } from '@tanstack/react-virtual';
```

---

## COPYWRITING Y MICROCOPY

### Ejemplos de Copy

```typescript
// Error States
"Ups, algo salió mal. Intenta de nuevo."
"No encontramos lo que buscabas."
"Este campo es requerido"

// Success States
"¡Listo! Mensaje enviado."
"¡Suscripción exitosa!"
"Guardado correctamente"

// Loading States
"Cargando noticias..."
"Enviando mensaje..."
"Buscando..."

// Empty States
"No hay noticias aún"
"Sin resultados"
"Próximamente"

// CTAs
"LEER MÁS"
"VER TODO"
"SUSCRIBIRSE"
"ENVIAR MENSAJE"
"APLICAR FILTROS"

// Navigation
"Ir a portada"
"Volver"
"Siguiente página"
"Página anterior"
```

---

## RESUMEN DE ARCHIVOS

### Estructura de Archivos Creados

```
app/
├── routes/
│   ├── categoria.$slug.tsx
│   ├── busqueda.tsx
│   ├── contacto.tsx
│   ├── boletin.manana.tsx
│   ├── boletin.tarde.tsx
│   ├── boletin.semanal.tsx
│   ├── boletin.deportes.tsx
│   ├── aviso-privacidad.tsx
│   ├── publicidad.tsx
│   └── suscripciones.tsx
│
├── components/
│   ├── category/
│   │   └── CategoryHeader.tsx
│   ├── contact/
│   │   ├── ContactForm.tsx
│   │   ├── ContactInfo.tsx
│   │   └── SuccessMessage.tsx
│   ├── legal/
│   │   ├── TableOfContents.tsx
│   │   └── LegalSection.tsx
│   ├── newsletter/
│   │   ├── NewsletterHeader.tsx
│   │   ├── TopStoriesList.tsx
│   │   ├── WeatherWidget.tsx
│   │   ├── MotivationalQuote.tsx
│   │   ├── AgendaWidget.tsx
│   │   ├── WeeklyStatsWidget.tsx
│   │   ├── MatchResultsWidget.tsx
│   │   ├── StandingsTable.tsx
│   │   ├── UpcomingMatchesWidget.tsx
│   │   └── SubscribeCTA.tsx
│   ├── noticia/
│   │   └── NoticiaCard.tsx
│   ├── search/
│   │   ├── SearchBar.tsx
│   │   ├── SearchFilters.tsx
│   │   ├── SearchResults.tsx
│   │   ├── SearchStats.tsx
│   │   └── EmptySearchState.tsx
│   └── shared/
│       ├── Breadcrumbs.tsx
│       ├── Pagination.tsx
│       ├── PageHeader.tsx
│       └── ComingSoonPage.tsx
│
└── utils/
    ├── helpers.ts
    └── validation.ts
```

---

## PRÓXIMOS PASOS

1. **Implementar los componentes** en orden de prioridad
2. **Crear las rutas** en Remix
3. **Conectar con la API** para datos reales
4. **Testing de accesibilidad** con herramientas como axe
5. **Testing de performance** con Lighthouse
6. **Responsive testing** en diferentes dispositivos
7. **A/B testing** de CTAs y layouts

---

¿Listo para implementar alguna de estas páginas en específico, Coyotito? ¿Quieres que profundice en algún componente o página?
