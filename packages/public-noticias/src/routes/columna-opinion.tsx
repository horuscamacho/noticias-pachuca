import { createFileRoute, Link } from '@tanstack/react-router';
import { UniversalHeader } from '../components/shared/UniversalHeader';
import { UniversalFooter } from '../components/shared/UniversalFooter';
import { getCategories } from '../features/public-content/server';
import { useState } from 'react';

export const Route = createFileRoute('/columna-opinion')({
  component: ColumnaOpinionPage,
  loader: async () => {
    const categoriesResponse = await getCategories();
    return {
      categories: categoriesResponse.success ? categoriesResponse.data : [],
    };
  },
});

// ==================== INTERFACES ====================

export interface ColumnistData {
  id: string;
  slug: string;
  name: string;
  photo: string;
  columnName: string;
  category: string;
  frequency: 'SEMANAL' | 'QUINCENAL';
  bio: string;
  articles: ColumnaArticle[];
}

export interface ColumnaArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  columnName: string;
}

// ==================== MOCK DATA ====================

export const MOCK_COLUMNISTS: ColumnistData[] = [
  {
    id: '1',
    slug: 'jorge-morales',
    name: 'JORGE MORALES',
    photo: 'https://placehold.co/200x200/854836/FFFFFF?text=JM',
    columnName: 'EL PULSO POLÍTICO',
    category: 'POLÍTICA',
    frequency: 'SEMANAL',
    bio: 'Periodista político con más de 20 años de experiencia. Especializado en análisis de la política local y nacional.',
    articles: [
      {
        id: '1',
        slug: 'elecciones-locales-2025',
        title: 'ELECCIONES LOCALES 2025: ANÁLISIS DE LOS PRINCIPALES CANDIDATOS',
        excerpt: 'Las próximas elecciones en Pachuca prometen ser las más reñidas de la última década. Un análisis profundo de los perfiles y propuestas.',
        content: '<p>Contenido completo...</p>',
        date: '10 OCT 2025',
        columnName: 'EL PULSO POLÍTICO',
      },
    ],
  },
  {
    id: '2',
    slug: 'ana-silva',
    name: 'ANA SILVA',
    photo: 'https://placehold.co/200x200/FF0000/FFFFFF?text=AS',
    columnName: 'ECONOMÍA AL DÍA',
    category: 'ECONOMÍA',
    frequency: 'QUINCENAL',
    bio: 'Economista y analista financiera. Experta en economía regional y desarrollo empresarial en Hidalgo.',
    articles: [
      {
        id: '2',
        slug: 'inversiones-hidalgo-2025',
        title: 'NUEVAS INVERSIONES TRANSFORMARÁN LA ECONOMÍA DE HIDALGO',
        excerpt: 'El estado recibe inversión extranjera récord. Análisis del impacto en el empleo y desarrollo regional.',
        content: '<p>Contenido completo...</p>',
        date: '08 OCT 2025',
        columnName: 'ECONOMÍA AL DÍA',
      },
    ],
  },
  {
    id: '3',
    slug: 'carlos-ramirez',
    name: 'CARLOS RAMÍREZ',
    photo: 'https://placehold.co/200x200/FFB22C/000000?text=CR',
    columnName: 'CRÓNICA URBANA',
    category: 'LOCAL',
    frequency: 'SEMANAL',
    bio: 'Cronista de la ciudad de Pachuca. Documentalista de historias urbanas y transformaciones sociales.',
    articles: [
      {
        id: '3',
        slug: 'pachuca-en-transicion',
        title: 'PACHUCA EN TRANSICIÓN: ENTRE LA TRADICIÓN Y LA MODERNIDAD',
        excerpt: 'Cómo la capital hidalguense navega entre preservar su identidad y abrazar el futuro urbano.',
        content: '<p>Contenido completo...</p>',
        date: '09 OCT 2025',
        columnName: 'CRÓNICA URBANA',
      },
    ],
  },
];

// ==================== COMPONENT ====================

