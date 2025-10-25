/**
 * Design Tokens for Quick Read Screen
 * Brutalist Design System 2026
 * @module QuickRead.tokens
 * @version 1.0.0
 */

/**
 * Color palette for Quick Read components
 * Follows brutalist design system from tailwind.config.js
 */
export const QUICK_READ_COLORS = {
  // Backgrounds
  cardBackground: '#FFFFFF',
  screenBackground: '#F7F7F7',

  // Borders (brutalist thick borders)
  borderColor: '#000000',

  // Text Colors
  titleColor: '#000000', // Pure black for headers
  authorColor: '#000000', // Black for author
  summaryColor: '#1F1F1F', // Near black for readability

  // Interactive States
  imagePressOverlay: 'rgba(0, 0, 0, 0.2)', // 20% black overlay on image press
  titlePressBackground: '#F7F7F7', // Light gray background on title press

  // Category Badge Colors (semantic mapping)
  category: {
    deportes: '#854836', // Brown
    politica: '#FFB22C', // Yellow
    economia: '#FF0000', // Red
    salud: '#000000', // Black
    seguridad: '#854836', // Brown
    estado: '#FFB22C', // Yellow
    todas: '#000000', // Black (fallback)
  },

  // Category Badge
  badgeBackground: '#854836', // Default brown
  badgeBorder: '#000000',
  badgeText: '#FFFFFF',
} as const;

/**
 * Spacing and dimension values
 * Based on brutalist design principles (4px increments, bold spacing)
 */
export const QUICK_READ_DIMENSIONS = {
  // Hero Image
  heroHeight: 280, // Fixed height for phone
  heroHeightTablet: 360, // Taller for tablet immersion
  heroBorderWidth: 4, // Thick brutalist border (bottom only)

  // Content Container
  contentPadding: 20, // Horizontal padding (phone)
  contentPaddingTablet: 32, // Horizontal padding (tablet)
  contentPaddingTop: 24, // Top padding (breathing room after image)
  contentPaddingBottom: 32, // Bottom padding (space for indicators)
  maxContentWidth: 600, // Max width on tablet (centered)

  // Element Gaps (vertical spacing)
  titleToAuthor: 16, // Space between title and author
  authorToSummary: 20, // Space between author and summary

  // Category Badge (overlaid on hero image)
  badgeBottom: 16, // Distance from bottom of image
  badgeLeft: 16, // Distance from left edge
  badgePadding: 8, // Vertical padding
  badgePaddingHorizontal: 16, // Horizontal padding
  badgeBorderWidth: 4, // Thick border

  // Swipe Indicators (pagination dots)
  indicatorsBottom: 24, // Distance from safe area bottom

  // Borders
  borderWidth: 4, // All brutalist borders are 4px

  // Summary Text
  summaryMaxLines: 5, // Max lines before ellipsis
  summaryFixedHeight: 128, // Fixed height (5 lines × 25.6px line height)

  // Tablet Responsive
  tabletBreakpoint: 768, // Width threshold for tablet layout
} as const;

/**
 * Typography specifications
 * References ThemedText variants from design system
 */
export const QUICK_READ_TYPOGRAPHY = {
  // Title (h3 variant)
  title: {
    variant: 'h3' as const,
    fontSize: { phone: 20, tablet: 24 },
    fontWeight: '700' as const,
    lineHeight: 1.4, // 28px on phone
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    color: '#000000',
    maxLines: 3,
  },

  // Author (caption variant)
  author: {
    variant: 'caption' as const,
    fontSize: { phone: 12, tablet: 14 },
    fontWeight: '700' as const,
    lineHeight: 1.4,
    letterSpacing: 1.0,
    textTransform: 'uppercase' as const,
    color: '#000000',
    prefix: 'POR ', // Always prefix with "POR "
  },

  // Summary (body variant)
  summary: {
    variant: 'body' as const,
    fontSize: { phone: 16, tablet: 18 },
    fontWeight: '400' as const,
    lineHeight: 1.6, // 25.6px on phone
    letterSpacing: 0,
    textTransform: 'none' as const,
    color: '#1F1F1F',
    maxLines: 5,
  },

  // Category Badge
  categoryBadge: {
    fontSize: { phone: 11, tablet: 12 },
    fontWeight: '900' as const,
    letterSpacing: 1.0,
    textTransform: 'uppercase' as const,
    color: '#FFFFFF',
  },
} as const;

/**
 * Animation configuration
 * Optimized for Reanimated v4 with native driver
 */
export const QUICK_READ_ANIMATION = {
  // Swipe Transition (cross-fade between cards)
  swipe: {
    duration: 300, // ms - Quick but elegant
    easing: 'cubic' as const, // Easing.out(Easing.cubic)
    useNativeDriver: true, // Opacity can use native driver
  },

  // Swipe Gesture Thresholds
  thresholds: {
    distance: 0.4, // 40% of screen width
    velocity: 800, // px/s - Fast swipe detection
  },

  // Press Feedback (image and title taps)
  press: {
    duration: 200, // ms - Standard press animation
    imageOpacity: 0.8, // 80% opacity when pressing image
    titleBackgroundColor: '#F7F7F7', // Gray background when pressing title
  },

  // Haptic Feedback
  haptics: {
    enabled: true,
    style: 'light' as const, // ImpactFeedbackStyle.Light
  },

  // Pagination Dots (inherited from PaginationDots component)
  pagination: {
    springConfig: {
      friction: 7,
      tension: 40,
    },
  },
} as const;

