import { createFileRoute, Link } from '@tanstack/react-router';
import { submitContact, type ContactFormData } from '../features/public-content';
import { Breadcrumbs } from '../components/shared/Breadcrumbs';
import { useState } from 'react';

export const Route = createFileRoute('/contacto')({
  component: ContactoPage,
  head: () => ({
    meta: [
      { title: 'Contacto - Noticias Pachuca' },
      { name: 'description', content: 'Ponte en contacto con el equipo de Noticias Pachuca. Envianos tus comentarios, sugerencias o reportajes.' },
    ],
  }),
});

type FormState = 'idle' | 'sending' | 'success' | 'error';

function ContactoPage() {
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});

  const validateField = (field: keyof ContactFormData, value: string): string | undefined => {
    switch (field) {
      case 'name':
        if (!value || value.length < 3) return 'El nombre debe tener al menos 3 caracteres';
        if (value.length > 100) return 'El nombre no puede exceder 100 caracteres';
        break;
      case 'email':
        if (!value) return 'El email es requerido';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email inválido';
        break;
      case 'subject':
        if (!value || value.length < 5) return 'El asunto debe tener al menos 5 caracteres';
        if (value.length > 200) return 'El asunto no puede exceder 200 caracteres';
        break;
      case 'message':
        if (!value || value.length < 20) return 'El mensaje debe tener al menos 20 caracteres';
        if (value.length > 5000) return 'El mensaje no puede exceder 5000 caracteres';
        break;
    }
    return undefined;
  };

  const handleChange = (field: keyof ContactFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Validar en tiempo real
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar todos los campos
    const newErrors: Partial<Record<keyof ContactFormData, string>> = {};
    (Object.keys(formData) as Array<keyof ContactFormData>).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setFormState('sending');
    setErrorMessage('');

    try {
      const response = await submitContact({ data: formData });

      if (response.success) {
        setFormState('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
        setErrors({});
      } else {
        setFormState('error');
        setErrorMessage(response.error || response.message);
      }
    } catch (error) {
      setFormState('error');
      setErrorMessage('Error al enviar el mensaje. Por favor intenta de nuevo.');
    }
  };

  // Formatear fecha de hoy para el header
  const formatHeaderDate = () => {
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date()).toUpperCase()
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* HEADER - Reutilizado del index.tsx */}
      <header className="bg-white border-b-4 border-black relative">
        {/* Top Bar */}
        <div className="border-b-2 border-black px-4 py-2">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between md:items-center space-y-2 md:space-y-0 text-sm">
            <div className="flex items-center justify-center md:justify-start space-x-2 md:space-x-4">
              <span
                suppressHydrationWarning
                className="font-bold uppercase tracking-wider text-black text-xs md:text-sm"
              >
                {formatHeaderDate()}
              </span>
              <span className="text-[#854836] font-bold text-xs md:text-sm">EDICIÓN DE HOY</span>
            </div>
            <div className="flex items-center justify-center md:justify-end space-x-2 md:space-x-4">
              <Link
                to="/login"
                className="bg-black text-white px-3 md:px-4 py-1 font-bold uppercase text-xs border-2 border-black hover:bg-[#FF0000] transition-colors"
              >
                INICIAR SESIÓN
              </Link>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 space-y-4 md:space-y-0">
              {/* Search - Full width on mobile */}
              <div className="md:flex-1 order-2 md:order-1">
                <div className="relative max-w-md mx-auto md:mx-0">
                  <input
                    type="search"
                    placeholder="BUSCAR..."
                    className="w-full px-4 py-2 border-2 border-black bg-[#F7F7F7] font-bold uppercase text-sm placeholder-black focus:outline-none focus:bg-white"
                  />
                  <div className="absolute right-2 top-2 w-6 h-6 bg-black flex items-center justify-center">
                    <div className="w-3 h-3 border-2 border-white rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Logo - Centered and larger on mobile */}
              <div className="md:flex-1 text-center relative order-1 md:order-2">
                <div className="absolute -top-2 -left-2 w-4 h-4 md:w-6 md:h-6 bg-[#FF0000] transform rotate-45"></div>
                <Link to="/" className="block">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-[0.1em] text-black mb-1">
                    NOTICIAS
                  </h1>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-[0.1em] text-[#854836]">
                    PACHUCA
                  </h2>
                </Link>
                <div className="w-12 md:w-14 lg:w-16 h-1 bg-[#FFB22C] mx-auto mt-2"></div>
                <div className="absolute -bottom-2 -right-2 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] lg:border-l-[12px] lg:border-r-[12px] lg:border-b-[12px] border-l-transparent border-r-transparent border-b-black"></div>
              </div>

              {/* Right side info - Hidden on mobile */}
              <div className="hidden md:flex md:flex-1 text-right order-3">
                <div className="ml-auto">
                  <div className="text-sm font-bold uppercase tracking-wider text-black">
                    HIDALGO, MÉXICO
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="bg-black text-white">
          <div className="max-w-7xl mx-auto px-4">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center justify-center space-x-4 lg:space-x-8 py-3">
              <Link
                to="/noticias"
                className="font-bold uppercase text-sm tracking-wider hover:text-[#FFB22C] transition-colors relative group"
              >
                TODAS
                <div className="absolute -bottom-1 left-0 w-0 h-1 bg-[#FFB22C] group-hover:w-full transition-all duration-300"></div>
              </Link>
              {['LOCAL', 'POLÍTICA', 'DEPORTES', 'ECONOMÍA', 'CULTURA', 'TECNOLOGÍA', 'INTERNACIONAL', 'SALUD'].map((section) => (
                <Link
                  key={section}
                  to="/noticias"
                  search={{ category: section.toLowerCase() }}
                  className="font-bold uppercase text-sm tracking-wider hover:text-[#FFB22C] transition-colors relative group"
                >
                  {section}
                  <div className="absolute -bottom-1 left-0 w-0 h-1 bg-[#FFB22C] group-hover:w-full transition-all duration-300"></div>
                </Link>
              ))}
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden py-3">
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase text-sm tracking-wider text-[#FFB22C]">SECCIONES</span>
                <button
                  className="text-white hover:text-[#FFB22C] transition-colors"
                  onClick={() => {
                    const menu = document.getElementById('mobile-menu');
                    menu?.classList.toggle('hidden');
                  }}
                >
                  <div className="w-6 h-6 flex flex-col justify-center space-y-1">
                    <div className="w-6 h-0.5 bg-white"></div>
                    <div className="w-6 h-0.5 bg-white"></div>
                    <div className="w-6 h-0.5 bg-white"></div>
                  </div>
                </button>
              </div>

              {/* Mobile Menu */}
              <div id="mobile-menu" className="hidden mt-4 grid grid-cols-2 gap-2">
                <Link
                  to="/noticias"
                  className="bg-black text-white px-3 py-2 font-bold uppercase text-xs tracking-wider border border-[#FFB22C] hover:bg-[#FF0000] transition-colors text-center"
                >
                  TODAS
                </Link>
                {['LOCAL', 'POLÍTICA', 'DEPORTES', 'ECONOMÍA', 'CULTURA', 'TECNOLOGÍA', 'INTERNACIONAL', 'SALUD'].map((section) => (
                  <Link
                    key={section}
                    to="/noticias"
                    search={{ category: section.toLowerCase() }}
                    className="bg-[#854836] text-white px-3 py-2 font-bold uppercase text-xs tracking-wider border border-[#FFB22C] hover:bg-[#FF0000] transition-colors text-center"
                  >
                    {section}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <div className="mb-8">
          <Breadcrumbs
            items={[
              { label: 'Inicio', href: '/' },
              { label: 'Contacto' },
            ]}
          />
        </div>

        {/* Page Header */}
        <div className="mb-12 relative">
          <div className="absolute -top-2 -left-2 w-8 h-8 bg-[#FFB22C] transform rotate-45"></div>
          <div className="bg-white border-4 border-black p-8 md:p-12 relative">
            <h1 className="font-black text-4xl md:text-5xl lg:text-6xl mb-4 uppercase text-black tracking-wider">
              CONTACTO
            </h1>
            <p className="text-lg md:text-xl text-black font-medium leading-relaxed max-w-3xl">
              ¿Tienes una historia que contar? ¿Comentarios sobre nuestro contenido?
              Nos encantaría escucharte. Completa el formulario y nos pondremos en contacto contigo lo antes posible.
            </p>
            <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-[#854836] transform rotate-45"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario - 2 columnas en desktop */}
          <div className="lg:col-span-2">
            {formState === 'success' ? (
              // Estado de éxito - Sin emojis, diseño limpio
              <div className="border-4 border-black bg-[#00C853] p-8 md:p-12 relative">
                <div className="absolute -top-2 -left-2 w-8 h-8 bg-black transform rotate-45"></div>
                <div className="text-center space-y-6">
                  <div className="w-24 h-24 bg-white border-4 border-black mx-auto flex items-center justify-center">
                    <div className="w-12 h-2 bg-black transform rotate-45"></div>
                    <div className="w-6 h-2 bg-black transform -rotate-45 -ml-3 mt-3"></div>
                  </div>
                  <h2 className="font-black text-3xl md:text-4xl uppercase text-white tracking-wider">
                    MENSAJE ENVIADO
                  </h2>
                  <p className="text-lg md:text-xl text-white font-bold">
                    Gracias por contactarnos. Te responderemos lo antes posible.
                  </p>
                  <button
                    onClick={() => setFormState('idle')}
                    className="px-8 py-4 bg-black text-white border-4 border-black font-bold text-lg hover:bg-white hover:text-black transition-colors uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                  >
                    ENVIAR OTRO MENSAJE
                  </button>
                </div>
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-white transform rotate-45"></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white border-4 border-black p-6 md:p-8 relative">
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-[#854836] transform rotate-45"></div>

                {/* Error general - Sin emojis */}
                {formState === 'error' && (
                  <div className="mb-8 border-4 border-[#FF0000] bg-red-50 p-6 relative">
                    <div className="absolute -top-2 -left-2 w-6 h-6 bg-[#FF0000] transform rotate-45"></div>
                    <p className="font-mono font-bold text-[#FF0000] text-lg uppercase tracking-wide">
                      ERROR: {errorMessage}
                    </p>
                  </div>
                )}

                {/* Nombre */}
                <div className="mb-6">
                  <label htmlFor="name" className="block font-mono font-bold text-base mb-3 uppercase tracking-wider text-black">
                    NOMBRE COMPLETO
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={`w-full px-4 py-4 border-4 font-mono text-base focus:outline-none bg-white transition-all ${
                      errors.name
                        ? 'border-[#FF0000] shadow-[4px_4px_0px_0px_rgba(255,0,0,1)]'
                        : 'border-black focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                    placeholder="JUAN PÉREZ GARCÍA"
                    disabled={formState === 'sending'}
                  />
                  {errors.name && (
                    <p className="mt-2 text-[#FF0000] font-mono text-sm font-bold uppercase">{errors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div className="mb-6">
                  <label htmlFor="email" className="block font-mono font-bold text-base mb-3 uppercase tracking-wider text-black">
                    CORREO ELECTRÓNICO
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`w-full px-4 py-4 border-4 font-mono text-base focus:outline-none bg-white transition-all ${
                      errors.email
                        ? 'border-[#FF0000] shadow-[4px_4px_0px_0px_rgba(255,0,0,1)]'
                        : 'border-black focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                    placeholder="TU@EMAIL.COM"
                    disabled={formState === 'sending'}
                  />
                  {errors.email && (
                    <p className="mt-2 text-[#FF0000] font-mono text-sm font-bold uppercase">{errors.email}</p>
                  )}
                </div>

                {/* Asunto */}
                <div className="mb-6">
                  <label htmlFor="subject" className="block font-mono font-bold text-base mb-3 uppercase tracking-wider text-black">
                    ASUNTO
                  </label>
                  <input
                    id="subject"
                    type="text"
                    value={formData.subject}
                    onChange={(e) => handleChange('subject', e.target.value)}
                    className={`w-full px-4 py-4 border-4 font-mono text-base focus:outline-none bg-white transition-all ${
                      errors.subject
                        ? 'border-[#FF0000] shadow-[4px_4px_0px_0px_rgba(255,0,0,1)]'
                        : 'border-black focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                    placeholder="REPORTAJE SOBRE..."
                    disabled={formState === 'sending'}
                  />
                  {errors.subject && (
                    <p className="mt-2 text-[#FF0000] font-mono text-sm font-bold uppercase">{errors.subject}</p>
                  )}
                </div>

                {/* Mensaje */}
                <div className="mb-8">
                  <label htmlFor="message" className="block font-mono font-bold text-base mb-3 uppercase tracking-wider text-black">
                    MENSAJE
                  </label>
                  <textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    rows={8}
                    className={`w-full px-4 py-4 border-4 font-mono text-base focus:outline-none resize-none bg-white transition-all ${
                      errors.message
                        ? 'border-[#FF0000] shadow-[4px_4px_0px_0px_rgba(255,0,0,1)]'
                        : 'border-black focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                    placeholder="CUÉNTANOS MÁS SOBRE TU MENSAJE..."
                    disabled={formState === 'sending'}
                  />
                  {errors.message && (
                    <p className="mt-2 text-[#FF0000] font-mono text-sm font-bold uppercase">{errors.message}</p>
                  )}
                  <p className="mt-2 text-[#854836] text-sm font-mono font-bold">
                    {formData.message.length} / 5000 CARACTERES
                  </p>
                </div>

                {/* Botón de envío */}
                <button
                  type="submit"
                  disabled={formState === 'sending'}
                  className={`w-full px-8 py-6 border-4 border-black font-black text-xl uppercase tracking-wider transition-all relative ${
                    formState === 'sending'
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-[#FF0000] text-white hover:bg-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#FFB22C] transform rotate-45"></div>
                  {formState === 'sending' ? 'ENVIANDO...' : 'ENVIAR MENSAJE'}
                </button>

                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-[#FF0000] transform rotate-45"></div>
              </form>
            )}
          </div>

          {/* Información de contacto - 1 columna en desktop */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Ubicación */}
            <div className="bg-white border-4 border-black p-6 relative hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-[#FFB22C] transform rotate-45"></div>
              <h3 className="font-black text-xl mb-4 uppercase tracking-wider text-black border-b-2 border-black pb-3">
                UBICACIÓN
              </h3>
              <div className="space-y-2">
                <p className="font-bold text-base text-black uppercase tracking-wide">
                  PACHUCA DE SOTO
                </p>
                <p className="font-bold text-base text-[#854836] uppercase tracking-wide">
                  HIDALGO, MÉXICO
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="bg-white border-4 border-black p-6 relative hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-[#854836] transform rotate-45"></div>
              <h3 className="font-black text-xl mb-4 uppercase tracking-wider text-black border-b-2 border-black pb-3">
                CORREO
              </h3>
              <a
                href="mailto:contacto@noticiaspachuca.com"
                className="font-mono text-sm text-black hover:text-[#FF0000] transition-colors break-all"
              >
                contacto@noticiaspachuca.com
              </a>
            </div>

            {/* Horario */}
            <div className="bg-white border-4 border-black p-6 relative hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-[#FF0000] transform rotate-45"></div>
              <h3 className="font-black text-xl mb-4 uppercase tracking-wider text-black border-b-2 border-black pb-3">
                HORARIO
              </h3>
              <div className="space-y-2">
                <p className="font-bold text-base text-black uppercase tracking-wide">
                  LUNES - VIERNES
                </p>
                <p className="font-mono text-base text-[#854836] font-bold">
                  9:00 AM - 6:00 PM
                </p>
              </div>
            </div>

            {/* Tiempo de respuesta */}
            <div className="bg-[#FFB22C] border-4 border-black p-6 relative">
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-black transform rotate-45"></div>
              <h3 className="font-black text-lg mb-3 uppercase tracking-wider text-black">
                TIEMPO DE RESPUESTA
              </h3>
              <p className="font-bold text-sm text-black uppercase leading-relaxed">
                RESPONDEMOS TODOS LOS MENSAJES EN UN PLAZO DE 24-48 HORAS HÁBILES.
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* FOOTER - Reutilizado del index.tsx */}
      <footer className="bg-black text-white border-t-4 border-[#FFB22C] mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">

            {/* Secciones */}
            <div>
              <h4 className="font-black uppercase text-[#FFB22C] mb-3 tracking-wider">SECCIONES</h4>
              <ul className="space-y-2 text-sm">
                {['Página Principal', 'LOCAL', 'POLÍTICA', 'DEPORTES', 'ECONOMÍA', 'CULTURA', 'TECNOLOGÍA'].map((item) => (
                  <li key={item}>
                    <Link
                      to={item === 'Página Principal' ? '/' : '/noticias'}
                      search={item !== 'Página Principal' ? { category: item.toLowerCase() } : undefined}
                      className="hover:text-[#FFB22C] transition-colors uppercase font-bold"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletters */}
            <div>
              <h4 className="font-black uppercase text-[#FFB22C] mb-3 tracking-wider">BOLETINES</h4>
              <ul className="space-y-2 text-sm">
                {['LA MAÑANA', 'LA TARDE', 'RESUMEN SEMANAL', 'DEPORTES HOY'].map((item) => (
                  <li key={item}>
                    <button className="hover:text-[#FFB22C] transition-colors uppercase font-bold">{item}</button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Más */}
            <div>
              <h4 className="font-black uppercase text-[#FFB22C] mb-3 tracking-wider">MÁS</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/contacto" className="hover:text-[#FFB22C] transition-colors uppercase font-bold">
                    CONTACTO
                  </Link>
                </li>
                {['PUBLICIDAD', 'SUSCRIPCIONES', 'AVISO DE PRIVACIDAD', 'TÉRMINOS DE USO'].map((item) => (
                  <li key={item}>
                    <button className="hover:text-[#FFB22C] transition-colors uppercase font-bold">{item}</button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Logo Footer */}
            <div className="text-center col-span-2 md:col-span-3 lg:col-span-2">
              <div className="border-2 border-[#FFB22C] p-4 relative inline-block">
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-[#FF0000] transform rotate-45"></div>
                <h2 className="text-2xl font-black uppercase tracking-wider text-[#FFB22C] mb-1">NOTICIAS</h2>
                <h3 className="text-2xl font-black uppercase tracking-wider text-white">PACHUCA</h3>
                <div className="w-12 h-1 bg-[#FFB22C] mx-auto mt-2"></div>
                <div className="absolute -bottom-2 -right-2 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent border-b-[#FFB22C]"></div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t-2 border-[#FFB22C] pt-6 mt-6 text-center">
            <p className="text-sm font-bold uppercase tracking-wider">
              © 2025 NOTICIAS PACHUCA. TODOS LOS DERECHOS RESERVADOS.
            </p>
            <p className="text-xs text-[#FFB22C] mt-1 font-bold uppercase">
              HIDALGO, MÉXICO
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
