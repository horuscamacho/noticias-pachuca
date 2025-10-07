import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { UniversalHeader } from '../components/shared/UniversalHeader';
import { UniversalFooter } from '../components/shared/UniversalFooter';
import { getCategories, unsubscribe } from '../features/public-content/server';

export const Route = createFileRoute('/desuscribir')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: search.token as string | undefined,
    };
  },
  loader: async () => {
    const categoriesResponse = await getCategories();
    return {
      categories: categoriesResponse.success ? categoriesResponse.data : [],
    };
  },
  component: DesuscribirPage,
  head: () => ({
    meta: [
      { title: 'Desuscribirse - Noticias Pachuca' },
      {
        name: 'description',
        content: 'Desuscríbete de los boletines de Noticias Pachuca.',
      },
    ],
  }),
});

function DesuscribirPage() {
  const { token } = Route.useSearch();
  const { categories } = Route.useLoaderData();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [reason, setReason] = useState('');

  const handleUnsubscribe = async () => {
    if (!token) {
      setStatus('error');
      setMessage('Token inválido o faltante');
      return;
    }

    setStatus('loading');

    try {
      const result = await unsubscribe({
        data: {
          token,
          reason: reason || undefined
        }
      });

      if (!result.success) {
        throw new Error(result.message || 'Error al desuscribirse');
      }

      setStatus('success');
      setMessage(result.message);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Error al procesar tu solicitud');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Universal Header */}
      <UniversalHeader categories={categories} />

      {/* Contenido */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        {status === 'idle' && (
          <div className="border-4 border-black bg-white p-12 relative">
            <div className="absolute -top-2 -left-2 w-8 h-8 bg-[#FFB22C] transform rotate-45"></div>

            <h2 className="font-mono text-3xl md:text-4xl font-bold mb-6 uppercase text-center">
              ¿SEGURO QUE QUIERES IRTE?
            </h2>

            <p className="text-xl text-gray-700 mb-8 text-center max-w-2xl mx-auto">
              Lamentamos verte partir. Si te desinscribes, ya no recibirás nuestros boletines
              con las noticias más importantes de Pachuca.
            </p>

            <div className="mb-8">
              <label className="block font-mono font-bold text-sm mb-3 uppercase tracking-wider">
                ¿Por qué te vas? (Opcional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Tu feedback nos ayuda a mejorar..."
                className="w-full px-4 py-3 border-4 border-black font-mono text-base focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all resize-none"
                rows={4}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button
                onClick={handleUnsubscribe}
                className="px-8 py-4 bg-[#FF0000] text-white border-4 border-black font-mono font-bold text-lg hover:bg-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
              >
                CONFIRMAR DESUSCRIPCIÓN
              </button>
              <Link
                to="/"
                className="px-8 py-4 bg-white text-black border-4 border-black font-mono font-bold text-lg hover:bg-[#FFB22C] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all uppercase text-center"
              >
                CANCELAR (QUEDARME)
              </Link>
            </div>

            <div className="border-t-4 border-black pt-6 text-center">
              <p className="text-sm text-gray-600 mb-4">
                ¿Prefieres ajustar tus preferencias en lugar de desuscribirte completamente?
              </p>
              <Link
                to="/#suscribirse"
                className="inline-block px-6 py-3 bg-[#854836] text-white border-4 border-black font-mono font-bold text-sm hover:bg-[#FFB22C] hover:text-black transition-all uppercase"
              >
                ACTUALIZAR PREFERENCIAS
              </Link>
            </div>

            <div className="absolute -bottom-2 -right-2 w-0 h-0 border-l-[16px] border-r-[16px] border-b-[16px] border-l-transparent border-r-transparent border-b-[#FFB22C]"></div>
          </div>
        )}

        {status === 'loading' && (
          <div className="border-4 border-black bg-white p-12 text-center">
            <div className="w-16 h-16 border-4 border-black border-t-[#FF0000] rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="font-mono text-2xl font-bold mb-4 uppercase">
              PROCESANDO...
            </h2>
            <p className="text-lg text-gray-700">Por favor espera un momento</p>
          </div>
        )}

        {status === 'success' && (
          <div className="border-4 border-black bg-white p-12 text-center relative">
            <div className="absolute -top-2 -left-2 w-8 h-8 bg-[#854836] transform rotate-45"></div>

            <h2 className="font-mono text-3xl md:text-4xl font-bold mb-6 uppercase">
              DESUSCRIPCIÓN EXITOSA
            </h2>

            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
              {message}
            </p>

            <p className="text-lg text-gray-600 mb-8">
              Esperamos verte de vuelta pronto. Siempre puedes volver a suscribirte cuando quieras.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/"
                className="px-8 py-4 bg-black text-white border-4 border-black font-mono font-bold text-lg hover:bg-[#FF0000] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
              >
                IR AL INICIO
              </Link>
              <Link
                to="/#suscribirse"
                className="px-8 py-4 bg-white text-black border-4 border-black font-mono font-bold text-lg hover:bg-[#FFB22C] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
              >
                VOLVER A SUSCRIBIRME
              </Link>
            </div>

            <div className="absolute -bottom-2 -right-2 w-0 h-0 border-l-[16px] border-r-[16px] border-b-[16px] border-l-transparent border-r-transparent border-b-[#854836]"></div>
          </div>
        )}

        {status === 'error' && (
          <div className="border-4 border-[#FF0000] bg-white p-12 text-center relative">
            <div className="absolute -top-2 -left-2 w-8 h-8 bg-[#FF0000] transform rotate-45"></div>

            <h2 className="font-mono text-3xl md:text-4xl font-bold mb-6 uppercase text-[#FF0000]">
              ERROR AL DESUSCRIBIR
            </h2>

            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
              {message}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setStatus('idle')}
                className="px-8 py-4 bg-[#FF0000] text-white border-4 border-black font-mono font-bold text-lg hover:bg-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
              >
                INTENTAR DE NUEVO
              </button>
              <Link
                to="/contacto"
                className="px-8 py-4 bg-white text-black border-4 border-black font-mono font-bold text-lg hover:bg-[#F7F7F7] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
              >
                CONTACTAR SOPORTE
              </Link>
            </div>

            <div className="absolute -bottom-2 -right-2 w-0 h-0 border-l-[16px] border-r-[16px] border-b-[16px] border-l-transparent border-r-transparent border-b-[#FF0000]"></div>
          </div>
        )}
      </div>

      {/* Universal Footer */}
      <UniversalFooter />
    </div>
  );
}
