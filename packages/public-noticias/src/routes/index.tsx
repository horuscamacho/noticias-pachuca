import { createFileRoute, Link } from '@tanstack/react-router'
import { getNoticias } from '../features/noticias'
import { getCategories } from '../features/public-content/server'
import { OptimizedImage } from '../components/OptimizedImage'
import { SubscribeForm } from '../components/newsletter/SubscribeForm'
import { OpinionColumnsWidget, EditorialWidget, MOCK_COLUMNS, MOCK_EDITORIAL } from '../components/shared/OpinionWidgets'
import { UniversalHeader } from '../components/shared/UniversalHeader'
import { UniversalFooter } from '../components/shared/UniversalFooter'
import { BreakingNewsBannerWrapper } from '../components/shared/BreakingNewsBannerWrapper'
import { PachucaMural } from '../components/shared/PachucaMural'

export const Route = createFileRoute('/')({
  component: HomePage,
  loader: async () => {
    // Fetch noticias publicadas con paginación
    const noticiasResponse = await getNoticias({
      data: {
        page: 1,
        limit: 10,
        status: 'published',
        sortBy: 'publishedAt',
        sortOrder: 'desc',
        isUrgent: false, // Excluir noticias urgentes (solo aparecen en cintillo)
      }
    })

    // Fetch categorías para el header dinámico
    const categoriesResponse = await getCategories()

    return {
      noticias: noticiasResponse.data || [],
      pagination: noticiasResponse.pagination,
      categories: categoriesResponse.success ? categoriesResponse.data : [],
    }
  },
  head: () => {
    const canonicalUrl = 'https://noticiaspachuca.com'
    const ogImage = 'https://noticiaspachuca.com/og-image-home.jpg' // TODO: Crear imagen 1200x630

    return {
      meta: [
        // Basic meta tags
        {
          title: 'Noticias Pachuca - Noticias de Última Hora en Pachuca, Hidalgo y México'
        },
        {
          name: 'description',
          content: 'Mantente informado con las últimas noticias de Pachuca, Hidalgo y México. Política, deportes, cultura, economía y más. Actualizado 24/7.'
        },
        {
          name: 'keywords',
          content: 'noticias pachuca, pachuca hidalgo, noticias hidalgo, noticias méxico, diario pachuca, periódico pachuca'
        },

        // Open Graph
        { property: 'og:title', content: 'Noticias Pachuca - Tu Fuente de Información Local' },
        { property: 'og:description', content: 'Las noticias más importantes de Pachuca, Hidalgo y México. Cobertura 24/7 de política, deportes, cultura y más.' },
        { property: 'og:image', content: ogImage },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: canonicalUrl },
        { property: 'og:site_name', content: 'Noticias Pachuca' },
        { property: 'og:locale', content: 'es_MX' },

        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Noticias Pachuca - Tu Fuente de Información Local' },
        { name: 'twitter:description', content: 'Las noticias más importantes de Pachuca, Hidalgo y México.' },
        { name: 'twitter:image', content: ogImage },

        // Additional meta
        { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1' },
        { name: 'googlebot', content: 'index, follow' },
        { name: 'language', content: 'es-MX' },
        { name: 'geo.region', content: 'MX-HGO' },
        { name: 'geo.placename', content: 'Pachuca de Soto' },
      ],
      links: [
        { rel: 'canonical', href: canonicalUrl },
      ],
      scripts: [
        // Organization + WebSite Schema
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Organization',
                '@id': 'https://noticiaspachuca.com/#organization',
                name: 'Noticias Pachuca',
                url: 'https://noticiaspachuca.com',
                logo: {
                  '@type': 'ImageObject',
                  '@id': 'https://noticiaspachuca.com/#logo',
                  url: 'https://noticiaspachuca.com/logo-600x60.png',
                  width: 600,
                  height: 60,
                  caption: 'Noticias Pachuca'
                },
                sameAs: [
                  'https://facebook.com/noticiaspachuca',
                  'https://twitter.com/noticiaspachuca',
                  'https://instagram.com/noticiaspachuca'
                ],
                contactPoint: {
                  '@type': 'ContactPoint',
                  contactType: 'editorial',
                  email: 'contacto@noticiaspachuca.com'
                }
              },
              {
                '@type': 'WebSite',
                '@id': 'https://noticiaspachuca.com/#website',
                url: 'https://noticiaspachuca.com',
                name: 'Noticias Pachuca',
                description: 'Noticias de Pachuca, Hidalgo y México',
                publisher: {
                  '@id': 'https://noticiaspachuca.com/#organization'
                },
                potentialAction: {
                  '@type': 'SearchAction',
                  target: {
                    '@type': 'EntryPoint',
                    urlTemplate: 'https://noticiaspachuca.com/busqueda/{search_term_string}'
                  },
                  'query-input': 'required name=search_term_string'
                }
              }
            ]
          })
        }
      ]
    }
  }
})