function ColumnaOpinionPage() {
  const { categories: headerCategories } = Route.useLoaderData();

  // Estados para filtros y búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('TODAS');

  // Categorías únicas de los columnistas
  const categories = ['TODAS', ...Array.from(new Set(MOCK_COLUMNISTS.map(c => c.category)))];
  const dateRanges = ['TODAS', 'ÚLTIMA SEMANA', 'ÚLTIMO MES', 'ÚLTIMOS 3 MESES'];

  // Función para verificar si el columnista tiene artículos en el rango de fecha
  const hasArticlesInDateRange = (columnist: ColumnistData, range: string) => {
    if (range === 'TODAS' || columnist.articles.length === 0) return true;

    // Para este ejemplo con datos mock, asumimos que todos los artículos están recientes
    // En producción, aquí compararías las fechas reales
    return true;
  };

  // Filtrar columnistas
  const filteredColumnists = MOCK_COLUMNISTS.filter(columnist => {
    const matchesSearch = searchQuery === '' ||
      columnist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      columnist.columnName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      columnist.bio.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'TODAS' || columnist.category === selectedCategory;
    const matchesDateRange = hasArticlesInDateRange(columnist, selectedDateRange);

    return matchesSearch && matchesCategory && matchesDateRange;
  });

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Header */}
      <UniversalHeader categories={headerCategories} />

      {/* Breadcrumb */}
      <div className="bg-black text-white py-3">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center space-x-2 text-sm font-bold uppercase tracking-wider">
            <Link to="/" className="hover:text-[#FFB22C] transition-colors">
              INICIO
            </Link>
            <span className="text-[#FFB22C]">→</span>
            <span className="text-[#FFB22C]">COLUMNAS DE OPINIÓN</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="relative">
            <div className="absolute -top-3 -left-3 w-12 h-12 bg-[#FF0000] transform rotate-45"></div>
            <div className="bg-white border-4 border-black p-8 relative">
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-black mb-4 leading-tight">
                COLUMNAS DE OPINIÓN
              </h1>
              <p className="text-xl text-black leading-relaxed max-w-3xl">
                VOCES EXPERTAS ANALIZANDO LOS TEMAS MÁS IMPORTANTES DE <span className="font-black text-[#854836]">PACHUCA</span> E <span className="font-black text-[#854836]">HIDALGO</span>.
              </p>
              <div className="absolute -bottom-3 -right-3 w-0 h-0 border-l-[24px] border-r-[24px] border-b-[24px] border-l-transparent border-r-transparent border-b-[#FFB22C]"></div>
            </div>
          </div>
        </div>

        {/* Filtros y Búsqueda */}
        <section className="mb-12">
          <div className="bg-white border-4 border-black p-6 relative">
            <div className="absolute -top-2 -left-2 w-6 h-6 bg-[#FFB22C] transform rotate-45"></div>

            <h2 className="text-xl font-black uppercase tracking-tight text-black mb-4 border-b-2 border-black pb-2">
              BUSCAR Y FILTRAR COLUMNISTAS
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Búsqueda */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#854836] mb-2">
                  BUSCAR POR NOMBRE O TEMA
                </label>
                <input
                  type="text"
                  placeholder="BUSCAR..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-black bg-[#F7F7F7] font-bold uppercase text-sm placeholder-black focus:outline-none focus:bg-white focus:border-[#854836]"
                />
              </div>

              {/* Filtro por Categoría */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#854836] mb-2">
                  CATEGORÍA
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-black bg-[#F7F7F7] font-bold uppercase text-sm focus:outline-none focus:bg-white focus:border-[#854836]"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Filtro por Fecha */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#854836] mb-2">
                  FECHA DE PUBLICACIÓN
                </label>
                <select
                  value={selectedDateRange}
                  onChange={(e) => setSelectedDateRange(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-black bg-[#F7F7F7] font-bold uppercase text-sm focus:outline-none focus:bg-white focus:border-[#854836]"
                >
                  {dateRanges.map(range => (
                    <option key={range} value={range}>{range}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Resultados Count + Reset */}
            <div className="mt-4 flex items-center justify-between border-t-2 border-gray-200 pt-4">
              <span className="text-sm font-bold uppercase tracking-wider text-black">
                {filteredColumnists.length} COLUMNISTA{filteredColumnists.length !== 1 ? 'S' : ''} ENCONTRADO{filteredColumnists.length !== 1 ? 'S' : ''}
              </span>
              {(searchQuery || selectedCategory !== 'TODAS' || selectedDateRange !== 'TODAS') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('TODAS');
                    setSelectedDateRange('TODAS');
                  }}
                  className="bg-[#FF0000] text-white px-4 py-2 font-bold uppercase text-xs border-2 border-black hover:bg-black transition-colors"
                >
                  LIMPIAR FILTROS
                </button>
              )}
            </div>

            <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-black transform rotate-45"></div>
          </div>
        </section>

        {/* Columnistas Grid */}
        <section>
          {filteredColumnists.length === 0 ? (
            <div className="bg-white border-4 border-black p-12 text-center relative">
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-[#FF0000] transform rotate-45"></div>
              <h3 className="text-2xl font-black uppercase text-black mb-4">
                NO SE ENCONTRARON COLUMNISTAS
              </h3>
              <p className="text-black mb-6">
                Intenta ajustar tus filtros o búsqueda.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('TODAS');
                  setSelectedDateRange('TODAS');
                }}
                className="bg-[#854836] text-white px-6 py-3 font-bold uppercase text-sm border-2 border-black hover:bg-black transition-colors"
              >
                VER TODOS LOS COLUMNISTAS
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredColumnists.map((columnist) => (
              <Link
                key={columnist.id}
                to="/columnista/$slug"
                params={{ slug: columnist.slug }}
                className="block bg-white border-4 border-black relative hover:shadow-[12px_12px_0_0_#000000] transition-all duration-300 group cursor-pointer"
              >
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-[#854836] transform rotate-45"></div>

                {/* Photo Header */}
                <div className="relative">
                  <img
                    src={columnist.photo}
                    alt={columnist.name}
                    className="w-full h-64 object-cover border-b-4 border-black"
                  />
                  <div className="absolute bottom-0 right-0 bg-[#FFB22C] border-4 border-black px-4 py-2 font-black uppercase text-xs tracking-wider">
                    {columnist.frequency}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Columnist Name */}
                  <div className="border-b-2 border-black pb-3">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-black leading-tight group-hover:text-[#854836] transition-colors">
                      {columnist.name}
                    </h2>
                  </div>

                  {/* Column Name + Category */}
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-bold uppercase tracking-tight text-[#854836]">
                      {columnist.columnName}
                    </h3>
                    <span className="inline-block bg-[#F7F7F7] text-black px-3 py-1 font-bold uppercase text-xs tracking-wider border border-black w-fit">
                      {columnist.category}
                    </span>
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-black leading-relaxed">
                    {columnist.bio}
                  </p>

                  {/* Latest Article Preview */}
                  {columnist.articles.length > 0 && (
                    <div className="border-t-2 border-gray-200 pt-4 space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#854836]">
                        ÚLTIMA PUBLICACIÓN:
                      </span>
                      <h4 className="text-sm font-bold text-black leading-tight line-clamp-2">
                        {columnist.articles[0].title}
                      </h4>
                      <p className="text-xs text-gray-600 uppercase tracking-wide">
                        {columnist.articles[0].date}
                      </p>
                    </div>
                  )}

                  {/* CTA Button */}
                  <div className="block w-full bg-[#854836] text-white py-3 font-black uppercase text-sm tracking-wider border-2 border-black group-hover:bg-black group-hover:shadow-[6px_6px_0_0_#854836] transition-all text-center relative">
                    VER TODAS SUS COLUMNAS →
                  </div>
                </div>

                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-[#FFB22C] transform rotate-45"></div>
              </Link>
            ))}
          </div>
          )}
        </section>

        {/* Info Box */}
        <section className="mt-16">
          <div className="bg-[#FFB22C] border-4 border-black p-8 relative">
            <div className="absolute -top-2 -left-2 w-6 h-6 bg-black transform rotate-45"></div>
            <div className="max-w-3xl mx-auto text-center">
              <h3 className="text-2xl font-black uppercase tracking-tight text-black mb-4">
                ¿QUÉ ES UNA COLUMNA DE OPINIÓN?
              </h3>
              <p className="text-base text-black leading-relaxed font-medium mb-4">
                Las columnas de opinión son espacios donde periodistas y expertos comparten su análisis, perspectiva y reflexiones sobre temas de actualidad.
                A diferencia de las noticias, las columnas expresan el punto de vista personal del autor.
              </p>
              <p className="text-sm text-black font-bold">
                Cada columnista publica con una frecuencia definida (semanal o quincenal) y se especializa en un área temática específica.
              </p>
            </div>
            <div className="absolute -bottom-2 -right-2 w-0 h-0 border-l-[16px] border-r-[16px] border-b-[16px] border-l-transparent border-r-transparent border-b-black"></div>
          </div>
        </section>

        {/* Latest Columns Section */}
        <section className="mt-16">
          <div className="bg-black text-white px-6 py-3 mb-6 border-4 border-black relative">
            <div className="absolute top-0 right-4 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[12px] border-b-[#FFB22C] transform rotate-180"></div>
            <h2 className="text-2xl font-black uppercase tracking-wider">
              ÚLTIMAS COLUMNAS PUBLICADAS
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MOCK_COLUMNISTS.flatMap(c => c.articles).map((article) => (
              <Link
                key={article.id}
                to="/columna/$slug"
                params={{ slug: article.slug }}
                className="block"
              >
                <article className="bg-white border-4 border-black p-6 relative hover:shadow-[8px_8px_0_0_#000000] transition-all duration-300 group h-full">
                  <div className="absolute -top-1 -left-1 w-4 h-4 bg-[#FF0000] transform rotate-45"></div>

                  {/* Column Name Badge */}
                  <div className="mb-3">
                    <span className="inline-block bg-[#854836] text-white px-3 py-1 font-bold uppercase text-xs tracking-wider border-2 border-black">
                      {article.columnName}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-black mb-3 leading-tight group-hover:text-[#854836] transition-colors">
                    {article.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-sm text-black leading-relaxed mb-4 line-clamp-3">
                    {article.excerpt}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="text-xs text-[#854836] font-bold uppercase">
                      {article.date}
                    </div>
                    <div className="text-[#FF0000] font-black text-lg group-hover:translate-x-1 transition-transform">
                      →
                    </div>
                  </div>

                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#FFB22C] transform rotate-45"></div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <UniversalFooter />
    </div>
  );
}
