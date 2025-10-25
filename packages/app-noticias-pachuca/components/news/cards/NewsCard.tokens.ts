/**
 * Design tokens for Brutalist News Cards
 * Based on specification: BRUTALIST_NEWS_CARDS_DESIGN_SYSTEM.md
 */

/**
 * Color palette for news cards
 */
export const COLORS = {
  // Primary Colors
  primaryBrown: '#854836',
  accentYellow: '#FFB22C',
  black: '#000000',
  white: '#FFFFFF',
  grayBackground: '#F7F7F7',

  // Semantic Colors
  textPrimary: '#000000',
  textSecondary: '#4A4A4A',
  textInverse: '#FFFFFF',

  // Interactive States
  pressedYellow: '#FFB22C',
  pressedBrown: '#6A3829',
  pressedGray: '#F7F7F7',

  // Borders
  borderPrimary: '#000000',
} as const;

/**
 * Typography scale for news cards
 * Maps to ThemedText variants where possible
 */
export const TYPOGRAPHY = {
  // Card Title
  cardTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },

  // Card Title - Vertical (larger)
  cardTitleVertical: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },

  // Card Title - Text Only (largest)
  cardTitleTextOnly: {
    fontSize: 19,
    lineHeight: 26,
    fontWeight: '800' as const,
    letterSpacing: -0.3,
  },

  // Card Subtitle/Description
  cardSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: -0.1,
  },

  // Card Subtitle - Text Only (larger)
  cardSubtitleTextOnly: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400' as const,
    letterSpacing: -0.1,
  },

  // Category Badge
  categoryLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },

  // Category Badge - Large
  categoryLabelLarge: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },

  // Author Info
  authorText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },

  // Related Article Titles
  relatedTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as const,
    letterSpacing: -0.1,
  },

  // Related Article Titles - Text Only (larger)
  relatedTitleTextOnly: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '500' as const,
    letterSpacing: -0.1,
  },

  // Related Category
  relatedCategory: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700' as const,
    letterSpacing: 0.4,
  },
} as const;

/**
 * Spacing system (px values)
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

/**
 * Border system
 */
export const BORDERS = {
  thin: 2,
  medium: 3,
  thick: 4,
  radius: 0, // Brutalist = no border radius
} as const;

/**
 * Dimensions for various card elements
 */
export const DIMENSIONS = {
  // Touch Targets (Minimum 44x44 per iOS HIG)
  minTouchTarget: 44,

  // Image Aspect Ratios
  horizontalImageRatio: 4 / 3,
  verticalImageRatio: 16 / 9,

  // Card Heights (Approximate)
  horizontalCardHeight: 240,
  verticalCardHeight: 420,
  textOnlyCardHeight: 200,

  // Bullet points
  bulletSmall: 6,
  bulletLarge: 8,
} as const;

/**
 * Layout proportions for horizontal card
 */
export const LAYOUT = {
  horizontalContent: 0.65,
  horizontalImage: 0.35,
} as const;
