import { createFileRoute, Link } from '@tanstack/react-router';
import { getBoletinContent, getCategories } from '../features/public-content/server';
import { Breadcrumbs } from '../components/shared/Breadcrumbs';
import { UniversalHeader } from '../components/shared/UniversalHeader';
import { UniversalFooter } from '../components/shared/UniversalFooter';
import { PachucaMural } from '../components/shared/PachucaMural';

export const Route = createFileRoute('/boletin/semanal')({
  loader: async () => {
    try {
      const [content, categoriesResponse] = await Promise.all([
        getBoletinContent({ data: { tipo: 'semanal' } }),
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
  component: BoletinSemanalPage,
  head: () => ({
    meta: [
      { title: 'Boletín Semanal - Noticias Pachuca' },
      { name: 'description', content: 'Las 10 noticias más importantes de la semana en Pachuca. Tu resumen semanal.' },
    ],
  }),
});

// Helper: Obtener color de background para noticias sin imagen
const getBackgroundColor = (index: number): string => {
  const colors = ['#FFB22C', '#854836', '#FF0000', '#FFB22C', '#854836', '#FF0000', '#FFB22C', '#854836', '#FF0000', '#FFB22C'];
  return colors[index % colors.length];
};

// Helper: Decoraciones variadas
const GeometricDecoration = ({ type }: { type: number }) => {
  const decorations = [
    <div key="1" className="w-32 h-32 border-4 border-black bg-white transform rotate-45"></div>,
    <div key="2" className="w-0 h-0 border-l-[64px] border-r-[64px] border-b-[110px] border-l-transparent border-r-transparent border-b-white"></div>,
    <div key="3" className="flex gap-3"><div className="w-16 h-16 border-4 border-black bg-white"></div><div className="w-16 h-16 border-4 border-black bg-white"></div></div>,
    <div key="4" className="w-24 h-24 border-4 border-black bg-white"></div>,
    <div key="5" className="flex flex-col gap-3"><div className="w-20 h-3 border-2 border-black bg-white"></div><div className="w-20 h-3 border-2 border-black bg-white"></div><div className="w-20 h-3 border-2 border-black bg-white"></div></div>,
  ];
  return decorations[type % decorations.length];
};

function BoletinSemanalPage() {
  const { content, error, categories } = Route.useLoaderData();
  const now = new Date();
  const semana = `Semana del ${new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })} al ${now.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  // Calcular estadísticas si hay contenido
  const stats = content ? {
    totalViews: content.noticias.reduce((sum, n) => sum + (n.views || 0), 0),
    avgViews: Math.round(content.noticias.reduce((sum, n) => sum + (n.views || 0), 0) / content.noticias.length),
    categories: [...new Set(content.noticias.map(n => n.category.name))].length,
  } : null;

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Universal Header */}
      <UniversalHeader categories={categories} />

      {/* Hero Section - Café (#854836) */}
      <div className="border-b-8 border-black bg-[#854836] text-white py-12 px-6 relative overflow-hidden">
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#FFB22C] transform rotate-45"></div>
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs
            items={[
              { label: 'Inicio', href: '/' },
              { label: 'Boletín Semanal' },
            ]}
          />

          <div className="flex items-center justify-between flex-wrap gap-4 mt-6">
            <div>
              <h1 className="font-mono text-4xl md:text-5xl font-bold uppercase tracking-tight">
                BOLETÍN SEMANAL
              </h1>
              <p className="font-mono text-lg mt-2 uppercase">
                {semana}
              </p>
            </div>

            <Link
              to="/"
              className="px-6 py-3 bg-white text-black border-4 border-black font-mono font-bold hover:bg-[#FFB22C] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
            >
              Inicio
            </Link>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {error ? (
          // Error State
          <div className="border-4 border-[#FF0000] bg-white p-12 text-center">
            <h2 className="font-mono text-2xl font-bold mb-4 uppercase">
              CONTENIDO NO DISPONIBLE
            </h2>
            <p className="text-lg text-gray-700 mb-8">{error}</p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-black text-white border-4 border-black font-mono font-bold hover:bg-[#FF0000] transition-all uppercase"
            >
              Volver al Inicio
            </Link>
          </div>
        ) : content && stats ? (
          <>
            {/* Intro */}
            <div className="border-4 border-black bg-white p-8 mb-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-xl leading-relaxed">
                <span className="font-bold">Resumen de la semana.</span> Las{' '}
                <span className="font-mono font-bold text-2xl">{content.totalNoticias} noticias más importantes</span>{' '}
                que marcaron la conversación en Pachuca.
              </p>
            </div>

            {/* Estadísticas de la Semana */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="border-4 border-black bg-white p-6 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all">
                <div className="font-mono text-5xl font-bold mb-2 text-[#854836]">
                  {content.totalNoticias}
                </div>
                <div className="font-mono text-sm uppercase text-gray-600 font-bold">
                  Noticias Destacadas
                </div>
              </div>

              <div className="border-4 border-black bg-white p-6 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all">
                <div className="font-mono text-5xl font-bold mb-2 text-[#FF0000]">
                  {stats.totalViews.toLocaleString()}
                </div>
                <div className="font-mono text-sm uppercase text-gray-600 font-bold">
                  Vistas Totales
                </div>
              </div>

              <div className="border-4 border-black bg-white p-6 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all">
                <div className="font-mono text-5xl font-bold mb-2 text-[#FFB22C]">
                  {stats.categories}
                </div>
                <div className="font-mono text-sm uppercase text-gray-600 font-bold">
                  Categorías Cubiertas
                </div>
              </div>
            </div>

            {/* GRID MOSAICO MASONRY - Layout variado para 10 noticias */}
            <div className="mb-12">
              <h2 className="font-mono text-3xl font-bold mb-8 uppercase border-b-4 border-black pb-4">
                TOP 10 DE LA SEMANA
              </h2>

              {/* Primera fila: [1 (grande)] [2] [3] */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {content.noticias.slice(0, 3).map((noticia, index) => {
                  const isFirst = index === 0;

                  return (
                    <article
                      key={noticia.id}
                      className={`
                        relative border-4 border-black bg-white group
                        hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all
                        ${isFirst ? 'md:row-span-2' : ''}
                      `}
                    >
                      {/* Badge Número */}
                      <div className={`absolute top-4 left-4 ${isFirst ? 'w-16 h-16' : 'w-12 h-12'} bg-black border-4 border-black flex items-center justify-center z-10 shadow-[4px_4px_0px_0px_rgba(255,178,44,1)]`}>
                        <span className={`font-mono ${isFirst ? 'text-3xl' : 'text-2xl'} font-bold text-white`}>{index + 1}</span>
                      </div>

                      {/* Imagen o Background */}
                      {noticia.featuredImage ? (
                        <div className={`${isFirst ? 'aspect-[4/3]' : 'aspect-video'} bg-gray-100 relative`}>
                          <img
                            src={noticia.featuredImage}
                            alt={noticia.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                        </div>
                      ) : (
                        <PachucaMural className={`${isFirst ? 'aspect-[4/3]' : 'aspect-video'}`} />
                      )}

                      {/* Content */}
                      <div className={`p-6 ${isFirst ? 'md:p-8' : ''}`}>
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="px-3 py-1 border-2 border-black bg-[#F7F7F7] font-mono text-xs font-bold uppercase">
                            {noticia.category.name}
                          </span>
                          {noticia.views && (
                            <span className="font-mono text-xs text-gray-600">
                              {noticia.views.toLocaleString()}
                            </span>
                          )}
                        </div>

                        <Link to={`/noticia/${noticia.slug}`} className="block">
                          <h3 className={`font-mono font-bold uppercase mb-3 group-hover:underline ${isFirst ? 'text-2xl md:text-3xl line-clamp-3' : 'text-lg line-clamp-2'}`}>
                            {noticia.title}
                          </h3>
                          {noticia.summary && (
                            <p className={`text-sm text-gray-700 mb-4 ${isFirst ? 'line-clamp-4' : 'line-clamp-2'}`}>
                              {noticia.summary}
                            </p>
                          )}
                          <div className="inline-flex items-center gap-2 font-mono font-bold text-xs uppercase group-hover:translate-x-2 transition-transform">
                            <span>LEER</span>
                            <span>→</span>
                          </div>
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Segunda fila: [4] [5] [6] */}
              {content.noticias.length > 3 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {content.noticias.slice(3, 6).map((noticia, index) => (
                    <article
                      key={noticia.id}
                      className="relative border-4 border-black bg-white group hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      <div className="absolute top-4 left-4 w-12 h-12 bg-black border-4 border-black flex items-center justify-center z-10 shadow-[4px_4px_0px_0px_rgba(255,178,44,1)]">
                        <span className="font-mono text-2xl font-bold text-white">{index + 4}</span>
                      </div>

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

                      <div className="p-6">
                        <div className="mb-3">
                          <span className="px-3 py-1 border-2 border-black bg-[#F7F7F7] font-mono text-xs font-bold uppercase">
                            {noticia.category.name}
                          </span>
                        </div>

                        <Link to={`/noticia/${noticia.slug}`} className="block">
                          <h3 className="font-mono text-lg font-bold uppercase mb-3 group-hover:underline line-clamp-2">
                            {noticia.title}
                          </h3>
                          <div className="inline-flex items-center gap-2 font-mono font-bold text-xs uppercase group-hover:translate-x-2 transition-transform">
                            <span>LEER</span>
                            <span>→</span>
                          </div>
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* Tercera fila: [7] [8] [9] [10] - Compactas */}
              {content.noticias.length > 6 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {content.noticias.slice(6, 10).map((noticia, index) => (
                    <article
                      key={noticia.id}
                      className="relative border-4 border-black bg-white group hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      <div className="absolute top-4 left-4 w-10 h-10 bg-black border-4 border-black flex items-center justify-center z-10 shadow-[4px_4px_0px_0px_rgba(255,178,44,1)]">
                        <span className="font-mono text-lg font-bold text-white">{index + 7}</span>
                      </div>

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

                      <div className="p-4">
                        <Link to={`/noticia/${noticia.slug}`} className="block">
                          <h3 className="font-mono text-sm font-bold uppercase mb-2 group-hover:underline line-clamp-3">
                            {noticia.title}
                          </h3>
                          <div className="inline-flex items-center gap-1 font-mono font-bold text-xs uppercase group-hover:translate-x-2 transition-transform">
                            <span>VER</span>
                            <span>→</span>
                          </div>
                        </Link>
                      </div>
                    </article>
                  ))}
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
                Recibe este resumen semanal cada domingo con lo más destacado de Pachuca.
                Una sola vez a la semana, sin spam.
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
                Este boletín se genera automáticamente con las 10 noticias más leídas de los últimos 7 días.
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