function HomePage() {
  const { noticias, categories } = Route.useLoaderData()

  // Mapear noticias de la API al formato que espera la UI
  const articles = noticias.map((noticia) => ({
    id: noticia._id,
    slug: noticia.slug,
    title: (noticia.title || 'Sin título').toUpperCase(),
    summary: noticia.summary || noticia.excerpt || '',
    category: (noticia.category || 'General').toUpperCase(),
    author: (noticia.author || 'Redacción').toUpperCase(),
    publishedAt: noticia.publishedAt,
    readTime: noticia.stats?.readTime || 0,
    imageUrl: noticia.featuredImage?.large || noticia.featuredImage?.medium || noticia.featuredImage?.thumbnail || null,
    imageAlt: noticia.featuredImage?.alt || noticia.title || 'Imagen de noticia',
    isFeatured: noticia.isFeatured || false,
    isBreaking: noticia.isBreaking || false,
  }))

  const featuredArticle = articles.find(article => article.isFeatured) || articles[0]
  const breakingNews = articles.filter(article => article.isBreaking)

  // Mostrar SOLO la primera breaking news en el banner, las demás van al grid regular
  const breakingForBanner = breakingNews.length > 0 ? [breakingNews[0]] : []
  const otherBreaking = breakingNews.slice(1) // Breaking news 2, 3, 4...

  const regularArticles = articles.filter(article =>
    article.id !== featuredArticle?.id &&
    article.id !== breakingForBanner[0]?.id // Excluir solo la breaking del banner
  )

  // Para el sidebar: usar las últimas 3 noticias (excluyendo featured y breaking)
  const sidebarArticles = regularArticles.slice(0, 3).map(article => ({
    id: article.id,
    slug: article.slug,
    title: article.title,
    readTime: article.readTime,
  }))

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Header Universal con categorías dinámicas */}
      <UniversalHeader categories={categories} />

      {/* 🚨 Breaking News Banner - ÚLTIMO MOMENTO (data real de API) */}
      <BreakingNewsBannerWrapper />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Main Content Area */}
          <div className="lg:col-span-3">

            {/* Featured Article */}
            {featuredArticle && (
              <article className="bg-white border-4 border-black mb-8 relative">
                <div className="absolute -top-2 -left-2 w-8 h-8 bg-[#FFB22C] transform rotate-45"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 md:p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <span className="bg-[#854836] text-white px-3 py-1 font-bold uppercase text-xs tracking-wider border-2 border-black">
                        {featuredArticle.category}
                      </span>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black leading-tight">
                      {featuredArticle.title}
                    </h1>

                    <p className="text-base leading-relaxed text-black font-medium">
                      {featuredArticle.summary}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold uppercase tracking-wider text-[#854836]">
                        POR {featuredArticle.author}
                      </div>
                      <Link
                        to="/noticia/$slug"
                        params={{ slug: featuredArticle.slug }}
                        className="bg-black text-white px-6 py-2 font-bold uppercase text-sm border-2 border-black hover:bg-[#FF0000] transition-colors relative group inline-block"
                      >
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FFB22C] transform rotate-45 group-hover:bg-white transition-colors"></div>
                        LEER MÁS
                      </Link>
                    </div>
                  </div>

                  <div className="relative">
                    {featuredArticle.imageUrl ? (
                      <img
                        src={featuredArticle.imageUrl}
                        alt={featuredArticle.imageAlt}
                        className="w-full h-64 md:h-full object-cover border-2 border-black"
                        loading="eager"
                        decoding="async"
                      />
                    ) : (
                      <div className="w-full h-64 md:h-full border-2 border-black overflow-hidden">
                        <PachucaMural className="w-full h-full" />
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 w-6 h-6 bg-[#FF0000] transform rotate-45"></div>
                  </div>
                </div>
              </article>
            )}

            {/* News Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {regularArticles.map((article) => (
                <article key={article.id} className="bg-white border-2 border-black p-4 relative hover:shadow-[4px_4px_0px_0px_#000000] transition-shadow group">
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FFB22C] transform rotate-45 group-hover:bg-[#FF0000] transition-colors"></div>

                  {article.imageUrl ? (
                    <OptimizedImage
                      src={article.imageUrl}
                      alt={article.imageAlt}
                      className="w-full h-40 object-cover border-2 border-black mb-4"
                      priority={false}
                    />
                  ) : (
                    <div className="w-full h-40 border-2 border-black mb-4 relative overflow-hidden">
                      <PachucaMural className="w-full h-full" />
                    </div>
                  )}

                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <span className="bg-[#854836] text-white px-2 py-1 font-bold uppercase text-xs tracking-wider border-2 border-black">
                      {article.category}
                    </span>
                    {article.readTime > 0 && (
                      <span className="text-xs text-[#854836] font-bold uppercase">
                        {article.readTime} MIN
                      </span>
                    )}
                    {article.isFeatured && (
                      <span className="bg-[#FF0000] text-white px-2 py-1 font-bold uppercase text-xs tracking-wider border-2 border-black">
                        ⭐ DESTACADA
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold uppercase tracking-tight text-black mb-2 leading-tight line-clamp-3">
                    {article.title}
                  </h3>

                  <p className="text-sm leading-relaxed text-black mb-3 line-clamp-2">
                    {article.summary}
                  </p>

                  <div className="flex items-center justify-between text-xs border-t-2 border-black pt-3">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold uppercase tracking-wider text-[#854836]">
                        {article.author}
                      </span>
                      <span className="text-black font-bold text-[10px] uppercase">
                        {new Intl.DateTimeFormat('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        }).format(new Date(article.publishedAt)).toUpperCase()}
                      </span>
                    </div>
                    <Link
                      to="/noticia/$slug"
                      params={{ slug: article.slug }}
                      className="bg-black text-white px-3 py-2 font-bold uppercase text-xs border-2 border-black hover:bg-[#FF0000] transition-colors"
                    >
                      LEER →
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* Ver Todas las Noticias */}
            <div className="mt-8 text-center">
              <Link
                to="/noticias"
                className="inline-block bg-black text-white px-8 py-4 font-black uppercase text-lg border-4 border-black hover:bg-[#FF0000] transition-colors relative group"
              >
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-[#FFB22C] transform rotate-45 group-hover:bg-white transition-colors"></div>
                VER TODAS LAS NOTICIAS →
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-[#854836] transform rotate-45 group-hover:bg-[#FF0000] transition-colors"></div>
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">

            {/* En Caso de que te lo Hayas Perdido */}
            <div className="bg-white border-2 border-black p-4 relative">
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-[#FF0000] transform rotate-45"></div>

              <h2 className="text-xl font-black uppercase tracking-tight text-black mb-4 border-b-2 border-black pb-2">
                EN CASO DE QUE<br />TE LO HAYAS PERDIDO
              </h2>

              <div className="space-y-4">
                {sidebarArticles.map((article, index) => (
                  <Link
                    key={article.id}
                    to="/noticia/$slug"
                    params={{ slug: article.slug }}
                    className="border-b border-[#F7F7F7] pb-3 last:border-b-0 block"
                  >
                    <h4 className="text-sm font-bold text-black leading-tight mb-2 hover:text-[#854836] transition-colors cursor-pointer">
                      {article.title}
                    </h4>
                  </Link>
                ))}
              </div>
            </div>

            {/* Editorial */}
            <EditorialWidget editorial={MOCK_EDITORIAL} />

            {/* Newsletter */}
            <div className="bg-[#FFB22C] border-4 border-black p-4 relative">
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-black transform rotate-45"></div>

              <h3 className="text-lg font-black uppercase tracking-tight text-black mb-3">
                BOLETÍN DIARIO
              </h3>

              <p className="text-sm font-bold text-black mb-4">
                RECIBE LAS NOTICIAS MÁS IMPORTANTES DE PACHUCA EN TU EMAIL.
              </p>

              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="TU@EMAIL.COM"
                  className="w-full px-3 py-2 border-2 border-black bg-white font-bold uppercase text-sm placeholder-black focus:outline-none"
                />
                <button className="w-full bg-black text-white py-2 font-bold uppercase text-sm border-2 border-black hover:bg-[#FF0000] transition-colors">
                  SUSCRIBIRSE
                </button>
              </div>
            </div>

            {/* Columnas de Opinión */}
            <OpinionColumnsWidget columns={MOCK_COLUMNS} />

          </aside>
        </div>
      </main>

      {/* Sección de Suscripción a Boletines */}
      <section id="suscribirse" className="bg-[#854836] border-t-8 border-b-8 border-black py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-4">
              RECIBE NUESTROS BOLETINES
            </h2>
            <p className="text-xl text-white max-w-2xl mx-auto">
              Mantente informado con las noticias más importantes de Pachuca.
              Elige los boletines que quieres recibir.
            </p>
          </div>

          <div className="bg-white border-4 border-black p-8 relative">
            <div className="absolute -top-2 -left-2 w-8 h-8 bg-[#FFB22C] transform rotate-45"></div>
            <SubscribeForm />
            <div className="absolute -bottom-2 -right-2 w-0 h-0 border-l-[16px] border-r-[16px] border-b-[16px] border-l-transparent border-r-transparent border-b-[#FFB22C]"></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <UniversalFooter />
    </div>
  )
}