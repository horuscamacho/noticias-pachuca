import { createFileRoute, Link } from '@tanstack/react-router';
import { getBoletinContent, getCategories } from '../features/public-content/server';
import { Breadcrumbs } from '../components/shared/Breadcrumbs';
import { UniversalHeader } from '../components/shared/UniversalHeader';
import { UniversalFooter } from '../components/shared/UniversalFooter';
import { PachucaMural } from '../components/shared/PachucaMural';

export const Route = createFileRoute('/boletin/deportes')({
  loader: async () => {
    try {
      const [content, categoriesResponse] = await Promise.all([
        getBoletinContent({ data: { tipo: 'deportes' } }),
        getCategories(),
      ]);
      return {
        content,
        error: null,
        categories: categoriesResponse.success ? categoriesResponse.data : [],
      };
    } catch (error) {
      return {
        content: null,
        error: error instanceof Error ? error.message : 'Error al cargar el boletín',
        categories: [],
      };
    }
  },
  component: BoletinDeportesPage,
  head: () => ({
    meta: [
      { title: 'Boletín de Deportes - Noticias Pachuca' },
      { name: 'description', content: 'Las noticias deportivas más importantes de Pachuca y región.' },
    ],
  }),
});

// Helper: Obtener color de background para noticias sin imagen
const getBackgroundColor = (index: number): string => {
  const colors = ['#FFB22C', '#00FF00', '#FF0000', '#FFB22C', '#00FF00'];
  return colors[index % colors.length];
};

// Decoraciones deportivas
const SportsDecoration = ({ type }: { type: number }) => {
  const decorations = [
    <div key="1" className="w-32 h-32 rounded-full border-8 border-black bg-white"></div>,
    <div key="2" className="flex gap-3"><div className="w-20 h-20 border-4 border-black bg-white transform rotate-45"></div><div className="w-20 h-20 border-4 border-black bg-white transform rotate-45"></div></div>,
    <div key="3" className="w-0 h-0 border-l-[64px] border-r-[64px] border-t-[110px] border-l-transparent border-r-transparent border-t-white"></div>,
    <div key="4" className="w-24 h-24 border-4 border-black bg-white"></div>,
    <div key="5" className="flex flex-col gap-4"><div className="w-24 h-4 border-4 border-black bg-white"></div><div className="w-24 h-4 border-4 border-black bg-white"></div></div>,
  ];
  return decorations[type % decorations.length];
};

