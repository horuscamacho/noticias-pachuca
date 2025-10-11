import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { getCategories, searchNoticias } from '../features/public-content';
import { NoticiaCard } from '../components/shared/NoticiaCard';
import { Breadcrumbs } from '../components/shared/Breadcrumbs';
import { Pagination } from '../components/shared/Pagination';
import { OptimizedImage } from '../components/OptimizedImage';
import { UniversalHeader } from '../components/shared/UniversalHeader';
import { UniversalFooter } from '../components/shared/UniversalFooter';

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

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <UniversalHeader categories={categories} />

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

      <UniversalFooter />
    </div>
  );
}
