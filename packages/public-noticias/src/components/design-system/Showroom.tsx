import React from 'react';

/**
 * NOTICIAS PACHUCA - DESIGN SYSTEM SHOWROOM
 * Brutalist News Digital - Guía de Estilos Completa
 *
 * Adaptación del design system móvil para web
 * Basado en arquitectura digital brutalist
 */

// Design Tokens - Sistema de colores exacto del móvil
const colors = {
  background: '#F7F7F7',    // Light gray background
  accent: '#FFB22C',        // Orange/yellow accent for highlights
  primary: '#854836',       // Brown primary for headlines
  text: '#000000',          // Pure black text for maximum contrast
  white: '#FFFFFF',         // Pure white for cards
  red: '#FF0000',           // Breaking news red for urgent alerts
} as const;

// Typography Scale - Adaptada para web con proporciones brutalist
const Typography: React.FC = () => (
  <section className="mb-16">
    <h2 className="text-2xl font-bold mb-8 text-[#854836] uppercase tracking-wider">
      TIPOGRAFÍA BRUTALIST
    </h2>

    <div className="space-y-8 bg-white p-8 border-4 border-black">
      {/* Headlines */}
      <div>
        <h3 className="text-lg font-bold mb-4 uppercase tracking-wide">Headlines</h3>
        <h1 className="text-6xl font-black uppercase tracking-wider text-black leading-none mb-2">
          TITULAR PRINCIPAL
        </h1>
        <h2 className="text-4xl font-bold uppercase tracking-wide text-[#854836] leading-tight mb-2">
          SUBTITULAR SECCIÓN
        </h2>
        <h3 className="text-2xl font-bold uppercase tracking-wide text-black leading-tight">
          TÍTULO DE ARTÍCULO
        </h3>
      </div>

      {/* Body Text */}
      <div>
        <h3 className="text-lg font-bold mb-4 uppercase tracking-wide">Texto de Cuerpo</h3>
        <p className="text-lg leading-relaxed text-black mb-4">
          Este es el texto principal para artículos. Optimizado para lectura con alto contraste.
          La tipografía mantiene la estética brutalist pero prioriza la legibilidad.
        </p>
        <p className="text-base leading-relaxed text-black mb-4">
          Texto secundario para descripciones y contenido de soporte.
          Mantiene la claridad sin perder el carácter industrial del design system.
        </p>
      </div>

      {/* Labels y Metadata */}
      <div>
        <h3 className="text-lg font-bold mb-4 uppercase tracking-wide">Labels y Metadata</h3>
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#854836] bg-[#F7F7F7] px-3 py-1">
            CATEGORÍA
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-white bg-[#FF0000] px-3 py-1">
            ÚLTIMO MOMENTO
          </span>
          <span className="text-sm text-black">
            Por: REDACCIÓN PACHUCA | 19 SEP 2024 | 14:30
          </span>
        </div>
      </div>
    </div>
  </section>
);

// Color Palette con casos de uso específicos
const ColorPalette: React.FC = () => (
  <section className="mb-16">
    <h2 className="text-2xl font-bold mb-8 text-[#854836] uppercase tracking-wider">
      PALETA DE COLORES
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Object.entries(colors).map(([name, color]) => (
        <div key={name} className="bg-white border-4 border-black p-6">
          <div
            className="w-full h-20 border-2 border-black mb-4"
            style={{ backgroundColor: color }}
          />
          <h3 className="font-bold uppercase tracking-wide text-black">{name}</h3>
          <p className="text-sm text-black font-mono">{color}</p>
          <div className="mt-2 text-xs text-[#854836] uppercase tracking-wide">
            {getColorUsage(name)}
          </div>
        </div>
      ))}
    </div>
  </section>
);

