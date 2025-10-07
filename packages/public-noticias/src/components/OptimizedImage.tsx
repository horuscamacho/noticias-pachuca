/**
 * 📸 MEJORES PRÁCTICAS 2025/2026 - LAZY LOADING NATIVO
 *
 * TanStack Start no tiene componente de imagen integrado.
 * Approach moderno: usar atributos nativos del navegador
 *
 * Referencias:
 * - https://developer.mozilla.org/en-US/docs/Web/Performance/Lazy_loading
 * - https://web.dev/articles/browser-level-image-lazy-loading
 */

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean; // true = above-the-fold (eager), false = below-the-fold (lazy)
  srcSet?: string;
  sizes?: string;
}

/**
 * Componente simple sin estado de React (evita re-renders)
 * Usa solo atributos nativos del navegador
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  srcSet,
  sizes = '100vw',
}: OptimizedImageProps) {
  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'} // Lazy loading nativo
      decoding="async" // Decodificación asíncrona (no bloquea el render)
      className={className}
    />
  );
}

/**
 * Componente especializado para imágenes de noticias
 * Construye srcset automáticamente desde featuredImage
 */
interface NoticiaImageProps {
  featuredImage: {
    thumbnail?: string;
    medium?: string;
    large?: string;
    original?: string;
    alt?: string;
    width?: number;
    height?: number;
  } | null;
  title: string;
  priority?: boolean;
  className?: string;
}

export function NoticiaImage({
  featuredImage,
  title,
  priority = false,
  className = '',
}: NoticiaImageProps) {
  if (!featuredImage?.medium && !featuredImage?.large) {
    return null;
  }

  // Usar la mejor imagen disponible como src
  const src = featuredImage.large || featuredImage.medium || featuredImage.original || '';
  const alt = featuredImage.alt || title;

  // Construir srcset para responsive images
  const srcSet = [
    featuredImage.thumbnail && `${featuredImage.thumbnail} 400w`,
    featuredImage.medium && `${featuredImage.medium} 800w`,
    featuredImage.large && `${featuredImage.large} 1200w`,
    featuredImage.original && `${featuredImage.original} 1920w`,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <img
      src={src}
      srcSet={srcSet || undefined}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      alt={alt}
      width={featuredImage.width}
      height={featuredImage.height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={className}
    />
  );
}
