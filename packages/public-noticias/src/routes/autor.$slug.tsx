import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { getCategories, getNoticiasByAuthor } from '../features/public-content';
import { NoticiaCard } from '../components/shared/NoticiaCard';
import { UniversalHeader } from '../components/shared/UniversalHeader';
import { UniversalFooter } from '../components/shared/UniversalFooter';
import { generateBreadcrumbSchema } from '../utils/generateBreadcrumbSchema';

export const Route = createFileRoute('/autor/$slug')({
  component: AutorPage,
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

    // Fetch noticias del autor
    const noticiasResponse = await getNoticiasByAuthor({
      data: {
        slug,
        page,
        limit: 20,
      },
    });

    if (noticiasResponse.data.length === 0 && page === 1) {
      throw new Error('Autor no encontrado');
    }

    // Extraer nombre del autor del slug
    const authorName = slug.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

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
      author: {
        slug,
        name: authorName,
        count: noticiasResponse.total,
      },
      categories: categoriesResponse.data,
    };
  },
  head: ({ loaderData }) => {
    const { author, pagination } = loaderData;

    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Inicio', url: 'https://noticiaspachuca.com' },
      { name: `Autor: ${author.name}`, url: `https://noticiaspachuca.com/autor/${author.slug}` }
    ]);

    // FASE 2: Person Schema para E-E-A-T
    const personSchema = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: author.name,
      url: `https://noticiaspachuca.com/autor/${author.slug}`,
      // TODO: Agregar cuando tengamos estos campos en el modelo de autor
      // image: author.photo || 'https://noticiaspachuca.com/default-author.jpg',
      // jobTitle: author.jobTitle || 'Reportero',
      // description: author.bio,
      worksFor: {
        '@type': 'Organization',
        name: 'Noticias Pachuca',
        url: 'https://noticiaspachuca.com'
      },
      // TODO: Agregar redes sociales cuando las tengamos en el modelo
      // sameAs: [
      //   author.twitter && `https://twitter.com/${author.twitter}`,
      //   author.linkedin && author.linkedin,
      //   author.facebook && author.facebook
      // ].filter(Boolean)
    };

    return {
      meta: [
        { title: `Autor: ${author.name} - Noticias Pachuca` },
        { name: 'description', content: `Todas las noticias escritas por ${author.name}. ${pagination.total} artículos publicados.` },
        { property: 'og:title', content: `Autor: ${author.name} - Noticias Pachuca` },
        { property: 'og:description', content: `${pagination.total} artículos escritos por ${author.name}` },
        { property: 'og:type', content: 'profile' },
        { property: 'og:url', content: `https://noticiaspachuca.com/autor/${author.slug}` },
        { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1' },
      ],
      links: [
        { rel: 'canonical', href: `https://noticiaspachuca.com/autor/${author.slug}` }
      ],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(breadcrumbSchema)
        },
        {
          type: 'application/ld+json',
          children: JSON.stringify(personSchema)
        }
      ]
    };
  },
});

function AutorPage() {
  const { noticias, pagination, author, categories } = Route.useLoaderData();
  const navigate = useNavigate({ from: Route.fullPath });

  const handlePageChange = (newPage: number) => {
    navigate({
      to: '/autor/$slug',
      params: { slug: author.slug },
      search: { page: newPage },
    });
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <UniversalHeader categories={categories} />

      {/* Author Header Banner */}
      <div className="bg-white border-b-4 border-black py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Breadcrumbs */}
          <div className="mb-4">
            <Link to="/" className="text-sm font-bold uppercase tracking-wider text-black hover:text-[#FF0000]">
              INICIO
            </Link>
            <span className="mx-2 text-black">/</span>
            <span className="text-sm font-bold uppercase tracking-wider text-[#854836]">
              AUTOR: {author.name}
            </span>
          </div>

          {/* Author Title with Color Bar */}
          <div className="relative">
            <div
              className="absolute left-0 top-0 w-2 h-full bg-[#854836]"
            ></div>
            <div className="pl-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-wider text-black mb-3">
                AUTOR: {author.name}
              </h1>
              <p className="text-lg md:text-xl text-black max-w-3xl leading-relaxed">
                Todas las noticias escritas por {author.name}
              </p>
              <div className="mt-4 inline-block bg-black text-white px-4 py-2 font-mono font-bold text-sm uppercase border-2 border-black">
                {pagination.total} {pagination.total === 1 ? 'NOTICIA' : 'NOTICIAS'} DE ESTE AUTOR
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
                Este autor aún no tiene contenido publicado.
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

      <UniversalFooter />
    </div>
  );
}
