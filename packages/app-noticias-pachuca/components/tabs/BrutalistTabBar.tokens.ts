/**
 * Design tokens for Brutalist Tab Bar
 *
 * Defines all visual constants for the custom tab bar following
 * the brutalist design system of Noticias Pachuca.
 */

export const BRUTALIST_TAB_BAR_TOKENS = {
  // Dimensions
  height: 92,
  touchTarget: 44,
  totalHeight: 72, // includes top border

  // Borders
  topBorder: {
    width: 4,
    color: '#000000',
  },
  divider: {
    width: 2,
    color: '#000000',
  },
  activeIndicator: {
    height: 4,
    color: '#FFB22C', // Yellow accent
  },

  // Colors
  background: '#FFFFFF',
  active: {
    icon: '#854836', // Primary brown
    text: '#854836', // Primary brown
    indicator: '#FFB22C', // Yellow accent
    background: '#F7F7F7', // Subtle gray background
  },
  inactive: {
    icon: '#000000', // Black
    text: '#000000', // Black
    opacity: 0.6, // 60% opacity for inactive state
  },
  press: {
    background: '#FFB22C', // Yellow flash on press
    icon: '#000000', // Black
    text: '#000000', // Black
  },

  // Icons
  iconSize: 24,

  // Typography
  label: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    lineHeight: 12,
  },

  // Spacing
  spacing: {
    iconToLabel: 4,
    horizontal: 8,
    vertical: 8,
  },
} as const;

/**
 * Icon mapping for each tab
 * Uses Ionicons with filled/outline variants for active/inactive states
 */
export const TAB_BAR_ICONS = {
  'home/index': {
    active: 'home' as const,
    inactive: 'home-outline' as const,
    label: 'INICIO',
  },
  'quick/index': {
    active: 'flash' as const,
    inactive: 'flash-outline' as const,
    label: 'LECTURA RÁPIDA',
  },
  'search/index': {
    active: 'search' as const,
    inactive: 'search-outline' as const,
    label: 'BÚSQUEDA',
  },
  'citizen/index': {
    active: 'create' as const,
    inactive: 'create-outline' as const,
    label: 'CIUDADANO',
  },
  'account/index': {
    active: 'person' as const,
    inactive: 'person-outline' as const,
    label: 'CUENTA',
  },
} as const;

/**
 * Type for valid tab routes
 */
export type TabRoute = keyof typeof TAB_BAR_ICONS;

/**
 * Type for icon configuration
 */
export type TabIconConfig = typeof TAB_BAR_ICONS[TabRoute];
