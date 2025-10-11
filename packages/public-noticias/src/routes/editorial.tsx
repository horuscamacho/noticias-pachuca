import { createFileRoute, Link } from '@tanstack/react-router';
import { UniversalHeader } from '../components/shared/UniversalHeader';
import { UniversalFooter } from '../components/shared/UniversalFooter';
import { getCategories } from '../features/public-content/server';

export const Route = createFileRoute('/editorial')({
  component: EditorialPage,
  loader: async () => {
    const categoriesResponse = await getCategories();
    return {
      categories: categoriesResponse.success ? categoriesResponse.data : [],
    };
  },
});

// ==================== MOCK DATA ====================

export interface EditorialArticle {
  id: string;
  slug: string;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  content: string;
  category: string;
}

export const MOCK_EDITORIALS: EditorialArticle[] = [
  {
    id: '1',
    slug: 'pachuca-necesita-transporte-publico-eficiente',
    title: 'PACHUCA NECESITA UN TRANSPORTE PÚBLICO EFICIENTE',
    date: '10 DE OCTUBRE 2025',
    author: 'REDACCIÓN NOTICIAS PACHUCA',
    excerpt: 'El crecimiento de nuestra ciudad exige una modernización urgente del sistema de transporte público. Los ciudadanos merecen un servicio de calidad que conecte eficientemente todos los puntos de la zona metropolitana.',
    content: `
      <p>El crecimiento acelerado de Pachuca y su zona metropolitana en los últimos años ha dejado al descubierto una problemática que afecta diariamente a miles de ciudadanos: la insuficiencia y deficiencia de nuestro sistema de transporte público.</p>

      <p>Las unidades obsoletas, las rutas mal planificadas y la falta de puntualidad son solo algunos de los problemas que enfrentan día con día quienes dependen del transporte colectivo para desplazarse. Esto no solo afecta la calidad de vida de nuestros ciudadanos, sino que también impacta negativamente en la productividad económica de la región.</p>

      <p>Es momento de que las autoridades estatales y municipales tomen acciones concretas. Necesitamos una modernización integral del sistema: desde la renovación de la flota vehicular hasta la implementación de tecnología que permita a los usuarios conocer en tiempo real los horarios y rutas disponibles.</p>

      <p>Otras ciudades de tamaño similar han demostrado que es posible tener un transporte público eficiente, seguro y sustentable. No hay excusas para que Pachuca se quede atrás. Los hidalguenses merecemos un sistema de movilidad que esté a la altura de nuestras necesidades del siglo XXI.</p>

      <p>Desde NOTICIAS PACHUCA hacemos un llamado a las autoridades para que actúen con urgencia. El transporte público no es un lujo, es un derecho fundamental que debe garantizarse a todos los ciudadanos.</p>
    `,
    category: 'TRANSPORTE',
  },
  {
    id: '2',
    slug: 'educacion-digital-desafio-pendiente-hidalgo',
    title: 'LA EDUCACIÓN DIGITAL: UN DESAFÍO PENDIENTE EN HIDALGO',
    date: '08 DE OCTUBRE 2025',
    author: 'REDACCIÓN NOTICIAS PACHUCA',
    excerpt: 'La brecha digital en las escuelas hidalguenses es una realidad que debemos enfrentar. Miles de estudiantes carecen de acceso a herramientas tecnológicas básicas que son fundamentales para su desarrollo educativo.',
    content: `
      <p>La pandemia evidenció una realidad que muchos preferían ignorar: la brecha digital en nuestro sistema educativo es profunda y afecta principalmente a las comunidades más vulnerables del estado de Hidalgo.</p>

      <p>Mientras que en las zonas urbanas algunos estudiantes tuvieron acceso a clases virtuales y recursos digitales, miles de niños y jóvenes en zonas rurales quedaron completamente desconectados del sistema educativo durante meses. Esta desigualdad ha generado rezagos que tardaremos años en recuperar.</p>

      <p>No se trata únicamente de entregar tablets o computadoras. La educación digital requiere infraestructura: conectividad de calidad, capacitación docente, contenidos educativos adaptados y soporte técnico constante. Sin estos elementos, cualquier esfuerzo será insuficiente.</p>

      <p>El gobierno estatal debe priorizar este tema en su agenda. Necesitamos un plan integral que garantice que todos los estudiantes hidalguenses, sin importar su ubicación geográfica o condición socioeconómica, tengan acceso equitativo a las herramientas digitales del siglo XXI.</p>

      <p>La educación es el camino hacia el desarrollo. Si seguimos permitiendo que la brecha digital se amplíe, estaremos condenando a generaciones enteras de hidalguenses a quedarse atrás en un mundo cada vez más tecnológico.</p>
    `,
    category: 'EDUCACIÓN',
  },
  {
    id: '3',
    slug: 'agua-recurso-vital-no-podemos-dar-por-sentado',
    title: 'EL AGUA: UN RECURSO QUE NO PODEMOS DAR POR SENTADO',
    date: '05 DE OCTUBRE 2025',
    author: 'REDACCIÓN NOTICIAS PACHUCA',
    excerpt: 'Las recientes restricciones en el suministro de agua nos recuerdan la importancia de cuidar este recurso vital. Es fundamental que gobierno y ciudadanía trabajemos juntos en su conservación.',
    content: `
      <p>Los cortes de agua que han afectado a diversas colonias de Pachuca en las últimas semanas son una llamada de atención que no podemos ignorar. El agua es un recurso finito y su disponibilidad futura depende de las decisiones que tomemos hoy.</p>

      <p>La situación actual no es resultado únicamente de la sequía o del cambio climático. Es también consecuencia de décadas de mala planeación urbana, desperdicio sistemático y falta de inversión en infraestructura hidráulica. Hemos crecido como ciudad sin tomar en cuenta la capacidad de nuestros sistemas de abastecimiento.</p>

      <p>Es urgente que el gobierno municipal implemente un plan integral de gestión del agua. Esto incluye reparar las fugas en la red de distribución (que según estimaciones representan pérdidas de hasta el 40%), modernizar las plantas de tratamiento, y fomentar la captación de agua pluvial.</p>

      <p>Pero la responsabilidad no es solo gubernamental. Cada ciudadano debe adoptar hábitos de consumo responsable. Pequeñas acciones como cerrar la llave mientras nos lavamos los dientes, reparar fugas domésticas inmediatamente y reutilizar el agua para riego pueden hacer una gran diferencia.</p>

      <p>El futuro del agua en Pachuca depende de todos nosotros. No esperemos a que la crisis sea irreversible para actuar. Cuidar este recurso vital es garantizar calidad de vida para las generaciones futuras.</p>
    `,
    category: 'MEDIO AMBIENTE',
  },
];

