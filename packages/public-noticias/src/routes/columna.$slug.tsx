import { createFileRoute, Link } from '@tanstack/react-router';
import { getCategories } from '../features/public-content/server';
import { UniversalHeader } from '../components/shared/UniversalHeader';
import { UniversalFooter } from '../components/shared/UniversalFooter';

export const Route = createFileRoute('/columna/$slug')({
  component: ColumnDetailPage,
  loader: async () => {
    const categoriesResponse = await getCategories();
    return {
      categories: categoriesResponse.success ? categoriesResponse.data : [],
    };
  },
});

// ==================== INTERFACES ====================

interface Columnist {
  id: string;
  slug: string;
  name: string;
  columnName: string;
  bio: string;
  photo: string;
  category: string;
  frequency: 'SEMANAL' | 'QUINCENAL' | 'MENSUAL';
}

interface ColumnArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  pullQuote: string;
  image: string;
  publishedAt: string;
  featured: boolean;
}

// ==================== MOCK DATA ====================

const MOCK_COLUMNIST: Columnist = {
  id: '1',
  slug: 'jorge-morales',
  name: 'JORGE MORALES',
  columnName: 'EL PULSO POLÍTICO',
  bio: 'Periodista político con más de 20 años de experiencia cubriendo la política local y nacional. Especializado en análisis profundo de coyuntura y procesos electorales en Hidalgo.',
  photo: 'https://placehold.co/600x600/854836/FFFFFF?text=JM&font=montserrat',
  category: 'POLÍTICA',
  frequency: 'SEMANAL',
};

const MOCK_FEATURED_ARTICLE: ColumnArticle = {
  id: '1',
  slug: 'elecciones-locales-2025-analisis',
  title: 'ELECCIONES LOCALES 2025: EL TABLERO POLÍTICO SE REDEFINE',
  excerpt: 'La configuración del mapa electoral hidalguense enfrenta su mayor transformación en décadas. Los partidos tradicionales ven cómo sus bastiones históricos se tambalean ante nuevas fuerzas políticas que prometen cambio y renovación.',
  pullQuote: 'La política hidalguense nunca volverá a ser la misma después de estas elecciones',
  image: 'https://placehold.co/1200x600/FF0000/FFFFFF?text=ELECCIONES+2025',
  content: `
    <h2>El contexto electoral</h2>
    <p>Las elecciones locales de 2025 se presentan como un parteaguas en la historia política de Hidalgo. Por primera vez en décadas, ningún partido puede darse por seguro en ningún distrito.</p>

    <p>Los datos de las últimas encuestas revelan una <strong>fragmentación sin precedentes</strong> del electorado. Los votantes, particularmente los jóvenes, muestran una volatilidad que obliga a los estrategas a replantear completamente sus campañas.</p>

    <h2>Los actores principales</h2>
    <p>En este nuevo escenario, tres fuerzas políticas emergen como protagonistas:</p>

    <ul>
      <li>Los partidos tradicionales, que intentan reinventarse sin perder sus bases históricas</li>
      <li>Las coaliciones emergentes, que prometen romper con el pasado</li>
      <li>Los candidatos independientes, que capitalizan el hartazgo ciudadano</li>
    </ul>

    <h3>El factor ciudadano</h3>
    <p>Pero el verdadero protagonista de estas elecciones es el electorado. Más informado, más exigente y menos dispuesto a aceptar promesas vacías, el votante hidalguense de 2025 representa un desafío inédito para la clase política.</p>

    <blockquote>
      "Los ciudadanos ya no votan por colores, votan por propuestas concretas y resultados verificables"
    </blockquote>

    <h2>Lo que está en juego</h2>
    <p>Más allá de los cargos en disputa, estas elecciones definirán el rumbo de Hidalgo para la próxima década. Las decisiones que tome el próximo gobierno determinarán si el estado logra:</p>

    <ol>
      <li>Superar el rezago en infraestructura</li>
      <li>Atraer inversión y generar empleos de calidad</li>
      <li>Modernizar el sistema educativo</li>
      <li>Combatir efectivamente la inseguridad</li>
    </ol>

    <p>El tablero está servido. Los próximos meses serán determinantes.</p>
  `,
  publishedAt: '2025-10-08',
  featured: true,
};

