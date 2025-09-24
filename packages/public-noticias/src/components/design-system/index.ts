/**
 * NOTICIAS PACHUCA - DESIGN SYSTEM EXPORTS
 *
 * Punto único de exportación para todos los componentes
 * y utilities del design system brutalist
 */

import React from 'react';

// ==================== CORE DESIGN SYSTEM ====================

// Showroom principal para visualización
export { default as Showroom } from './Showroom';

// Design tokens y configuración
export * from './DesignTokens';

// ==================== COMPONENTES DE NOTICIAS ====================

// Componentes específicos para artículos
export {
  FeaturedArticleCard,
  StandardArticleCard,
  CompactArticleCard,
  ArticleList,
  BreakingNewsBanner,
  CategoryNavigation,
  SiteHeader,
  SiteFooter,
  HomepageLayout,
  default as NewsComponents,
} from './NewsComponents';

// ==================== TIPOS ====================

export interface Article {
  id: string;
  title: string;
  summary?: string;
  category: string;
  author: string;
  publishDate: string;
  readTime?: string;
  imageUrl?: string;
  isBreaking?: boolean;
  isFeatured?: boolean;
  tags?: string[];
}

export interface DesignSystemTheme {
  colors: typeof import('./DesignTokens').colors;
  typography: typeof import('./DesignTokens').typography;
  spacing: typeof import('./DesignTokens').spacing;
  effects: typeof import('./DesignTokens').effects;
  layout: typeof import('./DesignTokens').layout;
  components: typeof import('./DesignTokens').components;
}

// ==================== CONSTANTS ====================

// Colores principales para fácil acceso
export const COLORS = {
  BACKGROUND: '#F7F7F7',
  ACCENT: '#FFB22C',
  PRIMARY: '#854836',
  TEXT: '#000000',
  WHITE: '#FFFFFF',
  RED: '#FF0000',
} as const;

// Breakpoints responsivos
export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px',
} as const;

// Categorías de noticias disponibles
export const NEWS_CATEGORIES = [
  'POLÍTICA',
  'DEPORTES',
  'ECONOMÍA',
  'CULTURA',
  'TECNOLOGÍA',
  'INTERNACIONAL',
  'LOCAL',
  'SALUD',
  'EDUCACIÓN',
  'SEGURIDAD',
] as const;

export type NewsCategory = typeof NEWS_CATEGORIES[number];

// ==================== UTILITIES ====================

/**
 * Utility para generar clases CSS consistentes
 */
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Utility para formatear fechas en el estilo del sistema
 */
export const formatNewsDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).toUpperCase().replace(',', ' |');
};

/**
 * Utility para calcular tiempo de lectura
 */
export const calculateReadTime = (content: string): string => {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return minutes.toString();
};

/**
 * Utility para truncar texto preservando palabras
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;

  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  return lastSpace > 0 ? truncated.slice(0, lastSpace) + '...' : truncated + '...';
};

/**
 * Utility para generar slugs de URL
 */
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
    .trim()
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/-+/g, '-'); // Remover guiones múltiples
};

// ==================== HOOKS PERSONALIZADOS ====================

/**
 * Hook para manejar responsive design
 */
export const useBreakpoint = (breakpoint: keyof typeof BREAKPOINTS): boolean => {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia(`(min-width: ${BREAKPOINTS[breakpoint]})`);

    const updateMatches = () => setMatches(media.matches);
    updateMatches();

    media.addEventListener('change', updateMatches);
    return () => media.removeEventListener('change', updateMatches);
  }, [breakpoint]);

  return matches;
};

/**
 * Hook para manejar el estado de carga de artículos
 */
export const useArticles = (category?: NewsCategory) => {
  const [articles, setArticles] = React.useState<Article[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Aquí iría la lógica para cargar artículos
    // Por ahora solo simulamos el estado
    setLoading(false);
  }, [category]);

  return { articles, loading, error };
};

// ==================== CONFIGURATION ====================

/**
 * Configuración base del design system
 */
export const DESIGN_SYSTEM_CONFIG = {
  name: 'Noticias Pachuca Design System',
  version: '1.0.0',
  theme: 'brutalist',
  prefix: 'news-',

  // Configuración de tipografía
  typography: {
    primaryFont: ['Inter', 'system-ui', 'sans-serif'],
    monoFont: ['JetBrains Mono', 'Consolas', 'monospace'],
    baseFontSize: '16px',
    baseLineHeight: 1.5,
  },

  // Configuración de espaciado
  spacing: {
    base: 8, // Base de 8px para el sistema
    scale: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128],
  },

  // Configuración de animaciones
  animations: {
    fast: '150ms ease-in-out',
    medium: '250ms ease-in-out',
    slow: '500ms ease-in-out',
  },

  // Configuración de contenido
  content: {
    maxWidth: '1400px',
    readingWidth: '65ch',
    sidebarWidth: '320px',
  },
} as const;

// Default export with all utilities
const DesignSystemExports = {
  COLORS,
  BREAKPOINTS,
  NEWS_CATEGORIES,
  DESIGN_SYSTEM_CONFIG,
  cn,
  formatNewsDate,
  calculateReadTime,
  truncateText,
  generateSlug,
  useBreakpoint,
  useArticles,
};

export default DesignSystemExports;