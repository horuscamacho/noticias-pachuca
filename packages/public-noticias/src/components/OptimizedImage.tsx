/**
 * 📸 MEJORES PRÁCTICAS 2025/2026 - LAZY LOADING NATIVO + FORMATOS MODERNOS
 *
 * TanStack Start no tiene componente de imagen integrado.
 * Approach moderno: usar atributos nativos del navegador
 *
 * FASE 2 SEO: Soporte para AVIF/WebP con <picture> element
 *
 * Referencias:
 * - https://developer.mozilla.org/en-US/docs/Web/Performance/Lazy_loading
 * - https://web.dev/articles/browser-level-image-lazy-loading
 * - https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture
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
 * Helper: Generar URLs para diferentes formatos
 * Soporta 2 estrategias:
 * 1. Query params (si CDN soporta): image.jpg?format=avif
 * 2. Extensión (si backend genera): image.avif
 */
function generateImageUrls(src: string) {
  // Estrategia 1: Query params (Cloudflare Images, imgix, etc.)
  // TODO: Detectar si el CDN soporta transformaciones
  const hasQueryParams = src.includes('?')

  if (hasQueryParams) {
    // CDN con transformaciones
    return {
      avif: `${src}&format=avif`,
      webp: `${src}&format=webp`,
      jpg: src
    }
  }

  // Estrategia 2: Cambiar extensión
  const lastDot = src.lastIndexOf('.')
  const basePath = src.substring(0, lastDot)
  const ext = src.substring(lastDot + 1)

  // Solo aplicar si es jpg/jpeg/png
  if (['jpg', 'jpeg', 'png'].includes(ext.toLowerCase())) {
    return {
      avif: `${basePath}.avif`,
      webp: `${basePath}.webp`,
      jpg: src
    }
  }

  // Si no es imagen optimizable, usar original
  return {
    avif: null,
    webp: null,
    jpg: src
  }
}

/**
 * Componente optimizado con soporte AVIF/WebP
 * Usa <picture> para fallback progresivo de formatos
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
  const { avif, webp, jpg } = generateImageUrls(src)

  return (
    <picture>
      {/* AVIF: Mejor compresión (-50% vs WebP) */}
      {avif && (
        <source
          type="image/avif"
          srcSet={avif}
          sizes={sizes}
        />
      )}

      {/* WebP: Buena compresión, soporte universal */}
      {webp && (
        <source
          type="image/webp"
          srcSet={webp}
          sizes={sizes}
        />
      )}

      {/* JPEG/PNG: Fallback para navegadores antiguos */}
      <img
        src={jpg}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'} // FASE 2: fetchpriority para LCP
        decoding="async"
        className={className}
      />
    </picture>
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

  // Construir srcset para responsive images (JPEG fallback)
  const srcSet = [
    featuredImage.thumbnail && `${featuredImage.thumbnail} 400w`,
    featuredImage.medium && `${featuredImage.medium} 800w`,
    featuredImage.large && `${featuredImage.large} 1200w`,
    featuredImage.original && `${featuredImage.original} 1920w`,
  ]
    .filter(Boolean)
    .join(', ');

  // Generar URLs para formatos modernos
  const { avif: avifSrc, webp: webpSrc } = generateImageUrls(src)

  // Construir srcset para AVIF
  const avifSrcSet = avifSrc ? [
    featuredImage.thumbnail && `${featuredImage.thumbnail.replace(/\.(jpg|jpeg|png)$/i, '.avif')} 400w`,
    featuredImage.medium && `${featuredImage.medium.replace(/\.(jpg|jpeg|png)$/i, '.avif')} 800w`,
    featuredImage.large && `${featuredImage.large.replace(/\.(jpg|jpeg|png)$/i, '.avif')} 1200w`,
    featuredImage.original && `${featuredImage.original.replace(/\.(jpg|jpeg|png)$/i, '.avif')} 1920w`,
  ].filter(Boolean).join(', ') : undefined

  // Construir srcset para WebP
  const webpSrcSet = webpSrc ? [
    featuredImage.thumbnail && `${featuredImage.thumbnail.replace(/\.(jpg|jpeg|png)$/i, '.webp')} 400w`,
    featuredImage.medium && `${featuredImage.medium.replace(/\.(jpg|jpeg|png)$/i, '.webp')} 800w`,
    featuredImage.large && `${featuredImage.large.replace(/\.(jpg|jpeg|png)$/i, '.webp')} 1200w`,
    featuredImage.original && `${featuredImage.original.replace(/\.(jpg|jpeg|png)$/i, '.webp')} 1920w`,
  ].filter(Boolean).join(', ') : undefined

  const sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"

  return (
    <picture>
      {/* AVIF: Formato más moderno */}
      {avifSrcSet && (
        <source
          type="image/avif"
          srcSet={avifSrcSet}
          sizes={sizes}
        />
      )}

      {/* WebP: Amplio soporte */}
      {webpSrcSet && (
        <source
          type="image/webp"
          srcSet={webpSrcSet}
          sizes={sizes}
        />
      )}

      {/* JPEG/PNG: Fallback */}
      <img
        src={src}
        srcSet={srcSet || undefined}
        sizes={sizes}
        alt={alt}
        width={featuredImage.width}
        height={featuredImage.height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        className={className}
      />
    </picture>
  );
}