const MOCK_RECENT_ARTICLES: ColumnArticle[] = [
  {
    id: '2',
    slug: 'reforma-educativa-hidalgo',
    title: 'LA REFORMA EDUCATIVA QUE HIDALGO NECESITA',
    excerpt: 'El sistema educativo estatal requiere una transformación profunda que vaya más allá de discursos y llegue a las aulas.',
    pullQuote: '',
    image: 'https://placehold.co/800x500/FFB22C/000000?text=EDUCACION',
    content: '',
    publishedAt: '2025-10-01',
    featured: false,
  },
  {
    id: '3',
    slug: 'seguridad-zona-metropolitana',
    title: 'SEGURIDAD EN LA ZONA METROPOLITANA: DESAFÍO PENDIENTE',
    excerpt: 'Los índices delictivos en Pachuca y su área conurbada demandan una estrategia coordinada entre municipios.',
    pullQuote: '',
    image: 'https://placehold.co/800x500/854836/FFFFFF?text=SEGURIDAD',
    content: '',
    publishedAt: '2025-09-24',
    featured: false,
  },
  {
    id: '4',
    slug: 'inversion-infraestructura',
    title: 'INVERSIÓN EN INFRAESTRUCTURA: LA CLAVE DEL DESARROLLO',
    excerpt: 'Sin carreteras modernas, hospitales equipados y servicios básicos, el crecimiento económico será imposible.',
    pullQuote: '',
    image: 'https://placehold.co/800x500/FF0000/FFFFFF?text=INFRAESTRUCTURA',
    content: '',
    publishedAt: '2025-09-17',
    featured: false,
  },
];

// ==================== COMPONENTS ====================

