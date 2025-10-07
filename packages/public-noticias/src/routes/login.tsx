import { createFileRoute, Link } from '@tanstack/react-router'
import { Breadcrumbs } from '../components/shared/Breadcrumbs'

export const Route = createFileRoute('/login')({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: 'Iniciar Sesión - Próximamente - Noticias Pachuca' },
      { name: 'description', content: 'Área de usuarios en construcción. Próximamente podrás acceder a tu cuenta.' },
    ],
  }),
})

function LoginPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b-8 border-black bg-[#FFB22C] py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs
            items={[
              { label: 'Inicio', href: '/' },
              { label: 'Iniciar Sesión' },
            ]}
          />

          <h1 className="font-mono text-5xl md:text-6xl font-bold mb-4 uppercase">
            🔐 ACCESO DE USUARIOS
          </h1>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="border-8 border-black p-12 md:p-20 text-center relative bg-white">
          {/* Decoraciones brutalist */}
          <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#FF0000] transform rotate-45"></div>
          <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-[#854836] transform rotate-45"></div>

          {/* Icono */}
          <div className="text-8xl mb-8">🚧</div>

          {/* Título */}
          <h2 className="font-mono text-4xl md:text-5xl font-bold mb-6 uppercase">
            PRÓXIMAMENTE
          </h2>

          {/* Descripción */}
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Esta sección está en construcción. Pronto podrás acceder a tu cuenta de usuario
            y disfrutar de funciones exclusivas.
          </p>

          {/* Características próximamente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-3xl mx-auto">
            <div className="border-4 border-black p-6 bg-gray-50">
              <div className="text-3xl mb-3">📰</div>
              <h3 className="font-mono font-bold text-lg mb-2 uppercase">
                Contenido Premium
              </h3>
              <p className="text-sm text-gray-600">
                Acceso a análisis exclusivos y reportajes especiales
              </p>
            </div>

            <div className="border-4 border-black p-6 bg-gray-50">
              <div className="text-3xl mb-3">🔔</div>
              <h3 className="font-mono font-bold text-lg mb-2 uppercase">
                Notificaciones
              </h3>
              <p className="text-sm text-gray-600">
                Alertas personalizadas de noticias de tu interés
              </p>
            </div>

            <div className="border-4 border-black p-6 bg-gray-50">
              <div className="text-3xl mb-3">💬</div>
              <h3 className="font-mono font-bold text-lg mb-2 uppercase">
                Comentarios
              </h3>
              <p className="text-sm text-gray-600">
                Participa en las discusiones de cada noticia
              </p>
            </div>

            <div className="border-4 border-black p-6 bg-gray-50">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-mono font-bold text-lg mb-2 uppercase">
                Historial
              </h3>
              <p className="text-sm text-gray-600">
                Guarda y organiza tus noticias favoritas
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
  )
}
