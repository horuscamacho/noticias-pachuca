import { createFileRoute, Link } from '@tanstack/react-router';
import { Breadcrumbs } from '../components/shared/Breadcrumbs';

export const Route = createFileRoute('/publicidad')({
  component: PublicidadPage,
  head: () => ({
    meta: [
      { title: 'Publicidad - Próximamente - Noticias Pachuca' },
      { name: 'description', content: 'Espacio publicitario en construcción. Próximamente podrás anunciarte con nosotros.' },
    ],
  }),
});

function PublicidadPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b-8 border-black bg-[#FFB22C] py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs
            items={[
              { label: 'Inicio', href: '/' },
              { label: 'Publicidad' },
            ]}
          />

          <h1 className="font-mono text-5xl md:text-6xl font-bold mb-4 uppercase mt-6">
            PUBLICIDAD
          </h1>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="border-8 border-black p-12 md:p-20 text-center relative bg-white">
          {/* Decoraciones brutalist */}
          <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#FF0000] transform rotate-45"></div>
          <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-[#854836] transform rotate-45"></div>

          {/* Título */}
          <h2 className="font-mono text-4xl md:text-5xl font-bold mb-6 uppercase">
            PRÓXIMAMENTE
          </h2>

          {/* Descripción */}
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Estamos preparando un espacio publicitario para que tu negocio llegue
            a miles de lectores en Pachuca y la región.
          </p>

          {/* Información de contacto */}
          <div className="border-4 border-black bg-[#F7F7F7] p-8 mb-8 max-w-2xl mx-auto">
            <h3 className="font-mono text-xl font-bold mb-4 uppercase">
              ¿Interesado en anunciarte?
            </h3>
            <p className="text-base text-gray-700 mb-4">
              Contáctanos para ser de los primeros en conocer nuestros paquetes
              publicitarios y tarifas especiales de lanzamiento.
            </p>
            <div className="space-y-2 text-left">
              <p className="font-mono text-sm">
                <span className="font-bold">EMAIL:</span> publicidad@noticiaspachuca.com
              </p>
              <p className="font-mono text-sm">
                <span className="font-bold">TELÉFONO:</span> Próximamente
              </p>
            </div>
          </div>

          {/* Características próximamente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-3xl mx-auto">
            <div className="border-4 border-black p-6 bg-gray-50 text-left">
              <h3 className="font-mono font-bold text-lg mb-2 uppercase">
                Banners Display
              </h3>
              <p className="text-sm text-gray-600">
                Espacios publicitarios en páginas principales y de categorías
              </p>
            </div>

            <div className="border-4 border-black p-6 bg-gray-50 text-left">
              <h3 className="font-mono font-bold text-lg mb-2 uppercase">
                Contenido Patrocinado
              </h3>
              <p className="text-sm text-gray-600">
                Artículos y reportajes especiales para tu marca
              </p>
            </div>

            <div className="border-4 border-black p-6 bg-gray-50 text-left">
              <h3 className="font-mono font-bold text-lg mb-2 uppercase">
                Newsletter Ads
              </h3>
              <p className="text-sm text-gray-600">
                Publicidad en nuestros boletines informativos
              </p>
            </div>

            <div className="border-4 border-black p-6 bg-gray-50 text-left">
              <h3 className="font-mono font-bold text-lg mb-2 uppercase">
                Paquetes Especiales
              </h3>
              <p className="text-sm text-gray-600">
                Campañas personalizadas según tus necesidades
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-4">
            <Link
              to="/"
              className="inline-block px-8 py-4 bg-[#FF0000] text-white border-4 border-black font-mono font-bold text-lg hover:bg-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
            >
              Volver al Inicio
            </Link>

            <p className="text-sm text-gray-500">
              ¿Tienes preguntas?{' '}
              <Link
                to="/contacto"
                className="text-[#FF0000] font-bold hover:underline"
              >
                Contáctanos
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
