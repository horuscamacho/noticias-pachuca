'use client';

import { useState, useEffect, useRef } from 'react';
import { Link } from '@tanstack/react-router';

// ==================== INTERFACES ====================

export interface BreakingNewsItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
}

interface BreakingNewsBannerProps {
  news: BreakingNewsItem[];
  intervalMs?: number;
}

// ==================== MOCK DATA ====================

export const MOCK_BREAKING_NEWS: BreakingNewsItem[] = [
  {
    id: '1',
    slug: 'tormenta-severa-pachuca-alerta-roja',
    title: 'TORMENTA SEVERA AZOTA PACHUCA - ALERTA ROJA EMITIDA',
    excerpt: 'Protección Civil emite alerta roja para toda la zona metropolitana. Se esperan lluvias torrenciales y vientos de hasta 80 km/h durante las próximas 6 horas. Autoridades solicitan a la población permanecer en sus hogares.',
  },
  {
    id: '2',
    slug: 'hospital-general-atiende-emergencia-masiva',
    title: 'HOSPITAL GENERAL ATIENDE EMERGENCIA MASIVA TRAS ACCIDENTE EN CARRETERA',
    excerpt: 'Más de 20 personas resultaron heridas en un accidente múltiple en la carretera México-Pachuca. El Hospital General ha activado su protocolo de emergencias y solicita donadores de sangre tipo O+ y O-.',
  },
  {
    id: '3',
    slug: 'suspenden-clases-todas-escuelas',
    title: 'SUSPENDEN CLASES EN TODAS LAS ESCUELAS DE PACHUCA',
    excerpt: 'La Secretaría de Educación Pública anuncia suspensión de clases para todos los niveles educativos debido a las condiciones climáticas adversas. Las actividades se reanudarán hasta nuevo aviso.',
  },
];

// ==================== COMPONENT ====================

export function BreakingNewsBanner({
  news = MOCK_BREAKING_NEWS,
  intervalMs = 8000
}: BreakingNewsBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [shouldScroll, setShouldScroll] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if content overflows and needs scrolling
  useEffect(() => {
    if (contentRef.current && containerRef.current) {
      const contentWidth = contentRef.current.scrollWidth;
      const containerWidth = containerRef.current.clientWidth;
      setShouldScroll(contentWidth > containerWidth);
    }
  }, [currentIndex, news]);

  // Auto-cycle through breaking news
  useEffect(() => {
    if (news.length <= 1) return;

    const cycleInterval = setInterval(() => {
      // Fade out
      setIsVisible(false);

      // Wait for fade out, then change content and fade in
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % news.length);
        setIsVisible(true);
      }, 500); // Match fade-out duration
    }, intervalMs);

    return () => clearInterval(cycleInterval);
  }, [news.length, intervalMs]);

  if (!news || news.length === 0) return null;

  const currentNews = news[currentIndex];

  return (
    <div className="bg-[#FF0000] text-white border-b-4 border-black relative overflow-hidden h-[80px] md:h-[72px]">
      {/* Decorative elements */}
      <div className="absolute left-0 top-0 w-8 h-8 bg-black transform rotate-45 -translate-x-4 -translate-y-4"></div>
      <div className="absolute right-0 bottom-0 w-6 h-6 bg-[#FFB22C] transform rotate-45 translate-x-3 translate-y-3"></div>

      <div className="max-w-7xl mx-auto px-4 h-full flex flex-col justify-between">
        {/* Main Content Row - Single line only */}
        <div className="flex items-center gap-2 md:gap-4 pt-2.5 md:pt-3 h-[44px] md:h-[40px]">
          {/* Badge */}
          <div className="flex-shrink-0 bg-white text-[#FF0000] px-2 md:px-4 py-1 font-black uppercase text-[10px] md:text-sm border-2 border-black relative animate-pulse whitespace-nowrap">
            <span className="hidden md:inline">🔴 ÚLTIMO MOMENTO</span>
            <span className="md:hidden">🔴 AHORA</span>
          </div>

          {/* Content Container - Single line with forced overflow */}
          <div
            ref={containerRef}
            className="flex-1 overflow-hidden relative"
          >
            <Link
              to="/noticia/$slug"
              params={{ slug: currentNews.slug }}
              className="block hover:opacity-90 transition-opacity"
            >
              <div
                ref={contentRef}
                className={`
                  transition-opacity duration-500 whitespace-nowrap
                  ${isVisible ? 'opacity-100' : 'opacity-0'}
                  ${shouldScroll ? 'animate-scroll-left' : 'truncate'}
                `}
              >
                <span className="font-black uppercase text-sm md:text-base lg:text-lg tracking-wide">
                  {currentNews.title}
                </span>
                <span className="mx-2 md:mx-3 text-[#FFB22C] font-black">→</span>
                <span className="font-medium text-xs md:text-sm lg:text-base">
                  {currentNews.excerpt}
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Progress indicator (dots) - Bottom fixed section */}
        <div className="h-[28px] md:h-[24px] flex justify-center items-center pb-2">
          {news.length > 1 && (
            <div className="flex items-center gap-2">
              {news.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsVisible(false);
                    setTimeout(() => {
                      setCurrentIndex(index);
                      setIsVisible(true);
                    }, 500);
                  }}
                  className={`
                    rounded-full transition-all duration-300
                    ${index === currentIndex
                      ? 'bg-white w-6 h-2 md:w-8 md:h-2'
                      : 'bg-white/50 hover:bg-white/75 w-2 h-2'}
                  `}
                  aria-label={`Ver noticia ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CSS Animation Styles */}
      <style>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll-left {
          animation: scroll-left 20s linear infinite;
        }

        .animate-scroll-left:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