/**
 * Gesture handler configuration
 * For PanGestureHandler from react-native-gesture-handler v2
 */
export const QUICK_READ_GESTURE = {
  // Activation thresholds
  activeOffsetX: [-10, 10], // Require 10px horizontal movement to activate
  failOffsetY: [-5, 5], // Fail if vertical movement exceeds 5px

  // Gesture constraints
  minPointers: 1,
  maxPointers: 1, // Single finger only

  // Animation configuration
  animationConfig: {
    damping: 20,
    stiffness: 90,
    mass: 0.4,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
} as const;

/**
 * Accessibility configuration
 */
export const QUICK_READ_ACCESSIBILITY = {
  // Roles
  cardRole: 'article' as const,
  imageRole: 'imagebutton' as const,
  titleRole: 'header' as const,
  indicatorsRole: 'progressbar' as const,

  // Labels (templates with {variable} placeholders)
  labels: {
    screen: 'Quick Read - Artículos rápidos',
    card: 'Artículo {index} de {total}',
    image: 'Ver artículo completo: {title}',
    imageHint: 'Toca para abrir artículo',
    title: 'Leer artículo: {title}',
    titleHint: 'Toca para abrir artículo',
    category: 'Categoría: {category}',
    author: 'Por {author}',
    indicators: 'Artículo {current} de {total}',
    swipeHint: 'Desliza izquierda para siguiente, derecha para anterior',
  },

  // Dynamic type
  maxFontSizeMultiplier: 1.5, // Cap at 1.5x to prevent layout breaks
} as const;

/**
 * Z-index layering for card stack
 * Cards are absolutely positioned and overlapped
 */
export const QUICK_READ_ZINDEX = {
  currentCard: 100, // Active card on top
  adjacentCard: 99, // Previous/next card (during swipe)
  inactiveCard: 98, // All other cards below
} as const;

/**
 * Image optimization configuration
 */
export const QUICK_READ_IMAGE = {
  // Loading configuration
  preloadDistance: 1, // Preload images for cards ±1 from current
  unloadDistance: 2, // Unload images for cards >2 away from current

  // Image props
  resizeMode: 'cover' as const, // Fill and crop
  placeholderColor: '#F7F7F7', // Light gray while loading

  // Optimization
  cachePolicy: 'memory-disk' as const, // Cache in memory and disk
  priority: 'high' as const, // High priority for visible images

  // Fallback
  fallbackImage: 'https://via.placeholder.com/800x600/F7F7F7/000000?text=Imagen+no+disponible',
} as const;

/**
 * Category color mapping
 * Maps category IDs to brutalist colors
 */
export const CATEGORY_COLOR_MAP: Record<string, string> = {
  deportes: QUICK_READ_COLORS.category.deportes,
  politica: QUICK_READ_COLORS.category.politica,
  economia: QUICK_READ_COLORS.category.economia,
  salud: QUICK_READ_COLORS.category.salud,
  seguridad: QUICK_READ_COLORS.category.seguridad,
  estado: QUICK_READ_COLORS.category.estado,
  todas: QUICK_READ_COLORS.category.todas,
};

/**
 * Safe area offsets (for notch/home indicator)
 */
export const QUICK_READ_SAFE_AREA = {
  // Add to these values from useSafeAreaInsets()
  indicatorsBottomOffset: 24, // Extra space below indicators
} as const;

/**
 * Performance optimization flags
 */
export const QUICK_READ_PERFORMANCE = {
  // Rendering
  shouldRasterizeIOS: true, // Rasterize complex card layouts on iOS
  renderAheadDistance: 1, // Render cards ±1 from current

  // Animation
  targetFPS: 60, // Target frame rate
  enableNativeDriver: true, // Use native driver for animations

  // Memory
  maxCachedCards: 5, // Maximum number of cards to keep in memory
} as const;

/**
 * Development/debugging flags
 */
export const QUICK_READ_DEBUG = {
  showBoundingBoxes: false, // Show colored borders around components
  logGestureEvents: false, // Log pan gesture events to console
  logCardTransitions: false, // Log when cards change
  measurePerformance: false, // Measure and log animation performance
} as const;

/**
 * Export all tokens as a single object for convenience
 */
export const QUICK_READ_TOKENS = {
  colors: QUICK_READ_COLORS,
  dimensions: QUICK_READ_DIMENSIONS,
  typography: QUICK_READ_TYPOGRAPHY,
  animation: QUICK_READ_ANIMATION,
  gesture: QUICK_READ_GESTURE,
  accessibility: QUICK_READ_ACCESSIBILITY,
  zIndex: QUICK_READ_ZINDEX,
  image: QUICK_READ_IMAGE,
  categoryColors: CATEGORY_COLOR_MAP,
  safeArea: QUICK_READ_SAFE_AREA,
  performance: QUICK_READ_PERFORMANCE,
  debug: QUICK_READ_DEBUG,
} as const;

/**
 * Type exports for TypeScript
 */
export type QuickReadColors = typeof QUICK_READ_COLORS;
export type QuickReadDimensions = typeof QUICK_READ_DIMENSIONS;
export type QuickReadTypography = typeof QUICK_READ_TYPOGRAPHY;
export type QuickReadAnimation = typeof QUICK_READ_ANIMATION;
export type CategoryId = keyof typeof CATEGORY_COLOR_MAP;
