import { createFileRoute, Link } from '@tanstack/react-router';
import { UniversalHeader } from '../components/shared/UniversalHeader';
import { UniversalFooter } from '../components/shared/UniversalFooter';
import { getCategories } from '../features/public-content/server';
import { MOCK_EDITORIALS, type EditorialArticle } from './editorial';

export const Route = createFileRoute('/editorial/$slug')({
  component: EditorialDetailPage,
  loader: async () => {
    const categoriesResponse = await getCategories();
    return {
      categories: categoriesResponse.success ? categoriesResponse.data : [],
    };
  },
});

function EditorialDetailPage() {
  const { slug } = Route.useParams();
  const { categories } = Route.useLoaderData();

  // Find current editorial by slug and its index
  const currentIndex = MOCK_EDITORIALS.findIndex(e => e.slug === slug);
  const editorial = MOCK_EDITORIALS[currentIndex];

  // Split editorials into recientes (más nuevas) y anteriores (más viejas)
  const recentEditorials = currentIndex > 0 ? MOCK_EDITORIALS.slice(0, currentIndex) : [];
  const olderEditorials = currentIndex >= 0 && currentIndex < MOCK_EDITORIALS.length - 1
    ? MOCK_EDITORIALS.slice(currentIndex + 1)
    : [];

  if (!editorial) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black uppercase text-black mb-4">EDITORIAL NO ENCONTRADA</h1>
          <Link
            to="/editorial"
            className="inline-block bg-[#FF0000] text-white px-6 py-3 font-black uppercase text-sm border-2 border-black hover:bg-black transition-colors"
          >
            VOLVER A EDITORIALES
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Header */}
      <UniversalHeader categories={categories} />

      {/* Breadcrumb */}
      <div className="bg-black text-white py-3">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center space-x-2 text-sm font-bold uppercase tracking-wider">
            <Link to="/" className="hover:text-[#FFB22C] transition-colors">
              INICIO
            </Link>
            <span className="text-[#FFB22C]">→</span>
            <Link to="/editorial" className="hover:text-[#FFB22C] transition-colors">
              EDITORIAL
            </Link>
            <span className="text-[#FFB22C]">→</span>
            <span className="text-[#FFB22C] truncate max-w-[300px]">{editorial.title}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Article */}
        <article className="bg-white border-4 border-black p-8 md:p-12 relative mb-12">
          <div className="absolute -top-3 -left-3 w-12 h-12 bg-[#854836] transform rotate-45"></div>

          {/* Category Badge */}
          <div className="mb-6">
            <span className="inline-block bg-[#FFB22C] text-black px-4 py-2 font-black uppercase text-xs tracking-wider border-2 border-black">
              EDITORIAL
            </span>
            <span className="ml-3 inline-block bg-[#F7F7F7] text-[#854836] px-4 py-2 font-bold uppercase text-xs tracking-wider border border-black">
              {editorial.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-black mb-6 leading-tight">
            {editorial.title}
          </h1>

          {/* Excerpt */}
          <p className="text-xl md:text-2xl text-black leading-relaxed mb-8 font-medium border-l-4 border-[#854836] pl-6">
            {editorial.excerpt}
          </p>

          {/* Metadata Bar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between border-y-2 border-black py-6 mb-8 space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-[#854836] border-2 border-black flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-xl">NP</span>
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-black">
                  {editorial.author}
                </p>
                <p className="text-xs text-[#854836] font-bold uppercase">
                  {editorial.date}
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
            className="prose prose-lg max-w-none text-black
              prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight
              prose-p:text-lg prose-p:leading-relaxed prose-p:mb-6
              prose-strong:text-black prose-strong:font-black
              prose-a:text-[#854836] prose-a:font-bold prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: editorial.content }}
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

          <div className="absolute -bottom-3 -right-3 w-0 h-0 border-l-[24px] border-r-[24px] border-b-[24px] border-l-transparent border-r-transparent border-b-[#FFB22C]"></div>
        </article>

        {/* Recent Editorials (más nuevas) */}
        {recentEditorials.length > 0 && (
          <section className="mb-12">
            <div className="bg-[#854836] text-white px-6 py-3 mb-6 border-4 border-black relative">
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-[#FFB22C] border-2 border-black transform rotate-45"></div>
              <h2 className="text-2xl font-black uppercase tracking-wider">
                EDITORIALES MÁS RECIENTES
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recentEditorials.map((other) => (
                <Link
                  key={other.id}
                  to="/editorial/$slug"
                  params={{ slug: other.slug }}
                  className="block"
                >
                  <article className="bg-white border-4 border-black p-6 relative hover:shadow-[8px_8px_0_0_#000000] transition-all duration-300 group h-full">
                    <div className="absolute -top-1 -left-1 w-4 h-4 bg-[#854836] transform rotate-45"></div>

                    {/* Category */}
                    <div className="mb-3">
                      <span className="inline-block bg-[#F7F7F7] text-[#854836] px-3 py-1 font-bold uppercase text-xs tracking-wider border border-black">
                        {other.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-black mb-3 leading-tight group-hover:text-[#854836] transition-colors line-clamp-2">
                      {other.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-sm text-black leading-relaxed mb-4 line-clamp-2">
                      {other.excerpt}
                    </p>

                    {/* Metadata */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="text-xs text-[#854836] font-bold uppercase">
                        {other.date}
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
        )}

        {/* Older Editorials (más viejas) */}
        {olderEditorials.length > 0 && (
          <section className="mb-12">
            <div className="bg-black text-white px-6 py-3 mb-6 border-4 border-black relative">
              <div className="absolute top-0 right-4 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[12px] border-b-[#854836] transform rotate-180"></div>
              <h2 className="text-2xl font-black uppercase tracking-wider">
                EDITORIALES ANTERIORES
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {olderEditorials.map((other) => (
                <Link
                  key={other.id}
                  to="/editorial/$slug"
                  params={{ slug: other.slug }}
                  className="block"
                >
                  <article className="bg-white border-4 border-black p-6 relative hover:shadow-[8px_8px_0_0_#000000] transition-all duration-300 group h-full">
                    <div className="absolute -top-1 -left-1 w-4 h-4 bg-[#854836] transform rotate-45"></div>

                    {/* Category */}
                    <div className="mb-3">
                      <span className="inline-block bg-[#F7F7F7] text-[#854836] px-3 py-1 font-bold uppercase text-xs tracking-wider border border-black">
                        {other.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-black mb-3 leading-tight group-hover:text-[#854836] transition-colors line-clamp-2">
                      {other.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-sm text-black leading-relaxed mb-4 line-clamp-2">
                      {other.excerpt}
                    </p>

                    {/* Metadata */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="text-xs text-[#854836] font-bold uppercase">
                        {other.date}
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
        )}

        {/* Back to all editorials */}
        {(recentEditorials.length > 0 || olderEditorials.length > 0) && (
          <div className="text-center">
            <Link
              to="/editorial"
              className="inline-block bg-black text-white px-8 py-3 font-black uppercase text-sm tracking-wider border-2 border-black hover:bg-[#854836] hover:shadow-[6px_6px_0_0_#000000] transition-all"
            >
              ← VER TODAS LAS EDITORIALES
            </Link>
          </div>
        )}
      </main>

      {/* Footer */}
      <UniversalFooter />
    </div>
  );
}
