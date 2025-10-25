/**
 * Design tokens for Brutalist Tab Navigation System
 * Based on BRUTALIST_TAB_SELECTOR_DESIGN.md specification
 * @module BrutalistTabs.tokens
 * @version 1.0.0
 */

/**
 * Color palette for tab navigation
 */
export const COLORS = {
  // Background Colors
  containerBackground: '#FFFFFF',
  tabInactiveBackground: 'transparent',
  tabActiveBackground: 'transparent',

  // Text Colors
  textInactive: '#000000',
  textActive: '#854836', // Primary Brown

  // Border & Indicator Colors
  borderColor: '#000000',
  indicatorActive: '#FFB22C', // Yellow accent

  // State Overlays
  pressedOverlay: 'rgba(255, 178, 44, 0.3)', // Yellow flash at 30% opacity
} as const;

/**
 * Spacing and dimension values
 */
export const DIMENSIONS = {
  // Container
  containerHeight: 56, // Total height including borders
  borderTopWidth: 3,
  borderBottomWidth: 3,

  // Individual Tab (Dynamic widths)
  tabHeight: 50, // 56 - 6px borders = 50px content area
  tabPaddingHorizontal: 20, // Horizontal padding for dynamic width calculation
  tabPaddingVertical: 12,

  // First/Last Tab Margins
  firstTabMarginLeft: 16,
  lastTabMarginRight: 16,

  // Indicator
  indicatorHeight: 4,
  indicatorBottom: 0, // Sits at bottom of tab area
  indicatorBorderRadius: 0, // Sharp corners for brutalism

  // Touch Target (iOS Accessibility)
  minTouchTarget: 44, // Met with 50px height
} as const;

/**
 * Typography settings
 */
export const TYPOGRAPHY = {
  fontSize: 13,
  fontWeight: '700' as const, // Bold
  letterSpacing: 0.8, // Wider spacing for brutalist feel
  lineHeight: 16,
} as const;

/**
 * Animation configuration
 */
export const ANIMATION = {
  // Indicator Slide
  indicatorDuration: 250, // ms - Quick but visible

  // Press Feedback
  pressScaleDuration: 100,
  pressScale: 0.96, // Subtle shrink on press

  // Color Transitions
  colorTransitionDuration: 150,
} as const;

/**
 * Opacity values for different states
 */
export const OPACITY = {
  inactive: 0.6, // 60% opacity for inactive text
  active: 1.0, // Full opacity for active text
  pressed: 0.3, // Background flash opacity
  disabled: 0.3, // Disabled state (future use)
} as const;

/**
 * Scroll configuration
 */
export const SCROLL = {
  decelerationRate: 'fast' as const, // Snappier feel
  showsHorizontalScrollIndicator: false, // Clean look
  scrollEventThrottle: 16, // 60fps
} as const;

/**
 * Test background colors for content areas
 * Used for visual testing of swipeable content
 */
export const TEST_CONTENT_COLORS = {
  TODAS: '#FFB22C', // Yellow
  DEPORTES: '#854836', // Brown
  POLÍTICA: '#000000', // Black
  ECONOMÍA: '#F7F7F7', // Gray
  SALUD: '#FFFFFF', // White
  SEGURIDAD: '#FFB22C', // Yellow
  ESTADO: '#854836', // Brown
} as const;

/**
 * Predefined news categories
 */
export const NEWS_CATEGORIES = [
  {
    id: 'todas',
    label: 'TODAS',
    slug: 'todas',
    voiceLabel: 'All News',
  },
  {
    id: 'deportes',
    label: 'DEPORTES',
    slug: 'sports',
    voiceLabel: 'Sports',
  },
  {
    id: 'politica',
    label: 'POLÍTICA',
    slug: 'politics',
    voiceLabel: 'Politics',
  },
  {
    id: 'economia',
    label: 'ECONOMÍA',
    slug: 'economy',
    voiceLabel: 'Economy',
  },
  {
    id: 'salud',
    label: 'SALUD',
    slug: 'health',
    voiceLabel: 'Health',
  },
  {
    id: 'seguridad',
    label: 'SEGURIDAD',
    slug: 'security',
    voiceLabel: 'Security',
  },
  {
    id: 'estado',
    label: 'ESTADO',
    slug: 'state',
    voiceLabel: 'State',
  },
] as const;
