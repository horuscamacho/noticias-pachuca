import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { getCategories, getNoticiasByCategory } from '../features/public-content';
import { NoticiaCard } from '../components/shared/NoticiaCard';

export const Route = createFileRoute('/categoria/$slug')({
  component: CategoriaPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      page: Number(search.page || 1),
    };
  },
  loader: async ({ params, context }) => {
    const { slug } = params;
    const page = Number(context.search?.page || 1);

    // Fetch categorías para el header
    const categoriesResponse = await getCategories();

    // Fetch noticias de la categoría
    const noticiasResponse = await getNoticiasByCategory({
      data: {
        slug,
        page,
        limit: 20,
      },
    });

    const currentCategory = categoriesResponse.data.find((cat) => cat.slug === slug);

    if (!currentCategory) {
      throw new Error('Categoría no encontrada');
    }

    return {
      noticias: noticiasResponse.data,
      pagination: {
        total: noticiasResponse.total,
        page: noticiasResponse.page,
        limit: noticiasResponse.limit,
        totalPages: noticiasResponse.totalPages,
        hasNextPage: noticiasResponse.hasNextPage,
        hasPrevPage: noticiasResponse.hasPrevPage,
      },
      category: currentCategory,
      categories: categoriesResponse.data,
    };
  },
  head: ({ loaderData }) => {
    const { category } = loaderData;

    return {
      meta: [
        { title: category.seoTitle },
        { name: 'description', content: category.seoDescription },
        { property: 'og:title', content: category.seoTitle },
        { property: 'og:description', content: category.seoDescription },
        { property: 'og:type', content: 'website' },
      ],
    };
  },
});

