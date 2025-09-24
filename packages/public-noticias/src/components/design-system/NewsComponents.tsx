import React from 'react';

/**
 * NOTICIAS PACHUCA - COMPONENTES ESPECÍFICOS DE NOTICIAS
 *
 * Componentes reutilizables específicamente diseñados para
 * sitios web de noticias con estética brutalist
 */

// ==================== INTERFACES ====================

interface Article {
  id: string;
  title: string;
  summary?: string;
  category: string;
  author: string;
  publishDate: string;
  readTime?: string;
  imageUrl?: string;
  isBreaking?: boolean;
  isFeatured?: boolean;
  tags?: string[];
}

interface ArticleCardProps {
  article: Article;
  variant: 'featured' | 'standard' | 'compact' | 'list';
  className?: string;
}

interface BreakingNewsProps {
  articles: Article[];
  autoRotate?: boolean;
}

interface CategoryNavProps {
  categories: string[];
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
}

// ==================== COMPONENTES DE ARTÍCULOS ====================

/**
 * Card de Artículo - Variante Featured
 * Para artículos principales en homepage
 */
export const FeaturedArticleCard: React.FC<{ article: Article }> = ({ article }) => (
  <article className="bg-white border-4 border-black">
    {/* Imagen principal */}
    <div className="relative">
      {article.imageUrl ? (
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-64 object-cover border-b-4 border-black"
        />
      ) : (
        <div className="w-full h-64 bg-[#F7F7F7] border-b-4 border-black flex items-center justify-center">
          <span className="text-[#854836] font-bold text-lg uppercase tracking-wide">
            IMAGEN PRINCIPAL
          </span>
        </div>
      )}

      {/* Breaking news badge */}
      {article.isBreaking && (
        <div className="absolute top-4 left-4 bg-[#FF0000] text-white px-3 py-1 border-2 border-black">
          <span className="text-xs font-bold uppercase tracking-wider">
            ÚLTIMO MOMENTO
          </span>
        </div>
      )}
    </div>

    {/* Contenido */}
    <div className="p-8 space-y-4">
      {/* Metadata superior */}
      <div className="flex items-center gap-4">
        <span className="text-xs font-bold uppercase tracking-wider text-[#854836] bg-[#F7F7F7] px-3 py-1 border border-black">
          {article.category}
        </span>
        {article.readTime && (
          <span className="text-xs text-[#854836] uppercase tracking-wide">
            {article.readTime} MIN LECTURA
          </span>
        )}
      </div>

      {/* Título */}
      <h2 className="text-3xl font-bold uppercase tracking-wide text-black leading-tight hover:text-[#854836] transition-colors cursor-pointer">
        {article.title}
      </h2>

      {/* Resumen */}
      {article.summary && (
        <p className="text-lg text-black leading-relaxed">
          {article.summary}
        </p>
      )}

      {/* Metadata inferior */}
      <div className="flex justify-between items-center pt-4 border-t-2 border-[#F7F7F7]">
        <div className="text-sm text-[#854836] uppercase tracking-wide">
          Por: <span className="font-bold">{article.author}</span>
        </div>
        <div className="text-sm text-[#854836] uppercase tracking-wide">
          {article.publishDate}
        </div>
      </div>
    </div>
  </article>
);

/**
 * Card de Artículo - Variante Standard
 * Para grillas de artículos regulares
 */
export const StandardArticleCard: React.FC<{ article: Article }> = ({ article }) => (
  <article className="bg-white border-2 border-black hover:shadow-[4px_4px_0_0_#000000] transition-shadow cursor-pointer">
    {/* Imagen */}
    {article.imageUrl ? (
      <img
        src={article.imageUrl}
        alt={article.title}
        className="w-full h-32 object-cover border-b-2 border-black"
      />
    ) : (
      <div className="w-full h-32 bg-[#F7F7F7] border-b-2 border-black flex items-center justify-center">
        <span className="text-[#854836] font-bold text-sm uppercase tracking-wide">
          IMAGEN
        </span>
      </div>
    )}

    <div className="p-4 space-y-3">
      {/* Categoría */}
      <span className="text-xs font-bold uppercase tracking-wider text-[#854836] bg-[#F7F7F7] px-2 py-1">
        {article.category}
      </span>

      {/* Título */}
      <h3 className="text-lg font-bold uppercase tracking-wide text-black leading-tight hover:text-[#854836] transition-colors">
        {article.title}
      </h3>

      {/* Resumen breve */}
      {article.summary && (
        <p className="text-sm text-black leading-relaxed line-clamp-2">
          {article.summary}
        </p>
      )}

      {/* Metadata */}
      <div className="text-xs text-[#854836] uppercase tracking-wide">
        {article.publishDate}
      </div>
    </div>
  </article>
);

/**
 * Card de Artículo - Variante Compact
 * Para sidebars y listas densas
 */
