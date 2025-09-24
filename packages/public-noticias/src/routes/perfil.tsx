import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/perfil')({
  component: PerfilPage,
})

function PerfilPage() {
  // Mock user data
  const userData = {
    nombre: 'MARÍA',
    apellido: 'RODRÍGUEZ',
    email: 'maria.rodriguez@email.com',
    fechaRegistro: '2023-03-15',
    avatar: 'MR',
    tipoSuscripcion: 'PREMIUM',
    articulosLeidos: 247,
    tiempoLectura: '18h 32m',
    categoriasFavoritas: ['POLÍTICA', 'ECONOMÍA', 'CULTURA'],
    notificaciones: {
      email: true,
      push: false,
      newsletter: true,
    }
  }

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
                  to="/perfil"
                  className="bg-[#854836] text-white px-3 md:px-4 py-2 font-bold uppercase text-xs border-2 border-black"
                >
                  MI PERFIL
                </Link>
                <button className="bg-black text-white px-3 md:px-4 py-2 font-bold uppercase text-xs border-2 border-black hover:bg-[#FF0000] transition-colors">
                  CERRAR SESIÓN
                </button>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Profile Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* Profile Header */}
        <div className="bg-white border-4 border-black mb-8 relative">
          <div className="absolute -top-3 -left-3 w-8 h-8 bg-[#FFB22C] transform rotate-45"></div>

          <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center space-y-6 md:space-y-0 md:space-x-8">

              {/* Avatar */}
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <div className="w-32 h-32 bg-[#854836] border-4 border-black flex items-center justify-center relative">
                  <span className="text-white font-black text-4xl">
                    {userData.avatar}
                  </span>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#FFB22C] border-2 border-black flex items-center justify-center">
                    <div className="w-4 h-4 bg-black transform rotate-45"></div>
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl font-black uppercase tracking-tight text-black mb-2">
                  {userData.nombre} {userData.apellido}
                </h1>
                <p className="text-lg font-bold text-[#854836] uppercase tracking-wider mb-4">
                  {userData.email}
                </p>

                <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-6">
                  <div className="bg-[#FFB22C] text-black px-4 py-2 border-2 border-black inline-block">
                    <span className="font-bold uppercase text-sm tracking-wider">
                      SUSCRIPCIÓN: {userData.tipoSuscripcion}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-black uppercase tracking-wider">
                    MIEMBRO DESDE: {new Date(userData.fechaRegistro).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }).toUpperCase()}
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="absolute -bottom-3 -right-3 w-0 h-0 border-l-[16px] border-r-[16px] border-b-[16px] border-l-transparent border-r-transparent border-b-black"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column - Stats and Reading */}
          <div className="lg:col-span-2 space-y-8">

            {/* Reading Stats */}
            <div className="bg-white border-2 border-black p-6 relative">
              <div className="absolute -top-1 -left-1 w-4 h-4 bg-[#FF0000] transform rotate-45"></div>

              <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-6 border-b-2 border-black pb-2">
                ESTADÍSTICAS DE LECTURA
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#854836] text-white p-6 border-2 border-black text-center relative">
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FFB22C] transform rotate-45"></div>
                  <div className="text-3xl font-black mb-2">{userData.articulosLeidos}</div>
                  <div className="text-sm font-bold uppercase tracking-wider">ARTÍCULOS LEÍDOS</div>
                </div>

                <div className="bg-[#FFB22C] text-black p-6 border-2 border-black text-center relative">
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-black transform rotate-45"></div>
                  <div className="text-3xl font-black mb-2">{userData.tiempoLectura}</div>
                  <div className="text-sm font-bold uppercase tracking-wider">TIEMPO TOTAL</div>
                </div>

                <div className="bg-black text-white p-6 border-2 border-black text-center relative">
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF0000] transform rotate-45"></div>
                  <div className="text-3xl font-black mb-2">{userData.categoriasFavoritas.length}</div>
                  <div className="text-sm font-bold uppercase tracking-wider">CATEGORÍAS FAVORITAS</div>
                </div>
              </div>
            </div>

            {/* Favorite Categories */}
            <div className="bg-white border-2 border-black p-6 relative">
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#854836] transform rotate-45"></div>

              <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-6 border-b-2 border-black pb-2">
                CATEGORÍAS FAVORITAS
              </h2>

              <div className="flex flex-wrap gap-3">
                {userData.categoriasFavoritas.map((categoria) => (
                  <span
                    key={categoria}
                    className="bg-[#854836] text-white px-4 py-2 font-bold uppercase text-sm border-2 border-black relative group cursor-pointer hover:bg-[#FF0000] transition-colors"
                  >
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FFB22C] transform rotate-45 group-hover:bg-white transition-colors"></div>
                    {categoria}
                  </span>
                ))}
                <button className="bg-[#F7F7F7] text-black px-4 py-2 font-bold uppercase text-sm border-2 border-black hover:bg-black hover:text-white transition-colors">
                  + AGREGAR
                </button>
              </div>
            </div>

            {/* Recent Reading History */}
            <div className="bg-white border-2 border-black p-6 relative">
              <div className="absolute -top-1 -left-1 w-4 h-4 bg-[#FFB22C] transform rotate-45"></div>

              <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-6 border-b-2 border-black pb-2">
                HISTORIAL RECIENTE
              </h2>

              <div className="space-y-4">
                {[
                  { titulo: 'NUEVO HOSPITAL GENERAL ABRE SUS PUERTAS EN PACHUCA', categoria: 'SALUD', fecha: '2025-01-19' },
                  { titulo: 'INVERSIÓN MILLONARIA PARA INFRAESTRUCTURA VIAL', categoria: 'POLÍTICA', fecha: '2025-01-18' },
                  { titulo: 'PACHUCA FC BUSCA REFUERZOS PARA EL CLAUSURA 2025', categoria: 'DEPORTES', fecha: '2025-01-17' },
                ].map((articulo, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-black hover:bg-[#F7F7F7] transition-colors">
                    <div className="flex-1">
                      <h3 className="font-bold text-black text-sm mb-1">{articulo.titulo}</h3>
                      <div className="flex items-center space-x-4 text-xs">
                        <span className="bg-[#854836] text-white px-2 py-1 font-bold uppercase">
                          {articulo.categoria}
                        </span>
                        <span className="text-[#854836] font-bold uppercase">
                          {new Date(articulo.fecha).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    </div>
                    <button className="text-black font-bold uppercase text-xs hover:text-[#FF0000] transition-colors">
                      LEER →
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column - Settings and Preferences */}
          <div className="space-y-8">

            {/* Account Settings */}
            <div className="bg-white border-2 border-black p-6 relative">
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF0000] transform rotate-45"></div>

              <h2 className="text-xl font-black uppercase tracking-tight text-black mb-6 border-b-2 border-black pb-2">
                CONFIGURACIÓN
              </h2>

              <div className="space-y-4">
                <button className="w-full bg-[#854836] text-white py-3 font-bold uppercase text-sm border-2 border-black hover:bg-[#FF0000] transition-colors text-left px-4">
                  EDITAR PERFIL
                </button>
                <button className="w-full bg-[#F7F7F7] text-black py-3 font-bold uppercase text-sm border-2 border-black hover:bg-black hover:text-white transition-colors text-left px-4">
                  CAMBIAR CONTRASEÑA
                </button>
                <button className="w-full bg-[#F7F7F7] text-black py-3 font-bold uppercase text-sm border-2 border-black hover:bg-black hover:text-white transition-colors text-left px-4">
                  GESTIONAR SUSCRIPCIÓN
                </button>
                <button className="w-full bg-[#F7F7F7] text-black py-3 font-bold uppercase text-sm border-2 border-black hover:bg-black hover:text-white transition-colors text-left px-4">
                  DESCARGAR DATOS
                </button>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white border-2 border-black p-6 relative">
              <div className="absolute -top-1 -left-1 w-4 h-4 bg-[#854836] transform rotate-45"></div>

              <h2 className="text-xl font-black uppercase tracking-tight text-black mb-6 border-b-2 border-black pb-2">
                NOTIFICACIONES
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="font-bold uppercase text-sm tracking-wider text-black">
                    EMAIL
                  </label>
                  <input
                    type="checkbox"
                    checked={userData.notificaciones.email}
                    readOnly
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="font-bold uppercase text-sm tracking-wider text-black">
                    PUSH
                  </label>
                  <input
                    type="checkbox"
                    checked={userData.notificaciones.push}
                    readOnly
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="font-bold uppercase text-sm tracking-wider text-black">
                    NEWSLETTER
                  </label>
                  <input
                    type="checkbox"
                    checked={userData.notificaciones.newsletter}
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#FFB22C] border-2 border-black p-6 relative">
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-black transform rotate-45"></div>

              <h2 className="text-xl font-black uppercase tracking-tight text-black mb-6 border-b-2 border-black pb-2">
                ACCIONES RÁPIDAS
              </h2>

              <div className="space-y-3">
                <Link
                  to="/"
                  className="block w-full bg-black text-white py-3 font-bold uppercase text-sm border-2 border-black hover:bg-[#FF0000] transition-colors text-center"
                >
                  IR A INICIO
                </Link>
                <button className="w-full bg-white text-black py-3 font-bold uppercase text-sm border-2 border-black hover:bg-black hover:text-white transition-colors">
                  COMPARTIR PERFIL
                </button>
                <button className="w-full bg-white text-black py-3 font-bold uppercase text-sm border-2 border-black hover:bg-black hover:text-white transition-colors">
                  INVITAR AMIGOS
                </button>
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