function CategoriaPage() {
  const { noticias, pagination, category, categories } = Route.useLoaderData();
  const navigate = useNavigate({ from: Route.fullPath });
  const [searchQuery, setSearchQuery] = useState('');

  const formatHeaderDate = () => {
    const date = new Date();
    const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
    const months = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    return `${days[date.getDay()]}, ${date.getDate()} DE ${months[date.getMonth()]} DE ${date.getFullYear()}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate({ to: '/busqueda/$query', params: { query: searchQuery.trim() } });
    }
  };

  const handlePageChange = (newPage: number) => {
    navigate({
      to: '/categoria/$slug',
      params: { slug: category.slug },
      search: { page: newPage },
    });
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Header */}
      <header>
        {/* Top Bar */}
        <div className="bg-[#F7F7F7] border-b-2 border-black">
          <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col md:flex-row justify-between items-center gap-2">
            <div className="text-center md:text-left">
              <span className="text-black font-bold text-xs md:text-sm uppercase tracking-wider">
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
                <Link to="/">
                  <div className="absolute -top-2 -left-2 w-4 h-4 md:w-6 md:h-6 bg-[#FF0000] transform rotate-45"></div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-[0.1em] text-black mb-1">
                    NOTICIAS
                  </h1>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-[0.1em] text-[#854836]">
                    PACHUCA
                  </h2>
                  <div className="w-12 md:w-14 lg:w-16 h-1 bg-[#FFB22C] mx-auto mt-2"></div>
                  <div className="absolute -bottom-2 -right-2 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] lg:border-l-[12px] lg:border-r-[12px] lg:border-b-[12px] border-l-transparent border-r-transparent border-b-black"></div>
                </Link>
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
              {categories.slice(0, 8).map((cat) => (
                <Link
                  key={cat.id}
                  to="/categoria/$slug"
                  params={{ slug: cat.slug }}
                  className="font-bold uppercase text-sm tracking-wider hover:text-[#FFB22C] transition-colors relative group"
                >
                  {cat.name}
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
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to="/categoria/$slug"
                    params={{ slug: cat.slug }}
                    className="bg-[#854836] text-white px-3 py-2 font-bold uppercase text-xs tracking-wider border border-[#FFB22C] hover:bg-[#FF0000] transition-colors text-center"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Category Header Banner */}
      <div className="bg-white border-b-4 border-black py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Breadcrumbs */}
          <div className="mb-4">
            <Link to="/" className="text-sm font-bold uppercase tracking-wider text-black hover:text-[#FF0000]">
              INICIO
            </Link>
            <span className="mx-2 text-black">/</span>
            <span className="text-sm font-bold uppercase tracking-wider text-[#854836]">
              {category.name}
            </span>
          </div>

          {/* Category Title with Color Bar */}
          <div className="relative">
            <div
              className="absolute left-0 top-0 w-2 h-full"
              style={{ backgroundColor: category.color }}
            ></div>
            <div className="pl-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-wider text-black mb-3">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-lg md:text-xl text-black max-w-3xl leading-relaxed">
                  {category.description}
                </p>
              )}
              <div className="mt-4 inline-block bg-black text-white px-4 py-2 font-mono font-bold text-sm uppercase border-2 border-black">
                {pagination.total} {pagination.total === 1 ? 'NOTICIA' : 'NOTICIAS'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {noticias.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <div className="bg-white border-4 border-black p-12 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <p className="font-mono text-2xl md:text-3xl font-bold mb-4 uppercase">
                NO HAY NOTICIAS AÚN
              </p>
              <p className="text-black text-lg">
                Esta categoría aún no tiene contenido publicado.
              </p>
              <Link
                to="/"
                className="inline-block mt-6 bg-[#854836] text-white px-6 py-3 font-bold uppercase text-sm border-4 border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                VER TODAS LAS NOTICIAS
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Grid 3 columnas desktop, 1 móvil */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {noticias.map((noticia) => (
                <NoticiaCard
                  key={noticia.id}
                  slug={noticia.slug}
                  title={noticia.title}
                  summary={noticia.summary}
                  image={noticia.featuredImage}
                  category={{
                    name: noticia.categoryName,
                    slug: noticia.categorySlug,
                    color: noticia.categoryColor,
                  }}
                  publishedAt={noticia.publishedAt}
                  readTime={noticia.readTime}
                  author={noticia.author}
                />
              ))}
            </div>

            {/* Paginación Brutalist */}
            {pagination.totalPages > 1 && (
              <div className="mt-12 flex justify-center items-center space-x-2">
                {/* Previous */}
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage}
                  className={`px-4 py-2 font-bold uppercase text-sm border-4 border-black transition-all ${
                    pagination.hasPrevPage
                      ? 'bg-white text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-[#F7F7F7] text-gray-400 cursor-not-allowed'
                  }`}
                >
                  ANTERIOR
                </button>

                {/* Page Numbers */}
                <div className="hidden md:flex space-x-2">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 font-bold border-4 border-black transition-all ${
                          pagination.page === pageNum
                            ? 'bg-[#854836] text-white'
                            : 'bg-white text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Current Page (Mobile) */}
                <div className="md:hidden px-4 py-2 bg-[#854836] text-white font-bold border-4 border-black">
                  {pagination.page} / {pagination.totalPages}
                </div>

                {/* Next */}
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage}
                  className={`px-4 py-2 font-bold uppercase text-sm border-4 border-black transition-all ${
                    pagination.hasNextPage
                      ? 'bg-white text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-[#F7F7F7] text-gray-400 cursor-not-allowed'
                  }`}
                >
                  SIGUIENTE
                </button>
              </div>
            )}
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
                <li>
                  <Link to="/" className="hover:text-[#FFB22C] transition-colors uppercase font-bold">
                    PÁGINA PRINCIPAL
                  </Link>
                </li>
                {categories.slice(0, 6).map((cat) => (
                  <li key={cat.id}>
                    <Link
                      to="/categoria/$slug"
                      params={{ slug: cat.slug }}
                      className="hover:text-[#FFB22C] transition-colors uppercase font-bold"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletters */}
            <div>
              <h4 className="font-black uppercase text-[#FFB22C] mb-3 tracking-wider">BOLETINES</h4>
              <ul className="space-y-2 text-sm">
                {[
                  { label: 'LA MAÑANA', slug: 'manana' },
                  { label: 'LA TARDE', slug: 'tarde' },
                  { label: 'RESUMEN SEMANAL', slug: 'semanal' },
                  { label: 'DEPORTES HOY', slug: 'deportes' },
                ].map((item) => (
                  <li key={item.slug}>
                    <Link
                      to={`/boletin/${item.slug}` as '/boletin/manana'}
                      className="hover:text-[#FFB22C] transition-colors uppercase font-bold"
                    >
                      {item.label}
                    </Link>
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
