/**
 * NOTICIAS PACHUCA - DESIGN TOKENS
 * Sistema de tokens de diseño para implementación con Tailwind CSS 4
 *
 * Basado en filosofía brutalist adaptada para web de noticias
 */

// ==================== COLORES ====================

export const colors = {
  // Colores principales del sistema
  background: '#F7F7F7',    // Fondo general de la aplicación
  accent: '#FFB22C',        // Color de acento para highlights y CTAs
  primary: '#854836',       // Color primario para títulos y navegación
  text: '#000000',          // Color de texto principal (máximo contraste)
  white: '#FFFFFF',         // Blanco puro para cards y contenido
  red: '#FF0000',           // Rojo para breaking news y alertas urgentes

  // Extensiones para casos específicos
  gray: {
    50: '#FAFAFA',
    100: '#F7F7F7',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
} as const;

// ==================== TIPOGRAFÍA ====================

export const typography = {
  // Escalas de tamaño adaptadas para web
  scale: {
    // Headlines - Para títulos principales y destacados
    'headline-1': {
      fontSize: '4rem',      // 64px - Títulos principales homepage
      lineHeight: '1',
      fontWeight: '900',
      letterSpacing: '0.05em',
      textTransform: 'uppercase' as const,
    },
    'headline-2': {
      fontSize: '2.5rem',    // 40px - Títulos de sección
      lineHeight: '1.1',
      fontWeight: '700',
      letterSpacing: '0.025em',
      textTransform: 'uppercase' as const,
    },
    'headline-3': {
      fontSize: '1.875rem',  // 30px - Títulos de artículo
      lineHeight: '1.2',
      fontWeight: '700',
      letterSpacing: '0.025em',
      textTransform: 'uppercase' as const,
    },
    'headline-4': {
      fontSize: '1.5rem',    // 24px - Subtítulos
      lineHeight: '1.3',
      fontWeight: '700',
      letterSpacing: '0.025em',
      textTransform: 'uppercase' as const,
    },

    // Body Text - Para contenido de artículos
    'body-large': {
      fontSize: '1.125rem',  // 18px - Texto principal de artículos
      lineHeight: '1.6',
      fontWeight: '400',
    },
    'body-medium': {
      fontSize: '1rem',      // 16px - Texto secundario
      lineHeight: '1.5',
      fontWeight: '400',
    },
    'body-small': {
      fontSize: '0.875rem',  // 14px - Texto de soporte
      lineHeight: '1.4',
      fontWeight: '400',
    },

    // Labels y Metadata
    'label-large': {
      fontSize: '0.875rem',  // 14px - Labels grandes
      lineHeight: '1.2',
      fontWeight: '700',
      letterSpacing: '0.05em',
      textTransform: 'uppercase' as const,
    },
    'label-medium': {
      fontSize: '0.75rem',   // 12px - Labels medianos
      lineHeight: '1.2',
      fontWeight: '700',
      letterSpacing: '0.05em',
      textTransform: 'uppercase' as const,
    },
    'label-small': {
      fontSize: '0.625rem',  // 10px - Labels pequeños
      lineHeight: '1.2',
      fontWeight: '700',
      letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
    },

    // Metadata y timestamps
    'caption': {
      fontSize: '0.75rem',   // 12px - Metadata, fechas, autor
      lineHeight: '1.3',
      fontWeight: '400',
    },
  },

  // Familias de fuentes
  families: {
    primary: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Consolas', 'monospace'],
  },
} as const;

// ==================== ESPACIADO ====================

export const spacing = {
  // Sistema base de 8px para consistencia
  base: 8,

  // Escalas predefinidas
  scale: {
    '0': '0',
    '1': '0.25rem',   // 4px
    '2': '0.5rem',    // 8px
    '3': '0.75rem',   // 12px
    '4': '1rem',      // 16px
    '5': '1.25rem',   // 20px
    '6': '1.5rem',    // 24px
    '8': '2rem',      // 32px
    '10': '2.5rem',   // 40px
    '12': '3rem',     // 48px
    '16': '4rem',     // 64px
    '20': '5rem',     // 80px
    '24': '6rem',     // 96px
    '32': '8rem',     // 128px
  },

  // Espaciados específicos para contenido de noticias
  content: {
    'article-padding': '2rem',      // Padding interno de artículos
    'card-padding': '1.5rem',       // Padding de cards
    'section-margin': '4rem',       // Margen entre secciones
    'paragraph-margin': '1rem',     // Margen entre párrafos
  },
} as const;

// ==================== SHADOWS Y EFECTOS ====================

export const effects = {
  // Shadows brutalist - duros y geométricos
  shadows: {
    'brutalist-sm': '2px 2px 0 0 #000000',
    'brutalist-md': '4px 4px 0 0 #000000',
    'brutalist-lg': '8px 8px 0 0 #000000',
    'brutalist-xl': '12px 12px 0 0 #000000',
  },

  // Borders consistentes
  borders: {
    thin: '1px solid #000000',
    medium: '2px solid #000000',
    thick: '4px solid #000000',
    accent: '2px solid #FFB22C',
    danger: '2px solid #FF0000',
  },

  // Transiciones para interactividad
  transitions: {
    fast: '150ms ease-in-out',
    medium: '250ms ease-in-out',
    slow: '500ms ease-in-out',
  },
} as const;

// ==================== LAYOUT Y GRID ====================

export const layout = {
  // Breakpoints responsivos
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Containers máximos
  containers: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1400px',
    full: '100%',
  },

  // Grid system específico para noticias
  grid: {
    // Homepage layout
    homepage: {
      featured: 'col-span-8',      // Artículo principal
      sidebar: 'col-span-4',       // Sidebar con destacados
      secondary: 'col-span-4',     // Artículos secundarios
    },

    // Article detail layout
    article: {
      content: 'col-span-8',       // Contenido principal
      aside: 'col-span-4',         // Sidebar con relacionados
    },

    // Card grids
    cards: {
      featured: 'grid-cols-1',
      standard: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      compact: 'grid-cols-1',
    },
  },
} as const;

