import { Link } from '@tanstack/react-router';
import type { PublishedNoticia } from '../types/noticia.types';

interface RelatedNoticiasProps {
  noticias: PublishedNoticia[];
}

/**
 * 🔗 RelatedNoticias Component
 *
 * Grid de noticias relacionadas (misma categoría).
 * Se muestra al final de cada artículo.
 */
export function RelatedNoticias({ noticias }: RelatedNoticiasProps) {
  if (!noticias || noticias.length === 0) {
    return null;
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 py-12 bg-[#F7F7F7]">
      <div className="mb-8">
        <h2 className="font-mono text-3xl md:text-4xl font-bold text-black uppercase tracking-wider mb-2">
          Noticias Relacionadas
        </h2>
        <div className="w-24 h-1 bg-[#FFB22C]"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {noticias.map((noticia) => (
          <Link
            key={noticia._id}
            to="/noticia/$slug"
            params={{ slug: noticia.slug }}
            className="block group h-full"
          >
            <article className="h-full flex flex-col border-4 border-black bg-white transition-all duration-200 hover:border-[#FF0000] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              {/* Contenido */}
              <div className="p-5 flex flex-col flex-1">
                {/* Badge de categoría */}
                <div className="mb-3">
                  <span className="inline-block px-2 py-1 border-2 border-black font-mono text-xs font-bold uppercase tracking-wider bg-[#854836] text-white">
                    {noticia.category}
                  </span>
                </div>

                {/* Título */}
                <h3 className="font-mono text-lg font-bold leading-tight mb-3 group-hover:text-[#FF0000] transition-colors line-clamp-3">
                  {noticia.title}
                </h3>

                {/* Excerpt */}
                <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-2 flex-1">
                  {noticia.excerpt}
                </p>

                {/* Metadata */}
                <div className="flex items-center justify-between pt-3 border-t-2 border-gray-200 mt-auto">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="font-mono font-bold">{formatDate(noticia.publishedAt).toUpperCase()}</span>
                    {noticia.stats.readTime > 0 && (
                      <>
                        <span>•</span>
                        <span>{noticia.stats.readTime} min</span>
                      </>
                    )}
                  </div>

                  {/* Arrow indicator */}
                  <div className="text-[#FF0000] font-bold text-lg group-hover:translate-x-1 transition-transform">
                    →
                  </div>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}
