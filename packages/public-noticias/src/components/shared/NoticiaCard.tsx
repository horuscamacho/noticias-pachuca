import { Link } from '@tanstack/react-router';
import { OptimizedImage } from '../OptimizedImage';

export interface NoticiaCardProps {
  slug: string;
  title: string;
  summary: string;
  image?: string;
  category: {
    name: string;
    slug: string;
    color: string;
  };
  publishedAt: string;
  readTime?: number;
  author?: string;
}

/**
 * 📰 NoticiaCard - Brutalist Editorial Design
 * Tarjeta de noticia con diseño brutalist: bordes gruesos, tipografía bold, hover effects marcados
 */
export function NoticiaCard({
  slug,
  title,
  summary,
  image,
  category,
  publishedAt,
  readTime,
  author,
}: NoticiaCardProps) {
  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date)).toUpperCase();
  };

  return (
    <Link
      to="/noticia/$slug"
      params={{ slug }}
      className="block group h-full"
    >
      <article className="h-full flex flex-col border-4 border-black bg-white transition-all duration-200 hover:border-[#FF0000] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        {/* Contenido */}
        <div className="p-6 flex flex-col flex-1">
          {/* Badge de categoría */}
          <div className="mb-4">
            <span
              className="inline-block px-3 py-1 border-2 border-black font-mono text-xs font-bold uppercase tracking-wider"
              style={{ backgroundColor: category.color }}
            >
              {category.name}
            </span>
          </div>

          {/* Título */}
          <h3 className="font-mono text-xl font-bold leading-tight mb-3 group-hover:text-[#FF0000] transition-colors line-clamp-3">
            {title}
          </h3>

          {/* Resumen */}
          <p className="text-gray-700 leading-relaxed mb-4 line-clamp-3 flex-1">
            {summary}
          </p>

          {/* Metadata */}
          <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200 mt-auto">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="font-mono font-bold">{formatDate(publishedAt)}</span>

              {readTime && (
                <>
                  <span>•</span>
                  <span>{readTime} min</span>
                </>
              )}

              {author && (
                <>
                  <span>•</span>
                  <span className="font-semibold">{author}</span>
                </>
              )}
            </div>

            {/* Arrow indicator */}
            <div className="text-[#FF0000] font-bold text-xl group-hover:translate-x-1 transition-transform">
              →
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