export const CompactArticleCard: React.FC<{ article: Article }> = ({ article }) => (
  <article className="flex gap-3 p-3 border-b-2 border-[#F7F7F7] hover:bg-[#F7F7F7] transition-colors cursor-pointer">
    {/* Imagen pequeña */}
    <div className="w-16 h-16 bg-[#F7F7F7] border-2 border-black flex-shrink-0 flex items-center justify-center">
      {article.imageUrl ? (
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-[#854836] font-bold text-xs">IMG</span>
      )}
    </div>

    <div className="flex-1 space-y-2">
      {/* Título */}
      <h4 className="text-sm font-bold uppercase tracking-wide text-black leading-tight hover:text-[#854836] transition-colors">
        {article.title}
      </h4>

      {/* Metadata */}
      <div className="flex gap-4 text-xs text-[#854836] uppercase tracking-wide">
        <span>{article.category}</span>
        <span>{article.publishDate}</span>
      </div>
    </div>
  </article>
);

/**
 * Lista de Artículos - Para páginas de categoría
 */
export const ArticleList: React.FC<{ articles: Article[] }> = ({ articles }) => (
  <div className="space-y-6">
    {articles.map((article) => (
      <article key={article.id} className="bg-white border-2 border-black p-6">
        <div className="grid md:grid-cols-4 gap-6">
          {/* Imagen */}
          <div className="md:col-span-1">
            {article.imageUrl ? (
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-32 object-cover border-2 border-black"
              />
            ) : (
              <div className="w-full h-32 bg-[#F7F7F7] border-2 border-black flex items-center justify-center">
                <span className="text-[#854836] font-bold text-sm">IMAGEN</span>
              </div>
            )}
          </div>

          {/* Contenido */}
          <div className="md:col-span-3 space-y-3">
            {/* Categoría y Breaking */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#854836] bg-[#F7F7F7] px-2 py-1">
                {article.category}
              </span>
              {article.isBreaking && (
                <span className="text-xs font-bold uppercase tracking-wider text-white bg-[#FF0000] px-2 py-1">
                  ÚLTIMO MOMENTO
                </span>
              )}
            </div>

            {/* Título */}
            <h3 className="text-xl font-bold uppercase tracking-wide text-black leading-tight hover:text-[#854836] transition-colors cursor-pointer">
              {article.title}
            </h3>

            {/* Resumen */}
            {article.summary && (
              <p className="text-base text-black leading-relaxed">
                {article.summary}
              </p>
            )}

            {/* Metadata */}
            <div className="flex justify-between items-center text-sm text-[#854836] uppercase tracking-wide">
              <span>Por: <span className="font-bold">{article.author}</span></span>
              <span>{article.publishDate}</span>
            </div>
          </div>
        </div>
      </article>
    ))}
  </div>
);

// ==================== COMPONENTES DE NAVEGACIÓN ====================

/**
 * Banner de Breaking News
 */
export const BreakingNewsBanner: React.FC<BreakingNewsProps> = ({
  articles,
  autoRotate = true
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const breakingArticles = articles.filter(article => article.isBreaking);

  React.useEffect(() => {
    if (autoRotate && breakingArticles.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % breakingArticles.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [breakingArticles.length, autoRotate]);

  if (breakingArticles.length === 0) return null;

  const currentArticle = breakingArticles[currentIndex];

  return (
    <div className="bg-[#FF0000] text-white border-4 border-black mb-8">
      <div className="flex items-center gap-4 p-4">
        <span className="bg-white text-[#FF0000] px-3 py-1 font-black uppercase text-sm tracking-wider flex-shrink-0">
          URGENTE
        </span>
        <p className="font-bold uppercase tracking-wide flex-1 cursor-pointer hover:opacity-90">
          {currentArticle.title}
        </p>
        <button className="bg-black text-white px-3 py-1 font-bold uppercase text-sm hover:bg-[#854836] transition-colors">
          VER MÁS
        </button>
      </div>

      {/* Indicadores */}
      {breakingArticles.length > 1 && (
        <div className="flex gap-1 px-4 pb-2">
          {breakingArticles.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 ${
                index === currentIndex ? 'bg-white' : 'bg-white opacity-50'
              }`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Navegación de Categorías
 */
export const CategoryNavigation: React.FC<CategoryNavProps> = ({
  categories,
  activeCategory,
  onCategoryChange
}) => (
  <nav className="bg-[#F7F7F7] border-2 border-black p-4 mb-8">
    <div className="flex flex-wrap gap-2">
      <button
        className={`px-4 py-2 font-bold uppercase text-sm tracking-wide border-2 transition-colors ${
          !activeCategory
            ? 'bg-black text-white border-black'
            : 'bg-white text-black border-black hover:bg-[#854836] hover:text-white'
        }`}
        onClick={() => onCategoryChange?.('')}
      >
        TODAS
      </button>
      {categories.map((category) => (
        <button
          key={category}
          className={`px-4 py-2 font-bold uppercase text-sm tracking-wide border-2 transition-colors ${
            activeCategory === category
              ? 'bg-black text-white border-black'
              : 'bg-white text-black border-black hover:bg-[#854836] hover:text-white'
          }`}
          onClick={() => onCategoryChange?.(category)}
        >
          {category}
        </button>
      ))}
    </div>
  </nav>
);

/**
 * Header Principal del Sitio
 */
export const SiteHeader: React.FC = () => (
  <header className="bg-black text-white border-b-4 border-black">
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex justify-between items-center py-4">
        {/* Logo */}
        <h1 className="text-3xl font-black uppercase tracking-wider cursor-pointer hover:text-[#FFB22C] transition-colors">
          NOTICIAS PACHUCA
        </h1>

        {/* Acciones */}
        <div className="flex items-center gap-4">
          {/* Búsqueda */}
          <div className="flex">
            <input
              type="search"
              placeholder="BUSCAR..."
              className="px-3 py-2 bg-white text-black border-2 border-black font-bold uppercase text-sm tracking-wide placeholder:text-[#854836] focus:outline-none focus:ring-2 focus:ring-[#FFB22C]"
            />
            <button className="bg-[#FFB22C] text-black px-4 py-2 font-bold uppercase text-sm tracking-wide border-2 border-black border-l-0 hover:bg-[#e6a028] transition-colors">
              IR
            </button>
          </div>

          {/* Suscripción */}
          <button className="bg-[#FFB22C] text-black px-6 py-2 font-bold uppercase text-sm tracking-wide border-2 border-black hover:bg-[#e6a028] transition-colors">
            SUSCRIBIRSE
          </button>
        </div>
      </div>
    </div>
  </header>
);

/**
 * Footer del Sitio
 */
export const SiteFooter: React.FC = () => (
  <footer className="bg-black text-white border-t-4 border-black mt-16">
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-4 gap-8">
        {/* Logo y descripción */}
        <div className="space-y-4">
          <h3 className="text-2xl font-black uppercase tracking-wider text-[#FFB22C]">
            NOTICIAS PACHUCA
          </h3>
          <p className="text-sm leading-relaxed">
            El diario digital líder en Pachuca. Noticias locales, nacionales e internacionales con la máxima veracidad.
          </p>
        </div>

        {/* Secciones */}
        <div className="space-y-4">
          <h4 className="text-lg font-bold uppercase tracking-wide">SECCIONES</h4>
          <ul className="space-y-2 text-sm">
            {['POLÍTICA', 'DEPORTES', 'ECONOMÍA', 'CULTURA', 'TECNOLOGÍA'].map((section) => (
              <li key={section}>
                <a href={`#${section.toLowerCase()}`} className="hover:text-[#FFB22C] transition-colors uppercase tracking-wide">
                  {section}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contacto */}
        <div className="space-y-4">
          <h4 className="text-lg font-bold uppercase tracking-wide">CONTACTO</h4>
          <div className="space-y-2 text-sm">
            <p className="uppercase tracking-wide">REDACCIÓN@NOTICIASPACHUCA.COM</p>
            <p className="uppercase tracking-wide">+52 771 XXX XXXX</p>
            <p className="uppercase tracking-wide">PACHUCA, HIDALGO</p>
          </div>
        </div>

        {/* Redes sociales */}
        <div className="space-y-4">
          <h4 className="text-lg font-bold uppercase tracking-wide">SÍGUENOS</h4>
          <div className="flex gap-2">
            {['FB', 'TW', 'IG', 'YT'].map((social) => (
              <button key={social} className="bg-white text-black w-10 h-10 font-bold uppercase text-sm border-2 border-white hover:bg-[#FFB22C] transition-colors">
                {social}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t-2 border-white mt-8 pt-8 text-center">
        <p className="text-sm uppercase tracking-wide">
          © 2024 NOTICIAS PACHUCA | TODOS LOS DERECHOS RESERVADOS
        </p>
      </div>
    </div>
  </footer>
);

// ==================== LAYOUTS ====================

/**
 * Layout de Homepage
 */
export const HomepageLayout: React.FC<{
  featuredArticle: Article;
  breakingNews: Article[];
  standardArticles: Article[];
  sidebarArticles: Article[];
}> = ({ featuredArticle, breakingNews, standardArticles, sidebarArticles }) => (
  <div className="max-w-7xl mx-auto px-4 py-8">
    {/* Breaking News Banner */}
    <BreakingNewsBanner articles={breakingNews} />

    {/* Main Content Grid */}
    <div className="grid lg:grid-cols-4 gap-8">
      {/* Main Content */}
      <main className="lg:col-span-3 space-y-8">
        {/* Featured Article */}
        <FeaturedArticleCard article={featuredArticle} />

        {/* Secondary Articles Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {standardArticles.map((article) => (
            <StandardArticleCard key={article.id} article={article} />
          ))}
        </div>
      </main>

      {/* Sidebar */}
      <aside className="lg:col-span-1 space-y-6">
        <div className="bg-white border-2 border-black p-4">
          <h3 className="text-lg font-bold uppercase tracking-wide text-black mb-4 border-b-2 border-[#F7F7F7] pb-2">
            MÁS LEÍDAS
          </h3>
          <div className="space-y-4">
            {sidebarArticles.map((article) => (
              <CompactArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      </aside>
    </div>
  </div>
);

export default {
  FeaturedArticleCard,
  StandardArticleCard,
  CompactArticleCard,
  ArticleList,
  BreakingNewsBanner,
  CategoryNavigation,
  SiteHeader,
  SiteFooter,
  HomepageLayout,
};