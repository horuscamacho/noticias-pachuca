import { createFileRoute, Link } from '@tanstack/react-router';
import { Breadcrumbs } from '../components/shared/Breadcrumbs';

export const Route = createFileRoute('/suscripciones')({
  component: SuscripcionesPage,
  head: () => ({
    meta: [
      { title: 'Suscripciones Premium - Próximamente - Noticias Pachuca' },
      { name: 'description', content: 'Suscripciones premium en construcción. Próximamente podrás acceder a contenido exclusivo.' },
    ],
  }),
});

function SuscripcionesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b-8 border-black bg-[#854836] text-white py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs
            items={[
              { label: 'Inicio', href: '/' },
              { label: 'Suscripciones' },
            ]}
          />

          <h1 className="font-mono text-5xl md:text-6xl font-bold mb-4 uppercase mt-6">
            SUSCRIPCIONES
          </h1>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="border-8 border-black p-12 md:p-20 text-center relative bg-white">
          {/* Decoraciones brutalist */}
          <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#FFB22C] transform rotate-45"></div>
          <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-[#FF0000] transform rotate-45"></div>

          {/* Título */}
          <h2 className="font-mono text-4xl md:text-5xl font-bold mb-6 uppercase">
            PRÓXIMAMENTE
          </h2>

          {/* Descripción */}
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Estamos preparando planes de suscripción premium con contenido
            exclusivo, análisis profundos y beneficios especiales.
          </p>

          {/* Nota sobre boletines gratuitos */}
          <div className="border-4 border-[#FFB22C] bg-[#FFB22C] bg-opacity-10 p-6 mb-8 max-w-2xl mx-auto">
            <h3 className="font-mono text-lg font-bold mb-2 uppercase">
              Boletines Gratuitos Disponibles
            </h3>
            <p className="text-base text-gray-700 mb-4">
              Mientras tanto, puedes suscribirte gratis a nuestros boletines informativos
              y recibir las noticias más importantes directamente en tu email.
            </p>
            <Link
              to="/#suscribirse"
              className="inline-block px-6 py-3 bg-black text-white border-4 border-black font-mono font-bold hover:bg-[#854836] transition-all uppercase text-sm"
            >
              Suscribirme Gratis
            </Link>
          </div>

          {/* Características próximamente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-3xl mx-auto">
            <div className="border-4 border-black p-6 bg-gray-50 text-left">
              <h3 className="font-mono font-bold text-lg mb-2 uppercase">
                Reportajes Exclusivos
              </h3>
              <p className="text-sm text-gray-600">
                Investigaciones a profundidad y análisis detallados
              </p>
            </div>

            <div className="border-4 border-black p-6 bg-gray-50 text-left">
              <h3 className="font-mono font-bold text-lg mb-2 uppercase">
                Sin Publicidad
              </h3>
              <p className="text-sm text-gray-600">
                Experiencia de lectura sin interrupciones
              </p>
            </div>

            <div className="border-4 border-black p-6 bg-gray-50 text-left">
              <h3 className="font-mono font-bold text-lg mb-2 uppercase">
                Acceso Prioritario
              </h3>
              <p className="text-sm text-gray-600">
                Lee las noticias antes que nadie
              </p>
            </div>

            <div className="border-4 border-black p-6 bg-gray-50 text-left">
              <h3 className="font-mono font-bold text-lg mb-2 uppercase">
                Contenido Multimedia
              </h3>
              <p className="text-sm text-gray-600">
                Podcasts exclusivos y videos especiales
              </p>
            </div>

            <div className="border-4 border-black p-6 bg-gray-50 text-left">
              <h3 className="font-mono font-bold text-lg mb-2 uppercase">
                Comunidad Premium
              </h3>
              <p className="text-sm text-gray-600">
                Acceso a foros y eventos exclusivos
              </p>
            </div>

            <div className="border-4 border-black p-6 bg-gray-50 text-left">
              <h3 className="font-mono font-bold text-lg mb-2 uppercase">
                Archivo Completo
              </h3>
              <p className="text-sm text-gray-600">
                Acceso ilimitado a todo nuestro contenido histórico
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-4">
            <Link
              to="/"
              className="inline-block px-8 py-4 bg-[#854836] text-white border-4 border-black font-mono font-bold text-lg hover:bg-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
            >
              Volver al Inicio
            </Link>

            <p className="text-sm text-gray-500">
              ¿Quieres que te notifiquemos cuando esté listo?{' '}
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
