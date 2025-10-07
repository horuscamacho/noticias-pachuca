import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { UniversalHeader } from '../components/shared/UniversalHeader';
import { UniversalFooter } from '../components/shared/UniversalFooter';
import { getCategories, confirmSubscription } from '../features/public-content/server';

export const Route = createFileRoute('/confirmar-suscripcion')({
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
  component: ConfirmarSuscripcionPage,
  head: () => ({
    meta: [
      { title: 'Confirmar Suscripción - Noticias Pachuca' },
      {
        name: 'description',
        content: 'Confirma tu suscripción a los boletines de Noticias Pachuca.',
      },
    ],
  }),
});

function ConfirmarSuscripcionPage() {
  const { token } = Route.useSearch();
  const { categories } = Route.useLoaderData();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleConfirmation = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Token inválido o faltante');
        return;
      }

      try {
        const result = await confirmSubscription({ data: { token } });

        if (!result.success) {
          throw new Error(result.message || 'Error al confirmar suscripción');
        }

        setStatus('success');
        setMessage(result.message);
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Error al confirmar tu suscripción');
      }
    };

    handleConfirmation();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Universal Header */}
      <UniversalHeader categories={categories} />

      {/* Contenido */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        {status === 'loading' && (
          <div className="border-4 border-black bg-white p-12 text-center">
            <div className="w-16 h-16 border-4 border-black border-t-[#FFB22C] rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="font-mono text-2xl font-bold mb-4 uppercase">
              CONFIRMANDO TU SUSCRIPCIÓN...
            </h2>
            <p className="text-lg text-gray-700">Por favor espera un momento</p>
          </div>
        )}

        {status === 'success' && (
          <div className="border-4 border-black bg-white p-12 text-center relative">
            <div className="absolute -top-2 -left-2 w-8 h-8 bg-[#00FF00] transform rotate-45"></div>

            {/* Checkmark CSS */}
            <div className="w-24 h-24 bg-white border-4 border-black mx-auto mb-6 flex items-center justify-center">
              <div className="relative w-12 h-12">
                <div className="absolute w-14 h-3 bg-black transform rotate-45 left-2 top-7"></div>
                <div className="absolute w-7 h-3 bg-black transform -rotate-45 left-0 top-9"></div>
              </div>
            </div>

            <h2 className="font-mono text-3xl md:text-4xl font-bold mb-6 uppercase text-[#00FF00]">
              ¡SUSCRIPCIÓN CONFIRMADA!
            </h2>

            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
              {message}
            </p>

            <p className="text-lg text-gray-600 mb-8">
              Comenzarás a recibir nuestros boletines según las preferencias que seleccionaste.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/"
                className="px-8 py-4 bg-black text-white border-4 border-black font-mono font-bold text-lg hover:bg-[#FF0000] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
              >
                IR AL INICIO
              </Link>
              <Link
                to="/boletin/manana"
                className="px-8 py-4 bg-white text-black border-4 border-black font-mono font-bold text-lg hover:bg-[#FFB22C] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
              >
                VER BOLETINES
              </Link>
            </div>

            <div className="absolute -bottom-2 -right-2 w-0 h-0 border-l-[16px] border-r-[16px] border-b-[16px] border-l-transparent border-r-transparent border-b-[#00FF00]"></div>
          </div>
        )}

        {status === 'error' && (
          <div className="border-4 border-[#FF0000] bg-white p-12 text-center relative">
            <div className="absolute -top-2 -left-2 w-8 h-8 bg-[#FF0000] transform rotate-45"></div>

            {/* X Mark CSS */}
            <div className="w-24 h-24 bg-white border-4 border-black mx-auto mb-6 flex items-center justify-center">
              <div className="relative w-12 h-12">
                <div className="absolute w-14 h-3 bg-[#FF0000] transform rotate-45 left-1 top-6"></div>
                <div className="absolute w-14 h-3 bg-[#FF0000] transform -rotate-45 left-1 top-6"></div>
              </div>
            </div>

            <h2 className="font-mono text-3xl md:text-4xl font-bold mb-6 uppercase text-[#FF0000]">
              ERROR AL CONFIRMAR
            </h2>

            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
              {message}
            </p>

            <p className="text-base text-gray-600 mb-8">
              Posibles causas:
            </p>
            <ul className="text-left max-w-md mx-auto mb-8 space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="font-mono font-bold">•</span>
                <span>El enlace de confirmación expiró (válido por 24 horas)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono font-bold">•</span>
                <span>El enlace ya fue usado anteriormente</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono font-bold">•</span>
                <span>El enlace está incompleto o corrupto</span>
              </li>
            </ul>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/#suscribirse"
                className="px-8 py-4 bg-[#FF0000] text-white border-4 border-black font-mono font-bold text-lg hover:bg-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
              >
                INTENTAR DE NUEVO
              </Link>
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
