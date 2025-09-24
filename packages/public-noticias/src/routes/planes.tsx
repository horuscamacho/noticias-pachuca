import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/planes')({
  component: PlanesPage,
})

function PlanesPage() {
  const planes = [
    {
      nombre: 'GRATUITO',
      precio: 'GRATIS',
      descripcion: 'IDEAL PARA MANTENERTE INFORMADO',
      color: '#F7F7F7',
      textColor: '#000000',
      borderColor: '#000000',
      accentColor: '#854836',
      caracteristicas: [
        'ESTADÍSTICAS DE LECTURA COMPLETAS',
        'NOTIFICACIONES PERSONALIZADAS',
        'BOLETINES CUSTOMIZABLES',
        'ACCESO A NOTICIAS PRINCIPALES',
        'COMENTARIOS EN ARTÍCULOS',
        'GUARDADO DE ARTÍCULOS FAVORITOS',
        'PERFIL PERSONALIZABLE',
      ],
      limitaciones: [
        'ACCESO LIMITADO A COLUMNAS DE OPINIÓN',
        'CONTENIDO PREMIUM BLOQUEADO',
        'ANUNCIOS EN LA PLATAFORMA',
      ]
    },
    {
      nombre: 'BÁSICO',
      precio: '$50',
      periodo: '/MES',
      descripcion: 'ACCESO COMPLETO SIN RESTRICCIONES',
      color: '#FFB22C',
      textColor: '#000000',
      borderColor: '#000000',
      accentColor: '#FF0000',
      popular: true,
      caracteristicas: [
        'TODO LO DEL PLAN GRATUITO',
        'ACCESO COMPLETO A COLUMNAS DE OPINIÓN',
        'CONTENIDO EXCLUSIVO SIN RESTRICCIONES',
        'SIN ANUNCIOS EN LA PLATAFORMA',
        'NOTIFICACIONES PRIORITARIAS',
        'ACCESO A ARCHIVO HISTÓRICO COMPLETO',
        'DESCARGA DE ARTÍCULOS EN PDF',
        'SOPORTE PRIORITARIO VÍA EMAIL',
      ],
      limitaciones: []
    },
    {
      nombre: 'PREMIUM',
      precio: '$200',
      periodo: '/MES',
      descripcion: 'CONVIÉRTETE EN PARTE DE LA REDACCIÓN',
      color: '#854836',
      textColor: '#FFFFFF',
      borderColor: '#000000',
      accentColor: '#FFB22C',
      caracteristicas: [
        'TODO LO DEL PLAN BÁSICO',
        'COLUMNA DE OPINIÓN SEMANAL PROPIA',
        'REVISIÓN EDITORIAL PROFESIONAL',
        'PROMOCIÓN EN REDES SOCIALES',
        'CERTIFICADO DE COLABORADOR',
        'ESPACIO PARA PATROCINADORES',
        'PATROCINIOS PUEDEN CUBRIR SUSCRIPCIÓN',
        'GESTIÓN DE CONTRATOS PUBLICITARIOS',
        'REPORTES DETALLADOS DE AUDIENCIA',
      ],
      limitaciones: []
    }
  ]

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* 🏗️ BRUTALIST HEADER SIMPLIFICADO */}
      <header className="bg-white border-b-4 border-black relative">
        <div className="px-4 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
              {/* Logo */}
              <Link to="/" className="flex items-center justify-center md:justify-start space-x-2 md:space-x-4 relative">
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-[#FF0000] transform rotate-45"></div>
                <h1 className="text-xl md:text-2xl font-black uppercase tracking-[0.1em] text-black">
                  NOTICIAS
                </h1>
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-[0.1em] text-[#854836]">
                  PACHUCA
                </h2>
                <div className="w-6 md:w-8 h-1 bg-[#FFB22C]"></div>
              </Link>

              {/* Navigation Links */}
              <nav className="flex items-center justify-center md:justify-end space-x-2 md:space-x-4">
                <Link
                  to="/"
                  className="font-bold uppercase text-xs md:text-sm tracking-wider text-black hover:text-[#854836] transition-colors"
                >
                  INICIO
                </Link>
                <Link
                  to="/login"
                  className="bg-black text-white px-3 md:px-4 py-2 font-bold uppercase text-xs border-2 border-black hover:bg-[#FF0000] transition-colors"
                >
                  LOGIN
                </Link>
                <Link
                  to="/planes"
                  className="bg-[#854836] text-white px-3 md:px-4 py-2 font-bold uppercase text-xs border-2 border-black"
                >
                  PLANES
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-black text-white border-b-4 border-[#FFB22C] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-16 h-16 bg-[#FF0000] transform rotate-45 -translate-x-8 -translate-y-8"></div>
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight text-white leading-tight mb-6">
              ELIGE TU<br />
              <span className="text-[#FFB22C]">MEMBRESÍA</span>
            </h1>
            <p className="text-xl md:text-2xl font-bold text-white mb-8 max-w-3xl mx-auto leading-relaxed">
              DESDE ACCESO GRATUITO HASTA CONVERTIRTE EN COLUMNISTA. ENCUENTRA EL PLAN PERFECTO PARA TI.
            </p>
            <div className="bg-[#FFB22C] text-black px-8 py-3 inline-block border-2 border-white font-bold uppercase text-lg tracking-wider">
              TODOS LOS PLANES INCLUYEN PRUEBA GRATUITA
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 right-0 w-12 h-12 bg-[#854836] transform rotate-45 translate-x-6 translate-y-6"></div>
      </section>

      {/* Plans Section */}
      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {planes.map((plan, index) => (
            <div
              key={plan.nombre}
              className={`border-4 border-black relative ${plan.popular ? 'transform scale-105' : ''}`}
              style={{ backgroundColor: plan.color }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-[#FF0000] text-white px-6 py-2 border-2 border-black font-bold uppercase text-sm tracking-wider">
                    MÁS POPULAR
                  </div>
                </div>
              )}

              {/* Decorative Elements */}
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-[#FF0000] transform rotate-45"></div>
              <div className="absolute -bottom-3 -right-3 w-0 h-0 border-l-[16px] border-r-[16px] border-b-[16px] border-l-transparent border-r-transparent border-b-black"></div>

              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-black uppercase tracking-tight mb-2" style={{ color: plan.textColor }}>
                    {plan.nombre}
                  </h2>
                  <div className="flex items-center justify-center mb-4">
                    <span className="text-5xl font-black" style={{ color: plan.textColor }}>
                      {plan.precio}
                    </span>
                    {plan.periodo && (
                      <span className="text-lg font-bold ml-2" style={{ color: plan.textColor }}>
                        {plan.periodo}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold uppercase tracking-wider" style={{ color: plan.textColor }}>
                    {plan.descripcion}
                  </p>
                </div>

                {/* Features */}
                <div className="mb-8">
                  <h3 className="text-lg font-black uppercase tracking-tight mb-4 border-b-2 border-black pb-2" style={{ color: plan.textColor }}>
                    INCLUYE:
                  </h3>
                  <ul className="space-y-3">
                    {plan.caracteristicas.map((caracteristica, i) => (
                      <li key={i} className="flex items-start space-x-3">
                        <div className="w-4 h-4 mt-1 flex-shrink-0" style={{ backgroundColor: plan.accentColor }}>
                          <div className="w-2 h-2 bg-white m-1 transform rotate-45"></div>
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider leading-relaxed" style={{ color: plan.textColor }}>
                          {caracteristica}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Limitations */}
                {plan.limitaciones.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-black uppercase tracking-tight mb-4 border-b-2 border-black pb-2" style={{ color: plan.textColor }}>
                      LIMITACIONES:
                    </h3>
                    <ul className="space-y-3">
                      {plan.limitaciones.map((limitacion, i) => (
                        <li key={i} className="flex items-start space-x-3">
                          <div className="w-4 h-4 mt-1 bg-[#FF0000] flex-shrink-0">
                            <div className="w-2 h-2 bg-white m-1"></div>
                          </div>
                          <span className="text-sm font-bold uppercase tracking-wider leading-relaxed" style={{ color: plan.textColor }}>
                            {limitacion}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CTA Button */}
                <div className="text-center">
                  {index === 0 ? (
                    <Link
                      to="/registro"
                      className="inline-block w-full bg-black text-white py-4 font-bold uppercase text-lg border-2 border-black hover:bg-[#854836] transition-colors relative group"
                    >
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#FFB22C] transform rotate-45 group-hover:bg-[#FF0000] transition-colors"></div>
                      COMENZAR GRATIS
                    </Link>
                  ) : (
                    <Link
                      to={`/pago?plan=${plan.nombre.toLowerCase()}`}
                      className="inline-block w-full bg-black text-white py-4 font-bold uppercase text-lg border-2 border-black hover:bg-[#FF0000] transition-colors relative group"
                    >
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#FFB22C] transform rotate-45 group-hover:bg-white transition-colors"></div>
                      SUSCRIBIRSE AHORA
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <section className="mt-20">
          <div className="bg-white border-4 border-black p-8 relative">
            <div className="absolute -top-3 -left-3 w-8 h-8 bg-[#FFB22C] transform rotate-45"></div>

            <h2 className="text-4xl font-black uppercase tracking-tight text-black mb-8 text-center">
              PREGUNTAS FRECUENTES
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="border-2 border-black p-4 bg-[#F7F7F7]">
                  <h3 className="font-black uppercase text-black mb-2">¿PUEDO CAMBIAR DE PLAN EN CUALQUIER MOMENTO?</h3>
                  <p className="text-sm font-bold text-black">SÍ, PUEDES UPGRADER O DOWNGRADER TU PLAN CUANDO QUIERAS. LOS CAMBIOS SE APLICAN INMEDIATAMENTE.</p>
                </div>

                <div className="border-2 border-black p-4 bg-[#F7F7F7]">
                  <h3 className="font-black uppercase text-black mb-2">¿CÓMO FUNCIONA LA COLUMNA DE OPINIÓN?</h3>
                  <p className="text-sm font-bold text-black">ENVÍAS TU COLUMNA CADA SEMANA, NUESTRO EQUIPO LA REVISA Y PUBLICA. RECIBES FEEDBACK PROFESIONAL PARA MEJORAR.</p>
                </div>

                <div className="border-2 border-black p-4 bg-[#F7F7F7]">
                  <h3 className="font-black uppercase text-black mb-2">¿HAY PERMANENCIA MÍNIMA?</h3>
                  <p className="text-sm font-bold text-black">NO. PUEDES CANCELAR TU SUSCRIPCIÓN EN CUALQUIER MOMENTO SIN PENALIZACIONES.</p>
                </div>

                <div className="border-2 border-black p-4 bg-[#F7F7F7]">
                  <h3 className="font-black uppercase text-black mb-2">¿PUEDO VIVIR DE MI COLUMNA?</h3>
                  <p className="text-sm font-bold text-black">SÍ. CON PATROCINADORES Y VISUALIZACIONES MUCHOS COLUMNISTAS CUBREN SU SUSCRIPCIÓN Y GENERAN INGRESOS EXTRA.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="border-2 border-black p-4 bg-[#F7F7F7]">
                  <h3 className="font-black uppercase text-black mb-2">¿QUÉ MÉTODOS DE PAGO ACEPTAN?</h3>
                  <p className="text-sm font-bold text-black">TARJETAS DE CRÉDITO, DÉBITO, TRANSFERENCIAS BANCARIAS Y PAYPAL. FACTURACIÓN AUTOMÁTICA MENSUAL.</p>
                </div>

                <div className="border-2 border-black p-4 bg-[#F7F7F7]">
                  <h3 className="font-black uppercase text-black mb-2">¿CÓMO FUNCIONAN LOS PATROCINIOS?</h3>
                  <p className="text-sm font-bold text-black">PUEDES CONSEGUIR PATROCINADORES PARA TU COLUMNA. ELLOS PAGAN TU SUSCRIPCIÓN Y TÚ INCLUYES SU PUBLICIDAD.</p>
                </div>

                <div className="border-2 border-black p-4 bg-[#F7F7F7]">
                  <h3 className="font-black uppercase text-black mb-2">¿OFRECEN DESCUENTOS?</h3>
                  <p className="text-sm font-bold text-black">SÍ, 15% DE DESCUENTO EN PLAN ANUAL Y DESCUENTOS ESPECIALES PARA ESTUDIANTES Y JUBILADOS.</p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-3 -right-3 w-0 h-0 border-l-[16px] border-r-[16px] border-b-[16px] border-l-transparent border-r-transparent border-b-black"></div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="mt-12">
          <div className="bg-[#854836] text-white border-4 border-black p-8 text-center relative">
            <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#FFB22C] transform rotate-45"></div>

            <h2 className="text-3xl font-black uppercase tracking-tight mb-4">
              ¿NECESITAS AYUDA?
            </h2>
            <p className="text-lg font-bold mb-6">
              NUESTRO EQUIPO ESTÁ AQUÍ PARA RESOLVER TODAS TUS DUDAS
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <button className="bg-white text-black px-8 py-3 font-bold uppercase text-sm border-2 border-black hover:bg-[#FFB22C] transition-colors">
                CHAT EN VIVO
              </button>
              <button className="bg-black text-white px-8 py-3 font-bold uppercase text-sm border-2 border-black hover:bg-[#FF0000] transition-colors">
                EMAIL: SOPORTE@NOTICIASPACHUCA.COM
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* Footer simplificado */}
      <footer className="bg-black text-white border-t-4 border-[#FFB22C] mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <div className="border-2 border-[#FFB22C] p-4 inline-block relative">
              <div className="absolute -top-2 -left-2 w-4 h-4 bg-[#FF0000] transform rotate-45"></div>
              <h2 className="text-xl font-black uppercase tracking-wider text-[#FFB22C] mb-1">NOTICIAS</h2>
              <h3 className="text-xl font-black uppercase tracking-wider text-white">PACHUCA</h3>
              <div className="w-8 h-1 bg-[#FFB22C] mx-auto mt-2"></div>
            </div>
            <p className="text-sm font-bold uppercase tracking-wider mt-4">
              © 2025 NOTICIAS PACHUCA. TODOS LOS DERECHOS RESERVADOS.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}