// Función helper para casos de uso de colores
const getColorUsage = (colorName: string): string => {
  const usages: Record<string, string> = {
    background: 'Fondo general, espacios negativos',
    accent: 'Highlights, CTAs, elementos interactivos',
    primary: 'Títulos principales, navegación',
    text: 'Texto principal, máximo contraste',
    white: 'Cards, contenido, elementos destacados',
    red: 'Breaking news, alertas urgentes'
  };
  return usages[colorName] || '';
};

// Article Cards - Componentes específicos para noticias
const ArticleCards: React.FC = () => (
  <section className="mb-16">
    <h2 className="text-2xl font-bold mb-8 text-[#854836] uppercase tracking-wider">
      TARJETAS DE ARTÍCULOS
    </h2>

    <div className="space-y-8">
      {/* Featured Article Card */}
      <div className="bg-white border-4 border-black p-8">
        <h3 className="text-lg font-bold mb-6 uppercase tracking-wide">Featured Article</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="bg-[#F7F7F7] h-48 border-2 border-black mb-4 flex items-center justify-center">
              <span className="text-[#854836] font-bold">IMAGEN PRINCIPAL</span>
            </div>
          </div>
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-white bg-[#FF0000] px-2 py-1">
              ÚLTIMO MOMENTO
            </span>
            <h3 className="text-2xl font-bold uppercase tracking-wide text-black leading-tight">
              TÍTULO DEL ARTÍCULO PRINCIPAL DE ÚLTIMA HORA
            </h3>
            <p className="text-base text-black leading-relaxed">
              Resumen del artículo que proporciona contexto suficiente para captar la atención del lector...
            </p>
            <div className="text-xs text-[#854836] uppercase tracking-wide">
              POLÍTICA | 19 SEP 2024 | 14:30
            </div>
          </div>
        </div>
      </div>

      {/* Standard Article Cards Grid */}
      <div className="bg-white border-4 border-black p-8">
        <h3 className="text-lg font-bold mb-6 uppercase tracking-wide">Standard Articles</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-2 border-black">
              <div className="bg-[#F7F7F7] h-32 border-b-2 border-black flex items-center justify-center">
                <span className="text-[#854836] font-bold text-sm">IMAGEN</span>
              </div>
              <div className="p-4 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#854836] bg-[#F7F7F7] px-2 py-1">
                  DEPORTES
                </span>
                <h4 className="text-lg font-bold uppercase tracking-wide text-black leading-tight">
                  TÍTULO DEL ARTÍCULO ESTÁNDAR
                </h4>
                <p className="text-sm text-black leading-relaxed">
                  Resumen breve que proporciona contexto...
                </p>
                <div className="text-xs text-[#854836]">
                  19 SEP | 14:30
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compact Article List */}
      <div className="bg-white border-4 border-black p-8">
        <h3 className="text-lg font-bold mb-6 uppercase tracking-wide">Compact List</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-4 border-b-2 border-[#F7F7F7] pb-4">
              <div className="bg-[#F7F7F7] w-16 h-16 border-2 border-black flex-shrink-0 flex items-center justify-center">
                <span className="text-[#854836] font-bold text-xs">IMG</span>
              </div>
              <div className="flex-1 space-y-2">
                <h5 className="text-base font-bold uppercase tracking-wide text-black leading-tight">
                  TÍTULO COMPACTO DE NOTICIA
                </h5>
                <div className="text-xs text-[#854836] uppercase tracking-wide">
                  ECONOMÍA | 14:30
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

// Navigation Patterns
const NavigationPatterns: React.FC = () => (
  <section className="mb-16">
    <h2 className="text-2xl font-bold mb-8 text-[#854836] uppercase tracking-wider">
      PATRONES DE NAVEGACIÓN
    </h2>

    <div className="space-y-8">
      {/* Main Header */}
      <div className="bg-white border-4 border-black p-6">
        <h3 className="text-lg font-bold mb-4 uppercase tracking-wide">Header Principal</h3>
        <div className="bg-black text-white p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-black uppercase tracking-wider">
              NOTICIAS PACHUCA
            </h1>
            <div className="flex gap-4">
              <button className="bg-[#FFB22C] text-black px-4 py-2 font-bold uppercase text-sm tracking-wide">
                SUSCRIBIRSE
              </button>
              <div className="bg-white text-black px-3 py-2 text-sm font-bold">
                BUSCAR
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="bg-white border-4 border-black p-6">
        <h3 className="text-lg font-bold mb-4 uppercase tracking-wide">Navegación de Categorías</h3>
        <div className="bg-[#F7F7F7] border-2 border-black p-4">
          <div className="flex flex-wrap gap-2">
            {['POLÍTICA', 'DEPORTES', 'ECONOMÍA', 'CULTURA', 'TECNOLOGÍA'].map((cat) => (
              <button key={cat} className="bg-black text-white px-4 py-2 font-bold uppercase text-sm tracking-wide hover:bg-[#854836]">
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="bg-white border-4 border-black p-6">
        <h3 className="text-lg font-bold mb-4 uppercase tracking-wide">Breadcrumbs</h3>
        <div className="text-sm uppercase tracking-wide">
          <span className="text-[#854836] font-bold">INICIO</span>
          <span className="mx-2 text-black">▸</span>
          <span className="text-[#854836] font-bold">POLÍTICA</span>
          <span className="mx-2 text-black">▸</span>
          <span className="text-black font-bold">ARTÍCULO ACTUAL</span>
        </div>
      </div>
    </div>
  </section>
);

// Breaking News Banner
const BreakingNewsBanner: React.FC = () => (
  <section className="mb-16">
    <h2 className="text-2xl font-bold mb-8 text-[#854836] uppercase tracking-wider">
      BANNERS DE ÚLTIMO MOMENTO
    </h2>

    <div className="space-y-6">
      <div className="bg-[#FF0000] text-white p-4 border-4 border-black">
        <div className="flex items-center gap-4">
          <span className="bg-white text-[#FF0000] px-3 py-1 font-black uppercase text-sm tracking-wider">
            URGENTE
          </span>
          <p className="font-bold uppercase tracking-wide flex-1">
            NOTICIA DE ÚLTIMO MOMENTO QUE REQUIERE ATENCIÓN INMEDIATA
          </p>
          <button className="bg-black text-white px-3 py-1 font-bold uppercase text-sm">
            VER MÁS
          </button>
        </div>
      </div>

      <div className="bg-[#FFB22C] text-black p-4 border-4 border-black">
        <div className="flex items-center gap-4">
          <span className="bg-black text-[#FFB22C] px-3 py-1 font-black uppercase text-sm tracking-wider">
            DESTACADO
          </span>
          <p className="font-bold uppercase tracking-wide flex-1">
            NOTICIA IMPORTANTE QUE MERECE ATENCIÓN ESPECIAL
          </p>
        </div>
      </div>
    </div>
  </section>
);

// Buttons & CTAs
const ButtonsAndCTAs: React.FC = () => (
  <section className="mb-16">
    <h2 className="text-2xl font-bold mb-8 text-[#854836] uppercase tracking-wider">
      BOTONES Y LLAMADAS A LA ACCIÓN
    </h2>

    <div className="bg-white border-4 border-black p-8">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Primary Button */}
        <div className="space-y-4">
          <h3 className="font-bold uppercase tracking-wide text-sm">Primary</h3>
          <button className="w-full bg-black text-white px-6 py-3 font-bold uppercase tracking-wide border-2 border-black hover:bg-[#854836]">
            LEER MÁS
          </button>
        </div>

        {/* Secondary Button */}
        <div className="space-y-4">
          <h3 className="font-bold uppercase tracking-wide text-sm">Secondary</h3>
          <button className="w-full bg-white text-black px-6 py-3 font-bold uppercase tracking-wide border-2 border-black hover:bg-[#F7F7F7]">
            COMPARTIR
          </button>
        </div>

        {/* Accent Button */}
        <div className="space-y-4">
          <h3 className="font-bold uppercase tracking-wide text-sm">Accent</h3>
          <button className="w-full bg-[#FFB22C] text-black px-6 py-3 font-bold uppercase tracking-wide border-2 border-black hover:bg-[#e6a028]">
            SUSCRIBIRSE
          </button>
        </div>

        {/* Destructive Button */}
        <div className="space-y-4">
          <h3 className="font-bold uppercase tracking-wide text-sm">Urgente</h3>
          <button className="w-full bg-[#FF0000] text-white px-6 py-3 font-bold uppercase tracking-wide border-2 border-black">
            VER AHORA
          </button>
        </div>

        {/* Small Button */}
        <div className="space-y-4">
          <h3 className="font-bold uppercase tracking-wide text-sm">Small</h3>
          <button className="bg-black text-white px-4 py-2 font-bold uppercase tracking-wide text-sm border-2 border-black">
            VER MÁS
          </button>
        </div>

        {/* Icon Button */}
        <div className="space-y-4">
          <h3 className="font-bold uppercase tracking-wide text-sm">Social</h3>
          <div className="flex gap-2">
            <button className="bg-black text-white p-3 border-2 border-black">
              FB
            </button>
            <button className="bg-black text-white p-3 border-2 border-black">
              TW
            </button>
            <button className="bg-black text-white p-3 border-2 border-black">
              IG
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// Form Elements
const FormElements: React.FC = () => (
  <section className="mb-16">
    <h2 className="text-2xl font-bold mb-8 text-[#854836] uppercase tracking-wider">
      ELEMENTOS DE FORMULARIO
    </h2>

    <div className="bg-white border-4 border-black p-8">
      <div className="space-y-8">
        {/* Newsletter Signup */}
        <div>
          <h3 className="text-lg font-bold mb-4 uppercase tracking-wide">Newsletter</h3>
          <div className="bg-[#F7F7F7] border-2 border-black p-6">
            <h4 className="text-xl font-bold uppercase tracking-wide text-black mb-4">
              SUSCRÍBETE A NUESTRO BOLETÍN
            </h4>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="TU EMAIL"
                className="flex-1 px-4 py-3 border-2 border-black font-bold uppercase text-sm tracking-wide placeholder:text-[#854836]"
              />
              <button className="bg-[#FFB22C] text-black px-6 py-3 font-bold uppercase tracking-wide border-2 border-black">
                SUSCRIBIR
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div>
          <h3 className="text-lg font-bold mb-4 uppercase tracking-wide">Búsqueda</h3>
          <div className="flex">
            <input
              type="search"
              placeholder="BUSCAR NOTICIAS..."
              className="flex-1 px-4 py-3 border-2 border-black font-bold uppercase text-sm tracking-wide placeholder:text-[#854836]"
            />
            <button className="bg-black text-white px-6 py-3 font-bold uppercase tracking-wide border-2 border-black border-l-0">
              BUSCAR
            </button>
          </div>
        </div>

        {/* Filters */}
        <div>
          <h3 className="text-lg font-bold mb-4 uppercase tracking-wide">Filtros</h3>
          <div className="space-y-4">
            <select className="w-full px-4 py-3 border-2 border-black font-bold uppercase text-sm tracking-wide bg-white">
              <option>TODAS LAS CATEGORÍAS</option>
              <option>POLÍTICA</option>
              <option>DEPORTES</option>
              <option>ECONOMÍA</option>
            </select>

            <div className="flex gap-4">
              <select className="flex-1 px-4 py-3 border-2 border-black font-bold uppercase text-sm tracking-wide bg-white">
                <option>FECHA</option>
                <option>HOY</option>
                <option>ESTA SEMANA</option>
                <option>ESTE MES</option>
              </select>

              <select className="flex-1 px-4 py-3 border-2 border-black font-bold uppercase text-sm tracking-wide bg-white">
                <option>ORDENAR POR</option>
                <option>MÁS RECIENTE</option>
                <option>MÁS POPULAR</option>
                <option>ALFABÉTICO</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// Content Layout Grids
const ContentLayouts: React.FC = () => (
  <section className="mb-16">
    <h2 className="text-2xl font-bold mb-8 text-[#854836] uppercase tracking-wider">
      LAYOUTS DE CONTENIDO
    </h2>

    <div className="space-y-8">
      {/* Homepage Layout */}
      <div className="bg-white border-4 border-black p-6">
        <h3 className="text-lg font-bold mb-4 uppercase tracking-wide">Homepage Layout</h3>
        <div className="grid grid-cols-12 gap-4 h-96 text-sm font-bold uppercase tracking-wide">
          <div className="col-span-8 bg-[#F7F7F7] border-2 border-black p-4">
            ARTÍCULO PRINCIPAL
          </div>
          <div className="col-span-4 space-y-4">
            <div className="bg-[#FFB22C] border-2 border-black p-4 h-20">
              BREAKING NEWS
            </div>
            <div className="bg-[#F7F7F7] border-2 border-black p-4 flex-1">
              SIDEBAR DESTACADOS
            </div>
          </div>
          <div className="col-span-4 bg-[#F7F7F7] border-2 border-black p-4">
            ARTÍCULO SECUNDARIO
          </div>
          <div className="col-span-4 bg-[#F7F7F7] border-2 border-black p-4">
            ARTÍCULO SECUNDARIO
          </div>
          <div className="col-span-4 bg-[#F7F7F7] border-2 border-black p-4">
            ARTÍCULO SECUNDARIO
          </div>
        </div>
      </div>

      {/* Article Detail Layout */}
      <div className="bg-white border-4 border-black p-6">
        <h3 className="text-lg font-bold mb-4 uppercase tracking-wide">Article Detail Layout</h3>
        <div className="grid grid-cols-12 gap-4 h-64 text-sm font-bold uppercase tracking-wide">
          <div className="col-span-8 space-y-4">
            <div className="bg-[#F7F7F7] border-2 border-black p-4 h-12">
              HEADER DEL ARTÍCULO
            </div>
            <div className="bg-[#F7F7F7] border-2 border-black p-4 flex-1">
              CONTENIDO DEL ARTÍCULO
            </div>
          </div>
          <div className="col-span-4 space-y-4">
            <div className="bg-[#FFB22C] border-2 border-black p-4 h-16">
              RELACIONADOS
            </div>
            <div className="bg-[#F7F7F7] border-2 border-black p-4 h-16">
              PUBLICIDAD
            </div>
            <div className="bg-[#F7F7F7] border-2 border-black p-4 flex-1">
              MÁS NOTICIAS
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// Main Showroom Component
const Showroom: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F7F7F7] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-16 bg-black text-white p-8 border-4 border-black">
          <h1 className="text-6xl font-black uppercase tracking-wider mb-4">
            NOTICIAS PACHUCA
          </h1>
          <h2 className="text-2xl font-bold uppercase tracking-wider text-[#FFB22C]">
            DESIGN SYSTEM BRUTALIST
          </h2>
          <p className="text-lg mt-4 uppercase tracking-wide">
            Guía completa de estilos para diario digital
          </p>
        </header>

        {/* Components */}
        <Typography />
        <ColorPalette />
        <ArticleCards />
        <NavigationPatterns />
        <BreakingNewsBanner />
        <ButtonsAndCTAs />
        <FormElements />
        <ContentLayouts />

        {/* Footer */}
        <footer className="mt-16 bg-black text-white p-8 border-4 border-black text-center">
          <p className="text-lg font-bold uppercase tracking-wider">
            © 2024 NOTICIAS PACHUCA | DESIGN SYSTEM V1.0
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Showroom;