// ==================== COMPONENTES ESPECÍFICOS ====================

export const components = {
  // Article Cards
  articleCard: {
    featured: {
      imageHeight: '12rem',        // 192px
      padding: '2rem',
      borderWidth: '4px',
    },
    standard: {
      imageHeight: '8rem',         // 128px
      padding: '1rem',
      borderWidth: '2px',
    },
    compact: {
      imageHeight: '4rem',         // 64px
      padding: '1rem',
      borderWidth: '2px',
    },
  },

  // Buttons
  button: {
    primary: {
      background: '#000000',
      color: '#FFFFFF',
      borderWidth: '2px',
      borderColor: '#000000',
      padding: '0.75rem 1.5rem',
    },
    secondary: {
      background: '#FFFFFF',
      color: '#000000',
      borderWidth: '2px',
      borderColor: '#000000',
      padding: '0.75rem 1.5rem',
    },
    accent: {
      background: '#FFB22C',
      color: '#000000',
      borderWidth: '2px',
      borderColor: '#000000',
      padding: '0.75rem 1.5rem',
    },
    danger: {
      background: '#FF0000',
      color: '#FFFFFF',
      borderWidth: '2px',
      borderColor: '#000000',
      padding: '0.75rem 1.5rem',
    },
  },

  // Navigation
  navigation: {
    header: {
      height: '4rem',              // 64px
      padding: '1rem',
      background: '#000000',
      color: '#FFFFFF',
    },
    categoryNav: {
      height: '3rem',              // 48px
      padding: '0.5rem',
      background: '#F7F7F7',
      borderWidth: '2px',
    },
  },

  // Forms
  form: {
    input: {
      height: '3rem',              // 48px
      padding: '0.75rem 1rem',
      borderWidth: '2px',
      borderColor: '#000000',
      background: '#FFFFFF',
    },
    select: {
      height: '3rem',
      padding: '0.75rem 1rem',
      borderWidth: '2px',
      borderColor: '#000000',
      background: '#FFFFFF',
    },
  },
} as const;

// ==================== UTILIDADES PARA TAILWIND ====================

// Configuración recomendada para tailwind.config.js
export const tailwindConfig = {
  theme: {
    extend: {
      colors: {
        'news-background': colors.background,
        'news-accent': colors.accent,
        'news-primary': colors.primary,
        'news-text': colors.text,
        'news-white': colors.white,
        'news-red': colors.red,
      },
      fontFamily: {
        'primary': typography.families.primary,
        'mono': typography.families.mono,
      },
      spacing: spacing.scale,
      boxShadow: effects.shadows,
      borderWidth: {
        '3': '3px',
        '5': '5px',
        '6': '6px',
      },
      letterSpacing: {
        'wider': '0.05em',
        'widest': '0.1em',
      },
      screens: layout.breakpoints,
    },
  },
} as const;

// ==================== CLASES UTILITARIAS PERSONALIZADAS ====================

export const customClasses = {
  // Typography utilities
  'headline-1': 'text-6xl font-black uppercase tracking-wider leading-none',
  'headline-2': 'text-4xl font-bold uppercase tracking-wide leading-tight',
  'headline-3': 'text-2xl font-bold uppercase tracking-wide leading-tight',
  'headline-4': 'text-xl font-bold uppercase tracking-wide leading-snug',

  'body-large': 'text-lg leading-relaxed',
  'body-medium': 'text-base leading-relaxed',
  'body-small': 'text-sm leading-relaxed',

  'label-large': 'text-sm font-bold uppercase tracking-wider',
  'label-medium': 'text-xs font-bold uppercase tracking-wider',
  'label-small': 'text-xs font-bold uppercase tracking-widest',

  'caption': 'text-xs leading-relaxed',

  // Layout utilities
  'news-container': 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  'news-section': 'mb-16',
  'news-card': 'bg-white border-2 border-black',
  'news-grid': 'grid gap-6',

  // Button utilities
  'btn-primary': 'bg-black text-white px-6 py-3 font-bold uppercase tracking-wide border-2 border-black hover:bg-news-primary transition-colors',
  'btn-secondary': 'bg-white text-black px-6 py-3 font-bold uppercase tracking-wide border-2 border-black hover:bg-news-background transition-colors',
  'btn-accent': 'bg-news-accent text-black px-6 py-3 font-bold uppercase tracking-wide border-2 border-black hover:opacity-90 transition-opacity',
  'btn-danger': 'bg-news-red text-white px-6 py-3 font-bold uppercase tracking-wide border-2 border-black transition-colors',

  // Special effects
  'brutalist-shadow': 'shadow-[4px_4px_0_0_#000000]',
  'brutalist-border': 'border-2 border-black',
  'brutalist-form': 'px-4 py-3 border-2 border-black font-bold uppercase text-sm tracking-wide',
} as const;

export default {
  colors,
  typography,
  spacing,
  effects,
  layout,
  components,
  tailwindConfig,
  customClasses,
};