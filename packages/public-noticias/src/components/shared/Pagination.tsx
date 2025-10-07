import { Link } from '@tanstack/react-router';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  searchParams?: Record<string, string>;
}

/**
 * 🔢 Pagination - Brutalist Design
 * Paginación con diseño brutalist: bordes gruesos, números bold, arrows marcadas
 */
export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  searchParams = {},
}: PaginationProps) {
  // Si solo hay una página, no mostrar paginación
  if (totalPages <= 1) {
    return null;
  }

  const maxVisiblePages = 7; // Mostrar máximo 7 páginas visibles
  const halfVisible = Math.floor(maxVisiblePages / 2);

  let startPage = Math.max(1, currentPage - halfVisible);
  let endPage = Math.min(totalPages, currentPage + halfVisible);

  // Ajustar si estamos al inicio o al final
  if (currentPage <= halfVisible) {
    endPage = Math.min(totalPages, maxVisiblePages);
  }
  if (currentPage + halfVisible >= totalPages) {
    startPage = Math.max(1, totalPages - maxVisiblePages + 1);
  }

  const pages = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  const createUrl = (page: number) => {
    const params = new URLSearchParams({ ...searchParams, page: page.toString() });
    return `${baseUrl}?${params.toString()}`;
  };

  const buttonClasses = (active: boolean) =>
    `px-4 py-2 border-4 border-black font-mono font-bold text-lg transition-all ${
      active
        ? 'bg-[#FF0000] text-white'
        : 'bg-white text-black hover:bg-black hover:text-white'
    }`;

  return (
    <nav className="flex items-center justify-center gap-2 my-12" aria-label="Paginación">
      {/* Previous Button */}
      {currentPage > 1 ? (
        <Link
          to={createUrl(currentPage - 1)}
          className={buttonClasses(false)}
          aria-label="Página anterior"
        >
          ←
        </Link>
      ) : (
        <button
          disabled
          className="px-4 py-2 border-4 border-gray-300 font-mono font-bold text-lg bg-gray-100 text-gray-400 cursor-not-allowed"
          aria-label="Página anterior"
        >
          ←
        </button>
      )}

      {/* First page + dots if needed */}
      {startPage > 1 && (
        <>
          <Link
            to={createUrl(1)}
            className={buttonClasses(false)}
            aria-label="Página 1"
          >
            1
          </Link>
          {startPage > 2 && (
            <span className="px-2 font-mono font-bold text-gray-400">...</span>
          )}
        </>
      )}

      {/* Page numbers */}
      {pages.map((page) => (
        <Link
          key={page}
          to={createUrl(page)}
          className={buttonClasses(page === currentPage)}
          aria-label={`Página ${page}`}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </Link>
      ))}

      {/* Last page + dots if needed */}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && (
            <span className="px-2 font-mono font-bold text-gray-400">...</span>
          )}
          <Link
            to={createUrl(totalPages)}
            className={buttonClasses(false)}
            aria-label={`Página ${totalPages}`}
          >
            {totalPages}
          </Link>
        </>
      )}

      {/* Next Button */}
      {currentPage < totalPages ? (
        <Link
          to={createUrl(currentPage + 1)}
          className={buttonClasses(false)}
          aria-label="Página siguiente"
        >
          →
        </Link>
      ) : (
        <button
          disabled
          className="px-4 py-2 border-4 border-gray-300 font-mono font-bold text-lg bg-gray-100 text-gray-400 cursor-not-allowed"
          aria-label="Página siguiente"
        >
          →
        </button>
      )}
    </nav>
  );
}
