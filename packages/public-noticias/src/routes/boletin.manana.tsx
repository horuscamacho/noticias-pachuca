import { createFileRoute, Link } from '@tanstack/react-router';
import { getBoletinContent, getCategories } from '../features/public-content/server';
import { Breadcrumbs } from '../components/shared/Breadcrumbs';
import { UniversalHeader } from '../components/shared/UniversalHeader';
import { UniversalFooter } from '../components/shared/UniversalFooter';
import { PachucaMural } from '../components/shared/PachucaMural';

export const Route = createFileRoute('/boletin/manana')({
  loader: async () => {
    try {
      const [content, categoriesResponse] = await Promise.all([
        getBoletinContent({ data: { tipo: 'manana' } }),
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
  component: BoletinMananaPage,
  head: () => ({
    meta: [
      { title: 'Boletín de la Mañana - Noticias Pachuca' },
      {
        name: 'description',
        content: 'Las 5 noticias más importantes del día para comenzar tu mañana informado en Pachuca.',
      },
    ],
  }),
});

// Helper: Obtener color de background para noticias sin imagen
const getBackgroundColor = (index: number): string => {
  const colors = ['#FFB22C', '#854836', '#FF0000', '#FFB22C', '#854836'];
  return colors[index % colors.length];
};

// Helper: Obtener decoración geométrica
const GeometricDecoration = ({ type }: { type: number }) => {
  const decorations = [
    <div key="1" className="w-32 h-32 border-4 border-black bg-white transform rotate-45"></div>,
    <div key="2" className="w-0 h-0 border-l-[64px] border-r-[64px] border-b-[110px] border-l-transparent border-r-transparent border-b-white"></div>,
    <div key="3" className="flex gap-4"><div className="w-16 h-16 border-4 border-black bg-white"></div><div className="w-16 h-16 border-4 border-black bg-white"></div></div>,
  ];
  return decorations[type % decorations.length];
};

function BoletinMananaPage() {
  const { content, error, categories } = Route.useLoaderData();
  const now = new Date();
  const fecha = now.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Universal Header */}
      <UniversalHeader categories={categories} />

      {/* Hero Section - Amarillo (#FFB22C) */}
      <div className="border-b-8 border-black bg-[#FFB22C] py-12 px-6 relative overflow-hidden">
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#FF0000] transform rotate-45"></div>
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs
            items={[{ label: 'Inicio', href: '/' }, { label: 'Boletín de la Mañana' }]}
          />

          <div className="flex items-center justify-between flex-wrap gap-4 mt-6">
            <div>
              <h1 className="font-mono text-4xl md:text-5xl font-bold uppercase tracking-tight text-black">
                BOLETÍN DE LA MAÑANA
              </h1>
              <p className="font-mono text-lg mt-2 uppercase text-black">
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
        <div className="absolute -bottom-2 -left-2 w-0 h-0 border-l-[16px] border-r-[16px] border-b-[16px] border-l-transparent border-r-transparent border-b-black"></div>
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
                <span className="font-bold">Buenos días, Pachuca.</span> Aquí están las{' '}
                <span className="font-mono font-bold text-2xl">{content.totalNoticias} noticias más importantes</span>{' '}
                para comenzar tu día informado.
              </p>
            </div>

            {/* GRID MOSAICO - Layout: [1(grande)][2][3]
                                            [1(grande)][4][5] */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 auto-rows-fr">
              {content.noticias.map((noticia, index) => {
                const isFirst = index === 0;

                return (
                  <article
                    key={noticia.id}
                    className={`
                      relative border-4 border-black bg-white group
                      hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all
                      ${isFirst ? 'md:row-span-2 md:col-span-1' : ''}
                    `}
                  >
                    {/* Badge Número */}
                    <div className="absolute top-4 left-4 w-12 h-12 bg-black border-4 border-black flex items-center justify-center z-10 shadow-[4px_4px_0px_0px_rgba(255,178,44,1)]">
                      <span className="font-mono text-2xl font-bold text-white">{index + 1}</span>
                    </div>

                    {/* Imagen o Background Color con Decoración */}
                    {noticia.featuredImage ? (
                      <div className={`${isFirst ? 'aspect-[4/3]' : 'aspect-video'} bg-gray-100 relative`}>
                        <img
                          src={noticia.featuredImage}
                          alt={noticia.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Gradient overlay para legibilidad */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                      </div>
                    ) : (
                      <PachucaMural className={`${isFirst ? 'aspect-[4/3]' : 'aspect-video'}`} />
                    )}

                    {/* Content */}
                    <div className={`p-6 ${isFirst ? 'md:p-8' : ''}`}>
                      {/* Category Badge */}
                      <div className="mb-4">
                        <span className="px-3 py-1 border-2 border-black bg-[#F7F7F7] font-mono text-xs font-bold uppercase inline-block">
                          {noticia.category.name}
                        </span>
                      </div>

                      <Link to={`/noticia/${noticia.slug}`} className="block">
                        <h3 className={`font-mono font-bold uppercase line-clamp-3 mb-3 group-hover:underline ${isFirst ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl'}`}>
                          {noticia.title}
                        </h3>

                        {noticia.summary && (
                          <p className={`text-sm text-gray-700 mb-4 ${isFirst ? 'line-clamp-4 md:text-base' : 'line-clamp-2'}`}>
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
                  </article>
                );
              })}
            </div>

            {/* CTA Suscripción */}
            <div className="border-8 border-black bg-[#854836] text-white p-12 text-center relative shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <div className="absolute -top-2 -left-2 w-8 h-8 bg-[#FFB22C] transform rotate-45"></div>
              <h3 className="font-mono text-3xl md:text-4xl font-bold mb-6 uppercase">
                ¿QUIERES RECIBIRLO POR EMAIL?
              </h3>
              <p className="text-xl mb-8 max-w-2xl mx-auto">
                Recibe este boletín cada mañana directamente en tu bandeja de entrada.
                Sin spam, sin anuncios molestos.
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
                Este boletín se genera automáticamente con las noticias más recientes de las últimas 24 horas.
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
