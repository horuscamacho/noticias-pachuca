import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/articulo/$id')({
  component: ArticuloPage,
})

function ArticuloPage() {
  const { id } = Route.useParams()

  // Mock data para el artículo individual
  const mockArticle = {
    id: id,
    title: 'NUEVO HOSPITAL GENERAL ABRE SUS PUERTAS EN PACHUCA',
    summary: 'El moderno centro médico cuenta con tecnología de última generación y atenderá a más de 500,000 habitantes de la región.',
    content: `
      <p>El nuevo Hospital General de Pachuca abrió oficialmente sus puertas el día de ayer, marcando un hito histórico en la atención médica de la región. Esta moderna instalación, construida con una inversión de 3,500 millones de pesos, promete revolucionar la atención sanitaria en el estado de Hidalgo.</p>

      <p>El hospital cuenta con 200 camas, 15 quirófanos equipados con la más alta tecnología, una unidad de cuidados intensivos de 30 camas y un área de urgencias con capacidad para atender 24 horas al día, los 365 días del año.</p>

      <p>"Este hospital representa una nueva era en la medicina hidalguense", declaró el director general del nosocomio, Dr. Ricardo Hernández. "Contamos con equipos de resonancia magnética, tomografía computarizada y un laboratorio de análisis clínicos que puede procesar más de 1,000 muestras diarias".</p>

      <p>Entre las especialidades que ofrecerá el hospital se encuentran cardiología, neurología, oncología, ginecología, pediatría, ortopedia y traumatología, así como servicios de medicina interna y cirugía general.</p>

      <p>El proyecto de construcción comenzó en 2022 y empleó a más de 800 trabajadores locales durante su edificación. El hospital también generará aproximadamente 1,200 empleos directos entre médicos, enfermeras, técnicos y personal administrativo.</p>

      <p>La apertura de este centro médico significa que los pacientes de Pachuca y municipios aledaños ya no tendrán que trasladarse a la Ciudad de México para recibir atención especializada de alta complejidad.</p>

      <p>El Hospital General de Pachuca funcionará en coordinación con el Sistema Estatal de Salud y recibirá tanto a pacientes del sector público como privado, garantizando acceso universal a servicios médicos de calidad.</p>
    `,
    category: 'SALUD',
    author: 'MARÍA GARCÍA',
    publishedAt: '2025-01-19T10:30:00Z',
    readTime: '4',
    imageUrl: 'https://via.placeholder.com/1200x600/854836/FFFFFF?text=HOSPITAL+GENERAL+PACHUCA',
    tags: ['SALUD', 'PACHUCA', 'HOSPITAL', 'MEDICINA', 'HIDALGO'],
  }

  const relatedArticles = [
    {
      id: '2',
      title: 'INVERSIÓN MILLONARIA PARA INFRAESTRUCTURA VIAL',
      category: 'POLÍTICA',
      readTime: '3',
      imageUrl: 'https://via.placeholder.com/300x200/FFB22C/000000?text=CARRETERA',
    },
    {
      id: '5',
      title: 'FESTIVAL CULTURAL CELEBRA TRADICIONES HIDALGUENSES',
      category: 'CULTURA',
      readTime: '3',
      imageUrl: 'https://via.placeholder.com/300x200/FFB22C/000000?text=CULTURA',
    },
    {
      id: '4',
      title: 'PACHUCA FC BUSCA REFUERZOS PARA EL CLAUSURA 2025',
      category: 'DEPORTES',
      readTime: '5',
      imageUrl: 'https://via.placeholder.com/300x200/854836/FFFFFF?text=FUTBOL',
    },
  ]

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* 🏗️ BRUTALIST HEADER SIMPLIFICADO */}
      <header className="bg-white border-b-4 border-black relative">
        <div className="px-4 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
              {/* Logo */}
              <Link to="/" className="flex items-center justify-center lg:justify-start space-x-2 lg:space-x-4 relative">
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-[#FF0000] transform rotate-45"></div>
                <h1 className="text-xl lg:text-2xl font-black uppercase tracking-[0.1em] text-black">
                  NOTICIAS
                </h1>
                <h2 className="text-xl lg:text-2xl font-black uppercase tracking-[0.1em] text-[#854836]">
                  PACHUCA
                </h2>
                <div className="w-6 lg:w-8 h-1 bg-[#FFB22C]"></div>
              </Link>

              {/* Navigation Links */}
              <nav className="flex items-center justify-center lg:justify-end space-x-3 lg:space-x-6">
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

      {/* Breadcrumb */}
      <div className="bg-black text-white py-2">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center space-x-2 text-sm font-bold uppercase tracking-wider">
            <Link to="/" className="hover:text-[#FFB22C] transition-colors">
              INICIO
            </Link>
            <span className="text-[#FFB22C]">→</span>
            <span className="text-[#FFB22C]">{mockArticle.category}</span>
            <span className="text-[#FFB22C]">→</span>
            <span className="text-[#FFB22C]">ARTÍCULO</span>
          </div>
        </div>
      </div>

      {/* Main Article */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Article Content */}
          <article className="lg:col-span-3">

            {/* Article Header */}
            <div className="bg-white border-4 border-black p-6 mb-8 relative">
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-[#FFB22C] transform rotate-45"></div>

              {/* Category and Meta */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <span className="bg-[#854836] text-white px-4 py-2 font-bold uppercase text-sm tracking-wider border-2 border-black">
                    {mockArticle.category}
                  </span>
                  <span className="text-sm text-[#854836] font-bold uppercase">
                    {mockArticle.readTime} MIN LECTURA
                  </span>
                </div>
                <div className="text-sm font-bold uppercase tracking-wider text-black">
                  19 DE ENERO 2025
                </div>
              </div>

              {/* Title */}
              <h1 className="text-2xl lg:text-4xl xl:text-5xl font-black uppercase tracking-tight text-black leading-tight mb-4">
                {mockArticle.title}
              </h1>

              {/* Summary */}
              <p className="text-xl leading-relaxed text-black font-medium mb-6">
                {mockArticle.summary}
              </p>

              {/* Author and Actions */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-t-2 border-black pt-4 space-y-4 lg:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-[#854836] border-2 border-black flex items-center justify-center">
                    <span className="text-white font-black text-lg">
                      {mockArticle.author.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-bold uppercase tracking-wider text-black">
                      POR {mockArticle.author}
                    </div>
                    <div className="text-xs text-[#854836] font-bold uppercase">
                      REPORTERO SENIOR
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 lg:space-x-4">
                  <button className="bg-black text-white px-4 py-2 font-bold uppercase text-sm border-2 border-black hover:bg-[#FF0000] transition-colors">
                    COMPARTIR
                  </button>
                  <button className="bg-[#FFB22C] text-black px-4 py-2 font-bold uppercase text-sm border-2 border-black hover:bg-[#FF0000] hover:text-white transition-colors">
                    GUARDAR
                  </button>
                </div>
              </div>

              <div className="absolute -bottom-3 -right-3 w-0 h-0 border-l-[16px] border-r-[16px] border-b-[16px] border-l-transparent border-r-transparent border-b-black"></div>
            </div>

            {/* Featured Image */}
            <div className="bg-white border-2 border-black mb-8 relative">
              <div className="absolute -top-1 -left-1 w-6 h-6 bg-[#FF0000] transform rotate-45"></div>
              <img
                src={mockArticle.imageUrl}
                alt={mockArticle.title}
                className="w-full h-48 lg:h-96 object-cover"
              />
              <div className="p-4 border-t-2 border-black">
                <p className="text-sm font-bold uppercase text-[#854836] tracking-wider">
                  EL NUEVO HOSPITAL GENERAL DE PACHUCA CUENTA CON TECNOLOGÍA DE ÚLTIMA GENERACIÓN
                </p>
              </div>
            </div>

            {/* Article Body */}
            <div className="bg-white border-2 border-black p-8 mb-8 relative">
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FFB22C] transform rotate-45"></div>

              <div
                className="prose prose-lg max-w-none"
                style={{
                  fontFamily: 'inherit',
                  lineHeight: '1.8',
                }}
                dangerouslySetInnerHTML={{
                  __html: mockArticle.content.split('\n').map(paragraph =>
                    paragraph.trim() ? `<p style="margin-bottom: 1.5rem; font-size: 1.1rem; color: #000; font-weight: 500;">${paragraph.trim()}</p>` : ''
                  ).join('')
                }}
              />
            </div>

            {/* Tags */}
            <div className="bg-[#FFB22C] border-2 border-black p-4 mb-8 relative">
              <div className="absolute -top-1 -left-1 w-4 h-4 bg-black transform rotate-45"></div>
              <h3 className="text-lg font-black uppercase tracking-tight text-black mb-3">
                ETIQUETAS
              </h3>
              <div className="flex flex-wrap gap-2">
                {mockArticle.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-white text-black px-3 py-1 font-bold uppercase text-sm border-2 border-black hover:bg-black hover:text-white transition-colors cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">

            {/* Related Articles */}
            <div className="bg-white border-2 border-black p-4 relative">
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-[#FF0000] transform rotate-45"></div>

              <h2 className="text-xl font-black uppercase tracking-tight text-black mb-4 border-b-2 border-black pb-2">
                ARTÍCULOS<br />RELACIONADOS
              </h2>

              <div className="space-y-4">
                {relatedArticles.map((article) => (
                  <Link
                    key={article.id}
                    to={`/articulo/${article.id}`}
                    className="block border-b border-[#F7F7F7] pb-3 last:border-b-0 group"
                  >
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-32 object-cover border-2 border-black mb-2"
                    />
                    <span className="bg-[#854836] text-white px-2 py-1 font-bold uppercase text-xs tracking-wider">
                      {article.category}
                    </span>
                    <h4 className="text-sm font-bold text-black leading-tight mt-2 mb-1 group-hover:text-[#854836] transition-colors">
                      {article.title}
                    </h4>
                    <div className="text-xs text-[#854836] font-bold uppercase">
                      {article.readTime} MIN LECTURA
                    </div>
                  </Link>
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

            {/* Back to Top */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-full bg-black text-white py-3 font-bold uppercase text-sm border-2 border-black hover:bg-[#854836] transition-colors relative"
            >
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FFB22C] transform rotate-45"></div>
              ↑ VOLVER ARRIBA
            </button>

          </aside>
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