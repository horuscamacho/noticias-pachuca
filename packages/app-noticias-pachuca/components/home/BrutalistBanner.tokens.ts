/**
 * Design tokens for Brutalist Banner component
 *
 * Defines all visual constants for promotional banners
 * following the brutalist design system.
 */

export const BRUTALIST_BANNER_TOKENS = {
  // Colors
  background: {
    default: '#854836', // Brown
    brown: '#854836',
    yellow: '#FFB22C',
    black: '#000000',
  },

  // Text colors
  text: {
    onBrown: '#FFFFFF', // White text on brown
    onYellow: '#000000', // Black text on yellow
    onBlack: '#FFFFFF', // White text on black
  },

  // Borders
  border: {
    width: 4,
    color: '#000000', // Black borders
  },

  // CTA Button
  ctaButton: {
    background: '#FFB22C', // Yellow
    textColor: '#000000', // Black
    borderColor: '#000000',
    borderWidth: 4,
    pressedBackground: '#000000', // Black on press
    pressedTextColor: '#FFFFFF', // White text on press
  },

  // Spacing
  spacing: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    titleToButton: 12,
  },

  // Typography
  title: {
    fontSize: { phone: 14, tablet: 16 },
    fontWeight: '700' as const,
    lineHeight: 1.3,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },

  ctaButtonText: {
    fontSize: { phone: 14, tablet: 16 },
    fontWeight: '700' as const,
    lineHeight: 1.2,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },

  // Dimensions
  minHeight: 120,
  ctaButtonMinHeight: 44, // iOS minimum touch target
  ctaButtonPaddingVertical: 12,
  ctaButtonPaddingHorizontal: 24,
} as const;

/**
 * Background color variants for banner
 */
export type BannerBackgroundColor = keyof typeof BRUTALIST_BANNER_TOKENS.background;