const FEATURED_EDITORIAL = MOCK_EDITORIALS[0];

// ==================== COMPONENT ====================

function EditorialPage() {
  const { categories } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Header */}
      <UniversalHeader categories={categories} />

      {/* Breadcrumb */}
      <div className="bg-black text-white py-3">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center space-x-2 text-sm font-bold uppercase tracking-wider">
            <a href="/" className="hover:text-[#FFB22C] transition-colors">
              INICIO
            </a>
            <span className="text-[#FFB22C]">→</span>
            <span className="text-[#FFB22C]">EDITORIAL</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="relative">
            <div className="absolute -top-3 -left-3 w-12 h-12 bg-[#854836] transform rotate-45"></div>
            <div className="bg-white border-4 border-black p-8 relative">
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-black mb-4 leading-tight">
                EDITORIAL
              </h1>
              <p className="text-xl text-black leading-relaxed max-w-3xl">
                LA VOZ DE <span className="font-black text-[#854836]">NOTICIAS PACHUCA</span>. ANÁLISIS Y OPINIÓN SOBRE LOS TEMAS QUE AFECTAN A NUESTRA COMUNIDAD.
              </p>
              <div className="absolute -bottom-3 -right-3 w-0 h-0 border-l-[24px] border-r-[24px] border-b-[24px] border-l-transparent border-r-transparent border-b-[#FFB22C]"></div>
            </div>
          </div>
        </div>

        {/* Featured Editorial - Full Content */}
        <section className="mb-16">
          <div className="bg-[#854836] text-white px-6 py-3 mb-6 border-4 border-black relative">
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#FFB22C] border-2 border-black transform rotate-45"></div>
            <h2 className="text-2xl font-black uppercase tracking-wider">
              EDITORIAL DE HOY
            </h2>
          </div>

          <article className="bg-white border-4 border-black p-8 md:p-12 relative">
            <div className="absolute -top-2 -left-2 w-6 h-6 bg-[#FF0000] transform rotate-45"></div>

            {/* Category Badge */}
            <div className="mb-6">
              <span className="inline-block bg-[#FFB22C] text-black px-4 py-2 font-black uppercase text-xs tracking-wider border-2 border-black">
                EDITORIAL
              </span>
              <span className="ml-3 inline-block bg-[#F7F7F7] text-[#854836] px-4 py-2 font-bold uppercase text-xs tracking-wider border border-black">
                {FEATURED_EDITORIAL.category}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-black mb-6 leading-tight">
              {FEATURED_EDITORIAL.title}
            </h2>

            {/* Excerpt */}
            <p className="text-xl md:text-2xl text-black leading-relaxed mb-8 font-medium border-l-4 border-[#854836] pl-6">
              {FEATURED_EDITORIAL.excerpt}
            </p>

            {/* Metadata Bar */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border-y-2 border-black py-6 mb-8 space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-[#854836] border-2 border-black flex items-center justify-center">
                  <span className="text-white font-black text-xl">NP</span>
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-black">
                    {FEATURED_EDITORIAL.author}
                  </p>
                  <p className="text-xs text-[#854836] font-bold uppercase">
                    {FEATURED_EDITORIAL.date}
                  </p>
                </div>
              </div>

              {/* Share Buttons */}
              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold uppercase text-black hidden md:inline">COMPARTIR:</span>
                <button className="w-10 h-10 bg-black text-white border-2 border-black hover:bg-[#FF0000] transition-colors flex items-center justify-center font-bold">
                  F
                </button>
                <button className="w-10 h-10 bg-black text-white border-2 border-black hover:bg-[#FF0000] transition-colors flex items-center justify-center font-bold">
                  X
                </button>
                <button className="w-10 h-10 bg-black text-white border-2 border-black hover:bg-[#FF0000] transition-colors flex items-center justify-center font-bold">
                  W
                </button>
              </div>
            </div>

            {/* Full Content */}
            <div
              className="prose prose-lg max-w-none text-black mb-8
                prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight
                prose-p:text-lg prose-p:leading-relaxed prose-p:mb-6
                prose-strong:text-black prose-strong:font-black
                prose-a:text-[#854836] prose-a:font-bold prose-a:no-underline hover:prose-a:underline"
              dangerouslySetInnerHTML={{ __html: FEATURED_EDITORIAL.content }}
            />

            {/* Editorial Signature */}
            <div className="mt-12 pt-8 border-t-2 border-black">
              <div className="bg-[#F7F7F7] border-2 border-black p-6 relative">
                <div className="absolute -top-1 -left-1 w-4 h-4 bg-[#FFB22C] transform rotate-45"></div>
                <p className="text-sm font-bold uppercase text-black text-center">
                  ⎯⎯⎯⎯⎯<br />
                  EDITORIAL DE NOTICIAS PACHUCA<br />
                  HIDALGO, MÉXICO
                </p>
              </div>
            </div>

            <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-[#FFB22C] transform rotate-45"></div>
          </article>
        </section>

        {/* Editorials Archive */}
        <section>
          <div className="bg-black text-white px-6 py-3 mb-6 border-4 border-black relative">
            <div className="absolute top-0 right-4 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[12px] border-b-[#854836] transform rotate-180"></div>
            <h2 className="text-2xl font-black uppercase tracking-wider">
              EDITORIALES ANTERIORES
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {MOCK_EDITORIALS.slice(1).map((editorial) => (
              <Link
                key={editorial.id}
                to="/editorial/$slug"
                params={{ slug: editorial.slug }}
                className="block"
              >
                <article className="bg-white border-4 border-black p-6 relative hover:shadow-[8px_8px_0_0_#000000] transition-all duration-300 group h-full">
                  <div className="absolute -top-1 -left-1 w-4 h-4 bg-[#854836] transform rotate-45"></div>

                  {/* Category */}
                  <div className="mb-3">
                    <span className="inline-block bg-[#F7F7F7] text-[#854836] px-3 py-1 font-bold uppercase text-xs tracking-wider border border-black">
                      {editorial.category}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black mb-4 leading-tight group-hover:text-[#854836] transition-colors">
                    {editorial.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-sm text-black leading-relaxed mb-6 line-clamp-3">
                    {editorial.excerpt}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-xs text-[#854836] font-bold uppercase">
                      {editorial.date}
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

        {/* Info Box */}
        <section className="mt-16">
          <div className="bg-[#FFB22C] border-4 border-black p-8 relative">
            <div className="absolute -top-2 -left-2 w-6 h-6 bg-black transform rotate-45"></div>
            <div className="max-w-3xl mx-auto text-center">
              <h3 className="text-2xl font-black uppercase tracking-tight text-black mb-4">
                ¿QUÉ ES UNA EDITORIAL?
              </h3>
              <p className="text-base text-black leading-relaxed font-medium">
                La editorial representa la postura oficial de <span className="font-black">NOTICIAS PACHUCA</span> sobre temas relevantes para nuestra comunidad.
                No lleva firma individual porque refleja el consenso del equipo editorial.
                Su objetivo es informar, analizar y proponer soluciones a los problemas que afectan a Pachuca y el estado de Hidalgo.
              </p>
            </div>
            <div className="absolute -bottom-2 -right-2 w-0 h-0 border-l-[16px] border-r-[16px] border-b-[16px] border-l-transparent border-r-transparent border-b-black"></div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <UniversalFooter />
    </div>
  );
}
