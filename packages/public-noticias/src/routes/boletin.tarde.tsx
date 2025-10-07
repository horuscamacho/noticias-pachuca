import { createFileRoute, Link } from '@tanstack/react-router';
import { getBoletinContent, getCategories } from '../features/public-content/server';
import { Breadcrumbs } from '../components/shared/Breadcrumbs';
import { UniversalHeader } from '../components/shared/UniversalHeader';
import { UniversalFooter } from '../components/shared/UniversalFooter';
import { PachucaMural } from '../components/shared/PachucaMural';

export const Route = createFileRoute('/boletin/tarde')({
  loader: async () => {
    try {
      const [content, categoriesResponse] = await Promise.all([
        getBoletinContent({ data: { tipo: 'tarde' } }),
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
  component: BoletinTardePage,
  head: () => ({
    meta: [
      { title: 'Boletín de la Tarde - Noticias Pachuca' },
      { name: 'description', content: 'Las 3 noticias más leídas del día en Pachuca. Tu resumen vespertino.' },
    ],
  }),
});

// Helper: Obtener color de background para noticias sin imagen
const getBackgroundColor = (index: number): string => {
  const colors = ['#FF0000', '#FFB22C', '#854836'];
  return colors[index % colors.length];
};

function BoletinTardePage() {
  const { content, error, categories } = Route.useLoaderData();
  const now = new Date();
  const fecha = now.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const hora = now.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Universal Header */}
      <UniversalHeader categories={categories} />

      {/* Hero Section - Rojo (#FF0000) */}
      <div className="border-b-8 border-black bg-[#FF0000] text-white py-12 px-6 relative overflow-hidden">
        <div className="absolute top-2 right-2 w-8 h-8 bg-[#FFB22C] transform rotate-45"></div>
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs
            items={[
              { label: 'Inicio', href: '/' },
              { label: 'Boletín de la Tarde' },
            ]}
          />

          <div className="flex items-center justify-between flex-wrap gap-4 mt-6">
            <div>
              <h1 className="font-mono text-4xl md:text-5xl font-bold uppercase tracking-tight">
                BOLETÍN DE LA TARDE
              </h1>
              <p className="font-mono text-lg mt-2 uppercase">
                {fecha} · {hora}
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
        <div className="absolute bottom-2 left-2 w-0 h-0 border-l-[16px] border-r-[16px] border-b-[16px] border-l-transparent border-r-transparent border-b-white"></div>
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
        ) : content ? (
          <>
            {/* Intro */}
            <div className="border-4 border-black bg-white p-8 mb-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-xl leading-relaxed">
                <span className="font-bold">Estas son las {content.totalNoticias} noticias más leídas</span>{' '}
                por los pachucenses hoy. Lo que está marcando la conversación.
              </p>
            </div>

            {/* GRID MOSAICO - Layout: [1 full width]
                                              [2][3] */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {content.noticias.map((noticia, index) => {
                const isFirst = index === 0;

                return (
                  <article
                    key={noticia.id}
                    className={`
                      relative border-4 border-black bg-white group
                      hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all
                      ${isFirst ? 'md:col-span-2' : ''}
                    `}
                  >
                    {isFirst ? (
                      <>
                        {/* NOTICIA #1 - Featured Full Width */}
                        <div className="absolute top-6 left-6 z-10">
                          <div className="px-6 py-3 border-4 border-black bg-[#FF0000] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <span className="font-mono text-lg font-bold uppercase">
                              MÁS LEÍDA HOY
                            </span>
                          </div>
                        </div>

                        <div className="md:flex">
                          {/* Imagen o Background */}
                          {noticia.featuredImage ? (
                            <div className="md:w-3/5 aspect-[16/10] bg-gray-100 relative">
                              <img
                                src={noticia.featuredImage}
                                alt={noticia.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                            </div>
                          ) : (
                            <PachucaMural className="md:w-3/5 aspect-[16/10]" />
                          )}

                          {/* Content */}
                          <div className="md:w-2/5 p-8 flex flex-col justify-center">
                            <div className="flex flex-wrap items-center gap-3 mb-6">
                              <span className="px-4 py-2 border-2 border-black bg-[#F7F7F7] font-mono text-xs font-bold uppercase">
                                {noticia.category.name}
                              </span>
                              {noticia.views && (
                                <span className="px-4 py-2 border-2 border-black bg-white font-mono text-sm font-bold">
                                  {noticia.views.toLocaleString()} vistas
                                </span>
                              )}
                            </div>

                            <Link to={`/noticia/${noticia.slug}`} className="block">
                              <h2 className="font-mono text-2xl md:text-3xl font-bold mb-6 group-hover:underline uppercase line-clamp-3">
                                {noticia.title}
                              </h2>
                              {noticia.summary && (
                                <p className="text-base text-gray-700 leading-relaxed mb-6 line-clamp-4">
                                  {noticia.summary}
                                </p>
                              )}
                              <div className="inline-flex items-center gap-2 font-mono font-bold text-sm uppercase group-hover:translate-x-2 transition-transform">
                                <span>LEER COMPLETA</span>
                                <span className="text-xl">→</span>
                              </div>
                            </Link>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* NOTICIAS #2 y #3 - Grid 2 columnas */}
                        <div className="absolute top-4 left-4 w-12 h-12 bg-black border-4 border-black flex items-center justify-center z-10 shadow-[4px_4px_0px_0px_rgba(255,178,44,1)]">
                          <span className="font-mono text-2xl font-bold text-white">{index + 1}</span>
                        </div>

                        {/* Imagen o Background */}
                        {noticia.featuredImage ? (
                          <div className="aspect-video bg-gray-100 relative">
                            <img
                              src={noticia.featuredImage}
                              alt={noticia.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                          </div>
                        ) : (
                          <PachucaMural className="aspect-video" />
                        )}

                        {/* Content */}
                        <div className="p-6">
                          <div className="flex flex-wrap items-center gap-2 mb-4">
                            <span className="px-3 py-1 border-2 border-black bg-[#F7F7F7] font-mono text-xs font-bold uppercase">
                              {noticia.category.name}
                            </span>
                            {noticia.views && (
                              <span className="font-mono text-xs text-gray-600">
                                {noticia.views.toLocaleString()} vistas
                              </span>
                            )}
                          </div>

                          <Link to={`/noticia/${noticia.slug}`} className="block">
                            <h3 className="font-mono text-lg md:text-xl font-bold mb-3 group-hover:underline uppercase line-clamp-2">
                              {noticia.title}
                            </h3>
                            {noticia.summary && (
                              <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                                {noticia.summary}
                              </p>
                            )}
                            <div className="inline-flex items-center gap-2 font-mono font-bold text-xs uppercase group-hover:translate-x-2 transition-transform">
                              <span>LEER MÁS</span>
                              <span>→</span>
                            </div>
                          </Link>
                        </div>

                        {/* Decoración esquina - Removida para evitar overflow */}
                      </>
                    )}
                  </article>
                );
              })}
            </div>

            {/* CTA Suscripción */}
            <div className="border-8 border-black bg-[#854836] text-white p-12 text-center relative shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <div className="absolute top-2 left-2 w-8 h-8 bg-[#FFB22C] transform rotate-45"></div>
              <h3 className="font-mono text-3xl md:text-4xl font-bold mb-6 uppercase">
                ¿QUIERES RECIBIRLO POR EMAIL?
              </h3>
              <p className="text-xl mb-8 max-w-2xl mx-auto">
                Recibe este boletín cada tarde con las noticias más importantes del día.
                Directo a tu bandeja de entrada.
              </p>
              <Link
                to="/#suscribirse"
                className="inline-block px-8 py-4 bg-[#FFB22C] text-black border-4 border-black font-mono font-bold text-lg hover:bg-[#FF0000] hover:text-white hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
              >
                SUSCRIBIRME AHORA
              </Link>
              <div className="absolute bottom-2 right-2 w-0 h-0 border-l-[16px] border-r-[16px] border-b-[16px] border-l-transparent border-r-transparent border-b-[#FFB22C]"></div>
            </div>

            {/* Footer Info */}
            <div className="mt-12 border-t-4 border-black pt-8 text-center text-gray-600">
              <p className="font-mono text-sm">
                Este boletín se genera con las 3 noticias más leídas del día en tiempo real.
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
