import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { getNoticias } from '../features/noticias'
import { PachucaMural } from '../components/shared/PachucaMural'
import { UniversalHeader } from '../components/shared/UniversalHeader'
import { UniversalFooter } from '../components/shared/UniversalFooter'
import { getCategories } from '../features/public-content'

interface NoticiasSearchParams {
  page?: number
  category?: string
  search?: string
}

export const Route = createFileRoute('/noticias')({
  component: NoticiasListPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      page: Number(search?.page) || 1,
      category: (search?.category as string) || undefined,
      search: (search?.search as string) || undefined,
    }
  },
  loader: async () => {
    // El loader inicial carga datos por defecto
    // Los filtros se manejan en el componente con useSearch()
    const response = await getNoticias({
      data: {
        page: 1,
        limit: 20,
        status: 'published',
        sortBy: 'publishedAt',
        sortOrder: 'desc',
      }
    })

    // Fetch categorías para el header
    const categoriesResponse = await getCategories()

    return {
      noticias: response.data || [],
      pagination: response.pagination,
      categories: categoriesResponse.data,
    }
  },
  head: ({ loaderData }) => {
    const { noticias } = loaderData

    // FASE 2: ItemList Schema para listados
    const itemListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: noticias.slice(0, 10).map((noticia, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `https://noticiaspachuca.com/noticia/${noticia.slug}`,
        name: noticia.title
      }))
    }

    return {
      meta: [
        { title: 'Todas las Noticias - Noticias Pachuca' },
        { name: 'description', content: 'Mantente informado con las últimas noticias de Pachuca, Hidalgo y México.' },
        { property: 'og:title', content: 'Todas las Noticias - Noticias Pachuca' },
        { property: 'og:description', content: 'Mantente informado con las últimas noticias de Pachuca, Hidalgo y México.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://noticiaspachuca.com/noticias' },
        { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1' },
      ],
      links: [
        { rel: 'canonical', href: 'https://noticiaspachuca.com/noticias' }
      ],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(itemListSchema)
        }
      ]
    }
  },
})

function NoticiasListPage() {
  const { noticias: initialNoticias, pagination: initialPagination, categories } = Route.useLoaderData()
  const { page, category, search: searchTerm } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  // TODO: Implementar refetch cuando cambien los filtros
  const noticias = initialNoticias
  const pagination = initialPagination

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date)).toUpperCase()
  }

  const handleCategoryFilter = (category: string) => {
    navigate({
      search: {
        page: 1,
        category: category.toLowerCase(),
      }
    })
  }

  const handlePageChange = (newPage: number) => {
    navigate({
      search: {
        page: newPage,
        category,
        search: searchTerm,
      }
    })
  }

  const clearFilters = () => {
    navigate({
      search: {
        page: 1,
      }
    })
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <UniversalHeader categories={categories} />

      {/* Filters */}
      <div className="bg-white border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-black uppercase text-sm tracking-wider text-black">
              CATEGORÍAS:
            </span>

            {category && (
              <button
                onClick={clearFilters}
                className="bg-[#FF0000] text-white px-3 py-1 font-bold uppercase text-xs border-2 border-black hover:bg-black transition-colors"
              >
                ✕ LIMPIAR
              </button>
            )}

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryFilter(cat.name)}
                className={`px-3 py-1 font-bold uppercase text-xs border-2 border-black transition-colors ${
                  category === cat.name.toLowerCase()
                    ? 'bg-[#854836] text-white'
                    : 'bg-white text-black hover:bg-[#FFB22C]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <div className="bg-black text-white px-6 py-4 font-black uppercase text-2xl tracking-wider border-4 border-black relative overflow-hidden">
            <div className="absolute -top-2 -left-2 w-6 h-6 bg-[#FFB22C] transform rotate-45"></div>
            {category
              ? `NOTICIAS: ${category.toUpperCase()}`
              : 'TODAS LAS NOTICIAS'
            }
            {page && page > 1 && (
              <span className="text-[#FFB22C] ml-3">- PÁGINA {page}</span>
            )}
          </div>
          <div className="mt-4 text-sm text-[#854836] font-bold uppercase">
            {pagination.total} NOTICIAS ENCONTRADAS
          </div>
        </div>

        {/* News Grid */}
        {noticias.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {noticias.map((noticia) => (
              <article
                key={noticia._id}
                className="bg-white border-2 border-black p-4 relative hover:shadow-[4px_4px_0px_0px_#000000] transition-shadow group"
              >
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FFB22C] transform rotate-45 group-hover:bg-[#FF0000] transition-colors"></div>

                {noticia.featuredImage?.medium ? (
                  <img
                    src={noticia.featuredImage.medium}
                    alt={noticia.featuredImage.alt || noticia.title}
                    className="w-full h-40 object-cover border-2 border-black mb-4"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <PachucaMural className="w-full h-40 border-2 border-black mb-4" />
                )}

                <div className="flex items-center flex-wrap gap-2 mb-2">
                  <span className="bg-[#854836] text-white px-2 py-1 font-bold uppercase text-xs tracking-wider border-2 border-black">
                    {noticia.category.toUpperCase()}
                  </span>
                  {noticia.stats?.readTime > 0 && (
                    <span className="text-xs text-[#854836] font-bold uppercase">
                      {noticia.stats.readTime} MIN
                    </span>
                  )}
                  {noticia.isFeatured && (
                    <span className="bg-[#FF0000] text-white px-2 py-1 font-bold uppercase text-xs tracking-wider border-2 border-black">
                      ⭐ DESTACADA
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold uppercase tracking-tight text-black mb-2 leading-tight line-clamp-3">
                  {noticia.title}
                </h3>

                <p className="text-sm leading-relaxed text-black mb-3 line-clamp-2">
                  {noticia.excerpt}
                </p>

                <div className="flex items-center justify-between text-xs border-t-2 border-black pt-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold uppercase tracking-wider text-[#854836]">
                      {noticia.author}
                    </span>
                    <span className="text-black font-bold text-[10px] uppercase">
                      {formatDate(noticia.publishedAt)}
                    </span>
                  </div>
                  <Link
                    to="/noticia/$slug"
                    params={{ slug: noticia.slug }}
                    className="bg-black text-white px-3 py-2 font-bold uppercase text-xs border-2 border-black hover:bg-[#FF0000] transition-colors"
                  >
                    LEER →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="bg-white border-4 border-black p-12 text-center">
            <div className="text-2xl font-black uppercase text-black mb-4">
              NO SE ENCONTRARON NOTICIAS
            </div>
            <button
              onClick={clearFilters}
              className="bg-[#854836] text-white px-6 py-3 font-bold uppercase text-sm border-2 border-black hover:bg-[#FF0000] transition-colors"
            >
              VER TODAS LAS NOTICIAS
            </button>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="bg-black text-white px-6 py-3 font-bold uppercase text-sm border-2 border-black hover:bg-[#FF0000] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              ← ANTERIOR
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-10 h-10 font-bold uppercase text-sm border-2 border-black transition-colors ${
                    pageNum === pagination.page
                      ? 'bg-[#854836] text-white'
                      : 'bg-white text-black hover:bg-[#FFB22C]'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="bg-black text-white px-6 py-3 font-bold uppercase text-sm border-2 border-black hover:bg-[#FF0000] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              SIGUIENTE →
            </button>
          </div>
        )}
      </main>

      <UniversalFooter />
    </div>
  )
}
