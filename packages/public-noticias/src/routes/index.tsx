import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: NoticiasPage,
})

function NoticiasPage() {
  // Datos mock para el desarrollo
  const mockArticles = [
    {
      id: '1',
      title: 'NUEVO HOSPITAL GENERAL ABRE SUS PUERTAS EN PACHUCA',
      summary: 'El moderno centro médico cuenta con tecnología de última generación y atenderá a más de 500,000 habitantes de la región.',
      category: 'SALUD',
      author: 'MARÍA GARCÍA',
      publishedAt: '2025-01-19T10:30:00Z',
      readTime: '4',
      imageUrl: 'https://via.placeholder.com/800x400/854836/FFFFFF?text=HOSPITAL',
      isFeatured: true,
      isBreaking: false,
    },
    {
      id: '2',
      title: 'INVERSIÓN MILLONARIA PARA INFRAESTRUCTURA VIAL',
      summary: 'El gobierno estatal anunció una inversión de 2,500 millones de pesos para modernizar las principales arterias de Pachuca.',
      category: 'POLÍTICA',
      author: 'CARLOS MENDOZA',
      publishedAt: '2025-01-19T09:15:00Z',
      readTime: '3',
      imageUrl: 'https://via.placeholder.com/400x250/FFB22C/000000?text=CARRETERA',
      isFeatured: false,
      isBreaking: false,
    },
    {
      id: '3',
      title: 'ALERTA ROJA: TEMPERATURAS BAJO CERO ESTA SEMANA',
      summary: 'El Servicio Meteorológico Nacional emite alerta por frente frío que traerá temperaturas de hasta -5°C.',
      category: 'CLIMA',
      author: 'LUIS TORRES',
      publishedAt: '2025-01-19T08:45:00Z',
      readTime: '2',
      imageUrl: 'https://via.placeholder.com/400x250/FF0000/FFFFFF?text=CLIMA',
      isFeatured: false,
      isBreaking: true,
    },
    {
      id: '4',
      title: 'PACHUCA FC BUSCA REFUERZOS PARA EL CLAUSURA 2025',
      summary: 'Los Tuzos evalúan la llegada de tres jugadores extranjeros para fortalecer el plantel.',
      category: 'DEPORTES',
      author: 'FERNANDO SILVA',
      publishedAt: '2025-01-19T07:20:00Z',
      readTime: '5',
      imageUrl: 'https://via.placeholder.com/400x250/854836/FFFFFF?text=FUTBOL',
      isFeatured: false,
      isBreaking: false,
    },
    {
      id: '5',
      title: 'FESTIVAL CULTURAL CELEBRA TRADICIONES HIDALGUENSES',
      summary: 'Más de 200 artistas participarán en el evento que se realizará en el centro histórico de Pachuca.',
      category: 'CULTURA',
      author: 'ANA LÓPEZ',
      publishedAt: '2025-01-19T06:30:00Z',
      readTime: '3',
      imageUrl: 'https://via.placeholder.com/400x250/FFB22C/000000?text=CULTURA',
      isFeatured: false,
      isBreaking: false,
    },
  ]

  const sidebarArticles = [
    {
      id: '6',
      title: 'Nueva Línea de Metrobús Conectará Pachuca con Mineral de la Reforma',
      readTime: '2',
      publishedAt: '2025-01-18T14:00:00Z',
    },
    {
      id: '7',
      title: 'Empresa Hidalguense Desarrolla Tecnología Verde Innovadora',
      readTime: '4',
      publishedAt: '2025-01-18T12:30:00Z',
    },
    {
      id: '8',
      title: 'Récord de Turistas en Prismas Basálticos Durante Vacaciones',
      readTime: '3',
      publishedAt: '2025-01-18T11:15:00Z',
    },
  ]

  const featuredArticle = mockArticles.find(article => article.isFeatured)
  const breakingNews = mockArticles.filter(article => article.isBreaking)
  const regularArticles = mockArticles.filter(article => !article.isFeatured && !article.isBreaking)

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* 🏗️ BRUTALIST HEADER */}
      <header className="bg-white border-b-4 border-black relative">
        {/* Top Bar */}
        <div className="border-b-2 border-black px-4 py-2">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between md:items-center space-y-2 md:space-y-0 text-sm">
            <div className="flex items-center justify-center md:justify-start space-x-2 md:space-x-4">
              <span className="font-bold uppercase tracking-wider text-black text-xs md:text-sm">
                VIE, 19 ENE 2025
              </span>
              <span className="text-[#854836] font-bold text-xs md:text-sm">EDICIÓN DE HOY</span>
            </div>
            <div className="flex items-center justify-center md:justify-end space-x-2 md:space-x-4">
              <span className="text-[#854836] font-bold text-xs md:text-sm">DOW +0.41% ↑</span>
              <Link
                to="/login"
                className="bg-black text-white px-3 md:px-4 py-1 font-bold uppercase text-xs border-2 border-black hover:bg-[#FF0000] transition-colors"
              >
                INICIAR SESIÓN
              </Link>
              <Link
                to="/design-system"
                className="bg-[#854836] text-white px-3 md:px-4 py-1 font-bold uppercase text-xs border-2 border-black hover:bg-[#FF0000] transition-colors"
              >
                DESIGN SYSTEM
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
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-[0.1em] text-black mb-1">
                  NOTICIAS
                </h1>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-[0.1em] text-[#854836]">
                  PACHUCA
                </h2>
                <div className="w-12 md:w-14 lg:w-16 h-1 bg-[#FFB22C] mx-auto mt-2"></div>
                <div className="absolute -bottom-2 -right-2 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] lg:border-l-[12px] lg:border-r-[12px] lg:border-b-[12px] border-l-transparent border-r-transparent border-b-black"></div>
              </div>

              {/* Right side info - Hidden on mobile */}
              <div className="hidden md:flex md:flex-1 text-right order-3">
                <div className="ml-auto">
                  <div className="text-sm font-bold uppercase tracking-wider text-black">
                    HIDALGO, MÉXICO
                  </div>
                  <div className="text-sm text-[#854836] font-bold">
                    ARQUITECTURA DIGITAL
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
              {['LOCAL', 'POLÍTICA', 'DEPORTES', 'ECONOMÍA', 'CULTURA', 'TECNOLOGÍA', 'INTERNACIONAL', 'SALUD'].map((section) => (
                <button
                  key={section}
                  className="font-bold uppercase text-sm tracking-wider hover:text-[#FFB22C] transition-colors relative group"
                >
                  {section}
                  <div className="absolute -bottom-1 left-0 w-0 h-1 bg-[#FFB22C] group-hover:w-full transition-all duration-300"></div>
                </button>
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
                {['LOCAL', 'POLÍTICA', 'DEPORTES', 'ECONOMÍA', 'CULTURA', 'TECNOLOGÍA', 'INTERNACIONAL', 'SALUD'].map((section) => (
                  <button
                    key={section}
                    className="bg-[#854836] text-white px-3 py-2 font-bold uppercase text-xs tracking-wider border border-[#FFB22C] hover:bg-[#FF0000] transition-colors"
                  >
                    {section}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Breaking News Banner */}
      {breakingNews.length > 0 && (
        <div className="bg-[#FF0000] text-white py-3 border-b-4 border-black relative overflow-hidden">
          <div className="absolute left-0 top-0 w-8 h-8 bg-black transform rotate-45 -translate-x-4 -translate-y-4"></div>
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center">
              <div className="bg-white text-[#FF0000] px-4 py-1 font-black uppercase text-sm mr-4 border-2 border-black">
                ÚLTIMO MOMENTO
              </div>
              <div className="font-bold uppercase text-lg tracking-wide">
                {breakingNews[0].title}
              </div>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 w-6 h-6 bg-[#FFB22C] transform rotate-45 translate-x-3 translate-y-3"></div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Main Content Area */}
          <div className="lg:col-span-3">

            {/* Featured Article */}
            {featuredArticle && (
              <article className="bg-white border-4 border-black mb-8 relative">
                <div className="absolute -top-2 -left-2 w-8 h-8 bg-[#FFB22C] transform rotate-45"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 md:p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <span className="bg-[#854836] text-white px-3 py-1 font-bold uppercase text-xs tracking-wider border-2 border-black">
                        {featuredArticle.category}
                      </span>
                      <span className="text-sm text-[#854836] font-bold uppercase">
                        {featuredArticle.readTime} MIN LECTURA
                      </span>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black leading-tight">
                      {featuredArticle.title}
                    </h1>

                    <p className="text-base leading-relaxed text-black font-medium">
                      {featuredArticle.summary}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold uppercase tracking-wider text-[#854836]">
                        POR {featuredArticle.author}
                      </div>
                      <Link
                        to={`/articulo/${featuredArticle.id}`}
                        className="bg-black text-white px-6 py-2 font-bold uppercase text-sm border-2 border-black hover:bg-[#FF0000] transition-colors relative group inline-block"
                      >
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FFB22C] transform rotate-45 group-hover:bg-white transition-colors"></div>
                        LEER MÁS
                      </Link>
                    </div>
                  </div>

                  <div className="relative">
                    <img
                      src={featuredArticle.imageUrl}
                      alt={featuredArticle.title}
                      className="w-full h-64 md:h-full object-cover border-2 border-black"
                    />
                    <div className="absolute bottom-2 right-2 w-6 h-6 bg-[#FF0000] transform rotate-45"></div>
                  </div>
                </div>
              </article>
            )}

            {/* News Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {regularArticles.map((article) => (
                <article key={article.id} className="bg-white border-2 border-black p-4 relative hover:shadow-[4px_4px_0px_0px_#000000] transition-shadow group">
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FFB22C] transform rotate-45 group-hover:bg-[#FF0000] transition-colors"></div>

                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-full h-40 object-cover border-2 border-black mb-4"
                  />

                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-[#854836] text-white px-2 py-1 font-bold uppercase text-xs tracking-wider">
                      {article.category}
                    </span>
                    <span className="text-xs text-[#854836] font-bold uppercase">
                      {article.readTime} MIN
                    </span>
                  </div>

                  <h3 className="text-lg font-bold uppercase tracking-tight text-black mb-2 leading-tight">
                    {article.title}
                  </h3>

                  <p className="text-sm leading-relaxed text-black mb-3">
                    {article.summary}
                  </p>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold uppercase tracking-wider text-[#854836]">
                      {article.author}
                    </span>
                    <Link
                      to={`/articulo/${article.id}`}
                      className="text-black font-bold uppercase hover:text-[#FF0000] transition-colors"
                    >
                      LEER →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">

            {/* En Caso de que te lo Hayas Perdido */}
            <div className="bg-white border-2 border-black p-4 relative">
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-[#FF0000] transform rotate-45"></div>

              <h2 className="text-xl font-black uppercase tracking-tight text-black mb-4 border-b-2 border-black pb-2">
                EN CASO DE QUE<br />TE LO HAYAS PERDIDO
              </h2>

              <div className="space-y-4">
                {sidebarArticles.map((article, index) => (
                  <div key={article.id} className="border-b border-[#F7F7F7] pb-3 last:border-b-0">
                    <h4 className="text-sm font-bold text-black leading-tight mb-2 hover:text-[#854836] transition-colors cursor-pointer">
                      {article.title}
                    </h4>
                    <div className="text-xs text-[#854836] font-bold uppercase">
                      {article.readTime} MIN LECTURA
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div className="bg-[#FFB22C] border-4 border-black p-4 relative">
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-black transform rotate-45"></div>

              <h3 className="text-lg font-black uppercase tracking-tight text-black mb-3">
                BOLETÍN DIARIO
              </h3>

              <p className="text-sm font-bold text-black mb-4">
                RECIBE LAS NOTICIAS MÁS IMPORTANTES DE PACHUCA EN TU EMAIL.
              </p>

              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="TU@EMAIL.COM"
                  className="w-full px-3 py-2 border-2 border-black bg-white font-bold uppercase text-sm placeholder-black focus:outline-none"
                />
                <button className="w-full bg-black text-white py-2 font-bold uppercase text-sm border-2 border-black hover:bg-[#FF0000] transition-colors">
                  SUSCRIBIRSE
                </button>
              </div>
            </div>

            {/* Podcasts */}
            <div className="bg-white border-2 border-black p-4 relative">
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#854836] transform rotate-45"></div>

              <h3 className="text-lg font-black uppercase tracking-tight text-black mb-3 border-b-2 border-black pb-2">
                PODCASTS
              </h3>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-[#FFB22C] border-2 border-black flex items-center justify-center">
                    <div className="w-0 h-0 border-l-[8px] border-l-black border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1"></div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-black">LA MAÑANA</h4>
                    <p className="text-xs text-[#854836] font-bold">LAS NOTICIAS DEL DÍA EN 20 MINUTOS</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-[#854836] border-2 border-black flex items-center justify-center">
                    <div className="w-0 h-0 border-l-[8px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1"></div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-black">LA TARDE</h4>
                    <p className="text-xs text-[#854836] font-bold">ANÁLISIS PROFUNDO DE LA ACTUALIDAD</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black text-white border-t-4 border-[#FFB22C] mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">

            {/* Secciones */}
            <div>
              <h4 className="font-black uppercase text-[#FFB22C] mb-3 tracking-wider">SECCIONES</h4>
              <ul className="space-y-2 text-sm">
                {['Página Principal', 'LOCAL', 'POLÍTICA', 'DEPORTES', 'ECONOMÍA', 'CULTURA', 'TECNOLOGÍA'].map((item) => (
                  <li key={item}>
                    <button className="hover:text-[#FFB22C] transition-colors uppercase font-bold">{item}</button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Multimedia */}
            <div>
              <h4 className="font-black uppercase text-[#FFB22C] mb-3 tracking-wider">MULTIMEDIA</h4>
              <ul className="space-y-2 text-sm">
                {['PODCASTS', 'VIDEOS', 'FOTOGRAFÍA', 'GALERÍA', 'EN VIVO'].map((item) => (
                  <li key={item}>
                    <button className="hover:text-[#FFB22C] transition-colors uppercase font-bold">{item}</button>
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
                {['CONTACTO', 'PUBLICIDAD', 'SUSCRIPCIONES', 'AVISO DE PRIVACIDAD', 'TÉRMINOS DE USO'].map((item) => (
                  <li key={item}>
                    <button className="hover:text-[#FFB22C] transition-colors uppercase font-bold">{item}</button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Logo Footer */}
            <div className="text-center">
              <div className="border-2 border-[#FFB22C] p-4 relative">
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
              ARQUITECTURA DIGITAL BRUTALIST | HIDALGO, MÉXICO
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}