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
}

// Animation states for the news item lifecycle
type AnimationState = 'fade-in' | 'static' | 'scrolling' | 'wait-at-end' | 'fade-out';

// Animation timing constants (in milliseconds)
const ANIMATION_TIMING = {
  FADE_IN: 1000,
  STATIC_WAIT: 4000,
  SCROLL_DURATION: 3500, // 3.5 seconds for full scroll
  END_WAIT: 3000,
  FADE_OUT: 1000,
};

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
}: BreakingNewsBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animationState, setAnimationState] = useState<AnimationState>('fade-in');
  const [shouldScroll, setShouldScroll] = useState(false);
  const [scrollDistance, setScrollDistance] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Check if content overflows and calculate scroll distance
  useEffect(() => {
    if (contentRef.current && containerRef.current) {
      const contentWidth = contentRef.current.scrollWidth;
      const containerWidth = containerRef.current.clientWidth;
      const needsScroll = contentWidth > containerWidth;
      setShouldScroll(needsScroll);

      if (needsScroll) {
        // Calculate how much we need to scroll left (negative value)
        const distance = contentWidth - containerWidth;
        setScrollDistance(distance);
      } else {
        setScrollDistance(0);
      }
    }
  }, [currentIndex, news]);

  // Animation sequence controller
  useEffect(() => {
    if (news.length === 0) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // State machine for animation sequence
    switch (animationState) {
      case 'fade-in':
        // After fade in completes, move to static state
        timeoutRef.current = setTimeout(() => {
          setAnimationState('static');
        }, ANIMATION_TIMING.FADE_IN);
        break;

      case 'static':
        // After static wait, move to scrolling (or skip if no scroll needed)
        timeoutRef.current = setTimeout(() => {
          if (shouldScroll) {
            setAnimationState('scrolling');
          } else {
            // If no scroll needed, skip directly to wait-at-end
            setAnimationState('wait-at-end');
          }
        }, ANIMATION_TIMING.STATIC_WAIT);
        break;

      case 'scrolling':
        // After scrolling completes, wait at end
        timeoutRef.current = setTimeout(() => {
          setAnimationState('wait-at-end');
        }, ANIMATION_TIMING.SCROLL_DURATION);
        break;

      case 'wait-at-end':
        // After waiting at end, fade out
        timeoutRef.current = setTimeout(() => {
          setAnimationState('fade-out');
        }, ANIMATION_TIMING.END_WAIT);
        break;

      case 'fade-out':
        // After fade out, move to next item and start over
        timeoutRef.current = setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % news.length);
          setAnimationState('fade-in');
        }, ANIMATION_TIMING.FADE_OUT);
        break;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [animationState, shouldScroll, news.length]);

  // Reset animation when user manually changes index
  const handleManualIndexChange = (index: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setAnimationState('fade-out');
    setTimeout(() => {
      setCurrentIndex(index);
      setAnimationState('fade-in');
    }, ANIMATION_TIMING.FADE_OUT);
  };

  if (!news || news.length === 0) return null;

  const currentNews = news[currentIndex];

  // Determine CSS classes based on animation state
  const getAnimationClasses = () => {
    const baseClasses = 'whitespace-nowrap transition-opacity';

    switch (animationState) {
      case 'fade-in':
        return `${baseClasses} opacity-0 animate-fade-in`;
      case 'static':
        return `${baseClasses} opacity-100`;
      case 'scrolling':
        return `${baseClasses} opacity-100 animate-scroll-left`;
      case 'wait-at-end':
        return `${baseClasses} opacity-100 animate-scroll-left-paused`;
      case 'fade-out':
        return `${baseClasses} opacity-100 animate-fade-out`;
      default:
        return baseClasses;
    }
  };

  return (
    <div className="bg-[#FF0000] text-white border-b-4 border-black relative overflow-hidden py-3 md:py-4">
      {/* Decorative elements */}
      <div className="absolute left-0 top-0 w-8 h-8 bg-black transform rotate-45 -translate-x-4 -translate-y-4"></div>
      <div className="absolute right-0 bottom-0 w-6 h-6 bg-[#FFB22C] transform rotate-45 translate-x-3 translate-y-3"></div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Main Content - Badge arriba, contenido abajo */}
        <div className="flex flex-col gap-2 md:gap-3">
          {/* Badge - ÚLTIMO MOMENTO */}
          <div className="flex justify-center md:justify-start">
            <div className="bg-white text-[#FF0000] px-3 md:px-4 py-1 font-black uppercase text-xs md:text-sm border-2 border-black relative animate-pulse whitespace-nowrap">
              <span className="hidden md:inline">🔴 ÚLTIMO MOMENTO</span>
              <span className="md:hidden">🔴 ÚLTIMO MOMENTO</span>
            </div>
          </div>

          {/* Content Container - Single line with forced overflow */}
          <div
            ref={containerRef}
            className="overflow-hidden relative"
          >
            <Link
              to="/noticia/$slug"
              params={{ slug: currentNews.slug }}
              className="block hover:opacity-90 transition-opacity"
            >
              <div
                ref={contentRef}
                className={getAnimationClasses()}
                style={{
                  '--scroll-distance': `-${scrollDistance}px`,
                } as React.CSSProperties}
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

        {/* Progress indicator (dots) */}
        {news.length > 1 && (
          <div className="flex justify-center items-center mt-3 md:mt-4">
            <div className="flex items-center gap-2">
              {news.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleManualIndexChange(index)}
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
          </div>
        )}
      </div>

      {/* CSS Animation Styles */}
      <style>{`
        /* Fade in animation - 1 second */
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in ${ANIMATION_TIMING.FADE_IN}ms ease-in forwards;
        }

        /* Fade out animation - 1 second */
        @keyframes fade-out {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        .animate-fade-out {
          animation: fade-out ${ANIMATION_TIMING.FADE_OUT}ms ease-out forwards;
        }

        /* Scroll left animation - 9 seconds, runs once */
        @keyframes scroll-left {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(var(--scroll-distance, 0));
          }
        }

        .animate-scroll-left {
          animation: scroll-left ${ANIMATION_TIMING.SCROLL_DURATION}ms linear forwards;
        }

        /* Paused at end position - maintains the final scroll position */
        .animate-scroll-left-paused {
          transform: translateX(var(--scroll-distance, 0));
        }

        /* Pause animation on hover for better UX */
        .animate-scroll-left:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
