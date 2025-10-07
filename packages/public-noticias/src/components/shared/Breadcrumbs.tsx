import { Link } from '@tanstack/react-router';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

/**
 * 🍞 Breadcrumbs - Brutalist Design
 * Breadcrumbs con diseño brutalist: separadores bold, tipografía mono
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-2 font-mono text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  to={item.href}
                  className="font-bold text-black hover:text-[#FF0000] transition-colors uppercase"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={`uppercase ${isLast ? 'text-gray-600' : 'font-bold'}`}>
                  {item.label}
                </span>
              )}

              {/* Separator */}
              {!isLast && <span className="text-gray-400 font-bold">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
