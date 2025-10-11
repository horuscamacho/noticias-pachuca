'use client';

import { Link, useLocation } from '@tanstack/react-router';

/**
 * 🏝️ DYNAMIC CATEGORIES NAV - Componente Isla
 *
 * Componente con 'use client' para interactividad del menú móvil
 * Las categorías se pasan por props desde el loader del servidor
 */

interface Category {
  id: string;
  name: string;
  slug: string;
  color?: string;
  count?: number;
}

interface DynamicCategoriesNavProps {
  categories: Category[];
}

export function DynamicCategoriesNav({ categories = [] }: DynamicCategoriesNavProps) {
  const location = useLocation();

  // Detectar si estamos en la home
  const isHome = location.pathname === '/';

  // Extraer el slug de la categoría actual desde la URL
  // Formato: /categoria/medio-ambiente
  const currentCategorySlug = location.pathname.startsWith('/categoria/')
    ? location.pathname.split('/')[2]?.split('?')[0] // Remover query params
    : null;

  return (
    <nav className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-center space-x-4 lg:space-x-8 py-3">
          <Link
            to="/"
            className={`font-bold uppercase text-sm tracking-wider transition-colors relative group ${
              isHome ? 'text-[#FFB22C]' : 'hover:text-[#FFB22C]'
            }`}
          >
            INICIO
            <div className={`absolute -bottom-1 left-0 h-1 bg-[#FFB22C] transition-all duration-300 ${
              isHome ? 'w-full' : 'w-0 group-hover:w-full'
            }`}></div>
          </Link>
          {categories.slice(0, 8).map((category) => {
            const isActive = currentCategorySlug === category.slug;
            return (
              <Link
                key={category.id}
                to="/categoria/$slug"
                params={{ slug: category.slug }}
                className={`font-bold uppercase text-sm tracking-wider transition-colors relative group ${
                  isActive ? 'text-[#FFB22C]' : 'hover:text-[#FFB22C]'
                }`}
              >
                {category.name}
                <div className={`absolute -bottom-1 left-0 h-1 bg-[#FFB22C] transition-all duration-300 ${
                  isActive ? 'w-full' : 'w-0 group-hover:w-full'
                }`}></div>
              </Link>
            );
          })}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden py-3">
          <div className="flex items-center justify-between">
            <span className="font-bold uppercase text-sm tracking-wider text-[#FFB22C]">SECCIONES</span>
            <button
              className="text-white hover:text-[#FFB22C] transition-colors"
              onClick={() => {
                const menu = document.getElementById('mobile-menu');
                menu?.classList.toggle('hidden');
              }}
            >
              <div className="w-6 h-6 flex flex-col justify-center space-y-1">
                <div className="w-6 h-0.5 bg-white"></div>
                <div className="w-6 h-0.5 bg-white"></div>
                <div className="w-6 h-0.5 bg-white"></div>
              </div>
            </button>
          </div>

          {/* Mobile Menu */}
          <div id="mobile-menu" className="hidden mt-4 grid grid-cols-2 gap-2">
            <Link
              to="/"
              className={`px-3 py-2 font-bold uppercase text-xs tracking-wider border transition-colors text-center ${
                isHome
                  ? 'bg-[#FFB22C] text-black border-[#FFB22C]'
                  : 'bg-black text-white border-[#FFB22C] hover:bg-[#FF0000]'
              }`}
            >
              INICIO
            </Link>
            {categories.map((category) => {
              const isActive = currentCategorySlug === category.slug;
              return (
                <Link
                  key={category.id}
                  to="/categoria/$slug"
                  params={{ slug: category.slug }}
                  className={`px-3 py-2 font-bold uppercase text-xs tracking-wider border transition-colors text-center ${
                    isActive
                      ? 'bg-[#FFB22C] text-black border-[#FFB22C]'
                      : 'bg-[#854836] text-white border-[#FFB22C] hover:bg-[#FF0000]'
                  }`}
                >
                  {category.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
