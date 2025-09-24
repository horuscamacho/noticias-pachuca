import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
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
              <nav className="flex items-center justify-center md:justify-end space-x-3 md:space-x-6">
                <Link
                  to="/"
                  className="font-bold uppercase text-xs md:text-sm tracking-wider text-black hover:text-[#854836] transition-colors"
                >
                  INICIO
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

      {/* Main Login Content */}
      <main className="min-h-[calc(100vh-120px)] p-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-[calc(100vh-200px)]">

            {/* Left Side - Welcome/Branding */}
            <div className="hidden lg:flex flex-col justify-center space-y-8">

              {/* Hero Section */}
              <div className="bg-black text-white border-4 border-black p-12 relative">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#FF0000] transform rotate-45"></div>

                <h1 className="text-5xl font-black uppercase tracking-tight text-white leading-tight mb-6">
                  BIENVENIDO A<br />
                  <span className="text-[#FFB22C]">NOTICIAS PACHUCA</span>
                </h1>

                <p className="text-xl font-bold text-white mb-8 leading-relaxed">
                  LA FUENTE MÁS CONFIABLE DE INFORMACIÓN EN HIDALGO. MANTENTE AL DÍA CON LAS NOTICIAS QUE REALMENTE IMPORTAN.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-[#FFB22C] border-2 border-white flex items-center justify-center">
                      <div className="w-4 h-4 bg-black transform rotate-45"></div>
                    </div>
                    <span className="font-bold uppercase text-sm tracking-wider">NOTICIAS EN TIEMPO REAL</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-[#FFB22C] border-2 border-white flex items-center justify-center">
                      <div className="w-4 h-4 bg-black transform rotate-45"></div>
                    </div>
                    <span className="font-bold uppercase text-sm tracking-wider">CONTENIDO EXCLUSIVO</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-[#FFB22C] border-2 border-white flex items-center justify-center">
                      <div className="w-4 h-4 bg-black transform rotate-45"></div>
                    </div>
                    <span className="font-bold uppercase text-sm tracking-wider">REPORTAJES PROFUNDOS</span>
                  </div>
                </div>

                <div className="absolute -bottom-4 -right-4 w-0 h-0 border-l-[24px] border-r-[24px] border-b-[24px] border-l-transparent border-r-transparent border-b-[#FFB22C]"></div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#FFB22C] border-2 border-black p-6 text-center relative">
                  <div className="absolute -top-1 -left-1 w-4 h-4 bg-black transform rotate-45"></div>
                  <div className="text-3xl font-black text-black">50K+</div>
                  <div className="text-xs font-bold uppercase tracking-wider text-black">LECTORES</div>
                </div>
                <div className="bg-[#854836] border-2 border-black p-6 text-center relative">
                  <div className="absolute -top-1 -left-1 w-4 h-4 bg-[#FFB22C] transform rotate-45"></div>
                  <div className="text-3xl font-black text-white">24/7</div>
                  <div className="text-xs font-bold uppercase tracking-wider text-white">COBERTURA</div>
                </div>
                <div className="bg-white border-2 border-black p-6 text-center relative">
                  <div className="absolute -top-1 -left-1 w-4 h-4 bg-[#FF0000] transform rotate-45"></div>
                  <div className="text-3xl font-black text-black">100%</div>
                  <div className="text-xs font-bold uppercase tracking-wider text-black">CONFIABLE</div>
                </div>
              </div>

            </div>

            {/* Right Side - Login Form */}
            <div className="w-full max-w-lg mx-auto lg:mx-0">

              {/* Login Form */}
              <div className="bg-white border-4 border-black p-8 lg:p-12 relative">
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-[#FFB22C] transform rotate-45"></div>

                {/* Header */}
                <div className="text-center mb-8">
                  <h2 className="text-4xl font-black uppercase tracking-tight text-black mb-4">
                    INICIAR SESIÓN
                  </h2>
                  <p className="text-sm font-bold text-[#854836] uppercase tracking-wider">
                    ACCEDE A TU CUENTA DE NOTICIAS PACHUCA
                  </p>
                </div>

                {/* Form */}
                <form className="space-y-6">
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

                  {/* Password Field */}
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider text-black mb-3">
                      CONTRASEÑA
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="TU CONTRASEÑA"
                      className="w-full px-4 py-4 border-2 border-black bg-[#F7F7F7] font-bold uppercase text-sm placeholder-black focus:outline-none focus:bg-white focus:border-[#854836] transition-colors"
                    />
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="remember"
                      />
                      <label htmlFor="remember" className="ml-3 text-sm font-bold uppercase tracking-wider text-black cursor-pointer">
                        RECORDAR
                      </label>
                    </div>
                    <button
                      type="button"
                      className="text-sm font-bold uppercase tracking-wider text-[#854836] hover:text-[#FF0000] transition-colors"
                    >
                      ¿OLVIDASTE?
                    </button>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    className="w-full bg-black text-white py-4 font-bold uppercase text-lg border-2 border-black hover:bg-[#854836] transition-colors relative group"
                  >
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#FFB22C] transform rotate-45 group-hover:bg-[#FF0000] transition-colors"></div>
                    INICIAR SESIÓN
                  </button>
                </form>

                <div className="absolute -bottom-3 -right-3 w-0 h-0 border-l-[16px] border-r-[16px] border-b-[16px] border-l-transparent border-r-transparent border-b-black"></div>
              </div>

              {/* Social Login */}
              <div className="bg-white border-2 border-black p-6 mt-6 relative">
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#854836] transform rotate-45"></div>

                <h3 className="text-lg font-black uppercase tracking-tight text-black mb-4 text-center border-b-2 border-black pb-2">
                  O CONTINÚA CON
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

              {/* Register Link */}
              <div className="bg-[#FFB22C] border-2 border-black p-6 mt-6 text-center relative">
                <div className="absolute -top-1 -left-1 w-4 h-4 bg-black transform rotate-45"></div>

                <h3 className="text-xl font-black uppercase tracking-tight text-black mb-2">
                  ¿NO TIENES CUENTA?
                </h3>
                <p className="text-sm font-bold text-black mb-4">
                  REGÍSTRATE GRATIS Y ACCEDE A CONTENIDO EXCLUSIVO
                </p>

                <Link
                  to="/registro"
                  className="inline-block bg-black text-white px-8 py-3 font-bold uppercase text-sm border-2 border-black hover:bg-[#FF0000] transition-colors relative group"
                >
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-white transform rotate-45 group-hover:bg-[#FFB22C] transition-colors"></div>
                  CREAR CUENTA GRATIS
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