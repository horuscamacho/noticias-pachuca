import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { getNoticias } from '../features/noticias'
import { getCategories } from '../features/public-content/server'
import { OptimizedImage } from '../components/OptimizedImage'
import { SubscribeForm } from '../components/newsletter/SubscribeForm'
import { useState } from 'react'

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
      }
    })

    // Fetch categorías dinámicas
    const categoriesResponse = await getCategories()

    return {
      noticias: noticiasResponse.data || [],
      pagination: noticiasResponse.pagination,
      categories: categoriesResponse.success ? categoriesResponse.data : [],
    }
  },
})

'use client'

function HomePage() {
  const { noticias, categories } = Route.useLoaderData()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  // Formatear fecha de hoy para el header
  const formatHeaderDate = () => {
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date()).toUpperCase()
  }

  // Manejar búsqueda
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate({ to: '/busqueda/$query', params: { query: searchQuery.trim() } })
    }
  }

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
      {/* 🏗️ BRUTALIST HEADER */}
      <header className="bg-white border-b-4 border-black relative">
        {/* Top Bar */}
        <div className="border-b-2 border-black px-4 py-2">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between md:items-center space-y-2 md:space-y-0 text-sm">
            <div className="flex items-center justify-center md:justify-start space-x-2 md:space-x-4">
              <span className="font-bold uppercase tracking-wider text-black text-xs md:text-sm">
                {formatHeaderDate()}
              </span>
              <span className="text-[#854836] font-bold text-xs md:text-sm">EDICIÓN DE HOY</span>
            </div>
            <div className="flex items-center justify-center md:justify-end space-x-2 md:space-x-4">
              <Link
                to="/login"
                className="bg-black text-white px-3 md:px-4 py-1 font-bold uppercase text-xs border-2 border-black hover:bg-[#FF0000] transition-colors"
              >
                INICIAR SESIÓN
              </Link>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 space-y-4 md:space-y-0">
              {/* Search - Full width on mobile */}
              <div className="md:flex-1 order-2 md:order-1">
                <form onSubmit={handleSearch} className="relative max-w-md mx-auto md:mx-0">
                  <input
                    type="search"
                    placeholder="BUSCAR..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-black bg-[#F7F7F7] font-bold uppercase text-sm placeholder-black focus:outline-none focus:bg-white"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-2 w-6 h-6 bg-black flex items-center justify-center hover:bg-[#FF0000] transition-colors"
                  >
                    <div className="w-3 h-3 border-2 border-white rounded-full"></div>
                  </button>
                </form>
              </div>

              {/* Logo - Centered and larger on mobile */}
              <div className="md:flex-1 text-center relative order-1 md:order-2">
                <div className="absolute -top-2 -left-2 w-4 h-4 md:w-6 md:h-6 bg-[#FF0000] transform rotate-45"></div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-[0.1em] text-black mb-1">
                  NOTICIAS
                </h1>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-[0.1em] text-[#854836]">
                  PACHUCA
                </h2>
                <div className="w-12 md:w-14 lg:w-16 h-1 bg-[#FFB22C] mx-auto mt-2"></div>
                <div className="absolute -bottom-2 -right-2 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] lg:border-l-[12px] lg:border-r-[12px] lg:border-b-[12px] border-l-transparent border-r-transparent border-b-black"></div>
              </div>

              {/* Right side info - Hidden on mobile */}
              <div className="hidden md:flex md:flex-1 text-right order-3">
                <div className="ml-auto">
                  <div className="text-sm font-bold uppercase tracking-wider text-black">
                    HIDALGO, MÉXICO
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="bg-black text-white">
          <div className="max-w-7xl mx-auto px-4">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center justify-center space-x-4 lg:space-x-8 py-3">
              <Link
                to="/"
                className="font-bold uppercase text-sm tracking-wider hover:text-[#FFB22C] transition-colors relative group"
              >
                INICIO
                <div className="absolute -bottom-1 left-0 w-0 h-1 bg-[#FFB22C] group-hover:w-full transition-all duration-300"></div>
              </Link>
              {categories.slice(0, 8).map((category) => (
                <Link
                  key={category.id}
                  to="/categoria/$slug"
                  params={{ slug: category.slug }}
                  className="font-bold uppercase text-sm tracking-wider hover:text-[#FFB22C] transition-colors relative group"
                >
                  {category.name}
                  <div className="absolute -bottom-1 left-0 w-0 h-1 bg-[#FFB22C] group-hover:w-full transition-all duration-300"></div>
                </Link>
              ))}
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden py-3">
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase text-sm tracking-wider text-[#FFB22C]">SECCIONES</span>
                <button
                  className="text-white hover:text-[#FFB22C] transition-colors"
                  onClick={() => {
                    const menu = document.getElementById('mobile-menu');
                    menu?.classList.toggle('hidden');
                  }}
                >
                  <div className="w-6 h-6 flex flex-col justify-center space-y-1">
                    <div className="w-6 h-0.5 bg-white"></div>
                    <div className="w-6 h-0.5 bg-white"></div>
                    <div className="w-6 h-0.5 bg-white"></div>
                  </div>
                </button>
              </div>

              {/* Mobile Menu */}
              <div id="mobile-menu" className="hidden mt-4 grid grid-cols-2 gap-2">
                <Link
                  to="/"
                  className="bg-black text-white px-3 py-2 font-bold uppercase text-xs tracking-wider border border-[#FFB22C] hover:bg-[#FF0000] transition-colors text-center"
                >
                  INICIO
                </Link>
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    to="/categoria/$slug"
                    params={{ slug: category.slug }}
                    className="bg-[#854836] text-white px-3 py-2 font-bold uppercase text-xs tracking-wider border border-[#FFB22C] hover:bg-[#FF0000] transition-colors text-center"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Breaking News Banner */}
      {breakingForBanner.length > 0 && (
        <div className="bg-[#FF0000] text-white py-3 border-b-4 border-black relative overflow-hidden">
          <div className="absolute left-0 top-0 w-8 h-8 bg-black transform rotate-45 -translate-x-4 -translate-y-4"></div>
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center">
              <div className="bg-white text-[#FF0000] px-4 py-1 font-black uppercase text-sm mr-4 border-2 border-black">
                ÚLTIMO MOMENTO
              </div>
              <div className="font-bold uppercase text-lg tracking-wide">
                {breakingForBanner[0].title}
              </div>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 w-6 h-6 bg-[#FFB22C] transform rotate-45 translate-x-3 translate-y-3"></div>
        </div>
      )}

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
                      <span className="text-sm text-[#854836] font-bold uppercase">
                        {featuredArticle.readTime} MIN LECTURA
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

                  {featuredArticle.imageUrl && (
                    <div className="relative">
                      <img
                        src={featuredArticle.imageUrl}
                        alt={featuredArticle.imageAlt}
                        className="w-full h-64 md:h-full object-cover border-2 border-black"
                        loading="eager"
                        decoding="async"
                      />
                      <div className="absolute bottom-2 right-2 w-6 h-6 bg-[#FF0000] transform rotate-45"></div>
                    </div>
                  )}
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
                    <div className="w-full h-40 bg-[#FFB22C] border-2 border-black mb-4 p-4 flex flex-col justify-between relative">
                      <div className="absolute top-2 left-2 right-2 border-t-2 border-black"></div>
                      <div className="absolute bottom-2 left-2 right-2 border-b-2 border-black"></div>
                      <div className="flex-1 flex items-center justify-center px-2">
                        <p className="text-black font-bold text-sm leading-tight text-center uppercase tracking-wider line-clamp-4">
                          {article.summary || 'NOTICIA SIN EXTRACTO DISPONIBLE'}
                        </p>
                      </div>
                      <div className="absolute top-1 right-1 w-4 h-4 bg-black transform rotate-45"></div>
                      <div className="absolute bottom-1 left-1 w-4 h-4 bg-[#854836] transform rotate-45"></div>
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
                    <div className="text-xs text-[#854836] font-bold uppercase">
                      {article.readTime} MIN LECTURA
                    </div>
                  </Link>
                ))}
              </div>
            </div>

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

            {/* Podcasts */}
            <div className="bg-white border-2 border-black p-4 relative">
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#854836] transform rotate-45"></div>

              <h3 className="text-lg font-black uppercase tracking-tight text-black mb-3 border-b-2 border-black pb-2">
                PODCASTS
              </h3>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-[#FFB22C] border-2 border-black flex items-center justify-center">
                    <div className="w-0 h-0 border-l-[8px] border-l-black border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1"></div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-black">LA MAÑANA</h4>
                    <p className="text-xs text-[#854836] font-bold">LAS NOTICIAS DEL DÍA EN 20 MINUTOS</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-[#854836] border-2 border-black flex items-center justify-center">
                    <div className="w-0 h-0 border-l-[8px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1"></div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-black">LA TARDE</h4>
                    <p className="text-xs text-[#854836] font-bold">ANÁLISIS PROFUNDO DE LA ACTUALIDAD</p>
                  </div>
                </div>
              </div>
            </div>
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
      <footer className="bg-black text-white border-t-4 border-[#FFB22C]">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">

            {/* Secciones */}
            <div>
              <h4 className="font-black uppercase text-[#FFB22C] mb-3 tracking-wider">SECCIONES</h4>
              <ul className="space-y-2 text-sm">
                {['Página Principal', 'LOCAL', 'POLÍTICA', 'DEPORTES', 'ECONOMÍA', 'CULTURA', 'TECNOLOGÍA'].map((item) => (
                  <li key={item}>
                    <button className="hover:text-[#FFB22C] transition-colors uppercase font-bold">{item}</button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletters */}
            <div>
              <h4 className="font-black uppercase text-[#FFB22C] mb-3 tracking-wider">BOLETINES</h4>
              <ul className="space-y-2 text-sm">
                {['LA MAÑANA', 'LA TARDE', 'RESUMEN SEMANAL', 'DEPORTES HOY'].map((item) => (
                  <li key={item}>
                    <button className="hover:text-[#FFB22C] transition-colors uppercase font-bold">{item}</button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Más */}
            <div>
              <h4 className="font-black uppercase text-[#FFB22C] mb-3 tracking-wider">MÁS</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/contacto" className="hover:text-[#FFB22C] transition-colors uppercase font-bold">
                    CONTACTO
                  </Link>
                </li>
                <li>
                  <Link to="/publicidad" className="hover:text-[#FFB22C] transition-colors uppercase font-bold">
                    PUBLICIDAD
                  </Link>
                </li>
                <li>
                  <Link to="/suscripciones" className="hover:text-[#FFB22C] transition-colors uppercase font-bold">
                    SUSCRIPCIONES
                  </Link>
                </li>
                <li>
                  <Link to="/aviso-privacidad" className="hover:text-[#FFB22C] transition-colors uppercase font-bold">
                    AVISO DE PRIVACIDAD
                  </Link>
                </li>
              </ul>
            </div>

            {/* Logo Footer */}
            <div className="text-center">
              <div className="border-2 border-[#FFB22C] p-4 relative">
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-[#FF0000] transform rotate-45"></div>
                <h2 className="text-2xl font-black uppercase tracking-wider text-[#FFB22C] mb-1">NOTICIAS</h2>
                <h3 className="text-2xl font-black uppercase tracking-wider text-white">PACHUCA</h3>
                <div className="w-12 h-1 bg-[#FFB22C] mx-auto mt-2"></div>
                <div className="absolute -bottom-2 -right-2 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent border-b-[#FFB22C]"></div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t-2 border-[#FFB22C] pt-6 mt-6 text-center">
            <p className="text-sm font-bold uppercase tracking-wider">
              © 2025 NOTICIAS PACHUCA. TODOS LOS DERECHOS RESERVADOS.
            </p>
            <p className="text-xs text-[#FFB22C] mt-1 font-bold uppercase">
              HIDALGO, MÉXICO
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}