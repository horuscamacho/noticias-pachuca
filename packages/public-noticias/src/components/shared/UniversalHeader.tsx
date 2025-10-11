'use client'

import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { DynamicCategoriesNav } from './DynamicCategoriesNav';

/**
 * 🏗️ UNIVERSAL HEADER - Noticias Pachuca
 * Header reutilizable para todas las páginas
 * Diseño brutalist con navegación dinámica
 *
 * Las categorías se cargan en el loader del servidor y se pasan por props
 */

interface Category {
  id: string;
  name: string;
  slug: string;
  color?: string;
  count?: number;
}

interface UniversalHeaderProps {
  categories?: Category[];
  showBreakingNews?: boolean;
  breakingNews?: {
    title: string;
    slug: string;
  };
}

export function UniversalHeader({
  categories = [],
  showBreakingNews = false,
  breakingNews
}: UniversalHeaderProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const formatHeaderDate = () => {
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date()).toUpperCase();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate({ to: '/busqueda/$query', params: { query: searchQuery.trim() } });
    }
  };

  return (
    <>
      <header className="bg-white border-b-4 border-black relative">
        {/* Top Bar */}
        <div className="border-b-2 border-black px-4 py-2">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between md:items-center space-y-2 md:space-y-0 text-sm">
            <div className="flex items-center justify-center md:justify-start space-x-2 md:space-x-4">
              <span className="font-bold uppercase tracking-wider text-black text-xs md:text-sm">
                {formatHeaderDate()}
              </span>
              <span className="text-[#854836] font-bold text-xs md:text-sm">EDICIÓN DE HOY</span>
            </div>
            <div className="flex items-center justify-center md:justify-end space-x-2 md:space-x-4">
              <Link
                to="/login"
                className="bg-black text-white px-3 md:px-4 py-1 font-bold uppercase text-xs border-2 border-black hover:bg-[#FF0000] transition-colors"
              >
                INICIAR SESIÓN
              </Link>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 space-y-4 md:space-y-0">
              {/* Search - Full width on mobile */}
              <div className="md:flex-1 order-2 md:order-1">
                <form onSubmit={handleSearch} className="relative max-w-md mx-auto md:mx-0">
                  <input
                    type="search"
                    placeholder="BUSCAR..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-black bg-[#F7F7F7] font-bold uppercase text-sm placeholder-black focus:outline-none focus:bg-white"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-2 w-6 h-6 bg-black flex items-center justify-center hover:bg-[#FF0000] transition-colors"
                  >
                    <div className="w-3 h-3 border-2 border-white rounded-full"></div>
                  </button>
                </form>
              </div>

              {/* Logo - Centered and larger on mobile */}
              <div className="md:flex-1 text-center relative order-1 md:order-2">
                <Link to="/">
                  <div className="absolute -top-2 -left-2 w-4 h-4 md:w-6 md:h-6 bg-[#FF0000] transform rotate-45"></div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-[0.1em] text-black mb-1">
                    NOTICIAS
                  </h1>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-[0.1em] text-[#854836]">
                    PACHUCA
                  </h2>
                  <div className="w-12 md:w-14 lg:w-16 h-1 bg-[#FFB22C] mx-auto mt-2"></div>
                  <div className="absolute -bottom-2 -right-2 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] lg:border-l-[12px] lg:border-r-[12px] lg:border-b-[12px] border-l-transparent border-r-transparent border-b-black"></div>
                </Link>
              </div>

              {/* Right side info - Hidden on mobile */}
              <div className="hidden md:flex md:flex-1 text-right order-3">
                <div className="ml-auto">
                  <div className="text-sm font-bold uppercase tracking-wider text-black">
                    HIDALGO, MÉXICO
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Categories Navigation - Isla */}
        <DynamicCategoriesNav categories={categories} />
      </header>

      {/* Breaking News Banner */}
      {showBreakingNews && breakingNews && (
        <div className="bg-[#FF0000] text-white py-3 border-b-4 border-black relative overflow-hidden">
          <div className="absolute left-0 top-0 w-8 h-8 bg-black transform rotate-45 -translate-x-4 -translate-y-4"></div>
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center">
              <div className="bg-white text-[#FF0000] px-4 py-1 font-black uppercase text-sm mr-4 border-2 border-black">
                ÚLTIMO MOMENTO
              </div>
              <Link
                to="/noticia/$slug"
                params={{ slug: breakingNews.slug }}
                className="font-bold uppercase text-lg tracking-wide hover:underline"
              >
                {breakingNews.title}
              </Link>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 w-6 h-6 bg-[#FFB22C] transform rotate-45 translate-x-3 translate-y-3"></div>
        </div>
      )}
    </>
  );
}
