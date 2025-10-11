import { createFileRoute, Link } from '@tanstack/react-router';
import { getCategories } from '../features/public-content/server';
import { UniversalHeader } from '../components/shared/UniversalHeader';
import { UniversalFooter } from '../components/shared/UniversalFooter';

export const Route = createFileRoute('/columnista/$slug')({
  component: ColumnistProfilePage,
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
  publishedAt: string;
  category: string;
}

// ==================== MOCK DATA ====================

const MOCK_COLUMNIST: Columnist = {
  id: '1',
  slug: 'jorge-morales',
  name: 'JORGE MORALES',
  columnName: 'EL PULSO POLÍTICO',
  bio: 'Periodista político con más de 20 años de experiencia cubriendo la política local y nacional. Especializado en análisis profundo de coyuntura y procesos electorales en Hidalgo. Sus columnas han sido referencia obligada para entender el panorama político del estado.',
  photo: 'https://placehold.co/600x600/854836/FFFFFF?text=JM&font=montserrat',
  category: 'POLÍTICA',
  frequency: 'SEMANAL',
};

const MOCK_COLUMNS: ColumnArticle[] = [
  {
    id: '1',
    slug: 'elecciones-locales-2025-analisis',
    title: 'ELECCIONES LOCALES 2025: EL TABLERO POLÍTICO SE REDEFINE',
    excerpt: 'La configuración del mapa electoral hidalguense enfrenta su mayor transformación en décadas. Los partidos tradicionales ven cómo sus bastiones históricos se tambalean ante nuevas fuerzas políticas.',
    publishedAt: '2025-10-08',
    category: 'POLÍTICA',
  },
  {
    id: '2',
    slug: 'reforma-educativa-hidalgo',
    title: 'LA REFORMA EDUCATIVA QUE HIDALGO NECESITA',
    excerpt: 'El sistema educativo estatal requiere una transformación profunda que vaya más allá de discursos y llegue a las aulas con propuestas concretas y verificables.',
    publishedAt: '2025-10-01',
    category: 'EDUCACIÓN',
  },
  {
    id: '3',
    slug: 'seguridad-zona-metropolitana',
    title: 'SEGURIDAD EN LA ZONA METROPOLITANA: DESAFÍO PENDIENTE',
    excerpt: 'Los índices delictivos en Pachuca y su área conurbada demandan una estrategia coordinada entre municipios que vaya más allá de los operativos esporádicos.',
    publishedAt: '2025-09-24',
    category: 'SEGURIDAD',
  },
  {
    id: '4',
    slug: 'inversion-infraestructura',
    title: 'INVERSIÓN EN INFRAESTRUCTURA: LA CLAVE DEL DESARROLLO',
    excerpt: 'Sin carreteras modernas, hospitales equipados y servicios básicos garantizados, el crecimiento económico de Hidalgo será una promesa incumplida más.',
    publishedAt: '2025-09-17',
    category: 'ECONOMÍA',
  },
  {
    id: '5',
    slug: 'transparencia-rendicion-cuentas',
    title: 'TRANSPARENCIA Y RENDICIÓN DE CUENTAS: EL GRAN PENDIENTE',
    excerpt: 'Los ciudadanos tienen derecho a saber cómo se gastan sus impuestos. La opacidad en el manejo de recursos públicos erosiona la confianza en las instituciones.',
    publishedAt: '2025-09-10',
    category: 'POLÍTICA',
  },
  {
    id: '6',
    slug: 'medio-ambiente-desarrollo-sustentable',
    title: 'MEDIO AMBIENTE Y DESARROLLO: ¿COMPATIBLES EN HIDALGO?',
    excerpt: 'El crecimiento económico no puede seguir sacrificando nuestros recursos naturales. Es posible un desarrollo sustentable que beneficie a todos.',
    publishedAt: '2025-09-03',
    category: 'MEDIO AMBIENTE',
  },
  {
    id: '7',
    slug: 'participacion-ciudadana-decision-publica',
    title: 'PARTICIPACIÓN CIUDADANA: MÁS ALLÁ DEL VOTO',
    excerpt: 'La democracia no termina en las urnas. Los mecanismos de participación ciudadana en las decisiones públicas son fundamentales para un gobierno verdaderamente representativo.',
    publishedAt: '2025-08-27',
    category: 'POLÍTICA',
  },
  {
    id: '8',
    slug: 'salud-publica-crisis-silenciosa',
    title: 'SALUD PÚBLICA: LA CRISIS SILENCIOSA',
    excerpt: 'El sistema de salud en Hidalgo enfrenta desafíos estructurales que requieren atención inmediata. La falta de medicamentos y personal especializado es solo la punta del iceberg.',
    publishedAt: '2025-08-20',
    category: 'SALUD',
  },
];

// ==================== COMPONENT ====================

function ColumnistProfilePage() {
  const { slug } = Route.useParams();
  const { categories } = Route.useLoaderData();

  // En producción, fetch del columnista y sus columnas
  const columnist = MOCK_COLUMNIST;
  const columns = MOCK_COLUMNS;

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
              <Link to="/columna-opinion" className="hover:text-[#FFB22C] transition-colors">
                COLUMNISTAS
              </Link>
            </li>
            <li className="text-[#FF0000]">›</li>
            <li className="text-[#F7F7F7]">{columnist.name}</li>
          </ul>
        </div>
      </nav>

      {/* Main Content */}
      <main className="bg-white">

        {/* Columnist Profile Header */}
        <section className="max-w-7xl mx-auto px-4 py-12 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">

            {/* Photo + Info Card - 1 column */}
            <div className="lg:col-span-1">
              <div className="bg-white border-4 border-black p-0 relative">
                <div className="absolute -top-2 -left-2 w-8 h-8 bg-[#FF0000] transform rotate-45"></div>

                {/* Photo */}
                <img
                  src={columnist.photo}
                  alt={columnist.name}
                  className="w-full h-auto border-b-4 border-black"
                  loading="eager"
                />

                {/* Info */}
                <div className="p-6 space-y-4">
                  <h1 className="text-3xl font-black uppercase tracking-tight leading-none">
                    {columnist.name}
                  </h1>

                  <div className="border-l-4 border-[#FF0000] pl-3">
                    <h2 className="text-xl font-bold uppercase tracking-wide text-[#854836]">
                      {columnist.columnName}
                    </h2>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-block bg-black text-white px-4 py-2 font-bold uppercase text-xs tracking-wider border-2 border-black">
                      {columnist.category}
                    </span>
                    <span className="inline-block bg-[#FFB22C] text-black px-4 py-2 font-bold uppercase text-xs tracking-wider border-2 border-black">
                      {columnist.frequency}
                    </span>
                  </div>
                </div>

                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#854836] transform rotate-45"></div>
              </div>

              {/* CTA Subscribe */}
              <div className="mt-8 bg-black text-white border-4 border-black p-6 space-y-4">
                <h3 className="text-lg font-black uppercase tracking-wider">
                  SUSCRÍBETE
                </h3>
                <p className="text-sm font-bold uppercase text-[#F7F7F7]">
                  Recibe sus columnas por email
                </p>
                <Link
                  to="/#suscribirse"
                  className="block w-full bg-[#FFB22C] text-black py-3 font-bold uppercase text-sm tracking-wider border-2 border-white hover:bg-white transition-colors text-center"
                >
                  SUSCRIBIRME →
                </Link>
              </div>
            </div>

            {/* Bio + Columns List - 2 columns */}
            <div className="lg:col-span-2 space-y-8">

              {/* Bio Section */}
              <div className="bg-[#F7F7F7] border-4 border-black p-6 md:p-8 relative">
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#FFB22C] transform rotate-45"></div>

                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider mb-4 border-b-2 border-black pb-3">
                  SOBRE EL COLUMNISTA
                </h2>

                <p className="text-base md:text-lg leading-relaxed">
                  {columnist.bio}
                </p>
              </div>

              {/* Columns List Header */}
              <div className="flex items-center justify-between border-b-4 border-black pb-4">
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-wider">
                  TODAS SUS COLUMNAS
                </h2>
                <div className="text-sm font-bold uppercase tracking-wider text-[#854836]">
                  {columns.length} ARTÍCULOS
                </div>
              </div>

              {/* Columns Timeline - Ordenadas por fecha */}
              <div className="space-y-6">
                {columns.map((column) => (
                  <Link
                    key={column.id}
                    to="/columna/$slug"
                    params={{ slug: column.slug }}
                    className="block group"
                  >
                    <article className="bg-white border-2 border-black p-6 hover:shadow-[8px_8px_0_0_#000000] transition-all relative">

                      {/* Date Badge */}
                      <div className="absolute -top-3 -left-3 bg-[#FF0000] text-white px-4 py-2 font-black uppercase text-xs tracking-wider border-2 border-black">
                        {new Intl.DateTimeFormat('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        }).format(new Date(column.publishedAt)).toUpperCase()}
                      </div>

                      {/* Content */}
                      <div className="mt-4 space-y-3">
                        {/* Category */}
                        <span className="inline-block bg-[#F7F7F7] text-black px-3 py-1 font-bold uppercase text-xs tracking-wider border border-black">
                          {column.category}
                        </span>

                        {/* Title */}
                        <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight leading-tight group-hover:text-[#FF0000] transition-colors">
                          {column.title}
                        </h3>

                        {/* Excerpt */}
                        <p className="text-sm md:text-base leading-relaxed text-gray-700">
                          {column.excerpt}
                        </p>

                        {/* Read More */}
                        <div className="pt-3 border-t-2 border-gray-200">
                          <span className="font-bold uppercase text-sm tracking-wider group-hover:text-[#FF0000] transition-colors">
                            LEER COLUMNA →
                          </span>
                        </div>
                      </div>

                      {/* Decorative corner */}
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#FFB22C] transform rotate-45 group-hover:bg-[#FF0000] transition-colors"></div>
                    </article>
                  </Link>
                ))}
              </div>

              {/* Load More - Si hay más artículos */}
              <div className="text-center pt-8">
                <button className="bg-[#854836] text-white px-10 py-4 font-bold uppercase text-sm tracking-wider border-4 border-black hover:bg-black transition-colors">
                  CARGAR MÁS COLUMNAS
                </button>
              </div>

            </div>
          </div>
        </section>

        {/* Related Columnists Section */}
        <section className="bg-[#F7F7F7] border-t-4 border-black py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4">

            <div className="flex items-center justify-between mb-8 pb-4 border-b-4 border-black">
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider">
                OTROS COLUMNISTAS
              </h2>
              <div className="w-12 h-12 bg-[#FF0000] rotate-45 border-2 border-black"></div>
            </div>

            <div className="text-center">
              <Link
                to="/columna-opinion"
                className="inline-block bg-black text-white px-10 py-4 font-bold uppercase text-sm tracking-wider border-4 border-black hover:bg-[#FF0000] transition-colors"
              >
                VER TODOS LOS COLUMNISTAS →
              </Link>
            </div>

          </div>
        </section>

      </main>

      {/* Universal Footer */}
      <UniversalFooter />
    </div>
  );
}