function ColumnDetailPage() {
  const { slug } = Route.useParams();
  const { categories } = Route.useLoaderData();

  // En producción, aquí harías fetch del columnista por slug
  const columnist = MOCK_COLUMNIST;
  const featuredArticle = MOCK_FEATURED_ARTICLE;
  const recentArticles = MOCK_RECENT_ARTICLES;

  if (slug !== columnist.slug) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="bg-white border-4 border-black p-12 text-center max-w-2xl relative">
          <div className="absolute -top-2 -left-2 w-8 h-8 bg-[#FF0000] transform rotate-45"></div>
          <h1 className="text-4xl font-black uppercase text-black mb-4">COLUMNISTA NO ENCONTRADO</h1>
          <Link
            to="/columna-opinion"
            className="inline-block bg-black text-white px-8 py-3 font-bold uppercase text-sm border-2 border-black hover:bg-[#FF0000] transition-colors"
          >
            VER TODOS LOS COLUMNISTAS
          </Link>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#854836] transform rotate-45"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Universal Header */}
      <UniversalHeader categories={categories} />

      {/* Breadcrumb */}
      <nav className="bg-black text-white py-3 border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider flex-wrap">
            <li>
              <Link to="/" className="hover:text-[#FFB22C] transition-colors">
                INICIO
              </Link>
            </li>
            <li className="text-[#FF0000]">›</li>
            <li>
              <Link to="/columnista/$slug" params={{ slug: columnist.slug }} className="hover:text-[#FFB22C] transition-colors">
                {columnist.name}
              </Link>
            </li>
            <li className="text-[#FF0000]">›</li>
            <li className="text-[#F7F7F7]">{featuredArticle.title}</li>
          </ul>
        </div>
      </nav>

      {/* Main Content */}
      <main className="bg-white">

        {/* Hero Section - Columnist Info */}
        <section className="max-w-7xl mx-auto px-4 py-12 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">

            {/* Photo Container - Brutalist Frame */}
            <div className="relative">
              <div className="relative border-4 border-black bg-[#F7F7F7] p-0 rotate-[-1deg]">
                <img
                  src={columnist.photo}
                  alt={columnist.name}
                  className="w-full h-auto rotate-[1deg] border-2 border-black"
                  loading="eager"
                />
                {/* Geometric accent - rotated square */}
                <div className="absolute -top-4 -right-4 w-12 h-12 md:w-16 md:h-16 bg-[#FF0000] rotate-45 border-2 border-black" />
              </div>
            </div>

            {/* Info Container */}
            <div className="flex flex-col justify-center space-y-6">
              {/* Name */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-wider leading-none">
                {columnist.name}
              </h1>

              {/* Column Name */}
              <div className="border-l-4 md:border-l-8 border-[#FF0000] pl-4 md:pl-6">
                <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-wide text-[#854836]">
                  {columnist.columnName}
                </h2>
              </div>

              {/* Bio */}
              <p className="text-base md:text-lg leading-relaxed font-medium">
                {columnist.bio}
              </p>

              {/* Badges */}
              <div className="flex flex-wrap gap-3 md:gap-4">
                <span className="inline-block bg-black text-white px-4 md:px-6 py-2 md:py-3 font-bold uppercase text-xs md:text-sm tracking-wider border-2 border-black">
                  {columnist.category}
                </span>
                <span className="inline-block bg-[#FFB22C] text-black px-4 md:px-6 py-2 md:py-3 font-bold uppercase text-xs md:text-sm tracking-wider border-2 border-black">
                  {columnist.frequency}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Article with Pull Quote */}
        <section className="bg-[#F7F7F7] border-t-4 border-b-4 border-black py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4">

            {/* Featured Label */}
            <div className="inline-block bg-[#FF0000] text-white px-4 md:px-6 py-2 font-bold uppercase text-xs md:text-sm tracking-wider mb-8 border-2 border-black">
              ARTÍCULO DESTACADO
            </div>

            {/* Article Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">

              {/* Article Content - 2 columns */}
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-wide leading-tight">
                  {featuredArticle.title}
                </h2>

                <div className="w-20 md:w-24 h-1 bg-black" />

                <p className="text-base md:text-lg leading-relaxed">
                  {featuredArticle.excerpt}
                </p>

                <Link
                  to={`/columnista/${columnist.slug}/${featuredArticle.slug}`}
                  className="inline-block group relative overflow-hidden bg-black text-white px-6 md:px-8 py-3 md:py-4 font-bold uppercase text-sm tracking-wider border-2 border-black hover:bg-white hover:text-black transition-colors"
                >
                  LEER MÁS →
                </Link>
              </div>

              {/* Pull Quote - 1 column */}
              <div className="relative mt-8 lg:mt-0">
                {/* Background geometric shape */}
                <div className="absolute inset-0 bg-[#FFB22C] border-4 border-black rotate-[3deg]" />

                {/* Quote container */}
                <div className="relative bg-white border-4 border-black p-6 md:p-8 space-y-4">

                  {/* Top triangle */}
                  <div className="w-0 h-0 border-l-[15px] md:border-l-[20px] border-r-[15px] md:border-r-[20px] border-b-[20px] md:border-b-[30px] border-l-transparent border-r-transparent border-b-black" />

                  {/* Quote text */}
                  <blockquote className="text-xl md:text-2xl lg:text-3xl font-black uppercase tracking-wide leading-tight">
                    "{featuredArticle.pullQuote}"
                  </blockquote>

                  {/* Bottom triangle - inverted */}
                  <div className="ml-auto w-0 h-0 border-l-[15px] md:border-l-[20px] border-r-[15px] md:border-r-[20px] border-t-[20px] md:border-t-[30px] border-l-transparent border-r-transparent border-t-black" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Rich Text Content */}
        <article className="max-w-4xl mx-auto px-4 py-12 md:py-16">
          <div className="brutalist-content space-y-6 md:space-y-8">
            <div dangerouslySetInnerHTML={{ __html: featuredArticle.content }} />
          </div>
        </article>

        {/* Recent Columns Grid */}
        <section className="max-w-7xl mx-auto px-4 py-12 md:py-20">

          {/* Section Header */}
          <div className="flex items-center justify-between mb-8 md:mb-12 pb-4 md:pb-6 border-b-4 border-black">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-wider">
              MÁS COLUMNAS
            </h2>
            <div className="w-12 h-12 md:w-16 md:h-16 bg-[#FFB22C] rotate-45 border-2 border-black" />
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {recentArticles.map((article) => (
              <article key={article.id} className="group cursor-pointer">

                {/* Image Container */}
                <div className="relative overflow-hidden border-4 border-black bg-[#F7F7F7] mb-4">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-48 md:h-64 object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity" />
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h3 className="text-lg md:text-xl font-bold uppercase tracking-wide leading-tight group-hover:text-[#FF0000] transition-colors line-clamp-2">
                    {article.title}
                  </h3>

                  <time className="block text-xs md:text-sm font-bold uppercase tracking-wider text-[#854836]">
                    {new Intl.DateTimeFormat('es-MX', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    }).format(new Date(article.publishedAt)).toUpperCase()}
                  </time>

                  <div className="pt-2 border-t-2 border-black">
                    <span className="text-xs md:text-sm font-bold uppercase tracking-wider group-hover:text-[#FF0000] transition-colors">
                      LEER →
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Load More CTA */}
          <div className="mt-12 md:mt-16 text-center">
            <Link
              to="/columna-opinion"
              className="inline-block bg-[#FF0000] text-white px-8 md:px-12 py-3 md:py-4 font-bold uppercase text-sm md:text-lg tracking-wider border-4 border-black hover:bg-black transition-colors"
            >
              VER TODAS LAS COLUMNAS
            </Link>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-black text-white py-12 md:py-16 border-t-4 border-black">
          <div className="max-w-3xl mx-auto px-4">
            <div className="text-center space-y-6 md:space-y-8">

              {/* Decorative element */}
              <div className="inline-block w-16 h-16 md:w-24 md:h-24 bg-[#FF0000] rotate-45 border-4 border-white" />

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-wider leading-tight">
                ¿TE GUSTÓ ESTA COLUMNA?
              </h2>

              <p className="text-lg md:text-xl font-bold uppercase tracking-wide text-[#F7F7F7]">
                SUSCRÍBETE PARA RECIBIR NUEVOS ARTÍCULOS
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  to="/#suscribirse"
                  className="w-full sm:w-auto bg-[#FFB22C] text-black px-8 md:px-10 py-3 md:py-4 font-bold uppercase text-sm tracking-wider border-4 border-white hover:bg-white transition-colors text-center"
                >
                  SUSCRIBIRME
                </Link>
                <button className="w-full sm:w-auto bg-white text-black px-8 md:px-10 py-3 md:py-4 font-bold uppercase text-sm tracking-wider border-4 border-white hover:bg-[#FFB22C] transition-colors">
                  COMPARTIR
                </button>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Universal Footer */}
      <UniversalFooter />

      {/* Custom CSS for Brutalist Rich Text */}
      <style>{`
        .brutalist-content h1,
        .brutalist-content h2,
        .brutalist-content h3,
        .brutalist-content h4,
        .brutalist-content h5,
        .brutalist-content h6 {
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          line-height: 1.1;
          margin-top: 3rem;
          margin-bottom: 1.5rem;
        }

        .brutalist-content h1 {
          font-size: 2.5rem;
          border-bottom: 4px solid #000;
          padding-bottom: 0.5rem;
        }

        .brutalist-content h2 {
          font-size: 2rem;
          border-left: 8px solid #FF0000;
          padding-left: 1rem;
        }

        .brutalist-content h3 {
          font-size: 1.5rem;
          border-left: 4px solid #854836;
          padding-left: 1rem;
        }

        .brutalist-content p {
          font-size: 1.125rem;
          line-height: 1.8;
          margin-bottom: 1.5rem;
        }

        .brutalist-content strong {
          font-weight: 900;
          background-color: #FFB22C;
          padding: 0 0.25rem;
        }

        .brutalist-content ul,
        .brutalist-content ol {
          padding-left: 2rem;
          margin-bottom: 2rem;
        }

        .brutalist-content li {
          font-size: 1.125rem;
          line-height: 1.8;
          margin-bottom: 0.75rem;
          position: relative;
        }

        .brutalist-content ul li::marker {
          content: "■ ";
          color: #FF0000;
          font-weight: bold;
        }

        .brutalist-content ol {
          counter-reset: item;
        }

        .brutalist-content ol li {
          counter-increment: item;
        }

        .brutalist-content ol li::marker {
          content: counter(item) ". ";
          font-weight: 900;
          color: #854836;
        }

        .brutalist-content a {
          color: #000;
          text-decoration: none;
          border-bottom: 2px solid #FF0000;
          font-weight: 700;
          transition: all 0.2s;
        }

        .brutalist-content a:hover {
          background-color: #FF0000;
          color: #FFF;
        }

        .brutalist-content blockquote {
          border-left: 8px solid #000;
          background-color: #F7F7F7;
          padding: 2rem;
          margin: 3rem 0;
          font-size: 1.5rem;
          font-weight: 700;
          font-style: italic;
        }

        .brutalist-content img {
          border: 4px solid #000;
          width: 100%;
          height: auto;
          margin: 2rem 0;
        }

        @media (max-width: 768px) {
          .brutalist-content h1 { font-size: 2rem; }
          .brutalist-content h2 { font-size: 1.5rem; }
          .brutalist-content h3 { font-size: 1.25rem; }
          .brutalist-content p { font-size: 1rem; }
          .brutalist-content li { font-size: 1rem; }
          .brutalist-content blockquote { font-size: 1.25rem; padding: 1.5rem; }
        }
      `}</style>
    </div>
  );
}
