import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { getCategories, searchNoticias } from '../features/public-content';
import { NoticiaCard } from '../components/shared/NoticiaCard';
import { Breadcrumbs } from '../components/shared/Breadcrumbs';
import { Pagination } from '../components/shared/Pagination';
import { OptimizedImage } from '../components/OptimizedImage';
import { useState } from 'react';

export const Route = createFileRoute('/busqueda/$query')({
  component: BusquedaPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      page: Number(search.page || 1),
      category: (search.category as string) || undefined,
      sortBy: (search.sortBy as 'relevance' | 'date') || 'relevance',
    };
  },
  loader: async ({ params, context }) => {
    const { query } = params;
    const page = Number(context.search?.page || 1);
    const category = context.search?.category;
    const sortBy = context.search?.sortBy || 'relevance';

    // Fetch resultados de búsqueda
    const searchResponse = await searchNoticias({
      data: {
        query,
        category,
        sortBy,
        page,
        limit: 20,
      },
    });

    // Fetch categorías para filtros
    const categoriesResponse = await getCategories();

    return {
      resultados: searchResponse.data,
      pagination: {
        total: searchResponse.total,
        page: searchResponse.page,
        limit: searchResponse.limit,
        totalPages: searchResponse.totalPages,
        hasNextPage: searchResponse.hasNextPage,
        hasPrevPage: searchResponse.hasPrevPage,
      },
      categories: categoriesResponse.data,
      query,
      selectedCategory: category,
      sortBy,
    };
  },
  head: ({ loaderData }) => {
    const { query } = loaderData;

    return {
      meta: [
        { title: `Resultados para "${query}" - Noticias Pachuca` },
        { name: 'description', content: `Búsqueda de noticias sobre ${query} en Pachuca, Hidalgo` },
      ],
    };
  },
});

function BusquedaPage() {
  const { resultados, pagination, categories, query, selectedCategory, sortBy } = Route.useLoaderData();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

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
                <Link to="/">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-[0.1em] text-black mb-1">
                    NOTICIAS
                  </h1>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-[0.1em] text-[#854836]">
                    PACHUCA
                  </h2>
                </Link>
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
                  key={category._id}
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
                    key={category._id}
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

      {/* Sección de Resultados */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Inicio', href: '/' },
            { label: 'Búsqueda' },
          ]}
        />

        {/* Título y contador */}
        <div className="border-4 border-black bg-white p-8 mb-8">
          <h1 className="font-mono text-3xl md:text-4xl font-bold uppercase mb-4">
            RESULTADOS DE BÚSQUEDA
          </h1>
          <p className="font-mono font-bold text-xl">
            {pagination.total} {pagination.total === 1 ? 'Resultado' : 'Resultados'} para{' '}
            <span className="text-[#FF0000]">"{query}"</span>
          </p>
        </div>

        {/* Filtros */}
        <div className="mb-8 border-4 border-black bg-white p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filtro de categoría */}
            <div className="flex-1">
              <span className="font-mono font-bold text-sm uppercase block mb-3">FILTRAR POR CATEGORÍA:</span>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/busqueda/$query"
                  params={{ query }}
                  search={{ page: 1, sortBy }}
                  className={`px-4 py-2 border-4 border-black font-mono font-bold text-sm uppercase transition-all ${
                    !selectedCategory
                      ? 'bg-black text-white'
                      : 'bg-white text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  TODAS
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to="/busqueda/$query"
                    params={{ query }}
                    search={{ page: 1, category: cat.slug, sortBy }}
                    className={`px-4 py-2 border-4 border-black font-mono font-bold text-sm uppercase transition-all ${
                      selectedCategory === cat.slug
                        ? 'bg-[#854836] text-white'
                        : 'bg-white text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Separador */}
            <div className="border-t-4 lg:border-t-0 lg:border-l-4 border-black"></div>

            {/* Ordenamiento */}
            <div>
              <span className="font-mono font-bold text-sm uppercase block mb-3">ORDENAR POR:</span>
              <div className="flex gap-2">
                <Link
                  to="/busqueda/$query"
                  params={{ query }}
                  search={{ page: 1, category: selectedCategory, sortBy: 'relevance' }}
                  className={`px-4 py-2 border-4 border-black font-mono font-bold text-sm uppercase transition-all ${
                    sortBy === 'relevance'
                      ? 'bg-black text-white'
                      : 'bg-white text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  RELEVANCIA
                </Link>
                <Link
                  to="/busqueda/$query"
                  params={{ query }}
                  search={{ page: 1, category: selectedCategory, sortBy: 'date' }}
                  className={`px-4 py-2 border-4 border-black font-mono font-bold text-sm uppercase transition-all ${
                    sortBy === 'date'
                      ? 'bg-black text-white'
                      : 'bg-white text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  FECHA
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Resultados */}
        {resultados.length === 0 ? (
          <div className="text-center py-20">
            <div className="border-8 border-black bg-white p-12 inline-block">
              <p className="font-mono text-3xl font-bold mb-4 uppercase">
                NO SE ENCONTRARON RESULTADOS
              </p>
              <p className="text-gray-700 text-lg mb-6">
                No pudimos encontrar noticias que coincidan con <strong>"{query}"</strong>
              </p>
              <Link
                to="/"
                className="inline-block px-8 py-4 bg-[#FF0000] text-white border-4 border-black font-mono font-bold text-lg hover:bg-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
              >
                Volver al Inicio
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Grid de resultados */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {resultados.map((noticia) => (
                <NoticiaCard
                  key={noticia.id}
                  slug={noticia.slug}
                  title={noticia.title}
                  summary={noticia.highlight || noticia.summary}
                  image={noticia.featuredImage}
                  category={{
                    name: noticia.categoryName,
                    slug: noticia.categorySlug,
                    color: '#FF0000',
                  }}
                  publishedAt={noticia.publishedAt}
                />
              ))}
            </div>

            {/* Paginación */}
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              baseUrl={`/busqueda/${query}`}
              searchParams={{ category: selectedCategory, sortBy }}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-black text-white border-t-4 border-[#FFB22C] mt-12">
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
  );
}