function BoletinDeportesPage() {
  const { content, error, categories } = Route.useLoaderData();
  const now = new Date();
  const fecha = now.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Universal Header */}
      <UniversalHeader categories={categories} />

      {/* Hero Section - Amarillo (#FFB22C) */}
      <div className="border-b-8 border-black bg-[#FFB22C] py-12 px-6 relative overflow-hidden">
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#00FF00] transform rotate-45"></div>
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs
            items={[
              { label: 'Inicio', href: '/' },
              { label: 'Boletín de Deportes' },
            ]}
          />

          <div className="flex items-center justify-between flex-wrap gap-4 mt-6">
            <div>
              <h1 className="font-mono text-4xl md:text-5xl font-bold uppercase tracking-tight">
                BOLETÍN DE DEPORTES
              </h1>
              <p className="font-mono text-lg mt-2 uppercase">
                {fecha}
              </p>
            </div>

            <Link
              to="/"
              className="px-6 py-3 bg-black text-white border-4 border-black font-mono font-bold hover:bg-[#FF0000] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
            >
              Inicio
            </Link>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {error ? (
          // Error State - No hay contenido deportivo disponible
          <div className="border-4 border-black bg-[#F7F7F7] p-12 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="w-24 h-24 border-4 border-black bg-white mx-auto mb-6 flex items-center justify-center">
                <span className="text-4xl">⚽</span>
              </div>

              <h2 className="font-mono text-2xl md:text-3xl font-bold mb-6 uppercase">
                SIN CONTENIDO DEPORTIVO HOY
              </h2>

              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                Por el momento no hay suficientes noticias deportivas para generar el boletín.
                Vuelve pronto para estar al día con los Tuzos del Pachuca y más deportes de la región.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Link
                  to="/categoria/deportes"
                  className="px-6 py-3 bg-white text-black border-4 border-black font-mono font-bold hover:bg-black hover:text-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
                >
                  Ver Categoría Deportes
                </Link>

                <Link
                  to="/"
                  className="px-6 py-3 bg-black text-white border-4 border-black font-mono font-bold hover:bg-[#FFB22C] hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
                >
                  Ir al Inicio
                </Link>
              </div>

              <div className="border-t-4 border-black pt-6 mt-6">
                <p className="text-sm text-gray-600">
                  Puedes suscribirte al boletín de deportes para recibir un email cuando haya contenido disponible.
                </p>
              </div>
            </div>
          </div>
        ) : content ? (
          <>
            {/* Intro */}
            <div className="border-4 border-black bg-white p-8 mb-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-xl leading-relaxed">
                <span className="font-bold">Todo sobre los Tuzos y más.</span> Las{' '}
                <span className="font-mono font-bold text-2xl">{content.totalNoticias} noticias deportivas</span>{' '}
                más importantes de Pachuca y la región.
              </p>
            </div>

            {/* GRID DEPORTIVO - Layout: [1 full width]
                                               [2][3][4][5] */}
            <div className="space-y-6 mb-12">
              {/* Noticia #1 - Featured Full Width */}
              {content.noticias.length > 0 && (
                <article className="relative border-4 border-black bg-white group hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <div className="absolute top-6 left-6 z-10">
                    <div className="px-6 py-3 border-4 border-black bg-[#FFB22C] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <span className="font-mono text-lg font-bold uppercase">
                        NOTICIA DESTACADA
                      </span>
                    </div>
                  </div>

                  {/* Imagen o Background */}
                  {content.noticias[0].featuredImage ? (
                    <div className="aspect-[21/9] bg-gray-100 relative">
                      <img
                        src={content.noticias[0].featuredImage}
                        alt={content.noticias[0].title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

                      {/* Content superpuesto */}
                      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                        <div className="max-w-4xl">
                          <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className="px-4 py-2 border-2 border-white bg-white/90 font-mono text-xs font-bold uppercase">
                              {content.noticias[0].category.name}
                            </span>
                            {content.noticias[0].views && (
                              <span className="px-4 py-2 bg-black/80 text-white font-mono text-sm font-bold">
                                {content.noticias[0].views.toLocaleString()} vistas
                              </span>
                            )}
                          </div>

                          <Link to={`/noticia/${content.noticias[0].slug}`} className="block">
                            <h2 className="font-mono text-3xl md:text-5xl font-bold mb-4 text-white group-hover:underline uppercase line-clamp-2">
                              {content.noticias[0].title}
                            </h2>
                            {content.noticias[0].summary && (
                              <p className="text-lg md:text-xl text-white/90 leading-relaxed mb-4 line-clamp-2">
                                {content.noticias[0].summary}
                              </p>
                            )}
                            <div className="inline-flex items-center gap-2 px-6 py-3 bg-[#FFB22C] text-black border-4 border-black font-mono font-bold text-sm uppercase group-hover:translate-x-2 transition-transform">
                              <span>LEER COMPLETA</span>
                              <span className="text-xl">→</span>
                            </div>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <PachucaMural className="aspect-[21/9]" />

                      <div className="p-8 md:p-12">
                        <div className="flex flex-wrap items-center gap-3 mb-6">
                          <span className="px-4 py-2 border-2 border-black bg-[#F7F7F7] font-mono text-xs font-bold uppercase">
                            {content.noticias[0].category.name}
                          </span>
                          {content.noticias[0].views && (
                            <span className="px-4 py-2 border-2 border-black bg-white font-mono text-sm font-bold">
                              {content.noticias[0].views.toLocaleString()} vistas
                            </span>
                          )}
                        </div>

                        <Link to={`/noticia/${content.noticias[0].slug}`} className="block">
                          <h2 className="font-mono text-3xl md:text-4xl font-bold mb-6 group-hover:underline uppercase">
                            {content.noticias[0].title}
                          </h2>
                          {content.noticias[0].summary && (
                            <p className="text-xl text-gray-700 leading-relaxed mb-6">
                              {content.noticias[0].summary}
                            </p>
                          )}
                          <div className="inline-flex items-center gap-2 font-mono font-bold text-base uppercase group-hover:translate-x-2 transition-transform">
                            <span>LEER COMPLETA</span>
                            <span className="text-xl">→</span>
                          </div>
                        </Link>
                      </div>
                    </>
                  )}
                </article>
              )}

              {/* Resto de Noticias (2-5) - Grid 4 columnas */}
              {content.noticias.length > 1 && (
                <div>
                  <h2 className="font-mono text-2xl md:text-3xl font-bold mb-6 uppercase border-b-4 border-black pb-4">
                    MÁS NOTICIAS DEPORTIVAS
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {content.noticias.slice(1).map((noticia, index) => (
                      <article
                        key={noticia.id}
                        className="relative border-4 border-black bg-white group hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all"
                      >
                        {/* Badge Número */}
                        <div className="absolute top-4 left-4 w-10 h-10 bg-black border-4 border-black flex items-center justify-center z-10 shadow-[4px_4px_0px_0px_rgba(255,178,44,1)]">
                          <span className="font-mono text-lg font-bold text-white">{index + 2}</span>
                        </div>

                        {/* Imagen o Background */}
                        {noticia.featuredImage ? (
                          <div className="aspect-square bg-gray-100 relative">
                            <img
                              src={noticia.featuredImage}
                              alt={noticia.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                          </div>
                        ) : (
                          <PachucaMural className="aspect-square" />
                        )}

                        {/* Content */}
                        <div className="p-5">
                          <div className="mb-3">
                            <span className="px-3 py-1 border-2 border-black bg-[#F7F7F7] font-mono text-xs font-bold uppercase">
                              {noticia.category.name}
                            </span>
                          </div>

                          <Link to={`/noticia/${noticia.slug}`} className="block">
                            <h3 className="font-mono text-base font-bold uppercase mb-3 group-hover:underline line-clamp-3">
                              {noticia.title}
                            </h3>
                            <div className="inline-flex items-center gap-2 font-mono font-bold text-xs uppercase group-hover:translate-x-2 transition-transform">
                              <span>LEER</span>
                              <span>→</span>
                            </div>
                          </Link>
                        </div>

                        {/* Decoración esquina - Removida para evitar overflow */}
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CTA Suscripción */}
            <div className="border-8 border-black bg-[#854836] text-white p-12 text-center relative shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <div className="absolute -top-2 -left-2 w-8 h-8 bg-[#FFB22C] transform rotate-45"></div>
              <h3 className="font-mono text-3xl md:text-4xl font-bold mb-6 uppercase">
                ¿QUIERES RECIBIRLO POR EMAIL?
              </h3>
              <p className="text-xl mb-8 max-w-2xl mx-auto">
                Suscríbete al boletín de deportes y recibe las noticias más importantes
                de los Tuzos del Pachuca directo en tu email.
              </p>
              <Link
                to="/#suscribirse"
                className="inline-block px-8 py-4 bg-[#FFB22C] text-black border-4 border-black font-mono font-bold text-lg hover:bg-[#FF0000] hover:text-white hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
              >
                SUSCRIBIRME AHORA
              </Link>
              <div className="absolute -bottom-2 -right-2 w-0 h-0 border-l-[16px] border-r-[16px] border-b-[16px] border-l-transparent border-r-transparent border-b-[#FFB22C]"></div>
            </div>

            {/* Footer Info */}
            <div className="mt-12 border-t-4 border-black pt-8 text-center text-gray-600">
              <p className="font-mono text-sm">
                Este boletín se genera automáticamente cuando hay suficientes noticias deportivas disponibles.
              </p>
            </div>
          </>
        ) : null}
      </div>

      {/* Universal Footer */}
      <UniversalFooter />
    </div>
  );
}
