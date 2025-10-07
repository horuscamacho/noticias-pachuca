import { useState } from 'react';
import { subscribeNewsletter } from '../../features/public-content/server';

interface SubscribeFormProps {
  className?: string;
}

export function SubscribeForm({ className = '' }: SubscribeFormProps) {
  const [email, setEmail] = useState('');
  const [preferences, setPreferences] = useState({
    manana: false,
    tarde: false,
    semanal: false,
    deportes: false,
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({ email: '', preferences: '' });

  const validateForm = () => {
    const newErrors = { email: '', preferences: '' };
    let isValid = true;

    // Validar email
    if (!email.trim()) {
      newErrors.email = 'El email es obligatorio';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email inválido';
      isValid = false;
    }

    // Validar al menos una preferencia
    const hasPreference = Object.values(preferences).some(p => p);
    if (!hasPreference) {
      newErrors.preferences = 'Selecciona al menos un boletín';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setStatus('sending');
    setErrors({ email: '', preferences: '' });

    try {
      // Usar server function de TanStack Start
      const result = await subscribeNewsletter({
        data: {
          email: email.toLowerCase().trim(),
          ...preferences,
        },
      });

      if (!result.success) {
        throw new Error(result.message || 'Error al suscribirte');
      }

      setStatus('success');
      setMessage(result.message);
      setEmail('');
      setPreferences({ manana: false, tarde: false, semanal: false, deportes: false });

      // Reset success message after 10 seconds
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 10000);
    } catch (error) {
      console.error('[SubscribeForm] Error:', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Error al procesar tu suscripción');
    }
  };

  const handleCheckboxChange = (key: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    setErrors(prev => ({ ...prev, preferences: '' }));
  };

  return (
    <div className={`${className}`}>
      {status === 'success' ? (
        // Success State
        <div className="border-4 border-black bg-[#00FF00] bg-opacity-10 p-8 text-center">
          <div className="w-16 h-16 bg-white border-4 border-black mx-auto mb-4 flex items-center justify-center">
            <div className="relative w-8 h-8">
              <div className="absolute w-10 h-2 bg-black transform rotate-45 left-0 top-3"></div>
              <div className="absolute w-5 h-2 bg-black transform -rotate-45 -left-1 top-4"></div>
            </div>
          </div>

          <h3 className="font-mono text-2xl font-bold mb-3 uppercase">
            CASI LISTO
          </h3>

          <p className="text-base mb-6 max-w-md mx-auto">
            {message}. Revisa tu bandeja de entrada y haz clic en el enlace para confirmar tu suscripción.
          </p>

          <button
            onClick={() => {
              setStatus('idle');
              setMessage('');
            }}
            className="px-6 py-2 bg-black text-white border-4 border-black font-mono font-bold hover:bg-[#854836] transition-all uppercase text-sm"
          >
            SUSCRIBIR OTRO EMAIL
          </button>
        </div>
      ) : (
        // Form
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div>
            <label htmlFor="newsletter-email" className="block font-mono font-bold text-sm mb-2 uppercase tracking-wider">
              EMAIL
            </label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors(prev => ({ ...prev, email: '' }));
              }}
              placeholder="tu@email.com"
              className={`w-full px-4 py-3 border-4 font-mono text-base focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${
                errors.email
                  ? 'border-[#FF0000] shadow-[4px_4px_0px_0px_rgba(255,0,0,1)]'
                  : 'border-black'
              }`}
              disabled={status === 'sending'}
            />
            {errors.email && (
              <p className="mt-2 text-sm text-[#FF0000] font-mono font-bold">{errors.email}</p>
            )}
          </div>

          {/* Preferences Checkboxes */}
          <div>
            <label className="block font-mono font-bold text-sm mb-3 uppercase tracking-wider">
              BOLETINES QUE QUIERO RECIBIR
            </label>

            <div className="space-y-3">
              {/* Mañana */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="flex-shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={preferences.manana}
                    onChange={() => handleCheckboxChange('manana')}
                    className="w-6 h-6 border-4 border-black accent-[#FFB22C] cursor-pointer"
                    disabled={status === 'sending'}
                  />
                </div>
                <div>
                  <div className="font-mono font-bold text-sm group-hover:underline uppercase">
                    Boletín de la Mañana
                  </div>
                  <div className="text-xs text-gray-600">
                    Las 5 noticias más importantes cada día a las 7:00 AM
                  </div>
                </div>
              </label>

              {/* Tarde */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="flex-shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={preferences.tarde}
                    onChange={() => handleCheckboxChange('tarde')}
                    className="w-6 h-6 border-4 border-black accent-[#FFB22C] cursor-pointer"
                    disabled={status === 'sending'}
                  />
                </div>
                <div>
                  <div className="font-mono font-bold text-sm group-hover:underline uppercase">
                    Boletín de la Tarde
                  </div>
                  <div className="text-xs text-gray-600">
                    Las 3 noticias más leídas cada día a las 6:00 PM
                  </div>
                </div>
              </label>

              {/* Semanal */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="flex-shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={preferences.semanal}
                    onChange={() => handleCheckboxChange('semanal')}
                    className="w-6 h-6 border-4 border-black accent-[#FFB22C] cursor-pointer"
                    disabled={status === 'sending'}
                  />
                </div>
                <div>
                  <div className="font-mono font-bold text-sm group-hover:underline uppercase">
                    Boletín Semanal
                  </div>
                  <div className="text-xs text-gray-600">
                    Resumen con las 10 noticias más importantes cada domingo
                  </div>
                </div>
              </label>

              {/* Deportes */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="flex-shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={preferences.deportes}
                    onChange={() => handleCheckboxChange('deportes')}
                    className="w-6 h-6 border-4 border-black accent-[#FFB22C] cursor-pointer"
                    disabled={status === 'sending'}
                  />
                </div>
                <div>
                  <div className="font-mono font-bold text-sm group-hover:underline uppercase">
                    Boletín de Deportes
                  </div>
                  <div className="text-xs text-gray-600">
                    Noticias de los Tuzos del Pachuca y deportes de la región
                  </div>
                </div>
              </label>
            </div>

            {errors.preferences && (
              <p className="mt-2 text-sm text-[#FF0000] font-mono font-bold">{errors.preferences}</p>
            )}
          </div>

          {/* Error Message */}
          {status === 'error' && (
            <div className="border-4 border-[#FF0000] bg-white p-4">
              <p className="text-sm text-[#FF0000] font-mono font-bold">{message}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={status === 'sending'}
            className={`w-full px-6 py-4 border-4 border-black font-mono font-bold text-lg uppercase transition-all ${
              status === 'sending'
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-[#FFB22C] hover:bg-[#FF0000] hover:text-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
            }`}
          >
            {status === 'sending' ? 'ENVIANDO...' : 'SUSCRIBIRME GRATIS'}
          </button>

          {/* Privacy Note */}
          <p className="text-xs text-gray-600 text-center">
            Al suscribirte, aceptas recibir emails de Noticias Pachuca. Puedes darte de baja en cualquier momento.
          </p>
        </form>
      )}
    </div>
  );
}
