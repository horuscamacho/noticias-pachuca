import { createFileRoute, Link } from '@tanstack/react-router';
import { getNoticiaBySlug, getRelatedNoticias, useNoticiaAnalytics } from '../features/noticias';
import type { PublishedNoticia } from '../features/noticias';
import { OptimizedImage } from '../components/OptimizedImage';
import { PachucaMural } from '../components/shared/PachucaMural';
import { UniversalFooter } from '../components/shared/UniversalFooter';
import { generateBreadcrumbSchema } from '../utils/generateBreadcrumbSchema';

export const Route = createFileRoute('/noticia/$slug')({
  component: NoticiaPage,
  loader: async ({ params }) => {
    const { slug } = params;

    // Fetch noticia principal
    const noticiaResponse = await getNoticiaBySlug({ data: slug });

    if (!noticiaResponse.success || !noticiaResponse.data) {
      throw new Error('Noticia no encontrada');
    }

    const noticia = noticiaResponse.data;

    // Fetch noticias relacionadas con la categoría correcta
    const related = await getRelatedNoticias({
      data: {
        category: noticia.category,
        slug: noticia.slug,
        limit: 3,
      }
    });

    return {
      noticia,
      related: related.data,
    };
  },
  head: ({ loaderData }) => {
    const { noticia } = loaderData;

    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Inicio', url: 'https://noticiaspachuca.com' },
      { name: noticia.category, url: `https://noticiaspachuca.com/categoria/${noticia.category.toLowerCase()}` },
      { name: noticia.title, url: noticia.seo.canonicalUrl }
    ]);

    return {
      meta: [
        // Basic meta tags
        { title: noticia.seo.metaTitle },
        { name: 'description', content: noticia.seo.metaDescription },
        { name: 'keywords', content: noticia.keywords.join(', ') },
        { name: 'author', content: noticia.author },

        // Open Graph
        { property: 'og:title', content: noticia.seo.ogTitle },
        { property: 'og:description', content: noticia.seo.ogDescription },
        { property: 'og:image', content: noticia.seo.ogImage },
        { property: 'og:type', content: noticia.seo.ogType },
        { property: 'og:url', content: noticia.seo.canonicalUrl },

        // Twitter Card
        { name: 'twitter:card', content: noticia.seo.twitterCard },
        { name: 'twitter:title', content: noticia.seo.twitterTitle },
        { name: 'twitter:description', content: noticia.seo.twitterDescription },
        { name: 'twitter:image', content: noticia.seo.twitterImage },

        // SEO meta
        { name: 'robots', content: 'index, follow, max-image-preview:large' },
      ],
      links: [
        { rel: 'canonical', href: noticia.seo.canonicalUrl },
      ],
      scripts: [
        // NewsArticle Structured Data (JSON-LD)
        {
          type: 'application/ld+json',
          children: JSON.stringify(noticia.seo.structuredData),
        },
        // BreadcrumbList Schema
        {
          type: 'application/ld+json',
          children: JSON.stringify(breadcrumbSchema),
        },
      ],
    };
  },
});

