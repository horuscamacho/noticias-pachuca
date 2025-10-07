import type { PublishedNoticia } from '../types/noticia.types';

interface NoticiaContentProps {
  noticia: PublishedNoticia;
}

/**
 * 📰 NoticiaContent Component
 *
 * Renderiza el contenido completo de una noticia:
 * - Imagen featured con srcset responsive
 * - Metadata (autor, fecha, categoría)
 * - Contenido HTML sanitizado
 * - Botones de compartir en redes
 */
export function NoticiaContent({ noticia }: NoticiaContentProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(noticia.seo.canonicalUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareOnTwitter = () => {
    const text = noticia.seo.twitterTitle || noticia.title;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(noticia.seo.canonicalUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareOnWhatsApp = () => {
    const text = `${noticia.title} - ${noticia.seo.canonicalUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      {/* Breaking News Badge */}
      {noticia.isBreaking && (
        <div className="mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <span className="animate-pulse mr-2">🔴</span>
            ÚLTIMA NOTICIA
          </span>
        </div>
      )}

      {/* Título */}
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
        {noticia.title}
      </h1>

      {/* Excerpt/Summary */}
      <p className="text-xl text-gray-600 mb-6 leading-relaxed">
        {noticia.excerpt}
      </p>

      {/* Metadata Bar */}
      <div className="flex flex-wrap items-center gap-4 mb-8 pb-6 border-b border-gray-200">
        {/* Categoría */}
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          {noticia.category}
        </span>

        {/* Autor */}
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
          <span>{noticia.author}</span>
        </div>

        {/* Fecha */}
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          <time dateTime={noticia.publishedAt.toISOString()}>
            {formatDate(noticia.publishedAt)}
          </time>
        </div>

        {/* Tiempo de lectura estimado */}
        {noticia.stats.readTime > 0 && (
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span>{noticia.stats.readTime} min de lectura</span>
          </div>
        )}
      </div>

      {/* Imagen Featured con srcset responsive */}
      {noticia.featuredImage && (
        <figure className="mb-8">
          <img
            src={noticia.featuredImage.large}
            srcSet={`
              ${noticia.featuredImage.medium} 800w,
              ${noticia.featuredImage.large} 1200w,
              ${noticia.featuredImage.original} 1920w
            `}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 800px, 1200px"
            alt={noticia.featuredImage.alt}
            width={noticia.featuredImage.width}
            height={noticia.featuredImage.height}
            className="w-full h-auto rounded-lg shadow-lg"
            loading="eager"
          />
          {noticia.featuredImage.alt && (
            <figcaption className="mt-2 text-sm text-gray-600 text-center italic">
              {noticia.featuredImage.alt}
            </figcaption>
          )}
        </figure>
      )}

      {/* Contenido HTML */}
      <div
        className="prose prose-lg max-w-none mb-8
          prose-headings:font-bold prose-headings:text-gray-900
          prose-p:text-gray-700 prose-p:leading-relaxed
          prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
          prose-strong:text-gray-900 prose-strong:font-semibold
          prose-ul:list-disc prose-ul:pl-6
          prose-ol:list-decimal prose-ol:pl-6
          prose-li:text-gray-700
          prose-img:rounded-lg prose-img:shadow-md"
        dangerouslySetInnerHTML={{ __html: noticia.content }}
      />

      {/* Tags */}
      {noticia.tags && noticia.tags.length > 0 && (
        <div className="mb-8 pb-8 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Etiquetas:</h3>
          <div className="flex flex-wrap gap-2">
            {noticia.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Botones de Compartir */}
      <div className="flex items-center justify-between py-6 border-t border-b border-gray-200 mb-8">
        <h3 className="text-lg font-semibold text-gray-900">Compartir:</h3>
        <div className="flex gap-3">
          {/* Facebook */}
          <button
            onClick={shareOnFacebook}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            aria-label="Compartir en Facebook"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </button>

          {/* Twitter/X */}
          <button
            onClick={shareOnTwitter}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-black hover:bg-gray-800 text-white transition-colors"
            aria-label="Compartir en Twitter/X"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </button>

          {/* WhatsApp */}
          <button
            onClick={shareOnWhatsApp}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors"
            aria-label="Compartir en WhatsApp"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}
