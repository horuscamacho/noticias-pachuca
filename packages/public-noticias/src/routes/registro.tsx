import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/registro')({
  component: RegistroPage,
})

function RegistroPage() {
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
                  INICIAR SESIÓN
                </Link>
                <Link
                  to="/design-system"
                  className="bg-[#854836] text-white px-3 md:px-4 py-2 font-bold uppercase text-xs border-2 border-black hover:bg-[#FF0000] transition-colors"
                >
                  DESIGN SYSTEM
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Registration Content */}
      <main className="min-h-[calc(100vh-120px)] p-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-[calc(100vh-200px)]">

            {/* Left Side - Benefits/Features */}
            <div className="hidden lg:flex flex-col justify-center space-y-8">

              {/* Hero Section */}
              <div className="bg-[#FFB22C] text-black border-4 border-black p-12 relative">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#FF0000] transform rotate-45"></div>

                <h1 className="text-5xl font-black uppercase tracking-tight text-black leading-tight mb-6">
                  ÚNETE A<br />
                  <span className="text-[#854836]">NOTICIAS PACHUCA</span>
                </h1>

                <p className="text-xl font-bold text-black mb-8 leading-relaxed">
                  CREA TU CUENTA GRATUITA Y DISFRUTA DE BENEFICIOS EXCLUSIVOS. SÉ PARTE DE LA COMUNIDAD INFORMADA DE HIDALGO.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-black border-2 border-black flex items-center justify-center">
                      <div className="w-4 h-4 bg-[#FFB22C] transform rotate-45"></div>
                    </div>
                    <span className="font-bold uppercase text-sm tracking-wider">ACCESO ILIMITADO A TODAS LAS NOTICIAS</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-black border-2 border-black flex items-center justify-center">
                      <div className="w-4 h-4 bg-[#FFB22C] transform rotate-45"></div>
                    </div>
                    <span className="font-bold uppercase text-sm tracking-wider">BOLETINES PERSONALIZADOS</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-black border-2 border-black flex items-center justify-center">
                      <div className="w-4 h-4 bg-[#FFB22C] transform rotate-45"></div>
                    </div>
                    <span className="font-bold uppercase text-sm tracking-wider">NOTIFICACIONES INMEDIATAS</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-black border-2 border-black flex items-center justify-center">
                      <div className="w-4 h-4 bg-[#FFB22C] transform rotate-45"></div>
                    </div>
                    <span className="font-bold uppercase text-sm tracking-wider">SIN PUBLICIDAD INVASIVA</span>
                  </div>
                </div>

                <div className="absolute -bottom-4 -right-4 w-0 h-0 border-l-[24px] border-r-[24px] border-b-[24px] border-l-transparent border-r-transparent border-b-black"></div>
              </div>

              {/* Testimonial */}
              <div className="bg-black text-white border-2 border-black p-8 relative">
                <div className="absolute -top-1 -left-1 w-6 h-6 bg-[#854836] transform rotate-45"></div>

                <blockquote className="text-lg font-bold mb-4 leading-relaxed">
                  "NOTICIAS PACHUCA ME MANTIENE INFORMADO DE TODO LO QUE PASA EN MI CIUDAD. ES MI FUENTE CONFIABLE DE INFORMACIÓN."
                </blockquote>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-[#FFB22C] border-2 border-white flex items-center justify-center">
                    <span className="text-black font-black text-lg">MR</span>
                  </div>
                  <div>
                    <div className="font-bold uppercase text-sm text-[#FFB22C]">MARÍA RODRÍGUEZ</div>
                    <div className="text-xs font-bold uppercase tracking-wider text-white">USUARIA DESDE 2023</div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Side - Registration Form */}
            <div className="w-full max-w-lg mx-auto lg:mx-0">

              {/* Registration Form */}
              <div className="bg-white border-4 border-black p-8 lg:p-12 relative">
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-[#FFB22C] transform rotate-45"></div>

                {/* Header */}
                <div className="text-center mb-8">
                  <h2 className="text-4xl font-black uppercase tracking-tight text-black mb-4">
                    CREAR CUENTA
                  </h2>
                  <p className="text-sm font-bold text-[#854836] uppercase tracking-wider">
                    REGÍSTRATE GRATIS EN NOTICIAS PACHUCA
                  </p>
                </div>

                {/* Form */}
                <form className="space-y-6">
                  {/* Name Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-wider text-black mb-3">
                        NOMBRE
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="TU NOMBRE"
                        className="w-full px-4 py-4 border-2 border-black bg-[#F7F7F7] font-bold uppercase text-sm placeholder-black focus:outline-none focus:bg-white focus:border-[#854836] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-wider text-black mb-3">
                        APELLIDO
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="TU APELLIDO"
                        className="w-full px-4 py-4 border-2 border-black bg-[#F7F7F7] font-bold uppercase text-sm placeholder-black focus:outline-none focus:bg-white focus:border-[#854836] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider text-black mb-3">
                      EMAIL
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="TU@EMAIL.COM"
                      className="w-full px-4 py-4 border-2 border-black bg-[#F7F7F7] font-bold uppercase text-sm placeholder-black focus:outline-none focus:bg-white focus:border-[#854836] transition-colors"
                    />
                  </div>

                  {/* Password Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-wider text-black mb-3">
                        CONTRASEÑA
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="CONTRASEÑA"
                        className="w-full px-4 py-4 border-2 border-black bg-[#F7F7F7] font-bold uppercase text-sm placeholder-black focus:outline-none focus:bg-white focus:border-[#854836] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-wider text-black mb-3">
                        CONFIRMAR
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="CONFIRMAR"
                        className="w-full px-4 py-4 border-2 border-black bg-[#F7F7F7] font-bold uppercase text-sm placeholder-black focus:outline-none focus:bg-white focus:border-[#854836] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Terms and Newsletter */}
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="terms"
                        required
                      />
                      <label htmlFor="terms" className="ml-3 text-sm font-bold text-black cursor-pointer leading-relaxed">
                        ACEPTO LOS <span className="text-[#854836] hover:text-[#FF0000] transition-colors underline">TÉRMINOS Y CONDICIONES</span> Y LA <span className="text-[#854836] hover:text-[#FF0000] transition-colors underline">POLÍTICA DE PRIVACIDAD</span>
                      </label>
                    </div>

                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="newsletter"
                      />
                      <label htmlFor="newsletter" className="ml-3 text-sm font-bold uppercase tracking-wider text-black cursor-pointer">
                        QUIERO RECIBIR EL BOLETÍN DIARIO
                      </label>
                    </div>
                  </div>

                  {/* Register Button */}
                  <button
                    type="submit"
                    className="w-full bg-[#854836] text-white py-4 font-bold uppercase text-lg border-2 border-black hover:bg-[#FF0000] transition-colors relative group"
                  >
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#FFB22C] transform rotate-45 group-hover:bg-white transition-colors"></div>
                    CREAR CUENTA GRATIS
                  </button>
                </form>

                <div className="absolute -bottom-3 -right-3 w-0 h-0 border-l-[16px] border-r-[16px] border-b-[16px] border-l-transparent border-r-transparent border-b-black"></div>
              </div>

              {/* Social Registration */}
              <div className="bg-white border-2 border-black p-6 mt-6 relative">
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#854836] transform rotate-45"></div>

                <h3 className="text-lg font-black uppercase tracking-tight text-black mb-4 text-center border-b-2 border-black pb-2">
                  O REGÍSTRATE CON
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button className="bg-[#854836] text-white py-3 font-bold uppercase text-sm border-2 border-black hover:bg-[#FF0000] transition-colors">
                    GOOGLE
                  </button>
                  <button className="bg-[#F7F7F7] text-black py-3 font-bold uppercase text-sm border-2 border-black hover:bg-black hover:text-white transition-colors">
                    FACEBOOK
                  </button>
                </div>
              </div>

              {/* Login Link */}
              <div className="bg-black border-2 border-black p-6 mt-6 text-center relative text-white">
                <div className="absolute -top-1 -left-1 w-4 h-4 bg-[#FF0000] transform rotate-45"></div>

                <h3 className="text-xl font-black uppercase tracking-tight text-white mb-2">
                  ¿YA TIENES CUENTA?
                </h3>
                <p className="text-sm font-bold text-white mb-4">
                  INICIA SESIÓN PARA ACCEDER A TU CUENTA
                </p>

                <Link
                  to="/login"
                  className="inline-block bg-white text-black px-8 py-3 font-bold uppercase text-sm border-2 border-white hover:bg-[#FFB22C] hover:border-black transition-colors relative group"
                >
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#854836] transform rotate-45 group-hover:bg-[#FF0000] transition-colors"></div>
                  INICIAR SESIÓN
                </Link>
              </div>

            </div>

          </div>
        </div>
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