function NoticiaPage() {
  const { noticia, related } = Route.useLoaderData();

  // Analytics tracking
  const { handleShare } = useNoticiaAnalytics(noticia.slug);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date).toUpperCase();
  };

  const shareOnFacebook = () => {
    handleShare('facebook'); // Track analytics
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(noticia.seo.canonicalUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareOnTwitter = () => {
    handleShare('twitter'); // Track analytics
    const text = noticia.seo.twitterTitle || noticia.title;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(noticia.seo.canonicalUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareOnWhatsApp = () => {
    handleShare('whatsapp'); // Track analytics
    const text = `${noticia.title} - ${noticia.seo.canonicalUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* 🏗️ BRUTALIST HEADER */}
      <header className="bg-white border-b-4 border-black relative overflow-hidden">
        {/* Top Bar */}
        <div className="border-b-2 border-black px-4 py-2">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between md:items-center space-y-2 md:space-y-0 text-sm">
            <div className="flex items-center justify-center md:justify-start space-x-2 md:space-x-4">
              <span className="font-bold uppercase tracking-wider text-black text-xs md:text-sm">
                {formatDate(noticia.publishedAt)}
              </span>
              <span className="text-[#854836] font-bold text-xs md:text-sm">EDICIÓN DE HOY</span>
            </div>
            <div className="flex items-center justify-center md:justify-end space-x-2 md:space-x-4">
              <Link
                to="/"
                className="bg-black text-white px-3 md:px-4 py-1 font-bold uppercase text-xs border-2 border-black hover:bg-[#FF0000] transition-colors"
              >
                INICIO
              </Link>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center relative">
              <div className="absolute -top-2 -left-2 w-4 h-4 md:w-6 md:h-6 bg-[#FF0000] transform rotate-45"></div>
              <Link to="/" className="inline-block">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-[0.1em] text-black mb-1">
                  NOTICIAS
                </h1>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-[0.1em] text-[#854836]">
                  PACHUCA
                </h2>
              </Link>
              <div className="w-12 md:w-14 lg:w-16 h-1 bg-[#FFB22C] mx-auto mt-2"></div>
              <div className="absolute -bottom-2 -right-2 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] lg:border-l-[12px] lg:border-r-[12px] lg:border-b-[12px] border-l-transparent border-r-transparent border-b-black"></div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="bg-black text-white">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-center">
              <Link
                to="/"
                className="font-bold uppercase text-sm tracking-wider hover:text-[#FFB22C] transition-colors"
              >
                ← VOLVER AL INICIO
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Breaking News Badge (si aplica) */}
      {noticia.isBreaking && (
        <div className="bg-[#FF0000] text-white py-3 border-b-4 border-black relative overflow-hidden">
          <div className="absolute left-0 top-0 w-8 h-8 bg-black transform rotate-45 -translate-x-4 -translate-y-4"></div>
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-center">
              <div className="bg-white text-[#FF0000] px-4 py-1 font-black uppercase text-sm border-2 border-black">
                ÚLTIMO MOMENTO
              </div>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 w-6 h-6 bg-[#FFB22C] transform rotate-45 translate-x-3 translate-y-3"></div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <article className="bg-white border-4 border-black relative mb-8 overflow-hidden">
          <div className="absolute -top-2 -left-2 w-8 h-8 bg-[#FFB22C] transform rotate-45"></div>

          {/* Article Header */}
          <div className="p-6 md:p-8 border-b-4 border-black">
            {/* Category & Meta */}
            <div className="space-y-4 mb-6">
              {/* Row 1: Category + Publication Date */}
              <div className="flex flex-wrap items-center gap-4">
                <span className="bg-[#854836] text-white px-4 py-2 font-bold uppercase text-sm tracking-wider border-4 border-black">
                  {noticia.category}
                </span>
                <div className="h-8 w-1 bg-black hidden sm:block"></div>
                <span className="font-mono text-base text-black font-bold uppercase tracking-tight">
                  {new Intl.DateTimeFormat('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(noticia.publishedAt)}
                </span>
              </div>

              {/* Row 2: Author */}
              <div className="flex flex-wrap items-center gap-4 border-l-4 border-[#FFB22C] pl-4">
                <Link
                  to="/autor/$slug"
                  params={{ slug: noticia.author?.toLowerCase().replace(/\s+/g, '-') || 'redaccion' }}
                  className="font-mono text-sm text-black font-bold uppercase tracking-wide hover:text-[#FF0000] hover:underline decoration-4 underline-offset-2 transition-all"
                >
                  POR {noticia.author}
                </Link>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tight text-black leading-tight mb-6">
              {noticia.title}
            </h1>

            {/* Excerpt */}
            <p className="text-lg md:text-xl leading-relaxed text-black font-medium mb-6">
              {noticia.excerpt}
            </p>

            {/* Share Buttons */}
            <div className="pt-4 border-t-2 border-black">
              <span className="font-bold uppercase text-sm tracking-wider text-black block mb-3">COMPARTIR:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={shareOnFacebook}
                  className="bg-[#1877F2] text-white px-3 md:px-4 py-2 font-bold uppercase text-xs border-2 border-black hover:bg-black transition-colors flex-shrink-0"
                >
                  FACEBOOK
                </button>
                <button
                  onClick={shareOnTwitter}
                  className="bg-black text-white px-3 md:px-4 py-2 font-bold uppercase text-xs border-2 border-black hover:bg-[#FF0000] transition-colors flex-shrink-0"
                >
                  X/TWITTER
                </button>
                <button
                  onClick={shareOnWhatsApp}
                  className="bg-[#25D366] text-white px-3 md:px-4 py-2 font-bold uppercase text-xs border-2 border-black hover:bg-black transition-colors flex-shrink-0"
                >
                  WHATSAPP
                </button>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          {noticia.featuredImage ? (
            <div className="relative">
              <img
                src={noticia.featuredImage.large}
                srcSet={`
                  ${noticia.featuredImage.medium} 800w,
                  ${noticia.featuredImage.large} 1200w,
                  ${noticia.featuredImage.original} 1920w
                `}
                sizes="(max-width: 768px) 100vw, 1200px"
                alt={noticia.featuredImage.alt}
                width={noticia.featuredImage.width}
                height={noticia.featuredImage.height}
                className="w-full h-auto border-b-4 border-black"
                loading="eager"
              />
              {noticia.featuredImage.alt && (
                <div className="bg-black text-white px-6 py-3 font-bold uppercase text-xs tracking-wider border-b-4 border-black">
                  {noticia.featuredImage.alt}
                </div>
              )}
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-[#FF0000] transform rotate-45"></div>
            </div>
          ) : (
            <div className="border-b-4 border-black">
              <PachucaMural className="w-full aspect-[16/9]" />
            </div>
          )}

          {/* Article Content */}
          <div className="p-6 md:p-8">
            <div
              className="prose prose-lg max-w-none
                [&>p]:text-black [&>p]:leading-relaxed [&>p]:mb-6 [&>p]:text-base
                [&>h2]:text-2xl [&>h2]:font-black [&>h2]:uppercase [&>h2]:tracking-tight [&>h2]:text-black [&>h2]:mb-4 [&>h2]:mt-8
                [&>h3]:text-xl [&>h3]:font-bold [&>h3]:uppercase [&>h3]:text-[#854836] [&>h3]:mb-3 [&>h3]:mt-6
                [&>a]:text-[#854836] [&>a]:font-bold [&>a]:underline [&>a:hover]:text-[#FF0000]
                [&>strong]:font-black [&>strong]:text-black
                [&>ul]:list-none [&>ul]:pl-0 [&>ul>li]:mb-3 [&>ul>li]:pl-6 [&>ul>li]:relative [&>ul>li::before]:content-['▪'] [&>ul>li::before]:absolute [&>ul>li::before]:left-0 [&>ul>li::before]:text-[#FFB22C] [&>ul>li::before]:font-black
                [&>ol]:list-decimal [&>ol]:pl-6 [&>ol>li]:mb-3 [&>ol>li]:font-medium
                [&>blockquote]:border-l-4 [&>blockquote]:border-[#854836] [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:text-black [&>blockquote]:my-6
                [&>img]:border-2 [&>img]:border-black [&>img]:my-6"
              dangerouslySetInnerHTML={{ __html: noticia.content }}
            />

            {/* Tags */}
            {noticia.tags && noticia.tags.length > 0 && (
              <div className="mt-12 pt-6 border-t-4 border-black">
                <div className="flex flex-wrap gap-2">
                  {noticia.tags.map((tag, index) => (
                    <Link
                      key={index}
                      to="/tag/$slug"
                      params={{ slug: tag.toLowerCase().replace(/\s+/g, '-') }}
                      className="bg-[#F7F7F7] text-black px-3 py-1 font-bold uppercase text-xs tracking-wider border-2 border-black hover:bg-[#FFB22C] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#854836] transform rotate-45"></div>
        </article>

        {/* Related Articles */}
        {related && related.length > 0 && (
          <section className="mt-12">
            <div className="bg-black text-white px-6 py-3 font-black uppercase text-xl tracking-wider border-4 border-black mb-6 relative overflow-hidden">
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-[#FFB22C] transform rotate-45"></div>
              NOTICIAS RELACIONADAS
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((relatedNoticia) => (
                <Link
                  key={relatedNoticia._id}
                  to="/noticia/$slug"
                  params={{ slug: relatedNoticia.slug }}
                  className="block group h-full"
                >
                  <article className="h-full flex flex-col bg-white border-4 border-black hover:border-[#FF0000] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all relative">
                    <div className="absolute -top-2 -left-2 w-6 h-6 bg-[#854836] transform rotate-45 group-hover:bg-[#FF0000] transition-colors"></div>

                    <div className="p-5 flex flex-col flex-1">
                      <span className="bg-[#854836] text-white px-2 py-1 font-bold uppercase text-xs tracking-wider border-2 border-black mb-3 inline-block">
                        {relatedNoticia.category}
                      </span>

                      <h3 className="font-mono text-lg font-bold leading-tight text-black mb-3 group-hover:text-[#FF0000] transition-colors line-clamp-3 flex-1">
                        {relatedNoticia.title}
                      </h3>

                      <div className="mt-auto pt-3 border-t-2 border-gray-200">
                        <p className="text-xs text-gray-600 font-bold uppercase">
                          POR {relatedNoticia.author}
                        </p>
                      </div>
                    </div>

                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#FFB22C] transform rotate-45 group-hover:bg-[#FF0000] transition-colors"></div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <UniversalFooter />
    </div>
  );
}
